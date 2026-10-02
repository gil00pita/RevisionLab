import type { Client } from "@libsql/client";
import { requireRole } from "./authentication.js";
import { write } from "./database.js";
import { discardRecordingInTransaction } from "./recording-discard.js";
import { json } from "./security.js";
import type { RevisionLabActor } from "./types.js";

export async function finishRecording(
  flowId: string,
  client: Client,
  actor: RevisionLabActor,
): Promise<Response> {
  requireRole(actor, "editor");
  const outcome = await write(client, async (transaction) => {
    const found = await transaction.execute({
      sql: "SELECT status FROM flows WHERE id = ?",
      args: [flowId],
    });
    // Retrying after a lost response must acknowledge the already-ended session.
    if (!found.rows[0]) return "empty";
    if (found.rows[0].status === "complete") return "saved";
    const screens = await transaction.execute({
      sql: "SELECT id FROM steps WHERE flow_id = ? LIMIT 1",
      args: [flowId],
    });
    if (!screens.rows.length) {
      // Check and cleanup share a transaction: an unacknowledged upload must
      // either be preserved and completed or rejected after the draft is gone.
      await discardRecordingInTransaction(flowId, transaction, actor);
      return "empty";
    }
    await transaction.execute({
      sql: "UPDATE flows SET status = 'complete', updated_at = ? WHERE id = ?",
      args: [new Date().toISOString(), flowId],
    });
    return "saved";
  });
  return json({ outcome });
}
