#!/usr/bin/env python3
"""Build Galen.
  artifact.html     the claude.ai artifact (single file, no doctype; the publisher adds the skeleton)
  index.html        root redirect to docs/ (so Pages works whether it serves / or /docs)
  docs/             the GitHub Pages PWA: index.html + app.css + app.js + sw.js + manifest + icons + rec/
"""
import glob, os, re, hashlib, json
os.chdir(os.path.dirname(os.path.abspath(__file__)))
VERSION = open('VERSION').read().strip() if os.path.exists('VERSION') else '6.0.0'
head = open('src/00-head.html', encoding='utf-8').read()
parts = sorted(glob.glob('src/*.js'))
js = '\n'.join(open(p, encoding='utf-8').read() for p in parts)
css = re.search(r'<style>(.*?)</style>', head, re.S).group(1)
extra_css = '\n'.join(open(p, encoding='utf-8').read() for p in sorted(glob.glob('src/*.css')))
css = css + '\n' + extra_css
shell = head[head.index('</style>') + len('</style>'):]
m = re.search(r'(<link rel="preconnect".*?display=swap">)', head, re.S)
fonts = m.group(1) if m else ''

def strict_strip(s):  # one "use strict" per file is fine inside a single bundle
    return s

# ---- artifact (claude.ai) ----
art = head.replace('</style>', extra_css + '</style>\n<script>window.GALEN_PLATFORM="artifact";window.GALEN_VERSION=%s;</script>' % json.dumps(VERSION), 1)
art += '\n<script>\n' + js + '\n</script>'
open('artifact.html', 'w', encoding='utf-8').write(art)
open('index.html', 'w', encoding='utf-8').write('''<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Galen</title><meta name="robots" content="noindex">
<script>location.replace("docs/"+location.search+location.hash)</script>
<meta http-equiv="refresh" content="0; url=docs/">
<style>body{font:16px/1.5 Georgia,serif;background:#efe6d4;color:#2a1c11;display:grid;place-items:center;min-height:100vh;margin:0}a{color:#963c08}</style>
</head><body><p>Opening <a href="docs/">Galen</a>…</p></body></html>
''')

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
<meta name="theme-color" content="#efe6d4" media="(prefers-color-scheme: light)">\n<meta name="theme-color" content="#120d09" media="(prefers-color-scheme: dark)">
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
  /* The update banner follows reg.waiting, so it comes back on every start until the user updates.
     The app also checks for an update when it comes back into view (Android keeps the PWA alive for days), when it comes online, and hourly. */
  const tell = reg => {{ if (reg.waiting && navigator.serviceWorker.controller) document.dispatchEvent(new CustomEvent('galen:update', {{ detail: reg }})); }};
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', {{ updateViaCache: 'none' }}).then(reg => {{
    window.GALEN_SW = reg; tell(reg);
    reg.addEventListener('updatefound', () => {{ const w = reg.installing; w && w.addEventListener('statechange', () => {{ if (w.state === 'installed') tell(reg); }}); }});
    let last = Date.now(); const check = () => {{ if (Date.now() - last < 60000 || navigator.onLine === false) return; last = Date.now(); reg.update().catch(() => {{}}); }};
    document.addEventListener('visibilitychange', () => {{ if (!document.hidden) check(); }});
    window.addEventListener('online', check); setInterval(check, 3600000);
  }}).catch(e => console.warn('sw', e)));
  /* reload only when an update replaces a worker that was already in control (the user tapped Update), never on the first install */
  let refreshing = false; const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {{ if (refreshing || !hadController) return; refreshing = true; try {{ if (typeof Store !== 'undefined' && Store.cache) Store.cache(); }} catch (e) {{}} location.reload(); }});
}}
</script>
</body>
</html>
'''
open('docs/index.html', 'w', encoding='utf-8').write(page)
recs = sorted(os.path.basename(p) for p in glob.glob('docs/rec/*'))
manifest = {
  "id": "/galen-app", "name": "Galen", "short_name": "Galen", "start_url": "./", "scope": "./", "display": "standalone",
  "background_color": "#efe6d4", "theme_color": "#d4621a", "description": "History, examination and the reasons behind them.",
  "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"}, {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"}, {"src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
  "categories": ["education", "medical"], "lang": "en"
}
open('docs/manifest.webmanifest', 'w', encoding='utf-8').write(json.dumps(manifest, indent=1))
# every precached asset with its SHA-256: the service worker verifies each one, so a broken download can never become the offline app
def sha256(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()
assets = [('./', 'docs/index.html'), ('index.html', 'docs/index.html'), (f'app.css?v={h}', 'docs/app.css'), (f'app.js?v={h}', 'docs/app.js'), ('manifest.webmanifest', 'docs/manifest.webmanifest')]
assets += [(f'icons/{n}', f'docs/icons/{n}') for n in ('icon-192.png', 'icon-512.png', 'maskable-512.png', 'apple-touch-icon.png') if os.path.exists(f'docs/icons/{n}')]
assets += [(f'rec/{r}', f'docs/rec/{r}') for r in recs]
precache = [{'u': u, 'h': sha256(f)} for u, f in assets]
# the cache is named by a hash over every asset, so any change (even only a recording or index.html) gets a fresh cache
cache_ver = hashlib.sha1(''.join(x['u'] + x['h'] for x in precache).encode()).hexdigest()[:12]
sw = open('src/sw.template', encoding='utf-8').read().replace('__VERSION__', cache_ver).replace('__PRECACHE__', json.dumps(precache, separators=(',', ':')))
open('docs/sw.js', 'w', encoding='utf-8').write(sw)
print('built', VERSION, h, len(art), 'bytes artifact;', len(js), 'bytes js;', len(recs), 'recordings;', [os.path.basename(p) for p in parts])
