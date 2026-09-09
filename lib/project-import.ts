export const PUBLIC_ENV_PREFIXES = ["NEXT_PUBLIC_", "VITE_", "REACT_APP_", "PUBLIC_"] as const;

type EnvironmentInput = {
  id: string;
  key: string;
  secret: boolean;
  phase: "build" | "runtime";
  target: "preview" | "replay" | "both";
  scope?: "project" | "prototype";
  value?: unknown;
  revealed?: boolean;
};

type PrototypeConfigurationInput = {
  installCommand: string;
  buildCommand: string;
  startCommand: string;
  port: number;
  healthPath: string;
  environmentVariables: EnvironmentInput[];
};

export function isGitHubRepositoryUrl(value: string) {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/.test(value.trim());
}

export function normalizeRepositoryLabel(value: string) {
  return value.trim().replace(/^https?:\/\//, "").replace(/\.git\/?$/, "").replace(/\/$/, "");
}

export function isSafeRepositoryRoot(value: string) {
  const segments = value.trim().split("/");
  return Boolean(value.trim()) && !value.startsWith("/") && !segments.includes("..");
}

export function isValidEnvironmentKey(value: string) {
  return /^[A-Z_][A-Z0-9_]*$/.test(value.trim());
}

export function isPublicClientVariable(value: string) {
  const key = value.trim().toUpperCase();
  return PUBLIC_ENV_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function redactEnvironmentVariables(entries: EnvironmentInput[]) {
  return entries.map(({ id, key, secret, phase, target }) => ({
    id,
    key: key.trim(),
    secret,
    phase,
    target,
  }));
}

export function partitionEnvironmentVariables(entries: EnvironmentInput[]) {
  return {
    project: redactEnvironmentVariables(entries.filter((entry) => entry.scope === "project")),
    prototype: redactEnvironmentVariables(entries.filter((entry) => entry.scope !== "project")),
  };
}

export function createPrototypeConfiguration(input: PrototypeConfigurationInput) {
  return {
    runtime: {
      installCommand: input.installCommand.trim(),
      buildCommand: input.buildCommand.trim(),
      startCommand: input.startCommand.trim(),
      port: input.port,
      healthPath: input.healthPath.trim(),
    },
    environmentVariables: redactEnvironmentVariables(input.environmentVariables),
    buildState: "awaiting-runner" as const,
  };
}

export function deriveProjectBuildState(prototypes: Array<{ buildState: "ready" | "attention" | "awaiting-runner" }>) {
  if (prototypes.some((prototype) => prototype.buildState === "awaiting-runner")) return "awaiting-runner" as const;
  if (prototypes.some((prototype) => prototype.buildState === "attention")) return "attention" as const;
  return "ready" as const;
}
