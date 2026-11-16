"use strict";
/* ================= CONCEPT MAPS (viewer) + SPOT DIAGNOSIS =================
   Layered (Sugiyama-style) layout: every edge is oriented downward by the authored level, cycles are broken, layers are
   assigned by longest path, wide layers wrap into extra rows, and edges that span rows get reserved channel slots so they
   never run over a node. The viewer pans and zooms (pinch, Ctrl/wheel, buttons, keys) and never renders text below a
   legible size at its starting zoom. A list view walks the same map step by step. */
const CM_TYPES=[["symptom","Symptom"],["history","History"],["mechanism","Mechanism"],["anatomy","Anatomy"],["sign","Sign"],["test","Test"],["diagnosis","Diagnosis"],["decision","Decision"]];
const CM_TYPE_PL={symptom:"Symptoms",history:"History",mechanism:"Mechanisms",anatomy:"Anatomy",sign:"Signs",test:"Tests",diagnosis:"Diagnoses",decision:"Decisions"};
/* one small shape per type, so the type never depends on colour alone (12 x 12 box) */
const CM_GLYPH={symptom:'<circle cx="6" cy="6" r="5"/>',history:'<path d="M1 2h10v6H5l-3 3V8H1z"/>',mechanism:'<path d="M6 0.6l4.7 2.7v5.4L6 11.4 1.3 8.7V3.3z"/>',anatomy:'<path d="M4 1h4v3h3v4H8v3H4V8H1V4h3z"/>',sign:'<path d="M6 1l5.5 10h-11z"/>',test:'<path d="M6 0.5l5.5 5.5L6 11.5 0.5 6z"/>',diagnosis:'<rect x="1" y="1" width="10" height="10" rx="1"/>',decision:'<path d="M1 1l6 0 4.5 5L7 11H1l4.5-5z"/>'};
const cmGlyph=(t,x,y,s)=>`<svg class="cg t-${t}" x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 12 12" aria-hidden="true">${CM_GLYPH[t]||CM_GLYPH.mechanism}</svg>`;
const CM={nodeW:176,fs:14,lh:18,pad:9,gap:26,dgap:8,rowGap:70,dummyW:6,minK:0.9};
function cmWrap(t,max){const words=String(t).split(/\s+/);const lines=[];let cur="";words.forEach(w=>{if(cur&&(cur+" "+w).length>max){lines.push(cur);cur=w;}else cur=cur?cur+" "+w:w;});if(cur)lines.push(cur);
  if(lines.length>3){const keep=lines.slice(0,3);keep[2]=keep[2].replace(/\s*\S*$/,"")+"…";return keep;}return lines;}
