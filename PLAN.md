# Build Instructions — RevisionLab Embedded Review

## Current increment — Feedback Review

Implemented locally 6 October 2026, not yet published: a dedicated navigation section reviews repeated comments, saved accessibility findings, and recorded test metrics together. Preserve each occurrence and source context; exact comment duplicates are grouped automatically and reviewers select related groups or individual occurrences for read-only local Codex ticket generation. Save editable Jira-ready drafts with priority, acceptance criteria, evidence snapshots, explicit Draft/Ready/Fixed status, and optimistic revisions. Show existing draft coverage, generation progress/cancellation/errors, and manual-copy fallback. Retain existing screen actions and comments. Connected/combined selections link to their source installations; never fall back to local writes. Consolidation, evidence completeness, persistence/conflicts, permissions/origin checks, runner failures/cancellation, navigation, keyboard and responsive layout are validated in VALIDATION.md. PRODUCT.md is authoritative; full structured reports remain planned.

6 October additions implemented locally: suggest matching open page comments while typing; show inbox screenshots and zoom with saved locations; select extensible Markdown ticket templates; display a generation skeleton; explicitly mark tickets Fixed to hide linked threads while retaining screenshots and historical evidence. Reopening restores eligible comments. PRODUCT.md defines the scope and acceptance criteria.

6 October zoom refinement implemented locally: replace the separate screenshot button with an icon over the thumbnail, and restore scoped theme styles on screenshot and template dialogs. Verify actual computed styles, zoom/pin alignment, keyboard focus return, and desktop/mobile layouts.

6 October timeline refinement implemented locally: show grouped feedback on a connected timeline, with latest-occurrence timestamps and saved linked-ticket priorities; sort by date or priority in either direction. Put All and tooltip-labelled type icons in a segmented control beside search. Preserve selection, source expansion, screenshots, keyboard interaction, and narrow layouts; unprioritized groups sort last.

6 October floating selection actions implemented locally: replace the bottom inline generation form with a compact Chakra action bar after selecting feedback. Keep count, current template, generate, and clear actions visible, and put template management and reviewer notes in an Options panel. Preserve selection focus, draft options, progress/cancellation, existing generation constraints, and responsive access to underlying content.

6 October list height refinement implemented locally: preserve the original desktop inbox/drafts column widths and responsive stacked layout. Fill remaining desktop page height and remove the timeline height cap/inner scroll. Let long lists scroll with the page and preserve floating actions. The user clarified that width must remain unchanged; the temporary full-width layout and its drafts jump/reveal are superseded.

## Current refinement — White workspace navbar

Implemented locally 3 October 2026, not yet published: use Chakra's white token for the workspace sidebar and submenus, including the Your flows Back area, flow-list section, and remaining panel space. This replaces the earlier light-grey background decision. Retain dark text/icons and count badges, pale-blue selected items, and visible dark-blue keyboard focus. Navbar menu items, including Settings, use a light-blue hover background: blue.50 for unselected items and blue.200 for selected items. Update the workspace selector and reviewer footer for contrast while preserving navigation and responsive layout. PRODUCT.md defines contrast acceptance criteria.

## Planned direction — Human-centred collaboration and usability evidence

Confirmed 3 October 2026: bring client, BA, and team prototype variants and feedback together, reducing duplicated work and review-tool switching with human-centred design as the guiding approach. Build on existing flows, versions, comments, prototype test sessions and replay, individual Jira drafts, and local Codex fixes. Consolidated testing findings, testing/flow reports containing pain points/issues/priorities, and report-derived Jira-ready tickets remain unimplemented requirements. Preserve evidence and source flow/version context through reporting and ticket drafting. Current Jira handoff is manual copy/paste; Codex generates proposals for explicit review/application under its existing local permissions.

Before implementing the remaining reporting increment, resolve test facilitation and the full report-to-ticket interaction, reusing the implemented participant/session handling. The 6 October Feedback Review request separately authorizes consolidated local Codex ticket drafts from existing feedback/test evidence. Do not equate personas or automated accessibility scans with real-user usability testing. PRODUCT.md defines acceptance criteria and delivery boundaries. README.md is the concise introduction, and WORKSPACE_GUIDE.md retains detailed operating instructions.

## Current increment — AI Instructions and design systems

Implement the Settings → Audit editor with the supplied full default review prompt, local Markdown base text and database-backed design-system configuration, the 18-framework radio catalogue with dated GitHub stars and resource links, manual resources, and optional skill/MCP setup requests in the generated preview/copy output. Preserve the base prompt when disabling the appendix and preserve existing comment settings and role checks. Use the installed Chakra v3 components. Direct installation remains unconfirmed; this implementation prepares instructions for the receiving agent. Validate new/legacy defaults, reload, intentionally empty prompts, resource validation, concurrent comment updates, permissions, and keyboard/desktop/mobile behavior. The merged editor preserves the file location, external edits, and explicit file-loading failure/retry; local Codex composes the same enabled appendix used by preview/copy. Use the selected workspace endpoint for both Markdown and design-system saves; retain backwards compatibility for remote state and history snapshots created before AI settings existed. See PRODUCT.md for the authoritative acceptance criteria and VALIDATION.md for actual results.

## Current increment — First-use setup wizard

6 October visual refinement: remove the blue outline from step titles while preserving heading focus on step changes and visible keyboard focus on controls.

Implemented locally, not yet published: a persisted owner-led wizard in the embedded workspace: required identity and detected/editable live URL, followed by widget appearance/position/visibility, live comments with inherited color, live and recorded accessibility checks, optional persona recommendations, notification providers and default email selection, and existing users/roles management. Widget placement is limited to Bottom Left or Bottom Right, with legacy top placements migrated to the matching bottom side. New installations show a Setup-only launcher, and the wizard has no top Back to prototype link. Save progress with retryable errors, allow skipping after step one, retain normal settings access, and migrate established installations without interruption. Validation covers first-use detection, required-step enforcement, saved preferences, authorization, reload, skip, and responsive keyboard behavior; see VALIDATION.md. PRODUCT.md defines the ordered flow and exact persona recommendations.

## Current security increment — workspace users, roles, and persona credentials

Confirmed and implemented locally 2 October 2026; not yet published. Durable workspace membership and a **Users & roles** workspace view now absorb the current **Review access** view while preserving legacy invitation routes during migration. Owner, Editor, and Commenter remain the fixed default roles. Owners manage members, role assignments, join-code/email policies, the canonical system URL, and persona credentials. Editors create flows, choose personas, record, and manage non-secret persona details. Commenters review and comment only. Self-join assigns Commenter by default; custom role creation is not in confirmed scope.

