# Inkwell 2.0 — Palette Switching on Example Pages

**Status:** Design approved · ready for implementation plan
**Date:** 2026-05-15
**Replaces:** BACKLOG item *"Explore palette-swapping on the example pages"*
**Side-effect resolves:** BACKLOG item *"Editorial primitives in `variants/`"*

## Summary

Make Inkwell's four palettes — **Indigo & Cloud**, **Clay**, **Sage & Stone**, **Burgundy & Bone** — work across all 14 `examples/*.html` pages and `preview.html` via a URL-driven toggle. The change requires retiring the "two universes" rule documented in `CLAUDE.md` and `CONTRIBUTING.md`: variants become first-class consumers of `inkwell-tokens.css` + `inkwell-components.css`, distinguished only by brand-layer token overrides. Ships as Inkwell **2.0.0** with a Migration section in CHANGELOG.

## Decisions

The five BACKLOG questions, settled:

| # | Question | Decision |
|---|---|---|
| Q5 | Retire the two-universes rule? | **Yes.** Variants extend canonical. |
| Q4 | `--accent` / `--clay` collision? | **Dissolved by Q5.** Variants use `--accent`. |
| Q1 | Toggle vs. matrix? | **Toggle + `?palette=` query string.** No file matrix. |
| Q2 | localStorage persistence? | **Yes**, mirroring the existing theme toggle. |
| Q3 | `demo.js` (every example) or playground only? | **`demo.js`**, applied to every example + `preview.html`. |

Plus one new decision raised during design:

| Q-version | How do we version this? | **2.0.0** — honor the CHANGELOG's stated semver rule. |

---

## Architecture — one token layer, four palettes

The "two universes" rule (canonical `--accent` vs. legacy `--clay`) is retired. After this change:

- `inkwell-tokens.css` + `inkwell-components.css` are the **single source of truth** for tokens and components.
- `variants/{clay,sage,burgundy}.css` are **palette-only override files** (~70 lines each) that redefine brand-layer tokens for both `:root` (light) and `:root:not([data-theme="light"])` (dark).
- Variants are loaded **after** `inkwell.css` and cascade-override its `--accent`, `--ivory`, `--slate`, `--oat`, and neutral-scale values.
- The "indigo" palette is the canonical default — `inkwell-tokens.css` itself. No separate stylesheet needed.

### File changes in `variants/`

| Today | After 2.0 |
|---|---|
| `tokens-clay.css` (526 lines, full system, `--clay`) | `clay.css` (~70 lines, palette overrides, `--accent`) |
| `tokens-sage.css` (106 lines) | `sage.css` (~70 lines) |
| `tokens-burgundy.css` (101 lines) | `burgundy.css` (~70 lines) |
| `tokens-indigo.css` (106 lines) | **Deleted.** Superseded by canonical `inkwell-tokens.css`. |
| `preview-clay.html` | **Deleted.** Replaced by `preview.html?palette=clay`. |
| `preview-sage.html` | **Deleted.** |
| `preview-burgundy.html` | **Deleted.** |
| `preview-indigo.html` | **Deleted.** |
| `compare.html` | Kept. `<link>` hrefs updated to new filenames; any `var(--clay)` references swapped to `var(--accent)`. |

### Override-only file structure

Variants are **override-only**: no `@import` of canonical CSS. Consumers always load `inkwell.css` first, then optionally append a variant:

```html
<link rel="stylesheet" href="inkwell.css">
<link rel="stylesheet" href="variants/clay.css">  <!-- optional palette override -->
```

This keeps the toggle's stylesheet swap cheap (~3 KB add, not a re-download of canonical) and ensures one canonical bundle is always loaded regardless of palette. The downside — consumers wanting clay-by-default can't link a single file — is documented and accepted; the two-link pattern is one extra line of HTML.

### Naming collision (resolved by deletion)

`variants/tokens-indigo.css` is named "Indigo & Cloud" with a cool-stone palette — same vibe as the canonical `inkwell-tokens.css`. The canonical *is* the refined-and-promoted indigo variant. Deleting `tokens-indigo.css` clears the name collision and avoids any rename. Four clean palette names remain:

1. **Indigo & Cloud** (default, canonical) — `inkwell.css`
2. **Clay** — `variants/clay.css`
3. **Sage & Stone** — `variants/sage.css`
4. **Burgundy & Bone** — `variants/burgundy.css`

---

## Toggle UI — markup, JS, persistence

### Markup added to each example HTML

Parallel to the existing `.theme-toggle`:

