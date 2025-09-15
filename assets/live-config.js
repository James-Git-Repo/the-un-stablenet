// assets/live-config.js
import { bindGetSet } from "./live-core.js";
function getSlug(){ const u = new URL(location.href); return u.searchParams.get("slug") || null; }
function getPathKey(){ return location.pathname.replace(/\/+$/, ""); }
export function detectConfig(){
  const html = document.documentElement;
  const explicitTable = html.getAttribute("data-collection");
  const explicitKeyCol = html.getAttribute("data-key-col");
  const explicitKeyVal = html.getAttribute("data-key") || null;
  const bindings = {
    title: bindGetSet('.proj-title') || bindGetSet('.page-title') || bindGetSet('[data-bind="title"]'),
    subtitle: bindGetSet('.proj-subtitle') || bindGetSet('.page-subtitle') || bindGetSet('[data-bind="subtitle"]'),
    body_html: bindGetSet('.proj-body', 'html') || bindGetSet('.page-body', 'html') || bindGetSet('[data-bind="body_html"]','html'),
  };
  const heroEl = document.querySelector('.proj-hero, .page-hero, [data-bind="hero_url"]');
  if (heroEl){
    bindings.hero_url = { el: heroEl, get: ()=> heroEl.dataset.src || "", set: (url)=>{
      if (!url) return; heroEl.style.setProperty("background-image", `url('${url}')`);
      heroEl.style.setProperty("background-size", "cover"); heroEl.style.setProperty("background-position", "center");
      heroEl.dataset.src = url; }, makeEditable: ()=>{} };
  }
  if (explicitTable){ const keyColumn = explicitKeyCol || "slug"; const keyValue = explicitKeyVal || getSlug() || getPathKey(); return { table: explicitTable, keyColumn, keyValue, bindings }; }
  const name = location.pathname.split("/").pop().toLowerCase(); const slug = getSlug();
  if (name.startsWith("project")) return { table: "project_pages", keyColumn: "slug", keyValue: slug, bindings };
  if (name.startsWith("emm")) return { table: "emm_articles", keyColumn: "slug", keyValue: slug || getPathKey(), bindings, fallback: { table: "site_pages", keyColumn: "path", keyValue: getPathKey() } };
  if (name.includes("bio")) return { table: "bio_pages", keyColumn: "slug", keyValue: slug || getPathKey(), bindings, fallback: { table: "site_pages", keyColumn: "path", keyValue: getPathKey() } };
  return { table: "site_pages", keyColumn: "path", keyValue: getPathKey(), bindings };
}