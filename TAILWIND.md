# TAILWIND.md — planning artifact

**Status:** PLANNING. Nothing in this document has been implemented. No files have been added to the repo, no consumer-facing API has been committed to. This is a design brief intended to be read, edited, and converted into a real PR.

**Author:** Drafted with Claude Code on 2026-05-09. Revisit before writing code.

**Decision needed:** Whether to ship a Tailwind integration for Inkwell, and if so, at what level of ambition (§3).

---

## 1. The question

Inkwell is a pure-CSS token system today. Tailwind is the dominant utility-first CSS framework. A non-trivial fraction of designers and developers default to Tailwind for any new project — without a Tailwind path, they will either port Inkwell's tokens manually (lossy, error-prone) or skip Inkwell entirely.

This doc lays out **what a Tailwind-compliant Inkwell would look like, what it would cost, and what tradeoffs we'd be accepting.** It does not yet recommend shipping it — that's the open decision.

---

## 2. The core insight

Tailwind 4 (October 2024) shifted to a **CSS-first config model** — themes are defined via `@theme { --color-accent: ...; }` blocks in CSS, not via `tailwind.config.js`. This collapses ~80% of the conceptual gap between Inkwell and Tailwind.

> **Inkwell is already 95% of the way to being a Tailwind 4 theme.** The work is mostly aliasing variable names from Inkwell's namespace (`--accent`, `--ivory`, `--r-md`) into Tailwind's expected namespace (`--color-accent`, `--color-ivory`, `--radius-md`). We're not duplicating values; we're pointing Tailwind at Inkwell's CSS variables and letting them resolve at use time.

That last point is load-bearing. If we **alias** rather than **duplicate**, then the dark-mode cascade, palette swaps, and the two-universes rule (see `CLAUDE.md`) all extend automatically. Change `--accent` in `tokens.css`, and every Tailwind utility (`bg-accent`, `border-accent`, `ring-accent`) updates everywhere with no rebuild required.

Tailwind 3, which is still widely deployed, requires a JS preset (`tailwind.preset.js`) — more verbose but the same idea: theme keys point at `var(--accent)` instead of literal hex.

---

## 3. Three levels of "compliance" — pick one

| Level | What a Tailwind user gets | Inkwell maintenance cost |
|---|---|---|
| **A. Tokens-only** | `bg-ivory`, `text-slate`, `border-accent`, `font-serif`, `rounded-md`. They build buttons and cards from utilities, the way Tailwind users naturally do. | One file (`inkwell-theme.css`). Lowest. |
| **B. Tokens + components in `@layer components`** | Above, plus `.btn`, `.card`, `.tldr`, `.stat-card`, etc. work as-is. Utilities can override or extend component styles. | Two files; minor refactor of `tokens.css` to split tokens from components. Medium. |
| **C. Full preset/plugin + npm package** | Above, plus Tailwind-flavored Inkwell utilities (`border-hair`, `shadow-letterpress`, `ring-accent-focus`), published as `tailwindcss-inkwell` on npm. | Real OSS surface — versioning, semver discipline, plugin code, breaking-change hygiene. High. |

**Recommendation: B.** It's the sweet spot. Tailwind users keep their utility-first muscle memory for layout but get Inkwell's component identity (1.5px borders, lifted dark accents, serif headings) without having to recompose those signatures by hand. C is a follow-up if there's outside demand.

A bare-tokens shipment (A) loses too much of Inkwell — the 1.5px border is encoded *in* the components, not as a standalone utility. A Tailwind user who only gets tokens will reach for `border` (1px) and the system's signature collapses on first use.

---

## 4. The clean mapping — Tailwind 4

What `inkwell-theme.css` would look like (sketch — not committed code):

