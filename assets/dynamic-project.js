// /assets/dynamic-project.js
import { sb } from './sb-init.js';

function getSlug() {
  const u = new URL(location.href);
  const q = u.searchParams.get('slug');
  if (q) return q.trim().toLowerCase();
  const parts = u.pathname.replace(/\/+$/, '').split('/');
  return (parts[parts.length - 2] === 'project') ? parts[parts.length - 1] : null;
}

function setText(sel, val) { const el = document.querySelector(sel); if (el) el.textContent = val ?? ''; }
function setHTML(sel, html) { const el = document.querySelector(sel); if (el) el.innerHTML = html ?? ''; }

async function loadProject(slug) {
  // If you store projects in `projects`, reuse that table. Otherwise point to `documents`.
  const { data, error } = await sb
    .from('documents')  // or 'projects' if body_html lives there
    .select('title, subtitle, body_html, published')
    .eq('slug', slug)
    .eq('kind', 'project')
    .eq('published', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

(async function main(){
  const slug = getSlug();
  if (!slug) { setText('.proj-title','Project not specified'); setText('.proj-subtitle','Missing ?slug='); return; }
  try{
    const proj = await loadProject(slug);
    if (!proj) { setText('.proj-title','Project not found'); setText('.proj-subtitle',`No published project for “${slug}”.`); return; }
    document.title = `${proj.title} — The (un)Stable Net`;
    setText('.proj-title', proj.title);
    setText('.proj-subtitle', proj.subtitle);
    setHTML('[data-publish-target="project"]', proj.body_html);
  }catch(e){
    console.error(e);
    setText('.proj-title','Error loading project');
    setText('.proj-subtitle','Please try again later.');
  }
})();
