"use strict";
/* ================= PRACTICE HUB ================= */
function moodSeg(cur,id){return `<div class="seg mood" role="group" aria-label="How do you feel today?" id="${id||"mood"}">${Object.entries(MOODS).map(([k,[l,sub]])=>`<button type="button" data-mood="${k}" aria-pressed="${k===cur}" title="${esc(sub)}">${l}</button>`).join("")}</div>`;}
route("practice:home","Practice",(root)=>{
  const P=dayPlan(),due=P.due,nw=Math.min(P.room,newCards().length),mood=P.mood;
  const total=Math.min(due,Math.max(0,P.fit-doneTodayN()))+nw,mins=Math.max(1,Math.round((Math.min(due,P.fit)+nw)*P.spc/60));
  const drillDone=DRILLS.reduce((a,d)=>a+drillCats(d).filter(c=>drMastered(d.id,c.key)).length,0),drillAll=DRILLS.reduce((a,d)=>a+drillCats(d).length,0);
  const hdDone=Object.keys(Store.s.hd).length,erDone=Store.s.er.length,pend=Store.s.log.filter(x=>!x.ver&&!x.del).length;
  const checks=checksDue(),flagged=Object.keys(Store.s.notes).filter(k=>k.startsWith("flag:")&&!Store.s.notes[k].deleted).length,sus=Object.values(Store.s.srs).filter(r=>r&&r.sus).length;
  const T=(go,icn,tag,title,sub,meta)=>`<button class="tile" data-go="${go}"><div class="t-top"><span class="icwrap">${ic(icn)}</span><span class="tag">${tag}</span></div><b>${title}</b><span class="sub">${sub}</span>${meta?`<span class="small" style="font-weight:700">${meta}</span>`:""}</button>`;
  root.innerHTML=`<section class="ph"><span class="eyebrow">Practice</span><h1>Train like it matters</h1><p class="lede">Each mode uses a learning method with evidence behind it. A good week: the daily session every day, one drill set to mastery, two hypothesis-driven cases, and one logged finding checked against imaging.</p></section>
  <section class="card stack ses-hero"><div class="row-x"><span class="eyebrow">Today's session</span><span class="spacer"></span>${moodSeg(mood)}</div>
   <div class="counts"><div><b>${due}</b><span>due</span></div><div><b>${nw}</b><span>new</span></div><div><b>${total?"≈ "+mins:"0"}</b><span>min</span></div></div>
   <p class="small muted" style="margin:0">${esc(MOODS[mood][1])}.${P.why.length?" "+esc(P.why.join(" ")):""}</p>
   <div class="row-x"><button class="btn" data-go="practice/session/all">${ic("play")}${total?"Start the session":"Open the session"}</button>${!nw&&!due?`<button class="btn ghost" id="ph-more">Learn 10 more today</button>`:""}</div></section>
  ${checks.length?`<section class="section"><span class="label">Mastery re-checks due</span><div class="list">${checks.map(([s,m])=>`<button class="lrow" data-go="practice/session/chk:${s}"><span class="tag">${m.state==="fading"?"fading":"re-check"}</span><span class="txt"><b>${esc(sessionTitle(s))}</b><span>5 questions · pass 4 to keep it mastered</span></span>${ic("chev","chev")}</button>`).join("")}</div></section>`:""}
  <section class="section"><span class="label">Hands-on</span><div class="grid g2">
   ${typeof TECH!=="undefined"&&TECH.length?T("learn/tech","check","deliberate practice","Technique clinic","Walk-throughs, step ordering, spot the error and checklisted bedside reps for the examinations you want to be certain of.",`${TECH.filter(t=>techDone(t.id)===5).length}/${TECH.length} mastered`):""}
   ${T("practice/rehearse","mind","mental rehearsal","Rehearse a routine","Recall each step of a system's examination before you see it.","")}
   ${T("tools/narrate","ear","hands-on","Narrated routine","Galen reads an examination aloud while you perform it.","")}
   ${T("practice/log","log","feedback loop","Bedside log","Log a real finding with your confidence, then mark it confirmed or refuted.",pend?`${pend} waiting for verification`:"")}
  </div></section>
  <section class="section"><span class="label">Perceptual</span><div class="grid g2">
   ${T("practice/drill","bolt","perceptual mastery","Sound drill","Rapid listen-and-name with instant feedback until each sound is automatic.",`${drillDone}/${drillAll} sound categories mastered`)}
   ${T("practice/spot","eye","perceptual","Spot diagnosis","A real photograph, four names; misses become lessons.","")}
   ${T("practice/describe","eye","describe, then diagnose","Describe it","Describe a skin plate feature by feature, then name it.",`${Object.keys(Store.s.dprac||{}).length}/${DCOND.filter(c=>c.p&&c.d).length} plates tried`)}
   ${T("learn/neuromap","map","tap to learn","Dermatome quiz","Find the root or nerve on the body map.","")}
  </div></section>
  <section class="section"><span class="label">Cases and reasoning</span><div class="grid g2">
   ${T("practice/hdpe","target","predict first","Hypothesis-driven exam","Commit to hypotheses, choose a few manoeuvres, predict each finding, then see how far the evidence moved you.",`${hdDone}/${HDPE.length} cases done`)}
   ${T("practice/localiser","target","clue by clue","Localiser","Pinpoint the lesion in brain, brainstem, cord or nerve from a story told one clue at a time.",`${LCASES.filter(c=>(Store.s.loc[c.id]||{}).best>=85).length}/${LCASES.length} cases mastered`)}
   ${typeof HCASES!=="undefined"&&HCASES.length?T("practice/hcase","history","take the history","History-first cases","OSCE-style ER and occupational stations: choose your questions, hit the red flags in 7 minutes, then commit.",`${HCASES.filter(c=>(Store.s.notes||{})["hc:"+c.id]).length}/${HCASES.length} cases done`):""}
   ${T("practice/er","case","applied","ER sound cases","Story and vitals, identify the sound, then choose the next step.",`${erDone}/${SCEN.length} done`)}
   ${T("practice/duel","shuffle","contrast","Evidence duel","Two signs, one target: which carries more weight?","")}
  </div></section>
  <div class="grid g2"><button class="tile" data-go="learn/method"><div class="t-top"><span class="icwrap n">${ic("mind")}</span></div><b>Why these methods</b><span class="sub">The studies behind each mode, with links.</span></button>
   <button class="tile" data-go="practice/cards"><div class="t-top"><span class="icwrap n">${ic("log")}</span></div><b>Your cards</b><span class="sub">Forecast, suspended and flagged cards, leeches.</span>${sus||flagged?`<span class="small" style="font-weight:700">${sus} suspended · ${flagged} flagged</span>`:""}</button></div>`;
  bindMood(root,()=>render(false,true));
  $("#ph-more",root)?.addEventListener("click",()=>{addExtraNew(10);toast("10 extra new cards, today only","good");open("practice","session","all");});
});
function bindMood(root,after){$$("[data-mood]",root).forEach(b=>b.addEventListener("click",()=>{setMood(b.dataset.mood);after&&after(b.dataset.mood);}));}

