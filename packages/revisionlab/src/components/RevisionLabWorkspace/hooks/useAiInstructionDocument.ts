import { useEffect, useState } from "react";
import type { RevisionLabAiInstructions } from "../../../ai-instructions.js";
import { apiRequest } from "../../../client/api.js";

/** Load the server-owned Markdown file afresh when Settings opens. */
export function useAiInstructionDocument(apiPath: string) {
  const [document, setDocument] = useState<RevisionLabAiInstructions | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<RevisionLabAiInstructions>(apiPath, "settings/ai", {
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setDocument(result);
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
  function retry() {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }
  return { document, setDocument, loading, error, retry };
}
