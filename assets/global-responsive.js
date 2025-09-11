/* ================= Global responsive JS ==================
   Adds device classes and a11y nav toggle. Use with:
   <button class="nav-toggle" data-nav-toggle aria-controls="primaryNav" aria-expanded="false">Menu</button>
   <nav id="primaryNav" class="nav-primary" data-nav-panel>...</nav>
   ========================================================= */

(function(){
  const html = document.documentElement;

  function setDeviceClasses(){
    const w = window.innerWidth;
    html.classList.toggle('mobile', w < 640);
    html.classList.toggle('tablet', w >= 640 && w < 1024);
    html.classList.toggle('desktop', w >= 1024);
  }
  setDeviceClasses();
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(setDeviceClasses, 120); });

  if (window.matchMedia('(pointer: coarse)').matches) html.classList.add('touch');

  // Nav toggle
  function bindNavToggle(){
    const toggles = document.querySelectorAll('[data-nav-toggle]');
    toggles.forEach(btn => {
      if (btn.__bound) return; btn.__bound = true;
      const targetId = btn.getAttribute('aria-controls');
      const panel = targetId ? document.getElementById(targetId) : document.querySelector('[data-nav-panel]');
      if(!panel) return;
      btn.addEventListener('click', (e)=>{
        e.preventDefault(); e.stopPropagation();
        const open = !document.body.classList.contains('nav-open');
        document.body.classList.toggle('nav-open', open);
        btn.setAttribute('aria-expanded', String(open));
        if(open){ panel.style.display='flex'; panel.focus?.(); } else { panel.style.display=''; }
      }, {capture:true});
    });
    // Close on escape or click-away
    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape'){ document.body.classList.remove('nav-open'); const t=document.querySelector('[data-nav-toggle][aria-expanded="true"]'); t?.setAttribute('aria-expanded','false'); const p=document.querySelector('[data-nav-panel]'); if(p) p.style.display=''; }
    });
    document.addEventListener('click', (e)=>{
      if(!document.body.classList.contains('nav-open')) return;
      const p = document.querySelector('[data-nav-panel]'); const b = document.querySelector('[data-nav-toggle]');
      if(!p || !b) return;
      if(!p.contains(e.target) && !b.contains(e.target)){
        document.body.classList.remove('nav-open'); b.setAttribute('aria-expanded','false'); p.style.display='';
      }
    });
  }
  bindNavToggle();
})();
document.addEventListener('DOMContentLoaded', () => {
  // Auto-inject a nav toggle if page lacks one
  const nav = document.querySelector('nav[aria-label="Primary"], header nav, .nav');
  if (nav) {
    if (!nav.id) nav.id = 'primaryNav';
    if (!document.querySelector('[data-nav-toggle]')) {
      const btn = document.createElement('button');
      btn.className = 'nav-toggle'; btn.setAttribute('data-nav-toggle',''); btn.setAttribute('aria-controls', nav.id); btn.setAttribute('aria-expanded','false'); btn.textContent = 'Menu';
      // Insert near brand or at start of header toolbar
      const headerBar = document.querySelector('.nav, .navbar, header .wrap') || document.querySelector('header');
      if (headerBar) {
        // Prefer placing before nav
        headerBar.insertBefore(btn, nav);
      } else {
        nav.parentElement.insertBefore(btn, nav);
      }
      nav.setAttribute('data-nav-panel','');
    }
  }
});
