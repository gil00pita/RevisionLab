import { randomUUID } from "node:crypto";
import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import { requireRole } from "./authentication.js";
import type { ResolvedConfig } from "./config.js";
import { write } from "./database.js";
import {
  decryptSecret,
  encryptSecret,
  HttpError,
  json,
  readJson,
} from "./security.js";
import type { RevisionLabActor, RevisionLabPersona } from "./types.js";

const personaSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).default(""),
  });

export async function readPersonas(
  client: Client,
): Promise<RevisionLabPersona[]> {
  const result = await client.execute(`SELECT personas.*,
    CASE WHEN persona_credentials.persona_id IS NULL THEN 0 ELSE 1 END AS has_credentials
    FROM personas LEFT JOIN persona_credentials ON persona_credentials.persona_id = personas.id
    ORDER BY name_key, id`);
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    archivedAt: row.archived_at == null ? null : String(row.archived_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    hasCredentials: Boolean(row.has_credentials),
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
  config: ResolvedConfig,
) {
  const credentialRoute =
    path.length === 3 &&
    z.string().uuid().safeParse(path[1]).success &&
    path[2] === "credentials";
  if (credentialRoute) {
    if (request.method === "POST") {
      requireRole(actor, "editor");
      if (!config.personaEncryptionKey)
        throw new HttpError(
          503,
          "Persona credential encryption is not configured.",
        );
      const secretKey = config.personaEncryptionKey;
      const result = await client.execute({
        sql: `SELECT personas.archived_at, persona_credentials.username_ciphertext,
          persona_credentials.password_ciphertext FROM personas
          LEFT JOIN persona_credentials ON persona_credentials.persona_id = personas.id
          WHERE personas.id = ?`,
        args: [path[1]],
      });
      const row = result.rows[0];
      if (!row) throw new HttpError(404, "Persona not found.");
      if (row.archived_at)
        throw new HttpError(409, "This persona is archived.");
      if (!row.username_ciphertext || !row.password_ciphertext)
        throw new HttpError(
          404,
          "This persona has no test account configured.",
        );
      await write(client, async (transaction) => {
        await transaction.execute({
          sql: "INSERT INTO audit_events (id, actor_id, action, target_type, target_id, created_at) VALUES (?, ?, 'persona.credentials.reveal', 'persona', ?, ?)",
          args: [randomUUID(), actor.id, path[1], new Date().toISOString()],
        });
      });
      return json({
        username: decryptSecret(String(row.username_ciphertext), secretKey),
        password: decryptSecret(String(row.password_ciphertext), secretKey),
      });
    }
    requireRole(actor, "owner");
    if (request.method === "PATCH") {
      if (!config.personaEncryptionKey)
        throw new HttpError(
          503,
          "Persona credential encryption is not configured.",
        );
      const secretKey = config.personaEncryptionKey;
      const input = z
        .strictObject({
          username: z.string().trim().min(1).max(254),
          password: z.string().min(1).max(1024),
        })
        .parse(await readJson(request));
      await write(client, async (transaction) => {
        const persona = await transaction.execute({
          sql: "SELECT id FROM personas WHERE id = ?",
          args: [path[1]],
        });
        if (!persona.rows[0]) throw new HttpError(404, "Persona not found.");
        const now = new Date().toISOString();
        await transaction.execute({
          sql: `INSERT INTO persona_credentials (persona_id, username_ciphertext, password_ciphertext, updated_at, updated_by)
            VALUES (?, ?, ?, ?, ?) ON CONFLICT(persona_id) DO UPDATE SET
            username_ciphertext = excluded.username_ciphertext,
            password_ciphertext = excluded.password_ciphertext,
            updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
          args: [
            path[1],
            encryptSecret(input.username, secretKey),
            encryptSecret(input.password, secretKey),
            now,
            actor.id,
          ],
        });
        await transaction.execute({
          sql: "INSERT INTO audit_events (id, actor_id, action, target_type, target_id, created_at) VALUES (?, ?, 'persona.credentials.update', 'persona', ?, ?)",
          args: [randomUUID(), actor.id, path[1], now],
        });
      });
      return json({ ok: true });
    }
    if (request.method === "DELETE") {
      await write(client, async (transaction) => {
        await transaction.execute({
          sql: "DELETE FROM persona_credentials WHERE persona_id = ?",
          args: [path[1]],
        });
        await transaction.execute({
          sql: "INSERT INTO audit_events (id, actor_id, action, target_type, target_id, created_at) VALUES (?, ?, 'persona.credentials.remove', 'persona', ?, ?)",
          args: [randomUUID(), actor.id, path[1], new Date().toISOString()],
        });
      });
      return json({ ok: true });
    }
  }
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
        .union([personaSchema, z.strictObject({ archived: z.boolean() })])
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
