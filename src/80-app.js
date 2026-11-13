"use strict";
/* ================= APP SHELL & ROUTER ================= */
const V=$("#view");
const SYS_NAME={gen:"General & vitals",cvs:"Cardiovascular",resp:"Respiratory",abd:"Abdominal",neuro:"Neurological",msk:"Musculoskeletal",hn:"Head, neck & endocrine",derm:"Dermatology"};
const SYS_SHORT={gen:"General",cvs:"Heart",resp:"Lungs",abd:"Abdomen",neuro:"Neuro",msk:"MSK",hn:"Head & neck",derm:"Skin"};
const VERDICT_ORDER=["core","useful","low","archaic"];
const TABS=[["today","Today","today"],["learn","Learn","learn"],["signs","Signs","signs"],["practice","Practice","practice"],["tools","Tools","gear"],["sounds","Sounds","ear",true]];
const NAV_PARENT={sounds:"learn"};
const ROOTV={today:"home",learn:"home",signs:"library",sounds:"library",practice:"home",tools:"home"};
/* NAV.on is the stack you are on (the tab that stays highlighted). Each stack entry is {v,a,b} and may carry t,
   the tab whose route it shows: a hall opened from the theatre is {t:"learn",v:"hall",a:"heart"} on the today stack,
   so Back returns to the theatre. NAV.tab is the route's tab, so every "NAV.tab+':'+cur().v" key elsewhere stays right.
   Setting NAV.tab switches stacks (99-boot openHash relies on that). */
const NAV={on:"today",stacks:{},
  get tab(){const s=this.stacks[this.on]||[],r=s[s.length-1];return (r&&r.t)||this.on;},
  set tab(x){if(this.stacks[x])this.on=x;}};
TABS.forEach(([k])=>NAV.stacks[k]=[{v:ROOTV[k]}]);
const NAV_MAX=24;
const cur=()=>{const s=NAV.stacks[NAV.on];return s[s.length-1];};
/* the tab that is highlighted in the nav (sounds lives under Learn) */
const navTab=()=>NAV_PARENT[NAV.on]||NAV.on;

/* Players live only as long as the view that made them. */
const Players={list:[],mk(el,id,opt){const p=new Player(el,id,opt);this.list.push(p);return p;},reset(){stopAll();this.list.forEach(p=>p.destroy());this.list=[];}};
const mk=(el,id,opt)=>Players.mk(el,id,opt);

/* ---- navigation hooks: run on every real navigation (open, back, tab switch, browser Back), not on re-renders.
   onNav(fn) registers fn(info) where info={from:{tab,v,a,b},to:{tab,v,a,b},kind:"push"|"back"|"tab"|"replace"|"pop"}. ---- */
const NAV_HOOKS=[];
function onNav(fn){if(typeof fn==="function")NAV_HOOKS.push(fn);}
const navWhere=()=>{const r=cur();return {tab:NAV.tab,v:r.v,a:r.a,b:r.b};};
let _navFrom=null;
function navLeaving(){_navFrom=navWhere();const top=cur();if(top)top.scroll=window.scrollY;}
function navHooks(kind){const info={from:_navFrom,to:navWhere(),kind};_navFrom=null;
  NAV_HOOKS.forEach(f=>{try{f(info);}catch(e){console.error(e);}});}
/* toasts made before the navigation do not follow you; a toast raised by the action that navigated (under 0.6 s old) stays */
onNav(()=>{const t=$("#toast");if(t&&!t.hidden&&Date.now()-(window._toastAt||0)>600)t.hidden=true;});

