"use strict";
/* ================= PRACTICE HUB ================= */
route("practice:home","Practice",(root)=>{
  const due=dueCards().length;
  const drillDone=DRILLS.reduce((a,d)=>a+drillCats(d).filter(c=>(Store.s.snd[d.id+":"+c.key]||{}).m).length,0),drillAll=DRILLS.reduce((a,d)=>a+drillCats(d).length,0);
  const hdDone=Object.keys(Store.s.hd).length,erDone=Store.s.er.length,pend=Store.s.log.filter(x=>!x.ver).length;
  const T=(go,icn,tag,title,sub,meta)=>`<button class="tile" data-go="${go}"><div class="t-top"><span class="icwrap">${ic(icn)}</span><span class="tag">${tag}</span></div><b>${title}</b><span class="sub">${sub}</span>${meta?`<span class="small" style="font-weight:700">${meta}</span>`:""}</button>`;
  root.innerHTML=`<section class="ph"><span class="eyebrow">Practice</span><h1>Train like it matters</h1><p class="lede">Each mode uses a learning method with evidence behind it. A good week: the daily session every day, one drill set to mastery, two hypothesis-driven cases, and one logged finding checked against imaging.</p></section>
  <div class="grid g2">
   ${T("practice/session/all","calendar","spaced retrieval","Today's session","Mixed review of signs, sounds, anatomy and history. Missed items come back sooner.",due?`${due} due now`:"Nothing due: learn new items")}
   ${typeof TECH!=="undefined"&&TECH.length?T("learn/tech","check","deliberate practice","Technique clinic","Walk-throughs, step ordering, spot the error and checklisted bedside reps for the examinations you want to be certain of.",`${TECH.filter(t=>techDone(t.id)===5).length}/${TECH.length} mastered`):""}
   ${T("practice/drill","bolt","perceptual mastery","Sound drill","Rapid listen-and-name with instant feedback until each sound is automatic.",`${drillDone}/${drillAll} sound categories mastered`)}
   ${T("practice/hdpe","target","predict first","Hypothesis-driven exam","Commit to hypotheses, choose a few manoeuvres, predict each finding, then see how far the evidence moved you.",`${hdDone}/${HDPE.length} cases done`)}
   ${T("practice/localiser","target","clue by clue","Localiser","Pinpoint the lesion in brain, brainstem, cord or nerve from a story told one clue at a time.",`${LCASES.filter(c=>(Store.s.loc[c.id]||{}).best>=85).length}/${LCASES.length} cases mastered`)}
   ${T("learn/neuromap","map","tap to learn","Dermatome quiz","Find the root or nerve on the body map.","")}
   ${T("practice/spot","eye","perceptual","Spot diagnosis","A real photograph, four names; misses become lessons.","")}
   ${T("tools/narrate","ear","hands-on","Narrated routine","Galen reads an examination aloud while you perform it.","")}
   ${T("practice/describe","eye","describe, then diagnose","Describe it","Describe a skin plate feature by feature, then name it.",`${Object.keys(Store.s.dprac||{}).length}/${DCOND.filter(c=>c.p&&c.d).length} plates tried`)}
   ${T("practice/er","case","applied","ER cases","Story and vitals, identify the sound, then choose the next step.",`${erDone}/${SCEN.length} done`)}
   ${T("practice/rehearse","mind","mental rehearsal","Rehearse a routine","Recall each step of a system's examination before you see it.","")}
   ${T("practice/duel","shuffle","contrast","Evidence duel","Two signs, one target: which carries more weight?","")}
   ${T("practice/log","log","feedback loop","Bedside log","Log a real finding with your confidence, then mark it confirmed or refuted.",pend?`${pend} waiting for verification`:"")}
  </div>
  <button class="tile" data-go="learn/method"><div class="t-top"><span class="icwrap n">${ic("mind")}</span></div><b>Why these methods</b><span class="sub">The studies behind each mode, with links.</span></button>`;
});

