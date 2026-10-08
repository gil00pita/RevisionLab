import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import test from "node:test";
import {
  rebaseMentions,
  type CommentOptions,
  type CommentMention,
  type CommentNotification,
} from "../comment-rich.js";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";

const documentFile = {
  name: "review notes.txt",
  data: `data:text/plain;base64,${Buffer.from("Review evidence").toString("base64")}`,
};

test("rich comments persist uploads, multiple personas and selected mentions with private recipient inboxes", async (t) => {
  const f = await reviewFixture(t);
  const commenter = await f.login("commenter");
  const editor = await f.login("editor");
  for (const name of ["tester", "Customer"])
    assert.equal((await f.call("personas", "POST", { name })).status, 201);
  const options: CommentOptions = await (
    await f.call("comments/options", "GET", undefined, commenter)
  ).json();
  const tester = options.personas.find((persona) => persona.name === "tester")!;
  const customer = options.personas.find(
    (persona) => persona.name === "Customer",
  )!;
  const editorId = String(
    (
      await f.client.execute(
        "SELECT id FROM reviewers WHERE email='editor@client.test'",
      )
    ).rows[0].id,
  );
  const mentions: CommentMention[] = [
    { id: tester.id, kind: "persona", label: "tester", start: 0, end: 7 },
    { id: editorId, kind: "user", label: "Reviewer", start: 8, end: 17 },
    { id: editorId, kind: "user", label: "Reviewer", start: 18, end: 27 },
  ];
  const response = await f.call(
    "comments",
    "POST",
    {
      body: "@tester @Reviewer @Reviewer check this",
      route: "/",
      personaIds: [customer.id, customer.id],
      mentions,
      attachments: [documentFile, { name: "pasted.png", data: TEST_PNG }],
    },
    commenter,
  );
  assert.equal(response.status, 201, await response.clone().text());
  const id = (await response.json()).id;
  const saved = (await f.state()).comments.find(
    (comment) => comment.id === id,
  )!;
  assert.equal(saved.attachments?.length, 2);
  assert.deepEqual(
    saved.personas?.map((persona) => persona.id).sort(),
    [customer.id, tester.id].sort(),
  );
  assert.deepEqual(saved.mentions, mentions);
  const file = saved.attachments![0];
  const download = await f.call(
    `artifacts/${file.id}`,
    "GET",
    undefined,
    commenter,
  );
  assert.equal(download.status, 200);
  assert.equal(
    download.headers.get("Content-Type"),
    "application/octet-stream",
  );
  assert.match(
    download.headers.get("Content-Disposition")!,
    /review%20notes.txt/,
  );
  assert.equal(await download.text(), "Review evidence");
  assert.equal(
    (await f.call(`artifacts/${saved.attachments![1].id}`)).headers.get(
      "Content-Type",
    ),
    "image/png",
  );
  const inbox: CommentNotification[] = await (
    await f.call("comments/notifications", "GET", undefined, editor)
  ).json();
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].commentId, id);
  assert.equal(inbox[0].readAt, null);
  assert.deepEqual(
    await (
      await f.call("comments/notifications", "GET", undefined, commenter)
    ).json(),
    [],
  );
  assert.equal(
    (
      await f.call(
        `comments/notifications/${inbox[0].id}`,
        "PATCH",
        { read: true },
        commenter,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await f.call(
        `comments/notifications/${inbox[0].id}`,
        "PATCH",
        { read: true },
        editor,
      )
    ).status,
    200,
  );
  assert.ok(
    (
      await (
        await f.call("comments/notifications", "GET", undefined, editor)
      ).json()
    )[0].readAt,
  );
  const reply = await f.call(
    "comments",
    "POST",
    {
      body: "@Reviewer confirmed",
      parentId: id,
      mentions: [
        { id: editorId, kind: "user", label: "Reviewer", start: 0, end: 9 },
      ],
      attachments: [documentFile],
    },
    editor,
  );
  assert.equal(reply.status, 201);
  assert.equal(
    (
      await (
        await f.call("comments/notifications", "GET", undefined, editor)
      ).json()
    ).length,
    1,
    "self mentions create no inbox entry",
  );
  assert.equal(
    (await f.state()).comments.find((comment) => comment.parentId === id)
      ?.attachments?.length,
    1,
  );
  assert.equal(
    (
      await f.call(
        "comments",
        "POST",
        { route: "/", body: "@Reviewer unselected plain text" },
        commenter,
      )
    ).status,
    201,
  );
  assert.equal(
    (
      await (
        await f.call("comments/notifications", "GET", undefined, editor)
      ).json()
    ).length,
    1,
  );
});

