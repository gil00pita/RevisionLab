import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import type {
  CodexProposal,
  FeedbackTarget,
} from "../../../review-automation.js";

export function useCodexFix(
  apiPath: string,
  flowId: string,
  stepId: string,
  target: FeedbackTarget,
) {
  const [proposal, setProposal] = useState<CodexProposal | null>(null);
  const [busy, setBusy] = useState<string | null>("restore");
  const [error, setError] = useState("");
  const running = useRef<AbortController | null>(null);
  const storageKey = `revisionlab:fix:${apiPath}:${flowId}:${stepId}:${JSON.stringify(target)}`;
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      try {
        const id = sessionStorage.getItem(storageKey);
        if (id) {
          const previous = await apiRequest<CodexProposal>(
            apiPath,
            `ai/fixes/${id}`,
            { signal: controller.signal },
          );
          if (!controller.signal.aborted) setProposal(previous);
        }
      } catch {
        /* A missing prior proposal should not prevent a new run. */
      } finally {
        if (!controller.signal.aborted) setBusy(null);
      }
    });
    return () => controller.abort();
  }, [apiPath, storageKey]);
  useEffect(() => () => running.current?.abort(), []);
  async function request(action?: "apply" | "discard" | "undo" | "pr") {
    if (running.current || busy) return;
    const controller = new AbortController();
    running.current = controller;
    setBusy(action ?? "generate");
    setError("");
    try {
      const result = await apiRequest<CodexProposal>(
        apiPath,
        action ? `ai/fixes/${proposal!.id}` : "ai/fixes",
        {
          method: action ? "PATCH" : "POST",
          signal: controller.signal,
          body: JSON.stringify(
            action ? { action } : { flowId, stepId, target },
          ),
        },
      );
      setProposal(result);
      try {
        sessionStorage.setItem(storageKey, result.id);
      } catch {
        /* Storage may be disabled. */
      }
    } catch (cause) {
      setError(
        controller.signal.aborted
          ? "Codex was cancelled. No proposed fix was applied."
          : cause instanceof Error
            ? cause.message
            : "Could not complete the AI action.",
      );
    } finally {
      running.current = null;
      setBusy(null);
    }
  }
  return {
    proposal,
    busy,
    error,
    request,
    cancel: () => running.current?.abort(),
  };
}
