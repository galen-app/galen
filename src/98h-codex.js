"use strict";
/* The codex: list and timeline views, story pages, and the story blocks on sign and technique pages.
   Read state lives in Store.s.notes["lore:<id>"] = {t:last read, v:1, f:first read} (per record, timestamped, merges across devices). */
/* ================= THE CODEX ================= */
const LORE_KINDS=["dark","triumph","eponym","theatre"];
/* start year of a story, for sorting and the timeline: explicit l.y, else the dd/mm/yyyy date, else the first number ("c. 400 BC" is -400) */
function loreYear(l){if(typeof l.y==="number")return l.y;const s=String(l.yr||"");let m=s.match(/(\d{1,2})\/(\d{1,2})\/(\d{3,4})/);if(m)return +m[3];m=s.match(/(\d{1,4})s?\s*(BC)?/);if(!m)return 0;return m[2]?-(+m[1]):+m[1];}
const LORE_CHRON=()=>LORE.slice().sort((a,b)=>loreYear(a)-loreYear(b)||LORE.indexOf(a)-LORE.indexOf(b));
function loreRead(id){const n=Store.s.notes&&Store.s.notes["lore:"+id];return !!(n&&n.v);}
function loreReadCount(){return LORE.filter(l=>loreRead(l.id)).length;}
function loreMarkRead(id){const k="lore:"+id,p=Store.s.notes[k],now=Date.now();Store.s.notes[k]={t:now,v:1,f:(p&&(p.f||p.t))||now};Store.save();}
const yrText=y=>y<0?`${-y} BC`:String(y);
/* the story card used everywhere (codex, home, halls, reference pane). Kind classes are prefixed (kind-*) so "theatre" no longer collides with the home .theatre container. */
function codexCard(l,opt={}){const rd=loreRead(l.id);
  return `<button class="tile lorecard${rd?" is-read":""}" data-go="learn/lore/${l.id}"><span class="lc-top"><span class="k kind-${l.k}"><i class="kmark" aria-hidden="true"></i>${LORE_KIND[l.k]}</span>${l.leg?`<span class="lc-leg">legend noted</span>`:""}<span class="spacer"></span><span class="yr">${esc(l.yr)}</span></span><b>${esc(l.t)}</b><span class="sub">${esc(l.sum)}</span>${opt.hall||rd?`<span class="lc-foot">${opt.hall?`<span class="tiny muted">${esc(HALL[l.hall].n)}</span>`:""}<span class="spacer"></span>${rd?`<span class="lc-read">${ic("check")}read</span>`:""}</span>`:""}</button>`;}
try{loreCard=codexCard;}catch(e){}

let CX={k:"all",h:"",view:"list",unread:false,lane:"hall",sel:null};
try{const v=JSON.parse(localStorage.getItem("galen.codex.ui")||"null");if(v&&typeof v==="object")CX={...CX,...v,sel:null};}catch(e){}
const cxSave=()=>{try{localStorage.setItem("galen.codex.ui",JSON.stringify({k:CX.k,h:CX.h,view:CX.view,unread:CX.unread,lane:CX.lane}));}catch(e){}};
if(!["all",...LORE_KINDS].includes(CX.k))CX.k="all";if(CX.h&&!HALL[CX.h])CX.h="";

/* timeline scale: eras get widths roughly in proportion to how many stories they hold */
const CX_ERAS=[[-450,500,"Antiquity",8],[500,1500,"Islamic golden age",10],[1500,1700,"Renaissance",10],[1700,1800,"Enlightenment",13],[1800,1850,"",16],[1850,1900,"",16],[1900,1950,"",15],[1950,2030,"",12]];
/* returns 0..CX_TOTAL; a 1.5% margin each side keeps the first and last marks clear of the lane labels */
function cxX(y){let x=0;for(const [a,b,,w] of CX_ERAS){if(y<b||b===2030){x+=w*Math.min(1,Math.max(0,(y-a)/(b-a)));break;}x+=w;}return 1.5+x/CX_TOTAL*97;}
const CX_TOTAL=CX_ERAS.reduce((a,e)=>a+e[3],0);
const cxEra=y=>{const e=CX_ERAS.find(([a,b])=>y<b)||CX_ERAS[CX_ERAS.length-1];return e[2]||`${e[0]} to ${e[1]===2030?"today":e[1]}`;};