test("attachment and mention validation rolls back storage and rejects forged, overlapping, archived and oversized inputs", async (t) => {
  const f = await reviewFixture(t);
  await f.state();
  const invalid = [
    { body: "hello", personaIds: [randomUUID()] },
    {
      body: "@unknown",
      mentions: [
        { id: randomUUID(), kind: "user", label: "unknown", start: 0, end: 8 },
      ],
    },
    {
      body: "hello",
      attachments: [{ name: "../secret", data: documentFile.data }],
    },
    {
      body: "hello",
      attachments: [{ name: "empty", data: "data:text/plain;base64," }],
    },
    {
      body: "hello",
      attachments: [
        { name: "fake.png", data: "data:image/png;base64,aGVsbG8=" },
      ],
    },
    {
      body: "hello",
      attachments: [{ name: "bad", data: "data:text/plain;base64,aA" }],
    },
    { body: "hello", attachments: Array(6).fill(documentFile) },
  ];
  for (const input of invalid)
    assert.equal(
      (
        await f.call("comments", "POST", {
          route: "/",
          attachments: [documentFile],
          ...input,
        })
      ).status,
      400,
    );
  const oversized = {
    name: "big.txt",
    data: `data:text/plain;base64,${Buffer.alloc(3_000_001).toString("base64")}`,
  };
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/",
        body: "Size",
        attachments: [oversized],
      })
    ).status,
    413,
  );
  const total = Array.from({ length: 4 }, (_, index) => ({
    name: `${index}.txt`,
    data: `data:text/plain;base64,${Buffer.alloc(2_600_000).toString("base64")}`,
  }));
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/",
        body: "Total",
        attachments: total,
      })
    ).status,
    413,
  );
  const personaId = (
    await (await f.call("personas", "POST", { name: "Archived" })).json()
  ).id;
  await f.client.execute({
    sql: "UPDATE personas SET archived_at=? WHERE id=?",
    args: [new Date().toISOString(), personaId],
  });
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/",
        body: "Archived",
        personaIds: [personaId],
      })
    ).status,
    400,
  );
  const owner = (await f.state()).actor;
  const mention = {
    id: owner.id,
    kind: "user",
    label: owner.name,
    start: 0,
    end: owner.name.length + 1,
  };
  for (const mentions of [
    [{ ...mention, label: "Forged" }],
    [mention, mention],
    [{ ...mention, end: 1 }],
  ])
    assert.equal(
      (
        await f.call("comments", "POST", {
          route: "/",
          body: `@${owner.name}`,
          mentions,
        })
      ).status,
      400,
    );
  assert.equal((await f.state()).comments.length, 0);
  assert.equal(
    (await f.client.execute("SELECT count(*) count FROM artifacts")).rows[0]
      .count,
    0,
  );
  assert.equal((await readdir(f.config.artifactsDirectory)).length, 0);
  const svg = {
    name: "image.svg",
    data: `data:image/svg+xml;base64,${Buffer.from('<svg onload="alert(1)" />').toString("base64")}`,
  };
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/",
        body: "Downloaded, never inline",
        attachments: [svg],
      })
    ).status,
    201,
  );
  const attachment = (await f.state()).comments[0].attachments![0];
  assert.equal(attachment.contentType, "application/octet-stream");
  const response = await f.call(`artifacts/${attachment.id}`);
  assert.match(response.headers.get("Content-Disposition")!, /^attachment;/);
  assert.match(response.headers.get("Content-Security-Policy")!, /sandbox/);
});

