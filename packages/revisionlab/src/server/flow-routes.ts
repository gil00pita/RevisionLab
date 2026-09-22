import { randomUUID } from "node:crypto";
import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import { requireRole } from "./authentication.js";
import { saveBoard } from "./board-routes.js";
import {
  discardArtifact,
  insertArtifact,
  MAX_CAPTURE_BODY_BYTES,
  prepareArtifact,
} from "./artifacts.js";
import type { ResolvedConfig } from "./config.js";
import { write } from "./database.js";
import { discardRecording } from "./recording-discard.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor } from "./types.js";

export const routeSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .regex(/^\/(?!\/)/, "Use a same-origin pathname.")
  .refine(
    (route) => !/[\\\u0000-\u001f]/.test(route),
    "Use a same-origin pathname.",
  );
const flowSchema = z.object({
  name: z.string().trim().min(1).max(120),
  persona: z.string().trim().min(1).max(120),
  route: routeSchema,
});
const stepSchema = z.object({
  title: z.string().trim().min(1).max(160),
  route: routeSchema,
  screenshot: z.string().max(MAX_CAPTURE_BODY_BYTES).nullable().optional(),
});

async function requireFlow(transaction: Transaction, id: string) {
  const found = await transaction.execute({
    sql: "SELECT * FROM flows WHERE id = ?",
    args: [id],
  });
  if (!found.rows[0]) throw new HttpError(404, "Recording not found.");
  return found.rows[0];
}

export async function handleFlows(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<Response> {
  requireRole(actor, "editor");
  if (request.method === "POST" && path.length === 1) {
    const input = flowSchema.parse(await readJson(request));
    const id = randomUUID();
    const now = new Date().toISOString();
    await write(client, async (transaction) => {
      await transaction.execute({
        sql: `INSERT INTO flows (id, family_id, version, name, persona, route, status, created_by, created_at, updated_at)
          VALUES (?, ?, 1, ?, ?, ?, 'recording', ?, ?, ?)`,
        args: [
          id,
          id,
          input.name,
          input.persona,
          input.route,
          actor.id,
          now,
          now,
        ],
      });
    });
    return json({ id, familyId: id, version: 1 }, 201);
  }
  if (path.length < 2 || !z.string().uuid().safeParse(path[1]).success)
    throw new HttpError(404, "Recording not found.");
  if (request.method === "POST" && path.length === 3 && path[2] === "discard") {
    return discardRecording(path[1], client, config, actor);
  }
  if (request.method === "PATCH" && path.length === 3 && path[2] === "board") {
    return saveBoard(request, path[1], client);
  }
  if (request.method === "POST" && path.length === 3 && path[2] === "steps") {
    return captureStep(request, path[1], client, config);
  }
  if (
    request.method === "POST" &&
    path.length === 3 &&
    path[2] === "versions"
  ) {
    const input = flowSchema.partial().parse(await readJson(request));
    const id = randomUUID();
    const now = new Date().toISOString();
    const version = await write(client, async (transaction) => {
      const previous = await requireFlow(transaction, path[1]);
      const family = await transaction.execute({
        sql: "SELECT version, status FROM flows WHERE family_id = ?",
        args: [previous.family_id],
      });
      if (family.rows.some((row) => row.status === "recording")) {
        throw new HttpError(
          409,
          "Finish the current recording before starting another version.",
        );
      }
      const number =
        Math.max(...family.rows.map((row) => Number(row.version))) + 1;
      await transaction.execute({
        sql: `INSERT INTO flows (id, family_id, version, previous_version_id, name, persona, route,
          status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'recording', ?, ?, ?)`,
        args: [
          id,
          previous.family_id,
          number,
          path[1],
          input.name ?? previous.name,
          input.persona ?? previous.persona,
          input.route ?? previous.route,
          actor.id,
          now,
          now,
        ],
      });
      return { familyId: previous.family_id, version: number };
    });
    return json({ id, ...version }, 201);
  }
  if (request.method === "PATCH" && path.length === 2) {
    const input = z
      .object({ status: z.enum(["recording", "complete"]) })
      .parse(await readJson(request));
    await write(client, async (transaction) => {
      const flow = await requireFlow(transaction, path[1]);
      if (flow.status === "complete" && input.status === "recording") {
        throw new HttpError(
          409,
          "Completed versions are preserved. Start a new version to record changes.",
        );
      }
      await transaction.execute({
        sql: "UPDATE flows SET status = ?, updated_at = ? WHERE id = ?",
        args: [input.status, new Date().toISOString(), path[1]],
      });
    });
    return json({ ok: true });
  }
  throw new HttpError(404, "Not found.");
}

async function captureStep(
  request: Request,
  flowId: string,
  client: Client,
  config: ResolvedConfig,
): Promise<Response> {
  const input = stepSchema.parse(
    await readJson(request, MAX_CAPTURE_BODY_BYTES),
  );
  const artifact = await prepareArtifact(input.screenshot, config);
  const id = randomUUID();
  const now = new Date().toISOString();
  try {
    const position = await write(client, async (transaction) => {
      const flow = await requireFlow(transaction, flowId);
      if (flow.status !== "recording")
        throw new HttpError(
          409,
          "Start a new version to add screens to a completed recording.",
        );
      const result = await transaction.execute({
        sql: "SELECT COUNT(*) AS count FROM steps WHERE flow_id = ?",
        args: [flowId],
      });
      const count = Number(result.rows[0].count);
      if (count >= 200)
        throw new HttpError(
          409,
          "A recording can contain up to 200 screens. Start a new flow to continue.",
        );
      await insertArtifact(transaction, artifact);
      await transaction.execute({
        sql: "INSERT INTO steps (id, flow_id, title, route, screenshot, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          id,
          flowId,
          input.title,
          input.route,
          artifact?.id ?? null,
          count,
          now,
        ],
      });
      await transaction.execute({
        sql: "UPDATE flows SET updated_at = ?, board_revision = board_revision + 1 WHERE id = ?",
        args: [now, flowId],
      });
      return count;
    });
    return json({ id, position }, 201);
  } catch (error) {
    await discardArtifact(artifact, config).catch(() => undefined);
    throw error;
  }
}
