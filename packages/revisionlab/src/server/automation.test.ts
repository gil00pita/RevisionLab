import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import { feedbackContext, jiraDraft } from "../review-automation.js";
import { createRevisionLabHandler } from "./route-handler.js";
import { reviewFixture } from "./review-test-fixture.js";
import { prepareChanges, replaceSources } from "./automation/source-files.js";
import { createFixPullRequest } from "./automation/pull-request.js";
import { readProposal } from "./automation/proposals.js";

async function fixture(t: TestContext) {
  const f = await reviewFixture(t);
  const root = await realpath(f.config.aiProjectDirectory);
  const bin = join(root, "bin");
  await mkdir(bin);
  await writeFile(join(root, "screen.tsx"), 'export const label = "Before";\n');
  execFileSync("git", ["init", "-b", "main"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["add", "screen.tsx"], { cwd: root });
  execFileSync(
    "git",
    [
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.test",
      "commit",
      "-m",
      "fixture",
    ],
    { cwd: root, stdio: "ignore" },
  );
  await f.call("settings/ai", "PATCH", {
    instructions: "Prefer accessible Chakra controls.",
  });
  const fakeResult = {
    summary: "Improve the label",
    warnings: ["Run project checks."],
    changes: [{ file: "screen.tsx", before: '"Before"', after: '"After"' }],
  };
  await writeFile(join(root, "result.json"), JSON.stringify(fakeResult));
  await writeFile(
    join(bin, "codex"),
    `#!${process.execPath}
const fs = require('node:fs');
let prompt = ''; process.stdin.on('data', c => prompt += c); process.stdin.on('end', () => {
fs.writeFileSync('prompt.txt', prompt); fs.writeFileSync('args.json', JSON.stringify(process.argv.slice(2)));
if (fs.existsSync('fail')) process.exit(1);
if (fs.existsSync('slow')) return setTimeout(() => {}, 60000);
fs.copyFileSync('result.json', process.argv[process.argv.indexOf('--output-last-message') + 1]);
});`,
    { mode: 0o755 },
  );
  const previous = process.env.PATH;
  process.env.PATH = `${bin}:${previous}`;
  t.after(() => {
    process.env.PATH = previous;
  });
  const flowId = await f.flow();
  const stepId = await f.capture(flowId);
  const comment = await f.call("comments", "POST", {
    flowId,
    stepId,
    route: "/checkout",
    body: "The button label is unclear.",
    anchor: { x: 0.25, y: 0.5 },
  });
  assert.equal(comment.status, 201);
  const commentId = String((await comment.json()).id);
  const input = { flowId, stepId, target: { kind: "comment", commentId } };
  return { ...f, root, bin, input, fakeResult };
}

test("local Codex proposes without editing, includes instructions, applies and undoes exact changes", async (t) => {
  const f = await fixture(t);
  const before = await f.state();
  const response = await f.call("ai/fixes", "POST", f.input);
  assert.equal(response.status, 201, await response.clone().text());
  const proposal = await response.json();
  assert.equal(proposal.status, "proposed");
  assert.equal(
    await readFile(join(f.root, "screen.tsx"), "utf8"),
    'export const label = "Before";\n',
  );
  assert.match(
    await readFile(join(f.root, "prompt.txt"), "utf8"),
    /Prefer accessible Chakra controls/,
  );
  const args = JSON.parse(await readFile(join(f.root, "args.json"), "utf8"));
  assert.equal(args[args.indexOf("--sandbox") + 1], "read-only");
  assert.equal(
    (await f.call(`ai/fixes/${proposal.id}`, "PATCH", { action: "apply" }))
      .status,
    200,
  );
  assert.match(await readFile(join(f.root, "screen.tsx"), "utf8"), /After/);
  assert.equal(
    (await f.call(`ai/fixes/${proposal.id}`, "PATCH", { action: "apply" }))
      .status,
    409,
  );
  assert.equal(
    (await f.call(`ai/fixes/${proposal.id}`, "PATCH", { action: "undo" }))
      .status,
    200,
  );
  assert.match(await readFile(join(f.root, "screen.tsx"), "utf8"), /Before/);
  assert.deepEqual(await f.state(), before);
});

test("stale local edits block apply/undo; discard cannot subsequently apply", async (t) => {
  const f = await fixture(t);
  const proposal = await (await f.call("ai/fixes", "POST", f.input)).json();
  await writeFile(
    join(f.root, "screen.tsx"),
    'export const label = "My edits";\n',
  );
  assert.equal(
    (await f.call(`ai/fixes/${proposal.id}`, "PATCH", { action: "apply" }))
      .status,
    409,
  );
  assert.match(await readFile(join(f.root, "screen.tsx"), "utf8"), /My edits/);
  assert.equal(
    (await f.call(`ai/fixes/${proposal.id}`, "PATCH", { action: "discard" }))
      .status,
    200,
  );
  assert.equal(
    (await f.call(`ai/fixes/${proposal.id}`, "PATCH", { action: "apply" }))
      .status,
    409,
  );
});

test("Codex rejects foreign screen targets, commenter writes, and nonlocal execution", async (t) => {
  const f = await fixture(t);
  const commenter = await f.login("commenter");
  assert.equal(
    (await f.call("ai/fixes", "POST", f.input, commenter)).status,
    403,
  );
  const otherFlow = await f.flow();
  const otherStep = await f.capture(otherFlow);
  assert.equal(
    (await f.call("ai/fixes", "POST", { ...f.input, stepId: otherStep }))
      .status,
    404,
  );
  assert.equal(
    (
      await f.call("ai/fixes", "POST", {
        ...f.input,
        flowId: otherFlow,
        stepId: otherStep,
      })
    ).status,
    400,
  );
  const handler = createRevisionLabHandler(f.config);
  const request = (headers = {}) =>
    new Request("http://127.0.0.1:3000/api/revisionlab/ai/fixes", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(f.input),
    });
  assert.equal(
    (
      await handler(request({ Origin: "https://elsewhere.test" }), {
        params: Promise.resolve({ path: ["ai", "fixes"] }),
      })
    ).status,
    403,
  );
  process.env.NODE_ENV = "production";
  assert.equal(
    (
      await handler(request(), {
        params: Promise.resolve({ path: ["ai", "fixes"] }),
      })
    ).status,
    401,
  );
});

