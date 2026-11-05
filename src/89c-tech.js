"use strict";
/* ================= TECHNIQUE CLINIC =================
 For examinations you already do but want to be certain of: the proper technique, the reason behind each move,
 the errors that fool you, and drills that rebuild it from several angles (walk-through, order, spot the error,
 narrated run, bedside reps with a checklist, confidence before and after, spaced "why" cards).
 Progress lives in Store.s.notes["tech:<id>"] = {t, conf:[[t,v]...], walk, order, mcq, reps:[{t,n,of,obs}]} (synced, latest wins). */
const TECH_FIG={"otoscopy":"tech-otoscope","direct-ophthalmoscopy":"tech-ophthalmoscope","anterior-rhinoscopy":"tech-rhinoscopy","tinel":"tech-tinel","dix-hallpike":"tech-hallpike","hints":"tech-head-impulse","tendon-reflexes":"tech-reflex","plantar-response":"tech-plantar","tuning-fork":"tech-tuning-fork"};
const TECH_GROUP_IC={"Ear, nose and eye":"eye","Peripheral nerve":"bolt","Sensory":"card","Reflexes and tone":"target","Coordination and gait":"mind","Vestibular and eye movements":"repeat","Meninges and functional":"case"};
const TECH_GROUP_ORDER=["Ear, nose and eye","Peripheral nerve","Sensory","Reflexes and tone","Coordination and gait","Vestibular and eye movements","Meninges and functional"];
const techList=()=>typeof TECH!=="undefined"?TECH:[];
const techById=id=>techList().find(t=>t.id===id);
const techSys=t=>t.group==="Ear, nose and eye"?"hn":"neuro";
function techRec(id){return Store.s.notes["tech:"+id]||{};}
function techSave(id,patch){const r=Object.assign({},techRec(id),patch,{t:Date.now()});Store.s.notes["tech:"+id]=r;Store.save();return r;}
function techConf(id){const c=techRec(id).conf||[];return c.length?c[c.length-1][1]:null;}
function techFirstConf(id){const c=techRec(id).conf||[];return c.length?c[0][1]:null;}
/* five milestones: read it, walked it, ordered it, spotted the errors, three clean bedside reps */
function techMilestones(id){const r=techRec(id),t=techById(id);const clean=(r.reps||[]).filter(x=>x.n>=x.of).length;
  return [["Read",!!r.read],["Walk-through",(r.walk||0)>=0.8],["Order",(r.order||0)>=1],["Errors",t&&(r.mcq||0)>=(t.mcq||[]).length],["3 clean reps",clean>=3]];}
const techDone=id=>techMilestones(id).filter(m=>m[1]).length;
const pips=(id)=>`<span class="mdots" title="${techMilestones(id).map(m=>(m[1]?"✓ ":"· ")+m[0]).join("\n")}">${techMilestones(id).map(m=>`<i class="${m[1]?"on":""}"></i>`).join("")}</span>`;
const CONF_L=["","Unsure","Shaky","Okay","Confident","Certain"];

