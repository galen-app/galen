"use strict";
/* ================= LOCALISER: neuraxis picker + case trainer ================= */
/* Schematic neuraxis viewed from behind and above: image left = patient's LEFT. Each zone: [level, side, svg-shape-without-attrs] */
function nxZones(){
  const Z=[];const hemi=(s,x0,x1)=>{const w=x1-x0,o=s==="L"?0:1;
    const lat=s==="L"?x0:x1-34,med=s==="L"?x0+34:x0;const medW=w-34;
    Z.push(["frontal",s,`<rect x="${x0}" y="70" width="${w}" height="62" rx="14"/>`]);
    Z.push(["parietal",s,`<rect x="${med}" y="134" width="${medW}" height="62"/>`]);
    Z.push(["temporal",s,`<rect x="${lat}" y="134" width="34" height="78" rx="10"/>`]);
    Z.push(["occipital",s,`<rect x="${med}" y="198" width="${medW}" height="46" rx="12"/>`]);};
  hemi("L",56,172);hemi("R",188,304);
  /* deep structures (drawn over parietal) */
  Z.push(["basal","L",`<rect x="118" y="142" width="20" height="34" rx="6"/>`],["capsule","L",`<rect x="140" y="140" width="10" height="44" rx="3"/>`],["thalamus","L",`<ellipse cx="162" cy="170" rx="9" ry="13"/>`]);
  Z.push(["basal","R",`<rect x="222" y="142" width="20" height="34" rx="6"/>`],["capsule","R",`<rect x="210" y="140" width="10" height="44" rx="3"/>`],["thalamus","R",`<ellipse cx="198" cy="170" rx="9" ry="13"/>`]);
  /* visual pathway */
  Z.push(["optic","L",`<path d="M136 18 L174 56 L170 60 L132 22 Z"/>`],["optic","R",`<path d="M224 18 L186 56 L190 60 L228 22 Z"/>`],["chiasm","B",`<rect x="168" y="54" width="24" height="12" rx="5"/>`]);
  /* posterior fossa */
  Z.push(["cerebellum","L",`<ellipse cx="128" cy="304" rx="34" ry="26"/>`],["cerebellum","R",`<ellipse cx="232" cy="304" rx="34" ry="26"/>`]);
  [["midbrain",252,26],["pons",280,36],["medulla",318,30]].forEach(([l,y,h])=>{Z.push([l,"L",`<rect x="166" y="${y}" width="14" height="${h-2}" rx="4"/>`],[l,"R",`<rect x="180" y="${y}" width="14" height="${h-2}" rx="4"/>`]);});
  /* cord */
  [["ccord",350,70],["tcord",422,100]].forEach(([l,y,h])=>{Z.push([l,"L",`<rect x="170" y="${y}" width="10" height="${h-2}" rx="3"/>`],[l,"R",`<rect x="180" y="${y}" width="10" height="${h-2}" rx="3"/>`]);});
  Z.push(["conus","L",`<path d="M170 524 L180 524 L180 548 Z"/>`],["conus","R",`<path d="M180 524 L190 524 L180 548 Z"/>`]);
  Z.push(["cauda","L",`<path d="M162 550 L180 550 L178 612 L164 612 Z"/>`],["cauda","R",`<path d="M180 550 L198 550 L196 612 L182 612 Z"/>`]);
  /* peripheral columns */
  ["root","plexus","nerve","nmj","muscle"].forEach((l,i)=>{const y=360+i*48;Z.push([l,"L",`<rect x="18" y="${y}" width="108" height="40" rx="10"/>`],[l,"R",`<rect x="234" y="${y}" width="108" height="40" rx="10"/>`]);});
  return Z;
}
const NX_LABELS=`<text x="114" y="104" text-anchor="middle">Frontal</text><text x="246" y="104" text-anchor="middle">Frontal</text>
 <text x="104" y="226" text-anchor="middle">Occipital</text><text x="256" y="226" text-anchor="middle">Occipital</text>
 <text x="73" y="176" text-anchor="middle" transform="rotate(-90 73 176)">Temporal</text><text x="287" y="176" text-anchor="middle" transform="rotate(90 287 176)">Temporal</text>
 <text x="100" y="128" text-anchor="middle" class="sm">parietal ↓</text><text x="260" y="128" text-anchor="middle" class="sm">parietal ↓</text>
 <text x="128" y="190" text-anchor="middle" class="sm">BG</text><text x="232" y="190" text-anchor="middle" class="sm">BG</text><text x="145" y="194" text-anchor="middle" class="sm">IC</text><text x="215" y="194" text-anchor="middle" class="sm">IC</text><text x="162" y="194" text-anchor="middle" class="sm">Th</text><text x="198" y="194" text-anchor="middle" class="sm">Th</text>
 <text x="180" y="78" text-anchor="middle" class="sm">chiasm</text><text x="40" y="34" class="sm">optic nerve →</text>
 <text x="128" y="308" text-anchor="middle" class="sm">cerebellum</text><text x="232" y="308" text-anchor="middle" class="sm">cerebellum</text>
 <text x="200" y="266" class="sm">midbrain</text><text x="270" y="290" class="sm">pons</text><text x="270" y="338" class="sm">medulla</text><path d="M268 287 L196 294 M268 335 L196 334" stroke="var(--muted)" stroke-width=".8"/>
 <text x="196" y="388" class="sm">cervical cord</text><text x="196" y="474" class="sm">thoracic cord</text><text x="198" y="540" class="sm">conus</text><text x="202" y="584" class="sm">cauda equina</text>
 ${["Root","Plexus","Nerve","NMJ","Muscle"].map((t,i)=>`<text x="72" y="${385+i*48}" text-anchor="middle">${t}</text><text x="288" y="${385+i*48}" text-anchor="middle">${t}</text>`).join("")}
 <text x="72" y="632" text-anchor="middle" class="fb">Patient's LEFT</text><text x="288" y="632" text-anchor="middle" class="fb">Patient's RIGHT</text>`;
