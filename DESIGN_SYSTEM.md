# Inkwell

A reusable design system for product UI, dashboards, and technical interfaces. Drop-in CSS tokens, ~30 component classes, light + dark mode out of the box.

**Inkwell** ships with the **Indigo & Cloud** palette — cool stone background, deep indigo accent, serif headlines for gravitas, monospace for technical metadata, hairline 1.5px borders. Reads as Linear/Stripe/Notion-adjacent without being a clone of any of them.

The system separates *structure* (borders, type scale, spacing, motion, components) from *brand* (colors). Four palettes share one token layer and one component layer; only the brand-layer tokens differ. The default is **Indigo & Cloud**; three alternate palettes (Clay, Sage & Stone, Burgundy & Bone) are available as override-only CSS files in `variants/`.

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
| `--accent` | `#3B4A8C` | `#7A8AD1` | **Primary accent** — fills, tints, the hue variants override (text/focus jobs live on `--accent-ink`) |
| `--accent-d` | `#2A3768` | `#8B9ADB` | Hover/pressed accent — dark mode *lifts* |
| `--accent-tint` | `rgba(59,74,140,0.14)` | `rgba(122,138,209,0.10)` | Badge background |
| `--accent-focus-ring` | `rgba(59,74,140,0.18)` | `rgba(122,138,209,0.28)` | Input focus halo |
| `--accent-strong-border` | `rgba(59,74,140,0.5)` | `rgba(122,138,209,0.6)` | Tinted chip border |
| `--accent-ink` | `var(--accent)` | `var(--accent)` | Accent as **text**: links, tabs, badge text, focus ring. Variants override when their accent is too light to read |
| `--on-accent` | `var(--paper)` | `var(--paper)` | Label color on accent fills (clay light overrides to slate) |
| `--olive` | `#788C5D` | `#9CB07A` | Success, additions |
| `--olive-strong-border` | `rgba(120,140,93,0.45)` | `rgba(156,176,122,0.6)` | Tinted success border |
| `--olive-dark` | `#566740` | `#9CB07A` | Olive as text/solid fill — badge-success, stat-delta.up, pill.resolved |
| `--rust` | `#B04A3F` | `#D27468` | Danger, deletions |
| `--rust-focus-ring` | `rgba(176,74,63,0.18)` | `rgba(210,116,104,0.28)` | `.is-error` focus halo |
| `--warning` | `#C78E3F` | `#D9A55F` | Amber warning |
| `--warning-strong-border` | `rgba(199,142,63,0.45)` | `rgba(217,165,95,0.6)` | Tinted warning border |
| `--warning-dark` | `#85561E` | `#D9A55F` | Warning as text — 5.41:1 on its tint |
| `--info` / `--sky` | `#5C7CA3` / `#6A8CAF` | `#7C9FD2` / `#85A6CB` | Informational accents |
| `--info-tint` | `rgba(92,124,163,0.16)` | `rgba(124,159,210,0.18)` | `.alert.is-info` background |
| `--info-strong-border` | `rgba(92, 124, 163, 0.45)` | `rgba(124, 159, 210, 0.6)` | `.alert.is-info` border |
| `--backdrop` | `rgba(15,16,24,0.55)` | `rgba(0,0,0,0.6)` | `dialog::backdrop` scrim |
| `--tldr-code-tint` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | `.tldr code` chip overlay — inverts with the `.tldr` surface |
| `--gray-100` | `#EDEDEA` | `#1E1F29` | Subtle row stripe, code-chip bg |
| `--gray-200` | `#E1E1DE` | `#262732` | Divider on white |
| `--gray-300` | `#CFCFCC` | `#34363F` | **Default border** — the 1.5px hairline |
| `--gray-400` | `#88888E` | `#666874` | Control boundaries via `--control-border` (WCAG 1.4.11) |
| `--gray-500` | `#6F6F75` | `#9A9AA0` | Muted text, captions |
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

Functional control boundaries are the exception: `--control-border` (1.5px `--gray-400`) carries checkbox, radio, and switch — state boundaries must clear WCAG 1.4.11's 3:1, unlike decorative panel hairlines.

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

Pattern B behavior is built in: dark mode applies automatically, with an opt-out for users who want to override. (Same behavior since 1.0; the implementation became `color-scheme` + `light-dark()` in 3.0.)

```html
<!-- Auto: respects OS preference -->
<html>

<!-- Force light (overrides OS dark mode) -->
<html data-theme="light">

<!-- Force dark (overrides OS light mode) -->
<html data-theme="dark">
```

Since 3.0 the cascade is `color-scheme` + `light-dark()`: every color token is a single `:root` declaration carrying both mode values, and the mode machinery is four small rules —

