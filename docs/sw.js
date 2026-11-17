/* Galen service worker.
   - The shell and recordings are precached cache-first, in a cache named by the build hash of every asset.
   - Install is atomic: every asset is fetched (or reused from the previous cache when its SHA-256 still matches) and
     verified against the hash build.py wrote below. One failure fails the whole install, so the old worker and its
     cache stay in charge and the app keeps opening offline. The old cache is deleted only after the new one is complete.
   - Fonts and Commons images are runtime-cached (capped), never Google APIs.
   - Updates wait for the user to tap Update. */
const VERSION = '3fc26b7967a7';
const SHELL = 'galen-shell-' + VERSION;
const RUNTIME = 'galen-runtime-v1';
const RUNTIME_MAX = 150;
const PRECACHE = [{"u":"./","h":"962e2a1212e6673379b7134ce7ce7741169b8af7c8936812364c71332fc7fa7a"},{"u":"index.html","h":"962e2a1212e6673379b7134ce7ce7741169b8af7c8936812364c71332fc7fa7a"},{"u":"app.css?v=a5e0e1771c","h":"62b0bec6e4ad2531a8cb979329015a22e389a0f4d006df455f8df211c44815e9"},{"u":"app.js?v=a5e0e1771c","h":"e0a957ae680ce0d1c225abd9746a50a80f25c9f9e4ec9c6057e27f1d540881f9"},{"u":"manifest.webmanifest","h":"512ccf94384ac18491961d64432de30bfdfe516fb8b42870d160254f4d849c78"},{"u":"icons/icon-192.png","h":"982686ba4d70bf2673b45b3ec5d7c6ff3ba89cee532fed100dd4a237f0d20194"},{"u":"icons/icon-512.png","h":"a076135d0f585e734d705d7e978a1afe228dcf9cc7be29c3f1895e0046bbd8f8"},{"u":"icons/maskable-512.png","h":"f0b9109b14cd52b138228a239b7e37095a61c5c6b500435a0ea66e01e0b6312f"},{"u":"icons/apple-touch-icon.png","h":"4bbc1ed9ab0a1a817bfd352520ae065dcb4d5525322db8d845f5a0ab7fb25286"},{"u":"rec/40638274_9.7_1_p2_1719.wav","h":"313aafee95ac41c09b9e05a557b1bed3363371cd0fc5ddc1986418083cfd21c2"},{"u":"rec/41173389_4.1_1_p3_1554.wav","h":"121b86f9489facc0470b490afdccf989a9f975662bb844d7150dcc5224abf307"},{"u":"rec/41226005_3.9_1_p4_980.wav","h":"31d949b48942fa30d2f6bcd12303144c7f0562520ccafa4eaa5bb3e3147c6b35"},{"u":"rec/41261802_10.5_0_p2_222.wav","h":"5dd4dc0a92d03fbbd3f322cd7b1f5ae731a5a1c40230fca6a660db1aef3fd6ec"},{"u":"rec/41267028_0.2_0_p1_2439.wav","h":"c33dc8dd1b5ed0f5c7c3944410235549e4015e4a952f6f3ed13d2b852a0dd866"},{"u":"rec/41273341_6.9_0_p1_2201.wav","h":"ccf43af563b2cbd18b94e0b840b6f0e463f47c0d68c3224f6b60e5feaee6c609"},{"u":"rec/41274453_4.3_1_p1_1390.wav","h":"fcc73db78b9275436b2fc69d1405467305121ed5834d80747a17d4050835b77d"},{"u":"rec/63613821_9.2_1_p1_1300.wav","h":"b18266c3edb2cd252375bdefa6ee3a13c375e11eddbb1b4f4026a371df7aa75b"},{"u":"rec/64743918_7.0_0_p2_2625.wav","h":"19cca4618f7611d9993166b77c0d438f9701dd93e136d84a5d538be89cdd5ac6"},{"u":"rec/64913238_0.6_1_p2_2997.wav","h":"9589bd686d37aeb0bef6fa69aa00eaaff758c90d71fa2c58f83d65c1aea12e99"},{"u":"rec/65042563_9.6_1_p3_239.wav","h":"b2631da017b6f58c76332132ba371d77c6641aac30e5eed2bcaa60d0119047a7"},{"u":"rec/65060531_7.7_0_p3_735.wav","h":"6a5d69a2050db3c98b0e0055016295937ee740f896e75772ac9607f564654f18"},{"u":"rec/AR_052_sit_Pul.wav","h":"249b8307aedebae05fd5ad2ff94afe09a53353a33a93f91df4c7026d86d4be8a"},{"u":"rec/AR_068_sit_Aor.wav","h":"77487fbf260f7ae991b3dbe1a77a49235d494b93df79612603758e12f7249ba4"},{"u":"rec/AS_015_sit_Aor.wav","h":"96e4dea3deb548629a01f38267b79304160838b1e10e04274dd720edcb5c8273"},{"u":"rec/AS_054_sit_Aor.wav","h":"77f6a0383d232a1bc230cdcbae08b78024a88561be3a4da00cf1401cb9b5cf87"},{"u":"rec/MR_011_sup_Mit.wav","h":"b31d108f45ea168caec96962167aa67abe9fdea5b35ff8dc377d772df5bebd73"},{"u":"rec/MR_040_sup_Mit.wav","h":"b01d97f07b22563027214467f9eb89a65a26c7bbf438308c4f7176aff809bd10"},{"u":"rec/MS_012_sup_Mit.wav","h":"ad2f499a512d1977c4bc81ef30d6ebeb6ddb4e08d57aa3d434f6d144098472db"},{"u":"rec/MS_041_sup_Mit.wav","h":"aee51578fdd884c220a911438cf46cccd94a127f9e49d473b15b93a910e1d815"},{"u":"rec/N_089_sup_Mit.wav","h":"77b405f688078e462be6c262a36791c4baa242b7648f215ea34aa84fbd042f37"},{"u":"rec/N_090_sup_Aor.wav","h":"ae2346e75c5b7cb0cdf6b3993c75cab8ab231c4eb336f439a5903cfa45c91f68"}]; /* [{u: url relative to the scope, h: sha256 hex}] */
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha = async buf => hex(await crypto.subtle.digest('SHA-256', buf));
const abs = u => new URL(u, self.registration.scope).href;
const strip = u => u.split('?')[0];
async function oldShells() { return (await caches.keys()).filter(k => k.startsWith('galen-shell-') && k !== SHELL); }
/* a verified copy of one asset: from an older cache when unchanged, else from the network */
async function getVerified(item, olds) {
  for (const name of olds) {
    const c = await caches.open(name);
    const r = await c.match(abs(item.u)) || await c.match(strip(abs(item.u)));
    if (r && r.ok) { const b = await r.arrayBuffer(); if (await sha(b) === item.h) return new Response(b, { status: 200, headers: r.headers }); }
  }
  let last = 'no response';
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(new Request(abs(item.u), { cache: 'reload', credentials: 'same-origin' }));
      if (!r.ok) { last = r.status + ' for ' + item.u; if (r.status === 404) break; continue; }
      const b = await r.arrayBuffer(); const got = await sha(b);
      if (got !== item.h) { last = 'hash mismatch for ' + item.u; break; } /* a newer deploy is going out: try again on the next update check */
      return new Response(b, { status: 200, headers: r.headers });
    } catch (err) { last = String(err && err.message || err); }
    await new Promise(z => setTimeout(z, 500 * (i + 1)));
  }
  throw new Error('Galen install: ' + last);
}
async function complete(name) {
  const c = await caches.open(name);
  for (const it of PRECACHE) if (!(await c.match(abs(it.u)))) return false;
  return true;
}
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    await caches.delete(SHELL); /* a half-filled cache from an interrupted install never counts */
    const olds = await oldShells();
    try {
      const got = [];
      for (const it of PRECACHE) got.push([it, await getVerified(it, olds)]);
      const c = await caches.open(SHELL);
      for (const [it, r] of got) await c.put(abs(it.u), r);
      if (!(await complete(SHELL))) throw new Error('Galen install: cache incomplete');
    } catch (err) { await caches.delete(SHELL); throw err; }
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    if (await complete(SHELL)) for (const k of await oldShells()) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
  else if (e.data === 'version' && e.source) e.source.postMessage({ type: 'galen-sw', version: VERSION });
});
const isImg = u => /upload\.wikimedia\.org|commons\.wikimedia\.org\/wiki\/Special:FilePath|commons\.wikimedia\.org\/w\/thumb|fonts\.gstatic\.com/.test(u);
const isFontCss = u => /fonts\.googleapis\.com/.test(u);
let puts = 0;
async function trim() { const c = await caches.open(RUNTIME); const ks = await c.keys(); for (let i = 0; i < ks.length - RUNTIME_MAX; i++) await c.delete(ks[i]); }
/* look in this build's shell first, then in any other shell (a tab still on the old build) */
async function fromShell(url) {
  const c = await caches.open(SHELL);
  const hit = await c.match(url) || await c.match(strip(url));
  if (hit) return hit;
  for (const k of await oldShells()) { const h = await (await caches.open(k)).match(url); if (h) return h; }
  return null;
}
async function shellIndex() {
  return (await fromShell(abs('index.html'))) || (await fromShell(abs('./')));
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = req.url;
  if (/googleapis\.com\/(drive|calendar|oauth2|upload)|accounts\.google\.com/.test(url)) return;
  if (url.startsWith(self.registration.scope)) {
    const path = new URL(url).pathname;
    const appPage = req.mode === 'navigate' && (/\/$/.test(path) || /\/index\.html$/.test(path) || !/\.[a-z0-9]{2,5}$/i.test(path));
    e.respondWith((async () => {
      /* the app shell answers every navigation, so offline start always works, with any query or hash */
      if (appPage) { const idx = await shellIndex(); if (idx) return idx; }
      const hit = await fromShell(url);
      if (hit) return hit;
      try { return await fetch(req); }
      catch (err) { if (req.mode === 'navigate') return (await shellIndex()) || Response.error(); throw err; }
    })());
    return;
  }
  if (isImg(url) || isFontCss(url)) {
    e.respondWith((async () => {
      const c = await caches.open(RUNTIME);
      const hit = await c.match(req, { ignoreVary: true });
      /* images and font files never change at a URL: cache-first; the font CSS is refreshed in the background */
      const get = async () => {
        let r = null;
        if (req.mode === 'no-cors') { try { r = await fetch(new Request(url, { mode: 'cors', credentials: 'omit' })); } catch (err) { r = null; } }
        if (!r || !r.ok) r = await fetch(req);
        if (r && (r.ok || r.type === 'opaque')) { await c.put(req, r.clone()); if (++puts % 20 === 0) trim(); }
        return r;
      };
      if (hit) { if (isFontCss(url)) e.waitUntil(get().catch(() => {})); return hit; }
      try { return await get(); } catch (err) { return Response.error(); }
    })());
  }
});
