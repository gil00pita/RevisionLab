import { handleAiInstructions } from "../ai-instructions.js";
import type { Client } from "@libsql/client";
import { z } from "zod";
import type { ResolvedConfig } from "../config.js";
import { authenticateApiKey } from "./keys.js";
import { readWorkspaceState } from "../workspace-state.js";
import { readArtifact } from "../artifacts.js";
import { handleFlows } from "../flow-routes.js";
import { handleComments } from "../collaboration-routes.js";
import { handlePersonas } from "../persona-routes.js";
import { handleSettings } from "../settings.js";
import { consumeRateLimit } from "../database.js";
import { HttpError, json } from "../security.js";
import { handleHistory, historyAction, withHistory } from "../history.js";
export async function installationId(client: Client) {
  return String(
    (await client.execute("SELECT instance_id FROM installation WHERE id=1"))
      .rows[0].instance_id,
  );
}
export async function handleFederation(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
) {
  const actor = await authenticateApiKey(request, client);
  if (path.length === 2 && path[0] === "settings" && path[1] === "ai") {
    if (request.method !== "GET")
      await consumeRateLimit(client, `federation:${actor.id}`, 120, 60_000);
    return handleAiInstructions(request, config, actor, client);
  }
  if (request.method === "GET" && path.length === 1 && path[0] === "manifest")
    return json({
      protocol: 1,
      projectId: config.projectId,
      projectName: config.projectName,
      instanceId: await installationId(client),
      apiPath: config.apiPath,
      basePath: config.basePath,
      role: actor.role,
    });
  if (request.method === "GET" && path.length === 1 && path[0] === "state")
    return json({
      ...(await readWorkspaceState(client, config, actor)),
      instanceId: await installationId(client),
    });
  if (path[0] === "history") {
    if (request.method !== "GET")
      await consumeRateLimit(client, `federation:${actor.id}`, 120, 60_000);
    return handleHistory(request, path, client, config, actor);
  }
  if (
    request.method === "GET" &&
    path.length === 2 &&
    path[0] === "artifacts" &&
    z.string().uuid().safeParse(path[1]).success
  )
    return readArtifact(path[1], client, config, true);
  if (!["POST", "PATCH"].includes(request.method))
    throw new HttpError(404, "Not found.");
  await consumeRateLimit(client, `federation:${actor.id}`, 120, 60_000);
  // Recording must originate in the source prototype; no remote auth/key/connection administration.
  if (
    path[0] === "flows" &&
    ((path.length === 3 && path[2] === "board") ||
      (path.length === 2 && path[1] === "delete"))
  )
    return withHistory(
      client,
      config,
      actor,
      historyAction(request.method, path),
      () => handleFlows(request, path, client, config, actor),
    );
  if (path[0] === "comments")
    return withHistory(
      client,
      config,
      actor,
      historyAction(request.method, path),
      () => handleComments(request, path, client, actor),
    );
  if (path[0] === "personas")
    return withHistory(
      client,
      config,
      actor,
      historyAction(request.method, path),
      () => handlePersonas(request, path, client, actor, config),
    );
  if (path[0] === "settings")
    return withHistory(
      client,
      config,
      actor,
      historyAction(request.method, path),
      () => handleSettings(request, path, client, actor),
    );
  throw new HttpError(
    403,
    "This API key cannot perform that workspace operation.",
  );
}
