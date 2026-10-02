import { useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import {
  sourceApiPath,
  sourceCanEdit,
  type WorkspaceState,
} from "../../../workspace-instances.js";

export function useFlowDeletion({
  data,
  apiPath,
  blocked,
  beforeDelete,
  onRefresh,
}: {
  data: WorkspaceState | null;
  apiPath: string;
  blocked: boolean;
  beforeDelete: () => Promise<boolean>;
  onRefresh: () => Promise<void>;
}) {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const [removed, setRemoved] = useState({
    families: new Set<string>(),
    versions: new Set<string>(),
  });
  async function remove(familyIds: string[]) {
    if (running.current || blocked)
      throw new Error("Wait for the current workspace action to finish.");
    running.current = true;
    setPending(true);
    try {
      if (!(await beforeDelete()))
        throw new Error(
          "Finish saving your board changes before deleting flows.",
        );
      const groups = new Map<string, string[]>();
      for (const familyId of familyIds) {
        const flow = data?.flows.find((item) => item.familyId === familyId);
        if (!flow || !data || !sourceCanEdit(data.actor.role, flow.workspace))
          throw new Error(
            "You cannot delete one of the selected workspace flows.",
          );
        const endpoint = sourceApiPath(apiPath, flow.workspace);
        groups.set(endpoint, [...(groups.get(endpoint) ?? []), familyId]);
      }
      for (const [endpoint, ids] of groups) {
        try {
          await apiRequest(endpoint, "flows/delete", {
            method: "POST",
            body: JSON.stringify({ familyIds: ids }),
          });
        } catch (cause) {
          await onRefresh();
          throw cause;
        }
        setRemoved((previous) => ({
          families: new Set([...previous.families, ...ids]),
          versions: new Set([
            ...previous.versions,
            ...(data?.flows
              .filter((flow) => ids.includes(flow.familyId))
              .map((flow) => flow.id) ?? []),
          ]),
        }));
      }
      await onRefresh();
    } finally {
      running.current = false;
      setPending(false);
    }
  }
  return {
    pending,
    remove,
    data: data
      ? {
          ...data,
          flows: data.flows.filter(
            (flow) => !removed.families.has(flow.familyId),
          ),
          comments: data.comments.filter(
            (comment) =>
              !comment.flowId || !removed.versions.has(comment.flowId),
          ),
        }
      : null,
  };
}
