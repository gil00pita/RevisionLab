import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import {
  groupEvidence,
  ticketText,
  evidenceReviewPath,
  type FeedbackReviewData,
} from "../feedback-review.js";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";
import { createRevisionLabHandler } from "./route-handler.js";
import { normalizeComment } from "../comment-suggestions.js";

async function fixture(t: TestContext) {
  const f = await reviewFixture(t);
  const root = f.config.aiProjectDirectory;
  const bin = join(root, "bin");
  await mkdir(bin);
  await writeFile(
    join(root, "screen.tsx"),
    'export const label = "Keep me";\n',
  );
  await writeFile(
    join(bin, "codex"),
    `#!${process.execPath}
const fs = require('node:fs');
let prompt = ''; process.stdin.on('data', c => prompt += c); process.stdin.on('end', () => {
fs.writeFileSync('prompt.txt', prompt); fs.writeFileSync('args.json', JSON.stringify(process.argv.slice(2)));
if (fs.existsSync('fail')) process.exit(1);
if (fs.existsSync('slow')) return setTimeout(() => {}, 60000);
const save = () => fs.copyFileSync('result.json', process.argv[process.argv.indexOf('--output-last-message') + 1]);
if (fs.existsSync('delayed')) setTimeout(save, 250); else save();
});`,
    { mode: 0o755 },
  );
  const previous = process.env.PATH;
  process.env.PATH = `${bin}:${previous}`;
  t.after(() => {
    process.env.PATH = previous;
  });
  await f.call("settings/ai", "PATCH", {
    instructions: "Use accessible Chakra controls.",
  });
  const flowId = await f.flow();
  const stepId = await f.capture(flowId);
  const secondFlowId = await f.flow("Checkout mobile");
  const secondStepId = await f.capture(secondFlowId);
  async function comment(body: string, extra = {}) {
    const response = await f.call("comments", "POST", {
      flowId,
      stepId,
      route: "/checkout",
      body,
      ...extra,
    });
    assert.equal(response.status, 201, await response.clone().text());
    return String((await response.json()).id);
  }
  const commentId = await comment("The button label is unclear.");
  await comment("  THE button   label is unclear.  ", {
    flowId: secondFlowId,
    stepId: secondStepId,
  });
  await comment("Which action does it perform?", { parentId: commentId });
  const resolvedId = await comment("Already fixed.");
  await f.client.execute({
    sql: "UPDATE comments SET status='resolved' WHERE id=?",
    args: [resolvedId],
  });
  const read = async (): Promise<FeedbackReviewData> => {
    const response = await f.call("feedback-review");
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  };
  const initial = await read();
  const evidenceIds = initial.evidence.map((item) => item.id);
  const generated = {
    tickets: [
      {
        summary: "Clarify checkout button",
        description:
          "The checkout action label is ambiguous on desktop and mobile.",
        priority: "Medium",
        acceptanceCriteria:
          "- Reviewers can identify the checkout action before clicking.",
        evidenceIds,
      },
    ],
  };
  await writeFile(join(root, "result.json"), JSON.stringify(generated));
  return {
    ...f,
    root,
    flowId,
    stepId,
    commentId,
    evidenceIds,
    generated,
    read,
  };
}

test("Feedback Review consolidates exact repeats while retaining occurrences, replies and source links", async (t) => {
  const f = await fixture(t);
  const data = await f.read();
  assert.equal(data.evidence.length, 2);
  const groups = groupEvidence(data.evidence);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].evidence.length, 2);
  assert.match(
    groups[0].evidence[0].body + groups[0].evidence[1].body,
    /Which action/,
  );
  assert.equal(data.canGenerate, true);
  const url = new URL(
    evidenceReviewPath(data.evidence[0], "http://localhost/revisionlab"),
  );
  assert.equal(url.searchParams.get("flow"), data.evidence[0].flowId);
  assert.equal(url.searchParams.get("screen"), data.evidence[0].stepId);
  assert.equal(url.searchParams.get("workspace"), "local");
  const distinct = {
    ...data.evidence[0],
    id: "distinct",
    title: "The payment method is unclear.",
  };
  assert.equal(groupEvidence([...data.evidence, distinct]).length, 2);
});

