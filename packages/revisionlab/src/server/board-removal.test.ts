import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { readBoard } from "./board.js";
import { reviewFixture } from "./review-test-fixture.js";

test("screen removal is reversible and preserves completed captures, artifacts and feedback", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  const first = await f.capture(flowId);
  const second = await f.capture(flowId);
  await f.call(`flows/${flowId}`, "PATCH", { status: "complete" });
  const original = (await f.state()).flows[0];
  const comment = await f.call("comments", "POST", {
    body: "Original pin",
    flowId,
    stepId: second,
    route: "/checkout",
    anchor: { x: 0.2, y: 0.4 },
  });
  assert.equal(comment.status, 201);
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Original path",
        flowId,
        edgeId: original.board.edges[0].id,
      })
    ).status,
    201,
  );
  const removed = await f.call(`flows/${flowId}/board`, "PATCH", {
    ...original.board,
    nodes: original.board.nodes.filter((node) => node.stepId !== second),
    hiddenStepIds: [second],
    edges: [],
  });
  assert.equal(removed.status, 200);
  const board = (await removed.json()).board;
  const state = await f.state();
  assert.deepEqual(state.flows[0].steps, original.steps);
  assert.deepEqual(state.flows[0].board.hiddenStepIds, [second]);
  assert.deepEqual(
    state.flows[0].board.nodes.map((node) => node.stepId),
    [first],
  );
  assert.equal(state.comments.length, 2);
  assert.deepEqual(
    state.comments.find((item) => item.stepId === second)?.anchor,
    { x: 0.2, y: 0.4 },
  );
  assert.equal(
    state.comments.find((item) => item.edgeId)?.edge?.archived,
    true,
  );
  const screenshot = original.steps[1].screenshot!;
  assert.equal(
    (await f.call(screenshot.replace("/api/revisionlab/", ""))).status,
    200,
  );
  const restored = await f.call(`flows/${flowId}/board`, "PATCH", {
    ...original.board,
    revision: board.revision,
  });
  assert.equal(restored.status, 200);
  assert.deepEqual((await f.state()).flows[0].board.hiddenStepIds, []);
  assert.equal(
    (await f.state()).comments.find((item) => item.edgeId)?.edge?.archived,
    false,
  );
  const next = await (
    await f.call(`flows/${flowId}/versions`, "POST", {})
  ).json();
  await f.capture(next.id);
  assert.deepEqual(
    (await f.state()).flows.find((flow) => flow.id === next.id)?.board
      .hiddenStepIds,
    [],
  );
  assert.equal(
    (await f.state()).comments.filter((item) => item.flowId === next.id).length,
    0,
  );
});

test("new captures do not restore removed screens or create dangling connections", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  const first = await f.capture(flowId);
  const second = await f.capture(flowId);
  const board = (await f.state()).flows[0].board;
  assert.equal(
    (
      await f.call(`flows/${flowId}/board`, "PATCH", {
        ...board,
        nodes: board.nodes.slice(0, 1),
        hiddenStepIds: [second],
        edges: [],
      })
    ).status,
    200,
  );
  const third = await f.capture(flowId);
  const current = (await f.state()).flows[0].board;
  assert.deepEqual(
    current.nodes.map((node) => node.stepId),
    [first, third],
  );
  assert.deepEqual(current.hiddenStepIds, [second]);
  assert.deepEqual(current.edges, []);
  assert.equal(
    (await f.call(`flows/${flowId}/board`, "PATCH", current)).status,
    200,
  );
});

test("hidden screen membership and connected endpoint validation remain strict", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  await f.capture(flowId);
  const second = await f.capture(flowId);
  const board = (await f.state()).flows[0].board;
  for (const input of [
    { ...board, hiddenStepIds: [second] },
    {
      ...board,
      nodes: board.nodes.slice(0, 1),
      hiddenStepIds: [second, second],
      edges: [],
    },
    {
      ...board,
      nodes: board.nodes.slice(0, 1),
      hiddenStepIds: [randomUUID()],
      edges: [],
    },
    { ...board, nodes: board.nodes.slice(0, 1), hiddenStepIds: [second] },
  ])
    assert.equal(
      (await f.call(`flows/${flowId}/board`, "PATCH", input)).status,
      400,
    );
  const commenter = await f.login("commenter");
  const allRemoved = {
    ...board,
    nodes: [],
    edges: [],
    hiddenStepIds: board.nodes.map((node) => node.stepId),
  };
  assert.equal(
    (await f.call(`flows/${flowId}/board`, "PATCH", allRemoved, commenter))
      .status,
    403,
  );
  assert.equal(
    (await f.call(`flows/${flowId}/board`, "PATCH", allRemoved)).status,
    200,
  );
  assert.deepEqual((await f.state()).flows[0].board.nodes, []);
});

test("legacy boards normalize an empty removal list without changing their layout", () => {
  const first = randomUUID();
  const second = randomUUID();
  const stored = {
    nodes: [
      { stepId: first, x: 100, y: 200 },
      { stepId: second, x: 300, y: 400 },
    ],
    edges: [],
  };
  const board = readBoard(JSON.stringify(stored), 5, [first, second]);
  assert.deepEqual(board, { ...stored, revision: 5, hiddenStepIds: [] });
});
