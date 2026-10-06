# Release validation

## Navigation menu refinement — 6 October 2026

The prototype link now remains outside both sliding panels, with an application-window icon. Flow rows span the sidebar with square corners and light dividers, blue badges, accessible number-plus-screen-icon counts, persona icons, and localized creation date/time. The submenu return action says Main menu. Focus transfer now runs after React commits the panel's inert state.

Local Chromium checks used an isolated database at `.context/navigation-review.db` with 12 three-screen fixtures. At 1440px and 390px, assertions verified stationary prototype-link bounds across both transitions and long-list scrolling, keyboard focus transfer and prototype-link availability, the same mounted board, full-width square rows, dividers, metadata, and no horizontal overflow. Search filtering, Select/Done, and individual selection passed; the main menu fit at 320px and 768px. Scoped WCAG A/AA axe checks found zero sidebar violations at desktop and mobile sizes, with no browser errors. Fixtures contain no captured screenshots. Evidence: `.context/check-navigation.js`, `.context/navigation-desktop.png`, `.context/navigation-mobile.png`, and `.context/navigation-a11y-{desktop,mobile}.json`. These checks cover the local interface; hosted, cross-browser, and live connected-instance behavior were not retested.

Final `npm run lint`, `npm run build` (package compilation and Next.js production validation), and `git diff --check` pass. Build/lint logs are `.context/navigation-build.log` and `.context/navigation-lint.log`.

## Built-in installer dependency diagnostics — 6 October 2026

Implemented locally, not yet published: failed npm installs now automatically inspect the host's installed dependency tree with `npm ls --all --json`. The CLI lists distinct direct/transitive invalid-version constraints, explains why separate single-package repairs can fail before saving, and retains the exact version/archive retry command. It preserves npm's original output, generated files, host dependency declarations, and failure exit. Empty/unavailable trees and malformed or unavailable npm diagnostics retain useful manual instructions. Inspection has a 10-second timeout, an 8 MiB capture limit, and a 20-conflict display limit; no force/legacy peer flags, registry lookups, or automatic tooling changes were added.

Package compilation, all 44 CLI tests, lint, and `git diff --check` pass. Tests cover nested/deduplicated constraints, older npm summaries, multiple conflicts, malformed/healthy/missing trees, a diagnostic executable disappearing after the failed install, unchanged host devDependencies, exact retry commands, and retained generated files. An npm pack dry-run confirms the diagnostics module is included and its tests excluded. A read-only invocation against the reported host lists ESLint, three Storybook/Vitest peer constraints, TypeScript, and a stale AJV peer conflict together; evidence is `.context/init-diagnostics-host.log`, `.context/init-diagnostics-tests.log`, and `.context/init-diagnostics-pack.json`. No host files, package publication, or application UI were changed. This reports an installed snapshot; npm's attempted new resolution can involve additional constraints.

## Host dependency recovery — 6 October 2026

Inspected the complete `nicts-tribunals` manifest without changing the host. The initial single-package ESLint repair failed on Storybook/Vitest before saving, leaving the original ESLint conflict in place. Strict full-tree resolution then exposed mixed Tiptap patch versions, and an installed-tree check exposed TypeScript 6 conflicting with the TypeScript 5 peer of Storybook's transitive `tsconfck` dependency.

Validated an isolated copy under `.context/dependency-check/` with `@eslint/js@9.39.5`, the three declared Vitest packages at `4.1.11`, all Tiptap dependencies previously at `3.31.3` or `^3.31.3` pinned to `3.31.4`, TypeScript `5.9.3`, and RevisionLab `0.1.13`. Retained `eslint@9.39.5`, Storybook `10.6.0`, and `@tiptap/y-tiptap@^3.0.9`. With Node `26.3.1` and npm `11.16.0`, strict package-lock resolution passed, a fresh `npm ci --strict-peer-deps --no-audit --no-fund` installed 1,099 packages, and `npm ls --all --json` exited zero with no dependency problems. The published RevisionLab CLI help and installed ESLint, Vitest, and TypeScript version commands succeeded.

Prepared `.context/repair-nicts-dependencies.cjs` to apply the validated declarations and copy the tested lockfile for a subsequent host `npm ci`. It reproduces the validated manifest/lockfile exactly, is idempotent, and refuses unexpected manifest changes before writing. Logs and the lockfile are saved under `.context/dependency-check/`. `git diff --check` passes. This validates the inspected dependency tree, not arbitrary future package updates or the host's application behavior; the host build and browser flow were not run. npm emitted deprecation warnings and withheld three pending dependency install scripts under its default script policy; no script approvals or peer-check bypasses were used.

## Audit tab integration and latest main merge — 2 October 2026

