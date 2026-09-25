import type { Client } from "@libsql/client";
import { discardArtifact } from "./artifacts.js";
import { requireRole } from "./authentication.js";
import type { ResolvedConfig } from "./config.js";
import { write } from "./database.js";
import { HttpError, json } from "./security.js";
import type { RevisionLabActor } from "./types.js";

/** Only temporary recordings may be discarded; completed versions remain immutable. */
export async function discardRecording(
  flowId: string,
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<Response> {
  requireRole(actor, "editor");
  const artifacts = await write(client, async (transaction) => {
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

      const captured = await transaction.execute({
        sql: `SELECT DISTINCT artifacts.id, artifacts.storage FROM artifacts
          JOIN steps ON steps.screenshot = artifacts.id
          WHERE steps.flow_id = ? AND NOT EXISTS (
            SELECT 1 FROM steps AS other
            WHERE other.screenshot = artifacts.id AND other.flow_id <> ?
          )`,
        args: [flowId, flowId],
      });
      for (const artifact of captured.rows) {
        if (artifact.storage !== "database") {
          // Preserve only opaque cleanup keys, never recording content. Failed storage
          // deletion remains retryable after the draft and its API access are removed.
          await transaction.execute({
            sql: "INSERT INTO discarded_artifacts (id, flow_id, created_by, storage) VALUES (?, ?, ?, ?)",
            args: [artifact.id, flowId, flow.created_by, artifact.storage],
          });
        }
        await transaction.execute({
          sql: "DELETE FROM artifacts WHERE id = ?",
          args: [artifact.id],
        });
      }
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
    const pending = await transaction.execute({
      sql: "SELECT id, storage, created_by FROM discarded_artifacts WHERE flow_id = ?",
      args: [flowId],
    });
    for (const artifact of pending.rows)
      requireCreator(actor, String(artifact.created_by));
    return pending.rows.map((artifact) => ({
      id: String(artifact.id),
      storage: String(artifact.storage) as "file" | "custom",
    }));
  });

  const cleanup = await Promise.allSettled(
    artifacts.map(async (artifact) => {
      await discardArtifact(artifact, config);
      await write(client, async (transaction) => {
        await transaction.execute({
          sql: "DELETE FROM discarded_artifacts WHERE id = ? AND flow_id = ?",
          args: [artifact.id, flowId],
        });
      });
    }),
  );
  if (cleanup.some((result) => result.status === "rejected"))
    throw new HttpError(
      503,
      "The recording was discarded, but screenshot cleanup is pending. Retry discarding to finish cleanup.",
    );
  return json({ ok: true });
}

function requireCreator(actor: RevisionLabActor, createdBy: string): void {
  if (actor.role !== "owner" && actor.id !== createdBy)
    throw new HttpError(
      403,
      "Only the recording creator or an owner can discard it.",
    );
}
