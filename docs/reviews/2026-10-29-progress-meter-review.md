# Progress and meter verification

Implemented on `codex/progress-meter-controls`. The user approved native progress/meter controls and backlog cleanup; this work does not publish a release. Existing release identity and install pins remain v3.6.0, while the changelog and new component-reference entries explicitly identify the additions as unreleased.

## Result

- `progress.progress` supports zero, partial, complete, and indeterminate task completion with native names and ranges. `meter.meter` supports bounded measurements and native threshold selection in either direction of preference.
- Both fill from inline start, fit narrow columns and enlarged text, and use existing palette tokens and functional borders. Reduced motion and print pause a visible indeterminate segment; forced colors restores native paints. No interaction script, new root token, or consumer dependency was added.
- The catalog now documents 38 component families. The showcase includes all progress states and three meter ranges, with visible labels, measurements, and threshold interpretation. Consumer/agent documentation and distributable mirrors are synchronized.
- BACKLOG.md removes the DTCG export completed in 3.6.0 and the implemented progress/meter work, separates container queries from menus, places container-aware layouts next, and updates the select-chevron note for five palettes. Deferred palette, eyebrow, relative-color, and hover work remains deferred.

## Evidence

The pre-implementation regression case reproduced native bars overflowing a narrow column at a 32px root. Rendered-pixel tests then caught Chromium's hidden meter fill under a universal appearance reset. CSS feature queries preserve Blink's native appearance while applying the required reset in Firefox/WebKit. Visual review caught Blink's inner grid halving the painted track height; spanning its full grid fixes it. Forced-color tests also required reverting the complete custom appearance, rather than only the fill colors. The motion-direction test recreates its frozen indicator so elapsed animation time cannot affect the sample.

| Check | Result |
|---|---|
| Full Linux browser matrix | **309 passed, 11 expected skips** using the matching official Playwright 1.62.1 image and a read-only archive of `2ac0be9`. Chromium, Firefox, WebKit, and mobile Chromium; all existing route/type/direction cases included. |
| Full macOS browser matrix | **232 passed, 8 expected skips** in Chromium, WebKit, and mobile Chromium against the same implementation. Local Firefox still cannot start; the working Linux runtime supplies Firefox coverage. |
| Indicator behavior | Native label/description/range exposure, zero/full/updated values, indeterminate transitions, keyboard tab order, actual painted fills and RTL direction, meter thresholds and changed optimum, normal/reduced motion, print, and forced colors. |
| Palette and sizing | All five palettes in both modes at a 32px root in a narrow RTL container, plus normal-root LTR/RTL cases. The full existing suite retains all 20 published routes and its 16/20/24/32px typography/direction matrix. |
| Visual review | Local showcase reviewed in light, dark, and auto. Progress and meter share the full inner track height; native names and values were visible in the browser accessibility tree. Theme was restored to auto. Dark screenshot is stored outside tracked sources at `.claude/screenshots/progress-meter-dark.jpg`. |
| Static checks | **280 contrast pairs**, both token generators, five token-export tests, component/changelog generation, deployment placeholders, repository contract, mirror parity, and whitespace checks pass. |

Expected skips are existing platform/input-specific exclusions plus forced-color emulation outside Chromium. VoiceOver and native Windows testing remain skipped at the user's request. WebKit automation is not a native Safari or assistive-technology certification, and no new native Safari/manual zoom pass is claimed.

## Implementation references

- [HTML progress](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress) and [HTML meter](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meter) define the native range and labeling model.
- [MDN meter styling](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::-webkit-meter-bar) documents the Blink/WebKit appearance difference. Chromium's [UA stylesheet](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/html/resources/html.css) defines the inner meter grid.
- Modern Web Guidance's `progress` guide informed the separate vendor rules, native semantics, transform-based RTL indeterminate motion, and visible paused reduced-motion state. The implementation uses features supported by the repository's browser floor; it does not depend on `revert-rule` or newer `accent-color` behavior.
