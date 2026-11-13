"use strict";
/* ================= TECHNIQUE CLINIC =================
 For examinations you already do but want to be certain of: the proper technique, the reason behind each move,
 the errors that fool you, and drills that rebuild it from several angles (walk-through, order, which step is this
 reason for, spot the error, bedside checklist with timers and a dated note, observed OSCE-style checklist,
 confidence before and after, spaced "why" cards).
 Progress lives in Store.s.notes["tech:<id>"] = {t, ft:{field:time}, read, conf:[[t,v]...], walk, order, why, mcq, mcqOk:[k],
 reps:[{t,n,of,obs,clean,miss:[[key,label]],v,res,dur,ds,by,cm,note}]}. Old reps ({t,n,of,obs}) still count. */
IC.timer=IC.timer||'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>';
IC.observe=IC.observe||'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 11l2 2 4-4"/>';
IC.why=IC.why||'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17.2v.1"/>';

const TECH_FIG={"otoscopy":"tech-otoscope","direct-ophthalmoscopy":"tech-ophthalmoscope","anterior-rhinoscopy":"tech-rhinoscopy","tinel":"tech-tinel","dix-hallpike":"tech-hallpike","hints":"tech-head-impulse","tendon-reflexes":"tech-reflex","plantar-response":"tech-plantar","tuning-fork":"tech-tuning-fork"};
const TECH_GROUP_IC={"Ear, nose and eye":"eye","Peripheral nerve":"bolt","Sensory":"card","Reflexes and tone":"target","Coordination and gait":"mind","Vestibular and eye movements":"repeat","Meninges and functional":"case"};
const TECH_GROUP_ORDER=["Ear, nose and eye","Peripheral nerve","Sensory","Reflexes and tone","Coordination and gait","Vestibular and eye movements","Meninges and functional"];
/* tests that give one result for the patient rather than one per side */
const TECH_MIDLINE=new Set(["meningism","romberg","tandem-gait","hints","hoover","pronator-drift","cerebellar-tests"]);
const techList=()=>typeof TECH!=="undefined"?TECH:[];
const techById=id=>techList().find(t=>t.id===id);
const techSys=t=>t.group==="Ear, nose and eye"?"hn":"neuro";
function techRec(id){return Store.s.notes["tech:"+id]||{};}
/* every field keeps its own time (ft) so two devices can be merged field by field */
function techSave(id,patch){const old=techRec(id),now=Date.now(),ft=Object.assign({},old.ft||{});Object.keys(patch).forEach(k=>ft[k]=now);
  const r=Object.assign({},old,patch,{t:now,ft});Store.s.notes["tech:"+id]=r;Store.save();return r;}
function techConf(id){const c=techRec(id).conf||[];return c.length?c[c.length-1][1]:null;}
function techFirstConf(id){const c=techRec(id).conf||[];return c.length?c[0][1]:null;}
const techRepClean=x=>x.clean!=null?!!x.clean:x.n>=x.of;
function techHideToast(){const t=document.getElementById("toast");if(t)t.hidden=true;}
function techAutoShort(d){let s=String(d||"").split(/[.;:(]/)[0].trim();const w=s.split(/\s+/);if(w.length>8)s=w.slice(0,7).join(" ")+"…";return s.replace(/,$/,"");}

/* ---------- items: setup and steps as one list with drill metadata ----------
 Optional fields on each setup/step item in TECH data: short, phase, chain, group, need ("core"|"optional"|"alt"),
 alt + variant, timer (s), noOrder, nocard; optional per technique: phases (fixed phase order). All have defaults. */
const _techItemsCache=new Map();
function techItems(t){
  if(typeof t==="string")t=techById(t);if(!t)return [];
  const ck=t.id+"|"+(t.setup||[]).length+"|"+t.steps.length+"|"+t.steps.map(s=>(s.short||"")+s.do.slice(0,12)).join("");
  if(_techItemsCache.has(ck))return _techItemsCache.get(ck);
  const raw=[...(t.setup||[]).map((s,i)=>({s,setup:true,i,k:"S"+i})),...t.steps.map((s,i)=>({s,setup:false,i,k:String(i)}))];
  let phase=null;
  const out=raw.map((r,n)=>{const s=r.s;const ph=s.phase||phase||(r.setup?"Set up":"Technique");phase=ph;
    const need=s.need==="optional"||s.need==="alt"?s.need:s.alt?"alt":"core";
    return {k:r.k,n,setup:r.setup,i:r.i,step:r.setup?-1:r.i,do:s.do,why:s.why,cue:s.cue,short:s.short||techAutoShort(s.do),phase:ph,
      chain:s.chain||"main",group:s.group||null,need,alt:need==="alt"?(s.alt||"version"):null,variant:need==="alt"?(s.variant||s.short||techAutoShort(s.do)):null,
      timer:+(s.timer||0)||0,noOrder:!!s.noOrder,nocard:!!s.nocard};});
  const order=(t.phases||[]).filter(p=>out.some(x=>x.phase===p));
  out.phases=[...order,...[...new Set(out.map(x=>x.phase))].filter(p=>!order.includes(p))];
  out.alts={};out.forEach(x=>{if(x.alt){const L=out.alts[x.alt]||(out.alts[x.alt]=[]);if(!L.includes(x.variant))L.push(x.variant);}});
  _techItemsCache.set(ck,out);return out;
}
const techCap=s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1);
/* ordering: phases in order; inside a phase, each chain is sequential except for consecutive items sharing a group */
function techOrderModel(items){
  const slots={};items.forEach(x=>{const key=x.phase+"\u0001"+x.chain;const L=slots[key]||(slots[key]={n:-1,g:null});
    if(!(x.group&&L.g===x.group))L.n++;L.g=x.group;x._slot=L.n;x._pr=items.phases.indexOf(x.phase);});
  return items;
}
function techCanPlace(x,items,placed){
  return items.every(y=>placed.has(y.n)||y===x||(y._pr>x._pr?true:y._pr<x._pr?false:y.chain!==x.chain||y._slot>=x._slot));
}

/* ---------- milestones ---------- */
function techMcqDone(id){const r=techRec(id),t=techById(id);if(!t)return false;const L=(t.mcq||[]).length;if(!L)return false;
  return (r.mcq||0)>=L||new Set(r.mcqOk||[]).size>=L;}
function techMilestones(id){const r=techRec(id),t=techById(id);const clean=(r.reps||[]).filter(techRepClean).length;
  return [["Read",!!r.read,"learn/tech/"+id],["Walk-through",(r.walk||0)>=0.8,"practice/techwalk/"+id],["Order",(r.order||0)>=1,"practice/techorder/"+id],["Errors",!!t&&techMcqDone(id),"practice/techmcq/"+id],["3 clean reps",clean>=3,"practice/techrep/"+id]];}
const techDone=id=>techMilestones(id).filter(m=>m[1]).length;
const pips=(id)=>{const M=techMilestones(id);return `<span class="mdots" role="img" aria-label="${M.filter(m=>m[1]).length} of 5 milestones" title="${M.map(m=>(m[1]?"✓ ":"· ")+m[0]).join("\n")}">${M.map(m=>`<i class="${m[1]?"on":""}"></i>`).join("")}</span>`;};
const CONF_L=["","Unsure","Shaky","Okay","Confident","Certain"];
function techNextDrill(id){const m=techMilestones(id).find(x=>!x[1]);return m?m:null;}
/* hold menu for a technique row (used by the hold gesture) */
function techHoldMenu(id){const t=techById(id);if(!t)return null;const M=techMilestones(id);const c=techConf(id);
  return {title:t.name,items:[{label:"Open",icon:"chev",run:()=>open("learn","tech",id)},
    ...M.map(m=>({label:(m[1]?"✓ ":"")+m[0],icon:m[1]?"check":"play",sub:m[1]?"Done":"Not yet: tap to do it",run:()=>{const [a,b,cc]=m[2].split("/");open(a,b,cc);}})),
    {label:"Pocket card",icon:"pocket",sub:c!=null?`Confidence ${c} of 5 (${CONF_L[c]})`:"Not rated yet",run:()=>open("learn","techpocket",id)}]};}

