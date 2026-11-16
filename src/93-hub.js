"use strict";
/* ================= THE CITRUS HUB =================
 Galen's own progress lives in <root>/Galen/state.json (merged with this device's copy).
 Galen tells Citrus Maxima where it is through <root>/hub/galen/status.json and reads what Citrus planned (<root>/hub/citrus/plan.json).

 Sync transport (7.1). Store.push() pulls and merges when its last sync is older than 20 s, then calls provider.save().
 Around that, the provider guarantees:
 - one Drive sync at a time across every tab of this browser (Web Locks, with an in-page queue as the fallback);
 - a revision check: state.json carries appProperties {rev, h, v, n}. save() re-lists the file; if its md5 is not the one
   we last wrote, Drive changed under us, so the new copy is merged in first. It re-lists again just before and just after
   the upload, and a mismatch means "merge again" (up to 4 rounds);
 - a fingerprint (h, SHA-256 of the exact bytes) confirms that the file on Drive is ours after the upload;
 - an unreadable Drive file aborts the sync and is copied aside (state.unreadable-<date>.json); it is never overwritten
   until the user says so;
 - a newer schema on Drive is never overwritten by an older build: sync stops and asks for an update;
 - a safety stop when this device would replace Drive with far fewer records than Drive holds (a reset, which stamps an
   epoch, is the one expected case: a safety copy of Drive is kept first);
 - rolling Drive backups: 7 daily and 4 weekly in <root>/Galen/backups/, with "Bring back". */