/* ================= YOUR CARDS: forecast, suspended, flagged, leeches ================= */
route("practice:cards","Your cards",(root)=>{
  if(!CARDS)buildCards();const t=dayNum();
  const fc=[...Array(14)].map((_,i)=>Object.values(Store.s.srs).filter(r=>r&&!r.sus&&(i===0?r.due<=t:r.due===t+i)).length),mx=Math.max(1,...fc);
  const sus=CARDS.filter(c=>(Store.s.srs[c.id]||{}).sus),leech=CARDS.filter(c=>{const r=Store.s.srs[c.id];return r&&r.leech&&!r.sus;});
  const flags=Object.entries(Store.s.notes).filter(([k,v])=>k.startsWith("flag:")&&v&&!v.deleted).map(([k,v])=>[k.slice(5),v]);
  const row=(c,act,lab)=>`<div class="lrow"><span class="tag">${CARD_TYPE_LABEL[c.type]}</span><span class="txt"><b>${esc(c.label)}</b><span>${SYS_SHORT[c.sys]||""}</span></span><button class="btn sm ghost" data-${act}="${esc(c.id)}">${lab}</button></div>`;
  const flagText=flags.map(([id,v])=>`${id} · ${v.why}${v.note?" · "+v.note:""} · ${fmtDate(v.t)}`).join("\n");
  root.innerHTML=`<section class="ph"><span class="eyebrow">Practice</span><h1>Your cards</h1><p class="lede">The next two weeks of reviews, and the cards you have set aside.</p></section>
   <div class="card stack"><span class="eyebrow">Reviews due, next 14 days</span><div class="fcast">${fc.map((n,i)=>`<div title="${fmtDate(Date.now()+i*DAY_MS)}: ${n}"><span>${n}</span><i style="height:${Math.round(n/mx*100)}%"></i><span>${i===0?"now":WD[new Date(Date.now()+i*DAY_MS).getDay()][0]}</span></div>`).join("")}</div></div>
   <section class="section"><span class="label">Leeches: forgotten ${LEECH_AT} times or more</span>${leech.length?`<div class="list">${leech.map(c=>row(c,"sus","Suspend")).join("")}</div><p class="tiny muted">A card that keeps slipping usually needs rewriting in your own words, or a look at its source page.</p>`:`<div class="empty">No leeches.</div>`}</section>
   <section class="section"><span class="label">Suspended</span>${sus.length?`<div class="list">${sus.map(c=>row(c,"unsus","Bring back")).join("")}</div>`:`<div class="empty">Nothing suspended. Hold a card in a session to suspend it.</div>`}</section>
   <section class="section"><span class="label">Flagged for the author</span>${flags.length?`<div class="list">${flags.map(([id,v])=>{const c=cardById(id);return `<div class="lrow"><span class="tag">${esc(v.why)}</span><span class="txt"><b>${esc(c?c.label:id)}</b><span>${esc(id)} · ${fmtDate(v.t)}</span></span><button class="btn sm ghost" data-unflag="${esc(id)}">Clear</button></div>`;}).join("")}</div><div class="row-x"><button class="btn sm soft" id="fl-copy">Copy the list</button></div>`:`<div class="empty">No flags. Hold a card in a session and choose "Flag this card" when it is wrong or ambiguous.</div>`}</section>`;
  $$("[data-sus]",root).forEach(b=>b.addEventListener("click",()=>{const r=Store.s.srs[b.dataset.sus];if(r){r.sus=1;r.last=Date.now();Store.save();render(false,true);}}));
  $$("[data-unsus]",root).forEach(b=>b.addEventListener("click",()=>{const r=Store.s.srs[b.dataset.unsus];if(r){delete r.sus;r.leech=0;r.l=Math.min(r.l||0,LEECH_AT-2);r.due=Math.min(r.due,dayNum());r.last=Date.now();Store.save();render(false,true);}}));
  $$("[data-unflag]",root).forEach(b=>b.addEventListener("click",()=>{Store.s.notes["flag:"+b.dataset.unflag]={t:Date.now(),deleted:true};Store.save();render(false,true);}));
  $("#fl-copy",root)?.addEventListener("click",()=>{try{navigator.clipboard.writeText(flagText).then(()=>toast("Copied","good"),()=>toast("Couldn't copy"));}catch(e){toast("Couldn't copy");}});
});

/* ================= SESSIONS (flashcards) =================
   SES = {sys, scope, check, cram, queue, kinds (r review · n new · l relearn · x pulled forward · c re-check), i, res, log, …} */
let SES=null;
function sessionTitle(sys){if(sys&&sys.startsWith("reg:")){const r=REGIONS.find(x=>x.id===sys.slice(4));return `${r?r.name:"Region"} review`;}return sys&&sys!=="all"?`${SYS_SHORT[sys]||"No such"} review`:"Today's session";}
function newSession(sys,opts){
  opts=opts||{};const check=String(sys).startsWith("chk:"),scope=check?sys.slice(4):sys;
  const P=opts.cards?{queue:opts.cards,kinds:opts.cards.map(()=>"c"),plan:dayPlan(),mood:sessionMood()}:buildSessionPlan(scope,Object.assign({check},opts));
  SES={sys,scope,check,cram:!!opts.cram,more:!!opts.more,queue:P.queue,kinds:P.kinds,mood:P.mood,plan:P.plan,i:0,res:[0,0,0,0],relearn:{},shown:false,t0:0,answered:null,finished:false,day:dayNum(),started:Date.now(),log:[],right:0,gained:[],hinted:false};
  return SES;
}
route("practice:session",(sys)=>sessionTitle(sys),(root,sys)=>{
  sys=sys||"all";if(typeof normScope==="function")sys=sys.startsWith("chk:")?"chk:"+normScope(sys.slice(4)):normScope(sys);
  const check=sys.startsWith("chk:"),scope=check?sys.slice(4):sys;
  if(!scopeValid(scope)){KEYS.handler=null;root.innerHTML=`<section class="hero" style="align-items:flex-start"><span class="eyebrow">Not in the theatre</span><h1>No such ${scope.startsWith("chap:")?"chapter":scope.startsWith("hall:")?"hall":"session"}.</h1><p class="muted">The link may be old. Choose a hall, or run today's session.</p><div class="row-x"><button class="btn" data-go="practice/session/all">Today's session</button><button class="btn ghost" data-act="home">Back to the theatre</button></div></section>`;return;}
  if(/^(hall|chap):/.test(scope)&&!srsScope(scope).size){KEYS.handler=null;const h=scope.split(":")[1];
    root.innerHTML=`<section class="hero" style="align-items:flex-start"><span class="eyebrow">${esc(sessionTitle(scope))}</span><h1>No cards here yet.</h1><p class="muted">This ${scope.startsWith("chap:")?"chapter":"hall"} is taught through its pages rather than cards for now. Read its items on the hall page; the daily session covers the rest.</p><div class="row-x"><button class="btn" data-go="learn/hall/${esc(h)}">Open the hall</button><button class="btn ghost" data-go="practice/session/all">Today's session</button></div></section>`;return;}
  if(!SES||SES.sys!==sys||(SES.finished&&SES.stale)||SES.day!==dayNum())newSession(sys);
  drawSession(root);
});
/* fading hints: offered on new and young cards, withdrawn as a card matures, never in Exam mood */
function hintLevel(c){if(SES&&(SES.mood==="exam"||SES.check))return 0;const r=Store.s.srs[c.id],t=dayNum();if(!r)return 2;
  if(r.n===0||r.iv<3||(r.ll||[]).some(d=>t-d<=14))return 1;return SES&&SES.mood==="tired"&&r.iv<21?1:0;}