/* ---------- confidence: chips that update in place, and a small history line ---------- */
function techSpark(id){const c=(techRec(id).conf||[]).slice(-12);if(c.length<2)return "";
  const W=120,H=28,pts=c.map((x,i)=>`${(i/(c.length-1)*(W-8)+4).toFixed(1)},${(H-4-(x[1]-1)/4*(H-8)).toFixed(1)}`).join(" ");
  return `<svg class="tk-spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Confidence history: ${c.map(x=>x[1]).join(", ")}"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>${c.map((x,i)=>i===c.length-1?`<circle cx="${(i/(c.length-1)*(W-8)+4).toFixed(1)}" cy="${(H-4-(x[1]-1)/4*(H-8)).toFixed(1)}" r="3" fill="var(--accent)"/>`:"").join("")}</svg>`;}
function techConfLine(id){const r=techRec(id),c=techConf(id),first=techFirstConf(id);
  return first!=null&&c!=null&&(r.conf||[]).length>1?`Started at ${first} (${CONF_L[first]}), now ${c} (${CONF_L[c]}).`:c!=null?"Rate it again after the drills. The change is the point.":"Rate it now, then again after the drills. The change is the point.";}
function techConfHTML(id,label){const c=techConf(id);
  return `<div class="card stack tk-conf" style="gap:8px" data-tconf="${id}"><div class="row-x"><span class="eyebrow">${esc(label||"How sure are you of your technique?")}</span><span class="spacer"></span><span class="tk-sparkw">${techSpark(id)}</span></div>
   <div class="chips" role="group" aria-label="Confidence">${[1,2,3,4,5].map(v=>`<button class="chip${c===v?" on":""}" data-c="${v}" aria-pressed="${c===v}">${v} · ${CONF_L[v]}</button>`).join("")}</div>
   <p class="small muted tk-confline">${techConfLine(id)}</p></div>`;}
function techBindConf(root){$$("[data-tconf]",root).forEach(box=>box.addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(!b)return;const id=box.dataset.tconf;const v=+b.dataset.c;
  const rr=techRec(id);techSave(id,{conf:[...(rr.conf||[]),[Date.now(),v]].slice(-20)});tick(1);
  $$("[data-c]",box).forEach(x=>{const on=+x.dataset.c===v;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on);});
  $(".tk-confline",box).textContent=techConfLine(id);$(".tk-sparkw",box).innerHTML=techSpark(id);
  const p=$(".tk-pipsw",root);if(p)p.innerHTML=pips(id);toast(`Confidence: ${CONF_L[v]}`,"good");}));}

/* ---------- list ---------- */
function techListView(root){
  const L=techList();const by={};L.forEach(t=>(by[t.group]||(by[t.group]=[])).push(t));
  const mastered=L.filter(t=>techDone(t.id)===5).length,rerated=L.filter(t=>(techRec(t.id).conf||[]).length>1);
  const up=rerated.filter(t=>techConf(t.id)>techFirstConf(t.id)).length;
  root.innerHTML=`<section class="ph"><span class="eyebrow">Technique clinic</span><h1>Do it right, know why</h1><p class="lede">For the examinations you already do but want to be certain of. Each one breaks down into the proper steps, the reason behind every move, how to tell you got it right, the errors that fool good clinicians and how to rescue a difficult view. Then you rebuild it from several angles until it is automatic.</p></section>
   <div class="facts"><div class="fact"><span class="label">Techniques</span><div><b class="mono">${L.length}</b></div></div><div class="fact"><span class="label">Mastered</span><div><b class="mono">${mastered}</b> of ${L.length}</div></div><div class="fact"><span class="label">More confident</span><div>${rerated.length?`<b class="mono">${up}</b> of ${rerated.length} re-rated`:"Rate one to start"}</div></div></div>
   <div class="row-x"><button class="btn sm" data-go="practice/techmcq/all">${ic("target")}Spot the error: mixed</button><button class="btn sm ghost" data-go="practice/techwhy/all">${ic("why")}Which step is this reason for?</button><button class="btn sm ghost" data-go="practice/techorder/random">${ic("shuffle")}Put a random one in order</button></div>
   ${TECH_GROUP_ORDER.concat(Object.keys(by).filter(g=>!TECH_GROUP_ORDER.includes(g))).filter(g=>by[g]).map(g=>`<section class="section"><span class="label">${esc(g)}</span><div class="list">${by[g].map(t=>{const c=techConf(t.id);return `<button class="lrow" data-go="learn/tech/${t.id}"><span class="icwrap">${ic(TECH_GROUP_IC[g]||"mind")}</span><span class="txt"><b>${esc(t.name)}</b><span>${esc(t.hook||t.purpose)}</span></span><span class="stack" style="gap:4px;align-items:flex-end">${pips(t.id)}${c!=null?`<span class="tiny muted">${CONF_L[c]}</span>`:""}</span></button>`;}).join("")}</div></section>`).join("")}
   ${L.length?"":`<div class="empty">Techniques are being written.</div>`}
   <p class="tiny muted">The five dots: read it · walked it through · put the steps in order · spotted every error · three clean bedside reps. Hold a row to see which are done and jump to the next one.</p>`;
}

