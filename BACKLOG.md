# Inkwell — Backlog

Things explicitly deferred, not yet decided, or worth exploring next. Items are grouped by area and ordered by impact-per-effort within each group. The [Audit](Audit.md) document is the master list of audit-driven follow-ups; this file tracks only items we've explicitly chosen not to ship yet.

Promote an item by deleting it from here and writing it up in the relevant doc + `CHANGELOG.md` once shipped.

---

## Variants & examples

### Explore palette-swapping on the example pages

**Today.** The four palettes (Indigo & Cloud, Clay, Sage, Burgundy) only show up in their own showcase pages under `variants/preview-*.html`. The richer example pages — `examples/dashboard.html`, `settings.html`, `profile.html`, `pricing.html`, `landing.html`, `article.html`, etc. — are hardcoded to the canonical Indigo & Cloud palette.

**The gap.** A designer evaluating the system can't see what a real dashboard looks like in clay or burgundy without manually swapping the `<link rel="stylesheet">` and reloading. That hides the system's biggest selling point: palette swapping is free and structural.

**Open questions to answer before implementing.**
- One example page demonstrating all four palettes (most likely: a palette switcher in the top-right that rewrites the active stylesheet href), or four sibling copies of each example (palette × page = matrix; faster to navigate, slower to maintain)?
- Should the switcher persist (localStorage) or reset on each load? Persistence is friendlier but means a clay-palette dashboard.html could become a user's default reading of the example.
- Does the switcher live in `demo.js` (so every example inherits it), or only on a single "palette playground" page?
- Compatibility: variants use `--clay` for the accent, canonical uses `--accent`. The example pages reference `--accent`. Switching to a variant stylesheet would break any `var(--accent)` in `demo.css` or inline styles. Either (a) the switcher is constrained to canonical-compatible variants (none today), (b) we bring `--accent` aliases into the variants, or (c) we accept that example pages need both token names available — which violates the "two universes" rule in `CLAUDE.md`.
- Is this the moment to retire the "two universes" rule and make variants first-class consumers of `inkwell-tokens.css` + `inkwell-components.css` with palette-only overrides?

**Why it's interesting.** Forces the architecture question the audit raised but dodged: are the variants legacy reference material, or part of the live system? Answering that question is bigger than this batch.

---

## Audit follow-ups

### Editorial primitives in `variants/`

`variants/tokens-clay.css` is missing `.t-lede`, `.eyebrow-serif`, `.dropcap`, `.pullquote`, `.byline`, and `figure.figure` — they're scoped to canonical Inkwell as of 1.4.0. Two callers would justify adding them:
- Someone forks a variant as the basis for a real editorial project (today, they'd need to copy the primitives themselves).
- We answer the palette-on-examples question above with "variants are first-class," which would make `examples/article.html` need to render in every palette.

Cheap to add (one file, ~30 lines), but only worth the entry-cost when one of those callers materializes.

### Audit Tier-2 items left for a 1.5

From [`Audit.md`](Audit.md) — flagged in the 1.4.0 review as "discuss," not "do":
- **#1 (option A) Replace mono `.eyebrow` entirely** — we shipped option B (added `.eyebrow-serif` as a sibling). Revisit if any consumer survey says the mono eyebrow still reads as developer-tools.
- **#5 `*-strong` dashboard semantic colors** — add saturated variants of olive/rust/warning so dashboards can use unambiguous signal colors while editorial contexts keep the muted ones.
- **#9 Promote `--sky` to secondary interactive** — split the seventeen jobs `--accent` does today (badges, eyebrow rule, secondary tabs, timeline dots, etc.).

These three together are roughly the shape of a 1.5 release.
