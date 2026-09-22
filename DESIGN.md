---
name: RevisionLab
description: A quiet, project-local workspace for captured journeys and contextual feedback.
colors:
  action-blue: "#2563eb"
  link-blue: "#173da6"
  selection-blue: "#eff6ff"
  badge-blue: "#dbeafe"
  tool-navy: "#0c142e"
  identity-blue: "#1E9ADC"
  logo-surface: "#F4F4F4"
  paper: "#FFFFFF"
  canvas: "#fafafa"
  subtle-gray: "#f4f4f5"
  divider: "#e4e4e7"
  boundary: "#d4d4d8"
  secondary-text: "#52525b"
  ink: "#18181b"
  success: "#116932"
  success-surface: "#dcfce7"
  recording: "#92310a"
  recording-surface: "#ffedd5"
  error: "#991919"
typography:
  display:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: "2.75rem"
    letterSpacing: "-0.025em"
  headline:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.875rem"
  body:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  metadata:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.6
  route:
    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "0.25rem"
  lg: "0.5rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "7": "1.75rem"
  "8": "2rem"
  "10": "2.5rem"
  "12": "3rem"
  "16": "4rem"
  "20": "5rem"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "2.5rem"
  button-outline:
    textColor: "{colors.link-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "2.5rem"
  button-ghost:
    textColor: "{colors.link-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "2.5rem"
  button-plain:
    textColor: "{colors.secondary-text}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "2.5rem"
  input:
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 0.75rem"
    height: "2.5rem"
  navigation:
    backgroundColor: "{colors.tool-navy}"
    textColor: "{colors.paper}"
  badge-persona:
    backgroundColor: "{colors.badge-blue}"
    textColor: "{colors.link-blue}"
    rounded: "{rounded.sm}"
    padding: "0 0.375rem"
    height: "1.25rem"
  access-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "1.25rem"
  flow-selected:
    backgroundColor: "{colors.selection-blue}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "1rem 0.75rem"
---

# Design System: RevisionLab

## Overview

**Creative North Star: "White paper, navy tools"**

RevisionLab places captured prototype screens on quiet paper surfaces, framed by dark tools and restrained blue interactions. The inherited visual world is practical and compact: readable context, clear selection, and feedback kept close to its screen. The supplied blue RevisionLab mark establishes the identity; red remains reserved for functional error states.

The embedded review UI has one light appearance, independent of the host application's color mode. Its Chakra reset and tokens are scoped to `data-revisionlab-ui`, including portalled overlays, so installing the review tools does not restyle the prototype.

**Key Characteristics:**

- White panels and a pale canvas separated by thin boundaries.
- Navy navigation, blue actions and selections, and the supplied blue identity mark.
- Compact system typography with explicit persona, version, and status labels.
- Captured screens provide the imagery; interface decoration stays secondary.

This is an implementation snapshot dated 22 September 2026. Sources are `packages/revisionlab/src/components/`, `packages/revisionlab/assets/revisionlab-logo.svg`, `src/components/PrototypeHome/`, the design contract in `src/app/layout.tsx`, and installed Chakra UI 3.37.0 tokens and recipes. Desktop and mobile reference captures are under `output/playwright/`. The frontmatter records resolved UI token values and original logo asset colors for documentation; application component styling must continue using Chakra token names and inline style props. The native SVG preserves its supplied colors rather than introducing theme extensions. The logo/favicon replacement is locally verified across its three placements at 1440px and 390px viewport widths, with original image proportions and no horizontal overflow. Build, lint, all 66 existing package tests, favicon delivery/decoding, and packaged-asset checks pass; a fresh separate-host installation and cross-browser checks were not repeated. See `VALIDATION.md` for evidence. `PRODUCT.md` remains authoritative for product intent and distinguishes this release from the roadmap.

## Colors

Cool blue tools and neutral paper surfaces carry most of the interface. Functional status palettes add meaning in small areas.

### Primary

| Document token | Chakra source | Implemented use |
| --- | --- | --- |
| `action-blue` | `blue.600` / light `blue.solid` | Primary actions, selected version, selected-screen boundary |
| `link-blue` | `blue.700` / light `blue.fg` | Links, blue icons, persona text, outline and ghost controls |
| `selection-blue` | `blue.50` | Selected flow and screen surfaces |
| `badge-blue` | light `blue.subtle` → `blue.100` | Persona badges and blue recipe hover surfaces |
| `tool-navy` | `blue.950` | Workspace navigation |

