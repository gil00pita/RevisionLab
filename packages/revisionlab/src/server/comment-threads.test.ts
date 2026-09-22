import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@libsql/client";
import { readComments } from "./queries.js";
import { reviewFixture } from "./review-test-fixture.js";

test("pinned comments and replies persist precise version context and share thread status", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  const stepId = await f.capture(flowId);
  const cookie = await f.login("commenter");
  const response = await f.call(
    "comments",
    "POST",
    {
      body: "This button",
      route: "/checkout",
      stepId,
      anchor: { x: 0.375, y: 1 },
    },
    cookie,
  );
  assert.equal(response.status, 201);
  const parentId = (await response.json()).id;
  const reply = await f.call(
    "comments",
    "POST",
    { body: "I agree", parentId },
    cookie,
  );
  assert.equal(reply.status, 201);
  const replyId = (await reply.json()).id;
  const state = await f.state();
  const root = state.comments.find((comment) => comment.id === parentId)!;
  const child = state.comments.find((comment) => comment.id === replyId)!;
  assert.deepEqual(root.anchor, { x: 0.375, y: 1 });
  assert.equal(root.parentId, null);
  assert.equal(root.flowId, flowId);
  assert.equal(child.flowId, flowId);
  assert.equal(child.stepId, stepId);
  assert.equal(child.route, "/checkout");
  assert.equal(child.parentId, parentId);
  assert.equal(child.anchor, null);
  assert.equal(
    (
      await f.call(
        `comments/${parentId}`,
        "PATCH",
        { status: "resolved" },
        cookie,
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.call(`comments/${replyId}`, "PATCH", { status: "resolved" }))
      .status,
    400,
  );
  assert.equal(
    (await f.call(`comments/${parentId}`, "PATCH", { status: "resolved" }))
      .status,
    200,
  );
  const resolved = (await f.state()).comments;
  assert.ok(
    resolved.every(
      (comment) => comment.status === "resolved" && comment.resolvedAt,
    ),
  );
  const reopened = createClient({ url: f.config.databaseUrl });
  try {
    assert.deepEqual(await readComments(reopened), resolved);
  } finally {
    reopened.close();
  }
  assert.equal(
    (await f.call(`comments/${parentId}`, "PATCH", { status: "open" })).status,
    200,
  );
  assert.ok(
    (await f.state()).comments.every(
      (comment) => comment.status === "open" && !comment.resolvedAt,
    ),
  );
  await f.call(`flows/${flowId}`, "PATCH", { status: "complete" });
  const next = await (
    await f.call(`flows/${flowId}/versions`, "POST", {})
  ).json();
  await f.capture(next.id);
  assert.ok(
    (await f.state()).comments.every(
      (comment) => comment.flowId === flowId && comment.stepId === stepId,
    ),
  );
});

test("pins reject invalid bounds, unavailable images and mismatched screen context", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  const stepId = await f.capture(flowId);
  const empty = await f.capture(flowId, false);
  const other = await f.flow("Other");
  const base = {
    body: "Review",
    route: "/checkout",
    flowId,
    stepId,
    anchor: { x: 0.5, y: 0.5 },
  };
  for (const anchor of [
    { x: -0.1, y: 0 },
    { x: 1.1, y: 1 },
    { x: 0, y: 2 },
    { x: null, y: 0 },
    { x: "0.5", y: 1 },
    { x: 0 },
    { x: 0, y: Number.NaN },
  ]) {
    assert.equal(
      (await f.call("comments", "POST", { ...base, anchor })).status,
      400,
    );
  }
  for (const input of [
    { ...base, stepId: null },
    { ...base, stepId: empty },
    { ...base, flowId: other },
    { ...base, route: "/wrong" },
    { ...base, route: undefined },
  ]) {
    assert.equal((await f.call("comments", "POST", input)).status, 400);
  }
  assert.equal(
    (await f.call("comments", "POST", { ...base, stepId: randomUUID() }))
      .status,
    404,
  );
  assert.equal(
    (await f.call("comments", "POST", { ...base, anchor: { x: 0, y: 0 } }))
      .status,
    201,
  );
  assert.equal(
    (await f.call("comments", "POST", { body: "General", route: "/" })).status,
    201,
  );
  const general = (await f.state()).comments.find(
    (comment) => comment.body === "General",
  )!;
  assert.equal(general.anchor, null);
  assert.equal(general.parentId, null);
});

test("replies cannot escape a thread's flow, screen, route or anchor", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  const stepId = await f.capture(flowId);
  const parent = await (
    await f.call("comments", "POST", {
      body: "Parent",
      route: "/checkout",
      flowId,
      stepId,
      anchor: { x: 0.1, y: 0.2 },
    })
  ).json();
  const base = { body: "Reply", parentId: parent.id };
  for (const input of [
    { ...base, flowId: randomUUID() },
    { ...base, stepId: randomUUID() },
    { ...base, stepId: null },
    { ...base, route: "/wrong" },
    { ...base, anchor: { x: 0, y: 0 } },
  ]) {
    assert.equal((await f.call("comments", "POST", input)).status, 400);
  }
  const reply = await f.call("comments", "POST", {
    ...base,
    flowId,
    stepId,
    route: "/checkout",
  });
  assert.equal(reply.status, 201);
  const replyId = (await reply.json()).id;
  assert.equal(
    (await f.call("comments", "POST", { ...base, parentId: replyId })).status,
    400,
  );
  assert.equal(
    (await f.call("comments", "POST", { ...base, parentId: randomUUID() }))
      .status,
    404,
  );
});
