# Inkwell × Tailwind v4

Inkwell ships as **pure CSS first**. If you're not using Tailwind, ignore this file — link [`inkwell.css`](inkwell.css) from your `<head>` and you're done.

If you're on **Tailwind v4 (October 2024 or later)**, Inkwell drops in as a theme. Inkwell's tokens become Tailwind utilities (`bg-accent`, `text-slate`, `border-accent`, `font-serif`, `rounded-md`, `text-display`, `max-w-default`), the components keep working (`.btn`, `.card`, `.alert`, …), and the `dark:` variant honors Inkwell's `[data-theme]` toggle exactly the way the rest of Inkwell does. No `tailwind.config.js`. No JavaScript preset.

> **Tailwind v3 is not supported.** v3 requires a JS preset, which breaks Inkwell's no-build pitch. v4 shipped CSS-first config; that's the supported integration. If you're on v3, either upgrade to v4 or skip the Tailwind layer and use Inkwell directly via `inkwell.css`.

---

## Install

The Tailwind path uses three Inkwell files:

| File | Purpose |
|---|---|
| [`inkwell-tokens.css`](inkwell-tokens.css) | Single-declaration `:root` custom properties (`light-dark()` per mode) + `color-scheme` machinery. The brand layer. |
| [`inkwell-components.css`](inkwell-components.css) | `.btn`, `.card`, `.alert`, base reset, type styles, layout helpers, a11y. |
| [`inkwell-theme.css`](inkwell-theme.css) | The Tailwind v4 entry: imports the two above, declares `@theme` aliases, and the dark variant. **This is the only Inkwell file you import from your Tailwind entry CSS.** |

If you also want the pure-CSS entry for non-Tailwind consumers, keep [`inkwell.css`](inkwell.css) beside those three files (and optionally the deprecated `tokens.css` alias). Tailwind itself does not need them.

Then, in your Tailwind entry CSS — typically `app.css`, `globals.css`, or whatever your build pipeline points at:

```css
@import "tailwindcss";
@import "./inkwell-theme.css";
```

That's the install. **Order matters**: Tailwind must come first so the `@theme` aliases in `inkwell-theme.css` can extend it. That gives you Inkwell tokens as Tailwind utilities (`bg-accent`, `text-slate`, `border-accent`, `font-serif`, `text-display`, `border-hair`, `text-accent-ink`, `bg-olive-dark`, `border-gray-400`, `bg-info-tint`), Inkwell components in `@layer components`, and a `dark:` variant that honors Inkwell's `[data-theme]` toggle.

### Live example

Open [`examples/tailwind.html`](examples/tailwind.html) — it uses the in-browser Tailwind v4 compiler so it works without a toolchain, and demonstrates every integration point on one page. The file's footer documents the small inline-vs-imported difference between the demo and a real build.

---

## What you get

Inkwell's tokens are aliased into Tailwind's namespace, so all of these utility classes are generated for you:

**Surfaces & text** — `bg-ivory`, `bg-paper`, `bg-slate`, `bg-oat`, `text-slate`, `text-ivory`, `text-paper`

**Neutrals** — `bg-gray-{100,200,300,400,500,700}`, `text-gray-*`, `border-gray-*` (`border-gray-400` is the functional control-boundary step)

**Accent family** — `bg-accent`, `bg-accent-d` (hover), `bg-accent-tint`, `ring-accent-focus`, `border-accent-strong-border`, `text-accent-ink` (accent as text), `text-on-accent` (labels on accent fills), plus all the `text-*` and `border-*` variants. Alpha tints stay as named tokens, not Tailwind's `/N` opacity scale, so the specific alpha values used throughout Inkwell — e.g. the accent tint's 0.14 light / 0.10 dark — are preserved.

**Semantic** — `bg-olive`, `bg-olive-tint`, `bg-olive-dark`, `bg-rust`, `bg-rust-d`, `bg-rust-tint`, `bg-rust-tint-border`, `bg-warning`, `bg-warning-dark`, `bg-warning-tint`, `bg-info`, `bg-info-tint`, `bg-sky`

**Type** — `font-serif`, `font-sans`, `font-mono`, plus `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-lede`, `text-body`, `text-small`, `text-caption`, `text-eyebrow`. Each bundles line-height, letter-spacing, and font-weight, so a single utility like `text-h1` produces the same rendering as the `.t-h1` class. **Note:** Tailwind v4's `--text-*` modifier set doesn't include `font-style`, so `text-lede` ships size/line-height/weight only. The pure-CSS `.t-lede` class is italic; in Tailwind markup, pair the utility with `italic` — `class="font-serif text-lede italic text-gray-700"`.

