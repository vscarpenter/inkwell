# Inkwell 2.0 — Palette Switching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/specs/2026-05-15-palette-switching-design.md`

**Goal:** Ship Inkwell 2.0 with a `?palette=` toggle that swaps across the four palettes on every example page and `preview.html`, backed by a refactored `variants/` directory where variants are override-only consumers of canonical.

**Architecture:** Variants become ~70-line palette-only stylesheets that redefine brand-layer tokens; they layer on top of `inkwell.css` via cascade. A new IIFE in `demo.js` reads `?palette=` and `localStorage.getItem("inkwell-palette")`, then dynamically adds/removes a `<link>` element to swap the active variant. No build step, no test runner — verification is visual, matching the codebase's stated convention.

**Tech Stack:** Pure CSS (custom properties + cascade), vanilla JS (no framework), Node 20 for the existing `tokens.json` regenerator, GitHub Actions for the Pages deploy.

---

## File Structure

**Created (5 new files):**
- `variants/clay.css` — palette overrides only (~70 lines)
- `variants/sage.css` — palette overrides only (~70 lines)
- `variants/burgundy.css` — palette overrides only (~70 lines)
- `examples/variants/` — new directory (locally + on Pages deploy) holding mirrored variant CSS

**Deleted (8 files):**
- `variants/tokens-clay.css` (replaced by `clay.css`)
- `variants/tokens-sage.css` (replaced by `sage.css`)
- `variants/tokens-burgundy.css` (replaced by `burgundy.css`)
- `variants/tokens-indigo.css` (superseded by canonical `inkwell-tokens.css`)
- `variants/preview-clay.html`
- `variants/preview-sage.html`
- `variants/preview-burgundy.html`
- `variants/preview-indigo.html`

**Modified:**
- `examples/demo.js` — new IIFE alongside the existing theme toggle (~35 lines added)
- `examples/demo.css` — new `.palette-toggle` rule (~10 lines added)
- `examples/{dashboard,settings,profile,pricing,landing,article,docs,changelog,forms,search,not-found,roadmap,auth-pattern,tailwind}.html` — palette toggle markup added to each navbar (14 files)
- `preview.html` — palette toggle markup added
- `variants/compare.html` — link hrefs updated, `var(--clay)` references swapped to `var(--accent)` if present
- `inkwell-tokens.css` — version comment bumped to 2.0.0
- `tokens.json` — regenerated via existing script
- `.github/workflows/pages.yml` — variant paths added to triggers + sync step
- `CLAUDE.md`, `CONTRIBUTING.md`, `DESIGN_SYSTEM.md`, `README.md`, `AGENTS.md`, `agent-instructions.md`, `TAILWIND.md` — doc sweep
- `CHANGELOG.md` — 2.0.0 entry with Migration section
- `BACKLOG.md` — remove palette-swapping + editorial-primitives-in-variants items

---

## Task 1 — Refactor `variants/` CSS files

**Goal:** Replace the legacy full-system variant files with override-only files that layer on top of canonical.

**Files:**
- Create: `variants/clay.css`, `variants/sage.css`, `variants/burgundy.css`
- Delete: `variants/tokens-clay.css`, `variants/tokens-sage.css`, `variants/tokens-burgundy.css`, `variants/tokens-indigo.css`
- Modify: `variants/compare.html` (update link hrefs)

### Step 1.1 — Create `variants/clay.css`

Read the existing `variants/tokens-clay.css` to extract the four sets of values you'll need: light surfaces + light accent + light neutrals + dark equivalents. The file uses `--clay` as the accent token name; the new file uses `--accent`. Components live in `inkwell-components.css` already and reference `--accent`, `--accent-d`, `--accent-tint`, `--accent-focus-ring`, `--accent-strong-border` — derive the two missing tokens (`--accent-focus-ring`, `--accent-strong-border`) from the clay coral using the same alpha levels canonical uses (0.18 for focus ring, 0.5 for strong border).

- [ ] Create `variants/clay.css` with this exact structure:

