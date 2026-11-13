"use strict";
/* Galen theatre: the desktop reference pane (>=1100 px).
   It follows what you are doing: the current card's sign after you answer, the drill's progress, the hall outline you are in,
   the techniques and stories behind a sign. A sign or technique you tap in a lesson, drill or case is pinned here, beside your work,
   and the pin belongs to the screen it came from. The pane can be hidden to a thin spine and resized; that is remembered per device. */
/* ================= REFERENCE PANE ================= */
const RP={pin:null,from:null,peek:false,open:null,w:null,recent:[],sig:"",chap:-1};
const RP_KEY="galen.rp",RP_MIN=280,RP_MAX=600;
const wide=()=>matchMedia("(min-width:1100px)").matches;
/* per-device layout convenience only (width, shown or hidden, recently opened); never progress */
function rpLoad(){try{const o=JSON.parse(localStorage.getItem(RP_KEY)||"{}")||{};RP.open=typeof o.open==="boolean"?o.open:null;RP.w=Number.isFinite(+o.w)&&+o.w>=RP_MIN?+o.w:null;
  RP.recent=Array.isArray(o.recent)?o.recent.filter(x=>Array.isArray(x)&&(x[0]==="sign"||x[0]==="tech")&&typeof x[1]==="string").slice(0,6):[];}catch(e){}}
function rpSave(){try{localStorage.setItem(RP_KEY,JSON.stringify({open:RP.open,w:RP.w,recent:RP.recent}));}catch(e){}}
rpLoad();
const rpMaxW=()=>Math.max(RP_MIN,Math.min(RP_MAX,Math.round(innerWidth*.42)));
/* shown by default from 1440 px; on the 1280 Steam Deck screen it starts as a spine and opens when you pin something */
function rpIsOpen(){return RP.peek||(RP.open!=null?RP.open:innerWidth>=1440);}
function rpApply(){const de=document.documentElement;const w=wide();de.classList.toggle("rp-shut",w&&!rpIsOpen());
  if(RP.w)de.style.setProperty("--rp-w",Math.min(RP.w,rpMaxW())+"px");else de.style.removeProperty("--rp-w");}
function rpToggle(force){const open=force!=null?!!force:!rpIsOpen();RP.open=open;RP.peek=false;rpSave();rpRender(true);
  rpSay(open?"Reference pane shown":"Reference pane hidden");return open;}
/* the screen a pin belongs to: the route, plus the card or trial inside a session or drill */
function rpRouteKey(){const r=cur();let k=NAV.tab+":"+r.v+":"+(r.a||"")+":"+(r.b||"");
  if(k.startsWith("practice:session")&&typeof SES!=="undefined"&&SES)k+="#"+SES.i;
  if(k.startsWith("practice:drill")&&typeof DR!=="undefined"&&DR)k+="#"+DR.trial;return k;}
let _rpLive=null;
function rpSay(t){if(!_rpLive){_rpLive=document.createElement("div");_rpLive.className="rp-live";_rpLive.setAttribute("aria-live","polite");_rpLive.setAttribute("role","status");document.body.append(_rpLive);}
  _rpLive.textContent="";setTimeout(()=>{if(_rpLive)_rpLive.textContent=t;},40);}
