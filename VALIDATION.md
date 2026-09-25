# Release validation

## Recorded state graph and click evidence - 25 September 2026

Automatic captures now reuse an identical PNG on the same pathname within a version, keeping changed states separate. Visits are stored independently of screen positions, and recorded connections follow observed transitions. A -> B -> C -> A -> E has four nodes and four paths, including the return and both outgoing A branches. Nonconsecutive paths occupy separate lanes below the screens. Selecting a connection shows source click evidence; repeated traversals have a visit selector, and keyboard activation is identified as an element center. A body-relative fallback fixes ambiguous generated selectors for controls without stable IDs. Existing recordings and manual captures are not retroactively merged. PRODUCT.md, PLAN.md, and the READMEs are aligned.

Production/package builds, lint, all 146 package tests, formatting, and whitespace checks pass. Five new server tests cover reuse, changed images/routes/versions, visit order, evidence association and validation, comments on return paths, removed-edge preservation, permissions, completed versions, discard, and the 1000-visit limit with transactional rollback. Migration coverage verifies historical capture keys remain null and no click evidence is invented. The new geometry test checks distinct branch/return lanes inside fitted bounds.

Local Chrome verification in `.context/recording-graph-check.cjs` uses the real handler with an isolated database and artifact directory under `.context/`, not the user's workspace data. It covers A-B-C-A-E, four unique images, correct source labels/bounds/points, open/closed modal state reuse, repeated pointer/keyboard visits, the visit selector, full-document navigation, and desktop/mobile connection review. Screenshots were inspected at `.context/recording-branch-desktop.png` and `.context/recording-branch-mobile.png`. The interaction-snapshot regression also verifies disappearing dialogs, private-region redaction, unchanged-click suppression, pointer-down/keyboard/touch evidence, exactly-once host actions, and Stop waiting for pending capture. The live-comment highlight/visibility regression passes after the selector change. There were no unexpected browser errors or failed API requests; real saved recordings, comments, and settings were not changed.

Matching is deliberately exact and version-local, not fuzzy visual comparison. Dynamic pixels or viewport changes may create another state. Navigation before an uncaptured source state can be saved may omit its click evidence rather than place it on the wrong screenshot. Screens retain their original cursor layer; per-traversal click details live on connections. Existing recordings without visit data retain their sequential paths and show unavailable click evidence. Cross-browser, hosted databases/storage, and fresh external-host installation were not re-tested; no publication or deployment was performed.

## Supplied accessibility passed icon - 25 September 2026

The passed-check toolbar state now uses the supplied accessibility-person SVG with its green check badge, preserving the original artwork and existing 28px rendered icon size. The supplied warning SVG and all other states remain unchanged. The passed artwork is shown only after the existing successful current-page scan criteria are met; this remains automated evidence, not accessibility certification. PRODUCT.md and PLAN.md are aligned.

Production/package builds, lint, SVG XML validation, and whitespace checks pass. The updated `.context/accessibility-icon-check.cjs` verifies both assets load, the pass-to-issue-to-pass transition, unchanged toolbar bounds, desktop/mobile rendering, and results-panel/Escape behavior. Screenshots were inspected at `.context/accessibility-passed-icon-desktop.png` and `.context/accessibility-passed-icon-mobile.png`. No mutation requests or browser errors occurred; no publication or deployment was performed.

## Supplied accessibility warning icon - 25 September 2026

The widget's issues-found state now renders the supplied SVG asset unchanged through Chakra Image. Other status icons, on-element problem bubbles, accessible status names, and toolbar dimensions are retained. The package includes the asset through its existing assets distribution pattern. PRODUCT.md and PLAN.md reflect the requested visual change.

Production/package builds, lint, and whitespace checks pass. `.context/accessibility-icon-check.cjs` verifies a genuine browser-only axe issue displays the loaded 24px-source SVG at the existing 28px icon size without changing toolbar bounds, the results panel and Escape still work, and clearing the issue restores the pass icon. Desktop/mobile screenshots were inspected at `.context/accessibility-issues-icon-desktop.png` and `.context/accessibility-issues-icon-mobile.png`. No mutation requests or browser errors occurred. No publication or deployment was performed.

## Accessibility issue inspection - 25 September 2026

Current widget findings now show problem bubbles tied to axe's exact local element references. Rule titles, individual target entries, and bubbles select and scroll to the affected component without activating its host control. A non-interactive highlight tracks the visible component bounds, including clipping in scroll containers. Compact details avoid bottom-of-page targets and expose separate rule-specific Read more links. Close/Escape removes the inspection layer; stale scans and unavailable/private/removed targets clear their overlays. No persistence, service, dependency, or publication change is involved.

Package and production builds, lint, all 140 existing package tests, and whitespace checks pass. Local Chrome checks in `.context/accessibility-inspection-check.cjs` cover genuine axe findings on browser-only fixtures, multiple affected nodes, title and individual target selection, pointer/keyboard bubble activation, nested scrolling, documentation URLs/new-tab attributes, focus return, close/Escape, stable scan status during inspection, rerun, private/removed-target cleanup, route cleanup, reduced motion, and non-overlapping desktop/390px/320px layouts. The existing `.context/comment-highlight-check.cjs` regression also passes. No host fixture clicks, mutation requests, or browser errors occurred; real workspace data was not changed.

