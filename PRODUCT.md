# Product Brief — RevisionLab

This is the living product specification. Update it as new product requests and decisions arise. Requirements describe intended behavior unless explicitly marked implemented; proposals and open questions are not accepted implementation decisions.

## Current delivery boundary — 22 September 2026

Distribution refinement: GitHub-to-npm release automation is implemented in the repository for the public **`revisionlab`** package, with **`gil00pita`** as the maintainer's chosen intended npm owner. Publishing a versioned GitHub Release runs validation and publishes the same tested tarball; normal pushes, pull requests, and manual validation runs do not publish. Stable releases use `latest`, prereleases use `next`, and the tag and lockfile must match the workspace version. The default installer must install the exact package version invoked through `npx`, preserving the explicit `--package` override. The example application, credentials, and `.revisionlab` runtime data must never be published. Token-free npm trusted publishing is the configured approach. First npm publication, owner authentication, trusted-publisher/environment setup, and a successful live GitHub run remain external prerequisites; the package is not yet claimed available on npm. See `RELEASING.md`.

The functional release provides embedded recording, saved screen sequences and versions, page/screen comments, invitations, SQLite/libSQL persistence, and Markdown exports. The whiteboard and pinned-comment increment is **implemented**: generated boards, persisted arrangements and labelled paths, normalized screen pins, threaded replies, and resolution. Local browser checks cover saving/reloading layouts and paths, pin placement and replies, resolution, and image zoom; the production build and 50 automated tests pass. Live shared-service verification still requires deployment credentials.

The requested experience is a Miro-like generated flow board, with captured screens arranged and directional arrows showing each recorded or explicitly connected path, plus Figma-like comments placed on the specific screen area being discussed. Screens and their feedback remain tied to the selected recording/persona and exact version. Readable comment cards and anchored speech balloons are implemented. All eligible pinned root comments show previews by default, connected to their saved locations. Selecting one expands the full discussion, replies, and authorized actions. A hide/show control clears previews without removing pins. Local desktop/mobile checks cover placement, zoom, dismissal, and screenshot-failure fallback; see `VALIDATION.md`.

The latest navigation refinement is **implemented**: scrolling the mouse wheel over the full-flow whiteboard, including its screenshot nodes, zooms all screens and connections together around the pointer. The camera remains local; navigation does not alter draft or saved board coordinates. Local browser checks cover pointer anchoring, zoom bounds, panning, retained controls, desktop/narrow-screen Fit, ordinary scrolling outside the board, and unchanged save state. Eight new camera tests bring the package suite to 66 passing tests. See `VALIDATION.md` for evidence and the remaining real-touch and cross-browser validation limits.

The supplied logo and favicon replacement is **implemented and locally verified**. The example homepage, workspace navigation, and email-access header share the supplied blue RevisionLab artwork at its original proportions; the example favicon is generated from the same SVG. Desktop and narrow-screen browser checks verify all three placements, the served five-size favicon, and no horizontal overflow. Lint, the production build, and all 66 existing package tests pass; the package tarball includes the SVG and logo exports. This branding change does not alter task icons, interaction colors, or host-project favicons during installation. A fresh separate-host installation and cross-browser checks were not repeated. See `VALIDATION.md` for evidence and the branding requirements below.

The recording-control refinement is **implemented and locally verified**: **Stop recording** remains visible outside the widget and in its footer on every tab, stops further captures, and saves the completed recording. Explicit **Discard recording**, including the page-leaving warning, stops and deletes the unfinished draft and its captures without publishing a completed version. Normal same-tab page links are guarded; eligible same-origin prototype links also offer continuing the recording on the next page. Lint, the production build, and all 88 package tests pass. Browser checks cover visible Stop controls, Stay, continuing to record a second route, saving a completed two-screen flow, and a failed discard followed by successful cleanup and navigation. Warning-dialog visuals were confirmed at 1440px and 390px widths, with readable stacked text, fitting buttons, and recording controls behind the backdrop. A fresh separate-host installation was not repeated. See `VALIDATION.md` for evidence. Browser-unload and programmatic-navigation boundaries are documented below rather than treated as guaranteed interception of every exit.

The direct-editing request is **partially implemented**: **Paths** enters whiteboard edit mode without opening the legacy form. On-screen **Connect** actions choose source and target; selecting a connection opens its label/removal controls and discussion. The latest confirmed refinement is implemented: **autosave and Undo** replace manual board saving, with recoverable save errors and guarded navigation. Captured images, historical versions, and archived connection discussions are preserved. All 113 package tests pass, including 15 new autosave tests; local browser and desktop/mobile checks are recorded in `VALIDATION.md`. Fresh hosted and separate-host installation checks were not repeated. Decision elements and URL-based screen additions are **not implemented**: their two product choices below remain unanswered.

The implementation approach for this increment is to generate connections from recorded step order, permit owner/editor layout changes and labelled connections, and store screenshot-relative comment pins. Pan, zoom, fit-to-content, automatic arrangement, replies, resolution, and accessible non-pointer controls support that experience. These are implementation choices for the requested workflow, not a promise of Miro/Figma feature parity. Automatic discovery of unrecorded paths, executable branch conditions, action replay, DOM-element anchors, and visual comparison remain later work.

Distribution reliability requirement: a fresh package build must produce an executable CLI before packing, including when CI uses `npm pack --ignore-scripts`. Verify this with a clean-output regression test and retain the exact-tarball executable check; an existing local CLI's permissions must not mask a release failure.

## Working Name

RevisionLab — embedded prototype review for individual Next.js projects.

## Branding — supplied logo and favicon

Use the user-supplied SVG as RevisionLab's logo and the source of the example application's browser favicon. Preserve its blue `#1E9ADC` artwork, pale `#F4F4F4` rounded background, white outer rectangle, and 222:227 proportions; do not redraw or recolor the mark through UI theme tokens. The canonical native asset is `packages/revisionlab/assets/revisionlab-logo.svg`.

The current implementation uses one shared Chakra image component at 32 CSS pixels high beside the existing RevisionLab wordmark on the example homepage, workspace navigation, and email-access header. Functional icons, including the widget's Review and recording indicators, retain their task-specific meaning and appearance. The rest of the interface palette and layout remain unchanged.

The package includes its own logo asset and resolves it with the client bundle, without requiring a logo file in the host project's public directory. The example favicon is generated from the canonical SVG at 16, 32, 48, 64, and 256 pixels through `scripts/generate-favicon.mjs`. Initializing RevisionLab in another project must preserve that project's favicon and branding.

Observable acceptance criteria:

