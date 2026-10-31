# Homepage as specimen: design

Status: draft for approval, October 30, 2026. Supersedes the layout in `docs/specs/2026-10-30-homepage-redesign-proposal.md` (shipped as 3.10.0) for the public homepage only. The repository-root `index.html` starter is untouched.

## Why

The 3.10.0 homepage scored 26 of 40 in a dual-agent critique (`.impeccable/critique/2026-10-31T00-39-16Z__examples-index-html.md`). The structure is the category template, and the working specimen under the headline is a form any framework could show. Mono appears in seven text nodes on a page whose brand defines mono as a job. Switching palettes recolors about six pixels. The line that is unmistakably Inkwell, "The 1.5px is on purpose," sits in the footer in small gray sans.

The reimagined page makes one claim and proves it on the spot: the contract travels with the code. Every part of the page names the token and class it is made of, and the five palettes appear together, live, as the first thing under the headline.

## Audience and job

Developers and coding agents arrive to decide whether Inkwell is worth adopting. Success is the same as the shipped brief: a visitor can say what Inkwell is, see it working, and reach installation, the component reference, or an example without searching. Surface mode is Persuade.

## Decisions already made

The user made these choices during the brainstorm and the decision round on October 30, 2026.

Lead idea: the page is the specimen. Each section carries a mono callout naming the token and class it is made of, with one switch that shows or hides the callouts page-wide.

Tone: bolder composition within Inkwell's rules. One accent, platform font stacks, 1.5px hairlines, cool neutrals, five palettes, light and dark.

Composition: the five-up press sheet, locked from the decision page over the ruled register, the exploded anatomy, and a token-buffer challenger. A display headline sits above a full-width strip of five identical live micro-pages, one per palette. Under each, a mono diff of the tokens that palette overrides. Clicking a sheet makes it the page's palette. Seed reference for the record: seed:3d99d83d9c422a7b.

Build path: code-led. No generated image comps, no webfonts, no raster assets.

Three things survive from 3.10.0 in purpose. The adoption section keeps its two paths (link the CSS, or hand a coding agent the pinned prompt). Direct links to all 20 published pages stay. Palette and theme controls stay in some form. Everything else is open.

## The page, top to bottom

Header. The brand, then four destinations with one noun each: Docs (`docs.html`), Reference (`components.html`), Showcase (`preview.html`), Examples (the directory on this page). A compact theme control (auto, light, dark), the Seams switch, and GitHub. The theme control uses the existing `--on-accent` label contract for its active state.

Opening. The headline is "One system. Five inks." with "Five inks." in italic, set in `--accent-ink`. A one-line lede carries the product claim: a pure-CSS design system for product and editorial interfaces, three files, 39 component families, light and dark, no build step. Two actions: Start building (to adoption) and Read the reference. No eyebrow above the headline; the kicker folds into the lede. Serif italic appears once on the page, in the headline, and nowhere else. The page title is "Inkwell: one system, five inks" and the description, Open Graph, and Twitter metadata follow it with no em dash.

The press sheet. A full-width strip of five sheets. Each sheet is an iframe whose document comes from its own `srcdoc` attribute. No new page joins the example inventory, so the root starter, the route checks, and the 20-page directory stay as they are. Each sheet document links `inkwell.css` and, for the four variants, its file under `variants/`, so the five palettes render without JavaScript. The sheet markup is real Inkwell markup: a mono eyebrow, a serif title, a three-row hairline table with mono headers, a badge, and a primary button, composed as a short release brief. The parent script sets `data-theme` and `dir` on each sheet document to match the page. Without JavaScript the sheets follow the system color scheme and stay left to right. Under each iframe, in the parent page, a control carries the palette name and a mono diff. The diff shows three declarations every variant overrides: `--accent`, `--ivory`, and `--accent-ink`. Each appears as its light and dark branch verbatim, in the form `--accent #D97757 / #E08B6E`. A count of the remaining overrides follows, linking to the variant file. The canonical sheet reads "canonical, 0 overrides." The active sheet carries a strong frame and an inverted label. Selecting a sheet sets the page palette through the existing demo mechanism, announces the change in a polite live region, and says plainly that the choice follows you across the gallery. The sheets keep their own palettes; they are the comparison. The diff text is hand-authored and guarded by a repository check that parses `variants/*.css` and fails when the three declarations or the count drift.

The seams. A full-width framed stage holds the same release brief at full size in the page's current palette. Its parts work: the input, the keyboard-operable action menu from the companion, the badge, the table, a serif stat, and the primary button. Each part carries a mono callout naming its class and the tokens behind it. The frame itself carries the callout for `--border`. Preview and reset behaviors from 3.10.0 carry over with the critique's fixes. A blank name writes the error into the status line and sets `aria-invalid`, which clears on input. The copy says fields reset on reload rather than "Nothing is saved."

Adoption. The two paths from 3.10.0: file links pinned to the release tag, the one-line stylesheet link with a copy button, the coding-agent prompt with a copy button, and the no-JavaScript baseline text. Keep the `#get-started` anchor.

