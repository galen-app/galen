"use strict";
/* ================= STATE & STORAGE =================
 One versioned state object (v:3, format revision fmt:4), saved to this browser at once and to Drive (or the
 viewer's Claude storage) when signed in, so progress follows the user across phone, Deck and tablet.

 How copies from several devices and tabs come together (mergeStates):
 - every record (cards, drills, scores, notes, photos, log entries) carries _m, the time it last changed on
   any device. It is stamped automatically at save time by comparing with the last saved copy (Store.commit),
   so other files just change Store.s and call Store.save(). The later record wins.
 - technique records, round marks, log entries and settings merge field by field (_ft / settingsTs), so work
   done on two devices on the same record adds up instead of one copy replacing the other.
 - a deletion leaves a tombstone (tomb[coll][id] = time) so the other device's copy does not come back.
 - a reset stamps an epoch, for everything (epoch) or for one group (epochs[group]). Anything older than the
   epoch is dropped from every copy, so a reset is not undone by the next sync.
 - XP and day counts are per-device counters (ctr[device] = {s, xp, d:{day:n}}), summed across devices, so
   study on the phone and on the Deck adds up. ctr._base holds what was counted before counters existed.
 - times come from a clock corrected against the server's Date header, and any time more than 10 minutes in
   the future is clamped on arrival, so a device with a fast clock cannot win every conflict.
 - unknown keys from a newer build are carried through; a newer-format copy is never overwritten.
*/
const DAY_MS=864e5;
const pad2=n=>String(n).padStart(2,"0");
const dayKey=(t=Date.now())=>{const d=new Date(t);return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;};
const dayNum=(t=Date.now())=>{const d=new Date(t);return Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()))/DAY_MS);};
const fmtDate=t=>{const d=new Date(t);return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;};
const LS="galen.v3";
const STATE_FMT=4;               /* format revision inside v:3; old builds read it as plain v3 */
function _blankState(){return {v:3,updated:0,srs:{},snd:{},log:[],days:{},seen:[],signs:[],mods:[],er:[],hd:{},rehearse:{},loc:{},dprac:{},dseen:[],pins:{},hides:{},photos:{},notes:{},xp:0,settings:{newPerDay:10,maxReviews:30,out:"speaker",tone:1,goalMin:15,name:""},last:null};}
function blankState(){return _blankState();}
const OBJ_KEYS=["srs","snd","days","hd","rehearse","loc","dprac","pins","hides","photos","notes"],ARR_KEYS=["log","seen","signs","mods","er","dseen"];
const ST_REC=["srs","snd","hd","rehearse","loc","dprac","pins","hides","photos","notes"];
const ST_LISTS=["seen","signs","mods","er","dseen"];
const ST_KNOWN=new Set([...Object.keys(_blankState()),"settingsTs","epoch","epochs","tomb","ctr","fmt"]);
/* reset groups: what a selective reset (and its epoch) covers */
const ST_GROUPS={
  cards:{label:"Cards and their schedule",sub:"every card's interval, lapses and review history"},
  drills:{label:"Sound drills",sub:"heart and lung sound drill scores"},
  practice:{label:"Case and practice scores",sub:"cases, rehearsals, localiser and skin plates"},
  tech:{label:"Technique clinic",sub:"walk-throughs, orders, error spots, reps and confidence"},
  study:{label:"Daily rounds, maps, narration and sketches",sub:"round ticks and 'I can explain this' marks"},
  eggs:{label:"Easter eggs and codex seals",sub:"what you have found and read"},
  log:{label:"Bedside log",sub:"signs you logged on real patients"},
  seen:{label:"Pages opened",sub:"signs, modules and ER topics marked as seen"},
  xp:{label:"XP, streak and daily counts",sub:"your level and the week dots"},
  photos:{label:"Pinned, hidden and own photos",sub:"your own photos stay in Drive; this forgets the links"}
};
const ST_RESET_DEFAULT=Object.keys(ST_GROUPS).filter(g=>!ST_GROUPS[g].optional);
function stGroupOf(c,id){
  if(c==="srs")return "cards";if(c==="snd")return "drills";if(c==="log")return "log";
  if(c==="hd"||c==="rehearse"||c==="loc"||c==="dprac")return "practice";
  if(c==="pins"||c==="hides"||c==="photos")return "photos";
  if(c==="notes"){const p=String(id).split(":")[0];return p==="tech"?"tech":p==="egg"||p==="lore"?"eggs":p==="rv"?"cards":"study";}
  return ST_LISTS.includes(c)?"seen":"study";
}
const stGroupEpoch=(s,g)=>Math.max(+(s&&s.epoch)||0,+(s&&s.epochs&&s.epochs[g])||0);

/* ---- a clock that cannot run ahead: corrected by the server's Date header, monotonic within the session ---- */
const GClock={off:0,lastT:0,SKEW:10*60*1000,
  now(){return Date.now()-this.off;},
  stamp(){const n=Math.round(this.now());this.lastT=Math.max(n,this.lastT+1);return this.lastT;},
  seen(t){if(t>this.lastT&&t<=this.now()+this.SKEW)this.lastT=t;},
  load(){try{const j=JSON.parse(localStorage.getItem("galen.clock")||"null");if(j&&Number.isFinite(j.off)&&Math.abs(j.off)<366*DAY_MS)this.off=j.off;}catch(e){}},
  async check(){
    if(typeof fetch!=="function"||typeof location==="undefined"||!/^https?:/.test(location.protocol)||(typeof navigator!=="undefined"&&navigator.onLine===false))return;
    try{const t0=Date.now();const r=await fetch(location.pathname+"?clock="+t0,{method:"HEAD",cache:"no-store"});const t1=Date.now();
      const d=Date.parse(r.headers.get("date")||"");if(!d||t1-t0>8000)return;
      const off=Math.round((t0+t1)/2-(d+500));       /* the header is cut to whole seconds */
      this.off=Math.abs(off)>2*60*1000?off:0;
      try{localStorage.setItem("galen.clock",JSON.stringify({off:this.off,at:t1}));}catch(e){}
    }catch(e){}
  }
};

