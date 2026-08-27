/* =====================================================================
   Inkwell — optional interaction recipes.
   Version: 3.5.0

   Dependency-free progressive enhancement for the components whose
   behavior cannot live in CSS alone: tabs, carousel controls, and
   declarative native-dialog triggers. Static component styles do not
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
      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;

      function activate(tab, moveFocus) {
        tabs.forEach(function (candidate) {
          var selected = candidate === tab;
          candidate.setAttribute("aria-selected", String(selected));
          candidate.tabIndex = selected ? 0 : -1;
          var panelId = candidate.getAttribute("aria-controls");
          var panel = panelId ? candidate.ownerDocument.getElementById(panelId) : null;
          if (panel) panel.hidden = !selected;
        });
        if (moveFocus) tab.focus();
      }

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () { activate(tab, false); });
        tab.addEventListener("keydown", function (event) {
          var index = tabs.indexOf(tab);
          var next = null;
          if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
          else if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
          else if (event.key === "Home") next = tabs[0];
          else if (event.key === "End") next = tabs[tabs.length - 1];
          if (!next) return;
          event.preventDefault();
          activate(next, true);
        });
      });

      activate(tabs.find(function (tab) {
        return tab.getAttribute("aria-selected") === "true";
      }) || tabs[0], false);
      tablist.dataset.inkwellTabsReady = "true";
    });
  }

  function initCarousels(root) {
    all(root, "[data-carousel]").forEach(function (carousel) {
      if (carousel.dataset.inkwellCarouselReady === "true") return;
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

      if (dotsWrap) {
        dotsWrap.replaceChildren();
        slides.forEach(function (_, index) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "carousel-dot";
          dot.setAttribute("aria-label", "Go to slide " + (index + 1) + " of " + slides.length);
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
        sync(index);
        track.scrollTo({ left: slides[index].offsetLeft, behavior: reduced.matches ? "auto" : "smooth" });
      }

      track.addEventListener("scroll", function () {
        var index = Math.round(track.scrollLeft / track.clientWidth);
        if (index !== current && index >= 0 && index < slides.length) {
          target = index;
          sync(index);
        }
      }, { passive: true });

      if (prev) prev.addEventListener("click", function () { goTo(target - 1); });
      if (next) next.addEventListener("click", function () { goTo(target + 1); });

      carousel.addEventListener("keydown", function (event) {
        if (event.target.closest("input, textarea, select")) return;
        var destination = null;
        if (event.key === "ArrowRight") destination = target + 1;
        else if (event.key === "ArrowLeft") destination = target - 1;
        else if (event.key === "Home") destination = 0;
        else if (event.key === "End") destination = slides.length - 1;
        if (destination === null) return;
        event.preventDefault();
        goTo(destination);
      });

      controls.removeAttribute("hidden");
      sync(0);
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

  function init(root) {
    root = root || document;
    initTabs(root);
    initCarousels(root);
    initDialogs(root);
  }

  window.InkwellInteractions = { init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(document); });
  else init(document);
})(window, document);
