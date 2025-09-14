<script type="module">
  import { sb } from "./sb-init.js";
  const qs = (s)=>document.querySelector(s);

  function slugFromHash() {
    const h = (location.hash||'').replace(/^#/, '');
    if (!h || h === 'latest') return null;
    return h;
  }

  async function loadArticle() {
    const slug = slugFromHash();

    let q = sb.from('emm_articles').select('slug,title,subtitle,hero_url,body_html,published_at').eq('status','published');
    q = slug ? q.eq('slug', slug).maybeSingle() : q.order('published_at', { ascending:false }).limit(1).maybeSingle();

    const { data, error } = await q;
    if (error || !data) return;

    qs('#articleTitle')?.replaceChildren(document.createTextNode(data.title || ''));
    qs('.cover-deck')?.replaceChildren(document.createTextNode(data.subtitle || ''));
    if (data.hero_url && qs('.hero')) qs('.hero').style.backgroundImage = `url('${data.hero_url}')`;
    if (data.body_html && qs('#articleBody')){
      const frag = new DOMParser().parseFromString(data.body_html,'text/html').body;
      qs('#articleBody').replaceChildren(...frag.childNodes);
    }
  }

  window.addEventListener('hashchange', loadArticle);
  document.addEventListener('DOMContentLoaded', loadArticle);
</script>
