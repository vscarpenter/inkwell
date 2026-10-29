# Inkwell token decisions

The owning sources are `inkwell-tokens.css` and `DESIGN_SYSTEM.md`; this file is an orientation, not another generated token catalog.

- Brand: Indigo & Cloud by default; Clay, Sage, Burgundy, and Azure override brand tokens. One saturated accent per interface.
- Modes: `color-scheme` plus single-declaration `light-dark()` tokens; derived alpha tints use `color-mix()`.
- Surfaces/text: `--ivory`, `--paper`, `--slate`, `--gray-700`, `--gray-500`; accent text uses `--accent-ink`, labels on accent use `--on-accent`.
- Semantic aliases: `--surface-page/panel/subtle/inverse` and `--text-primary/secondary/muted/inverse/link/on-accent` follow root palette tokens. They are opt-in; existing components preserve original primitive override behavior. Tailwind uses `bg-surface-*` and `text-content-*`.
- Interchange: `tokens.json` keeps its existing schema with additive aliases; `inkwell.tokens.json` is the optional typed DTCG 2025.10 export. Both are generated from CSS.
- Borders: `--border` for decorative 1.5px frames; `--control-border` for functional edges requiring 3:1 contrast. System color keywords are appropriate inside forced-colors adjustments.
- Type: `--serif` headings, `--sans` product body, `--mono` technical metadata; use the existing `--t-*` scale.
- Type units: `rem` tokens with the browser root left unset; component/example text uses `rem` or contextual `em`. Legacy JSON `px` fields remain 16px references, additive `css` values retain source units, and DTCG dimensions use `rem`. Optical borders/space/radii remain structural pixels.
- Direction: HTML `lang` / `dir` controls nested reading contexts; logical layout, script-aware tracking/leading, and opt-in `.icon-directional` arrows preserve source order.
- Space/radius/shadow: reuse the canonical `--sp-*`, `--r-*`, and `--shadow-*` scales.
- Motion: `--t-fast` 120ms, `--t-base` 150ms, `--t-slow` 300ms, reduced-motion overrides.
- Integration: tokens remain unlayered; components use `@layer inkwell` or Tailwind's components layer.
