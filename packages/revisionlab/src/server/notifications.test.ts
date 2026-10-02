import assert from "node:assert/strict";
import test from "node:test";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import nodemailer from "nodemailer";
import {
  defaultNotificationSettings,
  type NotificationConfiguration,
  type NotificationSettings,
} from "../notification-settings.js";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";
import { resolveConfig } from "./config.js";
import { getDatabase } from "./database.js";
import { createRevisionLabHandler } from "./route-handler.js";
import { sendEmail } from "./notifications/delivery.js";
import {
  readNotificationConfiguration,
  saveNotificationConfiguration,
} from "./notifications/store.js";

const endpoint = "settings/notifications";
const webhook = "https://hooks.slack.com/services/TEST/CHANNEL/fake-secret";
const defaults = () => structuredClone(defaultNotificationSettings);
async function configuration(
  f: Awaited<ReturnType<typeof reviewFixture>>,
): Promise<NotificationConfiguration> {
  const response = await f.call(endpoint);
  assert.equal(response.status, 200);
  return response.json();
}
async function save(
  f: Awaited<ReturnType<typeof reviewFixture>>,
  settings: NotificationSettings,
  secrets = {},
) {
  const { revision } = await configuration(f);
  return f.call(endpoint, "PATCH", { settings, secrets, revision });
}

test("notification credentials are encrypted, redacted, preserved, explicitly removable and absent from state/history", async (t) => {
  const f = await reviewFixture(t);
  assert.deepEqual((await configuration(f)).settings, defaults());
  const settings = defaults();
  settings.resend.from = "reviews@example.test";
  const response = await save(f, settings, {
    resendApiKey: "resend-secret",
    smtpdevApiKey: "sandbox-secret",
    slackWebhook: webhook,
  });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.ok(!body.includes("resend-secret"));
  assert.ok(!body.includes(webhook));
  const row = (await f.client.execute("SELECT * FROM notification_settings"))
    .rows[0];
  assert.ok(!JSON.stringify(row).includes("resend-secret"));
  const key = join(dirname(f.config.databaseUrl.slice(5)), "notification.key");
  assert.equal(
    Buffer.from(await readFile(key, "utf8"), "base64url").length,
    32,
  );
  assert.equal((await stat(key)).mode & 0o777, 0o600);
  settings.defaultProvider = "resend";
  assert.equal((await save(f, settings)).status, 200);
  assert.equal((await configuration(f)).configuredSecrets.resendApiKey, true);
  const second = await getDatabase({
    ...f.config,
    databaseAuthToken: "notifications-restart",
  });
  try {
    assert.equal(
      (await readNotificationConfiguration(second, resolveConfig(f.config)))
        .settings.defaultProvider,
      "resend",
    );
  } finally {
    second.close();
  }
  assert.equal((await save(f, settings, { resendApiKey: null })).status, 400);
  settings.defaultProvider = "environment";
  assert.equal((await save(f, settings, { resendApiKey: null })).status, 200);
  assert.equal((await configuration(f)).configuredSecrets.resendApiKey, false);
  await f.call("comments", "POST", { route: "/", body: "History entry" });
  assert.ok(!JSON.stringify(await f.state()).includes("configuredSecrets"));
  const history = JSON.stringify(
    (await f.client.execute("SELECT snapshot_json FROM workspace_history"))
      .rows,
  );
  assert.ok(!history.includes("notification_settings"));
  assert.ok(!history.includes("sandbox-secret"));
});

