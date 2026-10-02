import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { reviewFixture } from "./review-test-fixture.js";
import { createRevisionLabHandler } from "./route-handler.js";
import { protectRevisionLab } from "./protection.js";
import {
  instanceTransport,
  instanceUrl,
  publicAddress,
} from "./instances/transport.js";
import { scopeData } from "./instances/data.js";
import type { WorkspaceState } from "../workspace-instances.js";

async function pair(t: Parameters<typeof reviewFixture>[0]) {
  const local = await reviewFixture(t),
    remote = await reviewFixture(t);
  remote.config.projectId = local.config.projectId;
  await remote.client.execute({
    sql: "UPDATE installation SET project_id=?",
    args: [local.config.projectId],
  });
  const handler = createRevisionLabHandler(remote.config);
  const generated = await remote.call("api-keys", "POST", {
    name: "Local review",
    role: "editor",
  });
  const key = await generated.json();
  let online = true;
  t.mock.method(
    instanceTransport,
    "send",
    async (
      url: URL,
      token: string,
      options: { method?: string; body?: string; role?: string } = {},
    ) => {
      if (!online) throw new Error("offline");
      assert.equal(url.origin, "https://prototype.example.com");
      return handler(
        new Request(url, {
          method: options.method ?? "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(options.role ? { "X-RevisionLab-Role": options.role } : {}),
          },
          body: options.body,
        }),
        { params: Promise.resolve({ path: url.pathname.split("/").slice(3) }) },
      );
    },
  );
  const input = {
    name: "Staging",
    url: "https://prototype.example.com",
    apiKey: key.token,
  };
  const added = await local.call("instances", "POST", input);
  assert.equal(added.status, 201, await added.clone().text());
  const connection = await added.json();
  const workspace = async (selection = "all", cookie?: string) => {
    const response = await createRevisionLabHandler(local.config)(
      new Request(
        `http://127.0.0.1:3000/api/revisionlab/workspace-state?workspace=${selection}`,
        { headers: cookie ? { Cookie: cookie } : {} },
      ),
      { params: Promise.resolve({ path: ["workspace-state"] }) },
    );
    assert.equal(response.status, 200, await response.clone().text());
    return (await response.json()) as WorkspaceState;
  };
  return {
    local,
    remote,
    key,
    connection,
    input,
    workspace,
    setOnline: (value: boolean) => {
      online = value;
    },
    handler,
  };
}

