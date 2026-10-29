# Inkwell follow-up completion review

Reviewed 2026-10-29. The approved verification, resilience, and token-portability work is implemented locally on `codex/improve-design-system-resilience`. This report supersedes the open follow-up items in the [initial review](2026-10-29-design-system-review.md). VoiceOver and Windows testing were explicitly skipped at the user's request.

## Result

Keep Inkwell's visual identity and dependency-free install. The follow-up adds ten optional semantic color aliases, a typed design-tool export, viewport-aware hints, and coverage for every published reference route. No existing palette token, component override contract, or browser floor was removed. No push, release, or deployment was performed; the changes remain Unreleased above version 3.5.0.

## Completed changes

| Area | Implemented behavior |
|---|---|
| Semantic colors | Four `--surface-*` and six `--text-*` aliases follow the active root palette and mode. Tailwind exposes surface/content utilities; legacy utilities remain available. Existing components continue using their original tokens so local primitive overrides keep working. |
| Design-tool export | Optional `inkwell.tokens.json` uses [DTCG Format/Color 2025.10](https://www.designtokens.org/TR/2025.10/format/) types and references. It contains 590 typed entries: 40 shared foundations plus 55 entries for each of five palettes in two modes. It is a generated exchange file, not a browser dependency. |
| Compatibility | Removing only the new `color.aliases` group makes the generated `tokens.json` identical to the previously reviewed `2260fce` version, including all existing fields and values. CSS remains the source of truth for both exports. |
| Hints | The companion clamps hints horizontally, chooses above/below placement, and updates active hints on scroll and resize. Direct placement avoids mobile Chromium retaining the earlier overflow area. Hidden and Escape-dismissed bubbles do not expand the page. Existing markup, contained focus, pointer persistence, and Escape behavior remain supported. |
| Narrow compositions | Grid children can shrink; profile headers, bylines, toolbars, and carousel indicators wrap. Long translated button/choice labels fit without shrinking selection indicators. Search actions retain readable labels and minimum heights. |
| Reference correctness | All tooltip-bearing pages load the companion. A static gate enforces that dependency. Search filters/results have a logical heading outline. The landing example describes the current three-file install. |
| Maintenance | Generated references, both exports, consumer/agent guidance, changelog, and CI gates are synchronized. The browser suite discovers published HTML files instead of maintaining a selected route list. |

The edge-hint and long-label failures were reproduced before implementation. Expanded route checks then exposed additional reflow and missing-companion issues, which were fixed. Linux Firefox also exposed a test that sampled a transitioning checkbox border; that assertion now uses non-animated token probes and waits for the actual controls to match.

## Verification evidence

| Check | Result and limits |
|---|---|
| Desktop Chromium, WebKit, mobile Chromium | **116 passed, 4 expected skips** in the full 120-test matrix. Targeted reruns cover the subsequent heading/search-layout refinements, stable color reference, and final component-reference copy. |
| Desktop Firefox on Linux | **38 passed, 2 expected skips**, using official `mcr.microsoft.com/playwright:v1.62.1-noble` and pinned Playwright 1.62.1 against a read-only Git archive of `8ff9929`. This closes the Firefox execution gap in the initial review. |
| Combined browser matrix | **154 passed, 6 expected skips**. Skips are the coarse-pointer assertion on three desktop projects, forced-colors emulation outside Chromium on two projects, and mouse-hover behavior on mobile. No failed browser checks remain. |
| Route/mode coverage | All 20 published pages are checked for runtime errors, landmarks, tooltip dismissal where applicable, and page-width layout in light/dark/auto. Every route is also checked at 640px and 320px. These correspond to the CSS layout width of a 1280px desktop at 200%/400% zoom; they are not native zoom or screen-reader tests. |
| Interaction regressions | Tests cover hint corners, long hints, resize, scroll-triggered side changes, contained focus/Escape, hover persistence, RTL/vertical/disabled/nested tabs, dialog return focus, carousel controls, invalid-state relationships, translated labels, and coarse-pointer targets. |
| Native Safari at 200% | Page Zoom was visibly confirmed at 200%. Keyboard form navigation, arrow-key tab activation, dialog entry, Escape dismissal, and focus restoration worked. Zoom was restored to 100%, and the temporary test tab was closed. This was a functional check; no native Safari screenshot or VoiceOver pass is claimed. |
| Visual review | The showcase was reviewed in light/dark/auto at 2× display scale, the Tailwind semantic panel in light/dark, and the corrected 320px search composition with a visible hint. Temporary viewport/theme overrides were restored. Captures are saved outside the repository. |
| Contrast and static gates | All **240** palette/mode contrast pairs pass. Both token-generation checks, four export tests, changelog/reference generation checks, deployment placeholders, system contract, mirror parity, and `git diff --check` pass. |
| Interchange schema | `inkwell.tokens.json` validates against the [official DTCG 2025.10 JSON schema](https://www.designtokens.org/schemas/2025.10/format.json). Repository tests additionally verify complete CSS-token coverage, typed values, acyclic/resolvable references, and palette-specific aliases. Schema tooling was ephemeral; no dependency was added. |

Reproduce the browser matrix with the repository's ephemeral runner. Linux verification follows the [official Playwright Docker guidance](https://playwright.dev/docs/docker), using the matching image/package version, an immutable read-only source snapshot, and test output outside that snapshot.

## Design-detector triage

The confirmed search heading problem was fixed. The scan of canonical CSS/JS and affected reference surfaces has **zero remaining primary findings** after narrow, documented exceptions:

- Existing dialog overshoot remains intentional, as documented in the initial review; only the exact easing value in canonical/mirrored tokens is excepted.
- Imported typography is misread as 16px by the static detector. Browser-resolved values establish the hierarchy: 48/24/19px in the component reference; responsive 38px-or-larger landing title with 27/19px sections; 32px search title with 17px result titles. File-scoped exceptions preserve these choices and the original preview specimen.
- The component-reference padding warnings are false positives: all 144 contract sections resolve to 16px padding and 1.5px borders. Only this rule on that reference page is excepted.
- The Tailwind 11px eyebrow labels and two short uppercase landing metadata lines are intentional demonstrations of documented roles. Actual theme-action labels were raised to the 12px caption token. Body text remains 16px and explanatory text 14px.

Exceptions were persisted using Impeccable's `hooks ignore-value` command in `.impeccable/config.json`. No whole-file or project-wide rule ignore was added. **Seven advisory notes remain unsuppressed**: two em-dash-frequency notices and five numbered-section-label notices. These were retained as editorial/style observations, not treated as accessibility failures.

## Deliberate limits and future decisions

- **VoiceOver and Windows High Contrast/NVDA/Narrator: skipped by user instruction.** Chromium forced-colors emulation and keyboard checks do not establish native screen-reader compatibility. They are not reported as completed native verification.
- The native Safari check covers 200% browser zoom; the 320px fixture covers reflow equivalence. A full text-only zoom/default-font-preference audit has not been claimed.
- Long-label resilience and tab RTL behavior do not establish full bidirectional support. The existing pixel type scale and physical carousel/select positioning remain unchanged. The [relative-type and bidi measurement plan](../plans/2026-10-29-relative-type-and-bidi.md) defines the next evidence needed before either migration.
- Semantic aliases resolve on `:root`. Descendant primitive overrides need a corresponding semantic override when new custom CSS opts into those aliases; existing components retain their previous local-override behavior.
- Tooltips remain supplemental visual hints. Keep accessible names/descriptions in the DOM and use visible help or native disclosure for essential or touch-critical instructions.
