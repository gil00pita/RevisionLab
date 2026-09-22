import type { Transaction } from "@libsql/client";
import { z } from "zod";
import { syncBoardEdges } from "./board-edges.js";
import { readBoard } from "./board.js";
import { routeSchema } from "./flow-routes.js";
import { HttpError } from "./security.js";

export const commentSchema = z
  .object({
    body: z.string().trim().min(1).max(4_000),
    route: routeSchema.optional(),
    flowId: z.string().uuid().nullable().optional(),
    stepId: z.string().uuid().nullable().optional(),
    edgeId: z
      .string()
      .min(1)
      .max(160)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .nullable()
      .optional(),
    anchor: z
      .object({
        x: z.number().finite().min(0).max(1),
        y: z.number().finite().min(0).max(1),
      })
      .strict()
      .nullable()
      .optional(),
    parentId: z.string().uuid().nullable().optional(),
  })
  .strict();

export async function commentContext(
  transaction: Transaction,
  input: z.infer<typeof commentSchema>,
) {
  if (input.parentId) {
    const result = await transaction.execute({
      sql: "SELECT flow_id, step_id, edge_id, route, parent_id FROM comments WHERE id = ?",
      args: [input.parentId],
    });
    const parent = result.rows[0];
    if (!parent) throw new HttpError(404, "Comment thread not found.");
    if (parent.parent_id != null)
      throw new HttpError(400, "Reply to the original comment in this thread.");
    if (input.anchor != null)
      throw new HttpError(400, "Replies use their thread's location.");
    if (
      (input.flowId !== undefined && input.flowId !== parent.flow_id) ||
      (input.stepId !== undefined && input.stepId !== parent.step_id) ||
      (input.edgeId !== undefined && input.edgeId !== parent.edge_id) ||
      (input.route !== undefined && input.route !== parent.route)
    )
      throw new HttpError(
        400,
        "Replies must use the same recording, screen, connection, and route as their thread.",
      );
    return {
      flowId: parent.flow_id == null ? null : String(parent.flow_id),
      stepId: parent.step_id == null ? null : String(parent.step_id),
      edgeId: parent.edge_id == null ? null : String(parent.edge_id),
      route: String(parent.route),
    };
  }
  if (input.edgeId) {
    if (!input.flowId || input.stepId != null || input.anchor != null)
      throw new HttpError(
        400,
        "Connection comments need a recording and cannot target a screen or screenshot pin.",
      );
    const result = await transaction.execute({
      sql: "SELECT route, board_json, board_revision FROM flows WHERE id = ?",
      args: [input.flowId],
    });
    const flow = result.rows[0];
    if (!flow) throw new HttpError(404, "Recording not found.");
    if (input.route !== undefined && input.route !== flow.route)
      throw new HttpError(400, "The comment route must match its recording.");
    const steps = await transaction.execute({
      sql: "SELECT id FROM steps WHERE flow_id = ? ORDER BY position",
      args: [input.flowId],
    });
    const board = readBoard(
      flow.board_json,
      Number(flow.board_revision),
      steps.rows.map((row) => String(row.id)),
    );
    if (!board.edges.some((edge) => edge.id === input.edgeId))
      throw new HttpError(
        409,
        "This connection is not on the saved board. Save a new path before commenting, or reopen an existing archived thread.",
      );
    // The board lookup, registration, and comment insert share the write lock.
    await syncBoardEdges(transaction, input.flowId, board.edges);
    return {
      flowId: input.flowId,
      stepId: null,
      edgeId: input.edgeId,
      route: String(flow.route),
    };
  }
  if (!input.route) throw new HttpError(400, "A comment route is required.");
  let flowId = input.flowId ?? null;
  if (input.anchor && !input.stepId)
    throw new HttpError(400, "Pinned comments need a captured screen.");
  if (input.stepId) {
    const result = await transaction.execute({
      sql: "SELECT flow_id, route, screenshot FROM steps WHERE id = ?",
      args: [input.stepId],
    });
    const step = result.rows[0];
    if (!step) throw new HttpError(404, "Screen not found.");
    if (flowId && step.flow_id !== flowId)
      throw new HttpError(
        400,
        "This screen does not belong to the selected recording.",
      );
    if (step.route !== input.route)
      throw new HttpError(
        400,
        "The comment route must match its captured screen.",
      );
    if (input.anchor && !step.screenshot)
      throw new HttpError(400, "Pinned comments need a screen image.");
    flowId = String(step.flow_id);
  }
  if (flowId) {
    const flow = await transaction.execute({
      sql: "SELECT id FROM flows WHERE id = ?",
      args: [flowId],
    });
    if (!flow.rows[0]) throw new HttpError(404, "Recording not found.");
  }
  return {
    flowId,
    stepId: input.stepId ?? null,
    edgeId: null,
    route: input.route,
  };
}
