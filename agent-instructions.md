# Inkwell — Agent Instructions

You are an AI coding agent (Claude Code, Codex, Cursor, etc.) and the user has asked you to use the **Inkwell** design system in their project. This file is your single source of truth for installing it correctly and using it without breaking its visual identity.

- **Repo:** https://github.com/vscarpenter/inkwell
- **Live demo:** https://inkwell.vinny.dev/
- **License:** MIT
- **Targets:** Inkwell 2.1.0 — if the repo's `CHANGELOG.md` shows a newer release, re-fetch this file before proceeding

Read this file end-to-end before writing any HTML or CSS. The "Hard rules" and "Anti-patterns" sections are non-negotiable — Inkwell has a deliberate, opinionated look and breaking these rules will produce something that does not look like Inkwell.

---

## 1. What Inkwell is

A pure-CSS design system. **No build step. No package manager. No JS framework. No dependencies.** The deliverable is a small set of CSS files plus reference HTML. You install it by downloading four CSS files and linking one of them (§2).

Inkwell ships with the **Indigo & Cloud** palette: cool stone background (`--ivory`), deep indigo accent (`--accent`), serif headlines at weight 600, monospace eyebrows for product/dashboard contexts (italic-serif `.eyebrow-serif` for editorial), and a signature **1.5px hairline border** that is the system's most recognizable feature.

---

## 2. Install — fetch these files

### Default path — pure CSS (no Tailwind)

Download four canonical CSS files into the user's project. Use raw GitHub URLs:

| File | Raw URL | Where to put it |
|---|---|---|
| `tokens.css` | `https://raw.githubusercontent.com/vscarpenter/inkwell/main/tokens.css` | Project static/CSS folder |
| `inkwell.css` | `https://raw.githubusercontent.com/vscarpenter/inkwell/main/inkwell.css` | Same folder as `tokens.css` |
| `inkwell-tokens.css` | `https://raw.githubusercontent.com/vscarpenter/inkwell/main/inkwell-tokens.css` | Same folder |
| `inkwell-components.css` | `https://raw.githubusercontent.com/vscarpenter/inkwell/main/inkwell-components.css` | Same folder |

All four files must live side-by-side. `inkwell.css` `@import`s `tokens.css`, which `@import`s `inkwell-tokens.css` + `inkwell-components.css`. Link `inkwell.css` from your `<head>`:

```html
<link rel="stylesheet" href="/path/to/inkwell.css">
```

That is the entire install. Do not run `npm install`, do not add a bundler step, do not create a PostCSS config.

### Tailwind v4 path — drop-in theme

If the user's project uses **Tailwind v4 (October 2024 or later)**, fetch the Tailwind files and import the theme from the user's existing Tailwind entry CSS:

| File | Raw URL |
|---|---|
| `inkwell-tokens.css` | `https://raw.githubusercontent.com/vscarpenter/inkwell/main/inkwell-tokens.css` |
| `inkwell-components.css` | `https://raw.githubusercontent.com/vscarpenter/inkwell/main/inkwell-components.css` |
| `inkwell-theme.css` | `https://raw.githubusercontent.com/vscarpenter/inkwell/main/inkwell-theme.css` |

Keep the three files side by side, then add two lines to the user's Tailwind entry CSS (typically `app.css`, `globals.css`, or whatever their build points at), in this order:

```css
@import "tailwindcss";
@import "./inkwell-theme.css";
```

That activates: every Inkwell token as a Tailwind utility (`bg-accent`, `text-slate`, `border-accent`, `font-serif`, `text-display`, `border-hair`), Inkwell component classes (`.btn`, `.card`, …) inside `@layer components` so utilities can override them, and a `dark:` variant that honors Inkwell's `[data-theme]` toggle. You do not need `tokens.css` or `inkwell.css` unless you also want the pure-CSS shim for non-Tailwind consumers.

**Tailwind v3 is not supported.** v3 requires a JS preset. If the user is on v3, recommend upgrading to v4 or installing Inkwell via the default path without Tailwind utility coverage.

Full Tailwind setup guide and conventions: [`TAILWIND.md`](TAILWIND.md) in the repo. Read it before writing Tailwind+Inkwell markup.

