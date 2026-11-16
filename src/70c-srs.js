"use strict";
/* Scheduler and sessions: scope, SM-2 schedule with fuzz, lapses and leeches, due/new, siblings, the day's plan
   (daily goal, shift days, mood), buildSession for every scope, review log, weekly recap, fading mastery. */

/* ---------- scope: "all", a system id, "reg:<region>", "hall:<id>", "chap:<hall>:<i>" ---------- */
const _SCOPE={};
/* the card ids of a hall or chapter scope, cached; uses the theatre's scopeIds (98b-theatre.js) when it is there */
function srsScope(sys){
  if(!CARDS)buildCards();sys=normScope(sys);const k=sys+"|"+CARDS.length;if(_SCOPE[k])return _SCOPE[k];
  let ids=null;const s=String(sys);try{if(typeof scopeIds==="function")ids=scopeIds(s);}catch(e){ids=null;}
  if(!ids){ids=new Set();
    if(s.startsWith("chap:")){const [,h,i]=s.split(":");if(typeof chapCardIds==="function")ids=chapCardIds(h,+i);}
    else if(s.startsWith("hall:")){const h=s.slice(5);if(typeof cardHall==="function")CARDS.forEach(c=>{try{if(cardHall(c)===h)ids.add(c.id);}catch(e){}});}}
  return _SCOPE[k]=ids;
}
/* "chap:<chapterId>" (D13 ids) is accepted as well as "chap:<hall>:<index>" */
function normScope(sys){const s=String(sys||"all");if(!s.startsWith("chap:")||s.split(":").length===3||typeof OUTLINE==="undefined")return s;
  const id=s.slice(5);for(const [h,cs] of Object.entries(OUTLINE)){const i=(cs||[]).findIndex(c=>c&&c.id===id);if(i>=0)return `chap:${h}:${i}`;}return s;}
function inScope(c,sys){
  if(!sys||sys==="all")return true;const s=normScope(sys);
  if(s.startsWith("reg:"))return c.reg===s.slice(4);
  if(s.startsWith("hall:")||s.startsWith("chap:"))return srsScope(s).has(c.id);
  return c.sys===s;
}
/* is this a scope the app knows? (bad deep links get a calm "no such" page instead of "All caught up") */
function scopeValid(sys){
  if(!sys||sys==="all")return true;const s=normScope(sys);
  if(s.startsWith("reg:"))return typeof REGIONS!=="undefined"&&REGIONS.some(r=>r.id===s.slice(4));
  if(s.startsWith("hall:"))return typeof HALL!=="undefined"&&!!HALL[s.slice(5)];
  if(s.startsWith("chap:")){const [,h,i]=s.split(":");return typeof OUTLINE!=="undefined"&&!!(OUTLINE[h]||[])[+i];}
  return typeof SYS_NAME!=="undefined"?!!SYS_NAME[s]:true;
}
/* siblings: the cards that share one answer (a sign's think, verdict, mechanism, rule-in/out and teach-back cards) */
const SIGN_TYPES={think:1,verdict:1,mech:1,snsp:1,teach:1};
function sibKey(c){if(c.sib)return c.sib;if(SIGN_TYPES[c.type])return "s:"+c.ref;if(c.type==="twhy"||c.type==="terr")return "t:"+c.ref[0];if(c.type==="hlr")return "p:"+c.ref[0];if(c.type==="red")return "p:"+c.ref;return c.id;}

/* ---------- this device (for per-device day counters that add up across devices) ---------- */
let _DEV=null;
function devId(){if(_DEV)return _DEV;try{_DEV=localStorage.getItem("galen.dev");if(!_DEV){_DEV=Math.random().toString(36).slice(2,8);localStorage.setItem("galen.dev",_DEV);}}catch(e){_DEV="here";}return _DEV;}

/* ---------- SM-2 style scheduler ----------
   grade: 0 again · 1 hard · 2 good · 3 easy. Intervals get a small deterministic fuzz (so cards learned together drift apart,
   and the preview on each button is exactly what you get). A lapse keeps a fifth of the old interval. Cap one year. */