Implement two passwordless onboarding paths: (1) a workspace join link plus a separately entered, hashed/revocable/rate-limited code, followed by allowed-email validation and a single-use email verification link; and (2) owner-created pending membership with a chosen role and a project-named notification containing a single-use login link. Store no RevisionLab passwords. Signed-out members request a fresh email link for a new login; authenticated sessions retain bounded expiry and immediate revocation. Support normalized exact-email and domain allow rules for code-based self-join, with deny-by-default and an explicit owner override for manually added external clients.

Add an owner-configured canonical system URL under workspace **Settings** for absolute join, notification, and login links, while keeping allowed-email and join-code controls in **Users & roles**. Require an explicit HTTPS origin in production, allow HTTP only for loopback development, validate any base path, never trust the inbound Host header to construct security links, and restrict return destinations to the installation. The local-owner shortcut requires a development runtime and loopback request and fails closed on Vercel or another deployed runtime; deployed access always uses authenticated workspace membership. Audit URL, policy, membership, role, code, session, and secret-access changes.

Extend Personas with an optional synthetic prototype username/password secret. Store credentials encrypted with a server-side key or in a secret provider, never in plaintext persona rows or ordinary API responses. A dedicated authorized endpoint may return the selected persona's credential only to an Owner/Editor creating a flow. The widget shows **Test account for {persona}**, with username, masked password, and intentional reveal/copy controls. Exclude this UI and secret data from capture, accessibility scans, logs, comments, reports, analytics, backups that promise non-secret portability, and exports; clear client-held values when context or authorization changes. Prototype credentials never grant RevisionLab access.

Delivery order: schema and migration compatibility; role-policy authorization; system URL and email-policy settings; join code and manual-add workflows; magic-link login/session revocation; Users & roles UI; encrypted persona secret storage and audited reveal; widget banner; security/accessibility/browser tests; documentation. Existing invitation/session records require an explicit migration path and must not be silently promoted or discarded.

## Implementation checkpoint — 22 September 2026

Yarn CI compatibility (2 October 2026, implemented locally): pin Yarn Classic 1.22.22 and install with the frozen Yarn lockfile; release preparation and metadata validation use the workspace manifest without an npm lockfile. Preserve npm packing/trusted publication, automatic version selection, and source-commit retry detection. Regression checks cover a Yarn-only release checkout and unchanged dependency locks.

Persistent workspace navigation (2 October 2026, implemented locally): use Next.js-integrated native history replacement for menu section changes, keeping the mounted workspace and sidebar while updating search parameters locally. Preserve the current URL pathname, replace-history behavior, and board-autosave gate. Verify section content/headers, active states, sidebar identity/focus, route-request absence, and reload/deep-link behavior in the browser.

Screen feedback automation (29 September 2026, implemented locally): screen-wide and per-comment/rule actions run the signed-in local Codex CLI in read-only mode with saved instructions and available screenshot evidence. Structured before/after replacements support guarded Apply/Discard/Undo; Create draft PR uses an isolated checkout, matching default-branch source, and GitHub CLI to publish only reviewed changes without switching branches. Editable, copyable Jira drafts require no external integration. Persist proposals locally and restore the current tab's latest proposal per scope. Tests cover scope/role/origin restrictions, runner failures/cancellation, stale edits, syntax/path validation, and isolated Git publication; browser fixtures exercise ticket and fix actions. GitHub/Claude AI providers remain future work. PRODUCT.md defines scope and VALIDATION.md records validation boundaries.

Workspace AI instructions (29 September 2026, implemented locally): a focused Chakra editor under Settings uses an authenticated file endpoint and atomic local Markdown writes. The UI shows the configured path, retains failed drafts, and preserves existing settings. Server checks cover persistence, empty content, permissions, invalid input, and filesystem failures; browser checks cover save/reload and failed-save retry. PRODUCT.md defines the requirement and local/hosted storage boundary; VALIDATION.md records checks and limits.

Local login recovery (1 October 2026, implemented locally): expose only the local-owner availability flag through a public auth-options endpoint; add an explicit local access action that awaits the existing logout operation before opening the workspace. Retain invalid-session rejection and all production/hostname/configuration restrictions. All 17 route-handler tests pass, including stale-cookie recovery, proxy access to options, and production/hostname/configuration restrictions. Lint and the production build pass. Chrome checks verify recovery, cookie removal, keyboard retry after a failed logout, hidden unavailable access, and a 390px layout without horizontal overflow. The user confirmed localhost is affected; the exact original error remains unconfirmed. This fixes the reproduced localhost recovery gap.

Page-aware workspace header (29 September 2026, implemented locally): pass the active workspace view into the shared header and use page titles instead of the project name, including loading and empty states. Map each workspace view to its own subtitle describing recordings, feedback, personas, comment display settings, or reviewer access. Keep the selected flow title and metadata in place of a subtitle. The current requirement removes Export report and Refresh from the workspace header. Preserve polling, sign-out, flow actions, and sidebar branding. Verify titles, distinct subtitles, and action visibility across all five views.

Floating board viewport controls (28 September 2026, implemented locally): extract camera controls into a focused Chakra component, positioned at the bottom-right of the canvas outside its wheel/pan event surface and transformed graph. Retain existing camera callbacks and upper editing controls. Browser checks verify zoom/reset/Fit, keyboard use, stationary positioning, narrow screens, commenter access, and connection-panel layouts; results are recorded in VALIDATION.md.

Compact flow header (28 September 2026, implemented locally): consolidate the selected flow title, metadata, recording and deletion actions in the top workspace header. Use Chakra Tabs for Whiteboard/Screen & comments and a history-icon Menu for version selection. Keep the board mounted across tab changes and retain autosave guards, role restrictions, recording/deletion behavior, and page-specific non-flow headers. Keyboard navigation, version switching, responsive layout, recording retry/continuation, and existing deletion workflows pass against isolated data; validation is recorded in VALIDATION.md.

Recorded accessibility (28 September 2026, implemented locally): share a serialized axe runner between the widget and recorder; save bounded accessibility reports in existing per-screen capture metadata. Match pre-interaction cached reports to exact page states, mark unstable/failed/missing checks unavailable, preserve historical and reused screens, and expose status/counts on board cards with a saved-report tab alongside screen comments. Verify persistence, schema/role boundaries, genuine browser scans across navigation and changed content, failure handling, privacy, and responsive review. PRODUCT.md is authoritative for scope and acceptance.

Flow selection mode (26 September 2026, implemented locally): hide row checkboxes and bulk actions until an owner/editor activates Select. Reveal Select all, Select none, selected count, and bulk deletion in that mode. Done clears selection and restores the normal list; keep single-flow deletion in the flow view header, filtered eligibility, permissions, and deletion confirmation unchanged. Menu rows contain no individual delete buttons. Verify keyboard, mobile, selection reset, and real deletion with the existing isolated browser fixture.

