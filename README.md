# RevisionLab

Review prototype flows, comments, and versions from inside each Next.js project.

RevisionLab is an installable Next.js App Router integration. The floating widget records real prototype screens and opens a full review workspace. This repository runs the same package that the installer adds to other projects.

## Run locally

To comment directly on the running website, choose **Review → Comment on an element**, select a page element, and submit your feedback. No recording is required. Use the arrow controls and **Comment here** for keyboard selection; Escape cancels. Open comments appear as live pins, which can be hidden from the widget. Replies and resolution use the same discussions as page feedback. Targets persist across reloads; changed or unavailable elements retain their discussion in the widget without a guessed pin. Live comments are scoped to the pathname, not a recorded version. Existing deployment enablement and reviewer access still apply.

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. Click the floating **Record prototype** icon, enter a recording name, choose a saved persona, then **Start recording**. Create persona types in **Workspace → Personas** (also linked from the dialog). Owners and editors can edit, archive, and restore personas; existing recording labels remain unchanged. New paths capture automatically; **Capture screen** saves additional states on the same page. Choose **Stop recording** to save the completed recording, then open `/revisionlab` to review its screens, create another version, and add or resolve feedback. Stop is visible in the floating recording controls and in the widget footer on both tabs. It prevents new captures immediately and waits for any capture already underway before saving.

The workspace uses a single sidebar. **Flows** slides the main menu away and replaces it with **Your flows**; **Back** restores the menu without changing the selected flow or canvas. Comments, Personas, and Review access open from that main menu.

**Discard recording** is different: after confirmation it prevents new captures, waits for any capture in progress, and removes the unfinished draft and its screenshots without saving a completed flow. Previously saved versions remain. While recording, normal same-tab page links show a warning: stay, discard and leave, or continue recording on another eligible same-origin prototype page. Continue is disabled until capture is idle; the review workspace and external destinations cannot continue the recording. Discard failures keep you on the page with capture stopped and a retry; navigation waits for successful cleanup.

Recording controls have passed local Stop, Stay, Continue, and discard-retry browser checks, with warning visuals confirmed at desktop and narrow widths, alongside lint, the production build, and all 88 package tests; see [VALIDATION.md](VALIDATION.md) for evidence and remaining limits. Reload/close uses the browser's native warning, not automatic discard. New-tab/modified clicks, downloads, hash links, and switching tabs do not discard the recording. Host `router.push`/`router.replace` calls need the [programmatic navigation helper](packages/revisionlab/README.md#programmatic-navigation); client-side browser Back/Forward is not globally blocked.

Each recording opens as a **Whiteboard**: screenshots are connected in recorded order. Use the mouse wheel over the board or a screen to zoom the full flow around the cursor. Drag the background or use Shift+wheel to pan; zoom buttons, reset to 100%, and **Fit** remain available. Editors choose **Paths** to enter editing without opening a form, then use **Connect** on a source screen and **Connect here** on a target. Select a connection to edit its label, remove it, or discuss that path. Commenters can discuss saved connections without editing the graph.

Board changes **autosave** after a short pause or a completed drag. **Undo** reverses the last local edit, including a saved edit; a drag or continuous label edit is one operation. **Done editing** and internal navigation wait for pending saves. Failed saves keep your changes with a retry; conflicts never silently overwrite another editor. Undo history is limited to the current flow session, not comments or recordings.

**Remove screen** hides it and its adjacent active paths from the board; **Undo** restores them together, while **Restore** brings just the screen back. Captures and feedback are retained. Removed connection threads remain accessible in **All comments**. New paths finish autosaving before receiving comments.

Open a screen card, then click the captured image to place a numbered comment pin. Pins open discussions with replies and resolution. Keyboard users can place a pin with Enter and adjust its horizontal/vertical percentages. Existing page and unpinned screen comments remain available.

Direct editing is partially implemented and locally verified: package and production builds, lint, and all 113 package tests pass. Local browser checks cover autosave, grouped Undo, removal/restoration, retry, and navigation protection, with desktop/mobile layout evidence in [VALIDATION.md](VALIDATION.md). Fresh hosted and separate-host installation checks were not repeated. Decision elements and adding a screen by URL are **not implemented**. Decision-node versus prototype-form behavior, and URL capture versus a linked placeholder, remain unanswered in [PRODUCT.md](PRODUCT.md).

