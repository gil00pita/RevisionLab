import { createHash } from "node:crypto";
import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import { write } from "./database.js";
import { routeSchema } from "./prototype-route.js";
import { interactionSchema, recordVisit } from "./recording-visits.js";
import { captureMetadataSchema } from "./capture-metadata.js";
import { accessibilityReportSchema } from "./accessibility-report.js";
import { discardArtifact, insertArtifact, MAX_CAPTURE_BODY_BYTES, prepareArtifact } from "./artifacts.js";
import { HttpError, json, readJson } from "./security.js";
import type { ResolvedConfig } from "./config.js";
import { reuseJournalScreen } from "./recording-journal-reuse.js";
import { notifyReviewEvent } from "./notifications/events.js";

const { sourceStepId: sourceSchema, ...clickFields } = interactionSchema.shape;
void sourceSchema;
const clickSchema = z.strictObject(clickFields).refine(({ bounds }) => !bounds || (bounds.x + bounds.width <= 1.000001 && bounds.y + bounds.height <= 1.000001), "The target must fit within the screenshot.");
const reservationSchema = z.strictObject({
  id: z.string().uuid(),
  previousVisitId: z.string().uuid().nullable(),
  route: routeSchema,
  title: z.string().trim().min(1).max(160),
  capture: captureMetadataSchema,
  interaction: clickSchema.nullable(),
});
const completionSchema = z.discriminatedUnion("state", [
  z.strictObject({ state: z.literal("saved"), screenshot: z.string().min(1).max(MAX_CAPTURE_BODY_BYTES), capture: captureMetadataSchema, title: z.string().trim().min(1).max(160) }),
  z.strictObject({ state: z.literal("unavailable"), failure: z.enum(["left-before-ready", "not-ready", "interrupted", "failed"]) }),
]);

async function recording(transaction: Transaction, flowId: string) {
  const result = await transaction.execute({ sql: "SELECT * FROM flows WHERE id = ?", args: [flowId] });
  const flow = result.rows[0];
  if (!flow) throw new HttpError(404, "Recording not found.");
  if (flow.status !== "recording") throw new HttpError(409, "Completed recordings are preserved. Start a new version.");
  return flow;
}
async function visit(transaction: Transaction, flowId: string, visitId: string) {
  const found = await transaction.execute({ sql: "SELECT steps.* FROM recording_visits JOIN steps ON steps.id = recording_visits.step_id WHERE recording_visits.id = ? AND recording_visits.flow_id = ? AND reservation_json IS NOT NULL", args: [visitId, flowId] });
  if (!found.rows[0]) throw new HttpError(404, "Recorded visit not found.");
  return found.rows[0];
}

/** Reserve the path before any image renderer or accessibility audit is awaited. */
export async function journalVisit(request: Request, flowId: string, client: Client) {
  const input = reservationSchema.parse(await readJson(request));
  const reservation = JSON.stringify(input);
  const saved = await write(client, async (transaction) => {
    const flow = await recording(transaction, flowId);
    const duplicate = await transaction.execute({ sql: "SELECT * FROM recording_visits WHERE id = ?", args: [input.id] });
    if (duplicate.rows[0]) {
      if (duplicate.rows[0].flow_id !== flowId || duplicate.rows[0].reservation_json !== reservation) throw new HttpError(409, "This visit ID belongs to different recording evidence.");
      return { id: String(duplicate.rows[0].step_id), duplicate: true };
    }
    const last = await transaction.execute({ sql: "SELECT id, step_id, reservation_json FROM recording_visits WHERE flow_id = ? ORDER BY position DESC LIMIT 1", args: [flowId] });
    if ((last.rows[0]?.id ?? null) !== input.previousVisitId && !(input.previousVisitId === null && last.rows[0] && !last.rows[0].reservation_json)) throw new HttpError(409, "Save the preceding visit before this visit.");
    const steps = await transaction.execute({ sql: "SELECT id, position FROM steps WHERE flow_id = ? ORDER BY position", args: [flowId] });
    if (steps.rows.length >= 200) throw new HttpError(409, "A recording can contain up to 200 screens. Stop recording and start a new flow.");
    await transaction.execute({ sql: "INSERT INTO steps (id, flow_id, title, route, position, created_at, capture_json, capture_state) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", args: [input.id, flowId, input.title, input.route, steps.rows.length ? Number(steps.rows.at(-1)!.position) + 1 : 0, new Date().toISOString(), JSON.stringify(input.capture)] });
    await recordVisit({ transaction, flowId, flow, stepIds: steps.rows.map((row) => String(row.id)), stepId: input.id, visitId: input.id, interaction: input.interaction && last.rows[0] ? { ...input.interaction, sourceStepId: String(last.rows[0].step_id) } : undefined });
    await transaction.execute({ sql: "UPDATE recording_visits SET reservation_json = ? WHERE id = ?", args: [reservation, input.id] });
    await transaction.execute({ sql: "UPDATE flows SET board_revision = board_revision + 1, updated_at = ? WHERE id = ?", args: [new Date().toISOString(), flowId] });
    return { id: input.id, duplicate: false };
  });
  const count = await client.execute({ sql: "SELECT COUNT(*) AS count FROM steps WHERE flow_id = ?", args: [flowId] });
  return json({ ...saved, count: Number(count.rows[0].count) }, 201);
}

