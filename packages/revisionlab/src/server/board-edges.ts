import type { Transaction } from "@libsql/client";
import { HttpError } from "./security.js";
import type { RevisionLabBoard } from "./types.js";

/** Keep removed connection identities so their discussions can never be retargeted. */
export async function syncBoardEdges(
  transaction: Transaction,
  flowId: string,
  edges: RevisionLabBoard["edges"],
): Promise<void> {
  const result = await transaction.execute({
    sql: "SELECT * FROM board_edges WHERE flow_id = ?",
    args: [flowId],
  });
  const existing = new Map(result.rows.map((row) => [String(row.id), row]));
  const active = new Set(edges.map((edge) => edge.id));
  for (const edge of edges) {
    const previous = existing.get(edge.id);
    if (
      previous &&
      (previous.source_step_id !== edge.sourceStepId ||
        previous.target_step_id !== edge.targetStepId ||
        previous.kind !== edge.kind)
    ) {
      throw new HttpError(
        409,
        "A saved connection cannot change its endpoints or recorded origin. Create a new path instead.",
      );
    }
  }
  const now = new Date().toISOString();
  for (const row of result.rows) {
    if (row.archived_at == null && !active.has(String(row.id))) {
      await transaction.execute({
        sql: "UPDATE board_edges SET archived_at = ? WHERE flow_id = ? AND id = ?",
        args: [now, flowId, row.id],
      });
    }
  }
  for (const edge of edges) {
    const previous = existing.get(edge.id);
    if (!previous) {
      await transaction.execute({
        sql: `INSERT INTO board_edges (flow_id, id, source_step_id, target_step_id, label, kind)
          VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          flowId,
          edge.id,
          edge.sourceStepId,
          edge.targetStepId,
          edge.label,
          edge.kind,
        ],
      });
    } else if (previous.label !== edge.label || previous.archived_at != null) {
      await transaction.execute({
        sql: "UPDATE board_edges SET label = ?, archived_at = NULL WHERE flow_id = ? AND id = ?",
        args: [edge.label, flowId, edge.id],
      });
    }
  }
}
