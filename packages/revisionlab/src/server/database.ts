import { chmod, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createClient, type Client, type Transaction } from "@libsql/client";
import type { RevisionLabConfig } from "./types.js";
import { HttpError } from "./security.js";
import { schema } from "./schema.js";

const clients = new Map<string, Promise<Client>>();
const writes = new WeakMap<Client, Promise<unknown>>();

export async function getDatabase(config: RevisionLabConfig): Promise<Client> {
  const url = config.databaseUrl ?? "file:.revisionlab/revisionlab.db";
  const key = JSON.stringify([url, config.databaseAuthToken, config.projectId]);
  let client = clients.get(key);
  if (!client) {
    client = initialize(url, config);
    clients.set(key, client);
    client.catch(() => clients.delete(key));
  }
  return client;
}

async function initialize(
  url: string,
  config: RevisionLabConfig,
): Promise<Client> {
  const filePath = url.startsWith("file:") ? resolve(url.slice(5)) : null;
  if (filePath)
    await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
  const client = createClient({ url, authToken: config.databaseAuthToken });
  try {
    if (filePath) {
      await client.execute("PRAGMA journal_mode = WAL");
      await chmod(filePath, 0o600);
    }
    await client.batch(schema, "write");
    await migrateReviewMetadata(client);
    await client.execute({
      sql: "INSERT OR IGNORE INTO installation (id, project_id) VALUES (1, ?)",
      args: [config.projectId],
    });
    const installation = await client.execute(
      "SELECT project_id FROM installation WHERE id = 1",
    );
    if (installation.rows[0]?.project_id !== config.projectId) {
      throw new HttpError(
        503,
        "This database belongs to a different RevisionLab project.",
      );
    }
    return client;
  } catch (error) {
    client.close();
    throw error;
  }
}

async function migrateReviewMetadata(client: Client): Promise<void> {
  // One write transaction prevents simultaneous instances from applying an ALTER twice.
  await write(client, async (transaction) => {
    const additions = {
      steps: [
        ["capture_json", "TEXT"],
        ["capture_key", "TEXT"],
      ],
      flows: [
        ["family_id", "TEXT"],
        ["version", "INTEGER NOT NULL DEFAULT 1"],
        ["previous_version_id", "TEXT"],
        ["board_json", "TEXT"],
        ["board_revision", "INTEGER NOT NULL DEFAULT 0"],
      ],
      comments: [
        ["anchor_x", "REAL"],
        ["anchor_y", "REAL"],
        ["parent_id", "TEXT REFERENCES comments(id) ON DELETE CASCADE"],
        ["edge_id", "TEXT"],
        ["element_anchor", "TEXT"],
      ],
    };
    for (const [table, columns] of Object.entries(additions)) {
      const existing = await transaction.execute(`PRAGMA table_info(${table})`);
      for (const [name, declaration] of columns) {
        if (!existing.rows.some((row) => row.name === name)) {
          await transaction.execute(
            `ALTER TABLE ${table} ADD COLUMN ${name} ${declaration}`,
          );
        }
      }
    }
    await transaction.execute(
      "UPDATE flows SET family_id = id WHERE family_id IS NULL",
    );
    await transaction.execute(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_flow_version ON flows(family_id, version)",
    );
    await transaction.execute(
      "CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id, created_at)",
    );
    await transaction.execute(
      "CREATE INDEX IF NOT EXISTS idx_comments_edge ON comments(flow_id, edge_id, created_at)",
    );
  });
}

/** Serialize local async writes; SQL transactions also protect across server instances. */
export async function write<T>(
  client: Client,
  operation: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  const previous = writes.get(client) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      const transaction = await client.transaction("write");
      try {
        const result = await operation(transaction);
        await transaction.commit();
        return result;
      } finally {
        transaction.close();
      }
    });
  writes.set(client, next);
  return next;
}

export async function consumeRateLimit(
  client: Client,
  key: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const now = Date.now();
  const window = Math.floor(now / windowMs) * windowMs;
  const count = await write(client, async (transaction) => {
    await transaction.execute({
      sql: "DELETE FROM rate_limits WHERE expires_at < ?",
      args: [now],
    });
    const result = await transaction.execute({
      sql: `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?)
        ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count`,
      args: [`${key}:${window}`, window + windowMs],
    });
    return Number(result.rows[0]?.count ?? 0);
  });
  if (count > limit)
    throw new HttpError(429, "Too many attempts. Please try again later.");
}
