"use strict";
/* ================= GALEN 7: THE THEATRE =================
   Sound (generated, no files) · Galen the guide · the theatre home · halls · codex · reference pane · eggs · pad + keys.
   Device-only preferences (sound, text size) live in localStorage: a phone at work and a Steam Deck at home differ. */

IC.theatre='<path d="M3 21h18M4 21V10M20 21V10M2 10l10-6 10 6"/><path d="M8 21v-7M12 21v-7M16 21v-7M6 10h12"/>';
IC.scroll='<path d="M6 4h11a2 2 0 0 1 0 4H8v10a2 2 0 0 1-4 0V6a2 2 0 0 1 2-2z"/><path d="M8 8h9v10a2 2 0 0 1-2 2H6M11 12h4M11 15h3"/>';
IC.sound='<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>';
IC.mute='<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>';
IC.door='<path d="M6 21V9a6 6 0 0 1 12 0v12M4 21h16"/><circle cx="14.5" cy="14" r=".8"/>';
IC.pad='<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="16" cy="11.5" r="1"/><circle cx="18.5" cy="14" r="1"/>';

/* ---------- device preferences ---------- */
const TP=(()=>{const wide=matchMedia("(min-width:980px)").matches;const d={amb:wide?1:0,music:wide?1:0,tones:1,vol:.55,size:"m",seen:0};
  try{return Object.assign(d,JSON.parse(localStorage.getItem("galen.theatre")||"{}"));}catch(e){return d;}})();
function tpSave(){try{localStorage.setItem("galen.theatre",JSON.stringify(TP));}catch(e){}}
function applySize(){document.documentElement.dataset.size=TP.size||"m";}
applySize();

