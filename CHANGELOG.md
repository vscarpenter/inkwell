# Changelog

All notable changes to Inkwell are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Minor bumps add components or tokens; patches refine existing ones; majors break the public API.

## [Unreleased]

## [3.5.0] — 2026-08-27

### Added
- **Azure & Ink palette.** A fifth palette — cool harbor stone + a clean azure accent, deep navy surfaces in dark (`variants/azure.css`), adapted from the "From Products to Platform" deck. Override-only like the others: single `light-dark()` declarations for surfaces, accent, and the neutral ramp; redeclares `--accent-tint` (dark alpha 16%) and `--accent-ink`. Registered in `tokens.json` `_meta.palettes`, rendered as a fifth panel on `variants/compare.html`, and selectable everywhere via `?palette=azure` or the new Azure button in the palette toggle on every example page and `preview.html`. The CI contrast gate grows from 192 to 240 token-pair assertions to cover it.
- **Deployment build metadata.** Every live page footer now shows the semantic release, a commit-derived build number, and the UTC deployment date. Pages deploys every commit to `main` and stamps only its artifact copy, avoiding generated commits and workflow recursion.
- **Generated component reference.** `component-manifest.json` now catalogs 35 public component families with selectors, anatomy, modifiers, states, accessibility responsibilities, JavaScript requirements, since-version, and copyable markup. `scripts/build-components-reference.mjs` deterministically renders the catalog into `examples/components.html` and supports CI drift checking.
- **Optional shared interactions.** `inkwell-interactions.js` provides idempotent, dependency-free progressive enhancement for tabs, carousel controls, and declarative native-dialog triggers. It auto-initializes and exposes `window.InkwellInteractions.init(root)` for dynamically inserted UI. The examples no longer maintain duplicate tab/carousel implementations.
- **Native disclosure component.** `.disclosure` styles a semantic `<details>`/`<summary>` pair for FAQ and accordion content with no JavaScript. The landing page now consumes the shared primitive instead of private FAQ CSS.
- **Repository-wide adoption contract.** `scripts/check-system-contract.mjs` verifies release/version alignment, distributable mirrors, manifest/CSS parity, page landmarks and metadata, form-error relationships, local targets, Tailwind aliases, and known stale claims. An ephemeral Playwright suite adds desktop/mobile runtime, interaction, theme/palette, touch-target, and overflow coverage without adding package metadata.
- **Reference-page metadata.** All 20 published pages now include a canonical URL and theme-color metadata; theme-aware pages synchronize the color after mode or palette changes.
- **Preferred Tailwind border name.** `border-inkwell` is the unambiguous name for the 1.5px signature utility. The historical `border-hair` utility remains as a deprecated compatibility alias until 4.0; the CSS token `--border-hair` continues to mean a 1px internal divider.

### Fixed
- **Example accessibility and responsive behavior.** Tab references now implement complete tab/panel relationships, roving tabindex, and Arrow/Home/End navigation; palette/theme pickers expose named groups; narrow tables and long inline-code URLs no longer force page-level horizontal scrolling.
- **Palette deployment and comparison isolation.** GitHub Pages now watches and copies Azure, Tailwind's browser demo loads Azure without a stray `tailwindcss` request, and comparison iframes no longer overwrite saved palette or theme choices.
- **Reference-page semantics.** Every deployed page now has one visible `h1`, one `main#main-content`, and a working skip link. The app-shell and 404 heading hierarchies are corrected; invalid examples expose `aria-invalid` and `aria-describedby`; sign-in controls use correct types, names, and autocomplete values.
- **Mobile containment and target sizing.** App-shell grid children can shrink, dense tables scroll inside `.tbl-scroll`, demo navigation groups contain their own overflow, and coarse-pointer controls reach a 44px target floor without loosening desktop density.
- **Cross-platform pagination containment.** Pagination now owns horizontal overflow on narrow screens, so platform font-metric differences cannot push the document beyond its viewport.
- **Current documentation.** The live guide now describes the three-file 3.5 install, canonical source split, five palettes, Tailwind v4 entry, optional interactions, component reference, and agent adoption path instead of the retired v1.1/two-file model.