test("notification configuration and tests require owner access and reject cross-origin writes and federation reads", async (t) => {
  const f = await reviewFixture(t);
  for (const role of ["editor", "commenter"] as const) {
    const cookie = await f.login(role);
    for (const [path, method, body] of [
      [endpoint, "GET", undefined],
      [endpoint, "PATCH", { settings: defaults(), revision: 0, secrets: {} }],
      [`${endpoint}/test`, "POST", { channel: "slack" }],
    ] as const)
      assert.equal((await f.call(path, method, body, cookie)).status, 403);
  }
  const handler = createRevisionLabHandler(f.config);
  assert.equal(
    (
      await handler(
        new Request(`http://127.0.0.1:3000/api/revisionlab/${endpoint}`, {
          method: "PATCH",
          headers: {
            Origin: "https://evil.example",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            settings: defaults(),
            revision: 0,
            secrets: {},
          }),
        }),
        { params: Promise.resolve({ path: endpoint.split("/") }) },
      )
    ).status,
    403,
  );
  const key = await (
    await f.call("api-keys", "POST", { name: "Test", role: "editor" })
  ).json();
  const remote = await handler(
    new Request(
      `http://127.0.0.1:3000/api/revisionlab/federation/${endpoint}`,
      { headers: { Authorization: `Bearer ${key.token}` } },
    ),
    {
      params: Promise.resolve({ path: ["federation", ...endpoint.split("/")] }),
    },
  );
  assert.equal(remote.status, 404);
});

test("invalid defaults, recipients, webhooks, secret updates and stale revisions cannot overwrite saved settings", async (t) => {
  const f = await reviewFixture(t);
  for (const provider of ["custom", "resend", "smtpdev"] as const) {
    const settings = defaults();
    settings.defaultProvider = provider;
    assert.equal((await save(f, settings)).status, 400);
  }
  for (const value of [
    "http://hooks.slack.com/services/A/B/C",
    "https://evil.example/services/A/B/C",
    `${webhook}?redirect=evil`,
    "https://hooks.slack.com@evil.example/services/A/B/C",
  ]) {
    assert.equal(
      (await save(f, defaults(), { slackWebhook: value })).status,
      400,
    );
  }
  const settings = defaults();
  settings.email.comments = true;
  assert.equal((await save(f, settings)).status, 400);
  settings.email.recipients = ["reviews@example.test"];
  assert.equal((await save(f, settings)).status, 400);
  assert.equal((await save(f, defaults(), { resendApiKey: "" })).status, 400);
  assert.equal((await save(f, defaults())).status, 200);
  assert.equal(
    (
      await f.call(endpoint, "PATCH", {
        settings: defaults(),
        secrets: {},
        revision: 0,
      })
    ).status,
    409,
  );
});

test("saved Resend default drives login emails; provider errors never leak credentials", async (t) => {
  const f = await reviewFixture(t);
  const settings = defaults();
  settings.defaultProvider = "resend";
  settings.resend.from = "review@example.test";
  assert.equal(
    (await save(f, settings, { resendApiKey: "api-secret" })).status,
    200,
  );
  await f.state();
  const requests: {
    url: string;
    body: Record<string, unknown>;
    authorization: string | undefined;
  }[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (url: string | URL | Request, options?: RequestInit) => {
      requests.push({
        url: String(url),
        body: JSON.parse(String(options?.body)),
        authorization:
          new Headers(options?.headers).get("Authorization") ?? undefined,
      });
      return new Response(JSON.stringify({ id: "sent" }), { status: 200 });
    },
  );
  const response = await f.call("auth/magic-request", "POST", {
    email: "owner@localhost",
    name: "Owner",
  });
  // Use setup to give the local bootstrap owner a valid mailbox first.
  assert.equal(response.status, 400);
  assert.equal(
    (
      await f.call("setup", "PATCH", {
        action: "identity",
        name: "Owner",
        email: "owner@example.test",
        systemUrl: "http://127.0.0.1:3000",
      })
    ).status,
    200,
  );
  const login = await f.call("auth/magic-request", "POST", {
    email: "owner@example.test",
    name: "Owner",
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).devLoginUrl, undefined);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.resend.com/emails");
  assert.equal(requests[0].authorization, "Bearer api-secret");
  assert.equal(requests[0].body.from, settings.resend.from);
  assert.match(String(requests[0].body.text), /single-use link/);
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("api-secret");
  });
  const failed = await f.call(`${endpoint}/test`, "POST", {
    channel: "email",
    recipient: "test@example.test",
  });
  assert.equal(failed.status, 502);
  assert.ok(!(await failed.text()).includes("api-secret"));
  assert.match((await configuration(f)).lastDelivery.email!, /Delivery failed/);
});