test("Codex drafts and edits persist with exact evidence; revisions reject concurrent overwrites", async (t) => {
  const f = await fixture(t);
  const before = await f.state();
  const response = await f.call("feedback-review/generate", "POST", {
    evidenceIds: f.evidenceIds,
    notes: "Both screen variants have the same problem.",
  });
  assert.equal(response.status, 201, await response.clone().text());
  const {
    tickets: [ticket],
  } = await response.json();
  assert.equal(ticket.status, "draft");
  assert.equal(ticket.evidence.length, 2);
  assert.equal((await f.read()).tickets[0].id, ticket.id);
  assert.deepEqual(await f.state(), before);
  assert.match(await readFile(join(f.root, "screen.tsx"), "utf8"), /Keep me/);
  const prompt = await readFile(join(f.root, "prompt.txt"), "utf8");
  assert.match(prompt, /Use accessible Chakra controls/);
  assert.match(prompt, /Both screen variants/);
  const args = JSON.parse(await readFile(join(f.root, "args.json"), "utf8"));
  assert.equal(args[args.indexOf("--sandbox") + 1], "read-only");
  assert.ok(args.includes("--output-schema"));
  const fields = {
    summary: "Use a clear action label",
    description: ticket.description,
    priority: "High",
    acceptanceCriteria: ticket.acceptanceCriteria,
    status: "ready",
    revision: 0,
  };
  assert.equal(
    (await f.call(`feedback-review/${ticket.id}`, "PATCH", fields)).status,
    200,
  );
  const saved = (await f.read()).tickets[0];
  assert.equal(saved.summary, fields.summary);
  assert.equal(saved.status, "ready");
  assert.equal(saved.revision, 1);
  assert.deepEqual(saved.evidence, ticket.evidence);
  assert.equal(
    (
      await f.call(`feedback-review/${ticket.id}`, "PATCH", {
        ...fields,
        summary: "Stale overwrite",
      })
    ).status,
    409,
  );
  assert.equal((await f.read()).tickets[0].summary, fields.summary);
  const exported = ticketText(saved, "http://localhost/revisionlab");
  assert.match(exported, /Acceptance criteria/);
  assert.match(exported, /version 1/);
  assert.match(exported, /Source evidence/);
  for (const id of f.evidenceIds) assert.ok(exported.includes(id));
  // Draft snapshots survive removal of their live source.
  await f.client.execute({
    sql: "DELETE FROM flows WHERE id=?",
    args: [f.flowId],
  });
  assert.deepEqual((await f.read()).tickets[0].evidence, saved.evidence);
});

test("ticket generation rejects missing, duplicate and excessive selected evidence", async (t) => {
  const f = await fixture(t);
  for (const [evidenceIds, status] of [
    [[], 400],
    [[f.evidenceIds[0], f.evidenceIds[0]], 400],
    [[`comment:${randomUUID()}`], 409],
    [Array.from({ length: 51 }, () => `comment:${randomUUID()}`), 400],
  ] as const) {
    assert.equal(
      (await f.call("feedback-review/generate", "POST", { evidenceIds }))
        .status,
      status,
    );
  }
  assert.equal((await f.read()).tickets.length, 0);
});

test("invalid, failed, incomplete or invented Codex output never saves partial tickets", async (t) => {
  const f = await fixture(t);
  const ticket = f.generated.tickets[0];
  for (const output of [
    "not json",
    JSON.stringify({ tickets: [] }),
    JSON.stringify({
      tickets: [{ ...ticket, evidenceIds: [f.evidenceIds[0]] }],
    }),
    JSON.stringify({
      tickets: [{ ...ticket, evidenceIds: [f.evidenceIds[0], "invented"] }],
    }),
    JSON.stringify({
      tickets: [
        { ...ticket, evidenceIds: [f.evidenceIds[0], f.evidenceIds[0]] },
      ],
    }),
  ]) {
    await writeFile(join(f.root, "result.json"), output);
    assert.equal(
      (
        await f.call("feedback-review/generate", "POST", {
          evidenceIds: f.evidenceIds,
        })
      ).status,
      503,
    );
    assert.equal((await f.read()).tickets.length, 0);
  }
  await writeFile(join(f.root, "fail"), "");
  assert.equal(
    (
      await f.call("feedback-review/generate", "POST", {
        evidenceIds: f.evidenceIds,
      })
    ).status,
    503,
  );
  const savedPath = process.env.PATH;
  try {
    process.env.PATH = join(f.root, "missing-bin");
    const missing = await f.call("feedback-review/generate", "POST", {
      evidenceIds: f.evidenceIds,
    });
    assert.equal(missing.status, 503);
    assert.match((await missing.json()).error, /Codex CLI is not installed/);
  } finally {
    process.env.PATH = savedPath;
  }
  assert.deepEqual(
    (await f.read()).evidence.map((item) => item.id),
    f.evidenceIds,
  );
});

