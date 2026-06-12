# Inkwell 2.1.0 — "the contrast release" — design

Date: 2026-06-11
Status: approved (scope and all three design sections confirmed by maintainer)
Source: comprehensive design-system review of 2026-06-11 (WCAG contrast pass over ~50 token pairs × 4 palettes × 2 modes, anti-pattern detector, browser inspection)

## Scope decisions (confirmed)

1. **Non-breaking 2.1.0.** The `light-dark()` + `color-mix()` architecture rewrite is deferred to a dedicated 3.0 effort and recorded in BACKLOG.md.
2. **`.stat-card.is-primary`** drops the 4px accent left stripe for a **1.5px full accent border** (`border-color: var(--accent)`). The one-off `border-left: 4px solid var(--accent)` callout in `examples/docs.html` gets the same treatment.
3. **Em-dash density in copy stays** — accepted as the system's editorial voice.
4. **One branch (`inkwell-2.1.0`), one PR**, commits grouped by concern.

## Problem statement

The review found one structural flaw and a cluster of measured WCAG AA failures:

- `--accent` does two incompatible jobs — *ink* (links, selected tabs, badge text, focus outline) and *fill* (button backgrounds). Canonical indigo (`#3B4A8C`) survives both; Clay's coral (`#D97757`) does not: links 2.96:1, `.btn-primary` white label 3.12:1, `.badge-accent` 2.71:1, focus outline 2.96:1 (below the 3:1 floor of WCAG 1.4.11). Sage links sit at 4.49:1.
- Canonical light mode: `.badge-success` 3.10:1, `.stat-delta.up` 3.68:1, `.pill.resolved` 3.68:1, `.badge-warning` 3.95:1, `.tbl thead th` 4.26:1.
- Form-control boundaries (checkbox border, off-state switch track) measure 1.56:1. The documented hairline exception covers decorative panel borders, not functional state indicators.
- Variant `--gray-500` values fail AA (BACKLOG item; clay 3.65:1 on paper).
- Dark mode passes everywhere in all four palettes — no dark-mode changes except defining the new tokens' dark values. *(Implementation addendum: writing the check table disproved this for hover/badge states — the shipped release also lifts dark `--accent-d` in canonical/sage/burgundy, cuts dark `--accent-tint` to 0.10 in canonical/burgundy, sets burgundy dark `--accent-ink: #D07878`, and screen-gates the manual dark theme for print. CHANGELOG 2.1.0 records each.)*