test("API keys are owner-only, shown once, hashed, scoped, and revocable", async (t) => {
  const f = await reviewFixture(t);
  const editor = await f.login("editor");
  assert.equal(
    (
      await f.call(
        "api-keys",
        "POST",
        { name: "Denied", role: "editor" },
        editor,
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.call("api-keys", "GET", undefined, editor)).status,
    403,
  );
  const created = await f.call("api-keys", "POST", {
    name: "Review",
    role: "commenter",
  });
  assert.equal(created.status, 201);
  const key = await created.json();
  assert.match(key.token, /^rlk_/);
  assert.ok(
    !JSON.stringify(
      (await f.client.execute("SELECT * FROM workspace_api_keys")).rows,
    ).includes(key.token),
  );
  assert.ok(!(await (await f.call("api-keys")).text()).includes(key.token));
  const handler = createRevisionLabHandler(f.config);
  const request = (path: string, method = "GET", body?: unknown) =>
    handler(
      new Request(
        `https://source.example.com/api/revisionlab/federation/${path}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${key.token}`,
            "Content-Type": "application/json",
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      ),
      { params: Promise.resolve({ path: ["federation", ...path.split("/")] }) },
    );
  assert.equal((await request("state")).status, 200);
  assert.equal(
    (await request("settings", "PATCH", { wcagLevel: "A" })).status,
    403,
  );
  assert.equal(
    (await request("api-keys", "POST", { name: "Escalation", role: "editor" }))
      .status,
    403,
  );
  assert.equal(
    (await request("invitations", "POST", { role: "editor" })).status,
    403,
  );
  assert.equal(
    (await f.call(`api-keys/${key.id}`, "PATCH", { revoked: true })).status,
    200,
  );
  assert.equal((await request("state")).status, 401);
  const page = new Request("https://source.example.com/private", {
    headers: { Authorization: `Bearer ${key.token}` },
  });
  assert.equal((await protectRevisionLab(page, f.config))?.status, 307);
  assert.equal(
    await protectRevisionLab(
      new Request(
        "https://source.example.com/api/revisionlab/federation/state",
      ),
      f.config,
    ),
    undefined,
  );
  assert.equal(
    (
      await handler(
        new Request(
          "https://source.example.com/api/revisionlab/federation/state",
        ),
        { params: Promise.resolve({ path: ["federation", "state"] }) },
      )
    ).status,
    401,
  );
});

test("connected data stays isolated, editable at source, and usable when another source is offline", async (t) => {
  const f = await pair(t);
  const localFlow = await f.local.flow("Same name");
  const localStep = await f.local.capture(localFlow);
  // Clone IDs as a deployed database copy would; namespace isolation must still work.

  const remoteFlow = await f.remote.flow("Same name");
  await f.remote.client.execute({
    sql: "UPDATE flows SET id=?,family_id=? WHERE id=?",
    args: [localFlow, localFlow, remoteFlow],
  });
  await f.remote.capture(localFlow);
  const remotePersona = await f.remote.call("personas", "POST", {
    name: "Remote customer",
    description: "Remote persona",
  });
  assert.equal(remotePersona.status, 201);
  const all = await f.workspace();
  assert.equal(all.flows.length, 2);
  const remote = all.flows.find(
    (flow) => flow.workspace?.id === f.connection.id,
  )!;
  assert.equal(remote.id, `${f.connection.id}~${localFlow}`);
  assert.equal(remote.familyId, `${f.connection.id}~${localFlow}`);
  assert.equal(remote.board.nodes[0].stepId, remote.steps[0].id);
  assert.equal(
    all.flows.find((flow) => flow.id === localFlow)?.steps[0].id,
    localStep,
  );
  assert.ok(
    all.personas.some((persona) => persona.workspace?.id === f.connection.id),
  );
  assert.ok(!JSON.stringify(all).includes(f.key.token));
  const proxy = `instances/${f.connection.id}/proxy`;
  assert.match(remote.steps[0].screenshot!, new RegExp(`/${proxy}/artifacts/`));
  const screenshot = await f.local.call(
    remote.steps[0].screenshot!.replace("/api/revisionlab/", ""),
  );
  assert.equal(screenshot.status, 200);
  assert.equal(screenshot.headers.get("content-type"), "image/png");
  assert.ok((await screenshot.arrayBuffer()).byteLength > 0);
  const update = await f.local.call(
    `${proxy}/flows/${remote.id}/board`,
    "PATCH",
    {
      ...remote.board,
      nodes: remote.board.nodes.map((node) => ({ ...node, x: 400 })),
    },
  );
  assert.equal(update.status, 200, await update.clone().text());
  assert.equal((await update.json()).board.nodes[0].stepId, remote.steps[0].id);
  assert.equal((await f.remote.state()).flows[0].board.nodes[0].x, 400);
  assert.notEqual((await f.local.state()).flows[0].board.nodes[0].x, 400);
  const history = await (await f.local.call(`${proxy}/history`)).json();
  const boardChange = history.history.find(
    (entry: { action: string }) => entry.action === "Edited a flow board",
  );
  assert.ok(boardChange.id.startsWith(`${f.connection.id}~`));
  assert.equal(
    (
      await f.local.call(
        `${proxy}/history/${boardChange.id}/restore`,
        "POST",
        {},
      )
    ).status,
    200,
  );
  assert.notEqual((await f.remote.state()).flows[0].board.nodes[0].x, 400);
  assert.equal((await f.local.call(`${proxy}/state`)).status, 200);
  const posted = await f.local.call(`${proxy}/comments`, "POST", {
    route: "/checkout",
    body: "Connected feedback",
    flowId: remote.id,
    stepId: remote.steps[0].id,
  });
  assert.equal(posted.status, 201, await posted.clone().text());
  assert.equal((await f.remote.state()).comments[0].body, "Connected feedback");
  assert.match(
    (await f.remote.state()).comments[0].authorName,
    /Connected workspace/,
  );
  assert.equal((await f.local.state()).comments.length, 0);
  assert.equal(
    (await f.local.call(`${proxy}/settings`, "PATCH", { wcagLevel: "AAA" }))
      .status,
    200,
  );
  assert.equal((await f.workspace(f.connection.id)).settings.wcagLevel, "AAA");
  assert.equal((await f.workspace("local")).settings.wcagLevel, "AA");
  const commenter = await f.local.login("commenter");
  assert.equal(
    (
      await f.local.call(
        `${proxy}/settings`,
        "PATCH",
        { wcagLevel: "A" },
        commenter,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.local.call(
        `${proxy}/flows/${remote.id}/board`,
        "PATCH",
        remote.board,
        commenter,
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.local.call("instances", "GET", undefined, commenter)).status,
    403,
  );
  assert.equal(
    (await f.workspace("all", commenter)).workspaces.find(
      (source) => source.id === f.connection.id,
    )?.role,
    "commenter",
  );
  assert.equal(
    (
      await f.local.call(
        `${proxy}/settings`,
        "PATCH",
        { wcagLevel: "A" },
        commenter,
      )
    ).status,
    403,
  );
  f.setOnline(false);
  const partial = await f.workspace();
  assert.equal(partial.flows.length, 1);
  assert.equal(
    partial.workspaces.find((source) => source.id === f.connection.id)?.status,
    "unavailable",
  );
  assert.equal((await f.workspace(f.connection.id)).flows.length, 0);
  f.setOnline(true);
  assert.equal((await f.workspace()).flows.length, 2);
  assert.equal(
    (
      await f.local.call(`instances/${f.connection.id}`, "PATCH", {
        remove: true,
      })
    ).status,
    200,
  );
  assert.equal((await f.remote.state()).flows.length, 1);
});

test("connections reject invalid keys, other projects, duplicate instances and self links", async (t) => {
  const f = await pair(t);
  assert.equal((await f.local.call("instances", "POST", f.input)).status, 409);
  assert.equal(
    (
      await f.local.call("instances", "POST", {
        ...f.input,
        apiKey: `rlk_${"x".repeat(43)}`,
      })
    ).status,
    401,
  );
  f.remote.config.projectId = randomUUID();
  await f.remote.client.execute({
    sql: "UPDATE installation SET project_id=?",
    args: [f.remote.config.projectId],
  });
  assert.equal(
    (await f.local.call(`instances/${f.connection.id}`, "POST", f.input))
      .status,
    400,
  );
  f.remote.config.projectId = f.local.config.projectId;
  await f.remote.client.execute({
    sql: "UPDATE installation SET project_id=?",
    args: [f.remote.config.projectId],
  });
  const id = (
    await f.local.client.execute("SELECT instance_id FROM installation")
  ).rows[0].instance_id;
  await f.remote.client.execute({
    sql: "UPDATE installation SET instance_id=?",
    args: [id],
  });
  assert.equal(
    (await f.local.call(`instances/${f.connection.id}`, "POST", f.input))
      .status,
    400,
  );
});

test("source key role caps local owners and revoked connections can be re-keyed", async (t) => {
  const f = await pair(t);
  const key = await (
    await f.remote.call("api-keys", "POST", {
      name: "Discussion only",
      role: "commenter",
    })
  ).json();
  const path = `instances/${f.connection.id}`;
  const update = await f.local.call(path, "POST", {
    ...f.input,
    apiKey: key.token,
  });
  assert.equal(update.status, 200);
  assert.ok(!(await update.text()).includes(key.token));
  assert.ok(
    !(await (await f.local.call("instances")).text()).includes(key.token),
  );
  assert.equal(
    (await f.workspace(f.connection.id)).settingsWorkspace?.role,
    "commenter",
  );
  assert.equal(
    (
      await f.local.call(`${path}/proxy/settings`, "PATCH", {
        wcagLevel: "AAA",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await f.local.call(`${path}/proxy/comments`, "POST", {
        route: "/checkout",
        body: "Can discuss",
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await f.local.call(`${path}/proxy/api-keys`, "POST", {
        name: "Escalate",
        role: "editor",
      })
    ).status,
    403,
  );
  await f.remote.call(`api-keys/${key.id}`, "PATCH", { revoked: true });
  assert.equal(
    (await f.workspace(f.connection.id)).settingsWorkspace?.status,
    "unavailable",
  );
  assert.equal(
    (
      await f.local.call(`${path}/proxy/comments`, "POST", {
        route: "/checkout",
        body: "Must fail",
      })
    ).status,
    401,
  );
  assert.equal((await f.local.call(path, "POST", f.input)).status, 200);
  assert.equal(
    (await f.workspace(f.connection.id)).settingsWorkspace?.role,
    "editor",
  );
  assert.equal(
    (
      await f.local.call(`${path}/proxy/settings`, "PATCH", {
        wcagLevel: "AAA",
      })
    ).status,
    200,
  );
});

test("outbound connections reject private URLs and namespaced mutations reject cross-source references", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "100.64.1.1",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
  ])
    assert.equal(publicAddress(address), false, address);
  assert.equal(publicAddress("93.184.216.34"), true);
  for (const url of [
    "http://example.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://user:secret@example.com",
    "https://example.com:8443",
    "https://example.com?key=secret",
    "https://example.com#fragment",
  ])
    assert.throws(() => instanceUrl(url));
  assert.equal(
    instanceUrl("https://example.com/prototype"),
    "https://example.com",
  );
  assert.throws(() => scopeData({ flowId: "other~id" }, "source", "out"));
  assert.deepEqual(
    scopeData(
      {
        flowId: "source~id",
        body: "source~keep my text",
        hiddenStepIds: ["source~step"],
      },
      "source",
      "out",
    ),
    { flowId: "id", body: "source~keep my text", hiddenStepIds: ["step"] },
  );
});
