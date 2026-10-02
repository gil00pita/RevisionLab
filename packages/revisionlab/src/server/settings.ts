import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import {
  commentBubbleColors,
  defaultSettings,
  type RevisionLabSettings,
} from "../comment-settings.js";
import { requireRole } from "./authentication.js";
import { write } from "./database.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor } from "./types.js";

const settingsSchema = z.strictObject({
  widgetColor: z.enum(commentBubbleColors),
  widgetPosition: z.enum(["bottom-right", "bottom-left"]),
  showWidget: z.boolean(),
  auditLivePages: z.boolean(),
  auditRecordings: z.boolean(),
  showCommentBubbles: z.boolean(),
  commentBubbleColor: z.enum(commentBubbleColors),
});
const settingsPatch = settingsSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Choose a setting to update.",
  );

export async function readSettings(
  client: Client | Transaction,
): Promise<RevisionLabSettings> {
  const result = await client.execute(
    "SELECT * FROM workspace_settings WHERE id = 1",
  );
  const row = result.rows[0];
  return row
    ? settingsSchema.parse({
        widgetColor: row.widget_color,
        widgetPosition: row.widget_position,
        showWidget: Number(row.show_widget) === 1,
        auditLivePages: Number(row.audit_live_pages) === 1,
        auditRecordings: Number(row.audit_recordings) === 1,
        showCommentBubbles: Number(row.show_comment_bubbles) === 1,
        commentBubbleColor: row.comment_bubble_color,
      })
    : { ...defaultSettings };
}

export async function handleSettings(
  request: Request,
  path: string[],
  client: Client,
  actor: RevisionLabActor,
) {
  requireRole(actor, "editor");
  if (request.method !== "PATCH" || path.length !== 1)
    throw new HttpError(404, "Not found.");
  const patch = settingsPatch.parse(await readJson(request));
  const settings = await write(client, async (transaction) => {
    const next = { ...(await readSettings(transaction)), ...patch };
    await transaction.execute({
      sql: `INSERT INTO workspace_settings (id, show_comment_bubbles, comment_bubble_color,
        widget_color, widget_position, show_widget, audit_live_pages, audit_recordings)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET show_comment_bubbles = excluded.show_comment_bubbles,
        comment_bubble_color = excluded.comment_bubble_color, widget_color = excluded.widget_color,
        widget_position = excluded.widget_position, show_widget = excluded.show_widget,
        audit_live_pages = excluded.audit_live_pages, audit_recordings = excluded.audit_recordings`,
      args: [
        next.showCommentBubbles ? 1 : 0,
        next.commentBubbleColor,
        next.widgetColor,
        next.widgetPosition,
        next.showWidget ? 1 : 0,
        next.auditLivePages ? 1 : 0,
        next.auditRecordings ? 1 : 0,
      ],
    });
    return next;
  });
  return json(settings);
}
