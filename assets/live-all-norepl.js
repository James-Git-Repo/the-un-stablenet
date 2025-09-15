// assets/live-all-norepl.js
// Site-wide synchronizer WITHOUT Postgres Changes (no replication access required).
// Uses: 1) Realtime Broadcast for instant pings between open clients
//       2) Timed polling as a safety net so new visitors also get fresh data.
//
// Requires: assets/sb-init.js, assets/live-core.js, assets/live-config.js
import { sb } from "./sb-init.js";
import { applyBindings, collectEditable, wireLiveEditor } from "./live-core.js";
import { detectConfig } from "./live-config.js";

function getMode(){
  const html = document.documentElement;
  const local = localStorage.getItem("tsn:mode");
  const attr = html.getAttribute("data-mode");
  return (local || attr || "viewer").toLowerCase();
}
function setMode(mode){
  document.documentElement.setAttribute("data-mode", mode);
  localStorage.setItem("tsn:mode", mode);
}

// Fetch helpers
async function fetchRow(table, keyColumn, keyValue){
  const { data, error } = await sb.from(table).select("*").eq(keyColumn, keyValue).maybeSingle();
  if (error) { console.warn("fetchRow error", error.message); }
  return data || null;
}

function startPolling({ table, keyColumn, keyValue, onData }){
  // Poll more frequently when tab is visible; slow when hidden
  let base = 2000; // 2s
  let timer = null;
  const run = async ()=>{
    const row = await fetchRow(table, keyColumn, keyValue);
    if (row) onData(row);
    schedule();
  };
  const schedule = ()=>{
    const ms = document.hidden ? Math.max(base * 5, 10000) : base;
    timer = setTimeout(run, ms);
  };
  document.addEventListener("visibilitychange", ()=>{
    if (timer) { clearTimeout(timer); schedule(); }
  });
  run();
  return ()=> timer && clearTimeout(timer);
}

function makeChannel(topic){
  // ack ensures delivery attempt (client→server). No DB replication involved.
  return sb.channel(topic, { config: { broadcast: { ack: true } } });
}

document.addEventListener("DOMContentLoaded", async () => {
  const cfg = detectConfig();
  const { table, keyColumn, keyValue, bindings } = cfg;
  if (!keyValue){ console.warn("No keyValue resolved for page; provide ?slug=... or rely on path key."); }

  // Initial fetch/populate
  const first = await fetchRow(table, keyColumn, keyValue);
  if (first) applyBindings(first, bindings);

  // Broadcast channel for this page
  const topic = `page:${table}:${keyColumn}:${keyValue}`;
  const ch = makeChannel(topic);

  // When a broadcast is received, refresh once
  const onPing = async () => {
    const row = await fetchRow(table, keyColumn, keyValue);
    if (row) applyBindings(row, bindings);
  };
  ch.on("broadcast", { event: "page_update" }, onPing);

  // Subscribe (ignore status handling for brevity; if it fails, polling still covers us)
  ch.subscribe((status)=>{
    if (status === "CHANNEL_ERROR") console.warn("Broadcast subscribe failed; polling will still update.");
  });

  // Always have polling as a safety net (covers new visitors)
  const stop = startPolling({ table, keyColumn, keyValue, onData: (row)=> applyBindings(row, bindings) });

  // Editor mode wires contenteditable + autosave, and pings broadcast after each save
  if (getMode() === "editor"){
    const editable = collectEditable(bindings);
    await wireLiveEditor({
      table, keyColumn, keyValue, editableBindings: editable
    });
    // Monkey-patch: wrap sb.from(...).update to send a broadcast after success? Better: intercept our own save path.
    // Since wireLiveEditor calls sb.from(...).update directly, we add a small observer by hooking into fetch via a microtask queue.
    // Simpler: listen for input events and send ping after a small delay.
    let t;
    const ping = ()=>{
      clearTimeout(t);
      t = setTimeout(async ()=>{
        try{
          await ch.send({ type: "broadcast", event: "page_update", payload: { at: Date.now() } });
        }catch(e){ console.warn("Broadcast send failed", e?.message); }
      }, 300);
    };
    editable.forEach(([_, b])=>{
      b.el.addEventListener("input", ping);
      b.el.addEventListener("blur", ping);
    });
  }

  // Expose helper
  window.__tsnToggleMode = function(){
    const next = getMode() === "editor" ? "viewer" : "editor";
    setMode(next); location.reload();
  };
});