function cueOf(html){const tx=String(html||"").replace(/<button[\s\S]*?<\/button>/g," ").replace(/<[^>]+>/g," ").replace(/&[a-z#0-9]+;/gi," ").replace(/\s+/g," ").trim();
  const first=(tx.split(/(?<=[.!?])\s/)[0]||tx).split(" ").filter(Boolean);if(!first.length)return "";
  return first.slice(0,2).join(" ")+" "+first.slice(2,9).map(w=>w[0]+"…").join(" ")+(first.length>9?" …":"");}
/* slow threshold scales with what there is to read: about 3.5 words a second plus thinking time */
function slowAfter(c,body){const w=(String(body.q).replace(/<[^>]+>/g," ")+" "+(body.opts||[]).map(o=>o.l).join(" ")).split(/\s+/).filter(Boolean).length;
  const base=(c.type==="sound"?14:6)+w/3.5;return SES&&SES.mood==="exam"?base*.75:base;}
function sesCounts(S){let n=0,l=0,r=0;for(let j=S.i;j<S.queue.length;j++){const k=S.kinds[j];if(k==="n")n++;else if(k==="l")l++;else r++;}return {n,l,r,left:S.queue.length-S.i};}
function drawSession(root){
  root=root||V;const S=SES;KEYS.handler=null;Players.reset();
  if(!S.queue.length||S.i>=S.queue.length)return sessionDone(root);
  const c=S.queue[S.i],auto=!!AUTO[c.type],K=sesCounts(S),spc=(S.plan&&S.plan.spc)||21;
  const minsLeft=Math.max(1,Math.round(K.left*spc/60)),done=S.log.length;
  const head=`<div class="progress-top"><button class="iconbtn" data-act="back" aria-label="Leave session">${ic("close")}</button><div class="meter"><i style="width:${Math.round(done/Math.max(1,done+K.left)*100)}%"></i></div>
   <span class="hud" aria-label="${K.n} new, ${K.l} relearning, ${K.r} to review, about ${minsLeft} minutes left"><b class="hn" title="New">${K.n}</b><b class="hl" title="Relearning">${K.l}</b><b class="hr" title="${S.check?"Re-check":"Review"}">${K.r}</b><span class="mono tiny muted">≈${minsLeft}′</span></span></div>`;
  const body=cardBody(c);S.body=body;S.hinted=false;S.wrongAuto=false;
  const r=Store.s.srs[c.id],hl=hintLevel(c);
  const moodRow=S.i===0&&!done&&!S.check&&!S.cram?`<div class="row-x ses-mood"><span class="tiny muted">Today I am</span>${moodSeg(S.mood,"smood")}</div>`:"";
  const seenN=(()=>{try{return +localStorage.getItem("galen.sescount")||0;}catch(e){return 0;}})();
  const keyHint=seenN<8?`<p class="tiny muted keyhint" style="text-align:center">${auto?"Keys 1–4 answer · Enter continues":"Space reveals · 1–4 grade · swipe sideways: ← Again, Good →"} · H hint · U undo · Esc leaves</p>`:"";
  root.innerHTML=`${head}${moodRow}<article class="fc" aria-live="polite"><div class="row-x"><span class="tag">${CARD_TYPE_LABEL[c.type]}</span><span class="pill">${SYS_SHORT[c.sys]}</span>${r?(r.leech?`<span class="pill bad">leech</span>`:""):`<span class="pill acc">new</span>`}${S.check?`<span class="pill">re-check</span>`:S.cram?`<span class="pill">practice only</span>`:""}<span class="spacer"></span>${hl?`<button class="link small" id="hintb" aria-keyshortcuts="h">${ic("bolt")}${auto?"Hint: remove a wrong answer":"Hint"}</button>`:""}</div>
   <div class="q">${body.q}</div>${body.extra||""}<div id="cue"></div><div id="ansArea"></div></article>${keyHint}`;
  S.t0=performance.now();S.answered=null;S.shown=false;
  bindMood(root,m=>{const answered=S.queue.slice(0,S.i);newSession(S.sys);SES.mood=m;if(answered.length)SES.queue=SES.queue.filter(x=>!answered.includes(x));drawSession(root);});
  const A=$("#ansArea");
  if(body.mount)body.mount(root);
  const useHint=()=>{if(S.hinted||!$("#hintb"))return;S.hinted=true;$("#hintb").remove();
    if(auto){const wrong=$$(".opt",A).filter((b,j)=>!body.opts[j].ok&&!b.disabled);shuf(wrong).slice(0,hl>=2&&body.opts.length>=4?2:1).forEach(b=>{b.disabled=true;b.classList.add("struck");});}
    else{const cu=cueOf(body.a);$("#cue").innerHTML=cu?`<p class="cue small">${esc(cu)}</p>`:"";}};
  $("#hintb")?.addEventListener("click",useHint);
  const undoKey=e=>{if(e.key==="u"||e.key==="U"||((e.ctrlKey||e.metaKey)&&(e.key==="z"||e.key==="Z"))){e.preventDefault();Hands.undoNow();return true;}return false;};
  if(auto){
    A.innerHTML=`<div class="opts${body.opts.length===4&&body.opts.every(o=>o.l.length<40)?" two":""}">${body.opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="kn">${i+1}</span><span>${esc(o.l)}</span></button>`).join("")}</div><div id="fb"></div>`;
    const thr=slowAfter(c,body);
    const choose=i=>{if(S.answered!=null||!body.opts[i])return;const btn=$$(".opt",A)[i];if(btn&&btn.disabled)return;S.answered=i;const ok=body.opts[i].ok,dt=(performance.now()-S.t0)/1000,slow=dt>thr;if(typeof galenAnswer==="function")galenAnswer(ok);
      $$(".opt",A).forEach((b,j)=>{b.disabled=true;if(body.opts[j].ok)b.classList.add("right");else if(j===i)b.classList.add("wrong");});$("#hintb")?.remove();$("#fcp")?.classList.remove("trace-hidden");
      S.wrongAuto=!ok;const def=!ok?0:(slow||S.hinted)?1:2;S.autoDefault=def;
      const strict=S.mood==="exam"||S.check||S.cram;
      const gradeRow=ok&&!strict?`<div class="grades three" role="group" aria-label="How well did you know it?">${[[1,"Guessed or slow","g1"],[2,"Knew it","g2"],[3,"Easy","g3"]].map(([g,l,cl])=>`<button class="${cl}${g===def?" def":""}" data-g="${g}"${g===3&&S.hinted?" disabled title=\"Not after a hint\"":""}>${l}<span>${g+1} · ${S.cram?"–":previewIv(c.id,g)}</span></button>`).join("")}</div>`:`<button class="btn" id="nextc">Continue</button>`;
      $("#fb").innerHTML=`<div class="ans"><div class="verdict-line ${ok?"ok":"no"}">${ic(ok?"check":"close")}${ok?(slow?"Correct, but slow: Hard is the honest grade":"Correct"):"Not quite"}</div>${body.explain}${gradeRow}</div>`;
      $("#nextc")?.addEventListener("click",()=>gradeCard(def));$$("#fb [data-g]").forEach(b=>b.addEventListener("click",()=>gradeCard(+b.dataset.g)));
      ($("#fb .def")||$("#nextc"))?.focus({preventScroll:true});};
    $$(".opt",A).forEach(b=>b.addEventListener("click",()=>choose(+b.dataset.i)));
    $(".opt",A)?.focus({preventScroll:true});
    KEYS.handler=e=>{if(undoKey(e))return true;
      if(S.answered==null){if(/^[1-9]$/.test(e.key)){choose(+e.key-1);return true;}if(e.key==="h"||e.key==="H"){useHint();return true;}if(e.key===" "&&body.player){e.preventDefault();if(E.box===body.player)stopAll();else startBox(body.player);return true;}return false;}
      if(e.key==="Enter"){e.preventDefault();gradeCard(S.autoDefault);return true;}
      if(/^[2-4]$/.test(e.key)&&$("#fb [data-g]")){const b=$(`#fb [data-g="${+e.key-1}"]`);if(b&&!b.disabled)gradeCard(+e.key-1);return true;}return false;};
  }else{
    A.innerHTML=`<button class="btn block" id="reveal">Show answer</button>`;
    const reveal=()=>{if(S.shown)return;S.shown=true;$("#hintb")?.remove();
      A.innerHTML=`<div class="ans">${body.a}<div class="grades sticky" role="group" aria-label="Grade your recall">${[["Again","g0"],["Hard","g1"],["Good","g2"],["Easy","g3"]].map(([l,cl],g)=>`<button class="${cl}" data-g="${g}"${g===3&&S.hinted?" disabled title=\"Not after a hint\"":""}>${l}<span>${g+1} · ${S.cram?"–":previewIv(c.id,g)}</span></button>`).join("")}</div></div>`;
      $$("[data-g]",A).forEach(b=>b.addEventListener("click",()=>gradeCard(+b.dataset.g)));if(typeof renderPlates==="function")renderPlates(A);
      $(".g2",A)?.focus({preventScroll:true});};
    $("#reveal").addEventListener("click",reveal);$("#reveal").focus({preventScroll:true});
    KEYS.handler=e=>{if(undoKey(e))return true;
      if((e.key===" "||e.key==="Enter")&&!S.shown){e.preventDefault();reveal();return true;}
      if(!S.shown&&(e.key==="h"||e.key==="H")){useHint();return true;}
      if(S.shown&&/^[1-4]$/.test(e.key)){const b=$(`[data-g="${+e.key-1}"]`,A);if(b&&!b.disabled)gradeCard(+e.key-1);return true;}return false;};
  }
  document.documentElement.classList.add("in-ses");
}
/* controller in a session: A good (or reveal, or the focused answer, or continue) · B again · X reveal or hard · Y easy · LB undo.
   98f-pad.js calls this first; it returns true when it used the button. Start or Back leaves the session. */
