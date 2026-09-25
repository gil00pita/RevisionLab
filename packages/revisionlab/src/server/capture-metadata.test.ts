import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@libsql/client";
import { readFlows } from "./queries.js";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";

const capture = {
  width: 1440,
  height: 900,
  reason: "click",
  cursor: [
    { x: 0.1, y: 0.2, t: 100 },
    { x: 0.2, y: 0.3, t: 200, click: 1 },
  ],
};
const step = {
  title: "After clicking",
  route: "/checkout",
  screenshot: TEST_PNG,
  capture,
};

test("cursor evidence persists per screenshot and survives reopening and version creation", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  assert.equal((await f.call(`flows/${id}/steps`, "POST", step)).status, 201);
  await f.capture(id);
  const stored = (await f.state()).flows[0];
  assert.deepEqual(stored.steps[0].capture, capture);
  assert.equal(stored.steps[1].capture, null);
  const reopened = createClient({ url: f.config.databaseUrl });
  try {
    assert.deepEqual(
      (await readFlows(reopened, "/api/revisionlab"))[0].steps[0].capture,
      capture,
    );
  } finally {
    reopened.close();
  }
  assert.equal(
    (await f.call(`flows/${id}`, "PATCH", { status: "complete" })).status,
    200,
  );
  assert.equal((await f.call(`flows/${id}/steps`, "POST", step)).status, 409);
  assert.equal((await f.call(`flows/${id}/versions`, "POST", {})).status, 201);
  assert.deepEqual(
    (await f.state()).flows.find((flow) => flow.id === id)?.steps[0].capture,
    capture,
  );
});

test("cursor evidence rejects unbounded, nonchronological, and value-bearing payloads", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  for (const invalid of [
    { ...capture, width: 0 },
    { ...capture, height: 4001 },
    { ...capture, reason: "keypress" },
    { ...capture, cursor: [{ x: 2, y: 0, t: 0 }] },
    { ...capture, cursor: [{ x: 0, y: 0, t: -1 }] },
    { ...capture, cursor: [{ x: 0, y: 0, t: 0, click: 0 }] },
    { ...capture, cursor: [{ x: 0, y: 0, t: 0, value: "private" }] },
    { ...capture, cursor: [...capture.cursor].reverse() },
    {
      ...capture,
      cursor: Array.from({ length: 201 }, () => ({ x: 0, y: 0, t: 0 })),
    },
  ])
    assert.equal(
      (await f.call(`flows/${id}/steps`, "POST", { ...step, capture: invalid }))
        .status,
      400,
    );
  assert.equal((await f.state()).flows[0].steps.length, 0);
});

test("cursor capture retains editor permissions and draft discard cleanup", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  assert.equal(
    (
      await f.call(
        `flows/${id}/steps`,
        "POST",
        step,
        await f.login("commenter"),
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.call(`flows/${id}/steps`, "POST", step, await f.login("editor")))
      .status,
    201,
  );
  assert.equal((await f.call(`flows/${id}/discard`, "POST", {})).status, 200);
  assert.equal((await f.state()).flows.length, 0);
});
