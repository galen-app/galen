"use strict";
/* Card generation: buildCards, card type labels, auto-graded types. */
/* ================= CARDS (spaced retrieval) =================
 Every learnable item becomes a card. Types:
  think  – a finding or sign → what to think (recall, self-graded)
  verdict– how good is this test (auto-graded)
  mech   – mechanism → which sign (auto-graded)
  anat   – landmark → where and why (recall)
  hlr    – history feature → how much it shifts probability (auto-graded)
  red    – presentation → red flags (recall)
  sound  – listen → name (auto-graded) */
let CARDS=null;
function buildCards(){
  const C=[];const add=c=>C.push(c);
  Object.entries(SIGNS).forEach(([k,s])=>{
    if(s.hide)return;const reg=s.reg||null;
    add({id:"t:"+k,type:"think",sys:s.sys,reg,ref:k,label:s.name});
    add({id:"v:"+k,type:"verdict",sys:s.sys,reg,ref:k,label:s.name});
    add({id:"m:"+k,type:"mech",sys:s.sys,reg,ref:k,label:s.name});
    if(s.sens!=null&&s.spec!=null)add({id:"ss:"+k,type:"snsp",sys:s.sys,reg,ref:k,label:s.name});
    if(typeof ANGLES!=="undefined"&&ANGLES[k]&&ANGLES[k].teachback)add({id:"tb:"+k,type:"teach",sys:s.sys,reg,ref:k,label:s.name});
  });
  if(typeof TECH!=="undefined")TECH.forEach(t=>{const sys=t.group==="Ear, nose and eye"?"hn":"neuro";
    t.steps.forEach((st,i)=>add({id:`tw:${t.id}:${i}`,type:"twhy",sys,ref:[t.id,i],label:t.name}));
    (t.mcq||[]).forEach((q,i)=>add({id:`te:${t.id}:${i}`,type:"terr",sys,ref:[t.id,i],label:t.name}));});
  SYSTEMS.forEach(m=>m.think.forEach(([f,t],i)=>add({id:`f:${m.id}:${i}`,type:"finding",sys:m.id,ref:[m.id,i],label:f})));
  const anatSys={chest:"cvs",abdomen:"abd",neck:"hn",back:"msk"};
  Object.entries(ANAT).forEach(([key,a])=>a.pts.forEach(p=>add({id:`a:${key}:${p.k}`,type:"anat",sys:anatSys[key],ref:[key,p.k],label:p.n})));
  Object.entries(AREAS).forEach(([k,a])=>add({id:"ar:"+k,type:"area",sys:"cvs",ref:k,label:a.name}));
  Object.entries(LZONES).forEach(([k,a])=>add({id:"lz:"+k,type:"zone",sys:"resp",ref:k,label:a.name}));
  const presSys=new Proxy({},{get:(o,k)=>(HIST.pres.find(p=>p.id===k)||{}).sys});
  HIST.pres.forEach(p=>{
    p.lr.forEach(([f,t,l],i)=>{if(l!=null)add({id:`h:${p.id}:${i}`,type:"hlr",sys:presSys[p.id]||"gen",ref:[p.id,i],label:f});});
    add({id:"r:"+p.id,type:"red",sys:presSys[p.id]||"gen",ref:p.id,label:p.name});
  });
  Object.entries(SOUNDS).forEach(([k,s])=>add({id:"s:"+k,type:"sound",sys:s.kind==="heart"?"cvs":"resp",ref:k,label:s.name}));
  /* neuro toolkit */
  DERM_ORDER.forEach(k=>{if(DERM_INFO[k]&&DERM_INFO[k].k)add({id:"dm:"+k,type:"derm",sys:"neuro",ref:k,label:k+" key point"});});
  MYO.forEach((m,i)=>add({id:"my:"+m[0],type:"myo",sys:"neuro",ref:i,label:m[1]}));
  REFLEX.forEach((r,i)=>add({id:"rf:"+i,type:"reflex",sys:"neuro",ref:i,label:r[0]}));
  ROOTNERVE.forEach((r,i)=>add({id:"rn:"+i,type:"rootnerve",sys:"neuro",ref:i,label:r.q}));
  CRANIAL.forEach((c,i)=>add({id:"cn:"+c[0],type:"cranial",sys:"neuro",ref:i,label:"CN "+c[0]}));
  /* dermatology */
  DVOCAB.forEach((v,i)=>add({id:"dv:"+i,type:"dterm",sys:"derm",ref:i,label:v[0]}));
  DCOND.forEach(c=>{if(c.p&&c.d)add({id:"dc:"+c.id,type:"dplate",sys:"derm",ref:c.id,label:c.n});});
  /* region membership for MSK sessions also comes from each region's test list */
  REGIONS.forEach(r=>r.tests.forEach(k=>C.forEach(c=>{if(c.ref===k&&!c.reg)c.reg=r.id;})));
  CARDS=C;return C;
}
const CARD_TYPE_LABEL={think:"What to think",verdict:"Test value",mech:"Mechanism",finding:"Finding",anat:"Surface anatomy",area:"Listening area",zone:"Lung zone",hlr:"History clue",red:"Red flags",sound:"Listen",snsp:"Rule in or out",derm:"Dermatome",myo:"Myotome",reflex:"Reflex root",rootnerve:"Root or nerve?",cranial:"Cranial nerve",dterm:"Skin term",dplate:"Name the rash",teach:"Teach it back"};
const AUTO={verdict:1,mech:1,hlr:1,sound:1,snsp:1,myo:1,reflex:1,dplate:1};
