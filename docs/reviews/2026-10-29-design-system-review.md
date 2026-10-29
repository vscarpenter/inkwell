# Inkwell design system review

Historical first-pass report. The approved follow-up is recorded in the [completion review](2026-10-29-completion-review.md), including resolved Firefox/tooltip gaps and user-requested testing skips.

Reviewed 2026-10-29. Changes are local and unreleased on `codex/improve-design-system-resilience`.

## Verdict

Keep the current design direction. The serif headings, cool neutral surfaces, restrained accent, platform fonts, and 1.5px frames form a coherent identity. The useful modernization work is in component behavior, accessibility, and resilience. This pass implements those improvements and updates the consumer contract. Firefox execution and native assistive-technology testing remain verification limits, not confirmed component failures.

## Checked

- Canonical token/component CSS, the optional interaction companion, the component manifest, generated references, consumer instructions, and verification workflows.
- Text/control contrast, focus and keyboard state, hover content, forced colors, enlarged/spaced labels, narrow containers, and page reflow.
- Eight critical reference routes in desktop Chromium, desktop WebKit, and mobile Chromium, including 320px reflow. This is not an exhaustive behavior review of all 20 pages.
- Visual inspection of the preview in auto/light/dark at device pixel ratio 2, Chromium forced-colors emulation, the Tailwind reference, and the palette comparison.

## Findings and changes

| Priority | Confirmed issue | Implemented change and evidence |
|---|---|---|
| High | Text controls used the decorative border; empty fields depend on that edge to be recognizable. The contrast gate already tested a suitable functional token, but the controls did not use it. | `.input`, `.textarea`, and `.select` use `--control-border`. `aria-invalid="true"` also applies the established error treatment. Browser tests check the actual resolved styles; all 240 palette/mode contrast checks pass. See [component CSS](../../inkwell-components.css) and [non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). |
| High | Custom selection indicators depended on fills and pseudo-elements without a forced-colors fallback. | Checkbox, radio, switch, and select restore native appearance; custom marks and select artwork are removed in forced colors. Focus, active tabs, and carousel dots use system colors. Chromium keyboard tests and a visual check verify checked/unchecked affordances. See [MDN forced colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/forced-colors). |
| High | Tooltip content could not be hovered and had no Escape dismissal. Wrappers did not respond to contained focus. | The bubble accepts pointer hover, a transparent border bridges its gap, and `:focus-within` supports wrapped triggers. The companion dismisses with Escape without moving focus. DOM descriptions carry the accessible hint; generated content uses an empty alternative where supported. Pointer and keyboard regression tests pass. See [hover/focus content requirements](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html). |
| Medium | Tabs assumed horizontal LTR navigation and included unavailable or nested options. Text-only panels supplied no keyboard stop unless consumers added one. | Tab ownership is scoped to its nearest tablist; disabled options are skipped. Horizontal arrows honor reading direction, vertical lists use Up/Down, and panels receive a default keyboard stop while preserving explicit `tabindex`. Tests cover RTL, vertical orientation, nested ownership, and repeat initialization. See [WAI-ARIA tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). |
| Medium | Fixed-height controls could clip enlarged labels; a 280px grid minimum overflowed smaller containers. At 320px, the preview table/section metadata and app-shell navbar also exceeded the page. | Text-bearing controls use minimum heights, grids cap their minimum to container width, section headings and navigation wrap, and the preview table scrolls in a named keyboard-reachable region. Tests cover enlarged/spaced labels, a 240px container, and all eight critical routes at 320px. See [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). |

The first eight component regression tests failed against the original implementation and passed after the fixes. The 320px checks then exposed the additional reference-page issues above. The tooltip is an existing CSS family newly registered in the manifest; the catalog now documents 36 families.

## Passed

