# Relative typography and RTL completion review

October 29, 2026. Implements the [approved design](../specs/2026-10-29-relative-type-and-rtl-design.md) and [implementation plan](../plans/2026-10-29-relative-type-and-rtl-implementation.md) on `codex/relative-type-rtl`, starting from `35bea12`. This supersedes the typography/bidi follow-up in the earlier completion review. It does not publish a release or change production.

## Result and compatibility

The nine type tokens, component text, and reference-page text use relative units. The browser root remains unset. Default type-role sizes remain 48/32/24/19/20/16/14/12/11px at a 16px root, with the same platform families. Optical 1.5px frames, spacing, colors, and radii retain their units. Text-bearing controls grow; ordinary text and example grids wrap instead of extending the page.

Fluid headings, pull quotes, and findings combine a relative preferred term with viewport scaling and relative bounds. Their intermediate default sizes can differ slightly from the old viewport-only curve; they do not promise proportional preference scaling at every viewport. Native text-only zoom is verified separately below.

`tokens.json` retains existing numeric typography `px` fields as 16px references, adds each role's `css` string and `typography.reference_root_px`, and preserves numeric consumers. `inkwell.tokens.json` exports actual typed `rem` dimensions. Tailwind aliases keep their names and resolve through the same tokens. Custom code that parses CSS variable strings must handle the new units; use an element's computed `font-size` when actual pixels are needed. Local pixel overrides continue to freeze text and should migrate to relative units.

RTL support now covers logical layout and direction-aware interactions, including nested opposite-direction components. Reading-start rules, timelines, tables, select artwork, switch travel, copy/close controls, navigation, and opted-in arrows follow their context. Carousel navigation uses slide geometry rather than positive scroll offsets; keys follow reading direction, while Previous/Next and Home/End retain document sequence. Resize and repeated initialization preserve selection, and localized dot templates refresh without duplicate controls.

Arabic-family and Hebrew labels avoid Latin tracking/uppercase. Arabic-family headings have extra leading, and joining-script drop caps retain normal word shaping. Code examples explicitly isolate LTR code. The copy control has its own row so it cannot cover code in either direction. Visible labels were added to two preview inputs, palette-comparison metadata was raised to 12px-equivalent text, and the comparison skip link no longer creates RTL overflow.

