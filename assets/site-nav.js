<script>
/* Shared mobile menu toggle + piccoli fix, valido per tutte le pagine */
(function(){
  const btn = document.getElementById('navToggle');
  const nav = document.getElementById('primaryNav');
  if (!btn || !nav) return;

  const open = () => { document.body.classList.add('nav-open');  btn.setAttribute('aria-expanded','true');  };
  const close = () => { document.body.classList.remove('nav-open'); btn.setAttribute('aria-expanded','false'); };

  btn.addEventListener('click', ()=> {
    document.body.classList.contains('nav-open') ? close() : open();
  });

  // Chiudi toccando fuori
  document.addEventListener('click', (e)=>{
    if (!document.body.classList.contains('nav-open')) return;
    if (!e.target.closest('header')) close();
  });

  // Chiudi tornando a desktop
  const mq = matchMedia('(min-width: 981px)');
  mq.addEventListener?.('change', e => { if (e.matches) close(); });

  // Normalizza link Newsletter su tutte le pagine
  const navEmm = document.getElementById('navEmm');
  if (navEmm) navEmm.setAttribute('href','emm.html#latest');

  // Compatibilità con il tuo viewer/access mode
  try {
    btn.setAttribute('data-view-allowed','');
    nav.querySelectorAll('a').forEach(a=>a.setAttribute('data-view-allowed',''));
  } catch(_) {}
})();
</script>
