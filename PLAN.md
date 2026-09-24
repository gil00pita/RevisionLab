# Build Instructions — RevisionLab Embedded Review

## Implementation checkpoint — 22 September 2026

The first functional package is implemented under `packages/revisionlab`, and the root Next.js app uses its public exports. Completed: safe `npx` installer; SQLite/libSQL persistence; private screen artifacts; owner bootstrap and email-code invitations; reviewer/editor/owner authorization; revocation and expiry; optional prototype access gate; layout widget; automatic route and manual screen capture; persona-labeled flows; immutable completed recordings and linked versions; page/screen comments with resolution; full review workspace; Markdown report export.

Registry verification on 24 September 2026 confirms `revisionlab@0.1.1` is published under `latest`, with its CLI entry point available to `npx`. GitHub Release automation is implemented in `.github/workflows/publish.yml`: validate metadata/build/tests/packed CLI, then publish the same tarball through npm trusted publishing. The chosen npm account is `gil00pita`; the maintainer reports completing setup and publication, while GitHub trusted-publisher/environment settings have not been independently checked. See `RELEASING.md` for release operations. Stable releases use `latest`, prereleases use `next`, and the installer defaults to its exact executing package version. Use `npx revisionlab@latest init` in an existing host project; the local tarball workflow in `README.md` remains available for unpublished development builds. Shared deployments require real Turso/Resend configuration. React support currently means React 19 within Next.js 15/16 App Router, not standalone React/Vite.

The whiteboard increment is **implemented**: generated screen layout and recorded-sequence arrows, persisted owner/editor node positioning and labelled connections, pan/zoom/fit/automatic arrangement, and screenshot-area pins with threaded replies and resolution. Local browser checks verified board/path persistence and pin/reply/zoom behavior; build, lint, and all 50 automated tests pass. See `VALIDATION.md` for evidence and remaining limits.

The comment-readability refinement is implemented: individual Chakra cards separate author/date metadata, readable message content, and available actions. Replies have their own full-width cards and a visible count heading. The shared renderer covers screen discussions, all comments, and widget feedback. Desktop/mobile screen discussions, temporary display-only long-content checks, and thread navigation were verified; lint, production build, and all 50 package tests pass. Detailed evidence and un-repeated checks are recorded in `VALIDATION.md`.

The speech-balloon refinement is **implemented**: all eligible pinned root comments show readable previews connected to their saved image locations by default. A hide/show control preserves pins, and selecting a preview or pin expands the same discussion with replies and permitted resolve/reopen actions. Collision-free preview placement can extend the scrollable canvas for dense comments. Expanded threads adapt to narrow viewports; unavailable screenshots retain sidebar access. Browser checks cover desktop/mobile positioning, multiple edge pins, hide/show, keyboard dismissal, unsent reply retention on close/reopen, zoom, and image-failure fallback. Eight new layout tests bring the package suite to 58 passing tests; detailed evidence is in `VALIDATION.md`.

The current navigation refinement is **implemented**: unmodified mouse-wheel input over the full-flow board or its screenshots zooms the complete graph around the pointer. Camera state remains local, with Shift+wheel panning and retained explicit zoom/Reset/Fit, keyboard, background-drag, and touch-drag controls. Ordinary zoom is bounded to 10%–300%; Fit may use a lower scale for large flows. Local browser checks cover wheel anchoring within one pixel, graph-wide scaling, page-scroll isolation, mouse/keyboard controls, bounds, desktop and 390px-wide Fit, and unchanged save state. Eight camera tests bring the package suite to 66 passing tests, including Fit below 10%. Real touch gestures, other browsers, and a large-flow browser fixture remain untested; see `VALIDATION.md`.

The supplied logo/favicon replacement is **implemented and locally verified**: a shared Chakra `RevisionLabLogo` displays the packaged native SVG on the example homepage, workspace navigation, and access header. The example favicon is generated from the same artwork. Lint, the production build, all 66 existing package tests, desktop/narrow-screen logo checks, favicon serving/decoding, and package-asset inclusion checks pass. Functional widget icons and the wider UI palette are unchanged; the installer does not replace host-project icons. A fresh separate-host installation and cross-browser checks were not repeated; see `VALIDATION.md`.

The recording-control refinement is **implemented and locally verified**: visible **Stop recording** controls complete and save the current capture sequence, while confirmed **Discard recording** deletes only the unfinished draft and its artifacts. Normal same-tab page links prompt before leaving; another same-origin prototype page may continue the recording. Lint, the production build, all 88 package tests, and browser Stop/Stay/Continue/discard-retry checks pass. Warning-dialog visuals were confirmed at 1440px and 390px widths; a fresh separate-host installation was not repeated. Host programmatic navigation requires the exported confirmation helper. Native unload warnings and client-side Back/Forward limits are documented explicitly below and in the READMEs; see `VALIDATION.md` for evidence.

The direct-editing request is **partially implemented and locally verified**: **Paths** enters edit mode without the legacy form; on-screen source/target actions create connections, and selection opens contextual label/removal/discussion controls. Screens can be removed from and restored to the board without deleting captures or feedback. Save/Discard and guarded Done editing preserve drafts. Package and root production builds, lint, all 98 package tests, and local desktop/mobile interaction checks pass; see the current increment below and `VALIDATION.md` for evidence and remaining limits. Decision elements and adding a screen by URL remain **not implemented**, pending the two unanswered choices in `PRODUCT.md`.

The sections below remain the broader target product plan. Playwright action replay, automatic discovery of unrecorded paths, executable branch conditions, DOM-element anchors/re-anchoring, visual diffing, structured Codex task generation, and the broader export integrations are not part of this increment. Recorded versions preserve captured screens; they do not replay an action script. Remote artifacts default to private database BLOBs for simple setup, with an adapter boundary for object storage. `PRODUCT.md` is authoritative for the distinction between the current screenshot-based workflow and those later capabilities.

## Objective

Build an installable integration that adds a versioned, reviewable user-flow workspace to an existing Next.js application. Developers initialize RevisionLab inside an individual project and mount its component in the Next.js layout. Reviewers enter through a floating widget on the prototype and open the project's full-page review workspace.

The target workflow has no centralized project dashboard or project-creation step. This document describes planned implementation; package names, commands, and public API names below are proposed contracts until implemented and published.

The application should allow a designer, BA, developer, or client reviewer to:

1. Open an existing web prototype with RevisionLab installed, click its widget, and open the project's full-page review workspace.
2. Start recording directly from the widget, select a role/persona profile, and record a user journey using Playwright.
3. Convert the recorded journey into structured steps.
4. Automatically generate visual screen previews for each meaningful step.
5. Display those screens as nodes on an infinite whiteboard/canvas.
6. Connect screens to represent navigation and decision branches.
7. Add comments and annotations directly to screens and UI elements.
8. Replay recorded flows using Playwright.
9. Detect changes between prototype versions.
10. Convert comments into structured implementation tasks/prompts for Codex.
11. Generate review reports.
12. Export review information to Markdown, JSON, PDF-ready HTML, Confluence-compatible content, and optionally Miro/Excalidraw.

The live prototype is the source of truth.

Do not design the system around manually maintained screenshots.

Screenshots are generated artifacts and should be recreated automatically from recorded flows.

---

# Core Product Concept

The system consists of five major areas:

- Project Installer / Layout Integration / Widget
- Prototype Runner
- Flow Recorder / Step Editor
- Review Canvas
- Review / Delivery System

Conceptually:

Install in host project
→ mount in Next.js layout
→ open prototype
→ click widget
→ open project-local review workspace
→ Playwright recording
→ structured Flow
→ Steps
→ Actions
→ generated screen states
→ Review Canvas
→ Comments / annotations
→ Codex / reports / exports

---

# Technical Stack

Use:

- Next.js App Router, with an explicitly tested support range for the integration
- React
- TypeScript
- Playwright
- Embedded SQLite at `.revisionlab/revisionlab.db` for local structured data, with native artifact files alongside it
- Turso/libSQL as the default shared Vercel adapter, using the same logical schema; no database service or mandatory ORM setup for local work
- A passwordless email-verification adapter, initially supporting Resend, for client and employee review invitations
- A canvas composed from Chakra UI primitives and geometric connectors, without a new graph or styling dependency for this increment
- Chakra UI v3 for authored RevisionLab UI, following `AGENTS.md`
- Zod for runtime validation