Workspace flow deletion (25 September 2026, implemented locally): owner/editor single and multi-select deletion in Your flows includes family-wide confirmation, filtered select-all, busy/error/success states, and board-autosave coordination. All versions and dependent data are removed transactionally; batches containing unfinished recordings are rejected, unrelated data is preserved, and screenshot cleanup remains retryable. Seven server tests cover persistence, authorization, atomicity, shared artifacts, cleanup, and races; isolated browser checks cover the real workflow, cancellation/focus, selection, retries, autosave blocking, stale polls, and desktop/mobile layouts. PRODUCT.md defines the scope and acceptance criteria; VALIDATION.md records verification and limits.

Recording graph refinement (25 September 2026, implemented locally): visit order is persisted separately from unique screens. Automatic captures reuse identical captured images on the same route within the same version, keeping changed states separate. A -> B -> C -> A -> E becomes four nodes with both return and branch connections. Bounded, privacy-filtered source click evidence survives same-origin navigation; connection selection shows its label/type, source screenshot, element bounds, and pointer position or explicitly identified keyboard center. Repeated traversals have a visit selector; missing/legacy evidence remains unavailable, not inferred. Edited/removed paths and historical recordings are preserved, recorded edges are validated against observed transitions, and nonconsecutive paths route below the board. Matching, capacity limits, acceptance criteria, and capture limitations are defined in PRODUCT.md; local verification is recorded in VALIDATION.md.

Accessibility inspection refinement (25 September 2026): connect the widget's current axe findings to exact local element references, show problem bubbles while results are open, and make rule titles/individual targets scroll to and highlight their components. Keep documentation in separate Read more links, compact selected-issue details, keyboard/Escape operation, viewport tracking, and private/stale/unavailable-target cleanup. The issues-found and passed toolbar states use the supplied accessibility-person warning and green-check SVGs respectively; other status icons and element markers remain unchanged. No server persistence or new external scanning service is required. Implementation and local verification are tracked in `VALIDATION.md`; PRODUCT.md defines the acceptance criteria.

The first functional package is implemented under `packages/revisionlab`, and the root Next.js app uses its public exports. Completed: safe `npx` installer; SQLite/libSQL persistence; private screen artifacts; owner bootstrap and email-code invitations; reviewer/editor/owner authorization; revocation and expiry; optional prototype access gate; layout widget; automatic route and manual screen capture; persona-labeled flows; immutable completed recordings and linked versions; page/screen comments with resolution; full review workspace; Markdown report export.

Registry verification on 29 September 2026 confirms revisionlab@0.1.1 under latest (no next tag). Newer workspace features remain unreleased. The automatic release fix is implemented locally in `.github/workflows/publish.yml`: every source-repository main push selects the next stable npm patch in CI, validates metadata/build/tests/packed CLI, and publishes the same tarball through npm trusted publishing. Version selection and publication share a queue; recorded source commits prevent duplicate stable publication on full reruns. PRs and manual runs validate only; explicit GitHub Releases retain stable/prerelease support. No bot version commit or GitHub Release is required for main publication. Acceptance and failure behavior are authoritative in `PRODUCT.md`. The latest main run had passed but skipped publishing because the old workflow required a GitHub Release and none existed. The GitHub `npm` environment is confirmed without restrictions; npm trusted-publisher settings and live OIDC publication remain unverified. Merge this change and verify the first automatic npm release; see `RELEASING.md`. GitHub Packages is a separate registry and is not a publication target. The `/setup` guide leads with the published npx workflow and retains local archives for unreleased changes. Shared deployments require real Turso/Resend configuration. React support currently means React 19 within Next.js 15/16 App Router, not standalone React/Vite.

The whiteboard increment is **implemented**: generated screen layout and recorded-sequence arrows, persisted owner/editor node positioning and labelled connections, pan/zoom/fit/automatic arrangement, and screenshot-area pins with threaded replies and resolution. Local browser checks verified board/path persistence and pin/reply/zoom behavior; build, lint, and all 50 automated tests pass. See `VALIDATION.md` for evidence and remaining limits.

The comment-readability refinement is implemented: individual Chakra cards separate author/date metadata, readable message content, and available actions. Replies have their own full-width cards and a visible count heading. The shared renderer covers screen discussions, all comments, and widget feedback. Desktop/mobile screen discussions, temporary display-only long-content checks, and thread navigation were verified; lint, production build, and all 50 package tests pass. Detailed evidence and un-repeated checks are recorded in `VALIDATION.md`.

The speech-balloon refinement is **implemented**: all eligible pinned root comments show readable previews connected to their saved image locations by default. A hide/show control preserves pins, and selecting a preview or pin expands the same discussion with replies and permitted resolve/reopen actions. Collision-free preview placement can extend the scrollable canvas for dense comments. Expanded threads adapt to narrow viewports; unavailable screenshots retain sidebar access. Browser checks cover desktop/mobile positioning, multiple edge pins, hide/show, keyboard dismissal, unsent reply retention on close/reopen, zoom, and image-failure fallback. Eight new layout tests bring the package suite to 58 passing tests; detailed evidence is in `VALIDATION.md`.

The current navigation refinement is **implemented**: unmodified mouse-wheel input over the full-flow board or its screenshots zooms the complete graph around the pointer. Camera state remains local, with Shift+wheel panning and retained explicit zoom/Reset/Fit, keyboard, background-drag, and touch-drag controls. Ordinary zoom is bounded to 10%–300%; Fit may use a lower scale for large flows. Local browser checks cover wheel anchoring within one pixel, graph-wide scaling, page-scroll isolation, mouse/keyboard controls, bounds, desktop and 390px-wide Fit, and unchanged save state. Eight camera tests bring the package suite to 66 passing tests, including Fit below 10%. Real touch gestures, other browsers, and a large-flow browser fixture remain untested; see `VALIDATION.md`.

The supplied logo/favicon replacement is **implemented and locally verified**: a shared Chakra `RevisionLabLogo` displays the packaged native SVG on the example homepage, workspace navigation, and access header. The example favicon is generated from the same artwork. Lint, the production build, all 66 existing package tests, desktop/narrow-screen logo checks, favicon serving/decoding, and package-asset inclusion checks pass. Functional widget icons and the wider UI palette are unchanged; the installer does not replace host-project icons. A fresh separate-host installation and cross-browser checks were not repeated; see `VALIDATION.md`.

The recording-control refinement is **implemented and locally verified**: visible **Stop recording** controls complete and save the current capture sequence, while confirmed **Discard recording** deletes only the unfinished draft and its artifacts. Same-domain page links now proceed without prompting; same-tab links leaving the domain retain a warning. Historical Continue checks below are superseded for internal navigation. Lint, the production build, all 88 package tests, and browser Stop/Stay/Continue/discard-retry checks pass. Warning-dialog visuals were confirmed at 1440px and 390px widths; a fresh separate-host installation was not repeated. Host programmatic navigation requires the exported confirmation helper. Native unload warnings and client-side Back/Forward limits are documented explicitly below and in the READMEs; see `VALIDATION.md` for evidence.

