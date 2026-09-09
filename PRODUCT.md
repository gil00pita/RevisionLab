# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Confirmed: React with Chakra UI. The product specification names Next.js App Router, TypeScript, Supabase, Storybook, Playwright, GitHub Actions, and Vercel. For this greenfield implementation, the application shell will use Next.js, TypeScript, and Chakra UI with representative local data; hosted authentication, storage, database, replay, and third-party publication remain integration boundaries.

## Users

Primary users are designers, prototypers, and developers maintaining responsive code-based prototypes. They need to preview real responsive behaviour, record meaningful journeys, preserve visual revisions, and share review access without requiring collaborators to use Git.

Managers maintain flows, version notes, viewer access, exports, and optional board publication. Viewers inspect prototypes, published flows, and permitted versions. Outsiders must not discover private product data.

## Product Purpose

RevisionLab is a secure workspace where prototype implementation, responsive testing, interaction journeys, review access, and visual history meet. Success means a team can test a real prototype at standard viewports, record a semantic journey once, revisit meaningful revisions, and export an accurate documented flow without recreating it manually.

## Positioning

RevisionLab uses one portable, semantic flow definition across recording, editing, replay, annotated screenshots, history, and export. It joins the realism of web code to the review and flow-documentation affordances of visual design tools.

## Operating Context

Users work with code-defined screens, stable `data-flow-id` targets, Git revisions, responsive viewport presets, protected snapshots, and JSON or YAML flow definitions. Review and publication may involve Vercel, Supabase, Storybook, Playwright, GitHub, Miro, Mural, Excalidraw, Drawio, and Confluence.

## Capabilities and Constraints

- Private-by-default prototype catalogue with owner, manager, and viewer permissions.
- Responsive live preview at 375 px, 768 px, 1280 px, and validated custom widths.
- Semantic flow recording, autosaved drafts, ordered steps, diagrams, revisions, and replay health.
- Immutable prototype versions with screenshots, notes, authorship, Git context, and visual comparison.
- Portable JSON, YAML, SVG, PNG, and PDF output plus optional editable board publication.
- Authorization is enforced at route, server, database, and asset layers; UI visibility is not a security boundary.
- Recording never stores passwords, form values, tokens, cookies, network payloads, or clipboard data.
- This first implementation is inferred to be a connected front-end MVP shell using deterministic local demo data. Production Supabase, private storage, email delivery, automated capture/replay, and third-party publishing are not inferred as configured services.

## Brand Commitments

The confirmed product name is RevisionLab. The specification requires a focused professional tool with strong hierarchy, calm neutral surfaces, compact familiar controls, clear version and access status, visible focus states, limited decoration, consistent typography and spacing, and semantic colour tokens.

## Evidence on Hand

The authoritative implementation brief is `REVISIONLAB_PRODUCT_SPEC.md`. It includes users, goals, terminology, routes, MVP requirements, interaction flows, data and security models, UX and responsive requirements, acceptance criteria, and an example portable flow schema. No existing logo, production data, customer proof, screenshots, or visual identity assets are present; future work must not fabricate them.

## Product Principles

- Private by default, with authorization at every layer.
- Prefer real responsive interaction over screenshot simulation.
- Record semantic intent, not fragile coordinates or sensitive values.
- Use one flow definition across authoring, replay, review, and export.
- Keep history visible and output portable, while remaining useful without integrations.

## Accessibility & Inclusion

Target WCAG 2.2 AA for the RevisionLab shell. Provide complete keyboard access, logical focus order and restoration, visible focus indicators, correct accessible names and live announcements, sufficient contrast, non-colour status cues, reduced-motion support, graph and comparison descriptions, accessible form errors, and practical pointer targets.
