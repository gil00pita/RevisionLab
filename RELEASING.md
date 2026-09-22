# Publishing RevisionLab to npm

Package: **`revisionlab`**, with **`gil00pita`** as the intended npm owner selected by the maintainer. Source: [gil00pita/RevisionLab](https://github.com/gil00pita/RevisionLab). Registry ownership is not established until first publication succeeds. The example application remains private and is never published.

The repository contains `.github/workflows/publish.yml`. Pull requests, pushes to `main`, and manual workflow runs validate without publishing. Publishing a GitHub Release triggers the same checks, then publishes its verified tarball to npm. A Git tag by itself does not publish. The workflow must first be committed and pushed/merged into GitHub.

## One-time setup

The public registry returned 404 for `revisionlab` on 22 September 2026. That is not a reservation. The local npm authentication check returned 401; **no package has been published and trusted publishing has not been activated** by this change.

1. Sign in to npm as `gil00pita`, with a verified email and two-factor authentication. Use Node.js 24 for the release tooling; GitHub runs Node 24 and npm 11.19.1. Do not paste tokens or recovery codes into Git or chat.
2. From the repository root, validate and prepare the first package:

   ```bash
   npm ci
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

4. In GitHub → this repository → **Settings → Environments**, create **`npm`**. Restrict releases to trusted maintainers/tags. An optional required reviewer adds a manual approval before publication; leave it unset for fully automatic publication after a release is published.
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

## Subsequent releases

1. Increase the **workspace** version and its lockfile entry, for example:

   ```bash
   npm version patch --workspace revisionlab --no-git-tag-version
   npm run release:check
   ```

2. Commit the changed `packages/revisionlab/package.json` and `package-lock.json`, then push/merge to `main` with the intended release code. The CI workflow validates the change.
3. In GitHub → **Releases → Draft a new release**, choose that commit and a tag exactly matching the package version, e.g. **`v0.1.1`**, then publish the release. The manually bootstrapped `0.1.0` already exists; start automated publishing with a new version, not another `0.1.0` publication.
4. Wait for **Validate and publish npm package** to complete. Only a successful publication means the npm version is available.

Stable versions publish to `latest`. Versions such as `0.2.0-beta.1` require GitHub's **pre-release** checkbox and publish to `next`, leaving `latest` untouched. Version/tag/lockfile mismatches fail before publishing. Published npm versions cannot be overwritten; retry failed jobs only if publication did not already complete, otherwise bump the version. There is no automatic version bump on ordinary commits.

Consumers can then run:

```bash
npx revisionlab@latest init --protect
npx revisionlab@next init --protect       # opt into an available prerelease
npx revisionlab@0.1.1 init --protect      # choose a published version explicitly
```

The installer adds the exact version executing the command, including prereleases. `--package` still overrides it for local archives or an explicit package spec.

## What the workflow verifies

- Release metadata, matching `v<version>` tag and lockfile, allowed registry/repository, and stable/prerelease channel.
- Release-tool tests, ESLint, the package plus example production build, and all package tests.
- An actual packed tarball: package entrypoints, types, logo, license, executable CLI, and exclusion of private runtime/configuration files.
- The extracted CLI's help, protected initialization and repeat initialization against an isolated Next.js fixture. This smoke check reuses installed dependencies; it is not a fresh external dependency installation or browser test.

The publishing job downloads that same tested artifact rather than rebuilding it. It uses commit-pinned GitHub actions, read-only checkout permissions, disabled package-manager caches, serialized publication, and no install/lifecycle scripts while publishing. Automated tests cannot verify npm account ownership, trusted-publisher settings, GitHub environment rules, or a live OIDC publication locally.
