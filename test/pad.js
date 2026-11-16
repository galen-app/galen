const {chromium}=require('playwright');
const PORT=process.env.PORT||8765;
(async()=>{const b=await chromium.launch();
async function fresh(W=1280,H=800,scheme='light'){const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1,colorScheme:scheme});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error')p.errs.push(m.text().slice(0,160))});
await p.addInitScript(()=>{const pad={id:'Steam Deck Controller',index:0,connected:true,mapping:'standard',buttons:[...Array(17)].map(()=>({pressed:false,value:0})),axes:[0,0,0,0],timestamp:0};
 window.__pad=pad;window.__polls=0;navigator.getGamepads=()=>{window.__polls++;return [pad,null,null,null];};
 const waitPolls=async(n)=>{const s=window.__polls;while(window.__polls<s+n)await new Promise(r=>setTimeout(r,8));};
 window.__press=async(i,ms=90)=>{pad.buttons[i].pressed=true;pad.buttons[i].value=1;const t=performance.now();await waitPolls(2);const rest=ms-(performance.now()-t);if(rest>0)await new Promise(r=>setTimeout(r,rest));pad.buttons[i].pressed=false;pad.buttons[i].value=0;await waitPolls(2);await new Promise(r=>setTimeout(r,40));};});
await p.goto(`http://localhost:${PORT}/`);await p.waitForTimeout(900);await p.evaluate(()=>window.dispatchEvent(new Event('gamepadconnected')));await p.waitForTimeout(150);
p.A=async(i,ms)=>{await p.evaluate(([i,ms])=>__press(i,ms),[i,ms||80]);};
p.f=()=>p.evaluate(()=>{const a=document.activeElement;if(!a||a===document.body)return 'BODY';const r=a.getBoundingClientRect();return (a.tagName+' '+(a.getAttribute('aria-label')||a.textContent||'').trim().slice(0,34).replace(/\s+/g,' '))+' @'+Math.round(r.top)+','+Math.round(r.left)+' ['+zoneOf(a)+']';});
p.st=()=>p.evaluate(()=>NAV.tab+':'+cur().v+':'+(cur().a||''));return p;}
const out=(...a)=>console.log(...a);let p,w;
p=await fresh();
await p.A(5);await p.waitForTimeout(400);out('R1',await p.st());await p.A(4);await p.waitForTimeout(400);out('L1',await p.st());
out('legend',await p.evaluate(()=>document.querySelector('#padlegend')?.textContent));
await p.A(8);await p.waitForTimeout(400);out('help',await p.evaluate(()=>!!document.querySelector('.helpov')),await p.f());
for(let i=0;i<3;i++)await p.A(13);out('dpad in help',await p.f(), await p.evaluate(()=>document.querySelector('.shell').inert));
await p.screenshot({path:'/tmp/claude-0/-home-claude/857197ac-964f-5d4c-834c-2754ef5d1874/scratchpad/beta10/D17/s/help.png'});
await p.A(1);await p.waitForTimeout(200);out('B closes help',await p.evaluate(()=>!document.querySelector('.helpov')),await p.f(),await p.evaluate(()=>document.querySelector('.shell').inert));
await p.A(9);await p.waitForTimeout(200);out('palette',await p.evaluate(()=>!!PAL),await p.f());
await p.A(13);await p.A(13);await p.A(0);await p.waitForTimeout(400);out('A in palette',await p.st(),await p.evaluate(()=>!!PAL));
await p.evaluate(()=>open('signs'));await p.waitForTimeout(300);await p.evaluate(()=>{__pad.axes[3]=1;});await p.waitForTimeout(500);await p.evaluate(()=>{__pad.axes[3]=0;});out('right stick page',await p.evaluate(()=>scrollY));
out('errs1',p.errs);await p.close();
// session
p=await fresh();await p.evaluate(()=>{Store.s.srs={};open('practice','session','hall:lungs');});await p.waitForTimeout(500);
out('session first',await p.f(),await p.evaluate(()=>padCtx()));
for(let k=0;k<4;k++){const ctx=await p.evaluate(()=>padCtx());
 if(ctx==='card'){await p.A(2);await p.waitForTimeout(250);out(' reveal->',await p.f(),await p.evaluate(()=>padCtx()));out(' legend',await p.evaluate(()=>document.querySelector('#padlegend')?.textContent));
   if(k==0){await p.screenshot({path:'/tmp/claude-0/-home-claude/857197ac-964f-5d4c-834c-2754ef5d1874/scratchpad/beta10/D17/s/pad-grade.png'});w=[];for(let i=0;i<3;i++){await p.A(13);w.push(await p.f());}out(' down from grades',w);await p.A(12);}
   const i0=await p.evaluate(()=>SES.i);await p.A(k%2?3:0);await p.waitForTimeout(300);out(' graded',i0,'->',await p.evaluate(()=>SES.i),await p.f());}
 else if(ctx==='mcq'){await p.A(13);out(' mcq focus',await p.f());await p.A(0);await p.waitForTimeout(300);out(' after A',await p.evaluate(()=>padCtx()),await p.f());await p.A(0);await p.waitForTimeout(300);}
 else {out('ctx',ctx);break;}}