/* ---- cleaning anything that arrives (disk, Drive, a backup file) ---- */
const ST_BADKEY=k=>k==="__proto__"||k==="constructor"||k==="prototype";
const ST_ID=/^[^<>"'`\\\u0000-\u001f]{1,200}$/;   /* any id, but nothing that can break out of HTML */
const stObj=o=>!!o&&typeof o==="object"&&!Array.isArray(o);
function stClean(v,depth){
  if(v===null)return null;const t=typeof v;
  if(t==="number")return Number.isFinite(v)?v:undefined;
  if(t==="string")return v.length>20000?v.slice(0,20000):v;
  if(t==="boolean")return v;
  if(t!=="object"||depth>14)return undefined;
  if(Array.isArray(v)){const o=[];for(const x of v){const c=stClean(x,depth+1);if(c!==undefined)o.push(c);}return o;}
  const o={};for(const k of Object.keys(v)){if(ST_BADKEY(k))continue;const c=stClean(v[k],depth+1);if(c!==undefined)o[k]=c;}return o;
}
/* the JSON reviver for anything parsed here */
const stParse=raw=>JSON.parse(raw,(k,v)=>ST_BADKEY(k)?undefined:v);
/* best effort for a truncated or damaged file: cut back to the last complete value and close the brackets */
function repairJSON(raw){
  if(typeof raw!=="string"||!raw)return null;
  const st=[],safe=[];let inStr=false,es=false;
  for(let i=0;i<raw.length;i++){const c=raw[i];
    if(inStr){if(es)es=false;else if(c==="\\")es=true;else if(c==='"')inStr=false;continue;}
    if(c==='"'){inStr=true;continue;}
    if(c==="{"||c==="["){st.push(c);continue;}
    if(c==="}"||c==="]"){if(!st.length)break;st.pop();safe.push([i+1,st.slice()]);if(!st.length)break;continue;}
    if(c===",")safe.push([i,st.slice()]);
  }
  for(let j=safe.length-1,tries=0;j>=0&&tries<80;j--,tries++){const [cut,stack]=safe[j];let s=raw.slice(0,cut);for(let k=stack.length-1;k>=0;k--)s+=stack[k]==="{"?"}":"]";
    try{const o=stParse(s);if(stObj(o))return o;}catch(e){}}
  return null;
}
function stIsNewer(x){return stObj(x)&&((+x.v>3)||(+x.fmt>STATE_FMT));}
function stLooksLikeState(x){return stObj(x)&&(+x.v===2||+x.v===3||(x.v==null&&(stObj(x.srs)||Array.isArray(x.log))));}
function sanitizeState(x){
  const s=stClean(stObj(x)?x:{},0)||{};
  const b=_blankState();for(const k of Object.keys(b))if(!(k in s))s[k]=b[k];
  const nowT=Math.max(Date.now(),GClock.now()),lim=nowT+GClock.SKEW,today=dayNum(),maxDay=dayKey(Date.now()+DAY_MS);
  /* data times from the future become now; merge stamps from the future become 1, so they lose every conflict
     (re-clamping them to "now" on each sync would let them beat edits made in between) */
  const tm=v=>{v=+v;if(!Number.isFinite(v)||v<0)return 0;return v>lim?Math.round(nowT):v;};
  const ts=v=>{v=+v;if(!Number.isFinite(v)||v<0)return 0;return v>lim?1:v;};
  const num=(v,d,lo,hi)=>{v=+v;if(!Number.isFinite(v))return d;return Math.min(hi,Math.max(lo,v));};
  const int=(v,d,lo,hi)=>Math.round(num(v,d,lo,hi));
  OBJ_KEYS.forEach(k=>{if(!stObj(s[k]))s[k]={};});
  ARR_KEYS.forEach(k=>{if(!Array.isArray(s[k]))s[k]=[];});
  const fixTimes=(r,c)=>{for(const f of (c==="srs"?["t","at","last","verAt"]:["t","at","verAt"]))if(f in r&&r[f]!=null&&typeof r[f]!=="boolean")r[f]=tm(r[f]);
    if("_m" in r){r._m=ts(r._m);if(!r._m)delete r._m;}
    if("_ft" in r){if(stObj(r._ft)){for(const f of Object.keys(r._ft))r._ft[f]=ts(r._ft[f]);}else delete r._ft;}};
  for(const c of ST_REC){const C=s[c];for(const id of Object.keys(C)){const r=C[id];if(!ST_ID.test(id)||!stObj(r)){delete C[id];continue;}fixTimes(r,c);
    if(c==="srs"){r.iv=num(r.iv,0,0,36500);r.ef=num(r.ef,2.5,1.3,3);r.n=int(r.n,0,0,1e6);r.l=int(r.l,0,0,1e6);r.due=int(r.due,today,0,today+36600);r.first=int(r.first,r.due,0,today+36600);}
    else if(c==="snd"){if("n" in r)r.n=num(r.n,0,0,1e7);if("r" in r)r.r=num(r.r,0,0,1e7);}
    else if(c==="hd"||c==="rehearse"||c==="loc"||c==="dprac"){for(const f of ["best","last","n"])if(f in r)r[f]=num(r[f],0,-1e6,1e7);}
    else if(c==="photos"){for(const f of ["name","subject","caption"])if(f in r&&typeof r[f]!=="string")r[f]=String(r[f]);if("size" in r)r.size=num(r.size,0,0,1e10);}}}
  const d0=s.days;s.days={};for(const k of Object.keys(d0))if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&k<=maxDay){const v=int(d0[k],0,0,1e6);if(v>0)s.days[k]=v;}
  for(const k of ST_LISTS)s[k]=[...new Set(s[k].filter(x=>typeof x==="string"&&ST_ID.test(x)))];
  const log=[];const ids=new Set();
  for(const e of s.log){if(!stObj(e))continue;fixTimes(e,"log");if(typeof e.id!=="string"||!ST_ID.test(e.id))e.id=String(Math.round(e.at||e.t||0)||("x"+log.length));
    if(ids.has(e.id))continue;ids.add(e.id);
    if("conf" in e){if(e.conf==null||e.conf==="")delete e.conf;else e.conf=int(e.conf,50,0,100);}
    for(const f of ["what","sign","by","note","ver","dx"])if(f in e&&e[f]!=null&&typeof e[f]!=="string")e[f]=String(e[f]);
    log.push(e);}
  s.log=log.sort((x,y)=>(x.t||x.at||0)-(y.t||y.at||0)).slice(-400);
  s.xp=int(s.xp,0,0,1e9);
  const S=stObj(s.settings)?s.settings:{};const D=b.settings;
  S.newPerDay=int(S.newPerDay,D.newPerDay,0,50);S.maxReviews=int(S.maxReviews,D.maxReviews,5,500);S.goalMin=int(S.goalMin,D.goalMin,1,240);
  S.tone=num(S.tone,D.tone,0,10);S.name=typeof S.name==="string"?S.name.slice(0,60):"";S.out=typeof S.out==="string"&&S.out.length<24?S.out:"speaker";
  if("theme" in S&&!["","light","dark"].includes(S.theme))S.theme="";
  s.settings=Object.assign({},D,S);
  if(s.settingsTs!==undefined){if(stObj(s.settingsTs)){for(const k of Object.keys(s.settingsTs))s.settingsTs[k]=ts(s.settingsTs[k]);}else delete s.settingsTs;}
  if(s.epoch!==undefined){s.epoch=ts(s.epoch);if(!s.epoch)delete s.epoch;}
  if(s.epochs!==undefined){if(stObj(s.epochs)){for(const k of Object.keys(s.epochs)){s.epochs[k]=ts(s.epochs[k]);if(!s.epochs[k])delete s.epochs[k];}}else delete s.epochs;}
  if(s.tomb!==undefined){if(stObj(s.tomb)){for(const c of Object.keys(s.tomb)){const T=s.tomb[c];if(!stObj(T)){delete s.tomb[c];continue;}for(const id of Object.keys(T)){T[id]=ts(T[id]);if(!T[id]||!ST_ID.test(id))delete T[id];}}}else delete s.tomb;}
  if(s.ctr!==undefined){if(stObj(s.ctr)){for(const k of Object.keys(s.ctr)){const e=s.ctr[k];if(!stObj(e)||!ST_ID.test(k)){delete s.ctr[k];continue;}
      e.s=int(e.s,0,0,1e12);e.xp=num(e.xp,0,-1e9,1e9);const d={};if(stObj(e.d))for(const day of Object.keys(e.d))if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&day<=maxDay){const v=num(e.d[day],0,-1e6,1e6);if(v)d[day]=v;}e.d=d;if("t" in e)e.t=ts(e.t);}}
    else delete s.ctr;}
  s.updated=ts(s.updated);s.v=3;
  if(s.fmt!==undefined)s.fmt=int(s.fmt,STATE_FMT,0,1e6);
  return s;
}

