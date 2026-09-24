import { randomUUID } from "node:crypto";
import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import { requireRole } from "./authentication.js";
import { write } from "./database.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor, RevisionLabPersona } from "./types.js";

const personaSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).default(""),
  })
  .strict();

export async function readPersonas(
  client: Client,
): Promise<RevisionLabPersona[]> {
  const result = await client.execute(
    "SELECT * FROM personas ORDER BY name_key, id",
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    archivedAt: row.archived_at == null ? null : String(row.archived_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function activePersonaName(
  transaction: Transaction,
  id: string,
): Promise<string> {
  const result = await transaction.execute({
    sql: "SELECT name, archived_at FROM personas WHERE id = ?",
    args: [id],
  });
  const persona = result.rows[0];
  if (!persona)
    throw new HttpError(
      404,
      "This persona is no longer available. Choose another persona.",
    );
  if (persona.archived_at != null)
    throw new HttpError(
      409,
      "This persona has been archived. Choose another persona.",
    );
  return String(persona.name);
}

export async function handlePersonas(
  request: Request,
  path: string[],
  client: Client,
  actor: RevisionLabActor,
) {
  requireRole(actor, "editor");
  const creating = request.method === "POST" && path.length === 1;
  const updating =
    request.method === "PATCH" &&
    path.length === 2 &&
    z.string().uuid().safeParse(path[1]).success;
  if (!creating && !updating) throw new HttpError(404, "Not found.");
  const body = await readJson(request);
  const input = creating
    ? personaSchema.parse(body)
    : z
        .union([personaSchema, z.object({ archived: z.boolean() }).strict()])
        .parse(body);
  const id = creating ? randomUUID() : path[1];
  await write(client, async (transaction) => {
    if (!creating) {
      const existing = await transaction.execute({
        sql: "SELECT id FROM personas WHERE id = ?",
        args: [id],
      });
      if (!existing.rows[0]) throw new HttpError(404, "Persona not found.");
    }
    const now = new Date().toISOString();
    if ("archived" in input) {
      await transaction.execute({
        sql: "UPDATE personas SET archived_at = ?, updated_at = ? WHERE id = ?",
        args: [input.archived ? now : null, now, id],
      });
      return;
    }
    const key = input.name.toLocaleLowerCase("en-US");
    const duplicate = await transaction.execute({
      sql: "SELECT id FROM personas WHERE name_key = ? AND id <> ?",
      args: [key, id],
    });
    if (duplicate.rows.length)
      throw new HttpError(
        409,
        "A persona with this name already exists, including archived personas.",
      );
    if (creating) {
      await transaction.execute({
        sql: "INSERT INTO personas (id, name, name_key, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        args: [id, input.name, key, input.description, now, now],
      });
    } else {
      await transaction.execute({
        sql: "UPDATE personas SET name = ?, name_key = ?, description = ?, updated_at = ? WHERE id = ?",
        args: [input.name, key, input.description, now, id],
      });
    }
  });
  return json({ id }, creating ? 201 : 200);
}
