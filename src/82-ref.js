"use strict";
/* ================= SIGNS ================= */
const SF={q:"",v:"all",sys:"all",reg:"all",fig:false,sort:"best"};
const REG_NAME=Object.fromEntries(REGIONS.map(r=>[r.id,r.name]));
/* a sign belongs to a region if its data says so (s.reg) or the region page lists it */
const regOf=(k,s)=>s&&s.reg&&REG_NAME[s.reg]?s.reg:((REGIONS.find(r=>r.tests.includes(k))||{}).id||"");
const inReg=(k,s,reg)=>(s&&s.reg===reg)||(REGIONS.find(r=>r.id===reg)||{tests:[]}).tests.includes(k);
const seenSigns=()=>{const a=Store&&Store.s&&Store.s.signs;return new Set(Array.isArray(a)?a:[]);};
const vRank=v=>{const i=VERDICT_ORDER.indexOf(v);return i<0?9:i;};
const strengthOf=s=>decisiveStrength(s);
function decisiveChip(s){
  const d=decisiveLR(s);
  if(d)return `<span class="lr ${d.k==="sens"||d.k==="spec"?"strong":lrClass(d.v)}">${esc(decisiveLabel(d))}</span>`;
  if(s.p!=null||s.n!=null)return `<span class="lr weak">LR ≈ 1</span>`;
  return s.type==="rule"?`<span class="lr norule">rule</span>`:s.type==="vital"?`<span class="lr norule">vital</span>`:"";
}
route("signs:library","Signs & tests",(root)=>{
  const counts={};Object.values(SIGNS).forEach(s=>counts[s.v]=(counts[s.v]||0)+1);
  const total=Object.values(SIGNS).filter(s=>!s.hide).length;
  root.innerHTML=`<section class="ph sl-ph"><span class="eyebrow">Signs & tests</span><h1>What each test is worth</h1><p class="lede">${total} signs with their likelihood ratios, mechanism, and a verdict on whether they earn a place in your examination.</p></section>
  <div class="hscroll sl-tools"><button class="btn sm soft" data-go="signs/calc">${ic("scale")}LR calculator</button><button class="btn sm ghost" data-go="signs/er">ER essentials</button><button class="btn sm ghost" data-go="signs/verdicts">Which tests are archaic?</button><button class="btn sm ghost" data-go="signs/atlas">Illustration atlas</button><button class="btn sm ghost" data-go="signs/images">Photo library</button></div>
  <label class="search sl-search">${ic("search")}<input id="sq" type="search" placeholder="Search signs, diagnoses…" value="${esc(SF.q)}" autocomplete="off" enterkeyhint="search" aria-label="Search signs, diagnoses, abbreviations"></label>
  <div class="sl-filters"><div class="chips hscroll" id="vf" role="group" aria-label="Verdict">${[["all","All"],...VERDICT_ORDER.map(v=>[v,VERDICT[v]])].map(([k,l])=>`<button class="chip${SF.v===k?" on":""}" data-v="${k}" aria-pressed="${SF.v===k}">${k!=="all"?`<span class="v v-${k}" style="padding:0;background:none">${counts[k]||0}</span>`:""}${l}</button>`).join("")}</div>
  <div class="chips hscroll" id="sf" role="group" aria-label="System">${[["all","All systems"],...Object.entries(SYS_SHORT)].map(([k,l])=>`<button class="chip${SF.sys===k?" on":""}" data-s="${k}" aria-pressed="${SF.sys===k}">${l}</button>`).join("")}<button class="chip${SF.fig?" on":""}" id="figf" aria-pressed="${SF.fig}">${ic("eye")}Illustrated</button></div>
  <div class="chips hscroll" id="rf" role="group" aria-label="Region"${SF.sys==="msk"?"":" hidden"}>${[["all","All regions"],...REGIONS.map(r=>[r.id,r.name])].map(([k,l])=>`<button class="chip${SF.reg===k?" on":""}" data-r="${k}" aria-pressed="${SF.reg===k}">${l}</button>`).join("")}</div></div>
  <div class="row-x sl-meta"><span class="label" id="scount" aria-live="polite"></span><span class="spacer"></span><label class="small muted sl-sort"><span class="st">Sort</span> <select class="sel sm" id="ssort" aria-label="Sort order"><option value="best">Verdict, then strength</option><option value="lr">Strongest LR first</option><option value="az">A to Z</option></select></label></div>
  <div id="slist"></div>`;
  $("#ssort").value=SF.sort;
  const draw=()=>{
    const hits=signSearch(SF.q),seen=seenSigns();
    const L=Object.entries(SIGNS).filter(([k,s])=>!s.hide&&(SF.v==="all"||s.v===SF.v)&&(SF.sys==="all"||s.sys===SF.sys)&&(SF.sys!=="msk"||SF.reg==="all"||inReg(k,s,SF.reg))&&(!SF.fig||(s.fig&&FIG[s.fig]))&&(!hits||hits.has(k)));
    const by={best:(a,b)=>vRank(a[1].v)-vRank(b[1].v)||strengthOf(b[1])-strengthOf(a[1]),lr:(a,b)=>strengthOf(b[1])-strengthOf(a[1])||vRank(a[1].v)-vRank(b[1].v),az:(a,b)=>a[1].name.localeCompare(b[1].name)};
    L.sort(hits?((a,b)=>hits.get(b[0])-hits.get(a[0])||by.best(a,b)):by[SF.sort]||by.best);
    $("#slist").innerHTML=L.length?`<div class="list sl-list">${L.map(([k,s])=>{const rg=regOf(k,s);return `<button class="lrow" data-go="signs/sign/${k}"><span class="dot${seen.has(k)?" on":""}" title="${seen.has(k)?"Opened":"Not opened yet"}"></span><span class="txt"><b>${esc(s.name)}</b><span>${esc(s.target)} · ${esc(rg?REG_NAME[rg]:SYS_SHORT[s.sys]||"")}${isSingleStudy(s)?` · <i class="sl-cav">single study</i>`:""}</span></span><span class="stack sl-r"><span class="v v-${s.v}">${VERDICT[s.v]||""}</span>${decisiveChip(s)}</span></button>`;}).join("")}</div>`
      :`<div class="empty">Nothing matches${SF.q?` “${esc(SF.q)}”`:""}${SF.v!=="all"||SF.sys!=="all"||SF.fig?" with these filters":""}. Try a diagnosis (“effusion”), an abbreviation (“ACL”, “PE”) or <button class="linkbtn" id="sclear">clear the filters</button>.</div>`;
    const tl=SF.q.trim()?toolSearch(SF.q):[];
    if(tl.length)$("#slist").insertAdjacentHTML("beforeend",`<div class="section sl-toolhits"><span class="label">Scores and calculators</span><div class="chips">${tl.map(t=>`<button class="chip" data-go="tools/calc/${esc(t.id)}">${ic("scale")}${esc(t.name)}</button>`).join("")}</div></div>`);
    $("#scount").textContent=`${L.length} of ${total}${hits?" · best match first":""}`;
    const c=$("#sclear");if(c)c.addEventListener("click",()=>{SF.q="";SF.v="all";SF.sys="all";SF.reg="all";SF.fig=false;render(false,true);});
  };
  let tmr=0;$("#sq").addEventListener("input",e=>{SF.q=e.target.value;clearTimeout(tmr);tmr=setTimeout(draw,90);});
  const press=(sel,b)=>$$(sel).forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-pressed",x===b);});
  $("#vf").addEventListener("click",e=>{const b=e.target.closest("[data-v]");if(!b)return;SF.v=b.dataset.v;press("#vf .chip",b);draw();});
  $("#sf").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;SF.sys=b.dataset.s;SF.reg="all";press("#sf [data-s]",b);$("#rf").hidden=SF.sys!=="msk";press("#rf .chip",$('#rf [data-r="all"]'));draw();});
  $("#figf").addEventListener("click",e=>{SF.fig=!SF.fig;e.currentTarget.classList.toggle("on",SF.fig);e.currentTarget.setAttribute("aria-pressed",SF.fig);draw();});
  $("#rf").addEventListener("click",e=>{const b=e.target.closest("[data-r]");if(!b)return;SF.reg=b.dataset.r;press("#rf .chip",b);draw();});
  $("#ssort").addEventListener("change",e=>{SF.sort=e.target.value;draw();});
  draw();
});
const lrPos=v=>clamp(50+Math.log10(v)*25,2,98);
function lrScale(s){if(s.p==null&&s.n==null)return "";
  return `<div class="stack" style="gap:8px"><span class="eyebrow">Where it sits on the likelihood scale</span>
   <div class="scale">${s.n!=null?`<i class="n" style="left:${lrPos(s.n)}%" title="LR− ${esc(s.n)}"></i>`:""}${s.p!=null?`<i style="left:${lrPos(s.p)}%" title="LR+ ${esc(s.p)}"></i>`:""}</div>
   <div class="scale-l"><span>0.01</span><span>0.1</span><span>1</span><span>10</span><span>100</span></div>
   <div class="scale-l" style="margin-top:0"><span>← rules out</span><span>no change</span><span>rules in →</span></div>
   <p class="small muted">${s.p!=null?`<b style="color:var(--accent-ink)">●</b> positive result (LR+ ${esc(s.p)}) `:""}${s.n!=null?`<b>●</b> negative result (LR− ${esc(s.n)}). `:""}LRs of 2–5 or 0.5–0.2 shift probability a little; 5–10 or 0.2–0.1 moderately; beyond 10 or 0.1, decisively.</p></div>`;}
