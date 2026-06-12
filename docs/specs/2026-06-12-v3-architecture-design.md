# Inkwell 3.0.0 — "the architecture release" — design

Date: 2026-06-12
Status: approved (maintainer delegated scope; spec + plan executed without interim review)
Source: BACKLOG item *"3.0: collapse the dark cascade with `light-dark()` + derive tints with `color-mix()`"* (deferred from the 2.1.0 contrast release), plus the v3.0 roadmap review of 2026-06-12.

## Scope decisions (confirmed)

1. **`light-dark()` collapses the dark cascade.** Every color token is declared once; mode switching moves from token redeclaration to `color-scheme` flipping. The two byte-identical dark blocks in `inkwell-tokens.css` (and the two in each variant) are deleted.
2. **`color-mix()` derives the alpha-tint family** (`*-tint`, `*-focus-ring`, `*-strong-border`, `*-tint-border`) from its base token. **Hard constraint: every derived value must resolve to exactly the 2.1.0 value.** Where derivation cannot reproduce a hand-tuned value, the token keeps an explicit declaration — the 2.1.0 contrast release is not relitigated. Zero visual change overall.
3. **Relative color syntax is rejected for 3.0.** Deriving lifted dark accents via `oklch(from …)` would change the hand-tuned dark values and undo 2.1.0 contrast work. Lifted dark values stay hand-declared inside `light-dark()`.
4. **The pure-CSS path gains cascade layering.** `inkwell.css` imports `inkwell-components.css` into `layer(inkwell)`. The components file itself is untouched — layer assignment is an entry-file concern, mirroring how `inkwell-theme.css` already does `layer(components)`. Consumer CSS (unlayered) now always overrides Inkwell components without specificity fights.
5. **The shim chain flattens.** `inkwell.css` becomes the canonical entry (imports the two source files directly); `tokens.css` becomes a deprecated one-line alias of `inkwell.css` (removal slated for 4.0). Install drops from four files to three (+ optional legacy shim).
6. **Scripts are rewritten, schema is not.** `build-tokens-json.mjs` and `check-contrast.mjs` learn to resolve `light-dark()` and `color-mix()`. The `tokens.json` schema and every resolved value stay identical (alpha formatting may normalize, e.g. `0.10` → `0.1`). The dark-block parity assertion is deleted — the failure mode it guarded no longer exists.
7. **Release process: resume tagging.** Tag `v2.1.0` on the last pre-3.0 commit of `main` so the final 2.x is pinnable by raw URL; tag `v3.0.0` after merge. Tags lapsed at `v1.3.1`.
8. **One branch (`inkwell-3.0.0`), one PR**, commits grouped by concern — same process as 2.1.0.

## Problem statement

`inkwell-tokens.css` declares 41 dark token values twice (lines 161–220 and 223–278 are byte-identical by design), and each variant declares its dark overrides twice more — a brand token's dark value exists in four places across a canonical+variant pair. The duplication is load-bearing enough that `build-tokens-json.mjs` carries an `assertMapsEqual` parity check (its lines 81–85) purely to catch divergence between the two dark blocks.

Separately: component overrides on the pure-CSS path require beating Inkwell's specificity (the Tailwind path solved this with `@layer` in 2.0; plain consumers never got it), and the `inkwell.css` → `tokens.css` → sources import chain forces a four-file install where three would do.

## Browser floor (the breaking change)

`light-dark()` requires Chrome/Edge 123, Firefox 120, Safari 17.5 — all shipped by May 2024. `color-mix()` and `@import … layer()` predate that floor. **3.0 drops support for browsers older than mid-2024.** Consumers who must support older browsers stay on 2.1.0 (now pinnable via the `v2.1.0` tag).

## Section 1 — the `light-dark()` cascade

### Mode machinery

The entire Pattern B apparatus reduces to:

```css
:root { color-scheme: light dark; }                              /* auto: follow OS */
:root[data-theme="light"] { color-scheme: light; }               /* manual light */
@media screen { :root[data-theme="dark"] { color-scheme: dark; } } /* manual dark, screen-only */
@media print { :root { color-scheme: light; } }                  /* print is always light */
```

