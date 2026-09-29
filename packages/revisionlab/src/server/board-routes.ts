import type { Client } from "@libsql/client";
import {
  boardInputSchema,
  MAX_BOARD_BYTES,
  readBoard,
  validateBoardSteps,
} from "./board.js";
import { syncBoardEdges } from "./board-edges.js";
import { write } from "./database.js";
import { HttpError, json, readJson } from "./security.js";

export async function saveBoard(
  request: Request,
  flowId: string,
  client: Client,
): Promise<Response> {
  const input = boardInputSchema.parse(
    await readJson(request, MAX_BOARD_BYTES),
  );
  const board = await write(client, async (transaction) => {
    const found = await transaction.execute({
      sql: "SELECT board_json, board_revision FROM flows WHERE id = ?",
      args: [flowId],
    });
    if (!found.rows[0]) throw new HttpError(404, "Recording not found.");
    if (Number(found.rows[0].board_revision) !== input.revision) {
      throw new HttpError(
        409,
        "This board changed since you opened it. Reload the latest board before saving.",
      );
    }
    const steps = await transaction.execute({
      sql: "SELECT id FROM steps WHERE flow_id = ? ORDER BY position",
      args: [flowId],
    });
    const stepIds = steps.rows.map((row) => String(row.id));
    const visits = await transaction.execute({
      sql: "SELECT source_step_id, step_id FROM recording_visits WHERE flow_id = ? ORDER BY position",
      args: [flowId],
    });
    let recordedPairs: Set<string> | undefined;
    if (visits.rows.length) {
      recordedPairs = new Set(
        visits.rows
          .filter((visit) => visit.source_step_id != null)
          .map((visit) => `${visit.source_step_id}:${visit.step_id}`),
      );
      // Captures predating visit tracking retain their historical sequence.
      const firstSource = visits.rows[0].source_step_id;
      const legacyEnd =
        firstSource == null ? -1 : stepIds.indexOf(String(firstSource));
      for (let index = 1; index <= legacyEnd; index++)
        recordedPairs.add(`${stepIds[index - 1]}:${stepIds[index]}`);
    }
    validateBoardSteps(input, stepIds, recordedPairs);
    // Seed generated/legacy identities before checking the replacement graph.
    const previous = readBoard(
      found.rows[0].board_json,
      input.revision,
      stepIds,
    );
    await syncBoardEdges(transaction, flowId, previous.edges);
    await syncBoardEdges(transaction, flowId, input.edges);
    const next = { ...input, revision: input.revision + 1 };
    await transaction.execute({
      sql: "UPDATE flows SET board_json = ?, board_revision = ?, updated_at = ? WHERE id = ? AND board_revision = ?",
      args: [
        JSON.stringify({
          nodes: input.nodes,
          edges: input.edges,
          hiddenStepIds: input.hiddenStepIds,
        }),
        next.revision,
        new Date().toISOString(),
        flowId,
        input.revision,
      ],
    });
    return next;
  });
  return json({ board });
}
