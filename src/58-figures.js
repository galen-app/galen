"use strict";
/* ================= ILLUSTRATIONS =================
 Schematic, theme-aware SVG figures (viewBox 320×200). Colours come from anatomy tokens:
 --bone, --muscle, --nerve, --artery, --vein, --fluid, --skin. Orange arrows = the examiner's force or the movement. */
const P={
 t:(x,y,s,a="start",cls="")=>`<text x="${x}" y="${y}" text-anchor="${a}" class="fl ${cls}">${s}</text>`,
 T:(x,y,s,a="start")=>`<text x="${x}" y="${y}" text-anchor="${a}" class="fl fb">${s}</text>`,
 ln:(x1,y1,x2,y2,c="var(--muted)",w=1.4,d="")=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${d?`stroke-dasharray="${d}"`:""} stroke-linecap="round"/>`,
 pa:(d,f="none",s="var(--muted)",w=1.4,extra="")=>`<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`,
 c:(x,y,r,f="var(--surface)",s="var(--muted)",w=1.4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${s}" stroke-width="${w}"/>`,
 e:(x,y,rx,ry,f,s="none",w=1.2,rot=0)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${s}" stroke-width="${w}" ${rot?`transform="rotate(${rot} ${x} ${y})"`:""}/>`,
 r:(x,y,w,h,f,s="none",rx=4)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" stroke="${s}" stroke-width="1.2"/>`,
 bone:(x1,y1,x2,y2,w=16)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--bone-line)" stroke-width="${w+2.4}" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--bone)" stroke-width="${w}" stroke-linecap="round"/>`,
 mus:d=>`<path d="${d}" fill="var(--muscle)" stroke="var(--muscle-line)" stroke-width="1.2" stroke-linejoin="round"/>`,
 nv:(d,w=2.4)=>`<path d="${d}" fill="none" stroke="var(--nerve)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
 art:(d,w=3)=>`<path d="${d}" fill="none" stroke="var(--artery)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
 vein:(d,w=3)=>`<path d="${d}" fill="none" stroke="var(--vein)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
 skin:d=>`<path d="${d}" fill="var(--skin)" stroke="var(--line)" stroke-width="1.3" stroke-linejoin="round"/>`,
 ar:(x1,y1,x2,y2,c="var(--accent)",w=2.4)=>{const a=Math.atan2(y2-y1,x2-x1),h=8,s=.45;
   return `<line x1="${x1}" y1="${y1}" x2="${x2-Math.cos(a)*4}" y2="${y2-Math.sin(a)*4}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x2} ${y2}L${x2-h*Math.cos(a-s)} ${y2-h*Math.sin(a-s)}L${x2-h*Math.cos(a+s)} ${y2-h*Math.sin(a+s)}Z" fill="${c}"/>`;},
 curv:(d,c="var(--accent)",w=2.4)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#ah)"/>`,
 x:(x,y,c="var(--bad)")=>`<path d="M${x-6} ${y-6}L${x+6} ${y+6}M${x+6} ${y-6}L${x-6} ${y+6}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
 wave:(fn,x0,x1,y0,amp,step=1)=>{let d="";for(let x=x0;x<=x1;x+=step){d+=(x===x0?"M":"L")+x.toFixed(1)+" "+(y0-fn((x-x0)/(x1-x0))*amp).toFixed(1);}return d;},
 hand:(x,y,rot=0,s=1)=>`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-10 -6 h20 a6 6 0 0 1 6 6 v4 a6 6 0 0 1 -6 6 h-20 a6 6 0 0 1 -6 -6 v-4 a6 6 0 0 1 6 -6z" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.4"/><path d="M-12 -2 h-10 M-12 3 h-12 M-12 8 h-10" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"/></g>`
};
const FIG={
/* ---------------- cardiovascular ---------------- */
jvp:{t:"Measuring the JVP",c:"The internal jugular is a manometer on the right atrium. Measure the vertical height of the pulsation above the sternal angle; add 5 cm for right atrial pressure.",
 s:()=>`${P.skin("M60 190 L60 120 Q62 70 96 52 Q120 40 132 26 L160 22 Q176 40 168 60 Q160 80 186 96 L280 150 L300 190 Z")}
 ${P.c(150,40,16,"var(--skin)","var(--line)")}${P.mus("M150 58 Q170 92 196 108 L190 114 Q160 98 142 64 Z")}
 ${P.vein("M150 60 Q166 94 200 118",4)}${P.e(178,98,6,14,"var(--vein)","none",0,-55)}
 ${P.c(214,128,4,"var(--ink)","none")}${P.T(222,130,"Sternal angle")}
 ${P.ln(178,84,178,130,"var(--accent)",1.4,"3 3")}${P.ln(170,84,190,84,"var(--accent)")}${P.ln(170,128,214,128,"var(--accent)",1.2,"3 3")}
 ${P.t(160,108,"≤ 3 cm","end","fa")}${P.c(222,168,9,"var(--artery)","none")}${P.T(236,172,"RA (5 cm below)")}
 ${P.ln(214,132,222,158,"var(--muted)",1,"2 3")}${P.ar(58,92,92,70,"var(--muted)",1.4)}${P.t(20,102,"45°")}${P.t(120,186,"Top of pulsation = JVP")}`},
ajr:{t:"Abdominojugular reflux",c:"Firm abdominal pressure returns splanchnic blood to the right heart. A failing heart can't pass it on, so the JVP rises and stays up.",
 s:()=>`${P.r(30,110,120,60,"var(--skin)","var(--line)",24)}${P.t(90,145,"abdomen","middle")}${P.hand(90,92,90)}${P.ar(90,70,90,104)}
 ${P.r(200,40,26,130,"var(--surface2)","var(--line)",10)}${P.r(250,40,26,130,"var(--surface2)","var(--line)",10)}
 ${P.r(204,120,18,46,"var(--vein)","none",6)}${P.r(254,70,18,96,"var(--vein)","none",6)}
 ${P.T(213,186,"Before","middle")}${P.T(263,186,"After 10 s","middle")}${P.ar(232,118,248,78,"var(--accent)",1.8)}
 ${P.t(312,30,"rise ≥ 3 cm, sustained","end","fa")}`},
pulsus:{t:"Pulsus paradoxus",c:"On inspiration the right ventricle fills, the septum bulges left in the fixed pericardial space, and LV stroke volume and systolic pressure fall by more than 12 mmHg.",
 s:()=>{const pk=(u,i)=>{const b=(u*6)%1,beat=Math.exp(-Math.pow((b-.25)/.09,2))*.9+Math.exp(-Math.pow((b-.5)/.08,2))*.25;const k=Math.floor(u*6);const d=(k===2||k===3)?.62:1;return beat*d;};
  return `${P.r(118,24,92,150,"var(--insp)","none",0).replace("fill","fill-opacity=\".1\" fill")}${P.t(164,36,"INSPIRATION","middle","fa2")}
  ${P.pa(P.wave(pk,20,300,160,120,1.2),"none","var(--artery)",2)}
  ${P.ln(20,52,300,52,"var(--muted)",1,"4 3")}${P.t(304,55,"systolic first heard","end")}${P.ln(20,84,300,84,"var(--accent)",1,"4 3")}${P.t(304,96,"heard in every beat","end","fa")}
  ${P.ar(110,55,110,82,"var(--accent)",1.6)}${P.t(104,72,"> 12 mmHg","end","fa")}${P.t(20,186,"Deflate slowly: the gap between the levels is the paradox")}`;}},
"pulse-shapes":{t:"Arterial pulse character",c:"The aortic valve and the left ventricle shape the carotid pulse: a slow, small rise in aortic stenosis; a sharp rise and collapse in aortic regurgitation.",
 s:()=>{const N=u=>Math.exp(-Math.pow((u-.25)/.08,2))*.95+.25*Math.exp(-Math.pow((u-.55)/.1,2));
  const AS=u=>.55*Math.exp(-Math.pow((u-.45)/.17,2));const AR=u=>(u<.18?u/.18:Math.exp(-(u-.18)*5.5))*1.0;
  return `${P.pa(P.wave(N,20,110,150,90),"none","var(--ink)",2)}${P.pa(P.wave(AS,120,210,150,90),"none","var(--accent)",2.4)}${P.pa(P.wave(AR,220,310,150,90),"none","var(--artery)",2)}
  ${P.ln(20,152,310,152,"var(--line)")}${P.T(65,178,"Normal","middle")}${P.T(165,178,"Slow-rising (AS)","middle")}${P.T(265,178,"Collapsing (AR)","middle")}
  ${P.t(165,192,"parvus et tardus","middle")}${P.t(265,192,"wide pulse pressure","middle")}`;}},
apex:{t:"Apex beat position",c:"Count down from the second space at the sternal angle. Normal: 5th intercostal space inside the midclavicular line. A dilated LV moves it down and out.",
 s:()=>{let ribs="";for(let i=0;i<6;i++){const y=50+i*22;ribs+=P.pa(`M150 ${y} Q110 ${y-4} 60 ${y+18}`,"none","var(--bone-line)",4)+P.pa(`M170 ${y} Q210 ${y-4} 260 ${y+18}`,"none","var(--bone-line)",4);}
  return `${P.skin("M50 30 Q160 10 270 30 L280 190 L40 190 Z")}${ribs}${P.r(150,34,20,130,"var(--bone)","var(--bone-line)",6)}
  ${P.ln(212,28,212,190,"var(--accent)",1.2,"4 4")}${P.t(214,186,"MCL")}${P.pa("M154 70 Q140 110 152 140 Q170 160 205 152 Q215 140 200 116 Q186 92 170 72 Z","var(--artery)","none",0,'fill-opacity=".18"')}
  ${P.c(204,148,6,"var(--accent)","none")}${P.T(140,182,"Normal: 5th ICS","end")}${P.c(238,170,6,"none","var(--bad)",2)}${P.t(246,174,"Displaced")}
  ${P.t(130,52,"2nd ICS","end")}${P.c(160,44,3,"var(--ink)","none")}`;}},
abi:{t:"Ankle–brachial index",c:"Ankle systolic pressure (higher of dorsalis pedis and posterior tibial) divided by the higher brachial pressure. Normal 1.0–1.4; ≤ 0.9 is peripheral arterial disease.",
 s:()=>`${P.skin("M60 20 Q80 14 90 30 L96 120 Q96 128 88 128 L76 128 Q70 128 70 120 Z")}${P.r(66,52,34,22,"var(--accent-soft)","var(--accent)",4)}${P.t(104,66,"brachial")}
 ${P.skin("M200 30 L224 30 L226 150 Q228 166 252 170 L284 172 Q290 182 280 188 L214 188 Q204 186 202 170 Z")}${P.r(196,118,36,20,"var(--accent-soft)","var(--accent)",4)}${P.t(238,132,"ankle cuff")}
 ${P.c(262,176,4,"var(--artery)","none")}${P.t(266,166,"DP")}${P.c(208,164,4,"var(--artery)","none")}${P.t(160,168,"PT")}
 ${P.T(20,170,"ABI = ankle ÷ arm")}${P.t(20,186,"≤ 0.9 PAD · < 0.5 severe · > 1.4 incompressible")}`},
valsalva:{t:"Dynamic auscultation",c:"Valsalva and standing shrink the left ventricle. In HOCM the septum and mitral leaflet meet sooner, so the murmur gets louder; most other murmurs get softer. Handgrip raises afterload: regurgitant murmurs louder.",
 s:()=>`${P.e(90,100,56,70,"var(--muscle)","var(--muscle-line)")}${P.e(96,104,26,42,"var(--surface)","var(--muscle-line)")}${P.mus("M70 60 L100 70 L104 110 L80 120 Z")}${P.t(90,186,"Normal preload","middle")}
 ${P.e(230,100,52,64,"var(--muscle)","var(--muscle-line)")}${P.e(236,104,16,30,"var(--surface)","var(--muscle-line)")}${P.mus("M210 64 L242 74 L244 110 L218 118 Z")}${P.t(230,186,"Valsalva / standing","middle")}
 ${P.ar(150,100,174,100)}${P.T(316,40,"outflow narrows","end")}${P.t(80,24,"septum","middle")}`},
plr:{t:"Passive leg raise",c:"Tilting from semi-recumbent to legs up transfers about 300 mL of venous blood to the heart: a reversible fluid challenge.",
 s:()=>`${P.pa("M20 160 L120 160 L190 100","none","var(--ink)",6)}${P.c(198,92,12,"var(--skin)","var(--line)")}${P.t(80,184,"Start: trunk at 45°","middle")}
 ${P.pa("M200 160 L270 160 L310 120","none","var(--accent)",6)}${P.c(188,156,12,"var(--skin)","var(--line)")}${P.t(250,184,"Then: flat, legs at 45°","middle")}
 ${P.ar(300,118,250,148,"var(--vein)",2)}${P.t(232,108,"~300 mL returns")}`},
dissection:{t:"Aortic dissection and the arms",c:"The brachiocephalic trunk (right arm) and left subclavian arise separately; a flap can compromise one, giving a pulse deficit or inter-arm pressure difference.",
 s:()=>`${P.art("M150 190 L150 120 Q150 60 200 60 Q250 60 250 120 L250 190",14)}${P.art("M172 66 L150 20",6)}${P.art("M200 60 L200 20",6)}${P.art("M228 66 L262 20",6)}
 ${P.pa("M150 160 Q160 120 156 90 Q166 70 196 66","none","var(--ink)",2,'stroke-dasharray="4 3"')}${P.t(136,24,"right arm","end")}${P.t(268,24,"left arm")}${P.t(156,150,"flap","start","fb")}
 ${P.T(20,186,"Difference > 20 mmHg: think dissection")}`},
"heart-cycle":{t:"Where extra sounds fall",c:"S3 comes from rapid early filling hitting a stiff or dilated ventricle; S4 from atrial contraction into a stiff one. Both are low-pitched: bell, apex, left lateral.",
 s:()=>{const y=110;return `${P.ln(20,y,300,y,"var(--line)")}${P.r(40,y-30,8,60,"var(--ink)","none",2)}${P.T(44,y+46,"S1","middle")}${P.r(150,y-26,7,52,"var(--ink)","none",2)}${P.T(154,y+46,"S2","middle")}
 ${P.r(196,y-16,9,32,"var(--accent)","none",3)}${P.T(200,y+46,"S3","middle")}${P.r(282,y-14,9,28,"var(--insp)","none",3)}${P.T(286,y+46,"S4","middle")}
 ${P.t(98,y-40,"systole","middle")}${P.t(226,y-40,"diastole","middle")}${P.t(200,y+62,"120–180 ms after S2","middle")}${P.t(286,y+62,"just before S1","middle")}
 ${P.t(200,y-24,"rapid filling","middle","fa")}${P.t(286,y-24,"atrial kick","middle","fa2")}`;}},
postural:{t:"Postural vital signs",c:"Standing pools blood in the legs. With depleted volume, heart rate rises by 30 or more; this is the sign that detects large blood loss.",
 s:()=>`${P.r(60,110,50,60,"var(--surface2)","var(--line)",4)}${P.r(170,50,50,120,"var(--accent)","none",4)}${P.t(85,104,"88","middle","fb")}${P.t(195,44,"124","middle","fb")}
 ${P.t(85,186,"Supine 2 min","middle")}${P.t(195,186,"Standing 1 min","middle")}${P.ar(118,120,162,80)}${P.T(234,96,"+36/min")}${P.t(234,112,"≥ 30: large loss")}`},
clubbing:{t:"Finger clubbing",c:"The nail-fold angle rises above 180° and the nail bed becomes spongy; apposed nails lose Schamroth's diamond window.",
 s:()=>`${P.pa("M30 120 L120 120 Q150 120 154 100 L156 92 L118 88 L30 96 Z","var(--skin)","var(--line)")}${P.pa("M118 88 L156 92","none","var(--ink)",3)}${P.pa("M110 92 L118 88 L132 80","none","var(--accent)",1.4,'stroke-dasharray="3 3"')}${P.t(90,146,"Normal: angle < 180°","middle")}
 ${P.pa("M180 120 L262 120 Q300 122 300 96 Q296 76 270 76 L258 84 L180 96 Z","var(--skin)","var(--line)")}${P.pa("M258 84 Q284 72 298 92","none","var(--ink)",3)}${P.pa("M246 88 L258 84 L272 82","none","var(--accent)",1.4,'stroke-dasharray="3 3"')}${P.t(240,146,"Clubbed: > 180°, bulbous","middle")}`},
/* ---------------- respiratory ---------------- */
percussion:{t:"Percussion",c:"Strike the middle phalanx of the hand pressed flat on the chest. The note depends on the ratio of air to solid in the top 5 cm: air resonates, fluid is stony dull.",
 s:()=>`${P.r(20,120,280,64,"var(--skin)","var(--line)",6)}${P.r(30,140,130,40,"var(--insp)","none",4).replace('fill="var(--insp)"','fill="var(--insp)" fill-opacity=".12"')}${P.r(170,140,120,40,"var(--fluid)","none",4)}
 ${P.t(95,164,"air-filled lung: resonant","middle")}${P.t(230,164,"fluid: stony dull","middle")}
 ${P.r(70,100,90,14,"var(--skin)","var(--line)",7)}${P.r(108,96,14,22,"var(--accent-soft)","var(--accent)",4)}${P.ar(116,40,116,90)}${P.t(124,52,"plexor finger, wrist flick")}${P.t(20,96,"pleximeter finger flat on skin")}`},
fremitus:{t:"Voice transmission through lung",c:"Solid lung (consolidation) transmits voice and high frequencies; fluid or air in the pleura blocks them. Fremitus, vocal resonance, egophony and whispered pectoriloquy all use this.",
 s:()=>`${P.r(20,30,130,140,"var(--surface2)","var(--line)",10)}${P.r(170,30,130,140,"var(--surface2)","var(--line)",10)}
 ${P.r(40,60,90,80,"var(--muscle)","var(--muscle-line)",8)}${P.t(85,104,"consolidation","middle","fb")}${P.r(190,60,50,80,"var(--insp)","none",8).replace('fill="var(--insp)"','fill="var(--insp)" fill-opacity=".12"')}${P.r(240,40,40,120,"var(--fluid)","none",6)}${P.t(260,104,"fluid","middle","fb")}
 ${[0,1,2].map(i=>P.pa(`M${30+i*10} 40 Q${80+i*10} 100 ${30+i*10} 160`,"none","var(--accent)",2)).join("")}${P.ar(132,100,152,100)}${P.t(85,186,"increased: \"ninety-nine\" loud","middle")}
 ${[0,1,2].map(i=>P.pa(`M${180+i*10} 40 Q${220+i*10} 100 ${180+i*10} 160`,"none","var(--accent)",2,`stroke-opacity="${.9-i*.3}"`)).join("")}${P.x(290,100)}${P.t(235,186,"reduced: fluid or air blocks","middle")}`},
expansion:{t:"Chest expansion",c:"Hands around the lower chest, thumbs meeting in the midline. On deep inspiration the thumbs move apart symmetrically; one side lagging means pleural or lung disease on that side.",
 s:()=>`${P.pa("M60 40 Q160 20 260 40 L270 180 L50 180 Z","var(--skin)","var(--line)")}${P.ln(160,30,160,180,"var(--muted)",1,"3 4")}
 ${P.hand(118,118,0)}${P.hand(202,118,180)}${P.ar(150,140,124,140)}${P.ar(170,140,186,140,"var(--muted)",1.6)}${P.T(70,166,"normal side moves out")}${P.t(196,166,"affected side lags")}`},
hoover:{t:"Hyperinflation and Hoover's sign",c:"A flat diaphragm in severe COPD pulls the lower ribs inward when it contracts instead of lifting them outward; the larynx descends toward a raised sternum.",
 s:()=>`${P.pa("M40 150 Q90 70 140 150","none","var(--muscle-line)",5)}${P.ar(70,110,58,110,"var(--accent)",2)}${P.ar(110,110,122,110,"var(--accent)",2)}${P.t(90,176,"Dome: ribs move out","middle")}
 ${P.pa("M180 140 Q230 128 280 140","none","var(--muscle-line)",5)}${P.ar(196,120,212,128,"var(--bad)",2)}${P.ar(264,120,248,128,"var(--bad)",2)}${P.t(230,176,"Flat: ribs pulled in","middle")}
 ${P.pa("M40 150 L40 60 M140 150 L140 60 M180 140 L180 50 M280 140 L280 50","none","var(--bone-line)",4)}`},
trachea:{t:"Tracheal position",c:"The mediastinum is pushed away by tension pneumothorax or a massive effusion and pulled toward collapse or fibrosis. Deviation in tension pneumothorax is a late sign.",
 s:()=>`${P.r(146,20,28,60,"var(--surface2)","var(--line)",8)}${P.pa("M60 70 Q160 50 260 70 L270 190 L50 190 Z","var(--skin)","var(--line)")}
 ${P.e(110,130,40,52,"var(--insp)","none",0).replace('fill="var(--insp)"','fill="var(--insp)" fill-opacity=".15"')}${P.e(214,130,46,56,"var(--surface)","var(--bad)",1.6)}${P.t(214,134,"air under tension","middle","fb")}
 ${P.ar(186,50,148,50,"var(--accent)",2.4)}${P.t(150,16,"pushed away","middle","fa")}${P.t(110,188,"collapse pulls toward","middle")}`},
/* ---------------- abdomen ---------------- */
murphy:{t:"Murphy's sign",c:"Fingers hooked under the right costal margin at the lateral border of rectus. On deep inspiration the descending liver pushes an inflamed gallbladder onto the fingers, and breathing stops abruptly.",
 s:()=>`${P.pa("M40 60 Q160 30 280 60","none","var(--bone-line)",5)}${P.t(40,50,"costal margin")}${P.pa("M60 70 Q140 52 200 70 Q190 120 120 118 Q70 112 60 70 Z","var(--muscle)","var(--muscle-line)")}${P.t(110,94,"liver","middle")}
 ${P.e(178,112,16,24,"#8fb86a","#5d8a3c",1.4,-20)}${P.t(204,128,"gallbladder")}${P.hand(180,150,-90)}${P.ar(130,20,130,52,"var(--accent)",2)}${P.t(140,30,"inspiration: diaphragm descends")}${P.ar(178,136,178,122,"var(--accent)",2)}`},
shifting:{t:"Shifting dullness",c:"Free fluid sinks and gas-filled bowel floats. Flank dullness that moves to the dependent side when the patient rolls means ascites (needs about 1.5 L).",
 s:()=>`${P.e(80,100,62,48,"var(--surface2)","var(--line)")}${P.pa("M22 116 Q80 172 138 116 L138 120 Q80 166 22 120 Z","var(--fluid)","none")}${P.pa("M26 110 Q24 140 50 146 L50 120 Z M134 110 Q136 140 110 146 L110 120 Z","var(--fluid)","none")}${P.c(80,90,14,"var(--surface)","var(--muted)")}${P.c(62,98,10,"var(--surface)","var(--muted)")}${P.c(98,98,10,"var(--surface)","var(--muted)")}${P.t(80,170,"Supine: flanks dull","middle")}
 ${P.e(240,100,48,62,"var(--surface2)","var(--line)")}${P.pa("M196 110 Q192 156 240 162 L240 140 Q206 136 196 110 Z","var(--fluid)","none")}${P.c(248,80,14,"var(--surface)","var(--muted)")}${P.c(262,104,10,"var(--surface)","var(--muted)")}${P.t(236,186,"Rolled: upper flank resonant","middle")}${P.ar(146,100,180,100)}`},
fluidwave:{t:"Fluid wave",c:"A flick on one flank sends a pressure wave through free fluid to the other hand; a hand edge pressed on the midline stops a wave travelling through fat.",
 s:()=>`${P.e(160,110,120,56,"var(--fluid)","var(--line)")}${P.hand(36,110,0)}${P.hand(284,110,180)}${P.r(154,50,12,40,"var(--accent-soft)","var(--accent)",6)}${P.t(160,44,"midline hand","middle")}
 ${[0,1,2].map(i=>P.pa(`M${100+i*40} 90 Q${110+i*40} 110 ${100+i*40} 130`,"none","var(--vein)",2)).join("")}${P.ar(230,110,262,110,"var(--vein)",2)}${P.t(36,140,"tap","middle")}${P.t(284,140,"feel","middle")}`},
liver:{t:"Liver span and edge",c:"Percuss down the midclavicular line from resonance to dullness (upper border, about the 5th rib) and up from the abdomen (lower border). Normal span about 6–12 cm.",
 s:()=>`${P.skin("M40 20 L280 20 L280 190 L40 190 Z")}${P.pa("M60 70 Q170 40 260 80 Q230 130 160 140 Q90 146 60 70 Z","var(--muscle)","var(--muscle-line)")}${P.ln(120,20,120,190,"var(--accent)",1.2,"4 4")}
 ${P.ln(110,60,130,60,"var(--ink)",2)}${P.ln(110,140,130,140,"var(--ink)",2)}${P.ar(140,62,140,138,"var(--accent)",1.6)}${P.t(146,104,"span 6–12 cm")}${P.t(124,186,"MCL")}${P.t(30,56,"5th rib","start")}`},
spleen:{t:"Splenic enlargement",c:"The spleen lies under ribs 9–11 and enlarges down and medially toward the right iliac fossa, so start palpating from there. Traube's space (left lower ribs) becomes dull.",
 s:()=>`${P.skin("M40 20 L280 20 L280 190 L40 190 Z")}${P.c(160,110,4,"var(--ink)","none")}${P.t(168,114,"umbilicus")}
 ${P.e(240,60,22,34,"var(--artery)","none",0,30)}${P.pa("M262 40 Q236 120 150 160 Q200 100 230 40 Z","var(--artery)","none",0,'fill-opacity=".25"')}${P.ar(214,94,90,170,"var(--accent)",2)}${P.t(60,186,"start palpating here (RIF)")}
 ${P.pa("M200 30 L280 30 L280 70","none","var(--bone-line)",3)}${P.t(252,26,"Traube","middle")}`},
appendix:{t:"McBurney's point and the psoas",c:"McBurney's point lies two-thirds of the way from umbilicus to ASIS. A retrocaecal appendix lies on psoas, so hip extension stretches it (psoas sign); a pelvic one touches obturator internus.",
 s:()=>`${P.skin("M40 20 L280 20 L280 190 L40 190 Z")}${P.c(200,60,4,"var(--ink)","none")}${P.t(208,62,"umbilicus")}${P.c(90,150,5,"var(--bone-line)","none")}${P.t(56,170,"ASIS")}
 ${P.ln(200,60,90,150,"var(--muted)",1,"4 3")}${P.c(127,120,8,"var(--accent)","none")}${P.T(140,124,"McBurney")}${P.mus("M160 40 L176 40 L150 190 L132 190 Z")}${P.t(176,160,"psoas")}
 ${P.pa("M120 126 q-10 14 -2 26","none","#5d8a3c",5)}`},
aaa:{t:"Palpating the aorta",c:"Both hands either side of the aorta above the umbilicus. An aneurysm pushes the hands apart (expansile); a normal aorta only lifts them (transmitted).",
 s:()=>`${P.art("M110 30 L110 170",14)}${P.hand(86,100,0)}${P.hand(134,100,180)}${P.t(110,190,"Normal: lifted","middle")}
 ${P.e(230,100,22,36,"var(--artery)","none")}${P.art("M230 30 L230 64",12)}${P.art("M230 136 L230 170",12)}${P.hand(196,100,0)}${P.hand(264,100,180)}${P.ar(196,84,176,84)}${P.ar(264,84,284,84)}${P.t(230,190,"Aneurysm: expansile","middle")}`},
cva:{t:"Renal angle",c:"The kidneys lie at T12–L3; the upper pole sits under the 12th rib. Tenderness at the angle between the 12th rib and erector spinae suggests pyelonephritis or a stone.",
 s:()=>`${P.skin("M40 20 L280 20 L280 190 L40 190 Z")}${P.ln(160,20,160,190,"var(--bone-line)",8)}${P.pa("M150 70 Q100 60 60 90 M170 70 Q220 60 260 90","none","var(--bone-line)",4)}
 ${P.e(118,110,20,34,"var(--muscle)","var(--muscle-line)")}${P.e(202,110,20,34,"var(--muscle)","var(--muscle-line)")}${P.c(124,84,8,"var(--accent)","none")}${P.T(60,60,"renal angle")}${P.t(56,186,"12th rib · erector spinae")}`},
cremaster:{t:"Cremasteric reflex",c:"Stroking the inner thigh (L1 afferent) makes cremaster lift the testis (genitofemoral nerve, L1–L2). Usually absent in torsion.",
 s:()=>`${P.skin("M90 20 L230 20 L250 190 L70 190 Z")}${P.e(140,120,14,20,"var(--muscle)","var(--muscle-line)")}${P.e(182,110,14,20,"var(--muscle)","var(--muscle-line)")}${P.ar(182,136,182,118)}${P.ar(110,150,92,186,"var(--accent)",2)}${P.t(60,170,"stroke")}${P.t(200,100,"rises (normal)")}`},
/* ---------------- neurology ---------------- */
babinski:{t:"Plantar response",c:"Stroke the lateral sole and across the ball of the foot. Normal: the big toe flexes. Upper motor neuron lesion: the big toe extends and the other toes fan.",
 s:()=>`${P.pa("M90 30 Q140 20 150 60 L156 150 Q156 186 120 186 Q86 186 84 150 L80 70 Q80 36 90 30 Z","var(--skin)","var(--line)")}${P.pa("M146 150 Q150 90 140 60 Q120 44 100 54","none","var(--accent)",2.4,'stroke-dasharray="5 4"')}${P.ar(100,54,92,62)}${P.t(160,120,"lateral sole")}
 ${P.pa("M196 150 L196 112 Q196 100 208 100 L262 104 Q272 104 276 96 L286 64 Q290 58 296 62 Q300 66 298 72 L292 104 Q290 124 270 128 L212 134 Q204 150 196 150 Z","var(--skin)","var(--line)")}${P.ar(292,76,300,44,"var(--bad)",2.4)}${P.t(246,186,"extensor (up-going) = UMN","middle","fb")}${P.t(196,170,"big toe extends, toes fan","start")}`},
drift:{t:"Pronator drift",c:"Arms out, palms up, eyes closed. A corticospinal lesion weakens supinators and extensors more than pronators and flexors, so the arm pronates and drifts down.",
 s:()=>`${P.c(160,40,14,"var(--skin)","var(--line)")}${P.pa("M160 56 L160 120","none","var(--line)",14)}
 ${P.pa("M146 66 L40 66","none","var(--skin)",12)}${P.pa("M146 66 L40 66","none","var(--line)",1)}${P.t(40,56,"normal")}
 ${P.pa("M174 66 L280 92","none","var(--skin)",12)}${P.ar(270,72,284,104,"var(--accent)",2)}${P.T(214,124,"pronates and drifts")}`},
"reflex-arc":{t:"The stretch reflex and the upper motor neuron",c:"A tap stretches the spindle; the Ia afferent synapses directly on the alpha motor neuron. Descending corticospinal input normally damps the loop. Lose it and reflexes become brisk, with clonus.",
 s:()=>`${P.r(200,30,90,90,"var(--surface2)","var(--line)",40)}${P.t(245,80,"cord","middle")}${P.mus("M30 140 Q90 120 150 140 Q90 160 30 140 Z")}${P.t(90,174,"muscle and spindle","middle")}
 ${P.nv("M110 140 Q160 100 236 70",2.4)}${P.pa("M232 82 Q170 120 120 146","none","var(--artery)",2.4)}${P.t(150,98,"Ia afferent")}${P.t(140,146,"α motor neuron")}
 ${P.pa("M250 10 L250 50","none","var(--ink)",2,'stroke-dasharray="4 3"')}${P.x(250,26)}${P.t(244,22,"UMN lesion: inhibition lost","end")}${P.ar(40,110,56,132,"var(--accent)",2)}${P.t(20,104,"tap")}`},
romberg:{t:"Romberg: three inputs to balance",c:"Standing needs two of three: vision, proprioception (dorsal columns), vestibular. Closing the eyes removes vision and unmasks loss of one of the others. It does not test the cerebellum.",
 s:()=>`${P.pa("M160 30 L270 170 L50 170 Z","var(--surface2)","var(--line)")}${P.c(160,30,22,"var(--accent-soft)","var(--accent)")}${P.t(160,34,"vision","middle","fb")}${P.c(50,170,26,"var(--surface)","var(--nerve)",2)}${P.t(50,174,"position","middle","fb")}${P.c(270,170,26,"var(--surface)","var(--vein)",2)}${P.t(270,174,"vestibular","middle","fb")}
 ${P.t(160,120,"eyes closed","middle")}${P.x(160,30,"var(--bad)")}`},
hints:{t:"Head impulse test",c:"Turn the head quickly while the patient fixes on your nose. A working vestibulo-ocular reflex keeps the eyes on target. A peripheral lesion needs a catch-up saccade (reassuring in acute vertigo); a normal test with vertigo is the worrying one.",
 s:()=>`${P.c(80,100,40,"var(--skin)","var(--line)")}${P.c(66,92,7,"var(--surface)","var(--ink)")}${P.c(94,92,7,"var(--surface)","var(--ink)")}${P.c(70,92,3,"var(--ink)","none")}${P.c(98,92,3,"var(--ink)","none")}${P.t(80,170,"Normal: eyes stay on target","middle")}
 ${P.c(230,100,40,"var(--skin)","var(--line)")}${P.c(216,92,7,"var(--surface)","var(--ink)")}${P.c(244,92,7,"var(--surface)","var(--ink)")}${P.c(212,92,3,"var(--ink)","none")}${P.c(240,92,3,"var(--ink)","none")}${P.ar(206,72,224,72,"var(--bad)",2)}${P.t(230,170,"Peripheral: catch-up saccade","middle")}
 ${P.curv("M50 52 Q80 34 110 52")}${P.curv("M200 52 Q230 34 260 52")}<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--accent)"/></marker></defs>`},
dixhallpike:{t:"Dix–Hallpike and the posterior canal",c:"Turning the head 45° and lying back puts the posterior semicircular canal vertical; loose otoconia fall and deflect the cupula, giving torsional up-beating nystagmus after a few seconds.",
 s:()=>`${P.pa("M40 140 L160 140","none","var(--ink)",8)}${P.c(186,150,14,"var(--skin)","var(--line)")}${P.t(100,166,"head 45° to the side, hanging 20°","middle")}
 ${P.c(250,80,44,"none","var(--vein)",5)}${P.c(222,112,5,"var(--accent)","none")}${P.c(230,120,4,"var(--accent)","none")}${P.ar(214,100,226,126,"var(--accent)",1.6)}${P.t(250,20,"posterior canal","middle","fb")}${P.t(250,150,"otoconia move","middle","fa")}`},
pupil:{t:"Pupillary pathways",c:"Light in either eye constricts both pupils: afferent optic nerve, efferent oculomotor to both sides. An optic nerve lesion weakens the afferent arm (RAPD). Sympathetic fibres reach the eye along the carotid (Horner's).",
 s:()=>`${P.c(70,50,22,"var(--surface)","var(--ink)")}${P.c(250,50,22,"var(--surface)","var(--ink)")}${P.c(70,50,7,"var(--ink)","none")}${P.c(250,50,9,"var(--ink)","none")}
 ${P.nv("M86 66 L150 120 L234 66",2.4)}${P.r(140,112,40,24,"var(--surface2)","var(--line)",8)}${P.t(160,128,"midbrain","middle")}${P.pa("M140 130 Q100 110 76 72 M180 130 Q220 110 244 72","none","var(--accent)",2,'stroke-dasharray="4 3"')}
 ${P.x(108,84)}${P.t(20,110,"optic nerve lesion")}${P.t(160,170,"Afferent II (yellow) · efferent III (dashed)","middle")}`},
"visual-pathway":{t:"Visual pathway and field defects",c:"Nasal fibres cross at the chiasm. Pre-chiasmal lesions affect one eye, chiasmal ones both temporal fields, post-chiasmal ones the same side of both fields (homonymous).",
 s:()=>`${P.c(110,30,16,"var(--surface)","var(--ink)")}${P.c(210,30,16,"var(--surface)","var(--ink)")}${P.nv("M110 46 L160 90 L130 150",2)}${P.nv("M210 46 L160 90 L190 150",2)}${P.nv("M118 44 L150 90 L118 150",2)}${P.nv("M202 44 L170 90 L202 150",2)}
 ${P.x(160,90)}${P.t(176,96,"chiasm: bitemporal")}${P.x(196,128)}${P.t(214,132,"tract: homonymous")}${P.x(104,60)}${P.t(20,64,"nerve: one eye")}${P.r(110,156,100,24,"var(--surface2)","var(--line)",8)}${P.t(160,172,"occipital cortex","middle")}`},
facial:{t:"Upper vs lower motor neuron facial weakness",c:"The forehead receives input from both hemispheres; the lower face only from the opposite one. A stroke spares the forehead; a facial nerve lesion (Bell's) takes the whole side.",
 s:()=>`${P.e(90,100,48,62,"var(--skin)","var(--line)")}${P.pa("M66 72 Q78 64 90 72","none","var(--ink)",2)}${P.pa("M98 72 Q110 64 122 72","none","var(--ink)",2)}${P.pa("M70 132 Q90 140 104 128","none","var(--ink)",2)}${P.r(56,48,68,18,"var(--good-soft)","none",4).replace('fill="var(--good-soft)"','fill="var(--good-soft)" fill-opacity=".8"')}${P.t(90,182,"UMN (stroke): forehead spared","middle")}
 ${P.e(230,100,48,62,"var(--skin)","var(--line)")}${P.pa("M206 76 Q218 76 230 72","none","var(--ink)",2)}${P.pa("M238 72 Q250 64 262 72","none","var(--ink)",2)}${P.pa("M210 136 Q230 136 244 128","none","var(--ink)",2)}${P.r(184,48,46,100,"var(--bad-soft)","none",6)}${P.t(230,182,"LMN (Bell's): whole side","middle")}`},
dermatomes:{t:"Key dermatomes",c:"C6 thumb, C7 middle finger, C8 little finger, T4 nipple, T10 umbilicus, L4 medial shin, L5 dorsum of foot and big toe, S1 lateral foot and sole, S2–S5 saddle.",
 s:()=>`${P.c(160,26,14,"var(--skin)","var(--line)")}${P.pa("M140 42 L180 42 L188 120 L176 190 L144 190 L132 120 Z","var(--skin)","var(--line)")}${P.pa("M140 46 L100 110 M180 46 L220 110","none","var(--skin)",12)}
 ${P.c(98,114,5,"var(--accent)","none")}${P.T(60,118,"C6")}${P.c(222,114,5,"var(--nerve)","none")}${P.T(230,118,"C8")}${P.ln(132,70,188,70,"var(--accent)",1.4,"3 3")}${P.T(194,72,"T4")}${P.ln(134,104,186,104,"var(--accent)",1.4,"3 3")}${P.T(194,106,"T10")}
 ${P.c(150,184,4,"var(--accent)","none")}${P.T(110,186,"L5")}${P.c(176,186,4,"var(--vein)","none")}${P.T(186,190,"S1")}${P.e(160,128,10,6,"var(--accent-soft)","var(--accent)")}${P.T(196,132,"S2–5 saddle")}`},
slr:{t:"Straight leg raise",c:"Between about 30° and 70° the sciatic nerve roots are pulled 2–8 mm through the foramina. A root stuck on a disc gives pain below the knee; ankle dorsiflexion adds tension.",
 s:()=>`${P.pa("M30 170 L150 170","none","var(--ink)",10)}${P.c(20,166,10,"var(--skin)","var(--line)")}${P.pa("M150 170 L270 70","none","var(--skin)",14)}${P.nv("M140 168 L268 74",2)}${P.pa("M196 170 A50 50 0 0 0 184 140","none","var(--accent)",1.4)}${P.t(204,160,"30–70°")}
 ${P.ar(270,70,260,48)}${P.t(232,40,"dorsiflex")}${P.r(120,152,22,14,"var(--bone)","var(--bone-line)",3)}${P.c(140,160,4,"var(--accent)","none")}${P.t(84,146,"disc on root")}`},
"hoover-func":{t:"Hoover's sign (functional weakness)",c:"Flexing one hip against resistance automatically extends the other. A 'weak' leg that pushes down hard on your hand during contralateral flexion has intact automatic power.",
 s:()=>`${P.pa("M30 150 L290 150","none","var(--ink)",8)}${P.c(20,146,10,"var(--skin)","var(--line)")}${P.pa("M150 146 L230 90","none","var(--skin)",12)}${P.ar(240,70,224,94)}${P.t(316,62,"flex strong leg against resistance","end")}${P.hand(260,166,180)}${P.ar(260,150,260,172,"var(--good)",2.4)}${P.t(180,190,"'weak' heel pushes down")}`},
/* ---------------- neuro additions ---------------- */
cord:{t:"Spinal cord cross-section",c:"Dorsal columns (vibration, proprioception) run up on the same side and cross in the medulla. Spinothalamic fibres (pain, temperature) cross within one or two segments of entering. The corticospinal tract has already crossed in the medulla. That is why a hemisection splits the sensory loss.",
 s:()=>`${P.e(160,100,120,78,"var(--surface)","var(--line)",1.6)}${P.pa("M160 60 Q120 40 104 66 Q96 90 122 100 Q96 116 110 146 Q130 160 160 136 Q190 160 210 146 Q224 116 198 100 Q224 90 216 66 Q200 40 160 60 Z","var(--surface3)","var(--muted)",1.2)}
 ${P.pa("M144 26 L176 26 L170 70 L150 70 Z","var(--insp)","none",0,'fill-opacity=".55"')}${P.T(160,18,"Dorsal columns","middle")}
 ${P.e(86,96,22,20,"var(--accent)","none")}${P.e(234,96,22,20,"var(--accent)","none")}${P.t(14,70,"Lateral corticospinal")}
 ${P.e(96,140,22,16,"var(--good)","none")}${P.e(224,140,22,16,"var(--good)","none")}${P.t(14,170,"Spinothalamic")}
 ${P.c(160,176,5,"var(--artery)","none")}${P.t(170,194,"anterior spinal artery")}${P.t(160,104,"grey matter","middle")}
 ${P.t(304,96,"posterior ↑","end")}`},
"cn-brainstem":{t:"Where the cranial nerves leave the brainstem",c:"Rule of 4: four nerves in the midbrain and above (I–IV), four in the pons (V–VIII), four in the medulla (IX–XII). The motor nuclei that divide evenly into 12 (III, IV, VI, XII) lie near the midline: medial brainstem strokes take them; lateral strokes take V, VII, VIII, IX, X and the spinothalamic tract.",
 s:()=>`${P.r(110,20,100,40,"var(--surface3)","var(--line)",14)}${P.T(160,44,"Midbrain","middle")}${P.r(100,64,120,58,"var(--surface2)","var(--line)",22)}${P.T(160,96,"Pons","middle")}${P.r(116,126,88,52,"var(--surface3)","var(--line)",14)}${P.T(160,156,"Medulla","middle")}
 ${P.t(100,36,"III  IV","end","fa")}${P.t(222,36,"(I, II above)")}${P.t(92,92,"V  VI  VII  VIII","end","fa")}${P.t(214,150,"IX  X  XI  XII","start","fa")}${P.t(160,194,"midline motor: III, IV, VI, XII","middle")}`},

homunculus:{t:"The motor strip and its arteries",c:"In a coronal slice, the leg area of the motor cortex hangs over the medial surface (ACA territory); trunk, arm, hand and face run down the lateral convexity (MCA territory). That is why ACA strokes hit the leg and MCA strokes the face and arm, and why a parasagittal mass can weaken both legs.",
 s:()=>`${P.pa("M40 186 Q30 60 160 30 L160 186","none","var(--muted)",1.6)}${P.pa("M280 186 Q290 60 160 30","none","var(--muted)",1.6)}${P.ln(160,30,160,190,"var(--line)",1.2,"4 3")}
 ${P.pa("M152 40 Q156 70 152 104","none","#2f9a5c",10)}${P.T(140,72,"leg","end")}${P.pa("M146 36 Q100 40 74 74","none","var(--accent)",10)}${P.pa("M74 74 Q50 110 46 150","none","var(--accent)",10)}
 ${P.t(118,50,"trunk","middle")}${P.t(56,98,"arm, hand","end")}${P.t(40,166,"face","end")}
 ${P.T(196,66,"ACA: medial")}${P.t(196,80,"surface → leg")}${P.T(196,136,"MCA: lateral")}${P.t(196,150,"convexity → face,")}${P.t(196,164,"arm, hand")}${P.ln(158,74,196,70,"#2f9a5c",1.2)}${P.ln(62,120,196,140,"var(--accent)",1.2,"3 3")}`},
"vasc-territories":{t:"Cerebral arterial territories",c:"Lateral view: the MCA supplies most of the convexity, the ACA a strip along the top (and the medial surface), the PCA the occipital lobe and inferior temporal lobe. Watershed (border-zone) infarcts fall between them after hypotension.",
 s:()=>`${P.pa("M40 120 Q34 46 120 28 Q210 14 268 60 Q300 92 286 138 Q268 172 220 170 L180 168 Q150 186 110 178 Q60 170 40 120 Z","var(--surface2)","var(--line)",1.6)}
 ${P.pa("M44 96 Q50 40 120 30 Q210 16 268 60 Q240 50 200 46 Q130 42 80 70 Q60 82 44 96 Z","#2f9a5c","none",0,'fill-opacity=".55"')}
 ${P.pa("M268 60 Q300 92 286 138 Q268 172 220 170 Q236 130 240 96 Q246 72 268 60 Z","var(--insp)","none",0,'fill-opacity=".55"')}${P.pa("M220 170 L180 168 Q200 156 236 150 Z","var(--insp)","none",0,'fill-opacity=".55"')}
 ${P.pa("M44 98 Q60 80 82 70 Q130 44 200 48 Q244 60 240 96 Q236 130 222 168 L180 166 Q150 182 110 176 Q62 168 44 120 Z","var(--accent)","none",0,'fill-opacity=".45"')}
 ${P.T(132,112,"MCA","middle")}${P.T(140,38,"ACA (top strip)","middle")}${P.T(262,116,"PCA","middle")}${P.t(30,24,"front ←")}${P.t(20,196,"Lateral view of the left hemisphere")}`},
"medulla-x":{t:"Medulla: medial vs lateral",c:"Medial (Dejerine): pyramid, medial lemniscus, XII. Lateral (Wallenberg): spinothalamic tract, spinal trigeminal nucleus, nucleus ambiguus (IX, X), descending sympathetic fibres, inferior cerebellar peduncle, vestibular nuclei. Limb weakness means medial; crossed face–body sensory loss means lateral.",
 s:()=>`${P.pa("M160 22 Q250 24 266 96 Q270 150 210 176 L160 182 L110 176 Q50 150 54 96 Q70 24 160 22 Z","var(--surface)","var(--line)",1.6)}${P.ln(160,22,160,182,"var(--line)",1,"3 3")}
 ${P.r(140,140,40,30,"var(--accent)","none",6)}${P.t(160,160,"pyramids","middle","fb")}${P.r(146,96,28,40,"var(--insp)","none",6).replace('fill="var(--insp)"','fill="var(--insp)" fill-opacity=".6"')}${P.t(160,92,"medial lemniscus","middle")}${P.c(160,56,8,"var(--good)","none")}${P.t(172,52,"XII")}
 ${P.e(232,124,16,12,"var(--good)","none")}${P.t(250,150,"spinothalamic")}${P.e(238,84,12,14,"var(--nerve)","none")}${P.t(256,72,"spinal V")}${P.c(212,112,7,"var(--artery)","none")}${P.t(200,132,"ambiguus","end")}${P.e(250,104,8,8,"var(--muted)","none")}${P.t(290,116,"sympathetic","end")}
 ${P.T(70,194,"MEDIAL","middle")}${P.T(250,194,"LATERAL","middle")}`},

/* ---------------- head & neck ---------------- */
rinne:{t:"Rinne and Weber",c:"Bone conduction bypasses the middle ear. Conductive loss: bone louder than air (Rinne negative) and Weber lateralises to the bad ear. Sensorineural loss: Weber goes to the good ear.",
 s:()=>`${P.e(90,100,40,56,"var(--skin)","var(--line)")}${P.pa("M60 76 L60 130","none","var(--ink)",2)}${P.pa("M120 92 q14 8 0 20","none","var(--line)",2)}${P.r(138,66,6,40,"var(--muted)","none",2)}${P.r(150,66,6,40,"var(--muted)","none",2)}${P.t(150,120,"air","middle")}${P.r(110,130,8,30,"var(--muted)","none",2)}${P.t(104,194,"bone (mastoid)","middle")}
 ${P.e(240,100,40,56,"var(--skin)","var(--line)")}${P.r(236,26,8,30,"var(--muted)","none",2)}${P.t(240,20,"vertex","middle")}${P.ar(240,70,212,110,"var(--accent)",1.6)}${P.t(240,176,"Weber: goes to conductive side","middle")}`},
tm:{t:"Tympanic membrane (right ear)",c:"Handle of the malleus runs down and back to the umbo; the cone of light points antero-inferiorly. Bulging with loss of landmarks is otitis media; the attic (pars flaccida) is where cholesteatoma starts.",
 s:()=>`${P.c(160,100,72,"var(--skin)","var(--line)",2)}${P.pa("M152 40 L170 104","none","var(--ink)",4)}${P.c(170,104,4,"var(--ink)","none")}${P.pa("M176 112 L214 150 L196 156 Z","var(--surface)","none")}${P.r(128,32,48,16,"var(--accent-soft)","none",8)}
 ${P.t(152,26,"pars flaccida (attic)","middle")}${P.t(232,162,"cone of light")}${P.t(176,96,"umbo")}${P.t(96,60,"malleus")}`},
thyroid:{t:"Thyroid and the larynx",c:"The isthmus lies over tracheal rings 2–4 below the cricoid. The gland is invested in pretracheal fascia attached to the larynx, so it rises when the patient swallows.",
 s:()=>`${P.r(140,20,40,30,"var(--bone)","var(--bone-line)",8)}${P.t(186,38,"thyroid cartilage")}${P.r(146,54,28,12,"var(--bone)","var(--bone-line)",6)}${P.t(186,64,"cricoid")}${P.r(148,70,24,110,"var(--surface2)","var(--line)",6)}
 ${P.e(126,104,18,34,"var(--artery)","none")}${P.e(194,104,18,34,"var(--artery)","none")}${P.r(140,94,40,16,"var(--artery)","none",6)}${P.t(60,108,"lobes","start")}${P.ar(230,130,230,96)}${P.t(316,152,"rises on swallowing","end")}`},
nodes:{t:"Cervical lymph node levels",c:"I submental and submandibular, II–IV along the internal jugular (upper, middle, lower), V posterior triangle, VI central, plus supraclavicular. Each drains predictable sites.",
 s:()=>`${P.skin("M90 20 Q160 0 230 20 Q240 70 210 90 L210 120 Q250 130 270 190 L50 190 Q70 130 110 120 L110 90 Q80 70 90 20 Z")}${P.mus("M120 80 Q150 130 166 190 L156 190 Q140 130 112 86 Z")}
 ${[["I",150,84],["II",126,100],["III",140,130],["IV",152,160],["V",200,150],["VI",168,140]].map(([l,x,y])=>P.c(x,y,9,"var(--accent-soft)","var(--accent)")+P.t(x,y+3,l,"middle","fb")).join("")}${P.c(226,182,8,"var(--bad-soft)","var(--bad)")}${P.t(240,170,"supraclavicular")}`},
/* ---------------- musculoskeletal ---------------- */
"shoulder-arc":{t:"Painful arc",c:"Between about 60° and 120° of abduction the greater tuberosity and supraspinatus pass under the acromion and coracoacromial ligament. Pain only at the top of elevation points to the AC joint.",
 s:()=>`${P.bone(130,60,200,58,14)}${P.t(204,52,"acromion")}${P.c(140,96,24,"var(--bone)","var(--bone-line)")}${P.bone(140,110,150,190,18)}${P.mus("M150 80 Q180 74 200 70 L202 78 Q178 86 158 94 Z")}${P.t(208,88,"supraspinatus")}
 ${P.pa("M150 96 m60 0 a60 60 0 0 0 -30 -52","none","var(--good)",6)}${P.pa("M150 96 m-30 -52 a60 60 0 0 0 -42 -6","none","var(--bad)",6)}${P.pa("M150 96 m-72 -58 a60 60 0 0 0 -0 0","none","var(--good)",6)}
 ${P.t(230,120,"0–60° painless")}${P.T(60,24,"60–120° painful")}${P.t(20,64,"> 120°: AC joint")}`},
cuff:{t:"Rotator cuff and its tests",c:"Supraspinatus (empty can, drop arm), infraspinatus and teres minor (external rotation, lag sign), subscapularis (lift-off, belly press). They compress the humeral head into the glenoid so deltoid can elevate the arm.",
 s:()=>`${P.c(160,100,44,"var(--bone)","var(--bone-line)")}${P.mus("M126 64 Q160 36 200 58 L192 70 Q160 54 132 74 Z")}${P.T(204,52,"Supraspinatus")}${P.t(204,64,"empty can · drop arm")}
 ${P.mus("M206 92 Q228 110 212 140 L200 132 Q210 112 196 98 Z")}${P.T(222,108,"Infraspinatus +")}${P.T(222,120,"teres minor")}${P.t(222,132,"ER strength, lag")}${P.mus("M116 92 Q96 116 112 144 L124 136 Q112 116 126 100 Z")}${P.T(20,112,"Subscapularis")}${P.t(20,124,"lift-off · belly press")}
 ${P.t(160,104,"humeral head","middle")}`},
"er-lag":{t:"External rotation lag sign",c:"Passively rotate the forearm outward, support the elbow, release the wrist. A torn infraspinatus/supraspinatus can't hold the position and the forearm drifts back toward the abdomen.",
 s:()=>`${P.c(160,40,12,"var(--skin)","var(--line)")}${P.pa("M160 52 L160 130","none","var(--line)",14)}${P.pa("M174 62 L180 120","none","var(--skin)",12)}${P.pa("M180 120 L260 112","none","var(--skin)",11)}${P.pa("M180 120 L232 160","none","var(--skin)",11,'stroke-opacity=".45"')}
 ${P.ar(262,130,238,152,"var(--bad)",2.4)}${P.t(244,104,"held outward")}${P.t(200,184,"drifts back = lag","middle","fb")}`},
apprehension:{t:"Apprehension and relocation",c:"Abduction plus external rotation levers the humeral head forward against a deficient anterior capsule and labrum; pushing the head backward (relocation) relieves the apprehension.",
 s:()=>`${P.pa("M40 150 L180 150","none","var(--ink)",10)}${P.c(30,146,10,"var(--skin)","var(--line)")}${P.pa("M150 140 L210 140","none","var(--skin)",12)}${P.pa("M210 140 L214 70","none","var(--skin)",11)}${P.curv("M240 110 Q246 76 220 60")}
 ${P.c(150,140,10,"var(--bone)","var(--bone-line)")}${P.ar(150,112,150,132,"var(--good)",2.2)}${P.t(160,108,"relocation: push back")}${P.t(316,140,"external rotation","end")}<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--accent)"/></marker></defs>`},
"elbow-ext":{t:"Elbow extension test",c:"An elbow that straightens fully is very unlikely to be fractured. Blood in the joint holds it in partial flexion, where the capsule is largest.",
 s:()=>`${P.bone(40,100,150,100,14)}${P.bone(150,100,270,100,12)}${P.c(150,100,10,"var(--bone)","var(--bone-line)")}${P.t(150,130,"full extension: fracture unlikely","middle","fb")}
 ${P.bone(40,170,140,170,14)}${P.bone(140,170,230,130,12)}${P.e(140,168,18,12,"var(--artery)","none")}${P.t(176,192,"haemarthrosis: can't straighten → X-ray","middle")}`},
cts:{t:"Carpal tunnel",c:"The median nerve shares the tunnel with nine flexor tendons under the transverse carpal ligament. Wrist flexion (Phalen) raises tunnel pressure; tapping (Tinel) fires a damaged nerve. The palmar branch leaves before the tunnel, so palm sensation is spared.",
 s:()=>`${P.pa("M40 160 Q60 60 160 50 Q260 60 280 160 Z","var(--bone)","var(--bone-line)")}${P.pa("M60 150 Q160 70 260 150","none","var(--muted)",1)}${P.pa("M50 88 Q160 40 270 88","none","var(--ink)",6)}${P.T(160,22,"transverse carpal ligament","middle")}
 ${[...Array(9)].map((_,i)=>P.c(96+i*15+(i>4?6:0),118+(i%2)*14,7,"var(--surface)","var(--muted)")).join("")}${P.e(160,94,14,9,"var(--nerve)","none")}${P.T(178,110,"median nerve")}${P.t(160,186,"flexor tendons","middle")}`},
finkelstein:{t:"Finkelstein's test",c:"Thumb tucked into the fist, wrist deviated toward the little finger. This stretches abductor pollicis longus and extensor pollicis brevis in the first dorsal compartment over the radial styloid.",
 s:()=>`${P.bone(30,110,160,110,18)}${P.pa("M160 96 Q200 90 230 120 Q240 150 206 156 Q170 150 160 124 Z","var(--skin)","var(--line)")}${P.pa("M160 90 Q200 70 232 114","none","var(--muscle-line)",4)}${P.ar(236,150,250,176)}${P.t(244,190,"ulnar deviation")}${P.c(160,96,8,"var(--accent)","none")}${P.t(100,78,"1st dorsal compartment")}`},
snuffbox:{t:"Anatomical snuffbox",c:"Bounded by extensor pollicis longus and the APL/EPB tendons with the thumb extended. The scaphoid waist forms its floor; the radial artery crosses it. Tenderness after a fall: treat as a scaphoid fracture.",
 s:()=>`${P.bone(30,110,140,110,18)}${P.e(162,108,16,12,"var(--accent)","none")}${P.t(162,138,"scaphoid","middle","fb")}${P.bone(178,104,280,70,12)}${P.pa("M140 92 Q200 70 270 56","none","var(--muscle-line)",3)}${P.pa("M140 126 Q200 106 276 82","none","var(--muscle-line)",3)}
 ${P.art("M120 140 Q160 128 196 120",2.4)}${P.t(200,48,"EPL")}${P.t(240,104,"APL / EPB")}${P.t(84,158,"radial artery")}`},
spurling:{t:"Spurling's test",c:"Extension, rotation and side-flexion toward the painful side narrow the intervertebral foramen; axial pressure compresses an irritated nerve root and reproduces arm pain.",
 s:()=>`${[0,1,2].map(i=>P.r(120,40+i*44,80,30,"var(--bone)","var(--bone-line)",6)).join("")}${[0,1].map(i=>P.r(124,72+i*44,72,10,"var(--muscle)","none",4)).join("")}${P.nv("M200 86 Q240 92 290 120",3)}${P.e(200,86,9,7,"none","var(--accent)",2)}${P.ar(160,4,160,34)}${P.t(170,16,"axial load")}${P.t(210,140,"root in foramen")}`},
faber:{t:"FABER (figure-of-four)",c:"Flexion, abduction and external rotation, then pressure on the knee. Groin pain suggests the hip joint; buttock or back pain suggests the sacroiliac joint.",
 s:()=>`${P.pa("M30 150 L290 150","none","var(--ink)",8)}${P.c(20,146,10,"var(--skin)","var(--line)")}${P.pa("M150 146 L216 92 L254 148","none","var(--skin)",12)}${P.ar(216,66,216,88)}${P.c(150,146,7,"var(--accent)","none")}${P.t(84,128,"groin = hip")}${P.t(226,70,"press")}`},
hip:{t:"Hip: intra-articular tests",c:"Rolling the straight leg (log roll) moves only the femoral head in the acetabulum. Flexion with internal rotation (FADIR) brings the head–neck junction against the anterior rim; loss of internal rotation is the first sign of OA.",
 s:()=>`${P.c(140,90,46,"var(--bone)","var(--bone-line)")}${P.pa("M86 60 Q140 20 196 60","none","var(--bone-line)",10)}${P.bone(170,110,270,170,22)}${P.t(140,94,"femoral head","middle")}${P.curv("M240 190 Q290 170 280 130")}${P.t(204,118,"rotate")}<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--accent)"/></marker></defs>${P.t(60,30,"acetabulum")}`},
trendelenburg:{t:"Trendelenburg sign",c:"Standing on one leg, gluteus medius on the stance side holds the pelvis level. If it is weak (or the hip is painful), the pelvis drops on the opposite side.",
 s:()=>`${P.pa("M60 52 L260 76","none","var(--bone-line)",10)}${P.bone(120,60,120,190,14)}${P.bone(222,74,232,150,14)}${P.mus("M70 66 Q100 110 126 102 L130 90 Q104 92 84 62 Z")}${P.t(30,120,"gluteus medius")}${P.ar(276,60,276,92,"var(--bad)",2.4)}${P.t(316,176,"opposite side drops","end")}${P.t(100,196,"stance leg","middle")}`},
schober:{t:"Modified Schober's test",c:"Mark the dimples of Venus (S2) level, 10 cm above and 5 cm below. On full flexion the 15 cm should lengthen by at least 5 cm.",
 s:()=>`${P.r(130,20,60,170,"var(--skin)","var(--line)",10)}${P.ln(120,60,200,60,"var(--accent)",2)}${P.ln(120,140,200,140,"var(--ink)",2)}${P.ln(120,170,200,170,"var(--accent)",2)}${P.t(206,64,"+10 cm")}${P.t(206,144,"S2 (dimples)")}${P.t(206,174,"−5 cm")}${P.T(20,104,"≥ 20 cm on flexion")}`},
lachman:{t:"Lachman test",c:"Knee at 20–30°: stabilise the femur, pull the tibia forward. The ACL is the main restraint here and the hamstrings can't guard, so a soft end-point with increased translation means rupture.",
 s:()=>`${P.bone(30,90,150,104,22)}${P.bone(150,108,290,130,18)}${P.pa("M146 100 L162 112","none","var(--accent)",5)}${P.t(150,86,"ACL","middle","fb")}${P.hand(70,70,0)}${P.t(44,52,"stabilise femur")}${P.hand(220,150,180)}${P.ar(220,170,218,138)}${P.t(210,190,"pull tibia forward","middle")}${P.t(250,104,"20–30°")}`},
pcl:{t:"Posterior sag and drawer",c:"Knees at 90°, feet flat. Without the PCL, gravity drops the tibia backward and the normal anterior step of the tibial plateau disappears.",
 s:()=>`${P.bone(40,110,150,60,20)}${P.bone(150,64,170,180,16)}${P.t(100,130,"Normal","middle")}${P.bone(170,110,270,60,20)}${P.bone(262,72,276,180,16)}${P.ar(292,96,276,106,"var(--bad)",2.4)}${P.t(230,196,"tibia sags back","middle","fb")}`},
collateral:{t:"Valgus and varus stress",c:"At 30° of flexion the collateral ligament is isolated. Valgus stress (knee pushed inward) opens the medial side if the MCL is torn; varus opens the lateral side (LCL). Laxity at 0° means a combined injury.",
 s:()=>`${P.bone(160,20,150,100,22)}${P.bone(150,104,170,190,18)}${P.pa("M134 90 L132 120","none","var(--accent)",4)}${P.t(80,110,"MCL")}${P.ar(230,100,176,100)}${P.t(232,96,"push knee in")}${P.ar(110,170,140,170)}${P.t(60,186,"ankle out")}`},
mcmurray:{t:"McMurray test",c:"Full flexion, rotation of the tibia, then extension under varus or valgus load. A torn meniscal fragment caught between femur and tibia clicks and hurts.",
 s:()=>`${P.e(160,70,110,30,"var(--bone)","var(--bone-line)")}${P.e(160,130,110,26,"var(--bone)","var(--bone-line)")}${P.pa("M60 100 Q100 88 140 100 Q100 112 60 100 Z","var(--muscle)","var(--muscle-line)")}${P.pa("M180 100 Q220 88 260 100 Q220 112 180 100 Z","var(--muscle)","var(--muscle-line)")}${P.x(100,100)}${P.t(60,140,"medial meniscus tear")}${P.curv("M240 170 Q270 190 296 170")}<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--accent)"/></marker></defs>${P.t(230,196,"rotate + extend")}`},
effusion:{t:"Bulge sign and patellar tap",c:"Stroke fluid up the medial side into the suprapatellar pouch, then down the lateral side: a small effusion refills the medial hollow. Large effusions float the patella (tap).",
 s:()=>`${P.e(160,100,70,86,"var(--skin)","var(--line)")}${P.e(160,96,26,30,"var(--bone)","var(--bone-line)")}${P.pa("M120 40 Q160 20 200 40 Q190 60 160 62 Q130 60 120 40 Z","var(--fluid)","none")}${P.t(316,26,"suprapatellar pouch","end")}
 ${P.ar(118,150,118,70)}${P.ar(204,70,204,150,"var(--vein)",2)}${P.t(60,110,"1. stroke up")}${P.t(212,120,"2. stroke down")}`},
ottawa:{t:"Ottawa ankle and foot rules",c:"X-ray if there is malleolar-zone pain plus bone tenderness at the posterior edge or tip of either malleolus (distal 6 cm), or inability to bear weight for four steps. Foot: navicular or base of 5th metatarsal.",
 s:()=>`${P.pa("M120 20 L170 20 L172 120 Q176 150 220 156 L296 160 Q306 176 290 184 L130 184 Q112 180 116 150 Z","var(--skin)","var(--line)")}${P.pa("M164 60 L168 128","none","var(--accent)",6)}${P.c(168,132,8,"var(--accent)","none")}${P.T(178,72,"Posterior edge,")}${P.T(178,84,"distal 6 cm")}
 ${P.c(238,166,7,"var(--vein)","none")}${P.t(218,196,"5th MT base")}${P.c(150,150,7,"var(--vein)","none")}${P.t(84,150,"navicular")}`},
"ankle-drawer":{t:"Ankle anterior drawer",c:"The ATFL is the first ligament torn in inversion. Draw the heel forward with the tibia stabilised; excess translation or a dimple at the front of the lateral ankle means rupture. Best at 4–5 days.",
 s:()=>`${P.bone(140,20,146,110,20)}${P.c(150,124,18,"var(--bone)","var(--bone-line)")}${P.pa("M160 112 L188 128","none","var(--accent)",4)}${P.t(194,124,"ATFL")}${P.pa("M120 140 L272 150","none","var(--skin)",22)}${P.ar(110,160,140,160)}${P.t(40,180,"draw heel forward")}`},
squeeze:{t:"Syndesmosis squeeze test",c:"Compressing tibia and fibula at mid-calf springs them apart at the ankle; pain above the joint line suggests a syndesmotic (high) sprain.",
 s:()=>`${P.bone(130,20,130,180,20)}${P.bone(170,24,176,180,10)}${P.ar(96,90,118,90)}${P.ar(214,90,186,90)}${P.t(150,16,"squeeze mid-calf","middle")}${P.pa("M134 170 L172 172","none","var(--bad)",4)}${P.t(186,180,"pain here")}`},
thompson:{t:"Thompson test",c:"Squeezing the calf shortens gastrocnemius–soleus; with an intact Achilles the foot plantar flexes. No movement means rupture.",
 s:()=>`${P.pa("M40 60 L200 60 Q250 64 250 100 L246 130","none","var(--skin)",28)}${P.mus("M80 46 Q140 30 200 50 L200 72 Q140 86 80 74 Z")}${P.hand(130,30,90)}${P.ar(254,140,282,168)}${P.t(316,192,"plantar flexion = intact","end")}${P.pa("M226 74 L246 124","none","var(--muscle-line)",3)}${P.t(150,110,"Achilles")}`},
foot:{t:"Diabetic foot screen",c:"10 g monofilament at the plantar big toe and 1st, 3rd and 5th metatarsal heads; vibration at the big toe tip. Inability to feel them means loss of protective sensation.",
 s:()=>`${P.pa("M120 30 Q170 10 200 40 Q214 80 206 130 Q200 184 160 188 Q118 186 116 140 Q110 90 120 30 Z","var(--skin)","var(--line)")}${[[150,40],[132,70],[160,70],[192,74]].map(([x,y])=>P.c(x,y,7,"var(--accent-soft)","var(--accent)")).join("")}${P.t(214,44,"big toe")}${P.t(214,80,"metatarsal heads")}${P.pa("M60 70 L110 70 M60 70 Q60 40 70 30","none","var(--ink)",2)}${P.t(20,96,"10 g")}`}
};
const FIG_USED=new Set();Object.values(SIGNS).forEach(s=>{if(s.fig)FIG_USED.add(s.fig);});
function fig(id,opt={}){
  const f=FIG[id];if(!f)return "";
  let inner="";try{inner=f.s();}catch(e){console.warn("figure",id,e);return "";}
  return `<figure class="fig${opt.small?" small":""}"><svg viewBox="0 0 320 200" role="img" aria-label="${esc(f.t)}">${inner}</svg>${opt.nocap?"":`<figcaption><b>${esc(f.t)}.</b> ${esc(f.c)}${opt.nosketch?"":` <button class="link small" data-sketch="${id}" data-title="${esc(f.t)}">Draw it from memory</button>`}</figcaption>`}</figure>`;
}