/* ---- per-device counters ---- */
const stCtrEpoch=s=>stGroupEpoch(s,"xp");
function stCtrSum(ctr){let xp=0;const d={};for(const k of Object.keys(ctr||{})){const e=ctr[k];xp+=e.xp||0;for(const day of Object.keys(e.d||{}))d[day]=(d[day]||0)+(e.d[day]||0);}return {xp,d};}
function stCtrApply(s){const {xp,d}=stCtrSum(s.ctr);s.xp=Math.max(0,Math.round(xp));const days={};for(const k of Object.keys(d).sort()){const v=Math.round(d[k]);if(v>0)days[k]=v;}s.days=days;}
/* a copy without counters (old build, or before this format): everything it counted becomes the shared base */
function stCtrEnsure(s){if(!stObj(s.ctr)){s.ctr={_base:{s:0,xp:s.xp||0,d:Object.assign({},s.days||{})}};return true;}return false;}
/* whatever changed in xp/days since the counters were last summed belongs to this device */
function stCtrAbsorb(s,dev,stamp){
  stCtrEnsure(s);const {xp,d}=stCtrSum(s.ctr);const own=s.ctr[dev]||(s.ctr[dev]={s:0,xp:0,d:{}});if(!stObj(own.d))own.d={};let ch=false;
  const vx=Number.isFinite(+s.xp)?+s.xp:0;const dx=vx-xp;if(Math.abs(dx)>1e-9){own.xp=(own.xp||0)+dx;ch=true;}
  const days=stObj(s.days)?s.days:{};
  for(const k of new Set([...Object.keys(days),...Object.keys(d)])){if(!/^\d{4}-\d{2}-\d{2}$/.test(k))continue;const v=Number.isFinite(+days[k])?+days[k]:0;const dv=v-(d[k]||0);if(Math.abs(dv)>1e-9){own.d[k]=(own.d[k]||0)+dv;if(!own.d[k])delete own.d[k];ch=true;}}
  if(ch){own.s=(own.s||0)+1;own.t=stamp?stamp():Date.now();}
  return ch;
}

/* ---- record merges ---- */
const stUni=(x,y)=>[...new Set([...(x||[]),...(y||[])])];
function stRecTime(c,r){if(!r||typeof r!=="object")return 0;return r._m||(c==="srs"?(r.last||0):(r.at||r.t||r.verAt||0))||0;}
function stLater(c,x,y){const tx=stRecTime(c,x),ty=stRecTime(c,y);if(tx!==ty)return ty>tx?y:x;return JSON.stringify(y)>JSON.stringify(x)?y:x;}
/* field by field: each field from the side that changed it last (_ft), falling back to the record's own time */
function stFieldwise(c,x,y){
  const o={},ft={},fx=stObj(x._ft)?x._ft:{},fy=stObj(y._ft)?y._ft:{},bx=stRecTime(c,x),by=stRecTime(c,y);
  for(const f of stUni(Object.keys(x),Object.keys(y))){if(f==="_m"||f==="_ft")continue;
    const tx=fx[f]||bx,ty=fy[f]||by;const useY=ty>tx||(ty===tx&&String(JSON.stringify(y[f]))>String(JSON.stringify(x[f])));
    const src=useY?y:x,oth=useY?x:y,srcFt=useY?fy:fx;
    if(f in src)o[f]=src[f];else if(!srcFt[f]&&f in oth)o[f]=oth[f];   /* the later side never had it: keep the other's */
    const t=Math.max(fx[f]||0,fy[f]||0);if(t)ft[f]=t;}
  const m=Math.max(x._m||0,y._m||0);if(m)o._m=m;if(Object.keys(ft).length)o._ft=ft;return o;
}
function stUnionBy(a,b,key,sortKey,cap){const m=new Map();for(const e of [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])]){const k=key(e);if(!m.has(k))m.set(k,e);}return [...m.values()].sort((p,q)=>(sortKey(p)||0)-(sortKey(q)||0)).slice(-cap);}
/* technique record: best scores take the max, confidence ratings and reps are unions, the rest field by field */
function stMergeTech(x0,y0){
  /* techSave writes ft:{field:time}; use the later of ft and _ft for each field */
  const lift=r=>{if(!stObj(r.ft))return r;const f=Object.assign({},stObj(r._ft)?r._ft:{});for(const k of Object.keys(r.ft)){const t=+r.ft[k]||0;if(t>(f[k]||0))f[k]=t;}return Object.assign({},r,{_ft:f});};
  const x=lift(x0),y=lift(y0);const o=stFieldwise("notes",x,y);
  if(stObj(x.ft)||stObj(y.ft)){const ft={};for(const r of [x,y])for(const k of Object.keys(r.ft||{}))ft[k]=Math.max(ft[k]||0,+r.ft[k]||0);o.ft=ft;}
  const fx=stObj(x._ft)?x._ft:{},fy=stObj(y._ft)?y._ft:{},bx=stRecTime("notes",x),by=stRecTime("notes",y);
  const first=f=>((fy[f]||by)>(fx[f]||bx))?[y,x]:[x,y];   /* the side that changed this list last goes first */
  for(const f of ["walk","order","mcq","why"])if(x[f]!=null||y[f]!=null)o[f]=Math.max(+x[f]||0,+y[f]||0);
  if(x.read||y.read)o.read=o.read||x.read||y.read;
  if(x.mcqOk||y.mcqOk)o.mcqOk=stUni(Array.isArray(x.mcqOk)?x.mcqOk:[],Array.isArray(y.mcqOk)?y.mcqOk:[]);
  if(x.conf||y.conf){const [p,q]=first("conf");o.conf=stUnionBy(p.conf,q.conf,e=>Array.isArray(e)?String(e[0]):JSON.stringify(e),e=>Array.isArray(e)?e[0]:0,20);}
  if(x.reps||y.reps){const [p,q]=first("reps");o.reps=stUnionBy(p.reps,q.reps,e=>e&&e.t!=null?String(e.t):JSON.stringify(e),e=>e&&e.t,30);}
  o.t=Math.max(x.t||0,y.t||0)||o.t;return o;}
/* daily round: each tick keeps its first time */
function stMergeRound(x,y){const o={};for(const f of stUni(Object.keys(x),Object.keys(y))){if(f==="_ft")continue;const a=x[f],b=y[f];
  if(f==="t"||f==="_m")o[f]=Math.max(+a||0,+b||0);else if(typeof a==="number"&&typeof b==="number")o[f]=Math.min(a,b);else o[f]=a!=null&&a!==false?a:b;}return o;}
