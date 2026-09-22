import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestContext } from "node:test";
import { getDatabase } from "./database.js";
import { createRevisionLabHandler } from "./route-handler.js";
import type { RevisionLabRole, RevisionLabState } from "./types.js";

export const TEST_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHoQAAAAASUVORK5CYII=";

export async function reviewFixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), "revisionlab-review-"));
  const config = {
    projectId: randomUUID(),
    projectName: "Review tests",
    databaseUrl: `file:${join(directory, "review.db")}`,
    artifactsDirectory: join(directory, "artifacts"),
  };
  const keys = [
    "NODE_ENV",
    "VERCEL",
    "RESEND_API_KEY",
    "REVISIONLAB_LOCAL_OWNER",
    "REVISIONLAB_DATABASE_AUTH_TOKEN",
  ];
  const env = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  process.env.NODE_ENV = "development";
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("External requests are disabled in these tests.");
  });
  const handler = createRevisionLabHandler(config);
  const client = await getDatabase(config);
  t.after(async () => {
    for (const [key, value] of Object.entries(env)) {
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
  ) {
    return handler(
      new Request(`http://127.0.0.1:3000/api/revisionlab/${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      { params: Promise.resolve({ path: path.split("/") }) },
    );
  }
  async function flow(name = "Checkout") {
    const response = await call("flows", "POST", {
      name,
      persona: "Customer",
      route: "/checkout",
    });
    assert.equal(response.status, 201);
    return String((await response.json()).id);
  }
  async function capture(flowId: string, image = true) {
    const response = await call(`flows/${flowId}/steps`, "POST", {
      title: "Checkout",
      route: "/checkout",
      ...(image ? { screenshot: TEST_PNG } : {}),
    });
    assert.equal(response.status, 201);
    return String((await response.json()).id);
  }
  async function state(): Promise<RevisionLabState> {
    const response = await call("state");
    assert.equal(response.status, 200);
    return response.json();
  }
  async function login(role: Exclude<RevisionLabRole, "owner">) {
    const email = `${role}@client.test`;
    const invite = await call("invitations", "POST", { email, role });
    assert.equal(invite.status, 201);
    const inviteToken = new URL(
      (await invite.json()).inviteUrl,
    ).searchParams.get("invite");
    const challenge = await call("auth/request", "POST", {
      email,
      inviteToken,
    });
    assert.equal(challenge.status, 200);
    const { challengeId, devCode } = await challenge.json();
    const verified = await call("auth/verify", "POST", {
      email,
      challengeId,
      code: devCode,
      name: "Reviewer",
    });
    assert.equal(verified.status, 200);
    return verified.headers.get("set-cookie")!.split(";")[0];
  }
  return { config, client, call, flow, capture, state, login };
}
