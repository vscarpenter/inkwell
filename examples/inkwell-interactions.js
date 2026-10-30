/* =====================================================================
   Inkwell — optional interaction recipes.
   Version: 3.9.0

   Dependency-free progressive enhancement for the components whose
   behavior cannot live in CSS alone: tabs, carousel controls,
   declarative native-dialog triggers, tooltip dismissal, and action menus. Static styles do not
   depend on this file.

   Auto-initializes the document and exposes:
     window.InkwellInteractions.init(root)
   Initialization is idempotent, including for dynamically added UI.
   ===================================================================== */
(function (window, document) {
  "use strict";

  function all(root, selector) {
    var matches = root.matches && root.matches(selector) ? [root] : [];
    return matches.concat(Array.prototype.slice.call(root.querySelectorAll(selector)));
  }

  function initTabs(root) {
    all(root, "[data-tabs]").forEach(function (tablist) {
      if (tablist.dataset.inkwellTabsReady === "true") return;
      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]')).filter(function (tab) {
        return tab.closest('[role="tablist"]') === tablist;
      });
      if (!tabs.length) return;

      function available(tab) {
        return !tab.disabled && tab.getAttribute("aria-disabled") !== "true";
      }

      function activate(tab, moveFocus) {
        if (!available(tab)) return;
        tabs.forEach(function (candidate) {
          var selected = candidate === tab;
          candidate.setAttribute("aria-selected", String(selected));
          candidate.tabIndex = selected ? 0 : -1;
          var panelId = candidate.getAttribute("aria-controls");
          var panel = panelId ? candidate.ownerDocument.getElementById(panelId) : null;
          if (panel) {
            panel.hidden = !selected;
            // Text-only panels need a Tab stop; preserve author choices.
            if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0;
          }
        });
        if (moveFocus) tab.focus();
      }

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () { activate(tab, false); });
        tab.addEventListener("keydown", function (event) {
          if (event.target !== tab || !available(tab)) return;
          var enabled = tabs.filter(available);
          var index = enabled.indexOf(tab);
          var vertical = tablist.getAttribute("aria-orientation") === "vertical";
          var rtl = window.getComputedStyle(tablist).direction === "rtl";
          var forward = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
          var backward = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
          var next = null;
          if (event.key === forward) next = enabled[(index + 1) % enabled.length];
          else if (event.key === backward) next = enabled[(index - 1 + enabled.length) % enabled.length];
          else if (event.key === "Home") next = enabled[0];
          else if (event.key === "End") next = enabled[enabled.length - 1];
          if (!next) return;
          event.preventDefault();
          activate(next, true);
        });
      });

      var initial = tabs.find(function (tab) {
        return available(tab) && tab.getAttribute("aria-selected") === "true";
      }) || tabs.find(available);
      if (initial) activate(initial, false);
      else tabs.forEach(function (tab) { tab.tabIndex = -1; });
      tablist.dataset.inkwellTabsReady = "true";
    });
  }

  function initCarousels(root) {
    all(root, "[data-carousel]").forEach(function (carousel) {
      if (carousel.dataset.inkwellCarouselReady === "true") {
        carousel.__inkwellCarouselRefresh();
        return;
      }
      var track = carousel.querySelector(".carousel-track");
      var slides = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-slide"));
      var controls = carousel.querySelector(".carousel-controls");
      if (!track || !controls || slides.length < 2) return;

      var prev = controls.querySelector("[data-carousel-prev]");
      var next = controls.querySelector("[data-carousel-next]");
      var dotsWrap = controls.querySelector(".carousel-dots");
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      var dots = [];
      var current = 0;
      var target = 0;
      var navigating = false;

      function labelDots() {
        var dotLabel = carousel.getAttribute("data-carousel-dot-label") || "Go to slide {current} of {total}";
        var language = carousel.closest("[lang]");
        var numbers;
        try { numbers = new Intl.NumberFormat(language ? language.lang : undefined); }
        catch (_) { numbers = new Intl.NumberFormat(); }
        dots.forEach(function (dot, index) {
          dot.setAttribute("aria-label", dotLabel.replace(/\{current\}/g, numbers.format(index + 1)).replace(/\{total\}/g, numbers.format(slides.length)));
        });
      }

      if (dotsWrap) {
        dotsWrap.replaceChildren();
        slides.forEach(function (_, index) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "carousel-dot";
          dot.addEventListener("click", function () { goTo(index); });
          dotsWrap.appendChild(dot);
          dots.push(dot);
        });
      }

      function setDisabled(button, alternate, disabled) {
        if (!button) return;
        if (disabled && document.activeElement === button && alternate) alternate.focus();
        button.disabled = disabled;
      }

      function sync(index) {
        current = index;
        dots.forEach(function (dot, dotIndex) {
          if (dotIndex === index) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
        setDisabled(prev, next, index === 0);
        setDisabled(next, prev, index === slides.length - 1);
      }

      function goTo(index) {
        index = Math.max(0, Math.min(slides.length - 1, index));
        target = index;
        navigating = true;
        sync(index);
        track.scrollTo({ left: track.scrollLeft + distanceFromStart(slides[index]), behavior: reduced.matches ? "auto" : "smooth" });
      }

      // Viewport geometry works for negative RTL scroll offsets, nested
      // offset parents, borders, and variable slide widths alike.
      function distanceFromStart(slide) {
        var rect = track.getBoundingClientRect();
        var item = slide.getBoundingClientRect();
        var style = window.getComputedStyle(track);
        return style.direction === "rtl"
          ? item.right - rect.right + parseFloat(style.borderRightWidth)
          : item.left - rect.left - parseFloat(style.borderLeftWidth);
      }

      track.addEventListener("scroll", function () {
        var index = slides.reduce(function (nearest, slide, candidate) {
          return Math.abs(distanceFromStart(slide)) < Math.abs(distanceFromStart(slides[nearest])) ? candidate : nearest;
        }, 0);
        if (index !== current && index >= 0 && index < slides.length) {
          sync(index);
        }
        if (index === target && Math.abs(distanceFromStart(slides[index])) < 2) navigating = false;
        if (!navigating) target = index;
      }, { passive: true });
      function manualScroll() { navigating = false; target = current; }
      track.addEventListener("wheel", manualScroll, { passive: true });
      track.addEventListener("pointerdown", manualScroll, { passive: true });

      if (prev) prev.addEventListener("click", function () { goTo(target - 1); });
      if (next) next.addEventListener("click", function () { goTo(target + 1); });

      carousel.addEventListener("keydown", function (event) {
        if (event.target.closest("input, textarea, select")) return;
        var destination = null;
        var rtl = window.getComputedStyle(track).direction === "rtl";
        if (event.key === "ArrowRight") destination = target + (rtl ? -1 : 1);
        else if (event.key === "ArrowLeft") destination = target + (rtl ? 1 : -1);
        else if (event.key === "Home") destination = 0;
        else if (event.key === "End") destination = slides.length - 1;
        if (destination === null) return;
        event.preventDefault();
        goTo(destination);
      });

      controls.removeAttribute("hidden");
      sync(0);
      carousel.__inkwellCarouselRefresh = function () { labelDots(); goTo(target); };
      // Preserve the selected chapter when font preferences or the viewport
      // change the track's size; direction switches can call init() again.
      var trackWidth = track.clientWidth;
      new ResizeObserver(function () {
        if (track.clientWidth === trackWidth) return;
        trackWidth = track.clientWidth;
        carousel.__inkwellCarouselRefresh();
      }).observe(track);
      labelDots();
      carousel.dataset.inkwellCarouselReady = "true";
    });
  }

  function initDialogs(root) {
    all(root, "[data-dialog-open]").forEach(function (trigger) {
      if (trigger.dataset.inkwellDialogReady === "true") return;
      var dialogId = trigger.getAttribute("data-dialog-open");
      var dialog = dialogId ? trigger.ownerDocument.getElementById(dialogId) : null;
      if (!dialog || dialog.nodeName !== "DIALOG") return;

      trigger.addEventListener("click", function () {
        var menuPanel = trigger.closest(".menu-panel");
        dialog.__inkwellTrigger = menuPanel && menuPanel.__inkwellMenuTrigger || trigger;
        if (!dialog.open) dialog.showModal();
      });
      trigger.dataset.inkwellDialogReady = "true";
    });

    all(root, "dialog").forEach(function (dialog) {
      if (dialog.dataset.inkwellDialogReady === "true") return;
      dialog.querySelectorAll("[data-dialog-close]").forEach(function (control) {
        control.addEventListener("click", function () {
          if (dialog.open) dialog.close(control.value || "");
        });
      });
      dialog.addEventListener("close", function () {
        var trigger = dialog.__inkwellTrigger;
        if (trigger && trigger.isConnected) trigger.focus();
        dialog.__inkwellTrigger = null;
      });
      dialog.dataset.inkwellDialogReady = "true";
    });
  }

  function positionTooltip(tooltip) {
    var viewport = window.visualViewport;
    var leftEdge = viewport ? viewport.offsetLeft : 0;
    var topEdge = viewport ? viewport.offsetTop : 0;
    var width = viewport ? viewport.width : window.innerWidth;
    var height = viewport ? viewport.height : window.innerHeight;
    var margin = 16;
    tooltip.style.setProperty("--_tooltip-max-width", Math.max(1, width - margin * 2) + "px");
    var style = window.getComputedStyle(tooltip, "::after");
    var bubbleWidth = parseFloat(style.width);
    var bubbleHeight = parseFloat(style.height);
    if (!Number.isFinite(bubbleWidth) || !Number.isFinite(bubbleHeight)) return;
    var rect = tooltip.getBoundingClientRect();
    var centered = rect.left + rect.width / 2 - bubbleWidth / 2;
    var clamped = Math.max(leftEdge + margin, Math.min(centered, leftEdge + width - margin - bubbleWidth));
    // Position directly: translating a centered bubble back into the viewport
    // can retain its original overflow area in mobile Chromium.
    var borderLeft = parseFloat(window.getComputedStyle(tooltip).borderLeftWidth) || 0;
    tooltip.style.setProperty("--_tooltip-left", (clamped - rect.left - borderLeft) + "px");
    tooltip.style.setProperty("--_tooltip-transform", "none");
    var above = rect.top - topEdge - margin;
    var below = topEdge + height - rect.bottom - margin;
    tooltip.dataset.inkwellTooltipSide = bubbleHeight > above && below > above ? "below" : "above";
  }

  function initTooltips(root) {
    all(root, ".tooltip[data-tooltip]").forEach(function (tooltip) {
      if (tooltip.dataset.inkwellTooltipReady === "true") return;
      function reset() {
        tooltip.removeAttribute("data-inkwell-tooltip-dismissed");
        positionTooltip(tooltip);
      }
      tooltip.addEventListener("pointerenter", reset);
      tooltip.addEventListener("focusin", reset);
      tooltip.dataset.inkwellTooltipReady = "true";
    });
  }

  var tooltipFrame = null;
  function repositionTooltips() {
    if (tooltipFrame !== null) return;
    tooltipFrame = window.requestAnimationFrame(function () {
      all(document, ".tooltip[data-tooltip]").forEach(function (tooltip) {
        if (tooltip.matches(":hover, :focus-within")) positionTooltip(tooltip);
      });
      tooltipFrame = null;
    });
  }
  window.addEventListener("resize", repositionTooltips);
  document.addEventListener("scroll", repositionTooltips, { capture: true, passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", repositionTooltips);
    window.visualViewport.addEventListener("scroll", repositionTooltips);
  }

  // Escape also works for pointer-opened hints without moving focus. Do not
  // consume the event: native dialogs retain their normal Escape behavior.
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    all(document, ".tooltip[data-tooltip]").forEach(function (tooltip) {
      if (tooltip.matches(":hover, :focus-within")) tooltip.setAttribute("data-inkwell-tooltip-dismissed", "");
    });
  });

  var activeMenu = null;
  var menuSequence = 0;
  var menuFrame = null;
  var menuTokens = ["--paper", "--slate", "--gray-100", "--gray-300", "--gray-500", "--accent-ink", "--border", "--border-hair", "--r-xs", "--r-sm", "--sp-1", "--sp-2", "--sp-3", "--sans", "--z-overlay"];

  function initMenus(root) {
    all(root, "[data-menu]").forEach(function (menu) {
      if (menu.__inkwellMenu) { menu.__inkwellMenu.refresh(); return; }
      var children = Array.prototype.slice.call(menu.children);
      var trigger = children.find(function (el) { return el.matches("button[data-menu-trigger]"); });
      var panel = children.find(function (el) { return el.matches(".menu-panel"); });
      if (!trigger || !panel) return;

      function menuItems() {
        return Array.prototype.slice.call(panel.querySelectorAll("button.menu-item, a.menu-item[href]")).filter(function (item) {
          return item.closest(".menu-panel") === panel;
        });
      }
      function items() {
        return menuItems().filter(function (item) {
          if (item.disabled) return false;
          for (var node = item; node && node !== panel; node = node.parentElement) {
            if (node.hidden || node.inert || window.getComputedStyle(node).display === "none") return false;
          }
          return window.getComputedStyle(item).visibility !== "hidden";
        });
      }
      if (!items().length) return;

      function identify(el) {
        if (!el.id) {
          do { el.id = "inkwell-menu-" + (++menuSequence); } while (document.getElementById(el.id) !== el);
        }
      }
      identify(trigger);
      identify(panel);
      var nativePopover = "popover" in window.HTMLElement.prototype && typeof panel.showPopover === "function";
      var nativeInvoker = nativePopover && "commandForElement" in window.HTMLButtonElement.prototype;
      var anchor = nativePopover && window.CSS && window.CSS.supports("anchor-name", "--inkwell-menu")
        && window.CSS.supports("position-area", "block-end span-inline-end") && window.CSS.supports("position-try-fallbacks", "flip-block");
      var pendingFocus = null;
      var typeBuffer = "";
      var lastTyped = 0;
      var marker = null;
      var originalStyle = null;
      var originalLanguage = null;
      var localTokens = {};
      var portaledForms = [];
      var resizeObserver = window.ResizeObserver ? new window.ResizeObserver(repositionMenu) : null;
      var anchorName = "--inkwell-menu-" + (++menuSequence);
      var useAnchor = anchor;

      function isOpen() { return nativePopover ? panel.matches(":popover-open") : !panel.hidden; }
      function contains(target) { return menu.contains(target) || panel.contains(target); }
      function disabled(item) { return item.disabled || item.getAttribute("aria-disabled") === "true"; }
      function lowercase(value) {
        var language = menu.closest("[lang]");
        try { return value.toLocaleLowerCase(language && language.lang || undefined); }
        catch (error) { return value.toLocaleLowerCase(); }
      }

      function inheritPortal() {
        var style = window.getComputedStyle(menu);
        menuTokens.forEach(function (name) { panel.style.setProperty(name, localTokens[name] || style.getPropertyValue(name)); });
        panel.style.direction = panel.getAttribute("dir") || style.direction;
        panel.style.colorScheme = style.colorScheme;
        var language = menu.closest("[lang]");
        if (originalLanguage === null && language) panel.lang = language.lang;
      }

      function mount() {
        originalStyle = panel.getAttribute("style");
        originalLanguage = panel.getAttribute("lang");
        menuTokens.forEach(function (name) { localTokens[name] = panel.style.getPropertyValue(name); });
        portaledForms = [];
        panel.querySelectorAll("button").forEach(function (item) {
          if (!item.form || item.hasAttribute("form")) return;
          identify(item.form);
          var id = item.form.id;
          item.setAttribute("form", id);
          portaledForms.push({ item: item, id: id });
        });
        // Capture inherited values before moving out of a potentially clipped host.
        marker = document.createComment("Inkwell menu position");
        panel.before(marker);
        var host = trigger.closest("dialog[open]") || document.body;
        host.appendChild(panel);
        inheritPortal();
      }

      function unmount() {
        if (!marker) return;
        if (marker.parentNode) marker.parentNode.insertBefore(panel, marker);
        marker.remove();
        marker = null;
        portaledForms.forEach(function (entry) {
          if (entry.item.getAttribute("form") === entry.id) entry.item.removeAttribute("form");
        });
        portaledForms = [];
        if (originalStyle === null) panel.removeAttribute("style");
        else panel.setAttribute("style", originalStyle);
        if (originalLanguage === null) panel.removeAttribute("lang");
        else panel.setAttribute("lang", originalLanguage);
      }

      function reset() {
        trigger.setAttribute("aria-expanded", "false");
        menuItems().forEach(function (item) { item.tabIndex = -1; });
        pendingFocus = null;
        typeBuffer = "";
        if (resizeObserver) resizeObserver.disconnect();
        if (activeMenu === controller) activeMenu = null;
      }

      function close(restoreFocus) {
        var restore = restoreFocus && (panel.contains(document.activeElement) || document.activeElement === trigger);
        reset();
        if (restore && trigger.isConnected && !trigger.disabled) trigger.focus({ preventScroll: true });
        if (nativePopover) {
          if (isOpen()) panel.hidePopover();
        } else {
          panel.hidden = true;
          unmount();
        }
      }

      function position() {
        if (!isOpen()) return;
        if (!trigger.isConnected || !panel.isConnected) { close(false); return; }
        if (marker) inheritPortal();
        var viewport = window.visualViewport;
        var left = viewport ? viewport.offsetLeft : 0;
        var top = viewport ? viewport.offsetTop : 0;
        var width = viewport ? viewport.width : window.innerWidth;
        var height = viewport ? viewport.height : window.innerHeight;
        var margin = 8;
        var gap = 8;
        var rect = trigger.getBoundingClientRect();
        if (rect.bottom <= top || rect.top >= top + height || rect.right <= left || rect.left >= left + width) { close(false); return; }
        var above = Math.max(1, rect.top - top - margin - gap);
        var below = Math.max(1, top + height - margin - rect.bottom - gap);
        panel.style.setProperty("--_menu-max-inline", Math.max(1, width - margin * 2) + "px");
        panel.style.setProperty("--_menu-max-block", Math.max(above, below) + "px");
        if (useAnchor) {
          panel.dataset.inkwellMenuPosition = "anchor";
          var anchored = panel.getBoundingClientRect();
          var logicalX = window.getComputedStyle(menu).direction === "rtl" ? rect.right - anchored.width : rect.left;
          logicalX = Math.max(left + margin, Math.min(logicalX, left + width - margin - anchored.width));
          if (anchored.left >= left + margin && anchored.right <= left + width - margin
            && anchored.top >= top + margin && anchored.bottom <= top + height - margin
            && Math.abs(anchored.left - logicalX) < 2 && (anchored.bottom <= rect.top || anchored.top >= rect.bottom)) return;
          useAnchor = false;
        }
        // Also covers visual-viewport constraints that an anchor tactic cannot fit.
        panel.dataset.inkwellMenuPosition = "manual";
        var box = panel.getBoundingClientRect();
        var down = box.height <= below || below >= above;
        panel.style.setProperty("--_menu-max-block", (down ? below : above) + "px");
        box = panel.getBoundingClientRect();
        var rtl = window.getComputedStyle(menu).direction === "rtl";
        var x = rtl ? rect.right - box.width : rect.left;
        var y = down ? rect.bottom + gap : rect.top - gap - box.height;
        panel.style.setProperty("--_menu-left", Math.max(left + margin, Math.min(x, left + width - margin - box.width)) + "px");
        panel.style.setProperty("--_menu-top", Math.max(top + margin, Math.min(y, top + height - margin - box.height)) + "px");
      }

      function focusItem(item, pointer) {
        if (!item) return;
        items().forEach(function (candidate) { candidate.tabIndex = candidate === item ? 0 : -1; });
        item.focus({ preventScroll: true, focusVisible: !pointer });
        var box = item.getBoundingClientRect();
        var bounds = panel.getBoundingClientRect();
        var start = bounds.top + panel.clientTop;
        var end = start + panel.clientHeight;
        if (box.top < start) panel.scrollTop -= start - box.top;
        else if (box.bottom > end) panel.scrollTop += box.bottom - end;
      }

      function entered() {
        position();
        if (!isOpen()) return;
        if (resizeObserver) { resizeObserver.observe(trigger); resizeObserver.observe(panel); }
        repositionMenu();
        var available = items();
        if (pendingFocus) focusItem(pendingFocus === "last" ? available[available.length - 1] : available[0]);
        else if (!panel.contains(document.activeElement)) trigger.focus({ preventScroll: true, focusVisible: false });
        pendingFocus = null;
      }

      function prepare() {
        if (activeMenu && activeMenu !== controller) activeMenu.close(false);
      }

      function show() {
        prepare();
        useAnchor = anchor;
        if (nativePopover) panel.showPopover();
        else {
          mount();
          panel.hidden = false;
          trigger.setAttribute("aria-expanded", "true");
          activeMenu = controller;
          entered();
        }
      }

      function refresh() {
        menuItems().forEach(function (item) { item.setAttribute("role", "menuitem"); item.tabIndex = item === document.activeElement ? 0 : -1; });
        trigger.hidden = !items().length;
        if (!items().length || disabled(trigger)) close(true);
        else if (isOpen()) position();
      }

      function keys(event) {
        if (!isOpen() || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "Escape" || event.key === "Tab") {
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); }
          close(true);
          return;
        }
        var available = items();
        if (!available.length) { close(true); return; }
        var index = available.indexOf(document.activeElement);
        var next = null;
        if (event.key === "ArrowDown") next = available[(index + 1) % available.length];
        else if (event.key === "ArrowUp") next = available[(index - 1 + available.length) % available.length];
        else if (event.key === "Home") next = available[0];
        else if (event.key === "End") next = available[available.length - 1];
        else if ((event.key === "Enter" || event.key === " ") && index !== -1) {
          event.preventDefault();
          event.stopPropagation();
          if (!disabled(available[index])) available[index].click();
          return;
        } else if (event.key.length === 1 && event.key !== " ") {
          event.preventDefault();
          event.stopPropagation();
          var now = Date.now();
          typeBuffer = now - lastTyped > 700 ? event.key : typeBuffer + event.key;
          lastTyped = now;
          var query = lowercase(typeBuffer);
          var repeated = Array.from(query).every(function (character) { return character === query[0]; });
          if (repeated) query = query[0];
          for (var i = query.length > 1 ? 0 : 1; i <= available.length; i++) {
            var candidate = available[(index + i + available.length) % available.length];
            var label = lowercase((candidate.getAttribute("aria-label") || candidate.textContent).trim());
            if (label.startsWith(query)) { next = candidate; break; }
          }
        }
        if (!next) return;
        event.preventDefault();
        event.stopPropagation();
        pendingFocus = null;
        focusItem(next);
      }

      var controller = { close: close, contains: contains, position: position, refresh: refresh };
      menu.__inkwellMenu = controller;
      panel.__inkwellMenuTrigger = trigger;
      panel.setAttribute("role", "menu");
      panel.setAttribute("aria-labelledby", panel.getAttribute("aria-labelledby") || trigger.id);
      trigger.type = "button";
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-controls", panel.id);
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("commandfor", panel.id);
      trigger.setAttribute("command", "toggle-popover");
      panel.dataset.inkwellMenuReady = "true";
      menu.dataset.inkwellMenuReady = "true";
      if (anchor) {
        var names = window.getComputedStyle(trigger).getPropertyValue("anchor-name").trim();
        trigger.style.setProperty("anchor-name", names && names !== "none" ? names + ", " + anchorName : anchorName);
        panel.style.setProperty("position-anchor", anchorName);
      }
      if (nativePopover) {
        panel.setAttribute("popover", "auto");
        panel.addEventListener("beforetoggle", function (event) {
          if (event.newState === "closed") {
            if (panel.contains(document.activeElement) && trigger.isConnected && !trigger.disabled) trigger.focus({ preventScroll: true });
            reset();
          } else {
            useAnchor = anchor;
            panel.dataset.inkwellMenuPosition = "pending";
            trigger.setAttribute("aria-expanded", "true");
            // Track opening immediately: focus may leave before the queued toggle event.
            activeMenu = controller;
          }
        });
        panel.addEventListener("toggle", function () {
          if (!isOpen()) { reset(); return; }
          prepare();
          activeMenu = controller;
          entered();
        });
      } else panel.hidden = true;

      trigger.addEventListener("keydown", function (event) {
        if (disabled(trigger)) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          var edge = event.key === "ArrowUp" ? "last" : "first";
          if (isOpen() && panel.dataset.inkwellMenuPosition !== "pending") {
            pendingFocus = null;
            var available = items();
            focusItem(edge === "last" ? available[available.length - 1] : available[0]);
          } else {
            pendingFocus = edge;
            if (!isOpen()) trigger.click();
          }
        } else if (event.key === "Enter" || event.key === " ") pendingFocus = "first";
        else keys(event);
      });
      trigger.addEventListener("click", function (event) {
        if (disabled(trigger)) { event.preventDefault(); return; }
        if (!isOpen()) {
          prepare();
          if (event.detail === 0 && !pendingFocus) pendingFocus = "first";
        }
        if (!nativeInvoker) {
          event.preventDefault();
          if (isOpen()) close(true);
          else show();
        }
      });
      panel.addEventListener("keydown", keys);
      function itemFor(event) {
        var item = event.target.closest(".menu-item");
        return item && item.closest(".menu-panel") === panel ? item : null;
      }
      function blockDisabled(event) {
        var item = itemFor(event);
        if (item && disabled(item)) { event.preventDefault(); event.stopImmediatePropagation(); }
      }
      panel.addEventListener("click", blockDisabled, true);
      panel.addEventListener("auxclick", blockDisabled, true);
      panel.addEventListener("click", function (event) {
        var item = itemFor(event);
        if (!item || disabled(item)) return;
        menu.dispatchEvent(new window.CustomEvent("inkwell-menu-select", { bubbles: true, detail: { item: item, trigger: trigger, originalEvent: event } }));
        close(true);
      });
      panel.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover)").matches) return;
        var item = itemFor(event);
        if (item && items().includes(item) && document.activeElement !== item) focusItem(item, true);
      });
      refresh();
    });
  }

  function repositionMenu() {
    if (!activeMenu || menuFrame !== null) return;
    menuFrame = window.requestAnimationFrame(function () {
      menuFrame = null;
      if (activeMenu) activeMenu.position();
    });
  }
  document.addEventListener("pointerdown", function (event) {
    if (activeMenu && !activeMenu.contains(event.target)) activeMenu.close(true);
  });
  document.addEventListener("focusin", function (event) {
    if (activeMenu && !activeMenu.contains(event.target)) activeMenu.close(false);
  });
  document.addEventListener("scroll", repositionMenu, { capture: true, passive: true });
  window.addEventListener("resize", repositionMenu);
  window.addEventListener("blur", function () { if (activeMenu) activeMenu.close(false); });
  window.addEventListener("beforeprint", function () { if (activeMenu) activeMenu.close(false); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", repositionMenu);
    window.visualViewport.addEventListener("scroll", repositionMenu);
  }

  function init(root) {
    root = root || document;
    initTabs(root);
    initCarousels(root);
    initDialogs(root);
    initTooltips(root);
    initMenus(root);
  }

  window.InkwellInteractions = { init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(document); });
  else init(document);
})(window, document);
