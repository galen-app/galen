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
/* sound starts off on every device: the theatre never surprises a work PC (t01#29); Settings turns it on */
const TP=(()=>{const d={amb:0,music:0,tones:1,vol:.55,size:"m",seen:0};
  try{return Object.assign(d,JSON.parse(localStorage.getItem("galen.theatre")||"{}"));}catch(e){return d;}})();
function tpSave(){try{localStorage.setItem("galen.theatre",JSON.stringify(TP));}catch(e){}}
function applySize(){document.documentElement.dataset.size=TP.size||"m";}
applySize();

/* ================= GALEN: medallion and voice ================= */
let MEDAL_N=0;
function medal(size){return _medal().replace(/__U__/g,"md"+(++MEDAL_N));}
let _MEDAL=null;
function _medal(){if(_MEDAL)return _MEDAL;const u="__U__";_MEDAL=_medalSVG(u);return _MEDAL;}
function _medalSVG(u){const beads=[...Array(36)].map((_,i)=>{const a=i*Math.PI/18;return `<circle cx="${(50+45.5*Math.cos(a)).toFixed(2)}" cy="${(50+45.5*Math.sin(a)).toFixed(2)}" r="1.5" fill="url(#${u}b)"/>`;}).join("");
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs>
  <radialGradient id="${u}g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#f6dc95"/><stop offset=".5" stop-color="#c99a3e"/><stop offset="1" stop-color="#7c5518"/></radialGradient>
  <radialGradient id="${u}b" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fbe7a8"/><stop offset="1" stop-color="#8a6020"/></radialGradient>
  <linearGradient id="${u}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c46f"/><stop offset="1" stop-color="#9a6f25"/></linearGradient>
  <path id="${u}t" d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0"/></defs>
  <circle cx="50" cy="50" r="49" fill="#6b4712"/><circle cx="50" cy="50" r="47.5" fill="url(#${u}g)"/>${beads}
  <circle cx="50" cy="50" r="41" fill="url(#${u}f)" stroke="#7c5518" stroke-width=".8"/>
  <text font-family="Cormorant SC,Georgia,serif" font-weight="700" font-size="7.4" letter-spacing="1.6" fill="#5a3b0c"><textPath href="#${u}t" startOffset="1%" textLength="214" lengthAdjust="spacing">GALENVS · PERGAMENVS · MEDICVS ·</textPath></text>
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
const FIRST_LINE=[null,"So. Another student. I am Galen of Pergamon, physician to emperors. Sit down; we begin at the table."];
function isFirstRun(){return !Store.s.notes.welcome&&!Object.keys(Store.s.srs).length;}
function galenFor(ctx){
  if(ctx==="home"&&isFirstRun())return FIRST_LINE;
  if(typeof galenSay==="function"){try{const l=galenSay(ctx);if(l&&l[1])return l;}catch(e){}}
  if(ctx==="home"){const hr=new Date().getHours();
    const bd=BIRTHDAYS[fmtDate(Date.now()).slice(0,5)];if(bd){if(bd[0]==="Babinski")setTimeout(()=>findEgg("birthday",true),1500);return [null,bd[1]];}
    const last=Store.s.last||0;if(last&&Date.now()-last>4*DAY_MS)return galenPick(GALEN.back,daySeed());
    try{const p=Hub.todayFromPlan();if(p&&p.afterNight)return galenPick(GALEN.afterNight,daySeed());}catch(e){}
    const pool=GALEN[timeSlot()].concat(GALEN.idle);return galenPick(pool,daySeed()+hr);}
  if(GALEN.hall[ctx])return GALEN.hall[ctx];
  return galenPick(GALEN.idle,daySeed());
}
function guideHTML(line,opt={}){const [la,en]=line;return `<div class="guide${opt.small?" small":""}"><button class="medal" data-egg-medal aria-label="Galen of Pergamon, portrait">${medal()}</button><div class="say"><span class="who">Galen says</span>${la?`<span class="latin">${esc(la)}</span>`:""}<span class="line">${esc(en)}</span></div></div>`;}

/* ================= PROGRESS: chapters, halls, where you left off =================
   Mastery is computed from the cards (Store.s.srs). The only new state is two small timestamped notes, which merge per record:
   notes.place {t,h,i}: the chapter you were last in · notes["hall:"+id] {t}: you have read this hall's story · notes.welcome {t}. */
const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
const SEAL_AT=.8;/* a chapter or hall is sealed when 80% of its cards are held a week or more */
let _CC=null,_CCN=-1,_CCO=-1;
function chapMap(){if(!CARDS)buildCards();const no=Object.values(OUTLINE).reduce((a,c)=>a+c.length,0);
  if(_CC&&_CCN===CARDS.length&&_CCO===no)return _CC;const m={};
  for(const [h,cs] of Object.entries(OUTLINE))cs.forEach((c,i)=>{const k=h+":"+i,set=m[k]=new Set();
    const sg=new Set(c.signs||[]),tc=new Set(c.tech||[]),pr=new Set(c.pres||[]),sd=new Set(c.sounds||[]);
    CARDS.forEach(x=>{const t=x.type;
      if((t==="think"||t==="verdict"||t==="mech"||t==="snsp"||t==="teach")&&sg.has(x.ref))set.add(x.id);
      else if((t==="twhy"||t==="terr")&&tc.has(x.ref[0]))set.add(x.id);
      else if(t==="hlr"&&pr.has(x.ref[0]))set.add(x.id);
      else if(t==="red"&&pr.has(x.ref))set.add(x.id);
      else if(t==="sound"&&sd.has(x.ref))set.add(x.id);});});
  /* chapter claims (cards:[…], exact ids and "prefix*") add the card to every chapter that lists it; the rules place the rest */
  CARDS.forEach(x=>{const cl=typeof cardClaims==="function"?cardClaims(x):[];cl.forEach(([h,i])=>{const k=h+":"+i;if(m[k])m[k].add(x.id);});
    if(cl.length)return;const ch=cardChapter(x);if(ch){const k=ch[0]+":"+ch[1];if(m[k])m[k].add(x.id);}});
  /* anything new that no chapter links yet goes to the chapter of its hall whose words it shares most */
  const inAny=new Set();Object.values(m).forEach(st=>st.forEach(id=>inAny.add(id)));
  const words=t=>new Set(String(t||"").toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>3&&!STOPW.has(w)));
  const chW={};for(const [h,cs] of Object.entries(OUTLINE))chW[h]=cs.map(c=>words([c.t,c.aim,c.master.join(" "),c.trap,c.pearl,(c.signs||[]).map(k=>SIGNS[k]?SIGNS[k].name+" "+SIGNS[k].target:"").join(" ")].join(" ")));
  CARDS.forEach(x=>{if(inAny.has(x.id))return;const h=cardHall(x);if(!chW[h])return;
    const it=itemText(x),w=words(it);let best=0,bi=0;chW[h].forEach((cw,i)=>{let n=0;w.forEach(t=>{if(cw.has(t))n++;});if(n>best){best=n;bi=i;}});m[h+":"+bi].add(x.id);});
  _CC=m;_CCN=CARDS.length;_CCO=no;return m;}
