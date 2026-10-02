import { handleApiKeys } from "./instances/keys.js";
import { handleConnections } from "./instances/connections.js";
import { handleFederation } from "./instances/federation.js";
import { connectedState, proxyInstance } from "./instances/workspaces.js";
import { readWorkspaceState } from "./workspace-state.js";
import { z } from "zod";
import { authenticate, requireRole } from "./authentication.js";
import { handleAuth } from "./auth-routes.js";
import { readArtifact } from "./artifacts.js";
import { handleComments, handleInvitations } from "./collaboration-routes.js";
import { resolveConfig } from "./config.js";
import { consumeRateLimit, getDatabase } from "./database.js";
import { handleFlows } from "./flow-routes.js";
import { handlePersonas } from "./persona-routes.js";
import { handleSettings } from "./settings.js";
import { assertSameOrigin, HttpError, json } from "./security.js";
import type { RevisionLabConfig, RevisionLabRouteHandler } from "./types.js";

export function createRevisionLabHandler(
  initialConfig: RevisionLabConfig,
): RevisionLabRouteHandler {
  return async (request, context) => {
    try {
      const config = resolveConfig(initialConfig);
      const { path = [] } = await context.params;
      if (path.length > 6) throw new HttpError(404, "Not found.");
      if (request.method !== "GET") assertSameOrigin(request);
      const client = await getDatabase(config);
      if (path[0] === "auth")
        return await handleAuth(request, path.slice(1), client, config);
      if (path[0] === "federation")
        return await handleFederation(request, path.slice(1), client, config);
      const actor = await authenticate(request, client, config);
      if (request.method !== "GET")
        await consumeRateLimit(client, `mutate:${actor.id}`, 120, 60_000);
      if (path[0] === "api-keys")
        return await handleApiKeys(request, path, client, actor);
      if (path[0] === "instances") {
        if (path[2] === "proxy")
          return await proxyInstance(request, path, client, actor, config);
        requireRole(actor, "owner");
        return await handleConnections(request, path, client, config);
      }
      if (
        request.method === "GET" &&
        path.length === 1 &&
        path[0] === "workspace-state"
      )
        return await connectedState(request, client, config, actor);
      if (
        request.method === "GET" &&
        path.length === 1 &&
        path[0] === "state"
      ) {
        return json(await readWorkspaceState(client, config, actor));
      }
      if (
        request.method === "GET" &&
        path.length === 2 &&
        path[0] === "artifacts" &&
        z.string().uuid().safeParse(path[1]).success
      ) {
        return await readArtifact(path[1], client, config);
      }
      if (!["POST", "PATCH"].includes(request.method))
        throw new HttpError(404, "Not found.");
      if (path[0] === "flows")
        return await handleFlows(request, path, client, config, actor);
      if (path[0] === "personas")
        return await handlePersonas(request, path, client, actor);
      if (path[0] === "settings")
        return await handleSettings(request, path, client, actor);
      if (path[0] === "comments")
        return await handleComments(request, path, client, actor);
      if (path[0] === "invitations")
        return await handleInvitations(request, path, client, config, actor);
      throw new HttpError(404, "Not found.");
    } catch (error) {
      if (error instanceof HttpError) {
        return json(
          { error: error.message },
          error.status,
          error.status === 429 ? { "Retry-After": "900" } : undefined,
        );
      }
      if (error instanceof z.ZodError)
        return json(
          {
            error: "Invalid request.",
            issues: z.flattenError(error).fieldErrors,
          },
          400,
        );
      // Do not log request bodies, database credentials, invitations, or codes.
      console.error(
        "RevisionLab request failed:",
        error instanceof Error ? error.name : "UnknownError",
      );
      return json(
        { error: "RevisionLab could not complete the request." },
        500,
      );
    }
  };
}