const SRS_MAX_IV=365,LEECH_AT=6;
function _hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return ((h>>>0)%10000)/10000;}
function _fuzz(id,n,iv){if(iv<3)return iv;const span=iv<7?1:iv<20?Math.max(1,Math.round(iv*.1)):Math.max(2,Math.round(iv*.05));return iv+Math.round((_hash(id+":"+n)*2-1)*span);}
function nextState(id,r0,grade,today){
  const r=Object.assign({iv:0,ef:2.5,n:0,l:0,due:today},r0?JSON.parse(JSON.stringify(r0)):{});
  if(r.first==null)r.first=today;
  if(grade===0){
    if(r.iv>=3)r.piv=r.iv;r.l=(r.l||0)+1;r.n=0;r.iv=0;r.ef=Math.max(1.3,r.ef-.2);r.due=today;
    r.ll=[...(r.ll||[]),today].slice(-8);if(r.l>=LEECH_AT)r.leech=1;
  }else{
    r.n++;let iv;
    if(r.n===1){
      if(r.piv){const base=Math.max(1,Math.round(r.piv*.2));iv=grade===1?Math.max(1,base-1):grade===3?Math.round(base*1.5)+1:base;delete r.piv;if(iv>=3)r.n=2;}
      else iv=grade===3?4:grade===1?1:2;
    }
    else if(r.n===2&&r.iv<3)iv=grade===1?3:grade===3?8:6;
    else iv=Math.max(r.iv+1,Math.round(r.iv*r.ef*(grade===1?.6:grade===3?1.3:1)));
    iv=Math.min(SRS_MAX_IV,Math.max(1,_fuzz(id,r.n,iv)));
    r.iv=iv;r.ef=Math.min(3,Math.max(1.3,r.ef+(grade===1?-.15:grade===3?.1:0)));r.due=today+iv;
  }
  return r;
}
function schedule(id,grade){
  const today=dayNum(),r=nextState(id,Store.s.srs[id],grade,today);
  r.last=Date.now();Store.s.srs[id]=r;tick(1,"session");Store.save();
  return r;
}
/* what each grade button would give, for the preview ("3 · 6d") */
function previewIv(id,g){if(g===0)return "again";const r=nextState(id,Store.s.srs[id],g,dayNum());return fmtIv(r.iv);}
function fmtIv(d){return d>=60?Math.round(d/30)+"mo":d+"d";}

/* ---------- due and new ---------- */
let _ALIASED=false;
function applyCardAlias(){if(_ALIASED||typeof CARD_ALIAS==="undefined"||!Store||!Store.s)return;if(!CARDS)buildCards();_ALIASED=true;let n=0;
  Object.entries(CARD_ALIAS).forEach(([o,k])=>{const r=Store.s.srs[o];if(r&&!Store.s.srs[k]){Store.s.srs[k]=JSON.parse(JSON.stringify(r));n++;}});if(n)Store.save();}