/* ================= DAILY SESSION (flashcards) ================= */
let SES=null;
function sessionTitle(sys){if(sys&&sys.startsWith("reg:")){const r=REGIONS.find(x=>x.id===sys.slice(4));return `${r?r.name:"Region"} review`;}return sys&&sys!=="all"?`${SYS_SHORT[sys]} review`:"Today's session";}
route("practice:session",(sys)=>sessionTitle(sys),(root,sys)=>{
  sys=sys||"all";
  if(!SES||SES.sys!==sys||SES.finished&&SES.stale){SES={sys,queue:buildSession(sys),i:0,res:[0,0,0,0],relearn:{},shown:false,t0:0,answered:null,finished:false};}
  drawSession(root);
});
function drawSession(root){
  root=root||V;const S=SES;KEYS.handler=null;Players.reset();
  if(!S.queue.length||S.i>=S.queue.length)return sessionDone(root);
  const c=S.queue[S.i],tot=S.queue.length,auto=!!AUTO[c.type];
  const head=`<div class="progress-top"><button class="iconbtn" data-act="back" aria-label="Leave session">${ic("close")}</button><div class="meter"><i style="width:${Math.round(S.i/tot*100)}%"></i></div><span class="mono small muted">${S.i+1}/${tot}</span></div>`;
  const body=cardBody(c);
  root.innerHTML=`${head}<article class="fc" aria-live="polite"><div class="row-x"><span class="tag">${CARD_TYPE_LABEL[c.type]}</span><span class="pill">${SYS_SHORT[c.sys]}</span>${Store.s.srs[c.id]?"":`<span class="pill acc">new</span>`}</div>
   <div class="q">${body.q}</div>${body.extra||""}<div id="ansArea"></div></article>
   <p class="tiny muted" style="text-align:center">${auto?"Keys 1–4 answer · Enter continues":"Space reveals · 1–4 grade"} · Esc leaves</p>`;
  S.t0=performance.now();S.answered=null;S.shown=false;
  const A=$("#ansArea");
  if(body.mount)body.mount(root);
  if(auto){
    A.innerHTML=`<div class="opts${body.opts.length===4&&body.opts.every(o=>o.l.length<40)?" two":""}">${body.opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="kn">${i+1}</span><span>${esc(o.l)}</span></button>`).join("")}</div><div id="fb"></div>`;
    const choose=i=>{if(S.answered!=null)return;S.answered=i;const ok=body.opts[i].ok,dt=(performance.now()-S.t0)/1000;
      $$(".opt",A).forEach((b,j)=>{b.disabled=true;if(body.opts[j].ok)b.classList.add("right");else if(j===i)b.classList.add("wrong");});
      const grade=ok?(dt<(c.type==="sound"?12:9)?2:1):0;
      $("#fb").innerHTML=`<div class="ans"><div class="verdict-line ${ok?"ok":"no"}">${ic(ok?"check":"close")}${ok?(grade===2?"Correct":"Correct, but slow: it will come back a little sooner"):"Not quite"}</div>${body.explain}<button class="btn" id="nextc">Continue</button></div>`;
      $("#nextc").addEventListener("click",()=>gradeCard(grade));$("#nextc").focus({preventScroll:true});};
    $$(".opt",A).forEach(b=>b.addEventListener("click",()=>choose(+b.dataset.i)));
    KEYS.handler=e=>{if(/^[1-9]$/.test(e.key)&&S.answered==null){const i=+e.key-1;if(body.opts[i])choose(i);}else if(e.key==="Enter"&&S.answered!=null){e.preventDefault();$("#nextc")?.click();}};
  }else{
    A.innerHTML=`<button class="btn block" id="reveal">Show answer</button>`;
    const reveal=()=>{if(S.shown)return;S.shown=true;const r=Store.s.srs[c.id];
      const iv=g=>{const n=r?r.n:0,cur=r?r.iv:0,ef=r?r.ef:2.5;if(g===0)return "again";const x=n===0?(g===3?4:g===1?1:2):n===1?(g===1?3:g===3?8:6):Math.max(cur+1,Math.round(cur*ef*(g===1?.6:g===3?1.3:1)));return x+"d";};
      A.innerHTML=`<div class="ans">${body.a}<div class="grades">${[["Again","g0"],["Hard","g1"],["Good","g2"],["Easy","g3"]].map(([l,cl],g)=>`<button class="${cl}" data-g="${g}">${l}<span>${g+1} · ${iv(g)}</span></button>`).join("")}</div></div>`;
      $$("[data-g]",A).forEach(b=>b.addEventListener("click",()=>gradeCard(+b.dataset.g)));if(typeof renderPlates==="function")renderPlates(A);};
    $("#reveal").addEventListener("click",reveal);
    KEYS.handler=e=>{if((e.key===" "||e.key==="Enter")&&!S.shown){e.preventDefault();reveal();}else if(S.shown&&/^[1-4]$/.test(e.key))gradeCard(+e.key-1);};
  }
}
function gradeCard(g){
  const S=SES,c=S.queue[S.i];if(!c)return;
  schedule(c.id,g);S.res[g]++;
  if(g===0){const n=S.relearn[c.id]||0;if(n<2){S.relearn[c.id]=n+1;S.queue.splice(Math.min(S.queue.length,S.i+4),0,c);}}
  S.i++;window.scrollTo(0,0);drawSession(V);chrome();
}
function sessionDone(root){
  const S=SES;S.finished=true;S.stale=true;KEYS.handler=null;if(S.res.some(x=>x))roundMark("session");
  const n=S.res.reduce((a,b)=>a+b,0),good=S.res[2]+S.res[3],st=streak();
  const left=dueCards(S.sys==="all"?null:S.sys).length;
  root.innerHTML=`<section class="hero" style="align-items:flex-start"><span class="eyebrow">${n?"Session complete":"Nothing to review"}</span>
   <div class="row-x" style="gap:18px">${ring(n?good/n:1,92,9,n?Math.round(good/n*100)+"%":"✓")}<div class="stack" style="gap:4px"><h1>${n?"Done.":"All caught up."}</h1><p class="muted">${n?`${n} reviews · ${S.res[0]} to relearn · streak ${st} day${st===1?"":"s"}`:"No items are due and today's new items are used up."}</p></div></div>
   <div class="row-x">${left?`<button class="btn" id="again">${left} more due</button>`:""}<button class="btn ${left?"ghost":""}" id="more">Learn 10 more</button><button class="btn ghost" data-go="practice/drill">${ic("bolt")}Sound drill</button></div></section>
   ${S.res[0]?`<div class="section"><span class="label">Missed this session</span><div class="list">${[...new Set(S.queue.filter(c=>S.relearn[c.id]))].map(c=>`<button class="lrow" data-go="${cardHome(c)}"><span class="tag">${CARD_TYPE_LABEL[c.type]}</span><span class="txt"><b>${esc(c.label)}</b><span>${SYS_SHORT[c.sys]}</span></span>${ic("chev","chev")}</button>`).join("")}</div></div>`:""}`;
  $("#again")?.addEventListener("click",()=>{SES=null;render(false);});
  $("#more").addEventListener("click",()=>{Store.s.settings.newPerDay+=10;Store.save();SES=null;render(false);});
}
/* card renderers */
const LRBAND=[["Strongly raises it (LR ≥ 5)",l=>l>=5],["Raises it (LR 2–5)",l=>l>=2&&l<5],["Hardly changes it (LR 0.5–2)",l=>l>0.5&&l<2],["Lowers it (LR ≤ 0.5)",l=>l<=0.5]];
function cardBody(c){
  const sameSys=(k)=>{const me=SIGNS[k],pool=Object.keys(SIGNS).filter(x=>x!==k&&!SIGNS[x].hide&&SIGNS[x].sys===me.sys);const near=me.reg?pool.filter(x=>SIGNS[x].reg===me.reg):[];return [...shuf(near),...shuf(pool)].filter((x,i,a)=>a.indexOf(x)===i).slice(0,3);};
  switch(c.type){
   case "think":{const s=SIGNS[c.ref];return {q:`You find: ${esc(s.name)}<small>Target: ${esc(s.target)}. What should you think, and how much does it weigh?</small>`,
     a:`${s.fig&&FIG[s.fig]?fig(s.fig,{small:true,nocap:true}):""}<p>${esc(s.think)}</p><div class="lrrow">${lrChips(s)}</div><button class="link small" data-go="signs/sign/${c.ref}" style="align-self:flex-start">Open the sign</button>`};}
   case "verdict":{const s=SIGNS[c.ref];return {q:`How much is this test worth?<small>${esc(s.name)} for ${esc(s.target)}</small>`,
     opts:VERDICT_ORDER.map(v=>({l:VERDICT[v],ok:v===s.v})),explain:`<div class="lrrow"><span class="v v-${s.v}">${VERDICT[s.v]}</span>${lrChips(s)}</div><p class="small">${esc(s.think)}</p>`};}
   case "mech":{const s=SIGNS[c.ref],opts=shuf([c.ref,...sameSys(c.ref)]);return {q:`Which sign works like this?<small>${esc(s.mech)}</small>`,
     opts:opts.map(k=>({l:SIGNS[k].name,ok:k===c.ref})),explain:`${s.fig&&FIG[s.fig]?fig(s.fig,{small:true}):""}<p class="small"><b>${esc(s.name)}.</b> ${esc(s.how)}</p>`};}
   case "snsp":{const s=SIGNS[c.ref],hi=s.sens>=90,hs=s.spec>=90,ans=hi&&hs?"both":hi?"out":hs?"in":"neither";
     const L=[["out","A negative helps rule it out (SnNout)"],["in","A positive helps rule it in (SpPin)"],["both","Both: it rules in and out"],["neither","Neither on its own"]];
     return {q:`${esc(s.name)}<small>For ${esc(s.target)}: what can this test do for you?</small>`,opts:L.map(([k,l])=>({l,ok:k===ans})),
      explain:`<p class="small">Sensitivity <b class="mono">${s.sens}%</b>, specificity <b class="mono">${s.spec}%</b>. ${hi?"High sensitivity: few patients with the disease test negative, so a negative result is reassuring.":"Sensitivity below 90%: a negative result leaves the diagnosis open."} ${hs?"High specificity: few patients without it test positive, so a positive result is convincing.":"Specificity below 90%: false positives are common."}</p>${s.note?`<p class="small muted">${esc(s.note)}</p>`:""}`};}
   case "teach":{const a=ANGLES[c.ref],s=SIGNS[c.ref];return {q:`${esc(a.teachback.q)}<small>${esc(s.name)}. Say it aloud in your own words, as if teaching a student.</small>`,a:`<p>${esc(a.teachback.a)}</p>${a.trap?`<p class="small muted"><b>The trap:</b> ${esc(a.trap)}</p>`:""}<button class="link small" data-go="signs/sign/${c.ref}" style="align-self:flex-start">Open the sign</button>`};}
   case "derm":{const d=DERM_INFO[c.ref];return {q:`${esc(d.n)}<small>Where is its key sensory point, and what area does it cover?</small>`,a:`<dl class="kv"><dt>Key point</dt><dd>${esc(d.k)}</dd><dt>Area</dt><dd>${esc(d.d)}</dd></dl>${d.w?`<p class="small">${esc(d.w)}</p>`:""}<button class="link small" data-go="learn/neuromap/derm" style="align-self:flex-start">Open the map</button>`};}
   case "myo":{const m=MYO[c.ref],roots=MYO.map(x=>x[0]),opts=shuf([m[0],...shuf(roots.filter(r=>r!==m[0])).slice(0,3)]);return {q:`${esc(m[1])}<small>Which root does this key muscle test?</small>`,opts:opts.map(r=>({l:r,ok:r===m[0]})),explain:`<p class="small"><b>${m[0]}.</b> ${esc(m[2])}. Reflex: ${esc(m[3])}.</p>`};}
   case "reflex":{const r=REFLEX[c.ref],roots=[...new Set(REFLEX.map(x=>x[1]))],opts=shuf([r[1],...shuf(roots.filter(x=>x!==r[1])).slice(0,3)]);return {q:`${esc(r[0])} reflex<small>Which segments?</small>`,opts:opts.map(x=>({l:x,ok:x===r[1]})),explain:`<p class="small">${esc(r[2])}. ${esc(r[3])}.</p>`};}
   case "rootnerve":{const r=ROOTNERVE[c.ref];return {q:`${esc(r.q)}<small>${esc(r.a)} or ${esc(r.b)}? What single test separates them?</small>`,a:`<p>${esc(r.key)}</p><p class="small muted">${esc(r.also)}</p>`};}
   case "cranial":{const x=CRANIAL[c.ref];return {q:`Cranial nerve ${x[0]}<small>Name it, how you test it, and the finding that changes management.</small>`,a:`<dl class="kv"><dt>Name</dt><dd>${esc(x[1])}</dd><dt>Test</dt><dd>${esc(x[2])}</dd></dl><p>${esc(x[3])}</p><p class="small muted">${esc(x[4])}</p>`};}
   case "dterm":{const v=DVOCAB[c.ref];return {q:`${esc(v[0])}<small>Define it, including the size rule, and give an example.</small>`,a:`${v[4]?`<div class="dplate">${plateHTML("v:"+c.ref,dTone(),{small:true})}</div>`:""}<p>${esc(v[2])}</p><p class="small muted">${esc(v[3])}</p>`};}
   case "dplate":{const x=DCOND.find(y=>y.id===c.ref),P=DCOND.filter(y=>y.p),same=shuf(P.filter(y=>y.id!==x.id&&y.g===x.g)).slice(0,2),oth=shuf(P.filter(y=>y.g!==x.g)).slice(0,1),opts=shuf([x,...same,...oth]),t=Math.floor(Math.random()*6);
     return {q:`Name the rash<small>Skin type ${TONE_NAME[t]}. Look at the primary lesion, colour, surface and arrangement.</small>`,extra:`<div class="dplate">${plateHTML("c:"+x.id,t)}</div>`,mount:()=>renderPlates(V),opts:opts.map(y=>({l:y.n,ok:y.id===x.id})),explain:`<p class="small">${esc(x.m)}</p><button class="link small" data-go="learn/dcond/${x.id}" style="align-self:flex-start">Open the condition</button>`};}
   case "finding":{const m=SYSTEMS.find(x=>x.id===c.ref[0]),[f,t]=m.think[c.ref[1]];return {q:`${esc(f)}<small>${esc(m.name)}. What do you think, and what do you do next?</small>`,a:`<p>${esc(t)}</p>`};}
   case "anat":{const a=ANAT[c.ref[0]],p=a.pts.find(x=>x.k===c.ref[1]);return {q:`${esc(p.n)}<small>Where is it, and why does it matter at the bedside?</small>`,a:`<dl class="kv"><dt>Where</dt><dd>${esc(p.at)}</dd></dl><p>${esc(p.why)}</p>`};}
   case "area":{const a=AREAS[c.ref];return {q:`${esc(a.name)}<small>Where exactly do you listen, and why there rather than over the valve?</small>`,a:`<dl class="kv"><dt>Listen</dt><dd>${a.at}</dd><dt>Valve</dt><dd>${a.valve}</dd></dl><p>${a.why}</p><div class="chips">${a.best.map(soundChip).join("")}</div>`};}
   case "zone":{const a=LZONES[c.ref];return {q:`Lung zone: ${esc(a.name)}<small>Where, and what do you listen for there?</small>`,a:`<dl class="kv"><dt>Listen</dt><dd>${a.at}</dd></dl><p>${a.why}</p>`};}
   case "hlr":{const p=HIST.pres.find(x=>x.id===c.ref[0]),[f,t,l]=p.lr[c.ref[1]];return {q:`“${esc(f)}”<small>${esc(p.name)}: what does this clue do to the probability of ${esc(t)}?</small>`,
     opts:LRBAND.map(([lab,fn])=>({l:lab,ok:fn(l)})),explain:`<p class="small">LR ≈ <b class="mono">${l}</b> for ${esc(t)}. <button class="link" data-go="learn/pres/${p.id}">See all ${esc(p.name.toLowerCase())} clues</button></p>`};}
   case "red":{const p=HIST.pres.find(x=>x.id===c.ref);return {q:`${esc(p.name)}<small>List the red flags you must ask about.</small>`,a:p.red.map(r=>`<div class="redflag">${esc(r)}</div>`).join("")};}
   case "sound":{const s=SOUNDS[c.ref],pool=Object.keys(SOUNDS).filter(k=>k!==c.ref&&SOUNDS[k].kind===s.kind);
     const near=pool.filter(k=>SOUNDS[k].group===s.group),opts=shuf([c.ref,...shuf(near).concat(shuf(pool)).filter((k,i,a)=>a.indexOf(k)===i).slice(0,3)]);
     const hr=s.kind==="heart"?60+2*Math.floor(Math.random()*18):72;
     return {q:`Name this sound<small>Play it, listen to at least two cycles, then choose.</small>`,extra:`<div id="fcp"></div>`,
       mount:()=>{const p=mk($("#fcp"),c.ref,{title:false,piece:false,labels:false});p.set(c.ref,"open",hr);},
       opts:opts.map(k=>({l:SOUNDS[k].name,ok:k===c.ref})),explain:`<p class="small">${s.clue}</p><button class="link small" data-go="sounds/sound/${c.ref}" style="align-self:flex-start">Open the lesson</button>`};}
  }
  return {q:"",a:""};
}

/* ================= SOUND DRILL (perceptual mastery) ================= */
const DR_TARGET={heart:10,lung:12};
function drillCats(d){
  if(d.real){const dx=[...new Set(Object.values(REAL).filter(r=>r.body===d.real).map(r=>r.dx))];
    return dx.map(x=>({key:"rx-"+x.toLowerCase().replace(/[^a-z]+/g,"-"),label:x,ex:Object.keys(REAL).filter(k=>REAL[k].body===d.real&&REAL[k].dx===x)}));}
  return d.cats.map(k=>({key:k,label:SOUNDS[k].name,ex:[k,...Object.keys(REAL).filter(r=>REAL[r].teach===k)]}));
}
let DR=null;
route("practice:drill",(id)=>id?"Drill":"Sound drill",(root,id)=>{
  const d=id&&DRILLS.find(x=>x.id===id);
  if(!d){DR=null;KEYS.handler=null;
    root.innerHTML=`<section class="ph"><span class="eyebrow">Perceptual mastery</span><h1>Sound drill</h1><p class="lede">Sounds from one family are mixed together and played back to back. Name each one; wrong or slow answers bring that sound back sooner. A sound is mastered after three correct answers in a row, each within ${DR_TARGET.heart} seconds (${DR_TARGET.lung} for lungs). Teaching sounds play at varying heart rates, and real recordings are mixed in where they exist.</p></section>
     <div class="list">${DRILLS.map(x=>{const cs=drillCats(x),m=cs.filter(c=>(Store.s.snd[x.id+":"+c.key]||{}).m).length;return `<button class="lrow" data-go="practice/drill/${x.id}">${ring(m/cs.length,40,4.5,`${m}/${cs.length}`)}<span class="txt"><b>${esc(x.name)}</b><span>${esc(x.sub)}${m===cs.length?" · mastered":""}</span></span>${ic("chev","chev")}</button>`;}).join("")}</div>
     <div class="note">Why it works: ~500 repetitions took students from 39% to 89% on murmurs; mixed, adaptive classification with a mastery rule produced large, lasting gains for ECGs. <button class="link" data-go="learn/method">The evidence</button></div>`;return;}
  if(!DR||DR.id!==d.id)DR={id:d.id,cats:drillCats(d),stat:{},trial:0,cur:null,phase:"intro",n:0,right:0,review:false};
  drawDrill(root);
});
function drStat(k){const key=DR.id+":"+k;return Store.s.snd[key]||(Store.s.snd[key]={m:false,n:0,r:0});}
function drillPick(){
  const live=DR.cats.filter(c=>DR.review||!drStat(c.key).m);if(!live.length)return null;
  let best=null,bs=-1;
  live.forEach(c=>{const st=DR.stat[c.key]||(DR.stat[c.key]={streak:0,last:-9,wrong:false,slow:false});
    if(DR.cur&&c.key===DR.cur.cat.key&&live.length>1)return;
    const s=1+Math.min(6,DR.trial-st.last)*.6+(st.wrong?3:0)+(st.slow?1.5:0)+Math.random();
    if(s>bs){bs=s;best=c;}});
  return best||live[0];
}
function drawDrill(root){
  root=root||V;Players.reset();KEYS.handler=null;
  const d=DRILLS.find(x=>x.id===DR.id),cats=DR.cats,heart=d.real?d.real==="heart":SOUNDS[cats[0].key]&&SOUNDS[cats[0].key].kind==="heart";
  const target=heart?DR_TARGET.heart:DR_TARGET.lung;
  const chips=cats.map(c=>{const st=DR.stat[c.key]||{streak:0},m=drStat(c.key).m;return `<span class="mc${m?" done":""}${DR.cur&&DR.cur.cat.key===c.key&&DR.phase==="fb"?" cur":""}">${esc(c.label)}<span class="mdots">${[0,1,2].map(i=>`<i class="${m||st.streak>i?"on":""}"></i>`).join("")}</span></span>`;}).join("");
  const mastered=cats.filter(c=>drStat(c.key).m).length;
  if(DR.phase==="intro"){
    root.innerHTML=`<section class="ph"><span class="eyebrow">Sound drill</span><h1>${esc(d.name)}</h1><p class="lede">${mastered===cats.length?"All mastered. Run it again in review mode to keep them sharp.":`${mastered} of ${cats.length} mastered. Each answer counts toward mastery only within ${target} seconds of pressing play.`}</p></section>
     <div class="mastery">${chips}</div>
     <div class="row-x"><button class="btn" id="go">${ic("play")}${mastered===cats.length?"Start review":"Start drilling"}</button>${mastered?`<button class="btn ghost" id="rst">Reset this set</button>`:""}</div>
     <div class="phones">${ic("ear")}<div>Headphones. The first sound plays when you press start.</div></div>`;
    $("#go").addEventListener("click",()=>{DR.review=mastered===cats.length;nextTrial();});
    $("#rst")?.addEventListener("click",e=>{const b=e.currentTarget;if(b.dataset.arm){cats.forEach(c=>delete Store.s.snd[DR.id+":"+c.key]);Store.save();DR.stat={};drawDrill();}else{b.dataset.arm=1;b.textContent="Tap again to reset";}});
    return;}
  if(DR.phase==="done"){
    root.innerHTML=`<section class="hero"><span class="eyebrow">Set mastered</span><div class="row-x" style="gap:18px">${ring(1,88,9,"✓")}<div><h1>${esc(d.name)}: mastered.</h1><p class="muted">${DR.n} trials · ${Math.round(DR.right/Math.max(1,DR.n)*100)}% correct this run.</p></div></div>
     <div class="row-x"><button class="btn" data-go="practice/drill">Choose another set</button><button class="btn ghost" id="rev">Keep reviewing</button></div></section><div class="mastery">${chips}</div>`;
    $("#rev").addEventListener("click",()=>{DR.review=true;nextTrial();});return;}
  const T=DR.cur,opts=T.opts;
  root.innerHTML=`<div class="progress-top"><button class="iconbtn" data-act="back" aria-label="Leave drill">${ic("close")}</button><div class="meter"><i style="width:${Math.round(mastered/cats.length*100)}%"></i></div><span class="mono small muted">${mastered}/${cats.length}</span></div>
   <div class="fc"><div class="row-x"><span class="tag">Trial ${DR.trial}</span><span class="spacer"></span><span class="timer" id="tmr">–</span></div><div id="dp"></div>
    <div class="opts${opts.length<=4?" two":""}" id="dopts">${opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="kn">${i+1}</span><span>${esc(o.label)}</span></button>`).join("")}</div><div id="dfb"></div></div>
   <div class="mastery">${chips}</div>`;
  const p=mk($("#dp"),T.ex,{title:false,piece:false,labels:false,hr:false});
  if(SOUNDS[T.ex])p.set(T.ex,"open",T.hr);
  let t0=null,tm=null;
  p.onPlay=()=>{if(t0==null){t0=performance.now();tm=setInterval(()=>{const e=$("#tmr");if(!e){clearInterval(tm);return;}const s=(performance.now()-t0)/1000;e.textContent=s.toFixed(0)+"s";e.style.color=s>target?"var(--bad)":"";},250);}};
  startBox(p);
  const answer=i=>{
    if(DR.phase!=="q")return;DR.phase="fb";clearInterval(tm);
    const dt=t0==null?99:(performance.now()-t0)/1000,o=opts[i],ok=o.key===T.cat.key,fast=dt<=target;
    const st=DR.stat[T.cat.key],ps=drStat(T.cat.key);DR.n++;ps.n++;
    st.last=DR.trial;st.wrong=!ok;st.slow=ok&&!fast;
    if(ok){DR.right++;ps.r++;st.streak=fast?st.streak+1:Math.max(0,st.streak);if(st.streak>=3&&!ps.m){ps.m=true;toast(`${T.cat.label}: mastered`,"good");}}else{st.streak=0;}
    const wrongCat=!ok&&DR.cats.find(c=>c.key===o.key);
    tick(1,"hands");Store.save();
    $$("#dopts .opt").forEach((b,j)=>{b.disabled=true;if(opts[j].key===T.cat.key)b.classList.add("right");else if(j===i)b.classList.add("wrong");});
    const clue=SOUNDS[T.cat.key]?SOUNDS[T.cat.key].clue:LISTEN[T.cat.label]||"";
    $("#dfb").innerHTML=`<div class="ans"><div class="verdict-line ${ok?"ok":"no"}">${ic(ok?"check":"close")}${ok?(fast?`Correct in ${dt.toFixed(1)} s`:`Correct, but ${dt.toFixed(0)} s: doesn't count toward mastery yet`):`It was ${esc(T.cat.label)}`}</div>
      <p class="small">${clue}</p>${wrongCat?`<div class="row-x"><button class="btn sm ghost" data-hear="${esc(T.ex)}">${ic("play")}Hear it again</button><button class="btn sm ghost" data-hear="${esc(wrongCat.ex[0])}">${ic("play")}Hear ${esc(wrongCat.label)}</button></div>`:""}
      <button class="btn" id="dnext">Next sound</button></div>`;
    $$("[data-hear]").forEach(b=>b.addEventListener("click",()=>{p.set(b.dataset.hear,"open");startBox(p);}));
    $("#dnext").addEventListener("click",nextTrial);$("#dnext").focus({preventScroll:true});
    $$(".mastery").forEach(m=>m.outerHTML=`<div class="mastery">${DR.cats.map(c=>{const s2=DR.stat[c.key]||{streak:0},m2=drStat(c.key).m;return `<span class="mc${m2?" done":""}${c.key===T.cat.key?" cur":""}">${esc(c.label)}<span class="mdots">${[0,1,2].map(k=>`<i class="${m2||s2.streak>k?"on":""}"></i>`).join("")}</span></span>`;}).join("")}</div>`);
  };
  $$("#dopts .opt").forEach(b=>b.addEventListener("click",()=>answer(+b.dataset.i)));
  KEYS.handler=e=>{if(DR.phase==="q"&&/^[1-9]$/.test(e.key)){const i=+e.key-1;if(opts[i])answer(i);}else if(DR.phase==="fb"&&e.key==="Enter"){e.preventDefault();nextTrial();}else if(e.key===" "&&DR.phase==="q"){e.preventDefault();if(E.box===p)stopAll();else startBox(p);}};
}
function nextTrial(){
  const c=drillPick();
  if(!c){DR.phase="done";DR.cur=null;drawDrill();return;}
  DR.trial++;
  const ex=pick(c.ex),heart=SOUNDS[ex]?SOUNDS[ex].kind==="heart":REAL[ex].body==="heart";
  let others=DR.cats.filter(x=>x.key!==c.key);
  if(others.length>4)others=shuf(others).slice(0,4);
  DR.cur={cat:c,ex,hr:heart&&SOUNDS[ex]?56+2*Math.floor(Math.random()*26):72,opts:shuf([c,...others])};
  DR.phase="q";window.scrollTo(0,0);drawDrill();
}

/* ================= HYPOTHESIS-DRIVEN EXAMINATION ================= */
const HS={};
const YIELD={high:["High yield","good"],mid:["Contributes",""],low:["Adds little","" ],bad:["Inappropriate here","bad"]};
route("practice:hdpe",(id)=>id?"Hypothesis-driven exam":"Hypothesis-driven exam",(root,id)=>{
  const c=id&&HDPE.find(x=>x.id===id);
  if(!c){root.innerHTML=`<section class="ph"><span class="eyebrow">Predict before you examine</span><h1>Hypothesis-driven examination</h1><p class="lede">Read the story, commit to your leading hypothesis, choose a limited number of manoeuvres that would separate the possibilities, and predict what each will show. Then examine and see how far the findings moved the probability.</p></section>
    <div class="list">${HDPE.map(x=>{const r=Store.s.hd[x.id];return `<button class="lrow" data-go="practice/hdpe/${x.id}"><span class="icwrap">${sysIcon(x.sys)}</span><span class="txt"><b>${esc(x.title)}</b><span>${SYS_SHORT[x.sys]} · ${x.budget} manoeuvres${r?` · best ${r.best}/100`:""}</span></span>${r?`<span class="pill ${r.best>=75?"good":r.best>=50?"acc":""}">${r.best}</span>`:ic("chev","chev")}</button>`;}).join("")}</div>`;return;}
  const S=HS[id]||(HS[id]={step:0,lead:null,picks:[],pred:{},rev:{},final:null,conf:70,order:shuf(c.moves.map((_,i)=>i)),dorder:shuf(c.ddx.map(d=>d.dx))});
  drawHdpe(root,c,S);
});
function drawHdpe(root,c,S){
  root=root||V;KEYS.handler=null;
  const steps=["Story","Plan","Examine","Commit","Debrief"];
  const bad=(k,v)=>{const n=parseFloat(String(v).replace(/^[^0-9]*/,""));return k==="HR"?n>100||n<50:k==="BP"?n<90||n>160:k==="RR"?n>22:k==="SpO2"?n<94:k==="T"?n>=38:false;};
  const head=`<section class="ph"><span class="eyebrow">${SYS_SHORT[c.sys]} · hypothesis-driven</span><h1>${esc(c.title)}</h1><div class="stepper">${steps.map((s,i)=>`<span class="${i===S.step?"on":i<S.step?"done":""}">${i+1} ${s}</span>`).join("")}</div></section>
   <div class="card stack"><p>${esc(c.stem)}</p><div class="vitals">${Object.entries(c.vit).map(([k,v])=>`<div class="vit${bad(k,v)?" alert":""}"><span class="label">${k==="T"?"Temp °C":k==="BP"?"BP":k}</span><b>${v}</b></div>`).join("")}</div></div>`;
  const leadName=S.lead||"your leading hypothesis";
  let body="";
  if(S.step===0){
    body=`<div class="section"><span class="label">Your leading hypothesis</span><div class="opts">${S.dorder.map(d=>`<button class="opt${S.lead===d?" sel":""}" data-lead="${esc(d)}">${esc(d)}</button>`).join("")}</div></div>
     <div class="row-x"><button class="btn" id="nx" ${S.lead?"":"disabled"}>Plan the examination</button></div>`;
  }else if(S.step===1){
    body=`<div class="note">Pick up to <b>${c.budget}</b> manoeuvres that would best separate the possibilities. For each, predict what you expect if <b>${esc(leadName)}</b> is right.</div>
     <div class="stack" style="gap:8px">${S.order.map(i=>{const m=c.moves[i],s=SIGNS[m.s],on=S.picks.includes(i),pr=S.pred[i];
      return `<div class="move${on?" on":""}"><input type="checkbox" data-pk="${i}" ${on?"checked":""} ${!on&&S.picks.length>=c.budget?"disabled":""} aria-label="${esc(s.name)}"><label for="" style="min-width:0"><b>${esc(s.name)}</b><br><span class="tiny muted">${esc(s.target)}</span></label>
       ${on?`<div class="pred"><span class="tiny muted" style="align-self:center">Expect:</span>${[["pos","Positive / present"],["neg","Negative / absent"],["nd","Won't help"]].map(([k,l])=>`<button data-pr="${i}" data-v="${k}" aria-pressed="${pr===k}">${l}</button>`).join("")}</div>`:""}</div>`;}).join("")}</div>
     <div class="row-x"><span class="small muted">${S.picks.length}/${c.budget} chosen${S.picks.some(i=>!S.pred[i])?" · add a prediction for each":""}</span><span class="spacer"></span><button class="btn ghost sm" id="bk">Back</button><button class="btn" id="nx" ${S.picks.length&&S.picks.every(i=>S.pred[i])?"":"disabled"}>Examine</button></div>`;
  }else if(S.step===2){
    body=`<div class="stack" style="gap:8px">${S.picks.map(i=>{const m=c.moves[i],s=SIGNS[m.s],rv=S.rev[i];const hit=S.pred[i]===m.r;
      return `<div class="card pad-s stack" style="gap:8px"><div class="row-x"><b style="flex:1;min-width:0">${esc(s.name)}</b><span class="tag">you expected ${S.pred[i]==="pos"?"positive":S.pred[i]==="neg"?"negative":"no help"}</span></div>
       ${rv?`<div class="finding ${S.pred[i]==="nd"?"":hit?"hit":"miss"}"><span>${esc(m.f)}</span><span class="tiny ${S.pred[i]==="nd"?"muted":""}" style="font-weight:700;color:${S.pred[i]==="nd"?"":hit?"var(--good)":"var(--bad)"}">${S.pred[i]==="nd"?"":hit?"As you predicted":"Not what you predicted"}</span></div>`:`<button class="btn sm soft" data-rv="${i}">${ic("play")}Examine</button>`}</div>`;}).join("")}</div>
     <div class="row-x"><span class="spacer"></span><button class="btn" id="nx" ${S.picks.every(i=>S.rev[i])?"":"disabled"}>Commit to a diagnosis</button></div>`;
  }else if(S.step===3){
    body=`<div class="section"><span class="label">Your diagnosis now</span><div class="opts">${S.dorder.map(d=>`<button class="opt${S.final===d?" sel":""}" data-fin="${esc(d)}">${esc(d)}</button>`).join("")}</div></div>
     <label class="fld">How sure are you? <span class="mono" id="cv">${S.conf}%</span><input type="range" id="conf" min="10" max="100" step="5" value="${S.conf}"></label>
     <div class="row-x"><span class="spacer"></span><button class="btn" id="nx" ${S.final?"":"disabled"}>See the debrief</button></div>`;
  }else{
    const fin=c.ddx.find(d=>d.final).dx,R=hdScore(c,S);
    const path=(idx)=>{let p=c.pre;const pts=[["start",p]];idx.forEach(i=>{const m=c.moves[i];if(m.lr){const o=p/(100-p)*m.lr;p=o/(1+o)*100;pts.push([SIGNS[m.s].name.split(/[ (]/)[0],p]);}});return pts;};
    const mine=path(S.picks),expert=path(R.best);
    const bars=pts=>`<div class="ppath">${pts.map(([l,p])=>`<div><span>${Math.round(p)}%</span><i style="height:${Math.max(4,p)}%"></i><span title="${esc(l)}">${esc(l.slice(0,9))}</span></div>`).join("")}</div>`;
    body=`<div class="card stack"><div class="row-x" style="gap:16px">${ring(R.total/100,76,8,R.total)}<div class="stack" style="gap:4px;flex:1;min-width:200px"><span class="eyebrow">Diagnosis</span><h2>${esc(fin)}</h2><span class="pill ${S.final===fin?"good":"bad"}">${S.final===fin?"You got it":"You said "+esc(S.final)} · ${S.conf}% sure</span></div></div>
      <div class="lrrow small"><span>Plan ${R.plan}/40</span><span>Predictions ${R.predict}/20</span><span>Diagnosis ${R.dx}/30</span><span>Judgement ${R.judge}/10</span></div></div>
     <div class="grid g2"><div class="card stack" style="gap:6px"><span class="eyebrow">Probability of ${esc(fin)}: your examination</span>${bars(mine)}<p class="tiny muted">${mine.length>1?`From ${c.pre}% to ${Math.round(mine[mine.length-1][1])}%.`:"None of your manoeuvres had a usable likelihood ratio for the diagnosis."}</p></div>
      <div class="card stack" style="gap:6px"><span class="eyebrow">An expert's ${c.budget} manoeuvres</span>${bars(expert)}<p class="tiny muted">From ${c.pre}% to ${Math.round(expert[expert.length-1][1])}%. Signs that share a mechanism are not truly independent, so the real certainty is lower.</p></div></div>
     <div class="note acc">${esc(c.teach)}</div>
     <div class="section"><span class="label">Every manoeuvre on offer</span><div class="list">${c.moves.map((m,i)=>{const s=SIGNS[m.s],y=YIELD[m.y],me=S.picks.includes(i);return `<button class="lrow" data-go="signs/sign/${m.s}"><span class="dot${me?" on":""}" title="${me?"You chose this":""}"></span><span class="txt"><b>${esc(s.name)}</b><span>${esc(m.f)}</span></span><span class="stack" style="gap:4px;align-items:flex-end"><span class="pill ${y[1]}">${y[0]}</span>${m.lr?`<span class="lr ${lrClass(m.lr)}">LR ${m.lr}</span>`:""}</span></button>`;}).join("")}</div><p class="tiny muted">Orange dot: you chose it. LR = the likelihood ratio this finding carries for ${esc(fin)}.</p></div>
     <div class="row-x"><button class="btn" id="again">Try again</button><button class="btn ghost" id="nextcase">Next case</button></div>`;
  }
  root.innerHTML=head+body;
  /* bindings */
  $$("[data-lead]",root).forEach(b=>b.addEventListener("click",()=>{S.lead=b.dataset.lead;drawHdpe(root,c,S);}));
  $$("[data-pk]",root).forEach(b=>b.addEventListener("change",()=>{const i=+b.dataset.pk,k=S.picks.indexOf(i);if(k>=0){S.picks.splice(k,1);delete S.pred[i];}else if(S.picks.length<c.budget)S.picks.push(i);const y=window.scrollY;drawHdpe(root,c,S);window.scrollTo(0,y);}));
  $$("[data-pr]",root).forEach(b=>b.addEventListener("click",()=>{S.pred[+b.dataset.pr]=b.dataset.v;const y=window.scrollY;drawHdpe(root,c,S);window.scrollTo(0,y);}));
  $$("[data-rv]",root).forEach(b=>b.addEventListener("click",()=>{S.rev[+b.dataset.rv]=true;const y=window.scrollY;drawHdpe(root,c,S);window.scrollTo(0,y);}));
  $$("[data-fin]",root).forEach(b=>b.addEventListener("click",()=>{S.final=b.dataset.fin;drawHdpe(root,c,S);}));
  $("#conf",root)?.addEventListener("input",e=>{S.conf=+e.target.value;$("#cv").textContent=S.conf+"%";});
  $("#bk",root)?.addEventListener("click",()=>{S.step--;drawHdpe(root,c,S);});
  $("#nx",root)?.addEventListener("click",()=>{S.step++;if(S.step===4){const R=hdScore(c,S),o=Store.s.hd[c.id]||{best:0};Store.s.hd[c.id]={best:Math.max(o.best,R.total),last:R.total,at:Date.now()};tick(2,"case");Store.s.xp=(Store.s.xp||0)+Math.round(R.total/10);Store.save();}drawHdpe(root,c,S);window.scrollTo(0,0);});
  $("#again",root)?.addEventListener("click",()=>{delete HS[c.id];render(false);});
  $("#nextcase",root)?.addEventListener("click",()=>{const i=HDPE.indexOf(c),n=HDPE[(i+1)%HDPE.length];delete HS[c.id];replace("hdpe",n.id);});
}
function hdScore(c,S){
  const rank={high:3,mid:2,low:0,bad:-2};
  const best=c.moves.map((m,i)=>i).sort((a,b)=>rank[c.moves[b].y]-rank[c.moves[a].y]||(Math.abs(Math.log(c.moves[b].lr||1))-Math.abs(Math.log(c.moves[a].lr||1)))).slice(0,c.budget);
  const highN=c.moves.filter(m=>m.y==="high").length,cap=Math.min(highN,c.budget);
  const picksHigh=S.picks.filter(i=>c.moves[i].y==="high").length,picksMid=S.picks.filter(i=>c.moves[i].y==="mid").length;
  const plan=Math.round(clamp((picksHigh/Math.max(1,cap))*32+Math.min(picksMid,Math.max(0,c.budget-cap))*(8/Math.max(1,c.budget-cap)),0,40));
  const predN=S.picks.filter(i=>S.pred[i]!=="nd").length;
  const predOk=S.picks.filter(i=>S.pred[i]===c.moves[i].r||(S.pred[i]==="nd"&&["low","bad"].includes(c.moves[i].y))).length;
  const predict=Math.round(S.picks.length?predOk/S.picks.length*20:0);
  const fin=c.ddx.find(d=>d.final).dx;
  const dx=S.final===fin?30:0;
  const judge=Math.max(0,10-S.picks.filter(i=>c.moves[i].y==="bad").length*5-S.picks.filter(i=>c.moves[i].y==="low").length*2-(S.final!==fin&&S.conf>=80?4:0));
  return {plan,predict,dx,judge,total:plan+predict+dx+judge,best,predN};
}

/* ================= ER CASES ================= */
route("practice:er",(id)=>id?"ER case":"ER cases",(root,id)=>{
  const s=id&&SCEN.find(x=>x.id===id);KEYS.handler=null;
  if(!s){root.innerHTML=`<section class="ph"><span class="eyebrow">Applied</span><h1>Hear it, then decide what to do</h1><p class="lede">Story and vitals, identify the sound, then choose the next step. ${Store.s.er.length}/${SCEN.length} completed.</p></section>
    <div class="list">${SCEN.map(x=>`<button class="lrow" data-go="practice/er/${x.id}"><span class="tag">${esc(x.tag)}</span><span class="txt"><b>${esc(x.title)}</b><span>${esc(x.hx)}</span></span>${Store.s.er.includes(x.id)?`<span class="pill good">${ic("check")}done</span>`:ic("chev","chev")}</button>`).join("")}</div>
    <div class="note"><b>Know the limits.</b> In the ED, auscultation misses many pneumothoraces, effusions, early oedema and tamponade. A normal examination does not rule them out: image when the story fits.</div>`;return;}
  const st={a1:null,a2:null},o1=shuf(s.o1),o2=shuf(s.o2.map(o=>({t:o[0],ok:!!o[1],why:o[2]})));
  const bad=(k,v)=>{const n=parseFloat(String(v).replace(/^[^0-9]*/,""));return k==="HR"?n>100||n<50:k==="BP"?n<90||n>160:k==="RR"?n>22:k==="SpO2"?n<94:k==="T"?n>=38:false;};
  root.innerHTML=`<section class="ph"><span class="eyebrow">${esc(s.tag)}</span><h1>${esc(s.title)}</h1></section>
   <div class="card stack"><div class="vitals">${Object.entries(s.vit).map(([k,v])=>`<div class="vit${bad(k,v)?" alert":""}"><span class="label">${k==="T"?"Temp °C":k==="BP"?"BP":k}</span><b>${v}</b></div>`).join("")}</div><p>${esc(s.hx)}</p><p class="muted">${esc(s.exam)}</p></div>
   <div id="erp"></div>
   <div class="section"><span class="label">1 · What do you hear?</span><div class="opts two" id="q1">${o1.map((k,i)=>`<button class="opt" data-k="${k}"><span class="kn">${i+1}</span><span>${esc(SOUNDS[k].name)}</span></button>`).join("")}</div><div id="f1"></div></div>
   <div class="section" id="s2" hidden><span class="label">2 · ${esc(s.q2)}</span><div class="opts" id="q2">${o2.map((o,i)=>`<button class="opt" data-i="${i}"><span class="kn">${i+1}</span><span>${esc(o.t)}<span class="why" hidden>${esc(o.why)}</span></span></button>`).join("")}</div><div id="f2"></div></div>`;
  const p=mk($("#erp"),s.sound,{title:false,piece:false,labels:false});p.set(s.sound,"open",s.hr||undefined);
  const a1=b=>{if(st.a1)return;st.a1=b.dataset.k;const ok=st.a1===s.sound;
    $$("#q1 .opt").forEach(x=>{x.disabled=true;if(x.dataset.k===s.sound)x.classList.add("right");else if(x===b)x.classList.add("wrong");});
    $("#f1").innerHTML=`<div class="ans"><div class="verdict-line ${ok?"ok":"no"}">${ic(ok?"check":"close")}${ok?"Correct":"It was "+esc(SOUNDS[s.sound].name)}</div><p class="small">${SOUNDS[s.sound].clue}</p></div>`;
    $("#s2").hidden=false;setTimeout(()=>$("#s2").scrollIntoView({behavior:"smooth",block:"start"}),60);};
  const a2=b=>{if(st.a2!=null)return;st.a2=+b.dataset.i;
    $$("#q2 .opt").forEach((x,i)=>{x.disabled=true;$(".why",x).hidden=false;if(o2[i].ok)x.classList.add("right");else if(x===b)x.classList.add("wrong");});
    addTo("er",s.id);tick(2,"case");Store.s.xp=(Store.s.xp||0)+8;Store.save();
    const n=SCEN[(SCEN.indexOf(s)+1)%SCEN.length];
    $("#f2").innerHTML=`<div class="stack"><div class="note acc"><span class="eyebrow">Pearl</span><p>${esc(s.pearl)}</p></div><div class="row-x"><button class="btn" id="nx">Next: ${esc(n.title)}</button><button class="btn ghost" data-go="sounds/sound/${s.sound}">The sound</button></div></div>`;
    $("#nx").addEventListener("click",()=>replace("er",n.id));};
  $$("#q1 .opt").forEach(b=>b.addEventListener("click",()=>a1(b)));$$("#q2 .opt").forEach(b=>b.addEventListener("click",()=>a2(b)));
  KEYS.handler=e=>{if(!/^[1-9]$/.test(e.key))return;const i=+e.key-1;if(!st.a1){const b=$$("#q1 .opt")[i];if(b)a1(b);}else if(st.a2==null){const b=$$("#q2 .opt")[i];if(b)a2(b);}};
});

/* ================= REHEARSE & POCKET CARD ================= */
let RH=null;
route("practice:rehearse",(id)=>id?`Rehearse: ${SYS_SHORT[id]}`:"Rehearse",(root,id)=>{
  const s=id&&SYSTEMS.find(x=>x.id===id);KEYS.handler=null;
  if(!s){root.innerHTML=`<section class="ph"><span class="eyebrow">Mental rehearsal</span><h1>Rehearse a routine</h1><p class="lede">Before you see each step, say what comes next and why. Recalling the sequence from memory is both rehearsal and retrieval practice, and it is what makes the routine automatic at the bedside.</p></section>
    <div class="list">${SYSTEMS.map(x=>{const r=Store.s.rehearse[x.id];return `<button class="lrow" data-go="practice/rehearse/${x.id}"><span class="icwrap">${x.icon}</span><span class="txt"><b>${esc(x.name)}</b><span>${x.seq.length} steps${r?` · best ${r.best}/${x.seq.length} recalled`:""}</span></span>${ic("chev","chev")}</button>`;}).join("")}</div>`;return;}
  if(!RH||RH.id!==id)RH={id,i:0,shown:false,got:[]};
  const draw=()=>{
    KEYS.handler=null;
    if(RH.i>=s.seq.length){
      const got=RH.got.filter(Boolean).length,o=Store.s.rehearse[id]||{best:0};Store.s.rehearse[id]={best:Math.max(o.best,got),last:got,at:Date.now()};tick(2,"hands");Store.s.xp=(Store.s.xp||0)+got;Store.save();
      root.innerHTML=`<section class="hero"><span class="eyebrow">Rehearsal complete</span><div class="row-x" style="gap:18px">${ring(got/s.seq.length,84,9,`${got}/${s.seq.length}`)}<div><h1>${got===s.seq.length?"Every step recalled.":"Good. Now the missed ones."}</h1><p class="muted">${esc(s.name)}</p></div></div>
       <div class="row-x"><button class="btn" id="again">Rehearse again</button><button class="btn ghost" data-go="practice/pocket/${id}">${ic("pocket")}Pocket card</button></div></section>
       ${got<s.seq.length?`<div class="section"><span class="label">Steps you missed</span><div class="list">${s.seq.map((st,i)=>RH.got[i]?"":`<div class="lrow"><span class="mono small muted">${pad2(i+1)}</span><span class="txt"><b>${esc(st.t)}</b><span>${esc(st.why)}</span></span></div>`).join("")}</div></div>`:""}`;
      $("#again").addEventListener("click",()=>{RH={id,i:0,shown:false,got:[]};draw();});return;}
    const st=s.seq[RH.i];
    root.innerHTML=`<div class="progress-top"><button class="iconbtn" data-act="back" aria-label="Leave">${ic("close")}</button><div class="meter"><i style="width:${Math.round(RH.i/s.seq.length*100)}%"></i></div><span class="mono small muted">${RH.i+1}/${s.seq.length}</span></div>
     ${RH.i?`<div class="list">${s.seq.slice(0,RH.i).map((x,i)=>`<div class="lrow" style="min-height:0;padding-block:8px"><span class="mono tiny muted">${pad2(i+1)}</span><span class="txt"><b class="small">${esc(x.t)}</b></span>${RH.got[i]?`<span class="pill good">${ic("check")}</span>`:`<span class="pill bad">missed</span>`}</div>`).join("")}</div>`:""}
     <article class="fc"><span class="tag">${esc(s.name)} · step ${RH.i+1}</span><div class="q">What comes next, and why?<small>Say the step, how you do it, and what it is looking for.</small></div>
     <div id="ra">${RH.shown?`<div class="ans"><h2>${esc(st.t)}</h2><p><b>How.</b> ${esc(st.how)}</p><p><b>Why.</b> ${esc(st.why)}</p><div class="grades" style="grid-template-columns:1fr 1fr"><button class="g0" data-r="0">Missed it<span>1</span></button><button class="g3" data-r="1">Recalled it<span>2</span></button></div></div>`:`<button class="btn block" id="sh">Show step</button>`}</div></article>`;
    $("#sh")?.addEventListener("click",()=>{RH.shown=true;draw();});
    $$("[data-r]").forEach(b=>b.addEventListener("click",()=>{RH.got[RH.i]=b.dataset.r==="1";RH.i++;RH.shown=false;draw();window.scrollTo(0,0);}));
    KEYS.handler=e=>{if(!RH.shown&&(e.key===" "||e.key==="Enter")){e.preventDefault();RH.shown=true;draw();}else if(RH.shown&&(e.key==="1"||e.key==="2")){RH.got[RH.i]=e.key==="2";RH.i++;RH.shown=false;draw();}};
  };
  draw();
});
route("practice:pocket",(id)=>`Pocket card: ${SYS_SHORT[id]||""}`,(root,id)=>{
  const s=SYSTEMS.find(x=>x.id===id);if(!s)throw new Error("Module not found");
  root.innerHTML=`<section class="ph"><span class="eyebrow">Pocket card</span><h1>${esc(s.name)}</h1><p class="lede">The routine at a glance, for the bedside. Tick steps as you go; ticks reset when you leave.</p></section>
   <div class="list">${s.seq.map((st,i)=>`<label class="lrow" style="cursor:pointer"><input type="checkbox" style="width:20px;height:20px;accent-color:var(--accent);flex:none"><span class="txt"><b>${pad2(i+1)} · ${esc(st.t)}</b><span>${esc(st.how.split(/(?<=\.)\s/)[0])}</span></span><span class="v v-${st.v}">${VERDICT[st.v]}</span></label>`).join("")}</div>
   <div class="section"><span class="label">If you find…</span><div class="think">${s.think.map(([f,t])=>`<div class="t"><b>${esc(f)}</b><span>${esc(t.split(/(?<=\.)\s/)[0])}</span></div>`).join("")}</div></div>
   <div class="row-x"><button class="btn soft" data-go="practice/rehearse/${id}">${ic("mind")}Rehearse from memory</button><button class="btn ghost" data-go="learn/module/${id}">Full module</button></div>`;
});

/* ================= EVIDENCE DUEL (contrast) ================= */
const DUELS=[["jvp","oedema","heart failure in a dyspnoeic patient"],["s3","s4","a failing or stiff ventricle"],["egophony","crackles","pneumonia"],["percussion-dull","fremitus","pleural effusion"],["chest-expansion","fremitus","pleural effusion"],["fluid-wave","shifting-dullness","ascites"],["shifting-dullness","puddle","ascites"],["rlq-tender","rebound","appendicitis or peritonism"],["rlq-tender","rovsing","appendicitis"],["postural","cap-refill","hypovolaemia"],["dry-axilla","cap-refill","hypovolaemia"],["lachman","mcmurray","an internal knee derangement"],["hints","kernig","a dangerous central cause"],["carotid-upstroke","a2-soft","severe aortic stenosis"],["pronator-drift","hoffmann","an upper motor neuron lesion"],["babinski","hoffmann","an upper motor neuron lesion"],["hoover","wheeze","COPD"],["spleen-palp","liver-palp","organomegaly"],["abd-bruit","bowel-sounds","a vascular abdominal diagnosis"],["murphy","rebound","an acute abdomen"],["otoscopy","transillumination","ENT infection"],["ajr","oedema","raised filling pressure"],["hyperthyroid-signs","hypothyroid-signs","thyroid dysfunction"],["aaa-palp","abd-bruit","an abdominal vascular problem"],["fet","wheeze","airflow obstruction"]];
const DQ={n:0,right:0,streak:0};
route("practice:duel","Evidence duel",(root)=>{
  const next=()=>{
    KEYS.handler=null;
    const [a,b,t]=pick(DUELS),A=SIGNS[a],B=SIGNS[b];if(A.p===B.p)return next();
    const pair=shuf([a,b]),correct=A.p>B.p?a:b;let done=false;
    root.innerHTML=`<section class="ph"><span class="eyebrow">Contrast</span><h1>Evidence duel</h1><p class="lede">Which carries more weight when positive? Knowing the order of magnitude is what makes an examination efficient.</p></section>
     <div class="row-x"><span class="pill acc">Score ${DQ.right}/${DQ.n}</span><span class="pill">${ic("flame")}Streak ${DQ.streak}</span></div>
     <article class="fc"><div class="q">For <span style="color:var(--accent-ink)">${esc(t)}</span>, which finding moves you more?</div>
      <div class="opts two">${pair.map((k,i)=>`<button class="opt" data-k="${k}"><span class="kn">${i+1}</span><span>${esc(SIGNS[k].name)}</span></button>`).join("")}</div><div id="dfb"></div></article>`;
    const ans=bt=>{if(done)return;done=true;const ok=bt.dataset.k===correct;DQ.n++;if(ok){DQ.right++;DQ.streak++;}else DQ.streak=0;
      $$(".opt",root).forEach(x=>{x.disabled=true;if(x.dataset.k===correct)x.classList.add("right");else if(x===bt)x.classList.add("wrong");});
      $("#dfb").innerHTML=`<div class="ans"><div class="verdict-line ${ok?"ok":"no"}">${ic(ok?"check":"close")}${ok?"Correct":"Not quite"}</div>
       ${[a,b].map(k=>`<div class="lrrow"><b style="min-width:0;flex:1 1 200px">${esc(SIGNS[k].name)}</b>${lrChips(SIGNS[k])}</div>`).join("")}
       <p class="small">${esc(SIGNS[correct].think.split(/(?<=\.)\s/)[0])}</p><button class="btn" id="nx">Next duel</button></div>`;
      $("#nx").addEventListener("click",next);$("#nx").focus({preventScroll:true});};
    $$(".opt",root).forEach(x=>x.addEventListener("click",()=>ans(x)));
    KEYS.handler=e=>{if(!done&&(e.key==="1"||e.key==="2"))ans($$(".opt",root)[+e.key-1]);else if(done&&e.key==="Enter"){e.preventDefault();next();}};
  };
  next();
});

/* ================= BEDSIDE LOG (feedback loop) ================= */
const VERIFY=["Echo","Chest X-ray","Ultrasound / POCUS","CT","ECG","Lab result","Senior's examination","Other"];
route("practice:log","Bedside log",(root)=>{
  const L=Store.s.log;
  const ver=L.filter(x=>x.ver),ok=ver.filter(x=>x.ver==="yes").length;
  const bySign={};ver.forEach(x=>{const b=bySign[x.sign]||(bySign[x.sign]={n:0,ok:0});b.n++;if(x.ver==="yes")b.ok++;});
  const buckets=[[50,69],[70,84],[85,100]].map(([lo,hi])=>{const xs=ver.filter(x=>x.conf>=lo&&x.conf<=hi);return {lab:`${lo}–${hi}%`,n:xs.length,acc:xs.length?xs.filter(x=>x.ver==="yes").length/xs.length:null};});
  const opts=Object.entries(SIGNS).sort((a,b)=>a[1].name.localeCompare(b[1].name));
  root.innerHTML=`<section class="ph"><span class="eyebrow">Feedback loop</span><h1>Bedside log</h1><p class="lede">Examination skill plateaus because bedside impressions are rarely checked. Log a finding with your confidence; when the echo, X-ray or ultrasound comes back, mark it confirmed or refuted. Your accuracy per sign builds up here.</p></section>
   <div class="grid"><div class="tile"><span class="eyebrow">Checked</span><b class="big">${ver.length}</b><span class="sub">of ${L.length} logged</span></div><div class="tile"><span class="eyebrow">Confirmed</span><b class="big">${ver.length?Math.round(ok/ver.length*100)+"%":"–"}</b><span class="sub">of checked findings</span></div>
    <div class="tile"><span class="eyebrow">Calibration</span>${buckets.map(b=>`<div class="row-x small" style="gap:8px"><span class="mono" style="width:6.5ch">${b.lab}</span><div class="meter" style="flex:1"><i style="width:${b.acc==null?0:Math.round(b.acc*100)}%"></i></div><span class="mono tiny muted" style="width:6ch;text-align:right">${b.acc==null?"–":Math.round(b.acc*100)+"%"}</span></div>`).join("")}<span class="tiny muted">When you are this sure, how often are you right?</span></div></div>
   <form class="card stack" id="lf"><h3>Log a finding</h3>
    <div class="grid g2"><label class="fld">Sign<select class="sel" id="lsign" required><option value="">Choose…</option>${opts.map(([k,s])=>`<option value="${k}">${esc(s.name)}</option>`).join("")}</select></label>
    <label class="fld">Will be checked by<select class="sel" id="lby">${VERIFY.map(v=>`<option>${v}</option>`).join("")}</select></label></div>
    <label class="fld">What you found<input class="inp" id="lwhat" placeholder="e.g. S3 at the apex, left lateral; JVP 6 cm" maxlength="160"></label>
    <label class="fld">How sure are you? <span class="mono" id="lcv">75%</span><input type="range" id="lconf" min="50" max="100" step="5" value="75"></label>
    <p class="tiny muted">No names, ID or file numbers. Age, sex and the clinical context are enough.</p>
    <div class="row-x"><button class="btn" type="submit">Add to log</button></div></form>
   <section class="section"><span class="label">Your findings</span>${L.length?`<div class="list">${L.slice().reverse().map(x=>{const s=SIGNS[x.sign];return `<div class="lrow" style="align-items:flex-start"><span class="txt"><b>${esc(s?s.name:x.sign)}</b><span>${esc(x.what||"")}${x.what?" · ":""}${x.conf}% sure · ${fmtDate(x.at)} · ${esc(x.by)}</span></span>
     ${x.ver?`<span class="stack" style="gap:6px;align-items:flex-end"><span class="pill ${x.ver==="yes"?"good":"bad"}">${x.ver==="yes"?"Confirmed":"Refuted"}</span><button class="link tiny" data-undo="${x.id}">undo</button></span>`:`<span class="row-x" style="gap:6px;flex-wrap:nowrap"><button class="btn sm soft" data-v="${x.id}" data-r="yes">Confirmed</button><button class="btn sm ghost" data-v="${x.id}" data-r="no">Refuted</button></span>`}</div>`;}).join("")}</div>`:`<div class="empty">Nothing logged yet. On your next shift, log one finding you can check: an S3 before an echo, an effusion before an X-ray, a JVP before an IVC scan.</div>`}</section>
   ${Object.keys(bySign).length?`<section class="section"><span class="label">Accuracy by sign</span><div class="list">${Object.entries(bySign).sort((a,b)=>b[1].n-a[1].n).map(([k,b])=>`<button class="lrow" data-go="signs/sign/${k}"><span class="txt"><b>${esc((SIGNS[k]||{}).name||k)}</b><span>${b.ok}/${b.n} confirmed</span></span><div class="meter" style="width:90px"><i style="width:${Math.round(b.ok/b.n*100)}%"></i></div></button>`).join("")}</div></section>`:""}`;
  $("#lconf").addEventListener("input",e=>$("#lcv").textContent=e.target.value+"%");
  $("#lf").addEventListener("submit",e=>{e.preventDefault();const sign=$("#lsign").value;if(!sign){toast("Choose the sign first.");return;}
    L.push({id:Date.now().toString(36),at:Date.now(),sign,what:$("#lwhat").value.trim(),conf:+$("#lconf").value,by:$("#lby").value,ver:null});tick();Store.save();toast("Logged");render(false,true);});
  $$("[data-v]",root).forEach(b=>b.addEventListener("click",()=>{const x=L.find(y=>y.id===b.dataset.v);if(x){x.ver=b.dataset.r;x.verAt=Date.now();Store.save();render(false,true);}}));
  $$("[data-undo]",root).forEach(b=>b.addEventListener("click",()=>{const x=L.find(y=>y.id===b.dataset.undo);if(x){x.ver=null;Store.save();render(false,true);}}));
});