- All six static checks: token generation, changelog/version generation, component-reference generation, deployment placeholders, contrast, and repository contract. `git diff --check` passes.
- Browser suite: **62 passed, 4 intentionally skipped** across desktop Chromium, desktop WebKit, and mobile Chromium using the repository's pinned Playwright 1.62.1. Skips are pointer/device-specific or unavailable forced-colors emulation.
- A targeted rerun of the component tests passes **25 checks with 2 intentional skips**, covering the final tooltip bridge refinement without reserving the button spinner's `::before` pseudo-element.
- Existing themes, palette selection, native dialog focus restoration, carousel controls, invalid-field relationships, 44px coarse-pointer checks, and critical-page runtime checks continue to pass within that scope.
- Light/dark color tokens and their generated JSON values remain unchanged; canonical and example distribution files match byte for byte.

## Verification limits

- Firefox is configured in the local suite and Linux CI, but local execution could not be verified. Playwright 1.64.1's Firefox exits before loading a page with “Could not find profile folder”; the pinned 1.62.1 runtime stalled during startup. A canonical temporary-directory retry did not resolve the newer runtime failure. Browser startup now has a 30-second bound. No Firefox component behavior is claimed as passing.
- Forced-colors emulation does not replace Windows High Contrast with NVDA/Narrator. Visual/keyboard checks do not replace VoiceOver with Safari or testing with disabled users.
- The enlarged-text fixture checks component containment with 28px labels and increased spacing. It is not a full 200% text-only zoom audit or a guarantee that every consumer composition reflows.
- Custom tooltips still need the companion for Escape. CSS-only consumers should use visible help or native disclosure for instructions. Near-edge tooltip positioning and full-page RTL support remain future work.
- No push, release tag, or deployment was performed. The published version remains 3.5.0; changes are in Unreleased.

## Left alone

- Kept the existing border weight, platform fonts, palettes, type hierarchy, flat panels, compact rhythm, and minimal motion. Generic style recommendations for added shadows or animation would conflict with this system's deliberate identity.
- Kept the documented browser floor and dependency-free install. New platform features should earn their compatibility/fallback cost; this review does not introduce a framework, polyfill, or consumer build step.
- Kept the existing token JSON schema so existing consumers continue to receive the same export.

## Next improvements, in order

1. **Complete native accessibility verification.** Resolve local Firefox startup or obtain passing Linux CI results, then review VoiceOver/Safari and Windows forced colors with a screen reader. Prioritize forms, tooltip hints, tab panels, sticky headers, and dialogs.
2. **Add semantic token aliases gradually.** Names such as `--surface-page`, `--surface-panel`, and `--text-primary` would make component intent clearer than palette nouns while preserving existing tokens as aliases. Treat this as an additive API proposal with documentation and export mapping.
3. **Offer an optional DTCG export when a tool integration needs it.** Current `tokens.json` is an Inkwell-specific resolved mirror. A separate exporter could target the stable [Design Tokens Format Module 2025.10](https://www.designtokens.org/TR/2025.10/format/) without replacing it. This is a Community Group specification, not a W3C Recommendation; no converter or new generated asset was added here.
4. **Plan a measured relative-type and internationalization pass.** Test browser font preferences and translated labels before migrating the pixel-based type scale to relative units. Audit physical properties, select arrows, and carousel scroll coordinates before advertising full RTL support. The tab fix alone does not establish that support.

These are recommendations, not implemented features. The highest-leverage remaining step is native accessibility verification; a broad visual redesign is not needed for the issues found in this review.

## Design-hook follow-up

Two hook warnings were reviewed against current source, the baseline commit, and browser-resolved values. Neither required a visual change:

- `bounce-easing`: the existing `--ease-pop` value is explicitly documented as a slight overshoot in §1.7 of `DESIGN_SYSTEM.md`, used for the 150ms native dialog reveal, and covered by the reduced-motion override. Its exact value is excepted only in the canonical token file and its example mirror.
- `flat-type-hierarchy`: the detector reported every heading as 16px, while the browser resolves display/h1/h2/h3 to 48/32/24/19px against a 16px body. This is a false positive on the intentional typography specimen. Only this rule is excepted in the canonical preview and its example mirror.

The exceptions were persisted through Impeccable's `hooks ignore-value` command in `.impeccable/config.json`. The follow-up scan has no warnings; an advisory about em-dash frequency remains unsuppressed. No copy changes or broader rule/file exclusions were made.