### Changed
- **Agent and consumer guidance now pins 3.5.0.** Raw install URLs, component lists, example counts, JavaScript responsibilities, accessibility requirements, and verification steps all match the shipped API.
- **Tailwind container aliases reference canonical layout tokens.** `--container-narrow/default/wide` now resolve through `--content-*` rather than copying pixel values, eliminating another parity seam.
- **CI is repository-wide.** Generated-file, contrast, deployment-marker, system-contract, and browser-smoke gates run for every pull request and push to `main`; Pages runs the static gates before assembling its artifact.

### Migration
- New installs should continue linking the three canonical CSS files. Add `inkwell-interactions.js` only when using tabs, enhanced carousel controls, or declarative dialogs.
- Replace new Tailwind uses of `border-hair` with `border-inkwell`. Existing `border-hair` markup remains supported until 4.0.
- If you copied interaction code from `examples/demo.js` or `preview.html`, replace it with the shared module and keep the documented ARIA markup.

## [3.0.1] — 2026-06-12

### Fixed
- **Tailwind v4 builds silently dropped the entire design system.** `inkwell-theme.css` pulled its two dependencies with `@import url(...)`, a form Tailwind v4's import resolver passes through instead of inlining. The unresolved imports landed below the generated rules — a spec-invalid position for `@import` — so Lightning CSS (Next.js/Turbopack) warned and dropped them: utilities like `bg-accent` compiled but pointed at undefined variables, and `.btn`/`.card`/`light-dark()` never reached the output. All three entry files (`inkwell-theme.css`, `inkwell.css`, `tokens.css`) now use the quoted form (`@import './file.css'`), which v4 toolchains inline correctly and browsers treat identically — zero change for `<link>` consumers.

## [3.0.0] — 2026-06-12

The architecture release. Zero visual change — every resolved color in every palette and mode is identical to 2.1.0 (verified by a 288-entry resolved-value parity diff, the 192-pair contrast gate, and a real-engine smoke test) — but the cascade, the entry files, and the browser floor all change shape. Spec: `docs/specs/2026-06-12-v3-architecture-design.md`.

### Added
- **Cascade layering for the pure-CSS path.** `inkwell.css` now imports `inkwell-components.css` into `@layer inkwell`, so unlayered consumer CSS always overrides Inkwell components without specificity fights — the same ergonomics the Tailwind path has had since 2.0.
- **Derived tints.** Every `*-tint` / `*-focus-ring` / `*-strong-border` / `*-tint-border` token now derives from its base via `color-mix(in srgb, var(--base) P%, transparent)`. A palette that overrides `--accent` gets correct tints for free; tokens are still declared explicitly wherever the contrast gate forced a hand-tuned value (the derive-vs-declare rule, now documented in `DESIGN_SYSTEM.md`).
- **Release tags resumed**: `v2.1.0` marks the last 2.x for raw-URL pinning; `v3.0.0` tags this release.

### Changed
- **The Pattern B dark cascade is now `light-dark()`.** Every color token is a single `:root` declaration; mode switching is `color-scheme` flipping (`light dark` auto, `[data-theme]` overrides, print forced light). The two byte-identical dark blocks in `inkwell-tokens.css` and the duplicated dark blocks in every variant are gone — a brand token's dark value now lives in exactly one place instead of four across a canonical+variant pair. The dark `.select` chevron override is the one surviving Pattern B residue (`light-dark()` only accepts colors; the chevron is a `background-image` data URI).
- **Variant files shrank ~45%** (97 → ~50 lines): single-declaration overrides; burgundy inherits every derived tint from canonical.
- **`inkwell.css` is the canonical entry** and imports the two source files directly. Install is three files (`inkwell.css`, `inkwell-tokens.css`, `inkwell-components.css`).
- **Scripts** (`build-tokens-json.mjs`, `check-contrast.mjs`) resolve `light-dark()`/`color-mix()` to concrete per-mode values. The dark-block parity assertion is gone — the failure mode it guarded no longer exists. `tokens.json` schema and values are unchanged (two alphas normalize: `0.10` → `0.1`).

### Deprecated
- **`tokens.css`** is now a one-line alias of `inkwell.css`, kept so pre-3.0 consumers keep working. Removal slated for 4.0.

