"use strict";
/* ================= EVIDENCE DISPLAY, SEARCH AND BAYES HELPERS (D05) =================
   Used by the Signs tab (82-ref.js) and safe to call from anywhere:
   evChips(s,id)      tappable LR / Sn / Sp / caveat chips (explanations open in place on tap, not hover-only)
   decisiveLR(s)      the stronger of LR+ and LR- by distance from 1
   faganSVG(pre,lrs)  a Fagan nomogram (pre-test, LR, post-test)
   probShift(s,pre)   compact pre- to post-test strip
   signSearch(q)      word-start search with synonyms and ranking
   dxKey(s,id)        diagnosis key (s.dx if present, else derived from the target)
   overlapOf(id)      mechanism group for "not independent" warnings
   No numbers live here: every LR, Sn and Sp is read from SIGNS (D04's single source of truth). */

/* ---------- probability arithmetic ---------- */
const oddsOf=p=>p/(1-p),probOf=o=>o/(1+o);
function postProb(prePct,lr){const pre=Math.min(99.9,Math.max(0.1,prePct))/100;return probOf(oddsOf(pre)*lr)*100;}
function fmtPct(v){if(v==null||!isFinite(v))return "–";if(v>99.5)return ">99%";if(v<0.1)return "<0.1%";if(v<10){const t=v.toFixed(1).replace(/\.0$/,"");return t+"%";}return Math.round(v)+"%";}
function fmtLR(v){return v==null?"not reported":String(v);}
const lrStrength=v=>{if(v==null)return 0;const x=Math.abs(Math.log(v));return x;};
function lrWord(v){if(v==null)return "";const big=v>=1?v:1/v;return big>=10?"decisive":big>=5?"moderate":big>=2?"small":"negligible";}
function decisiveLR(s){
  const P=s.p!=null&&s.p>1?s.p:null,N=s.n!=null&&s.n<1?s.n:null;
  if(P==null&&N==null)return null;
  if(N==null||(P!=null&&lrStrength(P)>=lrStrength(N)))return {k:"p",v:P};
  return {k:"n",v:N};
}
/* one plain sentence about what the decisive result does */
function decisiveLine(s){
  const d=decisiveLR(s);if(!d)return "";
  const w=lrWord(d.v);
  if(w==="negligible")return "Neither a positive nor a negative result moves probability much.";
  if(d.k==="p")return {decisive:"A positive result rules it in.",moderate:"A positive result makes it clearly more likely.",small:"A positive result nudges probability up a little."}[w];
  return {decisive:"A negative result rules it out.",moderate:"A negative result makes it clearly less likely.",small:"A negative result nudges probability down a little."}[w];
}

/* ---------- caveats ---------- */
const SINGLE_RE=/\b(one|single|a small|one small|only one)\s+(small\s+)?(study|series|derivation|cohort|trial)\b|\bderivation (study|cohort)( only)?\b|\b(never|not yet|not)( been)? (externally )?validated\b|\bsingle[- ]study\b/i;
let HAS_SINGLE=null;
/* explicit s.single wins; the wording fallback only applies while the data has no single flags at all */
function isSingleStudy(s){if(!s)return false;if(s.single)return true;if(HAS_SINGLE===null)HAS_SINGLE=Object.values(SIGNS).some(x=>"single" in x);return !HAS_SINGLE&&!!(s.note&&SINGLE_RE.test(s.note));}
/* only an explicit s.src is shown as the source: notes often cite a second study, so guessing from them would misattribute */
function srcOf(s){return s&&s.src?String(s.src):"";}
const TYPE_LABEL={sign:"Sign",test:"Test",rule:"Clinical rule",vital:"Vital sign",treatment:"Treatment"};