const STOPW=new Set("with that this from have when what your their there which about into than then they them were will been only also more most over does each after before".split(" "));
function itemText(x){const t=x.type;try{
  if(t==="think"||t==="verdict"||t==="mech"||t==="snsp"||t==="teach"){const s=SIGNS[x.ref];return s?s.name+" "+s.target+" "+(s.think||""):x.label;}
  if(t==="hlr"||t==="red"){const p=HIST.pres.find(y=>y.id===(Array.isArray(x.ref)?x.ref[0]:x.ref));return p?p.name+" "+(p.dd||[]).join(" "):x.label;}
  if(t==="lore"||t==="lsign"){const l=LORE.find(y=>y.id===x.ref);return l?l.t+" "+l.sum+" "+(l.body||[]).join(" "):x.label;}}catch(e){}
  return x.label||"";}
function chapCardIds(h,i){return (chapMap()[h+":"+i])||new Set();}
function chapMastery(h,i){const ids=[...chapCardIds(h,i)];if(!ids.length)return null;return masteryOf(ids);}
/* scoped sessions: the set of card ids in "hall:<id>" or "chap:<hall>:<i>", null for any other scope */
function scopeIds(sys){sys=String(sys||"");
  if(sys.startsWith("chap:")){const pr=sys.split(":");
    if(pr.length===2){for(const [h,cs] of Object.entries(OUTLINE)){const i=cs.findIndex(c=>c.id===pr[1]);if(i>=0)return chapCardIds(h,i);}return new Set();}/* "chap:<chapter id>" */
    const [,h,i]=pr;if(!OUTLINE[h]||!OUTLINE[h][+i])return new Set();return chapCardIds(h,+i);}
  if(sys.startsWith("hall:")){const h=sys.slice(5);return HALL[h]?new Set(hallCardIds(h)):new Set();}
  return null;}
function hallDue(h){const ids=new Set(hallCardIds(h));return dueCards().filter(c=>ids.has(c.id)).length;}
function chapState(h,i){const m=chapMastery(h,i);return {m,sealed:!!(m&&m.pct>=SEAL_AT),started:!!(m&&m.seen)};}
function hallChapters(h){return (OUTLINE[h]||[]).map((c,i)=>chapState(h,i));}
function sealedCount(h){return hallChapters(h).filter(x=>x.sealed).length;}
/* chapters are found by their stable id (D13); the index is only a fallback for notes written before ids existed */
function chapIndex(h,ref){const cs=OUTLINE[h]||[];if(ref==null||ref==="")return -1;if(/^\d+$/.test(String(ref)))return cs[+ref]?+ref:-1;return cs.findIndex(c=>c.id===ref);}
function place(){const p=Store.s.notes.place;if(!p||!HALL[p.h])return null;
  if(p.c){const i=chapIndex(p.h,p.c);return Object.assign({},p,{i:i<0?null:i});}
  return Object.assign({},p,{i:p.i!=null&&(OUTLINE[p.h]||[])[p.i]?p.i:null});}
function setPlace(h,i){const p=place();if(p&&p.h===h&&p.i===i&&Date.now()-p.t<6e4)return;const c=i!=null&&(OUTLINE[h]||[])[i];
  Store.s.notes.place=c&&c.id?{t:Date.now(),h,i,c:c.id}:{t:Date.now(),h,i:i==null?null:i};Store.save();}
/* fading mastery (70c scopeMastery): the answers that build it, the re-checks that keep it */
function mstOf(scope){try{return typeof scopeMastery==="function"?scopeMastery(scope):null;}catch(e){return null;}}
function mstHTML(scope,what){const m=mstOf(scope);if(!m||m.state==="none")return "";const dn=typeof dayNum==="function"?dayNum():0;
  const rc=`<button class="btn sm${m.state==="fading"?"":" soft"}" data-go="practice/session/chk:${scope}">${ic("check")}Re-check (5 questions)</button>`;
  if(m.state==="building")return `<div class="mst mst-building"><span class="mst-k">Building mastery</span><span class="small muted">${Math.min(m.n,m.need)} of ${m.need} answers so far${m.needDays?`, on ${Math.min(m.days||0,m.needDays)} of ${m.needDays} separate days`:""} · ${Math.round(m.pct*100)}% right</span></div>`;
  if(m.state==="mastered"){const d=Math.max(0,(m.next||dn)-dn);return `<div class="mst mst-mastered"><span class="mst-k">Mastered</span><span class="small muted">${d?`Next re-check in ${d} day${d===1?"":"s"}`:"Re-check from tomorrow"}</span></div>`;}
  return `<div class="mst mst-${m.state}"><span class="mst-k">${m.state==="fading"?"Fading":"Re-check due"}</span><span class="small muted">${m.state==="fading"?`This ${what} is slipping. Five questions; get 4 right to keep it mastered.`:`Five questions; get 4 right to keep this ${what} mastered.`}</span>${rc}</div>`;}
