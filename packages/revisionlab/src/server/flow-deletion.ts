import type { Client } from "@libsql/client";
import { z } from "zod";
import { discardArtifact } from "./artifacts.js";
import { requireRole } from "./authentication.js";
import type { ResolvedConfig } from "./config.js";
import { write } from "./database.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor } from "./types.js";

const deletionSchema = z
  .strictObject({
    familyIds: z
      .array(z.string().uuid())
      .min(1)
      .max(100)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Choose each flow once.",
      ),
  });

export async function deleteFlows(
  request: Request,
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<Response> {
  requireRole(actor, "editor");
  const { familyIds } = deletionSchema.parse(await readJson(request));
  const placeholders = familyIds.map(() => "?").join(",");
  const members = `SELECT id FROM flows WHERE family_id IN (${placeholders})`;
  const artifacts = await write(client, async (transaction) => {
    const active = await transaction.execute({
      sql: `SELECT id FROM flows WHERE family_id IN (${placeholders}) AND status = 'recording' LIMIT 1`,
      args: familyIds,
    });
    if (active.rows.length)
      throw new HttpError(
        409,
        "Finish or discard unfinished recordings before deleting these flows. Nothing was deleted.",
      );

    const captured = await transaction.execute({
      sql: `SELECT a.id, a.storage, MIN(f.family_id) AS family_id FROM artifacts a
        JOIN steps s ON s.screenshot = a.id JOIN flows f ON f.id = s.flow_id
        WHERE f.family_id IN (${placeholders}) AND NOT EXISTS (
          SELECT 1 FROM steps other WHERE other.screenshot = a.id AND other.flow_id NOT IN (${members})
        ) GROUP BY a.id, a.storage`,
      args: [...familyIds, ...familyIds],
    });
    for (const artifact of captured.rows) {
      if (artifact.storage !== "database")
        await transaction.execute({
          sql: "INSERT INTO discarded_artifacts (id, flow_id, created_by, storage) VALUES (?, ?, ?, ?)",
          args: [artifact.id, artifact.family_id, actor.id, artifact.storage],
        });
      await transaction.execute({
        sql: "DELETE FROM artifacts WHERE id = ?",
        args: [artifact.id],
      });
    }
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
    const pending = await transaction.execute({
      sql: `SELECT id, storage FROM discarded_artifacts WHERE flow_id IN (${placeholders})`,
      args: familyIds,
    });
    return pending.rows.map((artifact) => ({
      id: String(artifact.id),
      storage: String(artifact.storage) as "file" | "custom",
    }));
  });

  let failed = false;
  // Bound storage concurrency even when deleting many long flow families.
  for (let start = 0; start < artifacts.length; start += 10) {
    const results = await Promise.allSettled(
      artifacts.slice(start, start + 10).map(async (artifact) => {
        await discardArtifact(artifact, config);
        await write(client, (transaction) =>
          transaction.execute({
            sql: `DELETE FROM discarded_artifacts WHERE id = ? AND flow_id IN (${placeholders})`,
            args: [artifact.id, ...familyIds],
          }),
        );
      }),
    );
    failed ||= results.some((result) => result.status === "rejected");
  }
  if (failed)
    throw new HttpError(
      503,
      "The flows were deleted, but screenshot cleanup is pending. Retry deletion to finish cleanup.",
    );
  return json({ ok: true });
}
