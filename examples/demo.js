(function () {
  var root = document.documentElement;
  var saved = localStorage.getItem("inkwell-theme") || "auto";
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
