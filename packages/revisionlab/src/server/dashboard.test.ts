import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { reviewFixture } from "./review-test-fixture.js";
import {
  dashboardStatistics,
  relativeSyncTime,
} from "../components/RevisionLabWorkspace/dashboard.js";
import type { WorkspaceState } from "../workspace-instances.js";

test("dashboard totals include more than the 200 listed sessions without exposing participant capabilities", async (t) => {
  const f = await reviewFixture(t);
  const now = Date.now();
  await f.client.batch(
    Array.from({ length: 205 }, (_, index) => ({
      sql: `INSERT INTO test_sessions (id,name,route,persona,token_hash,created_by,status,max_minutes,created_at,expires_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [
        randomUUID(),
        `Session ${index}`,
        "/",
        "Customer",
        `private-token-${index}`,
        "owner",
        ["waiting", "completed", "expired"][index % 3],
        5,
        now,
        now + 100_000,
      ],
    })),
    "write",
  );
  assert.deepEqual((await f.state()).dashboard, {
    testSessions: 205,
    ticketsCreated: 0,
  });
  const listed = await (await f.call("test-sessions")).json();
  assert.equal(listed.sessions.length, 200);
  const cookie = await f.login("commenter");
  const response = await f.call("state", "GET", undefined, cookie);
  assert.equal(response.status, 200);
  const state = await response.json();
  assert.equal(state.dashboard.testSessions, 205);
  assert.ok(!JSON.stringify(state).includes("private-token"));
});

test("dashboard counts group flow versions and comment threads, count saved violations, and exclude archived personas", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  await f.capture(flowId);
  await f.capture(flowId);
  const root = await (
    await f.call("comments", "POST", { route: "/", body: "Feedback" })
  ).json();
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/",
        body: "Reply",
        parentId: root.id,
      })
    ).status,
    201,
  );
  await f.call(`comments/${root.id}`, "PATCH", { status: "resolved" });
  await f.call("comments", "POST", { route: "/", body: "Open feedback" });
  await f.call("personas", "POST", { name: "Active", description: "" });
  const archived = await (
    await f.call("personas", "POST", { name: "Archived", description: "" })
  ).json();
  await f.client.execute({
    sql: "UPDATE personas SET archived_at=? WHERE id=?",
    args: [new Date().toISOString(), archived.id],
  });
  const state = await f.state();
  state.flows[0].steps[0].capture = {
    width: 100,
    height: 100,
    reason: "page",
    cursor: [],
    accessibility: {
      status: "issues",
      violationCount: 3,
      incomplete: 0,
      truncated: false,
      issues: [],
    },
  };
  state.flows.push({ ...state.flows[0], id: "second-version", version: 2 });
  const data: WorkspaceState = {
    ...state,
    selection: "local",
    workspaces: [
      {
        id: "local",
        name: "This workspace",
        url: "http://localhost:3000",
        basePath: "/revisionlab",
        apiPath: "/api/revisionlab",
        role: "owner",
        instanceId: randomUUID(),
        status: "connected",
        dashboard: state.dashboard,
      },
    ],
  };
  const stats = dashboardStatistics(data);
  assert.equal(stats.flows, 1);
  assert.equal(stats.comments, 2);
  assert.equal(stats.resolvedComments, 1);
  assert.equal(stats.personas, 1);
  assert.equal(stats.accessibilityIssues, 6);
  assert.equal(stats.uncheckedScreens, 2);
  assert.equal(stats.liveUrls, 1);
  assert.equal(stats.testSessions, 0);
  data.workspaces[0].dashboard = undefined;
  assert.equal(dashboardStatistics(data).testSessions, null);
  data.workspaces[0].status = "unavailable";
  assert.equal(dashboardStatistics(data).comments, null);
  data.workspaces[0].lastLoadedAt = Date.now();
  assert.equal(dashboardStatistics(data).comments, 2);
});

test("sync time handles seconds, larger units, missing sync, and clock skew", () => {
  const now = Date.now();
  for (const [age, expected] of [
    [0, "Just now"],
    [5_000, "5 seconds ago"],
    [59_000, "59 seconds ago"],
    [60_000, "1 minute ago"],
    [3_600_000, "1 hour ago"],
    [86_400_000, "1 day ago"],
    [2_592_000_000, "1 month ago"],
    [31_536_000_000, "1 year ago"],
  ] as const)
    assert.equal(relativeSyncTime(now - age, now), expected);
  assert.equal(relativeSyncTime(null, now), "Not synced yet");
  assert.equal(relativeSyncTime(now + 5_000, now), "Just now");
});
