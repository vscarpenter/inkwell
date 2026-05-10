# Changelog

All notable changes to Inkwell are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Minor bumps add components or tokens; patches refine existing ones; majors break the public API.

## [Unreleased]

### Added
- **Tailwind v4 support.** New [`inkwell-theme.css`](inkwell-theme.css) entry file makes Inkwell drop into any Tailwind v4 project when used alongside [`inkwell-tokens.css`](inkwell-tokens.css) and [`inkwell-components.css`](inkwell-components.css) — every token becomes a utility (`bg-accent`, `text-slate`, `border-accent`, `font-serif`, `rounded-md`, `text-display`, `max-w-default`), the 1.5px signature is exposed as `border-hair`, and a `@custom-variant dark` block teaches Tailwind to honor Inkwell's `[data-theme]` toggle. In Tailwind entry CSS, import only `@import "tailwindcss"; @import "./inkwell-theme.css";`. No `tailwind.config.js`, no JavaScript preset.
- [`TAILWIND.md`](TAILWIND.md) — install guide, components-vs-utilities rule, `border-hair` convention, cascade-order verification, two-universes warning.
- [`examples/tailwind.html`](examples/tailwind.html) — live integration demo that opens directly in a browser (uses the `@tailwindcss/browser` CDN for the demo; production builds use `inkwell-theme.css` directly).
- Updates to [`agent-instructions.md`](agent-instructions.md) and [`README.md`](README.md) covering the new Tailwind path for AI coding agents and human developers.

### Changed
- **Split [`tokens.css`](tokens.css) into [`inkwell-tokens.css`](inkwell-tokens.css) + [`inkwell-components.css`](inkwell-components.css).** The original file is now a two-line aggregator (`@import` shim) so existing consumers see no behavior change — linking `tokens.css` or `inkwell.css` works exactly as before. The split exists to support `inkwell-theme.css`, which needs to wrap components in `@layer components` while keeping `:root` tokens unlayered.
- GitHub Pages workflow now syncs all five canonical CSS files into `examples/` on deploy (previously two).

### Migration
**No migration needed** for existing consumers. `inkwell.css` and `tokens.css` continue to work unchanged. If you maintain a fork that copies only `tokens.css` into your project, switch to copying `tokens.css` + `inkwell-tokens.css` + `inkwell-components.css` together — the new `tokens.css` is a shim that `@import`s the other two.

Tailwind v4 users: keep `inkwell-tokens.css`, `inkwell-components.css`, and `inkwell-theme.css` side by side, then drop `@import "tailwindcss"; @import "./inkwell-theme.css";` into your entry CSS. See [`TAILWIND.md`](TAILWIND.md).

### Not supported
Tailwind v3. v3 requires a JS preset that conflicts with Inkwell's no-build pitch. v4 (October 2024 or later) is the supported integration; v3 users should upgrade or use Inkwell via `inkwell.css` directly without Tailwind utility coverage.

## [1.2.0] — 2026-05-09

### Added
- `.tabs`, `.tab`, `.tab-panel` — underline-style tab navigation. Both `aria-selected="true"` and `.is-active` are styled, so consumers can use either pattern.
- `.tooltip` with `[data-tooltip]` — CSS-only bubble that reveals on `:hover` and `:focus-visible`. Pair with `aria-label` for screen readers.
- `.breadcrumbs` — `<ol>`-based list with `/` separators rendered via `::before`, and `aria-current="page"` styling for the leaf.
- `.pagination` — numbered list with prev/next, `aria-current="page"` for the active page, and a `.ellipsis` span for compressed ranges.
- `.skeleton` (+ `.is-text` / `.is-title` / `.is-block` / `.is-circle`) — shimmer placeholder using the gray-100/200 gradient so it stays warm in dark mode. Honors `prefers-reduced-motion` by collapsing to a flat gray.
- `.empty-state` (+ `.empty-state-icon`) — centered no-data panel with icon slot, headline (serif), body, and action.
- `tokens.json` — machine-readable mirror of `tokens.css` for Figma plugins, Tailwind configs, and Style Dictionary. `tokens.css` remains canonical; the JSON header documents this and notes it must be regenerated when CSS tokens change.
- New example pages: [`landing.html`](examples/landing.html), [`search.html`](examples/search.html), [`changelog.html`](examples/changelog.html), [`not-found.html`](examples/not-found.html).
- `CHANGELOG.md` (this file).