**Radii** — `rounded-xs`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`

**The 1.5px border signature** — `border-hair` (see the next section)

**Containers** — `max-w-narrow` (820px), `max-w-default` (920px), `max-w-wide` (1120px)

You also get every component class from `inkwell-components.css`: `.btn`, `.btn-primary`, `.card`, `.alert`, `.tldr`, `.stat-card` (+ `.is-primary`), `.tbl`, `.eyebrow` / `.eyebrow-serif`, `.segmented`, the editorial primitives (`.dropcap`, `.pullquote`, `.byline`, `figure.figure`), and so on. They sit inside `@layer components`, so Tailwind utilities override them when they collide.

---

## The `border-hair` convention

Inkwell's signature is a **1.5px border**. Tailwind's default `border` utility is **1px**. We deliberately keep Tailwind's default alone — overriding it globally would surprise any third-party Tailwind component you might pull in. Instead, Inkwell exposes a named utility:

```html
<!-- Inkwell-flavored panel -->
<div class="border-hair border-solid border-gray-300 rounded-md bg-paper p-5">
  …
</div>

<!-- Generic Tailwind panel (1px) -->
<div class="border border-gray-300 rounded-md bg-paper p-5">
  …
</div>
```

Reach for `border-hair` whenever the element should feel like Inkwell. Reach for `border` when it shouldn't.

---

## Dark mode

Inkwell's dark mode is automatic via `prefers-color-scheme: dark`, with a manual override via `[data-theme="light"|"dark"]` on `<html>` (since 3.0 this is implemented as `color-scheme` flipping + `light-dark()` tokens rather than dark-block redeclarations — same behavior, one declaration per token). With Tailwind v4 in the mix, there are **two paths** to dark mode and they handle different cases:

### Path 1 — token shifting (handles most things automatically)

Inkwell's tokens themselves change values in dark mode. When you use a token-driven utility like `bg-paper` or `text-slate`, the *value* of `--paper` and `--slate` flips on dark — so the same utility produces the right color in both modes, with **no `dark:` prefix needed**:

```html
<!-- Same classes in both modes. --paper / --slate / --accent shift on dark. -->
<div class="bg-paper text-slate border-hair border-gray-300 rounded-md p-5">
  Adapts to OS dark and to the manual toggle automatically.
</div>
```

This works under **both** `prefers-color-scheme: dark` *and* `[data-theme="dark"]`, because the token cascade in [`inkwell-tokens.css`](inkwell-tokens.css) handles both at the variable level. You get the right look without ever writing a `dark:` prefix.

### Path 2 — Tailwind's `dark:` variant (when you need different utilities per mode)

If you need a *different* utility per mode — e.g. swap `bg-paper` for `bg-accent` in dark — use Tailwind's `dark:` variant:

```html
<!-- Light: paper bg, slate text. Dark: accent bg, on-accent label. -->
<div class="bg-paper text-slate dark:bg-accent dark:text-on-accent rounded-md p-5">
  …
