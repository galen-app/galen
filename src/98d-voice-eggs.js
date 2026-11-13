"use strict";
/* Galen theatre: Galen's voice at runtime (quips, context-aware lines, milestones), the right/wrong feedback
   (an explicit "galen:answer" event, with a careful fallback observer), and the easter eggs (marginalia).
   Data lives in 03c-voice.js. Styles live in 02d-D19-eggs.css. */

/* ---------- small helpers ---------- */
function _gfx(k){try{if(typeof SND!=="undefined"&&SND.fx)SND.fx(k);}catch(e){}}
function _routeSig(){try{const r=cur();return [NAV.tab,r.v,r.a||"",r.b||""].join(":");}catch(e){return "";}}
function _routeKey(){try{return NAV.tab+":"+cur().v;}catch(e){return "";}}
function _curHall(){return document.documentElement.dataset.hall||"";}
function afterNightNow(){try{if(typeof Hub==="undefined"||!Hub.todayFromPlan)return false;const pl=typeof Hub.cachedPlan==="function"?Hub.cachedPlan():undefined;const p=Hub.todayFromPlan(pl);return !!(p&&p.afterNight);}catch(e){return false;}}
function _lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function _lsSet(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}}

/* ---------- what Galen says, in context ----------
   galenSay("home") for the theatre home, galenSay(<hall id>) for a hall, galenSay("idle", routeKey) elsewhere.
   Returns a line [latin|null, english, short?]. Safe to call at any time; never throws. */
function galenSay(ctx,key){
  try{const seed=daySeed();
    if(ctx==="home"){
      if(typeof TP!=="undefined"&&!TP.seen)return GALEN.first[0];
      const bd=BIRTHDAYS[fmtDate(Date.now()).slice(0,5)];if(bd)return [null,bd[1]];
      if(afterNightNow())return galenPick(GALEN.afterNight,seed);
      const last=(Store.s&&Store.s.last)||0,gap=last?Date.now()-last:0;
      if(gap>30*DAY_MS)return galenPick(GALEN.backLong,seed);
      if(gap>4*DAY_MS)return galenPick(GALEN.back,seed);
      const st=typeof streak==="function"?streak():0;
      if(st>=7&&seed%3===0)return [null,`${st} days running. Do not break it for want of ten minutes.`];
      return galenPick(GALEN[timeSlot()].concat(GALEN.idle,GALEN.concede),seed+new Date().getHours());}
    if(GALEN.halls[ctx])return galenPick([GALEN.hall[ctx]].concat(GALEN.halls[ctx]),seed);
    const k=key||_routeKey();let h=0;for(const c of k)h=(h*31+c.charCodeAt(0))|0;
    return galenPick(GALEN.idle.concat(GALEN.concede),seed+h);
  }catch(e){return galenPick(GALEN.idle);}
}

/* ---------- quips ----------
   The page title is never overwritten. On a wide top bar the short line sits beside the title's slot for a moment;
   on a phone, or when it will not fit, a ribbon hangs under the top bar. The full line also goes to the reference
   pane and to a polite live region. Navigating away ends the quip at once. */
let _qT=null,_qSig="";
function _live(text){let el=$("#galen-live");if(!el){el=document.createElement("div");el.id="galen-live";el.className="galen-sr";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.append(el);}
  el.textContent="";setTimeout(()=>{el.textContent="Galen: "+text;},30);}
