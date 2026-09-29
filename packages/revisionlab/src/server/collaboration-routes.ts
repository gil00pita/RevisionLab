import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { z } from "zod";
import { requireRole } from "./authentication.js";
import type { ResolvedConfig } from "./config.js";
import { write } from "./database.js";
import { commentContext, commentSchema } from "./comment-context.js";
import {
  createToken,
  hashValue,
  HttpError,
  json,
  readJson,
} from "./security.js";
import type { RevisionLabActor } from "./types.js";

const invitationSchema = z.object({
  email: z.string().trim().email().max(254).nullable().optional(),
  role: z.enum(["commenter", "editor"]),
  expiresInDays: z.number().int().min(1).max(90).default(14),
});

export async function handleComments(
  request: Request,
  path: string[],
  client: Client,
  actor: RevisionLabActor,
): Promise<Response> {
  if (request.method === "POST" && path.length === 1) {
    const input = commentSchema.parse(await readJson(request));
    const id = randomUUID();
    await write(client, async (transaction) => {
      const context = await commentContext(transaction, input);
      await transaction.execute({
        sql: `INSERT INTO comments (id, flow_id, step_id, edge_id, route, body, status, author_id, created_at, anchor_x, anchor_y, parent_id, element_anchor)
          VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          context.flowId,
          context.stepId,
          context.edgeId,
          context.route,
          input.body,
          actor.id,
          new Date().toISOString(),
          input.anchor?.x ?? null,
          input.anchor?.y ?? null,
          input.parentId ?? null,
          input.elementAnchor ? JSON.stringify(input.elementAnchor) : null,
        ],
      });
    });
    return json({ id }, 201);
  }
  if (
    request.method === "PATCH" &&
    path.length === 2 &&
    z.string().uuid().safeParse(path[1]).success
  ) {
    requireRole(actor, "editor");
    const input = z
      .object({ status: z.enum(["open", "resolved"]) })
      .parse(await readJson(request));
    await write(client, async (transaction) => {
      const existing = await transaction.execute({
        sql: "SELECT parent_id FROM comments WHERE id = ?",
        args: [path[1]],
      });
      if (!existing.rows[0]) throw new HttpError(404, "Comment not found.");
      if (existing.rows[0].parent_id != null) {
        throw new HttpError(
          400,
          "Resolve or reopen the thread, not an individual reply.",
        );
      }
      const result = await transaction.execute({
        sql: "UPDATE comments SET status = ?, resolved_at = ? WHERE id = ?",
        args: [
          input.status,
          input.status === "resolved" ? new Date().toISOString() : null,
          path[1],
        ],
      });
      if (!result.rowsAffected) throw new HttpError(404, "Comment not found.");
    });
    return json({ ok: true });
  }
  throw new HttpError(404, "Not found.");
}

export async function handleInvitations(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<Response> {
  requireRole(actor, "owner");
  if (request.method === "POST" && path.length === 1) {
    const input = invitationSchema.parse(await readJson(request));
    const token = createToken();
    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + input.expiresInDays * 86_400_000,
    ).toISOString();
    await write(client, async (transaction) => {
      await transaction.execute({
        sql: `INSERT INTO invitations (id, email, role, token_hash, expires_at, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          input.email?.toLowerCase() ?? null,
          input.role,
          hashValue(token),
          expiresAt,
          actor.id,
          now.toISOString(),
        ],
      });
    });
    const inviteUrl = new URL(`${config.basePath}/access`, request.url);
    inviteUrl.searchParams.set("invite", token);
    return json({ id, inviteUrl: inviteUrl.toString(), expiresAt }, 201);
  }
  if (
    request.method === "PATCH" &&
    path.length === 2 &&
    z.string().uuid().safeParse(path[1]).success
  ) {
    z.object({ revoked: z.literal(true) }).parse(await readJson(request));
    await write(client, async (transaction) => {
      const now = new Date().toISOString();
      const result = await transaction.execute({
        sql: "UPDATE invitations SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ?",
        args: [now, path[1]],
      });
      if (!result.rowsAffected)
        throw new HttpError(404, "Invitation not found.");
      await transaction.execute({
        sql: "DELETE FROM sessions WHERE invitation_id = ?",
        args: [path[1]],
      });
      await transaction.execute({
        sql: "UPDATE otp_challenges SET used_at = ? WHERE invitation_id = ? AND used_at IS NULL",
        args: [now, path[1]],
      });
    });
    return json({ ok: true });
  }
  throw new HttpError(404, "Not found.");
}