const isBuried=(id,t)=>{const b=Store.s.notes["bury:"+id];return !!(b&&!b.deleted&&b.d>=t);};
function dueCards(sys){
  if(!CARDS)buildCards();applyCardAlias();const t=dayNum();
  return CARDS.filter(c=>{const r=Store.s.srs[c.id];return r&&!r.sus&&r.due<=t&&inScope(c,sys)&&!isBuried(c.id,t);})
   .sort((a,b)=>Store.s.srs[a.id].due-Store.s.srs[b.id].due);
}
function newCards(sys){
  if(!CARDS)buildCards();const t=dayNum();
  return CARDS.filter(c=>!Store.s.srs[c.id]&&inScope(c,sys)&&!isBuried(c.id,t));
}
/* new cards introduced today (cards marked mastered or suspended from a menu do not use up the allowance) */
function newToday(){const t=dayNum();return Object.values(Store.s.srs).filter(r=>r&&r.first===t&&!r.mk).length;}
/* "Learn 10 more" is a one-day extra, never a change to the setting */
/* the extra granted today through grantExtraNew (80-app.js, already inside settings.newPerDay) */
function grantedToday(){const x=Store.s.settings.extraNew;return x&&x.d===dayNum()?Math.max(0,+x.n||0):0;}
/* the daily limit without today's extra */
function baseNew(){return Math.max(0,(+Store.s.settings.newPerDay||0)-grantedToday());}
function extraNewToday(){const r=Store.s.notes["xn:"+dayKey()];return (r&&!r.deleted?(r.n||0):0)+grantedToday();}
function addExtraNew(n){n=n||10;if(typeof grantExtraNew==="function")return grantExtraNew(n);const k="xn:"+dayKey(),r=Store.s.notes[k]||{n:0};Store.s.notes[k]={t:Date.now(),n:(r.n||0)+n};Store.save();return n;}

/* ---------- review log: one record per day per device, so two devices add up after a sync ---------- */
function rvRec(dk){const k="rv:"+(dk||dayKey())+":"+devId();return Store.s.notes[k]||(Store.s.notes[k]={t:Date.now(),n:0,g:[0,0,0,0],ms:0,mo:0,mn:0,nw:0});}
function rvDay(dk){const p="rv:"+dk+":",o={n:0,g:[0,0,0,0],ms:0,mo:0,mn:0,nw:0};
  for(const k in Store.s.notes){if(!k.startsWith(p))continue;const r=Store.s.notes[k];if(!r||r.deleted)continue;o.n+=r.n||0;o.ms+=r.ms||0;o.mo+=r.mo||0;o.mn+=r.mn||0;o.nw+=r.nw||0;(r.g||[]).forEach((x,i)=>o.g[i]+=x||0);}
  return o;}
function logReview(c,g,ms,wasNew,prevIv){
  const r=rvRec();r.t=Date.now();r.n++;r.g[g]=(r.g[g]||0)+1;r.ms+=Math.max(0,Math.min(ms||0,120000));if(wasNew)r.nw++;
  if(prevIv>=21){r.mn++;if(g>0)r.mo++;}
}
/* seconds per card, measured over the last 14 days (default 21 s) */
function secPerCard(){let n=0,ms=0;for(let i=0;i<14;i++){const d=rvDay(dayKey(Date.now()-i*DAY_MS));n+=d.n;ms+=d.ms;}return n>=20?clamp(ms/n/1000,8,60):21;}
function doneTodayN(){return rvDay(dayKey()).n;}

/* ---------- mood: Tired · Focused · Exam (per day, on this device) ---------- */
const MOODS={tired:["Tired","Reviews only, short, gentle hints"],focused:["Focused","Reviews first, then new cards"],exam:["Exam","No hints, strict timing, trouble spots pulled forward"]};
function sessionMood(){try{const m=JSON.parse(localStorage.getItem("galen.mood")||"null");if(m&&m.d===dayKey()&&MOODS[m.m])return m.m;}catch(e){}
  try{const p=Hub.todayFromPlan();if(p&&p.afterNight)return "tired";}catch(e){}return "focused";}
function setMood(m){try{localStorage.setItem("galen.mood",JSON.stringify({d:dayKey(),m}));}catch(e){}}

