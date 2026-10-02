import type { Client, Transaction } from "@libsql/client";
import { requireRole } from "./authentication.js";
import type { ResolvedConfig } from "./config.js";
import { write } from "./database.js";
import { HttpError, json } from "./security.js";
import type { RevisionLabActor } from "./types.js";

/** Only temporary recordings may be discarded; completed versions remain immutable. */
export async function discardRecording(
  flowId: string,
  client: Client,
  _config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<Response> {
  requireRole(actor, "editor");
  await write(client, async (transaction) => {
    await discardRecordingInTransaction(flowId, transaction, actor);
  });
  return json({ ok: true });
}

export async function discardRecordingInTransaction(
  flowId: string,
  transaction: Transaction,
  actor: RevisionLabActor,
): Promise<void> {
  const found = await transaction.execute({
    sql: "SELECT status, created_by FROM flows WHERE id = ?",
    args: [flowId],
  });
  const flow = found.rows[0];
  if (flow) {
    requireCreator(actor, String(flow.created_by));
    if (flow.status !== "recording")
      throw new HttpError(409, "Completed recordings cannot be discarded.");
    const descendants = await transaction.execute({
      sql: "SELECT id FROM flows WHERE previous_version_id = ? LIMIT 1",
      args: [flowId],
    });
    if (descendants.rows.length)
      throw new HttpError(
        409,
        "A recording with later versions cannot be discarded.",
      );

    // Immutable screenshot artifacts remain private and retained while a
    // 30-day workspace history version can still restore their steps.
    // Explicitly remove dependents as well as relying on schema cascades, since
    // externally supplied SQLite/libSQL configurations may disable foreign keys.
    await transaction.execute({
      sql: "DELETE FROM comments WHERE flow_id = ? OR step_id IN (SELECT id FROM steps WHERE flow_id = ?)",
      args: [flowId, flowId],
    });
    await transaction.execute({
      sql: "DELETE FROM board_edges WHERE flow_id = ?",
      args: [flowId],
    });
    await transaction.execute({
      sql: "DELETE FROM recording_visits WHERE flow_id = ?",
      args: [flowId],
    });
    await transaction.execute({
      sql: "DELETE FROM steps WHERE flow_id = ?",
      args: [flowId],
    });
    await transaction.execute({
      sql: "DELETE FROM flows WHERE id = ?",
      args: [flowId],
    });
  }
}

function requireCreator(actor: RevisionLabActor, createdBy: string): void {
  if (actor.role !== "owner" && actor.id !== createdBy)
    throw new HttpError(
      403,
      "Only the recording creator or an owner can discard it.",
    );
}