### Migration
- **Browser floor: Chrome/Edge 123, Firefox 120, Safari 17.5** (all mid-2024) — `light-dark()` is the gating feature. If you must support older browsers, pin 2.1.0: `https://raw.githubusercontent.com/vscarpenter/inkwell/v2.1.0/…`.
- **If you load a second reset (normalize.css etc.) alongside Inkwell**, it now wins over Inkwell's base/type rules — unlayered CSS beats `@layer inkwell`. Drop the second reset (Inkwell ships its own) or import it into a lower layer: `@import url('normalize.css') layer(reset);`. Your intentional overrides need no change — they now *always* win, which is the point.
- **If you link `tokens.css`**, switch to `inkwell.css` at your convenience; the alias keeps working until 4.0.
- **If you parse `inkwell-tokens.css` yourself**, per-mode values now live inside `light-dark(light, dark)` functions in `:root` instead of separate dark blocks; `tokens.json` is unchanged and remains the stable machine interface.

## [2.1.0] — 2026-06-12

### Added
- **`--accent-ink` / `--on-accent` tokens.** The accent now has two jobs with two tokens: ink (links, selected tabs, badge text, the global focus outline, the `.dropcap` first letter) and fill (button backgrounds, with `--on-accent` as the label color — the checkbox checkmark now draws in `--on-accent` too). Canonical indigo is dark enough for both, so it defaults `--accent-ink: var(--accent)` and `--on-accent: var(--paper)` — zero visual change. Variants whose accent is too light to read now override the ink: clay `#A04E2C`, sage `#3A7456`. Clay's light mode also flips `--on-accent` to slate and its hover to a *lighter* coral (`--accent-d: #E08B6E`) — white-on-coral measured 3.12:1.
- **`--olive-dark`** (`#566740` light / `#9CB07A` dark) — olive as text, mirroring the existing `--warning-dark` pattern. `.badge-success` (was 3.10:1), `.stat-delta.up` (3.68:1) and `.pill.resolved` (3.68:1) now clear WCAG AA.
- **`--gray-400` + `--control-border`.** Checkbox/radio borders and the switch off-track were 1.56:1 — below WCAG 1.4.11's 3:1 for functional boundaries. `--control-border` is a 1.5px border on the new `--gray-400` neutral step (3.2:1+ on both surfaces); decorative panel hairlines stay `--gray-300`.
- **`--info-tint` / `--info-strong-border`.** `.alert.is-info` no longer borrows the accent tint; `--info` finally has a job.
- **Button states**: `:disabled`, `:active`, `.btn-sm`, and an `aria-busy="true"` spinner (reduced-motion-safe). Pair `aria-busy="true"` with `disabled` from JS — the CSS only blocks pointer events, not keyboard activation.
- **`.sr-only` and `.skip-link`** accessibility utilities.
- **`.navbar` / `.navbar-inner` / `.field-row` / `.card-grid` / `.tbl-scroll`** promoted into the component layer (every consumer was rebuilding the navbar from `index.html`).
- **`scripts/check-contrast.mjs`** — zero-dependency WCAG gate asserting 192 token-pair ratios across 4 palettes x 2 modes; wired into CI next to the tokens.json drift check.
- Print stylesheet, `::selection` styling (slate-on-oat — the accent tint was too faint to register as a selection), `text-wrap: balance/pretty` on headings and ledes.

### Changed
- **`.stat-card.is-primary`** drops the 4px accent left stripe for a 1.5px full accent border.
- **`--warning-dark`** light value `#A06A2A` → `#85561E` (3.95:1 → 5.41:1 on its tint).
- **`.tbl thead th`** text `--gray-500` → `--gray-700` (was 4.26:1 on the header fill).
- **Dark-mode hover now lifts.** Dark `--accent-d` `#6273C0` → `#8B9ADB` (button labels on the old hover read 3.90:1) and dark `--accent-tint` alpha 0.18 → 0.10 (badge-accent text read 4.07:1). Same treatment in the variants: sage dark `--accent-d` → `#7FB294`, burgundy dark `--accent-d` → `#D57E7E` with `--accent-tint` alpha → 0.10. Burgundy dark also sets an explicit `--accent-ink: #D07878` — the raw lifted accent can't clear 4.5:1 on the badge tint.
- **Variant grays**: clay/sage/burgundy `--gray-500` darkened to clear 4.5:1 on their surfaces (the BACKLOG "variant gray-500" item, option a).
- **The manual dark theme is screen-only.** Both `[data-theme="dark"]` blocks are wrapped in `@media screen`, so print always renders the light palette.
- **Theme toggle storage key** unified on `inkwell-theme` (was `theme-preview` on `index.html`/`preview.html`); pages still read the legacy `theme-preview` key as a fallback, and `examples/demo.js` validates the stored value and migrates it to the new key on first load. The snippet is hand-copied per page and marked KEEP IN SYNC; the gallery (`examples/index.html`) gets the palette pre-paint too, but deliberately still no toggle widget.
- `html { scroll-behavior: smooth }` now respects `prefers-reduced-motion`.