Every color token becomes a single declaration: `--ivory: light-dark(#F4F4F0, #0F1018);`. Tokens whose value is identical in both modes (`--accent-ink: var(--accent)`, `--on-accent: var(--paper)` in canonical) stay as plain declarations. Shadow tokens embed `light-dark()` in the color position: `--shadow-sm: 0 1px 2px light-dark(rgba(20,20,19,0.06), rgba(0,0,0,0.45));`.

The `@media screen` gate on manual dark and the explicit `@media print` block together preserve the 2.1.0 guarantee that print always renders the light palette, regardless of OS preference or the manual toggle.

### Residual Pattern B: the `.select` chevron

`light-dark()` only accepts `<color>` values. The `.select` chevron is a `background-image` data URI with a hardcoded stroke color, so its dark override keeps the two-selector Pattern B form (auto via `@media (prefers-color-scheme: dark)` + `:root:not([data-theme="light"])`, manual via `:root[data-theme="dark"]`), in canonical and in each variant. This is the *only* surviving duplication. The backlogged `mask-image` strategy remains the eventual fix; it is out of scope here.

## Section 2 — `color-mix()` derivation

Alpha tints are currently literal `rgba()` restatements of their base token. `color-mix(in srgb, var(--base) P%, transparent)` is exactly equivalent to `rgba(base, P/100)` — same channels, same alpha — so derivation reproduces 2.1.0 values bit-for-bit when `P` matches.

Canonical derives, with per-mode alphas wrapped in `light-dark()` where they differ:

```css
--accent-tint: light-dark(
  color-mix(in srgb, var(--accent) 14%, transparent),
  color-mix(in srgb, var(--accent) 10%, transparent));
```

Derived: `--accent-tint`, `--accent-focus-ring`, `--accent-strong-border`, `--olive-tint`, `--olive-strong-border`, `--rust-tint`, `--rust-tint-border`, `--rust-focus-ring`, `--warning-tint`, `--warning-strong-border`, `--info-tint`, `--info-strong-border`. Not derived (no rgba relationship to a base token): surfaces, solid accents/semantics, neutrals, `--backdrop`, `--tldr-code-tint`, shadows.

### The escape hatch — what variants still declare

Because derived tints reference `var(--accent)` (etc.), a variant that overrides `--accent` gets correct tints *for free* — **if its alphas match canonical's**. Where 2.1.0 hand-tuned a variant alpha away from canonical (e.g. clay's dark `--accent-tint` is 0.18 where canonical's is 0.10), the variant declares its own `--accent-tint` with its own alphas. The rule going forward, recorded for `DESIGN_SYSTEM.md`: **derive by default; declare explicitly wherever the contrast gate forced a different value.** `check-contrast.mjs` remains the arbiter — a wrong derivation fails CI, exactly like a wrong literal did in 2.1.0.

