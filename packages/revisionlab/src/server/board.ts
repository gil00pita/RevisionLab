import { z } from "zod";
import { HttpError } from "./security.js";
import type { RevisionLabBoard } from "./types.js";

export const MAX_BOARD_BYTES = 512_000;
const coordinate = z.number().finite().min(0).max(50_000);
const boardContentSchema = z
  .object({
    hiddenStepIds: z.array(z.string().uuid()).max(200).default([]),
    nodes: z
      .array(
        z
          .object({
            stepId: z.string().uuid(),
            x: coordinate,
            y: coordinate,
          })
          .strict(),
      )
      .max(200),
    edges: z
      .array(
        z
          .object({
            id: z
              .string()
              .min(1)
              .max(160)
              .regex(/^[a-zA-Z0-9_-]+$/),
            sourceStepId: z.string().uuid(),
            targetStepId: z.string().uuid(),
            label: z.string().trim().max(120),
            kind: z.enum(["recorded", "manual"]),
          })
          .strict(),
      )
      .max(1_000),
  })
  .strict();

export const boardInputSchema = boardContentSchema.extend({
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});

export function defaultBoard(
  stepIds: string[],
  revision = 0,
): RevisionLabBoard {
  return {
    revision,
    hiddenStepIds: [],
    nodes: stepIds.map((stepId, index) => ({
      stepId,
      // Long recordings wrap before the editable coordinate limit.
      x: 48 + (index % 100) * 360,
      y: 48 + Math.floor(index / 100) * 400,
    })),
    edges: stepIds.slice(1).map((targetStepId, index) => ({
      id: `recorded_${stepIds[index]}_${targetStepId}`,
      sourceStepId: stepIds[index],
      targetStepId,
      label: "",
      kind: "recorded",
    })),
  };
}

/** Add newly captured screens without restoring paths explicitly removed by editors. */
export function readBoard(
  stored: unknown,
  revision: number,
  stepIds: string[],
): RevisionLabBoard {
  const generated = defaultBoard(stepIds, revision);
  if (stored == null) return generated;
  let parsed: z.infer<typeof boardContentSchema>;
  try {
    parsed = boardContentSchema.parse(JSON.parse(String(stored)));
  } catch {
    throw new HttpError(503, "This recording's board could not be loaded.");
  }
  const known = new Set([
    ...parsed.nodes.map((node) => node.stepId),
    ...parsed.hiddenStepIds,
  ]);
  const actual = new Set(stepIds);
  const hiddenStepIds = parsed.hiddenStepIds.filter((id) => actual.has(id));
  const visible = new Set(stepIds.filter((id) => !hiddenStepIds.includes(id)));
  const nodes = [
    ...parsed.nodes.filter((node) => visible.has(node.stepId)),
    ...generated.nodes.filter((node) => !known.has(node.stepId)),
  ];
  const edges = parsed.edges.filter(
    (edge) => visible.has(edge.sourceStepId) && visible.has(edge.targetStepId),
  );
  for (const edge of generated.edges) {
    if (
      visible.has(edge.sourceStepId) &&
      visible.has(edge.targetStepId) &&
      (!known.has(edge.sourceStepId) || !known.has(edge.targetStepId)) &&
      !edges.some(
        (existing) =>
          existing.sourceStepId === edge.sourceStepId &&
          existing.targetStepId === edge.targetStepId,
      )
    )
      edges.push(edge);
  }
  return { revision, nodes, edges, hiddenStepIds };
}

export function validateBoardSteps(
  board: RevisionLabBoard,
  stepIds: string[],
): void {
  const actual = new Set(stepIds);
  const nodes = new Set(board.nodes.map((node) => node.stepId));
  const hidden = new Set(board.hiddenStepIds ?? []);
  if (
    nodes.size !== board.nodes.length ||
    hidden.size !== (board.hiddenStepIds?.length ?? 0) ||
    nodes.size + hidden.size !== actual.size ||
    board.nodes.some(
      (node) => !actual.has(node.stepId) || hidden.has(node.stepId),
    ) ||
    [...hidden].some((id) => !actual.has(id))
  ) {
    throw new HttpError(
      400,
      "Every screen must appear exactly once, either on the board or in its removed-screen list.",
    );
  }
  const edgeIds = new Set<string>();
  const pairs = new Set<string>();
  for (const edge of board.edges) {
    const pair = `${edge.sourceStepId}:${edge.targetStepId}`;
    if (
      !nodes.has(edge.sourceStepId) ||
      !nodes.has(edge.targetStepId) ||
      edge.sourceStepId === edge.targetStepId ||
      edgeIds.has(edge.id) ||
      pairs.has(pair)
    ) {
      throw new HttpError(
        400,
        "Connections must link distinct screens in this recording without duplicate paths or IDs.",
      );
    }
    if (
      edge.kind === "recorded" &&
      stepIds.indexOf(edge.targetStepId) !==
        stepIds.indexOf(edge.sourceStepId) + 1
    ) {
      throw new HttpError(
        400,
        "Only consecutive captured screens can have a recorded connection.",
      );
    }
    edgeIds.add(edge.id);
    pairs.add(pair);
  }
}