The direct-editing request is **partially implemented and locally verified**: **Paths** enters edit mode without the legacy form; on-screen source/target actions create connections, and selection opens contextual label/removal/discussion controls. Screens can be removed from and restored to the board without deleting captures or feedback. Save/Discard and guarded Done editing preserve drafts. Package and root production builds, lint, all 98 package tests, and local desktop/mobile interaction checks pass; see the current increment below and `VALIDATION.md` for evidence and remaining limits. Decision elements and adding a screen by URL remain **not implemented**, pending the two unanswered choices in `PRODUCT.md`.

The sections below remain the broader target product plan. Playwright action replay, automatic discovery of unrecorded paths, executable branch conditions, recorded semantic DOM anchors and replay-aware re-anchoring, visual diffing, structured Codex task generation, and the broader export integrations remain future work. The current live-widget increment adds DOM-element feedback independently of recordings. Recorded versions preserve captured screens; they do not replay an action script. Remote artifacts default to private database BLOBs for simple setup, with an adapter boundary for object storage. `PRODUCT.md` is authoritative for these delivery boundaries.

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
- canonicalSystemUrl (validated origin and optional supported base path)
- environmentBaseUrls (local, preview, and explicitly enabled review deployments)
- repositoryUrl optional
- createdAt
- updatedAt

Non-secret project settings live in `.revisionlab/config.json`; machine-specific overrides live in `.revisionlab/local/`. Resolve credentials from environment variables or a secret provider, not JSON records. Temporary browser authentication state, if needed, lives under the ignored local directory with restricted access. Secret values must not be returned as installation metadata.

---

## WorkspaceIdentity, Membership, JoinCode, LoginChallenge, and ReviewSession

`WorkspaceIdentity` represents a verified human email independently of any one installation. Store a stable provider-independent subject, normalized email, display name, verification timestamps, and audit timestamps. It has no password credential and receives no authority from its domain alone.

`WorkspaceMembership` binds an identity or pending normalized email to a `ProjectInstallation`. Store:

- id, projectId, identityId when activated, and normalized email
- role: commenter, editor, or owner
- status: pending, active, suspended, or removed
- source: code join, manual addition, migrated named invitation, or owner bootstrap
- invitedBy, createdAt, activatedAt, updatedAt, suspendedAt, and removedAt
- a revision used for authorization/session invalidation

Enforce one current membership per normalized email and installation, at least one active Owner, and server-side role checks for every operation. A role or status change invalidates or refreshes derived sessions immediately. Historical comments continue to point to the stable identity and retain immutable author snapshots.

`WorkspaceJoinCode` represents a rotatable self-join capability for one installation. Store a hash only, plus createdBy, createdAt, expiresAt, revokedAt, lastUsedAt, optional usage limit/count, and a policy revision. Possessing the raw code is necessary but never sufficient: joining also requires the email policy and verified email control. Do not place the raw code in logs, analytics, database rows, or automatically generated URLs.

`AllowedEmailPolicy` stores normalized exact-address and domain rules, deny-by-default behavior, the self-join role (initially fixed to Commenter), revision, author, and audit timestamps. Exact and domain comparisons use a documented normalization strategy. Manual addition outside the policy requires an explicit owner confirmation and audit event; it does not alter the self-join policy.

`LoginChallenge` stores the installation and intended membership/identity, a hash of the single-use email token, a validated project-local return destination, expiry, attempt/send metadata, and consumed/revoked timestamps. Generic request responses prevent email enumeration. Rate-limit by installation, normalized email hash, code/challenge, and source without logging raw tokens.

`ReviewSession` binds an identity to an active membership. Store a hashed opaque session id, membership id and revision, effective role, expiry, revocation, creation, and last-seen metadata. Send only the opaque value in a secure, HTTP-only, same-site cookie. Login rotates the session; membership removal/suspension, sensitive role changes, owner revocation, and security resets invalidate it.

`SystemUrlSetting` stores the validated canonical origin/base path used for outbound access links, plus revision and audit metadata. Prefer server-side environment configuration as the production authority when the deployment cannot safely permit runtime mutation. Never derive outbound security links from an untrusted request Host header.

Existing `ReviewInvitation`, `ReviewerIdentity`, `EmailChallenge`, and invitation-bound session rows remain supported during migration. Migrate verified identities and named grants into identities/memberships without granting a broader role or scope. Open invitation possession never becomes durable membership without the new email-policy and verification checks.

Comments and replies reference the stable identity and retain an immutable author snapshot. Owner/Editor authority comes from the active membership, never from a comment snapshot, display name, prototype persona, allowed domain, join code, or old invitation URL.

## PersonaCredential

`PersonaCredential` is an optional secret attached one-to-one to an active recording persona. Store the username and password as authenticated encrypted ciphertext or provider secret references, with project/persona ids, key version, created/updated/rotated metadata, and last-access audit metadata. Encryption keys remain outside the database. Do not include plaintext values in ordinary persona models, list responses, portable exports, reports, application logs, traces, screenshots, or analytics.

Create/update/delete is Owner-only. A dedicated short-lived reveal response is available to an active Owner or Editor only while creating/recording a flow with that persona; authorize it again server-side and audit access. Do not cache it in persistent browser storage. Persona renaming, archiving, or credential rotation never rewrites historical flow snapshots, and a prototype username/password never authenticates a RevisionLab member.

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

On enabled prototype pages, render an accessible floating widget with configurable placement. The logo expands or collapses the tools; a separate **Open review workspace** link opens the configured workspace in the same tab. Preserve native link semantics, keyboard activation, and modifier-click/new-tab behavior. The camera enters **Record prototype** setup separately. Offer relevant flow/comment links; never start recording on widget open. Recording setup and launch must be possible without visiting the workspace first.

Open the full-page workspace at the configured project-local route. The expanded widget’s workspace action opens it in the same tab through an accessible link; modifier-click or the browser context menu can open a new tab to preserve the original prototype. Carry validated project-local return context and flow/version selection. Avoid placing sensitive form values or arbitrary redirect targets in URLs.

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

Keep flow selection, version context, and first-flow empty states in the workspace instead of an intermediate logotype dialog. Preserve keyboard focus, Escape for the remaining widget overlays, mobile layouts, loading/error states, and focus return to the relevant widget control.

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
│ Application Details │
│ │
│ [generated screen] │
│ │
│ 3 comments │
│ Changed since v14 │
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
/ \
 Valid Invalid
| |
v v
Review Error State

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
- real-user usability findings and supporting evidence (planned)
- pain points, issues, and priorities agreed during testing/flow review (planned)
- editable Jira-ready ticket drafts derived from report findings (planned; manual copy/paste)

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

Use RevisionLab passwordless workspace membership as the default access system. Members either join with a valid workspace code plus an allowed, verified email or are manually added by an Owner and verify the notified address. Login uses short-lived single-use email links; RevisionLab stores no member password. This application-level gate must cover the prototype, workspace, APIs, and private artifacts in the dedicated review environment. Vercel Authentication and shareable links are deployment controls, not member identity or authorization.

