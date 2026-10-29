# Verification and token portability plan

1. Reproduce edge-tooltip and long-label gaps; discover all 20 routes in the browser suite. Start Linux Firefox verification in the existing local container environment.
2. Implement the smallest compatible tooltip placement/label-resilience changes, synchronize mirrors, and verify their interaction contract.
3. Add semantic aliases and optional typed DTCG export with palette/mode and reference validation. Update consumer guidance, generators, and CI in the same change.
4. Run the full matrix, native Safari zoom and available VoiceOver checks, and bounded visual/hook review. Record results and external-platform limits accurately, then commit the completed work locally.

Completed: see the [completion review](../reviews/2026-10-29-completion-review.md). The user explicitly excluded VoiceOver and Windows testing during execution; neither is counted as a passing check. Linux Firefox and native Safari 200% keyboard checks were completed, and the remaining type/bidi decisions have a separate measurement plan.
