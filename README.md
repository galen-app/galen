# Galen

History, examination and the reasons behind them. A teaching app for the bedside: evidence for every sign, illustrations and live photographs, heart and lung sounds, dermatology on every skin tone, neurology that localises, and practice that makes it stick.

Part of the Citrus family (Orange, Yuzu, Sinus, Mephisto, Embergine, Citrus Maxima).

## Put it online
GitHub Pages → Settings → Pages → *Deploy from a branch* → `main`, folder `/docs`. Address: https://galen-app.github.io/galen/

## Google (once)
Google Cloud console → project *My Apps* → the *Citrus web* client → Authorised JavaScript origins: add `https://galen-app.github.io`. In Galen: Tools → Google → Sign in.

Drive layout (shared with the other apps, root `My Apps`):
```
My Apps/Galen/state.json        your progress (merged per record across devices)
My Apps/Galen/photos/           your own clinical photos (optional)
My Apps/hub/galen/status.json   what Galen needs today, for Citrus Maxima
My Apps/hub/citrus/plan.json    what Citrus planned (read by Galen)
```

## Build
`python3 build.py` → `docs/` (the PWA) and `index.html` (the claude.ai preview). `node check.js` checks the data for drift (LR vs sensitivity/specificity, dangling links, score bands).

## Files
```
src/00-head.html      styles + shell
src/05–69             data: sounds, exam modules, history, signs, figures, neurology, memory, deep dives, concept maps, dermatology
src/70-store.js       state, merge, sync providers
src/71-tools-data.js  scores and formulas (declarative)
src/80–98             views: shell, signs & sounds, practice, neuro, localiser, memory, skin, images, hub, tools, calculators, hands kit, narration & sketch
docs/rec/             heart and lung recordings (BMD-HS CC BY-NC-ND, SPRSound CC BY)
```
