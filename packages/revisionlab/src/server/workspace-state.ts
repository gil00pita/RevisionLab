import type { Client } from "@libsql/client";
import type { ResolvedConfig } from "./config.js";
import type { RevisionLabActor, RevisionLabState } from "./types.js";
import { readFlows, readComments, readInvitations } from "./queries.js";
import { readPersonas } from "./persona-routes.js";
import { readSettings } from "./settings.js";
export async function readWorkspaceState(
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<RevisionLabState> {
  const [flows, comments, invitations, personas, settings] = await Promise.all([
    readFlows(client, config.apiPath),
    readComments(client),
    actor.role === "owner" ? readInvitations(client) : [],
    readPersonas(client),
    readSettings(client),
  ]);
  return {
    project: { id: config.projectId, name: config.projectName },
    actor,
    flows,
    comments,
    invitations,
    personas,
    settings,
  };
}
