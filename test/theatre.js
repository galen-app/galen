/* Galen 7 theatre: eggs, sound engine, help, hall/chapter sessions, reference pane, outline, codex. Needs docs/ served on :8765. */
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const errs=[];const ok=(n,v)=>{console.log((v?'  ✓ ':'  ✗ ')+n);if(!v)errs.push(n);};
const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push('pageerror '+e.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(900);
ok('theatre svg has 12 doors + table',await p.evaluate(()=>document.querySelectorAll('svg.th .door').length===13));
await p.click('svg.th .door[data-go="learn/hall/lungs"]');await p.waitForTimeout(400);ok('door opens hall',await p.evaluate(()=>cur().v==='hall'&&cur().a==='lungs'));
ok('hall tint set',await p.evaluate(()=>document.documentElement.dataset.hall==='lungs'));
ok('outline chapters render',await p.evaluate(()=>document.querySelectorAll('.chap').length===OUTLINE.lungs.length));
await p.click('[data-act=chap-all]');ok('open all',await p.evaluate(()=>[...document.querySelectorAll('.chap')].every(d=>d.open)));
await p.evaluate(()=>open('practice','session','chap:lungs:3'));await p.waitForTimeout(400);ok('chapter session has cards',await p.evaluate(()=>SES&&SES.queue.length>0));
ok('chapter title',await p.evaluate(()=>document.querySelector('#toptitle').textContent.includes('Breath sounds')));
await p.evaluate(()=>open('practice','session','hall:skin'));await p.waitForTimeout(400);ok('hall session has cards',await p.evaluate(()=>SES.queue.length>0));
/* every card belongs to a hall */
ok('all cards map to a hall',await p.evaluate(()=>{buildCards();return CARDS.every(c=>HALL[cardHall(c)]);}));
/* reference pane: click a sign chip inside a module */
await p.evaluate(()=>open('learn','module','resp'));await p.waitForTimeout(400);
const chip=await p.$('#view [data-go^="signs/sign/"]');await chip.click();await p.waitForTimeout(300);
ok('sign opens in reference pane, not over the work',await p.evaluate(()=>cur().v==='module'&&!!document.querySelector('#refpane h2')));
await p.click('#refpane [data-rp-close]');ok('pane closes',await p.evaluate(()=>!document.querySelector('#refpane [data-rp-close]')));
/* eggs */
await p.keyboard.press('/');await p.waitForTimeout(200);await p.keyboard.type('rete mirabile');await p.waitForTimeout(300);
ok('search egg found',await p.evaluate(()=>eggFound('rete')&&!!document.querySelector('.helpov')));
await p.keyboard.press('Escape');await p.waitForTimeout(100);await p.evaluate(()=>{document.querySelector('.helpov')?.remove();closePalette();});
for(const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'])await p.keyboard.press(k);
await p.waitForTimeout(200);ok('konami egg',await p.evaluate(()=>eggFound('konami')));await p.evaluate(()=>document.querySelectorAll('.helpov').forEach(e=>e.remove()));
await p.evaluate(()=>{NAV.tab='today';NAV.stacks.today.length=1;render(false);});await p.waitForTimeout(300);
for(let i=0;i<5;i++){await p.click('#view [data-egg-medal]');}await p.waitForTimeout(200);ok('medallion egg',await p.evaluate(()=>eggFound('apes')));
await p.evaluate(()=>document.querySelectorAll('.helpov').forEach(e=>e.remove()));
await p.evaluate(()=>document.querySelector('[data-egg=skull]').dispatchEvent(new MouseEvent('click',{bubbles:true})));ok('skull egg',await p.evaluate(()=>eggFound('skull')));
await p.evaluate(()=>document.querySelectorAll('.helpov').forEach(e=>e.remove()));
/* help */
await p.keyboard.press('?');ok('help overlay',await p.evaluate(()=>!!document.querySelector('.helpov table')));await p.keyboard.press('Escape');ok('help closes on Esc',await p.evaluate(()=>!document.querySelector('.helpov')));
/* alt tabs */
await p.keyboard.press('Alt+3');ok('Alt+3 → Signs',await p.evaluate(()=>NAV.tab==='signs'));
/* sound engine runs headless without throwing */
ok('sound engine',await p.evaluate(async()=>{TP.amb=1;TP.music=1;tpSave();SND.apply();SND.fx('right');SND.fx('wrong');SND.fx('seal');SND.playTune();await new Promise(r=>setTimeout(r,300));SND.duck(true);SND.duck(false);TP.amb=0;TP.music=0;SND.apply();return !!SND.ctx;}));
/* codex and stories */
await p.evaluate(()=>open('learn','codex'));await p.waitForTimeout(300);ok('codex lists all stories',await p.evaluate(()=>document.querySelectorAll('#view .lorecard').length===LORE.length));
await p.click('[data-f=dark]');ok('filter dark',await p.evaluate(()=>document.querySelectorAll('#view .lorecard').length===LORE.filter(l=>l.k==='dark').length));
await p.evaluate(()=>open('learn','lore','harvey'));await p.waitForTimeout(300);ok('story outline',await p.evaluate(()=>document.querySelectorAll('.lore-out dt').length===4));
await p.evaluate(()=>open('signs','sign','babinski'));await p.waitForTimeout(300);ok('sign page shows its story',await p.evaluate(()=>!!document.querySelector('#view .lorecard[data-go="learn/lore/babinski"]')));
/* settings */
await p.evaluate(()=>open('tools','settings'));await p.waitForTimeout(300);await p.click('[data-sz=l]');ok('text size large',await p.evaluate(()=>document.documentElement.dataset.size==='l'));await p.click('[data-sz=m]');
/* nothing undefined/NaN on the new screens */
for(const r of [['today'],['learn','hall','table'],['learn','codex'],['learn','lore','semmelweis']]){await p.evaluate(r=>open(...r),r);await p.waitForTimeout(250);
  const bad=await p.evaluate(()=>/\bundefined\b|\bNaN\b|\[object/.test(document.querySelector('#view').innerText+document.querySelector('#refpane').innerText));ok('clean text '+r.join('/'),!bad);}
console.log(errs.length?'ERRORS '+errs.length+'\n'+errs.join('\n'):'ERRORS 0');await b.close();process.exit(errs.length?1:0);})();