</div>
```

The custom variant in `inkwell-theme.css` fires the `dark:` prefix when `[data-theme="dark"]` is set on `<html>`. **It does NOT fire on `prefers-color-scheme: dark` alone** — that's a deliberate scope limit (the multi-condition block form that would handle both isn't reliably compiled by every Tailwind v4 toolchain, including the in-browser CDN). If you want `dark:` utilities to react to OS preference too, mirror OS preference into the attribute via a small bootstrap script:

```html
<!-- In <head>, before paint -->
<script>
  (function () {
    var s = localStorage.getItem('inkwell-theme') || localStorage.getItem('theme-preview') || 'auto';
    if (s === 'light' || s === 'dark') {
      document.documentElement.setAttribute('data-theme', s);
    } else if (matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
```

With this script, "auto" mode follows OS preference *and* sets `data-theme="dark"` when appropriate — so `dark:` utilities fire correctly in all three modes.

### Toggle UI

To wire a three-button toggle (auto / light / dark) that does both the mirror and OS-change-listening, lift the `<script>` block at the bottom of [`examples/tailwind.html`](examples/tailwind.html) verbatim. `localStorage` key is `inkwell-theme` (the legacy `theme-preview` key is read as a fallback), values are `auto` / `light` / `dark`.

---

## Components for primitives, utilities for layout

This is the rule that keeps Inkwell looking like Inkwell when Tailwind is in the mix.

| Use | For |
|---|---|
| **Components** (`.btn`, `.card`, `.alert`, `.tldr`, `.stat-card`, `.tbl`, …) | Primitives. The visual identity of "a button" or "a card" is the system. Compose them with utilities — don't recompose them from utilities. |
| **Utilities** (`grid`, `gap-*`, `max-w-*`, `flex`, `p-*`, `space-y-*`) | Layout. Where things sit on the page, how they're spaced, how they wrap. Tailwind's strength. |
| **`border-hair`, `bg-accent`, `text-slate`, `font-serif`** | Anywhere you need the brand token applied to non-component markup. |

The footgun to avoid: rebuilding a button from utilities just because you can.

```html
<!-- Wrong — recreates "a button" out of utilities, loses the 1.5px feel, the
     transition curve, the focus halo, and won't track changes to .btn -->
<button class="bg-accent text-paper rounded-md px-4 py-2 hover:bg-accent-d">…</button>

<!-- Right — let Inkwell own "what a button looks like"; let Tailwind own width -->
<button class="btn btn-primary w-full">…</button>
```

---

## Using a non-default palette with Tailwind

The variant CSS files (`variants/clay.css`, `variants/sage.css`, `variants/burgundy.css`) override `--accent` and a handful of other brand-layer tokens. Tailwind utilities that reference those tokens via `@theme` (e.g. `bg-accent`, `bg-accent-tint`, `border-gray-300`) follow the variant automatically — no extra Tailwind config needed.

Variants also override `--accent-ink`/`--on-accent` where needed — clay's coral and sage's green are too light to read as text, so they ship darker ink values. Utilities like `text-accent-ink` stay AA in every palette; that's the token to reach for when you want accent-colored text rather than an accent fill.

The only requirement: load the variant CSS **after** Tailwind's build output, so its `:root` overrides win the cascade. For example:

```html
<link rel="stylesheet" href="/dist/styles.css">    <!-- Tailwind build (imports inkwell-theme.css) -->
<link rel="stylesheet" href="/variants/clay.css">  <!-- palette override, loads after -->
```

Reverse the order and Tailwind's `@theme`-derived rules win, leaving the default indigo accent active despite the variant being loaded.

---

## Cascade order — verifying the integration works

The component-vs-utility precedence is the integration's load-bearing detail. Sanity check it like this after wiring everything up:

1. **Components render correctly on their own.** Drop a `<button class="btn btn-primary">Test</button>` into a page. It should look like Inkwell's button — 1.5px transparent border, 38px tall, `--accent` background, serif-free.
2. **Utilities override components.** Add a utility: `<button class="btn btn-primary px-12">Test</button>`. The horizontal padding should jump. If it doesn't, `inkwell-components.css` is loading *unlayered* and beating Tailwind. Confirm your entry CSS does `@import "tailwindcss"` **before** `@import "./inkwell-theme.css"`.
3. **`dark:` follows the toggle.** Add a toggle (see previous section). Pick `dark` manually. Both Inkwell components and any `dark:` utilities you've placed should flip together. If only one flips, you've imported only the component CSS without `inkwell-theme.css`, or vice versa — `inkwell-theme.css` is what wires the `@custom-variant dark` block into Tailwind.

---

## What we deliberately don't expose

A few Inkwell tokens are intentionally NOT mapped to Tailwind utilities:

- **Spacing scale.** Inkwell's `--sp-1..8` (4, 8, 12, 16, 24, 32, 48, 64) already lines up with Tailwind's `1, 2, 3, 4, 6, 8, 12, 16` × 4px. Exposing them under a second name would only create confusion.
- **Z-index tiers.** `--z-base/raised/sticky/overlay/modal` exist for authoring inside `inkwell-components.css`. Tailwind's standard `z-*` utilities serve consumers fine.
- **Transitions.** Tailwind's `duration-*` is already token-flavored. Inkwell's `--t-fast/base/slow` stay internal.
- **Shadows.** Inkwell's shadows are tuned for specific component contexts (cards, dropdowns, the dialog `::backdrop`). They live in the components, not the utility surface.

If you reach for one of these and find it missing, use the equivalent Tailwind utility — that's the intended path.

---

## File reference

- [`inkwell-theme.css`](inkwell-theme.css) — the Tailwind v4 entry. Imports tokens and components, declares `@theme` aliases, defines `@custom-variant dark`.
- [`inkwell-tokens.css`](inkwell-tokens.css) — single-declaration `:root` custom properties (`light-dark()` per mode, `color-mix()` derived tints) + `color-scheme` mode machinery.
- [`inkwell-components.css`](inkwell-components.css) — every Inkwell component class plus base reset, type styles, layout helpers, and a11y.
- [`inkwell.css`](inkwell.css) — pure-CSS entry for non-Tailwind consumers (components in `@layer inkwell`). Not needed for Tailwind setups; `tokens.css` is its deprecated alias.
- [`examples/tailwind.html`](examples/tailwind.html) — live integration demo that opens in a browser without a build.
- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) — the canonical spec for Inkwell itself. Read this for the *why* behind the 1.5px border, the lifted dark accent, the cool-putty neutrals.

---

*Inkwell stays zero-build. The Tailwind path inherits whatever build Tailwind already needs — no new tooling is introduced on Inkwell's side.*