Screenshots were inspected: `.context/accessibility-inspection-desktop.png`, `.context/accessibility-inspection-mobile.png`, and `.context/accessibility-inspection-page.png`. The last uses a temporary invalid ARIA attribute on the sample heading solely to demonstrate a real reported issue; it does not change the application source. Cross-browser, cross-origin frame, and hosted checks were not repeated. Element references unavailable to the current document remain non-selectable rather than resolving guessed selectors. Automated checks remain partial accessibility evidence, not certification.

## Updated installation guide - 25 September 2026

The `/setup` page now leads with `npx revisionlab@latest init`, explains exact-version installation and safe re-initialization, lists the supported installer flags and runtime/framework boundaries, and uses the workspace manifest version for local archive examples. The published package is distinguished from newer local widget/persona/capture/comment settings. Existing private-review copy and its saved heading anchor were retained. PRODUCT.md, PLAN.md, and both READMEs are aligned with the observed publication status.

Read-only npm registry inspection confirmed `revisionlab@0.1.1` under `latest`, with no `next` tag. Its archive was downloaded with scripts disabled into `.context/` and inspected: the published CLI resolves its own exact version, but the newer local widget/settings modules are absent. No publication, dependency installation, deployment, or external service configuration was performed. This check does not establish registry ownership or trusted-publisher configuration.

Production build, lint, whitespace checks, and five package-spec tests pass. Local Chrome checks in `.context/setup-guide-check.cjs` cover latest/pinned commands, every documented flag, the manifest-version tarball path and shell continuation, release/local distinctions, preserved heading-anchor structure, desktop/390px/320px command fit, and return navigation. Desktop/mobile screenshots were inspected: `.context/setup-guide-desktop.png` and `.context/setup-guide-mobile.png`. No mutation requests or browser errors occurred. A fresh target-project installation and cross-browser checks were not repeated for this documentation change.

## Workspace live-comment settings - 25 September 2026

Settings now persists shared default marker visibility and one of ten named bubble colors. Owners/editors can edit; commenters can read. New/legacy databases default to visible blue markers, and partial transactional updates preserve the other preference. The widget uses saved defaults on page load/navigation while retaining explicit same-page visibility overrides. Color applies to saved live markers and their selected-component highlight; details remain click/keyboard-only.

Production build, lint, whitespace checks, and all 140 package tests pass. Four new server tests cover fresh defaults, persistence across connections, every palette value, invalid input, role and origin enforcement, concurrent partial updates, and preserving recordings/comments. The legacy migration test also checks defaults without changing old review data.

Local Chrome checks in `.context/workspace-settings-check.cjs` pass for Settings navigation, all ten swatches, keyboard focus after save, visibility/color reload, injected save failure and retry with selection rollback, commenter read-only controls, desktop/390px/320px fit, un-clipped mobile navigation, widget defaults/color/highlight, local overrides, Escape, and route reset. Swatch text/icon contrast in the current light interface ranges from 4.60:1 to 14.32:1. Light swatches have darker boundaries. The live comment highlight/visibility regression in `.context/comment-highlight-check.cjs` also passes. Browser settings writes were intercepted and server tests used temporary databases; user comments, recordings, and saved preference values were untouched. No browser errors occurred; the injected HTTP 503 is expected.

Desktop/mobile screenshots were inspected: `.context/workspace-settings-desktop.png` and `.context/workspace-settings-mobile.png`. Cross-browser, physical-device, and hosted-database checks were not repeated. Earlier unconditional visible-default descriptions below are historical; the workspace preference now controls that default.

## Visible comment markers with click-only details - 25 September 2026

Saved live comment markers now appear by default without entering comment mode. Details and the component highlight remain closed until pointer/keyboard activation. Closing details keeps markers visible; toggling back on or dismissing the composer restores markers without opening a preview. Route changes/reload reset to visible markers with no selection. Existing same-page visibility and Escape behavior remain intact.

Production build, lint, formatting, and whitespace checks pass. The updated `.context/comment-highlight-check.cjs` verifies initial markers without details/highlights, pointer/keyboard activation, grouped comments, close/reopen, toggle and Escape behavior, composer cancellation, responsive alignment, hidden/private/offscreen targets, host navigation, and route/reload reset. Intercepted read responses supply test comments; no mutation requests or browser errors occurred. Screenshots: `.context/comment-markers-default-desktop.png` and `.context/comment-markers-default-mobile.png`. Earlier hidden-default and auto-open-first-preview checks below are historical and superseded. Package unit tests and cross-browser checks were not repeated for this state-only change.

## Selected live-comment highlight - 25 September 2026

The existing `.context/comment-visibility-check.cjs` regression also passes, including composer dismissal, Escape with visibility on/off, repeated Escape, Stop commenting, and route reset, with zero writes or browser errors.

The open live comment preview now highlights its resolved host component with a blue outline and subtle tint. It uses the marker's existing bounds tracking, does not alter host styles or intercept clicks, and is excluded from capture/accessibility inspection as RevisionLab UI. Closing or hiding the preview removes the highlight; Escape preserves it with visible comments.

Production build and lint pass. Local Chrome checks in `.context/comment-highlight-check.cjs` verify pointer/keyboard selection, grouped comments, close/reopen, visibility/Escape behavior, scroll/resize/layout alignment, hidden/private/offscreen targets, unchanged accessibility while selecting, and navigation through the highlighted host link. Desktop/mobile screenshots were inspected: `.context/comment-highlight-desktop.png` and `.context/comment-highlight-mobile.png`. Test comments were supplied through intercepted read responses; no mutation requests or browser errors occurred. Package unit tests and cross-browser/device checks were not repeated for this UI-only change.