function anglesHTML(id,opt={}){
  const a=(typeof ANGLES!=="undefined")&&ANGLES[id];if(!a)return "";
  const pair=a.pair&&SIGNS[a.pair.with]?`<div class="ang"><span class="k">Contrast with</span><div class="row-x">${signChip(a.pair.with)}<span class="small">${esc(a.pair.why)}</span></div></div>`:"";
  return `<div class="stack angles" style="gap:14px">
   ${a.vignette?`<div class="ang"><span class="k">A case</span><p>${esc(a.vignette)}</p></div>`:""}
   ${a.trap&&!opt.noTrap?`<div class="ang trap"><span class="k">The trap</span><p>${esc(a.trap)}</p></div>`:""}
   ${a.analogy?`<div class="ang"><span class="k">Picture it</span><p class="hook">${esc(a.analogy)}</p></div>`:""}
   ${a.number?`<div class="ang"><span class="k">The number, in context</span><p class="mono">${esc(a.number)}</p><p class="tiny muted">The headline figures at the top of the page are the reference values; other studies quoted here may differ.</p></div>`:""}
   ${a.history?`<div class="ang"><span class="k">Ask first</span><p>${esc(a.history)}</p></div>`:""}
   ${pair}
   ${a.patient?`<div class="ang"><span class="k">Say it to the patient</span><p>${esc(a.patient)}</p></div>`:""}
   ${a.document?`<div class="ang"><span class="k">Write it in the notes</span><p class="mono small">${esc(a.document)}</p></div>`:""}
   ${a.teachback?`<details class="acc"><summary><span class="st"><b>Teach it back</b><span>${esc(a.teachback.q)}</span></span></summary><div class="acc-body"><div><textarea class="inp" rows="3" placeholder="Explain it in your own words first…"></textarea></div><div><span class="k">Model answer</span>${esc(a.teachback.a)}</div></div></details>`:""}</div>`;
}
function ssBars(s){
  if(s.sens==null&&s.spec==null)return "";
  const bar=(l,v,c,t)=>`<div class="ssbar"><span>${l}</span><span class="tr">${v!=null?`<i style="width:${v}%;background:${c}"></i>`:""}</span><b class="num">${v!=null?esc(v)+"%":"–"}</b></div><p class="small muted ssnote">${t}</p>`;
  const snout=s.sens!=null&&s.sens>=90,spin=s.spec!=null&&s.spec>=90;
  return `<div class="stack" style="gap:10px"><span class="eyebrow">Sensitivity and specificity</span>
   ${bar("Sensitivity",s.sens,"var(--insp)",s.sens!=null?`Of 100 patients who ${s.type==="rule"?"have it":"have the target condition"}, about ${Math.round(s.sens)} ${s.type==="rule"?"are flagged by the rule":"test positive"}.`:"Not reliably reported.")}
   ${bar("Specificity",s.spec,"var(--accent)",s.spec!=null?`Of 100 patients without it, about ${Math.round(s.spec)} test negative.`:"Not reliably reported.")}
   <p class="small">${snout&&spin?"<b>Both ends work:</b> high sensitivity (a negative helps rule out) and high specificity (a positive helps rule in).":snout?"<b>SnNout:</b> highly sensitive, so a <i>negative</i> result helps rule the diagnosis out. A positive proves little.":spin?"<b>SpPin:</b> highly specific, so a <i>positive</i> result helps rule the diagnosis in. A negative proves little.":"Neither sensitivity nor specificity reaches 90%, so on its own it neither rules in nor out; combine it with the story and other findings."}</p>
   ${s.p!=null&&s.n!=null&&s.sens!=null&&s.spec!=null&&s.spec<100&&s.spec>0?(()=>{const ip=s.sens/(100-s.spec),inn=(100-s.sens)/s.spec;const off=Math.max(ip/s.p,s.p/ip,inn/s.n,s.n/inn);return off>1.5?`<p class="tiny muted">Sensitivity and specificity here imply LR+ ${ip.toFixed(1)} and LR− ${inn.toFixed(2)}; the likelihood ratios shown come from a separately pooled analysis${srcOf(s)?` (${esc(srcOf(s))})`:""}.</p>`:"";})():""}</div>`;}