/* ---------- technique page ---------- */
function techPage(root,id){
  const t=techById(id);if(!t)throw new Error("Technique not found");techHideToast();
  const r=techRec(id);if(!r.read)techSave(id,{read:Date.now()});
  const figId=TECH_FIG[id];const imgSign=(t.signs||[]).find(s=>typeof IMG_SUBJECTS!=="undefined"&&IMG_SUBJECTS[s]);
  const items=techItems(t),M=techMilestones(id),nx=techNextDrill(id);
  const doc=techDocParts(t);
  root.innerHTML=`<section class="ph"><span class="eyebrow">${esc(t.group)} · technique</span><h1>${esc(t.name)}</h1><p class="lede">${esc(t.purpose)}</p>${t.hook?`<p class="quote">${esc(t.hook)}</p>`:""}</section>
   <div class="tk-top${figId?" hasfig":""}">${figId?`<div class="tk-fig">${fig(figId)}</div>`:""}<div class="stack tk-drills" style="gap:10px">
   <div class="tk-ms card pad-s"><div class="row-x" style="gap:8px"><span class="eyebrow">Your milestones</span><span class="spacer"></span><span class="tk-pipsw">${pips(id)}</span></div>
    <div class="tk-mslist">${M.map(m=>`<button class="tk-msb${m[1]?" on":""}" data-go="${m[2]}">${ic(m[1]?"check":"play")}<span>${esc(m[0])}</span></button>`).join("")}</div>
    ${nx&&nx[0]!=="Read"?`<p class="small muted" style="margin:6px 0 0">Next: <button class="link small" data-go="${nx[2]}">${esc(nx[0])}</button></p>`:!nx?`<p class="small muted" style="margin:6px 0 0">All five done. Keep it alive with an observed rep now and then.</p>`:""}</div>
   <div class="tk-tiles">${[
     ["practice/techwalk/"+id,"play","Walk it through","Say why, then reveal"],
     ["practice/techorder/"+id,"shuffle","Put it in order",`${items.filter(x=>!x.noOrder&&(!x.alt||x.variant===items.alts[x.alt][0])).length} steps in ${items.phases.length} phases`],
     ["practice/techwhy/"+id,"why","Which step is this for?","Match the reason to the step"],
     ["practice/techmcq/"+id,"target","Spot the error",`${(t.mcq||[]).length} scenarios`],
     ["practice/techrep/"+id,"timer","Bedside checklist","Timers and a dated note"],
     ["practice/techrep/"+id+"/obs","observe","Observed by a colleague","OSCE-style checklist and rating"]
   ].map(([go,i,h,s])=>`<button class="tk-tile" data-go="${go}">${ic(i)}<b>${h}</b><span>${esc(s)}</span></button>`).join("")}</div></div></div>
   ${techConfHTML(id)}
   <div class="row-x"><button class="btn sm soft" id="tnarr">${ic("sounds")}Read it to me</button><button class="btn sm ghost" data-go="learn/techpocket/${id}">${ic("pocket")}Pocket card</button></div>
   ${t.kit&&t.kit.length?`<section class="sec"><h3>Kit</h3><ul class="prose" style="padding-left:1.1em">${t.kit.map(k=>`<li>${esc(k)}</li>`).join("")}</ul></section>`:""}
   ${t.setup&&t.setup.length?`<section class="section"><span class="label">Set up, and why</span><div class="stack" style="gap:8px">${items.filter(x=>x.setup).map(x=>`<div class="card pad-s stack" style="gap:4px"><span style="font-weight:600">${esc(x.do)}</span><span class="small"><span class="muted">Why:</span> ${esc(x.why)}</span></div>`).join("")}</div></section>`:""}
   <section class="section"><span class="label">The technique, step by step</span><div class="stack" style="gap:8px">${items.filter(x=>!x.setup).map((x,i)=>`<details class="acc why"${i<2?" open":""}><summary><span class="n">${String(i+1).padStart(2,"0")}</span><span class="st"><b>${esc(x.do)}</b>${x.need!=="core"?` <span class="tag">${x.need==="alt"?esc(x.variant):"if needed"}</span>`:""}</span></summary><div class="acc-body"><div><span class="k">Why</span>${esc(x.why)}</div>${x.cue?`<div class="note good"><b>You know it's right when</b> ${esc(x.cue)}</div>`:""}</div></details>`).join("")}</div></section>
   ${t.normal?`<section class="sec"><h3>${esc(t.normalLabel||"Normal")}</h3><p>${esc(t.normal)}</p></section>`:""}
   ${t.abnormal&&t.abnormal.length?`<section class="section"><span class="label">What you might find</span><div class="tbl"><table><tr><th>Finding</th><th>Points to</th></tr>${t.abnormal.map(a=>`<tr><td style="font-weight:700">${esc(a.finding)}</td><td>${esc(a.means)}</td></tr>`).join("")}</table></div></section>`:""}
   ${t.errors&&t.errors.length?`<section class="section"><span class="label">Errors that fool good clinicians</span><div class="stack" style="gap:8px">${t.errors.map(e=>`<div class="card pad-s stack" style="gap:6px"><div class="redflag"><b>${esc(e.error)}</b></div><span class="small"><span class="muted">What it does:</span> ${esc(e.result)}</span><span class="small"><span class="muted">Fix:</span> <b>${esc(e.fix)}</b></span></div>`).join("")}</div></section>`:""}
   ${t.trouble&&t.trouble.length?`<section class="section"><span class="label">When it isn't working</span><div class="stack" style="gap:8px">${t.trouble.map(x=>`<details class="acc"><summary><span class="st"><b>“${esc(x.problem)}”</b></span></summary><div class="acc-body"><p>${esc(x.fix)}</p></div></details>`).join("")}</div></section>`:""}
   ${t.pearls&&t.pearls.length?`<section class="card stack hookcard" style="gap:8px"><span class="eyebrow">Pearls</span><ul class="prose" style="padding-left:1.1em">${t.pearls.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></section>`:""}
   ${t.evidence&&t.evidence.length?`<section class="section"><span class="label">The numbers</span><div class="stack" style="gap:6px">${t.evidence.map(e=>`<div class="lm"><b>${esc(e.stat)}</b><span class="tiny muted">${esc(e.src)}</span></div>`).join("")}</div></section>`:""}
   ${t.document?`<section class="sec"><h3>Writing it down</h3>${doc.normal?`<p class="small"><span class="muted">Normal:</span> <span class="mono">${esc(doc.normal)}</span></p>${doc.abnormal?`<p class="small"><span class="muted">Abnormal example:</span> <span class="mono">${esc(doc.abnormal)}</span></p>`:""}`:`<p class="mono small" style="white-space:pre-wrap">${esc(t.document)}</p>`}</section>`:""}
   ${imgSign?`<section class="section"><span class="label">Real examples</span>${Img.galleryHTML("s:"+imgSign,IMG_SUBJECTS[imgSign][1],{title:IMG_SUBJECTS[imgSign][0]})}</section>`:""}
   ${(t.signs||[]).filter(s=>SIGNS[s]).length?`<section class="section"><span class="label">The sign pages this serves</span><div class="chips">${t.signs.filter(s=>SIGNS[s]).map(s=>`<button class="chip" data-go="signs/sign/${s}">${esc(SIGNS[s].name)}</button>`).join("")}</div></section>`:""}
   <p class="tiny muted">Sources: ${(t.src||[]).map(esc).join(" · ")}</p>`;
  techBindConf(root);
  $("#tnarr").addEventListener("click",()=>{if(!speechOK()){toast("No speech voice in this browser");return;}
    const q=[`${t.name}.`,...items.map(x=>`${x.setup?"Set up":"Step "+(x.i+1)}. ${x.do}. Why: ${x.why}`)];let i=0;const go=()=>{if(i<q.length&&document.body.contains($("#tnarr"))){say(q[i++],go);}};go();toast("Reading the steps aloud. Leave the page to stop.");});
  if(imgSign)Img.bindGalleries(root);
}
route("learn:tech",(id)=>id?(techById(id)||{}).name||"Technique":"Technique clinic",(root,id)=>id?techPage(root,id):techListView(root));

/* the "Writing it down" field holds "Normal: … Abnormal: …" */
function techDocParts(t){const d=String(t.document||"");const m=d.match(/^\s*Normal:\s*([\s\S]*?)\s*(?:Abnormal(?: example)?:\s*([\s\S]*))?$/);return m?{normal:m[1].trim(),abnormal:(m[2]||"").trim()}:{normal:"",abnormal:""};}
const techFirstSentence=s=>{const m=String(s||"").match(/^[\s\S]*?[.!?](\s|$)/);return (m?m[0]:String(s||"")).trim();};

/* ---------- pocket card: one screen, prints cleanly ---------- */
route("learn:techpocket",(id)=>{const t=id&&techById(id);return t?"Pocket card: "+t.name:"Pocket card";},(root,id)=>{
  const t=techById(id);if(!t)throw new Error("Technique not found");techHideToast();
  const items=techItems(t),doc=techDocParts(t),figId=TECH_FIG[id];
  const byPh=items.phases.map(p=>[p,items.filter(x=>x.phase===p)]).filter(x=>x[1].length);let n=0;
  root.innerHTML=`<article class="tk-pocket" aria-label="Pocket card">
    <header class="tk-ph"><div><span class="eyebrow">Pocket card · ${esc(t.group)}</span><h1>${esc(t.name)}</h1>${t.hook?`<p class="tk-hook">${esc(t.hook)}</p>`:""}</div>${figId?`<div class="tk-thumb">${fig(figId,{small:true,nocap:true})}</div>`:""}</header>
    <div class="tk-pcols"><ol class="tk-psteps">${byPh.map(([p,L])=>`<li class="tk-pph">${esc(p)}</li>${L.map(x=>`<li class="tk-pst${x.need!=="core"?" tkopt":""}"><span class="mono">${++n}</span><span>${esc(x.short)}${x.need==="optional"?' <i>if needed</i>':""}${x.timer?` <i>${x.timer} s</i>`:""}</span></li>`).join("")}`).join("")}</ol>
    <div class="tk-pside">${t.normal?`<div><b>Normal</b> ${esc(techFirstSentence(t.normal))}</div>`:""}
     ${t.errors&&t.errors.length?`<div><b>Don't</b><ul>${t.errors.slice(0,3).map(e=>`<li>${esc(e.error)}</li>`).join("")}</ul></div>`:""}
     ${doc.normal?`<div><b>Write</b> <span class="mono">${esc(doc.normal)}</span></div>`:""}</div></div>
   </article>
   <div class="row-x noprint" style="margin-top:12px"><button class="btn sm" data-go="practice/techrep/${id}">${ic("check")}Use it as a checklist now</button><button class="btn sm ghost" id="tkprint">Print</button><button class="btn sm ghost" data-go="learn/tech/${id}" data-rp-full>Full technique</button></div>`;
  $("#tkprint").addEventListener("click",()=>window.print());
});

/* ---------- spaced cards for missed reasons ---------- */
function techQueueCard(cid){if(typeof CARDS==="undefined"||!Store.s.srs)return false;if(!CARDS&&typeof buildCards==="function")buildCards();if(!CARDS||!CARDS.some(c=>c.id===cid))return false;
  const today=typeof dayNum==="function"?dayNum():Math.floor(Date.now()/864e5);const r=Store.s.srs[cid];
  if(r){r.due=Math.min(r.due,today);r.last=Date.now();}else Store.s.srs[cid]={iv:0,ef:2.5,n:0,l:1,due:today,first:today,last:Date.now()};return true;}

/* keyboard and controller: keep focus on the drill after each redraw */
function techRefocus(root,sel,idx){const L=$$(sel,root).filter(b=>!b.disabled);if(!L.length)return;const b=L[Math.min(Math.max(idx||0,0),L.length-1)];try{b.focus({preventScroll:true});}catch(e){}}
const techFocusedIn=root=>document.activeElement&&root.contains(document.activeElement)&&document.activeElement!==root;

/* ---------- walk-through: predict the why ---------- */
route("practice:techwalk",(id)=>{const t=id&&techById(id);return t?"Walk-through: "+t.name:"Walk-through";},(root,id)=>{
  const t=techById(id);if(!t)throw new Error("Technique not found");techHideToast();
  const S={i:0,known:0,shown:false,missed:[]};const steps=techItems(t);
  const draw=()=>{const hadFocus=techFocusedIn(root);
    if(S.i>=steps.length){const pct=S.known/steps.length;const best=Math.max(techRec(id).walk||0,pct);techSave(id,{walk:best});Store.s.xp=(Store.s.xp||0)+Math.round(steps.length/2);tick(2,"hands");
      let queued=0;S.missed.forEach(x=>{if(!x.setup&&!x.nocard&&techQueueCard(`tw:${id}:${x.i}`))queued++;});Store.save();
      root.innerHTML=`<section class="ph"><span class="eyebrow">Walk-through · done</span><h1>${S.known} of ${steps.length} reasons recalled</h1><p class="lede">${!S.missed.length?"Every reason recalled. That is the understanding that makes the technique stick. Now do it at the bedside and log the rep.":queued?`${queued} missed reason${queued>1?"s are":" is"} now due as ${queued>1?"cards":"a card"} in your next session.${S.missed.some(x=>x.setup)?" Set-up reasons have no cards: read them again below.":""}`:"Read the reasons you missed again below."}</p></section>
       ${S.missed.length?`<section class="section"><span class="label">The ones to read again</span><div class="stack" style="gap:8px">${S.missed.map(x=>`<div class="card pad-s stack" style="gap:4px"><b style="font-weight:600">${esc(x.short)}</b><span class="small"><span class="muted">Why:</span> ${esc(x.why)}</span></div>`).join("")}</div></section>`:""}
       ${techConfHTML(id,"Rate your confidence again")}
       <div class="row-x"><button class="btn" data-go="practice/techrep/${id}">${ic("check")}Bedside checklist</button><button class="btn ghost" data-go="practice/techorder/${id}">${ic("shuffle")}Put it in order</button><button class="btn ghost" data-go="learn/tech/${id}" data-rp-full>Back to the technique</button></div>`;techBindConf(root);if(hadFocus)techRefocus(root,".btn",0);return;}
    const s=steps[S.i];
    root.innerHTML=`<div class="progress-top"><button class="iconbtn" data-go="learn/tech/${id}" data-rp-full aria-label="Leave">${ic("close")}</button><div class="meter"><i style="width:${Math.round(S.i/steps.length*100)}%"></i></div><span class="mono small muted">${S.i+1}/${steps.length}</span></div>
     <article class="fc"><div class="row-x"><span class="tag">${s.setup?"Set up":"Step "+(s.i+1)} · ${esc(s.phase)}</span><span class="pill">${esc(t.name)}</span></div>
      <div class="q">${esc(s.do)}<small>Why exactly this way? Say the reason out loud, then reveal.</small></div>
      <div id="wa">${S.shown?`<div class="ans"><p><b>Why:</b> ${esc(s.why)}</p>${s.cue?`<div class="note good small"><b>You know it's right when</b> ${esc(s.cue)}</div>`:""}<div class="row-x"><button class="btn soft" data-k="0">I didn't have it</button><button class="btn" data-k="1">I had it</button></div></div>`:`<button class="btn block" id="wr">Reveal the reason</button>`}</div></article>
     <p class="tiny muted" style="text-align:center">Space reveals · 1 missed · 2 had it</p>`;
    const rv=$("#wr",root);if(rv)rv.addEventListener("click",()=>{S.shown=true;draw();techRefocus(root,"[data-k]",1);});
    $$("[data-k]",root).forEach(b=>b.addEventListener("click",()=>{if(+b.dataset.k)S.known++;else S.missed.push(s);S.i++;S.shown=false;draw();window.scrollTo(0,0);techRefocus(root,"#wr,.btn",0);}));
    if(hadFocus)techRefocus(root,S.shown?"[data-k]":"#wr",S.shown?1:0);
  };
  KEYS.handler=e=>{if(!document.body.contains(root))return;if(e.key===" "&&!S.shown&&S.i<steps.length){e.preventDefault();S.shown=true;draw();techRefocus(root,"[data-k]",1);}else if(S.shown&&(e.key==="1"||e.key==="2")){const b=$(`[data-k="${e.key==="2"?1:0}"]`,root);b&&b.click();}};
  draw();
});

