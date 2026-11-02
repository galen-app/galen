"use strict";
/* ================= SKIN RENDERER =================
 Procedural teaching plates: skin texture across Fitzpatrick I–VI with lit, shaded lesions.
 Scale: 40 px = 1 cm (a ruler is drawn on every plate). These are drawings, not photographs. */
const SK={W:480,H:320,CM:40};
const TONES=[[246,218,200],[234,194,166],[214,163,126],[178,124,88],[132,86,57],[86,56,40]];
const TONE_NAME=["I","II","III","IV","V","VI"];
function skRng(seed){let a=seed>>>0||1;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const mixc=(a,b,t)=>[0,1,2].map(i=>Math.round(a[i]+(b[i]-a[i])*t));
const rgba=(c,a=1)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
const shade=(c,f)=>c.map(v=>Math.max(0,Math.min(255,Math.round(v*f))));
/* lesion colours adapt to skin tone: inflammation reads pink-red on light skin, violaceous to dark brown on dark skin */
function skCol(name,ti){
  const s=TONES[ti],d=ti/5;
  switch(name){
    case "ery":return mixc([214,72,78],[96,38,48],d);
    case "eryLight":return mixc([236,140,140],[128,70,70],d);
    case "salmon":return mixc([232,118,104],[110,52,52],d);
    case "violet":return mixc([142,82,142],[64,40,52],d);
    case "brown":return shade(mixc(s,[96,58,34],.55),1-d*.35);
    case "darkbrown":return shade(mixc(s,[52,30,20],.75),1-d*.3);
    case "black":return [34,24,22];
    case "bluegrey":return [88,98,122];
    case "hypo":return mixc(s,[255,240,228],.38);
    case "depig":return [252,240,232];
    case "purpura":return mixc([128,24,58],[60,14,32],d);
    case "bruise":return mixc([92,62,120],[48,30,52],d);
    case "pus":return [240,222,150];
    case "honey":return [214,152,52];
    case "slough":return [222,204,128];
    case "pearl":return mixc(s,[250,226,222],.5);
    case "skin":return s;
    case "skinLight":return mixc(s,[255,255,255],.18);
    case "red":return mixc([210,30,46],[140,20,36],d*.6);
    case "necrotic":return [38,30,32];
    case "yellow":return mixc(s,[236,212,120],.55);
    default:return s;
  }
}
/* value noise */
function skNoise(rng){const G=64,g=new Float32Array(G*G);for(let i=0;i<g.length;i++)g[i]=rng();
  const f=t=>t*t*(3-2*t);
  return (x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=f(x-xi),yf=f(y-yi),at=(a,b)=>g[((b&63)*G)+(a&63)];
    const a=at(xi,yi),b=at(xi+1,yi),c=at(xi,yi+1),d=at(xi+1,yi+1);return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf;};}
function blob(ctx,x,y,r,irr,rng,ry){ry=ry||r;const N=36,o=rng()*10,pts=[];
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2,k=1+irr*(Math.sin(a*3+o)*.45+Math.sin(a*5+o*2)*.3+(rng()-.5)*.5);pts.push([x+Math.cos(a)*r*k,y+Math.sin(a)*ry*k]);}
  ctx.beginPath();pts.forEach((p,i)=>{const n=pts[(i+1)%N],mx=(p[0]+n[0])/2,my=(p[1]+n[1])/2;if(i===0)ctx.moveTo(mx,my);else ctx.quadraticCurveTo(p[0],p[1],mx,my);});
  const p=pts[0],n=pts[1];ctx.quadraticCurveTo(p[0],p[1],(p[0]+n[0])/2,(p[1]+n[1])/2);ctx.closePath();}
let SK_FILTER=null;
function softFill(ctx,x,y,r,col,a,rng,irr=.25,ry){
  if(SK_FILTER===null){try{const t=document.createElement("canvas").getContext("2d");t.filter="blur(2px)";SK_FILTER=t.filter==="blur(2px)";}catch(e){SK_FILTER=false;}}
  const sd=Math.floor(rng()*1e6);
  if(SK_FILTER){ctx.save();ctx.filter=`blur(${Math.max(1.5,r*.16).toFixed(1)}px)`;blob(ctx,x,y,r,irr,skRng(sd),ry);ctx.fillStyle=rgba(col,a);ctx.fill();ctx.restore();return;}
  for(let k=0;k<10;k++){const f=1.16-k*.035;blob(ctx,x,y,r*f,irr,skRng(sd),ry?ry*f:0);ctx.fillStyle=rgba(col,a/6);ctx.fill();}}
