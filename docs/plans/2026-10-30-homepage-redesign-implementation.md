# Homepage implementation plan

Status: implemented and verified locally on October 30, 2026. Runtime changes are in `21d3817`; release remains 3.9.0 with the work recorded under Unreleased. No push or deployment was performed.

1. Record the approved stacked composition and concrete behavior in `.ui-craft/spec.md`. Add browser regressions for adoption/navigation, the live specimen, clipboard success/failure, no-script content, responsive/RTL layout, and shared appearance-control contrast. Reproduce the missing homepage and contrast defect before implementation.
2. Rebuild `examples/index.html` with scoped `home.css` and a small `home.js` enhancement. Keep all 20 routes, old anchors, the root starter, stable install pins, and deployment placeholders. Use existing public components and the optional companion; no new public family, assets, dependencies, or consumer build step.
3. Correct shared demo appearance labels to use `--on-accent`; verify homepage and existing examples in all five palettes, manual/auto modes, and native forced colors.
4. Exercise the live specimen and copy actions, test failures and no-script access, and review desktop/mobile light/dark/RTL screenshots. Run detector and fold checks against the approved stacked class; fix meaningful findings without suppressing problems.
5. Update backlog/changelog/README and the design record, run all repository/export/contrast checks and the complete four-project browser suite, then commit locally. No version bump, push, or deployment in this task.

## Verification record

- The initial regression run reproduced the old homepage/adoption flow and the Clay selected-label contrast failure (3.19:1). The first focused implementation run exposed an offscreen keyboard-test setup issue in WebKit: the existing menu deliberately closes when its trigger leaves the viewport. Scrolling the trigger into view before keyboard interaction corrected the test without weakening that behavior.
- The complete suite ran from a read-only `git archive` snapshot of `21d3817`, using Playwright 1.62.1 in its matching official container: **495 passed, 13 existing skips, zero failures** in 58.7 seconds. The 24 new cases cover adoption and all 20 routes, stacked geometry, blank-name validation, native controls, menu reset/focus restoration, clipboard success/denial/absence, no-script content, 320px width with 32px root type in both directions, forced colors, and every palette in light/dark/auto. Existing tests retain nested-direction and browser-fallback coverage for the public components. Full output: `/tmp/inkwell-home-full.log` (session-local).
- All generated-file gates passed: legacy and DTCG tokens, changelog/version stamps, component reference, deployment placeholders, and the system contract. All five token-export tests and all 290 contrast pairs passed; whitespace checks were clean. No consumer source API or root starter changed.
- The detector reports zero errors and zero warnings for each of `examples/index.html`, `examples/home.css`, and `examples/home.js`. Its missing-focus warning in the new CSS was fixed by matching the navigation and featured-link hover treatment on `:focus-visible`; no detector ignores were added.
- Manual browser review covered desktop/mobile light and dark views, the working specimen, keyboard reset and returned focus, selectable/wrapping adoption snippets, featured examples, and the grouped directory. RTL, enlarged text, forced colors, automatic color modes, and no-script behavior were verified by the automated browser suite. VoiceOver and native Windows testing remain excluded at the user's request.
- `check_fold` returned a **low-confidence `split` classification**, despite the approved stacked structure. The returned image shows a full-width introduction above the full-width specimen; its internal copy/fields use two columns. Read-only geometry at 1440px confirms introduction bottom and specimen top both at 508.164px, with both 1072px wide. A browser regression enforces the same stacked relationship. This is a documented classifier discrepancy, not a claimed automated fold pass; the approved composition was retained and nothing was suppressed.
- Local visual evidence is saved under the ignored `.claude/screenshots/` directory: `homepage-light-desktop.jpg`, `homepage-dark-desktop.jpg`, `homepage-dark-mobile.jpg`, and `homepage-light-setup.jpg`. The local homepage preview remains open; temporary viewport overrides were reset.

## Release follow-up: 3.10.0

The user subsequently authorized pushing and deploying this work as 3.10.0. The original Unreleased/local-only scope above records the completed implementation phase; this follow-up authorizes publication. Release preparation updates public headers, the manifest, generated exports and footers, agent/install pins, and the homepage copy regression. Historical component `since` versions remain intact.

Release checks exposed a generator gap: the canonical showcase/comparison sources and nested comparison mirror were outside its stamp loop. They are now generated too. A temporary-copy regression verified that `--check` rejects all four stale source/mirror footers and that regeneration restores matching copies. The repository-editing guidance in `CLAUDE.md` documents the expanded ownership.

The complete release suite ran from an immutable archive of `4022d61`: **495 passed, 13 existing skips, zero failures** in 57.3 seconds. All generated-file/contract gates, five token-export tests, 290 contrast pairs, and whitespace checks passed. Session-local output: `/tmp/inkwell-310-browser.log`. The subsequent commit changes this review record only.

## Finalize report — Inkwell homepage

**Ship verdict: READY.** No Critical or Major findings in the approved homepage slice. Source detector: zero errors and warnings in the HTML, scoped CSS, and page enhancement. All token categories are present, light/dark modes are authored explicitly, and the existing primitive/semantic/component token contracts remain intact.

| Pass | Review result |
|---|---|
| 1. Hierarchy | Primary headline, secondary adoption action, tertiary working specimen, quaternary navigation/footer. The dominant headline and stacked relationship match the approved screenshot and browser geometry checks. |
| 2. Type system | Platform serif/sans/mono roles, three weights, bounded relative display sizes, and tabular progress numerals. The brief's short UI copy does not require a long-prose measure. |
| 3. Surface stack | Authored canvas/paper/menu surfaces and native color schemes. Shadow-led elevation is deferred per brief principle 2: flat surfaces and 1.5px frames define Inkwell. |
| 4. Spacing rhythm | Token-based field, specimen, adoption, row, and section spacing maintain grouping; narrow/enlarged type wraps without page overflow. |
| 5. Iconography | Consistent 1.5px outline marks. Minor accepted: existing typographic link arrows retain the published directional-link convention; no new icon library is justified for this release. |
| 6. State coverage | Preview handles blank input, success, and reset; copy handles busy/success/denial/unavailable API. No-script content remains usable. Remote data loading, partial/conflict, and application offline states are not applicable to this static, nonpersistent specimen. |
| 7. Motion | Existing brief-approved feedback only; no added entrance effects or scroll choreography. Reduced-motion behavior is retained and tested. |
| 8. Microcopy | One Start building intent, specific copy/reset labels, actionable manual-copy feedback, explicit example progress and no-persistence guidance. |
| 9. Pixel honesty | Existing role-based radii, structural/divider borders, full-width specimen, and wrapping code/links survive the enlarged-type checks. Flat elevation is deferred per brief principle 2. |
| 10. Data formatting | Exact catalog/page counts, integer example progress, and provenance-oriented release/deployment metadata. No currency or live business metrics. |

The signature remains the actual working specimen under the short introduction; variance 6 and the Craft Read match. Value and Ease of Use have no outstanding findings. No design detector suppression was added. The previously documented low-confidence fold classification remains qualified by the screenshot and geometry evidence.
