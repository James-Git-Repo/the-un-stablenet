// access-mode.js — viewer/editor switch with hotkeys
(() => {
  const KEY = 'tsn_mode';
  const apply = (m) => {
    const mode = (m === 'editor' ? 'editor' : 'viewer');
    const root = document.documentElement;
    const body = document.body;
    root.setAttribute('data-mode', mode);
    if (body) body.setAttribute('data-mode', mode);
    if (mode === 'editor') window.dispatchEvent(new CustomEvent('tsn:enter-editor'));
  };
  const set = (m) => { try { localStorage.setItem(KEY, m) } catch {} ; apply(m); };
  const get = () => (localStorage.getItem(KEY) || 'viewer');

  // init
  apply(get());

  // Ctrl+Shift+E => editor, Ctrl+Shift+L => viewer
  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey || !e.shiftKey) return;
    if (e.code === 'KeyE') { e.preventDefault(); set('editor'); }
    if (e.code === 'KeyL') { e.preventDefault(); set('viewer'); }
  });
})();

