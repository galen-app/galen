"use strict";
/* ================= GOOGLE (sign-in, Drive, Calendar) =================
 Same approach as Citrus Maxima and Orange: Google Identity Services token client in the browser, no backend, no secret.
 The access token lives on this device only (localStorage) and lasts an hour; a quiet renewal runs while the Google session is alive.
 Transport rules (7.1):
 - every request has a time limit, and errors say whether they are worth retrying (err.transient);
 - Drive files carry appProperties (rev, h, v, n) so a writer can tell whether the file changed since it last looked;
 - an unreadable file is reported as unreadable, never as "no file" (that used to let a push overwrite it);
 - two devices creating the same folder at once converge on the oldest one. */
const G=(()=>{
  const DEFAULT_CLIENT_ID="753489712404-ra7ahu34gjl305b4ss1765idmqg7am5s.apps.googleusercontent.com"; // the shared "Citrus web" client
  const SCOPES=["https://www.googleapis.com/auth/drive","https://www.googleapis.com/auth/calendar.readonly","https://www.googleapis.com/auth/userinfo.email"].join(" ");
  const TOKEN_KEY="galen.google",IDS_KEY="galen.drive.ids",CFG_KEY="galen.google.cfg",LAST_KEY="galen.google.last";
  let token=null,tokenClient=null,silentInFlight=null,ids={},cfg={clientId:DEFAULT_CLIENT_ID,root:"My Apps"};
  const readLS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v&&typeof v==="object"?v:d;}catch(e){return d;}};
  token=readLS(TOKEN_KEY,null);ids=readLS(IDS_KEY,{});
  {const c=readLS(CFG_KEY,{});if(typeof c.clientId==="string"&&c.clientId)cfg.clientId=c.clientId;if(typeof c.root==="string"&&c.root.trim())cfg.root=c.root.trim();}
  const listeners=new Set();const auth={needsSignIn:false,lastError:"",switched:null};
  const tell=v=>listeners.forEach(f=>{try{f(v);}catch(e){}});
  const saveToken=t=>{token=t?Object.assign({},token||{},t):null;try{token?localStorage.setItem(TOKEN_KEY,JSON.stringify(token)):localStorage.removeItem(TOKEN_KEY);}catch(e){}tell(isSignedIn());};
  const isSignedIn=()=>!!(token&&token.access_token&&token.exp>Date.now());
  const wasSignedIn=()=>!!(token&&token.email);
  const canUse=()=>window.GALEN_PLATFORM!=="artifact";
  const lastEmail=()=>{try{return localStorage.getItem(LAST_KEY)||"";}catch(e){return "";}};
  function setConfig(o){Object.assign(cfg,o);try{localStorage.setItem(CFG_KEY,JSON.stringify(cfg));}catch(e){}tokenClient=null;if(o&&o.root)forgetAll();}
  function loadGis(){
    if(window.google&&window.google.accounts&&window.google.accounts.oauth2)return Promise.resolve();
    return new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.async=true;s.defer=true;s.onload=()=>res();s.onerror=()=>rej(new Error("Google sign-in did not load. Are you offline?"));document.head.append(s);});
  }
  async function init(){if(!canUse())throw new Error("Google works in the installed Galen app, not in this preview");await loadGis();tokenClient=window.google.accounts.oauth2.initTokenClient({client_id:cfg.clientId||DEFAULT_CLIENT_ID,scope:SCOPES,prompt:"",callback:()=>{}});}
  function signIn(opt={}){
    const silent=!!opt.silent;if(silent&&silentInFlight)return silentInFlight;
    const p=new Promise(async(res,rej)=>{
      try{if(!tokenClient)await init();}catch(e){return rej(e);}
      const timer=setTimeout(()=>rej(new Error(silent?"silent_timeout":"Sign-in timed out")),silent?15000:120000);
      tokenClient.callback=async(resp)=>{clearTimeout(timer);
        if(resp.error){auth.lastError=resp.error_description||resp.error;return rej(new Error(auth.lastError));}
        const before=token&&token.email;
        saveToken({access_token:resp.access_token,exp:Date.now()+(resp.expires_in-60)*1000});auth.needsSignIn=false;auth.lastError="";
        /* an interactive sign-in may pick another account: always ask who this is */
        if(!silent||!token.email){try{const u=await userInfo();saveToken({email:String(u.email||"")});}catch(e){if(!token.email&&before)saveToken({email:before});}}
        const prev=lastEmail(),now=token.email||"";
        if(now&&prev&&prev.toLowerCase()!==now.toLowerCase()){auth.switched={from:prev,to:now};forgetAll();}
        if(now){try{localStorage.setItem(LAST_KEY,now);}catch(e){}}
        res(token);};
      tokenClient.error_callback=e=>{clearTimeout(timer);rej(new Error(e&&e.type==="popup_closed"?"Sign-in cancelled":(e&&e.type)||"Sign-in failed"));};
      tokenClient.requestAccessToken(Object.assign({prompt:silent?"":"consent"},token&&token.email?{hint:token.email}:{}));
    });
    if(silent){silentInFlight=p.finally(()=>{silentInFlight=null;});return silentInFlight;}
    return p;
  }
  /* sign-out keeps this device's progress, but folder ids belong to that account, so they go */
  function signOut(){try{if(token&&token.access_token&&window.google&&window.google.accounts)window.google.accounts.oauth2.revoke(token.access_token,()=>{});}catch(e){}saveToken(null);auth.needsSignIn=false;forgetAll();}
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const fail=(msg,o={})=>Object.assign(new Error(msg),o);
  async function authFetch(url,opts={},attempt=0){
    if(!isSignedIn()){
      if(!wasSignedIn())throw fail("Not signed in to Google",{needsSignIn:true});
      try{await signIn({silent:true});}catch(e){auth.needsSignIn=true;tell(false);throw fail("Google sign-in expired: tap Sign in",{needsSignIn:true});}
    }
    const ms=opts.timeout||(opts.method&&opts.method!=="GET"?60000:30000);
    const ac=typeof AbortController!=="undefined"?new AbortController():null;const tm=ac?setTimeout(()=>ac.abort(),ms):0;
    let r;
    try{r=await fetch(url,Object.assign({cache:"no-store"},opts,ac?{signal:ac.signal}:{},{headers:Object.assign({},opts.headers||{},{Authorization:"Bearer "+token.access_token})}));}
    catch(e){clearTimeout(tm);if(attempt<2){await sleep(600*(attempt+1));return authFetch(url,opts,attempt+1);}throw fail(navigator.onLine===false?"Offline":"Drive could not be reached",{transient:true});}
    clearTimeout(tm);
    if(r.status===401&&attempt<2){saveToken({exp:0});return authFetch(url,opts,attempt+1);}
    if((r.status===429||r.status>=500||r.status===403)&&attempt<3){let rate=r.status!==403;if(r.status===403){try{const j=await r.clone().json();rate=/rate|quota/i.test((j.error&&j.error.message)||"");}catch(e){}}if(rate){await sleep(800*Math.pow(2,attempt));return authFetch(url,opts,attempt+1);}}
    if(!r.ok){let msg=r.status+" "+r.statusText;try{const j=await r.json();msg=(j.error&&j.error.message)||msg;}catch(e){}throw fail(msg,{status:r.status,transient:r.status===429||r.status>=500});}
    if(r.status===204)return null;
    const ct=r.headers.get("content-type")||"";return ct.includes("json")&&!opts.raw?r.json():r.arrayBuffer();
  }
  const userInfo=()=>authFetch("https://www.googleapis.com/oauth2/v3/userinfo");
  /* ---- Drive ---- */
  const DRIVE="https://www.googleapis.com/drive/v3",UPLOAD="https://www.googleapis.com/upload/drive/v3",FOLDER="application/vnd.google-apps.folder";
  const FIELDS="id,name,mimeType,createdTime,modifiedTime,size,md5Checksum,version,appProperties";
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  const keepIds=()=>{try{localStorage.setItem(IDS_KEY,JSON.stringify(ids));}catch(e){}};
  const remember=(k,id)=>{ids[k]=id;keepIds();};
  const forget=pre=>{for(const k of Object.keys(ids))if(k===pre||k.startsWith(pre+"/"))delete ids[k];keepIds();};
  function forgetAll(){ids={};keepIds();for(const k of Object.keys(tagSeen))delete tagSeen[k];}
  async function list(parentId,o={}){const parts=["trashed = false",`'${q(parentId)}' in parents`];if(o.name)parts.push(`name = '${q(o.name)}'`);if(o.folders)parts.push(`mimeType = '${FOLDER}'`);if(o.extra)parts.push(o.extra);
    const order=o.order||"modifiedTime desc";
    const j=await authFetch(`${DRIVE}/files?q=${encodeURIComponent(parts.join(" and "))}&fields=${encodeURIComponent("files("+FIELDS+")")}&pageSize=${o.pageSize||200}&orderBy=${encodeURIComponent(order)}`);return (j&&j.files)||[];}
  /* metadata of one file, read fresh (the revision check) */
  const meta=id=>authFetch(`${DRIVE}/files/${encodeURIComponent(id)}?fields=${encodeURIComponent(FIELDS+",trashed")}`);
  async function mkdir(name,parentId){const j=await authFetch(`${DRIVE}/files?fields=id`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,mimeType:FOLDER,parents:[parentId]})});return j.id;}
  const oldest=fs=>fs.slice().sort((a,b)=>String(a.createdTime||a.modifiedTime||"").localeCompare(String(b.createdTime||b.modifiedTime||""))||String(a.id).localeCompare(String(b.id)))[0];
  /* parts are folder names under My Drive, or under o.from={id,key} (a folder found by its tag) */
  async function ensurePath(parts,o={}){const create=o.create!==false;
    const run=async()=>{let parent=o.from?o.from.id:"root",key=o.from?o.from.key:"";for(const name of parts){key=key?key+"/"+name:name;let id=ids[key];
        if(!id){const found=await list(parent,{name,folders:true,order:"createdTime"});
          if(found.length)id=oldest(found).id;
          else if(create){const mine=await mkdir(name,parent);
            /* another device may have made the same folder a moment ago: both settle on the oldest, and the spare (empty) one goes */
            const again=await list(parent,{name,folders:true,order:"createdTime"}).catch(()=>[]);const pick=again.length?oldest(again):{id:mine};id=pick.id;
            if(pick.id!==mine)trash(mine).catch(()=>{});}
          else return null;remember(key,id);}
        parent=id;}return parent;};
    try{return await run();}catch(e){if(e.status===404||/not found/i.test(e.message)){if(o.from){forget(o.from.key);throw e;}forget(parts[0]);return run();}throw e;}}
  /* ---- Drive layout (Citrus, claude/drive-layout.md, 17/11/2026) ----
     Every app folder carries appProperties.citrusApp=<tag>; Citrus moves and renames folders, apps only follow the tag.
     Found by tag first (the oldest if several), checked once per app session; if nothing is tagged yet, the old path.
     Galen's own folders (o.own) are made there if missing and tagged at once; another app's folder is only read.
     Never made by path once a tagged folder exists anywhere: that is how twins appear after a move. */
  const tagSeen={},tagBusy={};
  const tagQuery=tag=>`mimeType = '${FOLDER}' and trashed = false and appProperties has { key='citrusApp' and value='${q(tag)}' }`;
  async function findTagged(tag){
    const j=await authFetch(`${DRIVE}/files?spaces=drive&q=${encodeURIComponent(tagQuery(tag))}&fields=${encodeURIComponent("files(id,name,parents,createdTime,appProperties)")}&pageSize=50&orderBy=createdTime`);
    const fs=((j&&j.files)||[]).filter(f=>f&&f.id);return fs.length?oldest(fs):null;}
  const tagFolder=(id,tag)=>authFetch(`${DRIVE}/files/${encodeURIComponent(id)}?fields=id`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({appProperties:{citrusApp:tag}})});
  async function folderByTag(tag,legacy,o={}){
    if(tagSeen[tag])return tagSeen[tag];
    if(tagBusy[tag])return tagBusy[tag];
    const own=!!o.own,create=own&&o.create!==false,key="tag:"+tag;
    const run=async()=>{
      const hit=await findTagged(tag);
      if(hit){if(ids[key]!==hit.id){forget(key);remember(key,hit.id);}tagSeen[tag]=hit.id;return hit.id;}
      /* nothing tagged yet: the old place (made there only for our own folders) */
      const id=await ensurePath(legacy,{create});if(!id)return null;
      if(own){await tagFolder(id,tag);
        /* another device may have tagged a different folder a moment ago: settle on the oldest tagged one */
        const again=await findTagged(tag).catch(()=>null);const pick=again?again.id:id;
        forget(key);remember(key,pick);tagSeen[tag]=pick;return pick;}
      return id;};/* another app's untagged folder: not cached, so its tag is picked up as soon as Citrus sets it */
    tagBusy[tag]=run().finally(()=>{delete tagBusy[tag];});return tagBusy[tag];}
  /* a folder (or a chain of folders) inside a tagged folder */
  async function inTagged(tag,legacy,names,o={}){
    const own=!!o.own,create=own&&o.create!==false;
    const base=await folderByTag(tag,legacy,{own,create});if(!base)return null;if(!names.length)return base;
    try{return await ensurePath(names,{create,from:{id:base,key:"tag:"+tag}});}
    catch(e){if(e.status===404||/not found/i.test(e.message)){forgetTag(tag);const b2=await folderByTag(tag,legacy,{own,create});return b2?ensurePath(names,{create,from:{id:b2,key:"tag:"+tag}}):null;}throw e;}}
  function forgetTag(tag){delete tagSeen[tag];forget("tag:"+tag);}
  const download=id=>authFetch(`${DRIVE}/files/${encodeURIComponent(id)}?alt=media`,{raw:true});
  const decode=buf=>new TextDecoder().decode(buf instanceof ArrayBuffer?buf:new Uint8Array(buf||[]));
  /* JSON.parse that cannot change prototypes */
  const parse=txt=>JSON.parse(txt,(k,v)=>k==="__proto__"||k==="constructor"||k==="prototype"?undefined:v);
  /* read one file: {data, raw, id, md5, ...meta}; data is null and unreadable is true when the bytes are not JSON */
  async function readFile(f){let raw="";try{raw=decode(await download(f.id));}catch(e){if(e.status===404)return null;throw e;}
    let data=null,unreadable=false;try{data=parse(raw);if(!data||typeof data!=="object")throw new Error("not an object");}catch(e){data=null;unreadable=true;}
    return Object.assign({},f,{data,raw,unreadable,md5:f.md5Checksum,app:f.appProperties||{}});}
  async function readJsonIn(folderId,name){const f=(await list(folderId,{name}))[0];if(!f)return null;return readFile(f);}
  async function writeJsonIn(folderId,name,obj,fileId,appProperties){if(fileId===undefined)fileId=((await list(folderId,{name}))[0]||{}).id||null;
    const boundary="galen"+Date.now()+Math.random().toString(36).slice(2,8);const m=fileId?{name}:{name,parents:[folderId]};if(appProperties)m.appProperties=appProperties;
    const text=typeof obj==="string"?obj:JSON.stringify(obj);
    const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(m)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${text}\r\n--${boundary}--`;
    const f=encodeURIComponent(FIELDS);
    const url=fileId?`${UPLOAD}/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=${f}`:`${UPLOAD}/files?uploadType=multipart&fields=${f}`;
    return authFetch(url,{method:fileId?"PATCH":"POST",headers:{"Content-Type":`multipart/related; boundary=${boundary}`},body});}
  async function readJson(parts,name){const id=await ensurePath(parts,{create:false});return id?readJsonIn(id,name):null;}
  async function writeJson(parts,name,obj,appProperties){const id=await ensurePath(parts);return writeJsonIn(id,name,obj,undefined,appProperties);}
  async function uploadBlob(parts,name,blob,fileId){const folderId=typeof parts==="string"?parts:await ensurePath(parts);if(!fileId)fileId=((await list(folderId,{name}))[0]||{}).id||null;
    const m=fileId?{name}:{name,parents:[folderId]};const fd=new FormData();fd.append("metadata",new Blob([JSON.stringify(m)],{type:"application/json"}));fd.append("file",blob,name);
    const url=fileId?`${UPLOAD}/files/${fileId}?uploadType=multipart&fields=id,name,size,modifiedTime`:`${UPLOAD}/files?uploadType=multipart&fields=id,name,size,modifiedTime`;
    return authFetch(url,{method:fileId?"PATCH":"POST",body:fd,timeout:180000});}
  async function listIn(parts,o){const id=await ensurePath(parts,{create:false});return id?list(id,o):[];}
  async function downloadBlobUrl(fileId){const buf=await download(fileId);return URL.createObjectURL(new Blob([buf]));}
  async function trash(fileId){await authFetch(`${DRIVE}/files/${encodeURIComponent(fileId)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({trashed:true})});}
  /* a server-side copy (used to keep an unreadable file aside before anything else happens) */
  const copy=(fileId,name,parentId)=>authFetch(`${DRIVE}/files/${encodeURIComponent(fileId)}/copy?fields=${encodeURIComponent(FIELDS)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.assign({name},parentId?{parents:[parentId]}:{}))});
  /* ---- Calendar (read-only: Citrus writes the blocks) ---- */
  async function listEvents(calendarId,from,to,extra){const p=new URLSearchParams({timeMin:from.toISOString(),timeMax:to.toISOString(),singleEvents:"true",orderBy:"startTime",maxResults:"250"});if(extra)p.set("privateExtendedProperty",extra);
    const j=await authFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${p}`);
    return (j.items||[]).filter(e=>e.status!=="cancelled").map(e=>({id:e.id,title:e.summary||"",start:new Date(e.start.dateTime||e.start.date+"T00:00:00"),end:new Date(e.end.dateTime||e.end.date+"T00:00:00"),allDay:!!e.start.date,description:e.description||"",citrus:(e.extendedProperties&&e.extendedProperties.private&&e.extendedProperties.private.citrus)||""}));}
  return {DEFAULT_CLIENT_ID,cfg,setConfig,auth,canUse,isSignedIn,wasSignedIn,email:()=>(token&&token.email)||"",lastEmail,onAuthChange:f=>{listeners.add(f);return ()=>listeners.delete(f);},signIn,signOut,userInfo,
    ensurePath,folderByTag,inTagged,forgetTag,list,meta,readFile,readJson,writeJson,readJsonIn,writeJsonIn,uploadBlob,listIn,download,downloadBlobUrl,trash,copy,parse,listEvents,root:()=>cfg.root||"My Apps"};
})();
