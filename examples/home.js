// Homepage-only enhancements. Inkwell's public behavior lives in the companion;
// theme and palette persistence live in demo.js.
(function () {
  var root = document.documentElement;
  var sheets = Array.prototype.slice.call(document.querySelectorAll("iframe.home-sheet-frame"));
  var PALETTE_NAMES = {
    indigo: "Indigo & Cloud",
    clay: "Clay",
    sage: "Sage & Stone",
    burgundy: "Burgundy & Bone",
    azure: "Azure & Ink",
  };

  // The five sheets are srcdoc documents with their own palette. They follow
  // the page's manual theme and reading direction; auto mode stays native.
  function syncSheets() {
    var theme = root.getAttribute("data-theme");
    var dir = root.getAttribute("dir");
    sheets.forEach(function (frame) {
      var doc = frame.contentDocument;
      if (!doc || !doc.documentElement) return;
      if (theme) doc.documentElement.setAttribute("data-theme", theme);
      else doc.documentElement.removeAttribute("data-theme");
      if (dir) doc.documentElement.setAttribute("dir", dir);
      else doc.documentElement.removeAttribute("dir");
    });
  }
  sheets.forEach(function (frame) { frame.addEventListener("load", syncSheets); });
  new MutationObserver(syncSheets).observe(root, { attributes: true, attributeFilter: ["data-theme", "dir"] });
  syncSheets();

  document.querySelectorAll("[data-home-appearance]").forEach(function (group) {
    if (group.querySelector("[aria-pressed]")) group.hidden = false;
  });

  var paletteStatus = document.getElementById("home-palette-status");
  document.querySelectorAll("[data-palette-choice]").forEach(function (button) {
    button.addEventListener("click", function () {
      var name = PALETTE_NAMES[button.getAttribute("data-palette-choice")];
      if (paletteStatus && name) paletteStatus.textContent = "Palette: " + name + ". It follows you across the gallery.";
    });
  });
})();
