# Inkwell — Agent Instructions

You are an AI coding agent (Claude Code, Codex, Cursor, etc.) and the user has asked you to use the **Inkwell** design system in their project. This file is your single source of truth for installing it correctly and using it without breaking its visual identity.

- **Repo:** https://github.com/vscarpenter/inkwell
- **Live demo:** https://inkwell.vinny.dev/
- **License:** MIT

Read this file end-to-end before writing any HTML or CSS. The "Hard rules" and "Anti-patterns" sections are non-negotiable — Inkwell has a deliberate, opinionated look and breaking these rules will produce something that does not look like Inkwell.

---

## 1. What Inkwell is

A pure-CSS design system. **No build step. No package manager. No JS framework. No dependencies.** The deliverable is two CSS files plus reference HTML. You install it by downloading two files and linking one of them.

Inkwell ships with the **Indigo & Cloud** palette: cool stone background (`--ivory`), deep indigo accent (`--accent`), serif headlines, monospace eyebrows/metadata, and a signature **1.5px hairline border** that is the system's most recognizable feature.

---

## 2. Install — fetch these files

Download the two canonical CSS files into the user's project. Use raw GitHub URLs:

| File | Raw URL | Where to put it |
|---|---|---|
| `tokens.css` | `https://raw.githubusercontent.com/vscarpenter/inkwell/main/tokens.css` | Project static/CSS folder |
| `inkwell.css` | `https://raw.githubusercontent.com/vscarpenter/inkwell/main/inkwell.css` | Same folder as `tokens.css` |

`inkwell.css` is a one-line `@import url('tokens.css')` — both files must live side-by-side. Link `inkwell.css` from your `<head>`:

```html
<link rel="stylesheet" href="/path/to/inkwell.css">
```

That is the entire install. Do not run `npm install`, do not add a bundler step, do not create a PostCSS config.

### Optional companion files (fetch only if asked)

| File | When to fetch |
|---|---|
| `tokens.json` | User wants tokens for Tailwind / Style Dictionary / Figma plugin |
| `index.html` | User wants a starter template with navbar + theme toggle |
| `preview.html` | User wants the full component showcase page |
| `examples/*.html` | User wants a specific page pattern (dashboard, docs, landing, search, pricing, settings, profile, auth, 404, changelog, roadmap, article, forms) |
| `DESIGN_SYSTEM.md` | You need the canonical spec (token tables, component list, anti-patterns) |

**Do not** copy files from `variants/` unless the user explicitly asks for the legacy clay/sage/burgundy palettes. See §6 for why.

### Suggested fetch commands

