/* =====================================================================
   Inkwell — optional interaction recipes.
   Version: 3.6.0

   Dependency-free progressive enhancement for the components whose
   behavior cannot live in CSS alone: tabs, carousel controls,
   declarative native-dialog triggers, and tooltip dismissal. Static styles do not
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
        dialog.__inkwellTrigger = trigger;
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

  function init(root) {
    root = root || document;
    initTabs(root);
    initCarousels(root);
    initDialogs(root);
    initTooltips(root);
  }

  window.InkwellInteractions = { init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(document); });
  else init(document);
})(window, document);
