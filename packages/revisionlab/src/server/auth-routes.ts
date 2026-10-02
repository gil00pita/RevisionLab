import { withSetupOwner } from "./owner-identity.js";
import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { z } from "zod";
import type { ResolvedConfig } from "./config.js";
import { consumeRateLimit, write } from "./database.js";
import {
  createOtp,
  createToken,
  hashValue,
  HttpError,
  isLoopback,
  json,
  readCookie,
  readJson,
  valuesMatch,
} from "./security.js";
import { sessionCookie, sessionCookieName } from "./authentication.js";
import { deliverCode, usesDevelopmentEmail } from "./email.js";
import {
  createMagicLogin,
  emailAllowed,
  readAccessConfiguration,
} from "./membership-routes.js";
import type { RevisionLabRole } from "./types.js";

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((email) => email.toLowerCase());
const requestSchema = z.object({
  email: emailSchema,
  inviteToken: z.string().min(16).max(128).optional(),
});
const verifySchema = z.object({
  challengeId: z.string().uuid(),
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/),
  name: z.string().trim().min(1).max(120),
});
const magicRequestSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1).max(120),
  joinCode: z.string().min(8).max(128).optional(),
  returnTo: z.string().max(2048).default(""),
});
const magicConsumeSchema = z.object({
  token: z.string().min(16).max(256),
  name: z.string().trim().min(1).max(120).optional(),
});

export async function handleAuth(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
): Promise<Response> {
  config = await withSetupOwner(client, config);
  if (request.method === "GET" && path.length === 1 && path[0] === "options") {
    return json({
      localOwner: Boolean(config.localOwner && isLoopback(request)),
    });
  }
  if (request.method !== "POST" || path.length !== 1)
    throw new HttpError(404, "Not found.");
  if (path[0] === "request") return requestCode(request, client, config);
  if (path[0] === "verify") return verifyCode(request, client, config);
  if (path[0] === "magic-request")
    return requestMagicLink(request, client, config);
  if (path[0] === "magic-consume")
    return consumeMagicLink(request, client, config);
  if (path[0] === "logout") {
    const token = readCookie(request, sessionCookieName(config));
    if (token)
      await write(client, async (transaction) => {
        await transaction.execute({
          sql: "DELETE FROM sessions WHERE token_hash = ?",
          args: [hashValue(token)],
        });
      });
    return json({ ok: true }, 200, {
      "Set-Cookie": sessionCookie(request, config, "", 0),
    });
  }
  throw new HttpError(404, "Not found.");
}

function safeReturnTo(value: string, config: ResolvedConfig): string {
  if (!value) return config.basePath;
  try {
    const url = new URL(value, "http://revisionlab.local");
    if (
      url.origin !== "http://revisionlab.local" ||
      url.pathname.startsWith(config.apiPath)
    )
      return config.basePath;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return config.basePath;
  }
}

async function requestMagicLink(
  request: Request,
  client: Client,
  config: ResolvedConfig,
): Promise<Response> {
  const input = magicRequestSchema.parse(await readJson(request));
  await consumeRateLimit(client, "magic:project", 100, 60 * 60_000);
  await consumeRateLimit(
    client,
    `magic:email:${hashValue(input.email)}`,
    5,
    15 * 60_000,
  );
  const access = await readAccessConfiguration(client, config);
  const existing = await client.execute({
    sql: "SELECT id, status FROM workspace_memberships WHERE email = ?",
    args: [input.email],
  });
  let membershipId =
    existing.rows[0] && existing.rows[0].status !== "removed"
      ? String(existing.rows[0].id)
      : null;
  const owner = input.email === config.ownerEmail;
  const mayJoin = Boolean(
    input.joinCode &&
      access.joinCodeHash &&
      valuesMatch(input.joinCode, access.joinCodeHash) &&
      emailAllowed(input.email, access.allowedEmails),
  );
  if (!membershipId && (owner || mayJoin)) {
    membershipId = randomUUID();
    const now = new Date().toISOString();
    await write(client, async (transaction) => {
      await transaction.execute({
        sql: "INSERT INTO reviewers (id, email, name, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name",
        args: [randomUUID(), input.email, input.name, now],
      });
      await transaction.execute({
        sql: `INSERT INTO workspace_memberships (id, reviewer_id, email, role, status, revision, source, created_at, activated_at, updated_at)
          VALUES (?, (SELECT id FROM reviewers WHERE email = ?), ?, ?, ?, 1, ?, ?, ?, ?)`,
        args: [
          membershipId,
          input.email,
          input.email,
          owner ? "owner" : "commenter",
          owner ? "active" : "pending",
          owner ? "owner-bootstrap" : "code-join",
          now,
          owner ? now : null,
          now,
        ],
      });
    });
  }
  if (!membershipId) return json({ ok: true });
  const membership = await client.execute({
    sql: "SELECT status FROM workspace_memberships WHERE id = ?",
    args: [membershipId],
  });
  if (["suspended", "removed"].includes(String(membership.rows[0]?.status)))
    return json({ ok: true });
  const result = await createMagicLogin(
    request,
    client,
    config,
    membershipId,
    input.email,
    safeReturnTo(input.returnTo, config),
  );
  return json({ ok: true, ...result });
}