## Widget logotype workspace link - 25 September 2026

The widget logotype now links directly to the configured workspace in the same tab, without opening the review dialog. It is a semantic link with keyboard and native new-tab behavior; camera, accessibility, and comment controls retain their existing actions.

Production build, package build, lint, and whitespace checks pass. Local Chrome checks in `.context/widget-workspace-link-check.cjs` cover pointer and Enter navigation, Meta-click opening a separate tab, no intermediate dialog, 320px viewport fit, camera setup, commenting, and recording continuity without a departure warning. No mutation requests or browser errors occurred; existing workspace data was untouched. Package unit tests and cross-browser checks were not repeated for this link-only change.

## Domain-only recording departure warnings - 25 September 2026

Internal links now pass through unchanged without the recording dialog. Exact hostname changes trigger the existing external-departure confirmation; subdomains are distinct. Known internal full-document links receive a one-use unload exemption, cleared after cancelled/SPA-handled clicks. The programmatic navigation helper follows the same rule. Explicit discard confirmation remains unchanged.

All 136 package tests, production build, and lint pass. Navigation tests cover hostname boundaries (including lookalike/userinfo URLs), same-host protocol/port changes, internal workspace/API links, and the helper's external fail-closed behavior without a mounted guard. Local Chrome checks in `.context/domain-navigation-check.cjs` pass for prompt-free Next.js/native navigation, recording continuity, cancelled-link unload protection, external warning/Stay, mobile fit, and the real native reload warning. Recording writes were intercepted and user recordings were untouched. Screenshot: `.context/external-recording-warning.png`.

Browser limits: close, reload, and unapproved full-document exits share `beforeunload`; display and wording are browser-controlled. The headless tab-close command did not display a native prompt, so validation confirms the active unload guard and real reload prompt rather than claiming physical close-tab UI coverage. Same-host scheme/port changes do not transfer origin-scoped session storage; arbitrary redirects and unguarded programmatic navigation are not universally intercepted. Hosted and cross-browser checks were not repeated. Earlier internal Continue-dialog checks below are historical and superseded.

## Duplicate flow-name confirmation - 25 September 2026

New recordings check the current name of each flow family inside the creation transaction, ignoring capitalization and surrounding whitespace. A conflict creates nothing until the reviewer confirms a specific version. Replacement creates the next version in that family, retaining all previous screenshots and comments. Active drafts block replacement; stale confirmations return the latest candidates for another review. Legacy duplicate families remain separate and can be selected explicitly.

Five new server tests cover matching without writes, replacement and discard preserving screenshots/comments, persona selection, active/stale/mismatched targets, commenter restrictions, concurrent starts/replacements, and legacy duplicates. All 135 package tests, production build, lint, and diff whitespace checks pass. Local Chrome checks in `.context/flow-replacement-check.cjs` cover keyboard focus on Cancel, preserved setup values, blocked active drafts, legacy selection, injected failure/retry, stale reconfirmation, explicit replacement target, unique-name start, and mobile positioning above the widget. Browser writes were intercepted, so existing workspace recordings were untouched; no browser errors occurred. Screenshots: `.context/flow-replacement-desktop.png` and `.context/flow-replacement-mobile.png`. Hosted and cross-browser checks were not repeated.

## Changed-interaction before/after capture - 25 September 2026

Recording now freezes a privacy-filtered pre-interaction document using pinned html2canvas-pro 2.4.5, without preventing or replaying host events. Once the host settles, unchanged clicks produce no uploads; changed clicks save the missing pre-state followed by the result. A pre-state already represented by the last successful capture is omitted. Rapid input is coalesced with bounded pre-state rendering. Initial/route captures and completed field changes retain their behavior.

Local Chrome checks in `.context/interaction-snapshot-check.cjs` pass with intercepted recording writes, leaving the real database untouched: quick open/close before the settling window ends, unchanged-action suppression, immediate dialog removal, pointer-down removal, keyboard/touch activation, exactly-once host execution, numbered clicks, typing without uploads and capture on completed field change, Stop waiting for the active pair, and snapshot-container cleanup. Pixel checks verify the dialog is present before and absent after, and the private green test region is absent. Saved-image evidence is `.context/interaction-before.png` and `.context/interaction-after.png`; visual inspection also confirmed the page logo renders. The comment visibility/Escape browser regression passes. No browser errors were observed. Production build, lint, and 130 package tests pass.

Limits: change detection uses host DOM/content rather than a pixel diff; animation/video/canvas-only changes, arbitrary unguarded navigation/unload, long held gestures beyond the two-second preparation window, and a separate pair for every rapid action are not guaranteed. Before images use a different renderer from settled images, so minor font/rendering differences are possible. CSS/resource compatibility remains host-dependent. Hosted deployment, physical devices, and cross-browser validation were not repeated.

## Escape preserves live comment visibility - 25 September 2026

Saved-comment visibility no longer depends on whether element selection is active. Escape and Stop commenting preserve the Show comments preference; enabled previews remain visible after selection ends, while disabled previews remain hidden. The preview's close control still works. Composing and review/recording panels temporarily hide previews to avoid overlapping controls.

