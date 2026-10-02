import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@libsql/client";
import { readFlows } from "./queries.js";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";
import { unavailableAccessibility } from "../accessibility.js";

const report = {
  status: "issues",
  checkedAt: "2026-09-28T12:00:00.000Z",
  engineVersion: "4.13.0",
  violationCount: 1,
  incomplete: 1,
  truncated: false,
  issues: [
    {
      id: "button-name",
      help: "Buttons must have discernible text",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/button-name",
      impact: "critical",
      count: 1,
      targets: ["html > body > main > button"],
    },
  ],
};
const passed = {
  ...report,
  status: "passed",
  issues: [],
  violationCount: 0,
  incomplete: 0,
};
const payload = (accessibility: unknown, route = "/checkout") => ({
  title: "Checkout",
  route,
  screenshot: TEST_PNG,
  capture: {
    width: 1200,
    height: 900,
    reason: "page",
    cursor: [],
    accessibility,
  },
});

test("accessibility reports remain screen-specific after reload, reuse and version creation", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  assert.equal(
    (
      await f.call(`flows/${id}/steps`, "POST", {
        ...payload(report),
        reuse: true,
      })
    ).status,
    201,
  );
  assert.equal(
    (await f.call(`flows/${id}/steps`, "POST", payload(passed, "/complete")))
      .status,
    201,
  );
  assert.equal(
    (
      await f.call(`flows/${id}/steps`, "POST", {
        ...payload(passed),
        reuse: true,
      })
    ).status,
    201,
  );
  await f.capture(id);
  const reopened = createClient({ url: f.config.databaseUrl });
  try {
    const [flow] = await readFlows(reopened, "/api/revisionlab");
    assert.equal(flow.steps.length, 3);
    assert.deepEqual(flow.steps[0].capture?.accessibility, report);
    assert.deepEqual(flow.steps[1].capture?.accessibility, passed);
    assert.equal(flow.steps[2].capture, null);
  } finally {
    reopened.close();
  }
  assert.equal(
    (await f.call(`flows/${id}`, "PATCH", { status: "complete" })).status,
    200,
  );
  assert.equal(
    (await f.call(`flows/${id}/steps`, "POST", payload(passed))).status,
    409,
  );
  const next = await f.call(`flows/${id}/versions`, "POST", {});
  assert.equal(next.status, 201);
  const nextId = (await next.json()).id;
  assert.equal(
    (await f.call(`flows/${nextId}/steps`, "POST", payload(passed))).status,
    201,
  );
  assert.deepEqual(
    (await f.state()).flows.find((flow) => flow.id === id)?.steps[0].capture
      ?.accessibility,
    report,
  );
});

test("review and unavailable reports survive without being mistaken for a pass", async (t) => {
  const f = await reviewFixture(t),
    id = await f.flow();
  const reports = [
    { ...passed, status: "review", incomplete: 2 },
    ...(["changed", "failed", "not-scanned"] as const).map(
      unavailableAccessibility,
    ),
  ];
  for (const item of reports)
    assert.equal(
      (await f.call(`flows/${id}/steps`, "POST", payload(item))).status,
      201,
    );
  assert.deepEqual(
    (await f.state()).flows[0].steps.map((step) => step.capture?.accessibility),
    reports,
  );
});

test("reports reject contradictory, unsafe, oversized and raw-HTML payloads", async (t) => {
  const f = await reviewFixture(t),
    id = await f.flow();
  const issue = report.issues[0];
  for (const invalid of [
    { ...report, status: "passed" },
    { ...passed, status: "issues" },
    { ...passed, status: "review" },
    { ...report, checkedAt: undefined },
    { ...report, engineVersion: undefined },
    { ...report, violationCount: 2 },
    { ...report, incomplete: -1 },
    { ...report, html: "<input value='secret'>" },
    { ...report, issues: [{ ...issue, html: "<button>" }] },
    { ...report, issues: [{ ...issue, impact: "catastrophic" }] },
    { ...report, issues: [{ ...issue, helpUrl: "javascript:alert(1)" }] },
    {
      ...report,
      issues: [{ ...issue, helpUrl: "https://evil.test/button-name" }],
    },
    { ...report, issues: [{ ...issue, targets: ["x".repeat(257)] }] },
    { ...report, issues: [{ ...issue, targets: Array(11).fill("button") }] },
    { ...report, issues: Array(51).fill(issue), violationCount: 51 },
    { ...unavailableAccessibility("failed"), checkedAt: report.checkedAt },
  ])
    assert.equal(
      (await f.call(`flows/${id}/steps`, "POST", payload(invalid))).status,
      400,
    );
  assert.equal((await f.state()).flows[0].steps.length, 0);
});

test("report storage retains capture authorization and deletion cleanup", async (t) => {
  const f = await reviewFixture(t),
    id = await f.flow();
  assert.equal(
    (
      await f.call(
        `flows/${id}/steps`,
        "POST",
        payload(report),
        await f.login("commenter"),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.call(
        `flows/${id}/steps`,
        "POST",
        payload(report),
        await f.login("editor"),
      )
    ).status,
    201,
  );
  await f.call(`flows/${id}`, "PATCH", { status: "complete" });
  assert.equal(
    (await f.call("flows/delete", "POST", { familyIds: [id] })).status,
    200,
  );
  assert.equal(
    (await f.client.execute("SELECT capture_json FROM steps")).rows.length,
    0,
  );
});

test("bounded reports fit beside a near-limit screenshot and oversized reports are rejected", async (t) => {
  const f = await reviewFixture(t),
    id = await f.flow();
  const bounded = {
    ...report,
    violationCount: 20,
    issues: Array.from({ length: 20 }, (_, index) => ({
      ...report.issues[0],
      id: `rule-${index}`,
      count: 10,
      targets: Array(10).fill("button".repeat(40)),
    })),
  };
  const bytes = Buffer.alloc(2_990_000);
  Buffer.from(TEST_PNG.split(",")[1], "base64").copy(bytes);
  const input = {
    ...payload(bounded),
    screenshot: `data:image/png;base64,${bytes.toString("base64")}`,
  };
  assert.ok(Buffer.byteLength(JSON.stringify(input)) > 4_020_000);
  assert.equal((await f.call(`flows/${id}/steps`, "POST", input)).status, 201);
  const oversized = {
    ...bounded,
    violationCount: 50,
    issues: Array.from({ length: 50 }, (_, index) => ({
      ...bounded.issues[0],
      id: `rule-${index}`,
    })),
  };
  assert.equal(
    (await f.call(`flows/${id}/steps`, "POST", payload(oversized))).status,
    400,
  );
});

test("saved WCAG targets remain attached to their capture when workspace defaults change", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const evidence = {
    ...report,
    standard: { wcagVersion: "2.0", wcagLevel: "AA" },
  };
  assert.equal(
    (await f.call(`flows/${id}/steps`, "POST", payload(evidence))).status,
    201,
  );
  assert.equal(
    (
      await f.call("settings", "PATCH", {
        wcagVersion: "2.2",
        wcagLevel: "AAA",
      })
    ).status,
    200,
  );
  assert.deepEqual(
    (await f.state()).flows[0].steps[0].capture?.accessibility,
    evidence,
  );
  for (const standard of [
    { wcagVersion: "3.0", wcagLevel: "AA" },
    { wcagVersion: "2.0", wcagLevel: "aaaa" },
    { wcagVersion: "2.0" },
  ]) {
    assert.equal(
      (
        await f.call(
          `flows/${id}/steps`,
          "POST",
          payload({ ...report, standard }),
        )
      ).status,
      400,
    );
  }
});
