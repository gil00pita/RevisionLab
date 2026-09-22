import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";
import { resolveConfig } from "./config.js";
import { handleFlows } from "./flow-routes.js";
import { readArtifact } from "./artifacts.js";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";
import { createRevisionLabHandler } from "./route-handler.js";
import { HttpError } from "./security.js";
import type { RevisionLabArtifactStorage, RevisionLabConfig } from "./types.js";

const captureBody = {
  title: "Checkout",
  route: "/checkout",
  screenshot: TEST_PNG,
};

function configuredCaller(config: RevisionLabConfig) {
  const handler = createRevisionLabHandler(config);
  return (path: string, method = "GET", body?: unknown, origin?: string) =>
    handler(
      new Request(`http://127.0.0.1:3000/api/revisionlab/${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(origin ? { Origin: origin } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      { params: Promise.resolve({ path: path.split("/") }) },
    );
}

function memoryStorage() {
  const files = new Map<string, Uint8Array>();
  const adapter: RevisionLabArtifactStorage = {
    async put(key, bytes) {
      files.set(key, bytes);
    },
    async get(key) {
      return files.get(key) ?? null;
    },
    async delete(key) {
      files.delete(key);
    },
  };
  return { files, adapter };
}

test("discard removes an unfinished recording, comments, screenshots, and artifact access idempotently", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const stepId = await f.capture(id);
  await f.capture(id);
  const root = await f.call("comments", "POST", {
    body: "Temporary feedback",
    route: "/checkout",
    flowId: id,
    stepId,
  });
  const parentId = (await root.json()).id;
  assert.equal(
    (await f.call("comments", "POST", { body: "Reply", parentId })).status,
    201,
  );
  const recorded = (await f.state()).flows[0];
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Temporary path feedback",
        flowId: id,
        edgeId: recorded.board.edges[0].id,
      })
    ).status,
    201,
  );
  assert.equal(
    (await f.client.execute("SELECT COUNT(*) AS count FROM board_edges"))
      .rows[0].count,
    1,
  );
  await f.client.execute("PRAGMA foreign_keys = OFF");
  assert.equal(
    (await f.client.execute("PRAGMA foreign_keys")).rows[0].foreign_keys,
    0,
  );
  const screenshot = recorded.steps[0].screenshot!;
  assert.equal((await f.call(`flows/${id}/discard`, "POST")).status, 200);
  assert.equal((await f.call(`flows/${id}/discard`, "POST")).status, 200);
  const state = await f.state();
  assert.deepEqual(state.flows, []);
  assert.deepEqual(state.comments, []);
  assert.deepEqual(await readdir(f.config.artifactsDirectory), []);
  assert.equal(
    (await f.call(screenshot.replace("/api/revisionlab/", ""))).status,
    404,
  );
  for (const table of [
    "flows",
    "steps",
    "comments",
    "board_edges",
    "artifacts",
    "discarded_artifacts",
  ])
    assert.equal(
      (await f.client.execute(`SELECT COUNT(*) AS count FROM ${table}`)).rows[0]
        .count,
      0,
    );
  assert.equal(
    (await f.call(`flows/${id}/steps`, "POST", captureBody)).status,
    404,
  );
  assert.equal(
    (await f.call(`flows/${id}`, "PATCH", { status: "complete" })).status,
    404,
  );
  assert.deepEqual(await readdir(f.config.artifactsDirectory), []);
});

test("discard rejects completed recordings without changing their screens or artifacts", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  await f.capture(id);
  assert.equal(
    (await f.call(`flows/${id}`, "PATCH", { status: "complete" })).status,
    200,
  );
  const before = await f.state();
  assert.equal((await f.call(`flows/${id}/discard`, "POST")).status, 409);
  assert.deepEqual((await f.state()).flows, before.flows);
  assert.equal((await readdir(f.config.artifactsDirectory)).length, 1);
});

test("discard requires an authenticated owner or the recording's creating editor", async (t) => {
  const f = await reviewFixture(t);
  const ownerDraft = await f.flow();
  const commenter = await f.login("commenter");
  const editor = await f.login("editor");
  for (const cookie of [commenter, editor])
    assert.equal(
      (await f.call(`flows/${ownerDraft}/discard`, "POST", undefined, cookie))
        .status,
      403,
    );
  const unauthenticated = configuredCaller({ ...f.config, localOwner: false });
  assert.equal(
    (await unauthenticated(`flows/${ownerDraft}/discard`, "POST")).status,
    401,
  );
  const authenticated = configuredCaller(f.config);
  assert.equal(
    (
      await authenticated(
        `flows/${ownerDraft}/discard`,
        "POST",
        undefined,
        "https://untrusted.test",
      )
    ).status,
    403,
  );
  assert.equal((await f.state()).flows.length, 1);

  for (const discardCookie of [editor, undefined]) {
    const draft = await f.call(
      "flows",
      "POST",
      { name: "Editor draft", persona: "Reviewer", route: "/" },
      editor,
    );
    assert.equal(draft.status, 201);
    const id = (await draft.json()).id;
    assert.equal(
      (await f.call(`flows/${id}/discard`, "POST", undefined, discardCookie))
        .status,
      200,
    );
  }
  assert.equal((await f.state()).flows[0].id, ownerDraft);
});

test("discarding a new version preserves the completed family and allows a replacement recording", async (t) => {
  const f = await reviewFixture(t);
  const first = await f.flow();
  const stepId = await f.capture(first);
  await f.capture(first);
  await f.call("comments", "POST", {
    body: "Keep this feedback",
    route: "/checkout",
    flowId: first,
    stepId,
  });
  const firstEdge = (await f.state()).flows[0].board.edges[0];
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Keep this path feedback",
        flowId: first,
        edgeId: firstEdge.id,
      })
    ).status,
    201,
  );
  await f.call(`flows/${first}`, "PATCH", { status: "complete" });
  const before = await f.state();
  const savedEdges = (await f.client.execute("SELECT * FROM board_edges")).rows;
  const second = (
    await (await f.call(`flows/${first}/versions`, "POST", {})).json()
  ).id;
  await f.capture(second);
  await f.capture(second);
  const secondBoard = (await f.state()).flows.find(
    (flow) => flow.id === second,
  )!.board;
  assert.equal(
    (await f.call(`flows/${second}/board`, "PATCH", secondBoard)).status,
    200,
  );
  assert.equal(
    (await f.client.execute("SELECT COUNT(*) AS count FROM board_edges"))
      .rows[0].count,
    2,
  );
  assert.equal((await f.call(`flows/${second}/discard`, "POST")).status, 200);
  const after = await f.state();
  assert.deepEqual(after.flows, before.flows);
  assert.deepEqual(after.comments, before.comments);
  assert.deepEqual(
    (await f.client.execute("SELECT * FROM board_edges")).rows,
    savedEdges,
  );
  assert.equal((await readdir(f.config.artifactsDirectory)).length, 2);
  assert.equal(
    (await f.call(`flows/${first}/versions`, "POST", {})).status,
    201,
  );
});

test("failed custom storage cleanup hides discarded content immediately and retries opaque cleanup keys", async (t) => {
  const f = await reviewFixture(t);
  const { adapter, files } = memoryStorage();
  const call = configuredCaller({ ...f.config, artifactStorage: adapter });
  const id = await f.flow();
  assert.equal(
    (await call(`flows/${id}/steps`, "POST", captureBody)).status,
    201,
  );
  const artifactId = [...files.keys()][0];
  const deletion = t.mock.method(adapter, "delete", async () => {
    throw new Error("Storage offline");
  });
  const failed = await call(`flows/${id}/discard`, "POST");
  assert.equal(failed.status, 503);
  assert.match((await failed.json()).error, /cleanup is pending/);
  assert.deepEqual((await f.state()).flows, []);
  assert.equal((await call(`artifacts/${artifactId}`)).status, 404);
  assert.equal(files.size, 1);
  assert.equal(
    (
      await f.client.execute(
        "SELECT COUNT(*) AS count FROM discarded_artifacts",
      )
    ).rows[0].count,
    1,
  );
  deletion.mock.restore();
  assert.equal((await call(`flows/${id}/discard`, "POST")).status, 200);
  assert.equal(files.size, 0);
  assert.equal(
    (
      await f.client.execute(
        "SELECT COUNT(*) AS count FROM discarded_artifacts",
      )
    ).rows[0].count,
    0,
  );
});

test("an in-flight capture cannot resurrect a discarded recording and cleans its pending upload", async (t) => {
  const f = await reviewFixture(t);
  const { adapter, files } = memoryStorage();
  let release!: () => void;
  let started!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const uploading = new Promise<void>((resolve) => {
    started = resolve;
  });
  adapter.put = async (key, bytes) => {
    files.set(key, bytes);
    started();
    await pending;
  };
  const call = configuredCaller({ ...f.config, artifactStorage: adapter });
  const id = await f.flow();
  const capture = call(`flows/${id}/steps`, "POST", captureBody);
  await uploading;
  assert.equal((await call(`flows/${id}/discard`, "POST")).status, 200);
  release();
  assert.equal((await capture).status, 404);
  assert.deepEqual((await f.state()).flows, []);
  assert.equal(files.size, 0);
  assert.equal(
    (await f.client.execute("SELECT COUNT(*) AS count FROM artifacts")).rows[0]
      .count,
    0,
  );
});

test("concurrent completion and discard serialize without deleting a completed recording", async (t) => {
  const f = await reviewFixture(t);
  for (let index = 0; index < 4; index++) {
    const id = await f.flow();
    const [complete, discard] = await Promise.all([
      f.call(`flows/${id}`, "PATCH", { status: "complete" }),
      f.call(`flows/${id}/discard`, "POST"),
    ]);
    const saved = (await f.state()).flows.find((flow) => flow.id === id);
    if (complete.status === 200) {
      assert.equal(discard.status, 409);
      assert.equal(saved?.status, "complete");
    } else {
      assert.equal(complete.status, 404);
      assert.equal(discard.status, 200);
      assert.equal(saved, undefined);
    }
  }
});

test("discard deletes private database screenshot bytes without a file or object adapter", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const actor = (await f.state()).actor;
  const config = resolveConfig({
    ...f.config,
    databaseUrl: "libsql://unused-test.invalid",
  });
  const capture = await handleFlows(
    new Request(`http://localhost/api/revisionlab/flows/${id}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(captureBody),
    }),
    ["flows", id, "steps"],
    f.client,
    config,
    actor,
  );
  assert.equal(capture.status, 201);
  const artifact = (
    await f.client.execute("SELECT id, bytes, storage FROM artifacts")
  ).rows[0];
  assert.equal(artifact.storage, "database");
  assert.ok(artifact.bytes);
  assert.equal(
    (
      await handleFlows(
        new Request(`http://localhost/api/revisionlab/flows/${id}/discard`, {
          method: "POST",
        }),
        ["flows", id, "discard"],
        f.client,
        config,
        actor,
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.client.execute("SELECT COUNT(*) AS count FROM artifacts")).rows[0]
      .count,
    0,
  );
  await assert.rejects(
    readArtifact(String(artifact.id), f.client, config),
    (error) => error instanceof HttpError && error.status === 404,
  );
});
