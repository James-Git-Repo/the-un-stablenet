// Secret, auth-only login overlay (Ctrl/Cmd + Shift + E)
import { sb } from "./sb-init.js";

(() => {
  const openCombo = (e) => ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e");
  const logoutCombo = (e) => ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l");

  function openLogin() {
    if (document.getElementById("tsnHiddenLogin")) return;
    const wrap = document.createElement("div");
    wrap.id = "tsnHiddenLogin";
    wrap.setAttribute("data-view-allowed","");
    wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:9999;";
    wrap.innerHTML = `
      <div role="dialog" aria-modal="true" data-view-allowed
           style="background:#fff;color:#0b152c;width:min(420px,92vw);border-radius:16px;box-shadow:0 16px 60px rgba(0,0,0,.25);padding:20px 20px 16px;font-family:Inter,system-ui,sans-serif">
        <h2 style="margin:0 0 12px 0;font-weight:800;font-size:18px">Editor login</h2>
        <form id="tsnLoginForm" data-view-allowed>
          <label style="display:block;font-size:12px;margin-bottom:6px">Email</label>
          <input id="tsnEmail" type="email" required data-view-allowed style="width:100%;padding:10px 12px;border:1px solid #e7edf7;border-radius:10px;margin-bottom:10px;outline:none">
          <label style="display:block;font-size:12px;margin-bottom:6px">Password</label>
          <input id="tsnPass" type="password" required data-view-allowed style="width:100%;padding:10px 12px;border:1px solid #e7edf7;border-radius:10px;margin-bottom:14px;outline:none">
          <div id="tsnErr" style="color:#b00020;font-size:12px;min-height:16px;margin-bottom:8px"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button type="button" id="tsnCancel" data-view-allowed style="padding:10px 14px;border:1px solid #d0d7e2;border-radius:10px;background:#f7f9fc">Cancel</button>
            <button type="submit" data-view-allowed style="padding:10px 14px;border:0;border-radius:10px;background:#1f4aff;color:#fff;font-weight:700">Login</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(wrap);

    const form = document.getElementById("tsnLoginForm");
    const cancel = document.getElementById("tsnCancel");
    const email = document.getElementById("tsnEmail");
    const pass = document.getElementById("tsnPass");
    const err = document.getElementById("tsnErr");
    const close = () => wrap.remove();

    wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
    cancel.addEventListener("click", close);
    setTimeout(() => email?.focus(), 0);

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      err.textContent = "";
      try {
        const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: pass.value });
        if (error) throw error;
        close();
        location.reload(); // access-mode.js will switch to editor mode on reload
      } catch (e) { err.textContent = e?.message || "Login failed"; }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (openCombo(e)) { e.preventDefault(); openLogin(); }
    if (logoutCombo(e)) { e.preventDefault(); sb.auth.signOut().then(() => location.reload()); }
  });

  // Optional URL trigger: ?login=1 or #login
  const qp = new URLSearchParams(location.search);
  if (qp.get("login") === "1" || location.hash === "#login") setTimeout(openLogin, 50);
})();