```css
/* inkwell-theme.css — load AFTER @import "tailwindcss"; */
@import "./tokens.css";   /* Inkwell tokens + components + dark cascade */

@theme {
  /* Surface & text */
  --color-ivory: var(--ivory);
  --color-paper: var(--paper);
  --color-slate: var(--slate);

  /* Grays */
  --color-gray-100: var(--gray-100);
  --color-gray-200: var(--gray-200);
  --color-gray-300: var(--gray-300);
  --color-gray-500: var(--gray-500);
  --color-gray-700: var(--gray-700);

  /* Accent family — alpha tints exposed as full tokens */
  --color-accent:        var(--accent);
  --color-accent-d:      var(--accent-d);
  --color-accent-tint:   var(--accent-tint);
  --color-accent-focus:  var(--accent-focus-ring);

  /* Semantic */
  --color-olive:      var(--olive);
  --color-olive-tint: var(--olive-tint);
  --color-rust:       var(--rust);
  --color-sky:        var(--sky);

  /* Type */
  --font-serif: var(--serif);
  --font-sans:  var(--sans);
  --font-mono:  var(--mono);

  --text-display: var(--t-display);
  --text-h1:      var(--t-h1);
  --text-h2:      var(--t-h2);
  --text-h3:      var(--t-h3);
  --text-body:    var(--t-body);
  --text-small:   var(--t-small);
  --text-caption: var(--t-caption);
  --text-eyebrow: var(--t-eyebrow);

  /* Radii */
  --radius-xs:   var(--r-xs);
  --radius-sm:   var(--r-sm);
  --radius-md:   var(--r-md);
  --radius-lg:   var(--r-lg);
  --radius-xl:   var(--r-xl);
  --radius-full: var(--r-pill);

  /* The signature 1.5px border, exposed as a named width — see §5a */
  --border-width-hair: 1.5px;

  /* Container max-widths */
  --container-narrow:  820px;
  --container-default: 920px;
  --container-wide:   1120px;
}
```

**What we deliberately do NOT map:**

- **Spacing scale.** Inkwell's `--sp-1..8` (4, 8, 12, 16, 24, 32, 48, 64) already aligns with Tailwind's default `1, 2, 3, 4, 6, 8, 12, 16` × 4px scale. Mapping would only create confusion.
- **Z-index tiers.** Inkwell's `--z-base/raised/sticky/overlay/modal` exist for component authoring inside `tokens.css`. Tailwind's standard `z-*` utilities serve consumers fine.
- **Transitions.** Tailwind's `duration-*` utilities are already token-flavored. Inkwell's `--t-fast/base/slow` stay as internal component values.

---

## 5. The hard parts — where we have to make calls

### 5a. The 1.5px signature border

Tailwind's default `border` utility is 1px. Three options:

1. **Override the default**: `--default-border-width: 1.5px`. Every `border` utility in the project becomes 1.5px. Risky — surprises Tailwind devs who reach for `border` expecting 1px on a non-Inkwell element.
2. **Add a named width only**: `--border-width-hair: 1.5px` → users opt in with `border-hair`. Safe but requires education.
3. **Both**: override default AND add `border-hair` for explicitness in code.

**Recommendation: 2 (named only).** Don't redefine what `border` means globally — that's a footgun for any third-party Tailwind component that depends on a literal 1px. Document `border-hair` as the canonical Inkwell border class everywhere.

### 5b. Dark mode — the dual `prefers-color-scheme` + `[data-theme]` cascade

Inkwell does both automatic-via-media-query AND manual-override-via-attribute. Tailwind 3 historically supported `darkMode: 'class'` OR `'media'` but not both at once. Tailwind 4 fixes this with custom variants:

```css
@custom-variant dark {
  /* Manual override wins */
  &:where([data-theme="dark"], [data-theme="dark"] *) { @slot; }
  /* Fall back to OS preference unless explicitly set to light */
  @media (prefers-color-scheme: dark) {
    &:where(:not([data-theme="light"], [data-theme="light"] *)) { @slot; }
  }
}
```

This is **the single most important detail to get right.** If we don't ship this custom variant, Tailwind users will reach for `dark:` and find it doesn't honor the manual toggle that lives at the bottom of `index.html`. They'll file it as an Inkwell bug.

For Tailwind 3 the equivalent is uglier (a multi-selector `darkMode` array in the JS preset). Verify exact syntax against Tailwind 3.4+ docs before shipping.

### 5c. Alpha-channel tokens

Inkwell's specific alphas (0.14, 0.18, 0.5) don't sit on Tailwind's `/10`, `/20`, `/30` opacity scale. Don't try to fake them with `bg-accent/14` — the design intent is "this specific value, named", not "an arbitrary opacity of accent."

