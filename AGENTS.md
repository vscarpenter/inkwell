# Repository Guidelines

## Project Structure & Module Organization

Inkwell is a pure-CSS design system with no package manager, framework, or build step. The canonical source is `tokens.css`, which contains the token layer and component styles. `inkwell.css` is the consumer-facing alias that imports `tokens.css`; keep both files side by side. `tokens.json` mirrors the CSS tokens for external tooling and should be updated when token values change. Manual review surfaces live in `index.html`, `preview.html`, and `examples/`. The `variants/` directory is a legacy palette branch and should not be mixed with the root token system.

## Build, Test, and Development Commands

There is nothing to install or compile. Open files directly in a browser:

```bash
open index.html              # starter template and theme toggle
open preview.html            # full component showcase
open variants/compare.html   # legacy palette comparison
```

GitHub Pages deploys `examples/` on pushes to `main` when `examples/**`, `tokens.css`, `inkwell.css`, or `.github/workflows/pages.yml` changes.

## Coding Style & Naming Conventions

Use two-space indentation in CSS and HTML. Route component styling through CSS custom properties instead of hard-coded literals. New work should use the root naming system: `--accent`, `--ivory`, `--paper`, `--slate`, and related tokens from `tokens.css`. Do not introduce `--clay` outside `variants/`, and do not introduce `--accent` inside `variants/`. Preserve the design invariants in `DESIGN_SYSTEM.md`: 1.5px borders via `--border`, one saturated accent, platform fonts only, and light/dark values for saturated tokens.

## Testing Guidelines

Verification is visual. After changing `tokens.css` or markup, review `preview.html` in light, dark, and auto theme modes. If color or palette behavior changed, also review `variants/compare.html`. Prefer checking on a 2x display because the 1.5px border is retina-first and may render as 1px on non-retina screens.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects, for example `Surface agent-instructions.md from the README` and `Make navigation between example pages explicit`. Keep each commit focused on one concern. PRs should describe the visual or API impact, list touched surfaces, include screenshots for visual changes, and update `DESIGN_SYSTEM.md`, `README.md`, or `CHANGELOG.md` when behavior or public usage changes.

## Agent-Specific Instructions

Read `DESIGN_SYSTEM.md` before extending components and `agent-instructions.md` before using Inkwell in another project. Do not add build tooling, package metadata, framework wrappers, webfonts, or generated assets unless explicitly requested.
