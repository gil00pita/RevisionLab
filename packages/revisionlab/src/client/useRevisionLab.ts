"use client";

import { useCallback, useEffect, useState } from "react";
import type { RevisionLabState } from "../server/types.js";
import { apiRequest, ApiError } from "./api.js";

export function useRevisionLab(apiPath: string) {
  const [data, setData] = useState<RevisionLabState | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await apiRequest<RevisionLabState>(apiPath, "state");
      setData(next);
      setError(null);
    } catch (cause) {
      const failure =
        cause instanceof Error ? cause : new Error("Unable to connect.");
      setError(failure);
      if (failure instanceof ApiError && failure.status === 401) setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    // Deliver the first external-store update asynchronously, like later polls.
    void Promise.resolve().then(refresh);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return { data, error, loading, refresh };
}
