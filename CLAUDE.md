# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Inkwell is a **pure CSS design system** — no consumer build step or package manager. The deliverable is five CSS files, one optional interaction file, a machine-readable component contract, and HTML reference pages. Maintainer-only Node/Playwright checks do not transform the shipped CSS. Treat it like a small library you ship by copying files, not like an application.

## File structure — do not collapse the split

```
inkwell-tokens.css       Source of truth: single-declaration :root tokens (light-dark()
                         per mode, color-mix() derived tints) + color-scheme machinery
inkwell-components.css   Source of truth: .btn, .card, .alert, base reset, type, a11y
inkwell.css              Canonical entry: imports tokens unlayered + components
                         into @layer inkwell — link this from <head>
tokens.css               DEPRECATED one-line alias of inkwell.css (removal: 4.0)
inkwell-theme.css        Tailwind v4 entry: imports inkwell-tokens.css + inkwell-components.css,
                         declares @theme aliases + @custom-variant dark
inkwell-interactions.js  Optional, dependency-free tabs/carousel/dialog/tooltip/menu behavior
component-manifest.json  Public component contract; generates examples/components.html
```

The split exists for layering: both entries (`inkwell.css` and `inkwell-theme.css`) put components inside a cascade layer while keeping tokens unlayered. **Do not** merge `inkwell-tokens.css` and `inkwell-components.css` back together.