### Fixed
- **Dark `.select` chevron** now matches each variant's own gray (was canonical-only — BACKLOG item).
- **Pre-paint snippet eliminates flash.** Saved theme and palette now apply via a `<head>` pre-paint snippet — no flash of incorrect theme or palette on load.

### Migration
- If you styled against `.stat-card.is-primary`'s left stripe, the marker is now `border-color: var(--accent)` on the full frame.
- `.alert.is-info` is now steel-blue (`--info`), not indigo. If you wanted the accent look, use `.alert` with a custom tint.
- The global focus outline follows `--accent-ink`; in clay/sage it is now a darker, AA-passing shade.
- Re-copy `variants/*.css` alongside the core files — 2.0 variant files define no `--accent-ink`/`--gray-400`, so against a 2.1 core they fall back to canonical values (failing raw-accent text in clay/sage, cool-gray control borders on warm palettes).

## [2.0.0] — 2026-05-15

### Added
- **Palette toggle on every example page.** A `?palette=` query string selects one of four palettes — `indigo` (default), `clay`, `sage`, `burgundy` — on every page in `examples/` and on `preview.html`. The widget sits next to the existing theme toggle: localStorage persistence under `inkwell-palette`, `?palette=` URL state via `history.replaceState`, click-through cycling. Resolution order on load is URL → localStorage → `indigo`. `examples/index.html` and the root `index.html` are intentionally left without the toggle (gallery hub + starter template, respectively).
- **`scripts/build-tokens-json.mjs`** — zero-dependency Node script that regenerates `tokens.json` from `inkwell-tokens.css`. Closes the audit-#20 drift risk: the JSON is no longer hand-maintained, and a new `tokens-check.yml` workflow runs `node scripts/build-tokens-json.mjs --check` on every PR and main push that touches `inkwell-tokens.css` or `tokens.json`, failing the build with a line-level diff if the JSON is stale. The script also asserts the two dark-mode blocks (`@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`) declare identical values — a parity invariant the manual JSON couldn't enforce.

### Changed (breaking)
- **Variants are now override-only consumers of canonical.** `variants/tokens-clay.css`, `tokens-sage.css`, `tokens-burgundy.css`, `tokens-indigo.css` are **removed**. Three new files — `variants/clay.css`, `variants/sage.css`, `variants/burgundy.css` — replace them. Each is ~70 lines, contains only brand-layer token overrides for `:root` + the dark cascade, and is meant to load **after** `inkwell.css`. The "two universes" naming rule (canonical uses `--accent`, variants use `--clay`, never mix) is retired.
- **`--clay` token namespace removed.** Variants now use `--accent`, `--accent-d`, `--accent-tint`, `--accent-focus-ring`, `--accent-strong-border` — the same names canonical uses. Component CSS is no longer duplicated in `variants/tokens-clay.css`; components live once, in `inkwell-components.css`.
- **`variants/preview-clay.html`, `preview-sage.html`, `preview-burgundy.html`, `preview-indigo.html` removed.** `preview.html?palette=clay` (etc.) replaces them. `variants/compare.html` now embeds the canonical `preview.html` with `?palette=X` instead of the per-palette pages — one source of truth for the comparison view.
- **`tokens.json` formatting normalized.** The generator emits a deterministic layout: 2-space indent, single-line objects up to 120 chars, multi-line otherwise; `rgba()` values now match the CSS source spacing (`rgba(59, 74, 140, 0.14)`) instead of the previous compact form. No token values changed — just the JSON formatting. Consumers parsing JSON structurally are unaffected; consumers diffing raw bytes will see a one-time noise commit.

### Fixed
- **preview.html now listens for the parent-iframe `set-theme` postMessage.** `variants/compare.html` broadcasts theme changes to its iframes so the maintainer can flip light/dark across all palettes at once. The legacy per-palette `preview-*.html` pages (now removed) presumably listened for this; canonical preview.html did not. A small `addEventListener("message")` inside preview.html's theme IIFE restores the broadcast — transient (no localStorage write), per-session.