function quipEnd(){clearTimeout(_qT);_qT=null;$$(".quip-bar,.quip-ribbon").forEach(x=>x.remove());$$(".top-title.quipping").forEach(x=>x.classList.remove("quipping"));}
function quip(kind,opt={}){
  const line=Array.isArray(kind)?kind:galenPick(GALEN[kind]);if(!line||!line[1])return;
  const [la,en,sh]=line,short=sh||en;
  const rp=$("#rp-quip");if(rp)rp.textContent=(la?la+" ":"")+en;
  _live(en);quipEnd();_qSig=_routeSig();
  const tt=$("#toptitle"),host=tt&&tt.parentElement,top=$(".top");
  let shown=false;
  if(!opt.long&&host&&innerWidth>=600){
    const b=document.createElement("span");b.className="quip-bar";b.setAttribute("aria-hidden","true");b.textContent=short;
    host.classList.add("quipping");tt.after(b);
    if(b.scrollWidth>b.clientWidth+1){b.remove();host.classList.remove("quipping");}else shown=true;}
  if(!shown&&top){
    const r=document.createElement("div");r.className="quip-ribbon"+(opt.ms?" ms":"");r.setAttribute("aria-hidden","true");
    const txt=opt.long||en.length<=96?en:short;
    r.innerHTML=`${opt.ms?`<span class="qr-k">${esc(opt.ms)}</span>`:""}${la?`<span class="latin">${esc(la)}</span> `:""}<span>${esc(txt)}</span>`;
    top.append(r);}
  const dur=opt.ms?6500:Math.min(5600,Math.max(2600,(opt.long?en:short).length*60));
  _qT=setTimeout(quipEnd,dur);
}

/* ---------- right and wrong ----------
   Preferred: the screen that knows the answer calls galenAnswer(right) (or dispatches the same event itself).
   Fallback: a MutationObserver that reads the verdict line, or the option the user just picked, and stays silent
   whenever the picture is ambiguous. It never treats "the first coloured option on screen" as the answer. */
const ANS={streak:0,miss:0,t:0,ev:0};
function galenAnswer(right,detail){try{document.dispatchEvent(new CustomEvent("galen:answer",{detail:Object.assign({},detail||{},{right:!!right})}));}catch(e){}}
document.addEventListener("galen:answer",e=>{ANS.ev=Date.now();const d=e.detail||{};_onAnswer(!!d.right,d);});
function _onAnswer(right,d){
  const now=Date.now();if(now-ANS.t<300)return;
  if(now-ANS.t>10*60*1000){ANS.streak=0;ANS.miss=0;}
  ANS.t=now;const ps=ANS.streak,pm=ANS.miss;
  if(right){ANS.streak++;ANS.miss=0;}else{ANS.miss++;ANS.streak=0;}
  if(!d.silent)_gfx(right?"right":"wrong");
  const night=afterNightNow();let k=null;
  if(right){const s=ANS.streak;
    if(s>=10&&s%10===0){k="streak10";setTimeout(()=>findEgg("gladiators",true),900);}
    else if(s===5)k="streak5";else if(s===3)k="streak3";
    else if(pm>=2)k="comeback";else if(night&&Math.random()<.5)k="rightNight";else if(Math.random()<.35)k="right";}
  else{k=ps>=3?"broke":ANS.miss===3?"slump":night?"wrongNight":"wrong";}
  if(k&&!d.noQuip)quip(k);
  setTimeout(checkMilestones,1500);
}
/* the option the user just activated (pointer, keyboard Enter/Space, or the pad's click()) */
let _pick={el:null,t:0};
document.addEventListener("click",e=>{const o=e.target.closest&&e.target.closest(".opt,button");if(o)_pick={el:o,t:Date.now()};},true);
{const V=$("#view");if(V)new MutationObserver(ms=>{
  if(Date.now()-ANS.ev<2000)return;                     /* the explicit event is in use: trust it */
  const R=new Set(),W=new Set();let verdict=null;
  const isR=el=>el.classList.contains("right")||(el.classList.contains("ok")&&el.classList.contains("opt"));
  const isW=el=>el.classList.contains("wrong")||(el.classList.contains("bad")&&el.classList.contains("opt"));
  for(const m of ms){
    if(m.type==="attributes"){const el=m.target;if(!(el instanceof Element))continue;const was=" "+(m.oldValue||"")+" ";
      if(isR(el)&&!/ (right|ok) /.test(was))R.add(el);if(isW(el)&&!/ (wrong|bad) /.test(was))W.add(el);}
    else for(const n of m.addedNodes){if(!(n instanceof Element))continue;
      const vl=n.matches(".verdict-line")?n:n.querySelector(".verdict-line");if(vl){if(vl.classList.contains("ok"))verdict=true;else if(vl.classList.contains("no"))verdict=false;}
      [n,...n.querySelectorAll(".opt")].forEach(o=>{if(!o.classList.contains("opt"))return;if(isR(o))R.add(o);if(isW(o))W.add(o);});}
  }
  if(!R.size&&!W.size&&verdict===null)return;
  let res=null;const pk=_pick.el&&Date.now()-_pick.t<1500?_pick.el:null;
  if(verdict!==null)res=verdict;
  else if(pk&&(R.has(pk)||W.has(pk)))res=R.has(pk);
  else if(W.size===1&&R.size<=1)res=false;               /* the usual pattern: your pick marked wrong, the answer marked right */
  else if(R.size===1&&!W.size)res=true;
  if(res===null)return;                                  /* ambiguous: say nothing rather than the wrong thing */
  _onAnswer(res,{src:"observer"});
}).observe(V,{subtree:true,childList:true,attributes:true,attributeFilter:["class"],attributeOldValue:true});}