Plus DX gaps (no button disabled/active/loading states, no `.sr-only`, every consumer rebuilds the navbar) and consistency drift (version headers 2.0.0/1.3.1/1.4.0; localStorage keys `theme-preview` vs `inkwell-theme`; README's "before paint" claim untrue).

## Section 1 — Tokens & contrast

### New tokens (`inkwell-tokens.css`, `:root` + BOTH dark blocks — parity invariant holds)

| Token | Light | Dark | Job |
|---|---|---|---|
| `--accent-ink` | `var(--accent)` | `var(--accent)` | Accent as text + focus outline |
| `--on-accent` | `var(--paper)` | `var(--paper)` | Label color on accent fills |
| `--olive-dark` | `#566740` | `#9CB07A` | Olive as text / solid fill (mirrors existing `--warning-dark` pattern) |
| `--gray-400` | `#88888E` | `#666874` | Neutral step between 300 and 500 |
| `--control-border` | `1.5px solid var(--gray-400)` | (same, resolves via gray-400) | Functional form-control boundaries |
| `--info-tint` | `rgba(92, 124, 163, 0.16)` | `rgba(124, 159, 210, 0.18)` | `.alert.is-info` background |
| `--info-strong-border` | `rgba(92, 124, 163, 0.45)` | `rgba(124, 159, 210, 0.6)` | `.alert.is-info` border |

### Changed values

- `--warning-dark` light: `#A06A2A` → `#85561E` (3.95 → 5.41:1 on warning tint; 6.27:1 on paper). Dark value unchanged (`#D9A55F`).

### Component re-pointing (`inkwell-components.css`)

- → `--accent-ink`: `a.link`, `.tab[aria-selected]`/`.tab.is-active`, `.badge-accent` color, `em.accent`/`.serif em`, `.sec-head .idx`, `.toc a:hover .n`, `.breadcrumbs a:hover`, global `*:focus-visible` outline.
- → `--on-accent`: `.btn-primary` color, `.pill.sev` color, `.pagination [aria-current]` color.
- → `--olive-dark`: `.badge-success` color, `.stat-delta.up` color, `.pill.resolved` background (label stays `var(--paper)`: 6.16:1 light, 7.35:1 dark).
- → `--control-border`: `.checkbox input`, `.radio input` borders; `.switch input` off-track background becomes `var(--gray-400)`.
- → `--info-tint`/`--info-strong-border`: `.alert.is-info` (no longer reuses accent tint; `--info` finally has a job).
- `.tbl thead th` color: `--gray-500` → `--gray-700`.
- `.stat-card.is-primary`: replace `border-left: 4px solid var(--accent); padding-left: 19px;` with `border-color: var(--accent);` (padding returns to the base `20px 22px 18px`).
- Decorative accent rules KEEP `--accent` (brand hue stays visible where contrast rules don't apply): `.eyebrow::before`, `.eyebrow-serif::before`, `.pullquote` border, `.tl-entry::before` dot, `.figure figcaption` border.

### Variant overrides (each variant file: `:root` + BOTH dark blocks)

| Variant | `--accent-ink` (light) | `--on-accent` (light) | `--gray-500` (light) | `--gray-400` light/dark | Other |
|---|---|---|---|---|---|
| Clay | `#A04E2C` (5.51:1 ivory / 5.80 paper) | `var(--slate)` (5.90:1 on accent) + `--accent-d` → `#E08B6E` so hover *lightens* (7.10:1; darkening hover failed at 4.07) | ~`#737266`, final value script-verified ≥4.5 on both surfaces | ~`#8F8D82` / ~`#6E6A5D`, script-verified ≥3:1 | dark-mode `.select` chevron data-URI recolored to clay's dark gray-500 |
| Sage | `#3A7456` (5.01 / 5.51) | inherits `var(--paper)` (passes: 4.94 light, 5.99 dark) | ~`#706E66`, script-verified | ~`#8C8A80` / `#6A6B5F` | chevron override |
| Burgundy | none needed (accent passes 6.98) | inherits (7.60 / 4.52) | ~`#756E62`, script-verified | ~`#8E8779` / ~`#716961`, script-verified | chevron override |

Dark-mode `--accent-ink`/`--on-accent` for variants: lifted accents already pass as ink everywhere; `--on-accent` dark resolves to each variant's dark `--paper` (clay 6.49, sage 5.99, burgundy 4.52 — all pass). Clay dark must verify `--on-accent` against dark `--accent-d` hover too.

"~" values are starting candidates; the implementation tunes each until `scripts/check-contrast.mjs` passes, then records the final hex in the token files and tokens.json.

## Section 2 — Component additions & promotions (`inkwell-components.css`)

- **Button states**: `.btn:disabled, .btn.is-disabled` — one rule for all intents: background `--gray-100`, color `--gray-500`, `border-color: var(--gray-200)`, `cursor: not-allowed`; `:active` pressed shade per intent (primary → `--accent-d`, secondary/ghost → `--gray-200`, danger → `--rust-d`); `.btn-sm` (30px height, 13px font, 12px padding); `.btn[aria-busy="true"]` shows a CSS border-spinner via `::after` inline before the label — the label remains visible; spinner static under reduced motion.
- **A11y utilities**: `.sr-only` (clip-path pattern), `.skip-link` (sr-only until `:focus-visible`, then fixed top-left accent-fill pill using `--on-accent`).
- **Promotions**: `.navbar` (sticky, ivory bg, bottom rule) + `.navbar-inner` (content-width flex row) + scoped `.navbar .brand` (serif 600 14px) + `.navbar nav a` link treatment — lifted from `index.html`; `.field-row` (inline label+control flex row, from demo.css) and `.card-grid` (`repeat(auto-fill, minmax(280px, 1fr))`, 18px gap). `index.html` inline styles and `examples/demo.css` drop their now-duplicate rules.
- **`.tbl-scroll`**: `overflow-x: auto` wrapper; documented for narrow viewports.
- **Type niceties**: `text-wrap: balance` on `.t-display`, `.t-h1`, `.t-h2`; `text-wrap: pretty` on `.t-lede`, `.pullquote`.
- **`::selection`**: `background: var(--accent-tint)`; visual check during verification — fall back to `var(--oat)` if the 14% tint reads as invisible.
- **Motion fix**: `html { scroll-behavior: smooth }` moves inside `@media (prefers-reduced-motion: no-preference)`.
- **Print** (~15 lines): `break-inside: avoid` on `.card`, `.stat-card`, `.tbl`, `figure.figure`, `.alert`; `.tldr` swaps the dark fill for `border: var(--border-strong)` with inherited colors; `.skeleton` animation already disabled via reduced-motion, force `background: var(--gray-100)`.

## Section 3 — Consistency, docs, verification

- **Version headers** in all three source CSS files → 2.1.0.
- **Theme key**: unify on `inkwell-theme`; `index.html`/`preview.html` toggles read `localStorage.getItem('inkwell-theme') || localStorage.getItem('theme-preview')` once (write always to the new key). `variants/compare.html` checked for the same.
- **Pre-paint snippet**: 3-line inline `<head>` script on `index.html`, `preview.html`, every `examples/*.html`, `variants/compare.html`: applies saved theme attribute before first paint; on examples pages the same snippet also injects the saved palette `<link>` synchronously (kills the indigo flash). `demo.js` and the preview palette IIFE keep runtime toggling; snippet and IIFE stay idempotent.
- **Docs**: README (fast-path install note: link `inkwell-tokens.css` + `inkwell-components.css` directly to skip the 3-deep `@import` waterfall; component list refresh), DESIGN_SYSTEM.md (new token rows + measured ratios, new components, `.sec-head` usage note: numbered indices only when the sequence carries meaning, stat-card marker change, control-border rationale), TAILWIND.md + `inkwell-theme.css` `@theme` aliases (`--color-accent-ink`, `--color-on-accent`, `--color-olive-dark`, `--color-gray-400`, `--color-info-tint`, `--color-info-strong-border`), `agent-instructions.md` (accent-ink/on-accent rules, new components), CHANGELOG 2.1.0 entry with migration notes (stripe → full border; `.alert.is-info` hue now steel-blue; `--warning-dark` darker; focus outline now `--accent-ink`), BACKLOG (drop resolved gray-500 + chevron items; add 3.0 `light-dark()`/`color-mix()` item).
- **`tokens.json`**: regenerated via `scripts/build-tokens-json.mjs`.
- **New `scripts/check-contrast.mjs`**: zero-dependency Node script asserting every token-pair ratio across 4 palettes × 2 modes (the review's check table, made permanent). Parses nothing fancy: a literal table of (name, fg, bg-or-composite, threshold) entries reading hex values from the CSS files via the same regex approach as `build-tokens-json.mjs`, or with values inlined and a drift guard. Exit 1 with a table of failures. Wired into CI (extend `tokens-check.yml` with a second step or a sibling workflow watching the variant files too).
- **Examples mirror**: `cp` sync per CLAUDE.md after source edits.

## Out of scope

- `light-dark()` / `color-mix()` rewrite (3.0, BACKLOG).
- Em-dash copy changes.
- `.pullquote` 1.5px accent rule (classic editorial convention, stays).
- `.btn-lg`, toasts, dropdown menus, density modes (not requested, YAGNI).

## Verification plan

1. `node scripts/check-contrast.mjs` — all pairs pass (this is the acceptance test for Section 1).
2. `node scripts/build-tokens-json.mjs --check` — green.
3. Browser pass on `preview.html` (light, dark, clay light — the three states that showed failures), `examples/dashboard.html`, `examples/forms.html`: no layout regressions, stat-card marker reads correctly, info alert reads as info, no theme/palette flash on reload with saved non-default state.
4. Confirm no hardcoded hex leaked into `inkwell-components.css` (grep for `#` outside data-URI comments).
