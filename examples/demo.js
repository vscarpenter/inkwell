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