test("custom SMTP and SMTP.dev use the selected transport, TLS, credentials and sender", async (t) => {
  const f = await reviewFixture(t);
  const calls: { options: unknown; mail: unknown }[] = [];
  t.mock.method(nodemailer, "createTransport", (options: unknown) => ({
    sendMail: async (mail: unknown) => {
      calls.push({ options, mail });
    },
    close() {},
  }));
  const settings = defaults();
  settings.custom = {
    host: "smtp.example.test",
    port: 465,
    security: "tls",
    username: "review",
    from: "review@example.test",
  };
  settings.defaultProvider = "custom";
  assert.equal(
    (await save(f, settings, { customPassword: "smtp-secret" })).status,
    200,
  );
  await sendEmail(f.client, resolveConfig(f.config), {
    to: ["test@example.test"],
    subject: "Test",
    text: "Test",
  });
  assert.deepEqual((calls[0].options as { auth: unknown }).auth, {
    user: "review",
    pass: "smtp-secret",
  });
  assert.equal((calls[0].options as { secure: boolean }).secure, true);
  settings.defaultProvider = "smtpdev";
  settings.smtpdev = {
    from: "sender@example.test",
    username: "account@example.test",
  };
  assert.equal(
    (await save(f, settings, { smtpdevApiKey: "management-key-only" })).status,
    400,
  );
  assert.equal(
    (
      await save(f, settings, {
        smtpdevApiKey: "management-key",
        smtpdevPassword: "sandbox-password",
      })
    ).status,
    200,
  );
  await sendEmail(f.client, resolveConfig(f.config), {
    to: ["test@example.test"],
    subject: "Test",
    text: "Test",
  });
  const options = calls[1].options as {
    host: string;
    port: number;
    requireTLS: boolean;
    auth: unknown;
  };
  assert.equal(options.host, "send.smtp.dev");
  assert.equal(options.port, 587);
  assert.equal(options.requireTLS, true);
  assert.deepEqual(options.auth, {
    user: "account@example.test",
    pass: "sandbox-password",
  });
  assert.equal((calls[1].mail as { from: string }).from, settings.smtpdev.from);
});

test("Slack notifications fire after comments and replies commit, respect switches, and tolerate delivery failure", async (t) => {
  const f = await reviewFixture(t);
  const settings = defaults();
  settings.slack.enabled = true;
  await save(f, settings, { slackWebhook: webhook });
  const messages: unknown[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (url: string | URL | Request, options?: RequestInit) => {
      assert.equal(String(url), webhook);
      assert.ok(
        (await f.client.execute("SELECT id FROM comments")).rows.length > 0,
      );
      messages.push(JSON.parse(String(options?.body)));
      return new Response("ok");
    },
  );
  const comment = await f.call("comments", "POST", {
    route: "/",
    body: "Hello <!channel>",
  });
  assert.equal(comment.status, 201);
  const id = (await comment.json()).id;
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/",
        body: "Reply",
        parentId: id,
      })
    ).status,
    201,
  );
  assert.equal(messages.length, 2);
  assert.match(JSON.stringify(messages[0]), /plain_text/);
  assert.match((await configuration(f)).lastDelivery.slack!, /Accepted/);
  await f.call(`comments/${id}`, "PATCH", { status: "resolved" });
  assert.equal(messages.length, 2);
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("failed", { status: 503 }),
  );
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/",
        body: "Kept despite outage",
      })
    ).status,
    201,
  );
  assert.ok(
    (await f.state()).comments.some(
      (comment) => comment.body === "Kept despite outage",
    ),
  );
  assert.match((await configuration(f)).lastDelivery.slack!, /Delivery failed/);
  settings.slack.comments = false;
  await save(f, settings);
  t.mock.method(globalThis, "fetch", async () => {
    assert.fail("Disabled event must not send");
  });
  assert.equal(
    (await f.call("comments", "POST", { route: "/", body: "Silent" })).status,
    201,
  );
  assert.equal(
    (await f.call("comments", "POST", { route: "/", body: "" })).status,
    400,
  );
});

