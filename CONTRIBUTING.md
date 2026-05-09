# Contributing to Inkwell

Thanks for your interest. Inkwell is a small, opinionated design system — contributions that sharpen the existing direction are welcome; contributions that pull it in a new direction will get a longer conversation first.

## Before you open a PR

- **Read `DESIGN_SYSTEM.md`.** It's the canonical spec and explains the *why* behind decisions that look arbitrary in the CSS (the 1.5px border, the lifted dark accent, the cool-putty neutrals). Most "is this allowed?" questions are answered there.
- **Open an issue for non-trivial changes.** New components, new tokens, new palettes, or anything that touches dark-mode behavior should be discussed before you write CSS. Typo fixes, doc clarifications, and obvious bug fixes can go straight to PR.

## Project layout

This is a pure-CSS repo. There is no build step, no package manager, no test suite. You edit CSS, you reload an HTML file, you look at it.

- `tokens.css` — canonical token layer + all component CSS.
- `inkwell.css` — one-line `@import` of `tokens.css`. The brand-named alias consumers link from.
- `index.html`, `preview.html` — manual verification surfaces.
- `variants/` — legacy palette branch. See "The two universes" below.

## The two universes

The repo has two parallel naming systems that must not be mixed:

| | Root (`tokens.css`) | `variants/` |
|---|---|---|
| Status | Canonical, current | Legacy / reference |
| Accent token name | `--accent` | `--clay` (regardless of actual hue) |
| Dark mode | Built in | Not present |
| Use for new work? | **Yes** | No |

Don't reference `--clay` from anything built on root `tokens.css`. Don't introduce `--accent` inside `variants/`. If you're adding a new component, add it to `tokens.css`. If you're fixing a palette-specific bug in `variants/`, stay inside that branch.

## Design invariants

These are non-negotiable. PRs that violate them will be asked to change before merge.

1. **Tokens, never hex literals.** Component CSS references tokens (`var(--border)`, `var(--accent)`); it does not contain `#3B4A8C` or `rgba(...)` literals. The whole point of the token layer is that palettes stay swappable.
2. **1.5px borders, paired with `--gray-300`.** Always via `--border`. Hairline dividers *inside* a panel drop to 1px / `--gray-100` so the outer frame stays dominant. Don't replace 1.5px with a box-shadow workaround to "fix" non-retina rendering — Chrome rounds 1.5px to 1px on 1x displays in both rendering and `getComputedStyle()`. That's expected. The system is retina-first.
3. **One accent only.** A second hue for data viz reaches for `--olive` or `--sky`. Never introduce a second saturated brand color.
4. **Every saturated token gets both light and dark values.** Saturated in light, lifted (more luminance, same hue) in dark. A token defined only in `:root` will look wrong on dark surfaces.
5. **Shadows are warm/low-spread in light, deep-pure-black in dark.** Don't reuse light-mode rgba shadows under dark mode — warm shadows vanish on dark surfaces.
6. **Type families are jobs, not preferences.** Serif → headings, stat numbers, italic emphasis. Mono → eyebrows, table headers, hex codes, technical metadata. Sans → everything else.
7. **Platform fonts only.** `ui-serif`, `system-ui`, `ui-monospace`. No webfonts. If a task seems to require one, push back unless the reason is strong.

## How to verify a change

There's no automated test suite. Verification is visual.

1. Open `preview.html` and confirm your component (or the component you touched) still renders correctly in **both light and dark mode**. Toggle via the theme switcher in the header.
2. If you touched anything color-related, also open `variants/compare.html` to confirm none of the four palettes regressed (only relevant if your change touched the `variants/` branch).
3. **Do the visual check on a 2x (retina) display when possible.** The 1.5px border is the system's signature and is designed for retina. On 1x, Chrome rounds it to 1px — that's expected, not a bug.
4. If you added a component that uses an accent in an `rgba()`, remember each `variants/` palette restates the rgba in its override file. You'll need to do the same in every variant.

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
