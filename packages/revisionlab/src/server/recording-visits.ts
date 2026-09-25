import { randomUUID } from "node:crypto";
import type { Transaction } from "@libsql/client";
import { z } from "zod";
import { defaultBoard, readBoard } from "./board.js";
import { HttpError } from "./security.js";

const normalized = z.number().finite().min(0).max(1);
const point = z.object({ x: normalized, y: normalized }).strict();
export const interactionSchema = z
  .object({
    sourceStepId: z.string().uuid(),
    target: z
      .object({
        selector: z.string().min(1).max(2000),
        tag: z.string().min(1).max(80),
        label: z.string().min(1).max(160),
      })
      .strict(),
    point: point.nullable(),
    bounds: point
      .extend({ width: normalized, height: normalized })
      .strict()
      .nullable(),
    activation: z.enum(["pointer", "keyboard"]),
  })
  .strict()
  .refine(
    ({ bounds }) =>
      !bounds ||
      (bounds.x + bounds.width <= 1.000001 &&
        bounds.y + bounds.height <= 1.000001),
    "The target must fit within the screenshot.",
  );

export async function recordVisit({
  transaction,
  flowId,
  flow,
  stepIds,
  stepId,
  interaction,
}: {
  transaction: Transaction;
  flowId: string;
  flow: Record<string, unknown>;
  stepIds: string[];
  stepId: string;
  interaction?: z.infer<typeof interactionSchema>;
}) {
  const visits = await transaction.execute({
    sql: "SELECT * FROM recording_visits WHERE flow_id = ? ORDER BY position",
    args: [flowId],
  });
  if (visits.rows.length >= 1000)
    throw new HttpError(
      409,
      "A recording can contain up to 1000 visits. Start a new flow to continue.",
    );
  const sourceId = visits.rows.length
    ? String(visits.rows.at(-1)!.step_id)
    : (stepIds.at(-1) ?? null);
  if (interaction && interaction.sourceStepId !== sourceId)
    throw new HttpError(
      400,
      "Click evidence must belong to the preceding screen in this recording.",
    );
  const board = readBoard(
    flow.board_json,
    Number(flow.board_revision),
    stepIds,
  );
  if (!stepIds.includes(stepId)) {
    board.nodes.push(defaultBoard([...stepIds, stepId]).nodes.at(-1)!);
  }
  const hidden = new Set(board.hiddenStepIds);
  if (
    sourceId &&
    sourceId !== stepId &&
    !hidden.has(sourceId) &&
    !hidden.has(stepId) &&
    !visits.rows.some(
      (visit) => visit.source_step_id === sourceId && visit.step_id === stepId,
    ) &&
    !board.edges.some(
      (edge) => edge.sourceStepId === sourceId && edge.targetStepId === stepId,
    )
  ) {
    if (board.edges.length >= 1000)
      throw new HttpError(409, "A board can contain up to 1000 connections.");
    board.edges.push({
      id: `recorded_${sourceId}_${stepId}`,
      sourceStepId: sourceId,
      targetStepId: stepId,
      kind: "recorded",
      label: "",
    });
  }
  const evidence = interaction
    ? {
        target: interaction.target,
        point: interaction.point,
        bounds: interaction.bounds,
        activation: interaction.activation,
      }
    : null;
  await transaction.execute({
    sql: "INSERT INTO recording_visits (id, flow_id, source_step_id, step_id, position, interaction_json) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      randomUUID(),
      flowId,
      sourceId,
      stepId,
      visits.rows.length,
      evidence ? JSON.stringify(evidence) : null,
    ],
  });
  await transaction.execute({
    sql: "UPDATE flows SET board_json = ? WHERE id = ?",
    args: [
      JSON.stringify({
        nodes: board.nodes,
        edges: board.edges,
        hiddenStepIds: board.hiddenStepIds,
      }),
      flowId,
    ],
  });
}
