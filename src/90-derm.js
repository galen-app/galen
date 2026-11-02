"use strict";
/* ================= DERMATOLOGY VIEWS ================= */
DCOND.forEach(c=>{if(c.p)PLATE_SPECS["c:"+c.id]=Object.assign({seed:c.id.length*37+c.id.charCodeAt(0)},c.p);});
const DPLATED=()=>DCOND.filter(c=>c.p&&c.d);
DVOCAB.forEach((v,i)=>{if(v[4])PLATE_SPECS["v:"+i]=Object.assign({seed:i*11+5},v[4]);});
DSHAPES.forEach((v,i)=>{if(v[3])PLATE_SPECS["s:"+i]=Object.assign({seed:i*17+3},v[3]);});
const DGROUPS=[...new Set(DCOND.map(c=>c.g))];
const dTone=()=>{const t=Store.s.settings.tone;return t==null?1:t;};
function toneBar(id){return `<div class="tonebar" id="${id}" role="group" aria-label="Skin tone">${TONE_NAME.map((n,i)=>`<button data-tone="${i}" aria-pressed="${dTone()===i}" title="Fitzpatrick ${n}" style="--tc:${rgba(TONES[i])}"><span></span>${n}</button>`).join("")}</div>`;}
function bindTone(root,id,after){const b=$("#"+id,root);if(!b)return;b.addEventListener("click",e=>{const t=e.target.closest("[data-tone]");if(!t)return;Store.s.settings.tone=+t.dataset.tone;Store.save();
  $$("[data-tone]",b).forEach(x=>x.setAttribute("aria-pressed",x===t));$$("canvas.plate.follow",root).forEach(c=>{c.dataset.tone=t.dataset.tone;delete c.dataset.done;});renderPlates(root);after&&after();});}