/* ---------- list ---------- */
function techListView(root){
  const L=techList();const by={};L.forEach(t=>(by[t.group]||(by[t.group]=[])).push(t));
  const mastered=L.filter(t=>techDone(t.id)===5).length,rated=L.filter(t=>techConf(t.id)!=null);
  const gain=rated.filter(t=>(techRec(t.id).conf||[]).length>1).map(t=>techConf(t.id)-techFirstConf(t.id));
  root.innerHTML=`<section class="ph"><span class="eyebrow">Technique clinic</span><h1>Do it right, know why</h1><p class="lede">For the examinations you already do but want to be certain of. Each one breaks down into the proper steps, the reason behind every move, how to tell you got it right, the errors that fool good clinicians and how to rescue a difficult view. Then you rebuild it five ways until it is automatic.</p></section>
   <div class="facts"><div class="fact"><span class="label">Techniques</span><div><b class="mono">${L.length}</b></div></div><div class="fact"><span class="label">Mastered</span><div><b class="mono">${mastered}</b> of ${L.length}</div></div><div class="fact"><span class="label">Confidence gained</span><div><b class="mono">${gain.length?(gain.reduce((a,b)=>a+b,0)>=0?"+":"")+gain.reduce((a,b)=>a+b,0):"–"}</b> ${gain.length?"points":"rate one to start"}</div></div></div>
   <div class="row-x"><button class="btn sm" data-go="practice/techmcq/all">${ic("target")}Spot the error: mixed</button><button class="btn sm ghost" data-go="practice/techorder/random">${ic("shuffle")}Put a random one in order</button></div>
   ${TECH_GROUP_ORDER.filter(g=>by[g]).map(g=>`<section class="section"><span class="label">${esc(g)}</span><div class="list">${by[g].map(t=>{const c=techConf(t.id);return `<button class="lrow" data-go="learn/tech/${t.id}"><span class="icwrap">${ic(TECH_GROUP_IC[g]||"mind")}</span><span class="txt"><b>${esc(t.name)}</b><span>${esc(t.hook||t.purpose)}</span></span><span class="stack" style="gap:4px;align-items:flex-end">${pips(t.id)}${c!=null?`<span class="tiny muted">${CONF_L[c]}</span>`:""}</span></button>`;}).join("")}</div></section>`).join("")}
   ${L.length?"":`<div class="empty">Techniques are being written.</div>`}
   <p class="tiny muted">The five dots: read it · walked it through · put the steps in order · spotted every error · three clean bedside reps. Hold any row for more.</p>`;
}

