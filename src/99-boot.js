"use strict";
/* ================= BOOT ================= */
Store.init();
buildCards();
try{applyTheme();}catch(e){}
Store.on(kind=>{
  syncChip();
  if(kind!=="status"&&kind!=="plan"){ /* remote progress arrived: refresh views that show progress, never interrupt a running drill or session */
    const v=cur().v;if(["home","library","module"].includes(v)&&!PAL)render(false,true);else chrome();
  }
  if(kind==="plan"&&cur().v==="home"&&NAV.tab==="today"&&!PAL)render(false,true);
});
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>Players.list.forEach(p=>{if(E.box!==p)p.draw(null);}));}catch(e){}
new MutationObserver(()=>Players.list.forEach(p=>{if(E.box!==p)p.draw(null);})).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
document.addEventListener("visibilitychange",()=>{if(document.hidden){stopAll();if(Store.provider)Store.push();}else{Hub.daily("return").catch(()=>{});}});
window.addEventListener("online",()=>{Hub.daily("online").catch(()=>{});});
window.addEventListener("error",e=>{console.error(e.error||e.message);});
window.addEventListener("unhandledrejection",e=>{console.warn(e.reason);});
/* update banner for the installed app */
document.addEventListener("galen:update",e=>{
  const reg=e.detail;if(!reg||!reg.waiting)return;
  const bar=document.createElement("div");bar.className="updbar";bar.innerHTML=`<span>A new version of Galen is ready.</span><button class="btn sm">Update</button>`;
  $("button",bar).addEventListener("click",()=>{reg.waiting.postMessage("skipWaiting");bar.remove();});document.body.append(bar);
});
/* deep links on the installed app: #signs/sign/jvp */
function openHash(h){
  const parts=h.split("/").filter(Boolean);if(!parts.length)return false;
  if(parts.length===1){if(TABS.some(t=>t[0]===parts[0])){NAV.tab=parts[0];return true;}return false;}
  if(!TABS.some(t=>t[0]===parts[0]))return false;
  NAV.tab=parts[0];NAV.stacks[parts[0]]=[{v:ROOTV[parts[0]]},{v:parts[1],a:parts[2],b:parts[3]}];return true;
}
(function start(){
  const h=decodeURIComponent((location.hash||"").slice(1));
  openHash(h);
  render(false);syncChip();
  Store.connect().then(()=>Hub.daily("start")).catch(()=>{});
  if(window.GALEN_PLATFORM==="pages")window.addEventListener("hashchange",()=>{const hh=decodeURIComponent((location.hash||"").slice(1));if(hh&&hh.includes("/")&&openHash(hh))render(true);});
})();
