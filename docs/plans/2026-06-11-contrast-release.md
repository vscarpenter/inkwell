# Inkwell 2.1.0 Contrast Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Inkwell 2.1.0: accent ink/fill token split, WCAG AA fixes across all palettes, button states, a11y utilities, pattern promotions, consistency sweep, and a CI contrast gate.

**Architecture:** Pure-CSS design system, no build step. The acceptance test is a new zero-dep Node script (`scripts/check-contrast.mjs`) that parses the actual token CSS (reusing `build-tokens-json.mjs` parsing helpers) and asserts ~50 WCAG ratios across 4 palettes x 2 modes. TDD shape: write the checker first (fails on current values), then fix tokens until green.

**Tech Stack:** CSS custom properties, Node 18+ (scripts only), GitHub Actions.

**Branch:** `inkwell-2.1.0` (already created; spec committed). Spec: `docs/specs/2026-06-11-contrast-release-design.md`.

**Repo invariants (do not violate):**
- Tokens/dark-cascade edits go in `inkwell-tokens.css`; components in `inkwell-components.css`. NEVER edit `tokens.css` / `inkwell.css` (aggregator shims).
- The two dark blocks in `inkwell-tokens.css` (and each variant) must declare identical values — `build-tokens-json.mjs --check` enforces this for canonical.
- No literal hex in `inkwell-components.css` (data-URI SVG strokes in variants/tokens are the lone documented exception).
- After source CSS edits, mirror into `examples/` (Task 9).

---

### Task 1: `scripts/check-contrast.mjs` — the failing acceptance test

**Files:**
- Create: `scripts/check-contrast.mjs`

- [ ] **Step 1: Write the checker**

Create `scripts/check-contrast.mjs` with this exact content:

```js
#!/usr/bin/env node
// WCAG contrast gate for Inkwell tokens.
//
// Usage:  node scripts/check-contrast.mjs
// Exit 0: every pair passes. Exit 1: prints a failure table.
//
// Parses the REAL CSS (canonical + variants) so checked values can never
// drift from shipped values. Zero dependencies, Node 18+.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

// ---------- CSS parsing (same approach as build-tokens-json.mjs) ----------
function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ""); }
function parseDeclarations(block) {
  const out = new Map();
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+?)\s*;/gi;
  let m;
  while ((m = re.exec(block)) !== null) out.set(m[1], m[2].replace(/\s+/g, " ").trim());
  return out;
}
function extractBlock(css, opener) {
  const start = css.indexOf(opener);
  if (start === -1) return null;
  const openBrace = css.indexOf("{", start + opener.length);
  let depth = 1, i = openBrace + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  return css.slice(openBrace + 1, i - 1);
}
function lightAndDark(file) {
  const css = stripComments(readFileSync(resolve(ROOT, file), "utf8"));
  const light = parseDeclarations(extractBlock(css, ":root") ?? "");
  const darkBody = extractBlock(css, ':root[data-theme="dark"]');
  const dark = parseDeclarations(darkBody ?? "");
  return { light, dark };
}

// ---------- color math ----------
function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function srgb(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`bad hex: ${hex}`);
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lum([r, g, b]) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
function ratio(fg, bg) {
  const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}
// Composite an rgba() value over an opaque background.
function composite(rgba, bg) {
  const m = rgba.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (!m) throw new Error(`not rgba(): ${rgba}`);
  const a = Number(m[4]);
  return [1, 2, 3].map((i) => Math.round(Number(m[i]) * a + bg[i - 1] * (1 - a)));
}

// ---------- token resolution ----------
// Resolve a token to an opaque RGB triple in a given palette+mode.
// `vars` maps token -> raw value; var() refs resolve recursively;
// rgba() values composite over the resolved --paper of that context.
function resolveColor(name, vars, depth = 0) {
  if (depth > 8) throw new Error(`var() loop at ${name}`);
  const raw = vars.get(name);
  if (raw === undefined) throw new Error(`undefined token: ${name}`);
  const ref = raw.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (ref) return resolveColor(ref[1], vars, depth + 1);
  if (raw.startsWith("#")) return srgb(raw);
  if (raw.startsWith("rgba(")) return composite(raw, resolveColor("--paper", vars, depth + 1));
  throw new Error(`unparseable color for ${name}: ${raw}`);
}

// Build the effective var map for palette+mode: canonical light, overlaid by
// variant light (if any), overlaid by canonical dark (if dark), overlaid by variant dark.
const canonical = lightAndDark("inkwell-tokens.css");
const variantFiles = { clay: "variants/clay.css", sage: "variants/sage.css", burgundy: "variants/burgundy.css" };
function varsFor(palette, mode) {
  const out = new Map(canonical.light);
  const variant = palette === "indigo" ? null : lightAndDark(variantFiles[palette]);
  if (variant) for (const [k, v] of variant.light) out.set(k, v);
  if (mode === "dark") {
    for (const [k, v] of canonical.dark) out.set(k, v);
    if (variant) for (const [k, v] of variant.dark) out.set(k, v);
  }
  return out;
}

// ---------- the check table ----------
// [label, fg token, bg token, threshold]. Run for every palette x mode.
const CHECKS = [
  ["body text (slate on ivory)",            "--slate",        "--ivory",        4.5],
  ["secondary text (gray-700 on paper)",    "--gray-700",     "--paper",        4.5],
  ["muted text (gray-500 on paper)",        "--gray-500",     "--paper",        4.5],
  ["muted text (gray-500 on ivory)",        "--gray-500",     "--ivory",        4.5],
  ["link text (accent-ink on ivory)",       "--accent-ink",   "--ivory",        4.5],
  ["link text (accent-ink on paper)",       "--accent-ink",   "--paper",        4.5],
  ["btn-primary label (on-accent on accent)", "--on-accent",  "--accent",       4.5],
  ["btn-primary hover (on-accent on accent-d)", "--on-accent", "--accent-d",    4.5],
  ["btn-danger label (paper on rust)",      "--paper",        "--rust",         4.5],
  ["btn-danger hover (paper on rust-d)",    "--paper",        "--rust-d",       4.5],
  ["badge-accent (accent-ink on tint)",     "--accent-ink",   "--accent-tint",  4.5],
  ["badge-success (olive-dark on tint)",    "--olive-dark",   "--olive-tint",   4.5],
  ["badge-warning (warning-dark on tint)",  "--warning-dark", "--warning-tint", 4.5],
  ["badge-danger (paper on rust)",          "--paper",        "--rust",         4.5],
  ["stat-delta up (olive-dark on paper)",   "--olive-dark",   "--paper",        4.5],
  ["stat-delta down (rust on paper)",       "--rust",         "--paper",        4.5],
  ["pill resolved (paper on olive-dark)",   "--paper",        "--olive-dark",   4.5],
  ["pill sev (on-accent on accent)",        "--on-accent",    "--accent",       4.5],
  ["field-error (rust on ivory)",           "--rust",         "--ivory",        4.5],
  ["table header (gray-700 on gray-100)",   "--gray-700",     "--gray-100",     4.5],
  ["focus outline vs ivory (non-text)",     "--accent-ink",   "--ivory",        3.0],
  ["focus outline vs paper (non-text)",     "--accent-ink",   "--paper",        3.0],
  ["control border vs paper (non-text)",    "--gray-400",     "--paper",        3.0],
  ["control border vs ivory (non-text)",    "--gray-400",     "--ivory",        3.0],
];

const palettes = ["indigo", "clay", "sage", "burgundy"];
const failures = [];
let count = 0;
for (const palette of palettes) {
  for (const mode of ["light", "dark"]) {
    const vars = varsFor(palette, mode);
    for (const [label, fg, bg, need] of CHECKS) {
      count++;
      let r;
      try {
        r = ratio(resolveColor(fg, vars), resolveColor(bg, vars));
      } catch (e) {
        failures.push({ palette, mode, label, ratio: `error: ${e.message}`, need });
        continue;
      }
      if (r < need) failures.push({ palette, mode, label, ratio: r.toFixed(2), need });
    }
  }
}

if (failures.length) {
  console.error(`contrast check: ${failures.length}/${count} pairs FAIL\n`);
  for (const f of failures) {
    console.error(`  [${f.palette}/${f.mode}] ${f.label}: ${f.ratio} < ${f.need}`);
  }
  process.exit(1);
}
console.log(`contrast check: all ${count} pairs pass`);
```

