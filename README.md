# Inkwell

A pure-CSS design system for product UI, dashboards, and technical interfaces. Drop-in tokens, two dozen components, light + dark mode out of the box. No build step, no dependencies — and an optional **Tailwind v4** theme entry for projects already on Tailwind.

Inkwell ships with the **Indigo & Cloud** palette — cool stone background, deep indigo accent, serif headlines for gravitas, monospace for technical metadata, and a signature 1.5px hairline border. Three alternate palettes (clay, sage, burgundy) live in `variants/` for reference.

## Live demo

See it in use at **[inkwell.vinny.dev](https://inkwell.vinny.dev/)** — fifteen sample pages built entirely with the design system, including a [getting-started guide](https://inkwell.vinny.dev/docs.html), a [marketing landing page](https://inkwell.vinny.dev/landing.html), a [search results layout](https://inkwell.vinny.dev/search.html), a [changelog](https://inkwell.vinny.dev/changelog.html), product pages (dashboard, settings, profile, pricing, sign-in), editorial layouts, a 404, and a [Tailwind v4 integration demo](https://inkwell.vinny.dev/tailwind.html). Source lives in [`examples/`](examples/) and deploys automatically on every push to `main`.

## Quick start

Copy `tokens.css`, `inkwell.css`, `inkwell-tokens.css`, and `inkwell-components.css` into your project and link `inkwell.css` from your `<head>`:

```html
<link rel="stylesheet" href="inkwell.css">
```

`inkwell.css` `@import`s `tokens.css`, which `@import`s the tokens and components files. Keep all four side-by-side. That's the whole install — no build step.

To enable theme toggling (auto / light / dark), lift the `<head>` script block from `index.html` verbatim. It writes `data-theme` on `<html>` before paint to avoid a flash.

### Using Tailwind v4?

Inkwell drops in as a Tailwind v4 theme. Keep `inkwell-tokens.css`, `inkwell-components.css`, and `inkwell-theme.css` side by side, then in your Tailwind entry CSS:

```css
@import "tailwindcss";
@import "./inkwell-theme.css";
```

That's the whole install — no `tailwind.config.js`, no JS preset. You get Inkwell tokens as Tailwind utilities (`bg-accent`, `text-slate`, `border-accent`, `font-serif`, `text-display`, `border-hair`), Inkwell components inside `@layer components`, and a `dark:` variant that honors Inkwell's `[data-theme]` toggle. `tokens.css` and `inkwell.css` are not needed unless you also want the pure-CSS shim alongside.

> Tailwind v3 is not supported — v3 requires a JS preset that conflicts with the no-build pitch. See [`TAILWIND.md`](TAILWIND.md) for the full guide (the `border-hair` convention, components-vs-utilities rule, cascade-order check) and [`examples/tailwind.html`](examples/tailwind.html) for a live demo that opens in a browser without a toolchain.

## Using with an AI coding agent

Point Claude Code, Codex, Cursor, or any other LLM coding tool at [`agent-instructions.md`](agent-instructions.md) — a self-contained brief that walks the agent through fetching the right CSS files, the hard rules (1.5px borders, one accent, tokens-not-literals), the two-universes warning, and the anti-patterns before it writes any markup.

```
https://raw.githubusercontent.com/vscarpenter/inkwell/main/agent-instructions.md
```

Suggested prompt: *"Read the file at the URL above and use the Inkwell design system in this project."*

## Preview

Open any of the HTML files directly in a browser — there's nothing to compile:

```bash
open index.html              # starter template with theme toggle
open preview.html            # full component showcase
open variants/compare.html   # side-by-side of all four palettes
open examples/tailwind.html  # Tailwind v4 integration demo (no toolchain needed)
```

## What's in the box

- **`inkwell-tokens.css`** — the canonical token layer: `:root` custom properties + Pattern B dark cascade. Brand-layer file.
- **`inkwell-components.css`** — every Inkwell component class (`.btn`, `.card`, `.alert`, `.tldr`, …) plus base reset, type styles, layout helpers, and a11y rules.
- **`tokens.css`** — backward-compat aggregator that `@import`s the two files above. Existing consumers that link `tokens.css` directly still work unchanged.
- **`inkwell.css`** — brand-named alias that imports `tokens.css`.
- **`inkwell-theme.css`** — the Tailwind v4 entry. Aliases Inkwell tokens into `@theme`, wraps components in `@layer components`, and defines the dark variant. See [`TAILWIND.md`](TAILWIND.md). Tailwind consumers still keep this file alongside `inkwell-tokens.css` and `inkwell-components.css`.
- **`tokens.json`** — machine-readable mirror of the token layer for Figma plugins and Style Dictionary. Regenerate when the tokens file changes.
- **`index.html`** — minimal starter (navbar, hero, theme toggle).
- **`preview.html`** — every component, every state.
- **`examples/`** — real-feeling pages (dashboard, docs, landing, search, changelog, forms, 404, plus a Tailwind v4 integration demo) built only from the design system. Also the deployed live demo.
- **`CHANGELOG.md`** — release history following Keep-a-Changelog conventions.
- **`variants/`** — legacy palette branch (clay base + burgundy / indigo / sage overrides). See note below.
- **`DESIGN_SYSTEM.md`** — the canonical spec. Token tables, component list, dark-mode cascade, anti-patterns. Read this before extending the system.
- **`TAILWIND.md`** — the Tailwind v4 install guide. Conventions, the `border-hair` rule, components-vs-utilities, cascade-order verification.
- **`agent-instructions.md`** — self-contained brief for LLM coding agents (Claude Code, Codex, Cursor) to fetch via raw URL and apply the system without breaking its identity.
- **`CLAUDE.md`** — guidance for AI-assisted edits to this repo itself.

## Design principles

- **One accent only.** A second hue for data viz reaches for `--olive` or `--sky`, never a second saturated brand color.
- **1.5px borders.** The system's signature. Always paired with `--gray-300` via the `--border` token. Designed retina-first.
- **Lifted dark accents.** Every saturated token is more luminous in dark mode (same hue, more light). Defining a token only in `:root` will look wrong on dark surfaces.
- **Type families are jobs:** serif → headings (weight 600), stat numbers, editorial primitives (lede, pullquote, byline-author, figure caption); mono → file names, hex codes, byline metadata, `.eyebrow` for product/dashboard contexts; sans → everything else. Editorial contexts get `.eyebrow-serif` instead of mono.
- **Platform fonts only.** Iowan Old Style → Palatino → Source Serif Pro → Georgia for serif; `system-ui` for sans; `ui-monospace` for mono. Instant load, zero FOUT.
- **Tokens, never literals.** Component CSS never hardcodes hex values; everything routes through tokens so palettes stay swappable.

See `DESIGN_SYSTEM.md` for the full reasoning behind each rule.

## A note on the two naming systems

The repo contains two separately-evolved branches of the system. Don't mix them:

- **Root `tokens.css`** (current) names its accent `--accent`. Use this for new work.
- **`variants/`** (legacy) names its accent `--clay` regardless of actual hue — the indigo variant in that folder still uses `var(--clay)`. Components inside `variants/tokens-clay.css` reference that name, so it can't be renamed without breaking them.

Don't reference `--clay` from anything built on root `tokens.css`, and don't introduce `--accent` inside `variants/`. They're two universes.

The Tailwind v4 integration targets the root `--accent` universe only — `variants/` is not Tailwind-compatible. If you want a clay/sage/burgundy-flavored Tailwind build, override `--accent` and the surface tokens in your own CSS after `@import "./inkwell-theme.css"`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the design invariants, the two-universes rule, and how to verify changes without a test suite.

## License

[MIT](LICENSE) © [Vinny Carpenter](https://vinny.dev)

---

*Made with hairlines and serifs by [Vinny Carpenter](https://vinny.dev). The 1.5px is on purpose.*
