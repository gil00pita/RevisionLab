import assert from "node:assert/strict";
import test from "node:test";
import { checkRelease } from "./check-release.mjs";

function release(version = "0.1.0") {
  return {
    manifest: {
      name: "revisionlab",
      version,
      repository: {
        url: "git+https://github.com/gil00pita/RevisionLab.git",
        directory: "packages/revisionlab",
      },
      publishConfig: {
        access: "public",
        registry: "https://registry.npmjs.org/",
      },
    },
    root: { private: true },
    lock: { packages: { "packages/revisionlab": { version } } },
    tag: `v${version}`,
    prerelease: String(version.includes("-")),
    event: "release",
    repo: "gil00pita/RevisionLab",
  };
}

test("stable versions publish to latest, prereleases to next", () => {
  assert.deepEqual(checkRelease(release()), {
    version: "0.1.0",
    npmTag: "latest",
    filename: "revisionlab-0.1.0.tgz",
  });
  assert.deepEqual(checkRelease(release("0.2.0-beta.1")), {
    version: "0.2.0-beta.1",
    npmTag: "next",
    filename: "revisionlab-0.2.0-beta.1.tgz",
  });
});

test("release tags and prerelease flags must match the checked-out version", () => {
  for (const patch of [
    { tag: "v0.2.0" },
    { tag: "0.1.0" },
    { tag: "v0.1.0\ninjected=true" },
    { tag: undefined },
    { prerelease: "true" },
  ]) {
    assert.throws(() => checkRelease({ ...release(), ...patch }));
  }
  assert.throws(() =>
    checkRelease({ ...release("0.2.0-beta.1"), prerelease: "false" }),
  );
});

test("fork releases cannot publish through the source repository contract", () => {
  assert.throws(() =>
    checkRelease({ ...release(), repo: "someone/RevisionLab" }),
  );
});

test("non-release checks validate the package without publishing or requiring a tag", () => {
  assert.equal(
    checkRelease({
      ...release(),
      event: "pull_request",
      tag: undefined,
      prerelease: undefined,
      repo: "someone/fork",
    }).npmTag,
    "latest",
  );
});

test("lockfile versions cannot drift from the package", () => {
  const input = release();
  input.lock.packages["packages/revisionlab"].version = "0.0.9";
  assert.throws(() => checkRelease(input), /versions must match/);
});

test("invalid or unsafe version strings are rejected", () => {
  for (const version of [
    "01.2.3",
    "1.2",
    "1.2.3+build",
    "1.2.3-beta.01",
    "1.2.3-",
    "1.2.3\nfilename=other",
    "../other",
  ]) {
    assert.throws(() => checkRelease(release(version)));
  }
});

test("publishing only targets the public npm package, never the example app", () => {
  const changes = [
    (input) => {
      input.root.private = false;
    },
    (input) => {
      input.manifest.private = true;
    },
    (input) => {
      input.manifest.name = "revisionlab-example";
    },
    (input) => {
      input.manifest.repository.url = "git+https://github.com/other/repo.git";
    },
    (input) => {
      input.manifest.publishConfig.registry = "https://npm.pkg.github.com/";
    },
    (input) => {
      input.manifest.publishConfig.access = "restricted";
    },
  ];
  for (const change of changes) {
    const input = release();
    change(input);
    assert.throws(() => checkRelease(input));
  }
});