Merged `origin/main` at `9d99002`, preserving the setup wizard, users/roles, connected workspaces, history, and widget/audit controls. AI Instructions and design-system settings now live inside Settings → Audit; the separate AI tab is removed. Both instruction-file and design-system saves target the selected workspace. History includes saved AI configuration and accepts older snapshots without it; the external Markdown file remains outside history, as explained in the interface and documentation.

Validation: lint, production build, all 212 package tests, and all 19 release tests passed. New integration tests cover partial AI/WCAG saves preserving each other, connected-source file/configuration isolation and commenter permissions, unavailable sources, legacy remote-state compatibility, and current/legacy history restoration while retaining the authoritative Markdown file. After the final history-help-text change, targeted component lint passed.

Chrome against an isolated local test database verified the Audit tab contains existing controls plus one AI editor, the full 17,922-character default prompt, framework draft retention across tab switches, save/reload persistence, keyboard arrow navigation between tabs, and zero horizontal overflow at 390px. Desktop/mobile screenshots are `.context/audit-ai-desktop.png` and `.context/audit-ai-mobile.png`; browser errors were empty. The browser-created instruction file was removed after verification to restore its original absence. Connected behavior was exercised through real route handlers with mocked transport; no deployed instance was changed.

## Main merge integration — 2 October 2026

Merged `origin/main` (2656018), retaining local Codex fixes, Jira drafts, persistent navigation, Yarn dependency management, and release automation. Resolved the overlapping AI editor into one Settings section: the local Markdown file supplies base text, the database retains design-system choices and a fallback, and Codex composes the same enabled resource appendix as preview/copy. New installations still receive the complete template; external file edits and intentionally empty files take precedence over the fallback. Missing files can be saved without editing the template. Partial saves explicitly report that Markdown succeeded while settings need retry.

Validation: frozen Yarn installation, lint, production build, all 182 package tests, and all 19 release tests pass. Both original AI test suites are retained, with integration checks for database fallback, file precedence/empty files, and design-system inclusion/exclusion in the actual Codex prompt. Chrome checks verified one AI editor, enabled Save for a missing default file, selection/save/reload, generated resources, external file edits on reopening, a simulated settings failure after successful file save retaining the draft and enabling retry, successful retry, and no horizontal overflow at 390px. Browser error collection was empty. Test settings/files were restored; no live Codex execution, Jira submission, or deployment was performed.

## AI Instructions and design systems — 2 October 2026

Local validation completed:

- `npm run lint` and `npm run build` passed after the final code changes.
- `npm run test:package`: all 167 tests passed. New checks cover the exact SHA-256 of the supplied prompt, fresh-install defaults, persisted edits and blank instructions, reopening the database, additive migration of a legacy settings table, toggle/base-text isolation, all 18 catalogue resources, manual setup output, URL/length validation, owner/editor/commenter permissions, and concurrent updates preserving comment preferences.
- The package dry-run manifest includes the default prompt, catalogue, and Settings editor, so installed host projects receive the same defaults. A separate host installation was not repeated.
- Local Chrome checks at `http://localhost:3127/revisionlab?view=settings` verified prefilled text, Chakra selection and setup options, save/reload, exact base output when disabled, restored selection when re-enabled, a manual name/docs/skill/MCP entry and persisted output, copy success, and injected HTTP 503 save failure retaining the draft followed by successful retry. ArrowDown moved selection and focus from Chakra UI to Radix; only one radio was selected. Browser error collection was empty.
- Visual checks at 1440px and 390px, plus overflow checks at 390px and 320px, found no horizontal page overflow. Screenshots are under `.context/ai-settings-desktop.png`, `.context/ai-settings-mobile.png`, and `.context/screenshot-1790956393042.png` (gitignored).
- axe checked the AI Instructions form against WCAG 2 A/AA and 2.1 AA tags: zero violations, 17 passing checks, one incomplete/manual-review check. This is not a compliance certification; real assistive technology and other browsers were not tested.
- All 18 GitHub star counts were fetched from the GitHub repository API on 2 October 2026 and saved with a date. Resource URLs are the supplied catalogue references; resource contents and external installers were not audited or executed.
- The test workspace's AI settings were restored to the original full prompt with the design-system toggle off after browser checks. No package was published and no skill or MCP was installed by the feature. Setup options append instructions for the receiving agent.

## Thirty-day workspace history - 2 October 2026

Settings now has a History tab covering flow, capture, recording, whiteboard, comment, persona, and Widget/Comments/Audit mutations for 30 days. Restore is source-specific, permission-limited, point-in-time, and creates its own recoverable entry. Deleted screenshot evidence remains private while referenced by history; expiry cleanup retries external storage failures. Access, keys, invitations, sessions, reviewers, and connection configuration are excluded. PRODUCT.md, PLAN.md, and both READMEs reflect the confirmed scope and restore semantics.

