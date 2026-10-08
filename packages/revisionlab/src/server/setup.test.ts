import assert from "node:assert/strict";
import test from "node:test";
import { detectLiveUrl } from "../setup.js";
import { readSetup } from "./setup.js";
import { getDatabase } from "./database.js";
import { reviewFixture } from "./review-test-fixture.js";
import { readSettings } from "./settings.js";
import { defaultSettings } from "../comment-settings.js";

const identity = {
  action: "identity",
  name: "Test owner",
  email: "owner@example.com",
  systemUrl: "http://localhost:3210",
};

test("new installation requires identity before skip; progress survives a fresh connection", async (t) => {
  const f = await reviewFixture(t);
  assert.deepEqual((await f.state()).setup, {
    step: 0,
    completed: false,
    name: "",
    email: "",
  });
  assert.deepEqual((await f.state()).personas, []);
  assert.equal(
    (await f.call("setup", "PATCH", { action: "finish" })).status,
    400,
  );
  assert.equal(
    (await f.call("setup", "PATCH", { action: "advance", step: 2 })).status,
    400,
  );
  assert.equal((await f.call("setup", "PATCH", identity)).status, 200);
  assert.equal((await f.state()).accessSettings?.systemUrl, identity.systemUrl);
  assert.equal((await f.state()).actor.name, identity.name);
  assert.equal((await f.state()).actor.email, identity.email);
  assert.equal((await f.state()).memberships.length, 1);
  assert.equal((await f.state()).memberships[0].email, identity.email);
  const login = await f.call("auth/magic-request", "POST", {
    email: identity.email,
    name: identity.name,
  });
  assert.equal(login.status, 200);
  const token = new URL((await login.json()).devLoginUrl).searchParams.get(
    "login",
  );
  const verified = await f.call("auth/magic-consume", "POST", { token });
  assert.equal(verified.status, 200);
  const cookie = verified.headers.get("set-cookie")!.split(";")[0];
  const signedIn = await f.call("state", "GET", undefined, cookie);
  assert.equal(signedIn.status, 200);
  assert.equal((await signedIn.json()).actor.email, identity.email);

  const second = await getDatabase({
    ...f.config,
    databaseAuthToken: "setup-restart",
  });
  try {
    assert.equal((await readSetup(second)).step, 1);
  } finally {
    second.close();
  }
  assert.equal(
    (await f.call("setup", "PATCH", { action: "finish" })).status,
    200,
  );
  assert.equal((await f.state()).setup.completed, true);
  assert.equal((await f.call("setup", "PATCH", identity)).status, 409);
});

test("setup rejects invalid identity and URLs atomically and prevents jumping ahead", async (t) => {
  const f = await reviewFixture(t);
  for (const patch of [
    { name: "" },
    { email: "invalid" },
    { systemUrl: "" },
    { systemUrl: "http://public.example" },
    { systemUrl: "https://secret:password@example.com" },
  ]) {
    assert.equal(
      (await f.call("setup", "PATCH", { ...identity, ...patch })).status,
      400,
    );
    assert.equal((await f.state()).setup.step, 0);
  }
  assert.equal((await f.call("setup", "PATCH", identity)).status, 200);
  assert.equal(
    (await f.call("setup", "PATCH", { action: "advance", step: 5 })).status,
    400,
  );
  for (const step of [2, 3, 4, 5, 6])
    assert.equal(
      (await f.call("setup", "PATCH", { action: "advance", step })).status,
      200,
    );
  assert.equal(
    (await f.call("setup", "PATCH", { action: "finish" })).status,
    200,
  );
});

test("only owners may save setup or skip it", async (t) => {
  const f = await reviewFixture(t);
  for (const role of ["editor", "commenter"] as const) {
    const cookie = await f.login(role);
    assert.equal(
      (await f.call("setup", "PATCH", identity, cookie)).status,
      403,
    );
    assert.equal(
      (await f.call("setup", "PATCH", { action: "finish" }, cookie)).status,
      403,
    );
  }
});

test("widget and audit preferences survive skip, reject invalid values, and preserve access settings", async (t) => {
  const f = await reviewFixture(t);
  await f.call("setup", "PATCH", identity);
  const preferences = {
    widgetColor: "purple",
    widgetPosition: "bottom-left",
    showWidget: false,
    auditLivePages: false,
    auditRecordings: false,
    commentBubbleColor: "purple",
    showCommentBubbles: false,
  };
  assert.equal((await f.call("settings", "PATCH", preferences)).status, 200);
  for (const patch of [
    { widgetPosition: "middle" },
    { widgetPosition: "top-left" },
    { widgetPosition: "top-right" },
    { widgetColor: "#000000" },
    { showWidget: "true" },
    { auditRecordings: 0 },
  ])
    assert.equal((await f.call("settings", "PATCH", patch)).status, 400);
  await f.call("setup", "PATCH", { action: "finish" });
  const state = await f.state();
  assert.deepEqual(state.settings, { ...defaultSettings, ...preferences });
  assert.equal(state.accessSettings?.systemUrl, identity.systemUrl);
});

