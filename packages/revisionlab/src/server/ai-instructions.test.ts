import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import {
  composeAiInstructions,
  defaultAiSettings,
  designSystems,
} from "../ai-instructions/index.js";
import { reviewFixture } from "./review-test-fixture.js";
import { getDatabase } from "./database.js";
import { readSettings } from "./settings.js";

const selected = {
  ...defaultAiSettings,
  designSystemEnabled: true,
  designSystemId: "govuk-chakra",
  installSkill: true,
};

test("fresh installs prefill the complete review prompt; saved edits and empty text survive restart", async (t) => {
  const f = await reviewFixture(t);
  assert.equal(
    (await f.state()).settings.ai.instructions,
    defaultAiSettings.instructions,
  );
  // Digest of the complete user-supplied attachment, including whitespace.
  assert.equal(
    createHash("sha256").update(defaultAiSettings.instructions).digest("hex"),
    "5ecfeef7cdf91a0fb2aa495ef08cec80625432714fbf68ad8cf48dfcf414cb90",
  );
  assert.ok(defaultAiSettings.instructions.startsWith("# ROLE\n"));
  assert.ok(defaultAiSettings.instructions.includes("# 7. FINAL PRODUCT READ"));
  assert.ok(
    defaultAiSettings.instructions.endsWith(
      "* Stay in senior reviewer mode during follow-up questions.\n",
    ),
  );
  assert.equal(
    (await f.call("settings", "PATCH", { ai: selected })).status,
    200,
  );
  const second = await getDatabase({
    ...f.config,
    databaseAuthToken: "ai-restart",
  });
  try {
    assert.deepEqual((await readSettings(second)).ai, selected);
  } finally {
    second.close();
  }
  assert.equal(
    (
      await f.call("settings", "PATCH", {
        ai: { ...selected, instructions: "" },
      })
    ).status,
    200,
  );
  assert.equal((await f.state()).settings.ai.instructions, "");
  await f.call("settings", "PATCH", { commentBubbleColor: "teal" });
  assert.equal((await f.state()).settings.ai.instructions, "");
});

test("disabled design systems leave base text exact and never duplicate appended resources", () => {
  const base = "Custom base instructions\n";
  assert.equal(
    composeAiInstructions({
      ...selected,
      instructions: base,
      designSystemEnabled: false,
    }),
    base,
  );
  const prompt = composeAiInstructions({ ...selected, instructions: base });
  assert.ok(prompt.startsWith(base));
  assert.ok(prompt.includes("DESIGN.md"));
  assert.ok(prompt.includes("Install the AI skill"));
  assert.equal(prompt.split("# DESIGN SYSTEM").length, 2);
  assert.equal(
    composeAiInstructions({ ...selected, instructions: base }),
    prompt,
  );
  const switched = composeAiInstructions({
    ...selected,
    designSystemId: "radix",
    configureMcp: true,
  });
  assert.ok(switched.includes("Radix UI Primitives"));
  assert.ok(!switched.includes("Install the AI skill"));
  assert.ok(!switched.includes("Configure the MCP"));
  assert.ok(!switched.includes("govuk-chakra"));
});

test("every supplied framework has resources and manual systems append optional setup only when requested", () => {
  assert.equal(designSystems.length, 18);
  assert.equal(new Set(designSystems.map((system) => system.id)).size, 18);
  for (const system of designSystems) {
    const prompt = composeAiInstructions({
      ...defaultAiSettings,
      designSystemEnabled: true,
      designSystemId: system.id,
    });
    assert.ok(prompt.includes(system.githubUrl));
    assert.ok(prompt.includes(system.docsUrl));
    for (const url of [system.designUrl, system.skillUrl, system.mcpUrl].filter(
      Boolean,
    ))
      assert.ok(prompt.includes(url));
    assert.ok(!prompt.includes("Install the AI skill"));
    assert.ok(!prompt.includes("Configure the MCP"));
  }
  const manual = {
    ...selected,
    designSystemId: "manual",
    configureMcp: true,
    manual: {
      name: "Our system",
      githubUrl: "",
      docsUrl: "https://example.com/docs",
      designUrl: "",
      skillUrl: "https://example.com/skill",
      mcpUrl: "https://example.com/mcp",
    },
  };
  const prompt = composeAiInstructions(manual);
  assert.ok(prompt.includes("Use Our system"));
  assert.ok(prompt.includes("Install the AI skill"));
  assert.ok(prompt.includes("Configure the MCP"));
  assert.ok(!prompt.includes("GitHub:"));
});

test("AI settings reject malformed and unsafe resources, preserve unrelated settings, and enforce roles", async (t) => {
  const f = await reviewFixture(t);
  for (const patch of [
    { ...selected, designSystemId: "unknown" },
    { ...selected, designSystemId: "" },
    { ...selected, instructions: "a".repeat(32_001) },
    { ...selected, installSkill: "true" },
    { ...selected, designSystemId: "manual" },
    ...[
      "javascript:alert(1)",
      "file:///etc/passwd",
      "https://user:secret@example.com",
      "bad-url",
    ].map((docsUrl) => ({
      ...selected,
      manual: { ...selected.manual, docsUrl },
    })),
  ])
    assert.equal(
      (await f.call("settings", "PATCH", { ai: patch })).status,
      400,
    );
  const editor = await f.login("editor");
  const commenter = await f.login("commenter");
  assert.equal(
    (await f.call("settings", "PATCH", { ai: selected }, commenter)).status,
    403,
  );
  const results = await Promise.all([
    f.call("settings", "PATCH", { ai: selected }, editor),
    f.call("settings", "PATCH", { commentBubbleColor: "pink" }),
  ]);
  assert.ok(results.every((result) => result.status === 200));
  const state = await (
    await f.call("state", "GET", undefined, commenter)
  ).json();
  assert.equal(state.settings.commentBubbleColor, "pink");
  assert.deepEqual(state.settings.ai, selected);
  assert.equal(
    (
      await f.call("settings", "PATCH", {
        ai: { ...selected, designSystemEnabled: false },
      })
    ).status,
    200,
  );
  assert.equal((await f.state()).settings.ai.designSystemId, "govuk-chakra");
});

test("legacy settings rows get the default instructions without changing comment preferences", async (t) => {
  const f = await reviewFixture(t);
  await f.client.execute(
    "INSERT INTO workspace_settings (id, show_comment_bubbles, comment_bubble_color) VALUES (1, 0, 'purple')",
  );
  await f.client.execute(
    "ALTER TABLE workspace_settings DROP COLUMN ai_instructions_json",
  );
  const migrated = await getDatabase({
    ...f.config,
    databaseAuthToken: "legacy-ai-migration",
  });
  const settings = await readSettings(migrated);
  migrated.close();
  assert.deepEqual(settings.ai, defaultAiSettings);
  assert.equal(settings.showCommentBubbles, false);
  assert.equal(settings.commentBubbleColor, "purple");
});
