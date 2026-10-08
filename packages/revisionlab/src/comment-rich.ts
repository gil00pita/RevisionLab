export const MAX_COMMENT_FILES = 5;
export const MAX_COMMENT_FILE_BYTES = 3_000_000;
export const MAX_COMMENT_TOTAL_BYTES = 10_000_000;
export const MAX_COMMENT_BODY_BYTES = 18_000_000;

export interface CommentIdentity {
  id: string;
  name: string;
  detail?: string;
}
export interface CommentMention {
  id: string;
  kind: "persona" | "user";
  label: string;
  start: number;
  end: number;
}
export interface CommentAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
}
export interface CommentUpload {
  name: string;
  data: string;
}
export interface CommentOptions {
  personas: CommentIdentity[];
  users: CommentIdentity[];
}
export interface CommentNotification {
  id: string;
  commentId: string;
  authorName: string;
  body: string;
  route: string;
  createdAt: string;
  readAt: string | null;
}

/** Preserve identity only when an edit does not replace the selected mention. */
export function rebaseMentions(
  previous: string,
  next: string,
  mentions: CommentMention[],
): CommentMention[] {
  let start = 0;
  while (
    start < previous.length &&
    start < next.length &&
    previous[start] === next[start]
  )
    start++;
  let end = previous.length,
    nextEnd = next.length;
  while (
    end > start &&
    nextEnd > start &&
    previous[end - 1] === next[nextEnd - 1]
  ) {
    end--;
    nextEnd--;
  }
  const delta = nextEnd - end;
  return mentions
    .flatMap((mention) => {
      if (mention.end <= start) return [mention];
      if (mention.start >= end)
        return [
          {
            ...mention,
            start: mention.start + delta,
            end: mention.end + delta,
          },
        ];
      return [];
    })
    .filter(
      (mention) =>
        next.slice(mention.start, mention.end) === `@${mention.label}`,
    );
}

export function isCommentOptions(value: unknown): value is CommentOptions {
  if (!value || typeof value !== "object") return false;
  const options = value as Partial<CommentOptions>;
  const identities = (items: unknown): items is CommentIdentity[] =>
    Array.isArray(items) &&
    items.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        item.id.length > 0 &&
        item.id.length <= 160 &&
        typeof item.name === "string" &&
        item.name.length > 0 &&
        item.name.length <= 160 &&
        (item.detail === undefined || typeof item.detail === "string"),
    );
  return identities(options.personas) && identities(options.users);
}