### Secondary

`identity-blue` and `logo-surface` document the supplied SVG's exact `#1E9ADC` artwork and `#F4F4F4` rounded background, with a white outer rectangle. They are asset colors, not new Chakra theme tokens or replacements for the interaction palette. `success` / `success-surface` use the light green palette for recorded and resolved states. `recording` / `recording-surface` use the light orange palette for recording in progress. `error` comes from `red.700` for failure messages; error alerts retain Chakra's own red recipe.

### Neutral

`paper` is `white`; `canvas` is `gray.50`. `subtle-gray` is `gray.100`, used by neutral badges. `divider` is `gray.200` for section separation; `boundary` is `gray.300` for captures and the comment field. `ink` is `gray.900`, also used by the example and access headers. `secondary-text` is `gray.600` for explanatory copy, routes, and timestamps.

Navy navigation uses white text, `gray.300` supporting text, and `whiteAlpha.200` for active surfaces and count badges. Its hover uses `whiteAlpha.300`. Preserve text labels and pressed/current semantics alongside color.

**The Host Boundary Rule.** Keep review colors and resets inside the embedded UI; the host prototype owns its own visual system.

## Logo and Favicon

`packages/revisionlab/assets/revisionlab-logo.svg` is the canonical user-supplied artwork. The shared Chakra `RevisionLabLogo` displays it at 32 CSS pixels high with its original 222:227 proportions on the example homepage, workspace navigation, and email-access header. Keep the adjacent RevisionLab wordmark; the image is decorative in those compositions to avoid duplicate accessible names. Do not recreate the old red letter-R tile, crop the new mark, recolor its paths, or stretch it square.

The package ships the native asset and resolves it through the client bundle independently of host-public directories. The example favicon is generated from the same SVG at 16, 32, 48, 64, and 256 pixels by `scripts/generate-favicon.mjs`, preserving the artwork within each square icon. The installer does not overwrite another project's favicon or branding. The widget's Review and recording icons remain functional task glyphs, not replacement logo placements. Other interface colors, typography, spacing, and controls retain their existing treatment.

## Typography

Heading and body families use Chakra's Inter-first system stack. This project does not load an Inter font asset, so the platform fallback is expected when Inter is unavailable. Routes and command examples use the mono stack. Do not assume a bundled custom typeface.

- **Display:** the example home heading uses `3xl` on small screens (1.875rem / 2.375rem) and the frontmatter display role from `md` onward.
- **Headline:** the access title and workspace empty state use `2xl`, semibold, with tight tracking on the access title.
- **Title:** flow titles use `xl`; captured-screen titles use `lg` (1.125rem / 1.75rem); compact section headings use `md` (1rem / 1.5rem). All inherit the heading recipe's semibold weight.
- **Body:** the package provider establishes `sm` text with a 1.6 line height. Controls use their recipe text styles; the example home's introduction uses `lg`.
- **Label and metadata:** field labels and medium controls use `sm`; timestamps, routes, helper context, and badges use `xs`. Badge line height is 1rem, distinct from free-flowing metadata.

Headings, flow names, routes, and comment bodies wrap where needed. The horizontal screen picker truncates long screen names while the selected screen's full title remains visible below.

## Layout

The workspace occupies at least the viewport height and uses adjacent functional regions. At `lg` (1024px), the navigation becomes a 15rem vertical rail. Below that breakpoint it becomes a full-width top region with wrapping navigation controls; secondary project and account details in the rail are hidden.

At `xl` (1280px), the flow list is a 16rem column and the selected screen sits beside its feedback panel. Feedback is 20rem wide, increasing to 24rem at `2xl` (1536px), to leave readable line lengths inside comment cards. Below `xl`, these regions stack in document order: navigation, project toolbar, flows, flow details and versions, screen picker, capture, feedback. The flow list has a 15rem maximum scrolling height on this stacked layout. The screen picker scrolls horizontally rather than compressing its controls.