/* ---------- technique page ---------- */
function techPage(root,id){
  const t=techById(id);if(!t)throw new Error("Technique not found");
  const r=techRec(id);if(!r.read)techSave(id,{read:Date.now()});
  const c=techConf(id),first=techFirstConf(id);
  const figId=TECH_FIG[id];const imgSign=(t.signs||[]).find(s=>IMG_SUBJECTS[s]);
  const n=t.steps.length;
  root.innerHTML=`<section class="ph"><span class="eyebrow">${esc(t.group)} · technique</span><h1>${esc(t.name)}</h1><p class="lede">${esc(t.purpose)}</p>${t.hook?`<p class="quote">${esc(t.hook)}</p>`:""}</section>
   <div class="card stack" style="gap:10px"><div class="row-x"><span class="eyebrow">How sure are you of your technique?</span><span class="spacer"></span>${pips(id)}</div>
    <div class="chips" id="tconf">${[1,2,3,4,5].map(v=>`<button class="chip${c===v?" on":""}" data-c="${v}">${v} · ${CONF_L[v]}</button>`).join("")}</div>
    ${first!=null&&c!=null&&(r.conf||[]).length>1?`<p class="small muted">Started at ${first} (${CONF_L[first]}), now ${c} (${CONF_L[c]}).</p>`:`<p class="small muted">Rate it now, then again after the drills. The change is the point.</p>`}</div>
   <div class="grid">${[
     ["practice/techwalk/"+id,"play","Walk it through","One step at a time: say why before you reveal it."],
     ["practice/techorder/"+id,"shuffle","Put it in order",`${n} steps, shuffled.`],
     ["practice/techmcq/"+id,"target","Spot the error",`${(t.mcq||[]).length} scenarios of technique going wrong.`],
     ["practice/techrep/"+id,"check","Log a bedside rep","Tick each step as you do it on a patient."]
   ].map(([go,i,h,s])=>`<button class="tile" data-go="${go}"><div class="t-top"><span class="icwrap">${ic(i)}</span></div><b>${h}</b><span class="sub">${s}</span></button>`).join("")}</div>
   <div class="row-x"><button class="btn sm soft" id="tnarr">${ic("sounds")}Read it to me</button><button class="btn sm ghost" data-go="learn/techpocket/${id}">${ic("pocket")}Pocket card</button></div>
   ${figId?fig(figId):""}
   ${t.kit&&t.kit.length?`<section class="sec"><h3>Kit</h3><ul class="prose" style="padding-left:1.1em">${t.kit.map(k=>`<li>${esc(k)}</li>`).join("")}</ul></section>`:""}
   ${t.setup&&t.setup.length?`<section class="section"><span class="label">Set up, and why</span><div class="stack" style="gap:8px">${t.setup.map(s=>`<div class="card pad-s stack" style="gap:4px"><span style="font-weight:600">${esc(s.do)}</span><span class="small"><span class="muted">Why:</span> ${esc(s.why)}</span></div>`).join("")}</div></section>`:""}
   <section class="section"><span class="label">The technique, step by step</span><div class="stack" style="gap:8px">${t.steps.map((s,i)=>`<details class="acc why"${i<2?" open":""}><summary><span class="n">${String(i+1).padStart(2,"0")}</span><span class="st"><b>${esc(s.do)}</b></span></summary><div class="acc-body"><div><span class="k">Why</span>${esc(s.why)}</div>${s.cue?`<div class="note good"><b>You know it's right when</b> ${esc(s.cue)}</div>`:""}</div></details>`).join("")}</div></section>
   ${t.normal?`<section class="sec"><h3>Normal</h3><p>${esc(t.normal)}</p></section>`:""}
   ${t.abnormal&&t.abnormal.length?`<section class="section"><span class="label">What you might find</span><div class="tbl"><table><tr><th>Finding</th><th>Points to</th></tr>${t.abnormal.map(a=>`<tr><td style="font-weight:700">${esc(a.finding)}</td><td>${esc(a.means)}</td></tr>`).join("")}</table></div></section>`:""}
   ${t.errors&&t.errors.length?`<section class="section"><span class="label">Errors that fool good clinicians</span><div class="stack" style="gap:8px">${t.errors.map(e=>`<div class="card pad-s stack" style="gap:6px"><div class="redflag"><b>${esc(e.error)}</b></div><span class="small"><span class="muted">What it does:</span> ${esc(e.result)}</span><span class="small"><span class="muted">Fix:</span> <b>${esc(e.fix)}</b></span></div>`).join("")}</div></section>`:""}
   ${t.trouble&&t.trouble.length?`<section class="section"><span class="label">When it isn't working</span><div class="stack" style="gap:8px">${t.trouble.map(x=>`<details class="acc"><summary><span class="st"><b>“${esc(x.problem)}”</b></span></summary><div class="acc-body"><p>${esc(x.fix)}</p></div></details>`).join("")}</div></section>`:""}
   ${t.pearls&&t.pearls.length?`<section class="card stack hookcard" style="gap:8px"><span class="eyebrow">Pearls</span><ul class="prose" style="padding-left:1.1em">${t.pearls.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></section>`:""}
   ${t.evidence&&t.evidence.length?`<section class="section"><span class="label">The numbers</span><div class="stack" style="gap:6px">${t.evidence.map(e=>`<div class="lm"><b>${esc(e.stat)}</b><span class="tiny muted">${esc(e.src)}</span></div>`).join("")}</div></section>`:""}
   ${t.document?`<section class="sec"><h3>Writing it down</h3><p class="mono small" style="white-space:pre-wrap">${esc(t.document)}</p></section>`:""}
   ${imgSign?`<section class="section"><span class="label">Real examples</span>${Img.galleryHTML("s:"+imgSign,IMG_SUBJECTS[imgSign][1],{title:IMG_SUBJECTS[imgSign][0]})}</section>`:""}
   ${(t.signs||[]).filter(s=>SIGNS[s]).length?`<section class="section"><span class="label">The sign pages this serves</span><div class="chips">${t.signs.filter(s=>SIGNS[s]).map(s=>`<button class="chip" data-go="signs/sign/${s}">${esc(SIGNS[s].name)}</button>`).join("")}</div></section>`:""}
   <p class="tiny muted">Sources: ${(t.src||[]).map(esc).join(" · ")}</p>`;
  $("#tconf").addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(!b)return;const v=+b.dataset.c;const rr=techRec(id);techSave(id,{conf:[...(rr.conf||[]),[Date.now(),v]].slice(-20)});tick(1);toast(`Confidence: ${CONF_L[v]}`,"good");replace("tech",id);});
  $("#tnarr").addEventListener("click",()=>{if(!speechOK()){toast("No speech voice in this browser");return;}
    const q=[`${t.name}.`,...t.steps.map((s,i)=>`Step ${i+1}. ${s.do}. Why: ${s.why}`)];let i=0;const go=()=>{if(i<q.length&&document.body.contains($("#tnarr"))){say(q[i++],go);}};go();toast("Reading the steps aloud. Leave the page to stop.");});
  if(imgSign)Img.bindGalleries(root);
}
route("learn:tech",(id)=>id?(techById(id)||{}).name||"Technique":"Technique clinic",(root,id)=>id?techPage(root,id):techListView(root));

/* ---------- pocket card ---------- */
route("learn:techpocket",(id)=>"Pocket: "+((techById(id)||{}).name||""),(root,id)=>{
  const t=techById(id);if(!t)throw new Error("Technique not found");
  root.innerHTML=`<section class="ph"><span class="eyebrow">Pocket card</span><h1>${esc(t.name)}</h1></section>
   <div class="card stack" style="gap:10px">${t.kit&&t.kit.length?`<p class="small"><b>Kit:</b> ${t.kit.map(esc).join("; ")}</p>`:""}
   <ol class="prose" style="padding-left:1.3em;gap:8px">${[...(t.setup||[]),...t.steps].map(s=>`<li><b>${esc(s.do)}</b></li>`).join("")}</ol>
   ${t.errors&&t.errors.length?`<div class="note bad small"><b>Don't:</b> ${t.errors.slice(0,4).map(e=>esc(e.error)).join(" · ")}</div>`:""}
   ${t.hook?`<p class="quote">${esc(t.hook)}</p>`:""}</div>
   <div class="row-x"><button class="btn sm" data-go="practice/techrep/${id}">${ic("check")}Use it as a checklist now</button><button class="btn sm ghost" onclick="window.print()">Print</button></div>`;
});

/* ---------- walk-through: predict the why ---------- */
route("practice:techwalk",(id)=>"Walk-through",(root,id)=>{
  const t=techById(id);if(!t)throw new Error("Technique not found");
  const S={i:0,known:0,shown:false};const steps=[...(t.setup||[]).map(s=>Object.assign({setup:1},s)),...t.steps];
  const draw=()=>{if(S.i>=steps.length){const pct=S.known/steps.length;const best=Math.max(techRec(id).walk||0,pct);techSave(id,{walk:best});Store.s.xp=(Store.s.xp||0)+Math.round(steps.length/2);tick(2,"hands");
      root.innerHTML=`<section class="ph"><span class="eyebrow">Walk-through · done</span><h1>${S.known} of ${steps.length} reasons recalled</h1><p class="lede">${pct>=.8?"That is the understanding that makes the technique stick. Now do it at the bedside and log the rep.":"The reasons you missed are the ones to read again. They will come back as cards in your sessions."}</p></section>
       <div class="row-x"><button class="btn" data-go="practice/techrep/${id}">${ic("check")}Log a bedside rep</button><button class="btn ghost" data-go="practice/techorder/${id}">${ic("shuffle")}Put it in order</button><button class="btn ghost" data-go="learn/tech/${id}">Back to the technique</button></div>`;return;}
    const s=steps[S.i];
    root.innerHTML=`<div class="progress-top"><button class="iconbtn" data-go="learn/tech/${id}" aria-label="Leave">${ic("close")}</button><div class="meter"><i style="width:${Math.round(S.i/steps.length*100)}%"></i></div><span class="mono small muted">${S.i+1}/${steps.length}</span></div>
     <article class="fc"><div class="row-x"><span class="tag">${s.setup?"Set up":"Step "+(S.i-(t.setup||[]).length+1)}</span><span class="pill">${esc(t.name)}</span></div>
      <div class="q">${esc(s.do)}<small>Why exactly this way? Say the reason out loud, then reveal.</small></div>
      <div id="wa">${S.shown?`<div class="ans"><p><b>Why:</b> ${esc(s.why)}</p>${s.cue?`<div class="note good small"><b>You know it's right when</b> ${esc(s.cue)}</div>`:""}<div class="row-x"><button class="btn soft" data-k="0">I didn't have it</button><button class="btn" data-k="1">I had it</button></div></div>`:`<button class="btn block" id="wr">Reveal the reason</button>`}</div></article>
     <p class="tiny muted" style="text-align:center">Space reveals · 1 missed · 2 had it</p>`;
    const rv=$("#wr");if(rv)rv.addEventListener("click",()=>{S.shown=true;draw();});
    $$("[data-k]",root).forEach(b=>b.addEventListener("click",()=>{S.known+=+b.dataset.k;if(!+b.dataset.k){const cid=`tw:${id}:${S.i}`;if(Store.s.srs[cid]){Store.s.srs[cid].due=Date.now();}}S.i++;S.shown=false;draw();window.scrollTo(0,0);}));
  };
  KEYS.handler=e=>{if(!document.body.contains(root))return;if(e.key===" "&&!S.shown){e.preventDefault();S.shown=true;draw();}else if(S.shown&&(e.key==="1"||e.key==="2")){const b=$(`[data-k="${e.key==="2"?1:0}"]`,root);b&&b.click();}};
  draw();
});

