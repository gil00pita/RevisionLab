import { useEffect, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import type { CommentSuggestion } from "../../../comment-suggestions.js";

export function useCommentSuggestions(
  apiPath: string,
  route: string,
  value: string,
  enabled: boolean,
) {
  const [result, setResult] = useState<{
    query: string;
    route: string;
    items: CommentSuggestion[];
  }>({ query: "", route, items: [] });
  useEffect(() => {
    if (!enabled || value.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const query = new URLSearchParams({ route, q: value });
      void apiRequest<{ suggestions: CommentSuggestion[] }>(
        apiPath,
        `comment-suggestions?${query}`,
        { signal: controller.signal },
      )
        .then((data) => {
          if (!controller.signal.aborted)
            setResult({ query: value, route, items: data.suggestions });
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setResult({ query: value, route, items: [] });
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [apiPath, route, value, enabled]);
  return enabled && result.query === value && result.route === route
    ? result.items
    : [];
}