Prefer server-side APIs and server actions where appropriate.

The architecture should remain modular enough that the canvas could later be replaced with a more advanced custom renderer.

---

# Installation and Integration Contract

Proposed command: `npx revisionlab init`.

The installer should:

1. Detect the Next.js App Router, package manager, existing layout, and configured base path. Explain unsupported configurations without partially modifying the project.
2. Add the RevisionLab dependency using the project's package manager and lockfile.
3. Initialize `.revisionlab/config.json` with non-secret integration settings, then automatically create `.revisionlab/revisionlab.db`, apply bundled migrations, and initialize project identity in the database. Reuse existing databases and identity on repeat initialization. Local users should not install a database CLI, create a database manually, supply a connection string, or run a separate migration command.
4. Add a small integration component inside the existing layout's body, alongside its children. Preserve existing metadata, providers, imports, and server-component behavior.
5. Scaffold a thin review page at the configured route and server endpoints backed by the package. Detect route/file conflicts before applying changes; never overwrite host code silently.
6. Add `.revisionlab/` to the host's ignore rules by default, preserving existing rules. Explain optional tracking of non-secret configuration and sanitized JSON exports; always exclude the live database, journals, runtime files, and authentication state.
7. Show the applied changes, local runner setup, folder storage/backup behavior, and how to disable or remove the integration. Re-running initialization must not duplicate providers, components, routes, or project identities. Removing the integration preserves review data unless deletion is explicitly requested.

Proposed public component: `RevisionLab` from `revisionlab/next`. Keep its browser functionality behind its own client boundary. Server-only secrets and adapters must not cross that boundary. The host must not need a Chakra provider or Chakra-specific changes to its own components.

The review route defaults to `/revisionlab` and can be changed. It renders the package's full-page workspace through a generated host route entry. It must respect the host's base path and authorization integration and work when loaded directly or refreshed. Hide host navigation within this page where needed using documented layout composition; do not replace or broadly convert the host root layout.

Separate the package into browser integration, lazy-loaded review UI, server adapters, CLI, and runner boundaries. Do not bundle Playwright, database clients, or server credentials into the host browser bundle. Scope Chakra styles and preflight so mounting RevisionLab does not restyle host elements; verify coexistence with hosts that use Chakra and hosts that do not.

## Environment and persistence

- Enable review capabilities in explicitly configured development/review environments. Production is disabled by default. The same setting gates the widget, review routes, APIs, artifacts, and runner access on the server.
- Derive the current page context from the host and resolve a configured environment base URL for replay. Users do not register the current application URL in a central dashboard. Preview URLs and older deployment URLs are version metadata.
- Preserve a stable installation ID across redeployments. A separate installation for another repository gets a separate ID and isolated data.
- Use SQLite inside `.revisionlab/` for local structured records and adjacent files for generated artifacts. Browser storage and ephemeral deployment filesystems are not durable review stores.
- Shared Vercel deployments use the configured Turso/libSQL project database and private artifact store through server-side adapters. Preview deployments share data only when they use the same installation id and hosted store. Never open or synchronize a local SQLite file across machines through a network filesystem.
- Read-only hosts may serve an explicitly included snapshot through authorized endpoints. Disable recording, comment submission, and other persistent mutations unless connected to a durable writer; never acknowledge a save that exists only in temporary memory or an ephemeral filesystem.
- Store version metadata and historical artifacts independently of deployment lifetime. If an old deployment is unavailable, its saved review remains readable and **Open Live** clearly reports unavailability.

---

# Important Architectural Principle

Playwright is the execution engine.

Playwright scripts are NOT the primary source of truth.

The application's own structured data model must represent:

- project installations
- recording profiles (roles, personas, and test-state setup)
- prototype versions
- flows
- flow variants per recording profile
- steps
- actions
- branches
- screens
- annotations
- comments
- review decisions
- executions
- reports

Playwright recordings may be imported into this model.

The application should generate Playwright execution logic from the structured model.

Do not make `.spec.ts` files the canonical representation of a flow.

---

# Domain Model

Implement approximately the following concepts.

## ProjectInstallation

Represents the host repository/application where RevisionLab is installed. It is initialized by the CLI, not created through a project dashboard. Existing `projectId` relationships refer to this installation identity.

Fields should include:

- id
- name
- description
- reviewBasePath
- environmentBaseUrls (local, preview, and explicitly enabled review deployments)
- repositoryUrl optional
- createdAt
- updatedAt

Non-secret project settings live in `.revisionlab/config.json`; machine-specific overrides live in `.revisionlab/local/`. Resolve credentials from environment variables or a secret provider, not JSON records. Temporary browser authentication state, if needed, lives under the ignored local directory with restricted access. Secret values must not be returned as installation metadata.

---

## ReviewInvitation, ReviewerIdentity, and ReviewSession

`ReviewInvitation` grants a limited capability to a project, review, flow, or prototype version. Store:

- id and projectId
- scope type and scope id
- permission: commenter, editor, or owner
- mode: named emails or open verified email
- normalized invited-email hashes for named invitations
- expiresAt, revokedAt, createdBy, createdAt, and lastUsedAt
- a hash of the high-entropy invitation token; never store or log the raw token

`ReviewerIdentity` represents a verified email without creating a conventional product account. Store a stable id, normalized email, display name, verification timestamps, and audit timestamps. Do not infer elevated permissions from its email domain.

`ReviewSession` binds an identity to a valid invitation grant. Store a hashed opaque session id, invitation id, identity id, effective scope/permission, expiry, revocation, creation, and last-seen metadata. Send only the opaque value in a secure, HTTP-only, same-site cookie. Rotating or revoking the invitation invalidates its sessions.

`EmailChallenge` stores an invitation id, normalized email, hashed single-use code, expiry, attempt count, and consumed timestamp. Generic responses prevent email-enumeration signals. Rate-limit by invitation, email hash, and source; audit repeated failures without logging codes or raw invitation tokens.

Comments and replies reference `reviewerIdentityId` and retain an immutable author snapshot. Ownership/editor authority comes from the active scoped grant, never from a comment snapshot, display name, prototype persona, or matching domain.

---

## PrototypeVersion

Represents a specific prototype revision.

Possible fields:

- id
- projectId
- label
- gitCommitSha optional
- deploymentUrl
- createdAt
- metadata JSON

Examples:

- v12
- PR-142
- commit abc123
- Vercel deployment URL

---

## Flow

Represents a business/user journey.

Example:

"Create New Application"

Fields:

- id
- projectId
- name
- description
- startPath (resolved against the selected version/environment base URL)
- currentVersionId
- createdAt
- updatedAt

A flow contains role/persona variants, each with ordered Steps and potentially branches.

PrototypeVersion and Flow both belong to the installation. A FlowExecution binds a flow variant to the exact prototype version, recording-profile snapshot, viewport, status, and immutable generated artifacts for that run. Reviews and comments retain their original version/execution/profile context when newer runs replace the current canvas previews.

---

## RecordingProfile and FlowVariant

A RecordingProfile belongs to one installation and includes:

- id, projectId, name
- role key and display name
- optional persona name and scenario description
- synthetic fixture/setup reference
- server-only authentication setup reference, if required
- createdAt and updatedAt

A role represents prototype permissions/responsibilities; a persona represents a user scenario or test-data state. Neither grants permissions to the reviewer in RevisionLab. Provide a **Default** profile for prototypes that do not need role-specific setup.

A FlowVariant includes `id`, `flowId`, `recordingProfileId`, name, start-path override if needed, and timestamps. It owns its ordered steps, actions, and transitions, because different profiles may take different paths. One flow can have several variants; unrelated journeys remain separate flows. Optional explicit step correspondences support comparing variants; do not infer equivalence solely from route or step order.

Executions must snapshot the selected profile's non-secret setup metadata and configuration revision so later profile edits do not relabel or alter historical runs. Keep credentials and authentication state outside snapshots and exports. A generated screen artifact belongs to an execution and variant step, not just a shared route. Replaying one variant must not overwrite another variant's artifacts, canvas arrangement, or feedback.

