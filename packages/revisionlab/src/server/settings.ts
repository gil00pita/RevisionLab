import { wcagVersions, wcagLevels } from "../wcag-settings.js";
import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import {
  commentBubbleColors,
  defaultSettings,
  type RevisionLabSettings,
} from "../comment-settings.js";
import { requireRole } from "./authentication.js";
import { maxWidgetOffset } from "../widget-settings.js";
import { write } from "./database.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor } from "./types.js";

export const settingsSchema = z
  .object({
    wcagVersion: z.enum(wcagVersions),
    wcagLevel: z.enum(wcagLevels),
    showCommentBubbles: z.boolean(),
    commentBubbleColor: z.enum(commentBubbleColors),
    showWidget: z.boolean(),
    widgetColor: z.enum(commentBubbleColors),
    widgetSide: z.enum(["left", "right"]),
    widgetOffset: z.number().int().min(0).max(maxWidgetOffset),
    widgetBottomOffset: z.number().int().min(0).max(maxWidgetOffset),
  })
  .strict();
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
        wcagVersion: row.wcag_version,
        wcagLevel: row.wcag_level,
        showCommentBubbles: Number(row.show_comment_bubbles) === 1,
        commentBubbleColor: row.comment_bubble_color,
        showWidget: Number(row.show_widget) === 1,
        widgetColor: row.widget_color,
        widgetSide: row.widget_side,
        widgetOffset: Number(row.widget_offset),
        widgetBottomOffset: Number(row.widget_bottom_offset),
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
        show_widget, widget_color, widget_side, widget_offset, widget_bottom_offset, wcag_version, wcag_level)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET show_comment_bubbles = excluded.show_comment_bubbles,
        comment_bubble_color = excluded.comment_bubble_color, show_widget = excluded.show_widget,
        widget_color = excluded.widget_color, widget_side = excluded.widget_side,
        widget_offset = excluded.widget_offset, widget_bottom_offset = excluded.widget_bottom_offset,
        wcag_version = excluded.wcag_version, wcag_level = excluded.wcag_level`,
      args: [
        next.showCommentBubbles ? 1 : 0,
        next.commentBubbleColor,
        next.showWidget ? 1 : 0,
        next.widgetColor,
        next.widgetSide,
        next.widgetOffset,
        next.widgetBottomOffset,
        next.wcagVersion,
        next.wcagLevel,
      ],
    });
    return next;
  });
  return json(settings);
}
