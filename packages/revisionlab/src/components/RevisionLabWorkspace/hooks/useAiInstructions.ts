import type { RevisionLabAiInstructions } from "../../../ai-instructions.js";
import { useAiInstructionDocument } from "./useAiInstructionDocument.js";
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
  const [needsRetry, setNeedsRetry] = useState(false);
  const file = useAiInstructionDocument(apiPath);
  const baseline = {
    ...value,
    instructions: file.document?.instructions ?? value.instructions,
  };
  const displayed = draft ?? baseline;
  const dirty =
    needsRetry ||
    (draft !== null && JSON.stringify(draft) !== JSON.stringify(baseline));
  const instructions = composeAiInstructions(displayed);
  const needsSelection =
    displayed.designSystemEnabled &&
    (!displayed.designSystemId ||
      (displayed.designSystemId === "manual" && !displayed.manual.name.trim()));
  const disabled = !canEdit || busy || !file.document;

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
    let fileSaved = false;
    try {
      const document = await apiRequest<RevisionLabAiInstructions>(
        apiPath,
        "settings/ai",
        {
          method: "PATCH",
          body: JSON.stringify({ instructions: displayed.instructions }),
        },
      );
      fileSaved = true;
      file.setDocument(document);
      const saved = await apiRequest<RevisionLabSettings>(apiPath, "settings", {
        method: "PATCH",
        body: JSON.stringify({ ai: displayed }),
      });
      // Keep the confirmed value visible even if refreshing the rest of the workspace fails.
      setDraft(saved.ai);
      await onRefresh();
      setDraft(null);
      setNeedsRetry(false);
      setStatus("AI instructions saved.");
    } catch (cause) {
      setNeedsRetry(fileSaved);
      setError(
        (fileSaved
          ? "The Markdown file was saved, but workspace settings could not be confirmed. Retry saving. "
          : "") +
          (cause instanceof Error
            ? cause.message
            : "Could not save AI instructions."),
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
    setNeedsRetry(false);
    setDraft(null);
    setError("");
    setStatus("Changes discarded.");
  }
  return {
    displayed,
    busy,
    error: error || file.error,
    loading: file.loading,
    filePath: file.document?.filePath,
    retry: file.retry,
    status,
    dirty,
    canSave: dirty || file.document?.exists === false,
    instructions,
    needsSelection,
    disabled,
    update,
    save,
    copy,
    discard,
  };
}
