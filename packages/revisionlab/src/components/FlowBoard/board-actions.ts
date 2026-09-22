import type { BoardAutosaveController } from "./autosave-controller.js";
import { arrangeNodes, clampPosition } from "./geometry.js";
import type { BoardEdge } from "./types.js";

/** Stable UI callbacks always read the latest controller state, not render snapshots. */
export function boardActions(controller: BoardAutosaveController) {
  return {
    moveNode(stepId: string, x: number, y: number) {
      controller.change((current) => ({
        ...current,
        nodes: current.nodes.map((node) =>
          node.stepId === stepId
            ? { ...node, x: clampPosition(x), y: clampPosition(y) }
            : node,
        ),
      }));
    },
    addEdge(sourceStepId: string, targetStepId: string, label: string) {
      const board = controller.getSnapshot().board;
      if (
        sourceStepId === targetStepId ||
        !board.nodes.some((node) => node.stepId === sourceStepId) ||
        !board.nodes.some((node) => node.stepId === targetStepId) ||
        board.edges.some(
          (edge) =>
            edge.sourceStepId === sourceStepId &&
            edge.targetStepId === targetStepId,
        )
      ) {
        controller.reportError(
          "Choose two different screens that do not already have this connection.",
        );
        return null;
      }
      const edge: BoardEdge = {
        id: crypto.randomUUID(),
        sourceStepId,
        targetStepId,
        label: label.trim(),
        kind: "manual",
      };
      return controller.change((current) => ({
        ...current,
        edges: [...current.edges, edge],
      }))
        ? edge.id
        : null;
    },
    removeEdge(id: string) {
      controller.change((current) => ({
        ...current,
        edges: current.edges.filter((edge) => edge.id !== id),
      }));
    },
    labelEdge(id: string, label: string) {
      controller.change(
        (current) => ({
          ...current,
          edges: current.edges.map((edge) =>
            edge.id === id ? { ...edge, label } : edge,
          ),
        }),
        `label:${id}`,
      );
    },
    removeScreen(stepId: string) {
      controller.change((current) =>
        !current.nodes.some((node) => node.stepId === stepId)
          ? current
          : {
              ...current,
              nodes: current.nodes.filter((node) => node.stepId !== stepId),
              hiddenStepIds: [...(current.hiddenStepIds ?? []), stepId],
              edges: current.edges.filter(
                (edge) =>
                  edge.sourceStepId !== stepId && edge.targetStepId !== stepId,
              ),
            },
      );
    },
    restoreScreen(stepId: string) {
      controller.change((current) =>
        !(current.hiddenStepIds ?? []).includes(stepId)
          ? current
          : {
              ...current,
              nodes: [
                ...current.nodes,
                {
                  stepId,
                  x: 48,
                  y: clampPosition(
                    Math.max(0, ...current.nodes.map((node) => node.y + 360)),
                  ),
                },
              ],
              hiddenStepIds: (current.hiddenStepIds ?? []).filter(
                (id) => id !== stepId,
              ),
            },
      );
    },
    arrange() {
      controller.change((current) => ({
        ...current,
        nodes: arrangeNodes(current.nodes.map((node) => node.stepId)),
      }));
    },
    beginMove: (id: string) => controller.beginMove(id),
    endMove: () => controller.endMove(),
    undo: () => controller.undo(),
    retry: () => controller.retry(),
    flush: () => controller.flush(),
    discard: () => controller.discard(),
  };
}
