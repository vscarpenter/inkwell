# Inkwell

A reusable design system for product UI, dashboards, and technical interfaces. Drop-in CSS tokens, ten core components, light + dark mode out of the box.

**Inkwell** ships with the **Indigo & Cloud** palette — cool stone background, deep indigo accent, serif headlines for gravitas, monospace for technical metadata, hairline 1.5px borders. Reads as Linear/Stripe/Notion-adjacent without being a clone of any of them.

The system separates *structure* (borders, type scale, spacing, motion, components) from *brand* (colors). Three alternate palettes — warm clay, forest sage, literary burgundy — are preserved in `variants/` for reference. The structural layer is identical across all four; only the brand-layer tokens differ.

> **Why "Inkwell"?** Print metaphor for editorial discipline; an inkwell is also a dark vessel, which signals dark mode is a first-class concern. Color-agnostic — the name still fits if you ever swap palettes.

---

## 1. Foundations

### 1.1 Color

A small palette (12 hues) with one accent doing all the work. Neutrals are *cool putty* — slightly warm but biased away from cream. Both light and dark modes are defined; dark mode applies automatically via `prefers-color-scheme: dark` unless overridden by `data-theme="light"`.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--ivory` | `#F4F4F0` | `#0F1018` | Page background |
| `--paper` | `#FFFFFF` | `#181A24` | Cards, panels, inputs |
| `--slate` | `#13141B` | `#E8E8EE` | Primary text |
| `--oat` | `#DDDCDF` | `#2B2D38` | Tertiary surface, hover thumbnails |
| `--accent` | `#3B4A8C` | `#7A8AD1` | **Primary accent** — links, focus, active state |
| `--accent-d` | `#2A3768` | `#6273C0` | Hover/pressed accent |
| `--accent-tint` | `rgba(59,74,140,0.14)` | `rgba(122,138,209,0.18)` | Badge background |
| `--accent-focus-ring` | `rgba(59,74,140,0.18)` | `rgba(122,138,209,0.28)` | Input focus halo |
| `--accent-strong-border` | `rgba(59,74,140,0.5)` | `rgba(122,138,209,0.6)` | Tinted chip border |
| `--olive` | `#788C5D` | `#9CB07A` | Success, additions |
| `--olive-strong-border` | `rgba(120,140,93,0.45)` | `rgba(156,176,122,0.6)` | Tinted success border |
| `--rust` | `#B04A3F` | `#D27468` | Danger, deletions |
| `--rust-focus-ring` | `rgba(176,74,63,0.18)` | `rgba(210,116,104,0.28)` | `.is-error` focus halo |
| `--warning` | `#C78E3F` | `#D9A55F` | Amber warning |
| `--warning-strong-border` | `rgba(199,142,63,0.45)` | `rgba(217,165,95,0.6)` | Tinted warning border |
| `--info` / `--sky` | `#5C7CA3` / `#6A8CAF` | `#7C9FD2` / `#85A6CB` | Informational accents |
| `--backdrop` | `rgba(15,16,24,0.55)` | `rgba(0,0,0,0.6)` | `dialog::backdrop` scrim |
| `--tldr-code-tint` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | `.tldr code` chip overlay — inverts with the `.tldr` surface |
| `--gray-100` | `#EDEDEA` | `#1E1F29` | Subtle row stripe, code-chip bg |
| `--gray-200` | `#E1E1DE` | `#262732` | Divider on white |
| `--gray-300` | `#CFCFCC` | `#34363F` | **Default border** — the 1.5px hairline |
| `--gray-500` | `#85858A` | `#9A9AA0` | Muted text, captions |
| `--gray-700` | `#3A3B41` | `#C0C0C7` | Secondary body text |

**Why the dark accent is *lifted***: `#3B4A8C` against a near-black background reads as a hole punched in the page rather than an accent. The dark variant `#7A8AD1` (periwinkle) restores the sense of a "highlighted element" by retaining hue while gaining luminance. This pattern — saturated in light, lifted in dark — applies to all colored tokens.

### 1.2 Typography

Three font families, each with a clear job. No custom fonts — platform stacks for instant load and zero FOUT.