function sessionPad(btn){
  if(typeof NAV==="undefined"||cur().v!=="session"||NAV.tab!=="practice"||!SES||SES.finished||SES.i>=SES.queue.length)return false;
  const S=SES,c=S.queue[S.i];if(!c)return false;const auto=!!AUTO[c.type],a=document.activeElement;
  const click=sel=>{const b=typeof sel==="string"?$(sel,V):sel;if(b&&!b.disabled){b.click();return true;}return false;};
  if(btn===4){Hands.undoNow();return true;}
  if(auto){
    if(S.answered==null){if(btn===0&&a&&a.classList&&a.classList.contains("opt"))return click(a);if(btn===2){click("#hintb");return true;}return btn===0||btn===1||btn===3;}
    if(btn===0)return click(a&&a.matches&&a.matches("#fb [data-g],#nextc")?a:($("#fb .def",V)||$("#nextc",V)));
    if(btn===1){if($("#nextc",V))return click("#nextc");return click('#fb [data-g="1"]');}
    if(btn===2)return click('#fb [data-g="1"]')||click("#nextc");
    if(btn===3)return click('#fb [data-g="3"]')||click("#nextc");
    return false;}
  if(!S.shown){if(btn===0||btn===2)return click("#reveal");return btn===1||btn===3;}
  const g={0:a&&a.dataset&&a.dataset.g!=null&&a.closest(".grades")?+a.dataset.g:2,1:0,2:1,3:3}[btn];
  if(g==null)return false;return click(`#ansArea [data-g="${g}"]`);
}
function gradeCard(g){
  const S=SES,c=S&&S.queue[S.i];if(!c)return;
  const r0=Store.s.srs[c.id],t=dayNum(),wasNew=!r0,prevIv=r0?r0.iv:0,ms=performance.now()-S.t0;
  const skip=S.cram||(S.check&&g>0&&r0&&r0.due>t);
  if(skip)tick(1,"session");else schedule(c.id,g);
  logReview(c,g,ms,wasNew&&!skip,prevIv);
  S.res[g]++;S.log.push({id:c.id,g,hint:S.hinted,wrong:!!S.wrongAuto,kind:S.kinds[S.i]});
  if(S.check&&g>0)S.right++;
  if(!S.check&&!S.cram){const sealed=mstNote(c,g>0);sealed.forEach(s=>{S.gained.push(s);Store.s.xp=(Store.s.xp||0)+30;});}
  /* XP: one point for each card you recall; mastery and re-checks are where the big points are */
  if(g>0&&!S.cram)Store.s.xp=(Store.s.xp||0)+1;
  const r=Store.s.srs[c.id];if(g===0&&!skip&&r&&r.leech&&r.l===LEECH_AT)setTimeout(()=>toast(`Forgotten ${LEECH_AT} times: hold the card to suspend or flag it`),900);
  if(g===0&&!S.check){const n=S.relearn[c.id]||0;if(n<2){S.relearn[c.id]=n+1;
    let p=Math.min(S.queue.length,S.i+4);while(p<S.queue.length&&((S.queue[p-1]&&sibKey(S.queue[p-1])===sibKey(c))||(S.queue[p]&&sibKey(S.queue[p])===sibKey(c))))p++;
    S.queue.splice(p,0,c);S.kinds.splice(p,0,"l");}}
  Store.save();
  S.i++;window.scrollTo(0,0);drawSession(V);chrome();
}
function sessionDone(root){
  const S=SES,first=!S.finished;S.finished=true;S.stale=true;KEYS.handler=null;document.documentElement.classList.remove("in-ses");
  if(first&&S.log.length){roundMark("session");try{localStorage.setItem("galen.sescount",(+localStorage.getItem("galen.sescount")||0)+1);}catch(e){}}
  const n=S.log.length,again=S.res[0],ok=n-again,st=streak(),mins=Math.max(0,Math.round((Date.now()-S.started)/60000));
  const scoped=S.scope&&S.scope!=="all"?S.scope:null,P=dayPlan();
  if(S.check){
    if(first&&!S.checkDone){S.checkDone=true;S.passed=checkResult(S.scope,S.right,S.queue.length);if(S.passed)Store.s.xp=(Store.s.xp||0)+10;Store.save();}
    const m=scopeMastery(S.scope);
    root.innerHTML=`<section class="hero" style="align-items:flex-start"><span class="eyebrow">Re-check · ${esc(sessionTitle(S.scope))}</span><div class="row-x" style="gap:18px">${ring(S.right/Math.max(1,S.queue.length),92,9,`${S.right}/${S.queue.length}`)}<div class="stack" style="gap:4px"><h1>${S.passed?"Still mastered.":"It has faded."}</h1><p class="muted">${S.passed?`Next re-check on ${fmtDate((m.next-dayNum())*DAY_MS+Date.now())}.`:`You need ${CHECK_PASS} of ${CHECK_N}. Build it again: 30 answers at 85% over 3 days.`}</p></div></div>
     <div class="row-x"><button class="btn" data-go="practice/session/${esc(S.scope)}">Practise ${S.scope.startsWith("chap:")?"the chapter":"the hall"}</button><button class="btn ghost" data-go="practice">Practice</button></div></section>${revisitHTML(S)}`;
    bindRevisit(root,S);return;}
  const left=dueCards(scoped).length,tomorrow=Object.values(Store.s.srs).filter(r=>r&&!r.sus&&r.due===dayNum()+1).length;
  const goalMet=!scoped&&doneTodayN()>=P.fit;
  const roomNow=scoped?Math.max(0,(+Store.s.settings.newPerDay||0)+extraNewToday()-newToday()):P.room;
  const emptyWhy=!n?(left&&goalMet?`Today's goal of about ${P.minutes} minutes is met. ${left} more ${left===1?"is":"are"} due: keep going, or leave ${left===1?"it":"them"} for tomorrow.`:left?`${left} due.`:roomNow||newCards(scoped).length===0?"Nothing is due here.":"Nothing is due, and today's new cards are used up."+(P.why.length?" "+P.why.join(" "):"")):"";
  const m=scoped&&/^(hall|chap):/.test(scoped)?scopeMastery(scoped):null;
  const mLine=m?m.state==="building"||m.state==="none"?`Mastery: ${m.n} of ${MST_N} answers${m.n?`, ${Math.round(m.pct*100)}% right, on ${m.days} of ${MST_DAYS} days`:""}. Mastered at ${Math.round(MST_PCT*100)}% over ${MST_N} answers on ${MST_DAYS} days.`:m.state==="mastered"?`Mastered. Next re-check on ${fmtDate((m.next-dayNum())*DAY_MS+Date.now())}.`:"Mastered, and a re-check is due.":"";
  const ret=S.log.filter(x=>x.kind==="r");const retPct=ret.length?Math.round(ret.filter(x=>x.g>0).length/ret.length*100):null;
  root.innerHTML=`<section class="hero" style="align-items:flex-start"><span class="eyebrow">${n?(S.cram?"Practice round complete":"Session complete"):"Nothing to review"}</span>
   <div class="row-x" style="gap:18px">${ring(n?ok/n:1,92,9,n?Math.round(ok/n*100)+"%":"✓")}<div class="stack" style="gap:4px"><h1>${n?"Done.":left&&goalMet?"Goal met.":"All caught up."}</h1><p class="muted">${n?`${n} answer${n===1?"":"s"} · ${again} to relearn · ${mins} min · streak ${st} day${st===1?"":"s"}`:esc(emptyWhy)}</p></div></div>
   ${n?`<div class="counts"><div><b>${S.log.filter(x=>x.kind==="n").length}</b><span>new</span></div><div><b>${retPct==null?"–":retPct+"%"}</b><span>reviews kept</span></div><div><b>${tomorrow}</b><span>due tomorrow</span></div></div>`:""}
   ${S.gained.length?`<div class="note acc"><b>Mastered:</b> ${S.gained.map(s=>esc(sessionTitle(s))).join(", ")}. A 5-question re-check comes in 7 days.</div>`:""}
   ${mLine?`<p class="small muted" style="margin:0">${esc(mLine)}</p>`:""}
   <div class="row-x">${left?`<button class="btn" id="again">${left} more due</button>`:""}<button class="btn ${left?"ghost":""}" id="more">Learn 10 more today</button>${m&&(m.state==="check"||m.state==="fading")?`<button class="btn ghost" data-go="practice/session/chk:${esc(scoped)}">Take the re-check</button>`:""}<button class="btn ghost" data-go="practice/drill">${ic("bolt")}Sound drill</button></div>
   ${!scoped?`<div class="row-x"><span class="tiny muted">Next time I am</span>${moodSeg(sessionMood(),"dmood")}</div>`:""}</section>
   ${revisitHTML(S)}`;
  $("#again")?.addEventListener("click",()=>{newSession(S.sys,{more:true});drawSession(root);});
  $("#more").addEventListener("click",()=>{addExtraNew(10);toast("10 extra new cards, today only","good");newSession(S.sys,{more:true});drawSession(root);});
  bindMood(root,()=>render(false,true));bindRevisit(root,S);
}
/* what to revisit: cards you missed, found hard, or needed a hint for */
function revisitList(S){const why={};S.log.forEach(x=>{const w=x.g===0?"Again":x.g===1?"Hard":x.hint?"Hint":null;if(!w)return;const o=why[x.id];if(!o||["Hint","Hard","Again"].indexOf(w)>["Hint","Hard","Again"].indexOf(o))why[x.id]=w;});return Object.entries(why).map(([id,w])=>[cardById(id),w]).filter(x=>x[0]);}
function revisitHTML(S){const L=revisitList(S);if(!L.length)return "";
  return `<div class="section"><div class="row-x"><span class="label">Revisit</span><span class="spacer"></span><button class="btn sm soft" id="rv-run">Run these ${L.length} again</button></div><div class="list">${L.map(([c,w])=>`<button class="lrow" data-go="${cardHome(c)}"><span class="tag">${w}</span><span class="txt"><b>${esc(c.label)}</b><span>${CARD_TYPE_LABEL[c.type]} · ${SYS_SHORT[c.sys]||""}</span></span>${ic("chev","chev")}</button>`).join("")}</div><p class="tiny muted">A practice round does not change their schedule. Open a row to read its source page.</p></div>`;}
function bindRevisit(root,S){$("#rv-run",root)?.addEventListener("click",()=>{const cards=shuf(revisitList(S).map(x=>x[0]));newSession(S.sys,{cram:true,cards});drawSession(root);});}

