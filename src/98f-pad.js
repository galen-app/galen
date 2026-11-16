"use strict";
/* Galen theatre: keyboard shortcuts, the gamepad (Steam Deck), dialogs, help overlay, on-screen controller legend, right-click and hold twins.
   Gamepad model: the screen has areas (main page, side rail, reference pane, top bar). The d-pad walks inside the current area;
   at the edge it steps into the neighbouring area, and L2/R2 (F6 on a keyboard) cycle the areas. Inside a session the face buttons
   become grades. Every dialog traps focus and gives it back when it closes. */

/* ================= DIALOGS: focus trap, inert background, focus return ================= */
const MODAL={stack:[],last:null};
const MODAL_SEL=".helpov,.pal-back,.sheet-wrap,[data-modal]";
function modalTop(){MODAL.stack=MODAL.stack.filter(m=>m.el.isConnected);const d=$("dialog[open]");if(d&&d.matches(":modal"))return d;const t=MODAL.stack[MODAL.stack.length-1];return t?t.el:null;}
const routeSig=()=>{try{const r=cur();return NAV.tab+":"+r.v+":"+(r.a||"")+":"+(r.b||"");}catch(e){return "";}};
function setInert(on){$$("body > .shell, body > nav.nav").forEach(x=>{try{x.inert=on;}catch(e){}});}
document.addEventListener("focusin",e=>{const t=e.target;if(!t||!t.closest)return;if(!t.closest(MODAL_SEL))MODAL.last=t;if(typeof PAD!=="undefined"){PAD.last[zoneOf(t)]=t;padLegend();}});
new MutationObserver(ms=>{for(const m of ms){
  m.addedNodes.forEach(n=>{if(n.nodeType!==1||!n.matches(MODAL_SEL))return;
    const a=document.activeElement;const opener=a&&a!==document.body&&!a.closest(MODAL_SEL)?a:MODAL.last;
    MODAL.stack.push({el:n,opener,route:routeSig()});const dlg=n.matches("[role=dialog]")?n:$("[role=dialog]",n)||n;
    if(!dlg.hasAttribute("role"))dlg.setAttribute("role","dialog");dlg.setAttribute("aria-modal","true");setInert(true);padLegend(true);});
  m.removedNodes.forEach(n=>{if(n.nodeType!==1)return;const i=MODAL.stack.findIndex(x=>x.el===n);if(i<0)return;const [it]=MODAL.stack.splice(i,1);
    if(MODAL.stack.some(x=>x.el.isConnected)){padLegend(true);return;}setInert(false);
    const a=document.activeElement;const lost=!a||a===document.body||!a.isConnected;
    if(lost||n.contains(a)){const o=it.opener;
      if(it.route===routeSig()&&o&&o.isConnected&&padShown(o))o.focus({preventScroll:true});
      else if(document.documentElement.classList.contains("pad"))setTimeout(padPrimary,30);}
    padLegend(true);});}}).observe(document.body,{childList:true});
/* Tab and Shift+Tab stay inside the open dialog */
document.addEventListener("keydown",e=>{if(e.key!=="Tab")return;const m=modalTop();if(!m||m.tagName==="DIALOG")return;
  const list=padFocusables(m);if(!list.length){e.preventDefault();return;}const i=list.indexOf(document.activeElement);
  if(i<0){e.preventDefault();list[0].focus();return;}
  if(e.shiftKey&&i===0){e.preventDefault();list[list.length-1].focus();}else if(!e.shiftKey&&i===list.length-1){e.preventDefault();list[0].focus();}},true);