/* ---------- order drill ---------- */
route("practice:techorder",(id)=>"Put it in order",(root,id)=>{
  if(id==="random"||!id){const L=techList();id=L.length?L[Math.floor(Math.random()*L.length)].id:null;}
  const t=techById(id);if(!t)throw new Error("Technique not found");
  const steps=t.steps.map((s,i)=>({i,do:s.do}));let pool=shuf(steps);while(pool.length>2&&pool.every((s,k)=>s.i===k))pool=shuf(steps);
  const S={next:0,miss:0,wrong:null};
  const draw=()=>{const done=S.next>=steps.length;
    root.innerHTML=`<section class="ph"><span class="eyebrow">Put it in order · ${esc(t.group)}</span><h1>${esc(t.name)}</h1><p class="lede">${done?(S.miss?`Done with ${S.miss} misplaced tap${S.miss>1?"s":""}. Run it again until it is clean.`:"Clean run. The sequence is yours."):"Tap the steps in the order you would do them."}</p></section>
     <ol class="stack" style="gap:6px;padding-left:0;list-style:none">${steps.slice(0,S.next).map((s,k)=>`<li class="card pad-s row-x" style="gap:10px"><span class="n mono" style="color:var(--accent-ink)">${String(k+1).padStart(2,"0")}</span><span style="flex:1;min-width:0">${esc(s.do)}</span>${ic("check")}</li>`).join("")}</ol>
     ${done?`<div class="row-x"><button class="btn" id="again">${ic("repeat")}Again</button><button class="btn ghost" data-go="learn/tech/${id}">Back to the technique</button><button class="btn ghost" data-go="practice/techorder/random">Another technique</button></div>`:
     `<div class="opts">${pool.filter(s=>s.i>=S.next).map(s=>`<button class="opt${S.wrong===s.i?" wrong":""}" data-i="${s.i}"><span>${esc(s.do)}</span></button>`).join("")}</div>`}`;
    $$("[data-i]",root).forEach(b=>b.addEventListener("click",()=>{const i=+b.dataset.i;if(i===S.next){S.next++;S.wrong=null;if(S.next>=steps.length){const score=S.miss?Math.max(0,1-S.miss/steps.length):1;techSave(id,{order:Math.max(techRec(id).order||0,score)});Store.s.xp=(Store.s.xp||0)+(S.miss?2:5);tick(1,"hands");}}else{S.miss++;S.wrong=i;const s=t.steps[S.next];toast("Not yet: think about what has to happen first");}draw();}));
    const a=$("#again",root);if(a)a.addEventListener("click",()=>{pool=shuf(steps);S.next=0;S.miss=0;S.wrong=null;draw();});
  };draw();
});

