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
  if(!a)return b;if(!b)return a;
  /* A reset or a replace stamps an epoch. The newer epoch wins: from the older side we keep only what happened after it. */
  const E=Math.max(a.epoch||0,b.epoch||0);
  if((a.epoch||0)!==(b.epoch||0)){const old=(a.epoch||0)<E?a:b;const keep=(t)=>(t||0)>E;const f=JSON.parse(JSON.stringify(old));
    for(const id in f.srs||{})if(!keep(f.srs[id].last))delete f.srs[id];
    for(const k of ["hd","rehearse","loc","dprac"])for(const id in f[k]||{})if(!keep(f[k][id]&&f[k][id].at))delete f[k][id];
    for(const k of ["pins","hides","photos","notes"])for(const id in f[k]||{})if(!keep(f[k][id]&&f[k][id].t))delete f[k][id];
    const eDay=dayKey(E);for(const d in f.days||{})if(d<eDay)delete f.days[d];
    for(const k of ["seen","signs","mods","er","dseen"])f[k]=[];f.snd={};f.log=(f.log||[]).filter(x=>keep(x.t||x.at));f.xp=0;
    if(old===a)a=f;else b=f;}
  /* unknown keys (from a newer build) are carried, never dropped */
  const newer=(b.updated||0)>(a.updated||0)?b:a,older=newer===a?b:a;
  const o=Object.assign(blankState(),older,newer);
  const laterOf=(x,y,k)=>{if(x==null)return y;if(y==null)return x;const tx=x[k]||0,ty=y[k]||0;return ty>tx?y:x;};
  const uni=(x,y)=>[...new Set([...(x||[]),...(y||[])])];
  o.srs={};for(const id of uni(Object.keys(a.srs||{}),Object.keys(b.srs||{})))o.srs[id]=laterOf((a.srs||{})[id],(b.srs||{})[id],"last");
  o.snd={};for(const id of uni(Object.keys(a.snd||{}),Object.keys(b.snd||{}))){const x=(a.snd||{})[id],y=(b.snd||{})[id];o.snd[id]=!x?y:!y?x:{m:x.m||y.m,n:Math.max(x.n||0,y.n||0),r:Math.max(x.r||0,y.r||0)};}
  o.days={};for(const d of uni(Object.keys(a.days||{}),Object.keys(b.days||{})))o.days[d]=Math.max((a.days||{})[d]||0,(b.days||{})[d]||0);
  for(const k of ["hd","rehearse","loc","dprac"]){const A=a[k]||{},B=b[k]||{};o[k]={};for(const id of uni(Object.keys(A),Object.keys(B))){const x=A[id],y=B[id];if(!x||!y)o[k][id]=x||y;else{const late=laterOf(x,y,"at");o[k][id]=Object.assign({},x,y,late,{best:Math.max(x.best||0,y.best||0),n:Math.max(x.n||0,y.n||0)});}}}
  for(const k of ["pins","hides","photos","notes"]){const A=a[k]||{},B=b[k]||{};o[k]={};for(const id of uni(Object.keys(A),Object.keys(B)))o[k][id]=laterOf(A[id],B[id],"t");}
  for(const k of ["seen","signs","mods","er","dseen"])o[k]=uni(a[k],b[k]);
  const byId=new Map();[...(a.log||[]),...(b.log||[])].forEach(x=>{const id=x.id||(x.id=String(x.t||x.at||Math.random()));const prev=byId.get(id);if(!prev||(x.verAt||0)>(prev.verAt||0)||(!prev.ver&&x.ver))byId.set(id,x);});
  o.log=[...byId.values()].sort((x,y)=>(x.t||x.at||0)-(y.t||y.at||0)).slice(-400);
  o.xp=Math.max(a.xp||0,b.xp||0);
  /* settings merge key by key on their own timestamps, so a change on one device survives a later save elsewhere */
  const SA=a.settings||{},SB=b.settings||{},TA=a.settingsTs||{},TB=b.settingsTs||{};o.settings=Object.assign(blankState().settings,older.settings||{},newer.settings||{});o.settingsTs={};
  for(const k of uni(Object.keys(SA),Object.keys(SB))){const ta=TA[k]||0,tb=TB[k]||0;if(ta||tb){o.settings[k]=tb>ta?(k in SB?SB[k]:SA[k]):(k in SA?SA[k]:SB[k]);o.settingsTs[k]=Math.max(ta,tb);}}
  o.last=newer.last||older.last;o.updated=Math.max(a.updated||0,b.updated||0);o.epoch=E||undefined;if(!o.epoch)delete o.epoch;o.v=Math.max(a.v||3,b.v||3);
  return o;
}
const Store={
  s:blankState(),mode:"local",status:"This device",_t:null,_saving:false,_again:false,listeners:[],providers:[],provider:null,lastSync:0,
  init(){
    let loaded=null,raw=null;
    try{raw=localStorage.getItem(LS);if(raw)loaded=JSON.parse(raw);}catch(e){loaded=null;}
    if(raw&&(!loaded||typeof loaded!=="object"||(loaded.v&&loaded.v>3))){
      /* never overwrite what we cannot read: copy it aside and tell the user */
      try{localStorage.setItem(LS+".unreadable."+Date.now(),raw);}catch(e){}this.badLocal=loaded&&loaded.v>3?"newer":"unreadable";
      setTimeout(()=>{try{toast(this.badLocal==="newer"?"Your progress was saved by a newer Galen. It was kept aside untouched: update this device.":"Saved progress on this device could not be read. A copy was kept; sync or Restore will bring your progress back.","bad");}catch(e){}},1500);
      if(loaded&&loaded.v>3){this.s=this.merge(blankState(),loaded);this.readOnly=true;}loaded=null;}
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
  /* Another tab may have saved since we last looked: merge with it before writing, so two tabs never overwrite each other. */
  cache(){if(this.readOnly)return;
    try{const raw=localStorage.getItem(LS);if(raw&&raw!==this._lastRaw){const other=JSON.parse(raw);if(other&&(other.v===2||other.v===3))this.s=mergeStates(this.s,this.merge(blankState(),other));}}catch(e){}
    try{const out=JSON.stringify(this.s);localStorage.setItem(LS,out);this._lastRaw=out;this._full=false;}
    catch(e){if(!this._full){this._full=true;this.status="Storage full: progress is not being saved on this device";this.emit("status");try{toast("This device's storage is full. Galen cannot save progress here: free some space, or sync to Drive.","bad");}catch(x){}}}},
  /* settings changes are stamped key by key at save time */
  stampSettings(){const now=Date.now(),cur=this.s.settings||{},prev=this._setSnap||{};this.s.settingsTs=this.s.settingsTs||{};
    for(const k of Object.keys(cur))if(JSON.stringify(cur[k])!==JSON.stringify(prev[k])&&this._setSnap)this.s.settingsTs[k]=now;this._setSnap=JSON.parse(JSON.stringify(cur));},
  /* Reset: a backup is kept on the device, an epoch makes the reset win over other devices' older copies, and Undo is offered. */
  reset(){const before=JSON.stringify(this.s);try{localStorage.setItem(LS+".beforeReset",before);}catch(e){}
    const keep=this.s.settings;this.s=blankState();this.s.settings=keep;this.s.epoch=Date.now();this._lastRaw=null;
    try{localStorage.setItem(LS,JSON.stringify(this.s));this._lastRaw=localStorage.getItem(LS);}catch(e){}this.save(true);
    return ()=>{const old=JSON.parse(before);old.epoch=Date.now();this.s=this.merge(blankState(),old);try{localStorage.setItem(LS,JSON.stringify(this.s));this._lastRaw=localStorage.getItem(LS);}catch(e){}this.save(true);};},
  save(now){
    if(this.readOnly)return;
    this.stampSettings();this.s.updated=Date.now();
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
    try{if(this.provider.load&&Date.now()-(this.lastSync||0)>20000){const remote=await this.provider.load();if(remote&&(remote.v===2||remote.v===3)){const m=mergeStates(this.s,this.merge(blankState(),remote));if(JSON.stringify(m)!==JSON.stringify(this.s)){this.s=m;this._lastRaw=null;this.cache();this.emit();}}}
      await this.provider.save(JSON.parse(JSON.stringify(this.s)));this.status="Synced";this.lastSync=Date.now();}
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
/* another tab saved: fold its progress in */
window.addEventListener("storage",e=>{if(e.key!==LS||!e.newValue||e.newValue===Store._lastRaw)return;try{const other=JSON.parse(e.newValue);if(!other||!(other.v===2||other.v===3))return;const m=mergeStates(Store.s,Store.merge(blankState(),other));if(JSON.stringify(m)!==JSON.stringify(Store.s)){Store.s=m;Store._lastRaw=e.newValue;Store.emit();}}catch(x){}});
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});}catch(e){}
