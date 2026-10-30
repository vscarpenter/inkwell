// Homepage-only demonstrations. Inkwell's public behavior lives in the companion.
(function () {
  var title = document.getElementById("home-project-name");
  var updates = document.getElementById("home-updates");
  var preview = document.getElementById("home-preview");
  var reset = document.getElementById("home-reset");
  var status = document.getElementById("home-preview-status");

  title.addEventListener("input", function () { title.setCustomValidity(""); });
  preview.addEventListener("click", function () {
    title.setCustomValidity(title.value.trim() ? "" : "Enter a project name.");
    if (!title.reportValidity()) return;
    status.textContent = "Preview ready for “" + title.value.trim() + "”. Notifications " + (updates.checked ? "on." : "off.");
  });
  title.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); preview.click(); }
  });
  reset.addEventListener("click", function () {
    title.value = title.defaultValue;
    title.setCustomValidity("");
    updates.checked = updates.defaultChecked;
    status.textContent = "Example reset.";
  });
  preview.hidden = false;
  reset.disabled = false;

  document.querySelectorAll("[data-home-appearance]").forEach(function (group) {
    if (group.querySelector("[aria-pressed]")) group.hidden = false;
  });

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
