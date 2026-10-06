export interface CommentSuggestion {
  id: string;
  body: string;
  occurrences: number;
}

export function normalizeComment(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function matchComments(
  comments: { id: string; body: string }[],
  query: string,
): CommentSuggestion[] {
  const text = normalizeComment(query);
  if (text.length < 3) return [];
  const terms = text.split(" ").filter(Boolean);
  const grouped = new Map<string, CommentSuggestion>();
  for (const comment of comments) {
    const body = normalizeComment(comment.body);
    const words = body.split(" ");
    if (!terms.every((term) => words.some((word) => word.startsWith(term))))
      continue;
    const found = grouped.get(body);
    if (found) found.occurrences++;
    else grouped.set(body, { ...comment, occurrences: 1 });
  }
  return [...grouped.values()]
    .sort(
      (a, b) =>
        Number(normalizeComment(b.body).includes(text)) -
          Number(normalizeComment(a.body).includes(text)) ||
        b.occurrences - a.occurrences,
    )
    .slice(0, 5);
}
