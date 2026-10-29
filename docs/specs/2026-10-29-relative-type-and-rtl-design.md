# Relative typography and bidirectional components

The user approved tackling the existing measurement plan on October 29. Continue measurement → implementation → verification without separate approval gates. Preserve the current platform fonts, colors, spacing, 1.5px optical borders, dependency-free install, and 16px default appearance. VoiceOver and Windows remain excluded from this review by the user's prior instruction.

## Typography contract

- Leave the browser's root font size untouched. Express the nine public type tokens and component/example text sizes in `rem`, with contextual `em` sizing and unitless leading where appropriate. Keep structural pixels as pixels.
- Compare 16/20/24px root settings and a 32px enlarged-text case at 1280/640/320px. Test real Firefox font preferences separately from CSS-based cross-engine layout fixtures.
- Text-bearing controls and example compositions must grow and wrap. Tables/code may scroll inside named containers; ordinary text must remain available.
- Preserve `tokens.json` numeric typography `px` fields as 16px-reference values, add the actual CSS values, and export honest `rem` dimensions in DTCG. Document the unit migration and local overrides. Tailwind continues using the same token aliases.

## Direction contract

- Use HTML `dir` for document/component direction and `lang` for script-specific typography. Canonical layout uses logical start/end properties. Nested opposite-direction islands retain their own direction.
- Mirror select artwork, switch travel, callout/timeline spines, close/copy affordances, table alignment, and authored directional icons. Keep geometric tooltip coordinates, centered artwork, and nondirectional symbols physical where their meaning requires it.
- Carousels navigate by slide geometry rather than assuming positive `scrollLeft` or an `offsetLeft` origin. Arrows follow the track's direction; Home/End follow document slide order. Buttons, dots, manual scrolling, resizing, and repeated initialization retain selection and focus.
- Use `bdi`, `dir="auto"`, or explicit LTR islands for unknown names, identifiers, URLs, and code as appropriate. Authors supply localized strings and accessible names; the CSS system supplies layout and interaction support.
- Arabic/Persian/Urdu text must not inherit Latin tracking conventions; verify Arabic/Hebrew mixed-content fixtures and nested direction scopes in all three desktop engines and mobile Chromium.

## Evidence and release boundary

Add failing regression cases before changing production behavior. Verify default-size parity, real Firefox preferences, component semantics/geometry, all 20 reference routes in both directions and enlarged settings, all palettes/modes, exports/schema, and visual samples. Record honest limits for native text-only zoom and assistive technology. Keep this work on its own branch; this request does not itself publish a new release or deployment.
