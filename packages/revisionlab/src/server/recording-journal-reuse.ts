import type { Transaction } from "@libsql/client";
import { defaultBoard, readBoard } from "./board.js";

/** Fold untouched provisional cards into an identical screenshot, retaining visit order. */
export async function reuseJournalScreen(transaction: Transaction, flowId: string, flow: Record<string, unknown>, provisionalId: string, key: string) {
  const screens = await transaction.execute({ sql: "SELECT id, position, capture_key FROM steps WHERE flow_id = ? ORDER BY position", args: [flowId] });
  const existing = screens.rows.find((row) => row.id !== provisionalId && row.capture_key === key);
  if (!existing) return false;
  const canonicalId = String(existing.id);
  const stepIds = screens.rows.map((row) => String(row.id));
  const board = readBoard(flow.board_json, Number(flow.board_revision), stepIds);
  const node = board.nodes.find((item) => item.stepId === provisionalId);
  const original = defaultBoard(stepIds).nodes.find((item) => item.stepId === provisionalId);
  const attached = await transaction.execute({ sql: "SELECT id FROM comments WHERE step_id = ? UNION ALL SELECT id FROM board_edges WHERE source_step_id = ? OR target_step_id = ? LIMIT 1", args: [provisionalId, provisionalId, provisionalId] });
  if (attached.rows.length || board.hiddenStepIds?.includes(provisionalId) || (node && original && (node.x !== original.x || node.y !== original.y)) || board.edges.some((edge) => (edge.sourceStepId === provisionalId || edge.targetStepId === provisionalId) && (edge.kind === "manual" || edge.label))) return false;
  const visits = await transaction.execute({ sql: "SELECT source_step_id, step_id FROM recording_visits WHERE flow_id = ?", args: [flowId] });
  const previousPairs = new Set(visits.rows.filter((visit) => visit.source_step_id !== provisionalId && visit.step_id !== provisionalId).map((visit) => `${visit.source_step_id}_${visit.step_id}`));
  const previousEdges = new Set(board.edges.filter((edge) => edge.sourceStepId !== provisionalId && edge.targetStepId !== provisionalId).map((edge) => `${edge.sourceStepId}_${edge.targetStepId}`));
  const seen = new Set<string>();
  const hidden = new Set(board.hiddenStepIds);
  const orderedEdges = [...board.edges].sort((left, right) => Number(left.sourceStepId === provisionalId || left.targetStepId === provisionalId) - Number(right.sourceStepId === provisionalId || right.targetStepId === provisionalId));
  const edges = orderedEdges.flatMap((edge) => {
    const sourceStepId = edge.sourceStepId === provisionalId ? canonicalId : edge.sourceStepId;
    const targetStepId = edge.targetStepId === provisionalId ? canonicalId : edge.targetStepId;
    const pair = `${sourceStepId}_${targetStepId}`;
    const changed = sourceStepId !== edge.sourceStepId || targetStepId !== edge.targetStepId;
    if (hidden.has(sourceStepId) || hidden.has(targetStepId) || sourceStepId === targetStepId || seen.has(pair) || (edge.kind === "recorded" && ( (changed && previousPairs.has(pair) && !previousEdges.has(pair))))) return [];
    seen.add(pair);
    return [{ ...edge, sourceStepId, targetStepId, id: changed ? `recorded_${pair}` : edge.id }];
  });
  await transaction.execute({ sql: "UPDATE recording_visits SET source_step_id = CASE WHEN source_step_id = ? THEN ? ELSE source_step_id END, step_id = CASE WHEN step_id = ? THEN ? ELSE step_id END WHERE flow_id = ?", args: [provisionalId, canonicalId, provisionalId, canonicalId, flowId] });
  await transaction.execute({ sql: "UPDATE flows SET board_json = ? WHERE id = ?", args: [JSON.stringify({ nodes: board.nodes.filter((item) => item.stepId !== provisionalId), edges, hiddenStepIds: board.hiddenStepIds }), flowId] });
  await transaction.execute({ sql: "DELETE FROM steps WHERE id = ?", args: [provisionalId] });
  return true;
}