All 177 package tests, lint, production build, formatter, and whitespace checks pass. New integration coverage restores a deleted flow with comments and screenshot access, reverses that restore, rejects commenter restoration, suppresses failed/no-op changes, restores settings/personas/comments to earlier points, cleans expired file artifacts, and restores a connected board through a namespaced proxy history ID. Existing deletion/discard tests verify retained evidence is inaccessible through authenticated artifact routes before expiry and that failed external cleanup retries safely.

Chromium verified History tab rendering, two entry cards, explicit point-in-time confirmation, Cancel, ArrowRight/ArrowLeft tab focus, and zero horizontal overflow at 390px. The entry data was browser-fixtured, while restore behavior is covered against isolated real databases and route handlers; no user workspace content or deployed connected instance was changed. Browser errors were empty. Evidence: `.context/history-tests.log`, `.context/history-lint.log`, `.context/history-build.log`, `.context/workspace-history-desktop.png`, and `.context/workspace-history-mobile.png`.

## Connected workspace instances - 2 October 2026

Implemented owner-managed General API keys and Workspace Instances connections, a selector at two workspaces, individual/combined review data with source labels, authenticated screenshot proxying, and source-directed edits capped by both the local role and source key. Widget/Comments/Audit settings follow the selected source; administration remains local. Requests enforce same-project/distinct-installation identity, public HTTPS destinations, pinned DNS resolution, no redirects, bounded responses/timeouts/concurrency, scoped federation operations, and key revocation. Generated keys are shown once and hashed at source; receiving credentials remain in the server database. Polling outages retain last-loaded board state and identify unavailable sources. PRODUCT.md, PLAN.md, and both READMEs describe the confirmed behavior and deployment constraints.

Validation: all 174 package tests, lint, production build, formatter, and whitespace checks pass. Isolated database/handler integration tests cover key hashing/visibility/revocation, owner-only administration, source-key and local-role caps, re-keying, project/instance rejection, ID collisions, real source board/comment/settings writes, screenshot reads, partial outages, reconnection, and non-destructive removal. URL/address rejection and cross-source reference rejection are tested; a board test covers stable remote manual-edge identities through autosave. The HTTPS transport is replaced only inside integration tests, so live public DNS/TLS connectivity and deployed proxy behavior remain unverified.

Chromium exercised real key generation, hiding, and revocation (the verification key was revoked). In browser fixtures with two sources, the selector appeared, keyboard End/Enter selected All workspaces, comments retained distinct source groups, individual selection used remote settings, a commenter key hid editing controls, and repeated outage refreshes retained the same mounted board without duplicate flows. At 390px the document width remained 390px. Multi-instance browser data was simulated; no production instance was connected. The existing board departure guard is reused for workspace switching, but a delayed dirty-save switch was not separately browser-tested. Evidence: `.context/instances-tests.log`, `.context/instances-lint.log`, `.context/instances-production-build.log`, `.context/workspace-instances-desktop.png` (actual connection form), `.context/workspace-instances-selector.png` and `.context/workspace-instances-mobile.png` (fixture connections).

## Default WCAG version and level - 2 October 2026

Settings → Audit now saves WCAG 2.0/2.1/2.2 and A/AA/AAA for owners/editors, retaining 2.2 AA as the migration/default value. Live checks and subsequent recording scans use the selected supported axe tags, cached pre-interaction evidence is isolated by standard, and new reports retain the tested standard alongside their findings. Historical results remain unchanged and legacy reports are readable. PRODUCT.md, PLAN.md, and both READMEs reflect the setting and automated coverage limits.

Lint, production build, formatting, whitespace checks, and all 168 package tests pass. Added tests cover all nine targets against real axe rule metadata, scan-runner options, cancellation, cache separation, stored report metadata, settings persistence/concurrent updates, invalid inputs, and commenter restrictions; existing migration tests verify the added defaults while preserving legacy data. Chromium verified saving/reloading 2.0 AA, draft retention across tabs, radio keyboard focus/selection, the displayed target, and no horizontal overflow at 320px. A read-only wrapper around the real axe runner observed 2.0 AA tags and, after changing settings, 2.2 AAA tags and the updated results label. Browser-only commenter simulation disabled all six radios and Save. Overrides were removed, owner state restored, and the local default reset to its original 2.2 AA. Browser error output was empty; no recordings or invitations were created.

Evidence: `.context/wcag-settings-desktop.png`, `.context/wcag-settings-mobile.png`, `.context/wcag-tests.log`, and `.context/wcag-build.log`. Recording integration was built and source-reviewed; report persistence and rule selection have automated coverage, but no new end-to-end recording or hosted service test was performed for this increment. Automated checks cover only supported criteria and are not conformance certification.

