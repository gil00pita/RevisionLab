import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import test from "node:test";
import { AI_INSTRUCTIONS_MAX_LENGTH } from "../ai-instructions.js";
import { createRevisionLabHandler } from "./route-handler.js";
import { reviewFixture } from "./review-test-fixture.js";

test("AI instructions start empty and preserve Markdown on disk and through a new handler", async (t) => {
  const f = await reviewFixture(t);
  const before = await f.state();
  const initial = await f.call("settings/ai");
  assert.equal(initial.status, 200);
  assert.deepEqual(await initial.json(), {
    instructions: "",
    filePath: f.config.aiInstructionsFile,
  });
  const instructions =
    "# Project guidance\n\n- Keep accessible controls.\n- Preserve café ☕.\n\n```tsx\nconst x = 1;\n```\n";
  assert.equal(
    (await f.call("settings/ai", "PATCH", { instructions })).status,
    200,
  );
  assert.equal(
    await readFile(f.config.aiInstructionsFile, "utf8"),
    instructions,
  );
  const reopened = await createRevisionLabHandler(f.config)(
    new Request("http://127.0.0.1:3000/api/revisionlab/settings/ai"),
    { params: Promise.resolve({ path: ["settings", "ai"] }) },
  );
  assert.equal((await reopened.json()).instructions, instructions);
  await writeFile(f.config.aiInstructionsFile, "# Edited outside the app\n");
  assert.equal(
    (await (await f.call("settings/ai")).json()).instructions,
    "# Edited outside the app\n",
  );
  assert.equal(
    (await f.call("settings/ai", "PATCH", { instructions: "" })).status,
    200,
  );
  assert.equal(await readFile(f.config.aiInstructionsFile, "utf8"), "");
  assert.deepEqual(await readdir(dirname(f.config.aiInstructionsFile)), [
    "ai-instructions.md",
  ]);
  assert.deepEqual(await f.state(), before);
});

test("AI instructions reject unauthorized and cross-origin writes without changing the file", async (t) => {
  const f = await reviewFixture(t);
  const editor = await f.login("editor");
  const commenter = await f.login("commenter");
  assert.equal(
    (
      await f.call(
        "settings/ai",
        "PATCH",
        { instructions: "Keep this." },
        editor,
      )
    ).status,
    200,
  );
  const read = await f.call("settings/ai", "GET", undefined, commenter);
  assert.equal(read.status, 200);
  assert.equal((await read.json()).instructions, "Keep this.");
  assert.equal(
    (
      await f.call(
        "settings/ai",
        "PATCH",
        { instructions: "Overwrite" },
        commenter,
      )
    ).status,
    403,
  );
  const handler = createRevisionLabHandler(f.config);
  const forged = await handler(
    new Request("http://127.0.0.1:3000/api/revisionlab/settings/ai", {
      method: "PATCH",
      headers: {
        Origin: "https://external.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ instructions: "Overwrite" }),
    }),
    { params: Promise.resolve({ path: ["settings", "ai"] }) },
  );
  assert.equal(forged.status, 403);
  const anonymous = await handler(
    new Request("https://host.example/api/revisionlab/settings/ai"),
    {
      params: Promise.resolve({ path: ["settings", "ai"] }),
    },
  );
  assert.equal(anonymous.status, 401);
  assert.equal(
    await readFile(f.config.aiInstructionsFile, "utf8"),
    "Keep this.",
  );
});

test("AI instructions validate content, size, route, and reject client-controlled paths", async (t) => {
  const f = await reviewFixture(t);
  const instructions = "a".repeat(AI_INSTRUCTIONS_MAX_LENGTH);
  assert.equal(
    (await f.call("settings/ai", "PATCH", { instructions })).status,
    200,
  );
  for (const input of [
    null,
    {},
    { instructions: 1 },
    { instructions: null },
    { instructions: "a".repeat(AI_INSTRUCTIONS_MAX_LENGTH + 1) },
    { instructions: "Overwrite", filePath: "../../AGENTS.md" },
  ]) {
    assert.equal((await f.call("settings/ai", "PATCH", input)).status, 400);
  }
  assert.equal(
    (
      await f.call("settings/ai", "PATCH", {
        instructions: "a".repeat(200_000),
      })
    ).status,
    413,
  );
  assert.equal(
    (await f.call("settings/ai", "POST", { instructions: "Overwrite" })).status,
    404,
  );
  assert.equal(
    (await f.call("settings/ai/extra", "PATCH", { instructions: "Overwrite" }))
      .status,
    404,
  );
  assert.equal(
    await readFile(f.config.aiInstructionsFile, "utf8"),
    instructions,
  );
});

test("filesystem failures are explicit, leave no temporary files, and allow retry", async (t) => {
  const f = await reviewFixture(t);
  // A directory at the destination deterministically makes reads and rename fail.
  await mkdir(f.config.aiInstructionsFile, { recursive: true });
  await writeFile(`${f.config.aiInstructionsFile}/keep.txt`, "Unrelated data");
  assert.equal((await f.call("settings/ai")).status, 503);
  const response = await f.call("settings/ai", "PATCH", {
    instructions: "New draft",
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Could not save/);
  assert.equal(
    await readFile(`${f.config.aiInstructionsFile}/keep.txt`, "utf8"),
    "Unrelated data",
  );
  assert.deepEqual(await readdir(dirname(f.config.aiInstructionsFile)), [
    "ai-instructions.md",
  ]);
});
