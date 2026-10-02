import assert from "node:assert/strict";
import test from "node:test";
import { reviewFixture } from "./review-test-fixture.js";

test("workspace code joining enforces the email policy and creates revocable membership sessions", async (t) => {
  const f = await reviewFixture(t);
  assert.equal(
    (
      await f.call("access/settings", "PATCH", {
        systemUrl: "http://127.0.0.1:3000",
        allowedEmails: ["@company.test"],
      })
    ).status,
    200,
  );
  const rotated = await f.call("access/join-code", "POST", {});
  assert.equal(rotated.status, 200);
  const { code } = await rotated.json();

  const rejected = await f.call("auth/magic-request", "POST", {
    email: "person@outside.test",
    name: "Outside",
    joinCode: code,
  });
  assert.equal(rejected.status, 200);
  assert.equal((await rejected.json()).devLoginUrl, undefined);

  const requested = await f.call("auth/magic-request", "POST", {
    email: "person@company.test",
    name: "Employee",
    joinCode: code,
    returnTo: "/checkout?step=2",
  });
  assert.equal(requested.status, 200);
  const requestedBody = await requested.json();
  assert.ok(requestedBody.devLoginUrl, JSON.stringify(requestedBody));
  const loginUrl = String(requestedBody.devLoginUrl);
  const token = new URL(loginUrl).searchParams.get("login");
  assert.ok(token);
  const consumed = await f.call("auth/magic-consume", "POST", { token });
  assert.equal(consumed.status, 200);
  assert.equal((await consumed.clone().json()).returnTo, "/checkout?step=2");
  const cookie = consumed.headers.get("set-cookie")!.split(";")[0];
  const memberState = await (
    await f.call("state", "GET", undefined, cookie)
  ).json();
  assert.equal(memberState.actor.role, "commenter");
  const member = (await f.state()).memberships.find(
    (item) => item.email === "person@company.test",
  )!;
  assert.equal(member.status, "active");

  assert.equal(
    (await f.call(`members/${member.id}`, "PATCH", { role: "editor" })).status,
    200,
  );
  assert.equal((await f.call("state", "GET", undefined, cookie)).status, 401);
  const requestedAgain = await f.call("auth/magic-request", "POST", {
    email: member.email,
    name: "Employee",
  });
  const nextToken = new URL(
    String((await requestedAgain.json()).devLoginUrl),
  ).searchParams.get("login");
  const relogin = await f.call("auth/magic-consume", "POST", {
    token: nextToken,
  });
  const editorCookie = relogin.headers.get("set-cookie")!.split(";")[0];
  assert.equal(
    (await (await f.call("state", "GET", undefined, editorCookie)).json()).actor
      .role,
    "editor",
  );
});

test("owners manually add members and cannot remove the last active owner", async (t) => {
  const f = await reviewFixture(t);
  const initial = await f.state();
  const localOwner = initial.memberships.find(
    (member) => member.role === "owner",
  )!;
  assert.equal(
    (await f.call(`members/${localOwner.id}`, "PATCH", { status: "suspended" }))
      .status,
    409,
  );

  const added = await f.call("members", "POST", {
    email: "client@outside.test",
    role: "editor",
  });
  assert.equal(added.status, 201);
  const token = new URL(
    String((await added.json()).devLoginUrl),
  ).searchParams.get("login");
  const consumed = await f.call("auth/magic-consume", "POST", { token });
  assert.equal(consumed.status, 200);
  const cookie = consumed.headers.get("set-cookie")!.split(";")[0];
  assert.equal(
    (await (await f.call("state", "GET", undefined, cookie)).json()).actor.role,
    "editor",
  );
});

test("persona test accounts are encrypted, redacted from state, audited, and role protected", async (t) => {
  const f = await reviewFixture(t);
  const created = await f.call("personas", "POST", { name: "Administrator" });
  const id = String((await created.json()).id);
  assert.equal(
    (
      await f.call(`personas/${id}/credentials`, "PATCH", {
        username: "admin@example.test",
        password: "secret-value",
      })
    ).status,
    200,
  );
  const stateText = JSON.stringify(await f.state());
  assert.match(stateText, /"hasCredentials":true/);
  assert.doesNotMatch(stateText, /admin@example\.test|secret-value/);
  const stored = await f.client.execute({
    sql: "SELECT username_ciphertext, password_ciphertext FROM persona_credentials WHERE persona_id = ?",
    args: [id],
  });
  assert.doesNotMatch(
    String(stored.rows[0].username_ciphertext),
    /admin@example\.test/,
  );
  assert.doesNotMatch(
    String(stored.rows[0].password_ciphertext),
    /secret-value/,
  );

  const commenter = await f.login("commenter");
  assert.equal(
    (await f.call(`personas/${id}/credentials`, "POST", {}, commenter)).status,
    403,
  );
  const editor = await f.login("editor");
  const revealed = await f.call(
    `personas/${id}/credentials`,
    "POST",
    {},
    editor,
  );
  assert.equal(revealed.status, 200);
  assert.deepEqual(await revealed.json(), {
    username: "admin@example.test",
    password: "secret-value",
  });
  assert.equal(
    Number(
      (
        await f.client.execute(
          "SELECT COUNT(*) AS count FROM audit_events WHERE action = 'persona.credentials.reveal'",
        )
      ).rows[0].count,
    ),
    1,
  );
});
