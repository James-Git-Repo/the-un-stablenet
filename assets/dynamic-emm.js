// assets/dynamic-emm.js
// Minimal EMM helper: DO NOT change hero/title/deck/content.
// Only: (1) whitelist Contribute UI for viewers, (2) save contributions to Supabase.

<!-- <script type="module" src="assets/dynamic-emm.js"></script> -->
import { sb } from "./sb-init.js";

const $ = (id) => document.getElementById(id);

// Allow these elements to stay interactive in Viewer mode
function allowViewer() {
  [
    "openContrib",
    "contribDialog",
    "contribFormContainer", // old id in your page
    "contribForm",          // alt id if you ever rename
    "ctName","ctEmail","ctType","ctFile","ctMsg","ctConsent",
    "closeContrib","cancelContrib","submitContrib",
  ].forEach((id) => {
    const el = $(id);
    if (el) el.setAttribute("data-view-allowed", "");
  });
}

function closeDialog() {
  const dlg = $("contribDialog");
  if (!dlg) return;
  if (typeof dlg.close === "function") dlg.close();
  else dlg.style.display = "none";
}

// Attach a SUPABASE submit handler that runs in the CAPTURE phase.
// If Supabase insert succeeds -> we consume the click (prevent the old local handler).
// If it fails -> we let the old inline handler run (localStorage fallback + alert).
function attachSupabaseSubmit() {
  const btn = $("submitContrib");
  if (!btn || btn.dataset.sbHooked) return;
  btn.dataset.sbHooked = "1";

  btn.addEventListener(
    "click",
    async (e) => {
      const name = $("ctName")?.value?.trim();
      const email = $("ctEmail")?.value?.trim();
      const type = $("ctType")?.value || null;
      const msg = $("ctMsg")?.value?.trim();
      const ok = $("ctConsent")?.checked;

      // Let your original inline JS handle validation alerts
      if (!name || !email || !msg || !ok) return;

      const url = new URL(location.href);
      const article_slug = url.searchParams.get("a") || null;

      try {
        const { error } = await sb
          .from("emm_contribs")
          .insert({ name, email, type, message: msg, article_slug });

        if (!error) {
          // Success → stop the original inline handler from running
          e.stopImmediatePropagation();
          e.preventDefault();
          closeDialog();
          alert("Thanks for your contribution!");
        }
        // If there was an error, do nothing → your inline handler will save locally.
      } catch {
        // Network/other error → fall through to inline handler
      }
    },
    { capture: true } // important: run before the old (bubble-phase) handler
  );
}

document.addEventListener("DOMContentLoaded", () => {
  allowViewer();
  attachSupabaseSubmit();
});
