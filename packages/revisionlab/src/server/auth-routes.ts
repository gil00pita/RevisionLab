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
  json,
  readCookie,
  readJson,
  valuesMatch,
} from "./security.js";
import { sessionCookie, sessionCookieName } from "./authentication.js";
import { deliverCode, usesDevelopmentEmail } from "./email.js";
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

export async function handleAuth(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
): Promise<Response> {
  if (request.method !== "POST" || path.length !== 1)
    throw new HttpError(404, "Not found.");
  if (path[0] === "request") return requestCode(request, client, config);
  if (path[0] === "verify") return verifyCode(request, client, config);
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
  const development = usesDevelopmentEmail(request, config);
  if (!development && (!config.resendApiKey || !config.emailFrom)) {
    throw new HttpError(
      503,
      "Configure RESEND_API_KEY and REVISIONLAB_EMAIL_FROM to deliver verification emails.",
    );
  }
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
    await transaction.execute({
      sql: `INSERT INTO sessions (id, reviewer_id, role, token_hash, invitation_id, expires_at, created_at)
        VALUES (?, (SELECT id FROM reviewers WHERE email = ?), ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        input.email,
        String(challenge.invitation_role ?? challenge.role),
        hashValue(sessionToken),
        challenge.invitation_id ?? null,
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
