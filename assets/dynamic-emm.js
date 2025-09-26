// /assets/dynamic-emm.js
import { sb } from './sb-init.js';

function qs(sel){ return document.querySelector(sel); }
function setStatus(msg, ok=true){
  const el = qs('[data-status]');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.remove('text-red-600','text-green-600','hidden');
  el.classList.add(ok ? 'text-green-600' : 'text-red-600');
}
function resetStatus(){ const el = qs('[data-status]'); if (el) { el.textContent=''; el.classList.add('hidden'); } }

async function submitInquiry(e){
  e.preventDefault();
  resetStatus();

  const form = e.currentTarget;
  const btn  = form.querySelector('button[type="submit"]');
  const name = form.querySelector('[name="name"]')?.value?.trim() || null;
  const email= form.querySelector('[name="email"]')?.value?.trim() || null;
  const msg  = form.querySelector('[name="message"]')?.value?.trim();

  if (!msg) { setStatus('Please write a message.', false); return; }
  btn?.setAttribute('disabled','true');

  try{
    const { error } = await sb.from('inquiries').insert([{
      source: 'emm',
      name, email, message: msg,
      meta: { path: location.pathname + location.search + location.hash, ua: navigator.userAgent }
    }]);
    if (error) throw error;
    form.reset();
    setStatus('Thanks! Your contribution has been received.', true);
  }catch(err){
    console.error(err);
    setStatus('Sorry, something went wrong. Please try again later.', false);
  }finally{
    btn?.removeAttribute('disabled');
  }
}

function bind(){
  const form = qs('#contributeForm');
  if (form && !form.dataset.bound){
    form.dataset.bound = '1';
    form.addEventListener('submit', submitInquiry);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bind);
} else {
  bind();
}
