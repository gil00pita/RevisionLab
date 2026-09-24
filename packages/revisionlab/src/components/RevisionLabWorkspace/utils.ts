import type { RevisionLabState } from "../../server/types.js";
import { commentContextLabel } from "./comment-context.js";

export function downloadReport(data: RevisionLabState) {
  const markdown = [
    `# ${data.project.name} — review report`,
    `Exported ${new Date().toISOString()}`,
    ...data.flows.flatMap((flow) => [
      `\n## ${flow.name} · v${flow.version}`,
      `Persona: ${flow.persona} · ${flow.status}`,
      ...flow.steps.map(
        (step, index) => `${index + 1}. ${step.title} (${step.route})`,
      ),
      "\nPaths:",
      ...flow.board.edges.map((edge) => {
        const source = flow.steps.find((step) => step.id === edge.sourceStepId);
        const target = flow.steps.find((step) => step.id === edge.targetStepId);
        return `- ${source?.title ?? edge.sourceStepId} → ${target?.title ?? edge.targetStepId}${edge.label ? ` · ${edge.label}` : ""} (${edge.kind})`;
      }),
    ]),
    "\n## Feedback",
    ...data.comments.map((comment) => {
      const flow = data.flows.find((item) => item.id === comment.flowId);
      const step = flow?.steps.find((item) => item.id === comment.stepId);
      const context = flow
        ? `${flow.name} · v${flow.version}${step ? ` · ${step.title}` : ""}`
        : "Page feedback";
      const location = comment.edgeId
        ? ` · connection ${comment.edgeId}: ${commentContextLabel(comment, data)}`
        : comment.elementAnchor
          ? ` · live element ${comment.elementAnchor.tag}: ${comment.elementAnchor.label} (${comment.elementAnchor.selector})`
          : comment.anchor
            ? ` · pin ${Math.round(comment.anchor.x * 100)}%, ${Math.round(comment.anchor.y * 100)}%`
            : "";
      const thread = comment.parentId
        ? ` · reply to ${comment.parentId}`
        : ` · thread ${comment.id}`;
      return `\n- [${comment.status === "resolved" ? "x" : " "}] ${comment.body}\n  ${context}${location}${thread}\n  — ${comment.authorName}, ${comment.route}, ${comment.createdAt}`;
    }),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
  );
  const download = document.createElement("a");
  download.href = url;
  download.download = "revisionlab-review.md";
  download.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