---

## Step

A Step represents a meaningful UI state.

Examples:

- Customer Search
- Search Results
- Customer Overview
- Application Details
- Validation Error
- Review
- Confirmation

Fields:

- id
- flowId
- name
- description
- order
- flowVariantId
- route
- stateParameters JSON
- viewport JSON
- latest screen artifact reference for this variant's selected execution
- optional DOM snapshot reference for that execution
- createdAt
- updatedAt

A Step contains one or more Actions.

The whiteboard primarily displays Steps, NOT every Playwright action.

---

## Action

Represents an executable browser action.

Examples:

- navigate
- click
- fill
- select
- check
- uncheck
- press
- wait
- upload
- assertion

Fields:

- id
- stepId
- order
- type
- locator strategy
- locator value
- input value optional
- metadata JSON

Prefer resilient locator strategies:

1. data-testid
2. ARIA role + accessible name
3. label
4. text
5. CSS selector only as a fallback

---

## Edge / Transition

Represents movement between steps.

For the current whiteboard increment, create directional edges from the captured step sequence and allow owners/editors to add or remove explicit labelled connections within the selected flow version. Validate that both endpoints belong to that authorized flow/version. Treat a label as review documentation, not executable logic. Persist saved connections so reloading neither duplicates generated edges nor recreates deliberately removed connections.

The implemented edit-mode subset gives connections durable identities through a per-flow `board_edges` registry. Endpoints and recorded/manual provenance cannot change under a saved identity, including after removal. Saved-board revision checks cover structural changes; root connection comments require an active saved edge in the exact flow/version. Removing an edge archives its identity and preserves existing threads for reading, replies, and resolution. Legacy identities register transactionally before replacement saves. Decision nodes remain unimplemented; if confirmed, give them separate graph identities rather than overloading screenshot step IDs.

Fields:

- id
- flowId
- sourceStepId
- flowVariantId
- targetStepId
- label
- condition optional
- branchType optional

Examples:

Details
→ Continue
→ Review

or

Details
→ Invalid
→ Validation Error

---

## Annotation

Annotations are tied to a specific Step and exact captured flow version. The current increment uses screenshot-relative coordinate pins, not guessed DOM elements.

Fields:

- id
- stepId
- prototypeVersionId
- flowVariantId
- executionId (identifies the reviewed screen and recording-profile snapshot)
- screenshot artifact reference, identifying the reviewed immutable image
- imageCoordinates JSON optional (`x` and `y` in the inclusive range 0–1)
- targetLocator JSON optional, reserved for a later element-capture capability
- type
- text
- authorId
- status
- createdAt
- updatedAt

Types may include:

- UX
- content
- accessibility
- defect
- question
- decision
- technical
- BA requirement

Statuses:

- open
- acknowledged
- in-progress
- ready-for-review
- resolved
- deferred

For current pinned comments, image coordinates are the primary anchor. Validate finite coordinates, require a concrete screen target, and reject mismatched flow/step/version references. Unpinned existing page and screen comments remain valid and must not be assigned invented coordinates during migration.

A root comment owns the pin. Replies reference the root thread and inherit its exact screen/version context; they do not create another pin. Preserve verified author attribution, timestamps, and open/resolved status. Restrict resolution/reopening to owners/editors according to the current server policy. A later DOM-aware anchor may coexist with coordinates but must not silently relocate an older version's discussion.

---

# Main User Experience

## 1. Embedded Widget and Full-Page Workspace

On enabled prototype pages, render an accessible floating widget with configurable placement. Clicking it opens a compact launcher with current route/version context and first-class **Open review workspace** and **Record prototype** actions. Offer relevant flow/comment links; never start recording on widget open. Recording setup and launch must be possible without visiting the workspace first.

Open the full-page workspace at the configured project-local route. Default to a new tab using an accessible link, preserving the original prototype tab and its unsaved state; offer a same-tab option. Carry validated project-local return context and flow/version selection. Avoid placing sensitive form values or arbitrary redirect targets in URLs.

The workspace allows users to:

- view flows
- inspect and reply to comments
- view review activity
- view prototype versions
- create or record a new flow
- filter flows, generated screens, comments, and runs by role/persona
- inspect multiple recorded variants alongside one another with their profile and version labels visible
- open a particular flow, comment, or version through an authorized deep link
- return to the original prototype tab, or its saved local route if the tab is unavailable

If several flows match the current route, offer a choice; if none match, offer the first-flow empty state. Keep flow selection and version context consistent across views. Support keyboard focus, Escape to close the launcher, mobile layouts, loading/error states, and focus return to the widget.

Hide the widget on RevisionLab's own routes and live previews inside its workspace. Exclude the launcher, recording toolbar, review routes, and RevisionLab interactions from captured screenshots and recorded flows. Defer loading the canvas/editor until the workspace is opened.

---

# 2. Record Flow

Current DOM-capture controls use **Capture screen**, **Stop recording**, and confirmed **Discard recording**. Stop stays visible in the floating controls and every widget tab's footer; it finishes any active capture and completes the flow on the server. The controlled Playwright session and richer toolbar below remain planned. See the current recording-control refinement in Build Strategy for implemented navigation coverage, completed checks, and remaining validation limits.

Provide a clear action:

"Record prototype"

In the widget, provide a compact setup with journey selection/name, role/persona profile, starting route, viewport, and explicit **Start recording**. Reuse the same setup from the workspace. Offer **Default** for projects without profiles, and a configuration path when a required persona is missing.

Launching it should open a controlled browser session driven by Playwright.

Use a local runner or configured worker connected to this installation. A normal browser widget cannot launch Playwright itself. Start from the current project's selected version and route; report a missing runner with setup guidance. Existing review data remains accessible without a runner.

Prepare a fresh browser context for the selected profile using its authorized test-account setup and synthetic fixtures. Use isolated test records or a documented reset mechanism so runs do not contaminate another persona's starting data. Verify setup succeeded before recording; do not substitute the reviewer's current account or another persona silently. The original host tab retains its session. The widget hands off to the controlled prototype window with a clear indication that recording is active there.

Display a recording toolbar.

Example:

● Recording — Applicant / First-time applicant

[Capture Step]
[Annotate]
[Decision]
[Pause]
[Finish]

Keep the selected profile visible and fixed during a recording. **Finish** saves its flow variant and starts screen generation, with progress, retryable failures, and **View generated flow**. **Record another role/persona** starts a fresh recording for a different profile under the same journey or a separately named flow. Canceling must not publish an incomplete variant as a successful recording.

MVP captures one profile per session. Do not change authenticated roles mid-recording or automatically fabricate other profiles' screens. Multi-role journeys can link separately recorded flows at handoff steps.

---

# Recording Behaviour

Record browser actions including:

- navigation
- clicks
- form entry
- selections
- keyboard actions
- significant route changes

Do not automatically create a visible Step for every raw action.

The system should distinguish between:

Action:
typing a field value

and:

Step:
completed application form state

Users should explicitly be able to choose "Capture Step".

The system may also suggest automatic Steps following:

- navigation
- modal opening
- route change
- major DOM change
- submitted form
- error state
- confirmation state

Users must be able to accept/remove automatically generated steps.

---

# 3. Visual Step Editor

After recording, show a visual editor.

Example:

Step 1
Customer Search

Action:
Navigate to /customers

---

Step 2
Search Results

Actions:
Fill search field
Click Search

---

Step 3
Customer Overview

Action:
Click customer result

The user should be able to:

- rename step
- reorder step
- delete step
- duplicate step
- edit action
- change locator
- rerun step
- recapture screen
- add branch
- insert manual step
- add annotation
- change viewport

---

# 4. Replay Engine

Implement:

Replay Flow

The replay engine should:

1. start a clean Playwright browser context
2. load the requested prototype version
3. execute actions sequentially
4. stop/capture at every Step
5. generate a screenshot for every Step
6. optionally store DOM snapshots
7. record execution status
8. report failures

Replay uses the variant's recorded profile setup and an isolated browser context. If setup is unavailable or permissions no longer match, fail with a setup error before capturing misleading screens. Attribute every generated screen and result to the variant, profile snapshot, prototype version, and viewport. Compare changes within the same variant by default; cross-persona inspection must not label expected permission differences as regressions.

