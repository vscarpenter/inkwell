# Implementation plan

1. Add a test-only native HTML fixture and browser regressions; reproduce missing enhancement/keyboard behavior before implementing the component.
2. Implement token-backed menu styling and the optional companion's state, keyboard, focus, native invoker/popover, anchor-positioning, and fixed-popup fallback behavior.
3. Add an interactive showcase and application example, register the family as Unreleased, update consumer/maintainer guidance and backlog, and regenerate references/mirrors.
4. Run focused native/fallback checks, all static/export/contrast gates, and the complete four-project Linux browser suite. Review real examples in light/dark/auto, RTL, and narrow/enlarged layouts; save screenshots and commit locally.

## Completion and verification

- Completed the contract, failing-first fixture/regressions, component implementation, public catalog, consumer/maintainer docs, examples, and backlog cleanup. The current-source catalog contains 39 families; the menu is marked Unreleased and the stable version remains 3.8.1.
- Final immutable-source run with Playwright 1.62.1 in its matching official Linux container: **471 passed, 13 existing skips**, no retries. Projects: desktop Chromium, Firefox, WebKit, and mobile Chromium. This includes 96 menu cases across native and feature-disabled Popover/invoker/anchor paths; it does not establish results on archived browser-floor binaries.
- Menu regressions cover keyboard entry/navigation/typeahead, Arabic and Turkish label matching, ARIA/native disabled semantics, dynamic and empty lists, idempotence, native link/form defaults, dialog handoff/return, outside dismissal, queued native events, fallback portals and local tokens, all palettes/modes, RTL, enlarged type, narrow/edge placement, live resizing/scroll dismissal, touch, forced colors, no-script markup, and print.
- All generation/deployment-placeholder/repository-contract checks, five token-export tests, 290 contrast pairs, and whitespace checks pass. Source CSS/JS/showcase mirrors are synchronized; no consumer tooling or dependencies were added.
- Reviewed the local showcase in light, dark, and auto, including Arabic RTL and menu → project confirmation → trigger focus restoration. Saved light/dark/RTL screenshots under `.claude/screenshots/` for local review. VoiceOver and native Windows testing remain excluded at the user's request.

The keyboard contract follows the [WAI-ARIA menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) and [menu](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) patterns. Native state synchronization follows the [Popover API lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using); queued toggle focus and missing-platform-feature paths have explicit regressions.