const SIGN_VERDICT_WHY={core:"Core: do it whenever the question arises. It moves probability enough, or is cheap and decision-changing.",useful:"Useful: worth doing when the question is open. Moderate accuracy; one piece of the picture.",low:"Low yield: weak or inconsistent evidence. Know its limits and don't lean on it.",archaic:"Archaic: historical, or replaced by a better test or imaging. Know it for exams and ward rounds."};
const firstSentence=t=>{t=String(t||"").trim();const m=t.match(/^(.+?[.!?])(\s+(?=[A-Z0-9“"(])|$)/);return m?m[1]:t;};
function faganBlock(s){
  if(s.p==null&&s.n==null)return "";
  return `<div class="stack" style="gap:8px"><span class="eyebrow">Pre-test to post-test (Fagan nomogram)</span>${faganSVG(EV.pre,[s.p!=null&&{lr:s.p,cls:"pos",label:"Positive"},s.n!=null&&{lr:s.n,cls:"neg",label:"Negative"}])}<p class="tiny muted">A straight line from your pre-test probability through the likelihood ratio lands on the post-test probability. Change the pre-test with the buttons in the bedside card.</p></div>`;
}
route("signs:sign",(id)=>SYS_SHORT[(SIGNS[id]||{}).sys]||"Sign",(root,id)=>{
  const s=SIGNS[id];if(!s)throw new Error("Sign not found");markSign(id);if(typeof DEEP!=="undefined"&&DEEP[id]){roundMark("read");}
  const mods=SYSTEMS.filter(m=>m.seq.some(st=>(st.signs||[]).includes(id)));
  const regs=REGIONS.filter(r=>r.tests.includes(id)||s.reg===r.id);
  const rg=regOf(id,s),dk=dxKey(s,id);
  const related=s.dx?Object.entries(SIGNS).filter(([k,x])=>k!==id&&!x.hide&&x.dx&&String(x.dx).toLowerCase()===String(s.dx).toLowerCase()).sort((a,b)=>strengthOf(b[1])-strengthOf(a[1])).slice(0,8):[];
  const sec=(t,v)=>v?`<div class="sec"><h3>${t}</h3><p>${esc(v)}</p></div>`:"";
  const r=Store.s.srs&&Store.s.srs["t:"+id];
  const A=(typeof ANGLES!=="undefined"&&ANGLES[id])||{};
  const rep=(typeof REPLACED!=="undefined"?REPLACED:[]).find(x=>x.ids.includes(id));
  const T=typeof TECH!=="undefined"&&TECH.find(t=>(t.signs||[]).includes(id));
  const wide=window.innerWidth>=1100;
  const layer=(key,title,sub,body,open)=>body?`<details class="acc layer" id="L-${key}"${open?" open":""}><summary><span class="st"><b>${title}</b><span>${sub}</span></span></summary><div class="acc-body">${body}</div></details>`:"";
  const how1=firstSentence(s.how);
  const dl=decisiveLine(s);
  const d=decisiveLR(s);
  root.innerHTML=`<section class="ph"><div class="row-x"><span class="v v-${s.v}">${VERDICT[s.v]||""}</span><span class="tag">${esc(SYS_NAME[s.sys]||"")}</span>${rg?`<span class="tag">${esc(REG_NAME[rg])}</span>`:""}<span class="tag">${esc(TYPE_LABEL[s.type]||s.type||"")}</span></div>
    <h1>${esc(s.name)}</h1><p class="quote">Use it for: ${esc(s.target)}</p></section>
   <section class="card bedside" aria-label="At the bedside">
    <div class="bs-head"><span class="eyebrow">At the bedside</span><span class="tiny muted">10-second summary</span></div>
    ${d?`<div class="bs-verdict"><span class="bs-big lr ${d.k==="sens"||d.k==="spec"?"strong":lrClass(d.v)}">${esc(decisiveLabel(d))}</span><p>${esc(dl)}${d.k==="p"&&s.n!=null?` A negative result: LR− ${esc(s.n)}.`:d.k==="n"&&s.p!=null?` A positive result: LR+ ${esc(s.p)}.`:""}</p></div>`:(s.p!=null||s.n!=null)?`<div class="bs-verdict"><p>${esc(dl||"Neither result moves probability much.")}</p></div>`:""}
    ${evChips(s,id)}
    ${probShift(s)}
    ${rep?`<div class="bs-line bs-instead"><span class="k">Use instead</span><p>${esc(rep.now)}. <span class="muted">${esc(rep.why)}</span></p></div>`:""}
    <div class="bs-line"><span class="k">What to think</span><p>${esc(s.think)}</p></div>
    ${how1?`<div class="bs-line"><span class="k">How, in one line</span><p>${esc(how1)} ${s.how&&s.how.length>how1.length+3?`<button class="linkbtn" data-open-layer="how">Full steps</button>`:""}</p></div>`:""}
    ${A.trap?`<div class="bs-line bs-trap"><span class="k">The trap</span><p>${esc(A.trap)}</p></div>`:""}
    <div class="row-x bs-act">${s.p!=null||s.n!=null?`<button class="btn sm soft" data-go="signs/calc/${id}">${ic("scale")}Calculator</button>`:""}${T?`<button class="btn sm ghost" data-go="learn/tech/${T.id}">${ic("check")}Technique clinic</button>`:""}<button class="btn sm ghost" id="layAll">Open all sections</button></div>
   </section>
   ${s.fig?fig(s.fig):""}
   <div class="layers" id="signLayers">
    ${layer("how","How to do it","Every step, and the anatomy underneath",s.how||s.anat?`${sec("How to do it",s.how)}${sec("The anatomy",s.anat)}`:"",wide)}
    ${layer("why","Why it works","The mechanism",sec("Why it works",s.mech),false)}
    ${layer("ev","The evidence","Sensitivity, specificity, the nomogram and the verdict",`${ssBars(s)}${faganBlock(s)}${lrScale(s)}<div class="stack" style="gap:8px"><span class="eyebrow">Value in practice</span><p>${SIGN_VERDICT_WHY[s.v]||""}</p>${s.note?`<div class="note"><b>Evidence note.</b> ${esc(s.note)}</div>`:""}${srcOf(s)?`<p class="tiny muted">Headline figures: ${esc(srcOf(s))}.</p>`:""}</div>`,wide)}
    ${layer("angles","From every angle","A case, a picture, the numbers in context, what to write",anglesHTML(id,{noTrap:true}),false)}
    ${typeof deepDive==="function"?layer("deep","ER deep dive","History, anatomy and practice in 2026",deepDive(id),false):""}
    ${typeof memoryBlock==="function"?layer("mem","Remember it","A hook and checked mnemonics",memoryBlock(id),false):""}
    ${IMG_SUBJECTS[id]?layer("photo","Photographs","Openly licensed photographs; pin the clearest",Img.galleryHTML("s:"+id,IMG_SUBJECTS[id][1],{title:IMG_SUBJECTS[id][0]}),false):""}
   </div>
   ${mods.length||regs.length?`<div class="section"><span class="label">Part of</span><div class="chips">${mods.map(m=>`<button class="chip" data-go="learn/module/${m.id}">${esc(m.name)}</button>`).join("")}${regs.map(g=>`<button class="chip" data-go="learn/region/${g.id}">${esc(g.name)} exam</button>`).join("")}</div></div>`:""}
   ${related.length?`<div class="section"><span class="label">Same diagnosis, compare the evidence</span><div class="chips">${related.map(([k])=>signChip(k)).join("")}</div></div>`:""}
   <p class="small muted">${r?`In your reviews: next due ${r.due<=dayNum()?"today":"in "+(r.due-dayNum())+" day"+(r.due-dayNum()>1?"s":"")}.`:"Comes up in your daily session once you've opened it."}</p>`;
  bindProbShift(root,s,()=>{const ev=$("#L-ev .fagan",root);if(ev)ev.outerHTML=faganSVG(EV.pre,[s.p!=null&&{lr:s.p,cls:"pos",label:"Positive"},s.n!=null&&{lr:s.n,cls:"neg",label:"Negative"}]);});
  $$("[data-open-layer]",root).forEach(b=>b.addEventListener("click",()=>{const L=$("#L-"+b.dataset.openLayer,root);if(L){L.open=true;L.scrollIntoView({behavior:"smooth",block:"start"});}}));
  const all=$("#layAll",root),Ls=()=>$$("#signLayers>details",root);
  const sync=()=>{all.textContent=Ls().every(x=>x.open)?"Close all sections":"Open all sections";};
  all.addEventListener("click",()=>{const open=!Ls().every(x=>x.open);Ls().forEach(x=>x.open=open);sync();});
  Ls().forEach(x=>x.addEventListener("toggle",sync));sync();
  Img.bindGalleries(root);
});
route("signs:images","Photo library",(root)=>{
  const subj=[...Object.entries(IMG_SUBJECTS).map(([id,[n,t,sys]])=>({id:"s:"+id,n,sys,go:SIGNS[id]?`signs/sign/${id}`:`signs/imgsub/${id}`})),...DCOND.map(c=>({id:"d:"+c.id,n:c.n,sys:"derm",go:`learn/dcond/${c.id}`}))];
  const groups={};subj.forEach(x=>(groups[x.sys]||(groups[x.sys]=[])).push(x));
  const pinned=Object.values(Store.s.pins||{}).filter(p=>p&&!p.deleted&&p.subject);
  root.innerHTML=`<section class="ph"><span class="eyebrow">Photo library</span><h1>Real signs, real skin</h1><p class="lede">${subj.length} subjects. Galen loads openly licensed photographs from Wikimedia Commons for each one; pin the ones that teach you best and they stay with your progress. ${pinned.length?`You have pinned ${pinned.length}.`:""}</p>
   <div class="row-x"><button class="btn sm" data-go="practice/spot">${ic("eye")}Spot diagnosis</button>${Img.canUse()?(navigator.onLine===false?`<span class="small muted">You are offline: your pinned photos are saved on this device; new photos need a connection.</span>`:""):`<span class="small muted">Live photos work in the installed app.</span>`}</div></section>
   ${pinned.length?`<section class="section"><span class="label">Your pins</span><div class="gal-grid">${pinned.slice(-12).reverse().map(p=>`<figure class="gal-t pinned" data-sub="${esc(p.subject)}"><img loading="lazy" src="${esc(p.thumb)}" alt="${esc(p.title||"")}"><figcaption>${esc(String(p.subject).replace(/^[sd]:/,""))}</figcaption></figure>`).join("")}</div></section>`:""}
   ${Object.entries(groups).map(([sys,L])=>`<section class="section"><span class="label">${esc(SYS_NAME[sys]||sys)}</span><div class="chips">${L.map(x=>{const n=Img.pinsOf(x.id).length;return `<button class="chip${n?" on":""}" data-go="${x.go}">${esc(x.n)}${n?` <span class="mono tiny">${n}</span>`:""}</button>`;}).join("")}</div></section>`).join("")}`;
  $$("[data-sub]",root).forEach(f=>f.addEventListener("click",()=>{const sub=f.dataset.sub;const id=sub.slice(2);if(sub.startsWith("d:"))open("learn","dcond",id);else if(SIGNS[id])open("signs","sign",id);else if(IMG_SUBJECTS[id])open("signs","imgsub",id);}));
});
route("signs:imgsub",(id)=>(IMG_SUBJECTS[id]||[id])[0],(root,id)=>{
  const s=IMG_SUBJECTS[id];if(!s)throw new Error("Unknown subject");
  if(SIGNS[id]){open("signs","sign",id);return;}
  const info=IMGSUB_INFO[id];
  const links=info?info[2].filter(([,go])=>{const [t,v,a]=go.split("/");return v==="dcond"?DCOND.some(c=>c.id===a):v==="calc"?TOOLS.some(x=>x.id===a):ROUTES[t+":"+v];}):[];
  const ii=(typeof IMG_INFO!=="undefined"&&IMG_INFO[id])||null;
  const cap=ii&&ii.cap?ii.cap:info?info[0]:"";
  const sg=[...new Set([...(ii&&ii.signs||[]),...(info?info[1]:[])])].filter(k=>SIGNS[k]);
  root.innerHTML=`<section class="ph"><span class="eyebrow">${esc(SYS_NAME[s[2]]||"Photographs")}</span><h1>${esc(s[0])}</h1><p class="lede">${cap?esc(cap):"Openly licensed photographs from Wikimedia Commons."}</p>
   ${sg.length||links.length?`<div class="chips">${sg.map(signChip).join("")}${links.map(([t,go])=>`<button class="chip" data-go="${esc(go)}">${ic("chev")}${esc(t)}</button>`).join("")}</div>`:""}
   <p class="small muted">Photographs from Wikimedia Commons, open licences. Pin the clearest; hide the ones that mislead.${navigator.onLine===false?" You are offline: pinned photos are saved on this device; new ones need a connection.":""}</p></section>${Img.galleryHTML("s:"+id,s[1],{title:s[0]})}`;
  const g=$(".gal",root);if(g)g.dataset.n=36;Img.bindGalleries(root);
});
route("signs:atlas","Atlas",(root)=>{
  const users={};Object.entries(SIGNS).forEach(([k,s])=>{if(s.fig)(users[s.fig]||(users[s.fig]=[])).push(k);});
  root.innerHTML=`<section class="ph"><span class="eyebrow">Atlas</span><h1>The anatomy behind the exam</h1><p class="lede">${Object.keys(FIG).length} illustrations of the structures and physiology each manoeuvre relies on. Tap one to see the tests that use it.</p></section>
   <div class="atlas">${Object.keys(FIG).map(k=>{const u=users[k]||[];const reg=REGIONS.find(r=>r.fig===k);const NF={cord:"learn/localise/cord","cn-brainstem":"learn/cranial",homunculus:"learn/localise/rules","vasc-territories":"learn/localise/vessels","medulla-x":"learn/localise/stem"};const go=reg?`learn/region/${reg.id}`:u.length?`signs/sign/${u[0]}`:NF[k]||"";if(!go)return `<div>${fig(k,{small:true})}</div>`;return `<div data-go="${go}" role="button" tabindex="0">${fig(k,{small:true})}</div>`;}).join("")}</div>`;
});
/* ER essentials, by presentation. Ids that do not exist are skipped; weak or archaic signs move to "myths". */
const ER_GROUPS=[
 ["Chest pain and collapse","Is it dissection, tamponade or bleeding?",["bp-arms","pulsus-paradoxus","tamponade-signs","postural","shock-index","irregular-pulse","kussmaul-sign"],[["HEART score","tools/calc/heart"]]],
 ["Breathless","Heart, lungs or clot?",["jvp","ajr","s3","crackles","wells-pe","plr","resp-rate","stridor-sign","paradox-abdomen","tracheal-deviation","peak-flow"],[["Wells PE","tools/calc/wells-pe"],["PERC","tools/calc/perc"],["CURB-65","tools/calc/curb65"]]],
 ["Sepsis, fever and shock","Who is sick, and how sick?",["qsofa","news2","temp","purpura-glass","passive-leg-mottling","kussmaul-breathing","cap-refill"],[["NEWS2","tools/calc/news2"],["qSOFA","tools/calc/qsofa"]]],
 ["Headache, confusion and head injury","Bleed, meningitis or raised pressure?",["gcs","ct-head-rule","battle","fundoscopy","asterixis","kernig","neck-stiffness"],[["Ottawa SAH rule","tools/calc/ottawa-sah"],["Canadian CT head","tools/calc/cchr"],["GCS","tools/calc/gcs"]]],
 ["Stroke and weakness","Where is the lesion, and is it time-critical?",["befast","pronator-drift","babinski","facial-palsy","visual-fields","rapd","horner"],[]],
 ["Dizziness","Central or peripheral?",["hints","dix-hallpike","epley","tandem"],[]],
 ["Acute abdomen and scrotum","Surgical or not?",["rlq-tender","rovsing","psoas","alvarado","murphy","aaa-palp","carnett","cough-test","cremasteric","cmt","cva","cullen"],[["Alvarado","tools/calc/alvarado"],["AIR score","tools/calc/air"],["TWIST","tools/calc/twist"]]],
 ["Injured limb, neck or back","Image or not?",["ottawa-ankle","ottawa-knee","thompson","scaphoid","elbow-ext","c-spine-rule","cauda","log-roll","patellar-pubic","lachman"],[["Canadian C-spine","tools/calc/ccsr"],["NEXUS","tools/calc/nexus"],["Kocher (septic hip)","tools/calc/kocher"]]],
 ["Leg swelling and electrolytes","Clot, and the twitch signs",["wells-dvt","homans","chvostek","trousseau"],[["Wells DVT","tools/calc/wells-dvt"]]]];
/* D04's ER_ESS (66-deep.js) is the source of which signs belong where; this adds the question and decision tools per group */
const ER_META={chest:["Dissection, tamponade, clot or coronary?",[["HEART score","tools/calc/heart"],["Wells PE","tools/calc/wells-pe"],["PERC","tools/calc/perc"]]],
 breath:["Heart, lungs, air or acid?",[["CURB-65","tools/calc/curb65"],["Wells PE","tools/calc/wells-pe"]]],
 shock:["Who is sick, and how sick?",[["NEWS2","tools/calc/news2"],["qSOFA","tools/calc/qsofa"],["Shock index","tools/calc/shock-index"]]],
 head:["Bleed, arteritis, stroke or delirium?",[["Ottawa SAH rule","tools/calc/ottawa-sah"]]],
 dizzy:["Central or peripheral?",[]],
 trauma:["Image or not?",[["Canadian CT head","tools/calc/cchr"],["Canadian C-spine","tools/calc/ccsr"],["NEXUS","tools/calc/nexus"],["GCS","tools/calc/gcs"]]],
 abdo:["Surgical or not?",[["Alvarado","tools/calc/alvarado"],["AIR score","tools/calc/air"],["TWIST","tools/calc/twist"]]],
 limb:["Fracture, compartment, cauda equina or clot?",[["Ottawa ankle","tools/calc/ottawa-ankle"],["Ottawa knee","tools/calc/ottawa-knee"],["Kocher (septic hip)","tools/calc/kocher"],["Wells DVT","tools/calc/wells-dvt"]]]};
function erGroups(){
  if(typeof ER_ESS!=="undefined"&&Array.isArray(ER_ESS)&&ER_ESS.length)return ER_ESS.filter(g=>g.id!=="myths").map(g=>[g.t,(ER_META[g.id]||[""])[0],g.ids,(ER_META[g.id]||[0,[]])[1]]);
  return ER_GROUPS;
}
const erMythIds=()=>typeof ER_ESS!=="undefined"&&Array.isArray(ER_ESS)?((ER_ESS.find(g=>g.id==="myths")||{}).ids||[]):[];
function erRow(k){const s=SIGNS[k];const d=DEEP&&DEEP[k];
  return `<button class="lrow" data-go="signs/sign/${k}"><span class="txt"><b>${esc(s.name)}</b><span>Use it for: ${esc(s.target)}</span>${d&&d.hook?`<span class="er-hook">${esc(d.hook)}</span>`:""}</span><span class="stack sl-r"><span class="v v-${s.v}">${VERDICT[s.v]||""}</span>${decisiveChip(s)}</span></button>`;}
route("signs:er","ER essentials",(root)=>{
  const used=new Set(),myths=[];
  const G=erGroups().map(([t,q,ids,tools])=>{const L=ids.filter(k=>SIGNS[k]&&!SIGNS[k].hide&&!used.has(k));L.forEach(k=>used.add(k));
    const good=L.filter(k=>!["low","archaic"].includes(SIGNS[k].v)).sort((a,b)=>vRank(SIGNS[a].v)-vRank(SIGNS[b].v)||strengthOf(SIGNS[b])-strengthOf(SIGNS[a]));
    L.filter(k=>["low","archaic"].includes(SIGNS[k].v)).forEach(k=>myths.push(k));
    const tl=tools.filter(([,go])=>TOOLS.some(x=>x.id===go.split("/")[2]));
    return {t,q,good,tl};}).filter(g=>g.good.length);
  erMythIds().forEach(k=>{if(SIGNS[k]&&!SIGNS[k].hide&&!myths.includes(k))myths.push(k);});
  root.innerHTML=`<section class="ph"><span class="eyebrow">Emergency department</span><h1>ER essentials, by presentation</h1><p class="lede">The signs and rules you reach for on a shift, grouped by what walks through the door. Strongest evidence first; each row shows its decisive likelihood ratio. Weak signs that still get quoted are at the end.</p></section>
   <div class="hscroll chips er-jump">${G.map((g,i)=>`<button class="chip" data-jump="er${i}">${esc(g.t)}</button>`).join("")}${myths.length?`<button class="chip" data-jump="ermyth">Myths</button>`:""}</div>
   ${G.map((g,i)=>`<section class="section" id="er${i}"><span class="label">${esc(g.t)}</span><p class="small muted er-q">${esc(g.q)}</p><div class="list">${g.good.map(erRow).join("")}</div>${g.tl.length?`<div class="chips er-tools">${g.tl.map(([t,go])=>`<button class="chip" data-go="${go}">${ic("scale")}${esc(t)}</button>`).join("")}</div>`:""}</section>`).join("")}
   ${myths.length?`<section class="section" id="ermyth"><span class="label">Myths and weak signs we still see</span><p class="small muted er-q">Know why they fail, so you can answer the ward round, and do not let them reassure you.</p><div class="list">${myths.map(k=>{const r=(typeof REPLACED!=="undefined"?REPLACED:[]).find(x=>x.ids.includes(k));return erRow(k)+(r?`<p class="small er-instead"><b>Use instead:</b> ${esc(r.now)}</p>`:"");}).join("")}</div></section>`:""}`;
  $$("[data-jump]",root).forEach(b=>b.addEventListener("click",()=>{const el=$("#"+b.dataset.jump,root);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});}));
});
route("signs:verdicts","Verdicts",(root)=>{
  const why={core:"Do it every time the question arises. Strong evidence, or cheap and decision-changing.",useful:"Worth doing when the question is open. Moderate accuracy.",low:"Weak evidence or poor reproducibility. Know its limits; don't lean on it.",archaic:"Historical. Replaced by a better bedside test or by imaging. Know it for exams."};
  root.innerHTML=`<section class="ph"><span class="eyebrow">Verdicts</span><h1>Which tests earn their place</h1><p class="lede">Each sign was judged on three things: how far it moves probability, how reproducible it is between examiners, and whether something better has replaced it. Accurate tests can still be low yield if they never change a decision; modest ones can be core if they are fast and change what you do (respiratory rate).</p></section>
  <section class="section"><span class="label">Replaced, archaic or misused, and what to do instead</span><div class="stack" style="gap:8px">${REPLACED.map(r=>`<details class="acc"><summary><span class="st"><b>${esc(r.old)}</b><span>Now: ${esc(r.now)}</span></span></summary><div class="acc-body"><div>${esc(r.why)}</div><div class="chips">${r.ids.filter(k=>SIGNS[k]).map(signChip).join("")}</div></div></details>`).join("")}</div></section>
  ${VERDICT_ORDER.map(g=>{const L=Object.entries(SIGNS).filter(([,s])=>s.v===g&&!s.hide);return `<section class="section"><div class="row-x"><span class="v v-${g}">${VERDICT[g]}</span><span class="small muted">${L.length} · ${why[g]}</span></div><div class="chips">${L.map(([k,s])=>`<button class="chip" data-go="signs/sign/${k}">${esc(s.name)}</button>`).join("")}</div></section>`;}).join("")}`;
});

/* ---------- calculator ---------- */
/* Each preset only uses findings whose LR was measured for the preset's question, and avoids pairs that share a mechanism.
   Pre-test values are illustrative starting points, not prevalence data: the user sets their own. */
const PRESETS=[
 {n:"Breathless: heart failure?",pre:30,ids:["jvp","s3","crackles"],why:"Wang 2005 LRs for heart failure in breathless ED patients. Abdominojugular reflux and oedema overlap with these: add them to see the overlap rule."},
 {n:"Systolic murmur: severe AS?",pre:20,ids:["carotid-upstroke","a2-soft",["murmur-rclav","neg"]],why:"Slow carotid upstroke and a soft or absent A2 (Etchells 1997) both target severe AS. They grade the same valve, so treat the combined value as an upper bound. S4 is not used: its LR is for a stiff ventricle, not AS."},
 {n:"Cough and fever: pneumonia?",pre:15,ids:["egophony","bronchial-breathing"],why:"Both detect consolidation by the same mechanism, so they count once. Consolidation signs are absent in many pneumonias: a chest X-ray decides."},
 {n:"Dull base: effusion?",pre:30,ids:["chest-expansion","percussion-dull"],why:"Wong 2009. Tactile fremitus overlaps with dullness (both detect fluid against the chest wall)."},
 {n:"Smoker: COPD?",pre:30,ids:["hoover","fet"],why:"Hoover's sign reflects hyperinflation; a long forced expiratory time reflects airflow obstruction. Wheeze overlaps with the latter."},
 {n:"RLQ pain: appendicitis?",pre:40,ids:["rlq-tender","rovsing","psoas"],why:"All three were studied for appendicitis. The cough test and rebound target peritonitis, so they are left out."},
 {n:"Distended abdomen: ascites?",pre:30,ids:[["shifting-dullness","neg"]],why:"Absent shifting dullness makes ascites less likely; ultrasound decides."},
 {n:"Effusion and hypotension: tamponade?",pre:30,ids:["pulsus-paradoxus"],why:"Roy 2007: pulsus > 10 mmHg in a patient with a known effusion. Echo decides."},
 {n:"Acute vertigo: central?",pre:15,ids:["hints"],why:"Uses the headline HINTS figures. Accuracy depends heavily on who examines: trained examiners do far better than ordinary ED hands (see the HINTS page). If you are not trained in it, image or get expert review."},
 {n:"Twisted knee: ACL?",pre:40,ids:["lachman","ant-drawer-knee","pivot-shift"],why:"Lachman and pivot shift measure different laxities. The anterior drawer overlaps with Lachman, so only the stronger of the two counts; McMurray targets the meniscus, not the ACL."},
 {n:"Ankle injury: fracture? (rule negative)",pre:15,ids:[["ottawa-ankle","neg"]],why:"A negative Ottawa ankle rule: its value is the LR−."},
 {n:"Neck injury: C-spine? (rule negative)",pre:2,ids:[["c-spine-rule","neg"]],why:"A negative Canadian C-spine rule in an alert, stable adult."},
 {n:"Chest pain: ACS?",pre:15,ids:["acs-radiation","chest-wall-tender"],why:"Swap 2005 LRs for acute coronary syndrome. No pain feature alone or combined allows discharge without an ECG and troponin."},
 {n:"Older patient, headache: GCA?",pre:20,ids:["jaw-claudication","temporal-artery"],why:"Smetana 2002 LRs for a positive temporal artery biopsy. Check ESR and CRP and start steroids the same day if suspicion is high."},
 {n:"Older patient, confused: delirium?",pre:25,ids:["four-at"],why:"4AT pooled accuracy in older adults (Tieges 2021). A positive screen means search for the cause."},
 {n:"Fever, headache: meningitis? (why Kernig fails)",pre:10,ids:["kernig","neck-stiffness"],why:"Both have LRs near 1 and overlap: the post-test barely moves. Lumbar puncture decides."}];
const CALC={tests:{},once:true};
Object.defineProperty(CALC,"pre",{get:()=>EV.pre,set:v=>{EV.pre=v;},enumerable:true});
function calcCompute(){
  const ks=Object.keys(CALC.tests).filter(k=>SIGNS[k]);const groups={},rows={};
  ks.forEach(k=>{const s=SIGNS[k],r=CALC.tests[k],lr=r==="pos"?s.p:s.n;rows[k]={k,r,lr,counted:false,why:""};
    if(lr==null){rows[k].why=`no ${r==="pos"?"LR+":"LR−"} reported, ignored`;return;}
    const g=CALC.once?overlapOf(k):null,key=g?"g"+OVERLAP.indexOf(g):k;(groups[key]||(groups[key]=[])).push(k);});
  let odds=EV.pre/(100-EV.pre),lrTot=1;const steps=[];
  Object.values(groups).forEach(L=>{L.sort((a,b)=>lrStrength(rows[b].lr)-lrStrength(rows[a].lr));const top=L[0];rows[top].counted=true;odds*=rows[top].lr;lrTot*=rows[top].lr;
    steps.push(`× ${rows[top].lr} (${SIGNS[top].name} ${resWord(SIGNS[top],rows[top].r)})`);
    L.slice(1).forEach(k=>{rows[k].why=`overlaps with ${SIGNS[top].name} (${overlapOf(k).why.replace(/\.$/,"").toLowerCase()}): not counted`;});});
  const dxs=[...new Set(ks.filter(k=>rows[k].lr!=null).map(k=>dxKey(SIGNS[k],k)))];
  return {ks,rows,odds,lrTot,steps,post:odds/(1+odds)*100,dxs};
}
route("signs:calc","LR calculator",(root,preload)=>{
  if(preload&&SIGNS[preload]&&!CALC.tests[preload])CALC.tests[preload]="pos";
  root.innerHTML=`<section class="ph"><span class="eyebrow">Bayes at the bedside</span><h1>Likelihood-ratio calculator</h1><p class="lede">Start from your honest pre-test estimate, add what you found, and see how far the examination moved you.</p></section>
   <div class="section"><span class="label">Start from a scenario</span><div class="chips" id="presets">${PRESETS.map((p,i)=>`<button class="chip" data-p="${i}">${esc(p.n)}</button>`).join("")}</div><p class="small muted" id="presetWhy" hidden></p></div>
   <div class="card stack"><label for="pre" class="eyebrow">Pre-test probability</label><div class="row-x" style="gap:16px;flex-wrap:nowrap"><b class="big" id="preV" style="min-width:3.2ch">${EV.pre}%</b><input type="range" id="pre" min="1" max="99" value="${EV.pre}" style="flex:1;min-width:0" aria-label="Pre-test probability, percent"></div>
    <p class="small muted">Prevalence in your setting, adjusted by the history. Scenario values are illustrative: set your own. The calculator only multiplies what you give it.</p></div>
   <div class="card stack"><span class="eyebrow">Findings</span><div class="stack" style="gap:8px" id="tests"></div>
    <select class="sel" id="addT" aria-label="Add a sign or test"></select>
    <label class="row-x small calc-once"><input type="checkbox" id="once"${CALC.once?" checked":""}> Count each mechanism once (recommended)</label></div>
   <div class="card stack"><span class="eyebrow">Post-test probability</span><div class="row-x"><b class="big" id="postV"></b><span class="small muted" id="postNote"></span></div><div class="probbar"><i id="postBar"></i><em id="preMark" title="Pre-test"></em></div><div id="chain" class="small muted"></div><div id="warn"></div>
    <div id="fagan"></div>
    <p class="tiny muted">Likelihood ratios only multiply cleanly when findings are independent. Signs that share a mechanism (JVP and abdominojugular reflux; egophony and bronchial breathing) are not, and multiplying them overstates certainty. Even unrelated signs in the same patient are often correlated, so treat a post-test value from several findings as an upper bound and lean on the strongest single finding.</p></div>`;
  const T=$("#tests");
  const fillPicker=()=>{
    const have=Object.keys(CALC.tests),dk=new Set(have.map(k=>dxKey(SIGNS[k],k)));
    const opts=Object.entries(SIGNS).filter(([k,s])=>(s.p!=null||s.n!=null)&&!s.hide&&!have.includes(k)).sort((a,b)=>a[1].name.localeCompare(b[1].name));
    const same=dk.size?opts.filter(([k,s])=>dk.has(dxKey(s,k))):[];
    const o=([k,s])=>`<option value="${k}">${esc(s.name)} · ${esc(s.target)}</option>`;
    $("#addT").innerHTML=`<option value="">Add a sign or test…</option>${same.length?`<optgroup label="Same diagnosis as your findings">${same.map(o).join("")}</optgroup><optgroup label="All signs and tests">${opts.filter(x=>!same.includes(x)).map(o).join("")}</optgroup>`:opts.map(o).join("")}`;
  };
  const draw=()=>{
    const C=calcCompute(),ks=C.ks;
    T.innerHTML=ks.length?ks.map(k=>{const s=SIGNS[k],r=CALC.tests[k],row=C.rows[k];return `<div class="calcrow${row.counted?"":" off"}"><span style="min-width:0"><b>${esc(s.name)}</b><br><span class="tiny muted">${esc(s.target)} · LR+ ${fmtLR(s.p)} · LR− ${fmtLR(s.n)}${isSingleStudy(s)?" · single study":""}</span>${row.why?`<br><span class="tiny calc-why">${esc(row.why)}</span>`:""}</span>
      <span class="row-x" style="gap:6px;flex-wrap:nowrap"><span class="seg" role="group" aria-label="${esc(s.name)}"><button data-k="${k}" data-r="pos" aria-pressed="${r==="pos"}">${resWord(s,"pos").replace(/^./,c=>c.toUpperCase())}</button><button data-k="${k}" data-r="neg" aria-pressed="${r==="neg"}">${resWord(s,"neg").replace(/^./,c=>c.toUpperCase())}</button></span><button class="iconbtn" data-rm="${k}" aria-label="Remove ${esc(s.name)}">${ic("close")}</button></span></div>`;}).join(""):`<p class="small muted">No findings yet. Pick a scenario above or add a test.</p>`;
    const post=C.post;
    $("#postV").textContent=fmtPct(post);$("#postBar").style.width=post+"%";$("#preMark").style.left=EV.pre+"%";$("#preV").textContent=EV.pre+"%";
    const d=post-EV.pre;$("#postNote").textContent=ks.length?`${d>=0?"+":"−"}${Math.abs(d)<1&&d!==0?Math.abs(d).toFixed(1):Math.round(Math.abs(d))} points from your pre-test estimate`:"";
    $("#chain").textContent=C.steps.length?`Odds ${(EV.pre/(100-EV.pre)).toFixed(2)} ${C.steps.join(" ")} = ${C.odds<0.01?C.odds.toExponential(1):C.odds.toFixed(2)}`:"";
    const W=[];const counted=ks.filter(k=>C.rows[k].counted);
    if(C.dxs.length>1)W.push(`These findings were studied for different targets (${C.dxs.map(esc).join("; ")}). Their LRs only combine for one diagnosis: remove the ones that do not answer your question.`);
    if(counted.length>=2&&(C.lrTot>=100||C.lrTot<=0.01)&&counted.length<3)W.push(`The combined likelihood ratio is ${C.lrTot>=100?"over 100":"under 0.01"}. Few bedside combinations have been validated at that strength: check that the findings are independent and that each LR applies to your patient.`);
    if(counted.length>=3)W.push(`${counted.length} findings multiplied together: real signs in one patient are rarely independent, so the true post-test probability is probably less extreme.`);
    if(!CALC.once&&ks.some(k=>overlapOf(k)&&ks.some(j=>j!==k&&overlapOf(j)===overlapOf(k))))W.push("Overlapping findings are being multiplied: this double-counts the same evidence.");
    $("#warn").innerHTML=W.map(w=>`<div class="note calc-warn">${w}</div>`).join("");
    $("#fagan").innerHTML=ks.length&&C.steps.length?faganSVG(EV.pre,[{lr:C.lrTot,cls:C.lrTot>=1?"pos":"neg",label:"Combined"}],{h:250}):"";
    fillPicker();
  };
  $("#pre").addEventListener("input",e=>{EV.pre=+e.target.value;draw();});
  $("#once").addEventListener("change",e=>{CALC.once=e.target.checked;draw();});
  $("#presets").addEventListener("click",e=>{const b=e.target.closest("[data-p]");if(!b)return;const p=PRESETS[+b.dataset.p];EV.pre=p.pre;CALC.tests={};
    p.ids.forEach(x=>{const [k,r]=Array.isArray(x)?x:[x,"pos"];if(SIGNS[k])CALC.tests[k]=r;});$("#pre").value=p.pre;
    $$("#presets .chip").forEach(x=>x.classList.toggle("on",x===b));const w=$("#presetWhy");w.hidden=false;w.textContent=`${p.why} Pre-test ${p.pre}% is an illustrative starting point.`;draw();});
  $("#addT").addEventListener("change",e=>{if(e.target.value){CALC.tests[e.target.value]="pos";draw();}});
  T.addEventListener("click",e=>{const b=e.target.closest("[data-r]");if(b){CALC.tests[b.dataset.k]=b.dataset.r;draw();return;}const x=e.target.closest("[data-rm]");if(x){delete CALC.tests[x.dataset.rm];draw();}});
  draw();
});

/* ---------- MSK region page (region data in 56-msk-regions.js) ---------- */
route("learn:region",(id)=>(REGIONS.find(r=>r.id===id)||{}).name||"Region",(root,id)=>{
  const r=REGIONS.find(x=>x.id===id);if(!r)throw new Error("Region not found");
  const ids=[...new Set([...r.tests,...Object.keys(SIGNS).filter(k=>SIGNS[k].reg===id)])];
  const T=ids.map(k=>[k,SIGNS[k]]).filter(([,x])=>x&&!x.hide).sort((a,b)=>vRank(a[1].v)-vRank(b[1].v)||strengthOf(b[1])-strengthOf(a[1]));
  const m=typeof mastery==="function"?mastery("reg:"+id):{seen:0,n:0};
  root.innerHTML=`<section class="ph"><span class="eyebrow">Musculoskeletal · region</span><h1>${esc(r.name)}</h1><p class="lede">${esc(r.intro)}</p>
    <div class="row-x"><button class="btn sm" data-go="practice/session/reg:${id}">${ic("calendar")}Review this region</button><span class="small muted">${m.seen}/${m.n} cards started</span></div></section>
   ${fig(r.fig)}
   <div class="card stack" style="gap:10px"><span class="eyebrow">Special tests, best first</span><p class="small muted">Tap a likelihood ratio for what it means; tap a test for how to do it.</p><div class="stack reg-tests">${T.map(([k,x])=>`<div class="reg-t"><button class="lrow" data-go="signs/sign/${k}"><span class="txt"><b>${esc(x.name)}</b><span>${esc(x.target)}</span></span><span class="v v-${x.v}">${VERDICT[x.v]||""}</span></button>${evChips(x,k,{noNote:false})}</div>`).join("")}</div></div>
   ${(r.tools||[]).filter(([,t])=>typeof TOOLS!=="undefined"&&TOOLS.some(x=>x.id===t)).length?`<div class="section"><span class="label">Decision rules</span><div class="chips">${r.tools.filter(([,t])=>TOOLS.some(x=>x.id===t)).map(([n,t])=>`<button class="chip" data-go="tools/calc/${t}">${ic("scale")}${esc(n)}</button>`).join("")}</div></div>`:""}
   <div class="section"><span class="label">What to think</span><div class="think">${r.think.map(([f,t])=>`<div class="t"><b>${esc(f)}</b><span>${esc(t)}</span></div>`).join("")}</div></div>
   <div class="card stack" style="gap:12px"><span class="eyebrow">Surface anatomy</span>${r.land.map(([a,b,c])=>`<div class="lm"><b>${esc(a)}</b><span><i>Where:</i> ${esc(b)}</span><span><i>Why:</i> ${esc(c)}</span></div>`).join("")}</div>
   <div class="card stack" style="gap:16px"><div class="sec"><h3>Look</h3><p>${esc(r.look)}</p></div><div class="sec"><h3>Feel</h3><p>${esc(r.feel)}</p></div><div class="sec"><h3>Move</h3><p>${esc(r.move)}</p></div>
    <div class="tscroll"><table class="ttab"><thead><tr><th>Movement</th><th>Normal range</th></tr></thead><tbody>${r.rom.map(([a,b])=>`<tr><td>${esc(a)}</td><td class="num">${esc(b)}</td></tr>`).join("")}</tbody></table></div></div>
   <div class="card"><div class="sec"><h3>Pitfalls</h3><ul class="prose" style="padding-left:1.1em">${r.pitfalls.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div></div>`;
});

/* ================= SOUNDS ================= */
function soundTabs(active){
  return `<div class="tabs" role="tablist">${[["library","Library"],["map","Chest map"],["compare","Compare"],["learn","Foundations"]].map(([k,l])=>`<button role="tab" aria-selected="${k===active}" data-st="${k}">${l}</button>`).join("")}</div>`;
}
function bindSoundTabs(root){$$(".tabs [data-st]",root).forEach(b=>b.addEventListener("click",()=>replace(b.dataset.st)));}
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
  root.innerHTML=`<section class="ph"><span class="eyebrow">Auscultation</span><h1>Hear it, see it, know why</h1><p class="lede">${Object.keys(SOUNDS).length} teaching sounds synthesised live from their physiology, and the trace is drawn through the same chest-piece filter you hear (Headphones plays it unprocessed), plus ${Object.keys(REAL).length} real recordings.</p></section>
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
