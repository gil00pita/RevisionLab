import type { Client } from "@libsql/client";
import type { ReviewEvidence } from "../../feedback-review.js";
import type { ResolvedConfig } from "../config.js";
import { readComments, readFlows } from "../queries.js";

export async function readReviewEvidence(
  client: Client,
  config: ResolvedConfig,
) {
  const [flows, comments, tests] = await Promise.all([
    readFlows(client, config.apiPath),
    readComments(client),
    client.execute(`SELECT s.*, (
      SELECT count(*) FROM test_events e WHERE e.session_id=s.id
      AND json_extract(e.event_json,'$.type')='click') AS clicks
      FROM test_sessions s WHERE s.status IN ('completed','expired')
      AND s.started_at IS NOT NULL AND s.flow_id IS NOT NULL
      ORDER BY s.created_at DESC LIMIT 200`),
  ]);
  const result: ReviewEvidence[] = [];
  for (const comment of comments) {
    if (comment.parentId || comment.status !== "open") continue;
    const flow = flows.find((flow) => flow.id === comment.flowId);
    const step = flow?.steps.find((step) => step.id === comment.stepId);
    const replies = comments.filter((reply) => reply.parentId === comment.id);
    result.push({
      id: `comment:${comment.id}`,
      kind: "comment",
      title: comment.body,
      commentId: comment.id,
      route: comment.route,
      capturedAt: comment.createdAt,
      flowId: flow?.id,
      flowName: flow?.name,
      version: flow?.version,
      stepId: step?.id,
      screen: step?.title,
      screenshot:
        step?.screenshot ??
        (comment.screenshot
          ? `${config.apiPath}/artifacts/${comment.screenshot}`
          : null),
      screenshotId:
        comment.screenshot ?? step?.screenshot?.split("/artifacts/")[1],
      anchor: comment.anchor ?? comment.screenshotAnchor,
      target: comment.elementAnchor?.label,
      body: [
        `${comment.authorName}: ${comment.body}`,
        comment.anchor
          ? `Screenshot position: ${Math.round(comment.anchor.x * 100)}%, ${Math.round(comment.anchor.y * 100)}%`
          : "",
        comment.elementAnchor
          ? `Element: ${comment.elementAnchor.label}\nSelector: ${comment.elementAnchor.selector}`
          : "",
        comment.edge
          ? `Connection: ${comment.edge.label} (${comment.edge.sourceStepId} → ${comment.edge.targetStepId}${comment.edge.archived ? ", archived" : ""})`
          : "",
        ...replies.map(
          (reply) => `Reply (${reply.id}) ${reply.authorName}: ${reply.body}`,
        ),
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }
  for (const flow of flows) {
    for (const step of flow.steps) {
      const report = step.capture?.accessibility;
      if (report?.status !== "issues") continue;
      for (const issue of report.issues) {
        result.push({
          id: `accessibility:${step.id}:${issue.id}`,
          kind: "accessibility",
          title: issue.help,
          issueId: issue.id,
          flowId: flow.id,
          flowName: flow.name,
          version: flow.version,
          stepId: step.id,
          screen: step.title,
          screenshot: step.screenshot,
          screenshotId: step.screenshot?.split("/artifacts/")[1],
          target: issue.targets.join(" · "),
          route: step.route,
          capturedAt: report.checkedAt ?? step.createdAt,
          body: [
            `Rule: ${issue.id} · Reported severity: ${issue.impact ?? "unspecified"}`,
            `Affected elements: ${issue.count}`,
            ...issue.targets.map((target) => `Target: ${target}`),
            `Documentation: ${issue.helpUrl}`,
            "Historical automated scan; confirm on the current screen.",
          ].join("\n"),
        });
      }
    }
  }
  for (const session of tests.rows) {
    const flow = flows.find((flow) => flow.id === session.flow_id);
    if (!flow) continue;
    const duration = Math.max(
      0,
      Math.min(
        Number(session.ended_at ?? session.expires_at),
        Number(session.expires_at),
      ) - Number(session.started_at),
    );
    result.push({
      id: `test:${session.id}`,
      kind: "test",
      title: String(session.name),
      sessionId: String(session.id),
      route: String(session.route),
      capturedAt: new Date(Number(session.started_at)).toISOString(),
      flowId: flow.id,
      flowName: flow.name,
      version: flow.version,
      screenshot: flow.steps[0]?.screenshot,
      screenshotId: flow.steps[0]?.screenshot?.split("/artifacts/")[1],
      body: [
        `Participant: ${session.participant ?? "Unnamed"} · Status: ${session.status}`,
        `Session duration: ${(duration / 1000).toFixed(1)} seconds · Recorded clicks: ${session.clicks}`,
        `Captured screens: ${flow.steps.length}`,
        ...flow.steps.map(
          (step) => `Captured screen: ${step.title} (${step.route})`,
        ),
        "Timing and clicks describe recorded activity, not task success or a confirmed usability problem. Review the replay and add observed findings in reviewer notes.",
      ].join("\n"),
    });
  }
  const fixed =
    await client.execute(`SELECT source.evidence_id FROM feedback_ticket_evidence source
    JOIN feedback_tickets ticket ON ticket.id = source.ticket_id
    WHERE json_extract(ticket.ticket_json, '$.status') = 'fixed'`);
  const hidden = new Set(fixed.rows.map((row) => String(row.evidence_id)));
  return result.filter((item) => !hidden.has(item.id));
}
