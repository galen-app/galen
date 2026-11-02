"use strict";
/* ================= REMEMBER IT FOREVER (page) ================= */
const MN_BY_SIGN={};MNEMONICS.forEach((m,i)=>m[3].forEach(k=>(MN_BY_SIGN[k]||(MN_BY_SIGN[k]=[])).push(i)));
function memoryBlock(id){
  const s=SIGNS[id]||{},mn=(MN_BY_SIGN[id]||[]).map(i=>MNEMONICS[i]);
  if(!s.hook&&!mn.length)return "";
  return `<div class="card stack hookcard" style="gap:10px"><span class="eyebrow">${ic("mind")} Remember it</span>${s.hook?`<p class="hook">${esc(s.hook)}</p>`:""}${mn.map(([t,m,x])=>`<div class="lm"><b>${esc(m)}</b><span class="small muted">${esc(t)}</span><span>${esc(x)}</span></div>`).join("")}</div>`;
}
route("learn:memory","Remember it",(root)=>{
  root.innerHTML=`<section class="ph"><span class="eyebrow">Memory</span><h1>Remember it forever</h1><p class="lede">${esc(MEMORY.intro)}</p></section>
   <div class="stack" style="gap:10px">${MEMORY.rules.map((r,i)=>`<details class="acc"${i<2?" open":""}><summary><span class="n">${pad2(i+1)}</span><span class="st"><b>${esc(r.t)}</b><span>${esc(r.how)}</span></span></summary><div class="acc-body"><div>${esc(r.d)}</div><div><span class="k">In this app</span>${esc(r.how)}</div></div></details>`).join("")}</div>
   <section class="section"><span class="label">Your memory palace: the examination route</span><p class="small muted">Walk this route in your head, in order, and 'see' each sign where it lives. Every real examination then rehearses the palace.</p>
    <div class="palace">${MEMORY.palace.map(([p,d,ids],i)=>`<div class="room"><span class="rn">${i+1}</span><div class="stack" style="gap:6px"><b>${esc(p)}</b><span class="small">${esc(d)}</span><div class="chips">${ids.filter(k=>SIGNS[k]).map(signChip).join("")}</div></div></div>`).join("")}</div></section>
   <section class="section"><span class="label">Checked mnemonics</span><p class="small muted">A mnemonic is a hook, not the knowledge: always pair it with the 'why'.</p>
    <div class="card stack" style="gap:12px">${MNEMONICS.map(([t,m,x,ids])=>`<div class="lm"><b>${esc(m)}</b><span class="small muted">${esc(t)}</span><span>${esc(x)}</span>${ids.length?`<div class="chips" style="margin-top:4px">${ids.filter(k=>SIGNS[k]).slice(0,4).map(signChip).join("")}</div>`:""}</div>`).join("")}</div></section>
   <div class="row-x"><button class="btn" data-go="practice/session">${ic("calendar")}Start today's session</button><button class="btn soft" data-go="practice/rehearse">${ic("mind")}Rehearse a routine</button></div>`;
});