const fol=(id,opt={})=>plateHTML(id,dTone(),opt).replace('class="plate','class="plate follow');
/* distribution figure: body silhouettes with highlighted regions */
function distMap(key){
  const D=DDIST[key];if(!D)return "";
  let s="";[["f",0],["b",240]].forEach(([v,ox])=>{s+=`<g class="sil">${silhouette(ox)}</g><g class="dreg">`;
    D.R.forEach(([vv,part,box])=>{if(vv!==v)return;
      if(part==="head")s+=`<polygon points="${headBand(box,ox)}"/>`;
      else if(part==="trunk"){if(D.half){const W=BODY.W;s+=`<polygon points="${trunkPoly(box,ox)}" clip-path="url(#halfL${ox})"/>`;}else s+=`<polygon points="${trunkPoly(box,ox)}"/>`;}
      else [false,true].forEach(m=>{s+=`<polygon points="${stripPoly(BODY[part],box,m,ox)}"/>`;});});
    s+=`</g><g class="outl">${silhouette(ox)}</g>`;});
  return `<figure class="fig small dmap"><svg viewBox="0 0 460 470" role="img" aria-label="Distribution: ${esc(D.n)}"><defs><clipPath id="halfL0"><rect x="0" y="0" width="110" height="470"/></clipPath><clipPath id="halfL240"><rect x="350" y="0" width="110" height="470"/></clipPath></defs>${s}
    <text x="110" y="466" text-anchor="middle" class="fl fb">Front</text><text x="350" y="466" text-anchor="middle" class="fl fb">Back</text></svg>
    <figcaption><b>${esc(D.n)}.</b> ${esc(D.d)} <span class="muted">Think: ${esc(D.think)}</span></figcaption></figure>`;
}
const PHOTO_LINKS=c=>[["DermNet",`https://dermnetnz.org/topics/${c.slug}`],["Skin Deep (skin of colour)",`https://dftbskindeep.com/?s=${encodeURIComponent(c.n.split(" (")[0])}`],["Wikimedia Commons",`https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(c.n.split(" (")[0])}&title=Special:MediaSearch&type=image`]];
/* ---------- atlas ---------- */
const DAF={g:"all"};
function dermAtlasHTML(){
  return `${toneBar("atone")}<p class="small muted">Plates are drawn by the app (40 px = 1 cm), not photographs. Switch skin tone to see how each lesion changes on Fitzpatrick types I–VI; each condition links to real photo atlases.</p>
   <div class="chips" id="dag">${[["all","All"],...DGROUPS.map(g=>[g,g])].map(([k,l])=>`<button class="chip${DAF.g===k?" on":""}" data-g="${k}">${l}</button>`).join("")}</div>
   <div class="datlas">${DCOND.filter(c=>DAF.g==="all"||c.g===DAF.g).map(c=>{const pin=Img.pinsOf("d:"+c.id)[0];return `<button class="dtile" data-go="learn/dcond/${c.id}">${c.p?fol("c:"+c.id,{small:true,label:c.n}):pin?`<img class="dtile-ph" loading="lazy" src="${esc(pin.thumb)}" alt="">`:`<div class="dtile-ph ph-txt">${esc(c.n.slice(0,1))}</div>`}<b>${esc(c.n)}</b><span>${esc(c.g)}${c.p?"":" · photos"}</span></button>`;}).join("")}</div>`;
}
function bindAtlas(root,redraw){bindTone(root,"atone");const g=$("#dag",root);if(g)g.addEventListener("click",e=>{const b=e.target.closest("[data-g]");if(!b)return;DAF.g=b.dataset.g;redraw();});renderPlates(root);}
route("learn:datlas","Skin atlas",(root)=>{const draw=()=>{root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology</span><h1>Skin atlas</h1><p class="lede">${DCOND.length} conditions: ${DPLATED().length} drawn on six skin tones, all with a model description, the features that clinch it, look-alikes, a note on brown and black skin, and live photographs.</p>
  <div class="row-x"><button class="btn sm" data-go="practice/describe">${ic("target")}Describe it (practice)</button><button class="btn sm ghost" data-go="learn/dmorph">Morphology</button><button class="btn sm ghost" data-go="learn/describe">How to describe</button></div></section>${dermAtlasHTML()}`;bindAtlas(root,draw);};draw();});
route("learn:dcond",(id)=>(DCOND.find(c=>c.id===id)||{}).n||"Condition",(root,id)=>{
  const c=DCOND.find(x=>x.id===id);if(!c)throw new Error("Condition not found");
  const d=c.d,row=(k,v)=>v?`<dt>${k}</dt><dd>${esc(Array.isArray(v)?v.join(", "):v)}</dd>`:"";
  root.innerHTML=`<section class="ph"><div class="row-x"><span class="tag">${esc(c.g)}</span><span class="tag">Dermatology</span></div><h1>${esc(c.n)}</h1></section>
   ${c.p?`<div class="card dplate">${fol("c:"+c.id,{label:c.n})}${toneBar("ctone")}</div>`:""}
   ${Img.galleryHTML("d:"+c.id,imgTermsFor(c.id),{title:c.n,links:PHOTO_LINKS(c)})}
   <div class="card stack" style="gap:10px"><span class="eyebrow">Say it like this</span><p class="hook">${esc(c.m)}</p>
    ${d?`<dl class="kv">${row("Primary lesion",d.prim)}${row("Colour",d.col)}${row("Shape",d.shape)}${row("Border",d.border)}${row("Surface",d.surf)}${row("Arrangement",d.arr)}${row("Distribution",DDIST[d.dist]?DDIST[d.dist].n:d.dist)}</dl>`:""}</div>
   <div class="card stack" style="gap:14px"><div class="sec"><h3>Clinches it</h3><ul class="prose" style="padding-left:1.1em">${c.key.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="sec"><h3>Look-alikes</h3><ul class="prose" style="padding-left:1.1em">${c.dd.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="sec"><h3>On brown and black skin</h3><p>${esc(c.soc)}</p></div>
    ${c.act?`<div class="sec"><h3>What to do</h3><p>${esc(c.act)}</p></div>`:""}</div>
   ${d?distMap(d.dist):""}
   ${c.p?`<div class="card stack" style="gap:8px"><span class="eyebrow">Same lesion, six skin tones</span><div class="tonestrip">${[0,1,2,3,4,5].map(t=>`<figure>${plateHTML("c:"+c.id,t,{small:true,label:c.n+" on type "+TONE_NAME[t]})}<figcaption>Type ${TONE_NAME[t]}</figcaption></figure>`).join("")}</div></div>`:""}
   ${memoryBlock("d:"+c.id)}
   <div class="row-x">${c.p&&d?`<button class="btn sm" data-go="practice/describe/${c.id}">${ic("target")}Describe this one</button>`:""}<button class="btn sm ghost" data-go="practice/spot">Spot diagnosis</button></div>`;
  if(c.p)bindTone(root,"ctone");renderPlates(root);Img.bindGalleries(root);
  if(!Store.s.dseen)Store.s.dseen=[];if(!Store.s.dseen.includes(id)){Store.s.dseen.push(id);Store.save();}
});
/* ---------- morphology ---------- */
route("learn:dmorph","Morphology",(root)=>{
  const sec=(title,list)=>`<section class="section"><span class="label">${title}</span><div class="dvocab">${list}</div></section>`;
  root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology · vocabulary</span><h1>The words of the skin</h1><p class="lede">Learn each term with its picture and its size rule. Most descriptions need only a dozen words used precisely.</p>${toneBar("mtone")}</section>
   ${sec("Primary lesions",DVOCAB.filter(v=>v[1]==="primary").map(v=>vcard(v,DVOCAB.indexOf(v))).join(""))}
   ${sec("Secondary changes",DVOCAB.filter(v=>v[1]==="secondary").map(v=>vcard(v,DVOCAB.indexOf(v))).join(""))}
   ${sec("Shape and arrangement",DSHAPES.map((s,i)=>`<div class="vcard">${s[3]?fol("s:"+i,{small:true,label:s[0]}):""}<b>${esc(s[0])}</b><span>${esc(s[1])}</span><span class="small muted">${esc(s[2])}</span></div>`).join(""))}
   <section class="section"><span class="label">Colour</span><div class="card stack" style="gap:10px">${DCOLOURS.map(([t,d])=>`<div class="lm"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div></section>
   <section class="section"><span class="label">Touch and bedside signs</span><div class="card stack" style="gap:10px">${DPALP.map(([t,d])=>`<div class="lm"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div></section>
   <section class="section"><span class="label">Distribution</span><div class="dists">${Object.keys(DDIST).map(distMap).join("")}</div></section>`;
  bindTone(root,"mtone");renderPlates(root);
});
function vcard(v,i){return `<div class="vcard">${v[4]?fol("v:"+i,{small:true,label:v[0]}):""}<b>${esc(v[0])}</b><span>${esc(v[2])}</span><span class="small muted">${esc(v[3])}</span></div>`;}
/* ---------- describe: framework + builder ---------- */
const DB_OPTS={
 num:["A single","A few","Multiple","Numerous"],size:["1–2 mm","2–5 mm","5–10 mm","1–2 cm","2–5 cm","over 5 cm"],
 shape:["round","oval","polygonal","irregular","annular","targetoid","linear","dome-shaped","umbilicated","drop-like"],
 col:["erythematous","salmon-pink","violaceous","purpuric","hyperpigmented","hypopigmented","depigmented","skin-coloured","pearly","brown","variegated"],
 border:["well-demarcated","ill-defined","irregular","rolled-edged"],
 prim:["macules","patches","papules","plaques","nodules","vesicles","bullae","pustules","wheals","erosions","petechiae"],
 surf:["no surface change","silvery scale","fine scale","greasy scale","a collarette of scale","crust","honey-coloured crust","excoriation","lichenification","telangiectasia","central ulceration","a verrucous surface","central umbilication"],
 site:["extensor elbows and knees","flexures","trunk","face","scalp","hands","lower legs","palms and soles","sun-exposed skin","body folds"],
 arr:["symmetrically","asymmetrically","in groups","in a linear pattern","in a dermatomal band","scattered","coalescing"]
};
const DB={num:"Multiple",size:"2–5 cm",shape:"round",col:"salmon-pink",border:"well-demarcated",prim:"plaques",surf:"silvery scale",site:"extensor elbows and knees",arr:"symmetrically"};
function dbSentence(){const n=DB.num==="A single"?"A single":DB.num;let p=DB.prim;if(n==="A single")p=p.replace(/ae$/,"a").replace(/ches$/,"ch").replace(/s$/,"");
  return `${n} ${DB.border}, ${DB.shape}, ${DB.col} ${p}, ${DB.size}, with ${DB.surf}, ${DB.arr==="scattered"||DB.arr==="coalescing"?DB.arr+" over":"distributed "+DB.arr+" on"} the ${DB.site}.`;}
route("learn:describe","Describe it",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology · description</span><h1>Describe like a dermatologist</h1><p class="lede">A good description is a diagnosis in waiting. Follow the same order every time and your eye learns to look at each feature.</p></section>
   <div class="stack" style="gap:8px">${DESCRIBE.order.map(([t,d],i)=>`<details class="acc"${i<3?" open":""}><summary><span class="n">${pad2(i+1)}</span><span class="st"><b>${esc(t)}</b><span>${esc(d.split(/[:;.]/)[0])}</span></span></summary><div class="acc-body"><div>${esc(d)}</div></div></details>`).join("")}</div>
   <div class="card stack" style="gap:10px"><span class="eyebrow">The sentence</span><p class="mono small">${esc(DESCRIBE.formula)}</p><p class="hook">${esc(DESCRIBE.example)}</p></div>
   <div class="card stack" style="gap:12px"><span class="eyebrow">Sentence builder</span><p class="small muted">Change any part and read the result aloud.</p>
    <div class="dbgrid">${Object.entries(DB_OPTS).map(([k,o])=>`<label class="dbf"><span>${({num:"Number",size:"Size",shape:"Shape",col:"Colour",border:"Border",prim:"Lesion",surf:"Surface",site:"Site",arr:"Arrangement"})[k]}</span><select id="db-${k}" data-k="${k}">${o.map(x=>`<option${DB[k]===x?" selected":""}>${esc(x)}</option>`).join("")}</select></label>`).join("")}</div>
    <p class="hook" id="dbout">${esc(dbSentence())}</p><div class="row-x"><button class="btn sm ghost" id="dbcopy">Copy</button></div></div>
   <div class="card stack" style="gap:8px"><span class="eyebrow">Tips that make it eloquent</span><ul class="prose" style="padding-left:1.1em">${DESCRIBE.tips.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>
   <div class="card stack" style="gap:10px"><span class="eyebrow">Pigmented lesions</span>${DMOLE.map(([t,d])=>`<div class="lm"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div>
   <div class="row-x"><button class="btn" data-go="practice/describe">${ic("target")}Practise on plates</button><button class="btn soft" data-go="learn/demerg">Skin emergencies</button></div>`;
  $$(".dbgrid select",root).forEach(s=>s.addEventListener("change",()=>{DB[s.dataset.k]=s.value;$("#dbout").textContent=dbSentence();}));
  $("#dbcopy").addEventListener("click",()=>{const t=$("#dbout").textContent;try{navigator.clipboard.writeText(t).then(()=>toast("Copied","good"),()=>toast("Select the sentence to copy"));}catch(e){toast("Select the sentence to copy");}});
});
route("learn:demerg","Skin emergencies",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology · emergencies</span><h1>Skin that can kill</h1><p class="lede">Red flags in any rash: fever and a non-blanching rash, skin pain, blisters with mucosal involvement, erythema over 90% of the skin, pain out of proportion, and a new drug in the past 8 weeks.</p></section>
   ${DEMERG.map(([n,f,a])=>{const c=DCOND.find(x=>n.toLowerCase().includes(x.n.toLowerCase().split(" (")[0].split(" /")[0].slice(0,10)));return `<div class="card stack" style="gap:8px"><b class="h3">${esc(n)}</b><p>${esc(f)}</p><div class="note"><b>Do:</b> ${esc(a)}</div>${c?`<button class="link small" data-go="learn/dcond/${c.id}" style="align-self:flex-start">See the plate</button>`:""}</div>`;}).join("")}`;
});
/* ---------- practice: describe this plate ---------- */
const DCATS=[["prim","Primary lesion"],["col","Colour"],["shape","Shape"],["border","Border"],["surf","Surface"],["arr","Arrangement"],["dist","Distribution"]];
const DPOOL={};DCATS.forEach(([k])=>{DPOOL[k]=[...new Set(DPLATED().flatMap(c=>k==="dist"?[DDIST[c.d.dist].n]:c.d[k]))];});
const DX={q:null,i:0,sel:{},done:false,dx:null,tone:0};
function dxNew(only){const st=Store.s.dprac||{};const P=DPLATED();const order=only?[only]:[...shuf(P.filter(c=>!st[c.id]).map(c=>c.id)),...P.filter(c=>st[c.id]).sort((a,b)=>st[a.id].best-st[b.id].best).map(c=>c.id)].slice(0,6);
  DX.q=order;DX.i=0;dxReset();}
function dxReset(){DX.sel={};DX.done=false;DX.dx=null;DX.tone=Math.floor(Math.random()*6);const c=DCOND.find(x=>x.id===DX.q[DX.i]);DX.opts={};
  DCATS.forEach(([k])=>{const ans=k==="dist"?[DDIST[c.d.dist].n]:c.d[k];const dis=shuf(DPOOL[k].filter(x=>!ans.includes(x))).slice(0,k==="dist"?3:Math.max(3,6-ans.length));DX.opts[k]=shuf([...ans,...dis]);});
  const same=DPLATED().filter(x=>x.id!==c.id&&x.g===c.g),other=DPLATED().filter(x=>x.id!==c.id&&x.g!==c.g);DX.dxopts=shuf([c.id,...shuf(same).slice(0,2).map(x=>x.id),...shuf(other).slice(0,1).map(x=>x.id)]);}
route("practice:describe","Describe it",(root,only)=>{
  if(!Store.s.dprac)Store.s.dprac={};
  if(only||!DX.q)dxNew(only);
  drawDx(root);
});
function drawDx(root){
  root=root||V;const c=DCOND.find(x=>x.id===DX.q[DX.i]);
  const ansOf=k=>k==="dist"?[DDIST[c.d.dist].n]:c.d[k];
  const catHTML=([k,l])=>{const sel=DX.sel[k]||[],ans=ansOf(k);return `<div class="dcat"><span class="k">${l}${k==="dist"?"":" <i>(choose all that fit)</i>"}</span><div class="chips">${DX.opts[k].map(o=>{const on=sel.includes(o);let cls=on?" on":"";if(DX.done){cls=ans.includes(o)?(on?" ok":" miss"):(on?" bad":"");}return `<button class="chip${cls}" data-c="${k}" data-o="${esc(o)}" ${DX.done?"disabled":""}>${esc(o)}</button>`;}).join("")}</div></div>`;};
  let score=0;if(DX.done){DCATS.forEach(([k])=>{const s=DX.sel[k]||[],a=ansOf(k),hit=s.filter(x=>a.includes(x)).length,uni=new Set([...s,...a]).size;score+=uni?hit/uni:0;});score=Math.round(score/DCATS.length*100);}
  root.innerHTML=`<section class="ph"><div class="row-x"><span class="eyebrow">Describe it · ${DX.i+1} of ${DX.q.length}</span><span class="tag">Skin type ${TONE_NAME[DX.tone]}</span></div></section>
   <div class="card dplate">${plateHTML("c:"+c.id,DX.tone,{label:"Describe this plate"})}</div>
   ${distMap(c.d.dist).replace(/<figcaption>[\s\S]*<\/figcaption>/,`<figcaption>Where it is on the body.</figcaption>`)}
   <div class="card stack" style="gap:14px">${DCATS.map(catHTML).join("")}</div>
   <div class="card stack" style="gap:10px"><span class="k">Most likely diagnosis</span><div class="chips">${DX.dxopts.map(id=>{const x=DCOND.find(y=>y.id===id);let cls=DX.dx===id?" on":"";if(DX.done)cls=id===c.id?" ok":(DX.dx===id?" bad":"");return `<button class="chip${cls}" data-dx="${id}" ${DX.done?"disabled":""}>${esc(x.n)}</button>`;}).join("")}</div></div>
   ${DX.done?`<div class="card stack" style="gap:10px"><div class="${score>=70&&DX.dx===c.id?"good":"bad"}-box">Description ${score}% · diagnosis ${DX.dx===c.id?"✓":"✗"}</div><span class="eyebrow">Model description</span><p class="hook">${esc(c.m)}</p><p class="small"><b>${esc(c.n)}.</b> ${esc(c.key[0])}</p>
     <div class="row-x"><button class="btn" id="dxnext">${DX.i+1<DX.q.length?"Next plate":"Finish"}</button><button class="btn ghost sm" data-go="learn/dcond/${c.id}">Open the condition</button></div></div>`
    :`<button class="btn" id="dxcheck">Check my description</button>`}`;
  renderPlates(root);
  if(!DX.done){
    root.querySelectorAll("[data-c]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.c,o=b.dataset.o;let s=DX.sel[k]||[];
      if(k==="dist")s=[o];else s=s.includes(o)?s.filter(x=>x!==o):[...s,o];DX.sel[k]=s;const y=window.scrollY;drawDx(root);window.scrollTo(0,y);}));
    root.querySelectorAll("[data-dx]").forEach(b=>b.addEventListener("click",()=>{DX.dx=b.dataset.dx;const y=window.scrollY;drawDx(root);window.scrollTo(0,y);}));
    $("#dxcheck").addEventListener("click",()=>{DX.done=true;const y=window.scrollY;drawDx(root);
      let sc=0;DCATS.forEach(([k])=>{const s=DX.sel[k]||[],a=ansOf(k),hit=s.filter(x=>a.includes(x)).length,uni=new Set([...s,...a]).size;sc+=uni?hit/uni:0;});sc=Math.round(sc/DCATS.length*100)+(DX.dx===c.id?0:-20);
      const r=Store.s.dprac[c.id]||{best:0,n:0};r.n++;r.last=Math.max(0,sc);r.best=Math.max(r.best,r.last);Store.s.dprac[c.id]=r;tick(1,"eye");Store.s.xp=(Store.s.xp||0)+Math.round(Math.max(0,sc)/10);Store.save();window.scrollTo(0,y);});
  }else $("#dxnext").addEventListener("click",()=>{if(DX.i+1<DX.q.length){DX.i++;dxReset();drawDx(root);window.scrollTo(0,0);}else{DX.q=null;toast("Set complete","good");open("practice","describe");}});
}
