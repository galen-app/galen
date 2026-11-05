"use strict";
/* ================= STATE & STORAGE =================
 One versioned state object. Saved to this browser at once, and to the viewer's private
 Claude storage (db: data/users/<id>/state) when available, so progress follows the user across devices. */
const DAY_MS=864e5;
const pad2=n=>String(n).padStart(2,"0");
const dayKey=(t=Date.now())=>{const d=new Date(t);return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;};
const dayNum=(t=Date.now())=>{const d=new Date(t);return Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()))/DAY_MS);};
const fmtDate=t=>{const d=new Date(t);return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;};
const LS="galen.v3";
function blankState(){return {v:3,updated:0,srs:{},snd:{},log:[],days:{},seen:[],signs:[],mods:[],er:[],hd:{},rehearse:{},loc:{},dprac:{},dseen:[],pins:{},hides:{},photos:{},notes:{},xp:0,settings:{newPerDay:10,maxReviews:30,out:"speaker",tone:1,goalMin:15,name:""},last:null};}
const OBJ_KEYS=["srs","snd","days","hd","rehearse","loc","dprac","pins","hides","photos","notes"],ARR_KEYS=["log","seen","signs","mods","er","dseen"];
/* ---- merging two copies of the state (this device + another device through Drive) ----
   Per record, the later one wins; lists are unions; counts take the max. Nothing is ever lost by a sync. */