/* ---------- order drill: phases, equivalent orders, specific feedback ---------- */
function techPref(k,v){try{if(v===undefined)return localStorage.getItem("galen.tk."+k);localStorage.setItem("galen.tk."+k,v);}catch(e){return null;}}
route("practice:techorder",(id)=>{const t=id&&techById(id);return t?"Put it in order: "+t.name:"Put it in order";},(root,id)=>{
  techHideToast();
  if(id==="random"||!id){const L=techList();const pick=L.length?L[Math.floor(Math.random()*L.length)].id:null;if(!pick)throw new Error("No techniques yet");
    root.innerHTML=`<p class="muted">Choosing a technique…</p>`;setTimeout(()=>replace("techorder",pick),0);return;}
  const t=techById(id);if(!t)throw new Error("Technique not found");
  const all=techItems(t);
  const items=all.filter(x=>!x.noOrder&&(!x.alt||x.variant===all.alts[x.alt][0]));items.phases=all.phases.filter(p=>items.some(x=>x.phase===p));techOrderModel(items);
  const altNote=Object.keys(all.alts).map(a=>`${techCap(a)}: ${all.alts[a][0]}`).join(" · ");
  let pool=shuf(items);const S={placed:[],set:new Set(),miss:0,fb:null,missAt:{},full:techPref("full")==="1"};
  const draw=()=>{const hadFocus=techFocusedIn(root);const done=S.placed.length>=items.length;
    const curPh=done?null:items.filter(x=>!S.set.has(x.n)).reduce((a,x)=>Math.min(a,x._pr),99);
    let lastPh=null;
    root.innerHTML=`<section class="ph"><span class="eyebrow">Put it in order · ${esc(t.group)}</span><h1>${esc(t.name)}</h1><p class="lede">${done?(S.miss?`Done with ${S.miss} misplaced tap${S.miss>1?"s":""}. Run it again until it is clean.`:"Clean run. The sequence is yours."):`Tap the steps in the order you would do them. ${items.phases.length} phases: ${items.phases.map(esc).join(", ")}. Where the order genuinely does not matter, any order is accepted.`}${altNote&&!done?` <span class="small muted">Version: ${esc(altNote)}.</span>`:""}</p></section>
     ${S.placed.length?`<ol class="tk-placed">${S.placed.map((x,k)=>{const h=x.phase!==lastPh?`<li class="tk-phh">${esc(x.phase)}</li>`:"";lastPh=x.phase;return `${h}<li class="tk-pl"><span class="mono">${String(k+1).padStart(2,"0")}</span><span>${esc(x.short)}</span>${ic("check")}</li>`;}).join("")}</ol>`:""}
     ${done?`${techConfHTML(id,"Rate your confidence again")}<div class="row-x"><button class="btn" id="again">${ic("repeat")}Again</button><button class="btn ghost" data-go="learn/tech/${id}" data-rp-full>Back to the technique</button><button class="btn ghost" data-go="practice/techorder/random">Another technique</button></div>`:
     `<div class="tk-fb" aria-live="polite">${S.fb?`<div class="note ${S.fb.ok?"good":"bad"} small">${S.fb.html}</div>`:""}</div>
      <div class="row-x" style="justify-content:space-between"><span class="tiny muted">Now: <b>${esc(items.phases[curPh]||"")}</b> · ${S.placed.length}/${items.length}</span><button class="link small" id="tkfull" aria-pressed="${S.full}">${S.full?"Short labels":"Show the full steps"}</button></div>
      <div class="opts tk-opts">${pool.filter(x=>!S.set.has(x.n)).map((x,j)=>`<button class="opt${S.fb&&S.fb.wrong===x.n?" wrong":""}" data-i="${x.n}">${j<10?`<span class="kn">${(j+1)%10}</span>`:""}<span><span class="tk-os">${esc(x.short)}</span>${S.full?`<span class="why">${esc(x.do)}</span>`:""}</span></button>`).join("")}</div>`}`;
    $$("[data-i]",root).forEach(b=>b.addEventListener("click",()=>tap(+b.dataset.i)));
    const a=$("#again",root);if(a)a.addEventListener("click",()=>{pool=shuf(items);S.placed=[];S.set.clear();S.miss=0;S.fb=null;S.missAt={};draw();techRefocus(root,".opt",0);});
    const f=$("#tkfull",root);if(f)f.addEventListener("click",()=>{S.full=!S.full;techPref("full",S.full?"1":"0");draw();});
    if(done)techBindConf(root);
    if(hadFocus)techRefocus(root,done?".btn":".opt",0);
  };
  const tap=n=>{const x=items.find(y=>y.n===n);if(!x||S.set.has(n))return;
    if(techCanPlace(x,items,S.set)){S.placed.push(x);S.set.add(n);S.fb={ok:true,html:`${ic("check")} ${esc(x.short)}`};
      if(S.placed.length>=items.length){S.fb=null;const score=S.miss?Math.max(0,1-S.miss/items.length):1;techSave(id,{order:Math.max(techRec(id).order||0,score)});Store.s.xp=(Store.s.xp||0)+(S.miss?2:5);tick(1,"hands");}}
    else{S.miss++;const pos=S.placed.length;S.missAt[pos]=(S.missAt[pos]||0)+1;
      const left=items.filter(y=>!S.set.has(y.n));const curPh=left.reduce((a,y)=>Math.min(a,y._pr),99);
      let html;if(x._pr>curPh){const rest=left.filter(y=>y._pr===curPh);html=`<b>${esc(x.short)}</b> belongs to <b>${esc(x.phase)}</b>. Finish <b>${esc(items.phases[curPh])}</b> first: ${rest.slice(0,2).map(y=>esc(y.short)).join("; ")}${rest.length>2?"…":"."}`;}
      else{const before=left.filter(y=>y!==x&&y._pr===x._pr&&y.chain===x.chain&&y._slot<x._slot).sort((a,b)=>a._slot-b._slot)[0];
        html=before?`Not yet. <b>${esc(before.short)}</b> comes before <b>${esc(x.short)}</b>.${S.missAt[pos]>=2&&before.why?` <span class="muted">Why:</span> ${esc(before.why)}`:""}`:`Not yet: think about what has to happen first.`;}
      S.fb={ok:false,html,wrong:n};}
    draw();};
  KEYS.handler=e=>{if(!document.body.contains(root))return;if(/^[0-9]$/.test(e.key)){const L=$$(".tk-opts .opt",root);const b=L[e.key==="0"?9:+e.key-1];if(b){e.preventDefault();b.click();}}};
  draw();
});

