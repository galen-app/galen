"use strict";
/* ================= HAND KIT: hold to explain · hold menus · swipe to grade · pull to sync · undo =================
 Every hold action also exists as a visible control; hold is a shortcut and an explainer. */
const Hands=(()=>{
  const HOLD_MS=460;let timer=null,start=null,held=false,bubble=null,sheet=null,moved=false;
  /* ---- hint sources: data-hint="Title|text", then a table by selector ---- */
  const TABLE=[
    [".lr",el=>{const t=el.textContent.trim();if(/^LR\+/.test(t))return["Positive likelihood ratio","How much a positive finding multiplies the odds of the diagnosis. 2–5 small, 5–10 moderate, > 10 large."];if(/^LR−/.test(t))return["Negative likelihood ratio","How much a negative finding lowers the odds. 0.5–0.2 small, 0.2–0.1 moderate, < 0.1 large."];if(/^Sn/.test(t))return["Sensitivity","Of 100 patients with the condition, how many test positive. High sensitivity means a negative result helps rule out."];if(/^Sp/.test(t))return["Specificity","Of 100 patients without the condition, how many test negative. High specificity means a positive result helps rule in."];return null;}],
    [".v",el=>({"v-core":["Core","Do it whenever the question arises: it moves probability enough, or it is cheap and decision-changing."],"v-useful":["Useful","Worth doing when the question is open; moderate accuracy."],"v-low":["Low yield","Weak or inconsistent evidence; know its limits."],"v-archaic":["Archaic","Historical or replaced by a better test or imaging."]})[[...el.classList].find(c=>c.startsWith("v-"))]||null],
    [".sync",()=>["Sync",Store.mode==="drive"?"Your progress is merged with Google Drive (My Apps/Galen) and every device.":Store.mode==="cloud"?"Progress is saved privately to your Claude account.":"Progress is saved in this browser. Sign in to Google in Tools to sync."]],
    [".ring",()=>["Mastery","Share of this area's cards held for a week or more (partial credit for 2–6 days)."]],
    [".week i",el=>["This week",el.title||"Days you studied. Any card, case or plate counts."]],
    ["#nav [data-tab]",el=>({today:["Today","Your daily round, streak and what Citrus planned."],learn:["Learn","Modules, dermatology, neurology, maps, history and memory."],signs:["Signs","Every sign with its evidence, illustration and photographs."],practice:["Practice","Sessions, drills, cases, localiser, plates and photographs."],tools:["Tools","Scores, labs, settings, Google and your data."]})[el.dataset.tab]],
    [".grades button",el=>({g0:["Again","Forgot it: it comes back in this session and the interval resets. Swipe ←."],g1:["Hard","Recalled with effort: a shorter interval. Swipe ↓."],g2:["Good","Recalled: the interval grows. Swipe →."],g3:["Easy","Instant: a much longer interval. Swipe ↑."]})[el.className]],
    [".pill.acc",el=>["New","A card you have not seen before."]],
    [".dot",el=>["Progress dot",el.classList.contains("on")?"Done or mastered.":"Not done yet."]],
    [".tag",el=>el.textContent.length<32?["Tag",el.textContent]:null]
  ];
  function hintFor(el){
    const h=el.closest("[data-hint]");if(h){const [t,...r]=h.dataset.hint.split("|");return [t,r.join("|")];}
    for(const [sel,fn] of TABLE){const m=el.closest(sel);if(m){const r=fn(m);if(r)return r;}}
    const a=el.closest("[aria-label],[title]");if(a&&(a.getAttribute("aria-label")||a.title))return [a.getAttribute("aria-label")||a.title,""];
    return null;
  }
  function showBubble(x,y,title,text){hideBubble();bubble=document.createElement("div");bubble.className="hint";bubble.innerHTML=`<b>${esc(title)}</b>${text?`<span>${esc(text)}</span>`:""}`;document.body.append(bubble);
    const r=bubble.getBoundingClientRect();let bx=clamp(x-r.width/2,8,innerWidth-r.width-8),by=y-r.height-18;if(by<8)by=y+18;bubble.style.left=bx+"px";bubble.style.top=by+"px";requestAnimationFrame(()=>bubble&&bubble.classList.add("in"));
    try{if(navigator.vibrate)navigator.vibrate(8);}catch(e){}}
  function hideBubble(){if(bubble){bubble.remove();bubble=null;}}
  /* ---- action sheets ---- */
  function openSheet(title,items){closeSheet();sheet=document.createElement("div");sheet.className="sheet-wrap";sheet.innerHTML=`<div class="sheet"><div class="sheet-h"><b>${esc(title)}</b></div>${items.map((it,i)=>`<button class="sheet-b${it.danger?" danger":""}" data-i="${i}">${it.icon?ic(it.icon):""}<span>${esc(it.label)}</span>${it.sub?`<small>${esc(it.sub)}</small>`:""}</button>`).join("")}<button class="sheet-b cancel">Cancel</button></div>`;
    document.body.append(sheet);requestAnimationFrame(()=>sheet&&sheet.classList.add("in"));
    sheet.addEventListener("click",e=>{if(e.target===sheet||e.target.closest(".cancel")){closeSheet();return;}const b=e.target.closest("[data-i]");if(b){const it=items[+b.dataset.i];closeSheet();try{it.run();}catch(x){console.warn(x);}}});
    const esc1=e=>{if(e.key==="Escape"){closeSheet();document.removeEventListener("keydown",esc1);}};document.addEventListener("keydown",esc1);}
  function closeSheet(){if(sheet){sheet.remove();sheet=null;}}
  function menuFor(el){
    const row=el.closest("[data-go]");
    if(row&&!el.closest(".fc")){const go=row.dataset.go,label=(row.querySelector("b")||row).textContent.trim().slice(0,60);const items=[{label:"Open",icon:"chev",run:()=>{const [t,v,a,b]=go.split("/");open(t,v,a,b);}}];
      const link=`${Hub.URL_PAGES}#${go}`;items.push({label:"Copy link",icon:"search",run:()=>{try{navigator.clipboard.writeText(link).then(()=>toast("Link copied","good"),()=>toast("Couldn't copy"));}catch(e){toast("Couldn't copy");}}});
      const m=go.match(/^signs\/sign\/(.+)$/);if(m&&SIGNS[m[1]]){const id=m[1];items.push({label:"Try in the LR calculator",icon:"scale",run:()=>open("signs","calc",id)});
        const allDone=["t:","v:","m:","ss:"].every(p=>{const r=Store.s.srs[p+id];return !r||r.iv>=30;});
        items.push({label:allDone?"Reset this sign's cards":"Mark as mastered (3 months)",icon:"check",sub:"Its cards move far ahead",run:()=>{["t:","v:","m:","ss:"].forEach(p=>{const cid=p+id;if(!CARDS.some(c=>c.id===cid))return;if(allDone)delete Store.s.srs[cid];else Store.s.srs[cid]={iv:90,ef:2.5,n:5,l:0,due:dayNum()+90,first:dayNum(),last:Date.now()};});Store.save();toast(allDone?"Cards reset":"Marked as mastered","good");render(false,true);}});}
      const d=go.match(/^learn\/dcond\/(.+)$/);if(d)items.push({label:"Spot diagnosis",icon:"eye",run:()=>open("practice","spot")});
      return {title:label,items};}
    const fc=el.closest(".fc");if(fc&&typeof SES!=="undefined"&&SES&&SES.queue[SES.i]){const c=SES.queue[SES.i];return {title:c.label,items:[{label:"Open the source page",icon:"chev",run:()=>{const [t,v,a,b]=cardHome(c).split("/");open(t,v,a,b);}},{label:"Bury for today",icon:"calendar",sub:"Comes back tomorrow",run:()=>{const r=Store.s.srs[c.id]||{iv:0,ef:2.5,n:0,l:0,due:dayNum(),first:dayNum()};r.due=dayNum()+1;r.last=Date.now();Store.s.srs[c.id]=r;Store.save();SES.queue.splice(SES.i,1);drawSession(V);toast("Buried");}},{label:"Mark as mastered (3 months)",icon:"check",run:()=>{Store.s.srs[c.id]={iv:90,ef:2.5,n:5,l:0,due:dayNum()+90,first:dayNum(),last:Date.now()};Store.save();SES.queue.splice(SES.i,1);drawSession(V);toast("Mastered","good");}}]};}
    return null;
  }
  /* ---- gesture engine ---- */
  function onDown(e){
    if(e.pointerType==="mouse"&&e.button!==0)return;
    const el=e.target;if(el.closest("input,select,textarea,.rng,.cmap,.bodymap,.nx,canvas,.lb,.sheet-wrap"))return;
    start={x:e.clientX,y:e.clientY,el,t:Date.now()};moved=false;held=false;
    clearTimeout(timer);timer=setTimeout(()=>{if(moved||!start)return;held=true;const menu=menuFor(el);
      if(menu&&(el.closest(".lrow,.fc,.chip,.tile,.dtile"))){openSheet(menu.title,menu.items);const row=el.closest(".lrow,.tile,.dtile,.chip");if(row){row.classList.add("held");setTimeout(()=>row.classList.remove("held"),300);}}
      else{const h=hintFor(el);if(h)showBubble(start.x,start.y,h[0],h[1]);else if(menu)openSheet(menu.title,menu.items);else held=false;}},HOLD_MS);
  }
  function onMove(e){if(!start)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>12){moved=true;clearTimeout(timer);}}
  function onUp(e){clearTimeout(timer);if(held){const stop=ev=>{ev.stopPropagation();ev.preventDefault();document.removeEventListener("click",stop,true);};document.addEventListener("click",stop,true);setTimeout(()=>document.removeEventListener("click",stop,true),400);setTimeout(hideBubble,1400);}start=null;}
  document.addEventListener("pointerdown",onDown,{passive:true});document.addEventListener("pointermove",onMove,{passive:true});document.addEventListener("pointerup",onUp,{passive:true});document.addEventListener("pointercancel",()=>{clearTimeout(timer);start=null;},{passive:true});
  document.addEventListener("scroll",()=>{clearTimeout(timer);hideBubble();},{passive:true,capture:true});
  /* ---- swipe to grade on flashcards ---- */
  let sw=null;
  document.addEventListener("touchstart",e=>{const fc=e.target.closest(".fc");if(!fc||e.touches.length!==1)return;if(e.target.closest("button,.opt,canvas,.sp"))return;const t=e.touches[0];sw={fc,x:t.clientX,y:t.clientY,dx:0,dy:0,label:null};},{passive:true});
  document.addEventListener("touchmove",e=>{if(!sw)return;const t=e.touches[0];sw.dx=t.clientX-sw.x;sw.dy=t.clientY-sw.y;const ax=Math.abs(sw.dx),ay=Math.abs(sw.dy);if(ax<14&&ay<14)return;
    if(!sw.label){sw.label=document.createElement("div");sw.label.className="swipe-l";sw.fc.append(sw.label);sw.fc.classList.add("swiping");}
    const shown=typeof SES!=="undefined"&&SES&&SES.shown,auto=SES&&SES.queue[SES.i]&&AUTO[SES.queue[SES.i].type];
    let txt="";if(!shown&&!auto)txt="Show answer";else if(shown){txt=ax>ay?(sw.dx>0?"Good →":"← Again"):(sw.dy<0?"↑ Easy":"↓ Hard");}
    sw.label.textContent=txt;sw.fc.style.transform=`translate(${sw.dx*.6}px,${sw.dy*.4}px) rotate(${sw.dx/40}deg)`;},{passive:true});
  document.addEventListener("touchend",()=>{if(!sw)return;const {fc,dx,dy}=sw;const ax=Math.abs(dx),ay=Math.abs(dy);fc.style.transform="";fc.classList.remove("swiping");if(sw.label)sw.label.remove();
    const big=Math.max(ax,ay)>80;const S=typeof SES!=="undefined"?SES:null;
    if(big&&S&&S.queue[S.i]){const auto=AUTO[S.queue[S.i].type];if(!S.shown&&!auto){const r=$("#reveal");if(r)r.click();}else if(S.shown){const g=ax>ay?(dx>0?2:0):(dy<0?3:1);fc.style.transition="transform .22s";fc.style.transform=`translate(${ax>ay?dx*4:0}px,${ax>ay?0:dy*4}px)`;setTimeout(()=>{fc.style.transition="";gradeCard(g);},180);
      const n=(+localStorage.getItem("galen.swipes")||0)+1;try{localStorage.setItem("galen.swipes",n);}catch(e){}}}
    sw=null;},{passive:true});
  /* ---- pull to sync (Today, at the top) ---- */
  let pull=null;const PULL=72;
  document.addEventListener("touchstart",e=>{if(NAV.tab!=="today"||window.scrollY>0||e.touches.length!==1)return;pull={y:e.touches[0].clientY,d:0,el:null};},{passive:true});
  document.addEventListener("touchmove",e=>{if(!pull)return;pull.d=e.touches[0].clientY-pull.y;if(pull.d<10){if(pull.el){pull.el.remove();pull.el=null;}return;}if(!pull.el){pull.el=document.createElement("div");pull.el.className="pull";document.body.append(pull.el);}pull.el.style.height=Math.min(PULL,pull.d*.5)+"px";pull.el.textContent=pull.d*.5>=PULL?"Release to sync":"Pull to sync";},{passive:true});
  document.addEventListener("touchend",()=>{if(!pull)return;const go=pull.d*.5>=PULL;if(pull.el)pull.el.remove();pull=null;if(go){toast("Syncing…");Hub.daily("force").then(()=>{toast(Store.status,Store.status==="Synced"?"good":"");if(cur().v==="home")render(false,true);});}},{passive:true});
  /* ---- undo snackbar ---- */
  function undo(msg,fn){const bar=document.createElement("div");bar.className="snack";bar.innerHTML=`<span>${esc(msg)}</span><button>Undo</button>`;document.body.append(bar);const t=setTimeout(()=>bar.remove(),4500);$("button",bar).addEventListener("click",()=>{clearTimeout(t);bar.remove();fn();});}
  return {openSheet,closeSheet,undo,hintFor};
})();
/* grade with undo: wrap gradeCard */
(()=>{const orig=gradeCard;window.gradeCard=function(g){const S=SES,c=S.queue[S.i];if(!c)return orig(g);const prev=Store.s.srs[c.id]?JSON.parse(JSON.stringify(Store.s.srs[c.id])):null,i=S.i,res=S.res.slice(),q=S.queue.slice(),rl=Object.assign({},S.relearn);
  orig(g);if(g===0)return;Store.s.xp=(Store.s.xp||0)+(g>=2?2:1);
  const n=+localStorage.getItem("galen.swipes")||0;if(n<5&&!document.querySelector(".swipe-tip")&&document.querySelector("#reveal")){const tip=document.createElement("p");tip.className="tiny muted swipe-tip";tip.style.textAlign="center";tip.textContent="Tip: swipe the card ← Again · ↓ Hard · → Good · ↑ Easy";const fc=document.querySelector(".fc");if(fc)fc.after(tip);}
  Hands.undo(["Again","Hard","Good","Easy"][g]+" recorded",()=>{if(prev)Store.s.srs[c.id]=prev;else delete Store.s.srs[c.id];S.i=i;S.res=res;S.queue=q;S.relearn=rl;Store.save();drawSession(V);});};})();