The updated `.context/comment-visibility-check.cjs` passes in local Chrome: Escape with the switch on/off from both selection and the composer, repeated Escape, Stop commenting, restored host navigation, same-page preference, route reset, existing pointer/keyboard controls, mobile placement, and unchanged accessibility results. Zero mutation requests and no browser errors were observed. Evidence: `.context/comment-escape-visible-desktop.png` and `.context/comment-escape-visible-mobile.png`. Production build and lint pass. The earlier package test run below remains historical; server tests and cross-browser/device checks were not repeated for this UI-only change.

## Live comment visibility toggle - 25 September 2026

Comment selection now includes a visibility switch for read-only saved-comment markers and balloon previews. They start hidden, show one selected target at a time, group open root comments on the same element, and temporarily hide while composing. The same-page preference survives Cancel and re-entering comment mode; route changes reset it. Workspace replies and resolution are unchanged.

Local Chrome checks in `.context/comment-visibility-check.cjs` pass: pointer/keyboard switching, hidden default, reading and closing/reopening a balloon, preserved composer preference, unchanged accessibility pass, desktop/mobile placement without covering the toggle, scroll tracking, Escape, and route reset. The test made zero mutation requests and reported no browser errors. Screenshots are `.context/comment-visibility-desktop.png` and `.context/comment-visibility-mobile.png`. Existing user copy edits and comment data were preserved. Build, lint, and all 130 package tests pass; hosted, physical-device, and cross-browser checks were not repeated. This supersedes the earlier workspace-only restriction for read-only live previews.

## Recording popover and save confirmation - 25 September 2026

Recording setup now opens immediately above the bottom-right toolbar, with name/persona selection, focus, Escape/close, and responsive sizing. The recording controls use that popover too. A server-confirmed Stop shows a persistent dismissible "Recording ended and saved" status with a link to its exact flow/version. The old status panel's invalid spacing offset was corrected so messages remain in the viewport.

Local Chrome checks in `.context/recording-popover-check.cjs` cover 1440px and 390px positioning, input focus/return focus, cancellation, nested persona selection, automatic capture, injected save failure without false confirmation, retry success, dismissal, and exact-flow links including an older recording. Screenshots are `.context/recording-popover-desktop.png`, `.context/recording-popover-mobile.png`, and `.context/recording-saved-mobile.png`. Verification recordings are explicitly named; only the failed verification draft was discarded, without changing user recordings. Build, lint, and all 130 package tests pass. Hosted, physical-device, and cross-browser checks were not repeated.

## Minimal live comment composer - 25 September 2026

The follow-up removes live saved-thread previews and picker navigation buttons in favor of a new-comment speech bubble and a page-filtered workspace link. Opening comment UI preserves the last accessibility result; actual host changes still invalidate it while scanning is paused.

Local Chrome checks in `.context/comment-bubble-check.cjs` pass: unchanged accessibility pass through selection and typing, invalidation for a real injected host issue and recovery, pointer/keyboard placement without navigation, textarea focus, exactly Post/Cancel actions, failed POST retaining the draft and successful retry, persistent selection after Post/Cancel, Escape exit, no live saved threads/pins, 390px bubble fit, and navigation to the correct page's workspace comments. Browser errors were absent. Desktop/mobile evidence is in `.context/comment-bubble-desktop.png` and `.context/comment-bubble-mobile.png`. One explicitly labelled verification comment was added; user data was not removed.

Lint, production build, and all 130 package tests pass. No new server persistence contract was introduced. Hosted, physical-device, and cross-browser validation were not repeated. The earlier live-preview/picker-button checks below are historical and are superseded by this refinement.

## Compact widget and automatic evidence - 25 September 2026

Package and example production builds, ESLint, `git diff --check`, and all 130 package tests pass. Three new server tests cover bounded cursor metadata persistence/reopening, historical versions, malformed or value-bearing payload rejection, and capture permissions/discard. Existing-database migration checks preserve legacy screens with no cursor metadata.

Local Chrome through Playwright verified:

- Segmented toolbar, supplied white logo, camera/name/saved-persona setup, camera-to-Stop transition, and fitting layouts at 1440px, 390px, and 320px widths.
- Real axe scans, detection of an injected unnamed button, visible failure for a permanently busy page, and recovery after loading settles. No successful result is fabricated on failure.
- Automatic initial, click, completed-field-change, and subsequent-route captures; delayed content and `aria-busy` handling; no screenshots for typing alone; no review UI in captures; bounded cursor data and numbered clicks.
- Guarded navigation to a second route, Stop waiting for pending capture, no post-Stop capture, and delayed committed-upload acknowledgements retained when the review panel pauses recording.
- Injected screenshot-upload failure, successful manual retry, and discard of only the verification draft.
- Persistent comment selection, blocking host activation, repeated placement/cancel, live previews, emulated-touch selection, keyboard focus and Escape, and mobile popover placement/dismissal.
- Whiteboard and full-screen cursor overlays with pointer/keyboard toggle controls. No browser errors in the main workflow check.

Executable checks and screenshots are retained under `.context/`: `compact-widget-check.cjs`, `automatic-route-check.cjs`, `capture-ack-check.cjs`, `widget-recovery-check.cjs`, `cursor-mobile-check.cjs`, `compact-toolbar.png`, `compact-widget-mobile.png`, `accessibility-mobile.png`, `compact-record-modal-mobile.png`, and `cursor-layer-desktop.png`. Test recordings/comments are explicitly labelled; the existing user recording and feedback were preserved.