Possible results:

✓ Customer Search
✓ Search Results
✓ Customer Overview
✓ Application Details
✗ Review

Clicking a failed step should expose:

- failing action
- expected locator
- actual page
- screenshot
- error
- trace

Use Playwright tracing where appropriate.

---

# 5. Review Canvas

Create a generated pan/zoom whiteboard similar conceptually to:

- Miro
- FigJam
- Excalidraw

But DO NOT attempt to recreate all of those products.

Optimize specifically for prototype review.

Compose the board, screen nodes, controls, and geometric connectors from Chakra UI primitives. Chakra has no complete flow-editor behavior, so its primitives provide the presentation and accessible controls while focused application logic handles board geometry. This is the chosen implementation approach, not a user requirement to use a particular graph engine. A later React Flow/XYFlow integration would require a documented capability gap and review against `AGENTS.md`; it is not accepted or installed by this plan.

Each captured Step appears as a Screen Node. On first open, arrange the recorded sequence and draw directional arrows between successive steps. A recording with one screen needs no edge. Do not infer unrecorded paths, merge screens merely because they share a route, or show example screens as real data.

Persist board positions and connections per exact flow version through authorized server APIs. Owners/editors may move nodes, automatically arrange the board, or edit explicit labelled connections; commenters may navigate/select/comment but not mutate its shared structure. Keep local drag/zoom state separate from committed layout data. Show pending/error states, recover failed edits, and preserve saved layouts across reloads and application restarts. Schema migrations must preserve all existing flow versions, screenshots, and comments.

For the current wheel-navigation refinement, handle unmodified wheel input across the board viewport, including screenshot nodes, and scale the whole graph around the board point under the pointer. Apply smooth, bounded camera changes using a normal 10%–300% range; allow Fit to go below the manual minimum for large graphs. Shift+wheel pans. Preserve zoom buttons, Reset 100%, Fit, keyboard navigation, background dragging, and touch dragging. Prevent page scrolling only for wheel input handled inside the board; scrolling elsewhere remains ordinary page navigation. Camera changes must not rewrite draft or persisted node coordinates, mark a board dirty, or change connection/comment identity or anchors.

Example:

┌──────────────────────────┐
│ Application Details      │
│                          │
│ [generated screen]       │
│                          │
│ 3 comments               │
│ Changed since v14        │
└──────────────────────────┘

The current increment must support:

- visible role/persona and version context
- screen selection with detailed image and discussion
- owner/editor screen movement, with non-drag controls for keyboard users
- pan, zoom, fit-to-content, and automatic arrangement
- directed sequence edges and explicit labelled connections
- saved board positions and connections, scoped to one flow version
- screen-area comment pins and thread selection
- a keyboard-accessible screen list and usable narrow-screen review
- opening the available live prototype route

Later scope includes variant grouping, node resizing, executable branch recording, replay-step controls, and opening reconstructed interactive state. Keep unavailable actions out of the working interface.

---

# Live vs Screenshot State

The generated screenshot should be the default review representation because it is stable and easy to compare.

However provide:

"Open Live"

which can render the actual prototype state where technically feasible.

Do not require users to manually generate or replace screenshots.

Screenshots are automatically regenerated by replaying the flow.

---

# 6. Branching

Support explicit labelled alternative connections between captured screens in the current board. Owners/editors choose a source and destination within the selected flow version; reject missing or cross-version endpoints. These connections document a possible path and do not execute it or generate unseen screens.

Example:

Application Details
        |
        v
     Continue
      /    \
 Valid    Invalid
   |         |
   v         v
Review    Error State

Current increment:

- create or remove a directed connection manually
- label a transition
- point several paths to an existing screen

Implemented direct-editing interaction:

- **Paths** toggles editing on the whiteboard without opening the legacy connection form.
- Select **Connect** on the source and **Connect here** on the target; buttons provide the non-drag keyboard path. Select a connection for contextual label/removal controls and its own discussion.
- **Remove screen** records reversible board membership and removes adjacent active connections; **Restore** returns the captured screen. Neither operation deletes captures, pins, versions, or archived discussion history.
- Structural edits autosave, with **Undo**, save status, retry, and explicit conflict recovery. **Done editing** and internal navigation await pending saves; comments still submit separately. New paths cannot receive root comments until autosave confirms their saved identity.

Still unimplemented: add a decision element after confirming diagram node versus prototype form, and **Add screen** by URL after confirming real capture versus a URL-only placeholder. No executable decision conditions or URL-capture service are implied.

Structural editing remains owner/editor-only. Connection discussion is available to authorized commenters outside edit mode as well; commenting must not depend on granting permission to change the graph.

Later executable-flow scope:

- record a branch from a selected step
- define and evaluate a condition
- merge recorded branches while preserving execution/history context

---

# 7. Annotation Mode

Provide normal screen inspection and explicit **Add comment** mode. Selecting an existing pin opens its discussion rather than creating a new draft.

For the current screenshot workflow:

1. The reviewer selects the exact screen/version and activates comment mode.
2. Clicking the rendered image creates a draft point using `(pointer - image bounds) / rendered image size`, not node/card/viewport coordinates. Only the actual loaded image accepts placement.
3. A composer retains the draft target while the reviewer writes; canceling saves nothing.
4. Submission validates the finite normalized point and its authorized screen context, saves the root comment, and displays the durable pin only after the server acknowledges it.
5. Display speech-balloon previews for all eligible root pins by default, respecting the resolved filter. Bubble or pin selection expands the corresponding thread beside the saved image point, with an arrow indicating its pin. Replies and owner/editor resolution/reopening update that same discussion; legacy unpinned feedback remains visible in the sidebar.

Use image-relative pin rendering so responsive sizing, canvas zoom, panning, and node movement do not change the target. Provide keyboard-accessible pin selection and an explicit non-pointer way to position/adjust a new pin. Preserve readable marker contrast, focus, and useful accessible names. Retain failed drafts for retry and surface missing-image/storage failures honestly.

Compose the expanded anchored discussion with Chakra UI's supported overlay parts and retain the shared thread content. Keep all eligible previews visible until the reviewer hides bubbles using an explicit control; hiding previews must not remove pins. Recalculate placement on scrolling, image zoom, and resizing; flip/shift at viewport edges and constrain long thread content to a reachable scrollable area. Handle nearby bubbles without losing their individual pin associations. A shifted or clamped bubble must still identify its actual target, not imply a new location, and must not change normalized coordinates. Support a visible close control and Escape dismissal for the expanded thread, returning focus to its activating pin or preview. Do not automatically scroll mobile reviewers away from the image to the sidebar. Expand only one thread at a time and clear unrelated selection when the screen/version changes.

Do not copy pins to a new version or re-anchor them merely because a screen has the same route or ordinal. The original screenshot remains their source of truth. DOM locator capture, replay-aware re-anchoring, and a **Target changed or no longer exists** state belong to a later element-aware workflow; screenshot clicks must not fabricate locators.

---

# 8. Commenting

Support threaded comments. The whiteboard increment includes root comments, replies, verified authorship, exact flow/version/step context, optional screenshot pins, and owner/editor open/resolved state. Pin selection and the thread list must identify the same root discussion. Authenticated commenters may add threads and replies but cannot edit the shared board or resolve threads under the current policy.

Connection feedback uses `edgeId` plus `flowId`, with no screen target or screenshot anchor. Replies inherit that exact context. Root submissions validate the active saved connection inside the same write transaction as comment creation; removed-path threads retain archived endpoint/label context and remain available in All comments and Markdown exports. Existing page/screen feedback is unchanged.

Present comments and replies in individual Chakra UI cards across the existing feedback surfaces. Give each card a clear boundary and padding, separate author/timestamp metadata from the full message and available actions, and leave space between cards. Keep reply cards grouped with their parent discussion and preserve active-pin focus and open/resolved state. Wrap long names, messages, and links; retain message line breaks; allow controls to wrap at narrow widths without clipping content. This is a presentation refinement, not a change to the comment schema, authorization, pins, or save behavior.