```html
<div class="palette-toggle" aria-label="Palette">
  <button class="btn btn-ghost" type="button" data-palette-choice="indigo"   title="Indigo & Cloud">Indigo</button>
  <button class="btn btn-ghost" type="button" data-palette-choice="clay"     title="Clay">Clay</button>
  <button class="btn btn-ghost" type="button" data-palette-choice="sage"     title="Sage & Stone">Sage</button>
  <button class="btn btn-ghost" type="button" data-palette-choice="burgundy" title="Burgundy & Bone">Burgundy</button>
</div>
```

- 14 example HTML files + `preview.html` updated (15 files total).
- `index.html` stays unchanged — it's the starter template, kept minimal.
- New `.palette-toggle` rule in `examples/demo.css` (~10 lines, mirrors `.theme-toggle`).

### Stylesheet swap mechanism — pure JS

The default palette (indigo) needs no extra stylesheet. For the others, `demo.js` dynamically creates and appends a `<link>` element to `<head>` when needed, and removes it when palette flips back to default. The example HTML files contain **no** palette-specific link tags.

### `demo.js` extension (~35 lines, new IIFE alongside the existing theme one)

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

**Resolution order on every page load:**

1. URL has `?palette=X` → use X, write X to storage
2. localStorage has `inkwell-palette` → use stored value
3. Neither → use Indigo & Cloud (default)

**Toggle click** updates both the URL (`history.replaceState`) and storage, so a copied URL preserves the choice when shared.

### FOUC behavior

Matches the existing theme toggle. `demo.js` runs at end-of-body; a user with `clay` saved sees ~50–200 ms of indigo before the swap on first paint. This is consistent with the current theme-toggle behavior on slow networks. Inline `<head>` scripts to prevent FOUC are out of scope for this change; if FOUC becomes a real complaint, address theme and palette together in a follow-up.

### `preview.html` and `index.html`

- `preview.html` — gets the palette toggle. Replaces the four deleted `variants/preview-*.html` pages.
- `index.html` — stays minimal, no palette toggle. It's the starter template.

---

## Plumbing — Pages workflow + relative paths

### Path resolution

`demo.js` references `variants/clay.css` (no `../` prefix). This works in both contexts:

- **Locally:** `examples/dashboard.html` → resolves to `examples/variants/clay.css`. Requires local mirror.
- **Deployed Pages site:** `examples/` is deployed as the root, so `dashboard.html` → resolves to `variants/clay.css` at site root. Requires the workflow to copy variants in.

### Pages workflow updates

`.github/workflows/pages.yml`:

```yaml
# Add to paths: trigger
- 'variants/clay.css'
- 'variants/sage.css'
- 'variants/burgundy.css'

# Update the sync step
- name: Sync canonical CSS into examples/
  run: |
    cp tokens.css inkwell.css inkwell-tokens.css inkwell-components.css inkwell-theme.css examples/
    mkdir -p examples/variants
    cp variants/clay.css variants/sage.css variants/burgundy.css examples/variants/
```

### Local mirror update

`CLAUDE.md`'s "After editing the source CSS" section gains a parallel command:

```bash
cp tokens.css inkwell.css inkwell-tokens.css inkwell-components.css inkwell-theme.css examples/
mkdir -p examples/variants
cp variants/clay.css variants/sage.css variants/burgundy.css examples/variants/
```

### Tailwind interaction

No new entry file needed. `inkwell-theme.css` declares `@theme` aliases that map Inkwell tokens to Tailwind utilities. A variant CSS file overriding `--accent` makes `text-accent` and friends follow the variant automatically — palette switching works for Tailwind users with zero extra plumbing, as long as the variant CSS is loaded *after* the Tailwind build output.

**Action:** add a one-paragraph callout in `TAILWIND.md` documenting the load-order requirement and showing the `<link>` pattern.

---

## Doc rewrites

| File | Section to rewrite | New framing |
|---|---|---|
| `CLAUDE.md` | "Architecture: two parallel naming systems" | "Architecture: one token layer, four palettes" |
| `CONTRIBUTING.md` | "The two universes" table | "Palettes" — single naming system, variants override brand-layer tokens |
| `DESIGN_SYSTEM.md` | Audit for `--clay` references; document palette layering pattern | Add a "Palettes" section explaining the override-only model |
| `README.md` | Brief mention of `variants/` as "legacy palette branch" | Update to "alternate palettes" + 2-sentence intro to `?palette=` switching |
| `AGENTS.md` | "The `variants/` directory is a legacy palette branch and should not be mixed" | Update to current model |
| `agent-instructions.md` | Variants table entry | Update file paths + drop legacy framing |
| `TAILWIND.md` | New section | Document variant load-order pattern |