/* ================= HELP OVERLAY ================= */
function helpOverlay(){const old=$(".helpov[data-help]");if(old){old.remove();return;}
  const el=document.createElement("div");el.className="helpov";el.dataset.help="1";el.setAttribute("role","dialog");el.setAttribute("aria-labelledby","help-h");
  const pad=padConnected();
  const K=(...k)=>k.map(x=>`<kbd>${x}</kbd>`).join(" ");const B=(...b)=>b.map(x=>`<span class="pg pg-${x.toLowerCase().replace(/[^a-z0-9]/g,"")}">${x}</span>`).join(" ");
  const sec=(cap,rows)=>`<table><caption>${cap}</caption><thead><tr><th scope="col">Action</th><th scope="col">Keyboard</th><th scope="col">Controller</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table>`;
  el.innerHTML=`<div class="card stack help-card" style="gap:12px"><div class="row-x"><h2 id="help-h">Keys and controller</h2><span class="spacer"></span><button class="iconbtn" data-x aria-label="Close">${ic("close")}</button></div>
  <p class="small muted" style="margin:0">Mouse, keyboard, touch and a gamepad all work at once.${pad?` Controller connected: ${esc(pad)}.`:" Connect a controller (the Steam Deck's own works) and the button hints appear at the bottom of the screen."}</p>
  ${sec("Everywhere",[
   ["Choose",K("Enter"),B("A")],["Back, or close a dialog",K("Esc"),B("B")],
   ["Move",`${K("Tab")}, arrows in lists`,"D-pad or left stick"],
   ["Jump to a section",`${K("Alt 1")} to ${K("Alt 5")}`,"Step with L1 and R1"],["Previous or next section",K("[")+" "+K("]"),B("L1")+" "+B("R1")],
   ["Next area: page, rail, reference, top bar",K("F6")+" (Shift for back)",B("L2")+" "+B("R2")+", or the d-pad at the edge"],
   ["Search",`${K("/")} or ${K("Ctrl K")}`,B("Menu")+" (≡). Type with Steam + X"],
   ["Play, pause or reveal",K("Space"),B("X")],["Theatre sound on or off",K("M"),B("Y")],
   ["Explain a label, chip or row (same as holding it, or right-click)",`${K("Shift F10")} or the menu key`,"Hold "+B("A")],
   ["Scroll",`${K("PgUp")} ${K("PgDn")}`,"Right stick (scrolls the pane or dialog you are in)"],
   ["Show or hide the reference pane",K("R"),"Click the right stick (R3)"],["This help",K("?"),B("View")+" (⧉)"]])}
  ${sec("In a session",[
   ["Show the answer",`${K("Space")} or ${K("Enter")}`,B("X")+" or "+B("A")],
   ["Again · Hard · Good · Easy",`${K("1")} ${K("2")} ${K("3")} ${K("4")}`,B("B")+" "+B("X")+" "+B("A")+" "+B("Y")+" (A takes the grade in focus; Good is focused first)"],
   ["Answer a question",`${K("1")} to ${K("9")}, then ${K("Enter")}`,"D-pad, then "+B("A")],["A hint",K("H"),B("X")+" before you answer"],
   ["Undo the last grade",`${K("U")} or ${K("Ctrl Z")}`,B("L1")],["Leave the session",K("Esc"),B("Menu")+" (≡). B never leaves a session"]])}
  <p class="tiny muted" style="margin:0">In drills: ${K("Space")} or ${B("X")} plays the sound, ${K("1")} to ${K("9")} or the d-pad and ${B("A")} answer.</p></div>`;
  document.body.append(el);el.addEventListener("click",e=>{if(e.target===el||e.target.closest("[data-x]"))el.remove();});setTimeout(()=>$("[data-x]",el)?.focus(),10);}
function tabStep(d){const tabs=TABS.filter(t=>!t[3]).map(t=>t[0]);const i=tabs.indexOf(typeof navTab==="function"?navTab():NAV_PARENT[NAV.tab]||NAV.tab);switchTab(tabs[(i+d+tabs.length)%tabs.length]);}
/* a help button in the top bar, so help is not only behind a key */
{const sb=$("#searchbtn");if(sb&&!$("#helpbtn")){const b=document.createElement("button");b.className="iconbtn";b.id="helpbtn";b.setAttribute("aria-label","Keys and controller (press ?)");b.title="Keys and controller (?)";
  b.innerHTML=`<span class="qmark" aria-hidden="true">?</span>`;b.addEventListener("click",helpOverlay);sb.before(b);}}
const undoSnack=()=>{if(!$(".snack"))return false;if(typeof Hands!=="undefined"&&Hands.undoNow&&Hands.undoNow())return true;const b=$(".snack button");if(b){b.click();return true;}return false;};

/* ================= KEYBOARD ================= */
const HOLD_TARGET=".railbrand,.brandmark,[data-pad-hold]";
const HOLD_EGG="[data-egg-medal],.railbrand,.brandmark";
function synthHold(el,ms){const r=el.getBoundingClientRect(),o={bubbles:true,cancelable:true,clientX:Math.round(clamp(r.left+r.width/2,1,innerWidth-1)),clientY:Math.round(clamp(r.top+r.height/2,1,innerHeight-1)),pointerType:"touch",isPrimary:true,button:0};
  el.dispatchEvent(new PointerEvent("pointerdown",o));const up=()=>el.dispatchEvent(new PointerEvent("pointerup",o));if(ms)setTimeout(up,ms);return up;}
