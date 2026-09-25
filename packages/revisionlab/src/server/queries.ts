import type { Client } from "@libsql/client";
import { readBoard } from "./board.js";
import type {
  RevisionLabComment,
  RevisionLabFlow,
  RevisionLabInvitation,
  RevisionLabStep,
} from "./types.js";

type Row = Record<string, unknown>;
const text = (row: Row, key: string): string => String(row[key] ?? "");
const nullable = (row: Row, key: string): string | null =>
  row[key] == null ? null : String(row[key]);

export async function readFlows(
  client: Client,
  apiPath: string,
): Promise<RevisionLabFlow[]> {
  const [flows, steps] = await client.batch(
    [
      "SELECT * FROM flows ORDER BY updated_at DESC",
      "SELECT * FROM steps ORDER BY flow_id, position",
    ],
    "read",
  );
  const mappedSteps: RevisionLabStep[] = steps.rows.map((row) => ({
    id: text(row, "id"),
    flowId: text(row, "flow_id"),
    title: text(row, "title"),
    route: text(row, "route"),
    position: Number(row.position),
    createdAt: text(row, "created_at"),
    capture: row.capture_json ? JSON.parse(String(row.capture_json)) : null,
    screenshot: row.screenshot
      ? String(row.screenshot).startsWith("data:image/")
        ? String(row.screenshot)
        : `${apiPath}/artifacts/${row.screenshot}`
      : null,
  }));
  return flows.rows.map((row) => {
    const flowSteps = mappedSteps.filter((step) => step.flowId === row.id);
    return {
      id: text(row, "id"),
      familyId: text(row, "family_id"),
      version: Number(row.version),
      previousVersionId: nullable(row, "previous_version_id"),
      name: text(row, "name"),
      persona: text(row, "persona"),
      route: text(row, "route"),
      status: text(row, "status") as RevisionLabFlow["status"],
      createdAt: text(row, "created_at"),
      updatedAt: text(row, "updated_at"),
      steps: flowSteps,
      board: readBoard(
        row.board_json,
        Number(row.board_revision),
        flowSteps.map((step) => step.id),
      ),
    };
  });
}

export async function readComments(
  client: Client,
): Promise<RevisionLabComment[]> {
  const result =
    await client.execute(`SELECT comments.*, reviewers.name AS author_name,
      COALESCE(parent.status, comments.status) AS thread_status,
      COALESCE(parent.element_anchor, comments.element_anchor) AS thread_element_anchor,
      CASE WHEN comments.parent_id IS NULL THEN comments.resolved_at ELSE parent.resolved_at END AS thread_resolved_at,
      edge.source_step_id AS edge_source, edge.target_step_id AS edge_target,
      edge.label AS edge_label, edge.kind AS edge_kind, edge.archived_at AS edge_archived_at
    FROM comments JOIN reviewers ON reviewers.id = comments.author_id
    LEFT JOIN comments AS parent ON parent.id = comments.parent_id
    LEFT JOIN board_edges AS edge ON edge.flow_id = comments.flow_id AND edge.id = comments.edge_id
    ORDER BY comments.created_at DESC, comments.id`);
  return result.rows.map((row) => ({
    id: text(row, "id"),
    flowId: nullable(row, "flow_id"),
    stepId: nullable(row, "step_id"),
    edgeId: nullable(row, "edge_id"),
    edge:
      row.edge_source == null
        ? null
        : {
            sourceStepId: text(row, "edge_source"),
            targetStepId: text(row, "edge_target"),
            label: text(row, "edge_label"),
            kind: text(row, "edge_kind") as "recorded" | "manual",
            archived: row.edge_archived_at != null,
          },
    route: text(row, "route"),
    body: text(row, "body"),
    status: text(row, "thread_status") as RevisionLabComment["status"],
    authorName: text(row, "author_name"),
    createdAt: text(row, "created_at"),
    resolvedAt: nullable(row, "thread_resolved_at"),
    anchor:
      row.anchor_x == null || row.anchor_y == null
        ? null
        : { x: Number(row.anchor_x), y: Number(row.anchor_y) },
    parentId: nullable(row, "parent_id"),
    elementAnchor:
      row.thread_element_anchor == null
        ? null
        : JSON.parse(String(row.thread_element_anchor)),
  }));
}

export async function readInvitations(
  client: Client,
): Promise<RevisionLabInvitation[]> {
  const result = await client.execute(
    "SELECT id, email, role, expires_at, created_at, revoked_at FROM invitations ORDER BY created_at DESC",
  );
  return result.rows.map((row) => ({
    id: text(row, "id"),
    email: nullable(row, "email"),
    role: text(row, "role") as RevisionLabInvitation["role"],
    expiresAt: text(row, "expires_at"),
    createdAt: text(row, "created_at"),
    revokedAt: nullable(row, "revoked_at"),
  }));
}