### Optional companion files (fetch only if asked)

| File | When to fetch |
|---|---|
| `tokens.json` | User wants tokens for Style Dictionary or a Figma plugin |
| `index.html` | User wants a starter template with navbar + theme toggle |
| `preview.html` | User wants the full component showcase page |
| `examples/tailwind.html` | User wants a live Tailwind v4 + Inkwell integration demo |
| `examples/*.html` | User wants a specific page pattern. Exact filenames: `dashboard`, `docs`, `landing`, `search`, `pricing`, `settings`, `profile`, `auth-pattern`, `not-found`, `changelog`, `roadmap`, `article`, `forms` (all `.html`) |
| `DESIGN_SYSTEM.md` | You need the canonical spec (token tables, component list, anti-patterns) |
| `TAILWIND.md` | User is integrating with Tailwind v4 — read this in full before writing markup |

The `examples/` pages link gallery-only assets (`demo.css`, `demo.js`) and carry a palette pre-paint snippet in `<head>`. If you use one as a starting point, strip those references — the root `index.html` is the clean copy-paste starter.

If the user wants a non-default palette, also fetch the relevant variant file from `variants/` (see §6) and load it after `inkwell.css`.

### Suggested fetch commands

```bash
# Default install (pure CSS, no Tailwind) — four files
mkdir -p public/css
BASE=https://raw.githubusercontent.com/vscarpenter/inkwell/main
curl -sSLo public/css/tokens.css            $BASE/tokens.css
curl -sSLo public/css/inkwell.css           $BASE/inkwell.css
curl -sSLo public/css/inkwell-tokens.css    $BASE/inkwell-tokens.css
curl -sSLo public/css/inkwell-components.css $BASE/inkwell-components.css

# Tailwind v4 install — inkwell-tokens.css + inkwell-components.css from above,
# plus the theme entry (the tokens.css / inkwell.css shims are optional here)
curl -sSLo public/css/inkwell-theme.css     $BASE/inkwell-theme.css
```

Adjust the destination path to match the user's project layout (e.g. `static/`, `assets/`, `app/styles/`, etc.). If unsure, ask once or pick the conventional location for the framework in use.

### Common integration points

Use the host app's existing static asset and global stylesheet conventions. Do not add tooling just to install Inkwell.

| Project type | Put files here | Load it here |
|---|---|---|
| Static HTML | `css/` or `public/css/` | `<link rel="stylesheet" href="/css/inkwell.css">` |
| Next.js App Router | `public/css/` | `app/layout.tsx` with `<link rel="stylesheet" href="/css/inkwell.css" />` |
| Next.js Pages Router | `public/css/` | `pages/_document.tsx` or `pages/_app.tsx` |
| Vite / React | `public/css/` | `index.html`, or import from the app's existing global CSS |
| Rails / Laravel / Django | Existing public/static CSS folder | Base layout template |

For framework apps, prefer a global load path. Inkwell defines global tokens and component classes, so it should be available across routes rather than scoped to one component.

---

## 3. Hard rules — do not violate

These are not stylistic preferences. They are the system. Breaking any of them produces something that is not Inkwell.

1. **Borders are `1.5px`, never `1px` or `2px`.** Always use the `--border` token. The 1.5px is retina-first by design — on non-retina displays it will render as 1px and `getComputedStyle` will report 1px. That is browser behavior, not a bug. Do not "fix" it with `box-shadow` workarounds.
2. **One accent only.** `--accent` is the single saturated brand hue. If a chart or data viz needs a second color, use `--olive` or `--sky`. Never introduce a second saturated accent.
3. **Tokens, never literal hex codes.** Component CSS must reference CSS custom properties. If you find yourself typing `#3B4A8C` in a stylesheet, stop and use `var(--accent)` instead. This rule is what makes palette swapping trivial.
4. **Type families have jobs, not preferences:**
   - `var(--serif)` → headings, stat numbers, italic emphasis, editorial primitives (lede, pullquote, byline-author, figure caption, `.eyebrow-serif`)
   - `var(--mono)` → file names, hex codes, byline metadata, table-numeric cells, `.eyebrow` for product/dashboard contexts. Signals "technical metadata."
   - `var(--sans)` → everything else
   Do not substitute one for another.
