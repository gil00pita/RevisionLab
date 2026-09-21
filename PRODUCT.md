# Product Brief — Prototype Review Workspace

## Working Name

Prototype Review Workspace

Alternative names:

- Review Canvas
- Flow Review
- Prototype Workspace
- FlowCanvas
- Prototype Review
- Journey Review

---

# Product Vision

Create a collaborative review environment where interactive prototypes become living, versioned user-flow documentation.

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

Project
→ Prototype Versions
→ Flows
→ Steps
→ Actions
→ Transitions
→ Annotations
→ Comments
→ Reviews

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

## Record

The user opens the prototype through the review tool and presses:

Record Flow

They interact with the prototype normally.

The application records browser interactions through Playwright.

A lightweight toolbar allows the user to identify meaningful moments:

Capture Step
Add Annotation
Create Branch
Pause
Finish

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

Prototype Review Workspace:

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

Create project

↓

Add prototype URL

↓

Record journey

↓

Capture meaningful steps

↓

Generate screens

↓

Display flow on canvas

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

A designer should be able to modify the prototype and update a complete stakeholder review flow without:

- manually taking screenshots
- manually replacing images
- recreating connectors
- copying comments between systems
- manually rewriting a review report

---

# Non-Goals for MVP

Do not build:

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

Prototype Review Workspace becomes the connective layer between:

Design
Business Analysis
Client Review
Development
Testing
Documentation

The prototype is no longer an isolated demo.

It becomes an executable specification of the intended product experience.