/* ---------- base skin ---------- */
function skBase(ctx,ti,rng,opt={}){
  const {W,H}=SK,s=TONES[ti],nz=skNoise(rng);
  ctx.fillStyle=rgba(s);ctx.fillRect(0,0,W,H);
  const img=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height),d=img.data,sc=ctx.canvas.width/W;
  for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++){const v=(nz(x/sc/55,y/sc/55)-.5)*.09+(nz(x/sc/9+20,y/sc/9)-.5)*.035,i=(y*img.width+x)*4;
    d[i]=Math.min(255,d[i]*(1+v));d[i+1]=Math.min(255,d[i+1]*(1+v*.95));d[i+2]=Math.min(255,d[i+2]*(1+v*.9));}
  ctx.putImageData(img,0,0);
  /* skin lines (two crossing directions) and pores */
  ctx.lineWidth=.6;const lc=rgba(shade(s,.82),.18+(opt.lines||0)*.35);ctx.strokeStyle=lc;
  for(let i=-20;i<40;i++){ctx.beginPath();ctx.moveTo(i*22,0);ctx.lineTo(i*22+H*.6,H);ctx.stroke();ctx.beginPath();ctx.moveTo(i*26,H);ctx.lineTo(i*26+H*.9,0);ctx.stroke();}
  for(let i=0;i<900;i++){ctx.fillStyle=rgba(shade(s,.7),.12+rng()*.1);ctx.beginPath();ctx.arc(rng()*W,rng()*H,.35+rng()*.5,0,7);ctx.fill();}
  /* fine hairs on some sites */
  if(opt.hair){ctx.strokeStyle=rgba(shade(s,.45),.35);ctx.lineWidth=.7;for(let i=0;i<70;i++){const x=rng()*W,y=rng()*H,a=.6+rng()*.4;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+6*a,y+3,x+12*a,y+2+rng()*4);ctx.stroke();}}
}
/* ---------- lit raised shapes ---------- */
function dome(ctx,x,y,r,col,opt={}){
  const hl=opt.hl??.35,sh=opt.sh??.28;
  if(!opt.noShadow){ctx.fillStyle=`rgba(0,0,0,${.13*(opt.height??1)})`;ctx.beginPath();ctx.ellipse(x+r*.18,y+r*.22,r*1.02,r*.98,0,0,7);ctx.fill();}
  const g=ctx.createRadialGradient(x-r*.38,y-r*.42,r*.05,x,y,r*1.05);
  g.addColorStop(0,rgba(mixc(col,[255,255,255],hl),opt.alpha??1));g.addColorStop(.55,rgba(col,opt.alpha??1));g.addColorStop(1,rgba(shade(col,1-sh),opt.alpha??1));
  ctx.fillStyle=g;if(opt.path){opt.path();}else{ctx.beginPath();ctx.arc(x,y,r,0,7);}ctx.fill();
  if(opt.spec){ctx.fillStyle=`rgba(255,255,255,${opt.spec})`;ctx.beginPath();ctx.ellipse(x-r*.35,y-r*.42,r*.28,r*.16,-.6,0,7);ctx.fill();}
}
function plateau(ctx,x,y,r,col,rng,opt={}){
  /* flat-topped raised lesion with lit edge */
  const irr=opt.irr??.18,ry=opt.ry||r;
  ctx.save();ctx.fillStyle="rgba(0,0,0,.12)";ctx.translate(2,3);blob(ctx,x,y,r,irr,skRng(opt.seed||3),ry);ctx.fill();ctx.restore();
  blob(ctx,x,y,r,irr,skRng(opt.seed||3),ry);ctx.fillStyle=rgba(col);ctx.fill();
  ctx.save();blob(ctx,x,y,r,irr,skRng(opt.seed||3),ry);ctx.clip();
  ctx.lineWidth=5;ctx.strokeStyle="rgba(255,255,255,.18)";ctx.save();ctx.translate(2,2);blob(ctx,x,y,r,irr,skRng(opt.seed||3),ry);ctx.stroke();ctx.restore();
  ctx.strokeStyle="rgba(0,0,0,.14)";ctx.save();ctx.translate(-2,-2);blob(ctx,x,y,r,irr,skRng(opt.seed||3),ry);ctx.stroke();ctx.restore();
  ctx.restore();
}
function scaleIn(ctx,x,y,r,kind,rng,opt={}){
  const ry=opt.ry||r;ctx.save();blob(ctx,x,y,r*.97,opt.irr??.18,skRng(opt.seed||3),ry*.97);ctx.clip();
  const n=kind==="silver"?Math.round(r*r*.045):kind==="fine"?Math.round(r*r*.05):Math.round(r*r*.035);
  for(let i=0;i<n;i++){const a=rng()*7,rr=Math.sqrt(rng())*r,px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*(ry/r),s=kind==="silver"?2+rng()*4.5:kind==="fine"?.8+rng()*1.6:1.5+rng()*3;
    const c=kind==="silver"?[244,244,246]:kind==="greasy"?[236,214,150]:kind==="white"?[250,250,250]:[248,244,238];
    ctx.fillStyle=rgba(c,kind==="silver"?.32+rng()*.3:kind==="fine"?.35+rng()*.3:.45+rng()*.3);ctx.beginPath();ctx.ellipse(px,py,s,s*(.35+rng()*.45),rng()*3,0,7);ctx.fill();
    if(kind==="silver"&&rng()<.5){ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=.5;ctx.stroke();}}
  ctx.restore();
}
function collarette(ctx,x,y,r,ry,rng){ctx.save();ctx.strokeStyle="rgba(252,248,240,.85)";ctx.lineWidth=2.2;ctx.setLineDash([3,2.2]);ctx.beginPath();ctx.ellipse(x,y,r*.82,ry*.82,0,0,7);ctx.stroke();ctx.restore();}
/* ---------- lesion painters ---------- */
const PAINT={
  macule(ctx,x,y,r,o,ti,rng){const c=skCol(o.col||"ery",ti);if(o.soft)softFill(ctx,x,y,r,c,o.a??.8,rng,o.irr??.25);else{blob(ctx,x,y,r,o.irr??.2,rng);ctx.fillStyle=rgba(c,o.a??.85);ctx.fill();}},
  patch(ctx,x,y,r,o,ti,rng){PAINT.macule(ctx,x,y,r,o,ti,rng);},
  papule(ctx,x,y,r,o,ti,rng){const c=skCol(o.col||"ery",ti);if(o.halo)softFill(ctx,x,y,r*1.6,skCol("ery",ti),.35,rng);dome(ctx,x,y,r,c,{hl:o.hl??.3,spec:o.spec??.18});},
  nodule(ctx,x,y,r,o,ti,rng){const c=skCol(o.col||"skin",ti);dome(ctx,x,y,r,c,{hl:.28,sh:.35,height:1.6,spec:.15});},
  plaque(ctx,x,y,r,o,ti,rng){const c=skCol(o.col||"salmon",ti);const sd=Math.floor(rng()*1e6);plateau(ctx,x,y,r,c,rng,{seed:sd,irr:o.irr,ry:o.ry});if(o.scale)scaleIn(ctx,x,y,r,o.scale,rng,{seed:sd,irr:o.irr,ry:o.ry});if(o.lich)lichen(ctx,x,y,r,rng,sd,o.ry);},
  vesicle(ctx,x,y,r,o,ti,rng){if(o.base!==false){ctx.fillStyle=rgba(skCol("ery",ti),.5);ctx.beginPath();ctx.arc(x,y,r*1.35,0,7);ctx.fill();}
    dome(ctx,x,y,r,mixc(skCol("skin",ti),[255,248,225],.6),{hl:.55,sh:.1,alpha:.82,spec:.85,height:.6});ctx.strokeStyle=rgba(shade(skCol("skin",ti),.85),.5);ctx.lineWidth=.6;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();
    if(o.umb){ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.arc(x+r*.05,y+r*.05,r*.22,0,7);ctx.fill();}},
  bulla(ctx,x,y,r,o,ti,rng){if(o.flaccid){blob(ctx,x,y,r,.35,rng);ctx.fillStyle=rgba(mixc(skCol("skin",ti),[255,246,226],.55),.75);ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=1;for(let i=0;i<6;i++){ctx.beginPath();const a=rng()*6;ctx.moveTo(x+Math.cos(a)*r*.2,y+Math.sin(a)*r*.2);ctx.quadraticCurveTo(x+Math.cos(a+.6)*r*.6,y+Math.sin(a+.6)*r*.6,x+Math.cos(a+.3)*r*.9,y+Math.sin(a+.3)*r*.9);ctx.stroke();}
      PAINT.erosion(ctx,x+r*.45,y+r*.3,r*.45,{},ti,rng);}
    else{if(o.base)softFill(ctx,x,y,r*1.25,skCol("eryLight",ti),.5,rng);const c=o.haem?[150,40,50]:mixc(skCol("skin",ti),[255,244,210],.65);dome(ctx,x,y,r,c,{hl:.6,sh:.15,alpha:.88,spec:.9,height:1.2});}},
  pustule(ctx,x,y,r,o,ti,rng){ctx.fillStyle=rgba(skCol("ery",ti),.55);ctx.beginPath();ctx.arc(x,y,r*1.5,0,7);ctx.fill();dome(ctx,x,y,r,skCol("pus",ti),{hl:.5,sh:.2,spec:.6});},
  wheal(ctx,x,y,r,o,ti,rng){softFill(ctx,x,y,r*1.35,skCol("ery",ti),.55,rng,.4,(o.ry||r)*1.35);const sd=Math.floor(rng()*1e6);
    blob(ctx,x,y,r,.4,skRng(sd),o.ry);ctx.fillStyle=rgba(mixc(skCol("skin",ti),[255,226,220],.35),.85);ctx.fill();
    ctx.save();blob(ctx,x,y,r,.4,skRng(sd),o.ry);ctx.clip();ctx.lineWidth=4;ctx.strokeStyle=rgba(skCol("eryLight",ti),.6);blob(ctx,x,y,r,.4,skRng(sd),o.ry);ctx.stroke();ctx.restore();},
  erosion(ctx,x,y,r,o,ti,rng){softFill(ctx,x,y,r*1.15,skCol("eryLight",ti),.4,rng,.3);blob(ctx,x,y,r,.3,rng);ctx.fillStyle=rgba(mixc([214,96,98],[150,52,58],ti/6),.85);ctx.fill();for(let i=0;i<5;i++){ctx.fillStyle="rgba(255,255,255,.35)";ctx.beginPath();ctx.ellipse(x+(rng()-.5)*r,y+(rng()-.5)*r,1.2+rng()*2,.6,rng()*3,0,7);ctx.fill();}},
  ulcer(ctx,x,y,r,o,ti,rng){const sd=Math.floor(rng()*1e6);
    if(o.rolled){ctx.lineWidth=r*.35;ctx.strokeStyle=rgba(skCol("pearl",ti));blob(ctx,x,y,r*1.08,.15,skRng(sd));ctx.stroke();ctx.lineWidth=1.2;ctx.strokeStyle="rgba(255,255,255,.5)";blob(ctx,x-1,y-1,r*1.15,.15,skRng(sd));ctx.stroke();}
    else{softFill(ctx,x,y,r*1.3,skCol("ery",ti),.45,rng);}
    blob(ctx,x,y,r,.15,skRng(sd));const g=ctx.createRadialGradient(x+r*.2,y+r*.2,0,x,y,r);g.addColorStop(0,rgba(skCol("slough",ti)));g.addColorStop(.6,rgba(mixc(skCol("slough",ti),[180,60,60],.4)));g.addColorStop(1,"rgba(110,30,36,1)");ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.25)";ctx.lineWidth=1.5;ctx.stroke();},
  crust(ctx,x,y,r,o,ti,rng){const c=skCol(o.col||"honey",ti);softFill(ctx,x,y,r*1.25,skCol("ery",ti),.35,rng,.3);
    blob(ctx,x,y,r,.35,rng);const g=ctx.createLinearGradient(x-r,y-r,x+r,y+r);g.addColorStop(0,rgba(mixc(c,[255,236,170],.35)));g.addColorStop(1,rgba(shade(c,.72)));ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle=rgba(shade(c,.5),.5);ctx.lineWidth=.7;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(x+(rng()-.5)*r,y+(rng()-.5)*r);ctx.lineTo(x+(rng()-.5)*r,y+(rng()-.5)*r);ctx.stroke();}
    for(let i=0;i<8;i++){ctx.fillStyle="rgba(255,240,190,.5)";ctx.beginPath();ctx.arc(x+(rng()-.5)*r,y+(rng()-.5)*r,.8+rng(),0,7);ctx.fill();}},
  petechia(ctx,x,y,r,o,ti,rng){ctx.fillStyle=rgba(skCol("purpura",ti),.9);ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();},
  purpura(ctx,x,y,r,o,ti,rng){softFill(ctx,x,y,r,skCol("purpura",ti),.95,rng,.12);if(o.palp)dome(ctx,x,y,r*.7,skCol("purpura",ti),{hl:.18,sh:.3,alpha:.7,spec:.1});if(o.necrotic){blob(ctx,x,y,r*.35,.4,rng);ctx.fillStyle=rgba(skCol("necrotic",ti),.9);ctx.fill();}},
  bruise(ctx,x,y,r,o,ti,rng){softFill(ctx,x,y,r*1.2,[190,170,90],.25,rng,.3);softFill(ctx,x,y,r,skCol("bruise",ti),.6,rng,.3);},
  target(ctx,x,y,r,o,ti,rng){softFill(ctx,x,y,r,skCol("ery",ti),.8,rng,.12);ctx.fillStyle=rgba(mixc(skCol("skin",ti),skCol("eryLight",ti),.4),.85);ctx.beginPath();ctx.arc(x,y,r*.62,0,7);ctx.fill();
    ctx.fillStyle=rgba(skCol("purpura",ti),.85);ctx.beginPath();ctx.arc(x,y,r*.32,0,7);ctx.fill();if(o.blister)PAINT.vesicle(ctx,x,y,r*.2,{base:false},ti,rng);},
  telang(ctx,x,y,r,o,ti,rng){ctx.strokeStyle=rgba(skCol("red",ti),.75);for(let k=0;k<(o.n2||4);k++){ctx.lineWidth=.6+rng()*.7;ctx.beginPath();let px=x,py=y;ctx.moveTo(px,py);const a0=rng()*7;for(let i=0;i<8;i++){const a=a0+(rng()-.5)*1.4;px+=Math.cos(a)*r/5;py+=Math.sin(a)*r/5;ctx.lineTo(px,py);}ctx.stroke();}},
  comedo(ctx,x,y,r,o,ti,rng){if(o.open){ctx.fillStyle="rgba(40,30,26,.9)";ctx.beginPath();ctx.arc(x,y,r*.55,0,7);ctx.fill();}else dome(ctx,x,y,r,mixc(skCol("skin",ti),[255,250,235],.45),{hl:.4,sh:.12,spec:.25,height:.4});},
  excoriation(ctx,x,y,r,o,ti,rng){const a=rng()*Math.PI,l=r*2.2;ctx.strokeStyle=rgba(mixc([180,40,40],skCol("ery",ti),.4),.85);ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*l/2,y-Math.sin(a)*l/2);ctx.lineTo(x+Math.cos(a)*l/2,y+Math.sin(a)*l/2);ctx.stroke();
    for(let i=0;i<4;i++){const t=rng()-.5;ctx.fillStyle="rgba(120,40,30,.8)";ctx.beginPath();ctx.arc(x+Math.cos(a)*l*t,y+Math.sin(a)*l*t,1.1,0,7);ctx.fill();}},
  burrow(ctx,x,y,r,o,ti,rng){ctx.strokeStyle=rgba(shade(skCol("skin",ti),.55),.8);ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y);let px=x,py=y;const a=rng()*7;for(let i=1;i<=8;i++){px+=Math.cos(a+Math.sin(i)*.5)*r/4;py+=Math.sin(a+Math.sin(i)*.5)*r/4;ctx.lineTo(px,py);}ctx.stroke();ctx.fillStyle="rgba(60,40,36,.9)";ctx.beginPath();ctx.arc(px,py,1.3,0,7);ctx.fill();},
  wart(ctx,x,y,r,o,ti,rng){dome(ctx,x,y,r,mixc(skCol("skin",ti),[210,190,160],.35),{hl:.2,sh:.3,height:1.2});for(let i=0;i<r*2.2;i++){const a=rng()*7,rr=Math.sqrt(rng())*r*.9;dome(ctx,x+Math.cos(a)*rr,y+Math.sin(a)*rr,1.4+rng()*1.6,mixc(skCol("skin",ti),[230,215,190],.4),{hl:.35,sh:.35,noShadow:true});}
    for(let i=0;i<r*.6;i++){const a=rng()*7,rr=Math.sqrt(rng())*r*.8;ctx.fillStyle="rgba(60,20,24,.85)";ctx.beginPath();ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr,.8,0,7);ctx.fill();}},
  molluscum(ctx,x,y,r,o,ti,rng){dome(ctx,x,y,r,skCol("pearl",ti),{hl:.5,sh:.15,spec:.55,height:.8});ctx.fillStyle="rgba(0,0,0,.22)";ctx.beginPath();ctx.arc(x+r*.05,y+r*.08,r*.2,0,7);ctx.fill();ctx.fillStyle="rgba(255,255,255,.4)";ctx.beginPath();ctx.arc(x-r*.02,y,r*.08,0,7);ctx.fill();},
  naevus(ctx,x,y,r,o,ti,rng){blob(ctx,x,y,r,.05,rng);ctx.fillStyle=rgba(skCol(o.col||"brown",ti));ctx.fill();if(o.raised)dome(ctx,x,y,r,skCol(o.col||"brown",ti),{hl:.2,sh:.2,spec:.1,height:.6});},
  melanoma(ctx,x,y,r,o,ti,rng){const cols=["darkbrown","brown","black","bluegrey"];blob(ctx,x,y,r,.55,rng,r*.78);ctx.fillStyle=rgba(skCol("brown",ti));ctx.fill();
    ctx.save();blob(ctx,x,y,r,.55,skRng(99),r*.78);ctx.clip();for(let i=0;i<14;i++){const c=skCol(cols[Math.floor(rng()*4)],ti);softFill(ctx,x+(rng()-.5)*r*1.3,y+(rng()-.5)*r,r*(.15+rng()*.35),c,.75,rng,.5);}
    softFill(ctx,x+r*.3,y-r*.2,r*.22,[230,200,200],.6,rng);softFill(ctx,x-r*.35,y+r*.2,r*.2,[200,80,80],.45,rng);ctx.restore();},
  sk(ctx,x,y,r,o,ti,rng){const c=mixc(skCol("brown",ti),[120,80,50],.3);const sd=Math.floor(rng()*1e6);plateau(ctx,x,y,r,c,rng,{seed:sd,irr:.12,ry:r*.75});
    ctx.save();blob(ctx,x,y,r,.12,skRng(sd),r*.75);ctx.clip();ctx.strokeStyle="rgba(40,24,14,.45)";ctx.lineWidth=.8;for(let i=0;i<r/1.5;i++){ctx.beginPath();const sx=x-r+rng()*2*r,sy=y-r+rng()*2*r;ctx.moveTo(sx,sy);ctx.lineTo(sx+(rng()-.5)*r*.6,sy+(rng()-.5)*r*.4);ctx.stroke();}
    for(let i=0;i<r/2;i++){ctx.fillStyle="rgba(245,238,215,.8)";ctx.beginPath();ctx.arc(x+(rng()-.5)*r*1.4,y+(rng()-.5)*r,.9+rng()*.8,0,7);ctx.fill();}ctx.restore();},
  angioma(ctx,x,y,r,o,ti,rng){dome(ctx,x,y,r,skCol("red",ti),{hl:.35,sh:.35,spec:.45});},
  bcc(ctx,x,y,r,o,ti,rng){dome(ctx,x,y,r,skCol("pearl",ti),{hl:.55,sh:.18,spec:.5,height:1});ctx.lineWidth=r*.18;ctx.strokeStyle="rgba(255,255,255,.28)";ctx.beginPath();ctx.arc(x,y,r*.88,0,7);ctx.stroke();
    ctx.save();ctx.beginPath();ctx.arc(x,y,r*.95,0,7);ctx.clip();PAINT.telang(ctx,x-r*.25,y-r*.1,r*.5,{n2:4},ti,rng);PAINT.telang(ctx,x+r*.2,y+r*.25,r*.45,{n2:3},ti,rng);ctx.restore();if(o.ulc)PAINT.ulcer(ctx,x+r*.05,y+r*.05,r*.4,{},ti,rng);if(o.pig){for(let i=0;i<5;i++){ctx.fillStyle="rgba(60,40,40,.65)";ctx.beginPath();ctx.arc(x+(rng()-.5)*r,y+(rng()-.5)*r,1.4+rng()*1.5,0,7);ctx.fill();}}},
  scc(ctx,x,y,r,o,ti,rng){dome(ctx,x,y,r,mixc(skCol("ery",ti),skCol("skin",ti),.4),{hl:.2,sh:.35,height:1.4});for(let i=0;i<r*2;i++){const a=rng()*7,rr=Math.sqrt(rng())*r*.6;ctx.fillStyle=rgba([238,226,196],.7);ctx.beginPath();ctx.ellipse(x+Math.cos(a)*rr,y+Math.sin(a)*rr,2+rng()*3,1.4,rng()*3,0,7);ctx.fill();}
    if(o.ulc)PAINT.ulcer(ctx,x+r*.2,y+r*.15,r*.35,{},ti,rng);},
  ak(ctx,x,y,r,o,ti,rng){softFill(ctx,x,y,r,skCol("eryLight",ti),.65,rng,.3);scaleIn(ctx,x,y,r*.8,"white",rng,{irr:.3,seed:5});},
  df(ctx,x,y,r,o,ti,rng){dome(ctx,x,y,r,skCol("brown",ti),{hl:.12,sh:.2,height:.6});softFill(ctx,x,y,r*.45,mixc(skCol("brown",ti),[255,240,225],.4),.8,rng,.3);},
  lp(ctx,x,y,r,o,ti,rng){ctx.save();ctx.beginPath();const n=6,o0=rng();for(let i=0;i<n;i++){const a=i/n*7+o0,rr=r*(.85+rng()*.25);i?ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):ctx.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();
    const c=mixc(skCol("violet",ti),skCol("skin",ti),.25);ctx.fillStyle=rgba(c,.92);ctx.shadowColor="rgba(0,0,0,.1)";ctx.shadowOffsetY=1;ctx.fill();ctx.restore();
    const g=ctx.createLinearGradient(x-r,y-r,x+r,y+r);g.addColorStop(0,"rgba(255,255,255,.28)");g.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*.75,0,7);ctx.fill();
    if(r>5){ctx.strokeStyle="rgba(250,248,252,.75)";ctx.lineWidth=.6;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-r*.6,y-r*.4+i*r*.35);ctx.bezierCurveTo(x-r*.2,y-r*.6+i*r*.4,x+r*.1,y-r*.1+i*r*.3,x+r*.6,y-r*.3+i*r*.35);ctx.stroke();}}},
  necrosis(ctx,x,y,r,o,ti,rng){softFill(ctx,x,y,r*1.6,skCol("bruise",ti),.65,rng,.4);softFill(ctx,x,y,r*1.15,[90,60,80],.6,rng,.4);blob(ctx,x,y,r*.7,.45,rng);ctx.fillStyle=rgba(skCol("necrotic",ti),.92);ctx.fill();},
  swelling(ctx,x,y,r,o,ti,rng){softFill(ctx,x,y,r,skCol(o.col||"ery",ti),o.a??.55,rng,.45,o.ry);const g=ctx.createRadialGradient(x-r*.3,y-r*.35,0,x,y,r);g.addColorStop(0,"rgba(255,255,255,.2)");g.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r,o.ry||r,0,0,7);ctx.fill();},
  ring(ctx,x,y,r,o,ti,rng){/* annular: active edge, clearing centre */const c=skCol(o.col||"ery",ti),ry=o.ry||r;ctx.save();ctx.lineWidth=o.w||Math.max(4,r*.18);ctx.strokeStyle=rgba(c,o.a??.8);blob(ctx,x,y,r,o.irr??.12,rng,ry);ctx.stroke();
    if(o.raised){ctx.lineWidth=1.2;ctx.strokeStyle="rgba(255,255,255,.3)";ctx.stroke();}if(o.scale){ctx.lineWidth=2;ctx.setLineDash([2,2.5]);ctx.strokeStyle="rgba(250,248,242,.8)";blob(ctx,x,y,r-(o.w||Math.max(4,r*.18))*.25,o.irr??.12,skRng(1),ry);ctx.stroke();}
    if(o.centre){ctx.fillStyle=rgba(mixc(c,skCol("skin",ti),.6),.35);blob(ctx,x,y,r*.8,o.irr??.12,skRng(2),ry*.8);ctx.fill();}ctx.restore();},
  ringPapules(ctx,x,y,r,o,ti,rng){const n=Math.round(r*.55);for(let i=0;i<n;i++){const a=i/n*7;PAINT.papule(ctx,x+Math.cos(a)*r,y+Math.sin(a)*r*(o.ry?o.ry/r:1),3.2+rng()*1.5,{col:o.col||"eryLight",hl:.3},ti,rng);}},
  lichen(ctx,x,y,r,o,ti,rng){lichen(ctx,x,y,r,rng,7,o.ry);},
  depig(ctx,x,y,r,o,ti,rng){blob(ctx,x,y,r,.5,rng,o.ry);ctx.fillStyle=rgba(skCol(o.col||"depig",ti),o.a??.95);ctx.fill();if(o.scale)scaleIn(ctx,x,y,r,"fine",rng,{irr:.5,seed:3});}
};
function lichen(ctx,x,y,r,rng,seed,ry){ctx.save();blob(ctx,x,y,r,.18,skRng(seed||3),ry||r);ctx.clip();ctx.fillStyle="rgba(70,36,24,.16)";ctx.fillRect(x-r,y-r,2*r,2*r);ctx.lineWidth=1.3;
  const rr=skRng(seed||3);for(let i=-16;i<16;i++){for(const [dx,k] of [[8,.45],[10,-.8]]){ctx.strokeStyle=`rgba(40,20,14,${.14+rr()*.12})`;ctx.beginPath();const x0=x-r+i*dx;ctx.moveTo(x0,y-r);ctx.bezierCurveTo(x0+r*k*.3+rr()*4,y-r*.3,x0+r*k*.6-rr()*4,y+r*.3,x0+r*k,y+r);ctx.stroke();}}
  ctx.fillStyle="rgba(255,255,255,.06)";for(let i=0;i<60;i++){ctx.beginPath();ctx.arc(x+(rr()-.5)*2*r,y+(rr()-.5)*2*r,2+rr()*3,0,7);ctx.fill();}ctx.restore();}
