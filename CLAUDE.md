# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Inkwell is a **pure CSS design system** — no build step, no package manager, no tests. The deliverable is five CSS files (`inkwell-tokens.css`, `inkwell-components.css`, `tokens.css`, `inkwell.css`, `inkwell-theme.css`) plus HTML reference pages. Treat it like a small library you ship by copying files, not like an application.

## File structure — do not collapse the split

```
inkwell-tokens.css       Source of truth: :root custom properties + Pattern B dark cascade
inkwell-components.css   Source of truth: .btn, .card, .alert, base reset, type, a11y
tokens.css               @import-aggregates the two files above (backward-compat shim)
inkwell.css              @import-aggregates tokens.css (brand-named alias)
inkwell-theme.css        Tailwind v4 entry: imports inkwell-tokens.css + inkwell-components.css,
                         declares @theme aliases + @custom-variant dark
```

The split exists for Tailwind v4 support: `inkwell-theme.css` needs to put components inside `@layer components` while keeping tokens unlayered. **Do not** merge `inkwell-tokens.css` and `inkwell-components.css` back together — `tokens.css` is the merged view and exists exactly so consumers who don't care about the split can pretend it's still one file.

When editing tokens (variables, colors, dark cascade): edit `inkwell-tokens.css`.
When editing components, base reset, type styles, layout helpers, or a11y rules: edit `inkwell-components.css`.
**Do not edit `tokens.css` or `inkwell.css`** — they're aggregator shims. If you need to add a third source file, also update `tokens.css`'s `@import` list and `inkwell-theme.css` if the new file is component-shaped (so it gets layered correctly for Tailwind users).

`TAILWIND.md` is user-facing docs for the Tailwind v4 integration. The Tailwind path is supported for v4 only — v3 is explicitly out of scope. For Tailwind entry CSS, import only `@import "tailwindcss"; @import "./inkwell-theme.css";`. Keep `inkwell-tokens.css`, `inkwell-components.css`, and `inkwell-theme.css` side by side; do not also load `tokens.css` or `inkwell.css` in that Tailwind entry file.

## Working with the files

There are no commands. To preview changes, open the HTML files directly in a browser:

```
open index.html               # starter template (navbar + light/dark/auto toggle)
open preview.html             # comprehensive showcase of every component
open variants/compare.html    # side-by-side of all four palettes
open examples/tailwind.html   # Tailwind v4 + Inkwell integration demo
```

Light/dark/auto state is wired in the `<head>` of `index.html` and `preview.html` — lift that block verbatim when consuming the system in a new project.

### After editing the source CSS

The GitHub Pages workflow (`.github/workflows/pages.yml`) syncs the source CSS into `examples/` on deploy. For local testing, mirror the files manually so `examples/*.html` reflects current source:

```
cp tokens.css inkwell.css inkwell-tokens.css inkwell-components.css inkwell-theme.css examples/
mkdir -p examples/variants
cp variants/clay.css variants/sage.css variants/burgundy.css examples/variants/
```

If you add a new source CSS file at the repo root, also add it to the workflow's `paths:` trigger and the `cp` step.

## Architecture: two parallel naming systems

This is the most important thing to internalize before editing tokens or component CSS. The repo contains **two separately-evolved branches of the system** that must not be mixed:

### Branch 1 — root `tokens.css` (canonical, current)

- Self-contained, no `@import`. Default palette baked in: **Indigo & Cloud**.
- Accent is named **`--accent`** (semantic).
- Dark mode is built into the same file (Pattern B: auto via `prefers-color-scheme`, manual override via `[data-theme="light"|"dark"]` on `<html>`).
- `inkwell.css` is a one-line `@import url('tokens.css')` — the brand-named alias projects link from `<head>`.
- **Use this for any new work.**

### Branch 2 — `variants/` (legacy / reference)

- `tokens-clay.css` is the **base** (532 lines, full system; predates `tokens.css`).
- `tokens-burgundy.css`, `tokens-indigo.css`, `tokens-sage.css` (~100 lines each) all `@import url('tokens-clay.css')` and override only the brand-layer tokens.
- Accent is named **`--clay`** *regardless of actual hue* — the indigo variant still uses `var(--clay)`. Don't rename it; the components in `tokens-clay.css` reference it.
- Some semantic-color rgba literals were hardcoded to clay's coral in `tokens-clay.css`, so each variant restates `.input:focus` and `.chip-dot.attention` with the new color. If you add a component that uses the accent in an rgba(), you must do the same in every variant.

**Do not** introduce `--accent` references inside `variants/` files, and do not reference `--clay` from anywhere built on top of root `tokens.css`. They're two universes.

## Editing rules that aren't obvious from the CSS

- **Never hardcode hex values in component CSS.** Always reference tokens — adding a new palette later is trivial when everything is tokenized, painful when literals are scattered. (See "Anti-patterns" §4 in `DESIGN_SYSTEM.md`.)
- **Borders are 1.5px, not 1px or 2px.** This is the system's signature. Always pair with `--gray-300` via the `--border` token. Hairline dividers *inside* panels drop to 1px (`--gray-100`) so the outer frame stays dominant.
- **The 1.5px border is retina-first by design.** On non-retina displays (`devicePixelRatio: 1`), Chrome rounds `border-width: 1.5px` to 1px both in rendering *and* in `getComputedStyle()` reporting — so a `.card` will report `borderTopWidth: "1px"` even though the source token resolves to `1.5px solid #CFCFCC`. This is browser behavior, not a bug. Don't replace `1.5px` with box-shadow workarounds to "fix" the non-retina rendering — the workaround would break the look on retina, which is the system's primary target. If you ever need to verify the signature visually, do it on a 2x display.
- **One accent only.** If a component needs a second color for data viz, reach for `--olive` or `--sky` — never introduce a second saturated brand hue.
- **Dark-mode color rule:** every saturated token is *lifted* in dark mode (more luminance, same hue). When adding a new colored token, define both light and dark values in the same shape: saturated in light, lifted in dark. A token that's only defined in `:root` will look wrong on dark surfaces.
- **Shadows are warm/low-spread in light, deep-pure-black in dark.** Don't reuse light-mode rgba shadows under dark mode — warm shadows vanish on dark surfaces, which is why each shadow token has a separate dark definition.
- **Type families are jobs, not preferences:** serif → headings, stat numbers, italic emphasis. Mono → eyebrows, table headers, hex codes, anything signaling "technical metadata." Sans → everything else. Don't substitute.
- **No custom fonts.** Platform stacks only (`ui-serif`, `system-ui`, `ui-monospace`) — instant load, zero FOUT. If a task asks for a webfont, push back unless there's a strong reason.

## Where to read more

`DESIGN_SYSTEM.md` is the canonical spec — token tables, component list, dark-mode cascade, anti-patterns, quick-start snippet. Read it before designing new components or extending tokens; it documents intent (the *why* behind the 1.5px border, the lifted dark accent, the cool-putty neutrals) that isn't recoverable from the CSS alone.