/* ---------- spot the error ---------- */
route("practice:techmcq",(id)=>id==="all"?"Spot the error":"Spot the error",(root,id)=>{
  let Q;if(id==="all"||!id){Q=shuf(techList().flatMap(t=>(t.mcq||[]).map((q,k)=>Object.assign({tid:t.id,tname:t.name,k},q)))).slice(0,10);}
  else{const t=techById(id);if(!t)throw new Error("Technique not found");Q=(t.mcq||[]).map((q,k)=>Object.assign({tid:t.id,tname:t.name,k},q));}
  const S={i:0,right:0,ans:null};
  const draw=()=>{if(S.i>=Q.length){if(id!=="all")techSave(id,{mcq:Math.max(techRec(id).mcq||0,S.right)});Store.s.xp=(Store.s.xp||0)+S.right*2;tick(1,"hands");
      root.innerHTML=`<section class="ph"><span class="eyebrow">Spot the error · done</span><h1>${S.right} of ${Q.length}</h1><p class="lede">${S.right===Q.length?"Every error spotted.":"Read the errors section of the techniques you missed; that is where the fix lives."}</p></section>
       <div class="row-x"><button class="btn" id="again">${ic("repeat")}Again</button>${id!=="all"?`<button class="btn ghost" data-go="learn/tech/${id}">Back to the technique</button>`:`<button class="btn ghost" data-go="learn/tech">All techniques</button>`}</div>`;
      $("#again").addEventListener("click",()=>{S.i=0;S.right=0;S.ans=null;if(id==="all")Q=shuf(Q);draw();});return;}
    const q=Q[S.i];const order=q._o||(q._o=shuf(q.opts.map((_,k)=>k)));
    root.innerHTML=`<div class="progress-top"><button class="iconbtn" data-go="${id==="all"?"learn/tech":"learn/tech/"+id}" aria-label="Leave">${ic("close")}</button><div class="meter"><i style="width:${Math.round(S.i/Q.length*100)}%"></i></div><span class="mono small muted">${S.i+1}/${Q.length}</span></div>
     <article class="fc"><div class="row-x"><span class="tag">Spot the error</span><span class="pill">${esc(q.tname)}</span></div><div class="q" style="font-size:1.12rem">${esc(q.q)}</div>
      <div class="opts">${order.map((k,j)=>`<button class="opt${S.ans!=null?(k===q.a?" right":k===S.ans?" wrong":""):""}" data-k="${k}" ${S.ans!=null?"disabled":""}><span class="kn">${j+1}</span><span>${esc(q.opts[k])}</span></button>`).join("")}</div>
      ${S.ans!=null?`<div class="ans"><div class="verdict-line ${S.ans===q.a?"ok":"no"}">${ic(S.ans===q.a?"check":"close")}${S.ans===q.a?"Right":"Not quite"}</div><p>${esc(q.why)}</p>${id==="all"?`<button class="link small" data-go="learn/tech/${q.tid}" style="align-self:flex-start">Open ${esc(q.tname)}</button>`:""}<button class="btn" id="nx">Continue</button></div>`:""}</article>`;
    $$("[data-k]",root).forEach(b=>b.addEventListener("click",()=>{if(S.ans!=null)return;S.ans=+b.dataset.k;if(S.ans===q.a)S.right++;draw();}));
    const nx=$("#nx",root);if(nx){nx.addEventListener("click",()=>{S.i++;S.ans=null;draw();window.scrollTo(0,0);});nx.focus({preventScroll:true});}
  };
  KEYS.handler=e=>{if(!document.body.contains(root))return;if(/^[1-4]$/.test(e.key)&&S.ans==null){const b=$$(".opt",root)[+e.key-1];b&&b.click();}else if(e.key==="Enter"){const n=$("#nx",root);n&&n.click();}};
  draw();
});