/* ---------- which step does this reason belong to? ---------- */
route("practice:techwhy",(id)=>{const t=id&&id!=="all"&&techById(id);return t?"Which step? "+t.name:"Which step is this reason for?";},(root,id)=>{
  techHideToast();const mixed=id==="all"||!id;
  const pool=(mixed?techList():[techById(id)]).filter(Boolean);if(!pool.length)throw new Error("Technique not found");
  const mk=t=>{const its=techItems(t).filter(x=>x.why&&x.why.length>20);return its.map(x=>({t,x,others:its.filter(y=>y!==x&&y.short!==x.short)}));};
  let Q=shuf(pool.flatMap(mk).filter(q=>q.others.length>=3)).slice(0,mixed?10:8);
  if(!Q.length)throw new Error("Not enough steps for this drill");
  Q=Q.map(q=>Object.assign(q,{opts:shuf([q.x,...shuf(q.others).slice(0,3)])}));
  const S={i:0,right:0,ans:null};
  const draw=()=>{const hadFocus=techFocusedIn(root);
    if(S.i>=Q.length){const pct=S.right/Q.length;if(!mixed)techSave(id,{why:Math.max(techRec(id).why||0,pct)});Store.s.xp=(Store.s.xp||0)+S.right;tick(1,"hands");
      root.innerHTML=`<section class="ph"><span class="eyebrow">Which step · done</span><h1>${S.right} of ${Q.length}</h1><p class="lede">${pct>=.8?"You know what each move is for. That is what lets you adapt the technique to a difficult patient.":"The reasons you mismatched are worth a walk-through: say each one out loud before you reveal it."}</p></section>
       ${!mixed?techConfHTML(id,"Rate your confidence again"):""}
       <div class="row-x"><button class="btn" id="again">${ic("repeat")}Again</button>${!mixed?`<button class="btn ghost" data-go="practice/techwalk/${id}">${ic("play")}Walk it through</button><button class="btn ghost" data-go="learn/tech/${id}" data-rp-full>Back to the technique</button>`:`<button class="btn ghost" data-go="learn/tech">All techniques</button>`}</div>`;
      $("#again",root).addEventListener("click",()=>{S.i=0;S.right=0;S.ans=null;Q=shuf(Q).map(q=>Object.assign(q,{opts:shuf(q.opts)}));draw();});if(!mixed)techBindConf(root);if(hadFocus)techRefocus(root,".btn",0);return;}
    const q=Q[S.i];
    root.innerHTML=`<div class="progress-top"><button class="iconbtn" data-go="${mixed?"learn/tech":"learn/tech/"+id}" data-rp-full aria-label="Leave">${ic("close")}</button><div class="meter"><i style="width:${Math.round(S.i/Q.length*100)}%"></i></div><span class="mono small muted">${S.i+1}/${Q.length}</span></div>
     <article class="fc"><div class="row-x"><span class="tag">Which step is this reason for?</span><span class="pill">${esc(q.t.name)}</span></div>
      <div class="q tk-whyq">“${esc(q.x.why)}”</div>
      <div class="opts">${q.opts.map((o,j)=>`<button class="opt${S.ans!=null?(o===q.x?" right":j===S.ans?" wrong":""):""}" data-k="${j}" ${S.ans!=null?"disabled":""}><span class="kn">${j+1}</span><span>${esc(o.short)}</span></button>`).join("")}</div>
      ${S.ans!=null?`<div class="ans"><div class="verdict-line ${q.opts[S.ans]===q.x?"ok":"no"}">${ic(q.opts[S.ans]===q.x?"check":"close")}${q.opts[S.ans]===q.x?"Right":"Not quite"}</div><p class="small"><b>${q.x.setup?"Set up":"Step "+(q.x.i+1)}:</b> ${esc(q.x.do)}</p>${q.opts[S.ans]!==q.x?`<p class="small muted">${esc(q.opts[S.ans].short)}: ${esc(q.opts[S.ans].why||"")}</p>`:""}<button class="btn" id="nx">Continue</button></div>`:""}</article>
     <p class="tiny muted" style="text-align:center">1 to 4 choose · Enter continues</p>`;
    $$("[data-k]",root).forEach(b=>b.addEventListener("click",()=>{if(S.ans!=null)return;S.ans=+b.dataset.k;if(q.opts[S.ans]===q.x)S.right++;draw();}));
    const nx=$("#nx",root);if(nx){nx.addEventListener("click",()=>{S.i++;S.ans=null;draw();window.scrollTo(0,0);});nx.focus({preventScroll:true});}
    else if(hadFocus)techRefocus(root,".opt",0);
  };
  KEYS.handler=e=>{if(!document.body.contains(root))return;if(/^[1-4]$/.test(e.key)&&S.ans==null){const b=$$(".opt",root)[+e.key-1];b&&b.click();}else if(e.key==="Enter"){const n=$("#nx",root);if(n){e.preventDefault();n.click();}}};
  draw();
});

