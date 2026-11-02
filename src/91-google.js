"use strict";
/* ================= GOOGLE (sign-in, Drive, Calendar) =================
 Same approach as Citrus Maxima and Orange: Google Identity Services token client in the browser, no backend, no secret.
 The access token lives on this device only (localStorage) and lasts an hour; a quiet renewal runs while the Google session is alive. */
const G=(()=>{
  const DEFAULT_CLIENT_ID="753489712404-ra7ahu34gjl305b4ss1765idmqg7am5s.apps.googleusercontent.com"; // the shared "Citrus web" client
  const SCOPES=["https://www.googleapis.com/auth/drive","https://www.googleapis.com/auth/calendar.readonly","https://www.googleapis.com/auth/userinfo.email"].join(" ");
  const TOKEN_KEY="galen.google",IDS_KEY="galen.drive.ids",CFG_KEY="galen.google.cfg";
  let token=null,tokenClient=null,silentInFlight=null,ids={},cfg={clientId:DEFAULT_CLIENT_ID,root:"My Apps"};
  try{token=JSON.parse(localStorage.getItem(TOKEN_KEY)||"null");}catch(e){}
  try{ids=JSON.parse(localStorage.getItem(IDS_KEY)||"{}");}catch(e){}
  try{Object.assign(cfg,JSON.parse(localStorage.getItem(CFG_KEY)||"{}"));}catch(e){}
  const listeners=new Set();const auth={needsSignIn:false,lastError:""};
  const saveToken=t=>{token=t?Object.assign({},token||{},t):null;try{token?localStorage.setItem(TOKEN_KEY,JSON.stringify(token)):localStorage.removeItem(TOKEN_KEY);}catch(e){}listeners.forEach(f=>{try{f(isSignedIn());}catch(e){}});};
  const isSignedIn=()=>!!(token&&token.access_token&&token.exp>Date.now());
  const wasSignedIn=()=>!!(token&&token.email);
  const canUse=()=>window.GALEN_PLATFORM!=="artifact";
  function setConfig(o){Object.assign(cfg,o);try{localStorage.setItem(CFG_KEY,JSON.stringify(cfg));}catch(e){}tokenClient=null;}
  function loadGis(){
    if(window.google&&window.google.accounts&&window.google.accounts.oauth2)return Promise.resolve();
    return new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.async=true;s.defer=true;s.onload=()=>res();s.onerror=()=>rej(new Error("Google sign-in script did not load (offline?)"));document.head.append(s);});
  }
  async function init(){if(!canUse())throw new Error("Google works in the installed Galen app, not in this preview");await loadGis();tokenClient=window.google.accounts.oauth2.initTokenClient({client_id:cfg.clientId||DEFAULT_CLIENT_ID,scope:SCOPES,prompt:"",callback:()=>{}});}
  function signIn(opt={}){
    const silent=!!opt.silent;if(silent&&silentInFlight)return silentInFlight;
    const p=new Promise(async(res,rej)=>{
      try{if(!tokenClient)await init();}catch(e){return rej(e);}
      const timer=setTimeout(()=>rej(new Error(silent?"silent_timeout":"Sign-in timed out")),silent?15000:120000);
      tokenClient.callback=async(resp)=>{clearTimeout(timer);
        if(resp.error){auth.lastError=resp.error_description||resp.error;return rej(new Error(auth.lastError));}
        saveToken({access_token:resp.access_token,exp:Date.now()+(resp.expires_in-60)*1000});auth.needsSignIn=false;auth.lastError="";
        if(!token.email){try{const u=await userInfo();saveToken({email:u.email||""});}catch(e){}}
        res(token);};
      tokenClient.error_callback=e=>{clearTimeout(timer);rej(new Error(e&&e.type==="popup_closed"?"Sign-in cancelled":(e&&e.type)||"Sign-in failed"));};
      tokenClient.requestAccessToken(Object.assign({prompt:silent?"":"consent"},token&&token.email?{hint:token.email}:{}));
    });
    if(silent){silentInFlight=p.finally(()=>{silentInFlight=null;});return silentInFlight;}
    return p;
  }
  function signOut(){try{if(token&&token.access_token&&window.google&&window.google.accounts)window.google.accounts.oauth2.revoke(token.access_token,()=>{});}catch(e){}saveToken(null);auth.needsSignIn=false;}
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function authFetch(url,opts={},attempt=0){
    if(!isSignedIn()){
      if(!wasSignedIn())throw new Error("Not signed in to Google");
      try{await signIn({silent:true});}catch(e){auth.needsSignIn=true;listeners.forEach(f=>{try{f(false);}catch(x){}});const err=new Error("Google sign-in expired — tap Sign in");err.needsSignIn=true;throw err;}
    }
    let r;
    try{r=await fetch(url,Object.assign({},opts,{headers:Object.assign({},opts.headers||{},{Authorization:"Bearer "+token.access_token})}));}
    catch(e){if(attempt<2){await sleep(600*(attempt+1));return authFetch(url,opts,attempt+1);}throw new Error("Network error");}
    if(r.status===401&&attempt<2){saveToken({exp:0});return authFetch(url,opts,attempt+1);}
    if((r.status===429||r.status>=500||r.status===403)&&attempt<3){let rate=r.status!==403;if(r.status===403){try{const j=await r.clone().json();rate=/rate|quota/i.test((j.error&&j.error.message)||"");}catch(e){}}if(rate){await sleep(800*Math.pow(2,attempt));return authFetch(url,opts,attempt+1);}}
    if(!r.ok){let msg=r.status+" "+r.statusText;try{const j=await r.json();msg=(j.error&&j.error.message)||msg;}catch(e){}const e=new Error(msg);e.status=r.status;throw e;}
    if(r.status===204)return null;
    const ct=r.headers.get("content-type")||"";return ct.includes("json")?r.json():r.arrayBuffer();
  }
  const userInfo=()=>authFetch("https://www.googleapis.com/oauth2/v3/userinfo");
  /* ---- Drive ---- */
  const DRIVE="https://www.googleapis.com/drive/v3",UPLOAD="https://www.googleapis.com/upload/drive/v3",FOLDER="application/vnd.google-apps.folder";
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  const remember=(k,id)=>{ids[k]=id;try{localStorage.setItem(IDS_KEY,JSON.stringify(ids));}catch(e){}};
  const forget=pre=>{for(const k of Object.keys(ids))if(k===pre||k.startsWith(pre+"/"))delete ids[k];try{localStorage.setItem(IDS_KEY,JSON.stringify(ids));}catch(e){}};
  async function list(parentId,o={}){const parts=["trashed = false",`'${q(parentId)}' in parents`];if(o.name)parts.push(`name = '${q(o.name)}'`);if(o.folders)parts.push(`mimeType = '${FOLDER}'`);if(o.extra)parts.push(o.extra);
    const j=await authFetch(`${DRIVE}/files?q=${encodeURIComponent(parts.join(" and "))}&fields=files(id,name,mimeType,modifiedTime,size,md5Checksum)&pageSize=200&orderBy=modifiedTime desc`);return j.files||[];}
  async function mkdir(name,parentId){const j=await authFetch(`${DRIVE}/files?fields=id`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,mimeType:FOLDER,parents:[parentId]})});return j.id;}
  async function ensurePath(parts,o={}){const create=o.create!==false;
    const run=async()=>{let parent="root",key="";for(const name of parts){key=key?key+"/"+name:name;let id=ids[key];if(!id){const found=(await list(parent,{name,folders:true}))[0];if(found)id=found.id;else if(create)id=await mkdir(name,parent);else return null;remember(key,id);}parent=id;}return parent;};
    try{return await run();}catch(e){if(/404|not found/i.test(e.message)){forget(parts[0]);return run();}throw e;}}
  const download=id=>authFetch(`${DRIVE}/files/${id}?alt=media`);
  async function readJsonIn(folderId,name){const f=(await list(folderId,{name}))[0];if(!f)return null;const buf=await download(f.id);try{return {data:JSON.parse(new TextDecoder().decode(buf)),modifiedTime:f.modifiedTime,id:f.id,md5:f.md5Checksum};}catch(e){return null;}}
  async function writeJsonIn(folderId,name,obj,fileId){if(!fileId)fileId=((await list(folderId,{name}))[0]||{}).id||null;
    const boundary="galen"+Date.now();const meta=fileId?{name}:{name,parents:[folderId]};
    const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(obj)}\r\n--${boundary}--`;
    const url=fileId?`${UPLOAD}/files/${fileId}?uploadType=multipart&fields=id,modifiedTime,md5Checksum`:`${UPLOAD}/files?uploadType=multipart&fields=id,modifiedTime,md5Checksum`;
    return authFetch(url,{method:fileId?"PATCH":"POST",headers:{"Content-Type":`multipart/related; boundary=${boundary}`},body});}
  async function readJson(parts,name){const id=await ensurePath(parts,{create:false});return id?readJsonIn(id,name):null;}
  async function writeJson(parts,name,obj){const id=await ensurePath(parts);return writeJsonIn(id,name,obj);}
  async function uploadBlob(parts,name,blob,fileId){const folderId=await ensurePath(parts);if(!fileId)fileId=((await list(folderId,{name}))[0]||{}).id||null;
    const meta=fileId?{name}:{name,parents:[folderId]};const fd=new FormData();fd.append("metadata",new Blob([JSON.stringify(meta)],{type:"application/json"}));fd.append("file",blob,name);
    const url=fileId?`${UPLOAD}/files/${fileId}?uploadType=multipart&fields=id,name,size,modifiedTime`:`${UPLOAD}/files?uploadType=multipart&fields=id,name,size,modifiedTime`;
    return authFetch(url,{method:fileId?"PATCH":"POST",body:fd});}
  async function listIn(parts,o){const id=await ensurePath(parts,{create:false});return id?list(id,o):[];}
  async function downloadBlobUrl(fileId){const buf=await download(fileId);return URL.createObjectURL(new Blob([buf]));}
  async function trash(fileId){await authFetch(`${DRIVE}/files/${fileId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({trashed:true})});}
  /* ---- Calendar (read-only: Citrus writes the blocks) ---- */
  async function listEvents(calendarId,from,to,extra){const p=new URLSearchParams({timeMin:from.toISOString(),timeMax:to.toISOString(),singleEvents:"true",orderBy:"startTime",maxResults:"250"});if(extra)p.set("privateExtendedProperty",extra);
    const j=await authFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${p}`);
    return (j.items||[]).filter(e=>e.status!=="cancelled").map(e=>({id:e.id,title:e.summary||"",start:new Date(e.start.dateTime||e.start.date+"T00:00:00"),end:new Date(e.end.dateTime||e.end.date+"T00:00:00"),allDay:!!e.start.date,description:e.description||"",citrus:(e.extendedProperties&&e.extendedProperties.private&&e.extendedProperties.private.citrus)||""}));}
  return {DEFAULT_CLIENT_ID,cfg,setConfig,auth,canUse,isSignedIn,wasSignedIn,email:()=>(token&&token.email)||"",onAuthChange:f=>{listeners.add(f);return ()=>listeners.delete(f);},signIn,signOut,userInfo,
    ensurePath,readJson,writeJson,readJsonIn,writeJsonIn,uploadBlob,listIn,download,downloadBlobUrl,trash,listEvents,root:()=>cfg.root||"My Apps"};
})();