Directory. All 20 published pages, grouped as today, each with a two-digit mono address. The homepage entry stays as a link marked current. The three deep links (findings, menus, theme primitives) stay. The `#components` anchor lands here so existing links keep working.

Close. "The 1.5px is on purpose." as a display-size heading, one line beneath it, then the footer: starter, GitHub, author, the generated release stamp, and the deployment placeholder.

Dropped: the eight-chip appearance toolbar, the "A system with range" text rows, the decorative progress bar, and the second Start building.

## Seams

The switch is a pressed-state button in the header labeled "Seams," on by default and not persisted. Callouts are mono caption text in `--gray-700`, one per part, at most 12 on the page, hidden from assistive technology because the same facts live in the reference. Off hides them all. Without JavaScript, callouts render on and the switch is hidden.

## Responsive and preferences

On a phone the strip becomes a scroll-snap row of sheets about four fifths of the viewport wide, each with its control beneath. Everything else stacks in the same reading order. All anchors, including the file list, deep links, and footer, meet 44px on coarse pointers. The page must not overflow at 320px with a 32px root font. The strip follows `dir`, so the sheets run right to left under RTL. Forced colors keep the active sheet frame visible. No motion is added; existing reduced-motion behavior holds.

## Accessibility

One h1, landmarks, a skip link, and titled iframes. Sheet selection uses a radio group or pressed-state buttons, and palette changes announce through a polite live region. Every stop shows visible focus. The existing contrast gate extends to callout text and the active sheet label in all five palettes and both modes.

## Goals, non-goals, anti-goals

Goals: a first-time visitor knows what Inkwell is within one viewport, sees five palettes working at once, can read the tokens behind any part, and reaches adoption in one click.

Non-goals: no change to the root starter, no public API change, no version bump or deployment inside the build. Release is a separate request.

Anti-goals: a webfont, a generated image, a second saturated hue, a gradient surface, a new public component family, a consumer build step, fabricated metrics or adoption claims, an em dash anywhere in page copy or metadata.

## Constraints

Use existing tokens and components; keep page CSS scoped to `examples/home.css` so other examples do not inherit it. The sheet page and any new maintainer script follow the repository's generator and check conventions. Run the generation, token-export, contrast, repository-contract, whitespace, and browser checks. Extend `tests/` with browser coverage for the strip, sheet selection, the seams switch, no-JavaScript baseline, 320px, enlarged type, RTL, forced colors, and every palette in light, dark, and auto. Run the design detector on changed files and fix what is mechanical. Record the change under Unreleased in `CHANGELOG.md` and regenerate the changelog page.

## Decided with the user

Headline: "One system. Five inks.", chosen on October 30, 2026 over the 3.10.0 line "Build interfaces with character." The title and social metadata follow it.

## Calls made by the author

Iframes for the five sheets rather than scoped CSS, because each variant overrides 14 or 15 brand tokens including derived tints, and scoping would duplicate them. Inline `srcdoc` documents rather than a new sheet page, because every route check, stamp check, and directory test derives the page inventory from the `examples/` directory, and a 21st file would need either carve-outs in shared checks or a place in the directory and the root starter. A three-token diff with a count rather than the full override list, so the strip stays short on a phone and the drift guard has one format. Seams on by default. One callout per part. No hero eyebrow. The headline's one italic word is the page's only serif italic, set in `--accent-ink` as the root starter and the landing example already do.

## Left to the builder

Exact callout wording. The sheet markup inside each `srcdoc`, and how theme and direction propagate into the sheet documents. Whether the diff drift guard is a test or a generator with `--check`. Breakpoint values. Status message copy. Test file layout.

## Acceptance

The page passes when every item in Constraints runs clean, all 20 routes are linked from this page and the root starter, both anchors resolve, the five sheets show five palettes in light and dark, selecting a sheet changes the page palette and announces it, the seams switch shows and hides every callout, the no-JavaScript baseline shows the five sheets in their own palettes, the page itself in canonical, and selectable adoption snippets, and light, dark, mobile, and desktop screenshots have been reviewed before release.

## Build notes

Recorded after the finish review on October 30, 2026. These refine the composition above without changing scope or acceptance.

The opening is two columns above 64rem: the headline and its callout on the left, the lede and actions on the right, aligned to the baseline, so the whole press sheet lands inside a 1440x900 first viewport. The strip is one ruled sheet rather than five cards: 1.5px rules above and below, 1.5px dividers between butted impressions, no corner radius. Each sheet opens with its palette name and an ink dot in its own accent instead of an eyebrow; the plate keeps the page's one `.eyebrow` as a caption row at its bottom edge, where no heading follows it. The pick buttons sit in their own row beneath the strip, which also lets a phone show all five names without sideways scrolling; phone impressions are 72vw wide so the next one peeks. The picked impression is outlined in its own ink: picking a sheet re-inks the page, so the outline uses `--accent` and needs no literal color. The sheet tables use short row labels (Files, Families, Palettes) so nothing wraps at the strip's width. The seam marker is a short 1.5px rule in the accent text color, and the directory no longer claims that its ordinals are addresses.