/* ---------- milestones (kept in Store.s.notes["ms:<id>"], merged per record) ---------- */
function _msCount(kind){const S=Store.s.srs||{};
  if(kind==="cards")return Object.keys(S).length;
  if(kind==="held"){let n=0;for(const k in S){const r=S[k];if(r&&r.iv>=7)n++;}return n;}
  if(kind==="days")return typeof streak==="function"?streak():0;return 0;}
function checkMilestones(){try{if(!Store.s||!Store.s.notes)return;const N=Store.s.notes,init=!N["ms:init"];let show=null,dirty=init;
  for(const [id,kind,th,line] of GALEN_MS){if(N["ms:"+id])continue;if(_msCount(kind)>=th){N["ms:"+id]={t:Date.now(),v:1};dirty=true;if(!init)show=line;}}
  if(init)N["ms:init"]={t:Date.now(),v:1};
  if(dirty)Store.save();
  if(show){_gfx("bell");setTimeout(()=>quip(show,{long:true,ms:"A milestone"}),400);}
}catch(e){}}

/* ================= EGGS ================= */
function eggFound(id){return !!(Store.s&&Store.s.notes&&Store.s.notes["egg:"+id]);}
function eggCount(){return EGGS.filter(x=>eggFound(x.id)).length;}
function findEgg(id,quiet){const e=EGGS.find(x=>x.id===id);if(!e)return false;
  if(id==="night"&&new Date().getHours()>=5)return false;   /* the small hours only */
  const first=!eggFound(id);
  if(first){Store.s.notes["egg:"+id]={t:Date.now(),v:1};Store.save();_gfx("bell");}
  if(quiet==="note")eggNote(e,first);
  else if(quiet){if(first)toast(`Written in the margin: ${e.t} · find it in the codex`);}
  else showEgg(e,first);
  if(first){setTimeout(decorateTheatre,50);if(id!=="finis")setTimeout(_checkFinis,quiet?2800:300);}
  return first;}
function _checkFinis(){if(eggFound("finis")||$(".egg-ov"))return;if(EGGS.every(x=>x.id==="finis"||eggFound(x.id)))findEgg("finis");}

