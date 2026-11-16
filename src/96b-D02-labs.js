"use strict";
/* ================= LAB PANELS (D02): grouped list, reading steps, values, patterns and the ABG / VBG / CSF readers =================
   Re-registers tools:labs and tools:lab after 96-calcs-labs.js. Reads the optional LABS fields steps[], interp ("abg"|"vbg"|"csf"). */
const LAB_GROUPS=[["Blood counts and clotting",["fbc","coagulation","d-dimer"]],["Kidney, salts and bone",["u-and-e","calcium-bone","urinalysis"]],["Acid–base and gases",["blood-gas","vbg","lactate"]],["Heart",["troponin","natriuretic"]],["Liver, glucose and hormones",["lfts","glucose-hba1c","thyroid"]],["Infection and inflammation",["inflammatory","csf"]]];
const LAB_REL={fbc:{maps:["gi-bleed-and-liver"]},"u-and-e":{tools:["egfr-ckdepi-2021","cockcroft-gault","corrected-na","anion-gap"]},lfts:{maps:["gi-bleed-and-liver"],tools:["child-pugh","meld","maddrey"]},inflammatory:{maps:["sepsis-recognition"]},troponin:{maps:["chest-pain"],tools:["heart"]},natriuretic:{maps:["heart-failure","dyspnoea"]},"d-dimer":{maps:["chest-pain"],tools:["wells-pe","perc","years","wells-dvt"]},lactate:{maps:["shock","sepsis-recognition"],labs:["blood-gas","vbg"]},"blood-gas":{maps:["dyspnoea","shock"],tools:["anion-gap","winters","delta-ratio","aa-gradient","osmolar-gap"],labs:["vbg","lactate"]},vbg:{maps:["sepsis-recognition"],tools:["anion-gap","winters","delta-ratio","osmolar-gap"],labs:["blood-gas","lactate","glucose-hba1c"]},"glucose-hba1c":{labs:["vbg"]},thyroid:{maps:["thyroid"]},"calcium-bone":{tools:["corrected-ca"]},coagulation:{tools:["four-ts"],labs:["d-dimer"]},csf:{maps:["headache-red-flags","sepsis-recognition"],tools:["ottawa-sah"]}};
const LABRD={abg:{},vbg:{},csf:{}};
function labNum(raw){if(raw==null)return null;let s=String(raw).trim();if(!s)return null;
  s=s.replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660)).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-0x6F0)).replace(/[٫,]/g,".").replace(/[^0-9.\-]/g,"");
  if(!s||s==="-"||s==="."||(s.match(/\./g)||[]).length>1)return null;const n=+s;return isFinite(n)?n:null;}
const lf=(v,d=1)=>{if(v==null||!isFinite(v))return "?";const r=Math.round(v*Math.pow(10,d))/Math.pow(10,d);return String(r).replace("-","−");};

