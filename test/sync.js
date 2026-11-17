/* Drive sync attack scenarios (D11, Galen 7.1). Serve docs/ first, then: node test/sync.js [baseUrl]
   A fake Drive that behaves like Drive v3 where it matters here: appProperties, md5Checksum, createdTime, version,
   metadata reads, files.copy, trash; plus hooks to make "another device" write in the middle of an upload. */
const {chromium}=require('playwright');const crypto=require('crypto');
const BASE=process.argv[2]||'http://localhost:8765/';
const FOLDER='application/vnd.google-apps.folder';
let drive,HOOK={},FAIL={},EMAIL='amro@example.com',clock=0;
const reset=()=>{drive={files:{},next:1,stateWrites:0};HOOK={};FAIL={};EMAIL='amro@example.com';};reset();
const md5=s=>crypto.createHash('md5').update(s||'').digest('hex');
const iso=()=>new Date(Date.now()+(++clock)).toISOString();
const mk=(name,parent,mime,content,props)=>{const id='f'+(drive.next++);const t=iso();drive.files[id]={id,name,parents:[parent],mimeType:mime,content:content||'',createdTime:t,modifiedTime:t,trashed:false,version:1,appProperties:props||{}};return drive.files[id];};
const view=f=>({id:f.id,name:f.name,parents:f.parents,mimeType:f.mimeType,createdTime:f.createdTime,modifiedTime:f.modifiedTime,size:String(f.content.length),md5Checksum:f.mimeType===FOLDER?undefined:md5(f.content),version:String(f.version),appProperties:f.appProperties,trashed:f.trashed});
const setContent=(f,c,props)=>{f.content=c;f.modifiedTime=iso();f.version++;if(props)f.appProperties=Object.assign({},f.appProperties,props);};
async function handle(route){
  const req=route.request();const url=new URL(req.url());const m=req.method();
  if(url.hostname==='accounts.google.com')return route.fulfill({contentType:'application/javascript',body:`window.google={accounts:{oauth2:{initTokenClient(o){return {callback:null,error_callback:null,requestAccessToken(p){setTimeout(()=>this.callback({access_token:"tok",expires_in:3600}),20);}};},revoke(t,cb){cb&&cb();}}}};`});
  if(url.pathname==='/oauth2/v3/userinfo')return route.fulfill({json:{email:EMAIL}});
  if(FAIL.all)return route.fulfill({status:503,json:{error:{message:'backend'}}});
  if(url.pathname==='/drive/v3/files'&&m==='GET'){const q=url.searchParams.get('q')||'';const parent=(q.match(/'([^']+)' in parents/)||[])[1];const name=(q.match(/name = '([^']+)'/)||[])[1];const fo=q.includes("mimeType = '"+FOLDER+"'");
    if(process.env.TRACE)console.log('LIST',name,HOOK.armed,!!HOOK.list);if(HOOK.list)await HOOK.list(name);
    const tagM=q.match(/appProperties has \{ key='citrusApp' and value='([^']+)' \}/);if(tagM)drive.tagQueries=(drive.tagQueries||0)+1;
    const order=url.searchParams.get('orderBy')||'';const files=Object.values(drive.files).filter(f=>!f.trashed&&(tagM?f.mimeType===FOLDER&&(f.appProperties||{}).citrusApp===tagM[1]:f.parents[0]===parent&&(!name||f.name===name)&&(!fo||f.mimeType===FOLDER)))
      .sort((a,b)=>order.startsWith('createdTime')?a.createdTime.localeCompare(b.createdTime):b.modifiedTime.localeCompare(a.modifiedTime)).map(view);
    return route.fulfill({json:{files}});}
  if(url.pathname==='/drive/v3/files'&&m==='POST'){const b=JSON.parse(req.postData());const f=mk(b.name,b.parents[0],b.mimeType,'');return route.fulfill({json:{id:f.id}});}
  let mm=url.pathname.match(/^\/drive\/v3\/files\/([^/]+)\/copy$/);
  if(mm&&m==='POST'){const src=drive.files[mm[1]];const b=JSON.parse(req.postData()||'{}');const f=mk(b.name||('Copy of '+src.name),(b.parents||src.parents)[0],src.mimeType,src.content,Object.assign({},src.appProperties));return route.fulfill({json:view(f)});}
  mm=url.pathname.match(/^\/drive\/v3\/files\/([^/]+)$/);
  if(mm&&m==='GET'){const f=drive.files[mm[1]];if(!f)return route.fulfill({status:404,json:{error:{message:'File not found'}}});
    if(url.searchParams.get('alt')==='media')return route.fulfill({contentType:'application/json',body:f.content});
    if(HOOK.meta){const h=HOOK.meta;HOOK.meta=null;await h(f);}return route.fulfill({json:view(f)});}
  if(mm&&m==='PATCH'){const f=drive.files[mm[1]];if(!f)return route.fulfill({status:404,json:{error:{message:'File not found'}}});const b=JSON.parse(req.postData()||'{}');
    /* like Drive: appProperties merge key by key */
    if(b.appProperties){f.appProperties=Object.assign({},f.appProperties,b.appProperties);delete b.appProperties;}Object.assign(f,b);return route.fulfill({json:view(f)});}
  if(url.pathname.startsWith('/upload/drive/v3/files')){drive.inflight=(drive.inflight||0)+1;drive.maxInflight=Math.max(drive.maxInflight||0,drive.inflight);if(FAIL.slowUpload)await new Promise(r=>setTimeout(r,FAIL.slowUpload));drive.inflight--;const body=req.postData()||'';const bnd=(req.headers()['content-type'].match(/boundary=(\S+)/)||[])[1];
    const parts=body.split('--'+bnd).filter(p=>p.includes('Content-Type'));const meta=JSON.parse(parts[0].split('\r\n\r\n')[1].trim());const content=parts[1].split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/,'');
    let f;if(m==='PATCH'){const id=url.pathname.split('/')[5];f=drive.files[id];if(!f)return route.fulfill({status:404,json:{error:{message:'File not found'}}});setContent(f,content,meta.appProperties);}
    else f=mk(meta.name,meta.parents[0],'application/json',content,meta.appProperties);
    if(f.name==='state.json')drive.stateWrites++;
    const out=view(f);if(HOOK.afterUpload&&f.name==='state.json'){const h=HOOK.afterUpload;HOOK.afterUpload=null;await h(f);}
    return route.fulfill({json:out});}
  if(url.hostname.includes('googleapis'))return route.fulfill({status:404,json:{error:{message:'unhandled '+url.pathname}}});
  return route.continue();
}
const live=()=>Object.values(drive.files).filter(f=>!f.trashed);
const stateFiles=()=>live().filter(f=>f.name==='state.json');
const remote=()=>{const f=stateFiles()[0];try{return f?JSON.parse(f.content):null;}catch(e){return 'UNREADABLE';}};
const folderId=name=>(live().filter(f=>f.name===name&&f.mimeType===FOLDER).sort((a,b)=>a.createdTime.localeCompare(b.createdTime))[0]||{}).id;
let fails=0;const ok=(name,cond,extra)=>{if(!cond)fails++;console.log((cond?'PASS ':'FAIL ')+name+(extra!==undefined?'  '+JSON.stringify(extra).slice(0,300):''));};
(async()=>{const b=await chromium.launch();const ctxs=[];
  const dev=async(name,ctx)=>{if(!ctx){ctx=await b.newContext({viewport:{width:400,height:860},serviceWorkers:'block'});await ctx.route(/googleapis\.com|accounts\.google\.com/,handle);ctxs.push(ctx);}
    const pg=await ctx.newPage();pg.errs=[];pg.on('pageerror',e=>pg.errs.push(name+': '+e.message.slice(0,140)));await pg.goto(BASE+'#tools/google');await pg.waitForTimeout(600);pg.ctx=ctx;return pg;};
  const idle=async pg=>{await pg.waitForTimeout(300);await pg.waitForFunction(()=>!Store._saving&&Store.status!=='Saving…'&&Store.status!=='Syncing…',null,{timeout:20000,polling:150}).catch(()=>{});await pg.waitForTimeout(250);};
  const signin=async pg=>{await pg.evaluate(()=>open('tools','google'));await pg.waitForTimeout(150);await pg.click('#g-in');await pg.waitForTimeout(1200);await idle(pg);};
  const sync=async pg=>{await pg.evaluate(()=>Hub.daily('force'));await idle(pg);};
  const grade=(pg,ids,fresh)=>pg.evaluate(([ids,fresh])=>{ids.forEach(i=>schedule(i,2));if(fresh)Store.lastSync=Date.now();Store.save(true);},[ids,fresh]);
  const cards=r=>r&&r.srs?Object.keys(r.srs).sort():[];
  const closeAll=async()=>{for(const c of ctxs.splice(0))await c.close();};
  const errsOf=(...ps)=>ps.flatMap(p=>p.errs);

  console.log('--- 1 blind push: B saves on a stale copy (its last sync < 20 s, so Store.push skips the pull)');
  {reset();const A=await dev('A');await signin(A);const B=await dev('B');await signin(B);
   await grade(A,['t:jvp']);await idle(A);await sync(B);
   await grade(A,['t:a2']);await idle(A);await grade(B,['v:s3'],true);await idle(B);
   ok('Drive keeps both devices\' work',['t:a2','t:jvp','v:s3'].every(c=>cards(remote()).includes(c)),cards(remote()));
   ok('B received A\'s card through the revision check',await B.evaluate(()=>!!Store.s.srs['t:a2']));
   ok('appProperties rev/h/v/n written',(()=>{const p=stateFiles()[0].appProperties;return +p.rev>=1&&/^[0-9a-f]{24}$/.test(p.h)&&p.v==='3'&&+p.n>0;})(),stateFiles()[0].appProperties);
   ok('no page errors',!errsOf(A,B).length,errsOf(A,B));await closeAll();}

  console.log('--- 2 two tabs of one browser: single writer hand-over, and Drive saves never overlap (Web Lock)');
  {reset();const A=await dev('A');await signin(A);await grade(A,['t:tab1']);await idle(A);const A2=await dev('A2',A.ctx);await A2.waitForTimeout(1000);
   ok('second tab starts read-only',await A2.evaluate(()=>Store.passive===true));
   await A2.click('#st-here');await A2.waitForTimeout(1200);
   ok('after "Use Galen here" the second tab writes',await A2.evaluate(()=>Store.passive===false));
   await A2.evaluate(()=>Store.connect());await idle(A2);await grade(A2,['t:tab2']);await idle(A2);await sync(A2);
   ok('Drive has the card saved before the hand-over and the one after',['t:tab1','t:tab2'].every(c=>cards(remote()).includes(c)),cards(remote()));
   FAIL.slowUpload=150;drive.inflight=0;drive.maxInflight=0;
   await Promise.all([A.evaluate(()=>Hub.provider.save().then(()=>1,e=>e.message)),A2.evaluate(()=>Promise.all([Hub.provider.save(),Hub.provider.save()]).then(()=>1,e=>e.message))]);FAIL.slowUpload=0;
   ok('at most one Drive write at a time across both tabs',drive.maxInflight===1,drive.maxInflight);
   ok('one state.json, nothing lost',stateFiles().length===1&&['t:tab1','t:tab2'].every(c=>cards(remote()).includes(c)),cards(remote()));await closeAll();}

  console.log('--- 3 another device writes just before our upload, and just after it');
  {reset();const A=await dev('A');await signin(A);await grade(A,['t:base']);await idle(A);
   HOOK.list=async name=>{if(name!=='state.json'||!HOOK.armed||--HOOK.armed>0)return;HOOK.list=null;const f=stateFiles()[0];const r=JSON.parse(f.content);r.srs['x:before']={iv:1,n:1,last:Date.now(),due:Date.now()};setContent(f,JSON.stringify(r),{h:'other',rev:String(+f.appProperties.rev+1)});};
   HOOK.armed=2;await grade(A,['t:mine1'],true);await idle(A);
   ok('change made before our upload is merged, not overwritten',['x:before','t:mine1','t:base'].every(c=>cards(remote()).includes(c)),cards(remote()));
   HOOK.afterUpload=async f=>{const r=JSON.parse(f.content);r.srs['x:after']={iv:1,n:1,last:Date.now(),due:Date.now()};setContent(f,JSON.stringify(r),{h:'other2',rev:String(+f.appProperties.rev+1)});};
   await grade(A,['t:mine2'],true);await idle(A);
   ok('change made right after our upload is detected and merged again',['x:after','x:before','t:mine2'].every(c=>cards(remote()).includes(c)),cards(remote()));
   ok('this device now has the other device\'s cards',await A.evaluate(()=>!!Store.s.srs['x:after']&&!!Store.s.srs['x:before']));await closeAll();}

  console.log('--- 4 unreadable Drive file');
  {reset();const A=await dev('A');await signin(A);await grade(A,['t:jvp']);await idle(A);
   const f=stateFiles()[0];const bad='{"v":3,"srs":{"t:x":';setContent(f,bad);const w0=drive.stateWrites;
   await sync(A);await grade(A,['v:s3']);await idle(A);await A.waitForTimeout(1600);await idle(A);
   ok('the unreadable file is never overwritten',f.content===bad&&drive.stateWrites===w0,{writes:drive.stateWrites-w0});
   const aside=live().filter(x=>/^state\.unreadable-\d{4}-\d{2}-\d{2}-\d{4}\.json$/.test(x.name));
   ok('a copy is kept aside, once',aside.length===1&&aside[0].content===bad,aside.map(x=>x.name));
   const st=await A.evaluate(()=>[Store.status,!!document.querySelector('[data-n="sync"]'),(document.querySelector('[data-n="sync"]')||{}).textContent||'']);
   ok('status and notice say so',/unreadable/i.test(st[0])&&st[1],st);
   await A.click('[data-n="sync"] .btn');await A.waitForTimeout(800);await idle(A);
   ok('"Use this device" then replaces it with valid progress',(()=>{const r=remote();return r!=='UNREADABLE'&&cards(r).includes('v:s3');})(),cards(remote()));
   ok('no page errors',!A.errs.length,A.errs);await closeAll();}

  console.log('--- 5 newer schema on Drive, older build here');
  {reset();const A=await dev('A');await signin(A);await grade(A,['t:jvp']);await idle(A);
   const f=stateFiles()[0];const r=JSON.parse(f.content);r.v=4;r.newFeature={keep:true};const txt=JSON.stringify(r);setContent(f,txt,{v:'4'});
   await sync(A);await grade(A,['v:s3']);await idle(A);await A.waitForTimeout(1600);await idle(A);
   ok('the newer file is untouched',f.content===txt,{v:remote().v});
   const st=await A.evaluate(()=>[Store.status,(document.querySelector('[data-n="sync"]')||{}).textContent||'']);
   ok('asks to update Galen',/update/i.test(st[0])&&/newer Galen/.test(st[1]),st);await closeAll();}

  console.log('--- 6 safety stop: this device holds far fewer records than Drive');
  {reset();const A=await dev('A');await signin(A);const ids=[...Array(60)].map((_,i)=>'t:bulk'+i);await grade(A,ids);await idle(A);
   await A.evaluate(()=>{const keep=Store.s.settings;Store.s=blankState();Store.s.settings=keep;Store._lastRaw=null;localStorage.setItem(LS,JSON.stringify(Store.s));Store._lastRaw=localStorage.getItem(LS);schedule('t:lonely',2);Store.lastSync=Date.now();Store.save(true);});await idle(A);
   ok('Drive still holds all 60 cards',cards(remote()).length>=60,cards(remote()).length);
   const st=await A.evaluate(()=>[Store.status,(document.querySelector('[data-n="sync"]')||{}).textContent||'']);ok('sync paused with a clear notice',/paused/i.test(st[0])&&/Drive has/.test(st[1]),st);
   await A.click('[data-n="sync"] .btn');await A.waitForTimeout(800);await idle(A);
   ok('"Bring Drive\'s in" restores them here and keeps the new card',await A.evaluate(()=>Object.keys(Store.s.srs).length>=61&&!!Store.s.srs['t:lonely']),await A.evaluate(()=>Object.keys(Store.s.srs).length));
   ok('Drive now has the new card too',cards(remote()).includes('t:lonely'));
   console.log('--- 6b a real reset (epoch) goes through, after a safety copy');
   await A.evaluate(()=>{Store.reset();});for(let i=0;i<30&&cards(remote()).length>=5;i++){await A.waitForTimeout(400);await idle(A);}
   ok('Drive reflects the reset',cards(remote()).length<5,cards(remote()).length);
   const bk=folderId('backups');const safety=live().filter(x=>x.parents[0]===bk&&/^galen-safety-/.test(x.name));
   ok('a safety copy of the old Drive state was kept',safety.length>=1&&JSON.parse(safety[0].content).srs['t:bulk1'],safety.map(x=>x.name));await closeAll();}

  console.log('--- 7 daily and weekly backups, pruning, Bring back');
  {reset();const A=await dev('A');await signin(A);await grade(A,['t:jvp']);await idle(A);
   await A.evaluate(()=>Hub.backupDaily(true));const bk=folderId('backups');const today=await A.evaluate(()=>dayKey());
   ok('today\'s daily and this week\'s weekly exist',live().some(x=>x.parents[0]===bk&&x.name===`galen-daily-${today}.json`)&&live().some(x=>x.parents[0]===bk&&/^galen-weekly-/.test(x.name)));
   const old={v:3,srs:{'b:back':{iv:9,n:3,last:1,due:1}},log:[],days:{}};
   for(let i=1;i<=10;i++)mk(`galen-daily-2026-01-${String(i).padStart(2,'0')}.json`,bk,'application/json',JSON.stringify(old),{kind:'daily',n:'1'});
   for(let i=1;i<=6;i++)mk(`galen-weekly-2025-0${i}-01.json`,bk,'application/json',JSON.stringify(old),{kind:'weekly',n:'1'});
   await A.evaluate(()=>Hub.backupDaily(true));
   const names=live().filter(x=>x.parents[0]===bk).map(x=>x.name);
   ok('pruned to 7 daily and 4 weekly',names.filter(n=>/daily/.test(n)).length===7&&names.filter(n=>/weekly/.test(n)).length===4,names.length);
   await A.evaluate(()=>open('tools','backups'));await A.waitForTimeout(800);
   const rows=await A.$$eval('#bk-list [data-bk]',x=>x.length);ok('backups page lists them',rows===11,rows);
   const last=await A.$$('#bk-list [data-bk]');await last[rows-2].click();await last[rows-2].click();await A.waitForTimeout(800);await idle(A);
   ok('Bring back merges the old card, keeps the current one',await A.evaluate(()=>!!Store.s.srs['b:back']&&!!Store.s.srs['t:jvp']));
   ok('and it reaches Drive',cards(remote()).includes('b:back'));
   const shot=process.env.SHOTS;if(shot)await A.screenshot({path:shot+'/backups.png'});
   ok('no page errors',!A.errs.length,A.errs);await closeAll();}

  console.log('--- 8 two state.json files (first sign-in race) are merged and the spare binned');
  {reset();const A=await dev('A');await signin(A);await grade(A,['t:a1']);await idle(A);
   const gal=folderId('Galen');mk('state.json',gal,'application/json',JSON.stringify({v:3,srs:{'t:b1':{iv:1,n:1,last:Date.now(),due:Date.now()}},log:[],days:{}}));
   await grade(A,['t:a2']);await idle(A);await sync(A);
   ok('one state.json left',stateFiles().length===1,stateFiles().length);ok('with both devices\' cards',['t:a1','t:a2','t:b1'].every(c=>cards(remote()).includes(c)),cards(remote()));await closeAll();}

  console.log('--- 9 script injection from Citrus plan.json and from synced state');
  {reset();const A=await dev('A');await signin(A);await A.evaluate(()=>Hub.writeStatus(true));await A.waitForTimeout(500);
   ok('no duplicate hub folders survive',live().filter(f=>f.name==='hub'&&f.mimeType===FOLDER).length===1,live().filter(f=>f.name==='hub').length);
   const hub=folderId('hub');const citrus=mk('citrus',hub,FOLDER,'');const today=await A.evaluate(()=>dayKey());
   const x='<img src=x onerror="window.__x=1">';
   mk('plan.json',citrus.id,'application/json',JSON.stringify({app:'citrus',days:{[today]:{shift:{code:x,label:x,start:x,end:'07:00',overnight:true},blocks:[{app:'galen',title:'Galen '+x,start:x,minutes:x}]}}}));
   const f=stateFiles()[0];const r=JSON.parse(f.content);r.photos={['"><img src=x onerror=window.__x=2>']:{t:Date.now(),subject:'s:jvp'}};r.srs['t:ok']={iv:1,n:1,last:Date.now(),due:Date.now()};r.srs['t:null']=null;r.log=[null,{id:'q',t:1,sign:'s3',conf:50}];r.__proto__x=1;setContent(f,JSON.stringify(r).replace('"__proto__x":1','"__proto__":{"polluted":1}'));
   await sync(A);for(const v of [['today'],['tools','google'],['signs','sign','jvp'],['practice','log']]){await A.evaluate(a=>open(...a),v);await A.waitForTimeout(400);}
   ok('no script ran',await A.evaluate(()=>window.__x===undefined));
   ok('plan fields are plain text',await A.evaluate(()=>{const p=Hub.todayFromPlan();return p&&p.blocks[0].minutes===0&&!/[<>]/.test(JSON.stringify(p));}),await A.evaluate(()=>Hub.todayFromPlan()));
   ok('markup keys, nulls and __proto__ from Drive are dropped',await A.evaluate(()=>!Object.keys(Store.s.photos).some(k=>/[<>"]/.test(k))&&!('t:null' in Store.s.srs)&&!!Store.s.srs['t:ok']&&!Store.s.log.includes(null)&&Store.s.polluted===undefined&&({}).polluted===undefined));
   ok('no page errors',!A.errs.length,A.errs);await closeAll();}

  console.log('--- 10 another Google account on the same device');
  {reset();const A=await dev('A');await signin(A);await grade(A,['t:first']);await idle(A);
   await A.evaluate(()=>open('tools','google'));await A.waitForTimeout(200);await A.click('#g-out');await A.waitForTimeout(200);
   ok('sign-out forgets the folder ids',await A.evaluate(()=>localStorage.getItem('galen.drive.ids'))==='{}');
   EMAIL='someone.else@example.com';const w0=drive.stateWrites;await signin(A);await grade(A,['t:second']);await idle(A);
   const st=await A.evaluate(()=>[Store.status,(document.querySelector('[data-n="sync"]')||{}).textContent||'']);
   ok('sync pauses and asks',/new account/i.test(st[0])&&/someone\.else/.test(st[1]),st);ok('nothing written meanwhile',drive.stateWrites===w0,drive.stateWrites-w0);
   await A.click('[data-n="sync"] .btn');await A.waitForTimeout(1200);await idle(A);
   ok('"Add it to this account" then syncs',drive.stateWrites>w0&&cards(remote()).includes('t:second'));await closeAll();}

  console.log('--- 11 Drive down');
  {reset();const A=await dev('A');await signin(A);FAIL.all=1;await grade(A,['t:jvp']);await A.waitForTimeout(9000);
   const st=await A.evaluate(()=>[Store.status,Hub.syncInfo().lastErr&&Hub.syncInfo().lastErr.kind]);ok('says Drive is unreachable and will retry',/unreachable/i.test(st[0])&&st[1]==='transient',st);
   FAIL.all=0;await sync(A);ok('recovers on the next sync',await A.evaluate(()=>Store.status)==='Synced'&&cards(remote()).includes('t:jvp'));await closeAll();}

  console.log('--- 12 Drive layout: folders found by tag (claude/drive-layout.md), then moved by Citrus');
  {reset();const A=await dev('A');await signin(A);await grade(A,['t:lay1']);await idle(A);await A.evaluate(()=>Hub.writeStatus(true));await A.waitForTimeout(500);
   const tagOf=id=>((drive.files[id]||{}).appProperties||{}).citrusApp;
   const data=folderId('Galen'),hubG=live().find(f=>f.name==='galen'&&f.mimeType===FOLDER);
   ok('a fresh account: the data folder is made in the old place and tagged galen-data',!!data&&tagOf(data)==='galen-data',data&&drive.files[data].appProperties);
   ok('the hub folder is tagged galen',!!hubG&&tagOf(hubG.id)==='galen');
   const st=live().filter(f=>f.name==='status.json');
   ok('status.json says drive.byTag',st.length===1&&JSON.parse(st[0].content).drive&&JSON.parse(st[0].content).drive.byTag===true,st.length&&JSON.parse(st[0].content).drive);
   /* Citrus's plan in its old place, tagged by Citrus */
   const today=await A.evaluate(()=>dayKey());const hub=folderId('hub');const cit=mk('citrus',hub,FOLDER,'',{citrusApp:'citrus'});
   const plan=JSON.stringify({app:'citrus',updatedAt:new Date().toISOString(),days:{[today]:{shift:null,blocks:[{app:'galen',title:'Galen: daily round',date:today,start:'16:00',end:'16:20',minutes:20}]}}});mk('plan.json',cit.id,'application/json',plan);
   /* Citrus organises: Citrus/Learning/Medicine/History & exam - Galen (the old hub/galen), the data folder inside it, plan in 00 Hub/Citrus */
   const top=mk('Citrus','root',FOLDER,'',{citrusArea:'_root'}),learn=mk('Learning',top.id,FOLDER,'',{citrusArea:'study'}),med=mk('Medicine',learn.id,FOLDER,'',{citrusArea:'medicine'}),h00=mk('00 Hub',top.id,FOLDER,'',{citrusArea:'hub'});
   Object.assign(drive.files[hubG.id],{name:'History & exam - Galen',parents:[med.id]});
   Object.assign(drive.files[data],{name:'progress & photos',parents:[hubG.id]});
   Object.assign(drive.files[cit.id],{name:'Citrus',parents:[h00.id]});
   const before=live().length;await closeAll();
   /* a fresh device after the move */
   drive.tagQueries=0;const B=await dev('B');await signin(B);await B.evaluate(()=>Hub.readPlan());
   ok('a fresh device finds the moved progress by tag',await B.evaluate(()=>!!Store.s.srs['t:lay1']));
   ok('and reads plan.json from the moved Citrus folder',await B.evaluate(()=>{const p=Hub.todayFromPlan();return !!(p&&p.blocks.length===1&&p.blocks[0].minutes===20);}),await B.evaluate(()=>Hub.todayFromPlan()));
   await grade(B,['t:lay2']);await idle(B);await sync(B);await B.evaluate(()=>Hub.writeStatus(true));await B.waitForTimeout(500);
   const sf=stateFiles();
   ok('one state.json, in the moved folder, with both cards',sf.length===1&&sf[0].parents[0]===data&&['t:lay1','t:lay2'].every(c=>cards(remote()).includes(c)),[sf.length,sf[0]&&sf[0].parents,cards(remote())]);
   ok('no folder made again by path (no new Galen, galen or backups twins)',live().filter(f=>f.mimeType===FOLDER&&['Galen','galen'].includes(f.name)).length===0&&live().filter(f=>f.name==='backups').length<=1,live().filter(f=>f.mimeType===FOLDER).map(f=>f.name));
   const st2=live().filter(f=>f.name==='status.json');
   ok('one status.json, in the moved Galen folder',st2.length===1&&st2[0].parents[0]===hubG.id,st2.map(f=>f.parents));
   ok('one tag lookup per folder per session (galen-data, galen, citrus)',drive.tagQueries===3,drive.tagQueries);
   /* two folders tagged galen-data (a race): the oldest wins */
   mk('progress & photos',med.id,FOLDER,'',{citrusApp:'galen-data'});await closeAll();
   const C=await dev('C');await signin(C);await grade(C,['t:lay3']);await idle(C);
   ok('with two tagged folders the oldest is used',stateFiles().length===1&&stateFiles()[0].parents[0]===data&&cards(remote()).includes('t:lay3'),stateFiles().map(f=>f.parents));
   ok('no page errors',!errsOf(B,C).length,errsOf(B,C));await closeAll();}

  await b.close();console.log(fails?`${fails} FAILED`:'ALL PASS');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
