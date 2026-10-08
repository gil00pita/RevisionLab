import { randomUUID } from "node:crypto";
import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import type { CommentIdentity, CommentMention } from "../comment-rich.js";
import type { RevisionLabActor } from "./types.js";
import { HttpError, json, readJson } from "./security.js";

export async function readCommentOptions(client: Client | Transaction) {
  const [personas, users] = await Promise.all([
    client.execute(
      "SELECT id, name FROM personas WHERE archived_at IS NULL ORDER BY name",
    ),
    client.execute({
      sql: `SELECT reviewers.id, reviewers.name, reviewers.email FROM reviewers
      WHERE NOT EXISTS (SELECT 1 FROM workspace_memberships blocked WHERE blocked.email = reviewers.email AND blocked.status IN ('suspended', 'removed'))
      AND (EXISTS (SELECT 1 FROM workspace_memberships member WHERE member.reviewer_id = reviewers.id AND member.status = 'active')
        OR EXISTS (SELECT 1 FROM sessions session JOIN invitations invite ON invite.id = session.invitation_id
          WHERE session.reviewer_id = reviewers.id AND session.membership_id IS NULL AND session.expires_at > ?
          AND invite.revoked_at IS NULL AND invite.expires_at > ?)) ORDER BY reviewers.name`,
      args: [new Date().toISOString(), new Date().toISOString()],
    }),
  ]);
  const identities = (rows: typeof personas.rows): CommentIdentity[] =>
    rows.map((row) => ({ id: String(row.id), name: String(row.name) }));
  return {
    personas: identities(personas.rows),
    users: users.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      detail: String(row.email),
    })),
  };
}

export async function validateCommentLinks(
  transaction: Transaction,
  input: { body: string; personaIds: string[]; mentions: CommentMention[] },
) {
  const options = await readCommentOptions(transaction);
  const ordered = [...input.mentions].sort((a, b) => a.start - b.start);
  let previousEnd = 0;
  for (const mention of ordered) {
    const identity = options[
      mention.kind === "persona" ? "personas" : "users"
    ].find((item) => item.id === mention.id);
    if (
      !identity ||
      identity.name !== mention.label ||
      mention.start < previousEnd ||
      input.body.slice(mention.start, mention.end) !== `@${identity.name}`
    )
      throw new HttpError(
        400,
        "A mentioned persona or user is no longer available. Select them again.",
      );
    previousEnd = mention.end;
  }
  const ids = new Set([
    ...input.personaIds,
    ...ordered
      .filter((mention) => mention.kind === "persona")
      .map((mention) => mention.id),
  ]);
  if (ids.size > 20)
    throw new HttpError(400, "Link at most 20 personas to a comment.");
  const personas = [...ids].map((id) =>
    options.personas.find((persona) => persona.id === id),
  );
  if (personas.some((persona) => !persona))
    throw new HttpError(400, "A linked persona is no longer available.");
  return { personas: personas as CommentIdentity[], mentions: ordered };
}

export async function createMentionNotifications(
  transaction: Transaction,
  commentId: string,
  mentions: CommentMention[],
  actor: RevisionLabActor,
) {
  const recipients = [
    ...new Set(
      mentions
        .filter((mention) => mention.kind === "user" && mention.id !== actor.id)
        .map((mention) => mention.id),
    ),
  ];
  for (const recipient of recipients)
    await transaction.execute({
      sql: "INSERT INTO comment_notifications (id, comment_id, recipient_id, created_at) VALUES (?, ?, ?, ?)",
      args: [randomUUID(), commentId, recipient, new Date().toISOString()],
    });
  if (!recipients.length) return [];
  const rows = await transaction.execute({
    sql: `SELECT email FROM reviewers WHERE id IN (${recipients.map(() => "?").join(",")})`,
    args: recipients,
  });
  return rows.rows.map((row) => String(row.email));
}

/** Inbox ownership comes from the authenticated session, never from a request field or API key. */
export async function handleCommentNotifications(
  request: Request,
  path: string[],
  client: Client,
  actor: RevisionLabActor,
) {
  if (request.method === "GET" && path.length === 2) {
    const result = await client.execute({
      sql: `SELECT inbox.*, comment.body, comment.route, reviewer.name AS author_name FROM comment_notifications inbox
        JOIN comments comment ON comment.id = inbox.comment_id JOIN reviewers reviewer ON reviewer.id = comment.author_id
        WHERE inbox.recipient_id = ? AND NOT EXISTS (
          SELECT 1 FROM feedback_ticket_evidence source JOIN feedback_tickets ticket ON ticket.id = source.ticket_id
          WHERE source.comment_id = COALESCE(comment.parent_id, comment.id) AND json_extract(ticket.ticket_json, '$.status') = 'fixed') ORDER BY inbox.created_at DESC LIMIT 100`,
      args: [actor.id],
    });
    return json(
      result.rows.map((row) => ({
        id: row.id,
        commentId: row.comment_id,
        body: row.body,
        route: row.route,
        authorName: row.author_name,
        createdAt: row.created_at,
        readAt: row.read_at,
      })),
    );
  }
  if (
    request.method === "PATCH" &&
    path.length === 3 &&
    z.string().uuid().safeParse(path[2]).success
  ) {
    z.strictObject({ read: z.literal(true) }).parse(await readJson(request));
    const result = await client.execute({
      sql: "UPDATE comment_notifications SET read_at = COALESCE(read_at, ?) WHERE id = ? AND recipient_id = ?",
      args: [new Date().toISOString(), path[2], actor.id],
    });
    if (!result.rowsAffected)
      throw new HttpError(404, "Notification not found.");
    return json({ read: true });
  }
  throw new HttpError(404, "Not found.");
}
