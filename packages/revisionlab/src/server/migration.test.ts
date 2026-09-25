import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createClient } from "@libsql/client";
import { getDatabase } from "./database.js";
import { readComments, readFlows } from "./queries.js";
import { readSettings } from "./settings.js";
import { defaultSettings } from "../comment-settings.js";

test("legacy databases retain recordings, screenshots and unpinned comments during metadata migration", async () => {
  const directory = await mkdtemp(join(tmpdir(), "revisionlab-migration-"));
  const config = {
    projectId: randomUUID(),
    projectName: "Legacy",
    databaseUrl: `file:${join(directory, "legacy.db")}`,
  };
  const original = createClient({ url: config.databaseUrl });
  const flowId = randomUUID();
  const stepId = randomUUID();
  const commentId = randomUUID();
  const now = new Date().toISOString();
  try {
    await original.batch(
      [
        "CREATE TABLE reviewers (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, created_at TEXT NOT NULL)",
        "CREATE TABLE flows (id TEXT PRIMARY KEY, name TEXT NOT NULL, persona TEXT NOT NULL, route TEXT NOT NULL, status TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES reviewers(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
        "CREATE TABLE steps (id TEXT PRIMARY KEY, flow_id TEXT NOT NULL REFERENCES flows(id), title TEXT NOT NULL, route TEXT NOT NULL, screenshot TEXT, position INTEGER NOT NULL, created_at TEXT NOT NULL)",
        "CREATE TABLE comments (id TEXT PRIMARY KEY, flow_id TEXT REFERENCES flows(id), step_id TEXT REFERENCES steps(id), route TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, author_id TEXT NOT NULL REFERENCES reviewers(id), created_at TEXT NOT NULL, resolved_at TEXT)",
        {
          sql: "INSERT INTO reviewers VALUES ('legacy', 'legacy@company.test', 'Original reviewer', ?)",
          args: [now],
        },
        {
          sql: "INSERT INTO flows VALUES (?, 'Original flow', 'Customer', '/checkout', 'complete', 'legacy', ?, ?)",
          args: [flowId, now, now],
        },
        {
          sql: "INSERT INTO steps VALUES (?, ?, 'Original screen', '/checkout', 'data:image/png;base64,legacy-image', 0, ?)",
          args: [stepId, flowId, now],
        },
        {
          sql: "INSERT INTO comments VALUES (?, ?, ?, '/checkout', 'Original feedback', 'resolved', 'legacy', ?, ?)",
          args: [commentId, flowId, stepId, now, now],
        },
      ],
      "write",
    );
  } finally {
    original.close();
  }
  const migrated = await getDatabase(config);
  try {
    assert.deepEqual(await readSettings(migrated), defaultSettings);
    const [flow] = await readFlows(migrated, "/api/revisionlab");
    assert.equal(flow.id, flowId);
    assert.equal(flow.familyId, flowId);
    assert.equal(flow.version, 1);
    assert.equal(flow.previousVersionId, null);
    assert.equal(
      flow.steps[0].screenshot,
      "data:image/png;base64,legacy-image",
    );
    assert.deepEqual(flow.board, {
      revision: 0,
      hiddenStepIds: [],
      nodes: [{ stepId, x: 48, y: 48 }],
      edges: [],
    });
    const [comment] = await readComments(migrated);
    assert.equal(comment.id, commentId);
    assert.equal(comment.body, "Original feedback");
    assert.equal(comment.status, "resolved");
    assert.equal(comment.resolvedAt, now);
    assert.equal(comment.anchor, null);
    assert.equal(comment.elementAnchor, null);
    assert.equal(flow.steps[0].capture, null);
    assert.equal(comment.parentId, null);
    assert.equal(comment.edgeId, null);
    assert.equal(comment.edge, null);
    assert.equal(comment.authorName, "Original reviewer");
    // A fresh server instance applies the same migration safely without resetting data.
    const secondConfig = {
      ...config,
      databaseAuthToken: "local-test-no-network",
    };
    const second = await getDatabase(secondConfig);
    try {
      assert.deepEqual(await readFlows(second, "/api/revisionlab"), [flow]);
    } finally {
      second.close();
    }
  } finally {
    migrated.close();
    await rm(directory, { recursive: true, force: true });
  }
});
