"use strict";
/* Galen theatre: the desktop reference pane (>=1100 px). */
/* ================= REFERENCE PANE (desktop ≥1100 px) ================= */
const RP={pin:null};
const wide=()=>matchMedia("(min-width:1100px)").matches;
function rpSign(id){const s=SIGNS[id];if(!s)return "";const ls=LORE_BY_SIGN[id]||[];
  return `<div class="rp-h"><span class="eyebrow">Reference</span><span class="spacer"></span><button class="iconbtn" data-rp-close aria-label="Close reference">${ic("close")}</button></div>
  <div class="card stack" style="gap:10px"><span class="row-x" style="gap:8px"><span class="v v-${s.v}">${VERDICT[s.v]}</span><span class="tiny muted">${esc(s.target)}</span></span><h2>${esc(s.name)}</h2>
   ${typeof lrChips==="function"?`<div class="chips">${lrChips(s)}</div>`:""}
   <div><span class="label">How</span><p class="small" style="margin:2px 0 0">${esc(s.how)}</p></div>
   <div><span class="label">Why it works</span><p class="small" style="margin:2px 0 0">${esc(s.mech)}</p></div>
   <div><span class="label">What to think</span><p class="small" style="margin:2px 0 0">${esc(s.think)}</p></div>
   <button class="btn sm soft" data-go="signs/sign/${id}" data-rp-full>Open the full page</button></div>
  ${ls.map(l=>loreCard(l)).join("")}`;}
function rpTech(id){const t=TECH.find(x=>x.id===id);if(!t)return "";
  return `<div class="rp-h"><span class="eyebrow">Technique</span><span class="spacer"></span><button class="iconbtn" data-rp-close aria-label="Close reference">${ic("close")}</button></div>
  <div class="card stack" style="gap:10px"><h2>${esc(t.name)}</h2><p class="small muted" style="margin:0">${esc(t.purpose)}</p>
  <ol class="small" style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">${t.steps.map(s=>`<li><b>${esc(s.do)}</b><br><span class="muted">${esc(s.why)}</span></li>`).join("")}</ol>
  <button class="btn sm soft" data-go="learn/tech/${id}" data-rp-full>Open the technique</button></div>`;}
function rpDefault(){const r=cur(),key=NAV.tab+":"+r.v;let ctx="idle";if(key==="learn:hall")ctx=r.a;else if(key==="signs:sign")ctx=signHall(r.a)||"idle";
  const line=GALEN.hall[ctx]||galenFor("idle");const due=dueCards().length;const l=loreOfDay();
  const hid=key==="learn:hall"?r.a:key==="signs:sign"?signHall(r.a):null;const h=hid&&HALL[hid];
  return `${guideHTML(line,{small:1})}<p class="small" id="rp-quip" style="font-style:italic;color:var(--accent-ink);min-height:1.2em;margin:0"></p>
   <div class="card stack" style="gap:8px"><span class="label">Today</span><b style="font-family:var(--f-display);font-size:1.3rem">${due?`${due} card${due>1?"s":""} due`:"Nothing due"}</b><button class="btn sm" data-go="practice/session/all">${ic("play")}${due?"Start the session":"Learn something new"}</button></div>
   ${h&&key!=="learn:hall"?`<div class="card stack" style="gap:8px"><span class="label">This hall</span>${hallCard(h)}</div>`:""}
   <div class="stack" style="gap:8px"><span class="label">From the codex</span>${loreCard(l,{hall:1})}</div>
   <p class="tiny muted">Tap a sign or technique in a lesson or drill and it opens here, beside your work.</p>`;}
function rpRender(){const el=$("#refpane");if(!el)return;if(!wide()){el.innerHTML="";return;}
  el.innerHTML=RP.pin?(RP.pin[0]==="sign"?rpSign(RP.pin[1]):rpTech(RP.pin[1])):rpDefault();}
document.addEventListener("click",e=>{
  if(e.target.closest("[data-rp-close]")){RP.pin=null;rpRender();return;}
  if(e.target.closest("[data-rp-full]")){RP.pin=null;setTimeout(rpRender,0);return;}
  if(!wide())return;const g=e.target.closest("[data-go]");if(!g||g.closest("#refpane")||g.closest(".pal-back"))return;
  const p=g.dataset.go.split("/");const inStudy=NAV.tab==="practice"||(NAV.tab==="learn"&&cur().v!=="hall"&&cur().v!=="home"&&cur().v!=="codex")||(NAV.tab==="today"&&cur().v!=="home");
  if(!inStudy)return;
  if(p[0]==="signs"&&p[1]==="sign"&&SIGNS[p[2]]){e.preventDefault();e.stopImmediatePropagation();RP.pin=["sign",p[2]];rpRender();SND.fx("page");}
  else if(p[0]==="learn"&&p[1]==="tech"&&p[2]&&typeof TECH!=="undefined"&&TECH.find(t=>t.id===p[2])&&cur().v!=="tech"){e.preventDefault();e.stopImmediatePropagation();RP.pin=["tech",p[2]];rpRender();SND.fx("page");}
},true);
matchMedia("(min-width:1100px)").addEventListener("change",rpRender);

/* after every render: stage tint per hall, the pane, the room's key */
