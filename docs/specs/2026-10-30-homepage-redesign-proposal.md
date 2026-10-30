# Homepage redesign proposal

Status: proposed direction following the 3.9.0 release. This document records the backlog review and a concrete section map; it does not mark a design or implementation as approved.

## Target and outcome

Reimagine the public homepage at `https://inkwell.vinny.dev/`, owned by `examples/index.html`. The repository-root `index.html` remains the copyable starter. GitHub Pages publishes `examples/`; changing the root starter alone would not change the public landing page.

The proposed primary outcome is that a developer or coding agent understands Inkwell and can start using it. This follows the existing project brief; the user has been asked whether adoption, example browsing, or reference lookup should lead. Until steered otherwise, adoption is the working recommendation.

Inkwell's defining constraints remain: platform serif/sans/mono roles, cool neutral surfaces, one brand accent, 1.5px frames, five palettes, explicit light/dark/auto support, relative typography, RTL, and a dependency-free consumer install.

## What the current page establishes

- The live page is titled "Inkwell Sample Pages" and leads to a dashboard sample. Its introduction describes the visual treatment before explaining the adoption path.
- Navigation is largely occupied by five palette and three theme choices. Documentation, the component reference, examples, and GitHub need a clearer navigation role.
- The hero's "System health / Ready" panel contains demonstration statistics such as "42 Tokens" and "+8 refined". They are not useful evidence of the current component contract. Replace these fixtures with an actual working specimen.
- A large coding-agent prompt appears before the example directory. Preserve this useful integration, but give it a deliberate home alongside direct CSS adoption.
- Twenty-two equal-weight cards mix page examples, documentation, reference, and links to sections on other pages. Every existing route must remain accessible; equal presentation priority is unnecessary.
- The selected Clay appearance button was verified on the live page in light mode: foreground `rgb(255, 255, 255)`, background `rgb(214, 118, 88)`, 12px text, contrast **3.19:1**. The active selectors in `examples/demo.css` use `--paper`; use the established `--on-accent` label contract and verify every palette/mode. This is an appearance-control fix, not a reason to add new status colors or brand tokens.

The source detector reported zero errors and one copy warning for four visible em dashes. This mechanical scan does not assess the page's purpose or establish an accessibility pass. The review covered the source, desktop live hierarchy, navigation/adoption paths, and the Clay control colors; it was not another full responsive or assistive-technology audit.

## Recommended scope and composition

Scope: **layout rebuild** of the public homepage, using the existing system. Preserve routes, useful links, component APIs, and the starter's role. Update the homepage title, descriptions, and social/canonical URL consistency around its actual purpose.

**Craft Read:** *Inkwell homepage for developers and coding agents, marketing language, Indigo & Cloud with four alternate palettes, variance 6, signature bet: a working Inkwell specimen directly beneath the headline.*

Composition: **stacked**. A concise introduction and action row lead into a wide, functional specimen. The current split layout has already been used here; the stacked candidate lets visitors understand the system before trying it. Keep the copy short enough that real components appear in the initial desktop view. On mobile, retain the same reading order and normal document scrolling.

Proposed lead:

> Build interfaces with character.
>
> A CSS design system with 39 components, five palettes, and light and dark modes. No build step.

Primary action: **Start building**, leading to the adoption section. Secondary action: **Explore components**, leading to the generated reference. Retain dashboard access as a featured example.

The specimen is real Inkwell HTML with native controls and the optional companion where needed. It should prove typography, controls, focus, and palette behavior through a coherent small example. Avoid fabricated business performance metrics, screenshot-shaped decorative markup, new dependencies, or generated image assets.

## Before / after section map

| Current | Proposed |
|---|---|
| Brand + palette/theme controls | Brand + Docs / Components / Examples / GitHub; appearance controls subordinate to navigation |
| Split headline + placeholder system-health metrics | Short product introduction, adoption action, and working specimen beneath |
| Large coding-agent alert | Adoption section with two clear paths: use the CSS or give instructions to a coding agent |
| One long grid of 22 cards | A small selection of product/editorial/form examples, then a compact grouped directory retaining direct links to all 20 published pages and useful deep links |
| Static palette swatches after the directory | Palette exploration alongside the specimen, so changes demonstrate actual components |
| Implementation-focused footer | Reference / release / GitHub / agent / starter links and real deployment metadata |

Suggested reading order: **understand → try → adopt → explore**. Palette switching serves the working example, while the page retains one primary adoption action.

## Acceptance criteria

- A visitor can identify what Inkwell is and reach installation, component contracts, or examples without searching through the gallery.
- All 20 published routes remain directly linked from both entry points. Preserve the current `#components` and `#get-started` anchors or provide equivalent anchored destinations for existing links.
- The specimen works by keyboard; focus and any status feedback remain clear. No fake signup, data persistence, or destructive action is implied.
- Use existing tokens and components; keep homepage layout CSS scoped so other examples do not inherit the redesign.
- Selected appearance controls satisfy the existing text/fill contrast contract in every palette and mode. If the shared demo stylesheet changes, add regression coverage over the affected examples.
- Check 320px and desktop layouts, enlarged/default browser fonts, nested RTL, light/dark/auto, forced colors, reduced motion, and no-script access to content and adoption links. Preserve the supported browser floor and provide baseline content without enhancement.
- Keep one h1, clear landmarks, a skip link, real links, accurate metadata, and the generated version/deployment placeholders. Author prose around actual capabilities, without customer or adoption claims that lack evidence.
- Run the existing generation, token-export, contrast, repository-contract, whitespace, and browser checks for implementation. Review light/dark and mobile/desktop screenshots before release. No version bump or deployment is included in this proposal.

## Remaining backlog decisions

| Item | Recommendation after the homepage |
|---|---|
| Further container-aware components | Take one only when a real narrow-host layout demonstrates a benefit; the homepage may supply that evidence. Do not add containment broadly. |
| Stronger dashboard status colors | Retain as an experiment requiring a real dashboard comparison and full contrast/meaning checks. Current readable status tokens already exist. |
| Replace mono eyebrow entirely | Keep the product/editorial role split unless consumer feedback demonstrates a problem. |
| Promote sky to a second interactive hue | Keep deferred; no concrete second-action need has been established, and it would change the one-accent contract. |
| Relative color syntax for dark accents | Keep in future-major exploration, with browser and contrast evidence required before changing hand-tuned values. |

The homepage is the only new committed priority. The other five items remain conditional or exploratory, rather than being promoted into feature work without evidence.
