# Homepage implementation plan

1. Record the approved stacked composition and concrete behavior in `.ui-craft/spec.md`. Add browser regressions for adoption/navigation, the live specimen, clipboard success/failure, no-script content, responsive/RTL layout, and shared appearance-control contrast. Reproduce the missing homepage and contrast defect before implementation.
2. Rebuild `examples/index.html` with scoped `home.css` and a small `home.js` enhancement. Keep all 20 routes, old anchors, the root starter, stable install pins, and deployment placeholders. Use existing public components and the optional companion; no new public family, assets, dependencies, or consumer build step.
3. Correct shared demo appearance labels to use `--on-accent`; verify homepage and existing examples in all five palettes, manual/auto modes, and native forced colors.
4. Exercise the live specimen and copy actions, test failures and no-script access, and review desktop/mobile light/dark/RTL screenshots. Run detector and fold checks against the approved stacked class; fix meaningful findings without suppressing problems.
5. Update backlog/changelog/README and the design record, run all repository/export/contrast checks and the complete four-project browser suite, then commit locally. No version bump, push, or deployment in this task.
