import { sb } from "./sb-init.js";
const q = s => document.querySelector(s);
function inject(msb){
  if (!msb) return;
  if (q("#msbBody")) q("#msbBody").innerHTML = msb.body_html || "";
  if (q(".msb-hero") && msb.hero_url){ const el = q(".msb-hero"); el.style.backgroundImage = `url('${msb.hero_url}')`; el.style.backgroundSize='cover'; }
}
async function fetchMSB(){
  const { data, error } = await sb.from("msb_pages").select("*").eq("slug","msb").eq("status","published").maybeSingle();
  if (error) { console.error(error); return null; }
  return data;
}
document.addEventListener("DOMContentLoaded", async ()=>{ inject(await fetchMSB()); });
