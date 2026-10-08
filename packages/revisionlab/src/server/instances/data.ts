import { aiSettingsSchema } from "../ai-settings-schema.js";
import { defaultAiSettings } from "../../ai-instructions/index.js";
import { z } from "zod";
import type { RevisionLabState } from "../types.js";
import type { WorkspaceOrigin } from "../../workspace-instances.js";
import { boardInputSchema } from "../board.js";
import { captureMetadataSchema } from "../capture-metadata.js";
import { settingsSchema } from "../settings.js";
import { HttpError } from "../security.js";
const id = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9_-]+$/);
const text = z.string().max(100_000);
const point = z.object({ x: z.number().finite(), y: z.number().finite() });
const anchor = z.object({ selector: text, tag: text, label: text });
const click = z.object({
  target: anchor,
  point: point.nullable(),
  bounds: point.extend({ width: z.number(), height: z.number() }).nullable(),
  activation: z.enum(["pointer", "keyboard"]),
});
const step = z.object({
  id,
  flowId: id,
  title: text,
  route: text,
  screenshot: z.string().max(4_000_000).nullable(),
  position: z.number(),
  createdAt: text,
  capture: captureMetadataSchema.nullable().optional(),
});
const flow = z.object({
  id,
  familyId: id,
  version: z.number(),
  previousVersionId: id.nullable(),
  name: text,
  persona: text,
  route: text,
  status: z.enum(["recording", "complete"]),
  createdAt: text,
  updatedAt: text,
  steps: z.array(step).max(200),
  board: boardInputSchema,
  transitions: z
    .array(
      z.object({
        id,
        sourceStepId: id,
        targetStepId: id,
        interaction: click.nullable(),
      }),
    )
    .optional(),
});
const comment = z.object({
  attachments: z
    .array(
      z.object({
        id,
        name: text,
        contentType: z.enum([
          "image/png",
          "image/jpeg",
          "image/webp",
          "application/octet-stream",
        ]),
        size: z.number().int().min(1).max(3_000_000),
      }),
    )
    .max(5)
    .optional(),
  personas: z
    .array(z.object({ id, name: text }))
    .max(20)
    .optional(),
  mentions: z
    .array(
      z.object({
        id,
        kind: z.enum(["persona", "user"]),
        label: text,
        start: z.number().int().min(0).max(4000),
        end: z.number().int().min(1).max(4000),
      }),
    )
    .max(20)
    .optional(),
  id,
  flowId: id.nullable(),
  stepId: id.nullable(),
  edgeId: id.nullable().optional(),
  edge: z
    .object({
      sourceStepId: id,
      targetStepId: id,
      label: text,
      kind: z.enum(["recorded", "manual"]),
      archived: z.boolean(),
    })
    .nullable()
    .optional(),
  route: text,
  body: text,
  status: z.enum(["open", "resolved"]),
  authorName: text,
  createdAt: text,
  resolvedAt: text.nullable(),
  anchor: point.nullable(),
  elementAnchor: anchor.nullable().optional(),
  parentId: id.nullable(),
});
export const remoteStateSchema = z.object({
  workspaceName: z.string().max(100).optional(),
  dashboard: z
    .object({
      testSessions: z.number().int().nonnegative().safe(),
      ticketsCreated: z.number().int().nonnegative().safe(),
    })
    .optional(),
  instanceId: z.string().uuid(),
  setup: z.object({
    step: z.number(),
    completed: z.boolean(),
    name: text,
    email: text,
  }),
  project: z.object({ id: text, name: text }),
  actor: z.object({
    id: text,
    name: text,
    email: text,
    role: z.enum(["owner", "editor", "commenter"]),
  }),
  settings: settingsSchema.extend({
    ai: aiSettingsSchema.default(defaultAiSettings),
  }),
  flows: z.array(flow),
  comments: z.array(comment),
  invitations: z.array(z.unknown()).transform(() => []),
  personas: z.array(
    z.object({
      id,
      name: text,
      description: text,
      avatar: z.string().max(80).nullable().optional(),
      archivedAt: text.nullable(),
      hasCredentials: z.boolean(),
      createdAt: text,
      updatedAt: text,
    }),
  ),
  memberships: z.array(z.unknown()).transform(() => []),
  accessSettings: z
    .unknown()
    .nullable()
    .transform(() => null),
});
const ids = new Set([
  "id",
  "flowId",
  "familyId",
  "previousVersionId",
  "stepId",
  "sourceStepId",
  "targetStepId",
  "parentId",
  "edgeId",
  "personaId",
]);
const idArrays = new Set(["familyIds", "hiddenStepIds", "personaIds"]);
const opaque = new Set([
  "capture",
  "accessibility",
  "settings",
  "project",
  "actor",
  "workspace",
  "elementAnchor",
  "interaction",
]);
export function scopeData<T>(
  value: T,
  source: string,
  direction: "in" | "out",
  key = "",
): T {
  if (value == null || opaque.has(key)) return value;
  if (typeof value === "string" && (ids.has(key) || idArrays.has(key))) {
    if (direction === "in") return `${source}~${value}` as T;
    if (!value.includes("~")) return value;
    if (!value.startsWith(`${source}~`))
      throw new HttpError(400, "A change cannot reference another workspace.");
    return value.slice(source.length + 1) as T;
  }
  if (Array.isArray(value))
    return value.map((item) => scopeData(item, source, direction, key)) as T;
  if (typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => [
        name,
        scopeData(item, source, direction, name),
      ]),
    ) as T;
  return value;
}
export function sourceState(
  data: RevisionLabState,
  source: WorkspaceOrigin,
  apiPath: string,
  remoteApiPath: string,
): RevisionLabState {
  const state = scopeData(data, source.id, "in");
  for (const flow of state.flows) {
    flow.workspace = source;
    for (const step of flow.steps) {
      if (!step.screenshot) continue;
      const match = step.screenshot.match(
        new RegExp(`^${remoteApiPath}/artifacts/([a-fA-F0-9-]{36})$`),
      );
      if (match)
        step.screenshot = `${apiPath}/instances/${source.id}/proxy/artifacts/${match[1]}`;
      else if (
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
          step.screenshot,
        )
      )
        step.screenshot = null;
    }
  }
  state.comments.forEach((comment) => {
    comment.workspace = source;
  });
  state.personas.forEach((persona) => {
    persona.workspace = source;
  });
  return state;
}
