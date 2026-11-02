"use strict";
/* ================= UTILITIES ================= */
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>[...el.querySelectorAll(s)];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function shuf(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const pick=a=>a[Math.floor(Math.random()*a.length)];
let _toastT;
function toast(msg,kind){
  let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";t.setAttribute("role","status");document.body.append(t);}
  t.className="toast"+(kind?" "+kind:"");t.textContent=msg;t.hidden=false;
  clearTimeout(_toastT);_toastT=setTimeout(()=>{t.hidden=true;},2400);
}
const IC={
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  bone:'<path d="M7 4a2.5 2.5 0 0 0-2.4 3.2A2.5 2.5 0 0 0 6 11.9l6.1 6.1a2.5 2.5 0 0 0 4.7 1.4 2.5 2.5 0 0 0 3.2-2.4 2.5 2.5 0 0 0-1.9-2.4L12 8.4A2.5 2.5 0 0 0 7 4z"/>',
  today:'<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  learn:'<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  signs:'<path d="M9 3h6M10 3v5.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9.5V3"/><path d="M7.5 14h9"/>',
  sounds:'<path d="M2 12h3l2-6 3 12 3-9 2 5 2-2h5"/>',
  practice:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',chev:'<path d="M9 5l7 7-7 7"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7"/>',
  repeat:'<path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2"/><path d="M20 4v4h-4M4 20v-4h4"/>',
  bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  shuffle:'<path d="M4 7h3c5 0 5 10 10 10h3M4 17h3c1.6 0 2.7-1 3.6-2.4M20 7h-3c-1.6 0-2.7 1-3.6 2.4"/><path d="M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  mind:'<path d="M9 4a4 4 0 0 0-4 4v1a3 3 0 0 0 0 6v1a4 4 0 0 0 7 2.6V5.4A4 4 0 0 0 9 4zM15 4a4 4 0 0 1 4 4v1a3 3 0 0 1 0 6v1a4 4 0 0 1-7 2.6"/>',
  log:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  flame:'<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3.6 3-5.4 3.6-9 2.7 1.6 4.4 4 4.4 6.5 1-1 1.5-2 1.6-3.3 2 1.6 3.4 3.6 3.4 5.8 0 3.4-2.5 6-6.5 6z"/>',
  ear:'<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M10 9.5a2 2 0 0 1 4 0"/>',
  case:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M12 11v5M9.5 13.5h5"/>',
  scale:'<path d="M12 4v16M5 20h14M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z"/>',
  card:'<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v11"/>',
  play:'<path d="M8 5.5v13l11-6.5z"/>',
  history:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  map:'<path d="M6 3c-1 3-2 6-2 10 0 5 3 8 8 8s8-3 8-8c0-4-1-7-2-10"/><circle cx="10" cy="10" r="1.5"/><circle cx="15" cy="14" r="1.5"/>',
  compare:'<rect x="3" y="5" width="7" height="14" rx="1.5"/><rect x="14" y="5" width="7" height="14" rx="1.5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  pocket:'<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 6h4M9 10h6M9 13.5h6M9 17h3"/>'
};
const ic=(k,cls="")=>`<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]||""}</svg>`;
function ring(p,size=44,stroke=5,label){
  const r=(size-stroke)/2,C=2*Math.PI*r,v=clamp(p,0,1);
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${Math.round(v*100)}%">
   <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--surface2)" stroke-width="${stroke}"/>
   ${v>0.005?"":"<!--empty-->"}<circle ${v>0.005?"":'display="none"'} cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--accent)" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(C*v).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${size/2} ${size/2})"/>
   ${label!=null?`<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" class="ring-t">${label}</text>`:""}</svg>`;
}
