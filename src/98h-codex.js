"use strict";
/* The codex: list, story pages, and the story blocks on sign and technique pages. */
/* ================= THE CODEX ================= */
let CODEX_F="all";
route("learn:codex","The codex",(root)=>{
  const draw=()=>{const list=LORE.filter(l=>CODEX_F==="all"||l.k===CODEX_F||l.hall===CODEX_F);const found=EGGS.filter(e=>eggFound(e.id));
   root.innerHTML=`<section class="ph"><span class="eyebrow">The codex</span><h1>Medicine's long argument</h1><p class="lede">The people behind the names, the beliefs that harmed patients for centuries, and the discoveries that won anyway. Every story is tied to something you do at the bedside.</p></section>
   ${guideHTML(GALEN.lore,{small:1})}
   <div class="codexfilter" role="group" aria-label="Filter stories">${[["all","All"],["dark","The dark"],["triumph","Triumph"],["eponym","Behind the name"],["theatre","The theatre"]].map(([k,t])=>`<button class="chip" aria-pressed="${CODEX_F===k}" data-f="${k}">${t}</button>`).join("")}
     <select class="sel" id="cx-hall" aria-label="Stories of one hall" style="width:auto"><option value="">By hall…</option>${HALLS.map(h=>`<option value="${h.id}" ${CODEX_F===h.id?"selected":""}>${esc(h.n)}</option>`).join("")}</select></div>
   <div class="grid">${list.map(l=>loreCard(l,{hall:1})).join("")}</div>
   <section class="section"><span class="label">Marginalia · ${found.length} of ${EGGS.length} secrets found</span><div class="card stack" style="gap:8px">${EGGS.map(e=>eggFound(e.id)?`<button class="link" style="text-align:left" data-egg-show="${e.id}"><span class="marg"><b>${esc(e.t)}</b> · found</span></button>`:`<span class="marg">${esc(e.hint)}</span>`).join("")}</div></section>`;
   $$("[data-f]",root).forEach(b=>b.addEventListener("click",()=>{CODEX_F=b.dataset.f;draw();}));
   $("#cx-hall",root).addEventListener("change",e=>{CODEX_F=e.target.value||"all";draw();});
   $$("[data-egg-show]",root).forEach(b=>b.addEventListener("click",()=>showEgg(EGGS.find(x=>x.id===b.dataset.eggShow),false)));};
  draw();
});
route("learn:lore",(id)=>(loreById(id)||{}).t||"Story",(root,id)=>{
  const l=loreById(id);if(!l)throw new Error("No such story");const h=HALL[l.hall];const i=LORE.indexOf(l),nx=LORE[(i+1)%LORE.length];
  Store.s.notes["lore:"+id]={t:Date.now(),v:1};Store.save();
  root.innerHTML=`<section class="ph"><span class="row-x" style="gap:8px"><span class="eyebrow">${LORE_KIND[l.k]}</span><span class="spacer"></span><span class="latin" style="font-size:1rem">${esc(l.yr)}</span></span><h1>${esc(l.t)}</h1><p class="lede">${esc(l.who)}</p></section>
  <article class="lore-body">${l.body.map(p=>`<p>${esc(p)}</p>`).join("")}</article>
  ${LORE_OUT[l.id]?`<div class="card lore-out"><span class="label">The story in outline</span><dl>${["Before","The turning point","What followed"].map((k,i)=>`<dt>${k}</dt><dd>${esc(LORE_OUT[l.id][i])}</dd>`).join("")}<dt>At the bedside</dt><dd><b>${esc(l.fact)}</b></dd></dl></div>`:`<div class="lore-fact"><b>At the bedside:</b> ${esc(l.fact)}</div>`}
  <div class="card">${guideHTML([null,l.galen],{small:1})}</div>
  ${(l.signs||[]).filter(s=>SIGNS[s]).length?`<section class="section"><span class="label">The signs in this story</span><div class="chips">${l.signs.filter(s=>SIGNS[s]).map(signChip).join("")}</div></section>`:""}
  <div class="row-x"><button class="btn ghost" data-go="learn/hall/${l.hall}">${ic("door")}${esc(h.n)}</button><span class="spacer"></span><button class="btn soft" data-go="learn/lore/${nx.id}">Next story ${ic("chev")}</button></div>
  <p class="tiny muted">Source: ${esc(l.src)}</p>`;
  SND.fx("page");
});

/* sign and technique pages: the story behind the name, and the hall it lives in */
{const _sign=ROUTES["signs:sign"];ROUTES["signs:sign"]=(root,id)=>{_sign(root,id);const ls=LORE_BY_SIGN[id]||[],h=signHall(id);
  const el=document.createElement("section");el.className="section";
  el.innerHTML=`${ls.length?`<span class="label">The story behind it</span><div class="grid">${ls.map(l=>loreCard(l)).join("")}</div>`:""}${h?`<div class="row-x" style="margin-top:8px"><button class="btn ghost sm" data-go="learn/hall/${h}">${ic("door")}${esc(HALL[h].n)}</button></div>`:""}`;
  root.append(el);};}
{const _tech=ROUTES["learn:tech"];ROUTES["learn:tech"]=(root,id)=>{_tech(root,id);if(!id)return;const h=techHall(id);if(!h)return;
  const el=document.createElement("div");el.className="row-x";el.innerHTML=`<button class="btn ghost sm" data-go="learn/hall/${h}">${ic("door")}${esc(HALL[h].n)}</button>`;root.append(el);};}
