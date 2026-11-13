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
/* urgency flag (DURG in 69c): a pill and a banner */
const dUrg=c=>c&&c.u&&DURG[c.u]?DURG[c.u]:null;
const dPill=c=>{const u=dUrg(c);return u?`<span class="dpill ${u.c}">${esc(u.l)}</span>`:"";};
const dUrgent=c=>!!c&&["now","today","cancer"].includes(c.u);
/* bedside tests and calculators that belong with a condition */
const DSIGNLINK={sjs:["nikolsky"],pemphigus:["nikolsky"],ssss:["nikolsky"],bp:["nikolsky"],psoriasis:["auspitz","koebner"],guttate:["auspitz"],lp:["koebner"],vitiligo:["woods","koebner"],pv:["woods"],erythrasma:["woods"],"tinea-capitis":["woods"],
 meningococcal:["diascopy"],"petechiae-plt":["diascopy"],vasculitis:["diascopy"],"purpura-fulminans":["diascopy"],dengue:["diascopy"],melanoma:["abcde","dermoscopy"],naevus:["abcde","dermoscopy"],sk:["dermoscopy"],"acral-melanoma":["abcde","dermoscopy"],"nail-melanoma":["abcde"],"lentigo-maligna":["dermoscopy"],bcc:["dermoscopy"]};
const DCALC={sjs:["scorten","SCORTEN"],necfasc:["lrinec","LRINEC (rule in only)"],melanoma:["glasgow-7","Glasgow 7-point checklist"],naevus:["glasgow-7","Glasgow 7-point checklist"],"burn-depth":["parkland","Parkland formula"]};
const calcOK=id=>typeof TOOLS!=="undefined"&&TOOLS.some(t=>t.id===id);
/* distribution figure: body silhouettes with highlighted regions */
function distMap(key){
  const D=DDIST[key];if(!D)return "";
  let s="";[["f",0],["b",240]].forEach(([v,ox])=>{s+=`<g class="sil">${silhouette(ox)}</g><g class="dreg">`;
    D.R.forEach(([vv,part,box])=>{if(vv!==v)return;
      if(part==="head")s+=`<polygon points="${headBand(box,ox)}"/>`;
      else if(part==="trunk"){if(D.half){s+=`<polygon points="${trunkPoly(box,ox)}" clip-path="url(#halfL${ox})"/>`;}else s+=`<polygon points="${trunkPoly(box,ox)}"/>`;}
      else [false,true].forEach(m=>{s+=`<polygon points="${stripPoly(BODY[part],box,m,ox)}"/>`;});});
    s+=`</g><g class="outl">${silhouette(ox)}</g>`;});
  return `<figure class="fig small dmap"><svg viewBox="0 0 460 470" role="img" aria-label="Distribution: ${esc(D.n)}"><defs><clipPath id="halfL0"><rect x="0" y="0" width="110" height="470"/></clipPath><clipPath id="halfL240"><rect x="350" y="0" width="110" height="470"/></clipPath></defs>${s}
    <text x="110" y="466" text-anchor="middle" class="fl fb">Front</text><text x="350" y="466" text-anchor="middle" class="fl fb">Back</text></svg>
    <figcaption><b>${esc(D.n)}.</b> ${esc(D.d)} <span class="muted">Think: ${esc(D.think)}</span></figcaption></figure>`;
}
const PHOTO_LINKS=c=>[["DermNet",`https://dermnetnz.org/topics/${c.slug}`],["Skin Deep (skin of colour)",`https://dftbskindeep.com/?s=${encodeURIComponent(c.n.split(" (")[0])}`],["Wikimedia Commons",`https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(c.n.split(" (")[0])}&title=Special:MediaSearch&type=image`]];
/* ---------- atlas ---------- */
const DAF={g:"all",q:""};
const dMatch=(c,q)=>{if(!q)return true;const t=(c.n+" "+(c.terms||[]).join(" ")+" "+c.m+" "+c.dd.join(" ")+" "+c.g).toLowerCase();return q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>t.includes(w));};
function dFiltered(){return DCOND.filter(c=>(DAF.g==="all"||(DAF.g==="urgent"?dUrgent(c):DAF.g==="ksa"?!!c.ksa:c.g===DAF.g))&&dMatch(c,DAF.q));}
function dAtlasList(){
  const L=dFiltered(),drawn=L.filter(c=>c.p),photo=L.filter(c=>!c.p);
  if(!L.length)return `<div class="note">Nothing matches “${esc(DAF.q)}”${DAF.g!=="all"?" in this group":""}. Try a simpler word, or <button class="link" data-dclear>clear the search</button>.</div>`;
  return `${drawn.length?`<section class="section"><span class="label">Drawn plates · ${drawn.length}</span><div class="datlas">${drawn.map(c=>`<button class="dtile${dUrgent(c)?" urg":""}" data-go="learn/dcond/${c.id}">${fol("c:"+c.id,{small:true,label:c.n})}<b>${esc(c.n)}</b><span>${esc(c.g)}${dUrgent(c)?` · <i class="dflagtxt ${c.u}">${c.u==="now"?"emergency":c.u==="cancer"?"suspected cancer":"same day"}</i>`:""}</span></button>`).join("")}</div></section>`:""}
   ${photo.length?`<section class="section"><span class="label">Photo atlas · ${photo.length}</span><p class="small muted">Description, look-alikes and what to do on every page; photographs load when you are online.</p><div class="dlist">${photo.map(c=>{const pin=Img.pinsOf("d:"+c.id)[0];return `<button class="drow" data-go="learn/dcond/${c.id}">${pin?`<img loading="lazy" src="${esc(pin.thumb)}" alt="">`:`<span class="drow-i" aria-hidden="true">${esc(c.n.slice(0,1))}</span>`}<span class="drow-t"><b>${esc(c.n)}</b><span>${esc(c.g)}${c.ksa?" · Saudi practice":""}</span></span>${dUrgent(c)?dPill(c):""}</button>`;}).join("")}</div></section>`:""}`;
}
function dermAtlasHTML(){
  const chips=[["all","All"],["urgent","Urgent and emergency"],["ksa","Saudi practice"],...DGROUPS.map(g=>[g,g])];
  return `${toneBar("atone")}<p class="small muted">Plates are drawn by the app (40 px = 1 cm), not photographs. Switch skin tone to see how each lesion changes on Fitzpatrick types I–VI.</p>
   <label class="dsearch">${ic("search")}<input id="dq" type="search" placeholder="Search ${DCOND.length} conditions" value="${esc(DAF.q)}" autocomplete="off" aria-label="Search the skin atlas"></label>
   <div class="chips" id="dag">${chips.map(([k,l])=>`<button class="chip${DAF.g===k?" on":""}" data-g="${esc(k)}" aria-pressed="${DAF.g===k}">${esc(l)}</button>`).join("")}</div>
   <div id="dlistwrap">${dAtlasList()}</div>`;
}
function bindAtlas(root,redraw){bindTone(root,"atone");
  const g=$("#dag",root);if(g)g.addEventListener("click",e=>{const b=e.target.closest("[data-g]");if(!b)return;DAF.g=b.dataset.g;redraw();});
  const relist=()=>{const w=$("#dlistwrap",root);if(!w)return;w.innerHTML=dAtlasList();renderPlates(w);const cl=$("[data-dclear]",w);if(cl)cl.addEventListener("click",()=>{DAF.q="";const i=$("#dq",root);if(i)i.value="";relist();});};
  const q=$("#dq",root);let t=0;if(q)q.addEventListener("input",()=>{clearTimeout(t);t=setTimeout(()=>{DAF.q=q.value.trim();relist();},120);});
  relist();}
