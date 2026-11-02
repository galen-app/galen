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
function bandFor(t,v){return (t.bands||[]).find(b=>v>=b.min&&v<=b.max)||null;}
route("tools:calcs","Scores",(root,group)=>{
  const groups=[...new Set(TOOLS.map(t=>t.group))];group=group||"all";
  const L=TOOLS.filter(t=>group==="all"||t.group===group);
  root.innerHTML=`<section class="ph"><span class="eyebrow">Tools</span><h1>Scores and calculators</h1><p class="lede">${TOOLS.length} tools that show their working and what the result means, each with its source. Use them at the bedside; learn them from the cards.</p></section>
   <div class="chips" id="cg">${[["all","All"],...groups.map(g=>[g,g])].map(([k,l])=>`<button class="chip${group===k?" on":""}" data-g="${k}">${l}</button>`).join("")}</div>
   <div class="list">${L.map(t=>`<button class="lrow" data-go="tools/calc/${t.id}"><span class="icwrap">${ic(t.kind==="score"?"scale":"bolt")}</span><span class="txt"><b>${esc(t.name)}</b><span>${esc(t.use)}</span></span>${ic("chev","chev")}</button>`).join("")}</div>`;
  $("#cg").addEventListener("click",e=>{const b=e.target.closest("[data-g]");if(b)replace("calcs",b.dataset.g);});
});
route("tools:calc",(id)=>(TOOLS.find(t=>t.id===id)||{}).name||"Calculator",(root,id)=>{
  const t=TOOLS.find(x=>x.id===id);if(!t)throw new Error("Tool not found");
  const st=CALC_STATE[id]||(CALC_STATE[id]={});
  const draw=()=>{
    let result="",body="";
    if(t.kind==="score"){
      const total=t.items.reduce((a,it)=>a+(st[it.k]!=null?it.opts[st[it.k]][1]:0),0),answered=t.items.filter(it=>st[it.k]!=null).length;
      body=t.items.map(it=>`<div class="dcat"><span class="k">${esc(it.label)}</span><div class="chips">${it.opts.map((o,i)=>`<button class="chip${st[it.k]===i?" on":""}" data-k="${it.k}" data-i="${i}">${esc(o[0])}${o[1]?` <span class="mono tiny">+${o[1]}</span>`:""}</button>`).join("")}</div></div>`).join("");
      const b=bandFor(t,total);
      result=`<div class="card stack" style="gap:6px"><div class="row-x"><span class="eyebrow">Total</span><b class="big mono">${total}</b>${answered<t.items.length?`<span class="small muted">${answered}/${t.items.length} answered</span>`:""}</div>${b?`<p><b>${esc(b.label)}.</b> ${esc(b.text)}</p>`:""}</div>`;
    }else{
      body=t.inputs.map(inp=>{const v=st[inp.k]!=null?st[inp.k]:(inp.default!=null?inp.default:null);
        if(inp.opts)return `<div class="dcat"><span class="k">${esc(inp.label)}</span><div class="chips">${inp.opts.map((o,i)=>`<button class="chip${v===o[1]?" on":""}" data-k="${inp.k}" data-v="${o[1]}">${esc(o[0])}</button>`).join("")}</div></div>`;
        return `<label class="fld"><span>${esc(inp.label)}${inp.unit?` <span class="muted">(${esc(inp.unit)})</span>`:""}</span><input class="inp" type="number" inputmode="decimal" data-k="${inp.k}" min="${inp.min}" max="${inp.max}" step="${inp.step||"any"}" value="${v!=null?v:""}" placeholder="${inp.min}–${inp.max}"></label>`;}).join("");
      const ready=t.inputs.every(inp=>st[inp.k]!=null&&st[inp.k]!=="");
      if(ready){try{const v=evalExpr(t.expr,st);const b=bandFor(t,v);result=`<div class="card stack" style="gap:6px"><div class="row-x"><span class="eyebrow">Result</span><b class="big mono">${isFinite(v)?fmtNum(v):"–"}</b><span class="small muted">${esc(t.unit||"")}</span></div>${b?`<p><b>${esc(b.label)}.</b> ${esc(b.text)}</p>`:""}</div>`;}catch(e){result=`<div class="note">Check the inputs (${esc(e.message)}).</div>`;}}
      else result=`<div class="card"><p class="muted">Fill every field.</p></div>`;
    }
    root.innerHTML=`<section class="ph"><span class="eyebrow">${esc(t.group)} · ${t.kind==="score"?"score":"formula"}</span><h1>${esc(t.name)}</h1><p class="lede">${esc(t.use)}</p></section>
     <div class="card stack" style="gap:14px">${body}</div>${result}
     ${t.kind==="formula"?`<p class="small muted mono">${esc(t.expr)}</p>`:""}
     ${t.note?`<div class="card"><div class="note"><b>Note.</b> ${esc(t.note)}</div></div>`:""}
     <div class="card stack" style="gap:6px"><span class="eyebrow">Bands</span>${(t.bands||[]).map(b=>`<div class="lm"><b>${esc(b.label)} <span class="mono tiny muted">${b.min}–${b.max}</span></b><span>${esc(b.text)}</span></div>`).join("")}</div>
     <p class="small muted">Source: ${esc(t.src||"")}</p>
     <div class="row-x"><button class="btn sm ghost" id="c-reset">Clear</button></div>`;
    $$("[data-k][data-i]",root).forEach(b=>b.addEventListener("click",()=>{st[b.dataset.k]=+b.dataset.i;draw();}));
    $$("[data-k][data-v]",root).forEach(b=>b.addEventListener("click",()=>{st[b.dataset.k]=+b.dataset.v;draw();}));
    $$("input[data-k]",root).forEach(el=>el.addEventListener("input",()=>{st[el.dataset.k]=el.value===""?null:+el.value;const y=window.scrollY;const a=document.activeElement;draw();window.scrollTo(0,y);const n=$(`input[data-k="${el.dataset.k}"]`,root);if(n){n.focus();}}));
    $("#c-reset").addEventListener("click",()=>{CALC_STATE[id]={};render(false,true);});
  };
  draw();
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
