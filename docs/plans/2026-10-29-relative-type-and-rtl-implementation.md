# Implementation plan

1. Capture the current 16px type/control values and reproduce font-preference and RTL carousel/layout failures in an isolated Arabic/Hebrew fixture.
2. Migrate text sizes to relative units, retain structural pixels, preserve legacy numeric export fields, and prove the benefit at larger browser font settings.
3. Convert directional layout to logical properties, preserve necessary physical geometry, implement direction-aware carousel navigation and icon treatment, and verify nested LTR/RTL scopes.
4. Exercise all published routes at 1280/640/320px with enlarged text and both directions. Fix content-dependent growth/overflow at its source. Review actual Arabic/Hebrew rendering and default-size parity.
5. Synchronize mirrors, manifest, consumer/agent guidance, exports and changelog. Run all static and browser gates, record the measurements and limits, and commit the completed work locally.
