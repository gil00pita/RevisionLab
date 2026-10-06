import type { Client } from "@libsql/client";
import { matchComments } from "../comment-suggestions.js";
import { readComments } from "./queries.js";
import { routeSchema } from "./flow-routes.js";
import { json, HttpError } from "./security.js";

export async function handleCommentSuggestions(
  request: Request,
  client: Client,
) {
  const query = new URL(request.url).searchParams;
  const route = routeSchema.parse(query.get("route"));
  const text = query.get("q") ?? "";
  if (text.length > 4000)
    throw new HttpError(400, "The comment query is too long.");
  const comments = (await readComments(client)).filter(
    (comment) =>
      comment.route === route &&
      !comment.parentId &&
      !comment.edgeId &&
      comment.status === "open",
  );
  return json({ suggestions: matchComments(comments, text) });
}