test("new saved accessibility issues notify once while reused captures do not", async (t) => {
  const f = await reviewFixture(t);
  const settings = defaults();
  settings.slack.enabled = true;
  settings.slack.comments = false;
  await save(f, settings, { slackWebhook: webhook });
  let sends = 0;
  t.mock.method(globalThis, "fetch", async () => {
    sends++;
    return new Response("ok");
  });
  const flow = await f.flow();
  const body = {
    title: "Screen",
    route: "/",
    screenshot: TEST_PNG,
    reuse: true,
    capture: {
      width: 100,
      height: 100,
      reason: "page",
      cursor: [],
      accessibility: {
        status: "issues",
        checkedAt: new Date().toISOString(),
        engineVersion: "4.13.0",
        violationCount: 1,
        incomplete: 0,
        truncated: false,
        issues: [
          {
            id: "label",
            help: "Label fields",
            helpUrl: "https://dequeuniversity.com/rules/axe/4.13/label",
            impact: "serious",
            count: 1,
            targets: ["input"],
          },
        ],
      },
    },
  };
  assert.equal((await f.call(`flows/${flow}/steps`, "POST", body)).status, 201);
  assert.equal(sends, 1);
  const reused = await f.call(`flows/${flow}/steps`, "POST", body);
  assert.equal(reused.status, 201);
  assert.equal((await reused.json()).reused, true);
  assert.equal(sends, 1);
  settings.slack.issues = false;
  await save(f, settings);
  assert.equal(
    (await f.call(`flows/${flow}/steps`, "POST", { ...body, reuse: false }))
      .status,
    201,
  );
  assert.equal(sends, 1);
});

test("host configuration remains the default and explicit disable prevents delivery", async (t) => {
  const f = await reviewFixture(t);
  let sends = 0;
  t.mock.method(globalThis, "fetch", async () => {
    sends++;
    return new Response("{}");
  });
  const config = resolveConfig({
    ...f.config,
    resendApiKey: "host-key",
    emailFrom: "host@example.test",
  });
  await sendEmail(f.client, config, {
    to: ["test@example.test"],
    subject: "Test",
    text: "Test",
  });
  assert.equal(sends, 1);
  const settings = defaults();
  settings.defaultProvider = "disabled";
  await save(f, settings);
  await assert.rejects(
    sendEmail(f.client, config, {
      to: ["test@example.test"],
      subject: "Test",
      text: "Test",
    }),
    /disabled/,
  );
  assert.equal(sends, 1);
});

test("hosted credential storage requires a valid encryption key and makes no partial change", async (t) => {
  const f = await reviewFixture(t);
  const raw = {
    settings: defaults(),
    revision: 0,
    secrets: { resendApiKey: "secret" },
  };
  const config = resolveConfig({
    ...f.config,
    databaseUrl: "libsql://test.invalid",
  });
  await assert.rejects(
    saveNotificationConfiguration(f.client, config, raw),
    /REVISIONLAB_NOTIFICATION_ENCRYPTION_KEY/,
  );
  assert.equal((await configuration(f)).revision, 0);
  await assert.rejects(
    saveNotificationConfiguration(
      f.client,
      { ...config, notificationEncryptionKey: "bad" },
      raw,
    ),
    /32-byte/,
  );
  await saveNotificationConfiguration(
    f.client,
    {
      ...config,
      notificationEncryptionKey: Buffer.alloc(32, 1).toString("base64url"),
    },
    raw,
  );
  assert.equal((await configuration(f)).configuredSecrets.resendApiKey, true);
});