Panels commonly use spacing `4`–`6`; tightly related controls use `2`–`3`. Main workspace padding increases from `4` to `6` at `md` (768px). Toolbars and metadata wrap, and flex content uses zero minimum width so long text cannot force the workspace wider than the viewport.

The access form has a centered 28rem maximum width with `5` horizontal page padding. Its white card increases from `5` to `7` padding at `md`. The example home uses a 6xl maximum width and changes from stacked to two columns at `lg`.

Current layout observations, not new requirements: on mobile the capture follows navigation and flow context, so it begins below the first viewport; version controls retain the compact `xs` button size. Future density changes should be evaluated against the actual review task.

## Elevation & Depth

Workspace panels and captures use flat white/pale surfaces and one-pixel separators. The floating Review launcher and centered dialog use Chakra's light `lg` shadow; the small recording control uses `md`. Shadow values are recorded in the sidecar from the installed semantic tokens. The dialog backdrop uses `blackAlpha.500`.

Motion comes from Chakra recipes rather than a separate project animation system. Buttons inherit the `moderate` transition duration. The dialog inherits its scale/fade preset, with content opening at `moderate` and closing at `faster`; backdrop timings are `slow` / `moderate`. No bespoke motion tokens are established. Preserve keyboard focus and reduced-motion support when extending interactions.

## Shapes

Controls and badges use Chakra's `l2` radius, which resolves to `sm`, not `md`. Capture frames and the R mark use `lg`; access/example cards and the launcher dialog use `xl`. The floating Review button alone uses a full pill. Borders describe region boundaries, input edges, and selected captures rather than outlining every text group.

## Components

### Buttons and links

Primary blue solid buttons initiate recording, send comments, or advance access. Outline buttons hold secondary actions such as report export and finishing recording; ghost buttons support refresh, version switching, and thread actions. The access form also uses a plain muted-text button to change email. Links retain link semantics for navigation.

Recipe sizes are `xs` (2rem high), `sm` (2.25rem), `md` (2.5rem), and `lg` (2.75rem). Most workspace actions use `sm`; version selectors and resolve/reopen actions use `xs`. Primary hover uses the solid color at 90% opacity; outline and ghost controls use the palette's subtle surface. Buttons preserve Chakra's visible outer focus ring and disabled opacity. Loading controls show progress and block duplicate actions.

### Inputs and feedback

Use Chakra `Field` associations with outline `Input` or `Textarea`. Default inputs are `md`; flow search uses `sm`. The comment textarea has a `24` minimum height, white background, and stronger neutral boundary. The email-code field is taller (`12`) with wider tracking, numeric input, and an automatic focus move after requesting a code.

Feedback uses individual outlined Chakra cards with white surfaces, `gray.300` boundaries, `xl` corners, and `4` spacing between root comments. Author names and timestamps sit together in the header; the full message uses `md` text with a `tall` line height. Available actions sit in a separate pale footer, omitted when empty. Replies are full-width sibling cards under a reply-count heading, without nested indentation. Resolved items gain a green badge. Editors and owners receive resolve/reopen controls. Submission has loading, saved-status, and error messages; the UI confirms a save after the request succeeds. The all-comments selector currently identifies groups by screen title or route; richer flow/persona/version labels are an unimplemented refinement.

Pinned screen comments also appear as speech-balloon previews by default: white `xl` surfaces, `gray.400` boundaries, numbered author headers, and up to three lines of message text. Preview boxes are 256×128 CSS pixels (narrowing to the image width when needed); they stay readable as the capture zooms. Tails and blue connectors preserve the exact saved pin association when collision handling shifts a preview. Dense layouts extend the scrollable canvas rather than overlapping cards. Hide/show clears previews only. Selecting a preview or pin opens the full shared thread in a portalled Chakra Popover with an arrow, a close control, and an internally scrolling body. Narrow viewports use above/below placement and a 40dvh height limit; closing and reopening the same discussion retains its unsent reply. Screenshot load failures retain the sidebar thread.

### Navigation and recorded flows

The dark rail exposes Flows, Comments, and owner-only Review access. It shows count badges and an active translucent surface with `aria-current`. Flow rows are real multiline buttons with name, persona, latest version, and screen count. Selection uses the pale blue surface and `aria-pressed`. Filtering searches flow names and personas, with distinct empty-workspace and no-match messages.