function stMergeRec(c,id,x,y){
  if(c==="snd"){if(!x._m&&!y._m){const o=Object.assign({},x,y,{m:x.m||y.m,n:Math.max(x.n||0,y.n||0),r:Math.max(x.r||0,y.r||0)});const mt=Math.max(x.mt||0,y.mt||0);if(mt)o.mt=mt;else delete o.mt;return o;}return stLater(c,x,y);}
  if(c==="hd"||c==="rehearse"||c==="loc"||c==="dprac"){const late=stLater(c,x,y);return Object.assign({},x,y,late,{best:Math.max(x.best||0,y.best||0),n:Math.max(x.n||0,y.n||0)});}
  if(c==="notes"){const p=String(id).split(":")[0];if(p==="tech")return stMergeTech(x,y);if(p==="round")return stMergeRound(x,y);}
  return stLater(c,x,y);
}
const stLegacyLog=(p,x)=>(x.verAt||0)>(p.verAt||0)?x:p;   /* later verAt wins (undo and delete set a newer verAt) */
/* drop what an epoch or a tombstone has removed (in place) */
function stPrune(o){
  const tomb=o.tomb||{},cut=GClock.now()-400*DAY_MS;
  for(const c of ST_REC){const C=o[c],T=tomb[c]||{};for(const id of Object.keys(C)){const r=C[id],t=stRecTime(c,r),E=stGroupEpoch(o,stGroupOf(c,id)),tb=T[id]||0;
    if((E&&t<=E)||(tb&&t<=tb))delete C[id];else if(tb)delete T[id];}}
  {const E=stGroupEpoch(o,"log"),T=tomb.log||{};o.log=o.log.filter(e=>{const t=stRecTime("log",e),tb=T[e.id]||0;if((E&&t<=E)||(tb&&t<=tb))return false;if(tb)delete T[e.id];return true;});}
  for(const c of Object.keys(tomb)){const T=tomb[c];for(const id of Object.keys(T)){const E=stGroupEpoch(o,stGroupOf(c,id));if(T[id]<=E||T[id]<cut)delete T[id];}if(!Object.keys(T).length)delete tomb[c];}
  if(Object.keys(tomb).length)o.tomb=tomb;else delete o.tomb;
  return o;
}
/* the merge itself: pure, deterministic, never throws on odd input */
function _mergeStates(a0,b0){
  const a=sanitizeState(a0),b=sanitizeState(b0);
  const aLegacy=!stObj(a.ctr),bLegacy=!stObj(b.ctr);
  const newer=(b.updated||0)>(a.updated||0)?b:a,older=newer===a?b:a;
  const o=_blankState();
  /* unknown keys (from a newer build) are carried, never dropped */
  for(const k of Object.keys(older))if(!ST_KNOWN.has(k))o[k]=older[k];
  for(const k of Object.keys(newer))if(!ST_KNOWN.has(k))o[k]=newer[k];
  /* epochs */
  const E=Math.max(a.epoch||0,b.epoch||0);if(E)o.epoch=E;
  const eps={};for(const s of [a,b])for(const g of Object.keys(s.epochs||{}))eps[g]=Math.max(eps[g]||0,s.epochs[g]);if(Object.keys(eps).length)o.epochs=eps;
  /* tombstones */
  const tomb={};for(const s of [a,b])for(const c of Object.keys(s.tomb||{})){const T=tomb[c]||(tomb[c]={});for(const id of Object.keys(s.tomb[c]))T[id]=Math.max(T[id]||0,s.tomb[c][id]);}o.tomb=tomb;
  /* records */
  let maxT=0;
  for(const c of ST_REC){const A=a[c],B=b[c],O={};for(const id of stUni(Object.keys(A),Object.keys(B)).sort()){const x=A[id],y=B[id];const r=(!x||!y)?(x||y):stMergeRec(c,id,x,y);O[id]=r;const t=r&&r._m||0;if(t>maxT)maxT=t;}o[c]=O;}
  /* lists: a copy from before a reset of that list contributes nothing */
  const gs=stGroupEpoch(o,"seen");for(const k of ST_LISTS)o[k]=stUni(stGroupEpoch(a,"seen")>=gs?a[k]:[],stGroupEpoch(b,"seen")>=gs?b[k]:[]);
  /* log */
  const byId=new Map();for(const x of [...a.log,...b.log]){const p=byId.get(x.id);if(!p){byId.set(x.id,x);continue;}byId.set(x.id,(p._ft||x._ft||p._m||x._m)?stFieldwise("log",p,x):stLegacyLog(p,x));}
  o.log=[...byId.values()].sort((x,y)=>(x.t||x.at||0)-(y.t||y.at||0)).slice(-400);
  /* counters: per device, summed */
  const CE=stCtrEpoch(o),sides=[[a,aLegacy],[b,bLegacy]].filter(([s])=>stCtrEpoch(s)>=CE);
  /* a copy saved without a commit shows totals above its counters: keep that gain in its base */
  for(const [s,leg] of sides){if(leg)continue;const sum=stCtrSum(s.ctr),base=s.ctr._base||(s.ctr._base={s:0,xp:0,d:{}});if(!stObj(base.d))base.d={};
    if((s.xp||0)>Math.round(sum.xp)&&sum.xp>=0)base.xp=(base.xp||0)+(s.xp-sum.xp);
    for(const d of Object.keys(s.days))if((s.days[d]||0)>Math.round(sum.d[d]||0))base.d[d]=(base.d[d]||0)+(s.days[d]-(sum.d[d]||0));}
  const ctr={};
  for(const [s,leg] of sides){if(leg)continue;for(const k of Object.keys(s.ctr)){const e=s.ctr[k],p=ctr[k];
    if(k==="_base"){if(!p)ctr[k]=JSON.parse(JSON.stringify(e));else{p.xp=Math.max(p.xp||0,e.xp||0);for(const d of Object.keys(e.d||{}))p.d[d]=Math.max(p.d[d]||0,e.d[d]||0);}}
    else if(!p||(e.s||0)>(p.s||0)||((e.s||0)===(p.s||0)&&(e.xp||0)>(p.xp||0)))ctr[k]=JSON.parse(JSON.stringify(e));}}
  /* an old build's copy (or a hand-edited one) shows a total; never end below it */
  {const base=ctr._base||(ctr._base={s:0,xp:0,d:{}});const sum=stCtrSum(ctr);
    for(const [s,leg] of sides){if(!leg)continue;if((s.xp||0)>sum.xp){base.xp+=(s.xp-sum.xp);sum.xp=s.xp;}for(const d of Object.keys(s.days)){if((s.days[d]||0)>(sum.d[d]||0)){base.d[d]=(base.d[d]||0)+(s.days[d]-(sum.d[d]||0));sum.d[d]=s.days[d];}}}}
  o.ctr=ctr;stCtrApply(o);
  /* settings, key by key on their own times; an unstamped value loses to a stamped one */
  const SA=a.settings,SB=b.settings,TA=a.settingsTs||{},TB=b.settingsTs||{};
  o.settings=Object.assign(_blankState().settings,older.settings,newer.settings);const ts={};
  for(const k of stUni(Object.keys(SA),Object.keys(SB))){const ta=TA[k]||0,tb=TB[k]||0;if(ta||tb){o.settings[k]=tb>ta?(k in SB?SB[k]:SA[k]):(k in SA?SA[k]:SB[k]);ts[k]=Math.max(ta,tb);}}
  if(Object.keys(ts).length)o.settingsTs=ts;
  o.last=newer.last!=null?newer.last:older.last;o.updated=Math.max(a.updated||0,b.updated||0);o.v=3;o.fmt=Math.max(STATE_FMT,a.fmt||0,b.fmt||0);
  stPrune(o);GClock.seen(maxT);
  return o;
}
/* public: merging with the live state first stamps this device's unsaved changes */
function mergeStates(a,b){
  if(!a&&!b)return a||b;
  try{if(typeof Store!=="undefined"&&Store._s&&(a===Store._s||b===Store._s))Store.commit();}catch(e){}
  if(!a)return sanitizeState(b);if(!b)return sanitizeState(a);
  return _mergeStates(a,b);
}

