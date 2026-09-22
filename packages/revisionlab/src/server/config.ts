import type { RevisionLabConfig } from "./types.js";
import { HttpError } from "./security.js";

export function defineRevisionLabConfig(
  config: RevisionLabConfig,
): RevisionLabConfig {
  return config;
}

export function resolveConfig(
  config: RevisionLabConfig,
): Required<
  Pick<RevisionLabConfig, "projectId" | "projectName" | "basePath" | "apiPath">
> &
  RevisionLabConfig {
  if (!config.projectId.trim() || !config.projectName.trim()) {
    throw new HttpError(503, "RevisionLab needs a project ID and name.");
  }
  const databaseUrl =
    config.databaseUrl?.trim() ||
    process.env.REVISIONLAB_DATABASE_URL?.trim() ||
    "file:.revisionlab/revisionlab.db";
  if (process.env.VERCEL && databaseUrl.startsWith("file:")) {
    throw new HttpError(
      503,
      "Configure REVISIONLAB_DATABASE_URL for durable hosted storage.",
    );
  }
  for (const path of [
    config.basePath ?? "/revisionlab",
    config.apiPath ?? "/api/revisionlab",
  ]) {
    if (!/^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(path) || path.endsWith("/")) {
      throw new HttpError(
        503,
        "RevisionLab paths must be absolute paths without a trailing slash.",
      );
    }
  }
  return {
    ...config,
    databaseUrl,
    databaseAuthToken:
      config.databaseAuthToken?.trim() ||
      process.env.REVISIONLAB_DATABASE_AUTH_TOKEN?.trim() ||
      undefined,
    ownerEmail:
      (
        config.ownerEmail?.trim() || process.env.REVISIONLAB_OWNER_EMAIL?.trim()
      )?.toLowerCase() || undefined,
    resendApiKey:
      config.resendApiKey?.trim() ||
      process.env.RESEND_API_KEY?.trim() ||
      undefined,
    emailFrom:
      config.emailFrom?.trim() ||
      process.env.REVISIONLAB_EMAIL_FROM?.trim() ||
      undefined,
    basePath: config.basePath ?? "/revisionlab",
    apiPath: config.apiPath ?? "/api/revisionlab",
    localOwner:
      process.env.NODE_ENV === "development" &&
      process.env.REVISIONLAB_LOCAL_OWNER !== "false" &&
      (config.localOwner ?? true),
    artifactsDirectory: config.artifactsDirectory ?? ".revisionlab/artifacts",
  };
}

export type ResolvedConfig = ReturnType<typeof resolveConfig>;
