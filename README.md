# RevisionLab

Review prototype flows, comments, and versions from inside each Next.js project.

RevisionLab's target product is an installable Next.js integration: initialize it within an existing project, mount a small component in the layout, and open a full-page review workspace through a floating widget. Each installation owns its flows, comments, versions, runs, and reports.

The widget also starts prototype recordings for selected roles/personas. Each recording generates its own screen sequence, ready to review and comment on by role, persona, and version in the full workspace.

Shared review uses passwordless invitations. Employees and clients can verify any permitted email with a one-time code, then comment under a secure scoped session without a Vercel account, password, or RevisionLab registration. Invitations may target named emails or accept any verified email possessing a revocable, expiring review link.

The planned local store is SQLite at `.revisionlab/revisionlab.db`, automatically created and migrated during setup. It holds personas, flows, comments, versions, invitations, and run history; generated screens, traces, and reports sit alongside it. Local use needs no database server, credentials, or manual database commands. Deployed collaboration uses the Turso/libSQL adapter and private persistent artifact storage, configured once by the project owner. The folder is ignored by Git by default, with optional tracking of non-secret configuration and sanitized JSON exports.

The proposed setup command is `npx revisionlab init`; this is a specification for the intended installer, not a currently available installation instruction.

See [PRODUCT.md](PRODUCT.md) for the product experience and [PLAN.md](PLAN.md) for the implementation plan. The current repository uses Next.js, React, TypeScript, and Chakra UI; the installer and embedded integration are planned work.
