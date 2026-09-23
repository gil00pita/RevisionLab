import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { TestContext } from "node:test";
import { pathToFileURL } from "node:url";
import { resolvePackageSpec } from "./package-spec.js";

async function manifestFixture(t: TestContext, manifest: unknown) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "revisionlab-package-spec-"),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const filename = path.join(root, "package.json");
  await writeFile(filename, JSON.stringify(manifest));
  return pathToFileURL(filename);
}

test("defaults to the executing package's exact stable version", async (t) => {
  const manifest = await manifestFixture(t, {
    name: "revisionlab",
    version: "1.2.3",
  });
  assert.equal(
    await resolvePackageSpec(undefined, manifest),
    "revisionlab@1.2.3",
  );
});

test("retains the executing package's scoped name and prerelease version", async (t) => {
  const manifest = await manifestFixture(t, {
    name: "@revisionlab/review",
    version: "2.0.0-beta.3",
  });
  assert.equal(
    await resolvePackageSpec(undefined, manifest),
    "@revisionlab/review@2.0.0-beta.3",
  );
});

test("explicit registry overrides take precedence without reading a manifest", async () => {
  const absent = pathToFileURL("/nonexistent/revisionlab-package.json");
  assert.equal(
    await resolvePackageSpec("revisionlab@next", absent),
    "revisionlab@next",
  );
});

test("local tarball overrides retain absolute-path resolution", async () => {
  assert.equal(
    await resolvePackageSpec("./local builds/revisionlab.tgz"),
    path.resolve("./local builds/revisionlab.tgz"),
  );
  assert.equal(
    await resolvePackageSpec("file:../revisionlab.tgz"),
    path.resolve("../revisionlab.tgz"),
  );
});

test("invalid package metadata fails instead of falling back to latest", async (t) => {
  const manifest = await manifestFixture(t, { name: "revisionlab" });
  assert.throws(
    () => resolvePackageSpec(undefined, manifest),
    /missing its name or version/,
  );
});
