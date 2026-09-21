# Product Brief — RevisionLab

This is the living product specification. Update it as new product requests and decisions arise. Requirements describe intended behavior unless explicitly marked implemented; proposals and open questions are not accepted implementation decisions.

## Working Name

RevisionLab — embedded prototype review for individual Next.js projects.

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
- **Commenter:** view the scoped review, add and reply to comments, and resolve their own threads where policy permits.
- **Editor:** commenter permissions plus review-management actions explicitly granted by the owner.
- **Owner:** installation configuration, invitations, recording access, destructive actions, exports, and storage settings.

Prototype roles/personas such as Applicant or Administrator are recording contexts and never grant RevisionLab permissions. A display name, email domain, invitation URL, or prototype role alone must never confer editor or owner access.

## Commenting experience

- Provide **Add comment** in the widget and full workspace. The reviewer selects a screen or element, writes feedback, and submits without navigating to an account page.
- Capture project, flow, variant, role/persona, screen, prototype version, execution, DOM locator, and fallback coordinates automatically.
- Show explicit sending, saved, and retry states. Never display a comment as saved until the shared-store transaction commits.
- Let reviewers reply, mention other invited reviewers, edit their own recent comments, and follow or mute threads according to policy.
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

## Full-page workspace

The full workspace opens at a configurable route within the host application, with `/revisionlab` as the proposed default. It provides the space needed to inspect flows, screen states, threaded comments, versions, execution history, and reports.

The default launch opens a new browser tab so the live prototype's unsaved state remains intact. Provide a normal accessible link and a same-tab option when preferred. Carry the source route and selected flow/version into the workspace; **Back to prototype** returns to the original tab when available, or navigates to the saved project-local route. Exact in-memory state is only retained while the original tab remains open.

The workspace has project-local navigation: **Flows**, **Comments**, **Versions**, **Reviews**, **Reports**, and **Settings**. Within a flow, use **Canvas**, **Steps**, **Comments**, **Runs**, and **History**. The active flow and version remain visible. Direct links can open a particular flow, comment, or version under the same access rules as the workspace.

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

Every generated screen identifies its flow variant, role/persona, prototype version, and viewport. The canvas can group variants by profile, and comments stay attached to the exact screen context being reviewed. Replaying a variant restores its profile's starting state and refreshes only that variant's current previews while preserving historical artifacts.

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

The flow becomes a whiteboard-like canvas.

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

---

# Canvas Capabilities

Required:

- infinite canvas
- pan
- zoom
- drag screen
- connectors
- connector labels
- groups
- sticky notes
- screen annotations
- threaded comments
- decision branches
- status indicators
- version indicators

Potential future:

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

Actions:

- Open Live
- Replay
- Comment
- Annotate
- Compare Versions
- View Actions

---

# Annotation Experience

The system should allow comments to target actual UI elements rather than only screen coordinates.

A reviewer selects:

Annotate

Then clicks a button, field, label, table, or other visible element.

The system stores a locator for that element.

Example:

role=button
name="Submit Application"

Comment:

"Could this CTA be closer to the summary?"

This provides more durable feedback than a coordinate pin.

If the prototype changes, the system attempts to resolve the locator again.

If the element can no longer be found:

"Annotation target changed."

---

# Flow Replay

A recorded Flow can be replayed against the latest prototype.

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

The system identifies:

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

Open the generated flow in the full-page workspace, grouped by role/persona

↓

Record another role/persona as a separate variant or flow

↓

Add comments

↓

Annotate UI elements

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