function rpHash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
const rpTechFor=id=>typeof TECH==="undefined"?[]:TECH.filter(t=>(t.signs||[]).includes(id));
const rpSignBtn=id=>{const s=SIGNS[id];return s?`<button class="chip" data-rp-sign="${esc(id)}"><span class="v v-${s.v}">${VERDICT[s.v]}</span>${esc(s.name)}</button>`:"";};
const rpTechBtn=t=>`<button class="chip" data-rp-tech="${esc(t.id)}">${ic("check")}${esc(t.name)}</button>`;
const rpHallRow=h=>`<button class="rp-hall" data-go="learn/hall/${h.id}"><span class="emb" aria-hidden="true"><svg viewBox="0 0 64 64">${EMB[h.id]||""}</svg></span><span class="tx"><span class="tiny muted">${h.id==="table"?"The centre":"Hall "+esc(h.rn)}</span><b>${esc(h.n)}</b></span>${ic("chev","chev")}</button>`;
function rpStories(id,hid){const own=LORE_BY_SIGN[id]||[];const more=hid?LORE.filter(l=>l.hall===hid&&!own.includes(l)):[];return own.concat(more).slice(0,own.length?own.length:1);}
function rpRecentHTML(skip){const r=RP.recent.filter(x=>!(skip&&x[0]===skip[0]&&x[1]===skip[1])).filter(x=>x[0]==="sign"?SIGNS[x[1]]:typeof TECH!=="undefined"&&TECH.find(t=>t.id===x[1])).slice(0,5);
  if(!r.length)return "";
  return `<section class="rp-sec"><span class="label">Recently opened here</span><div class="chips">${r.map(x=>x[0]==="sign"?rpSignBtn(x[1]):rpTechBtn(TECH.find(t=>t.id===x[1]))).join("")}</div></section>`;}
function rpQuip(line){const [la,en]=line||[null,""];return `<p class="rp-say">${la?`<span class="latin">${esc(la)}</span> `:""}<span id="rp-quip">${esc(en)}</span></p>`;}

/* ---------- pinned references ---------- */
function rpSign(id,opt={}){const s=SIGNS[id];if(!s)return "";const hid=signHall(id),h=hid&&HALL[hid];const tech=rpTechFor(id),ls=opt.brief?[]:rpStories(id,null);
  return `<div class="card stack rp-ref" style="gap:10px"><span class="row-x" style="gap:8px;flex-wrap:wrap"><span class="v v-${s.v}">${VERDICT[s.v]}</span><span class="tiny muted">${esc(s.target||"")}</span></span><h2>${esc(s.name)}</h2>
   ${typeof lrChips==="function"?`<div class="chips">${lrChips(s)}</div>`:""}
   ${s.how&&!opt.brief?`<div><span class="label">How</span><p class="small">${esc(s.how)}</p></div>`:""}
   ${s.mech?`<div><span class="label">Why it works</span><p class="small">${esc(s.mech)}</p></div>`:""}
   ${s.think?`<div><span class="label">What to think</span><p class="small">${esc(s.think)}</p></div>`:""}
   ${tech.length?`<div><span class="label">Do it properly</span><div class="chips">${tech.map(rpTechBtn).join("")}</div></div>`:""}
   <div class="row-x" style="gap:8px;flex-wrap:wrap"><button class="btn sm soft" data-go="signs/sign/${esc(id)}" data-rp-full>Open the full page</button>${s.p!=null||s.n!=null?`<button class="btn sm ghost" data-go="signs/calc/${esc(id)}" data-rp-full>${ic("scale")}LR calculator</button>`:""}</div></div>
   ${h&&!opt.brief?`<div class="stack" style="gap:6px"><span class="label">Hall</span>${rpHallRow(h)}</div>`:""}
   ${ls.length?`<div class="stack" style="gap:8px"><span class="label">From the codex</span>${ls.map(l=>loreCard(l)).join("")}</div>`:""}`;}
function rpTech(id){const t=typeof TECH!=="undefined"&&TECH.find(x=>x.id===id);if(!t)return "";const sg=(t.signs||[]).filter(k=>SIGNS[k]);
  return `<div class="card stack rp-ref" style="gap:10px"><span class="tiny muted">Technique clinic · ${esc(t.group||"")}</span><h2>${esc(t.name)}</h2><p class="small muted">${esc(t.purpose||"")}</p>
  <ol class="small rp-steps">${(t.steps||[]).map(s=>`<li><b>${esc(s.do)}</b>${s.why?`<br><span class="muted">${esc(s.why)}</span>`:""}</li>`).join("")}</ol>
  ${sg.length?`<div><span class="label">What it finds</span><div class="chips">${sg.map(rpSignBtn).join("")}</div></div>`:""}
  <button class="btn sm soft" data-go="learn/tech/${esc(id)}" data-rp-full>Open the technique</button></div>`;}

