# Inkwell 3.0.0 — Architecture Release — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the Pattern B dark cascade with `light-dark()`, derive alpha tints with `color-mix()`, layer components for the pure-CSS path, flatten the shim chain — with zero visual change, gated by resolved-value parity.

**Architecture:** Every color token becomes a single declaration; mode switching moves to `color-scheme` flipping. Layer assignment happens in the entry file (`inkwell.css`), so `inkwell-components.css` is untouched. Scripts learn to resolve `light-dark()`/`color-mix()`; `tokens.json` schema and the 192-pair contrast gate are unchanged.

**Tech Stack:** Pure CSS (no build), Node 18+ zero-dependency scripts. Spec: `docs/specs/2026-06-12-v3-architecture-design.md`.

**File map:**
- Modify: `inkwell-tokens.css` (full rewrite of the cascade; non-color sections unchanged)
- Modify: `variants/clay.css`, `variants/sage.css`, `variants/burgundy.css` (full rewrite)
- Modify: `inkwell.css`, `tokens.css` (entry/shim flip)
- Modify: `scripts/check-contrast.mjs`, `scripts/build-tokens-json.mjs` (parser/resolver)
- Regenerate: `tokens.json`
- Modify (docs): `CHANGELOG.md`, `DESIGN_SYSTEM.md`, `README.md`, `TAILWIND.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `AGENTS.md`, `agent-instructions.md`, `BACKLOG.md`
- Sync: `examples/` mirror per CLAUDE.md
- Untouched: `inkwell-components.css` (except version banner), `inkwell-theme.css` (except version banner + stale-comment check)
- Throwaway (not committed): `/tmp/inkwell-snap-2x.mjs`, `/tmp/inkwell-snap-3x.mjs`

---

### Task 0: Tag the last 2.x, branch, commit spec + plan

- [ ] **Step 0.1:** `git tag v2.1.0 main` (annotates the last pre-breaking commit; push happens in Task 10)
- [ ] **Step 0.2:** `git checkout -b inkwell-3.0.0`
- [ ] **Step 0.3:** `git add docs/specs/2026-06-12-v3-architecture-design.md docs/plans/2026-06-12-v3-architecture.md && git commit -m "docs(3.0): architecture-release spec + implementation plan"`

### Task 1: Snapshot 2.1.0 resolved values (parity baseline)

Write `/tmp/inkwell-snap-2x.mjs` — parses the CURRENT (pre-rewrite) CSS with the existing three-block strategy and dumps every resolvable color token, composited to opaque RGB, for 4 palettes × 2 modes.

- [ ] **Step 1.1:** Write `/tmp/inkwell-snap-2x.mjs`:

```js
// Snapshot resolved colors from the 2.1.0-era CSS (three-block cascade).
import { readFileSync, writeFileSync } from "node:fs";
const ROOT = "/Users/vinnycarpenter/Projects/Inkwell";
const strip = (c) => c.replace(/\/\*[\s\S]*?\*\//g, "");
function decls(block) {
  const out = new Map(); let m;
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+?)\s*;/gi;
  while ((m = re.exec(block))) out.set(m[1], m[2].replace(/\s+/g, " ").trim());
  return out;
}
function block(css, opener) {
  const s = css.indexOf(opener); if (s === -1) return null;
  const o = css.indexOf("{", s + opener.length);
  let d = 1, i = o + 1;
  while (i < css.length && d > 0) { if (css[i] === "{") d++; else if (css[i] === "}") d--; i++; }
  return css.slice(o + 1, i - 1);
}
function lightAndDark(file) {
  const css = strip(readFileSync(`${ROOT}/${file}`, "utf8"));
  return { light: decls(block(css, ":root") ?? ""), dark: decls(block(css, ':root[data-theme="dark"]') ?? "") };
}
function srgb(hex) { const h = hex.slice(1); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
function resolve(name, vars, depth = 0) {
  if (depth > 8) throw new Error(`loop ${name}`);
  const raw = vars.get(name); if (raw === undefined) throw new Error(`undef ${name}`);
  const ref = raw.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (ref) return resolve(ref[1], vars, depth + 1);
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return srgb(raw);
  const m = raw.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  if (m) { const a = +m[4], bg = resolve("--paper", vars, depth + 1);
    return [1, 2, 3].map((i) => Math.round(+m[i] * a + bg[i - 1] * (1 - a))); }
  throw new Error("skip");
}
const canonical = lightAndDark("inkwell-tokens.css");
const variants = { clay: "variants/clay.css", sage: "variants/sage.css", burgundy: "variants/burgundy.css" };
const snap = {};
for (const p of ["indigo", "clay", "sage", "burgundy"]) {
  const v = p === "indigo" ? null : lightAndDark(variants[p]);
  for (const mode of ["light", "dark"]) {
    const vars = new Map(canonical.light);
    if (v) for (const [k, x] of v.light) vars.set(k, x);
    if (mode === "dark") { for (const [k, x] of canonical.dark) vars.set(k, x);
      if (v) for (const [k, x] of v.dark) vars.set(k, x); }
    for (const k of [...vars.keys()].sort()) {
      try { snap[`${p}/${mode}/${k}`] = resolve(k, vars).join(","); } catch { /* non-color */ }
    }
  }
}
writeFileSync("/tmp/inkwell-snap-2x.json", JSON.stringify(snap, null, 1));
console.log(`snapshotted ${Object.keys(snap).length} entries`);
```

- [ ] **Step 1.2:** Run `node /tmp/inkwell-snap-2x.mjs` BEFORE touching any CSS. Expected: `snapshotted ~328 entries` (41 color tokens × 8 contexts).

### Task 2: Rewrite `inkwell-tokens.css`

Sections that do not change: typography, type scale, spacing, radius, border shorthands, motion, layout, z-index (they hold no mode-dependent colors — borders reference `var(--gray-*)` which now resolve per mode). Everything below `:root`'s color tokens changes shape.

- [ ] **Step 2.1:** Rewrite the file. Token conversion table (light → dark; D = derived via `color-mix`):

| Token | 3.0 declaration |
|---|---|
| `--ivory` | `light-dark(#F4F4F0, #0F1018)` |
| `--paper` | `light-dark(#FFFFFF, #181A24)` |
| `--slate` | `light-dark(#13141B, #E8E8EE)` |
| `--oat` | `light-dark(#DDDCDF, #2B2D38)` |
| `--accent` | `light-dark(#3B4A8C, #7A8AD1)` |
| `--accent-d` | `light-dark(#2A3768, #8B9ADB)` |
| `--accent-tint` D | `light-dark(color-mix(in srgb, var(--accent) 14%, transparent), color-mix(in srgb, var(--accent) 10%, transparent))` |
| `--accent-focus-ring` D | alphas 18% / 28% |
| `--accent-strong-border` D | alphas 50% / 60% |
| `--accent-ink` | `var(--accent)` (unchanged, both modes) |
| `--on-accent` | `var(--paper)` (unchanged, both modes) |
| `--olive` | `light-dark(#788C5D, #9CB07A)` |
| `--olive-tint` D | alphas 16% / 18% (base `--olive`) |
| `--olive-strong-border` D | alphas 45% / 60% |
| `--olive-dark` | `light-dark(#566740, #9CB07A)` |
| `--rust` | `light-dark(#B04A3F, #D27468)` |
| `--rust-d` | `light-dark(#9A3F3F, #C96B5F)` |
| `--rust-tint` D | alphas 10% / 18% (base `--rust`) |
| `--rust-tint-border` D | alphas 45% / 60% |
| `--rust-focus-ring` D | alphas 18% / 28% |
| `--warning` | `light-dark(#C78E3F, #D9A55F)` |
| `--warning-dark` | `light-dark(#85561E, #D9A55F)` |
| `--warning-tint` D | alphas 16% / 18% (base `--warning`) |
| `--warning-strong-border` D | alphas 45% / 60% |
| `--info` | `light-dark(#5C7CA3, #7C9FD2)` |
| `--sky` | `light-dark(#6A8CAF, #85A6CB)` |
| `--info-tint` D | alphas 16% / 18% (base `--info`) |
| `--info-strong-border` D | alphas 45% / 60% |
| `--gray-100..700` | literal `light-dark()` pairs from the two existing blocks |
| `--shadow-sm/md/lg/card-hover` | `light-dark()` in the color position, e.g. `0 1px 2px light-dark(rgba(20, 20, 19, 0.06), rgba(0, 0, 0, 0.45))` |
| `--backdrop` | `light-dark(rgba(15, 16, 24, 0.55), rgba(0, 0, 0, 0.6))` |
| `--tldr-code-tint` | `light-dark(rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.08))` |

Mode machinery replaces both dark blocks (keep the chevron rules — they are the documented Pattern B residue):

```css
/* :root keeps `color-scheme: light dark` (already present) */
:root[data-theme="light"] { color-scheme: light; }
@media screen { :root[data-theme="dark"] { color-scheme: dark; } }
@media print { :root { color-scheme: light; } }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .select { background-image: url("…existing dark chevron URI…"); }
}
@media screen {
  :root[data-theme="dark"] .select { background-image: url("…existing dark chevron URI…"); }
}
```

Update the header comment (Version: 3.0.0; Pattern B description → `color-scheme` + `light-dark()`; note the chevron residue). Preserve the per-token rationale comments (hover-lightens, alpha-tuning history) on the single declarations.

- [ ] **Step 2.2:** Sanity-grep: `grep -c "light-dark(" inkwell-tokens.css` → expect ≥ 30; `grep -c "prefers-color-scheme" inkwell-tokens.css` → expect 1 (chevron only).

### Task 3: Rewrite the three variant files

Alpha audit (vs canonical): all three variants match canonical's LIGHT alphas (14/18/50). Dark: clay + sage tint = 18% (canonical 10%) → they redeclare `--accent-tint`; ring/border match canonical → inherited. Burgundy matches canonical's dark alphas entirely → inherits ALL derived tints.

- [ ] **Step 3.1:** `variants/clay.css` — single `:root` block: surfaces (`--ivory: light-dark(#FAF9F5, #14130E)`, `--paper: light-dark(#FFFFFF, #1F1D17)`, `--slate: light-dark(#141413, #F4F2EA)`, `--oat: light-dark(#E3DACC, #3F3A2D)`); accent (`--accent: light-dark(#D97757, #E08B6E)`, `--accent-d: light-dark(#E08B6E, #C97557)`, `--accent-tint: light-dark(color-mix(in srgb, var(--accent) 14%, transparent), color-mix(in srgb, var(--accent) 18%, transparent))`, `--accent-ink: light-dark(#A04E2C, #E08B6E)`, `--on-accent: light-dark(var(--slate), var(--paper))`); grays (`--gray-100: light-dark(#F0EEE6, #26241D)` … `--gray-700: light-dark(#3D3D3A, #C4BFB2)`, `--gray-400: light-dark(#8F8D82, #716D60)`, `--gray-500: light-dark(#6E6D62, #9C988D)`, `--gray-200: light-dark(#E6E3DA, #2E2C24)`, `--gray-300: light-dark(#D1CFC5, #3A3730)`). Keep the two chevron rules (stroke `%239C988D`) and the 2.1.0 rationale comments.
- [ ] **Step 3.2:** `variants/sage.css` — same shape: surfaces (`#F6F4EE/#13140F`, paper `#FFFFFF/#1B1D17`, slate `#181816/#E8E8E0`, oat `#DDD9CE/#363932`); `--accent: light-dark(#3F7C5C, #6FA585)`, `--accent-d: light-dark(#2D5E44, #7FB294)`, `--accent-tint` redeclared (14%/18%), `--accent-ink: light-dark(#3A7456, #6FA585)`; no `--on-accent` override; grays (`#EBE9E1/#22241E`, `#DFDCD2/#2A2C26`, `#CDCAC0/#373A33`, `#8C8A80/#6E6F63`, `#6B6962/#9A9A91`, `#3A3A36/#BFBFB6`). Chevron stroke `%239A9A91`.
- [ ] **Step 3.3:** `variants/burgundy.css` — surfaces (`#F8F5EF/#171312`, paper `#FFFFFF/#221C1B`, slate `#1B1614/#F0E8E2`, oat `#E5DBC9/#3D332B`); `--accent: light-dark(#8B3A3A, #C56A6A)`, `--accent-d: light-dark(#6F2C2C, #D57E7E)`, `--accent-ink: light-dark(var(--accent), #D07878)`; NO tint redeclarations (inherits canonical's derived 14%/10%, 18%/28%, 50%/60%); grays (`#EFEAE0/#2A2421`, `#E2DBCE/#322B27`, `#D2C9BA/#403733`, `#8E8779/#746A62`, `#6F6A5F/#9C928A`, `#403B33/#C5BAB1`). Chevron stroke `%239C928A`.
- [ ] **Step 3.4:** Commit: `git add inkwell-tokens.css variants/ && git commit -m "feat(tokens): collapse dark cascade with light-dark(), derive tints with color-mix()"`

(continued in Task 4+)

### Task 4: Flatten the shim chain + layer the components

- [ ] **Step 4.1:** Rewrite `inkwell.css` (full content):

```css
/* =====================================================================
   Inkwell — design system entry.
   Version: 3.0.0
   Default palette: Indigo & Cloud (cool stone + deep indigo).

   Link this file from <head>:
       <link rel="stylesheet" href="inkwell.css">

   Tokens stay unlayered so custom properties resolve everywhere.
   Components import into @layer inkwell, so YOUR unlayered CSS always
   overrides Inkwell components without specificity fights. If you load
   a second reset (normalize etc.), import it into a lower layer or
   drop it — Inkwell ships its own.

   Tailwind v4 consumers: use inkwell-theme.css instead (it assigns
   its own layer). Legacy consumers of tokens.css: that file is now a
   deprecated alias of this one (removal slated for 4.0).
   ===================================================================== */

@import url('inkwell-tokens.css');
@import url('inkwell-components.css') layer(inkwell);
```

- [ ] **Step 4.2:** Rewrite `tokens.css` (full content):

```css
/* =====================================================================
   Inkwell — DEPRECATED legacy alias.
   Version: 3.0.0

   This filename is kept so pre-3.0 consumers who linked tokens.css
   keep working. It is now a one-line alias of inkwell.css — link that
   instead. Scheduled for removal in 4.0.
   ===================================================================== */

@import url('inkwell.css');
```

- [ ] **Step 4.3:** Commit: `git add inkwell.css tokens.css && git commit -m "feat(entry): layer components for the pure-CSS path; flatten shim chain"`

### Task 5: Rewrite `scripts/check-contrast.mjs` parsing/resolution

- [ ] **Step 5.1:** Replace `lightAndDark()` with a single-block reader, add the splitter + color-mix branch, thread `mode` through `resolveColor`. Changed code (rest of file — color math, CHECKS table, loop — unchanged except the loop passes `mode`):

```js
function rootVars(file) {
  const css = stripComments(readFileSync(resolve(ROOT, file), "utf8"));
  return parseDeclarations(extractBlock(css, ":root") ?? "");
}

// Replace every light-dark(A, B) in a value with the branch for `mode`.
// Balanced-paren aware: A/B may contain color-mix(...) with nested commas.
function pickMode(value, mode) {
  let out = value;
  for (;;) {
    const idx = out.indexOf("light-dark(");
    if (idx === -1) return out;
    let depth = 1, i = idx + 11, comma = -1;
    for (; i < out.length && depth > 0; i++) {
      const ch = out[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "," && depth === 1 && comma === -1) comma = i;
    }
    const branch = mode === "dark" ? out.slice(comma + 1, i - 1) : out.slice(idx + 11, comma);
    out = out.slice(0, idx) + branch.trim() + out.slice(i);
  }
}

function resolveColor(name, vars, mode, depth = 0) {
  if (depth > 8) throw new Error(`var() loop at ${name}`);
  let raw = vars.get(name);
  if (raw === undefined) throw new Error(`undefined token: ${name}`);
  raw = pickMode(raw, mode);
  const ref = raw.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (ref) return resolveColor(ref[1], vars, mode, depth + 1);
  if (raw.startsWith("#")) return srgb(raw);
  if (raw.startsWith("rgba(")) return composite(raw, resolveColor("--paper", vars, mode, depth + 1));
  const mix = raw.match(/^color-mix\(in srgb,\s*var\((--[a-z0-9-]+)\)\s+([\d.]+)%\s*,\s*transparent\)$/i);
  if (mix) {
    const base = resolveColor(mix[1], vars, mode, depth + 1);
    const a = Number(mix[2]) / 100;
    const bg = resolveColor("--paper", vars, mode, depth + 1);
    return [0, 1, 2].map((i) => Math.round(base[i] * a + bg[i] * (1 - a)));
  }
  throw new Error(`unparseable color for ${name}: ${raw}`);
}

const canonical = rootVars("inkwell-tokens.css");
function varsFor(palette) {
  const out = new Map(canonical);
  if (palette !== "indigo")
    for (const [k, v] of rootVars(variantFiles[palette])) out.set(k, v);
  return out;
}
```

In the main loop: `const vars = varsFor(palette);` and `ratio(resolveColor(fg, vars, mode), resolveColor(bg, vars, mode))`.

- [ ] **Step 5.2:** Run `node scripts/check-contrast.mjs`. Expected: `contrast check: all 192 pairs pass`. Any failure = a transcription bug in Task 2/3 — fix the CSS, not the threshold.

### Task 6: Rewrite `scripts/build-tokens-json.mjs` parsing

- [ ] **Step 6.1:** Replace `parseSource()` and the dark-map machinery. `assertMapsEqual` is deleted. New code:

```js
function parseSource() {
  const raw = readFileSync(SOURCE_CSS, "utf8");
  const css = stripComments(raw);
  const vars = parseDeclarations(extractBlock(css, ":root"));
  const versionMatch = raw.match(/Version:\s*([\d.]+)/);
  if (!versionMatch) throw new Error("could not find `Version: X.Y.Z` in inkwell-tokens.css header");
  return { vars, version: versionMatch[1] };
}

// pickMode(): same function as scripts/check-contrast.mjs (textual light-dark splitter)

// Resolve color-mix(in srgb, var(--x) P%, transparent) to an rgba() string
// so external tooling (Style Dictionary, Figma) gets concrete values.
function resolveMixes(value, vars, mode) {
  return value.replace(
    /color-mix\(in srgb,\s*var\((--[a-z0-9-]+)\)\s+([\d.]+)%\s*,\s*transparent\)/gi,
    (_, name, pct) => {
      const base = pickMode(vars.get(name) ?? "", mode).trim();
      const m = base.match(/^#([0-9a-fA-F]{6})$/);
      if (!m) throw new Error(`color-mix base ${name} did not resolve to hex: ${base}`);
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
      return `rgba(${r}, ${g}, ${b}, ${Number(pct) / 100})`;
    });
}

function valueFor(vars, cssVar, mode) {
  if (!vars.has(cssVar)) throw new Error(`missing in :root: ${cssVar}`);
  return resolveMixes(pickMode(vars.get(cssVar), mode), vars, mode);
}
```

In `buildJson`: `light = (v) => { consumed.add(v); return valueFor(vars, v, "light"); }`, `dark = (v) => valueFor(vars, v, "dark")`; the `darkOnly` check is deleted; the orphan warning keys off the single `vars` map; `_meta.note` becomes: `"Generated by scripts/build-tokens-json.mjs from inkwell-tokens.css. Do not edit by hand — re-run the script when CSS tokens change. Values are resolved from the single-declaration light-dark()/color-mix() cascade."`

- [ ] **Step 6.2:** `node scripts/build-tokens-json.mjs` then `node scripts/build-tokens-json.mjs --check` → `tokens.json is up to date`. Diff review: only formatting normalizations (e.g. `0.10` → `0.1`) and the `_meta` note/version may differ from 2.1.0.
- [ ] **Step 6.3:** Commit: `git add scripts/ tokens.json && git commit -m "chore(scripts): resolve light-dark()/color-mix() in tokens.json builder and contrast gate"`

### Task 7: Resolved-value parity gate

- [ ] **Step 7.1:** Write `/tmp/inkwell-snap-3x.mjs`: copy of `/tmp/inkwell-snap-2x.mjs` with (a) `lightAndDark` → single `:root` reader, (b) `resolve` gaining `mode` + `pickMode` + the color-mix branch (same code as Task 5), (c) overlay = canonical + variant only, (d) output `/tmp/inkwell-snap-3x.json`.
- [ ] **Step 7.2:** `node /tmp/inkwell-snap-3x.mjs && diff /tmp/inkwell-snap-2x.json /tmp/inkwell-snap-3x.json`. Expected: **empty diff** (identical entry count, identical RGB triples). Any difference is a value-transcription bug — fix the CSS.

### Task 8: Browser verification

- [ ] **Step 8.1:** Open `preview.html` (root) in Chrome. Verify: ivory background (not white), 1.5px borders, theme toggle cycles auto/light/dark, dark mode lifts the accent.
- [ ] **Step 8.2:** Open `variants/compare.html`. Verify all four palettes render distinctly in both modes; select chevron visible in dark.
- [ ] **Step 8.3:** Print-preview `preview.html` with theme forced dark → must render the light palette.
- [ ] **Step 8.4:** Console check: no CSS parse errors, no 404s.

### Task 9: Docs, changelog, version banners

- [ ] **Step 9.1:** `CHANGELOG.md` — add `## [3.0.0] — 2026-06-12` under `[Unreleased]` with Added (layered pure-CSS path, derived tints), Changed (single-declaration cascade, three-file install, scripts), Deprecated (`tokens.css`), and a **Migration** section: browser floor (Chrome/Edge 123, Firefox 120, Safari 17.5); the reset/layering note (unlayered consumer CSS now always wins — drop second resets or layer them); `tokens.css` → `inkwell.css`; pin 2.1.0 via the new `v2.1.0` tag if you must support older browsers.
- [ ] **Step 9.2:** `DESIGN_SYSTEM.md` — §2 Dark mode: rewrite around `color-scheme` + `light-dark()`; document the derive-vs-declare rule ("derive by default; declare explicitly where the contrast gate forced a different value"); §7 project structure: tokens.css line → "deprecated alias of inkwell.css"; inkwell.css line → "canonical entry — link this".
- [ ] **Step 9.3:** `README.md:19` (four-file install sentence → three files + optional deprecated shim), `:63-64` (shim descriptions), `:34` (Tailwind aside mentioning the shims).
- [ ] **Step 9.4:** `CONTRIBUTING.md:16-17` (shim descriptions flip), dark-cascade editing guidance if present.
- [ ] **Step 9.5:** `CLAUDE.md` — file-structure block (tokens.css/inkwell.css roles swap; dark-cascade editing rule now "one light-dark() declaration per token"); the "After editing the source CSS" cp list is unchanged (all five files still exist).
- [ ] **Step 9.6:** `AGENTS.md` — structure paragraph (aggregator description, parity-check sentence).
- [ ] **Step 9.7:** `agent-instructions.md` — Targets line → 3.0.0; §2 install table → three files (`inkwell.css`, `inkwell-tokens.css`, `inkwell-components.css`) + note that `tokens.css` is a deprecated alias; fetch commands; §7 dark-mode description; import-chain sentence at line ~35.
- [ ] **Step 9.8:** `TAILWIND.md:21,202` — shim mentions; §"Pattern B" description (~line 84) updated to color-scheme/light-dark.
- [ ] **Step 9.9:** `BACKLOG.md` — delete the shipped 3.0 item; fix the dead `Audit.md` reference in the intro; annotate the select-chevron item as the only remaining Pattern B residue.
- [ ] **Step 9.10:** Version banners → 3.0.0 in `inkwell-tokens.css`, `inkwell-components.css`, `inkwell-theme.css` (plus check its stale "Pattern B" header comment), `inkwell.css`, `tokens.css` (already set in Task 4).
- [ ] **Step 9.11:** Commit: `git add -A && git commit -m "docs(release): 3.0.0 changelog + migration, cascade docs, version banners, backlog grooming"`

### Task 10: Examples sync, final gates, PR

- [ ] **Step 10.1:** Mirror per CLAUDE.md: `cp tokens.css inkwell.css inkwell-tokens.css inkwell-components.css inkwell-theme.css examples/ && cp preview.html examples/ && cp variants/clay.css variants/sage.css variants/burgundy.css variants/compare.html examples/variants/`
- [ ] **Step 10.2:** Re-run both gates: `node scripts/check-contrast.mjs` (192 pass) and `node scripts/build-tokens-json.mjs --check` (up to date).
- [ ] **Step 10.3:** Commit sync: `git add examples/ && git commit -m "chore(examples): sync 3.0.0 CSS mirror"`
- [ ] **Step 10.4:** `git push -u origin inkwell-3.0.0 && git push origin v2.1.0`
- [ ] **Step 10.5:** `gh pr create` — title `Inkwell 3.0.0 — the architecture release`; body summarizes spec decisions 1–8, the four verification gates and their results, and notes `v3.0.0` gets tagged after merge.

### Self-review checklist (run after writing, before executing)

- Spec coverage: decisions 1–8 map to Tasks 2/3 (1–3), 4 (4–5), 5/6 (6), 0/10 (7–8). ✓
- No placeholders: chevron URIs marked "existing" are verbatim in the current files (Task 2 keeps them unchanged) — transcribe, don't invent. ✓
- Type consistency: `pickMode(value, mode)` is the same function name/signature in Tasks 5, 6, 7. `resolveColor(name, vars, mode, depth)` consistent. ✓
