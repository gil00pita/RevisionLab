import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import { getDatabase } from "./database.js";
import { createRevisionLabHandler } from "./route-handler.js";
import { protectRevisionLab } from "./protection.js";
import { resolveConfig } from "./config.js";
import type { RevisionLabConfig, RevisionLabState } from "./types.js";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHoQAAAAASUVORK5CYII=";
const BASE = "http://127.0.0.1:3000";
const OWNER = "owner@company.test";

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), "revisionlab-test-"));
  const config: RevisionLabConfig = {
    projectId: randomUUID(),
    projectName: "Test project",
    ownerEmail: OWNER,
    databaseUrl: `file:${join(directory, "review.db")}`,
    artifactsDirectory: join(directory, "artifacts"),
  };
  const envKeys = [
    "NODE_ENV",
    "VERCEL",
    "RESEND_API_KEY",
    "REVISIONLAB_LOCAL_OWNER",
    "REVISIONLAB_DATABASE_AUTH_TOKEN",
    "REVISIONLAB_EMAIL_FROM",
  ];
  const originalEnv = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]]),
  );
  for (const key of envKeys) delete process.env[key];
  process.env.NODE_ENV = "development";
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("External requests are disabled in these tests.");
  });
  const handler = createRevisionLabHandler(config);
  const client = await getDatabase(resolveConfig(config));
  t.after(async () => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    client.close();
    await rm(directory, { recursive: true, force: true });
  });
  async function call(
    path: string,
    method = "GET",
    body?: unknown,
    cookie?: string,
    headers?: Record<string, string>,
  ) {
    return handler(
      new Request(`${BASE}/api/revisionlab/${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
          ...headers,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      { params: Promise.resolve({ path: path.split("/") }) },
    );
  }
  async function invite(email = "reviewer@client.test", role = "commenter") {
    const response = await call("invitations", "POST", { email, role });
    assert.equal(response.status, 201);
    const data = await response.json();
    return {
      id: data.id as string,
      token: new URL(data.inviteUrl).searchParams.get("invite")!,
    };
  }
  async function challenge(email: string, token?: string) {
    const response = await call("auth/request", "POST", {
      email,
      inviteToken: token,
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    return {
      email,
      challengeId: data.challengeId as string,
      code: data.devCode as string,
      name: "Reviewer",
    };
  }
  async function login(email: string, token?: string) {
    const response = await call(
      "auth/verify",
      "POST",
      await challenge(email, token),
    );
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie")!;
    assert.match(cookie, /HttpOnly; SameSite=Lax/);
    return cookie.split(";")[0];
  }
  async function flow(name = "Checkout") {
    const response = await call("flows", "POST", {
      name,
      persona: "Customer",
      route: "/checkout",
    });
    assert.equal(response.status, 201);
    return (await response.json()).id as string;
  }
  return {
    config,
    client,
    directory,
    call,
    invite,
    challenge,
    login,
    flow,
    handler,
  };
}

test("local database persists recordings and stores screenshots as private files", async (t) => {
  const f = await fixture(t);
  const id = await f.flow();
  const response = await f.call(`flows/${id}/steps`, "POST", {
    title: "Checkout",
    route: "/checkout",
    screenshot: PNG,
  });
  assert.equal(response.status, 201);
  const state: RevisionLabState = await (await f.call("state")).json();
  assert.equal(state.flows[0].steps.length, 1);
  const screenshot = state.flows[0].steps[0].screenshot!;
  assert.match(screenshot, /^\/api\/revisionlab\/artifacts\//);
  const artifact = await f.call(screenshot.replace("/api/revisionlab/", ""));
  assert.equal(artifact.status, 200);
  assert.equal(artifact.headers.get("content-type"), "image/png");
  assert.equal(artifact.headers.get("cache-control"), "private, no-store");
  assert.equal((await readdir(join(f.directory, "artifacts"))).length, 1);
  const permissions = await stat(join(f.directory, "review.db"));
  assert.equal(permissions.mode & 0o777, 0o600);
});

test("concurrent screen capture assigns distinct ordered positions", async (t) => {
  const f = await fixture(t);
  const id = await f.flow();
  const results = await Promise.all(
    [1, 2, 3].map((number) =>
      f.call(`flows/${id}/steps`, "POST", {
        title: `Screen ${number}`,
        route: "/",
      }),
    ),
  );
  assert.deepEqual(
    results.map((response) => response.status),
    [201, 201, 201],
  );
  const state: RevisionLabState = await (await f.call("state")).json();
  assert.deepEqual(
    state.flows[0].steps.map((step) => step.position),
    [0, 1, 2],
  );
});

test("new versions preserve completed screens and their comments", async (t) => {
  const f = await fixture(t);
  const first = await f.flow();
  const step = await (
    await f.call(`flows/${first}/steps`, "POST", {
      title: "Before",
      route: "/",
    })
  ).json();
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Change this",
        route: "/",
        flowId: first,
        stepId: step.id,
      })
    ).status,
    201,
  );
  assert.equal(
    (await f.call(`flows/${first}`, "PATCH", { status: "complete" })).status,
    200,
  );
  assert.equal(
    (await f.call(`flows/${first}`, "PATCH", { status: "recording" })).status,
    409,
  );
  assert.equal(
    (
      await f.call(`flows/${first}/steps`, "POST", {
        title: "Overwrite",
        route: "/",
      })
    ).status,
    409,
  );
  const next = await (
    await f.call(`flows/${first}/versions`, "POST", {})
  ).json();
  const state: RevisionLabState = await (await f.call("state")).json();
  const newer = state.flows.find((flow) => flow.id === next.id)!;
  assert.equal(newer.version, 2);
  assert.equal(newer.familyId, first);
  assert.equal(newer.previousVersionId, first);
  assert.equal(newer.steps.length, 0);
  assert.equal(state.comments[0].flowId, first);
  assert.equal(
    (await f.call(`flows/${first}/versions`, "POST", {})).status,
    409,
  );
});

test("a commenter session takes precedence over local owner and cannot edit or invite", async (t) => {
  const f = await fixture(t);
  const invitation = await f.invite();
  const cookie = await f.login("reviewer@client.test", invitation.token);
  const state: RevisionLabState = await (
    await f.call("state", "GET", undefined, cookie)
  ).json();
  assert.equal(state.actor.role, "commenter");
  assert.equal(state.invitations.length, 0);
  assert.equal(
    (await f.call("comments", "POST", { body: "Feedback", route: "/" }, cookie))
      .status,
    201,
  );
  assert.equal(
    (
      await f.call(
        "flows",
        "POST",
        { name: "Bad", persona: "Bad", route: "/" },
        cookie,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.call(
        "invitations",
        "POST",
        { email: "new@client.test", role: "editor" },
        cookie,
      )
    ).status,
    403,
  );
});

test("revoking an invitation invalidates active sessions and pending challenges", async (t) => {
  const f = await fixture(t);
  const invitation = await f.invite();
  const cookie = await f.login("reviewer@client.test", invitation.token);
  const challenge = await f.challenge("reviewer@client.test", invitation.token);
  assert.equal(
    (await f.call(`invitations/${invitation.id}`, "PATCH", { revoked: true }))
      .status,
    200,
  );
  assert.equal((await f.call("state", "GET", undefined, cookie)).status, 401);
  assert.equal((await f.call("auth/verify", "POST", challenge)).status, 403);
  assert.equal(
    (await f.call(`invitations/${invitation.id}`, "PATCH", { revoked: false }))
      .status,
    400,
  );
});

test("a verification code can create only one session even under concurrent requests", async (t) => {
  const f = await fixture(t);
  const challenge = await f.challenge(OWNER);
  const results = await Promise.all([
    f.call("auth/verify", "POST", challenge),
    f.call("auth/verify", "POST", challenge),
  ]);
  assert.deepEqual(
    results.map((response) => response.status).sort(),
    [200, 403],
  );
  assert.equal(
    (await f.client.execute("SELECT COUNT(*) AS count FROM sessions")).rows[0]
      .count,
    1,
  );
});

test("incorrect codes are capped at five attempts and resends invalidate older codes", async (t) => {
  const f = await fixture(t);
  const challenge = await f.challenge(OWNER);
  const wrong = challenge.code === "111111" ? "222222" : "111111";
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal(
      (await f.call("auth/verify", "POST", { ...challenge, code: wrong }))
        .status,
      403,
    );
  }
  assert.equal((await f.call("auth/verify", "POST", challenge)).status, 403);
  const older = await f.challenge(OWNER);
  const newer = await f.challenge(OWNER);
  assert.equal((await f.call("auth/verify", "POST", older)).status, 403);
  assert.equal((await f.call("auth/verify", "POST", newer)).status, 200);
});

test("email challenge creation is rate limited persistently", async (t) => {
  const f = await fixture(t);
  for (let count = 0; count < 5; count++) await f.challenge(OWNER);
  const response = await f.call("auth/request", "POST", { email: OWNER });
  assert.equal(response.status, 429);
  assert.ok(response.headers.has("retry-after"));
});

test("named invitations reject other email addresses and owners can bootstrap without an invite", async (t) => {
  const f = await fixture(t);
  const invitation = await f.invite();
  assert.equal(
    (
      await f.call("auth/request", "POST", {
        email: "intruder@client.test",
        inviteToken: invitation.token,
      })
    ).status,
    403,
  );
  const cookie = await f.login(OWNER);
  const state: RevisionLabState = await (
    await f.call("state", "GET", undefined, cookie)
  ).json();
  assert.equal(state.actor.role, "owner");
});

test("logout deletes the server session and expires its cookie", async (t) => {
  const f = await fixture(t);
  const cookie = await f.login(OWNER);
  const response = await f.call("auth/logout", "POST", {}, cookie);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie")!, /Max-Age=0/);
  assert.equal((await f.call("state", "GET", undefined, cookie)).status, 401);
});

test("local owner cannot bypass authentication in production or through a nonlocal hostname", async (t) => {
  const f = await fixture(t);
  const remote = await f.handler(
    new Request("https://prototype.example/api/revisionlab/state"),
    { params: Promise.resolve({ path: ["state"] }) },
  );
  assert.equal(remote.status, 401);
  process.env.NODE_ENV = "production";
  assert.equal((await f.call("state")).status, 401);
  assert.equal(
    (await f.call("auth/request", "POST", { email: OWNER })).status,
    503,
  );
});

test("foreign keys, missing resources, and mismatched screen comments are rejected", async (t) => {
  const f = await fixture(t);
  const first = await f.flow("First");
  const second = await f.flow("Second");
  const step = await (
    await f.call(`flows/${first}/steps`, "POST", {
      title: "First screen",
      route: "/",
    })
  ).json();
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Wrong flow",
        route: "/",
        flowId: second,
        stepId: step.id,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.call(`flows/${randomUUID()}/steps`, "POST", {
        title: "Missing",
        route: "/",
      })
    ).status,
    404,
  );
  assert.equal(
    (await f.call(`comments/${randomUUID()}`, "PATCH", { status: "resolved" }))
      .status,
    404,
  );
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "Missing",
        route: "/",
        flowId: randomUUID(),
      })
    ).status,
    404,
  );
});

test("request parsing rejects malformed JSON, cross-origin mutations, huge bodies, and nonimages", async (t) => {
  const f = await fixture(t);
  const first = await f.flow();
  const malformed = await f.handler(
    new Request(`${BASE}/api/revisionlab/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }),
    { params: Promise.resolve({ path: ["flows"] }) },
  );
  assert.equal(malformed.status, 400);
  assert.equal(
    (
      await f.call("comments", "POST", { body: "No", route: "/" }, undefined, {
        Origin: "https://evil.example",
      })
    ).status,
    403,
  );
  assert.equal(
    (await f.call("comments", "POST", { body: "x".repeat(20_000), route: "/" }))
      .status,
    413,
  );
  assert.equal(
    (
      await f.call(`flows/${first}/steps`, "POST", {
        title: "No",
        route: "/",
        screenshot: "data:image/svg+xml;base64,PHN2Zz4=",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.call("flows", "POST", {
        name: "No",
        persona: "No",
        route: "/\\evil.example",
      })
    ).status,
    400,
  );
});

test("navigation protection allows login, protects prototype routes, and rejects unauthenticated APIs", async (t) => {
  const f = await fixture(t);
  const config = { ...f.config, localOwner: false };
  assert.equal(
    await protectRevisionLab(new Request(`${BASE}/revisionlab/access`), config),
    undefined,
  );
  const protectedPage = await protectRevisionLab(
    new Request(`${BASE}/checkout?step=2`),
    config,
  );
  assert.equal(protectedPage?.status, 307);
  assert.equal(
    new URL(protectedPage!.headers.get("location")!).searchParams.get(
      "returnTo",
    ),
    "/checkout?step=2",
  );
  assert.equal(
    (await protectRevisionLab(new Request(`${BASE}/api/private`), config))
      ?.status,
    401,
  );
});

test("project identity prevents accidentally sharing a database between installations", async (t) => {
  const f = await fixture(t);
  const handler = createRevisionLabHandler({
    ...f.config,
    projectId: "different-project",
  });
  const response = await handler(new Request(`${BASE}/api/revisionlab/state`), {
    params: Promise.resolve({ path: ["state"] }),
  });
  assert.equal(response.status, 503);
});
