import { aiSettingsSchema } from "./ai-settings-schema.js";
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

const settingsSchema = z
  .object({
    ai: aiSettingsSchema,
    showCommentBubbles: z.boolean(),
    commentBubbleColor: z.enum(commentBubbleColors),
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
        ai:
          row.ai_instructions_json == null
            ? defaultSettings.ai
            : JSON.parse(String(row.ai_instructions_json)),
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
  const patch = settingsPatch.parse(await readJson(request, 524_288));
  const settings = await write(client, async (transaction) => {
    const next = { ...(await readSettings(transaction)), ...patch };
    await transaction.execute({
      sql: `INSERT INTO workspace_settings (id, show_comment_bubbles, comment_bubble_color, ai_instructions_json) VALUES (1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET show_comment_bubbles = excluded.show_comment_bubbles,
        comment_bubble_color = excluded.comment_bubble_color,
        ai_instructions_json = excluded.ai_instructions_json`,
      args: [
        next.showCommentBubbles ? 1 : 0,
        next.commentBubbleColor,
        JSON.stringify(next.ai),
      ],
    });
    return next;
  });
  return json(settings);
}