```bash
# Two-file minimum install
mkdir -p public/css
curl -sSLo public/css/tokens.css  https://raw.githubusercontent.com/vscarpenter/inkwell/main/tokens.css
curl -sSLo public/css/inkwell.css https://raw.githubusercontent.com/vscarpenter/inkwell/main/inkwell.css
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
   - `var(--serif)` → headings, stat numbers, italic emphasis
   - `var(--mono)` → eyebrows, table headers, hex codes, "technical metadata"
   - `var(--sans)` → everything else
   Do not substitute one for another.
5. **Platform fonts only.** No Google Fonts, no `@font-face`, no webfont loaders. The stacks (`ui-serif`, `system-ui`, `ui-monospace`) load instantly and produce zero FOUT.
6. **Page background is `--ivory`, not white.** Body text is `--slate`, not pure black. Pure white + pure black collapses the cool-putty atmosphere.
7. **Every saturated color token must be defined in both light and dark.** If you add a new colored token, define a **lifted** (more luminous) value in the dark-mode block too. A color defined only at `:root` will look muddy on dark surfaces.
8. **Do not introduce `--clay` references in new work.** That token belongs to the legacy `variants/` universe (see §6).

---

## 4. Token cheat sheet

The most-used tokens. Full list lives in `tokens.css` (the file is well-commented — read it).

**Surfaces & text**
- `--ivory` — page background
- `--paper` — card / panel surface
- `--slate` — primary text
- `--gray-100..700` — neutrals (cool putty, not warm beige)

**Accent & semantic**
- `--accent` / `--accent-d` / `--accent-tint` / `--accent-focus-ring` — indigo accent family
- `--olive` — success / additions / second data-viz hue
- `--rust` — danger / deletions
- `--sky` — alternate info / second data-viz hue

**Type**
- `--serif`, `--sans`, `--mono` — font stacks
- `--t-display`, `--t-h1`, `--t-h2`, `--t-h3`, `--t-body`, `--t-small`, `--t-caption`, `--t-eyebrow` — sizes

**Borders & radius**
- `--border` (1.5px solid `--gray-300`) — the signature outer frame
- `--border-strong` (1.5px solid `--slate`)
- `--border-hair` (1px solid `--gray-100`) — internal dividers inside a `--border` panel
- `--border-rule` (1px solid `--gray-300`) — horizontal section rules
- `--r-xs`, `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`, `--r-pill` — radii

**Layout**
- `--content-narrow` (820), `--content-default` (920), `--content-wide` (1120) — max-widths
- `--page-pad-x` (24px) — horizontal page padding
- `--z-base`, `--z-raised`, `--z-sticky`, `--z-overlay`, `--z-modal` — z-index scale
- `--t-fast` (120ms), `--t-base` (150ms), `--t-slow` (300ms) — transitions

---

## 5. Component classes

`tokens.css` ships ready-made components. Use these classes verbatim — do not rename or re-style them in your own CSS unless you have a specific reason.

| Class | Purpose |
|---|---|
| `.btn` (`-primary`, `-secondary`, `-ghost`, `-danger`) | Buttons |
| `.input`, `.textarea`, `.select` (`.is-error`, `:disabled`) | Form controls |
| `.field` (`.field-label`, `.field-help`, `.field-error`) | Vertical field group |
| `.checkbox`, `.radio`, `.switch` | Selection controls |
| `kbd` / `.kbd` | Keyboard chip |
| `.badge` (neutral / accent / success / warning / danger) | Status pill labels |
| `.alert` (`.is-info`, `.is-success`, `.is-warning`, `.is-danger`) | Flat-tinted system messages |
| `.card` (`.is-link`) | Generic card; `.is-link` adds the 3px hover-lift |
| `.stat-card` (`.warn`) | Big-number metric tile |
| `.tbl` | Table with mono headers and hairline rows |
| `.tldr` | Inverted callout (dark in light mode, light in dark) |
| `.code-block` | Multi-line `<pre><code>` panel |
| `.dialog` | Native `<dialog>` styling |
| `.tabs` (`.tab`, `.tab-panel`) | Underline tab nav |
| `.tooltip` (`[data-tooltip]`) | CSS-only hover/focus tooltip |
| `.breadcrumbs` | `<ol>` with `/` separators |
| `.pagination` | Numbered page list |
| `.skeleton` (`.is-text`, `.is-title`, `.is-block`, `.is-circle`) | Loading shimmer |
| `.empty-state` (`.empty-state-icon`) | No-data panel |
| `.pill` (severity / resolved / neutral) | Status pill |
| `.timeline` (`.tl-entry`) | Vertical event timeline |
| `.chip-dot` (`.safe`, `.medium`, `.attention`) | Mono label with status dot |
| `.avatar` | 36px monogram circle |
| `.eyebrow` | Uppercase mono lead-in label |
| `.sec-head` | Numbered section header |
| `.toc` | Pill-shaped link list |

For typography in markup, also use the utility classes that are defined in `tokens.css`: `.t-display`, `.t-h1`, `.t-h2`, `.t-h3`, `.t-body`, `.t-small`, `.t-caption`.

When a component is missing, build it with tokens — never with hardcoded values. Inspect `preview.html` from the repo to see how the existing components compose.

---

## 6. The two universes — critical

The repo contains **two separately evolved branches** of the system that must never be mixed:

### Universe A — root `tokens.css` (canonical, current)
- Self-contained. Default palette baked in: **Indigo & Cloud**.
- Accent is named **`--accent`**.
- Dark mode is built into the same file.
- **This is what you use for new work.**

### Universe B — `variants/` (legacy, reference only)
- `tokens-clay.css` is the base; `tokens-burgundy.css`, `tokens-indigo.css`, `tokens-sage.css` `@import` it and override only brand-layer tokens.
- Accent is named **`--clay`** *regardless of actual hue* — the `variants/` indigo file still uses `var(--clay)`. Renaming it would break the components defined inside `tokens-clay.css`.
- Some `rgba()` literals are hardcoded to clay's coral inside `tokens-clay.css`; each variant restates the affected component rules with the new color.

**Rules:**
- Do not reference `--clay` from anything built on root `tokens.css`.
- Do not introduce `--accent` inside `variants/` files.
- Default to root `tokens.css`. Only touch `variants/` if the user explicitly asks for the legacy palettes (clay, sage, burgundy).

---

## 7. Dark mode

Dark mode ships in `tokens.css`. It activates two ways:

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
    const KEY = 'theme-preview';
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
    var s = localStorage.getItem('theme-preview') || 'auto';
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

1. Confirm the user wants Inkwell's Indigo & Cloud palette (default). If they want clay / sage / burgundy, see §6 — do not mix universes.
2. Fetch `tokens.css` and `inkwell.css` (§2).
3. Link `inkwell.css` from `<head>`.
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
2. Install `tokens.css` and `inkwell.css` in the app's static assets and load `inkwell.css` globally (§2).
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
7. If the app already uses Tailwind, CSS modules, CSS-in-JS, or a component library, integrate Inkwell at the edge: global tokens and classes first, then targeted component updates. Do not introduce a second styling architecture just for this migration.

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
- Do not add a build step (Vite, Webpack, PostCSS, Tailwind) just to use Inkwell. Existing build tooling in the host app is fine; do not create new tooling for the two CSS files.
- Do not modify `tokens.css` or `inkwell.css` in the user's project. If they need a custom token value, override it in their own stylesheet that loads *after* `inkwell.css`.
- Do not invent new component classes that conflict with `tokens.css` (`.btn`, `.card`, etc.). Extend with modifier classes instead.
- Do not introduce a CSS-in-JS layer, styled-components, or a UI framework on top. Inkwell is the framework.
- Do not paste this file's content inline into the user's project. It is for *you* to read; reference it via URL if the user wants a copy.

---

*If anything in this file conflicts with the latest `DESIGN_SYSTEM.md` in the repo, trust the repo. Fetch the latest version of either file before starting substantive work.*