/* ---------- context panels ---------- */
function rpSession(){const S=SES,c=S.queue[S.i],tot=S.queue.length;const [a,hd,g,e]=S.res;const done=a+hd+g+e;const rl=Object.keys(S.relearn||{}).length;
  const answered=S.shown||S.answered!=null;let card="";
  if(c){const home=typeof cardHome==="function"?cardHome(c)||"":"";const hid=typeof cardHall==="function"?cardHall(c):null;const p=home.split("/");
    card=`<section class="rp-sec"><span class="label">This card</span><p class="small" style="margin:0">${esc(CARD_TYPE_LABEL[c.type]||"Card")}${hid&&HALL[hid]?` · ${esc(HALL[hid].short||HALL[hid].n)}`:""}</p></section>`;
    if(!answered)card+=`<div class="card rp-wait"><p class="small muted" style="margin:0">The reference for this card opens here once you have answered. No peeking.</p></div>`;
    else if(p[0]==="signs"&&p[1]==="sign"&&SIGNS[p[2]])card+=rpSign(p[2],{brief:1});
    else if(p[0]==="learn"&&p[1]==="tech"&&p[2])card+=`<div class="card stack" style="gap:8px"><span class="label">Technique</span>${(()=>{const t=TECH.find(x=>x.id===p[2]);return t?`<b>${esc(t.name)}</b><button class="btn sm soft" data-rp-tech="${esc(t.id)}">Show the steps here</button>`:"";})()}</div>`;
    else if(home)card+=`<div class="card"><button class="btn sm soft" data-go="${esc(home)}">Open where this card comes from</button></div>`;}
  return `<section class="rp-sec"><span class="label">This session</span><b class="rp-big">Card ${Math.min(S.i+1,tot)} of ${tot}</b><div class="meter"><i style="width:${Math.round(S.i/Math.max(1,tot)*100)}%"></i></div>
   <p class="tiny muted" style="margin:0">${done?`Again ${a} · Hard ${hd} · Good ${g} · Easy ${e}`:"Nothing graded yet"}${rl?` · ${rl} coming back to relearn`:""}</p></section>${card}
   <p class="tiny muted rp-keys">Keys: <kbd>Space</kbd> reveal · <kbd>1</kbd>–<kbd>4</kbd> grade · <kbd>U</kbd> undo · <kbd>Esc</kbd> leave</p>`;}
function rpDrill(){const d=DRILLS.find(x=>x.id===DR.id);if(!d)return "";const cats=DR.cats||[];const m=cats.filter(c=>drStat(c.key).m).length;
  const heart=d.real?d.real==="heart":SOUNDS[(cats[0]||{}).key]&&SOUNDS[cats[0].key].kind==="heart";const target=heart?DR_TARGET.heart:DR_TARGET.lung;
  let fb="";if(DR.phase==="fb"&&DR.cur){const k=DR.cur.cat.key,s=SOUNDS[k];fb=`<div class="card stack" style="gap:8px"><span class="label">That sound</span><b style="font-family:var(--f-display);font-size:1.2rem">${esc(DR.cur.cat.label)}</b>${s&&s.timing?`<p class="small muted" style="margin:0">${esc(s.timing)}${s.area?` · ${esc(s.area)}`:""}</p>`:""}${s&&s.diff?`<div><span class="label">Tell it apart</span><p class="small">${esc(s.diff)}</p></div>`:""}${s&&s.mech?`<div><span class="label">Why it sounds like that</span><p class="small">${esc(s.mech)}</p></div>`:""}</div>`;}
  return `<section class="rp-sec"><span class="label">This drill</span><b class="rp-big">${esc(d.name)}</b><div class="meter"><i style="width:${Math.round(m/Math.max(1,cats.length)*100)}%"></i></div>
   <p class="tiny muted" style="margin:0">${m} of ${cats.length} mastered${DR.n?` · ${DR.n} trials, ${Math.round(DR.right/DR.n*100)}% correct`:""} · answer within ${target} s to count</p></section>${fb}
   <p class="tiny muted rp-keys">Keys: <kbd>Space</kbd> play or pause · <kbd>1</kbd>–<kbd>9</kbd> answer · <kbd>Enter</kbd> next</p>`;}