/* ---------- bedside rep with a checklist ---------- */
route("practice:techrep",(id)=>"Bedside rep",(root,id)=>{
  const t=techById(id);if(!t)throw new Error("Technique not found");
  const items=[...(t.setup||[]),...t.steps].map(s=>s.do);const ticked=new Set();let obs=false;
  const draw=()=>{const reps=techRec(id).reps||[];const clean=reps.filter(x=>x.n>=x.of).length;
    root.innerHTML=`<section class="ph"><span class="eyebrow">Bedside rep · ${clean} clean of 3</span><h1>${esc(t.name)}</h1><p class="lede">Do it on a patient, a colleague or yourself. Tick each step as you actually do it, not from memory afterwards. A rep counts as clean when every step is ticked.</p></section>
     <div class="list">${items.map((d,i)=>`<label class="lrow" style="cursor:pointer"><input type="checkbox" data-i="${i}" ${ticked.has(i)?"checked":""} style="width:22px;height:22px;accent-color:var(--accent);flex:none"><span class="txt"><b style="font-weight:${ticked.has(i)?400:700}">${esc(d)}</b></span></label>`).join("")}</div>
     <label class="lrow card" style="cursor:pointer"><input type="checkbox" id="obs" ${obs?"checked":""} style="width:22px;height:22px;accent-color:var(--accent);flex:none"><span class="txt"><b>A colleague watched</b><span>Observed reps are the gold standard for catching habits you can't see yourself.</span></span></label>
     <div class="row-x"><button class="btn" id="save">${ic("check")}Save the rep (${ticked.size}/${items.length})</button><button class="btn ghost" data-go="learn/tech/${id}">Back to the technique</button></div>
     ${reps.length?`<section class="section"><span class="label">Your reps</span><div class="list">${reps.slice().reverse().slice(0,8).map(x=>`<div class="lrow"><span class="dot${x.n>=x.of?" on":""}"></span><span class="txt"><b>${fmtDate(x.t)}</b><span>${x.n}/${x.of} steps${x.obs?" · observed":""}</span></span></div>`).join("")}</div></section>`:""}`;
    $$("input[data-i]",root).forEach(c=>c.addEventListener("change",()=>{const i=+c.dataset.i;c.checked?ticked.add(i):ticked.delete(i);$("#save").innerHTML=`${ic("check")}Save the rep (${ticked.size}/${items.length})`;}));
    $("#obs").addEventListener("change",e=>{obs=e.target.checked;});
    $("#save").addEventListener("click",()=>{const rr=techRec(id);const rep={t:Date.now(),n:ticked.size,of:items.length,obs};techSave(id,{reps:[...(rr.reps||[]),rep].slice(-30)});
      Store.s.xp=(Store.s.xp||0)+(rep.n>=rep.of?6:2);tick(2,"hands");
      const cl=(techRec(id).reps||[]).filter(x=>x.n>=x.of).length;
      toast(rep.n>=rep.of?(cl>=3?"Clean rep. Three clean: this one is yours.":"Clean rep saved"):`Saved: ${rep.of-rep.n} step${rep.of-rep.n>1?"s":""} missed. Those are the habit to fix.`,"good");
      ticked.clear();obs=false;if(techConf(id)!=null&&cl>=3&&techConf(id)<5)setTimeout(()=>toast("Rate your confidence again on the technique page"),2600);draw();window.scrollTo(0,0);});
  };draw();
});

