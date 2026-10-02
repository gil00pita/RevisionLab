import type { AccessibilityReport } from "./accessibility.js";
import type {
  RevisionLabComment,
  RevisionLabFlow,
  RevisionLabStep,
} from "./server/types.js";

export type FeedbackTarget =
  | { kind: "screen" }
  | { kind: "comment"; commentId: string }
  | { kind: "accessibility"; issueId: string };

export interface FeedbackContext {
  flowId: string;
  flowName: string;
  version: number;
  stepId: string;
  screen: string;
  route: string;
  capturedAt: string;
  comments: Pick<
    RevisionLabComment,
    "id" | "body" | "status" | "anchor" | "elementAnchor" | "parentId"
  >[];
  issues: AccessibilityReport["issues"];
  checkedAt?: string;
  reportStatus: string;
}

export function feedbackContext(
  flow: RevisionLabFlow,
  step: RevisionLabStep,
  comments: RevisionLabComment[],
  target: FeedbackTarget,
): FeedbackContext {
  const screenComments = comments.filter(
    (comment) => comment.stepId === step.id && comment.flowId === flow.id,
  );
  const roots = screenComments.filter(
    (comment) =>
      !comment.parentId &&
      (target.kind === "comment"
        ? comment.id === target.commentId
        : comment.status === "open"),
  );
  if (target.kind === "comment" && !roots.length)
    throw new Error("This comment is no longer on this screen.");
  const rootIds = new Set(roots.map((comment) => comment.id));
  const report = step.capture?.accessibility;
  const issues = report?.status === "issues" ? report.issues : [];
  if (
    target.kind === "accessibility" &&
    !issues.some((issue) => issue.id === target.issueId)
  )
    throw new Error("This accessibility issue is no longer available.");
  return {
    flowId: flow.id,
    flowName: flow.name,
    version: flow.version,
    stepId: step.id,
    screen: step.title,
    route: step.route,
    capturedAt: step.createdAt,
    comments:
      target.kind === "accessibility"
        ? []
        : screenComments
            .filter(
              (comment) =>
                rootIds.has(comment.id) ||
                (comment.parentId && rootIds.has(comment.parentId)),
            )
            .map(({ id, body, status, anchor, elementAnchor, parentId }) => ({
              id,
              body,
              status,
              anchor,
              elementAnchor,
              parentId,
            })),
    issues:
      target.kind === "comment"
        ? []
        : issues.filter(
            (issue) => target.kind === "screen" || issue.id === target.issueId,
          ),
    checkedAt: report?.checkedAt,
    reportStatus: report?.status ?? "not-checked",
  };
}

export function jiraDraft(context: FeedbackContext, reviewUrl: string) {
  const root = context.comments.find((comment) => !comment.parentId);
  const issue = context.issues[0];
  const subject = issue?.help ?? root?.body ?? `Review ${context.screen}`;
  const summary = `${context.screen}: ${subject}`
    .replace(/\s+/g, " ")
    .slice(0, 255);
  const comments = context.comments
    .map((comment) =>
      [
        `${comment.parentId ? "Reply" : "Comment"} (${comment.status}, ${comment.id}):`,
        comment.body,
        comment.elementAnchor
          ? `Element: ${comment.elementAnchor.tag} ${comment.elementAnchor.label}\nSelector: ${comment.elementAnchor.selector}`
          : "",
        comment.anchor
          ? `Screenshot position: ${Math.round(comment.anchor.x * 100)}%, ${Math.round(comment.anchor.y * 100)}%`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
  const findings = context.issues
    .map((finding) =>
      [
        `${finding.id}: ${finding.help}`,
        `Reported severity: ${finding.impact ?? "unspecified"}`,
        `Affected elements: ${finding.count}`,
        ...finding.targets.map((target) => `Target: ${target}`),
        `Rule documentation: ${finding.helpUrl}`,
      ].join("\n"),
    )
    .join("\n\n");
  return {
    summary,
    description: [
      "Context",
      `Flow: ${context.flowName} · version ${context.version}`,
      `Screen: ${context.screen}`,
      `Route: ${context.route}`,
      `Screen ID: ${context.stepId}`,
      `Captured: ${context.capturedAt}`,
      `Review: ${reviewUrl}`,
      "",
      "Reported problem",
      comments || findings,
      comments && findings ? findings : "",
      context.checkedAt && findings
        ? `Accessibility scan: ${context.checkedAt}`
        : "",
      "",
      "Steps to verify",
      `1. Open ${context.route} in the relevant prototype.`,
      "2. Reproduce the screen state shown in the linked recording.",
      "3. Inspect the reported component or screenshot position.",
      "",
      "Acceptance criteria",
      issue
        ? `- The reported ${context.issues.map((item) => item.id).join(", ")} finding no longer reproduces in a fresh scan of the same state.`
        : "- The reported feedback is addressed and confirmed by the reviewer.",
      "- Existing unrelated behavior and styling are preserved.",
      "- Relevant keyboard, responsive, and project checks pass.",
      "",
      "Historical captures and reports are evidence; verify the current implementation before closing this ticket.",
    ]
      .filter((line) => line !== undefined)
      .join("\n"),
  };
}

export interface ProposedChange {
  file: string;
  before: string;
  after: string;
}
export interface CodexProposal {
  id: string;
  summary: string;
  warnings: string[];
  changes: ProposedChange[];
  status: "proposed" | "applied" | "discarded" | "undone";
  prUrl?: string;
}
