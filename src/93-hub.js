"use strict";
/* ================= THE CITRUS HUB =================
 Galen's own progress lives in <root>/Galen/state.json (merged with this device's copy).
 Galen tells Citrus Maxima where it is through <root>/hub/galen/status.json and reads what Citrus planned (<root>/hub/citrus/plan.json). */
const Hub=(()=>{
  const APP="galen",TITLE="Galen",URL_PAGES="https://galen-app.github.io/galen/";
  const PLAN_KEY="galen.plan",STATUS_KEY="galen.status.fp";
  let stateFileId=null,lastStatusAt=0,lastFp="";
  try{lastFp=localStorage.getItem(STATUS_KEY)||"";}catch(e){}
  const path=()=>[G.root(),"Galen"];
  /* ---- Store provider ---- */
  const provider={name:"drive",label:"Google Drive",
    hint:()=>G.canUse()&&!G.wasSignedIn(),
    needsAction:()=>G.auth.needsSignIn?"Google needs a tap":"Saved on this device",
    async available(){return G.canUse()&&G.wasSignedIn()&&navigator.onLine!==false;},
    async load(){const r=await G.readJson(path(),"state.json");if(r){stateFileId=r.id;return r.data;}return null;},
    async save(s){const r=await G.writeJson(path(),"state.json",s);if(r&&r.id)stateFileId=r.id;writeStatusSoon();}
  };
  Store.register(provider);
  /* ---- week (Fri → Thu, like the other apps) ---- */
  const weekStart=(d=new Date())=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()-5+7)%7));return x;};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
  const key=d=>dayKey(d.getTime());
  /* ---- what Galen wants today ---- */
  function todayNeed(){
    const due=dueCards().length,room=Math.max(0,Store.s.settings.newPerDay-newToday()),nw=Math.min(room,newCards().length);
    const minutes=clamp(Math.round(due*0.4+nw*0.8)+4,6,45);
    return {due,nw,minutes};
  }
  function hubStatus(){
    const s=Store.s,t=new Date(),need=todayNeed(),ws=weekStart(t),we=addDays(ws,6);
    const days=[];let doneDays=0;for(let i=0;i<7;i++){const d=addDays(ws,i),k=key(d),n=s.days[k]||0;if(n)doneDays++;days.push({date:k,trained:!!n,items:n});}
    const goalDays=5,streakN=streak(),todayDone=(s.days[key(t)]||0)>=10;
    const plan=cachedPlan(),shift=plan&&plan.days&&plan.days[key(t)]&&plan.days[key(t)].shift;
    const pending=[];const unverified=s.log.filter(x=>!x.ver).length;if(unverified)pending.push(`${unverified} bedside finding${unverified>1?"s":""} to verify`);
    const weak=weakCards(3);if(weak.length)pending.push(`Trouble spots: ${weak.map(c=>c.label).slice(0,2).join(", ")}`);
    return {title:TITLE,icon:"🩺",color:"#ee6a1c",app:APP,version:window.GALEN_VERSION||"",device:navigator.platform||"",url:URL_PAGES,updatedAt:new Date().toISOString(),
      summary:`${need.due} due, ${need.nw} new · ${streakN}-day streak`+(todayDone?" · today done":""),
      due:need.due,estimatedMinutes:todayDone?0:need.minutes,streak:streakN,nextDue:todayDone?"tomorrow":"today",
      today:{date:key(t),done:todayDone,items:[{title:"Daily round",minutes:need.minutes,cards:need.due+need.nw}]},
      week:{start:key(ws),end:key(we),done:doneDays,target:goalDays,need:Math.max(0,goalDays-doneDays),days},
      next:{title:"Daily round",minutes:need.minutes},
      asks:todayDone?[]:[{date:null,title:"Galen: daily round",minutes:need.minutes,slot:shift&&shift.overnight?"postnight":"free"}],
      pending,
      extra:{due:need.due,newToday:newToday(),mastery:Math.round(mastery().pct*100),xp:s.xp||0,logUnverified:unverified}};
  }
  let statusTimer=null;
  function writeStatusSoon(){clearTimeout(statusTimer);statusTimer=setTimeout(()=>writeStatus(false),3000);}
  async function writeStatus(force){
    if(!G.canUse()||!G.wasSignedIn()||navigator.onLine===false)return false;
    const st=hubStatus();const fp=JSON.stringify(Object.assign({},st,{updatedAt:0}));
    if(!force&&(fp===lastFp||Date.now()-lastStatusAt<5*60*1000))return false;
    try{await G.writeJson([G.root(),"hub",APP],"status.json",st);lastFp=fp;lastStatusAt=Date.now();try{localStorage.setItem(STATUS_KEY,fp);}catch(e){}
      try{localStorage.setItem("citrus.status."+APP,JSON.stringify(st));}catch(e){} /* same-origin bridge for Citrus */
      return true;}catch(e){console.warn("status.json",e.message);return false;}
  }
  /* ---- Citrus's plan ---- */
  function cachedPlan(){try{return JSON.parse(localStorage.getItem(PLAN_KEY)||"null");}catch(e){return null;}}
  async function readPlan(){
    if(!G.canUse()||!G.wasSignedIn())return cachedPlan();
    try{const r=await G.readJson([G.root(),"hub","citrus"],"plan.json");if(r&&r.data){try{localStorage.setItem(PLAN_KEY,JSON.stringify(r.data));}catch(e){}return r.data;}}catch(e){console.warn("plan.json",e.message);}
    return cachedPlan();
  }
  const mine=b=>b&&((b.app||"").toLowerCase()==="galen"||/galen|exam|bedside|physical/i.test(b.title||""));
  function todayFromPlan(plan){
    plan=plan||cachedPlan();if(!plan||!plan.days)return null;
    const k=key(new Date()),d=plan.days[k];if(!d)return null;
    const y=plan.days[key(addDays(new Date(),-1))];
    return {shift:d.shift||null,afterNight:!!(y&&y.shift&&y.shift.overnight),blocks:(d.blocks||[]).filter(mine),date:k,updatedAt:plan.updatedAt};
  }
  /* ---- own clinical photos (<root>/Galen/photos) ---- */
  async function uploadPhoto(file,meta){
    const name=`${Date.now()}-${(file.name||"photo").replace(/[^\w.\-]+/g,"_")}`;
    const r=await G.uploadBlob([...path(),"photos"],name,file);
    const id=r.id;Store.s.photos[id]={t:Date.now(),name,subject:meta.subject||"",caption:meta.caption||"",size:r.size||file.size};Store.save();return id;
  }
  async function photoUrl(id){return G.downloadBlobUrl(id);}
  async function deletePhoto(id){try{await G.trash(id);}catch(e){}if(Store.s.photos[id]){Store.s.photos[id]={t:Date.now(),deleted:true};Store.save();}}
  /* ---- daily checks: renew quietly, pull, read the plan, write status ---- */
  let lastCheck=0;
  async function daily(reason){
    if(!G.canUse()||!G.wasSignedIn())return;
    if(reason!=="force"&&Date.now()-lastCheck<5*60*1000)return;lastCheck=Date.now();
    await Store.sync();await readPlan();await writeStatus(false);Store.emit("plan");
  }
  return {provider,hubStatus,writeStatus,writeStatusSoon,readPlan,todayFromPlan,todayNeed,cachedPlan,uploadPhoto,photoUrl,deletePhoto,daily,weekStart,URL_PAGES};
})();
