import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";

const capture = { width: 1000, height: 800, reason: "page", cursor: [] };
const click = {
  target: { selector: "#continue", tag: "a", label: "Continue" },
  point: { x: 0.3, y: 0.4 },
  bounds: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
  activation: "pointer",
};

test("A B C A E reuses A, preserves visits and distinct recorded branches with source click evidence", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const saved: string[] = [];
  for (const route of ["/a", "/b", "/c", "/a", "/e"]) {
    const response = await f.call(`flows/${id}/steps`, "POST", {
      title: route,
      route,
      screenshot: TEST_PNG,
      capture,
      reuse: true,
      ...(saved.length
        ? { interaction: { ...click, sourceStepId: saved.at(-1) } }
        : {}),
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    saved.push(data.id);
    assert.equal(data.count, new Set(saved).size);
    assert.equal(data.reused, saved.length === 4);
  }
  assert.equal(saved[0], saved[3]);
  const flow = (await f.state()).flows[0];
  assert.equal(flow.steps.length, 4);
  assert.equal(flow.board.nodes.length, 4);
  assert.deepEqual(
    flow.board.edges.map((edge) => [edge.sourceStepId, edge.targetStepId]),
    [
      [saved[0], saved[1]],
      [saved[1], saved[2]],
      [saved[2], saved[0]],
      [saved[0], saved[4]],
    ],
  );
  assert.equal(flow.transitions!.length, 4);
  assert.deepEqual(flow.transitions![3].interaction, click);
  assert.equal(
    Number(
      (await f.client.execute("SELECT COUNT(*) AS count FROM artifacts"))
        .rows[0].count,
    ),
    4,
  );
  assert.equal(
    (await f.call(`flows/${id}/board`, "PATCH", flow.board)).status,
    200,
  );
  const latest = (await f.state()).flows[0];
  assert.equal(
    (
      await f.call("comments", "POST", {
        flowId: id,
        edgeId: latest.board.edges[2].id,
        route: latest.route,
        body: "Return path",
      })
    ).status,
    201,
  );
  assert.equal(
    (await f.call(`flows/${id}`, "PATCH", { status: "complete" })).status,
    200,
  );
  assert.equal(
    (
      await f.call(`flows/${id}/steps`, "POST", {
        title: "a",
        route: "/a",
        screenshot: TEST_PNG,
        reuse: true,
      })
    ).status,
    409,
  );
});

test("changed images, URLs and versions stay separate; legacy captures are never retroactively merged", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const old = await f.capture(id);
  const changed =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4AWL6z8DwHwAAAP//A3ONEwAAAAZJREFUAwAFCgIByRpMngAAAABJRU5ErkJggg==";
  for (const screenshot of [TEST_PNG, changed, TEST_PNG]) {
    assert.equal(
      (
        await f.call(`flows/${id}/steps`, "POST", {
          title: "State",
          route: "/checkout",
          screenshot,
          capture,
          reuse: true,
        })
      ).status,
      201,
    );
  }
  const flow = (await f.state()).flows[0];
  assert.equal(flow.steps.length, 3);
  assert.equal(flow.steps[0].id, old);
  assert.equal(flow.transitions!.at(-1)!.targetStepId, flow.steps[1].id);
  await f.call(`flows/${id}`, "PATCH", { status: "complete" });
  const version = await (
    await f.call(`flows/${id}/versions`, "POST", {})
  ).json();
  await f.call(`flows/${version.id}/steps`, "POST", {
    title: "State",
    route: "/checkout",
    screenshot: TEST_PNG,
    capture,
    reuse: true,
  });
  assert.equal(
    (await f.state()).flows.find((item) => item.id === version.id)!.steps
      .length,
    1,
  );
});

test("repeated paths keep their evidence but do not recreate editor-removed connections", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const visit = async (route: string) =>
    f.call(`flows/${id}/steps`, "POST", {
      title: route,
      route,
      screenshot: TEST_PNG,
      capture,
      reuse: true,
    });
  await visit("/a");
  await visit("/b");
  const board = (await f.state()).flows[0].board;
  await f.call(`flows/${id}/board`, "PATCH", { ...board, edges: [] });
  await visit("/a");
  await visit("/b");
  const flow = (await f.state()).flows[0];
  assert.equal(flow.steps.length, 2);
  assert.equal(flow.board.edges.length, 1);
  assert.equal(flow.board.edges[0].sourceStepId, flow.steps[1].id);
  assert.equal(flow.transitions!.length, 3);
  assert.equal((await f.call(`flows/${id}/discard`, "POST", {})).status, 200);
  assert.equal(
    (await f.client.execute("SELECT * FROM recording_visits")).rows.length,
    0,
  );
});

test("click evidence validates bounds, provenance and privacy-shaped fields without partial writes", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const first = await f.capture(id);
  for (const interaction of [
    { ...click, sourceStepId: randomUUID() },
    { ...click, sourceStepId: first, point: { x: 1.1, y: 0 } },
    {
      ...click,
      sourceStepId: first,
      bounds: { x: 0.9, y: 0.1, width: 0.5, height: 0.1 },
    },
    {
      ...click,
      sourceStepId: first,
      target: { ...click.target, value: "private" },
    },
  ]) {
    assert.equal(
      (
        await f.call(`flows/${id}/steps`, "POST", {
          title: "Next",
          route: "/next",
          screenshot: TEST_PNG,
          capture,
          reuse: true,
          interaction,
        })
      ).status,
      400,
    );
  }
  assert.equal((await f.state()).flows[0].steps.length, 1);
  const forbidden = await f.call(
    `flows/${id}/steps`,
    "POST",
    { title: "Next", route: "/next", screenshot: TEST_PNG, reuse: true },
    await f.login("commenter"),
  );
  assert.equal(forbidden.status, 403);
});

test("the visit limit rejects another capture without storing a partial screen or artifact", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const first = await f.capture(id);
  await f.client.batch(
    Array.from({ length: 999 }, (_, index) => ({
      sql: "INSERT INTO recording_visits (id, flow_id, source_step_id, step_id, position) VALUES (?, ?, ?, ?, ?)",
      args: [randomUUID(), id, first, first, index + 1],
    })),
    "write",
  );
  const before = (await f.state()).flows[0];
  const response = await f.call(`flows/${id}/steps`, "POST", {
    title: "Overflow",
    route: "/overflow",
    screenshot: TEST_PNG,
    reuse: true,
  });
  assert.equal(response.status, 409);
  assert.deepEqual((await f.state()).flows[0], before);
  assert.equal(
    Number(
      (await f.client.execute("SELECT COUNT(*) AS count FROM artifacts"))
        .rows[0].count,
    ),
    1,
  );
});
