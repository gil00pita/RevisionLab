import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceSkeletonPage,
  getWorkspaceView,
} from "../workspace-view.js";

test("workspace loading follows explicit sections and retained legacy links", () => {
  for (const view of [
    "dashboard",
    "flows",
    "sessions",
    "feedback",
    "personas",
    "settings",
  ]) {
    const query = new URLSearchParams({ view });
    assert.equal(getWorkspaceView(query), view);
    assert.equal(getWorkspaceSkeletonPage(query), view);
  }
  assert.equal(
    getWorkspaceSkeletonPage(
      new URLSearchParams("view=comments&comment=saved"),
    ),
    "feedback",
  );
  assert.equal(
    getWorkspaceSkeletonPage(new URLSearchParams("view=people")),
    "settings-users",
  );
  assert.equal(
    getWorkspaceSkeletonPage(
      new URLSearchParams("view=feedback&workspace=all"),
    ),
    "feedback-sources",
  );
});

test("loading preserves recording and session deep-link layouts without overriding an explicit section", () => {
  assert.equal(
    getWorkspaceSkeletonPage(new URLSearchParams("flow=saved")),
    "flows",
  );
  assert.equal(
    getWorkspaceSkeletonPage(new URLSearchParams("flow=saved&screen=capture")),
    "flow-screen",
  );
  assert.equal(
    getWorkspaceSkeletonPage(
      new URLSearchParams("view=sessions&session=saved"),
    ),
    "session",
  );
  assert.equal(
    getWorkspaceSkeletonPage(
      new URLSearchParams("view=personas&flow=saved&screen=capture"),
    ),
    "personas",
  );
  assert.equal(
    getWorkspaceSkeletonPage(new URLSearchParams("view=unknown")),
    "dashboard",
  );
});