```css
--serif: "Iowan Old Style", "Palatino", "Palatino Linotype",
         "Source Serif Pro", Georgia, serif;
--sans:  system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--mono:  ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
```

The serif stack drops `ui-serif` (which resolves to wildly different fonts across platforms — New York on Apple, Noto Serif on Android, DejaVu Serif on Linux) and leads with platform serifs we've QA'd at display sizes. Iowan Old Style covers iOS/macOS; Palatino covers Windows; Source Serif Pro picks up where it's installed; Georgia is the final fallback and renders consistently everywhere.

| Family | Job |
|---|---|
| **Serif** | All headings, stat numbers, italic-emphasized phrases, editorial primitives (lede, pullquote, byline-author, figure caption). Editorial gravitas. |
| **Sans** (system-ui) | Body text, buttons, labels. The default. |
| **Mono** | File names, hex codes, code chips, byline metadata, table-numeric cells. Anything that signals "technical metadata." Also used by `.eyebrow` for product/dashboard contexts; editorial contexts get `.eyebrow-serif` instead. |

Type scale (use the `.t-*` classes shipped in `inkwell-components.css`):

| Class | Family | Size | Line-height | Weight | Tracking |
|---|---|---|---|---|---|
| `.t-display` | serif | 48px | 1.05 | 600 | -0.025em |
| `.t-h1` | serif | 32px | 1.2 | 600 | -0.018em |
| `.t-h2` | serif | 24px | 1.3 | 600 | -0.012em |
| `.t-h3` | serif | 19px | 1.22 | 600 | -0.01em |
| `.t-lede` | serif italic | 20px | 1.5 | 400 | — |
| `.t-body` | sans | 16px | 1.55 | 430 | — |
| `.t-small` | sans | 14px | 1.5 | 430 | — |
| `.t-caption` | sans | 12px | 1.4 | 500 | — |
| `.eyebrow` | mono | 11px | 1 | 500 | 0.12em, UPPERCASE |
| `.eyebrow-serif` | serif italic | 13px | — | 400 | 0.02em |

Headlines run weight 600 — anything lighter loses its serifs to anti-aliasing on screen and the system reads as "sans with bumps" rather than confident editorial. `.t-lede` is the deck/intro paragraph that sits between a headline and the body in long-form prose. `.eyebrow-serif` is the magazine-kicker alternative to the mono `.eyebrow`: use mono for product/dashboard contexts, serif for editorial.

Heading hero pattern uses `clamp()` for fluid scaling:
```css
font-size: clamp(38px, 5.4vw, 62px);
```

### 1.3 Spacing

8px-based scale with a 4px micro step:

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

Tokens: `--sp-1` through `--sp-8`. Section gaps tend to be 48–72px; card padding 18–24px; inline gaps 8–16px.

### 1.4 Radius

| Token | Value | Use |
|---|---|---|
| `--r-xs` | 4px | Code chips, tight tags |
| `--r-sm` | 8px | Inputs, table rows, small buttons |
| `--r-md` | 12px | Panels, stat cards |
| `--r-lg` | 14px | Feature/link cards |
| `--r-xl` | 20px | Large containers |
| `--r-pill` | 999px | Badges, pills, TOC chips |

### 1.5 Borders — the signature

Every panel uses **1.5px** borders, not 1px. This is the system's most distinctive technical choice: 1px reads as "wireframe," 2px reads as "playful," 1.5px reads as "hairline." Always pair with `--gray-300`.

```css
--border: 1.5px solid var(--gray-300);
```

Hairline dividers inside panels drop to 1px (`--gray-100`) so the outer frame stays dominant.

### 1.6 Shadows

Warm low-spread in light mode (slight orange undertone via `rgba(20,20,19, …)`); deep-pure-black in dark mode (warm shadows would vanish on dark surfaces).