1. `:root { color-scheme: light dark }` — auto, `light-dark()` follows the OS preference
2. `[data-theme="light"] { color-scheme: light }` — always light
3. `@media screen { [data-theme="dark"] { color-scheme: dark } }` — always dark, screen-only
4. `@media print { :root { color-scheme: light } }` — print always renders the light palette

To wire a manual toggle, set/remove the attribute on `<html>` from JS and persist to `localStorage`. The `preview.html` and `index.html` files include a working three-state toggle (Auto / Light / Dark) you can lift directly.

Because `color-scheme` is declared on `:root`, native UI (scrollbars, form controls) follows the active scheme automatically.

**Derive vs. declare (the 3.0 tint rule):** alpha tints (`*-tint`, `*-focus-ring`, `*-strong-border`) derive from their base token via `color-mix(in srgb, var(--base) P%, transparent)`, so a palette that overrides `--accent` gets correct tints for free. A token is declared explicitly wherever the contrast gate (`scripts/check-contrast.mjs`) forced a hand-tuned value — e.g. clay and sage redeclare `--accent-tint` because their dark alpha (18%) differs from canonical's tuned 10%. Derive by default; declare where the gate demands. When adding a new colored token, put both mode values in one `light-dark()` declaration — a dark block redeclaration is now an anti-pattern.

The one surviving piece of the old Pattern B duplication is the dark `.select` chevron override: `light-dark()` only accepts colors, and the chevron is a `background-image` data URI, so it keeps explicit dark-active selectors in canonical and each variant.

---

## 3. Components

`inkwell-components.css` ships ~34 reusable component classes (the table below). Open `preview.html` for a live tour of all of them in both light and dark mode.

| Class | Purpose |
|---|---|
| `.btn` (+ `-primary` / `-secondary` / `-ghost` / `-danger`; `:disabled` / `:active` / `.btn-sm` / `aria-busy`) | Buttons across all intents, with disabled, pressed, small, and loading-spinner states. Pair `aria-busy="true"` with `disabled` from JS — CSS only blocks pointer events, not keyboard activation. |
| `.input` / `.textarea` / `.select` (+ `.is-error` / `:disabled`) | Form controls with accent focus halo, rust error border, and muted disabled state |
| `.field` (+ `.field-label` / `.field-help` / `.field-error`) | Vertical field group: label + control + helper or error text |
| `.field-row` | Inline form row — wrapping flex of controls with centered alignment |
| `.checkbox` / `.radio` / `.switch` | Selection controls with accent fill (checkbox/radio) and pill-track toggle (switch) |
| `.segmented` (+ `aria-pressed` / `.is-active`) | Pill-shaped group of mutually-exclusive options sharing one outer border — use for 2–4 short labels (theme toggle, view modes, density) |
| `kbd` / `.kbd` | Keyboard-shortcut chip in mono with bottom-edge shadow line |
| `.badge` (+ neutral / accent / success / warning / danger) | Pill-shaped status labels |
| `.alert` (+ `.is-info` / `.is-success` / `.is-warning` / `.is-danger`) | Flat-tinted system message; title stays slate, tinted bg + border carry the semantic |
| `.card` (+ `.is-link`) | Generic card; the `.is-link` variant adds a calm border-color hover shift — no lift, no shadow swap |
| `.stat-card` (+ `.is-primary`) | Big-number metric tile; `.is-primary` marks the headline metric with a full 1.5px accent border |
| `.tbl` | Table with sans header labels and hairline row dividers |
| `.tbl-scroll` | Overflow wrapper for `.tbl` — horizontal scroll on narrow viewports |
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
| `.sec-head` | Numbered section header (mono index + serif title + count pill). Use the numbered index only when the sequence carries meaning (steps, ordered specs); as default scaffolding on every section it reads as generated filler. |
| `.toc` | Pill-shaped link list with optional mono numerals |
| `.navbar` (+ `.navbar-inner` / `.brand`) | Sticky top bar: brand mark + nav links on the ivory surface |
| `.card-grid` | Responsive card grid — `auto-fill` columns at a 280px minimum |
| `.sr-only` | Visually hidden, screen-reader-available text |
| `.skip-link` | Off-screen "skip to content" link that appears on `:focus-visible` |

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
- **Focus rings are accent ink.** `*:focus-visible { outline: 2px solid var(--accent-ink); outline-offset: 2px; }` is global. Canonical indigo reads at 7.9:1 (light) and 5.2:1 (dark) on its respective surface — well past WCAG 1.4.11's 3:1 for non-text UI — and because the ring follows `--accent-ink`, variants whose accent is too light (clay, sage) get an AA-passing ring automatically.
- **Functional control boundaries clear 3:1.** Checkbox, radio, and the switch off-track were 1.56:1 on `--paper` — below WCAG 1.4.11's 3:1 for boundaries that communicate state. They now use `--control-border` (1.5px `--gray-400`, 3.2:1+ on both surfaces). Decorative panel hairlines deliberately stay below 3:1 — see the next bullet.
- **The 1.5px hairline border is *deliberately* below WCAG 3:1.** `--gray-300` on `--paper` is ~1.57:1 in light mode and ~1.45:1 in dark. This is the system's letterpress-quiet signature — a stronger border would read as wireframe or Material. Visual separation is achieved through the *combination* of border, surface tone shift (`--paper` vs `--ivory`), and shadow. Use `--border-strong` (1.5px solid `--slate`) when a panel genuinely needs to stand off the page.
- **Reduced motion is honored.** `@media (prefers-reduced-motion: reduce)` shortens all animations and transitions to ~0ms. The card hover lift, dialog pop, and switch knob slide all degrade gracefully.
- **Color is never the only signal.** Status chips pair color with an explicit dot or label; alerts pair color with a serif title; form errors pair the `--rust` border with an explicit `.field-error` text node. Don't introduce a "danger" state that only changes a hue.
- **Native semantics first.** `<dialog>` for modals (focus trap, ESC, `::backdrop` for free), real `<input type="checkbox">` and `<input type="radio">` for selection (preserving keyboard interaction), `<kbd>` for keyboard chips. The components style native elements rather than rebuilding them.
- **`::selection` is slate-on-oat.** Selected text gets `--oat` behind `--slate` — the accent tint was too faint to register as a selection highlight.
- **Print always renders light.** The manual dark theme (`[data-theme="dark"]` blocks) is wrapped in `@media screen`, so a dark-toggled page still prints on the light palette.