/* ---------- spaced cards: why each step, and the error behind each fix ---------- */
CARD_TYPE_LABEL.twhy="Why this step";CARD_TYPE_LABEL.terr="Technique error";AUTO.terr=1;
(()=>{const orig=cardBody;window.cardBody=function(c){
  if(c.type==="twhy"){const t=techById(c.ref[0]);const s=t.steps[c.ref[1]];
    return {q:`${esc(s.do)}<small>${esc(t.name)}, step ${c.ref[1]+1}. Why is it done exactly this way?</small>`,a:`<p>${esc(s.why)}</p>${s.cue?`<div class="note good small"><b>You know it's right when</b> ${esc(s.cue)}</div>`:""}${TECH_FIG[t.id]&&c.ref[1]<2?fig(TECH_FIG[t.id],{small:true,nocap:true}):""}<button class="link small" data-go="learn/tech/${t.id}" style="align-self:flex-start">Open the technique</button>`};}
  if(c.type==="terr"){const t=techById(c.ref[0]);const q=t.mcq[c.ref[1]];
    return {q:`${esc(q.q)}<small>${esc(t.name)}</small>`,opts:q.opts.map((l,k)=>({l,ok:k===q.a})),explain:`<p class="small">${esc(q.why)}</p><button class="link small" data-go="learn/tech/${t.id}" style="align-self:flex-start">Open the technique</button>`};}
  return orig(c);};})();

/* ---------- technique of the day (for Today) ---------- */
function techOfDay(){const L=techList();if(!L.length)return null;
  const unrated=L.filter(t=>techConf(t.id)==null),weak=L.filter(t=>techConf(t.id)!=null&&techDone(t.id)<5).sort((a,b)=>techConf(a.id)-techConf(b.id));
  const pool=weak.length?weak.slice(0,4):unrated.length?unrated:L;const d=new Date();const seed=d.getFullYear()*400+d.getMonth()*32+d.getDate();return pool[seed%pool.length];}