test("an upgraded established installation is not forced through setup", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  await f.client.execute("DELETE FROM setup_progress");
  const upgraded = await getDatabase({
    ...f.config,
    databaseAuthToken: "setup-upgrade",
  });
  try {
    assert.equal((await readSetup(upgraded)).completed, true);
    assert.equal((await f.state()).flows[0].id, flowId);
  } finally {
    upgraded.close();
  }
});

test("legacy top widget positions migrate to the corresponding bottom side", async (t) => {
  const f = await reviewFixture(t);
  for (const [legacy, expected] of [
    ["top-left", "bottom-left"],
    ["top-right", "bottom-right"],
  ] as const) {
    await f.client.execute({
      sql: `INSERT INTO workspace_settings (id, widget_position) VALUES (1, ?)
        ON CONFLICT(id) DO UPDATE SET widget_position = excluded.widget_position`,
      args: [legacy],
    });
    const migrated = await getDatabase({
      ...f.config,
      databaseAuthToken: `position-migration-${legacy}`,
    });
    try {
      assert.equal((await readSettings(migrated)).widgetPosition, expected);
    } finally {
      migrated.close();
    }
  }
});

test("URL detection retains localhost port and deployed origin, dropping path and sensitive query", () => {
  assert.equal(
    detectLiveUrl("http://localhost:4321/path"),
    "http://localhost:4321",
  );
  assert.equal(
    detectLiveUrl("https://preview.example/path?token=secret"),
    "https://preview.example",
  );
  assert.equal(detectLiveUrl("not a URL"), "");
  assert.equal(detectLiveUrl("file:///prototype.html"), "");
});

test("setup keeps explicit host owner identity authoritative and rejects duplicate user emails", async (t) => {
  const f = await reviewFixture(t);
  await f.login("editor");
  assert.equal(
    (
      await f.call("setup", "PATCH", {
        ...identity,
        email: "editor@client.test",
      })
    ).status,
    409,
  );
  assert.equal((await f.state()).setup.step, 0);
  const { createRevisionLabHandler } = await import("./route-handler.js");
  const handler = createRevisionLabHandler({
    ...f.config,
    ownerEmail: "configured@example.test",
  });
  const response = await handler(
    new Request("http://127.0.0.1:3000/api/revisionlab/setup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(identity),
    }),
    { params: Promise.resolve({ path: ["setup"] }) },
  );
  assert.equal(response.status, 400);
  assert.equal((await f.state()).setup.step, 0);
});

test("notification wizard step preserves configuration through finish and migrates old user-step progress once", async (t) => {
  const f = await reviewFixture(t);
  await f.call("setup", "PATCH", identity);
  for (const step of [2, 3, 4, 5])
    assert.equal(
      (await f.call("setup", "PATCH", { action: "advance", step })).status,
      200,
    );
  const initial = await (await f.call("settings/notifications")).json();
  assert.equal(
    (
      await f.call("settings/notifications", "PATCH", {
        settings: { ...initial.settings, defaultProvider: "disabled" },
        revision: 0,
        secrets: {},
      })
    ).status,
    200,
  );
  assert.equal(
    (await f.call("setup", "PATCH", { action: "advance", step: 6 })).status,
    200,
  );
  assert.equal(
    (await f.call("setup", "PATCH", { action: "advance", step: 7 })).status,
    400,
  );
  assert.equal(
    (await f.call("setup", "PATCH", { action: "finish" })).status,
    200,
  );
  assert.equal(
    (await (await f.call("settings/notifications")).json()).settings
      .defaultProvider,
    "disabled",
  );

  await f.client.execute("UPDATE setup_progress SET step = 5, completed = 0");
  await f.client.execute(
    "ALTER TABLE setup_progress DROP COLUMN notifications_step_added",
  );
  for (const suffix of ["first", "again"]) {
    const migrated = await getDatabase({
      ...f.config,
      databaseAuthToken: `notifications-wizard-${suffix}`,
    });
    try {
      assert.equal((await readSetup(migrated)).step, 6);
    } finally {
      migrated.close();
    }
  }
});

test("wizard display name persists independently of project identity and validates atomically", async (t) => {
  const f = await reviewFixture(t);
  const project = (await f.state()).project;
  assert.equal(
    (
      await f.call("setup", "PATCH", {
        ...identity,
        workspaceName: "  Design review  ",
      })
    ).status,
    200,
  );
  assert.equal((await f.state()).workspaceName, "Design review");
  assert.deepEqual((await f.state()).project, project);
  const connected = await (await f.call("workspace-state")).json();
  assert.equal(connected.workspaces[0].name, "Design review");
  for (const workspaceName of ["", " ", "x".repeat(101)]) {
    assert.equal(
      (
        await f.call("setup", "PATCH", {
          ...identity,
          name: "Must not save",
          workspaceName,
        })
      ).status,
      400,
    );
    assert.equal((await f.state()).workspaceName, "Design review");
    assert.equal((await f.state()).actor.name, identity.name);
  }
});

test("advanced API key generation before identity does not advance setup", async (t) => {
  const f = await reviewFixture(t);
  const created = await f.call("api-keys", "POST", {
    name: "Setup connection",
    role: "commenter",
  });
  assert.equal(created.status, 201);
  const key = await created.json();
  assert.ok(key.token);
  assert.equal((await f.state()).setup.step, 0);
  assert.ok(!(await (await f.call("api-keys")).text()).includes(key.token));
});
