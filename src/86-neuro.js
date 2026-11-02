"use strict";
/* ================= NEURO: dermatome / nerve map, localisation, cranial nerves ================= */
const DCOL={C:["#2f6fb5","#7fb2ea"],T:["#e26a1b","#f6b27a"],L:["#23874d","#7ccf9c"],S:["#7b4bb8","#c3a3ea"],V:["#b8901a","#ead27a"]};
function dcol(root){const g=root[0],i=DERM_ORDER.indexOf(root);return (DCOL[g]||DCOL.T)[i%2];}
const NCOL={ax:"#e8772e",lcnf:"#2f9a5c",mcnf:"#8a5cc4",mcna:"#b392e0",pcnf:"#6cc48e",pcna:"#f3a35f",median:"#3b82c4",ulnar:"#8a5cc4",radial:"#2f9a5c",lcnt:"#e8772e",femoral:"#3b82c4",obturator:"#c9a227",pcnt:"#8a5cc4",saphenous:"#2f9a5c",lccalf:"#c9a227",supper:"#e8772e",deeper:"#c2352b",sural:"#6aa7e0",tibial:"#b392e0"};
/* geometry */
function stripAt(strip,t){
  const y0=strip[0][0],y1=strip[strip.length-1][0],y=y0+(y1-y0)*t;
  for(let i=0;i<strip.length-1;i++){const a=strip[i],b=strip[i+1];if(y>=a[0]-1e-6&&y<=b[0]+1e-6){const u=b[0]===a[0]?0:(y-a[0])/(b[0]-a[0]);return [y,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];}}
  return strip[strip.length-1];
}
function stripPoly(strip,[t0,t1,s0,s1],mirror,ox){
  const pts=[],N=8,W=BODY.W;const X=x=>(mirror?W-x:x)+ox;
  for(let i=0;i<=N;i++){const [y,xl,xm]=stripAt(strip,t0+(t1-t0)*i/N);pts.push([X(xl+(xm-xl)*s0),y]);}
  for(let i=N;i>=0;i--){const [y,xl,xm]=stripAt(strip,t0+(t1-t0)*i/N);pts.push([X(xl+(xm-xl)*s1),y]);}
  return pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
}
function trunkPoly([y0,y1],ox){
  const T=BODY.trunk,pts=[],L=[],R=[];
  const at=y=>{for(let i=0;i<T.length-1;i++){const a=T[i],b=T[i+1];if(y>=a[0]&&y<=b[0]){const u=b[0]===a[0]?1:(y-a[0])/(b[0]-a[0]);return [a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];}}return [T[T.length-1][1],T[T.length-1][2]];};
  const ys=[y0];T.forEach(r=>{if(r[0]>y0&&r[0]<y1)ys.push(r[0]);});ys.push(y1);
  /* where the trunk widens abruptly (neck→shoulders), split the step */
  ys.forEach(y=>{const [l,r]=at(y);L.push([l+ox,y]);R.push([r+ox,y]);});
  return [...L,...R.reverse()].map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
}
function headBand([y0,y1],ox){
  const h=BODY.head,pts=[];
  const xAt=y=>h.rx*Math.sqrt(Math.max(0,1-Math.pow((y-h.cy)/h.ry,2)));
  for(let i=0;i<=10;i++){const y=y0+(y1-y0)*i/10;pts.push([h.cx-xAt(y)+ox,y]);}
  for(let i=10;i>=0;i--){const y=y0+(y1-y0)*i/10;pts.push([h.cx+xAt(y)+ox,y]);}
  return pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
}
const PARTS=["arm","hand","thigh","leg","foot"];
function silhouette(ox){
  const B=BODY,h=B.head;let s=`<ellipse cx="${h.cx+ox}" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}"/>`;
  s+=`<polygon points="${trunkPoly([52,262],ox)}"/>`;
  PARTS.forEach(p=>[false,true].forEach(m=>{s+=`<polygon points="${stripPoly(B[p],[0,1,0,1],m,ox)}"/>`;}));
  return s;
}
function regionPolys(list,view,ox,colFn,kind){
  let out="";
  list.forEach(([id,sides,part,box])=>{
    if(!sides.includes(view))return;
    const col=colFn(id);const attr=`data-${kind}="${id}" fill="${col}"`;
    if(part==="head")out+=`<polygon ${attr} points="${headBand(box,ox)}"/>`;
    else if(part==="trunk")out+=`<polygon ${attr} points="${trunkPoly(box,ox)}"/>`;
    else [false,true].forEach(m=>{out+=`<polygon ${attr} points="${stripPoly(BODY[part],box,m,ox)}"/>`;});
  });
  return out;
}
function keyPtXY(k,ox){
  const [r,v,part,a,b]=k,W=BODY.W;
  if(part==="trunk")return [[W/2-b+ox,a],[W/2+b+ox,a]];
  if(part==="pt")return b===110?[[b+ox,a]]:[[b+ox,a],[W-b+ox,a]];
  if(part==="headpt")return [[W/2-b+ox,a],[W/2+b+ox,a]];
  const [y,xl,xm]=stripAt(BODY[part],a),x=xl+(xm-xl)*b;return [[x+ox,y],[W-x+ox,y]];
}
function bodyMap(mode,opt={}){
  const OXB=240,views=[["f",0,"Front"],["b",OXB,"Back"]];
  let reg="";
  views.forEach(([v,ox])=>{
    reg+=`<g class="sil">${silhouette(ox)}</g>`;
    if(mode==="derm"){
      reg+=`<g class="regs">${regionPolys(DERM,v,ox,dcol,"r")}`;
      DERM_EXTRA.forEach(([id,vv,cs])=>{if(vv===v)cs.forEach(([x,y,r])=>{reg+=`<circle data-r="${id}" fill="${dcol(id)}" cx="${x+ox}" cy="${y}" r="${r}"/>`;if(x!==110)reg+=`<circle data-r="${id}" fill="${dcol(id)}" cx="${BODY.W-x+ox}" cy="${y}" r="${r}"/>`;});});
      reg+=`</g>`;
    }else reg+=`<g class="regs">${regionPolys(NERVES,v,ox,k=>NCOL[k],"n")}</g>`;
    reg+=`<g class="outl">${silhouette(ox)}</g>`;
  });
  let pts="";
  if(mode==="derm"&&!opt.hidePts)KEYPTS.forEach(k=>keyPtXY(k,k[1]==="f"?0:OXB).forEach(([x,y])=>{pts+=`<circle class="kp" data-r="${k[0]}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2"/>`;}));
  const lab=`<text x="110" y="466" text-anchor="middle" class="fl fb">Front · palms forward</text><text x="350" y="466" text-anchor="middle" class="fl fb">Back</text>`;
  return `<svg viewBox="0 0 460 470" class="bodymap" role="img" aria-label="${mode==="derm"?"Dermatome":"Peripheral nerve"} map">${reg}${pts}${lab}</svg>`;
}
const NM={mode:"derm",sel:null,quiz:null};
route("learn:neuromap","Dermatomes",(root,mode)=>{
  NM.mode=mode||NM.mode;
  root.innerHTML=`<section class="ph"><span class="eyebrow">Neurology · sensory map</span><h1>Dermatomes and nerves</h1>
   <p class="lede">Tap any area. Dots are the 28 ISNCSCI key sensory points: the standard places to test each root. Real dermatomes vary and overlap, so test the key points rather than the edges.</p></section>
   <div class="row-x"><div class="seg" id="nmseg"><button data-m="derm" aria-pressed="${NM.mode==="derm"}">Dermatomes</button><button data-m="nerve" aria-pressed="${NM.mode==="nerve"}">Peripheral nerves</button></div>
    <button class="btn sm soft" id="nmquiz">${ic("target")}Quiz me</button></div>
   <div class="nmwrap"><div class="card nmfig" id="nmfig">${bodyMap(NM.mode)}</div><div class="card stack" id="nminfo" style="gap:10px"></div></div>
   <div class="section"><span class="label">${NM.mode==="derm"?"All roots":"All nerves"}</span><div class="chips" id="nmchips">${(NM.mode==="derm"?DERM_ORDER:Object.keys(NERVE_INFO)).map(k=>`<button class="chip" data-k="${k}">${NM.mode==="derm"?k:esc(NERVE_INFO[k].n.split(" (")[0])}</button>`).join("")}</div></div>
   <div class="row-x"><button class="btn sm ghost" data-go="learn/myotomes">Myotomes and reflexes</button><button class="btn sm ghost" data-go="learn/rootnerve">Root or nerve?</button><button class="btn sm ghost" data-go="learn/localise">Where is the lesion?</button></div>`;
  $$("#nmseg [data-m]").forEach(b=>b.addEventListener("click",()=>{NM.mode=b.dataset.m;NM.sel=null;NM.quiz=null;replace("neuromap",NM.mode);}));
  const fig=$("#nmfig"),info=$("#nminfo");
  const show=k=>{if(k&&!(NM.mode==="derm"?DERM_INFO[k]:NERVE_INFO[k]))k=null;NM.sel=k;
    $$("[data-r],[data-n]",fig).forEach(e=>e.classList.toggle("hi",(e.dataset.r||e.dataset.n)===k));
    fig.classList.toggle("focus",!!k);
    $$("#nmchips .chip").forEach(c=>c.classList.toggle("on",c.dataset.k===k));
    if(!k){info.innerHTML=`<p class="muted">Tap an area or a dot on the body, or choose below.</p>${NM.mode==="derm"?`<div class="note"><b>Remember:</b> anteriorly C4 meets T2 at the 2nd rib, because C5–T1 have moved into the arm. Nipple T4, xiphoid T6, umbilicus T10, groin L1.</div>`:`<div class="note"><b>Root or nerve?</b> A root gives a band that runs the length of the limb; a nerve gives a patch with a sharp edge, often splitting a finger (ulnar splits the ring finger).</div>`}`;return;}
    if(NM.mode==="derm"){const d=DERM_INFO[k]||{n:k};const myo=MYO.find(m=>m[0]===k);      info.innerHTML=`<span class="eyebrow" style="color:${dcol(k)}">Dermatome</span><h2>${esc(d.n)}</h2><p>${esc(d.d||"")}</p>${d.k?`<dl class="kv"><dt>Key point</dt><dd>${esc(d.k)}</dd></dl>`:""}${myo?`<dl class="kv"><dt>Key muscle</dt><dd>${esc(myo[1])}</dd><dt>Reflex</dt><dd>${esc(myo[3])}</dd></dl>`:""}${d.w?`<div class="note">${esc(d.w)}</div>`:""}`;}
    else{const d=NERVE_INFO[k];info.innerHTML=`<span class="eyebrow" style="color:${NCOL[k]}">Cutaneous nerve</span><h2>${esc(d.n)}</h2><p>${esc(d.d)}</p>${d.w?`<div class="note">${esc(d.w)}</div>`:""}`;}
  };
  /* quiz: ask for a root/nerve; user taps */
  const ask=()=>{const pool=NM.mode==="derm"?DERM_ORDER.filter(k=>!k.startsWith("V")):Object.keys(NERVE_INFO);
    let k;do{k=pick(pool);}while(NM.quiz&&k===NM.quiz.k&&pool.length>1);
    NM.quiz={k,tries:0,score:NM.quiz?NM.quiz.score:0,n:NM.quiz?NM.quiz.n:0};show(null);
    info.innerHTML=`<span class="eyebrow">Quiz · ${NM.quiz.score}/${NM.quiz.n}</span><h2>Tap ${NM.mode==="derm"?`the ${esc(k)} dermatome`:`the territory of the ${esc(NERVE_INFO[k].n.split(" (")[0])}`}</h2><p class="muted small">Either side, front or back.</p><button class="btn sm ghost" id="qstop">Stop quiz</button>`;
    $("#qstop").onclick=()=>{NM.quiz=null;show(null);};
  };
  fig.addEventListener("click",e=>{const t=e.target.closest("[data-r],[data-n]");const k=t?(t.dataset.r||t.dataset.n):null;
    if(NM.quiz){if(!k)return;const Q=NM.quiz;Q.n++;const ok=k===Q.k;if(ok)Q.score++;show(Q.k);
      info.insertAdjacentHTML("afterbegin",`<div class="${ok?"good":"bad"}-box">${ok?"Correct.":`You tapped ${esc(NM.mode==="derm"?k:NERVE_INFO[k].n.split(" (")[0])}.`} Score ${Q.score}/${Q.n}</div>`);
      info.insertAdjacentHTML("beforeend",`<div class="row-x"><button class="btn sm" id="qnext">Next</button><button class="btn sm ghost" id="qstop2">Stop</button></div>`);
      $("#qnext").onclick=ask;$("#qstop2").onclick=()=>{NM.quiz=null;show(null);};tick(1,"eye");Store.save();return;}
    show(k===NM.sel?null:k);});
  $("#nmchips").addEventListener("click",e=>{const b=e.target.closest("[data-k]");if(b&&!NM.quiz)show(b.dataset.k);});
  $("#nmquiz").addEventListener("click",ask);
  show(NM.sel);
});
route("learn:myotomes","Myotomes",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Neurology · motor</span><h1>Myotomes and reflexes</h1><p class="lede">The ISNCSCI key muscles test one root each, graded 0–5. Pair each root with its dermatome key point and its reflex: three independent checks of the same segment.</p></section>
   <div class="card stack" style="gap:12px"><span class="eyebrow">Key muscles</span>${MYO.map(([r,m,o,x])=>`<div class="lm"><b><span class="rootdot" style="background:${dcol(r==="S2–4"?"S2":r)}"></span>${r} · ${esc(m)}</b><span>${esc(o)}</span><span><i>Reflex:</i> ${esc(x)}</span></div>`).join("")}</div>
   <div class="card stack" style="gap:12px"><span class="eyebrow">Reflexes</span>${REFLEX.map(([n,r,h,t])=>`<div class="lm"><b>${esc(n)} <span class="tag">${r}</span></b><span><i>How:</i> ${esc(h)}</span><span><i>Think:</i> ${esc(t)}</span></div>`).join("")}</div>
   <div class="card"><div class="sec"><h3>Grading power (MRC)</h3><p>0 none · 1 flicker · 2 moves with gravity eliminated · 3 against gravity · 4 against some resistance · 5 normal. Most real change happens within grade 4, so describe it ("4−, gives way at the end of range") and compare sides.</p></div>
   <div class="sec"><h3>Grading reflexes</h3><p>0 absent · 1+ reduced, or only with reinforcement (Jendrassik: clench teeth, pull hands apart) · 2+ normal · 3+ brisk · 4+ with clonus. Never call a reflex absent until you have tried reinforcement.</p></div></div>
   <div class="card"><div class="sec"><h3>Counting rhyme</h3><p><b>S1–2</b> buckle my shoe (ankle jerk) · <b>L3–4</b> kick the door (knee jerk) · <b>C5–6</b> pick up sticks (biceps, brachioradialis) · <b>C7–8</b> lay them straight (triceps, finger jerk).</p></div></div>`;
});
route("learn:rootnerve","Root or nerve?",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Neurology · localisation</span><h1>Root or nerve?</h1><p class="lede">The commonest localisation question at the bedside. Each has one or two muscles or skin areas that settle it in a minute.</p></section>
   ${ROOTNERVE.map(r=>`<details class="acc"><summary><span class="st"><b>${esc(r.q)}</b><span>${esc(r.a)} vs ${esc(r.b)}</span></span></summary><div class="acc-body"><div><span class="k">The deciding test</span>${esc(r.key)}</div><div><span class="k">Also consider</span>${esc(r.also)}</div></div></details>`).join("")}
   <button class="btn sm ghost" data-go="learn/neuromap/nerve">See the nerve territories</button>`;
});
route("learn:localise","Localisation",(root,tab)=>{
  tab=tab||"rules";
  root.innerHTML=`<section class="ph"><span class="eyebrow">Neurology · the first question</span><h1>Where is the lesion?</h1><p class="lede">Ask where before what. Work down the neuraxis with a handful of rules, then test yourself in the Localiser.</p>
   <div class="row-x"><button class="btn sm" data-go="practice/localiser">${ic("target")}Localiser cases</button><button class="btn sm ghost" data-go="learn/neuromap">Dermatome map</button></div></section>
   <div class="tabs" role="tablist">${[["rules","Rules"],["levels","Levels"],["vessels","Vessels"],["stem","Brainstem"],["cord","Cord"],["gait","Gait"]].map(([k,l])=>`<button role="tab" aria-selected="${k===tab}" data-t="${k}">${l}</button>`).join("")}</div><div id="lb" class="stack" style="gap:14px"></div>`;
  $$(".tabs [data-t]",root).forEach(b=>b.addEventListener("click",()=>replace("localise",b.dataset.t)));
  const B=$("#lb"),lm=(L,k1="")=>L.map(([l,s,x])=>`<div class="lm"><b>${esc(l)}</b><span>${esc(s)}</span>${x?`<span><i>${k1}</i> ${esc(x)}</span>`:""}</div>`).join("");
  if(tab==="rules")B.innerHTML=`<div class="stack" style="gap:8px">${LOC_RULES.map(([t,d],i)=>`<details class="acc"${i<4?" open":""}><summary><span class="n">${pad2(i+1)}</span><span class="st"><b>${esc(t)}</b><span>${esc(d.split(/(?<=\.)\s/)[0])}</span></span></summary><div class="acc-body"><div>${esc(d)}</div></div></details>`).join("")}</div>${fig("homunculus")}`;
  else if(tab==="levels")B.innerHTML=`<div class="card stack" style="gap:12px">${lm(LOCALISE,"Clues:")}</div>`;
  else if(tab==="vessels")B.innerHTML=`${fig("vasc-territories")}<div class="card stack" style="gap:12px">${VASC.map(([v,d])=>`<div class="lm"><b>${esc(v)}</b><span>${esc(d)}</span></div>`).join("")}</div>`;
  else if(tab==="stem")B.innerHTML=`${fig("cn-brainstem")}${fig("medulla-x")}<div class="card stack" style="gap:12px">${BRAINSTEM.map(([n,w,f,c])=>`<div class="lm"><b>${esc(n)}</b><span><i>Where:</i> ${esc(w)}</span><span>${esc(f)}</span><span><i>Cause:</i> ${esc(c)}</span></div>`).join("")}</div>`;
  else if(tab==="cord")B.innerHTML=`${fig("cord")}<div class="card stack" style="gap:12px">${lm(CORDSYN,"Context:")}</div>`;
  else B.innerHTML=`<div class="card stack" style="gap:12px">${lm(GAITS,"Think:")}</div>`;
});
route("learn:cranial","Cranial nerves",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Neurology · head</span><h1>Cranial nerves</h1><p class="lede">A 3-minute screen: acuity and fields, pupils, eye movements (an H), face sensation and power, whisper, palate, tongue, shrug. Every nerve below has one finding that changes management.</p></section>
   ${fig("cn-brainstem")}
   ${CRANIAL.map(([n,name,how,find,pearl])=>`<details class="acc"><summary><span class="n">${n}</span><span class="st"><b>${esc(name)}</b><span>${esc(how)}</span></span></summary><div class="acc-body"><div><span class="k">Finding that matters</span>${esc(find)}</div><div><span class="k">Pearl</span>${esc(pearl)}</div></div></details>`).join("")}
   <div class="card"><div class="sec"><h3>Remember the order and type</h3><p><b>Names:</b> "Oh Oh Oh To Touch And Feel Very Good Velvet, Such Heaven" (olfactory, optic, oculomotor, trochlear, trigeminal, abducens, facial, vestibulocochlear, glossopharyngeal, vagus, spinal accessory, hypoglossal). <b>Sensory, motor or both:</b> "Some Say Marry Money But My Brother Says Big Brains Matter More". <b>Eye muscles:</b> LR6 SO4, the rest 3.</p></div></div>
   ${fig("pupil")}${fig("visual-pathway")}${fig("facial")}`;
});
