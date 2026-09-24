# RevisionLab

Embed prototype recording and review in an existing Next.js project. Mount the widget once in your root layout; reviewers can capture screens, discuss a flow, and open its full workspace at `/revisionlab`.

## Install in another project

From the root of an existing Next.js App Router project (no global installation required):

```bash
npx revisionlab@latest init
npm run dev
```

To preview changes first, run `npx revisionlab@latest init --dry-run`. Use `npx revisionlab@latest --help` for available options. Add `--protect` to initialization to generate the optional prototype invitation gate (Next.js 15.5+).

To try an unpublished development build from this repository, build and pack it:

```bash
npm run build:package
npm pack --workspace revisionlab
```

Then run the resulting tarball against an existing project. Use an absolute tarball path for both arguments:

```bash
npx --package /absolute/path/revisionlab-0.1.0.tgz revisionlab init \
  --cwd /absolute/path/my-next-project \
  --package /absolute/path/revisionlab-0.1.0.tgz
```

`--package` makes the generated project install that exact local build. Nothing is published by these commands.

The default installer also installs the exact version you invoked: `npx revisionlab@0.1.1 init` uses that published version, while `npx revisionlab@next init` opts into an available prerelease. The repository's GitHub Release workflow publishes stable versions to `latest` and prereleases to `next`, after validation. See the [maintainer release guide](https://github.com/gil00pita/RevisionLab/blob/main/RELEASING.md) for initial publication and trusted-publisher setup.

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

Run your development server on localhost, open the widget, and start a flow with its name and persona. Capture each screen you want reviewers to see, then choose **Stop recording** to save the completed recording. Stop remains visible in the floating recording controls and in the widget footer on both tabs. It stops new captures, waits for any capture already in progress, and confirms success after the server completes the recording. A failed save stays stopped and can be retried.

Flow metadata and comments persist in `.revisionlab/revisionlab.db`, a local SQLite database initialized automatically; private screenshots are stored in `.revisionlab/artifacts/`. Open `/revisionlab` to review recorded steps and discussions. A loopback development session gets local owner access; this development shortcut is disabled in production. Set `REVISIONLAB_LOCAL_OWNER=false` to test invitation access during development.

Screenshots capture the rendered DOM. Cross-origin images, embedded frames, video, and canvas content may be unavailable to the browser capture API. Record only prototype data that reviewers may access. A persona is a recording label; it does not impersonate or log in as a host application's user.

### Discarding and leaving a page

**Discard recording** asks for confirmation, prevents new captures, waits for any in-flight capture to settle, and deletes the unfinished draft and its captured artifacts rather than saving a completed flow. Only the draft's creator or an owner can discard it; previously completed versions remain untouched. Capture stays stopped even if cleanup fails, with errors and retry controls retained. Local functional checks verified a failed discard retaining the warning and page, then a successful retry removing the draft and artifact before navigation. Warning-dialog visuals were confirmed at desktop and narrow viewport widths.

Normal same-tab page links, including Next.js links, show a warning while recording. **Stay and keep recording** cancels the departure. **Discard recording and leave** waits for successful server cleanup before navigating; failure keeps the warning and current page. For another same-origin prototype page, **Continue recording on next page** lets the journey proceed without discarding. It is disabled while a capture is in progress and unavailable for the review workspace, external destinations, or a recording whose save/discard has begun.

Modified clicks, links opening another tab/window, downloads, and hash-only changes retain normal behavior. Switching tabs does not stop or delete a recording. Reloading, closing the tab, or a full-document departure uses the browser's native `beforeunload` warning when supported; the browser controls its wording and whether it appears. RevisionLab does not delete on unload because the user may cancel or the network request may not complete. Client-side Back/Forward navigation is not globally blocked.

### Programmatic navigation

Ordinary links are guarded automatically while the widget is mounted. For host actions using `router.push`, `router.replace`, or a location assignment, first await `confirmRecordingNavigation(href)` from `revisionlab`. Navigate only when it returns `true`; it does not perform navigation itself. Invoke it immediately before the intended navigation, not during rendering or prefetching.

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