For pinned screen feedback, place that readable discussion inside the anchored speech balloon rather than requiring the sidebar to read or reply. Include the complete root message, replies, composer, and authorized resolution controls. Keep sidebar cards for overview/navigation and general or unpinned comments; both presentations reference the same root thread and committed data.

Later review capabilities may add:

- mentions
- assignment
- category
- link to code task

Current filters include all/open/resolved. Later category and change-aware filters include:

- UX
- defects
- BA
- accessibility
- changed since version

---

# 9. Versioning

Prototype reviews must be version-aware.

Display:

Review created against: v14
Current prototype: v17

Detect which screens changed.

Possible statuses:

- unchanged
- changed
- new
- removed
- execution failed

Do not depend solely on pixel-perfect screenshot comparison.

Use a combination of:

- screenshot difference
- DOM structure
- route/state data
- successful locator replay

Visual comparison can be added later.

---

# 10. Review History

Provide a version/history panel.

For each review:

- prototype version
- date
- reviewer
- changes
- comments
- decisions
- execution result

A reviewer should be able to inspect an older review without losing the current one.

---

# 11. Codex Integration

Allow one or multiple comments to be selected.

Provide:

"Create Codex Task"

Generate a structured Markdown prompt.

Example:

## Implementation Request

Flow:
Create New Application

Prototype version:
v18

Screen:
Application Review

Route:
/application/review

Feedback:

1. Move the Submit Application CTA closer to the summary section.
2. Preserve the Back action.
3. Ensure layout remains responsive.

Affected element:

role=button
name="Submit Application"

Acceptance criteria:

- Submit button appears directly below summary.
- Existing validation logic remains unchanged.
- Mobile and desktop layouts remain usable.

Source review comments:

#42
#48

The user must be able to copy or export this prompt.

Future integration with Codex APIs/tools may be added separately.

---

# 12. Reporting

Provide:

Generate Review Report

Report should contain:

- project
- flow
- flow variant, role, and persona
- prototype version
- review date
- summary
- number of screens
- number of comments
- open comments
- resolved comments
- decisions
- changed screens
- failed flow steps
- screenshots
- annotation details

Example structure:

# Prototype Review — Customer Application

Version: v18

## Summary

12 screens reviewed
18 comments
11 resolved
5 open
2 deferred

## Decisions

- Search results remain card-based.
- Address lookup retained.
- Confirmation page simplified.

## Open Issues

### Application Details

[screenshot]

Issue #17
Validation message unclear.

Owner: UX
Status: Open

---

# 13. Exports

Implement export adapters.

Initial exports:

- Markdown
- JSON
- HTML

Design adapters/interfaces for future:

- Confluence
- Jira
- Miro
- Excalidraw
- PDF

Do not tightly couple domain logic to an external platform.

---

# Excalidraw Export

If practical, provide an initial Excalidraw JSON export.

Map:

Screen Node → image element + grouped title
Transition → arrow
Sticky → text/rectangle
Annotation → text/marker

This is optional for MVP if it significantly expands scope.

---

# Confluence

Generate Confluence-friendly structured output.

At minimum support:

- Markdown
- clean HTML

Structure reports so that they can later be pushed directly through the Confluence API.

---

# Security

Prototype review environments may contain client-sensitive material.

Use RevisionLab passwordless invitations as the default reviewer-access system. Reviewers verify any permitted email using a short-lived one-time code and receive a scoped session; they do not create a Vercel account, RevisionLab password, or permanent account profile. This application-level gate must cover the prototype, workspace, APIs, and private artifacts in the dedicated review environment. Vercel Authentication and shareable links are deployment controls, not reviewer identity or comment authorization.

Implement:

- authentication
- expiring and revocable named/open review invitations
- hashed, single-use email challenges with attempt and send rate limits
- scoped reviewer sessions using secure HTTP-only cookies
- project-level authorization
- installation-scoped authorization enforced on every review page, API, artifact, and runner request
- review data private by default, including direct links
- signed artifact URLs if cloud storage is used
- noindex
- robots exclusion
- secure cookies
- CSRF protection where relevant
- audit trail for important actions

Never store real passwords from recorded prototype sessions.

Sensitive form values should support masking.

Users should be able to mark fields as:

- secret
- personally identifiable
- excluded from recording

Recorded data should default to synthetic/test data.

Provide an authorization adapter so a host may integrate its own identity system later, while passwordless invitations remain the default. Local-only development can use an explicitly enabled loopback identity. Remote/shared reviews require a valid invitation session. Hiding the widget is not authorization. Enforce access again in every route handler/server action and artifact response; do not expose protected content when the integration is disabled or a visitor knows a direct URL.

The email verification endpoint is the only anonymous application entry point required for review access. Return generic challenge responses, bind the post-verification redirect to validated project-local destinations, rotate sessions after verification, and revoke all derived sessions when an invitation is revoked. Apply CSRF protection to state-changing requests and use origin checks where appropriate.

Validate execution targets against the installation's configured environments. Local execution may target its configured loopback application; hosted workers must not accept arbitrary internal network URLs. Review links do not bypass either workspace access or prototype authentication.

---

# Prototype Authentication

Support prototype URLs requiring authentication.

Design a configurable setup mechanism rather than hardcoding credentials.

Possible strategies:

- storage state
- environment variables
- setup action
- auth bootstrap script

Never expose prototype credentials in the client.

Bind profile authentication to server-side secret references or ephemeral runner state. Only expose profiles the reviewer is authorized to execute, validate that authorization when launching a run, and clean up isolated sessions after use. Selecting **Administrator** as a prototype profile must never confer administrative access to RevisionLab or bypass host authorization.

---

# MVP Scope

Build MVP around one excellent workflow:

Initialize RevisionLab in an existing Next.js project
→ mount the integration in its layout
→ open the prototype
→ click the widget
→ create or open a passwordless review invitation
→ verify an employee or client email with a one-time code
→ choose Record prototype and a role/persona
→ record a flow variant
→ capture meaningful steps
→ edit steps
→ replay using Playwright
→ generate screens
→ open the full workspace with screens grouped by role/persona
→ record another profile in an isolated session
→ annotate screen
→ comment
→ create Codex prompt
→ generate Markdown report

Do NOT initially implement:

- centralized project hub or cross-project portfolio dashboard
- separate prototype hosting or deployment management
- full Miro replacement
- multiplayer cursor presence
- complex freehand drawing
- video conferencing
- advanced permissions
- enterprise SSO and Vercel-account-based reviewer access
- permanent reviewer accounts, passwords, profiles, or account administration
- Jira integration
- direct Confluence API writes
- AI-generated flow inference
- automatic requirement extraction
- pixel-perfect visual regression

Prepare architecture for them without implementing unnecessary complexity.

---

# Suggested App Navigation

Entry point on the prototype:

RevisionLab widget → compact launcher → Open review workspace

Inside the full-page workspace for this installation:

Flows
Comments
Reviews
Versions
Reports
Settings

Inside Flow:

Canvas
Steps
Comments
Runs
History

Primary actions:

Record prototype
Replay
Review
Generate Report
Export
Back to prototype

Display the installation name and current version for orientation. Do not add a project switcher or project creation screen. Each project supplies its own widget and workspace route.

---

# Visual Design

The product should feel like a professional design/development tool.

Keep the embedded widget compact and unobtrusive. The full-page workspace provides the large canvas, comments panels, and version tools; the launcher is only an entry point. RevisionLab must coexist with the host application's visual system without changing its layout or global styles.

Avoid:

- generic dashboard appearance
- excessive cards
- gradients everywhere
- excessive rounded containers
- toy-like whiteboard styling

Aim for something closer to:

- Linear
- Figma Dev Mode
- Playwright Trace Viewer
- GitHub
- modern developer tooling

The canvas should dominate the flow experience.

Chrome/navigation should remain quiet.

---

# State Management

Keep server state separate from temporary canvas/UI state.

Persist durable changes through the configured server-side `ReviewStore`: `.revisionlab/` locally and Turso/libSQL for hosted collaboration. In-memory or browser state may cache records but is not authoritative. Show pending/error states for writes and confirm saved status only after durable persistence succeeds.

Persist:

- node position
- dimensions
- edges
- grouping
- comments
- annotation anchors

Avoid storing transient React internals.

For this increment, keep camera pan/zoom and unsaved draft-pin state transient while persisting node coordinates, connection changes, root comments, replies, and normalized screenshot anchors. Reloading must use committed server data rather than localStorage as a second source of truth. A screen's position in the board and a comment's position within its image are separate coordinate systems. Saving a layout must not rewrite image anchors, screenshots, recording order, or historical versions.

---

# Background Jobs

Flow replay and screenshot generation should be designed as asynchronous jobs.

Model states:

queued
running
completed
failed

For local MVP, use a local Node.js runner connected to the host installation. Running directly from a persistent development server is acceptable where supported. Do not assume the host's deployed Next.js runtime can launch browsers or keep long-running jobs alive; deployed reviews use a separately configured worker when required.

Keep a clean abstraction so execution can later move to:

- container workers
- CI
- GitHub Actions
- hosted browser infrastructure

---

# Project Folder and Storage Contract

Resolve the host project root explicitly at initialization; do not rely on the server's current working directory. All durable review data defaults to `<project-root>/.revisionlab/`.

Use this layout:

```text
.revisionlab/
  config.json
  revisionlab.db
  artifacts/<run-id>/screens/<step-id>.png
  artifacts/<run-id>/dom/<step-id>.json
  artifacts/<run-id>/trace.zip
  reports/<report-id>/
  exports/<export-id>.json
  backups/<backup-id>/
  local/
  runtime/
```

SQLite/libSQL tables store installations, review invitations, reviewer identities, sessions, email challenges, recording profiles, flows, variants, steps, actions, transitions, canvas layouts, prototype versions, reviews, decisions, comment threads/replies, annotation anchors, executions, artifact/report metadata, and migration history. Use stable IDs, foreign keys, and indexes for common invitation/session and flow/profile/version queries. Flexible locator, viewport, and snapshot payloads may use validated JSON columns. Store local artifact paths relative to `.revisionlab/` and hosted artifact keys without public URLs. Screens, DOM snapshots, traces, and report bodies remain artifacts; do not maintain duplicate live JSON record directories.

Provide `ReviewStore` implementations for local SQLite and hosted Turso/libSQL, plus filesystem and private hosted `ArtifactStore` implementations. Keep one logical schema and migration history across local and hosted stores. Select maintained adapters compatible with the supported Node.js/Next.js versions and verify clean installation on supported platforms; do not require the host developer to choose a driver or configure an ORM. Database access runs in the server/runner boundary, never the browser. The widget calls authorized server APIs; the runner submits results through the configured store. Never expose a database or artifact root as public static files. Validate artifact paths and reject traversal or symlinks escaping the local storage root.

Use short SQLite transactions, foreign-key enforcement on each connection, a bounded busy timeout, and record revisions for conflicting comment/canvas edits. Enable WAL on supported local storage and retain durability settings appropriate for acknowledged writes. SQLite handles database locking; do not recreate JSON-file locking. Keep Playwright execution and filesystem work outside database transactions. Stage and finalize immutable artifacts before committing their references and completed-run status in one transaction. Interrupted runs remain incomplete; recover or clean up unreferenced files without losing committed records. Database transactions alone do not make filesystem writes atomic.

Never overwrite historical run artifacts during replay. New runs receive new IDs and update only the appropriate variant's current-run reference. Apply bundled, ordered schema migrations automatically on initialization and writable startup, under exclusive migration coordination. Back up existing data before upgrades, use transactional migrations where supported, and leave the existing database recoverable if migration fails. Report newer unsupported schemas, corruption, or missing artifacts without silently recreating the database. Read-only mode never attempts a migration.

Provide a built-in backup/restore operation. Use SQLite's backup API or an equivalent supported consistent snapshot operation, and copy the immutable artifacts referenced by that snapshot while preventing their deletion. Include non-secret configuration and generated reports; exclude `local/`, `runtime/`, and previous backups. Never copy only an open `revisionlab.db` file and assume it includes pending WAL data. Let SQLite manage its adjacent `-wal` and `-shm` files; do not delete them as ordinary caches. On restore, validate the schema and references and retain project identity. Reconnect machine-specific authentication/runner settings separately. Produce self-contained, checkpointed snapshots for read-only deployment and test opening them without write access.

Ignore the whole folder in Git by default. Offer versioned JSON export/import of selected non-secret definitions or sanitized review snapshots under `exports/` for portability and optional Git tracking. Imports validate schema and references and handle ID conflicts explicitly within transactions. Exports are snapshots, not another live source of truth. Do not stage files automatically or recommend merging live SQLite databases or journal files through Git. A complete backup still includes referenced artifacts omitted from Git.

Local MVP requires no PostgreSQL service, Prisma setup, Docker database container, or external object store. Deployed multi-user review uses Turso/libSQL and private artifact storage because Vercel's local filesystem is not a shared durable writer. Read-only snapshots support review without mutation. Other future remote adapters must preserve export/import portability. Automatic Git merging or multi-replica filesystem synchronization is outside MVP scope.