async function consumeMagicLink(
  request: Request,
  client: Client,
  config: ResolvedConfig,
): Promise<Response> {
  const input = magicConsumeSchema.parse(await readJson(request));
  const now = new Date();
  const sessionToken = createToken();
  const result = await write(client, async (transaction) => {
    const found = await transaction.execute({
      sql: `SELECT login_challenges.*, workspace_memberships.role, workspace_memberships.status,
        workspace_memberships.revision FROM login_challenges
        JOIN workspace_memberships ON workspace_memberships.id = login_challenges.membership_id
        WHERE login_challenges.token_hash = ?`,
      args: [hashValue(input.token)],
    });
    const challenge = found.rows[0];
    if (
      !challenge ||
      challenge.used_at ||
      String(challenge.expires_at) <= now.toISOString() ||
      ["suspended", "removed"].includes(String(challenge.status))
    )
      return null;
    await transaction.execute({
      sql: "INSERT OR IGNORE INTO reviewers (id, email, name, created_at) VALUES (?, ?, ?, ?)",
      args: [
        randomUUID(),
        challenge.email,
        input.name ?? String(challenge.email).split("@")[0],
        now.toISOString(),
      ],
    });
    await transaction.execute({
      sql: `UPDATE workspace_memberships SET reviewer_id = (SELECT id FROM reviewers WHERE email = ?),
        status = 'active', activated_at = COALESCE(activated_at, ?), updated_at = ? WHERE id = ?`,
      args: [
        challenge.email,
        now.toISOString(),
        now.toISOString(),
        challenge.membership_id,
      ],
    });
    await transaction.execute({
      sql: `INSERT INTO sessions (id, reviewer_id, role, token_hash, membership_id, membership_revision, expires_at, created_at)
        VALUES (?, (SELECT id FROM reviewers WHERE email = ?), ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        challenge.email,
        challenge.role,
        hashValue(sessionToken),
        challenge.membership_id,
        challenge.revision,
        new Date(now.getTime() + 14 * 86_400_000).toISOString(),
        now.toISOString(),
      ],
    });
    await transaction.execute({
      sql: "UPDATE login_challenges SET used_at = ? WHERE id = ?",
      args: [now.toISOString(), challenge.id],
    });
    return { returnTo: String(challenge.return_to) };
  });
  if (!result)
    throw new HttpError(403, "This login link is invalid or has expired.");
  return json({ ok: true, returnTo: result.returnTo }, 200, {
    "Set-Cookie": sessionCookie(request, config, sessionToken, 14 * 86_400),
  });
}

async function requestCode(
  request: Request,
  client: Client,
  config: ResolvedConfig,
): Promise<Response> {
  const input = requestSchema.parse(await readJson(request));
  await consumeRateLimit(client, "auth:project", 100, 60 * 60_000);
  await consumeRateLimit(
    client,
    `auth:email:${hashValue(input.email)}`,
    5,
    15 * 60_000,
  );
  let invitationId: string | null = null;
  let role: RevisionLabRole = "owner";
  let invitationExpires = Infinity;
  if (input.email !== config.ownerEmail) {
    if (!input.inviteToken)
      throw new HttpError(403, "This invitation is invalid or has expired.");
    const result = await client.execute({
      sql: "SELECT * FROM invitations WHERE token_hash = ?",
      args: [hashValue(input.inviteToken)],
    });
    const invitation = result.rows[0];
    if (
      !invitation ||
      invitation.revoked_at ||
      String(invitation.expires_at) <= new Date().toISOString() ||
      (invitation.email && invitation.email !== input.email)
    ) {
      throw new HttpError(403, "This invitation is invalid or has expired.");
    }
    invitationId = String(invitation.id);
    role = String(invitation.role) as RevisionLabRole;
    invitationExpires = Date.parse(String(invitation.expires_at));
  }
  const development = await usesDevelopmentEmail(request, config);
  const code = createOtp();
  const challengeId = randomUUID();
  const now = new Date();
  await write(client, async (transaction) => {
    await transaction.execute({
      sql: "UPDATE otp_challenges SET used_at = ? WHERE email = ? AND used_at IS NULL",
      args: [now.toISOString(), input.email],
    });
    await transaction.execute({
      sql: `INSERT INTO otp_challenges (id, invitation_id, email, role, code_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        challengeId,
        invitationId,
        input.email,
        role,
        hashValue(`${challengeId}:${code}`),
        new Date(
          Math.min(now.getTime() + 10 * 60_000, invitationExpires),
        ).toISOString(),
        now.toISOString(),
      ],
    });
  });
  try {
    await deliverCode(config, input.email, code, development);
  } catch (error) {
    await write(client, async (transaction) => {
      await transaction.execute({
        sql: "DELETE FROM otp_challenges WHERE id = ?",
        args: [challengeId],
      });
    });
    throw error;
  }
  return json({ challengeId, ...(development ? { devCode: code } : {}) });
}

