import assert from "node:assert/strict";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = "gil00pita/RevisionLab";
const versionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/** Validate the release contract before giving a separate job publish permission. */
export function checkRelease({
  manifest,
  lock,
  root,
  tag,
  prerelease,
  event,
  repo,
}) {
  assert.equal(
    root.private,
    true,
    "The example application must remain private.",
  );
  assert.equal(
    manifest.name,
    "revisionlab",
    "Only the revisionlab workspace is published.",
  );
  assert.notEqual(manifest.private, true, "The package must be publishable.");
  assert.equal(
    typeof manifest.version,
    "string",
    "A package version is required.",
  );
  const match = manifest.version.match(versionPattern);
  assert.ok(
    match,
    "Use a version like 1.2.3 or 1.2.3-beta.1, without build metadata.",
  );
  const identifiers = match[4]?.split(".") ?? [];
  assert.ok(
    identifiers.every((part) => !/^0\d+$/.test(part)),
    "Numeric prerelease identifiers cannot have leading zeroes.",
  );
  assert.equal(
    lock.packages?.["packages/revisionlab"]?.version,
    manifest.version,
    "Package and package-lock.json versions must match.",
  );
  assert.equal(
    manifest.repository?.url,
    `git+https://github.com/${repository}.git`,
    "Package repository must match the trusted publisher.",
  );
  assert.equal(manifest.repository?.directory, "packages/revisionlab");
  assert.equal(manifest.publishConfig?.registry, "https://registry.npmjs.org/");
  assert.equal(manifest.publishConfig?.access, "public");
  const isPrerelease = identifiers.length > 0;
  if (event === "release") {
    assert.equal(
      repo,
      repository,
      "Publishing is restricted to the source repository.",
    );
    assert.equal(
      tag,
      `v${manifest.version}`,
      "GitHub release tag must equal v followed by the package version.",
    );
    assert.equal(
      prerelease,
      String(isPrerelease),
      "GitHub prerelease status must agree with the package version.",
    );
  }
  return {
    version: manifest.version,
    npmTag: isPrerelease ? "next" : "latest",
    filename: `revisionlab-${manifest.version}.tgz`,
  };
}

function main() {
  const read = (file) =>
    JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8"));
  const result = checkRelease({
    manifest: read("../packages/revisionlab/package.json"),
    lock: read("../package-lock.json"),
    root: read("../package.json"),
    tag: process.env.RELEASE_TAG,
    prerelease: process.env.RELEASE_PRERELEASE,
    event: process.env.GITHUB_EVENT_NAME,
    repo: process.env.GITHUB_REPOSITORY,
  });
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${result.version}\nnpm-tag=${result.npmTag}\nfilename=${result.filename}\n`,
    );
  }
  console.log(
    `Validated revisionlab@${result.version}; npm channel: ${result.npmTag}.`,
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