### Migration

For consumers of Inkwell 1.x:

| Old | New |
|---|---|
| `<link href="variants/tokens-clay.css">` | `<link href="variants/clay.css">` |
| `<link href="variants/tokens-sage.css">` | `<link href="variants/sage.css">` |
| `<link href="variants/tokens-burgundy.css">` | `<link href="variants/burgundy.css">` |
| `<link href="variants/tokens-indigo.css">` | _(none — canonical `inkwell.css` is the indigo palette)_ |
| `var(--clay)` | `var(--accent)` |
| `var(--clay-d)` | `var(--accent-d)` |
| `var(--clay-tint)` | `var(--accent-tint)` |
| `variants/preview-clay.html` (or any other preview-*.html) | `preview.html?palette=clay` |

Variant CSS files no longer `@import` canonical. If you currently link only `variants/tokens-clay.css`, you must now link both `inkwell.css` and `variants/clay.css` (in that order). For Tailwind v4 consumers: load the variant CSS **after** the Tailwind build output so the cascade order works — see the new "Using a non-default palette with Tailwind" section in TAILWIND.md.

## [1.4.0] — 2026-05-15

### Added
- **Editorial primitives.** New `.dropcap` (4.2em first-letter accent ornament), `.pullquote` (serif italic with 1.5px accent left-rule), `.byline` (+ `.byline .author` for the italic-serif author override), and `figure.figure` (+ caption with rule-anchored italic-serif `figcaption`). These are the smallest set that materially backs the system's "editorial interfaces" claim — see `preview.html` §24 for a working sample.
- **`.t-lede` type style + `--t-lede: 20px` token.** Serif italic deck/intro paragraph that sits between a headline and the body in long-form prose. Closes the gap between `.t-h3` (19px) and `.t-body` (16px). Also exposed to Tailwind as `text-lede`.
- **`.eyebrow-serif`** — italic-serif sibling to the existing mono `.eyebrow`. Mono stays the right call for product/dashboard contexts (eyebrow signals technical metadata); `.eyebrow-serif` is the magazine-kicker treatment for editorial contexts. Same accent rule, different voice.
- **`.segmented`** segmented-control component. A pill-shaped group of mutually-exclusive options sharing one outer border — use for 2–4 short labels (theme toggle, view modes, density). Mark the active option with `aria-pressed="true"` or `.is-active`. The example pages had been hand-rolling this from three `.btn-ghost`s; now it's a first-class primitive.

### Changed
- **Headlines run weight 600.** `.t-display` / `.t-h1` / `.t-h2` / `.t-h3` bumped from 500 to 600, with tracking tightened a notch (display now -0.025em, h1 -0.018em, h2 -0.012em, h3 -0.01em; display line-height 1.05). Weight 500 in `ui-serif`-fallback territory was reading as "slightly seriffed grotesque" at display sizes — 600 lets the serifs carry. Tailwind aliases in `inkwell-theme.css` mirror the new values.
- **`--serif` stack tightened.** Dropped `ui-serif` (which resolves to wildly variable fonts across platforms — New York on Apple, Noto Serif on Android, often DejaVu Serif on Linux — and can't be QA'd). New stack leads with Iowan Old Style (iOS/macOS), then Palatino (Windows), then Source Serif Pro (where installed), then Georgia (universal fallback). Every link in the chain is a serif we've verified at display sizes. No webfont — platform-stack rule preserved.
- **`.alert-title` simplified.** Dropped the per-variant title color overrides (info/success/warning/danger titles previously rendered in the tinted hue, which made the info title indistinguishable from a link). Title now stays slate; the tinted background + 1.5px tinted border carry the semantic. Pair with an icon or `role="alert"` if a third signal is needed.
- **`.card.is-link:hover` calmed.** Dropped the 3px translateY lift and the shadow swap; the hover now shifts only the border color (gray-300 → gray-500). The lift-and-glow gesture was a Material/Linear convention that fought the letterpress-quiet identity the 1.5px hairline establishes. Card transition list trimmed accordingly.
- **`.stat-card.warn` renamed to `.stat-card.is-primary`.** The old name said "warning" while the color was `--accent` — the meaning was neither warning nor primary depending on which signal you read. The class now means what it always did visually: this is the headline metric in the row. Markup must update: `class="stat-card warn"` → `class="stat-card is-primary"`. Mirrored in `variants/tokens-clay.css` and the four `variants/preview-*.html` pages.