## Users & Roles Settings tab - 2 October 2026

The owner-only invitation and reviewer-permission interface now lives in Settings → Users & Roles; the standalone Review access sidebar item is removed. Legacy `?view=people` links show Settings and select Users & Roles for owners, with Widget as the fallback for other roles. Tabs wrap on narrow screens and preserve mounted invitation drafts. PRODUCT.md, PLAN.md, and both READMEs describe the move.

Lint, production build, formatting, and whitespace checks pass. Chromium verified the tab and invitation controls, removal of the sidebar entry, draft email retention across tabs, ArrowLeft focus/selection, legacy-link selection and active Settings footer, and no horizontal overflow at 320px. Browser-only state-response overrides verified editors/commenters cannot see the tab or invitation form and fall back to Widget; overrides were removed and owner state restored. No invitations or roles were changed, and browser error output was empty. Evidence: `.context/users-roles-desktop.png`, `.context/users-roles-mobile.png`, and `.context/users-roles-tab-build.log`. Backend invitation behavior and authorization were unchanged and were not retested in this layout increment.

## Sidebar navigation hierarchy - 2 October 2026

Back to prototype is the first, primary main-menu link; Settings now occupies the persistent footer and remains available on mobile and inside Your flows. The repeated project title and description below the logo are removed. Settings retains its active state and guarded view changes, and the prototype link preserves native navigation for pending-save unload warnings. PRODUCT.md, PLAN.md, and both READMEs reflect the hierarchy.

Lint, production build, and whitespace checks pass. Chromium verified the first link and its destination, a single active Settings action, removal of the repeated description, and Settings returning from Your flows to the main menu. Desktop and 320px screenshots show accessible controls without horizontal overflow; browser error output was empty. Evidence: `.context/sidebar-hierarchy-desktop.png`, `.context/sidebar-hierarchy-mobile.png`, and `.context/sidebar-hierarchy-build.log`. The existing pending-save warning was preserved structurally, not separately exercised with a dirty board for this layout change.

## Settings tabs and single page title - 2 October 2026

Removed the duplicate in-content Settings heading, retaining the workspace page title. System contains widget configuration, Comments contains bubble preferences, and Audit explains existing checks and where to stop/rerun them; no persisted audit options were added. Tab panels remain mounted to preserve unsaved widget drafts, and read-only/save/error behavior is retained. PRODUCT.md, PLAN.md, and both READMEs describe the new organization.

Validation: lint, production build, and diff checks pass. Chromium confirmed one Settings heading, the default System panel, separate Comments/Audit panels, ArrowRight/Home navigation with focus, and a draft horizontal offset retained after visiting both other tabs. At 320px all tabs fit without horizontal overflow. Browser error output was empty. Screenshots: `.context/settings-tabs-desktop.png` and `.context/settings-tabs-mobile.png`; build log: `.context/settings-tabs-build.log`.

## Widget settings and accessibility badges - 2 October 2026

Workspace Settings now persists widget visibility, ten named colors, left/right side, and whole-pixel horizontal/bottom offsets (0–1000). Existing installations migrate to visible/blue/right/24px defaults without losing comment settings. Idle hidden launchers stop live-page scans; active sessions retain their controls. Associated panels follow placement, and rendered offsets are constrained to keep controls onscreen. The minimal logo shows the supplied issue artwork for current findings or a spinner while checking.

Validation: lint, production build, and all 164 package tests pass, including saved/reopened settings, named colors, invalid input, concurrent partial updates, permissions, and legacy settings migration. Chromium checks verified UI save/focus retention, purple/left placement at 32px horizontal and 48px bottom, inward expansion, aligned recording setup, issue/spinner badges, badge removal on audit stop, hide/reload/direct-settings recovery, invalid numeric input, and extreme offsets at 320px without overflow. Hiding during commenting retained Stop commenting and hid the launcher afterward. Original local settings were restored after testing. Browser error output was empty. Evidence is in `.context/widget-settings-tests.log` and `.context/widget-settings-*.png`, `.context/widget-issues-badge.png`, and `.context/widget-scanning-badge.png`.

## Widget motion and 36px controls - 2 October 2026

The logo and toolbar controls now measure 36 × 36px. Tools expand horizontally with a 200ms fade and retract with a 150ms fade; reduced motion skips both animations. Closing tools become inert immediately while their exit finishes. PRODUCT.md, PLAN.md, and both READMEs reflect the refinement.

