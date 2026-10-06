export type EvidenceKind = "comment" | "accessibility" | "test";

/** Historical evidence is saved with a draft, independent of live review data. */
export interface ReviewEvidence {
  id: string;
  kind: EvidenceKind;
  title: string;
  body: string;
  route: string;
  capturedAt: string;
  flowId?: string;
  flowName?: string;
  version?: number;
  stepId?: string;
  screen?: string;
  sessionId?: string;
  commentId?: string;
  issueId?: string;
  screenshot?: string | null;
  screenshotId?: string;
  anchor?: { x: number; y: number } | null;
  target?: string;
}

export interface EvidenceGroup {
  id: string;
  kind: EvidenceKind;
  title: string;
  evidence: ReviewEvidence[];
}

export interface ReviewTicketFields {
  summary: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  acceptanceCriteria: string;
  status: "draft" | "ready" | "fixed";
}

export interface TicketTemplate {
  id: string;
  name: string;
  markdown: string;
}

export interface ReviewTicket extends ReviewTicketFields {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  evidence: ReviewEvidence[];
  notes: string;
  template?: TicketTemplate;
}

export interface FeedbackReviewData {
  evidence: ReviewEvidence[];
  tickets: ReviewTicket[];
  canGenerate: boolean;
  templates: TicketTemplate[];
  templateError?: string;
}

export function groupEvidence(evidence: ReviewEvidence[]): EvidenceGroup[] {
  const groups = new Map<string, EvidenceGroup>();
  for (const item of evidence) {
    const key =
      item.kind === "comment"
        ? `comment:${item.title.trim().replace(/\s+/g, " ").toLowerCase()}`
        : item.kind === "accessibility"
          ? `accessibility:${JSON.stringify([item.issueId, item.route])}`
          : item.id;
    const group = groups.get(key) ?? {
      id: key,
      kind: item.kind,
      title: item.title,
      evidence: [],
    };
    group.evidence.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function evidenceReviewPath(item: ReviewEvidence, basePath: string) {
  const query = new URLSearchParams({ workspace: "local" });
  if (item.kind === "test" && item.sessionId) {
    query.set("view", "sessions");
    query.set("session", item.sessionId);
  } else if (item.flowId && item.stepId) {
    query.set("flow", item.flowId);
    query.set("screen", item.stepId);
  } else {
    query.set("view", "comments");
    // The Comments route filter only supports page comments, not flow edges.
    if (!item.flowId) query.set("route", item.route);
  }
  return `${basePath}?${query}`;
}

export function ticketText(ticket: ReviewTicket, reviewRoot: string) {
  return [
    ticket.summary,
    `Suggested priority: ${ticket.priority}`,
    "",
    ticket.description,
    "",
    "Acceptance criteria",
    ticket.acceptanceCriteria,
    "",
    "Source evidence",
    ...ticket.evidence.map((item) =>
      [
        `${item.kind}: ${item.title}`,
        item.flowName ? `Flow: ${item.flowName} · version ${item.version}` : "",
        item.screen ? `Screen: ${item.screen}` : "",
        `Route: ${item.route} · Recorded: ${item.capturedAt}`,
        `Evidence ID: ${item.id}`,
        item.screenshot
          ? `Screenshot: ${item.screenshot.startsWith("/") && /^https?:\/\//.test(reviewRoot) ? new URL(item.screenshot, reviewRoot).toString() : item.screenshot}`
          : "",
        item.anchor
          ? `Location: ${Math.round(item.anchor.x * 100)}%, ${Math.round(item.anchor.y * 100)}%`
          : "",
        `Review: ${evidenceReviewPath(item, reviewRoot)}`,
        item.body,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
    ...(ticket.notes ? ["", "Reviewer notes", ticket.notes] : []),
    "",
    "Historical evidence: verify the current prototype before closing this ticket.",
  ].join("\n");
}