/* ---- the store ---- */
const ST_SEP="\u0001";
function stDevice(){try{let d=localStorage.getItem("galen.dev");if(!d||!ST_ID.test(d)){d=Math.random().toString(36).slice(2,8);localStorage.setItem("galen.dev",d);}return d;}catch(e){return "here";}}
function stDiag(m){try{if(typeof DIAG!=="undefined"&&DIAG.errors){DIAG.errors.push({t:Date.now(),m:"Store: "+m});if(DIAG.errors.length>8)DIAG.errors.shift();}}catch(e){}}
const Store={
  _s:_blankState(),mode:"local",status:"This device",_t:null,_saving:false,_again:false,listeners:[],providers:[],provider:null,lastSync:0,
  dev:"here",_snap:new Map(),_setSnap:null,_lastRaw:null,readOnly:false,passive:false,holdWrites:false,problem:null,saveProblem:null,blocked:null,_retry:0,
  get s(){return this._s;},
  set s(v){
    this._s=sanitizeState(v);if(stObj(this._s.ctr))stCtrApply(this._s);else stCtrEnsure(this._s);this.rebase();
  },
  /* ---------- loading ---------- */
  init(){
    this.dev=stDevice();GClock.load();
    let raw=null,loaded=null;
    try{raw=localStorage.getItem(LS);}catch(e){this.saveProblem="blocked";}
    if(raw){try{loaded=stParse(raw);}catch(e){loaded=null;}}
    const unreadable=raw!=null&&!stLooksLikeState(loaded)&&!stIsNewer(loaded),newer=raw!=null&&stIsNewer(loaded);
    if(unreadable||newer){
      /* never overwrite what we cannot read: copy it aside, recover what we can, and say so */
      const key=this.quarantine(raw);
      this.problem={kind:newer?"newer":"unreadable",key,raw,t:Date.now()};this.badLocal=this.problem.kind;
      if(newer)this.readOnly=true;
      else{const rep=repairJSON(raw);if(rep&&stLooksLikeState(Object.assign({v:3},rep))){loaded=Object.assign({v:3},rep);this.problem.repaired=true;}else loaded=null;}
      if(!key)this.holdWrites=true;    /* the copy could not be made: write nothing until the user chooses */
    }
    if(!loaded){try{const old=localStorage.getItem("bed.v2");if(old){const o=stParse(old);if(stLooksLikeState(o))loaded=o;}}catch(e){}}
    if(loaded){this._s=sanitizeState(loaded);if(newer)this._s.fmt=Math.max(this._s.fmt||0,+loaded.fmt||0);}
    else this._s=this.migrateV1();
    stCtrEnsure(this._s);stCtrApply(this._s);this._s.fmt=Math.max(this._s.fmt||0,STATE_FMT);
    this.rebase();this._lastRaw=(unreadable||newer)?null:raw;
    if(raw&&!unreadable&&!newer)this.keepPrev(raw);
    if(this.problem&&!this.problem.repaired&&this.problem.kind==="unreadable"&&!loaded)stDiag("saved progress could not be read; a copy was kept");
    if(!raw&&(this._s.seen.length||this._s.signs.length||this._s.mods.length))this.save(true);
    this.signal("problem");
    try{GClock.check();}catch(e){}
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(p=>{if(!p)return navigator.storage.persist();}).catch(()=>{});}catch(e){}
  },
  /* keeps a copy of unreadable data, never overwriting an earlier one; the newest three are kept */
  quarantine(raw){
    const key=LS+".unreadable."+Date.now();
    const write=()=>{localStorage.setItem(key,raw);return key;};
    try{return write();}catch(e){try{this.freeSpace();return write();}catch(x){return null;}}
  },
  quarantined(){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(LS+".unreadable."))out.push(k);}}catch(e){}return out.sort();},
  /* one rolling copy of the last good save from an earlier day */
  keepPrev(raw){try{const t=+localStorage.getItem(LS+".prev.t")||0;if(Date.now()-t<20*36e5)return;localStorage.setItem(LS+".prev",raw);localStorage.setItem(LS+".prev.t",String(Date.now()));}catch(e){}},
  /* Store.merge(base, x): x laid over base and cleaned (types, ids, times, no prototype keys). Kept for callers. */
  merge(base,x){return sanitizeState(Object.assign({},stObj(base)?base:{},stObj(x)?x:{}));},
  migrateV1(){
    const g=k=>{try{const v=localStorage.getItem(k);return v?stParse(v):null;}catch(e){return null;}};
    const arr=v=>Array.isArray(v)?v.filter(x=>typeof x==="string"):[];
    const s=_blankState();
    s.seen=[...new Set([...arr(g("bed.seen")),...arr(g("ausc.seen"))])];
    s.signs=arr(g("bed.signseen"));s.mods=arr(g("bed.moddone"));s.er=[...new Set([...arr(g("bed.erdone")),...arr(g("ausc.erdone"))])];
    return sanitizeState(s);
  },
  /* re-read this browser's copy (after another tab handed over) */
  reloadFromDisk(){
    try{const raw=localStorage.getItem(LS);if(!raw)return false;const o=stParse(raw);if(!stLooksLikeState(o)||stIsNewer(o))return false;
      this._s=sanitizeState(o);stCtrEnsure(this._s);stCtrApply(this._s);this.rebase();this._lastRaw=raw;this.emit();return true;}catch(e){return false;}
  },
  /* Hub hook: merge a (cleaned) Drive or backup copy into this device's state; true if anything changed */
  absorb(remote){
    if(!stObj(remote)||this.passive)return false;
    if(stIsNewer(remote)){this.blocked="newer";this.signal("problem");return false;}
    this.commit();const m=_mergeStates(this._s,remote);
    if(JSON.stringify(m)===JSON.stringify(this._s))return false;
    this._s=m;this.rebase();this.applyAliases();this._lastRaw=null;this.cache();this.emit();return true;
  },
  /* retired card ids (CARD_ALIAS, 70b-cards): copy the old record to the new id when the new one has none; the old stays for older builds */
  applyAliases(){
    if(typeof CARD_ALIAS!=="object"||!CARD_ALIAS)return false;let ch=false;const S=this._s.srs;
    for(const old of Object.keys(CARD_ALIAS)){const nu=CARD_ALIAS[old];if(S[old]&&nu&&!S[nu]&&ST_ID.test(nu)){S[nu]=JSON.parse(JSON.stringify(S[old]));ch=true;}}
    return ch;
  },
  /* "Use Galen here": take this device's newest copy, then re-apply what was changed in this window while it was read only */
  carryOver(){
    const mine=this._s,snap=this._snap,setSnap=this._setSnap||{},base=this._ctrBase||{xp:0,days:{},lists:{}},had=this.pendingCarry;
    this.pendingCarry=false;this.passive=false;
    if(!this.reloadFromDisk()&&!had)return false;
    if(!had)return true;
    const s=this._s;let n=0;
    for(const c of ST_REC){const M=mine[c]||{};for(const id of Object.keys(M)){const k=c+ST_SEP+id;if(snap.get(k)!==JSON.stringify(M[id])){s[c][id]=M[id];n++;}}
      for(const k of snap.keys()){const i=k.indexOf(ST_SEP);if(k.slice(0,i)===c&&!(k.slice(i+1) in M)){delete s[c][k.slice(i+1)];n++;}}}
    const L=new Map(s.log.map(e=>[e.id,e]));for(const e of mine.log||[]){if(snap.get("log"+ST_SEP+e.id)!==JSON.stringify(e)){L.set(e.id,e);n++;}}
    s.log=[...L.values()].sort((x,y)=>(x.t||x.at||0)-(y.t||y.at||0)).slice(-400);
    for(const k of ST_LISTS){const add=(mine[k]||[]).filter(x=>!(base.lists[k]||[]).includes(x));if(add.length){s[k]=stUni(s[k],add);n++;}}
    for(const k of Object.keys(mine.settings||{}))if(JSON.stringify(mine.settings[k])!==JSON.stringify(setSnap[k])){s.settings[k]=mine.settings[k];n++;}
    const dx=(mine.xp||0)-(base.xp||0);if(dx){s.xp=(s.xp||0)+dx;n++;}
    const days=Object.assign({},s.days);for(const k of stUni(Object.keys(mine.days||{}),Object.keys(base.days||{}))){const dv=((mine.days||{})[k]||0)-((base.days||{})[k]||0);if(dv){days[k]=Math.max(0,(days[k]||0)+dv);n++;}}s.days=days;
    this.save(true);this.emit();return n;
  },
  /* ---------- change tracking ---------- */
  _recStr(r){return JSON.stringify(r);},
  rebase(){
    const m=new Map(),s=this._s;
    for(const c of ST_REC){const C=s[c];if(!stObj(C))continue;for(const id of Object.keys(C))if(stObj(C[id]))m.set(c+ST_SEP+id,this._recStr(C[id]));}
    for(const e of s.log||[])if(stObj(e)&&e.id)m.set("log"+ST_SEP+e.id,this._recStr(e));
    this._snap=m;this._setSnap=JSON.parse(JSON.stringify(s.settings||{}));this._ctrBase={xp:s.xp||0,days:Object.assign({},s.days||{}),lists:Object.fromEntries(ST_LISTS.map(k=>[k,(s[k]||[]).slice()]))};
  },
  /* stamp every record that changed since the last save, tombstone what disappeared, absorb XP and day counts */
  commit(){
    const s=this._s;if(!s||this.passive)return;let t=0;const T=()=>t||(t=GClock.stamp());const live=new Set();
    const tomb=(c,id)=>{const tb=stObj(s.tomb)?s.tomb:(s.tomb={});(tb[c]||(tb[c]={}))[id]=T();};
    const untomb=(c,id)=>{if(s.tomb&&s.tomb[c]&&s.tomb[c][id]){delete s.tomb[c][id];if(!Object.keys(s.tomb[c]).length)delete s.tomb[c];}};
    const fieldwise=(c,id)=>c==="log"||(c==="notes"&&String(id).startsWith("tech:"));
    const look=(c,id,r)=>{const k=c+ST_SEP+id;live.add(k);const str=this._recStr(r),old=this._snap.get(k);if(old===str)return;const st=T();
      if(old!==undefined&&fieldwise(c,id)){try{const o=JSON.parse(old),ft=stObj(r._ft)?r._ft:{},base=stRecTime(c,r)||st;for(const f of stUni(Object.keys(o),Object.keys(r))){if(f==="_m"||f==="_ft")continue;if(JSON.stringify(o[f])!==JSON.stringify(r[f]))ft[f]=st;else if(!ft[f])ft[f]=Math.min(base,st);}r._ft=ft;}catch(e){}}
      r._m=st;this._snap.set(k,JSON.stringify(r));untomb(c,id);};
    for(const c of ST_REC){const C=s[c];if(!stObj(C))continue;for(const id of Object.keys(C)){const r=C[id];if(stObj(r))look(c,id,r);}}
    if(Array.isArray(s.log)){let minT=Infinity;for(const e of s.log){if(!stObj(e))continue;if(!e.id)e.id=String(e.at||e.t||Date.now());look("log",e.id,e);minT=Math.min(minT,e.t||e.at||0);}
      this._minLog=minT;}
    for(const k of [...this._snap.keys()])if(!live.has(k)){const i=k.indexOf(ST_SEP),c=k.slice(0,i),id=k.slice(i+1);
      if(c==="log"){let et=0;try{const o=JSON.parse(this._snap.get(k));et=o.t||o.at||0;}catch(e){}
        if(s.log.length>=400&&et<=this._minLog){this._snap.delete(k);continue;}}   /* trimmed by the 400 cap, not deleted */
      tomb(c,id);this._snap.delete(k);}
    this.stampSettings(T);
    stCtrAbsorb(s,this.dev,T);
  },
  /* settings changes are stamped key by key */
  stampSettings(T){const cur=this._s.settings||{},prev=this._setSnap;if(!prev){this._setSnap=JSON.parse(JSON.stringify(cur));return;}
    for(const k of stUni(Object.keys(cur),Object.keys(prev)))if(JSON.stringify(cur[k])!==JSON.stringify(prev[k])){(this._s.settingsTs||(this._s.settingsTs={}))[k]=T?T():GClock.stamp();}
    this._setSnap=JSON.parse(JSON.stringify(cur));},
  /* ---------- writing to this device ---------- */
  freeSpace(){try{for(const k of ["galen.imgcache",LS+".prev",LS+".prev.t"])localStorage.removeItem(k);}catch(e){}},
  keepAside(key,raw){try{localStorage.setItem(key,raw);localStorage.setItem(key+".t",String(Date.now()));return true;}catch(e){this._aside=this._aside||{};this._aside[key]=raw;return false;}},
  aside(key){try{const v=localStorage.getItem(key);if(v)return v;}catch(e){}return this._aside&&this._aside[key]||null;},
  /* Another tab may have saved since we last looked: merge with it before writing, so two tabs never overwrite each other. */
  cache(){
    if(this.readOnly||this.passive||this.holdWrites)return false;
    this.commit();
    /* re-read even while holding the writer lock: a tab still running an older build takes no lock */
    try{const raw=localStorage.getItem(LS);if(raw&&raw!==this._lastRaw){const other=stParse(raw);if(stLooksLikeState(other)&&!stIsNewer(other)){this._s=_mergeStates(this._s,other);this.rebase();}}}catch(e){}
    let out;try{out=JSON.stringify(this._s);}catch(e){stDiag("could not serialise: "+e.message);return false;}
    const write=()=>{localStorage.setItem(LS,out);this._lastRaw=out;};
    try{write();}
    catch(e){
      const full=e&&(e.name==="QuotaExceededError"||e.code===22||e.code===1014||/quota/i.test(e.message||""));
      if(full){try{this.freeSpace();write();}catch(x){return this.saveFailed("full");}}
      else return this.saveFailed("blocked");
    }
    if(this.saveProblem){this.saveProblem=null;this.status=this.provider?"Synced":"This device";this.signal("problem");this.emit("status");}
    return true;
  },
  saveFailed(kind){
    if(this.saveProblem!==kind){this.saveProblem=kind;this.status=kind==="full"?"Not saved: storage full":"Not saved on this device";stDiag(kind==="full"?"storage full, progress not saved":"storage blocked");this.signal("problem");this.emit("status");}
    return false;
  },
  /* save(): written to this device within 250 ms (calls in a burst are coalesced; page hide and save(true) write at once) */
  save(now){
    if(this.passive){this.pendingCarry=true;this.signal("passive-save");return;}
    if(this.readOnly){this.signal("readonly-save");return;}
    this._s.updated=Math.round(GClock.now());
    if(this._s.log.length>400)this._s.log=this._s.log.slice(-400);
    clearTimeout(this._w);if(now){this._dirty=false;this.cache();}else{this._dirty=true;this._w=setTimeout(()=>{this._dirty=false;this.cache();},250);}
    clearTimeout(this._t);
    if(!this.provider||this.blocked)return;
    if(this.status!=="Not saved: storage full"){this.status="Saving…";this.emit("status");}
    this._t=setTimeout(()=>this.push(),now?0:1500);
  },
  /* write any pending change now (page hidden or closing, or handing over to another tab) */
  flush(){clearTimeout(this._w);if(!this._dirty)return;this._dirty=false;if(this.readOnly||this.passive)return;this.cache();},
  /* ---------- snapshots, reset, restore ---------- */
  snapshotInfo(key){const raw=this.aside(key);if(!raw)return null;let t=0,groups=null;try{t=+localStorage.getItem(key+".t")||0;groups=JSON.parse(localStorage.getItem(key+".groups")||"null");}catch(e){}return {raw,t,groups};},
  /* Reset: a backup is kept on the device, an epoch makes the reset win over every other copy, and Undo is offered.
     groups: an array of ST_GROUPS keys (default: everything except photos). Returns the undo function. */
  reset(groups){
    if(this.readOnly)return ()=>{};
    this.commit();const gs=(Array.isArray(groups)&&groups.length?groups:ST_RESET_DEFAULT).filter(g=>ST_GROUPS[g]);
    const before=JSON.stringify(this._s);this.keepAside(LS+".beforeReset",before);try{localStorage.setItem(LS+".beforeReset.groups",JSON.stringify(gs));}catch(e){}
    const t=GClock.stamp(),s=this._s;
    if(Object.keys(ST_GROUPS).every(g=>gs.includes(g)))s.epoch=t;      /* everything: one epoch, as before */
    else{s.epochs=stObj(s.epochs)?s.epochs:{};gs.forEach(g=>{s.epochs[g]=t;});}
    if(gs.includes("xp")){s.ctr={};s.xp=0;s.days={};}
    if(gs.includes("seen"))for(const k of ST_LISTS)s[k]=[];
    stPrune(s);this.rebase();this._lastRaw=null;this.save(true);this.emit();
    const undo=()=>this.adopt(before,gs);this.lastUndo=undo;return undo;
  },
  /* bring back the groups of an earlier copy as fresh changes, so they win over the reset on every device */
  adopt(raw,groups){
    let old;try{old=sanitizeState(typeof raw==="string"?stParse(raw):raw);}catch(e){return false;}
    const gs=Array.isArray(groups)&&groups.length?groups:Object.keys(ST_GROUPS);
    this.commit();const s=this._s,inG=(c,id)=>gs.includes(stGroupOf(c,id));
    for(const c of ST_REC)for(const id of Object.keys(old[c]))if(inG(c,id)){const r=old[c][id];delete r._ft;s[c][id]=r;}
    if(gs.includes("log")){const m=new Map(s.log.map(e=>[e.id,e]));for(const e of old.log){delete e._ft;m.set(e.id,e);}s.log=[...m.values()].sort((x,y)=>(x.t||x.at||0)-(y.t||y.at||0)).slice(-400);}
    if(gs.includes("seen"))for(const k of ST_LISTS)s[k]=stUni(s[k],old[k]);
    if(gs.includes("xp")){s.xp=(s.xp||0)+(old.xp||0);const d=Object.assign({},s.days);for(const k of Object.keys(old.days))d[k]=(d[k]||0)+old.days[k];s.days=d;}
    /* force a fresh stamp on everything brought back */
    for(const c of ST_REC)for(const id of Object.keys(old[c]))if(inG(c,id))this._snap.delete(c+ST_SEP+id);
    if(gs.includes("log"))for(const e of old.log)this._snap.delete("log"+ST_SEP+e.id);
    this._lastRaw=null;this.save(true);this.emit();return true;
  },
  /* Restore a backup. mode "merge" (default): nothing you have is lost, the newer copy of each record wins.
     mode "replace": the backup replaces your progress everywhere (a reset plus the backup). Settings come from the
     backup only with {settings:true}. A copy of the current state is kept first; the return value undoes it. */
  restore(obj,opt){
    opt=opt||{};if(typeof obj==="string"){try{obj=stParse(obj);}catch(e){obj=repairJSON(obj);}}
    if(!stObj(obj)||!(stLooksLikeState(obj)||stIsNewer(obj)))throw new Error("This file is not a Galen backup. Nothing was changed.");
    if(stIsNewer(obj))throw new Error("This backup was made by a newer Galen. Update this device first. Nothing was changed.");
    this.commit();const before=JSON.stringify(this._s);this.keepAside(LS+".beforeRestore",before);
    const r=sanitizeState(obj);
    if(opt.settings){const t=GClock.stamp();r.settingsTs={};for(const k of Object.keys(r.settings))r.settingsTs[k]=t;r.updated=t;}else{delete r.settingsTs;r.updated=0;}
    if(opt.mode==="replace"){this.reset(Object.keys(ST_GROUPS));this.adopt(r,Object.keys(ST_GROUPS));if(opt.settings){this._s.settings=Object.assign({},r.settings);this.save(true);}}
    else{
      /* a backup from before a reset: restoring it means "bring it back", so lift it over this device's epochs */
      const L=this._s,t=GClock.stamp(),lifted=new Set(Object.keys(ST_GROUPS).filter(g=>stGroupEpoch(L,g)>stGroupEpoch(r,g)));
      for(const c of ST_REC)for(const id of Object.keys(r[c])){const g=stGroupOf(c,id);if(lifted.has(g)&&stRecTime(c,r[c][id])<=stGroupEpoch(L,g)){r[c][id]._m=t;delete r[c][id]._ft;}}
      if(lifted.has("log"))for(const x of r.log)if(stRecTime("log",x)<=stGroupEpoch(L,"log")){x._m=t;delete x._ft;}
      /* and over deletions made since: a restore means "bring these back" */
      const TB=L.tomb||{};for(const c of ST_REC)for(const id of Object.keys(r[c])){const tb=(TB[c]||{})[id];if(tb&&stRecTime(c,r[c][id])<=tb){r[c][id]._m=t;delete r[c][id]._ft;}}
      for(const x of r.log){const tb=(TB.log||{})[x.id];if(tb&&stRecTime("log",x)<=tb){x._m=t;delete x._ft;}}
      const extra=lifted.has("xp")?{xp:r.xp,days:Object.assign({},r.days)}:null,lists=lifted.has("seen")?ST_LISTS.map(k=>r[k]):null;
      if(extra){delete r.ctr;r.xp=0;r.days={};}
      if(L.epoch)r.epoch=Math.max(r.epoch||0,L.epoch);r.epochs=Object.assign({},r.epochs||{},L.epochs||{});
      this._s=_mergeStates(L,r);this.rebase();
      if(extra){this._s.xp+=extra.xp;const d=Object.assign({},this._s.days);for(const k of Object.keys(extra.days))d[k]=(d[k]||0)+extra.days[k];this._s.days=d;}
      if(lists)ST_LISTS.forEach((k,i)=>{this._s[k]=stUni(this._s[k],lists[i]);});
      this._lastRaw=null;this.save(true);this.emit();}
    const undo=()=>{this.reset(Object.keys(ST_GROUPS));this.adopt(before,Object.keys(ST_GROUPS));};this.lastUndo=undo;return undo;
  },
  /* what a backup holds, for a preview before restoring */
  preview(obj){if(typeof obj==="string"){try{obj=stParse(obj);}catch(e){return null;}}if(!stLooksLikeState(obj))return null;const s=sanitizeState(obj);
    const notes=Object.keys(s.notes);return {cards:Object.keys(s.srs).length,log:s.log.length,eggs:notes.filter(k=>k.startsWith("egg:")).length,tech:notes.filter(k=>k.startsWith("tech:")).length,
      xp:stObj(s.ctr)?Math.max(0,Math.round(stCtrSum(s.ctr).xp)):s.xp,days:Object.keys(s.days).length,updated:s.updated,newer:stIsNewer(obj)};},
  /* ---------- sync ---------- */
  /* A provider is {name, label, available():bool, load():Promise<state|null>, save(state):Promise<void>}. The first one that works carries the sync. */
  register(p){this.providers.push(p);},
  async connect(){
    if(this.passive)return;let failed=false;
    for(const p of this.providers){
      try{
        if(!(await p.available()))continue;
        const remote=await p.load();
        this.provider=p;this.mode=p.name;
        if(await this.exchange(remote,true)){this.status="Synced";this.lastSync=Date.now();this._retry=0;}
        this.emit("status");return;
      }catch(e){this.syncFailed(e,p);failed=true;}
    }
    if(!this.provider&&!failed){this.mode="local";this.status=this.saveProblem?this.status:this.providers.some(p=>p.hint&&p.hint())?"Sign in to sync":"This device";this.emit("status");}
  },
  /* merge a copy from the provider and write back if ours has something it lacks; false if blocked */
  async exchange(remote,force){
    if(remote!=null&&!stObj(remote))throw new Error("Drive copy is not readable");
    if(remote&&stIsNewer(remote)){this.blocked="newer";this.status="Update Galen on this device to sync";this.signal("problem");return false;}
    if(remote&&!stLooksLikeState(remote))throw new Error("Drive copy is not a Galen state");
    this.blocked=null;this.commit();
    if(remote){const merged=_mergeStates(this._s,remote);const a=JSON.stringify(merged);
      if(a!==JSON.stringify(this._s)){this._s=merged;this.rebase();this.cache();this.emit();}
      if(a===JSON.stringify(remote))return true;}
    if(this.readOnly||this.passive)return true;
    await this.provider.save(JSON.parse(JSON.stringify(this._s)));return true;
  },
  syncFailed(e,p){
    p=p||this.provider;console.warn("sync",p&&p.name,e);stDiag("sync: "+((e&&e.message)||e));
    const act=p&&p.needsAction?p.needsAction():"";
    if(act&&act!=="Saved on this device")this.status=act;
    else{this.status=typeof navigator!=="undefined"&&navigator.onLine===false?"Offline · saved on this device":"Drive unreachable · will retry";
      if(this.provider&&typeof navigator!=="undefined"&&navigator.onLine!==false){const waits=[30e3,120e3,600e3];const w=waits[Math.min(this._retry,waits.length-1)];this._retry++;clearTimeout(this._rt);this._rt=setTimeout(()=>this.sync().catch(()=>{}),w);}}
    this.emit("status");
  },
  /* Pull from the provider, merge, push if we had something newer. Used by pull-to-sync and on return to the app. */
  async sync(){
    if(this.passive)return;
    if(!this.provider)return this.connect();
    if(this._saving){this._again=true;return;}
    this._saving=true;this.status="Syncing…";this.emit("status");
    try{const remote=await this.provider.load();if(await this.exchange(remote,false)){this.status="Synced";this.lastSync=Date.now();this._retry=0;}}
    catch(e){this.syncFailed(e);}
    this._saving=false;this.emit("status");
    if(this._again){this._again=false;this.push();}
  },
  /* Push: read, merge, then write, so a stale device never overwrites Drive with only its own copy.
     (Within 20 s of a sync the extra read is skipped.) Never pushes after a failed merge. */
  async push(){
    if(!this.provider||this.passive||this.readOnly||this.blocked)return;
    if(this._saving){this._again=true;return;}
    this._saving=true;
    try{if(this.provider.load&&Date.now()-(this.lastSync||0)>20000){const remote=await this.provider.load();await this.exchange(remote,true);}
      else{this.commit();await this.provider.save(JSON.parse(JSON.stringify(this._s)));}
      if(!this.blocked){this.status=this.saveProblem?this.status:"Synced";this.lastSync=Date.now();this._retry=0;}}
    catch(e){this.syncFailed(e);}
    this._saving=false;this.emit("status");
    if(this._again){this._again=false;this.push();}
  },
  on(fn){this.listeners.push(fn);},
  emit(kind){this.listeners.forEach(f=>{try{f(kind);}catch(e){}});},
  /* problems (unreadable data, storage full, newer remote, another tab) go to the safety banner, not to view refreshes */
  signal(kind){try{if(typeof window!=="undefined"&&window.dispatchEvent&&typeof CustomEvent==="function")window.dispatchEvent(new CustomEvent("galen:store",{detail:kind}));}catch(e){}}
};
/* Claude storage (the claude.ai preview of the app) */
Store.register({name:"cloud",label:"Claude storage",db:null,uid:null,
  async available(){if(typeof window==="undefined"||!window.claude||!claude.use)return false;try{const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);if(!db||!user)return false;const uid=await user.id();if(!uid)return false;this.db=db;this.uid=uid;return true;}catch(e){return false;}},
  async load(){const snap=await this.db.doc(`data/users/${this.uid}/state`).get();return snap&&snap.exists?snap.data():null;},
  async save(s){await this.db.doc(`data/users/${this.uid}/state`).set(s);}
});

