import { sb } from "./sb-init.js";

/* --- href sanitizer: sempre relativo, niente leading slash, estensione corretta --- */
function normalizeHref(href, id){
  let h = (href || "").trim();

  // Fallback intelligenti
  if (!h) {
    if (id === "emm") return "emm.html#latest";
    return `project.html?slug=${id}`;
  }

  // Porta eventuali URL assoluti a pathname+hash e togli leading slash
  try {
    const u = new URL(h, location.href);
    h = (u.pathname + u.hash).replace(/^\/+/, "");
  } catch(_) {
    h = h.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
  }

  // Shorthand/slug -> file reale
  if (/^emm(\/|$|#)/i.test(h))  return "emm.html#latest";
  if (/^msb(\/|$|#)/i.test(h) || /^msab(\/|$|#)/i.test(h)) return "msab.html";

  // Se non ha estensione nota, aggiungi .html
  if (!/\.(html?|pdf)$/i.test(h)) h = `${h}.html`;

  return h;
}

async function fetchProjects(){
  const { data, error } = await sb
    .from("projects")
    .select("id,title,tag,blurb,href,cover_url,status,sort")
    .order("sort", { ascending: true });
  if (error) { console.error(error); return []; }
  return (data||[]).filter(p => p.status === "published" || p.id === "coming");
}

function tpl(p){
  const cover = p.cover_url || "";
  const inner = `
    <div class="cover" style="background-image:url('${cover}')"></div>
    <div class="inner">
      <span class="tag">${p.tag||""}</span>
      <h3>${p.title||""}</h3>
      <p><em>${p.blurb||""}</em></p>
    </div>`;

  if (p.id === "coming") {
    const isEditor = document.documentElement.getAttribute("data-mode") === "editor";
    return isEditor
      ? `<a class="card" href="project_new.html" data-view-allowed>${inner}</a>`
      : `<article class="card" data-view-block>${inner}</article>`;
  }

  const href = normalizeHref(p.href, p.id);
  return `<a class="card" href="${href}" data-view-allowed>${inner}</a>`;
}

function renderProjects(list){
  const grid = document.getElementById("projectGrid");
  if (!grid) return;
  grid.innerHTML = list.map(tpl).join("");
}

function wireNewsletterForm(){
  const form = document.querySelector(".nl-form");
  if (!form) return;
  form.setAttribute("data-view-allowed","");
  const email = form.querySelector("#email");
  const submit = form.querySelector("button[type='submit']");
  if (email) email.setAttribute("data-view-allowed","");
  if (submit) submit.setAttribute("data-view-allowed","");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const val = email?.value?.trim();
    if (!val) return;
    const { error } = await sb.from("subscriptions").insert({ email: val, source: "home" });
    if (error) {
      alert("Thanks! (fallback email opened)");
      location.href = `mailto:you@example.com?subject=Subscribe&body=${encodeURIComponent(val)}`;
      return;
    }
    form.innerHTML = `<div class="text-green-600 font-semibold">Thank You and Welcome to European Market Movers, the newsletter that cuts through the noise to make sense of the Old Continent's financial markets.</div>`;
  });
}

function makeCardsClickProof(){
  document.querySelectorAll('a.card').forEach(card => {
    card.setAttribute('data-view-allowed','');
    card.querySelectorAll('*').forEach(el => el.setAttribute('data-view-allowed',''));
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  wireNewsletterForm();
  const items = await fetchProjects();
  renderProjects(items);

  // Aggiorna anche il link del menu alla versione normalizzata dell'EMM
  const emm = items.find(p => p.id === "emm");
  const navEmm = document.getElementById("navEmm");
  if (emm && navEmm) navEmm.setAttribute("href", normalizeHref(emm.href, "emm"));

  // Applica il fix click dopo il render
  requestAnimationFrame(makeCardsClickProof);
});