out('snack?',await p.evaluate(()=>!!document.querySelector('.snack button')));const ib=await p.evaluate(()=>SES.i);await p.A(4);await p.waitForTimeout(300);out('L1 undo',ib,'->',await p.evaluate(()=>SES.i),await p.st());
out('pane',await p.evaluate(()=>document.querySelector('#refpane').innerText.slice(0,200)));
out('errs2',p.errs);await p.close();
// drill
p=await fresh();await p.evaluate(()=>open('practice','drill',DRILLS[0].id));await p.waitForTimeout(500);out('drill first',await p.f());
await p.A(0);await p.waitForTimeout(500);out('drill phase',await p.evaluate(()=>DR.phase),await p.f());
w=[];for(let i=0;i<4;i++){await p.A(13);w.push(await p.f());}out('drill down',w);
await p.A(0);await p.waitForTimeout(400);out('A answer',await p.evaluate(()=>DR.phase),await p.f());await p.screenshot({path:'/tmp/claude-0/-home-claude/857197ac-964f-5d4c-834c-2754ef5d1874/scratchpad/beta10/D17/s/pad-drill.png'});
out('errs3',p.errs);await p.close();
// hall walk
p=await fresh();await p.evaluate(()=>open('learn','hall','lungs'));await p.waitForTimeout(400);w=[];for(let i=0;i<14;i++){await p.A(13);w.push(await p.f());}out('hall down',w);
out('top hidden?',await p.evaluate(()=>{const a=document.activeElement.getBoundingClientRect();return a.top<document.querySelector('header.top').getBoundingClientRect().bottom;}));
await p.A(0);await p.waitForTimeout(200);w=[];for(let i=0;i<4;i++){await p.A(13);w.push(await p.f());}out('after A on summary',w);
w=[];for(let i=0;i<6;i++){await p.A(12);w.push(await p.f());}out('hall up',w);await p.screenshot({path:'/tmp/claude-0/-home-claude/857197ac-964f-5d4c-834c-2754ef5d1874/scratchpad/beta10/D17/s/pad-hall.png'});
out('errs4',p.errs);await p.close();
// door
p=await fresh();await p.evaluate(()=>(()=>{const t=document.querySelector('.door[data-go]');t.focus();t.scrollIntoView({block:'center'});})());w=[];for(const k of [15,15,13,13,14,14]){await p.A(k);w.push(await p.f());}out('door walk',w);
await p.A(0);await p.waitForTimeout(400);out('A on door',await p.st(),p.errs);await p.A(5);await p.waitForTimeout(200);out('alive after',await p.st());await p.close();
// zones 1920
p=await fresh(1920,1080);await p.waitForTimeout(200);await p.evaluate(()=>document.querySelector('#view button').focus());w=[];for(let i=0;i<4;i++){await p.A(14);w.push(await p.f());}out('left',w);
w=[];for(let i=0;i<8;i++){await p.A(15);w.push(await p.f());}out('right',w);
w=[];for(let i=0;i<4;i++){await p.A(7);w.push(await p.f());}out('R2 zones',w);
await p.evaluate(()=>{__pad.axes[3]=1;});await p.waitForTimeout(400);await p.evaluate(()=>{__pad.axes[3]=0;});out('rs in zone',await p.evaluate(()=>[scrollY,document.querySelector('#refpane').scrollTop]));
out('errs5',p.errs);await p.close();
// eggs
p=await fresh();await p.evaluate(()=>{const g=document.querySelector('[data-egg="skull"]');g&&g.focus();});out('skull focus',await p.f());await p.A(0);await p.waitForTimeout(300);out('skull egg',await p.evaluate(()=>eggFound('skull')),await p.f());await p.A(1);await p.waitForTimeout(200);out('closed, focus back',await p.f());
await p.evaluate(()=>document.querySelector('#nav .railbrand').focus());await p.A(0,2300);await p.waitForTimeout(300);out('oath',await p.evaluate(()=>eggFound('oath')));
await p.A(1);await p.waitForTimeout(200);
// konami
await p.evaluate(()=>{delete Store.s.notes['egg:konami'];open('today');});await p.waitForTimeout(300);const st0=await p.st();for(const k of [12,12,13,13,14,15,14,15,1,0]){await p.A(k,90);}await p.waitForTimeout(300);out('konami',await p.evaluate(()=>eggFound('konami')),st0,'->',await p.st());
out('errs6',p.errs);await p.close();
await b.close();})();
