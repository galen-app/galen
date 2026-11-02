const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:860}});const pg=await ctx.newPage();
const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_TUNNEL|net::|gstatic|googleapis/.test(m.text()))errs.push('C '+m.text());});
await pg.goto('http://localhost:8765/index.html#tools');await pg.waitForTimeout(1200);
console.log('platform',await pg.evaluate(()=>[window.GALEN_PLATFORM,NAV.tab,document.querySelector("#toptitle").textContent,!!navigator.serviceWorker.controller]));
for(const r of [["tools"],["tools","settings"],["tools","google"],["tools","data"],["tools","about"],["today"],["sounds"],["learn","dcond","psoriasis"]]){await pg.evaluate(a=>open(...a),r);await pg.waitForTimeout(250);const bad=await pg.evaluate(()=>document.querySelector("#view").textContent.includes("Something went wrong")||document.documentElement.scrollWidth>document.documentElement.clientWidth+1);if(bad)errs.push("VIEW "+r.join("/"));}
await pg.evaluate(()=>open("signs","sign","jvp"));await pg.waitForTimeout(300);
console.log('hash deep link', await (async()=>{await pg.goto('http://localhost:8765/#signs/sign/murphy');await pg.waitForTimeout(900);return await pg.evaluate(()=>document.querySelector("#view h1").textContent);})());
await pg.waitForTimeout(1500);console.log('sw after reload',await pg.evaluate(()=>!!navigator.serviceWorker.controller));
await pg.context().setOffline(true);await pg.reload().catch(()=>{});await pg.waitForTimeout(1200);console.log('offline title',await pg.evaluate(()=>document.title+" "+(document.querySelector("#view h1")||{}).textContent).catch(e=>'ERR '+e.message));
console.log('ERRORS',errs.length,errs.slice(0,8));await b.close();})();
