<script type="module">
  import { sb } from "./sb-init.js";

  function qs(s){ return document.querySelector(s) }

  async function loadBio(){
    // prendi la più recente pubblicata
    const { data, error } = await sb
      .from('bio_pages')
      .select('title, hero_url, body_html')
      .eq('status','published')
      .order('published_at', { ascending:false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return;

    const { title, hero_url, body_html } = data;
    qs('.bio-name')?.replaceChildren(document.createTextNode(title || ''));
    if (hero_url) qs('.bio-hero')?.style && (qs('.bio-hero').style.backgroundImage = `url('${hero_url}')`);
    if (body_html) qs('#bioBody')?.replaceChildren(...(new DOMParser().parseFromString(body_html,'text/html').body.childNodes));
  }

  document.addEventListener('DOMContentLoaded', loadBio);
</script>