**Decision: expose them as full color tokens.** `--color-accent-tint`, `--color-accent-focus`. Users get `bg-accent-tint`, `ring-accent-focus`. Cleaner, preserves intent, and avoids users guessing at percentages.

### 5d. Components and `@layer components`

Tailwind's cascade order is `base → components → utilities`. If Inkwell's component CSS ships in `@layer components`, then `<button class="btn px-8">` does the right thing — Inkwell's `.btn` base styles apply, but Tailwind's `px-8` utility overrides padding because utilities have higher cascade priority.

This requires a small refactor of `tokens.css`:

```
tokens.css            → split into:
inkwell-tokens.css      (variables + dark cascade only)
inkwell-components.css  (.btn, .card, .alert, etc.)
```

The original `tokens.css` becomes a `@import` of both for backward compat — non-Tailwind consumers see no change.

In the Tailwind entry CSS:

```css
@import "tailwindcss";
@import "./inkwell-tokens.css";
@layer components { @import "./inkwell-components.css"; }
```

### 5e. The two universes

The Tailwind preset must explicitly target the **root `--accent` universe**. The legacy `variants/` palettes (clay/sage/burgundy) are NOT Tailwind-compatible — they use `--clay` instead of `--accent`, so `bg-accent` would resolve to nothing. Document this loudly. If someone wants a clay-flavored Tailwind+Inkwell, they should override Inkwell's variables in their own CSS, not import from `variants/`.

---

## 6. Tailwind 3 path

Still widely deployed; cannot ignore. Ship a separate `inkwell.tailwind-preset.js`:

```js
module.exports = {
  darkMode: ['variant', [
    '&:is([data-theme="dark"] *)',
    '@media (prefers-color-scheme: dark) { &:not([data-theme="light"] *) }',
  ]],
  theme: {
    extend: {
      colors: {
        ivory: 'var(--ivory)',
        paper: 'var(--paper)',
        slate: 'var(--slate)',
        accent: {
          DEFAULT: 'var(--accent)',
          dark:    'var(--accent-d)',
          tint:    'var(--accent-tint)',
          focus:   'var(--accent-focus-ring)',
        },
        olive: 'var(--olive)',
        rust:  'var(--rust)',
        sky:   'var(--sky)',
        gray: {
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          500: 'var(--gray-500)',
          700: 'var(--gray-700)',
        },
      },
      fontFamily: {
        serif: 'var(--serif)',
        sans:  'var(--sans)',
        mono:  'var(--mono)',
      },
      fontSize: {
        display:  'var(--t-display)',
        h1:       'var(--t-h1)',
        h2:       'var(--t-h2)',
        h3:       'var(--t-h3)',
        body:     'var(--t-body)',
        small:    'var(--t-small)',
        caption:  'var(--t-caption)',
        eyebrow:  'var(--t-eyebrow)',
      },
      borderRadius: {
        xs:  'var(--r-xs)',
        sm:  'var(--r-sm)',
        md:  'var(--r-md)',
        lg:  'var(--r-lg)',
        xl:  'var(--r-xl)',
      },
      borderWidth: { hair: '1.5px' },
      maxWidth: {
        narrow:  '820px',
        default: '920px',
        wide:    '1120px',
      },
    },
  },
};
```

Users add `presets: [require('./inkwell.tailwind-preset.js')]` and import `tokens.css` separately for variable values + dark cascade.

**Verify before shipping:** the multi-selector `darkMode: ['variant', [...]]` array form was added in Tailwind 3.4.x. Confirm the exact syntax against Tailwind's current docs — the pattern above is plausible but I have not tested it.

---

## 7. Proposed minimum-viable shipment

In order of effort/payoff. None of this is committed yet.

