// assets/site-nav.js
(function(){
  // Evita di agganciare due volte su pagine che includono anche script inline
  if (window.__navBound) return;
  window.__navBound = true;

  const btn = document.getElementById('navToggle');
  const nav = document.getElementById('primaryNav');
  if(!btn || !nav) return;

  // Toggle apertura/chiusura menu
  btn.addEventListener('click', ()=>{
    const open = document.body.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Burger visibile solo sotto i 980px
  const mq = matchMedia('(max-width:980px)');
  const update = ()=>{ btn.style.display = mq.matches ? 'inline-flex' : 'none'; };
  update(); mq.addEventListener('change', update);

  // Compatibilità con il tuo viewer/editor
  try {
    btn.setAttribute('data-view-allowed','');
    nav.querySelectorAll('a').forEach(a=>a.setAttribute('data-view-allowed',''));
  } catch(_) {}
})(
  // Close menu when clicking outside or on a link
  document.addEventListener('click', (e)=>{
    if(!document.body.classList.contains('nav-open')) return;
    const within = nav.contains(e.target) || btn.contains(e.target);
    if(!within){
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded','false');
    }
  });

  // Close when a nav link is clicked (use event delegation)
  nav.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if(a && document.body.classList.contains('nav-open')){
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded','false');
    }
  });

  // ESCAPE to close
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && document.body.classList.contains('nav-open')){
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded','false');
      btn.focus();
    }
  });
})();