/* ---------- tappable evidence chips ---------- */
function evChips(s,id,opt={}){
  if(!s)return "";const o=[];const sid=esc(id||"");
  const chip=(k,cls,label,title)=>`<button type="button" class="lr ev ${cls}" data-ev="${k}" data-sid="${sid}" aria-expanded="false" title="${esc(title)}">${label}</button>`;
  if(s.p!=null)o.push(chip("p",lrClass(s.p),`LR+ ${esc(s.p)}`,"Positive likelihood ratio: tap for what it means"));
  if(s.n!=null)o.push(chip("n",lrClass(s.n),`LR− ${esc(s.n)}`,"Negative likelihood ratio: tap for what it means"));
  if(!opt.noSnSp){if(s.sens!=null)o.push(chip("sens","weak",`Sn ${esc(s.sens)}%`,"Sensitivity"));if(s.spec!=null)o.push(chip("spec","weak",`Sp ${esc(s.spec)}%`,"Specificity"));}
  const same=(a)=>a&&a.p===s.p&&a.n===s.n;
  if(s.ed&&(s.ed.sens!=null||s.ed.p!=null)&&!same(s.ed))o.push(chip("ed","cav",`<span class="cav-i" aria-hidden="true">!</span>In ED hands`,"Accuracy in ordinary emergency-department hands"));
  if(s.trained&&(s.trained.sens!=null||s.trained.p!=null)&&!same(s.trained))o.push(chip("trained","weak","Trained examiners","Accuracy when done by examiners trained in the test"));
  if(isSingleStudy(s))o.push(chip("single","cav",`<span class="cav-i" aria-hidden="true">!</span>Single study`,"The headline figure rests on one study: tap for the caveat"));
  else if(s.note&&!opt.noNote)o.push(chip("note","cav",`<span class="cav-i" aria-hidden="true">!</span>Evidence note`,"Tap for the evidence caveat"));
  if(!o.length){
    const t=s.type==="rule"?"Clinical rule: apply it in full":s.type==="vital"?"Vital sign: trend it, no single LR":s.type==="treatment"?"Treatment, not a test":"No pooled LR";
    o.push(chip("none","norule",esc(t),"Why there is no likelihood ratio"));}
  return `<div class="evwrap"><div class="lrrow evchips">${o.join("")}</div><div class="evpop" hidden></div></div>`;
}
/* the shared pre-test used for "from X% pretest" examples; the calculator shares it */
const EV={pre:30};
function evExplain(s,k){
  const pre=EV.pre,src=srcOf(s),tgt=esc(s.target||"the target condition");
  const ci=(a)=>Array.isArray(a)&&a.length===2?` 95% CI ${esc(a[0])} to ${esc(a[1])}.`:"";
  const tail=`${src?`<span class="evsrc">Source: ${esc(src)}.</span>`:""}${isSingleStudy(s)&&k!=="single"?`<span class="evsrc"><span class="cav-i" aria-hidden="true">!</span>Rests on a single study: treat the number as provisional.</span>`:""}`;
  if(k==="p")return `<b>LR+ ${esc(s.p)}</b>: a positive result multiplies the odds of ${tgt} by ${esc(s.p)}, a ${lrWord(s.p)} shift.${ci(s.pci)} From a ${pre}% pre-test probability a positive result gives about <b>${fmtPct(postProb(pre,s.p))}</b>.${tail}`;
  if(k==="n")return `<b>LR− ${esc(s.n)}</b>: a negative result multiplies the odds by ${esc(s.n)}, a ${lrWord(s.n)} shift.${ci(s.nci)} From a ${pre}% pre-test probability a negative result gives about <b>${fmtPct(postProb(pre,s.n))}</b>.${tail}`;
  if(k==="sens")return `<b>Sensitivity ${esc(s.sens)}%</b>: of 100 patients who have the target condition, about ${Math.round(s.sens)} test positive and ${100-Math.round(s.sens)} are missed. ${s.sens>=90?"High: a negative result helps rule out (SnNout).":"Not high enough for a negative result to rule out on its own."}${tail}`;
  if(k==="spec")return `<b>Specificity ${esc(s.spec)}%</b>: of 100 patients without it, about ${Math.round(s.spec)} test negative and ${100-Math.round(s.spec)} are false positives. ${s.spec>=90?"High: a positive result helps rule in (SpPin).":"Not high enough for a positive result to rule in on its own."}${tail}`;
  if(k==="ed"||k==="trained"){const e=s[k];const nums=[e.sens!=null?`sensitivity ${esc(e.sens)}%`:"",e.spec!=null?`specificity ${esc(e.spec)}%`:"",e.p!=null?`LR+ ${esc(e.p)}`:"",e.n!=null?`LR− ${esc(e.n)}`:""].filter(Boolean).join(", ");
    return `<b>${k==="ed"?"In ordinary emergency-department hands":"In trained hands"}</b>${e.who?` (${esc(e.who)})`:""}: ${nums}.${e.p!=null?` From a ${pre}% pre-test probability a positive result gives about <b>${fmtPct(postProb(pre,e.p))}</b>`:""}${e.n!=null?`${e.p!=null?" and":" From a "+pre+"% pre-test probability"} a negative result about <b>${fmtPct(postProb(pre,e.n))}</b>.`:"."} The headline chips show LR+ ${fmtLR(s.p)} and LR− ${fmtLR(s.n)}: use the figures that match who is examining.`;}
  if(k==="single"||k==="note")return `${k==="single"?"<b>Single-study evidence.</b> ":"<b>Evidence note.</b> "}${esc(s.note||"The headline figure comes from one study and has not been confirmed elsewhere.")}`;
  if(k==="none")return s.type==="rule"?"A clinical rule is used as a whole: apply every criterion, then act on the result (see How and What to think). Its accuracy is described in the rule's own validation rather than as one likelihood ratio.":s.type==="vital"?"A vital sign is a measurement, not a yes/no test. Its value lies in thresholds and trends (see What to think).":s.type==="treatment"?"This is a manoeuvre that treats, not a test that diagnoses.":"No reliable pooled likelihood ratio has been published for this finding. Use it as part of the overall picture.";
  return "";
}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button.ev[data-ev]");if(!b)return;
  e.preventDefault();e.stopPropagation();
  const w=b.closest(".evwrap"),pop=w&&w.querySelector(".evpop");const s=SIGNS[b.dataset.sid];if(!pop||!s)return;
  const was=b.getAttribute("aria-expanded")==="true";
  w.querySelectorAll("button.ev").forEach(x=>x.setAttribute("aria-expanded","false"));
  if(was){pop.hidden=true;pop.innerHTML="";return;}
  b.setAttribute("aria-expanded","true");pop.innerHTML=evExplain(s,b.dataset.ev);pop.hidden=false;
},true);