Implement:

- authentication
- active/pending/suspended/removed workspace memberships with fixed Commenter, Editor, and Owner roles
- rotatable, revocable, hashed workspace join codes that are never sufficient without verified email control
- configurable exact-email/domain self-join policies with deny-by-default support
- hashed, single-use email login challenges with expiry plus attempt and send rate limits
- scoped member sessions using secure HTTP-only cookies and membership-revision invalidation
- project-level authorization
- installation-scoped authorization enforced on every review page, API, artifact, and runner request
- prevention of last-Owner removal/demotion and self-escalation
- canonical system URL validation for outbound security links
- review data private by default, including direct links
- signed artifact URLs if cloud storage is used
- noindex
- robots exclusion
- secure cookies
- CSRF protection where relevant
- audit trail for login, membership, role, policy, code, system URL, and persona-secret actions

Never store real or production passwords from recorded prototype sessions. Persona settings may store only synthetic test-account credentials, encrypted at rest with keys outside the database or referenced through a secret provider. Ordinary persona APIs expose only whether credentials are configured. Plaintext is returned only by a dedicated authorized, audited reveal request and must never enter logs, reports, exports, analytics, screenshots, traces, or persistent browser storage.

Sensitive form values should support masking.

Users should be able to mark fields as:

- secret
- personally identifiable
- excluded from recording

Recorded data should default to synthetic/test data.

Provide an authorization adapter so a host may integrate its own identity system later, while passwordless membership remains the default. Local-only development can use an explicitly enabled loopback identity. Remote/shared reviews require a valid active-membership session. Hiding the widget is not authorization. Enforce access again in every route handler/server action and artifact response; do not expose protected content when the integration is disabled or a visitor knows a direct URL.

The join/login endpoints are the only anonymous application entry points required for workspace access. Return generic challenge responses, bind post-verification redirects to validated project-local destinations, rotate sessions after verification, and revoke derived sessions when a membership is suspended/removed or its security revision changes. Hash join codes and email tokens with suitable domain separation, compare in constant time where applicable, and rate-limit by installation, normalized email hash, code/token, and source. Apply CSRF protection to state-changing requests and use origin checks where appropriate.

Build outbound security links only from the configured canonical system URL. Require HTTPS in production and allow HTTP only for loopback development. Reject unsupported origins/base paths and open redirects; never substitute an inbound Host header. Treat changes as security events and do not retroactively rewrite or revive issued links.

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

Never expose prototype credentials in general client state. The one exception is the confirmed widget test-account banner: after a separate Owner/Editor authorization check for the selected persona and active flow-creation context, return the minimum secret to that requesting session, mask the password by default, and clear it when the context closes or changes.

Bind profile authentication to server-side secret references or ephemeral runner state. Only expose profiles the reviewer is authorized to execute, validate that authorization when launching a run, and clean up isolated sessions after use. Selecting **Administrator** as a prototype profile must never confer administrative access to RevisionLab or bypass host authorization.

---

# MVP Scope

Build MVP around one excellent workflow:

Initialize RevisionLab in an existing Next.js project
→ mount the integration in its layout
→ open the prototype
→ click the widget
→ join with a workspace code and allowed verified email, or accept a manual membership email
→ log in with a single-use email link
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
- custom roles, editable permission matrices, member passwords, or general-purpose user profiles
- Jira integration
- direct Confluence API writes
- AI-generated flow inference
- automatic requirement extraction
- pixel-perfect visual regression

Prepare architecture for them without implementing unnecessary complexity.

---

# Suggested App Navigation

Entry point on the prototype:

RevisionLab widget logo → expanded tools → Open review workspace

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

SQLite/libSQL tables store installations, workspace identities and memberships, role assignments, join codes, allowed-email policies, sessions, login challenges, persona credentials, migrated review invitations, recording profiles, flows, variants, steps, actions, transitions, canvas layouts, prototype versions, reviews, decisions, comment threads/replies, annotation anchors, executions, artifact/report metadata, audit events, and migration history. Use stable IDs, foreign keys, and indexes for common membership/session and flow/profile/version queries. Flexible locator, viewport, and snapshot payloads may use validated JSON columns. Keep encryption keys outside this store. Store local artifact paths relative to `.revisionlab/` and hosted artifact keys without public URLs. Screens, DOM snapshots, traces, and report bodies remain artifacts; do not maintain duplicate live JSON record directories.

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
2. Configure a system URL and company-email policy; join with the current workspace code and an allowed verified address, then manually add an external client and preserve each intended deep-link destination through single-use email login.
3. Reject a disallowed self-join email, wrong/expired/rotated join codes, expired/consumed login links, invalid attempts beyond the limit, expired sessions, and suspended/removed memberships without leaking access details.
4. Load a protected host page, open the widget, and navigate to the full workspace with the current route/version context under a valid scoped session.
5. Start recording from the widget for two distinct role/persona profiles as an editor; reject the same operation from a commenter session.
6. Generate screens without capturing RevisionLab controls and display the canvas.
7. Create an annotation and threaded comment as one reviewer; reply as another reviewer, reload, and verify attribution and shared-store persistence. Rerun one variant and verify the other's artifacts/comments are unchanged.
8. Inspect an older version, open a direct comment link under the same access rules, export a report, and return to the original prototype tab.
9. Verify membership suspension/removal, role revision, and join-code rotation have their specified effects; protected prototype pages, workspace routes, APIs, and artifact responses remain inaccessible to revoked sessions, disabled environments, or another installation.

Integration checks must cover host styles remaining unchanged, hosts with and without Chakra, server layouts retaining their boundaries, mobile/keyboard widget behavior, conflicting review routes, configured base paths, and unavailable runners or storage.

Profile checks cover **Default**, missing/unauthorized setup, failed authentication, persona edits after historical runs, credential add/replace/remove/rotation, and prototype roles sharing routes but showing different controls. Verify only an authorized active flow creator can request a credential reveal; the password is masked by default and secrets are absent from ordinary browser responses, screenshots, accessibility results, exported review data, logs, analytics, and recorded actions.

Storage checks cover fresh automatic database creation, repeat initialization, migration upgrades/rollback on failure, stable identity across restarts, interrupted transactions/artifact writes, simultaneous comment edits, busy handling, foreign-key integrity, missing artifacts, and read-only mode. Test backup/restore with committed data still in WAL, and JSON export/import round trips. Verify clean setup requires no separate database installation or manual migration commands, and the database/journals cannot be fetched as static files.

Membership checks cover hashed join/login-token storage, allowed-email normalization, generic request responses, resend/attempt limits, single-use consumption, manual-add notifications, last-Owner protection, role authorization, session rotation, cookie security attributes, cross-installation isolation, canonical-URL link construction, open-redirect/Host-header rejection, and immediate membership/session revocation. Test the local SQLite and hosted libSQL adapters against the same contract, including migration from existing invitation rows.