function mergeStates(a,b){
  if(!a)return b;if(!b)return a;const o=blankState();
  const laterOf=(x,y,k)=>{if(x==null)return y;if(y==null)return x;const tx=x[k]||0,ty=y[k]||0;return ty>tx?y:x;};
  const uni=(x,y)=>[...new Set([...(x||[]),...(y||[])])];
  for(const id of uni(Object.keys(a.srs||{}),Object.keys(b.srs||{})))o.srs[id]=laterOf(a.srs[id],b.srs[id],"last");
  for(const id of uni(Object.keys(a.snd||{}),Object.keys(b.snd||{}))){const x=a.snd[id],y=b.snd[id];o.snd[id]=!x?y:!y?x:{m:x.m||y.m,n:Math.max(x.n||0,y.n||0),r:Math.max(x.r||0,y.r||0)};}
  for(const d of uni(Object.keys(a.days||{}),Object.keys(b.days||{})))o.days[d]=Math.max(a.days[d]||0,b.days[d]||0);
  for(const k of ["hd","rehearse","loc","dprac"]){const A=a[k]||{},B=b[k]||{};for(const id of uni(Object.keys(A),Object.keys(B))){const x=A[id],y=B[id];if(!x||!y)o[k][id]=x||y;else{const late=laterOf(x,y,"at");o[k][id]=Object.assign({},late,{best:Math.max(x.best||0,y.best||0),n:Math.max(x.n||0,y.n||0)});}}}
  for(const k of ["pins","hides","photos","notes"]){const A=a[k]||{},B=b[k]||{};for(const id of uni(Object.keys(A),Object.keys(B)))o[k][id]=laterOf(A[id],B[id],"t");}
  for(const k of ["seen","signs","mods","er","dseen"])o[k]=uni(a[k],b[k]);
  const byId=new Map();[...(a.log||[]),...(b.log||[])].forEach(x=>{const id=x.id||(x.id=String(x.t||x.at||Math.random()));const prev=byId.get(id);if(!prev||(x.verAt||0)>(prev.verAt||0)||(!prev.ver&&x.ver))byId.set(id,x);});
  o.log=[...byId.values()].sort((x,y)=>(x.t||x.at||0)-(y.t||y.at||0)).slice(-400);
  o.xp=Math.max(a.xp||0,b.xp||0);
  const newer=(b.updated||0)>(a.updated||0)?b:a,older=newer===a?b:a;
  o.settings=Object.assign(blankState().settings,older.settings||{},newer.settings||{});
  o.last=newer.last||older.last;o.updated=Math.max(a.updated||0,b.updated||0);
  return o;
}
const Store={
  s:blankState(),mode:"local",status:"This device",_t:null,_saving:false,_again:false,listeners:[],providers:[],provider:null,lastSync:0,
  init(){
    let loaded=null;
    try{const raw=localStorage.getItem(LS);if(raw)loaded=JSON.parse(raw);}catch(e){}
    if(!loaded){try{const old=localStorage.getItem("bed.v2");if(old)loaded=JSON.parse(old);}catch(e){}}
    if(loaded&&(loaded.v===2||loaded.v===3)){this.s=this.merge(blankState(),loaded);this.s.v=3;}
    else this.migrateV1();
  },
  merge(base,x){const o=Object.assign(base,x||{});o.settings=Object.assign(blankState().settings,(x&&x.settings)||{});
    OBJ_KEYS.forEach(k=>{if(!o[k]||typeof o[k]!=="object"||Array.isArray(o[k]))o[k]={};});
    ARR_KEYS.forEach(k=>{if(!Array.isArray(o[k]))o[k]=[];});if(typeof o.xp!=="number")o.xp=0;return o;},
  migrateV1(){
    const g=k=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}};
    const s=blankState();
    s.seen=[...new Set([...(g("bed.seen")||[]),...(g("ausc.seen")||[])])];
    s.signs=g("bed.signseen")||[];s.mods=g("bed.moddone")||[];s.er=[...new Set([...(g("bed.erdone")||[]),...(g("ausc.erdone")||[])])];
    this.s=s;if(s.seen.length||s.signs.length||s.mods.length)this.save(true);
  },
  /* A provider is {name, label, available():bool, load():Promise<state|null>, save(state):Promise<void>}. The first one that works carries the sync. */
  register(p){this.providers.push(p);},
  async connect(){
    for(const p of this.providers){
      try{
        if(!(await p.available()))continue;
        const remote=await p.load();
        this.provider=p;this.mode=p.name;
        if(remote&&(remote.v===2||remote.v===3)){const merged=mergeStates(this.s,this.merge(blankState(),remote));const changedLocal=JSON.stringify(merged)!==JSON.stringify(this.s);this.s=merged;this.cache();if(changedLocal)this.emit();}
        if(!remote||JSON.stringify(remote)!==JSON.stringify(this.s))await this.push(true);
        this.status="Synced";this.lastSync=Date.now();this.emit("status");return;
      }catch(e){console.warn("sync provider",p.name,e);this.status=p.needsAction?p.needsAction():"Saved on this device";this.emit("status");}
    }
    this.mode="local";this.status=this.providers.some(p=>p.hint&&p.hint())?"Sign in to sync":"This device";this.emit("status");
  },
  /* Pull from the provider, merge, push if we had something newer. Used by pull-to-sync and on return to the app. */
  async sync(){
    if(!this.provider)return this.connect();
    if(this._saving){this._again=true;return;}
    this.status="Syncing…";this.emit("status");
    try{const remote=await this.provider.load();if(remote&&(remote.v===2||remote.v===3)){const merged=mergeStates(this.s,this.merge(blankState(),remote));const changed=JSON.stringify(merged)!==JSON.stringify(this.s);this.s=merged;this.cache();if(changed)this.emit();if(JSON.stringify(remote)!==JSON.stringify(this.s))await this.push(true);}
      else await this.push(true);this.status="Synced";this.lastSync=Date.now();}
    catch(e){console.warn(e);this.status=this.provider.needsAction?this.provider.needsAction():"Saved on this device";}
    this.emit("status");
  },
  cache(){try{localStorage.setItem(LS,JSON.stringify(this.s));}catch(e){}},
  save(now){
    this.s.updated=Date.now();
    if(this.s.log.length>400)this.s.log=this.s.log.slice(-400);
    this.cache();clearTimeout(this._t);
    if(!this.provider)return;
    this.status="Saving…";this.emit("status");
    this._t=setTimeout(()=>this.push(),now?0:1500);
  },
  async push(force){
    if(!this.provider)return;
    if(this._saving){this._again=true;return;}
    this._saving=true;
    try{await this.provider.save(JSON.parse(JSON.stringify(this.s)));this.status="Synced";this.lastSync=Date.now();}
    catch(e){console.warn(e);this.status=this.provider.needsAction?this.provider.needsAction():"Saved on this device";}
    this._saving=false;this.emit("status");
    if(this._again){this._again=false;this.push();}
  },
  on(fn){this.listeners.push(fn);},
  emit(kind){this.listeners.forEach(f=>{try{f(kind);}catch(e){}});}
};
/* Claude storage (the claude.ai preview of the app) */
Store.register({name:"cloud",label:"Claude storage",db:null,uid:null,
  async available(){if(!window.claude||!claude.use)return false;try{const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);if(!db||!user)return false;const uid=await user.id();if(!uid)return false;this.db=db;this.uid=uid;return true;}catch(e){return false;}},
  async load(){const snap=await this.db.doc(`data/users/${this.uid}/state`).get();return snap&&snap.exists?snap.data():null;},
  async save(s){await this.db.doc(`data/users/${this.uid}/state`).set(s);}
});

