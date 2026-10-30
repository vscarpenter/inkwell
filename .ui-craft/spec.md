# Surface: Inkwell homepage

Approved October 30, 2026. Public source: `examples/index.html`; the root starter remains intact.

## Intent

Help developers and coding agents understand Inkwell and start using it. Existing platform fonts, flat paper surfaces, 1.5px frames, five palettes, relative type, and native-browser components define the identity.

**Craft Read:** *Inkwell homepage for developers and coding agents, marketing language, Indigo & Cloud with four alternate palettes, variance 6, signature bet: a working Inkwell specimen directly beneath the headline.*

Composition: **stacked**, drawn during the proposal review. Short copy gives the live example room in the first desktop viewport. No split hero, decorative app chrome, or fabricated adoption metrics. Motion is limited to existing state/hover feedback; normal scrolling and reduced motion remain intact.

## Content and behavior

- Header: brand and Docs / Components / Examples / GitHub links.
- Introduction: “Build interfaces with character.” A short explanation of the CSS system, 39 families, five palettes, and no consumer build step. “Start building” targets `#get-started`; “Explore components” targets the catalog.
- Working specimen: actual heading/body/button/input/checkbox/progress/menu components. Palette and theme controls affect the page. Example preview changes produce polite feedback; reset restores example fields and preserves menu focus behavior. No persistence or destructive action is implied. Unsupported/no-script states expose ordinary reference links and native fields; enhancement-only actions remain hidden or disabled.
- Adoption: three CSS files, a one-line stylesheet link, optional companion guidance, and an exact coding-agent prompt using stable v3.9.0 instructions. Copy buttons appear only when the API is available, report success after the promise resolves, and offer manual-copy instructions on denial without taking focus. The text remains selectable without JavaScript.
- Selected examples: product, editorial, and form patterns, with distinct presentation from the full directory.
- Grouped directory: direct links to all 20 published pages and the existing finding/menu/theme deep links. Preserve `#components` and `#get-started` anchors.
- Footer: starter, reference, release, repository, author, agent links, and generated deployment metadata.

## Acceptance

Page purpose, primary action, live specimen, complete route inventory, keyboard/menu/reset behavior, clipboard denial/no-API states, no-script adoption, 320px width, enlarged fonts, nested RTL, forced colors, and all five palettes in light/dark/auto are required. Shared active appearance labels must clear 4.5:1 against their fill. Use logical properties and intrinsic wrapping; never hide page overflow to conceal layout defects. All existing repository and browser checks remain required. No public API, package/build tooling, new palette, version bump, or deployment is part of this change.

## Completion

Implemented locally on October 30, 2026. The complete browser suite passed with 495 checks and 13 existing skips; generated-file, token-export, contrast, contract, and whitespace checks passed. Desktop/mobile light and dark views were reviewed. The approved stacked composition is confirmed by screenshot and geometry; the fold classifier's low-confidence split reading of the specimen's internal columns is documented in `docs/plans/2026-10-30-homepage-redesign-implementation.md`. No findings were suppressed. The changelog remains Unreleased at 3.9.0.