5. **Platform fonts only.** No Google Fonts, no `@font-face`, no webfont loaders. Stacks load instantly and produce zero FOUT. The serif stack leads with Iowan Old Style → Palatino → Source Serif Pro → Georgia (`ui-serif` was dropped in 1.4.0 — it resolves to wildly variable fonts per OS and couldn't be QA'd).
6. **Page background is `--ivory`, not white.** Body text is `--slate`, not pure black. Pure white + pure black collapses the cool-putty atmosphere.
7. **Every saturated color token must be defined in both light and dark.** If you add a new colored token, define a **lifted** (more luminous) value in the dark-mode block too. A color defined only at `:root` will look muddy on dark surfaces.
8. **Do not invent new accent token names.** Use `--accent` (and its derived tokens `--accent-d`, `--accent-tint`, etc.) everywhere. Palette switching works by overriding `--accent`; parallel token names break that mechanism.
9. **Accent as text → `--accent-ink`; accent as fill → `--accent` + `--on-accent` label.** Never put raw `--accent` text on any surface in a variant palette — use `--accent-ink`. Clay's coral and sage's green are too light to read, and `--accent-ink` is the token the variants darken to keep text AA.

---

## 4. Token cheat sheet

The most-used tokens. Full list lives in `inkwell-tokens.css` (the file is well-commented — read it; `tokens.css` is just a two-line aggregator shim).

**Surfaces & text**
- `--ivory` — page background
- `--paper` — card / panel surface
- `--slate` — primary text
- `--gray-100..700` — neutrals (cool putty, not warm beige)

**Accent & semantic**
- `--accent` / `--accent-d` / `--accent-tint` / `--accent-focus-ring` — indigo accent family (fills, tints, rings)
- `--accent-ink` — use for accent-colored TEXT (links, tabs, badge text); `--accent` is for fills. Variants darken the ink to stay readable.
- `--on-accent` — label color on accent fills (button labels, severity pills)
- `--olive` — success / additions / second data-viz hue
- `--olive-dark` — olive as text or solid fill (badge-success, stat deltas)
- `--rust` — danger / deletions
- `--sky` — alternate info / second data-viz hue

**Type**
- `--serif`, `--sans`, `--mono` — font stacks (platform-only; serif stack details in hard rule 5)
- `--t-display`, `--t-h1`, `--t-h2`, `--t-h3`, `--t-lede`, `--t-body`, `--t-small`, `--t-caption`, `--t-eyebrow` — sizes

**Borders & radius**
- `--border` (1.5px solid `--gray-300`) — the signature outer frame
- `--border-strong` (1.5px solid `--slate`)
- `--border-hair` (1px solid `--gray-100`) — internal dividers inside a `--border` panel
- `--border-rule` (1px solid `--gray-300`) — horizontal section rules
- `--control-border` (1.5px solid `--gray-400`) — checkbox/radio/switch boundaries; functional state edges must clear 3:1, unlike decorative hairlines
- `--r-xs`, `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`, `--r-pill` — radii

**Layout**
- `--content-narrow` (820), `--content-default` (920), `--content-wide` (1120) — max-widths
- `--page-pad-x` (24px) — horizontal page padding
- `--z-base`, `--z-raised`, `--z-sticky`, `--z-overlay`, `--z-modal` — z-index scale
- `--t-fast` (120ms), `--t-base` (150ms), `--t-slow` (300ms) — transitions

---

## 5. Component classes

`inkwell-components.css` ships ready-made components (you get them automatically by linking `inkwell.css`). Use these classes verbatim — do not rename or re-style them in your own CSS unless you have a specific reason.

