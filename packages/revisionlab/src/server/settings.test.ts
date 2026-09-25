import assert from "node:assert/strict";
import test from "node:test";
import { commentBubbleColors, defaultSettings } from "../comment-settings.js";
import { getDatabase } from "./database.js";
import { readSettings } from "./settings.js";
import { createRevisionLabHandler } from "./route-handler.js";
import { reviewFixture } from "./review-test-fixture.js";

test("workspace settings default to visible blue bubbles and survive a fresh connection", async (t) => {
  const f = await reviewFixture(t);
  assert.deepEqual((await f.state()).settings, defaultSettings);
  const response = await f.call("settings", "PATCH", {
    showCommentBubbles: false,
    commentBubbleColor: "pink",
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    showCommentBubbles: false,
    commentBubbleColor: "pink",
  });
  const second = await getDatabase({
    ...f.config,
    databaseAuthToken: "local-settings-restart",
  });
  try {
    assert.deepEqual(await readSettings(second), (await f.state()).settings);
  } finally {
    second.close();
  }
});

test("all standard bubble colors are accepted; malformed settings cannot be stored", async (t) => {
  const f = await reviewFixture(t);
  for (const color of commentBubbleColors) {
    assert.equal(
      (await f.call("settings", "PATCH", { commentBubbleColor: color })).status,
      200,
    );
    assert.deepEqual((await f.state()).settings, {
      showCommentBubbles: true,
      commentBubbleColor: color,
    });
  }
  const before = (await f.state()).settings;
  for (const input of [
    {},
    null,
    { commentBubbleColor: "chartreuse" },
    { commentBubbleColor: "#ffffff" },
    { showCommentBubbles: "false" },
    { showCommentBubbles: 0 },
    { showCommentBubbles: null },
    { commentBubbleColor: "red", unknown: true },
  ]) {
    assert.equal((await f.call("settings", "PATCH", input)).status, 400);
    assert.deepEqual((await f.state()).settings, before);
  }
  assert.equal((await f.call("settings", "POST", before)).status, 404);
  assert.equal((await f.call("settings/unknown", "PATCH", before)).status, 404);
});

test("owners and editors edit settings; commenters read but cannot change them", async (t) => {
  const f = await reviewFixture(t);
  const editor = await f.login("editor");
  const commenter = await f.login("commenter");
  assert.equal(
    (await f.call("settings", "PATCH", { commentBubbleColor: "teal" }, editor))
      .status,
    200,
  );
  assert.equal(
    (
      await f.call(
        "settings",
        "PATCH",
        { showCommentBubbles: false },
        commenter,
      )
    ).status,
    403,
  );
  const state = await f.call("state", "GET", undefined, commenter);
  assert.equal(state.status, 200);
  assert.deepEqual((await state.json()).settings, {
    showCommentBubbles: true,
    commentBubbleColor: "teal",
  });
  const handler = createRevisionLabHandler(f.config);
  const forged = await handler(
    new Request("http://127.0.0.1:3000/api/revisionlab/settings", {
      method: "PATCH",
      headers: {
        Origin: "https://external.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ showCommentBubbles: false }),
    }),
    { params: Promise.resolve({ path: ["settings"] }) },
  );
  assert.equal(forged.status, 403);
  assert.equal((await f.state()).settings.showCommentBubbles, true);
});

test("concurrent partial settings updates preserve both fields and existing review data", async (t) => {
  const f = await reviewFixture(t);
  const flow = await f.flow();
  await f.capture(flow);
  const before = await f.state();
  const responses = await Promise.all([
    f.call("settings", "PATCH", { showCommentBubbles: false }),
    f.call("settings", "PATCH", { commentBubbleColor: "orange" }),
  ]);
  assert.ok(responses.every((response) => response.status === 200));
  const after = await f.state();
  assert.deepEqual(after.settings, {
    showCommentBubbles: false,
    commentBubbleColor: "orange",
  });
  assert.deepEqual(after.flows, before.flows);
  assert.deepEqual(after.comments, before.comments);
});
