/* Build-time consistency check: LR vs sens/spec drift, missing fields, dangling ids, figure/plate references. */
const fs=require("fs"),vm=require("vm");const d=__dirname+"/src/";
const ctx={console,window:{},document:{},navigator:{},localStorage:{getItem(){return null},setItem(){}}};vm.createContext(ctx);
const files=fs.readdirSync(d).filter(f=>f.endsWith(".js")&&(f<"70"||f.startsWith("71"))).sort();
vm.runInContext(files.map(f=>fs.readFileSync(d+f,"utf8").replace(/^"use strict";/,"")).join("\n;\n")+";this.X={SIGNS,DCOND,CMAPS,REGIONS,HIST,FIG,IMG_SUBJECTS,TOOLS:typeof TOOLS!=='undefined'?TOOLS:[],TECH:typeof TECH!=='undefined'?TECH:[]};",ctx);
const {SIGNS,DCOND,CMAPS,REGIONS,HIST,FIG,IMG_SUBJECTS,TOOLS,TECH}=ctx.X;let bad=0;const warn=(...a)=>{bad++;console.log("•",...a);};
for(const [k,s] of Object.entries(SIGNS)){
  if(s.sens!=null&&s.spec!=null&&s.sens>0&&s.spec>0&&s.spec<100){const p=s.sens/(100-s.spec),n=(100-s.sens)/s.spec;
    if(s.p!=null&&(s.p/p>2.2||p/s.p>2.2))warn(k,"LR+",s.p,"vs sens/spec imply",p.toFixed(1));
    if(s.n!=null&&s.n>0&&(s.n/n>2.2||n/s.n>2.2))warn(k,"LR−",s.n,"vs sens/spec imply",n.toFixed(2));}
  for(const f of ["sens","spec","p","n"])if(s[f]!=null&&typeof s[f]!=="number")warn(k,f,"not a number:",s[f]);
  if(s.fig&&!FIG[s.fig])warn(k,"unknown fig",s.fig);
  if(!s.think||!s.how)warn(k,"missing think/how");
}
REGIONS.forEach(r=>r.tests.forEach(t=>{if(!SIGNS[t])warn("region",r.id,"unknown test",t);}));
CMAPS.forEach(m=>m.nodes.forEach(n=>{if(n.link){const [tab,v,a]=n.link.split("/");const ok=v==="sign"?!!SIGNS[a]:v==="dcond"?DCOND.some(c=>c.id===a):true;if(!ok)warn("map",m.id,"dangling link",n.link);}}));
const ids=new Set(DCOND.map(c=>c.id));if(ids.size!==DCOND.length)warn("duplicate derm ids");
TOOLS.forEach(t=>{if(t.kind==="score"){const max=t.items.reduce((a,i)=>a+Math.max(...i.opts.map(o=>o[1])),0),min=t.items.reduce((a,i)=>a+Math.min(...i.opts.map(o=>o[1])),0);for(let v=min;v<=max;v++)if(!t.bands.some(b=>v>=b.min&&v<=b.max))warn("tool",t.id,"no band for",v);}});
{const seen=new Set();const GR=["Ear, nose and eye","Peripheral nerve","Sensory","Reflexes and tone","Coordination and gait","Vestibular and eye movements","Meninges and functional"];
 TECH.forEach(t=>{if(seen.has(t.id))warn("tech dup",t.id);seen.add(t.id);if(!GR.includes(t.group))warn("tech",t.id,"group",t.group);
  for(const f of ["name","purpose","steps","errors","mcq"])if(!t[f]||(Array.isArray(t[f])&&!t[f].length))warn("tech",t.id,"missing",f);
  (t.steps||[]).forEach((x,i)=>{if(!x.do||!x.why)warn("tech",t.id,"step",i,"needs do+why");});
  (t.setup||[]).forEach((x,i)=>{if(!x.do||!x.why)warn("tech",t.id,"setup",i,"needs do+why");});
  (t.signs||[]).forEach(x=>{if(!SIGNS[x])warn("tech",t.id,"unknown sign",x);});
  (t.mcq||[]).forEach((q,i)=>{if(!Array.isArray(q.opts)||q.opts.length<3||!(q.a>=0&&q.a<q.opts.length)||!q.why)warn("tech",t.id,"mcq",i,"malformed");});
  const txt=JSON.stringify(t);if(/\u2014|—/.test(txt))warn("tech",t.id,"em dash");});}
console.log(bad?`${bad} issue(s)`:"all consistent",Object.keys(SIGNS).length,"signs",DCOND.length,"derm",CMAPS.length,"maps",TOOLS.length,"tools",TECH.length,"techniques");