| Class | Purpose |
|---|---|
| `.btn` (`-primary`, `-secondary`, `-ghost`, `-danger`; `:disabled` / `:active` / `.btn-sm` / `aria-busy="true"`) | Buttons, with disabled, pressed, small, and loading-spinner states. Pair `aria-busy="true"` with `disabled` from JS — CSS only blocks pointer events, not keyboard activation. |
| `.input`, `.textarea`, `.select` (`.is-error`, `:disabled`) | Form controls |
| `.field` (`.field-label`, `.field-help`, `.field-error`) | Vertical field group |
| `.checkbox`, `.radio`, `.switch` | Selection controls |
| `kbd` / `.kbd` | Keyboard chip |
| `.badge` (neutral / accent / success / warning / danger) | Status pill labels |
| `.alert` (`.is-info`, `.is-success`, `.is-warning`, `.is-danger`) | Flat-tinted system messages |
| `.card` (`.is-link`) | Generic card; `.is-link` shifts only the border on hover — no lift, no shadow swap |
| `.stat-card` (`.is-primary`) | Big-number metric tile; `.is-primary` marks the headline metric with a full 1.5px accent border |
| `.tbl` | Table with sans headers and hairline rows |
| `.tbl-scroll` | Overflow wrapper for `.tbl` — horizontal scroll on narrow viewports |
| `.tldr` | Inverted callout (dark in light mode, light in dark) |
| `.code-block` | Multi-line `<pre><code>` panel |
| `.dialog` | Native `<dialog>` styling |
| `.tabs` (`.tab`, `.tab-panel`) | Underline tab nav |
| `.segmented` (`aria-pressed` / `.is-active`) | Pill-shaped group of mutually-exclusive options (theme toggle, view modes, density) |
| `.tooltip` (`[data-tooltip]`) | CSS-only hover/focus tooltip |
| `.breadcrumbs` | `<ol>` with `/` separators |
| `.pagination` | Numbered page list |
| `.skeleton` (`.is-text`, `.is-title`, `.is-block`, `.is-circle`) | Loading shimmer |
| `.empty-state` (`.empty-state-icon`) | No-data panel |
| `.pill` (severity / resolved / neutral) | Status pill |
| `.timeline` (`.tl-entry`) | Vertical event timeline |
| `.chip-dot` (`.safe`, `.medium`, `.attention`) | Mono label with status dot |
| `.avatar` | 36px monogram circle |
| `.eyebrow` / `.eyebrow-serif` | Lead-in kicker. Mono uppercase for product/dashboard, italic serif for editorial. |
| `.sec-head` | Numbered section header — use the index only when the sequence carries meaning |
| `.toc` | Pill-shaped link list |
| `.navbar` (`.navbar-inner`, `.brand`) | Sticky top navigation shell |
| `.field-row` | Inline form row — wrapping flex of controls |
| `.card-grid` | Responsive card grid (`auto-fill`, 280px minimum) |
| `.sr-only` | Visually hidden, screen-reader-available text |
| `.skip-link` | Off-screen "skip to content" link, visible on `:focus-visible` |
| **Editorial:** `.dropcap` / `.pullquote` / `.byline` (+ `.author`) / `figure.figure` | Long-form/magazine primitives — use inside serif-body prose contexts |

For typography in markup, also use the utility classes that are defined in `inkwell-components.css`: `.t-display`, `.t-h1`, `.t-h2`, `.t-h3`, `.t-lede`, `.t-body`, `.t-small`, `.t-caption`.

When a component is missing, build it with tokens — never with hardcoded values. Inspect `preview.html` from the repo to see how the existing components compose.

---

## 6. Palettes

Inkwell has one token layer and one component layer. All four palettes share them; switching palettes is a one-line CSS load after `inkwell.css`.

| Palette | File | Vibe |
|---|---|---|
| **Indigo & Cloud** (default) | *(none — built in)* | Cool stone + deep indigo. No extra file. |
| Clay | `variants/clay.css` | Warm cream + Anthropic clay coral. Editorial. |
| Sage & Stone | `variants/sage.css` | Sage green + warm stone. Quiet, considered. |
| Burgundy & Bone | `variants/burgundy.css` | Deep burgundy + bone paper. Literary journal. |

To activate a non-default palette:

```html
<link rel="stylesheet" href="inkwell.css">
<link rel="stylesheet" href="variants/clay.css">
```

The variant files are ~70 lines each and override only the brand-layer tokens (`--accent`, `--ivory`, `--slate`, `--oat`, neutral scale). They do not restate component CSS. All components reference `var(--accent)` and related tokens, so overriding the tokens is all that's needed.

For Tailwind v4, load the variant after the Tailwind build output so the token overrides win the cascade (see §2 and [`TAILWIND.md`](TAILWIND.md)).

---