/* ================= GALEN: medallion and voice ================= */
let MEDAL_N=0;
function medal(size){const u="md"+(++MEDAL_N);const beads=[...Array(36)].map((_,i)=>{const a=i*Math.PI/18;return `<circle cx="${(50+45.5*Math.cos(a)).toFixed(2)}" cy="${(50+45.5*Math.sin(a)).toFixed(2)}" r="1.5" fill="url(#${u}b)"/>`;}).join("");
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs>
  <radialGradient id="${u}g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#f6dc95"/><stop offset=".5" stop-color="#c99a3e"/><stop offset="1" stop-color="#7c5518"/></radialGradient>
  <radialGradient id="${u}b" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fbe7a8"/><stop offset="1" stop-color="#8a6020"/></radialGradient>
  <linearGradient id="${u}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c46f"/><stop offset="1" stop-color="#9a6f25"/></linearGradient>
  <path id="${u}t" d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0"/></defs>
  <circle cx="50" cy="50" r="49" fill="#6b4712"/><circle cx="50" cy="50" r="47.5" fill="url(#${u}g)"/>${beads}
  <circle cx="50" cy="50" r="41" fill="url(#${u}f)" stroke="#7c5518" stroke-width=".8"/>
  <text font-family="Cormorant SC,Georgia,serif" font-weight="700" font-size="7.4" letter-spacing="1.6" fill="#5a3b0c"><textPath href="#${u}t" startOffset="2%">CL · GALENVS · PERGAMENVS · MEDICVS ·</textPath></text>
  <circle cx="50" cy="50" r="29" fill="#d4ab55" stroke="#7c5518" stroke-width=".6"/>
  <g transform="translate(50 52) scale(.62) translate(-50 -52)" stroke="#5a3b0c" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">
   <path d="M64 86 L64 76 C70 70 71 58 68 50 C66 40 60 33 50 32 C44 32 41 36 40 42 L39 46 L35 51 L39 53 L39 56 L41 57.5 L39.5 59.5 C39 64 39 70 43 74 C46 77 50 78 52 80 L52 86 Z" fill="#b98a35"/>
   <path d="M41 61c3 1 4 4 3 7M44 66c3 0 4 3 3 6M48 70c3 0 4 3 3 5M43 58c2 0 4 1 4 3" fill="none"/>
   <path d="M44 34c3-4 9-5 13-3M50 31c4-2 10 0 13 4M58 34c4 0 7 4 8 8M47 38c2-2 5-2 7 0M55 38c2-1 5 0 6 2M62 42c2 0 4 2 4 4" fill="none"/>
   <path d="M43.5 44.5c1.5-1 3-1 4 0" fill="none"/><circle cx="45.5" cy="45.2" r=".7" fill="#5a3b0c"/>
   <path d="M57 46c2-1 3 1 3 3s-1 4-3 3" fill="none"/>
   <path d="M40 38c-1-3 1-6 4-6M38 42c-3 0-3-4-1-5" fill="none" stroke-width="1"/>
   <path d="M43 33c-2-3 0-6 3-5M49 30c-1-3 2-5 4-3M56 30c0-3 3-4 5-2M62 33c1-2 4-2 5 1M66 38c2-1 4 1 3 3" fill="#c99a3e" stroke-width=".9"/>
  </g></svg>`;}
function timeSlot(){const h=new Date().getHours();return h>=0&&h<5?"night":h<12?"morning":h<17?"afternoon":h<22?"evening":"night";}
function daySeed(){const d=new Date();return d.getFullYear()*400+d.getMonth()*32+d.getDate();}
function galenFor(ctx){
  if(ctx==="home"){
    const bd=BIRTHDAYS[fmtDate(Date.now()).slice(0,5)];if(bd){if(bd[0]==="Babinski")setTimeout(()=>findEgg("birthday",true),1500);return [null,bd[1]];}
    if(!TP.seen){return GALEN.first[0];}
    const last=Store.s.last||0;if(last&&Date.now()-last>4*DAY_MS)return galenPick(GALEN.back,daySeed());
    try{const p=Hub.todayFromPlan();if(p&&p.afterNight)return galenPick(GALEN.afterNight,daySeed());}catch(e){}
    if(timeSlot()==="night"){setTimeout(()=>findEgg("night",true),2500);}
    const pool=GALEN[timeSlot()].concat(GALEN.idle);return galenPick(pool,daySeed()+new Date().getHours());}
  if(GALEN.hall[ctx])return GALEN.hall[ctx];
  return galenPick(GALEN.idle,daySeed());
}
function guideHTML(line,opt={}){const [la,en]=line;return `<div class="guide${opt.small?" small":""}"><button class="medal" data-egg-medal aria-label="Galen">${medal()}</button><div class="say"><span class="who">Galen says</span>${la?`<span class="latin">${esc(la)}</span>`:""}<span class="line">${esc(en)}</span></div></div>`;}

/* quips: the top bar title borrows Galen's voice for a moment, so nothing on the page is covered */
/* ================= THE THEATRE (home) ================= */
function ellPt(cx,cy,rx,ry,a){return [cx+rx*Math.cos(a),cy+ry*Math.sin(a)];}
function theatreSVG(){
  const cx=210,cy=176;let s="";
  /* tiers with balustrades and a faint crowd */
  let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
  [64,86,108,130,152,172].forEach((rx,ti)=>{const ry=rx*.6;s+=`<ellipse class="tier" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke-width="${ti===5?1.6:1}"/>`;
    if(ti>0){const n=Math.round(rx/3.2);for(let k=0;k<n;k++){const a=k/n*Math.PI*2,[x,y]=ellPt(cx,cy,rx-4,ry-3,a);s+=`<line class="rail" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y-4).toFixed(1)}" stroke-width=".8"/>`;}
      const m=Math.round(rx/6);for(let k=0;k<m;k++){if(rnd()<.45)continue;const a=rnd()*Math.PI*2,[x,y]=ellPt(cx,cy,rx-11,ry-8,a);s+=`<circle cx="${x.toFixed(1)}" cy="${(y-6).toFixed(1)}" r="2.3" fill="var(--ink-engr)" opacity=".18"/><path d="M${(x-3).toFixed(1)} ${(y-1).toFixed(1)}q3-4 6 0" stroke="var(--ink-engr)" opacity=".18" fill="none"/>`;}}});
  /* the pit and the table */
  s+=`<ellipse cx="${cx}" cy="${cy}" rx="46" ry="27" fill="var(--surface3)" stroke="var(--ink-engr)" stroke-width="1.2"/>`;
  s+=`<g class="door table" tabindex="0" role="link" aria-label="The Table: the whole patient" data-go="learn/hall/table">
   <rect x="${cx-30}" y="${cy-9}" width="60" height="16" rx="2" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width="1.2"/>
   <path d="M${cx-22} ${cy-1}c6-6 14-6 22-4s14 2 20 4c-6 6-14 6-22 4s-14-2-20-4z" fill="var(--surface2)" stroke="var(--ink-engr)" stroke-width=".8"/>
   <line x1="${cx-26}" y1="${cy+7}" x2="${cx-26}" y2="${cy+14}" stroke="var(--ink-engr)"/><line x1="${cx+26}" y1="${cy+7}" x2="${cx+26}" y2="${cy+14}" stroke="var(--ink-engr)"/>
   <text x="${cx}" y="${cy+30}" text-anchor="middle" style="font-family:var(--f-sc);font-weight:700;font-size:12px;fill:var(--accent-ink);letter-spacing:.08em">the table</text></g>`;
  /* candles */
  [[cx-38,cy-4],[cx+38,cy-4]].forEach(([x,y],i)=>{s+=`<rect x="${x-2}" y="${y-12}" width="4" height="12" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width=".7"/><path class="flame${i?" b":""}" d="M${x} ${y-21}c-2.6 3.4-2.6 6 0 8 2.6-2 2.6-4.6 0-8z"/><circle cx="${x}" cy="${y-16}" r="9" fill="var(--accent)" opacity=".12"/>`;});
  /* the skull on the table's end */
  s+=`<g class="egg" data-egg="skull" role="button" aria-label="A skull" tabindex="-1"><path d="M${cx-30} ${cy-14}a5 5 0 0 1 10 0v3l-1.5 1.5h-7l-1.5-1.5z" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width=".9"/><circle cx="${cx-27.3}" cy="${cy-13.6}" r="1.1" fill="var(--ink-engr)"/><circle cx="${cx-22.7}" cy="${cy-13.6}" r="1.1" fill="var(--ink-engr)"/></g>`;
  /* the doors */
  const doors=HALLS.filter(h=>h.id!=="table");
  doors.forEach((h,i)=>{const a=-Math.PI/2+i*Math.PI*2/doors.length,[x,y]=ellPt(cx,cy,190,132,a),m=hallMastery(h.id);
    const below=Math.sin(a)>-.35,ly=below?33:-26;
    s+=`<g class="door" tabindex="0" role="link" aria-label="Hall ${h.rn}: ${esc(h.short)}" data-go="learn/hall/${h.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
     <path class="arch" d="M-15 18V-5a15 15 0 0 1 30 0v23z"/><path d="M-10 18V-3a10 10 0 0 1 20 0v21" fill="none" stroke="var(--ink-engr)" stroke-width=".7" opacity=".6"/>
     ${m.pct>0?`<path d="M-15 21h${(30*Math.min(1,m.pct)).toFixed(1)}" stroke="var(--accent)" stroke-width="2.4"/>`:""}
     <text class="num" x="0" y="6" text-anchor="middle">${h.rn}</text>
     <text x="0" y="${ly}" text-anchor="middle" style="paint-order:stroke;stroke:var(--surface2);stroke-width:3px">${esc(h.short)}</text></g>`;});
  /* a small ape hides in the corner of the engraving */
  s+=`<g class="egg" data-egg="ape" role="button" aria-label="A small figure" tabindex="-1" opacity=".42" transform="translate(14 322) scale(.9)"><path d="M6 0a4 4 0 1 1 0 .1zM3 7c-2 2-2 7 0 10l-2 6M9 7c2 2 2 7 0 10l2 6M3 11h6M2 8l-3 5M10 8l3 5M9 17c4 0 6-3 7-6" fill="none" stroke="var(--ink-engr)" stroke-width="1.3" stroke-linecap="round"/></g>`;
  return `<svg class="th" viewBox="0 0 420 356" role="group" aria-label="The anatomical theatre: twelve halls around the table">${s}</svg>`;
}
function hallCard(h){const m=hallMastery(h.id);return `<button class="hall${h.id==="table"?" table":""}" data-go="learn/hall/${h.id}"><span class="emb"><svg viewBox="0 0 64 64">${EMB[h.id]}</svg></span>${h.id==="table"?`<span class="tx"><span class="rn">The centre</span><b>${esc(h.n)}</b><span class="la">${esc(h.la)} · the whole patient, history and vital signs</span></span>`:`<span class="rn">${h.rn}</span><b>${esc(h.short)}</b><span class="la">${esc(h.la)}</span>`}<span class="prog" aria-label="${Math.round(m.pct*100)}% mastered"><i style="width:${Math.round(m.pct*100)}%"></i></span></button>`;}
function loreOfDay(){return LORE[daySeed()%LORE.length];}
function loreCard(l,opt={}){return `<button class="tile lorecard" data-go="learn/lore/${l.id}"><span class="row-x" style="gap:8px"><span class="k ${l.k}">${LORE_KIND[l.k]}</span><span class="spacer"></span><span class="yr">${esc(l.yr)}</span></span><b>${esc(l.t)}</b><span class="sub">${esc(l.sum)}</span>${opt.hall?`<span class="tiny muted">${esc(HALL[l.hall].n)}</span>`:""}</button>`;}

