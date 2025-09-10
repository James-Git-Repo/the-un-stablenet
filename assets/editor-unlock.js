// assets/editor-unlock.js
// When the page enters editor mode, re-enable anything the viewer lock disabled.
(function () {
  function unlock() {
    if (document.documentElement.getAttribute("data-mode") !== "editor") return;

    // Mark the whole page as "allowed" so any viewer-blockers skip it
    if (document.body && !document.body.hasAttribute("data-view-allowed")) {
      document.body.setAttribute("data-view-allowed", "");
    }

    // Re-enable controls the viewer lock disabled
    document.querySelectorAll("[data-locked], [disabled], [aria-disabled='true']").forEach((el) => {
      try { el.disabled = false; } catch (_) {}
      el.removeAttribute("data-locked");
      el.removeAttribute("aria-disabled");
      el.style.pointerEvents = "";
      el.style.opacity = "";
    });

    // If your editor uses contenteditable, restore it on known editables
    document.querySelectorAll("[data-editable], .editable").forEach((el) => {
      // Don't force-enable things the app explicitly set to non-editable
      if (el.getAttribute("data-editable") === "false") return;
      el.setAttribute("contenteditable", "true");
      el.classList.add("edit-outline", "editable");
    });
  }

  // Run when mode flips and shortly after load (access-mode sets it asynchronously)
  const mo = new MutationObserver(unlock);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  document.addEventListener("DOMContentLoaded", () => setTimeout(unlock, 60));
})();
