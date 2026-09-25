# RevisionLab

## Comment on live elements

**Workspace > Settings > Live comments** controls default bubble visibility and color. Owners and editors can choose from gray, red, orange, yellow, green, teal, cyan, blue, purple, and pink; changes save to the workspace database. Commenters have read-only access. Existing installations retain visible blue markers until changed. The live Show comments switch is a temporary page-level override; new pages use the saved default, with details closed until activation.

Opening a saved live comment bubble highlights its attached component with an outline and subtle tint matching the workspace bubble color. The highlight follows the open preview during scrolling and resizing without blocking clicks. It disappears when the preview closes, comments are hidden, or the target is unavailable; Escape preserves it when comments remain visible.

The segmented RevisionLab toolbar exposes accessibility status, camera/Stop recording, and comment/Stop commenting. The RevisionLab logotype links directly to the configured workspace in the same tab, without an intermediate dialog; browser modifier-click/new-tab actions are supported. Click the comment icon to enter persistent crosshair selection; select a target to open a speech bubble containing only the comment field, **Post**, and **Cancel**. Recording is not required. Submission or composer cancellation returns to selection until **Stop commenting** or Escape. The picker supports pointer/touch selection and Up/Down plus Enter, without Previous/Next/Comment buttons. Selecting a host control does not activate it. Saved comment markers follow the workspace default (initially visible); details and the component highlight appear only after pointer or keyboard activation. **Show comments** in the selection controls hides or shows markers. Closing details retains markers; showing them again does not automatically open details. Escape or Stop commenting preserves visibility. The preference survives composing/cancelling on the same page; the layer temporarily hides during composition and restores markers afterward. Route changes/reload restore the workspace default with details closed. Missing/private/offscreen targets are not shown. Replies/resolution remain in the workspace; **All comments on this page** opens its pathname-filtered Comments view. The badge continues to count open page threads, excluding replies. Opening review/comment UI preserves the last accessibility result; real host changes still mark it stale before the next scan.

Accessibility checks use bundled, lazy-loaded axe-core locally on each visited authorized page, excluding review UI/private regions. DOM changes invalidate the current result and schedule a fresh check. A check indicates no violations or incomplete checks were returned by the configured WCAG A/AA rules; it is not certification or a substitute for manual testing. Scanning, stale, issues, manual-review-needed, and failure states are distinct. Click the status icon for findings and a rerun. No DOM or accessibility results are sent to an external service, and unvisited routes are not crawled.

While current findings are open, problem bubbles identify visible affected components. Clicking an issue title selects its first available target; individual target entries and bubbles also select components. Selection scrolls the exact scanned element into view and highlights it without activating the host control. Compact details include **Read more**, opening that rule's axe documentation in a new tab, and **All issues**. Close or Escape removes the inspection layer. Markers track scrolling/resizing, are excluded from capture/scans, and never guess missing/private/hidden/stale or unavailable frame targets. These refinements belong to the local widget build, not the previously published archive.

Targets are saved against the current pathname using a locator, tag, and short label. A unique `data-revisionlab-anchor`, `id`, or `data-testid` improves stability; structural locators are a fallback. Query/hash variants share page comments. Input values, private regions, passwords, and RevisionLab UI are excluded. Shadow DOM, iframe contents, and canvas internals are not supported. Changed or missing targets retain their discussion in the widget and never fall back to an arbitrary location. This does not migrate screenshot pins between versions or enable production reviews automatically.

Embed prototype recording and review in an existing Next.js project. Mount the widget once in your root layout; reviewers can capture screens, discuss a flow, and open its full workspace at `/revisionlab`.

## Install in another project

Install the published package from an existing Next.js App Router project:

```bash
npx revisionlab@latest init
npm run dev
```

Registry verification on 25 September 2026 found `revisionlab@0.1.1` under `latest`, with no `next` tag. This README also covers newer workspace code: the compact widget, saved personas, interaction capture, and comment settings are not in that published archive. To try those unreleased changes, build and pack this repository:

```bash
npm run build:package
npm pack --workspace revisionlab
```

Then run the resulting tarball against an existing project. Use an absolute tarball path for both arguments:

```bash
npx --package /absolute/path/revisionlab-0.1.1.tgz revisionlab init \
  --cwd /absolute/path/my-next-project \
  --package /absolute/path/revisionlab-0.1.1.tgz
```

`--package` makes the generated project install that exact local build. Nothing is published by these commands.

The default installer also installs the exact version you invoked: `npx revisionlab@0.1.1 init` uses that published version, while `npx revisionlab@next init` opts into a prerelease only when that tag is available. Re-run `npx revisionlab@latest init` to update the dependency while retaining customized integration files and review data, then restart the development server. The repository's GitHub Release workflow publishes stable versions to `latest` and prereleases to `next`, after validation. See the [maintainer release guide](https://github.com/gil00pita/RevisionLab/blob/main/RELEASING.md) for initial publication and trusted-publisher setup.

The installer supports `app/` or `src/app/`, TypeScript or JavaScript, Next.js 15/16, React 19, and Node.js 20.9+. The package's own application code is TypeScript. Standalone React/Vite and the Pages Router are not currently supported because the storage and invitation APIs need a server.

### Generated integration

- `revisionlab.config.ts` (or `.js`): stable project ID and display name.
- `app/revisionlab/page.tsx` and `app/revisionlab/access/page.tsx`: workspace and invitation access pages.
- `app/api/revisionlab/[...path]/route.ts`: Node.js API handler.
- Root layout: imports and mounts `RevisionLabWidget` inside the existing `<body>`.
- `.revisionlab/installation.json`: installation metadata. Runtime data and the original layout backup stay private inside `.revisionlab/`.
- `.revisionlab.env.example`: optional shared-deployment settings.

Paths follow the host's `src/` and language conventions. The layout remains a Server Component unless it was already a Client Component. Existing providers and application content stay intact; the widget contains its own Chakra UI provider.

Initialization checks every target before writing. Conflicting files, symbolic links, ambiguous root layouts, and existing protection middleware cause a clear error. Re-running initialization preserves generated files you have customized and does not mount the widget twice. Backups of modified host files are at `.revisionlab/backups/`.

