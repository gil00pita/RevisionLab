---
name: RevisionLab
description: A private signal desk for inspecting, recording, and reviewing responsive prototype routes.
colors:
  paper: "#f7f6f1"
  paper-bright: "#fdfcf8"
  paper-deep: "#eeeee8"
  rail: "#20272b"
  rail-raised: "#2a3338"
  rail-muted: "#aeb9bd"
  ink: "#142029"
  ink-soft: "#34434c"
  muted: "#65727a"
  line: "#cfd6d5"
  line-strong: "#aab5b6"
  orange: "#f25522"
  orange-dark: "#c83c0c"
  orange-deep: "#a92e05"
  orange-soft: "#fff0e8"
  health: "#94d248"
  healthy-ink: "#2d6817"
  healthy-soft: "#edf8e7"
  warning: "#e8a326"
  warning-ink: "#81500b"
  warning-soft: "#fff5dc"
  cyan-soft: "#e6f1f2"
  danger: "#b73527"
  focus: "#1474e5"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "clamp(2rem, 3vw, 2.75rem)"
    fontWeight: 760
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "20px"
    fontWeight: 720
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Figtree Variable, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  action:
    fontFamily: "Figtree Variable, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  label:
    fontFamily: "Figtree Variable, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 780
    lineHeight: 1
    letterSpacing: "0.045em"
  data:
    fontFamily: "Figtree Variable, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
rounded:
  micro: "1px"
  keycap: "4px"
  small: "6px"
  control: "7px"
  panel: "9px"
  board: "10px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "30px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.orange-dark}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.orange-deep}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.paper-bright}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
  input-default:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.small}"
    padding: "0 10px"
    height: "41px"
  search-field:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 38px 0 37px"
    height: "40px"
  chip-healthy:
    backgroundColor: "{colors.healthy-soft}"
    textColor: "{colors.healthy-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
    height: "28px"
  nav-active:
    backgroundColor: "{colors.rail-raised}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  route-board:
    backgroundColor: "{colors.paper-bright}"
    textColor: "{colors.ink}"
    rounded: "{rounded.board}"
    padding: "0"
---

# Design System: RevisionLab

## Overview

**Creative North Star: "Signal Desk / Traffic Table"**

RevisionLab behaves like a calm operations desk for prototype traffic. Warm ivory surfaces hold dense, inspectable information while a matte charcoal rail establishes the secure workspace perimeter. Safety orange connects screens and actions as a route, and chartreuse appears only where the system can assert health.

The system is compact, professional, and visibly constructed rather than decorative. Rows, stations, timelines, and inspectors make relationships legible without turning the interface into a generic card grid. The design rejects gradients, glass effects, ornamental illustration, and shadow-heavy dashboard tiles; hierarchy comes from alignment, tonal layers, rules, and type.

**Key Characteristics:**

- Warm ivory work surfaces inside a matte charcoal application frame.
- Dense ruled tables that unfold into connected journey maps.
- Safety-orange routes and actions, reserved chartreuse health signals, and explicit status text.
- Compressed Archivo display type paired with readable Figtree interface text.
- Compact rectangular controls, restrained corners, and visible blue keyboard focus.

## Colors

The palette combines warm paper neutrals with a dark control rail, a single safety-orange action signal, and semantic health and warning tones.

### Primary

- **Safety Orange:** The route and action signal; use it for connectors, nodes, active edges, recording beacons, and small attention marks.
- **Burnt Signal Orange:** The accessible foreground action color for primary buttons and text links.
- **Pale Signal Wash:** The low-intensity selected or accent background.

### Secondary

- **Chartreuse Health:** A rare operational-health beacon, always paired with text or an icon.
- **Healthy Forest:** The accessible text and control color for confirmed healthy states.
- **Amber Warning:** The attention state for stale targets and incomplete operational conditions.

### Tertiary

- **Cool Route Selection:** The shallow blue-green band used to reveal the currently expanded operational route.
- **Focus Blue:** A dedicated keyboard-focus color that remains independent from brand and status colors.

### Neutral