/* card renderers */
const LRBAND=[["Strongly raises it (LR ≥ 5)",l=>l>=5],["Raises it (LR 2–5)",l=>l>=2&&l<5],["Hardly changes it (LR 0.5–2)",l=>l>0.5&&l<2],["Lowers it (LR ≤ 0.5)",l=>l<=0.5]];
const VERDICT_DEF={core:"Core: worth doing whenever the question arises",useful:"Useful: worth doing when the question is open",low:"Low yield: weak or inconsistent evidence",archaic:"Archaic: replaced by a better test or imaging"};
/* the sign's own distinctive words are masked in a mechanism stem, so the stem does not name the answer */
const MECH_STOP=new Set(["sign","signs","test","tests","rule","rules","score","the","and","with","for","from","reflex","phenomenon","manoeuvre","positive","examination","syndrome"]);
function maskStem(text,name){let out=String(text);const words=String(name).toLowerCase().replace(/[()''’,./–-]/g," ").split(/\s+/).filter(w=>w.length>=4&&!MECH_STOP.has(w));
  words.forEach(w=>{const stem=w.length>6?w.slice(0,Math.max(5,w.length-3)):w;out=out.replace(new RegExp("\\b"+stem.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"[a-z]*","gi"),"[…]");});return out;}
const lcFirst=s=>/^[A-Z][a-z]/.test(s)?s[0].toLowerCase()+s.slice(1):s;
function nearIdx(list,i,n,same){return list.map((x,j)=>[x,j]).filter(([x,j])=>j!==i&&same(x)).sort((a,b)=>Math.abs(a[1]-i)-Math.abs(b[1]-i)).slice(0,n).map(x=>x[0]);}
function cardBody(c){
  const sameSys=(k)=>{const me=SIGNS[k],pool=Object.keys(SIGNS).filter(x=>x!==k&&!SIGNS[x].hide&&SIGNS[x].sys===me.sys);const near=me.reg?pool.filter(x=>SIGNS[x].reg===me.reg):[];return [...shuf(near),...shuf(pool)].filter((x,i,a)=>a.indexOf(x)===i).slice(0,3);};
  switch(c.type){
   case "think":{const s=SIGNS[c.ref];return {q:`You find: ${esc(s.name)}<small>Target: ${esc(s.target)}. What should you think, and how much does it weigh?</small>`,
     a:`${s.fig&&FIG[s.fig]?fig(s.fig,{small:true,nocap:true}):""}<p>${esc(s.think)}</p><div class="lrrow">${lrChips(s)}</div><button class="link small" data-go="signs/sign/${c.ref}" style="align-self:flex-start">Open the sign</button>`};}
   case "verdict":{const s=SIGNS[c.ref];return {q:`How much is this test worth?<small>${esc(s.name)} for ${esc(s.target)}. Core: always worth doing when the question arises · Useful: when the question is open · Low yield: weak evidence · Archaic: replaced.</small>`,
     opts:VERDICT_ORDER.map(v=>({l:VERDICT[v],ok:v===s.v})),explain:`<div class="lrrow"><span class="v v-${s.v}">${VERDICT[s.v]}</span>${lrChips(s)}</div><p class="small">${esc(VERDICT_DEF[s.v]||"")}. The verdict weighs the evidence together with cost, risk and whether the result changes what you do.</p><button class="link small" data-go="signs/sign/${c.ref}" style="align-self:flex-start">Open the sign</button>`};}
   case "mech":{const s=SIGNS[c.ref],opts=shuf([c.ref,...sameSys(c.ref)]);return {q:`Which sign works like this?<small>${esc(maskStem(s.mech,s.name))}</small>`,
     opts:opts.map(k=>({l:SIGNS[k].name,ok:k===c.ref})),explain:`${s.fig&&FIG[s.fig]?fig(s.fig,{small:true}):""}<p class="small"><b>${esc(s.name)}.</b> ${esc(s.mech)}</p><p class="small muted">${esc(s.how)}</p>`};}
   case "snsp":{const s=SIGNS[c.ref],lp=s.p!=null?s.p:(s.spec<100?s.sens/(100-s.spec):99),ln=s.n!=null?s.n:(s.spec>0?(100-s.sens)/s.spec:1);
     /* judged by the likelihood ratios, not by sensitivity or specificity alone: LR+ ≥ 5 rules in, LR− ≤ 0.2 rules out (McGee) */
     const rin=lp>=5,rout=ln<=0.2,ans=rin&&rout?"both":rin?"in":rout?"out":"neither",f=x=>x>=10?Math.round(x):Math.round(x*100)/100;
     const L=[["out","A negative helps rule it out"],["in","A positive helps rule it in"],["both","Both: it rules in and out"],["neither","Neither on its own"]];
     return {q:`${esc(s.name)}<small>For ${esc(s.target)}: what can this test do for you?</small>`,opts:L.map(([k,l])=>({l,ok:k===ans})),
      explain:`<p class="small">Sensitivity <b class="mono">${s.sens}%</b>, specificity <b class="mono">${s.spec}%</b>, so LR+ ≈ <b class="mono">${f(lp)}</b> and LR− ≈ <b class="mono">${f(ln)}</b>. ${rin?"A positive result multiplies the odds at least fivefold: it helps rule in.":"LR+ under 5: a positive result does not settle it."} ${rout?"A negative result cuts the odds to a fifth or less: it helps rule out.":"LR− above 0.2: a negative result leaves the diagnosis open."}${(s.spec>=90&&!rin)||(s.sens>=90&&!rout)?" A high sensitivity or specificity on its own is not enough: the other number matters too.":""}</p>${s.note?`<p class="small muted">${esc(s.note)}</p>`:""}`};}
   case "teach":{const a=ANGLES[c.ref],s=SIGNS[c.ref];return {q:`${esc(a.teachback.q)}<small>${esc(s.name)}. Say it aloud in your own words, as if teaching a student.</small>`,a:`<p>${esc(a.teachback.a)}</p>${a.trap?`<p class="small muted"><b>The trap:</b> ${esc(a.trap)}</p>`:""}<button class="link small" data-go="signs/sign/${c.ref}" style="align-self:flex-start">Open the sign</button>`};}
   case "derm":{const d=DERM_INFO[c.ref];return {q:`${esc(d.n)}<small>Where is its key sensory point, and what area does it cover?</small>`,a:`<dl class="kv"><dt>Key point</dt><dd>${esc(d.k)}</dd><dt>Area</dt><dd>${esc(d.d)}</dd></dl>${d.w?`<p class="small">${esc(d.w)}</p>`:""}<button class="link small" data-go="learn/neuromap/derm" style="align-self:flex-start">Open the map</button>`};}
   case "myo":{const m=MYO[c.ref],arm=x=>/^[CT]/.test(x[0]),near=nearIdx(MYO,c.ref,3,x=>arm(x)===arm(m)).map(x=>x[0]),opts=shuf([m[0],...near]);
     const rf=m[3]&&m[3]!=="—"&&m[3]!=="-"?` Reflex: ${esc(m[3])}.`:"";
     return {q:`${esc(m[1])}<small>Which root does this key muscle test?</small>`,opts:opts.map(r=>({l:r,ok:r===m[0]})),explain:`<p class="small"><b>${m[0]}.</b> ${esc(m[2])}.${rf}</p>`};}
   case "reflex":{const strip=x=>String(x).replace(/\s*\(.*?\)\s*/g,"").trim(),r=REFLEX[c.ref],segs=[...new Set(REFLEX.map(x=>strip(x[1])))],mine=strip(r[1]),idx=segs.indexOf(mine);
     const near=nearIdx(segs,idx,3,()=>true),opts=shuf([mine,...near]);
     return {q:`${esc(r[0])} reflex<small>Which segments?</small>`,opts:opts.map(x=>({l:x,ok:x===mine})),explain:`<p class="small"><b>${esc(r[1])}.</b> ${esc(r[2])}. ${esc(r[3])}.</p>`};}
   case "rootnerve":{const r=ROOTNERVE[c.ref];return {q:`${esc(r.q)}<small>${esc(r.a)} or ${esc(r.b)}? What single test separates them?</small>`,a:`<p>${esc(r.key)}</p><p class="small muted">${esc(r.also)}</p>`};}
   case "cranial":{const x=CRANIAL[c.ref];return {q:`Cranial nerve ${x[0]}<small>Name it, how you test it, and the finding that changes management.</small>`,a:`<dl class="kv"><dt>Name</dt><dd>${esc(x[1])}</dd><dt>Test</dt><dd>${esc(x[2])}</dd></dl><p>${esc(x[3])}</p><p class="small muted">${esc(x[4])}</p>`};}
   case "dterm":{const v=DVOCAB[c.ref],sized=/\d\s*(cm|mm)\b/.test(v[2]);return {q:`${esc(v[0])}<small>Define it${sized?", including the size rule,":""} and give an example.</small>`,a:`${v[4]?`<div class="dplate">${plateHTML("v:"+c.ref,dTone(),{small:true})}</div>`:""}<p>${esc(v[2])}</p><p class="small muted">${esc(v[3])}</p>`};}
   case "dplate":{const x=DCOND.find(y=>y.id===c.ref),P=DCOND.filter(y=>y.p),same=shuf(P.filter(y=>y.id!==x.id&&y.g===x.g)),oth=shuf(P.filter(y=>y.g!==x.g)),opts=shuf([x,...same.slice(0,3),...oth].filter((y,i,a)=>a.indexOf(y)===i).slice(0,4)),t=Math.floor(Math.random()*6);
     return {q:`Name the rash<small>Skin type ${TONE_NAME[t]}. Look at the primary lesion, colour, surface and arrangement.</small>`,extra:`<div class="dplate">${plateHTML("c:"+x.id,t)}</div>`,mount:()=>renderPlates(V),opts:opts.map(y=>({l:y.n,ok:y.id===x.id})),explain:`<p class="small">${esc(x.m)}</p><button class="link small" data-go="learn/dcond/${x.id}" style="align-self:flex-start">Open the condition</button>`};}
   case "finding":{const m=SYSTEMS.find(x=>x.id===c.ref[0]),[f,t]=m.think[c.ref[1]];return {q:`${esc(f)}<small>${esc(m.name)}. What do you think, and what do you do next?</small>`,a:`<p>${esc(t)}</p><button class="link small" data-go="learn/module/${m.id}/think" style="align-self:flex-start">Open the module</button>`};}
   case "anat":{const a=ANAT[c.ref[0]],p=a.pts.find(x=>x.k===c.ref[1]);return {q:`${esc(p.n)}<small>Where is it, and why does it matter at the bedside?</small>`,a:`<dl class="kv"><dt>Where</dt><dd>${esc(p.at)}</dd></dl><p>${esc(p.why)}</p>`};}
   case "area":{const a=AREAS[c.ref];return {q:`${esc(a.name)}<small>Where exactly do you listen, and why there rather than over the valve?</small>`,a:`<dl class="kv"><dt>Listen</dt><dd>${a.at}</dd><dt>Valve</dt><dd>${a.valve}</dd></dl><p>${a.why}</p><div class="chips">${a.best.map(soundChip).join("")}</div>`};}
   case "zone":{const a=LZONES[c.ref];return {q:`Lung zone: ${esc(a.name)}<small>Where, and what do you listen for there?</small>`,a:`<dl class="kv"><dt>Listen</dt><dd>${a.at}</dd></dl><p>${a.why}</p>`};}
   case "hlr":{const p=HIST.pres.find(x=>x.id===c.ref[0]),[f,t,l]=p.lr[c.ref[1]];return {q:`“${esc(f)}”<small>${esc(p.name)}: what does this clue do to the probability of ${esc(lcFirst(t))}?</small>`,
     opts:LRBAND.map(([lab,fn])=>({l:lab,ok:fn(l)})),explain:`<p class="small">LR ≈ <b class="mono">${l}</b> for ${esc(lcFirst(t))}. <button class="link" data-go="learn/pres/${p.id}">See all ${esc(p.name.toLowerCase())} clues</button></p>`};}
   case "red":{const p=HIST.pres.find(x=>x.id===c.ref);return {q:`${esc(p.name)}<small>List the red flags you must ask about.</small>`,a:p.red.map(r=>`<div class="redflag">${esc(r)}</div>`).join("")};}
   case "sound":{const s=SOUNDS[c.ref],pool=Object.keys(SOUNDS).filter(k=>k!==c.ref&&SOUNDS[k].kind===s.kind);
     const near=pool.filter(k=>SOUNDS[k].group===s.group),opts=shuf([c.ref,...shuf(near).concat(shuf(pool)).filter((k,i,a)=>a.indexOf(k)===i).slice(0,3)]);
     const hr=s.kind==="heart"?60+2*Math.floor(Math.random()*18):72,B={};
     /* the trace stays hidden until you answer, so the shape of the waveform does not give the sound away */
     return Object.assign(B,{q:`Name this sound<small>Play it (Space), listen to at least two cycles, then choose.</small>`,extra:`<div id="fcp" class="trace-hidden"></div>`,
       mount:()=>{const p=mk($("#fcp"),c.ref,{title:false,piece:false,labels:false});p.set(c.ref,"open",hr);B.player=p;},
       opts:opts.map(k=>({l:SOUNDS[k].name,ok:k===c.ref})),explain:`<p class="small">${s.clue}</p><button class="link small" data-go="sounds/sound/${c.ref}" style="align-self:flex-start">Open the lesson</button>`});}
  }
  return {q:"",a:""};
}

