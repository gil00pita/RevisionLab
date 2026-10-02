import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";
import { protectRevisionLab } from "./protection.js";
import { sessionMetrics, type TestDetail } from "../test-sessions.js";

async function create(f: Awaited<ReturnType<typeof reviewFixture>>) {
  const persona = await f.call("personas", "POST", {
    name: "Test participant",
    description: "",
  });
  const response = await f.call("test-sessions", "POST", {
    name: "Checkout test",
    route: "/checkout",
    personaId: (await persona.json()).id,
    maxMinutes: 5,
  });
  assert.equal(response.status, 201);
  const { id, url } = await response.json();
  const path = new URL(url).pathname.replace("/api/revisionlab/", "");
  const entry = await f.call(path);
  assert.equal(entry.status, 303);
  return { id, path, cookie: entry.headers.get("set-cookie")!.split(";")[0] };
}
async function start(
  f: Awaited<ReturnType<typeof reviewFixture>>,
  cookie: string,
) {
  const response = await f.call(
    "test-participant/start",
    "POST",
    { name: "Alice" },
    cookie,
  );
  assert.equal(response.status, 201);
  return response.headers.get("set-cookie")!.split(";")[0];
}

test("test links are single-use, require a name, and create exactly one flow under concurrent Start", async (t) => {
  const f = await reviewFixture(t),
    invitation = await create(f);
  assert.equal(
    (
      await f.call(
        "test-participant/start",
        "POST",
        { name: " " },
        invitation.cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.call(
        "test-participant/events",
        "POST",
        { events: [] },
        invitation.cookie,
      )
    ).status,
    403,
  );
  const results = await Promise.all([
    f.call(
      "test-participant/start",
      "POST",
      { name: "Alice" },
      invitation.cookie,
    ),
    f.call(
      "test-participant/start",
      "POST",
      { name: "Bob" },
      invitation.cookie,
    ),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 410]);
  assert.equal((await f.state()).flows.length, 1);
  assert.equal((await f.call(invitation.path)).status, 410);
  assert.equal(
    (
      await f.call(
        "test-participant/start",
        "POST",
        { name: "Again" },
        invitation.cookie,
      )
    ).status,
    401,
  );
});

test("test access permits prototype documents but never workspace data or host APIs", async (t) => {
  const f = await reviewFixture(t),
    invitation = await create(f);
  const config = { ...f.config, localOwner: false };
  process.env.REVISIONLAB_LOCAL_OWNER = "false";
  const request = (path: string) =>
    new Request(`http://127.0.0.1:3000${path}`, {
      headers: { Cookie: invitation.cookie },
    });
  assert.equal(
    await protectRevisionLab(request("/checkout"), config),
    undefined,
  );
  assert.equal(
    (await protectRevisionLab(request("/revisionlab"), config))?.status,
    307,
  );
  assert.equal(
    (await protectRevisionLab(request("/api/private"), config))?.status,
    401,
  );
  assert.equal(
    (await f.call("state", "GET", undefined, invitation.cookie)).status,
    401,
  );
  assert.equal(
    (await f.call("test-sessions", "GET", undefined, invitation.cookie)).status,
    401,
  );
});

test("recordings persist screenshots and idempotent events; Stop rejects screens and clips late events", async (t) => {
  const f = await reviewFixture(t),
    invitation = await create(f),
    cookie = await start(f, invitation.cookie);
  const response = await f.call(
    "test-participant/screens",
    "POST",
    { title: "Checkout", route: "/checkout", screenshot: TEST_PNG },
    cookie,
  );
  assert.equal(response.status, 201);
  const screenId = (await response.json()).id;
  const events = [
    { id: randomUUID(), t: 0, type: "screen", route: "/checkout", screenId },
    {
      id: randomUUID(),
      t: 1,
      type: "click",
      route: "/checkout",
      screenId,
      x: 0.5,
      y: 0.25,
    },
    {
      id: randomUUID(),
      t: 2,
      type: "key",
      route: "/checkout",
      screenId,
      key: "[masked]",
    },
  ];
  assert.equal(
    (await f.call("test-participant/events", "POST", { events }, cookie))
      .status,
    200,
  );
  assert.equal(
    (await f.call("test-participant/events", "POST", { events }, cookie))
      .status,
    200,
  );
  assert.equal(
    (await f.call(`test-sessions/${invitation.id}/stop`, "POST")).status,
    200,
  );
  const stopped = await f.call(
    "test-participant/screens",
    "POST",
    { title: "Late", route: "/checkout" },
    cookie,
  );
  assert.equal(stopped.status, 410);
  const late = { ...events[1], id: randomUUID(), t: 300000 };
  assert.equal(
    (
      await f.call(
        "test-participant/events",
        "POST",
        { events: [late] },
        cookie,
      )
    ).status,
    200,
  );
  const detail: TestDetail = await (
    await f.call(`test-sessions/${invitation.id}`)
  ).json();
  assert.equal(detail.events.length, 3);
  assert.equal(detail.screens.length, 1);
  assert.match(detail.screens[0].screenshot!, /artifacts/);
  assert.equal(detail.session.status, "completed");
  assert.equal(sessionMetrics(detail.session, detail.events).clicks, 1);
  assert.equal((await f.state()).flows[0].status, "complete");
});

test("expiry is enforced on the server for unused and active links", async (t) => {
  const f = await reviewFixture(t),
    invitation = await create(f);
  await f.client.execute({
    sql: "UPDATE test_sessions SET expires_at = ? WHERE id = ?",
    args: [Date.now() - 1, invitation.id],
  });
  assert.equal((await f.call(invitation.path)).status, 410);
  assert.equal(
    (
      await f.call(
        "test-participant/start",
        "POST",
        { name: "Alice" },
        invitation.cookie,
      )
    ).status,
    401,
  );
  // Reuse the persona via a second valid invitation.
  const persona = (await f.state()).personas[0];
  const result = await (
    await f.call("test-sessions", "POST", {
      name: "Second test",
      route: "/",
      personaId: persona.id,
      maxMinutes: 1,
    })
  ).json();
  const entry = await f.call(
    new URL(result.url).pathname.replace("/api/revisionlab/", ""),
  );
  const cookie = await start(f, entry.headers.get("set-cookie")!.split(";")[0]);
  await f.client.execute({
    sql: "UPDATE test_sessions SET expires_at = ? WHERE id = ?",
    args: [Date.now() - 1, result.id],
  });
  assert.equal(
    (
      await f.call(
        "test-participant/screens",
        "POST",
        { title: "Too late", route: "/" },
        cookie,
      )
    ).status,
    410,
  );
  const detail = await (await f.call(`test-sessions/${result.id}`)).json();
  assert.equal(detail.session.status, "expired");
  assert.equal(detail.session.endedAt, detail.session.expiresAt);
});

test("commenters cannot create or stop tests; unrelated editors cannot stop; event schemas reject raw text and foreign screens", async (t) => {
  const f = await reviewFixture(t),
    invitation = await create(f),
    cookie = await start(f, invitation.cookie);
  const commenter = await f.login("commenter"),
    editor = await f.login("editor");
  assert.equal(
    (await f.call("test-sessions", "POST", {}, commenter)).status,
    403,
  );
  assert.equal(
    (await f.call(`test-sessions/${invitation.id}/stop`, "POST", {}, commenter))
      .status,
    403,
  );
  assert.equal(
    (await f.call(`test-sessions/${invitation.id}/stop`, "POST", {}, editor))
      .status,
    403,
  );
  const event = {
    id: randomUUID(),
    t: 0,
    type: "key",
    route: "/",
    key: "secret",
  };
  assert.equal(
    (
      await f.call(
        "test-participant/events",
        "POST",
        { events: [event] },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.call(
        "test-participant/events",
        "POST",
        { events: [{ ...event, key: "Enter", screenId: randomUUID() }] },
        cookie,
      )
    ).status,
    400,
  );
});

test("per-screen metrics count all clicks and aggregate revisits without double-counting time", () => {
  const session = {
    startedAt: 1000,
    endedAt: 11000,
    expiresAt: 11000,
  } as TestDetail["session"];
  const events = [
    { id: "1", t: 0, type: "screen", route: "/a", screenId: "a" },
    { id: "2", t: 100, type: "click", route: "/a", screenId: "a" },
    { id: "3", t: 200, type: "click", route: "/a", screenId: "a" },
    { id: "4", t: 2000, type: "screen", route: "/b", screenId: "b" },
    { id: "5", t: 6000, type: "screen", route: "/a", screenId: "a" },
  ] as TestDetail["events"];
  const result = sessionMetrics(session, events);
  assert.equal(result.duration, 10000);
  assert.equal(result.clicks, 2);
  assert.equal(result.screens.get("a")?.duration, 6000);
  assert.equal(result.screens.get("b")?.duration, 4000);
});

test("ordinary recording finish cannot discard or complete a live test flow", async (t) => {
  const f = await reviewFixture(t);
  const invitation = await create(f);
  const cookie = await start(f, invitation.cookie);
  const flowId = (await f.state()).flows[0].id;
  for (const withScreen of [false, true]) {
    if (withScreen) {
      const captured = await f.call(
        "test-participant/screens",
        "POST",
        {
          title: "Checkout",
          route: "/checkout",
          screenshot: TEST_PNG,
        },
        cookie,
      );
      assert.equal(captured.status, 201);
    }
    const response = await f.call(`flows/${flowId}/finish`, "POST");
    assert.equal(response.status, 409);
    assert.equal((await f.state()).flows[0].status, "recording");
    const detail = await (
      await f.call(`test-sessions/${invitation.id}`)
    ).json();
    assert.equal(detail.session.status, "live");
  }
  assert.equal(
    (await f.call(`test-sessions/${invitation.id}/stop`, "POST")).status,
    200,
  );
  assert.equal((await f.state()).flows[0].status, "complete");
});
