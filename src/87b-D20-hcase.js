"use strict";
/* D20 (7.1): "Take the history": history-first ER and occupational cases (practice/hcase).
   Story -> Ask (a question budget and a 7-minute station clock) -> Commit (diagnosis, confidence, next step) -> Debrief.
   Answers move a live probability bar for the case's focus diagnosis using the LRs stored with each answer.
   Answers that share a mechanism (grp) count once (the strongest), and the bar is capped at 1 to 99%.
   Best scores live in Store.s.notes["hc:"+id] = {best,last,n,t} (per-record, merged by t). */
const HC={};
const HC_ICE={k:"ice",q:"What do you think is going on, what worries you most, and what were you hoping we would do?",why:"Ideas, concerns and expectations: the patient's agenda, which often contains the real reason for coming and the obstacle to the plan.",changes:"An unspoken fear left unanswered undoes the best plan; an expectation you cannot meet needs saying early.",target:"ICE",src:"Silverman, Kurtz & Draper, Skills for Communicating with Patients, 3rd ed"};
const HC_CLOCK=420;
function hcQs(c){const p=HIST.pres.find(x=>x.id===c.pres);const qs=(p?p.ask:[]).filter(a=>a&&typeof a==="object");return qs.some(a=>a.k==="ice")?qs:[...qs,HC_ICE];}
function hcPath(c,keys){
  let p=c.pre;const pts=[["Start",p]],used={};
  keys.forEach(k=>{const a=c.ans[k];if(!a||a.lr==null)return;const g=a.grp||k;
    const prev=used[g];if(prev&&Math.abs(Math.log(prev))>=Math.abs(Math.log(a.lr)))return;
    let lr=a.lr;if(prev)lr=a.lr/prev;used[g]=a.lr;
    const o=p/(100-p)*lr;p=Math.min(99,Math.max(1,o/(1+o)*100));pts.push([k,p]);});
  return pts;
}
function hcHasLr(c){return Object.values(c.ans).some(a=>a.lr!=null);}
function hcScore(c,S){
  const must=c.must,hit=must.filter(k=>S.asked.includes(k));
  const red=Math.round(hit.length/must.length*35);
  const useful=S.asked.filter(k=>c.ans[k]).length,wasted=S.asked.length-useful;
  const eff=Math.max(0,10-wasted*3);
  const fin=c.ddx.find(d=>d.final).dx,ok=S.final===fin;
  const dx=ok?25:0;
  const act=S.act!=null&&c.act.opts[S.act]&&c.act.opts[S.act].ok?15:0;
  const y=ok?1:0,cf=S.conf/100,brier=(cf-y)*(cf-y);
  const cal=Math.round(10*(1-brier));
  const ice=S.asked.includes("ice")?5:0;
  return {red,eff,dx,act,cal,ice,total:red+eff+dx+act+cal+ice,hit,miss:must.filter(k=>!S.asked.includes(k)),wasted,ok,brier};
}
function hcClock(S){const t=Math.round(((S.done||Date.now())-S.t0)/1000);return t;}
function hcFmt(t){return `${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`;}
function hcBar(p,label){return `<div class="hc-bar" role="img" aria-label="${esc(label)}: ${Math.round(p)}%"><i style="width:${Math.max(2,Math.min(100,p))}%"></i><span>${Math.round(p)}%</span></div>`;}
route("practice:hcase",(id)=>{const c=id&&HCASES.find(x=>x.id===id);return c?c.title:"History-first cases";},(root,id)=>{
  const c=id&&HCASES.find(x=>x.id===id);KEYS.handler=null;
  if(!c){
    const N=Store.s.notes||{};
    root.innerHTML=`<section class="ph"><span class="eyebrow">Practice · take the history</span><h1>History-first cases</h1><p class="lede">An OSCE-style station: read the triage note, choose your questions from the bank (you have a budget), hit the red flags before the 7-minute clock runs out, then commit to a diagnosis and the next step. The debrief shows the red flags you missed, the questions that told you nothing, and how far each answer moved the probability.</p></section>
     <div class="list">${HCASES.map(x=>{const r=N["hc:"+x.id];const p=HIST.pres.find(q=>q.id===x.pres);return `<button class="lrow" data-go="practice/hcase/${x.id}"><span class="icwrap">${ic(x.setting==="OH"?"case":"bolt")}</span><span class="txt"><b>${esc(x.title)}</b><span>${x.setting==="OH"?"Occupational health":"Emergency"} · ${esc(p?p.name:"")} · ${x.budget} questions${r?` · best ${r.best}/100`:""}</span></span>${r?`<span class="pill ${r.best>=75?"good":r.best>=50?"acc":""}">${r.best}</span>`:ic("chev","chev")}</button>`;}).join("")}</div>
     <p class="tiny muted">The starting probabilities are teaching estimates for each setting, not measured base rates. Likelihood ratios come from the presentation pages, where each source is shown.</p>`;
    return;}
  const S=HC[id]||(HC[id]={step:0,lead:null,preG:null,asked:[],final:null,conf:60,act:null,t0:null,done:null,dorder:shuf(c.ddx.map(d=>d.dx)),aorder:shuf(c.act.opts.map((_,i)=>i))});
  drawHc(root,c,S);
});
function drawHc(root,c,S){
  root=root||V;
  const p=HIST.pres.find(x=>x.id===c.pres),qs=hcQs(c),steps=["Story","Ask","Commit","Debrief"],hasLr=hcHasLr(c);
  const head=`<section class="ph"><span class="eyebrow">${c.setting==="OH"?"Occupational health":"Emergency"} · take the history</span><h1>${esc(c.title)}</h1><div class="stepper">${steps.map((s,i)=>`<span class="${i===S.step?"on":i<S.step?"done":""}">${i+1}<span class="hc-sl"> ${s}</span></span>`).join("")}</div></section>
   <div class="card stack"><p>${esc(c.stem)}</p><div class="vitals">${Object.entries(c.vit).filter(([,v])=>v!==""&&v!=null).map(([k,v])=>`<div class="vit"><span class="label">${k==="T"?"Temp °C":k}</span><b>${esc(String(v))}</b></div>`).join("")}</div></div>`;
  let body="";
  if(S.step===0){
    body=`<div class="section"><span class="label">Your leading hypothesis before you ask anything</span><div class="opts">${S.dorder.map(d=>`<button class="opt${S.lead===d?" sel":""}" data-lead="${esc(d)}">${esc(d)}</button>`).join("")}</div></div>
     <label class="fld">Your pre-test estimate for <b>${esc(c.focus)}</b>: <span class="mono" id="hcpv">${S.preG==null?"not set":S.preG+"%"}</span><input type="range" id="hcpre" min="0" max="100" step="5" value="${S.preG==null?50:S.preG}" aria-label="Pre-test estimate"></label>
     <div class="note">You may ask <b>${c.budget}</b> questions. The station clock starts when you begin (target 7:00).</div>
     <div class="row-x"><span class="spacer"></span><button class="btn" id="hcnx" ${S.lead?"":"disabled"}>Start the history</button></div>`;
  }else if(S.step===1){
    const left=c.budget-S.asked.length,path=hcPath(c,S.asked),now=path[path.length-1][1];
    body=`<div class="card stack hc-live" style="gap:8px"><div class="row-x"><span class="eyebrow">${S.asked.length}/${c.budget} asked</span><span class="spacer"></span><span class="mono hc-clock" id="hcclk" aria-live="off">${hcFmt(hcClock(S))}</span><span class="tiny muted">/ 7:00</span></div>
      ${hasLr?`<div><span class="tiny muted">Probability of ${esc(c.focus)} from the answers so far</span>${hcBar(now,"Probability of "+c.focus)}</div>`:`<p class="tiny muted">No likelihood ratios exist for the questions in this case: the decision rests on criteria and red flags, not on weighing.</p>`}</div>
     <div class="stack hc-qs" style="gap:8px">${qs.map(q=>{const on=S.asked.includes(q.k),a=c.ans[q.k];
       return `<div class="hc-q${on?" on":""}">${on?`<div class="hc-qt"><b>${esc(q.q)}</b></div><div class="hc-a${a?"":" none"}">${esc(a?a.a:"Nothing relevant: the answer is no.")}${a&&a.lr!=null?` <span class="hx-chip ${hxLrClass(a.lr)}">LR ${a.lr}</span><span class="tiny muted"> for ${esc(c.focus)}</span>`:""}</div>`
        :`<button class="hc-ask" data-ask="${esc(q.k)}" ${left<=0?"disabled":""}>${esc(q.q)}</button>`}</div>`;}).join("")}</div>
     <div class="row-x"><span class="small muted">${left>0?`${left} question${left===1?"":"s"} left`:"Budget used"}</span><span class="spacer"></span><button class="btn" id="hcnx" ${S.asked.length?"":"disabled"}>Commit</button></div>`;
  }else if(S.step===2){
    body=`<div class="section"><span class="label">Your diagnosis</span><div class="opts">${S.dorder.map(d=>`<button class="opt${S.final===d?" sel":""}" data-fin="${esc(d)}">${esc(d)}</button>`).join("")}</div></div>
     <label class="fld">How sure are you? <span class="mono" id="hccv">${S.conf}%</span><input type="range" id="hcconf" min="0" max="100" step="5" value="${S.conf}" aria-label="Confidence"></label>
     <div class="section"><span class="label">${esc(c.act.q)}</span><div class="opts">${S.aorder.map(i=>`<button class="opt${S.act===i?" sel":""}" data-act="${i}">${esc(c.act.opts[i].t)}</button>`).join("")}</div></div>
     <div class="row-x"><button class="btn ghost sm" id="hcbk">Back to the history</button><span class="spacer"></span><button class="btn" id="hcnx" ${S.final&&S.act!=null?"":"disabled"}>See the debrief</button></div>`;
  }else{
    const R=hcScore(c,S),fin=c.ddx.find(d=>d.final).dx,mine=hcPath(c,S.asked),all=hcPath(c,Object.keys(c.ans)),t=hcClock(S);
    const qOf=k=>qs.find(q=>q.k===k)||{q:k,why:""};
    const bars=pts=>`<div class="ppath">${pts.map(([k,v])=>`<div><span>${Math.round(v)}%</span><i style="height:${Math.max(4,v)}%"></i><span class="hc-pl">${esc(k==="Start"?"Start":((c.ans[k]&&c.ans[k].l)||qOf(k).target||k))}</span></div>`).join("")}</div>`;
    const ao=c.act.opts[S.act]||{},good=c.act.opts.find(o=>o.ok);
    body=`<div class="card stack"><div class="row-x" style="gap:16px">${ring(R.total/100,76,8,R.total)}<div class="stack" style="gap:4px;flex:1;min-width:0"><span class="eyebrow">Diagnosis</span><h2>${esc(fin)}</h2><span class="pill ${R.ok?"good":"bad"}">${R.ok?"You got it":"You said "+esc(S.final)} · ${S.conf}% sure</span></div></div>
      <div class="lrrow small hc-sc"><span>Red flags ${R.red}/35</span><span>Focus ${R.eff}/10</span><span>Diagnosis ${R.dx}/25</span><span>Next step ${R.act}/15</span><span>Calibration ${R.cal}/10</span><span>ICE ${R.ice}/5</span></div>
      <p class="tiny muted">Time ${hcFmt(t)}${t>HC_CLOCK?" (over the 7-minute station)":""}. Calibration uses the Brier score of your confidence (${R.brier.toFixed(2)}; 0 is perfect).${S.preG!=null?` Your pre-test estimate was ${S.preG}%; the teaching estimate for this setting is about ${c.pre}%.`:""}</p></div>
     ${R.miss.length?`<div class="card stack"><h3>Red-flag questions you did not ask</h3>${R.miss.map(k=>{const q=qOf(k);return `<div class="redflag"><b>${esc(q.q)}</b><br><span class="small">${esc(c.ans[k]?c.ans[k].a:"")}</span><br><span class="tiny muted">${esc(q.why||"")}</span></div>`;}).join("")}</div>`:`<div class="note good">You asked every red-flag question.</div>`}
     ${R.wasted?`<div class="note">${R.wasted} question${R.wasted>1?"s":""} told you nothing in this case. In a timed station, choose the questions that separate the dangerous diagnoses first.</div>`:""}
     ${!S.asked.includes("ice")?`<div class="note">You did not ask about ideas, concerns and expectations. This patient's answer: <i>${esc((c.ans.ice||{}).a||"")}</i></div>`:""}
     <div class="card stack"><span class="eyebrow">Next step</span><p><b>${ao.ok?"Right.":"Not the best choice."}</b> ${esc(ao.why||"")}</p>${ao.ok?"":`<p><b>Best:</b> ${esc(good.t)}. ${esc(good.why)}</p>`}</div>
     ${hcHasLr(c)?`<div class="grid g2"><div class="card stack" style="gap:6px"><span class="eyebrow">Probability of ${esc(c.focus)}: your questions</span>${bars(mine)}</div><div class="card stack" style="gap:6px"><span class="eyebrow">Every answer with an LR</span>${bars(all)}</div></div><p class="tiny muted">Clues from the same mechanism are not independent, so multiplying them overstates certainty; the bar is capped at 99% for that reason.</p>`:""}
     ${(()=>{const sg=[...new Set([...(c.signs||[]),...((p&&p.links&&p.links.signs)||[])])].filter(x=>typeof SIGNS!=="undefined"&&SIGNS[x]);return sg.length&&typeof signChip==="function"?`<div class="section"><span class="label">Now examine: the signs that test it</span><div class="chips">${sg.map(signChip).join("")}</div></div>`:"";})()}
     <div class="note acc">${esc(c.teach)}</div>
     <div class="row-x"><button class="btn" id="hcagain">Try again</button><button class="btn ghost" id="hcnext">Next case</button><button class="btn soft" data-go="learn/pres/${esc(c.pres)}">${ic("history")}${esc(p?p.name:"Presentation")}</button></div>`;
  }
  root.innerHTML=head+body;
  const redraw=()=>{const y=window.scrollY;drawHc(root,c,S);window.scrollTo(0,y);};
  $$("[data-lead]",root).forEach(b=>b.addEventListener("click",()=>{S.lead=b.dataset.lead;redraw();}));
  $("#hcpre",root)?.addEventListener("input",e=>{S.preG=+e.target.value;$("#hcpv").textContent=S.preG+"%";});
  $$("[data-ask]",root).forEach(b=>b.addEventListener("click",()=>{if(S.asked.length>=c.budget)return;const k=b.dataset.ask;if(!S.asked.includes(k))S.asked.push(k);redraw();}));
  $$("[data-fin]",root).forEach(b=>b.addEventListener("click",()=>{S.final=b.dataset.fin;redraw();}));
  $$("[data-act]",root).forEach(b=>b.addEventListener("click",()=>{S.act=+b.dataset.act;redraw();}));
  $("#hcconf",root)?.addEventListener("input",e=>{S.conf=+e.target.value;$("#hccv").textContent=S.conf+"%";});
  $("#hcbk",root)?.addEventListener("click",()=>{S.step=1;redraw();});
  $("#hcnx",root)?.addEventListener("click",()=>{
    if(S.step===0&&!S.t0)S.t0=Date.now();
    S.step++;
    if(S.step===3){S.done=Date.now();const R=hcScore(c,S),N=Store.s.notes||(Store.s.notes={}),o=N["hc:"+c.id]||{best:0,n:0};
      N["hc:"+c.id]={best:Math.max(o.best||0,R.total),last:R.total,n:(o.n||0)+1,t:Date.now()};
      if(typeof tick==="function")tick(2,"case");Store.s.xp=(Store.s.xp||0)+Math.round(R.total/10);Store.save();}
    drawHc(root,c,S);window.scrollTo(0,0);});
  $("#hcagain",root)?.addEventListener("click",()=>{delete HC[c.id];render(false);});
  $("#hcnext",root)?.addEventListener("click",()=>{const i=HCASES.indexOf(c),n=HCASES[(i+1)%HCASES.length];delete HC[c.id];replace("hcase",n.id);});
  /* station clock */
  if(S.step===1){const el=$("#hcclk",root);if(el){const iv=setInterval(()=>{if(!document.body.contains(el)){clearInterval(iv);return;}const t=hcClock(S);el.textContent=hcFmt(t);el.classList.toggle("over",t>HC_CLOCK);},1000);}}
}
