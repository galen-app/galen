"use strict";
/* ================= SIGNS ================= */
const SF={q:"",v:"all",sys:"all",reg:"all",fig:false};
const REG_NAME=Object.fromEntries(REGIONS.map(r=>[r.id,r.name]));
route("signs:library","Signs & tests",(root)=>{
  const counts={};Object.values(SIGNS).forEach(s=>counts[s.v]=(counts[s.v]||0)+1);
  root.innerHTML=`<section class="ph"><span class="eyebrow">Signs & tests</span><h1>What each test is worth</h1><p class="lede">${Object.keys(SIGNS).length} signs with their likelihood ratios, mechanism, and a verdict on whether they earn a place in your examination.</p></section>
  <div class="row-x"><button class="btn sm soft" data-go="signs/calc">${ic("scale")}Likelihood-ratio calculator</button><button class="btn sm ghost" data-go="signs/atlas">Illustration atlas</button><button class="btn sm ghost" data-go="signs/er">ER essentials</button><button class="btn sm ghost" data-go="signs/images">Photo library</button><button class="btn sm ghost" data-go="signs/verdicts">Which tests are archaic?</button></div>
  <label class="search">${ic("search")}<input id="sq" placeholder="Search a sign, a diagnosis, a mechanism…" value="${esc(SF.q)}" autocomplete="off" aria-label="Search signs"></label>
  <div class="stack" style="gap:8px"><div class="chips" id="vf">${[["all","All"],...VERDICT_ORDER.map(v=>[v,VERDICT[v]])].map(([k,l])=>`<button class="chip${SF.v===k?" on":""}" data-v="${k}">${k!=="all"?`<span class="v v-${k}" style="padding:0;background:none">${counts[k]}</span>`:""}${l}</button>`).join("")}</div>
  <div class="chips" id="sf">${[["all","All systems"],...Object.entries(SYS_SHORT)].map(([k,l])=>`<button class="chip${SF.sys===k?" on":""}" data-s="${k}">${l}</button>`).join("")}<button class="chip${SF.fig?" on":""}" id="figf">${ic("eye")}Illustrated</button></div>
  <div class="chips" id="rf"${SF.sys==="msk"?"":" hidden"}>${[["all","All regions"],...REGIONS.map(r=>[r.id,r.name])].map(([k,l])=>`<button class="chip${SF.reg===k?" on":""}" data-r="${k}">${l}</button>`).join("")}</div></div>
  <div class="label" id="scount"></div><div id="slist"></div>`;
  const draw=()=>{
    const q=SF.q.trim().toLowerCase();
    const L=Object.entries(SIGNS).filter(([k,s])=>(SF.v==="all"||s.v===SF.v)&&(SF.sys==="all"||s.sys===SF.sys)&&(SF.sys!=="msk"||SF.reg==="all"||s.reg===SF.reg)&&(!SF.fig||(s.fig&&FIG[s.fig]))&&!s.hide&&(!q||(s.name+" "+s.target+" "+s.think+" "+s.mech).toLowerCase().includes(q)))
      .sort((a,b)=>VERDICT_ORDER.indexOf(a[1].v)-VERDICT_ORDER.indexOf(b[1].v)||(b[1].p||0)-(a[1].p||0));
    $("#slist").innerHTML=L.length?`<div class="list">${L.map(([k,s])=>`<button class="lrow" data-go="signs/sign/${k}"><span class="dot${Store.s.signs.includes(k)?" on":""}" title="${Store.s.signs.includes(k)?"Opened":"Not opened yet"}"></span><span class="txt"><b>${esc(s.name)}</b><span>${esc(s.target)} · ${s.reg?REG_NAME[s.reg]||SYS_SHORT[s.sys]:SYS_SHORT[s.sys]}${s.sens!=null||s.spec!=null?` · Sn ${s.sens??"–"} / Sp ${s.spec??"–"}`:""}</span></span><span class="stack" style="gap:4px;align-items:flex-end"><span class="v v-${s.v}">${VERDICT[s.v]}</span>${s.p!=null?`<span class="lr ${lrClass(s.p)}" style="font-size:.72rem">LR+ ${s.p}</span>`:""}</span></button>`).join("")}</div>`:`<div class="empty">Nothing matches. Try a diagnosis (“effusion”) or a system.</div>`;
    $("#scount").textContent=`${L.length} of ${Object.keys(SIGNS).length}`;
  };
  $("#sq").addEventListener("input",e=>{SF.q=e.target.value;draw();});
  $("#vf").addEventListener("click",e=>{const b=e.target.closest("[data-v]");if(!b)return;SF.v=b.dataset.v;$$("#vf .chip").forEach(x=>x.classList.toggle("on",x===b));draw();});
  $("#sf").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;if(b.dataset.s==null)return;SF.sys=b.dataset.s;SF.reg="all";$$("#sf [data-s]").forEach(x=>x.classList.toggle("on",x===b));$("#rf").hidden=SF.sys!=="msk";$$("#rf .chip").forEach(x=>x.classList.toggle("on",x.dataset.r==="all"));draw();});
  $("#figf").addEventListener("click",e=>{SF.fig=!SF.fig;e.currentTarget.classList.toggle("on",SF.fig);draw();});
  $("#rf").addEventListener("click",e=>{const b=e.target.closest("[data-r]");if(!b)return;SF.reg=b.dataset.r;$$("#rf .chip").forEach(x=>x.classList.toggle("on",x===b));draw();});
  draw();
});
const lrPos=v=>clamp(50+Math.log10(v)*25,2,98);
function lrScale(s){if(s.p==null&&s.n==null)return "";
  return `<div class="card stack" style="gap:8px"><span class="eyebrow">Where it sits on the likelihood scale</span>
   <div class="scale">${s.n!=null?`<i class="n" style="left:${lrPos(s.n)}%" title="LR− ${s.n}"></i>`:""}${s.p!=null?`<i style="left:${lrPos(s.p)}%" title="LR+ ${s.p}"></i>`:""}</div>
   <div class="scale-l"><span>0.01</span><span>0.1</span><span>1</span><span>10</span><span>100</span></div>
   <div class="scale-l" style="margin-top:0"><span>← rules out</span><span>no change</span><span>rules in →</span></div>
   <p class="small muted">${s.p!=null?`<b style="color:var(--accent-ink)">●</b> positive result (LR+ ${s.p}) `:""}${s.n!=null?`<b>●</b> negative result (LR− ${s.n}). `:""}LRs of 2–5 or 0.5–0.2 shift probability a little; 5–10 or 0.2–0.1 moderately; beyond 10 or 0.1, decisively.</p></div>`;}