---

# Developer Experience

Add:

README.md

Include:

- setup
- installer and manual layout integration
- configuration, environment enablement, and route customization
- `.revisionlab/` structure, automatic SQLite setup/migrations, backup/restore, and JSON export/import for selective Git tracking
- Turso/libSQL and private artifact configuration, Resend-compatible email delivery, workspace codes, allowed-email and role policies, system URL configuration, and read-only snapshots
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

## Current increment - Compact widget and automatic evidence

WCAG settings: persist version 2.0/2.1/2.2 and level A/AA/AAA in Audit, preserving the current 2.2 AA default. Apply the saved target to live and recording scans, isolate caches by target, retain report metadata/history, and verify migration, permissions, validation, rule selection, and desktop/mobile saving.

Sidebar hierarchy refinement: make Back to prototype the first primary navigation link, move Settings into the persistent bottom footer (also available on mobile), and remove the redundant project title/description below the brand. Keep Settings view guards and active state, Flows/Back transitions, and owner-only access management intact.

Settings layout refinement: keep the top page title only and group content into Widget (widget configuration), Comments (bubble preferences), Audit (WCAG defaults, existing-check guidance, AI Instructions and design-system settings), and owner-only Users & Roles (existing invitations and reviewer permissions). Remove the standalone Review access sidebar entry, retain legacy people links, and preserve invitation drafts across tab changes. Preserve permissions, saving/error feedback, and unsaved drafts across accessible tab changes; verify keyboard navigation and mobile layout.

Widget configuration refinement: extend stored workspace Settings with visibility, named color, left/right side, and horizontal/bottom pixel offsets; preserve active stop/save recovery and clamp placement within the viewport. Add current-issues and scanning badges to the minimal logo. Validate migration, persistence, permissions, invalid/partial updates, panel positioning, badges, and narrow-screen behavior. See PRODUCT.md for confirmed intent and implementation decisions.

Minimal-widget refinement (2 October 2026): default to a 36px logo-only disclosure at bottom right, with matching compact controls and brief horizontal slide/fade animations in both directions (instant with reduced motion). Expand to show the full tools and separate workspace link. Keep each active recording/commenting/auditing stop beside the logo when collapsed; the audit stop uses a white spinner on blue (confirmed 3 October 2026), with reduced-motion support and unchanged cancellation. Auto-collapse on recording/comment start, and hide routine status/help while retaining actionable errors and save acknowledgement. Stop auditing aborts pending publication and pauses live-page rescans until rerun without affecting recording evidence. Validate keyboard disclosure, independent stops, cancelled audit results, rerun, permissions, save feedback, and desktop/mobile sizing. This supersedes the always-expanded branded toolbar checkpoint below; see PRODUCT.md and VALIDATION.md.

Workspace comment settings: add a database-backed Settings view with default live-bubble visibility and named swatches for all ten standard color families. Owners/editors save changes; commenters have read-only access. Preserve visible/blue defaults on existing installations, validate updates on the server, and keep per-page reviewer overrides separate from the shared default. Apply color to live markers and selected-component highlights only. Validate persistence, permissions, partial updates, failures, keyboard access, contrast, and desktop/mobile layout.

Selected live-comment highlighting: use the resolved target bounds to render a non-interactive Chakra outline and tint for the open comment preview. Keep it synchronized with selection, scroll, resize, and layout changes; remove it when the preview closes, comments are hidden, or the target becomes unavailable. Preserve the existing visibility preference on Escape. Verify pointer/keyboard switching, grouped comments, privacy checks, host interaction, and desktop/mobile alignment.

Live preview visibility refinement: use a controlled Chakra **Show comments** switch initialized from saved workspace settings (on by default for existing installations). Show grouped saved-comment markers on initial page load when enabled, with details/highlight closed until pointer or keyboard activation. Preserve the same-page visibility preference across composing/cancelling, reset to the workspace default with no selection on navigation/reload, and render one selected balloon at a time. Closing details retains markers; toggling back on never automatically opens a preview. Escape and Stop commenting exit selection without changing visibility. Hide the layer while composing or opening the review/recording panel, then restore markers according to the preference on dismissal, including composer Escape; details require another activation. Retain workspace-only replies/resolution and existing privacy, route, and identity checks. This supersedes the earlier hidden-default and automatically opened first-preview behavior in historical validation.

Implemented transient-state recording refinement: preserve the screen before an interaction dismisses a dialog or menu, saving the extra evidence only when page content changes. Use a synchronous privacy-filtered html2canvas-pro clone with asynchronous rendering and host-content comparison; retain the settled result and omit an already-captured pre-state. Unchanged clicks upload nothing. Do not delay/replay host clicks. Support keyboard/touch and pointer-down removal, bound/coalesce rapid captures, preserve ordered uploads and Stop/Discard handling, and exclude snapshot infrastructure from accessibility and screenshots. PRODUCT.md records the two-second preparation window and DOM-based detection/navigation boundaries; VALIDATION.md tracks local regression evidence.

Duplicate recording names: check current flow-family names transactionally, ignoring case and surrounding whitespace. Return an explicit conflict before creating anything; the above-widget setup offers Cancel or Replace and record. Replacement creates a fresh version in the selected family while retaining history and comments. Block unfinished families, require choosing among legacy duplicates, and recheck stale/concurrent confirmations on the server. Cancel retains setup values. PRODUCT.md defines the accepted requirement and non-destructive replacement decision; validate server races/history and responsive keyboard UI before closing this increment.

Recording placement/save feedback refinement: position camera setup in a Chakra popover above the bottom-right toolbar, retain persona/start/cancel behavior, and expose a persistent dismissible saved confirmation only after completion succeeds. Link to the exact flow via the workspace's `flow` query parameter. Verify desktop/mobile positioning, keyboard and nested persona selection, failed save/retry, confirmation dismissal, and exact-flow navigation.

Follow-up refinement: preserve completed accessibility results while only review UI changes; continue observing actual host mutations during the pause. Replace the live thread dialog with an anchored Chakra speech-bubble composer containing textarea/Post/Cancel. Remove saved live pins/previews and picker navigation buttons, keeping Up/Down/Enter keyboard selection, the Escape hint, the thread count, and a link to pathname-filtered workspace comments. This supersedes live preview behavior in the checkpoint below; screenshot discussions inside the workspace are unchanged.

Implemented and locally verified on 25 September 2026: the supplied segmented toolbar and white widget mark, persistent comment selection with anchored previews/counts, and the camera-to-Stop transition. Client-only axe-core checks cover visited authorized pages with explicit checking/issues/manual-review/error states. Bounded readiness/quiet detection and coalesced captures replace the fixed route delay, capturing clicks and completed field changes. Validated cursor metadata persists per screenshot through an additive migration; numbered clicks and connecting paths appear in a toggleable whiteboard/full-screen layer without altering historical captures or board layouts. The interaction and numbering choices are confirmed in PRODUCT.md. Build, lint, and all 130 package tests pass. Local browser checks and hosted/cross-browser limitations are recorded in `VALIDATION.md`; automated checks do not certify accessibility.

