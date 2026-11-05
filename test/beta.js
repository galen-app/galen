/* Beta sweep: every route at phone, desktop and dark; content and layout checks; then user flows.
   Run with docs/ served on :8765.  node test/beta.js  */
const {chromium}=require('playwright');
const BASE='http://localhost:8765/';
const IGN=/fonts|ERR_TUNNEL|net::|gstatic|googleapis|commons|wikimedia|accounts\.google|favicon/;
(async()=>{
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const issues=new Map();const add=(k,v)=>{if(!issues.has(k))issues.set(k,new Set());issues.get(k).add(v);};
async function mk(vp,scheme){const ctx=await b.newContext({viewport:vp,colorScheme:scheme,hasTouch:vp.width<600});const pg=await ctx.newPage();
  pg.on('pageerror',e=>add('pageerror',e.message.slice(0,160)));
  pg.on('console',m=>{if(m.type()==='error'&&!IGN.test(m.text()))add('console',m.text().slice(0,160));});
  await pg.goto(BASE);await pg.waitForTimeout(1200);return pg;}

/* ---------- 1. all routes ---------- */
const pg=await mk({width:390,height:844},'light');
const routes=await pg.evaluate(()=>{const R=[];
  const NEEDS_ID=['learn:module','learn:region','signs:sign','signs:imgsub','sounds:sound','practice:pocket','learn:dcond','learn:map','tools:calc','tools:lab'];for(const k of Object.keys(ROUTES)){if(NEEDS_ID.includes(k))continue;const [t,v]=k.split(':');R.push([t,v]);}
  TOOLS.forEach(t=>R.push(['tools','calc',t.id]));LABS.forEach(l=>R.push(['tools','lab',l.id]));
  CMAPS.forEach(m=>R.push(['learn','map',m.id]));DCOND.forEach(c=>R.push(['learn','dcond',c.id]));
  Object.keys(SIGNS).forEach(k=>R.push(['signs','sign',k]));HIST.pres.forEach(p=>R.push(['learn','pres',p.id]));
  Object.keys(IMG_SUBJECTS).forEach(k=>R.push(['signs','imgsub',k]));
  SYSTEMS.forEach(m=>{R.push(['learn','module',m.id]);R.push(['tools','narrate',m.id]);});
  if(typeof REGIONS!=='undefined')(Array.isArray(REGIONS)?REGIONS:Object.values(REGIONS)).forEach(r=>R.push(['learn','region',r.id]));
  return R;});
const known=await pg.evaluate(()=>Object.keys(ROUTES));
async function checkView(p,label){
  return p.evaluate(label=>{const out=[];const V=document.querySelector('#view');const T=V.innerText;
    if(T.includes('Something went wrong'))out.push(['viewerror',label+' :: '+(V.querySelector('.muted')||{}).textContent]);
    const m=T.match(/(^|[^a-z-])(undefined|NaN|\[object Object\]|null)([^a-z-]|$)/);if(m)out.push(['leak',label+' :: …'+T.slice(Math.max(0,m.index-40),m.index+40).replace(/\s+/g,' ')+'…']);
    if(T.trim().length<20)out.push(['empty',label]);
    const W=document.documentElement.clientWidth;
    if(document.documentElement.scrollWidth>W+1){let w=[...V.querySelectorAll('*')].find(e=>{const r=e.getBoundingClientRect();return r.right>W+1&&!e.closest('.tbl,.tscroll,.tabs,.chips.scroll,pre');});out.push(['hscroll',label+(w?' :: <'+w.tagName.toLowerCase()+' class="'+w.className+'">':'')]);}
    V.querySelectorAll('button,a').forEach(e=>{const n=(e.textContent||e.getAttribute('aria-label')||e.title||'').trim();if(!n&&!e.hidden&&e.offsetParent)out.push(['noname',label+' :: '+e.outerHTML.slice(0,90)]);});
    V.querySelectorAll('[data-go]').forEach(e=>{const [t,v]=e.dataset.go.split('/');if(!window.__known.includes(t+':'+(v||({today:'home',learn:'home',signs:'library',sounds:'library',practice:'home',tools:'home'})[t])))out.push(['deadlink',label+' -> '+e.dataset.go]);});
    V.querySelectorAll('img').forEach(i=>{if(i.complete&&i.naturalWidth===0&&!/wikimedia|googleusercontent/.test(i.src))out.push(['brokenimg',label+' '+i.src.slice(0,80)]);});
    return out;},label);}
await pg.evaluate(k=>window.__known=k,known);
let n=0;
for(const r of routes){await pg.evaluate(a=>{try{open(...a);}catch(e){console.error('open '+a.join('/')+' '+e.message);}},r);await pg.waitForTimeout(r.length>2?25:90);n++;
  for(const [k,v] of await checkView(pg,r.join('/')))add(k,v);}
console.log('phone routes',n);

/* desktop + dark spot pass on top-level and one of each kind */
for(const [vp,sch] of [[{width:1366,height:900},'light'],[{width:390,height:844},'dark'],[{width:320,height:640},'light']]){
  const p=await mk(vp,sch);await p.evaluate(k=>window.__known=k,known);
  const sample=routes.filter((r,i)=>r.length===2||i%7===0);
  for(const r of sample){await p.evaluate(a=>open(...a),r);await p.waitForTimeout(30);for(const [k,v] of await checkView(p,`${vp.width}${sch[0]} `+r.join('/')))add(k,v);}
  console.log(vp.width,sch,'sample',sample.length);await p.context().close();}

/* ---------- 2. flows ---------- */
const f=await mk({width:390,height:844},'light');await f.evaluate(k=>window.__known=k,known);const log=(...a)=>console.log('  ·',...a);
// review session: show answer and grade via buttons and via swipe
await f.evaluate(()=>open('practice','session','all'));await f.waitForTimeout(300);
for(let i=0;i<6;i++){const show=await f.$('#reveal');if(show){await show.click();await f.waitForTimeout(80);}
  const o=await f.$('.fc .opt:not([disabled])');if(o){await o.click();await f.waitForTimeout(80);await f.keyboard.press('Enter');await f.waitForTimeout(120);continue;}
  const g=await f.$('.grades button');if(!g){add('flow','session: card '+i+' has neither options nor grades');break;}await (await f.$$('.grades button'))[2].click();await f.waitForTimeout(120);}
log('session graded', await f.evaluate(()=>Object.keys(Store.s.srs).length),'cards; xp',await f.evaluate(()=>Store.s.xp));
// undo snackbar appears?
// calculators: numeric edge inputs
for(const t of await f.evaluate(()=>TOOLS.filter(t=>t.kind!=='score').map(t=>({id:t.id,inputs:t.inputs})))){
  await f.evaluate(id=>open('tools','calc',id),t.id);await f.waitForTimeout(40);
  for(const inp of t.inputs){if(inp.opts){const c=await f.$(`[data-k="${inp.k}"][data-v]`);if(c)await c.click();}else{const v=inp.default!=null?inp.default:(inp.min+inp.max)/2;await f.fill(`input[data-k="${inp.k}"]`,String(v));}await f.waitForTimeout(15);}
  const txt=await f.evaluate(()=>(document.querySelector('#view .big')||{}).textContent||document.querySelector('#view').innerText.slice(0,0));
  if(!txt||/NaN|Infinity|–/.test(txt))add('calc',t.id+' mid-range result "'+txt+'"');
  // input focus survives typing
  const first=t.inputs.find(i=>!i.opts);if(first){await f.focus(`input[data-k="${first.k}"]`);await f.keyboard.type('1');const foc=await f.evaluate(()=>document.activeElement&&document.activeElement.dataset.k);if(foc!==first.k)add('calc',t.id+' loses focus while typing');}
}
// score tools: every band reachable, no total outside bands when fully answered at max
for(const t of await f.evaluate(()=>TOOLS.filter(t=>t.kind==='score').map(t=>({id:t.id,max:t.items.reduce((a,it)=>a+Math.max(...it.opts.map(o=>o[1])),0),min:t.items.reduce((a,it)=>a+Math.min(...it.opts.map(o=>o[1])),0),bands:t.bands})))){
  for(let v=t.min;v<=t.max;v++){if(!(t.bands||[]).some(b=>v>=b.min&&v<=b.max))add('scoreband',t.id+' total '+v+' has no band');}}
log('calculators checked');
// sounds actually route to output
await f.evaluate(()=>open('sounds','sound',Object.keys(SOUNDS||{})[0]||'h-as-015-sit-aor'));await f.waitForTimeout(600);
const play=await f.$('.play');if(play){await play.click();await f.waitForTimeout(1500);
  const st=await f.evaluate(()=>({src:!!(typeof E!=='undefined'&&E.src),box:!!(typeof E!=='undefined'&&E.box),routesPolluted:'undefined' in ROUTES}));log('audio',JSON.stringify(st));if(st.routesPolluted)add('audio','audio routing called the page router');if(!st.src)add('audio','no audio source after play');}else add('flow','no play button in sound library');
// search palette
await f.keyboard.press('Escape');await f.evaluate(()=>open('today'));await f.click('#searchbtn');await f.waitForTimeout(150);
for(const q of ['murphy','psoriasis','heart score','sodium','shock','palpitations','zzzzqq']){await f.fill('.pal input',q);await f.waitForTimeout(120);const c=await f.$$eval('.pal-item',x=>x.length);if(!c&&q!=='zzzzqq')add('search','no results for '+q);if(q==='zzzzqq'){const e=await f.evaluate(()=>document.querySelector('.pal-list').innerText.trim());if(!e)add('search','no empty-state message');}}
await f.fill('.pal input','murphy');await f.waitForTimeout(100);await f.keyboard.press('Enter');await f.waitForTimeout(200);log('search→',await f.evaluate(()=>document.querySelector('#view h1').textContent));
// back button and tab stacks
await f.evaluate(()=>open('signs','sign','jvp'));await f.waitForTimeout(100);await f.click('#backbtn');await f.waitForTimeout(100);log('back→',await f.evaluate(()=>NAV.tab+':'+cur().v));
// hold to explain / menu
await f.evaluate(()=>open('signs','library'));await f.waitForTimeout(200);
const row=await f.$('#view .lrow[data-go]');if(row){const bb=await row.boundingBox();await f.mouse.move(bb.x+20,bb.y+10);await f.mouse.down();await f.waitForTimeout(700);await f.mouse.up();await f.waitForTimeout(150);
  const sheet=await f.evaluate(()=>!!document.querySelector('.sheet'));log('hold menu sheet',sheet);if(!sheet)add('hands','long-press on a sign row opened no menu');
  await f.keyboard.press('Escape');await f.evaluate(()=>document.querySelectorAll('.sheet-back,.sheet').forEach(e=>e.remove()));}
// sketch
const figId=await f.evaluate(()=>Object.keys(FIG)[0]);await f.evaluate(id=>Sketch.open(id),figId);await f.waitForTimeout(100);
const cv=await f.$('.sk-c');const cb=await cv.boundingBox();await f.mouse.move(cb.x+10,cb.y+10);await f.mouse.down();await f.mouse.move(cb.x+100,cb.y+80);await f.mouse.up();
await f.click('[data-a="reveal"]');await f.click('[data-a="done"]');await f.waitForTimeout(100);log('sketch closed',await f.evaluate(()=>!document.querySelector('.lb')&&document.body.style.overflow===''));
// backup/restore roundtrip through Store
const s1=await f.evaluate(()=>JSON.stringify(Store.s.srs).length);await f.evaluate(()=>{const snap=JSON.parse(JSON.stringify(Store.s));Store.s.srs={};Store.s=mergeStates(Store.s,snap);});const s2=await f.evaluate(()=>JSON.stringify(Store.s.srs).length);log('merge-restore',s1===s2);if(s1!==s2)add('data','restore merge lost srs data');
// reload persistence
await f.reload();await f.waitForTimeout(1200);await f.evaluate(k=>window.__known=k,known);const s3=await f.evaluate(()=>Object.keys(Store.s.srs).length);log('after reload srs',s3);if(!s3)add('data','progress lost on reload');
// theme toggle
await f.evaluate(()=>{Store.s.settings.theme='dark';applyTheme();});await f.waitForTimeout(50);log('theme attr',await f.evaluate(()=>document.documentElement.dataset.theme));
// keyboard: "/" opens search
await f.evaluate(()=>open('today'));await f.keyboard.press('/');await f.waitForTimeout(100);if(!await f.$('.pal'))add('keys','"/" does not open search');
// describe trainer + spot + localiser + hdpe start without error
for(const r of [['practice','describe'],['practice','localiser'],['practice','hdpe'],['practice','er'],['practice','duel'],['practice','drill'],['practice','rehearse'],['learn','describe']]){await f.keyboard.press('Escape');await f.evaluate(a=>open(...a),r);await f.waitForTimeout(150);
  const btn=await f.$('#view .opt:not([disabled]), #view .btn:not([disabled])');if(btn){await btn.click().catch(()=>{});await f.waitForTimeout(150);}
  for(const [k,v] of await checkView(f,'flow '+r.join('/')))add(k,v);}
await b.close();
console.log('\n==== ISSUES ====');let tot=0;for(const [k,s] of issues){console.log(`\n[${k}] ${s.size}`);[...s].slice(0,25).forEach(x=>console.log('  '+x));tot+=s.size;}
console.log('\nTOTAL',tot);
})();