/* ---------- gas reader: returns {lines:[[title,text,tone]],summary} ---------- */
function gasRead(s,venous){
  const out=[],sum=[];const add=(t,x,tone)=>out.push([t,x,tone||""]);
  const ph=s.ph,hco3=s.hco3;let pco2=s.pco2,po2=s.po2;let unit=s.unit||"kPa";const notes=[];
  if(ph==null||hco3==null||pco2==null)return {need:true};
  if(ph<6.5||ph>8){return {bad:"A pH of "+lf(ph,2)+" is outside what a living patient can have. Check the value."};}
  if(unit==="kPa"&&pco2>20){unit="mmHg";notes.push("pCO2 above 20 read as mmHg.");}
  if(unit==="mmHg"&&pco2<15){unit="kPa";notes.push("pCO2 below 15 read as kPa.");}
  const k=unit==="mmHg"?1/7.50062:1;const pc=pco2*k;let po=po2!=null?po2*(unit==="mmHg"&&po2>15?1/7.50062:1):null;
  if(hco3<2||hco3>70)return {bad:"A bicarbonate of "+lf(hco3)+" mmol/L is implausible. Check the value."};
  const H=Math.pow(10,9-ph);
  /* 1 pH */
  const acid=ph<7.35,alk=ph>7.45;
  add("pH",`${lf(ph,2)} (H⁺ ${lf(H,0)} nmol/L): ${acid?"acidaemia":alk?"alkalaemia":"within 7.35–7.45"}.`,acid||alk?"warn":"");
  /* 2 primary */
  const hiC=venous?pc>6.0:pc>6.0,loC=pc<4.7,loB=hco3<22,hiB=hco3>(venous?29:26);
  let prim="";
  if(acid){prim=hiC&&loB?"mixed respiratory and metabolic acidosis":hiC?"respiratory acidosis":loB?"metabolic acidosis":"acidaemia with pCO2 and HCO3 that do not explain it (recheck the values)";}
  else if(alk){prim=loC&&hiB?"mixed respiratory and metabolic alkalosis":loC?"respiratory alkalosis":hiB?"metabolic alkalosis":"alkalaemia with pCO2 and HCO3 that do not explain it (recheck the values)";}
  else{prim=hiC&&hiB?"normal pH with high pCO2 and high HCO3: compensated chronic respiratory acidosis, or a respiratory acidosis with a metabolic alkalosis":loC&&loB?"normal pH with low pCO2 and low HCO3: a mixed metabolic acidosis and respiratory alkalosis (or a fully compensated one, which is rare)":(hiC||loC||hiB||loB)?"normal pH with an abnormal pCO2 or HCO3: look for a mixed disorder":"no acid–base disturbance on these values";}
  add("Primary process",prim[0].toUpperCase()+prim.slice(1)+".");sum.push(prim);
  /* venous pCO2 screen */
  if(venous)add("pCO2 screen",pc<=6.0?`Venous pCO2 ${lf(pc)} kPa (${lf(pc*7.50062,0)} mmHg) is 6.0 kPa or less: arterial hypercapnia is ruled out.`:`Venous pCO2 ${lf(pc)} kPa (${lf(pc*7.50062,0)} mmHg) is above 6.0 kPa: arterial hypercapnia is possible but not proven. Take an arterial or earlobe gas if it changes oxygen or ventilation decisions.`,pc<=6.0?"good":"warn");
  /* 3 compensation */
  const pmm=pc*7.50062;
  if(loB&&(acid||!alk)){const exp=0.2*hco3+1.1;const lo=exp-0.3,hi=exp+0.3;
    let v=pc>hi+(venous?0.8:0)?"higher than expected: an added respiratory acidosis (tiring, sedated or hypoventilating)":pc<lo?"lower than expected: an added respiratory alkalosis (sepsis, salicylate, liver failure, pain)":"within the expected range: appropriate respiratory compensation";
    add("Compensation",`For HCO3 ${lf(hco3)}, Winter's formula expects pCO2 ${lf(lo)}–${lf(hi)} kPa (${lf(lo*7.50062,0)}–${lf(hi*7.50062,0)} mmHg). Measured ${lf(pc)} kPa is ${v}.${venous?" Venous pCO2 runs about 0.8 kPa above arterial, so treat a borderline result with caution.":""}`,/appropriate/.test(v)?"":"warn");if(!/appropriate/.test(v))sum.push(v.split(": ")[1]);}
  else if(hiB&&(alk||(!acid&&!hiC))){const exp=(0.7*hco3+21)/7.50062,lo=exp-0.27,hi=exp+0.27;
    const v=pc>hi+0.4?"higher than expected: an added respiratory acidosis":pc<lo?"lower than expected: an added respiratory alkalosis":"within the expected range";
    add("Compensation",`For HCO3 ${lf(hco3)}, expected pCO2 is about ${lf(lo)}–${lf(hi)} kPa (0.7 × HCO3 + 21 ± 2 mmHg); compensation rarely exceeds about 7.3 kPa. Measured ${lf(pc)} kPa is ${v}.`,/within/.test(v)?"":"warn");if(!/within/.test(v))sum.push(v.split(": ")[1]);}
  else if(hiC&&!venous){const d=(pmm-40)/10,ac=24+d,ch=24+3.5*d;
    const v=hco3<ac-2?"lower than even acute compensation: an added metabolic acidosis":hco3<=ac+2?"fits an acute respiratory acidosis":hco3<ch-2?"between acute and chronic: acute-on-chronic, or a chronic disorder still compensating":hco3<=ch+2?"fits a chronic (compensated) respiratory acidosis":"higher than chronic compensation predicts: an added metabolic alkalosis";
    add("Compensation",`For pCO2 ${lf(pc)} kPa, HCO3 should be about ${lf(ac,0)} if acute and ${lf(ch,0)} if chronic. Measured ${lf(hco3)} ${v}.`);sum.push(v);}
  else if(loC&&!loB&&!venous||loC&&loB&&alk){const d=(40-pmm)/10,ac=24-2*d,ch=24-5*d;
    const v=hco3>ac+2?"higher than acute compensation predicts: an added metabolic alkalosis":hco3>=ac-2?"fits an acute respiratory alkalosis":hco3>=ch-2?"fits a chronic respiratory alkalosis (pregnancy, altitude, liver disease)":"lower than compensation predicts: an added metabolic acidosis";
    add("Compensation",`For pCO2 ${lf(pc)} kPa, HCO3 should be about ${lf(ac,0)} if acute and ${lf(ch,0)} if chronic. Measured ${lf(hco3)} ${v}.`);sum.push(v);}
  /* 4 anion gap */
  if(s.na!=null&&s.cl!=null){let alb=s.alb;if(alb!=null&&alb<10)alb=alb*10;
    const ag=s.na-s.cl-hco3,cag=alb!=null?ag+0.25*(40-alb):ag,mod=(s.agr||"modern")==="modern",up=mod?11:16,mean=mod?7:12;
    const raised=cag>up;
    add("Anion gap",`Na − (Cl + HCO3) = ${lf(ag)} mmol/L${alb!=null?`; corrected for albumin ${lf(alb,0)} g/L: ${lf(cag)}`:" (add the albumin to correct it)"}. ${raised?"Raised":"Not raised"} against ${mod?"a modern range of about 3–11":"an older range of 8–16"} mmol/L.${raised?" Lactate, ketones, renal failure or a toxin (GOLDMARK).":loB?" A normal-gap acidosis: bicarbonate lost from gut or kidney, or chloride gained (saline).":""}`,raised?"warn":"");
    if(raised&&!/metabolic acidosis/.test(prim)){add("Hidden acidosis",`A raised anion gap means an acid has been added whatever the pH: there is a raised-gap metabolic acidosis alongside the ${prim.replace(/^normal pH with.*/,"near-normal pH")}. With a respiratory alkalosis this is the classic salicylate picture.`,"warn");sum.push("plus a raised anion gap metabolic acidosis ("+lf(cag)+")");for(let i=sum.length-1;i>=0;i--)if(/^fits a chronic respiratory alkalosis/.test(sum[i]))sum.splice(i,1);const cx=out.find(x=>x[0]==="Compensation");if(cx&&/respiratory alkalosis/.test(prim))cx[1]+=" Here the low HCO3 is at least partly the added acidosis, not compensation.";}
    else if(raised)sum.push("raised anion gap ("+lf(cag)+")");else if(loB&&acid)sum.push("normal anion gap");
    if(raised&&hco3<24){const dr=(cag-mean)/(24-hco3);
      const v=dr<0.4?"a normal-gap acidosis dominates":dr<0.8?"a mixed raised-gap and normal-gap acidosis":dr<=2?"a pure raised-gap acidosis":"an added metabolic alkalosis (vomiting, diuretics) or a pre-existing chronic respiratory acidosis";
      add("Delta ratio",`(${lf(cag)} − ${mean}) ÷ (24 − ${lf(hco3)}) = ${lf(dr,2)}: ${v}.`);if(dr<0.8||dr>2)sum.push(v);}
    if(s.na<100||s.na>200||s.cl<60||s.cl>150)notes.push("Check the sodium and chloride: they look implausible.");}
  else if(loB)add("Anion gap","Add sodium and chloride (and albumin) to work out the anion gap: it decides between an acid gained and bicarbonate lost.");
  /* lactate */
  if(s.lac!=null){const v=s.lac;add("Lactate",`${lf(v)} mmol/L: ${v<=2?"normal":v<=4?"raised (above 2): hypoperfusion or a type B cause":"above 4: severe, associated with high mortality in sepsis; resuscitate and repeat at 2 h"}.`,v>2?"warn":"");if(v>2)sum.push("lactate "+lf(v));}
  /* oxygenation */
  if(!venous&&po!=null){let fi=s.fio2;const fiAss=fi==null;if(fi==null)fi=21;const F=fi>1?fi/100:fi;
    if(F<0.21||F>1){add("Oxygenation","FiO2 must be between 21% and 100%.","warn");}
    else{const pf=po/F,PA=F*(101.3-6.3)-pc/0.8,aa=PA-po;const age=s.age;const nAA=age!=null?(age/4+4)/7.50062:null;
      const t1=po<8;const type=t1?(pc>6.0?"type 2 respiratory failure":"type 1 respiratory failure"):"";
      add("Oxygenation",`pO2 ${lf(po)} kPa (${lf(po*7.50062,0)} mmHg) on ${fiAss?"air (FiO2 not entered, so assumed 21%)":lf(F*100,0)+"% oxygen"}. P/F ratio ${lf(pf)} kPa (${lf(pf*7.50062,0)} mmHg): ${pf>40?"normal":pf>26.7?"mildly impaired (ARDS mild band if bilateral infiltrates)":pf>13.3?"moderately impaired":"severely impaired"}. A–a gradient about ${lf(aa)} kPa at sea level${nAA!=null?`, upper normal for age about ${lf(nAA)} kPa`:""}${F>0.21?" (less reliable on supplemental oxygen)":""}.${type?" "+type[0].toUpperCase()+type.slice(1)+".":""}`,t1||pf<=40?"warn":"");
      if(type)sum.push(type);}}
  if(venous)add("Oxygenation","A venous pO2 says nothing about oxygenation: judge it from the patient and a reliable SpO2, or an arterial gas.");
  const summary=(sum.length?sum.join("; "):"no disturbance on the values given");
  return {lines:out,summary:summary[0].toUpperCase()+summary.slice(1)+".",notes};
}
/* ---------- CSF reader ---------- */
function csfRead(s){
  const out=[],add=(t,x,tone)=>out.push([t,x,tone||""]),notes=[];
  if(s.wcc==null&&s.prot==null&&s.glu==null&&s.op==null)return {need:true};
  let wcc=s.wcc,prot=s.prot,glu=s.glu,pg=s.pglu;
  if(prot!=null&&prot>20){prot=prot/100;notes.push("Protein above 20 read as mg/dL and converted to g/L.");}
  if(glu!=null&&glu>30){glu=glu/18;notes.push("CSF glucose above 30 read as mg/dL and converted.");}
  if(pg!=null&&pg>60){pg=pg/18;notes.push("Plasma glucose above 60 read as mg/dL and converted.");}
  if(s.op!=null){const o=s.op;add("Opening pressure",`${lf(o,0)} cmH2O: ${o<10?"low (leak, recent LP) or a needle not fully in the space":o<25?"normal (about 10–20; up to 25 in some adults)":"raised (25 or more)"}.`,o>=25?"warn":"");}
  let cw=wcc;if(wcc!=null){if(s.rbc!=null&&s.rbc>0){cw=Math.max(0,wcc-s.rbc/1000);add("Red cells",`${lf(s.rbc,0)} ×10⁶/L. After a traumatic tap, subtract about 1 white cell per 1000 red cells: corrected WCC about ${lf(cw,0)}. A falling count across tubes suggests a traumatic tap but does not exclude SAH.`);}
    add("White cells",`${lf(cw,0)} ×10⁶/L${s.cell?`, mostly ${s.cell==="n"?"neutrophils":s.cell==="l"?"lymphocytes":"mixed"}`:""}: ${cw<=5?"normal":cw<=100?"mildly raised":cw<=1000?"moderately raised":"markedly raised"}.`,cw>5?"warn":"");}
  if(prot!=null)add("Protein",`${lf(prot,2)} g/L: ${prot<=0.45?"normal":prot<1?"raised":"markedly raised (above 1 g/L)"}.`,prot>0.45?"warn":"");
  let ratio=null;if(glu!=null){if(pg!=null&&pg>0){ratio=glu/pg;add("Glucose ratio",`CSF ${lf(glu)} ÷ plasma ${lf(pg)} mmol/L = ${lf(ratio,2)}: ${ratio>=0.6?"normal":ratio>0.36?"low":"very low (0.36 or less: strongly suggests bacterial meningitis)"}.`,ratio<0.6?"warn":"");}
    else add("Glucose",`CSF glucose ${lf(glu)} mmol/L. Add the plasma glucose taken at the same time: the ratio is what counts.`,glu<2.6?"warn":"");}
  const abx=s.abx==="y";
  if(s.lac!=null)add("Lactate",`${lf(s.lac)} mmol/L: ${s.lac<3.5?"below the bacterial range":"above about 3.5: favours bacterial meningitis"}${abx?". Antibiotics were given before the LP, so a normal lactate does not reassure":""}.`,s.lac>=3.5?"warn":"");
  /* pattern */
  const bact=[],vir=[],tb=[];
  if(cw!=null){if(cw>1000)bact.push("WCC above 1000");else if(cw>100)bact.push("WCC above 100");if(cw>5&&cw<=1000)vir.push("WCC 5–1000");if(cw>5&&cw<=500)tb.push("WCC 5–500");}
  if(s.cell==="n")bact.push("neutrophils");if(s.cell==="l"){vir.push("lymphocytes");tb.push("lymphocytes");}
  if(prot!=null){if(prot>1){bact.push("protein above 1 g/L");tb.push("protein above 1 g/L");}else if(prot<0.6)vir.push("protein under 0.6 g/L");}
  if(ratio!=null){if(ratio<=0.36){bact.push("glucose ratio 0.36 or less");tb.push("low glucose ratio");}else if(ratio<0.5)tb.push("low glucose ratio");else vir.push("normal glucose ratio");}
  if(s.lac!=null){if(s.lac>=3.5)bact.push("lactate 3.5 or more");else if(!abx)vir.push("normal lactate");}
  let pat="",tone="";
  const allNormal=(cw==null||cw<=5)&&(prot==null||prot<=0.45)&&(ratio==null||ratio>=0.6);
  if(allNormal&&s.op!=null&&s.op>=25){pat="Raised pressure with normal fluid: idiopathic intracranial hypertension once venous sinus thrombosis and a mass are excluded.";tone="warn";}
  else if(allNormal){pat="Normal CSF on these values. A very early or immunosuppressed meningitis, SAH before 12 h, and early GBS can still have normal fluid.";}
  else if(cw!=null&&cw<50&&prot!=null&&prot>0.45&&(ratio==null||ratio>=0.5)&&bact.length<2){pat="Albuminocytological dissociation (raised protein, WCC under 50): Guillain–Barré syndrome or CIDP if the clinical picture fits; also spinal block or diabetes.";tone="warn";}
  else if(s.cell==="l"&&((prot!=null&&prot>1)||(ratio!=null&&ratio<0.5))){pat=`Lymphocytic with ${tb.filter(x=>x!=="lymphocytes").join(", ")||"abnormal chemistry"}: tuberculous or fungal meningitis, Listeria or partially treated bacterial meningitis. Send TB tests and cryptococcal antigen, and treat for bacterial meningitis (with amoxicillin for Listeria) until it is excluded.`;tone="bad";}
  else if(s.cell!=="l"&&bact.length>=2){pat=`Pattern favours bacterial meningitis (${bact.join(", ")}). Treat now if not already: no CSF pattern should delay antibiotics.`;tone="bad";}
  else if(vir.length>=2){pat=`Pattern favours viral (aseptic) meningitis (${vir.join(", ")}). Confusion, seizures or focal signs mean encephalitis: aciclovir now.${bact.length?" Some features ("+bact.join(", ")+") overlap with bacterial meningitis, so do not stop antibiotics on this alone.":""}`;tone="warn";}
  else{pat="Mixed or incomplete picture. Add the missing values, and treat as bacterial if the story fits.";tone="warn";}
  return {lines:out,summary:pat,tone,notes};
}
const LAB_EX={abg:[["DKA",{ph:"7.12",pco2:"2.4",hco3:"6",na:"134",cl:"98",alb:"40",lac:"1.8",po2:"15.6",fio2:"21",age:"24"}],["COPD, acute-on-chronic",{ph:"7.28",pco2:"9.1",hco3:"31",na:"138",cl:"98",alb:"38",po2:"7.2",fio2:"28",age:"71"}],["Salicylate",{ph:"7.47",pco2:"2.9",hco3:"15",na:"140",cl:"102",alb:"42",lac:"2.4",po2:"13.8",fio2:"21",age:"35"}],["Vomiting",{ph:"7.52",pco2:"6.3",hco3:"38",na:"133",cl:"84",alb:"40",po2:"11.5",fio2:"21",age:"45"}]],
 vbg:[["DKA",{ph:"7.08",pco2:"3.1",hco3:"7",na:"133",cl:"97",alb:"40",lac:"2.1"}],["Sepsis",{ph:"7.29",pco2:"4.1",hco3:"15",na:"137",cl:"104",alb:"28",lac:"5.2"}],["Drowsy COPD",{ph:"7.31",pco2:"8.4",hco3:"32",na:"139",cl:"97",alb:"36"}]],
 csf:[["Bacterial",{op:"34",wcc:"2400",cell:"n",rbc:"",prot:"2.1",glu:"1.1",pglu:"7.0",lac:"8.2",abx:"n"}],["Viral",{op:"18",wcc:"180",cell:"l",prot:"0.6",glu:"3.4",pglu:"5.6",lac:"2.2",abx:"n"}],["TB",{op:"30",wcc:"220",cell:"l",prot:"2.8",glu:"1.4",pglu:"6.2",abx:"n"}],["GBS",{op:"16",wcc:"3",cell:"l",prot:"1.4",glu:"3.6",pglu:"5.8"}]]};