function anglesHTML(id){
  const a=(typeof ANGLES!=="undefined")&&ANGLES[id];if(!a)return "";
  const pair=a.pair&&SIGNS[a.pair.with]?`<div class="ang"><span class="k">Contrast with</span><div class="row-x">${signChip(a.pair.with)}<span class="small">${esc(a.pair.why)}</span></div></div>`:"";
  return `<div class="card stack angles" style="gap:14px"><div class="ddh"><span class="eyebrow">${ic("mind")} From every angle</span><span class="tag">glue</span></div>
   ${a.vignette?`<div class="ang"><span class="k">A case</span><p>${esc(a.vignette)}</p></div>`:""}
   ${a.trap?`<div class="ang trap"><span class="k">The trap</span><p>${esc(a.trap)}</p></div>`:""}
   ${a.analogy?`<div class="ang"><span class="k">Picture it</span><p class="hook">${esc(a.analogy)}</p></div>`:""}
   ${a.number?`<div class="ang"><span class="k">The number</span><p class="mono">${esc(a.number)}</p></div>`:""}
   ${a.history?`<div class="ang"><span class="k">Ask first</span><p>${esc(a.history)}</p></div>`:""}
   ${pair}
   ${a.patient?`<div class="ang"><span class="k">Say it to the patient</span><p>${esc(a.patient)}</p></div>`:""}
   ${a.document?`<div class="ang"><span class="k">Write it in the notes</span><p class="mono small">${esc(a.document)}</p></div>`:""}
   ${a.teachback?`<details class="acc"><summary><span class="st"><b>Teach it back</b><span>${esc(a.teachback.q)}</span></span></summary><div class="acc-body"><div><textarea class="inp" rows="3" placeholder="Explain it in your own words first…"></textarea></div><div><span class="k">Model answer</span>${esc(a.teachback.a)}</div></div></details>`:""}</div>`;
}
function ssBars(s){
  if(s.sens==null&&s.spec==null)return "";
  const bar=(l,v,c,t)=>`<div class="ssbar"><span>${l}</span><span class="tr">${v!=null?`<i style="width:${v}%;background:${c}"></i>`:""}</span><b class="num">${v!=null?v+"%":"–"}</b></div><p class="small muted" style="margin:-4px 0 4px 106px">${t}</p>`;
  const snout=s.sens!=null&&s.sens>=90,spin=s.spec!=null&&s.spec>=90;
  return `<div class="card stack" style="gap:10px"><span class="eyebrow">Sensitivity and specificity</span>
   ${bar("Sensitivity",s.sens,"var(--insp)",s.sens!=null?`Of 100 patients with ${esc(s.target)}, about ${Math.round(s.sens)} test positive.`:"Not reliably reported.")}
   ${bar("Specificity",s.spec,"var(--accent)",s.spec!=null?`Of 100 patients without it, about ${Math.round(s.spec)} test negative.`:"Not reliably reported.")}
   <p class="small">${snout&&spin?"<b>Both ends work:</b> high sensitivity (a negative helps rule out) and high specificity (a positive helps rule in).":snout?"<b>SnNout:</b> highly sensitive, so a <i>negative</i> result helps rule the diagnosis out. A positive proves little.":spin?"<b>SpPin:</b> highly specific, so a <i>positive</i> result helps rule the diagnosis in. A negative proves little.":"Neither sensitivity nor specificity reaches 90%, so on its own it neither rules in nor out; combine it with the story and other findings."}</p></div>`;}