let _kHold=null,_ctxKey=0;
/* close the dialog on top: help or an egg, the search palette, a hold menu, a native dialog */
function padCloseTop(){const m=modalTop();if(!m)return false;if(m.tagName==="DIALOG"){m.close();return true;}
  if(m.classList.contains("pal-back")){closePalette();return true;}if(m.classList.contains("sheet-wrap")){if(typeof Hands!=="undefined"&&Hands.closeSheet)Hands.closeSheet();else m.remove();return true;}
  const x=$("[data-x]",m);if(x&&m.classList.contains("helpov")){m.remove();return true;}m.remove();return true;}
document.addEventListener("keydown",e=>{const t=e.target,typing=/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable;
  if(e.key==="Escape"){if(!modalTop())return;e.preventDefault();e.stopImmediatePropagation();padCloseTop();return;}
  if(e.key==="F6"){e.preventDefault();padZoneStep(e.shiftKey?-1:1,true);return;}
  if((e.key==="F10"&&e.shiftKey)||e.key==="ContextMenu"){const a=document.activeElement;if(a&&a!==document.body&&!typing){e.preventDefault();_ctxKey=performance.now();synthHold(a,700);}return;}
  if(typing)return;
  if(e.altKey&&/^[1-5]$/.test(e.key)){e.preventDefault();const tabs=TABS.filter(x=>!x[3]).map(x=>x[0]);switchTab(tabs[+e.key-1]);return;}
  if(e.ctrlKey||e.metaKey){if(e.key.toLowerCase()==="z"&&!e.shiftKey&&undoSnack())e.preventDefault();return;}
  if(e.altKey)return;
  if(e.key==="?"){e.preventDefault();helpOverlay();return;}
  if(modalTop())return;
  if(e.key==="m"||e.key==="M"){toggleSound();return;}
  if(e.key==="["||e.key==="]"){e.preventDefault();tabStep(e.key==="["?-1:1);return;}
  if((e.key==="u"||e.key==="U")&&undoSnack()){e.preventDefault();e.stopImmediatePropagation();return;}
  if((e.key==="r"||e.key==="R")&&wide()){e.preventDefault();rpToggle();return;}
  if((e.key==="Enter"||e.key===" ")&&t.matches&&t.matches(HOLD_TARGET)){e.preventDefault();if(!e.repeat&&!_kHold)_kHold={el:t,t:performance.now(),up:synthHold(t)};return;}
  if((e.key==="Enter"||e.key===" ")&&t.matches&&t.matches("g[data-go],g[data-egg],[role=link][data-go],svg [role=button]")){e.preventDefault();padActivate(t);}
},true);
document.addEventListener("keyup",e=>{if(!_kHold||(e.key!=="Enter"&&e.key!==" "))return;const h=_kHold;_kHold=null;h.up();if(performance.now()-h.t<450)padActivate(h.el);},true);
/* eggs that hide in the engraving can be found by keyboard and pad too (they stay unlabelled, as secrets should) */
function eggReach(){$$("[data-egg]").forEach(g=>{if(g.getAttribute("tabindex")!=="0")g.setAttribute("tabindex","0");});
  const rb=$("#nav .railbrand");if(rb&&!rb.hasAttribute("tabindex")){rb.setAttribute("tabindex","0");if(!rb.getAttribute("role"))rb.setAttribute("role","button");if(!rb.getAttribute("aria-label"))rb.setAttribute("aria-label","Galen");}}
{let t=0;new MutationObserver(()=>{if(t)return;t=requestAnimationFrame(()=>{t=0;eggReach();});}).observe($("#view")||document.body,{childList:true,subtree:true});eggReach();}

