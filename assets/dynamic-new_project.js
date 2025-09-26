// /assets/dynamic-new_project.js
// ---- simple mode gate (Editor/User/Viewer) ----
const MODE_KEY = 'tsn_mode';
function getMode() {
  return document.documentElement.getAttribute('data-mode')
      || localStorage.getItem(MODE_KEY)
      || 'viewer';
}
const isEditor = getMode() === 'editor';

function applyViewerLock() {
  // Hide all elements marked as editor-only
  document.querySelectorAll('[data-editor-ui]').forEach(el => el.setAttribute('hidden', ''));

  // Soft-lock form controls unless explicitly allowed
  document.querySelectorAll('input, textarea, select, button').forEach(el => {
    if (!el.closest('[data-view-allowed]')) {
      // Keep nav toggle & links interactive
      if (el.id === 'navToggle') return;
      el.disabled = true;
      el.setAttribute('data-locked', 'true');
    }
  });

  // Optional notice
  const note = document.createElement('div');
  note.setAttribute('data-view-allowed', '');
  note.className = 'max-w-7xl mx-auto px-4 sm:px-6 py-6';
  note.innerHTML = `
    <div class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      This page is read-only in Viewer/User mode. Press <b>Ctrl/Cmd + Shift + E</b> to enter Editor.
      <a class="underline ml-2" href="index.html">Back to Home</a>
    </div>`;
  document.body.prepend(note);
}

// ---------- Utilities ----------
const $ = sel => document.querySelector(sel);
const $all = sel => Array.from(document.querySelectorAll(sel));

const todayISO = () => new Date().toISOString().slice(0,10);
const nowISO = () => new Date().toISOString();
const formatDateUI = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  } catch { return iso }
};

const uuidv4 = () =>
  ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );

const kebab = (s) => s
  .toLowerCase()
  .replace(/['’]/g,'')
  .replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'')
  .slice(0,96);

const isValidUrl = (u) => {
  if(!u) return false;
  try { const x=new URL(u); return ['http:','https:'].includes(x.protocol) } catch { return false }
};
const isImageUrlish = (u) => /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(u);

// ---------- Minimal Markdown Renderer ----------
function escapeHtml(s){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) }
function mdRender(src){
  let s = escapeHtml(src || '');
  // code fences
  s = s.replace(/```([\s\S]*?)```/g, (m, p1) => `<pre><code>${p1.replace(/\n$/,'')}</code></pre>`);
  // headings
  s = s.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
       .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
       .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
       .replace(/^### (.*)$/gm, '<h3>$1</h3>')
       .replace(/^## (.*)$/gm, '<h2>$1</h2>')
       .replace(/^# (.*)$/gm, '<h1>$1</h1>');
  // lists
  s = s.replace(/^(?:-|\*) (.*)$/gm, '<li>$1</li>');
  s = s.replace(/(<li>[\s\S]*?<\/li>)(?!(?:\n<li>|$))/g, '<ul>$1</ul>');
  // bold/italic/code
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/_(.+?)_/g, '<em>$1</em>');
  s = s.replace(/`([^`]+?)`/g, '<code>$1</code>');
  // links
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  // paragraphs
  s = s.replace(/(^|\n)([^\n<].+)(?=\n|$)/g, (m, a, b) => /\<(h\d|ul|pre|li|p)/.test(b) ? a+b : a+`<p>${b}</p>`);
  return s;
}

// ---------- State ----------
let slugEdited = false;
let dirty = false;

const defaultProject = () => ({
  id: uuidv4(),
  slug: '',
  title: '',
  subtitle: '',
  date: todayISO(),
  tags: [],
  accent: '#0b5fff',
  cover: {
    style: 'solid',
    imageUrl: '',
    alt: ''
  },
  summary: '',
  body: '',
  links: { website:'', repo:'', video:'' },
  seo: { title:'', description:'', image:'' },
  visibility: 'draft',
  createdAt: nowISO(),
  updatedAt: nowISO()
});

let project = defaultProject();

// ---------- LocalStorage projects array ----------
function getProjects(){
  try{ return JSON.parse(localStorage.getItem('projects')||'[]') }catch{ return [] }
}
function setProjects(arr){
  localStorage.setItem('projects', JSON.stringify(arr));
}

// ---------- Helpers ----------
function announce(msg){ const lr = $('#liveRegion'); lr.textContent=''; setTimeout(()=>lr.textContent=msg,10) }

function refreshSeoFallbacks(){
  $('#seoFallbacks').textContent =
    `Fallbacks → Title: "${project.title || '—'}", Description: "${project.summary || '—'}", Image: ${project.cover.imageUrl ? project.cover.imageUrl : '—'}`;
}

function setDirty(){
  if(!dirty){ dirty = true; }
}

window.addEventListener('beforeunload', (e)=>{
  if(dirty){
    e.preventDefault();
    e.returnValue = '';
  }
});

// ---------- Form Bindings ----------
function bindBasics(){
  // Title
  const title = $('#title');
  title.addEventListener('input', e=>{
    project.title = e.target.value.trimStart();
    $('#titleCount').textContent = `${project.title.length} / 80`;
    validateField('title');
    if(!slugEdited){
      const newSlug = kebab(project.title);
      $('#slug').value = newSlug;
      project.slug = newSlug;
      validateField('slug');
    }
    renderPreviews();
    setDirty();
  });

  // Slug
  const slug = $('#slug');
  slug.addEventListener('input', e=>{
    slugEdited = true;
    const cleaned = kebab(e.target.value);
    e.target.value = cleaned;
    project.slug = cleaned;
    validateField('slug');
    setDirty();
  });

  // Subtitle
  $('#subtitle').addEventListener('input', e=>{
    project.subtitle = e.target.value;
    renderPreviews();
    setDirty();
  });

  // Date
  $('#date').addEventListener('change', e=>{
    project.date = e.target.value || todayISO();
    renderPreviews();
    setDirty();
  });

  // Visibility
  $all('.vis-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $all('.vis-btn').forEach(b=>b.classList.remove('bg-slate-50'));
      btn.classList.add('bg-slate-50');
      const v = btn.getAttribute('data-vis');
      project.visibility = v;
      $('#visibility').value = v;
      setDirty();
    })
  });
}

function bindCover(){
  // toggle
  $all('.cover-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $all('.cover-btn').forEach(b=>b.classList.remove('bg-slate-50'));
      btn.classList.add('bg-slate-50');
      const style = btn.getAttribute('data-cover');
      project.cover.style = style;
      $('#coverStyle').value = style;
      $('#coverSolidRow').classList.toggle('hidden', style!=='solid');
      $('#coverImageRow').classList.toggle('hidden', style!=='image');
      validateField('cover');
      renderPreviews();
      setDirty();
    })
  });

  // Solid color
  const color = $('#coverColor'), hex = $('#coverHex');
  color.addEventListener('input', e=>{
    hex.value = e.target.value;
    renderPreviews();
    setDirty();
  });
  hex.addEventListener('input', e=>{
    let v = e.target.value.trim();
    if(!v.startsWith('#')) v = '#'+v.replace(/^#+/,'');
    if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)){
      color.value = v;
      e.target.classList.remove('ring-2','ring-red-500');
    }else{
      e.target.classList.add('ring-2','ring-red-500');
    }
    renderPreviews();
    setDirty();
  });

  // Image url + alt
  const url = $('#coverUrl');
  const alt = $('#coverAlt');

  url.addEventListener('input', ()=>{
    project.cover.imageUrl = url.value.trim();
    validateField('cover');
    renderPreviews();
    setDirty();
  });
  url.addEventListener('dragover', e=>{ e.preventDefault(); });
  url.addEventListener('drop', e=>{
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if(isValidUrl(text)){ url.value = text; project.cover.imageUrl = text; validateField('cover'); renderPreviews(); setDirty(); }
  });
  url.addEventListener('focus', async ()=>{
    try{
      const clip = await navigator.clipboard.readText();
      if(!url.value && isValidUrl(clip) && isImageUrlish(clip)){
        url.value = clip;
        project.cover.imageUrl = clip;
        validateField('cover'); renderPreviews(); setDirty();
        announce('Image URL auto-pasted from clipboard');
      }
    }catch{}
  });

  alt.addEventListener('input', ()=>{
    project.cover.alt = alt.value.trim();
    validateField('cover');
    setDirty();
  });
}

function bindMetadata(){
  // tags
  const input = $('#tagInput');
  const area = $('#tagArea');
  function addTag(t){
    t = t.trim();
    if(!t) return;
    if(project.tags.length >= 5) { showError('tagsError','Maximum 5 tags'); return; }
    if(project.tags.includes(t)) return;
    project.tags.push(t);
    renderTags(); renderPreviews(); hideError('tagsError'); setDirty();
  }
  function removeTag(t){
    project.tags = project.tags.filter(x=>x!==t);
    renderTags(); renderPreviews(); hideError('tagsError'); setDirty();
  }
  function renderTags(){
    // remove all chips except input
    $all('#tagArea .tag-chip').forEach(n=>n.remove());
    project.tags.forEach((t,i)=>{
      const chip = document.createElement('button');
      chip.type='button';
      chip.draggable = true;
      chip.className='tag-chip chip px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2';
      chip.innerHTML = `<span>${t}</span><span aria-hidden="true">✕</span>`;
      chip.addEventListener('click', ()=>removeTag(t));
      // drag-to-reorder
      chip.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', String(i)); });
      chip.addEventListener('dragover', (e)=>e.preventDefault());
      chip.addEventListener('drop', (e)=>{
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        const to = i;
        const arr = project.tags;
        const [m] = arr.splice(from,1);
        arr.splice(to,0,m);
        renderTags(); renderPreviews(); setDirty();
      });
      chip.classList.add('tag-chip');
      area.insertBefore(chip, input);
    });
    // card/hero tags are re-rendered in renderPreviews
  }
  input.addEventListener('keydown', (e)=>{
    if(e.key==='Enter' || e.key===','){
      e.preventDefault();
      const val = input.value.trim();
      if(val){ addTag(val); input.value=''; }
    } else if(e.key==='Backspace' && !input.value && project.tags.length){
      project.tags.pop(); renderTags(); renderPreviews(); setDirty();
    }
  });
  $all('.suggest').forEach(btn=>{
    btn.addEventListener('click', ()=> addTag(btn.dataset.suggest));
  });

  // accent sync
  const acc = $('#accentColor'), accHex = $('#accentHex');
  acc.addEventListener('input', e=>{
    project.accent = e.target.value;
    accHex.value = project.accent;
    renderPreviews(); setDirty();
  });
  accHex.addEventListener('input', e=>{
    let v = e.target.value.trim();
    if(!v.startsWith('#')) v = '#'+v.replace(/^#+/,'');
    if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)){
      project.accent = v; acc.value = v; e.target.classList.remove('ring-2','ring-red-500');
      renderPreviews();
    } else {
      e.target.classList.add('ring-2','ring-red-500');
    }
    setDirty();
  });
}

function bindContent(){
  // summary
  const sum = $('#summary');
  sum.addEventListener('input', e=>{
    project.summary = e.target.value;
    $('#summaryCount').textContent = `${project.summary.length} / 240`;
    validateField('summary');
    renderPreviews(); setDirty();
  });

  // body + toolbar
  const body = $('#body');
  const inline = $('#inlineMd');
  const applyMd = (cmd)=>{
    const { selectionStart:s, selectionEnd:e, value:v } = body;
    const sel = v.slice(s,e) || 'text';
    let before='', after='', insert='';
    if(cmd==='bold'){ before='**'; after='**'; }
    if(cmd==='italic'){ before='_'; after='_'; }
    if(cmd==='h2'){ before='## '; }
    if(cmd==='list'){ before='- '; }
    if(cmd==='link'){ insert=`[${sel}](https://)`; }
    if(cmd==='code'){
      insert = "```\n" + sel + "\n```";
    }
    if(insert){
      body.setRangeText(insert, s, e, 'end');
    } else {
      body.setRangeText(before + sel + (after||''), s, e, 'end');
    }
    body.dispatchEvent(new Event('input', {bubbles:true}));
    body.focus();
  };
  $all('.md-btn').forEach(b=>{
    b.addEventListener('click', ()=>applyMd(b.dataset.md));
  });
  body.addEventListener('input', e=>{
    project.body = e.target.value;
    inline.innerHTML = mdRender(project.body);
    $('#bodyPreview').innerHTML = mdRender(project.body);
    setDirty();
  });
}

function bindLinksSeo(){
  const ws = $('#linkWebsite'), rp = $('#linkRepo'), vd = $('#linkVideo');
  ws.addEventListener('input', ()=>{ project.links.website = ws.value.trim(); validateField('website'); setDirty(); });
  rp.addEventListener('input', ()=>{ project.links.repo = rp.value.trim(); validateField('repo'); setDirty(); });
  vd.addEventListener('input', ()=>{ project.links.video = vd.value.trim(); validateField('video'); setDirty(); });

  $('#seoTitle').addEventListener('input', e=>{ project.seo.title = e.target.value; refreshSeoFallbacks(); setDirty(); });
  $('#seoDesc').addEventListener('input', e=>{ project.seo.description = e.target.value; refreshSeoFallbacks(); setDirty(); });
  $('#seoImage').addEventListener('input', e=>{ project.seo.image = e.target.value.trim(); refreshSeoFallbacks(); setDirty(); });
}

// ---------- Validation ----------
function showError(id,msg){ const el = $('#'+id); el.textContent = msg; el.classList.remove('hidden') }
function hideError(id){ const el = $('#'+id); el.textContent=''; el.classList.add('hidden') }

function validateField(name){
  switch(name){
    case 'title': {
      const ok = project.title.trim().length >= 6 && project.title.trim().length <= 80;
      ok ? hideError('titleError') : showError('titleError', 'Title must be 6–80 characters.');
      return ok;
    }
    case 'slug': {
      const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      let msg = '';
      if(!project.slug) msg='Slug is required.';
      else if(!pattern.test(project.slug)) msg='Use kebab-case (a–z, 0–9, hyphens).';
      else {
        const existing = getProjects().find(p=>p.slug===project.slug && p.id!==project.id);
        if(existing) msg='Slug already exists in your browser.';
      }
      if(msg){ showError('slugError', msg); return false } else { hideError('slugError'); return true }
    }
    case 'summary': {
      const ok = project.summary.length <= 240;
      ok ? hideError('summaryError') : showError('summaryError','Summary must be ≤ 240 chars.');
      return ok;
    }
    case 'cover': {
      if(project.cover.style==='image'){
        const uok = isValidUrl(project.cover.imageUrl);
        const aok = project.cover.alt.trim().length>0;
        !uok ? showError('coverUrlError','Valid image URL required.') : hideError('coverUrlError');
        !aok ? showError('coverAltError','Alt text is required for image covers.') : hideError('coverAltError');
        return uok && aok;
      } else {
        hideError('coverUrlError'); hideError('coverAltError'); return true;
      }
    }
    case 'website': {
      const v = project.links.website;
      if(!v){ hideError('websiteError'); return true }
      const ok = isValidUrl(v);
      ok ? hideError('websiteError') : showError('websiteError','Enter a valid URL (https://)');
      return ok;
    }
    case 'repo': {
      const v = project.links.repo;
      if(!v){ hideError('repoError'); return true }
      const ok = isValidUrl(v);
      ok ? hideError('repoError') : showError('repoError','Enter a valid URL (https://)');
      return ok;
    }
    case 'video': {
      const v = project.links.video;
      if(!v){ hideError('videoError'); return true }
      const ok = isValidUrl(v);
      ok ? hideError('videoError') : showError('videoError','Enter a valid URL (https://)');
      return ok;
    }
  }
  return true;
}

function validateAll(){
  const checks = ['title','slug','summary','cover','website','repo','video'].map(validateField);
  const ok = checks.every(Boolean) && project.tags.length<=5;
  setSaveEnabled(ok);
  return ok;
}

function setSaveEnabled(enabled){
  const hardDisable = !isEditor;
  $('#saveBtn')?.setAttribute('disabled', hardDisable || !enabled ? 'true' : '');
  $('#saveBtn_m')?.setAttribute('disabled', hardDisable || !enabled ? 'true' : '');
}

// ---------- Previews ----------
function renderPreviews(){
  // card
  $('#cardAccent').style.background = project.accent || '#0b5fff';
  $('#cardTitle').textContent = project.title || '—';
  $('#cardSummary').textContent = project.summary || project.subtitle || '—';
  $('#cardDate').textContent = project.date ? formatDateUI(project.date) : '—';

  const tagsWrap = $('#cardTags'); tagsWrap.innerHTML='';
  project.tags.slice(0,5).forEach(t=>{
    const el = document.createElement('span');
    el.className='chip px-2 py-1 bg-slate-100 text-slate-700';
    el.textContent = t;
    tagsWrap.appendChild(el);
  });

  // modal card mirrors
  $('#modalAccent').style.background = project.accent || '#0b5fff';
  $('#modalTitleH').textContent = project.title || '—';
  $('#modalSummary').textContent = project.summary || project.subtitle || '—';
  $('#modalDate').textContent = project.date ? formatDateUI(project.date) : '—';
  const mTags = $('#modalTags'); mTags.innerHTML='';
  project.tags.slice(0,5).forEach(t=>{
    const el = document.createElement('span');
    el.className='chip px-2 py-1 bg-slate-100 text-slate-700';
    el.textContent = t;
    mTags.appendChild(el);
  });

  // hero
  $('#heroTitle').textContent = project.title || '—';
  $('#heroSubtitle').textContent = project.subtitle || project.summary || '—';
  $('#heroDate').textContent = project.date ? formatDateUI(project.date) : '—';
  const hTags = $('#heroTags'); hTags.innerHTML='';
  project.tags.slice(0,5).forEach(t=>{
    const el = document.createElement('span');
    el.className='chip px-2 py-1 bg-white/15 text-white';
    el.textContent = t;
    hTags.appendChild(el);
  });

  if(project.cover.style==='image' && isValidUrl(project.cover.imageUrl)){
    $('#heroImage').style.backgroundImage = `url('${project.cover.imageUrl}')`;
    $('#heroImage').classList.remove('hidden');
    $('#heroSolid').classList.add('hidden');
  } else {
    const solid = $('#coverHex').value || '#0b0f13';
    $('#heroImage').classList.add('hidden');
    $('#heroSolid').classList.remove('hidden');
    $('#heroSolid').style.background = `linear-gradient(135deg, ${solid} 0%, ${project.accent}33 100%)`;
  }

  // body
  $('#bodyPreview').innerHTML = mdRender(project.body);
  refreshSeoFallbacks();
  validateAll();
}

// ---------- Save & Download ----------
function buildOutput(){
  const out = JSON.parse(JSON.stringify(project));
  out.date = project.date || todayISO();
  out.updatedAt = nowISO();
  // SEO fallbacks
  out.seo = {
    title: project.seo.title || project.title,
    description: project.seo.description || project.summary,
    image: project.seo.image || (project.cover.style==='image' ? project.cover.imageUrl : '')
  };
  return out;
}

function saveToLocal(){
  const out = buildOutput();
  const arr = getProjects();
  const idx = arr.findIndex(p=>p.id===out.id || p.slug===out.slug);
  if(idx>=0){ arr[idx] = out } else { arr.unshift(out) }
  setProjects(arr);
  project.createdAt = project.createdAt || nowISO();
  project.updatedAt = out.updatedAt;
  dirty = false;
  return out;
}

function downloadJSON(out){
  const slug = out.slug || 'project';
  const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `project-${slug}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- UI Actions ----------
function openToast(){
  $('#toast').classList.remove('hidden');
  announce('Project saved');
}
function closeToast(){ $('#toast').classList.add('hidden') }

function openModal(){ $('#modal').classList.remove('hidden'); $('#modal').classList.add('flex') }
function closeModal(){ $('#modal').classList.add('hidden'); $('#modal').classList.remove('flex') }

function resetForm(){
  if(dirty && !confirm('Discard unsaved changes?')) return;
  slugEdited = false;
  project = defaultProject();
  populateForm();
  renderPreviews();
  dirty = false;
  announce('Form reset');
}

function populateForm(){
  $('#year').textContent = new Date().getFullYear();
  project.date = project.date || todayISO();
  $('#title').value = project.title; $('#titleCount').textContent='0 / 80';
  $('#slug').value = project.slug;
  $('#subtitle').value = project.subtitle;
  $('#date').value = project.date || todayISO();
  $('#visibility').value = project.visibility;
  $all('.vis-btn').forEach(b=>b.classList.toggle('bg-slate-50', b.getAttribute('data-vis')===project.visibility));

  // cover
  $('#coverStyle').value = project.cover.style;
  $all('.cover-btn').forEach(b=>b.classList.toggle('bg-slate-50', b.getAttribute('data-cover')===project.cover.style));
  $('#coverSolidRow').classList.toggle('hidden', project.cover.style!=='solid');
  $('#coverImageRow').classList.toggle('hidden', project.cover.style!=='image');
  $('#coverColor').value = '#0b0f13';
  $('#coverHex').value = '#0b0f13';
  $('#coverUrl').value = project.cover.imageUrl || '';
  $('#coverAlt').value = project.cover.alt || '';

  // metadata
  $('#accentColor').value = project.accent || '#0b5fff';
  $('#accentHex').value = project.accent || '#0b5fff';
  $('#tagInput').value='';
  // remove existing chips (if any)
  $all('#tagArea .tag-chip').forEach(n=>n.remove());
  project.tags.forEach(()=>{}); // will render in renderPreviews via renderTags call below

  // content
  $('#summary').value = project.summary; $('#summaryCount').textContent = `${project.summary.length} / 240`;
  $('#body').value = project.body; $('#inlineMd').innerHTML = mdRender(project.body);

  // links & seo
  $('#linkWebsite').value = project.links.website || '';
  $('#linkRepo').value = project.links.repo || '';
  $('#linkVideo').value = project.links.video || '';
  $('#seoTitle').value = project.seo.title || '';
  $('#seoDesc').value = project.seo.description || '';
  $('#seoImage').value = project.seo.image || '';

  // helper note persistence
  const helperDismissed = localStorage.getItem('projects_helper_dismissed')==='1';
  $('#helperNote').classList.toggle('hidden', helperDismissed);
}

// ---------- Events ----------
function bindActions(){
  // desktop
  $('#saveBtn')?.addEventListener('click', ()=>{
    if(!validateAll()) return;
    const out = saveToLocal();
    openToast();
  });
  $('#downloadBtn')?.addEventListener('click', ()=> downloadJSON(buildOutput()));
  $('#previewCardBtn')?.addEventListener('click', ()=> openModal());
  $('#resetBtn')?.addEventListener('click', resetForm);
  $('#backHomeBtn')?.addEventListener('click', (e)=>{ if(dirty && !confirm('You have unsaved changes. Leave page?')) e.preventDefault() });
  $('#backHomeTop')?.addEventListener('click', (e)=>{ if(dirty && !confirm('You have unsaved changes. Leave page?')) e.preventDefault() });

  // mobile
  $('#saveBtn_m')?.addEventListener('click', ()=>{ if(!validateAll()) return; saveToLocal(); openToast(); });
  $('#downloadBtn_m')?.addEventListener('click', ()=> downloadJSON(buildOutput()));
  $('#previewCardBtn_m')?.addEventListener('click', ()=> openModal());
  $('#backHomeBtn_m')?.addEventListener('click', (e)=>{ if(dirty && !confirm('You have unsaved changes. Leave page?')) e.preventDefault() });

  // toast
  $('#toastDownload')?.addEventListener('click', ()=> downloadJSON(buildOutput()));
  $('#toastClose')?.addEventListener('click', closeToast);

  // modal
  $('#modalClose')?.addEventListener('click', closeModal);
  $('#modalClose2')?.addEventListener('click', closeModal);
  $('#modal')?.addEventListener('click', (e)=>{ if(e.target.id==='modal') closeModal() });

  // helper dismiss
  $('#dismissHelper')?.addEventListener('click', ()=>{
    localStorage.setItem('projects_helper_dismissed','1');
    $('#helperNote').classList.add('hidden');
  });
}

// utility to re-render tag chips in input area (used by init and some handlers)
function renderTags(){
  const input = $('#tagInput');
  $all('#tagArea .tag-chip').forEach(n=>n.remove());
  project.tags.forEach((t,i)=>{
    const chip = document.createElement('button');
    chip.type='button'; chip.draggable = true;
    chip.className='tag-chip chip px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2';
    chip.innerHTML = `<span>${t}</span><span aria-hidden="true">✕</span>`;
    chip.addEventListener('click', ()=>{ project.tags.splice(i,1); renderTags(); renderPreviews(); setDirty(); });
    chip.addEventListener('dragstart',(e)=>{ e.dataTransfer.setData('text/plain', String(i)); });
    chip.addEventListener('dragover',(e)=>e.preventDefault());
    chip.addEventListener('drop',(e)=>{ e.preventDefault(); const from=Number(e.dataTransfer.getData('text/plain')); const to=i; const arr=project.tags; const [m]=arr.splice(from,1); arr.splice(to,0,m); renderTags(); renderPreviews(); setDirty(); });
    input.parentElement.insertBefore(chip, input);
  });
}

// ---------- Init ----------
function init(){
  $('#year').textContent = new Date().getFullYear();
  project.date = todayISO();
  populateForm();

  // Lock the page if not editor
  if (!isEditor) applyViewerLock();

  // Only wire editing handlers if editor
  if (isEditor) {
    bindBasics();
    bindCover();
    bindMetadata();
    bindContent();
    bindLinksSeo();
    bindActions();
  }

  // initial tag render (empty)
  renderTags();
  renderPreviews();
  setSaveEnabled(false);
}

document.addEventListener('DOMContentLoaded', init);
