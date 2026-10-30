# Inkwell — Backlog

Things explicitly deferred, not yet decided, or worth exploring next. Items are grouped by readiness: the next substantial feature, ideas that need a demonstrated consumer benefit, and future-major exploration.

Move completed work into the relevant documentation and `CHANGELOG.md` under Unreleased until a release is published. The retired standalone Audit document's remaining follow-ups are tracked here directly.

## Next

No additional component work is scheduled. The action menu is complete in current source and tracked under Unreleased in `CHANGELOG.md`.

## Needs a demonstrated use case

- **Further container-aware components** — `.finding` shipped in 3.8.0. Apply the same approach elsewhere only when a concrete narrow-host case demonstrates a benefit; keep containment local and verify intrinsic sizing, enlarged text, and nested contexts.
- **Stronger dashboard status colors** — prototype an opt-in treatment on a real dashboard before adding `*-strong` tokens. Existing `--olive-dark`, `--warning-dark`, and `--rust` already provide readable status colors. Add alternatives only when the comparison demonstrates a useful distinction, retaining muted editorial defaults and text/icon cues for meaning.
- **Replace mono `.eyebrow` entirely** — retain the existing mono product/dashboard role and `.eyebrow-serif` editorial alternative. Revisit only if consumer feedback shows the two-role approach is insufficient. This was option A of the retired audit's item #1; option B already shipped.
- **Promote `--sky` to secondary interactive** — require a concrete secondary-action need and a full text/fill/focus/state contrast contract before introducing a second interactive hue. The existing `--accent`, `--accent-ink`, and `--on-accent` already separate fill, text, and label jobs; preserve the one-brand-accent principle.

## Future major

- **Relative color syntax for lifted dark accents** (`oklch(from var(--accent) …)`) — exploratory, not committed. Rejected for 3.0 because deriving dark values would replace hand-tuned contrast work. Reconsider only with a demonstrated benefit, a browser-support review, and a fresh contrast pass across every palette and mode. The `light-dark()` / `color-mix()` architecture itself already shipped in 3.0.0.
