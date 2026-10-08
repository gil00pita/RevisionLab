import { randomUUID } from "node:crypto";
import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import { builtInPersonaSuggestions } from "../persona-template-suggestions.js";
import {
  personaConfidenceLevels,
  personaFieldTypes,
  personaResearchStatuses,
  personaTypes,
  standardPersonaFields,
  standardPersonaSections,
  type PersonaProfile,
  type PersonaSavedTemplate,
} from "../persona-profile.js";
import { requireRole } from "./authentication.js";
import { write } from "./database.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor } from "./types.js";
import type { ResolvedConfig } from "./config.js";
import { readReviewEvidence } from "./feedback-review/evidence.js";
import { discardArtifact, insertArtifact, prepareCommentAttachment } from "./artifacts.js";

const uuid = z.string().uuid();
const label = z.string().trim().min(1).max(120);
const confidence = z.enum(personaConfidenceLevels);
const fieldValidationSchema = z.object({
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  maxLength: z.number().int().min(1).max(5000).optional(),
  defaultValue: z.union([z.string().max(5000), z.number().finite(), z.boolean(), z.array(z.string().max(500)).max(50)]).optional(),
});
const fieldSchema = z.object({
  name: label,
  description: z.string().trim().max(500).optional(),
  type: z.enum(personaFieldTypes),
  sectionId: z.string().min(1),
  shared: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  placeholder: z.string().max(200).default(""),
  required: z.boolean().default(false),
  hidden: z.boolean().default(false),
  position: z.number().int().min(0).max(10000).default(0),
  validation: fieldValidationSchema.default({}),
});
const valueSchema = z.object({
  fieldId: z.string().min(1),
  value: z.union([z.string().max(5000), z.number().finite(), z.boolean(), z.array(z.string().max(500)).max(50)]),
  position: z.number().int().min(0).max(10000).default(0),
});
const evidenceSchema = z.object({
  title: label,
  type: z.string().trim().min(1).max(80),
  sourceReference: z.string().trim().max(500).default(""),
  url: z.union([z.url().refine((value) => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL."), z.string().regex(/^artifact:[a-f0-9-]{36}$/), z.literal("")]).default(""),
  date: z.iso.date().nullable().default(null),
  confidence: confidence.default("Not Assessed"),
  notes: z.string().max(2000).default(""),
  feedbackId: z.string().max(200).nullable().default(null),
  valueIds: z.array(uuid).max(100).default([]),
});

async function ensurePersona(transaction: Transaction, personaId: string) {
  const result = await transaction.execute({
    sql: "SELECT id FROM personas WHERE id = ? AND archived_at IS NULL",
    args: [personaId],
  });
  if (!result.rows.length) throw new HttpError(404, "Persona not found or archived.");
}

async function recordActivity(transaction: Transaction, personaId: string, actor: RevisionLabActor, action: string, now: string) {
  await transaction.execute({
    sql: "INSERT INTO persona_activity (id, persona_id, actor_id, actor_name, action, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [randomUUID(), personaId, actor.id, actor.name, action, now],
  });
  await transaction.execute({
    sql: "UPDATE personas SET updated_at = ?, updated_by = ? WHERE id = ?",
    args: [now, actor.id, personaId],
  });
}

export async function readPersonaProfile(client: Client, personaId: string): Promise<PersonaProfile> {
  const persona = await client.execute({ sql: "SELECT id FROM personas WHERE id = ?", args: [personaId] });
  if (!persona.rows.length) throw new HttpError(404, "Persona not found.");
  const [sections, fields, values, evidence, links, activity] = await Promise.all([
    client.execute({ sql: "SELECT * FROM persona_sections WHERE persona_id IS NULL OR persona_id = ? ORDER BY position, name", args: [personaId] }),
    client.execute({ sql: "SELECT * FROM persona_fields WHERE persona_id IS NULL OR persona_id = ? ORDER BY position, name", args: [personaId] }),
    client.execute({ sql: "SELECT * FROM persona_values WHERE persona_id = ? AND deleted_at IS NULL ORDER BY position, created_at", args: [personaId] }),
    client.execute({ sql: "SELECT * FROM persona_evidence WHERE persona_id = ? ORDER BY created_at DESC", args: [personaId] }),
    client.execute({ sql: "SELECT l.* FROM persona_evidence_links l JOIN persona_evidence e ON e.id = l.evidence_id WHERE e.persona_id = ?", args: [personaId] }),
    client.execute({ sql: "SELECT * FROM persona_activity WHERE persona_id = ? ORDER BY created_at DESC LIMIT 100", args: [personaId] }),
  ]);
  return {
    sections: sections.rows.map((row) => ({ id: String(row.id), personaId: row.persona_id == null ? null : String(row.persona_id), name: String(row.name), description: String(row.description), position: Number(row.position), hidden: Boolean(row.hidden) })),
    fields: fields.rows.map((row) => ({ id: String(row.id), sectionId: String(row.section_id), personaId: row.persona_id == null ? null : String(row.persona_id), name: String(row.name), description: String(row.description), type: String(row.type) as PersonaProfile["fields"][number]["type"], options: JSON.parse(String(row.options_json)), placeholder: String(row.placeholder), required: Boolean(row.required), hidden: Boolean(row.hidden), position: Number(row.position), validation: JSON.parse(String(row.validation_json)) })),
    values: values.rows.map((row) => ({ id: String(row.id), personaId: String(row.persona_id), fieldId: String(row.field_id), value: JSON.parse(String(row.value_json)), position: Number(row.position), illustrative: Boolean(row.illustrative), createdAt: String(row.created_at), updatedAt: String(row.updated_at) })),
    evidence: evidence.rows.map((row) => ({ id: String(row.id), personaId: String(row.persona_id), title: String(row.title), type: String(row.type), sourceReference: String(row.source_reference), url: String(row.url), date: row.evidence_date == null ? null : String(row.evidence_date), confidence: String(row.confidence) as PersonaProfile["evidence"][number]["confidence"], notes: String(row.notes), feedbackId: row.feedback_id == null ? null : String(row.feedback_id), valueIds: links.rows.filter((link) => link.evidence_id === row.id).map((link) => String(link.value_id)), createdAt: String(row.created_at) })),
    activity: activity.rows.map((row) => ({ id: String(row.id), personaId: String(row.persona_id), actorName: String(row.actor_name), action: String(row.action), createdAt: String(row.created_at) })),
  };
}

async function availableField(transaction: Transaction, personaId: string, fieldId: string) {
  const result = await transaction.execute({ sql: "SELECT * FROM persona_fields WHERE id = ? AND (persona_id IS NULL OR persona_id = ?)", args: [fieldId, personaId] });
  if (!result.rows[0]) throw new HttpError(404, "Field not found.");
  return result.rows[0];
}

function validateValue(type: string, value: unknown, options: string[], validation: z.infer<typeof fieldValidationSchema> = {}) {
  if (type === "number" || type === "rating") {
    if (typeof value !== "number" || !Number.isFinite(value) || (type === "rating" && (value < 1 || value > 5))) throw new HttpError(400, "Enter a valid number or rating from 1 to 5.");
  } else if (type === "boolean") {
    if (typeof value !== "boolean") throw new HttpError(400, "This field needs a yes or no value.");
  } else if (["multi-select", "tags"].includes(type)) {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) throw new HttpError(400, "This field needs a list of values.");
    if (type === "multi-select" && options.length && value.some((item) => !options.includes(item))) throw new HttpError(400, "Choose from the available options.");
  } else if (typeof value !== "string") throw new HttpError(400, "This field needs text.");
  if (type === "single-select" && options.length && !options.includes(value as string)) throw new HttpError(400, "Choose an available option.");
  if (type === "date" && value && !z.iso.date().safeParse(value).success) throw new HttpError(400, "Enter a valid date.");
  if (type === "url" && value && !z.url().safeParse(value).success) throw new HttpError(400, "Enter a valid URL.");
  if (typeof value === "number" && ((validation.min !== undefined && value < validation.min) || (validation.max !== undefined && value > validation.max))) throw new HttpError(400, "The value is outside this field's allowed range.");
  if (typeof value === "string" && validation.maxLength !== undefined && value.length > validation.maxLength) throw new HttpError(400, "The value is too long for this field.");
}

function validateFieldDefinition(data: Pick<z.infer<typeof fieldSchema>, "type" | "options" | "validation">) {
  if (data.validation.min !== undefined && data.validation.max !== undefined && data.validation.min > data.validation.max) throw new HttpError(400, "Minimum cannot exceed maximum.");
  if (data.validation.defaultValue !== undefined) validateValue(data.type, data.validation.defaultValue, data.options, data.validation);
}

export async function applyBuiltInPersonaTemplate(transaction: Transaction, personaId: string, templateId: string, now: string) {
  const template = builtInPersonaSuggestions.find((item) => item.id === templateId);
  if (!template) throw new HttpError(404, "Template not found.");
  const entries = builtInEntries(template);
  for (const [field, values] of entries)
    for (const [position, value] of values.entries())
      await transaction.execute({ sql: "INSERT INTO persona_values (id, persona_id, field_id, value_json, position, illustrative, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)", args: [randomUUID(), personaId, `standard:${field}`, JSON.stringify(value), position, now, now] });
}

function builtInEntries(template: (typeof builtInPersonaSuggestions)[number]): [string, string[]][] {
  return [
    ["primary-goals", [...template.goals]], ["motivations", [...template.motivations]],
    ["pain-points", [...template.painPoints]], ["behaviours", [...template.behaviours]],
    ["needs", [...template.needs]], ["scenarios", [...template.scenarios]],
    ["characteristics", template.characteristics.map((item) => `${item.label}: ${item.value}`)],
    ["quote", [template.quote]],
  ];
}

function builtInTemplateProfile(templateId: string, now: string): Pick<PersonaProfile, "sections" | "fields" | "values"> {
  const template = builtInPersonaSuggestions.find((item) => item.id === templateId);
  if (!template) throw new HttpError(404, "Built-in template not found.");
  return { sections: [], fields: [], values: builtInEntries(template).flatMap(([field, items]) => items.map((value, position) => ({ id: randomUUID(), personaId: "template", fieldId: `standard:${field}`, value, position, illustrative: true, createdAt: now, updatedAt: now }))) };
}

function parseSavedProfile(value: string): Pick<PersonaProfile, "sections" | "fields" | "values"> {
  const profile = JSON.parse(value) as Pick<PersonaProfile, "sections" | "fields" | "values">;
  return {
    sections: profile.sections.map((section) => ({ ...section, description: section.description ?? "" })),
    fields: profile.fields.map((field) => ({ ...field, description: field.description ?? "" })),
    values: profile.values,
  };
}

const templateProfileSchema = z.object({
  sections: z.array(z.object({ id: uuid, personaId: z.string().nullable(), name: label, description: z.string().max(500), position: z.number().int().min(0).max(10000), hidden: z.boolean() })).max(40),
  fields: z.array(z.object({ id: uuid, sectionId: z.string().min(1), personaId: z.string().nullable(), name: label, description: z.string().max(500), type: z.enum(personaFieldTypes), options: z.array(z.string().max(120)).max(50), placeholder: z.string().max(200), required: z.boolean(), hidden: z.boolean(), position: z.number().int().min(0).max(10000), validation: fieldValidationSchema })).max(100),
  values: z.array(z.object({ id: uuid, personaId: z.string(), fieldId: z.string().min(1), value: z.union([z.string().max(5000), z.number().finite(), z.boolean(), z.array(z.string().max(500)).max(50)]), position: z.number().int().min(0).max(10000), illustrative: z.boolean(), createdAt: z.string(), updatedAt: z.string() })).max(1000),
});

export async function applySavedPersonaTemplate(transaction: Transaction, personaId: string, templateId: string, now: string) {
  const result = await transaction.execute({ sql: "SELECT profile_json FROM persona_templates WHERE id = ?", args: [templateId] });
  if (!result.rows[0]) throw new HttpError(404, "Template not found.");
  const profile = parseSavedProfile(String(result.rows[0].profile_json));
  const sectionIds = new Map<string, string>();
  const fieldIds = new Map<string, string>();
  for (const section of profile.sections) {
    const id = randomUUID();
    sectionIds.set(section.id, id);
    await transaction.execute({ sql: "INSERT INTO persona_sections (id, persona_id, name, description, position, hidden, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", args: [id, personaId, section.name, section.description, section.position, Number(section.hidden), now] });
  }
  for (const field of profile.fields) {
    const targetSectionId = sectionIds.get(field.sectionId) ?? field.sectionId;
    const section = await transaction.execute({ sql: "SELECT id FROM persona_sections WHERE id = ? AND (persona_id IS NULL OR persona_id = ?)", args: [targetSectionId, personaId] });
    if (!section.rows.length) throw new HttpError(409, "The template uses an unavailable section.");
    const id = randomUUID();
    fieldIds.set(field.id, id);
    await transaction.execute({ sql: "INSERT INTO persona_fields (id, section_id, persona_id, name, description, type, options_json, placeholder, required, hidden, position, validation_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [id, targetSectionId, personaId, field.name, field.description, field.type, JSON.stringify(field.options), field.placeholder, Number(field.required), Number(field.hidden), field.position, JSON.stringify(field.validation), now] });
  }
  for (const value of profile.values) {
    if (typeof value.value === "string" && value.value.startsWith("artifact:")) continue;
    const targetFieldId = fieldIds.get(value.fieldId) ?? value.fieldId;
    const field = await availableField(transaction, personaId, targetFieldId);
    validateValue(String(field.type), value.value, JSON.parse(String(field.options_json)), JSON.parse(String(field.validation_json)));
    await transaction.execute({ sql: "INSERT INTO persona_values (id, persona_id, field_id, value_json, position, illustrative, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)", args: [randomUUID(), personaId, targetFieldId, JSON.stringify(value.value), value.position, now, now] });
  }
}

export async function handlePersonaProfileRoutes(request: Request, path: string[], client: Client, actor: RevisionLabActor, config: ResolvedConfig): Promise<Response | null> {
  if (path[0] !== "personas") return null;
  if (path[1] === "filters" && path.length === 2 && request.method === "GET") {
    const fields = await client.execute("SELECT id, name, type FROM persona_fields WHERE persona_id IS NULL AND id NOT LIKE 'standard:%' AND hidden = 0 AND type IN ('number','rating','short-text','long-text','repeatable-text','single-select','date','url','relationship') ORDER BY name, id");
    const available = fields.rows.map((row) => ({ id: String(row.id), name: String(row.name), type: String(row.type) }));
    const query = new URL(request.url).searchParams;
    const fieldId = query.get("fieldId");
    if (!fieldId) return json({ fields: available, personaIds: null });
    const field = fields.rows.find((row) => row.id === fieldId);
    if (!field) throw new HttpError(404, "Shared field not found.");
    const operator = z.enum(["contains", "equals", "lte", "gte"]).parse(query.get("operator"));
    const value = z.string().min(1).max(120).parse(query.get("value"));
    const numeric = field.type === "number" || field.type === "rating";
    if (numeric && !["equals", "lte", "gte"].includes(operator)) throw new HttpError(400, "Choose a numeric comparison.");
    if (!numeric && !["contains", "equals"].includes(operator)) throw new HttpError(400, "Choose a text comparison.");
    const comparison = numeric
      ? `json_type(value_json) IN ('integer','real') AND CAST(json_extract(value_json, '$') AS REAL) ${operator === "lte" ? "<=" : operator === "gte" ? ">=" : "="} ?`
      : `json_type(value_json) = 'text' AND ${operator === "contains" ? "instr(lower(CAST(json_extract(value_json, '$') AS TEXT)), lower(?)) > 0" : "lower(CAST(json_extract(value_json, '$') AS TEXT)) = lower(?)"}`;
    const parameter = numeric ? Number(value) : value;
    if (numeric && !Number.isFinite(parameter)) throw new HttpError(400, "Enter a valid number.");
    const matches = await client.execute({ sql: `SELECT DISTINCT persona_id FROM persona_values WHERE field_id = ? AND deleted_at IS NULL AND ${comparison}`, args: [fieldId, parameter] });
    return json({ fields: available, personaIds: matches.rows.map((row) => String(row.persona_id)) });
  }
  if (path[1] === "templates") {
    if (path.length === 2 && request.method === "GET") {
      const result = await client.execute("SELECT * FROM persona_templates ORDER BY name");
      const templates: PersonaSavedTemplate[] = result.rows.map((row) => ({ id: String(row.id), name: String(row.name), description: String(row.description), sourcePersonaId: row.source_persona_id == null ? null : String(row.source_persona_id), sourceTemplateId: row.source_template_id == null ? null : String(row.source_template_id), profile: parseSavedProfile(String(row.profile_json)), createdAt: String(row.created_at), updatedAt: String(row.updated_at) }));
      return json({ builtIn: builtInPersonaSuggestions, saved: templates });
    }
    requireRole(actor, "editor");
    if (path.length === 2 && request.method === "POST") {
      const input = z.object({ name: label, description: z.string().max(1000).default(""), sourcePersonaId: uuid.optional(), sourceTemplateId: z.string().max(120).optional() }).parse(await readJson(request));
      if (input.sourcePersonaId && input.sourceTemplateId) throw new HttpError(400, "Choose one template source.");
      const id = randomUUID();
      const now = new Date().toISOString();
      let profile: Pick<PersonaProfile, "sections" | "fields" | "values"> = { sections: [], fields: [], values: [] };
      if (input.sourcePersonaId) {
        const source = await readPersonaProfile(client, input.sourcePersonaId);
        profile = { sections: source.sections.filter((section) => section.personaId), fields: source.fields.filter((field) => field.personaId), values: source.values.filter((value) => !(typeof value.value === "string" && value.value.startsWith("artifact:"))) };
      } else if (input.sourceTemplateId) {
        if (builtInPersonaSuggestions.some((item) => item.id === input.sourceTemplateId)) profile = builtInTemplateProfile(input.sourceTemplateId, now);
        else {
          const source = await client.execute({ sql: "SELECT profile_json FROM persona_templates WHERE id = ?", args: [input.sourceTemplateId] });
          if (!source.rows[0]) throw new HttpError(404, "Template not found.");
          profile = parseSavedProfile(String(source.rows[0].profile_json));
        }
      }
      await write(client, async (transaction) => transaction.execute({ sql: "INSERT INTO persona_templates (id, name, description, source_persona_id, source_template_id, profile_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: [id, input.name, input.description, input.sourcePersonaId ?? null, input.sourceTemplateId ?? null, JSON.stringify(profile), now, now] }));
      return json({ id }, 201);
    }
    if (path.length === 3 && uuid.safeParse(path[2]).success && request.method === "PATCH") {
      const input = z.object({ name: label, description: z.string().max(1000), profile: templateProfileSchema }).parse(await readJson(request, 250_000));
      const sectionIds = new Set(input.profile.sections.map((item) => item.id));
      const fieldIds = new Set(input.profile.fields.map((item) => item.id));
      const standardSectionIds = new Set(standardPersonaSections.map((item) => `standard:${item.id}`));
      const standardFieldIds = new Set(standardPersonaFields.map((item) => `standard:${item.id}`));
      for (const field of input.profile.fields) {
        validateFieldDefinition(field);
        if (sectionIds.has(field.sectionId) || standardSectionIds.has(field.sectionId)) continue;
        const shared = await client.execute({ sql: "SELECT id FROM persona_sections WHERE id = ? AND persona_id IS NULL", args: [field.sectionId] });
        if (!shared.rows.length) throw new HttpError(400, "A custom field has no available section.");
      }
      for (const value of input.profile.values) {
        const ownField = input.profile.fields.find((field) => field.id === value.fieldId);
        if (ownField) {
          if (ownField.type === "file") throw new HttpError(400, "File values are added after creating a persona.");
          validateValue(ownField.type, value.value, ownField.options, ownField.validation);
          continue;
        }
        if (!fieldIds.has(value.fieldId) && !standardFieldIds.has(value.fieldId)) {
          const shared = await client.execute({ sql: "SELECT id FROM persona_fields WHERE id = ? AND persona_id IS NULL", args: [value.fieldId] });
          if (!shared.rows.length) throw new HttpError(400, "A template value has no available field.");
        }
        const field = await client.execute({ sql: "SELECT type, options_json, validation_json FROM persona_fields WHERE id = ? AND persona_id IS NULL", args: [value.fieldId] });
        if (!field.rows.length) throw new HttpError(400, "A template value has no available field.");
        if (field.rows[0].type === "file") throw new HttpError(400, "File values are added after creating a persona.");
        validateValue(String(field.rows[0].type), value.value, JSON.parse(String(field.rows[0].options_json)), JSON.parse(String(field.rows[0].validation_json)));
      }
      await write(client, async (transaction) => {
        const result = await transaction.execute({ sql: "UPDATE persona_templates SET name = ?, description = ?, profile_json = ?, updated_at = ? WHERE id = ?", args: [input.name, input.description, JSON.stringify(input.profile), new Date().toISOString(), path[2]] });
        if (!result.rowsAffected) throw new HttpError(404, "Template not found.");
      });
      return json({ ok: true });
    }
    if (path.length === 4 && uuid.safeParse(path[2]).success && path[3] === "reset" && request.method === "POST") {
      await write(client, async (transaction) => {
        const source = await transaction.execute({ sql: "SELECT source_template_id FROM persona_templates WHERE id = ?", args: [path[2]] });
        if (!source.rows[0]) throw new HttpError(404, "Template not found.");
        const sourceId = source.rows[0].source_template_id == null ? null : String(source.rows[0].source_template_id);
        let profile: Pick<PersonaProfile, "sections" | "fields" | "values"> = { sections: [], fields: [], values: [] };
        if (sourceId) {
          if (builtInPersonaSuggestions.some((item) => item.id === sourceId)) profile = builtInTemplateProfile(sourceId, new Date().toISOString());
          else {
            const original = await transaction.execute({ sql: "SELECT profile_json FROM persona_templates WHERE id = ?", args: [sourceId] });
            if (!original.rows[0]) throw new HttpError(409, "The source template is unavailable.");
            profile = parseSavedProfile(String(original.rows[0].profile_json));
          }
        }
        await transaction.execute({ sql: "UPDATE persona_templates SET profile_json = ?, updated_at = ? WHERE id = ?", args: [JSON.stringify(profile), new Date().toISOString(), path[2]] });
      });
      return json({ ok: true });
    }
    if (path.length === 3 && uuid.safeParse(path[2]).success && request.method === "DELETE") {
      await write(client, async (transaction) => transaction.execute({ sql: "DELETE FROM persona_templates WHERE id = ?", args: [path[2]] }));
      return json({ ok: true });
    }
    return null;
  }
  const personaId = path[1];
  if (uuid.safeParse(personaId).success && path[2] === "files" && path.length === 3 && request.method === "POST") {
    requireRole(actor, "editor");
    const input = z.object({ name: z.string().trim().min(1).max(200), data: z.string().min(1).max(4_100_000) }).parse(await readJson(request, 4_200_000));
    const exists = await client.execute({ sql: "SELECT id FROM personas WHERE id = ? AND archived_at IS NULL", args: [personaId] });
    if (!exists.rows.length) throw new HttpError(404, "Persona not found or archived.");
    const artifact = await prepareCommentAttachment(input.name, input.data, config);
    try {
      await write(client, async (transaction) => {
        await ensurePersona(transaction, personaId);
        await insertArtifact(transaction, artifact);
        await transaction.execute({ sql: "INSERT INTO persona_files (id, persona_id, artifact_id, name, created_at) VALUES (?, ?, ?, ?, ?)", args: [randomUUID(), personaId, artifact.id, input.name, new Date().toISOString()] });
        await recordActivity(transaction, personaId, actor, `Uploaded file ${input.name}`, new Date().toISOString());
      });
    } catch (cause) { await discardArtifact(artifact, config); throw cause; }
    return json({ artifactId: artifact.id, name: input.name }, 201);
  }
  if (!uuid.safeParse(personaId).success || path[2] !== "profile" || path.length !== 3) return null;
  if (request.method === "GET") return json(await readPersonaProfile(client, personaId));
  if (request.method !== "POST") return null;
  requireRole(actor, "editor");
  const input = z.object({ action: z.string() }).passthrough().parse(await readJson(request, 65_536));
  if (input.action === "evidence.add" && typeof input.feedbackId === "string") {
    const available = await readReviewEvidence(client, config);
    if (!available.some((item) => item.id === input.feedbackId))
      throw new HttpError(404, "Feedback source not found in this workspace.");
  }
  const now = new Date().toISOString();
  const result = await write(client, async (transaction) => {
    await ensurePersona(transaction, personaId);
    let id: string | undefined;
    switch (input.action) {
      case "metadata": {
        const data = z.object({ personaType: z.enum(personaTypes), researchStatus: z.enum(personaResearchStatuses), confidenceLevel: confidence, lastValidatedAt: z.iso.date().nullable() }).parse(input);
        await transaction.execute({ sql: "UPDATE personas SET persona_type = ?, research_status = ?, confidence_level = ?, last_validated_at = ? WHERE id = ?", args: [data.personaType, data.researchStatus, data.confidenceLevel, data.lastValidatedAt, personaId] });
        await recordActivity(transaction, personaId, actor, "Updated research status and persona metadata", now);
        break;
      }
      case "template.reset": {
        const persona = await transaction.execute({ sql: "SELECT template_id FROM personas WHERE id = ?", args: [personaId] });
        const templateId = persona.rows[0]?.template_id == null ? null : String(persona.rows[0].template_id);
        if (!templateId) throw new HttpError(409, "This persona was not created from a template.");
        await transaction.execute({ sql: "UPDATE persona_values SET deleted_at = ?, updated_at = ? WHERE persona_id = ? AND deleted_at IS NULL", args: [now, now, personaId] });
        await transaction.execute({ sql: "UPDATE persona_fields SET hidden = 1 WHERE persona_id = ?", args: [personaId] });
        await transaction.execute({ sql: "UPDATE persona_sections SET hidden = 1 WHERE persona_id = ?", args: [personaId] });
        if (builtInPersonaSuggestions.some((item) => item.id === templateId)) await applyBuiltInPersonaTemplate(transaction, personaId, templateId, now);
        else await applySavedPersonaTemplate(transaction, personaId, templateId, now);
        await recordActivity(transaction, personaId, actor, "Reapplied template suggestions; previous attributes retained in history", now);
        break;
      }
      case "section.add": {
        const data = z.object({ name: label, description: z.string().max(500).default(""), position: z.number().int().min(0).max(10000).default(100), shared: z.boolean().default(false) }).parse(input);
        id = randomUUID();
        await transaction.execute({ sql: "INSERT INTO persona_sections (id, persona_id, name, description, position, created_at) VALUES (?, ?, ?, ?, ?, ?)", args: [id, data.shared ? null : personaId, data.name, data.description, data.position, now] });
        await recordActivity(transaction, personaId, actor, `Added section ${data.name}`, now);
        break;
      }
      case "section.update": {
        const data = z.object({ id: uuid, name: label, description: z.string().max(500).optional(), position: z.number().int().min(0).max(10000), hidden: z.boolean() }).parse(input);
        const existing = await transaction.execute({ sql: "SELECT id FROM persona_sections WHERE id = ? AND (persona_id = ? OR persona_id IS NULL) AND id NOT LIKE 'standard:%'", args: [data.id, personaId] });
        if (!existing.rows.length) throw new HttpError(404, "Section not found or is built in.");
        await transaction.execute({ sql: "UPDATE persona_sections SET name = ?, description = COALESCE(?, description), position = ?, hidden = ? WHERE id = ?", args: [data.name, data.description ?? null, data.position, Number(data.hidden), data.id] });
        await recordActivity(transaction, personaId, actor, `Updated section ${data.name}`, now);
        break;
      }
      case "section.delete": {
        const data = z.object({ id: uuid }).parse(input);
        const fields = await transaction.execute({ sql: "SELECT id FROM persona_fields WHERE section_id = ? LIMIT 1", args: [data.id] });
        if (fields.rows.length) throw new HttpError(409, "Move or remove fields before deleting this section.");
        await transaction.execute({ sql: "DELETE FROM persona_sections WHERE id = ? AND (persona_id = ? OR persona_id IS NULL) AND id NOT LIKE 'standard:%'", args: [data.id, personaId] });
        await recordActivity(transaction, personaId, actor, "Removed an empty section", now);
        break;
      }
      case "section.move-fields": {
        const data = z.object({ id: uuid, targetSectionId: z.string().min(1) }).parse(input);
        if (data.id === data.targetSectionId) throw new HttpError(400, "Choose another section.");
        const source = await transaction.execute({ sql: "SELECT id FROM persona_sections WHERE id = ? AND (persona_id = ? OR persona_id IS NULL) AND id NOT LIKE 'standard:%'", args: [data.id, personaId] });
        const target = await transaction.execute({ sql: "SELECT id, persona_id FROM persona_sections WHERE id = ? AND (persona_id = ? OR persona_id IS NULL)", args: [data.targetSectionId, personaId] });
        if (!source.rows.length || !target.rows.length) throw new HttpError(404, "Section not found.");
        if (target.rows[0].persona_id != null) {
          const shared = await transaction.execute({ sql: "SELECT id FROM persona_fields WHERE section_id = ? AND persona_id IS NULL LIMIT 1", args: [data.id] });
          if (shared.rows.length) throw new HttpError(400, "Move shared fields to a shared or standard section.");
        }
        await transaction.execute({ sql: "UPDATE persona_fields SET section_id = ? WHERE section_id = ?", args: [data.targetSectionId, data.id] });
        await transaction.execute({ sql: "DELETE FROM persona_sections WHERE id = ?", args: [data.id] });
        await recordActivity(transaction, personaId, actor, "Moved fields and removed a section", now);
        break;
      }
      case "section.move": {
        const data = z.object({ id: uuid, direction: z.enum(["up", "down"]) }).parse(input);
        const result = await transaction.execute({ sql: "SELECT id FROM persona_sections WHERE id NOT LIKE 'standard:%' AND (persona_id IS NULL OR persona_id = ?) ORDER BY position, name, id", args: [personaId] });
        const ids = result.rows.map((row) => String(row.id));
        const index = ids.indexOf(data.id);
        if (index < 0) throw new HttpError(404, "Section not found.");
        const nextIndex = index + (data.direction === "up" ? -1 : 1);
        if (nextIndex < 0 || nextIndex >= ids.length) break;
        [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
        for (const [position, sectionId] of ids.entries()) await transaction.execute({ sql: "UPDATE persona_sections SET position = ? WHERE id = ?", args: [position + 100, sectionId] });
        await recordActivity(transaction, personaId, actor, "Reordered profile sections", now);
        break;
      }
      case "field.add": {
        const data = fieldSchema.parse(input);
        validateFieldDefinition(data);
        const section = await transaction.execute({ sql: "SELECT id, persona_id FROM persona_sections WHERE id = ? AND (persona_id IS NULL OR persona_id = ?)", args: [data.sectionId, personaId] });
        if (!section.rows.length) throw new HttpError(404, "Section not found.");
        if (data.shared && section.rows[0].persona_id != null) throw new HttpError(400, "Shared fields need a shared or standard section.");
        id = randomUUID();
        await transaction.execute({ sql: `INSERT INTO persona_fields (id, section_id, persona_id, name, description, type, options_json, placeholder, required, hidden, position, validation_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [id, data.sectionId, data.shared ? null : personaId, data.name, data.description ?? "", data.type, JSON.stringify(data.options), data.placeholder, Number(data.required), Number(data.hidden), data.position, JSON.stringify(data.validation), now] });
        await recordActivity(transaction, personaId, actor, `Added field ${data.name}`, now);
        break;
      }
      case "field.update": {
        const data = fieldSchema.extend({ id: uuid }).parse(input);
        validateFieldDefinition(data);
        const current = await transaction.execute({ sql: "SELECT * FROM persona_fields WHERE id = ? AND (persona_id = ? OR persona_id IS NULL) AND id NOT LIKE 'standard:%'", args: [data.id, personaId] });
        if (!current.rows[0]) throw new HttpError(404, "Field not found or is built in.");
        const used = await transaction.execute({ sql: "SELECT id FROM persona_values WHERE field_id = ? AND deleted_at IS NULL LIMIT 1", args: [data.id] });
        if (used.rows.length && current.rows[0].type !== data.type) throw new HttpError(409, "Remove or migrate existing values before changing the field type.");
        const section = await transaction.execute({ sql: "SELECT id, persona_id FROM persona_sections WHERE id = ? AND (persona_id IS NULL OR persona_id = ?)", args: [data.sectionId, personaId] });
        if (!section.rows.length) throw new HttpError(404, "Section not found.");
        if (current.rows[0].persona_id == null && section.rows[0].persona_id != null) throw new HttpError(400, "Shared fields need a shared or standard section.");
        if (used.rows.length) {
          const existingValues = await transaction.execute({ sql: "SELECT value_json FROM persona_values WHERE field_id = ? AND deleted_at IS NULL", args: [data.id] });
          for (const row of existingValues.rows) validateValue(data.type, JSON.parse(String(row.value_json)), data.options, data.validation);
        }
        await transaction.execute({ sql: "UPDATE persona_fields SET section_id = ?, name = ?, description = COALESCE(?, description), type = ?, options_json = ?, placeholder = ?, required = ?, hidden = ?, position = ?, validation_json = ? WHERE id = ?", args: [data.sectionId, data.name, data.description ?? null, data.type, JSON.stringify(data.options), data.placeholder, Number(data.required), Number(data.hidden), data.position, JSON.stringify(data.validation), data.id] });
        await recordActivity(transaction, personaId, actor, `Updated field ${data.name}`, now);
        break;
      }
      case "field.delete": {
        const data = z.object({ id: uuid }).parse(input);
        const used = await transaction.execute({ sql: "SELECT id FROM persona_values WHERE field_id = ? LIMIT 1", args: [data.id] });
        if (used.rows.length) throw new HttpError(409, "This field has values or history. Hide it instead of deleting it.");
        await transaction.execute({ sql: "DELETE FROM persona_fields WHERE id = ? AND (persona_id = ? OR persona_id IS NULL) AND id NOT LIKE 'standard:%'", args: [data.id, personaId] });
        await recordActivity(transaction, personaId, actor, "Removed an empty field", now);
        break;
      }
      case "value.add":
      case "value.update": {
        const data = valueSchema.extend({ id: uuid.optional() }).parse(input);
        const field = await availableField(transaction, personaId, data.fieldId);
        validateValue(String(field.type), data.value, JSON.parse(String(field.options_json)), JSON.parse(String(field.validation_json)));
        if (field.type === "file") {
          if (typeof data.value !== "string" || !/^artifact:[a-f0-9-]{36}$/.test(data.value)) throw new HttpError(400, "Upload a file before saving this field.");
          const file = await transaction.execute({ sql: "SELECT id FROM persona_files WHERE artifact_id = ? AND persona_id = ?", args: [data.value.slice(9), personaId] });
          if (!file.rows.length) throw new HttpError(404, "Uploaded file not found for this persona.");
        }
        if (input.action === "value.update") {
          if (!data.id) throw new HttpError(400, "Value ID is required.");
          const found = await transaction.execute({ sql: "SELECT id FROM persona_values WHERE id = ? AND persona_id = ? AND field_id = ? AND deleted_at IS NULL", args: [data.id, personaId, data.fieldId] });
          if (!found.rows.length) throw new HttpError(404, "Value not found.");
          id = data.id;
          await transaction.execute({ sql: "UPDATE persona_values SET value_json = ?, position = ?, illustrative = 0, updated_at = ? WHERE id = ?", args: [JSON.stringify(data.value), data.position, now, id] });
        } else {
          id = randomUUID();
          await transaction.execute({ sql: "INSERT INTO persona_values (id, persona_id, field_id, value_json, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", args: [id, personaId, data.fieldId, JSON.stringify(data.value), data.position, now, now] });
        }
        await recordActivity(transaction, personaId, actor, `${input.action === "value.add" ? "Added" : "Updated"} ${String(field.name)}`, now);
        break;
      }
      case "value.delete": {
        const data = z.object({ id: uuid }).parse(input);
        await transaction.execute({ sql: "UPDATE persona_values SET deleted_at = ?, updated_at = ? WHERE id = ? AND persona_id = ?", args: [now, now, data.id, personaId] });
        await recordActivity(transaction, personaId, actor, "Removed an attribute", now);
        break;
      }
      case "value.move": {
        const data = z.object({ id: uuid, direction: z.enum(["up", "down"]) }).parse(input);
        const current = await transaction.execute({ sql: "SELECT field_id FROM persona_values WHERE id = ? AND persona_id = ? AND deleted_at IS NULL", args: [data.id, personaId] });
        if (!current.rows.length) throw new HttpError(404, "Attribute not found.");
        const siblings = await transaction.execute({ sql: "SELECT id FROM persona_values WHERE persona_id = ? AND field_id = ? AND deleted_at IS NULL ORDER BY position, created_at, id", args: [personaId, String(current.rows[0].field_id)] });
        const ids = siblings.rows.map((row) => String(row.id));
        const index = ids.indexOf(data.id);
        const nextIndex = index + (data.direction === "up" ? -1 : 1);
        if (nextIndex < 0 || nextIndex >= ids.length) break;
        [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
        for (const [position, valueId] of ids.entries()) await transaction.execute({ sql: "UPDATE persona_values SET position = ?, updated_at = ? WHERE id = ?", args: [position, now, valueId] });
        await recordActivity(transaction, personaId, actor, "Reordered attributes", now);
        break;
      }
      case "evidence.add": {
        const data = evidenceSchema.parse(input);
        if (data.url.startsWith("artifact:")) {
          const file = await transaction.execute({ sql: "SELECT id FROM persona_files WHERE artifact_id = ? AND persona_id = ?", args: [data.url.slice(9), personaId] });
          if (!file.rows.length) throw new HttpError(404, "Uploaded file not found for this persona.");
        }
        for (const valueId of data.valueIds) {
          const value = await transaction.execute({ sql: "SELECT id FROM persona_values WHERE id = ? AND persona_id = ? AND deleted_at IS NULL", args: [valueId, personaId] });
          if (!value.rows.length) throw new HttpError(404, "Linked attribute not found.");
        }
        if (data.feedbackId) {
          const duplicate = await transaction.execute({ sql: "SELECT id FROM persona_evidence WHERE persona_id = ? AND feedback_id = ?", args: [personaId, data.feedbackId] });
          if (duplicate.rows.length) throw new HttpError(409, "This feedback is already linked to the persona.");
        }
        id = randomUUID();
        await transaction.execute({ sql: "INSERT INTO persona_evidence (id, persona_id, title, type, source_reference, url, evidence_date, confidence, notes, feedback_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [id, personaId, data.title, data.type, data.sourceReference, data.url, data.date, data.confidence, data.notes, data.feedbackId, now] });
        for (const valueId of data.valueIds) await transaction.execute({ sql: "INSERT INTO persona_evidence_links (evidence_id, value_id) VALUES (?, ?)", args: [id, valueId] });
        await recordActivity(transaction, personaId, actor, `Linked evidence ${data.title}`, now);
        break;
      }
      case "evidence.link": {
        const data = z.object({ evidenceId: uuid, valueId: uuid }).parse(input);
        const evidence = await transaction.execute({ sql: "SELECT id FROM persona_evidence WHERE id = ? AND persona_id = ?", args: [data.evidenceId, personaId] });
        const value = await transaction.execute({ sql: "SELECT id FROM persona_values WHERE id = ? AND persona_id = ? AND deleted_at IS NULL", args: [data.valueId, personaId] });
        if (!evidence.rows.length || !value.rows.length) throw new HttpError(404, "Evidence or attribute not found.");
        await transaction.execute({ sql: "INSERT OR IGNORE INTO persona_evidence_links (evidence_id, value_id) VALUES (?, ?)", args: [data.evidenceId, data.valueId] });
        await recordActivity(transaction, personaId, actor, "Linked evidence to an attribute", now);
        break;
      }
      default: throw new HttpError(400, "Unknown persona profile action.");
    }
    return { id };
  });
  return json(result);
}
