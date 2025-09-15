/*! access-mode.js — auth-aware, gentle viewer, with data-key persistence */
(function () {
  if (window.__TSN_ACCESS_BOUND__) return;
  window.__TSN_ACCESS_BOUND__ = true;

  const ROOT = document.documentElement;
  const MODE_KEY = "tsn:mode";
  const STORAGE_NS = "tsn:content:";
  let authed = false;

  // -------- mode ----------
  const setMode = (m) => {
    const val = m === "edit" ? "edit" : "view";
    ROOT.dataset.mode = val;
    try { localStorage.setItem(MODE_KEY, val); } catch {}
    // lock only edit widgets; do NOT block the whole page
    document.querySelectorAll(".edit-only").forEach(el => {
      el.classList.toggle("is-locked", val === "view");
    });
  };

  const getInitialMode = () => {
    const p = new URL(location.href).searchParams.get("mode");
    if (p === "edit") return "edit";
    const saved = localStorage.getItem(MODE_KEY);
    return saved === "edit" ? "edit" : "view";
  };

  // -------- persistence for [data-key] ----------
  const store = {
    get: (k) => localStorage.getItem(STORAGE_NS + k),
    set: (k, v) => localStorage.setItem(STORAGE_NS + k, v),
  };

  const applySaved = () => {
    document.querySelectorAll("[data-key]").forEach((el) => {
      const key = el.getAttribute("data-key");
      const val = store.get(key);
      if (val == null) return;
      if (el.matches("input,textarea")) el.value = val;
      else if (el.isContentEditable) el.innerHTML = val;
      else el.innerHTML = val;
    });
  };

  const onEdit = (e) => {
    const el = e.target.closest?.("[data-key]");
    if (!el) return;
    const key = el.getAttribute("data-key");
    const val = el.matches("input,textarea") ? el.value : el.innerHTML;
    store.set(key, val);
  };

  // -------- Supabase auth wiring ----------
  const whenSB = (cb) => {
    if (window.$sb?.auth) return cb(window.$sb);
    setTimeout(() => whenSB(cb), 50);
  };

  const enforceAuth = () => {
    // If user is not authed, never allow edit mode
    if (!authed && ROOT.dataset.mode === "edit") setMode("view");
  };

  // public helpers kept for your editor tray
  async function enterEditorIfAuthed() {
    if (!authed) return alert("Please log in first.");
    setMode("edit");
  }
  function exitEditor() { setMode("view"); }
  window.TSN_View = { enterEditorIfAuthed, exitEditor };

  // -------- keyboard shortcuts ----------
  window.addEventListener("keydown", (e) => {
    const mod = (e.ctrlKey || e.metaKey) && e.shiftKey;
    if (!mod) return;
    const k = e.key.toLowerCase();
    if (k === "e") { e.preventDefault(); if (authed) setMode("edit"); }
    if (k === "l") { e.preventDefault(); setMode("view"); }
  });

  // -------- boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    setMode(getInitialMode());    // default to saved/URL mode
    applySaved();
    document.addEventListener("input", onEdit, true);
    document.addEventListener("blur", onEdit, true);

    // Supabase session → controls whether edit is allowed
    whenSB((sb) => {
      sb.auth.getUser().then(({ data }) => {
        authed = !!data?.user;
        enforceAuth();
      });
      sb.auth.onAuthStateChange((_evt, session) => {
        authed = !!session?.user;
        enforceAuth();
      });
    });
  });
})();