route("learn:datlas","Skin atlas",(root)=>{const draw=()=>{root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology</span><h1>Skin atlas</h1><p class="lede">${DCOND.length} conditions: ${DPLATED().length} drawn on six skin tones, all with a model description, the features that clinch it, look-alikes, a note on brown and black skin, what to do and how urgently.</p>
  <div class="row-x"><button class="btn sm" data-go="practice/describe">${ic("target")}Describe, then diagnose</button><button class="btn sm soft" data-go="learn/demerg">Skin emergencies</button><button class="btn sm ghost" data-go="learn/dsoc">Skin of colour and Saudi practice</button><button class="btn sm ghost" data-go="learn/dmorph">Morphology</button><button class="btn sm ghost" data-go="learn/describe">How to describe</button></div></section>${dermAtlasHTML()}`;bindAtlas(root,draw);};draw();});
/* ---------- condition page ---------- */
route("learn:dcond",(id)=>(DCOND.find(c=>c.id===id)||{}).n||"Skin condition",(root,id)=>{
  const c=DCOND.find(x=>x.id===id);
  if(!c){root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology</span><h1>Not in the atlas</h1><p class="lede">There is no condition called “${esc(id||"")}” in Galen's atlas. Search for it instead.</p></section><div class="row-x"><button class="btn" data-go="learn/datlas">Open the skin atlas</button><button class="btn ghost" data-go="learn/demerg">Skin emergencies</button></div>`;return;}
  const d=c.d,row=(k,v)=>v?`<dt>${k}</dt><dd>${esc(Array.isArray(v)?v.join(", "):v)}</dd>`:"";
  const u=dUrg(c),banner=c.act&&dUrgent(c);
  const signs=(DSIGNLINK[c.id]||[]).filter(s=>SIGNS[s]),calc=DCALC[c.id]&&calcOK(DCALC[c.id][0])?DCALC[c.id]:null;
  root.innerHTML=`<section class="ph"><div class="row-x"><span class="tag">${esc(c.g)}</span><span class="tag">Dermatology</span>${c.ksa?`<span class="tag">Saudi practice</span>`:""}</div><h1>${esc(c.n)}</h1></section>
   ${banner?`<div class="dflag ${u.c}" role="note"><b>${esc(u.l)}</b><p>${esc(c.act)}</p>${calc?`<button class="btn sm" data-go="tools/calc/${calc[0]}">${ic("scale")}${esc(calc[1])}</button>`:""}</div>`:""}
   ${c.p?`<div class="card dplate">${fol("c:"+c.id,{label:c.n})}${toneBar("ctone")}</div>`:""}
   <div class="card stack" style="gap:10px"><span class="eyebrow">Say it like this</span><p class="hook">${esc(c.m)}</p>
    ${d?`<dl class="kv">${row("Primary lesion",d.prim)}${row("Colour",d.col)}${row("Shape",d.shape)}${row("Border",d.border)}${row("Surface",d.surf)}${row("Arrangement",d.arr)}${row("Distribution",DDIST[d.dist]?DDIST[d.dist].n:d.dist)}</dl>`:""}</div>
   <div class="card stack" style="gap:14px"><div class="sec"><h3>Clinches it</h3><ul class="prose" style="padding-left:1.1em">${c.key.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="sec"><h3>Look-alikes</h3><ul class="prose" style="padding-left:1.1em">${c.dd.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="sec"><h3>On brown and black skin</h3><p>${esc(c.soc)}</p></div>
    ${c.act&&!banner?`<div class="sec"><h3>What to do</h3>${u?`<p>${dPill(c)}</p>`:""}<p>${esc(c.act)}</p>${calc?`<button class="btn sm ghost" data-go="tools/calc/${calc[0]}">${ic("scale")}${esc(calc[1])}</button>`:""}</div>`:""}
    ${c.ksa?`<div class="sec"><h3>In Saudi practice</h3><p>${esc(c.ksa)}</p></div>`:""}
    ${signs.length?`<div class="sec"><h3>At the bedside</h3><div class="chips">${signs.map(s=>`<button class="chip" data-go="signs/sign/${s}">${esc(SIGNS[s].name)}</button>`).join("")}</div></div>`:""}
    ${c.src?`<p class="tiny muted">Checked against: ${esc(c.src)}. Follow your local formulary and protocols.</p>`:""}</div>
   ${d?distMap(d.dist):""}
   ${c.p?`<div class="card stack" style="gap:8px"><span class="eyebrow">Same lesion, six skin tones</span><div class="tonestrip">${[0,1,2,3,4,5].map(t=>`<figure>${plateHTML("c:"+c.id,t,{small:true,label:c.n+" on type "+TONE_NAME[t]})}<figcaption>Type ${TONE_NAME[t]}</figcaption></figure>`).join("")}</div></div>`:""}
   ${Img.galleryHTML("d:"+c.id,imgTermsFor(c.id),{title:c.n,links:PHOTO_LINKS(c)})}
   ${memoryBlock("d:"+c.id)}
   <div class="row-x">${c.p&&d?`<button class="btn sm" data-go="practice/describe/${c.id}">${ic("target")}Describe this one</button>`:""}${dUrgent(c)?`<button class="btn sm soft" data-go="learn/demerg">Skin emergencies</button>`:""}<button class="btn sm ghost" data-go="learn/datlas">Skin atlas</button><button class="btn sm ghost" data-go="practice/spot">Spot diagnosis</button></div>`;
  if(c.p)bindTone(root,"ctone");renderPlates(root);Img.bindGalleries(root);
  if(!Store.s.dseen)Store.s.dseen=[];if(!Store.s.dseen.includes(id)){Store.s.dseen.push(id);Store.save();}
});
/* ---------- morphology ---------- */
route("learn:dmorph","Morphology",(root)=>{
  const sec=(title,list)=>`<section class="section"><span class="label">${title}</span><div class="dvocab">${list}</div></section>`;
  root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology · vocabulary</span><h1>The words of the skin</h1><p class="lede">Learn each term with its picture and, where one exists, its size rule (macule and patch, papule and plaque or nodule, vesicle and bulla). Most descriptions need only a dozen words used precisely.</p>${toneBar("mtone")}</section>
   ${sec("Primary lesions",DVOCAB.filter(v=>v[1]==="primary").map(v=>vcard(v,DVOCAB.indexOf(v))).join(""))}
   ${sec("Secondary changes",DVOCAB.filter(v=>v[1]==="secondary").map(v=>vcard(v,DVOCAB.indexOf(v))).join(""))}
   ${sec("Shape and arrangement",DSHAPES.map((s,i)=>`<div class="vcard">${s[3]?fol("s:"+i,{small:true,label:s[0]}):""}<b>${esc(s[0])}</b><span>${esc(s[1])}</span><span class="small muted">${esc(s[2])}</span></div>`).join(""))}
   <section class="section"><span class="label">Colour</span><div class="card stack" style="gap:10px">${DCOLOURS.map(([t,d])=>`<div class="lm"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div></section>
   <section class="section"><span class="label">Touch and bedside signs</span><div class="card stack" style="gap:10px">${DPALP.map(([t,d])=>`<div class="lm"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div></section>
   <section class="section"><span class="label">Distribution</span><div class="dists">${Object.keys(DDIST).map(distMap).join("")}</div></section>
   <div class="row-x"><button class="btn" data-go="practice/describe">${ic("target")}Describe, then diagnose</button><button class="btn ghost" data-go="learn/dsoc">Skin of colour</button></div>`;
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
/* which choices make sense together: size follows the lesion's size rule; one lesion has no arrangement */
const DB_SIZE={macules:[0,1,2],papules:[0,1,2],vesicles:[0,1,2],pustules:[0,1,2],petechiae:[0,1],patches:[3,4,5],plaques:[3,4,5],nodules:[3,4,5],bullae:[3,4,5],wheals:[1,2,3,4,5],erosions:[0,1,2,3,4,5]};
const DB_SINGLE_ARR=["asymmetrically"];
function dbValid(k,x){if(k==="size")return (DB_SIZE[DB.prim]||[0,1,2,3,4,5]).includes(DB_OPTS.size.indexOf(x));
  if(k==="arr"&&DB.num==="A single")return false;if(k==="arr"&&DB.num==="A few"&&x==="coalescing")return false;
  if(k==="shape"&&DB.prim==="petechiae")return ["round","irregular"].includes(x);
  if(k==="col"&&DB.prim==="petechiae")return x==="purpuric";
  if(k==="surf"&&(DB.prim==="petechiae"||DB.prim==="wheals"))return x==="no surface change";return true;}
function dbFix(){["size","shape","col","surf"].forEach(k=>{if(!dbValid(k,DB[k]))DB[k]=DB_OPTS[k].find(x=>dbValid(k,x));});}
const DB={num:"Multiple",size:"2–5 cm",shape:"round",col:"salmon-pink",border:"well-demarcated",prim:"plaques",surf:"silvery scale",site:"extensor elbows and knees",arr:"symmetrically"};
function dbSentence(){dbFix();const one=DB.num==="A single";let p=DB.prim;if(one)p=p.replace(/ae$/,"a").replace(/ches$/,"ch").replace(/s$/,"");
  const where=one?`on the ${DB.site}`:DB.arr==="scattered"||DB.arr==="coalescing"?`${DB.arr} over the ${DB.site}`:`distributed ${DB.arr} on the ${DB.site}`;
  return `${DB.num} ${DB.border}, ${DB.shape}, ${DB.col} ${p}, ${DB.size}, with ${DB.surf}, ${where}.`;}
function dbOptions(k){return DB_OPTS[k].map(x=>`<option${DB[k]===x?" selected":""}${dbValid(k,x)?"":" disabled"}>${esc(x)}</option>`).join("");}
route("learn:describe","Describe it",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology · description</span><h1>Describe like a dermatologist</h1><p class="lede">A good description is a diagnosis in waiting. Look in the same order every time and your eye learns to check each feature; then say it in the sentence order below.</p></section>
   <span class="label">Look in this order</span>
   <div class="stack" style="gap:8px">${DESCRIBE.order.map(([t,d],i)=>`<details class="acc"${i<3?" open":""}><summary><span class="n">${pad2(i+1)}</span><span class="st"><b>${esc(t)}</b><span>${esc(d.split(/[:;.]/)[0])}</span></span></summary><div class="acc-body"><div>${esc(d)}</div></div></details>`).join("")}</div>
   <div class="card stack" style="gap:10px"><span class="eyebrow">Say it in this order</span><p class="small">${esc(DESCRIBE.formula)}</p><p class="hook">${esc(DESCRIBE.example)}</p></div>
   <div class="card stack" style="gap:12px"><span class="eyebrow">Sentence builder</span><p class="small muted">Change any part and read the result aloud. Sizes follow the lesion's size rule, and a single lesion has no arrangement, so options that cannot go together are greyed out.</p>
    <div class="dbgrid">${Object.keys(DB_OPTS).map(k=>`<label class="dbf"><span>${({num:"Number",size:"Size",shape:"Shape",col:"Colour",border:"Border",prim:"Lesion",surf:"Surface",site:"Site",arr:"Arrangement"})[k]}</span><select id="db-${k}" data-k="${k}">${dbOptions(k)}</select></label>`).join("")}</div>
    <p class="hook" id="dbout">${esc(dbSentence())}</p><div class="row-x"><button class="btn sm ghost" id="dbcopy">Copy</button></div></div>
   <div class="card stack" style="gap:8px"><span class="eyebrow">Tips that make it eloquent</span><ul class="prose" style="padding-left:1.1em">${DESCRIBE.tips.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>
   <div class="card stack" style="gap:10px"><span class="eyebrow">Pigmented lesions</span>${DMOLE.map(([t,d])=>`<div class="lm"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div>
   <div class="row-x"><button class="btn" data-go="practice/describe">${ic("target")}Describe, then diagnose</button><button class="btn soft" data-go="learn/demerg">Skin emergencies</button><button class="btn ghost" data-go="learn/dsoc">Skin of colour</button></div>`;
  const sync=()=>{dbFix();$$(".dbgrid select",root).forEach(s=>{s.innerHTML=dbOptions(s.dataset.k);s.disabled=s.dataset.k==="arr"&&DB.num==="A single";});$("#dbout",root).textContent=dbSentence();};
  $$(".dbgrid select",root).forEach(s=>s.addEventListener("change",()=>{DB[s.dataset.k]=s.value;sync();}));sync();
  $("#dbcopy",root).addEventListener("click",()=>{const t=$("#dbout",root).textContent;try{navigator.clipboard.writeText(t).then(()=>toast("Copied","good"),()=>toast("Select the sentence to copy"));}catch(e){toast("Select the sentence to copy");}});
});
/* ---------- emergencies: a triage card, then every urgent condition ---------- */
const DTRIAGE=[
 ["Fever and a non-blanching rash","meningococcal","Antibiotics now. Do not let a glass test reassure you."],
 ["Purpura spreading within hours, necrosis, shock","purpura-fulminans","Resuscitate, antibiotics, critical care."],
 ["Skin pain, dusky targets, blisters, two or more mucosal sites, a new drug","sjs","Stop the drug; SCORTEN; burns unit or ICU."],
 ["Pain out of proportion, spreading dusky erythema, bullae","necfasc","Surgeon now; LRINEC cannot rule it out."],
 ["Swollen lips or tongue, stridor, wheeze or low blood pressure","angioedema","IM adrenaline into the thigh."],
 ["Fever, low blood pressure, sunburn-like redness, red eyes and mouth","tss","Remove the source; beta-lactam plus clindamycin."],
 ["Red over 90% of the skin","erythroderma","Admit."],
 ["Rash, fever, facial swelling, eosinophils, 2–8 weeks after a drug","dress","Stop the drug; same-day admission."],
 ["Child: tender red skin peeling in sheets, mouth spared","ssss","Admit; IV flucloxacillin."],
 ["Child: fever 5 days or more with red eyes, lips and hands","kawasaki","Same-day paediatrics; IVIG and echo."],
 ["Eczema turning painful with punched-out erosions","eczema-herpeticum","Aciclovir today."],
 ["Shingles on the forehead or nose tip, or a red eye","hzo","Antiviral now; same-day eye review."],
 ["Fever and rash in a dengue area, as the fever settles","dengue","Warning signs mean admission; no NSAIDs."]
];
route("learn:demerg","Skin emergencies",(root)=>{
  const byId=id=>DCOND.find(c=>c.id===id);
  const list=DEMERG.filter(e=>!e[3]||byId(e[3]));
  const extra=DCOND.filter(c=>c.u==="now"&&!DEMERG.some(e=>e[3]===c.id));
  root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology · emergencies</span><h1>Skin that can kill</h1><p class="lede">Red flags in any rash: fever with a non-blanching rash, skin pain, blisters with mucosal involvement, erythema over 90% of the skin, pain out of proportion, facial or tongue swelling, and a new drug in the past 8 weeks.</p></section>
   <section class="section"><span class="label">Triage in ten seconds</span><div class="card dtri">${DTRIAGE.filter(t=>byId(t[1])).map(([see,id,doNow])=>{const c=byId(id);return `<button class="dtri-r ${c.u||""}" data-go="learn/dcond/${id}"><span class="dtri-see">${esc(see)}</span><span class="dtri-th"><b>${esc(c.n)}</b><span>${esc(doNow)}</span></span>${ic("chev")}</button>`;}).join("")}</div></section>
   <section class="section"><span class="label">What to do</span><div class="stack" style="gap:12px">${list.map(([n,f,a,id,calc])=>{const c=id&&byId(id);return `<div class="card stack demcard" style="gap:8px">${c&&c.p?`<button class="demplate" data-go="learn/dcond/${c.id}" aria-label="Open ${esc(c.n)}">${fol("c:"+c.id,{small:true,label:c.n})}</button>`:""}<div class="row-x"><b class="h3">${esc(n)}</b>${dPill(c)}</div><p>${esc(f)}</p><div class="note"><b>Do now:</b> ${esc(a)}</div>${c&&c.act?`<details class="acc"><summary><span class="st"><b>Full management and referral</b></span></summary><div class="acc-body"><div>${esc(c.act)}</div>${c.src?`<p class="tiny muted">${esc(c.src)}</p>`:""}</div></details>`:""}
     <div class="row-x">${c?`<button class="btn sm soft" data-go="learn/dcond/${c.id}">${c.p?"See the plate":"Open the condition"}</button>`:""}${calc&&calcOK(calc)?`<button class="btn sm ghost" data-go="tools/calc/${calc}">${ic("scale")}${esc((TOOLS.find(t=>t.id===calc)||{}).name||calc)}</button>`:""}</div></div>`;}).join("")}
   ${extra.map(c=>`<div class="card stack" style="gap:8px"><div class="row-x"><b class="h3">${esc(c.n)}</b>${dPill(c)}</div><p>${esc(c.act||c.m)}</p><button class="btn sm soft" data-go="learn/dcond/${c.id}" style="align-self:flex-start">Open the condition</button></div>`).join("")}</div></section>
   <div class="row-x"><button class="btn" data-go="practice/describe">${ic("target")}Practise: describe, then diagnose</button><button class="btn ghost" data-go="learn/datlas">Skin atlas</button></div>`;
  renderPlates(root);
});
/* ---------- skin of colour and Saudi practice ---------- */
route("learn:dsoc","Skin of colour",(root)=>{
  const lm=L=>`<div class="card stack" style="gap:10px">${L.map(([t,d])=>`<div class="lm"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div>`;
  const ksaConds=DCOND.filter(c=>c.ksa);
  root.innerHTML=`<section class="ph"><span class="eyebrow">Dermatology · practice</span><h1>Skin of colour and Saudi practice</h1><p class="lede">Most of your patients have type III–V skin. Redness hides, pigment lingers, and some diseases look different or are commoner. These are the habits and local knowledge that change the diagnosis.</p></section>
   <div class="card dplate">${plateHTML("c:psoriasis",1,{label:"Psoriasis on type II skin"})}${plateHTML("c:psoriasis",4,{label:"Psoriasis on type V skin"})}<p class="small muted">The same psoriatic plaques on type II and type V skin: salmon-pink becomes violaceous brown, and the scale carries the diagnosis.</p></div>
   <section class="section"><span class="label">Seeing disease on brown and black skin</span>${lm(DSOC.see)}</section>
   <section class="section"><span class="label">Normal, do not treat</span>${lm(DSOC.variants)}</section>
   <section class="section"><span class="label">Commoner or different</span>${lm(DSOC.different)}</section>
   <section class="section"><span class="label">Saudi practice</span>${lm(DSOC.ksa)}</section>
   <section class="section"><span class="label">Marks of traditional practice</span>${lm(DSOC.marks)}</section>
   <section class="section"><span class="label">Conditions with a Saudi note · ${ksaConds.length}</span><div class="chips">${ksaConds.map(c=>`<button class="chip" data-go="learn/dcond/${c.id}">${esc(c.n)}</button>`).join("")}</div></section>
   <p class="tiny muted">${esc(DSOC.src)}</p>
   <div class="row-x"><button class="btn" data-go="learn/datlas">Skin atlas</button><button class="btn ghost" data-go="practice/describe">${ic("target")}Describe, then diagnose</button></div>`;
  renderPlates(root);
});
/* ---------- practice: describe, then diagnose ---------- */
const DCATS=[["prim","Primary lesion"],["col","Colour"],["shape","Shape"],["border","Border"],["surf","Surface"],["arr","Arrangement"],["dist","Distribution"]];
const DPOOL={};DCATS.forEach(([k])=>{DPOOL[k]=[...new Set(DPLATED().flatMap(c=>k==="dist"?[DDIST[c.d.dist].n]:c.d[k]))];});
const DURG_ORDER=["routine","soon","cancer","today","now"];
const DX={q:null,i:0,sel:{},done:false,stage:1,dx:null,urg:null,tone:0};
function dxNew(only){const st=Store.s.dprac||{};const P=DPLATED();const order=only&&P.some(c=>c.id===only)?[only]:[...shuf(P.filter(c=>!st[c.id]).map(c=>c.id)),...P.filter(c=>st[c.id]).sort((a,b)=>st[a.id].best-st[b.id].best).map(c=>c.id)].slice(0,6);
  DX.q=order;DX.i=0;dxReset();}
function dxReset(){DX.sel={};DX.done=false;DX.stage=1;DX.dx=null;DX.urg=null;DX.tone=Math.floor(Math.random()*6);const c=DCOND.find(x=>x.id===DX.q[DX.i]);DX.opts={};
  DCATS.forEach(([k])=>{const ans=k==="dist"?[DDIST[c.d.dist].n]:c.d[k];const dis=shuf(DPOOL[k].filter(x=>!ans.includes(x))).slice(0,k==="dist"?3:Math.max(3,6-ans.length));DX.opts[k]=shuf([...ans,...dis]);});
  const same=DPLATED().filter(x=>x.id!==c.id&&x.g===c.g),other=DPLATED().filter(x=>x.id!==c.id&&x.g!==c.g);DX.dxopts=shuf([c.id,...shuf(same).slice(0,2).map(x=>x.id),...shuf(other).slice(0,1).map(x=>x.id)]);}
route("practice:describe","Describe it",(root,only)=>{
  if(!Store.s.dprac)Store.s.dprac={};
  if(only||!DX.q)dxNew(only);
  drawDx(root);
});
function dxDescScore(c){const ansOf=k=>k==="dist"?[DDIST[c.d.dist].n]:c.d[k];let sc=0;DCATS.forEach(([k])=>{const s=DX.sel[k]||[],a=ansOf(k),hit=s.filter(x=>a.includes(x)).length,uni=new Set([...s,...a]).size;sc+=uni?hit/uni:0;});return Math.round(sc/DCATS.length*100);}
function drawDx(root){
  root=root||V;const c=DCOND.find(x=>x.id===DX.q[DX.i]);
  const ansOf=k=>k==="dist"?[DDIST[c.d.dist].n]:c.d[k];const shown=DX.stage>1;
  const catHTML=([k,l])=>{const sel=DX.sel[k]||[],ans=ansOf(k);return `<div class="dcat"><span class="k">${l}${k==="dist"?"":" <i>(choose all that fit)</i>"}</span><div class="chips">${DX.opts[k].map(o=>{const on=sel.includes(o);let cls=on?" on":"";if(shown){cls=ans.includes(o)?(on?" ok":" miss"):(on?" bad":"");}return `<button class="chip${cls}" data-c="${k}" data-o="${esc(o)}" aria-pressed="${on}" ${shown?"disabled":""}>${esc(o)}</button>`;}).join("")}</div></div>`;};
  const desc=shown?dxDescScore(c):0,urgOK=DX.urg===c.u,dxOK=DX.dx===c.id;
  const D=DDIST[c.d.dist];
  root.innerHTML=`<section class="ph"><div class="row-x"><span class="eyebrow">Describe, then diagnose · ${DX.i+1} of ${DX.q.length}</span><span class="tag">Skin type ${TONE_NAME[DX.tone]}</span></div>
    <ol class="dsteps" aria-label="Steps"><li class="${DX.stage===1?"on":"done"}">1 Describe</li><li class="${DX.stage===2?"on":DX.stage>2?"done":""}">2 Diagnose and decide</li><li class="${DX.stage===3?"on":""}">3 Compare</li></ol></section>
   <div class="card dplate">${plateHTML("c:"+c.id,DX.tone,{label:"Describe this plate"})}</div>
   ${distMap(c.d.dist).replace(/<figcaption>[\s\S]*<\/figcaption>/,`<figcaption>Where it is on the body.</figcaption>`)}
   <div class="card stack" style="gap:14px">${DCATS.map(catHTML).join("")}</div>
   ${DX.stage===1?`<p class="small muted" id="dxhint">${(DX.sel.prim||[]).length?"Describe as much as you can, then lock it in. The diagnosis comes next.":"Start with the primary lesion: that is the one feature you must name."}</p><button class="btn" id="dxlock" ${(DX.sel.prim||[]).length?"":"disabled"}>Lock in my description</button>`:""}
   ${shown?`<div class="card stack" style="gap:10px"><div class="${desc>=70?"good":"bad"}-box">Your description: ${desc}% of features right</div><p class="small">Green: right. Outlined: missed. Red: not a feature of this plate. <b>${esc(D.n)}</b> makes you think of: ${esc(D.think)}</p></div>`:""}
   ${DX.stage>=2?`<div class="card stack" style="gap:12px"><span class="k">Most likely diagnosis</span><div class="chips">${DX.dxopts.map(id=>{const x=DCOND.find(y=>y.id===id);let cls=DX.dx===id?" on":"";if(DX.done)cls=id===c.id?" ok":(DX.dx===id?" bad":"");return `<button class="chip${cls}" data-dx="${id}" aria-pressed="${DX.dx===id}" ${DX.done?"disabled":""}>${esc(x.n)}</button>`;}).join("")}</div>
     <span class="k">How urgently does this patient need care?</span><div class="chips">${DURG_ORDER.map(k=>{let cls=DX.urg===k?" on":"";if(DX.done)cls=k===c.u?" ok":(DX.urg===k?" bad":"");return `<button class="chip${cls}" data-urg="${k}" aria-pressed="${DX.urg===k}" ${DX.done?"disabled":""}>${esc(DURG[k].l)}</button>`;}).join("")}</div></div>`:""}
   ${DX.stage===2?`<button class="btn" id="dxcheck" ${DX.dx&&DX.urg?"":"disabled"}>Check my diagnosis</button>`:""}
   ${DX.done?`<div class="card stack" style="gap:10px"><div class="${desc>=70&&dxOK?"good":"bad"}-box">Description ${desc}% · diagnosis ${dxOK?"right":"wrong"} · urgency ${urgOK?"right":"wrong"}</div><span class="eyebrow">Model description</span><p class="hook">${esc(c.m)}</p><p class="small"><b>${esc(c.n)}.</b> ${esc(c.key[0])}</p>
     ${c.act?`<div class="dflag ${c.u||"routine"}"><b>${esc((dUrg(c)||DURG.routine).l)}</b><p>${esc(c.act)}</p></div>`:""}
     <div class="row-x"><button class="btn" id="dxnext">${DX.i+1<DX.q.length?"Next plate":"Finish"}</button><button class="btn ghost sm" data-go="learn/dcond/${c.id}">Open the condition</button></div></div>`:""}`;
  renderPlates(root);
  const keep=fn=>{const y=window.scrollY;fn();drawDx(root);window.scrollTo(0,y);};
  if(DX.stage===1){
    root.querySelectorAll("[data-c]").forEach(b=>b.addEventListener("click",()=>keep(()=>{const k=b.dataset.c,o=b.dataset.o;let s=DX.sel[k]||[];
      if(k==="dist")s=[o];else s=s.includes(o)?s.filter(x=>x!==o):[...s,o];DX.sel[k]=s;})));
    $("#dxlock",root).addEventListener("click",()=>keep(()=>{DX.stage=2;}));
  }
  if(DX.stage===2){
    root.querySelectorAll("[data-dx]").forEach(b=>b.addEventListener("click",()=>keep(()=>{DX.dx=b.dataset.dx;})));
    root.querySelectorAll("[data-urg]").forEach(b=>b.addEventListener("click",()=>keep(()=>{DX.urg=b.dataset.urg;})));
    $("#dxcheck",root).addEventListener("click",()=>{if(!DX.dx||!DX.urg)return;keep(()=>{DX.stage=3;DX.done=true;
      const sc=dxDescScore(c)+(DX.dx===c.id?0:-20);
      const r=Store.s.dprac[c.id]||{best:0,n:0};r.n++;r.last=Math.max(0,sc);r.best=Math.max(r.best,r.last);r.at=Date.now();if(DX.urg===c.u)r.urg=(r.urg||0)+1;Store.s.dprac[c.id]=r;tick(1,"eye");Store.s.xp=(Store.s.xp||0)+Math.round(Math.max(0,sc)/10);Store.save();});});
  }
  if(DX.done)$("#dxnext",root).addEventListener("click",()=>{if(DX.i+1<DX.q.length){DX.i++;dxReset();drawDx(root);window.scrollTo(0,0);}else{DX.q=null;toast("Set complete","good");open("practice","describe");}});
}
