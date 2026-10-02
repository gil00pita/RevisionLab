import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { z } from "zod";
import type { ResolvedConfig } from "../config.js";
import { HttpError, json, readJson } from "../security.js";
import { instanceTransport, instanceUrl } from "./transport.js";
import { installationId } from "./federation.js";
const apiPath = z
  .string()
  .regex(/^\/(?!\/)[a-zA-Z0-9/_-]+$/)
  .max(200)
  .refine((value) => !value.endsWith("/"));
const connectionInput = z
  .object({
    name: z.string().trim().min(1).max(80),
    url: z.string().max(2000),
    apiKey: z.string().regex(/^rlk_[A-Za-z0-9_-]{43}$/),
    apiPath: apiPath.default("/api/revisionlab"),
  })
  .strict();
const manifestSchema = z.object({
  protocol: z.literal(1),
  projectId: z.string(),
  projectName: z.string(),
  instanceId: z.string().uuid(),
  apiPath,
  basePath: apiPath,
  role: z.enum(["editor", "commenter"]),
});
export async function readConnections(client: Client) {
  return (
    await client.execute(
      "SELECT * FROM workspace_instances ORDER BY created_at,id",
    )
  ).rows;
}
export function publicConnection(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    url: String(row.url),
    instanceId: String(row.instance_id),
    apiPath: String(row.api_path),
    basePath: String(row.base_path),
  };
}
export async function remoteResponse(
  url: URL,
  key: string,
  options?: { method?: string; body?: string; role?: string },
) {
  const response = await instanceTransport.send(url, key, options);
  if (response.status === 401 || response.status === 403)
    throw new HttpError(
      response.status,
      "The instance API key is invalid, revoked, or lacks permission. Update the connection key.",
    );
  if (!response.ok) {
    if ([400, 404, 409, 413, 429].includes(response.status)) {
      const messages: Record<number, string> = {
        400: "The source rejected this change. Check the values and try again.",
        404: "The requested source resource no longer exists.",
        409: "The source changed or the operation conflicts with its current state. Refresh and retry.",
        413: "This change exceeds the source workspace size limit.",
        429: "The source is busy. Wait before trying again.",
      };
      throw new HttpError(response.status, messages[response.status]);
    }
    throw new HttpError(
      502,
      "The source workspace could not complete the request.",
    );
  }
  return response;
}
export async function handleConnections(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
) {
  if (request.method === "GET" && path.length === 1)
    return json((await readConnections(client)).map(publicConnection));
  if (request.method === "PATCH" && path.length === 2) {
    z.object({ remove: z.literal(true) })
      .strict()
      .parse(await readJson(request));
    await client.execute({
      sql: "DELETE FROM workspace_instances WHERE id=?",
      args: [path[1]],
    });
    return json({ removed: true });
  }
  if (request.method !== "POST" || path.length > 2)
    throw new HttpError(404, "Not found.");
  const input = connectionInput.parse(await readJson(request));
  const origin = instanceUrl(input.url);
  if (
    origin === new URL(request.url).origin &&
    input.apiPath === config.apiPath
  )
    throw new HttpError(
      400,
      "This installation is already included as This workspace.",
    );
  const result = await remoteResponse(
    new URL(`${input.apiPath}/federation/manifest`, origin),
    input.apiKey,
  );
  const parsed = manifestSchema.safeParse(await result.json());
  if (!parsed.success)
    throw new HttpError(
      400,
      "The URL must run a compatible RevisionLab installation with workspace connections enabled.",
    );
  const manifest = parsed.data;
  if (manifest.projectId !== config.projectId)
    throw new HttpError(
      400,
      "Only instances with the same RevisionLab project ID can be connected.",
    );
  if (manifest.instanceId === (await installationId(client)))
    throw new HttpError(
      400,
      "This installation is already included as This workspace.",
    );
  if (manifest.apiPath !== input.apiPath)
    throw new HttpError(
      400,
      "The source API path does not match this connection.",
    );
  const id = path[1] ?? randomUUID();
  if (
    path[1] &&
    !(
      await client.execute({
        sql: "SELECT id FROM workspace_instances WHERE id=?",
        args: [id],
      })
    ).rows.length
  )
    throw new HttpError(404, "Connection not found.");
  if (
    (
      await client.execute({
        sql: "SELECT id FROM workspace_instances WHERE (url=? OR instance_id=?) AND id<>?",
        args: [origin, manifest.instanceId, id],
      })
    ).rows.length
  )
    throw new HttpError(409, "This workspace is already connected.");
  try {
    await client.execute({
      sql: `INSERT INTO workspace_instances (id,name,url,instance_id,api_path,base_path,api_key,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,url=excluded.url,instance_id=excluded.instance_id,api_path=excluded.api_path,base_path=excluded.base_path,api_key=excluded.api_key`,
      args: [
        id,
        input.name,
        origin,
        manifest.instanceId,
        input.apiPath,
        manifest.basePath,
        input.apiKey,
        new Date().toISOString(),
      ],
    });
  } catch (error) {
    if (String(error).includes("UNIQUE"))
      throw new HttpError(409, "This workspace is already connected.");
    throw error;
  }
  return json(
    {
      id,
      name: input.name,
      url: origin,
      instanceId: manifest.instanceId,
      apiPath: input.apiPath,
      basePath: manifest.basePath,
    },
    path[1] ? 200 : 201,
  );
}