/* the next chapter to study in a hall: where you were, else the first chapter not yet sealed */
function nextChap(h){const cs=OUTLINE[h]||[];if(!cs.length)return -1;const p=place(),st=hallChapters(h);
  if(p&&p.h===h&&p.i!=null&&cs[p.i]&&!st[p.i].sealed)return p.i;
  const i=st.findIndex(x=>!x.sealed&&x.m);return i<0?0:i;}
/* what a door looks like: the bar, then a candle, then gilt, then a seal */
function hallStage(m){return m.pct>=SEAL_AT?4:m.pct>=.5?3:m.pct>=.25?2:m.pct>0||m.seen?1:0;}
const STAGE_WORD=["not started","begun","a candle lit","gilded","sealed"];

/* ================= THE THEATRE (home) ================= */
function ellPt(cx,cy,rx,ry,a){return [cx+rx*Math.cos(a),cy+ry*Math.sin(a)];}
function narrowTheatre(){return matchMedia("(max-width:560px)").matches;}
/* The engraving is drawn once per state and cached. Everything still lives in one static SVG with few nodes (the rails and the
   crowd are single paths); the only moving things, the flames, sit in a small overlay layer of their own, so a flicker never
   repaints the theatre (it used to drop a Steam Deck-class GPU, and headless Chromium, to about 5 fps at 1440x900). */
let _TH={k:"",v:""};
function theatreSig(opt){let a=0,b=0;const S=Store.s.srs;for(const id in S){const r=S[id];a++;if(r.iv>=7)b++;else if(r.iv>=2)b+=.001;}
  return [narrowTheatre()?1:0,opt.first?1:0,(place()||{}).h||"",a,b.toFixed(3),CARDS?CARDS.length:0].join("|");}
