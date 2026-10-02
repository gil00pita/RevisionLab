import {
  defaultWcagSettings,
  wcagLabel,
  wcagTags,
  type WcagSettings,
} from "../wcag-settings.js";
import type { AxeResults } from "axe-core";
import {
  MAX_ACCESSIBILITY_REPORT_BYTES,
  type AccessibilityReport,
} from "../accessibility.js";

export const accessibilityExcluded = [
  "[data-revisionlab-ui]",
  "[data-revisionlab-private]",
  "nextjs-portal",
  ".html2canvas-container",
  'input[type="password"]',
  'input[autocomplete="one-time-code"]',
];

// The widget and recorder share axe's single document-wide runner.
let scanQueue: Promise<unknown> = Promise.resolve();
let saved: { key: string; report: AccessibilityReport } | undefined;
const cacheKey = (signature: string, standard: WcagSettings) =>
  `${location.href}|${document.documentElement.lang}|${document.title}|${innerHeight}|${wcagLabel(standard)}|${signature}`;

export function rememberAccessibility(
  signature: string,
  report: AccessibilityReport,
) {
  saved = {
    key: cacheKey(signature, report.standard ?? defaultWcagSettings),
    report,
  };
}

export function cachedAccessibility(
  signature: string,
  standard: WcagSettings = defaultWcagSettings,
) {
  return saved?.key === cacheKey(signature, standard)
    ? saved.report
    : undefined;
}

export function runAccessibilityScan(
  cancelled: () => boolean = () => false,
  standard: WcagSettings = defaultWcagSettings,
) {
  const tags = wcagTags(standard);
  const task = scanQueue
    .catch(() => undefined)
    .then(async () => {
      if (cancelled()) return null;
      const axe = (await import("axe-core")).default;
      if (cancelled()) return null;
      return axe.run(
        { exclude: accessibilityExcluded },
        {
          elementRef: true,
          runOnly: {
            type: "tag",
            values: tags,
          },
          resultTypes: ["violations", "incomplete"],
        },
      );
    });
  scanQueue = task;
  return task;
}

function targetLabel(element?: HTMLElement | null) {
  if (!element) return "Document or embedded content";
  const parts: string[] = [];
  let current: Element | null = element;
  // Structural locations omit raw HTML, text, IDs, attributes and field values.
  while (current && parts.length < 8) {
    const tag = current.localName;
    const siblings = current.parentElement
      ? Array.from(current.parentElement.children).filter(
          (child) => child.localName === tag,
        )
      : [];
    parts.unshift(
      siblings.length > 1
        ? `${tag}:nth-of-type(${siblings.indexOf(current) + 1})`
        : tag,
    );
    current = current.parentElement;
  }
  return parts.join(" > ").slice(0, 256);
}

export function summarizeAccessibility(
  scan: AxeResults,
  standard: WcagSettings = defaultWcagSettings,
): AccessibilityReport {
  const report: AccessibilityReport = {
    standard: {
      wcagVersion: standard.wcagVersion,
      wcagLevel: standard.wcagLevel,
    },
    status: scan.violations.length
      ? "issues"
      : scan.incomplete.length
        ? "review"
        : "passed",
    checkedAt: new Date().toISOString(),
    engineVersion: scan.testEngine.version,
    violationCount: scan.violations.length,
    incomplete: scan.incomplete.length,
    truncated:
      scan.violations.length > 50 ||
      scan.violations.some((issue) => issue.nodes.length > 10),
    issues: scan.violations.slice(0, 50).map((issue) => ({
      id: issue.id.slice(0, 100),
      help: issue.help.slice(0, 500),
      helpUrl: issue.helpUrl,
      impact: issue.impact ?? null,
      count: issue.nodes.length,
      targets: issue.nodes
        .slice(0, 10)
        .map((node) => targetLabel(node.element)),
    })),
  };
  const encoder = new TextEncoder();
  while (
    encoder.encode(JSON.stringify(report)).byteLength >
      MAX_ACCESSIBILITY_REPORT_BYTES &&
    report.issues.length > 1
  ) {
    report.issues.pop();
    report.truncated = true;
  }
  return report;
}
