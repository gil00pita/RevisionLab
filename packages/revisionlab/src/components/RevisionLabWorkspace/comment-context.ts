import type {
  RevisionLabComment,
  RevisionLabState,
} from "../../server/types.js";

export function commentGroupKey(comment: RevisionLabComment): string {
  if (comment.edgeId) return `edge:${comment.flowId}:${comment.edgeId}`;
  return comment.stepId ?? comment.flowId ?? comment.route;
}

export function commentContextLabel(
  comment: RevisionLabComment,
  data: RevisionLabState,
): string {
  const flow = data.flows.find((item) => item.id === comment.flowId);
  if (comment.edgeId) {
    const edge =
      comment.edge ??
      flow?.board.edges.find((item) => item.id === comment.edgeId);
    const source = flow?.steps.find(
      (step) => step.id === edge?.sourceStepId,
    )?.title;
    const target = flow?.steps.find(
      (step) => step.id === edge?.targetStepId,
    )?.title;
    const path =
      edge?.label ||
      (source && target ? `${source} → ${target}` : "Connection");
    return `${flow?.name ?? "Flow"} · v${flow?.version ?? "?"} · ${path}${comment.edge?.archived ? " (removed)" : ""}`;
  }
  const step = flow?.steps.find((item) => item.id === comment.stepId);
  return step?.title ?? comment.route;
}