/* ---------- spot the error ---------- */
route("practice:techmcq",(id)=>{const t=id&&id!=="all"&&techById(id);return t?"Spot the error: "+t.name:"Spot the error";},(root,id)=>{
  techHideToast();const mixed=id==="all"||!id;
  let Q;if(mixed){Q=shuf(techList().flatMap(t=>(t.mcq||[]).map((q,k)=>Object.assign({tid:t.id,tname:t.name,k},q)))).slice(0,10);}
  else{const t=techById(id);if(!t)throw new Error("Technique not found");Q=shuf((t.mcq||[]).map((q,k)=>Object.assign({tid:t.id,tname:t.name,k},q)));}
  if(!Q.length)throw new Error("No scenarios for this technique yet");
  Q.forEach(q=>q._o=shuf(q.opts.map((_,k)=>k)));
  const S={i:0,right:0,ans:null,ok:{}};
  const credit=()=>{Object.keys(S.ok).forEach(tid=>{const r=techRec(tid);techSave(tid,{mcqOk:[...new Set([...(r.mcqOk||[]),...S.ok[tid]])]});});};
  const draw=()=>{const hadFocus=techFocusedIn(root);
    if(S.i>=Q.length){credit();if(!mixed)techSave(id,{mcq:Math.max(techRec(id).mcq||0,S.right)});Store.s.xp=(Store.s.xp||0)+S.right*2;tick(1,"hands");
      root.innerHTML=`<section class="ph"><span class="eyebrow">Spot the error · done</span><h1>${S.right} of ${Q.length}</h1><p class="lede">${S.right===Q.length?"Every error spotted.":"Read the errors section of the techniques you missed; that is where the fix lives."}${mixed?" Each one you got right counts towards that technique's Errors milestone.":""}</p></section>
       ${!mixed?techConfHTML(id,"Rate your confidence again"):""}
       <div class="row-x"><button class="btn" id="again">${ic("repeat")}Again</button>${!mixed?`<button class="btn ghost" data-go="learn/tech/${id}" data-rp-full>Back to the technique</button>`:`<button class="btn ghost" data-go="learn/tech">All techniques</button>`}</div>`;
      $("#again",root).addEventListener("click",()=>{S.i=0;S.right=0;S.ans=null;S.ok={};Q=shuf(Q);Q.forEach(q=>q._o=shuf(q._o));draw();});if(!mixed)techBindConf(root);if(hadFocus)techRefocus(root,".btn",0);return;}
    const q=Q[S.i],order=q._o;
    root.innerHTML=`<div class="progress-top"><button class="iconbtn" data-go="${mixed?"learn/tech":"learn/tech/"+id}" data-rp-full aria-label="Leave">${ic("close")}</button><div class="meter"><i style="width:${Math.round(S.i/Q.length*100)}%"></i></div><span class="mono small muted">${S.i+1}/${Q.length}</span></div>
     <article class="fc"><div class="row-x"><span class="tag">Spot the error</span><span class="pill">${esc(q.tname)}</span></div><div class="q" style="font-size:1.12rem">${esc(q.q)}</div>
      <div class="opts tk-mcq">${order.map((k,j)=>`<button class="opt${S.ans!=null?(k===q.a?" right":k===S.ans?" wrong":""):""}" data-k="${k}" ${S.ans!=null?"disabled":""}><span class="kn">${j+1}</span><span>${esc(q.opts[k])}</span></button>`).join("")}</div>
      ${S.ans!=null?`<div class="ans"><div class="verdict-line ${S.ans===q.a?"ok":"no"}">${ic(S.ans===q.a?"check":"close")}${S.ans===q.a?"Right":"Not quite"}</div><p>${esc(q.why)}</p>${mixed?`<button class="link small" data-go="learn/tech/${q.tid}" data-rp-full style="align-self:flex-start">Open ${esc(q.tname)}</button>`:""}<button class="btn" id="nx">Continue</button></div>`:""}</article>
     <p class="tiny muted" style="text-align:center">1 to ${order.length} choose · Enter continues</p>`;
    $$("[data-k]",root).forEach(b=>b.addEventListener("click",()=>{if(S.ans!=null)return;S.ans=+b.dataset.k;if(S.ans===q.a){S.right++;(S.ok[q.tid]||(S.ok[q.tid]=[])).push(q.k);}draw();}));
    const nx=$("#nx",root);if(nx){nx.addEventListener("click",()=>{S.i++;S.ans=null;draw();window.scrollTo(0,0);});nx.focus({preventScroll:true});}
    else if(hadFocus)techRefocus(root,".opt",0);
  };
  KEYS.handler=e=>{if(!document.body.contains(root))return;if(/^[1-9]$/.test(e.key)&&S.ans==null){const b=$$(".opt",root)[+e.key-1];b&&b.click();}else if(e.key==="Enter"){const n=$("#nx",root);if(n){e.preventDefault();n.click();}}};
  draw();
});

/* ---------- bedside checklist (self) and observed checklist (OSCE style) ---------- */
const TECH_DOPS=[["prep","Preparation","Consent, explanation, position, kit, hand hygiene"],["tech","Technique","Steps in a sensible order, correct grip and method"],["safe","Safety and comfort","Contraindications checked, gentle, stops if distressed"],["interp","Interpretation","Says what was found and what it means"],["doc","Documentation","Records the findings clearly, both sides"]];
const TECH_DOPS_L=["","Below","Meets","Above"];
const pad2t=n=>String(n).padStart(2,"0");
const techStamp=t=>{const d=new Date(t);return `${fmtDate(t)} ${pad2t(d.getHours())}:${pad2t(d.getMinutes())}`;};
let _tkAudio=null;function techBeep(){try{_tkAudio=_tkAudio||new (window.AudioContext||window.webkitAudioContext)();const a=_tkAudio,o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.setValueAtTime(.0001,a.currentTime);g.gain.exponentialRampToValueAtTime(.25,a.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.45);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.5);}catch(e){}
  try{navigator.vibrate&&navigator.vibrate([120,80,120]);}catch(e){}}
function techHabits(id,items){const reps=(techRec(id).reps||[]).filter(x=>Array.isArray(x.miss)).slice(-6);if(reps.length<2)return "";
  const cnt={};reps.forEach(x=>x.miss.forEach(m=>{const k=Array.isArray(m)?m[1]:m;cnt[k]=(cnt[k]||0)+1;}));
  const top=Object.entries(cnt).filter(e=>e[1]>=2).sort((a,b)=>b[1]-a[1]).slice(0,3);if(!top.length)return `<div class="note good small"><b>No habit to fix.</b> Nothing missed twice in your last ${reps.length} reps.</div>`;
  return `<div class="note small tk-habit"><b>Your habit to fix:</b> ${top.map(([k,n])=>`${esc(k)} (missed in ${n} of your last ${reps.length} reps)`).join("; ")}.</div>`;}
function techNote(t,items,S,obs){const doc=techDocParts(t),side=!TECH_MIDLINE.has(t.id),v=Object.values(S.v).join(", ");
  const res=side?["R","L"].map(k=>[k,S.res[k]]):[["",S.res.C]];
  const allNormal=res.every(r=>r[1]==="n"),anyDone=res.some(r=>r[1]&&r[1]!=="x");
  const lines=[`${techStamp(Date.now())}. ${t.name}${v?` (${v})`:""}.`];
  if(allNormal&&doc.normal)lines.push(doc.normal);
  else if(anyDone)lines.push(res.map(([k,r])=>`${k?k+": ":""}${r==="n"?"normal":r==="a"?"abnormal: [describe]":r==="x"?"not examined":"[result]"}`).join(". ")+".");
  else lines.push("Findings: [describe].");
  if(obs&&S.by)lines.push(`Observed by ${S.by}.`);
  return lines.join("\n");}
