import { randomUUID } from "node:crypto";
import type { Client, InValue, Transaction } from "@libsql/client";
import { requireRole } from "./authentication.js";
import type { ResolvedConfig } from "./config.js";
import { write } from "./database.js";
import { discardArtifact, readArtifact } from "./artifacts.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor } from "./types.js";

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const snapshotTables = {
  workspace_settings: [
    "id",
    "show_comment_bubbles",
    "comment_bubble_color",
    "show_widget",
    "widget_color",
    "widget_side",
    "widget_offset",
    "widget_bottom_offset",
    "wcag_version",
    "wcag_level",
    "widget_position",
    "audit_live_pages",
    "audit_recordings",
    "ai_instructions_json",
  ],
  personas: [
    "id",
    "name",
    "name_key",
    "description",
    "archived_at",
    "created_at",
    "updated_at",
  ],
  flows: [
    "id",
    "family_id",
    "version",
    "previous_version_id",
    "name",
    "persona",
    "route",
    "status",
    "created_by",
    "created_at",
    "updated_at",
    "board_json",
    "board_revision",
  ],
  steps: [
    "id",
    "flow_id",
    "title",
    "route",
    "screenshot",
    "position",
    "created_at",
    "capture_json",
    "capture_key",
  ],
  recording_visits: [
    "id",
    "flow_id",
    "source_step_id",
    "step_id",
    "position",
    "interaction_json",
  ],
  board_edges: [
    "flow_id",
    "id",
    "source_step_id",
    "target_step_id",
    "label",
    "kind",
    "archived_at",
  ],
  comments: [
    "id",
    "flow_id",
    "step_id",
    "route",
    "body",
    "status",
    "author_id",
    "created_at",
    "resolved_at",
    "anchor_x",
    "anchor_y",
    "parent_id",
    "edge_id",
    "element_anchor",
    "screenshot",
    "screenshot_anchor",
  ],
} as const;

const snapshotOrder: Partial<Record<SnapshotTable, string>> = {
  flows: "version, created_at, id",
  steps: "flow_id, position, id",
  recording_visits: "flow_id, position, id",
  comments: "CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, created_at, id",
};

type SnapshotTable = keyof typeof snapshotTables;
type Snapshot = Record<SnapshotTable, Record<string, InValue>[]>;

function serializable(value: InValue): InValue {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return value;
}

async function captureSnapshot(transaction: Transaction): Promise<Snapshot> {
  const snapshot = {} as Snapshot;
  for (const [name, columns] of Object.entries(snapshotTables)) {
    const table = name as SnapshotTable;
    const result = await transaction.execute(
      `SELECT ${columns.join(",")} FROM ${table}${snapshotOrder[table] ? ` ORDER BY ${snapshotOrder[table]}` : ""}`,
    );
    snapshot[table] = result.rows.map((row) =>
      Object.fromEntries(
        columns.map((column) => [column, serializable(row[column])]),
      ),
    );
  }
  return snapshot;
}

function artifactIds(snapshot: Snapshot): string[] {
  return [
    ...new Set(
      [...snapshot.steps, ...snapshot.comments]
        .map((step) => step.screenshot)
        .filter((value): value is string => typeof value === "string"),
    ),
  ];
}

export function historyAction(method: string, path: string[]): string | null {
  if (!["POST", "PATCH"].includes(method)) return null;
  if (path[0] === "settings") return "Changed workspace settings";
  if (path[0] === "comments")
    return method === "POST" ? "Added a comment" : "Changed a comment";
  if (path[0] === "personas")
    return method === "POST" ? "Added a persona" : "Changed a persona";
  if (path[0] !== "flows") return null;
  if (path[1] === "delete") return "Deleted flows";
  if (path[2] === "discard") return "Discarded a recording";
  if (path[2] === "finish") return "Stopped a recording";
  if (path[2] === "board") return "Edited a flow board";
  if (path[2] === "steps") return "Captured a screen";
  if (path[2] === "versions") return "Started a new flow version";
  if (method === "PATCH") return "Changed recording status";
  return "Started a flow";
}

