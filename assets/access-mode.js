# PURPOSE: Deterministic viewer/editor switcher with hotkeys and safe fallbacks
# Default = viewer. Editor UI is fully inert in viewer. Guards against double
# bindings. Applies attribute to BOTH <html> and <body> for CSS selector parity.
# ──────────────────────────────────────────────────────────────────────────────
(function(){
  const MODE_KEY = 'tsn_mode';       // persisted between page loads
  const VALID = new Set(['viewer','editor']);
  const isInput = el => {
    const t = (el.tagName||'').toLowerCase();
    return ['input','select','textarea','button','summary','details'].includes(t);
  };

  // Apply mode attribute on both roots for maximum CSS compatibility
  const applyAttr = (mode) => {
    const m = VALID.has(mode) ? mode : 'viewer';
    const root = document.documentElement; // <html>
    const body = document.body || document.querySelector('body');
    root.setAttribute('data-mode', m);
    if (body) body.setAttribute('data-mode', m);
  };

  const setMode = (mode) => {
    const m = VALID.has(mode) ? mode : 'viewer';
    try{ localStorage.setItem(MODE_KEY, m) }catch(_){}
    applyAttr(m);
    if (m === 'viewer') lockDownViewer(); else unlockEditor();
  };

  const getMode = () => {
    try{
      const val = localStorage.getItem(MODE_KEY);
      return VALID.has(val) ? val : 'viewer';
    }catch(_) { return 'viewer' }
  };

  // Disable interactivity in viewer unless explicitly allowed
  function disableInteractive(el){
    if (!el || el.nodeType !== 1) return;
    if (el.matches('[data-view-allowed], [data-view-allowed] *')) return;

    // form controls
    if (isInput(el)) {
      if (!el.hasAttribute('data-locked')) {
        try{ el.disabled = true }catch(_){ }
        el.setAttribute('data-locked','true');
      }
    }

    // contenteditable
    const ce = el.getAttribute && el.getAttribute('contenteditable');
    if (ce === 'true') {
      el.setAttribute('contenteditable','false');
      el.setAttribute('data-locked','true');
    }

    // clicks
    if (!el.hasAttribute('data-view-allowed') && !el.closest('[data-view-allowed]')) {
      el.style.userSelect = 'none';
    }
  }

  function lockDownViewer(){
    // Hide editor-only UI by attribute/class (CSS also hides it)
    document.querySelectorAll('[data-editor-ui], .editor-only').forEach(ui => {
      ui.setAttribute('aria-hidden','true');
      ui.setAttribute('inert','');
      ui.style.pointerEvents = 'none';
    });

    // Pass across the DOM once
    document.querySelectorAll('*').forEach(disableInteractive);
  }

  function unlockEditor(){
    // Re-enable what we disabled
    document.querySelectorAll('[data-locked]').forEach(el => {
      el.removeAttribute('data-locked');
      if (isInput(el)) try{ el.disabled = false }catch(_){ }
    });
    document.querySelectorAll('[data-editor-ui], .editor-only').forEach(ui => {
      ui.removeAttribute('aria-hidden');
      ui.removeAttribute('inert');
      ui.style.pointerEvents = '';
    });
    // Re-allow selection
    document.querySelectorAll('*').forEach(el => { if (el && el.style) el.style.userSelect = '' });
  }

  // Hotkeys: Ctrl/⌘ + Shift + E (enter editor), Ctrl/⌘ + Shift + L (leave)
  function bindHotkeys(){
    if (document.documentElement.dataset.hotkeysBound) return;
    document.documentElement.dataset.hotkeysBound = '1';
    window.addEventListener('keydown', (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta || !e.shiftKey) return;
      const k = e.key?.toLowerCase();
      if (k === 'e') { e.preventDefault(); setMode('editor'); }
      if (k === 'l') { e.preventDefault(); setMode('viewer'); }
    }, { passive:false });
  }

  // Observe late-added nodes (SPA or dynamic fragments)
  function observe(){
    const mo = new MutationObserver((muts)=>{
      if (getMode() !== 'viewer') return;
      for (const m of muts){
        m.addedNodes && m.addedNodes.forEach(disableInteractive);
      }
    });
    mo.observe(document.documentElement, { childList:true, subtree:true });
  }

  // INIT
  function init(){
    applyAttr('viewer'); // safe default before anything else
    bindHotkeys();
    observe();
    setMode(getMode());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


# ──────────────────────────────────────────────────────────────────────────────