function cmLayout(m,perRow){
  perRow=Math.max(2,perRow||5);
  const N=m.nodes,byId={};N.forEach(n=>byId[n.id]=n);const lev=id=>(byId[id].level||0);
  const E=m.edges.filter(e=>byId[e.from]&&byId[e.to]&&e.from!==e.to).map((e,i)=>({e,i,u:lev(e.to)>=lev(e.from)?e.from:e.to,v:lev(e.to)>=lev(e.from)?e.to:e.from}));
  /* break any cycle left after orienting by level (DFS back edges are reversed) */
  const out={};E.forEach(x=>(out[x.u]||(out[x.u]=[])).push(x));const st={};
  const dfs=u=>{st[u]=1;(out[u]||[]).slice().forEach(x=>{if(x.u!==u)return;if(st[x.v]===1){const t=x.u;x.u=x.v;x.v=t;}else if(!st[x.v])dfs(x.v);});st[u]=2;};
  [...N].sort((a,b)=>lev(a.id)-lev(b.id)).forEach(n=>{if(!st[n.id])dfs(n.id);});
  /* longest-path layers, never above the authored level */
  const L={};N.forEach(n=>L[n.id]=lev(n.id));
  for(let it=0;it<N.length+2;it++){let ch=false;E.forEach(x=>{if(L[x.v]<L[x.u]+1){L[x.v]=L[x.u]+1;ch=true;}});if(!ch)break;}
  const minL=Math.min(...N.map(n=>L[n.id]));N.forEach(n=>L[n.id]-=minL);
  let rows=[];N.forEach(n=>{(rows[L[n.id]]||(rows[L[n.id]]=[])).push(n.id);});rows=rows.filter(Boolean);
  /* wrap wide rows: nodes that lead on stay in the first row, leaves move down */
  const hasOut=id=>E.some(x=>x.u===id);const pos0={};
  const R=[];rows.forEach(r=>{const s=r.slice().sort((a,b)=>(hasOut(b)-hasOut(a)));for(let i=0;i<s.length;i+=perRow)R.push(s.slice(i,i+perRow));});
  const rowOf={};R.forEach((r,ri)=>r.forEach(id=>rowOf[id]=ri));
  /* make every edge point to a lower row (a wrapped leaf may now share or precede its parent's row) */
  for(let it=0;it<20;it++){let ch=false;E.forEach(x=>{if(rowOf[x.v]<=rowOf[x.u]){const id=x.v,from=rowOf[id],to=rowOf[x.u]+1;R[from]=R[from].filter(y=>y!==id);while(R.length<=to)R.push([]);R[to].push(id);rowOf[id]=to;ch=true;}});if(!ch)break;}
  /* dummies for edges spanning more than one row */
  const items={};N.forEach(n=>items[n.id]={id:n.id,real:true,n});
  const segs=[];E.forEach(x=>{const chain=[x.u];for(let r=rowOf[x.u]+1;r<rowOf[x.v];r++){const d="~"+x.i+"_"+r;items[d]={id:d,real:false};R[r].push(d);rowOf[d]=r;chain.push(d);}chain.push(x.v);x.chain=chain;for(let k=0;k<chain.length-1;k++)segs.push([chain[k],chain[k+1]]);});
  const Rr=R.filter(r=>r.length);const ri2={};Rr.forEach((r,i)=>r.forEach(id=>ri2[id]=i));
  const up={},dn={};segs.forEach(([a,b])=>{(dn[a]||(dn[a]=[])).push(b);(up[b]||(up[b]=[])).push(a);});
  /* order rows by barycentre, alternating sweeps */
  const ordIdx={};const setIdx=()=>Rr.forEach(r=>r.forEach((id,i)=>ordIdx[id]=i));setIdx();
  const bary=(id,nb)=>{const a=(nb[id]||[]);return a.length?a.reduce((s,x)=>s+ordIdx[x],0)/a.length:ordIdx[id];};
  for(let sw=0;sw<6;sw++){const down=sw%2===0;const seq=down?Rr.slice(1):Rr.slice(0,-1).reverse();seq.forEach(r=>{const b={};r.forEach(id=>b[id]=bary(id,down?up:dn));r.sort((p,q)=>b[p]-b[q]);r.forEach((id,i)=>ordIdx[id]=i);});}
  /* sizes */
  const maxCh=Math.floor((CM.nodeW-2*CM.pad-18)/(CM.fs*0.52));
  N.forEach(n=>{const it=items[n.id];it.lines=cmWrap(n.label,maxCh);it.w=CM.nodeW;it.h=it.lines.length*CM.lh+2*CM.pad;});
  Object.values(items).forEach(it=>{if(!it.real){it.w=CM.dummyW;it.h=0;}});
  const rowH=Rr.map(r=>Math.max(...r.map(id=>items[id].h),CM.lh+2*CM.pad));
  const rowY=[];let y=24;Rr.forEach((r,i)=>{rowY.push(y);y+=rowH[i]+CM.rowGap;});const H=y-CM.rowGap+28;
  /* x: pack, then pull each item towards its neighbours while keeping order and spacing */
  const gp=(a,b)=>(items[a].real&&items[b].real)?CM.gap:CM.dgap;const X={};const widthOf=r=>r.reduce((s,id,i)=>s+items[id].w+(i?gp(r[i-1],id):0),0);
  const W0=Math.max(...Rr.map(widthOf));
  Rr.forEach(r=>{let x=(W0-widthOf(r))/2;r.forEach((id,i)=>{if(i)x+=gp(r[i-1],id);X[id]=x+items[id].w/2;x+=items[id].w;});});
  const sep=(a,b)=>(items[a].w+items[b].w)/2+gp(a,b);
  for(let it=0;it<8;it++){const down=it%2===0;(down?Rr:Rr.slice().reverse()).forEach(r=>{
    const want=r.map(id=>{const nb=(down?up[id]:dn[id])||[];return nb.length?nb.reduce((s,x)=>s+X[x],0)/nb.length:X[id];});
    /* clamp each item between its leftmost and rightmost packed slot inside the widest row, so rows never spread past it */
    const lo=[],hi=[];let x=0;r.forEach((id,i)=>{if(i)x+=sep(r[i-1],id);else x=items[id].w/2;lo[i]=x;});
    x=W0;for(let i=r.length-1;i>=0;i--){if(i===r.length-1)x=W0-items[r[i]].w/2;else x-=sep(r[i],r[i+1]);hi[i]=x;}
    r.forEach((id,i)=>{let v=Math.min(Math.max(want[i],lo[i]),hi[i]);if(i)v=Math.max(v,X[r[i-1]]+sep(r[i-1],id));X[id]=v;});});}
  let minX=Infinity,maxX=-Infinity;Object.keys(items).forEach(id=>{const it=items[id];minX=Math.min(minX,X[id]-it.w/2);maxX=Math.max(maxX,X[id]+it.w/2);});
  const off=24-minX;Object.keys(X).forEach(id=>X[id]+=off);const W=maxX-minX+48;
  const P={};Object.keys(items).forEach(id=>{const it=items[id],r=ri2[id];P[id]={x:X[id],y:rowY[r]+(rowH[r]-it.h)/2,w:it.w,h:it.h,row:r,rowTop:rowY[r],rowBot:rowY[r]+rowH[r]};});
  return {E,items,P,W,H,rows:Rr,rowOf:ri2};
}
function cmSVG(m,lay){
  const {E,items,P,W,H}=lay;
  /* ports: spread edges along the bottom and top of each node, ordered by where they go */
  const portsB={},portsT={};E.forEach(x=>{const c=x.chain;(portsB[c[0]]||(portsB[c[0]]=[])).push(x);(portsT[c[c.length-1]]||(portsT[c[c.length-1]]=[])).push(x);});
  const portX=(map,id,x,nextId)=>{const a=map[id];if(!a||a.length<2||!items[id].real)return P[id].x;a.sort((p,q)=>P[map===portsB?p.chain[1]:p.chain[p.chain.length-2]].x-P[map===portsB?q.chain[1]:q.chain[q.chain.length-2]].x);const i=a.indexOf(x),span=Math.min(P[id].w*0.6,(a.length-1)*22);return P[id].x-span/2+span*i/(a.length-1);};
  const boxes=Object.keys(items).filter(id=>items[id].real).map(id=>{const p=P[id];return [p.x-p.w/2-3,p.y-3,p.x+p.w/2+3,p.y+p.h+3];});
  const hit=r=>boxes.some(q=>r[0]<q[2]&&r[2]>q[0]&&r[1]<q[3]&&r[3]>q[1])||r[0]<2||r[2]>W-2;
  const paths=[],labels=[];
  E.forEach(x=>{const c=x.chain;const pts=[];
    c.forEach((id,k)=>{const p=P[id];
      if(k===0)pts.push([portX(portsB,id,x),p.y+p.h]);
      else if(k===c.length-1)pts.push([portX(portsT,id,x),p.y]);
      else{pts.push([p.x,p.rowTop]);pts.push([p.x,p.rowBot]);}});
    let d=`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for(let k=1;k<pts.length;k++){const [x0,y0]=pts[k-1],[x1,y1]=pts[k];if(Math.abs(x1-x0)<0.5&&k%2===0&&c.length>2)d+=` L${x1.toFixed(1)} ${y1.toFixed(1)}`;else{const my=(y0+y1)/2;d+=` C${x0.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;}}
    const rev=x.u!==x.e.from;/* drawn from the real source to the real target, so the arrow is right even when it points up */
    const dd=rev?cmReversePath(pts,c):d;
    paths.push(`<path class="ed${rev?" upw":""}" data-e="${x.i}" data-f="${esc(x.e.from)}" data-t="${esc(x.e.to)}" d="${dd}" marker-end="url(#cm-arr)"/>`);
    if(!x.e.label)return;
    /* label in the first gap after the real source */
    const [a,b]=rev?[pts[pts.length-1],pts[pts.length-2]]:[pts[0],pts[1]];
    const w=x.e.label.length*6.7+10,hh=17;
    for(const t of [0.5,0.32,0.68,0.2,0.8]){const lx=a[0]+(b[0]-a[0])*t,ly=a[1]+(b[1]-a[1])*t;let placed=false;
      for(const dx of [0,-w*0.55,w*0.55]){const r=[lx+dx-w/2,ly-hh/2,lx+dx+w/2,ly+hh/2];if(!hit(r)){boxes.push(r);labels.push(`<text class="el" data-e="${x.i}" x="${(lx+dx).toFixed(1)}" y="${(ly+4.5).toFixed(1)}" text-anchor="middle">${esc(x.e.label)}</text>`);placed=true;break;}}
      if(placed)break;}});
  const nodes=m.nodes.map(n=>{const p=P[n.id],it=items[n.id];const ty=n.type||"mechanism";const tl=(CM_TYPES.find(t=>t[0]===ty)||[,ty])[1];
    const lines=it.lines,ty0=p.h/2-(lines.length-1)*CM.lh/2+5;
    return `<g class="nd t-${ty}" data-n="${esc(n.id)}" tabindex="0" role="button" aria-label="${esc(tl+": "+n.label)}" transform="translate(${(p.x-p.w/2).toFixed(1)} ${p.y.toFixed(1)})"><rect class="bx" width="${p.w}" height="${p.h}" rx="9"/>${cmGlyph(ty,7,7,12)}${lines.map((l,i)=>`<text x="${p.w/2+6}" y="${(ty0+i*CM.lh).toFixed(1)}" text-anchor="middle">${esc(l)}</text>`).join("")}${n.link?`<circle class="lk" cx="${p.w-9}" cy="9" r="4"/>`:""}</g>`;}).join("");
  return `<svg class="cmap-svg" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${esc(m.title)}"><defs><marker id="cm-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ah"/></marker></defs><g class="vp"><rect class="bgr" x="0" y="0" width="${W}" height="${H}" rx="12"/>${paths.join("")}<g class="els">${labels.join("")}</g>${nodes}</g></svg>`;
}
function cmReversePath(pts,c){const q=pts.slice().reverse();let d=`M${q[0][0].toFixed(1)} ${q[0][1].toFixed(1)}`;
  for(let k=1;k<q.length;k++){const [x0,y0]=q[k-1],[x1,y1]=q[k];if(Math.abs(x1-x0)<0.5&&c.length>2&&k%2===0)d+=` L${x1.toFixed(1)} ${y1.toFixed(1)}`;else{const my=(y0+y1)/2;d+=` C${x0.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;}}return d;}
/* kept for any caller of the old API */
function mapSVG(m){const lay=cmLayout(m,5);return cmSVG(m,lay);}
function layoutMap(m){const lay=cmLayout(m,5);const pos={};m.nodes.forEach(n=>pos[n.id]={x:lay.P[n.id].x,y:lay.P[n.id].y});return {pos,W:lay.W,H:lay.H};}
const cmPref=(k,v)=>{try{if(v===undefined)return localStorage.getItem("galen.map."+k);localStorage.setItem("galen.map."+k,v);}catch(e){return null;}};

route("learn:maps","Concept maps",(root)=>{
  const by={};CMAPS.forEach(m=>(by[m.sys]||(by[m.sys]=[])).push(m));
  root.innerHTML=`<section class="ph"><span class="eyebrow">Concept maps</span><h1>See how it connects</h1><p class="lede">${CMAPS.length} maps from mechanism to bedside sign to decision. Pan and zoom the map, or read it as a list, step by step. Tap a concept for its note; the orange dot opens the page behind it.</p></section>
   ${Object.entries(by).map(([sys,L])=>`<section class="section"><span class="label">${SYS_NAME[sys]||sys}</span><div class="list">${L.map(m=>{const done=(Store.s.notes["map:"+m.id]||{}).done;return `<button class="lrow" data-go="learn/map/${m.id}"><span class="dot${done?" on":""}"></span><span class="txt"><b>${esc(m.title)}</b><span>${m.nodes.length} concepts · ${m.quiz.length} questions${done?" · understood":""}</span></span>${ic("chev","chev")}</button>`;}).join("")}</div></section>`).join("")}`;
});
route("learn:map",(id)=>(CMAPS.find(m=>m.id===id)||{}).title||"Map",(root,id,nid)=>{
  const m=CMAPS.find(x=>x.id===id);if(!m)throw new Error("Map not found");
  const byId={};m.nodes.forEach(n=>byId[n.id]=n);
  const used=new Set(m.nodes.map(n=>n.type));
  const vp0=cmPref("view");let view=vp0==="list"||vp0==="map"?vp0:(Math.min(window.innerWidth,document.documentElement.clientWidth||9999)<560?"list":"map"),sel=null,lay=null,per=0;
  const V={k:1,x:0,y:0};
  root.innerHTML=`<section class="ph"><span class="eyebrow">Concept map · ${SYS_NAME[m.sys]||m.sys}</span><h1>${esc(m.title)}</h1><p class="lede">${esc(m.intro)}</p></section>
   <div class="cm-bar"><div class="chips" role="group" aria-label="View"><button class="chip" data-view="map">${ic("map")}Map</button><button class="chip" data-view="list">${ic("log")}List, step by step</button></div>
    <ul class="cm-legend" aria-label="Key">${CM_TYPES.filter(([k])=>used.has(k)).map(([k,l])=>`<li><svg width="14" height="14" viewBox="0 0 12 12" class="cg t-${k}" aria-hidden="true">${CM_GLYPH[k]}</svg>${l}</li>`).join("")}<li><svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4" class="lk"/></svg>Opens a page</li></ul></div>
   <div class="cm-main"><div class="cm-stage" id="cm-stage" hidden><div class="cmap cm-box" id="mapbox" tabindex="0" aria-label="Concept map. Drag to pan, pinch or Ctrl and wheel to zoom, plus and minus keys zoom, arrow keys pan."></div>
     <div class="cm-tools"><div class="cm-ctl" role="group" aria-label="Zoom"><button class="btn sm ghost" data-z="in" aria-label="Zoom in">+</button><button class="btn sm ghost" data-z="out" aria-label="Zoom out">−</button><button class="btn sm ghost" data-z="fit">Fit</button><button class="btn sm ghost" data-z="one">100%</button></div>
     <p class="small muted cm-hint">Drag to move. Pinch, Ctrl and scroll, or the buttons to zoom. Tap a concept to focus it.</p></div></div>
    <div class="cm-list" id="cm-list" hidden></div>
    <aside class="card stack cm-note" id="mapnote" aria-live="polite" style="gap:8px"><p class="muted" style="margin:0">Tap a concept to see its note and its links.</p></aside></div>
   <div class="card stack" style="gap:10px"><span class="eyebrow">Check yourself</span>${m.quiz.map((q,i)=>`<details class="acc"><summary><span class="n">${i+1}</span><span class="st"><b>${esc(q.q)}</b></span></summary><div class="acc-body"><div>${esc(q.a)}</div></div></details>`).join("")}<button class="btn sm soft" id="mapdone">${(Store.s.notes["map:"+id]||{}).done?"Marked as understood":"I can explain this map"}</button></div>
   <div class="card stack" style="gap:8px" id="cm-drill"><span class="eyebrow">Name the link</span><p class="small" style="margin:0">Rebuild the reasoning from memory: Galen shows two concepts and you choose the link between them. The gaps you find are the cards that will come back in your session.</p><div id="cm-dq"></div><div class="row-x"><button class="btn sm" id="cm-dgo">Start</button><button class="btn sm ghost" id="maphide">Hide link labels</button></div></div>`;
  const stage=$("#cm-stage",root),box=$("#mapbox",root),list=$("#cm-list",root),note=$("#mapnote",root);
  const apply=()=>{const g=$(".vp",box);if(g)g.setAttribute("transform",`translate(${V.x.toFixed(1)} ${V.y.toFixed(1)}) scale(${V.k.toFixed(3)})`);box.classList.toggle("lod",V.k<0.7);};
  const bw=()=>box.clientWidth||Math.min(window.innerWidth-32,1100);
  const fit=(minK)=>{if(!lay)return;const w=bw();V.k=Math.max(minK==null?CM.minK:minK,Math.min(1.25,(w-8)/lay.W));if(minK!=null)V.k=Math.min(1.25,Math.max(0.35,Math.min((w-8)/lay.W,(box.clientHeight-8)/lay.H)));V.x=(w-lay.W*V.k)/2;V.y=4;
    if(lay.W*V.k>w){const r0=lay.rows[0].filter(id=>byId[id]);const rx=r0.reduce((s,id)=>s+lay.P[id].x,0)/Math.max(1,r0.length);V.x=w/2-rx*V.k;clampV();}apply();};
  const clampV=()=>{if(!lay)return;const w=bw(),h=box.clientHeight,mw=lay.W*V.k,mh=lay.H*V.k,mg=60;V.x=Math.min(Math.max(V.x,Math.min(mg,w-mw-mg)),Math.max(w-mw-mg,mg));V.y=Math.min(Math.max(V.y,Math.min(mg,h-mh-mg)),Math.max(h-mh-mg,mg));};
  const zoomAt=(f,cx,cy)=>{const k=Math.min(2.5,Math.max(0.35,V.k*f));const r=k/V.k;V.x=cx-(cx-V.x)*r;V.y=cy-(cy-V.y)*r;V.k=k;clampV();apply();};
  const build=(keep)=>{const w=bw();per=2;lay=null;for(let p=6;p>=2;p--){const L=cmLayout(m,p);if(L.W*CM.minK<=w-8||p===2){per=p;lay=L;break;}}box.innerHTML=cmSVG(m,lay);
    const vh=Math.min(Math.max(380,window.innerHeight*0.66),760);box.style.height=Math.min(vh,lay.H*Math.max(CM.minK,Math.min(1.25,(bw()-8)/lay.W))+12)+"px";
    if(!keep)fit();else{clampV();apply();}markSel();
    $$(".nd",box).forEach(g=>g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();show(g.dataset.n,true);}}));};
  const markSel=()=>{const svg=$("svg",box);if(!svg)return;svg.classList.toggle("focus",!!sel);
    const nb=new Set();if(sel)m.edges.forEach(e=>{if(e.from===sel)nb.add(e.to);if(e.to===sel)nb.add(e.from);});
    $$(".nd",box).forEach(g=>{g.classList.toggle("sel",g.dataset.n===sel);g.classList.toggle("nb",nb.has(g.dataset.n));g.setAttribute("aria-pressed",g.dataset.n===sel);});
    $$(".ed",box).forEach(p=>p.classList.toggle("on",!!sel&&(p.dataset.f===sel||p.dataset.t===sel)));
    $$(".el",box).forEach(t=>{const e=m.edges[+t.dataset.e];t.classList.toggle("on",!!sel&&e&&(e.from===sel||e.to===sel));});};
  const centreOn=nid=>{if(!lay||!lay.P[nid])return;const p=lay.P[nid];if(V.k<1)V.k=Math.min(1,Math.max(V.k,CM.minK));const w=bw(),h=box.clientHeight;V.x=w/2-p.x*V.k;V.y=h/2-(p.y+p.h/2)*V.k;clampV();box.classList.add("anim");apply();setTimeout(()=>box.classList.remove("anim"),320);};
  const relHTML=nid=>{const ins=m.edges.filter(e=>e.to===nid&&byId[e.from]),outs=m.edges.filter(e=>e.from===nid&&byId[e.to]);
    const b=(o,lbl,dir)=>`<button class="cm-rel" data-jump="${esc(o.id)}"><span class="cm-dir" aria-hidden="true">${dir==="from"?"↑":"↓"}</span><span><b>${esc(o.label)}</b>${lbl?`<i>${esc(lbl)}</i>`:""}</span></button>`
    return (ins.length?`<div class="cm-rels"><span class="small muted">Comes from</span>${ins.map(e=>b(byId[e.from],e.label,"from")).join("")}</div>`:"")+(outs.length?`<div class="cm-rels"><span class="small muted">Leads to</span>${outs.map(e=>b(byId[e.to],e.label,"to")).join("")}</div>`:"");};
  const show=(nid,centre)=>{const n=byId[nid];if(!n)return;sel=nid;markSel();const tl=(CM_TYPES.find(t=>t[0]===n.type)||[,n.type])[1];
    note.innerHTML=`<div class="row-x" style="justify-content:space-between"><span class="cm-type t-${esc(n.type)}"><svg width="14" height="14" viewBox="0 0 12 12" class="cg t-${esc(n.type)}" aria-hidden="true">${CM_GLYPH[n.type]||""}</svg>${esc(tl)}</span><button class="btn sm ghost" id="cm-clear" aria-label="Clear focus">Clear</button></div><h2>${esc(n.label)}</h2><p style="margin:0">${esc(n.note)}</p>${relHTML(nid)}${n.link?`<button class="btn sm" data-go="${esc(n.link)}">Open the page</button>`:""}`;
    $("#cm-clear",note).addEventListener("click",()=>{sel=null;markSel();note.innerHTML=`<p class="muted" style="margin:0">Tap a concept to see its note and its links.</p>`;});
    $$("[data-jump]",note).forEach(b=>b.addEventListener("click",()=>{const j=b.dataset.jump;if(view==="list"){openItem(j);}else{show(j,true);}}));
    if(view==="map"&&centre)centreOn(nid);
    if(window.innerWidth<1000&&view==="map"&&centre!==false){const r=note.getBoundingClientRect();if(r.top>window.innerHeight-80)note.scrollIntoView({behavior:"smooth",block:"nearest"});}};
  /* ---- list view: the same layers as steps ---- */
  const buildList=()=>{const L=cmLayout(m,99);const steps=L.rows.map(r=>r.filter(id=>byId[id])).filter(r=>r.length);
    list.innerHTML=`<ol class="cm-steps">${steps.map((r,si)=>{const types=[...new Set(r.map(id=>byId[id].type))];return `<li class="cm-step"><div class="cm-step-h"><span class="cm-sn">${si+1}</span><b>${types.map(t=>CM_TYPE_PL[t]||t).join(" and ")}</b></div>${r.map(id=>{const n=byId[id];const tl=(CM_TYPES.find(t=>t[0]===n.type)||[,n.type])[1];return `<details class="acc cm-item t-${esc(n.type)}" data-n="${esc(id)}"><summary><svg width="16" height="16" viewBox="0 0 12 12" class="cg t-${esc(n.type)}" aria-hidden="true">${CM_GLYPH[n.type]||""}</svg><span class="st"><b>${esc(n.label)}</b><span class="small muted">${esc(tl)}</span></span></summary><div class="acc-body stack" style="gap:8px"><p style="margin:0">${esc(n.note)}</p>${relHTML(id)}<div class="row-x">${n.link?`<button class="btn sm" data-go="${esc(n.link)}">Open the page</button>`:""}<button class="btn sm ghost" data-next="${esc(id)}">Next concept</button></div></div></details>`;}).join("")}</li>`;}).join("")}</ol>`;
    const order=steps.flat();
    $$("[data-jump]",list).forEach(b=>b.addEventListener("click",()=>openItem(b.dataset.jump)));
    $$("[data-next]",list).forEach(b=>b.addEventListener("click",()=>{const i=order.indexOf(b.dataset.next);if(i>=0&&i<order.length-1)openItem(order[i+1]);else toast("That is the last concept. Try the questions below.");}));
    $$("details.cm-item",list).forEach(d=>d.addEventListener("toggle",()=>{if(d.open){sel=d.dataset.n;}}));};
  const openItem=nid=>{const d=list.querySelector(`details[data-n="${CSS.escape(nid)}"]`);if(!d)return;$$("details.cm-item[open]",list).forEach(x=>{if(x!==d)x.open=false;});d.open=true;sel=nid;d.scrollIntoView({behavior:"smooth",block:"center"});const s=$("summary",d);if(s)s.focus({preventScroll:true});};
  const setView=(v,save)=>{view=v;if(save)cmPref("view",v);$$("[data-view]",root).forEach(b=>{const on=b.dataset.view===v;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);});
    stage.hidden=v!=="map";list.hidden=v!=="list";note.hidden=v==="list";root.classList.toggle("cm-listmode",v==="list");
    if(v==="map"){build(false);if(sel)show(sel,true);}else{buildList();if(sel)openItem(sel);}};
  $$("[data-view]",root).forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view,true)));
  /* ---- pointer: drag to pan, pinch to zoom, tap to focus ---- */
  const pts=new Map();let drag=null,pinch=null,moved=false;
  box.addEventListener("pointerdown",e=>{if(e.button>0)return;box.setPointerCapture&&box.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;box.dataset.active="1";
    if(pts.size===1)drag={x:e.clientX,y:e.clientY,vx:V.x,vy:V.y,t:e.target};
    else if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),k:V.k,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,vx:V.x,vy:V.y};drag=null;}});
  box.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const r=box.getBoundingClientRect();
    if(pinch&&pts.size>=2){const [a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const k=Math.min(2.5,Math.max(0.35,pinch.k*d/pinch.d));const cx=pinch.cx-r.left,cy=pinch.cy-r.top;const f=k/pinch.k;V.k=k;V.x=cx-(cx-pinch.vx)*f+((a.x+b.x)/2-pinch.cx);V.y=cy-(cy-pinch.vy)*f+((a.y+b.y)/2-pinch.cy);clampV();apply();moved=true;}
    else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>6)moved=true;if(moved){V.x=drag.vx+dx;V.y=drag.vy+dy;clampV();apply();box.classList.add("grab");}}});
  const end=e=>{const wasDrag=drag;pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!pts.size){box.classList.remove("grab");
      if(wasDrag&&!moved&&e.type==="pointerup"){const g=wasDrag.t.closest&&wasDrag.t.closest(".nd");if(g)show(g.dataset.n,true);}drag=null;}};
  box.addEventListener("pointerup",end);box.addEventListener("pointercancel",end);
  box.addEventListener("click",e=>{const g=e.target.closest(".nd");if(g&&e.detail===0)show(g.dataset.n,true);});/* keyboard/pad activation and synthetic clicks */
  box.addEventListener("wheel",e=>{if(!(e.ctrlKey||e.metaKey||box.dataset.active))return;e.preventDefault();const r=box.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0022)),e.clientX-r.left,e.clientY-r.top);},{passive:false});
  box.addEventListener("mouseleave",()=>{delete box.dataset.active;});
  box.addEventListener("keydown",e=>{if(e.target!==box&&!e.target.closest(".nd"))return;const s=60;const map={ArrowLeft:[s,0],ArrowRight:[-s,0],ArrowUp:[0,s],ArrowDown:[0,-s]};
    if(map[e.key]&&e.target===box){e.preventDefault();V.x+=map[e.key][0];V.y+=map[e.key][1];clampV();apply();}
    else if(e.key==="+"||e.key==="="){e.preventDefault();zoomAt(1.25,bw()/2,box.clientHeight/2);}else if(e.key==="-"){e.preventDefault();zoomAt(0.8,bw()/2,box.clientHeight/2);}
    else if(e.key==="0"){e.preventDefault();fit();}});
  $$("[data-z]",root).forEach(b=>b.addEventListener("click",()=>{const z=b.dataset.z;if(z==="in")zoomAt(1.25,bw()/2,box.clientHeight/2);else if(z==="out")zoomAt(0.8,bw()/2,box.clientHeight/2);else if(z==="fit")fit(0);else{V.k=1;clampV();apply();}}));
  /* simple fallback for pointer-less test clicks on a node (Playwright click dispatches pointer events too) */
  let rz=0,lastW=0;const onResize=()=>{clearTimeout(rz);rz=setTimeout(()=>{if(!root.isConnected){window.removeEventListener("resize",onResize);return;}const w=bw();if(view==="map"&&Math.abs(w-lastW)>40){lastW=w;build(false);}},180);};window.addEventListener("resize",onResize);
  $("#mapdone",root).addEventListener("click",()=>{Store.s.notes["map:"+id]={t:Date.now(),done:true};Store.save();tick(3,"read");Store.s.xp=(Store.s.xp||0)+5;Store.save();$("#mapdone",root).textContent="Marked as understood";toast("Nice. It will come back as questions.","good");});
  $("#maphide",root).addEventListener("click",e=>{const on=root.classList.toggle("cm-nolabels");e.target.textContent=on?"Show link labels":"Hide link labels";});
  /* ---- name-the-link drill ---- */
  const D={q:null,n:0,ok:0};const labelled=m.edges.filter(e=>e.label&&byId[e.from]&&byId[e.to]);
  const ask=()=>{const dq=$("#cm-dq",root);if(labelled.length<4){dq.innerHTML=`<p class="small muted">This map has too few named links for the drill.</p>`;return;}
    const e=pick(labelled);const others=shuf([...new Set(labelled.map(x=>x.label).filter(l=>l!==e.label))]).slice(0,3);const opts=shuf([e.label,...others]);D.q=e;
    dq.innerHTML=`<p style="margin:.2em 0"><b>${esc(byId[e.from].label)}</b> → ? → <b>${esc(byId[e.to].label)}</b></p><div class="opts">${opts.map(o=>`<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div><p class="small muted" style="margin:.4em 0 0">${D.ok} of ${D.n} so far</p>`;
    $$(".opt",dq).forEach(b=>b.addEventListener("click",()=>{if(b.disabled)return;const ok=b.dataset.o===e.label;if(typeof galenAnswer==="function")galenAnswer(ok);D.n++;if(ok)D.ok++;$$(".opt",dq).forEach(x=>{x.disabled=true;if(x.dataset.o===e.label)x.classList.add("ok");else if(x===b)x.classList.add("bad");});
      const p=document.createElement("div");p.className="row-x";p.style.marginTop="8px";p.innerHTML=`<button class="btn sm">Next</button><button class="btn sm ghost">Show on the map</button>`;dq.appendChild(p);
      p.children[0].addEventListener("click",ask);p.children[1].addEventListener("click",()=>{if(view!=="map")setView("map");show(e.from,true);});
      if(ok){Store.s.xp=(Store.s.xp||0)+1;Store.save();}const c=$(".small.muted",dq);if(c)c.textContent=`${ok?"Right":"Not quite"}: ${D.ok} of ${D.n} so far`;}));};
  $("#cm-dgo",root).addEventListener("click",e=>{e.target.textContent="New question";ask();});
  setView(view);
  if(nid&&byId[nid])show(nid,true);
});
/* ---------- spot diagnosis ---------- */
const SPOT={q:null,i:0,score:0,n:0};
function spotSubjects(){return [...DCOND.map(c=>({id:"d:"+c.id,n:c.n,g:c.g,terms:imgTermsFor(c.id)||[c.n],sys:"derm"})),...Object.entries(IMG_SUBJECTS).filter(([id,[n,t,sys]])=>!/diagram|anatomy|chart|regions|plexus|willis|cord/i.test(id)).map(([id,[n,t,sys]])=>({id:"s:"+id,n,g:SYS_NAME[sys]||sys,terms:t,sys}))];}
route("practice:spot","Spot diagnosis",(root)=>{
  const all=spotSubjects(),ready=all.filter(s=>Img.pool(s.id,s.terms).length);
  if(!SPOT.q){
    const online=typeof Img.online==="function"?Img.online():navigator.onLine!==false,can=Img.canUse(),nReady=typeof Img.readyCount==="function"?Img.readyCount(all):ready.length,enough=nReady>=4;
    const plates=`<div class="row-x"><button class="btn" data-go="practice/describe">${ic("eye")}Describe, then diagnose</button><button class="btn" data-go="practice/session/derm">Skin card session</button></div>`;
    let state="";
    if(!can)state=`<div class="note">Live photographs work in the installed Galen app. Here, practise with the drawn plates instead.</div>${plates}`;
    else if(enough)state=`<div class="row-x"><button class="btn" id="sp-go">${ic("eye")}Start 10</button><button class="btn soft" id="sp-build"${online?"":" disabled"}>Fetch photos for 12 more subjects</button></div>${online?"":`<p class="small muted">You are offline, so the round uses the ${nReady} subjects already on this device.</p>`}`;
    else state=`<div class="note">${online?(nReady?`Only ${nReady} subject${nReady===1?" has":"s have"} photos on this device; a round needs at least 4. Fetch a set (about a minute), or practise with the drawn plates instead.`:"No photos on this device yet. Fetch a set (about a minute), or practise with the drawn plates instead."):"No photos on this device yet: photos need a connection. Practise with the drawn plates instead."}</div>${plates}<div class="row-x"><button class="btn ghost" id="sp-go" disabled>${ic("eye")}Start 10</button><button class="btn ghost" id="sp-build"${online?"":" disabled"}>Fetch photos for 12 subjects</button></div>`;
    root.innerHTML=`<section class="ph"><span class="eyebrow">Practice · photographs</span><h1>Spot diagnosis</h1><p class="lede">A real photograph, four names. ${nReady} of ${all.length} subjects have photos ready on this device${can&&online?"; Galen fetches more as you play.":"."}</p>${state}</section>
     <div class="card"><div class="sec"><h3>How it teaches</h3><p class="small">Perceptual learning: many brief exposures with immediate feedback build pattern recognition faster than reading. Each photo you see links to its page, so a miss becomes a lesson. Pin the photos that teach you best in the library.</p></div></div>`;
    const go=$("#sp-go");if(go&&!go.disabled)go.addEventListener("click",()=>{const pool=all.filter(s=>Img.pool(s.id,s.terms).length);if(pool.length<4){render(false);return;}SPOT.q=shuf(pool).slice(0,10);SPOT.i=0;SPOT.score=0;SPOT.n=0;render(false);});
    const bd=$("#sp-build");if(bd&&!bd.disabled)bd.addEventListener("click",async()=>{bd.disabled=true;const pick=shuf(all.filter(s=>!Img.pool(s.id,s.terms).length)).slice(0,12);let k=0,fail=0;for(const s of pick){bd.textContent=`Fetching ${++k} of ${pick.length}…`;try{await Img.forSubject(s.terms.slice(0,2));}catch(e){fail++;if(fail>=2||navigator.onLine===false){toast(typeof Img.failText==="function"?Img.failText(e):"Photos could not be fetched just now. Try again on a better connection.","bad");break;}}}render(false);});
    return;
  }
  const s=SPOT.q[SPOT.i];if(!s){SPOT.q=null;render(false);return;}
  const pool=Img.pool(s.id,s.terms),it=pick(pool);if(!it){SPOT.i++;render(false);return;}
  const others=shuf(all.filter(x=>x.id!==s.id&&x.sys===s.sys)).slice(0,2).concat(shuf(all.filter(x=>x.id!==s.id&&x.sys!==s.sys)).slice(0,1));
  const opts=shuf([s,...others]);
  root.innerHTML=`<section class="ph"><div class="row-x"><span class="eyebrow">Spot diagnosis · ${SPOT.i+1} of ${SPOT.q.length}</span><span class="tag">${SPOT.score}/${SPOT.n}</span></div></section>
   <div class="card" style="padding:8px"><img class="spot-img" src="${esc(it.thumb)}" alt="Clinical photograph to identify"><p class="tiny muted" style="padding:6px 6px 0">${esc(it.author||"")}${it.lic?" · "+esc(it.lic):""}</p></div>
   <div class="opts" id="sp-opts">${opts.map(o=>`<button class="opt" data-id="${o.id}">${esc(o.n)}</button>`).join("")}</div><div id="sp-x"></div>`;
  const img=$(".spot-img",root);if(img)img.addEventListener("error",()=>{img.replaceWith(Object.assign(document.createElement("div"),{className:"note",textContent:"This photo could not load (it may need a connection). Skip it with Next."}));});
  $$("#sp-opts .opt").forEach(b=>b.addEventListener("click",()=>{if(b.disabled)return;const ok=b.dataset.id===s.id;if(typeof galenAnswer==="function")galenAnswer(ok);SPOT.n++;if(ok)SPOT.score++;$$("#sp-opts .opt").forEach(x=>{x.disabled=true;if(x.dataset.id===s.id)x.classList.add("ok");else if(x===b)x.classList.add("bad");});
    const go=s.id.startsWith("d:")?`learn/dcond/${s.id.slice(2)}`:(SIGNS[s.id.slice(2)]?`signs/sign/${s.id.slice(2)}`:`signs/imgsub/${s.id.slice(2)}`);
    $("#sp-x").innerHTML=`<div class="card stack" style="gap:8px"><div class="${ok?"good":"bad"}-box">${ok?"Correct":"It was "+esc(s.n)}</div>${it.desc?`<p class="small">${esc(it.desc)}</p>`:""}<div class="row-x"><button class="btn" id="sp-next">${SPOT.i+1<SPOT.q.length?"Next":"Finish"}</button><button class="btn ghost sm" data-go="${go}">Open the page</button></div></div>`;
    tick(1,"eye");Store.s.xp=(Store.s.xp||0)+(ok?2:1);Store.save();
    $("#sp-next").addEventListener("click",()=>{SPOT.i++;if(SPOT.i>=SPOT.q.length){toast(`Spot diagnosis: ${SPOT.score} of ${SPOT.n}`,"good");SPOT.q=null;}render(false);});}));
});
