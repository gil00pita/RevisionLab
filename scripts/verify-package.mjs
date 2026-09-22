import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../", import.meta.url));
const requiredFiles = [
  "package.json",
  "README.md",
  "LICENSE",
  "assets/revisionlab-logo.svg",
  "dist/cli/index.js",
  "dist/index.js",
  "dist/index.d.ts",
  "dist/server/index.js",
  "dist/server/index.d.ts",
];

export function validateArchivePath(filename, directory = false) {
  const name = directory ? filename.replace(/\/$/, "") : filename;
  const parts = name.split("/");
  assert.ok(
    /^[A-Za-z0-9_./-]+$/.test(name) &&
      parts.every(
        (part) =>
          part && part !== "." && part !== ".." && !part.startsWith("."),
      ),
    `Unsafe archive path: ${filename}`,
  );
  assert.equal(parts[0], "package", `Unexpected archive root: ${filename}`);
  const relative = parts.slice(1).join("/");
  assert.ok(
    directory
      ? !relative || /^(dist|assets)(\/|$)/.test(relative)
      : ["package.json", "README.md", "LICENSE"].includes(relative) ||
          /^(dist|assets)\//.test(relative),
    `Unexpected package file: ${filename}`,
  );
  assert.ok(
    !parts.some((part) =>
      /^(node_modules|backups|artifacts|coverage)$/i.test(part),
    ) &&
      !/\.(?:db|sqlite\d*|env|pem|key)(?:[-.]|$)/i.test(relative) &&
      !/\.test\.|test-fixture/.test(relative),
    `Private, runtime, or test file included: ${filename}`,
  );
  return name;
}

export function validateArchiveListing(namesText, verboseText) {
  const names = namesText.trimEnd().split("\n");
  const details = verboseText.trimEnd().split("\n");
  assert.ok(names.length && names[0], "Archive is empty");
  assert.equal(names.length, details.length, "Ambiguous archive listing");
  const entries = new Map();
  for (const [index, name] of names.entries()) {
    const detail = details[index];
    const directory = detail.startsWith("d");
    assert.ok(
      (directory || detail.startsWith("-")) && !/ -> | link to /.test(detail),
      "Archive links and special files are not allowed",
    );
    assert.ok(detail.endsWith(` ${name}`), "Ambiguous archive entry");
    const filename = validateArchivePath(name, directory);
    assert.ok(!entries.has(filename), `Duplicate archive path: ${filename}`);
    entries.set(filename, { directory });
  }
  return entries;
}

async function verifyMetadata(entries, expected, extracted) {
  for (const filename of requiredFiles) {
    const entry = entries.get(`package/${filename}`);
    assert.ok(entry && !entry.directory, `Missing packaged file: ${filename}`);
    entry.data = await readFile(path.join(extracted, filename));
    assert.ok(entry.data.length, `Empty packaged file: ${filename}`);
  }
  const manifest = JSON.parse(
    entries.get("package/package.json").data.toString(),
  );
  assert.equal(manifest.name, expected.name, "Wrong package name");
  assert.equal(manifest.version, expected.version, "Wrong package version");
  assert.equal(
    manifest.private,
    undefined,
    "Published package must not be private",
  );
  assert.equal(manifest.type, "module");
  assert.equal(manifest.license, "MIT");
  assert.deepEqual(manifest.bin, { revisionlab: "dist/cli/index.js" });
  for (const [entry, stem] of [
    [".", "dist/index"],
    ["./server", "dist/server/index"],
  ]) {
    assert.equal(manifest.exports?.[entry]?.import, `./${stem}.js`);
    assert.equal(manifest.exports?.[entry]?.types, `./${stem}.d.ts`);
  }
  const cli = entries.get("package/dist/cli/index.js");
  assert.ok(
    (await stat(path.join(extracted, "dist/cli/index.js"))).mode & 0o111,
    "CLI must be executable",
  );
  assert.match(cli.data.toString(), /^#!\/usr\/bin\/env node\r?\n/);
  assert.match(
    entries.get("package/dist/index.js").data.toString(),
    /^["']use client["'];/,
  );
  assert.match(entries.get("package/LICENSE").data.toString(), /MIT License/);
  return manifest;
}

async function snapshot(directory, prefix = "") {
  const files = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory())
      Object.assign(files, await snapshot(filename, `${relative}/`));
    else files[relative] = await readFile(filename, "utf8");
  }
  return files;
}

