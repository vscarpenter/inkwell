# Contributing to Inkwell

Thanks for your interest. Inkwell is a small, opinionated design system — contributions that sharpen the existing direction are welcome; contributions that pull it in a new direction will get a longer conversation first.

## Before you open a PR

- **Read `DESIGN_SYSTEM.md`.** It's the canonical spec and explains the *why* behind decisions that look arbitrary in the CSS (the 1.5px border, the lifted dark accent, the cool-putty neutrals). Most "is this allowed?" questions are answered there.
- **Open an issue for non-trivial changes.** New components, new tokens, new palettes, or anything that touches dark-mode behavior should be discussed before you write CSS. Typo fixes, doc clarifications, and obvious bug fixes can go straight to PR.

## Project layout

This is a pure-CSS repo. There is no build step, no package manager, no test suite. You edit CSS, you reload an HTML file, you look at it.

- `inkwell-tokens.css` — source of truth for `:root` tokens. Edit this when changing colors, type sizes, radii, shadows, motion, layout widths, or z-index. Since 3.0 every color token is a single declaration: both mode values live in `light-dark(light, dark)`, and alpha tints derive from their base via `color-mix()` (declare explicitly only where the contrast gate forces a hand-tuned value).
- `inkwell-components.css` — source of truth for component classes, base reset, type styles, layout helpers, and a11y rules. Edit this when changing `.btn`, `.card`, `.alert`, etc.
- `inkwell.css` — the canonical entry consumers link from: imports `inkwell-tokens.css` unlayered and `inkwell-components.css` into `@layer inkwell`. **Do not edit** beyond the import list.
- `tokens.css` — deprecated one-line alias of `inkwell.css` (removal slated for 4.0). **Do not edit.**
- `inkwell-theme.css` — Tailwind v4 entry. Imports the two source files, declares `@theme` aliases, defines `@custom-variant dark`. Edit this when adding tokens that need to surface as Tailwind utilities, or when the Tailwind integration itself changes.
- `tokens.json` — machine-readable mirror of `inkwell-tokens.css`. **Generated** by `scripts/build-tokens-json.mjs`; do not edit by hand. Re-run the script after touching `inkwell-tokens.css` and commit the regenerated JSON in the same change.
- `examples/changelog.html` — the releases section is **generated** from `CHANGELOG.md` by `scripts/build-changelog-html.mjs`; edit only outside the BEGIN/END markers. After editing `CHANGELOG.md`, re-run the script and commit the regenerated page in the same change. CI fails on drift for both generated files.
- `index.html`, `preview.html`, `examples/` — manual verification surfaces.
- `variants/` — palette override files (clay, sage, burgundy). See "Palettes" below.

If you add a new source CSS file at the repo root, also add it to `inkwell.css`'s `@import` list (if it's part of the default install; choose layered vs. unlayered deliberately) and to the `paths:` trigger plus `cp` step in `.github/workflows/pages.yml`. For Tailwind exposure, register it inside `inkwell-theme.css`.

See [`TAILWIND.md`](TAILWIND.md) for the conventions that govern the Tailwind v4 path (`border-hair`, components-vs-utilities, cascade-order check).

## Palettes

Inkwell ships with four palettes that share one token layer:

| Palette | File | Vibe |
|---|---|---|
| Indigo & Cloud (default) | `inkwell-tokens.css` | Cool stone + deep indigo. Linear/Stripe/Notion-adjacent. |
| Clay | `variants/clay.css` | Warm cream + Anthropic clay coral. Editorial. |
| Sage & Stone | `variants/sage.css` | Sage green + warm stone. Quiet, considered. |
| Burgundy & Bone | `variants/burgundy.css` | Deep burgundy + bone paper. Literary journal. |

Variant files contain only brand-layer token overrides (`--accent`, `--ivory`, `--slate`, `--oat`, neutral scale) as single `light-dark()` declarations in `:root`, plus the dark `.select` chevron override. They never restate component CSS — components live once, in `inkwell-components.css` — and they inherit canonical's `color-mix()` derived tints unless the contrast gate forced a different alpha (clay and sage redeclare `--accent-tint`; burgundy inherits everything).

