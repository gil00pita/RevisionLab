import { useRef, useState } from "react";
import { Icon, IconButton } from "@chakra-ui/react";
import { Trash2 } from "lucide-react";
import type { RevisionLabFlow } from "../../../server/types.js";
import type { FlowDeletionTarget } from "../hooks/useFlowList.js";
import { DeleteFlowsDialog } from "./DeleteFlowsDialog.js";

export function DeleteFlowAction({
  flow,
  versions,
  disabled,
  onDelete,
}: {
  flow: RevisionLabFlow;
  versions: RevisionLabFlow[];
  disabled: boolean;
  onDelete: (familyIds: string[]) => Promise<void>;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const running = useRef(false);
  const [target, setTarget] = useState<FlowDeletionTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = versions.some((version) => version.status === "recording");

  async function remove() {
    if (running.current || !target) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await onDelete([target.familyId]);
      setTarget(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not delete this flow. Try again.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <IconButton
        ref={button}
        size="sm"
        variant="ghost"
        colorPalette="red"
        flexShrink="0"
        aria-label={`Delete ${flow.name}`}
        title={
          active
            ? "Finish or discard this recording before deleting"
            : `Delete ${flow.name}`
        }
        disabled={disabled || busy || active}
        onClick={() => {
          setError("");
          setTarget({
            familyId: flow.familyId,
            name: flow.name,
            versions: versions.length,
            screens: versions.reduce(
              (count, version) => count + version.steps.length,
              0,
            ),
          });
        }}
      >
        <Icon>
          <Trash2 />
        </Icon>
      </IconButton>
      {target && (
        <DeleteFlowsDialog
          targets={[target]}
          busy={busy}
          error={error}
          onCancel={() => setTarget(null)}
          onConfirm={() => void remove()}
          finalFocus={() => button.current}
        />
      )}
    </>
  );
}