{const _home=ROUTES["today:home"];
route("today:home","Galen",(root)=>{
  const due=dueCards().length,line=galenFor("home");
  root.innerHTML=`<section class="theatre-top">
    <button class="searchbig" data-act="pal">${ic("search")}<span>Search signs, techniques, the codex…</span><span class="kbdhint">/</span></button>
    <div class="card stack" style="gap:14px">${guideHTML(line)}
      <div class="row-x"><button class="btn" data-go="practice/session/all">${ic("play")}${due?`Today's session · ${due} due`:"Learn something new"}</button><button class="btn ghost sm" data-go="learn/codex">${ic("scroll")}The codex</button></div></div>
  </section>
  <section class="theatre">${theatreSVG()}</section><p class="marg" style="text-align:center;margin:-10px 0 0">Teatro anatomico · after Padua, 1594 · tap a door</p>
  <section class="section"><div class="row-x"><span class="label">The halls</span><span class="spacer"></span><span class="tiny muted">The bar under each door is what you have mastered there</span></div><div class="halls">${HALLS.map(hallCard).join("")}</div></section>
  <section class="section"><div class="row-x"><span class="label">From the codex, today</span><span class="spacer"></span><button class="link small" data-go="learn/codex">All ${LORE.length} stories</button></div><div class="grid">${loreCard(loreOfDay(),{hall:1})}</div></section>
  <div class="orn">❦</div><div id="today-old"></div>`;
  const old=$("#today-old",root);_home(old);
  /* the old greeting and system rings are replaced by Galen and the halls */
  const sg=$(".sysgrid",old);if(sg)sg.closest("section")?.remove();
  const h1=$(".hero h1",old);if(h1){h1.textContent="Today's round";h1.style.fontSize="1.9rem";}
  $(".hero .trace",old)?.remove();
  $("[data-act=pal]",root).addEventListener("click",openPalette);
  if(!TP.seen){TP.seen=1;tpSave();}
});}

/* ================= HALLS ================= */
const HALL_LINKS={
 table:[["learn/module/gen","General survey and vital signs"],["learn/frames","History frameworks"],["learn/pres","All presentations"],["tools/calcs","Scores and calculators"],["practice/er","ER cases"]],
 heart:[["learn/module/cvs","The cardiovascular examination"],["sounds/library","Heart sounds and murmurs"],["sounds/map","Where to listen, and why"],["sounds/compare","Look-alike sounds side by side"],["practice/drill","Sound drills"]],
 vessels:[["learn/module/cvs","The cardiovascular examination"],["tools/calcs","Wells, ABI and friends"]],
 lungs:[["learn/module/resp","The respiratory examination"],["sounds/library","Breath sounds"],["sounds/map","Lung zones"]],
 belly:[["learn/module/abd","The abdominal examination"]],
 neck:[["learn/module/hn","Head, neck and endocrine"]],
 senses:[["learn/tech","The technique clinic: otoscopy, fundoscopy, rhinoscopy"]],
 cranial:[["learn/cranial","The cranial nerves"],["learn/localise","Where is the lesion?"]],
 mind:[["learn/module/neuro","The neurological examination"],["learn/neuromap","Dermatomes and nerves"],["learn/myotomes","Myotomes and reflexes"],["learn/localise","Localisation"],["practice/localiser","Localiser cases"]],
 spine:[["learn/region/spine","Neck and back"],["learn/rootnerve","Root or nerve?"]],
 arm:[["learn/region/shoulder","Shoulder"],["learn/region/elbow","Elbow"],["learn/region/wrist","Wrist and hand"],["learn/rootnerve","Root or nerve?"]],
 leg:[["learn/region/hip","Hip"],["learn/region/knee","Knee"],["learn/region/ankle","Ankle and foot"]],
 skin:[["learn/datlas","Skin atlas"],["learn/dmorph","The words of the skin"],["learn/describe","Describe like a dermatologist"],["learn/demerg","Skin that can kill"],["practice/describe","Describe it (practice)"],["practice/spot","Spot diagnosis"]]
};

/* ---- outline chapters ---- */
const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
function chapCardIds(h,i){const c=(OUTLINE[h]||[])[i];if(!c)return new Set();if(!CARDS)buildCards();const sg=new Set(c.signs||[]),tc=new Set(c.tech||[]),pr=new Set(c.pres||[]),sd=new Set(c.sounds||[]);
  return new Set(CARDS.filter(k=>((k.type==="think"||k.type==="verdict"||k.type==="mech"||k.type==="snsp"||k.type==="teach")&&sg.has(k.ref))||((k.type==="twhy"||k.type==="terr")&&tc.has(k.ref[0]))||((k.type==="hlr")&&pr.has(k.ref[0]))||(k.type==="red"&&pr.has(k.ref))||(k.type==="sound"&&sd.has(k.ref))).map(k=>k.id));}
function chapMastery(h,i){const ids=[...chapCardIds(h,i)];if(!ids.length)return null;let m=0,seen=0;ids.forEach(id=>{const r=Store.s.srs[id];if(r){seen++;if(r.iv>=7)m++;else if(r.iv>=2)m+=.4;}});return {pct:m/ids.length,seen,n:ids.length};}
function chapItems(c){const out=[];
  (c.tech||[]).forEach(x=>{const t=TECH.find(y=>y.id===x);if(t)out.push(`<button class="chip" data-go="learn/tech/${x}">${ic("check")}${esc(t.name)}</button>`);});
  (c.signs||[]).forEach(x=>out.push(signChip(x)));
  (c.sounds||[]).forEach(x=>{if(SOUNDS[x])out.push(`<button class="chip" data-go="sounds/sound/${x}">${ic("ear")}${esc(SOUNDS[x].name)}</button>`);});
  (c.pres||[]).forEach(x=>{const p=HIST.pres.find(y=>y.id===x);if(p)out.push(`<button class="chip" data-go="learn/pres/${x}">${ic("history")}${esc(p.name)}</button>`);});
  (c.cases||[]).forEach(x=>{const k=HDPE.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="practice/hdpe/${x}">${ic("target")}${esc(k.title)}</button>`);});
  (c.scen||[]).forEach(x=>{const k=SCEN.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="practice/er/${x}">${ic("case")}${esc(k.title)}</button>`);});
  (c.maps||[]).forEach(x=>{const k=CMAPS.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="learn/map/${x}">${ic("map")}${esc(k.title)}</button>`);});
  (c.tools||[]).forEach(x=>{const k=TOOLS.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="tools/calc/${x}">${ic("scale")}${esc(k.name)}</button>`);});
  (c.labs||[]).forEach(x=>{const k=typeof LABS!=="undefined"&&LABS.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="tools/lab/${x}">${ic("log")}${esc(k.name)}</button>`);});
  (c.go||[]).forEach(([g,t])=>out.push(`<button class="chip" data-go="${g}">${ic("door")}${esc(t)}</button>`));
  return out.join("");}