Limits: automated axe results are not a full accessibility certification. No hosted deployment, fresh separate-project install, physical-device or cross-browser matrix, full screen-reader audit, or npm publication was performed. Readiness observes document/fonts/images, DOM/resource quiet, and host `aria-busy`, not arbitrary pending network requests; hosts must expose otherwise unobservable loading. Cursor samples are capped at 200 per capture and exclude private/review regions. This is screenshot evidence, not video or executable action replay. Earlier checkpoints below remain historical.

## Live feedback, personas, and sidebar - 24 September 2026

Local package/example builds and ESLint pass with Next.js 16.3.6, React 19.3.0, and Chakra UI 3.37. All 127 package tests pass, including six new tests for live-element comment persistence, inherited reply targets, malformed/mixed context rejection, authentication, saved persona persistence/permissions, duplicate races, and historical recording labels. Existing-database migration assertions include unanchored legacy comments. `git diff --check` passes.

Playwright with local Chrome verified:

- Live link selection without host navigation, durable comments and replies, reload, resolve/reopen, missing/changed targets, keyboard selection/cancellation, route isolation, and desktop/mobile layouts.
- Stable/duplicate/invalid locators, private/password/value exclusion, hidden targets, injected failed-comment submission retaining text and succeeding on retry, scroll/resize tracking, hide/show pins, and emulated-touch selection.
- The direct floating record icon, required name and accessible saved-persona selector, keyboard selection, exclusion of archived entries, injected failed-start recovery, and cancellation without creating a draft.
- Starting with a saved persona, switching to live selection while recording, keyboard autofocus, visible Stop/Discard controls on mobile, and confirmed discard of the verification draft.
- Persona creation/editing/archive/restore/reload; the one-column 240px sidebar, Flows/Back focus transfer, unchanged main-content width, and narrow-screen reduced-motion navigation without horizontal document overflow.

Evidence and executable local checks are retained under `.context/`, including `workspace-flows-desktop.png`, `workspace-flows-mobile.png`, `workspace-personas-desktop.png`, `quick-record-mobile.png`, and the live-feedback/picker screenshots. Verification personas/comments are explicitly labelled local data. Only verification drafts were discarded; the user's existing Test recording and Too dark comment were preserved.

This is local Chrome validation, not a hosted deployment, fresh separate-project installation, physical touch-device matrix, full screen-reader audit, or npm publication. Live anchors fail closed when identity cannot be matched; arbitrary DOM replacement, shadow roots, iframe contents, and canvas internals are not supported. Personas label journeys and do not impersonate application users. The earlier release checkpoints below are historical and were not rerun as publishing validation.

## Earlier release checkpoint

Validated on 22 September 2026 with Node.js 22, Next.js 16.3.5, React 19.2.8, and Chakra UI 3.37.

## Automated checks

- `npm run lint`: passed.
- `npm run build`: passed, including TypeScript, API routes, and the prototype access proxy.
- `npm run test:package`: 121 tests passed (24 installer/bundler/package-version tests, 46 persistence/access/board/thread/discard tests, 15 autosave/Undo tests, 6 canvas geometry tests, 8 speech-balloon layout tests, 8 viewport geometry tests, 6 navigation tests, and 8 recording-storage tests).
- `npm run test:release`: 12 release-metadata and archive-safety tests passed.
- `git diff --check`: passed.
- `.next/`, `.revisionlab/`, browser artifacts, package build output, and local archives are ignored by Git. No `.next/` files are tracked.

The tests cover installation conflicts, backups and idempotency, JavaScript/TypeScript integrations, Next.js 15/16 script handling, persistent SQLite recordings, concurrent captures, immutable completed versions, role enforcement, invitation revocation, one-time code limits and concurrency, logout, request validation, authenticated artifacts, and storage configuration.

The whiteboard increment adds existing-database migration, saved layout reopening, newly captured screen merging, stale/concurrent board-edit rejection, coordinate/membership validation, board-edit permissions, normalized comment anchors, inherited reply context/status, cross-version isolation, and connector/layout geometry coverage.

## Browser and installation checks

### npm release automation

The repository now includes release-only npm publication with a separate read-only verification job. Local checks validated workflow YAML, release trigger, commit-pinned actions, and permission separation. Release metadata tests cover stable/prerelease routing, exact tag/version/lockfile agreement, repository restrictions, unsafe version strings, and keeping the example application private. No workflow has been pushed or executed on GitHub as part of this change.

Eight new CLI tests confirm that the default install uses the executing package's exact name/version, including prereleases, while explicit registry/local overrides remain intact. Full package and example production builds, lint, all 121 package tests, and 12 release-tool tests pass.

The packed archive contains 396 files, including client/server exports and declarations, an executable CLI, the logo, and the MIT license. Compiled tests/fixtures are excluded; path/type checks reject private/runtime files and archive traversal/links. The extracted CLI passed help, protected initialization, and repeat-initialization checks using isolated temporary fixtures and the repository's existing dependencies. The release tests, packaging, and CLI smoke passed on Node 22.11/npm 10.9 and separately on isolated Node 24.21/npm 11.19.1, matching the workflow's Node/npm major/pinned versions. This is not a fresh host dependency installation or browser validation.

Read-only remote checks confirmed the GitHub repository is public with default branch `main`; npm returned 404 for `revisionlab` and 401 for current authentication. The intended npm account is `gil00pita`, as selected by the maintainer; ownership is not yet established. First publication, the GitHub `npm` environment, npm trusted-publisher setup, and live OIDC publishing remain unverified external steps documented in `RELEASING.md`. No package was published, no credentials were added, and no external settings were changed.

