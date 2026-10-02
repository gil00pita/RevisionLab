import type { Client } from "@libsql/client";
import type { ResolvedConfig } from "./config.js";
import type { RevisionLabActor, RevisionLabState } from "./types.js";
import { readFlows, readComments, readInvitations } from "./queries.js";
import { readPersonas } from "./persona-routes.js";
import { readSettings } from "./settings.js";
import { readSetup } from "./setup.js";
import {
  readAccessSettings,
  readMemberships,
} from "./membership-routes.js";
export async function readWorkspaceState(
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
): Promise<RevisionLabState> {
  const [
    setup,
    flows,
    comments,
    invitations,
    personas,
    settings,
    memberships,
    accessSettings,
  ] = await Promise.all([
    readSetup(client),
    readFlows(client, config.apiPath),
    readComments(client),
    actor.role === "owner" ? readInvitations(client) : [],
    readPersonas(client),
    readSettings(client),
    actor.role === "owner" ? readMemberships(client) : [],
    actor.role === "owner" ? readAccessSettings(client, config) : null,
  ]);
  return {
    setup,
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