1. The homepage, workspace, and access-page brand marks display the supplied artwork without stretching or cropping; adjacent RevisionLab text remains readable.
2. The example application's browser favicon uses the same artwork instead of the previous icon and remains available before email verification.
3. A packaged installation can display RevisionLab's logo without a host-public asset dependency, while the host application's existing favicon is unchanged.
4. Screen readers retain a RevisionLab name without duplicate announcements from decorative marks next to the wordmark.
5. Review/recording controls, functional status colors, and existing workflows remain unchanged by the branding replacement.

---

# Product Vision

Create a collaborative review environment where interactive prototypes become living, versioned user-flow documentation.

RevisionLab is installed inside each project. A developer runs an initialization command and adds the integration component to the project's Next.js layout. A floating widget appears on enabled prototype pages; clicking it opens a compact launcher with an action to open the full-page review workspace for that project.

Flows, comments, versions, runs, and reports belong to the project where RevisionLab is installed. There is no central project hub, project picker, or requirement to import the application into a separate dashboard.

Instead of maintaining:

Prototype
+
Miro board
+
screenshots
+
review comments
+
development tickets
+
Confluence documentation

as separate artefacts, the prototype becomes the single source of truth.

The system automatically derives review artefacts from the prototype.

---

# Problem

Product teams frequently build interactive prototypes and then manually recreate those prototypes in tools such as Miro, FigJam, PowerPoint, or Confluence so that business analysts, clients, developers, and stakeholders can review complete user journeys.

This creates duplication.

A common workflow becomes:

Build prototype
→ take screenshots
→ paste screenshots into Miro
→ connect screens
→ add comments
→ prototype changes
→ retake screenshots
→ replace screens in Miro
→ update documentation
→ convert comments into development work

The review artefact rapidly becomes stale.

Versioning is difficult because there is no reliable relationship between:

- prototype version
- screenshots
- review comments
- implementation changes
- documented decisions

---

# Product Opportunity

The prototype itself should generate its review environment.

A user should be able to:

1. Record a user journey.
2. Automatically generate meaningful screens from the journey.
3. Display the journey visually as a flow.
4. Review and annotate those screens.
5. Replay the journey after prototype changes.
6. Automatically update screen representations.
7. Preserve comments and decisions across versions.
8. Convert review feedback directly into implementation work.
9. Generate formal review documentation from the same data.

This creates executable, version-aware product documentation.

---

# Core Product Promise

Build the prototype once.

Do not manually rebuild it for review.

When the prototype changes, replay the recorded journey and automatically refresh the review workspace.

Open the prototype, click its RevisionLab widget, and review the complete journey in the context of that same project.

---

# Installation and Project Ownership

The intended setup is:

1. Run `npx revisionlab init` in an existing Next.js App Router project.
2. Review and apply the generated integration: a `.revisionlab/` project folder, a layout-mounted component, and a review route.
3. Start the project normally and open one of its pages.
4. Click the RevisionLab widget, then choose **Open review workspace**.

The command and package names are proposed interfaces, not claims that a published installer already exists.

The layout integration should be a small client component mounted inside the existing layout's body, alongside the application content. The host layout remains a server component and retains its providers. Review UI must not change the host application's styles or require the host to adopt Chakra UI.

Each installation stores its stable project identity and review workspace in `.revisionlab/` at the host project's root. Different projects have separate folders and isolated data. Installing RevisionLab must not upload the repository or create a central dashboard entry.

The folder contains an embedded SQLite database, created and prepared automatically by the installer. There is no database server, account, connection string, or manual schema setup for local use. Production pages have the integration disabled by default, with explicit enablement for review deployments.

---

# Project Storage: `.revisionlab/`

Keep the complete review workspace alongside the prototype:

```text
.revisionlab/
  config.json       # Non-secret integration settings
  revisionlab.db    # SQLite: identity, personas, flows, comments, versions, reviews, runs
  artifacts/        # Generated screens, DOM snapshots, and traces by run
  reports/          # Generated Markdown, JSON, and HTML reports
  exports/          # Optional portable JSON snapshots for sharing or Git
  backups/          # Consistent database/workspace backups
  local/            # Machine-specific settings and temporary authentication state
  runtime/          # Rebuildable caches, locks, and temporary files
```

Recording from the widget, arranging a canvas, adding a comment, or generating a report writes to this folder through RevisionLab's server or local runner. Browser storage is only a convenience for temporary UI state. Restarting the application must reopen the saved workspace, including each persona's separate screens and history.

SQLite is the source of truth for structured records, including canvas layouts and annotation anchors. Screenshots, DOM snapshots, traces, and generated reports remain files referenced by relative paths in the database. JSON remains an import/export format, not a second live record store. Opening an existing installation reuses its database and applies supported migrations automatically without resetting history or identity.

Provide a built-in backup/restore action that captures a consistent database snapshot and its referenced artifacts. Users should not need to manage database journals or copy an open database manually. Credentials and machine-specific setup are reconfigured separately after moving a workspace.

The installer ignores `.revisionlab/` by default, including the live database and its journal files. Teams can opt into tracking non-secret configuration and sanitized JSON exports under `exports/`; the running database is not a Git-mergeable document. Credentials, temporary authentication state, and runtime files remain untracked; copying exports with Git is not real-time collaboration.

For deployed shared reviews, use a hosted SQLite-compatible store and private artifact storage. The default hosted adapter is Turso/libSQL; `.revisionlab/` remains the local source for development, configuration, exports, and backups. Separate preview deployments share live history only when configured with the same hosted project store. A read-only deployment can display a deliberately included snapshot, but saving requires a connected persistent store and the UI must clearly indicate read-only mode.

---

# Shared Access and Low-Friction Commenting

RevisionLab uses passwordless review invitations. Reviewers may be employees, clients, suppliers, or other stakeholders with unrelated email domains. They do not need a Vercel account, company SSO membership, or a permanent RevisionLab account.

## Invitation flow

1. An owner creates an invitation scoped to a project, review, flow, or prototype version.
2. RevisionLab produces a share link. The owner may restrict it to named email addresses or allow any verified email that possesses the link.
3. The reviewer opens the link, enters their email address, and receives a short-lived one-time code. A magic-link email may be offered as an alternative.
4. After verification, RevisionLab creates a secure reviewer session and returns the reviewer to the original flow, screen, comment, or version link.
5. The reviewer can immediately add, reply to, and resolve comments allowed by the invitation. There is no password, signup form, profile setup, or separate account-management area.

The first verified email creates a lightweight `ReviewerIdentity` containing a provider-independent subject, normalized email, display name, and timestamps. Revisiting with the same verified email reuses that identity. Comments store the identity reference and an immutable author-name/email snapshot so historical attribution remains understandable after a name change.

