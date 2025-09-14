/*! site-nav.js v6 — robust open/close for mobile, safe against double-binding */
(function(){
  const btn = document.getElementById('navToggle');
  const nav = document.getElementById('primaryNav');
  if(!btn || !nav) return;

  // Avoid double listener if this script is loaded twice
  if (btn.dataset.tsnBound === '1') return;
  btn.dataset.tsnBound = '1';

  function closeMenu(){
    document.body.classList.remove('nav-open');
    btn.setAttribute('aria-expanded','false');
  }
  function openMenu(){
    document.body.classList.add('nav-open');
    btn.setAttribute('aria-expanded','true');
  }
  function toggle(){
    if(document.body.classList.contains('nav-open')) closeMenu();
    else openMenu();
  }

  btn.addEventListener('click', toggle);

  // Close on outside click
  document.addEventListener('click', (e)=>{
    if(!document.body.classList.contains('nav-open')) return;
    const within = nav.contains(e.target) || btn.contains(e.target);
    if(!within) closeMenu();
  });

  // Close on ESC
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && document.body.classList.contains('nav-open')){
      closeMenu();
      btn.focus();
    }
  });

  // On resize to desktop, ensure menu state resets
  const DESKTOP_BP = 981;
  let lastWide = window.innerWidth >= DESKTOP_BP;
  window.addEventListener('resize', ()=>{
    const wide = window.innerWidth >= DESKTOP_BP;
    if (wide && !lastWide){
      // entering desktop
      closeMenu();
    }
    lastWide = wide;
  });

  // Close when a nav link is clicked
  nav.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if(a && document.body.classList.contains('nav-open')) closeMenu();
  });
})();