test("commenters can review drafts; generation and edits require editor and local generation", async (t) => {
  const f = await fixture(t);
  const {
    tickets: [ticket],
  } = await (
    await f.call("feedback-review/generate", "POST", {
      evidenceIds: f.evidenceIds,
    })
  ).json();
  const commenter = await f.login("commenter");
  const read = await f.call("feedback-review", "GET", undefined, commenter);
  assert.equal(read.status, 200);
  assert.equal((await read.json()).canGenerate, false);
  assert.equal(
    (
      await f.call(
        "feedback-review/generate",
        "POST",
        { evidenceIds: f.evidenceIds },
        commenter,
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.call(`feedback-review/${ticket.id}`, "PATCH", {}, commenter))
      .status,
    403,
  );
  const editor = await f.login("editor");
  process.env.NODE_ENV = "production";
  assert.equal(
    (await f.call("feedback-review", "GET", undefined, editor)).status,
    200,
  );
  assert.equal(
    (
      await f.call(
        "feedback-review/generate",
        "POST",
        { evidenceIds: f.evidenceIds },
        editor,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.call(
        `feedback-review/${ticket.id}`,
        "PATCH",
        {
          summary: ticket.summary,
          description: ticket.description,
          priority: ticket.priority,
          acceptanceCriteria: ticket.acceptanceCriteria,
          status: "ready",
          revision: 0,
        },
        editor,
      )
    ).status,
    200,
  );
  process.env.NODE_ENV = "development";
  const handler = createRevisionLabHandler(f.config);
  const foreign = await handler(
    new Request(
      "http://127.0.0.1:3000/api/revisionlab/feedback-review/generate",
      {
        method: "POST",
        headers: {
          Origin: "https://foreign.test",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ evidenceIds: f.evidenceIds }),
      },
    ),
    { params: Promise.resolve({ path: ["feedback-review", "generate"] }) },
  );
  assert.equal(foreign.status, 403);
  const nonlocal = await handler(
    new Request(
      "https://prototype.test/api/revisionlab/feedback-review/generate",
      {
        method: "POST",
        headers: { Cookie: editor, "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceIds: f.evidenceIds }),
      },
    ),
    { params: Promise.resolve({ path: ["feedback-review", "generate"] }) },
  );
  assert.equal(nonlocal.status, 403);
});

test("saved accessibility and ended tests supply evidence, not invented usability findings", async (t) => {
  const f = await fixture(t);
  const issue = {
    id: "button-name",
    help: "Buttons must have discernible text",
    impact: "critical",
    count: 1,
    targets: ["main > button"],
    helpUrl: "https://example.test/button-name",
  };
  const capture = {
    width: 800,
    height: 600,
    reason: "page",
    cursor: [],
    accessibility: {
      status: "issues",
      issues: [issue],
      violationCount: 1,
      incomplete: 0,
      truncated: false,
    },
  };
  await f.client.execute({
    sql: "UPDATE steps SET capture_json=? WHERE id=?",
    args: [JSON.stringify(capture), f.stepId],
  });
  const sessionId = randomUUID();
  await f.client.execute({
    sql: "INSERT INTO test_sessions (id,name,route,persona,token_hash,created_by,participant,status,max_minutes,created_at,expires_at,started_at,ended_at,flow_id) VALUES (?,?,?,?,?,?,?,'completed',1,1000,61000,1000,11000,?)",
    args: [
      sessionId,
      "Checkout usability",
      "/checkout",
      "Customer",
      randomUUID(),
      (await f.state()).actor.id,
      "Alex",
      f.flowId,
    ],
  });
  await f.client.execute({
    sql: "INSERT INTO test_events (session_id,id,t,event_json) VALUES (?,?,1000,?)",
    args: [
      sessionId,
      randomUUID(),
      JSON.stringify({ type: "click", route: "/checkout", t: 1000 }),
    ],
  });
  const data = await f.read();
  const scan = data.evidence.find((item) => item.kind === "accessibility")!;
  assert.equal(scan.issueId, "button-name");
  assert.match(scan.body, /main > button/);
  const activity = data.evidence.find((item) => item.kind === "test")!;
  assert.match(activity.body, /10.0 seconds/);
  assert.match(activity.body, /Recorded clicks: 1/);
  assert.match(activity.body, /not task success/);
  const replay = new URL(
    evidenceReviewPath(activity, "http://localhost/revisionlab"),
  );
  assert.equal(replay.searchParams.get("session"), sessionId);
  assert.equal(
    groupEvidence([scan, { ...scan, id: "repeat", stepId: randomUUID() }])
      .length,
    1,
  );
  assert.equal(
    groupEvidence([scan, { ...scan, id: "other-page", route: "/account" }])
      .length,
    2,
  );
  await f.client.execute({
    sql: "UPDATE test_sessions SET status='live' WHERE id=?",
    args: [sessionId],
  });
  assert.equal(
    (await f.read()).evidence.filter((item) => item.kind === "test").length,
    0,
  );
});

test("cancelling ticket generation releases the lock and retains feedback without saving drafts", async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.root, "slow"), "");
  const controller = new AbortController();
  const pending = createRevisionLabHandler(f.config)(
    new Request(
      "http://127.0.0.1:3000/api/revisionlab/feedback-review/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ evidenceIds: f.evidenceIds }),
      },
    ),
    { params: Promise.resolve({ path: ["feedback-review", "generate"] }) },
  );
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await readFile(join(f.root, "prompt.txt"), "utf8").catch(() => ""))
      break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(
    (
      await f.call("feedback-review/generate", "POST", {
        evidenceIds: f.evidenceIds,
      })
    ).status,
    409,
  );
  controller.abort();
  assert.equal((await pending).status, 503);
  assert.equal((await f.read()).tickets.length, 0);
  assert.deepEqual(
    (await f.read()).evidence.map((item) => item.id),
    f.evidenceIds,
  );
  await rm(join(f.root, "slow"));
  assert.equal(
    (
      await f.call("feedback-review/generate", "POST", {
        evidenceIds: f.evidenceIds,
      })
    ).status,
    201,
  );
});

