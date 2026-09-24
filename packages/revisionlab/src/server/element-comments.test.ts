import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { readComments } from "./queries.js";
import { reviewFixture } from "./review-test-fixture.js";

const elementAnchor = {
  selector: '[data-testid="submit"]',
  tag: "button",
  label: "Submit",
};

test("live element comments persist without a recording, inherit replies and retain role controls", async (t) => {
  const f = await reviewFixture(t);
  const cookie = await f.login("commenter");
  const response = await f.call(
    "comments",
    "POST",
    { body: "Clarify this action", route: "/checkout", elementAnchor },
    cookie,
  );
  assert.equal(response.status, 201);
  const parentId = (await response.json()).id;
  assert.equal(
    (await f.call("comments", "POST", { body: "Agreed", parentId }, cookie))
      .status,
    201,
  );
  const state = await f.state();
  assert.equal(state.flows.length, 0);
  assert.equal(state.comments.length, 2);
  for (const comment of state.comments) {
    assert.deepEqual(comment.elementAnchor, elementAnchor);
    assert.equal(comment.flowId, null);
    assert.equal(comment.stepId, null);
    assert.equal(comment.anchor, null);
    assert.equal(comment.route, "/checkout");
    assert.equal(comment.authorName, "Reviewer");
  }
  const reopened = createClient({ url: f.config.databaseUrl });
  try {
    assert.deepEqual(await readComments(reopened), state.comments);
  } finally {
    reopened.close();
  }
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
    (await f.call(`comments/${parentId}`, "PATCH", { status: "resolved" }))
      .status,
    200,
  );
  assert.ok(
    (await f.state()).comments.every(
      (comment) => comment.status === "resolved",
    ),
  );
  assert.equal(
    (await f.call(`comments/${parentId}`, "PATCH", { status: "open" })).status,
    200,
  );
  assert.ok(
    (await f.state()).comments.every((comment) => comment.status === "open"),
  );
});

test("live anchors reject malformed metadata, mixed contexts and reply retargeting", async (t) => {
  const f = await reviewFixture(t);
  const base = { body: "Feedback", route: "/checkout", elementAnchor };
  for (const input of [
    { ...base, elementAnchor: { ...elementAnchor, selector: "" } },
    {
      ...base,
      elementAnchor: { ...elementAnchor, selector: "x".repeat(2001) },
    },
    { ...base, elementAnchor: { ...elementAnchor, tag: "<button>" } },
    { ...base, elementAnchor: { ...elementAnchor, label: "x".repeat(161) } },
    { ...base, elementAnchor: { selector: "#submit" } },
    { ...base, elementAnchor: { ...elementAnchor, html: "not stored" } },
    { ...base, route: undefined },
    { ...base, route: "https://another.test" },
    { ...base, flowId: randomUUID() },
    { ...base, stepId: randomUUID() },
    { ...base, edgeId: "edge" },
    { ...base, anchor: { x: 0.5, y: 0.5 } },
  ])
    assert.equal((await f.call("comments", "POST", input)).status, 400);
  const parentId = (await (await f.call("comments", "POST", base)).json()).id;
  assert.equal(
    (await f.call("comments", "POST", { ...base, parentId })).status,
    400,
  );
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Reply",
        parentId,
        route: "/other",
      })
    ).status,
    400,
  );
  assert.equal((await f.state()).comments.length, 1);
});

test("live commenting requires authenticated access when local owner is disabled", async (t) => {
  const f = await reviewFixture(t);
  await f.state();
  process.env.REVISIONLAB_LOCAL_OWNER = "false";
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Denied",
        route: "/",
        elementAnchor,
      })
    ).status,
    401,
  );
});