| Token | Light | Dark |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(20,20,19,0.06)` | `0 1px 2px rgba(0,0,0,0.45)` |
| `--shadow-md` | `0 4px 14px rgba(20,20,19,0.08)` | `0 4px 14px rgba(0,0,0,0.50)` |
| `--shadow-lg` | `0 12px 28px rgba(20,20,19,0.12)` | `0 12px 28px rgba(0,0,0,0.55)` |
| `--shadow-card-hover` | `0 10px 30px rgba(20,20,19,0.10)` | `0 10px 30px rgba(0,0,0,0.50)` |

### 1.7 Motion

| Token | Value | Use |
|---|---|---|
| `--t-fast` | 120ms | Color/border state changes |
| `--t-base` | 150ms | Card hover, transform |
| `--t-slow` | 300ms | Larger reveals |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Default |
| `--ease-pop` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot |

The signature card-hover gesture is a 3px translateY lift + shadow swap + border-color shift to slate. `prefers-reduced-motion` is respected automatically.

### 1.8 Layout

| Token | Width | Use |
|---|---|---|
| `--content-narrow` | 820px | Single-column reading |
| `--content-default` | 920px | Mixed prose + components |
| `--content-wide` | 1120px | Index/grid pages |

Wrappers ship as classes: `.wrap`, `.wrap-narrow`, `.wrap-wide`. Page padding is `0 24px`.

---

## 2. Dark mode

Pattern B is built in: dark mode applies automatically, with an opt-out for users who want to override.

```html
<!-- Auto: respects OS preference -->
<html>

<!-- Force light (overrides OS dark mode) -->
<html data-theme="light">

