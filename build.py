#!/usr/bin/env python3
"""Build Galen.
  index.html        the claude.ai artifact (single file, no doctype; the publisher adds the skeleton)
  docs/             the GitHub Pages PWA: index.html + app.css + app.js + sw.js + manifest + icons + rec/
"""
import glob, os, re, hashlib, json
os.chdir(os.path.dirname(os.path.abspath(__file__)))
VERSION = open('VERSION').read().strip() if os.path.exists('VERSION') else '6.0.0'
head = open('src/00-head.html', encoding='utf-8').read()
parts = sorted(glob.glob('src/*.js'))
js = '\n'.join(open(p, encoding='utf-8').read() for p in parts)
css = re.search(r'<style>(.*?)</style>', head, re.S).group(1)
shell = head[head.index('</style>') + len('</style>'):]
fonts = re.search(r'(<link rel="preconnect".*?display=swap">)', head, re.S).group(1)

def strict_strip(s):  # one "use strict" per file is fine inside a single bundle
    return s

# ---- artifact (claude.ai) ----
art = head.replace('</style>', '</style>\n<script>window.GALEN_PLATFORM="artifact";window.GALEN_VERSION=%s;</script>' % json.dumps(VERSION), 1)
art += '\n<script>\n' + js + '\n</script>'
open('index.html', 'w', encoding='utf-8').write(art)

# ---- GitHub Pages PWA ----
os.makedirs('docs', exist_ok=True)
h = hashlib.sha1((css + js + VERSION).encode()).hexdigest()[:10]
open('docs/app.css', 'w', encoding='utf-8').write(css)
open('docs/app.js', 'w', encoding='utf-8').write('window.GALEN_PLATFORM="pages";window.GALEN_VERSION=%s;window.GALEN_BUILD=%s;\n' % (json.dumps(VERSION), json.dumps(h)) + js)
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Galen</title>
<meta name="description" content="Galen: history, examination and the reasons behind them. Evidence, illustrations, sounds, skin, neurology and practice that makes it stick.">
<meta name="theme-color" content="#ee6a1c">
<meta name="color-scheme" content="light dark">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Galen">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
{fonts}
<link rel="stylesheet" href="app.css?v={h}">
</head>
<body>
{shell}
<script src="app.js?v={h}"></script>
<script>
if ('serviceWorker' in navigator) {{
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(reg => {{
    window.GALEN_SW = reg;
    reg.addEventListener('updatefound', () => {{ const w = reg.installing; w && w.addEventListener('statechange', () => {{ if (w.state === 'installed' && navigator.serviceWorker.controller) document.dispatchEvent(new CustomEvent('galen:update', {{ detail: reg }})); }}); }});
  }}).catch(e => console.warn('sw', e)));
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {{ if (refreshing) return; refreshing = true; location.reload(); }});
}}
</script>
</body>
</html>
'''
open('docs/index.html', 'w', encoding='utf-8').write(page)
recs = sorted(os.path.basename(p) for p in glob.glob('docs/rec/*'))
precache = ['./', 'index.html', f'app.css?v={h}', f'app.js?v={h}', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'] + [f'rec/{r}' for r in recs]
sw = open('src/sw.template', encoding='utf-8').read().replace('__VERSION__', h).replace('__PRECACHE__', json.dumps(precache))
open('docs/sw.js', 'w', encoding='utf-8').write(sw)
manifest = {
  "id": "/galen-app", "name": "Galen", "short_name": "Galen", "start_url": "./", "scope": "./", "display": "standalone",
  "background_color": "#f4f4f5", "theme_color": "#ee6a1c", "description": "History, examination and the reasons behind them.",
  "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"}, {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"}, {"src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
  "categories": ["education", "medical"], "lang": "en"
}
open('docs/manifest.webmanifest', 'w', encoding='utf-8').write(json.dumps(manifest, indent=1))
print('built', VERSION, h, len(art), 'bytes artifact;', len(js), 'bytes js;', len(recs), 'recordings;', [os.path.basename(p) for p in parts])
