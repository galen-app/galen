/* Service-worker update atomicity (D11, Galen 7.1). node test/swupdate.js [docsDir]
   Serves a throwaway copy of docs/ on :18831 and fakes new builds by editing app.js and rewriting sw.js's hash manifest.
   Checks: a new build whose app.js is missing or corrupt never installs, the old cache survives and offline start works;
   a good build shows the banner on every start until Update; unchanged recordings are reused, not downloaded again;
   after Update the old cache is gone and offline start runs the new build. */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),{spawn}=require('child_process');
const SRC=path.resolve(process.argv[2]||path.join(__dirname,'..','docs'));const PORT=18831;
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'galen-sw-'));fs.cpSync(SRC,TMP,{recursive:true});
const P=f=>path.join(TMP,f);const ORIG={js:fs.readFileSync(P('app.js'),'utf8'),sw:fs.readFileSync(P('sw.js'),'utf8')};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const appUrl=JSON.parse(ORIG.sw.match(/const PRECACHE = (\[.*?\]);/)[1]).find(x=>/^app\.js/.test(x.u)).u;
/* write sw.js for a build whose app.js has these bytes */
function swFor(js,tag){const pc=JSON.parse(ORIG.sw.match(/const PRECACHE = (\[.*?\]);/)[1]);pc.find(x=>x.u===appUrl).h=sha(js);
  return ORIG.sw.replace(/const VERSION = '[^']*'/,`const VERSION = '${tag}'`).replace(/const PRECACHE = \[.*?\];/,'const PRECACHE = '+JSON.stringify(pc)+';');}
const jsFor=n=>ORIG.js+`\n;window.__TESTBUILD=${JSON.stringify(n)};\n`;
function build(n,{mode='good'}={}){const js=jsFor(n);fs.writeFileSync(P('sw.js'),swFor(js,'test'+n));
  if(mode==='missing'){if(fs.existsSync(P('app.js')))fs.unlinkSync(P('app.js'));}
  else fs.writeFileSync(P('app.js'),mode==='corrupt'?js.slice(0,js.length-200):js);}
let log=[];const srv=spawn('python3',['-m','http.server',String(PORT)],{cwd:TMP});srv.stderr.on('data',d=>log.push(...String(d).split('\n').filter(Boolean)));
let fails=0;const ok=(name,cond,extra)=>{if(!cond)fails++;console.log((cond?'PASS ':'FAIL ')+name+(extra!==undefined?' '+JSON.stringify(extra):''));};
(async()=>{await new Promise(r=>setTimeout(r,800));
  build('v1');const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  const URL0=`http://localhost:${PORT}/#today`;
  const st=()=>pg.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();const o={};for(const k of await caches.keys())o[k]=(await (await caches.open(k)).keys()).length;
    return {build:window.__TESTBUILD,ctrl:!!navigator.serviceWorker.controller,waiting:!!(r&&r.waiting),installing:!!(r&&r.installing),bar:!!document.querySelector('[data-n="update"]'),caches:o,app:typeof Store};});
  const settle=async()=>{await pg.waitForTimeout(600);await pg.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update().catch(()=>{});}).catch(()=>{});
    await pg.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return !r.installing;},null,{timeout:20000,polling:300}).catch(()=>{});await pg.waitForTimeout(500);};
  await pg.goto(URL0);await pg.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:20000});await pg.reload();await pg.waitForTimeout(800);
  let s=await st();ok('first install controls the page, one complete cache',s.ctrl&&Object.keys(s.caches).length===1&&Object.values(s.caches)[0]>=9,s);
  const v1cache=Object.keys(s.caches)[0];
  for(const mode of ['missing','corrupt']){
    build('bad-'+mode,{mode});await settle();s=await st();
    ok(`broken build (${mode} app.js): no update offered`,!s.waiting&&!s.bar,s);
    ok(`broken build (${mode} app.js): old cache kept, no partial new cache`,Object.keys(s.caches).length===1&&s.caches[v1cache]>=9,s.caches);
    await ctx.setOffline(true);await pg.reload().catch(()=>{});await pg.waitForTimeout(900);s=await st();
    ok(`broken build (${mode} app.js): offline start still runs v1`,s.app==='object'&&s.build==='v1',s);await ctx.setOffline(false);
  }
  build('v2');const before=log.length;await pg.reload();await settle();s=await st();
  ok('good build: update waits and the banner shows',s.waiting&&s.bar,s);
  const recGets=log.slice(before).filter(l=>/GET \/rec\//.test(l)).length;ok('unchanged recordings reused from the old cache (0 downloads)',recGets===0,recGets);
  await pg.reload();await pg.waitForTimeout(1500);s=await st();ok('banner comes back after a reload until updated',s.bar&&s.waiting&&s.build==='v1',s);
  await pg.click('[data-n="update"] .sb-x');await pg.waitForTimeout(200);ok('banner can be hidden',!(await st()).bar);
  await pg.reload();await pg.waitForTimeout(1500);ok('hidden banner returns on the next start',(await st()).bar);
  const box=await pg.$eval('#shellbars',e=>{const r=e.getBoundingClientRect();return {l:r.left,r:r.right,w:innerWidth};});ok('banner fits a 390 px screen',box.l>=8&&box.r<=box.w-8,box);
  await Promise.all([pg.waitForEvent('load',{timeout:15000}).catch(()=>{}),pg.click('[data-n="update"] .btn')]);await pg.waitForTimeout(1500);s=await st();
  ok('after Update: new build running, old cache deleted',s.build==='v2'&&!s.caches[v1cache]&&Object.keys(s.caches).length===1,s);
  await ctx.setOffline(true);await pg.reload().catch(()=>{});await pg.waitForTimeout(900);s=await st();ok('offline start runs v2',s.app==='object'&&s.build==='v2',s);
  await pg.goto(`http://localhost:${PORT}/?utm=1#signs/sign/jvp`).catch(()=>{});await pg.waitForTimeout(800);ok('offline deep link with a query',await pg.evaluate(()=>typeof cur==='function'&&cur().v==='sign').catch(()=>false));
  await ctx.setOffline(false);
  ok('no page errors',!errs.length,errs.slice(0,3));
  await b.close();srv.kill();fs.rmSync(TMP,{recursive:true,force:true});console.log(fails?`${fails} FAILED`:'ALL PASS');process.exit(fails?1:0);
})().catch(e=>{console.error(e);srv.kill();process.exit(2);});