test("email event recipients and switches are honored independently of Slack failures", async (t) => {
  const f = await reviewFixture(t);
  const settings = defaults();
  settings.defaultProvider = "resend";
  settings.resend.from = "sender@example.test";
  settings.email = {
    recipients: ["first@example.test", "second@example.test"],
    comments: true,
    issues: false,
  };
  settings.slack.enabled = true;
  await save(f, settings, { resendApiKey: "test-key", slackWebhook: webhook });
  const mail: Record<string, unknown>[] = [];
  let slackAttempts = 0;
  t.mock.method(
    globalThis,
    "fetch",
    async (url: string | URL | Request, options?: RequestInit) => {
      if (String(url) === webhook) {
        slackAttempts++;
        return new Response("failed", { status: 500 });
      }
      mail.push(JSON.parse(String(options?.body)));
      return new Response("{}");
    },
  );
  assert.equal(
    (await f.call("comments", "POST", { route: "/", body: "Email event" }))
      .status,
    201,
  );
  assert.equal(slackAttempts, 1);
  assert.equal(mail.length, 1);
  assert.deepEqual(mail[0].to, settings.email.recipients);
  assert.match(String(mail[0].text), /Email event/);
  const statuses = (await configuration(f)).lastDelivery;
  assert.match(statuses.email!, /Accepted/);
  assert.match(statuses.slack!, /failed/);
  settings.email.comments = false;
  settings.slack.enabled = false;
  await save(f, settings);
  await f.call("comments", "POST", { route: "/", body: "No notification" });
  assert.equal(mail.length, 1);
  assert.equal(slackAttempts, 1);
  const testResponse = await f.call(`${endpoint}/test`, "POST", {
    channel: "email",
    recipient: "test@example.test",
  });
  assert.equal(testResponse.status, 200);
  assert.equal(mail.length, 2);
  assert.deepEqual(mail[1].to, ["test@example.test"]);
});

test("test delivery records status even before the first settings save", async (t) => {
  const f = await reviewFixture(t);
  assert.equal((await configuration(f)).revision, 0);
  assert.equal(
    (
      await f.call(`${endpoint}/test`, "POST", {
        channel: "email",
        recipient: "test@example.test",
      })
    ).status,
    502,
  );
  const config = await configuration(f);
  assert.match(config.lastDelivery.email!, /failed/);
  assert.equal(config.revision, 0);
  assert.equal((await save(f, defaults())).status, 200);
});

test(
  "event delivery deadlines abort a stalled provider without failing the saved comment",
  { timeout: 10_000 },
  async (t) => {
    const f = await reviewFixture(t);
    const settings = defaults();
    settings.slack.enabled = true;
    await save(f, settings, { slackWebhook: webhook });
    // Unlike a real socket, this mock does not keep Node alive for AbortSignal.timeout.
    const keepAlive = setTimeout(() => {}, 9000);
    t.after(() => clearTimeout(keepAlive));
    let aborted = false;
    t.mock.method(
      globalThis,
      "fetch",
      (_url: string | URL | Request, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = options?.signal;
          assert.ok(signal);
          const abort = () => {
            aborted = true;
            reject(new Error("Timed out"));
          };
          if (signal.aborted) abort();
          else signal.addEventListener("abort", abort, { once: true });
        }),
    );
    const response = await f.call("comments", "POST", {
      route: "/",
      body: "Saved while provider stalls",
    });
    assert.equal(response.status, 201);
    assert.equal(aborted, true);
    assert.ok(
      (await f.state()).comments.some(
        (comment) => comment.body === "Saved while provider stalls",
      ),
    );
    assert.match((await configuration(f)).lastDelivery.slack!, /failed/);
  },
);
