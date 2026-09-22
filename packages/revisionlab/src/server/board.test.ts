import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@libsql/client";
import { defaultBoard } from "./board.js";
import { readFlows } from "./queries.js";
import { reviewFixture } from "./review-test-fixture.js";

test("captured screens generate a board and completed versions retain independent editable layouts", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const first = await f.capture(id);
  const second = await f.capture(id);
  const third = await f.capture(id);
  const board = (await f.state()).flows[0].board;
  assert.equal(board.revision, 3);
  assert.deepEqual(board.nodes.slice(0, 2), [
    { stepId: first, x: 48, y: 48 },
    { stepId: second, x: 408, y: 48 },
  ]);
  assert.deepEqual(
    board.edges.map((edge) => [
      edge.sourceStepId,
      edge.targetStepId,
      edge.kind,
    ]),
    [
      [first, second, "recorded"],
      [second, third, "recorded"],
    ],
  );
  assert.equal(
    (await f.call(`flows/${id}`, "PATCH", { status: "complete" })).status,
    200,
  );
  const edited = {
    ...board,
    nodes: board.nodes.map((node, index) => ({
      ...node,
      y: 100 + index * 300,
    })),
    edges: [
      ...board.edges,
      {
        id: randomUUID(),
        sourceStepId: third,
        targetStepId: first,
        label: "Try again",
        kind: "manual",
      },
    ],
  };
  const saved = await f.call(`flows/${id}/board`, "PATCH", edited);
  assert.equal(saved.status, 200);
  const nextBoard = (await saved.json()).board;
  assert.equal(nextBoard.revision, 4);
  assert.deepEqual((await f.state()).flows[0].board, nextBoard);
  const reopened = createClient({ url: f.config.databaseUrl });
  try {
    assert.deepEqual(
      (await readFlows(reopened, "/api/revisionlab"))[0].board,
      nextBoard,
    );
  } finally {
    reopened.close();
  }
  const next = await (await f.call(`flows/${id}/versions`, "POST", {})).json();
  await f.capture(next.id);
  const state = await f.state();
  assert.deepEqual(
    state.flows.find((flow) => flow.id === id)!.board,
    nextBoard,
  );
  assert.equal(
    state.flows.find((flow) => flow.id === next.id)!.board.nodes.length,
    1,
  );
  assert.equal(
    state.flows.find((flow) => flow.id === next.id)!.board.edges.length,
    0,
  );
  assert.equal(
    (
      await f.call(`flows/${id}/steps`, "POST", {
        title: "No",
        route: "/checkout",
      })
    ).status,
    409,
  );
});

test("new captures merge into saved boards without restoring deleted connections", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  await f.capture(id);
  const second = await f.capture(id);
  const board = (await f.state()).flows[0].board;
  const saved = await f.call(`flows/${id}/board`, "PATCH", {
    ...board,
    nodes: board.nodes.map((node) => ({ ...node, y: 900 })),
    edges: [],
  });
  assert.equal(saved.status, 200);
  const previous = (await saved.json()).board;
  const third = await f.capture(id);
  const current = (await f.state()).flows[0].board;
  assert.equal(current.revision, previous.revision + 1);
  assert.equal(current.nodes[0].y, 900);
  assert.equal(current.nodes.length, 3);
  assert.deepEqual(
    current.edges.map((edge) => [edge.sourceStepId, edge.targetStepId]),
    [[second, third]],
  );
  assert.equal(
    (await f.call(`flows/${id}/board`, "PATCH", previous)).status,
    409,
  );
  assert.equal(
    (await f.call(`flows/${id}/board`, "PATCH", current)).status,
    200,
  );
});

test("optimistic revisions prevent simultaneous editors from overwriting each other", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  await f.capture(id);
  const board = (await f.state()).flows[0].board;
  const responses = await Promise.all(
    [100, 200].map((x) =>
      f.call(`flows/${id}/board`, "PATCH", {
        ...board,
        nodes: board.nodes.map((node) => ({ ...node, x })),
      }),
    ),
  );
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 409],
  );
  assert.equal((await f.state()).flows[0].board.revision, board.revision + 1);
});

test("boards validate coordinates, membership, connections and bounded payloads", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const first = await f.capture(id);
  const second = await f.capture(id);
  const third = await f.capture(id);
  const other = await f.flow("Other");
  const foreign = await f.capture(other);
  const board = (await f.state()).flows.find((flow) => flow.id === id)!.board;
  for (const x of [
    -1,
    50_001,
    "100",
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    assert.equal(
      (
        await f.call(`flows/${id}/board`, "PATCH", {
          ...board,
          nodes: [{ ...board.nodes[0], x }, ...board.nodes.slice(1)],
        })
      ).status,
      400,
    );
  }
  const invalid = [
    { ...board, nodes: board.nodes.slice(1) },
    { ...board, nodes: [...board.nodes, board.nodes[0]] },
    {
      ...board,
      nodes: [{ stepId: foreign, x: 0, y: 0 }, ...board.nodes.slice(1)],
    },
    { ...board, edges: [{ ...board.edges[0], targetStepId: foreign }] },
    { ...board, edges: [{ ...board.edges[0], targetStepId: first }] },
    {
      ...board,
      edges: [...board.edges, { ...board.edges[0], id: randomUUID() }],
    },
    {
      ...board,
      edges: [board.edges[0], { ...board.edges[1], id: board.edges[0].id }],
    },
    {
      ...board,
      edges: [{ ...board.edges[0], sourceStepId: first, targetStepId: third }],
    },
    { ...board, edges: [{ ...board.edges[0], label: "x".repeat(121) }] },
    { ...board, revision: -1 },
    { ...board, extra: true },
  ];
  for (const input of invalid)
    assert.equal(
      (await f.call(`flows/${id}/board`, "PATCH", input)).status,
      400,
    );
  assert.equal(
    (
      await f.call(`flows/${id}/board`, "PATCH", {
        ...board,
        edges: Array.from({ length: 1001 }, (_, index) => ({
          id: `edge${index}`,
          sourceStepId: first,
          targetStepId: second,
          kind: "manual",
          label: "",
        })),
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.call(`flows/${id}/board`, "PATCH", {
        ...board,
        huge: "x".repeat(512_000),
      })
    ).status,
    413,
  );
  assert.equal(
    (await f.call(`flows/${randomUUID()}/board`, "PATCH", board)).status,
    404,
  );
  const long = defaultBoard(Array.from({ length: 200 }, () => randomUUID()));
  assert.equal(long.nodes.length, 200);
  assert.ok(long.nodes.every((node) => node.x <= 50_000 && node.y <= 50_000));
});

test("commenters cannot rearrange boards while editors can", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  await f.capture(id);
  const board = (await f.state()).flows[0].board;
  const commenter = await f.login("commenter");
  assert.equal(
    (await f.call(`flows/${id}/board`, "PATCH", board, commenter)).status,
    403,
  );
  const editor = await f.login("editor");
  assert.equal(
    (await f.call(`flows/${id}/board`, "PATCH", board, editor)).status,
    200,
  );
});