## Current increment - Single-sidebar drill-down

The whiteboard sizing refinement grows the interactive canvas to fill the remaining workspace height rather than leaving a white strip below a fixed-height board. Preserve minimum usable mobile/short-window height, camera state, and saved coordinates; verify resizing, menu transitions, Fit, pan, and zoom against the expanded viewport.

Implemented and locally verified on 24 September 2026; evidence and remaining limits are in `VALIDATION.md`.

Replace the two simultaneous navigation/flow columns with one fixed-width sidebar. Only the middle content area containing the main menu or Your flows slides horizontally between levels; the logo header, primary Back to prototype link, and bottom footer remain outside the animated and scrolling panels. The prototype link uses an application-window icon and remains visible in the flow submenu and during scrolling. Main menu restores the main menu without changing the selected flow or unmounting its board. Flow rows span the panel with square corners and light dividers, blue badges, number-plus-screen-icon counts, persona icons, and localized recording creation dates/times. Preserve the compact mobile layout with its stationary logo/prototype link, visible Settings action, and desktop-only reviewer identity. Keep reduced-motion styles, focus transfer to Main menu/Flows, narrow-screen scrolling, and board autosave guards. Personas is a main workspace view, not a third panel. Do not implement the superseded icon-rail proposal.

## Current increment - Quick recording and saved personas

Implemented and locally verified. Persona persistence/access/history tests and the existing suite total 127 passing package tests; browser checks cover management, the direct record modal, recovery, and mobile use.

Add a floating record icon that opens the existing recorder dialog directly, with a recording name and database-backed persona selector. Add a workspace Personas view with owner/editor name/description creation and editing, reversible archiving, and read-only commenter access. Persist personas separately from historical flow labels; resolve active persona IDs transactionally when starting new widget recordings and preserve the server-confirmed name as the recording snapshot. Keep legacy API label support for compatibility, with no new free-text persona field in the widget. Test permissions, duplicates, persistence, stale selections, historical preservation, and desktop/mobile recording and commenting together.

## Current increment - Live website element feedback

Implemented and locally verified, independently of future replay-aware anchor migration. Browser evidence and limitations are recorded in `VALIDATION.md`.

Implement live page comments through the existing widget, independently of recording: explicit DOM selection with keyboard controls and cancellation; guarded host clicks; bounded locator/tag/label metadata; additive SQLite/libSQL migration; server validation that keeps live page targets separate from immutable screen/connection context; inherited thread targets; live pins; and unchanged reply/resolution permissions. Prefer stable host identifiers and fail closed when the selector is missing, ambiguous, hidden, or no longer matches its label. Exclude private content and field values. Keep current route-only page scoping and deployment/access gating.

Verify persistence, migration, malformed/mixed target rejection, reply inheritance, authorization, normal host use after cancellation, dynamic layout tracking, route changes, unavailable targets, failed saves, and desktop/mobile/keyboard use. The current implementation covers live DOM selection only; recorded semantic anchors and replay-aware re-anchoring remain future phases.

Re-initiate implementation from the invitation-first vertical slice below. Treat earlier dashboard-first and Vercel-login assumptions as superseded. Preserve useful repository setup, but judge new work against the embedded installation, passwordless access, local/shared storage adapters, widget, and review-workspace architecture in this plan.

## Current refinement — Stop, discard, and recording departure warnings

Implementation is complete and locally verified. Keep Stop and Discard as separate recording transitions: Stop prevents new captures, waits for an in-flight capture, then requests server-confirmed completion; Discard also prevents new captures and waits for any pending capture to settle before deleting the unfinished draft and artifacts through an authenticated creator/owner operation. Preserve all completed versions. Do not clear the pending recording state, navigate away, or report successful cleanup until the server confirms it. Failures keep capture stopped and provide a retry rather than resuming or silently saving.

Stop recovery refinement (3 October 2026): use an atomic server finish operation to complete persisted screens or remove an empty unfinished draft with the existing discard permissions. Do not reject Stop using the browser screen count. Preserve completed versions, history, in-flight upload ordering, stopped retry state, and idempotent recovery after a lost response. Report an empty stop without a saved-recording link. Cover the previously stuck zero-screen session, early Stop, stale counts, failures/retries, and concurrent uploads in regression checks.

Keep **Stop recording** visible in the closed-widget recording controls and the dialog footer across tabs. The user has now confirmed the narrower warning scope: allow same-hostname links without a prompt, and warn only for ordinary same-tab links to another hostname. Preserve native/Next.js internal navigation, including full-document links, with a short-lived one-use unload exemption cleared for cancelled or SPA-handled clicks. Continue recording automatically on enabled same-origin prototype pages. Ignore modified clicks, other browsing targets, downloads, and hash-only changes. Retain explicit Discard confirmation and native close-tab protection. Browsers cannot distinguish close from reload/unapproved full-document exits; those native-warning and cross-origin session-storage limits remain explicit in PRODUCT.md.

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
- Implemented locally, not yet published: recursively allow empty reserved route directory trees left behind by Git, including route groups, while retaining conflicts for files and symbolic links. Validate both app roots, dry-run, generated routes, idempotence, and unchanged host files on conflict.
- Implemented locally and observed in the user's published 0.1.13 installation output: preserve generated files and npm diagnostics after a failed dependency install; explain host-tree ERESOLVE conflicts and print an exact-version/archive retry command. Cover nonzero npm exits and unavailable npm without automatic peer-check bypasses. The reported host requires aligning ESLint / `@eslint/js`, Storybook / Vitest, all Tiptap 3.31.x dependencies, and TypeScript / `tsconfck` together before retrying. Validate the full host manifest with strict peer resolution, a fresh isolated installation, and `npm ls --all`; start development only after a successful install. See VALIDATION.md for evidence.
- Implemented locally, not yet published: automatically diagnose installed direct/transitive version conflicts after npm installation fails, deduplicate required-range reports, and explain repairing declarations together before retrying. Preserve host dependencies and npm's original failure; bound inspection and fall back when the tree or valid npm output is unavailable. New projects need no project-specific repair script. Cover multiple conflicts, malformed/healthy/absent trees, unchanged host dependencies, and the shipped CLI module.
- Floating widget and full-page workspace route
- Scoped styling, lazy loading, and server/client package boundaries
- Dedicated review-environment gating and route protection
- Automatic `.revisionlab/revisionlab.db` creation, bundled migrations, SQLite transactions, and filesystem artifact storage
- Turso/libSQL shared-store adapter with the same logical schema
- Private hosted artifact adapter
- Resend-compatible email delivery adapter
- Workspace memberships, hashed join codes, allowed-email policies, single-use magic-link challenges, and revocable scoped sessions
- Manual member addition with project-named notification email and pending/active states
- Owner-configured canonical system URL for outbound access links
- Commenter/Editor/Owner authorization enforced in server operations, including last-Owner protection
- Folder reopen/restore behavior, hosted publish/import boundaries, and explicit read-only mode
- ProjectInstallation model
- WorkspaceIdentity, WorkspaceMembership, WorkspaceJoinCode, AllowedEmailPolicy, LoginChallenge, ReviewSession, and PersonaCredential models; migration support for existing invitation records
- Flow model
- RecordingProfile and FlowVariant models
- Step model
- Action model
- basic CRUD