/* ---------- compact pre- to post-test strip ---------- */
function probShift(s,pre){
  pre=pre??EV.pre;if(s.p==null&&s.n==null)return "";
  const pp=s.p!=null?postProb(pre,s.p):null,pn=s.n!=null?postProb(pre,s.n):null;
  const mk=(v,cls,lab)=>v==null?"":`<div class="ps-row ${cls}"><span class="ps-l">${lab}</span><span class="ps-tr"><i class="ps-pre" style="left:${pre}%"></i><i class="ps-arrow" style="left:${Math.min(pre,v)}%;width:${Math.abs(v-pre)}%"></i><i class="ps-dot" style="left:${v}%"></i></span><b class="num">${fmtPct(v)}</b></div>`;
  return `<div class="pshift" data-sid="">
   <div class="ps-head"><span class="small">From a pre-test probability of</span><span class="seg ps-pick" role="group" aria-label="Pre-test probability">${[5,15,30,50,70].map(v=>`<button type="button" data-pre="${v}" aria-pressed="${v===pre}">${v}%</button>`).join("")}</span></div>
   ${mk(pp,"pos","Positive")}${mk(pn,"neg","Negative")}</div>`;
}
function bindProbShift(root,s,onChange){
  root.querySelectorAll(".ps-pick").forEach(g=>g.addEventListener("click",e=>{const b=e.target.closest("[data-pre]");if(!b)return;EV.pre=+b.dataset.pre;if(typeof CALC!=="undefined")CALC.pre=EV.pre;const box=g.closest(".pshift");box.outerHTML=probShift(s,EV.pre);bindProbShift(root,s,onChange);if(onChange)onChange();}));
}

