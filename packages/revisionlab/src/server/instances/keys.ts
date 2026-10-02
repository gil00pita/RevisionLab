import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { z } from "zod";
import { requireRole } from "../authentication.js";
import {
  createToken,
  hashValue,
  HttpError,
  json,
  readJson,
} from "../security.js";
import { write } from "../database.js";
import type { RevisionLabActor } from "../types.js";

export async function handleApiKeys(
  request: Request,
  path: string[],
  client: Client,
  actor: RevisionLabActor,
) {
  requireRole(actor, "owner");
  if (request.method === "GET" && path.length === 1) {
    const rows = (
      await client.execute(
        "SELECT id, name, role, created_at, revoked_at FROM workspace_api_keys ORDER BY created_at DESC",
      )
    ).rows;
    return json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        createdAt: row.created_at,
        revokedAt: row.revoked_at,
      })),
    );
  }
  if (request.method === "POST" && path.length === 1) {
    const input = z
      .object({
        name: z.string().trim().min(1).max(80),
        role: z.enum(["editor", "commenter"]),
      })
      .strict()
      .parse(await readJson(request));
    const id = randomUUID(),
      token = `rlk_${createToken()}`,
      now = new Date().toISOString();
    await client.execute({
      sql: "INSERT INTO workspace_api_keys (id,name,role,token_hash,created_by,created_at) VALUES (?,?,?,?,?,?)",
      args: [id, input.name, input.role, hashValue(token), actor.id, now],
    });
    return json({ id, ...input, token, createdAt: now, revokedAt: null }, 201);
  }
  if (request.method === "PATCH" && path.length === 2) {
    z.object({ revoked: z.literal(true) })
      .strict()
      .parse(await readJson(request));
    const result = await client.execute({
      sql: "UPDATE workspace_api_keys SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ?",
      args: [new Date().toISOString(), path[1]],
    });
    if (!result.rowsAffected) throw new HttpError(404, "API key not found.");
    return json({ revoked: true });
  }
  throw new HttpError(404, "Not found.");
}

export async function authenticateApiKey(
  request: Request,
  client: Client,
): Promise<RevisionLabActor> {
  const header = request.headers.get("authorization") ?? "";
  if (!/^Bearer rlk_[A-Za-z0-9_-]{43}$/.test(header))
    throw new HttpError(401, "Supply a valid workspace API key.");
  const row = (
    await client.execute({
      sql: "SELECT id,name,role FROM workspace_api_keys WHERE token_hash = ? AND revoked_at IS NULL",
      args: [hashValue(header.slice(7))],
    })
  ).rows[0];
  if (!row)
    throw new HttpError(401, "This workspace API key is invalid or revoked.");
  const delegated = request.headers.get("x-revisionlab-role");
  const role =
    row.role === "commenter" || delegated === "commenter"
      ? "commenter"
      : "editor";
  // Attribute writes to the connection, never impersonate a forwarded user's email.
  const id = `connection-${row.id}`,
    email = `${row.id}@workspace.invalid`,
    name = `Connected workspace: ${row.name}`;
  await write(client, async (tx) => {
    await tx.execute({
      sql: "INSERT OR IGNORE INTO reviewers (id,email,name,created_at) VALUES (?,?,?,?)",
      args: [id, email, name, new Date().toISOString()],
    });
  });
  return { id, email, name, role };
}
