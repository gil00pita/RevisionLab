import type { Client } from "@libsql/client";
import { z } from "zod";
import { requireRole } from "./authentication.js";
import type { ResolvedConfig } from "./config.js";
import { write } from "./database.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor } from "./types.js";

const deletionSchema = z
  .object({
    familyIds: z
      .array(z.string().uuid())
      .min(1)
      .max(100)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Choose each flow once.",
      ),
  })
  .strict();

export async function deleteFlows(
  request: Request,
  client: Client,
  _config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<Response> {
  requireRole(actor, "editor");
  const { familyIds } = deletionSchema.parse(await readJson(request));
  const placeholders = familyIds.map(() => "?").join(",");
  const members = `SELECT id FROM flows WHERE family_id IN (${placeholders})`;
  await write(client, async (transaction) => {
    const active = await transaction.execute({
      sql: `SELECT id FROM flows WHERE family_id IN (${placeholders}) AND status = 'recording' LIMIT 1`,
      args: familyIds,
    });
    if (active.rows.length)
      throw new HttpError(
        409,
        "Finish or discard unfinished recordings before deleting these flows. Nothing was deleted.",
      );

    // Immutable screenshot artifacts remain private and retained while a
    // 30-day workspace history version can still restore their steps.
    // Explicit removal also covers installations with foreign keys disabled.
    await transaction.execute({
      sql: `DELETE FROM comments WHERE flow_id IN (${members}) OR step_id IN (SELECT id FROM steps WHERE flow_id IN (${members}))`,
      args: [...familyIds, ...familyIds],
    });
    for (const table of ["board_edges", "recording_visits", "steps"])
      await transaction.execute({
        sql: `DELETE FROM ${table} WHERE flow_id IN (${members})`,
        args: familyIds,
      });
    // Detach intra-family version references before deleting the whole family.
    await transaction.execute({
      sql: `UPDATE flows SET previous_version_id = NULL WHERE family_id IN (${placeholders})`,
      args: familyIds,
    });
    await transaction.execute({
      sql: `DELETE FROM flows WHERE family_id IN (${placeholders})`,
      args: familyIds,
    });
  });
  return json({ ok: true });
}