/* an accessible dialog: aria-modal, focus kept inside, Escape anywhere, focus returned to where it was */
function showEgg(e,first){if(!e)return;$(".egg-ov")?.remove();
  const opener=document.activeElement,n=eggCount(),hid="egg-h-"+e.id;
  const el=document.createElement("div");el.className="helpov egg-ov";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-labelledby",hid);
  const lore=e.lore&&typeof loreById==="function"&&loreById(e.lore);
  const candle=e.id==="konami"?`<button class="btn sm soft" data-candles>${candlesOn()?"Snuff the candles":"Light the candles"}</button>`:"";
  el.innerHTML=`<div class="card stack egg-card" style="gap:12px">${guideHTML([null,e.t])}
    <h2 class="galen-sr" id="${hid}">${esc(e.t)}</h2>
    <p class="lore-body egg-x" style="margin:0">${esc(e.x)}</p>
    ${lore||candle?`<div class="row-x" style="gap:8px;flex-wrap:wrap">${lore?`<button class="btn sm soft" data-egg-lore="${e.lore}">${ic("scroll")}Read the story</button>`:""}${candle}</div>`:""}
    <div class="row-x"><span class="marg">${first?"A secret, written in the margin.":"Found before."} ${n} of ${EGGS.length} marginalia.</span><span class="spacer"></span><button class="btn sm" data-x>Close</button></div></div>`;
  document.body.append(el);
  const foc=()=>$$('button,[href],[tabindex="0"]',el).filter(x=>!x.disabled&&x.offsetParent!==null);
  const close=()=>{el.remove();};
  el.addEventListener("click",ev=>{
    if(ev.target===el||ev.target.closest("[data-x]")){close();return;}
    const lb=ev.target.closest("[data-egg-lore]");if(lb){close();if(typeof closePalette==="function")closePalette();open("learn","lore",lb.dataset.eggLore);return;}
    const cb=ev.target.closest("[data-candles]");if(cb){setCandles(!candlesOn());cb.textContent=candlesOn()?"Snuff the candles":"Light the candles";}});
  const onKey=ev=>{if(!el.isConnected)return;
    if(ev.key==="Escape"){ev.preventDefault();ev.stopImmediatePropagation();close();return;}
    if(ev.key==="Tab"){const f=foc();if(!f.length)return;const i=f.indexOf(document.activeElement);
      if(ev.shiftKey&&(i<=0)){ev.preventDefault();f[f.length-1].focus();}else if(!ev.shiftKey&&(i===-1||i===f.length-1)){ev.preventDefault();f[0].focus();}}};
  const onFocus=ev=>{if(el.isConnected&&!el.contains(ev.target)){const f=foc();(f.find(x=>x.matches("[data-x]"))||f[0])?.focus();}};
  document.addEventListener("keydown",onKey,true);document.addEventListener("focusin",onFocus,true);
  const mo=new MutationObserver(()=>{if(el.isConnected)return;mo.disconnect();document.removeEventListener("keydown",onKey,true);document.removeEventListener("focusin",onFocus,true);
    if(opener&&opener.isConnected&&opener.focus)try{opener.focus({preventScroll:true});}catch(err){}
    setTimeout(_checkFinis,400);});
  mo.observe(document.body,{childList:true});
  setTimeout(()=>$("[data-x]",el)?.focus(),20);}

/* a gentle, non-modal note (used by the search eggs): never takes focus, fades by itself */
let _noteT=null;
function eggNote(e,first){const host=$(".pal")||document.body;let n=$(".egg-note");if(n&&n.parentElement!==host){n.remove();n=null;}
  if(!n){n=document.createElement("div");n.className="egg-note"+(host===document.body?" float":"");n.setAttribute("role","status");host.append(n);}
  n.innerHTML=`<span class="en-mark" aria-hidden="true">❦</span><span class="en-t"><b>${first?"A note in the margin":"In the margin, again"}</b><span>${esc(e.t)}</span></span><button class="link small" type="button" data-egg-read="${e.id}">Read it</button>`;
  clearTimeout(_noteT);_noteT=setTimeout(()=>n.remove(),9000);}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-egg-read]");if(!b)return;ev.preventDefault();ev.stopPropagation();
  const e=EGGS.find(x=>x.id===b.dataset.eggRead);b.closest(".egg-note")?.remove();if(typeof closePalette==="function")closePalette();showEgg(e,false);},true);