<!-- Force dark (overrides OS light mode) -->
<html data-theme="dark">
```

Cascade:

1. `prefers-color-scheme: dark` activates dark tokens — UNLESS `[data-theme="light"]` is set
2. `[data-theme="dark"]` always activates dark tokens
3. `[data-theme="light"]` always keeps light tokens

To wire a manual toggle, set/remove the attribute on `<html>` from JS and persist to `localStorage`. The `preview.html` and `index.html` files include a working three-state toggle (Auto / Light / Dark) you can lift directly.

`color-scheme: light dark` is declared on `:root`, so native UI (scrollbars, form controls) follows the active scheme automatically.

---

## 3. Components

`inkwell-components.css` ships ~28 reusable component classes (the table below). Open `preview.html` for a live tour of all of them in both light and dark mode.

| Class | Purpose |
|---|---|
| `.btn` (+ `-primary` / `-secondary` / `-ghost` / `-danger`) | Buttons across all intents |
| `.input` / `.textarea` / `.select` (+ `.is-error` / `:disabled`) | Form controls with accent focus halo, rust error border, and muted disabled state |
| `.field` (+ `.field-label` / `.field-help` / `.field-error`) | Vertical field group: label + control + helper or error text |
| `.checkbox` / `.radio` / `.switch` | Selection controls with accent fill (checkbox/radio) and pill-track toggle (switch) |
| `.segmented` (+ `aria-pressed` / `.is-active`) | Pill-shaped group of mutually-exclusive options sharing one outer border — use for 2–4 short labels (theme toggle, view modes, density) |
| `kbd` / `.kbd` | Keyboard-shortcut chip in mono with bottom-edge shadow line |
| `.badge` (+ neutral / accent / success / warning / danger) | Pill-shaped status labels |
| `.alert` (+ `.is-info` / `.is-success` / `.is-warning` / `.is-danger`) | Flat-tinted system message; title stays slate, tinted bg + border carry the semantic |
| `.card` (+ `.is-link`) | Generic card; the `.is-link` variant adds a calm border-color hover shift — no lift, no shadow swap |
| `.stat-card` (+ `.is-primary`) | Big-number metric tile; `.is-primary` marks the headline metric with a 4px accent stripe |
| `.tbl` | Table with sans header labels and hairline row dividers |
| `.tldr` | Inverted callout — dark in light mode, light in dark mode |
| `.code-block` | Multi-line `<pre><code>` panel with optional `.copy` button slot |
| `.dialog` | Styling for native `<dialog>` (open via `dialog.showModal()`) with backdrop blur |
| `.tabs` (+ `.tab` / `.tab-panel`) | Underline-style tab nav; consumer wires `aria-selected` / `[hidden]` |
| `.tooltip` (with `[data-tooltip]`) | CSS-only tooltip bubble on hover/focus — pair with `aria-label` for SR |
| `.breadcrumbs` | `<ol>` list with `/` separators; `aria-current="page"` for the leaf |
| `.pagination` | Numbered page list with prev/next; `aria-current="page"` for the active page |
| `.skeleton` (+ `.is-text` / `.is-title` / `.is-block` / `.is-circle`) | Shimmer placeholder; reduced-motion-safe |
| `.empty-state` (+ `.empty-state-icon`) | Centered no-data panel with icon slot, headline, body, action |
| `.pill` (+ sev / resolved / neutral) | Severity / status pill |
| `.timeline` (+ `.tl-entry`) | Vertical event timeline |
| `.chip-dot` (+ safe / medium / attention) | Mono label with colored status dot |
| `.avatar` | 36px monogram circle |
| `.eyebrow` / `.eyebrow-serif` | Lead-in kicker label with accent rule. Mono uppercase for product/dashboard; italic serif for editorial. |
| `.sec-head` | Numbered section header (mono index + serif title + count pill) |
| `.toc` | Pill-shaped link list with optional mono numerals |

**Editorial primitives** (long-form/magazine contexts, expect serif body + 60–65ch line-length):

| Class | Purpose |
|---|---|
| `.dropcap` | First-letter ornament — 4.2em serif, floated, accent-colored. Apply to a paragraph. |
| `.pullquote` | Indented serif-italic block with a 1.5px accent left-rule — magazine-style pulled quote |
| `.byline` (+ `.author`) | Dateline + author block — mono caps for the metadata, italic serif for the author's name |
| `figure.figure` (+ `figcaption`) | Image/video wrapper with bordered media and italic-serif rule-anchored caption |

---

## 4. Anti-patterns

These will break the look — avoid them:

- **Pure white page background.** Use `--ivory`. White on white kills depth.
- **Pure black text.** Use `--slate` (`#13141B`). Pure black is too cold for the system's tone.
- **Warm grays.** The neutrals here are *cool putty*. Mixing in warm beige grays (e.g., `#F0EEE6`) makes the cool indigo accent feel orphaned.
- **Multiple accent colors.** One indigo, period. If you need a second accent for data viz, use olive or sky — not a second saturated hue.
- **1px or 2px borders.** Stick to 1.5px for the signature outer frames.
- **Sans-serif headings.** Serifs do the editorial work; replacing them collapses the personality and makes everything read as "generic SaaS."
- **Heavy drop shadows.** Stay under 12% opacity in light mode; under 55% in dark. Big floaty shadows feel "Material Design"; this system is letterpress-quiet.
- **Emoji icons.** Use inline SVG strokes.
- **Gradients on surfaces.** Surfaces are flat.
- **Saturated semantic colors.** Olive/rust/warning are deliberately desaturated to sit on the cool palette without screaming.
- **Hardcoded hex values in component CSS.** Always reference tokens. Adding a new variant later (or theming for a customer) is trivial when everything is tokenized — painful when literals are scattered.

---

## 5. Accessibility

Inkwell ships with WCAG-conscious defaults. The notable choices:

- **Body text contrast.** `--gray-700` (`#3A3B41`) on `--paper` reads at ~10.9:1 — well past AA. `--gray-500` (`#6F6F75`) on `--paper` reads at 5.05:1, on `--ivory` at 4.64:1 — both clear AA's 4.5:1 for normal text. (An earlier `#85858A` value sat at 3.44:1 on paper; if you fork an older snapshot, bump `--gray-500` to clear AA.)
- **Focus rings are accent.** `*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` is global. The accent reads at 7.9:1 (light) and 5.2:1 (dark) on its respective surface — well past WCAG 1.4.11's 3:1 for non-text UI.
- **The 1.5px hairline border is *deliberately* below WCAG 3:1.** `--gray-300` on `--paper` is ~1.57:1 in light mode and ~1.45:1 in dark. This is the system's letterpress-quiet signature — a stronger border would read as wireframe or Material. Visual separation is achieved through the *combination* of border, surface tone shift (`--paper` vs `--ivory`), and shadow. Use `--border-strong` (1.5px solid `--slate`) when a panel genuinely needs to stand off the page.
- **Reduced motion is honored.** `@media (prefers-reduced-motion: reduce)` shortens all animations and transitions to ~0ms. The card hover lift, dialog pop, and switch knob slide all degrade gracefully.
- **Color is never the only signal.** Status chips pair color with an explicit dot or label; alerts pair color with a serif title; form errors pair the `--rust` border with an explicit `.field-error` text node. Don't introduce a "danger" state that only changes a hue.
- **Native semantics first.** `<dialog>` for modals (focus trap, ESC, `::backdrop` for free), real `<input type="checkbox">` and `<input type="radio">` for selection (preserving keyboard interaction), `<kbd>` for keyboard chips. The components style native elements rather than rebuilding them.

