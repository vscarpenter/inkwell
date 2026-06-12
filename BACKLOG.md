# Inkwell — Backlog

Things explicitly deferred, not yet decided, or worth exploring next. Items are grouped by area and ordered by impact-per-effort within each group. The [Audit](Audit.md) document is the master list of audit-driven follow-ups; this file tracks only items we've explicitly chosen not to ship yet.

Promote an item by deleting it from here and writing it up in the relevant doc + `CHANGELOG.md` once shipped.

---

## Audit follow-ups

### 3.0: collapse the dark cascade with `light-dark()` + derive tints with `color-mix()`

Deferred from the 2.1.0 contrast release (2026-06-11 review). Every token's dark value is declared twice (media query + `[data-theme]` block) and four times across a variant pair; CSS `light-dark()` plus `color-scheme` flipping on `[data-theme]` collapses each token to a single declaration and makes the build-script parity check unnecessary. `color-mix(in srgb, var(--accent) 14%, transparent)` would likewise derive every `*-tint`/`*-ring`/`*-border`, shrinking variant files to ~8 lines. Breaking (drops pre-mid-2024 browsers; rewrites `scripts/build-tokens-json.mjs` and `tokens-check.yml`): needs its own design pass and a major version.

### Audit Tier-2 items left for a 2.1+

From [`Audit.md`](Audit.md) — flagged in the 1.4.0 review as "discuss," not "do":
- **#1 (option A) Replace mono `.eyebrow` entirely** — we shipped option B (added `.eyebrow-serif` as a sibling). Revisit if any consumer survey says the mono eyebrow still reads as developer-tools.
- **#5 `*-strong` dashboard semantic colors** — add saturated variants of olive/rust/warning so dashboards can use unambiguous signal colors while editorial contexts keep the muted ones.
- **#9 Promote `--sky` to secondary interactive** — split the seventeen jobs `--accent` does today (badges, eyebrow rule, secondary tabs, timeline dots, etc.).

---

## Post-2.1 follow-ups

- **Light-mode `.select` chevron still uses canonical cool gray (`#6F6F75`) in all variants.** The dark-mode parity fix (2.1.0) applies only to dark; barely visible at 12px, but the same argument applies. The `mask-image` strategy becomes worth it if a 4th palette lands.
- **Clay dark-mode hover darkens toward the label** (passes 4.95:1) while every other palette/mode hover now moves *away* from the label color — coherence, not compliance; revisit if hover styling gets reworked.
- **`examples/tailwind.html` renders four `data-palette-choice` buttons that no script wires** (pre-existing; the page doesn't load `demo.js`).
- **`variants/compare.html` side effects.** Each iframe's palette IIFE persists to `localStorage("inkwell-palette")`, so visiting compare can silently rewrite the saved palette; its theme toggle also initializes to Auto regardless of stored theme.
