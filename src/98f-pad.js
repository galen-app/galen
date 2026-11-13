"use strict";
/* Galen theatre: keyboard shortcuts, gamepad focus walk, help overlay, right-click twin. */
/* ================= KEYS, CONTROLLER AND HELP ================= */
function helpOverlay(){if($(".helpov"))return;const el=document.createElement("div");el.className="helpov";el.setAttribute("role","dialog");el.setAttribute("aria-label","Keys and controller");
  const rows=[["Search","<kbd>/</kbd> or <kbd>Ctrl K</kbd>","Menu (≡)"],["Back","<kbd>Esc</kbd>","B"],["Choose","<kbd>Enter</kbd>","A"],["Move","<kbd>Tab</kbd>, arrows in lists","D-pad or left stick"],["Previous / next section","<kbd>Alt 1</kbd>…<kbd>Alt 5</kbd>","L1 / R1"],["Answers in drills","<kbd>1</kbd>–<kbd>4</kbd>, <kbd>Space</kbd> to reveal","A on the focused answer"],["Scroll","<kbd>PgUp</kbd> <kbd>PgDn</kbd>","Right stick"],["Theatre sound","<kbd>M</kbd>","Y"],["This help","<kbd>?</kbd>","View (⧉)"]];
  el.innerHTML=`<div class="card stack" style="gap:12px"><div class="row-x"><h2>Keys and controller</h2><span class="spacer"></span><button class="iconbtn" data-x aria-label="Close">${ic("close")}</button></div>
  <p class="small muted" style="margin:0">Mouse, keyboard, touch and a gamepad (Steam Deck) all work at once. Hold or right-click a hint for its explanation.</p>
  <table><tr><th>Action</th><th>Keyboard</th><th>Controller</th></tr>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</table></div>`;
  document.body.append(el);el.addEventListener("click",e=>{if(e.target===el||e.target.closest("[data-x]"))el.remove();});setTimeout(()=>$("[data-x]",el)?.focus(),10);}
function tabStep(d){const tabs=TABS.filter(t=>!t[3]).map(t=>t[0]);const i=tabs.indexOf(NAV_PARENT[NAV.tab]||NAV.tab);switchTab(tabs[(i+d+tabs.length)%tabs.length]);}
document.addEventListener("keydown",e=>{const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);if(typing)return;
  if(e.altKey&&/^[1-5]$/.test(e.key)){e.preventDefault();const tabs=TABS.filter(t=>!t[3]).map(t=>t[0]);switchTab(tabs[+e.key-1]);return;}
  if(e.key==="?"){e.preventDefault();helpOverlay();return;}
  if((e.key==="m"||e.key==="M")&&!e.ctrlKey&&!e.metaKey&&!KEYS.handler){toggleSound();return;}
  if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches("g[data-go],g[data-egg],[role=link][data-go]")){e.preventDefault();e.target.dispatchEvent(new MouseEvent("click",{bubbles:true}));}
  if(e.key==="Escape"){const ov=$(".helpov");if(ov){e.stopImmediatePropagation();ov.remove();}}
},true);
/* gamepad: buttons become the app's own keys; the d-pad walks focus spatially */
const PAD={on:false,prev:{},t:0};
function focusables(){return $$('button:not([disabled]),a[href],[tabindex="0"],input,select,textarea,summary').filter(el=>{if(el.closest("[hidden]"))return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=="hidden";})
  .filter(el=>{const ov=$(".helpov")||$(".pal-back");return ov?ov.contains(el):true;});}
function padMove(dx,dy){document.documentElement.classList.add("pad");const list=focusables();const a=document.activeElement;
  if(!a||a===document.body||!list.includes(a)){const first=list.find(el=>{const r=el.getBoundingClientRect();return r.top>=60&&r.bottom<=innerHeight;})||list[0];first&&first.focus();return;}
  const ra=a.getBoundingClientRect(),ax=ra.left+ra.width/2,ay=ra.top+ra.height/2;let best=null,bs=1e9;
  for(const el of list){if(el===a)continue;const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,ddx=x-ax,ddy=y-ay;
    const along=dx?ddx*dx:ddy*dy;if(along<=4)continue;const across=dx?Math.abs(ddy):Math.abs(ddx);const sc=along+across*2.2;if(sc<bs){bs=sc;best=el;}}
  if(best){best.focus({preventScroll:false});best.scrollIntoView({block:"nearest",inline:"nearest"});}}
function padKey(key){const t=document.activeElement||document.body;t.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true,cancelable:true}));}
function padLoop(){const pads=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];if(!pads.length){PAD.on=false;return;}
  const g=pads[0],b=i=>!!(g.buttons[i]&&g.buttons[i].pressed),now=performance.now();
  const press=(i,fn)=>{const p=b(i);if(p&&!PAD.prev[i])fn();PAD.prev[i]=p;};
  press(0,()=>{const a=document.activeElement;galenCode("a");if(a&&a!==document.body)a.click();else padMove(0,1);});
  press(1,()=>{galenCode("b");if($(".helpov")){$(".helpov").remove();return;}if(PAL){closePalette();return;}back();});
  press(3,toggleSound);
  press(4,()=>tabStep(-1));press(5,()=>tabStep(1));
  press(8,helpOverlay);press(9,openPalette);
  press(2,()=>padKey(" "));
  const ax=g.axes[0]||0,ay=g.axes[1]||0,ry=g.axes[3]||0;
  const dir=b(12)||ay<-.6?[0,-1,"ArrowUp"]:b(13)||ay>.6?[0,1,"ArrowDown"]:b(14)||ax<-.6?[-1,0,"ArrowLeft"]:b(15)||ax>.6?[1,0,"ArrowRight"]:null;
  if(dir){if(!PAD.dir||now-PAD.t>(PAD.rep?140:380)){PAD.rep=!!PAD.dir;PAD.t=now;galenCode(dir[2]);if(PAL)padKey(dir[2]);else padMove(dir[0],dir[1]);}PAD.dir=dir;}else{PAD.dir=null;PAD.rep=false;}
  if(Math.abs(ry)>.25)window.scrollBy(0,ry*18);
  requestAnimationFrame(padLoop);}
window.addEventListener("gamepadconnected",()=>{if(PAD.on)return;PAD.on=true;document.documentElement.classList.add("pad");toast("Controller connected · press View for the buttons");requestAnimationFrame(padLoop);});
document.addEventListener("pointerdown",()=>document.documentElement.classList.remove("pad"),{passive:true});
/* right-click is the twin of hold-to-explain */
document.addEventListener("contextmenu",e=>{const h=e.target.closest("[data-hint]");if(h){e.preventDefault();h.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));setTimeout(()=>h.dispatchEvent(new PointerEvent("pointerup",{bubbles:true})),650);}});