test("malformed and failed Codex output does not modify sources", async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.root, "result.json"), "not json");
  assert.equal((await f.call("ai/fixes", "POST", f.input)).status, 503);
  await writeFile(join(f.root, "fail"), "");
  assert.equal((await f.call("ai/fixes", "POST", f.input)).status, 503);
  assert.match(await readFile(join(f.root, "screen.tsx"), "utf8"), /Before/);
});

test("source validation rejects traversal, symlinks, ignored files, ambiguous edits, and syntax errors", async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.root, ".gitignore"), "ignored.tsx\n");
  await writeFile(join(f.root, "ignored.tsx"), '"Before"');
  await symlink(join(f.root, "screen.tsx"), join(f.root, "link.tsx"));
  for (const change of [
    { file: "../screen.tsx", before: '"Before"', after: '"After"' },
    { file: "link.tsx", before: '"Before"', after: '"After"' },
    { file: "ignored.tsx", before: '"Before"', after: '"After"' },
    { file: "screen.tsx", before: "not present", after: "new" },
    { file: "screen.tsx", before: '"Before"', after: '"unterminated' },
  ])
    await assert.rejects(prepareChanges(f.root, [change]));
  const sources = await prepareChanges(f.root, f.fakeResult.changes);
  await replaceSources(f.root, sources, false);
  await writeFile(join(f.root, "screen.tsx"), "// user's newer work\n");
  await assert.rejects(replaceSources(f.root, sources, true));
  assert.equal(
    await readFile(join(f.root, "screen.tsx"), "utf8"),
    "// user's newer work\n",
  );
});

test("Jira drafts scope feedback, retain evidence, and describe verification without claiming a fix", async (t) => {
  const f = await fixture(t);
  const state = await f.state();
  const flow = state.flows[0];
  const context = feedbackContext(flow, flow.steps[0], state.comments, {
    kind: "comment",
    commentId: f.input.target.commentId,
  });
  const draft = jiraDraft(context, "http://localhost/revisionlab?screen=test");
  assert.match(draft.description, /25%, 50%/);
  assert.match(draft.description, /button label is unclear/);
  assert.match(draft.description, /Acceptance criteria/);
  assert.match(draft.description, /verify the current implementation/);
  assert.ok(draft.summary.length <= 255);
});