/* ---------- arrangements ---------- */
function skPlace(L,rng,z=1){
  const {W,H}=SK,n=L.n||1,R=()=>(L.r?L.r[0]+rng()*(L.r[1]-L.r[0]):10)*z,out=[];L=Object.assign({},L,{spread:(L.spread||(L.arr==="groups"?18:30))*Math.sqrt(z),R:(L.R||80)});
  const cx=L.cx??W/2,cy=L.cy??H/2;
  switch(L.arr||"single"){
    case "single":out.push([cx,cy,R()]);break;
    case "scatter":for(let i=0;i<n;i++)out.push([30+rng()*(W-60),24+rng()*(H-60),R()]);break;
    case "group":{const sp=L.spread||30;for(let i=0;i<n;i++){const a=rng()*7,d=Math.sqrt(rng())*sp;out.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d*.8,R()]);}break;}
    case "groups":{const g=L.groups||3;for(let k=0;k<g;k++){const gx=60+rng()*(W-120),gy=50+rng()*(H-110);for(let i=0;i<n;i++){const a=rng()*7,d=Math.sqrt(rng())*(L.spread||18);out.push([gx+Math.cos(a)*d,gy+Math.sin(a)*d,R()]);}}break;}
    case "ring":{const RR=L.R||80;for(let i=0;i<n;i++){const a=i/n*7+rng()*.2;out.push([cx+Math.cos(a)*RR,cy+Math.sin(a)*RR*(L.flat||.8),R()]);}break;}
    case "line":{const x0=L.x0??60,y0=L.y0??H-60,x1=L.x1??W-60,y1=L.y1??60;for(let i=0;i<n;i++){const t=n>1?i/(n-1):.5;out.push([x0+(x1-x0)*t+(rng()-.5)*(L.jit||6),y0+(y1-y0)*t+(rng()-.5)*(L.jit||6),R()]);}break;}
    case "band":{/* dermatomal: groups along a diagonal band */for(let i=0;i<n;i++){const t=rng(),bx=20+t*(W-40),by=H*.75-t*H*.45+(rng()-.5)*50;out.push([bx,by,R()]);}break;}
    case "bandGroups":{const g=L.groups||5;for(let k=0;k<g;k++){const t=(k+.5)/g,gx=30+t*(SK.W-60),gy=SK.H*.72-t*SK.H*.42+(rng()-.5)*30;out.push([gx,gy,0,"G"]);}break;}
    case "xmas":{/* oval lesions along skin cleavage lines (pityriasis rosea) */for(let i=0;i<n;i++){const x=40+rng()*(W-80),y=30+rng()*(H-80);out.push([x,y,R(),x<W/2?-.5:.5]);}break;}
    case "grid":{const c=L.cols||6,rws=Math.ceil(n/c);for(let i=0;i<n;i++)out.push([60+(i%c)*((W-120)/(c-1||1))+(rng()-.5)*14,50+Math.floor(i/c)*((H-110)/(rws-1||1))+(rng()-.5)*14,R()]);break;}
  }
  return out;
}
function skRender(canvas,spec,ti,seed){
  const ratio=Math.min(2,(window.devicePixelRatio||1));canvas.width=SK.W*ratio;canvas.height=SK.H*ratio;
  const ctx=canvas.getContext("2d");ctx.setTransform(1,0,0,1,0,0);
  const rng=skRng((seed||1)*7919+ti*131);
  ctx.setTransform(ratio,0,0,ratio,0,0);skBase(ctx,ti,rng,spec.base||{});
  if(spec.bg)spec.bg.forEach(b=>{const p=PAINT[b.k];if(p)p(ctx,b.x??SK.W/2,b.y??SK.H/2,b.r||160,b,ti,rng);});
  (spec.L||[]).forEach(L=>{const p=PAINT[L.k];if(!p)return;const z=spec.zoom||1;skPlace(L,rng,z).forEach(([x,y,r,rot])=>{
    if(rot==="G"){softFill(ctx,x,y,(L.spread||22)*1.5,skCol("ery",ti),.6,rng,.35,(L.spread||22)*1.1);const m=L.n||10;for(let i=0;i<m;i++){const a=rng()*7,d=Math.sqrt(rng())*(L.spread||22);p(ctx,x+Math.cos(a)*d,y+Math.sin(a)*d*.75,(L.r[0]+rng()*(L.r[1]-L.r[0]))*z,Object.assign({},L,{base:false}),ti,rng);}return;}
    if(rot!=null&&L.k==="plaque"){ctx.save();ctx.translate(x,y);ctx.rotate(rot);p(ctx,0,0,r,Object.assign({},L,{ry:r*.55}),ti,rng);if(L.coll)collarette(ctx,0,0,r,r*.55,rng);ctx.restore();}
    else p(ctx,x,y,r,L,ti,rng);});});
  /* ruler: 1 cm */
  const ink=ti>=3?"rgba(255,255,255,.85)":"rgba(30,26,24,.75)";ctx.strokeStyle=ink;ctx.fillStyle=ink;ctx.lineWidth=1.5;const zz=spec.zoom||1,cmLen=zz>=2.2?SK.CM*zz/2:SK.CM*zz,lab=zz>=2.2?"5 mm":"1 cm",rx=SK.W-16-cmLen,ry=SK.H-14;
  ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx+cmLen,ry);ctx.moveTo(rx,ry-4);ctx.lineTo(rx,ry+4);ctx.moveTo(rx+cmLen,ry-4);ctx.lineTo(rx+cmLen,ry+4);ctx.stroke();
  ctx.font="600 11px system-ui,sans-serif";ctx.textAlign="center";ctx.fillText(lab+(zz>1?` · ×${zz}`:""),rx+cmLen/2,ry-6);
}
/* lazy renderer for plates in the DOM: <canvas class="plate" data-spec="id" data-tone="2"> */
const PLATE_SPECS={};
function plateHTML(id,ti,opt={}){return `<canvas class="plate${opt.small?" sm":""}" data-plate="${id}" data-tone="${ti}" width="480" height="320" role="img" aria-label="${esc(opt.label||"Illustrated skin plate")}"></canvas>`;}
function renderPlates(root){
  const draw=c=>{const s=PLATE_SPECS[c.dataset.plate];if(!s){return;}try{skRender(c,s,+c.dataset.tone||0,s.seed||(c.dataset.plate.length*13));c.dataset.done=1;}catch(e){console.warn("plate",c.dataset.plate,e);}};
  const list=$$("canvas.plate:not([data-done])",root);
  if("IntersectionObserver" in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);draw(e.target);}}),{rootMargin:"300px"});list.forEach(c=>io.observe(c));}
  else list.forEach(draw);
}