route("practice:techrep",(id,mode)=>{const t=id&&techById(id);return (mode==="obs"?"Observed: ":"Bedside: ")+(t?t.name:"technique");},(view,id,mode)=>{
  const root=document.createElement("div");view.innerHTML="";view.append(root);/* listeners live on this box, not on the shared view */
  const t=techById(id);if(!t)throw new Error("Technique not found");techHideToast();
  const obs=mode==="obs",items=techItems(t),side=!TECH_MIDLINE.has(id);
  const S={v:{},done:new Set(),res:{},ds:{},by:"",t0:Date.now(),timer:null,tEnd:0,tItem:null,saved:null,comment:""};
  Object.keys(items.alts).forEach(a=>S.v[a]=items.alts[a][0]);
  S.need=x=>x.alt?(S.v[x.alt]===x.variant?"core":"na"):x.need==="optional"?"optional":"core";
  const core=()=>items.filter(x=>S.need(x)==="core"),coreDone=()=>core().filter(x=>S.done.has(x.n)).length;
  const stopTimer=()=>{if(S.timer){clearInterval(S.timer);S.timer=null;}S.tItem=null;};
  const draw=()=>{const hadFocus=techFocusedIn(root);const ae=document.activeElement&&document.activeElement.dataset?document.activeElement.dataset.i:null;
    const reps=techRec(id).reps||[];const clean=reps.filter(techRepClean).length;
    if(S.saved){const rep=S.saved;
      root.innerHTML=`<section class="ph"><span class="eyebrow">${obs?"Observed rep":"Bedside rep"} · saved</span><h1>${rep.clean?"Clean rep":`${rep.of-rep.n} step${rep.of-rep.n>1?"s":""} missed`}</h1><p class="lede">${rep.clean?(clean>=3?"Three clean reps or more: this one is yours.":`${clean} clean of 3.`):"The missed steps are listed below. They are the habit to fix next time."}${obs&&rep.ds?` Observer rating ${rep.ds.reduce((a,b)=>a+b,0)} of ${rep.ds.length*3}.`:""}</p></section>
       ${rep.miss&&rep.miss.length?`<div class="note bad small"><b>Missed:</b> ${rep.miss.map(m=>esc(m[1])).join("; ")}</div>`:""}
       ${techHabits(id,items)}
       <section class="section"><span class="label">Documentation note</span><textarea id="tknote" class="tk-note" rows="6" aria-label="Documentation note">${esc(rep.note||"")}</textarea>
        <p class="tiny muted">Edit it, then copy it into the notes. Keep patient identifiers out of the app.</p>
        <div class="row-x"><button class="btn sm" id="tkcopy">${ic("check")}Copy the note</button></div></section>
       ${techConfHTML(id,"Rate your confidence again")}
       <div class="row-x"><button class="btn" id="tknew">${ic("repeat")}Another rep</button><button class="btn ghost" data-go="learn/tech/${id}" data-rp-full>Back to the technique</button></div>`;
      techBindConf(root);
      $("#tknote",root).addEventListener("change",e=>{const rr=techRec(id);const L=(rr.reps||[]).map(x=>x.t===rep.t?Object.assign({},x,{note:e.target.value.slice(0,2000)}):x);techSave(id,{reps:L});});
      $("#tkcopy",root).addEventListener("click",()=>{const v=$("#tknote",root).value;try{navigator.clipboard.writeText(v).then(()=>toast("Note copied","good"),()=>toast("Couldn't copy: select the text instead"));}catch(e){toast("Couldn't copy: select the text instead");}});
      $("#tknew",root).addEventListener("click",()=>{S.saved=null;S.done.clear();S.res={};S.ds={};S.t0=Date.now();draw();window.scrollTo(0,0);});
      if(hadFocus)techRefocus(root,".btn",0);return;}
    const byPh=items.phases.map(p=>[p,items.filter(x=>x.phase===p&&S.need(x)!=="na")]).filter(x=>x[1].length);let num=0;
    const obsReps=reps.filter(x=>x.obs&&Array.isArray(x.ds));
    root.innerHTML=`<section class="ph"><span class="eyebrow">${obs?"Observed checklist":"Bedside checklist"} · ${clean} clean of 3</span><h1>${esc(t.name)}</h1><p class="lede">${obs?"Hand the phone to the colleague watching you. They tick each step as they see you do it, then rate five areas. Optional steps never count against you.":"Do it on a patient, a colleague or yourself. Tap each step as you actually do it, not from memory afterwards. A rep is clean when every core step is done; optional steps and the versions you did not pick do not count."}</p></section>
     ${Object.keys(items.alts).map(a=>`<div class="tk-alt"><span class="label">${esc(techCap(a))}</span><div class="chips" role="group" aria-label="${esc(techCap(a))}">${items.alts[a].map(v=>`<button class="chip${S.v[a]===v?" on":""}" data-alt="${esc(a)}" data-v="${esc(v)}" aria-pressed="${S.v[a]===v}">${esc(v)}</button>`).join("")}</div></div>`).join("")}
     ${!obs?techHabits(id,items):""}
     <div class="tk-rep">${byPh.map(([p,L])=>`<div class="tk-repph">${esc(p)}</div>${L.map(x=>{num++;const on=S.done.has(x.n),opt=S.need(x)==="optional";const run=S.tItem===x.n;
       return `<div class="tk-ri${on?" on":""}${opt?" tkopt":""}"><button class="tk-rb" data-i="${x.n}" aria-pressed="${on}"><span class="tk-box">${on?ic("check"):`<span class="mono">${num}</span>`}</span><span class="tk-rt"><b>${esc(x.short)}</b>${opt?`<span class="tag">if needed</span>`:""}</span></button>${x.timer?`<button class="tk-tm${run?" run":""}" data-tm="${x.n}" aria-label="${run?"Stop":"Start"} ${x.timer} second timer">${ic("timer")}<span class="mono" id="tm${x.n}">${run?Math.max(0,Math.ceil((S.tEnd-Date.now())/1000)):x.timer} s</span></button>`:""}</div>`;}).join("")}`).join("")}</div>
     <section class="section tk-sec"><span class="label">Result${side?" by side":""}</span><div class="tk-res">${(side?[["R","Right"],["L","Left"]]:[["C","Result"]]).map(([k,l])=>`<div class="tk-resr"><span>${l}</span><div class="chips">${[["n","Normal"],["a","Abnormal"],["x","Not done"]].map(([v,vl])=>`<button class="chip${S.res[k]===v?" on":""}" data-res="${k}" data-v="${v}" aria-pressed="${S.res[k]===v}">${vl}</button>`).join("")}</div></div>`).join("")}</div></section>
     ${obs?`<section class="section tk-sec"><span class="label">Observer's rating</span><div class="tk-dops">${TECH_DOPS.map(([k,l,s])=>`<div class="tk-dr"><div><b>${l}</b><span class="tiny muted">${s}</span></div><div class="chips">${[1,2,3].map(v=>`<button class="chip${S.ds[k]===v?" on":""}" data-ds="${k}" data-v="${v}" aria-pressed="${S.ds[k]===v}">${TECH_DOPS_L[v]}</button>`).join("")}</div></div>`).join("")}</div>
      <label class="tk-by"><span class="label">Observer (initials or role, optional)</span><input id="tkby" maxlength="40" value="${esc(S.by)}" autocomplete="off"></label>
      <label class="tk-by"><span class="label">One thing to keep, one to change (optional)</span><input id="tkcm" maxlength="200" value="${esc(S.comment)}" autocomplete="off"></label>
      <p class="tiny muted">A simplified DOPS-style rating: below, meeting or above what you expect of a competent doctor for this skill.</p></section>`:""}
     <div class="row-x tk-save"><button class="btn" id="save">${ic("check")}Save the rep (${coreDone()}/${core().length} core)</button>${obs?`<button class="btn ghost" data-go="practice/techrep/${id}">Self checklist</button>`:`<button class="btn ghost" data-go="practice/techrep/${id}/obs">${ic("observe")}A colleague is watching</button>`}</div>
     ${obsReps.length?`<section class="section"><span class="label">Observed ratings against your confidence</span><div class="list">${obsReps.slice(-5).reverse().map(x=>{const sc=x.ds.reduce((a,b)=>a+b,0),mx=x.ds.length*3;const cf=(techRec(id).conf||[]).filter(c=>c[0]<=x.t).pop();return `<div class="lrow"><span class="txt"><b>${fmtDate(x.t)}: ${sc} of ${mx}</b><span>${cf?`You rated yourself ${cf[1]} of 5 (${CONF_L[cf[1]]}) before it`:"No self rating before it"}${x.by?` · ${esc(x.by)}`:""}${x.cm?` · “${esc(x.cm)}”`:""}</span></span></div>`;}).join("")}</div></section>`:""}
     ${reps.length?`<section class="section"><span class="label">Your reps</span><div class="list">${reps.slice().reverse().slice(0,8).map(x=>`<div class="lrow"><span class="dot${techRepClean(x)?" on":""}"></span><span class="txt"><b>${fmtDate(x.t)}</b><span>${x.n}/${x.of} ${x.miss?"core ":""}steps${x.obs?" · observed":""}${x.v&&Object.keys(x.v).length?" · "+esc(Object.values(x.v).join(", ")):""}${x.miss&&x.miss.length?" · missed "+esc(x.miss.map(m=>m[1]).join("; ")):""}</span></span></div>`).join("")}</div></section>`:""}
     <p class="tiny muted">Keys: 1 to 9 tick a step · T starts the next timer · S saves.</p>`;
    if(hadFocus){const b=ae!=null&&$(`[data-i="${ae}"]`,root);if(b)b.focus({preventScroll:true});else techRefocus(root,".tk-rb",0);}
  };
  const setLabel=()=>{const b=$("#save",root);if(b)b.innerHTML=`${ic("check")}Save the rep (${coreDone()}/${core().length} core)`;};
  const startTimer=n=>{const x=items.find(y=>y.n===n);if(!x)return;if(S.tItem===n){stopTimer();draw();return;}stopTimer();S.tItem=n;S.tEnd=Date.now()+x.timer*1000;
    S.timer=setInterval(()=>{if(!document.body.contains(root)){stopTimer();return;}const left=Math.ceil((S.tEnd-Date.now())/1000);const el=$("#tm"+n,root);if(el)el.textContent=Math.max(0,left)+" s";
      if(left<=0){stopTimer();techBeep();toast(`${x.timer} s: time`,"good");draw();}},250);draw();};
  root.addEventListener("click",e=>{
    const b=e.target.closest("[data-i]");if(b&&root.contains(b)){const n=+b.dataset.i;S.done.has(n)?S.done.delete(n):S.done.add(n);
      const ri=b.closest(".tk-ri");if(ri){const on=S.done.has(n);ri.classList.toggle("on",on);b.setAttribute("aria-pressed",on);const box=$(".tk-box",b);const idx=$$(".tk-rb",root).indexOf(b)+1;box.innerHTML=on?ic("check"):`<span class="mono">${idx}</span>`;}setLabel();return;}
    const tm=e.target.closest("[data-tm]");if(tm){startTimer(+tm.dataset.tm);return;}
    const al=e.target.closest("[data-alt]");if(al){S.v[al.dataset.alt]=al.dataset.v;draw();return;}
    const rs=e.target.closest("[data-res]");if(rs){S.res[rs.dataset.res]=S.res[rs.dataset.res]===rs.dataset.v?undefined:rs.dataset.v;$$(`[data-res="${rs.dataset.res}"]`,root).forEach(c=>{const on=c.dataset.v===S.res[rs.dataset.res];c.classList.toggle("on",on);c.setAttribute("aria-pressed",on);});return;}
    const d=e.target.closest("[data-ds]");if(d){S.ds[d.dataset.ds]=+d.dataset.v;$$(`[data-ds="${d.dataset.ds}"]`,root).forEach(c=>{const on=+c.dataset.v===S.ds[d.dataset.ds];c.classList.toggle("on",on);c.setAttribute("aria-pressed",on);});return;}
    if(e.target.closest("#save"))save();
  });
  root.addEventListener("input",e=>{if(e.target.id==="tkby")S.by=e.target.value;if(e.target.id==="tkcm")S.comment=e.target.value;});
  const save=()=>{if(obs&&TECH_DOPS.some(([k])=>!S.ds[k])){toast("Ask the observer to rate all five areas");const f=$("[data-ds]",root);f&&f.scrollIntoView({block:"center"});return;}
    stopTimer();const C=core(),miss=C.filter(x=>!S.done.has(x.n)).map(x=>[x.k,x.short]);
    const rep={t:Date.now(),n:C.length-miss.length,of:C.length,obs,clean:!miss.length,miss,v:Object.assign({},S.v),res:Object.assign({},S.res),dur:Math.round((Date.now()-S.t0)/1000)};
    if(obs){rep.ds=TECH_DOPS.map(([k])=>S.ds[k]);if(S.by.trim())rep.by=S.by.trim().slice(0,40);if(S.comment.trim())rep.cm=S.comment.trim().slice(0,200);}
    S.by=S.by.trim();rep.note=techNote(t,items,S,obs);
    const rr=techRec(id);techSave(id,{reps:[...(rr.reps||[]),rep].slice(-30)});
    Store.s.xp=(Store.s.xp||0)+(rep.clean?6:2)+(obs?2:0);tick(2,"hands");S.saved=rep;draw();window.scrollTo(0,0);};
  KEYS.handler=e=>{if(!document.body.contains(root)||S.saved)return;const k=e.key.toLowerCase();
    if(/^[1-9]$/.test(k)){const b=$$(".tk-rb",root)[+k-1];if(b){e.preventDefault();b.click();}}
    else if(k==="t"){const tms=$$("[data-tm]",root);const nx=tms.find(b=>{const n=+b.dataset.tm;return !S.done.has(n);})||tms[0];if(nx){e.preventDefault();nx.click();}}
    else if(k==="s"){e.preventDefault();save();}};
  draw();
});