function neuraxis(opt={}){
  const Z=nxZones();
  const cls=(l,s)=>{const m=(p,sd)=>p&&p.lv===l&&(sd==="B"?true:sd===s||s==="B");
    let c="";if(m(opt.correct,opt.correct&&opt.correct.sd))c+=" ok";if(m(opt.pick,opt.pick&&opt.pick.sd))c+=" pk";return c;};
  return `<svg viewBox="0 0 360 640" class="nx${opt.interactive?" live":""}" role="img" aria-label="Neuraxis lesion picker">
   <circle cx="132" cy="14" r="9" class="eye"/><circle cx="228" cy="14" r="9" class="eye"/>
   ${Z.map(([l,s,sh])=>sh.replace(/^<(\w+)/,`<$1 data-lv="${l}" data-sd="${s}" class="z z-${LEVELS.find(x=>x[0]===l)[2]}${cls(l,s)}"`)).join("")}
   <g class="nxl">${NX_LABELS}</g></svg>`;
}
const LZ={q:null,i:0,shown:1,pick:null,bil:false,res:null};
function lzOrder(){const st=Store.s.loc||{};return [...shuf(LCASES.filter(c=>!st[c.id])),...LCASES.filter(c=>st[c.id]).sort((a,b)=>(st[a.id].best||0)-(st[b.id].best||0))].map(c=>c.id);}
route("practice:localiser","Localiser",(root,cid)=>{
  if(!Store.s.loc)Store.s.loc={};
  if(cid){LZ.q=[cid];LZ.i=0;LZ.shown=1;LZ.pick=null;LZ.res=null;}
  if(!LZ.q){root.innerHTML=lzHome();return;}
  drawLz(root);
});
function lzHome(){
  const st=Store.s.loc||{},done=LCASES.filter(c=>st[c.id]),mast=LCASES.filter(c=>st[c.id]&&st[c.id].best>=85).length;
  const avg=done.length?Math.round(done.reduce((a,c)=>a+st[c.id].last,0)/done.length):0;
  setTimeout(()=>{const b=$("#lzgo");if(b)b.onclick=()=>{LZ.q=lzOrder().slice(0,8);LZ.i=0;LZ.shown=1;LZ.pick=null;LZ.res=null;LZ.score=[];render(false);};},0);
  return `<section class="ph"><span class="eyebrow">Practice · neurology</span><h1>Localiser</h1><p class="lede">Read the story clue by clue and put the lesion on the neuraxis: level and side. Commit as early as you dare: fewer clues score more. Cases you miss come back first.</p>
   <div class="row-x"><button class="btn" id="lzgo">${ic("target")}Start 8 cases</button><button class="btn soft" data-go="learn/localise">The rules first</button></div></section>
   <div class="grid"><div class="tile"><b class="big">${mast}<small style="font-size:1rem">/${LCASES.length}</small></b><span class="sub">cases mastered (≥ 85)</span></div><div class="tile"><b class="big">${avg||"–"}</b><span class="sub">average last score</span></div></div>
   <div class="section"><span class="label">All cases</span><div class="list">${LCASES.map(c=>{const r=st[c.id];return `<button class="lrow" data-go="practice/localiser/${c.id}"><span class="dot${r&&r.best>=85?" on":""}"></span><span class="txt"><b>${esc(c.t)}</b><span>${r?`best ${r.best} · ${r.n} attempt${r.n>1?"s":""}`:"not tried"}</span></span>${ic("chev","chev")}</button>`;}).join("")}</div></div>`;
}
function lzEff(){if(LZ.pick)LZ.pick.sd=(LZ.bil||LZ.pick.raw==="B")?"B":LZ.pick.raw;}
function drawLz(root){
  root=root||V;const c=LCASES.find(x=>x.id===LZ.q[LZ.i]);if(!c){LZ.q=null;render(false);return;}
  const R=LZ.res;
  root.innerHTML=`<section class="ph"><div class="row-x"><span class="eyebrow">Case ${LZ.i+1} of ${LZ.q.length}</span>${R?`<span class="tag">${esc(c.t)}</span>`:""}</div>
    <ol class="clues">${c.c.slice(0,R?c.c.length:LZ.shown).map((x,i)=>`<li${i>=LZ.shown?' class="late"':""}>${esc(x)}</li>`).join("")}</ol>
    ${!R&&LZ.shown<c.c.length?`<button class="btn sm ghost" id="lzmore">Next clue (−5)</button>`:""}</section>
   <div class="nxwrap"><div class="card nxcard">${neuraxis({interactive:!R,pick:LZ.pick,correct:R?{lv:c.lv,sd:c.sd}:null})}</div>
    <div class="stack" style="gap:12px" id="lzside"></div></div>`;
  const side=$("#lzside");
  if(!R){
    side.innerHTML=`<div class="card stack" style="gap:10px"><span class="eyebrow">Your lesion</span><p id="lzpick" class="hook">${LZ.pick?`${esc(LEVEL_NAME[LZ.pick.lv])}, ${LZ.pick.sd==="B"?"bilateral / midline":LZ.pick.sd==="L"?"left":"right"}`:"Tap the neuraxis."}</p>
      <label class="row-x small"><input type="checkbox" id="lzbil" ${LZ.bil?"checked":""}> Bilateral or midline</label>
      <button class="btn" id="lzcommit" ${LZ.pick?"":"disabled"}>Commit</button></div>
      <div class="card"><div class="sec"><h3>Ask yourself</h3><p class="small">UMN or LMN? Cortical signs? Crossed? A sensory level? Which side is the face?</p></div></div>`;
    $(".nx",root).addEventListener("click",e=>{const z=e.target.closest("[data-lv]");if(!z)return;
      LZ.pick={lv:z.dataset.lv,raw:z.dataset.sd};lzEff();drawLz(root);});
    $("#lzbil").onchange=e=>{LZ.bil=e.target.checked;lzEff();drawLz(root);};
    const m=$("#lzmore");if(m)m.onclick=()=>{LZ.shown++;drawLz(root);};
    $("#lzcommit").onclick=()=>{
      const lvOk=LZ.pick.lv===c.lv||(c.acc||[]).includes(LZ.pick.lv),sdOk=LZ.pick.sd===c.sd;
      const sc=(lvOk?60:0)+(sdOk?25:0)+Math.max(0,15-5*(LZ.shown-1));
      LZ.res={lvOk,sdOk,sc};const st=Store.s.loc;const r=st[c.id]||{best:0,n:0};r.n++;r.last=sc;r.best=Math.max(r.best,sc);r.at=Date.now();st[c.id]=r;tick(1,"case");Store.s.xp=(Store.s.xp||0)+Math.round(sc/10);Store.save();
      (LZ.score||(LZ.score=[])).push(sc);drawLz(root);};
  }else{
    side.innerHTML=`<div class="card stack" style="gap:10px"><div class="${R.lvOk&&R.sdOk?"good":"bad"}-box">${R.sc} points · level ${R.lvOk?"✓":"✗"} · side ${R.sdOk?"✓":"✗"}</div>
      <p><b>You chose:</b> ${esc(LEVEL_NAME[LZ.pick.lv])}, ${LZ.pick.sd==="B"?"bilateral / midline":LZ.pick.sd==="L"?"left":"right"}.</p>
      <div class="sec"><h3>The lesion</h3><p>${esc(c.w)}</p></div><div class="sec"><h3>The reasoning</h3><p>${esc(c.y)}</p></div>
      <p class="small muted">Green = the lesion; orange outline = your pick.</p>
      <button class="btn" id="lznext">${LZ.i+1<LZ.q.length?"Next case":"Finish"}</button></div>`;
    $("#lznext").onclick=()=>{if(LZ.i+1<LZ.q.length){LZ.i++;LZ.shown=1;LZ.pick=null;LZ.res=null;LZ.bil=false;drawLz(root);window.scrollTo(0,0);}
      else{const s=LZ.score||[];LZ.q=null;LZ.score=[];toast(`Done: average ${s.length?Math.round(s.reduce((a,b)=>a+b,0)/s.length):0}`,"good");render(false);}};
  }
}