All four palettes pass `scripts/check-contrast.mjs` — a zero-dependency WCAG gate asserting 192 token-pair ratios (text at 4.5:1, non-text at 3:1) across both modes — and CI runs it alongside the tokens.json drift check.

If you extend the system, the rule is: any new colored token must clear 3:1 for non-text and 4.5:1 for normal text against the surface it ships on, *unless* it's pairing with another signal.

---

## 6. Quick start

Copy three files — `inkwell.css`, `inkwell-tokens.css`, and `inkwell-components.css` — into your project side-by-side and link `inkwell.css` from `<head>`. `inkwell.css` `@import`s the two source files directly (tokens unlayered, components into `@layer inkwell`). `tokens.css` is a deprecated one-line alias of `inkwell.css` — only needed for legacy consumers that already link that filename; new installs do not need it. The body inherits ivory background, slate text, sans body, and the active light/dark scheme automatically.

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
├── inkwell.css             ← canonical entry — link this in <head>
│                             (components import into @layer inkwell)
├── tokens.css              ← DEPRECATED one-line alias of inkwell.css (removal: 4.0)
├── inkwell-tokens.css      ← source: single-declaration :root tokens (light-dark()
│                             per mode, color-mix() derived tints) + color-scheme
│                             mode machinery
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
└── variants/               ← palette override files (load after inkwell.css)
    ├── clay.css            ← warm cream + clay coral
    ├── sage.css            ← sage green + warm stone
    ├── burgundy.css        ← deep burgundy + bone paper
    └── compare.html        ← side-by-side comparison of all four palettes
```

The split between `inkwell-tokens.css` and `inkwell-components.css` exists so both entries can wrap components inside a cascade layer while keeping `:root` tokens unlayered — `inkwell.css` uses `@layer inkwell` (your unlayered CSS always overrides Inkwell components), `inkwell-theme.css` uses `@layer components` (Tailwind utilities override them). Link `inkwell.css` and the whole tree resolves; link `inkwell-theme.css` from Tailwind v4 entry CSS and the same source files do double duty.

To switch palettes, load the relevant `variants/*.css` file after `inkwell.css`. Each variant overrides only the brand-layer tokens (`--accent`, `--ivory`, `--slate`, `--oat`, neutral scale) — the structural layer stays untouched. Tailwind v4 users load the variant after the Tailwind build output so the `:root` overrides win the cascade; see [`TAILWIND.md`](TAILWIND.md) for cascade-order guidance.

### Palettes

| Palette | File | Vibe |
|---|---|---|
| Indigo & Cloud (default) | `inkwell-tokens.css` | Cool stone + deep indigo. No extra file needed. |
| Clay | `variants/clay.css` | Warm cream + Anthropic clay coral. Editorial. |
| Sage & Stone | `variants/sage.css` | Sage green + warm stone. Quiet, considered. |
| Burgundy & Bone | `variants/burgundy.css` | Deep burgundy + bone paper. Literary journal. |

---

*Made with hairlines and serifs by [Vinny Carpenter](https://vinny.dev). The 1.5px is on purpose.*