/* ---- browser history: one entry per in-app navigation, so the Android back gesture steps back inside Galen ---- */
const HX={ok:true,i:0,log:[],booted:false,focus:false,popAt:0};
try{if("scrollRestoration" in history)history.scrollRestoration="manual";}catch(e){HX.ok=false;}
const hxPart=x=>String(x).replace(/[%#/?\s]/g,c=>encodeURIComponent(c));
function hashFor(t,r){
  if(t==="today"&&r.v===ROOTV.today&&!r.a)return "";
  if(r.v===ROOTV[t]&&!r.a&&!r.b)return "#"+t;
  const p=[t,r.v];if(r.a!=null||r.b!=null)p.push(r.a==null?"":r.a);if(r.b!=null)p.push(r.b);
  return "#"+p.map(hxPart).join("/");}
const navHash=()=>hashFor(NAV.tab,cur());
function navSnap(withScroll){const st={};
  Object.keys(NAV.stacks).forEach(k=>{st[k]=NAV.stacks[k].map(e=>{const o={v:e.v};if(e.a!=null)o.a=e.a;if(e.b!=null)o.b=e.b;if(e.t)o.t=e.t;if(withScroll&&e.scroll)o.y=Math.round(e.scroll);return o;});});
  return {on:NAV.on,st};}
const navSig=snap=>JSON.stringify(snap);
function navLoad(snap){if(!snap||!snap.st||!NAV.stacks[snap.on])return false;
  Object.keys(NAV.stacks).forEach(k=>{const s=snap.st[k];if(Array.isArray(s)&&s.length&&s.every(e=>e&&typeof e.v==="string"))NAV.stacks[k]=s.map(e=>{const o={v:e.v};if(e.a!=null)o.a=String(e.a);if(e.b!=null)o.b=String(e.b);if(e.t&&NAV.stacks[e.t])o.t=e.t;if(e.y)o.scroll=+e.y||0;return o;});});
  NAV.on=snap.on;return true;}
function hxWrite(mode){if(!HX.ok)return;
  try{const snap=navSnap(true),url=location.pathname+location.search+navHash();
    if(mode==="push"){HX.i++;HX.log.length=HX.i;}
    HX.log[HX.i]=navSig(navSnap(false));
    const st={g:1,i:HX.i,nav:snap};
    if(mode==="push")history.pushState(st,"",url);else history.replaceState(st,"",url);
  }catch(e){HX.ok=false;}}
/* store the scroll of the page we are leaving in its own history entry, so browser Back lands where you were */
function hxSaveScroll(){if(!HX.ok||!HX.booted)return;try{const s=history.state;if(s&&s.g)history.replaceState(Object.assign({},s,{nav:navSnap(true)}),"",location.href);}catch(e){}}

/* every in-app navigation goes through here */
function navCommit(kind,fresh){
  HX.focus=kind!=="replace";
  render(!!fresh,kind==="replace"&&!fresh);
  hxWrite(kind==="replace"?"replace":"push");
  navHooks(kind);
}
function open(tab,v,a,b){
  if(!NAV.stacks[tab])return;
  a=a===""||a==null?undefined:String(a);b=b===""||b==null?undefined:String(b);
  hxSaveScroll();navLeaving();
  if(!v){NAV.on=tab;NAV.stacks[tab].length=1;navCommit("tab",true);return;}
  const on=NAV.on,s=NAV.stacks[on],same=e=>(e.t||on)===tab&&e.v===v&&e.a===a&&e.b===b;
  if(tab===on&&v===ROOTV[tab]&&!a&&!b){if(s.length===1){navCommit("replace",true);return;}s.length=1;}
  else{const i=s.findIndex(same);
    if(i===s.length-1){navCommit("replace",true);return;}
    if(i>=0)s.length=i+1;                       /* already in this stack: go back to it instead of looping */
    else{const e={v,a,b};if(tab!==on)e.t=tab;s.push(e);if(s.length>NAV_MAX)s.splice(1,s.length-NAV_MAX);}}
  navCommit("push",true);
}
function replace(v,a,b){const s=NAV.stacks[NAV.on],t=s[s.length-1].t;const e={v,a:a==null?undefined:String(a),b:b==null?undefined:String(b)};if(t)e.t=t;s[s.length-1]=e;navLeaving();navCommit("replace");}
function back(){const s=NAV.stacks[NAV.on];if(s.length<2)return false;
  /* if the browser entry before this one is exactly the page Back would show, let the browser step back (popstate renders it) */
  const keep=s.pop(),want=navSig(navSnap(false));s.push(keep);
  if(HX.ok&&HX.i>0&&HX.log[HX.i-1]===want){try{history.back();return true;}catch(e){}}
  navLeaving();s.pop();HX.focus=true;render(false);hxWrite("replace");navHooks("back");return true;}
function switchTab(tab){if(!NAV.stacks[tab])return;
  hxSaveScroll();navLeaving();
  if(tab===NAV.on){if(NAV.stacks[tab].length===1&&window.scrollY<4){navCommit("replace");return;}NAV.stacks[tab].length=1;}
  NAV.on=tab;navCommit("tab",false);}
function goHome(){hxSaveScroll();navLeaving();NAV.on="today";NAV.stacks.today.length=1;navCommit("tab",true);}
/* a deep link such as #learn/lore/harvey or #signs/sign/jvp, pushed on top of the stack you are on */
function navFromHash(h){const parts=String(h||"").replace(/^#/,"").split("/").filter(Boolean).map(x=>{try{return decodeURIComponent(x);}catch(e){return x;}});
  if(!parts.length){NAV.on="today";NAV.stacks.today.length=1;return true;}
  if(!NAV.stacks[parts[0]]){const s=NAV.stacks[NAV.on];s.push({t:"today",v:"missing",a:parts.join("/")});return true;}
  if(parts.length===1){NAV.on=parts[0];NAV.stacks[parts[0]].length=1;return true;}
  const [t,v,a,b]=parts,s=NAV.stacks[NAV.on],e={v,a,b};if(t!==NAV.on)e.t=t;s.push(e);if(s.length>NAV_MAX)s.splice(1,s.length-NAV_MAX);return true;}
window.addEventListener("popstate",e=>{
  if(!HX.ok)return;HX.popAt=Date.now();navLeaving();closePalette(false);
  const st=e.state;
  if(st&&st.g&&navLoad(st.nav)){HX.i=+st.i||0;if(!HX.log[HX.i])HX.log[HX.i]=navSig(navSnap(false));HX.focus=true;render(false);navHooks("pop");return;}
  /* a hash typed or followed by hand: open it, then stamp this entry as ours */
  navFromHash(location.hash);HX.focus=true;render(true);hxWrite("replace");navHooks("push");
});
/* hash changes are ours to handle (popstate above already did); stop the boot-time hashchange handler from rebuilding the stack */
window.addEventListener("hashchange",e=>{if(HX.ok)e.stopImmediatePropagation();});
function navBoot(){
  /* a reload keeps the whole stack: restore it from this history entry when the hash still matches */
  try{const st=history.state;if(HX.ok&&st&&st.g&&st.nav){const want=location.hash||"";const snap=st.nav,on=snap.on,top=(snap.st[on]||[]).slice(-1)[0];
    if(top&&hashFor(top.t||on,top)===want)navLoad(snap);}}catch(e){}
}
function navBootStamp(){if(!HX.ok)return;
  try{const s=NAV.stacks[NAV.on];
    if(s.length>1){/* a deep link: put the stack's root underneath, so system Back goes to the root and not out of the app */
      const keep=s.splice(1);const snapRoot=navSnap(true),urlRoot=location.pathname+location.search+navHash();
      history.replaceState({g:1,i:0,nav:snapRoot},"",urlRoot);HX.log[0]=navSig(navSnap(false));
      NAV.stacks[NAV.on]=s.concat(keep);HX.i=0;hxWrite("push");}
    else{HX.i=0;hxWrite("replace");}
  }catch(e){HX.ok=false;}}

const ROUTES={};
const TITLES={};
function route(key,title,fn){ROUTES[key]=fn;TITLES[key]=title;}

/* the page title: computed from TITLES, never "undefined" and never a dangling colon */
function pageTitle(){const r=cur(),t=TITLES[NAV.tab+":"+r.v];let s;
  try{s=typeof t==="function"?t(r.a,r.b):t;}catch(e){s=null;}
  s=s==null?"":String(s);if(/undefined|\bnull\b|NaN|\[object/.test(s))s="";
  s=s.replace(/[\s:·,–-]+$/,"").trim();return s||(r.v==="missing"?"Not found":"Galen");}
/* setTitle(text): the app-bar title. A Galen quip that is showing (98d) will restore to this text, not to the old page's. */
function setTitle(text){const el=$("#toptitle");text=String(text==null?"":text)||"Galen";
  if(el){if(el.dataset.orig!=null)el.dataset.orig=text;else el.textContent=text;}
  try{document.title=text==="Galen"?"Galen":text+" · Galen";}catch(e){}}
let _announceT;
function announce(msg){let a=$("#announce");if(!a){a=document.createElement("div");a.id="announce";a.className="sr-only";a.setAttribute("aria-live","polite");a.setAttribute("aria-atomic","true");document.body.append(a);}
  a.textContent="";clearTimeout(_announceT);_announceT=setTimeout(()=>{a.textContent=msg;},60);}
/* after a navigation, focus the page heading so keyboard, pad and screen-reader users start at the new page */
function focusPage(){if(PAL)return;
  let h=V.querySelector("h1");
  if(h&&h.getBoundingClientRect().top>window.innerHeight*0.8)h=null;
  const el=h||V;if(!el.hasAttribute("tabindex"))el.setAttribute("tabindex","-1");
  try{el.focus({preventScroll:true});}catch(e){}
  announce(pageTitle());}

function notFoundHTML(what,slug){
  const q=String(slug||"").split(/[\/:_\-\s]+/).filter(w=>w.length>=3&&!/^(learn|today|signs|practice|tools|sounds|sign|hall|lore|tech|module|session)$/i.test(w)).pop()||"";
  return `<section class="ph"><span class="eyebrow">Not in the theatre</span><h1>That page is not here</h1><p class="lede">${esc(what||"The link may be mistyped, or the item may have moved.")}</p></section>
   <div class="card stack" style="gap:12px">${q?`<p class="small muted">Search for “${esc(q)}” instead?</p>`:""}<div class="row-x"><button class="btn" data-act="nf-search" data-q="${esc(q)}">${ic("search")}Search${q?" for “"+esc(q)+"”":""}</button><button class="btn soft" data-act="home">Back to the theatre</button>${NAV.stacks[NAV.on].length>1?`<button class="btn ghost" data-act="back">Back</button>`:""}</div></div>`;}
route("today:missing","Not found",(root,slug)=>{root.innerHTML=notFoundHTML("The link #"+(slug||"")+" does not lead anywhere in Galen.",slug);});

function render(fresh,keepScroll){
  const boot=!HX.booted;if(boot)navBoot();
  Players.reset();closePalette(false);
  const r=cur(),key=NAV.tab+":"+r.v,fn=ROUTES[key];
  const y=keepScroll?window.scrollY:fresh?0:(r.scroll||0);
  V.className="wrap enter";V.innerHTML="";if(typeof KEYS!=="undefined")KEYS.handler=null;
  try{if(!fn)throw Object.assign(new Error("Unknown view "+key),{nf:1});fn(V,r.a,r.b);}
  catch(e){const msg=String((e&&e.message)||e);const nf=(e&&e.nf)||/not found|no such|unknown/i.test(msg);
    if(!nf)console.error(e);
    try{if(typeof DIAG!=="undefined"&&DIAG.errors){DIAG.errors.push({t:Date.now(),m:"Page "+key+": "+msg});if(DIAG.errors.length>8)DIAG.errors.shift();}}catch(x){}
    let why=msg.replace(/^Unknown view .*/,"This page does not exist in this version of Galen.");if(!/[.!?]$/.test(why))why+=".";
    V.innerHTML=nf?notFoundHTML(why,r.a||r.v)
      :`<section class="ph"><span class="eyebrow">A page failed</span><h1>Something went wrong on this page</h1><p class="lede">Your progress is safe. The error has been noted under Tools, Backup and export.</p></section><div class="card stack"><p class="small muted mono">${esc(msg)}</p><div class="row-x"><button class="btn" data-act="home">Back to the theatre</button>${NAV.stacks[NAV.on].length>1?`<button class="btn ghost" data-act="back">Back</button>`:""}</div></div>`;}
  chrome();
  requestAnimationFrame(()=>window.scrollTo(0,y));
  setTimeout(()=>V.classList.remove("enter"),260);
  if(boot){HX.booted=true;navBootStamp();shims();}
  if(HX.focus){HX.focus=false;focusPage();}
}
function chrome(){
  setTitle(pageTitle());
  $("#backbtn").hidden=NAV.stacks[NAV.on].length<2;
  const hi=navTab();$$("#nav button[data-tab]").forEach(b=>{if(b.dataset.tab===hi)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});
  const due=dueCards().length,bd=$("#navbadge");if(bd){bd.textContent=due>99?"99+":due;bd.hidden=!due;bd.setAttribute("aria-label",due+" card"+(due===1?"":"s")+" due");}
}
function syncChip(){const el=$("#sync");if(!el)return;el.textContent=Store.status;el.className="sync"+(Store.status==="Synced"?" ok":Store.status==="Saving…"?" busy":"");}
/* compatibility for code written before stacks could hold other tabs' pages (applied once, at boot) */
function shims(){
  try{revertExtraNew();}catch(e){}
  /* 82-ref.js sound sub-tabs rebuilt NAV.stacks.sounds; on another stack that would change nothing on screen */
  try{if(typeof bindSoundTabs==="function"&&/NAV\.stacks\.sounds/.test(String(bindSoundTabs)))bindSoundTabs=function(root){$$(".tabs [data-st]",root).forEach(b=>b.addEventListener("click",()=>replace(b.dataset.st)));};}catch(e){}
}

/* navigation chrome */
$("#nav").innerHTML=`<div class="railbrand" title="Back to the theatre"><span class="brandmark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 12h3l2-6 3 12 3-9 2 5 2-2h5"/></svg></span>Galen</div>`+
  TABS.filter(t=>!t[3]).map(([k,l,i])=>`<button data-tab="${k}"><span class="pillbg"></span>${ic(i)}<span class="l">${l}</span>${k==="today"?'<span class="badge" id="navbadge" hidden></span>':""}</button>`).join("");
$("#nav").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)switchTab(b.dataset.tab);});
/* the rail's "Galen" goes home on a click; a long hold is left alone (it hides an egg) */
{const rb=$("#nav .railbrand");let t0=0;rb.style.cursor="pointer";
 rb.addEventListener("pointerdown",()=>{t0=Date.now();});
 rb.addEventListener("click",()=>{if(Date.now()-t0>700&&t0)return;goHome();});}
$("#backbtn").innerHTML=ic("back");$("#backbtn").addEventListener("click",()=>back());
$("#searchbtn").innerHTML=ic("search");$("#searchbtn").addEventListener("click",()=>openPalette());

/* skip link, live regions and landmark order */
{const sk=document.createElement("a");sk.className="skiplink";sk.href="#view";sk.textContent="Skip to content";
 sk.addEventListener("click",e=>{e.preventDefault();V.setAttribute("tabindex","-1");try{V.focus();}catch(x){}});
 document.body.prepend(sk);
 if(!V.hasAttribute("tabindex"))V.setAttribute("tabindex","-1");
 /* toasts are announced from the first one on */
 if(!$("#toast")){const t=document.createElement("div");t.id="toast";t.className="toast";t.setAttribute("role","status");t.setAttribute("aria-live","polite");t.hidden=true;document.body.append(t);}
 /* on the desktop rail (≥980 px) the rail comes first in Tab order, as it does on screen; on phones the bottom bar stays after the page */
 const nav=$("nav.nav"),shell=$(".shell");
 const place=()=>{try{if(!nav||!shell)return;const wide=matchMedia("(min-width: 980px)").matches;
   if(wide){if(shell.previousElementSibling!==nav)shell.before(nav);}else{const anchor=$(".stage")||shell;if(anchor.nextElementSibling!==nav)anchor.after(nav);}}catch(x){}};
 place();try{matchMedia("(min-width: 980px)").addEventListener("change",place);}catch(x){}}

/* delegated navigation for any view: data-go="tab/view/a/b" */
document.addEventListener("click",e=>{
  const g=e.target.closest("[data-go]");
  if(g){e.preventDefault();const [t,v,a,b]=g.dataset.go.split("/");open(t,v||undefined,a||undefined,b||undefined);return;}
  const a=e.target.closest("[data-act]");if(!a)return;
  if(a.dataset.act==="home")goHome();
  else if(a.dataset.act==="back")back();
  else if(a.dataset.act==="nf-search")openPalette(a.dataset.q||"");
});
const soundChip=id=>`<button class="chip" data-go="sounds/sound/${esc(id)}">${ic("sounds")}${esc(item(id).name)}</button>`;
const signChip=id=>{const s=SIGNS[id];return s?`<button class="chip" data-go="signs/sign/${esc(id)}"><span class="v v-${s.v}">${VERDICT[s.v]}</span>${esc(s.name)}</button>`:"";};
/* strength class, plus "neg" for ratios below 1, so "rules out" never looks like "weakly rules in" */
const lrClass=v=>{if(v==null||isNaN(+v))return "";v=+v;const k=(v>=10||v<=0.1)?"strong":(v>=5||v<=0.2)?"mod":(v>=2||v<=0.5)?"":"weak";return (k+(v<1?" neg":"")).trim();};
function lrChips(s){const o=[];
  if(s.p!=null)o.push(`<span class="lr ${lrClass(s.p)}" title="Positive likelihood ratio">LR+ ${esc(s.p)}</span>`);
  if(s.n!=null)o.push(`<span class="lr ${lrClass(s.n)}" title="Negative likelihood ratio">LR− ${esc(s.n)}</span>`);
  if(s.sens!=null)o.push(`<span class="lr weak">Sn ${esc(s.sens)}%</span>`);if(s.spec!=null)o.push(`<span class="lr weak">Sp ${esc(s.spec)}%</span>`);
  if(!o.length)o.push(s.type==="vital"?`<span class="lr nolr" title="A measurement: read the value against its range">a measurement, no single LR</span>`:`<span class="lr nolr" title="No pooled likelihood ratio: judge it with the rest of the picture">no pooled LR</span>`);return o.join("");}
const sysIcon=id=>(SYSTEMS.find(s=>s.id===id)||{}).icon||ic("learn");

/* ================= SEARCH PALETTE ================= */
let PAL=null,PALIDX=null;
/* fold case, accents, apostrophes and dashes: "Dix–Hallpike", "Hoover's" and "hoovers" all match */
const palNorm=s=>String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/['’`]/g,"").replace(/[^a-z0-9+]+/g," ").trim();
function palIndex(){
  if(PALIDX)return PALIDX;const I=[];
  SYSTEMS.forEach(m=>I.push({t:m.name,s:"Examination module",k:"learn",go:`learn/module/${m.id}`,x:m.intro}));
  if(typeof TECH!=="undefined")TECH.forEach(t=>I.push({t:t.name,s:"Technique clinic · "+t.group,k:"check",go:`learn/tech/${t.id}`,x:t.purpose+" "+(t.hook||"")+" "+t.steps.map(s=>s.do).join(" ")}));
  CMAPS.forEach(m=>I.push({t:m.title,s:"Concept map",k:"map",go:`learn/map/${m.id}`,x:m.intro+" "+m.nodes.map(n=>n.label).join(" ")}));
  TOOLS.forEach(t=>I.push({t:t.name,s:`${t.group} · ${t.kind}`,k:"scale",go:`tools/calc/${t.id}`,x:t.use}));
  if(typeof LABS!=="undefined")LABS.forEach(p=>I.push({t:p.name,s:"Labs",k:"log",go:`tools/lab/${p.id}`,x:p.intro}));
  Object.entries(IMG_SUBJECTS).forEach(([id,[n]])=>{if(!SIGNS[id])I.push({t:n,s:"Photographs",k:"eye",go:`signs/imgsub/${id}`,x:""});});
  [["Spot diagnosis","Photographs, four names","practice/spot","eye"],["Narrated routine","Galen reads the examination aloud","tools/narrate","ear"],["Scores and calculators","HEART, Wells, NEWS2, GCS…","tools/calcs","scale"],["Your week","Weekly recap","today/recap","calendar"],["Settings","Daily load, theme, sound","tools/settings","gear"],["Google Drive and Citrus","Sync and the hub","tools/google","gear"],["Backup and export","Backup, Yuzu pack, repair","tools/data","log"]].forEach(([t,s2,go,k])=>I.push({t,s:s2,k,go,x:""}));
  [["Dermatomes and nerves","Neurology map and quiz","learn/neuromap",DERM_ORDER.join(" ")+" dermatome sensory key points nerve territory"],["Where is the lesion?","Localisation","learn/localise","UMN LMN cord syndrome Brown-Sequard central cord gait vascular territory MCA ACA PCA brainstem Weber Wallenberg locked-in INO"],["Localiser","Lesion localisation cases","practice/localiser","localise lesion pinpoint brain spinal cord stroke"],["Root or nerve?","Localisation","learn/rootnerve","foot drop wrist drop claw hand ulnar peroneal radial meralgia"],["Myotomes and reflexes","Neurology","learn/myotomes","reflex root biceps triceps knee ankle MRC grading"],["Cranial nerves","Neurology","learn/cranial","olfactory optic oculomotor trochlear trigeminal abducens facial vestibulocochlear glossopharyngeal vagus accessory hypoglossal"]].forEach(([t,s2,go,x])=>I.push({t,s:s2,k:"learn",go,x}));
  DCOND.forEach(c=>I.push({t:c.n,s:`Skin atlas · ${c.g}`,k:"eye",go:`learn/dcond/${c.id}`,x:c.m+" "+c.dd.join(" ")}));
  DVOCAB.forEach(v=>I.push({t:v[0],s:"Skin lesion term",k:"learn",go:"learn/dmorph",x:v[2]+" "+v[3],w:-3}));
  [["Describe like a dermatologist","Dermatology","learn/describe","describe skin lesion morphology SCALDA sentence"],["Describe it (practice)","Dermatology plates","practice/describe","describe plate quiz rash"],["Skin that can kill","Dermatology emergencies","learn/demerg","SJS TEN DRESS necrotising fasciitis erythroderma AGEP"],["Skin atlas","Dermatology","learn/datlas","atlas rash images plates"]].forEach(([t,s2,go,x])=>I.push({t,s:s2,k:"learn",go,x}));
  REGIONS.forEach(r=>I.push({t:r.name+" examination",s:"Musculoskeletal region",k:"learn",go:`learn/region/${r.id}`,x:r.intro+" "+r.land.map(l=>l[0]).join(" ")}));
  Object.entries(SIGNS).forEach(([k,s])=>{if(!s.hide)I.push({t:s.name,s:`${VERDICT[s.v]} · ${s.target}`,k:"signs",go:`signs/sign/${k}`,x:s.target+" "+s.think+" "+(s.anat||"")});});
  Object.entries(FIG).forEach(([k,f])=>{const u=Object.keys(SIGNS).find(x=>SIGNS[x].fig===k);const reg=REGIONS.find(r=>r.fig===k);if(u||reg)I.push({t:f.t,s:"Illustration",k:"eye",go:reg?`learn/region/${reg.id}`:`signs/sign/${u}`,x:f.c,w:-4});});
  Object.entries(SOUNDS).forEach(([k,s])=>I.push({t:s.name,s:`Sound · ${s.timing}`,k:"sounds",go:`sounds/sound/${k}`,x:s.clue}));
  Object.entries(REAL).forEach(([k,r])=>I.push({t:r.name,s:`Real recording · ${r.who}`,k:"ear",go:`sounds/sound/${k}`,x:r.dx}));
  HIST.pres.forEach(p=>I.push({t:p.name,s:"History · presentation",k:"history",go:`learn/pres/${p.id}`,x:p.dd.join(" ")+" "+p.red.join(" ")}));
  HDPE.forEach(c=>I.push({t:c.title,s:`Hypothesis-driven case · ${SYS_SHORT[c.sys]}`,k:"target",go:`practice/hdpe/${c.id}`,x:c.stem}));
  SCEN.forEach(c=>I.push({t:c.title,s:"ER case",k:"case",go:`practice/er/${c.id}`,x:c.hx}));
  [["Today's session","Spaced, mixed review","practice/session","calendar"],["Sound drill","Listen until mastered","practice/drill","bolt"],["Likelihood-ratio calculator","Pretest to post-test","signs/calc","scale"],["Illustration atlas","Anatomy behind the exam","signs/atlas","eye"],["ER essentials","Deep dives: history, anatomy, 2026 practice","signs/er","bolt"],["Remember it forever","Memory methods, palace, mnemonics","learn/memory","mind"],["Archaic and replaced tests","What to do instead","signs/verdicts","scale"],["Which tests are archaic?","Verdicts explained","signs/verdicts","signs"],["Chest map","Where to listen and why","sounds/map","map"],["Compare sounds","Look-alikes side by side","sounds/compare","compare"],["Auscultation foundations","How sounds are made","sounds/learn","learn"],["History frameworks","Structure, SOCRATES, occupational history","learn/frames","history"],["How to learn the examination","The evidence behind this app","learn/method","mind"],["Bedside log","Check your findings against imaging","practice/log","log"],["Rehearse a routine","Recall each step before you see it","practice/rehearse","mind"],["Evidence duel","Which sign carries more weight?","practice/duel","scale"]]
    .forEach(([t,s,go,k])=>I.push({t,s,k,go,x:""}));
  PALIDX=I.map(o=>Object.assign(o,{lt:o.t.toLowerCase(),lx:(o.s+" "+o.x).toLowerCase()}));return PALIDX;
}
/* how much each kind of result is worth when scores tie: halls first, then techniques, signs, modules and stories */
function palKindBoost(o){const g=o.go||"";
  if(/^(learn|today)\/hall\/[^/]+$/.test(g))return 12;if(g.startsWith("learn/tech/"))return 8;if(g.startsWith("signs/sign/"))return 7;
  if(g.startsWith("learn/module/"))return 7;if(g.startsWith("learn/lore/"))return 5;if(g.startsWith("learn/pres/"))return 5;
  if(g.startsWith("tools/calc/"))return 4;if(g.startsWith("practice/"))return 2;return 0;}
function palPrep(o){if(o._n)return;o._n=1;o.nt=palNorm(o.t);o.nx=palNorm((o.s||"")+" "+(o.x||""));o.tw=" "+o.nt;o.xw=" "+o.nx;
  o.ini=o.nt.split(" ").filter(w=>w&&!/^(of|the|and|in|a|to|for|on)$/.test(w)).map(w=>w[0]).join("");}
function palScore(o,q,words){palPrep(o);let sc=0;
  if(o.nt===q)sc+=120;else if(o.nt.startsWith(q))sc+=70;else if(o.tw.includes(" "+q))sc+=50;else if(q.length>=4&&o.nt.includes(q))sc+=15;
  if(q.length>=2&&q.length<=6&&!q.includes(" ")&&o.ini===q)sc+=60;   /* jvp, gcs, rapd */
  for(const w of words){
    if(o.tw.includes(" "+w))sc+=14;
    else if(w.length>=3&&o.nt.includes(w))sc+=4;
    else if(o.xw.includes(" "+w))sc+=3;
    else if(w.length>=5&&o.nx.includes(w))sc+=1;
    else return -1;}
  /* a hall whose own name matches is the best answer for a body-part word ("heart", "skin") */
  const hall=/^(learn|today)\/hall\/[^/]+$/.test(o.go||"")&&words.every(w=>o.tw.includes(" "+w))?24:0;
  return sc+hall+palKindBoost(o)+(o.w||0)+Math.max(0,8-o.nt.length/6);}
const PAL_RECENT_KEY="galen.palrecent";
function palRecent(){try{const a=JSON.parse(localStorage.getItem(PAL_RECENT_KEY)||"[]");return Array.isArray(a)?a.filter(x=>typeof x==="string").slice(0,6):[];}catch(e){return [];}}
function palRemember(go){try{const a=palRecent().filter(x=>x!==go);a.unshift(go);localStorage.setItem(PAL_RECENT_KEY,JSON.stringify(a.slice(0,6)));}catch(e){}}
function palSearch(q){
  const I=palIndex();q=palNorm(q);
  if(!q){const rec=palRecent().map(g=>I.find(o=>o.go===g)).filter(Boolean).map(o=>Object.assign(Object.create(o),{recent:1}));
    const seen=new Set(rec.map(o=>o.go));
    return rec.concat(I.filter(o=>!seen.has(o.go)&&(["calendar","bolt","scale","map","mind"].includes(o.k)||o.go.startsWith("learn/module")||/^(learn|today)\/hall\/[^/]+$/.test(o.go))).slice(0,16));}
  const words=q.split(" ").filter(Boolean),seen=new Set();
  let scored=I.map(o=>[palScore(o,q,words),o]).filter(([s])=>s>0);
  /* nothing found: forgive a slip at the end of a word ("harvy", "hallpik") by matching shorter stems */
  if(!scored.length&&words.some(w=>w.length>=4)){const w2=words.map(w=>w.length>=7?w.slice(0,-2):w.length>=4?w.slice(0,-1):w);scored=I.map(o=>[palScore(o,w2.join(" "),w2),o]);}
  return scored.filter(([s])=>s>0).sort((a,b)=>b[0]-a[0]||a[1].t.length-b[1].t.length)
    .filter(([,o])=>{if(seen.has(o.go))return false;seen.add(o.go);return true;}).slice(0,30).map(x=>x[1]);
}
function openPalette(prefill){
  if(PAL){if(typeof prefill==="string"){const q=$("#palq");if(q){q.value=prefill;q.dispatchEvent(new Event("input"));}}return;}
  const ret=document.activeElement;
  const el=document.createElement("div");el.className="pal-back";
  el.innerHTML=`<div class="pal" role="dialog" aria-modal="true" aria-label="Search Galen"><label class="search">${ic("search")}<input id="palq" role="combobox" aria-expanded="true" aria-controls="pall" aria-autocomplete="list" placeholder="Search signs, techniques, halls, stories…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-label="Search"><button class="iconbtn" data-x aria-label="Close search">${ic("close")}</button></label><div class="pal-list" id="pall" role="listbox" aria-label="Results"></div><div class="pal-foot"><span><span class="kbdhint">↑↓</span> move</span><span><span class="kbdhint">Enter</span> or <span class="kbdhint">A</span> open</span><span><span class="kbdhint">Esc</span> or <span class="kbdhint">B</span> close</span></div></div>`;
  document.body.append(el);PAL={el,sel:0,items:[],ret};
  /* the page behind is inert while search is open */
  $$(".shell, nav.nav, .skiplink").forEach(n=>{try{n.inert=true;}catch(e){}n.setAttribute("aria-hidden","true");});
  const q=$("#palq",el),list=$("#pall",el);
  const mark=()=>{$$(".pal-item",list).forEach((b,i)=>b.setAttribute("aria-selected",String(i===PAL.sel)));
    const cur=list.children[PAL.sel];if(cur&&cur.id){q.setAttribute("aria-activedescendant",cur.id);cur.scrollIntoView({block:"nearest"});}else q.removeAttribute("aria-activedescendant");};
  const draw=()=>{PAL.items=palSearch(q.value);PAL.sel=clamp(PAL.sel,0,Math.max(0,PAL.items.length-1));
    const head=!q.value.trim()&&PAL.items.some(o=>o.recent);
    list.innerHTML=PAL.items.length?PAL.items.map((o,i)=>`<button class="pal-item" id="pal-o${i}" role="option" tabindex="-1" aria-selected="${i===PAL.sel}" data-i="${i}"><span class="icwrap n">${ic(o.k)}</span><span class="txt"><b>${esc(o.t)}</b><span>${o.recent?"Recent · ":""}${esc(o.s)}</span></span></button>`).join(""):`<div class="empty">Nothing matches “${esc(q.value)}”. Try one word, or the start of a name.</div>`;
    if(head)list.setAttribute("aria-label","Recent and suggested");else list.setAttribute("aria-label","Results");
    mark();};
  const go=i=>{const o=PAL.items[i];if(!o)return;palRemember(o.go);closePalette(false);const [t,v,a,b]=o.go.split("/");open(t,v,a,b);};
  PAL.go=()=>go(PAL.sel);
  const move=d=>{if(!PAL.items.length)return;PAL.sel=(PAL.sel+d+PAL.items.length)%PAL.items.length;mark();};
  q.addEventListener("input",()=>{PAL.sel=0;draw();});
  q.addEventListener("keydown",e=>{
    if(e.key==="ArrowDown"){e.preventDefault();move(1);}
    else if(e.key==="ArrowUp"){e.preventDefault();move(-1);}
    else if(e.key==="PageDown"){e.preventDefault();PAL.sel=Math.min(PAL.items.length-1,PAL.sel+8);mark();}
    else if(e.key==="PageUp"){e.preventDefault();PAL.sel=Math.max(0,PAL.sel-8);mark();}
    else if(e.key==="Enter"){e.preventDefault();go(PAL.sel);}
    else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closePalette();}
  });
  /* the controller's A "clicks" the focused input with no pointer (detail 0): treat that as Enter */
  q.addEventListener("click",e=>{if(e.detail===0&&PAL&&PAL.items.length)go(PAL.sel);});
  list.addEventListener("click",e=>{const b=e.target.closest("[data-i]");if(b)go(+b.dataset.i);});
  list.addEventListener("mousemove",e=>{const b=e.target.closest("[data-i]");if(b&&+b.dataset.i!==PAL.sel){PAL.sel=+b.dataset.i;mark();}});
  el.addEventListener("click",e=>{if(e.target===el||e.target.closest("[data-x]"))closePalette();});
  /* keep Tab inside the dialog */
  el.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();closePalette();return;}
    if(e.key!=="Tab")return;const f=[q,$("[data-x]",el)];const i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();});
  if(typeof prefill==="string")q.value=prefill;
  draw();setTimeout(()=>{if(PAL&&PAL.el===el){q.focus();if(prefill)q.select();}},10);
}
/* closePalette(): close and return focus to what had it; closePalette(false) when a navigation will move focus itself */
function closePalette(restore){if(!PAL)return;const ret=PAL.ret;PAL.el.remove();PAL=null;
  $$(".shell, nav.nav, .skiplink").forEach(n=>{try{n.inert=false;}catch(e){}n.removeAttribute("aria-hidden");});
  if(restore!==false){try{if(ret&&ret.isConnected&&ret!==document.body)ret.focus({preventScroll:true});else focusPage();}catch(e){}}}

