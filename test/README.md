# Tests
Serve `docs/` on port 8765 (`cd docs && python3 -m http.server 8765`), then:
- `node test/sweep.js` — opens every route at phone width, checks for errors and horizontal overflow, exercises a calculator and a concept map.
- `node test/google.js` — two "devices" sync through an in-memory fake of Google Drive (sign-in stub, status.json, Citrus plan, conflict merge).
- `node test/pwa.js` — service worker, offline reload, deep links.
- `node test/beta.js` — the beta pass: every route at phone width plus a sample at desktop, dark and 320 px; flags leaked `undefined`/`NaN`, overflow, dead links, unlabelled buttons and broken images; then user flows (review session, calculators at mid-range inputs, score bands with no gaps, audio actually routed, search, back, long-press menu, sketch, merge-restore, reload persistence, theme, keyboard).
- `node check.js` — data consistency (LR vs sensitivity/specificity, dangling links, score bands).
Needs Playwright with Chromium (`npm i playwright`).