function rpHall(hid){const h=HALL[hid],chs=OUTLINE[hid]||[];let due=0;try{due=dueCards().filter(c=>cardHall(c)===hid).length;}catch(e){}
  return `${rpQuip(GALEN.hall[hid])}<section class="rp-sec"><span class="label">The outline · where you are</span><nav class="rp-toc" aria-label="Chapters of this hall">${chs.map((c,i)=>`<button class="rp-chap${i===RP.chap?" on":""}" data-rp-chap="${i}"${i===RP.chap?' aria-current="true"':""}><span class="cn">${ROMAN[i]||i+1}</span><span>${esc(c.t)}</span></button>`).join("")}</nav></section>
   <div class="card stack" style="gap:8px"><span class="label">This hall</span><b class="rp-big">${due?`${due} card${due>1?"s":""} due here`:"Nothing due in this hall"}</b><button class="btn sm soft" data-go="practice/session/hall:${hid}">${ic("play")}${due?"Review this hall":"Learn from this hall"}</button></div>${rpRecentHTML()}`;}
function rpSignCtx(id){const hid=signHall(id),h=hid&&HALL[hid],tech=rpTechFor(id),ls=rpStories(id,hid);
  return `${tech.length?`<section class="rp-sec"><span class="label">Do it properly</span><div class="chips">${tech.map(rpTechBtn).join("")}</div></section>`:""}
   ${h?`<section class="rp-sec"><span class="label">This sign's hall</span>${rpHallRow(h)}</section>`:""}
   ${ls.length?`<section class="rp-sec"><span class="label">${LORE_BY_SIGN[id]?"The story behind this sign":"A story from this hall"}</span>${ls.map(l=>loreCard(l)).join("")}</section>`:""}
   ${rpRecentHTML(["sign",id])}`;}
function rpTechCtx(id){const t=TECH.find(x=>x.id===id);if(!t)return rpGeneric();const sg=(t.signs||[]).filter(k=>SIGNS[k]);const others=TECH.filter(x=>x.group===t.group&&x.id!==t.id).slice(0,6);
  return `${sg.length?`<section class="rp-sec"><span class="label">What this technique finds</span><div class="chips">${sg.map(rpSignBtn).join("")}</div><p class="tiny muted" style="margin:0">Tap one to read it here without leaving the steps.</p></section>`:""}
   ${others.length?`<section class="rp-sec"><span class="label">Same clinic room</span><div class="chips">${others.map(rpTechBtn).join("")}</div></section>`:""}${rpRecentHTML(["tech",id])}`;}
function rpLoreCtx(id){const l=typeof loreById==="function"?loreById(id):null;if(!l)return rpGeneric();const sg=(l.signs||[]).filter(k=>SIGNS[k]);const h=HALL[l.hall];
  return `${sg.length?`<section class="rp-sec"><span class="label">The signs in this story</span><div class="chips">${sg.map(rpSignBtn).join("")}</div></section>`:""}${h?`<section class="rp-sec"><span class="label">Its hall</span>${rpHallRow(h)}</section>`:""}${rpRecentHTML()}`;}
function rpHome(){let rows=[];try{const by={};dueCards().forEach(c=>{const h=cardHall(c)||"table";by[h]=(by[h]||0)+1;});rows=HALLS.filter(h=>by[h.id]).map(h=>[h,by[h.id]]);}catch(e){}
  const found=typeof EGGS!=="undefined"&&typeof eggFound==="function"?EGGS.filter(e=>eggFound(e.id)).length:0;
  return `<section class="rp-sec"><span class="label">Due by hall</span>${rows.length?`<div class="rp-due">${rows.map(([h,n])=>`<button class="rp-dueh" data-go="practice/session/hall:${h.id}"><span class="emb" aria-hidden="true"><svg viewBox="0 0 64 64">${EMB[h.id]||""}</svg></span><span class="tx">${esc(h.short||h.n)}</span><b>${n}</b></button>`).join("")}</div>`:`<p class="small muted" style="margin:0">Nothing due in any hall today. New cards come from the hall you open next.</p>`}</section>
   ${rpRecentHTML()||`<section class="rp-sec"><span class="label">Recently opened here</span><p class="small muted" style="margin:0">Signs and techniques you open beside a lesson, drill or case collect here.</p></section>`}
   ${typeof EGGS!=="undefined"?`<section class="rp-sec"><span class="label">Marginalia</span><button class="link small" style="align-self:flex-start" data-go="learn/codex">${found} of ${EGGS.length} secrets found</button></section>`:""}`;}
function rpGeneric(){const rk=rpRouteKey();let due=0;try{due=dueCards().length;}catch(e){}const l=loreOfDay();
  return `${rpQuip(galenPick(GALEN.idle,rpHash(rk)))}<div class="card stack" style="gap:8px"><span class="label">Today</span><b class="rp-big">${due?`${due} card${due>1?"s":""} due`:"Nothing due"}</b><button class="btn sm" data-go="practice/session/all">${ic("play")}${due?"Start the session":"Learn something new"}</button></div>
   ${rpRecentHTML()}<section class="rp-sec"><span class="label">From the codex</span>${loreCard(l,{hall:1})}</section>`;}
function rpContext(){const r=cur(),key=NAV.tab+":"+r.v;
  if(key==="practice:session"&&typeof SES!=="undefined"&&SES&&!SES.finished&&SES.queue[SES.i])return ["Beside this card",rpSession()];
  if(key==="practice:drill"&&r.a&&typeof DR!=="undefined"&&DR&&DR.id===r.a&&DR.phase!=="intro"&&DR.phase!=="done")return ["Beside this drill",rpDrill()];
  if(key==="learn:hall"&&HALL[r.a])return ["Hall outline",rpHall(r.a)];
  if(key==="signs:sign"&&SIGNS[r.a])return ["Around this sign",rpSignCtx(r.a)];
  if(key==="learn:tech"&&r.a&&typeof TECH!=="undefined")return ["Around this technique",rpTechCtx(r.a)];
  if(key==="learn:lore"&&r.a)return ["Around this story",rpLoreCtx(r.a)];
  if(key==="today:home")return ["What the theatre holds",rpHome()];
  return ["Reference",rpGeneric()];}
function rpHint(){return `<p class="tiny muted rp-hint">Tap a sign or technique in a lesson, a session answer, a technique or a case and it opens here, beside your work.</p>`;}
function rpSig(){const S=typeof SES!=="undefined"&&SES,D=typeof DR!=="undefined"&&DR;
  return [rpRouteKey(),RP.pin&&RP.pin.join(":"),rpIsOpen(),S&&[S.i,S.shown,S.answered,S.finished].join(","),D&&[D.phase,D.trial].join(","),RP.chap].join("|");}
function rpRender(force){const el=$("#refpane");if(!el)return;rpApply();if(!wide()){if(el.innerHTML)el.innerHTML="";RP.sig="";return;}
  if(RP.pin&&RP.from!==rpRouteKey()){RP.pin=null;RP.peek=false;rpApply();}
  const sig=rpSig();if(force===false&&sig===RP.sig)return;RP.sig=sig;
  const grip=`<div class="rp-grip" role="separator" aria-orientation="vertical" aria-label="Resize the reference pane" tabindex="0" aria-valuemin="${RP_MIN}" aria-valuemax="${rpMaxW()}" aria-valuenow="${Math.round(el.getBoundingClientRect().width)||360}" title="Drag to resize · double-click to reset"></div>`;
  if(!rpIsOpen()){el.innerHTML=`<button class="rp-spine" data-rp-open aria-expanded="false" aria-controls="refpane" title="Show the reference pane (R)">${ic("signs")}<span>Reference</span></button>`;return;}
  const keep=el.scrollTop;let title,body,pinned=false;
  if(RP.pin){const b=RP.pin[0]==="sign"?rpSign(RP.pin[1]):rpTech(RP.pin[1]);if(b){pinned=true;title=RP.pin[0]==="sign"?"Sign, beside your work":"Technique, beside your work";body=b;}else RP.pin=null;}
  if(!pinned)[title,body]=rpContext();
  el.innerHTML=`${grip}<div class="rp-h"><span class="eyebrow">${esc(title)}</span><span class="spacer"></span>${pinned?`<button class="iconbtn" data-rp-close aria-label="Unpin and go back to the context">${ic("back")}</button>`:""}<button class="iconbtn" data-rp-hide aria-expanded="true" aria-controls="refpane" aria-label="Hide the reference pane" title="Hide (R)">${ic("chev")}</button></div>
   ${pinned?`<p class="tiny muted rp-from">Pinned from ${esc(rpFromTitle())}. It closes when you move on.</p>`:""}${body}${pinned?"":rpHint()}`;
  if(force===false)el.scrollTop=keep;if(!pinned&&cur().v==="hall")rpSpy();}
function rpFromTitle(){const t=$("#toptitle");return (t&&(t.dataset.orig||t.textContent)||"this page").trim();}
function rpPin(kind,id){RP.pin=[kind,id];RP.from=rpRouteKey();if(!rpIsOpen())RP.peek=true;
  RP.recent=[[kind,id]].concat(RP.recent.filter(x=>!(x[0]===kind&&x[1]===id))).slice(0,6);rpSave();rpRender(true);
  const el=$("#refpane");if(el)el.scrollTop=0;const n=kind==="sign"?SIGNS[id]&&SIGNS[id].name:(TECH.find(t=>t.id===id)||{}).name;rpSay(`Opened ${n||"the reference"} in the reference pane`);SND.fx("page");}
/* the hall outline follows your scroll */
function rpSpy(){if(cur().v!=="hall"||!wide()||!rpIsOpen()||RP.pin)return;const chs=$$("#view details.chap");if(!chs.length)return;let at=0;const lim=innerHeight*.38;
  chs.forEach((d,i)=>{if(d.getBoundingClientRect().top<lim)at=i;});if(at===RP.chap)return;RP.chap=at;
  $$("#refpane .rp-chap").forEach((b,i)=>{b.classList.toggle("on",i===at);if(i===at)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current");});}
{let t=0;addEventListener("scroll",()=>{if(t)return;t=requestAnimationFrame(()=>{t=0;rpSpy();});},{passive:true});}
document.addEventListener("click",e=>{
  const pane=e.target.closest("#refpane");
  if(e.target.closest("[data-rp-close]")){RP.pin=null;RP.peek=false;rpRender(true);rpSay("Reference unpinned");return;}
  if(e.target.closest("[data-rp-hide]")){rpToggle(false);return;}
  if(e.target.closest("[data-rp-open]")){rpToggle(true);setTimeout(()=>$("#refpane [data-rp-hide]")?.focus({preventScroll:true}),0);return;}
  const rs=e.target.closest("[data-rp-sign]");if(rs){e.preventDefault();rpPin("sign",rs.dataset.rpSign);if(pane)$("#refpane [data-rp-close]")?.focus({preventScroll:true});return;}
  const rt=e.target.closest("[data-rp-tech]");if(rt){e.preventDefault();rpPin("tech",rt.dataset.rpTech);if(pane)$("#refpane [data-rp-close]")?.focus({preventScroll:true});return;}
  const ch=e.target.closest("[data-rp-chap]");if(ch){const d=$$("#view details.chap")[+ch.dataset.rpChap];if(d){d.open=true;RP.chap=+ch.dataset.rpChap;d.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});$("summary",d)?.focus({preventScroll:true});rpSpy();}return;}
  if(e.target.closest("[data-rp-full]")){RP.pin=null;RP.peek=false;setTimeout(()=>rpRender(true),0);return;}
  if(!wide())return;const g=e.target.closest("[data-go]");if(!g||pane||g.closest(".pal-back,.helpov,.sheet-wrap"))return;
  const p=g.dataset.go.split("/"),r=cur();
  const inStudy=NAV.tab==="practice"||(NAV.tab==="learn"&&r.v!=="hall"&&r.v!=="home"&&r.v!=="codex")||(NAV.tab==="today"&&r.v!=="home");
  if(!inStudy)return;
  if(p[0]==="signs"&&p[1]==="sign"&&SIGNS[p[2]]){e.preventDefault();e.stopImmediatePropagation();rpPin("sign",p[2]);}
  /* a link back to the technique you are already practising still navigates */
  else if(p[0]==="learn"&&p[1]==="tech"&&p[2]&&typeof TECH!=="undefined"&&TECH.find(t=>t.id===p[2])&&r.a!==p[2]&&r.v!=="tech"){e.preventDefault();e.stopImmediatePropagation();rpPin("tech",p[2]);}
},true);
/* resizing: drag the left edge, or focus it and use the arrow keys; double-click resets */
{let drag=null;
  document.addEventListener("pointerdown",e=>{const g=e.target.closest&&e.target.closest(".rp-grip");if(!g||!e.isTrusted)return;e.preventDefault();drag={x:e.clientX,w:$("#refpane").getBoundingClientRect().width};g.setPointerCapture&&g.setPointerCapture(e.pointerId);document.documentElement.classList.add("rp-drag");});
  document.addEventListener("pointermove",e=>{if(!drag)return;RP.w=Math.round(clamp(drag.w+(drag.x-e.clientX),RP_MIN,rpMaxW()));rpApply();});
  const end=()=>{if(!drag)return;drag=null;document.documentElement.classList.remove("rp-drag");rpSave();const g=$("#refpane .rp-grip");if(g)g.setAttribute("aria-valuenow",RP.w||360);};
  document.addEventListener("pointerup",end);document.addEventListener("pointercancel",end);
  document.addEventListener("dblclick",e=>{if(e.target.closest&&e.target.closest(".rp-grip")){RP.w=null;rpSave();rpApply();}});
  document.addEventListener("keydown",e=>{const g=e.target.closest&&e.target.closest(".rp-grip");if(!g)return;const w=$("#refpane").getBoundingClientRect().width;
    const d=e.key==="ArrowLeft"?24:e.key==="ArrowRight"?-24:0;if(e.key==="Home"||e.key==="End"){RP.w=e.key==="Home"?rpMaxW():RP_MIN;}else if(d)RP.w=Math.round(clamp(w+d,RP_MIN,rpMaxW()));else return;
    e.preventDefault();e.stopPropagation();rpApply();rpSave();g.setAttribute("aria-valuenow",RP.w);},true);}
/* the pane follows the session, the drill and the outline without a full re-render of the page */
{let t=null;const v=$("#view");if(v)new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>rpRender(false),140);}).observe(v,{childList:true,subtree:true});}
matchMedia("(min-width:1100px)").addEventListener("change",()=>rpRender(true));
{let t=null;addEventListener("resize",()=>{clearTimeout(t);t=setTimeout(rpApply,120);});}
/* the sticky pane sits under the real top bar, whatever its height */
{const top=$("header.top");const set=()=>{if(top)document.documentElement.style.setProperty("--rp-top",Math.round(top.getBoundingClientRect().height)+"px");};set();if(top&&typeof ResizeObserver!=="undefined")new ResizeObserver(set).observe(top);}