## Invitation modes and permissions

- **Named invitation:** only listed email addresses can verify. Use this by default for sensitive client work.
- **Open review invitation:** anyone possessing the link may verify an email and join. The link remains revocable and expires; possessing it alone does not create a session or submit comments.
- **Commenter:** view the scoped review and its board, place screen-area comments, and reply to threads. Resolution follows the installation's permission policy; in the current implementation it remains an owner/editor action.
- **Editor:** commenter permissions plus recording, board arrangement, connection editing, and comment resolution within their authorized scope.
- **Owner:** installation configuration, invitations, recording access, destructive actions, exports, and storage settings.

Prototype roles/personas such as Applicant or Administrator are recording contexts and never grant RevisionLab permissions. A display name, email domain, invitation URL, or prototype role alone must never confer editor or owner access.

## Commenting experience

- Provide **Add comment** in the widget and full workspace. In the workspace, a reviewer enters comment mode, clicks the relevant area of a captured screen, writes feedback, and submits without navigating to an account page. Selecting an existing pin opens its discussion instead of creating another comment.
- Capture the exact project, flow/version, role/persona, and screen context with the comment. Store a screenshot-relative point for a pinned comment; page-level and existing unpinned comments remain valid. DOM locators and replay/execution-aware re-anchoring are later capabilities, not inferred from a screenshot.
- Show explicit sending, saved, and retry states. Never display a comment as saved until the shared-store transaction commits.
- Support replies and visible open/resolved thread status. Mentions, editing recent comments, and follow/mute policies remain later review capabilities.
- Present each comment and reply as a readable card, with distinct author/date metadata, full message content, and clearly separated available actions. Use visible card boundaries, internal padding, and spacing between cards; keep replies grouped with their parent discussion. Preserve line breaks and wrap long text or links without clipping or horizontal scrolling on narrow screens. Apply this presentation consistently wherever existing comments are shown, including widget feedback and screen discussions; it does not change pin placement, reply behavior, resolution permissions, or persistence.
- Show a readable speech-balloon preview for every eligible root pinned comment by default, anchored to its saved image location with a pointer identifying its pin. Honor the current resolved-comment filter. Selecting a bubble or pin expands one full thread with replies, a reply composer, and authorized resolve/reopen actions. Provide a hide/show bubbles control for unobstructed image inspection while keeping pins accessible. Sidebar cards remain an overview and a home for general or unpinned feedback; opening a pin must not scroll mobile reviewers away from its screen.
- Keep the reviewer identity distinct from the persona demonstrated in the recorded prototype.

## Deployment boundary

Vercel Authentication is not the reviewer login because it requires Vercel identities and would block many clients before they reach RevisionLab. The dedicated review deployment/domain must allow the application authentication route to load, then RevisionLab middleware protects the prototype pages, workspace, APIs, and artifacts with the passwordless invitation session. Before verification, visitors see only the access screen. Direct review links preserve their destination through verification.

Vercel shareable links may be used to reach a deployment that still has platform protection, but they are not reviewer identity and do not replace RevisionLab authorization. For the simplest client workflow, configure a dedicated review environment whose effective access control is RevisionLab's invitation gate. Keep production integration disabled unless explicitly configured.

Email delivery uses a replaceable server-side adapter; the recommended initial provider is Resend. Codes are single-use, expire quickly, are stored only as hashes, and are subject to request/verification rate limits. Sessions use secure, HTTP-only, same-site cookies, expire, can be revoked with the invitation, and rotate after successful verification. Avoid revealing whether an email already has access.

