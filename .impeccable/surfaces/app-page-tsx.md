---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/views/projects-view.tsx","components/views/new-project-view.tsx","components/views/dashboard-view.tsx","components/app-shell.tsx","app/globals.css"]
---

# RevisionLab application shell

## Scope and mode

- Primary target: `app/page.tsx`.
- Related targets: Project catalogue, Project detail and prototype routes, New Project / Add Prototype import workflow, authenticated shell, prototype overview, responsive preview, flows, history, comparison, access, and account states.
- Visitor mode: Operate.

## Audience, job, and task

Designers, prototypers, and developers first need to connect a code repository, group its runnable applications, and understand what is configured versus what still needs infrastructure. Once inside a Prototype, they need to preview real responsive behaviour, record or inspect flows, and revisit version evidence without learning Git.

The primary first-run action is creating a Project and configuring its first Prototype. Returning users open a Project, then a Prototype. The import route must make the Project/repository boundary and Prototype/runtime boundary obvious.

## Content and constraints

- The confirmed hierarchy is Workspace → Project → Prototype → flows, history, comparisons, and access.
- One Project owns one Git repository by default and may expose several Prototype roots.
- Runtime configuration covers framework preset, repository-relative root, install/build/start commands, port, and health path.
- Advanced environment variables expose secret/plain, build/runtime, and preview/replay scopes. Public frontend prefixes require a visible browser-exposure warning.
- This front-end slice stores only local deterministic metadata. Entered environment values are discarded on save; GitHub authentication, cloning, encrypted storage, OCI builds, and sandbox execution remain explicit runner-service boundaries.
- Repository code is untrusted and must never run in the RevisionLab web process or share its origin.
- Meet WCAG 2.2 AA, preserve keyboard focus and reduced motion, and use standard Chakra UI only.

## Chosen direction

Signal Desk / Traffic Table. Projects inherit the existing operational-route grammar at a higher altitude: source, branch, Prototype count, build, environment, and members align as stations. Opening a Project moves down one level into the established Prototype routes.

The import workflow is a compact configuration route rather than a modal: a vertical sequence on desktop becomes a horizontal scrollable step track on mobile. The final review pairs the retained configuration with an honest execution route, distinguishing the one available local step from runner-dependent work.

Memorable moment: completing the wizard produces a real Project and nested Prototype record while the route visibly remains “Runner required,” making progress and infrastructure boundaries legible at once.

## Responsive translation

At tablet and mobile widths, Project routes become stacked bordered bands with a horizontally scrollable station track. The import stepper moves above the form and scrolls horizontally; fields, environment-variable controls, and the review split collapse to one column. Primary and back actions remain visible without using a modal or shrinking the configured prototype viewport.

## Unresolved decisions

Production Supabase tables/RLS, GitHub App credentials and repository picker, KMS-backed secret storage, the queue, Cloud Native Buildpacks/Paketo worker, gVisor or equivalent runtime, preview-origin proxy, recorder bridge, build logs, quotas, retention, and cleanup are not configured in this front-end delivery.