Validation: lint and production build pass. Chromium frame sampling confirmed intermediate widths in both directions, constant 36px height, and a stationary logo on desktop and at 320px. Reduced-motion sampling returned no active animation and only the collapsed/expanded widths. Keyboard disclosure, comment auto-collapse, Stop commenting focus return, and no mobile overflow were checked; browser error output was empty. Evidence: `.context/widget-motion-final-frames.json`, `.context/widget-motion-reduced.json`, `.context/widget-motion-expanded-mobile.png`, and `.context/widget-motion-collapsed-mobile.png`.

## Minimal front-end widget - 2 October 2026

The widget now rests as a logo-only disclosure at bottom right. Expanded tools include a separate workspace link; recording, commenting, and running audits retain their own Stop buttons when collapsed. Recording/comment start collapses the tools; routine recording text and picker help appear only when expanded. Error/save feedback and active composers remain available. Audit cancellation immediately aborts pending publication and pauses automatic scans until rerun; an executing axe call can finish internally but cannot publish its cancelled result. Recording accessibility evidence is independent.

Validation: `npm run lint`, `npm run build`, all 162 existing package tests, and `git diff --check` pass. Local Chromium checks verified logo-only idle state, pointer/Enter/Space expansion and Escape/focus return, commenting auto-collapse and expanded picker settings, a real recording started and saved from the collapsed Stop control, acknowledged View recording/dismissal, and the separate workspace link reaching `/revisionlab` with the launcher hidden. A deliberately busy host page kept an audit pending: Stop auditing removed its stop control, host changes did not restart it, and Run again resumed scanning. Desktop 1440px and mobile 390/320px checks found no horizontal overflow; expanded tools with a running audit fit at 320px. Browser error output was empty. This does not add automated hook tests or independently validate cancellation inside axe itself, simultaneous recording/commenting, fresh hosted installation, or other browsers.

Screenshots: `.context/widget-collapsed-desktop.png`, `.context/widget-collapsed-mobile.png`, `.context/widget-expanded-mobile.png`, `.context/widget-recording.png`, `.context/widget-commenting.png`, and `.context/widget-auditing-mobile.png`. Build/test logs are in `.context/widget-build.log` and `.context/widget-tests.log`. PRODUCT.md, PLAN.md, both READMEs, and homepage instructions reflect the changed launcher workflow. No publication or deployment was performed.

## Floating whiteboard viewport controls - 28 September 2026

Zoom out, percentage/reset, zoom in, and icon-only Fit moved from the top toolbar into a bounded bottom-right widget. It is anchored to the canvas wrapper, outside the transformed graph and wheel/focus/pan event surface; the existing camera callbacks and limits are unchanged. Paths, cursor visibility, Auto-arrange, and Undo remain above the canvas. Read-only users retain viewport controls without an empty editing toolbar.

All 160 package tests, lint, production/package builds, and whitespace checks pass. The isolated browser check at `.context/board-floating-controls-check.cjs` verifies a single control group, keyboard zoom, reset/Fit, unchanged toolbar placement through wheel zoom and drag pan, no focus-induced pan, full-size pan surface, connection-panel separation, 320/390px and short/tall desktop layouts, tab visibility, and commenter access. It records no API mutations or browser errors. Desktop/mobile screenshots were inspected at `.context/board-floating-controls-desktop.png` and `.context/board-floating-controls-mobile.png`. PRODUCT.md, PLAN.md, and both READMEs are aligned. No user recordings, publication, or deployment were changed.

## Compact flow header and view tabs - 28 September 2026

The top workspace header now contains the selected flow title, persona/status/screen metadata, recording action, and family-wide delete action. Other sections and empty workspaces retain the project header; sidebar branding stays unchanged. Chakra tabs replace the view buttons, and a history-icon radio menu replaces inline version buttons. The board stays mounted across tab changes. Existing autosave guards, role restrictions, deletion confirmation, recording retry/continuation, and global workspace actions are retained.

All 160 package tests, lint, production/package builds, and whitespace checks pass. The isolated `.context/flow-header-check.cjs` verifies one top-header title/action area, arrow-key tabs, retained board zoom, keyboard version switching/current-state indication/Escape focus, menu bounds and no horizontal overflow at 320/390/768px, non-flow headers, commenter restrictions, recording failure/retry/new-version creation/continuation, and no browser errors. `.context/flow-deletion-check.cjs` passes with its locators updated for tabs and the version menu, including persisted single/bulk family deletion, cancellation/focus, autosave failure protection, active recordings, stale polls, and empty state. Desktop/mobile screenshots were inspected at `.context/flow-header-desktop.png`, `.context/flow-header-versions.png`, and `.context/flow-header-mobile.png`. Tests use isolated databases; no user recordings were changed. PRODUCT.md, PLAN.md, and both READMEs are aligned. No publication or deployment was performed.

