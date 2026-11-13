"use strict";
/* ================= DATA SAFETY: one writing window, problem banners, reset and restore ================= */
/* One window writes. The first window holds a Web Lock for its whole life; another window shows "Use Galen here"
   and takes over through a BroadcastChannel hand-over: the old window saves and steps back, the new one re-reads
   this device's copy before doing anything. Without Web Locks, every window still merges before it writes (70-store). */
const Safety=(()=>{
  const LOCK="galen-writer";
  let held=null,queued=null,chan=null,overlay=null,bar=null,dismissed={},snackT=null;
  const supported=()=>typeof navigator!=="undefined"&&navigator.locks&&typeof navigator.locks.request==="function";
  /* ---------- styles (tokens from the theme) ---------- */
  function css(){if(document.getElementById("st-css"))return;const st=document.createElement("style");st.id="st-css";st.textContent=`
.st-veil{position:fixed;inset:0;z-index:9500;display:grid;place-items:center;padding:16px;background:rgb(20 12 6 / .55);backdrop-filter:blur(2px)}
.st-card{background:var(--surface,#f9f3e7);color:var(--ink,#2a1c11);border:1px solid var(--line,#d3c09d);border-radius:var(--r,8px);box-shadow:var(--shadow);max-width:min(480px,calc(100vw - 32px));width:100%;padding:20px;display:grid;gap:12px;max-height:calc(100vh - 32px);overflow:auto}
.st-card h2{margin:0;font-family:var(--f-display,Georgia,serif);font-size:1.5rem;line-height:1.2}
.st-card p{margin:0;line-height:1.45}
.st-card .st-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.st-groups{display:grid;gap:6px;margin:0;padding:0;border:0}
.st-groups label{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line,#d3c09d);border-radius:var(--r-sm,6px);cursor:pointer;background:var(--surface2,#ece2cd)}
.st-groups input{width:20px;height:20px;flex:none;margin:1px 0 0;accent-color:var(--accent,#d4621a)}
.st-groups small{display:block;color:var(--muted,#6c5741);font-size:.85em}
.st-hold{position:relative;overflow:hidden;border:0;border-radius:var(--r-sm,6px);padding:12px 18px;font:inherit;font-weight:700;cursor:pointer;background:var(--bad,#9c2a1d);color:var(--on-accent,#fff8ee);touch-action:none;user-select:none;-webkit-user-select:none;min-height:44px}
.st-hold i{position:absolute;inset:0 auto 0 0;width:0;background:rgb(0 0 0 / .28);pointer-events:none}
.st-hold span{position:relative}
.st-bar{position:fixed;z-index:9400;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 8px);width:min(640px,calc(100vw - 32px));background:var(--bad-soft,#f3d9cf);color:var(--ink,#2a1c11);border:1px solid var(--bad,#9c2a1d);border-radius:var(--r,8px);padding:10px 12px;display:grid;gap:8px;box-shadow:var(--shadow);font-size:.95rem}
.st-bar.warn{background:var(--warn-soft,#f2e1bb);border-color:var(--warn,#835400)}
.st-bar p{margin:0;line-height:1.4}
.st-bar .st-row{display:flex;flex-wrap:wrap;gap:6px}
.st-snack{position:fixed;z-index:9300;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 84px);width:max-content;max-width:calc(100vw - 32px);display:flex;gap:12px;align-items:center;background:var(--ink,#2a1c11);color:var(--bg,#efe6d4);border-radius:var(--r,8px);padding:10px 12px 10px 16px;box-shadow:var(--shadow)}
.st-snack button{background:transparent;border:1px solid currentColor;color:inherit;border-radius:var(--r-sm,6px);padding:6px 12px;font:inherit;font-weight:700;cursor:pointer;min-height:36px}
.st-pre{font-family:var(--f-mono,monospace);font-size:.85rem;background:var(--surface2,#ece2cd);border-radius:var(--r-sm,6px);padding:8px 10px;margin:0}
@media (prefers-reduced-motion:no-preference){.st-hold i{transition:width .05s linear}}`;document.head.append(st);}
  const el=(html)=>{const d=document.createElement("div");d.innerHTML=html.trim();return d.firstChild;};
  const e=s=>(typeof esc==="function"?esc(s):String(s));
  const pl=(n,one,many)=>`${n} ${n===1?one:(many||one+"s")}`;
  const say=(m,k)=>{try{toast(m,k);}catch(x){}};
  const rerender=()=>{try{if(typeof render==="function")render(false,true);}catch(x){}};
  /* ---------- downloads ---------- */
  function download(name,text){
    if(window.GALEN_PLATFORM==="artifact"){try{navigator.clipboard.writeText(text).then(()=>say("Copied: paste it into a note or file","good"),()=>say("Copy failed","bad"));}catch(x){say("Copy failed","bad");}return;}
    try{const blob=new Blob([text],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}catch(x){say("Download failed","bad");}
  }
  const stamp=()=>{const d=new Date();return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;};
  const downloadBackup=()=>{Store.commit();download(`galen-backup-${stamp()}.json`,JSON.stringify(Store.s));};
  /* ---------- modal ---------- */
  function modal(html,onClose){css();closeModal();const v=el(`<div class="st-veil" role="dialog" aria-modal="true"><div class="st-card">${html}</div></div>`);
    v.addEventListener("click",ev=>{if(ev.target===v&&onClose!==false){closeModal();}});
    const key=ev=>{if(ev.key==="Escape"&&onClose!==false){ev.stopPropagation();closeModal();}};v._key=key;document.addEventListener("keydown",key,true);
    document.body.append(v);overlayModal=v;setTimeout(()=>{const f=v.querySelector("[data-focus]")||v.querySelector("button");if(f)f.focus();},30);return v;}
  let overlayModal=null;
  function closeModal(){if(overlayModal){document.removeEventListener("keydown",overlayModal._key,true);overlayModal.remove();overlayModal=null;}}
  /* ---------- Undo snack (30 s) ---------- */
  function undoSnack(msg,fn,ms){css();document.querySelectorAll(".st-snack,.snack").forEach(b=>b.remove());clearTimeout(snackT);
    const s=el(`<div class="st-snack" role="status"><span>${e(msg)}</span><button type="button">Undo</button></div>`);document.body.append(s);
    s.querySelector("button").addEventListener("click",()=>{clearTimeout(snackT);s.remove();try{fn();}catch(x){say("Undo failed: "+x.message,"bad");}});
    snackT=setTimeout(()=>s.remove(),ms||30000);}
  /* ---------- hold to confirm ---------- */
  function holdButton(btn,ms,fn){const fill=btn.querySelector("i");let t0=0,raf=0,done=false;
    const step=()=>{const p=Math.min(1,(performance.now()-t0)/ms);fill.style.width=(p*100)+"%";if(p>=1){done=true;stop();fn();return;}raf=requestAnimationFrame(step);};
    const start=ev=>{if(done||t0)return;if(ev&&ev.type==="keydown"&&!(ev.key==="Enter"||ev.key===" "))return;if(ev)ev.preventDefault();t0=performance.now();raf=requestAnimationFrame(step);};
    const stop=()=>{cancelAnimationFrame(raf);t0=0;if(!done)fill.style.width="0";};
    btn.addEventListener("pointerdown",start);["pointerup","pointerleave","pointercancel","blur"].forEach(k=>btn.addEventListener(k,stop));
    btn.addEventListener("keydown",ev=>{if(ev.repeat)return;start(ev);});btn.addEventListener("keyup",stop);
    btn.addEventListener("click",ev=>ev.preventDefault());btn.addEventListener("contextmenu",ev=>ev.preventDefault());}
  /* ---------- reset ---------- */
  function resetDialog(){
    const prev=Store.snapshotInfo(LS+".beforeReset");
    const groups=Object.keys(ST_GROUPS).map(g=>`<label><input type="checkbox" name="g" value="${g}" ${ST_GROUPS[g].optional?"":"checked"}><span><b>${e(ST_GROUPS[g].label)}</b><small>${e(ST_GROUPS[g].sub)}</small></span></label>`).join("");
    const v=modal(`<h2>Reset progress</h2>
      <p>Choose what to clear. It is cleared on every device that syncs, so it will not come back with the next sync. Your settings stay.</p>
      <fieldset class="st-groups">${groups}</fieldset>
      <p class="small muted">Galen keeps a copy on this device first, and you can undo for 30 seconds.</p>
      <div class="st-row"><button type="button" class="st-hold" id="st-go"><i></i><span>Hold to reset (1.5 s)</span></button><button type="button" class="btn ghost" id="st-bk" data-focus>Download a backup first</button><button type="button" class="btn ghost" id="st-x">Cancel</button></div>
      ${prev&&prev.t?`<p class="small">Last reset on ${fmtDate(prev.t)}. <button type="button" class="btn sm soft" id="st-back">Bring back what it cleared</button></p>`:""}`);
    const chosen=()=>[...v.querySelectorAll("input[name=g]:checked")].map(x=>x.value);
    v.querySelector("#st-x").addEventListener("click",closeModal);
    v.querySelector("#st-bk").addEventListener("click",downloadBackup);
    const go=v.querySelector("#st-go");
    v.addEventListener("change",()=>{const n=chosen().length;go.disabled=!n;go.style.opacity=n?"":".5";});
    holdButton(go,1500,()=>{const gs=chosen();if(!gs.length)return;const all=ST_RESET_DEFAULT.every(g=>gs.includes(g));const undo=Store.reset(gs);closeModal();
      try{if(all&&typeof open==="function")open("today");else rerender();}catch(x){}
      undoSnack(all?"All progress reset. A copy is kept.":"Reset done. A copy is kept.",()=>{undo();say("Progress brought back","good");rerender();});});
    const back=v.querySelector("#st-back");if(back)back.addEventListener("click",()=>{const gs=prev.groups||ST_RESET_DEFAULT;if(Store.adopt(prev.raw,gs)){closeModal();say("Progress from before the reset brought back","good");rerender();}else say("That copy could not be read","bad");});
  }
  /* ---------- restore ---------- */
  function restoreDialog(text){
    let obj=null;try{obj=JSON.parse(text);}catch(x){obj=repairJSON(text);}
    const p=obj&&Store.preview(obj);
    if(!p){say("This file is not a Galen backup. Nothing was changed.","bad");return;}
    if(p.newer){say("This backup was made by a newer Galen. Update this device first. Nothing was changed.","bad");return;}
    const v=modal(`<h2>Restore a backup</h2>
      <p class="st-pre">${pl(p.cards,"card")} · ${pl(p.log,"log entry","log entries")} · ${pl(p.tech,"technique")} · ${pl(p.eggs,"egg")} · ${p.xp} XP${p.updated?` · saved ${fmtDate(p.updated)}`:""}</p>
      <fieldset class="st-groups">
        <label><input type="radio" name="m" value="merge" checked><span><b>Merge with what you have</b><small>Nothing you have is lost. For each card or record, the more recent change wins.</small></span></label>
        <label><input type="radio" name="m" value="replace"><span><b>Replace your progress</b><small>Your progress on every synced device becomes this backup.</small></span></label>
        <label><input type="checkbox" name="set"><span><b>Also use the backup's settings</b><small>Name, daily load, sound output and theme.</small></span></label>
      </fieldset>
      <p class="small muted">Galen keeps a copy of your current progress first, and you can undo for 30 seconds.</p>
      <div class="st-row"><button type="button" class="btn" id="st-ok" data-focus>Restore</button><button type="button" class="btn ghost" id="st-x">Cancel</button></div>`);
    v.querySelector("#st-x").addEventListener("click",closeModal);
    v.querySelector("#st-ok").addEventListener("click",()=>{const mode=v.querySelector("input[name=m]:checked").value,settings=v.querySelector("input[name=set]").checked;
      try{const undo=Store.restore(obj,{mode,settings});closeModal();try{if(typeof applyTheme==="function")applyTheme();}catch(x){}rerender();
        undoSnack(mode==="replace"?"Backup restored in place of your progress.":"Backup merged.",()=>{undo();say("Restore undone","good");rerender();});}
      catch(x){say(x.message,"bad");}});
  }
  /* ---------- problem banner ---------- */
  function banner(){
    if(typeof document==="undefined"||!document.body)return;css();
    const P=Store.problem,items=[];
    if(Store.saveProblem==="full"&&!dismissed.full)items.push({id:"full",cls:"",text:"Not saved: this device's storage is full. Download a backup now, then free some space on the device.",btns:[["Download backup",downloadBackup],["Try again",()=>{Store.save(true);banner();}]]});
    if(Store.saveProblem==="blocked"&&!dismissed.blocked)items.push({id:"blocked",cls:"warn",text:"This browser is not keeping Galen's progress (a private window, or storage is blocked). Download a backup before you close it.",btns:[["Download backup",downloadBackup],["Dismiss",()=>{dismissed.blocked=1;banner();}]]});
    if(P&&P.kind==="newer"&&!dismissed.newer)items.push({id:"newer",cls:"warn",text:"Your progress on this device was saved by a newer Galen. It is kept untouched, and this window will not save until Galen is updated.",btns:[["Update now",updateNow],["Download a copy",()=>download(`galen-newer-${stamp()}.json`,P.raw)],["Use this version anyway",()=>{Store.readOnly=false;dismissed.newer=1;say("Saving again. The newer copy stays kept aside.");banner();}]]});
    if(P&&P.kind==="unreadable"&&!dismissed.unreadable){
      const n=Object.keys(Store.s.srs).length;
      items.push({id:"unreadable",cls:P.repaired?"warn":"",text:P.repaired?`Saved progress on this device was damaged. Galen recovered what it could (${pl(n,"card")}) and kept the original copy.`:(Store.holdWrites?"Saved progress on this device could not be read, and there was no room to keep a copy. Galen is not saving until you choose.":"Saved progress on this device could not be read. The original is kept safe and was not overwritten."),
        btns:[["Download the original",()=>download(`galen-unreadable-${stamp()}.json`,P.raw)],
          ...(P.repaired?[]:[["Restore a backup",()=>{dismissed.unreadable=1;banner();try{open("tools","data");}catch(x){}}]]),
          ...(Store.holdWrites?[["Start saving again",()=>{Store.holdWrites=false;Store.save(true);dismissed.unreadable=1;banner();}]]:[["Dismiss",()=>{dismissed.unreadable=1;banner();}]])]});}
    if(Store.blocked==="newer"&&!dismissed.remote)items.push({id:"remote",cls:"warn",text:"Your Drive copy was saved by a newer Galen. Update this device to keep syncing. Nothing on Drive was overwritten.",btns:[["Update now",updateNow],["Dismiss",()=>{dismissed.remote=1;banner();}]]});
    if(bar){bar.remove();bar=null;}
    if(!items.length)return;
    const it=items[0];
    bar=el(`<div class="st-bar ${it.cls}" role="alert"><p>${e(it.text)}</p><div class="st-row">${it.btns.map((b,i)=>`<button type="button" class="btn sm ${i?"ghost":""}" data-i="${i}">${e(b[0])}</button>`).join("")}</div></div>`);
    bar.addEventListener("click",ev=>{const b=ev.target.closest("[data-i]");if(b)it.btns[+b.dataset.i][1]();});
    document.body.append(bar);
  }
  async function updateNow(){try{const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(r){await r.update();if(r.waiting){r.waiting.postMessage("skipWaiting");return;}}}catch(x){}location.reload();}
  /* ---------- one writing window ---------- */
  function veil(kind){css();if(overlay)overlay.remove();
    overlay=el(`<div class="st-veil" role="dialog" aria-modal="true" aria-labelledby="st-tab-h"><div class="st-card"><h2 id="st-tab-h">${kind==="moved"?"Galen moved to another window":"Galen is open in another window"}</h2>
      <p>Only one window saves your progress at a time, so nothing is overwritten.</p><div class="st-row"><button type="button" class="btn" id="st-here">Use Galen here</button></div></div></div>`);
    overlay.querySelector("#st-here").addEventListener("click",()=>takeOver(false));document.body.append(overlay);setTimeout(()=>{const b=overlay&&overlay.querySelector("#st-here");if(b)b.focus();},30);}
  function unveil(){if(overlay){overlay.remove();overlay=null;}}
  function holdLock(){Store.lockHeld=true;return new Promise(res=>{held=()=>{Store.lockHeld=false;res();};});}
  function writer(reload){Store.passive=false;unveil();if(reload){Store.reloadFromDisk();rerender();try{Store.sync().catch(()=>{});}catch(x){}}Store.status=Store.provider?Store.status:"This device";Store.emit("status");}
  function passive(kind,later){try{Store.flush();}catch(x){}Store.passive=true;Store.lockHeld=false;Store.status="Open in another window";Store.emit("status");
    if(later)setTimeout(()=>{if(Store.passive)veil(kind);},1200);else veil(kind);queue();}
  /* wait in line: when the writing window closes, this one takes over by itself */
  function queue(){if(queued)return;const ac=typeof AbortController==="function"?new AbortController():null;queued=ac||{};
    navigator.locks.request(LOCK,ac?{signal:ac.signal}:{},()=>{queued=null;writer(true);return holdLock();}).catch(()=>{});}
  /* auto: a visible window asks a hidden writer to hand over (the window you are looking at wins); a visible writer says busy */
  function takeOver(auto){
    if(auto!==true){const b=overlay&&overlay.querySelector("#st-here");if(b){b.disabled=true;b.textContent="Taking over…";}}
    let done=false;
    const go=()=>{if(done)return;done=true;if(chan)chan.removeEventListener("message",on);if(queued&&queued.abort)queued.abort();queued=null;
      navigator.locks.request(LOCK,{steal:true},()=>{writer(true);return holdLock();}).catch(()=>{});};
    const on=ev=>{const d=ev.data||{};if(d.type==="released")go();else if(d.type==="busy"&&auto===true){done=true;chan.removeEventListener("message",on);}};
    if(chan){chan.addEventListener("message",on);chan.postMessage({type:"want",auto:auto===true});setTimeout(go,900);}else if(auto!==true)go();
  }
  function start(){
    if(!supported())return;
    try{chan=new BroadcastChannel("galen.tabs");}catch(x){chan=null;}
    if(chan)chan.addEventListener("message",ev=>{const d=ev.data||{};if(d.type!=="want"||!held||Store.passive)return;
      if(d.auto&&!document.hidden){try{chan.postMessage({type:"busy"});}catch(x){}return;}
      const r=held;held=null;passive("moved");r();setTimeout(()=>{try{chan.postMessage({type:"released"});}catch(x){}},0);});
    navigator.locks.request(LOCK,{ifAvailable:true},lock=>{if(!lock){const vis=!document.hidden;passive("other",vis);if(vis)takeOver(true);return;}return holdLock();})
      .catch(err=>{if(err&&err.name==="AbortError"&&!Store.passive)passive("moved");});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Store.passive&&overlay)takeOver(true);});
  }
  if(typeof window!=="undefined"&&window.addEventListener){
    window.addEventListener("galen:store",()=>{try{banner();}catch(x){}});
    const boot=()=>{try{start();}catch(x){}try{banner();}catch(x){}};
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else setTimeout(boot,0);
  }
  return {resetDialog,restoreDialog,undoSnack,banner,downloadBackup,download,takeOver};
})();
/* the dialogs live on Store so the data page can call them in one line */
Store.resetDialog=()=>Safety.resetDialog();
Store.restoreDialog=t=>Safety.restoreDialog(t);
