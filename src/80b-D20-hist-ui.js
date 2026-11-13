"use strict";
/* D20 (7.1): rendering helpers for history presentations. The learn:pres route (80-app.js) calls
   histPresPage(p) for one presentation and histPresList() for the list, when present.
   Sources are visible on touch and gamepad (each clue row opens), LR chips use a diverging scale
   (orange rules in, blue rules out, grey barely moves), and unquantified clues say why. */
const HX_TAG={crit:"Criterion",rf:"Red flag",weak:"Weak",approx:"Approximate",or:"Odds ratio",abs:"Absolute risk",nq:"Not quantified"};
function hxLrClass(v){if(v==null)return "hx-q";if(v>=10)return "hx-u3";if(v>=5)return "hx-u2";if(v>=2)return "hx-u1";if(v<=0.1)return "hx-d3";if(v<=0.2)return "hx-d2";if(v<=0.5)return "hx-d1";return "hx-f";}
function hxLrWord(v){if(v==null)return "";if(v>=10)return "strongly rules in";if(v>=5)return "rules in";if(v>=2)return "nudges up";if(v<=0.1)return "strongly rules out";if(v<=0.2)return "rules out";if(v<=0.5)return "nudges down";return "barely moves";}
function hxChip(v,tg){
  if(v!=null)return `<span class="hx-chip ${hxLrClass(v)}" aria-label="Likelihood ratio ${v}, ${hxLrWord(v)}">LR ${v}</span>`;
  const t=tg||["nq","Not quantified"];
  return `<span class="hx-chip hx-q hx-k-${esc(t[0])}" aria-label="${esc((HX_TAG[t[0]]||"")+": "+t[1])}">${esc(t[1])}</span>`;
}
function hxTagText(t){const k=HX_TAG[t[0]]||"",l=String(t[1]||"");return l.toLowerCase().startsWith(k.toLowerCase())||!k?`<b>${esc(l)}.</b>`:`<b>${esc(k)}.</b> ${esc(l)}.`;}
function hxLinks(p){
  const L=p.links||{},out=[];
  const grp=(label,items)=>{items=items.filter(Boolean);if(items.length)out.push(`<div class="hx-lg"><span class="label">${label}</span><div class="chips">${items.join("")}</div></div>`);};
  const chip=(go,icon,txt)=>`<button class="chip" data-go="${esc(go)}">${ic(icon)}${esc(txt)}</button>`;
  const F=(arr,fn)=>(arr||[]).map(fn);
  grp("Take the history",F(L.hcase,id=>{const c=typeof HCASES!=="undefined"&&HCASES.find(x=>x.id===id);return c?chip("practice/hcase/"+id,"history",c.title):"";}));
  grp("Examine next",[...F(L.mod,id=>{const s=typeof SYSTEMS!=="undefined"&&SYSTEMS.find(x=>x.id===id);return s?chip("learn/module/"+id,"learn",s.short+" examination"):"";}),...F(L.reg,id=>{const r=typeof REGIONS!=="undefined"&&REGIONS.find(x=>x.id===id);return r?chip("learn/region/"+id,"learn",r.name):"";})]);
  grp("Score it",F(L.calc,id=>{const t=typeof TOOLS!=="undefined"&&TOOLS.find(x=>x.id===id);return t?chip("tools/calc/"+id,"scale","Calculate "+t.name):"";}));
  grp("Practise",[...F(L.hdpe,id=>{const c=typeof HDPE!=="undefined"&&HDPE.find(x=>x.id===id);return c?chip("practice/hdpe/"+id,"target",c.title):"";}),...F(L.scen,id=>{const c=typeof SCEN!=="undefined"&&SCEN.find(x=>x.id===id);return c?chip("practice/er/"+id,"bolt",c.title||c.name||id):"";}),...F(L.loc,id=>{const c=typeof LCASES!=="undefined"&&LCASES.find(x=>x.id===id);return c?chip("practice/localiser/"+id,"target","Localise: "+c.t):"";})]);
  grp("Signs to check",F(L.signs,id=>typeof SIGNS!=="undefined"&&SIGNS[id]?chip("signs/sign/"+id,"eye",SIGNS[id].name):""));
  grp("Related presentations",F(L.pres,id=>{const q=HIST.pres.find(x=>x.id===id);return q?chip("learn/pres/"+id,"history",q.name):"";}));
  return out.length?`<section class="section hx-links"><span class="label">Close the loop</span>${out.join("")}</section>`:"";
}
function histPresList(){
  const tagN=p=>p.ksa?`<span class="tag">Saudi</span>`:"";
  return `<section class="ph"><span class="eyebrow">History taking</span><h1>The questions that move probability</h1><p class="lede">For each complaint: what to ask, which answers shift the odds and by how much, the red flags, what to do now, and the differential to keep in view.</p></section>
   <div class="row-x" style="margin-bottom:12px"><button class="btn soft" data-go="practice/hcase">${ic("history")}History-first cases</button><button class="btn ghost" data-go="learn/frames">Frameworks</button></div>
   <div class="list">${HIST.pres.map(x=>`<button class="lrow" data-go="learn/pres/${x.id}"><span class="icwrap n">${ic("history")}</span><span class="txt"><b>${esc(x.name)}</b><span>${x.lr.length} clues · ${x.red.length} red flags · ${x.dd.length} differentials</span></span>${tagN(x)}${ic("chev","chev")}</button>`).join("")}</div>`;
}
function histPresPage(p){
  const tg=p.lrTag||{},src=p.lrSrc||{};
  const ask=p.ask.map(a=>typeof a==="string"?`<p class="small">${esc(a)}</p>`:
    `<details class="acc why"><summary><span class="st"><b>${esc(a.q)}</b>${a.lr!=null?`<span class="hx-sum">${hxChip(a.lr)}${a.target?`<span class="tiny muted">${esc(a.target)}</span>`:""}</span>`:""}</span></summary><div class="acc-body"><div><span class="k">Why</span>${esc(a.why)}</div>${a.changes?`<div><span class="k">What changes</span>${esc(a.changes)}</div>`:""}${a.src?`<div class="tiny muted hx-src">Source: ${esc(a.src)}</div>`:""}</div></details>`).join("");
  const rows=p.lr.map(([f,t,l],i)=>`<details class="hx-row"><summary><span class="hx-clue">${esc(f)}</span><span class="hx-to">${esc(t)}</span><span class="hx-v">${hxChip(l,tg[f])}</span></summary><div class="hx-more">${l!=null?`<p class="small"><b>${esc(hxLrWord(l))}</b> for ${esc(t)}.</p>`:tg[f]?`<p class="small">${hxTagText(tg[f])}</p>`:`<p class="small"><b>Not quantified.</b> No pooled likelihood ratio is available for this clue.</p>`}<p class="tiny muted">Source: ${esc(src[f]||"not given")}</p></div></details>`).join("");
  return `<section class="ph"><span class="eyebrow">History · presentation</span><h1>${esc(p.name)}</h1></section>
   ${p.frame?`<p class="quote">${esc(p.frame)}</p>`:""}
   ${p.ksa?`<div class="note hx-ksa"><b>Saudi Arabia.</b> ${esc(p.ksa)}</div>`:""}
   ${p.now&&p.now.length?`<div class="card stack hx-now"><span class="eyebrow">Do now</span><ol>${p.now.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>`:""}
   <div class="card stack" style="gap:6px"><span class="eyebrow">Ask, and why</span>${ask}</div>
   <div class="section"><span class="label">Clues that shift probability</span>
    <div class="hx-lrt" role="list"><div class="hx-head" aria-hidden="true"><span>Clue</span><span>Points to</span><span>LR</span></div>${rows}</div>
    <p class="tiny muted hx-key"><span class="hx-chip hx-u2">orange</span> rules in · <span class="hx-chip hx-d2">blue</span> rules out · <span class="hx-chip hx-f">grey</span> barely moves. Open a clue for its source and caveats. Likelihood ratios are approximate and come from the studies named; clues from the same mechanism are not independent, so do not multiply them all.</p></div>
   <div class="card stack"><h3>Red flags</h3>${p.red.map(r=>`<div class="redflag">${esc(r)}</div>`).join("")}</div>
   ${p.amber&&p.amber.length?`<div class="card stack hx-amber"><h3>Amber features</h3><p class="tiny muted">Intermediate risk in the NICE NG143 traffic light: assess and safety-net, or refer.</p>${p.amber.map(r=>`<div class="amberflag">${esc(r)}</div>`).join("")}</div>`:""}
   <div class="section"><span class="label">Differential to keep in view</span><div class="chips">${p.dd.map(d=>`<span class="chip">${esc(d)}</span>`).join("")}</div></div>
   ${hxLinks(p)}`;
}