/* ================= SOUND DRILL (perceptual mastery) ================= */
const DR_TARGET={heart:10,lung:12};
function drillCats(d){
  if(d.real){const dx=[...new Set(Object.values(REAL).filter(r=>r.body===d.real).map(r=>r.dx))];
    return dx.map(x=>({key:"rx-"+x.toLowerCase().replace(/[^a-z]+/g,"-"),label:x,ex:Object.keys(REAL).filter(k=>REAL[k].body===d.real&&REAL[k].dx===x)}));}
  /* recordings that mix two findings (e.g. wheeze + crackles) would have two right answers in a single-label drill */
  return d.cats.map(k=>({key:k,label:SOUNDS[k].name,ex:[k,...Object.keys(REAL).filter(r=>REAL[r].teach===k&&!REAL[r].mixed&&!/\+|\band\b/i.test(REAL[r].name||""))]}));
}
let DR=null;
route("practice:drill",(id)=>id?"Drill":"Sound drill",(root,id)=>{
  const d=id&&DRILLS.find(x=>x.id===id);
  if(!d){DR=null;KEYS.handler=null;
    root.innerHTML=`<section class="ph"><span class="eyebrow">Perceptual mastery</span><h1>Sound drill</h1><p class="lede">Sounds from one family are mixed together and played back to back. Name each one; wrong or slow answers bring that sound back sooner. A sound is mastered after three correct answers in a row, each within ${DR_TARGET.heart} seconds (${DR_TARGET.lung} for lungs). Teaching sounds play at varying heart rates, and real recordings are mixed in where they exist.</p></section>
     <div class="list">${DRILLS.map(x=>{const cs=drillCats(x),m=cs.filter(c=>drMastered(x.id,c.key)).length;return `<button class="lrow" data-go="practice/drill/${x.id}">${ring(m/cs.length,40,4.5,`${m}/${cs.length}`)}<span class="txt"><b>${esc(x.name)}</b><span>${esc(x.sub)}${m===cs.length?" · mastered":""}</span></span>${ic("chev","chev")}</button>`;}).join("")}</div>
     <div class="note">Why it works: ~500 repetitions took students from 39% to 89% on murmurs; mixed, adaptive classification with a mastery rule produced large, lasting gains for ECGs. <button class="link" data-go="learn/method">The evidence</button></div>`;return;}
  if(!DR||DR.id!==d.id)DR={id:d.id,cats:drillCats(d),stat:{},trial:0,cur:null,phase:"intro",n:0,right:0,review:false};
  drawDrill(root);
});
/* the bedside sign that goes with a drill sound, when there is one */
const SOUND_SIGN={"fine-crackles":"crackles","coarse-crackles":"crackles",stridor:"stridor-sign",bronchial:"bronchial-breathing","pleural-rub":"pericardial-rub",rub:"pericardial-rub",ar:"ar-murmur",mr:"mr-murmur","acute-mr":"mr-murmur",as:"a2-soft",hocm:"valsalva-murmur"};
function soundSign(k){if(!k)return null;if(REAL[k]&&REAL[k].teach)k=REAL[k].teach;const s=SOUND_SIGN[k]||k;return SIGNS[s]&&!SIGNS[s].hide?s:null;}
function drStat(k){const key=DR.id+":"+k;return Store.s.snd[key]||(Store.s.snd[key]={m:false,n:0,r:0});}
/* drill mastery fades: a sound mastered more than 60 days ago comes back into the drill until you name it fast three times again */
const DR_KEEP_DAYS=60;
function drMastered(id,key){const st=Store.s.snd[id+":"+key];return !!(st&&st.m&&(!st.mt||Date.now()-st.mt<DR_KEEP_DAYS*DAY_MS));}
function drillPick(){
  const live=DR.cats.filter(c=>DR.review||!drMastered(DR.id,c.key));if(!live.length)return null;
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
  const chips=cats.map(c=>{const st=DR.stat[c.key]||{streak:0},m=drMastered(DR.id,c.key);return `<span class="mc${m?" done":""}${DR.cur&&DR.cur.cat.key===c.key&&DR.phase==="fb"?" cur":""}">${esc(c.label)}<span class="mdots">${[0,1,2].map(i=>`<i class="${m||st.streak>i?"on":""}"></i>`).join("")}</span></span>`;}).join("");
  const mastered=cats.filter(c=>drMastered(DR.id,c.key)).length;
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
    if(DR.phase!=="q")return;DR.phase="fb";clearInterval(tm);stopAll();/* the loop stops on answer, so the feedback tone is heard */
    const dt=t0==null?99:(performance.now()-t0)/1000,o=opts[i],ok=o.key===T.cat.key,fast=dt<=target;if(typeof galenAnswer==="function")galenAnswer(ok);
    const st=DR.stat[T.cat.key],ps=drStat(T.cat.key);DR.n++;ps.n++;
    st.last=DR.trial;st.wrong=!ok;st.slow=ok&&!fast;
    if(ok){DR.right++;ps.r++;st.streak=fast?st.streak+1:Math.max(0,st.streak);if(st.streak>=3&&!drMastered(DR.id,T.cat.key)){ps.m=true;ps.mt=Date.now();toast(`${T.cat.label}: mastered`,"good");}}else{st.streak=0;}
    const wrongCat=!ok&&DR.cats.find(c=>c.key===o.key);
    tick(1,"hands");Store.save();
    $$("#dopts .opt").forEach((b,j)=>{b.disabled=true;if(opts[j].key===T.cat.key)b.classList.add("right");else if(j===i)b.classList.add("wrong");});
    const clue=SOUNDS[T.cat.key]?SOUNDS[T.cat.key].clue:LISTEN[T.cat.label]||"",sg=soundSign(T.cat.key)||soundSign(T.ex);
    $("#dfb").innerHTML=`<div class="ans"><div class="verdict-line ${ok?"ok":"no"}">${ic(ok?"check":"close")}${ok?(fast?`Correct in ${dt.toFixed(1)} s`:`Correct, but ${dt.toFixed(0)} s: doesn't count toward mastery yet`):`It was ${esc(T.cat.label)}`}</div>
      <p class="small">${clue}</p>${wrongCat?`<div class="row-x"><button class="btn sm ghost" data-hear="${esc(T.ex)}">${ic("play")}Hear it again</button><button class="btn sm ghost" data-hear="${esc(wrongCat.ex[0])}">${ic("play")}Hear ${esc(wrongCat.label)}</button></div>`:""}
      ${sg?`<div class="chips">${signChip(sg)}</div>`:""}<button class="btn" id="dnext">Next sound</button></div>`;
    $$("[data-hear]").forEach(b=>b.addEventListener("click",()=>{p.set(b.dataset.hear,"open");startBox(p);}));
    $("#dnext").addEventListener("click",nextTrial);$("#dnext").focus({preventScroll:true});
    $$(".mastery").forEach(m=>m.outerHTML=`<div class="mastery">${DR.cats.map(c=>{const s2=DR.stat[c.key]||{streak:0},m2=drMastered(DR.id,c.key);return `<span class="mc${m2?" done":""}${c.key===T.cat.key?" cur":""}">${esc(c.label)}<span class="mdots">${[0,1,2].map(k=>`<i class="${m2||s2.streak>k?"on":""}"></i>`).join("")}</span></span>`;}).join("")}</div>`);
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
  const head=`<section class="ph"><span class="eyebrow">${SYS_SHORT[c.sys]} · hypothesis-driven</span><h1>${esc(c.title)}</h1><div class="stepper">${steps.map((s,i)=>`<span class="${i===S.step?"on":i<S.step?"done":""}" title="${s}">${i+1}<span class="sw"> ${s}</span></span>`).join("")}</div></section>
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
    const path=(idx)=>{let p=c.pre;const pts=[["start",p]],used={};idx.forEach(i=>{const m=c.moves[i];if(!m.lr)return;let lr=m.lr;
      /* within a mechanism group only the strongest LR counts: a later, stronger sign adds only its excess over the earlier one */
      if(m.grp){const prev=used[m.grp];const str=x=>Math.abs(Math.log(x));if(prev){lr=str(m.lr)>str(prev)&&Math.sign(Math.log(m.lr))===Math.sign(Math.log(prev))?m.lr/prev:1;}if(!prev||str(m.lr)>str(prev))used[m.grp]=m.lr;}
      const o=p/(100-p)*lr;p=Math.min(99,Math.max(1,o/(1+o)*100));pts.push([SIGNS[m.s].name.replace(/\s*\(.*?\)/g,""),p]);});return pts;};
    const mine=path(S.picks),expert=path(R.best);
    const bars=pts=>`<div class="ppath">${pts.map(([l,p])=>`<div><span>${Math.round(p)}%</span><i style="height:${Math.max(4,p)}%"></i><span class="pl" title="${esc(l)}">${esc(l.length>22?l.slice(0,21)+"…":l)}</span></div>`).join("")}</div>`;
    body=`<div class="card stack"><div class="row-x" style="gap:16px">${ring(R.total/100,76,8,R.total)}<div class="stack" style="gap:4px;flex:1;min-width:200px"><span class="eyebrow">Diagnosis</span><h2>${esc(fin)}</h2><span class="pill ${S.final===fin?"good":"bad"}">${S.final===fin?"You got it":"You said "+esc(S.final)} · ${S.conf}% sure</span></div></div>
      <div class="lrrow small"><span>Plan ${R.plan}/40</span><span>Predictions ${R.predict}/20</span><span>Diagnosis ${R.dx}/30</span><span>Judgement ${R.judge}/10</span></div></div>
     <div class="grid g2"><div class="card stack" style="gap:6px"><span class="eyebrow">Probability of ${esc(fin)}: your examination</span>${bars(mine)}<p class="tiny muted">${mine.length>1?`From ${c.pre}% to ${Math.round(mine[mine.length-1][1])}%.`:"None of your manoeuvres had a usable likelihood ratio for the diagnosis."}</p></div>
      <div class="card stack" style="gap:6px"><span class="eyebrow">An expert's ${c.budget} manoeuvres</span>${bars(expert)}<p class="tiny muted">From ${c.pre}% to ${Math.round(expert[expert.length-1][1])}%. Signs that share a mechanism count once here, and the bar stops at 99%: the bedside never gives certainty.</p></div></div>
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
  const a1=b=>{if(st.a1)return;st.a1=b.dataset.k;const ok=st.a1===s.sound;if(typeof galenAnswer==="function")galenAnswer(ok);
    $$("#q1 .opt").forEach(x=>{x.disabled=true;if(x.dataset.k===s.sound)x.classList.add("right");else if(x===b)x.classList.add("wrong");});
    $("#f1").innerHTML=`<div class="ans"><div class="verdict-line ${ok?"ok":"no"}">${ic(ok?"check":"close")}${ok?"Correct":"It was "+esc(SOUNDS[s.sound].name)}</div><p class="small">${SOUNDS[s.sound].clue}</p></div>`;
    $("#s2").hidden=false;setTimeout(()=>$("#s2").scrollIntoView({behavior:"smooth",block:"start"}),60);};
  const a2=b=>{if(st.a2!=null)return;st.a2=+b.dataset.i;{const ok=!!o2[st.a2].ok;if(typeof galenAnswer==="function")galenAnswer(ok);}
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
route("practice:pocket",(id)=>SYS_SHORT[id]?`Pocket card: ${SYS_SHORT[id]}`:"Pocket cards",(root,id)=>{
  const s=SYSTEMS.find(x=>x.id===id);if(!s){root.innerHTML=`<section class="ph"><span class="eyebrow">Pocket cards</span><h1>Choose a routine</h1><p class="lede">${id?"That pocket card is not in the theatre. ":""}Each card is a system's examination at a glance.</p></section><div class="list">${SYSTEMS.map(x=>`<button class="lrow" data-go="practice/pocket/${x.id}"><span class="icwrap">${x.icon}</span><span class="txt"><b>${esc(x.name)}</b><span>${x.seq.length} steps</span></span>${ic("chev","chev")}</button>`).join("")}</div>`;return;}
  root.innerHTML=`<section class="ph"><span class="eyebrow">Pocket card</span><h1>${esc(s.name)}</h1><p class="lede">The routine at a glance, for the bedside. Tick steps as you go; ticks reset when you leave.</p></section>
   <div class="list">${s.seq.map((st,i)=>`<label class="lrow" style="cursor:pointer"><input type="checkbox" style="width:20px;height:20px;accent-color:var(--accent);flex:none"><span class="txt"><b>${pad2(i+1)} · ${esc(st.t)}</b><span>${esc(st.how.split(/(?<=\.)\s/)[0])}</span></span><span class="v v-${st.v}">${VERDICT[st.v]}</span></label>`).join("")}</div>
   <div class="section"><span class="label">If you find…</span><div class="think">${s.think.map(([f,t])=>`<div class="t"><b>${esc(f)}</b><span>${esc(t.split(/(?<=\.)\s/)[0])}</span></div>`).join("")}</div></div>
   <div class="row-x"><button class="btn soft" data-go="practice/rehearse/${id}">${ic("mind")}Rehearse from memory</button><button class="btn ghost" data-go="learn/module/${id}">Full module</button></div>`;
});