Using the real local application, verified:

- Widget recording with a named persona, automatic capture across two routes, and finishing a flow.
- Screens saved as private artifacts and displayed in the workspace.
- Comments and resolution surviving reload; another version preserving the previous version's screens and feedback.
- Named invitation, local email-code verification, commenter permissions, sign-out, and invitation revocation. No external email was sent.
- Markdown report download containing actual versions, screen routes, authors, and resolution states.
- Desktop and mobile workspace/access layouts; no horizontal overflow in the tested mobile viewport.

A locally packed archive was also installed via `npx` into a separate Next.js 16 application, with actual dependency installation, a successful production build, and a browser check that host styling remained intact without hydration errors.

### Whiteboard and pinned-comment increment

Using an existing explicitly labelled verification recording, verified:

- Generated recorded-sequence arrows; mouse dragging and keyboard movement of screen cards; saving and auto-arrangement.
- Adding a labelled manual return path, saving it, and finding it after reload.
- Opening a captured screen, posting a pin at 37% horizontal / 42% vertical, adding a reply, and finding the discussion after reload.
- Resolving the thread, hiding/showing resolved pins, selecting it again, and reopening it.
- Keyboard pin placement, percentage-coordinate editing, and canceling an unsaved pin.
- Downloading the updated Markdown report with manual path labels, pin coordinates, and reply-to-thread context.
- Pin-to-image coordinates remaining within 0.5 percentage points at 125% image zoom and a 390px mobile viewport; no document-width overflow at that mobile size.
- Desktop/mobile whiteboard and pinned-discussion renders. The first visual batch revealed split mobile zoom controls; these were grouped and confirmed in the second batch.

Current screenshot evidence is `output/playwright/board-desktop.png`, `board-mobile.png`, `pins-desktop.png`, and `pins-mobile.png`. The local archive was rebuilt for this increment; the separate-host installation test above belongs to the initial release, not a newly repeated installation.

Screenshots and the downloaded report are retained locally under `output/playwright/` and are not committed. Local verification recordings and comments are deliberately labeled as verification data; they are not shipped seed data.

### Comment-card readability refinement

- Root comments and replies now use individual Chakra cards, grouped author/date metadata, 16px message text, and separate action footers. Reply cards omit empty footers.
- Verified the real pinned discussion at 1440px desktop and 390px mobile widths, including opening the pin, returning to the comment list, and reopening its reply thread.
- Temporarily replaced rendered text with a long author name, multiple paragraphs, and an unbroken URL to check mobile wrapping, then restored it. No comment data was written during these checks; neither the card nor document overflowed horizontally.
- Inspected desktop/mobile screenshots: metadata, messages, badges, and actions remain distinct and readable. An independent source/screenshot review found no material issues; the scoped layout scan reported no findings.
- Reran lint, production build, all 50 package tests, and the whitespace check successfully. Rebuilt the local package archive with these changes.

Evidence: `output/playwright/comment-cards-desktop.png` and `comment-cards-mobile.png`. The shared renderer applies these cards to widget feedback and all-comments views, but separate widget visual checks and new reply/resolve/reopen persistence browser checks were not repeated for this styling-only refinement. Earlier persistence checks and the current passing automated tests are recorded above.

### Speech-balloon refinement

Verified always-visible pinned previews, expansion into the existing discussion, hide/show without removing pins, keyboard opening and Escape focus return, and unsent reply retention when closing/reopening the same thread. At 390px, the expanded discussion fits the viewport and remains internally scrollable. Image zoom preserves the existing pin within 0.5 percentage points of its saved coordinates, with no document-width overflow.

Temporary browser-only state responses added two corner-pin comments for a three-bubble collision/edge check; no stored comments were created or changed. All three previews appeared without rectangle overlap, and a displaced preview opened its correct discussion. Temporarily failed image requests verified that the selected pinned discussion remains readable and replyable in the sidebar; the image recovered after removing the interception. All temporary response overrides were removed.

The first mobile check found an overflowing expanded thread; above/below placement with a constrained mobile height corrected it. Source review also identified offscreen-pin and failed-image cases, both addressed and browser-checked. Eight deterministic layout tests cover corners, coincident pins, dense sets, narrow images, finite geometry, stable ordering, and unchanged anchors. These checks exercise presentation and draft entry, not a new reply submission or a repeat of hosted-service validation.

A temporary resolved-state response also verified that a previously hidden resolved pin is mounted and revealed before its discussion opens from the mobile sidebar; the reply field remains reachable. Final lint, production build, all 58 package tests, whitespace check, and scoped layout scan passed. The local package archive was rebuilt. No stored feedback was changed by this refinement's browser checks.

Evidence: `output/playwright/bubbles-desktop.png`, `bubbles-mobile.png`, `bubbles-multiple-desktop.png`, `bubbles-multiple-mobile.png`, `bubble-thread-desktop.png`, and `bubble-thread-mobile.png`.

### Full-flow wheel navigation