const VERDICT_WHY={core:"Core: do it whenever the question arises. It moves probability enough, or is cheap and decision-changing.",useful:"Useful: worth doing when the question is open. Moderate accuracy; one piece of the picture.",low:"Low yield: weak or inconsistent evidence. Know its limits and don't lean on it.",archaic:"Archaic: historical, or replaced by a better test or imaging. Know it for exams and ward rounds."};
route("signs:sign",(id)=>SYS_SHORT[(SIGNS[id]||{}).sys]||"Sign",(root,id)=>{
  const s=SIGNS[id];if(!s)throw new Error("Sign not found");markSign(id);if(typeof DEEP!=="undefined"&&DEEP[id]){roundMark("read");}
  const mods=SYSTEMS.filter(m=>m.seq.some(st=>(st.signs||[]).includes(id)));
  const regs=REGIONS.filter(r=>r.tests.includes(id));
  const stem=x=>x.toLowerCase().split(/[ ,/(;]/)[0];
  const related=Object.entries(SIGNS).filter(([k,x])=>k!==id&&!x.hide&&(stem(x.target)===stem(s.target)||x.target===s.target)).slice(0,6);
  const sec=(t,v)=>v?`<div class="sec"><h3>${t}</h3><p>${esc(v)}</p></div>`:"";
  const r=Store.s.srs["t:"+id];
  root.innerHTML=`<section class="ph"><div class="row-x"><span class="v v-${s.v}">${VERDICT[s.v]}</span><span class="tag">${SYS_NAME[s.sys]}</span>${s.reg?`<span class="tag">${esc(REG_NAME[s.reg]||s.reg)}</span>`:""}<span class="tag">${s.type}</span></div>
    <h1>${esc(s.name)}</h1><p class="quote">Target: ${esc(s.target)}</p><div class="lrrow">${lrChips(s)}</div></section>
   ${s.fig?fig(s.fig):""}
   ${IMG_SUBJECTS[id]?Img.galleryHTML("s:"+id,IMG_SUBJECTS[id][1],{title:IMG_SUBJECTS[id][0]}):""}
   ${(()=>{const T=typeof TECH!=="undefined"&&TECH.find(t=>(t.signs||[]).includes(id));return T?`<button class="tile" data-go="learn/tech/${T.id}" style="border-color:var(--accent)"><div class="t-top"><span class="icwrap">${ic("check")}</span><span class="tag">technique clinic</span></div><b>Master the technique: ${esc(T.name)}</b><span class="sub">Every step with its reason, the errors that fool good clinicians, and five drills until it is automatic.</span></button>`:"";})()}
   ${s.how||s.anat?`<div class="card stack" style="gap:16px">${sec("How to do it",s.how)}${sec("The anatomy",s.anat)}</div>`:""}
   <div class="card stack" style="gap:16px">${sec("Why it works",s.mech)}${sec("What to think",s.think)}</div>
   ${anglesHTML(id)}
   ${deepDive(id)}
   ${ssBars(s)}
   ${lrScale(s)}
   <div class="card stack" style="gap:8px"><span class="eyebrow">Value in practice</span><p>${VERDICT_WHY[s.v]||""}</p>${s.note?`<div class="note"><b>Evidence note.</b> ${esc(s.note)}</div>`:""}${(()=>{const r=REPLACED.find(x=>x.ids.includes(id));return r?`<div class="note"><b>Use instead:</b> ${esc(r.now)}. ${esc(r.why)}</div>`:"";})()}</div>
   ${memoryBlock(id)}
   ${mods.length||regs.length?`<div class="section"><span class="label">Part of</span><div class="chips">${mods.map(m=>`<button class="chip" data-go="learn/module/${m.id}">${esc(m.name)}</button>`).join("")}${regs.map(g=>`<button class="chip" data-go="learn/region/${g.id}">${esc(g.name)} exam</button>`).join("")}</div></div>`:""}
   ${related.length?`<div class="section"><span class="label">Same target, compare the evidence</span><div class="chips">${related.map(([k])=>signChip(k)).join("")}</div></div>`:""}
   <div class="row-x">${s.p!=null||s.n!=null?`<button class="btn sm soft" data-go="signs/calc/${id}">${ic("scale")}Try it in the calculator</button>`:""}<span class="small muted">${r?`In your reviews: next due ${r.due<=dayNum()?"today":"in "+(r.due-dayNum())+" day"+(r.due-dayNum()>1?"s":"")}.`:"Comes up in your daily session once you've opened it."}</span></div>`;
  Img.bindGalleries(root);
});
route("signs:images","Photo library",(root)=>{
  const subj=[...Object.entries(IMG_SUBJECTS).map(([id,[n,t,sys]])=>({id:"s:"+id,n,sys,go:SIGNS[id]?`signs/sign/${id}`:`signs/imgsub/${id}`})),...DCOND.map(c=>({id:"d:"+c.id,n:c.n,sys:"derm",go:`learn/dcond/${c.id}`}))];
  const groups={};subj.forEach(x=>(groups[x.sys]||(groups[x.sys]=[])).push(x));
  const pinned=Object.values(Store.s.pins).filter(p=>!p.deleted);
  root.innerHTML=`<section class="ph"><span class="eyebrow">Photo library</span><h1>Real signs, real skin</h1><p class="lede">${subj.length} subjects. Galen loads openly licensed photographs from Wikimedia Commons for each one; pin the ones that teach you best and they stay with your progress. ${pinned.length?`You have pinned ${pinned.length}.`:""}</p>
   <div class="row-x"><button class="btn sm" data-go="practice/spot">${ic("eye")}Spot diagnosis</button>${Img.canUse()?"":`<span class="small muted">Live photos work in the installed app.</span>`}</div></section>
   ${pinned.length?`<section class="section"><span class="label">Your pins</span><div class="gal-grid">${pinned.slice(-12).reverse().map(p=>`<figure class="gal-t pinned" data-sub="${esc(p.subject)}"><img loading="lazy" src="${esc(p.thumb)}" alt="${esc(p.title)}"><figcaption>${esc(p.subject.replace(/^[sd]:/,""))}</figcaption></figure>`).join("")}</div></section>`:""}
   ${Object.entries(groups).map(([sys,L])=>`<section class="section"><span class="label">${SYS_NAME[sys]||sys}</span><div class="chips">${L.map(x=>{const n=Img.pinsOf(x.id).length;return `<button class="chip${n?" on":""}" data-go="${x.go}">${esc(x.n)}${n?` <span class="mono tiny">${n}</span>`:""}</button>`;}).join("")}</div></section>`).join("")}`;
  $$("[data-sub]",root).forEach(f=>f.addEventListener("click",()=>{const sub=f.dataset.sub;const id=sub.slice(2);if(sub.startsWith("d:"))open("learn","dcond",id);else if(SIGNS[id])open("signs","sign",id);else open("signs","imgsub",id);}));
});
route("signs:imgsub",(id)=>(IMG_SUBJECTS[id]||[id])[0],(root,id)=>{
  const s=IMG_SUBJECTS[id];if(!s)throw new Error("Unknown subject");
  root.innerHTML=`<section class="ph"><span class="eyebrow">${SYS_NAME[s[2]]||"Photographs"}</span><h1>${esc(s[0])}</h1><p class="lede">Openly licensed photographs from Wikimedia Commons. Pin the clearest; hide the ones that mislead.</p></section>${Img.galleryHTML("s:"+id,s[1],{title:s[0]})}`;
  const g=$(".gal",root);g.dataset.n=36;Img.bindGalleries(root);
});
route("signs:atlas","Atlas",(root)=>{
  const users={};Object.entries(SIGNS).forEach(([k,s])=>{if(s.fig)(users[s.fig]||(users[s.fig]=[])).push(k);});
  root.innerHTML=`<section class="ph"><span class="eyebrow">Atlas</span><h1>The anatomy behind the exam</h1><p class="lede">${Object.keys(FIG).length} illustrations of the structures and physiology each manoeuvre relies on. Tap one to see the tests that use it.</p></section>
   <div class="atlas">${Object.keys(FIG).map(k=>{const u=users[k]||[];const reg=REGIONS.find(r=>r.fig===k);const NF={cord:"learn/localise/cord","cn-brainstem":"learn/cranial",homunculus:"learn/localise/rules","vasc-territories":"learn/localise/vessels","medulla-x":"learn/localise/stem"};const go=reg?`learn/region/${reg.id}`:u.length?`signs/sign/${u[0]}`:NF[k]||"";if(!go)return `<div>${fig(k,{small:true})}</div>`;return `<div data-go="${go}" role="button" tabindex="0">${fig(k,{small:true})}</div>`;}).join("")}</div>`;
});
route("signs:er","ER essentials",(root)=>{
  const ids=Object.keys(DEEP).filter(k=>SIGNS[k]);
  const groups={};ids.forEach(k=>(groups[SIGNS[k].sys]||(groups[SIGNS[k].sys]=[])).push(k));
  root.innerHTML=`<section class="ph"><span class="eyebrow">Emergency department</span><h1>ER essentials, in depth</h1><p class="lede">${ids.length} signs and rules you will use every shift, each with how it fits practice in 2026, bedside pearls, the deeper anatomy, and the history and story behind the name.</p></section>
   ${Object.entries(groups).map(([sy,L])=>`<section class="section"><span class="label">${SYS_NAME[sy]}</span><div class="list">${L.map(k=>`<button class="lrow" data-go="signs/sign/${k}"><span class="txt"><b>${esc(SIGNS[k].name)}</b><span>${esc(DEEP[k].hook||SIGNS[k].target)}</span></span><span class="v v-${SIGNS[k].v}">${VERDICT[SIGNS[k].v]}</span></button>`).join("")}</div></section>`).join("")}`;
});
route("signs:verdicts","Verdicts",(root)=>{
  const why={core:"Do it every time the question arises. Strong evidence, or cheap and decision-changing.",useful:"Worth doing when the question is open. Moderate accuracy.",low:"Weak evidence or poor reproducibility. Know its limits; don't lean on it.",archaic:"Historical. Replaced by a better bedside test or by imaging. Know it for exams."};
  root.innerHTML=`<section class="ph"><span class="eyebrow">Verdicts</span><h1>Which tests earn their place</h1><p class="lede">Each sign was judged on three things: how far it moves probability, how reproducible it is between examiners, and whether something better has replaced it. Accurate tests can still be low yield if they never change a decision; modest ones can be core if they are fast and change what you do (respiratory rate).</p></section>
  <section class="section"><span class="label">Replaced, archaic or misused, and what to do instead</span><div class="stack" style="gap:8px">${REPLACED.map(r=>`<details class="acc"><summary><span class="st"><b>${esc(r.old)}</b><span>Now: ${esc(r.now)}</span></span></summary><div class="acc-body"><div>${esc(r.why)}</div><div class="chips">${r.ids.filter(k=>SIGNS[k]).map(signChip).join("")}</div></div></details>`).join("")}</div></section>
  ${VERDICT_ORDER.map(g=>{const L=Object.entries(SIGNS).filter(([,s])=>s.v===g);return `<section class="section"><div class="row-x"><span class="v v-${g}">${VERDICT[g]}</span><span class="small muted">${L.length} · ${why[g]}</span></div><div class="chips">${L.map(([k,s])=>`<button class="chip" data-go="signs/sign/${k}">${esc(s.name)}</button>`).join("")}</div></section>`;}).join("")}`;
});

/* ---------- calculator ---------- */
const PRESETS=[
 {n:"Breathless: heart failure?",pre:30,ids:["jvp","ajr","s3","oedema","crackles"]},
 {n:"Systolic murmur: severe AS?",pre:20,ids:["carotid-upstroke","a2-soft","s4"]},
 {n:"Cough and fever: pneumonia?",pre:15,ids:["egophony","bronchial-breathing","crackles"]},
 {n:"Dull base: effusion?",pre:30,ids:["chest-expansion","percussion-dull","fremitus"]},
 {n:"Smoker: COPD?",pre:30,ids:["hoover","fet","wheeze"]},
 {n:"RLQ pain: appendicitis?",pre:40,ids:["rlq-tender","rovsing","psoas","cough-test"]},
 {n:"Distended abdomen: ascites?",pre:30,ids:["fluid-wave","shifting-dullness"]},
 {n:"Effusion and hypotension: tamponade?",pre:30,ids:["pulsus-paradoxus"]},
 {n:"Acute vertigo: central?",pre:15,ids:["hints"]},
 {n:"Twisted knee: ACL?",pre:40,ids:["lachman","mcmurray"]},
 {n:"Fever, headache: meningitis?",pre:10,ids:["kernig"]}];
const CALC={pre:30,tests:{}};
route("signs:calc","LR calculator",(root,preload)=>{
  if(preload&&SIGNS[preload]&&!CALC.tests[preload])CALC.tests[preload]="pos";
  const opts=Object.entries(SIGNS).filter(([k,s])=>s.p!=null||s.n!=null).sort((a,b)=>a[1].name.localeCompare(b[1].name));
  root.innerHTML=`<section class="ph"><span class="eyebrow">Bayes at the bedside</span><h1>Likelihood-ratio calculator</h1><p class="lede">Start from your honest pretest estimate, add what you found, and see how far the examination moved you.</p></section>
   <div class="section"><span class="label">Start from a scenario</span><div class="chips" id="presets">${PRESETS.map((p,i)=>`<button class="chip" data-p="${i}">${esc(p.n)}</button>`).join("")}</div></div>
   <div class="card stack"><label for="pre" class="eyebrow">Pretest probability</label><div class="row-x" style="gap:16px;flex-wrap:nowrap"><b class="big" id="preV" style="min-width:3.2ch">${CALC.pre}%</b><input type="range" id="pre" min="1" max="99" value="${CALC.pre}" style="flex:1;min-width:0"></div>
    <p class="small muted">Prevalence in your setting, adjusted by the history. The calculator only multiplies what you give it.</p></div>
   <div class="card stack"><span class="eyebrow">Findings</span><div class="stack" style="gap:8px" id="tests"></div>
    <select class="sel" id="addT"><option value="">Add a sign or test…</option>${opts.map(([k,s])=>`<option value="${k}">${esc(s.name)} — ${esc(s.target)}</option>`).join("")}</select></div>
   <div class="card stack"><span class="eyebrow">Post-test probability</span><div class="row-x"><b class="big" id="postV"></b><span class="small muted" id="postNote"></span></div><div class="probbar"><i id="postBar"></i><em id="preMark" title="Pretest"></em></div><div id="chain" class="small muted"></div>
    <p class="tiny muted">Findings are treated as independent, which overstates certainty when signs share a mechanism (JVP and abdominojugular reflux both measure right atrial pressure).</p></div>`;
  const T=$("#tests");
  const draw=()=>{
    const ks=Object.keys(CALC.tests);
    T.innerHTML=ks.length?ks.map(k=>{const s=SIGNS[k],r=CALC.tests[k];return `<div class="calcrow"><span style="min-width:0"><b>${esc(s.name)}</b><br><span class="tiny muted">${esc(s.target)} · LR+ ${s.p??"—"} · LR− ${s.n??"—"}</span></span>
      <span class="row-x" style="gap:6px;flex-wrap:nowrap"><span class="seg" role="group"><button data-k="${k}" data-r="pos" aria-pressed="${r==="pos"}">Present</button><button data-k="${k}" data-r="neg" aria-pressed="${r==="neg"}">Absent</button></span><button class="iconbtn" data-rm="${k}" aria-label="Remove">${ic("close")}</button></span></div>`;}).join(""):`<p class="small muted">No findings yet. Pick a scenario above or add a test.</p>`;
    let odds=CALC.pre/(100-CALC.pre);const steps=[];
    ks.forEach(k=>{const s=SIGNS[k],r=CALC.tests[k],lr=r==="pos"?s.p:s.n;if(lr==null){steps.push(`${s.name}: no ${r==="pos"?"LR+":"LR−"}, ignored`);return;}odds*=lr;steps.push(`${s.name} ${r==="pos"?"present":"absent"} ×${lr}`);});
    const post=odds/(1+odds)*100;
    $("#postV").textContent=post>99?">99%":post<1?"<1%":Math.round(post)+"%";$("#postBar").style.width=post+"%";$("#preMark").style.left=CALC.pre+"%";$("#preV").textContent=CALC.pre+"%";
    const d=post-CALC.pre;$("#postNote").textContent=ks.length?`${d>=0?"+":""}${Math.round(d)} points from your pretest estimate`:"";
    $("#chain").textContent=steps.length?`Odds ${(CALC.pre/(100-CALC.pre)).toFixed(2)} → ${steps.join(" → ")} → ${odds.toFixed(2)}`:"";
  };
  $("#pre").addEventListener("input",e=>{CALC.pre=+e.target.value;draw();});
  $("#presets").addEventListener("click",e=>{const b=e.target.closest("[data-p]");if(!b)return;const p=PRESETS[+b.dataset.p];CALC.pre=p.pre;CALC.tests={};p.ids.forEach(k=>CALC.tests[k]="pos");$("#pre").value=p.pre;draw();});
  $("#addT").addEventListener("change",e=>{if(e.target.value){CALC.tests[e.target.value]="pos";e.target.value="";draw();}});
  T.addEventListener("click",e=>{const b=e.target.closest("[data-r]");if(b){CALC.tests[b.dataset.k]=b.dataset.r;draw();return;}const x=e.target.closest("[data-rm]");if(x){delete CALC.tests[x.dataset.rm];draw();}});
  draw();
});

/* ================= SOUNDS ================= */
function soundTabs(active){
  return `<div class="tabs" role="tablist">${[["library","Library"],["map","Chest map"],["compare","Compare"],["learn","Foundations"]].map(([k,l])=>`<button role="tab" aria-selected="${k===active}" data-st="${k}">${l}</button>`).join("")}</div>`;
}
function bindSoundTabs(root){$$(".tabs [data-st]",root).forEach(b=>b.addEventListener("click",()=>{const s=NAV.stacks.sounds;s.length=0;s.push({v:b.dataset.st});render(false);}));}
function glyph(id){
  const d=getData(id,72),e=envOf(d,"open"),W=d.kind==="heart"?d.T*1.05:d.dur/2,n=44;let path="";
  for(let x=0;x<n;x++){let m=0;const b0=Math.floor((x/n*W-.02)*EBR),b1=Math.floor(((x+1)/n*W-.02)*EBR);for(let b=b0;b<=b1;b++){const v=e[((b%e.length)+e.length)%e.length];if(v>m)m=v;}const h=Math.max(.6,Math.min(1,m*1.2)*12);path+=`M${x+.5} ${13-h}V${13+h}`;}
  return `<svg class="glyph" viewBox="0 0 44 26" aria-hidden="true"><path d="${path}" stroke="var(--accent)" stroke-width="1"/></svg>`;
}
const GLYPHS={};
let SNDF="all";
route("sounds:library","Sounds",(root)=>{
  const realRows=b=>Object.keys(REAL).filter(k=>REAL[k].body===b).sort((a,c)=>REAL[a].name.localeCompare(REAL[c].name)).map(k=>{const r=REAL[k];
    return `<button class="lrow" data-go="sounds/sound/${k}"><span class="tag">REAL</span><span class="txt"><b>${esc(r.name)}</b><span>${esc(r.who)} · ${esc(r.site)}</span></span><span class="dot${Store.s.seen.includes(k)?" on":""}"></span></button>`;}).join("");
  const show=g=>SNDF==="all"||(SNDF==="heart"&&!["lung","er"].includes(g))||(SNDF==="lung"&&g==="lung")||(SNDF==="er"&&g==="er");
  root.innerHTML=`<section class="ph"><span class="eyebrow">Auscultation</span><h1>Hear it, see it, know why</h1><p class="lede">${Object.keys(SOUNDS).length} teaching sounds synthesised live from their physiology, so the trace is exactly what you hear, plus ${Object.keys(REAL).length} real recordings.</p></section>
  ${soundTabs("library")}
  <div class="row-x"><div class="seg" id="sndf">${[["all","All"],["heart","Heart"],["lung","Lungs"],["er","Emergency"],["real","Real"]].map(([k,l])=>`<button data-f="${k}" aria-pressed="${SNDF===k}">${l}</button>`).join("")}</div><span class="spacer"></span><button class="btn sm" data-go="practice/drill">${ic("bolt")}Drill</button></div>
  <div class="phones">${ic("ear")}<div>Use headphones. Most heart sounds sit between 20 and 200 Hz, where phone speakers produce almost nothing. On iPhone, turn off silent mode.</div></div>
  ${SNDF==="real"?"":GROUPS.filter(([g])=>show(g)).map(([g,t])=>`<section class="section"><span class="label">${t}</span><div class="list">${Object.entries(SOUNDS).filter(([,s])=>s.group===g).map(([k,s])=>
    `<button class="lrow" data-go="sounds/sound/${k}">${GLYPHS[k]||`<svg class="glyph" data-g="${k}" viewBox="0 0 44 26" aria-hidden="true"></svg>`}<span class="txt"><b>${esc(s.name)}</b><span>${esc(s.timing)}</span></span><span class="dot${Store.s.seen.includes(k)?" on":""}"></span></button>`).join("")}</div></section>`).join("")}
  ${SNDF==="all"||SNDF==="real"||SNDF==="heart"?`<section class="section"><span class="label">Real recordings · heart (adults)</span><div class="list">${realRows("heart")}</div></section>`:""}
  ${SNDF==="all"||SNDF==="real"||SNDF==="lung"?`<section class="section"><span class="label">Real recordings · lungs (children)</span><div class="list">${realRows("lung")}</div></section>`:""}`;
  bindSoundTabs(root);
  $("#sndf").addEventListener("click",e=>{const b=e.target.closest("[data-f]");if(b){SNDF=b.dataset.f;render(false,true);}});
  const gs=$$("svg[data-g]",root);let gi=0;
  const step=()=>{const el=gs[gi++];if(!el||!el.isConnected)return;try{GLYPHS[el.dataset.g]=glyph(el.dataset.g);el.outerHTML=GLYPHS[el.dataset.g];}catch(e){}setTimeout(step,0);};setTimeout(step,40);
});
const LISTEN={
 "Aortic stenosis":"Find S1, then a harsh murmur filling the middle of systole, ending before S2. S2 may be soft.",
 "Aortic regurgitation":"Listen in the pause after S2 for a soft, high-pitched hiss that fades through diastole. It's easy to mistake for background noise.",
 "Mitral regurgitation":"A steady murmur from S1 right up to S2, with no gap at either end.",
 "Mitral stenosis":"A low rumble in diastole. The loud S1 and the snap just after S2 are often the easiest clues to catch first.",
 "Normal heart sounds":"Two crisp sounds per beat, silence in systole and diastole. Use it as your reference before the abnormal recordings.",
 "Normal breath sounds":"Soft rustle through inspiration, quieter and shorter in expiration. Children breathe faster than adults.",
 "Fine crackles":"Short, high pops clustered toward the end of inspiration.",
 "Coarse crackles":"Louder, lower, bubbling pops early in the breath.",
 "Wheeze":"Musical notes through expiration.",
 "Rhonchi":"Low snoring or gurgling continuous sounds.",
 "Stridor":"A harsh high-pitched noise with each inspiration. In an infant it is often heard over the whole chest.",
 "Wheeze + crackles":"Musical wheeze and discrete crackles in the same breaths: pick out each one separately."};
const SRCNOTE={
 bmd:`From the <a href="https://github.com/sani002/BMD-HS-Dataset" target="_blank" rel="noopener">BUET Multi-disease Heart Sound (BMD-HS) dataset</a>, recorded with a digital stethoscope at the National Institute of Cardiovascular Diseases, Dhaka. The diagnosis belongs to the patient, so the murmur is not marked on the trace. Sampled at 4 kHz. Licensed CC BY-NC-ND 4.0: free for non-commercial use; the file is included unmodified.`,
 spr:`From the <a href="https://github.com/SJTU-YONGFU-RESEARCH-GRP/SPRSound" target="_blank" rel="noopener">SPRSound paediatric respiratory sound database</a> (Shanghai Jiao Tong University), with event labels from its annotators. Children breathe faster and have thinner chest walls than adults, so sounds are louder and higher-pitched. Licensed CC BY 4.0.`};
route("sounds:sound",(id)=>item(id)?(REAL[id]?"Recording":"Sound"):"Sound",(root,id)=>{
  if(REAL[id]){
    const r=REAL[id];markSeen(id);const cnt={};r.ev.forEach(e=>cnt[e[2]]=(cnt[e[2]]||0)+1);
    root.innerHTML=`<section class="ph"><span class="eyebrow">Real recording · ${r.body==="heart"?"heart":"lungs"}</span><h1>${esc(r.name)}</h1><p class="quote">${esc(LISTEN[r.dx]||"")}</p></section>
     <div id="dp"></div>
     <div class="facts"><div class="fact"><span class="label">Diagnosis</span><div>${esc(r.dx)}</div></div><div class="fact"><span class="label">Patient</span><div>${esc(r.who)}</div></div><div class="fact"><span class="label">Recorded at</span><div>${esc(r.site)}</div></div><div class="fact"><span class="label">Source</span><div>${r.src==="bmd"?"BMD-HS":"SPRSound"}</div></div></div>
     ${r.ev.length?`<div class="sec"><h3>Annotations</h3><p>Orange bands above the trace mark the events the annotators labelled: ${Object.entries(cnt).map(([k,v])=>`${v} × ${esc(k.toLowerCase())}`).join(", ")}. The readout names each event as it plays.</p></div>`:""}
     <div class="sec"><h3>Compare with the teaching version</h3><p>The teaching version isolates the key feature; real recordings add noise, irregular rhythm and overlap. Switching between the two is the fastest way to train your ear.</p><div class="chips">${soundChip(r.teach)}</div></div>
     <div class="sec"><h3>About this recording</h3><p class="small">${SRCNOTE[r.src]}</p></div>`;
    mk($("#dp"),id);return;}
  const s=SOUNDS[id];if(!s)throw new Error("Sound not found");markSeen(id);
  const sets=SETS.filter(x=>x.ids.includes(id)),reals=Object.keys(REAL).filter(k=>REAL[k].teach===id);
  const drill=DRILLS.find(d=>(d.cats||[]).includes(id));
  const sec=(t,v)=>v?`<div class="sec"><h3>${t}</h3><p>${v}</p></div>`:"";
  root.innerHTML=`<section class="ph"><span class="eyebrow">${GROUPS.find(g=>g[0]===s.group)[1]}</span><h1>${esc(s.name)}</h1><p class="quote">${s.clue}</p></section>
   <div id="dp"></div>
   <div class="facts"><div class="fact"><span class="label">Timing</span><div>${s.timing}</div></div><div class="fact"><span class="label">Listen at</span><div>${s.area}</div></div><div class="fact"><span class="label">Chest piece</span><div>${PIECE[s.piece].label}</div></div><div class="fact"><span class="label">Position</span><div>${s.pos}</div></div></div>
   <div class="card stack" style="gap:16px">${sec("How it is produced",s.mech)}${sec("Why it is heard there",s.where)}${sec("What it sounds like",s.sound)}${sec("Radiation",s.rad)}${sec("Manoeuvres",s.man)}${sec("Telling it apart",s.diff)}${sec("Causes",s.causes)}</div>
   ${reals.length?`<div class="section"><span class="label">Real recordings of this sound</span><div class="chips">${reals.map(soundChip).join("")}</div></div>`:""}
   ${sets.length?`<div class="section"><span class="label">Compare with look-alikes</span><div class="chips">${sets.map(x=>`<button class="chip" data-go="sounds/compare/${x.id}">${ic("compare")}${esc(x.name)}</button>`).join("")}</div></div>`:""}
   ${drill?`<button class="tile" data-go="practice/drill/${drill.id}"><div class="t-top"><span class="icwrap">${ic("bolt")}</span><span class="tag">mastery drill</span></div><b>Drill ${esc(drill.name.toLowerCase())}</b><span class="sub">Hear this sound mixed with its neighbours until you name it in seconds.</span></button>`:""}`;
  mk($("#dp"),id);
});

/* chest map */
let mapMode="heart",mapSel="mitral";
route("sounds:map","Chest map",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Auscultation</span><h1>Where to listen, and why there</h1></section>${soundTabs("map")}
   <div><div class="seg" id="mm"><button data-m="heart" aria-pressed="${mapMode==="heart"}">Heart areas</button><button data-m="lung" aria-pressed="${mapMode==="lung"}">Lung zones</button></div></div>
   <div class="mapgrid"><div class="card">${chestSVG()}</div><div class="card stack" id="mi"></div></div>`;
  bindSoundTabs(root);
  $("#mm").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;mapMode=b.dataset.m;mapSel=mapMode==="heart"?"mitral":"rml";render(false,true);});
  $$(".pt",root).forEach(p=>{p.addEventListener("click",()=>{mapSel=p.dataset.k;mapInfo();});p.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();mapSel=p.dataset.k;mapInfo();}});});
  $("#basesBtn")?.addEventListener("click",()=>{mapSel="bases";mapInfo();});
  mapInfo();
});
function mapInfo(){
  $$(".mapgrid .pt").forEach(p=>p.classList.toggle("on",p.dataset.k===mapSel));
  $("#basesBtn")?.classList.toggle("on",mapSel==="bases");
  const a=(mapMode==="heart"?AREAS:LZONES)[mapSel];if(!a)return;
  $("#mi").innerHTML=`<h2>${a.name}</h2><dl class="kv"><dt>Listen</dt><dd>${a.at}</dd>${a.valve?`<dt>Valve</dt><dd>${a.valve}</dd>`:""}</dl>
   <div class="sec"><h3>Why here</h3><p>${a.why}</p></div><div class="sec"><h3>Best heard here</h3><div class="chips">${a.best.map(soundChip).join("")}</div></div>`;
}
function chestSVG(){
  const ribs=[];for(let i=0;i<7;i++){const y=82+i*24;ribs.push(`<path d="M138 ${y} C 112 ${y-4}, 78 ${y+2}, 52 ${y+26}" /><path d="M162 ${y} C 188 ${y-4}, 222 ${y+2}, 248 ${y+26}" />`);}
  let pts="";
  if(mapMode==="heart")Object.entries(AREAS).forEach(([k,a],i)=>{pts+=`<g class="pt${k===mapSel?" on":""}" data-k="${k}" tabindex="0" role="button" aria-label="${a.name}"><circle cx="${a.x}" cy="${a.y}" r="10"/><text x="${a.x}" y="${a.y+3}" text-anchor="middle">${"APETM"[i]}</text></g>`;});
  else Object.entries(LZONES).forEach(([k,a])=>{a.x.forEach((x,i)=>{pts+=`<g class="pt${k===mapSel?" on":""}" data-k="${k}" tabindex="0" role="button" aria-label="${a.name}"><circle cx="${x}" cy="${a.y[i]}" r="9"/></g>`;});});
  const heart=mapMode==="heart"?`<path d="M140 96 C 132 120, 128 150, 132 172 C 140 192, 168 200, 214 196 C 226 186, 220 150, 196 124 C 186 108, 170 98, 160 96 Z" fill="var(--accent)" opacity=".13" stroke="var(--accent)" stroke-opacity=".4"/>`
   :`<path d="M138 70 C 120 66, 98 70, 86 92 C 66 130, 58 190, 62 238 C 90 246, 120 244, 140 236 C 142 180, 142 120, 138 70 Z" fill="var(--insp)" opacity=".12" stroke="var(--insp)" stroke-opacity=".45"/><path d="M162 70 C 180 66, 202 70, 214 92 C 234 130, 242 190, 238 238 C 214 246, 186 244, 162 236 C 164 210, 196 200, 186 170 C 170 150, 164 110, 162 70 Z" fill="var(--insp)" opacity=".12" stroke="var(--insp)" stroke-opacity=".45"/><path d="M140 156 L 66 160" stroke="var(--insp)" stroke-dasharray="3 3" opacity=".7"/><path d="M68 130 C 90 170, 118 200, 140 222" stroke="var(--insp)" stroke-dasharray="3 3" opacity=".7"/><path d="M232 130 C 210 170, 186 200, 166 220" stroke="var(--insp)" stroke-dasharray="3 3" opacity=".7"/>`;
  return `<svg viewBox="0 0 300 300" role="img" aria-label="Anterior chest with listening points"><path d="M60 52 C 90 40, 120 46, 150 46 C 180 46, 210 40, 240 52 C 262 70, 268 150, 262 270 L 38 270 C 32 150, 38 70, 60 52 Z" fill="var(--surface2)" stroke="var(--line)"/><g fill="none" stroke="var(--muted)" stroke-opacity=".35" stroke-width="1.2">${ribs.join("")}</g><path d="M148 58 L 74 50 M152 58 L 226 50" stroke="var(--muted)" stroke-width="3" stroke-linecap="round" opacity=".45"/><rect x="138" y="62" width="24" height="168" rx="8" fill="var(--surface)" stroke="var(--line)"/>${heart}
   <g fill="var(--muted)" font-family="var(--f-mono)" font-size="8"><text x="18" y="109">2nd ICS</text><text x="18" y="133">3rd</text><text x="18" y="157">4th</text><text x="18" y="181">5th</text></g>${pts}
   <text x="150" y="290" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="var(--f-mono)">${mapMode==="lung"?"Dashed: fissures · back of chest below":"A aortic · P pulmonic · E Erb's · T tricuspid · M mitral"}</text></svg>
   ${mapMode==="lung"?`<div style="margin-top:10px"><button class="chip${mapSel==="bases"?" on":""}" id="basesBtn">Posterior bases (back)</button></div>`:""}`;
}

/* compare */
let cmpSet="sys",cmpPick=null;
route("sounds:compare","Compare",(root,setId)=>{
  if(setId&&SETS.some(x=>x.id===setId))cmpSet=setId;const S=SETS.find(x=>x.id===cmpSet);if(!cmpPick||!S.ids.includes(cmpPick))cmpPick=S.ids[0];
  root.innerHTML=`<section class="ph"><span class="eyebrow">Contrast</span><h1>Tell look-alikes apart</h1><p class="lede">Switch between sounds while playback continues: hearing them back to back is what makes the difference stick.</p></section>${soundTabs("compare")}
   <select class="sel" id="cs" aria-label="Comparison set">${SETS.map(x=>`<option value="${x.id}" ${x.id===cmpSet?"selected":""}>${esc(x.name)}</option>`).join("")}</select>
   <div class="chips" id="cpk">${S.ids.map(i=>`<button class="chip${i===cmpPick?" on":""}" data-p="${i}">${esc(SOUNDS[i].name)}</button>`).join("")}</div>
   <div id="cp"></div>
   <div class="tbl"><table class="cmp"><tr><th></th>${S.ids.map(i=>`<th>${esc(SOUNDS[i].name)}</th>`).join("")}</tr>${S.rows.map(r=>`<tr><td>${r[0]}</td>${r[1].map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  bindSoundTabs(root);
  const p=mk($("#cp"),cmpPick);
  $("#cs").addEventListener("change",e=>{cmpSet=e.target.value;cmpPick=null;replace("compare",cmpSet);});
  $("#cpk").addEventListener("click",e=>{const b=e.target.closest("[data-p]");if(!b)return;const was=E.box===p;cmpPick=b.dataset.p;$$("#cpk .chip").forEach(x=>x.classList.toggle("on",x===b));p.set(cmpPick);markSeen(cmpPick);if(was)startBox(p);});
});

/* foundations */
route("sounds:learn","Foundations",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Auscultation</span><h1>How sounds are made, and why you hear them where you do</h1></section>${soundTabs("learn")}
   <div id="heroP"></div>
   <div class="stack">${CHAPTERS.map((c,i)=>`<details class="acc"${i===0?" open":""}><summary><span class="n">${pad2(i+1)}</span><span class="st"><b>${c[0]}</b></span></summary><div class="acc-body prose">${c[1]}</div></details>`).join("")}</div>
   <div class="card prose small"><p>Teaching sounds are synthesised in your browser from the physiology described in each lesson. Real recordings: heart sounds from the <a href="https://github.com/sani002/BMD-HS-Dataset" target="_blank" rel="noopener">BMD-HS dataset</a> (mHealth Lab, BUET; CC BY-NC-ND 4.0, files unmodified) and lung sounds from <a href="https://github.com/SJTU-YONGFU-RESEARCH-GRP/SPRSound" target="_blank" rel="noopener">SPRSound</a> (Shanghai Jiao Tong University; CC BY 4.0).</p><p class="muted">For learning only. Not for diagnosis.</p></div>`;
  bindSoundTabs(root);
  mk($("#heroP"),"normal");
  $$("details.acc",root).forEach(d=>{const go=()=>{["demoS3","demoMS"].forEach(i=>{const el=$("#"+i,d);if(el&&!el.dataset.on){el.dataset.on=1;mk(el,i==="demoS3"?"s3":"ms");}});};d.addEventListener("toggle",()=>{if(d.open)go();});if(d.open)go();});
});
const CHAPTERS=[
["How heart sounds are made",`<p>Heart sounds come from <strong>sudden deceleration of blood</strong>. When a valve closes, the moving column of blood stops abruptly and the blood, valve apparatus and ventricular walls vibrate together. The leaflets themselves make little sound.</p>
<ul><li><strong>S1</strong> = M1 then T1. Ventricular pressure overtakes atrial pressure at the start of systole. Loudest at the apex.</li><li><strong>S2</strong> = A2 then P2. Ventricular pressure falls below aortic and pulmonary pressure at the end of systole. Loudest at the base.</li><li><strong>Extra sounds</strong> come from sudden events: a stiff valve snapping open (opening snap, ejection click), tensing chordae (mid-systolic click), or blood hitting a ventricular limit during filling (S3, S4).</li><li><strong>Murmurs</strong> come from turbulence: high velocity, a narrow orifice, or abnormal flow.</li></ul>
<p>Respiration moves the right-sided events: inspiration increases venous return to the right heart, so P2 is delayed and right-sided murmurs get louder.</p>`],
["Bell vs diaphragm",`<p>Heart sounds span roughly 20–500 Hz, and the ear is least sensitive at the low end. The chest piece is a frequency filter:</p><ul><li><strong>Bell, light pressure</strong>: passes low frequencies. Use it for S3, S4 and the mitral stenosis rumble. Press too hard and the stretched skin turns it into a diaphragm.</li><li><strong>Diaphragm, firm pressure</strong>: blocks low frequencies and keeps high ones. Use it for S1, S2, splits, clicks, AR, MR and most lung sounds.</li></ul><p>Try it on this S3: switch between Bell and Diaphragm and watch the third sound disappear from the trace.</p><div id="demoS3"></div>`],
["Why sounds are heard where they are",`<p>The valves sit in a tight cluster behind the sternum at the 3rd–4th costal level. The classic areas are <strong>not over the valves</strong>. They are where the sound is carried closest to the chest wall:</p><ul><li><strong>Sound travels with blood flow.</strong> AS is carried up the ascending aorta to the right 2nd space and the carotids; MR back into the left atrium toward the axilla; AR down the left sternal edge into the LV.</li><li><strong>Chambers touching the chest wall transmit best.</strong> The LV apex meets the wall at the apex beat; the RV lies behind the lower sternum.</li><li><strong>Tissue between source and stethoscope filters sound.</strong> Air (emphysema), fluid (effusion) and fat all soften heart sounds.</li></ul>`],
["Murmur physics and grading",`<p>A murmur's <strong>pitch reflects the pressure gradient</strong>. Large gradients make high-pitched blowing murmurs (AR, MR); small gradients make low rumbles (MS). Its <strong>shape follows the gradient over time</strong>: rising and falling through ejection (AS), constant through systole (MR, VSD), falling through diastole (AR).</p>
<div class="tbl"><table><tr><th>Grade</th><th>Levine scale (systolic)</th></tr><tr><td>1</td><td>Very faint, heard only with effort</td></tr><tr><td>2</td><td>Faint, heard straight away</td></tr><tr><td>3</td><td>Moderately loud, no thrill</td></tr><tr><td>4</td><td>Loud, with a palpable thrill</td></tr><tr><td>5</td><td>Heard with the stethoscope edge on the chest</td></tr><tr><td>6</td><td>Heard with the stethoscope just off the chest</td></tr></table></div><p>Describe a murmur by timing, shape, location, radiation, grade, pitch and response to manoeuvres.</p>`],
["How lung sounds are made",`<p>Breath sounds come from <strong>turbulent flow in the large airways</strong>. Healthy, air-filled lung filters out high frequencies, so peripheral (vesicular) sounds are soft and low.</p><ul><li><strong>Consolidation</strong> is solid and transmits high frequencies: bronchial breathing and increased vocal resonance.</li><li><strong>Air or fluid in the pleura</strong> reflects sound away: reduced breath sounds and reduced resonance.</li><li><strong>Discontinuous sounds</strong> (crackles) come from airways snapping open or bubbling through secretions; <strong>continuous sounds</strong> (wheeze, stridor) from airway walls oscillating in narrowed airways.</li></ul><p><strong>Bronchophony</strong>, <strong>egophony</strong> (“ee” heard as “ay”) and <strong>whispered pectoriloquy</strong> all point to consolidation.</p>`],
["Technique and positions",`<ul><li>Quiet room, warm diaphragm on bare skin, never through clothing.</li><li>Palpate first: apex beat, heaves, thrills. Then <strong>time S1 with the carotid upstroke</strong>.</li><li>Inch through each area with the diaphragm, then repeat with the bell at the apex and lower left sternal edge.</li><li><strong>Left lateral decubitus</strong> brings the apex to the wall: MS, S3, S4.</li><li><strong>Sitting forward, breath held in full expiration</strong>: AR, pericardial rub.</li><li>Lungs: sitting, mouth open, slightly deeper breaths; compare each point with the other side, apices to bases, front, sides and back.</li></ul><p>Mitral stenosis is the classic sound missed by poor positioning:</p><div id="demoMS"></div>`],
["Dynamic manoeuvres",`<div class="tbl"><table><tr><th>Manoeuvre</th><th>Physiology</th><th>Effect</th></tr><tr><td>Inspiration</td><td>More venous return to the right heart</td><td>Right-sided murmurs louder (TR, RV S3); S2 split widens</td></tr><tr><td>Valsalva / standing</td><td>Less preload, smaller LV</td><td>Most murmurs softer. HOCM louder; MVP click earlier</td></tr><tr><td>Squat / leg raise</td><td>More preload (squat also raises afterload)</td><td>Most murmurs louder. HOCM softer; MVP click later</td></tr><tr><td>Handgrip</td><td>Higher afterload</td><td>MR, AR, VSD louder; AS and HOCM softer</td></tr><tr><td>Left lateral</td><td>Apex against the chest wall</td><td>MS rumble, S3, S4 louder (bell)</td></tr><tr><td>Sit forward, expire</td><td>Base closer to the chest wall</td><td>AR and pericardial rub louder</td></tr></table></div>`],
["Auscultation in the emergency department",`<ul><li><strong>Noise:</strong> ask for alarms to be silenced briefly, press the diaphragm firmly, close your eyes.</li><li><strong>Supine patients:</strong> listen anteriorly and laterally; in supine trauma, pleural air collects anteriorly.</li><li><strong>Tachycardia</strong> shortens diastole: palpate the carotid while you listen.</li><li><strong>After intubation:</strong> listen in both axillae and over the epigastrium.</li><li><strong>Low output quietens murmurs.</strong> Severe AS, acute MR and septal rupture can sound unimpressive in shock.</li><li><strong>Know the limits.</strong> Auscultation misses many pneumothoraces, effusions, early oedema and tamponade: image when the story fits.</li></ul>`]
];
