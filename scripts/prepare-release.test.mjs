import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { nextRelease, readRegistry, releaseMode } from "./prepare-release.mjs";

const commit = "a".repeat(40);
const mainEvent = {
  GITHUB_REPOSITORY: "gil00pita/RevisionLab",
  GITHUB_EVENT_NAME: "push",
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: commit,
};
const registry = {
  name: "revisionlab",
  versions: { "0.1.1": {}, "0.1.9": {}, "0.1.10": {}, "1.0.0-beta.1": {} },
};

test("only source main pushes select automatic publication", () => {
  assert.equal(releaseMode(mainEvent), "automatic");
  assert.equal(releaseMode({ ...mainEvent, GITHUB_EVENT_NAME: "release" }), "release");
  for (const change of [
    { GITHUB_REPOSITORY: "someone/fork" },
    { GITHUB_REF: "refs/heads/feature" },
    { GITHUB_EVENT_NAME: "pull_request" },
    { GITHUB_EVENT_NAME: "workflow_dispatch" },
    { GITHUB_EVENT_NAME: "pull_request_target" },
  ]) {
    assert.equal(releaseMode({ ...mainEvent, ...change }), "validate");
  }
});

test("increments the highest stable patch numerically, ignoring prereleases and tag rollback", () => {
  assert.deepEqual(nextRelease({ ...registry, "dist-tags": { latest: "0.1.1" } }, commit), {
    publish: true, version: "0.1.11",
  });
  assert.equal(nextRelease({
    name: "revisionlab", versions: { "1.9.99": {}, "2.0.0": {} },
  }, commit).version, "2.0.1");
});

test("retrying a previously published commit skips even after newer releases", () => {
  assert.deepEqual(nextRelease({
    ...registry, versions: { ...registry.versions, "0.1.1": { gitHead: commit } },
  }, commit), { publish: false, version: "0.1.1" });
  assert.equal(nextRelease({
    ...registry, versions: { ...registry.versions, "1.0.0-beta.1": { gitHead: commit } },
  }, commit).publish, true);
});

test("missing or invalid registry metadata and source identities fail closed", () => {
  for (const value of [
    {}, { name: "other", versions: registry.versions },
    { name: "revisionlab", versions: {} },
    { name: "revisionlab", versions: { "0.2.0-beta.1": {} } },
  ]) assert.throws(() => nextRelease(value, commit));
  for (const value of ["", "main", "abc123", "a".repeat(40) + "\ninjected=true"]) {
    assert.throws(() => nextRelease(registry, value));
  }
});

test("registry errors never fall back to a guessed version", async () => {
  for (const status of [404, 429, 500]) {
    await assert.rejects(readRegistry(async () => ({ ok: false, status })), /lookup failed/);
  }
  await assert.rejects(readRegistry(async () => { throw new Error("offline"); }), /offline/);
  await assert.rejects(readRegistry(async () => ({
    ok: true, json: async () => { throw new Error("invalid JSON"); },
  })), /invalid JSON/);
  assert.deepEqual(await readRegistry(async (url, options) => {
    assert.equal(url, "https://registry.npmjs.org/revisionlab");
    assert.equal(options.headers.Accept, "application/json");
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => registry };
  }), registry);
});

test("automatic preparation updates workspace and lockfile before packing, leaving the private root version alone", async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "revisionlab-auto-release-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await mkdir(path.join(temporary, "scripts"));
  await mkdir(path.join(temporary, "packages/revisionlab"), { recursive: true });
  for (const script of ["prepare-release.mjs", "check-release.mjs"]) {
    await cp(new URL(script, import.meta.url), path.join(temporary, "scripts", script));
  }
  const root = { name: "release-fixture", version: "0.1.0", private: true, workspaces: ["packages/*"] };
  const manifest = {
    name: "revisionlab", version: "0.1.1",
    repository: { url: "git+https://github.com/gil00pita/RevisionLab.git", directory: "packages/revisionlab" },
    publishConfig: { access: "public", registry: "https://registry.npmjs.org/" },
  };
  for (const [file, data] of Object.entries({
    "package.json": root,
    "packages/revisionlab/package.json": manifest,
    "package-lock.json": {
      name: root.name, version: root.version, lockfileVersion: 3, requires: true,
      packages: { "": root, "packages/revisionlab": manifest },
    },
  })) await writeFile(path.join(temporary, file), JSON.stringify(data));
  await writeFile(path.join(temporary, "registry.mjs"),
    `globalThis.fetch = async () => ({ ok: true, json: async () => (${JSON.stringify(registry)}) });\n`);
  const output = path.join(temporary, "output");
  const env = { ...process.env, ...mainEvent, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: path.join(temporary, "summary") };
  execFileSync(process.execPath, ["--import", "./registry.mjs", "scripts/prepare-release.mjs"], {
    cwd: temporary, env, timeout: 30_000,
  });
  const read = async (file) => JSON.parse(await readFile(path.join(temporary, file), "utf8"));
  assert.equal((await read("packages/revisionlab/package.json")).version, "0.1.11");
  assert.equal((await read("packages/revisionlab/package.json")).gitHead, commit);
  assert.equal((await read("package-lock.json")).packages["packages/revisionlab"].version, "0.1.11");
  assert.equal((await read("package.json")).version, "0.1.0");
  assert.equal(await readFile(output, "utf8"), "publish=true\n");
  execFileSync(process.execPath, ["scripts/check-release.mjs"], { cwd: temporary, env });
  execFileSync("npm", ["pack", "--workspace", "revisionlab", "--ignore-scripts"], { cwd: temporary, stdio: "pipe" });
  const packed = JSON.parse(execFileSync("tar", ["-xOf", path.join(temporary, "revisionlab-0.1.11.tgz"), "package/package.json"], { encoding: "utf8" }));
  assert.equal(packed.version, "0.1.11");
  assert.equal(packed.gitHead, commit);

  const beforeManifest = await readFile(path.join(temporary, "packages/revisionlab/package.json"), "utf8");
  const beforeLock = await readFile(path.join(temporary, "package-lock.json"), "utf8");
  const publishedRegistry = { ...registry, versions: { ...registry.versions, "0.1.11": packed } };
  await writeFile(path.join(temporary, "registry.mjs"),
    `globalThis.fetch = async () => ({ ok: true, json: async () => (${JSON.stringify(publishedRegistry)}) });\n`);
  await writeFile(output, "");
  execFileSync(process.execPath, ["--import", "./registry.mjs", "scripts/prepare-release.mjs"], { cwd: temporary, env });
  assert.equal(await readFile(output, "utf8"), "publish=false\n");

  // Non-publishing events must not even contact the registry.
  await writeFile(path.join(temporary, "registry.mjs"),
    "globalThis.fetch = async () => { throw new Error('Unexpected registry request'); };\n");
  for (const event of ["pull_request", "workflow_dispatch"]) {
    await writeFile(output, "");
    execFileSync(process.execPath, ["--import", "./registry.mjs", "scripts/prepare-release.mjs"], {
      cwd: temporary, env: { ...env, GITHUB_EVENT_NAME: event },
    });
    assert.equal(await readFile(output, "utf8"), "publish=false\n");
  }
  assert.equal(await readFile(path.join(temporary, "packages/revisionlab/package.json"), "utf8"), beforeManifest);
  assert.equal(await readFile(path.join(temporary, "package-lock.json"), "utf8"), beforeLock);
});
