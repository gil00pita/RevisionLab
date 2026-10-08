import { useState } from "react";
import { Button, Field, Flex, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import { standardPersonaFields, standardPersonaSections, type PersonaField, type PersonaProfile, type PersonaSavedTemplate, type PersonaSection } from "../../../persona-profile.js";
import { PersonaProfileSections } from "./PersonaProfileSections.js";
import type { PersonaProfileAction } from "./PersonaProfileEditor.js";

type TemplateContent = Pick<PersonaProfile, "sections" | "fields" | "values">;

export function PersonaTemplateEditor({ template, apiPath, onChange, onDelete }: {
  template: PersonaSavedTemplate;
  apiPath: string;
  onChange: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [content, setContent] = useState<TemplateContent>(template.profile);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const standardSections: PersonaSection[] = standardPersonaSections.map((item, position) => ({ id: `standard:${item.id}`, personaId: null, name: item.name, description: "", position, hidden: false }));
  const standardFields: PersonaField[] = standardPersonaFields.map((item, position) => ({ id: `standard:${item.id}`, sectionId: `standard:${item.sectionId}`, personaId: null, name: item.name, description: "", type: item.type, options: [], placeholder: "", required: false, hidden: false, position, validation: {} }));
  const profile: PersonaProfile = { sections: [...standardSections, ...content.sections], fields: [...standardFields, ...content.fields], values: [...content.values].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)), evidence: [], activity: [] };
  async function edit(action: PersonaProfileAction) {
    const id = typeof action.id === "string" ? action.id : crypto.randomUUID();
    const now = new Date().toISOString();
    const sectionId = String(action.sectionId ?? "");
    const fieldId = String(action.fieldId ?? "");
    if (action.action === "section.delete" && content.fields.some((item) => item.sectionId === id)) throw new Error("Move or remove fields first.");
    if (action.action === "field.delete" && content.values.some((item) => item.fieldId === id)) throw new Error("Remove values first.");
    setContent((current) => {
      switch (action.action) {
        case "section.add": return { ...current, sections: [...current.sections, { id, personaId: "template", name: String(action.name), description: String(action.description ?? ""), position: Number(action.position), hidden: false }] };
        case "section.update": return { ...current, sections: current.sections.map((item) => item.id === id ? { ...item, name: String(action.name), description: String(action.description ?? item.description), position: Number(action.position), hidden: Boolean(action.hidden) } : item) };
        case "section.move": {
          const ordered = [...current.sections].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
          const index = ordered.findIndex((item) => item.id === id);
          const next = index + (action.direction === "up" ? -1 : 1);
          if (index < 0 || next < 0 || next >= ordered.length) return current;
          [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
          return { ...current, sections: ordered.map((item, position) => ({ ...item, position: position + 100 })) };
        }
        case "section.delete": return current.fields.some((item) => item.sectionId === id) ? current : { ...current, sections: current.sections.filter((item) => item.id !== id) };
        case "section.move-fields": return { ...current, sections: current.sections.filter((item) => item.id !== id), fields: current.fields.map((item) => item.sectionId === id ? { ...item, sectionId: String(action.targetSectionId) } : item) };
        case "field.add": return { ...current, fields: [...current.fields, { id, personaId: "template", sectionId, name: String(action.name), description: String(action.description ?? ""), type: action.type as PersonaField["type"], options: action.options as string[], placeholder: String(action.placeholder), required: Boolean(action.required), hidden: Boolean(action.hidden), position: Number(action.position), validation: action.validation as Record<string, unknown> }] };
        case "field.update": return { ...current, fields: current.fields.map((item) => item.id === id ? { ...item, sectionId, name: String(action.name), description: String(action.description ?? item.description), type: action.type as PersonaField["type"], options: action.options as string[], placeholder: String(action.placeholder), required: Boolean(action.required), hidden: Boolean(action.hidden), position: Number(action.position), validation: action.validation as Record<string, unknown> } : item) };
        case "field.delete": return current.values.some((item) => item.fieldId === id) ? current : { ...current, fields: current.fields.filter((item) => item.id !== id) };
        case "value.add": return { ...current, values: [...current.values, { id, personaId: "template", fieldId, value: action.value, position: Number(action.position), illustrative: true, createdAt: now, updatedAt: now }] };
        case "value.update": return { ...current, values: current.values.map((item) => item.id === id ? { ...item, value: action.value, position: Number(action.position), illustrative: true, updatedAt: now } : item) };
        case "value.move": {
          const fieldId = current.values.find((item) => item.id === id)?.fieldId;
          if (!fieldId) return current;
          const ordered = current.values.filter((item) => item.fieldId === fieldId).sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
          const index = ordered.findIndex((item) => item.id === id);
          const next = index + (action.direction === "up" ? -1 : 1);
          if (next < 0 || next >= ordered.length) return current;
          [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
          const positions = new Map(ordered.map((item, position) => [item.id, position]));
          return { ...current, values: current.values.map((item) => positions.has(item.id) ? { ...item, position: positions.get(item.id)!, updatedAt: now } : item) };
        }
        case "value.delete": return { ...current, values: current.values.filter((item) => item.id !== id) };
        default: return current;
      }
    });
  }
  async function save() {
    setBusy(true); setStatus("");
    try { await apiRequest(apiPath, `personas/templates/${template.id}`, { method: "PATCH", body: JSON.stringify({ name, description, profile: content }) }); await onChange(); setStatus("Template saved. Existing personas keep their own values."); }
    catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not save the template."); }
    finally { setBusy(false); }
  }
  async function reset() {
    setBusy(true); setStatus("");
    try { await apiRequest(apiPath, `personas/templates/${template.id}/reset`, { method: "POST", body: "{}" }); await onChange(); setStatus("Template contents reset. Reopen it to view the source fields."); }
    catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not reset the template."); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setStatus("");
    try { await apiRequest(apiPath, `personas/templates/${template.id}`, { method: "DELETE" }); await onDelete(); }
    catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not delete the template."); setBusy(false); }
  }
  return <Stack gap="4" borderTopWidth="1px" borderColor="border" pt="4">
    <Field.Root required><Field.Label>Template name<Field.RequiredIndicator /></Field.Label><Input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></Field.Root>
    <Field.Root><Field.Label>Description</Field.Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={2} /></Field.Root>
    <PersonaProfileSections profile={profile} canEdit busy={busy} onSave={edit} allowShared={false} />
    <Flex gap="2" flexWrap="wrap"><Button size="sm" colorPalette="blue" loading={busy} disabled={!name.trim()} onClick={() => void save()}>Save template</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void reset()}>Reset contents</Button><Button size="sm" variant="ghost" colorPalette="red" disabled={busy} onClick={() => void remove()}>Delete template</Button></Flex>
    {status && <Text role="status" fontSize="sm">{status}</Text>}
  </Stack>;
}
