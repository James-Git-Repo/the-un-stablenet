// assets/live-all.js
import { ensureRow, applyBindings, collectEditable, wireLiveViewer, wireLiveEditor } from "./live-core.js";
import { detectConfig } from "./live-config.js";
function getMode(){ const html = document.documentElement; const local = localStorage.getItem("tsn:mode"); const attr = html.getAttribute("data-mode"); return (local || attr || "viewer").toLowerCase(); }
function setMode(m){ document.documentElement.setAttribute("data-mode", m); localStorage.setItem("tsn:mode", m); }
async function tryEnsureRowWithFallback(cfg){
  const res = await ensureRow(cfg.table, cfg.keyColumn, cfg.keyValue);
  if (!res.error) return { cfg, row: res.data };
  if (cfg.fallback){ const res2 = await ensureRow(cfg.fallback.table, cfg.fallback.keyColumn, cfg.fallback.keyValue);
    if (!res2.error) return { cfg: cfg.fallback, row: res2.data }; }
  console.warn("ensureRow failed:", res.error?.message); return { cfg, row: null };
}
document.addEventListener("DOMContentLoaded", async ()=>{
  const cfg0 = detectConfig(); const { cfg, row } = await tryEnsureRowWithFallback(cfg0);
  const bindings = cfg.bindings; if (row) applyBindings(row, bindings);
  wireLiveViewer({ table: cfg.table, keyColumn: cfg.keyColumn, keyValue: cfg.keyValue, bindings });
  if (getMode() === "editor"){ const editable = collectEditable(bindings);
    await wireLiveEditor({ table: cfg.table, keyColumn: cfg.keyColumn, keyValue: cfg.keyValue, editableBindings: editable }); }
  window.__tsnToggleMode = function(){ const next = getMode() === "editor" ? "viewer" : "editor"; setMode(next); location.reload(); };
});