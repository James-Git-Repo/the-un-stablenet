import { sb } from './sb-init.js';

function normalizeHref(href, id){
  if (!href) return id === 'emm' ? 'emm.html#latest' : `project.html?slug=${id}`;
  try { const u = new URL(href, location.href); return (u.pathname + u.hash).replace(/^\/+/, ''); }
  catch { return href; }
}

function card(p){
  const h = normalizeHref(p.href, p.id);
  return `
    <a class="block rounded-xl border p-4 hover:shadow transition" href="${h}">
      <div class="flex items-center justify-between">
        <h3 class="font-extrabold">${p.title}</h3>
        ${p.tag ? `<span class="text-xs bg-slate-100 px-2 py-1 rounded">${p.tag}</span>` : ''}
      </div>
      ${p.blurb ? `<p class="text-slate-600 mt-2">${p.blurb}</p>` : ''}
    </a>`;
}

async function main(){
  const { data, error } = await sb
    .from('projects')
    .select('id,title,tag,blurb,href,status,sort')
    .order('sort', { ascending: true });
  if (error) { console.error(error); return; }
  const items = (data || []).filter(p => p.status === 'published' || p.id === 'coming');
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  grid.innerHTML = items.map(card).join('');
}

document.addEventListener('DOMContentLoaded', main);
