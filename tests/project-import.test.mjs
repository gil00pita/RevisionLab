import assert from "node:assert/strict";
import test from "node:test";
import {
  createPrototypeConfiguration,
  deriveProjectBuildState,
  isGitHubRepositoryUrl,
  isPublicClientVariable,
  isSafeRepositoryRoot,
  isValidEnvironmentKey,
  partitionEnvironmentVariables,
  redactEnvironmentVariables,
} from "../lib/project-import.ts";

test("GitHub repository URLs require an HTTPS owner and repository", () => {
  assert.equal(isGitHubRepositoryUrl("https://github.com/acme/returns"), true);
  assert.equal(isGitHubRepositoryUrl("https://github.com/acme/returns.git"), true);
  assert.equal(isGitHubRepositoryUrl("git@github.com:acme/returns.git"), false);
  assert.equal(isGitHubRepositoryUrl("https://example.com/acme/returns"), false);
});

test("prototype roots stay repository-relative", () => {
  assert.equal(isSafeRepositoryRoot("."), true);
  assert.equal(isSafeRepositoryRoot("apps/checkout"), true);
  assert.equal(isSafeRepositoryRoot("../private"), false);
  assert.equal(isSafeRepositoryRoot("/workspace/app"), false);
});

test("environment keys use a portable uppercase form", () => {
  assert.equal(isValidEnvironmentKey("PREVIEW_API_URL"), true);
  assert.equal(isValidEnvironmentKey("1TOKEN"), false);
  assert.equal(isValidEnvironmentKey("api-url"), false);
});

test("public client prefixes are warned consistently", () => {
  assert.equal(isPublicClientVariable("NEXT_PUBLIC_API_URL"), true);
  assert.equal(isPublicClientVariable("VITE_CHECKOUT_KEY"), true);
  assert.equal(isPublicClientVariable("SESSION_SIGNING_KEY"), false);
});

test("environment values and reveal state are redacted from persisted metadata", () => {
  const [saved] = redactEnvironmentVariables([{
    id: "env-1",
    key: "  SESSION_SIGNING_KEY  ",
    secret: true,
    phase: "runtime",
    target: "preview",
    scope: "prototype",
    value: "do-not-persist",
    revealed: true,
  }]);
  assert.deepEqual(saved, {
    id: "env-1",
    key: "SESSION_SIGNING_KEY",
    secret: true,
    phase: "runtime",
    target: "preview",
  });
  assert.equal(JSON.stringify(saved).includes("do-not-persist"), false);
});

test("prototype runtime configuration retains every executable field", () => {
  const configuration = createPrototypeConfiguration({
    installCommand: " npm ci ",
    buildCommand: " npm run build ",
    startCommand: " npm start ",
    port: 4100,
    healthPath: " /health ",
    environmentVariables: [],
  });
  assert.deepEqual(configuration.runtime, {
    installCommand: "npm ci",
    buildCommand: "npm run build",
    startCommand: "npm start",
    port: 4100,
    healthPath: "/health",
  });
  assert.equal(configuration.buildState, "awaiting-runner");
});

test("project defaults and prototype overrides remain separately owned", () => {
  const variables = [
    { id: "shared", key: "API_HOST", secret: false, phase: "runtime", target: "both", scope: "project", value: "shared" },
    { id: "override", key: "CHECKOUT_TOKEN", secret: true, phase: "runtime", target: "preview", scope: "prototype", value: "private" },
  ];
  const partitioned = partitionEnvironmentVariables(variables);
  assert.deepEqual(partitioned.project.map((entry) => entry.key), ["API_HOST"]);
  assert.deepEqual(partitioned.prototype.map((entry) => entry.key), ["CHECKOUT_TOKEN"]);
  assert.equal(deriveProjectBuildState([{ buildState: "ready" }, { buildState: "awaiting-runner" }]), "awaiting-runner");
});
