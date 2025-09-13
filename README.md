# Deploy bundle (pristine)
This package keeps your **five pages unchanged** and only adds thin wrappers so everything links correctly.

- `index.html` → redirects to `home.html` (your Home).
- `bio.html` → redirects to `about.html`.
- `newsletter.html` → redirects to `emm.html`.
- `msb.html` → redirects to `msab.html`.
- `project-new.html` → redirects to `project_new.html`.
- `api/projects.json` → minimal API consumed by Home.
- `vercel.json` → enables clean static hosting on Vercel (no build step needed).
- `assets/Scheme.jpg` → your site map sketch.

## Deploy on GitHub Pages or Vercel
Upload the **contents** of this folder/ZIP to the repo root and deploy. Entry is `index.html`.