export async function completeJournalCapture(request: Request, flowId: string, visitId: string, client: Client, config: ResolvedConfig) {
  const input = completionSchema.parse(await readJson(request, MAX_CAPTURE_BODY_BYTES));
  const artifact = input.state === "saved" ? await prepareArtifact(input.screenshot, config) : null;
  let used = false;
  try {
    const result = await write(client, async (transaction) => {
      const flow = await recording(transaction, flowId);
      const screen = await visit(transaction, flowId, visitId);
      const key = artifact ? createHash("sha256").update(String(screen.route)).update("\0").update(artifact.bytes).digest("hex") : null;
      if (screen.capture_state === "saved") {
        if (key && key !== screen.capture_key) throw new HttpError(409, "This visit already has a different captured image.");
      } else if (input.state === "saved" && artifact) {
        const reused = input.capture.reason !== "manual" && await reuseJournalScreen(transaction, flowId, flow, String(screen.id), key!);
        if (!reused) {
          await insertArtifact(transaction, artifact);
          used = true;
          await transaction.execute({ sql: "UPDATE steps SET title = ?, screenshot = ?, capture_json = ?, capture_key = ?, capture_state = 'saved', capture_failure = NULL WHERE id = ?", args: [input.title, artifact.id, JSON.stringify(input.capture), key, screen.id] });
        }
      } else if (input.state === "unavailable") {
        await transaction.execute({ sql: "UPDATE steps SET capture_state = 'unavailable', capture_failure = ? WHERE id = ?", args: [input.failure, screen.id] });
      }
      await transaction.execute({ sql: "UPDATE flows SET updated_at = ?, board_revision = board_revision + 1 WHERE id = ?", args: [new Date().toISOString(), flowId] });
      const count = await transaction.execute({ sql: "SELECT COUNT(*) AS count FROM steps WHERE flow_id = ?", args: [flowId] });
      return { count: Number(count.rows[0].count) };
    });
    if (!used) await discardArtifact(artifact, config);
    return json(result);
  } catch (cause) {
    await discardArtifact(artifact, config).catch(() => undefined);
    throw cause;
  }
}

/** An audit updates its frozen visit; it never creates or reorders a path. */
export async function updateJournalAudit(request: Request, flowId: string, visitId: string, client: Client, config: ResolvedConfig) {
  const report = accessibilityReportSchema.parse(await readJson(request));
  const notify = await write(client, async (transaction) => {
    await recording(transaction, flowId);
    const screen = await visit(transaction, flowId, visitId);
    if (screen.capture_state !== "saved") throw new HttpError(409, "Save the captured image before its audit.");
    const capture = JSON.parse(String(screen.capture_json));
    // Reused screenshots retain their original exact-state audit.
    if (screen.id !== visitId) return false;
    await transaction.execute({ sql: "UPDATE steps SET capture_json = ? WHERE id = ?", args: [JSON.stringify({ ...capture, accessibility: report }), screen.id] });
    return report.status !== "unavailable" && report.violationCount > 0 && capture.accessibility?.status === "unavailable";
  });
  if (notify) await notifyReviewEvent(client, config, { type: "issues", title: "New accessibility issues", detail: "Accessibility issues saved on a recorded screen." });
  return json({ ok: true });
}