test("mention email targets selected users once and provider failure leaves durable notifications and comments", async (t) => {
  const f = await reviewFixture(t);
  const recipientCookie = await f.login("commenter");
  const recipient = String(
    (
      await f.client.execute(
        "SELECT id FROM reviewers WHERE email='commenter@client.test'",
      )
    ).rows[0].id,
  );
  Object.assign(f.config, {
    resendApiKey: "mock-api-key",
    emailFrom: "review@example.test",
  });
  const calls: { to: string[] }[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body)));
      return new Response("rejected", { status: 503 });
    },
  );
  const mention = {
    id: recipient,
    kind: "user",
    label: "Reviewer",
    start: 0,
    end: 9,
  };
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "@Reviewer please check",
        route: "/",
        mentions: [mention],
      })
    ).status,
    201,
  );
  assert.deepEqual(
    calls.map((mail) => mail.to),
    [["commenter@client.test"]],
  );
  assert.equal((await f.state()).comments.length, 1);
  assert.equal(
    (
      await (
        await f.call(
          "comments/notifications",
          "GET",
          undefined,
          recipientCookie,
        )
      ).json()
    ).length,
    1,
  );
});

test("history retains rich comment files privately and restores them with metadata without redelivering notifications", async (t) => {
  const f = await reviewFixture(t);
  const cookie = await f.login("commenter");
  const recipient = String(
    (
      await f.client.execute(
        "SELECT id FROM reviewers WHERE email='commenter@client.test'",
      )
    ).rows[0].id,
  );
  const flowId = await f.flow();
  const stepId = await f.capture(flowId);
  const persona = (
    await (await f.call("personas", "POST", { name: "tester" })).json()
  ).id;
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "@Reviewer review",
        route: "/checkout",
        flowId,
        stepId,
        personaIds: [persona],
        mentions: [
          { id: recipient, kind: "user", label: "Reviewer", start: 0, end: 9 },
        ],
        attachments: [documentFile],
      })
    ).status,
    201,
  );
  const original = (await f.state()).comments[0];
  await f.call(`flows/${flowId}`, "PATCH", { status: "complete" });
  await f.call("flows/delete", "POST", { familyIds: [flowId] });
  assert.equal(
    (await f.call(`artifacts/${original.attachments![0].id}`)).status,
    404,
  );
  const history = (await (await f.call("history")).json()).history;
  const deletion = history.find(
    (entry: { action: string }) => entry.action === "Deleted flows",
  );
  assert.equal(
    (await f.call(`history/${deletion.id}/restore`, "POST", {})).status,
    200,
  );
  assert.deepEqual((await f.state()).comments[0], original);
  assert.equal(
    (await f.call(`artifacts/${original.attachments![0].id}`)).status,
    200,
  );
  assert.equal(
    (
      await (
        await f.call("comments/notifications", "GET", undefined, cookie)
      ).json()
    ).length,
    1,
  );
});

test("editing mention text drops identity while unrelated edits preserve correctly shifted offsets", () => {
  const mention: CommentMention = {
    id: "user",
    kind: "user",
    label: "tester",
    start: 6,
    end: 13,
  };
  assert.deepEqual(
    rebaseMentions("Hello @tester", "Hello @tester!", [mention]),
    [mention],
  );
  assert.deepEqual(
    rebaseMentions("Hello @tester", "Well, Hello @tester", [mention]),
    [{ ...mention, start: 12, end: 19 }],
  );
  assert.deepEqual(
    rebaseMentions("Hello @tester", "Hello @tested", [mention]),
    [],
  );
  assert.deepEqual(rebaseMentions("Hello @tester", "Hello", [mention]), []);
});