/* ---------- the medallion: pokes, and a hold (the keyboard and pad twin of holding the serpent) ---------- */
let _mdN=0,_mdT=0;const HOLD={t:null,fired:0,up:0,x:0,y:0};
const _holdSel="[data-egg-medal],.brandmark,.railbrand";
function _holdFire(){HOLD.fired=1;HOLD.up=0;findEgg("oath");}
document.addEventListener("click",e=>{
  if(HOLD.fired&&e.target.closest&&e.target.closest(_holdSel)&&(!HOLD.up||Date.now()-HOLD.up<700)){e.preventDefault();e.stopImmediatePropagation();HOLD.fired=0;return;}
  const m=e.target.closest&&e.target.closest("[data-egg-medal]");
  if(m){if(_keyRep&&Date.now()-_keyRep<120)return;if(Date.now()-_mdT>1500)_mdN=0;_mdT=Date.now();_mdN++;
    if(_mdN===3)quip(galenPick(GALEN.idle.concat(GALEN.concede)),{long:true});
    if(_mdN>=5){_mdN=0;findEgg(_curHall()==="neck"?"pig":"apes");}return;}
  const g=e.target.closest&&e.target.closest("[data-egg]");if(g){e.preventDefault();e.stopPropagation();findEgg(g.dataset.egg);}},true);
document.addEventListener("pointerdown",e=>{HOLD.fired=0;clearTimeout(HOLD.t);if(e.target.closest&&e.target.closest(_holdSel)){HOLD.x=e.clientX;HOLD.y=e.clientY;HOLD.t=setTimeout(_holdFire,1600);}});
document.addEventListener("pointermove",e=>{if(HOLD.t&&Math.hypot(e.clientX-HOLD.x,e.clientY-HOLD.y)>12){clearTimeout(HOLD.t);HOLD.t=null;}},{passive:true});
["pointerup","pointercancel"].forEach(ev=>document.addEventListener(ev,()=>{clearTimeout(HOLD.t);HOLD.t=null;if(HOLD.fired)HOLD.up=Date.now();}));
document.addEventListener("pointerleave",()=>{clearTimeout(HOLD.t);HOLD.t=null;});
/* keyboard: hold Enter or Space on the medallion for 1.6 s */
let _keyRep=0,_kh=null;
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const m=e.target.closest&&e.target.closest("[data-egg-medal]");if(!m)return;
  if(!e.repeat){_kh={t:Date.now(),done:false};return;}
  e.preventDefault();_keyRep=Date.now();if(_kh&&!_kh.done&&Date.now()-_kh.t>=1500){_kh.done=true;HOLD.fired=1;HOLD.up=Date.now()+60000;findEgg("oath");}},true);
document.addEventListener("keyup",e=>{if(_kh&&_kh.done&&(e.key==="Enter"||e.key===" ")){e.preventDefault();HOLD.up=Date.now();}_kh=null;},true);
/* pad (or any other input) can send a hold explicitly */
document.addEventListener("galen:hold",e=>{if(e.target&&e.target.closest&&e.target.closest(_holdSel))_holdFire();});

