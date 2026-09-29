import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import test from "node:test";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";
import { createRevisionLabHandler } from "./route-handler.js";
import type { RevisionLabConfig } from "./types.js";

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

for (const foreignKeys of [true, false])
  test(`deleting a flow removes all versions, discussions, visits and private files (foreign keys ${foreignKeys})`, async (t) => {
    const f = await reviewFixture(t);
    const family = await f.flow();
    const stepId = await f.capture(family);
    await f.capture(family);
    const root = await f.call("comments", "POST", {
      flowId: family,
      stepId,
      route: "/checkout",
      body: "Screen feedback",
    });
    assert.equal(root.status, 201);
    assert.equal(
      (
        await f.call("comments", "POST", {
          parentId: (await root.json()).id,
          body: "Reply",
        })
      ).status,
      201,
    );
    const initial = (await f.state()).flows[0];
    assert.equal(
      (
        await f.call("comments", "POST", {
          flowId: family,
          edgeId: initial.board.edges[0].id,
          body: "Path feedback",
        })
      ).status,
      201,
    );
    await f.call(`flows/${family}`, "PATCH", { status: "complete" });
    const version = (
      await (await f.call(`flows/${family}/versions`, "POST", {})).json()
    ).id;
    await f.capture(version);
    await f.call(`flows/${version}`, "PATCH", { status: "complete" });
    const keep = await f.flow("Keep this flow");
    await f.capture(keep);
    await f.call("comments", "POST", {
      route: "/checkout",
      body: "Live page feedback",
    });
    const before = await f.state();
    await f.client.execute(
      `PRAGMA foreign_keys = ${foreignKeys ? "ON" : "OFF"}`,
    );
    assert.equal(
      (await f.call("flows/delete", "POST", { familyIds: [family] })).status,
      200,
    );
    const after = await f.state();
    assert.deepEqual(
      after.flows,
      before.flows.filter((flow) => flow.id === keep),
    );
    assert.deepEqual(
      after.comments.map((comment) => comment.body),
      ["Live page feedback"],
    );
    assert.deepEqual(after.settings, before.settings);
    assert.deepEqual(after.personas, before.personas);
    assert.equal((await readdir(f.config.artifactsDirectory)).length, 1);
    assert.equal(
      (
        await f.call(
          initial.steps[0].screenshot!.replace("/api/revisionlab/", ""),
        )
      ).status,
      404,
    );
    assert.equal(
      (await f.client.execute("SELECT * FROM board_edges")).rows.length,
      0,
    );
    assert.equal(
      (await f.client.execute("SELECT * FROM discarded_artifacts")).rows.length,
      0,
    );
    assert.equal(
      (await f.client.execute("SELECT * FROM recording_visits")).rows.length,
      1,
    );
    assert.equal(
      (await f.call("flows/delete", "POST", { familyIds: [family] })).status,
      200,
    );
    assert.equal(
      (await f.call(`flows/${version}/versions`, "POST", {})).status,
      404,
    );
  });

test("bulk deletion is all-or-nothing while any selected family has an unfinished version", async (t) => {
  const f = await reviewFixture(t);
  const first = await f.flow();
  await f.capture(first);
  await f.call(`flows/${first}`, "PATCH", { status: "complete" });
  const second = await f.flow();
  await f.capture(second);
  const before = await f.state();
  assert.equal(
    (await f.call("flows/delete", "POST", { familyIds: [first, second] }))
      .status,
    409,
  );
  assert.deepEqual(await f.state(), before);
  await f.call(`flows/${second}`, "PATCH", { status: "complete" });
  assert.equal(
    (await f.call("flows/delete", "POST", { familyIds: [first, second] }))
      .status,
    200,
  );
  assert.deepEqual((await f.state()).flows, []);
  assert.deepEqual(await readdir(f.config.artifactsDirectory), []);
});