function theatreSVG(opt={}){const k=theatreSig(opt);if(_TH.k===k)return _TH.v;const v=theatreDraw(opt);_TH={k,v};return v;}
function theatreDraw(opt={}){
  const nar=narrowTheatre();
  /* on a phone the ring is taller, so every door gets a target of at least 44 px */
  const W=420,H=nar?442:364,cx=210,cy=nar?216:180,DRX=nar?176:190,DRY=nar?166:132,tk=nar?.72:.6;let s="",fx="";
  let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
  let rails="",heads="",bodies="";
  [64,86,108,130,152,172].forEach((rx,ti)=>{const ry=rx*tk;s+=`<ellipse class="tier" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke-width="${ti===5?1.6:1}"/>`;
    if(ti>0){const n=Math.round(rx/3.2);for(let k=0;k<n;k++){const a=k/n*Math.PI*2,[x,y]=ellPt(cx,cy,rx-4,ry-3,a);rails+=`M${x.toFixed(1)} ${y.toFixed(1)}v-4`;}
      const m=Math.round(rx/6);for(let k=0;k<m;k++){if(rnd()<.45)continue;const a=rnd()*Math.PI*2,[x,y]=ellPt(cx,cy,rx-11,ry-8,a);
        heads+=`M${(x+2.3).toFixed(1)} ${(y-6).toFixed(1)}a2.3 2.3 0 1 0 -4.6 0a2.3 2.3 0 1 0 4.6 0z`;bodies+=`M${(x-3).toFixed(1)} ${(y-1).toFixed(1)}q3-4 6 0`;}}});
  s+=`<path class="rail" d="${rails}" stroke-width=".8"/><path d="${heads}" fill="var(--ink-engr)" opacity=".18"/><path d="${bodies}" stroke="var(--ink-engr)" opacity=".18" fill="none"/>`;
  /* the pit and the table */
  const tm=hallMastery("table"),tst=hallStage(tm),first=!!opt.first;
  s+=`<ellipse class="pit" cx="${cx}" cy="${cy}" rx="46" ry="27"/>`;
  s+=`<g class="door table st${tst}${first?" beckon":""}" tabindex="0" role="link" aria-label="The Table: the whole patient, ${Math.round(tm.pct*100)}% mastered" data-go="today/hall/table">
   <rect class="hit" x="${cx-50}" y="${cy-9}" width="100" height="65" fill="transparent"/>
   <rect x="${cx-30}" y="${cy-9}" width="60" height="16" rx="2" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width="1.2"/>
   <path d="M${cx-22} ${cy-1}c6-6 14-6 22-4s14 2 20 4c-6 6-14 6-22 4s-14-2-20-4z" fill="var(--surface2)" stroke="var(--ink-engr)" stroke-width=".8"/>
   <path d="M${cx-26} ${cy+7}v7M${cx+26} ${cy+7}v7" stroke="var(--ink-engr)"/>
   ${tm.pct>0?`<path d="M${cx-30} ${cy+18}h${(60*Math.min(1,tm.pct)).toFixed(1)}" stroke="var(--accent)" stroke-width="2.4"/>`:""}
   <text class="lbl tlbl" x="${cx}" y="${cy+(nar?59:49)}" text-anchor="middle">the table</text></g>`;
  if(first)fx+=`<ellipse class="glow" cx="${cx}" cy="${cy}" rx="56" ry="35"/>`;
  /* candles: the stick and its halo are engraved; the flame is in the overlay */
  [[cx-38,cy-4],[cx+38,cy-4]].forEach(([x,y],i)=>{s+=`<rect x="${x-2}" y="${y-12}" width="4" height="12" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width=".7"/><circle cx="${x}" cy="${y-16}" r="9" fill="var(--accent)" opacity=".12"/>`;
    fx+=`<path class="flame${i?" b":""}" d="M${x} ${y-21}c-2.6 3.4-2.6 6 0 8 2.6-2 2.6-4.6 0-8z"/>`;});
  /* the skull on the table's end: its hit area ends at cy-10, clear of the Table door (whose top is cy-9) */
  s+=`<g class="egg" data-egg="skull" role="button" aria-label="A skull at the end of the table" tabindex="0"><rect class="egg-hit" x="${cx-41}" y="${cy-31}" width="32" height="21" rx="4" fill="transparent"/><path d="M${cx-30} ${cy-14}a5 5 0 0 1 10 0v3l-1.5 1.5h-7l-1.5-1.5z" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width=".9"/><circle cx="${cx-27.3}" cy="${cy-13.6}" r="1.1" fill="var(--ink-engr)"/><circle cx="${cx-22.7}" cy="${cy-13.6}" r="1.1" fill="var(--ink-engr)"/></g>`;
  /* the doors, laid out as a body map */
  const ring=(typeof THEATRE_RING!=="undefined"?THEATRE_RING:HALLS.map(h=>h.id).filter(x=>x!=="table")).filter(id=>HALL[id]);
  const here=(place()||{}).h;
  ring.forEach((id,i)=>{const h=HALL[id],a=-Math.PI/2+i*Math.PI*2/ring.length,[x,y]=ellPt(cx,cy,DRX,DRY,a),m=hallMastery(id),st=hallStage(m);
    const below=Math.sin(a)>-.35,ly=below?36:-27,n=(OUTLINE[id]||[]).length,sc=st?sealedCount(id):0;
    const tr=`translate(${x.toFixed(1)} ${y.toFixed(1)})${nar?" scale(1.18)":""}`;
    const hit=below?`<rect class="hit" x="-31" y="-24" width="62" height="68" fill="transparent"/>`:`<rect class="hit" x="-31" y="-44" width="62" height="68" fill="transparent"/>`;
    s+=`<g class="door st${st}${here===id?" here":""}" tabindex="0" role="link" aria-label="Hall ${h.rn}: ${esc(h.short)}, ${Math.round(m.pct*100)}% mastered, ${STAGE_WORD[st]}" data-go="today/hall/${id}" transform="${tr}">${hit}
     ${st>=3?`<path class="gilt-halo" d="M-19 21V-5a19 19 0 0 1 38 0v26z"/><path class="gilt" d="M-19 21V-5a19 19 0 0 1 38 0v26z"/>`:""}
     <path class="arch" d="M-15 18V-5a15 15 0 0 1 30 0v23z"/><path d="M-10 18V-3a10 10 0 0 1 20 0v21" fill="none" stroke="var(--ink-engr)" stroke-width=".7" opacity=".6"/>
     ${m.pct>0?`<path d="M-15 22h${(30*Math.min(1,m.pct)).toFixed(1)}" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/>`:""}
     ${st>=2?`<g class="cndl" transform="translate(${below?20:-20} 8)"><rect x="-1.6" y="0" width="3.2" height="9" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width=".6"/><circle cx="0" cy="-3" r="6" fill="var(--accent)" opacity=".14"/></g>`:""}
     ${st>=4?`<g class="seal" transform="translate(0 -21)"><circle r="6.5"/><path d="M-3 0l2 2.4 4-4.6" fill="none" stroke="var(--on-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`:""}
     <text class="num" x="0" y="6" text-anchor="middle">${h.rn}</text>
     ${st&&n?`<text class="cnt" x="0" y="15" text-anchor="middle">${sc}/${n}</text>`:""}
     <text class="lbl" x="0" y="${ly}" text-anchor="middle">${esc(h.short)}</text></g>`;
    if(st>=2)fx+=`<g transform="${tr}"><g transform="translate(${below?20:-20} 8)"><path class="flame${i%2?" b":""}" d="M0 -7c-2 2.6-2 4.6 0 6 2-1.4 2-3.4 0-6z"/></g></g>`;});
  /* a small ape hides in the corner of the engraving (a solid hit area: the drawing itself is only strokes) */
  s+=`<g class="egg" data-egg="ape" role="button" aria-label="A small figure in the corner of the engraving" tabindex="0" opacity=".42" transform="translate(12 ${H-42}) scale(.9)"><rect x="-6" y="-6" width="32" height="34" fill="transparent"/><path d="M6 0a4 4 0 1 1 0 .1zM3 7c-2 2-2 7 0 10l-2 6M9 7c2 2 2 7 0 10l2 6M3 11h6M2 8l-3 5M10 8l3 5M9 17c4 0 6-3 7-6" fill="none" stroke="var(--ink-engr)" stroke-width="1.3" stroke-linecap="round"/></g>`;
  const vb=`${nar?0:-14} 0 ${nar?W:W+28} ${H}`;
  return `<svg class="th" viewBox="${vb}" role="group" aria-label="The anatomical theatre: twelve halls around the table">${s}</svg><svg class="th-fx" viewBox="${vb}" aria-hidden="true" focusable="false">${fx}</svg>`;
}
/* the flames only move while the theatre is on screen, the tab is visible, and for a while after the last touch:
   a still room costs nothing on a Steam Deck's battery */
let _thIO=null,_thIdle=0;
function theatreLive(sec){if(!sec)return;
  const wake=()=>{sec.classList.remove("still");clearTimeout(_thIdle);_thIdle=setTimeout(()=>sec.classList.add("still"),45000);};
  if(_thIO)_thIO.disconnect();
  if("IntersectionObserver" in window){_thIO=new IntersectionObserver(es=>es.forEach(e=>sec.classList.toggle("off",!e.isIntersecting)));_thIO.observe(sec);}
  wake();["pointerdown","keydown","wheel"].forEach(t=>sec.addEventListener(t,wake,{passive:true}));}
document.addEventListener("visibilitychange",()=>{const t=$("#view section.theatre");if(t)t.classList.toggle("off",document.hidden);});
/* the hall card (Learn hub) and a one-line hall row (reference pane, home lists) */
function hallCard(h){const m=hallMastery(h.id),pc=Math.round(m.pct*100),n=(OUTLINE[h.id]||[]).length,st=hallStage(m),scope=(typeof HALL_SCOPE!=="undefined"&&HALL_SCOPE[h.id])||"";
  const lab=`${h.id==="table"?"The Table":"Hall "+(ROMAN.indexOf(h.rn)+1)}, ${h.short}: ${scope}. ${n} chapters, ${pc}% mastered`;
  return `<button class="hall st${st}${h.id==="table"?" table":""}" data-go="learn/hall/${h.id}" aria-label="${esc(lab)}"><span class="emb" aria-hidden="true"><svg viewBox="0 0 64 64">${EMB[h.id]}</svg></span>${h.id==="table"?`<span class="tx" aria-hidden="true"><span class="rn">The centre</span><b>${esc(h.n)}</b><span class="sc">${esc(scope)} · ${n} chapters</span></span>`:`<span class="rn" aria-hidden="true">${h.rn}</span><b aria-hidden="true">${esc(h.short)}</b><span class="sc" aria-hidden="true">${esc(scope)}</span><span class="la" aria-hidden="true" title="${esc(h.la)}">${n} chapters${pc?` · ${pc}%`:""}</span>`}<span class="prog" aria-hidden="true"><i style="width:${pc}%"></i></span></button>`;}
function hallRow(h,opt={}){const m=hallMastery(h.id),pc=Math.round(m.pct*100);const d=opt.due?hallDue(h.id):0;
  return `<button class="hallrow st${hallStage(m)}" data-go="${opt.go||"today/hall/"+h.id}"><span class="emb" aria-hidden="true"><svg viewBox="0 0 64 64">${EMB[h.id]}</svg></span><span class="txt"><b>${esc(h.n)}</b><span>${esc((typeof HALL_SCOPE!=="undefined"&&HALL_SCOPE[h.id])||h.la)}</span></span>${d?`<span class="pill acc">${d} due</span>`:""}${ring(m.pct,30,3.5)}<span class="vh">${pc}% mastered</span></button>`;}
function loreOfDay(){return LORE[daySeed()%LORE.length];}
/* the story card is the codex's (98h codexCard assigns itself to loreCard at load) */
var loreCard=function(l,opt){return typeof codexCard==="function"?codexCard(l,opt||{}):"";};

/* the welcome a newcomer sees once: what this is, how the halls work, one first step */
function welcomeHTML(){const v=k=>`<span class="v v-${k}">${VERDICT[k]}</span>`;
  return `<div class="welcome">
   <p class="wl-lede">Galen teaches the history and the bedside examination the way you use them on a shift: what to do, why it works, and how much each finding is worth.</p>
   <div class="row-x wl-act"><button class="btn" data-go="today/hall/table/0" data-welcome>${ic("door")}Begin at the Table: chapter I</button><button class="btn ghost" data-welcome>Look around first</button></div>
   <span class="tiny muted wl-time">Chapter I, "${esc((OUTLINE.table[0]||{}).t||"The end of the bed")}", takes about three minutes.</span>
   <span class="label">How the theatre works</span>
   <ol class="wl-steps">
    <li><span class="wn">1</span><span><b>Choose a hall.</b> Twelve halls, one for each part of the body, stand around the Table: the whole patient.</span></li>
    <li><span class="wn">2</span><span><b>Read a chapter.</b> What you will be able to do, the signs and techniques, a trap and a pearl.</span></li>
    <li><span class="wn">3</span><span><b>Practise it.</b> A few cards at a time, spaced until you hold them. The hall's door lights up as you do.</span></li></ol>
   <p class="small wl-v">Every test carries a verdict: ${v("core")} use it, ${v("useful")} it helps, ${v("low")} it rarely changes much, ${v("archaic")} it has been replaced.</p></div>`;}
/* the one best thing to do now */
function bestAction(){const due=dueCards().length,p=place();
  if(due){const mins=Math.max(1,Math.round(due*.35));return `<button class="btn" data-go="practice/session/all">${ic("play")}Today's session · ${due} due · about ${mins} min</button>`;}
  if(p){const i=p.i!=null?p.i:nextChap(p.h),c=(OUTLINE[p.h]||[])[i];if(c)return `<button class="btn" data-go="today/hall/${p.h}/${i}">${ic("door")}Continue: ${esc(c.t)}</button>`;}
  const i=nextChap("table");return `<button class="btn" data-go="today/hall/table/${i}">${ic("door")}Begin at the Table: ${esc((OUTLINE.table[i]||{}).t||"")}</button>`;}
/* "continue where you left off": the chapter you were in, with its progress */
function continueHTML(){const p=place();if(!p)return "";const i=p.i!=null?p.i:nextChap(p.h);const c=(OUTLINE[p.h]||[])[i];if(!c)return "";
  const st=chapState(p.h,i),h=HALL[p.h],pc=st.m?Math.round(st.m.pct*100):0;
  return `<button class="contcard" data-go="today/hall/${p.h}/${i}"><span class="emb" aria-hidden="true"><svg viewBox="0 0 64 64">${EMB[p.h]}</svg></span><span class="txt"><span class="eyebrow">Continue where you left off</span><b>${ROMAN[i]}. ${esc(c.t)}</b><span>${esc(h.n)}${st.m?` · ${st.m.seen} of ${st.m.n} cards started · ${pc}%`:""}</span></span>${ic("chev","chev")}</button>`;}
function birthdayStory(){const bd=BIRTHDAYS[fmtDate(Date.now()).slice(0,5)];if(!bd||isFirstRun())return "";const l=(bd[2]&&loreById(bd[2]))||LORE.find(x=>(x.who||"").includes(bd[0])||x.t.includes(bd[0])||x.id===bd[0].toLowerCase());return l?`<button class="chip" data-go="learn/lore/${l.id}">${ic("scroll")}Read his story</button>`:"";}

{const _home=ROUTES["today:home"];
route("today:home","Galen",(root)=>{
  const first=isFirstRun(),line=galenFor("home");
  root.innerHTML=`<section class="theatre-top">
    <button class="searchbig" data-act="pal">${ic("search")}<span>Search signs, techniques, chapters, the codex…</span><span class="kbdhint">/</span></button>
    <div class="card stack galen-card${first?" first":""}" style="gap:14px">${guideHTML(line)}
      ${first?welcomeHTML():`<div class="row-x best">${bestAction()}${birthdayStory()}<span class="spacer"></span><button class="link small" data-go="learn/codex">${ic("scroll")}The codex</button></div>`}</div>
    ${first||!dueCards().length?"":continueHTML()}
  </section>
  <section class="theatre${first?" first":""}">${theatreSVG({first})}</section>
  <p class="marg th-cap">Teatro anatomico, after Padua, 1594. A door shows a bar as you learn, a candle at a quarter, gilt at half, a seal when mastered.</p>
  <section class="section"><div class="row-x"><span class="label">${first?"From the codex, today":"Today in the theatre"}</span><span class="spacer"></span><button class="link small" data-go="learn/codex">All ${LORE.length} stories</button></div><div class="grid th-today">${loreCard(loreOfDay(),{hall:1})}${first?"":techTileHTML()}</div></section>
  <div class="orn" aria-hidden="true">❦</div><div id="today-old" class="today-old"></div>`;
  const old=$("#today-old",root);if(!first){try{_home(old);}catch(e){console.error(e);}}
  /* the old greeting, counts and second CTA are replaced by Galen's card; the system rings by the doors;
     the technique of the day sits beside today's story, so the old home's copy goes */
  $(".hero",old)?.remove();const sg=$(".sysgrid",old);if(sg)sg.closest("section")?.remove();
  if($(".th-today .techday",root))$$('#today-old > .tile[data-go^="learn/tech/"]',root).forEach(x=>x.remove());
  theatreLive($("section.theatre",root));
  $("[data-act=pal]",root).addEventListener("click",openPalette);
  $$("[data-welcome]",root).forEach(b=>b.addEventListener("click",()=>{Store.s.notes.welcome={t:Date.now()};Store.save();if(!b.dataset.go)render(false,true);}));
  if(!TP.seen){TP.seen=1;tpSave();}
});}
/* the doors are drawn for the width: re-draw when a phone turns or a window narrows */
matchMedia("(max-width:560px)").addEventListener("change",()=>{const t=$("#view section.theatre");if(t&&NAV.tab==="today"&&cur().v==="home"){t.innerHTML=theatreSVG({first:isFirstRun()});if(typeof decorateTheatre==="function")requestAnimationFrame(decorateTheatre);}});
/* the technique of the day (89c techOfDay), beside today's story */
function techTileHTML(){try{const td=typeof techOfDay==="function"&&techOfDay();if(!td)return "";const c=typeof techConf==="function"?techConf(td.id):null,dn=typeof techDone==="function"?techDone(td.id):0;
  return `<button class="tile techday" data-go="learn/tech/${td.id}"><div class="t-top"><span class="eyebrow">Technique of the day</span>${typeof pips==="function"?pips(td.id):""}</div><b>${esc(td.name)}</b><span class="sub">${esc(td.hook||td.purpose||"")}</span><span class="small td-cta">${c==null?"Rate your confidence, then walk it through":`Confidence ${c}/5 · ${dn}/5 milestones`}</span></button>`;}catch(e){return "";}}

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
function chapItems(c){const out=[];
  (c.tech||[]).forEach(x=>{const t=TECH.find(y=>y.id===x);if(t)out.push(`<button class="chip" data-go="learn/tech/${x}">${ic("check")}${esc(t.name)}</button>`);});
  (c.signs||[]).forEach(x=>out.push(signChip(x)));
  (c.sounds||[]).forEach(x=>{if(SOUNDS[x])out.push(`<button class="chip" data-go="sounds/sound/${x}">${ic("ear")}${esc(SOUNDS[x].name)}</button>`);});
  (c.pres||[]).forEach(x=>{const p=HIST.pres.find(y=>y.id===x);if(p)out.push(`<button class="chip" data-go="learn/pres/${x}">${ic("history")}History: ${esc(p.name)}</button>`);});
  (c.cases||[]).forEach(x=>{const k=HDPE.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="practice/hdpe/${x}">${ic("target")}Case: ${esc(k.title)}</button>`);});
  (c.scen||[]).forEach(x=>{const k=SCEN.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="practice/er/${x}">${ic("case")}ER case: ${esc(k.title)}</button>`);});
  (c.maps||[]).forEach(x=>{const k=CMAPS.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="learn/map/${x}">${ic("map")}Map: ${esc(k.title)}</button>`);});
  /* a calculator chip says so, because a sign of the same name often sits beside it (t01#17) */
  (c.tools||[]).forEach(x=>{const k=TOOLS.find(y=>y.id===x);if(k)out.push(`<button class="chip calc" data-go="tools/calc/${x}">${ic("scale")}Calculate: ${esc(k.name)}</button>`);});
  (c.labs||[]).forEach(x=>{const k=typeof LABS!=="undefined"&&LABS.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="tools/lab/${x}">${ic("log")}Labs: ${esc(k.name)}</button>`);});
  (c.go||[]).forEach(([g,t])=>out.push(`<button class="chip" data-go="${g}">${ic("door")}${esc(t)}</button>`));
  return out.join("");}
