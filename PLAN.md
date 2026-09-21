# Codex Build Instructions — Prototype Review Workspace

## Objective

Build a web application that turns an interactive prototype into a versioned, reviewable user-flow workspace.

The application should allow a designer, BA, developer, or client reviewer to:

1. Open an existing web prototype.
2. Record a user journey using Playwright.
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

The system consists of four major areas:

- Prototype Runner
- Flow Recorder / Step Editor
- Review Canvas
- Review / Delivery System

Conceptually:

Prototype
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

- Next.js latest stable version
- React
- TypeScript
- Playwright
- PostgreSQL
- Prisma
- React Flow or XYFlow for the initial canvas implementation
- Tailwind CSS
- shadcn/ui where useful
- Zod for runtime validation

Prefer server-side APIs and server actions where appropriate.

The architecture should remain modular enough that the canvas could later be replaced with a more advanced custom renderer.

---

# Important Architectural Principle

Playwright is the execution engine.

Playwright scripts are NOT the primary source of truth.

The application's own structured data model must represent:

- projects
- prototype versions
- flows
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

## Project

Represents one prototype/review workspace.

Fields should include:

- id
- name
- description
- prototypeBaseUrl
- repositoryUrl optional
- createdAt
- updatedAt

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
- startUrl
- currentVersionId
- createdAt
- updatedAt

A flow contains ordered Steps and potentially branches.

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
- route
- stateParameters JSON
- viewport JSON
- screenshotArtifact
- DOMSnapshotArtifact optional
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

## 1. Project Dashboard

Allow users to:

- create project
- define prototype URL
- view flows
- view review activity
- view prototype versions
- create or record a new flow

---

# 2. Record Flow

Provide a clear action:

"Record Flow"

Launching it should open a controlled browser session driven by Playwright.

Display a recording toolbar.

Example:

● Recording

[Capture Step]
[Annotate]
[Decision]
[Pause]
[Finish]

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

Implement:

- authentication
- project-level authorization
- non-public projects by default
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

---

# MVP Scope

Build MVP around one excellent workflow:

Create project
→ add prototype URL
→ record flow
→ capture meaningful steps
→ edit steps
→ replay using Playwright
→ generate screens
→ render screens on canvas
→ annotate screen
→ comment
→ create Codex prompt
→ generate Markdown report

Do NOT initially implement:

- full Miro replacement
- multiplayer cursor presence
- complex freehand drawing
- video conferencing
- advanced permissions
- enterprise SSO
- Jira integration
- direct Confluence API writes
- AI-generated flow inference
- automatic requirement extraction
- pixel-perfect visual regression

Prepare architecture for them without implementing unnecessary complexity.

---

# Suggested App Navigation

Sidebar:

Projects

Inside project:

Overview
Flows
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

Record Flow
Replay
Review
Generate Report
Export

---

# Visual Design

The product should feel like a professional design/development tool.

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

For local MVP, running Playwright directly from the server is acceptable.

Keep a clean abstraction so execution can later move to:

- container workers
- CI
- GitHub Actions
- hosted browser infrastructure

---

# Artifact Storage

Store generated assets behind an abstraction:

ArtifactStore

Artifacts include:

- screenshots
- Playwright traces
- DOM snapshots
- reports

Local filesystem is acceptable for development.

Prepare adapters for object storage later.

---

# Testing

Provide:

- unit tests for flow/action transformations
- API tests
- Playwright tests for critical product journeys
- validation tests for imported recordings

Critical E2E:

1. create project
2. record/import flow
3. replay
4. generate screens
5. display canvas
6. create annotation
7. create comment
8. export report

---

# Developer Experience

Add:

README.md

Include:

- setup
- database setup
- Playwright installation
- environment variables
- running app
- running worker
- running tests
- architecture overview

Also create:

docs/architecture.md
docs/domain-model.md
docs/playwright-recording.md
docs/review-canvas.md

---

# Build Strategy

Implement incrementally.

## Phase 1 — Foundation

- Next.js project
- database
- Project model
- Flow model
- Step model
- Action model
- basic CRUD

## Phase 2 — Playwright Runner

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

1. User enters a prototype URL.
2. User defines or imports a simple three-screen flow.
3. Playwright executes the flow.
4. Screenshots are generated automatically.
5. Three screen nodes appear on the canvas.
6. The user connects/repositions them.
7. User clicks a screen element and leaves a comment.
8. User selects that comment.
9. Application creates a Codex-ready implementation prompt.
10. User reruns flow and refreshed screenshots appear automatically.

Build this vertical slice before expanding the feature set.

---

# Definition of Done for MVP

The MVP is complete when a user can maintain a review flow without manually taking or replacing screenshots.

Updating the underlying prototype and replaying the flow must refresh the generated screen states automatically while preserving:

- canvas layout
- comments
- annotations where element locators still resolve
- flow relationships
- review history

That behaviour is the central product promise.
