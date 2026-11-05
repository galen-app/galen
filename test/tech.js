/* Technique clinic: every page and drill end to end, cards render, milestones accrue. Serve docs/ on :8765. */
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});
const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|net::|googleapis|commons|wikimedia|ERR_/.test(m.text()))errs.push('C '+m.text());});
await pg.goto('http://localhost:8765/');await pg.waitForFunction(()=>typeof TECH!=='undefined');
const ids=await pg.evaluate(()=>TECH.map(t=>t.id));
const bad=async l=>{const x=await pg.evaluate(()=>{const T=document.querySelector('#view').innerText;return {err:T.includes('Something went wrong'),leak:/(^|[^a-z-])(undefined|NaN|null)([^a-z-]|$)/.test(T),hs:document.documentElement.scrollWidth>document.documentElement.clientWidth+1};});if(x.err||x.leak||x.hs)errs.push(l+' '+JSON.stringify(x));};
await pg.evaluate(()=>open('learn','tech'));await bad('list');
for(const id of ids){
  await pg.evaluate(id=>open('learn','tech',id),id);await pg.waitForTimeout(30);await bad('page '+id);
  await pg.click('#tconf [data-c="2"]');await pg.waitForTimeout(20);
  await pg.evaluate(id=>open('practice','techwalk',id),id);
  for(let i=0;i<40;i++){if(!await pg.$('#wr'))break;await pg.click('#wr');await pg.click('[data-k="1"]');}await bad('walk '+id);
  await pg.evaluate(id=>open('practice','techorder',id),id);
  const n=await pg.evaluate(id=>TECH.find(t=>t.id===id).steps.length,id);for(let k=0;k<n;k++){await pg.click(`[data-i="${k}"]`);}await bad('order '+id);
  await pg.evaluate(id=>open('practice','techmcq',id),id);
  for(let q=0;q<3;q++){const a=await pg.evaluate(([id,q])=>TECH.find(t=>t.id===id).mcq[q].a,[id,q]);await pg.click(`.opt[data-k="${a}"]`);await pg.click('#nx');}await bad('mcq '+id);
  await pg.evaluate(id=>open('practice','techrep',id),id);
  for(let r=0;r<3;r++){for(const c of await pg.$$('input[data-i]'))await c.check();await pg.click('#save');}await bad('rep '+id);
  await pg.evaluate(id=>open('learn','techpocket',id),id);await bad('pocket '+id);
  await pg.evaluate(id=>open('learn','tech',id),id);await pg.click('#tconf [data-c="5"]');
}
const m=await pg.evaluate(()=>TECH.map(t=>techDone(t.id)));console.log('milestones per technique',[...new Set(m)].join(','));
const cards=await pg.evaluate(()=>{const C=buildCards().filter(c=>c.type==='twhy'||c.type==='terr');const bad=[];C.forEach(c=>{try{const r=cardBody(c);if(!r.q||/undefined|NaN/.test(r.q+(r.a||'')+(r.explain||'')))bad.push(c.id);}catch(e){bad.push(c.id+' '+e.message);}});return [C.length,bad];});
console.log('tech cards',cards[0],'bad',cards[1].length);
await pg.evaluate(()=>open('practice','techmcq','all'));await bad('mcq all');await pg.evaluate(()=>open('practice','techorder','random'));await bad('order random');
await pg.evaluate(()=>open('today'));await bad('today');const tod=await pg.evaluate(()=>document.querySelector('#view').textContent.includes('Technique of the day'));console.log('today tile',tod);
await pg.evaluate(()=>open('signs','sign','otoscopy'));const lk=await pg.evaluate(()=>!!document.querySelector('[data-go="learn/tech/otoscopy"]'));console.log('sign link',lk);
await pg.click('#searchbtn');await pg.fill('.pal input','rhinoscopy');await pg.waitForTimeout(150);console.log('search',await pg.$$eval('.pal-item',x=>x.length));
console.log('ERRORS',errs.length);errs.slice(0,15).forEach(e=>console.log(' ',e));await b.close();})();