Variant files shrink from ~97 lines to roughly 45: one `:root` block of single `light-dark()` declarations plus the residual chevron blocks. (The backlog's "~8 lines" predates the 2.1.0 per-palette ink/alpha tuning and the chevron residual; it was optimistic.)

## Section 3 — layering and the shim flatten

`inkwell.css` becomes the canonical two-line entry:

```css
@import url('inkwell-tokens.css');
@import url('inkwell-components.css') layer(inkwell);
```

`tokens.css` becomes `@import url('inkwell.css');` with a deprecation banner pointing existing consumers at `inkwell.css` and noting removal in 4.0. The file split (`inkwell-tokens.css` / `inkwell-components.css`) is unchanged — this only flattens the aggregators above it.

Tokens stay unlayered: custom properties must resolve everywhere, and the chevron overrides in the tokens file must keep beating the layered `.select` base rule (unlayered beats layered — they do).

**Migration note for the changelog:** unlayered consumer CSS now *always* overrides Inkwell components — including element-selector resets. An app that loads normalize.css (or any reset) alongside Inkwell will find the reset now wins over Inkwell's base type/reset rules. The fix is to drop the second reset (Inkwell ships its own) or import it into a lower layer: `@import url('normalize.css') layer(reset);`. This is the deliberate trade of the layering change, and the Tailwind path has worked this way since 2.0.

The Tailwind path is unaffected: `inkwell-theme.css` imports the raw source files and assigns its own `layer(components)`; it never touched the shims.

## Section 4 — script rewrites

Both scripts share the parsing change; neither changes its contract.

- **`light-dark()` splitting is textual**: a resolver walks a value string and replaces every `light-dark(A, B)` occurrence (balanced-paren aware — `A`/`B` may contain `color-mix(…)` with nested commas) with the branch for the requested mode. Applied to a shadow token it yields exactly the 2.1.0 raw string for each mode.
- **`build-tokens-json.mjs`**: parses the single `:root` block, derives each token's light/dark raw values via the splitter, resolves `color-mix(in srgb, var(--x) P%, transparent)` to an `rgba()` string (external tooling can't consume `color-mix` expressions). Schema, key set, and `var(--accent)`-style passthroughs unchanged. `assertMapsEqual` and the three-block extraction are deleted; the `_meta.note` wording is updated.
- **`check-contrast.mjs`**: `varsFor(palette, mode)` no longer overlays dark blocks — it overlays canonical + variant `:root` maps, and `resolveColor` gains the mode parameter, applying the splitter before its existing `#hex` / `var()` / `rgba()` handling, plus a `color-mix` branch that resolves base × alpha and composites as today. The check table (24 pairs × 4 palettes × 2 modes = 192) is unchanged and must produce **zero failures, identical to 2.1.0**.

### Verification gates (all must pass before the PR)

1. `node scripts/check-contrast.mjs` — all 192 pairs pass.
2. `node scripts/build-tokens-json.mjs --check` — regenerated `tokens.json` committed, schema unchanged.
3. **Resolved-value parity**: a throwaway script resolves every token (4 palettes × 2 modes) from the 2.1.0 tree (`git show`) and the 3.0 tree and diffs numerically. Expected diff: empty (alpha formatting aside).
4. Browser check: `preview.html` and one variant page in light, dark, and auto; toggle + print preview sanity.

## Section 5 — docs and release

- `CHANGELOG.md`: 3.0.0 entry with a **Migration** section (browser floor; layering/reset note; `tokens.css` deprecation; install going three-file).
- `DESIGN_SYSTEM.md`: dark-mode section rewritten around `color-scheme`/`light-dark()`; the derive-vs-declare rule added; anti-patterns gain "don't redeclare dark values that `light-dark()` already carries."
- `CLAUDE.md`, `AGENTS.md`, `agent-instructions.md`, `README.md`, `TAILWIND.md`, `CONTRIBUTING.md`: cascade description, install file count, version stamps.
- `BACKLOG.md`: promote the shipped 3.0 item out; fix the dead `Audit.md` link (file no longer exists); the select-chevron mask item gains a note that it is now the only Pattern B residue.
- Tags: `v2.1.0` on the pre-branch `main` head; `v3.0.0` after merge.

## Out of scope (deferred, recorded here so 3.0 stays one idea)

- **Relative color syntax** for deriving lifted dark accents — rejected for 3.0 (decision 3); candidate for a future major only with a fresh contrast pass.
- **`--sky` promotion to secondary interactive** (BACKLOG Tier-2 #9) — needs its own design pass; visual change, not architecture.
- **`*-strong` dashboard semantics** (Tier-2 #5) — additive; can ship in any 3.x.
- **Mono `.eyebrow` replacement** (Tier-2 #1) — no consumer signal; identity, not debt.
- **Popover-based menu, `<details>` accordion, `progress`/`meter`, container queries** — additive 3.x candidates; anchor-positioning Baseline status to be re-verified then.
- **W3C Design Tokens format for `tokens.json`** — schema stability is this release's safety gate; revisit separately.
- **Select-chevron `mask-image` strategy** — stays backlogged; activates if a 4th palette lands.

*If anything in this spec conflicts with `DESIGN_SYSTEM.md` after implementation, the shipped CSS + `DESIGN_SYSTEM.md` win; this document records intent at design time.*
