# Inkwell — Backlog

Things explicitly deferred, not yet decided, or worth exploring next. Separate the next experiment, conditional work, standing design decisions, and future-major exploration.

Move completed work into the relevant documentation and `CHANGELOG.md` under Unreleased until a release is published. The retired standalone Audit document's remaining follow-ups are tracked here directly.

## Next experiment

- **Compare dashboard status treatments** — prototype an opt-in treatment on the existing dashboard before adding `*-strong` tokens. Existing `--olive-dark`, `--warning-dark`, and `--rust` already provide readable status colors. Keep the muted defaults and text/icon cues; add alternatives only if the comparison demonstrates a useful distinction. A decision to retain the existing treatment is a valid outcome.

## Needs a demonstrated use case

- **Further container-aware components** — `.finding` shipped in 3.8.0; stat cards and intrinsic metric groups are completed in current source under Unreleased. Choose another component only when a concrete narrow-host case demonstrates a benefit. Prefer intrinsic layout when sufficient; keep containment local and verify sizing, enlarged text, and nested contexts.

## Standing design decisions

- **Keep both eyebrow roles** — `.eyebrow` serves mono product/dashboard metadata; `.eyebrow-serif` serves editorial kickers. Reopen the proposal to replace mono entirely only if consumer feedback demonstrates that the two-role approach is insufficient. The editorial alternative (option B of the retired audit's item #1) already shipped.
- **Keep one interactive brand accent** — `--accent`, `--accent-ink`, and `--on-accent` separate fill, text, and label jobs. Keep `--sky` informational. Reopen a secondary interactive hue only for a demonstrated secondary-action need, with a complete text/fill/focus/state contrast contract.

## Future major

- **Relative color syntax for lifted dark accents** (`oklch(from var(--accent) …)`) — exploratory, not committed. Rejected for 3.0 because deriving dark values would replace hand-tuned contrast work. Reconsider only with a demonstrated benefit, a browser-support review, and a fresh contrast pass across every palette and mode. The `light-dark()` / `color-mix()` architecture itself already shipped in 3.0.0.