/* ---------- the day's plan: daily goal, shift days, backlog ---------- */
function dayPlan(){
  const S=Store.s.settings,mood=sessionMood();let plan=null;try{plan=Hub.todayFromPlan();}catch(e){}
  const afterNight=!!(plan&&plan.afterNight),shift=!!(plan&&plan.shift)&&!afterNight;
  const goal=clamp(+S.goalMin||15,5,120),spc=secPerCard();
  let minutes=goal,newCap=baseNew();const why=[];
  if(afterNight){minutes=Math.min(goal,10);newCap=0;why.push("After a night shift: reviews only, about 10 minutes.");}
  else if(shift){minutes=Math.min(goal,Math.max(8,Math.round(goal*.6)));newCap=Math.floor(newCap/2);why.push(`Shift day: about ${minutes} minutes.`);}
  if(mood==="tired"){minutes=Math.min(minutes,10);newCap=0;}
  const due=dueCards().length,fit=Math.max(5,Math.round(minutes*60/spc)),maxR=Math.max(5,+S.maxReviews||30);
  const light=afterNight||shift||mood==="tired";
  if(light){if(due>=fit)newCap=0;else newCap=Math.min(newCap,fit-due);}
  if(due>2*maxR){if(newCap)why.push("A backlog: no new cards until it is cleared.");newCap=0;}
  else if(due>maxR){if(newCap)why.push("A backlog: half the usual new cards.");newCap=Math.floor(newCap/2);}
  newCap+=extraNewToday();
  return {mood,afterNight,shift,light,goal,minutes,spc,fit,due,newCap,room:Math.max(0,newCap-newToday()),why};
}
/* the room for new cards today in the daily session (use this, not settings.newPerDay - newToday()) */
function newRoom(){return dayPlan().room;}

/* ---------- order: reviews first, then new; never the same sign twice in a row, types mixed ---------- */
function arrange(list,prev){
  const out=[],pool=shuf(list);const recent=prev?[prev]:[];
  const near=c=>recent.slice(-3).some(x=>sibKey(x)===sibKey(c)),last=()=>recent[recent.length-1];
  while(pool.length){
    let i=pool.findIndex(c=>!near(c)&&(!last()||c.type!==last().type));
    if(i<0)i=pool.findIndex(c=>!near(c));
    if(i<0)i=pool.findIndex(c=>!last()||sibKey(c)!==sibKey(last()));if(i<0)i=0;
    const c=pool.splice(i,1)[0];out.push(c);recent.push(c);
  }
  return out;
}
const interleave=list=>arrange(list);
/* pick new cards: round-robin across items (sign, technique, presentation), items the user has already met first */
function pickNew(sys,room,opts){
  if(room<=0)return [];
  const t=dayNum(),perKey=opts.perKey||1,scoped=opts.scoped;
  const met=new Set([...Store.s.signs.map(k=>"s:"+k),...Store.s.signs.map(k=>"sign:"+k),...Store.s.seen.map(k=>"s:"+k),...Store.s.seen.map(k=>"sound:"+k)]);
  const busy=new Set();if(!scoped)Object.keys(Store.s.srs).forEach(id=>{const r=Store.s.srs[id];if(r&&(r.first===t||(r.last&&dayNum(r.last)===t))){const c=cardById(id);if(c)busy.add(sibKey(c));}});
  (opts.taken||[]).forEach(c=>{if(!scoped)busy.add(sibKey(c));});
  const groups={};newCards(sys).forEach(c=>{const k=sibKey(c);if(busy.has(k))return;(groups[k]||(groups[k]=[])).push(c);});
  const keys=Object.keys(groups),order=[...shuf(keys.filter(k=>met.has(k))),...shuf(keys.filter(k=>!met.has(k)))];
  /* a sign's think card is the natural first introduction; the rest follow on later days */
  const first={think:0,teach:1,verdict:2,snsp:3,mech:4};
  order.forEach(k=>groups[k].sort((a,b)=>(first[a.type]??5)-(first[b.type]??5)));
  const out=[];for(let pass=0;pass<perKey&&out.length<room;pass++)for(const k of order){if(out.length>=room)break;const c=groups[k][pass];if(c)out.push(c);}
  return out;
}
let _BYID=null;function cardById(id){if(!CARDS)buildCards();if(!_BYID||_BYID.n!==CARDS.length){_BYID=new Map(CARDS.map(c=>[c.id,c]));_BYID.n=CARDS.length;}return _BYID.get(id);}

