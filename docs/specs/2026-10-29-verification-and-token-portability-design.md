# Approved follow-up: verification and token portability

The user approved completion of the review's four next steps on 2026-10-29. Continue spec → plan → implementation without further gates.

## Contract

- Preserve the current design, existing token names/values, browser floor, six distributables, and dependency-free consumer install.
- Cover every published reference route in Chromium, Firefox, WebKit, and mobile Chromium. Check light/dark/auto and 320px reflow. Verify 200% browser zoom on a native browser where available, with an honest distinction between layout-equivalent automation and native assistive technology.
- Use the local Linux browser environment to resolve Firefox verification if the macOS runtime remains unable to start. Do not publish or deploy just to obtain a check result.
- Keep existing tooltip markup and CSS fallback. Enhance the companion with viewport-aware horizontal placement and above/below flipping, including resize/scroll updates and long hints. Preserve hover persistence, Escape dismissal, and dialog behavior.
- Add semantic color aliases without removing palette-named tokens. Expose them in Tailwind, legacy JSON, and the component reference guidance. Prove that every palette/mode follows the original values and that consumer overrides work.
- Add an optional generated `inkwell.tokens.json` export using stable DTCG 2025.10 types and references. Include every canonical token across all five palettes and both modes, with shared structural foundations. Keep `tokens.json` compatible and protect both exports against drift.
- Record native screen-reader checks actually performed. Windows High Contrast with NVDA/Narrator requires a Windows environment; emulation must not be described as that native verification.

## Acceptance

Reproduce new tooltip/long-label failures before implementation. Run zero-dependency generation/contract checks, validate DTCG types and alias resolution, use the official schema as an additional check, and run browser tests against an immutable repository snapshot for Linux. Review light/dark/auto and Tailwind visuals at 2× scale. Commit changes in focused steps and leave deployment pending.
