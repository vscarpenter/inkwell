# Inkwell — Backlog

Things explicitly deferred, not yet decided, or worth exploring next. Items are grouped by area and ordered by impact-per-effort within each group. (The standalone Audit document this file used to reference was retired; audit-driven follow-ups now live here directly.)

Promote an item by deleting it from here and writing it up in the relevant doc + `CHANGELOG.md` once shipped.

---

## Audit follow-ups

*(The `light-dark()` + `color-mix()` cascade collapse shipped as 3.0.0 — see `docs/specs/2026-06-12-v3-architecture-design.md` and `CHANGELOG.md`.)*

### Deferred from the 3.0 design pass

- **Container-aware component layouts** — next additive 3.x candidate. Start with `.finding`, whose stacking currently follows viewport width even inside a narrow column. Size container queries fit the existing browser floor; introduce containment only where a component needs it.
- **Popover-based menu** — define the keyboard, focus, dismissal, edge positioning, and RTL contract before implementation. The Firefox 120 floor predates native popovers (125), and CSS anchor positioning also needs fallbacks at the supported floor. Preserve the browser policy and dependency-free install. Native `<details>` disclosures already cover simple expandable content.
- **Relative color syntax for lifted dark accents** (`oklch(from var(--accent) …)`) — rejected for 3.0 because deriving dark values would change the hand-tuned 2.1.0 contrast work; candidate for a future major with a fresh contrast pass.

### Audit Tier-2 items left for a 3.x

Carried forward from the retired 1.4.0 audit notes as "discuss," not "do":
- **#1 (option A) Replace mono `.eyebrow` entirely** — we shipped option B (added `.eyebrow-serif` as a sibling). Revisit if any consumer survey says the mono eyebrow still reads as developer-tools.
- **#5 `*-strong` dashboard semantic colors** — add saturated variants of olive/rust/warning so dashboards can use unambiguous signal colors while editorial contexts keep the muted ones.
- **#9 Promote `--sky` to secondary interactive** — split the seventeen jobs `--accent` does today (badges, eyebrow rule, secondary tabs, timeline dots, etc.).

---

## Post-2.1 follow-ups

- **Light-mode `.select` chevron still uses canonical cool gray (`#6F6F75`) in all five palettes.** The dark-mode parity fix (2.1.0) applies only to dark. This is palette coherence, not a current contrast defect. Preserve the drop-in `.select` markup when evaluating a fix; applying a mask directly to the select would mask the entire control. The SVG chevron remains the only Pattern B duplication because `light-dark()` cannot carry a `background-image`.
- **Clay dark-mode hover darkens toward the label** (passes 4.95:1) while every other palette/mode hover now moves *away* from the label color — coherence, not compliance; revisit if hover styling gets reworked.