- Real browser wheel input over a screenshot zoomed both screens together while keeping the sampled point within one pixel of the cursor. Wheel input over the background zoomed back out, without simultaneously scrolling the page.
- Verified Shift+wheel panning, background mouse dragging, arrow-key panning, explicit zoom, Reset 100%, and Fit. Rapid synthetic wheel bursts reached but did not exceed 10%–300%.
- At a 390px viewport, Fit kept both screens inside the board at 51%, with no document-width overflow. Wheel input outside the board scrolled the page normally without changing its zoom.
- Save board stayed disabled throughout navigation; no stored screens, layouts, connections, or comments were changed. The camera is isolated from the layout draft.
- Eight deterministic tests cover pointer anchoring, inverse zoom, fit centering, very large boards below 10%, pixel/line/page wheel units, limits, and invalid dimensions. A resize regression assertion covers retaining an existing sub-10% fit scale instead of reversing zoom-out direction.
- Lint, production build, all 66 package tests, the scoped layout scan, and the whitespace check passed. The local package archive was rebuilt; a separate-host installation was not repeated.

Evidence: `output/playwright/wheel-zoom-desktop.png` and `wheel-zoom-mobile.png`. Browser checks used the local Chromium session and viewport resizing, not physical touch hardware or a cross-browser/device matrix. Sub-10% fit was verified by unit tests rather than a huge browser fixture. The impeccable skill guided this input refinement while preserving the existing interface.

### Supplied logo and favicon

The homepage, workspace sidebar, and email-access header display the supplied native SVG through one Chakra image component. Browser checks at 1440px and 390px verified image decoding, the original 222:227 proportions at 32px height, and no document-width overflow. Decorative images sit beside the existing accessible RevisionLab text. The impeccable skill guided preservation of the surrounding interface; functional task icons and the wider palette are unchanged.

The browser's linked favicon returns HTTP 200 and contains the regenerated ICO. All five embedded PNG frames decode at their expected 16, 32, 48, 64, and 256 pixel sizes. The favicon keeps the existing public `/favicon.ico` route. The rebuilt package archive contains the SVG and shared logo component, without requiring host-public assets or modifying installer metadata templates.

Lint, production build, all 66 package tests, the scoped layout scan, and the whitespace check passed. Screenshots are `output/playwright/logo-{home,workspace,access}-{desktop,mobile}.png`. A fresh separate-host installation and cross-browser checks were not repeated for this asset replacement.

### Recording stop, discard, and departure guard

The real local browser verified a visible Stop recording control outside the widget and in its Comment tab. Stay kept the current page and recording; Continue recording on next page captured a second route; Stop saved the completed two-screen journey and cleared the active session. Previously saved flows remained intact.

A deliberate HTTP 503 on the verification draft's discard request kept the page and warning open, stopped further capture, and offered retry. Removing the interception and retrying removed the draft and its private screenshot before navigation; the artifact URL then returned 404. The intercepted failure is an expected browser-console error, not an unexplained runtime error.

A deliberately delayed capture response verified that Continue is disabled while capture is underway and that Discard does not request cleanup or navigate until that capture settles. Releasing the response allowed cleanup to remove the verification draft and then navigate. All response overrides were removed. A native reload warning was observed; the recording remained available after the cancellation/reload check.

Desktop and 390px mobile screenshots confirmed readable warning content and reachable actions without horizontal overflow. The visual check exposed a side-by-side title/description and floating controls above the backdrop; the confirmation batch verified a stacked header and controls below the warning. Final lint, production build, all 88 package tests, the scoped layout scan, and whitespace check passed.

The local `revisionlab-0.1.0.tgz` archive was rebuilt and checked for the recording controls, departure dialog, navigation helper, discard endpoint, and updated package README. It has not been published.

The new automated tests cover creator/owner permissions, completed-version protection, idempotent discard, private artifact removal, retryable external-storage cleanup, concurrent capture/completion races, navigation classification and host-helper acknowledgement, and stopped-session flags with unavailable or failing browser storage. These are local tests; no live shared-storage provider was exercised.

Browser evidence is retained in `output/playwright/recording-controls-{desktop,mobile}.png` and `recording-warning-{desktop,mobile}.png`. Verification data is explicitly labeled; only test drafts chosen for discard were removed. The successful two-screen verification recording remains saved. The impeccable skill guided the accessible warning, distinct Stop/Discard actions, and failure-recovery copy while retaining the current interface.

Automatic link interception covers ordinary same-tab page anchors. Programmatic host navigation must await the exported `confirmRecordingNavigation()` helper; arbitrary router calls and client-side Back/Forward are not globally intercepted. Reload/close uses browser-native warnings and never automatically discards on unload, because cancellation and reliable async cleanup cannot be guaranteed. Cross-browser/touch-device checks and a fresh separate-host installation were not repeated.

### Direct whiteboard editing — implemented subset

The local browser verified Paths entering edit mode without opening a form; on-screen source/target connection creation; labels and saved connection discussions; replies; resolve/reopen; and blocking a new path's comments until the board is saved. Leaving an unsaved draft offered Keep editing and Discard, with the expected retained/restored label values.

Removing a screen showed its affected path count before confirmation. Saving and reloading retained the removal without deleting either captured step or screenshot; the private screenshot still returned HTTP 200. Restore returned the screen to the draft. Removing a connection archived its discussion, which remained reachable in All comments and accepted a reply while refusing new root threads. Verification used the explicitly labelled two-screen recording, and its original screen/path arrangement was restored through the authenticated board API after each preservation check. The added verification path and clearly labelled comments remain as local test data; no unrelated recording or feedback was deleted.

The ten new server tests cover exact-version connection membership, mixed/invalid targets, commenter/editor boundaries, archived replies, immutable connection identities, concurrent comment/removal, legacy board loading, hidden-screen membership, new captures after removal, and preservation of captured artifacts. Existing discard tests now verify deletion of draft registry rows with foreign keys disabled and preservation of completed-version registry/history. All 98 package tests pass.

