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
