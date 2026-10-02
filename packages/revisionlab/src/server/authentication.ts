import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { resolveConfig, type ResolvedConfig } from "./config.js";
import { getDatabase, write } from "./database.js";
import { hashValue, HttpError, isLoopback, readCookie } from "./security.js";
import type {
  RevisionLabActor,
  RevisionLabConfig,
  RevisionLabRole,
} from "./types.js";

export function sessionCookieName(config: ResolvedConfig): string {
  return `revisionlab_session_${hashValue(config.projectId).slice(0, 12)}`;
}

export async function authenticate(
  request: Request,
  client: Client,
  config: ResolvedConfig,
): Promise<RevisionLabActor> {
  const token = readCookie(request, sessionCookieName(config));
  if (token) {
    if (token.length > 128)
      throw new HttpError(401, "Your review session is invalid.");
    const result = await client.execute({
      sql: `SELECT sessions.reviewer_id, sessions.role, sessions.expires_at,
        sessions.invitation_id, sessions.membership_id, sessions.membership_revision,
        reviewers.email, reviewers.name,
        invitations.revoked_at, invitations.expires_at AS invitation_expires_at,
        invitations.role AS invitation_role, workspace_memberships.role AS membership_role,
        workspace_memberships.status AS membership_status,
        workspace_memberships.revision AS current_membership_revision
        FROM sessions JOIN reviewers ON reviewers.id = sessions.reviewer_id
        LEFT JOIN invitations ON invitations.id = sessions.invitation_id
        LEFT JOIN workspace_memberships ON workspace_memberships.id = sessions.membership_id
        WHERE sessions.token_hash = ?`,
      args: [hashValue(token)],
    });
    const row = result.rows[0];
    const now = new Date().toISOString();
    if (
      !row ||
      String(row.expires_at) <= now ||
      (row.invitation_id &&
        (row.revoked_at ||
          !row.invitation_expires_at ||
          String(row.invitation_expires_at) <= now)) ||
      (row.membership_id &&
        (row.membership_status !== "active" ||
          Number(row.membership_revision) !==
            Number(row.current_membership_revision))) ||
      (row.role === "owner" && row.email !== config.ownerEmail)
    ) {
      throw new HttpError(
        401,
        "Your review session has expired or been revoked.",
      );
    }
    return {
      id: String(row.reviewer_id),
      email: String(row.email),
      name: String(row.name),
      role: String(
        row.membership_role ?? row.invitation_role ?? row.role,
      ) as RevisionLabRole,
    };
  }
  if (config.localOwner && isLoopback(request)) {
    const email = config.ownerEmail ?? "owner@localhost";
    const id = await write(client, async (transaction) => {
      const now = new Date().toISOString();
      await transaction.execute({
        sql: "INSERT OR IGNORE INTO reviewers (id, email, name, created_at) VALUES (?, ?, ?, ?)",
        args: [randomUUID(), email, "Local owner", now],
      });
      const result = await transaction.execute({
        sql: "SELECT id FROM reviewers WHERE email = ?",
        args: [email],
      });
      const reviewerId = String(result.rows[0].id);
      await transaction.execute({
        sql: `INSERT INTO workspace_memberships (id, reviewer_id, email, role, status, revision, source, created_at, activated_at, updated_at)
          VALUES (?, ?, ?, 'owner', 'active', 1, 'owner-bootstrap', ?, ?, ?)
          ON CONFLICT(email) DO NOTHING`,
        args: [randomUUID(), reviewerId, email, now, now, now],
      });
      return reviewerId;
    });
    return { id, email, name: "Local owner", role: "owner", local: true };
  }
  throw new HttpError(401, "Open a valid review invitation to continue.");
}

/** Use at each host data boundary as well as the optional navigation proxy. */
export async function authorizeRevisionLabRequest(
  request: Request,
  initialConfig: RevisionLabConfig,
): Promise<RevisionLabActor> {
  const config = resolveConfig(initialConfig);
  return authenticate(request, await getDatabase(config), config);
}

export function requireRole(
  actor: RevisionLabActor,
  required: RevisionLabRole,
): void {
  const ranks = { commenter: 1, editor: 2, owner: 3 };
  if (ranks[actor.role] < ranks[required])
    throw new HttpError(403, "You do not have permission to do that.");
}

export function sessionCookie(
  request: Request,
  config: ResolvedConfig,
  token: string,
  maxAge: number,
): string {
  const secure =
    new URL(request.url).protocol === "https:" ||
    process.env.NODE_ENV === "production";
  return `${sessionCookieName(config)}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