function outlineHTML(h){const chs=OUTLINE[h]||[];if(!chs.length)return "";
  return `<section class="section"><div class="row-x"><span class="label">The outline · ${chs.length} chapters</span><span class="spacer"></span><button class="link small" data-act="chap-all">Open all</button></div><div class="outline">${chs.map((c,i)=>{const m=chapMastery(h,i);
   return `<details class="chap"${i===0?" open":""}><summary><span class="cn">${ROMAN[i]||i+1}</span><span class="ct"><b>${esc(c.t)}</b><span>${esc(c.aim)}</span></span>${m?ring(m.pct,30,3.5):""}</summary>
   <div class="cbody"><span class="k">You will be able to</span><ul class="obj">${c.master.map(o=>`<li>${esc(o)}</li>`).join("")}</ul>
   <span class="k">Study and practise</span><div class="chips">${chapItems(c)}</div>
   <div class="tp"><div class="trap"><span class="k">The trap</span>${esc(c.trap)}</div><div class="pearl"><span class="k">The pearl</span>${esc(c.pearl)}</div></div>
   ${m?`<div class="row-x"><span class="tiny muted">${m.seen} of ${m.n} cards started · ${Math.round(m.pct*100)}% mastered</span><span class="spacer"></span><button class="btn sm soft" data-go="practice/session/chap:${h}:${i}">${ic("play")}Practise this chapter</button></div>`:""}</div></details>`;}).join("")}</div></section>`;}

