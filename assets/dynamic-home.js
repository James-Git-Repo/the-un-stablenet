import { sb } from "./sb-init.js";

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
  const href = p.href && p.href.trim() ? p.href : `project.html?slug=${p.id}`;
  if (p.id === "coming") {
    const isEditor = document.documentElement.getAttribute("data-mode") === "editor";
    // Use the file that exists in your repo
    return isEditor
      ? `<a class="card" href="project_new.html" data-view-allowed>${inner}</a>`
      : `<article class="card" data-view-block>${inner}</article>`;
  }
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
    if (error) { alert("Thanks! (fallback email opened)"); location.href=`mailto:you@example.com?subject=Subscribe&body=${encodeURIComponent(val)}`; return; }
    form.innerHTML = `<div class="text-green-600 font-semibold">Thanks! You're on the list.</div>`;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  wireNewsletterForm();
  const items = await fetchProjects();
  renderProjects(items);
});
