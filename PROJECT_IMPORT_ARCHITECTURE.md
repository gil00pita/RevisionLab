# Project import and isolated runner architecture

## Confirmed hierarchy

```text
Workspace
└── Project
    ├── Git source connection
    ├── Members and shared configuration
    └── Prototypes
        ├── Screens and responsive preview
        ├── Flows and replay health
        ├── Versions and history
        ├── Comparisons
        └── Access overrides
```

A Project maps to one repository by default. A monorepository can expose multiple Prototypes by assigning each one a root directory and runtime contract. Support for a per-Prototype repository override is deliberately deferred.

## Runtime contract

Framework detection is a convenience, not the compatibility boundary. A supported prototype must be able to:

1. install dependencies;
2. build successfully;
3. start an HTTP server on the injected port;
4. bind to the container network interface; and
5. answer a configured health path.

The long-term source of truth should be a declarative `revisionlab.json` manifest. The UI can infer editable defaults from lockfiles, `package.json`, framework files, and Node version files. Commands never run during detection in the control plane.

## Two-plane system

### Control plane

The Next.js application and Supabase services own authentication, authorization, Projects, Prototypes, configuration metadata, build requests, audit events, flows, versions, and protected artifact references.

### Runner plane

A separate worker service receives a signed, time-limited build request. It obtains a repository-scoped GitHub App installation token, clones a fixed commit, builds an OCI image, starts an isolated preview, performs the health check, and reports structured status back to the control plane.

Imported code is untrusted. Build and preview workers run without host mounts, a Docker socket, privileged mode, or control-plane credentials. They use a non-root user, resource and time limits, restricted egress, and a stronger sandbox runtime such as gVisor. Build jobs and live previews have separate identities and secret scopes.

Preview applications run on dedicated preview origins. They never share the RevisionLab control-plane origin or its cookies. Recorder communication uses a narrowly scoped, signed `postMessage` bridge with exact origin validation.

## GitHub access

The first connector is a GitHub App with read-only metadata and repository contents for explicitly selected repositories. Short-lived installation tokens are minted only inside the runner and removed from clone URLs and logs. Push webhooks enqueue immutable builds keyed by repository, commit, configuration digest, and relevant build-time-variable digest.

Generic public Git URLs, private deploy keys, and additional providers can be added after this contract is stable.

## Environment variables

Variables support Project defaults and Prototype overrides, with these dimensions:

- plain configuration or encrypted secret;
- build-time or runtime lifecycle;
- preview, replay, or both targets.

Production secret values are write-only in the UI and envelope-encrypted with a managed KMS. The database stores metadata and ciphertext references rather than plaintext. Values are injected only into the requested worker identity. Logs are redacted, exports never include values, and secret reads are audited.

Build-time secrets are discouraged because build scripts are untrusted and static frontend frameworks may bundle public-prefixed values. Names such as `NEXT_PUBLIC_*`, `VITE_*`, `REACT_APP_*`, and `PUBLIC_*` trigger a browser-exposure warning. Changing build-time input creates a new image; changing runtime input restarts the preview.

The current front-end implementation holds entered values only while the wizard is open, passes only variable metadata to the local Project record, and discards the values when the configuration is saved.

## State machine

```text
draft
→ awaiting_connector
→ queued
→ cloning
→ detecting
→ building
→ starting
→ health_check
→ ready
```

Any runner stage can enter `failed` with a structured, user-actionable error. Ready previews can later become `sleeping`, `stale`, or `suspended`.

## Delivery sequence

1. Project hierarchy and import UI with local deterministic records. **Implemented.**
2. Supabase schema, RLS, audit records, and encrypted variable metadata.
3. GitHub App installation flow, repository picker, webhooks, and short-lived clone authorization.
4. Queue and isolated Node build worker using Cloud Native Buildpacks/Paketo to create OCI images.
5. Protected preview routing, health checks, sleep/wake lifecycle, logs, and recorder bridge.
6. Commit-triggered rebuilds, replay workers, immutable version capture, quotas, retention, and cleanup.

## Initial compatibility target

- npm, pnpm, and Yarn lockfiles;
- current maintained Node LTS releases;
- Next.js, React/Vite, Angular, Vue/Nuxt, SvelteKit, Astro, and generic Node HTTP servers;
- repository-root and monorepo-subdirectory applications;
- production-style immutable builds rather than persistent framework development servers.

Useful primary references: [GitHub App installation tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app), [Cloud Native Buildpacks](https://buildpacks.io/docs/for-platform-operators/how-to/integrate-ci/pack/cli/pack_build/), [Paketo Node.js build guidance](https://paketo.io/docs/howto/nodejs/), [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/), [Kubernetes secret practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/), and [gVisor](https://gvisor.dev/docs/).