route("learn:hall",(id)=>(HALL[id]||{}).n||"Hall",(root,id)=>{
  const h=HALL[id];if(!h)throw new Error("No such hall");
  const sg=hallSigns(id),tc=hallTech(id),pr=hallPres(id),lo=LORE.filter(l=>l.hall===id),m=hallMastery(id);
  const vOrder=s=>VERDICT_ORDER.indexOf(SIGNS[s].v);sg.sort((a,b)=>vOrder(a)-vOrder(b)||SIGNS[a].name.localeCompare(SIGNS[b].name));
  root.innerHTML=`<section class="hallhead"><span class="emb"><svg viewBox="0 0 64 64">${EMB[id]}</svg></span><span class="eyebrow">${id==="table"?"The centre of the theatre":"Hall "+h.rn}</span><h1>${esc(h.n)}</h1><span class="latin">${esc(h.la)} · ${esc(h.patron)}</span></section>
  <div class="card stack">${guideHTML(GALEN.hall[id]||galenPick(GALEN.idle),{small:1})}</div>
  <section class="story"><p class="dropcap">${esc(h.intro[0])}</p><p>${esc(h.intro[1])}</p><p class="latin" style="margin-top:.4em">${esc(h.maxim[0])}</p><p class="en" style="margin-top:-.6em">${esc(h.maxim[1])}</p></section>
  <div class="card row-x" style="gap:14px">${ring(m.pct,48,5)}<div class="stack" style="gap:2px;flex:1;min-width:0"><b style="font-family:var(--f-display);font-size:1.2rem">${Math.round(m.pct*100)}% mastered</b><span class="small muted">${m.seen} of ${m.n} cards started in this hall</span></div><button class="btn" data-go="practice/session/hall:${id}">${ic("play")}Practise this hall</button></div>
  ${outlineHTML(id)}
  ${(HALL_LINKS[id]||[]).length?`<section class="section"><span class="label">Rooms of this hall</span><div class="list">${HALL_LINKS[id].map(([go,t])=>`<button class="lrow" data-go="${go}"><span class="icwrap n">${ic("door")}</span><span class="txt"><b>${esc(t)}</b></span>${ic("chev","chev")}</button>`).join("")}</div></section>`:""}
  <details class="acc" style="padding:4px 14px"><summary style="padding:10px 0"><b style="font-family:var(--f-display);font-size:1.15rem">Everything in this hall</b> <span class="tiny muted">${sg.length} signs · ${tc.length} techniques · ${pr.length} histories</span></summary>
  ${tc.length?`<section class="section"><span class="label">Techniques · do it properly</span><div class="list">${tc.map(t=>`<button class="lrow" data-go="learn/tech/${t.id}"><span class="icwrap">${ic("check")}</span><span class="txt"><b>${esc(t.name)}</b><span>${esc(t.hook||t.purpose)}</span></span>${typeof pips==="function"?pips(t.id):""}</button>`).join("")}</div></section>`:""}
  ${sg.length?`<section class="section"><span class="label">Signs and tests · ${sg.length}</span><div class="list">${sg.map(k=>{const s=SIGNS[k];return `<button class="lrow" data-go="signs/sign/${k}"><span class="v v-${s.v}">${VERDICT[s.v]}</span><span class="txt"><b>${esc(s.name)}</b><span>${esc(s.target)}</span></span>${LORE_BY_SIGN[k]?`<span class="tag" title="Has a story in the codex">${ic("scroll")}</span>`:""}${ic("chev","chev")}</button>`;}).join("")}</div></section>`:""}
  ${pr.length?`<section class="section"><span class="label">Histories</span><div class="list">${pr.map(p=>`<button class="lrow" data-go="learn/pres/${p.id}"><span class="icwrap n">${ic("history")}</span><span class="txt"><b>${esc(p.name)}</b><span>${esc((p.dd||[]).slice(0,3).join(", "))}</span></span>${ic("chev","chev")}</button>`).join("")}</div></section>`:""}
  </details>
  ${lo.length?`<section class="section"><span class="label">Stories of this hall</span><div class="grid">${lo.map(l=>loreCard(l)).join("")}</div></section>`:""}
  <div class="orn">❦</div>`;
  $("[data-act=chap-all]",root)?.addEventListener("click",()=>$$(".chap",root).forEach(d=>d.open=true));
  SND.fx("door");
});

