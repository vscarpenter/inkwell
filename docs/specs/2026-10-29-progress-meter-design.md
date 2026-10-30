# Native progress and meter

The user approved the progress/meter recommendation and backlog cleanup on October 29. Proceed through specification, implementation, and verification without another approval gate. Preserve the dependency-free CSS install, browser floor, palette tokens, relative typography, and native semantics. This scope does not publish or deploy a release. VoiceOver and native Windows testing remain excluded at the user's request.

## Public contract

- `progress.progress` represents task completion. A `value` (including zero) is determinate; omitting it is indeterminate. Native `max` defaults to one. Provide an associated label and visible percentage or task status outside the element. Do not add a role, redundant ARIA range attributes, or a tab stop.
- `meter.meter` represents a measurement within a known range, such as storage usage. Native `min`, `max`, `value`, `low`, `high`, and `optimum` own range semantics and threshold selection. Use the existing olive-dark, warning-dark, and rust tokens for optimum, suboptimum, and least-good ranges. Always provide a visible measurement and textual threshold interpretation; color is supplemental.
- Both bars fill from inline start, fit narrow containers, and use a compact relative height, pill radius, subtle track, and functional 1.5px boundary. Progress uses accent ink so every palette retains sufficient fill contrast.
- Indeterminate progress is a moving segment under ordinary preferences. Reduced motion and print pause a visible segment; do not imply an estimated percentage. This transient state is appropriate while discovering a task's total; existing busy buttons/skeletons remain available for other loading situations.
- Custom vendor pseudo-elements are isolated by engine. Forced colors restores native appearance and paints rather than opting out of the user's palette. No JavaScript is required to render either component; applications update native values, adjacent copy, and a polite completion status without moving focus.

## Adoption and verification

Add copyable manifest entries and showcase examples for zero/partial/complete/indeterminate progress and meter thresholds. Keep all distributed mirrors in sync. Update consumer/agent guidance, the unreleased changelog, and backlog: remove completed token-export work, split menus from container queries, and retain the remaining deferred decisions with current rationale.

Verify native names/ranges, value updates and transitions between determinate/indeterminate states, actual fill painting and RTL direction, all palettes/modes, 16/32px roots and narrow containers, reduced motion, print, forced colors, and plain CSS without the companion. Run the repository's full static and browser gates. Automated semantics checks do not substitute for screen-reader or native Windows verification.
