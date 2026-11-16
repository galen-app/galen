"use strict";
/* ================= BOOT ================= */
Store.init();
buildCards();
try{applyTheme();}catch(e){}
Store.on(kind=>{
  try{syncChip();}catch(e){}
  if(kind!=="status"&&kind!=="plan"){ /* remote progress arrived: refresh views that show progress, never interrupt a running drill or session */
    try{const v=cur().v;if(["home","library","module"].includes(v)&&!PAL)render(false,true);else chrome();}catch(e){console.warn(e);}
  }
  if(kind==="plan"&&cur().v==="home"&&NAV.tab==="today"&&!PAL)try{render(false,true);}catch(e){}
});
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>Players.list.forEach(p=>{if(E.box!==p)p.draw(null);}));}catch(e){}
new MutationObserver(()=>Players.list.forEach(p=>{if(E.box!==p)p.draw(null);})).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
/* going to the background: flush unsynced work (push now pulls and merges first, under the Drive lock); coming back: a quiet check */
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){try{stopAll();}catch(e){}if(Store.provider&&Store.status!=="Synced")Store.push().catch(()=>{});}
  else{Hub.daily("return").catch(()=>{});}
});
window.addEventListener("online",()=>{Hub.daily("online").catch(()=>{});});
window.addEventListener("offline",()=>{try{toast("Offline: everything works except photos and Drive sync");}catch(e){}});
/* every failure reaches Tools › Backup › Diagnostics, not only window errors */
const diag=m=>{try{if(typeof DIAG!=="undefined"&&DIAG.errors){DIAG.errors.push({t:Date.now(),m:String(m).slice(0,200)});if(DIAG.errors.length>8)DIAG.errors.shift();}}catch(e){}};
window.addEventListener("error",e=>{console.error(e.error||e.message);});
window.addEventListener("unhandledrejection",e=>{const r=e.reason;console.warn(r);diag("Unhandled: "+((r&&r.message)||r));});
/* ---- update banner for the installed app: shown on every start while an update waits, until the user updates ---- */
let updReg=null,updHidden=false;
function showUpdate(reg){
  if(!reg||!reg.waiting||updHidden)return;updReg=reg;
  const el=Hub.shellNotice("update","<b>Update ready.</b> Tap to restart Galen; your progress is kept.",[["Update",btn=>{
    const w=updReg&&updReg.waiting;if(!w){btn.textContent="Checking…";updReg.update().catch(()=>{});return;}
    btn.disabled=true;btn.textContent="Updating…";try{Store.cache();}catch(e){}w.postMessage("skipWaiting");
    setTimeout(()=>{if(btn.isConnected){btn.disabled=false;btn.textContent="Try again";}},8000);}]]);
  if(el){const x=el.querySelector(".sb-x");if(x)x.addEventListener("click",()=>{updHidden=true;});}
}
document.addEventListener("galen:update",e=>showUpdate(e.detail));
/* hidden with ×: back when the app next comes into view */
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&updHidden){updHidden=false;showUpdate(updReg||window.GALEN_SW);}});
/* ---- keep the browser from evicting progress once there is some ---- */
function askPersist(){try{if(navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(p=>{if(!p&&Object.keys(Store.s.srs||{}).length)navigator.storage.persist().catch(()=>{});}).catch(()=>{});}catch(e){}}
/* ---- deep links on the installed app: #signs/sign/jvp ----
   The router (80-app.js) may take over the hash and history: if it defines routeFromHash(hash) it is used instead of openHash. */
function readHash(){const raw=(location.hash||"").slice(1);try{return decodeURIComponent(raw);}catch(e){return raw;}}
function openHash(h){
  if(typeof routeFromHash==="function")return routeFromHash(h);
  const parts=String(h||"").split("/").filter(Boolean).slice(0,4);if(!parts.length)return false;
  if(!TABS.some(t=>t[0]===parts[0]))return false;
  if(parts.length===1){NAV.tab=parts[0];return true;}
  NAV.tab=parts[0];NAV.stacks[parts[0]]=[{v:ROOTV[parts[0]]},{v:parts[1],a:parts[2],b:parts[3]}];return true;
}
(function start(){
  try{openHash(readHash());}catch(e){console.warn("deep link",e);}
  try{render(false);}catch(e){console.error(e);diag("Start: "+e.message);}
  try{syncChip();}catch(e){}
  Store.connect().then(()=>Hub.daily("start")).catch(e=>diag("Sync start: "+(e&&e.message)));
  /* hash links, back and forward belong to the router (80-app.js: pushState + popstate) */
  if(window.GALEN_SW)showUpdate(window.GALEN_SW);
  setTimeout(askPersist,20000);
})();
