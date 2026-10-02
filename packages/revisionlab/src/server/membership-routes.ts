import { randomUUID } from "node:crypto";
import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import { requireRole } from "./authentication.js";
import type { ResolvedConfig } from "./config.js";
import { write } from "./database.js";
import { deliverLoginLink, usesDevelopmentEmail } from "./email.js";
import {
  createToken,
  hashValue,
  HttpError,
  json,
  readJson,
} from "./security.js";
import type {
  RevisionLabAccessSettings,
  RevisionLabActor,
  RevisionLabMembership,
  RevisionLabRole,
} from "./types.js";

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
const roleSchema = z.enum(["owner", "editor", "commenter"]);
const statusSchema = z.enum(["active", "suspended", "removed"]);

type AccessRow = {
  systemUrl: string;
  allowedEmails: string[];
  joinCodeHash: string | null;
  joinCodeCreatedAt: string | null;
};

export async function readAccessConfiguration(
  client: Client,
  config: ResolvedConfig,
): Promise<AccessRow> {
  const result = await client.execute(
    "SELECT system_url, allowed_email_rules, join_code_hash, join_code_created_at FROM workspace_settings WHERE id = 1",
  );
  const row = result.rows[0];
  let allowedEmails: string[] = [];
  try {
    const parsed = JSON.parse(String(row?.allowed_email_rules ?? "[]"));
    if (Array.isArray(parsed))
      allowedEmails = parsed.filter(
        (item): item is string => typeof item === "string",
      );
  } catch {
    allowedEmails = [];
  }
  return {
    systemUrl: String(row?.system_url ?? config.systemUrl ?? ""),
    allowedEmails,
    joinCodeHash:
      row?.join_code_hash == null ? null : String(row.join_code_hash),
    joinCodeCreatedAt:
      row?.join_code_created_at == null
        ? null
        : String(row.join_code_created_at),
  };
}

export async function readMemberships(
  client: Client,
): Promise<RevisionLabMembership[]> {
  const result =
    await client.execute(`SELECT workspace_memberships.*, reviewers.name
    FROM workspace_memberships LEFT JOIN reviewers ON reviewers.id = workspace_memberships.reviewer_id
    ORDER BY workspace_memberships.created_at DESC`);
  return result.rows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    name: row.name == null ? null : String(row.name),
    role: String(row.role) as RevisionLabRole,
    status: String(row.status) as RevisionLabMembership["status"],
    source: String(row.source),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function readAccessSettings(
  client: Client,
  config: ResolvedConfig,
): Promise<RevisionLabAccessSettings> {
  const access = await readAccessConfiguration(client, config);
  return {
    systemUrl: access.systemUrl,
    allowedEmails: access.allowedEmails,
    joinCodeCreatedAt: access.joinCodeCreatedAt,
  };
}

function normalizeRules(rules: string[]): string[] {
  return [
    ...new Set(rules.map((rule) => rule.trim().toLowerCase()).filter(Boolean)),
  ];
}

export function emailAllowed(email: string, rules: string[]): boolean {
  const normalized = email.toLowerCase();
  return rules.some((rule) =>
    rule.startsWith("@")
      ? normalized.endsWith(rule) && normalized.length > rule.length
      : normalized === rule,
  );
}

export function validateSystemUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(400, "Enter a valid absolute system URL.");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
    throw new HttpError(
      400,
      "The system URL must use HTTPS outside local development.",
    );
  if (url.username || url.password || url.search || url.hash)
    throw new HttpError(
      400,
      "The system URL cannot contain credentials, a query, or a fragment.",
    );
  url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString().replace(/\/$/, "");
}

function loginUrl(
  systemUrl: string,
  config: ResolvedConfig,
  token: string,
): string {
  const url = new URL(systemUrl);
  url.pathname = `${url.pathname.replace(/\/$/, "")}${config.basePath}/access`;
  url.searchParams.set("login", token);
  return url.toString();
}