/* Learn opens with the theatre */
{const _learn=ROUTES["learn:home"];ROUTES["learn:home"]=(root)=>{_learn(root);const ph=$(".ph",root);const el=document.createElement("section");el.className="section";
  el.innerHTML=`<div class="row-x"><span class="label">The theatre · twelve halls and the table</span><span class="spacer"></span><button class="link small" data-go="learn/codex">The codex</button></div><div class="halls">${HALLS.map(hallCard).join("")}</div>`;
  if(ph)ph.after(el);else root.prepend(el);};}

/* search finds halls and stories */
{const _pi=palIndex;palIndex=function(){const I=_pi();if(I._th)return I;
  HALLS.forEach(h=>I.push({t:h.n,s:`The theatre · ${h.la}`,k:"door",go:`learn/hall/${h.id}`,x:h.intro.join(" ")+" "+h.patron}));
  LORE.forEach(l=>I.push({t:l.t,s:`Codex · ${LORE_KIND[l.k]} · ${l.yr}`,k:"scroll",go:`learn/lore/${l.id}`,x:l.who+" "+l.sum+" "+l.body.join(" ")}));
  I.push({t:"The codex",s:"Medical history, dark and bright",k:"scroll",go:"learn/codex",x:"history lore stories"});
  I.forEach(o=>{if(!o.lt){o.lt=o.t.toLowerCase();o.lx=(o.s+" "+o.x).toLowerCase();}});I._th=1;return I;};}

{const _chrome=chrome;chrome=function(){_chrome();const r=cur(),key=NAV.tab+":"+r.v;
  const hid=key==="learn:hall"?r.a:key==="signs:sign"?signHall(r.a):key==="learn:tech"&&r.a?techHall(r.a):key==="learn:lore"?(loreById(r.a)||{}).hall:null;
  const h=hid&&HALL[hid];document.documentElement.style.setProperty("--hall-tint",h?h.tint:"transparent");document.documentElement.dataset.hall=hid||"";
  SND.setHall(hid||"table");rpRender();};}

/* nav labels for the world */
{const b=$('#nav [data-tab="today"]');if(b){b.querySelector(".l").textContent="Theatre";const s=b.querySelector("svg.i");if(s)s.outerHTML=ic("theatre");}
 const rb=$("#nav .railbrand .brandmark");const tb=$(".top .brandmark");if(rb&&tb)rb.innerHTML=tb.innerHTML;}