/* buildSession(scope, {more, mood, check}) → {queue, kinds} via buildSessionPlan, or just the card list (back-compatible) */
function buildSessionPlan(sys,opts){
  opts=opts||{};sys=sys||"all";const S=Store.s.settings,P=dayPlan(),mood=opts.mood||P.mood,scoped=/^(hall|chap):/.test(sys);
  const maxR=Math.max(5,+S.maxReviews||30);
  if(opts.check)return checkPlan(sys);
  let due=dueCards(sys);
  /* bury due siblings in the daily session: one card per sign a day */
  if(!scoped&&!opts.more){const seen=new Set(),t=dayNum();Object.keys(Store.s.srs).forEach(id=>{const r=Store.s.srs[id];if(r&&r.last&&dayNum(r.last)===t){const c=cardById(id);if(c&&SIGN_TYPES[c.type])seen.add(sibKey(c));}});
    due=due.filter(c=>{if(!SIGN_TYPES[c.type])return true;const k=sibKey(c);if(seen.has(k))return false;seen.add(k);return true;});}
  let cap=scoped||opts.more||sys!=="all"?maxR:Math.min(maxR,Math.max(0,P.fit-doneTodayN()));
  if(mood==="tired")cap=Math.min(cap,15);
  due=due.slice(0,cap);
  let extra=[];
  if(mood==="exam"){const ids=new Set(due.map(c=>c.id));extra=weakCards(10,sys).filter(c=>!ids.has(c.id)&&!Store.s.srs[c.id].sus).slice(0,10);}
  let room=scoped?Math.max(0,baseNew()+extraNewToday()-newToday()):P.room;
  if(mood==="tired")room=scoped?Math.min(room,5):0;
  if(opts.more&&!scoped&&room<=0)room=0;
  const fresh=pickNew(sys,room,{scoped,perKey:scoped?2:1,taken:due});
  const r1=arrange([...due,...extra]),r2=arrange(fresh,r1[r1.length-1]);
  return {queue:[...r1,...r2],kinds:[...r1.map(c=>Store.s.srs[c.id]&&Store.s.srs[c.id].due<=dayNum()?"r":"x"),...r2.map(()=>"n")],plan:P,mood};
}
function buildSession(sys,opts){return buildSessionPlan(sys,opts).queue;}

/* ---------- mastery ---------- */
function mastery(sys){
  if(!CARDS)buildCards();
  const cs=CARDS.filter(c=>inScope(c,sys));if(!cs.length)return {pct:0,seen:0,n:0};
  let m=0,seenN=0;cs.forEach(c=>{const r=Store.s.srs[c.id];if(r&&!r.sus){seenN++;if(r.iv>=7)m++;else if(r.iv>=2)m+=.4;}});
  return {pct:m/cs.length,seen:seenN,n:cs.length};
}
/* trouble spots: recent lapses (last 30 days) count, cards now held 3 weeks or more drop out */
function weakCards(n=8,sys){
  if(!CARDS)buildCards();const t=dayNum(),score=r=>{const ll=(r.ll||[]).filter(d=>t-d<=30).length;return ll?ll+(r.leech?1:0):(!r.ll&&r.l>0&&r.last&&Date.now()-r.last<30*DAY_MS?r.l*.5:0);};
  return CARDS.filter(c=>{const r=Store.s.srs[c.id];return r&&!r.sus&&r.iv<21&&inScope(c,sys)&&score(r)>0;}).sort((a,b)=>score(Store.s.srs[b.id])-score(Store.s.srs[a.id])).slice(0,n);
}

/* ---------- fading mastery for chapters and halls ----------
   Mastered = at least 85% correct over the last 30 answers in the scope, on 3 or more different days.
   Then a 5-question re-check falls due 7, 14, 30, 60 and 120 days later (then every 120). Pass = 4 of 5.
   A missed or overdue re-check fades the mastery; a failed one sends you back to building it. Stored per scope in notes "mst:<scope>". */
