export const MAX_ACCESSIBILITY_REPORT_BYTES = 64_000;

export interface AccessibilityReport {
  status: "passed" | "issues" | "review" | "unavailable";
  checkedAt?: string;
  engineVersion?: string;
  violationCount: number;
  incomplete: number;
  truncated: boolean;
  reason?: "changed" | "failed" | "not-scanned";
  issues: {
    id: string;
    help: string;
    helpUrl: string;
    impact: "minor" | "moderate" | "serious" | "critical" | null;
    count: number;
    targets: string[];
  }[];
}

export function unavailableAccessibility(
  reason: NonNullable<AccessibilityReport["reason"]>,
): AccessibilityReport {
  return {
    status: "unavailable",
    reason,
    violationCount: 0,
    incomplete: 0,
    truncated: false,
    issues: [],
  };
}

export function accessibilityLabel(
  report?: AccessibilityReport | null,
): string {
  if (!report) return "Not checked";
  if (report.status === "unavailable") return "Check unavailable";
  if (report.status === "issues")
    return `${report.violationCount} accessibility ${report.violationCount === 1 ? "issue" : "issues"}`;
  if (report.status === "review") return "Manual review needed";
  return "No issues detected";
}
