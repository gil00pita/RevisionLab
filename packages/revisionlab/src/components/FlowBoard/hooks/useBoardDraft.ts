import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabState } from "../../../server/types.js";
import { BoardAutosaveController } from "../autosave-controller.js";
import { boardActions } from "../board-actions.js";
import type { FlowBoardData, FlowBoardProps } from "../types.js";

export function useBoardDraft({
  flow,
  apiPath,
  onRefresh,
  onDirtyChange,
}: FlowBoardProps) {
  // FlowReview is keyed by flow ID, so history belongs to one exact version.
  const [controller] = useState(
    () =>
      new BoardAutosaveController(flow.board, {
        async persist(board) {
          const result = await apiRequest<{ board: FlowBoardData }>(
            apiPath,
            `flows/${flow.id}/board`,
            {
              method: "PATCH",
              body: JSON.stringify(board),
            },
          );
          return result.board;
        },
        async load() {
          const data = await apiRequest<RevisionLabState>(apiPath, "state");
          const saved = data.flows.find((item) => item.id === flow.id);
          if (!saved) throw new Error("This recording is no longer available.");
          return saved.board;
        },
      }),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const actions = useMemo(() => boardActions(controller), [controller]);

  useEffect(() => {
    controller.resume();
    return () => controller.pause();
  }, [controller]);
  useEffect(() => {
    controller.receive(flow.board);
  }, [controller, flow.board]);
  useEffect(() => {
    let revision = controller.getSnapshot().savedBoard.revision;
    return controller.subscribe(() => {
      const next = controller.getSnapshot();
      const acknowledged = next.savedBoard.revision > revision;
      revision = next.savedBoard.revision;
      if (acknowledged && next.saving) void onRefresh().catch(() => undefined);
    });
  }, [controller, onRefresh]);
  useEffect(() => {
    onDirtyChange?.(state.dirty);
    return () => onDirtyChange?.(false);
  }, [state.dirty, onDirtyChange]);
  useEffect(() => {
    if (!state.dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.dirty]);

  return { ...state, ...actions };
}
