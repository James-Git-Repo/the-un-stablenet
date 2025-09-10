/*! Access / View Mode controller — auth-gated editor */
(function(){
  const MODE_KEY = 'tsn_mode';
  const setMode = m => {
    const val = (m === 'editor' ? 'editor' : (m === 'user' ? 'user' : 'viewer'));
    document.documentElement.setAttribute('data-mode', val);
    try { localStorage.setItem(MODE_KEY, val) } catch(_) {}
  };

function disableInteractive(el){
  if (el.matches?.('[data-view-allowed]') || el.closest?.('[data-view-allowed]')) return;

  const t = (el.tagName||'').toLowerCase();

  // Soft-disable form controls in viewer
  if (['input','select','textarea','button'].includes(t)) {
    try{ el.disabled = true }catch(_){}
    el.setAttribute('data-locked','true');
  }

  // Turn off contenteditable, but don't destroy markers/handlers
  if (el.getAttribute && el.getAttribute('contenteditable') === 'true') {
    el.setAttribute('contenteditable','false');
    el.classList?.remove('edit-outline','editable');
  }

  // IMPORTANT: do NOT strip inline on* handlers anymore.
}

  function blockEvents(root){
    const blockSel=':is(button, input, select, textarea, [contenteditable], [role="button"], .btn, .button, .switch, .toggle, .editable, .editor, .toolbar, .controls)';
    ['click','input','change','keydown','keyup','submit','dragstart','drop'].forEach((ev)=>{
      root.addEventListener(ev, function(e){
        if (e.target.closest?.('[data-view-allowed]')) return;
        const t = e.target.closest ? e.target.closest(blockSel) : null;
        if (t) { e.stopImmediatePropagation(); e.preventDefault(); }
      }, true);
    });
  }
  function disableAnchors(){
    document.querySelectorAll('a[data-view-block], a[data-lockable]').forEach((a)=>{
      if (a.closest('[data-view-allowed]')) return;
      a.addEventListener('click',(e)=>{ e.preventDefault(); e.stopImmediatePropagation(); }, {capture:true});
      a.setAttribute('aria-disabled','true'); a.style.pointerEvents='none'; a.style.opacity='0.6';
    });
  }
  function applyViewer(){
    document.documentElement.setAttribute('data-mode','viewer');
    document.querySelectorAll('*').forEach(disableInteractive);
    const killers='[data-editor-only],.editor-only,.only-editor,.editor,.editor-tools,.editor-actions,[data-edit],[data-upload],[data-customize]';
document.querySelectorAll(killers).forEach((el)=>{
  if (el.matches('[data-view-allowed]') || el.closest('[data-view-allowed]')) return;
  el.setAttribute('data-view-hidden','');
  el.style.display='none';
});
    blockEvents(document);
    document.querySelectorAll('form:not([data-view-allowed])').forEach((f)=>{
      f.addEventListener('submit', (e)=>{ if (!e.target.closest('[data-view-allowed]')) { e.preventDefault(); } }, true);
    });
    disableAnchors();
  }
  function applyEditor(){
    document.documentElement.setAttribute('data-mode','editor');
    // Allow events under body (viewer blockers skip this subtree)
document.body?.setAttribute('data-view-allowed','');

// Unhide elements hidden in viewer
document.querySelectorAll('[data-view-hidden]').forEach((el)=>{
  el.style.display='';
  el.removeAttribute('data-view-hidden');
});

// Re-enable previously disabled controls/anchors
document.querySelectorAll('[data-locked], [disabled], [aria-disabled="true"]').forEach((el)=>{
  try { el.disabled = false; } catch(_){}
  el.removeAttribute('data-locked');
  el.removeAttribute('aria-disabled');
  el.style.pointerEvents='';
  el.style.opacity='';
});

// Restore contenteditable on obvious editables
document.querySelectorAll('[data-editable], .editable').forEach((el)=>{
  if (el.getAttribute('data-editable') === 'false') return;
  el.setAttribute('contenteditable','true');
  el.classList.add('edit-outline','editable');
});

// Re-enable anchors that were viewer-blocked
document.querySelectorAll('a[data-view-block], a[data-lockable]').forEach((a) => {
  const aa = a.cloneNode(true);     // drops viewer click handler
  aa.removeAttribute('data-view-block');
  aa.removeAttribute('data-lockable');
  aa.style.pointerEvents = '';
  aa.style.opacity = '';
  a.replaceWith(aa);
});
  }

  // public helpers used by editor-tray
  async function enterEditorIfAuthed(){
    const sb = window.$sb;
    if (!sb) { setMode('viewer'); applyViewer(); return alert('Auth not ready'); }
    const { data } = await sb.auth.getUser();
    if (data?.user) { setMode('editor'); applyEditor(); }
    else { alert('Please log in first.'); }
  }
  function exitEditor(){ setMode('viewer'); applyViewer(); }
  window.TSN_View = { enterEditorIfAuthed, exitEditor };

  // Init: default viewer; auto-upgrade to editor if a session exists
  function waitForSB(cb){
    if (window.$sb && window.$sb.auth) return cb(window.$sb);
    setTimeout(()=>waitForSB(cb), 50);
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    setMode('viewer'); applyViewer();
    waitForSB((sb)=>{
      sb.auth.getUser().then(({data})=>{
        if (data?.user) { setMode('editor'); applyEditor(); }
      });
      sb.auth.onAuthStateChange((_evt, session)=>{
        if (session?.user) { setMode('editor'); applyEditor(); }
        else { setMode('viewer'); applyViewer(); }
      });
    });
  });
})();