export async function startHistory(
  client: Client,
  actor: RevisionLabActor,
  action: string,
): Promise<string> {
  const id = randomUUID();
  const createdAt = new Date();
  await write(client, async (transaction) => {
    const snapshot = await captureSnapshot(transaction);
    await transaction.execute({
      sql: `INSERT INTO workspace_history
        (id, action, actor_id, actor_name, snapshot_json, created_at, expires_at, committed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      args: [
        id,
        action,
        actor.id,
        actor.name,
        JSON.stringify(snapshot),
        createdAt.toISOString(),
        new Date(createdAt.getTime() + RETENTION_MS).toISOString(),
      ],
    });
    for (const artifactId of artifactIds(snapshot))
      await transaction.execute({
        sql: `INSERT OR IGNORE INTO workspace_history_artifacts (history_id, artifact_id)
          SELECT ?, id FROM artifacts WHERE id = ?`,
        args: [id, artifactId],
      });
  });
  return id;
}

async function commitHistory(client: Client, id: string): Promise<void> {
  await write(client, async (transaction) => {
    const row = (
      await transaction.execute({
        sql: "SELECT snapshot_json FROM workspace_history WHERE id = ?",
        args: [id],
      })
    ).rows[0];
    if (!row) return;
    if (
      JSON.stringify(await captureSnapshot(transaction)) === row.snapshot_json
    ) {
      await transaction.execute({
        sql: "DELETE FROM workspace_history_artifacts WHERE history_id = ?",
        args: [id],
      });
      await transaction.execute({
        sql: "DELETE FROM workspace_history WHERE id = ?",
        args: [id],
      });
      return;
    }
    await transaction.execute({
      sql: "UPDATE workspace_history SET committed_at = ? WHERE id = ?",
      args: [new Date().toISOString(), id],
    });
  });
}

export async function cancelHistory(client: Client, id: string): Promise<void> {
  await write(client, async (transaction) => {
    await transaction.execute({
      sql: "DELETE FROM workspace_history_artifacts WHERE history_id = ?",
      args: [id],
    });
    await transaction.execute({
      sql: "DELETE FROM workspace_history WHERE id = ?",
      args: [id],
    });
  });
}

async function pruneHistory(
  client: Client,
  config: ResolvedConfig,
): Promise<void> {
  const artifacts = await write(client, async (transaction) => {
    const expired = await transaction.execute({
      sql: "SELECT id FROM workspace_history WHERE expires_at <= ?",
      args: [new Date().toISOString()],
    });
    for (const row of expired.rows) {
      await transaction.execute({
        sql: "DELETE FROM workspace_history_artifacts WHERE history_id = ?",
        args: [row.id],
      });
      await transaction.execute({
        sql: "DELETE FROM workspace_history WHERE id = ?",
        args: [row.id],
      });
    }
    const orphaned =
      await transaction.execute(`SELECT id, storage FROM artifacts
      WHERE NOT EXISTS (SELECT 1 FROM steps WHERE steps.screenshot = artifacts.id)
      AND NOT EXISTS (SELECT 1 FROM comments WHERE comments.screenshot = artifacts.id)
      AND NOT EXISTS (SELECT 1 FROM feedback_ticket_evidence WHERE screenshot_id = artifacts.id)
      AND NOT EXISTS (SELECT 1 FROM workspace_history_artifacts WHERE artifact_id = artifacts.id)
      LIMIT 100`);
    return orphaned.rows.map((row) => ({
      id: String(row.id),
      storage: String(row.storage) as "database" | "file" | "custom",
    }));
  });
  const cleanup = await Promise.allSettled(
    artifacts.map(async (artifact) => {
      if (artifact.storage !== "database")
        await discardArtifact(artifact, config);
      return artifact.id;
    }),
  );
  const removed = cleanup.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  if (removed.length)
    await write(client, async (transaction) => {
      for (const id of removed)
        await transaction.execute({
          sql: `DELETE FROM artifacts WHERE id = ?
            AND NOT EXISTS (SELECT 1 FROM steps WHERE steps.screenshot = artifacts.id)
            AND NOT EXISTS (SELECT 1 FROM comments WHERE comments.screenshot = artifacts.id)
            AND NOT EXISTS (SELECT 1 FROM feedback_ticket_evidence WHERE screenshot_id = artifacts.id)
            AND NOT EXISTS (SELECT 1 FROM workspace_history_artifacts WHERE artifact_id = artifacts.id)`,
          args: [id],
        });
    });
}

async function insertRows(
  transaction: Transaction,
  table: SnapshotTable,
  rows: Record<string, InValue>[],
) {
  const columns = snapshotTables[table];
  const sql = `INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`;
  for (const row of rows)
    await transaction.execute({
      sql,
      args: columns.map((column) =>
        ["ai_instructions_json", "screenshot", "screenshot_anchor"].includes(
          column,
        )
          ? (row[column] ?? null)
          : row[column],
      ),
    });
}

async function restoreSnapshot(
  client: Client,
  config: ResolvedConfig,
  snapshot: Snapshot,
): Promise<void> {
  const retained = artifactIds(snapshot);
  for (let start = 0; start < retained.length; start += 4) {
    const available = await Promise.allSettled(
      retained
        .slice(start, start + 4)
        .map((id) => readArtifact(id, client, config)),
    );
    if (available.some((result) => result.status === "rejected"))
      throw new HttpError(
        409,
        "This version cannot be restored because retained screenshot evidence is unavailable.",
      );
  }
  await write(client, async (transaction) => {
    if (retained.length) {
      const placeholders = retained.map(() => "?").join(",");
      const found = await transaction.execute({
        sql: `SELECT id FROM artifacts WHERE id IN (${placeholders})`,
        args: retained,
      });
      if (found.rows.length !== retained.length)
        throw new HttpError(
          409,
          "This version cannot be restored because retained screenshot evidence is unavailable.",
        );
    }
    const liveTests = await transaction.execute({
      sql: "SELECT id FROM test_sessions WHERE status = 'live' AND expires_at > ? LIMIT 1",
      args: [Date.now()],
    });
    if (liveTests.rows.length)
      throw new HttpError(
        409,
        "Stop live test sessions before restoring workspace history.",
      );
    await transaction.execute("DELETE FROM comments");
    await transaction.execute("DELETE FROM board_edges");
    await transaction.execute("DELETE FROM recording_visits");
    await transaction.execute("DELETE FROM steps");
    await transaction.execute("UPDATE flows SET previous_version_id = NULL");
    await transaction.execute("DELETE FROM flows");
    await transaction.execute("DELETE FROM personas");
    await transaction.execute("DELETE FROM workspace_settings");
    for (const table of Object.keys(snapshotTables) as SnapshotTable[])
      await insertRows(transaction, table, snapshot[table]);
  });
}

export async function withHistory(
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
  action: string | null,
  operation: () => Promise<Response>,
): Promise<Response> {
  if (!action) return operation();
  await pruneHistory(client, config);
  const id = await startHistory(client, actor, action);
  try {
    const response = await operation();
    if (response.ok) await commitHistory(client, id);
    else await cancelHistory(client, id);
    return response;
  } catch (error) {
    await cancelHistory(client, id);
    throw error;
  }
}

export async function handleHistory(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<Response> {
  await pruneHistory(client, config);
  if (request.method === "GET" && path.length === 1) {
    const rows = await client.execute({
      sql: `SELECT id, action, actor_name, created_at, expires_at FROM workspace_history
          WHERE expires_at > ? AND committed_at IS NOT NULL
          ORDER BY created_at DESC, id DESC`,
      args: [new Date().toISOString()],
    });
    return json({
      history: rows.rows.map((row) => ({
        id: row.id,
        action: row.action,
        actorName: row.actor_name,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      })),
    });
  }
  if (request.method !== "POST" || path.length !== 3 || path[2] !== "restore")
    throw new HttpError(404, "History version not found.");
  requireRole(actor, "editor");
  await readJson(request);
  const target = (
    await client.execute({
      sql: `SELECT action, snapshot_json FROM workspace_history
        WHERE id = ? AND expires_at > ? AND committed_at IS NOT NULL`,
      args: [path[1], new Date().toISOString()],
    })
  ).rows[0];
  if (!target)
    throw new HttpError(
      404,
      "This history version has expired or no longer exists.",
    );
  const restoreId = await startHistory(
    client,
    actor,
    `Restored workspace to before “${String(target.action)}”`,
  );
  try {
    await restoreSnapshot(
      client,
      config,
      JSON.parse(String(target.snapshot_json)) as Snapshot,
    );
    await commitHistory(client, restoreId);
  } catch (error) {
    await cancelHistory(client, restoreId);
    throw error;
  }
  return json({ restored: true });
}
