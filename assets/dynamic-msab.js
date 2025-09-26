import { sb } from "./sb-init.js";
const q = s => document.querySelector(s);
function inject(msab){
  if (!msab) return;
  if (q("#msabBody")) q("#msbBody").innerHTML = msab.body_html || "";
  if (q(".msab-hero") && msab.hero_url){ const el = q(".msab-hero"); el.style.backgroundImage = `url('${msab.hero_url}')`; el.style.backgroundSize='cover'; }
}
async function fetchMSB(){
  const { data, error } = await sb.from("msab_pages").select("*").eq("slug","msab").eq("status","published").maybeSingle();
  if (error) { console.error(error); return null; }
  return data;
}
document.addEventListener("DOMContentLoaded", async ()=>{ inject(await fetchMSAB()); });
