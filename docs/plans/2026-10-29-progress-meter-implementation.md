# Implementation plan

1. Add failing browser cases for native progress/meter semantics, visible fills, updates, direction, and user preferences.
2. Implement token-based CSS for both controls, including indeterminate progress and engine-specific meter painting. Keep the existing browser floor and zero-JavaScript core.
3. Add showcase and generated adoption examples. Synchronize the manifest, mirrors, component counts, consumer/agent guidance, and unreleased changelog.
4. Clean BACKLOG.md by removing completed items and separating independent remaining candidates without implementing deferred work.
5. Run static/export/contrast and full browser checks, inspect rendered light/dark/auto samples, record limits, and commit the completed work locally.
