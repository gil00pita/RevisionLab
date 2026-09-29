import assert from "node:assert/strict";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRelease } from "./check-release.mjs";

const repository = "gil00pita/RevisionLab";
const registryUrl = "https://registry.npmjs.org/revisionlab";
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function releaseMode(env) {
  if (env.GITHUB_REPOSITORY !== repository) return "validate";
  if (env.GITHUB_EVENT_NAME === "release") return "release";
  if (
    env.GITHUB_EVENT_NAME === "push" &&
    env.GITHUB_REF === "refs/heads/main"
  ) return "automatic";
  return "validate";
}

/** Use the full registry document so old commit retries are also idempotent. */
export function nextRelease(registry, commit) {
  assert.match(commit, /^[a-f0-9]{40}$/, "A full source commit is required.");
  assert.equal(registry.name, "revisionlab", "Unexpected registry package.");
  assert.ok(registry.versions && typeof registry.versions === "object");
  const versions = Object.keys(registry.versions).filter((version) =>
    stableVersion.test(version),
  );
  assert.ok(versions.length, "The registry must contain a stable version.");
  for (const version of versions) {
    if (registry.versions[version].gitHead === commit) {
      return { publish: false, version };
    }
  }
  versions.sort((left, right) => {
    const a = left.split(".").map(BigInt);
    const b = right.split(".").map(BigInt);
    for (let index = 0; index < 3; index++) {
      if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
    }
    return 0;
  });
  const [major, minor, patch] = versions.at(-1).split(".");
  return { publish: true, version: `${major}.${minor}.${BigInt(patch) + 1n}` };
}

export async function readRegistry(fetchRegistry = fetch) {
  const response = await fetchRegistry(registryUrl, {
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    signal: AbortSignal.timeout(30_000),
  });
  assert.ok(response.ok, `npm registry lookup failed: HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const env = process.env;
  const root = fileURLToPath(new URL("../", import.meta.url));
  const manifestPath = resolve(root, "packages/revisionlab/package.json");
  const read = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));
  const manifest = read("packages/revisionlab/package.json");
  const lock = read("package-lock.json");
  checkRelease({
    manifest,
    lock,
    root: read("package.json"),
    tag: env.RELEASE_TAG,
    prerelease: env.RELEASE_PRERELEASE,
    event: env.GITHUB_EVENT_NAME,
    repo: env.GITHUB_REPOSITORY,
  });
  const mode = releaseMode(env);
  let publish = mode === "release";
  let message = mode === "release"
    ? `Preparing explicit release revisionlab@${manifest.version}.`
    : "Validation only; this event does not publish to npm.";
  if (mode === "automatic") {
    const release = nextRelease(await readRegistry(), env.GITHUB_SHA);
    publish = release.publish;
    if (publish) {
      // Preserve the source identity in the tarball and npm registry for retries.
      manifest.version = release.version;
      manifest.gitHead = env.GITHUB_SHA;
      lock.packages["packages/revisionlab"].version = release.version;
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      writeFileSync(resolve(root, "package-lock.json"), `${JSON.stringify(lock, null, 2)}\n`);
      message = `Prepared revisionlab@${release.version} for ${env.GITHUB_SHA}; publication follows successful validation.`;
    } else {
      message = `Commit ${env.GITHUB_SHA} is already published as revisionlab@${release.version}; skipping publication.`;
    }
  }
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `publish=${publish}\n`);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${message}\n`);
  console.log(message);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
