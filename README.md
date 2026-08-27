# Inkwell

A pure-CSS design system for product UI, dashboards, and technical interfaces. Drop-in tokens, 35 documented component families, light + dark mode out of the box. No consumer build step or dependencies — plus an optional interaction file and a **Tailwind v4** theme entry for projects already on Tailwind.

Inkwell ships with the **Indigo & Cloud** palette — cool stone background, deep indigo accent, serif headlines for gravitas, monospace for technical metadata, and a signature 1.5px hairline border. Four alternate palettes (Clay, Sage & Stone, Burgundy & Bone, Azure & Ink) are available as override-only CSS files in `variants/`.

## Live demo

See it in use at **[inkwell.vinny.dev](https://inkwell.vinny.dev/)** — 20 published pages built from the system. Start with the [getting-started guide](https://inkwell.vinny.dev/docs.html), use the generated [component reference](https://inkwell.vinny.dev/components.html) for copyable contracts, use the [full preview](https://inkwell.vinny.dev/preview.html) for visual review, and verify the alternate path in the [Tailwind v4 demo](https://inkwell.vinny.dev/tailwind.html). The gallery also includes product, editorial, marketing, form, search, error, release-note, carousel, and palette-comparison patterns. Source lives in [`examples/`](examples/) and deploys automatically on every push to `main`. Every deployed footer identifies the semantic release, commit-derived build number, and UTC deployment date (for example, `v3.5.0+build.N · Deployed Aug 27, 2026`).

## Quick start

Copy `inkwell.css`, `inkwell-tokens.css`, and `inkwell-components.css` into your project and link `inkwell.css` from your `<head>`:

```html
<link rel="stylesheet" href="inkwell.css">
```

`inkwell.css` `@import`s the tokens and components files directly (components go into `@layer inkwell`, so your own CSS always overrides them). Keep all three side-by-side. That's the whole install — no build step. Browser floor: Chrome/Edge 123, Firefox 120, Safari 17.5 (mid-2024) — pin the `v2.1.0` tag if you need older browsers.

Prefer zero `@import` hops? Link `inkwell-tokens.css` then `inkwell-components.css` directly — same result, two fewer serialized requests (you give up the cascade layering).

To enable theme toggling (auto / light / dark), lift the `<head>` script block from `index.html` verbatim. It writes `data-theme` on `<html>` before paint to avoid a flash.

If the page uses tabs, enhanced carousel controls, or declarative native-dialog triggers, also copy and load the optional dependency-free interaction module:

```html
<script src="inkwell-interactions.js"></script>
```

It auto-initializes and exposes `window.InkwellInteractions.init(root)` for dynamically added markup. Disclosures use native `<details>` and need no JavaScript.

### Using Tailwind v4?

Inkwell drops in as a Tailwind v4 theme. Keep `inkwell-tokens.css`, `inkwell-components.css`, and `inkwell-theme.css` side by side, then in your Tailwind entry CSS:

```css
@import "tailwindcss";
@import "./inkwell-theme.css";
```

That's the whole install — no `tailwind.config.js`, no JS preset. You get Inkwell tokens as Tailwind utilities (`bg-accent`, `text-slate`, `border-accent`, `font-serif`, `text-display`, `border-inkwell`), Inkwell components inside `@layer components`, and a `dark:` variant that honors Inkwell's `[data-theme]` toggle. `tokens.css` and `inkwell.css` are not needed unless you also want the pure-CSS shim alongside.

> Tailwind v3 is not supported — v3 requires a JS preset that conflicts with the no-build pitch. See [`TAILWIND.md`](TAILWIND.md) for the full guide (the `border-inkwell` convention, components-vs-utilities rule, cascade-order check) and [`examples/tailwind.html`](examples/tailwind.html) for a live demo that opens in a browser without a toolchain. The deprecated `border-hair` utility remains through 3.x; the CSS token `--border-hair` still correctly means a 1px internal divider.

## Using with an AI coding agent

Point Claude Code, Codex, Cursor, or any other LLM coding tool at [`agent-instructions.md`](agent-instructions.md) — a self-contained brief that walks the agent through fetching the right CSS files, the hard rules (1.5px borders, one accent, tokens-not-literals), palette switching, and the anti-patterns before it writes any markup.

```
https://raw.githubusercontent.com/vscarpenter/inkwell/v3.5.0/agent-instructions.md
```

Suggested prompt: *"Read the file at the URL above and use the Inkwell design system in this project."*

## Preview

Open any of the HTML files directly in a browser — there's nothing to compile:

```bash
open index.html              # starter template with theme toggle
open preview.html            # full component showcase
open examples/components.html # generated component adoption reference
open variants/compare.html   # side-by-side of all five palettes
open examples/tailwind.html  # Tailwind v4 integration demo (no toolchain needed)
```

## What's in the box

- **`inkwell-tokens.css`** — the canonical token layer: single-declaration `:root` custom properties (`light-dark()` per mode, `color-mix()` derived tints) + the `color-scheme` mode machinery. Brand-layer file.
- **`inkwell-components.css`** — every Inkwell component class (`.btn`, `.card`, `.alert`, `.tldr`, …) plus base reset, type styles, layout helpers, and a11y rules.
- **`inkwell.css`** — the canonical entry: imports the two files above (components into `@layer inkwell`). Link this.
- **`tokens.css`** — deprecated one-line alias of `inkwell.css`, kept so pre-3.0 consumers keep working. Removal slated for 4.0.
- **`inkwell-theme.css`** — the Tailwind v4 entry. Aliases Inkwell tokens into `@theme`, wraps components in `@layer components`, and defines the dark variant. See [`TAILWIND.md`](TAILWIND.md). Tailwind consumers still keep this file alongside `inkwell-tokens.css` and `inkwell-components.css`.
- **`inkwell-interactions.js`** — optional, dependency-free progressive enhancement for tabs, carousel controls, and declarative native-dialog triggers. The CSS core does not require it.
- **`tokens.json`** — machine-readable mirror of the token layer for Figma plugins and Style Dictionary. Generated by `scripts/build-tokens-json.mjs` (zero-dependency Node script) — re-run after editing `inkwell-tokens.css`; CI fails the build if it drifts.
- **`component-manifest.json`** — machine-readable catalog of 35 component families: selectors, anatomy, modifiers, states, accessibility, JavaScript, since-version, and copyable markup.
- **`scripts/build-components-reference.mjs`** — deterministically generates the catalog body in `examples/components.html`; CI fails on drift.
- **`scripts/check-system-contract.mjs`** — repository-wide release/adoption gate for versions, file mirrors, manifest/CSS parity, page semantics and metadata, form errors, links, and Tailwind aliases.
- **`scripts/check-contrast.mjs`** — zero-dependency WCAG contrast gate. Parses the shipped CSS and asserts 240 token-pair ratios across all five palettes in both modes; CI fails the build if any pair slips below AA.
- **`scripts/build-changelog-html.mjs`** — generates the release notes on [inkwell.vinny.dev/changelog.html](https://inkwell.vinny.dev/changelog.html) from `CHANGELOG.md`, so the live what's-new page can't drift from the written record. CI fails the build if it's stale.
- **`scripts/stamp-deployment.mjs`** — validates every deployed page's footer metadata, then stamps the Pages artifact with the current semantic release, commit-derived build number, and deployment date. It never modifies checked-in source pages.
- **`index.html`** — minimal starter (navbar, hero, theme toggle).
- **`preview.html`** — every component and state; the visual maintainer-review surface.
- **`examples/components.html`** — generated adoption reference with copyable markup and explicit component responsibilities.
- **`examples/`** — 20 deployed pages: real-feeling product/content patterns, the component reference, visual preview, Tailwind proof, and palette comparison.
- **`CHANGELOG.md`** — release history following Keep-a-Changelog conventions.
- **`variants/`** — alternate palette overrides (clay, sage, burgundy, azure). Load after `inkwell.css` to switch the brand layer. The example pages support a runtime toggle via `?palette=X`.
- **`DESIGN_SYSTEM.md`** — the canonical spec. Token tables, component list, dark-mode cascade, anti-patterns. Read this before extending the system.
- **`TAILWIND.md`** — the Tailwind v4 install guide. Conventions, the `border-inkwell` rule, components-vs-utilities, cascade-order verification.
- **`agent-instructions.md`** — self-contained brief for LLM coding agents (Claude Code, Codex, Cursor) to fetch via raw URL and apply the system without breaking its identity.
- **`CLAUDE.md`** — guidance for AI-assisted edits to this repo itself.

## Design principles

- **One accent only.** A second hue for data viz reaches for `--olive` or `--sky`, never a second saturated brand color.
- **1.5px borders.** The system's signature. Always paired with `--gray-300` via the `--border` token. Designed retina-first. Functional control boundaries (checkbox, radio, switch) use `--control-border` at ≥3:1.
- **Lifted dark accents.** Every saturated token is more luminous in dark mode (same hue, more light). Defining a token only in `:root` will look wrong on dark surfaces.
- **Type families are jobs:** serif → headings (weight 600), stat numbers, editorial primitives (lede, pullquote, byline-author, figure caption); mono → file names, hex codes, byline metadata, `.eyebrow` for product/dashboard contexts; sans → everything else. Editorial contexts get `.eyebrow-serif` instead of mono.
- **Platform fonts only.** Iowan Old Style → Palatino → Source Serif Pro → Georgia for serif; `system-ui` for sans; `ui-monospace` for mono. Instant load, zero FOUT.
- **Tokens, never literals.** Component CSS never hardcodes hex values; everything routes through tokens so palettes stay swappable.

See `DESIGN_SYSTEM.md` for the full reasoning behind each rule.

## Palette switching

Inkwell has one token layer and one component layer. All five palettes share them; switching is a one-line CSS load:

```html
<link rel="stylesheet" href="inkwell.css">
<link rel="stylesheet" href="variants/clay.css">  <!-- optional override -->
```

Indigo & Cloud is the default — no extra file needed. The example pages and `preview.html` include a runtime palette toggle (`?palette=clay`, `?palette=sage`, `?palette=burgundy`, `?palette=azure`). For Tailwind v4, load the variant after your build output so the token overrides win the cascade.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the design invariants, palette model, generated-file gates, and browser-smoke workflow.

## License

[MIT](LICENSE) © [Vinny Carpenter](https://vinny.dev)

---

*Made with hairlines and serifs by [Vinny Carpenter](https://vinny.dev). The 1.5px is on purpose.*
