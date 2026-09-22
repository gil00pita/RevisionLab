import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateArchiveListing,
  validateArchivePath,
} from "./verify-package.mjs";

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
