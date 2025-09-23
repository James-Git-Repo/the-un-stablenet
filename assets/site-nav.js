# PURPOSE: Avoid double listeners that leave the menu stuck open (blocking hero)
# ──────────────────────────────────────────────────────────────────────────────
(function(){
  const selBtn = '[data-nav-toggle]';
  const selPanel = '[data-nav-panel]';

  function bind(){
    document.querySelectorAll(selBtn).forEach(btn => {
      if (btn.dataset.bound) return; // guard against double-bind
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const root = document.documentElement;
        root.classList.toggle('nav-open');
        const panel = document.querySelector(selPanel);
        if (panel) panel.setAttribute('aria-hidden', root.classList.contains('nav-open') ? 'false' : 'true');
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();


# ──────────────────────────────────────────────────────────────────────────────