async function verifyCode(
  request: Request,
  client: Client,
  config: ResolvedConfig,
): Promise<Response> {
  const input = verifySchema.parse(await readJson(request));
  await consumeRateLimit(
    client,
    `verify:${hashValue(input.email)}`,
    30,
    15 * 60_000,
  );
  const now = new Date();
  const sessionToken = createToken();
  const result = await write(client, async (transaction) => {
    const found = await transaction.execute({
      sql: `SELECT otp_challenges.*, invitations.revoked_at, invitations.expires_at AS invitation_expires_at,
        invitations.role AS invitation_role FROM otp_challenges
        LEFT JOIN invitations ON invitations.id = otp_challenges.invitation_id
        WHERE otp_challenges.id = ? AND otp_challenges.email = ?`,
      args: [input.challengeId, input.email],
    });
    const challenge = found.rows[0];
    if (
      !challenge ||
      challenge.used_at ||
      Number(challenge.attempts) >= 5 ||
      String(challenge.expires_at) <= now.toISOString() ||
      (challenge.invitation_id &&
        (challenge.revoked_at ||
          !challenge.invitation_expires_at ||
          String(challenge.invitation_expires_at) <= now.toISOString())) ||
      (challenge.role === "owner" && input.email !== config.ownerEmail)
    ) {
      return { error: "This verification code is no longer valid." };
    }
    await transaction.execute({
      sql: "UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?",
      args: [input.challengeId],
    });
    if (
      !valuesMatch(
        `${input.challengeId}:${input.code}`,
        String(challenge.code_hash),
      )
    ) {
      return { error: "The verification code is incorrect." };
    }
    const expiresAt = new Date(
      Math.min(
        now.getTime() + 14 * 86_400_000,
        challenge.invitation_expires_at
          ? Date.parse(String(challenge.invitation_expires_at))
          : Infinity,
      ),
    );
    await transaction.execute({
      sql: `INSERT INTO reviewers (id, email, name, created_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET name = excluded.name`,
      args: [randomUUID(), input.email, input.name, now.toISOString()],
    });
    const effectiveRole = String(challenge.invitation_role ?? challenge.role);
    let membershipId: string | null = null;
    let membershipRevision: number | null = null;
    if (effectiveRole === "owner") {
      await transaction.execute({
        sql: `INSERT INTO workspace_memberships (id, reviewer_id, email, role, status, revision, source, created_at, activated_at, updated_at)
          VALUES (?, (SELECT id FROM reviewers WHERE email = ?), ?, 'owner', 'active', 1, 'owner-bootstrap', ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET reviewer_id = excluded.reviewer_id, role = 'owner', status = 'active', revision = workspace_memberships.revision + 1, updated_at = excluded.updated_at`,
        args: [
          randomUUID(),
          input.email,
          input.email,
          now.toISOString(),
          now.toISOString(),
          now.toISOString(),
        ],
      });
      const membership = await transaction.execute({
        sql: "SELECT id, revision FROM workspace_memberships WHERE email = ?",
        args: [input.email],
      });
      membershipId = String(membership.rows[0].id);
      membershipRevision = Number(membership.rows[0].revision);
    }
    await transaction.execute({
      sql: `INSERT INTO sessions (id, reviewer_id, role, token_hash, invitation_id, membership_id, membership_revision, expires_at, created_at)
        VALUES (?, (SELECT id FROM reviewers WHERE email = ?), ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        input.email,
        effectiveRole,
        hashValue(sessionToken),
        challenge.invitation_id ?? null,
        membershipId,
        membershipRevision,
        expiresAt.toISOString(),
        now.toISOString(),
      ],
    });
    await transaction.execute({
      sql: "UPDATE otp_challenges SET used_at = ? WHERE id = ?",
      args: [now.toISOString(), input.challengeId],
    });
    return {
      maxAge: Math.floor((expiresAt.getTime() - now.getTime()) / 1_000),
    };
  });
  if (result.error) throw new HttpError(403, result.error);
  return json({ ok: true }, 200, {
    "Set-Cookie": sessionCookie(request, config, sessionToken, result.maxAge!),
  });
}