const MST_N=30,MST_PCT=.85,MST_DAYS=3,MST_GAPS=[7,14,30,60,120],CHECK_N=5,CHECK_PASS=4;
let _CHAPOF=null;
function cardScopes(c){
  if(!_CHAPOF||_CHAPOF.n!==(CARDS||[]).length){_CHAPOF=new Map();_CHAPOF.n=(CARDS||[]).length;
    if(typeof OUTLINE!=="undefined"&&typeof chapCardIds==="function")Object.entries(OUTLINE).forEach(([h,chs])=>chs.forEach((_,i)=>{const s=`chap:${h}:${i}`;srsScope(s).forEach(id=>{const a=_CHAPOF.get(id)||[];a.push(s);_CHAPOF.set(id,a);});}));}
  const out=[...(_CHAPOF.get(c.id)||[])];let h=null;try{h=typeof cardHall==="function"&&cardHall(c);}catch(e){}if(h)out.push("hall:"+h);return out;
}
/* Mastery is stored by the chapter's stable id, so reordering chapters never moves anyone's mastery. */
function mstKey(scope){const m=/^chap:([^:]+):(\d+)$/.exec(scope||"");if(m&&typeof OUTLINE!=="undefined"){const c=(OUTLINE[m[1]]||[])[+m[2]];if(c&&c.id)return "mst:cid:"+c.id;}return "mst:"+scope;}
function mstScopeOf(key){const s=key.slice(4);if(s.startsWith("cid:")&&typeof OUTLINE!=="undefined"){const id=s.slice(4);for(const h in OUTLINE){const i=OUTLINE[h].findIndex(c=>c.id===id);if(i>=0)return "chap:"+h+":"+i;}return null;}return s;}
function mstRec(scope){return Store.s.notes[mstKey(scope)];}
function mstNote(c,ok){
  const t=dayNum(),gained=[];
  cardScopes(c).forEach(s=>{const k=mstKey(s),r=Object.assign({a:[],seal:0,k:0},Store.s.notes[k]||{});r.a=[...(r.a||[]),[t,ok?1:0]].slice(-MST_N);r.t=Date.now();
    if(!r.seal&&r.a.length>=MST_N){const pct=r.a.reduce((x,y)=>x+y[1],0)/r.a.length,days=new Set(r.a.map(x=>x[0])).size;if(pct>=MST_PCT&&days>=MST_DAYS){r.seal=t;r.k=0;r.fade=0;gained.push(s);}}
    Store.s.notes[k]=r;});
  return gained;
}
function mstNext(r){return r.seal+MST_GAPS.slice(0,Math.min(r.k,MST_GAPS.length-1)+1).reduce((a,b)=>a+b,0)+Math.max(0,r.k-MST_GAPS.length+1)*120;}
/* state of a scope: none · building · mastered · check (re-check due) · fading (re-check well overdue) */
function scopeMastery(scope){
  const r=mstRec(scope)||{a:[]},a=r.a||[],t=dayNum(),n=a.length,pct=n?a.reduce((x,y)=>x+y[1],0)/n:0,days=new Set(a.map(x=>x[0])).size;
  if(!r.seal)return {state:n?"building":"none",n,need:MST_N,pct,days,needDays:MST_DAYS,faded:!!r.fade};
  const next=mstNext(r),gap=MST_GAPS[Math.min(r.k,MST_GAPS.length-1)];
  const state=t<next?"mastered":t-next>Math.max(3,Math.round(gap/2))?"fading":"check";
  return {state,n,pct,days,seal:r.seal,next,checks:r.k,gap,level:state==="mastered"?1:state==="check"?.85:Math.max(.3,1-(t-next)/(gap*2))};
}
function checkPlan(scope){
  const ids=[...srsScope(scope)].filter(id=>Store.s.srs[id]&&!Store.s.srs[id].sus);
  const pool=shuf(ids).map(cardById).filter(Boolean),pickd=[];const keys=new Set();
  pool.forEach(c=>{if(pickd.length<CHECK_N&&!keys.has(sibKey(c))){keys.add(sibKey(c));pickd.push(c);}});
  pool.forEach(c=>{if(pickd.length<CHECK_N&&!pickd.includes(c))pickd.push(c);});
  if(pickd.length<CHECK_N)shuf([...srsScope(scope)].filter(id=>!Store.s.srs[id]).map(cardById).filter(Boolean)).forEach(c=>{if(pickd.length<CHECK_N)pickd.push(c);});
  const q=arrange(pickd);return {queue:q,kinds:q.map(()=>"c"),plan:dayPlan(),mood:"exam",check:true};
}
function checkResult(scope,right,total){
  const k=mstKey(scope),r=Object.assign({a:[],seal:0,k:0},Store.s.notes[k]||{});const pass=right>=CHECK_PASS;
  r.chk=[...(r.chk||[]),{d:dayNum(),ok:right,n:total}].slice(-10);r.t=Date.now();
  if(pass){r.k=(r.k||0)+1;if(dayNum()>mstNext(Object.assign({},r,{k:r.k-1}))+3){/* late but passed: restart the ladder from today */r.seal=dayNum();r.k=0;}}
  else{r.seal=0;r.k=0;r.fade=1;r.a=(r.a||[]).slice(-10);}
  Store.s.notes[k]=r;Store.save();return pass;
}
/* every scope with a re-check due today, for Today and the hall pages */
function checksDue(){const out=[];for(const k in Store.s.notes){if(!k.startsWith("mst:"))continue;const s=mstScopeOf(k);if(!s)continue;const m=scopeMastery(s);if(m.state==="check"||m.state==="fading")out.push([s,m]);}return out;}

