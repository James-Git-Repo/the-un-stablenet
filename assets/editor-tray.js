import { sb } from "./sb-init.js";
import { signIn, signOut, getUser } from "./editor-auth.js";

function el(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

function trayUI(){
  return el(`<div id="editorTray" class="only-editor" style="position:fixed;bottom:16px;left:16px;z-index:9999;background:#0b0f13;color:#fff;padding:12px 14px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);font:500 12px/1.2 Inter,system-ui">
    <div style="display:flex;gap:8px;align-items:center;">
      <strong>Editor</strong>
      <button id="etLogin" style="padding:6px 10px;border-radius:8px;border:1px solid #2b3a55;background:transparent;color:#fff">Login</button>
      <button id="etPublish" style="padding:6px 10px;border-radius:8px;border:1px solid #2b3a55;background:#1f4aff;color:#fff">Publish</button>
      <button id="etNewProj" style="padding:6px 10px;border-radius:8px;border:1px solid #2b3a55;background:#111827;color:#fff">New Project</button>
      <span id="etStatus" style="opacity:.7;margin-left:6px">viewer</span>
    </div>
  </div>`);
}

function loginModal(){
  return el(`<div id="etModal" class="only-editor" style="position:fixed;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:10000">
    <div style="background:#0b0f13;color:#fff;border:1px solid #2b3a55;border-radius:14px;padding:16px;min-width:280px">
      <div style="font-weight:700;margin-bottom:8px">Editor login</div>
      <input id="etEmail" placeholder="email" style="width:100%;padding:8px;border-radius:8px;border:1px solid #2b3a55;background:#0f172a;color:#fff;margin-bottom:6px">
      <input id="etPass" placeholder="password" type="password" style="width:100%;padding:8px;border-radius:8px;border:1px solid #2b3a55;background:#0f172a;color:#fff;margin-bottom:10px">
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="etCancel" style="padding:6px 10px;border-radius:8px;border:1px solid #2b3a55;background:transparent;color:#fff">Cancel</button>
        <button id="etDoLogin" style="padding:6px 10px;border-radius:8px;border:1px solid #2b3a55;background:#1f4aff;color:#fff">Login</button>
      </div>
    </div>
  </div>`);
}

async function publishForPage(){
  const path = location.pathname;
  const mode = document.documentElement.getAttribute('data-mode');
  if (mode !== 'editor') return alert("Please log in to enter Editor mode first.");
  const user = await getUser();
  if (!user) return alert("Login first.");

  const now = new Date().toISOString();

  if (/emm_article_professional_hero/i.test(path)) {
    const title = document.querySelector('.cover-title')?.textContent?.trim() || 'Untitled';
    const subtitle = document.querySelector('.cover-deck')?.textContent?.trim() || '';
    const hero_url = getComputedStyle(document.querySelector('.hero')||document.body).backgroundImage.replace(/^url\(["']?(.+?)["']?\)$/,'$1');
    const body_html = document.getElementById('articleBody')?.innerHTML || '';
    const slug = prompt("Article slug (letters-dashes):", (title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')) || 'emm-' + Date.now();
    const { error } = await sb.from('emm_articles').upsert({ slug, title, subtitle, hero_url, body_html, status:'published', published_at: now }).select();
    if (error) return alert("Publish failed: " + error.message);
    alert("EMM published.");
  }
  else if (/bio\.html/i.test(path)) {
    const body_html = document.getElementById('bioBody')?.innerHTML || document.querySelector('[data-publish-target="bio"]')?.innerHTML || '';
    const title = document.querySelector('.bio-name')?.textContent?.trim() || 'Bio';
    const hero_url = getComputedStyle(document.querySelector('.bio-hero')||document.body).backgroundImage.replace(/^url\(["']?(.+?)["']?\)$/,'$1');
    const { error } = await sb.from('bio_pages').upsert({ slug:'bio', title, hero_url, body_html, status:'published', published_at: now }).select();
    if (error) return alert("Publish failed: " + error.message);
    alert("Bio published.");
  }
  else if (/msb/i.test(path)) {
    const body_html = document.getElementById('msbBody')?.innerHTML || document.querySelector('[data-publish-target="msb"]')?.innerHTML || '';
    const hero_url = getComputedStyle(document.querySelector('.msb-hero')||document.body).backgroundImage.replace(/^url\(["']?(.+?)["']?\)$/,'$1');
    const title = document.title || 'MSB';
    const { error } = await sb.from('msb_pages').upsert({ slug:'msb', title, hero_url, body_html, status:'published', published_at: now }).select();
    if (error) return alert("Publish failed: " + error.message);
    alert("MSB published.");
  }
  else {
    // Generic project page (project.html?slug=...)
    const url = new URL(location.href);
    const slug = url.searchParams.get('slug') || prompt("Project slug (letters-dashes):", 'project-'+Date.now());
    const title = document.querySelector('.proj-title')?.textContent?.trim() || slug;
    const subtitle = document.querySelector('.proj-subtitle')?.textContent?.trim() || '';
    const hero_url = getComputedStyle(document.querySelector('.proj-hero')||document.body).backgroundImage.replace(/^url\(["']?(.+?)["']?\)$/,'$1');
    const body_html = document.querySelector('.proj-body')?.innerHTML || document.querySelector('[data-publish-target="project"]')?.innerHTML || '';
    const { error } = await sb.from('project_pages').upsert({ slug, title, subtitle, hero_url, body_html, status:'published', published_at: now }).select();
    if (error) return alert("Publish failed: " + error.message);
    alert("Project page published.");
  }
}

async function createNewProject(){
  const user = await getUser();
  if (!user) return alert("Login first.");
  const id = prompt("New project ID (letters-dashes):", "new-project");
  if (!id) return;
  const title = prompt("Project title:", "Untitled Project") || "Untitled Project";
  const blurb = prompt("Short blurb:", "A new project.") || "A new project.";
  const href = confirm("Use dynamic page? (OK=yes)") ? "" : prompt("Custom href (e.g., msb.html):", "") || "";
  const cover_url = prompt("Cover image URL:", "");
  const sort = parseInt(prompt("Sort order (lower appears first):", "50")||"50",10);
  const now = new Date().toISOString();
  const { error: e1 } = await sb.from('projects').upsert({ id, title, tag:'Project', blurb, href: href||null, cover_url, status:'published', sort }).select();
  if (e1) return alert("Project card failed: " + e1.message);
  const { error: e2 } = await sb.from('project_pages').upsert({ slug:id, title, subtitle: blurb, hero_url: cover_url, body_html: '<p>Edit me in Editor then click Publish.</p>', status:'published', published_at: now }).select();
  if (e2) return alert("Project page failed: " + e2.message);
  alert("New project created and published.");
}

async function refreshStatus(){
  const user = await getUser();
  const et = document.getElementById('etStatus');
  if (et) et.textContent = user ? ("logged in: " + (user.email||"")) : "not logged in";
}

function boot(){
  // Tray only visible in Editor mode; access-mode.js will switch to editor if user is authenticated
  if (document.documentElement.getAttribute('data-mode') !== 'editor') return;

  const tray = trayUI();
  document.body.appendChild(tray);

  const login = tray.querySelector('#etLogin');
  const publish = tray.querySelector('#etPublish');
  const newp = tray.querySelector('#etNewProj');

  login.addEventListener('click', () => {
    const modal = loginModal();
    document.body.appendChild(modal);
    modal.querySelector('#etCancel').onclick = () => modal.remove();
    modal.querySelector('#etDoLogin').onclick = async () => {
      const email = modal.querySelector('#etEmail').value.trim();
      const pass = modal.querySelector('#etPass').value;
      try {
        await signIn(email, pass);
        modal.remove();
        refreshStatus();
        if (window.TSN_View) window.TSN_View.enterEditorIfAuthed();
      } catch(e){ alert(e.message); }
    };
  });

  publish.addEventListener('click', publishForPage);
  newp.addEventListener('click', createNewProject);

  refreshStatus();
  // if already logged in when page loads, ensure we're in Editor
  getUser().then(u => { if (u && window.TSN_View) window.TSN_View.enterEditorIfAuthed(); });
}

document.addEventListener('DOMContentLoaded', boot);