function cxList(){let list=LORE.filter(l=>(CX.k==="all"||l.k===CX.k)&&(!CX.h||l.hall===CX.h));
  if(CX.unread)list=list.filter(l=>!loreRead(l.id)).concat(list.filter(l=>loreRead(l.id)));return list;}

function cxTimeline(list){
  const lanes=CX.lane==="kind"?LORE_KINDS.map(k=>({id:k,n:LORE_KIND[k]})):HALLS.map(h=>({id:h.id,n:h.short||h.n}));
  const W=1100,D=24;/* collision check at the minimum width */
  const rows=lanes.map(ln=>{const items=list.filter(l=>(CX.lane==="kind"?l.k:l.hall)===ln.id).map(l=>({l,y:loreYear(l)})).sort((a,b)=>a.y-b.y);
    const lastX=[];items.forEach(it=>{it.x=cxX(it.y);const px=it.x/100*W;let r=0;while(lastX[r]!=null&&px-lastX[r]<D)r++;lastX[r]=px;it.r=r;});
    return {ln,items,depth:Math.max(1,lastX.length)};}).filter(r=>r.items.length||(CX.k==="all"&&!CX.h));
  let acc=0;const ticks=CX_ERAS.map(([a,,n,w])=>{const t={x:1.5+acc/CX_TOTAL*97,y:a,n,w:w/CX_TOTAL*97};acc+=w;return t;});
  const axis=`<div class="cx-axis" aria-hidden="true">${ticks.map((t,i)=>`<span class="cx-tick" style="left:${t.x.toFixed(2)}%;max-width:${t.w.toFixed(2)}%"><b>${t.y<0?"400 BC":t.y}</b>${t.n?`<i>${esc(t.n)}</i>`:""}</span>`).join("")}<span class="cx-tick end" style="left:98.5%"><b>today</b></span></div>`;
  const lanesHTML=rows.map(({ln,items,depth})=>`<div class="cx-lane" style="--rows:${depth}"><span class="cx-ln">${esc(ln.n)}</span><div class="cx-track">${ticks.slice(1).map(t=>`<i class="cx-grid" style="left:${t.x.toFixed(2)}%"></i>`).join("")}${items.map(({l,x,r})=>{const rd=loreRead(l.id);return `<button class="cx-dot kind-${l.k}${rd?" is-read":""}${CX.sel===l.id?" on":""}" style="left:${x.toFixed(2)}%;--r:${r}" data-sel="${l.id}" aria-label="${esc(l.t)}, ${esc(l.yr)}, ${LORE_KIND[l.k]}${rd?", read":", not read yet"}"></button>`;}).join("")}</div></div>`).join("");
  const sel=CX.sel&&list.find(l=>l.id===CX.sel);
  /* the same stories as a readable chronological list, grouped by era */
  let lastEra="";const chron=list.slice().sort((a,b)=>loreYear(a)-loreYear(b)).map(l=>{const e=cxEra(loreYear(l)),hd=e!==lastEra?`<li class="cx-era"><span>${esc(e)}</span></li>`:"";lastEra=e;const rd=loreRead(l.id);
    return `${hd}<li><button class="cx-row${rd?" is-read":""}" data-go="learn/lore/${l.id}"><span class="yr">${esc(l.yr)}</span><span class="cx-rt"><b>${esc(l.t)}</b><span class="tiny muted"><span class="k kind-${l.k}"><i class="kmark" aria-hidden="true"></i>${LORE_KIND[l.k]}</span> · ${esc(HALL[l.hall].n)}</span></span>${rd?`<span class="lc-read">${ic("check")}<span class="sr-only">read</span></span>`:""}</button></li>`;}).join("");
  return `<div class="cx-tlbar"><div class="seg" role="group" aria-label="Lanes"><button class="chip" data-lane="hall" aria-pressed="${CX.lane==="hall"}">By hall</button><button class="chip" data-lane="kind" aria-pressed="${CX.lane==="kind"}">By kind</button></div>
    <span class="spacer"></span><span class="cx-key" aria-label="Key">${LORE_KINDS.map(k=>`<span><i class="cx-dot sample kind-${k} is-read" aria-hidden="true"></i>${LORE_KIND[k]}</span>`).join("")}<span>filled: read</span><span><i class="cx-dot sample kind-triumph" aria-hidden="true"></i>hollow: not read yet</span></span></div>
   <div class="cx-tl" role="group" aria-label="Timeline of the stories: scroll sideways, tap a mark">${list.length?`<div class="cx-tl-in">${axis}${lanesHTML}</div>`:`<p class="muted" style="padding:14px">No stories match.</p>`}</div>
   <div class="cx-sel" aria-live="polite">${sel?codexCard(sel,{hall:1}):`<p class="tiny muted">Tap or focus a mark to see the story here. Filled marks are stories you have read.</p>`}</div>
   <ol class="cx-chron" aria-label="The stories in order of time">${chron}</ol>`;
}