When editing tokens (variables, colors): edit `inkwell-tokens.css`. Every color token is ONE declaration — both mode values inside `light-dark(light, dark)`; alpha tints derive from their base via `color-mix()` and are declared explicitly only where the contrast gate forces a hand-tuned alpha. Never add a separate dark block for token values — the only dark-selector rules in that file are the `color-scheme` machinery and the `.select` chevron override (a background-image, which `light-dark()` can't carry).
When editing components, base reset, type styles, layout helpers, or a11y rules: edit `inkwell-components.css`.
Use `--control-border` for functional text and selection control boundaries; keep decorative frames on `--border`. Text-bearing controls use minimum heights so text can grow. Preserve native forced-colors affordances and test changes to tabs/tooltips/menus with the optional companion.

Menus start with a hidden trigger and visible native actions; the companion owns menu roles and roving focus after enhancement. Preserve the single-level keyboard contract, native link/form defaults, and the bubbling `inkwell-menu-select` notification on the original wrapper. The missing-Popover fallback temporarily portals panels to body/open dialog; preserve tokens/direction and restore DOM on close. Run `tests/menu.spec.mjs` for native, missing-Popover, missing-invoker/anchor, no-script, RTL, focus, and viewport coverage.
Leave the browser root font size unset. Text sizes use `rem` / contextual `em`, with unitless leading; optical borders and structural dimensions keep their pixel units. Legacy JSON typography `px` fields remain 16px-reference values, additive `css` values reflect source units, and DTCG dimensions retain `rem`. Do not freeze relative type in the Tailwind aliases.
Use HTML `lang` / `dir` and logical start/end layout for RTL, including nested LTR islands. Keep tooltip viewport coordinates and centered artwork physical. `.icon-directional` mirrors only reading-direction symbols. Carousel geometry handles RTL scrolling; `init(carousel)` refreshes alignment and localized dot labels after direction/language changes. Run `tests/typography-direction.spec.mjs` for relative-type or direction changes, including real Firefox default-font preferences in a working Firefox environment.
**Do not edit `tokens.css` or `inkwell.css`** beyond `inkwell.css`'s import list. If you need to add a third source file, add it to `inkwell.css`'s `@import` list (decide layered vs. unlayered) and to `inkwell-theme.css` if it's component-shaped (so it gets layered correctly for Tailwind users).

`TAILWIND.md` is user-facing docs for the Tailwind v4 integration. The Tailwind path is supported for v4 only — v3 is explicitly out of scope. For Tailwind entry CSS, import only `@import "tailwindcss"; @import "./inkwell-theme.css";`. Keep `inkwell-tokens.css`, `inkwell-components.css`, and `inkwell-theme.css` side by side; do not also load `tokens.css` or `inkwell.css` in that Tailwind entry file.

## Working with the files

There are no commands. To preview changes, open the HTML files directly in a browser:

```
open index.html               # starter template (navbar + light/dark/auto toggle)
open preview.html             # comprehensive showcase of every component
open examples/components.html # generated adoption reference
open variants/compare.html    # side-by-side of all five palettes
open examples/tailwind.html   # Tailwind v4 + Inkwell integration demo
```

Light/dark/auto state is wired in the `<head>` of `index.html` and `preview.html` — lift that block verbatim when consuming the system in a new project.

### After editing the source CSS

The GitHub Pages workflow (`.github/workflows/pages.yml`) syncs the source CSS into `examples/` on deploy. For local testing, mirror the files manually so `examples/*.html` reflects current source:

```
cp tokens.css inkwell.css inkwell-tokens.css inkwell-components.css inkwell-theme.css inkwell-interactions.js examples/
cp preview.html examples/
mkdir -p examples/variants
cp variants/clay.css variants/sage.css variants/burgundy.css variants/azure.css variants/compare.html examples/variants/
```

If you add a new source CSS file at the repo root, also add it to the workflow's `cp` step.

After editing `component-manifest.json`, run `node scripts/build-components-reference.mjs` and commit `examples/components.html`. Before every commit, run `node scripts/check-system-contract.mjs`; it verifies mirrors, versions, manifest selectors, page landmarks/metadata, error relationships, and local links.

For HTML/CSS/interaction changes, run `npx --yes --package=playwright@1.62.1 -- sh scripts/run-browser-smoke.sh` after installing the matching Chromium, Firefox, and WebKit runtimes. The suite includes mobile targets and component resilience checks for forced colors, narrow containers, enlarged text, tab navigation, and tooltip dismissal. Forced-colors emulation runs in Chromium; native assistive-technology testing remains a separate review.

### After editing CHANGELOG.md

The releases section of `examples/changelog.html` AND the `Inkwell vX.Y.Z` footer stamp on every example page (the `data-inkwell-version` anchor), including the canonical `preview.html` and `variants/compare.html` sources and their deployed mirrors, are generated from `CHANGELOG.md`. Re-run `node scripts/build-changelog-html.mjs` and commit the regenerated pages in the same change — CI runs `--check` and fails on drift. Edit the changelog page only outside its BEGIN/END markers; never hand-edit the version stamp text.

Every HTML page in the Pages artifact also carries a `data-inkwell-deployed` `<time>` placeholder. Checked-in pages must retain `Deployment pending` and an empty `datetime`; verify them with `node scripts/stamp-deployment.mjs --check`. The Pages workflow runs on every push to `main`, checks out full history, derives `+build.N` from the commit count, and stamps only its disposable artifact copy with the UTC deployment date. Never run the stamping form against checked-in `examples/`.

## Architecture: one token layer, five palettes

### Semantic aliases and optional export

The `--surface-*` / `--text-*` color aliases are additive. Variants continue overriding the original palette tokens; aliases resolve on `:root`. Existing components retain original tokens and local primitive overrides; semantic adoption is opt-in through custom CSS or Tailwind utilities. Expose new semantic color aliases in `inkwell-theme.css` and its inline demo mapping in `examples/tailwind.html`.

Keep the original `tokens.json` schema compatible. Run `node scripts/build-tokens-json.mjs` for its additive alias entries. `node scripts/build-design-tokens.mjs` generates the optional `inkwell.tokens.json` DTCG 2025.10 export from CSS; `--check` verifies drift and `node --test tests/token-export.test.mjs` checks coverage, types, aliases, and palette/mode resolution. CI runs all three. Do not hand-edit either JSON file or introduce consumer tooling for these maintainer exports.

Browser coverage discovers every published HTML page from `examples/` and `examples/variants/`, checks light/dark/auto and 640/320px layout-equivalent zoom widths, and tests tooltip dismissal on pages that ship hints. Tooltip pages must load the companion. Linux Firefox can run in the matching official Playwright container when the macOS runtime cannot start; use a read-only immutable source snapshot and write test artifacts outside it.

Inkwell has one token layer (`inkwell-tokens.css`) and one component layer (`inkwell-components.css`). The five palettes — **Indigo & Cloud** (canonical), **Clay**, **Sage & Stone**, **Burgundy & Bone**, **Azure & Ink** — share both layers; variants are override-only stylesheets that redefine the brand-layer tokens (`--accent`, `--ivory`, `--slate`, `--oat`, neutral scale) as single `light-dark()` declarations in `:root`; they inherit canonical's `color-mix()` derived tints unless the contrast gate forced a different alpha.

Variant files (`variants/clay.css`, `variants/sage.css`, `variants/burgundy.css`, `variants/azure.css`) are ~50 lines each. Load them **after** `inkwell.css` to switch the brand layer:

```html
<link rel="stylesheet" href="inkwell.css">
<link rel="stylesheet" href="variants/clay.css">  <!-- optional override -->
```

Indigo & Cloud is the default — no extra stylesheet needed. The variant CSS files have no `@import` directives; they rely on cascade order.

**Do not** restate component CSS in variant files. Component rules live in `inkwell-components.css` and reference `var(--accent)` etc. — overriding the token is enough.

All top-level HTML pages under `examples/` and the root `preview.html` carry a runtime palette toggle (widget styled in `examples/demo.css`, wired in `examples/demo.js` or page-local JavaScript). It reads `?palette=clay` from the URL on load, persists to `localStorage("inkwell-palette")`, and dynamically swaps a `<link>` element in `<head>`. Comparison iframes opt out of persistence with `embed=compare`, so visiting `variants/compare.html` does not rewrite the saved palette. Only the root `index.html` (the minimal starter template) skips the palette picker. Every destination page also carries a hand-copied `<head>` pre-paint snippet (theme attribute + palette `<link>`); when changing it, update all copies — they are marked KEEP IN SYNC.

## Editing rules that aren't obvious from the CSS

- **Never hardcode hex values in component CSS.** Always reference tokens — adding a new palette later is trivial when everything is tokenized, painful when literals are scattered. (See "Anti-patterns" §4 in `DESIGN_SYSTEM.md`.)
- **Borders are 1.5px, not 1px or 2px.** This is the system's signature. Always pair with `--gray-300` via the `--border` token. Hairline dividers *inside* panels drop to 1px (`--gray-100`) so the outer frame stays dominant.
- **The 1.5px border is retina-first by design.** On non-retina displays (`devicePixelRatio: 1`), Chrome rounds `border-width: 1.5px` to 1px both in rendering *and* in `getComputedStyle()` reporting — so a `.card` will report `borderTopWidth: "1px"` even though the source token resolves to `1.5px solid #CFCFCC`. This is browser behavior, not a bug. Don't replace `1.5px` with box-shadow workarounds to "fix" the non-retina rendering — the workaround would break the look on retina, which is the system's primary target. If you ever need to verify the signature visually, do it on a 2x display.
- **One accent only.** If a component needs a second color for data viz, reach for `--olive` or `--sky` — never introduce a second saturated brand hue.
- **Dark-mode color rule:** every saturated token is *lifted* in dark mode (more luminance, same hue). When adding a new colored token, put both values in one declaration — `light-dark(saturated, lifted)`. A token declared with a single color value renders that value in both modes and will look wrong on dark surfaces.
- **Shadows are warm/low-spread in light, deep-pure-black in dark.** Don't reuse light-mode rgba shadows under dark mode — warm shadows vanish on dark surfaces, which is why each shadow token has a separate dark definition.
- **Type families are jobs, not preferences:** serif → headings, stat numbers, italic emphasis. Mono → eyebrows, table headers, hex codes, anything signaling "technical metadata." Sans → everything else. Don't substitute.
- **No custom fonts.** Platform stacks only — serif: Iowan Old Style / Palatino / Source Serif Pro / Georgia; sans: `system-ui`; mono: `ui-monospace`. Instant load, zero FOUT. If a task asks for a webfont, push back unless there's a strong reason.

## Where to read more

`DESIGN_SYSTEM.md` is the canonical spec — token tables, component list, dark-mode cascade, anti-patterns, quick-start snippet. `component-manifest.json` is the public machine contract and `examples/components.html` is its generated human view. Read them before designing new components or extending tokens; they document intent and adoption responsibilities that are not recoverable from selectors alone.
