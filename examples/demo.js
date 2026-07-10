(function () {
  var root = document.documentElement;
  var saved = localStorage.getItem("inkwell-theme") || localStorage.getItem("theme-preview") || "auto";
  if (saved !== "light" && saved !== "dark") saved = "auto";
  var controls = Array.prototype.slice.call(document.querySelectorAll("[data-theme-choice]"));

  function applyTheme(choice) {
    if (choice === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", choice);
    }

    localStorage.setItem("inkwell-theme", choice);
    controls.forEach(function (control) {
      var active = control.getAttribute("data-theme-choice") === choice;
      control.classList.toggle("is-active", active);
      control.setAttribute("aria-pressed", String(active));
    });
  }

  controls.forEach(function (control) {
    control.addEventListener("click", function () {
      applyTheme(control.getAttribute("data-theme-choice"));
    });
  });

  applyTheme(saved);
})();

(function () {
  // KEEP IN SYNC with the palette IIFE in preview.html — preview.html cannot load this bundle.
  var PALETTES = {
    indigo:   null,                        // default — no extra stylesheet
    clay:     "variants/clay.css",
    sage:     "variants/sage.css",
    burgundy: "variants/burgundy.css",
    azure:    "variants/azure.css",
  };

  var paletteLink = null;

  function loadSheet(href) {
    var pre = document.getElementById("inkwell-palette-prepaint");
    if (pre) { pre.remove(); }
    if (paletteLink) { paletteLink.remove(); paletteLink = null; }
    if (!href) return;
    paletteLink = document.createElement("link");
    paletteLink.rel = "stylesheet";
    paletteLink.id = "inkwell-palette-css";
    paletteLink.href = href;
    document.head.appendChild(paletteLink);
  }

  function applyPalette(name) {
    if (!PALETTES.hasOwnProperty(name)) name = "indigo";
    loadSheet(PALETTES[name]);
    localStorage.setItem("inkwell-palette", name);
    var url = new URL(location.href);
    if (name === "indigo") url.searchParams.delete("palette");
    else url.searchParams.set("palette", name);
    history.replaceState(null, "", url.toString());
    document.querySelectorAll("[data-palette-choice]").forEach(function (btn) {
      var active = btn.getAttribute("data-palette-choice") === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  document.querySelectorAll("[data-palette-choice]").forEach(function (btn) {
    btn.addEventListener("click", function () { applyPalette(btn.getAttribute("data-palette-choice")); });
  });

  var fromUrl = new URLSearchParams(location.search).get("palette");
  var fromStorage = localStorage.getItem("inkwell-palette");
  applyPalette(fromUrl || fromStorage || "indigo");
})();

(function () {
  // Carousel progressive enhancement: prev/next buttons, dot indicators,
  // arrow-key + Home/End navigation, aria state sync. The CSS core
  // (scroll-snap swipe/scrollbar) works without any of this — controls stay
  // [hidden] until wired, so no-JS users never see dead buttons.
  // KEEP IN SYNC with the carousel IIFE in preview.html — preview.html cannot load this bundle.
  document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
    var track = carousel.querySelector(".carousel-track");
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-slide"));
    var controls = carousel.querySelector(".carousel-controls");
    if (!track || !controls || slides.length < 2) return;

    var prev = controls.querySelector("[data-carousel-prev]");
    var next = controls.querySelector("[data-carousel-next]");
    var dotsWrap = controls.querySelector(".carousel-dots");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var dots = [];
    var current = 0; // slide the scroll position is on — drives dots/buttons
    var target = 0;  // navigation intent — lets rapid clicks chain mid-scroll

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("aria-label", "Go to slide " + (i + 1) + " of " + slides.length);
        dot.addEventListener("click", function () { goTo(i); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function setDisabled(btn, other, disabled) {
      if (!btn) return;
      if (disabled && document.activeElement === btn && other) other.focus();
      btn.disabled = disabled;
    }

    function sync(i) {
      current = i;
      dots.forEach(function (dot, d) {
        if (d === i) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      setDisabled(prev, next, i === 0);
      setDisabled(next, prev, i === slides.length - 1);
    }

    function goTo(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      target = i;
      track.scrollTo({ left: slides[i].offsetLeft, behavior: reduced.matches ? "auto" : "smooth" });
    }

    // The scroll position is the single source of truth for visual state —
    // dots and buttons follow the slide actually in view (covers swipe,
    // scrollbar, and mid-animation), and manual scrolling re-anchors target.
    track.addEventListener("scroll", function () {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== current && i >= 0 && i < slides.length) { target = i; sync(i); }
    }, { passive: true });

    if (prev) prev.addEventListener("click", function () { goTo(target - 1); });
    if (next) next.addEventListener("click", function () { goTo(target + 1); });

    carousel.addEventListener("keydown", function (e) {
      if (e.target.closest("input, textarea, select")) return;
      var to = null;
      if (e.key === "ArrowRight") to = target + 1;
      else if (e.key === "ArrowLeft") to = target - 1;
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = slides.length - 1;
      if (to === null) return;
      e.preventDefault();
      goTo(to);
    });

    controls.removeAttribute("hidden");
    sync(0);
  });
})();
