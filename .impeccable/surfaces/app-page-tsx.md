---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/layout.tsx","app/globals.css","components/app-shell.tsx","components/views/dashboard-view.tsx","components/views/preview-view.tsx"]
---

# RevisionLab application shell

## Scope and mode

- Primary target: `app/page.tsx`
- Related targets: authenticated dashboard, prototype overview, responsive preview and recorder, saved flows, history, comparison, access, and account states.
- Visitor mode: Operate.

## Audience, job, and task

Designers, prototypers, developers, managers, and invited reviewers need to find a private prototype, inspect its state, open it at a real responsive width, record or review a semantic journey, and revisit version evidence without learning Git.

The main action is opening the selected prototype. Secondary tasks are recording a flow, reviewing replay health, comparing versions, exporting a flow, and managing access.

## Content and constraints

- Use deterministic fictional demonstration data and label it as local demo data where ambiguity is possible.
- Keep privacy, role, version, replay, autosave, and integration status explicit.
- Preserve the selected test viewport when the browser narrows.
- Meet WCAG 2.2 AA for the shell and keep every core task keyboard operable.
- Use standard Chakra UI only; do not use GOV.UK Chakra.

## Chosen direction

Signal Desk / Traffic Table. The approved comp is `.impeccable/mocks/traffic-table.png`. Prototype rows behave as inspectable operational routes: screens, flows, replay, version, membership, and privacy align as stations on one route. One route unfolds into its real journey map and activity. The persistent health strip closes the desktop frame.

Memorable moment: expanding Checkout service turns a compact route row into a connected screen journey without navigating away or changing visual language.

## Approved comp inventory

| Region | Commitment | Medium |
| --- | --- | --- |
| Navigation | 208-224 px matte dark rail; icon-plus-label items; active orange edge; secure-session block at the foot | Semantic Chakra layout + Lucide icons |
| Utility header | Compact global search, notification, and profile controls; low-height ruled strip | Semantic Chakra controls |
| Title/action | Strong compact title; brief support line; one orange primary action at upper right | Semantic HTML + Chakra Button |
| Catalogue header | One quiet ruled header aligned with the operational stations | CSS grid |
| Prototype route | Broad horizontal band; circular station nodes joined by 2 px orange rail; labels beneath; privacy at end | Semantic HTML + inline SVG/CSS route geometry |
| Expanded journey | Three main screen thumbnails and a small branch, joined by an orange connector; roughly half of expanded region | Accessible SVG diagram + semantic text alternative |
| Recent activity | Compact ruled timeline occupying the other half of the expanded region | Semantic list + CSS line and nodes |
| Additional rows | Dense repeated routes with restrained hover/selection feedback | Reusable React component |
| Health strip | Persistent desktop status line with explicit healthy labels and last-check time | Semantic status region |
| Primary action | Solid safety-orange rectangle with restrained corner radius, icon, and visible focus state | Chakra Button |
| Type | Compressed display silhouette for page title; readable humanist interface face; tabular numerals | Local/system CSS stacks; no raster text |
| Surfaces | Flat warm ivory field, pale construction rules, shallow selected-band tint, no gradients or glass | Chakra semantic tokens + CSS |

## Responsive translation

At tablet and mobile sizes the rail becomes a compact top bar and bottom navigation. Prototype bands become stacked route cards with the station track horizontally scrollable. Expanded flow and recent activity stack vertically. The preview workspace keeps its chosen emulated width and uses page scrolling or a drawer for controls rather than silently resizing the prototype.

## Unresolved decisions

Production Supabase credentials, invitation email provider, private-storage configuration, capture/replay workers, and editable third-party board integrations are not configured in this front-end delivery.
