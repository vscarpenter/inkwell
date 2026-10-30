# Popover action menu

Implement the approved menu feature through design, plan, tests, implementation, and verification without additional approval gates. Preserve Inkwell's platform fonts, flat token-backed surfaces, 1.5px frame, browser floor (Chrome/Edge 123, Firefox 120, Safari 17.5), and dependency-free consumer install. Keep the work Unreleased at version 3.8.1; publishing is a separate request. VoiceOver and native Windows testing remain excluded.

## Public anatomy and progressive enhancement

- A `.menu[data-menu]` contains a native button marked `data-menu-trigger` and its next-sibling `.menu-panel`. The panel contains native buttons or links with `.menu-item` and native `<hr class="menu-separator">` separators. Commands may use normal form submission; destinations retain real `href` values.
- This first component is a single-level action menu. It is not a selection field, navigation disclosure, menubar, or form-containing popup. Use the existing select, disclosure, and dialog components for those patterns.
- The trigger starts `hidden` and the action list starts visible without `popover` or menu roles. If the optional companion is absent, ordinary links/buttons remain exposed in document order. Applications still supply command behavior and server-backed actions where no-script operation is required.
- Successful enhancement assigns IDs when missing, menu/button relationships, menu roles, and roving tabindex; then hides the panel and reveals the trigger. Explicit APG keyboard behavior supports the browser floor without requiring experimental focusgroup support. Repeated `InkwellInteractions.init(root)` is safe and refreshes dynamically changed items/direction.
- Feature-detect native Popover and use `popover="auto"` when available. Use command invokers where supported and the same click/keyboard contract through script otherwise. Unsupported browsers get an equivalent fixed-position popup with manual dismissal, without downloading a polyfill.
- Fallback panels temporarily move to the document body or their containing open dialog to escape clipping/transform ancestors. Preserve their inherited tokens, color scheme, language, and direction; restore the original DOM location when closed. Applications can observe `inkwell-menu-select` on the original wrapper in every backend; `event.detail.item` is the activated native element. Direct item listeners and native link/form defaults remain intact.

## Keyboard, focus, and dismissal

- Enter/Space on the trigger open and focus the first item. ArrowDown opens/enters at the first item; ArrowUp at the last. Pointer opening keeps focus on the trigger; another trigger click toggles closed.
- Up/Down move vertically and wrap; Home/End reach the first/last item. Typeahead matches localized labels, supports multi-character prefixes and repeated-letter cycling, and resets on close or after a short pause. Left/Right have no special meaning in this single-level vertical menu, including RTL.
- `aria-disabled="true"` items remain discoverable by arrow keys but cannot activate; native disabled buttons and hidden items are skipped. Separators are never focusable. Enter/Space activate an enabled item once.
- Escape closes and restores focus to the trigger. Tab/Shift+Tab close and follow normal document navigation from the trigger, without trapping focus or tabbing through hidden commands.
- Outside pointer interaction and focus movement close the menu without stealing focus from the user's destination. One Inkwell menu is open at a time. Opening a dialog or moving focus from an application's action handler must retain that new focus.
- Native toggle events synchronize expanded state and external native dismissals. Empty/invalid menus do not expose a dead trigger. Keyboard focus remains visibly outlined; active items scroll within the popup rather than moving the document.

## Placement and presentation

- Prefer logical CSS anchor placement below the trigger, aligned to inline start, with block/inline flip tactics where supported. Explicit unique anchors cover supported browsers predating implicit source anchors. If anchoring is absent or cannot fit the visible viewport, use measured positioning that flips vertically, clamps horizontally, and caps height with scrolling.
- Reposition on scroll, resize, visual-viewport changes, and explicit reinitialization. Close if the trigger leaves the visible viewport or is disconnected. Honor nested RTL/LTR scopes and enlarged text; do not cover the trigger merely to fit a long menu.
- Reuse paper/slate/neutrals, existing border/radius/space/z-index tokens, and a restrained active-trigger boundary. Opening and keyboard navigation are immediate. Coarse-pointer items reach 44px; forced colors use system colors; print omits the interactive menu.

## Verification and documentation

Add native, missing-Popover, missing-invoker, and missing-anchor regression coverage; test no-script baseline, commands/links, disabled items, typeahead, focus exits, dialogs, clipping ancestors, viewport edges, RTL, enlarged text, all palettes/modes, forced colors, print, and idempotence. Add the public family to the manifest and consumer docs, demonstrate it on existing pages, keep both indexes complete, synchronize source mirrors and generated files, and remove the completed backlog item.