route("learn:codex","The codex",(root)=>{
  const found=EGGS.filter(e=>eggFound(e.id));
  root.innerHTML=`<div class="cx"><section class="ph"><span class="eyebrow">The codex</span><h1>Medicine's long argument</h1><p class="lede">The people behind the names, the beliefs that harmed patients for centuries, and the discoveries that won anyway. Every story is tied to something you do at the bedside.</p></section>
   ${guideHTML(GALEN.lore,{small:1})}
   <div class="cx-bar card">
    <div class="cx-line"><div class="seg" role="group" aria-label="View"><button class="chip" data-view="list" aria-pressed="false">${ic("card")}List</button><button class="chip" data-view="time" aria-pressed="false">${ic("history")}Timeline</button></div>
     <span class="spacer"></span><span class="cx-count" aria-live="polite"></span></div>
    <div class="codexfilter" role="group" aria-label="Filter by kind">${[["all","All"],...LORE_KINDS.map(k=>[k,LORE_KIND[k]])].map(([k,t])=>`<button class="chip${k!=="all"?" kind-"+k:""}" aria-pressed="false" data-f="${k}">${k!=="all"?`<i class="kmark" aria-hidden="true"></i>`:""}${t}<span class="n"></span></button>`).join("")}</div>
    <div class="cx-line"><select class="sel" id="cx-hall" aria-label="Stories of one hall"><option value="">Every hall</option>${HALLS.map(h=>`<option value="${h.id}">${esc(h.n)}</option>`).join("")}</select>
     <button class="chip" id="cx-unread" aria-pressed="false">Unread first</button><span class="spacer"></span><button class="link small" id="cx-jump">Marginalia · ${found.length} of ${EGGS.length}</button></div>
   </div>
   <div id="cx-out"></div>
   <section class="section" id="cx-marg"><span class="label">Marginalia · ${found.length} of ${EGGS.length} secrets found</span><div class="card stack" style="gap:8px">${EGGS.map(e=>eggFound(e.id)?`<button class="link" style="text-align:left" data-egg-show="${e.id}"><span class="marg"><b>${esc(e.t)}</b> · found</span></button>`:`<span class="marg">${esc(e.hint)}</span>`).join("")}</div></section></div>`;
  const cx=$(".cx",root),out=$("#cx-out",root),hallSel=$("#cx-hall",root);hallSel.value=CX.h;
  const update=()=>{const list=cxList(),inHall=LORE.filter(l=>!CX.h||l.hall===CX.h);
    $$("[data-f]",root).forEach(b=>{b.setAttribute("aria-pressed",String(CX.k===b.dataset.f));const n=b.dataset.f==="all"?inHall.length:inHall.filter(l=>l.k===b.dataset.f).length;$(".n",b).textContent=" "+n;});
    $$("[data-view]",root).forEach(b=>b.setAttribute("aria-pressed",String(CX.view===b.dataset.view)));
    $("#cx-unread",root).setAttribute("aria-pressed",String(CX.unread));
    const rd=list.filter(l=>loreRead(l.id)).length;
    $(".cx-count",root).textContent=`${list.length} ${list.length===1?"story":"stories"} · ${rd} read · ${loreReadCount()} of ${LORE.length} in all`;
    out.innerHTML=CX.view==="time"?cxTimeline(list):(list.length?`<div class="grid">${list.map(l=>codexCard(l,{hall:1})).join("")}</div>`:`<div class="card"><p class="muted">No stories of this kind in this hall yet.</p><button class="btn ghost sm" data-cx-clear>Show every story</button></div>`);
    cxSave();};
  /* controls stay in place, so focus is kept while the results change */
  cx.addEventListener("click",e=>{const t=e.target.closest("button");if(!t||!cx.contains(t))return;
    if(t.dataset.f){CX.k=t.dataset.f;update();}
    else if(t.dataset.view){CX.view=t.dataset.view;update();}
    else if(t.id==="cx-unread"){CX.unread=!CX.unread;update();}
    else if(t.dataset.lane){CX.lane=t.dataset.lane;update();$(`[data-lane="${CX.lane}"]`,root)?.focus();}
    else if(t.hasAttribute("data-cx-clear")){CX.k="all";CX.h="";hallSel.value="";update();}
    else if(t.id==="cx-jump"){$("#cx-marg",root).scrollIntoView({behavior:"smooth",block:"start"});}
    else if(t.dataset.sel){cxSelect(t.dataset.sel);}
    else if(t.dataset.eggShow){showEgg(EGGS.find(x=>x.id===t.dataset.eggShow),false);}});
  const cxSelect=id=>{if(CX.sel===id)return;CX.sel=id;$$(".cx-dot.on",root).forEach(d=>d.classList.remove("on"));$(`.cx-dot[data-sel="${id}"]`,root)?.classList.add("on");const l=loreById(id),box=$(".cx-sel",root);if(l&&box)box.innerHTML=codexCard(l,{hall:1});};
  cx.addEventListener("focusin",e=>{const t=e.target.closest&&e.target.closest(".cx-dot[data-sel]");if(t)cxSelect(t.dataset.sel);});
  hallSel.addEventListener("change",()=>{CX.h=hallSel.value;update();});
  update();
});

