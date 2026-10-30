# Implementation plan

1. Add browser regressions for palette-matched native chevrons and primary-button hover contrast; reproduce the light-chevron and Clay dark-hover failures.
2. Lift Clay's dark hover color and add light-mode chevron overrides to the four palette files, preserving dark/auto overrides and native controls.
3. Synchronize exports and mirrors, update the design-system explanation and unreleased changelog, and organize the backlog into the agreed groups.
4. Run all static/export/contrast gates and the four-project ephemeral browser suite, including a working Linux Firefox runtime. Review light/dark/auto showcase and palette comparison views, save screenshots, and commit the completed work locally.