/* ================= GAMEPAD ================= */
const PAD={alive:false,raf:0,prev:{},t:0,dir:null,rep:false,zone:"main",last:{},seq:[],aDown:null,ctx:"",legend:null,id:""};
const PAD_FOC='button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[data-egg]';
function padConnected(){try{const g=[...(navigator.getGamepads?navigator.getGamepads():[])].find(Boolean);return g?String(g.id||"a controller").replace(/\s*\(.*$/,"").slice(0,40)||"a controller":"";}catch(e){return "";}}
/* visible, and not inside a closed <details> (its own summary is fine) */
function padShown(el){if(!el||!el.isConnected||el.closest("[hidden],[inert]")||el.matches(".skiplink"))return false;
  for(let d=el.closest("details");d;d=d.parentElement&&d.parentElement.closest("details")){if(!d.open&&!(el.tagName==="SUMMARY"&&el.parentElement===d))return false;}
  if(el.checkVisibility&&!el.checkVisibility({visibilityProperty:true,checkVisibilityCSS:true}))return false;
  const r=el.getBoundingClientRect();if(r.width<=0||r.height<=0)return false;return getComputedStyle(el).visibility!=="hidden";}
function padFocusables(root){return $$(PAD_FOC,root||document).filter(padShown);}
/* kept for older callers: the focusable things you can reach now (inside the open dialog if there is one) */
function focusables(){const m=modalTop();return m?padFocusables(m):padFocusables(document).filter(el=>!el.closest(MODAL_SEL));}
const ZONES=["top","rail","main","pane"];
function zoneOf(el){if(!el||!el.closest)return "main";const m=modalTop();if(m&&m.contains(el))return "modal";if(el.closest("#refpane"))return "pane";if(el.closest("nav.nav"))return "rail";if(el.closest("header.top"))return "top";return "main";}
function zoneEl(z){return z==="pane"?$("#refpane"):z==="rail"?$("nav.nav"):z==="top"?$("header.top"):z==="modal"?modalTop():$("#view");}
function zoneList(z){if(z==="modal"){const m=modalTop();return m?padFocusables(m):[];}
  if(z==="main")return padFocusables(document).filter(el=>zoneOf(el)==="main"&&!el.closest(MODAL_SEL));const c=zoneEl(z);return c?padFocusables(c):[];}
{const set=()=>{const n=$("nav.nav");if(!n)return;const r=n.getBoundingClientRect();document.documentElement.style.setProperty("--rail-w",(r.height>r.width?Math.round(r.right):0)+"px");};set();addEventListener("resize",set);}
const topH=()=>{const t=$("header.top");return t?t.getBoundingClientRect().bottom:0;};
const inView=el=>{const r=el.getBoundingClientRect();return r.bottom>topH()+4&&r.top<innerHeight-4;};
function padFocus(el){if(!el)return;try{el.focus({preventScroll:true});}catch(e){}el.scrollIntoView({block:"nearest",inline:"nearest"});PAD.zone=zoneOf(el);padLegend();}
/* the main action of the screen you are on, so A does the obvious thing */
const PAD_PRIMARY=['.grades [data-g="2"]',"#nextc","#dnext","#reveal","#go","#nx","[data-pad-primary]"];
function padPrimary(){if(modalTop())return false;for(const s of PAD_PRIMARY){const el=$("#view "+s);if(el&&padShown(el)){padFocus(el);return true;}}return false;}
function padEnterZone(z,from){const list=zoneList(z);if(!list.length)return false;
  const mem=PAD.last[z];if(mem&&list.includes(mem)&&(z!=="main"||inView(mem))){padFocus(mem);return true;}
  if(z==="main"&&!from&&padPrimary())return true;
  let best=null;
  if(from){const fr=from.getBoundingClientRect(),fy=fr.top+fr.height/2;let bs=1e9;for(const el of list){const r=el.getBoundingClientRect();if(!inView(el)&&z!=="rail")continue;const d=Math.abs(r.top+r.height/2-fy);if(d<bs){bs=d;best=el;}}}
  if(!best)best=list.find(el=>inView(el)&&!el.closest(".progress-top"))||list.find(inView)||list[0];padFocus(best);return true;}
function padZoneStep(d,announce){const m=modalTop();if(m){const l=padFocusables(m);if(l.length)padFocus(l[0]);return;}
  const avail=ZONES.filter(z=>zoneList(z).length);if(!avail.length)return;let i=avail.indexOf(zoneOf(document.activeElement));if(i<0)i=avail.indexOf("main");
  for(let k=1;k<=avail.length;k++){const z=avail[(i+d*k+avail.length*4)%avail.length];if(padEnterZone(z)){if(announce||true)padFlash(z);return;}}}
function padFlash(z){const c=zoneEl(z);if(!c)return;c.classList.remove("zone-flash");void c.offsetWidth;c.classList.add("zone-flash");setTimeout(()=>c.classList.remove("zone-flash"),700);}
/* spatial walk: edge distances, a strong preference for things lined up with you (the WICG spatial-navigation idea) */
function padSpatial(a,list,dx,dy){const A=a.getBoundingClientRect();let best=null,bs=Infinity;
  for(const el of list){if(el===a||el.contains(a)||a.contains(el))continue;const B=el.getBoundingClientRect();
    const ca=dx?(B.left+B.right-A.left-A.right)/2*dx:(B.top+B.bottom-A.top-A.bottom)/2*dy;if(ca<=4)continue;
    /* its centre must lie past your own edge, so a wide search bar does not "go left" to the portrait below it */
    const bc=dx?(B.left+B.right)/2:(B.top+B.bottom)/2;if(dx>0?bc<A.right-2:dx<0?bc>A.left+2:dy>0?bc<A.bottom-2:bc>A.top+2)continue;
    const gap=Math.max(0,dx>0?B.left-A.right:dx<0?A.left-B.right:dy>0?B.top-A.bottom:A.top-B.bottom);
    const across=dx?Math.max(0,Math.max(A.top,B.top)-Math.min(A.bottom,B.bottom)):Math.max(0,Math.max(A.left,B.left)-Math.min(A.right,B.right));
    const cc=dx?Math.abs((B.top+B.bottom-A.top-A.bottom)/2):Math.abs((B.left+B.right-A.left-A.right)/2);
    const sc=gap+across*2+(across>0?40:0)+cc*.05+ca*.01;if(sc<bs){bs=sc;best=el;}}
  return best;}
function railSide(){const n=$("nav.nav");if(!n)return true;const r=n.getBoundingClientRect();return r.height>r.width;}
function padMove(dx,dy){padOn();const m=modalTop();const a=document.activeElement;
  const ok=a&&a!==document.body&&padShown(a)&&(m?m.contains(a):!a.closest(MODAL_SEL))&&a.matches(PAD_FOC);
  if(!ok){if(m){const l=padFocusables(m);if(l.length)padFocus(l[0]);}else padEnterZone(PAD.zone&&zoneList(PAD.zone).length?PAD.zone:"main");return;}
  const z=zoneOf(a);
  /* the right stick may have scrolled your focus off screen: start again from what you can see */
  if(z==="main"&&!inView(a)){const l=zoneList("main").filter(inView);if(l.length){padFocus(dy<0?l[l.length-1]:l[0]);return;}}
  /* sliders and menus take left and right */
  if(dx&&a.matches("input[type=range]")){dx>0?a.stepUp():a.stepDown();a.dispatchEvent(new Event("input",{bubbles:true}));a.dispatchEvent(new Event("change",{bubbles:true}));return;}
  if(dx&&a.tagName==="SELECT"){const i=clamp(a.selectedIndex+dx,0,a.options.length-1);if(i!==a.selectedIndex){a.selectedIndex=i;a.dispatchEvent(new Event("input",{bubbles:true}));a.dispatchEvent(new Event("change",{bubbles:true}));}return;}
  const zl=zoneList(z);
  /* inside the engraved theatre, the doors (and whatever hides among them) come first */
  const ring=a.matches(".door,[data-egg]")?padSpatial(a,zl.filter(el=>el.matches(".door,[data-egg]")),dx,dy):null;
  const best=ring||padSpatial(a,zl,dx,dy);if(best){padFocus(best);return;}
  let hop=null;const side=railSide(),paneOn=zoneList("pane").length>0;
  if(z==="main"){if(dx<0&&side)hop="rail";else if(dy>0&&!side)hop="rail";else if(dx>0&&paneOn)hop="pane";else if(dy<0)hop="top";}
  else if(z==="rail"){if((side&&dx>0)||(!side&&dy<0))hop="main";}
  else if(z==="pane"){if(dx<0)hop="main";}
  else if(z==="top"){if(dy>0)hop="main";else if(dx<0&&side)hop="rail";}
  if(hop&&padEnterZone(hop,a))padFlash(hop);}
function padKey(key){const t=document.activeElement||document.body;t.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true,cancelable:true}));}
function padActivate(el){if(!el||el===document.body){padMove(0,1);return;}
  if(el.matches("input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]),textarea")){el.focus();return;}
  if(typeof el.click==="function")el.click();else el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));}
