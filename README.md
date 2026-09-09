# RevisionLab

Build, version, record, share, and export responsive prototype flows.

RevisionLab is a responsive prototype operations workspace built from `REVISIONLAB_PRODUCT_SPEC.md` with Next.js, React, TypeScript, and standard Chakra UI.

The current delivery is a connected front-end MVP shell backed by deterministic local demonstration data. It includes:

- a private prototype catalogue rendered as operational routes;
- a higher-level Project catalogue, with several prototypes per connected repository;
- an interactive New Project / Add Prototype import wizard;
- editable Node runtime contracts for React, Next.js, Angular, Vue, SvelteKit, Astro, and other HTTP applications;
- advanced environment-variable rows with secret/plain, build/runtime, and preview/replay scopes;
- prototype overview and activity;
- real-width phone, tablet, desktop, and custom preview controls;
- semantic `data-flow-id` journey recording with autosave feedback;
- saved flow steps, diagrams, replay health, and JSON/YAML downloads;
- immutable version history and three comparison modes;
- email-based access-management states and viewer-download controls;
- profile and session controls;
- accessible responsive behaviour and reduced-motion support.

Production Supabase authentication, Postgres/RLS, private storage, email delivery, Playwright capture/replay workers, and editable third-party board publishing remain explicit integration boundaries.

GitHub App authentication, remote cloning, OCI builds, secret encryption, and isolated preview execution are also explicit runner-service boundaries. The UI saves deterministic local configuration records and discards entered environment values; it does not claim that untrusted repository code was executed.

See `PROJECT_IMPORT_ARCHITECTURE.md` for the control-plane/runner-plane boundary and the intended implementation sequence.

## Run locally

```bash
npm install
npm run dev
```

The repository also records `pnpm@10.15.1` as its package manager, so the equivalent commands are:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
npm run typecheck
npm run lint
npm test
npm run flow:validate
npm run flow:targets:check
npm run build
```

`npm run flow:capture` explains the capture-worker integration boundary rather than fabricating protected screenshots.

## Design record

The selected visual direction is Signal Desk / Traffic Table. Its approved composition and generated comparison studies live under `.impeccable/mocks/`; the durable product record is `PRODUCT.md`.
