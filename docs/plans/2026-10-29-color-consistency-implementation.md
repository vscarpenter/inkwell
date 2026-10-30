# Implementation plan

1. Add browser regressions for palette-matched native chevrons and primary-button hover contrast; reproduce the light-chevron and Clay dark-hover failures.
2. Lift Clay's dark hover color and add light-mode chevron overrides to the four palette files. Keep dark/auto arrows screen-only so print follows its existing light palette, preserving native controls.
3. Synchronize exports and mirrors, update the design-system explanation and unreleased changelog, and organize the backlog into the agreed groups.
4. Run all static/export/contrast gates and the four-project ephemeral browser suite, including a working Linux Firefox runtime. Review light/dark/auto showcase and palette comparison views, save screenshots, and commit the completed work locally.

## Verification

- Reproduced the original Clay dark-hover contrast reduction and light-chevron mismatch before implementing the fixes. A separate regression reproduced the dark chevron on the forced-light print palette.
- Focused four-project browser checks: 26 passed, two expected forced-colors skips.
- Full Linux Chromium, Firefox, WebKit, and mobile Chromium suite: 375 passed, 13 expected skips, no retries.
- All 280 contrast pairs, five token-export tests, generated-file checks, deployment placeholders, repository contract, and whitespace checks pass.
- Visually reviewed Clay in auto/light/dark, its light and dark native select, its actual hovered primary button, and the five-palette comparison in light/dark. Saved local screenshot evidence.
- VoiceOver and native Windows testing remain excluded at the user's request. This change is committed locally and unreleased.