The installer adapts conventional `next dev` and `next build` scripts to Webpack because of the [Chakra/Emotion Turbopack hydration issue](https://chakra-ui.com/docs/get-started/frameworks/next-app#hydration-errors-turbopack). On Next.js 16 it adds `--webpack`; on Next.js 15 it removes `--turbo`/`--turbopack` because Webpack is already the default and that release has no `--webpack` flag. Other arguments and scripts are preserved. Custom shell commands remain untouched and produce manual instructions. Package changes are backed up and included in `--dry-run`.

```bash
npx revisionlab init --dry-run       # inspect proposed changes
npx revisionlab init --no-install    # generate files; manage dependencies yourself
npx revisionlab init --protect       # also protect prototype routes
npx revisionlab --help
```

`--no-install` skips dependency installation but still adapts conventional development/build scripts; install `revisionlab` yourself afterward. The default dependency installation uses npm. In a pnpm/yarn project, use `--no-install` and the project's package manager.

## Local recording and feedback

Camera setup opens in a popover immediately above the bottom-right widget, matching accessibility-panel placement. Successful Stop shows **Recording ended and saved** with a **View recording** link to that exact flow/version. The confirmation is dismissible and does not expire automatically. Failed saves show an error and remain retryable, never a success confirmation.

Run your development server on localhost and click the camera (**Record prototype**). Enter a recording name, select a saved persona, and choose **Start recording**. An existing name (ignoring case and surrounding spaces) requires confirmation: **Cancel** keeps the setup, while **Replace and record** creates a new version of that flow and preserves previous screenshots/comments. Unfinished recordings must be finished or discarded first. Setup closes and the camera becomes **Stop recording**. **Manage personas** opens the workspace's Personas view: owners and editors can create names and optional descriptions, edit them, and archive or restore entries. Commenters have read-only access. The list starts empty; archived personas cannot start new widget recordings. Renaming or archiving does not rewrite existing recording labels. The starting page, route changes, and completed field changes capture automatically once settled. Clicks save pre-interaction and settled-result screens only when host content changes; unchanged clicks upload nothing, and an already-captured pre-state is not duplicated. Snapshotting does not delay clicks for rendering or replay host events. Rapid interactions coalesce and keystrokes alone do not capture. Manual **Capture screen** remains in the review panel. Stop waits for an in-progress capture and server completion. Failed saves remain stopped and retryable.

Settling waits for document/fonts/images and no host `aria-busy="true"`, then 650ms without host DOM changes or completed resource activity. After 10 seconds a visible error asks you to wait for loading and retry; manual capture and another interaction remain available. It does not patch host networking or guarantee detection of an unannounced pending fetch; expose asynchronous loading with `aria-busy`. Review UI and private/password regions remain excluded. Capture is paused during review/comment selection, and route changes cancel stale pending work. An already committed upload still updates the recording count if its acknowledgement arrives while paused.

New screen metadata contains at most 200 cursor samples, normalized to that screenshot, with numbered clicks and timestamps. It contains no keystrokes, input values, or executable actions. Toggle **Cursor path** on the whiteboard or full-screen review to show connecting movement paths and click markers. Board pan/zoom applies to the overlay, while full-screen review shows portions cropped from thumbnails. Existing recordings without metadata continue to work. Screenshots retain the existing 4000px height and 200-screen-per-flow limits.

Automatic captures now reuse an identical captured image on the same route within the current flow version, while changed images remain separate states. Visit order is preserved independently: A -> B -> C -> A -> E produces four screens, including the return C -> A and branches A -> B / A -> E. Repeated visits do not consume extra unique-screen slots; recordings are bounded to 1000 visits. Manual and historical captures are not retroactively merged. Selecting a recorded connection shows the clicked item's label/type, its highlighted bounds, and click position on the source screenshot when captured. Multiple traversals of the same path can be selected separately. Keyboard activation is identified as the element center, not a fabricated pointer position. Private controls, missing source evidence, and clicks outside the captured image do not receive guessed markers. Navigation before a changed source state can be saved may leave the connection without click details. Existing paths, discussions, and completed versions remain intact. These changes require the local build until published.

The workspace has one drill-down sidebar: choose **Flows** to replace the main menu with **Your flows**, then **Back** to restore the menu. The selected flow and canvas stay mounted during this transition; no second flow-list column consumes canvas width.

Flow metadata and comments persist in `.revisionlab/revisionlab.db`, a local SQLite database initialized automatically; private screenshots are stored in `.revisionlab/artifacts/`. Open `/revisionlab` to review recorded steps and discussions. A loopback development session gets local owner access; this development shortcut is disabled in production. Set `REVISIONLAB_LOCAL_OWNER=false` to test invitation access during development.

Screenshots capture the rendered DOM. Cross-origin images, embedded frames, video, and canvas content may be unavailable to the browser capture API. Record only prototype data that reviewers may access. A persona is a recording label; it does not impersonate or log in as a host application's user.

### Discarding and leaving a page

**Discard recording** asks for confirmation, prevents new captures, waits for any in-flight capture to settle, and deletes the unfinished draft and its captured artifacts rather than saving a completed flow. Only the draft's creator or an owner can discard it; previously completed versions remain untouched. Capture stays stopped even if cleanup fails, with errors and retry controls retained. Local functional checks verified a failed discard retaining the warning and page, then a successful retry removing the draft and artifact before navigation. Warning-dialog visuals were confirmed at desktop and narrow viewport widths.

Same-domain links, including Next.js and full-document links, navigate without a recording warning. Recording continues on enabled same-origin prototype pages. Only ordinary same-tab links to a different hostname show **Stay and keep recording** or **Discard recording and leave**. Discard waits for successful server cleanup before navigating; failure keeps the warning and current page. Different subdomains count as external. Scheme/port changes on the same hostname do not prompt, but session storage does not carry recording state across origins.

Modified clicks, links opening another tab/window, downloads, and hash-only changes retain normal behavior. Switching tabs does not stop or delete a recording. Closing the tab uses the browser's native `beforeunload` warning when supported; the browser controls its wording/display and cannot distinguish closing from reload or other unapproved full-document exits, which may also warn. Known internal link departures are exempt; cancelled or SPA-handled links clear that exemption. RevisionLab does not delete on unload because the user may cancel or the network request may not complete. Client-side Back/Forward navigation is not globally blocked.

### Programmatic navigation

Ordinary links leaving the domain are guarded automatically while the widget is mounted. Internal destinations are allowed without a prompt. For host actions using `router.push`, `router.replace`, or a location assignment, first await `confirmRecordingNavigation(href)` from `revisionlab`. Navigate only when it returns `true`; it does not perform navigation itself. Invoke it immediately before the intended navigation, not during rendering or prefetching.

For example, in a Client Component where `router` comes from `useRouter()` in `next/navigation`:

```ts
import { confirmRecordingNavigation } from "revisionlab";

async function openNextStep() {
  const href = "/prototype/next-step";
  if (await confirmRecordingNavigation(href)) {
    router.push(href);
  }
}
```

Apply the same guard before `router.replace(href)`. Use trusted application destinations; the helper does not replace your host's authorization or URL validation. Keep the widget mounted in the root layout. The installer cannot rewrite arbitrary host navigation handlers, and Next.js App Router does not provide a universal safe blocker for all navigation; unguarded programmatic calls and client-side browser Back/Forward are outside the automatic warning coverage.

### Whiteboard and pinned discussions

Recorded screens automatically appear as cards joined by solid directional arrows. Wheel over the board or a screenshot to zoom around the pointer; drag empty board space or use Shift+wheel to pan. Explicit zoom/Fit controls remain available. Open a card for the full screen.

Editors and owners choose **Paths** to enter editing without opening a source/destination form. Move cards with their grips (or arrow keys), auto-arrange, or use **Connect** on a source screen followed by **Connect here** on the target. Selecting a connection opens its contextual label/removal controls and discussion. Manual branches use dashed arrows and do not imply an automatically discovered or executable route. Commenters may select and discuss saved paths without acquiring structure-editing permissions; a new path must finish autosaving before its first comment.

**Remove screen** hides the screen and its adjacent active paths from this board after confirmation. **Restore** returns the screen to the draft; reconnect paths explicitly as needed. Captured images, screen pins, recording order, and previous versions stay intact. Removed connection threads remain readable and replyable in **All comments**, labelled with their original path context. A saved connection identity cannot be reassigned to different endpoints.

Structural edits **autosave** after a 500 ms pause or a completed drag. **Undo** reverses the last local board edit and autosaves the inverse, even after the original edit was saved. A drag or continuous label-typing burst counts as one operation. Undo restores a removed screen with its original paths; the separate Restore action restores only the screen. History holds up to 50 operations in the current flow session and resets on reload, flow/version changes, or adopting another editor's board. Comments and recordings are not part of Undo.

The board shows waiting, saving, and saved status. Failed writes keep your edits and offer **Retry autosave**. Revision conflicts pause saving; **Load saved board** explicitly replaces your local draft with current server state. **Done editing** and internal navigation wait for pending saves and stay on the board if they fail. Browser-supported unload warnings protect pending work on reload/full-document departures; abrupt closure cannot guarantee saving. Comment submission remains explicit and separate.

In **Screen & comments**, **Add comment** mode is enabled initially: click the captured image to draft a pin, enter feedback, and post it. Keyboard users can focus the image, press Enter, and adjust the horizontal/vertical percentage fields. Click a saved pin to read or reply to its discussion. Editors and owners can resolve/reopen threads; resolved pins are hidden by default and can be shown. General page/screen comments remain supported.

Pin positions are normalized to the original screenshot, not browser pixels. Layouts, paths, pins, and replies persist in SQLite/libSQL and belong to the exact recording version. Existing installations migrate automatically without resetting captures or comments. A new version does not move historical pins onto its new screenshots. DOM-element re-anchoring, automated action replay, and obstacle-avoiding graph routing are not included.

The current direct-editing subset has passed package and root production builds, lint, and all 113 package tests, including 15 autosave tests. Local browser checks cover automatic saving, grouped Undo, screen/path restoration, save failures/retry, and guarded departure, with desktop/mobile layout checks. Earlier connection/discussion checks are recorded in the repository's validation log. Fresh hosted and separate-host installation checks were not repeated. Decision elements and URL-based screen addition are **not implemented**. The product still needs a choice between diagram decision nodes and prototype forms, and between real URL-page capture and clearly labelled URL-only placeholders.

## Share with employees and clients

Set these server-only values for a shared deployment:

```dotenv
REVISIONLAB_DATABASE_URL=libsql://your-database.turso.io
REVISIONLAB_DATABASE_AUTH_TOKEN=your-database-token
REVISIONLAB_OWNER_EMAIL=owner@example.com
RESEND_API_KEY=your-email-api-key
REVISIONLAB_EMAIL_FROM=RevisionLab <reviews@your-verified-domain.com>
```

The owner signs in with an email verification code, then creates expiring commenter/editor invitations in the workspace. Reviewers use their own email address; they do not need a Vercel account. Named invitations require the invited address; an open invitation can be used by anyone who holds its link and verifies an email address. Revoking an invitation removes the sessions issued through it.

Local SQLite and artifact files need persistent writable storage. Use a remote libSQL/Turso database on a serverless host such as Vercel. Remote mode stores screenshots as private database BLOBs by default, so it needs no additional storage service. An optional server configuration `artifactStorage` adapter can provide separate private object storage. Screenshot reads require authentication; uploads accept PNG, JPEG, or WebP up to 3 MB.

Review APIs enforce authorization independently. To make the prototype pages private as well, initialize with `--protect`. On Next.js 16 this creates `proxy.ts`; on Next.js 15.5+ it creates Node-runtime `middleware.ts`. Static framework assets and the invitation entry points remain accessible. Earlier Next.js 15 releases can embed the widget but cannot use generated Node middleware.

If you already have middleware/proxy rules, compose `protectRevisionLab(request, config)` into them manually and return its response when defined. Existing authentication, rate limiting, and host API rules remain your responsibility. Vercel Deployment Protection executes before the application: configure a review deployment/domain that invited reviewers can reach, or they will still encounter Vercel's login screen. RevisionLab cannot bypass that upstream gate.

## Manual integration

For a host that needs custom placement, add `RevisionLabWidget` from `revisionlab` inside its root layout body, and render `RevisionLabWorkspace` / `RevisionLabAccess` in the workspace/access routes. Create the server configuration with `defineRevisionLabConfig` from `revisionlab/server` and route API methods to `createRevisionLabHandler(config)`:

```ts
import { createRevisionLabHandler } from "revisionlab/server";
import config from "../../../../../revisionlab.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = createRevisionLabHandler(config);
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
```

Adjust the relative configuration import to the route's location. Server configuration and credentials must never be passed into client components. The automatic installer assumes default Next.js route extensions and no framework `basePath`. A static export cannot run RevisionLab's APIs; use a Next.js server deployment.

The command prepares an existing application; it does not create a new Next.js project, publish the package, provision external services, or deploy the host application.