The full-flow whiteboard uses a local translated/scaled camera. An unmodified mouse wheel over the canvas or a screen zooms the whole graph around the pointer. Background dragging, arrow keys, and Shift+wheel pan; explicit zoom, Reset 100%, and Fit remain available. Normal zoom is 10%–300%, with smaller Fit scales for large flows. Camera navigation does not modify screen positions or mark the board as edited. The existing pale canvas, screen cards, connectors, and Chakra toolbar retain their appearance.

**Paths** activates an explicit editing state rather than opening a connection form. In that mode, screen headers reveal Connect, Remove, and keyboard-capable movement controls; the toolbar exposes Auto-arrange and Undo. Connect selects a source and then a destination directly on the board. Structural edits autosave after a short pause or completed drag, with a quiet live status below the toolbar. Done editing waits for saving; failures retain the board and show Retry autosave. Conflicts offer explicit Load saved board recovery. Undo remains available after successful saves and reverses one grouped board operation; it does not undo comments or recordings.

Each connection has a selectable discussion label and a wider pointer target along its arrow. Selection opens a contextual panel beside the canvas on wide screens and below it on narrow screens, with focus moved to its heading. Editors can change labels and remove connections; all reviewers can discuss saved connections using the existing comment-card presentation. A new path explains that autosave must finish before comments can be posted. Pending/error states retain the draft. Removed paths keep their named discussions in All comments, including replies and resolution.

Screen removal uses a confirmation stating the number of affected paths, automatic saving, Undo recovery, and that captures/history/comments are retained. Undo restores that screen and its original paths together. Removed screens also appear as Restore actions in editing mode; this separate action restores the screen only, without silently recreating paths. Decision and URL-addition tools are not shown as functioning controls while their product choices remain unresolved.

### Badges and captured screens

Badges are small, softly rectangular, medium-weight labels with tabular numbers. Persona is blue, version/count metadata is gray, recorded/resolved is green, and recording is orange. Status always includes words.

The screen picker combines a numbered badge and title. Its selected item uses pale blue fill and an action-blue boundary. The main capture preserves the image's natural aspect ratio at full available width within a rounded frame; a separate full-size link supports detailed inspection. Title, route, capture time, persona, and version provide context. Missing captures receive a named empty state rather than a fabricated screen.

### Widget, dialog, and access card

The Review pill sits `6` from the bottom and right, opens a centered small Chakra dialog, and changes to a recording count while recording. The dialog exposes Comment and permission-dependent Record tools, current project/page context, identity, and a workspace link. An active recording exposes a compact white control card above the launcher, with capture count, Capture screen, a primary Stop recording action, and a separate outlined Discard action. Stop and Discard also remain available in the dialog footer across tabs. The ordinary widget is absent on review routes, but an active recording's controls and departure guard remain mounted.

The departure warning uses a centered Chakra alert dialog above the floating controls, with a stacked title and explanation, focus initially on Stay, and vertically arranged actions. It explains that Discard removes the current unfinished recording while keeping saved versions. Eligible prototype links also offer Continue recording on next page, disabled while a capture finishes. Discard waits for pending capture and confirmed server cleanup before navigation; errors remain in the warning with a retry. Pending-save and pending-discard states explain that recording is stopped rather than suggesting capture continues. Browser-native reload/close prompts retain browser-owned appearance and wording.

The access card keeps one short form stage visible at a time: name/email, then a six-digit code. Error alerts, resend, and change-email actions remain in that card. Local development codes are explicitly labeled. This pattern is an access flow, not a general account dashboard.

## Do's and Don'ts

### Do:

- Do compose UI with Chakra v3 primitives, recipes, semantic elements, and inline token-aware style props.
- Do preserve the light scoped provider, including the scope on portalled overlays.
- Do keep screen, persona, version, and feedback context readable through responsive wrapping and clear labels.
- Do retain visible focus, field associations, named controls, and explicit loading, empty, success, and error states.

### Don't:

- Don't apply the review system's reset, colors, or typography to host prototype content.
- Don't replace captured screens with decorative imagery or imply that roadmap controls are implemented.
- Don't introduce component CSS classes, custom properties, raw color literals, or an additional styling library into application components.
- Don't treat the sidecar's static HTML/CSS previews as production component implementations.
