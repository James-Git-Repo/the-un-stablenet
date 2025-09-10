import { sb } from "./sb-init.js";
const qs = s => document.querySelector(s);
function inject(p){
  if (!p) return;
  const t = qs(".proj-title"), d = qs(".proj-subtitle"), h = qs(".proj-hero"), b = qs(".proj-body");
  if (t) t.textContent = p.title || "";
  if (d) d.textContent = p.subtitle || p.deck || "";
  if (h && p.hero_url) { h.style.backgroundImage = `url('${p.hero_url}')`; h.style.backgroundSize="cover"; h.style.backgroundPosition="center"; }
  if (b && p.body_html) b.innerHTML = p.body_html;
}
async function fetchProject(){
  const slug = new URL(location.href).searchParams.get("slug");
  if (!slug) return null;
  const { data, error } = await sb.from("project_pages").select("*").eq("slug", slug).eq("status","published").maybeSingle();
  if (error) { console.error(error); return null; }
  return data;
}
document.addEventListener("DOMContentLoaded", async () => { inject(await fetchProject()); });
