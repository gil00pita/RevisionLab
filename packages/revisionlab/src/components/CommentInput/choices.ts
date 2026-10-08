import type { CommentIdentity, CommentOptions } from "../../comment-rich.js";
import type { CommentSuggestion } from "../../comment-suggestions.js";

export interface CommentChoice {
  id: string;
  body: string;
  detail: string;
  identity?: CommentIdentity & { kind: "persona" | "user" };
}
export function commentChoices(
  query: string | undefined,
  options: CommentOptions | null,
  suggestions: CommentSuggestion[],
): CommentChoice[] {
  if (query !== undefined && options)
    return [
      ...options.personas.map((identity) => ({
        ...identity,
        kind: "persona" as const,
      })),
      ...options.users.map((identity) => ({
        ...identity,
        kind: "user" as const,
      })),
    ]
      .filter((identity) =>
        `${identity.name} ${identity.detail ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .slice(0, 50)
      .map((identity) => ({
        id: `${identity.kind}:${identity.id}`,
        body: `@${identity.name}`,
        detail:
          identity.kind === "persona"
            ? "Persona · link to this comment"
            : `User · ${identity.detail ?? "notify when posted"}`,
        identity,
      }));
  return suggestions.map((item) => ({
    ...item,
    detail: `${item.occurrences} existing occurrence${item.occurrences === 1 ? "" : "s"} · use this wording`,
  }));
}
