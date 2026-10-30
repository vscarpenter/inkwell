# Container-aware metric layouts

Approved scope: extend `.stat-card` and the existing dashboard metric group; reorganize the backlog. Keep 3.10.0 and record the work under Unreleased. No push or deployment in this task.

The existing card anatomy and primary border remain compatible. Each card supplies its own inline-size context for bounded, root-relative number sizing; values, labels, and deltas wrap rather than clip or abbreviate. Native block height grows with content. Available width must come from a block, stretched grid/flex track, or explicitly sized intrinsic host, as with findings. Uncontained stat-number markup retains its existing size.

The example-only `.metric-grid` uses intrinsic tracks with a 14rem preferred minimum, capped at the actual host width. It has no viewport breakpoint. This is an example layout, not a new public component family. Container queries are unnecessary for the group's column count; local container units are used only inside stat cards. Keep source order, palettes, and light/dark/auto behavior.

Show a wide metric group and a narrower group alongside the review queue on the dashboard. Add a narrow long-value stat card in the canonical showcase. No new JavaScript or dependencies. The catalog remains 39 families.

Acceptance: wide/medium/narrow groups reflow at the same viewport; card typography follows card width and stays stable when only the viewport changes; enlarged fonts reduce column count; long values/localized labels fit at 320px in both directions and all palette modes; grid/flex/nested contexts and print grow naturally; fallback number styling remains readable without container units. Preserve all 20 published routes and all repository gates.

Backlog: completed work belongs in Unreleased. Keep stronger status colors as the next comparison experiment and further container-aware work conditional on evidence. Move the mono-eyebrow and sky decisions into Standing design decisions with reopening criteria. Relative dark-accent colors remain future-major exploration.

## Implementation plan

1. Add browser regressions and reproduce the current narrow-host, fixed-type, and overflow failures.
2. Add local stat-card containment, bounded number sizing, wrapping, and tabular numerals; make demo metric groups intrinsic. Add dashboard/showcase examples and update the component contract and adoption documentation.
3. Regenerate mirrors/reference/changelog, reorganize the backlog, and run focused browser checks. Review the showcase and dashboard in light/dark/auto and at narrow widths.
4. Run every static gate and the full browser suite from an immutable snapshot, record results, and commit locally.

## Completion and verification

Implemented locally on October 30, 2026, on `codex/container-metrics`; the release remains 3.10.0 and the changes are Unreleased. No push or deployment was performed.

- The initial Chromium regressions reproduced a three-column group in a 500px host (expected two) and identical 44px number text in wide/narrow cards. Spec and regressions were committed before implementation.
- All **24 focused browser cases passed** across desktop Chromium, Firefox, WebKit, and mobile Chromium. The complete suite, run from a read-only archive of runtime commit `938105c`, finished with **519 passed, 13 existing skips, zero failures** in 1.1 minutes. Source logs are session-local: `/tmp/inkwell-metrics-red.log`, `/tmp/inkwell-metrics-focus.log`, and `/tmp/inkwell-metrics-full.log`.
- All repository gates passed: both token-export generators, five typed token-export tests, component/changelog generation, deployment placeholders, 290 contrast pairs, the 20-page/39-family system contract, and whitespace. No consumer interaction code, palette, entry-point API, or Tailwind tokens changed.
- Coverage checks actual geometry at wide/medium/narrow host widths, resizing and viewport independence, root-font growth, long mixed-direction values, localized/unbroken text, all five palettes in both explicit modes, grid/flex/nested hosts, print, forced colors, and the real dashboard/showcase destinations. Existing full-suite route checks retain light/dark/auto and enlarged-text coverage. The original stat-number declaration remains the fallback; stat numbers outside cards retain their size.
- Manual browser review covered dashboard light/dark/auto, wide and panel groups on the same screen, showcase light/dark/auto, and a 390px showcase view without document overflow. The local dashboard measured three filled 346.7px tracks in its 1072px main group and one 438.7px track in the side panel. Temporary viewport overrides were reset. VoiceOver and native Windows testing remain excluded at the user's request.
- The source detector was compared against 3.10.0 for all four changed UI sources. It reports **no new finding signatures**; counts changed from 3 errors/48 warnings to 3 errors/47 warnings. These are baseline findings, not a clean detector pass. Existing error reports point to the unchanged input outline reset (the system supplies focus-visible styling), the showcase search field (which has an explicit `for`/`id` label), and the inert Delete style demonstration. Existing mixed-unit reports conflict with the repository's deliberate structural-pixel/relative-text contract; existing table reports miss its `.tbl-scroll` wrapper and concern unchanged small sample tables. Tooltip duplicate `content` declarations are the existing accessible-text fallback. Unrelated inline-style/copy findings were left standing. No detector suppression was added and unrelated surfaces were not changed.
- Local screenshot evidence is in the ignored `.claude/screenshots/` directory: `container-metrics-comparison.jpg`, `container-metrics-dashboard-light.jpg`, `container-metrics-dashboard-dark.jpg`, and `container-metrics-showcase-light.jpg`. The dashboard preview remains open.

The backlog now lists status-treatment comparison as the next experiment, further container work as conditional, eyebrow/sky policies as standing decisions, and relative dark-accent derivation as future-major exploration. This review record is the only change after the tested runtime commit.
