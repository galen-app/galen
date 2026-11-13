"use strict";
/* Scheduler and sessions: scope, SM-2 schedule, due/new, interleave, buildSession, mastery, weak cards. */
/* scope: "all", a system id, or "reg:<region>" */
const inScope=(c,sys)=>!sys||sys==="all"||(sys.startsWith("reg:")?c.reg===sys.slice(4):c.sys===sys);

/* SM-2 style scheduler with in-session relearning. grade: 0 again · 1 hard · 2 good · 3 easy */
function schedule(id,grade){
  const today=dayNum(),r=Store.s.srs[id]||{iv:0,ef:2.5,n:0,l:0,due:today,first:today};
  if(grade===0){r.l++;r.n=0;r.iv=0;r.ef=Math.max(1.3,r.ef-.2);r.due=today;}
  else{
    r.n++;
    if(r.n===1)r.iv=grade===3?4:grade===1?1:2;
    else if(r.n===2)r.iv=grade===1?3:grade===3?8:6;
    else r.iv=Math.max(r.iv+1,Math.round(r.iv*r.ef*(grade===1?.6:grade===3?1.3:1)));
    r.ef=Math.min(3,Math.max(1.3,r.ef+(grade===1?-.15:grade===3?.1:0)));
    r.due=today+r.iv;
  }
  r.last=Date.now();Store.s.srs[id]=r;tick(1,"session");Store.save();
  return r;
}
function dueCards(sys){
  if(!CARDS)buildCards();const t=dayNum();
  return CARDS.filter(c=>{const r=Store.s.srs[c.id];return r&&r.due<=t&&inScope(c,sys);})
   .sort((a,b)=>Store.s.srs[a.id].due-Store.s.srs[b.id].due);
}
function newCards(sys){
  if(!CARDS)buildCards();
  return CARDS.filter(c=>!Store.s.srs[c.id]&&inScope(c,sys));
}
function newToday(){const t=dayNum();return Object.values(Store.s.srs).filter(r=>r.first===t).length;}
/* Interleave: never two cards of the same type in a row when it can be avoided. */
function interleave(list){
  const out=[],pool=shuf(list);
  while(pool.length){
    const prev=out[out.length-1];let i=pool.findIndex(c=>!prev||c.type!==prev.type);if(i<0)i=0;
    out.push(pool.splice(i,1)[0]);
  }
  return out;
}
function buildSession(sys){
  const S=Store.s.settings,due=dueCards(sys).slice(0,S.maxReviews);
  const room=Math.max(0,S.newPerDay-newToday());
  /* new cards: prefer items the user has already met in the app (opened signs, heard sounds, reviewed modules) */
  const met=new Set([...Store.s.signs.map(k=>"t:"+k),...Store.s.signs.map(k=>"v:"+k),...Store.s.signs.map(k=>"ss:"+k),...Store.s.seen.map(k=>"s:"+k)]);
  /* rotate across card types so a session is genuinely mixed; within each type, items already met come first */
  const byType={};newCards(sys).forEach(c=>(byType[c.type]||(byType[c.type]=[])).push(c));
  Object.keys(byType).forEach(t=>{const L=byType[t];byType[t]=[...shuf(L.filter(c=>met.has(c.id))),...shuf(L.filter(c=>!met.has(c.id)))];});
  const types=shuf(Object.keys(byType)),fresh=[];
  while(fresh.length<room&&types.some(t=>byType[t].length))types.forEach(t=>{if(fresh.length<room&&byType[t].length)fresh.push(byType[t].shift());});
  return interleave([...due,...fresh]);
}
function mastery(sys){
  if(!CARDS)buildCards();
  const cs=CARDS.filter(c=>inScope(c,sys));if(!cs.length)return {pct:0,seen:0,n:0};
  let m=0,seenN=0;cs.forEach(c=>{const r=Store.s.srs[c.id];if(r){seenN++;if(r.iv>=7)m++;else if(r.iv>=2)m+=.4;}});
  return {pct:m/cs.length,seen:seenN,n:cs.length};
}
function weakCards(n=8){
  if(!CARDS)buildCards();
  return CARDS.filter(c=>{const r=Store.s.srs[c.id];return r&&r.l>0;}).sort((a,b)=>Store.s.srs[b.id].l-Store.s.srs[a.id].l).slice(0,n);
}
