// site-nav.js — burger toggle with guards
(() => {
  const BTN = '[data-nav-toggle]';
  const PANEL = '[data-nav-panel]';

  function bind(){
    document.querySelectorAll(BTN).forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const root = document.documentElement;
        const open = root.classList.toggle('nav-open');
        const panel = document.querySelector(PANEL);
        if (panel) panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') document.documentElement.classList.remove('nav-open');
    });

    document.querySelectorAll(`${PANEL} a`).forEach(a => {
      a.addEventListener('click', () => document.documentElement.classList.remove('nav-open'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