export async function createMagicLogin(
  request: Request,
  client: Client,
  config: ResolvedConfig,
  membershipId: string,
  email: string,
  returnTo: string,
  addedByOwner = false,
): Promise<{ devLoginUrl?: string }> {
  const access = await readAccessConfiguration(client, config);
  const systemUrl =
    access.systemUrl ||
    ((await usesDevelopmentEmail(request, config))
      ? new URL(request.url).origin
      : "");
  if (!systemUrl)
    throw new HttpError(
      503,
      "Configure the RevisionLab system URL before sending login emails.",
    );
  const validatedUrl = validateSystemUrl(systemUrl);
  const token = createToken();
  const now = new Date();
  await write(client, async (transaction) => {
    await transaction.execute({
      sql: "UPDATE login_challenges SET used_at = ? WHERE email = ? AND used_at IS NULL",
      args: [now.toISOString(), email],
    });
    await transaction.execute({
      sql: `INSERT INTO login_challenges (id, membership_id, email, token_hash, return_to, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        membershipId,
        email,
        hashValue(token),
        returnTo,
        new Date(now.getTime() + 15 * 60_000).toISOString(),
        now.toISOString(),
      ],
    });
  });
  const url = loginUrl(validatedUrl, config, token);
  const development = await usesDevelopmentEmail(request, config);
  await deliverLoginLink(config, email, url, development, addedByOwner);
  return development ? { devLoginUrl: url } : {};
}

async function ownerCount(
  transaction: Transaction,
  excludedId?: string,
): Promise<number> {
  const result = await transaction.execute({
    sql: `SELECT COUNT(*) AS count FROM workspace_memberships
      WHERE role = 'owner' AND status = 'active' ${excludedId ? "AND id <> ?" : ""}`,
    args: excludedId ? [excludedId] : [],
  });
  return Number(result.rows[0]?.count ?? 0);
}

export async function handleMemberships(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<Response> {
  requireRole(actor, "owner");
  if (path[0] === "members" && request.method === "POST" && path.length === 1) {
    const input = z
      .strictObject({ email: emailSchema, role: roleSchema })
      .parse(await readJson(request));
    const now = new Date().toISOString();
    const membershipId = await write(client, async (transaction) => {
      const existing = await transaction.execute({
        sql: "SELECT id, status FROM workspace_memberships WHERE email = ?",
        args: [input.email],
      });
      const id = existing.rows[0] ? String(existing.rows[0].id) : randomUUID();
      await transaction.execute({
        sql: `INSERT INTO workspace_memberships (id, email, role, status, revision, source, invited_by, created_at, updated_at)
          VALUES (?, ?, ?, 'pending', 1, 'manual', ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET role = excluded.role, status = 'pending',
          revision = workspace_memberships.revision + 1, invited_by = excluded.invited_by, updated_at = excluded.updated_at`,
        args: [id, input.email, input.role, actor.id, now, now],
      });
      await transaction.execute({
        sql: "INSERT INTO audit_events (id, actor_id, action, target_type, target_id, created_at) VALUES (?, ?, 'membership.add', 'membership', ?, ?)",
        args: [randomUUID(), actor.id, id, now],
      });
      return id;
    });
    const login = await createMagicLogin(
      request,
      client,
      config,
      membershipId,
      input.email,
      config.basePath,
      true,
    );
    return json({ id: membershipId, ...login }, 201);
  }
  if (
    path[0] === "members" &&
    request.method === "PATCH" &&
    path.length === 2 &&
    z.string().uuid().safeParse(path[1]).success
  ) {
    const input = z
      .strictObject({
        role: roleSchema.optional(),
        status: statusSchema.optional(),
      })
      .refine((value) => value.role || value.status)
      .parse(await readJson(request));
    await write(client, async (transaction) => {
      const found = await transaction.execute({
        sql: "SELECT role, status FROM workspace_memberships WHERE id = ?",
        args: [path[1]],
      });
      const member = found.rows[0];
      if (!member) throw new HttpError(404, "Workspace member not found.");
      const removesOwner =
        member.role === "owner" &&
        member.status === "active" &&
        ((input.role && input.role !== "owner") ||
          (input.status && input.status !== "active"));
      if (removesOwner && (await ownerCount(transaction, path[1])) < 1)
        throw new HttpError(
          409,
          "A workspace must retain at least one active Owner.",
        );
      const now = new Date().toISOString();
      await transaction.execute({
        sql: `UPDATE workspace_memberships SET role = COALESCE(?, role), status = COALESCE(?, status),
          revision = revision + 1, updated_at = ? WHERE id = ?`,
        args: [input.role ?? null, input.status ?? null, now, path[1]],
      });
      await transaction.execute({
        sql: "DELETE FROM sessions WHERE membership_id = ?",
        args: [path[1]],
      });
      await transaction.execute({
        sql: "INSERT INTO audit_events (id, actor_id, action, target_type, target_id, created_at) VALUES (?, ?, 'membership.update', 'membership', ?, ?)",
        args: [randomUUID(), actor.id, path[1], now],
      });
    });
    return json({ ok: true });
  }
  if (
    path[0] === "access" &&
    path[1] === "settings" &&
    request.method === "PATCH"
  ) {
    const input = z
      .strictObject({
        systemUrl: z.string().trim().min(1).max(2048),
        allowedEmails: z.array(z.string().trim().min(2).max(254)).max(100),
      })
      .parse(await readJson(request));
    const systemUrl = validateSystemUrl(input.systemUrl);
    const allowedEmails = normalizeRules(input.allowedEmails);
    if (
      allowedEmails.some(
        (rule) => !rule.startsWith("@") && !emailSchema.safeParse(rule).success,
      )
    )
      throw new HttpError(
        400,
        "Allowed email rules must be full email addresses or domains beginning with @.",
      );
    await write(client, async (transaction) => {
      await transaction.execute(
        "INSERT OR IGNORE INTO workspace_settings (id) VALUES (1)",
      );
      await transaction.execute({
        sql: "UPDATE workspace_settings SET system_url = ?, allowed_email_rules = ? WHERE id = 1",
        args: [systemUrl, JSON.stringify(allowedEmails)],
      });
      await transaction.execute({
        sql: "INSERT INTO audit_events (id, actor_id, action, target_type, target_id, created_at) VALUES (?, ?, 'access.settings.update', 'installation', '1', ?)",
        args: [randomUUID(), actor.id, new Date().toISOString()],
      });
    });
    return json({ ok: true });
  }
  if (
    path[0] === "access" &&
    path[1] === "join-code" &&
    request.method === "POST"
  ) {
    const code = createToken(18);
    const now = new Date().toISOString();
    await write(client, async (transaction) => {
      await transaction.execute(
        "INSERT OR IGNORE INTO workspace_settings (id) VALUES (1)",
      );
      await transaction.execute({
        sql: "UPDATE workspace_settings SET join_code_hash = ?, join_code_created_at = ? WHERE id = 1",
        args: [hashValue(code), now],
      });
      await transaction.execute({
        sql: "INSERT INTO audit_events (id, actor_id, action, target_type, target_id, created_at) VALUES (?, ?, 'join-code.rotate', 'installation', '1', ?)",
        args: [randomUUID(), actor.id, now],
      });
    });
    return json({ code, createdAt: now });
  }
  throw new HttpError(404, "Not found.");
}
