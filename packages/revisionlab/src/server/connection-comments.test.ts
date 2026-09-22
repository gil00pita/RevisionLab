import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@libsql/client";
import { readComments } from "./queries.js";
import { reviewFixture } from "./review-test-fixture.js";

test("commenters discuss saved paths and replies inherit exact version context", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  await f.capture(flowId);
  await f.capture(flowId);
  const board = (await f.state()).flows[0].board;
  const edge = board.edges[0];
  const commenter = await f.login("commenter");
  const response = await f.call(
    "comments",
    "POST",
    {
      flowId,
      edgeId: edge.id,
      body: "Should this path require approval?",
    },
    commenter,
  );
  assert.equal(response.status, 201);
  const parentId = (await response.json()).id;
  const reply = await f.call(
    "comments",
    "POST",
    { parentId, body: "Yes" },
    commenter,
  );
  assert.equal(reply.status, 201);
  const comments = (await f.state()).comments;
  assert.equal(comments.length, 2);
  for (const comment of comments) {
    assert.equal(comment.flowId, flowId);
    assert.equal(comment.edgeId, edge.id);
    assert.equal(comment.stepId, null);
    assert.equal(comment.anchor, null);
    assert.equal(comment.route, "/checkout");
    assert.deepEqual(comment.edge, {
      sourceStepId: edge.sourceStepId,
      targetStepId: edge.targetStepId,
      kind: "recorded",
      label: "",
      archived: false,
    });
  }
  assert.equal(
    (
      await f.call(
        `comments/${parentId}`,
        "PATCH",
        { status: "resolved" },
        commenter,
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.call(`flows/${flowId}/board`, "PATCH", board, commenter)).status,
    403,
  );
  const editor = await f.login("editor");
  assert.equal(
    (
      await f.call(
        `comments/${parentId}`,
        "PATCH",
        { status: "resolved" },
        editor,
      )
    ).status,
    200,
  );
  assert.ok(
    (await f.state()).comments.every(
      (comment) => comment.status === "resolved" && comment.resolvedAt,
    ),
  );
  assert.equal(
    (await f.call(`comments/${parentId}`, "PATCH", { status: "open" }, editor))
      .status,
    200,
  );
  const reopened = createClient({ url: f.config.databaseUrl });
  try {
    assert.deepEqual(await readComments(reopened), (await f.state()).comments);
  } finally {
    reopened.close();
  }
});

test("path comments reject unsaved, cross-version and mixed-target contexts", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  const stepId = await f.capture(flowId);
  await f.capture(flowId);
  const edgeId = (await f.state()).flows[0].board.edges[0].id;
  await f.call(`flows/${flowId}`, "PATCH", { status: "complete" });
  const next = await (
    await f.call(`flows/${flowId}/versions`, "POST", {})
  ).json();
  await f.capture(next.id);
  await f.capture(next.id);
  const base = { body: "Path feedback", flowId, edgeId };
  for (const input of [
    { ...base, flowId: undefined },
    { ...base, flowId: null },
    { ...base, stepId },
    { ...base, anchor: { x: 0.5, y: 0.5 } },
    { ...base, route: "/another-page" },
    { ...base, edgeId: "invalid/path" },
  ])
    assert.equal((await f.call("comments", "POST", input)).status, 400);
  for (const input of [
    { ...base, edgeId: randomUUID() },
    { ...base, flowId: next.id },
  ])
    assert.equal((await f.call("comments", "POST", input)).status, 409);
  assert.equal(
    (await f.call("comments", "POST", { ...base, flowId: randomUUID() }))
      .status,
    404,
  );
  const root = await f.call("comments", "POST", base);
  assert.equal(root.status, 201);
  const parentId = (await root.json()).id;
  for (const input of [
    { edgeId: null },
    { edgeId: randomUUID() },
    { stepId },
    { flowId: next.id },
    { anchor: { x: 0, y: 0 } },
    { route: "/other" },
  ])
    assert.equal(
      (await f.call("comments", "POST", { body: "Reply", parentId, ...input }))
        .status,
      400,
    );
  const screenRoot = await (
    await f.call("comments", "POST", {
      body: "Screen",
      stepId,
      route: "/checkout",
    })
  ).json();
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Reply",
        parentId: screenRoot.id,
        edgeId,
      })
    ).status,
    400,
  );
});