test("attachment-only comments and ticket drafts retain downloadable evidence after source recording deletion", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  const stepId = await f.capture(flowId);
  const response = await f.call("comments", "POST", {
    route: "/checkout",
    body: "",
    flowId,
    stepId,
    attachments: [documentFile],
  });
  assert.equal(response.status, 201);
  assert.equal(
    (await f.call("comments", "POST", { route: "/", body: " " })).status,
    400,
  );
  const evidence = (
    await (await f.call("feedback-review")).json()
  ).evidence.find((item: { kind: string }) => item.kind === "comment");
  assert.equal(evidence.title, documentFile.name);
  assert.equal(evidence.attachments.length, 1);
  const { retainTicketEvidence } = await import("./feedback-review/tickets.js");
  const { write } = await import("./database.js");
  const ticketId = randomUUID();
  const ticket = {
    id: ticketId,
    revision: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    evidence: [evidence],
    notes: "",
    summary: "Review attachment",
    description: "Review",
    priority: "Medium" as const,
    acceptanceCriteria: "Confirm",
    status: "draft" as const,
  };
  await write(f.client, async (transaction) => {
    await transaction.execute({
      sql: "INSERT INTO feedback_tickets (id, ticket_json, created_at, updated_at) VALUES (?, ?, ?, ?)",
      args: [
        ticketId,
        JSON.stringify(ticket),
        ticket.createdAt,
        ticket.updatedAt,
      ],
    });
    await retainTicketEvidence(transaction, ticket);
  });
  await f.call(`flows/${flowId}`, "PATCH", { status: "complete" });
  await f.call("flows/delete", "POST", { familyIds: [flowId] });
  const artifact = evidence.attachments[0];
  assert.equal((await f.call(`artifacts/${artifact.id}`)).status, 200);
  const { ticketText } = await import("../feedback-review.js");
  assert.match(
    ticketText(ticket, "https://review.example.test/revisionlab"),
    /Attachment: review notes.txt \(https:\/\/review.example.test\/api\/revisionlab\/artifacts\//,
  );
});

test("a partial custom-storage failure rolls back all uploads and leaves no comment or notification", async (t) => {
  const f = await reviewFixture(t);
  const stored = new Map<string, Uint8Array>();
  let uploads = 0;
  Object.assign(f.config, {
    artifactStorage: {
      async put(id: string, bytes: Uint8Array) {
        stored.set(id, bytes);
        if (++uploads === 2)
          throw new Error("Simulated partial storage failure");
      },
      async get(id: string) {
        return stored.get(id) ?? null;
      },
      async delete(id: string) {
        stored.delete(id);
      },
    },
  });
  const response = await f.call("comments", "POST", {
    body: "Review",
    route: "/",
    attachments: [documentFile, { ...documentFile, name: "second.txt" }],
  });
  assert.equal(response.status, 500);
  assert.equal(stored.size, 0);
  assert.equal((await f.state()).comments.length, 0);
  assert.equal(
    (await f.client.execute("SELECT count(*) count FROM artifacts")).rows[0]
      .count,
    0,
  );
});

test("the mention directory excludes revoked invitations, expired sessions and suspended members", async (t) => {
  const f = await reviewFixture(t);
  await f.login("commenter");
  await f.login("editor");
  const initial = await (await f.call("comments/options")).json();
  assert.equal(initial.users.length, 3);
  const userId = String(
    (
      await f.client.execute(
        "SELECT id FROM reviewers WHERE email='commenter@client.test'",
      )
    ).rows[0].id,
  );
  await f.client.execute(
    "UPDATE invitations SET revoked_at='2020-01-01T00:00:00Z' WHERE email='commenter@client.test'",
  );
  let options = await (await f.call("comments/options")).json();
  assert.equal(
    options.users.some((user: { id: string }) => user.id === userId),
    false,
  );
  assert.equal(
    (
      await f.call("comments", "POST", {
        body: "@Reviewer review",
        route: "/",
        mentions: [
          { id: userId, kind: "user", label: "Reviewer", start: 0, end: 9 },
        ],
      })
    ).status,
    400,
  );
  await f.client.execute(
    "UPDATE sessions SET expires_at='2020-01-01T00:00:00Z' WHERE role='editor'",
  );
  options = await (await f.call("comments/options")).json();
  assert.equal(options.users.length, 1);
  const now = new Date().toISOString();
  await f.client.execute({
    sql: "INSERT INTO workspace_memberships (id,reviewer_id,email,role,status,source,created_at,updated_at) VALUES (?,?,?,'commenter','suspended','test',?,?)",
    args: [randomUUID(), userId, "commenter@client.test", now, now],
  });
  await f.client.execute(
    "UPDATE invitations SET revoked_at=NULL WHERE email='commenter@client.test'",
  );
  assert.equal(
    (await (await f.call("comments/options")).json()).users.length,
    1,
  );
});
