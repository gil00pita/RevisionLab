# RevisionLab

Review prototype flows, comments, and versions from inside each Next.js project.

RevisionLab is an installable Next.js App Router integration. The floating widget records real prototype screens and opens a full review workspace. This repository runs the same package that the installer adds to other projects.

## Run locally

**Workspace > Settings > Live comments** controls default bubble visibility and color. Owners and editors can choose from gray, red, orange, yellow, green, teal, cyan, blue, purple, and pink; changes save to the workspace database. Commenters have read-only access. The live Show comments switch remains a temporary page-level override. New pages use the saved default; comment details always require activation.

Recording setup opens just above the bottom-right widget, like the accessibility panel. After a successful Stop, **Recording ended and saved** appears with **View recording**, opening that exact flow in the workspace. The confirmation remains until dismissed or a new recording starts; failed saves remain retryable without a success message.

The floating toolbar contains the supplied RevisionLab mark, accessibility status, camera/Stop, and comment/Stop commenting. Click the RevisionLab logotype to go straight to the workspace in the same tab, without a dialog. It supports normal browser new-tab actions. The accessibility icon runs local axe-core checks on each visited, authorized prototype page and updates after host DOM changes. A check means automated checks passed, not full accessibility compliance. Other states identify scanning, issues, manual review, stale results, or failure; click the icon for findings and **Run again**. Current findings show problem bubbles on visible affected elements. Click a title, individual target, or bubble to scroll to and highlight the component without activating it. **Read more** opens the rule documentation; **All issues** restores the list. Close or Escape clears this inspection layer. Private, hidden, removed, stale, and unavailable frame targets are not highlighted.

Click the comment icon to select components directly on the live page. The crosshair and highlight show the target; clicking opens an anchored speech bubble with a comment field, **Post**, and **Cancel**, without activating the host control. Submission or cancellation returns to selection; **Stop commenting** or Escape ends the mode. Saved comment markers follow the workspace default (initially visible); click a marker (or activate it with the keyboard) to open its details and component highlight. Use **Show comments** in the selection controls to hide or show the markers. Closing details leaves markers visible; showing markers again never opens details automatically. Escape or Stop commenting preserves visibility. The layer temporarily hides while composing and restores markers afterward. Route changes/reload restore the workspace default with details closed. Replies and resolution remain in the workspace, reached through **All comments on this page**. The toolbar badge still counts open page threads, not replies. Keyboard selection uses Up/Down and Enter, without floating navigation buttons. No recording is required. Targets persist across reloads and comments are scoped to the pathname, not a recorded version. Opening comment mode preserves the last accessibility result; actual host changes still invalidate it. Existing deployment enablement and reviewer access still apply.

```bash
npm install
npm run dev
```

Opening a saved live comment bubble highlights its attached component with an outline and subtle tint matching the workspace bubble color. The highlight follows the open preview as the page moves, without blocking clicks. Closing the preview or hiding comments removes it; Escape preserves it when comments remain visible.

Open the local URL printed by Next.js. Click the camera (**Record prototype**), enter a recording name, choose a saved persona, then **Start recording**. Create persona types in **Workspace → Personas** (also linked from the dialog). Owners and editors can edit, archive, and restore personas; existing recording labels remain unchanged. An existing name (ignoring case and surrounding spaces) requires confirmation: **Cancel** keeps the setup, while **Replace and record** creates a new version of that flow and preserves previous screenshots/comments. Unfinished recordings must be finished or discarded first. Setup closes and the camera becomes **Stop recording**. The first page, subsequent pages, and completed field changes capture automatically after the page settles. Changed clicks preserve the pre-interaction screen and settled result; unchanged clicks add no screens. Already-captured pre-states are not duplicated, and host clicks are not delayed or replayed. Rapid interactions coalesce; typing alone does not capture. **Capture screen** remains available in the review panel. Stop prevents new captures and waits for an ongoing capture before saving.

New captures include bounded cursor samples and numbered clicks. Toggle **Cursor path** on the whiteboard or full-screen review to show the path on its exact capture; old recordings are unchanged. Readiness checks wait for document/fonts/images, host `aria-busy`, and 650ms of quiet DOM/resource activity, with a visible error after 10 seconds instead of silently recording a loading state. This is not network interception, video, or action replay; hosts should expose asynchronous loading with `aria-busy`. Widget/private/password regions are excluded.

The workspace uses a single sidebar. **Flows** slides the main menu away and replaces it with **Your flows**; **Back** restores the menu without changing the selected flow or canvas. Comments, Personas, and Review access open from that main menu.

**Discard recording** is different: after confirmation it prevents new captures, waits for any capture in progress, and removes the unfinished draft and its screenshots without saving a completed flow. Previously saved versions remain. While recording, same-domain links proceed without a warning. Same-origin prototype navigation continues recording automatically; only same-tab links to another hostname show Stay or Discard and leave. Discard failures keep you on the page with capture stopped and a retry; navigation waits for successful cleanup.

Recording controls have passed local Stop, Stay, Continue, and discard-retry browser checks, with warning visuals confirmed at desktop and narrow widths, alongside lint, the production build, and all 88 package tests; see [VALIDATION.md](VALIDATION.md) for evidence and remaining limits. Reload/close uses the browser's native warning, not automatic discard. New-tab/modified clicks, downloads, hash links, and switching tabs do not discard the recording. Host `router.push`/`router.replace` calls need the [programmatic navigation helper](packages/revisionlab/README.md#programmatic-navigation); client-side browser Back/Forward is not globally blocked.