```css
/* =====================================================================
   Clay — variant palette of Inkwell.
   Override-only: load this AFTER inkwell.css to switch the brand layer.

   Default canonical palette is Indigo & Cloud (see inkwell-tokens.css).
   This file redefines surface + accent + neutral tokens only; all
   structural rules (1.5px borders, type scale, spacing, motion,
   components) come from inkwell-components.css unchanged.
   ===================================================================== */

:root {
  /* ---------- Surfaces ---------- */
  --ivory: #FAF9F5;
  --slate: #141413;
  --oat:   #E3DACC;
  /* --paper is unchanged from canonical (#FFFFFF) */

  /* ---------- Accent (Anthropic clay coral) ---------- */
  --accent:               #D97757;
  --accent-d:             #B85C3E;
  --accent-tint:          rgba(217, 119, 87, 0.14);
  --accent-focus-ring:    rgba(217, 119, 87, 0.18);
  --accent-strong-border: rgba(217, 119, 87, 0.5);

  /* ---------- Neutral scale (warm grays) ---------- */
  --gray-100: #F0EEE6;
  --gray-200: #E6E3DA;
  --gray-300: #D1CFC5;
  --gray-500: #87867F;
  --gray-700: #3D3D3A;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* ---------- Surfaces (dark) ---------- */
    /* Copy from the dark cascade of variants/tokens-clay.css */
    /* (lines ~120-135 in current tokens-clay.css) */

    /* ---------- Accent (lifted clay) ---------- */
    --accent:               #E08B6E;
    --accent-d:             #C97557;
    --accent-tint:          rgba(224, 139, 110, 0.18);
    --accent-focus-ring:    rgba(224, 139, 110, 0.28);
    --accent-strong-border: rgba(224, 139, 110, 0.6);

    /* ---------- Neutral scale (dark) ---------- */
    /* Copy from same dark cascade block */
  }
}

:root[data-theme="dark"] {
  /* Same block as above, repeated for the manual override case.
     Matches the Pattern B cascade convention in inkwell-tokens.css. */
}
```

**Implementer note:** Two blocks are needed for the dark cascade — `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`. They must be byte-identical (same convention as `inkwell-tokens.css`). Extract the dark values from `variants/tokens-clay.css` lines 120-160 (look for the `@media` block and the standalone `:root[data-theme="dark"]` block).

- [ ] Run a quick sanity check: `wc -l variants/clay.css` should report 60–80 lines. If it's larger, you may have copied non-brand-layer overrides — go back and trim.

### Step 1.2 — Create `variants/sage.css`

Same shape as Step 1.1, sourced from `variants/tokens-sage.css`. Sage's accent is sage green (`#5C7F5C` or similar — extract the exact value from the source). Today's sage variant `@import`s `tokens-clay.css` and overrides ~5 tokens; in 2.0 it's standalone with the full surface + accent + neutral block.

- [ ] Create `variants/sage.css` with the same structure as `clay.css`, using sage's brand-layer values from `variants/tokens-sage.css`.

### Step 1.3 — Create `variants/burgundy.css`

Same shape, sourced from `variants/tokens-burgundy.css`. Burgundy's accent is deep burgundy (`#8B3A3A` in light, `#A85555` or similar in dark — verify against the source file's dark block).

- [ ] Create `variants/burgundy.css` with the same structure, using burgundy's brand-layer values from `variants/tokens-burgundy.css`.

### Step 1.4 — Verify the new variants render correctly

Local mirror first (the Pages workflow will do this automatically on deploy; locally we mirror manually):

- [ ] Run: `mkdir -p examples/variants && cp variants/clay.css variants/sage.css variants/burgundy.css examples/variants/`
- [ ] Open `examples/dashboard.html` in a browser.
- [ ] In the browser DevTools, manually inject a `<link rel="stylesheet" href="variants/clay.css">` into the `<head>` after `inkwell.css`. Confirm the page repaints with clay coral as the accent and warmer neutrals.
- [ ] Toggle the existing theme-toggle through light → dark. Confirm clay's dark cascade lifts the accent (should look like #E08B6E, not #D97757).
- [ ] Remove the injected link tag and try `variants/sage.css`, then `variants/burgundy.css`. Each should render distinctly.
- [ ] Open `preview.html` and repeat — confirm the lifted dark accent passes the eye test on every component (buttons, badges, alerts, chips, focus rings, the dropcap accent in §24, the pullquote left-rule).

### Step 1.5 — Delete legacy variant CSS files

- [ ] `git rm variants/tokens-clay.css variants/tokens-sage.css variants/tokens-burgundy.css variants/tokens-indigo.css`

### Step 1.6 — Update `variants/compare.html`

This page references the deleted `tokens-*.css` files. Open it and:

- [ ] Find every `<link rel="stylesheet" href="tokens-X.css">` and update to the new path: `tokens-clay.css` → `clay.css`, etc. For the indigo entry, change the href to `../inkwell.css` (canonical is now the indigo palette).
- [ ] If the page references `var(--clay)` in any inline `<style>` block, change to `var(--accent)`.
- [ ] Save and open in a browser. Confirm the four palettes still render side-by-side correctly (the page's purpose is unchanged — it's a static comparison of all four).

### Step 1.7 — Commit Task 1

- [ ] Run: `git add variants/clay.css variants/sage.css variants/burgundy.css variants/compare.html examples/variants/`
- [ ] Run: `git status` and confirm `variants/tokens-*.css` show as deleted, `variants/clay.css` etc. as added, `variants/compare.html` as modified.
- [ ] Commit:

```bash
git commit -m "refactor(variants): convert to override-only palette files

variants/{clay,sage,burgundy}.css now contain only brand-layer
token overrides (~70 lines each). Components live in canonical
inkwell-components.css; --clay is renamed to --accent throughout.

variants/tokens-indigo.css is deleted (superseded by canonical
inkwell-tokens.css, which IS the refined Indigo & Cloud palette).
variants/compare.html updated to link the new file paths.

Breaking: consumers linking variants/tokens-X.css directly will
404. Migration documented in CHANGELOG (committed separately)."
```

