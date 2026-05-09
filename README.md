# Inkwell

A pure-CSS design system for product UI, dashboards, and technical interfaces. Drop-in tokens, ten core components, light + dark mode out of the box. No build step, no dependencies.

Inkwell ships with the **Indigo & Cloud** palette — cool stone background, deep indigo accent, serif headlines for gravitas, monospace for technical metadata, and a signature 1.5px hairline border. Three alternate palettes (clay, sage, burgundy) live in `variants/` for reference.

## Quick start

Copy `tokens.css` and `inkwell.css` into your project and link them from your `<head>`:

```html
<link rel="stylesheet" href="inkwell.css">
```

`inkwell.css` is a one-line `@import` of `tokens.css` — keep both files together. That's the whole install.

To enable theme toggling (auto / light / dark), lift the `<head>` script block from `index.html` verbatim. It writes `data-theme` on `<html>` before paint to avoid a flash.

## Preview

Open any of the HTML files directly in a browser — there's nothing to compile:

```bash
open index.html              # starter template with theme toggle
open preview.html            # full component showcase
open variants/compare.html   # side-by-side of all four palettes
```

## What's in the box

- **`tokens.css`** — the canonical token layer plus all component CSS. Self-contained.
- **`inkwell.css`** — brand-named alias that imports `tokens.css`.
- **`index.html`** — minimal starter (navbar, hero, theme toggle).
- **`preview.html`** — every component, every state.
- **`variants/`** — legacy palette branch (clay base + burgundy / indigo / sage overrides). See note below.
- **`DESIGN_SYSTEM.md`** — the canonical spec. Token tables, component list, dark-mode cascade, anti-patterns. Read this before extending the system.
- **`CLAUDE.md`** — guidance for AI-assisted edits.

## Design principles

- **One accent only.** A second hue for data viz reaches for `--olive` or `--sky`, never a second saturated brand color.
- **1.5px borders.** The system's signature. Always paired with `--gray-300` via the `--border` token. Designed retina-first.
- **Lifted dark accents.** Every saturated token is more luminous in dark mode (same hue, more light). Defining a token only in `:root` will look wrong on dark surfaces.
- **Type families are jobs:** serif → headings & stat numbers, mono → eyebrows & technical metadata, sans → everything else.
- **Platform fonts only.** `ui-serif`, `system-ui`, `ui-monospace` — instant load, zero FOUT.
- **Tokens, never literals.** Component CSS never hardcodes hex values; everything routes through tokens so palettes stay swappable.

See `DESIGN_SYSTEM.md` for the full reasoning behind each rule.

## A note on the two naming systems

The repo contains two separately-evolved branches of the system. Don't mix them:

- **Root `tokens.css`** (current) names its accent `--accent`. Use this for new work.
- **`variants/`** (legacy) names its accent `--clay` regardless of actual hue — the indigo variant in that folder still uses `var(--clay)`. Components inside `variants/tokens-clay.css` reference that name, so it can't be renamed without breaking them.

Don't reference `--clay` from anything built on root `tokens.css`, and don't introduce `--accent` inside `variants/`. They're two universes.

## License

[MIT](LICENSE) © Vinny Carpenter