function padOn(){const de=document.documentElement;if(!de.classList.contains("pad")){de.classList.add("pad");padLegend(true);}}
/* what the face buttons mean right now */
function padCtx(){if(PAL)return "pal";if(modalTop())return "modal";let r;try{r=cur();}catch(e){return "main";}const k=NAV.tab+":"+r.v;
  if(k==="practice:session"&&typeof SES!=="undefined"&&SES&&!SES.finished&&SES.queue[SES.i]){const c=SES.queue[SES.i];
    if(typeof AUTO!=="undefined"&&AUTO[c.type])return SES.answered==null?"mcq":$("#view #fb [data-g]")?"mcqgrade":"next";return SES.shown&&$("#view .grades [data-g]")?"grade":"card";}
  if(k==="practice:drill"&&typeof DR!=="undefined"&&DR&&r.a){if(DR.phase==="q")return "drill";if(DR.phase==="fb")return "drillnext";}
  return "main";}
const gradeBtn=g=>{const b=$(`#view .grades [data-g="${g}"]`);if(b){b.click();return true;}return false;};
/* the old code on the pad must not also press B (back) and A (open) underneath the reward */
const KONAMI=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
function padCode(k){PAD.seq.push(k);if(PAD.seq.length>10)PAD.seq.shift();let gc=false;try{gc=typeof galenCode==="function"&&galenCode(k)===true;}catch(e){}
  /* 98d says when the key is the code's B or A ending; our own record of the sequence is the fallback */
  if(gc&&(k==="a"||k==="b"))return true;const n=PAD.seq.length,want=k==="b"?8:k==="a"?9:-1;if(want<0||n<want+1)return false;
  const tail=PAD.seq.slice(n-want-1);return tail.every((x,i)=>x===KONAMI[i]);}
