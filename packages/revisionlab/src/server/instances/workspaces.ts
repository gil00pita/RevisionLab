import { MAX_COMMENT_BODY_BYTES } from "../../comment-rich.js";
import type { Client } from "@libsql/client";
import type { ResolvedConfig } from "../config.js";
import type { RevisionLabActor, RevisionLabState } from "../types.js";
import type {
  WorkspaceInstance,
  WorkspaceState,
} from "../../workspace-instances.js";
import { readWorkspaceState } from "../workspace-state.js";
import {
  readConnections,
  publicConnection,
  remoteResponse,
} from "./connections.js";
import { installationId } from "./federation.js";
import { remoteStateSchema, sourceState, scopeData } from "./data.js";
import { HttpError, json, readJson } from "../security.js";
import { requireRole } from "../authentication.js";

export async function connectedState(
  request: Request,
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
) {
  const selection =
    new URL(request.url).searchParams.get("workspace") ?? "local";
  const local = await readWorkspaceState(client, config, actor);
  const rows = await readConnections(client);
  if (
    selection !== "local" &&
    selection !== "all" &&
    !rows.some((row) => row.id === selection)
  )
    throw new HttpError(
      404,
      "This workspace connection no longer exists. Choose Local workspace.",
    );
  const home: WorkspaceInstance = {
    dashboard: local.dashboard,
    id: "local",
    name: local.workspaceName || "Local workspace",
    url: new URL(request.url).origin,
    basePath: config.basePath,
    apiPath: config.apiPath,
    instanceId: await installationId(client),
    role: actor.role,
    status: "connected",
  };
  const workspaces: WorkspaceInstance[] = [
    home,
    ...rows.map((row) => ({
      ...publicConnection(row),
      role: "commenter" as const,
      status: "connected" as const,
    })),
  ];
  local.flows.forEach((flow) => {
    flow.workspace = home;
  });
  local.comments.forEach((comment) => {
    comment.workspace = home;
  });
  local.personas.forEach((persona) => {
    persona.workspace = home;
  });
  const selectedStates: RevisionLabState[] = [];
  const selected = rows.filter(
    (row) => selection === "all" || selection === row.id,
  );
  // Bounded parallelism keeps a large connection list from opening unbounded sockets.
  for (let start = 0; start < selected.length; start += 4)
    await Promise.all(
      selected.slice(start, start + 4).map(async (row) => {
        const workspace = workspaces.find((source) => source.id === row.id)!;
        try {
          const response = await remoteResponse(
            new URL(`${row.api_path}/federation/state`, String(row.url)),
            String(row.api_key),
            { role: actor.role },
          );
          const parsed = remoteStateSchema.safeParse(await response.json());
          if (
            !parsed.success ||
            parsed.data.project.id !== config.projectId ||
            parsed.data.instanceId !== row.instance_id
          )
            throw new HttpError(
              502,
              "The source workspace identity or response changed. Reconnect it in Settings.",
            );
          workspace.role = parsed.data.actor.role;
          workspace.dashboard = parsed.data.dashboard;
          selectedStates.push(
            sourceState(
              parsed.data,
              workspace,
              config.apiPath,
              String(row.api_path),
            ),
          );
        } catch (error) {
          workspace.status = "unavailable";
          workspace.error =
            error instanceof HttpError
              ? error.message
              : "The workspace returned an invalid response.";
        }
      }),
    );
  const states =
    selection === "local"
      ? [local]
      : selection === "all"
        ? [local, ...selectedStates]
        : selectedStates;
  const settingsWorkspace =
    selection !== "local" && selection !== "all"
      ? workspaces.find((source) => source.id === selection)
      : undefined;
  const result: WorkspaceState = {
    ...local,
    dashboard:
      states.length === (selection === "all" ? rows.length + 1 : 1) &&
      states.every((state) => state.dashboard)
        ? {
            testSessions: states.reduce(
              (total, state) => total + state.dashboard!.testSessions,
              0,
            ),
            ticketsCreated: states.reduce(
              (total, state) => total + state.dashboard!.ticketsCreated,
              0,
            ),
          }
        : undefined,
    selection,
    workspaces,
    settingsWorkspace,
    settings:
      selection !== "all" && selection !== "local" && selectedStates[0]
        ? selectedStates[0].settings
        : local.settings,
    flows: states
      .flatMap((state) => state.flows)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    comments: states.flatMap((state) => state.comments),
    personas: states.flatMap((state) => state.personas),
  };
  return json(result);
}