/* ---- small helpers on state ---- */
function addTo(key,id){const a=Store.s[key];if(!a.includes(id)){a.push(id);Store.save();}}
const markSeen=id=>addTo("seen",id), markSign=id=>addTo("signs",id);
function tick(n=1,key){const k=dayKey();Store.s.days[k]=(Store.s.days[k]||0)+n;if(key)roundMark(key);}
/* the daily round: five kinds of practice, ticked as they happen */
const ROUND=[["session","Review session","Due and new cards, mixed","practice/session/all","calendar"],["case","A case","Hypothesis-driven, ER, or localiser","practice/hdpe","target"],["eye","A plate or photo","Describe it, or spot diagnosis","practice/describe","eye"],["read","One deep dive or map","ER essentials or a concept map","signs/er","learn"],["hands","Hands-on","Rehearse, narrate or sketch","practice/rehearse","mind"]];
function roundMark(key){const now=Date.now(),k="round:"+dayKey(now);const r=Store.s.notes[k]||{t:now};if(!r[key]){r[key]=now;r.t=now;Store.s.notes[k]=r;}}
function roundToday(){return Store.s.notes["round:"+dayKey()]||{};}
/* Levels: level l needs 100·l² XP; the title stops at "Galen" (level 7, 4,900 XP) */
const XP_LEVELS=["Student","House officer","Senior house officer","Registrar","Senior registrar","Consultant","Professor","Galen"];
const XP_STEP=100;
function levelOf(xp){xp=Math.max(0,Number.isFinite(+xp)?+xp:0);const l=Math.floor(Math.sqrt(xp/XP_STEP));const lo=l*l*XP_STEP,next=Math.pow(l+1,2)*XP_STEP;
  const top=XP_LEVELS.length-1;return {l,title:XP_LEVELS[Math.min(l,top)],next,pct:Math.min(1,Math.max(0,(xp-lo)/(next-lo)))};}
function streak(){
  const d=Store.s.days;let n=0,t=Date.now();
  if(!d[dayKey(t)])t-=DAY_MS;          // today not done yet: the streak still counts up to yesterday
  while(d[dayKey(t)]){n++;t-=DAY_MS;}
  return n;
}
/* another tab saved (only when Web Locks are missing; otherwise one tab writes): fold its progress in */
if(typeof window!=="undefined"&&window.addEventListener){
  window.addEventListener("storage",e=>{if(e.key!==LS||!e.newValue||e.newValue===Store._lastRaw||Store.passive)return;try{const other=stParse(e.newValue);if(!stLooksLikeState(other)||stIsNewer(other))return;Store.commit();const m=_mergeStates(Store._s,other);if(JSON.stringify(m)!==JSON.stringify(Store._s)){Store._s=m;Store.rebase();Store._lastRaw=e.newValue;Store.emit();}}catch(x){}});
  /* nothing is lost when the app is closed or sent to the background */
  window.addEventListener("pagehide",()=>{try{Store.flush();}catch(e){}});
  if(typeof document!=="undefined")document.addEventListener("visibilitychange",()=>{if(document.hidden){try{Store.flush();}catch(e){}}});
}
