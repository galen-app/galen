# Tests
Serve `docs/` on port 8765 (`cd docs && python3 -m http.server 8765`), then:
- `node test/sweep.js` — opens every route at phone width, checks for errors and horizontal overflow, exercises a calculator and a concept map.
- `node test/google.js` — two "devices" sync through an in-memory fake of Google Drive (sign-in stub, status.json, Citrus plan, conflict merge).
- `node test/pwa.js` — service worker, offline reload, deep links.
Needs Playwright with Chromium (`npm i playwright`).