### Changed
- `examples/index.html` — bumped to 14 example cards.
- `DESIGN_SYSTEM.md` — component table updated with the new entries.

## [1.1.0] — 2026-05-09

### Added
- `.field`, `.field-label`, `.field-help`, `.field-error` — vertical field-group wrapper for labelled form controls with helper or error text.
- `.input.is-error` and `:disabled` states on form controls.
- `.textarea` and `.select` — minimal styling matching `.input`, with a theme-aware SVG chevron on `.select`.
- `.radio` and `.switch` — selection controls following the `.checkbox` pattern; switch is a pill-shaped track with a sliding knob.
- `.alert` with `.is-info` / `.is-success` / `.is-warning` / `.is-danger` — flat-tinted system message component, distinct from the inverted `.tldr` callout.
- `.code-block` — multi-line `<pre><code>` panel with optional `.copy` button slot in the top-right.
- `.dialog` — styling for native HTML `<dialog>`. Open via `dialog.showModal()` for free focus trap, `Esc`-to-close, scroll lock, and `::backdrop` blur.
- `kbd` / `.kbd` — keyboard-shortcut chip in mono with a 2px bottom border line.
- New example pages: [`forms.html`](examples/forms.html), [`docs.html`](examples/docs.html).
- New §5 Accessibility section in `DESIGN_SYSTEM.md` documenting the deliberate sub-3:1 hairline border choice and the contrast guarantees for new tokens.

### Changed
- `--gray-500`: `#85858A` → `#6F6F75` in light mode (5.05:1 on `--paper`, 4.64:1 on `--ivory`) — clears WCAG AA 4.5:1 for body text. Affects `.t-caption`, `.stat-label`, `.eyebrow` color, `.toc .n`, `.sec-head .count`, and `--input::placeholder`. Dark mode unchanged at 6.4:1.

### Migration
If you've forked stale documentation that hard-codes `--gray-500: #85858A`, replace with `#6F6F75` to clear AA. No component classes were renamed.

## [1.0.1] — 2026-05-09

### Added
- GitHub Actions workflow (`.github/workflows/pages.yml`) deploys `examples/` to GitHub Pages on push to `main`.
- The workflow syncs canonical `tokens.css` and `inkwell.css` into `examples/` at deploy time so the live demo never drifts from source.
- Live demo link in README pointing to [inkwell.vinny.dev](https://inkwell.vinny.dev/).

## [1.0.0] — 2026-05-09

### Added
- Initial release with the **Indigo & Cloud** palette.
- `tokens.css` — the canonical token layer plus all component CSS.
- `inkwell.css` — brand-named alias that re-exports `tokens.css`.
- Pattern B dark mode (auto via `prefers-color-scheme: dark`, manual override via `[data-theme="light"|"dark"]` on `<html>`).
- Components: `.btn`, `.input`, `.checkbox`, `.badge`, `.card`, `.stat-card`, `.tbl`, `.tldr`, `.pill`, `.timeline`, `.chip-dot`, `.avatar`, `.toc`, `.sec-head`, `.eyebrow`.
- `DESIGN_SYSTEM.md` — the canonical spec. Token tables, component list, dark-mode cascade, anti-patterns.
- `preview.html` — comprehensive component showcase.
- `index.html` — starter template with navbar, hero, and three-state theme toggle.
- `variants/` — three alternate palettes (clay, sage, burgundy) preserved for reference.

---

*Made with hairlines and serifs by [Vinny Carpenter](https://vinny.dev). The 1.5px is on purpose.*
