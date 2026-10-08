import { expireTests } from "./test-sessions/store.js";
import type { Client } from "@libsql/client";
import type { ResolvedConfig } from "./config.js";
import type { RevisionLabActor, RevisionLabState } from "./types.js";
import { readFlows, readComments, readInvitations } from "./queries.js";
import { readPersonas } from "./persona-routes.js";
import { readSettings } from "./settings.js";
import { readSetup } from "./setup.js";
import { readAccessSettings, readMemberships } from "./membership-routes.js";
export async function readWorkspaceState(
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<RevisionLabState> {
  await expireTests(client);
  const [
    setup,
    flows,
    comments,
    invitations,
    personas,
    settings,
    memberships,
    accessSettings,
    sessionCount,
    workspaceName,
  ] = await Promise.all([
    readSetup(client),
    readFlows(client, config.apiPath),
    readComments(client),
    actor.role === "owner" ? readInvitations(client) : [],
    readPersonas(client),
    readSettings(client),
    actor.role === "owner" ? readMemberships(client) : [],
    actor.role === "owner" ? readAccessSettings(client, config) : null,
    client.execute("SELECT COUNT(*) AS count FROM test_sessions"),
    client.execute("SELECT display_name FROM workspace_settings WHERE id = 1"),
  ]);
  return {
    dashboard: {
      testSessions: Number(sessionCount.rows[0].count),
      // Jira handoff currently prepares drafts; it does not create remote tickets.
      ticketsCreated: 0,
    },
    setup,
    workspaceName: String(
      workspaceName.rows[0]?.display_name || "Local workspace",
    ),
    project: { id: config.projectId, name: config.projectName },
    actor,
    flows,
    comments,
    invitations,
    personas,
    settings,
    memberships,
    accessSettings,
  };
}
