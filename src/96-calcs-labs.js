"use strict";
/* ================= CALCULATORS AND LABS ================= */
const CALC_STATE={};
function evalExpr(expr,vars){
  /* tiny safe evaluator: numbers, identifiers, + - * / ( ) , and min max sqrt log pow exp */
  const toks=expr.match(/\d+\.?\d*|[A-Za-z_]\w*|[-+*/(),]/g)||[];let i=0;
  const peek=()=>toks[i],next=()=>toks[i++];
  const fns={min:Math.min,max:Math.max,sqrt:Math.sqrt,log:Math.log,pow:Math.pow,exp:Math.exp,abs:Math.abs,round:Math.round,floor:Math.floor};
  function prim(){const t=next();if(t==="("){const v=expr_();next();return v;}if(t==="-")return -prim();if(/^\d/.test(t))return parseFloat(t);
    if(/^[A-Za-z_]/.test(t)){if(peek()==="("){next();const args=[];if(peek()!==")"){args.push(expr_());while(peek()===","){next();args.push(expr_());}}next();if(!fns[t])throw new Error("fn "+t);return fns[t](...args);}if(!(t in vars))throw new Error("var "+t);return +vars[t];}
    throw new Error("bad token "+t);}
  function term(){let v=prim();while(peek()==="*"||peek()==="/"){const o=next();const r=prim();v=o==="*"?v*r:v/r;}return v;}
  function expr_(){let v=term();while(peek()==="+"||peek()==="-"){const o=next();const r=term();v=o==="+"?v+r:v-r;}return v;}
  return expr_();
}
const fmtNum=v=>Math.abs(v)>=100?Math.round(v):Math.abs(v)>=10?Math.round(v*10)/10:Math.round(v*100)/100;
/* bands may leave gaps between integers (0–449, 450–470): take the last band whose minimum the value reaches */
/* the first band is open below, the last open above: a formula result outside the listed range still gets the nearest end band */
function bandFor(t,v){if(v==null||!isFinite(v))return null;const bs=(t.bands||[]).slice().sort((x,y)=>x.min-y.min);let hit=null;for(const b of bs){if(v>=b.min)hit=b;}return hit||(t.kind==="formula"?bs[0]||null:null);}
/* numbers as people type them: Arabic-Indic and Persian digits, decimal comma or ٫ */
function parseNum(raw){if(raw==null)return null;let s=String(raw).trim();if(!s)return null;
  s=s.replace(/[\u0660-\u0669]/g,d=>String(d.charCodeAt(0)-0x660)).replace(/[\u06F0-\u06F9]/g,d=>String(d.charCodeAt(0)-0x6F0)).replace(/[\u2212\u2013]/g,"-").replace(/[\s\u066C']/g,"").replace(/[٫,]/g,".");
  if(/[^0-9.\-]/.test(s)||/.-/.test(s))return NaN;
  if(!s||s==="-"||s==="."||(s.match(/\./g)||[]).length>1)return NaN;const n=+s;return isFinite(n)?n:NaN;}
/* ---------- shared helpers for the calculators (D01) ---------- */
const CALC_GROUPS=["Acute care","Cardiac","VTE","Respiratory","Neuro","Trauma","MSK","Abdominal","Infection","Skin","Bloods and fluids","Kidney and drugs","Body size","Evidence"];
const signPts=p=>p>0?"+"+fmtNum(p):"−"+fmtNum(Math.abs(p));
/* round to the decimals the tool shows, so the band always matches the number on screen */
const calcRound=(t,v)=>t.dp!=null?Math.round(v*Math.pow(10,t.dp))/Math.pow(10,t.dp):fmtNum(v);
const calcShow=(t,v)=>t.dp!=null?calcRound(t,v).toFixed(t.dp):String(fmtNum(v));
const itemShort=it=>String(it.label).replace(/\s*\(.*$/,"").replace(/\?$/,"");
const calcVisible=(it,st)=>!it.when||st[it.when.k]===it.when.i;
/* band ranges in words: integer totals for scores; below / to / or more for formulas */
function bandRange(t,b,i){
  if(t.rule)return "";
  if(t.kind==="score")return b.min===b.max?`${b.min}`:`${b.min} to ${b.max}`;
  const bs=t.bands,u=t.unit&&t.unit.length<12?" "+t.unit:"";
  if(bs.length===1)return "";
  if(i===0)return `below ${bs[1].min}${u}`;
  if(i===bs.length-1)return `${b.min}${u} or more`;
  return `${b.min} to ${b.max}${u}`;
}
/* score state: total so far, the lowest and highest total still possible, and whether the band is already settled */
function scoreState(t,st){
  let total=0,lo=0,hi=0,answered=0,need=0;const flags=[];
  for(const it of t.items){
    const ctl=it.when?st[it.when.k]:null;
    if(it.when&&ctl!=null&&ctl!==it.when.i)continue;           /* hidden by its controller */
    const pts=it.opts.map(o=>o[1]);
    if(it.when&&ctl==null){lo+=Math.min(...pts);hi+=Math.max(...pts);continue;} /* may still appear */
    need++;
    if(st[it.k]!=null&&it.opts[st[it.k]]){const p=it.opts[st[it.k]][1];answered++;total+=p;lo+=p;hi+=p;if(t.single&&p===t.single.pts)flags.push(it);}
    else{lo+=Math.min(...pts);hi+=Math.max(...pts);}
  }
  const bLo=bandFor(t,lo),bHi=bandFor(t,hi),complete=answered===need&&!t.items.some(it=>it.when&&st[it.when.k]==null);
  const settled=complete?bandFor(t,total):(bLo&&bLo===bHi?bLo:null);
  return {total,answered,need,complete,settled,flags};
}
function calcNoteLine(t,st,res){
  const d=fmtDate(Date.now());
  if(t.kind==="score"){
    const vis=t.items.filter(it=>calcVisible(it,st)&&st[it.k]!=null&&it.opts[st[it.k]]);
    let parts;
    if(t.items.some(it=>it.n))parts=vis.map(it=>`${it.n||itemShort(it)}${it.opts[st[it.k]][1]}`).join(" ");
    else{const pos=vis.filter(it=>it.opts[st[it.k]][1]!==0).map(it=>{const o=it.opts[st[it.k]][0];return /^(yes|present|absent|altered)\b/i.test(o)||it.opts.length===2?itemShort(it):`${itemShort(it)}: ${o}`;});parts=pos.length?pos.join("; "):"no items positive";}
    const b=res.settled;
    return `${t.name}${t.rule?"":" "+fmtNum(res.total)}${parts?` (${parts})`:""}${b?`: ${b.label}`:""}. ${d}`;
  }
  const ins=t.inputs.map(inp=>{const v=st[inp.k];if(inp.opts){const o=inp.opts.find(o=>o[1]===+v);return o?o[0].toLowerCase():"";}const u=st["_u_"+inp.k]&&inp.alt?inp.alt.unit:inp.unit;return `${itemShort(inp).toLowerCase()} ${v}${u?" "+u:""}`;}).filter(Boolean).join(", ");
  const ex=(res.extra||[]).map(x=>`${x.label.toLowerCase()} ${x.v}${x.unit?" "+x.unit:""}`).join("; ");
  return `${t.name} ${res.shown}${t.unit?" "+t.unit:""} (${ins})${res.band?`: ${res.band.label}`:""}${ex?`. ${ex}`:""}. ${d}`;
}
route("tools:calcs","Scores",(root,group)=>{
  const present=new Set(TOOLS.map(t=>t.group));
  const groups=[...CALC_GROUPS.filter(g=>present.has(g)),...[...present].filter(g=>!CALC_GROUPS.includes(g))];group=group||"all";
  const row=t=>`<button class="lrow" data-go="tools/calc/${t.id}" data-s="${esc((t.name+" "+t.use+" "+t.group+" "+t.id).toLowerCase())}" data-g="${esc(t.group)}"><span class="icwrap">${ic(t.kind==="score"?"scale":"bolt")}</span><span class="txt"><b>${esc(t.name)}</b><span>${esc(t.use)}</span></span>${ic("chev","chev")}</button>`;
  root.innerHTML=`<section class="ph"><span class="eyebrow">Tools</span><h1>Scores and calculators</h1><p class="lede">${TOOLS.length} tools. Each gives the result first, what it means and what to do, with its source and a line for the notes.</p></section>
   <label class="calc-search"><span class="sr-only">Find a score or calculator</span>${ic("search")}<input class="inp" id="c-q" type="search" placeholder="Find: Wells, NEWS2, eGFR, burns…" autocomplete="off" enterkeyhint="search"></label>
   <div class="chips" id="cg">${[["all","All"],...groups.map(g=>[g,g])].map(([k,l])=>`<button class="chip${group===k?" on":""}" aria-pressed="${group===k}" data-g="${esc(k)}">${esc(l)}</button>`).join("")}</div>
   <div class="list" id="c-list">${TOOLS.map(row).join("")}</div><p class="muted small" id="c-none" hidden>Nothing matches. Try a shorter word.</p>`;
  const q=$("#c-q",root);
  const apply=()=>{const s=q.value.trim().toLowerCase();let n=0;$$("#c-list .lrow",root).forEach(r=>{const ok=(group==="all"||r.dataset.g===group)&&(!s||s.split(/\s+/).every(w=>r.dataset.s.includes(w)));r.hidden=!ok;if(ok)n++;});$("#c-none",root).hidden=n>0;};
  q.addEventListener("input",apply);
  $("#cg").addEventListener("click",e=>{const b=e.target.closest("[data-g]");if(!b)return;group=b.dataset.g;$$("#cg .chip",root).forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on);});const top=cur();top.a=group==="all"?undefined:group;apply();});
  apply();
});
route("tools:calc",(id)=>(TOOLS.find(t=>t.id===id)||{}).name||"Calculator",(root,id)=>{
  const t=TOOLS.find(x=>x.id===id);if(!t)throw new Error("Tool not found");
  const st=CALC_STATE[id]||(CALC_STATE[id]={});
  const cleanLabel=l=>String(l).replace(/\s*\((?:[0-9] = [^)]*)\)/g,"");
  const srcShort=String(t.src||"").split(";")[0];
  const kindWord=t.rule?"decision rule":t.kind==="score"?"score":"calculator";
  let lastRes=null;
  /* ---- formula inputs: displayed unit, converted to SI for the sum ---- */
  const unitOf=inp=>st["_u_"+inp.k]&&inp.alt?inp.alt.unit:inp.unit;
  const conv=inp=>st["_u_"+inp.k]&&inp.alt?inp.alt.mul:1;
  const rng=inp=>{const m=conv(inp),r=x=>+(x/m).toPrecision(3);return [r(inp.min),r(inp.max)];};
  const resCard=(inner,cls="")=>`<div class="card calc-res ${cls}" aria-live="polite">${inner}</div>`;
  const tail=line=>`<div class="calc-note"><span class="small muted">For the notes</span><p class="mono small" id="c-line">${esc(line)}</p><div class="row-x"><button class="btn sm soft" data-copy>Copy for the notes</button><span class="small muted">Source: ${esc(srcShort)}</span></div></div>`;
  const resultHTML=()=>{
    if(t.kind==="score"){
      const r=scoreState(t,st);lastRes=r;
      const flag=r.flags.length&&t.single&&(!r.settled||r.total<5)?`<div class="calc-flag" role="alert"><b>${esc(t.single.label)}: ${esc(r.flags.map(itemShort).join(", "))}.</b> ${esc(t.single.text)}</div>`:"";
      const head=(word,val,sub)=>`<div class="calc-top"><span class="eyebrow">${word}</span>${val!=null?`<b class="calc-val mono">${esc(val)}</b>`:""}${sub?`<span class="small muted">${sub}</span>`:""}</div>`;
      if(!r.settled){
        const msg=t.ruleout?`<p class="calc-band calc-inc"><b>Incomplete: cannot rule out yet.</b> Answer every item below. An unanswered item is not a "no".</p>`:`<p class="calc-band calc-inc"><b>Incomplete.</b> Answer every item below before reading the result. An unanswered item is not a "no".</p>`;
        return resCard(head(r.answered?"So far":"Start below",t.rule||!r.answered?null:fmtNum(r.total),`${r.answered} of ${r.need} answered`)+msg+flag,"is-inc");
      }
      const b=r.settled,early=!r.complete?`<p class="small muted" style="margin:0">Already decided: the items still unanswered cannot change this.</p>`:"";
      return resCard(head(t.rule?"Decision":"Total",t.rule?null:fmtNum(r.total),r.complete?"":`${r.answered} of ${r.need} answered`)+`<p class="calc-band"><b class="calc-lab">${esc(b.label)}</b><span>${esc(b.text)}</span></p>`+early+flag+tail(calcNoteLine(t,st,r)));
    }
    const vals={},bad=[];
    for(const inp of t.inputs){let v=st[inp.k];if(v==null&&inp.default!=null)v=inp.default;
      if(v==null||v===""){lastRes=null;return resCard(`<div class="calc-top"><span class="eyebrow">Result</span></div><p class="calc-band calc-inc">Fill in every field below.</p>`,"is-inc");}
      if(inp.opts){vals[inp.k]=+v;continue;}
      const [lo,hi]=rng(inp),u=unitOf(inp);
      if(!isFinite(v)){bad.push(`${cleanLabel(inp.label)}: not a number`);continue;}
      if(v<lo||v>hi)bad.push(`${cleanLabel(inp.label)}: ${fmtNum(v)} is outside ${lo} to ${hi}${u?" "+u:""}. Check the value and the unit.`);
      vals[inp.k]=v*conv(inp);}
    if(bad.length){lastRes=null;return resCard(`<div class="calc-top"><span class="eyebrow">Result</span></div><div class="note"><b>Check the inputs.</b><br>${bad.map(esc).join("<br>")}</div>`,"is-inc");}
    try{const raw=evalExpr(t.expr,vals);if(!isFinite(raw))throw new Error("no result for these values");
      const v=calcRound(t,raw),b=bandFor(t,v),shown=calcShow(t,raw);
      const extra=(t.extra||[]).map(x=>{const e=evalExpr(x.expr,vals);return {label:x.label,unit:x.unit,v:isFinite(e)?(x.dp!=null?(Math.round(e*Math.pow(10,x.dp))/Math.pow(10,x.dp)).toFixed(x.dp):fmtNum(e)):"–"};});
      const r={shown,band:b,extra};lastRes=r;
      return resCard(`<div class="calc-top"><span class="eyebrow">Result</span><b class="calc-val mono">${esc(shown)}</b><span class="small muted">${esc(t.unit||"")}</span></div>${b?`<p class="calc-band"><b class="calc-lab">${esc(b.label)}</b><span>${esc(b.text)}</span></p>`:`<p class="calc-band">No interpretation band for this value; check the inputs.</p>`}${extra.length?`<dl class="calc-extra">${extra.map(x=>`<div><dt>${esc(x.label)}</dt><dd class="mono">${esc(x.v)} <span class="muted">${esc(x.unit||"")}</span></dd></div>`).join("")}</dl>`:""}`+tail(calcNoteLine(t,st,r)));}
    catch(e){lastRes=null;return resCard(`<div class="note">Check the inputs (${esc(e.message)}).</div>`,"is-inc");}
  };
  const barHTML=()=>{if(t.kind!=="score")return "";const r=lastRes;if(!r)return "";
    const what=r.settled?(t.rule?r.settled.label:`${fmtNum(r.total)}: ${r.settled.label}`):(t.rule||!r.answered?"Incomplete":`So far ${fmtNum(r.total)}, incomplete`);
    return `<span class="mono small">${r.answered}/${r.need}</span><b>${esc(what)}</b><span class="small calc-bar-go">Result ${ic("chev","chev")}</span>`;};
  const drawRes=()=>{
    const box=$("#c-res",root);if(!box)return;box.innerHTML=resultHTML();
    const bar=$("#c-bar",root);if(bar){bar.innerHTML=barHTML();bar.classList.toggle("done",!!(lastRes&&lastRes.settled));}
    const c=$("[data-copy]",box);if(c)c.addEventListener("click",()=>{const s=$("#c-line",box).textContent;const ok=()=>toast("Copied for the notes","good"),no=()=>{const sel=window.getSelection(),rg=document.createRange();rg.selectNodeContents($("#c-line",box));sel.removeAllRanges();sel.addRange(rg);toast("Selected: copy it with your keyboard");};try{(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(ok,no);}catch(e){no();}});
    if(t.kind==="formula")t.inputs.forEach(inp=>{if(inp.opts)return;const el=$(`input[data-k="${inp.k}"]`,root),er=$(`[data-err="${inp.k}"]`,root);if(!el||!er)return;const v=st[inp.k],[lo,hi]=rng(inp);
      const msg=v==null?"":!isFinite(v)?"Not a number":(v<lo||v>hi)?`Outside ${lo} to ${hi} ${unitOf(inp)||""}`:"";er.textContent=msg;el.setAttribute("aria-invalid",msg?"true":"false");});
  };
  const itemHTML=it=>`<div class="cq" role="group" aria-label="${esc(it.label)}" data-item="${esc(it.k)}"${calcVisible(it,st)?"":" hidden"}>
     <div class="cq-h">${it.tag?`<span class="cq-tag">${esc(it.tag)}</span>`:""}<span class="cq-l">${esc(it.label)}</span>${it.hint?`<span class="cq-hint">${esc(it.hint)}</span>`:""}</div>
     <div class="cq-o">${it.opts.map((o,i)=>`<button class="chip cq-c${st[it.k]===i?" on":""}" aria-pressed="${st[it.k]===i}" data-k="${esc(it.k)}" data-i="${i}"><span>${esc(o[0])}</span>${o[1]&&!t.rule?`<span class="mono cq-p">${signPts(o[1])}</span>`:""}</button>`).join("")}</div></div>`;
  const inputHTML=inp=>{const v=st[inp.k]!=null?st[inp.k]:(inp.default!=null?inp.default:null);
    if(inp.opts)return `<div class="cq" role="group" aria-label="${esc(cleanLabel(inp.label))}"><div class="cq-h"><span class="cq-l">${esc(cleanLabel(inp.label))}</span></div><div class="cq-o">${inp.opts.map(o=>`<button class="chip cq-c${v===o[1]?" on":""}" aria-pressed="${v===o[1]}" data-k="${esc(inp.k)}" data-v="${o[1]}">${esc(o[0])}</button>`).join("")}</div></div>`;
    const [lo,hi]=rng(inp),u=unitOf(inp);
    return `<div class="cin"><label class="cin-l" for="ci-${esc(inp.k)}">${esc(cleanLabel(inp.label))}</label>
      <div class="cin-row"><input class="inp cin-i" id="ci-${esc(inp.k)}" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="next" data-k="${esc(inp.k)}" value="${v!=null&&isFinite(v)?v:""}" placeholder="${lo} to ${hi}" aria-describedby="ce-${esc(inp.k)}">
      ${inp.alt?`<div class="seg cin-u" data-uk="${esc(inp.k)}" role="group" aria-label="Unit"><button data-u="0" aria-pressed="${!st["_u_"+inp.k]}">${esc(inp.unit)}</button><button data-u="1" aria-pressed="${!!st["_u_"+inp.k]}">${esc(inp.alt.unit)}</button></div>`:u?`<span class="cin-unit">${esc(u)}</span>`:""}</div>
      <span class="cin-err" id="ce-${esc(inp.k)}" data-err="${esc(inp.k)}" aria-live="polite"></span></div>`;};
  const drawForm=()=>{
    const body=t.kind==="score"?t.items.map(itemHTML).join(""):t.inputs.map(inputHTML).join("");
    root.innerHTML=`<section class="ph"><span class="eyebrow">${esc(t.group)} · ${kindWord}</span><h1>${esc(t.name)}</h1><p class="lede">${esc(t.use)}</p></section>
     <div id="c-res" class="calc-resbox"></div>
     <div class="card calc-form">${body}</div>
     ${t.kind==="score"?`<button class="calc-bar" id="c-bar" type="button" aria-label="Go to the result"></button>`:""}
     ${t.note?`<div class="card"><div class="note"><b>Before you rely on it.</b> ${esc(t.note)}</div></div>`:""}
     <details class="acc calc-more"><summary><b>All bands${t.kind==="formula"?" and the formula":""}</b></summary><div class="stack" style="gap:8px;padding:4px 0 12px">${(t.bands||[]).map((b,i)=>{const r=bandRange(t,b,i);return `<div class="lm"><b>${esc(b.label)}${r?` <span class="muted small">(${esc(r)})</span>`:""}</b><span>${esc(b.text)}</span></div>`;}).join("")}${t.kind==="formula"&&t.formula?`<p class="small"><b>Formula.</b> ${esc(t.formula)}</p>`:""}</div></details>
     <p class="small muted">Source: ${esc(t.src||"")}</p>
     <div class="row-x"><button class="btn sm ghost" id="c-reset">Clear</button></div>`;
    $$("[data-k][data-i]",root).forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.k,i=+b.dataset.i;st[k]=st[k]===i?null:i;
      $$(`[data-k="${k}"][data-i]`,root).forEach(x=>{const on=st[k]===+x.dataset.i;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on);});
      t.items.forEach(it=>{if(!it.when)return;const el=$(`[data-item="${it.k}"]`,root),vis=calcVisible(it,st);if(el)el.hidden=!vis;if(!vis&&st[it.k]!=null){st[it.k]=null;$$(`[data-k="${it.k}"][data-i]`,root).forEach(x=>{x.classList.remove("on");x.setAttribute("aria-pressed","false");});}});
      drawRes();}));
    $$("[data-k][data-v]",root).forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.k;st[k]=+b.dataset.v;
      $$(`[data-k="${k}"][data-v]`,root).forEach(x=>{const on=st[k]===+x.dataset.v;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on);});drawRes();}));
    $$("input[data-k]",root).forEach((el,i,all)=>{el.addEventListener("input",()=>{const n=parseNum(el.value);st[el.dataset.k]=n==null?null:n;drawRes();});
      el.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();const nx=all[i+1];if(nx)nx.focus();else el.blur();}});});
    $$("[data-uk]",root).forEach(g=>g.addEventListener("click",e=>{const b=e.target.closest("[data-u]");if(!b)return;const k=g.dataset.uk,inp=t.inputs.find(x=>x.k===k);st["_u_"+k]=b.dataset.u==="1"?1:0;
      $$("button",g).forEach(x=>x.setAttribute("aria-pressed",x===b));const el=$(`input[data-k="${k}"]`,root),[lo,hi]=rng(inp);if(el)el.placeholder=`${lo} to ${hi}`;drawRes();}));
    const bar=$("#c-bar",root);
    if(bar&&"IntersectionObserver" in window){const io=new IntersectionObserver(es=>es.forEach(e=>bar.classList.toggle("off",e.isIntersecting)),{threshold:0.35});io.observe($("#c-res",root));}
    if(bar)bar.addEventListener("click",()=>{const r=$("#c-res",root);r.scrollIntoView({behavior:"smooth",block:"start"});const c=$("[data-copy]",r);if(c)c.focus({preventScroll:true});});
    $("#c-reset").addEventListener("click",()=>{CALC_STATE[id]={};render(false,true);});
    drawRes();
  };
  drawForm();
});
/* ---------- labs ---------- */
route("tools:labs","Labs",(root)=>{
  const L=typeof LABS!=="undefined"?LABS:[];
  root.innerHTML=`<section class="ph"><span class="eyebrow">Labs at the bedside</span><h1>What the numbers add</h1><p class="lede">Each panel says what it answers, the patterns that matter, how it ties to the examination, and where it misleads.</p></section>
   <div class="list">${L.map(p=>`<button class="lrow" data-go="tools/lab/${p.id}"><span class="icwrap">${ic("log")}</span><span class="txt"><b>${esc(p.name)}</b><span>${esc((p.intro||"").split(/(?<=\.)\s/)[0])}</span></span>${ic("chev","chev")}</button>`).join("")}${L.length?"":`<div class="empty">Lab panels are being written.</div>`}</div>`;
});
route("tools:lab",(id)=>((typeof LABS!=="undefined"&&LABS.find(p=>p.id===id))||{}).name||"Lab",(root,id)=>{
  const p=LABS.find(x=>x.id===id);if(!p)throw new Error("Panel not found");
  root.innerHTML=`<section class="ph"><span class="eyebrow">Labs</span><h1>${esc(p.name)}</h1><p class="lede">${esc(p.intro)}</p></section>
   <div class="card stack" style="gap:10px"><span class="eyebrow">Values</span>${(p.items||[]).map(it=>`<div class="lm"><b>${esc(it.n)} <span class="mono tiny muted">${esc(it.ref||"")}</span></b><span>${esc(it.meaning||"")}</span>${it.high?`<span><i>High:</i> ${esc(it.high)}</span>`:""}${it.low?`<span><i>Low:</i> ${esc(it.low)}</span>`:""}</div>`).join("")}</div>
   <div class="card stack" style="gap:10px"><span class="eyebrow">Patterns</span>${(p.patterns||[]).map(x=>`<div class="lm"><b>${esc(x.name)}</b><span><i>See:</i> ${esc(x.see)}</span><span><i>Think:</i> ${esc(x.think)}</span>${x.do?`<span><i>Do:</i> ${esc(x.do)}</span>`:""}</div>`).join("")}</div>
   ${p.bedside&&p.bedside.length?`<div class="card stack" style="gap:8px"><span class="eyebrow">Ties to the examination</span><ul class="prose" style="padding-left:1.1em">${p.bedside.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""}
   ${p.pitfalls&&p.pitfalls.length?`<div class="card stack" style="gap:8px"><span class="eyebrow">Traps</span><ul class="prose" style="padding-left:1.1em">${p.pitfalls.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""}
   <p class="small muted">Sources: ${(p.src||[]).map(esc).join(" · ")}</p>`;
});