## 7. Dark mode

Dark mode ships in `inkwell-tokens.css` (the Pattern B dark cascade). It activates two ways:

1. **Automatic** via `prefers-color-scheme: dark`.
2. **Manual override** via `data-theme="light"` or `data-theme="dark"` on `<html>`.

### Wire a theme toggle (lifted from `index.html`)

Place a button in your markup:

```html
<button id="theme-toggle" type="button">
  Theme: <span id="theme-label">auto</span>
</button>
```

And this script before `</body>` (or earlier — the toggle reads `localStorage` and applies the attribute synchronously):

```html
<script>
  (function () {
    const root = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    const label = document.getElementById('theme-label');
    const KEY = 'inkwell-theme';
    const order = ['auto', 'light', 'dark'];
    function apply(s) {
      if (s === 'auto') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', s);
      if (label) label.textContent = s;
    }
    let current = localStorage.getItem(KEY) || 'auto';
    if (!order.includes(current)) current = 'auto';
    apply(current);
    btn.addEventListener('click', () => {
      current = order[(order.indexOf(current) + 1) % order.length];
      localStorage.setItem(KEY, current);
      apply(current);
    });
  })();
</script>
```

**To minimize flash of incorrect theme**, lift the `apply()` call into an inline `<head>` script that runs before `<body>` paints:

```html
<script>
  (function () {
    var s = localStorage.getItem('inkwell-theme') || 'auto';
    if (s === 'light' || s === 'dark') document.documentElement.setAttribute('data-theme', s);
  })();
</script>
```

---

## 8. Anti-patterns — these break the look

From `DESIGN_SYSTEM.md` §4. If you catch yourself doing any of these, stop:

- **Pure white page background.** Use `--ivory`.
- **Pure black text.** Use `--slate` (`#13141B`).
- **Warm grays / beige neutrals.** Inkwell's neutrals are *cool putty*. A warm beige will orphan the indigo accent.
- **Multiple saturated accent colors.** One indigo. Use `--olive` or `--sky` for a second data-viz hue.
- **1px or 2px borders.** Stick to 1.5px on outer frames.
- **Sans-serif headings.** Serifs do the editorial work; replacing them collapses the personality into "generic SaaS."
- **Heavy drop shadows.** Light mode shadows stay under 12% opacity; dark under 55%. No floaty Material Design lifts.
- **Emoji icons.** Use inline SVG strokes.
- **Gradients on surfaces.** Surfaces are flat.
- **Saturated semantic colors.** `--olive` / `--rust` are deliberately desaturated — do not "fix" them by saturating.
- **Hardcoded hex values in component CSS.** Always route through tokens.

---

## 9. Building a new page — workflow