route("learn:lore",(id)=>(loreById(id)||{}).t||"Story",(root,id)=>{
  const l=loreById(id);
  if(!l){root.innerHTML=`<section class="ph"><span class="eyebrow">The codex</span><h1>No story by that name</h1><p class="lede">There is no story called "${esc(id||"")}". It may have been renamed.</p></section>
    <div class="row-x"><button class="btn" data-go="learn/codex">${ic("scroll")}All ${LORE.length} stories</button><button class="btn ghost" data-act="pal">${ic("search")}Search</button></div>`;return;}
  const h=HALL[l.hall],ch=LORE_CHRON(),i=ch.indexOf(l),pv=ch[(i-1+ch.length)%ch.length],nx=ch[(i+1)%ch.length];
  const inHall=ch.filter(x=>x.hall===l.hall),hn=inHall.length>1?inHall[(inHall.indexOf(l)+1)%inHall.length]:null;
  const prev=Store.s.notes["lore:"+id];const first=prev&&(prev.f||prev.t);loreMarkRead(id);
  const sg=(l.signs||[]).filter(s=>SIGNS[s]),go=(l.go||[]).filter(g=>Array.isArray(g)&&g[0]);
  const srcHTML=esc(l.src)+(l.doi&&l.doi.length?` · ${l.doi.map(d=>`<a href="https://doi.org/${esc(d)}" target="_blank" rel="noopener">doi:${esc(d)}</a>`).join(" · ")}`:"");
  root.innerHTML=`<section class="ph"><span class="lore-meta"><span class="k kind-${l.k}"><i class="kmark" aria-hidden="true"></i>${LORE_KIND[l.k]}</span>${l.leg?`<span class="lc-leg">legend noted</span>`:""}<span class="spacer"></span><span class="latin" style="font-size:1rem">${esc(l.yr)}</span></span><h1>${esc(l.t)}</h1><p class="lede">${esc(l.who)}</p>
   <p class="tiny muted">Story ${i+1} of ${ch.length}, in order of time · ${esc(h.n)}${first?` · first read ${fmtDate(first)}`:""}</p></section>
  <article class="lore-body">${l.body.map(p=>`<p>${esc(p)}</p>`).join("")}</article>
  ${Array.isArray(l.q)&&l.q[1]?`<figure class="lore-q">${l.q[0]?`<blockquote lang="${/[àâçéèêîôû]|\bJe\b/.test(l.q[0])?"fr":"la"}" class="orig">${esc(l.q[0])}</blockquote>`:""}<blockquote class="tr">${esc(l.q[1])}</blockquote>${l.q[2]?`<figcaption>${esc(l.q[2])}</figcaption>`:""}</figure>`:""}
  ${LORE_OUT[l.id]?`<div class="card lore-out"><span class="label">The story in outline</span><dl>${["Before","The turning point","What followed"].map((k,j)=>`<dt>${k}</dt><dd>${esc(LORE_OUT[l.id][j])}</dd>`).join("")}<dt>At the bedside</dt><dd><b>${esc(l.fact)}</b></dd></dl></div>`:`<div class="lore-fact"><b>At the bedside:</b> ${esc(l.fact)}</div>`}
  ${l.leg?`<div class="lore-legend"><span class="label">Fact and legend</span><p>${esc(l.leg)}</p></div>`:""}
  <div class="card">${guideHTML([null,l.galen],{small:1})}</div>
  ${sg.length?`<section class="section"><span class="label">The signs in this story</span><div class="chips">${sg.map(signChip).join("")}</div></section>`:""}
  ${go.length?`<section class="section"><span class="label">Elsewhere in Galen</span><div class="chips">${go.map(([r,t])=>`<button class="chip" data-go="${esc(r)}">${esc(t||r)}</button>`).join("")}</div></section>`:""}
  <nav class="lore-nav" aria-label="More stories"><button class="btn ghost" data-go="learn/lore/${pv.id}" aria-label="Earlier story: ${esc(pv.t)}">${ic("back")}<span><span class="tiny muted">Earlier</span>${esc(pv.t)}</span></button><button class="btn soft" data-go="learn/lore/${nx.id}" aria-label="Later story: ${esc(nx.t)}"><span><span class="tiny muted">Later</span>${esc(nx.t)}</span>${ic("chev")}</button></nav>
  <div class="row-x" style="flex-wrap:wrap"><button class="btn ghost sm" data-go="learn/hall/${l.hall}">${ic("door")}${esc(h.n)}</button>${hn?`<button class="btn ghost sm" data-go="learn/lore/${hn.id}">Next in this hall ${ic("chev")}</button>`:""}<span class="spacer"></span><button class="btn ghost sm" data-go="learn/codex">${ic("scroll")}The codex</button></div>
  <p class="tiny muted lore-src">Source: ${srcHTML}</p>`;
  SND.fx("page");
});

