import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "../../../client/api.js";
import type { WorkspaceState } from "../../../workspace-instances.js";

export function useWorkspaceData(apiPath: string, selection: string) {
  const [snapshot, setSnapshot] = useState<{
    selection: string;
    data: WorkspaceState | null;
    error: Error | null;
    syncedAt: number | null;
  }>({ selection: "", data: null, error: null, syncedAt: null });
  const gate = useRef({ generation: 0, pending: 0 });
  const refresh = useCallback(async () => {
    const state = gate.current;
    const current = ++state.generation;
    state.pending++;
    try {
      const data = await apiRequest<WorkspaceState>(
        apiPath,
        `workspace-state?workspace=${encodeURIComponent(selection)}`,
      );
      const loadedAt = Date.now();
      data.workspaces = data.workspaces.map((source) => ({
        ...source,
        lastLoadedAt:
          source.status === "connected" &&
          (selection === "all" || source.id === selection)
            ? loadedAt
            : undefined,
      }));
      if (current === state.generation)
        setSnapshot((previous) => {
          const complete = data.workspaces
            .filter((source) => selection === "all" || source.id === selection)
            .every((source) => source.status === "connected");
          const syncedAt = complete
            ? Date.now()
            : previous.selection === selection
              ? previous.syncedAt
              : null;
          if (previous.selection === selection && previous.data) {
            const unavailable = new Set(
              data.workspaces
                .filter((source) => source.status === "unavailable")
                .map((source) => source.id),
            );
            // Keep mounted boards/drafts and clearly marked last-loaded evidence during an outage.
            return {
              selection,
              error: null,
              syncedAt,
              data: {
                ...data,
                workspaces: data.workspaces.map((source) => ({
                  ...source,
                  dashboard: unavailable.has(source.id)
                    ? previous.data?.workspaces.find(
                        (item) => item.id === source.id,
                      )?.dashboard
                    : source.dashboard,
                  lastLoadedAt: unavailable.has(source.id)
                    ? previous.data?.workspaces.find(
                        (item) => item.id === source.id,
                      )?.lastLoadedAt
                    : source.lastLoadedAt,
                })),
                flows: [
                  ...data.flows,
                  ...previous.data.flows.filter((item) =>
                    unavailable.has(item.workspace?.id ?? "local"),
                  ),
                ],
                comments: [
                  ...data.comments,
                  ...previous.data.comments.filter((item) =>
                    unavailable.has(item.workspace?.id ?? "local"),
                  ),
                ],
                personas: [
                  ...data.personas,
                  ...previous.data.personas.filter((item) =>
                    unavailable.has(item.workspace?.id ?? "local"),
                  ),
                ],
              },
            };
          }
          return { selection, data, error: null, syncedAt };
        });
    } catch (cause) {
      if (current !== state.generation) return;
      const error =
        cause instanceof Error
          ? cause
          : new Error("Could not load workspaces.");
      setSnapshot((previous) => ({
        selection,
        data:
          previous.selection === selection &&
          !(error instanceof ApiError && error.status === 401)
            ? previous.data
            : null,
        error,
        syncedAt: previous.selection === selection ? previous.syncedAt : null,
      }));
    } finally {
      state.pending--;
    }
  }, [apiPath, selection]);
  useEffect(() => {
    const state = gate.current;
    let disposed = false;
    const poll = () => {
      if (!disposed && !state.pending && document.visibilityState === "visible")
        void refresh();
    };
    void Promise.resolve().then(() => {
      if (!disposed) void refresh();
    });
    const timer = setInterval(poll, 15_000);
    window.addEventListener("focus", poll);
    return () => {
      disposed = true;
      state.generation++;
      clearInterval(timer);
      window.removeEventListener("focus", poll);
    };
  }, [refresh]);
  const current = snapshot.selection === selection;
  return {
    data: current ? snapshot.data : null,
    error: current ? snapshot.error : null,
    loading: !current || (!snapshot.data && !snapshot.error),
    syncedAt: current ? snapshot.syncedAt : null,
    refresh,
  };
}
