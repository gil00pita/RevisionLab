# Release validation

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

Whiteboard connections use geometric routing, not a full obstacle-avoiding diagram engine. Recorded order generates paths; manual branches are explicitly labelled rather than presented as discovered behavior. Screenshot pins do not resolve DOM elements or migrate themselves to newer captures.