### Migration
- `class="stat-card warn"` → `class="stat-card is-primary"` everywhere consumer markup uses it. No CSS-side fallback shipped; rename your markup.
- If you were relying on `.alert-title` taking the tint color, that's gone. The title is now `var(--slate)` in every variant. Consumers who want a colored title can target `.alert.is-X .alert-title` themselves.
- If you depended on `.card.is-link:hover` lifting and casting a shadow, both are gone. Hover now changes only the border color. Re-add the lift in your own CSS if you specifically need it for a marketing surface — but consider whether the system's calmer default fits better.
- The `--serif` token resolves to a different font on every OS now. If you previously eyeballed line-length around `ui-serif`'s OS-default rendering, re-check at display sizes — Iowan Old Style and Palatino set slightly tighter than New York / Noto Serif did.

### Deferred
- **`tokens.json` drift risk** (audit #20). The JSON has been updated by hand for `--t-lede` and the new serif stack to keep it in sync for this release, but the manual-mirror process remains. Tracked in [`BACKLOG.md`](BACKLOG.md).

## [1.3.1] — 2026-05-14

### Fixed
- **`*:focus-visible` no longer overrides element corner radius.** Removed the stray `border-radius: var(--r-xs)` line in `inkwell-components.css` — focused buttons (8px → 4px) and focusable cards (14px → 4px) were visibly snapping to a tighter corner during focus. Modern browsers already round `outline` around the element's own `border-radius` when `outline-offset` is positive, so no replacement is needed.
- **`.btn` height bumped 36px → 38px** to match `.input` / `.select`. Form rows with a button next to an input now align exactly.
- **Six raw `rgba()` literals replaced with tokens in `inkwell-components.css`** (per the §4 anti-pattern: no hex literals in component CSS). Five of them were also a dark-mode correctness bug — the colors were locked to the *light-mode* hue. New tokens: `--olive-strong-border`, `--warning-strong-border`, `--rust-focus-ring`, `--backdrop`. Affects `.alert.is-success`, `.alert.is-warning`, `.chip-dot.safe`, `.input.is-error:focus`, `.dialog::backdrop` — borders and scrims now lift correctly in dark mode.
- **`.tldr code` background no longer disappears in dark mode.** The chip used a hardcoded `rgba(255, 255, 255, 0.08)` — white at 8% — which was invisible in dark mode (where `.tldr` flips to a light surface). Replaced with the new `--tldr-code-tint` token, which carries paired light/dark values so the tint inverts with the surface. This was also the last `rgba()` literal in `inkwell-components.css`, closing out the §4 anti-pattern.
- **Documentation drift from the 1.3.0 split swept up.** Updated `DESIGN_SYSTEM.md` §1.2 / §3 / §6 / §7, `README.md` component and example counts, `CONTRIBUTING.md` project layout, `AGENTS.md` canonical-source claim, and `agent-instructions.md` §9 / §10 file lists to reference the post-split structure. No behavior change — just docs catching up to the CSS.

### Added
- **Tailwind `text-*` type-scale modifiers.** `inkwell-theme.css` now bundles `line-height`, `letter-spacing`, and `font-weight` into every `--text-{display,h1,h2,h3,body,small,caption,eyebrow}` via Tailwind v4's `--text-{name}--{modifier}` syntax. Result: `class="font-serif text-h1"` in a Tailwind template now produces the same rendered output as `class="t-h1"` in pure-CSS markup — the two consumption paths converge.
- New tokens (light + dark) in `inkwell-tokens.css`: `--olive-strong-border`, `--warning-strong-border`, `--rust-focus-ring`, `--backdrop`, `--tldr-code-tint`. Mirrored in `tokens.json` and the §1.1 token table in `DESIGN_SYSTEM.md`. None of these change existing light-mode appearance — they fix dark-mode drift and bring the system back in line with its own "no literals in components" rule.
- `tokens.json` `_meta.canonical_source` corrected from `tokens.css` to `inkwell-tokens.css` (the 1.3.0 split made the latter authoritative).

## [1.3.0] — 2026-05-11

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