/* ---------- Fagan nomogram ---------- */
function faganSVG(pre,lines,opt={}){
  const W=320,H=opt.h||270,top=18,bot=H-20,mid=(top+bot)/2,c=(bot-top)/2/6.9;
  const xl=46,xm=160,xr=274;const L=p=>Math.log(p/(100-p));
  const yP=p=>mid+c*L(Math.min(99.9,Math.max(0.1,p)));            // left axis: 0.1 at top
  const yQ=p=>mid-c*L(Math.min(99.9,Math.max(0.1,p)));            // right axis: 99.9 at top
  const yLR=v=>mid-c*Math.log(v)/2;
  const P=[0.1,0.5,1,2,5,10,20,30,50,70,80,90,95,99],R=[0.001,0.01,0.05,0.1,0.2,0.5,1,2,5,10,20,50,100,1000];
  const tick=(x,y,t,side)=>`<line x1="${x-4}" x2="${x+4}" y1="${y}" y2="${y}"/><text x="${side<0?x-7:x+7}" y="${y+3}" text-anchor="${side<0?"end":"start"}">${t}</text>`;
  let g=`<g class="fg-ax"><line x1="${xl}" x2="${xl}" y1="${top}" y2="${bot}"/><line x1="${xm}" x2="${xm}" y1="${top}" y2="${bot}"/><line x1="${xr}" x2="${xr}" y1="${top}" y2="${bot}"/>`;
  const lay=(vals,yf,x,side)=>{let last=-99;vals.forEach(v=>{const y=yf(v);if(y<top-1||y>bot+1)return;const lab=Math.abs(y-last)>=10;if(lab)last=y;g+=tick(x,y,lab?v:"",side);});};
  lay(P,yP,xl,-1);lay([...P].reverse(),yQ,xr,1);lay([...R].reverse(),yLR,xm,1);g+="</g>";
  g+=`<g class="fg-t"><text x="${xl}" y="${top-6}" text-anchor="middle">Pre-test %</text><text x="${xm}" y="${top-6}" text-anchor="middle">LR</text><text x="${xr}" y="${top-6}" text-anchor="middle">Post-test %</text></g>`;
  const ln=(lines||[]).filter(l=>l&&l.lr!=null&&l.lr>0).map(l=>{const post=postProb(pre,l.lr),y1=yP(pre),y2=yQ(post);
    return `<g class="fg-l ${l.cls||""}"><line x1="${xl}" y1="${y1}" x2="${xr}" y2="${y2}"/><circle cx="${xl}" cy="${y1}" r="4"/><circle cx="${xm}" cy="${(y1+y2)/2}" r="3.5"/><circle cx="${xr}" cy="${y2}" r="4.5"/></g>`;}).join("");
  const lab=(lines||[]).filter(l=>l&&l.lr!=null).map(l=>`<span class="fg-k ${l.cls||""}"><i></i>${esc(l.label)}: LR ${esc(Math.round(l.lr*100)/100)} → ${fmtPct(postProb(pre,l.lr))}</span>`).join("");
  return `<figure class="fagan"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Fagan nomogram from ${pre}% pre-test probability">${g}${ln}</svg><figcaption class="fg-key">${lab}</figcaption></figure>`;
}

/* ---------- diagnosis keys and mechanism groups ---------- */
/* fallback until D04 adds s.dx; keys normalise targets that describe the same diagnosis */
const DX_FALL={fremitus:"pleural effusion","chest-expansion":"pleural effusion","percussion-dull":"pleural effusion",egophony:"consolidation","bronchial-breathing":"consolidation",whisper:"consolidation",
 "tamponade-signs":"cardiac tamponade","pulsus-paradoxus":"cardiac tamponade","carotid-upstroke":"aortic stenosis","a2-soft":"aortic stenosis",
 "wells-dvt":"deep vein thrombosis",homans:"deep vein thrombosis",kernig:"meningitis","neck-stiffness":"meningitis",
 babinski:"upper motor neuron lesion","pronator-drift":"upper motor neuron lesion",clonus:"upper motor neuron lesion",
 fet:"airflow obstruction (copd)",wheeze:"airflow obstruction (copd)",hoover:"airflow obstruction (copd)","laryngeal-height":"airflow obstruction (copd)",
 slr:"lumbar disc herniation","crossed-slr":"lumbar disc herniation",spurling:"cervical radiculopathy",ultt:"cervical radiculopathy",
 "cough-test":"peritonitis",rebound:"peritonitis","heel-drop":"appendicitis",psoas:"appendicitis",obturator:"appendicitis",
 hints:"central vertigo",befast:"stroke","dix-hallpike":"bppv",epley:"bppv","ottawa-ankle":"ankle or foot fracture","ottawa-knee":"knee fracture","elbow-ext":"elbow fracture",
 "log-roll":"hip fracture","patellar-pubic":"hip fracture",postural:"hypovolaemia","cap-refill":"hypovolaemia","dry-axilla":"hypovolaemia","skin-turgor":"hypovolaemia",
 "conj-pallor":"anaemia","c-spine-rule":"cervical spine injury","ct-head-rule":"intracranial injury",murphy:"cholecystitis",
 jvp:"heart failure",ajr:"heart failure",s3:"heart failure",oedema:"heart failure",crackles:"heart failure","apex-displaced":"low ejection fraction",
 "pedal-pulses":"peripheral arterial disease",abi:"peripheral arterial disease","radio-femoral":"coarctation",
 "irregular-pulse":"atrial fibrillation","bp-arms":"aortic dissection","ar-murmur":"aortic regurgitation","ar-eponyms":"aortic regurgitation",
 "mr-murmur":"mitral regurgitation",handgrip:"mitral regurgitation","valsalva-murmur":"hocm",
 "wells-pe":"pulmonary embolism",alvarado:"appendicitis","rlq-tender":"appendicitis",rovsing:"appendicitis",
 "fluid-wave":"ascites","shifting-dullness":"ascites",puddle:"ascites",
 lachman:"acl rupture","ant-drawer-knee":"acl rupture","pivot-shift":"acl rupture",mcmurray:"meniscal tear",thessaly:"meniscal tear","joint-line":"meniscal tear",
 phalen:"carpal tunnel syndrome","tinel-wrist":"carpal tunnel syndrome",flick:"carpal tunnel syndrome","cts-hypalgesia":"carpal tunnel syndrome",
 hawkins:"subacromial pain",neer:"subacromial pain","painful-arc":"subacromial pain","drop-arm":"rotator cuff tear","er-lag":"rotator cuff tear","empty-can":"rotator cuff tear","lift-off":"rotator cuff tear",
 chvostek:"hypocalcaemia",trousseau:"hypocalcaemia",cremasteric:"testicular torsion",qsofa:"sepsis",news2:"deterioration"};
