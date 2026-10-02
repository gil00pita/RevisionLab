import type { Client, Row, Transaction } from "@libsql/client";
import type { TestSession } from "../../test-sessions.js";
import type { ResolvedConfig } from "../config.js";
import { hashValue, HttpError, readCookie } from "../security.js";
import { write } from "../database.js";

export function sessionFromRow(row: Row): TestSession {
  return {
    id: String(row.id),
    name: String(row.name),
    route: String(row.route),
    participant: row.participant == null ? null : String(row.participant),
    createdBy: String(row.created_by),
    status: row.status as TestSession["status"],
    maxMinutes: Number(row.max_minutes),
    createdAt: Number(row.created_at),
    expiresAt: Number(row.expires_at),
    startedAt: row.started_at == null ? null : Number(row.started_at),
    endedAt: row.ended_at == null ? null : Number(row.ended_at),
    flowId: row.flow_id == null ? null : String(row.flow_id),
  };
}
export function testCookieName(config: ResolvedConfig) {
  return `revisionlab_test_${hashValue(config.projectId).slice(0, 12)}`;
}
export function testCookie(
  request: Request,
  config: ResolvedConfig,
  token: string,
) {
  return `${testCookieName(config)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function expireTests(client: Client) {
  await write(client, async (tx) => {
    const expired = await tx.execute({
      sql: "SELECT flow_id FROM test_sessions WHERE status IN ('waiting','live') AND expires_at <= ?",
      args: [Date.now()],
    });
    for (const row of expired.rows)
      if (row.flow_id)
        await tx.execute({
          sql: "UPDATE flows SET status = 'complete' WHERE id = ?",
          args: [row.flow_id],
        });
    await tx.execute({
      sql: "UPDATE test_sessions SET status = 'expired', ended_at = expires_at WHERE status IN ('waiting','live') AND expires_at <= ?",
      args: [Date.now()],
    });
  });
}
export async function participantSession(
  request: Request,
  client: Client,
  config: ResolvedConfig,
) {
  const token = readCookie(request, testCookieName(config));
  if (!token || token.length > 100) return undefined;
  const result = await client.execute({
    sql: "SELECT * FROM test_sessions WHERE (token_hash = ? AND status = 'waiting') OR recording_hash = ?",
    args: [hashValue(token), hashValue(token)],
  });
  return result.rows[0];
}
export async function requireLive(tx: Transaction, id: string) {
  const result = await tx.execute({
    sql: "SELECT * FROM test_sessions WHERE id = ? AND status = 'live' AND expires_at > ?",
    args: [id, Date.now()],
  });
  if (!result.rows[0]) throw new HttpError(410, "This test session has ended.");
  return result.rows[0];
}
export async function endTest(client: Client, id: string) {
  await write(client, async (tx) => {
    await tx.execute({
      sql: "UPDATE flows SET status = 'complete' WHERE id = (SELECT flow_id FROM test_sessions WHERE id = ?)",
      args: [id],
    });
    await tx.execute({
      sql: "UPDATE test_sessions SET status = 'completed', ended_at = ? WHERE id = ? AND status IN ('live','waiting')",
      args: [Date.now(), id],
    });
  });
}
