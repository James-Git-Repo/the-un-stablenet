// /assets/dynamic-project.js
import { sb } from './sb-init.js';

/**
 * Resolve slug:
 *  - /project.html?slug=msab
 *  - or pretty route like /project/msab (use a Vercel rewrite)
 */
function getSlug() {
  const u = new URL(location.href);
  const q = u.searchParams.get('slug');
  if (q) return q.trim().toLowerCase();

  // optional: pretty URL support
  const parts = u.pathname.replace(/\/+$/, '').split('/');
  const last = parts[parts.length - 1];
  // e.g., /project/msab -> 'msab'
  return (parts[parts.length - 2] === 'project') ? last : null;
}

function setText(sel, val) {
  const el = document.querySelector(sel);
  if (el) el.textContent = val ?? '';
}

function setHTML(sel, html) {
  const el = document.querySelector(sel);
  if (!el) return;
  // If content is authored by trusted editors, innerHTML is OK.
  // If you store Markdown, convert here first.
  el.innerHTML = html ?? '';
}

async function loadProject(slug) {
  // Adjust to your schema:
  // Table: documents
  // Columns: slug (text), kind (text='project'), title, subtitle, body_html, published (bool)
  const { data, error } = await sb
    .from('documents')
    .select('title, subtitle, body_html, published')
    .eq('slug', slug)
    .eq('kind', 'project')
    .eq('published', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function main() {
  const slug = getSlug();
  if (!slug) {
    setText('.proj-title', 'Project not specified');
    setText('.proj-subtitle', 'Missing ?slug=');
    return;
  }

  try {
    const proj = await loadProject(slug);
    if (!proj) {
      setText('.proj-title', 'Project not found');
      setText('.proj-subtitle', `No published project for slug “${slug}”.`);
      return;
    }

    document.title = `${proj.title} — The (un)Stable Net`;
    setText('.proj-title', proj.title);
    setText('.proj-subtitle', proj.subtitle);
    setHTML('[data-publish-target="project"]', proj.body_html);
  } catch (e) {
    console.error(e);
    setText('.proj-title', 'Error loading project');
    setText('.proj-subtitle', 'Please try again later.');
  }
}

main();