/* ---------- weekly recap: the last full week. ISO week, Monday to Sunday, unless settings.weekStart (0 Sun … 6 Sat) is set ---------- */
function weekStartOf(d){const ws=Store.s.settings.weekStart;const first=Number.isInteger(ws)&&ws>=0&&ws<=6?ws:1;const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()-first+7)%7));return x;}
function recapWeek(back){
  back=back==null?1:back;const s0=weekStartOf(new Date());s0.setDate(s0.getDate()-7*back);
  const keys=[...Array(7)].map((_,i)=>{const d=new Date(s0);d.setDate(d.getDate()+i);return dayKey(d.getTime());});
  const start=new Date(s0),end=new Date(s0);end.setDate(end.getDate()+6);
  const R={n:0,g:[0,0,0,0],ms:0,mo:0,mn:0,nw:0};keys.forEach(k=>{const d=rvDay(k);R.n+=d.n;R.ms+=d.ms;R.mo+=d.mo;R.mn+=d.mn;R.nw+=d.nw;d.g.forEach((x,i)=>R.g[i]+=x);});
  const days=keys.filter(k=>Store.s.days[k]).length,items=keys.reduce((a,k)=>a+(Store.s.days[k]||0),0);
  const d0=dayNum(start.getTime()),d1=dayNum(end.getTime());
  const lapsed=(CARDS||buildCards()).filter(c=>{const r=Store.s.srs[c.id];return r&&(r.ll||[]).some(d=>d>=d0&&d<=d1);}).sort((a,b)=>Store.s.srs[b.id].ll.filter(d=>d>=d0&&d<=d1).length-Store.s.srs[a.id].ll.filter(d=>d>=d0&&d<=d1).length).slice(0,5);
  const t=dayNum(),fc=[...Array(7)].map((_,i)=>Object.values(Store.s.srs).filter(r=>r&&!r.sus&&(i===0?r.due<=t:r.due===t+i)).length);
  return {start,end,keys,days,items,reviews:R.n,grades:R.g,minutes:Math.round(R.ms/60000),newCards:R.nw,retention:R.mn?R.mo/R.mn:null,matureN:R.mn,lapsed,forecast:fc,weekStartsOn:Number.isInteger(Store.s.settings.weekStart)?Store.s.settings.weekStart:1};
}
