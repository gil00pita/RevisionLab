import { useEffect, useRef, useState } from "react";
import type { RevisionLabAiInstructions } from "../../../ai-instructions.js";
import { apiRequest } from "../../../client/api.js";

export function useAiInstructions(apiPath: string, canEdit: boolean) {
  const [document, setDocument] = useState<RevisionLabAiInstructions | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const savingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<RevisionLabAiInstructions>(apiPath, "settings/ai", {
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setDocument(result);
        setDraft(result.instructions);
        setLoading(false);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load AI instructions.",
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [apiPath, attempt]);

  async function save() {
    if (!canEdit || !document || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const result = await apiRequest<RevisionLabAiInstructions>(
        apiPath,
        "settings/ai",
        {
          method: "PATCH",
          body: JSON.stringify({ instructions: draft }),
        },
      );
      setDocument(result);
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save AI instructions.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function edit(value: string) {
    setDraft(value);
    setSaved(false);
  }

  function retry() {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  return {
    document,
    draft,
    loading,
    saving,
    error,
    saved,
    dirty: document !== null && draft !== document.instructions,
    edit,
    save,
    retry,
  };
}