## Phase 2 — Playwright Runner

- Widget-initiated recording with role/persona selection and an authorized, excluded-from-capture test-account banner when credentials are configured
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

- screenshot-relative pins and live-page element comments; recorded semantic DOM anchors and replay-aware re-anchoring later
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
2. An Owner configures the canonical system URL and allowed company-email policy, creates a workspace join code, and shares its join link.
3. One employee joins with the code and an allowed verified email; the Owner manually adds one client with a role, and both use single-use email login links to reach the intended deep-linked review without passwords or Vercel accounts.
4. One reviewer opens the widget and full workspace; the other adds and replies to a screen comment. Both see verified attribution and the persisted thread.
5. From the widget, an Editor selects a persona, sees its authorized synthetic test account in the excluded-from-capture banner, and records a simple three-screen journey, then records another profile as a separate variant.
6. The configured Playwright runner executes the flow and generates screenshots automatically.
7. Each variant's screen sequence appears on the canvas with role/persona labels; reviewers filter variants and add element-anchored feedback.
8. The editor generates a Codex-ready prompt, changes the prototype, and reruns one variant; refreshed screenshots appear while prior comment context and the other variant remain intact.
9. Suspending/removing the membership or rotating its security revision removes access to the prototype, workspace, APIs, and artifacts. Direct URLs and old login links do not bypass the gate.
10. Local restart reopens `.revisionlab/revisionlab.db`; hosted deployments reopen the configured Turso/libSQL store. Backup/restore preserves the local workspace without manual database setup.

Build this vertical slice before expanding the feature set.

---

# Definition of Done for MVP

The MVP is complete when a developer can install RevisionLab within an existing Next.js project, manage workspace users and fixed roles, onboard allowed employees by workspace code, manually add clients, and let them comment through its layout-mounted widget and full-page workspace without Vercel accounts or stored RevisionLab passwords.

Code join must require the current join code, an email matching the self-join policy, and verified email control. Manual addition must support an explicitly chosen role and project-named notification, including an owner-confirmed external address outside the self-join policy. Single-use login links preserve validated deep-link return, attribution remains stable, and Commenter/Editor/Owner permissions and immediate membership/session revocation are enforced. Anonymous visitors and revoked sessions cannot read the prototype, review data, APIs, or artifacts.

SQLite is created and migrated automatically inside `.revisionlab/`, storing flows, personas, comments, versions, and history; generated artifacts live alongside it. Everything reopens across restarts, and a consistent backup can be restored without a separate database service. Read-only environments clearly disable writes unless connected to a persistent writer. The host keeps its behavior and styling; disabled environments expose no review capabilities. The workflow must not depend on a centralized project hub.

The widget must support recording for at least two role/persona profiles and opening their generated screens in the workspace. An authorized creator can use a selected persona's encrypted synthetic test account through the masked, audited, excluded-from-capture widget banner; unauthorized users and ordinary APIs cannot retrieve it. Profiles execute in isolated sessions; screens, comments, and version history remain attributable to the correct variant. Rerunning one variant preserves the other, and profile/setup failures are surfaced without generating misleading success states.

The whiteboard increment has its own delivery boundary: generated screen nodes and directional recorded paths, durable owner/editor arrangement and explicit connections, usable pan/zoom/fit and keyboard alternatives, screenshot-relative comment pins, replies, resolution, and preserved existing feedback. Its completion does not imply the broader replay, DOM-anchoring, or visual-diff goals below are implemented.

Updating the underlying prototype and replaying the flow must refresh the generated screen states automatically while preserving:

- canvas layout
- comments
- annotations where element locators still resolve
- flow relationships
- review history

That behaviour is the central product promise.

## Current increment — Thirty-day workspace history

Record a pre-change workspace snapshot for flows, screens, recording state, boards, comments, personas, and workspace settings, retaining private screenshot evidence for the same 30-day window. Expose source-aware history in Settings for local and connected instances, with commenter visibility, editor-only restore, an explicit later-change warning, and a new history entry for each restore. Expire history and unreferenced artifacts during routine history activity while excluding access and connection credentials. Validate complete deletion/restoration, restore reversal, failed/no-op changes, expiry cleanup and retry, role boundaries, connected ID scoping, and desktop/mobile interaction. PRODUCT.md is authoritative for the confirmed behavior.

## Completed increment — Connected workspace instances

Add owner-managed General API keys and Workspace Instances connections, a workspace/all selector, bounded authenticated federation, namespaced review data/artifacts, source-aware editing, failure feedback, and departure guards. Validate key lifecycle, same-project identity, SSRF boundaries, role restrictions, collision isolation, partial failures, and desktop/mobile workflows with isolated installations. Implemented with the confirmed two-workspace selector threshold and permission-limited remote editing. PRODUCT.md records these decisions; VALIDATION.md records checks and remaining deployment verification.

## Prototype test sessions — 3 October 2026

Implemented locally: single-use participant links, server-enforced deadlines and stop controls, a Test sessions workspace view, redacted timestamped input/screenshot capture, per-session/per-screen metrics, and screenshot replay at 0.5×/1×/1.5×/2×. Reuse flows and screen artifacts; isolate participant capabilities from workspace membership. Removed header export/refresh controls and relabelled version recording Record new flow. PRODUCT.md defines acceptance and limits.

## Completed local increment — Notification delivery

Implemented owner-managed Custom SMTP, Resend, and SMTP.dev tabs with independent saved settings and an explicit default email provider, reused in the initial setup wizard before user invitations. Preserve host Resend configuration and passwordless access. Encrypt and redact credentials, exclude them from history/federation, validate provider readiness, and provide test delivery. Add opt-in email recipients and Slack incoming-webhook notifications for new comments/replies and accessibility issues on new saved screens. Preserve feedback on delivery failure, expose delivery status, and verify authorization, secret handling, provider selection, setup migration, failure paths, first-test status persistence, concurrent-owner edits, and stalled providers within the federation deadline. SMTP.dev is a sandbox using SMTP credentials to send; its API key is for its management API. PRODUCT.md records the acceptance criteria and scope assumptions. VALIDATION.md records the automated and browser checks; live provider receipt and hosted deployment remain unverified.
