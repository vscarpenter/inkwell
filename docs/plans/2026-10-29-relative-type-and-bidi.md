# Relative type and bidirectional support: measurement plan

**Implemented October 29:** see the [completion review and measurements](../reviews/2026-10-29-relative-type-and-rtl-review.md), [approved design](../specs/2026-10-29-relative-type-and-rtl-design.md), and [implementation plan](2026-10-29-relative-type-and-rtl-implementation.md). The original baseline plan is retained below as history.

This records the remaining measurement work recommended by the October 29 review. The current follow-up adds long-label resilience and tests RTL tabs; it does not change the established pixel scale or advertise full RTL support. VoiceOver and Windows testing remain skipped for this review at the user's request.

## Relative type

1. Capture the existing type scale, 60–65ch reading measure, control dimensions, and 1.5px frame treatment at the default browser font setting.
2. Compare default font sizes of 16, 20, and 24px plus 200% text-only zoom in a browser that supports it. Exercise forms, segmented options, tabs, dialog actions, code blocks, navigation, and dense tables at 1280, 640, and 320 CSS pixels.
3. Prototype converting typography and associated line heights to `rem` in an isolated fixture. Leave optical border widths unchanged. Check that the default appearance stays equivalent and enlarged text can grow its controls without overlap or inaccessible actions.
4. Choose a migration only after the comparison identifies a user benefit. Document token/export changes and any compatibility impact; do not mechanically convert every pixel value.

Acceptance: no text loss or overlapping controls, no page-level horizontal overflow at 320px, readable line lengths, preserved keyboard order, and predictable response to browser font preferences. Tables and code may scroll within their named containers.

## Bidirectional layouts

1. Inventory physical `left/right`, borders, margins, padding, transforms, and scroll-coordinate assumptions in canonical CSS, the companion, and public examples.
2. Use Arabic and Hebrew labels plus mixed-direction names, URLs, dates, and counts. Test `dir="rtl"` at the page and nested-container level; preserve meaningful content order rather than reversing every row.
3. Review select chevrons, input affordances, breadcrumbs, pagination, inline icons, bylines, timelines, tooltips, dialogs, and carousel direction/`scrollLeft` behavior. Tab navigation already has a bounded RTL regression test.
4. Prefer logical properties where they express layout intent. Keep physically meaningful artwork and gestures deliberate. Check light/dark and all five palettes after the prototype.

Acceptance: complete keyboard access, consistent visual/reading order, correct start/end affordances, no clipped translated labels or viewport-edge hints, and correct carousel controls across Chromium, Firefox, and WebKit. Native assistive-technology verification requires a separately available and authorized test environment before claiming that coverage.
