# Clay hover and select-chevron consistency

Implement the approved color refinements and backlog organization in one pass. Keep the 3.8.0 release identity until a separate release request; preserve existing markup, browser support, native select pickers, and the dependency-free install. VoiceOver and native Windows testing remain excluded.

## Color contract

- Clay's dark `--accent-d` becomes `#E99B80`, lifting the resting `#E08B6E` coral away from its dark paper label. Label contrast increases from 6.49:1 at rest to 7.59:1 on hover/press. Light-mode Clay values stay unchanged.
- The native `.select` SVG chevron matches the active palette's `--gray-500` in light, dark, and automatic themes. Retain explicit SVG image declarations: a data URI cannot inherit page custom properties, and `light-dark()` cannot select image values at the supported browser floor.
- Add each variant's light chevron alongside its existing dark overrides. Preserve physical RTL arrow placement, native keyboard/form behavior, forced-colors affordances, and print rules. Do not mask the select or opt into a custom web-rendered picker.
- Regression checks must compare actual rendered arrow strokes with the resolved palette neutral, and compare actual primary-button contrast before/after hover. Keep generated token exports and published CSS mirrors synchronized.

## Backlog contract

Group remaining work into **Next**, **Needs a demonstrated use case**, and **Future major**. Remove the two implemented color items and document them under Unreleased in the changelog. Keep the popover menu as the next substantial feature; retain its keyboard/focus/RTL and browser fallback requirements. Keep conditional items conditional, with existing solutions called out.
