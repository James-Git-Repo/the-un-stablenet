#!/usr/bin/env python3
# Patch ALL HTML pages to include responsive assets + live sync WITHOUT Postgres Changes.
# Injects: global-responsive.css/js, data-mode="viewer", id="primaryNav", and assets/live-all-norepl.js
import sys, os, re, pathlib, argparse
HEAD_INJECT = '''
<link rel="stylesheet" href="assets/global-responsive.css">
<script defer src="assets/global-responsive.js"></script>
'''.strip()
LIVE_SCRIPT = '<script type="module" src="assets/live-all-norepl.js"></script>'
def ensure_viewport(html):
    if re.search(r'<meta[^>]+name=["\\\']viewport["\\\']', html, flags=re.I): return html, False
    def _inj(m): return m.group(0)+'\\n  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    new_html, n = re.subn(r'(<head[^>]*>)', _inj, html, count=1, flags=re.I)
    if n==0:
        new_html = re.sub(r'(</head>)','  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\\n\\\\1', html, count=1, flags=re.I)
        return new_html, new_html!=html
    return new_html, True
def ensure_head_assets(html):
    if ('global-responsive.css' in html) and ('global-responsive.js' in html): return html, False
    new_html = re.sub(r'(</head>)', f'  {HEAD_INJECT}\\n\\\\1', html, count=1, flags=re.I); return new_html, new_html!=html
def ensure_html_data_mode(html):
    if re.search(r'<html[^>]*\\bdata-mode=', html, flags=re.I): return html, False
    new_html, n = re.subn(r'<html(.*?)>', r'<html\\1 data-mode="viewer">', html, count=1, flags=re.I|re.S); return new_html, n>0
def ensure_nav_id(html):
    if re.search(r'<nav[^>]*\\bid\\s*=', html, flags=re.I): return html, False
    new_html, n = re.subn(r'<nav(?![^>]*\\bid=)', r'<nav id="primaryNav"', html, count=1, flags=re.I); return new_html, n>0
def ensure_live_script(html):
    if 'assets/live-all-norepl.js' in html: return html, False
    new_html = re.sub(r'(</body>)', f'{LIVE_SCRIPT}\\n\\\\1', html, count=1, flags=re.I); return new_html, new_html!=html
def process_one(path, dry=False):
    src = path.read_text(encoding='utf-8', errors='ignore'); orig = src; steps=[]
    for fn, name in [
        (ensure_viewport, 'viewport'), (ensure_head_assets, 'head_assets'), (ensure_html_data_mode, 'data_mode'),
        (ensure_nav_id, 'nav_id'), (ensure_live_script, 'live_all_norepl')
    ]:
        src, ch = fn(src); steps.append((name, ch))
    if any(c for _,c in steps) and not dry:
        bak = path.with_suffix(path.suffix + ".bak")
        if not bak.exists(): bak.write_text(orig, encoding='utf-8')
        path.write_text(src, encoding='utf-8')
    return steps, any(c for _,c in steps)
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('root'); ap.add_argument('--dry-run', action='store_true'); args = ap.parse_args()
    root = pathlib.Path(args.root); 
    if not root.exists(): print("Root not found:", root); sys.exit(1)
    edited=0; total=0
    for p in root.rglob("*.html"):
        if any(part in {"node_modules","dist","build"} for part in p.parts): continue
        total+=1; steps, changed = process_one(p, dry=args.dry_run)
        marks = ", ".join([k for k,c in steps if c]); print(f"[{'CHANGED' if changed else 'OK'}] {p}  {marks}")
        if changed: edited+=1
    print(f"\\nScanned {total} HTML files → edited {edited}.")
    if args.dry_run: print("(dry-run: no files were saved)")
if __name__ == '__main__': main()