/* global keys: / or Ctrl-K search · Esc back · 1–4 and Space handled by practice views */
const KEYS={handler:null};
document.addEventListener("keydown",e=>{
  const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable;
  if((e.key==="/"&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k")){e.preventDefault();openPalette();return;}
  if(PAL)return;
  if(e.key==="Escape"&&!typing&&!document.querySelector("[aria-modal=true], .helpov")){back();return;}
  if(!typing&&KEYS.handler)KEYS.handler(e);
});

/* ================= TODAY ================= */
/* "Learn 10 more" is for today only. The extra is added to newPerDay (so every session builder sees it) and taken off
   again on the first launch of another day. Values above the Settings maximum (40) came from the old permanent bump. */
function revertExtraNew(){try{const S=Store.s.settings,x=S.extraNew;
  if(x&&x.d!==dayNum()){S.newPerDay=Math.max(0,num(S.newPerDay)-num(x.n));delete S.extraNew;Store.save();}
  else if(!x&&num(S.newPerDay)>40){S.newPerDay=40;Store.save();}}catch(e){}}
function grantExtraNew(n){revertExtraNew();const S=Store.s.settings,d=dayNum(),x=S.extraNew&&S.extraNew.d===d?S.extraNew:{d,n:0};
  n=Math.max(0,Math.min(num(n),60-num(x.n)));S.newPerDay=num(S.newPerDay)+n;x.n=num(x.n)+n;S.extraNew=x;Store.save();return n;}
onNav(i=>{if(i.to&&i.to.v==="home")revertExtraNew();});
function greet(){const h=new Date().getHours();return h<5?"Late shift?":h<12?"Good morning":h<17?"Good afternoon":"Good evening";}
const WD=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
route("today:home","Today",(root)=>{
  const due=dueCards().length,room=Math.max(0,Store.s.settings.newPerDay-newToday()),nw=Math.min(room,newCards().length);
  const total=due+nw,mins=Math.max(1,Math.round(total*0.35));
  const st=streak(),days=Store.s.days,name=Store.s.settings.name;
  const week=[...Array(7)].map((_,i)=>{const t=Date.now()-(6-i)*DAY_MS,k=dayKey(t);return `<div><i class="${days[k]?"on":""}${i===6?" today":""}" title="${fmtDate(t)}${days[k]?": "+num(days[k])+" items":""}"></i><span>${WD[new Date(t).getDay()][0]}</span></div>`;}).join("");
  const learned=Object.values(Store.s.srs).filter(r=>r.iv>=7).length,started=Object.keys(Store.s.srs).length;
  const logPending=Store.s.log.filter(x=>!x.ver).length;
  const nextDrill=DRILLS.find(d=>{const c=drillCats(d);return c.some(k=>!(Store.s.snd[d.id+":"+k.key]||{}).m);})||DRILLS[0];
  const nextCase=HDPE.find(c=>!Store.s.hd[c.id])||HDPE[0];
  const weak=weakCards(5),round=roundToday(),plan=Hub.todayFromPlan(),light=!!(plan&&plan.afterNight);
  const roundDone=ROUND.filter(r=>round[r[0]]).length,roundN=light?3:5;
  const lv=levelOf(Store.s.xp),mastered=Object.values(Store.s.snd).filter(x=>x.m).length;
  const ready=Object.keys(DCOND).length;
  const planLine=plan?(plan.blocks.length?`Citrus planned <b>${esc(plan.blocks[0].title)}</b> at ${esc(plan.blocks[0].start)}${num(plan.blocks[0].minutes)?` (${num(plan.blocks[0].minutes)} min)`:""}`:plan.shift?`Today: <b>${esc(plan.shift.label||plan.shift.code||"shift")}</b>${plan.shift.start?` ${esc(plan.shift.start)}–${esc(plan.shift.end)}`:""}${light?" · after a night, three items are plenty":""}`:light?"After a night: three items are plenty today":""):"";
  const roundItems=ROUND.map(([k,t,sub,go,icn])=>{let g=go,s2=sub;if(k==="session"){s2=total?`${due} due, ${nw} new · about ${mins} min`:"Nothing due · learn 10 more";}if(k==="case"){const alt=["practice/hdpe/"+nextCase.id,"practice/er","practice/localiser"][new Date().getDate()%3];g=alt;s2=alt.startsWith("practice/er")?"An ER case":alt.endsWith("localiser")?"Pinpoint a lesion":esc(nextCase.title);}
    if(k==="eye")g=new Date().getDate()%2?"practice/describe":"practice/spot";if(k==="read")g=new Date().getDate()%2?"signs/er":"learn/maps";if(k==="hands"){const td=typeof techOfDay==="function"&&techOfDay();g=["practice/rehearse","tools/narrate","practice/drill",td?"learn/tech/"+td.id:"practice/drill"][new Date().getDate()%4];if(td&&new Date().getDate()%4===3)s2="Technique: "+td.name;}
    return `<button class="rnd${round[k]?" done":""}" data-go="${g}"><span class="rdot">${round[k]?ic("check"):ic(icn)}</span><span class="txt"><b>${t}</b><span>${s2}</span></span>${ic("chev","chev")}</button>`;}).join("");
  root.innerHTML=`
  <section class="hero">
    <svg class="trace" viewBox="0 0 260 60" aria-hidden="true"><path d="M0 34h46l7-5 7 5h22l5 6 7-34 7 40 5-12h30l9-6 10 6h36l7-5 7 5h22l5 6 7-34 7 40" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    <div class="stack" style="gap:6px"><span class="eyebrow">${WD[new Date().getDay()]} · ${fmtDate(Date.now())}${planLine?` · <span style="text-transform:none;letter-spacing:0">${planLine}</span>`:""}</span><h1>${greet()}${name?", "+esc(name):""}.</h1>
    <p class="muted">${roundDone>=roundN?"Today's round is done. Anything more is a bonus.":`${roundDone} of ${roundN} on today's round. ${total?`Start with the session: ${due?`${due} review${due>1?"s":""}`:""}${due&&nw?" and ":""}${nw?`${nw} new`:""}.`:"Nothing is due: pick a case or a plate."}`}</p></div>
    <div class="counts"><div><b>${due}</b><span>due</span></div><div><b>${st}</b><span>day streak</span></div><div><b>${num(Store.s.xp)}</b><span>XP · ${esc(lv.title)}</span></div></div>
    <div class="row-x">${total?`<button class="btn" data-go="practice/session/all">${ic("play")}Start today's session</button>`:`<button class="btn" data-act="extra">${ic("play")}Learn 10 more</button>`}
      <select class="sel" id="focus" aria-label="Focus the session on one system" style="width:auto;min-width:0;flex:0 1 auto"><option value="">Focus: all systems</option>${Object.entries(SYS_NAME).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></div>
  </section>
  <section class="section"><div class="row-x"><span class="label">Today's round</span><span class="spacer"></span>${ring(roundDone/roundN,26,4)}</div><div class="round">${roundItems}</div></section>
  ${(()=>{const td=typeof techOfDay==="function"&&techOfDay();if(!td)return "";const c=techConf(td.id);return `<button class="tile" data-go="learn/tech/${td.id}"><div class="t-top"><span class="eyebrow">Technique of the day</span>${pips(td.id)}</div><b>${esc(td.name)}</b><span class="sub">${esc(td.hook||td.purpose)}</span><span class="small" style="font-weight:700;color:var(--accent-ink)">${c==null?"Rate your confidence, then walk it through":`Confidence ${c}/5 · ${techDone(td.id)}/5 milestones`}</span></button>`;})()}
  <section class="grid">
    <div class="tile" data-hint="This week|Days with any practice. Streaks count up to yesterday if today isn't done yet."><div class="t-top"><span class="eyebrow">This week</span><span class="pill acc">${ic("flame")}${st} day${st===1?"":"s"}</span></div><div class="week">${week}</div></div>
    <div class="tile" data-hint="Level|XP comes from every card, case, plate and routine. Levels grow with the square root, so early levels come fast."><span class="eyebrow">Level ${lv.l} · ${esc(lv.title)}</span><div class="meter" style="margin:8px 0 4px"><i style="width:${Math.round(lv.pct*100)}%"></i></div><span class="small muted">${num(Store.s.xp)} XP · ${num(lv.next-num(Store.s.xp))} to level ${num(lv.l)+1}</span></div>
    <div class="tile"><span class="eyebrow">Long-term memory</span><div class="row-x" style="gap:14px"><b class="big">${learned}</b><span class="small muted">items held for a week or more<br>${started} started · ${mastered} sounds mastered</span></div></div>
  </section>
  <section class="section"><div class="row-x"><span class="label">Mastery by system</span><span class="spacer"></span><button class="link small" data-go="learn">All modules</button></div>
    <div class="sysgrid">${Object.keys(SYS_NAME).map(k=>{const m=mastery(k);return `<button class="sysbtn" data-go="learn/module/${k}">${ring(m.pct,38,4.5)}<span style="min-width:0"><b>${SYS_SHORT[k]}</b><span class="tiny muted">${Math.round(m.pct*100)}%</span></span></button>`;}).join("")}</div></section>
  <section class="section"><span class="label">Keep going</span><div class="grid">
    <button class="tile" data-go="practice/drill/${nextDrill.id}"><div class="t-top"><span class="icwrap">${ic("bolt")}</span><span class="tag">perceptual</span></div><b>Drill: ${esc(nextDrill.name)}</b><span class="sub">Listen until it is automatic.</span></button>
    <button class="tile" data-go="practice/hdpe/${nextCase.id}"><div class="t-top"><span class="icwrap">${ic("target")}</span><span class="tag">predict first</span></div><b>${esc(nextCase.title)}</b><span class="sub">Hypothesis-driven examination.</span></button>
    <button class="tile" data-go="practice/log"><div class="t-top"><span class="icwrap">${ic("log")}</span><span class="tag">feedback</span></div><b>Bedside log</b><span class="sub">${logPending?`${logPending} finding${logPending>1?"s":""} waiting for verification.`:"Log a real finding and verify it later."}</span></button>
    ${new Date().getDay()<=2?`<button class="tile" data-go="today/recap"><div class="t-top"><span class="icwrap">${ic("calendar")}</span><span class="tag">weekly</span></div><b>Last week in Galen</b><span class="sub">What you did, what stuck, what to repeat.</span></button>`:""}
  </div></section>
  ${weak.length?`<section class="section"><span class="label">Trouble spots</span><div class="list">${weak.map(c=>`<button class="lrow" data-go="${cardHome(c)}"><span class="tag">${CARD_TYPE_LABEL[c.type]}</span><span class="txt"><b>${esc(c.label)}</b><span>${SYS_SHORT[c.sys]||""} · forgotten ${num(Store.s.srs[c.id].l)} time${num(Store.s.srs[c.id].l)>1?"s":""}</span></span>${ic("chev","chev")}</button>`).join("")}</div></section>`:""}
  <div class="grid"><button class="tile" data-go="learn/method"><div class="t-top"><span class="icwrap n">${ic("mind")}</span><span class="tag">evidence</span></div><b>How Galen teaches</b><span class="sub">Seven learning methods with their studies.</span></button>
  <button class="tile" data-go="tools"><div class="t-top"><span class="icwrap">${ic("gear")}</span></div><b>Settings, sync and tools</b><span class="sub">${Store.mode==="drive"?"Synced with Google Drive":Store.mode==="cloud"?"Synced with your Claude account":"Progress is saved on this device"}</span></button></div>`;
  const f=$("#focus");f.addEventListener("change",()=>{if(f.value)open("practice","session",f.value);});
  $("[data-act=extra]",root)?.addEventListener("click",()=>{grantExtraNew(10);open("practice","session","all");});
});
/* Weeks run Sunday to Saturday (the Saudi working week starts on Sunday). By default the recap shows the last full
   week; "this" shows the week so far. Items are practice events from the day log, not distinct cards. */
function weekBounds(which){const d=new Date();d.setHours(0,0,0,0);const sun=new Date(d.getTime());sun.setDate(d.getDate()-d.getDay());
  const start=new Date(sun.getTime());if(which!=="this")start.setDate(sun.getDate()-7);
  const keys=[...Array(7)].map((_,i)=>{const x=new Date(start.getTime());x.setDate(start.getDate()+i);return dayKey(x.getTime());});
  const end=new Date(start.getTime());end.setDate(start.getDate()+6);return {start,end,keys};}
route("today:recap",w=>w==="this"?"This week":"Last week",(root,which)=>{
  const W=weekBounds(which),keys=W.keys,inWeek=t=>t&&keys.includes(dayKey(t)),vals=o=>Object.values(o||{}).filter(x=>x&&typeof x==="object");
  const srs=vals(Store.s.srs),touched=srs.filter(r=>inWeek(r.last)).length,learned=srs.filter(r=>inWeek(r.last)&&num(r.iv)>=7).length;
  const cases=vals(Store.s.hd).filter(x=>inWeek(x.at)).length+vals(Store.s.loc).filter(x=>inWeek(x.at)).length,plates=vals(Store.s.dprac).filter(x=>inWeek(x.at)).length;
  const pins=vals(Store.s.pins).filter(p=>!p.deleted&&inWeek(p.t)).length,days=keys.filter(k=>num(Store.s.days[k])).length,items=keys.reduce((a,k)=>a+num(Store.s.days[k]),0);
  const bySys={};(CARDS||[]).forEach(c=>{const r=Store.s.srs[c.id];if(r&&inWeek(r.last))bySys[c.sys]=(bySys[c.sys]||0)+1;});const top=Object.entries(bySys).sort((a,b)=>b[1]-a[1])[0];
  const span=`${fmtDate(W.start.getTime())} to ${fmtDate(W.end.getTime())}`,soFar=which==="this";
  const weak=weakCards(4),text=`Galen, ${soFar?"this week so far":"week"} ${span}: ${days}/7 days · ${items} items practised · ${touched} cards reviewed, ${learned} now held a week or more · ${cases} cases · ${plates} plates${pins?` · ${pins} photos pinned`:""}${top?` · most practised: ${SYS_NAME[top[0]]}`:""}.`;
  root.innerHTML=`<section class="hero" style="align-items:flex-start"><span class="eyebrow">${soFar?"This week so far":"Last week"} · ${span}</span><h1>${soFar?(days>=3?"A good start.":"The week is young."):days>=5?"A strong week.":days>=3?"Steady.":"A quiet week."}</h1><p class="muted">${days} of 7 days with practice · ${items} items practised.</p>
   <div class="counts"><div><b>${touched}</b><span>cards</span></div><div><b>${cases}</b><span>cases</span></div><div><b>${plates}</b><span>plates</span></div><div><b>${pins}</b><span>pins</span></div></div>
   <div class="row-x"><button class="btn sm ${soFar?"ghost":"soft"}" ${soFar?'data-act="rc-last"':"disabled"}>Last week</button><button class="btn sm ${soFar?"soft":"ghost"}" ${soFar?"disabled":'data-act="rc-this"'}>This week so far</button></div></section>
   <div class="grid"><div class="tile"><span class="eyebrow">Now in long-term memory</span><b class="big">${learned}</b><span class="sub">cards reviewed in these days that are now held a week or more</span></div><div class="tile"><span class="eyebrow">Most practised</span><b>${top?esc(SYS_NAME[top[0]]||top[0]):"Nothing yet"}</b><span class="sub">${top?top[1]+" cards":"Start a session"}</span></div></div>
   ${weak.length?`<section class="section"><span class="label">Repeat next week</span><div class="chips">${weak.map(c=>`<button class="chip" data-go="${cardHome(c)}">${esc(c.label)}</button>`).join("")}</div></section>`:""}
   <div class="card stack" style="gap:8px"><p class="small mono">${esc(text)}</p><div class="row-x"><button class="btn sm soft" id="rc-copy">Copy as text</button></div></div>`;
  $("[data-act=rc-last]",root)?.addEventListener("click",()=>replace("recap"));
  $("[data-act=rc-this]",root)?.addEventListener("click",()=>replace("recap","this"));
  $("#rc-copy").addEventListener("click",()=>{try{navigator.clipboard.writeText(text).then(()=>toast("Copied","good"),()=>toast("Couldn't copy"));}catch(e){toast("Couldn't copy");}});
});
function cardHome(c){
  switch(c.type){case "think":case "verdict":case "mech":case "snsp":case "teach":return `signs/sign/${c.ref}`;case "sound":return `sounds/sound/${c.ref}`;
   case "finding":return `learn/module/${c.ref[0]}/think`;case "anat":return `learn/module/${({chest:"cvs",abdomen:"abd",neck:"hn",back:"msk"})[c.ref[0]]}/anat`;
   case "area":case "zone":return "sounds/map";case "hlr":return `learn/pres/${c.ref[0]}`;case "red":return `learn/pres/${c.ref}`;
   case "dterm":return "learn/dmorph";case "dplate":return `learn/dcond/${c.ref}`;case "derm":return "learn/neuromap/derm";case "myo":case "reflex":return "learn/myotomes";case "rootnerve":return "learn/rootnerve";case "cranial":return "learn/cranial";case "twhy":case "terr":return `learn/tech/${c.ref[0]}`;}
  return "today";
}

/* ================= LEARN ================= */
route("learn:home","Learn",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Learn</span><h1>Examine with reasons, not rituals</h1><p class="lede">Each module gives you the surface anatomy, the focused history, the examination sequence with the mechanism and evidence for every step, what to think with each finding, and where people go wrong.</p></section>
  ${typeof TECH!=="undefined"&&TECH.length?`<button class="tile" data-go="learn/tech" style="border-color:var(--accent)"><div class="t-top"><span class="icwrap">${ic("check")}</span><span class="tag">${TECH.length} techniques</span></div><b>Technique clinic</b><span class="sub">Otoscopy, fundoscopy, rhinoscopy, Tinel, reflexes, plantar, Dix–Hallpike, HINTS and more: the proper way, the reason for every move, and drills until you are certain.</span></button>`:""}
  <section class="section"><span class="label">Examination by system</span><div class="grid">${SYSTEMS.map(m=>{const ms=mastery(m.id);const rh=Store.s.rehearse[m.id];return `<button class="tile" data-go="learn/module/${m.id}"><div class="t-top"><span class="icwrap">${m.icon}</span>${ring(ms.pct,34,4)}</div><b>${esc(m.name)}</b><span class="sub">${m.seq.length} steps · ${m.think.length} findings${Store.s.mods.includes(m.id)?" · reviewed":""}${rh?` · rehearsed ${num(rh.best)}/${m.seq.length}`:""}</span></button>`;}).join("")}</div></section>
  <section class="section"><span class="label">See the connections</span><div class="grid">
    <button class="tile" data-go="learn/maps"><div class="t-top"><span class="icwrap">${ic("map")}</span><span class="tag">${CMAPS.length} maps</span></div><b>Concept maps</b><span class="sub">Mechanism → sign → decision, tap by tap.</span></button>
    <button class="tile" data-go="signs/images"><div class="t-top"><span class="icwrap">${ic("eye")}</span><span class="tag">live</span></div><b>Photo library</b><span class="sub">Real signs and skin, openly licensed, pin your favourites.</span></button>
    <button class="tile" data-go="tools/labs"><div class="t-top"><span class="icwrap">${ic("log")}</span></div><b>Labs at the bedside</b><span class="sub">Patterns that confirm or refute what you found.</span></button></div></section>
  <section class="section"><span class="label">Dermatology</span><div class="grid">
    <button class="tile" data-go="learn/datlas"><div class="t-top"><span class="icwrap">${ic("eye")}</span><span class="tag">${DCOND.length} conditions × 6 skin tones</span></div><b>Skin atlas</b><span class="sub">Drawn plates, model descriptions, look-alikes, links to real photos.</span></button>
    <button class="tile" data-go="learn/describe"><div class="t-top"><span class="icwrap">${ic("learn")}</span></div><b>Describe like a dermatologist</b><span class="sub">The order, the sentence, a builder.</span></button>
    <button class="tile" data-go="learn/dmorph"><div class="t-top"><span class="icwrap">${ic("map")}</span></div><b>The words of the skin</b><span class="sub">Every lesion term with its picture and size rule.</span></button></div></section>
  <section class="section"><span class="label">Neurology toolkit</span><div class="grid">
    <button class="tile" data-go="learn/neuromap"><div class="t-top"><span class="icwrap">${ic("map")}</span><span class="tag">quiz</span></div><b>Dermatomes and nerves</b><span class="sub">Tap-to-learn body map with the 28 key sensory points.</span></button>
    <button class="tile" data-go="learn/localise"><div class="t-top"><span class="icwrap">${ic("target")}</span></div><b>Where is the lesion?</b><span class="sub">Rules, vascular territories, brainstem syndromes, cord, gait.</span></button>
    <button class="tile" data-go="practice/localiser"><div class="t-top"><span class="icwrap">${ic("target")}</span><span class="tag">${LCASES.length} cases</span></div><b>Localiser</b><span class="sub">Pinpoint lesions clue by clue on the neuraxis.</span></button>
    <button class="tile" data-go="learn/rootnerve"><div class="t-top"><span class="icwrap">${ic("scale")}</span></div><b>Root or nerve?</b><span class="sub">Foot drop, wrist drop, claw hand: the deciding test.</span></button>
    <button class="tile" data-go="learn/myotomes"><div class="t-top"><span class="icwrap">${ic("bolt")}</span></div><b>Myotomes and reflexes</b><span class="sub">Key muscles, reflex roots, grading.</span></button>
    <button class="tile" data-go="learn/cranial"><div class="t-top"><span class="icwrap">${ic("eye")}</span></div><b>Cranial nerves</b><span class="sub">The 3-minute screen and the finding that matters for each.</span></button></div></section>
  <section class="section"><span class="label">Joints, region by region</span><div class="chips">${REGIONS.map(r=>`<button class="chip" data-go="learn/region/${r.id}">${ic("bone")}${esc(r.name)}</button>`).join("")}</div></section>
  <div class="grid"><button class="tile" data-go="learn/memory"><div class="t-top"><span class="icwrap">${ic("mind")}</span><span class="tag">method</span></div><b>Remember it forever</b><span class="sub">Retrieval, spacing, a memory palace on the patient, checked mnemonics.</span></button>
  <button class="tile" data-go="signs/er"><div class="t-top"><span class="icwrap">${ic("bolt")}</span><span class="tag">${Object.keys(DEEP).length} deep dives</span></div><b>ER essentials</b><span class="sub">History, etymology, anatomy and 2026 practice for the tests you use every shift.</span></button></div>
  <button class="tile" data-go="signs/atlas"><div class="t-top"><span class="icwrap">${ic("eye")}</span><span class="tag">${Object.keys(FIG).length} figures</span></div><b>Illustration atlas</b><span class="sub">The anatomy and physiology behind each manoeuvre: why the test works.</span></button>
  <section class="section"><span class="label">History taking</span><div class="grid">
    <button class="tile" data-go="learn/frames"><div class="t-top"><span class="icwrap">${ic("history")}</span></div><b>Frameworks</b><span class="sub">Structure under pressure, SOCRATES, techniques, occupational history.</span></button>
    <button class="tile" data-go="learn/pres"><div class="t-top"><span class="icwrap">${ic("scale")}</span></div><b>Presentations</b><span class="sub">${HIST.pres.length} complaints: questions that move probability, red flags, differentials.</span></button></div></section>
  <section class="section"><span class="label">Auscultation</span><div class="grid">
    <button class="tile" data-go="sounds/learn"><div class="t-top"><span class="icwrap">${ic("ear")}</span></div><b>Foundations</b><span class="sub">How sounds are made, bell vs diaphragm, why areas are where they are.</span></button>
    <button class="tile" data-go="sounds/map"><div class="t-top"><span class="icwrap">${ic("map")}</span></div><b>Chest map</b><span class="sub">Every listening point and the reason for it.</span></button></div></section>
  <button class="tile" data-go="learn/method"><div class="t-top"><span class="icwrap n">${ic("mind")}</span><span class="tag">evidence</span></div><b>How to learn the examination</b><span class="sub">What the research says works, and how to use this app daily.</span></button>`;
});

route("learn:module",(id)=>(SYSTEMS.find(s=>s.id===id)||{}).short||"Module",(root,id,tab)=>{
  const s=SYSTEMS.find(x=>x.id===id);if(!s)throw new Error("Module not found");
  tab=tab||"seq";const m=mastery(id),done=Store.s.mods.includes(id);
  root.innerHTML=`<section class="ph"><div class="ph-row"><span class="icwrap">${s.icon}</span><span class="eyebrow">${esc(s.tag)}</span></div><h1>${esc(s.name)}</h1><p class="lede">${esc(s.intro)}</p>
    <div class="row-x"><span class="row-x" style="gap:8px">${ring(m.pct,30,4)}<span class="small muted">${Math.round(m.pct*100)}% mastered · ${m.seen}/${m.n} items started</span></span></div>
    <div class="row-x"><button class="btn sm" data-go="practice/session/${id}">${ic("calendar")}Review this system</button><button class="btn sm soft" data-go="practice/rehearse/${id}">${ic("mind")}Rehearse the routine</button><button class="btn sm ghost" data-go="practice/pocket/${id}">${ic("pocket")}Pocket card</button></div></section>
  <div class="tabs" role="tablist">${[["seq","Examination"],...(id==="msk"?[["reg","Regions"]]:[]),...(id==="neuro"?[["tool","Toolkit"]]:[]),...(id==="derm"?[["atlas","Atlas"],["morph","Words"],["describe","Describe"]]:[]),["anat","Anatomy"],["hist","History"],["think","What to think"],["pit","Pitfalls"]].map(([k,l])=>`<button role="tab" aria-selected="${k===tab}" data-t="${k}">${l}</button>`).join("")}</div>
  <div id="mb" class="stack" style="gap:14px"></div>`;
  $$(".tabs [data-t]",root).forEach(b=>b.addEventListener("click",()=>replace("module",id,b.dataset.t)));
  const B=$("#mb");
  if(tab==="seq"){
    B.innerHTML=s.seq.map((st,i)=>`<details class="acc" data-i="${i}"${i===0?" open":""}><summary><span class="n">${pad2(i+1)}</span><span class="st"><b>${esc(st.t)}</b><span>${esc(st.how.split(/(?<=\.)\s/)[0])}</span></span><span class="v v-${st.v}">${VERDICT[st.v]}</span></summary>
      <div class="acc-body">${(()=>{const f=(st.signs||[]).map(k=>SIGNS[k]&&SIGNS[k].fig).find(f=>f&&FIG[f]);return f?fig(f,{small:true}):"";})()}<div><span class="k">How</span>${esc(st.how)}</div><div><span class="k">Why it works</span>${esc(st.why)}</div><div><span class="k">What you find</span>${esc(st.find)}</div>
      ${st.signs&&st.signs.length?`<div><span class="k">Evidence for the signs in this step</span><div class="chips">${st.signs.map(signChip).join("")}</div></div>`:""}
      ${st.sounds?`<div><span class="k">Listen</span><div class="sp" data-sound="${st.sounds[0]}"></div><div class="chips" style="margin-top:8px">${st.sounds.map(soundChip).join("")}</div></div>`:""}</div></details>`).join("");
    /* create players lazily when a step opens */
    const mount=d=>{const sp=$(".sp",d);if(sp&&!sp.dataset.on){sp.dataset.on=1;mk(sp,sp.dataset.sound);}};
    $$("details.acc",B).forEach(d=>{d.addEventListener("toggle",()=>{if(d.open)mount(d);});if(d.open)mount(d);});
  }else if(tab==="atlas"){
    const draw=()=>{B.innerHTML=dermAtlasHTML();bindAtlas(B,draw);};draw();
  }else if(tab==="morph"){
    B.innerHTML=`<div class="list">${[["learn/dmorph","The words of the skin","Primary and secondary lesions, shapes, colours, palpation, distributions, each with a picture"],["learn/describe","Describe like a dermatologist","The order, the sentence, a builder and tips"],["learn/demerg","Skin that can kill","SJS/TEN, DRESS, necrotising fasciitis, meningococcal, erythroderma"]].map(([g,t,d])=>`<button class="lrow" data-go="${g}"><span class="txt"><b>${t}</b><span>${d}</span></span>${ic("chev","chev")}</button>`).join("")}</div>`;
  }else if(tab==="describe"){
    B.innerHTML=`<div class="card stack" style="gap:10px"><span class="eyebrow">The sentence</span><p class="mono small">${esc(DESCRIBE.formula)}</p><p class="hook">${esc(DESCRIBE.example)}</p><div class="row-x"><button class="btn" data-go="practice/describe">${ic("target")}Practise on plates</button><button class="btn soft" data-go="learn/describe">Full guide and builder</button></div></div>`;
  }else if(tab==="tool"){
    B.innerHTML=`<div class="list">${[["learn/neuromap","Dermatomes and nerves","Body map and quiz"],["learn/localise","Where is the lesion?","Localisation, cord syndromes, gaits"],["learn/rootnerve","Root or nerve?","The deciding test for common dilemmas"],["learn/myotomes","Myotomes and reflexes","Key muscles and reflex roots"],["learn/cranial","Cranial nerves","Screen and pearls"]].map(([g,t,d])=>`<button class="lrow" data-go="${g}"><span class="txt"><b>${t}</b><span>${d}</span></span>${ic("chev","chev")}</button>`).join("")}</div>`;
  }else if(tab==="reg"){
    B.innerHTML=`<p class="muted small">Each region: landmarks, normal range, look–feel–move, and the special tests ranked by evidence.</p><div class="grid g2">${REGIONS.map(r=>{const n=r.tests.length;return `<button class="tile" data-go="learn/region/${r.id}"><div class="t-top"><b>${esc(r.name)}</b>${ic("chev","chev")}</div>${fig(r.fig,{small:true,nocap:true})}<span class="sub">${n} tests · ${r.land.length} landmarks</span></button>`;}).join("")}</div>`;
  }else if(tab==="anat"){
    B.innerHTML=`${s.anatomy?anatMap(s.anatomy):""}<div class="card"><div class="sec"><h3>Landmarks to know</h3><ul class="prose" style="padding-left:1.1em">${s.anatomyNotes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div></div>
     ${id==="cvs"||id==="resp"?`<button class="tile" data-go="sounds/map"><div class="t-top"><span class="icwrap">${ic("map")}</span></div><b>Listening points on the chest map</b><span class="sub">Heart areas and lung zones with the reason for each.</span></button>`:""}`;
    if(s.anatomy)bindAnat(s.anatomy);
  }else if(tab==="hist"){
    const rel={cvs:["chest","sync"],resp:["dysp"],abd:["abdo"],neuro:["head","dizz"],msk:["back"],gen:["fever"],hn:[]}[id]||[];
    const why=s.histWhy||[];
    B.innerHTML=`<div class="card"><div class="sec"><h3>The focused history</h3>${why.length?`<div class="stack" style="gap:4px">${why.map(w=>`<details class="acc why"><summary><span class="st"><b>${esc(w.item)}</b></span></summary><div class="acc-body"><div>${esc(w.why)}</div></div></details>`).join("")}</div>`:`<ul class="prose" style="padding-left:1.1em">${s.hist.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>`}</div></div>
     ${rel.length?`<div class="section"><span class="label">Presentations with likelihood ratios</span><div class="list">${rel.map(pid=>{const p=HIST.pres.find(x=>x.id===pid);return `<button class="lrow" data-go="learn/pres/${pid}"><span class="txt"><b>${esc(p.name)}</b><span>${p.lr.length} clues · ${p.red.length} red flags</span></span>${ic("chev","chev")}</button>`;}).join("")}</div></div>`:""}`;
  }else if(tab==="think"){
    B.innerHTML=`<p class="muted small">Cover the right-hand column and say what you'd think before reading it. These come back in your daily session.</p><div class="think">${s.think.map(([f,t])=>`<div class="t"><b>${esc(f)}</b><span>${esc(t)}</span></div>`).join("")}</div>`;
  }else{
    B.innerHTML=`<div class="card"><div class="sec"><h3>Where people go wrong</h3><ul class="prose" style="padding-left:1.1em">${s.pitfalls.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div></div>
     <div class="card row-x"><span style="flex:1;min-width:200px">${done?"You've marked this module as read.":"Finished reading the module? Mark it so it shows on your overview."}</span><button class="btn ${done?"ghost":""} sm" id="mdone">${done?"Unmark":"Mark as read"}</button></div>`;
    $("#mdone").addEventListener("click",()=>{const a=Store.s.mods,i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);Store.save();replace("module",id,"pit");});
  }
});


/* ---------- MSK region page ---------- */
route("learn:region",(id)=>(REGIONS.find(r=>r.id===id)||{}).name||"Region",(root,id)=>{
  const r=REGIONS.find(x=>x.id===id);if(!r)throw new Error("Region not found");
  const vo=v=>VERDICT_ORDER.indexOf(v);
  const T=r.tests.map(k=>[k,SIGNS[k]]).filter(([,x])=>x).sort((a,b)=>vo(a[1].v)-vo(b[1].v)||((b[1].p||0)-(a[1].p||0)));
  const sn=v=>v==null?"–":v+"%";
  const m=mastery("reg:"+id);
  root.innerHTML=`<section class="ph"><span class="eyebrow">Musculoskeletal · region</span><h1>${esc(r.name)}</h1><p class="lede">${esc(r.intro)}</p>
    <div class="row-x"><button class="btn sm" data-go="practice/session/reg:${id}">${ic("calendar")}Review this region</button><span class="small muted">${m.seen}/${m.n} cards started</span></div></section>
   ${fig(r.fig)}
   <div class="card stack" style="gap:12px"><span class="eyebrow">Surface anatomy</span>${r.land.map(([a,b,c])=>`<div class="lm"><b>${esc(a)}</b><span><i>Where:</i> ${esc(b)}</span><span><i>Why:</i> ${esc(c)}</span></div>`).join("")}</div>
   <div class="card stack" style="gap:16px"><div class="sec"><h3>Look</h3><p>${esc(r.look)}</p></div><div class="sec"><h3>Feel</h3><p>${esc(r.feel)}</p></div><div class="sec"><h3>Move</h3><p>${esc(r.move)}</p></div>
    <div class="tscroll"><table class="ttab"><thead><tr><th>Movement</th><th>Normal range</th></tr></thead><tbody>${r.rom.map(([a,b])=>`<tr><td>${esc(a)}</td><td class="num">${esc(b)}</td></tr>`).join("")}</tbody></table></div></div>
   <div class="card stack" style="gap:10px"><span class="eyebrow">Special tests, best first</span><div class="list">${T.map(([k,x])=>`<button class="lrow" data-go="signs/sign/${k}"><span class="txt"><b>${esc(x.name)}</b><span>${esc(x.target)}</span><span class="lrrow" style="margin-top:4px">${x.sens!=null?`<span class="lr weak">Sn ${esc(x.sens)}%</span>`:""}${x.spec!=null?`<span class="lr weak">Sp ${esc(x.spec)}%</span>`:""}${x.p!=null?`<span class="lr ${lrClass(x.p)}">LR+ ${esc(x.p)}</span>`:""}${x.n!=null?`<span class="lr ${lrClass(x.n)}">LR− ${esc(x.n)}</span>`:""}</span></span><span class="v v-${x.v}">${VERDICT[x.v]}</span></button>`).join("")}</div>
    <p class="small muted">Tap a test for how to do it, the anatomy and why it works.</p></div>
   <div class="section"><span class="label">What to think</span><div class="think">${r.think.map(([f,t])=>`<div class="t"><b>${esc(f)}</b><span>${esc(t)}</span></div>`).join("")}</div></div>
   <div class="card"><div class="sec"><h3>Pitfalls</h3><ul class="prose" style="padding-left:1.1em">${r.pitfalls.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div></div>`;
});
/* surface anatomy maps (data in ANAT) */
const OUTLINES={
 chest:()=>{const ribs=[];for(let i=0;i<7;i++){const y=82+i*24;ribs.push(`<path d="M138 ${y} C 112 ${y-4}, 78 ${y+2}, 52 ${y+26}"/><path d="M162 ${y} C 188 ${y-4}, 222 ${y+2}, 248 ${y+26}"/>`);}
  return `<path d="M60 52 C 90 40, 120 46, 150 46 C 180 46, 210 40, 240 52 C 262 70, 268 150, 262 270 L 38 270 C 32 150, 38 70, 60 52 Z" fill="var(--surface2)" stroke="var(--line)"/><g fill="none" stroke="var(--muted)" stroke-opacity=".35" stroke-width="1.2">${ribs.join("")}</g><path d="M148 58 L 74 50 M152 58 L 226 50" stroke="var(--muted)" stroke-width="3" stroke-linecap="round" opacity=".45"/><rect x="138" y="62" width="24" height="168" rx="8" fill="var(--surface)" stroke="var(--line)"/><path d="M140 96 C 132 120, 128 150, 132 172 C 140 192, 168 200, 214 196 C 226 186, 220 150, 196 124 C 186 108, 170 98, 160 96 Z" fill="var(--accent)" opacity=".12" stroke="var(--accent)" stroke-opacity=".4"/>`;},
 abdomen:()=>`<path d="M70 40 C 100 30, 200 30, 230 40 C 240 60, 236 120, 232 180 C 230 230, 215 262, 150 268 C 85 262, 70 230, 68 180 C 64 120, 60 60, 70 40 Z" fill="var(--surface2)" stroke="var(--line)"/><path d="M110 40 C 120 60, 180 60, 190 40" fill="none" stroke="var(--muted)" stroke-width="2" opacity=".5"/><path d="M110 40 C 90 52, 78 70, 72 96 M190 40 C 210 52, 222 70, 228 96" fill="none" stroke="var(--muted)" stroke-width="2" opacity=".5"/><g stroke="var(--accent)" stroke-dasharray="4 4" opacity=".55" fill="none"><path d="M122 36 V 262 M178 36 V 262 M66 122 H 234 M66 178 H 234"/></g><circle cx="150" cy="150" r="4" fill="none" stroke="var(--ink)" opacity=".5"/><path d="M78 232 L 138 258 M222 232 L 162 258" stroke="var(--muted)" stroke-width="2" opacity=".5"/><text x="150" y="286" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="var(--f-mono)">Dashed: midclavicular lines · L1 and L5 planes</text>`,
 neck:()=>`<path d="M100 20 C 100 0, 200 0, 200 20 C 212 50, 205 80, 188 92 L 188 120 C 215 130, 240 150, 250 200 L 50 200 C 60 150, 85 130, 112 120 L 112 92 C 95 80, 88 50, 100 20 Z" fill="var(--surface2)" stroke="var(--line)"/><path d="M118 100 C 125 130, 150 180, 158 200 M182 100 C 175 130, 150 180, 142 200" fill="none" stroke="var(--muted)" stroke-width="2" opacity=".45"/><path d="M150 108 V 200" stroke="var(--muted)" stroke-dasharray="3 3" opacity=".5"/><ellipse cx="150" cy="172" rx="22" ry="12" fill="var(--accent)" opacity=".18" stroke="var(--accent)" stroke-opacity=".5"/><path d="M62 200 C 100 190, 200 190, 238 200" stroke="var(--muted)" stroke-width="3" opacity=".4" fill="none"/><text x="150" y="226" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="var(--f-mono)">Front view · shaded: thyroid</text>`,
 back:()=>`<path d="M62 40 C 90 30, 210 30, 238 40 C 250 90, 252 180, 240 262 L 60 262 C 48 180, 50 90, 62 40 Z" fill="var(--surface2)" stroke="var(--line)"/><path d="M150 40 V 250" stroke="var(--muted)" stroke-width="2" opacity=".45"/><g fill="none" stroke="var(--muted)" opacity=".4"><path d="M70 84 C 95 70, 115 80, 118 110 L 108 148 C 90 140, 75 120, 70 84 Z M230 84 C 205 70, 185 80, 182 110 L 192 148 C 210 140, 225 120, 230 84 Z"/></g><path d="M56 212 C 90 204, 210 204, 244 212" stroke="var(--muted)" stroke-width="2" opacity=".45" fill="none"/><text x="150" y="286" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="var(--f-mono)">Back view · scapulae and iliac crests outlined</text>`
};
const anatSel={};
function anatMap(key){const a=ANAT[key];const sel=anatSel[key]||a.pts[0].k;const vb=key==="neck"?"0 0 300 240":"0 0 300 300";
  return `<div class="mapgrid"><div class="card"><svg viewBox="${vb}" role="img" aria-label="${esc(a.title)}">${OUTLINES[key]()}${a.pts.map((p,i)=>`<g class="pt${p.k===sel?" on":""}" data-pt="${p.k}" tabindex="0" role="button" aria-label="${esc(p.n)}"><circle cx="${p.x}" cy="${p.y}" r="10"/><text x="${p.x}" y="${p.y+3}" text-anchor="middle">${i+1}</text></g>`).join("")}</svg><p class="tiny muted" style="margin-top:8px">${esc(a.note)}</p></div><div class="card stack" id="anatInfo"></div></div>`;}
function bindAnat(key){const a=ANAT[key];
  const show=k=>{anatSel[key]=k;const p=a.pts.find(x=>x.k===k),i=a.pts.indexOf(p);$$(".mapgrid .pt").forEach(g=>g.classList.toggle("on",g.dataset.pt===k));
    $("#anatInfo").innerHTML=`<span class="eyebrow">${esc(a.title)} · ${i+1} of ${a.pts.length}</span><h2>${esc(p.n)}</h2><dl class="kv"><dt>Where</dt><dd>${esc(p.at)}</dd></dl><div class="sec"><h3>Why it matters</h3><p>${esc(p.why)}</p></div>
     <div class="row-x"><button class="btn ghost sm" data-step="-1">Previous</button><button class="btn sm" data-step="1">Next point</button></div>`;
    $$("#anatInfo [data-step]").forEach(b=>b.addEventListener("click",()=>show(a.pts[(i+ +b.dataset.step+a.pts.length)%a.pts.length].k)));};
  $$(".mapgrid .pt").forEach(g=>{g.addEventListener("click",()=>show(g.dataset.pt));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();show(g.dataset.pt);}});});
  show(anatSel[key]||a.pts[0].k);}

