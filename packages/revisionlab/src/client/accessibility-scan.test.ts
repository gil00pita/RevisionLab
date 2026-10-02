import assert from "node:assert/strict";
import test from "node:test";
import type { AxeResults } from "axe-core";
import { MAX_ACCESSIBILITY_REPORT_BYTES } from "../accessibility.js";
import { summarizeAccessibility } from "./accessibility-scan.js";

test("saved reports bound rules, targets and bytes without retaining HTML or values", () => {
  const scan = {
    testEngine: { version: "4.13.0" },
    incomplete: [],
    violations: Array.from({ length: 100 }, (_, index) => ({
      id: `rule-${index}`,
      help: "Accessible name required",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/button-name",
      impact: "serious",
      nodes: Array.from({ length: 20 }, () => ({
        html: '<button value="private-value">',
        target: ["#private-value"],
        element: {
          localName: "long-custom-element-".repeat(20),
          parentElement: null,
        },
      })),
    })),
  } as unknown as AxeResults;
  const report = summarizeAccessibility(scan);
  assert.equal(report.status, "issues");
  assert.equal(report.violationCount, 100);
  assert.equal(report.truncated, true);
  assert.ok(report.issues.length > 0 && report.issues.length <= 50);
  assert.ok(
    report.issues.every(
      (issue) => issue.targets.length <= 10 && issue.count === 20,
    ),
  );
  assert.ok(
    Buffer.byteLength(JSON.stringify(report)) <= MAX_ACCESSIBILITY_REPORT_BYTES,
  );
  assert.doesNotMatch(JSON.stringify(report), /private-value|<button|"html"/);
  assert.equal(scan.violations.length, 100);
});

test("saved results distinguish clean scans from incomplete manual checks", () => {
  const scan = {
    testEngine: { version: "4.13.0" },
    violations: [],
    incomplete: [],
  } as unknown as AxeResults;
  assert.equal(summarizeAccessibility(scan).status, "passed");
  const review = summarizeAccessibility({
    ...scan,
    incomplete: [{}],
  } as AxeResults);
  assert.equal(review.status, "review");
  assert.equal(review.incomplete, 1);
  assert.equal(review.violationCount, 0);
});

test("WCAG rule sets include lower levels and earlier versions without later-version or AAA leakage", async () => {
  const { wcagTags, wcagVersions, wcagLevels } = await import(
    "../wcag-settings.js"
  );
  const axe = (await import("axe-core")).default;
  const cases = [
    ["2.0", "A", ["wcag2a"]],
    ["2.0", "AA", ["wcag2a", "wcag2aa"]],
    ["2.0", "AAA", ["wcag2a", "wcag2aa", "wcag2aaa"]],
    ["2.1", "A", ["wcag2a", "wcag21a"]],
    ["2.1", "AA", ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]],
    ["2.1", "AAA", ["wcag2a", "wcag2aa", "wcag2aaa", "wcag21a", "wcag21aa"]],
    ["2.2", "A", ["wcag2a", "wcag21a"]],
    ["2.2", "AA", ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]],
    [
      "2.2",
      "AAA",
      ["wcag2a", "wcag2aa", "wcag2aaa", "wcag21a", "wcag21aa", "wcag22aa"],
    ],
  ] as const;
  for (const [wcagVersion, wcagLevel, tags] of cases) {
    assert.deepEqual(wcagTags({ wcagVersion, wcagLevel }), tags);
  }
  for (const wcagVersion of wcagVersions)
    for (const wcagLevel of wcagLevels) {
      const rules = axe
        .getRules(wcagTags({ wcagVersion, wcagLevel }))
        .map((rule) => rule.ruleId);
      assert.ok(rules.includes("button-name"));
      assert.equal(rules.includes("color-contrast"), wcagLevel !== "A");
      assert.equal(
        rules.includes("color-contrast-enhanced"),
        wcagLevel === "AAA",
      );
      assert.equal(
        rules.includes("target-size"),
        wcagVersion === "2.2" && wcagLevel !== "A",
      );
    }
});

test("scan runner passes the selected tags and cache reuse requires the same standard", async (t) => {
  const { runAccessibilityScan, rememberAccessibility, cachedAccessibility } =
    await import("./accessibility-scan.js");
  const axe = (await import("axe-core")).default;
  const result = {
    testEngine: { version: "4.13.0" },
    violations: [],
    incomplete: [],
  } as unknown as AxeResults;
  const seen: unknown[] = [];
  t.mock.method(
    axe,
    "run",
    async (_context: unknown, options: { runOnly: unknown }) => {
      seen.push(options.runOnly);
      return result;
    },
  );
  const standard = { wcagVersion: "2.0", wcagLevel: "AA" } as const;
  const scan = await runAccessibilityScan(() => false, standard);
  assert.deepEqual(seen, [{ type: "tag", values: ["wcag2a", "wcag2aa"] }]);
  assert.equal(await runAccessibilityScan(() => true, standard), null);
  assert.equal(seen.length, 1);
  const report = summarizeAccessibility(scan!, standard);
  assert.deepEqual(report.standard, standard);
  for (const [name, value] of Object.entries({
    location: { href: "https://test.example/" },
    document: { documentElement: { lang: "en" }, title: "Test" },
    innerHeight: 800,
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  rememberAccessibility("same-page", report);
  assert.equal(cachedAccessibility("same-page", standard), report);
  assert.equal(
    cachedAccessibility("same-page", { wcagVersion: "2.2", wcagLevel: "AA" }),
    undefined,
  );
  assert.equal(
    cachedAccessibility("same-page", { wcagVersion: "2.0", wcagLevel: "AAA" }),
    undefined,
  );
  assert.equal(cachedAccessibility("changed-page", standard), undefined);
});
