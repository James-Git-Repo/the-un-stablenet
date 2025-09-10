// assets/dynamic-bio.js
import { sb } from "./sb-init.js";

const $ = (id) => document.getElementById(id);

function whitelist() {
  [
    "openInquiry","inqDialog","inqForm","closeInq","sendInq",
  ].forEach((id) => { const x = $(id); if (x) x.setAttribute("data-view-allowed",""); });

  // Allow contacts section and pills for viewers
  const links = document.getElementById("links");
  if (links) {
    links.setAttribute("data-view-allowed", "");
    links.querySelectorAll("a").forEach(a => a.setAttribute("data-view-allowed",""));
  }

  // Re-enable anything the viewer-lock disabled earlier
  document.querySelectorAll("[data-view-allowed]").forEach((el) => {
    if (el.disabled) el.disabled = false;
    el.removeAttribute("data-locked");
    if (el.tagName === "A") {
      el.removeAttribute("aria-disabled");
      el.style.pointerEvents = "";
      el.style.opacity = "";
    }
  });
}

function wireDialog() {
  const dlg = $("inqDialog");
  const btn = $("openInquiry");
  const closeBtn = $("closeInq");

  function open() {
    if (!dlg) return;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.style.display = "block";
  }
  function close(e) {
    if (e) e.preventDefault();
    if (!dlg) return;
    if (dlg.open && typeof dlg.close === "function") dlg.close();
    else dlg.style.display = "none";
  }

  if (btn && dlg) btn.addEventListener("click", open, { capture:true });
  if (closeBtn) closeBtn.addEventListener("click", close, { capture:true });

  // backdrop to close
  if (dlg) {
    dlg.addEventListener("click", (e) => {
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
    }, { capture:true });
  }
}

function wireSubmit() {
  const send = $("sendInq");
  if (!send || send.dataset.sbHooked) return;
  send.dataset.sbHooked = "1";

  send.addEventListener("click", async (e) => {
    const form = $("inqForm");
    if (!form) return;

    const fd = new FormData(form);
    const name    = (fd.get("name")    || "").toString().trim();
    const email   = (fd.get("email")   || "").toString().trim();
    const topic   = (fd.get("topic")   || "").toString().trim();   // not in DB
    const message = (fd.get("message") || "").toString().trim();

    // Let native required inputs handle UX; just bail if empty
    if (!name || !email || !message) return;

    // Fold topic into message so it matches your table schema
    const payload = {
      page: "bio",
      name,
      email,
      message: topic ? `[${topic}] ${message}` : message
    };

    try {
      const { error } = await sb.from("inquiries").insert(payload);
      if (error) throw error;

      // Success UX
      e.preventDefault();
      form.reset();
      $("inqDialog")?.close?.();
      alert("Thanks! Your question was sent.");
    } catch (err) {
      console.error("inquiries.insert failed:", err?.message || err);
      alert("Hmm, that didn’t go through. Please try again in a minute.");
    }
  }, { capture:true });
}

document.addEventListener("DOMContentLoaded", () => {
  whitelist();
  wireDialog();
  wireSubmit();
});
