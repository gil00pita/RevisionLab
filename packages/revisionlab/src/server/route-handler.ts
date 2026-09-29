import { z } from "zod";
import { authenticate } from "./authentication.js";
import { handleAuth } from "./auth-routes.js";
import { readArtifact } from "./artifacts.js";
import { handleComments, handleInvitations } from "./collaboration-routes.js";
import { resolveConfig } from "./config.js";
import { consumeRateLimit, getDatabase } from "./database.js";
import { handleFlows } from "./flow-routes.js";
import { handlePersonas, readPersonas } from "./persona-routes.js";
import { readComments, readFlows, readInvitations } from "./queries.js";
import { handleSettings, readSettings } from "./settings.js";
import { assertSameOrigin, HttpError, json } from "./security.js";
import type { RevisionLabConfig, RevisionLabRouteHandler } from "./types.js";

export function createRevisionLabHandler(
  initialConfig: RevisionLabConfig,
): RevisionLabRouteHandler {
  return async (request, context) => {
    try {
      const config = resolveConfig(initialConfig);
      const { path = [] } = await context.params;
      if (path.length > 3) throw new HttpError(404, "Not found.");
      if (request.method !== "GET") assertSameOrigin(request);
      const client = await getDatabase(config);
      if (path[0] === "auth")
        return await handleAuth(request, path.slice(1), client, config);
      const actor = await authenticate(request, client, config);
      if (
        request.method === "GET" &&
        path.length === 1 &&
        path[0] === "state"
      ) {
        const [flows, comments, invitations, personas, settings] =
          await Promise.all([
            readFlows(client, config.apiPath),
            readComments(client),
            actor.role === "owner" ? readInvitations(client) : [],
            readPersonas(client),
            readSettings(client),
          ]);
        return json({
          project: { id: config.projectId, name: config.projectName },
          actor,
          flows,
          comments,
          invitations,
          personas,
          settings,
        });
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
      await consumeRateLimit(client, `mutate:${actor.id}`, 120, 60_000);
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