Each recording opens as a **Whiteboard**: unique screen states are connected by observed visits, including returns and branches. Historical recordings retain their captured sequence. Use the mouse wheel over the board or a screen to zoom the full flow around the cursor. Drag the background or use Shift+wheel to pan; zoom buttons, reset to 100%, and **Fit** remain available. Editors choose **Paths** to enter editing without opening a form, then use **Connect** on a source screen and **Connect here** on a target. Select a connection to inspect its recorded click, edit its label, remove it, or discuss that path. Commenters can inspect and discuss saved connections without editing the graph.

Board changes **autosave** after a short pause or a completed drag. **Undo** reverses the last local edit, including a saved edit; a drag or continuous label edit is one operation. **Done editing** and internal navigation wait for pending saves. Failed saves keep your changes with a retry; conflicts never silently overwrite another editor. Undo history is limited to the current flow session, not comments or recordings.

**Remove screen** hides it and its adjacent active paths from the board; **Undo** restores them together, while **Restore** brings just the screen back. Captures and feedback are retained. Removed connection threads remain accessible in **All comments**. New paths finish autosaving before receiving comments.

Open a screen card, then click the captured image to place a numbered comment pin. Pins open discussions with replies and resolution. Keyboard users can place a pin with Enter and adjust its horizontal/vertical percentages. Existing page and unpinned screen comments remain available.

Direct editing is partially implemented and locally verified: package and production builds, lint, and all 113 package tests pass. Local browser checks cover autosave, grouped Undo, removal/restoration, retry, and navigation protection, with desktop/mobile layout evidence in [VALIDATION.md](VALIDATION.md). Fresh hosted and separate-host installation checks were not repeated. Decision elements and adding a screen by URL are **not implemented**. Decision-node versus prototype-form behavior, and URL capture versus a linked placeholder, remain unanswered in [PRODUCT.md](PRODUCT.md).

Local development on localhost gives the developer owner access. Data persists in `.revisionlab/revisionlab.db`, with private screenshots in `.revisionlab/artifacts/`. Both are ignored by Git. There is no seeded application data; the workspace starts empty.

## Install in another Next.js project

Install the published package from your existing Next.js App Router project:

```bash
npx revisionlab@latest init
npm run dev
```

Registry verification on 25 September 2026 found `revisionlab@0.1.1` under `latest`, with no `next` tag. The newer widget, saved personas, interaction capture, and comment settings described above are local workspace changes, not included in that published archive. To try those changes, build a local archive:

```bash
npm run build:package
npm pack --workspace revisionlab
```

Run this from an existing Next.js project, substituting the archive's absolute path:

```bash
npx --package /absolute/path/revisionlab-0.1.1.tgz revisionlab init \
  --package /absolute/path/revisionlab-0.1.1.tgz --protect
```

Use `npx revisionlab@latest init --protect` to also gate prototype pages. The installer installs the exact version invoked, including explicit versions and `@next` prereleases when that tag is available. Re-running `init` updates the dependency while preserving customized integration files and review data; restart the development server afterward. The installer supports Next.js 15/16 App Router, React 19, TypeScript/JavaScript, and `app/` or `src/app/`. It generates the API, workspace/access routes, configuration, and widget layout integration. `--protect` also generates the prototype access gate (Next.js 15.5+). Existing files are checked before writes, modified host files are backed up, and repeat installation preserves customizations.

See the [package guide](packages/revisionlab/README.md) for all options and manual integration. Standalone React/Vite and the Pages Router are not included in this release.

## Automatic npm releases

[The publishing workflow](.github/workflows/publish.yml) validates pull requests and `main` updates, then publishes the tested package when a matching **GitHub Release** is published. Stable versions use `latest`; prereleases use `next`. It uses npm trusted publishing without a stored npm token.

The intended npm owner is `gil00pita`. The package is now available from npm, but the registry check does not verify trusted-publisher setup or the GitHub `npm` environment. Follow [RELEASING.md](RELEASING.md) for setup and version/release steps. No publication or deployment was performed while updating this guide.

## Shared review

Configure the server-only settings in [.env.example](.env.example): a Turso/libSQL database, owner email, and Resend delivery credentials. The owner verifies their email at `/revisionlab/access`, then creates invitations from **Review access**. Employees and clients can use any permitted email; no Vercel account or separate registration is required. Invitations expire and can be revoked, including their active sessions. Commenters can review and comment; editors can record and resolve feedback; owners manage access.

Remote mode stores private screenshot BLOBs in the same database by default. A server-only artifact adapter can use separate object storage. Vercel cannot persist a local SQLite file, and its Deployment Protection sits in front of this application: the review deployment must allow invitees to reach RevisionLab's own email gate. This repository includes that gate in `src/proxy.ts`.

Hosted Turso and Resend paths are implemented but require real deployment credentials to verify. Local development displays verification codes without sending email; this shortcut is disabled in production.

## Implemented scope

The functional release includes installation, SQLite/libSQL persistence, invitations and sessions, flow/persona recording, private screenshots, immutable completed screen versions, version switching, generated flow boards with saved layouts and manual branches, screen-area comment pins and threaded replies, page comments, and Markdown reports. The local recording increment also reuses matching automatic captures within a version: A -> B -> C -> A -> E has one A screen, a C -> A return path, and A -> B / A -> E branches. Changed screen states remain separate. Select a recorded connection to inspect its clicked item and location on the source screenshot when available; legacy or unavailable evidence is not invented. The current partial editing increment adds on-board connection editing/discussions and reversible screen removal; its validation status is above. Board metadata remains editable without changing completed captures. Screens are DOM captures, not video recordings. A persona labels a recording; the prototype still controls its own user permissions.

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
