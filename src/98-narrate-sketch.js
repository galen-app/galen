"use strict";
/* ================= NARRATED ROUTINE (voice) + SKETCH FROM MEMORY ================= */
const NR={sys:null,i:0,playing:false,pace:25,timer:null,voice:null};
const speechOK=()=>"speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
function say(text,onend){
  if(!speechOK()){onend&&onend();return;}
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=0.98;u.pitch=1;u.lang="en-GB";
    const vs=speechSynthesis.getVoices();const v=vs.find(x=>/en-GB/i.test(x.lang)&&/female|Google UK English Female|Serena|Kate/i.test(x.name))||vs.find(x=>/en-GB/i.test(x.lang))||vs.find(x=>/^en/i.test(x.lang));if(v)u.voice=v;
    u.onend=()=>onend&&onend();u.onerror=()=>onend&&onend();speechSynthesis.speak(u);}catch(e){onend&&onend();}
}
const nrSteps=sys=>{const m=SYSTEMS.find(x=>x.id===sys);return m?m.seq.map(st=>({t:st.t,how:st.how,why:st.why})):[];};
route("tools:narrate","Narrated routine",(root,sys)=>{
  if(sys)NR.sys=sys;
  if(!NR.sys){root.innerHTML=`<section class="ph"><span class="eyebrow">Narrated routine</span><h1>Examine while Galen talks</h1><p class="lede">Pick a system. Galen reads each step aloud, in order, with its one-line reason, and waits the time you set. Put the phone on the bedside table and examine a willing friend, a mannequin, or yourself in the mirror.</p>${speechOK()?"":`<div class="note">This browser has no speech voices; the routine will run as a silent timed prompter.</div>`}</section>
     <div class="list">${SYSTEMS.map(m=>`<button class="lrow" data-go="tools/narrate/${m.id}"><span class="icwrap">${m.icon}</span><span class="txt"><b>${esc(m.name)}</b><span>${m.seq.length} steps · about ${Math.round(m.seq.length*NR.pace/60)} min at ${NR.pace} s a step</span></span>${ic("chev","chev")}</button>`).join("")}</div>`;return;}
  const steps=nrSteps(NR.sys),m=SYSTEMS.find(x=>x.id===NR.sys);
  const draw=()=>{const st=steps[NR.i];
    root.innerHTML=`<section class="ph"><div class="row-x"><span class="eyebrow">${esc(m.short)} · step ${NR.i+1} of ${steps.length}</span><span class="tag">${NR.pace} s</span></div><h1>${esc(st.t)}</h1><p class="lede">${esc(st.how)}</p><p class="small muted"><b>Why:</b> ${esc(st.why)}</p></section>
     <div class="meter"><i style="width:${Math.round(NR.i/steps.length*100)}%"></i></div>
     <div class="card stack" style="gap:12px"><div class="row-x"><button class="btn" id="nr-play">${NR.playing?"Pause":(NR.i?"Resume":"Start")}</button><button class="btn soft" id="nr-rep">Say it again</button><button class="btn ghost" id="nr-prev" ${NR.i?"":"disabled"}>Back</button><button class="btn ghost" id="nr-next">${NR.i+1<steps.length?"Next step":"Finish"}</button></div>
      <div class="fld"><span>Seconds per step · <b id="nr-v">${NR.pace}</b></span><input type="range" class="rng" id="nr-pace" min="10" max="90" step="5" value="${NR.pace}"></div>
      <p class="small muted">Tap anywhere on the step title to advance. Steps that need a stethoscope have their sounds in the module.</p></div>
     <div class="list">${steps.map((s,i)=>`<button class="lrow${i===NR.i?" on":""}" data-i="${i}"><span class="dot${i<NR.i?" on":""}"></span><span class="txt"><b>${esc(s.t)}</b></span></button>`).join("")}</div>`;
    $("#nr-play").addEventListener("click",()=>{NR.playing?pause():play();});
    $("#nr-rep").addEventListener("click",()=>speak());
    $("#nr-prev").addEventListener("click",()=>{NR.i=Math.max(0,NR.i-1);draw();if(NR.playing)speak();});
    $("#nr-next").addEventListener("click",()=>advance(true));
    $("#nr-pace").addEventListener("input",e=>{NR.pace=+e.target.value;$("#nr-v").textContent=NR.pace;});
    $$("[data-i]",root).forEach(b=>b.addEventListener("click",()=>{NR.i=+b.dataset.i;draw();if(NR.playing)speak();}));
    $("h1",root).addEventListener("click",()=>advance(true));};
  const speak=()=>{const st=steps[NR.i];clearTimeout(NR.timer);say(`Step ${NR.i+1}. ${st.t}. ${st.how}`,()=>{if(NR.playing)NR.timer=setTimeout(()=>advance(false),NR.pace*1000);});};
  const play=()=>{NR.playing=true;draw();speak();};
  const pause=()=>{NR.playing=false;clearTimeout(NR.timer);try{speechSynthesis.cancel();}catch(e){}draw();};
  const advance=(manual)=>{clearTimeout(NR.timer);if(NR.i+1<steps.length){NR.i++;draw();if(NR.playing||manual&&NR.playing)speak();}else{NR.playing=false;try{speechSynthesis.cancel();}catch(e){}const r=Store.s.rehearse[NR.sys]||{best:0};Store.s.notes["narrate:"+NR.sys]={t:Date.now()};Store.s.xp=(Store.s.xp||0)+5;tick(2,"hands");Store.save();say("Routine complete. Well done.");toast("Routine complete","good");NR.i=0;NR.sys=null;open("tools","narrate");}};
  draw();
});
/* ---- sketch from memory ---- */
const Sketch={open(figId,title){
  const f=FIG[figId];if(!f)return;
  const d=document.createElement("div");d.className="lb";d.innerHTML=`<div class="lb-in sk-in"><button class="iconbtn lb-x" aria-label="Close">${ic("close")}</button><div class="lb-meta"><b>Draw it from memory: ${esc(title||f.t)}</b><p class="small muted">Sketch the structure or the manoeuvre, then reveal Galen's figure underneath and compare. Drawing it is dual coding: the picture and the words become two routes to the same memory.</p></div>
    <div class="sk-wrap"><canvas class="sk-c" width="960" height="600"></canvas><div class="sk-fig" hidden>${fig(figId,{nocap:true})}</div></div>
    <div class="lb-meta"><div class="row-x"><button class="btn sm" data-a="reveal">Reveal</button><button class="btn sm ghost" data-a="clear">Clear</button><span class="spacer"></span><button class="btn sm soft" data-a="done">I compared it</button></div></div></div>`;
  document.body.append(d);document.body.style.overflow="hidden";
  const c=$(".sk-c",d),ctx=c.getContext("2d");ctx.lineWidth=4;ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#ee6a1c";
  let drawing=false;const pos=e=>{const r=c.getBoundingClientRect();return [(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height];};
  c.addEventListener("pointerdown",e=>{drawing=true;c.setPointerCapture(e.pointerId);const [x,y]=pos(e);ctx.beginPath();ctx.moveTo(x,y);});
  c.addEventListener("pointermove",e=>{if(!drawing)return;const [x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke();});
  c.addEventListener("pointerup",()=>{drawing=false;});c.addEventListener("pointercancel",()=>{drawing=false;});
  const close=()=>{d.remove();document.body.style.overflow="";};
  d.addEventListener("click",e=>{if(e.target===d||e.target.closest(".lb-x"))close();const b=e.target.closest("[data-a]");if(!b)return;
    if(b.dataset.a==="reveal"){const fg=$(".sk-fig",d);fg.hidden=!fg.hidden;b.textContent=fg.hidden?"Reveal":"Hide figure";}
    else if(b.dataset.a==="clear")ctx.clearRect(0,0,c.width,c.height);
    else if(b.dataset.a==="done"){Store.s.notes["sketch:"+figId]={t:Date.now()};Store.s.xp=(Store.s.xp||0)+3;tick(1,"hands");Store.save();toast("Sketched: +3 XP","good");close();}});
}};
document.addEventListener("click",e=>{const b=e.target.closest("[data-sketch]");if(b){e.preventDefault();Sketch.open(b.dataset.sketch,b.dataset.title);}});
