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

  // Seams: the mono callouts naming each part's class and tokens. On by
  // default, not persisted; without this script they simply stay visible.
  var seams = document.getElementById("home-seams");
  function setSeams(on) {
    seams.setAttribute("aria-pressed", String(on));
    if (on) document.body.removeAttribute("data-seams");
    else document.body.setAttribute("data-seams", "off");
  }
  seams.addEventListener("click", function () { setSeams(seams.getAttribute("aria-pressed") !== "true"); });
  seams.hidden = false;

  // The specimen: preview a name, report a blank one inline, reset by menu.
  var name = document.getElementById("home-project-name");
  var previewButton = document.getElementById("home-preview");
  var resetItem = document.getElementById("home-reset");
  var status = document.getElementById("home-preview-status");

  function clearError() {
    name.removeAttribute("aria-invalid");
    name.classList.remove("is-error");
  }
  function preview() {
    var value = name.value.trim();
    if (!value) {
      name.setAttribute("aria-invalid", "true");
      name.classList.add("is-error");
      status.textContent = "Enter a project name.";
      name.focus();
      return;
    }
    status.textContent = 'Preview ready for "' + value + '".';
  }
  function reset() {
    name.value = name.defaultValue;
    clearError();
    status.textContent = "Example reset.";
  }
  name.addEventListener("input", clearError);
  name.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); preview(); }
  });
  previewButton.addEventListener("click", preview);
  resetItem.addEventListener("click", reset);
  previewButton.hidden = false;
  resetItem.disabled = false;

  // Copy buttons appear only when the clipboard API exists, report success
  // after the write resolves, and fall back to manual-copy guidance.
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") return;
  document.querySelectorAll("[data-home-copy]").forEach(function (button) {
    var source = document.getElementById(button.getAttribute("data-home-copy"));
    var feedback = document.getElementById(button.getAttribute("aria-describedby"));
    button.addEventListener("click", async function () {
      if (button.dataset.copying) return;
      button.dataset.copying = "true";
      feedback.textContent = "Copying…";
      try {
        await navigator.clipboard.writeText(source.textContent.trim());
        feedback.textContent = button.getAttribute("data-home-copied");
      } catch (error) {
        feedback.textContent = "Copy unavailable. Select the snippet and copy it manually.";
      } finally {
        delete button.dataset.copying;
      }
    });
    button.hidden = false;
  });
})();
