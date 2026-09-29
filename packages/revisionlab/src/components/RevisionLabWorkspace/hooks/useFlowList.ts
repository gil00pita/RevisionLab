import { useRef, useState } from "react";
import type { RevisionLabFlow } from "../../../server/types.js";

export interface FlowDeletionTarget {
  familyId: string;
  name: string;
  versions: number;
  screens: number;
}

export function useFlowList({
  flows,
  disabled,
  onDelete,
}: {
  flows: RevisionLabFlow[];
  disabled: boolean;
  onDelete: (familyIds: string[]) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [targets, setTargets] = useState<FlowDeletionTarget[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const running = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const latest = new Map<string, RevisionLabFlow>();
  const active = new Set(
    flows
      .filter((flow) => flow.status === "recording")
      .map((flow) => flow.familyId),
  );
  for (const flow of flows) {
    const existing = latest.get(flow.familyId);
    if (!existing || existing.version < flow.version)
      latest.set(flow.familyId, flow);
  }
  const filtered = [...latest.values()].filter((flow) =>
    `${flow.name} ${flow.persona}`.toLowerCase().includes(search.toLowerCase()),
  );
  const eligible = filtered.filter((flow) => !active.has(flow.familyId));
  const selection = checked.filter((id) => latest.has(id) && !active.has(id));
  const allChecked =
    eligible.length > 0 &&
    eligible.every((flow) => selection.includes(flow.familyId));
  const someChecked = eligible.some((flow) =>
    selection.includes(flow.familyId),
  );
  function toggleSelection() {
    if (disabled || busy) return;
    setChecked([]);
    setSelecting((current) => !current);
  }
  function confirm(ids: string[]) {
    if (disabled || busy || !ids.length || ids.length > 100) return;
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setError("");
    setNotice("");
    setTargets(
      ids.map((familyId) => {
        const versions = flows.filter((flow) => flow.familyId === familyId);
        return {
          familyId,
          name: latest.get(familyId)!.name,
          versions: versions.length,
          screens: versions.reduce(
            (count, flow) => count + flow.steps.length,
            0,
          ),
        };
      }),
    );
  }
  async function remove() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await onDelete(targets.map((target) => target.familyId));
      setChecked((current) =>
        current.filter(
          (id) => !targets.some((target) => target.familyId === id),
        ),
      );
      setNotice(
        targets.length === 1
          ? "Flow deleted."
          : `${targets.length} flows deleted.`,
      );
      setTargets([]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not delete flows. Try again.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return {
    search,
    setSearch,
    setChecked,
    selecting,
    toggleSelection,
    targets,
    setTargets,
    busy,
    error,
    notice,
    searchInput,
    trigger,
    latest,
    active,
    filtered,
    eligible,
    selection,
    allChecked,
    someChecked,
    confirm,
    remove,
  };
}
