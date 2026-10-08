import {
  MAX_COMMENT_BODY_BYTES,
  MAX_COMMENT_TOTAL_BYTES,
} from "../comment-rich.js";
import {
  createMentionNotifications,
  validateCommentLinks,
} from "./comment-mentions.js";
import { notifyReviewEvent } from "./notifications/events.js";
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
import {
  discardArtifact,
  insertArtifact,
  prepareCommentAttachment,
  prepareArtifact,
} from "./artifacts.js";

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
  config?: ResolvedConfig,
  notificationDeadline?: number,
): Promise<Response> {
  if (request.method === "POST" && path.length === 1) {
    const value = await readJson(request, MAX_COMMENT_BODY_BYTES);
    if (
      !(value as { screenshot?: unknown; attachments?: unknown[] } | null)
        ?.screenshot &&
      !(value as { attachments?: unknown[] } | null)?.attachments?.length &&
      Buffer.byteLength(JSON.stringify(value)) > 16_384
    )
      throw new HttpError(413, "This request is too large.");
    const input = commentSchema.parse(value);
    if ((input.screenshot || input.attachments.length) && !config)
      throw new HttpError(503, "Attachment storage is unavailable.");
    const prepared: NonNullable<Awaited<ReturnType<typeof prepareArtifact>>>[] =
      [];
    const id = randomUUID();
    let mentionRecipients: string[] = [];
    try {
      const artifact = input.screenshot
        ? await prepareArtifact(input.screenshot, config!)
        : null;
      if (artifact) prepared.push(artifact);
      const attachments: import("../comment-rich.js").CommentAttachment[] = [];
      let total = 0;
      for (const file of input.attachments) {
        const stored = await prepareCommentAttachment(
          file.name,
          file.data,
          config!,
        );
        prepared.push(stored);
        total += stored.bytes.length;
        if (total > MAX_COMMENT_TOTAL_BYTES)
          throw new HttpError(413, "Attachments must total 10 MB or less.");
        attachments.push({
          id: stored.id,
          name: file.name,
          contentType: stored.contentType,
          size: stored.bytes.length,
        });
      }
      await write(client, async (transaction) => {
        const context = await commentContext(transaction, input);
        const links = await validateCommentLinks(transaction, input);
        for (const file of prepared) await insertArtifact(transaction, file);
        await transaction.execute({
          sql: `INSERT INTO comments (id, flow_id, step_id, edge_id, route, body, status, author_id, created_at, anchor_x, anchor_y, parent_id, element_anchor, screenshot, screenshot_anchor, attachments_json, personas_json, mentions_json)
          VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            artifact?.id ?? null,
            input.screenshotAnchor
              ? JSON.stringify(input.screenshotAnchor)
              : null,
            JSON.stringify(attachments),
            JSON.stringify(links.personas),
            JSON.stringify(links.mentions),
          ],
        });
        mentionRecipients = await createMentionNotifications(
          transaction,
          id,
          links.mentions,
          actor,
        );
      });
    } catch (error) {
      if (config)
        await Promise.allSettled(
          prepared.map((file) => discardArtifact(file, config)),
        );
      throw error;
    }
    if (config)
      await notifyReviewEvent(
        client,
        config,
        {
          type: "comments",
          title: input.parentId ? "New comment reply" : "New comment",
          detail: `${actor.name}: ${input.body}`,
          mentionRecipients,
        },
        notificationDeadline,
      );
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