const Hub=(()=>{
  const APP="galen",TITLE="Galen",URL_PAGES="https://galen-app.github.io/galen/";
  const PLAN_KEY="galen.plan",STATUS_KEY="galen.status.fp",SYNC_KEY="galen.sync.meta",BK_KEY="galen.backup.day",DEV_KEY="galen.dev.id",QUAR_KEY="galen.sync.quarantined";
  const LOCK="galen-drive-state",FILE="state.json",KEEP_DAILY=7,KEEP_WEEKLY=4,KEEP_SAFETY=6;
  const SUPPORTED=()=>{try{return blankState().v||3;}catch(e){return 3;}};
  const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}},del(k){try{localStorage.removeItem(k);}catch(e){}}};
  let lastStatusAt=0,lastFp="";
  try{lastFp=localStorage.getItem(STATUS_KEY)||"";}catch(e){}
  const path=()=>[G.root(),"Galen"];
  const deviceId=(()=>{let d=ls.get(DEV_KEY,"");if(typeof d!=="string"||!/^[a-z0-9]{6,20}$/.test(d)){d=Math.random().toString(36).slice(2,12);ls.set(DEV_KEY,d);}return d;})();
  const stamp=(t=Date.now())=>{const d=new Date(t);return `${dayKey(t)}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;};

  /* ---- one sync at a time ---- */
  let chain=Promise.resolve();
  function withLock(fn){
    try{if(navigator.locks&&navigator.locks.request)return navigator.locks.request(LOCK,()=>fn());}catch(e){}
    const p=chain.then(()=>fn());chain=p.catch(()=>{});return p;
  }
  /* ---- fingerprint: SHA-256 of the exact bytes (FNV-1a when SubtleCrypto is missing) ---- */
  async function digest(text){
    try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));return [...new Uint8Array(b)].slice(0,12).map(x=>x.toString(16).padStart(2,"0")).join("");}
    catch(e){let h1=0x811c9dc5,h2=0x01000193;for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);h1=Math.imul(h1^c,16777619)>>>0;h2=Math.imul(h2^c,2246822519)>>>0;}return "f"+h1.toString(16).padStart(8,"0")+h2.toString(16).padStart(8,"0");}
  }
  /* how much progress a state holds (live records only) */
  function count(s){if(!s||typeof s!=="object")return 0;const live=o=>o&&typeof o==="object"?Object.values(o).filter(x=>x&&typeof x==="object"&&!x.deleted).length:0;
    return live(s.srs)+live(s.hd)+live(s.notes)+live(s.photos)+live(s.pins)+live(s.rehearse)+live(s.loc)+live(s.dprac)+(Array.isArray(s.log)?s.log.length:0)+(s.days&&typeof s.days==="object"?Object.keys(s.days).length:0);}
  /* structural clean-up of anything that came from Drive or a backup file: no prototype keys (G.parse), no markup in keys */
  const BADKEY=/[<>"'`\\]/;
  function clean(x,depth=0){
    if(Array.isArray(x))return x.filter(v=>v!==null&&v!==undefined).map(v=>clean(v,depth+1));
    if(x&&typeof x==="object"){const o={};for(const k of Object.keys(x)){if(BADKEY.test(k)||k==="__proto__"||k==="constructor"||k==="prototype")continue;const v=x[k];if(v===null&&depth<2)continue;o[k]=clean(v,depth+1);}return o;}
    return x;
  }
  function sanitize(data){let d=clean(data);try{if(typeof sanitizeState==="function")d=sanitizeState(d)||d;}catch(e){}return d;}

  /* ---- what this device knows about Drive's state.json ---- */
  let known=ls.get(SYNC_KEY,null);
  /* a file's identity: md5 (always present on real Drive for JSON), else its version, else its modified time */
  const tagOf=f=>f?String(f.md5Checksum||(f.version?"v"+f.version:"")||f.modifiedTime||""):"";
  const knownFor=f=>!!(known&&f&&known.email===G.email()&&known.root===G.root()&&known.id===f.id&&known.md5&&known.md5===tagOf(f));
  const setKnown=k=>{known=k;k?ls.set(SYNC_KEY,k):ls.del(SYNC_KEY);};
  let rawCache={md5:"",raw:""};
  /* ---- problems that stop the sync until the user acts ---- */
  let block=null,lastErr=null,allowShrink=false,allowUnreadable="";
  const SyncStop=(kind,msg,extra)=>Object.assign(new Error(msg),{syncStop:kind},extra||{});
  function setBlock(b){block=b;drawNotice();}
  function noteError(e){
    if(e&&e.syncStop){lastErr={kind:e.syncStop,msg:e.message,at:Date.now()};}
    else if(e&&e.needsSignIn)lastErr={kind:"signin",msg:e.message,at:Date.now()};
    else if(e&&(e.transient||e.name==="AbortError"||navigator.onLine===false))lastErr={kind:"transient",msg:e.message,at:Date.now()};
    else lastErr={kind:"other",msg:(e&&e.message)||String(e),at:Date.now()};
    try{if(typeof DIAG!=="undefined"&&DIAG.errors){DIAG.errors.push({t:Date.now(),m:"Sync: "+lastErr.msg});if(DIAG.errors.length>8)DIAG.errors.shift();}}catch(x){}
    if(lastErr.kind==="transient")scheduleRetry();
  }
  function clearError(){lastErr=null;retryN=0;clearTimeout(retryTimer);if(block&&block.kind!=="switched")setBlock(null);}
  function statusText(){
    if(G.auth.needsSignIn)return "Google needs a tap";
    const k=(block&&block.kind)||(lastErr&&lastErr.kind);
    if(k==="newer")return "Update Galen to sync";
    if(k==="unreadable")return "Sync paused: Drive copy unreadable";
    if(k==="shrink")return "Sync paused: check Drive";
    if(k==="switched")return "Sync paused: new account";
    if(k==="signin")return "Google needs a tap";
    if(k==="transient")return navigator.onLine===false?"Offline · saved on this device":"Drive unreachable · will retry";
    if(k==="other")return "Not synced · saved on this device";
    return "Saved on this device";
  }
  /* ---- retry with backoff: 30 s, 2 min, then every 10 min ---- */
  let retryN=0,retryTimer=null;
  function scheduleRetry(){clearTimeout(retryTimer);const ms=[30e3,120e3,600e3][Math.min(retryN,2)];retryN++;retryTimer=setTimeout(()=>{daily("retry").catch(()=>{});},ms);}

  /* Merge a Drive copy into this device's state, as Store.push does, and keep the result on this device. */
  function absorb(data){
    if(!data)return false;
    if(typeof Store.absorb==="function")return Store.absorb(data);
    const m=mergeStates(Store.s,Store.merge(blankState(),data));
    if(JSON.stringify(m)===JSON.stringify(Store.s))return false;
    Store.s=m;Store._lastRaw=null;Store.cache();Store.emit();return true;
  }
  /* keep an unreadable Drive file aside (once per version of it) */
  async function quarantine(f,folderId){
    const done=ls.get(QUAR_KEY,[]);const list=Array.isArray(done)?done:[];
    if(tagOf(f)&&list.includes(tagOf(f)))return (block&&block.copy)||"";
    const name=`state.unreadable-${stamp()}.json`;
    try{await G.copy(f.id,name,folderId);}catch(e){throw SyncStop("unreadable","Drive's state.json cannot be read and could not be copied aside: nothing was changed");}
    list.push(tagOf(f)||f.id);ls.set(QUAR_KEY,list.slice(-20));return name;
  }
  /* read one state file, checked: throws a SyncStop for unreadable or newer files */
  async function readChecked(f,folderId,o={}){
    let r=null;
    if(tagOf(f)&&rawCache.md5===tagOf(f)){r=Object.assign({},f,{raw:rawCache.raw,md5:f.md5Checksum,app:f.appProperties||{}});try{r.data=G.parse(r.raw);}catch(e){r.data=null;r.unreadable=true;}}
    else{r=await G.readFile(f);if(r&&r.unreadable){await new Promise(z=>setTimeout(z,400));r=await G.readFile(f);}}
    if(!r)return null;
    if(r.unreadable){
      if(allowUnreadable&&allowUnreadable===tagOf(f))return null; /* the user chose this device's copy; the bad one is already aside */
      const copyName=await quarantine(f,folderId);
      if(o.dupe)return {dupeUnreadable:true};
      setBlock({kind:"unreadable",copy:copyName,md5:tagOf(f)});
      throw SyncStop("unreadable","Drive's state.json cannot be read. It was copied aside and nothing was overwritten.");
    }
    const v=Math.max(+r.data.v||0,+((f.appProperties||{}).v)||0);
    if(v>SUPPORTED()){setBlock({kind:"newer",v});throw SyncStop("newer","Drive holds progress from a newer Galen. Update this device to keep syncing.");}
    if(tagOf(f)){rawCache={md5:tagOf(f),raw:r.raw};}
    return sanitize(r.data);
  }
  /* newest reset of any kind: the full reset's epoch or a partial reset's epochs[group] */
  const ep=s=>s&&typeof s==="object"?Math.max(+s.epoch||0,...Object.values(s.epochs&&typeof s.epochs==="object"?s.epochs:{}).map(x=>+x||0)):0;
  const oldestFirst=fs=>fs.slice().sort((a,b)=>String(a.createdTime||a.modifiedTime||"").localeCompare(String(b.createdTime||b.modifiedTime||""))||String(a.id).localeCompare(String(b.id)));
  function switchedStop(){if(G.auth.switched){setBlock({kind:"switched",from:G.auth.switched.from,to:G.auth.switched.to});throw SyncStop("switched","Signed in to a different Google account: choose what to do with this device's progress.");}}

  /* ---- Store provider ---- */
  const provider={name:"drive",label:"Google Drive",
    hint:()=>G.canUse()&&!G.wasSignedIn(),
    needsAction:()=>statusText(),
    async available(){return G.canUse()&&G.wasSignedIn()&&navigator.onLine!==false;},
    /* Pull: Drive's state (every state.json merged, should two devices have made one each). Throws rather than return something unsafe. */
    load(){return withLock(async()=>{
      try{
        switchedStop();
        const folder=await G.ensurePath(path(),{create:false});if(!folder){clearError();return null;}
        const files=oldestFirst(await G.list(folder,{name:FILE,order:"createdTime"}));if(!files.length){clearError();return null;}
        let data=await readChecked(files[0],folder);
        for(const f of files.slice(1)){const d=await readChecked(f,folder,{dupe:true});if(d&&!d.dupeUnreadable)data=data?mergeStates(data,Store.merge(blankState(),d)):d;}
        if(block&&(block.kind==="unreadable"||block.kind==="newer"))setBlock(null);
        clearError();return data;
      }catch(e){noteError(e);throw e;}
    });},
    /* Push: never blind. */
    save(){return withLock(async()=>{
      try{const r=await safeSave();clearError();writeStatusSoon();backupSoon();return r;}
      catch(e){noteError(e);throw e;}
    });}
  };
  async function safeSave(){
    switchedStop();
    if(Store.readOnly)throw SyncStop("newer","This device holds progress from a newer Galen. Update Galen to sync.");
    const folder=await G.ensurePath(path());
    for(let round=0;round<4;round++){
      const files=oldestFirst(await G.list(folder,{name:FILE,order:"createdTime"}));
      const prim=files[0]||null,dupes=files.slice(1);let remote=null;
      /* 1. Drive changed since our last confirmed write (or we never wrote it): merge it in first */
      if(prim&&!knownFor(prim)){remote=await readChecked(prim,folder);if(remote)absorb(remote);}
      else if(prim&&(+((prim.appProperties||{}).v)||0)>SUPPORTED()){setBlock({kind:"newer"});throw SyncStop("newer","Drive holds progress from a newer Galen. Update this device to keep syncing.");}
      for(const d of dupes){const x=await readChecked(d,folder,{dupe:true});if(x&&!x.dupeUnreadable)absorb(x);}
      /* 2. what we will write: this device's state now, which includes everything just merged */
      const payload=JSON.parse(JSON.stringify(Store.s));
      const pn=count(payload),app=(prim&&prim.appProperties)||{};
      const rn=remote?count(remote):(+app.n||0);
      /* 3. safety stop: far fewer records here than on Drive */
      if(prim&&rn>=40&&pn<rn*0.5){
        const resetHere=ep(payload)>Math.max(+app.epoch||0,ep(remote));
        if(!resetHere&&!allowShrink){setBlock({kind:"shrink",here:pn,drive:rn});throw SyncStop("shrink",`This device has ${pn} records and Drive has ${rn}. Sync paused so nothing is lost.`);}
        await safetyCopy(prim,folder);
      }
      const text=JSON.stringify(payload),h=await digest(text),rev=(parseInt(app.rev,10)||0)+1;
      if(prim&&app.h===h&&tagOf(prim)&&!dupes.length){setKnown({email:G.email(),root:G.root(),id:prim.id,md5:tagOf(prim),rev:+app.rev||0,h,n:pn,at:Date.now()});allowShrink=false;allowUnreadable="";return prim;}
      /* 4. re-list just before the upload: if it moved, merge again */
      if(prim){const now=await G.list(folder,{name:FILE,order:"createdTime"});const m=now.find(f=>f.id===prim.id);if(!m||tagOf(m)!==tagOf(prim)||now.length!==files.length)continue;}
      const props={rev:String(rev),h,v:String(payload.v||SUPPORTED()),n:String(pn),dev:deviceId,b:String(window.GALEN_BUILD||window.GALEN_VERSION||""),at:String(Date.now()),epoch:String(ep(payload))};
      const up=await G.writeJsonIn(folder,FILE,text,prim?prim.id:null,props);
      /* 5. re-list after: the file must be ours, and alone */
      const after=oldestFirst(await G.list(folder,{name:FILE,order:"createdTime"}));
      const top=after[0];
      const mineOnDrive=top&&top.id===up.id&&(top.appProperties&&top.appProperties.h?top.appProperties.h===h&&(!up.md5Checksum||top.md5Checksum===up.md5Checksum):tagOf(top)===tagOf(up));
      if(!mineOnDrive){
        if(!prim&&top&&top.id!==up.id){/* another device created state.json at the same moment: ours becomes the spare, merged next round */}
        known=null;continue;}
      setKnown({email:G.email(),root:G.root(),id:up.id,md5:tagOf(top),rev,h,n:pn,at:Date.now()});rawCache={md5:tagOf(top),raw:text};
      /* spares that we merged this round go to the bin (Drive keeps them there for 30 days) */
      const merged=new Set(dupes.map(d=>d.id+"|"+tagOf(d)));
      for(const d of after.slice(1))if(merged.has(d.id+"|"+tagOf(d)))await G.trash(d.id).catch(()=>{});
      if(after.slice(1).some(d=>!merged.has(d.id+"|"+tagOf(d))))continue; /* a spare we have not read yet: one more round */
      allowShrink=false;allowUnreadable="";if(block&&block.kind!=="switched")setBlock(null);
      return up;
    }
    throw Object.assign(new Error("Drive kept changing during the sync; will retry"),{transient:true});
  }
  Store.register(provider);

  /* ---- Drive backups: <root>/Galen/backups ---- */
  const BK_RE=/^galen-(daily|weekly|safety)-(\d{4}-\d{2}-\d{2})(?:-(\d{4}))?\.json$/;
  const bkPath=()=>[...path(),"backups"];
  async function safetyCopy(f,folder){try{const bf=await G.ensurePath(bkPath());await G.copy(f.id,`galen-safety-${stamp()}.json`,bf);await prune(bf);}catch(e){throw Object.assign(new Error("Could not keep a safety copy of Drive first: nothing was changed"),{transient:!!e.transient});}}
  async function prune(folder){
    const files=(await G.list(folder,{pageSize:200})).filter(f=>BK_RE.test(f.name));
    const by=k=>files.filter(f=>BK_RE.exec(f.name)[1]===k).sort((a,b)=>b.name.localeCompare(a.name));
    const drop=[...by("daily").slice(KEEP_DAILY),...by("weekly").slice(KEEP_WEEKLY),...by("safety").slice(KEEP_SAFETY)];
    for(const f of drop)await G.trash(f.id).catch(()=>{});
    return files.filter(f=>!drop.includes(f));
  }
  let bkTimer=null;
  function backupSoon(){clearTimeout(bkTimer);bkTimer=setTimeout(()=>backupDaily().catch(e=>console.warn("backup",e.message)),4000);}
  async function backupDaily(force){
    if(!G.canUse()||!G.wasSignedIn()||Store.mode!=="drive"||block||Store.passive)return false;
    const tag=dayKey()+"|"+G.email();if(!force&&ls.get(BK_KEY,"")===tag)return false;
    if(!count(Store.s))return false;
    const folder=await G.ensurePath(bkPath());const have=new Set((await G.list(folder,{pageSize:200})).map(f=>f.name));
    const text=JSON.stringify(Store.s),props={n:String(count(Store.s)),v:String(Store.s.v||3),dev:deviceId};
    const day=`galen-daily-${dayKey()}.json`,week=`galen-weekly-${dayKey(weekStart().getTime())}.json`;
    if(!have.has(day))await G.writeJsonIn(folder,day,text,null,Object.assign({kind:"daily"},props));
    if(!have.has(week))await G.writeJsonIn(folder,week,text,null,Object.assign({kind:"weekly"},props));
    await prune(folder);ls.set(BK_KEY,tag);return true;
  }
  async function listBackups(){
    const files=await G.listIn(bkPath(),{pageSize:200});
    return files.filter(f=>BK_RE.test(f.name)).map(f=>{const m=BK_RE.exec(f.name);const [y,mo,d]=m[2].split("-");
      return {id:f.id,name:f.name,kind:m[1],day:m[2],label:`${d}/${mo}/${y}`+(m[3]?` ${m[3].slice(0,2)}:${m[3].slice(2)}`:""),n:+((f.appProperties||{}).n)||0,size:+f.size||0};})
      .sort((a,b)=>b.name.localeCompare(a.name));
  }
  /* Bring back: merge a backup into this device and Drive. Nothing you have now is removed; a copy of this device is kept first. */
  async function bringBack(id){
    const r=await G.readFile({id});if(!r||r.unreadable)throw new Error("This backup cannot be read. Nothing was changed.");
    if((+r.data.v||0)>SUPPORTED())throw new Error("This backup is from a newer Galen. Update this device first.");
    const data=sanitize(r.data);
    /* the store's own restore (merge mode) keeps a copy first, lifts a backup from before a reset over the epoch, and gives an undo */
    if(typeof Store.restore==="function"){const before=count(Store.s);Store.restore(data);return {added:Math.max(0,count(Store.s)-before)};}
    /* a backup from before a reset would be filtered out by the reset's epoch: bring it in on today's epoch */
    if(Store.s.epoch)data.epoch=Store.s.epoch;else delete data.epoch;
    ls.set("galen.v3.before-bringback",{at:Date.now(),s:Store.s});
    const before=count(Store.s);absorb(data);Store.save(true);
    return {added:Math.max(0,count(Store.s)-before)};
  }

  /* ---- week (Fri → Thu, like the other apps) ---- */
  const weekStart=(d=new Date())=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()-5+7)%7));return x;};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
  const key=d=>dayKey(d.getTime());
  /* the last complete week (for a weekly recap): start and end as Dates */
  const prevWeek=(d=new Date())=>{const s=addDays(weekStart(d),-7);return {start:s,end:addDays(s,6)};};
  /* ---- what Galen wants today ---- */
  /* the same plan Galen shows on Today (light after a night, shift days, backlog), so Citrus books the right length */
  function todayNeed(){
    if(typeof dayPlan==="function"){try{const p=dayPlan(),due=p.due,nw=Math.min(p.room,newCards().length);
      const minutes=clamp(Math.round((Math.min(due,p.fit)+nw)*(p.spc||30)/60),5,Math.max(5,p.minutes||15));return {due,nw,minutes,light:!!p.light};}catch(e){}}
    const due=dueCards().length,room=Math.max(0,(+Store.s.settings.newPerDay||0)-newToday()),nw=Math.min(room,newCards().length);
    const minutes=clamp(Math.round(due*0.4+nw*0.8)+4,6,45);
    return {due,nw,minutes};
  }
  function hubStatus(){
    const s=Store.s,t=new Date(),need=todayNeed(),ws=weekStart(t),we=addDays(ws,6);
    const days=[];let doneDays=0;for(let i=0;i<7;i++){const d=addDays(ws,i),k=key(d),n=+s.days[k]||0;if(n)doneDays++;days.push({date:k,trained:!!n,items:n});}
    const goalDays=5,streakN=streak(),todayDone=(+s.days[key(t)]||0)>=10;
    const plan=cachedPlan(),shift=plan&&plan.days&&plan.days[key(t)]&&plan.days[key(t)].shift;
    const pending=[];const unverified=(s.log||[]).filter(x=>x&&!x.ver).length;if(unverified)pending.push(`${unverified} bedside finding${unverified>1?"s":""} to verify`);
    let weak=[];try{weak=weakCards(3);}catch(e){}if(weak.length)pending.push(`Trouble spots: ${weak.map(c=>c.label).slice(0,2).join(", ")}`);
    let mast=0;try{mast=Math.round(mastery().pct*100)||0;}catch(e){}
    return {title:TITLE,icon:"🩺",color:"#ee6a1c",app:APP,version:window.GALEN_VERSION||"",device:navigator.platform||"",url:URL_PAGES,updatedAt:new Date().toISOString(),
      summary:`${need.due} due, ${need.nw} new · ${streakN}-day streak`+(todayDone?" · today done":""),
      due:need.due,estimatedMinutes:todayDone?0:need.minutes,streak:streakN,nextDue:todayDone?"tomorrow":"today",
      today:{date:key(t),done:todayDone,items:[{title:"Daily round",minutes:need.minutes,cards:need.due+need.nw}]},
      week:{start:key(ws),end:key(we),done:doneDays,target:goalDays,need:Math.max(0,goalDays-doneDays),days},
      next:{title:"Daily round",minutes:need.minutes},
      asks:todayDone?[]:[{date:null,title:"Galen: daily round",minutes:need.minutes,slot:shift&&shift.overnight?"postnight":"free"}],
      pending,
      extra:{due:need.due,newToday:newToday(),mastery:mast,xp:Math.max(0,+s.xp||0),logUnverified:unverified}};
  }
  let statusTimer=null;
  function writeStatusSoon(){clearTimeout(statusTimer);statusTimer=setTimeout(()=>writeStatus(false),3000);}
  async function writeStatus(force){
    if(!G.canUse()||!G.wasSignedIn()||navigator.onLine===false||G.auth.switched||Store.passive)return false;
    let st;try{st=hubStatus();}catch(e){console.warn("status",e);return false;}
    const fp=JSON.stringify(Object.assign({},st,{updatedAt:0}));
    if(!force&&(fp===lastFp||Date.now()-lastStatusAt<5*60*1000))return false;
    try{await G.writeJson([G.root(),"hub",APP],"status.json",st);lastFp=fp;lastStatusAt=Date.now();try{localStorage.setItem(STATUS_KEY,fp);}catch(e){}
      try{localStorage.setItem("citrus.status."+APP,JSON.stringify(st));}catch(e){} /* same-origin bridge for Citrus */
      return true;}catch(e){console.warn("status.json",e.message);return false;}
  }
  /* ---- Citrus's plan: another app's file, so every field is checked and stripped of markup before anything renders it ---- */
  const str=(x,max=80)=>typeof x==="string"||typeof x==="number"?String(x).replace(/[<>"'`\\\u0000-\u001f\u007f]/g,"").trim().slice(0,max):"";
  const time=x=>{const s=str(x,8);return /^\d{1,2}:\d{2}$/.test(s)?s:"";};
  const DK=/^\d{4}-\d{2}-\d{2}$/;
  function sanitizePlan(p){
    if(!p||typeof p!=="object"||!p.days||typeof p.days!=="object")return null;
    const out={app:str(p.app,20),updatedAt:str(p.updatedAt,40),days:{}};
    for(const k of Object.keys(p.days).filter(k=>DK.test(k)).sort().slice(-60)){const d=p.days[k];if(!d||typeof d!=="object")continue;
      const sh=d.shift&&typeof d.shift==="object"?{code:str(d.shift.code,12),label:str(d.shift.label,40),site:str(d.shift.site,40),start:time(d.shift.start),end:time(d.shift.end),overnight:d.shift.overnight===true}:null;
      const blocks=(Array.isArray(d.blocks)?d.blocks:[]).filter(b=>b&&typeof b==="object").slice(0,24).map(b=>{const m=Math.round(+b.minutes);return {app:str(b.app,20),title:str(b.title,80),date:DK.test(str(b.date,10))?str(b.date,10):k,start:time(b.start),end:time(b.end),minutes:Number.isFinite(m)&&m>0&&m<=600?m:0};});
      out.days[k]={shift:sh,blocks};}
    return out;
  }
  function cachedPlan(){try{return sanitizePlan(JSON.parse(localStorage.getItem(PLAN_KEY)||"null"));}catch(e){return null;}}
  async function readPlan(){
    if(!G.canUse()||!G.wasSignedIn()||G.auth.switched)return cachedPlan();
    try{const r=await G.readJson([G.root(),"hub","citrus"],"plan.json");const p=r&&r.data?sanitizePlan(r.data):null;if(p){try{localStorage.setItem(PLAN_KEY,JSON.stringify(p));}catch(e){}return p;}}catch(e){console.warn("plan.json",e.message);}
    return cachedPlan();
  }
  const mine=b=>b&&((b.app||"").toLowerCase()==="galen"||/galen|exam|bedside|physical/i.test(b.title||""));
  function todayFromPlan(plan){
    plan=plan?sanitizePlan(plan):cachedPlan();if(!plan||!plan.days)return null;
    const k=key(new Date()),d=plan.days[k];if(!d)return null;
    const y=plan.days[key(addDays(new Date(),-1))];
    return {shift:d.shift||null,afterNight:!!(y&&y.shift&&y.shift.overnight),blocks:(d.blocks||[]).filter(mine),date:k,updatedAt:plan.updatedAt};
  }
  /* ---- own clinical photos (<root>/Galen/photos) ---- */
  const urls=new Map(); /* one blob URL per photo, the oldest 30 released */
  async function uploadPhoto(file,meta){
    const name=`${Date.now()}-${(file.name||"photo").replace(/[^\w.\-]+/g,"_").slice(0,80)}`;
    const r=await G.uploadBlob([...path(),"photos"],name,file);
    const id=r.id;Store.s.photos[id]={t:Date.now(),name,subject:meta.subject||"",caption:meta.caption||"",size:r.size||file.size};Store.save();return id;
  }
  async function photoUrl(id){
    if(urls.has(id)){const u=urls.get(id);urls.delete(id);urls.set(id,u);return u;}
    const u=await G.downloadBlobUrl(id);urls.set(id,u);
    while(urls.size>30){const [k,v]=urls.entries().next().value;urls.delete(k);try{URL.revokeObjectURL(v);}catch(e){}}
    return u;
  }
  async function deletePhoto(id){try{await G.trash(id);}catch(e){}if(urls.has(id)){try{URL.revokeObjectURL(urls.get(id));}catch(e){}urls.delete(id);}if(Store.s.photos[id]){Store.s.photos[id]={t:Date.now(),deleted:true};Store.save();}}
  /* ---- daily checks: renew quietly, pull, read the plan, write status ---- */
  let lastCheck=0;
  async function daily(reason){
    if(!G.canUse()||!G.wasSignedIn()||Store.passive)return; /* another window is the writer */
    const urgent=reason==="force"||reason==="retry"||reason==="online"||reason==="resolve";
    if(!urgent&&Date.now()-lastCheck<5*60*1000)return;lastCheck=Date.now();
    await Store.sync();fixStatus();
    if(Store.mode==="drive"&&!block){await readPlan();await writeStatus(false);Store.emit("plan");backupSoon();}
  }
  /* Store.connect ends with "This device" when every provider failed; say what is really wrong */
  function fixStatus(){if(!G.canUse()||!G.wasSignedIn())return;if(Store.mode!=="drive"&&(block||lastErr)){const t=statusText();if(Store.status!==t){Store.status=t;Store.emit("status");}}drawNotice();}
  Store.on(kind=>{if(kind==="status")fixStatus();});

  /* ---- notices: a small persistent bar above the tab bar, used by sync problems and by the update flow ---- */
  function shellNotice(id,html,buttons){
    let host=document.getElementById("shellbars");
    if(!html){const el=host&&host.querySelector(`[data-n="${id}"]`);if(el)el.remove();return null;}
    if(!host){host=document.createElement("div");host.id="shellbars";host.setAttribute("role","region");host.setAttribute("aria-label","Notices");document.body.append(host);}
    let el=host.querySelector(`[data-n="${id}"]`);
    if(!el){el=document.createElement("div");el.className="updbar shellbar";el.dataset.n=id;el.setAttribute("role","status");host.append(el);}
    el.innerHTML=`<span class="sb-t">${html}</span><span class="sb-b"></span><button class="sb-x" aria-label="Hide this notice" title="Hide">×</button>`;
    const bb=el.querySelector(".sb-b");
    (buttons||[]).forEach(([label,fn,cls])=>{const b=document.createElement("button");b.className="btn sm"+(cls?" "+cls:"");b.textContent=label;b.addEventListener("click",()=>{try{fn(b);}catch(e){console.warn(e);}});bb.append(b);});
    el.querySelector(".sb-x").addEventListener("click",()=>{el.remove();if(id==="sync")hiddenFor=JSON.stringify(block);});
    return el;
  }
  let hiddenFor="";
  const goBackups=()=>{try{open("tools","backups");}catch(e){}};
  function drawNotice(){
    if(typeof document==="undefined"||!document.body)return;
    if(!block||hiddenFor===JSON.stringify(block)){if(!block)shellNotice("sync",null);return;}
    const b=block,e=esc;
    if(b.kind==="unreadable")shellNotice("sync",`Galen could not read its Drive copy. It is kept as <b>${e(b.copy||"state.unreadable")}</b> and nothing was overwritten.`,[["Use this device",()=>{allowUnreadable=b.md5||"";setBlock(null);daily("resolve");}],["Backups",goBackups,"ghost"]]);
    else if(b.kind==="newer")shellNotice("sync","Drive holds progress from a newer Galen. Update this device to keep syncing.",[["Update",btn=>{const r=window.GALEN_SW;if(r&&r.waiting){r.waiting.postMessage("skipWaiting");btn.textContent="Updating…";}else if(r){btn.textContent="Checking…";r.update().then(()=>setTimeout(()=>{btn.textContent=r.waiting||r.installing?"Downloading…":"No update yet";},1500)).catch(()=>{btn.textContent="Offline";});}else location.reload();}]]);
    else if(b.kind==="shrink")shellNotice("sync",`This device has ${+b.here||0} records and Drive has ${+b.drive||0}. Sync is paused so nothing is lost.`,[["Bring Drive's in",()=>{setKnown(null);setBlock(null);daily("resolve");}],["Replace Drive",btn=>{if(btn.dataset.arm!=="1"){btn.dataset.arm="1";btn.textContent="Tap again: a safety copy is kept";setTimeout(()=>{btn.dataset.arm="";btn.textContent="Replace Drive";},5000);return;}allowShrink=true;setBlock(null);daily("resolve");},"ghost"]]);
    else if(b.kind==="switched")shellNotice("sync",`Now signed in as <b>${e(b.to)}</b>. This device holds progress from <b>${e(b.from)}</b>.`,[["Add it to this account",()=>resolveSwitch(true)],["Use this account's copy",()=>resolveSwitch(false),"ghost"]]);
  }
  function resolveSwitch(keepLocal){
    if(!keepLocal){if(!ls.set("galen.v3.before-switch",{at:Date.now(),from:G.auth.switched&&G.auth.switched.from,s:Store.s})){try{toast("This device has no room to keep its old progress aside, so nothing was changed. Download a backup in Tools first.","bad");}catch(e){}return;}const keep=Store.s.settings;Store.s=blankState();Store.s.settings=keep;Store._lastRaw=null;try{localStorage.setItem(LS,JSON.stringify(Store.s));Store._lastRaw=localStorage.getItem(LS);}catch(e){}Store.emit();}
    G.auth.switched=null;setKnown(null);rawCache={md5:"",raw:""};setBlock(null);lastErr=null;
    try{toast(keepLocal?"This device's progress will be added to this account":"Using this account's copy. This device's old progress is kept aside on the device.","good");}catch(e){}
    Store.connect().then(()=>daily("resolve")).catch(()=>{});
  }
  /* on sign-in with another account, stop before anything is read or written */
  G.onAuthChange(()=>{if(G.auth.switched&&(!block||block.kind!=="switched")){setBlock({kind:"switched",from:G.auth.switched.from,to:G.auth.switched.to});}});

  /* ---- Drive backups page ---- */
  if(typeof route==="function")route("tools:backups","Drive backups",(root)=>{
    const head=`<section class="ph"><span class="eyebrow">Google Drive</span><h1>Drive backups</h1><p class="lede">Each day Galen keeps a copy of your progress in <b>${esc(G.root())}/Galen/backups</b>: the last ${KEEP_DAILY} days and the last ${KEEP_WEEKLY} weeks, plus a safety copy before Drive is ever replaced. <b>Bring back</b> adds a backup's progress to what you have now; nothing current is removed.</p></section>`;
    if(!G.canUse()||!G.wasSignedIn()){root.innerHTML=head+`<div class="card"><p class="small">Sign in to Google in Tools to keep Drive backups.</p><button class="btn soft" data-go="tools/google">Google Drive</button></div>`;return;}
    root.innerHTML=head+`<div class="card stack" style="gap:10px" id="bk-list"><p class="small muted">Reading backups…</p></div><div class="row-x" style="margin-top:12px"><button class="btn soft" id="bk-now">Back up now</button></div>`;
    const box=$("#bk-list",root);
    const draw=async()=>{
      try{const items=await listBackups();
        if(!items.length){box.innerHTML=`<p class="small muted">No backups yet. The first is made after today's first sync.</p>`;return;}
        const kind={daily:"Daily",weekly:"Weekly",safety:"Safety copy"};
        box.innerHTML=items.map(b=>`<div class="row-x bk-row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span><b>${esc(b.label)}</b> <span class="small muted">${esc(kind[b.kind]||b.kind)}${b.n?` · ${b.n} records`:""}${b.size?` · ${(b.size/1024).toFixed(1)} KB`:""}</span></span><button class="btn sm" data-bk="${esc(b.id)}">Bring back</button></div>`).join("");
        box.querySelectorAll("[data-bk]").forEach(btn=>btn.addEventListener("click",async()=>{
          if(btn.dataset.arm!=="1"){btn.dataset.arm="1";btn.textContent="Tap to confirm";setTimeout(()=>{btn.dataset.arm="";btn.textContent="Bring back";},4000);return;}
          btn.disabled=true;btn.textContent="Bringing back…";
          try{const r=await bringBack(btn.dataset.bk);toast(r.added?`Brought back ${r.added} record${r.added>1?"s":""}. Nothing was removed.`:"Nothing new in that backup: you already have all of it.","good");btn.textContent="Done";}
          catch(e){toast(e.message,"bad");btn.disabled=false;btn.textContent="Bring back";}}));
      }catch(e){box.innerHTML=`<p class="small">Backups could not be read: ${esc(e.transient?"Drive is unreachable right now.":e.message)}</p>`;}
    };
    $("#bk-now",root).addEventListener("click",async e=>{const b=e.currentTarget;b.disabled=true;try{await Store.sync();const ok=await backupDaily(true);toast(ok?"Backed up to Drive":"Backup skipped: sync first",ok?"good":"");}catch(x){toast("Backup failed: "+x.message,"bad");}b.disabled=false;draw();});
    draw();
  });

  return {provider,hubStatus,writeStatus,writeStatusSoon,readPlan,todayFromPlan,todayNeed,cachedPlan,sanitizePlan,uploadPhoto,photoUrl,deletePhoto,daily,weekStart,prevWeek,URL_PAGES,
    shellNotice,backupDaily,listBackups,bringBack,
    syncInfo:()=>({known,block,lastErr,deviceId,status:statusText()}),
    allowShrinkOnce:()=>{allowShrink=true;},
    _test:{count,digest,sanitize,clean}};
})();
