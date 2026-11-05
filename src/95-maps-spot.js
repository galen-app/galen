"use strict";
/* ================= CONCEPT MAPS (viewer) + SPOT DIAGNOSIS ================= */
function layoutMap(m){
  /* layered layout: nodes by level, ordered to reduce crossings by the average x of their parents; then simple spacing */
  const levels={};m.nodes.forEach(n=>(levels[n.level]||(levels[n.level]=[])).push(n));
  const L=Object.keys(levels).map(Number).sort((a,b)=>a-b);
  const W=Math.max(640,Math.max(...L.map(l=>levels[l].length))*150+40),pos={};
  const parents={};m.edges.forEach(e=>(parents[e.to]||(parents[e.to]=[])).push(e.from));
  L.forEach((l,li)=>{const row=levels[l];
    if(li>0)row.sort((a,b)=>{const ax=(parents[a.id]||[]).map(p=>pos[p]?pos[p].x:W/2),bx=(parents[b.id]||[]).map(p=>pos[p]?pos[p].x:W/2);const am=ax.length?ax.reduce((s,x)=>s+x,0)/ax.length:W/2,bm=bx.length?bx.reduce((s,x)=>s+x,0)/bx.length:W/2;return am-bm;});
    const gap=W/(row.length+1);row.forEach((n,i)=>{pos[n.id]={x:gap*(i+1),y:60+li*110};});});
  return {pos,W,H:60+L.length*110+30};
}
function mapSVG(m,sel){
  const {pos,W,H}=layoutMap(m);const bw=128,bh=40;
  const wrap=(t)=>{const words=t.split(" ");const lines=[];let cur="";words.forEach(w=>{if((cur+" "+w).trim().length>18){lines.push(cur.trim());cur=w;}else cur+=" "+w;});if(cur.trim())lines.push(cur.trim());return lines.slice(0,2);};
  /* edge labels: place at the curve midpoint, nudge to avoid collisions with other labels and nodes, drop if no room (the note still names every link) */
  const boxes=Object.values(pos).map(p=>[p.x-bw/2-2,p.y-bh/2-2,p.x+bw/2+2,p.y+bh/2+2]);
  const hit=r=>boxes.some(q=>r[0]<q[2]&&r[2]>q[0]&&r[1]<q[3]&&r[3]>q[1]);
  const paths=[],labels=[];
  m.edges.forEach(e=>{const a=pos[e.from],b=pos[e.to];if(!a||!b)return;const my=(a.y+b.y)/2;
    paths.push(`<path class="ed" d="M${a.x} ${a.y+bh/2} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y-bh/2}" marker-end="url(#arr)"/>`);
    if(!e.label)return;const w=e.label.length*5.9+6,mx=(a.x+b.x)/2;
    for(const [dx,dy] of [[0,0],[0,-11],[0,11],[-w/2-4,0],[w/2+4,0],[0,-22],[0,22]]){const x=mx+dx,y=my+dy,r=[x-w/2,y-9,x+w/2,y+3];if(!hit(r)){boxes.push(r);labels.push(`<text class="el" x="${x}" y="${y}" text-anchor="middle">${esc(e.label)}</text>`);break;}}});
  const edges=paths.join("")+labels.join("");
  const nodes=m.nodes.map(n=>{const p=pos[n.id];const lines=wrap(n.label);return `<g class="nd t-${n.type}${sel===n.id?" sel":""}" data-n="${n.id}" transform="translate(${p.x-bw/2} ${p.y-bh/2})"><rect width="${bw}" height="${bh}"/>${lines.map((l,i)=>`<text x="${bw/2}" y="${lines.length===1?25:17+i*14}" text-anchor="middle">${esc(l)}</text>`).join("")}${n.link?`<circle cx="${bw-8}" cy="8" r="3" fill="var(--accent)"/>`:""}</g>`;}).join("");
  return `<svg class="cmap" viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W,620)}px"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>${edges}${nodes}</svg>`;
}
route("learn:maps","Concept maps",(root)=>{
  const by={};CMAPS.forEach(m=>(by[m.sys]||(by[m.sys]=[])).push(m));
  root.innerHTML=`<section class="ph"><span class="eyebrow">Concept maps</span><h1>See how it connects</h1><p class="lede">${CMAPS.length} maps from mechanism to bedside sign to decision. Tap a node for its note, and the orange dot opens the page behind it.</p></section>
   ${Object.entries(by).map(([sys,L])=>`<section class="section"><span class="label">${SYS_NAME[sys]||sys}</span><div class="list">${L.map(m=>{const done=(Store.s.notes["map:"+m.id]||{}).done;return `<button class="lrow" data-go="learn/map/${m.id}"><span class="dot${done?" on":""}"></span><span class="txt"><b>${esc(m.title)}</b><span>${m.nodes.length} concepts · ${m.quiz.length} questions</span></span>${ic("chev","chev")}</button>`;}).join("")}</div></section>`).join("")}`;
});
route("learn:map",(id)=>(CMAPS.find(m=>m.id===id)||{}).title||"Map",(root,id)=>{
  const m=CMAPS.find(x=>x.id===id);if(!m)throw new Error("Map not found");let sel=null;
  const types=[["symptom","Symptom"],["history","History"],["mechanism","Mechanism"],["anatomy","Anatomy"],["sign","Sign"],["test","Test"],["diagnosis","Diagnosis"],["decision","Decision"]];
  root.innerHTML=`<section class="ph"><span class="eyebrow">Concept map · ${SYS_NAME[m.sys]||m.sys}</span><h1>${esc(m.title)}</h1><p class="lede">${esc(m.intro)}</p></section>
   <div class="legend">${types.map(([k,l])=>`<span><i class="t-${k}" style="background:var(--${({symptom:"warn-soft",history:"surface",mechanism:"surface",anatomy:"bone",sign:"accent-soft",test:"surface3",diagnosis:"good-soft",decision:"bad-soft"})[k]})"></i>${l}</span>`).join("")}</div>
   <div class="card cmwrap" id="mapbox">${mapSVG(m,null)}</div>
   <div class="card stack" id="mapnote" style="gap:8px"><p class="muted">Tap a concept.</p></div>
   <div class="card stack" style="gap:10px"><span class="eyebrow">Check yourself</span>${m.quiz.map((q,i)=>`<details class="acc"><summary><span class="n">${i+1}</span><span class="st"><b>${esc(q.q)}</b></span></summary><div class="acc-body"><div>${esc(q.a)}</div></div></details>`).join("")}<button class="btn sm soft" id="mapdone">${(Store.s.notes["map:"+id]||{}).done?"Marked as understood":"I can explain this map"}</button></div>
   <div class="card stack" style="gap:8px"><span class="eyebrow">Rebuild it from memory</span><p class="small">Close the map and draw the chain yourself: symptom → mechanism → sign → decision. Then open it again and compare. The gaps you find are the cards that will come back in your session.</p><button class="btn sm ghost" id="maphide">Hide the map</button></div>`;
  const box=$("#mapbox"),note=$("#mapnote");
  const show=nid=>{sel=nid;const n=m.nodes.find(x=>x.id===nid);box.innerHTML=mapSVG(m,sel);bind();if(!n)return;
    const ins=m.edges.filter(e=>e.to===nid).map(e=>`${esc(m.nodes.find(x=>x.id===e.from).label)} <i>${esc(e.label)}</i>`),outs=m.edges.filter(e=>e.from===nid).map(e=>`<i>${esc(e.label)}</i> ${esc(m.nodes.find(x=>x.id===e.to).label)}`);
    note.innerHTML=`<span class="eyebrow">${esc(n.type)}</span><h2>${esc(n.label)}</h2><p>${esc(n.note)}</p>${ins.length?`<p class="small muted">← ${ins.join(" · ")}</p>`:""}${outs.length?`<p class="small muted">→ ${outs.join(" · ")}</p>`:""}${n.link?`<button class="btn sm" data-go="${n.link}">Open</button>`:""}`;};
  const bind=()=>$$(".nd",box).forEach(g=>g.addEventListener("click",()=>show(g.dataset.n)));bind();
  $("#mapdone").addEventListener("click",()=>{Store.s.notes["map:"+id]={t:Date.now(),done:true};Store.save();tick(3,"read");Store.s.xp=(Store.s.xp||0)+5;Store.save();$("#mapdone").textContent="Marked as understood";toast("Nice. It will come back as questions.","good");});
  $("#maphide").addEventListener("click",e=>{box.hidden=!box.hidden;e.target.textContent=box.hidden?"Show the map":"Hide the map";});
});
/* ---------- spot diagnosis ---------- */
const SPOT={q:null,i:0,score:0,n:0};
function spotSubjects(){return [...DCOND.map(c=>({id:"d:"+c.id,n:c.n,g:c.g,terms:imgTermsFor(c.id)||[c.n],sys:"derm"})),...Object.entries(IMG_SUBJECTS).filter(([id,[n,t,sys]])=>!/diagram|anatomy|chart|regions|plexus|willis|cord/i.test(id)).map(([id,[n,t,sys]])=>({id:"s:"+id,n,g:SYS_NAME[sys]||sys,terms:t,sys}))];}
route("practice:spot","Spot diagnosis",(root)=>{
  const all=spotSubjects(),ready=all.filter(s=>Img.pool(s.id,s.terms).length);
  if(!SPOT.q){
    root.innerHTML=`<section class="ph"><span class="eyebrow">Practice · photographs</span><h1>Spot diagnosis</h1><p class="lede">A real photograph, four names. ${ready.length} of ${all.length} subjects have photos ready on this device${Img.canUse()?"; Galen fetches more as you play.":"."}</p>
     ${Img.canUse()?`<div class="row-x"><button class="btn" id="sp-go">${ic("eye")}Start 10</button><button class="btn soft" id="sp-build">Fetch photos for 12 subjects</button></div>`:`<div class="note">Live photographs work in the installed Galen app. Here, practise with the drawn plates in Describe it.</div>`}</section>
     <div class="card"><div class="sec"><h3>How it teaches</h3><p class="small">Perceptual learning: many brief exposures with immediate feedback build pattern recognition faster than reading. Each photo you see links to its page, so a miss becomes a lesson. Pin the photos that teach you best in the library.</p></div></div>`;
    const go=$("#sp-go");if(go)go.addEventListener("click",()=>{const pool=all.filter(s=>Img.pool(s.id,s.terms).length);if(pool.length<4){toast("Fetch photos first");return;}SPOT.q=shuf(pool).slice(0,10);SPOT.i=0;SPOT.score=0;SPOT.n=0;render(false);});
    const bd=$("#sp-build");if(bd)bd.addEventListener("click",async()=>{bd.disabled=true;const pick=shuf(all.filter(s=>!Img.pool(s.id,s.terms).length)).slice(0,12);let k=0;for(const s of pick){bd.textContent=`Fetching ${++k}/${pick.length}…`;try{await Img.forSubject(s.terms.slice(0,2));}catch(e){toast(e.message,"bad");break;}}render(false);});
    return;
  }
  const s=SPOT.q[SPOT.i];if(!s){SPOT.q=null;render(false);return;}
  const pool=Img.pool(s.id,s.terms),it=pick(pool);
  const others=shuf(all.filter(x=>x.id!==s.id&&x.sys===s.sys)).slice(0,2).concat(shuf(all.filter(x=>x.id!==s.id&&x.sys!==s.sys)).slice(0,1));
  const opts=shuf([s,...others]);
  root.innerHTML=`<section class="ph"><div class="row-x"><span class="eyebrow">Spot diagnosis · ${SPOT.i+1} of ${SPOT.q.length}</span><span class="tag">${SPOT.score}/${SPOT.n}</span></div></section>
   <div class="card" style="padding:8px"><img class="spot-img" src="${esc(it.thumb)}" alt="Clinical photograph"><p class="tiny muted" style="padding:6px 6px 0">${esc(it.author)} · ${esc(it.lic)}</p></div>
   <div class="opts" id="sp-opts">${opts.map(o=>`<button class="opt" data-id="${o.id}">${esc(o.n)}</button>`).join("")}</div><div id="sp-x"></div>`;
  $$("#sp-opts .opt").forEach(b=>b.addEventListener("click",()=>{if(b.disabled)return;const ok=b.dataset.id===s.id;SPOT.n++;if(ok)SPOT.score++;$$("#sp-opts .opt").forEach(x=>{x.disabled=true;if(x.dataset.id===s.id)x.classList.add("ok");else if(x===b)x.classList.add("bad");});
    const go=s.id.startsWith("d:")?`learn/dcond/${s.id.slice(2)}`:(SIGNS[s.id.slice(2)]?`signs/sign/${s.id.slice(2)}`:`signs/imgsub/${s.id.slice(2)}`);
    $("#sp-x").innerHTML=`<div class="card stack" style="gap:8px"><div class="${ok?"good":"bad"}-box">${ok?"Correct":"It was "+esc(s.n)}</div>${it.desc?`<p class="small">${esc(it.desc)}</p>`:""}<div class="row-x"><button class="btn" id="sp-next">${SPOT.i+1<SPOT.q.length?"Next":"Finish"}</button><button class="btn ghost sm" data-go="${go}">Open the page</button></div></div>`;
    tick(1,"eye");Store.s.xp=(Store.s.xp||0)+(ok?2:1);Store.save();
    $("#sp-next").addEventListener("click",()=>{SPOT.i++;if(SPOT.i>=SPOT.q.length){toast(`Spot diagnosis: ${SPOT.score}/${SPOT.n}`,"good");SPOT.q=null;}render(false);});}));
});
