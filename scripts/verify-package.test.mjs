import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  validateArchiveListing,
  validateArchivePath,
} from "./verify-package.mjs";

test("a clean package build produces an executable CLI before packing", async (t) => {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "revisionlab-build-check-"),
  );
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const packageRoot = new URL("../packages/revisionlab/", import.meta.url);
  const manifest = JSON.parse(
    await readFile(new URL("package.json", packageRoot), "utf8"),
  );
  await mkdir(path.join(temporary, "src/cli"), { recursive: true });
  await writeFile(
    path.join(temporary, "package.json"),
    JSON.stringify({
      name: "revisionlab-build-check",
      private: true,
      type: "module",
      scripts: { build: manifest.scripts.build },
    }),
  );
  await writeFile(
    path.join(temporary, "tsconfig.json"),
    await readFile(new URL("tsconfig.json", packageRoot)),
  );
  await writeFile(
    path.join(temporary, "src/cli/index.ts"),
    "#!/usr/bin/env node\nconsole.log('clean CLI fixture');\n",
  );
  await symlink(
    fileURLToPath(new URL("../node_modules", import.meta.url)),
    path.join(temporary, "node_modules"),
    "dir",
  );
  await symlink(
    fileURLToPath(new URL("scripts", packageRoot)),
    path.join(temporary, "scripts"),
    "dir",
  );
  execFileSync("npm", ["run", "build"], {
    cwd: temporary,
    encoding: "utf8",
    timeout: 30_000,
  });
  const cli = path.join(temporary, "dist/cli/index.js");
  assert.ok((await stat(cli)).mode & 0o111, "Clean build CLI must be executable");
  assert.match(await readFile(cli, "utf8"), /^#!\/usr\/bin\/env node\r?\n/);
});

test("accepts standard BSD/GNU tar listings and package directories", () => {
  const entries = validateArchiveListing(
    "package/\npackage/dist/index.js\n",
    "drwxr-xr-x  0 0 0 0 Oct 26 1985 package/\n-rw-r--r-- 0/0 12 1985-10-26 08:15 package/dist/index.js\n",
  );
  assert.equal(entries.get("package").directory, true);
  assert.equal(entries.get("package/dist/index.js").directory, false);
});

test("rejects traversal, absolute paths, and ambiguous filenames", () => {
  for (const filename of [
    "/package/dist/index.js",
    "package/../index.js",
    "package/dist/../../index.js",
    "package/dist\\index.js",
    "package//dist/index.js",
    "package/dist/file\nname.js",
  ]) {
    assert.throws(() => validateArchivePath(filename), /Unsafe archive path/);
  }
});

test("rejects private data, runtime files, tests, and non-allowlisted package files", () => {
  for (const filename of [
    "package/.env",
    "package/.revisionlab/revisionlab.db",
    "package/dist/.env",
    "package/dist/revisionlab.sqlite",
    "package/dist/token.pem",
    "package/dist/node_modules/foo.js",
    "package/dist/api.test.js",
    "package/src/index.ts",
    "package/package-lock.json",
  ]) {
    assert.throws(() => validateArchivePath(filename));
  }
});

test("rejects links and special files before extraction", () => {
  const name = "package/dist/index.js";
  for (const detail of [
    `lrwxrwxrwx 0 0 0 ${name} -> /etc/passwd`,
    `hrw-r--r-- 0 0 0 ${name} link to /etc/passwd`,
    `-rw-r--r-- 0 0 0 ${name} link to /etc/passwd`,
    `crw-r--r-- 0 0 0 ${name}`,
  ]) {
    assert.throws(
      () => validateArchiveListing(name, detail),
      /links and special/,
    );
  }
});

test("rejects duplicate or mismatched archive listings", () => {
  const name = "package/dist/index.js";
  const detail = `-rw-r--r-- 0 0 12 ${name}`;
  assert.throws(
    () => validateArchiveListing(`${name}\n${name}`, `${detail}\n${detail}`),
    /Duplicate archive path/,
  );
  assert.throws(
    () => validateArchiveListing(`${name}\n${name}`, detail),
    /Ambiguous archive listing/,
  );
  assert.throws(
    () => validateArchiveListing(name, `${detail}.extra`),
    /Ambiguous archive entry/,
  );
});