function dxKey(s,id){
  if(!s)return "";if(s.dx)return String(s.dx).toLowerCase();if(id&&DX_FALL[id])return DX_FALL[id];
  let t=(s.target||"").toLowerCase().replace(/\(.*?\)/g," ");
  t=t.split(/;|,| \/ | in (?:a|the|known) | after | from | vs /)[0];
  t=t.replace(/^(?:\s*(?:acute|severe|full-thickness|large|occult|small-volume|retrocaecal|pelvic|clinically important|need for|significant|suspected)\s+)+/,"");
  return t.trim();
}
/* findings that measure the same mechanism: multiplying their LRs double-counts */
const OVERLAP=[
 {ids:["jvp","ajr","kussmaul-sign"],why:"Both read right atrial pressure."},
 {ids:["egophony","bronchial-breathing","whisper"],why:"All three detect consolidated lung transmitting high-pitched sound."},
 {ids:["percussion-dull","fremitus","auscultatory-percussion"],why:"Both detect fluid between lung and chest wall."},
 {ids:["fluid-wave","shifting-dullness","puddle"],why:"All detect free peritoneal fluid."},
 {ids:["lachman","ant-drawer-knee"],why:"Both measure anterior tibial translation, at different knee angles."},
 {ids:["fet","wheeze"],why:"Both reflect expiratory airflow obstruction."},
 {ids:["hoover","laryngeal-height"],why:"Both reflect hyperinflation."},
 {ids:["rebound","cough-test","heel-drop"],why:"All jar an inflamed peritoneum."},
 {ids:["phalen","tinel-wrist"],why:"Both provoke the median nerve in the carpal tunnel."},
 {ids:["kernig","neck-stiffness"],why:"Both stretch inflamed meninges."},
 {ids:["slr","crossed-slr","femoral-stretch"],why:"All are nerve-root tension tests."},
 {ids:["spurling","ultt"],why:"Both provoke an irritated cervical root."},
 {ids:["hawkins","neer"],why:"Both compress the subacromial space."},
 {ids:["postural","shock-index"],why:"Both read the circulatory response to volume loss."}];
const overlapOf=id=>OVERLAP.find(g=>g.ids.includes(id))||null;