/* sign pages: the codex story goes inside the "History, name and story" section, so there is one place for history */
{const _sign=ROUTES["signs:sign"];ROUTES["signs:sign"]=(root,id)=>{_sign(root,id);const ls=LORE_BY_SIGN[id]||[],h=signHall(id);
  if(ls.length){const cards=`<div class="grid cx-insign">${ls.map(l=>codexCard(l)).join("")}</div>`;
    const acc=$$("details.acc",root).find(d=>/History, name and story/.test(($("summary",d)||{}).textContent||""));
    if(acc){const body=$(".acc-body",acc);const sec=document.createElement("div");sec.className="sec";sec.innerHTML=`<h3>From the codex</h3>${cards}`;body.prepend(sec);
      const sub=$("summary .st span",acc);if(sub)sub.textContent+=` · ${ls.length===1?"a story":ls.length+" stories"} from the codex`;}
    else{const d=document.createElement("details");d.className="acc cx-acc";d.innerHTML=`<summary><span class="st"><b>The story behind it</b><span>${ls.length===1?esc(ls[0].t):ls.length+" stories"} · from the codex</span></span></summary><div class="acc-body">${cards}</div>`;
      const dd=$(".card.dd",root);if(dd)dd.after(d);else root.append(d);}}
  if(h){const el=document.createElement("div");el.className="row-x";el.style.marginTop="8px";el.innerHTML=`<button class="btn ghost sm" data-go="learn/hall/${h}">${ic("door")}${esc(HALL[h].n)}</button>`;root.append(el);}};}
{const _tech=ROUTES["learn:tech"];ROUTES["learn:tech"]=(root,id)=>{_tech(root,id);if(!id)return;const h=techHall(id);if(!h)return;
  const el=document.createElement("div");el.className="row-x";el.innerHTML=`<button class="btn ghost sm" data-go="learn/hall/${h}">${ic("door")}${esc(HALL[h].n)}</button>`;root.append(el);};}