function labReaderHTML(kind){
  const F=(k,l,u,ph)=>`<label class="fld"><span>${l}${u?` <span class="muted">(${u})</span>`:""}</span><input class="inp" type="text" inputmode="decimal" autocomplete="off" data-r="${k}" placeholder="${ph||""}"></label>`;
  const C=(k,l,opts)=>`<div class="dcat lr-ch" role="group" aria-label="${l}"><span class="lr-k">${l}</span><div class="chips">${opts.map(([v,t])=>`<button class="chip" data-r="${k}" data-v="${v}" aria-pressed="false">${t}</button>`).join("")}</div></div>`;
  let f="";
  if(kind==="csf")f=`<div class="lr-grid">${F("op","Opening pressure","cmH2O","10–20")}${F("wcc","White cells","×10⁶/L","≤5")}${F("rbc","Red cells","×10⁶/L","0")}${F("prot","Protein","g/L","0.15–0.45")}${F("glu","CSF glucose","mmol/L","2.6–4.5")}${F("pglu","Plasma glucose","mmol/L","same time")}${F("lac","CSF lactate","mmol/L","<3.5")}</div>${C("cell","Main cell type",[["n","Neutrophils"],["l","Lymphocytes"],["m","Mixed"]])}${C("abx","Antibiotics before the LP?",[["n","No"],["y","Yes"]])}`;
  else f=`${C("unit","Gas units",[["kPa","kPa"],["mmHg","mmHg"]])}<div class="lr-grid">${F("ph","pH","","7.35–7.45")}${F("pco2","pCO2","","")}${F("hco3","HCO3","mmol/L",kind==="vbg"?"22–29":"22–26")}${F("na","Sodium","mmol/L","")}${F("cl","Chloride","mmol/L","")}${F("alb","Albumin","g/L","35–50")}${F("lac","Lactate","mmol/L","")}${kind==="abg"?F("po2","pO2","","")+F("fio2","FiO2","%","21")+F("age","Age","years",""):""}</div>${C("agr","Your lab's anion gap range",[["modern","Modern, about 3–11"],["old","Older, 8–16"]])}`;
  return `<section class="card stack lab-reader" id="lr" style="gap:12px"><div><span class="eyebrow">Reader</span><h2 style="margin:.2em 0 .1em">Read a ${kind==="csf"?"CSF result":kind==="vbg"?"venous gas":"gas"} step by step</h2><p class="small muted" style="margin:0">Type what you have; the reader works with partial results and accepts Arabic digits and a decimal comma. It teaches the reasoning and does not replace judgement.</p></div>
   <div class="row-x lr-ex"><span class="small muted">Try:</span>${LAB_EX[kind].map(([n],i)=>`<button class="chip" data-ex="${i}">${n}</button>`).join("")}<button class="chip" data-ex="clear">Clear</button></div>
   ${f}<div id="lr-out" aria-live="polite"></div></section>`;
}
function bindLabReader(root,kind){
  const st=LABRD[kind];const box=$("#lr",root);if(!box)return;
  const sync=()=>{$$("input[data-r]",box).forEach(el=>{el.value=st[el.dataset.r]!=null?st[el.dataset.r]:"";});$$("[data-r][data-v]",box).forEach(b=>{const on=(st[b.dataset.r]||(b.dataset.r==="unit"?"kPa":b.dataset.r==="agr"?"modern":""))===b.dataset.v;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);});};
  const draw=()=>{const o=$("#lr-out",box);const v={};for(const k in st){v[k]=(k==="unit"||k==="agr"||k==="cell"||k==="abx")?st[k]:labNum(st[k]);}
    const r=kind==="csf"?csfRead(v):gasRead(v,kind==="vbg");
    if(r.need){o.innerHTML=`<p class="muted small" style="margin:0">${kind==="csf"?"Enter at least the white cells, protein or glucose.":"Enter at least the pH, pCO2 and bicarbonate."}</p>`;return;}
    if(r.bad){o.innerHTML=`<div class="note">${esc(r.bad)}</div>`;return;}
    const sent=r.summary;
    o.innerHTML=`<ol class="lr-steps">${r.lines.map(([t,x,tone])=>`<li class="${tone?"t-"+tone:""}"><b>${esc(t)}</b><span>${esc(x)}</span></li>`).join("")}</ol>${(r.notes||[]).length?`<p class="small muted">${r.notes.map(esc).join(" ")}</p>`:""}
     <div class="lr-sum ${r.tone?"t-"+r.tone:""}"><span class="eyebrow">In one sentence</span><p>${esc(sent)}</p><button class="btn sm ghost" id="lr-copy">Copy for the notes</button></div>`;
    $("#lr-copy",o).addEventListener("click",()=>{const d=typeof fmtDate==="function"?fmtDate(Date.now()):new Date().toLocaleDateString("en-GB");const s=`${kind==="csf"?"CSF":kind==="vbg"?"VBG":"ABG"} ${d}: ${sent}`;(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>toast("Copied"),()=>toast(s));});};
  $$("input[data-r]",box).forEach(el=>el.addEventListener("input",()=>{st[el.dataset.r]=el.value;draw();}));
  $$("[data-r][data-v]",box).forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.r;st[k]=st[k]===b.dataset.v&&k!=="unit"&&k!=="agr"?null:b.dataset.v;sync();draw();}));
  $$("[data-ex]",box).forEach(b=>b.addEventListener("click",()=>{for(const k in st)delete st[k];if(b.dataset.ex!=="clear")Object.assign(st,LAB_EX[kind][+b.dataset.ex][1]);sync();draw();}));
  sync();draw();
}
route("tools:labs","Labs",(root)=>{
  const L=typeof LABS!=="undefined"?LABS:[];const used=new Set();
  const row=p=>`<button class="lrow" data-go="tools/lab/${p.id}"><span class="icwrap">${ic("log")}</span><span class="txt"><b>${esc(p.name)}</b><span>${esc((p.intro||"").split(/(?<=\.)\s/)[0])}</span></span>${p.interp?`<span class="tag">Reader</span>`:""}${ic("chev","chev")}</button>`;
  const groups=LAB_GROUPS.map(([g,ids])=>{const ps=ids.map(id=>L.find(p=>p.id===id)).filter(Boolean);ps.forEach(p=>used.add(p.id));return [g,ps];}).filter(x=>x[1].length);
  const rest=L.filter(p=>!used.has(p.id));if(rest.length)groups.push(["More panels",rest]);
  root.innerHTML=`<section class="ph"><span class="eyebrow">Labs at the bedside</span><h1>What the numbers add</h1><p class="lede">${L.length} panels. Each says what it answers, how to read it, the patterns that matter, how it ties to the examination and where it misleads. SI units first. The gas and CSF panels have a step-by-step reader.</p></section>
   ${groups.map(([g,ps])=>`<section class="section"><span class="label">${esc(g)}</span><div class="list">${ps.map(row).join("")}</div></section>`).join("")}${L.length?"":`<div class="empty">Lab panels are being written.</div>`}`;
});
route("tools:lab",(id)=>((typeof LABS!=="undefined"&&LABS.find(p=>p.id===id))||{}).name||"Lab",(root,id)=>{
  const p=(typeof LABS!=="undefined"?LABS:[]).find(x=>x.id===id);if(!p)throw new Error("Panel not found");
  const rel=LAB_REL[id]||{};const chips=[];
  (rel.maps||[]).forEach(x=>{const m=CMAPS.find(y=>y.id===x);if(m)chips.push(`<button class="chip" data-go="learn/map/${x}">${ic("map")}${esc(m.title.split(":")[0])}</button>`);});
  (rel.tools||[]).forEach(x=>{const t=typeof TOOLS!=="undefined"&&TOOLS.find(y=>y.id===x);if(t)chips.push(`<button class="chip" data-go="tools/calc/${x}">${ic("bolt")}${esc(t.name)}</button>`);});
  (rel.labs||[]).forEach(x=>{const l=LABS.find(y=>y.id===x);if(l)chips.push(`<button class="chip" data-go="tools/lab/${x}">${ic("log")}${esc(l.name)}</button>`);});
  const grp=(LAB_GROUPS.find(([g,ids])=>ids.includes(id))||["Labs"])[0];
  root.innerHTML=`<section class="ph"><span class="eyebrow">Labs · ${esc(grp)}</span><h1>${esc(p.name)}</h1><p class="lede">${esc(p.intro)}</p>${p.interp?`<div class="row-x"><a class="btn sm" href="#lr" id="lr-jump">Go to the reader</a></div>`:""}</section>
   ${p.steps&&p.steps.length?`<section class="card stack" style="gap:10px"><span class="eyebrow">How to read it</span><ol class="lab-steps">${p.steps.map(s=>`<li><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join("")}</ol></section>`:""}
   <section class="card stack" style="gap:12px"><span class="eyebrow">Values</span>${(p.items||[]).map(it=>`<div class="lm lab-v"><b>${esc(it.n)}</b>${it.ref?`<span class="lab-ref">${esc(it.ref)}</span>`:""}${it.meaning?`<span>${esc(it.meaning)}</span>`:""}${it.high?`<span><i>High.</i> ${esc(it.high)}</span>`:""}${it.low?`<span><i>Low.</i> ${esc(it.low)}</span>`:""}</div>`).join("")}</section>
   <section class="card stack" style="gap:12px"><span class="eyebrow">Patterns</span>${(p.patterns||[]).map(x=>`<details class="acc lab-pat"><summary><span class="st"><b>${esc(x.name)}</b><span class="small muted">${esc(x.see.length>140?x.see.slice(0,137).replace(/\s\S*$/,"")+"…":x.see)}</span></span></summary><div class="acc-body stack" style="gap:6px"><span><i>See.</i> ${esc(x.see)}</span><span><i>Think.</i> ${esc(x.think)}</span>${x.do?`<span><i>Do.</i> ${esc(x.do)}</span>`:""}</div></details>`).join("")}</section>
   ${p.interp?labReaderHTML(p.interp):""}
   ${p.bedside&&p.bedside.length?`<section class="card stack" style="gap:8px"><span class="eyebrow">Ties to the examination</span><ul class="prose" style="padding-left:1.1em;margin:0">${p.bedside.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>`:""}
   ${p.pitfalls&&p.pitfalls.length?`<section class="card stack" style="gap:8px"><span class="eyebrow">Traps</span><ul class="prose" style="padding-left:1.1em;margin:0">${p.pitfalls.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>`:""}
   ${chips.length?`<section class="card stack" style="gap:8px"><span class="eyebrow">Goes with</span><div class="chips">${chips.join("")}</div></section>`:""}
   <details class="acc"><summary><span class="st"><b>Sources</b><span class="small muted">${(p.src||[]).length} references</span></span></summary><div class="acc-body"><ul class="small" style="padding-left:1.1em;margin:0">${(p.src||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></details>`;
  if(p.interp){bindLabReader(root,p.interp);const j=$("#lr-jump",root);if(j)j.addEventListener("click",e=>{e.preventDefault();const t=$("#lr",root);if(t)t.scrollIntoView({behavior:"smooth",block:"start"});});}
});