/* ---- small helpers on state ---- */
function addTo(key,id){const a=Store.s[key];if(!a.includes(id)){a.push(id);Store.save();}}
const markSeen=id=>addTo("seen",id), markSign=id=>addTo("signs",id);
function tick(n=1,key){const k=dayKey();Store.s.days[k]=(Store.s.days[k]||0)+n;if(key)roundMark(key);}
/* the daily round: five kinds of practice, ticked as they happen */
const ROUND=[["session","Review session","Due and new cards, mixed","practice/session/all","calendar"],["case","A case","Hypothesis-driven, ER, or localiser","practice/hdpe","target"],["eye","A plate or photo","Describe it, or spot diagnosis","practice/describe","eye"],["read","One deep dive or map","ER essentials or a concept map","signs/er","learn"],["hands","Hands-on","Rehearse, narrate or sketch","practice/rehearse","mind"]];
function roundMark(key){const k="round:"+dayKey();const r=Store.s.notes[k]||{t:Date.now()};if(!r[key]){r[key]=Date.now();r.t=Date.now();Store.s.notes[k]=r;}}
function roundToday(){return Store.s.notes["round:"+dayKey()]||{};}
const XP_LEVELS=["Student","House officer","Senior house officer","Registrar","Senior registrar","Consultant","Professor","Galen"];
function levelOf(xp){const l=Math.floor(Math.sqrt((xp||0)/25));const next=Math.pow(l+1,2)*25;return {l,title:XP_LEVELS[Math.min(l,XP_LEVELS.length-1)]+(l>=XP_LEVELS.length?" "+(l-XP_LEVELS.length+2):""),next,pct:((xp||0)-l*l*25)/(next-l*l*25)};}
function streak(){
  const d=Store.s.days;let n=0,t=Date.now();
  if(!d[dayKey(t)])t-=DAY_MS;          // today not done yet: the streak still counts up to yesterday
  while(d[dayKey(t)]){n++;t-=DAY_MS;}
  return n;
}

/* ================= CARDS (spaced retrieval) =================
 Every learnable item becomes a card. Types:
  think  – a finding or sign → what to think (recall, self-graded)
  verdict– how good is this test (auto-graded)
  mech   – mechanism → which sign (auto-graded)
  anat   – landmark → where and why (recall)
  hlr    – history feature → how much it shifts probability (auto-graded)
  red    – presentation → red flags (recall)
  sound  – listen → name (auto-graded) */