/* ================= EVIDENCE DUEL (contrast) ================= */
/* (the hand-made pair list was retired: half its pairs compared LRs for different target conditions) */
const DQ={n:0,right:0,streak:0};
/* only signs whose likelihood ratios were measured for the same target condition can be compared; pairs are built from SIGNS by target */
let _DP=null;
function duelSet(){if(_DP)return _DP;const by={};
  Object.entries(SIGNS).forEach(([k,s])=>{if(s.hide||s.p==null||!s.target)return;const t=String(s.target).trim().toLowerCase();(by[t]||(by[t]=[])).push(k);});
  const out=[];Object.values(by).forEach(ks=>{for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){const A=SIGNS[ks[i]],B=SIGNS[ks[j]];
    const hi=Math.max(A.p,B.p),lo=Math.min(A.p,B.p);if(lo>0&&hi/lo>=1.5)out.push([ks[i],ks[j],A.target,"pos"]);
    if(A.n!=null&&B.n!=null&&A.n>0&&B.n>0){const h=Math.max(A.n,B.n),l=Math.min(A.n,B.n);if(h/l>=1.5)out.push([ks[i],ks[j],A.target,"neg"]);}}});
  return _DP=out;}
route("practice:duel","Evidence duel",(root)=>{
  const next=()=>{
    KEYS.handler=null;
    const P=[...(typeof duelPairs==="function"?duelPairs().map(x=>[x[0],x[1],x[2],"pos"]):[]),...duelSet().filter(x=>x[3]==="neg"||typeof duelPairs!=="function")].filter(([a,b,,m])=>SIGNS[a]&&SIGNS[b]&&(m==="neg"?SIGNS[a].n!==SIGNS[b].n:SIGNS[a].p!==SIGNS[b].p));if(!P.length){root.innerHTML=`<div class="empty">No pairs of signs share a target yet.</div>`;return;}
    let [a,b,t,mode]=pick(P);if(P.length>3&&DQ.last===a+b+mode)[a,b,t,mode]=pick(P);DQ.last=a+b+mode;const A=SIGNS[a],B=SIGNS[b],pos=mode==="pos";
    const pair=shuf([a,b]),correct=pos?(A.p>B.p?a:b):(A.n<B.n?a:b);let done=false;
    root.innerHTML=`<section class="ph"><span class="eyebrow">Contrast</span><h1>Evidence duel</h1><p class="lede">Two signs studied for the same diagnosis: which carries more weight? Knowing the order of magnitude is what makes an examination efficient.</p></section>
     <div class="row-x"><span class="pill acc">Score ${DQ.right}/${DQ.n}</span><span class="pill">${ic("flame")}Streak ${DQ.streak}</span></div>
     <article class="fc"><div class="q">For <span style="color:var(--accent-ink)">${esc(t)}</span>, which finding moves you more <b>when ${pos?"positive":"negative"}</b>?<small>${pos?"The larger LR+ raises the probability more.":"The smaller LR− lowers the probability more."}</small></div>
      <div class="opts two">${pair.map((k,i)=>`<button class="opt" data-k="${k}"><span class="kn">${i+1}</span><span>${esc(SIGNS[k].name)}</span></button>`).join("")}</div><div id="dfb"></div></article>`;
    const ans=bt=>{if(done)return;done=true;const ok=bt.dataset.k===correct;if(typeof galenAnswer==="function")galenAnswer(ok);DQ.n++;if(ok){DQ.right++;DQ.streak++;}else DQ.streak=0;
      $$(".opt",root).forEach(x=>{x.disabled=true;if(x.dataset.k===correct)x.classList.add("right");else if(x===bt)x.classList.add("wrong");});
      $("#dfb").innerHTML=`<div class="ans"><div class="verdict-line ${ok?"ok":"no"}">${ic(ok?"check":"close")}${ok?"Correct":"Not quite"}</div>
       ${[a,b].map(k=>`<div class="lrrow"><b style="min-width:0;flex:1 1 200px">${esc(SIGNS[k].name)}</b>${lrChips(SIGNS[k])}</div>`).join("")}
       <p class="small">${esc(SIGNS[correct].think.split(/(?<=\.)\s/)[0])}</p><button class="btn" id="nx">Next duel</button></div>`;
      $("#nx").addEventListener("click",next);$("#nx").focus({preventScroll:true});};
    $$(".opt",root).forEach(x=>x.addEventListener("click",()=>ans(x)));
    KEYS.handler=e=>{if(!done&&(e.key==="1"||e.key==="2")){ans($$(".opt",root)[+e.key-1]);return true;}if(done&&e.key==="Enter"){e.preventDefault();next();return true;}return false;};$(".opt",root)?.focus({preventScroll:true});
  };
  next();
});