## Saved per-screen accessibility - 28 September 2026

All 160 package tests, lint, production/package builds, and whitespace checks pass.

The widget and recording pipeline now share a serialized axe runner. Each captured page/state saves a bounded accessibility report inside its existing capture metadata, without a database migration. Reports include status, engine version, scan time, detected rule count, severity, documentation, and structural target locations; no raw HTML, IDs, field values, or live element references are stored in reports. Private/review UI and password/one-time-code controls are excluded. Storage is bounded to 64 KB, 50 rules, and 10 target locations per rule, with total counts and truncation indicated. The upload limit reserves space for this metadata without changing the 3 MB image limit. Matching reused screens keep their original report; old captures remain Not checked. Unstable, failed, timed-out, or unmatched pre-interaction checks remain explicitly unavailable instead of appearing passed.

Whiteboard cards show report status/counts alongside comment counts. The selected screen has Comments and Accessibility tabs, preserving existing discussions and showing saved rules, severity, affected locations, documentation, and incomplete/manual-review counts. Keyboard and 320/390px layouts were checked. Reports describe automated WCAG A/AA evidence, not compliance certification or a rescan of an old image. Cross-origin frame coverage and manual accessibility testing remain outside this increment.

Server tests cover persistence/reopening, per-screen and version isolation, reuse immutability, missing/incomplete/unavailable states, malformed and contradictory reports, unsafe documentation links, bounded payloads, editor/commenter permissions, cleanup, and near-limit images plus reports. Serializer tests check byte/rule/target bounds, exclusion of raw HTML/value metadata, and clean versus manual-review status. `.context/recorded-accessibility-check.cjs` exercises genuine scans on an isolated recording with deliberate violations, a fixed page, dialog state, state reuse, full navigation, injected failure and mid-scan changes, missing pre-interaction checks, unchanged comments, report reload, and keyboard/mobile review. No user recording data is changed. Screenshots: `.context/recorded-accessibility-board.png`, `.context/recorded-accessibility-desktop.png`, and `.context/recorded-accessibility-mobile.png`. The existing recording-graph and live accessibility-inspection browser regressions also pass. PRODUCT.md, PLAN.md, and both READMEs are aligned; no publication or deployment was performed.

## Single-flow deletion in the flow view - 26 September 2026

Individual flow menu items no longer have trash buttons. Owners/editors delete the open flow from the bin beside the recording action in its header, available in Whiteboard and Screen & comments. The shared confirmation still names the complete version family with version/screen counts; an unfinished version disables deletion. Bulk deletion stays in the menu's Select mode. PRODUCT.md, PLAN.md, and both READMEs reflect the new placement.

The isolated `.context/flow-deletion-check.cjs` verifies absence of row delete actions, header deletion from both views, family-wide scope while viewing an older version, Escape/focus return, disabled recording families, commenter restrictions, autosave failure/recovery, actual deletion and fallback selection, and retained bulk behavior. Desktop and 320px screenshots were inspected at `.context/flow-view-delete-desktop.png` and `.context/flow-view-delete-mobile.png`. All 153 package tests, lint, and package compilation pass. No user data was deleted; no publication or deployment was performed.

## Opt-in flow selection - 26 September 2026

Your flows initially hides checkboxes and bulk actions. Select reveals row checkboxes, filtered Select all, Select none, selected count, and Delete selected; Done clears selection and hides these controls again without navigation or deletion. Select none clears selections outside the search filter too. Per-flow trash actions remain available in normal mode. Commenters have no selection/deletion controls, and active recordings remain ineligible.

The extended `.context/flow-deletion-check.cjs` verifies default/reload visibility, keyboard Select activation and focus, filtered all/none with hidden selections, Done/re-entry reset, cancellation, single-flow trash outside selection mode, existing persisted single/bulk deletion, busy/error recovery, autosave guards, roles, and 320px mobile layout using an isolated database. Screenshots include `.context/flow-selection-default-desktop.png`, `.context/flow-list-default-mobile.png`, and `.context/flow-delete-selection-desktop.png`. All 153 package tests and lint pass; build and whitespace checks are recorded with this local increment. PRODUCT.md, PLAN.md, and both READMEs are aligned. No user recordings were deleted and no package publication or deployment was performed.

## Whiteboard fills remaining height - 25 September 2026

The board grid grows into remaining workspace space, and the canvas stretches with it rather than stopping at a fixed height. The actual interactive viewport and pan surface grow together; the previous 420px mobile/560px wider-screen heights are now minimums, preserving usability and page scrolling on shorter windows. Camera state and saved board coordinates are unchanged. PRODUCT.md and PLAN.md capture the requirement.

