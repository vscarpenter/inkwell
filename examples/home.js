// Homepage-only enhancements. Inkwell's public behavior lives in the companion.
(function () {
  document.querySelectorAll("[data-home-appearance]").forEach(function (group) {
    if (group.querySelector("[aria-pressed]")) group.hidden = false;
  });
})();
