# Container-aware findings and complete example indexes

The user approved implementation of container-aware layouts, starting with `.finding`, and asked for every example to be linked from index.html. Proceed through plan, implementation, and verification without additional approval gates. Preserve the existing palette, fonts, borders, dependency-free install, browser floor, and public finding markup. Keep this work unreleased; publishing is a separate request. VoiceOver and native Windows testing remain excluded.

## Finding contract

- Each `.finding` measures its own inline size with a named inline-size query container. Query its direct children, since a container cannot query itself. This preserves both list usage and standalone two-child findings without an extra wrapper.
- At up to 35rem of available width, the statistic and its explanation stack in source order with the existing 8px gap. Above that width, retain the 150px statistic column and 24px column gap. The root-relative breakpoint makes extra room for enlarged text.
- The statistic's bounded 2.75–4rem scale follows its component width using `cqi`, rather than the viewport. Text/source URLs can wrap without forcing horizontal overflow. Named queries must ignore unrelated outer containers and nested instances must use their own widths.
- Keep containment local to `.finding`, not page wrappers or every component. Its host supplies available width through normal block layout, stretched flex items, or defined grid tracks; intrinsically sized/shrink-to-fit hosts need an explicit available width. Block height remains content-driven. Browsers below the supported floor receive a usable stacked layout.
- Existing narrow and wide published uses must remain legible in light/dark/auto, all palettes, LTR/RTL, enlarged text, and print.

## Example navigation contract

The published gallery is `examples/index.html`; root `index.html` is a copyable starter. Keep those roles. Add a compact native-disclosure example directory and an Examples navigation link to the starter, linking every published HTML page directly. Keep the public gallery's complete route list, and link a narrow/wide finding demonstration in the existing showcase. Do not add another published route merely to demonstrate this change.

Discover the HTML inventory from the filesystem for both static and browser checks. Normalize local relative links and ignore fragments when testing route coverage; a self link belongs in the gallery navigation. A newly added route must fail the checks until both entry points link it. Preserve the 20-route inventory and current release pins.
