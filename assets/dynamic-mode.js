// /assets/dynamic-mode.js
(() => {
  const MODE_KEY = 'tsn_mode';
  const TOKEN_KEY = 'tsn_token';
  const html = document.documentElement;

  const btnEditor = document.getElementById('enter-editor');
  const btnUser   = document.getElementById('enter-user');
  const btnViewer = document.getElementById('enter-viewer');

  // Use the <h1>’s following <p> as status if present; otherwise create one
  const statusEl = (() => {
    let el = document.querySelector('h1 + p');
    if (!el) {
      el = document.createElement('p');
      el.className = 'mt-2 text-white/70';
      document.querySelector('h1')?.after(el);
    }
    return el;
  })();

  function getMode() {
    return html.getAttribute('data-mode') || localStorage.getItem(MODE_KEY) || 'viewer';
  }

  function applyMode(mode) {
    const val = (mode === 'editor' || mode === 'user') ? mode : 'viewer';
    localStorage.setItem(MODE_KEY, val);
    html.setAttribute('data-mode', val);

    // UI feedback
    const unlocked = (val === 'editor' && localStorage.getItem(TOKEN_KEY)) ? ' (unlocked)' : '';
    statusEl.innerHTML = `Current mode: <b>${val}</b>${unlocked}`;

    [btnEditor, btnUser, btnViewer].forEach(b => b?.classList.remove('ring-2','ring-white'));
    if (val === 'editor') btnEditor?.classList.add('ring-2','ring-white');
    if (val === 'user')   btnUser?.classList.add('ring-2','ring-white');
    if (val === 'viewer') btnViewer?.classList.add('ring-2','ring-white');

    // Notify other scripts
    window.dispatchEvent(new CustomEvent('tsn:mode-changed', { detail: { mode: val } }));
    if (val === 'editor') window.dispatchEvent(new Event('tsn:enter-editor'));
  }

  async function sha256Hex(str) {
    const data = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function enterEditor() {
    const pass = prompt('Enter passphrase to enable Editor Mode:');
    if (!pass) return;
    const tok = await sha256Hex(pass);
    localStorage.setItem(TOKEN_KEY, tok);   // validated by access-mode.js
    applyMode('editor');
    location.reload(); // keep if access-mode reads token on load; remove if not needed
  }

  function enterUser()   { localStorage.removeItem(TOKEN_KEY); applyMode('user'); }
  function enterViewer() { localStorage.removeItem(TOKEN_KEY); applyMode('viewer'); }

  // Button handlers (container has data-view-allowed so these work in viewer mode)
  btnEditor?.addEventListener('click', enterEditor);
  btnUser?.addEventListener('click', enterUser);
  btnViewer?.addEventListener('click', enterViewer);

  // Keyboard shortcuts: Ctrl/Cmd + Shift + (E/U/L)
  window.addEventListener('keydown', (e) => {
    if (!(e.shiftKey && (e.ctrlKey || e.metaKey))) return;
    const k = e.key.toLowerCase();
    if (k === 'e') { e.preventDefault(); enterEditor(); }
    if (k === 'u') { e.preventDefault(); enterUser(); }
    if (k === 'l') { e.preventDefault(); enterViewer(); }
  });

  // Init
  applyMode(getMode());
})();
