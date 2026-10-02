import assert from "node:assert/strict";
import test from "node:test";
import nodemailer from "nodemailer";
import { defaultNotificationSettings } from "../notification-settings.js";
import { resolveConfig } from "./config.js";
import { reviewFixture } from "./review-test-fixture.js";
import { createRevisionLabHandler } from "./route-handler.js";
import { recordDelivery, sendEmail } from "./notifications/delivery.js";
import { notifyReviewEvent } from "./notifications/events.js";
import {
  readNotificationConfiguration,
  saveNotificationConfiguration,
} from "./notifications/store.js";

test("first host delivery persists status without changing configuration revisions", async (t) => {
  const f = await reviewFixture(t);
  const config = resolveConfig({
    ...f.config,
    resendApiKey: "test-key",
    emailFrom: "host@example.test",
  });
  const handler = createRevisionLabHandler(config);
  t.mock.method(globalThis, "fetch", async () => new Response("{}"));
  const response = await handler(
    new Request(
      "http://127.0.0.1:3000/api/revisionlab/settings/notifications/test",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          recipient: "test@example.test",
        }),
      },
    ),
    {
      params: Promise.resolve({ path: ["settings", "notifications", "test"] }),
    },
  );
  assert.equal(response.status, 200);
  const initial = await readNotificationConfiguration(f.client, config);
  assert.match(initial.lastDelivery.email!, /Accepted/);
  assert.equal(initial.revision, 0);
  const saved = await saveNotificationConfiguration(f.client, config, {
    settings: { ...initial.settings, defaultProvider: "disabled" },
    revision: initial.revision,
    secrets: { resendApiKey: "saved-secret" },
  });
  const before = (await f.client.execute("SELECT * FROM notification_settings"))
    .rows[0];
  await recordDelivery(f.client, "slack", false);
  const after = (await f.client.execute("SELECT * FROM notification_settings"))
    .rows[0];
  assert.equal(after.settings_json, before.settings_json);
  assert.equal(after.secrets_ciphertext, before.secrets_ciphertext);
  assert.equal(after.secret_names, before.secret_names);
  assert.equal(Number(after.revision), saved.revision);
  assert.equal(after.email_status, before.email_status);
  assert.match(String(after.slack_status), /failed/);
});

test("federated comments return before the proxy deadline when both providers stall", async (t) => {
  const f = await reviewFixture(t);
  const config = resolveConfig(f.config);
  const settings = structuredClone(defaultNotificationSettings);
  settings.defaultProvider = "resend";
  settings.resend.from = "sender@example.test";
  settings.email = {
    recipients: ["review@example.test"],
    comments: true,
    issues: false,
  };
  settings.slack.enabled = true;
  await saveNotificationConfiguration(f.client, config, {
    settings,
    revision: 0,
    secrets: {
      resendApiKey: "test-key",
      slackWebhook: "https://hooks.slack.com/services/TEST/CHANNEL/secret",
    },
  });
  const key = await (
    await f.call("api-keys", "POST", { name: "Reviewer", role: "commenter" })
  ).json();
  let aborted = 0;
  t.mock.method(
    globalThis,
    "fetch",
    (_url: unknown, options?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = options!.signal!;
        const fail = () => {
          aborted++;
          reject(signal.reason);
        };
        if (signal.aborted) fail();
        else signal.addEventListener("abort", fail, { once: true });
      }),
  );
  const handler = createRevisionLabHandler(config);
  // Keep the event loop alive for AbortSignal.timeout, and fail before the proxy's 8s limit.
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const start = Date.now();
  try {
    const response = await Promise.race([
      handler(
        new Request(
          "http://127.0.0.1:3000/api/revisionlab/federation/comments",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              route: "/",
              body: "Saved despite stalled notifications",
            }),
          },
        ),
        { params: Promise.resolve({ path: ["federation", "comments"] }) },
      ),
      new Promise<never>((_resolve, reject) => {
        watchdog = setTimeout(
          () => reject(new Error("Notification blocked the comment response")),
          7000,
        );
      }),
    ]);
    assert.equal(response.status, 201);
    assert.ok(Date.now() - start < 7000);
  } finally {
    clearTimeout(watchdog);
  }
  assert.equal(aborted, 2);
  assert.equal(
    (await f.client.execute("SELECT id FROM comments")).rows.length,
    1,
  );
  const status = await readNotificationConfiguration(f.client, config);
  assert.match(status.lastDelivery.email!, /failed/);
  assert.match(status.lastDelivery.slack!, /failed/);
  let expiredAttempts = 0;
  t.mock.method(globalThis, "fetch", async () => {
    expiredAttempts++;
    return new Response("ok");
  });
  await notifyReviewEvent(
    f.client,
    config,
    { type: "comments", title: "Expired", detail: "Expired" },
    Date.now() - 1,
  );
  assert.equal(expiredAttempts, 0);
});

test("SMTP delivery observes the caller's remaining deadline", async (t) => {
  const f = await reviewFixture(t);
  const config = resolveConfig(f.config);
  const settings = structuredClone(defaultNotificationSettings);
  settings.defaultProvider = "custom";
  settings.custom.host = "smtp.example.test";
  settings.custom.from = "sender@example.test";
  await saveNotificationConfiguration(f.client, config, {
    settings,
    revision: 0,
    secrets: {},
  });
  let closed = false;
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: () => new Promise(() => {}),
    close: () => {
      closed = true;
    },
  }));
  await assert.rejects(
    sendEmail(
      f.client,
      config,
      {
        to: ["test@example.test"],
        subject: "Test",
        text: "Test",
      },
      Date.now() + 100,
    ),
    /timed out/,
  );
  assert.equal(closed, true);
});
