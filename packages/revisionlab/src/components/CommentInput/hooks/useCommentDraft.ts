import { useCommentFiles } from "./useCommentFiles.js";
import { useEffect, useState, type SetStateAction } from "react";
import { apiRequest, ApiError } from "../../../client/api.js";
import {
  rebaseMentions,
  type CommentIdentity,
  type CommentMention,
  type CommentOptions,
  isCommentOptions,
} from "../../../comment-rich.js";

export function useCommentDraft(apiPath: string) {
  const [body, updateBody] = useState("");
  const [mentions, setMentions] = useState<CommentMention[]>([]);
  const [personas, updatePersonas] = useState<CommentIdentity[]>([]);
  const [loadedOptions, setOptions] = useState<{
    apiPath: string;
    value: CommentOptions;
  } | null>(null);
  const options =
    loadedOptions?.apiPath === apiPath ? loadedOptions.value : null;
  const [error, setError] = useState<string | null>(null);
  const { files, setFiles, resetFiles, preparing } = useCommentFiles(setError);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void apiRequest<CommentOptions>(apiPath, "comments/options", {
      signal: controller.signal,
    })
      .then((value) => {
        if (!isCommentOptions(value))
          throw new Error("Invalid comment options.");
        if (!controller.signal.aborted) {
          setOptions({ apiPath, value });
          setOptionsError(null);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setOptionsError(
            cause instanceof ApiError && cause.status === 404
              ? "Update this workspace to enable attachments and mentions."
              : "Could not load people and attachment options. Retry to enable them.",
          );
      });
    return () => controller.abort();
  }, [apiPath, reload]);
  function setPersonas(change: SetStateAction<CommentIdentity[]>) {
    const next = typeof change === "function" ? change(personas) : change;
    updatePersonas(next);
    setMentions((existing) =>
      existing.filter(
        (mention) =>
          mention.kind !== "persona" ||
          next.some((persona) => persona.id === mention.id),
      ),
    );
  }
  function setBody(next: string) {
    if (next.length > 4000) {
      setError("Comments can contain up to 4,000 characters.");
      return;
    }
    setMentions((existing) => rebaseMentions(body, next, existing));
    updateBody(next);
  }
  function addMention(
    identity: CommentIdentity,
    kind: CommentMention["kind"],
    start: number,
    end: number,
  ) {
    if (mentions.length >= 20) {
      setError("Mention at most 20 people or personas.");
      return null;
    }
    if (
      kind === "persona" &&
      !personas.some((persona) => persona.id === identity.id) &&
      personas.length >= 20
    ) {
      setError("Link at most 20 personas.");
      return null;
    }
    const text = `@${identity.name}`;
    const next = `${body.slice(0, start)}${text} ${body.slice(end)}`;
    if (next.length > 4000) {
      setError("Comments can contain up to 4,000 characters.");
      return null;
    }
    setMentions([
      ...rebaseMentions(body, next, mentions),
      {
        id: identity.id,
        kind,
        label: identity.name,
        start,
        end: start + text.length,
      },
    ]);
    updateBody(next);
    if (kind === "persona")
      setPersonas((existing) =>
        existing.some((persona) => persona.id === identity.id)
          ? existing
          : [...existing, identity],
      );
    return start + text.length + 1;
  }
  function reset() {
    updateBody("");
    setMentions([]);
    updatePersonas([]);
    resetFiles();
    setError(null);
  }
  function payload() {
    if (!options) return {};
    const leading = body.length - body.trimStart().length;
    return {
      attachments: files.map((record) => ({
        name: record.file.name,
        data: record.data!,
      })),
      personaIds: personas.map((persona) => persona.id),
      mentions: mentions.map((mention) => ({
        ...mention,
        start: mention.start - leading,
        end: mention.end - leading,
      })),
    };
  }
  return {
    body,
    setBody,
    mentions,
    personas,
    setPersonas,
    files,
    setFiles,
    addMention,
    reset,
    payload,
    options,
    optionsError,
    retryOptions: () => {
      setOptionsError(null);
      setReload((value) => value + 1);
    },
    error,
    setError,
    preparing,
    supported: Boolean(options),
  };
}
export type CommentDraft = ReturnType<typeof useCommentDraft>;
