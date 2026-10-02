import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";
import { defaultAiSettings } from "../ai-instructions/index.js";
import { reviewFixture } from "./review-test-fixture.js";

test("workspace history restores deletions with screenshots and can undo the restore", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow("Recoverable checkout");
  const stepId = await f.capture(flowId);
  const screenshot = (await f.state()).flows[0].steps[0].screenshot!;
  assert.equal(
    (
      await f.call("comments", "POST", {
        flowId,
        stepId,
        route: "/checkout",
        body: "Keep this feedback",
      })
    ).status,
    201,
  );
  assert.equal(
    (await f.call(`flows/${flowId}`, "PATCH", { status: "complete" })).status,
    200,
  );
  assert.equal(
    (await f.call("flows/delete", "POST", { familyIds: [flowId] })).status,
    200,
  );
  assert.equal((await f.state()).flows.length, 0);
  assert.equal(
    (await f.call(screenshot.replace("/api/revisionlab/", ""))).status,
    404,
  );
  assert.equal((await readdir(f.config.artifactsDirectory)).length, 1);

  const listed = await f.call("history");
  assert.equal(listed.status, 200);
  const body = await listed.json();
  assert.ok(!JSON.stringify(body).includes("snapshot_json"));
  const deletion = body.history.find(
    (entry: { action: string }) => entry.action === "Deleted flows",
  );
  assert.ok(deletion);
  assert.match(deletion.actorName, /Local owner/);
  assert.ok(new Date(deletion.expiresAt) > new Date(deletion.createdAt));

  const commenter = await f.login("commenter");
  assert.equal(
    (await f.call(`history/${deletion.id}/restore`, "POST", {}, commenter))
      .status,
    403,
  );
  assert.equal(
    (await f.call(`history/${deletion.id}/restore`, "POST", {})).status,
    200,
  );
  const restored = await f.state();
  assert.equal(restored.flows[0].name, "Recoverable checkout");
  assert.equal(restored.comments[0].body, "Keep this feedback");
  assert.equal(
    (await f.call(screenshot.replace("/api/revisionlab/", ""))).status,
    200,
  );

  const afterRestore = await (await f.call("history")).json();
  const restore = afterRestore.history[0];
  assert.match(restore.action, /Restored workspace/);
  assert.equal(
    (await f.call(`history/${restore.id}/restore`, "POST", {})).status,
    200,
  );
  assert.equal((await f.state()).flows.length, 0);
});

test("failed changes create no version and expired history releases private artifacts", async (t) => {
  const f = await reviewFixture(t);
  const flowId = await f.flow();
  await f.capture(flowId);
  await f.call(`flows/${flowId}`, "PATCH", { status: "complete" });
  await f.call("flows/delete", "POST", { familyIds: [flowId] });
  const count = Number(
    (await f.client.execute("SELECT COUNT(*) AS count FROM workspace_history"))
      .rows[0].count,
  );
  assert.equal(
    (await f.call("flows/delete", "POST", { familyIds: [flowId] })).status,
    200,
  );
  assert.equal(
    Number(
      (
        await f.client.execute(
          "SELECT COUNT(*) AS count FROM workspace_history",
        )
      ).rows[0].count,
    ),
    count,
  );
  assert.equal(
    (await f.call("settings", "PATCH", { widgetOffset: -1 })).status,
    400,
  );
  assert.equal(
    Number(
      (
        await f.client.execute(
          "SELECT COUNT(*) AS count FROM workspace_history",
        )
      ).rows[0].count,
    ),
    count,
  );
  await f.client.execute(
    "UPDATE workspace_history SET expires_at = '2000-01-01T00:00:00.000Z'",
  );
  assert.equal((await f.call("history")).status, 200);
  assert.equal(
    Number(
      (
        await f.client.execute(
          "SELECT COUNT(*) AS count FROM workspace_history",
        )
      ).rows[0].count,
    ),
    0,
  );
  assert.deepEqual(await readdir(f.config.artifactsDirectory), []);
});

test("history covers settings, personas, comments, and point-in-time later changes", async (t) => {
  const f = await reviewFixture(t);
  assert.equal(
    (await f.call("settings", "PATCH", { widgetColor: "purple" })).status,
    200,
  );
  assert.equal(
    (
      await f.call("personas", "POST", {
        name: "Subscriber",
        description: "A paying customer",
      })
    ).status,
    201,
  );
  const comment = await f.call("comments", "POST", {
    route: "/pricing",
    body: "Clarify the annual price",
  });
  const commentId = (await comment.json()).id;
  assert.equal(
    (
      await f.call(`comments/${commentId}`, "PATCH", {
        status: "resolved",
      })
    ).status,
    200,
  );
  const history = (await (await f.call("history")).json()).history as {
    id: string;
    action: string;
  }[];
  assert.deepEqual(
    new Set(history.map((entry) => entry.action)),
    new Set([
      "Changed workspace settings",
      "Added a persona",
      "Added a comment",
      "Changed a comment",
    ]),
  );
  const resolution = history.find(
    (entry) => entry.action === "Changed a comment",
  )!;
  assert.equal(
    (await f.call(`history/${resolution.id}/restore`, "POST", {})).status,
    200,
  );
  assert.equal((await f.state()).comments[0].status, "open");

  const settings = history.find(
    (entry) => entry.action === "Changed workspace settings",
  )!;
  assert.equal(
    (await f.call(`history/${settings.id}/restore`, "POST", {})).status,
    200,
  );
  const restored = await f.state();
  assert.equal(restored.settings.widgetColor, "blue");
  assert.deepEqual(restored.personas, []);
  assert.deepEqual(restored.comments, []);
});

test("history restores design-system choices and accepts snapshots predating AI settings", async (t) => {
  const f = await reviewFixture(t);
  const ai = {
    ...defaultAiSettings,
    designSystemEnabled: true,
    designSystemId: "govuk-chakra",
  };
  await f.call("settings", "PATCH", { ai });
  await f.call("settings/ai", "PATCH", {
    instructions: "File stays authoritative",
  });
  await f.call("settings", "PATCH", {
    ai: { ...ai, designSystemEnabled: false },
  });
  const history = (await (await f.call("history")).json()).history;
  const change = history[0];
  assert.equal(
    (await f.call(`history/${change.id}/restore`, "POST", {})).status,
    200,
  );
  assert.deepEqual((await f.state()).settings.ai, ai);
  assert.equal(
    (await (await f.call("settings/ai")).json()).instructions,
    "File stays authoritative",
  );
  const row = (
    await f.client.execute({
      sql: "SELECT snapshot_json FROM workspace_history WHERE id = ?",
      args: [change.id],
    })
  ).rows[0];
  const snapshot = JSON.parse(String(row.snapshot_json));
  delete snapshot.workspace_settings[0].ai_instructions_json;
  await f.client.execute({
    sql: "UPDATE workspace_history SET snapshot_json = ? WHERE id = ?",
    args: [JSON.stringify(snapshot), change.id],
  });
  assert.equal(
    (await f.call(`history/${change.id}/restore`, "POST", {})).status,
    200,
  );
  assert.deepEqual((await f.state()).settings.ai, defaultAiSettings);
  assert.equal(
    (await (await f.call("settings/ai")).json()).instructions,
    "File stays authoritative",
  );
});
