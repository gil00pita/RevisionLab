import { useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabState } from "../../../server/types.js";

export function useFlowDeletion({
  data,
  apiPath,
  blocked,
  beforeDelete,
  onRefresh,
}: {
  data: RevisionLabState | null;
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
      await apiRequest(apiPath, "flows/delete", {
        method: "POST",
        body: JSON.stringify({ familyIds }),
      });
      // Keep confirmed deletions hidden even if an older poll finishes later.
      setRemoved((previous) => ({
        families: new Set([...previous.families, ...familyIds]),
        versions: new Set([
          ...previous.versions,
          ...(data?.flows
            .filter((flow) => familyIds.includes(flow.familyId))
            .map((flow) => flow.id) ?? []),
        ]),
      }));
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