function padTick(){const pads=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];if(!pads.length){PAD.alive=false;padLegend(true);return;}
  const g=pads[0],b=i=>!!(g.buttons[i]&&(g.buttons[i].pressed||g.buttons[i].value>.5)),now=performance.now();PAD.id=g.id||"";
  const edge=i=>{const p=b(i),was=!!PAD.prev[i];PAD.prev[i]=p;return p&&!was?1:!p&&was?-1:0;};
  const any=g.buttons.some((x,i)=>i!==16&&x&&x.pressed);if(any)padOn();
  const ctx=padCtx();
  /* in a session, 84-practice.js owns the face buttons (A good or reveal, B again, X hard or hint, Y easy, L1 undo) */
  const ses=/^(card|grade|mcq|next|mcqgrade)$/.test(ctx)&&NAV.tab==="practice"&&typeof sessionPad==="function";
  const used={};if(ses)for(const i of [0,1,2,3,4]){const p=b(i);if(p&&!PAD.prev[i]){padOn();if(sessionPad(i)){used[i]=1;PAD.prev[i]=p;if(i<2)padCode(i?"b":"a");}}}
  if(ses&&b(9)&&!PAD.prev[9]){PAD.prev[9]=true;used[9]=1;back();}
  /* A: acts on release, so a long hold explains (the twin of touch and hold) */
  const eA=used[0]?0:edge(0);
  if(eA===1){const swallow=padCode("a");const a=document.activeElement;
    if(swallow){PAD.aDown=null;}
    else if(ctx==="pal"){const q=$("#palq");if(q&&document.activeElement!==q)q.focus();padKey("Enter");PAD.aDown=null;}
    else if(!a||a===document.body||!padShown(a)){PAD.aDown=null;if(ctx==="card")$("#reveal")?.click();else padMove(0,1);}
    else PAD.aDown={el:a,t:now,up:null};}
  else if(eA===-1&&PAD.aDown){const h=PAD.aDown;PAD.aDown=null;if(h.up)h.up();else if(h.held)h.el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true}));if(now-h.t<650){const el=h.el.isConnected?h.el:document.activeElement;if(el&&el!==document.body)padActivate(el);}}
  /* a hold starts the touch-and-hold twin only after a quarter of a second, so a tap never fires pointer events */
  /* Galen's medallion and the rail brand wait for the long hold instead (the serpent's oath), so no hint pops up first */
  if(PAD.aDown&&!PAD.aDown.up&&b(0)&&now-PAD.aDown.t>250&&PAD.aDown.el.isConnected&&!PAD.aDown.el.matches("input,select,textarea,"+HOLD_EGG))PAD.aDown.up=synthHold(PAD.aDown.el);
  /* held for 1.6 s: send one explicit hold (98d listens for it); the release then does not click */
  if(PAD.aDown&&!PAD.aDown.held&&b(0)&&now-PAD.aDown.t>=1600&&PAD.aDown.el.isConnected){PAD.aDown.held=true;PAD.aDown.el.dispatchEvent(new CustomEvent("galen:hold",{bubbles:true}));}
  if(!used[1]&&edge(1)===1){const swallow=padCode("b");
    if(!swallow){if(padCloseTop()){}else if(ctx==="grade")gradeBtn(0);else back();}}
  if(!used[2]&&edge(2)===1){if(ctx==="card")$("#reveal")?.click();else if(ctx==="grade")gradeBtn(1);else padKey(" ");}
  if(!used[3]&&edge(3)===1){if(ctx==="grade")gradeBtn(3);else toggleSound();}
  if(!used[4]&&edge(4)===1){if(!modalTop()&&!PAL){if(!undoSnack())tabStep(-1);}}
  if(edge(5)===1){if(!modalTop()&&!PAL)tabStep(1);}
  if(edge(6)===1)padZoneStep(-1);if(edge(7)===1)padZoneStep(1);
  if(edge(8)===1)helpOverlay();
  if(!used[9]&&edge(9)===1){if(PAL)closePalette();else if(!modalTop())openPalette();}
  if(edge(10)===1){const a=document.activeElement;if(a&&a!==document.body)synthHold(a,700);}
  if(edge(11)===1&&wide()&&!modalTop())rpToggle();
  const ax=g.axes[0]||0,ay=g.axes[1]||0,rx=g.axes[2]||0,ry=g.axes[3]||0;
  const dir=b(12)||ay<-.6?[0,-1,"ArrowUp"]:b(13)||ay>.6?[0,1,"ArrowDown"]:b(14)||ax<-.6?[-1,0,"ArrowLeft"]:b(15)||ax>.6?[1,0,"ArrowRight"]:null;
  if(dir){padOn();if(!PAD.dir||PAD.dir[2]!==dir[2]||now-PAD.t>(PAD.rep?140:380)){PAD.rep=!!PAD.dir&&PAD.dir[2]===dir[2];PAD.t=now;padCode(dir[2]);if(PAL)padKey(dir[2]);else padMove(dir[0],dir[1]);}PAD.dir=dir;}else{PAD.dir=null;PAD.rep=false;}
  const sy=Math.abs(ry)>.2?Math.sign(ry)*Math.pow(Math.abs(ry),1.6)*26:0,sx=Math.abs(rx)>.3?Math.sign(rx)*Math.pow(Math.abs(rx),1.6)*22:0;
  if(sx||sy)padScroll(sx,sy);
  if(ctx!==PAD.ctx){PAD.ctx=ctx;padLegend(true);}}
