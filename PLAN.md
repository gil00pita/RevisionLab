# Build Instructions — RevisionLab Embedded Review

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
- React Flow or XYFlow for the initial canvas implementation
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

Annotations are tied to a specific Step and preferably to an actual DOM element.

Fields:

- id
- stepId
- prototypeVersionId
- flowVariantId
- executionId (identifies the reviewed screen and recording-profile snapshot)
- targetLocator JSON optional
- fallbackCoordinates JSON optional
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

The primary anchor should be a DOM locator.

Coordinates should only be a fallback.

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

Create an infinite pan/zoom canvas similar conceptually to:

- Miro
- FigJam
- Excalidraw

But DO NOT attempt to recreate all of those products.

Optimize specifically for prototype review.

Use React Flow / XYFlow initially.

Each Step should appear as a Screen Node.

Example:

┌──────────────────────────┐
│ Application Details      │
│                          │
│ [generated screen]       │
│                          │
│ 3 comments               │
│ Changed since v14        │
└──────────────────────────┘

Nodes must support:

- visible role/persona labels and grouping/filtering by recorded variant
- move
- resize where sensible
- select
- zoom
- pan
- connectors
- labels
- grouping
- comments
- version state
- replay step
- open interactive prototype state

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

Support branches.

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

The user should be able to:

- create a branch manually
- record branch from selected step
- label transition
- define condition
- merge branches later

---

# 7. Annotation Mode

Provide two modes:

Interact Mode
Annotate Mode

In Annotate Mode:

1. user clicks a visible UI element
2. determine the underlying DOM locator
3. create annotation targeting that locator
4. allow user to type comment

Store:

- locator
- prototype version
- step
- comment
- author
- timestamp
- optional coordinates

When screen is regenerated:

attempt to locate the same element again.

If found:

reposition annotation automatically.

If not found:

mark annotation:

"Target changed or no longer exists"

This is important.

---

# 8. Commenting

Support threaded comments.

A comment should allow:

- replies
- mentions
- status
- assignment
- category
- resolution
- link to code task
- link to prototype version

Provide filters:

- all
- open
- resolved
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
- screen nodes
- edges
- pan/zoom
- saved layout
- step inspector

## Phase 5 — Review System

- annotations
- comments
- statuses
- assignments
- threaded replies
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

Updating the underlying prototype and replaying the flow must refresh the generated screen states automatically while preserving:

- canvas layout
- comments
- annotations where element locators still resolve
- flow relationships
- review history

That behaviour is the central product promise.