A deliberate save HTTP 503 retained the draft label and allowed a successful retry. A temporary browser-only commenter state hid Paths/movement/removal controls while leaving connection discussion available; no account permissions were changed. Actual authorization is covered by server tests. All request overrides were removed. The downloaded Markdown report contains connection IDs, labels, version context, and reply relationships (`output/playwright/paths-review-report.md`).

Desktop and 390px mobile screenshots show the edit controls, fitted graph, contextual connection panel, and readable comment cards with no document-width overflow. The panel follows the canvas on narrow screens. The scoped layout scan found no issues. Evidence: `output/playwright/paths-editor-desktop.png` and `paths-editor-mobile.png`. The impeccable skill kept this extension within the existing visual system; Playwright exercised the real workflows. There was no separate independent visual reviewer for this increment.

Final lint, production build, all 98 tests, formatting, and whitespace checks passed. The local package archive was rebuilt and checked for the new editor, connection registry, and context modules. It has not been published.

Decision nodes/forms and URL-based screen addition remain unimplemented pending the two explicit product choices. No action replay, automatic flow discovery, live hosted-service validation, cross-browser/device matrix, or fresh separate-host installation is claimed by these checks.

### Board autosave and Undo

Manual Save/Discard board controls are replaced by autosave status and Undo. Fifteen deterministic controller tests cover debounce/no-op behavior, 50-operation history bounds, drag and typing groups, exact screen/path restoration, serialized writes, edits and Undo during an in-flight request, flush draining, stale/own polls, conflict protection, failed reloads, network retries, and lost-response reconciliation. All 113 package tests pass.

The local Chromium browser verified label persistence without Save and one Undo restoring a whole typing burst; a 12-step mouse drag produced one undoable operation. Autosaved screen removal hid its adjacent paths, then Undo restored exact node positions and connection IDs, with the comment count unchanged. A deliberate HTTP 503 retained the draft, kept Done editing and Comments navigation on the current flow, and recovered through Retry autosave. A deliberately delayed successful response verified that Undo remains available while saving, queues the inverse PATCH, and Done editing waits for both requests before leaving edit mode. All interceptions were removed, and each completed test operation was undone to its preceding state without resetting unrelated flows or feedback. The intentional 503 is an expected console error.

Desktop (1440px) and mobile (390px) screenshots show readable autosave status, reachable Undo/edit controls, the existing graph and discussion panel, and no horizontal document overflow. Evidence: `output/playwright/autosave-undo-desktop.png` and `autosave-undo-mobile.png`. The impeccable skill guided failure recovery and preservation of the existing interface; Playwright exercised the workflows. Scoped layout and whitespace checks pass. A read-only integration review identified polling-selection and departure-window risks; the selected flow is now pinned and structural controls are locked during navigation/sign-out/version creation. Browser checks confirmed selection survives a reordered poll and a delayed, deliberately failed version-start request locks edits and flow switches until recovery, without creating a recording. The first test's interception cleanup raced a pending poll; a separate read-only polling check completed cleanly, and all overrides were removed.

Final lint, production build, and all 113 package tests pass. The local package archive was rebuilt with the autosave controller and new UI; no npm publication or deployment was performed.

Undo history is local to the mounted flow, not persistent across reloads or version changes. Comment submission and recording Stop/Discard remain separate. Native unload warnings cannot guarantee persistence on abrupt closure. Conflict races and lost acknowledgements have deterministic test coverage, not a live multi-user hosted test. Cross-browser/device checks and a fresh external-host installation were not repeated.

## Independent interface review

| Disposition | Material findings |
| --- | --- |
| PASS for the documented first release | None on the reviewed desktop/mobile workspace and access surfaces. |
| PASS for the whiteboard and pinned-discussion increment | No material findings on the supplied desktop/mobile board and discussion surfaces or their source. |

Nonblocking observations: historical comment groups could include richer flow/persona/version labels; mobile navigation pushes the captured screen below the first viewport; larger version-selector touch targets would improve mobile use.

The reviewer inspected screenshots and source. It did not independently run browser interactions, keyboard/screen-reader checks, computed-contrast measurements, or hosted-service tests. The implementation used the impeccable skill to preserve the existing visual language and record its design system.

The whiteboard reviewer likewise inspected source, documentation, and the four current screenshots; it treated the build/test/browser results as supplied evidence. Its nonblocking observations concern the inherited mobile scrolling depth and the distinction between a fitted overview and detailed screen inspection. Large-graph usability, full screen-reader operation, and measured contrast across every state were not independently verified. The existing design system is preserved; the new workflow is recorded in the package's `.impeccable/surfaces/` brief.

## Limits

Live Turso and Resend delivery have not been verified because deployment credentials were not supplied. Next.js 15 generation is covered by automated tests; the full external-host build/browser test used Next.js 16. The npm package has not been published or externally deployed.

Recording currently captures DOM screens, not video or replayable action scripts. The remaining product roadmap and compatibility boundaries are listed in README.md and PLAN.md.

Whiteboard connections use geometric routing, not a full obstacle-avoiding diagram engine. Observed visit order generates recorded paths for new captures; historical recordings retain their captured sequence. Manual branches are explicitly labelled rather than presented as discovered behavior. Screenshot pins do not resolve DOM elements or migrate themselves to newer captures.