test("Autocomplete matches other reviewers' open page feedback, deduplicates wording, and excludes replies/resolved/other routes", async (t) => {
  const f = await fixture(t);
  const cookie = await f.login("commenter");
  for (const body of [
    "Color contrast ratio needs to be fixed.",
    "COLOR contrast ratio needs to be fixed!",
  ]) {
    assert.equal(
      (await f.call("comments", "POST", { route: "/checkout", body }, cookie))
        .status,
      201,
    );
  }
  await f.call("comments", "POST", {
    route: "/other",
    body: "Color contrast ratio needs to be fixed.",
  });
  const resolved = await f.call("comments", "POST", {
    route: "/checkout",
    body: "Color contrast of icons",
  });
  await f.call(`comments/${(await resolved.json()).id}`, "PATCH", {
    status: "resolved",
  });
  await f.call("comments", "POST", {
    parentId: f.commentId,
    body: "Color contrast in a reply",
    route: "/checkout",
    flowId: f.flowId,
    stepId: f.stepId,
  });
  const response = await f.call(
    "comment-suggestions?route=%2Fcheckout&q=contrast%20rat",
    "GET",
    undefined,
    cookie,
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.suggestions.length, 1);
  assert.equal(data.suggestions[0].occurrences, 2);
  assert.equal(
    normalizeComment(data.suggestions[0].body),
    "color contrast ratio needs to be fixed",
  );
  assert.deepEqual(
    (await (await f.call("comment-suggestions?route=%2Fcheckout&q=co")).json())
      .suggestions,
    [],
  );
  assert.equal(
    (
      await f.call(
        "comment-suggestions?route=https%3A%2F%2Fevil.test&q=contrast",
      )
    ).status,
    400,
  );
});