/* ---------- spaced cards: why each step, and the error behind each fix ---------- */
CARD_TYPE_LABEL.twhy="Why this step";CARD_TYPE_LABEL.terr="Technique error";AUTO.terr=1;
/* option order for error cards: shuffled once per card per day so the key is never in a fixed place */
function techOptOrder(cid,n){let h=2166136261;const s=cid+"|"+(typeof dayNum==="function"?dayNum():0);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  const o=[...Array(n).keys()];for(let i=n-1;i>0;i--){h=Math.imul(h^(h>>>13),1103515245)+12345|0;const j=Math.abs(h)%(i+1);[o[i],o[j]]=[o[j],o[i]];}return o;}
(()=>{const orig=cardBody;window.cardBody=function(c){
  if(c.type==="twhy"){const t=techById(c.ref[0]);const s=t&&t.steps[c.ref[1]];if(!s)return orig(c);const x=techItems(t).find(y=>!y.setup&&y.i===c.ref[1])||{short:s.do};const shortQ=x.short&&x.short!==s.do;
    return {q:`${esc(shortQ?x.short:s.do)}<small>${esc(t.name)}, step ${c.ref[1]+1}. Why is it done exactly this way?</small>`,a:`${shortQ?`<p class="small muted">${esc(s.do)}</p>`:""}<p>${esc(s.why)}</p>${s.cue?`<div class="note good small"><b>You know it's right when</b> ${esc(s.cue)}</div>`:""}${TECH_FIG[t.id]&&c.ref[1]<2?fig(TECH_FIG[t.id],{small:true,nocap:true}):""}<button class="link small" data-go="learn/tech/${t.id}" style="align-self:flex-start">Open the technique</button>`};}
  if(c.type==="terr"){const t=techById(c.ref[0]);const q=t&&(t.mcq||[])[c.ref[1]];if(!q)return orig(c);const o=techOptOrder(c.id,q.opts.length);
    return {q:`${esc(q.q)}<small>${esc(t.name)}</small>`,opts:o.map(k=>({l:q.opts[k],ok:k===q.a})),explain:`<p class="small">${esc(q.why)}</p><button class="link small" data-go="learn/tech/${t.id}" style="align-self:flex-start">Open the technique</button>`};}
  return orig(c);};})();
/* steps that are pure record-keeping make poor "why" cards; 70b-cards.js can skip them with this */
function techStepNoCard(id,i){const x=techItems(id).find(y=>!y.setup&&y.i===i);return !!(x&&x.nocard);}

/* ---------- technique of the day (for Today) ----------
 Rotates between three pools so no technique comes back day after day: weak (rated 3 or below, not mastered),
 never rated, and stale (not touched for 14 days). Consecutive days draw from different pools. */
function techOfDay(){const L=techList();if(!L.length)return null;
  const now=Date.now(),D14=14*864e5,todo=L.filter(t=>techDone(t.id)<5);
  const weak=todo.filter(t=>techConf(t.id)!=null&&techConf(t.id)<=3).sort((a,b)=>techConf(a.id)-techConf(b.id)||a.id.localeCompare(b.id));
  const unrated=L.filter(t=>techConf(t.id)==null);
  const stale=L.filter(t=>{const r=techRec(t.id);return r.t&&now-r.t>D14&&!weak.includes(t);}).sort((a,b)=>techRec(a.id).t-techRec(b.id).t);
  const pools=[weak,unrated,stale].filter(p=>p.length);if(!pools.length)pools.push(todo.length?todo:L);
  const d=typeof dayNum==="function"?dayNum():Math.floor(now/864e5);
  const P=pools[d%pools.length],k=Math.floor(d/pools.length)%P.length;let pick=P[k];
  if(pools.length===1&&P.length>1){const prev=P[Math.floor((d-1)/pools.length)%P.length];if(prev===pick)pick=P[(k+1)%P.length];}
  return pick;}
