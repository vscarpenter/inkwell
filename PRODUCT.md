# Product

## Register

product

## Users

Developers (and increasingly LLM coding agents pointed at `agent-instructions.md`) building product UI, dashboards, and technical interfaces who want a considered visual identity without a consumer build step, package manager, or webfonts. They consume Inkwell by copying CSS files into a project and linking one stylesheet; a parallel path serves Tailwind v4 projects via `inkwell-theme.css`, and an optional dependency-free script supplies portable interaction recipes.

## Product Purpose

Inkwell is a pure-CSS design system: one token layer, one component layer, five palettes (Indigo & Cloud canonical; Clay, Sage & Stone, Burgundy & Bone, Azure & Ink as override-only variants), light + dark out of the box. Success means a consumer can understand the install and component responsibilities without reading source, ship an interface that "already feels considered" in minutes, and keep it on-identity and accessible as palettes, modes, and viewports change.

## Brand Personality

Letterpress-quiet, editorial, considered. Serif headlines for gravitas, mono for technical metadata, a signature 1.5px hairline border. Reads as Linear/Stripe/Notion-adjacent without being a clone of any of them. "Made with hairlines and serifs. The 1.5px is on purpose."

## Anti-references

- Generic SaaS: sans-serif headings, multiple saturated accents, gradient surfaces.
- Material Design: heavy floaty shadows, lift-and-glow hovers.
- Wireframe (1px borders) and playful (2px borders) — the 1.5px hairline is the identity.
- Emoji icons (inline SVG strokes only), webfonts (platform stacks only), warm-beige neutrals that orphan the cool indigo accent.

## Design Principles

1. **One accent only** — a second data-viz hue reaches for `--olive` or `--sky`, never a second saturated brand color.
2. **Tokens, never literals** — component CSS contains no hex codes; palettes swap by overriding brand-layer tokens alone.
3. **Lifted dark accents** — every saturated token gains luminance (same hue) in dark mode; tokens defined only in `:root` are wrong by construction.
4. **Type families are jobs** — serif → headings/stats/editorial primitives; mono → technical metadata; sans → everything else.
5. **Structure/brand separation** — borders, type scale, spacing, motion, and components are shared; only brand-layer colors differ between palettes.
6. **The contract travels with the code** — a machine-readable component manifest, generated reference, pinned agent guide, and executable repository checks describe the same public API.

## Accessibility & Inclusion

WCAG AA-conscious defaults: body text ≥4.5:1 on its surfaces, global accent `:focus-visible` outline, reduced-motion honored, color never the only signal, native semantics first (`<dialog>`, `<details>`, real checkboxes/radios, `<kbd>`), 44px targets on coarse pointers, and reference pages with landmarks, skip links, programmatic form errors, and mobile-overflow checks. One documented deliberate exception: the 1.5px `--gray-300` hairline border sits below WCAG 1.4.11's 3:1 — separation is carried by border + surface tone shift + shadow together; `--border-strong` exists when a panel must stand off the page. Rule for extensions: any new colored token clears 3:1 (non-text) / 4.5:1 (text) against the surface it ships on, unless paired with another signal.
