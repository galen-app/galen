"use strict";
/* Galen theatre: quips in the top bar, right/wrong feedback watcher, and the easter eggs (marginalia). */
let _quipT=null;
function quip(kind){const arr=GALEN[kind];if(!arr)return;const [,en]=galenPick(arr);const t=$("#toptitle");if(!t)return;
  clearTimeout(_quipT);const orig=t.dataset.orig||t.textContent;t.dataset.orig=orig;t.innerHTML=`<span style="font-style:italic;color:var(--accent-ink)">${esc(en)}</span>`;
  _quipT=setTimeout(()=>{t.textContent=t.dataset.orig;delete t.dataset.orig;},3200);
  const rp=$("#rp-quip");if(rp)rp.textContent=en;}

/* right and wrong, wherever they happen: listen for the classes the practice screens already set */
let _fbLast=0;
new MutationObserver(ms=>{for(const m of ms){const el=m.target;if(!(el instanceof Element))continue;const was=m.oldValue||"";
  const r=el.classList.contains("right")&&!/\bright\b/.test(was),w=el.classList.contains("wrong")&&!/\bwrong\b/.test(was);
  if((r||w)&&Date.now()-_fbLast>350){_fbLast=Date.now();SND.fx(r?"right":"wrong");if(w||Math.random()<.35)quip(r?"right":"wrong");break;}}})
 .observe($("#view"),{subtree:true,attributes:true,attributeFilter:["class"],attributeOldValue:true});

/* ================= EGGS ================= */
function eggFound(id){return !!Store.s.notes["egg:"+id];}
function findEgg(id,quiet){const e=EGGS.find(x=>x.id===id);if(!e)return;const first=!eggFound(id);
  if(first){Store.s.notes["egg:"+id]={t:Date.now(),v:1};Store.save();SND.fx("bell");}
  if(quiet){if(first)toast(`Written in the margin: ${e.t} · find it in the codex`);return;}
  showEgg(e,first);}
function showEgg(e,first){const el=document.createElement("div");el.className="helpov";el.setAttribute("role","dialog");el.setAttribute("aria-label",e.t);
  const n=EGGS.filter(x=>eggFound(x.id)).length;
  el.innerHTML=`<div class="card stack" style="gap:12px">${guideHTML([null,e.t])}<p class="lore-body" style="margin:0">${esc(e.x)}</p><div class="row-x"><span class="marg">${first?"A secret, written in the margin.":"Found before."} ${n} of ${EGGS.length} marginalia.</span><span class="spacer"></span><button class="btn sm" data-x>Close</button></div></div>`;
  document.body.append(el);const close=()=>el.remove();el.addEventListener("click",ev=>{if(ev.target===el||ev.target.closest("[data-x]"))close();});
  el.addEventListener("keydown",ev=>{if(ev.key==="Escape"){ev.stopPropagation();close();}});setTimeout(()=>$("[data-x]",el)?.focus(),20);}
/* the medallion does not like to be poked */
let _mdN=0,_mdT=0;
document.addEventListener("click",e=>{const m=e.target.closest("[data-egg-medal]");if(m){if(Date.now()-_mdT>1500)_mdN=0;_mdT=Date.now();_mdN++;
    if(_mdN===3)quip("idle");if(_mdN>=5){_mdN=0;findEgg("apes");}return;}
  const g=e.target.closest("[data-egg]");if(g){e.preventDefault();e.stopPropagation();findEgg(g.dataset.egg);}},true);
/* hold the serpent */
{let ht=null;const bm=()=>$$(".brandmark");document.addEventListener("pointerdown",e=>{if(e.target.closest(".brandmark,.railbrand")){ht=setTimeout(()=>findEgg("oath"),1600);}});
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>document.addEventListener(ev,()=>clearTimeout(ht)));}
/* words in the search box */
const EGG_WORDS=[[/rete mirabile|wonderful net/,"rete"],[/humou?rs?\b|four humou?rs|black bile|phlegm/,"humours"],[/\bvesalius\b/,"vesalius"],[/^galen$/,"galen"],[/rolled paper|quire|laennec'?s? paper/,"paper"]];
document.addEventListener("input",e=>{if(e.target.id!=="palq")return;const v=e.target.value.trim().toLowerCase();for(const [re,id] of EGG_WORDS)if(re.test(v)&&!eggFound(id)){findEgg(id);break;}});
/* the old code */
{const K=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let i=0;
  window.galenCode=k=>{i=(k===K[i])?i+1:(k===K[0]?1:0);if(i===K.length){i=0;findEgg("konami");document.documentElement.classList.add("candles");SND.fx("seal");}};
  document.addEventListener("keydown",e=>{if(/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;galenCode(e.key.length===1?e.key.toLowerCase():e.key);});}