/* ================= BEDSIDE LOG (feedback loop) ================= */
const VERIFY=["Echo","Chest X-ray","Ultrasound / POCUS","CT","ECG","Lab result","Senior's examination","Other"];
route("practice:log","Bedside log",(root)=>{
  const ALL=Store.s.log,L=ALL.filter(x=>x&&typeof x==="object"&&!x.del&&x.sign);
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
   <section class="section"><span class="label">Your findings</span>${L.length?`<div class="list">${L.slice().reverse().map(x=>{const s=SIGNS[x.sign];return `<div class="lrow" style="align-items:flex-start"><span class="txt"><b>${esc(s?s.name:x.sign)}</b><span>${esc(x.what||"")}${x.what?" · ":""}${esc(+x.conf||0)}% sure · ${fmtDate(x.at||x.t||Date.now())} · ${esc(x.by||"")}</span></span>
     ${x.ver?`<span class="stack" style="gap:6px;align-items:flex-end"><span class="pill ${x.ver==="yes"?"good":"bad"}">${x.ver==="yes"?"Confirmed":"Refuted"}</span><button class="link tiny" data-undo="${esc(x.id)}">undo</button></span>`:`<span class="row-x" style="gap:6px;flex-wrap:nowrap"><button class="btn sm soft" data-v="${esc(x.id)}" data-r="yes">Confirmed</button><button class="btn sm ghost" data-v="${esc(x.id)}" data-r="no">Refuted</button><button class="iconbtn" data-del="${esc(x.id)}" aria-label="Delete this entry">${ic("close")}</button></span>`}</div>`;}).join("")}</div>`:`<div class="empty">Nothing logged yet. On your next shift, log one finding you can check: an S3 before an echo, an effusion before an X-ray, a JVP before an IVC scan.</div>`}</section>
   ${Object.keys(bySign).length?`<section class="section"><span class="label">Accuracy by sign</span><div class="list">${Object.entries(bySign).sort((a,b)=>b[1].n-a[1].n).map(([k,b])=>`<button class="lrow" data-go="signs/sign/${k}"><span class="txt"><b>${esc((SIGNS[k]||{}).name||k)}</b><span>${b.ok}/${b.n} confirmed</span></span><div class="meter" style="width:90px"><i style="width:${Math.round(b.ok/b.n*100)}%"></i></div></button>`).join("")}</div></section>`:""}`;
  $("#lconf").addEventListener("input",e=>$("#lcv").textContent=e.target.value+"%");
  $("#lf").addEventListener("submit",e=>{e.preventDefault();const sign=$("#lsign").value;if(!sign){toast("Choose the sign first.");return;}
    L.push({id:Date.now().toString(36),at:Date.now(),sign,what:$("#lwhat").value.trim(),conf:+$("#lconf").value,by:$("#lby").value,ver:null});tick();Store.save();toast("Logged");render(false,true);});
  $$("[data-v]",root).forEach(b=>b.addEventListener("click",()=>{const x=L.find(y=>y.id===b.dataset.v);if(x){x.ver=b.dataset.r;x.verAt=Date.now();Store.save();render(false,true);}}));
  $$("[data-undo]",root).forEach(b=>b.addEventListener("click",()=>{const x=L.find(y=>y.id===b.dataset.undo);if(x){x.ver=null;x.verAt=Date.now();Store.save();render(false,true);}}));
  /* delete keeps a tombstone (del + a newer verAt) so the entry does not come back from another device */
  $$("[data-del]",root).forEach(b=>b.addEventListener("click",()=>{if(!b.dataset.arm){b.dataset.arm=1;b.classList.add("bad");toast("Tap again to delete");return;}const x=L.find(y=>y.id===b.dataset.del);if(x){x.del=1;x.verAt=Date.now();Store.save();toast("Deleted");render(false,true);}}));
});
