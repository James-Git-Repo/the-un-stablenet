// /assets/dynamic-project.js
import { sb } from './sb-init.js';

function getSlug() {
  const u = new URL(location.href);
  const q = u.searchParams.get('slug');
  if (q) return q.trim().toLowerCase();
  const parts = u.pathname.replace(/\/+$/, '').split('/');
  return (parts[parts.length - 2] === 'project') ? parts[parts.length - 1] : null;
}

const setText = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v ?? ''; };
const setHTML = (sel, v) => { const el = document.querySelector(sel); if (el) el.innerHTML = v ?? ''; };

async function loadProject(id) {
  const { data, error } = await sb
    .from('projects')
    .select('title, subtitle, body_html, status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status !== 'published') return null;
  return data;
}

(async function main(){
  const id = getSlug();
  if (!id) { setText('.proj-title','Project not specified'); setText('.proj-subtitle','Missing ?slug='); return; }
  try{
    const proj = await loadProject(id);
    if (!proj) { setText('.proj-title','Project not found'); setText('.proj-subtitle',`No published project for “${id}”.`); return; }
    document.title = `${proj.title} — The (un)Stable Net`;
    setText('.proj-title', proj.title);
    setText('.proj-subtitle', proj.subtitle || '');
    setHTML('[data-publish-target="project"]', proj.body_html || '');
  }catch(e){
    console.error(e);
    setText('.proj-title','Error loading project');
    setText('.proj-subtitle','Please try again later.');
  }
})();