test("Live page screenshots are private, preserve the saved location, and reject attachments on replies/recorded screens", async (t) => {
  const f = await fixture(t);
  const created = await f.call("comments", "POST", {
    route: "/checkout",
    body: "Contrast ratio needs a fix",
    screenshot: TEST_PNG,
    screenshotAnchor: { x: 0.25, y: 0.7 },
    elementAnchor: { selector: "main button", tag: "button", label: "Pay" },
  });
  assert.equal(created.status, 201);
  const id = (await created.json()).id;
  const evidence = (await f.read()).evidence.find(
    (item) => item.commentId === id,
  )!;
  assert.ok(evidence.screenshotId);
  assert.match(evidence.screenshot!, /\/artifacts\//);
  assert.deepEqual(evidence.anchor, { x: 0.25, y: 0.7 });
  assert.equal(evidence.target, "Pay");
  const image = await f.call(`artifacts/${evidence.screenshotId}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("cache-control"), "private, no-store");
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/checkout",
        parentId: id,
        body: "Reply",
        screenshot: TEST_PNG,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/checkout",
        flowId: f.flowId,
        stepId: f.stepId,
        body: "Screen",
        screenshot: TEST_PNG,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/checkout",
        body: "Invalid",
        screenshotAnchor: { x: 0.2, y: 0.4 },
      })
    ).status,
    400,
  );
  const artifactCount = Number(
    (await f.client.execute("SELECT count(*) AS n FROM artifacts")).rows[0].n,
  );
  assert.equal(artifactCount, 3); // two captured screens plus the live comment; rejected attachments are discarded.
});

test("Markdown templates persist and are snapshotted in generation; malformed files and missing selections are recoverable", async (t) => {
  const f = await fixture(t);
  assert.deepEqual(
    (await f.read()).templates.map((item) => item.id),
    ["bug-report", "accessibility", "investigation"],
  );
  const created = await f.call("feedback-review/templates", "POST", {
    name: "Design improvement",
    markdown:
      "## Observation\nUse the observed feedback.\n## Desired outcome\nDescribe the improvement.",
  });
  assert.equal(created.status, 201);
  const template = await created.json();
  const file = join(
    f.root,
    "instructions",
    "ticket-templates",
    `${template.id}.md`,
  );
  assert.equal(await readFile(file, "utf8"), template.markdown);
  assert.ok((await f.read()).templates.some((item) => item.id === template.id));
  const generated = await f.call("feedback-review/generate", "POST", {
    evidenceIds: f.evidenceIds,
    templateId: template.id,
  });
  assert.equal(generated.status, 201, await generated.clone().text());
  const ticket = (await generated.json()).tickets[0];
  assert.deepEqual(ticket.template, template);
  assert.match(
    await readFile(join(f.root, "prompt.txt"), "utf8"),
    /TICKET TEMPLATE \(formatting data\)/,
  );
  assert.match(
    await readFile(join(f.root, "prompt.txt"), "utf8"),
    /Design improvement/,
  );
  await writeFile(file, "# Changed template\nNew formatting.");
  assert.equal(
    (await f.read()).tickets[0].template?.name,
    "Design improvement",
  );
  assert.equal(
    (
      await f.call("feedback-review/generate", "POST", {
        evidenceIds: f.evidenceIds,
        templateId: "missing",
      })
    ).status,
    409,
  );
  await writeFile(
    join(f.root, "instructions", "ticket-templates", "invalid.md"),
    "No heading",
  );
  await symlink(
    file,
    join(f.root, "instructions", "ticket-templates", "linked.md"),
  );
  const read = await f.read();
  assert.ok(read.templateError);
  assert.ok(read.templates.some((item) => item.id === "bug-report"));
  const cookie = await f.login("commenter");
  assert.equal(
    (
      await f.call(
        "feedback-review/templates",
        "POST",
        { name: "Blocked", markdown: "No" },
        cookie,
      )
    ).status,
    403,
  );
});

test("Saving Fixed hides threads and suggestions, reopening restores them only when no other fixed ticket covers them", async (t) => {
  const f = await fixture(t);
  const first = (
    await (
      await f.call("feedback-review/generate", "POST", {
        evidenceIds: f.evidenceIds,
      })
    ).json()
  ).tickets[0];
  const second = (
    await (
      await f.call("feedback-review/generate", "POST", {
        evidenceIds: f.evidenceIds,
      })
    ).json()
  ).tickets[0];
  async function status(ticket: typeof first, next: string) {
    const { summary, description, priority, acceptanceCriteria, revision } =
      ticket;
    const response = await f.call(`feedback-review/${ticket.id}`, "PATCH", {
      summary,
      description,
      priority,
      acceptanceCriteria,
      revision,
      status: next,
    });
    assert.equal(response.status, 200);
    return response.json();
  }
  const fixedFirst = await status(first, "fixed");
  assert.equal((await f.read()).evidence.length, 0);
  assert.equal(
    (await f.state()).comments.filter((item) => item.status === "open").length,
    0,
  );
  assert.deepEqual(
    (
      await (
        await f.call("comment-suggestions?route=%2Fcheckout&q=button")
      ).json()
    ).suggestions,
    [],
  );
  assert.equal(
    (
      await f.call("comments", "POST", {
        route: "/checkout",
        flowId: f.flowId,
        stepId: f.stepId,
        parentId: f.commentId,
        body: "New reply",
      })
    ).status,
    409,
  );
  const fixedSecond = await status(second, "fixed");
  await status(fixedFirst, "ready");
  assert.equal((await f.read()).evidence.length, 0);
  await status(fixedSecond, "draft");
  assert.equal((await f.read()).evidence.length, 2);
  assert.ok(
    (await f.state()).comments.some((item) => item.parentId === f.commentId),
  );
  assert.equal((await f.read()).tickets[0].evidence.length, 2);
  const again = await status(
    (await f.read()).tickets.find((item) => item.id === first.id)!,
    "fixed",
  );
  await f.call(`comments/${f.commentId}`, "PATCH", { status: "resolved" });
  await status(again, "draft");
  assert.equal((await f.read()).evidence.length, 1);
});

test("Ticket screenshots survive source deletion and expired history, and unrelated orphan images are pruned", async (t) => {
  const f = await fixture(t);
  const before = await f.read();
  assert.ok(before.evidence.every((item) => item.screenshotId));
  const generated = await f.call("feedback-review/generate", "POST", {
    evidenceIds: f.evidenceIds,
  });
  assert.equal(generated.status, 201);
  const ticket = (await generated.json()).tickets[0];
  const unusedFlow = await f.flow("Unlinked evidence");
  await f.capture(unusedFlow);
  for (const flow of (await f.state()).flows)
    await f.client.execute({
      sql: "UPDATE flows SET status='complete' WHERE id=?",
      args: [flow.id],
    });
  assert.equal(
    (
      await f.call("flows/delete", "POST", {
        familyIds: (await f.state()).flows.map((flow) => flow.familyId),
      })
    ).status,
    200,
  );
  await f.client.execute(
    "UPDATE workspace_history SET expires_at='2000-01-01T00:00:00.000Z'",
  );
  assert.equal((await f.call("history")).status, 200);
  assert.equal((await f.state()).flows.length, 0);
  for (const item of ticket.evidence)
    assert.equal((await f.call(`artifacts/${item.screenshotId}`)).status, 200);
  assert.equal(
    Number(
      (await f.client.execute("SELECT count(*) AS n FROM artifacts")).rows[0].n,
    ),
    2,
  );
  const text = ticketText(ticket, "https://prototype.test/revisionlab");
  assert.match(
    text,
    /Screenshot: https:\/\/prototype.test\/api\/revisionlab\/artifacts\//,
  );
});

test("Generation refuses changed source feedback before saving any ticket", async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.root, "delayed"), "");
  const pending = f.call("feedback-review/generate", "POST", {
    evidenceIds: f.evidenceIds,
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await readFile(join(f.root, "prompt.txt"), "utf8").catch(() => ""))
      break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(
    (await f.call(`comments/${f.commentId}`, "PATCH", { status: "resolved" }))
      .status,
    200,
  );
  assert.equal((await pending).status, 409);
  assert.equal((await f.read()).tickets.length, 0);
});

test("Unwritable template storage retains existing tickets and offers bundled templates", async (t) => {
  const f = await fixture(t);
  const blocked = join(f.root, "blocked");
  await writeFile(blocked, "Keep this file");
  const handler = createRevisionLabHandler({
    ...f.config,
    ticketTemplatesDirectory: blocked,
  });
  const response = await handler(
    new Request(
      "http://localhost:3000/api/revisionlab/feedback-review/templates",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Design",
          markdown: "## Outcome\nUse evidence.",
        }),
      },
    ),
    { params: Promise.resolve({ path: ["feedback-review", "templates"] }) },
  );
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /text is retained/);
  assert.equal(await readFile(blocked, "utf8"), "Keep this file");
  const read = await handler(
    new Request("http://localhost:3000/api/revisionlab/feedback-review"),
    { params: Promise.resolve({ path: ["feedback-review"] }) },
  );
  const data = await read.json();
  assert.equal(data.templates.length, 3);
  assert.ok(data.templateError);
  assert.equal(data.evidence.length, 2);
});