Authors still supply translations, accessible names/roledescriptions, `lang`, HTML `dir`, and mixed-content isolation (`bdi`, `dir="auto"`, or explicit language/direction islands). The contract covers horizontal writing, not vertical writing or certification of every language/OS/font combination. See [the authoring guide](../../DESIGN_SYSTEM.md#reading-direction-and-language).

## Measurements and verification

Before production edits, regression checks failed for font-preference scaling, reading-start geometry, RTL switch movement, Arabic tracking, and actual carousel positioning. The immutable `35bea12` baseline also failed the real Firefox preference check: a 20px root still rendered 16px body text. After migration, real 16/20/24/32px Firefox defaults produce matching body sizes and 14/17.5/21/28px buttons.

| Check | Evidence |
|---|---|
| Default appearance | All nine type roles retain their original computed sizes at the default root in Chromium, Firefox, WebKit, and mobile Chromium. This is size parity, not a claim of pixel-identical screenshots across OS fonts. |
| Cross-engine text growth | All nine roles follow 20/24/32px root settings; buttons, badges, keyboard chips, copy controls, and carousel arrows contain their text. |
| Published routes | All 20 routes at 1280/640/320px × 16/20/24/32px roots × LTR/RTL: 480 reflow configurations per project, 1,920 across four projects. Focused RTL skip links remain within 320px; LTR code islands retain direction. |
| Palettes and themes | Arabic/Hebrew fixture at 320px and a 32px root across all five palettes, light/dark/auto, and both page directions; nested scopes keep their declared direction. Existing browser-smoke coverage continues testing every published route's themes. |
| Interactions | RTL switch travel; logical timeline/callout rules; select chevrons; non-overlapping copy controls; Hebrew tab keys; RTL tooltip edges and Escape; Arabic dialog actions and focus restoration; carousel buttons/dots/keys/manual scroll, smooth navigation, resize, and reinitialization into a nested LTR context. |
| Native Safari text-only zoom | Used **Make Text Bigger**, not page zoom. Four steps produced computed body sizes 19.20 → 23.04 → 27.648 → **33.177601px**, with measured glyph heights 120/144/173/**207%** of initial. At the final step, Arabic dialog content/actions remained visible, Escape returned focus, mixed English/Hebrew content wrapped, and carousel Next reached the second Arabic slide. Restored Actual Size: **16px / 100%**, then closed the test tab. This native check was at the desktop window size; the multi-width matrix is automated separately. |
| Linux full suite | Matching official Playwright 1.62.1 container, all four projects, read-only source snapshot: **279 passed, 9 expected skips**. |
| macOS full suite | Chromium, WebKit, and mobile Chromium: **209 passed, 7 expected skips**. Firefox's working Linux runtime supplies Firefox coverage. |
| Static gates | Both token exports, five token/export tests, changelog/reference generators, 20 deployment placeholders, system contract, mirrors, all 240 contrast pairs, and `git diff --check` pass. |

Browser suites use the existing ephemeral runner; no consumer package metadata or dependencies were added. The test-only [fixture](../../tests/fixtures/typography-direction.html) includes manual size/direction/theme controls and a rendered-text measurement, without adding a published page. Native enlargement is measured against that page's initial glyph height, not inferred from a keyboard shortcut count.

Screenshots are saved outside the repository in the task's October 29 visualization folder: `inkwell-rtl-arabic-light.png`, `inkwell-rtl-hebrew-dark-32px.png`, `inkwell-rtl-enlarged-dark.png`, `inkwell-safari-text-only-207.png`, `inkwell-safari-rtl-dialog-207.png`, and `inkwell-safari-rtl-carousel-207.png`.

## Detector triage

The final Impeccable scan of canonical CSS/JS, the starter/fixture, and all published examples has **zero primary findings**. Twelve editorial advisories remain unsuppressed: seven em-dash notices and five numbered-section-label notices. This broader scan does not treat existing editorial choices as regressions.

- **Fixed:** 10px palette-comparison functional labels/footer became relative 12px caption-size text. The supplemental UI Craft scan also exposed unlabeled preview inputs and missing fixture email autocomplete; labels/autocomplete were supplied.
- **Suppressed narrowly:** imported-token `flat-type-hierarchy` false positives on the fixture and eight reference pages. Browser assertions prove the fixture's 48/32/24/19px heading roles against 16px body. Final browser inspection resolves docs/forms headings to 48/27px, not-found to 32/19px, the index hero to 62px, and carousel/dashboard/roadmap/settings h1 to 48px, all against 16px body. The index's eight swatches also resolve to 12px padding and 1.5px borders; its `cramped-padding` warnings incorrectly read the imported spacing token as zero. Exceptions were persisted through `hooks ignore-value`, with these measurements, for the particular rules/files only. Existing motion/typography exceptions were preserved. No whole-file or global rule suppression was added.
- **Kept intentional:** the supplemental UI Craft detector flags mixed `rem` text and structural `px` units, even though this is the approved migration contract. Its focus warning misses the global `*:focus-visible` replacement; its JS warning misreads the tooltip's `:hover, :focus-within` check; duplicate tooltip `content` declarations are a deliberate accessible-content syntax fallback. Single-column fixture tables fit without a wide-table scroll wrapper; the preview's wide table already has `.tbl-scroll`. The inert Delete specimen has no destructive action. Inline specimen styling and editorial punctuation remain review notes. These were triaged against source/runtime evidence, without adding blanket ignores or claiming a universally clean static scan.

## Limits

- VoiceOver and Windows/NVDA/Narrator remain **skipped by the user's instruction**. Keyboard/forced-colors checks and native Safari UI inspection do not establish screen-reader conformance.
- OS Dynamic Type/Android font scaling was not tested; no experimental `text-scale` meta opt-in was introduced. The root/relative-unit contract is compatible with consumers evaluating that separately.
- Native single-line selects can truncate a long selected label at narrow widths. The full value remains available through the native picker and accessibility name/value; ordinary labels and actions wrap. Tables/code retain local scrolling where required.
- No translation review by native Arabic/Hebrew speakers was performed. The fixtures verify layout, shaping conventions, isolation, and interaction rather than production copy quality.
- Whole-page WCAG conformance and every language/platform combination remain contextual adoption checks.

The direction approach follows [W3C's HTML direction guidance](https://www.w3.org/International/questions/qa-html-dir.en.html), and the resize checks are informed by [WCAG 2.2 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html). These sources guide the implementation; they are not conformance certifications.