Implementation references: [SQLite WAL behavior](https://www.sqlite.org/wal.html) and [SQLite backup API](https://www.sqlite.org/backup.html).

---

# Testing

Provide:

- unit tests for flow/action transformations
- API tests
- Playwright tests for critical product journeys
- validation tests for imported recordings

Whiteboard and pinned-comment increment acceptance checks:

1. Migrate an existing SQLite/libSQL workspace without removing or relabelling its flows, artifacts, comments, or version history. Legacy comments have no invented pin.
2. Open a three-screen recording and verify generated nodes and two directed sequence connections. A one-screen flow has no fake edge. Reopen without duplicate generation.
3. As an owner/editor, move a node, add/edit/remove a labelled connection, automatically arrange the board, reload, and verify persisted values. Reject unknown/cross-flow/cross-version endpoints and unauthorized commenter mutations at the API.
4. Pan, zoom, and fit the board; select every screen using keyboard-accessible controls as well as pointer/touch. Verify a narrow viewport and the non-drag layout/connection path. For the current wheel refinement, exercise both board background and screenshot nodes: the whole graph zooms smoothly around the cursor without simultaneous page scrolling, and connections remain attached. Verify the normal 10%–300% bounds, Fit below 10% for a large flow, Reset 100%, zoom buttons, Shift+wheel panning, background drag, touch drag, and keyboard navigation. Wheel input outside the board must retain ordinary page scrolling. Camera changes must leave draft and saved positions, dirty state, and comment anchors unchanged.
5. Place a pin at a known image-relative point, submit, and reload. Verify it stays over the same image region at different image sizes, zoom levels, and board positions; image padding must not skew the point.
6. Select that pin as another reviewer, reply, reload, and preserve author attribution and thread identity. Resolve/reopen as an owner/editor; reject unauthorized status changes.
7. Reject non-finite/out-of-range coordinates, pins without a valid screen, and replies with unrelated thread or screen context. Preserve all existing unpinned comments.
8. Switch screens and versions and verify pins never leak onto an unrelated image. Create a new recorded version without migrating old pins or board edits into historical records.
9. Cancel a draft without saving; fail a submission or layout save and verify honest errors and recoverable input rather than false success. Never place pins on unloaded or unavailable images.

These checks define the in-progress increment; record completed commands and browser evidence separately instead of treating this list as passing results.

Comment-card readability acceptance checks:

1. Open existing widget feedback and a screen discussion containing replies. Verify every comment and reply has a distinct card, visible separation, readable author/date metadata, and a full message separate from its available actions.
2. Check desktop and narrow mobile widths with multi-paragraph feedback, a long author name, and long unbroken text or links. Content and controls must wrap without clipping, overlap, or horizontal panel scrolling.
3. Select a screen pin, add a reply, and resolve/reopen the discussion with the permitted role. The matching discussion must retain focus and association, with persisted content and status unchanged after reload.

Anchored speech-balloon acceptance checks:

1. Open a screen with multiple pinned root comments and verify every eligible comment has a readable speech-balloon preview by default. Verify the resolved filter and hide/show bubbles control without removing pins or changing persisted feedback. Activate previews and pins by mouse, touch, and keyboard; the matching full discussion opens with a pointer and no new comment or automatic scroll to the sidebar.
2. Exercise nearby pins and pins near image/viewport edges at desktop and narrow mobile widths. Scroll, resize, and zoom the screenshot; balloons retain their actual pin associations, flip/shift when needed, and keep long messages and controls reachable without horizontal overflow. Collision handling must not imply that a shifted bubble has changed the saved target.
3. Reply and resolve/reopen with the permitted role from the balloon. Reload and verify the same root thread, normalized anchor, author attribution, replies, and status; unauthorized resolution remains unavailable and rejected by the API.
4. Dismiss the expanded thread with the close control and Escape and verify focus returns to its activating pin or preview. Open a different pin, screen, or version and confirm no stale or unrelated discussion appears. General and legacy unpinned feedback remain readable in sidebar cards.

These are verification requirements for the new refinement, not passing results.

Critical E2E:

1. Initialize the integration in an existing Next.js fixture and verify repeated initialization is safe.
2. Create named and open invitations; verify employee and client emails from different domains with one-time codes and preserve the intended deep-link destination.
3. Reject an unlisted email for a named invitation, expired/consumed codes, invalid attempts beyond the limit, expired sessions, and revoked invitations without leaking access details.
4. Load a protected host page, open the widget, and navigate to the full workspace with the current route/version context under a valid scoped session.
5. Start recording from the widget for two distinct role/persona profiles as an editor; reject the same operation from a commenter session.
6. Generate screens without capturing RevisionLab controls and display the canvas.
7. Create an annotation and threaded comment as one reviewer; reply as another reviewer, reload, and verify attribution and shared-store persistence. Rerun one variant and verify the other's artifacts/comments are unchanged.
8. Inspect an older version, open a direct comment link under the same access rules, export a report, and return to the original prototype tab.
9. Verify revocation blocks prototype pages, workspace routes, APIs, and artifact responses, and that disabled environments or another installation expose no data.

Integration checks must cover host styles remaining unchanged, hosts with and without Chakra, server layouts retaining their boundaries, mobile/keyboard widget behavior, conflicting review routes, configured base paths, and unavailable runners or storage.

Profile checks cover **Default**, missing/unauthorized setup, failed authentication, persona edits after historical runs, and roles sharing routes but showing different controls. Verify secrets are absent from browser responses, screenshots of setup, exported review data, and recorded actions.

Storage checks cover fresh automatic database creation, repeat initialization, migration upgrades/rollback on failure, stable identity across restarts, interrupted transactions/artifact writes, simultaneous comment edits, busy handling, foreign-key integrity, missing artifacts, and read-only mode. Test backup/restore with committed data still in WAL, and JSON export/import round trips. Verify clean setup requires no separate database installation or manual migration commands, and the database/journals cannot be fetched as static files.

Invitation checks cover hashed token/code storage, generic request responses, resend/attempt limits, single-use consumption, session rotation, cookie security attributes, scoped authorization, cross-installation isolation, and immediate invitation/session revocation. Test the local SQLite and hosted libSQL adapters against the same contract.

---

# Developer Experience

Add:

README.md

Include:

- setup
- installer and manual layout integration
- configuration, environment enablement, and route customization
- `.revisionlab/` structure, automatic SQLite setup/migrations, backup/restore, and JSON export/import for selective Git tracking
- Turso/libSQL and private artifact configuration, Resend-compatible email delivery, invitation policies, and read-only snapshots
- Playwright installation
- environment variables
- running app
- running worker
- running tests
- architecture overview
- disabling, upgrading, and removing the integration

Also create:

docs/architecture.md
docs/domain-model.md
docs/playwright-recording.md
docs/review-canvas.md

---

# Build Strategy

Re-initiate implementation from the invitation-first vertical slice below. Treat earlier dashboard-first and Vercel-login assumptions as superseded. Preserve useful repository setup, but judge new work against the embedded installation, passwordless access, local/shared storage adapters, widget, and review-workspace architecture in this plan.

## Current refinement — Stop, discard, and recording departure warnings

Implementation is complete and locally verified. Keep Stop and Discard as separate recording transitions: Stop prevents new captures, waits for an in-flight capture, then PATCHes completion; Discard also prevents new captures and waits for any pending capture to settle before deleting the unfinished draft and artifacts through an authenticated creator/owner operation. Preserve all completed versions. Do not clear the pending recording state, navigate away, or report successful cleanup until the server confirms it. Failures keep capture stopped and provide a retry rather than resuming or silently saving.

Keep **Stop recording** visible in the closed-widget recording controls and the dialog footer across tabs. Guard ordinary same-tab page anchors with an accessible warning offering Stay and Discard; offer **Continue recording on next page** only for an eligible same-origin prototype destination while capture can continue, and disable it during an active capture. Ignore modified clicks, other browsing targets, downloads, and hash-only changes. The current interpretation covers links between prototype pages; a narrower warning scope has not been confirmed by the user.

Export `confirmRecordingNavigation(href): Promise<boolean>` for host code to await immediately before its own `router.push`, `router.replace`, or location assignment. Preserve normal Next.js link behavior after a confirmed choice. Do not patch the router or history stack to claim universal navigation blocking: client-side Back/Forward is not globally guarded. Register native `beforeunload` warnings only while a draft needs attention; the browser controls their display and copy. Do not automatically delete on unload, visibility changes, or tab switching, because cancellation and cleanup delivery cannot be guaranteed.

Lint and the root production build pass. All 88 package tests pass: 16 installer, 36 server, 6 canvas, 8 balloon-layout, 8 viewport, 6 navigation, and 8 recording-storage tests. Browser checks verified Stop outside the widget and on its Comment tab, Stay preserving the session, Continue capturing a second route, and Stop saving a completed two-screen flow. An injected discard HTTP 503 kept the page and warning open with a retry; the successful retry removed that draft and artifact before navigation. Warning-dialog visuals were confirmed at 1440px and 390px widths: title and explanation stack clearly, buttons fit, and the recording controls stay behind the backdrop. Build, lint, and all 88 tests passed again after capture/discard hardening. A fresh separate-host installation was not repeated. The local package archive was rebuilt with the recording controls, navigation helper, and discard endpoint; the package was unpublished at that checkpoint. Evidence and remaining limits are recorded in `VALIDATION.md`. This recording checkpoint is separate from the subsequent partial Paths increment below.

## Current refinement — Supplied logo and favicon

The canonical SVG lives at `packages/revisionlab/assets/revisionlab-logo.svg` and is included in the package's published files. The shared image component resolves that asset with `new URL(..., import.meta.url)` so Next.js bundles it without a host-public path requirement. It preserves the 222:227 aspect ratio at 32 CSS pixels high and treats marks beside the existing wordmark as decorative. `scripts/generate-favicon.mjs` generates the example application's ICO at 16, 32, 48, 64, and 256 pixels from the same source.

Verification is complete for this local refinement: lint and the production build pass, along with all 66 existing package tests. Browser checks decoded all three logo placements at natural dimensions 222×227 and displayed height 32 pixels, asserted their proportions, and inspected desktop 1440px and narrow 390px layouts without horizontal overflow. The linked favicon returned HTTP 200 and matched the generated ICO; Sharp decoded its five frames at the expected sizes. The package tarball contains the SVG and public logo exports. A fresh separate-host installation and cross-browser checks were not repeated. Evidence is recorded in `VALIDATION.md`. Preserve the supplied SVG colors, functional task icons, host metadata, and existing installer behavior. This branding refinement does not implement any part of the unresolved direct-editing increment.

## Current refinement — Full-flow wheel navigation

Implemented pointer-centered wheel zoom across the full board viewport and screen screenshots using transient camera state, preserving the existing graph, draft layout, comments, and navigation controls. Browser and unit-test evidence is recorded in `VALIDATION.md`, with real-touch, cross-browser, and large-flow browser checks still outstanding. This navigation refinement is complete independently of the unresolved direct-editing increment below.

## Current partial increment — Direct whiteboard editing

Implemented:

1. Replace the Paths form with explicit edit mode, source/target screen buttons, contextual connection actions/discussions, and preserved board navigation and screenshot feedback.
2. Persist `hiddenStepIds` separately from immutable captures. Every captured step belongs exactly once to visible nodes or this removal list; active paths can only connect visible nodes. Loading and subsequent captures respect intentional removal. Restore changes board membership, not capture history.
3. Persist connection-thread context and immutable edge identities, archive removed edges, and retain their discussions. Board saves and root-comment submission share transactional validation, preventing a concurrent removal from producing an orphan thread.
4. Replace structural Save/Discard with debounced autosave and a bounded, local Undo history. Group screen drags and label-typing bursts; serialize requests, preserve edits made during writes, and autosave inverse operations. Keep revision-conflict recovery, retryable errors, and explicit comment submission separate. Done editing and internal departures await pending saves instead of presenting a manual-save choice.

Autosave refinement: 15 deterministic controller tests bring the package suite to 113 passing tests. Local browser checks cover autosaved labels, single-operation drag/typing Undo, saved screen removal and exact path restoration, temporary save failures and retry, blocked departure on failure, and Undo during a delayed save followed by Done editing. Desktop/mobile layout evidence and verification limits are in `VALIDATION.md`. Polling retains the selected flow; structural controls lock for navigation, sign-out, and version-start transitions.

Earlier direct-editing validation, before the autosave refinement: package TypeScript build, root production build, lint, and all 98 then-current package tests passed, including 46 server tests. Ten new server tests covered connection permissions/context, inherited replies/resolution, archived history, retargeting rejection, concurrent removal/submission, legacy migration, reversible removal/artifact preservation, and new captures respecting hidden screens. Existing discard tests additionally verified registry cleanup with foreign keys disabled while preserving completed-version paths. Browser checks verified Paths without a form, source/target connection creation, saved threads/replies/resolve/reopen, the previous dirty Keep/Discard choices, saved screen removal followed by reload/restoration with screenshots retained, and archived discussion/reply access in All comments. Desktop 1440px and mobile 390px visual checks found no horizontal overflow. Test paths were restored through the API. Fresh hosted and separate-host installation checks were not repeated; these results cover only the implemented subset. See `VALIDATION.md`.

Still pending:

1. Confirm decision node versus interactive prototype form, and screenshot capture versus URL-only screen addition. Neither tool is implemented; keep both choices unresolved until answered.
2. Model a confirmed decision node separately from captured steps and validate its branches without implying executable logic.
3. Implement the confirmed URL-addition workflow with honest availability/errors and an authorized capture context if required. Do not mutate completed capture sequences, invent screenshots, forward credentials to another origin, or silently fetch arbitrary server-side URLs.
4. Test decision/URL behavior when implemented; the current subset's passing checks do not validate those future tools.

## Current increment — Generated whiteboard and pinned discussions

Build this on the existing screen-capture release before introducing action replay. The immediate order is durable board/thread schema and authorization, generated sequence layout and connection controls, screenshot pin placement and replies, then migration/API/browser/accessibility validation. Keep the current recorder and immutable completed versions functional throughout. The broader phases below describe the remaining target architecture, not prerequisites for this increment or a claim that all phases are complete.

## Phase 1 — Installation, storage, and reviewer access

- Package/CLI structure and a Next.js host fixture
- Idempotent initialization and layout integration
- Floating widget and full-page workspace route
- Scoped styling, lazy loading, and server/client package boundaries
- Dedicated review-environment gating and route protection
- Automatic `.revisionlab/revisionlab.db` creation, bundled migrations, SQLite transactions, and filesystem artifact storage
- Turso/libSQL shared-store adapter with the same logical schema
- Private hosted artifact adapter
- Resend-compatible email delivery adapter
- Named and open invitations, hashed OTP challenges, reviewer identities, and revocable scoped sessions
- Commenter/editor/owner authorization enforced in server operations
- Folder reopen/restore behavior, hosted publish/import boundaries, and explicit read-only mode
- ProjectInstallation model
- ReviewInvitation, ReviewerIdentity, ReviewSession, and EmailChallenge models
- Flow model
- RecordingProfile and FlowVariant models
- Step model
- Action model
- basic CRUD

## Phase 2 — Playwright Runner

- Widget-initiated recording with role/persona selection
- Isolated profile setup, explicit recording state, and finish-to-generation workflow
- flow execution
- action execution
- screenshots
- traces
- execution results

## Phase 3 — Step Editor

- ordered steps
- action editor
- step screenshot
- replay step
- branch model

## Phase 4 — Review Canvas

- Role/persona grouping, filtering, and variant inspection
- automatically arranged captured screen nodes
- directed sequence edges and owner/editor labelled connections
- pan/zoom/fit and keyboard-accessible navigation
- saved per-version layout, with drag and non-drag editing
- step inspector

## Phase 5 — Review System

- screenshot-relative pinned annotations first; DOM-element anchors and replay-aware re-anchoring later
- comments
- statuses
- assignments
- threaded replies linked to the root pin, preserving legacy unpinned comments
- invitation management, reviewer mentions, and session revocation

## Phase 6 — Versioning

- prototype versions
- rerun against version
- screen-change state
- historical reviews

## Phase 7 — Delivery

- Codex task generation
- Markdown report
- JSON export
- HTML export

---

# First Implementation Goal

The first useful demonstration should be:

1. A developer initializes RevisionLab inside an existing Next.js project and mounts its integration in the layout.
2. An owner creates an invitation that permits verified employee and client emails and shares its link.
3. Two reviewers with different email domains request one-time codes, verify without Vercel or RevisionLab accounts, and reach the intended deep-linked review.
4. One reviewer opens the widget and full workspace; the other adds and replies to a screen comment. Both see verified attribution and the persisted thread.
5. From the widget, an editor selects a role/persona and records a simple three-screen journey, then records another profile as a separate variant.
6. The configured Playwright runner executes the flow and generates screenshots automatically.
7. Each variant's screen sequence appears on the canvas with role/persona labels; reviewers filter variants and add element-anchored feedback.
8. The editor generates a Codex-ready prompt, changes the prototype, and reruns one variant; refreshed screenshots appear while prior comment context and the other variant remain intact.
9. Revoking the invitation removes reviewer access to the prototype, workspace, APIs, and artifacts. Direct URLs do not bypass the gate.
10. Local restart reopens `.revisionlab/revisionlab.db`; hosted deployments reopen the configured Turso/libSQL store. Backup/restore preserves the local workspace without manual database setup.

Build this vertical slice before expanding the feature set.

---

# Definition of Done for MVP

The MVP is complete when a developer can install RevisionLab within an existing Next.js project, invite employees and clients by email, and let them comment through its layout-mounted widget and full-page workspace without Vercel accounts, passwords, or RevisionLab registration.

A named or open invitation must support verified emails from different domains, deep-link return after verification, verified comment attribution, scoped commenter/editor/owner permissions, expiry, and immediate revocation. Anonymous visitors and revoked sessions cannot read the prototype, review data, APIs, or artifacts. Reviewers can add and reply to comments with no account-management workflow.

SQLite is created and migrated automatically inside `.revisionlab/`, storing flows, personas, comments, versions, and history; generated artifacts live alongside it. Everything reopens across restarts, and a consistent backup can be restored without a separate database service. Read-only environments clearly disable writes unless connected to a persistent writer. The host keeps its behavior and styling; disabled environments expose no review capabilities. The workflow must not depend on a centralized project hub.

The widget must support recording for at least two role/persona profiles and opening their generated screens in the workspace. Profiles execute in isolated sessions; screens, comments, and version history remain attributable to the correct variant. Rerunning one variant preserves the other, and profile/setup failures are surfaced without generating misleading success states.

The whiteboard increment has its own delivery boundary: generated screen nodes and directional recorded paths, durable owner/editor arrangement and explicit connections, usable pan/zoom/fit and keyboard alternatives, screenshot-relative comment pins, replies, resolution, and preserved existing feedback. Its completion does not imply the broader replay, DOM-anchoring, or visual-diff goals below are implemented.

Updating the underlying prototype and replaying the flow must refresh the generated screen states automatically while preserving:

- canvas layout
- comments
- annotations where element locators still resolve
- flow relationships
- review history

That behaviour is the central product promise.