let CARDS=null;
function buildCards(){
  const C=[];const add=c=>C.push(c);
  Object.entries(SIGNS).forEach(([k,s])=>{
    if(s.hide)return;const reg=s.reg||null;
    add({id:"t:"+k,type:"think",sys:s.sys,reg,ref:k,label:s.name});
    add({id:"v:"+k,type:"verdict",sys:s.sys,reg,ref:k,label:s.name});
    add({id:"m:"+k,type:"mech",sys:s.sys,reg,ref:k,label:s.name});
    if(s.sens!=null&&s.spec!=null)add({id:"ss:"+k,type:"snsp",sys:s.sys,reg,ref:k,label:s.name});
    if(typeof ANGLES!=="undefined"&&ANGLES[k]&&ANGLES[k].teachback)add({id:"tb:"+k,type:"teach",sys:s.sys,reg,ref:k,label:s.name});
  });
  if(typeof TECH!=="undefined")TECH.forEach(t=>{const sys=t.group==="Ear, nose and eye"?"hn":"neuro";
    t.steps.forEach((st,i)=>add({id:`tw:${t.id}:${i}`,type:"twhy",sys,ref:[t.id,i],label:t.name}));
    (t.mcq||[]).forEach((q,i)=>add({id:`te:${t.id}:${i}`,type:"terr",sys,ref:[t.id,i],label:t.name}));});
  SYSTEMS.forEach(m=>m.think.forEach(([f,t],i)=>add({id:`f:${m.id}:${i}`,type:"finding",sys:m.id,ref:[m.id,i],label:f})));
  const anatSys={chest:"cvs",abdomen:"abd",neck:"hn",back:"msk"};
  Object.entries(ANAT).forEach(([key,a])=>a.pts.forEach(p=>add({id:`a:${key}:${p.k}`,type:"anat",sys:anatSys[key],ref:[key,p.k],label:p.n})));
  Object.entries(AREAS).forEach(([k,a])=>add({id:"ar:"+k,type:"area",sys:"cvs",ref:k,label:a.name}));
  Object.entries(LZONES).forEach(([k,a])=>add({id:"lz:"+k,type:"zone",sys:"resp",ref:k,label:a.name}));
  const presSys=new Proxy({},{get:(o,k)=>(HIST.pres.find(p=>p.id===k)||{}).sys});
  HIST.pres.forEach(p=>{
    p.lr.forEach(([f,t,l],i)=>{if(l!=null)add({id:`h:${p.id}:${i}`,type:"hlr",sys:presSys[p.id]||"gen",ref:[p.id,i],label:f});});
    add({id:"r:"+p.id,type:"red",sys:presSys[p.id]||"gen",ref:p.id,label:p.name});
  });
  Object.entries(SOUNDS).forEach(([k,s])=>add({id:"s:"+k,type:"sound",sys:s.kind==="heart"?"cvs":"resp",ref:k,label:s.name}));
  /* neuro toolkit */
  DERM_ORDER.forEach(k=>{if(DERM_INFO[k]&&DERM_INFO[k].k)add({id:"dm:"+k,type:"derm",sys:"neuro",ref:k,label:k+" key point"});});
  MYO.forEach((m,i)=>add({id:"my:"+m[0],type:"myo",sys:"neuro",ref:i,label:m[1]}));
  REFLEX.forEach((r,i)=>add({id:"rf:"+i,type:"reflex",sys:"neuro",ref:i,label:r[0]}));
  ROOTNERVE.forEach((r,i)=>add({id:"rn:"+i,type:"rootnerve",sys:"neuro",ref:i,label:r.q}));
  CRANIAL.forEach((c,i)=>add({id:"cn:"+c[0],type:"cranial",sys:"neuro",ref:i,label:"CN "+c[0]}));
  /* dermatology */
  DVOCAB.forEach((v,i)=>add({id:"dv:"+i,type:"dterm",sys:"derm",ref:i,label:v[0]}));
  DCOND.forEach(c=>{if(c.p&&c.d)add({id:"dc:"+c.id,type:"dplate",sys:"derm",ref:c.id,label:c.n});});
  /* region membership for MSK sessions also comes from each region's test list */
  REGIONS.forEach(r=>r.tests.forEach(k=>C.forEach(c=>{if(c.ref===k&&!c.reg)c.reg=r.id;})));
  CARDS=C;return C;
}
const CARD_TYPE_LABEL={think:"What to think",verdict:"Test value",mech:"Mechanism",finding:"Finding",anat:"Surface anatomy",area:"Listening area",zone:"Lung zone",hlr:"History clue",red:"Red flags",sound:"Listen",snsp:"Rule in or out",derm:"Dermatome",myo:"Myotome",reflex:"Reflex root",rootnerve:"Root or nerve?",cranial:"Cranial nerve",dterm:"Skin term",dplate:"Name the rash",teach:"Teach it back"};
const AUTO={verdict:1,mech:1,hlr:1,sound:1,snsp:1,myo:1,reflex:1,dplate:1};
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