function cnBadge(i,st){const p=st.m?Math.round(st.m.pct*100):0;return `<span class="cn${st.sealed?" sealed":st.started?" part":""}" style="--p:${p}" aria-hidden="true">${st.sealed?`<svg viewBox="0 0 24 24" class="i"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`:(ROMAN[i]||i+1)}</span>`;}
function outlineHTML(h,openI){const chs=OUTLINE[h]||[];if(!chs.length)return "";const nx=nextChap(h);
  return `<section class="section" id="outline"><div class="row-x"><span class="label">The outline · ${chs.length} chapters · ${sealedCount(h)} sealed</span><span class="spacer"></span><button class="link small chap-all" data-act="chap-all" aria-pressed="false">Open all</button></div><div class="outline">${chs.map((c,i)=>{const st=chapState(h,i),m=st.m;
   const status=st.sealed?"Sealed":m&&m.seen?`${m.seen} of ${m.n} started · ${Math.round(m.pct*100)}%`:m?`${m.n} cards`:"";
   const scope=`chap:${h}:${i}`,ms=mstOf(scope),fad=ms&&(ms.state==="check"||ms.state==="fading");
   return `<details class="chap${i===nx?" next":""}${st.sealed?" sealed":""}${fad?" fading":""}" id="chap-${i}" data-i="${i}" data-cid="${esc(c.id||"")}"${i===openI?" open":""}><summary><span class="vh">Chapter ${i+1}${st.sealed?", sealed":""}. </span>${cnBadge(i,st)}<span class="ct"><b>${esc(c.t)}</b><span>${esc(c.aim)}</span>${status||i===nx||fad?`<span class="cst">${i===nx?`<span class="cnx">${st.started?"Continue here":"Next"}</span>`:""}${fad?`<span class="cnx fade">${ms.state==="fading"?"Fading":"Re-check"}</span>`:""}${esc(status)}</span>`:""}</span><svg class="i chv" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></summary>
   <div class="cbody"><span class="k">You will be able to</span><ul class="obj">${c.master.map(o=>`<li>${esc(o)}</li>`).join("")}</ul>
   <span class="k">Study and practise</span><div class="chips">${chapItems(c)}</div>
   <div class="tp"><div class="trap"><span class="k">The trap</span>${esc(c.trap)}</div><div class="pearl"><span class="k">The pearl</span>${esc(c.pearl)}</div></div>
   ${c.red?`<div class="redf" role="note"><span class="k">Red flags</span>${esc(c.red)}</div>`:""}
   ${c.say?`<figure class="sayit"><figcaption class="k">Say it like this</figcaption><blockquote>${esc(c.say)}</blockquote></figure>`:""}
   ${m?mstHTML(scope,"chapter"):""}
   ${m?`<div class="row-x cfoot">${ring(m.pct,34,4)}<span class="small muted" style="flex:1;min-width:0">${m.seen} of ${m.n} cards started · ${m.held} held a week or more</span><button class="btn sm${i===nx?"":" soft"}" data-go="practice/session/${scope}">${ic("play")}Practise this chapter</button></div>`:`<p class="small muted" style="margin:0">This chapter has no practice cards yet. Study the pages above; their cards arrive with the next update.</p>`}
   ${c.src?`<p class="csrc">Sources: ${esc(c.src)}</p>`:""}</div></details>`;}).join("")}</div></section>`;}