test("removed path discussions survive with archived identity and accept replies", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  await f.capture(flowId);
  await f.capture(flowId);
  let board = (await f.state()).flows[0].board;
  const edge = board.edges[0];
  const root = await (
    await f.call("comments", "POST", {
      body: "Keep this discussion",
      flowId,
      edgeId: edge.id,
    })
  ).json();
  const removed = await f.call(`flows/${flowId}/board`, "PATCH", {
    ...board,
    edges: [],
  });
  assert.equal(removed.status, 200);
  board = (await removed.json()).board;
  assert.equal((await f.state()).comments[0].edge?.archived, true);
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "New root",
        flowId,
        edgeId: edge.id,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Archived reply",
        parentId: root.id,
      })
    ).status,
    201,
  );
  assert.equal((await f.state()).comments.length, 2);
  assert.equal(
    (
      await f.call(`flows/${flowId}/board`, "PATCH", {
        ...board,
        edges: [edge],
      })
    ).status,
    200,
  );
  assert.ok(
    (await f.state()).comments.every(
      (comment) => comment.edge?.archived === false,
    ),
  );
});

test("saved connection IDs cannot be retargeted or repurposed after removal", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  const first = await f.capture(flowId);
  await f.capture(flowId);
  const third = await f.capture(flowId);
  let board = (await f.state()).flows[0].board;
  const original = {
    id: randomUUID(),
    sourceStepId: first,
    targetStepId: third,
    label: "Alternative",
    kind: "manual" as const,
  };
  const saved = await f.call(`flows/${flowId}/board`, "PATCH", {
    ...board,
    edges: [...board.edges, original],
  });
  assert.equal(saved.status, 200);
  board = (await saved.json()).board;
  const root = await f.call("comments", "POST", {
    body: "Alternative feedback",
    flowId,
    edgeId: original.id,
  });
  assert.equal(root.status, 201);
  const retargeted = { ...original, sourceStepId: third, targetStepId: first };
  assert.equal(
    (
      await f.call(`flows/${flowId}/board`, "PATCH", {
        ...board,
        edges: [...board.edges.slice(0, 2), retargeted],
      })
    ).status,
    409,
  );
  assert.deepEqual((await f.state()).flows[0].board, board);
  const removed = await f.call(`flows/${flowId}/board`, "PATCH", {
    ...board,
    edges: board.edges.slice(0, 2),
  });
  board = (await removed.json()).board;
  assert.equal(
    (
      await f.call(`flows/${flowId}/board`, "PATCH", {
        ...board,
        edges: [...board.edges, retargeted],
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await f.call(`flows/${flowId}/board`, "PATCH", {
        ...board,
        edges: board.edges.map((edge, index) =>
          index ? edge : { ...edge, kind: "manual" },
        ),
      })
    ).status,
    409,
  );
  const restored = await f.call(`flows/${flowId}/board`, "PATCH", {
    ...board,
    edges: [...board.edges, { ...original, label: "Renamed alternative" }],
  });
  assert.equal(restored.status, 200);
  assert.equal(
    (await f.state()).comments[0].edge?.label,
    "Renamed alternative",
  );
});

test("legacy saved edges gain immutable identities before the first replacement save", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  const first = await f.capture(flowId);
  await f.capture(flowId);
  const third = await f.capture(flowId);
  const board = (await f.state()).flows[0].board;
  const edge = {
    id: randomUUID(),
    sourceStepId: first,
    targetStepId: third,
    label: "Legacy",
    kind: "manual",
  };
  await f.client.execute({
    sql: "UPDATE flows SET board_json = ? WHERE id = ?",
    args: [JSON.stringify({ nodes: board.nodes, edges: [edge] }), flowId],
  });
  assert.equal(
    (
      await f.call(`flows/${flowId}/board`, "PATCH", {
        ...board,
        edges: [{ ...edge, sourceStepId: third, targetStepId: first }],
      })
    ).status,
    409,
  );
  const saved = await f.call(`flows/${flowId}/board`, "PATCH", {
    ...board,
    edges: [],
  });
  assert.equal(saved.status, 200);
  const registry = await f.client.execute({
    sql: "SELECT * FROM board_edges WHERE flow_id = ?",
    args: [flowId],
  });
  assert.equal(registry.rows.length, 1);
  assert.equal(registry.rows[0].id, edge.id);
  assert.ok(registry.rows[0].archived_at);
});

test("concurrent path removal and root submission never leave an unregistered thread", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  await f.capture(flowId);
  await f.capture(flowId);
  const board = (await f.state()).flows[0].board;
  const edge = board.edges[0];
  const [comment, removed] = await Promise.all([
    f.call("comments", "POST", {
      body: "Concurrent feedback",
      flowId,
      edgeId: edge.id,
    }),
    f.call(`flows/${flowId}/board`, "PATCH", { ...board, edges: [] }),
  ]);
  assert.equal(removed.status, 200);
  assert.ok([201, 409].includes(comment.status));
  const state = await f.state();
  assert.equal(state.flows[0].board.edges.length, 0);
  assert.equal(state.comments.length, comment.status === 201 ? 1 : 0);
  assert.ok(state.comments.every((item) => item.edge?.archived));
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Too late",
        flowId,
        edgeId: edge.id,
      })
    ).status,
    409,
  );
});