---

## Versioning — 2.0.0

The CHANGELOG header reads: *"majors break the public API."* This change breaks it on two axes:

1. `variants/tokens-{clay,sage,burgundy,indigo}.css` paths removed — anyone linking these files gets a 404.
2. `--clay`, `--clay-d`, `--clay-tint` tokens removed — anyone referencing `var(--clay)` in their own CSS gets undefined-token behavior.

No compat shims. A migration section in CHANGELOG documents both rewrites:

```
s/variants\/tokens-clay\.css/variants\/clay.css/g
s/var(--clay)/var(--accent)/g
preview-clay.html → preview.html?palette=clay
```

The 1.4.0 release shipped a breaking class rename (`.stat-card.warn` → `.stat-card.is-primary`) as a minor, contradicting the stated rule. 2.0.0 also re-establishes the precedent that breaking changes get major bumps.

---

## Implementation order

Single coordinated PR, sequenced commits:

1. **Refactor variants** — create new `clay.css`, `sage.css`, `burgundy.css` (override-only); delete `tokens-indigo.css`; update `variants/compare.html`.
2. **Delete legacy previews** — remove `variants/preview-*.html`.
3. **Toggle markup** — add `.palette-toggle` to 14 example HTML files + `preview.html`.
4. **Toggle JS + CSS** — extend `demo.js` with the new IIFE; add `.palette-toggle` rule to `demo.css`.
5. **Pages workflow** — update `pages.yml` sync step + path triggers.
6. **Docs sweep** — rewrite "two universes" sections across the seven listed files.
7. **Version bump** — `inkwell-tokens.css` header → `Version: 2.0.0`; regenerate `tokens.json` via the existing script; CHANGELOG entry with Migration section.
8. **BACKLOG cleanup** — remove the palette-swapping item and the editorial-primitives-in-variants item.

---

## Out of scope (explicitly)

- Tailwind-flavored variant entry files. Works via cascade for free.
- FOUC mitigation via inline `<head>` scripts. Matches existing theme-toggle pattern; address both together in a follow-up if it becomes a real complaint.
- Thin redirect HTML files at the old `variants/preview-*.html` paths. Bookmark-holders get a 404; acceptable for a 2.0 break.
- Audit Tier-2 BACKLOG items (#1 mono `.eyebrow`, #5 `*-strong` dashboard colors, #9 `--sky` promotion). Separate work.

---

## Risks

**R1 — Hidden component-CSS drift in `tokens-clay.css`.** The 526-line legacy file mixes tokens + components. The components *should* be byte-equivalent to `inkwell-components.css`, but there's no guarantee. During implementation, audit `tokens-clay.css` line-by-line against canonical; any genuinely palette-specific component CSS that surfaces lives in the corresponding `variants/X.css` file as an override. If significant drift is found, the spec needs revision before continuing.

**R2 — Tailwind cascade-order surprises.** The Tailwind utility build output is opinionated about cascade. If the variant CSS, loaded after the build, doesn't override `--accent` consistently in all Tailwind contexts, palette switching breaks for Tailwind users. Mitigated by testing `examples/tailwind.html` with the toggle during implementation.

**R3 — `preview.html` markup divergence from `examples/*.html`.** `preview.html` lives at the repo root, not in `examples/`, and may have a different navbar structure. The palette toggle's CSS may need a small variant for that markup. Mitigated by inspecting `preview.html` during step 3.

**R4 — Versioning consumer fallout.** A 2.0.0 bump signals "read the migration." Anyone consuming Inkwell via raw GitHub URLs (the `agent-instructions.md` pattern) and pinning to `main` will silently inherit the break. CHANGELOG migration section + a clear README note are the only mitigation; raw-URL consumers self-select for accepting that risk.

---

## Open implementation details to confirm during the plan phase

- Exact `.palette-toggle` CSS — match `.theme-toggle`'s visual weight, or visually subordinate (palette is more rarely changed)?
- Where in each example's header does the toggle sit — left of, right of, or below the theme toggle?
- Should the palette toggle collapse to a `<select>` on narrow viewports?
- Whether `tokens.json` needs a top-level `palettes` section enumerating the four available palettes (so external tooling can discover them programmatically). Possible 2.0 addition; not required.
- The clay variant's formal display name. Three of the four variants follow an "X & Y" pattern (Indigo & Cloud, Sage & Stone, Burgundy & Bone); `tokens-clay.css` today calls itself "Warm Editorial Design System." Spec uses bare "Clay" as a placeholder — confirm or rename during implementation.

These are deferred to the implementation plan, not gating for design approval.