function hallPage(root,id,ch){
  const h=HALL[id];if(!h)throw new Error("That hall is not in the theatre.");
  const sg=hallSigns(id),tc=hallTech(id),pr=hallPres(id),lo=LORE.filter(l=>l.hall===id),m=hallMastery(id),st=hallStage(m),chs=OUTLINE[id]||[];
  const ci=chapIndex(id,ch),nx=nextChap(id),openI=ci>=0?ci:nx,read=!!Store.s.notes["hall:"+id],sealed=sealedCount(id);
  const vOrder=s=>VERDICT_ORDER.indexOf(SIGNS[s].v);sg.sort((a,b)=>vOrder(a)-vOrder(b)||SIGNS[a].name.localeCompare(SIGNS[b].name));
  const nc=chs[nx],nst=nc?chapState(id,nx):null;
  root.innerHTML=`<section class="hallhead st${st}"><span class="emb" aria-hidden="true"><svg viewBox="0 0 64 64">${EMB[id]}</svg></span><span class="eyebrow">${id==="table"?"The centre of the theatre":"Hall "+h.rn}</span><h1>${esc(h.n)}</h1><span class="latin">${esc(h.la)} · ${esc(h.patron)}</span>${HALL_SCOPE&&HALL_SCOPE[id]?`<span class="hscope">${esc(HALL_SCOPE[id])}</span>`:""}</section>
  <div class="card hallprog">
   <div class="hp-top">${ring(m.pct,52,5)}<div class="hp-tx"><b>${Math.round(m.pct*100)}% mastered</b><span class="small muted">${sealed} of ${chs.length} chapters sealed · ${m.seen} of ${m.n} cards started</span><span class="tiny muted">${["Start any chapter and this hall's door gets its first bar.","At 25% a candle is lit beside the door.","At 50% the door is gilded.","At 80% the door is sealed.","This door is sealed. Keep it so with a hall review now and then."][st]}</span></div></div>
   ${mstHTML("hall:"+id,"hall")}
   <div class="hp-act">${nc?`<button class="btn" data-open-chap="${nx}">${ic("door")}${nst.started?"Continue":"Start"}: ${ROMAN[nx]}. ${esc(nc.t)}</button>`:""}<button class="btn ${nc?"ghost":""}" data-go="practice/session/hall:${id}">${ic("play")}Practise the whole hall</button></div></div>
  <div class="card stack">${guideHTML(galenFor(id),{small:1})}</div>
  <details class="story"${read?"":" open"}><summary><span class="label">The story of this hall</span><svg class="i chv" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></summary><p class="dropcap">${esc(h.intro[0])}</p><p>${esc(h.intro[1])}</p><p class="latin" style="margin-top:.4em">${esc(h.maxim[0])}</p><p class="en" style="margin-top:-.6em">${esc(h.maxim[1])}</p></details>
  ${outlineHTML(id,openI)}
  ${(HALL_LINKS[id]||[]).length?`<section class="section"><span class="label">Rooms of this hall</span><div class="list">${HALL_LINKS[id].map(([go,t])=>`<button class="lrow" data-go="${go}"><span class="icwrap n">${ic("door")}</span><span class="txt"><b>${esc(t)}</b></span>${ic("chev","chev")}</button>`).join("")}</div></section>`:""}
  <details class="acc" style="padding:4px 14px"><summary style="padding:10px 0"><b style="font-family:var(--f-display);font-size:1.15rem">Everything in this hall</b> <span class="tiny muted">${sg.length} signs · ${tc.length} techniques · ${pr.length} histories</span></summary>
  ${tc.length?`<section class="section"><span class="label">Techniques · do it properly</span><div class="list">${tc.map(t=>`<button class="lrow" data-go="learn/tech/${t.id}"><span class="icwrap">${ic("check")}</span><span class="txt"><b>${esc(t.name)}</b><span>${esc(t.hook||t.purpose)}</span></span>${typeof pips==="function"?pips(t.id):""}</button>`).join("")}</div></section>`:""}
  ${sg.length?`<section class="section"><span class="label">Signs and tests · ${sg.length}</span><div class="list">${sg.map(k=>{const s=SIGNS[k];return `<button class="lrow" data-go="signs/sign/${k}"><span class="v v-${s.v}">${VERDICT[s.v]}</span><span class="txt"><b>${esc(s.name)}</b><span>${esc(s.target)}</span></span>${LORE_BY_SIGN[k]?`<span class="tag" title="Has a story in the codex">${ic("scroll")}</span>`:""}${ic("chev","chev")}</button>`;}).join("")}</div></section>`:""}
  ${pr.length?`<section class="section"><span class="label">Histories</span><div class="list">${pr.map(p=>`<button class="lrow" data-go="learn/pres/${p.id}"><span class="icwrap n">${ic("history")}</span><span class="txt"><b>${esc(p.name)}</b><span>${esc((p.dd||[]).slice(0,3).join(", "))}</span></span>${ic("chev","chev")}</button>`).join("")}</div></section>`:""}
  </details>
  ${lo.length?`<section class="section"><span class="label">Stories of this hall</span><div class="grid">${lo.map(l=>loreCard(l)).join("")}</div></section>`:""}
  <div class="orn" aria-hidden="true">❦</div>`;
  const allB=$("[data-act=chap-all]",root);
  const syncAll=()=>{if(!allB)return;const all=$$(".chap",root).every(d=>d.open);allB.textContent=all?"Close all":"Open all";allB.setAttribute("aria-pressed",all);};
  allB?.addEventListener("click",()=>{const all=$$(".chap",root).every(d=>d.open);$$(".chap",root).forEach(d=>d.open=!all);syncAll();});
  const goChap=i=>{const d=$("#chap-"+i,root);if(!d)return;d.open=true;setPlace(id,i);d.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"});d.querySelector("summary")?.focus({preventScroll:true});};
  $$("[data-open-chap]",root).forEach(b=>b.addEventListener("click",()=>goChap(+b.dataset.openChap)));
  $$(".chap",root).forEach(d=>d.addEventListener("toggle",()=>{if(d.open&&d.dataset.user)setPlace(id,+d.dataset.i);syncAll();}));
  $$(".chap>summary",root).forEach(s=>s.addEventListener("click",()=>{s.parentElement.dataset.user=1;}));
  $(".story",root)?.addEventListener("toggle",e=>{if(!e.target.open&&!read){Store.s.notes["hall:"+id]={t:Date.now()};Store.save();}});
  /* a hall you have opened before keeps its story folded */
  if(!read){Store.s.notes["hall:"+id]={t:Date.now()};Store.save();}
  if(!place()||place().h!==id)setPlace(id,null);
  if(ci>=0)requestAnimationFrame(()=>requestAnimationFrame(()=>goChap(ci)));
  SND.fx("door");
}
route("learn:hall",(id)=>(HALL[id]||{}).n||"No such hall",hallPage);
/* halls entered from the theatre stay on the theatre's stack, so Back returns to the doors */
route("today:hall",(id)=>(HALL[id]||{}).n||"No such hall",hallPage);

/* Learn opens with the theatre's halls as a grid */
{const _learn=ROUTES["learn:home"];ROUTES["learn:home"]=(root)=>{_learn(root);const ph=$(".ph",root);const el=document.createElement("section");el.className="section";
  el.innerHTML=`<div class="row-x"><span class="label">The theatre · twelve halls and the table</span><span class="spacer"></span><button class="link small" data-go="learn/codex">The codex</button></div><div class="halls">${HALLS.map(hallCard).join("")}</div>`;
  if(ph)ph.after(el);else root.prepend(el);};}

/* search finds halls, chapters and stories */
{const _pi=palIndex;palIndex=function(){const I=_pi();if(I._th)return I;
  HALLS.forEach(h=>I.push({t:h.n,s:`The theatre · ${HALL_SCOPE[h.id]||h.la}`,k:"door",go:`today/hall/${h.id}`,x:h.intro.join(" ")+" "+h.patron+" "+h.la+" "+h.short}));
  Object.entries(OUTLINE).forEach(([h,cs])=>cs.forEach((c,i)=>{if(HALL[h])I.push({t:c.t,s:`Chapter ${ROMAN[i]||i+1} · ${HALL[h].n}`,k:"door",go:`today/hall/${h}/${i}`,x:c.aim+" "+c.master.join(" ")});}));
  LORE.forEach(l=>I.push({t:l.t,s:`Codex · ${LORE_KIND[l.k]} · ${l.yr}`,k:"scroll",go:`learn/lore/${l.id}`,x:l.who+" "+l.sum+" "+l.body.join(" ")}));
  I.push({t:"The codex",s:"Medical history, dark and bright",k:"scroll",go:"learn/codex",x:"history lore stories"});
  I.forEach(o=>{if(!o.lt){o.lt=o.t.toLowerCase();o.lx=(o.s+" "+o.x).toLowerCase();}});I._th=1;return I;};}

/* after every render: the hall's tint and the room's key; remember the chapter a session came from */
{const _chrome=chrome;chrome=function(){_chrome();const r=cur(),key=NAV.tab+":"+r.v;
  if(key==="practice:session"&&String(r.a||"").startsWith("chap:")){const pr=String(r.a).split(":");if(pr.length===3){if(OUTLINE[pr[1]]&&OUTLINE[pr[1]][+pr[2]])setPlace(pr[1],+pr[2]);}
    else for(const [h,cs] of Object.entries(OUTLINE)){const i=cs.findIndex(c=>c.id===pr[1]);if(i>=0){setPlace(h,i);break;}}}
  const hid=(key==="learn:hall"||key==="today:hall")?r.a:key==="signs:sign"?signHall(r.a):key==="learn:tech"&&r.a?techHall(r.a):key==="learn:lore"?(loreById(r.a)||{}).hall:key==="practice:session"&&/^(hall|chap):/.test(r.a||"")?String(r.a).split(":")[1]:null;
  const h=hid&&HALL[hid];document.documentElement.style.setProperty("--hall-tint",h?h.tint:"transparent");document.documentElement.dataset.hall=h?hid:"";
  document.documentElement.classList.toggle("on-theatre",key==="today:home");/* 02b holds the room still behind the engraving */
  SND.setHall(h?hid:"table");if(typeof rpRender==="function")rpRender();};}

/* nav labels for the world */
{const b=$('#nav [data-tab="today"]');if(b){b.querySelector(".l").textContent="Theatre";const s=b.querySelector("svg.i");if(s)s.outerHTML=ic("theatre");}
 const rb=$("#nav .railbrand .brandmark");const tb=$(".top .brandmark");if(rb&&tb)rb.innerHTML=tb.innerHTML;}