/* ---------- history ---------- */
route("learn:frames","History frameworks",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">History taking</span><h1>Frameworks that hold up on a busy shift</h1></section>
  <div class="stack">${HIST.frames.map((c,i)=>`<details class="acc"${i===0?" open":""}><summary><span class="n">${pad2(i+1)}</span><span class="st"><b>${esc(c.t)}</b></span></summary><div class="acc-body prose">${c.body}${c.why&&c.why.length?`<div class="stack" style="gap:4px;margin-top:8px">${c.why.map(w=>`<div class="lm"><b>${esc(w.item)}</b><span>${esc(w.why)}</span></div>`).join("")}</div>`:""}</div></details>`).join("")}</div>
  <button class="tile" data-go="learn/pres"><div class="t-top"><span class="icwrap">${ic("scale")}</span></div><b>Presentations</b><span class="sub">The clues that move probability for ${HIST.pres.length} common complaints.</span></button>`;
});
route("learn:pres",(id)=>id?(HIST.pres.find(p=>p.id===id)||{}).name:"Presentations",(root,id)=>{
  const p=id&&HIST.pres.find(x=>x.id===id);
  if(!p){root.innerHTML=`<section class="ph"><span class="eyebrow">History taking</span><h1>The questions that move probability</h1><p class="lede">For each complaint: what to ask, which answers shift the odds and by how much, the red flags, and the differential to keep in view.</p></section>
    <div class="list">${HIST.pres.map(x=>`<button class="lrow" data-go="learn/pres/${x.id}"><span class="icwrap n">${ic("history")}</span><span class="txt"><b>${esc(x.name)}</b><span>${x.lr.length} clues · ${x.red.length} red flags · ${x.dd.length} differentials</span></span>${ic("chev","chev")}</button>`).join("")}</div>`;return;}
  root.innerHTML=`<section class="ph"><span class="eyebrow">History · presentation</span><h1>${esc(p.name)}</h1></section>
   ${p.frame?`<p class="quote">${esc(p.frame)}</p>`:""}
   <div class="card stack" style="gap:6px"><span class="eyebrow">Ask, and why</span>${p.ask.map((a,i)=>typeof a==="string"?`<p class="small">${esc(a)}</p>`:`<details class="acc why"><summary><span class="st"><b>${esc(a.q)}</b>${a.lr!=null?`<span class="lr ${lrClass(a.lr)}" style="font-size:.72rem">LR ${a.lr}${a.target?" · "+esc(a.target):""}</span>`:""}</span></summary><div class="acc-body"><div><span class="k">Why</span>${esc(a.why)}</div>${a.changes?`<div><span class="k">What changes</span>${esc(a.changes)}</div>`:""}${a.src?`<div class="tiny muted">${esc(a.src)}</div>`:""}</div></details>`).join("")}</div>
   <div class="section"><span class="label">Clues that shift probability</span>${presClues(p)}</div>
   <div class="card stack"><h3>Red flags</h3>${p.red.map(r=>`<div class="redflag">${esc(r)}</div>`).join("")}</div>
   <div class="section"><span class="label">Differential to keep in view</span><div class="chips">${p.dd.map(d=>`<span class="chip">${esc(d)}</span>`).join("")}</div></div>
   ${presLinks(p)}`;
});
/* the clue table: a null LR is "not quantified" (never "strong"); the source and caveat of each row open on a tap */
function presClues(p){const src=p.lrSrc||{};let n=0;
  const rows=p.lr.map(([f,t,l])=>{const s=src[f],lr=l==null?`<span class="lr nolr">not quantified</span>`:`<span class="lr ${lrClass(l)}">LR ${esc(l)}</span>`;
    const inner=`<span class="cf">${esc(f)}</span><span class="ct">${esc(t)}</span><span class="cl">${lr}${s?`<span class="src-dot" aria-hidden="true">${++n}</span>`:""}</span>`;
    return s?`<details class="clue"><summary aria-label="${esc(f)}: ${esc(t)}, ${l==null?"not quantified":"LR "+esc(l)}. Show source">${inner}</summary><div class="cs"><span class="tiny muted">Source and caveat · </span>${esc(s)}</div></details>`:`<div class="clue"><div class="row">${inner}</div></div>`;}).join("");
  return `<div class="clues"><div class="ch" aria-hidden="true"><span>Clue</span><span>Points to</span><span>LR</span></div>${rows}</div>
   <p class="tiny muted" style="margin-top:6px">${n?"Tap a numbered row for its source and caveats. ":""}“Not quantified” means no likelihood ratio we can stand behind, not that the clue is strong. Blue ratios below 1 make the diagnosis less likely.</p>`;}
/* close the loop: the examination, the scores and the cases that go with a presentation (curated, ids checked at render) */
const PRES_TOOLS={chest:["heart","wells-pe","perc","years","age-adjusted-ddimer"],dysp:["wells-pe","perc","curb65","news2"],head:["ottawa-sah","cchr","gcs"],
  abdo:["alvarado","air"],sync:["qtc-bazett","shock-index"],dizz:["abcd2"],fever:["news2","qsofa"],palp:["cha2ds2va","hasbled","qtc-bazett"],
  cough:["curb65","wells-pe"],legswell:["wells-dvt","age-adjusted-ddimer"],joint:["kocher"],rash:["lrinec","scorten"],weak:["abcd2","gcs"],
  throat:["centor","feverpain"],trauma:["gcs","nexus","ccsr","cchr","pecarn-u2","pecarn-2plus","ottawa-ankle","ottawa-knee","shock-index","parkland"],dysuria:["egfr-ckdepi-2021"]};
function presLinks(p){
  const mod=SYSTEMS.find(m=>m.id===p.sys),tools=(PRES_TOOLS[p.id]||[]).map(id=>TOOLS.find(t=>t.id===id)).filter(Boolean);
  const cases=HDPE.filter(c=>c.sys===p.sys).slice(0,4);
  const halls=typeof HALLS!=="undefined"&&typeof hallPres==="function"?HALLS.filter(h=>{try{return hallPres(h.id).some(x=>x.id===p.id);}catch(e){return false;}}):[];
  const grp=[];
  if(mod)grp.push(["Examine next",`<button class="chip" data-go="learn/module/${esc(mod.id)}">${ic("learn")}${esc(mod.name)}</button>`]);
  if(tools.length)grp.push(["Score it",tools.map(t=>`<button class="chip" data-go="tools/calc/${esc(t.id)}">${ic("scale")}${esc(t.name)}</button>`).join("")]);
  if(cases.length)grp.push(["Practise",cases.map(c=>`<button class="chip" data-go="practice/hdpe/${esc(c.id)}">${ic("target")}${esc(c.title)}</button>`).join("")]);
  if(halls.length)grp.push(["In the theatre",halls.map(h=>`<button class="chip" data-go="learn/hall/${esc(h.id)}">${ic("door")}${esc(h.n)}</button>`).join("")]);
  return grp.length?`<section class="section"><span class="label">Next</span><div class="card xlinks">${grp.map(([k,c])=>`<div><span class="xk">${k}</span><div class="chips">${c}</div></div>`).join("")}</div></section>`:"";}

/* ---------- method ---------- */
route("learn:method","How to learn",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">The method</span><h1>How to get better at examination</h1><p class="lede">${esc(METHOD.intro)}</p></section>
  <div class="stack">${METHOD.rules.map((r,i)=>`<details class="acc"${i<1?" open":""}><summary><span class="icwrap">${ic(r.ic)}</span><span class="st"><b>${esc(r.k)}</b><span>${esc(r.app.split(":")[0])}</span></span></summary>
    <div class="acc-body" style="padding-left:16px"><p>${esc(r.body)}</p><div class="note acc"><b>In this app.</b> ${esc(r.app)}</div><div class="tiny muted">Sources: ${r.src.map(([t,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(" · ")}</div></div></details>`).join("")}</div>
  <section class="section"><span class="label">A routine that uses all of it</span><div class="list">${METHOD.routine.map(([a,b])=>`<div class="lrow"><span class="txt"><b>${esc(a)}</b><span>${esc(b)}</span></span></div>`).join("")}</div></section>
  <p class="tiny muted">Likelihood ratios in this app are rounded from McGee's <em>Evidence-Based Physical Diagnosis</em> and the JAMA Rational Clinical Examination series. They vary between studies; treat them as orders of magnitude. For learning, not for diagnosis.</p>`;
});