- **Warm Paper:** The main application field.
- **Bright Paper:** The clearest surface for tables, panels, toolbars, and the health strip.
- **Deep Paper:** Recessed inputs, quiet hovers, headers, and code-label backgrounds.
- **Matte Rail:** The navigation perimeter and strongest neutral control.
- **Raised Rail:** The active navigation surface.
- **Ink / Soft Ink / Muted:** A three-step text hierarchy for primary content, supporting controls, and metadata.
- **Construction Line / Strong Construction Line:** The ruled-divider and container-border system.

### Named Rules

**The Signal Rarity Rule.** Orange identifies the route or the immediate action; chartreuse certifies health. Neither becomes a broad decorative fill.

**The Status Has Words Rule.** Never communicate health, warning, privacy, or recording state by color alone; retain the visible label or icon-text pair.

## Typography

**Display Font:** Archivo Variable (with sans-serif fallback)  
**Body Font:** Figtree Variable (with Segoe UI and sans-serif fallbacks)  
**Label/Mono Font:** Figtree Variable for labels; the platform monospace stack for flow identifiers and JSON.

**Character:** Archivo gives page titles and the wordmark a compressed, decisive silhouette. Figtree keeps dense operational copy humane and highly readable; tabular numerals prevent versions, viewport sizes, and timestamps from shifting.

### Hierarchy

- **Display:** Heavy, compressed, tightly tracked type for one page-level heading only.
- **Headline:** Semibold Figtree for panel and journey titles; compact enough to sit above dense data.
- **Title:** Archivo for the wordmark and rare identity-level labels, never routine body headings.
- **Body:** Regular Figtree for explanations and form content, generally constrained to roughly 50–72 characters per line.
- **Action:** Bold Figtree for buttons, navigation items, and action links.
- **Label:** Dense uppercase Figtree for column names, station labels, inspector labels, and technical metadata.

### Named Rules

**The One Display Voice Rule.** Reserve compressed Archivo for identity and page-level emphasis; operational reading stays in Figtree.

**The Data Must Hold Still Rule.** Use tabular numerals for versions, timestamps, dimensions, counts, and ordered steps.

## Layout

Desktop uses a fixed 216px navigation rail beside a viewport-height workspace with a 64px utility header and 43px health strip. The main content sits in a fluid container capped at 1500px, with 30px horizontal breathing room. The signature catalogue is a three-column operational table: prototype identity, a six-station route with a 650px minimum track, and actions.

At 1240px expanded journeys stack above activity. At 1024px the side rail disappears in favour of a compact top menu, and multi-panel preview and flow workspaces collapse to one column. At 780px the catalogue becomes bordered route cards, the station track scrolls horizontally, primary page actions become full width, and a four-item bottom navigation plus fixed health strip reserves the bottom 105px. At 520px secondary action groups wrap into practical tap-width rows.

Spacing follows a compact 4px-based rhythm, with 8–16px inside controls and rows, 18–24px inside panels, and 24–30px between major regions. Do not resolve dense route data by shrinking type; preserve the station rhythm and allow deliberate horizontal scrolling.

**The Route Before Card Rule.** When several facts describe one prototype or flow, align them on a shared route or ruled row before considering independent cards.

## Elevation & Depth

The system is flat by default. Paper tones, one-pixel construction lines, and the charcoal perimeter carry most depth; shadows are reserved for genuinely floating mobile menus, emulated prototype viewports, and screenshot evidence. Active navigation uses an inset orange edge rather than a drop shadow, while dots may use a surface-coloured halo for separation.

### Shadow Vocabulary

- **Active Edge:** An inset 1px orange edge marks selected navigation and flow-index items.
- **Evidence Lift:** A soft low shadow separates screen previews and comparison snapshots from their canvas.
- **Viewport Lift:** A wider ambient shadow identifies the live emulated prototype as a surface above the preview stage.
- **Floating Menu:** The strongest ambient shadow is reserved for the temporary mobile navigation menu.
- **Signal Halo:** Surface-coloured rings separate tiny notification, timeline, and health dots without implying elevation.

### Named Rules

**The Flat Operations Rule.** Resting application surfaces use tone and rules; shadows appear only when a surface floats, represents external visual evidence, or needs a tiny signal halo.

