// global-responsive.js — sets device classes (mobile/tablet/desktop)
(() => {
  const html = document.documentElement;
  const set = () => {
    const w = window.innerWidth;
    html.classList.toggle('mobile', w < 640);
    html.classList.toggle('tablet', w >= 640 && w < 1024);
    html.classList.toggle('desktop', w >= 1024);
  };
  set();
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(set, 120); });
})();
