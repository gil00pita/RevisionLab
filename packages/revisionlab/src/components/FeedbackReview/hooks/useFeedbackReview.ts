import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import type {
  FeedbackReviewData,
  ReviewTicket,
  TicketTemplate,
} from "../../../feedback-review.js";

export function useFeedbackReview(apiPath: string) {
  const [data, setData] = useState<FeedbackReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const controller = useRef<AbortController | null>(null);
  const loadController = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    loadController.current?.abort();
    const pending = new AbortController();
    loadController.current = pending;
    try {
      const result = await apiRequest<FeedbackReviewData>(
        apiPath,
        "feedback-review",
        { signal: pending.signal },
      );
      if (!pending.signal.aborted) {
        setData(result);
        setError("");
      }
    } catch (cause) {
      if (!pending.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load Feedback Review.",
        );
    } finally {
      if (!pending.signal.aborted) setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void reload();
    });
    return () => {
      cancelled = true;
      loadController.current?.abort();
      controller.current?.abort();
    };
  }, [reload]);

  async function generate(
    evidenceIds: string[],
    notes: string,
    templateId: string,
  ) {
    if (controller.current) return false;
    const pending = new AbortController();
    controller.current = pending;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const result = await apiRequest<{ tickets: ReviewTicket[] }>(
        apiPath,
        "feedback-review/generate",
        {
          method: "POST",
          signal: pending.signal,
          body: JSON.stringify({ evidenceIds, notes, templateId }),
        },
      );
      if (pending.signal.aborted) return false;
      setData(
        (current) =>
          current && {
            ...current,
            tickets: [...result.tickets, ...current.tickets],
          },
      );
      setSelectedTicket(result.tickets[0]?.id ?? null);
      setStatus(
        `${result.tickets.length} ticket draft${result.tickets.length === 1 ? "" : "s"} saved. Review before copying to Jira.`,
      );
      return true;
    } catch (cause) {
      setError(
        pending.signal.aborted
          ? "Codex cancelled. Your selection is retained. Reload feedback to check for any drafts saved just before cancellation."
          : cause instanceof Error
            ? cause.message
            : "Could not generate tickets.",
      );
      return false;
    } finally {
      controller.current = null;
      setBusy(false);
    }
  }

  function saved(ticket: ReviewTicket) {
    setData(
      (current) =>
        current && {
          ...current,
          tickets: current.tickets.map((item) =>
            item.id === ticket.id ? ticket : item,
          ),
        },
    );
  }
  async function addTemplate(name: string, markdown: string) {
    try {
      const template = await apiRequest<TicketTemplate>(
        apiPath,
        "feedback-review/templates",
        { method: "POST", body: JSON.stringify({ name, markdown }) },
      );
      setData(
        (current) =>
          current && {
            ...current,
            templates: [...current.templates, template],
          },
      );
      setError("");
      return template;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save the template.",
      );
      return null;
    }
  }
  return {
    addTemplate,
    data,
    loading,
    error,
    busy,
    status,
    reload,
    generate,
    saved,
    selectedTicket,
    setSelectedTicket,
    cancel: () => controller.current?.abort(),
  };
}