/* ---------- words in the search box: whole phrases only, never mid-word, never stealing focus ---------- */
const EGG_WORDS={
 rete:["rete mirabile","the rete mirabile","wonderful net","the wonderful net"],
 humours:["humours","humors","the humours","four humours","four humors","the four humours","the four","black bile"],
 vesalius:["vesalius","andreas vesalius"],
 galen:["galen","galenus","galen of pergamon"],
 paper:["paper","rolled paper","quire","a quire","quire of paper","a quire of paper","laennecs paper","laennec paper"],
 claudius:["claudius","claudius galenus","claudius galen"],
 nafis:["ibn al nafis","ibn alnafis","ibn nafis","al nafis","alnafis"]
};
const _eggPhrase={};for(const id in EGG_WORDS)EGG_WORDS[id].forEach(p=>_eggPhrase[p]=id);
function eggNorm(v){return String(v||"").toLowerCase().replace(/[’'`ʼ]/g,"").replace(/[-_.,;:!?"()]+/g," ").replace(/\s+/g," ").trim();}
let _sqT=null,_sqLast="";
function _searchEgg(v,how){const q=eggNorm(v);if(!q||q===_sqLast)return;const id=_eggPhrase[q];if(!id)return;_sqLast=q;findEgg(id,how);}
document.addEventListener("input",e=>{if(e.target.id!=="palq")return;clearTimeout(_sqT);const v=e.target.value;if(!eggNorm(v))_sqLast="";_sqT=setTimeout(()=>_searchEgg(v,"note"),700);});
document.addEventListener("keydown",e=>{if(e.target.id==="palq"&&e.key==="Enter"){clearTimeout(_sqT);_searchEgg(e.target.value,true);}},true);

/* ---------- the old code, and the candlelit theatre ---------- */
function candlesOn(){return document.documentElement.classList.contains("candles");}
function setCandles(on){const h=document.documentElement;h.classList.toggle("candles",!!on);_lsSet("galen.candles",on?"1":null);
  if(on&&!$(".candlelight")){const c=document.createElement("div");c.className="candlelight";c.setAttribute("aria-hidden","true");c.innerHTML="<i></i><i></i><i></i>";document.body.append(c);}
  decorateTheatre();}
function _konami(){const first=!eggFound("konami");_gfx("seal");
  if(first){setCandles(true);findEgg("konami");}
  else{setCandles(!candlesOn());toast(candlesOn()?"The candles are lit.":"The candles are snuffed.");}}
{const K=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let i=0;
  /* returns true when the key belongs to the code's B A ending, so the pad can swallow it (no Back, no click) */
  window.galenCode=k=>{const was=i;if(k===K[i])i++;else i=k===K[0]?(was===2?2:1):0;
    if(i===K.length){i=0;_konami();return true;}return was>=8&&i>=9;};
  document.addEventListener("keydown",e=>{if(!e.isTrusted||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;galenCode(e.key.length===1?e.key.toLowerCase():e.key);});}

/* ---------- the engraving: bigger hit areas, focusable eggs, and traces of what you have found ---------- */
const _SVGNS="http://www.w3.org/2000/svg";
const APE_HEAD=[10,0];
const EGG_LABEL={skull:"A skull at the end of the table",ape:"A small figure in the corner of the engraving"};
function _laurel(cx,cy,r){let s="";for(const side of [-1,1])for(let k=0;k<5;k++){const a=(side<0?Math.PI:0)+side*(-0.95+k*0.42),x=cx+r*Math.cos(a),y=cy+r*Math.sin(a)+1,rot=a*180/Math.PI+side*28;
  s+=`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx=".9" ry="2.1" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;}return s;}
function decorateTheatre(){const svg=$("svg.th");if(!svg||!svg.isConnected)return;
  try{
  $$("g.egg[data-egg]",svg).forEach(g=>{const id=g.dataset.egg;
    let b0=null;if(g.dataset.bb)b0=g.dataset.bb.split(",").map(Number);
    else{try{const bb=g.getBBox();if(bb.width||bb.height){b0=[bb.x,bb.y,bb.width,bb.height];g.dataset.bb=b0.map(v=>v.toFixed(2)).join(",");}}catch(e){}}
    if(!$(".egg-hit",g)){const b=b0&&{x:b0[0],y:b0[1],width:b0[2],height:b0[3]};
      if(b&&(b.width||b.height)){let sc=1;try{const m=g.transform.baseVal.consolidate();if(m)sc=Math.abs(m.matrix.a)||1;}catch(e){}
        const W=(id==="skull"?44:52)/sc,H=(id==="skull"?40:52)/sc,cx=b.x+b.width/2;
        let y=b.y+b.height/2-H/2;if(id==="skull")y=b.y+b.height+1-H;   /* grow upward only: the Table's door sits just below */
        const r=document.createElementNS(_SVGNS,"rect");r.setAttribute("class","egg-hit");r.setAttribute("x",(cx-W/2).toFixed(1));r.setAttribute("y",y.toFixed(1));
        r.setAttribute("width",W.toFixed(1));r.setAttribute("height",H.toFixed(1));r.setAttribute("rx",(6/sc).toFixed(1));g.prepend(r);}}
    g.setAttribute("tabindex","0");if(EGG_LABEL[id])g.setAttribute("aria-label",EGG_LABEL[id]);
    g.classList.toggle("found",eggFound(id));
    if(eggFound(id)&&b0&&!$(".egg-laurel",g)){const b={x:b0[0],y:b0[1],width:b0[2],height:b0[3]};
      {const lg=document.createElementNS(_SVGNS,"g");lg.setAttribute("class","egg-laurel");
        const cx=id==="ape"?APE_HEAD[0]:b.x+b.width/2,cy=id==="ape"?APE_HEAD[1]:b.y+b.height*0.62,rr=id==="ape"?6.4:7.5;
        lg.innerHTML=_laurel(cx,cy,rr);g.append(lg);}}
  });
  let tr=$("g.egg-traces",svg);if(!tr){tr=document.createElementNS(_SVGNS,"g");tr.setAttribute("class","egg-traces");tr.setAttribute("aria-hidden","true");svg.append(tr);}
  const vb=(svg.viewBox&&svg.viewBox.baseVal)||{width:420,height:356};const W=vb.width||420,H=vb.height||356,mid=W/2;
  let s="";const N=EGGS.length,gap=9,x0=mid-(N-1)*gap/2,y=H-5;
  EGGS.forEach((e,k)=>{const x=x0+k*gap;s+=eggFound(e.id)?`<path class="tr-on" d="M${x.toFixed(1)} ${y-3.4}l2.3 3.4-2.3 3.4-2.3-3.4z"/>`:`<circle class="tr-off" cx="${x.toFixed(1)}" cy="${y}" r=".9"/>`;});
  if(eggFound("konami")){const cx=W/2,cy=176,rx=172,ry=103.2;[-75,-45,-15,15,45,75,105,135,165,195,225,255].forEach(d=>{const a=d*Math.PI/180,x=cx+rx*Math.cos(a),yy=cy+ry*Math.sin(a)-3;
    s+=`<g class="egg-candle"><rect x="${(x-1.2).toFixed(1)}" y="${(yy-6).toFixed(1)}" width="2.4" height="6"/><path class="fl flame" d="M${x.toFixed(1)} ${(yy-12).toFixed(1)}c-1.6 2.2-1.6 3.9 0 5.2 1.6-1.3 1.6-3 0-5.2z"/><circle class="fl halo" cx="${x.toFixed(1)}" cy="${(yy-9).toFixed(1)}" r="6"/></g>`;});}
  if(eggFound("finis"))s+=`<path class="tr-star" d="M${mid} 120l2 4.6 5 .5-3.8 3.3 1.2 4.9-4.4-2.6-4.4 2.6 1.2-4.9-3.8-3.3 5-.5z"/>`;
  tr.innerHTML=s;
  }catch(e){console.warn("eggs",e);}
}

/* ---------- after every render: end a stale quip, decorate the theatre, date eggs, milestones ---------- */
let _boot=false;
{const _ch=chrome;chrome=function(){const r=_ch.apply(this,arguments);try{_afterChrome();}catch(e){console.warn(e);}return r;};}
function _afterChrome(){
  if(!_boot){_boot=true;if(_lsGet("galen.candles")==="1"&&eggFound("konami"))setCandles(true);}
  if(_qT&&_routeSig()!==_qSig)quipEnd();
  if(_routeKey()==="today:home"){
    requestAnimationFrame(decorateTheatre);
    const d=fmtDate(Date.now()).slice(0,5),h=new Date().getHours();
    if(h<5)setTimeout(()=>findEgg("night",true),2500);
    if(d==="20/05")setTimeout(()=>findEgg("lind",true),1800);
    if(d==="17/11")setTimeout(()=>findEgg("birthday",true),1500);
  }
  clearTimeout(_afterChrome.t);_afterChrome.t=setTimeout(checkMilestones,1200);
}