The extended `.context/sidebar-fixed-chrome-check.cjs` checks matching canvas/workspace bottom edges and full-size pan surfaces at desktop heights of 720, 1000, 1200, and 1500px, plus narrow mobile/tablet layouts. It exercises Fit, drag and wheel zoom in the added bottom area, switching Screen & comments back to Whiteboard, flow-menu transitions, retained selection, and reduced motion using an isolated test database. Screenshots: `.context/whiteboard-fill-desktop.png` and `.context/whiteboard-fill-mobile.png`. All 153 package tests, lint, production/package builds, and whitespace checks pass. No user data, publication, or deployment changes were made.

## Stationary sidebar header and footer - 25 September 2026

Only the central main-menu/Your flows panels slide. The logo/project header and desktop footer are separate, non-shrinking siblings outside both transforms and scrolling containers. The mobile logo also stays in place; existing desktop-only footer visibility is preserved, and the mobile flow list keeps its previous scrolling height. Back, autosave guards, selected flow, bulk selection, focus transfer, inert inactive panels, and reduced-motion support are retained. PRODUCT.md, PLAN.md, and the root README are aligned.

`.context/sidebar-fixed-chrome-check.cjs` uses the real handler with an isolated test database and browser API interception, leaving user data unchanged. It samples animation frames to assert unchanged logo/footer coordinates during both transitions, verifies independent long-list scrolling, retained flow/bulk selection, focus and hidden controls, no horizontal overflow at 320/390/768/1440px, and zero-duration reduced-motion transitions. Desktop/mobile screenshots are `.context/sidebar-fixed-chrome-desktop.png` and `.context/sidebar-fixed-chrome-mobile.png`. Production/package builds, lint, all 153 package tests, and whitespace checks pass. No publication or deployment was performed; cross-browser and screen-reader checks were not repeated.

## Single and bulk flow deletion - 25 September 2026

Your flows now has independent selection checkboxes, filtered select-all, a selected count and Clear action, a per-flow trash button, and Delete selected. Owners/editors confirm permanent deletion of whole flow families, including all versions, screens, boards, visits, and attached discussions. Unfinished recordings block deletion, with the server rejecting an entire mixed batch before any writes. Workspace board autosave must finish first. Confirmed deletions are filtered locally to prevent an older poll from restoring removed items; the current review falls back to a remaining flow or the empty workspace. Existing same-page live comments, personas/settings, and unrelated flows are preserved. The confirmation uses the embed's scoped portal theme; narrow review tabs wrap instead of overflowing. PRODUCT.md, PLAN.md, and both READMEs are aligned.

All 153 package tests pass. Seven new server cases cover complete family/version deletion with foreign keys on and off; removal of replies, connection discussions, visits and private screenshot access; idempotent retry; bulk atomicity around active recordings; owner/editor/commenter and origin boundaries; malformed, duplicate and oversized selections; external-storage cleanup failure/retry; shared screenshot references; and deletion racing new-version creation. Local database/files and a mocked custom storage adapter were exercised. Deletion reuses the durable opaque artifact-cleanup queue without adding a new schema migration.

`.context/flow-deletion-check.cjs` runs the real server handler against an isolated database/artifact directory under `.context/`, with test-only browser API routing. It verifies single/all-version and multi-flow deletion, pointer/keyboard checkboxes without navigation, filtered select-all, clear selection, Cancel/Escape and focus return, failed-request retry, busy dismissal protection, active-recording controls, failed autosave preventing deletion, recovery, retained live-page comments, stale-state responses after deletion, commenter controls, reload persistence, and deletion to an empty workspace. Desktop, 390px confirmation, and 320px selection layouts were checked for fit. Screenshots inspected: `.context/flow-delete-selection-desktop.png`, `.context/flow-delete-confirm-desktop.png`, `.context/flow-delete-selection-mobile.png`, and `.context/flow-delete-confirm-mobile.png`. Expected injected HTTP 503 responses test deletion/autosave recovery; no unexpected browser errors occurred. No existing user recordings, comments, or settings were deleted.

Production/package builds, lint, formatting, and whitespace checks pass. No publication, deployment, or fresh external-host installation was performed. Deletion is permanent, not archival or Undo. Failed external-file cleanup must be retried with the same family IDs (the open confirmation provides this); opaque pending keys remain durable, but there is no background cleanup worker. Cross-browser, screen-reader, hosted-database, and real external-storage checks were not repeated.

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

The first mobile check found an overflowing expanded thread; above/below placement with a constrained mobile height corrected it. Source review also identified offscreen-pin and failed-image cases, both addressed and browser-checked. Eight deterministic

## Recording Stop recovery — 3 October 2026

