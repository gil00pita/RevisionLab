import { useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import {
  composeAiInstructions,
  type AiInstructionSettings,
} from "../../../ai-instructions/index.js";
import type { RevisionLabSettings } from "../../../comment-settings.js";

export function useAiInstructions({
  apiPath,
  value,
  canEdit,
  onRefresh,
}: {
  apiPath: string;
  value: AiInstructionSettings;
  canEdit: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<AiInstructionSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const displayed = draft ?? value;
  const dirty =
    draft !== null && JSON.stringify(draft) !== JSON.stringify(value);
  const instructions = composeAiInstructions(displayed);
  const needsSelection =
    displayed.designSystemEnabled &&
    (!displayed.designSystemId ||
      (displayed.designSystemId === "manual" && !displayed.manual.name.trim()));
  const disabled = !canEdit || busy;

  function update(patch: Partial<AiInstructionSettings>) {
    if (disabled) return;
    setDraft({ ...displayed, ...patch });
    setStatus("");
    setError("");
  }

  async function save() {
    if (disabled || saving.current || needsSelection) return;
    saving.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const saved = await apiRequest<RevisionLabSettings>(apiPath, "settings", {
        method: "PATCH",
        body: JSON.stringify({ ai: displayed }),
      });
      // Keep the confirmed value visible even if refreshing the rest of the workspace fails.
      setDraft(saved.ai);
      await onRefresh();
      setDraft(null);
      setStatus("AI instructions saved.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save AI instructions.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(instructions);
      setStatus(
        dirty
          ? "Draft instructions copied. Save to keep your changes."
          : "AI instructions copied.",
      );
      setError("");
    } catch {
      setError(
        "Could not copy. Select and copy the generated instructions below.",
      );
    }
  }

  function discard() {
    setDraft(null);
    setError("");
    setStatus("Changes discarded.");
  }
  return {
    displayed,
    busy,
    error,
    status,
    dirty,
    instructions,
    needsSelection,
    disabled,
    update,
    save,
    copy,
    discard,
  };
}
