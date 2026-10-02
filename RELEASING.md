# Publishing RevisionLab to npm

Package: **`revisionlab`**, with **`gil00pita`** as the intended npm owner selected by the maintainer. Source: [gil00pita/RevisionLab](https://github.com/gil00pita/RevisionLab). The maintainer reports completing setup and publication; the registry confirms `revisionlab@0.1.1` under `latest` as of 29 September 2026. The example application remains private and is never published.

The repository contains `.github/workflows/publish.yml`. After this change is merged, each merge or direct push to `main` automatically selects the next stable patch, validates it, and publishes its verified tarball to npm. Pull requests and manual workflow runs validate without publishing. Explicit GitHub Releases also remain supported; a Git tag by itself does not publish. This workspace change must first be committed and pushed/merged into GitHub.

## One-time setup

Initial publication is complete. The steps below are retained as setup reference; do not repeat publication of an existing version. The GitHub `npm` environment was checked on 29 September 2026 and has no approval or branch restrictions. npm trusted-publisher settings and live OIDC publication have not been independently verified. For routine releases, use the automatic-main workflow below.

1. Sign in to npm as `gil00pita`, with a verified email and two-factor authentication. Use Node.js 24 for the release tooling; GitHub runs Node 24, Yarn Classic 1.22.22 for dependency installation, and npm 11.19.1 for packing and trusted publication. Do not paste tokens or recovery codes into Git or chat.
2. From the repository root, validate and prepare the first package:

   ```bash
   yarn install --frozen-lockfile --non-interactive
   npm run release:check
   npm run test:release
   npm run lint
   npm run build
   npm run test:package
   npm run release:pack
   node scripts/verify-package.mjs ./revisionlab-0.1.0.tgz
   npm login --registry=https://registry.npmjs.org/
   npm whoami --registry=https://registry.npmjs.org/
   ```

3. Confirm `npm whoami` reports `gil00pita`. Make the **first, public publication** interactively, completing npm's authentication/2FA prompt:

   ```bash
   npm publish ./revisionlab-0.1.0.tgz --access public --tag latest --registry=https://registry.npmjs.org/
   ```

   npm requires an existing package before configuring its trusted publisher. If the name has become unavailable, stop and choose a package name you control; update the manifest, installer contract, release guard, and docs together. Do not publish to an unrelated package or change owners automatically. [npm trust prerequisites](https://docs.npmjs.com/cli/v11/commands/npm-trust/#prerequisites)

4. In GitHub → this repository → **Settings → Environments**, use **`npm`**. If deployment branch/tag restrictions are added, allow `main` and the explicit release tags you intend to publish. An optional required reviewer adds manual approval; leave it unset for automatic publication after merges.
5. In npm → `revisionlab` → **Settings → Trusted publishing**, add GitHub Actions with exactly:

   | Field | Value |
   | --- | --- |
   | Organization or user | `gil00pita` |
   | Repository | `RevisionLab` |
   | Workflow filename | `publish.yml` |
   | Environment | `npm` |
   | Allowed action | Enable direct **`npm publish`**, not only staged publishing |

   No `NPM_TOKEN` GitHub secret is needed. Only the publication job can request the short-lived OIDC credential; validation jobs cannot. The public repository/package are eligible for npm's automatic provenance. [npm trusted publishing setup](https://docs.npmjs.com/trusted-publishers/)

After a successful automated release, npm recommends restricting traditional token publishing. Keep your interactive account's recovery methods safe. Never commit an npm auth token or `.npmrc` containing credentials.

## Automatic releases from main

1. Merge the intended code into `main`. No manual version bump or GitHub Release is required; direct pushes also trigger publication.
2. The workflow reads npm's full package metadata and selects one patch above the highest stable version (currently `0.1.1` → `0.1.2`). It ignores prereleases and does not rely on the mutable `latest` tag for version ordering. Registry errors fail the run.
3. Before installation/build, it updates `packages/revisionlab/package.json` in the CI checkout, and records the source SHA as `gitHead`. The private example version and `yarn.lock` stay unchanged: Yarn Classic does not lock the local workspace version, and the example links it through `revisionlab: "*"`. Dependencies install with `yarn install --frozen-lockfile --non-interactive`; no npm lockfile is required. These changes are not committed back to Git; checked-in versions remain local-development baselines.
4. Metadata checks, release tests, lint, production build, package tests, and packed CLI smoke checks must all pass. The publication job downloads and publishes that exact artifact to npm under `latest` with trusted publishing.
5. Check the workflow's **Publish the verified tarball to npm** job and step summary, then run `npm view revisionlab version dist-tags --json`. A green validation job alone does not mean publication succeeded.

Version preparation through publication shares one concurrency group with explicit releases. `queue: max` keeps up to 100 pending runs instead of replacing earlier pending runs. The workflow does not cancel an active publication. Concurrent manual publications outside this workflow can still claim a selected version; npm rejects an overwrite, and a full rerun selects the next available patch.

For failed checks, fix the code and merge again. For transient registry/authentication problems, correct the configuration and rerun all jobs. Full reruns look for the source commit across published stable versions and skip publication if it already succeeded, even if newer versions now exist. If only the publish job failed, retry it only when that artifact's version is still unpublished; otherwise rerun all jobs. There are no automatic GitHub Releases, Git tags, or bot version commits.

## Explicit versioned releases

For an intentional stable version or prerelease, prepare a commit with the desired workspace version and an up-to-date `yarn.lock` for external dependencies, then publish a GitHub Release at that commit with tag `v<version>`. Do not merge a prerelease into `main` expecting `next`: main pushes always receive an automatic stable patch. Use a separate release branch for explicit prereleases.

Stable GitHub Releases publish to `latest`; versions such as `0.2.0-beta.1` require the **pre-release** checkbox and publish to `next`. Tag/version mismatches and invalid dependency installations fail. The explicit version must not already exist on npm. Published versions cannot be overwritten. The existing `0.1.0` and `0.1.1` must not be republished.

## Why GitHub showed no publication

On 29 September 2026 the latest main run passed validation but skipped publication: the old workflow required a published GitHub Release, and the repository had no Releases or release-triggered runs. The change above removes that requirement for main pushes.

GitHub **Packages** is separate from npm's public registry. This workflow publishes unscoped `revisionlab` to `registry.npmjs.org`, not to `npm.pkg.github.com`, so the GitHub Packages panel may remain empty. Check [revisionlab on npm](https://www.npmjs.com/package/revisionlab) or `npm view` instead. No second GitHub Packages publication is configured.

Consumers can then run:

```bash
npx revisionlab@latest init --protect
npx revisionlab@next init --protect       # opt into an available prerelease
npx revisionlab@0.1.1 init --protect      # choose a published version explicitly
```

The installer adds the exact version executing the command, including prereleases. `--package` still overrides it for local archives or an explicit package spec.

## What the workflow verifies

- Automatic version selection, source-event restrictions, duplicate-commit skips, registry failure handling, and consistent workspace/packed versions with an unchanged Yarn dependency lockfile.
- Release metadata, local workspace linkage, allowed registry/repository, and stable/prerelease channel; explicit GitHub Releases also require a matching `v<version>` tag.
- Release-tool tests, ESLint, the package plus example production build, and all package tests.
- An actual packed tarball: package entrypoints, types, logo, license, executable CLI, and exclusion of private runtime/configuration files.
- Clean-build CLI permissions: the package build marks `dist/cli/index.js` executable before CI packs with `--ignore-scripts`. The release tests exercise a fresh output directory so a previously installed local CLI cannot hide missing permissions.
- The extracted CLI's help, protected initialization and repeat initialization against an isolated Next.js fixture. This smoke check reuses installed dependencies; it is not a fresh external dependency installation or browser test.

The publishing job downloads that same tested artifact rather than rebuilding it. It uses commit-pinned GitHub actions, read-only checkout permissions, disabled package-manager caches, serialized publication, and no install/lifecycle scripts while publishing. Automated tests cannot verify npm account ownership, trusted-publisher settings, GitHub environment rules, or a live OIDC publication locally.

Local validation on 29 September 2026: all 19 release tests and 160 package tests passed, along with ESLint, the production build, release metadata checks, YAML parsing, and archive/CLI smoke verification. The automatic-release fixture confirms version/lockfile agreement, packed source identity, duplicate-commit skips, and validation-only events without registry access. A read-only live registry lookup selected `0.1.2`. No package was published during this work; GitHub OIDC authentication remains to be exercised after merge.