---

## Task 2 — Delete legacy per-palette preview pages

**Goal:** Remove the four `variants/preview-*.html` pages, replaced by `preview.html?palette=X`.

**Files:**
- Delete: `variants/preview-clay.html`, `variants/preview-sage.html`, `variants/preview-burgundy.html`, `variants/preview-indigo.html`

### Step 2.1 — Confirm no inbound links to these pages

- [ ] Run: `grep -rn "preview-clay\|preview-sage\|preview-burgundy\|preview-indigo" --include="*.html" --include="*.md" --include="*.css" --include="*.js" .`
- [ ] Expected: matches only inside the files being deleted themselves, plus possibly mentions in docs (CLAUDE.md, BACKLOG.md, README.md). If any **other** HTML file links to these previews, you need to either update or delete those references too. Note any findings for the doc-sweep task.

### Step 2.2 — Delete the files

- [ ] Run: `git rm variants/preview-clay.html variants/preview-sage.html variants/preview-burgundy.html variants/preview-indigo.html`

### Step 2.3 — Commit Task 2

```bash
git commit -m "remove(variants): delete per-palette preview pages

preview.html?palette=clay (etc.) replaces these. The standalone
preview pages were only useful as standalone showcases of a
hardcoded palette; with the new toggle, preview.html serves
the same role for all four palettes from one URL.

Breaking: anyone bookmarked to variants/preview-clay.html
gets a 404. Acceptable as part of 2.0."
```

---

## Task 3 — Add palette toggle markup

**Goal:** Add the `.palette-toggle` widget to every example page + `preview.html`. The widget is non-functional at this point (Task 4 wires the behavior); this task lands the HTML in one reviewable diff.

**Files modified (15 total):**
- `examples/dashboard.html`, `examples/settings.html`, `examples/profile.html`, `examples/pricing.html`, `examples/landing.html`, `examples/article.html`, `examples/docs.html`, `examples/changelog.html`, `examples/forms.html`, `examples/search.html`, `examples/not-found.html`, `examples/roadmap.html`, `examples/auth-pattern.html`, `examples/tailwind.html`
- `preview.html`

### Step 3.1 — Find the existing theme toggle in each example page

The 14 example pages each contain a block like this:

```html
<div class="theme-toggle" aria-label="Theme">
  <button class="btn btn-ghost" type="button" data-theme-choice="auto">Auto</button>
  <button class="btn btn-ghost" type="button" data-theme-choice="light">Light</button>
  <button class="btn btn-ghost" type="button" data-theme-choice="dark">Dark</button>
</div>
```

The palette toggle goes **immediately before** the theme toggle. Why before: palette is the more user-facing change; theme (light/dark) is a system-style preference. Reading left-to-right, choosing palette before theme is the natural mental order.

### Step 3.2 — Add the palette toggle to each of the 14 example HTML files

For each file in `examples/*.html` (except `examples/index.html` which stays minimal), insert this block immediately before the `<div class="theme-toggle">` line:

```html
<div class="palette-toggle" aria-label="Palette">
  <button class="btn btn-ghost" type="button" data-palette-choice="indigo"   title="Indigo & Cloud">Indigo</button>
  <button class="btn btn-ghost" type="button" data-palette-choice="clay"     title="Clay">Clay</button>
  <button class="btn btn-ghost" type="button" data-palette-choice="sage"     title="Sage & Stone">Sage</button>
  <button class="btn btn-ghost" type="button" data-palette-choice="burgundy" title="Burgundy & Bone">Burgundy</button>
</div>
```

- [ ] Edit each of the 14 files listed above and insert the block.
- [ ] After editing, run: `grep -l "palette-toggle" examples/*.html` and verify exactly 14 files match (not 13, not 15).

### Step 3.3 — Add the toggle to `preview.html`

`preview.html` lives at repo root, not in `examples/`. Its navbar may differ slightly; inspect it first.

- [ ] Run: `grep -n "theme-toggle" preview.html`. Note the line and look at the surrounding markup.
- [ ] Insert the same `<div class="palette-toggle">` block immediately before the existing `<div class="theme-toggle">`.

### Step 3.4 — Verify markup loads (no behavior yet)

- [ ] Open `examples/dashboard.html` in a browser.
- [ ] Confirm the four palette buttons appear in the navbar next to (left of) the existing theme toggle.
- [ ] Clicking them does nothing yet — that's expected. Task 4 wires the behavior.
- [ ] Visually verify the buttons fit in the navbar without overflow. If they push other nav-links off-screen on standard desktop widths, note for follow-up — the design's "Open implementation details" section flags responsive collapse as a future possibility, but if it's actively broken on first load that needs to be addressed in this task. (On 1280px+ desktop with the existing dashboard navbar, the four short labels should fit; on narrower pages like `auth-pattern.html`, monitor specifically.)