async function smokeCli(extracted, host) {
  await mkdir(path.join(host, "src/app"), { recursive: true });
  await writeFile(
    path.join(host, "package.json"),
    JSON.stringify({
      name: "revisionlab-package-smoke",
      private: true,
      scripts: { dev: "next dev", build: "next build" },
      dependencies: { next: "16.3.5", react: "19.2.8", "react-dom": "19.2.8" },
    }),
  );
  await writeFile(
    path.join(host, "src/app/layout.tsx"),
    "export default function RootLayout({ children }) { return <html><body>{children}</body></html>; }\n",
  );
  const cli = path.join(extracted, "dist/cli/index.js");
  const run = (...args) =>
    execFileSync(process.execPath, [cli, ...args], {
      cwd: host,
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env, PATH: "", NEXT_TELEMETRY_DISABLED: "1" },
    });
  assert.match(run("--help"), /Usage: npx revisionlab init/);
  assert.match(
    run("init", "--no-install", "--protect"),
    /Initialized RevisionLab/,
  );
  const before = await snapshot(host);
  for (const filename of [
    "revisionlab.config.ts",
    "src/app/revisionlab/page.tsx",
    "src/app/revisionlab/access/page.tsx",
    "src/app/api/revisionlab/[...path]/route.ts",
    "src/proxy.ts",
    ".revisionlab/installation.json",
  ]) {
    assert.ok(before[filename], `CLI did not generate ${filename}`);
  }
  assert.match(
    before["src/app/layout.tsx"],
    /<RevisionLabEmbeddedWidget\s*\/>/,
  );
  assert.match(
    before["src/app/api/revisionlab/[...path]/route.ts"],
    /createRevisionLabHandler/,
  );
  assert.match(before["src/proxy.ts"], /protectRevisionLab/);
  assert.equal(
    JSON.parse(before["package.json"]).scripts.build,
    "next build --webpack",
  );
  assert.match(
    run("init", "--no-install", "--protect"),
    /Integration is already installed/,
  );
  assert.deepEqual(
    await snapshot(host),
    before,
    "Repeated init changed generated files",
  );
}

export async function verifyPackage(filename) {
  const archive = path.resolve(filename);
  const tar = (...args) =>
    execFileSync("tar", args, {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      timeout: 30_000,
    });
  const entries = validateArchiveListing(
    tar("-tzf", archive),
    tar("-tvzf", archive),
  );
  const expected = JSON.parse(
    await readFile(
      path.join(repository, "packages/revisionlab/package.json"),
      "utf8",
    ),
  );
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "revisionlab-package-check-"),
  );
  try {
    tar(
      "-xzf",
      archive,
      "-C",
      temporary,
      "--no-same-owner",
      "--no-same-permissions",
    );
    const extracted = path.join(temporary, "package");
    const manifest = await verifyMetadata(entries, expected, extracted);
    await symlink(
      path.join(repository, "node_modules"),
      path.join(extracted, "node_modules"),
      "dir",
    );
    await smokeCli(extracted, path.join(temporary, "host"));
    return {
      name: manifest.name,
      version: manifest.version,
      files: entries.size,
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    assert.equal(
      process.argv.length,
      3,
      "Usage: node scripts/verify-package.mjs <package.tgz>",
    );
    const result = await verifyPackage(path.resolve(process.argv[2]));
    console.log(
      `Verified ${result.name}@${result.version}: ${result.files} archive entries and protected/idempotent packed CLI smoke.`,
    );
    console.log(
      "Uses repository dependencies; no fresh dependency installation or host production build was performed.",
    );
  } catch (error) {
    console.error(`Package verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}