Local development on localhost gives the developer owner access. Data persists in `.revisionlab/revisionlab.db`, with private screenshots in `.revisionlab/artifacts/`. Both are ignored by Git. There is no seeded application data; the workspace starts empty.

## Install in another Next.js project

The package is implemented but has **not been published to npm**. Build a local archive:

```bash
npm run build:package
npm pack --workspace revisionlab
```

Run this from an existing Next.js project, substituting the archive's absolute path:

```bash
npx --package /absolute/path/revisionlab-0.1.0.tgz revisionlab init \
  --package /absolute/path/revisionlab-0.1.0.tgz --protect
```

Once published, the command becomes `npx revisionlab@latest init --protect`. The installer installs the exact version invoked, including explicit versions and `@next` prereleases. The installer supports Next.js 15/16 App Router, React 19, TypeScript/JavaScript, and `app/` or `src/app/`. It generates the API, workspace/access routes, configuration, and widget layout integration. `--protect` also generates the prototype access gate (Next.js 15.5+). Existing files are checked before writes, modified host files are backed up, and repeat installation preserves customizations.

See the [package guide](packages/revisionlab/README.md) for all options and manual integration. Standalone React/Vite and the Pages Router are not included in this release.

## Automatic npm releases

[The publishing workflow](.github/workflows/publish.yml) validates pull requests and `main` updates, then publishes the tested package when a matching **GitHub Release** is published. Stable versions use `latest`; prereleases use `next`. It uses npm trusted publishing without a stored npm token.

The intended npm owner is `gil00pita`. The workflow is implemented, but first publication, npm trusted-publisher setup, and the GitHub `npm` environment are still required. Follow [RELEASING.md](RELEASING.md) for the one-time setup and subsequent version/release steps. Nothing has been published by these repository changes.

## Shared review

Configure the server-only settings in [.env.example](.env.example): a Turso/libSQL database, owner email, and Resend delivery credentials. The owner verifies their email at `/revisionlab/access`, then creates invitations from **Review access**. Employees and clients can use any permitted email; no Vercel account or separate registration is required. Invitations expire and can be revoked, including their active sessions. Commenters can review and comment; editors can record and resolve feedback; owners manage access.

Remote mode stores private screenshot BLOBs in the same database by default. A server-only artifact adapter can use separate object storage. Vercel cannot persist a local SQLite file, and its Deployment Protection sits in front of this application: the review deployment must allow invitees to reach RevisionLab's own email gate. This repository includes that gate in `src/proxy.ts`.

Hosted Turso and Resend paths are implemented but require real deployment credentials to verify. Local development displays verification codes without sending email; this shortcut is disabled in production.

## Implemented scope

The functional release includes installation, SQLite/libSQL persistence, invitations and sessions, flow/persona recording, private screenshots, immutable completed screen versions, version switching, generated flow boards with saved layouts and manual branches, screen-area comment pins and threaded replies, page comments, and Markdown reports. The current partial editing increment adds on-board connection editing/discussions and reversible screen removal; its validation status is above. Board metadata remains editable without changing completed captures. Screens are DOM captures, not video recordings. A persona labels a recording; the prototype still controls its own user permissions.

Automatic discovery of unrecorded paths, executable action graphs and replay, replay-aware DOM re-anchoring, visual diff generation, and PDF/Excalidraw/Confluence integrations remain roadmap items. The widget supports live DOM-element targets separately from screenshot pins. Manual branches describe a path; they do not claim it was recorded or make it executable. The whiteboard uses geometric connectors rather than an obstacle-avoiding diagram engine.

## Development checks

```bash
npm run lint
npm run build
npm run test:package
npm run test:release
npm run release:check
```

The package builds before the host application. Webpack is selected for compatibility with Chakra/Emotion hydration. Tests use isolated temporary databases and block external email delivery.

See [VALIDATION.md](VALIDATION.md) for the checks performed, independent UI review, and remaining verification limits.

See [PRODUCT.md](PRODUCT.md) for the product vision and [PLAN.md](PLAN.md) for the remaining implementation roadmap.