test("draft PR uses an isolated checkout and pushes only the reviewed change", async (t) => {
  const f = await fixture(t);
  const remote = join(f.root, "remote.git");
  execFileSync("git", ["init", "--bare", remote], { stdio: "ignore" });
  execFileSync("git", ["remote", "add", "origin", remote], { cwd: f.root });
  execFileSync("git", ["push", "origin", "main"], {
    cwd: f.root,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: f.root });
  execFileSync("git", ["config", "user.email", "test@example.test"], {
    cwd: f.root,
  });
  await writeFile(
    join(f.bin, "gh"),
    `#!${process.execPath}
const args = process.argv.slice(2);
if(args[0] === 'repo') console.log('main');
if(args[0] === 'pr' && args[1] === 'create') console.log('https://github.com/example/project/pull/1');
`,
    { mode: 0o755 },
  );
  const proposal = await (await f.call("ai/fixes", "POST", f.input)).json();
  const stored = await readProposal(f.root, proposal.id, f.config.projectId);
  await writeFile(join(f.root, "unrelated.txt"), "Keep my work");
  const url = await createFixPullRequest(f.root, stored);
  assert.equal(url, "https://github.com/example/project/pull/1");
  assert.equal(
    execFileSync("git", ["branch", "--show-current"], {
      cwd: f.root,
      encoding: "utf8",
    }).trim(),
    "main",
  );
  assert.match(await readFile(join(f.root, "screen.tsx"), "utf8"), /Before/);
  assert.equal(
    await readFile(join(f.root, "unrelated.txt"), "utf8"),
    "Keep my work",
  );
  assert.match(
    execFileSync(
      "git",
      [
        "--git-dir",
        remote,
        "show",
        `revisionlab/fix-${proposal.id}:screen.tsx`,
      ],
      { encoding: "utf8" },
    ),
    /After/,
  );
});

test("cancelling Codex stops the child, releases the project lock, and leaves source intact", async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.root, "slow"), "");
  const controller = new AbortController();
  const pending = createRevisionLabHandler(f.config)(
    new Request("http://127.0.0.1:3000/api/revisionlab/ai/fixes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f.input),
      signal: controller.signal,
    }),
    { params: Promise.resolve({ path: ["ai", "fixes"] }) },
  );
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await readFile(join(f.root, "prompt.txt"), "utf8").catch(() => ""))
      break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal((await f.call("ai/fixes", "POST", f.input)).status, 409);
  controller.abort();
  assert.equal((await pending).status, 503);
  await rm(join(f.root, "slow"));
  assert.equal((await f.call("ai/fixes", "POST", f.input)).status, 201);
  assert.match(await readFile(join(f.root, "screen.tsx"), "utf8"), /Before/);
});

test("accessibility tickets include the selected rule only and a screen run excludes resolved threads", async (t) => {
  const f = await fixture(t);
  const state = await f.state();
  const flow = state.flows[0];
  const step = flow.steps[0];
  const issue = {
    id: "button-name",
    help: "Buttons must have discernible text",
    helpUrl: "https://example.test/button-name",
    impact: "critical" as const,
    count: 1,
    targets: ["main > button"],
  };
  step.capture = {
    width: 800,
    height: 600,
    reason: "page",
    cursor: [],
    accessibility: {
      status: "issues",
      violationCount: 2,
      incomplete: 0,
      truncated: false,
      issues: [issue, { ...issue, id: "color-contrast" }],
    },
  };
  const selected = feedbackContext(flow, step, state.comments, {
    kind: "accessibility",
    issueId: "button-name",
  });
  assert.equal(selected.comments.length, 0);
  assert.equal(selected.issues.length, 1);
  const ticket = jiraDraft(selected, "http://localhost/revisionlab");
  assert.match(ticket.description, /main > button/);
  assert.match(ticket.description, /critical/);
  assert.doesNotMatch(ticket.description, /color-contrast/);
  state.comments[0].status = "resolved";
  assert.equal(
    feedbackContext(flow, step, state.comments, { kind: "screen" }).comments
      .length,
    0,
  );
});

test("Codex composes file guidance with the enabled design system and respects disabling and empty files", async (t) => {
  const f = await fixture(t);
  const ai = {
    ...(await f.state()).settings.ai,
    instructions: "Stale database fallback",
    designSystemEnabled: true,
    designSystemId: "chakra",
    installSkill: true,
  };
  assert.equal((await f.call("settings", "PATCH", { ai })).status, 200);
  assert.equal((await f.call("ai/fixes", "POST", f.input)).status, 201);
  let prompt = await readFile(join(f.root, "prompt.txt"), "utf8");
  assert.match(prompt, /Prefer accessible Chakra controls/);
  assert.match(prompt, /https:\/\/chakra-ui.com\/docs/);
  assert.match(prompt, /Install the AI skill/);
  assert.doesNotMatch(prompt, /Stale database fallback/);
  assert.equal(
    (
      await f.call("settings", "PATCH", {
        ai: { ...ai, designSystemEnabled: false },
      })
    ).status,
    200,
  );
  assert.equal(
    (await f.call("settings/ai", "PATCH", { instructions: "" })).status,
    200,
  );
  assert.equal((await f.call("ai/fixes", "POST", f.input)).status, 201);
  prompt = await readFile(join(f.root, "prompt.txt"), "utf8");
  assert.doesNotMatch(
    prompt,
    /# DESIGN SYSTEM|Stale database fallback|Prefer accessible Chakra controls/,
  );
});