If you extend the system, the rule is: any new colored token must clear 3:1 for non-text and 4.5:1 for normal text against the surface it ships on, *unless* it's pairing with another signal.

---

## 6. Quick start

Copy `inkwell.css`, `tokens.css`, `inkwell-tokens.css`, and `inkwell-components.css` into your project — all four side-by-side — and link `inkwell.css` from `<head>`. `inkwell.css` `@import`s `tokens.css`, which `@import`s the two source files. The body inherits ivory background, slate text, sans body, and the active light/dark scheme automatically.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="inkwell.css">
  <title>My new app</title>
</head>
<body>
  <div class="wrap">
    <div class="eyebrow">Section label</div>
    <h1 class="t-h1">A serif headline with <em class="accent">italic accent</em></h1>
    <p class="t-body">Body copy at 16/1.55, sans, weight 430.</p>

    <button class="btn btn-primary">Primary action</button>
    <button class="btn btn-secondary">Cancel</button>
  </div>
</body>
</html>
```

For a fuller starting point, copy `index.html` — it includes the navbar, layout shell, sample components, and a working light/dark/auto toggle. For a comprehensive component reference, open `preview.html`.

---

## 7. Project structure

```
inkwell/
├── inkwell.css             ← brand-named alias — link this in <head>
├── tokens.css              ← backward-compat aggregator (imports the two source files)
├── inkwell-tokens.css      ← source: :root tokens + Pattern B dark cascade
├── inkwell-components.css  ← source: base reset, components, layout helpers, a11y
├── inkwell-theme.css       ← Tailwind v4 entry — imports the two source files,
│                             declares @theme aliases + @custom-variant dark
├── tokens.json             ← machine-readable mirror for Figma plugins / Style Dictionary
├── index.html              ← starter template (copy as seed of a new project)
├── preview.html            ← comprehensive component showcase
├── examples/               ← real-feeling pages (deployed to inkwell.vinny.dev)
├── DESIGN_SYSTEM.md        ← this file
├── TAILWIND.md             ← Tailwind v4 install guide
├── agent-instructions.md   ← self-contained brief for LLM coding agents
├── CHANGELOG.md            ← release history
└── variants/               ← legacy palette branch (clay / sage / burgundy)
    ├── tokens-clay.css     ← base — original warm-editorial palette
    ├── tokens-sage.css     ← forest / knowledge-product palette
    ├── tokens-burgundy.css ← literary / magazine palette
    ├── tokens-indigo.css   ← variant-format version of this palette
    ├── preview-{clay,sage,burgundy,indigo}.html
    └── compare.html        ← side-by-side comparison of all four
```

The split between `inkwell-tokens.css` and `inkwell-components.css` exists so `inkwell-theme.css` can wrap components inside `@layer components` while keeping `:root` tokens unlayered — without forcing pure-CSS consumers to care. Link `inkwell.css` and the whole tree resolves; link `inkwell-theme.css` from Tailwind v4 entry CSS and the same source files do double duty.

If you ever want to swap palettes, the variant files in `variants/` show the pattern: a ~100-line CSS file overriding only the brand-layer tokens. The structural layer (everything below the `:root` block in `inkwell-tokens.css`) doesn't need to change. Note: the Tailwind v4 integration targets the root `--accent` universe only; the `variants/` palettes use `--clay` regardless of hue and are not Tailwind-compatible.

---

*Made with hairlines and serifs by [Vinny Carpenter](https://vinny.dev). The 1.5px is on purpose.*