1. Confirm which palette the user wants. Indigo & Cloud is the default (no extra file). For Clay, Sage & Stone, or Burgundy & Bone, fetch the corresponding variant file and load it after `inkwell.css` (see §6).
2. Fetch the four canonical CSS files per §2 (`tokens.css`, `inkwell.css`, `inkwell-tokens.css`, `inkwell-components.css`). Or if the user is already on Tailwind v4, fetch the three-file Tailwind path instead.
3. Link `inkwell.css` from `<head>` (or, for the Tailwind path, add `@import "tailwindcss"; @import "./inkwell-theme.css";` to the user's Tailwind entry CSS).
4. (Optional) Wire the theme toggle (§7).
5. Set the page background to `--ivory` and body text to `--slate`. Use `var(--sans)` for the body, `var(--serif)` for headings.
6. Compose with the component classes in §5. For unique layouts, write thin per-page CSS that *only references tokens*.
7. Use `--content-default` (920px) as the default max-width; reach for `--content-narrow` for prose, `--content-wide` for dashboards.
8. Verify in both light and dark mode before declaring done. (Toggle via the script in §7, or via OS-level dark mode preference.)
9. If any component you wrote uses an `rgba()` of a brand color, double-check it has a dark-mode definition too.

---

## 10. Retrofitting an existing app — workflow

When applying Inkwell to an existing application, preserve the app's routing, data flow, state management, and component boundaries. Do not rewrite a working app into static HTML just because the examples are static.

1. Inspect the project structure first: framework, global CSS entrypoint, shared components, layout shell, and existing design tokens.
2. Install the four canonical CSS files (`tokens.css`, `inkwell.css`, `inkwell-tokens.css`, `inkwell-components.css`) in the app's static assets and load `inkwell.css` globally (§2). If the app is already on Tailwind v4, use the Tailwind path from §2 instead — `inkwell-theme.css` plus the two source files in the app's existing build.
3. Map existing UI to Inkwell primitives before writing custom CSS:
   - buttons → `.btn` plus the closest intent modifier
   - inputs/selects/textareas → `.input`, `.select`, `.textarea`, wrapped in `.field` where labels/help text exist
   - panels/cards → `.card`
   - tables → `.tbl`
   - status labels → `.badge`, `.pill`, or `.chip-dot`
   - empty/loading states → `.empty-state` or `.skeleton`
4. Replace local color, border, font, radius, shadow, and spacing literals with Inkwell tokens in app CSS.
5. Keep app-specific layout CSS thin and token-driven. Use existing components and props; only change markup/classes where needed for styling.
6. Remove or neutralize old global styles that fight Inkwell's body background, typography, focus rings, or component classes.
7. **If the app already uses Tailwind v4:** use the Tailwind path from §2 in the existing entry CSS — components live in `@layer components`, so existing Tailwind utilities still override component padding/margins. Read [`TAILWIND.md`](TAILWIND.md) for the components-vs-utilities rule and the `border-hair` convention. Do NOT also load `inkwell.css` or `tokens.css` in the Tailwind entry CSS — `inkwell-theme.css` already brings in the source split.
8. If the app already uses Tailwind v3, CSS modules, CSS-in-JS, or another component library, integrate Inkwell at the edge: global tokens and classes first, then targeted component updates. Do not introduce a second styling architecture just for this migration.

---

## 11. Verification checklist

Before declaring the integration done:

- Run the app's existing lint, test, typecheck, and build commands when they exist. Do not invent new commands.
- Open the changed page or app locally and check at least one desktop and one mobile viewport.
- Verify light, dark, and auto theme behavior.
- Check focus, hover, disabled, loading, empty, validation/error, dialog, tab, and navigation states that appear in the changed surface.
- Confirm there are no new console errors, broken routes, missing CSS files, or layout shifts caused by loading `inkwell.css`.
- Scan new CSS for hardcoded colors, `1px`/`2px` outer borders, webfonts, gradients on surfaces, and extra saturated accent colors.

---

## 12. When you need more detail

Always available in the repo:

- `DESIGN_SYSTEM.md` — canonical spec: token tables, full component list, dark-mode cascade, accessibility notes, the *why* behind every rule. Read this before designing new components or extending tokens.
- `CLAUDE.md` — repo-author notes for AI-assisted edits to Inkwell itself (most consumers won't need this).
- `preview.html` — every component, every state, both modes. The reference rendering.
- `examples/` — fourteen real-feeling pages built only from the design system. The best place to learn composition.
- `CHANGELOG.md` — what changed in each release.

---

## 13. Things you should NOT do

- Do not run `npm install inkwell` or any package-manager equivalent. There is no package.
- Do not add a build step (Vite, Webpack, PostCSS, Tailwind) just to use Inkwell. Existing build tooling in the host app is fine; do not create new tooling for the CSS files. The one exception: if the user is already on Tailwind v4, the Tailwind path in §2 is a first-class supported integration — install `inkwell-theme.css` into their existing build.
- Do not modify `tokens.css`, `inkwell.css`, `inkwell-tokens.css`, `inkwell-components.css`, or `inkwell-theme.css` in the user's project. If they need a custom token value, override it in their own stylesheet that loads *after* Inkwell.
- Do not invent new component classes that conflict with `inkwell-components.css` (`.btn`, `.card`, etc.). Extend with modifier classes instead.
- Do not introduce a CSS-in-JS layer, styled-components, or a UI framework on top. Inkwell is the framework.
- Do not paste this file's content inline into the user's project. It is for *you* to read; reference it via URL if the user wants a copy.

---

*If anything in this file conflicts with the latest `DESIGN_SYSTEM.md` in the repo, trust the repo. Fetch the latest version of either file before starting substantive work.*
