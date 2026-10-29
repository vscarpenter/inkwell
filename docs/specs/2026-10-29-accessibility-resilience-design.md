# Accessibility and layout resilience

Date: 2026-10-29

Preserve Inkwell's serif headings, platform fonts, five palettes, 1.5px frames, compact desktop rhythm, and dependency-free distribution. Improve the existing contracts without introducing a new component family or changing installation.

## Changes

- Use the existing `--control-border` for text controls; style `aria-invalid="true"` as well as the legacy `.is-error` class.
- Restore native checkbox/radio/switch/select rendering in forced colors and keep selected tabs and carousel indicators visible with system colors.
- Let text-bearing controls grow beyond their minimum height. Let card grids fit containers below 280px without overflowing.
- Make tabs honor vertical orientation, RTL horizontal navigation, disabled options, and nested ownership. Keep text-only panels reachable by keyboard.
- Keep tooltip bubbles hoverable and visible while a contained control has focus. The optional companion provides Escape dismissal; tooltip text must also be available through an accessible name or description.

## Acceptance

Regression tests must demonstrate each failure before its fix. Run every existing static gate and the browser suite, add Firefox/WebKit desktop coverage, and inspect the preview in light, dark, and auto at 2× scale. Test Chromium forced-colors emulation separately from normal palettes. This is preparation for a release, not a published version or a claim of complete WCAG conformance.