export async function proxyInstance(
  request: Request,
  path: string[],
  client: Client,
  actor: RevisionLabActor,
  config: ResolvedConfig,
) {
  const row = (
    await client.execute({
      sql: "SELECT * FROM workspace_instances WHERE id=?",
      args: [path[1]],
    })
  ).rows[0];
  if (!row) throw new HttpError(404, "Workspace connection not found.");
  const resource = path.slice(3);
  if (
    resource.length < 1 ||
    resource.length > 4 ||
    !resource.every((segment) => /^[A-Za-z0-9_~.-]+$/.test(segment)) ||
    resource.some((segment) => segment === ".." || segment === ".")
  )
    throw new HttpError(404, "Not found.");
  if (
    ![
      "flows",
      "comments",
      "personas",
      "settings",
      "artifacts",
      "state",
      "history",
    ].includes(resource[0])
  )
    throw new HttpError(
      403,
      "That operation is not available through a connection.",
    );
  if (request.method !== "GET" && resource[0] !== "comments")
    requireRole(actor, "editor");
  if (request.method === "PATCH" && resource[0] === "comments")
    requireRole(actor, "editor");
  const cleanPath = resource.map((segment) => {
    if (!segment.includes("~")) return segment;
    if (!segment.startsWith(`${row.id}~`))
      throw new HttpError(400, "This resource belongs to another workspace.");
    return segment.slice(String(row.id).length + 1);
  });
  const personaDetail = resource[0] === "personas" && (["templates", "filters"].includes(resource[1]) || resource[2] === "profile");
  const requestBody = request.method === "GET" || request.method === "DELETE"
    ? undefined
    : await readJson(request, resource[0] === "comments" ? MAX_COMMENT_BODY_BYTES : resource[0] === "personas" && resource[2] === "files" ? 4_200_000 : 600_000);
  let body: string | undefined;
  if (requestBody !== undefined) {
    if (personaDetail) {
      const data = requestBody as Record<string, unknown>;
      if (typeof data.sourcePersonaId === "string") {
        const prefix = `${row.id}~`;
        if (!data.sourcePersonaId.startsWith(prefix)) throw new HttpError(400, "This persona belongs to another workspace.");
        data.sourcePersonaId = data.sourcePersonaId.slice(prefix.length);
      }
      body = JSON.stringify(data);
    } else body = JSON.stringify(scopeData(requestBody, String(row.id), "out"));
  }
  const remoteUrl = new URL(`${row.api_path}/federation/${cleanPath.join("/")}`, String(row.url));
  if (resource[0] === "personas" && resource[1] === "filters") {
    const search = new URL(request.url).search;
    if (search.length > 500) throw new HttpError(413, "Filter query is too long.");
    remoteUrl.search = search;
  }
  const response = await remoteResponse(
    remoteUrl,
    String(row.api_key),
    { method: request.method, body, role: actor.role },
  );
  if (resource[0] === "state") {
    const parsed = remoteStateSchema.safeParse(await response.json());
    if (
      !parsed.success ||
      parsed.data.project.id !== config.projectId ||
      parsed.data.instanceId !== row.instance_id
    )
      throw new HttpError(
        502,
        "The source workspace identity or response changed.",
      );
    return json(
      sourceState(
        parsed.data,
        { ...publicConnection(row), role: parsed.data.actor.role },
        config.apiPath,
        String(row.api_path),
      ),
    );
  }
  if (resource[0] === "artifacts") {
    if (
      !/^(image\/(png|jpeg|webp)|application\/octet-stream)(;|$)/i.test(
        response.headers.get("content-type") ?? "",
      )
    )
      throw new HttpError(
        502,
        "The source did not return a supported artifact.",
      );
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
    if (headers.get("Content-Type")?.startsWith("application/octet-stream"))
      headers.set("Content-Disposition", "attachment");
    return new Response(response.body, { status: response.status, headers });
  }
  const result = await response.json();
  if (resource[0] === "personas" && resource[1] === "filters")
    return json({ ...result, personaIds: result.personaIds?.map((id: string) => `${row.id}~${id}`) ?? null }, response.status);
  return json(personaDetail ? result : scopeData(result, String(row.id), "in"), response.status);
}
