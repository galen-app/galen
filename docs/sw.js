/* Galen service worker: precache the shell and recordings (cache-first), runtime-cache fonts and Commons images (stale-while-revalidate), never cache Google APIs. Updates wait for the user to tap Update. */
const VERSION = '7a752f8cf7';
const SHELL = 'galen-shell-' + VERSION;
const RUNTIME = 'galen-runtime-v1';
const PRECACHE = ["./", "index.html", "app.css?v=7a752f8cf7", "app.js?v=7a752f8cf7", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "rec/40638274_9.7_1_p2_1719.wav", "rec/41173389_4.1_1_p3_1554.wav", "rec/41226005_3.9_1_p4_980.wav", "rec/41261802_10.5_0_p2_222.wav", "rec/41267028_0.2_0_p1_2439.wav", "rec/41273341_6.9_0_p1_2201.wav", "rec/41274453_4.3_1_p1_1390.wav", "rec/63613821_9.2_1_p1_1300.wav", "rec/64743918_7.0_0_p2_2625.wav", "rec/64913238_0.6_1_p2_2997.wav", "rec/65042563_9.6_1_p3_239.wav", "rec/65060531_7.7_0_p3_735.wav", "rec/AR_052_sit_Pul.wav", "rec/AR_068_sit_Aor.wav", "rec/AS_015_sit_Aor.wav", "rec/AS_054_sit_Aor.wav", "rec/MR_011_sup_Mit.wav", "rec/MR_040_sup_Mit.wav", "rec/MS_012_sup_Mit.wav", "rec/MS_041_sup_Mit.wav", "rec/N_089_sup_Mit.wav", "rec/N_090_sup_Aor.wav"];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    for (const url of PRECACHE) { try { await c.add(new Request(url, { cache: 'reload' })); } catch (err) { /* a missing recording must not block the install */ } }
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('galen-shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
const isImg = u => /upload\.wikimedia\.org|commons\.wikimedia\.org\/wiki\/Special:FilePath|commons\.wikimedia\.org\/w\/thumb|fonts\.gstatic\.com|fonts\.googleapis\.com/.test(u);
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = req.url;
  if (/googleapis\.com\/(drive|calendar|oauth2|upload)|accounts\.google\.com/.test(url)) return;
  if (url.startsWith(self.registration.scope) || url.includes('/galen/')) {
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      const key = url.replace(/\?v=.*$/, m => m); // keep the versioned key
      const hit = await c.match(req, { ignoreSearch: false }) || await c.match(url.split('?')[0]);
      if (hit) return hit;
      try { const r = await fetch(req); if (r.ok && /\/rec\//.test(url)) c.put(req, r.clone()); return r; }
      catch (err) { if (req.mode === 'navigate') return (await c.match('index.html')) || Response.error(); throw err; }
    })());
    return;
  }
  if (isImg(url)) {
    e.respondWith((async () => {
      const c = await caches.open(RUNTIME);
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => null);
      if (hit) { net.catch(() => {}); return hit; }
      const r = await net; if (r) return r;
      return Response.error();
    })());
  }
});