To use a non-default palette, load its file after `inkwell.css`. The example pages ship with a runtime toggle (`?palette=clay`); for static use, link the variant directly.

## Design invariants

These are non-negotiable. PRs that violate them will be asked to change before merge.

1. **Tokens, never hex literals.** Component CSS references tokens (`var(--border)`, `var(--accent)`); it does not contain `#3B4A8C` or `rgba(...)` literals. The whole point of the token layer is that palettes stay swappable.
2. **1.5px borders, paired with `--gray-300`.** Always via `--border`. Hairline dividers *inside* a panel drop to 1px / `--gray-100` so the outer frame stays dominant. Don't replace 1.5px with a box-shadow workaround to "fix" non-retina rendering — Chrome rounds 1.5px to 1px on 1x displays in both rendering and `getComputedStyle()`. That's expected. The system is retina-first.
3. **One accent only.** A second hue for data viz reaches for `--olive` or `--sky`. Never introduce a second saturated brand color.
4. **Every saturated token gets both light and dark values.** Saturated in light, lifted (more luminance, same hue) in dark. A token defined only in `:root` will look wrong on dark surfaces.
5. **Shadows are warm/low-spread in light, deep-pure-black in dark.** Don't reuse light-mode rgba shadows under dark mode — warm shadows vanish on dark surfaces.
6. **Type families are jobs, not preferences.** Serif → headings, stat numbers, italic emphasis. Mono → eyebrows, table headers, hex codes, technical metadata. Sans → everything else.
7. **Platform fonts only.** `ui-serif`, `system-ui`, `ui-monospace`. No webfonts. If a task seems to require one, push back unless the reason is strong.

## Regenerating `tokens.json`

`tokens.json` is the only generated artifact in the repo. Re-run `node scripts/build-tokens-json.mjs` whenever `inkwell-tokens.css` changes and commit the regenerated JSON in the same change. CI runs `node scripts/build-tokens-json.mjs --check` on every PR — a stale `tokens.json` fails the check with a line-level diff. The script has no dependencies (Node 18+ built-ins only); this is **not** a build step on the CSS itself — the CSS files still ship as-is.

## How to verify a change

There's no automated test suite. Verification is visual.

1. Open `preview.html` and confirm your component (or the component you touched) still renders correctly in **both light and dark mode**. Toggle via the theme switcher in the header.
2. If your change touches the Tailwind v4 path, also open `examples/tailwind.html` and verify components + utilities + `dark:` still behave correctly. The cascade-order check in [`TAILWIND.md`](TAILWIND.md) is the canonical verification.
3. If you touched anything color-related, also open `variants/compare.html` (or use `preview.html?palette=clay` / `?palette=sage` / `?palette=burgundy`) to confirm none of the four palettes regressed.
4. **Do the visual check on a 2x (retina) display when possible.** The 1.5px border is the system's signature and is designed for retina. On 1x, Chrome rounds it to 1px — that's expected, not a bug.
5. If you added a component that uses an accent in an `rgba()`, make sure the rgba references `var(--accent)` (or a derived token) rather than a hardcoded color value, so palette overrides work automatically.

## Commit & PR style

- **Commit messages explain the *why*, not the *what*.** "Add hover state to chip" is the what; "Increase chip affordance — users were missing them as clickable" is the why.
- **One concern per PR.** A token rename and a new component go in separate PRs.
- **Update `DESIGN_SYSTEM.md` when you change behavior.** The spec is the source of truth for intent. If your change makes the spec out of date, update it in the same PR.

## What's out of scope

- **Build tooling** (PostCSS, Sass, esbuild, etc.). Inkwell is shipped as-is. Adding a build step changes what the project *is*.
- **Package manager metadata** (`package.json`, npm publishing). Same reason.
- **Frameworks-specific wrappers** (React components, Vue components, Web Components). The system is CSS; framework integrations belong in separate repos.
- **Webfonts.** See invariant 7.

## Reporting issues

Issues and bug reports go on [GitHub](https://github.com/vscarpenter/inkwell/issues). For visual bugs, please include:

- Browser + version
- Light or dark mode
- Whether the display is 1x or 2x (retina)
- A screenshot

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