- [ ] **Step 2: Run it to verify it fails on current values**

Run: `node scripts/check-contrast.mjs`
Expected: exit 1 with `undefined token: --accent-ink` (the new tokens don't exist yet — that IS the failing test; the script is correct, the CSS is behind).

- [ ] **Step 3: Commit**

```bash
git add scripts/check-contrast.mjs
git commit -m "test(contrast): add WCAG contrast gate across palettes and modes"
```

---

### Task 2: Canonical tokens + tokens.json schema

**Files:**
- Modify: `inkwell-tokens.css` (`:root` + BOTH dark blocks; header version)
- Modify: `scripts/build-tokens-json.mjs` (schema entries)
- Regenerate: `tokens.json`

- [ ] **Step 1: Add new tokens to `:root` in `inkwell-tokens.css`**

In the `Accent` section, after the `--accent-strong-border` line, add:

```css
  --accent-ink:           var(--accent);           /* accent as TEXT/outline — variants override when their accent is too light to read */
  --on-accent:            var(--paper);            /* label color on accent fills (btn-primary, pill.sev, pagination current) */
```

In the `Semantic` section, after `--olive-strong-border`, add:

```css
  --olive-dark:   #566740;                         /* olive as text/solid fill (badge-success, stat-delta.up, pill.resolved) — 5.19:1 on olive-tint */
```

Change `--warning-dark: #A06A2A;` to:

```css
  --warning-dark: #85561E;                         /* warning text (darker for contrast) — 5.41:1 on warning-tint */
```

After `--sky`, add:

```css
  --info-tint:           rgba(92, 124, 163, 0.16); /* info alert background */
  --info-strong-border:  rgba(92, 124, 163, 0.45); /* info alert border */
```

In the `Neutral scale` section, between `--gray-300` and `--gray-500`, add:

```css
  --gray-400: #88888E;  /* control boundaries — 3.5:1 on paper, 3.2:1 on ivory (WCAG 1.4.11) */
```

In the `Borders` section, after `--border-rule`, add:

```css
  --control-border: 1.5px solid var(--gray-400);   /* checkbox/radio/switch — functional state boundary, >=3:1 */
```

Header: change `Version: 2.0.0` to `Version: 2.1.0`.

- [ ] **Step 2: Add identical dark values to BOTH dark blocks**

In BOTH `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` AND `:root[data-theme="dark"] {...}`, make two CHANGES first (writing the check table surfaced two dark-mode failures the review missed):

```css
    --accent-d:             #8B9ADB;                 /* hover LIGHTENS in dark — paper label on old #6273C0 read 3.90:1; lifted value reads 6.39:1 */
```
```css
    --accent-tint:          rgba(122, 138, 209, 0.10); /* was 0.18 — dark badge-accent text read 4.07:1 on the heavier tint; 0.10 reads 4.61:1 */
```

Then ADD (same relative positions as :root):

```css
    --accent-ink:           var(--accent);
    --on-accent:            var(--paper);
```
```css
    --olive-dark:   #9CB07A;                        /* lifted — same as dark --olive */
```
```css
    --info-tint:          rgba(124, 159, 210, 0.18);
    --info-strong-border: rgba(124, 159, 210, 0.6);
```
```css
    --gray-400: #666874;  /* 3.1:1 on dark paper */
```

(`--warning-dark` dark value stays `#D9A55F`; `--control-border` resolves through `--gray-400`, no dark re-declaration needed — it is NOT redeclared in dark blocks, matching how `--border` works.)

- [ ] **Step 3: Add schema entries to `scripts/build-tokens-json.mjs`**

In `accent: {...}` after the `accent_strong_border` line:

```js
        accent_ink:           lightDark("--accent-ink",           "Accent as text/outline (links, tabs, badge text, focus ring)"),
        on_accent:            lightDark("--on-accent",            "Label color on accent fills"),
```

In `semantic: {...}` after `olive_strong_border`:

```js
        olive_dark:            lightDark("--olive-dark",            "Olive as text/solid fill (badge-success, stat-delta.up, pill.resolved)"),
```

In `semantic: {...}` after `sky`:

```js
        info_tint:             lightDark("--info-tint",             "Info alert background"),
        info_strong_border:    lightDark("--info-strong-border",    "Info alert border"),
```

In `neutral: {...}` between `gray_300` and `gray_500`:

```js
        gray_400: lightDark("--gray-400", "Control boundaries (checkbox/radio/switch) — WCAG 1.4.11"),
```

In `border: {...}` after `rule:`:

```js
      control: light("--control-border"),
```

- [ ] **Step 4: Regenerate tokens.json and verify**

Run: `node scripts/build-tokens-json.mjs && node scripts/build-tokens-json.mjs --check`
Expected: `wrote tokens.json (...)` then `tokens.json is up to date`. NO orphan warnings.

- [ ] **Step 5: Run contrast gate — canonical passes, variants still fail**

Run: `node scripts/check-contrast.mjs`
Expected: exit 1, failures ONLY in `[clay/...]`, `[sage/...]`, `[burgundy/...]` rows (their accent-ink/gray-400/gray-500 tokens don't exist until Task 4 — undefined-token errors count as failures here; if the script throws on the first undefined variant token, that is the expected state). Zero `[indigo/...]` failures in either mode.

- [ ] **Step 6: Commit**

```bash
git add inkwell-tokens.css scripts/build-tokens-json.mjs tokens.json
git commit -m "feat(tokens): accent-ink/on-accent split, olive-dark, gray-400 control border, info tints"
```

---

### Task 3: Component re-pointing (contrast fixes)

**Files:**
- Modify: `inkwell-components.css`

All edits are exact old → new replacements. Header: change `Version: 1.3.1` to `Version: 2.1.0`.

- [ ] **Step 1: Re-point text usages of accent to `--accent-ink`**

| Rule | Old | New |
|---|---|---|
| `em.accent, .serif em` | `color: var(--accent);` | `color: var(--accent-ink);` |
| `a.link` | `color: var(--accent);` | `color: var(--accent-ink);` |
| `a.link:hover` | `text-decoration-color: var(--accent);` | `text-decoration-color: var(--accent-ink);` |
| `.badge-accent` | `color: var(--accent);` | `color: var(--accent-ink);` |
| `.tab[aria-selected="true"], .tab.is-active` | `color: var(--accent);` (keep `border-bottom-color: var(--accent)`) | `color: var(--accent-ink);` |
| `.sec-head .idx` | `color: var(--accent);` | `color: var(--accent-ink);` |
| `.toc a:hover .n` | `color: var(--accent);` | `color: var(--accent-ink);` |
| `.breadcrumbs a:hover` | `color: var(--accent);` | `color: var(--accent-ink);` |
| `*:focus-visible` | `outline: 2px solid var(--accent);` | `outline: 2px solid var(--accent-ink);` |

Decorative accent stays `--accent` (do NOT touch): `.eyebrow::before`, `.eyebrow-serif::before`, `.dropcap::first-letter`, `.pullquote` border, `.tl-entry::before`, `.tab` border-bottom-color, `.stat-card.is-primary` border (Step 4).

- [ ] **Step 2: Re-point accent-fill labels to `--on-accent`**

| Rule | Old | New |
|---|---|---|
| `.btn-primary` | `color: var(--paper);` | `color: var(--on-accent);` |
| `.pill.sev` | `color: var(--paper);` | `color: var(--on-accent);` |
| `.pagination [aria-current="page"]` | `color: var(--paper);` | `color: var(--on-accent);` |

- [ ] **Step 3: Olive/warning/info/table fixes**

| Rule | Old | New |
|---|---|---|
| `.badge-success` | `color: var(--olive);` | `color: var(--olive-dark);` |
| `.stat-delta.up` | `color: var(--olive);` | `color: var(--olive-dark);` |
| `.pill.resolved` | `background: var(--olive);` | `background: var(--olive-dark);` |
| `.alert.is-info` | `background: var(--accent-tint); border-color: var(--accent-strong-border);` | `background: var(--info-tint); border-color: var(--info-strong-border);` |
| `.tbl thead th` | `color: var(--gray-500);` | `color: var(--gray-700);` |

- [ ] **Step 4: Stat-card marker + control borders**

`.stat-card.is-primary`: replace

```css
.stat-card.is-primary { border-left: 4px solid var(--accent); padding-left: 19px; }
```

with

```css
.stat-card.is-primary { border-color: var(--accent); }
```

Control boundaries:
- `.checkbox input`: `border: var(--border);` → `border: var(--control-border);`
- `.radio input`: `border: var(--border);` → `border: var(--control-border);`
- `.switch input`: `background: var(--gray-300);` → `background: var(--gray-400);`

- [ ] **Step 5: Verify canonical + commit**

Run: `node scripts/check-contrast.mjs` — still only clay/sage/burgundy failures.
Run: `grep -n '#[0-9A-Fa-f]\{3,6\}' inkwell-components.css | grep -v 'svg+xml'` — expected: no output.

```bash
git add inkwell-components.css
git commit -m "fix(components): point text at accent-ink/on-accent/olive-dark; control-border; info alert uses --info"
```

---

### Task 4: Variant contrast fixes (clay, sage, burgundy)

**Files:**
- Modify: `variants/clay.css`, `variants/sage.css`, `variants/burgundy.css`

Each variant adds tokens to its `:root` AND (where dark values differ) to BOTH its dark blocks (`@media ... :root:not([data-theme="light"])` and `:root[data-theme="dark"]` — keep the two byte-identical, same as canonical).

- [ ] **Step 1: Clay (`variants/clay.css`)**

`:root` — in the Accent section add; in the Neutral section change/add:

```css
  --accent-ink:           #A04E2C;                 /* coral as text — 5.5:1 on ivory (raw #D97757 reads 2.96:1) */
  --on-accent:            var(--slate);            /* dark label on coral — white only hits 3.12:1 */
  --accent-d:             #E08B6E;                 /* hover LIGHTENS (7.1:1 with slate label); darkening hover failed 4.07:1 */
```

NOTE: `--accent-d` already exists in clay's `:root` as `#B85C3E` — change it to `#E08B6E` (with the comment above). Then in the Neutral scale change `--gray-500: #87867F;` → `--gray-500: #6E6D62;` and add `--gray-400: #8F8D82;`.

BOTH dark blocks — add:

```css
    --accent-ink:           var(--accent);
    --on-accent:            var(--paper);
    --gray-400: #716D60;
```

BOTH dark blocks — after the `--gray-500` line, add the chevron override (closes the BACKLOG item):

For the `@media` block, append after its closing of the token rule (inside the media query, sibling to `:root:not(...)`):

```css
  :root:not([data-theme="light"]) .select {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1.5L6 6.5L11 1.5' stroke='%239C988D' stroke-width='1.5' stroke-linecap='round'/></svg>");
  }
```

And after the `:root[data-theme="dark"]` block:

```css
:root[data-theme="dark"] .select {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1.5L6 6.5L11 1.5' stroke='%239C988D' stroke-width='1.5' stroke-linecap='round'/></svg>");
}
```

(stroke = clay's dark `--gray-500` `#9C988D`.)

- [ ] **Step 2: Sage (`variants/sage.css`)**

`:root` add/change (accent + neutral sections):

```css
  --accent-ink:           #3A7456;                 /* sage as text — 5.0:1 on ivory (raw #3F7C5C reads 4.49:1) */
  --gray-500: #6B6962;                             /* was #84827B (3.5:1) — AA on ivory+paper */
  --gray-400: #8C8A80;
```

(No `--on-accent` needed: white on `#3F7C5C` is 4.94:1, dark paper on lifted accent 5.99:1 — inherits canonical `var(--paper)`.)

BOTH dark blocks add:

```css
    --accent-ink:           var(--accent);
    --gray-400: #6E6F63;
```

Plus the same two chevron overrides as clay, with stroke `%239A9A91` (sage's dark gray-500 `#9A9A91`).

- [ ] **Step 3: Burgundy (`variants/burgundy.css`)**

`:root` change/add (neutral section only — `#8B3A3A` already passes as ink, inherits `--accent-ink: var(--accent)`):

```css
  --gray-500: #6F6A5F;                             /* was #8A8478 (3.7:1) — AA on ivory+paper */
  --gray-400: #8E8779;
```

BOTH dark blocks add:

```css
    --gray-400: #746A62;
```

Plus the same two chevron overrides, with stroke `%239C928A` (burgundy's dark gray-500 `#9C928A`).

- [ ] **Step 4: Tune until green**

Run: `node scripts/check-contrast.mjs`
Expected: `contrast check: all 192 pairs pass`. If any `--gray-500`/`--gray-400` row is within 0.1 of the threshold and failing, darken (light mode) / lighten (dark mode) that hex by 2-3 per channel and re-run. Record the final values; they are the shipped ones.

- [ ] **Step 5: Commit**

```bash
git add variants/clay.css variants/sage.css variants/burgundy.css
git commit -m "fix(variants): accent-ink + AA grays for clay/sage/burgundy; per-variant dark select chevron"
```

---

### Task 5: Component additions + promotions

**Files:**
- Modify: `inkwell-components.css`, `index.html`, `examples/demo.css`

- [ ] **Step 1: Button states + sizes (after the `.btn-danger:hover` rule)**

```css
.btn:disabled,
.btn.is-disabled {
  background: var(--gray-100);
  color: var(--gray-500);
  border-color: var(--gray-200);
  cursor: not-allowed;
}
.btn-primary:active:not(:disabled)   { background: var(--accent-d); }
.btn-secondary:active:not(:disabled) { background: var(--gray-200); }
.btn-ghost:active:not(:disabled)     { background: var(--gray-200); }
.btn-danger:active:not(:disabled)    { background: var(--rust-d); }
.btn-sm { height: 30px; padding: 0 12px; font-size: 13px; }
.btn[aria-busy="true"] { pointer-events: none; }
.btn[aria-busy="true"]::before {
  content: "";
  width: 12px; height: 12px;
  margin-right: 8px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: btn-spin 0.7s linear infinite;
}
@keyframes btn-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .btn[aria-busy="true"]::before { animation: none; border-top-color: currentColor; opacity: 0.5; }
}
```

- [ ] **Step 2: A11y utilities (in the Accessibility section, before `*:focus-visible`)**

```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: var(--z-modal);
  background: var(--accent);
  color: var(--on-accent);
  padding: 10px 18px;
  border-radius: var(--r-pill);
  font: 500 14px/1 var(--sans);
  text-decoration: none;
}
.skip-link:focus-visible { left: 16px; top: 16px; }
```

- [ ] **Step 3: Promotions (new "App shell & layout patterns" section, before Layout helpers)**

```css
/* ---------- Navbar (promoted from index.html in 2.1.0) ---------- */
.navbar {
  position: sticky; top: 0; z-index: var(--z-sticky);
  background: var(--ivory);
  border-bottom: var(--border-rule);
}
.navbar-inner {
  max-width: var(--content-default);
  margin: 0 auto;
  padding: 14px var(--page-pad-x);
  display: flex;
  align-items: center;
  gap: 18px;
}
.navbar .brand {
  font: 600 14px/1 var(--serif);
  letter-spacing: -0.01em;
  color: var(--slate);
  text-decoration: none;
}
.navbar .brand .dot {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--accent);
  margin-right: 8px;
  vertical-align: middle;
}
.navbar nav {
  display: flex;
  gap: 22px;
  margin-left: auto;
  font: 500 13px/1 var(--sans);
}
.navbar nav a {
  color: var(--gray-700);
  text-decoration: none;
  transition: color var(--t-fast);
}
.navbar nav a:hover { color: var(--accent-ink); }

/* ---------- Inline field row ---------- */
.field-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  align-items: center;
}

/* ---------- Responsive card grid ---------- */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

/* ---------- Table overflow wrapper ---------- */
.tbl-scroll { overflow-x: auto; }
.tbl-scroll > .tbl { min-width: 560px; }
```

- [ ] **Step 4: Type niceties, selection, motion gate, print**

In `.t-display`, `.t-h1`, `.t-h2` rules add `text-wrap: balance;`. In `.t-lede` and `.pullquote` add `text-wrap: pretty;`.

Replace `html { scroll-behavior: smooth; }` with:

```css
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}
```

Add at end of Accessibility section:

```css
::selection { background: var(--accent-tint); }
```

(Visual check in Task 9; if invisible, use `var(--oat)`.)

Add at end of file:

```css
/* =====================================================================
   Print
   ===================================================================== */
@media print {
  .card, .stat-card, .tbl, figure.figure, .alert, .code-block { break-inside: avoid; }
  .tldr {
    background: transparent;
    color: inherit;
    border: var(--border-strong);
  }
  .tldr-label, .tldr code { color: inherit; background: transparent; }
  .skeleton { animation: none; background: var(--gray-100); }
  .skip-link { display: none; }
}
```

- [ ] **Step 5: Dedupe `index.html` and `examples/demo.css`**

`index.html` `<style>`: delete the `.navbar`, `.navbar-inner`, `.brand`, `.brand .dot`, `.navbar nav`, `.navbar nav a`, `.navbar nav a:hover`, and `.card-grid` rules (now shipped). Keep `.card-foot`, `.hero`, `.stat-row`, `section`, `footer` rules.

`examples/demo.css`: remove `.card-grid` from BOTH the standalone rule (lines 148-152) and keep `.metric-grid`/`.two-grid` untouched; remove `.field-row` from the grouped `.button-row, .chip-row, .field-row` selector (leave `.button-row, .chip-row`); remove `.card-grid` from the 860px media-query list (auto-fill handles collapse).

- [ ] **Step 6: Verify + commit**

Run: `node scripts/check-contrast.mjs` — still all green.
Run: `grep -n '#[0-9A-Fa-f]\{3,6\}' inkwell-components.css | grep -v 'svg+xml'` — no output.
Open `index.html` in a browser: navbar renders identically to before.

```bash
git add inkwell-components.css index.html examples/demo.css
git commit -m "feat(components): btn states + btn-sm, sr-only/skip-link, navbar/field-row/card-grid/tbl-scroll, print + type niceties"
```

---

### Task 6: Tailwind theme aliases

**Files:**
- Modify: `inkwell-theme.css`

- [ ] **Step 1: Add @theme aliases + bump version**

Header: `Version: 1.4.0` → `Version: 2.1.0`.

In `@theme`, after `--color-accent-strong-border`:

```css
  --color-accent-ink: var(--accent-ink);
  --color-on-accent:  var(--on-accent);
```

After `--color-olive-tint`:

```css
  --color-olive-dark: var(--olive-dark);
```

After `--color-sky`:

```css
  --color-info-tint:          var(--info-tint);
  --color-info-strong-border: var(--info-strong-border);
```

After `--color-gray-300`:

```css
  --color-gray-400: var(--gray-400);
```

- [ ] **Step 2: Commit**

```bash
git add inkwell-theme.css
git commit -m "feat(tailwind): expose accent-ink, on-accent, olive-dark, gray-400, info tints in @theme"
```

---

### Task 7: Pre-paint snippets + theme-key unification

**Files:**
- Modify: `index.html`, `preview.html`, `variants/compare.html`, all 15 `examples/*.html`

- [ ] **Step 1: Unify the storage key (with one-time fallback)**

In `index.html` bottom IIFE: `const KEY = 'theme-preview';` → `const KEY = 'inkwell-theme';` and `let current = localStorage.getItem(KEY) || 'auto';` → `let current = localStorage.getItem(KEY) || localStorage.getItem('theme-preview') || 'auto';`
In `preview.html` bottom IIFE: same two changes.
`examples/tailwind.html` has its OWN theme script (it does not load `demo.js`): rename `'theme-preview'` to `'inkwell-theme'` at BOTH its head pre-paint read (~line 27) and its toggle IIFE `KEY` (~line 369), keeping `|| localStorage.getItem('theme-preview')` as fallback at the read sites.
Check `variants/compare.html` for `localStorage` theme reads; if it uses a key, apply the same rename (it currently only broadcasts postMessage — no change expected).

- [ ] **Step 2: Pre-paint theme snippet (all pages)**

Insert directly AFTER the `<meta name="viewport" ...>` line and BEFORE any `<link rel="stylesheet">` in: `index.html`, `preview.html`, `variants/compare.html`, and every `examples/*.html` (15 files). EXCEPTION: `examples/tailwind.html` already has a head pre-paint script (~line 27) — update its key per Step 1 instead of adding a duplicate block:

```html
<script>
  // Apply saved theme before first paint (README: "writes data-theme before paint").
  (function () {
    var t = localStorage.getItem("inkwell-theme") || localStorage.getItem("theme-preview");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  })();
</script>
```

- [ ] **Step 3: Pre-paint palette snippet (examples + preview only)**

In every `examples/*.html` EXCEPT `index.html` (gallery hub has no palette toggle) — 14 files — and in root `preview.html`, extend the same script block with (paths relative to the page: examples pages use `variants/...`; root `preview.html` also uses `variants/...`):

```js
    var PALETTES = { clay: 1, sage: 1, burgundy: 1 };
    var p = new URLSearchParams(location.search).get("palette") || localStorage.getItem("inkwell-palette");
    if (p && PALETTES[p]) {
      document.write('<link rel="stylesheet" id="inkwell-palette-prepaint" href="variants/' + p + '.css">');
    }
```

Then make the runtime swappers idempotent: in `examples/demo.js` `loadSheet()` and in `preview.html`'s palette IIFE `loadSheet()`, add as the first line:

```js
    var pre = document.getElementById("inkwell-palette-prepaint");
    if (pre) { pre.remove(); }
```

- [ ] **Step 4: Verify + commit**

Serve locally (`python3 -m http.server 8742`), set palette=clay + theme=dark on `examples/dashboard.html`, reload: no indigo/light flash (check with devtools network throttling "Slow 3G").

```bash
git add index.html preview.html variants/compare.html examples/*.html examples/demo.js
git commit -m "fix(theme): unify inkwell-theme storage key; apply theme+palette before first paint"
```

---

### Task 8: Docs pass

**Files:**
- Modify: `README.md`, `DESIGN_SYSTEM.md`, `TAILWIND.md`, `agent-instructions.md`, `CHANGELOG.md`, `BACKLOG.md`, `examples/docs.html`

- [ ] **Step 1: `examples/docs.html` — fix the side-stripe teaching example (§06 "Extend", ~line 228)**

In the `.notice` code sample, replace `border-left: 4px solid var(--accent);` with `border-color: var(--accent);` so the docs stop teaching the pattern 2.1.0 removed. The surrounding prose needs no change.

- [ ] **Step 2: `CHANGELOG.md` — add the 2.1.0 entry under `## [Unreleased]`**

```markdown
## [2.1.0] — 2026-06-11

### Added
- **`--accent-ink` / `--on-accent` tokens.** The accent now has two jobs with two tokens: ink (links, selected tabs, badge text, the global focus outline) and fill (button backgrounds, with `--on-accent` as the label color). Canonical indigo is dark enough for both, so it defaults `--accent-ink: var(--accent)` and `--on-accent: var(--paper)` — zero visual change. Variants whose accent is too light to read now override the ink: clay `#A04E2C`, sage `#3A7456`. Clay's light mode also flips `--on-accent` to slate and its hover to a *lighter* coral (`--accent-d: #E08B6E`) — white-on-coral measured 3.12:1.
- **`--olive-dark`** (`#566740` light / `#9CB07A` dark) — olive as text, mirroring the existing `--warning-dark` pattern. `.badge-success` (was 3.10:1), `.stat-delta.up` (3.68:1) and `.pill.resolved` (3.68:1) now clear WCAG AA.
- **`--gray-400` + `--control-border`.** Checkbox/radio borders and the switch off-track were 1.56:1 — below WCAG 1.4.11's 3:1 for functional boundaries. New neutral step (3.2:1+ on both surfaces) carries them; decorative panel hairlines stay `--gray-300`.
- **`--info-tint` / `--info-strong-border`.** `.alert.is-info` no longer borrows the accent tint; `--info` finally has a job.
- **Button states**: `:disabled`, `:active`, `.btn-sm`, and an `aria-busy="true"` spinner (reduced-motion-safe).
- **`.sr-only` and `.skip-link`** accessibility utilities.
- **`.navbar` / `.navbar-inner` / `.field-row` / `.card-grid` / `.tbl-scroll`** promoted into the component layer (every consumer was rebuilding the navbar from `index.html`).
- **`scripts/check-contrast.mjs`** — zero-dependency WCAG gate asserting ~190 token-pair ratios across 4 palettes x 2 modes; wired into CI next to the tokens.json drift check.
- Print stylesheet, `::selection` tint, `text-wrap: balance/pretty` on headings and ledes.

### Changed
- **`.stat-card.is-primary`** drops the 4px accent left stripe for a 1.5px full accent border.
- **`--warning-dark`** light value `#A06A2A` → `#85561E` (3.95:1 → 5.41:1 on its tint).
- **`.tbl thead th`** text `--gray-500` → `--gray-700` (was 4.26:1 on the header fill).
- **Dark-mode hover now lifts.** Dark `--accent-d` `#6273C0` → `#8B9ADB` (button labels on the old hover read 3.90:1) and dark `--accent-tint` alpha 0.18 → 0.10 (badge-accent text read 4.07:1).
- **Variant grays**: clay/sage/burgundy `--gray-500` darkened to clear 4.5:1 on their surfaces (the BACKLOG "variant gray-500" item, option a).
- **Dark `.select` chevron** now matches each variant's own gray (was canonical-only — BACKLOG item).
- **Theme toggle storage key** unified on `inkwell-theme` (was `theme-preview` on `index.html`/`preview.html`); saved theme and palette now apply via a `<head>` pre-paint snippet — no flash.
- `html { scroll-behavior: smooth }` now respects `prefers-reduced-motion`.

### Migration
- If you styled against `.stat-card.is-primary`'s left stripe, the marker is now `border-color: var(--accent)` on the full frame.
- `.alert.is-info` is now steel-blue (`--info`), not indigo. If you wanted the accent look, use `.alert` with a custom tint.
- The global focus outline follows `--accent-ink`; in clay/sage it is now a darker, AA-passing shade.
```

- [ ] **Step 3: `BACKLOG.md`**

Delete the two resolved sections ("Variant `--gray-500` contrast under WCAG AA" and "`.select` chevron stroke leaks…"). Add under `## Audit follow-ups`:

```markdown
### 3.0: collapse the dark cascade with `light-dark()` + derive tints with `color-mix()`

Deferred from the 2.1.0 contrast release (2026-06-11 review). Every token's dark value is declared twice (media query + `[data-theme]` block) and four times across a variant pair; CSS `light-dark()` plus `color-scheme` flipping on `[data-theme]` collapses each token to a single declaration and makes the build-script parity check unnecessary. `color-mix(in srgb, var(--accent) 14%, transparent)` would likewise derive every `*-tint`/`*-ring`/`*-border`, shrinking variant files to ~8 lines. Breaking (drops pre-mid-2024 browsers; rewrites `scripts/build-tokens-json.mjs` and `tokens-check.yml`): needs its own design pass and a major version.
```

- [ ] **Step 4: `DESIGN_SYSTEM.md`**

1. §1.1 color table — add rows (after `--accent-strong-border`):
```markdown
| `--accent-ink` | `var(--accent)` | `var(--accent)` | Accent as **text**: links, tabs, badge text, focus ring. Variants override when their accent is too light to read |
| `--on-accent` | `var(--paper)` | `var(--paper)` | Label color on accent fills (clay light overrides to slate) |
| `--olive-dark` | `#566740` | `#9CB07A` | Olive as text/solid fill — badge-success, stat-delta.up, pill.resolved |
| `--info-tint` | `rgba(92,124,163,0.16)` | `rgba(124,159,210,0.18)` | `.alert.is-info` background |
| `--gray-400` | `#88888E` | `#666874` | Control boundaries via `--control-border` (WCAG 1.4.11) |
```
   And in the neutral rows note `--warning-dark`'s new light value `#85561E`.
2. §1.5 borders — add: `--control-border` (1.5px `--gray-400`) for checkbox/radio/switch: functional state boundaries must clear 3:1, unlike decorative panel hairlines.
3. §3 component table — add rows for `.navbar`, `.field-row`, `.card-grid`, `.tbl-scroll`, `.sr-only`, `.skip-link`, and extend the `.btn` row with `:disabled / :active / .btn-sm / aria-busy`. Update the `.stat-card` row: "`.is-primary` marks the headline metric with a full 1.5px accent border".
4. §3 `.sec-head` row — append: "Use the numbered index only when the sequence carries meaning (steps, ordered specs); as default scaffolding on every section it reads as generated filler."
5. §5 accessibility — update the focus-ring sentence to `--accent-ink`; add a bullet for control borders (1.56:1 → 3:1+ rationale); note all four palettes pass `scripts/check-contrast.mjs` in both modes.

- [ ] **Step 5: `README.md`**

1. In Quick start after the install paragraph add: "Prefer zero `@import` hops? Link `inkwell-tokens.css` then `inkwell-components.css` directly — same result, two fewer serialized requests."
2. "What's in the box": add `scripts/check-contrast.mjs` bullet next to the tokens.json bullet.
3. Design principles: append to the borders bullet: "Functional control boundaries (checkbox, radio, switch) use `--control-border` at ≥3:1."

- [ ] **Step 6: `TAILWIND.md` + `agent-instructions.md`**

TAILWIND.md: in the utilities list sentence (line ~30), extend with `text-accent-ink`, `bg-olive-dark`, `border-gray-400`, `bg-info-tint`. Add one paragraph under the variants section: "Variants also override `--accent-ink`/`--on-accent` where needed — utilities like `text-accent-ink` stay AA in every palette."

agent-instructions.md: §4 token cheat sheet — add `--accent-ink` ("use for accent-colored TEXT; `--accent` is for fills"), `--on-accent`, `--olive-dark`, `--control-border`. §5 component list — add `.navbar`, `.field-row`, `.card-grid`, `.tbl-scroll`, `.sr-only`, `.skip-link`, btn states. §3 hard rules — add: "Accent as text → `--accent-ink`; accent as fill → `--accent` + `--on-accent` label. Never put `--accent` text on a tinted surface in a variant."

- [ ] **Step 7: Commit**

```bash
git add README.md DESIGN_SYSTEM.md TAILWIND.md agent-instructions.md CHANGELOG.md BACKLOG.md examples/docs.html
git commit -m "docs: 2.1.0 token/component additions, changelog, backlog 3.0 item, sec-head guidance"
```

---

### Task 9: CI wiring, examples mirror, final verification

**Files:**
- Modify: `.github/workflows/tokens-check.yml`, `.github/workflows/pages.yml`
- Sync: `examples/` mirror

- [ ] **Step 1: Extend `tokens-check.yml`**

Rename the workflow's display name and add the contrast step + variant paths. Full new file:

```yaml
name: tokens.json drift + contrast check

on:
  pull_request:
    paths:
      - 'inkwell-tokens.css'
      - 'tokens.json'
      - 'variants/*.css'
      - 'scripts/build-tokens-json.mjs'
      - 'scripts/check-contrast.mjs'
      - '.github/workflows/tokens-check.yml'
  push:
    branches: [main]
    paths:
      - 'inkwell-tokens.css'
      - 'tokens.json'
      - 'variants/*.css'
      - 'scripts/build-tokens-json.mjs'
      - 'scripts/check-contrast.mjs'
      - '.github/workflows/tokens-check.yml'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v5
        with:
          node-version: '20'
      - name: Verify tokens.json is up to date
        run: node scripts/build-tokens-json.mjs --check
      - name: Verify WCAG contrast across palettes
        run: node scripts/check-contrast.mjs
```

- [ ] **Step 2: Mirror sources into examples/ (per CLAUDE.md)**

```bash
cp tokens.css inkwell.css inkwell-tokens.css inkwell-components.css inkwell-theme.css examples/
cp preview.html examples/
mkdir -p examples/variants
cp variants/clay.css variants/sage.css variants/burgundy.css variants/compare.html examples/variants/
```

- [ ] **Step 3: Full gate run**

```bash
node scripts/check-contrast.mjs          # all pairs pass
node scripts/build-tokens-json.mjs --check  # up to date
grep -n '#[0-9A-Fa-f]\{3,6\}' inkwell-components.css | grep -v 'svg+xml'  # no output
```

- [ ] **Step 4: Browser verification**

`python3 -m http.server 8742` then check, in Chrome:
1. `preview.html` light: badges/stat-deltas read clearly; `.stat-card.is-primary` shows full accent frame; info alert reads steel-blue; `::selection` visible when selecting text (if invisible, switch to `var(--oat)` and re-mirror).
2. `preview.html` dark (toggle): no regressions.
3. `preview.html?palette=clay` light: buttons show dark-on-coral labels, links readable, hover lightens.
4. `examples/dashboard.html?palette=clay` + saved dark theme, hard reload: no flash.
5. `index.html`: navbar identical to pre-promotion.

- [ ] **Step 5: Commit + push + PR**

```bash
git add .github/workflows/tokens-check.yml examples/
git commit -m "ci(contrast): run check-contrast.mjs in CI; sync examples mirror"
git push -u origin inkwell-2.1.0
gh pr create --title "Inkwell 2.1.0 — the contrast release" --body "$(cat <<'EOF'
Implements docs/specs/2026-06-11-contrast-release-design.md: accent ink/fill split, WCAG AA fixes for all four palettes, button states, a11y utilities, navbar/field-row/card-grid promotions, pre-paint theme/palette, CI contrast gate.
EOF
)"
```