1. **Split `tokens.css`** into `inkwell-tokens.css` + `inkwell-components.css`. Keep `tokens.css` as a backward-compat `@import` shim. ~30 min.
2. **Ship `inkwell-theme.css`** for Tailwind 4 — the alias file from §4. ~50 lines.
3. **Ship `inkwell.tailwind-preset.js`** for Tailwind 3 — the preset from §6. ~80 lines.
4. **Write user-facing docs** — convert this planning doc into a real `TAILWIND.md` with install steps, the dark-mode custom variant, the `border-hair` convention, the two-universes warning, and a "components vs utilities" guide. ~150 lines.
5. **Add `examples/tailwind.html`** — a sample page demonstrating Tailwind+Inkwell side-by-side (utilities for layout, `.btn` / `.card` for components, `border-hair` for the signature). Proves the integration works in both light and dark modes.
6. **Update `agent-instructions.md`** with a "If the user is on Tailwind…" section pointing at `TAILWIND.md` and `inkwell-theme.css`.
7. **(Future, optional)** Publish `tailwindcss-inkwell` to npm. Adds a release/versioning burden — only worth it if there's outside demand.

**Smallest defensible cut:** steps 1, 2, 4, 5. Half a day's work. v3 preset and npm package can wait.

---

## 8. Tradeoffs and risks

- **Second consumption mode forever.** Once Tailwind users adopt this, breaking changes to the alias surface become public-API breaks. Today Inkwell's API is "two CSS files." After this, it's "two CSS files + a Tailwind theme + a v3 preset." Versioning discipline gets harder.
- **The "no build step" pitch becomes nuanced.** Inkwell still has no build step; the *Tailwind layer* introduces one inherited from Tailwind itself. README copy needs to thread this carefully — the simplicity story for non-Tailwind users must not be undermined.
- **Component-vs-utility tension is unresolvable.** Some Tailwind purists will reach for utilities even where Inkwell components are more semantic. Some Inkwell purists will see `<button class="bg-accent text-paper rounded-md px-4 py-2">` and feel the system's identity has been diluted. The user-facing `TAILWIND.md` must set expectations: components for primitives, utilities for layout, never recompose the 1.5px-border signature manually.
- **shadcn/ui-style adoption pressure.** If we ship this, expect at least one fork attempting to repackage Inkwell as a React + shadcn component library. That's flattering but pulls Inkwell toward becoming a JS framework thing — directly conflicts with the "pure CSS, no framework" positioning. Decide our response in advance.
- **`@layer components` ordering bugs.** If a consumer's Tailwind setup imports things in the wrong order, Inkwell components could either lose to base styles (wrong) or beat utilities (also wrong). The integration docs need a "verify cascade order" sanity check.

---

## 9. Open questions to resolve before writing code

- [ ] Do we publish to npm, or stay copy-files-only? (Affects discovery + versioning + maintenance burden.)
- [ ] Is the `border-hair` name the right one? Alternatives: `border-1.5`, `border-rule`, `border-inkwell`. `border-hair` is pithy but obscure.
- [ ] Do we ship a `darkMode: 'class'` fallback for Tailwind 3 users on <3.4 who can't use the variant array form? If so, what semantics?
- [ ] Should `inkwell-theme.css` import `tokens.css` itself, or expect the consumer to import it separately? (The first is less to remember; the second is more honest about what's loading.)
- [ ] What's the policy on the `variants/` palettes for Tailwind users? Hard "not supported," or a documented "here's how to swap the base palette" recipe?
- [ ] Do we provide a `examples/tailwind.html` *and* an `examples/tailwind-no-components.html` to show both philosophies (B-with-components and A-tokens-only), or pick one and stick with it?

---

## 10. Decision log

> Fill this in as decisions get made. Empty for now.

| Date | Decision | Made by | Rationale |
|---|---|---|---|
| | | | |

---

## 11. References

- Inkwell's existing token layer: [`tokens.css`](tokens.css)
- Two-universes rule and edit invariants: [`CLAUDE.md`](CLAUDE.md)
- Component list and design rationale: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
- Tailwind 4 theme docs: https://tailwindcss.com/docs/theme
- Tailwind 4 custom variants: https://tailwindcss.com/docs/adding-custom-styles#using-custom-variants
- Tailwind 3 `darkMode` variant array: https://tailwindcss.com/docs/dark-mode

---

*Planning artifact — revise freely. Convert to user-facing docs only when the decision in §3 is made and the work in §7 is shipped.*