Hosted comments and invitation records use the configured Turso/libSQL store, and generated screens/traces use private persistent artifact storage. Configuration is performed once by the project owner. `.revisionlab/` remains the local SQLite workspace; publishing, importing, and exporting are explicit operations rather than implied automatic synchronization. See [Vercel's SQLite guidance](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel) and the [Turso integration](https://vercel.com/marketplace/tursocloud/database).

Acceptance criteria: an employee and a client with different email domains can use the same scoped invitation, verify independently without Vercel accounts or RevisionLab passwords, add and reply to comments with verified attribution, reload or follow a deep link without losing access during the active session, and lose access after the invitation or session is revoked. An unverified visitor cannot read the prototype, review data, APIs, or artifacts.

---

# Widget and Full-Page Workspace

## Widget

- A small, accessible floating button appears on enabled application pages.
- Clicking it opens a compact launcher showing the current page, prototype version, and available review context.
- Provide **Open review workspace** and **Record prototype** as first-class actions, plus links to relevant comments or flows. Recording can start directly from the widget without opening the full workspace first.
- **Record prototype** opens a compact setup: select or name the journey, choose a role/persona, confirm the starting page and viewport, then select **Start recording**.
- Opening the widget does not start recording. Recording is always an explicit action.
- Position is configurable; the widget must avoid covering essential application controls and work on mobile and with a keyboard.
- When a page belongs to several flows, the launcher lets the reviewer choose. When none exists, it offers creating or recording the first flow.

## Recording controls and leaving a page — current refinement

Confirmed user requirements: make **Stop recording** easy to find while recording, warn before leaving the page, and make **Discard** stop the recording without saving it as a completed flow. The implemented behavior has passed local functional checks; evidence and remaining validation limits are recorded in `VALIDATION.md`:

- Show **Stop recording** in the floating recording controls while the widget is closed and in the widget footer regardless of whether Comment or Record is selected. Stopping immediately prevents new captures, waits for an in-flight capture to finish, and completes the recording through the server. Report success only after completion is confirmed; a failed save remains stopped and retryable.
- Keep **Discard recording** separate from Stop. After confirmation, prevent new captures, wait for any in-flight capture to settle, then remove the unfinished draft, its captured screens, and its associated artifacts. Only its creator or an owner may discard it. Previously completed recordings and versions remain intact. Temporary draft writes during recording are not a promise that a discarded recording remains saved.
- Before a normal same-tab page-link navigation, show a warning with **Stay and keep recording** and **Discard recording and leave**. For another same-origin prototype page, also offer **Continue recording on next page** so a multi-page journey remains possible. Continuing is unavailable for review-workspace and external destinations, and after a save or discard has started; disable it while a capture is in progress.
- Wait for confirmed discard success before navigating. A failure keeps the reviewer on the current page, explains the error, retains retry controls and the leaving warning, and does not resume capture. A pending save cannot silently switch to discard after its completion request may have reached the server.
- Modified clicks, links opening another tab/window, downloads, and hash-only links are not intercepted as page departures. Merely switching tabs or hiding the document never discards a recording.

**Current interpretation, not a separately confirmed warning preference:** “leaving the page” includes ordinary links between prototype pages, with the Continue option above. Whether the user instead wants warnings only when leaving the prototype/review scope remains unconfirmed; do not silently treat that narrower option as accepted.

Browser limits are explicit. Reloading, closing the tab, or a full-document departure uses the browser's native `beforeunload` warning when the browser allows it; its wording and display are browser-controlled. Do not delete a draft on unload, because the user may cancel and cleanup requests may not finish. This warning is not a guaranteed stop/discard operation. The mounted widget automatically guards ordinary same-tab links, including Next.js links. Host code that navigates with `router.push`, `router.replace`, or a location assignment must first await the exported `confirmRecordingNavigation(href)` and navigate only if it returns `true`. Client-side browser Back/Forward is not globally blocked; the integration does not claim a universal Next.js App Router navigation blocker.

Observable acceptance criteria:

1. During a recording, Stop is reachable with the widget closed and with either widget tab open, including a narrow viewport and keyboard use.
2. Stop during an in-flight capture waits for that capture, prevents later captures, and marks the flow complete only after server success. Failed completion remains stopped with a retry path.
3. Staying cancels a guarded departure without deleting or completing the draft. Continuing to an eligible prototype page preserves the recording and permits captures there.
4. Discarding explicitly or from the departure warning removes the unfinished recording and its artifacts before any requested navigation; it does not create a completed flow or remove earlier versions. Unauthorized discard is rejected.
5. Failed discard retains the page, warning, and retry opportunity without restarting capture or claiming that cleanup succeeded.
6. New-tab, modified-click, download, and hash-only interactions retain their normal behavior. Reload/close relies on the browser warning without automatic deletion; host integrations document the required helper and Back/Forward limitation.

## Full-page workspace

The full workspace opens at a configurable route within the host application, with `/revisionlab` as the proposed default. It provides the space needed to inspect flows, screen states, threaded comments, versions, execution history, and reports.

The default launch opens a new browser tab so the live prototype's unsaved state remains intact. Provide a normal accessible link and a same-tab option when preferred. Carry the source route and selected flow/version into the workspace; **Back to prototype** returns to the original tab when available, or navigates to the saved project-local route. Exact in-memory state is only retained while the original tab remains open.

The workspace has project-local navigation: **Flows**, **Comments**, **Versions**, **Reviews**, **Reports**, and **Settings**. Within a flow, use **Canvas**, **Steps**, **Comments**, **Runs**, and **History**. The active flow and version remain visible. Direct links can open a particular flow, comment, or version under the same access rules as the workspace.

For the whiteboard increment, the selected flow's generated board is the primary review surface. Selecting a screen opens its detailed screenshot and discussion; the flow, role/persona, and version stay visible. The broader navigation above is target architecture: do not expose placeholder runs, replay, reports, or settings controls for capabilities that are not implemented.

Hide the launcher inside the review workspace and exclude all RevisionLab UI from recorded actions and generated screenshots. Load the heavy canvas and review tools when the workspace is opened, keeping the widget lightweight.

---

# Target Users

## Primary

### Product Designers

Need to demonstrate complete flows rather than isolated screens.

### Business Analysts

Need to understand journeys, rules, decisions, exceptions, and requirements.

### Client Stakeholders

Need a simple visual way to review a prototype without understanding source code or development tooling.

### Developers

Need precise feedback tied to actual screens and UI elements.

---

# Secondary

### Product Managers

Need visibility into decisions and unresolved issues.

### QA

Can reuse recorded journeys as the foundation for test scenarios.

### Accessibility Reviewers

Can attach issues directly to UI elements and steps.

---

# Main Jobs To Be Done

## Designer

"When I update a prototype, I want the stakeholder review flow to update automatically so I do not have to maintain duplicate artefacts."

## Business Analyst

"When reviewing a user journey, I want to see screens, decisions, alternative paths, and comments together so I can validate the whole process."

## Client Reviewer

"When reviewing a prototype, I want to comment on the exact screen or element I am discussing without learning a complex design tool."

## Developer

"When review feedback is approved, I want precise implementation instructions containing the affected screen, UI element, version, and acceptance criteria."

## Product Team

"When a review is complete, I want to generate documentation from the review rather than manually rewriting decisions in Confluence."

---

# Product Model

The system revolves around:

Host Project / RevisionLab Installation
→ Prototype Versions
→ Flows
→ Steps
→ Actions
→ Transitions
→ Annotations
→ Comments
→ Reviews

The host project is established during installation, not created through a dashboard. Its identity scopes every flow, version, comment, artifact, and review. Versions and flows belong to that identity; individual executions and reviews bind a flow to a specific prototype version.

Each flow can have separate recorded variants for different role/persona profiles. Runs and generated screens retain that profile alongside the prototype version, so one persona's recording never replaces another's screens or comments.

---

# Roles and Personas

A role describes the permissions or responsibilities represented in the prototype, such as **Applicant**, **Caseworker**, or **Administrator**. A persona describes the user scenario and test data, such as **First-time applicant**, **Returning applicant**, or **Caseworker with an assigned case**. Several personas can share one role.

Project owners configure reusable recording profiles combining a role, an optional persona, synthetic starting data, and any required test-account setup. Profiles are selectable in the widget. Projects without role-specific behavior can use an explicit **Default** profile.

Choosing a profile must prepare or verify the matching prototype session; changing its label alone does not change the prototype's permissions. RevisionLab's reviewer permissions remain separate from the role being demonstrated. If the required account or starting state is unavailable, show setup guidance before recording begins.

For example, record **Submit an application** as **Applicant / First-time applicant**, then record **Review an application** as **Caseworker / Assigned case**. Each generates its own screen sequence. The same journey can also have multiple persona variants, such as first-time and returning applicants.

The workspace lets reviewers filter flows and screens by role/persona and inspect variants alongside one another. Differences may include screens, actions, branches, and available controls; recording one profile does not automatically generate the others. Cross-role handoffs can be linked between separate flows; switching authenticated roles mid-recording is outside the initial scope.

---

# Flow

A Flow represents a user or business journey.

Example:

Create New Application

---

# Step

A Step represents a meaningful UI state.

Examples:

Customer Search

Search Results

Customer Overview

Application Details

Review

Confirmation

---

# Action

An Action represents something required to reach or manipulate a Step.

Examples:

Click Search

Enter surname

Select customer

Click Continue

---

# Transition

Transitions connect Steps.

Example:

Application Details
→ Continue
→ Review

Transitions may contain conditions.

Example:

Continue

Valid
→ Review

Invalid
→ Validation Error

---

# Primary Experience

## Enter from the prototype

The reviewer opens the existing project, clicks its floating widget, and chooses **Open review workspace**. They can inspect an existing flow, read comments, select a version, or start recording. The current page and version provide the initial context; no project creation or URL registration is required.

## Record

The current DOM-capture workflow uses **Capture screen**, **Stop recording**, and explicit **Discard recording** as specified above. The Playwright-controlled workflow and richer toolbar described next remain longer-term requirements, not implemented recording controls.

From the widget or full workspace, the user presses:

Record prototype

They choose a journey and role/persona profile, then start recording and interact with the prototype normally. Keep the active role/persona visible throughout the recording toolbar alongside **Capture Step**, **Pause**, and **Finish**.

RevisionLab launches an explicit recording session against the current project's configured environment using a Playwright-capable local runner or worker. The browser widget is the entry point; it does not run Playwright itself. If the runner is unavailable, explain how to connect it and allow existing flows and comments to remain reviewable.

A lightweight toolbar allows the user to identify meaningful moments:

Capture Step
Add Annotation
Create Branch
Pause
Finish

On **Finish**, save the journey variant and generate its screen previews. Show generation progress and any failed captures, then offer **View generated flow** or **Record another role/persona**. The latter starts a separate recording with an isolated session. Do not claim to have generated screens for an unrecorded profile.

---

# Generate

The recording becomes a structured journey.

Example:

Customer Search
↓
Search Results
↓
Customer Overview
↓
Application Details
↓
Review
↓
Confirmation

Screens are generated automatically for each Step.

Every generated screen identifies its flow variant, role/persona, prototype version, and viewport. The generated board arranges captured steps and connects successive steps with directional arrows; it must not invent paths that were not recorded or explicitly added by an editor. A single-screen recording remains a valid board with no fabricated connection. Comments stay attached to the exact screen context being reviewed.

Later profile grouping and replay can restore a variant's starting state and refresh only that variant's current previews while preserving historical artifacts. They are not prerequisites for generating a board from the screen recordings already available.

---

# Edit

The Flow Editor allows users to:

- rename steps
- reorder steps
- remove unnecessary steps
- change actions
- insert steps
- create branches
- merge branches
- rerun individual steps

This editor should feel visual rather than like a testing IDE.

---

# Review Canvas

The flow becomes a generated, whiteboard-like canvas inspired by Miro: captured screens are arranged spatially and directional arrows make each available journey path readable. Opening a saved recording must produce a usable board without requiring the user to take screenshots again or manually connect its sequential steps.

Example:

                ┌──────────────┐
                │ Search       │
                │              │
                │ [screen]     │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ Results      │
                │              │
                │ [screen]     │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ Customer     │
                │              │
                │ [screen]     │
                └──────────────┘

The canvas should provide only the collaboration functionality relevant to prototype reviews.

It is not intended to be a general-purpose replacement for Miro.

The implemented board lets owners and editors enter **Paths** edit mode to move screens, connect source and target screens, label/remove connections, and remove or restore screens within the selected flow version. The diagram stays visible; contextual connection controls appear only after selection. Labels document possible paths; they do not create screenshots, discover unvisited routes, or execute branches. Reviewers with commenter access can select saved connections and discuss them without permission to change shared structure.

Node positions and connections are saved through the server to local SQLite or the configured shared libSQL store. Reopening the flow restores its saved arrangement; browser storage is not the authoritative board. Updating an existing installation migrates its data without discarding recordings, comments, or historical versions. A new recording version gets its own board and feedback context rather than silently moving pins from an older screenshot.

Acceptance criteria for this increment:

1. A recording containing three captured screens opens as three nodes with visible directional arrows connecting its recorded sequence, with the flow, persona, and version identified.
2. An owner/editor can reposition nodes, add a labelled alternative connection, use automatic arrangement, and reload to recover the saved layout and connections. A commenter cannot perform those mutations through either the UI or API.
3. Pan, zoom, and fit-to-content keep larger flows navigable. A keyboard-accessible screen list and explicit connection/layout controls provide a non-drag alternative; touch and narrow-screen review remain usable.
4. Clicking a chosen screenshot area in comment mode creates a saved pin and discussion on that exact screen version. Another authorized reviewer can select it, reply, and see the saved discussion after reloading.
5. A pin stays on the same screenshot location when the image or board is resized or zoomed. Opening a different screen or version never shows the pin on an unrelated image. Existing unpinned comments remain accessible.
6. Visible loading, empty, saving, failure, and permission states replace fake sample nodes or optimistic claims of a successful save. Failed writes retain recoverable input and are not presented as persisted work.

## Full-flow wheel navigation — current refinement

The reviewer must be able to zoom the entire flow easily with an unmodified mouse wheel over the whiteboard background or any screen node, including its screenshot. Screens and their connections scale together, and the board point under the cursor stays in place. Wheel navigation must feel smooth and predictable without requiring a modifier key or opening an individual screen.

The implementation uses a normal zoom range of 10%–300%; **Fit** may go below 10% when necessary to display a large flow. Keep the zoom buttons, **Reset 100%**, **Fit**, keyboard navigation, background-drag panning, and touch-drag navigation. **Shift+wheel** pans the board. Wheel input outside the board retains ordinary page scrolling. Camera pan/zoom is transient local view state and does not change draft node positions, saved layout coordinates, recording content, connection identity, or screenshot-relative comment anchors.

Acceptance criteria:

1. Wheel up/down over both empty board space and screenshot nodes zooms the complete graph in/out around the pointer, keeping arrows attached to their screens and preventing simultaneous page scrolling within the board.
2. Repeated wheel input respects the normal 10%–300% bounds; **Fit** can still show every screen of a large flow at a smaller scale, and **Reset 100%** restores the normal scale.
3. **Shift+wheel**, background dragging, touch dragging, keyboard navigation, and explicit zoom/Fit controls remain usable. Wheel input outside the board scrolls the page normally.
4. Zooming and panning do not mark a saved board as edited, alter an existing layout draft, or change persisted positions, connections, or comment anchors.

Validation: local browser checks confirm pointer anchoring within one pixel over screenshots and board background, graph-wide scaling, page-scroll isolation, panning, keyboard and explicit controls, 10%–300% bounds, desktop and 390px-wide Fit, and unchanged save state. Fit below 10% is covered by camera unit tests, not a large-flow browser fixture. Real touch gestures and other browsers remain untested; see `VALIDATION.md`.

## Direct whiteboard editing — current partial implementation

Confirmed requirements:

- **Paths** turns on an explicit edit mode within the existing whiteboard. Clicking it must not open the legacy source/destination connection form. Keep the diagram visible, show editing tools and a clear selected state, and provide a way to leave editing.
- Select an individual connection to access its contextual actions and add comments attached to that connection, rather than to one of its endpoint screens. Connection threads retain authors, replies, resolution, and exact flow/version context when nodes move or the board zooms.
- Provide an action to add a decision element to the flow. The precise meaning of “decision form” is still open; a diagram decision node is the proposed interpretation, not yet a confirmed choice.
- Allow screens to be removed from the flow and added by entering a screen URL. Do not require recording an entire journey merely to request one extra screen. The URL addition must have honest validation, pending, success, and failure states.
- Preserve the existing screenshot pin/speech-balloon experience, navigation, and role boundaries. Owners/editors change flow structure; commenters may discuss permitted connections without acquiring structure-editing permissions.

Implemented interaction and preservation choices:

- Use the keyboard-accessible **Connect** button on a source screen, then **Connect here** on a target. Selecting a connection reveals its contextual label, removal, and discussion controls; entering edit mode alone never opens a form.
- Autosave structural changes after a short pause (500 ms), or after a screen drag finishes. Remove the manual Save/Discard buttons. Serialize writes and preserve newer local edits while a request is in flight; no-op edits, camera movement, and connection selection do not write to storage.
- **Undo** reverses the last local board operation and autosaves the inverse. A completed drag and a continuous label-typing burst each count as one operation. Undo covers movement, auto-arrangement, labels, connection creation/removal, and screen removal/restoration, including the original connection identities and adjacent paths. Retain up to 50 operations across successful autosaves within the mounted flow; clear history on reload, changing flow/version, or adopting another editor's board. Comments, captures, and recording controls are outside this history. Redo is not part of this increment.
- Show waiting/saving/saved status. Failed writes retain the draft with **Retry autosave**; revision conflicts pause writes without overwriting the other editor. **Load saved board** explicitly discards the local conflict and reloads current server state. **Done editing**, workspace/flow changes, sign-out, and starting another recording wait for pending writes; failure keeps the current flow open. A supported browser's native unload warning protects pending work on full-document departures, but abrupt closure/offline shutdown cannot guarantee persistence.
- Connection comments submit independently of structural drafts and require a saved connection identity. The server binds each identity to its flow/version, endpoints, and recorded/manual origin. Removing a path archives that identity and keeps its existing threads readable and replyable in **All comments**; it cannot transfer feedback to a different path. New threads require a connection on the saved board.
- **Remove screen** hides the screen from this board and removes its adjacent active connections after confirmation. Persisted removal metadata prevents it from returning on reload or a later capture. **Restore** returns the screen to the draft; paths may be reconnected explicitly. Captured images, recording order, screen pins, historical versions, and discussions are not deleted or rewritten.

Proposals for the two unimplemented tools, pending confirmation:

- Interpret the decision element as a question node with labelled outgoing branches such as **Yes** and **No**, used for documentation rather than executable prototype logic.
- Initially accept routes and URLs from this prototype installation. Validate and normalize targets; never forward reviewer credentials to another origin or silently run an arbitrary server-side URL fetch. Broader external-page support requires an explicit security and capture design.

Open choices before implementing the decision and URL-addition tools (neither tool is implemented):

1. Does “decision form” mean a diagram decision node with a question and labelled branches, or an interactive form inside the prototype?
2. Does adding a screen URL capture that page as a real screenshot, or create a clearly labelled URL-only placeholder? If capture is chosen, it needs an explicit authenticated capture workflow; a blank image is not a successful capture.

Acceptance criteria for the implemented subset:

1. **Paths** changes the board's interaction mode without opening the legacy connection form. There is no manual Save button; source/target actions, autosave status, Undo, and exiting are distinguishable and keyboard accessible.
2. A reviewer can select a saved connection and submit/reopen its own thread. Moving endpoint nodes, zooming, and reloading preserve the connection identity and discussion; other connections and versions never inherit it accidentally.
3. Removing a screen or connection shows the affected structure, leaves no dangling active connections, and preserves captures and feedback. Removed screens can be restored; archived connection threads remain accessible without appearing on unrelated paths.
4. Server authorization and revision/conflict checks cover all new mutations; existing flows, captures, screen comments, and historical versions survive migration. Errors retain recoverable input and block internal departure until saving succeeds or conflict recovery is explicitly chosen.
5. Edits persist without pressing Save. Undo works before and after an autosave, groups a drag or continuous label edit, and restores exact removed paths without losing discussions. A write in flight cannot overwrite a newer local edit or suppress a queued undo; unchanged boards do not save. Stale polls do not reset local history, and another editor's newer revision is never silently overwritten.

Acceptance criteria still pending the two product choices:

1. An authorized editor can add the confirmed decision element and its labelled branches, save, and reopen the same structure. It must not be represented as executable logic unless that scope is separately agreed.
2. URL-based addition follows the confirmed capture/placeholder choice and cannot invent a screenshot or claim a failed capture succeeded.

---

# Canvas Capabilities

Whiteboard increment:

- a scrollable/pannable spatial board, with zoom and fit-to-content
- automatic arrangement of recorded screens and directional sequence connections
- persisted screen positioning and owner/editor drag controls with keyboard alternatives
- explicit owner/editor connection editing and labels for alternative paths
- screen selection and detailed screenshot inspection
- screen-area pins, threaded replies, and open/resolved status
- visible role/persona and exact version context

Current navigation refinement (implemented; validation limits in `VALIDATION.md`):

- pointer-centered mouse-wheel zoom of the full graph, including when the pointer is over a screen screenshot
- Shift+wheel panning and the retained explicit, keyboard, and touch navigation controls

Current editing capabilities (implemented and locally verified; limits in `VALIDATION.md`):

- a Paths edit-mode toggle and contextual, on-canvas connection controls
- keyboard-accessible source/target connection actions
- connection-specific comment threads with preserved archived history
- reversible screen removal/restoration, structural autosave, Undo, and guarded Done editing

Requested editing capabilities still awaiting clarification (not implemented):

- a decision element, with its form/node interpretation to be confirmed
- adding a screen by URL, with screenshot capture versus a linked placeholder to be confirmed

Later capabilities, not required for these increments:

- unlimited-canvas optimization, groups, and sticky notes
- executable decision branches and recording from a selected branch
- DOM-element annotation anchors and automatic re-anchoring
- freehand drawing
- presentation mode
- multiplayer cursors
- voice/video collaboration

---

# Screen Nodes

A Screen Node represents a Step.

It includes:

- screen name
- generated screen image
- prototype route
- version
- role and persona
- comment count
- review status
- change indicator

Actions in the whiteboard increment:

- Open Live
- Select screen and inspect its captured image
- Place a comment pin and open an existing discussion
- Arrange or connect screens when authorized

In **Paths** edit mode, **Remove screen** hides a screen and its adjacent active paths from this board; **Restore** returns it without changing its capture or feedback. Save/Discard controls persist or cancel these structural changes. **Add screen** by URL is not implemented: screenshot capture versus a linked placeholder remains an explicit open choice.

Replay, compare versions visually, and view recorded actions remain later actions. Version selection currently means inspecting each saved recording and its own feedback, not automatically detecting visual changes.

---

# Annotation Experience

## Screen-area comments — current requested increment

Use a Figma-like pinned discussion: the reviewer selects a captured screen and, with **Add comment** enabled, clicks the specific area they mean. This mode is enabled initially when opening a screen and can be toggled for inspection. A draft marker shows the target while they write. Canceling the draft creates no saved thread. Submitting creates one pin attached to the root comment; replies stay inside that discussion rather than adding duplicate pins.

Store the point as normalized image coordinates (`x` and `y` from 0 to 1), relative to the actual screenshot bounds rather than the surrounding card, viewport, page scroll, or canvas position. Associate it with the exact step, flow version, and immutable captured image. Pin rendering must account for image scaling and any non-image padding. Dragging a node or zooming the board must never change its stored anchor.

Show speech-balloon previews for all root pinned comments eligible under the current resolved filter, without requiring each pin to be opened. Each preview identifies its author and comment and points back to the saved image location. A hide/show bubbles control clears the previews for image inspection without removing the pins or their discussions. Selecting a bubble or pin by click, tap, or keyboard expands that thread beside its location. Keep the full comment, author attribution, replies, reply composer, and open/resolved status readable inside the expanded balloon; owners/editors can resolve or reopen the same thread there. Reposition balloons when the image scrolls, zooms, or resizes, and flip or shift them near viewport edges so their content and controls remain reachable. Collision handling must retain a clear association with each original pin; a shifted or clamped bubble must not imply that its displayed corner is the saved target. Balloons are presentations of existing threads, not new comments or stored coordinates. All authenticated reviewers with access to that screen can add a pin and reply. Give each pin and preview an accessible name, support keyboard activation and a close control/Escape for the expanded thread, and restore focus to its activating control on dismissal. Provide a non-pointer way to place/adjust the target. Text-only page and screen comments remain available in the sidebar, including all existing feedback without coordinates.

Readability acceptance criteria: each root comment and reply has its own visually distinct card; the author, timestamp, message, thread status, and available actions can be distinguished at a glance. At desktop and narrow mobile widths, multi-paragraph feedback and long unbroken text remain fully readable without overlapping controls or overflowing the panel. Selecting a pin still focuses the matching discussion, replies remain attached to that root, and authorized resolve/reopen controls continue to work.

Anchored-balloon acceptance criteria: opening a screen shows a preview for every eligible pinned root comment, with a visible pointer to its saved location and the resolved filter respected. Hiding and showing bubbles does not change comments or anchors. Activating a bubble or pin expands its matching discussion without navigating or automatically scrolling to the sidebar. Nearby pins and pins near image or viewport edges remain individually identifiable and usable at desktop and narrow mobile widths; scrolling, image zoom, and resizing preserve each bubble's association with its original pin while full thread content remains accessible. Keyboard users can open, read, reply, and dismiss an expanded balloon and return focus to its activating control. Switching pins, screens, or versions never shows an unrelated thread. Reloading preserves the original anchor, replies, author attribution, and resolved state.

A comment is not shown as saved until the server commits it. On failure, preserve the draft for retry and explain the problem. Pins must remain readable and correctly placed on small screens and zoomed screenshots; loading or missing images must not accept misleading coordinate placement.

## Element-aware anchors — later capability

The longer-term system may also attach feedback to an actual DOM element, for example `role=button` with name `Submit Application`, and attempt to resolve that locator after replay. This requires an explicit element/DOM capture mechanism; a screenshot click alone cannot supply a trustworthy locator. If a future replay cannot resolve a target, show **Annotation target changed** rather than silently moving the pin. Coordinate comments in historical versions remain anchored to their original screenshots and are not automatically copied into newer versions.

---

# Flow Replay

Later target capability, not part of the whiteboard/pinned-comment increment: a recorded Flow can be replayed against the latest prototype.

Example:

Replay Flow

✓ Customer Search

✓ Search Results

✓ Customer Overview

✓ Application Details

✗ Review

This serves two purposes:

1. regenerate review screens
2. verify that the documented journey still works

This creates a connection between product documentation and regression testing.

---

# Versioning

Every review is associated with a prototype version.

Example:

Review Version
v14

Current Prototype
v18

The current workflow lets reviewers switch between saved flow versions, each with its own screen artifacts, board, and comments. Existing pins remain on their original captured screens; creating a new recording version must not silently move or relabel historical feedback.

Later change-detection capabilities identify:

- unchanged screens
- changed screens
- new screens
- removed screens
- broken steps

This allows old review discussions to remain understandable.

---

# Review Lifecycle

Suggested statuses:

Open

Acknowledged

In Progress

Ready for Review

Resolved

Deferred

---

# Review Workflow

This is the longer-term replay-aware workflow. The current whiteboard review uses immutable captured screens and explicit new recordings rather than automatic replay or annotation re-anchoring.

Prototype changes

↓

Recorded Flow is replayed

↓

Affected screen nodes refresh

↓

Previous annotations attempt to re-anchor

↓

Changed screens are highlighted

↓

Reviewer inspects changes

↓

Comments are resolved or reopened

↓

Review report is generated

---

# Codex Workflow

Comments should be convertible into structured implementation instructions.

Example:

Reviewer comment:

"The Submit Application button feels too far below the summary."

The system already knows:

Flow:
New Application

Screen:
Application Review

Route:
/application/review

Element:
Submit Application button

Version:
v18

From this information generate:

Implementation request

Affected screen

Affected element

Feedback

Acceptance criteria

Related comments

This can be copied directly into Codex.

Future versions may create an integrated Codex workflow.

---

# Reporting

The review workspace should be capable of generating formal documentation.

Example:

# Prototype Review
Customer Onboarding

Version:
v18

Reviewed:
21 September 2026

12 screens reviewed

18 comments

11 resolved

5 open

2 deferred

## Key Decisions

Search results remain card based.

Address lookup remains mandatory.

Confirmation step simplified.

## Open Issues

Application Review

[screenshot]

Issue #21

Submit CTA positioning.

Owner:
Design

Status:
Ready for Review

The report should be derived directly from structured review data.

---

# Export

Initial:

Markdown

JSON

HTML

Future:

Confluence

Jira

Miro

Excalidraw

PDF

The application's own data model remains canonical.

External tools are destinations.

---

# Relationship With Miro

Miro is not required for the primary workflow.

The review workspace replaces Miro specifically for prototype review.

Miro export may remain useful when a customer or programme requires artefacts within an existing Miro workspace.

In that case:

Review Workspace
→ export
→ Miro

Miro should not need to be synchronised continuously with the prototype.

---

# Relationship With Excalidraw

Excalidraw is useful as:

- inspiration for interaction simplicity
- an optional export target
- potentially an underlying serialization format for portable whiteboards

The product should not depend on Excalidraw for its canonical domain model.

---

# Key Differentiator

Traditional whiteboard:

Screen image
+
coordinates
+
comments

RevisionLab:

Prototype version
+
executable journey
+
screen state
+
DOM element
+
annotation
+
review decision
+
implementation context

The review artefact understands what is being reviewed.

---

# Major Differentiator: Executable Documentation

A user-flow document should not merely describe the application.

It should be capable of executing the application.

If the documented journey says:

Customer Search
→ Results
→ Customer
→ Application
→ Confirmation

the system can replay that journey.

If the journey stops working, the documentation shows where.

This makes the flow simultaneously useful for:

- stakeholder communication
- business analysis
- design review
- documentation
- regression checking
- development handoff

---

# MVP

The MVP should prove one central idea:

A prototype can generate and continuously maintain its own review flow.

MVP workflow:

Install RevisionLab in the existing Next.js project

↓

Mount the integration in its layout and enable the review environment

↓

Open the prototype and click the widget

↓

Choose **Record prototype**, a journey, and a role/persona in the widget

↓

Record the journey as that role/persona

↓

Capture meaningful steps

↓

Generate screens

↓

Open the generated flow board in the full-page workspace, with screens automatically arranged, directed paths, and visible role/persona and version context

↓

Record another role/persona as a separate variant or flow

↓

Select a captured screen and click the specific area to place a comment pin

↓

Open the pinned discussion, reply, and resolve feedback when authorized

The remaining steps are later replay/element-aware work beyond the current whiteboard increment:

↓

Attach DOM-element anchors when available

↓

Replay after prototype update

↓

Screens update automatically

↓

Comments remain attached where possible

↓

Generate Codex instructions

↓

Generate Markdown review report

---

# MVP Success Criteria

A developer can install RevisionLab in an existing Next.js project, mount the integration in its layout, and open the project's review workspace from the widget without creating a project in a central hub.

A reviewer can open a direct flow/comment/version link, navigate between review views, and return to the prototype. Refreshing or restarting reopens the saved `.revisionlab/` contents. Preview deployments share live history only through an explicitly connected persistent store; a copied folder is a snapshot. Disabled environments expose neither the widget nor review data or execution endpoints.

The installer creates `.revisionlab/revisionlab.db` and applies its schema automatically. Repeated setup preserves existing records. The complete workspace can be backed up and restored without a separately installed database service. Missing artifacts and read-only storage are reported clearly, and no comment is shown as saved before its database transaction commits.

From the widget, a user can record at least two role/persona profiles and generate separately labeled screen sequences. Filtering or switching profiles shows the correct screens and comments. Replaying one profile does not overwrite the other; missing profile setup is explained before capture, and recording never silently changes the user's live prototype session.

For the whiteboard increment, a saved sequence automatically opens as positioned screen nodes and directed arrows. Authorized editors can save arrangements and explicit labelled paths; commenters cannot change the board. A reviewer can place a pin on a precise screenshot area, another reviewer can reply, and both see the same persisted thread after reload. Resizing/zooming preserves pin position, keyboard users have equivalent access, and switching versions keeps every pin and thread with its original screen. The detailed observable checks are in **Review Canvas** above; replay, element-locator anchoring, and change detection are separately scoped later capabilities.

A designer should be able to modify the prototype and update a complete stakeholder review flow without:

- manually taking screenshots
- manually replacing images
- recreating connectors
- copying comments between systems
- manually rewriting a review report

---

# Non-Goals for MVP

Do not build:

- a centralized multi-project dashboard or portfolio hub
- a replacement application host or deployment platform
- a complete Miro replacement
- full visual regression testing
- enterprise project management
- complex Jira workflows
- general diagramming software
- video conferencing
- design-system management
- production analytics
- full QA management

Focus tightly on prototype review.

---

# Future Opportunities

## Automated Flow Discovery

Observe navigation and propose flows automatically.

## AI Flow Summaries

Generate descriptions such as:

"User searches for an existing customer and creates a new application."

## Requirement Extraction

Transform approved review decisions into structured requirements.

## Automated Acceptance Criteria

Generate acceptance criteria from steps, actions, and comments.

## Accessibility Review

Automatically identify accessibility issues during replay.

## Responsive Flow Review

Replay the same journey at:

Desktop
Tablet
Mobile

and show responsive states alongside one another.

## Visual Change Detection

Highlight changed regions between prototype versions.

## CI Integration

When a prototype deployment changes:

automatically replay selected flows.

## Review Gates

Prevent a prototype version being marked approved while critical comments remain unresolved.

## Git Integration

Associate prototype versions with:

branch
commit
pull request

## Direct Codex Integration

Generate implementation tasks and execute approved changes through Codex.

## Confluence Integration

Create or update review pages automatically.

---

# Product Principles

## Lives Inside the Project

The prototype is the entry point. Installation, access, review context, and ownership are scoped to its host project. `.revisionlab/` owns the local workspace, while the configured Turso/libSQL and artifact adapters own the deployed shared workspace. Hosted storage must preserve explicit import/export portability and must not introduce a central hub as a required user journey.

## Prototype Is the Source of Truth

Never require duplicate manual maintenance.

## Generated, Not Recreated

Review artefacts should be derived from the prototype.

## Structured Feedback

A comment should know:

where it belongs,
what element it targets,
which version it refers to,
and whether it has been addressed.

## Visual for Stakeholders

Users should not need to understand Playwright or source code.

## Precise for Developers

Developers should receive routes, locators, states, comments, and acceptance criteria.

## Version-Aware by Default

Reviews without version context quickly become ambiguous.

## Collaboration Without General-Purpose Complexity

Build the review tools necessary for prototype evaluation rather than rebuilding an entire whiteboard platform.

---

# Long-Term Vision

RevisionLab becomes the project-embedded connective layer between:

Design
Business Analysis
Client Review
Development
Testing
Documentation

The prototype is no longer an isolated demo.

It becomes an executable specification of the intended product experience.
