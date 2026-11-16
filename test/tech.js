/* Technique clinic: every page and drill end to end, cards render, milestones accrue. Serve docs/ on :8765 (or PORT). */
const {chromium}=require('playwright');const PORT=process.env.PORT||8765;(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});
pg.setDefaultTimeout(4000);const clk=async s=>{const ok=await pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;e.click();return true;},s);if(!ok)errs.push('missing '+s);};
const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|net::|googleapis|commons|wikimedia|ERR_/.test(m.text()))errs.push('C '+m.text());});
await pg.goto(`http://localhost:${PORT}/`);await pg.waitForFunction(()=>typeof TECH!=='undefined');
const ids=await pg.evaluate(()=>TECH.map(t=>t.id));
const bad=async l=>{const x=await pg.evaluate(()=>{const T=document.querySelector('#view').innerText;return {err:T.includes('Something went wrong'),leak:/(^|[^a-z-])(undefined|NaN|null|\[object)([^a-z-]|$)/.test(T),hs:document.documentElement.scrollWidth>document.documentElement.clientWidth+1};});if(x.err||x.leak||x.hs)errs.push(l+' '+JSON.stringify(x));};
await pg.evaluate(()=>open('learn','tech'));await bad('list');
for(const id of ids){if(process.env.V)process.stdout.write(id+' ');
  await pg.evaluate(id=>open('learn','tech',id),id);await bad('page '+id);
  await clk('[data-tconf] [data-c="2"]');
  await pg.evaluate(id=>open('practice','techwalk',id),id);
  for(let i=0;i<40;i++){if(!await pg.$('#wr'))break;await clk('#wr');await clk('[data-k="1"]');}await bad('walk '+id);
  await pg.evaluate(id=>open('practice','techorder',id),id);
  for(let k=0;k<60;k++){const ok=await pg.evaluate(()=>{const it=techItems(cur().a);const L=[...document.querySelectorAll('.tk-opts .opt')];if(!L.length)return false;
     const all=it.filter(x=>!x.noOrder&&(!x.alt||x.variant===it.alts[x.alt][0]));all.phases=it.phases.filter(p=>all.some(x=>x.phase===p));techOrderModel(all);
     const placed=new Set(all.filter(x=>!L.some(b=>+b.dataset.i===x.n)).map(x=>x.n));L.find(b=>techCanPlace(all.find(x=>x.n===+b.dataset.i),all,placed)).click();return true;});if(!ok)break;}
  await bad('order '+id);
  await pg.evaluate(id=>open('practice','techwhy',id),id);for(let q=0;q<10;q++){if(!await pg.$('.opt:not([disabled])'))break;await clk('.opt');await clk('#nx');}await bad('why '+id);
  await pg.evaluate(id=>open('practice','techmcq',id),id);
  for(let q=0;q<8;q++){if(!await pg.$('.opt'))break;const a=await pg.evaluate(()=>{const t=TECH.find(x=>x.id===cur().a);const s=document.querySelector('.fc .q').textContent;return t.mcq.find(m=>m.q===s).a;});await clk(`.opt[data-k="${a}"]`);await clk('#nx');}await bad('mcq '+id);
  for(let r=0;r<3;r++){await pg.evaluate(id=>open('practice','techrep',id),id);await pg.evaluate(()=>document.querySelectorAll('.tk-rb').forEach(b=>b.click()));await clk('#save');await bad('rep '+id);}
  await pg.evaluate(id=>open('practice','techrep',id,'obs'),id);for(const k of ['prep','tech','safe','interp','doc'])await clk(`[data-ds="${k}"][data-v="2"]`);await clk('#save');await bad('obs '+id);
  await pg.evaluate(id=>open('learn','techpocket',id),id);await bad('pocket '+id);
}
const m=await pg.evaluate(()=>TECH.map(t=>techDone(t.id)));if(process.env.V)console.log('');console.log('milestones per technique',[...new Set(m)].join(','));
const cards=await pg.evaluate(()=>{const C=buildCards().filter(c=>c.type==='twhy'||c.type==='terr');const bad=[];C.forEach(c=>{try{const r=cardBody(c);if(!r.q||/undefined|NaN/.test(r.q+(r.a||'')+(r.explain||'')))bad.push(c.id);}catch(e){bad.push(c.id+' '+e.message);}});return [C.length,bad];});
console.log('tech cards',cards[0],'bad',cards[1].length);
await pg.evaluate(()=>open('practice','techmcq','all'));await bad('mcq all');await pg.evaluate(()=>open('practice','techwhy','all'));await bad('why all');await pg.evaluate(()=>open('practice','techorder','random'));await pg.waitForTimeout(100);await bad('order random');
await pg.evaluate(()=>open('today'));await bad('today');const tod=await pg.evaluate(()=>document.querySelector('#view').textContent.includes('Technique of the day'));console.log('today tile',tod);
await pg.evaluate(()=>open('signs','sign','otoscopy'));const lk=await pg.evaluate(()=>!!document.querySelector('[data-go="learn/tech/otoscopy"]'));console.log('sign link',lk);
await pg.evaluate(()=>document.querySelector('#searchbtn').click());await pg.fill('.pal input','rhinoscopy');await pg.waitForTimeout(150);console.log('search',await pg.$$eval('.pal-item',x=>x.length));
console.log('ERRORS',errs.length);errs.slice(0,15).forEach(e=>console.log(' ',e));await b.close();})();
