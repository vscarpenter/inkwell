# Inkwell — Backlog

Things explicitly deferred, not yet decided, or worth exploring next. Items are grouped by area and ordered by impact-per-effort within each group. The [Audit](Audit.md) document is the master list of audit-driven follow-ups; this file tracks only items we've explicitly chosen not to ship yet.

Promote an item by deleting it from here and writing it up in the relevant doc + `CHANGELOG.md` once shipped.

---

## Audit follow-ups

### Variant `--gray-500` contrast under WCAG AA

The clay (`#87867F`), sage (`#84827B`), and burgundy (`#8A8478`) palettes preserve the original warm-gray `--gray-500` values from the legacy `tokens-X.css` files. Each fails WCAG AA on the variant's paper/ivory surfaces:

| Variant | `--gray-500` | vs paper | vs ivory |
|---|---|---|---|
| Clay     | `#87867F` | 3.65:1 | 3.47:1 |
| Sage     | `#84827B` | 3.85:1 | 3.50:1 |
| Burgundy | `#8A8478` | 3.72:1 | 3.41:1 |
| Indigo (canonical) | `#6F6F75` | 4.99:1 | 4.53:1 ✓ |

Canonical's `#6F6F75` was deliberately tuned for AA (annotated in `inkwell-tokens.css`). The variants surfaced this regression more visibly in 2.0 by isolating the values in ~70-line override files. Options when picking this up: (a) bump each variant's gray-500 to clear AA (e.g., clay → `#7A796F`), (b) annotate the deliberate warm-gray tradeoff in each variant file, (c) do both. Decision needed before shipping a dashboard-heavy template in a non-default palette.

### `.select` chevron stroke leaks canonical's dark `--gray-500` into variants

`inkwell-tokens.css` overrides `.select`'s `background-image` in dark mode with a data URI SVG whose stroke color is hardcoded to `#9A9AA0` (canonical's dark `--gray-500`). Data URIs can't reference CSS custom properties, so when a variant is active in dark mode, the chevron stays canonical-grey while the rest of the page lifts. Mismatch is subtle (~5 units per channel) but visible to anyone QAing palette parity. Real fix probably involves replacing the data URI with an inline `<svg>` in a pseudo-element or shifting to a `mask-image` strategy.

### Audit Tier-2 items left for a 2.1+

From [`Audit.md`](Audit.md) — flagged in the 1.4.0 review as "discuss," not "do":
- **#1 (option A) Replace mono `.eyebrow` entirely** — we shipped option B (added `.eyebrow-serif` as a sibling). Revisit if any consumer survey says the mono eyebrow still reads as developer-tools.
- **#5 `*-strong` dashboard semantic colors** — add saturated variants of olive/rust/warning so dashboards can use unambiguous signal colors while editorial contexts keep the muted ones.
- **#9 Promote `--sky` to secondary interactive** — split the seventeen jobs `--accent` does today (badges, eyebrow rule, secondary tabs, timeline dots, etc.).