/* the right stick scrolls what you are in: the dialog, the pane, a scroll box, else the page */
function padScrollable(el,stop){for(let n=el;n&&n!==stop&&n!==document.body&&n!==document.documentElement;n=n.parentElement){const cs=getComputedStyle(n);
  if(/(auto|scroll)/.test(cs.overflowY+cs.overflowX)&&(n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2))return n;}return null;}
function padScroll(sx,sy){const m=modalTop(),a=document.activeElement;
  if(m){const t=(a&&m.contains(a)&&padScrollable(a,m.parentElement))||$("#pall",m)||[...m.querySelectorAll("*")].find(n=>{const cs=getComputedStyle(n);return /(auto|scroll)/.test(cs.overflowY)&&n.scrollHeight>n.clientHeight+2;})||(m.scrollHeight>m.clientHeight+2?m:null);if(t)t.scrollBy(sx,sy);return;}
  const t=a&&a!==document.body?padScrollable(a,null):null;if(t)t.scrollBy(sx,sy);else window.scrollBy(sx,sy);}
function padLoop(){PAD.raf=0;try{padTick();}catch(e){console.warn("Galen pad:",e);}finally{if(PAD.alive)PAD.raf=requestAnimationFrame(padLoop);}}
function padStart(){if(PAD.alive&&PAD.raf)return;PAD.alive=true;PAD.prev={};if(!PAD.raf)PAD.raf=requestAnimationFrame(padLoop);}
window.addEventListener("gamepadconnected",e=>{const fresh=!PAD.alive;padStart();padOn();if(fresh)toast(`Controller connected · press View (⧉) for the buttons`);});
window.addEventListener("gamepaddisconnected",()=>setTimeout(()=>{if(!padConnected()){PAD.alive=false;padLegend(true);}},50));
/* a Deck that sleeps and wakes, or a pad seen before the page loaded: look once a second */
setInterval(()=>{if(!PAD.alive&&!document.hidden&&padConnected())padStart();},1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&padConnected())padStart();});
document.addEventListener("pointerdown",e=>{if(e.isTrusted&&e.pointerType!=="")document.documentElement.classList.remove("pad");padLegend(true);},{passive:true});
/* after a screen redraws, put a pad user on its main action instead of nowhere */
{let t=0;const v=$("#view");if(v)new MutationObserver(()=>{if(t)return;t=requestAnimationFrame(()=>{t=0;if(!document.documentElement.classList.contains("pad")||modalTop()||PAL)return;
  const a=document.activeElement;const lost=!a||a===document.body||!a.isConnected||!padShown(a)||!a.matches(PAD_FOC);if(lost)padPrimary();padLegend();});}).observe(v,{childList:true,subtree:true});}