Fixed the zero-screen Stop loop: the widget blocks new captures, waits for its pending capture, then calls an atomic server finish operation. Persisted screens are completed regardless of the browser count; empty unfinished drafts use the existing authorized discard cleanup. Failed requests keep a stopped retry state, and repeated completion/empty cleanup is idempotent. Workspace history records the transition.

Validation: `npm run lint`, `npm run build`, and all **222 package tests** passed. Ten added regression tests cover stuck/empty sessions, stale zero counts, pending-upload ordering, failed capture and completion retry, session replacement, server idempotency/history, previous-version preservation, permissions, and concurrent capture/Stop. Existing discard tests also passed after sharing transaction-level cleanup.

Local Chromium checks used an isolated database under `.context/` and seeded recording state to reproduce the reported stuck session. The actual collapsed-widget **Stop recording** button cleared an empty draft with the explicit nothing-saved notice; a stale zero count completed a server-persisted screen and showed its exact View recording link; an injected HTTP 503 displayed an error and retained the stopped draft, then a second click completed cleanup. Browser assertions waited for the visible response after React rendered. No styling or component markup changed. A fresh package installation, hosted deployment, and other browsers were not retested.

## Notification settings and setup wizard — 3 October 2026

Integrated latest `origin/main` (fast-forward to `9d99002`) on the existing branch. Added owner-only notification configuration, encrypted/redacted secrets, explicit default email transport, shared settings/wizard UI, and best-effort email/Slack event delivery. No external provider accounts or Slack installations were created, and no real messages were sent.

- `npm run build:package`, `npm run test:package`: 217 tests pass, including 15 new notification tests and one new wizard migration test. Coverage includes owner/role and origin boundaries, denied federation administration, encryption and local key permissions, host-key requirements, redaction/history exclusion, restart persistence, secret retention/removal, invalid defaults and stale revisions, default-provider routing for passwordless login, custom SMTP/SMTP.dev transport options, event switches, comment/reply timing, saved-issue/reused-capture behavior, independent channel failures, test delivery/status, stalled HTTP/SMTP provider deadlines (including the federation proxy budget), and old wizard-step migration.
- `npm run lint` and `npm run build`: pass. The final lint run used the normal repository command after removing the temporary isolated browser host; earlier runs excluded only `.context/**`.
- Browser: a separate Next.js fixture and SQLite database under `.context` preserved the user's running dev server and existing workspace data. Walked all seven wizard steps, rejected an incomplete Resend default without advancing, retained Custom SMTP drafts across tabs, saved dummy provider credentials, reloaded with the same default and blank secret fields, advanced to Users & roles, finished setup, and found the same values in Settings → Notifications.
- Verified keyboard arrow navigation between provider tabs leaves the default unchanged, and checked layouts at 1440px and 390px. Fixed the seven-step progress indicator's mobile overflow; both the wizard and notification settings now report a document width of 390px at that viewport. Notification inputs and unselected control boundaries use contrasting gray tokens. Axe WCAG A/AA checks of the notification form found no violations in the inspected mobile SMTP.dev and desktop Resend views.
- Evidence: `.context/notifications-preview.png`, `.context/notifications-settings-desktop.png`, `.context/notifications-settings-mobile.png`, `.context/notifications-wizard-mobile.png`, `.context/notification-accessibility.json`, `.context/notification-accessibility-desktop.json`, and the `notification-*.log` files.

Limits: transport tests use mocked Resend/Slack endpoints and Nodemailer. Real SMTP TLS negotiation, provider acceptance/receipt with live credentials, Slack channel permissions, cross-browser/mobile-device behavior, and a hosted shared-database deployment were not exercised. SMTP.dev is explicitly a sandbox; its saved management API key is not used for sending. Event delivery has bounded timeouts and no background retries. The issue event means accessibility findings saved on a new recorded screen, not a new standalone issue tracker.
## Installer empty route folders — 3 October 2026

The installer now recursively permits reserved route trees containing only empty directories, including leftover `access/` and `[...path]/` folders and reserved paths inside route groups. Files and symbolic links still block initialization before host changes. PRODUCT.md, PLAN.md, and the package README describe the local, unpublished refinement.

Regression checks reproduced both nested-empty failures before the fix. After the fix, `npm run build:package`, all 38 CLI tests, `npm run lint`, and `git diff --check` pass. New tests cover both app roots, empty and nested-empty folders, route groups, dry-run, generated routes, repeat initialization, empty/hidden/nested file conflicts, dangling links, and a reserved directory symlink. File-conflict cases verify the host layout, package manifest, and existing file remain unchanged. Checks use isolated temporary host fixtures; no external project was modified and no package was published. The root production build and browser checks were not repeated for this CLI-only change.
