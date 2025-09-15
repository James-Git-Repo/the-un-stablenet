// assets/live-core.js
import { sb } from "./sb-init.js";
export function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
export async function ensureRow(table, keyColumn, keyValue, defaults={}){
  if (!keyValue) return { data: null, error: new Error("Missing keyValue") };
  try{
    const { data, error } = await sb.from(table).select("*").eq(keyColumn, keyValue).maybeSingle();
    if (error && error.code) return { data:null, error };
    if (data) return { data, error:null };
    const stub = { [keyColumn]: keyValue, status: "published", updated_at: new Date().toISOString(), ...defaults };
    const ins = await sb.from(table).insert(stub).select().maybeSingle();
    return { data: ins.data || stub, error: ins.error || null };
  }catch(e){ return { data:null, error:e }; }
}
export function bindGetSet(selector, mode="text"){
  const el = document.querySelector(selector);
  if (!el) return null;
  return { el,
    get: () => mode === "html" ? el.innerHTML : el.textContent,
    set: (val) => { if (val == null) val = ""; if (mode === "html") el.innerHTML = val; else el.textContent = val; },
    makeEditable: ()=>{ el.setAttribute("contenteditable","true"); el.classList.add("editable","edit-outline"); }
  };
}
export function applyBindings(row, bindings){
  if (!row) return;
  for (const field in bindings){ const b = bindings[field]; if (!b) continue; const { set } = b; if (typeof set === "function") set(row[field]); }
}
export function collectEditable(bindings){
  const list = []; for (const field in bindings){ const b = bindings[field]; if (b && b.makeEditable){ b.makeEditable(); list.push([field, b]); } } return list;
}
export async function wireLiveViewer({ table, keyColumn, keyValue, bindings }){
  const one = await sb.from(table).select("*").eq(keyColumn, keyValue).maybeSingle();
  if (!one.error && one.data) applyBindings(one.data, bindings);
  const chan = sb.channel(`realtime:${table}:${keyColumn}:${keyValue}`);
  chan.on("postgres_changes", { event: "*", schema: "public", table, filter: `${keyColumn}=eq.${keyValue}` }, (payload)=>{ applyBindings(payload.new, bindings); });
  chan.subscribe();
}
export async function wireLiveEditor({ table, keyColumn, keyValue, editableBindings }){
  const debouncedSave = debounce(async (delta)=>{
    const update = { ...delta, status: "published", updated_at: new Date().toISOString() };
    const { error } = await sb.from(table).update(update).eq(keyColumn, keyValue);
    if (error) console.error("Live save failed:", error.message);
  }, 600);
  editableBindings.forEach(([field, b])=>{
    const handler = ()=> debouncedSave({ [field]: b.get() });
    b.el.addEventListener("input", handler);
    b.el.addEventListener("blur", handler);
  });
}