### Step 3.5 — Commit Task 3

```bash
git add examples/*.html preview.html
git commit -m "feat(examples): add palette toggle markup to every example page

Adds .palette-toggle widget with four palette choices (indigo,
clay, sage, burgundy) to all 14 examples and preview.html.
Mirrors the existing .theme-toggle markup pattern. No behavior
yet — wiring lands in the next commit.

index.html stays unchanged (minimal starter template)."
```

---

## Task 4 — Wire palette toggle behavior + CSS

**Goal:** Make the toggle functional. Reads `?palette=` and `localStorage`, swaps the stylesheet, persists choice.

**Files modified:**
- `examples/demo.js` — add a new IIFE alongside the existing theme IIFE (~35 lines added)
- `examples/demo.css` — add `.palette-toggle` rule (~10 lines added)

### Step 4.1 — Inspect the existing theme IIFE pattern in `demo.js`

- [ ] Read `examples/demo.js` (28 lines). Note the pattern: IIFE wrapper, reads `localStorage.getItem("inkwell-theme")`, `querySelectorAll("[data-theme-choice]")`, applies via `setAttribute("data-theme", choice)`.

### Step 4.2 — Append the palette IIFE to `demo.js`

After the closing `})();` of the existing theme IIFE, append:

```js

(function () {
  var PALETTES = {
    indigo:   null,                        // default — no extra stylesheet
    clay:     "variants/clay.css",
    sage:     "variants/sage.css",
    burgundy: "variants/burgundy.css",
  };

  var paletteLink = null;

  function loadSheet(href) {
    if (paletteLink) { paletteLink.remove(); paletteLink = null; }
    if (!href) return;
    paletteLink = document.createElement("link");
    paletteLink.rel = "stylesheet";
    paletteLink.id = "inkwell-palette-css";
    paletteLink.href = href;
    document.head.appendChild(paletteLink);
  }

  function applyPalette(name) {
    if (!PALETTES.hasOwnProperty(name)) name = "indigo";
    loadSheet(PALETTES[name]);
    localStorage.setItem("inkwell-palette", name);
    var url = new URL(location.href);
    if (name === "indigo") url.searchParams.delete("palette");
    else url.searchParams.set("palette", name);
    history.replaceState(null, "", url.toString());
    document.querySelectorAll("[data-palette-choice]").forEach(function (btn) {
      var active = btn.getAttribute("data-palette-choice") === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  document.querySelectorAll("[data-palette-choice]").forEach(function (btn) {
    btn.addEventListener("click", function () { applyPalette(btn.getAttribute("data-palette-choice")); });
  });

  var fromUrl = new URLSearchParams(location.search).get("palette");
  var fromStorage = localStorage.getItem("inkwell-palette");
  applyPalette(fromUrl || fromStorage || "indigo");
})();
```

### Step 4.3 — Add `.palette-toggle` CSS to `demo.css`

Open `examples/demo.css`, find the existing `.theme-toggle` rule (it groups its child buttons into a pill-shaped row). Add a parallel rule for `.palette-toggle`:

```css
.palette-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: var(--border);
  border-radius: var(--r-pill);
  background: var(--paper);
}
.palette-toggle .btn {
  border-radius: var(--r-pill);
  padding-inline: var(--sp-3);
  height: 30px;
  font-size: var(--t-caption);
}
.palette-toggle .btn.is-active {
  background: var(--accent-tint);
  color: var(--accent);
}
```

**Implementer note:** If the existing `.theme-toggle` rule looks different (different padding/border/background), match it instead — the goal is visual symmetry between the two toggles. The version above is a reasonable default if no symmetry constraint surfaces.

### Step 4.4 — Visual verification — the full toggle test matrix

Local mirror first:

- [ ] Run: `cp examples/demo.js examples/demo.css examples/ 2>/dev/null || true` (no-op if they're already where they should be; this is a sanity-belt step in case the files were ever moved).
- [ ] Run: `cp variants/clay.css variants/sage.css variants/burgundy.css examples/variants/` (refresh the local mirror).

Test the four palettes × three resolution paths × two themes:

- [ ] Open `examples/dashboard.html` in a browser. Click each palette button (Indigo → Clay → Sage → Burgundy → Indigo). Confirm each click visibly repaints the accent + neutrals.
- [ ] URL bar should update on each click: `dashboard.html` → `dashboard.html?palette=clay` → `dashboard.html?palette=sage` → `dashboard.html?palette=burgundy` → `dashboard.html` (palette=indigo is removed from the URL since it's the default).
- [ ] With burgundy active, copy the URL and open it in a private/incognito window. The page should load directly in burgundy (URL resolution).
- [ ] Close the private window. In the original tab, click "Indigo" to remove the query string. Reload (Cmd-R). Confirm the page is still Indigo (localStorage resolution).
- [ ] In the same tab, click "Sage". Open a different example (`examples/settings.html` from the nav). Confirm settings.html opens already in Sage (cross-page persistence via localStorage).
- [ ] Toggle the theme-toggle from Light → Dark on `settings.html` while Sage is active. Confirm both palette AND theme are honored — sage's lifted dark accent should appear.
- [ ] Repeat the click-through for clay and burgundy in dark mode. Confirm each has its own distinct lifted accent.

If any step fails — palette doesn't change, URL doesn't update, persistence doesn't survive a reload — diagnose before committing.

### Step 4.5 — Commit Task 4

```bash
git add examples/demo.js examples/demo.css
git commit -m "feat(examples): wire palette toggle behavior + visual styling

Adds an IIFE to demo.js that reads ?palette= and localStorage,
dynamically appends/removes a <link> element to swap the active
variant stylesheet, and updates URL + storage on toggle click.

Resolution order on each load: URL > localStorage > indigo.
Toggle click writes to both URL (history.replaceState) and
storage, so copied URLs are shareable.

CSS: .palette-toggle rule mirrors .theme-toggle's pill grouping
with .is-active styling tied to the active palette's accent."
```

---

## Task 5 — Update Pages workflow + local mirror docs

**Goal:** Variant CSS files reach the deployed Pages site at `variants/X.css` relative to root. Update workflow + CLAUDE.md local-mirror command in lockstep.

**Files modified:**
- `.github/workflows/pages.yml`
- `CLAUDE.md`

### Step 5.1 — Update `.github/workflows/pages.yml`

Two changes:

1. Add the three new variant CSS paths to the `paths:` trigger list.
2. Add a sync step that copies them into `examples/variants/`.

- [ ] Open `.github/workflows/pages.yml`.
- [ ] In the `paths:` block under `on.push`, add three new lines after the existing `- 'inkwell-theme.css'`:

```yaml
      - 'variants/clay.css'
      - 'variants/sage.css'
      - 'variants/burgundy.css'
```

- [ ] In the "Sync canonical CSS into examples/" step, change the single `cp` line to a multi-line `run:` block:

```yaml
      - name: Sync canonical CSS into examples/
        run: |
          cp tokens.css inkwell.css inkwell-tokens.css inkwell-components.css inkwell-theme.css examples/
          mkdir -p examples/variants
          cp variants/clay.css variants/sage.css variants/burgundy.css examples/variants/
```

### Step 5.2 — Update `CLAUDE.md` local-mirror command

`CLAUDE.md` documents how to mirror the source CSS into `examples/` for local testing. Update it to include the variants.

- [ ] Open `CLAUDE.md`. Find the section "### After editing the source CSS".
- [ ] Replace the existing `cp` command with the multi-line version:

```bash
cp tokens.css inkwell.css inkwell-tokens.css inkwell-components.css inkwell-theme.css examples/
mkdir -p examples/variants
cp variants/clay.css variants/sage.css variants/burgundy.css examples/variants/
```

### Step 5.3 — Verify the workflow YAML parses

- [ ] Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/pages.yml'))" && echo "ok"`
- [ ] Expected: `ok`. If you get a YAML parse error, fix indentation. GitHub Actions YAML is strict about 2-space indents.

### Step 5.4 — Commit Task 5

```bash
git add .github/workflows/pages.yml CLAUDE.md
git commit -m "ci(pages): sync variants/*.css into examples/variants/ on deploy

Pages deploys examples/ as the site root; variant CSS now needs
to live at examples/variants/ so demo.js can resolve
'variants/clay.css' on the live site.

Also extends paths: triggers so the workflow runs when variant
CSS changes. CLAUDE.md's local-mirror command updated in lockstep
so manual testing matches deploy."
```

---

## Task 6 — Doc sweep: retire the "two universes" framing

**Goal:** Update seven documentation files to reflect the new model — one token layer, four palettes.

**Files modified:** `CLAUDE.md`, `CONTRIBUTING.md`, `DESIGN_SYSTEM.md`, `README.md`, `AGENTS.md`, `agent-instructions.md`, `TAILWIND.md`

### Step 6.1 — `CLAUDE.md`

- [ ] Open `CLAUDE.md`. Find the section heading "## Architecture: two parallel naming systems".
- [ ] Replace the entire section (it's ~30 lines covering "Branch 1 — root tokens.css" and "Branch 2 — variants/") with:

```markdown
## Architecture: one token layer, four palettes

Inkwell has one token layer (`inkwell-tokens.css`) and one component layer (`inkwell-components.css`). The four palettes — **Indigo & Cloud** (canonical), **Clay**, **Sage & Stone**, **Burgundy & Bone** — share both layers; variants are override-only stylesheets that redefine the brand-layer tokens (`--accent`, `--ivory`, `--slate`, `--oat`, neutral scale) for `:root` + the dark cascade.

Variant files (`variants/clay.css`, `variants/sage.css`, `variants/burgundy.css`) are ~70 lines each. Load them **after** `inkwell.css` to switch the brand layer:

```html
<link rel="stylesheet" href="inkwell.css">
<link rel="stylesheet" href="variants/clay.css">  <!-- optional override -->
```

Indigo & Cloud is the default — no extra stylesheet needed. The variant CSS files have no `@import` directives; they rely on cascade order.

**Do not** restate component CSS in variant files. Component rules live in `inkwell-components.css` and reference `var(--accent)` etc. — overriding the token is enough.
```

- [ ] Search the rest of `CLAUDE.md` for any remaining references to `--clay`, "two universes", "Branch 1 / Branch 2", or `tokens-clay.css`. Update or remove each.

### Step 6.2 — `CONTRIBUTING.md`

- [ ] Open `CONTRIBUTING.md`. Find the section "## The two universes".
- [ ] Replace the entire section with:

```markdown
## Palettes

Inkwell ships with four palettes that share one token layer:

| Palette | File | Vibe |
|---|---|---|
| Indigo & Cloud (default) | `inkwell-tokens.css` | Cool stone + deep indigo. Linear/Stripe/Notion-adjacent. |
| Clay | `variants/clay.css` | Warm cream + Anthropic clay coral. Editorial. |
| Sage & Stone | `variants/sage.css` | Sage green + warm stone. Quiet, considered. |
| Burgundy & Bone | `variants/burgundy.css` | Deep burgundy + bone paper. Literary journal. |

Variant files contain only brand-layer token overrides (`--accent`, `--ivory`, `--slate`, `--oat`, neutral scale) for `:root` and the dark cascade. They never restate component CSS — components live once, in `inkwell-components.css`.

To use a non-default palette, load its file after `inkwell.css`. The example pages ship with a runtime toggle (`?palette=clay`); for static use, link the variant directly.
```

- [ ] Search `CONTRIBUTING.md` for any remaining `--clay` references and update.

### Step 6.3 — `DESIGN_SYSTEM.md`

- [ ] Open `DESIGN_SYSTEM.md`. Run `grep -n "clay\|--accent\|two universes" DESIGN_SYSTEM.md` to inventory what needs updating.
- [ ] Update any references to the legacy variant system. If `DESIGN_SYSTEM.md` has a section listing files in the repo, ensure `variants/clay.css`, `variants/sage.css`, `variants/burgundy.css` are listed and `variants/tokens-*.css` are not.
- [ ] Add a short "Palettes" subsection (3–5 sentences) describing the override-only model — text can be lifted from the CONTRIBUTING.md rewrite above, or written fresh to match the surrounding spec voice.

### Step 6.4 — `README.md`

- [ ] Open `README.md`. Find the existing mention of `variants/` (currently described as "legacy palette branch (clay base + burgundy / indigo / sage overrides)").
- [ ] Replace that bullet with: `**variants/** — alternate palette overrides (clay, sage, burgundy). Load after inkwell.css to switch the brand layer. The example pages support a runtime toggle via ?palette=X.`
- [ ] If there's a section listing example pages or a "What's in the box" area mentioning palette switching, add a one-sentence note linking to the example pages where the toggle is available.

### Step 6.5 — `AGENTS.md`

- [ ] Open `AGENTS.md`. Find the sentence: `The variants/ directory is a legacy palette branch and should not be mixed with the root token system.`
- [ ] Replace with: `The variants/ directory holds three palette-override CSS files (clay, sage, burgundy). Each loads on top of inkwell.css to swap the brand layer; they never restate component CSS.`

### Step 6.6 — `agent-instructions.md`

- [ ] Open `agent-instructions.md`. Find the "Optional companion files" table.
- [ ] If the table has an entry for the variants directory, update the file paths to the new names (`variants/clay.css`, `variants/sage.css`, `variants/burgundy.css`).
- [ ] Find section §6 (or whichever section discusses variants). Update language about "two universes" or "legacy palette branch" to describe the override-only model.

### Step 6.7 — `TAILWIND.md`

- [ ] Open `TAILWIND.md`. Add a new section near the end, before any existing "Troubleshooting" or "FAQ" section:

```markdown
## Using a non-default palette with Tailwind

The variant CSS files (`variants/clay.css`, `variants/sage.css`, `variants/burgundy.css`) override `--accent` and a handful of other brand-layer tokens. Tailwind utilities that reference those tokens via `@theme` (e.g. `text-accent`, `bg-accent-tint`, `border-gray-300`) follow the variant automatically — no extra Tailwind config needed.

The only requirement: load the variant CSS **after** Tailwind's build output, so its `:root` overrides win the cascade. For example:

```html
<link rel="stylesheet" href="/dist/styles.css">    <!-- Tailwind build (imports inkwell-theme.css) -->
<link rel="stylesheet" href="/variants/clay.css">  <!-- palette override, loads after -->
```

Reverse the order and Tailwind's `@theme`-derived rules win, leaving the default indigo accent active despite the variant being loaded.
```

### Step 6.8 — Final grep sweep

- [ ] Run: `grep -rn "two universes\|--clay\|tokens-clay\|tokens-indigo\|tokens-sage\|tokens-burgundy" --include="*.md" .`
- [ ] Expected: matches **only** inside `BACKLOG.md`, `CHANGELOG.md`, and `docs/specs/2026-05-15-palette-switching-design.md` (these are historical / spec docs that legitimately reference old names). Any match outside those files is a leftover — fix it.

### Step 6.9 — Commit Task 6

```bash
git add CLAUDE.md CONTRIBUTING.md DESIGN_SYSTEM.md README.md AGENTS.md agent-instructions.md TAILWIND.md
git commit -m "docs: retire 'two universes' framing across the doc set

Rewrites the variants documentation in seven files to describe
the new single-tokens-layer + four-palettes model. Variant files
are now override-only consumers of canonical CSS; --clay is gone
in favor of --accent throughout.

Also adds a TAILWIND.md section documenting the cascade-order
requirement for palette switching under Tailwind v4."
```

---

## Task 7 — Version bump to 2.0.0

**Goal:** Mark the release as 2.0.0 across the version-bearing surfaces, regenerate `tokens.json` via the existing script, and write the CHANGELOG migration section.

**Files modified:**
- `inkwell-tokens.css` (header comment)
- `tokens.json` (regenerated via script)
- `CHANGELOG.md`

### Step 7.1 — Bump the version in `inkwell-tokens.css`

- [ ] Open `inkwell-tokens.css`. Find the header line: `   Version: 1.4.0`.
- [ ] Change to: `   Version: 2.0.0`.

### Step 7.2 — Regenerate `tokens.json`

- [ ] Run: `node scripts/build-tokens-json.mjs`
- [ ] Expected output: `wrote tokens.json (NNNN bytes, version 2.0.0)`.
- [ ] Run: `node scripts/build-tokens-json.mjs --check`
- [ ] Expected: `tokens.json is up to date`.

### Step 7.3 — Move the `[Unreleased]` section in CHANGELOG to `[2.0.0]` + add Migration

- [ ] Open `CHANGELOG.md`. The current `[Unreleased]` block contains the tokens.json generator entries from the prior commit.
- [ ] Restructure as:

```markdown
## [Unreleased]

## [2.0.0] — 2026-MM-DD

### Added

- **Palette toggle on every example page.** A `?palette=` query string selects one of four palettes — `indigo` (default), `clay`, `sage`, `burgundy` — on every page in `examples/` and on `preview.html`. The widget mirrors the existing theme toggle: localStorage persistence, `?palette=` URL state, click-through cycling. `examples/index.html` is intentionally left without the toggle to keep the starter template minimal.
- **`scripts/build-tokens-json.mjs`** [moved from Unreleased] — zero-dependency Node script that regenerates tokens.json from inkwell-tokens.css with `--check` mode and a tokens-check.yml workflow.

### Changed (breaking)

- **Variants are now override-only consumers of canonical.** `variants/tokens-{clay,sage,burgundy,indigo}.css` are removed. `variants/clay.css`, `variants/sage.css`, `variants/burgundy.css` replace them — each is ~70 lines, contains only brand-layer token overrides, and is meant to load **after** `inkwell.css`. The legacy "two universes" naming system is retired.
- **`--clay` token namespace removed.** Variants use `--accent`, `--accent-d`, `--accent-tint`, `--accent-focus-ring`, `--accent-strong-border` — the same names canonical uses. The "two universes" rule (one system uses `--accent`, the other `--clay`) is gone.
- **`variants/preview-{clay,sage,burgundy,indigo}.html` removed.** `preview.html?palette=clay` (etc.) replaces them.
- **`tokens.json` formatting normalized** [from previous Unreleased entry — keep as-is].

### Migration

For consumers of Inkwell 1.x:

| Old | New |
|---|---|
| `<link href="variants/tokens-clay.css">` | `<link href="variants/clay.css">` |
| `<link href="variants/tokens-sage.css">` | `<link href="variants/sage.css">` |
| `<link href="variants/tokens-burgundy.css">` | `<link href="variants/burgundy.css">` |
| `<link href="variants/tokens-indigo.css">` | (none — canonical `inkwell.css` IS the indigo palette) |
| `var(--clay)` | `var(--accent)` |
| `var(--clay-d)` | `var(--accent-d)` |
| `var(--clay-tint)` | `var(--accent-tint)` |
| `variants/preview-clay.html` (or any other preview-*.html) | `preview.html?palette=clay` |

Variant CSS files no longer `@import` canonical. If you currently link only `variants/tokens-clay.css`, you must now link both `inkwell.css` and `variants/clay.css` (in that order).
```

### Step 7.4 — Set the release date

- [ ] Replace `2026-MM-DD` with today's date in `YYYY-MM-DD` format.

### Step 7.5 — Commit Task 7

```bash
git add inkwell-tokens.css tokens.json CHANGELOG.md
git commit -m "release: Inkwell 2.0.0

Bumps inkwell-tokens.css header to 2.0.0; regenerates tokens.json
via scripts/build-tokens-json.mjs (which now reports version 2.0.0).
CHANGELOG documents the variants refactor + palette toggle as
breaking changes, with a Migration section mapping every renamed
file path and token name.

2.0.0 honors the CHANGELOG's stated semver rule: 'majors break
the public API.' Renaming the variants/* files and the --clay
token namespace are both breaks; the major bump signals that
consumers should read the migration notes."
```

---

## Task 8 — BACKLOG cleanup + final end-to-end verification

**Goal:** Remove the two BACKLOG items this release resolves; do one final visual sweep across the example pages before pushing.

**Files modified:**
- `BACKLOG.md`

### Step 8.1 — Remove the palette-swapping BACKLOG item

- [ ] Open `BACKLOG.md`. Find the section "### Explore palette-swapping on the example pages" (lines ~9–25). Delete that entire section, including the surrounding `**Today.**`, `**The gap.**`, `**Open questions to answer before implementing.**`, and `**Why it's interesting.**` blocks.

### Step 8.2 — Remove the editorial-primitives-in-variants BACKLOG item

- [ ] Find the section "### Editorial primitives in `variants/`". Delete that entire section — variants now `@import` `inkwell-components.css` indirectly via cascade, so these primitives are available in every palette automatically. (Strictly speaking: the variants don't `@import`, but since the page loads `inkwell.css` + `inkwell-components.css` first and the variant only overrides tokens, every editorial primitive in `inkwell-components.css` works under every palette.)

### Step 8.3 — Final end-to-end verification across all example pages

Refresh the local mirror, then click through:

- [ ] Run: `mkdir -p examples/variants && cp variants/*.css examples/variants/ && cp inkwell-tokens.css inkwell-components.css tokens.css inkwell.css inkwell-theme.css examples/`
- [ ] Open `examples/dashboard.html`. Toggle through all four palettes. Toggle through all three themes (auto/light/dark) under each palette. **8 visual states per page.** Confirm no broken components.
- [ ] Repeat for at least four more example pages that exercise different components: `examples/article.html` (editorial primitives), `examples/forms.html` (inputs + focus states), `examples/pricing.html` (cards + accents), `examples/tailwind.html` (Tailwind cascade interaction).
- [ ] Open `preview.html`. Toggle all four palettes × both themes. Verify every component section renders.
- [ ] On a 2x display when possible (per CLAUDE.md: "the 1.5px border is retina-first").
- [ ] If any palette + theme combination produces a visually broken component (washed-out borders, invisible text, focus ring that doesn't appear), stop and diagnose — likely a token reference in `inkwell-components.css` that the variant file forgot to override.

### Step 8.4 — Commit Task 8

```bash
git add BACKLOG.md
git commit -m "chore(backlog): remove items resolved by 2.0

Palette-swapping on example pages: now shipped (?palette= toggle).
Editorial primitives in variants: dissolved by the refactor —
variants share inkwell-components.css, so .t-lede/.dropcap/etc.
are available in every palette automatically."
```

### Step 8.5 — Push the branch / open PR

- [ ] If working on a feature branch: `git push -u origin <branch-name>` and open a PR titled `Inkwell 2.0 — palette switching + variants refactor`.
- [ ] If working directly on main (matches the project's recent direct-to-main pattern): `git push origin main`. The `tokens.json drift check` and `Deploy examples to GitHub Pages` workflows should both fire on the push and pass.

---

## Self-Review (run before handing off)

After all tasks are complete:

- [ ] Spec coverage: every requirement in `docs/specs/2026-05-15-palette-switching-design.md` is implemented by exactly one task above. Quick map:
  - Spec §Architecture → Task 1 (variant CSS refactor)
  - Spec §Toggle UI → Tasks 3 + 4 (markup, JS, CSS)
  - Spec §Plumbing → Task 5 (pages.yml + CLAUDE.md mirror)
  - Spec §Doc rewrites → Task 6
  - Spec §Versioning → Task 7
  - Spec §Implementation order — all 8 commits land in the order shown
  - Spec §Out of scope items — none implemented (correct)
  - Spec §Risks — addressed by visual-verification steps in Tasks 1, 4, 8
- [ ] No placeholder text in any step.
- [ ] Type/name consistency: `data-palette-choice` (Task 3) matches the JS selector (Task 4). `inkwell-palette` storage key (Task 4) matches the design. PALETTES map keys (`indigo`, `clay`, `sage`, `burgundy`) match the markup `data-palette-choice` values.
- [ ] All commit messages in the plan use the same prefix style as recent repo commits (lowercase imperative subjects).

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-05-15-palette-switching.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Good for this plan because Task 1 (variant CSS refactor with line-by-line value extraction) and Task 6 (seven-file doc sweep) are well-isolated and verification-heavy; reviewing each as a discrete deliverable is cheaper than catching issues at the end.

2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints for your review.

**Which approach?**

