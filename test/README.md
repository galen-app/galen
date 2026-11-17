# Tests
Serve `docs/` on port 8765 (`cd docs && python3 -m http.server 8765`), then:
- `node test/sweep.js` — opens every route at phone width, checks for errors and horizontal overflow, exercises a calculator and a concept map.
- `node test/google.js` — two "devices" sync through an in-memory fake of Google Drive (sign-in stub, status.json, Citrus plan, conflict merge).
- `node test/pwa.js` — service worker, offline reload, deep links.
- `node test/beta.js` — the beta pass: every route at phone width plus a sample at desktop, dark and 320 px; flags leaked `undefined`/`NaN`, overflow, dead links, unlabelled buttons and broken images; then user flows (review session, calculators at mid-range inputs, score bands with no gaps, audio actually routed, search, back, long-press menu, sketch, merge-restore, reload persistence, theme, keyboard).
- `node test/tech.js` — every Technique clinic page and drill end to end (walk-through, order, spot the error, reps, pocket card), all technique cards, Today tile, sign links, search.
- `node check.js` — data consistency (LR vs sensitivity/specificity, dangling links, score bands).
Needs Playwright with Chromium (`npm i playwright`).

- `theatre.js`: Galen 7 world: doors, halls, outline chapters, hall/chapter sessions, reference pane, eggs, help, Alt tabs, sound engine, codex, settings, clean text.

## Added in 7.1 (all expect docs/ served on :8765 unless noted)
- `merge.js`: node-only, 118+ checks of mergeStates (counters, tombstones, epochs, reset/undo, restore, clock skew, corrupt/newer data, quota, two tabs). `node test/merge.js src/70-store.js`
- `sync.js`: 13 Drive scenarios (12 attacks, plus the Drive layout: folders found by tag, a fresh device after Citrus moves them, twin tags). `node test/sync.js http://localhost:8765/`
- `swupdate.js`: service worker install atomicity and the persistent update banner (serves its own copy on :18831). `node test/swupdate.js docs`
- `audio.js`: OfflineAudioContext render checks (no NaN, levels, bell vs diaphragm, Greensleeves structure, ducking). About 150 s. `node test/audio.js 8765`
- `cards.js`: card-quality audit (leaks, length bias, duplicates, rule-in/out keys vs LR, chapter coverage, 7.0.1 id survival with `--legacy test/legacy-ids.json`). About 2 min.
- `pad.js`: stubbed Steam Deck gamepad across home, help, palette, session, drill, outline, doors, zones, eggs.
- `tech.js`: replaced for the 7.1 drills (equivalent orders, variants, techwhy, observed).
