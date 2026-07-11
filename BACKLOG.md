# Inkwell — Backlog

Things explicitly deferred, not yet decided, or worth exploring next. Items are grouped by area and ordered by impact-per-effort within each group. (The standalone Audit document this file used to reference was retired; audit-driven follow-ups now live here directly.)

Promote an item by deleting it from here and writing it up in the relevant doc + `CHANGELOG.md` once shipped.

---

## Audit follow-ups

*(The `light-dark()` + `color-mix()` cascade collapse shipped as 3.0.0 — see `docs/specs/2026-06-12-v3-architecture-design.md` and `CHANGELOG.md`.)*

### Deferred from the 3.0 design pass

- **Relative color syntax for lifted dark accents** (`oklch(from var(--accent) …)`) — rejected for 3.0 because deriving dark values would change the hand-tuned 2.1.0 contrast work; candidate for a future major with a fresh contrast pass.
- **Popover-based menu, `<details>` accordion, `progress`/`meter`, container queries** — additive 3.x candidates; re-verify anchor-positioning Baseline status before committing.
- **W3C Design Tokens format for `tokens.json`** — schema stability was 3.0's safety gate; revisit separately.

### Audit Tier-2 items left for a 3.x

Carried forward from the retired 1.4.0 audit notes as "discuss," not "do":
- **#1 (option A) Replace mono `.eyebrow` entirely** — we shipped option B (added `.eyebrow-serif` as a sibling). Revisit if any consumer survey says the mono eyebrow still reads as developer-tools.
- **#5 `*-strong` dashboard semantic colors** — add saturated variants of olive/rust/warning so dashboards can use unambiguous signal colors while editorial contexts keep the muted ones.
- **#9 Promote `--sky` to secondary interactive** — split the seventeen jobs `--accent` does today (badges, eyebrow rule, secondary tabs, timeline dots, etc.).

---

## Post-2.1 follow-ups

- **Light-mode `.select` chevron still uses canonical cool gray (`#6F6F75`) in all variants.** The dark-mode parity fix (2.1.0) applies only to dark; barely visible at 12px, but the same argument applies. The `mask-image` strategy becomes worth it if a 4th palette lands — and as of 3.0 the chevron is the *only* surviving Pattern B duplication (`light-dark()` can't carry a `background-image`), so the mask strategy would also retire the last dark-selector block.
- **Clay dark-mode hover darkens toward the label** (passes 4.95:1) while every other palette/mode hover now moves *away* from the label color — coherence, not compliance; revisit if hover styling gets reworked.