/* ---------- search: word-start matching, synonyms, ranking ---------- */
function normTxt(x){
  return " "+String(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/æ/g,"ae").replace(/œ/g,"oe")
   .replace(/[’'`]s\b/g,"s").replace(/[’'`]/g,"")
   .replace(/ae/g,"e").replace(/\boe(?=[a-z])/g,"e").replace(/our\b/g,"or").replace(/\bpaed/g,"ped")
   .replace(/[^a-z0-9+≤≥<>]+/g," ").replace(/\s+/g," ").trim()+" ";
}
const SYN_GROUPS=[
 ["pe","pulmonary embolism","pulmonary embolus","perc","wells pe"],["dvt","deep vein thrombosis","deep venous thrombosis","homans"],
 ["mi","acs","myocardial infarction","acute coronary syndrome","heart attack","chest pain"],["af","atrial fibrillation","irregular pulse"],
 ["sah","subarachnoid","thunderclap"],["hf","chf","lvf","heart failure","cardiac failure"],["copd","emphysema","chronic obstructive","hyperinflation","airflow obstruction"],
 ["aaa","abdominal aortic aneurysm","aortic aneurysm"],["acl","anterior cruciate"],["pcl","posterior cruciate"],["mcl","medial collateral"],["lcl","lateral collateral"],
 ["cts","carpal tunnel"],["stroke","tia","befast","hemiparesis"],["uti","urinary infection","pyelonephritis","costovertebral"],
 ["anaemia","anemia","hb","haemoglobin","hemoglobin","pallor"],["hypovolaemia","hypovolemia","dehydration","volume depletion","blood loss","dehydrated"],
 ["bppv","benign paroxysmal","positional vertigo"],["vertigo","dizzy","dizziness","vestibular"],["hocm","hypertrophic"],["umn","upper motor neuron","corticospinal","pyramidal"],
 ["lmn","lower motor neuron"],["gca","giant cell","temporal arteritis"],["oa","osteoarthritis"],["ra","rheumatoid"],["as","aortic stenosis"],["ar","aortic regurgitation"],
 ["mr","mitral regurgitation"],["rr","respiratory rate"],["bp","blood pressure"],["icp","intracranial pressure","papilloedema","papilledema"],["tbi","head injury","ct head"],
 ["c spine","cervical spine","neck injury"],["back pain","lumbar","sciatica"],["kidney","renal"],["liver","hepatic","hepatomegaly","cirrhosis"],["spleen","splenomegaly","splenic"],
 ["thyroid","goitre","goiter"],["gallbladder","cholecystitis","biliary"],["torsion","testicular"],["meningitis","meningism","meningeal"],["tamponade","pulsus","pericardial effusion"],
 ["pneumonia","consolidation","chest infection"],["dissection","aortic dissection","pulse deficit"],["parkinson","parkinsonism","bradykinesia"],["myasthenia","ptosis"],
 ["sepsis","septic","infection"],["shock","hypotension","hypoperfusion"],["fracture","broken"],["appendicitis","appendix"],["meniscal","meniscus"],["achilles","thompson"],["hearing","deaf","deafness"],["diabetes","diabetic"],["calcium","hypocalcaemia","hypocalcemia","tetany"]
].map(g=>g.map(x=>normTxt(x).trim()));
let SIDX=null,SIDXN=0;
function signIndex(){
  const n=Object.keys(SIGNS).length;if(SIDX&&SIDXN===n)return SIDX;SIDXN=n;
  SIDX=Object.entries(SIGNS).map(([k,s])=>({k,f:[[10,normTxt(s.name)],[9,normTxt((s.aka||[]).join(" ")+" "+k.replace(/-/g," "))],[8,normTxt(dxKey(s,k))],[7,normTxt(s.target)],[3,normTxt(s.think)],[2,normTxt(s.note)],[1.5,normTxt(s.how+" "+s.mech)],[1,normTxt(s.anat)]],nm:normTxt(s.name)}));
  return SIDX;
}
function termAlts(t){
  const alts=[t];SYN_GROUPS.forEach(g=>{if(g.includes(t)||(t.length>=4&&g.some(x=>x.startsWith(t)&&!x.includes(" "))))g.forEach(x=>{if(!alts.includes(x))alts.push(x);});});return alts;
}
function scoreAlt(F,a,orig){
  let best=0;const short=a.length<=2,three=a.length===3,phrase=a.includes(" ");
  for(const [w,h] of F){if(short&&w<7)continue;
    const whole=short||three||(a!==orig&&a.length<=4);
    const hit=phrase?h.includes(" "+a):whole?h.includes(" "+a+" "):h.includes(" "+a);
    if(hit){const v=w*(a===orig?1:0.85);if(v>best)best=v;}}
  return best;
}
function signSearch(q){
  const nq=normTxt(q).trim();if(!nq)return null;
  const I=signIndex(),res=new Map();
  // a whole-query synonym phrase (e.g. "heart attack") counts as one term
  const whole=SYN_GROUPS.find(g=>g.includes(nq)&&nq.includes(" "));
  const terms=whole?[nq]:nq.split(" ").filter(Boolean);
  const alts=terms.map(termAlts);
  for(const e of I){let tot=0,ok=true;
    for(let i=0;i<terms.length;i++){let b=0;for(const a of alts[i]){const v=scoreAlt(e.f,a,terms[i]);if(v>b)b=v;}if(!b){ok=false;break;}tot+=b;}
    if(!ok)continue;
    if(e.nm.startsWith(" "+nq))tot+=12;if(e.nm.trim()===nq)tot+=20;
    res.set(e.k,tot);}
  return res;
}

/* ---------- photo subjects without a sign page: a caption and where to go next ---------- */
const IMGSUB_INFO={
 wasting:["Wasting of the small hand muscles: thenar (median nerve, carpal tunnel) or first dorsal interosseous and hypothenar (ulnar nerve, or a T1 root lesion).",["cts-hypalgesia","froment","phalen"],[["Root or nerve?","learn/rootnerve"]]],
 "foot-drop":["Weak ankle and toe dorsiflexion with a high-stepping gait. Common peroneal palsy spares inversion; an L5 root lesion weakens inversion and hip abduction too.",["lumbar-roots","slr"],[["Root or nerve?","learn/rootnerve"]]],
 "wrist-drop":["Weak wrist and finger extension, usually radial nerve compression at the spiral groove; triceps is spared in mid-humeral lesions.",["reflexes"],[["Root or nerve?","learn/rootnerve"]]],
 erb:["Upper brachial plexus (C5–C6) injury: arm adducted and internally rotated, forearm pronated (the waiter's tip).",["reflexes"],[["Myotomes and reflexes","learn/myotomes"]]],
 gout:["Acute monoarthritis, classically the first metatarsophalangeal joint (podagra); chronic disease leaves tophi. Aspirate a hot joint to exclude sepsis.",[],[["Kocher criteria (septic hip, children)","tools/calc/kocher"]]],
 dactylitis:["A whole swollen 'sausage' digit: think psoriatic arthritis or another spondyloarthritis; also gout and sickle cell disease.",["schober"],[["Nail psoriasis","learn/dcond/psoriasis-nail"]]],
 "psoriatic-nails":["Pitting, onycholysis and oil-drop discolouration. Nail disease is linked with psoriatic arthritis.",[],[["Nail psoriasis","learn/dcond/psoriasis-nail"],["Psoriasis","learn/dcond/psoriasis"]]],
 scoliosis:["Lateral curvature (scoliosis) or exaggerated thoracic flexion (kyphosis). Ask the patient to bend forward: a rib hump means structural scoliosis.",["schober","gals"],[]],
 venous:["Venous hypertension: varicose veins, haemosiderin staining, venous eczema, lipodermatosclerosis and ulcers above the medial malleolus.",["abi","pedal-pulses"],[["Venous leg ulcer","learn/dcond/venous-ulcer"]]],
 "cellulitis-vs":["Spreading, poorly demarcated erythema, warmth and tenderness. Bilateral 'cellulitis' is usually something else (venous eczema, lipodermatosclerosis).",[],[["Cellulitis","learn/dcond/cellulitis"],["Erysipelas","learn/dcond/erysipelas"]]],
 "necfasc-sign":["Pain out of proportion to the skin, rapid spread, systemic toxicity, then dusky skin, bullae and crepitus. A surgical emergency: early surgical review.",[],[["Necrotising fasciitis","learn/dcond/necfasc"],["LRINEC","tools/calc/lrinec"]]],
 pressure:["Pressure injury over a bony prominence, graded by depth from non-blanching erythema to full-thickness tissue loss.",[],[["Pressure injury","learn/dcond/pressure-injury"]]],
 burns:["Depth decides care: superficial (red, blanches), partial thickness (blisters, painful), full thickness (white or leathery, painless).",[],[["Burn depth","learn/dcond/burn-depth"],["Parkland formula","tools/calc/parkland"]]],
 koilonychia:["Nail signs: koilonychia (iron deficiency), leukonychia and Terry's nails (low albumin, cirrhosis), Beau's lines (a past systemic illness), clubbing.",["clubbing","conj-pallor"],[]],
 oral:["Mouth signs: candidiasis, angular cheilitis, strawberry tongue (scarlet fever, Kawasaki), Koplik spots (measles), Wickham striae (lichen planus), glossitis.",[],[["Oral lichen planus","learn/dcond/lp-oral"],["Scarlet fever","learn/dcond/scarlet-fever"]]],
 cushing:["Moon face, dorsocervical fat pad, wide purple striae, thin skin and proximal myopathy. Proximal weakness and easy bruising are the more discriminating features.",["bmi-waist"],[["Striae","learn/dcond/striae"]]],
 acromegaly:["Coarse features, prognathism, spaced teeth, large hands and feet. Compare with old photographs.",[],[]],
 xanthelasma:["Lipid signs: xanthelasma, corneal arcus (meaningful under about 50) and tendon xanthomas (familial hypercholesterolaemia).",[],[["Xanthelasma","learn/dcond/xanthelasma"],["Xanthoma","learn/dcond/xanthoma"]]],
 kayser:["A brown-green ring at the corneal margin from copper deposition: Wilson's disease. Slit-lamp examination confirms it.",["asterixis"],[]],
 ascites:["Abdominal distension with bulging flanks. Confirm free fluid at the bedside, then by ultrasound.",["shifting-dullness","fluid-wave"],[]],
 parotid:["Parotid swelling lifts the ear lobe. Bilateral and painful: mumps; unilateral and painful with pus at Stensen's duct: bacterial parotitis.",["lymph-nodes"],[]],
 angioedema:["Non-pitting swelling of lips, face, tongue or airway. Without urticaria, consider ACE inhibitor or bradykinin-mediated angio-oedema, which responds poorly to adrenaline.",["stridor-sign"],[["Urticaria","learn/dcond/urticaria"]]],
 kawasaki:["Fever for 5 days or more with conjunctivitis, red cracked lips, rash, extremity changes and cervical nodes; peeling fingers come later. Risk: coronary aneurysm.",[],[["Kawasaki disease","learn/dcond/kawasaki"]]],
 measles:["Cough, coryza and conjunctivitis, Koplik spots, then a rash spreading from the face downward.",[],[["Measles","learn/dcond/measles"]]],
 scarlet:["Sandpaper rash, flushed face with circumoral pallor, strawberry tongue, after a streptococcal sore throat.",["centor"],[["Scarlet fever","learn/dcond/scarlet-fever"]]],
 hfmd:["Vesicles on the palms, soles and mouth in a young child; usually coxsackievirus and self-limiting.",[],[["Hand, foot and mouth disease","learn/dcond/hfmd"]]],
 "dermatome-chart":["Sensory territories of the spinal roots; overlap means a single root lesion gives a smaller loss than the chart suggests.",["lumbar-roots"],[["Dermatomes and nerves","learn/neuromap"]]],
 "brachial-plexus":["Roots, trunks, divisions, cords and branches of the brachial plexus (C5–T1).",["froment"],[["Root or nerve?","learn/rootnerve"]]],
 "heart-anatomy":["Surface markings of the heart and the auscultation areas, which sit downstream of the valves rather than over them.",["apex-displaced"],[["Chest map","sounds/map"]]],
 "lung-anatomy":["Surface markings of the lungs, fissures and pleura: the pleura reaches lower than the lung at every level.",["percussion-dull"],[["Chest map","sounds/map"]]],
 "abdomen-regions":["The nine regions and four quadrants used to describe abdominal pain and masses.",["rlq-tender","liver-palp"],[]],
 "cord-diagram":["The long tracts of the spinal cord: corticospinal (motor), dorsal columns (vibration, position) and spinothalamic (pain, temperature).",["babinski","romberg"],[["Where is the lesion?","learn/localise"]]],
 "circle-of-willis":["The arterial ring at the base of the brain linking the carotid and vertebrobasilar circulations.",["befast","visual-fields"],[["Where is the lesion?","learn/localise"]]]};

/* scores and calculators that match a query (shown under sign results, so "SAH" or "Kocher" still lead somewhere) */
function toolSearch(q){
  const nq=normTxt(q).trim();if(!nq||typeof TOOLS==="undefined")return [];
  const terms=nq.split(" ").filter(Boolean).map(termAlts);
  return TOOLS.map(t=>{const F=[[10,normTxt(t.name+" "+t.id.replace(/-/g," "))],[3,normTxt((t.use||"")+" "+(t.group||""))]];let tot=0;
    for(let i=0;i<terms.length;i++){let b=0;for(const a of terms[i]){const v=scoreAlt(F,a,terms[i][0]);if(v>b)b=v;}if(!b)return null;tot+=b;}return [t,tot];})
   .filter(Boolean).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
}
/* "present/absent" for signs, "positive/negative" for tests and rules */
const resWord=(s,r)=>(s&&(s.type==="sign"||s.type==="vital"))?(r==="pos"?"present":"absent"):(r==="pos"?"positive":"negative");