/* ================= ON-SCREEN LEGEND (pad mode) ================= */
function padLegend(force){const on=document.documentElement.classList.contains("pad")&&PAD.alive;
  if(!on){if(PAD.legend){PAD.legend.remove();PAD.legend=null;PAD.lsig="";}return;}
  const ctx=padCtx(),z=zoneOf(document.activeElement),snack=!!$(".snack button"),sig=ctx+z+snack;if(!force&&sig===PAD.lsig)return;PAD.lsig=sig;
  if(!PAD.legend){PAD.legend=document.createElement("div");PAD.legend.id="padlegend";PAD.legend.setAttribute("aria-hidden","true");document.body.append(PAD.legend);}
  const G=(k,t,w)=>`<span class="pl${w?" wide":""}"><span class="pg pg-${k.toLowerCase().replace(/[^a-z0-9]/g,"")}">${k}</span>${t}</span>`;
  const Z={main:"Page",rail:"Sections",pane:"Reference",top:"Top bar",modal:"Dialog"}[z]||"Page";
  const sets={
    main:[G("A","choose"),G("B","back"),G("X","play or reveal"),G("Y","sound"),G("L1","R1")+"",G("L2","R2"),G("≡","search",1),G("⧉","help",1)],
    card:[G("A","show answer"),G("X","show answer"),G("≡","leave")],
    grade:[G("B","Again"),G("X","Hard"),G("A","Good, or the one in focus"),G("Y","Easy"),G("≡","leave")],
    mcq:[G("✣","choose"),G("A","answer"),G("X","hint"),G("≡","leave")],
    mcqgrade:[G("A","the grade in focus"),G("X","guessed or slow"),G("Y","easy"),G("≡","leave")],
    next:[G("A","continue"),G("≡","leave")],
    drill:[G("X","play or pause"),G("✣","choose"),G("A","answer"),G("B","leave")],
    drillnext:[G("A","next sound"),G("B","leave")],
    pal:[G("✣","move"),G("A","open"),G("B","close")],
    modal:[G("✣","move"),G("A","choose"),G("B","close"),G("RS","scroll")]};
  let items=(sets[ctx]||sets.main).slice();
  if(ctx==="main"){items[4]=`<span class="pl"><span class="pg pg-l1">L1</span><span class="pg pg-r1">R1</span>section</span>`;items[5]=`<span class="pl wide"><span class="pg pg-l2">L2</span><span class="pg pg-r2">R2</span>area</span>`;}
  if(snack&&ctx!=="pal"&&ctx!=="modal"&&ctx!=="drill"&&ctx!=="drillnext")items.push(G("L1","undo"));
  PAD.legend.innerHTML=`<span class="pz">${Z}</span>${items.join("")}`;}
/* the right-click (and menu key) twin of hold-to-explain */
document.addEventListener("contextmenu",e=>{if(performance.now()-_ctxKey<900){e.preventDefault();return;}const h=e.target.closest("[data-hint],.lr,.v,.chip,.lrow,.tile,.dtile,.fc,.ring,.sync,.grades button,.pill,.tag,#nav [data-tab]");if(!h)return;e.preventDefault();
  if(!e.clientX&&!e.clientY){synthHold(h,650);return;}const o={bubbles:true,clientX:e.clientX,clientY:e.clientY,pointerType:"touch",isPrimary:true,button:0};
  h.dispatchEvent(new PointerEvent("pointerdown",o));setTimeout(()=>h.dispatchEvent(new PointerEvent("pointerup",o)),650);});
