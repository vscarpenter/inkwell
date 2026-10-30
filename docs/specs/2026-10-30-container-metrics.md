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
