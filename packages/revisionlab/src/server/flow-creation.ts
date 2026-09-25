import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { write } from "./database.js";
import { activePersonaName } from "./persona-routes.js";
import { HttpError, json } from "./security.js";
import type { RevisionLabActor } from "./types.js";

export async function createFlow(
  client: Client,
  actor: RevisionLabActor,
  input: {
    name: string;
    persona?: string;
    personaId?: string;
    route: string;
    replaceFlowId?: string;
  },
): Promise<Response> {
  return write(client, async (transaction) => {
    const persona = input.personaId
      ? await activePersonaName(transaction, input.personaId)
      : input.persona!;
    const latest = await transaction.execute(`
      SELECT f.*, EXISTS(SELECT 1 FROM flows d WHERE d.family_id = f.family_id AND d.status = 'recording') AS active
      FROM flows f WHERE NOT EXISTS (
        SELECT 1 FROM flows newer WHERE newer.family_id = f.family_id AND newer.version > f.version
      ) ORDER BY f.created_at DESC, f.id`);
    const matches = latest.rows.filter(
      (row) =>
        String(row.name).trim().toLowerCase() ===
        input.name.trim().toLowerCase(),
    );
    const previous = matches.find((row) => row.id === input.replaceFlowId);
    if (matches.length && (!previous || Number(previous.active))) {
      return json(
        {
          code: "FLOW_NAME_EXISTS",
          error:
            "A flow with this name already exists. Confirm replacement or choose another name.",
          conflicts: matches.map((row) => ({
            id: String(row.id),
            name: String(row.name),
            persona: String(row.persona),
            route: String(row.route),
            version: Number(row.version),
            canReplace: !Number(row.active),
          })),
        },
        409,
      );
    }
    if (input.replaceFlowId && !previous)
      throw new HttpError(
        409,
        "The selected flow is no longer available under this name. Go back and check the name again.",
      );
    const id = randomUUID();
    const familyId = previous ? String(previous.family_id) : id;
    const version = previous ? Number(previous.version) + 1 : 1;
    const now = new Date().toISOString();
    await transaction.execute({
      sql: `INSERT INTO flows (id, family_id, version, previous_version_id, name, persona, route, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'recording', ?, ?, ?)`,
      args: [
        id,
        familyId,
        version,
        previous ? String(previous.id) : null,
        input.name,
        persona,
        input.route,
        actor.id,
        now,
        now,
      ],
    });
    return json({ id, familyId, version, persona }, 201);
  });
}
