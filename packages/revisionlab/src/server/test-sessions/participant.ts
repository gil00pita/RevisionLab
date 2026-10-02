import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { z } from "zod";
import type { ResolvedConfig } from "../config.js";
import { consumeRateLimit, write } from "../database.js";
import { captureStep, routeSchema } from "../flow-routes.js";
import {
  createToken,
  hashValue,
  HttpError,
  json,
  readJson,
} from "../security.js";
import { testKeys } from "../../test-sessions.js";
import {
  endTest,
  expireTests,
  participantSession,
  requireLive,
  sessionFromRow,
  testCookie,
} from "./store.js";

const eventSchema = z.strictObject({
  id: z.string().uuid(),
  t: z.number().int().min(0).max(7200000),
  type: z.enum(["screen", "move", "click", "key", "scroll"]),
  route: routeSchema,
  screenId: z.string().uuid().optional(),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  key: z.enum(testKeys).optional(),
});

export async function handleTestParticipant(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
) {
  await expireTests(client);
  if (request.method === "GET" && path.length === 3 && path[2] === "enter") {
    const existing = await participantSession(request, client, config);
    if (existing?.status === "live" && Number(existing.expires_at) > Date.now())
      throw new HttpError(
        409,
        "Finish the current test before opening another test link in this browser.",
      );
    if (!/^[\w-]{43}$/.test(path[1]))
      throw new HttpError(404, "Invalid test link.");
    const row = (
      await client.execute({
        sql: "SELECT * FROM test_sessions WHERE token_hash = ? AND status = 'waiting' AND expires_at > ?",
        args: [hashValue(path[1]), Date.now()],
      })
    ).rows[0];
    if (!row)
      throw new HttpError(
        410,
        "This test link has expired or has already been used.",
      );
    return new Response(null, {
      status: 303,
      headers: {
        Location: String(row.route),
        "Set-Cookie": testCookie(request, config, path[1]),
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  }
  const row = await participantSession(request, client, config);
  if (path.length === 1 && request.method === "GET")
    return json({
      session: row ? sessionFromRow(row) : null,
      serverNow: Date.now(),
    });
  if (!row) throw new HttpError(401, "Open your test invitation to continue.");
  if (request.method !== "POST" || path.length !== 2)
    throw new HttpError(404, "Not found.");
  const id = String(row.id);
  await consumeRateLimit(client, `test:${id}`, 240, 60000);
  if (path[1] === "start") {
    const { name } = z
      .object({ name: z.string().trim().min(1).max(80) })
      .parse(await readJson(request));
    const token = createToken(),
      flowId = randomUUID(),
      now = Date.now();
    await write(client, async (tx) => {
      const result = await tx.execute({
        sql: "UPDATE test_sessions SET participant = ?, status = 'live', recording_hash = ?, started_at = ?, expires_at = ?, flow_id = ? WHERE id = ? AND status = 'waiting' AND expires_at > ?",
        args: [
          name,
          hashValue(token),
          now,
          now + Number(row.max_minutes) * 60000,
          flowId,
          id,
          now,
        ],
      });
      if (!result.rowsAffected)
        throw new HttpError(
          410,
          "This test link has expired or has already been used.",
        );
      const date = new Date(now).toISOString();
      await tx.execute({
        sql: "INSERT INTO flows (id,family_id,version,name,persona,route,status,created_by,created_at,updated_at) VALUES (?,?,1,?,?,?,'recording',?,?,?)",
        args: [
          flowId,
          flowId,
          `${row.name} — ${name}`.slice(0, 120),
          row.persona,
          row.route,
          row.created_by,
          date,
          date,
        ],
      });
    });
    return json({ ok: true }, 201, {
      "Set-Cookie": testCookie(request, config, token),
    });
  }
  if (!row.recording_hash || row.status === "waiting")
    throw new HttpError(403, "Start the test before recording.");
  if (path[1] === "stop") {
    await endTest(client, id);
    return json({ ok: true });
  }
  if (path[1] === "screens") {
    return captureStep(request, String(row.flow_id), client, config, (tx) =>
      requireLive(tx, id),
    );
  }
  if (path[1] === "events") {
    const { events } = z
      .object({ events: z.array(eventSchema).min(1).max(500) })
      .parse(await readJson(request, 250000));
    // Permit a final in-flight batch for 30 seconds, bounded to the actual end time.
    await write(client, async (tx) => {
      const current = (
        await tx.execute({
          sql: "SELECT * FROM test_sessions WHERE id = ?",
          args: [id],
        })
      ).rows[0];
      const end = Math.min(
        Number(current.ended_at ?? Date.now()),
        Number(current.expires_at),
      );
      if (current.ended_at && Date.now() > Number(current.ended_at) + 30000)
        throw new HttpError(410, "This test session has ended.");
      const count = Number(
        (
          await tx.execute({
            sql: "SELECT COUNT(*) AS n FROM test_events WHERE session_id = ?",
            args: [id],
          })
        ).rows[0].n,
      );
      if (count + events.length > 100000)
        throw new HttpError(
          409,
          "The recording event limit has been reached. End this session.",
        );
      const screens = new Set(
        (
          await tx.execute({
            sql: "SELECT id FROM steps WHERE flow_id = ?",
            args: [current.flow_id],
          })
        ).rows.map((screen) => String(screen.id)),
      );
      for (const event of events) {
        if (event.screenId && !screens.has(event.screenId))
          throw new HttpError(400, "The screen does not belong to this test.");
        if (event.t > end - Number(current.started_at)) continue;
        await tx.execute({
          sql: "INSERT OR IGNORE INTO test_events (session_id,id,t,event_json) VALUES (?,?,?,?)",
          args: [id, event.id, event.t, JSON.stringify(event)],
        });
      }
    });
    return json({ ok: true });
  }
  throw new HttpError(404, "Not found.");
}