test("deletion enforces roles, same-origin requests and bounded unique family IDs", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  await f.call(`flows/${id}`, "PATCH", { status: "complete" });
  const commenter = await f.login("commenter"),
    editor = await f.login("editor");
  assert.equal(
    (await f.call("flows/delete", "POST", { familyIds: [id] }, commenter))
      .status,
    403,
  );
  assert.equal(
    (
      await configuredCaller(f.config)(
        "flows/delete",
        "POST",
        { familyIds: [id] },
        "https://foreign.test",
      )
    ).status,
    403,
  );
  for (const body of [
    {},
    { familyIds: [] },
    { familyIds: ["bad"] },
    { familyIds: [id, id] },
    { familyIds: Array.from({ length: 101 }, () => randomUUID()) },
    { familyIds: [id], extra: true },
  ])
    assert.equal((await f.call("flows/delete", "POST", body)).status, 400);
  assert.equal((await f.state()).flows.length, 1);
  assert.equal(
    (await f.call("flows/delete", "POST", { familyIds: [id] }, editor)).status,
    200,
  );
});

test("failed external cleanup removes access immediately and retries without retaining review data", async (t) => {
  const f = await reviewFixture(t);
  const files = new Map<string, Uint8Array>();
  let fail = true;
  const call = configuredCaller({
    ...f.config,
    artifactStorage: {
      async put(id, bytes) {
        files.set(id, bytes);
      },
      async get(id) {
        return files.get(id) ?? null;
      },
      async delete(id) {
        if (fail) throw new Error("Storage offline");
        files.delete(id);
      },
    },
  });
  const id = await f.flow();
  assert.equal(
    (
      await call(`flows/${id}/steps`, "POST", {
        title: "Screen",
        route: "/",
        screenshot: TEST_PNG,
      })
    ).status,
    201,
  );
  await call(`flows/${id}`, "PATCH", { status: "complete" });
  const artifact = [...files.keys()][0];
  const response = await call("flows/delete", "POST", { familyIds: [id] });
  assert.equal(response.status, 503);
  assert.match(
    (await response.json()).error,
    /flows were deleted.*cleanup is pending/,
  );
  assert.deepEqual((await f.state()).flows, []);
  assert.equal((await call(`artifacts/${artifact}`)).status, 404);
  assert.equal(files.size, 1);
  assert.equal(
    (await f.client.execute("SELECT * FROM discarded_artifacts")).rows.length,
    1,
  );
  fail = false;
  assert.equal(
    (await call("flows/delete", "POST", { familyIds: [id] })).status,
    200,
  );
  assert.equal(files.size, 0);
  assert.equal(
    (await f.client.execute("SELECT * FROM discarded_artifacts")).rows.length,
    0,
  );
});

test("shared artifacts survive deleting one family and are removed with their final reference", async (t) => {
  const f = await reviewFixture(t);
  const first = await f.flow();
  await f.capture(first);
  const second = await f.flow();
  const secondStep = await f.capture(second, false);
  const artifact = (await f.client.execute("SELECT id FROM artifacts")).rows[0]
    .id;
  await f.client.execute({
    sql: "UPDATE steps SET screenshot = ? WHERE id = ?",
    args: [artifact, secondStep],
  });
  for (const id of [first, second])
    await f.call(`flows/${id}`, "PATCH", { status: "complete" });
  assert.equal(
    (await f.call("flows/delete", "POST", { familyIds: [first] })).status,
    200,
  );
  assert.equal((await f.call(`artifacts/${artifact}`)).status, 200);
  assert.equal(
    (await f.call("flows/delete", "POST", { familyIds: [second] })).status,
    200,
  );
  assert.equal((await f.call(`artifacts/${artifact}`)).status, 404);
});

test("new-version and deletion races cannot orphan or resurrect a flow", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  await f.call(`flows/${id}`, "PATCH", { status: "complete" });
  const [version, deletion] = await Promise.all([
    f.call(`flows/${id}/versions`, "POST", {}),
    f.call("flows/delete", "POST", { familyIds: [id] }),
  ]);
  const flows = (await f.state()).flows;
  if (version.status === 201) {
    assert.equal(deletion.status, 409);
    assert.equal(flows.length, 2);
  } else {
    assert.equal(version.status, 404);
    assert.equal(deletion.status, 200);
    assert.equal(flows.length, 0);
  }
});