## Shapes

Form language is restrained and mechanical. Most controls use gently rounded 6–7px corners, panels use 9px, and the main route board uses 10px. Pills are reserved for compact status labels and switches. Circular forms belong to route stations, avatars, status dots, and health beacons; screen thumbnails remain rectangular with only their top chrome corners softened.

Borders are functional construction marks, normally one pixel in the line neutrals. Orange connectors are two pixels and terminate in outlined circular stations. Dashed borders identify branches, missing evidence, or intentionally empty states—not ordinary containers.

**The Circle Means Signal Rule.** Use circles for stations, people, and live state; do not round every container into a soft tile.

## Components

### Buttons

- **Shape:** Compact rectangular controls with a gently rounded 7px corner and a 40px minimum height.
- **Primary:** Burnt signal-orange fill with white bold text; use for the single most immediate task in a region.
- **Hover / Focus:** Darken the primary fill on hover, move pressed controls down by 1px, and retain the global 3px blue focus outline with 2px offset.
- **Secondary:** Bright-paper fill with a strong construction border; deepen the paper tone on hover.
- **Quiet / Icon:** Transparent at rest, deep-paper on hover, and always supplied with a meaningful accessible name when icon-only.

### Chips

- **Style:** Small pill with a 7px status dot, semibold compact text, and a tonal semantic background.
- **State:** Healthy, attention, neutral, and recording-accent variants pair color with explicit wording; only the live recording accent pulses.

### Cards / Containers

- **Corner Style:** 9px for panels and 10px for the main route board.
- **Background:** Bright paper over the warm-paper field; deep paper for recessed headers and controls; cool route selection for the expanded row.
- **Shadow Strategy:** Flat at rest, following the Flat Operations Rule.
- **Border:** One-pixel construction lines divide regions and make container edges explicit.
- **Internal Padding:** Usually 18–24px, tightened in high-density rows.

### Inputs / Fields

- **Style:** White form fields use a 6px corner and strong construction border; global search uses a recessed deep-paper field with a 7px corner and embedded search/keycap affordances.
- **Focus:** Restore a bright surface and strong border where appropriate, plus the global 3px blue outline with 2px offset.
- **Error / Disabled:** Errors use danger text on a pale red field and direct focus to the invalid input. Disabled controls retain their form at 48% opacity and use a not-allowed cursor.

### Navigation

The desktop rail uses icon-plus-label items with muted rail text, a raised charcoal hover/active surface, and an inset orange active edge. Below 1024px, navigation moves to a compact top menu; below 780px, four core destinations occupy a fixed bottom bar with a pale orange selected cell. Labels remain visible at every size.

### Operational Route Row

The signature row aligns six circular stations—screens, flows, replay, version, members, and access—on one orange track. Expanding a row changes its summary to the cool route-selection tone and unfolds the recorded journey plus recent activity in place. On narrow screens the identity and actions stay above a horizontally scrollable route; the route is never replaced by disconnected metric cards.

### Health Strip

A ruled, persistent footer closes the application frame. It pairs a chartreuse beacon with explicit system-health wording and progressively hides secondary details on smaller screens while keeping the primary status visible.

## Do's and Don'ts

### Do:

- **Do** align related prototype facts as stations on one continuous route.
- **Do** use warm paper layers and one-pixel rules as the default hierarchy mechanism.
- **Do** keep primary actions singular, compact, and safety-orange.
- **Do** pair every semantic color with text or an icon-text label.
- **Do** preserve visible blue keyboard focus and reduced-motion behaviour.
- **Do** keep the selected emulated viewport width stable and allow its shell to scroll around it.

### Don't:

- **Don't** replace the traffic table with a generic grid of rounded statistic cards.
- **Don't** use gradients, glass effects, ornamental illustration, or decorative shadow stacks.
- **Don't** spread orange or chartreuse across large surfaces; their scarcity communicates meaning.
- **Don't** hide operational metadata merely to avoid horizontal scrolling on small screens.
- **Don't** use circular geometry for ordinary panels or rectangular geometry for route stations.
- **Don't** represent privacy, replay health, warning, or recording state with color alone.
