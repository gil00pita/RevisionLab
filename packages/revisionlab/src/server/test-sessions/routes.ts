import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { z } from "zod";
import type { ResolvedConfig } from "../config.js";
import type { RevisionLabActor } from "../types.js";
import { write } from "../database.js";
import { requireRole } from "../authentication.js";
import { activePersonaName, readPersonas } from "../persona-routes.js";
import { routeSchema } from "../flow-routes.js";
import {
  createToken,
  hashValue,
  HttpError,
  json,
  readJson,
} from "../security.js";
import { expireTests, endTest, sessionFromRow } from "./store.js";

export async function handleTestSessions(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
) {
  await expireTests(client);
  if (path.length === 1 && request.method === "GET") {
    const rows = await client.execute(
      "SELECT * FROM test_sessions ORDER BY created_at DESC LIMIT 200",
    );
    return json({
      sessions: rows.rows.map(sessionFromRow),
      personas: await readPersonas(client),
    });
  }
  if (path.length === 1 && request.method === "POST") {
    requireRole(actor, "editor");
    const input = z
      .object({
        name: z.string().trim().min(1).max(100),
        route: routeSchema,
        personaId: z.string().uuid(),
        maxMinutes: z.number().int().min(1).max(120),
      })
      .parse(await readJson(request));
    if (
      input.route.startsWith(config.basePath) ||
      input.route.startsWith("/api/") ||
      /[?#]/.test(input.route)
    )
      throw new HttpError(
        400,
        "Choose a prototype pathname outside RevisionLab.",
      );
    const persona = await write(client, (tx) =>
      activePersonaName(tx, input.personaId),
    );
    const id = randomUUID(),
      token = createToken(),
      now = Date.now();
    await client.execute({
      sql: "INSERT INTO test_sessions (id,name,route,persona,token_hash,created_by,status,max_minutes,created_at,expires_at) VALUES (?,?,?,?,?,?,'waiting',?,?,?)",
      args: [
        id,
        input.name,
        input.route,
        persona,
        hashValue(token),
        actor.id,
        input.maxMinutes,
        now,
        now + 86400000,
      ],
    });
    const settings = await client.execute(
      "SELECT system_url FROM workspace_settings WHERE id = 1",
    );
    const origin =
      config.systemUrl ||
      String(settings.rows[0]?.system_url || new URL(request.url).origin);
    return json(
      {
        id,
        url: new URL(
          `${config.apiPath}/test-participant/${token}/enter`,
          origin,
        ).toString(),
      },
      201,
    );
  }
  if (!z.string().uuid().safeParse(path[1]).success)
    throw new HttpError(404, "Test session not found.");
  const row = (
    await client.execute({
      sql: "SELECT * FROM test_sessions WHERE id = ?",
      args: [path[1]],
    })
  ).rows[0];
  if (!row) throw new HttpError(404, "Test session not found.");
  if (path.length === 2 && request.method === "GET") {
    const events = await client.execute({
      sql: "SELECT event_json FROM test_events WHERE session_id = ? ORDER BY t, id",
      args: [path[1]],
    });
    const screens = row.flow_id
      ? await client.execute({
          sql: "SELECT id,title,route,screenshot FROM steps WHERE flow_id = ? ORDER BY position",
          args: [row.flow_id],
        })
      : { rows: [] };
    return json({
      session: sessionFromRow(row),
      events: events.rows.map((event) => JSON.parse(String(event.event_json))),
      screens: screens.rows.map((screen) => ({
        ...screen,
        screenshot: screen.screenshot
          ? `${config.apiPath}/artifacts/${screen.screenshot}`
          : null,
      })),
    });
  }
  if (path.length === 3 && path[2] === "stop" && request.method === "POST") {
    requireRole(actor, "editor");
    if (actor.id !== row.created_by && actor.role !== "owner")
      throw new HttpError(
        403,
        "Only the creator or an owner can stop this session.",
      );
    await endTest(client, path[1]);
    return json({ ok: true });
  }
  throw new HttpError(404, "Not found.");
}
