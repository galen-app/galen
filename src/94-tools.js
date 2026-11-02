"use strict";
/* ================= TOOLS: calculators, labs, settings, Google, data ================= */
route("tools:home","Tools",(root)=>{
  const signed=G.canUse()&&G.wasSignedIn();
  const tools=(typeof TOOLS!=="undefined")?TOOLS:[],labs=(typeof LABS!=="undefined")?LABS:[];
  root.innerHTML=`<section class="ph"><span class="eyebrow">Tools</span><h1>At the bedside</h1><p class="lede">Scores and calculators that show their working, lab patterns that confirm or refute the exam, pocket cards, your bedside log, and the settings that make Galen yours.</p></section>
  <div class="grid g2">
   <button class="tile" data-go="tools/calcs"><div class="t-top"><span class="icwrap">${ic("scale")}</span><span class="tag">${tools.length} tools</span></div><b>Scores and calculators</b><span class="sub">HEART, Wells, NEWS2, GCS, Ottawa, CT head, eGFR, corrected calcium, QTc…</span></button>
   <button class="tile" data-go="tools/labs"><div class="t-top"><span class="icwrap">${ic("log")}</span><span class="tag">${labs.length} panels</span></div><b>Labs at the bedside</b><span class="sub">What each panel answers, the patterns, the traps.</span></button>
   <button class="tile" data-go="signs/calc"><div class="t-top"><span class="icwrap">${ic("target")}</span></div><b>Likelihood-ratio calculator</b><span class="sub">Pretest to post-test with any combination of signs.</span></button>
   <button class="tile" data-go="practice/pocket"><div class="t-top"><span class="icwrap">${ic("pocket")}</span></div><b>Pocket cards</b><span class="sub">One screen per system for the ward.</span></button>
   <button class="tile" data-go="practice/log"><div class="t-top"><span class="icwrap">${ic("log")}</span>${Store.s.log.filter(x=>!x.ver).length?`<span class="tag">${Store.s.log.filter(x=>!x.ver).length} to verify</span>`:""}</div><b>Bedside log</b><span class="sub">Your findings, confirmed or refuted, and your calibration.</span></button>
   <button class="tile" data-go="tools/narrate"><div class="t-top"><span class="icwrap">${ic("ear")}</span><span class="tag">voice</span></div><b>Narrated routine</b><span class="sub">Galen reads an examination aloud, step by step, while you perform it.</span></button>
  </div>
  <section class="section"><span class="label">Account and data</span><div class="list">
   <button class="lrow" data-go="tools/google"><span class="icwrap">${ic("gear")}</span><span class="txt"><b>Google Drive and Citrus Maxima</b><span>${!G.canUse()?"Available in the installed app":signed?`Signed in as ${esc(G.email())} · ${esc(Store.status)}`:"Sign in to sync between devices and tell Citrus your plan"}</span></span>${ic("chev","chev")}</button>
   <button class="lrow" data-go="tools/settings"><span class="icwrap">${ic("gear")}</span><span class="txt"><b>Settings</b><span>Daily load, session length, skin tone, sound output, name</span></span>${ic("chev","chev")}</button>
   <button class="lrow" data-go="tools/data"><span class="icwrap">${ic("log")}</span><span class="txt"><b>Backup, export and repair</b><span>Backup file, Yuzu card packs, diagnostics</span></span>${ic("chev","chev")}</button>
   <button class="lrow" data-go="tools/about"><span class="icwrap">${ic("mind")}</span><span class="txt"><b>About Galen</b><span>Version ${esc(window.GALEN_VERSION||"")} · sources and licences</span></span>${ic("chev","chev")}</button>
  </div></section>`;
});
/* ---------- settings ---------- */
route("tools:settings","Settings",(root)=>{
  const S=Store.s.settings;
  root.innerHTML=`<section class="ph"><span class="eyebrow">Settings</span><h1>Make it yours</h1></section>
  <div class="card stack" style="gap:18px">
   <label class="fld">Your name (for greetings and the hub)<input class="inp" id="s-name" value="${esc(S.name||"")}" placeholder="Amro"></label>
   <div class="fld"><span>New items per day · <b id="v-new">${S.newPerDay}</b></span><input type="range" class="rng" id="s-new" min="0" max="40" step="5" value="${S.newPerDay}" data-hint="New items per day|How many never-seen cards the daily session adds. Reviews come first; new items only when there is room."></div>
   <div class="fld"><span>Maximum reviews per session · <b id="v-max">${S.maxReviews}</b></span><input type="range" class="rng" id="s-max" min="10" max="150" step="10" value="${S.maxReviews}"></div>
   <div class="fld"><span>Daily goal · <b id="v-goal">${S.goalMin}</b> min</span><input type="range" class="rng" id="s-goal" min="5" max="60" step="5" value="${S.goalMin||15}" data-hint="Daily goal|What Galen asks Citrus Maxima to plan for you on a normal day. After a night shift it asks for less."></div>
   <div class="fld"><span>Default skin tone for drawn plates</span>${toneBar("s-tone")}</div>
   <div class="fld"><span>Sound output</span><div class="seg" id="s-out"><button data-o="speaker" aria-pressed="${S.out!=="headphones"}">Phone speaker</button><button data-o="headphones" aria-pressed="${S.out==="headphones"}">Headphones</button></div></div>
   <div class="fld"><span>Theme</span><div class="seg" id="s-theme">${[["","System"],["light","Light"],["dark","Dark"]].map(([k,l])=>`<button data-t="${k}" aria-pressed="${(S.theme||"")===k}">${l}</button>`).join("")}</div></div>
  </div>`;
  const save=()=>{Store.save();};
  $("#s-name").addEventListener("change",e=>{S.name=e.target.value.trim();save();});
  [["s-new","newPerDay","v-new"],["s-max","maxReviews","v-max"],["s-goal","goalMin","v-goal"]].forEach(([id,k,v])=>{const el=$("#"+id);el.addEventListener("input",()=>{$("#"+v).textContent=el.value;});el.addEventListener("change",()=>{S[k]=+el.value;save();toast("Saved");});});
  bindTone(root,"s-tone");
  $("#s-out").addEventListener("click",e=>{const b=e.target.closest("[data-o]");if(!b)return;S.out=b.dataset.o;try{setOutMode(S.out);}catch(x){}save();$$("#s-out button").forEach(x=>x.setAttribute("aria-pressed",x===b));});
  $("#s-theme").addEventListener("click",e=>{const b=e.target.closest("[data-t]");if(!b)return;S.theme=b.dataset.t;applyTheme();save();$$("#s-theme button").forEach(x=>x.setAttribute("aria-pressed",x===b));});
});
function applyTheme(){const t=Store.s.settings.theme||"";if(t)document.documentElement.setAttribute("data-theme",t);else document.documentElement.removeAttribute("data-theme");}
/* ---------- Google ---------- */
route("tools:google","Google",(root)=>{
  const draw=()=>{
    const can=G.canUse(),signed=G.wasSignedIn(),plan=Hub.todayFromPlan();
    let body="";
    if(!can)body=`<div class="card"><div class="note">Google sign-in needs the installed app (galen-app.github.io). This preview keeps progress in your Claude account instead.</div></div>`;
    else{
      const btns=signed?`<button class="btn" id="g-sync">${ic("calendar")}Sync now</button><button class="btn soft" id="g-status">Tell Citrus now</button><button class="btn ghost" id="g-out">Sign out</button>`:`<button class="btn" id="g-in">Sign in with Google</button>`;
      body+=`<div class="card stack" style="gap:12px"><div class="row-x"><span class="sync ${Store.status==="Synced"?"ok":""}">${esc(Store.status)}</span>${signed?`<span class="small muted">${esc(G.email())}</span>`:""}</div><div class="row-x">${btns}</div>${G.auth.lastError?`<p class="small" style="color:var(--bad)">${esc(G.auth.lastError)}</p>`:""}<p class="small muted">First sign-in shows “Google hasn't verified this app”: Advanced → Go to My Apps. It is your own app in Testing mode.</p></div>`;
      if(signed){
        let today="";
        if(plan){
          today+=plan.shift?`<p>Shift: <b>${esc(plan.shift.label||plan.shift.code||"")}</b>${plan.shift.site?" · "+esc(plan.shift.site):""} ${plan.shift.start?esc(plan.shift.start+"–"+plan.shift.end):""}</p>`:`<p>No shift recorded today.</p>`;
          if(plan.afterNight)today+=`<p class="small muted">After a night: Galen keeps today light.</p>`;
          today+=plan.blocks.length?plan.blocks.map(b=>`<p>Planned: <b>${esc(b.title)}</b> at ${esc(b.start)} (${b.minutes} min)</p>`).join(""):`<p class="small muted">Citrus has not planned a Galen block today. It will once it reads Galen's status.</p>`;
        }else today=`<p class="small muted">No plan read yet. Sync to read Citrus's plan.</p>`;
        body+=`<div class="card stack" style="gap:10px"><span class="eyebrow">Today, from Citrus</span>${today}</div>`;
      }
      body+=`<details class="acc"><summary><span class="st"><b>Advanced</b><span>Client ID and Drive folder</span></span></summary><div class="acc-body"><label class="fld">OAuth client ID<input class="inp" id="g-cid" value="${esc(G.cfg.clientId||"")}"></label><label class="fld">Drive root folder<input class="inp" id="g-root" value="${esc(G.root())}"></label><button class="btn sm soft" id="g-save">Save</button></div></details>`;
    }
    root.innerHTML=`<section class="ph"><span class="eyebrow">Google Drive · Citrus Maxima</span><h1>One account, every device</h1><p class="lede">Galen keeps your progress in <b>${esc(G.root())}/Galen/state.json</b> on your Google Drive and merges it with each device. It tells Citrus Maxima what it needs today (<b>hub/galen/status.json</b>) and reads back the block Citrus planned for you.</p></section>${body}`;
    const on=(id,fn)=>{const el=$("#"+id,root);if(el)el.addEventListener("click",fn);};
    on("g-in",async()=>{try{await G.signIn();toast("Signed in","good");await Store.connect();await Hub.daily("force");draw();}catch(e){toast(e.message,"bad");draw();}});
    on("g-out",()=>{G.signOut();Store.provider=null;Store.mode="local";Store.status="This device";Store.emit("status");draw();});
    on("g-sync",async()=>{await Hub.daily("force");draw();toast(Store.status,Store.status==="Synced"?"good":"");});
    on("g-status",async()=>{const ok=await Hub.writeStatus(true);toast(ok?"Citrus told":"Couldn't write the status",ok?"good":"bad");});
    on("g-save",()=>{G.setConfig({clientId:$("#g-cid").value.trim()||G.DEFAULT_CLIENT_ID,root:$("#g-root").value.trim()||"My Apps"});toast("Saved");draw();});
  };
  draw();
});
/* ---------- data: backup, export, diagnostics ---------- */
const DIAG={errors:[]};
window.addEventListener("error",e=>{DIAG.errors.push({t:Date.now(),m:String(e.message||e.error)});if(DIAG.errors.length>8)DIAG.errors.shift();});
route("tools:data","Backup and export",(root)=>{
  const s=Store.s,counts=`${Object.keys(s.srs).length} cards · ${s.log.length} log entries · ${Object.keys(s.pins).length} pinned photos`;
  root.innerHTML=`<section class="ph"><span class="eyebrow">Your data</span><h1>Backup, export, repair</h1><p class="lede">${counts}. Everything stays in your hands: a file you can keep, cards you can take to Yuzu, and a repair button that never touches your progress.</p></section>
   <div class="card stack" style="gap:12px"><span class="eyebrow">Backup</span><div class="row-x"><button class="btn" id="bk">${ic("log")}Download backup</button><label class="btn soft">Restore from file<input type="file" accept="application/json" id="rs" hidden></label></div><p class="small muted">Restore merges: nothing you have is deleted, the newer copy of each record wins.</p></div>
   <div class="card stack" style="gap:12px"><span class="eyebrow">Yuzu</span><p class="small">Export the signs you have opened as a Yuzu card pack (one fact per card: what to think, the likelihood ratios, how to do it).</p><div class="row-x"><button class="btn soft" id="yz">Copy Yuzu pack</button><button class="btn ghost" id="yzd">Download .yuzu.json</button></div></div>
   <div class="card stack" style="gap:12px"><span class="eyebrow">Diagnostics</span><p class="small mono">Galen ${esc(window.GALEN_VERSION||"")} · ${esc(window.GALEN_PLATFORM||"")} ${window.GALEN_BUILD?"· build "+esc(window.GALEN_BUILD):""}<br>Sync: ${esc(Store.mode)} · ${esc(Store.status)}${Store.lastSync?" · last "+new Date(Store.lastSync).toLocaleTimeString():""}<br>Service worker: ${navigator.serviceWorker&&navigator.serviceWorker.controller?"active":"none"} · online: ${navigator.onLine}<br>Storage: ${(()=>{try{return Math.round(JSON.stringify(s).length/1024)+" KB";}catch(e){return "?";}})()}</p>
    ${DIAG.errors.length?`<div class="note">Recent errors:<br>${DIAG.errors.map(e=>esc(e.m)).join("<br>")}</div>`:`<p class="small muted">No errors this session.</p>`}
    <div class="row-x"><button class="btn ghost" id="repair">Repair app (clear caches, keep data)</button><button class="btn ghost" id="reset">Reset all progress</button></div></div>`;
  $("#bk").addEventListener("click",()=>{if(window.GALEN_PLATFORM==="artifact"){navigator.clipboard.writeText(JSON.stringify(Store.s)).then(()=>toast("Backup copied: paste it into a note or file","good"),()=>toast("Copy failed"));return;}const blob=new Blob([JSON.stringify(Store.s)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`galen-backup-${dayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);if(window.GALEN_PLATFORM==="artifact")toast("Downloads may be blocked in the preview; use the installed app");});
  $("#rs").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!j||!(j.v===2||j.v===3))throw new Error("Not a Galen backup");Store.s=mergeStates(Store.s,Store.merge(blankState(),j));Store.save(true);toast("Restored and merged","good");render(false);}catch(x){toast("Restore failed: "+x.message,"bad");}});
  const pack=()=>yuzuPack();
  $("#yz").addEventListener("click",()=>{const t=JSON.stringify(pack(),null,1);try{navigator.clipboard.writeText(t).then(()=>toast("Copied: paste into Yuzu's import","good"),()=>toast("Couldn't copy"));}catch(x){toast("Couldn't copy");}});
  $("#yzd").addEventListener("click",()=>{if(window.GALEN_PLATFORM==="artifact"){navigator.clipboard.writeText(JSON.stringify(pack(),null,1)).then(()=>toast("Yuzu pack copied","good"),()=>toast("Copy failed"));return;}const blob=new Blob([JSON.stringify(pack(),null,1)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`galen-${dayKey()}.yuzu.json`;a.click();});
  $("#repair").addEventListener("click",async()=>{try{if(navigator.serviceWorker){const rs=await navigator.serviceWorker.getRegistrations();for(const r of rs)await r.unregister();}if(window.caches){for(const k of await caches.keys())await caches.delete(k);}toast("Caches cleared, reloading");setTimeout(()=>location.reload(),600);}catch(x){toast("Repair failed: "+x.message,"bad");}});
  const rb=$("#reset");rb.addEventListener("click",()=>{if(rb.dataset.arm){Store.s=blankState();Store.save(true);toast("Progress reset");open("today");}else{rb.dataset.arm=1;rb.textContent="Tap again to confirm";setTimeout(()=>{delete rb.dataset.arm;rb.textContent="Reset all progress";},4000);}});
});
function yuzuPack(){
  const ids=Store.s.signs.filter(k=>SIGNS[k]);const cards=[];
  ids.forEach(k=>{const s=SIGNS[k];const base={tags:["galen",s.sys],cat:"Medicine::Clinical examination::"+SYS_NAME[s.sys]};
    cards.push(Object.assign({id:`galen-${k}-think`,front:`${s.name}: what should you think?`,back:s.think},base));
    if(s.p!=null||s.n!=null)cards.push(Object.assign({id:`galen-${k}-lr`,front:`${s.name} for ${s.target}: likelihood ratios?`,back:`LR+ ${s.p??"–"} · LR− ${s.n??"–"}${s.sens!=null?` · sensitivity ${s.sens}%`:""}${s.spec!=null?` · specificity ${s.spec}%`:""}`},base));
    if(s.how)cards.push(Object.assign({id:`galen-${k}-how`,front:`How do you perform ${s.name}?`,back:s.how},base));
    if(s.mech)cards.push(Object.assign({id:`galen-${k}-why`,front:`Why does ${s.name} work?`,back:s.mech},base));});
  return {format:"yuzu-pack",version:1,source:"Galen "+(window.GALEN_VERSION||""),createdAt:new Date().toISOString(),cards};
}
route("tools:about","About",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">About</span><h1>Galen</h1><p class="lede">Named after Galen of Pergamon, who insisted that the examining hand and the reasoning mind belong together. Galen teaches history and examination with the reasons behind every question and every manoeuvre, the evidence for each sign, and practice that makes it stick.</p></section>
   <div class="card stack" style="gap:10px"><span class="eyebrow">Sources</span><p class="small">Likelihood ratios and accuracy figures come from McGee's Evidence-Based Physical Diagnosis, the JAMA Rational Clinical Examination series, Cochrane and other systematic reviews, and current guidelines (NICE, ESC, AHA/ASA, Surviving Sepsis, ERC) as cited on each page; numbers were checked by independent reviewers in October 2026. Memory methods follow Karpicke and Roediger, Cepeda, Dresler, Hatala and Larsen.</p>
   <p class="small">Heart and lung recordings: BMD-HS (CC BY-NC-ND) and SPRSound (CC BY). Photographs are loaded live from Wikimedia Commons under their own open licences, shown with author and licence. Drawn plates and figures are Galen's own.</p>
   <p class="small">Part of the Citrus family of apps with Orange, Yuzu, Sinus, Mephisto, Embergine and Citrus Maxima.</p></div>
   <div class="card"><p class="small muted">Galen is a learning tool, not a substitute for clinical judgement or local guidelines.</p></div>`;
});
