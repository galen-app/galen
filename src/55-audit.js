"use strict";
/* Second literature audit (27/10/2026): text corrections for signs without numeric data. */
const SIGN_FIX2={
"jvp": {
"how": "Recline at 30–45°, head turned slightly left, light across the neck. Identify the internal jugular pulsation (double waveform, non-palpable, fills from above, falls on inspiration, rises with abdominal pressure). Measure the vertical height above the sternal angle: more than 3 cm is raised. The sternal angle lies about 5 cm above the right atrium lying flat but about 8 cm at 30–45° (Seth 2002), so the old 'add 5 cm' underestimates right atrial pressure when the patient is propped up."
},
"laryngeal-height": {
"mech": "Hyperinflation pulls the trachea and larynx down into the chest, shortening the distance between the top of the thyroid cartilage and the sternal notch."
},
"heel-drop": {
"how": "Ask the patient to stand on tiptoe and drop onto the heels, or tap the heel of the supine patient. Positive: pain in the right lower quadrant (or wherever the inflamed peritoneum lies).",
"mech": "The jolt moves the inflamed appendix and the peritoneum over it against the abdominal wall.",
"think": "A kinder alternative to rebound in suspected appendicitis (Markle 1973: sensitivity 74%, specificity not reported, so a positive test proves little). Children who jump or walk comfortably rarely have appendicitis with peritoneal irritation."
},
"wells-pe": {
"how": "Use PERC only when your clinical probability is already low (gestalt < 15%). All eight must be met: age < 50, HR < 100, SpO2 ≥ 95%, no haemoptysis, no oestrogen use, no previous VTE, no unilateral leg swelling, no surgery or trauma in the last 4 weeks. If all are met, no further testing for PE.",
"mech": "Eight risk factors and signs, each common in PE, combined so that their joint absence makes PE rare in a low-risk patient; no single bedside sign is reliable.",
"think": "Low gestalt plus PERC negative: stop. Any PERC item positive: move to the Wells score (a separate rule: clinical DVT signs 3, PE most likely 3, HR > 100 1.5, immobilisation or surgery 1.5, previous VTE 1.5, haemoptysis 1, cancer 1). Wells ≤ 4 with a negative (age-adjusted) D-dimer excludes PE; Wells > 4: CT pulmonary angiogram. Shock or RV strain: treat now."
},
"flick": {
"think": "One 1984 study reported excellent figures that were never reproduced; Hansen 2004 found LR+ ≈ 1.4, so a positive flick barely changes probability. A symptom diagram covering the median fingers and sparing the palm is more helpful; nerve conduction confirms before surgery."
},
"carotid-bruit": {
"think": "Barely changes probability (LR+ 1.6, LR− 0.6) even in a symptomatic patient, so it neither confirms nor excludes significant stenosis. Every TIA or amaurosis fugax gets urgent carotid imaging regardless of what you hear. Asymptomatic bruits mark general vascular risk more than the carotid itself."
},
"conj-pallor": {
"how": "Pull down the lower lid in good light and look at the colour of the palpebral conjunctiva. Pallor: the conjunctiva is pale pink or white rather than red. The stricter rim-pallor finding compares the anterior rim with the deeper posterior conjunctiva: positive when the rim is as pale as the posterior part.",
"think": "Better than skin pallor, which depends on pigmentation and perfusion. Conjunctival pallor LR+ 4.5, LR− 0.61 (Sheth 1997); rim pallor is rarer but more specific (LR+ ≈ 16.7). Palmar crease pallor (creases as pale as the surrounding skin) has LR ≈ 7. No pallor sign excludes anaemia, and none replaces a haemoglobin."
},
"ottawa-knee": {
"think": "Near-perfect sensitivity; cuts knee X-rays by about a quarter. Validated in children aged 2–16 too (Bulloch 2003: sensitivity 100%, specificity 43%). Not for altered consciousness, intoxication or multiple injuries."
},
"ottawa-ankle": {
"think": "Near-perfect sensitivity (LR− 0.08): a negative rule means no X-ray. It reduces ankle radiography by about 30–40% (Bachmann 2003). Not validated in children under 5 or in intoxicated or distracted patients."
},
"rlq-tender": {
"think": "The most useful single sign, and its absence lowers the probability (LR− 0.4). The symptoms are stronger than the sign: RLQ pain (LR ≈ 8) and migration of pain from the umbilicus (LR ≈ 3) come from the history. Rigidity (LR ≈ 4), pain before vomiting (LR ≈ 2.8) and the psoas sign (LR ≈ 2.4) add up. A retrocaecal appendix (from about a quarter to two thirds of cases depending on the series) gives tenderness that may be lateral or only in the flank."
},
"ct-head-rule": {
"think": "Not for anticoagulated patients, children, or seizures after injury. NICE NG232 (2023): for people on anticoagulants or antiplatelets (other than aspirin alone) with no other indication, consider a CT head scan within 8 hours of the injury, or within 1 hour if they present more than 8 hours after it. Many EDs still scan all anticoagulated head injuries."
},
"bp-arms": {
"think": "Present in only about 30% of dissections, so absence does not exclude it. Klompas 2002: a focal neurological deficit LR+ 6.6–33; tearing or ripping pain LR+ 1.2–10.8 across studies (do not quote the top of the range); absence of sudden-onset pain LR− 0.3. A new AR murmur is weak evidence (LR ≈ 1.4), though it matters for root involvement. To rule out, use the aortic dissection detection risk score: ADD-RS ≤ 1 with D-dimer < 500 ng/mL had a 0.3% miss rate in ADvISED (Nazerian 2018)."
},
"hoffmann": {
"how": "Hold the patient's middle finger loosely and flick its nail downward (or flick the distal phalanx upward). Positive: flexion of the thumb and index finger.",
"mech": "Flicking the nail briskly stretches the long finger flexors, so Hoffmann's sign is a brisk finger-flexor stretch reflex (the C8 arc) released by loss of corticospinal inhibition. It is not a separate segmental test (the finger jerk, tapping the examiner's fingers laid across the patient's, tests C8), and it is not the upper-limb Babinski, which is a released cutaneous withdrawal reflex.",
"think": "Present in some normal people with brisk reflexes; asymmetry means more than presence. Weak evidence for cervical myelopathy (LR+ 2.2, LR− 0.63). Gait disturbance, hand clumsiness, an inverted supinator jerk and lower-limb UMN signs are better pointers; MRI decides."
},
"cap-refill": {
"name": "Capillary refill time (adult)",
"how": "Press the fingertip (or sternum) at heart level for 5 s and time the return of colour in good light. Two thresholds are in use: over 2 s is the classic abnormal value in hypovolaemia studies (upper limit of normal about 2 s in children and men, 3 s in women and 4.5 s in older adults, Schriger and Baraff 1988), and over 3 s is the threshold used to guide septic shock resuscitation (ANDROMEDA-SHOCK, Hernández 2019).",
"think": "In adults it has no proven diagnostic value for hypovolaemia (McGee 1999 JAMA RCE): ambient temperature, age and the lighting change it more than volume. Its real adult use is as a trend in septic shock, where normalising a refill time over 3 s is a valid resuscitation target. More useful in children. Mottling, cool knees, the postural pulse and the lactate say more."
},
"hints": {
"how": "Only in continuous vertigo with nystagmus (acute vestibular syndrome), and only if you have been trained in it. (1) Head Impulse: rapid 10–20° head turn while the patient fixes on your nose; a corrective saccade = peripheral (reassuring). (2) Nystagmus: direction-changing on lateral gaze = central. (3) Test of Skew: alternate cover; vertical corrective movement = central. Then test gait: inability to walk unaided is central until proven otherwise.",
"think": "In trained hands HINTS beats early MRI (sens ≈ 97%, LR− 0.03), but in ordinary ED hands it is far weaker (sens 83%, spec 44%, Ohle 2020), and a misread head impulse is the usual error. GRACE-3 (ACEP 2023): use HINTS only if trained; otherwise image or get expert review. A normal head impulse in acute vestibular syndrome is the dangerous finding. Do not use it for episodic or positional vertigo."
},
"scaphoid": {
"think": "Sensitive, poorly specific (Parvizi 1998: snuffbox tenderness sens 100%, spec 9%). Combining snuffbox and scaphoid tubercle tenderness with pain on thumb compression raises specificity to 74%. Treat as a fracture if tender even with a normal X-ray: immobilise and arrange early MRI (NICE NG38; repeat films at 10–14 days only where MRI is unavailable), because missed scaphoid fractures lead to non-union and avascular necrosis."
},
"hip-oa": {
"how": "Five findings (Sutlive 2008): squatting aggravates the pain; active hip flexion causes lateral hip pain; the scour test with adduction causes lateral hip or groin pain; active hip extension causes pain; passive internal rotation ≤ 25°. Three or more is positive (four or more is more specific); one or none makes OA unlikely."
},
"babinski": {
"think": "A clear extensor response is strong evidence of a pyramidal lesion (LR+ ≈ 52 in neurologists' hands), but it is present in only about half of patients with one, so a flexor response excludes nothing. Combine with hyperreflexia, clonus, spasticity and pyramidal weakness to localise to cord or brain. Normal in infants under 1 year. Withdrawal from tickling is not Babinski: look at the toe, not the leg."
},
"pronator-drift": {
"think": "The best quick screen for subtle hemiparesis: a positive drift is reliable (specificity 90–100% in every study), but sensitivity ranges from 22% to 92%, so a normal test does not exclude a lesion. Upward drift suggests cerebellar disease; a searching, wandering drift suggests proprioceptive loss. Downward drift without pronation can be functional or from pain."
},
"spurling": {
"think": "Specific, insensitive: a positive test with a matching dermatome, reflex and myotome makes radiculopathy likely (C6 thumb and biceps/supinator reflex; C7 middle finger and triceps). A negative test proves little; the upper limb tension test is the rule-out test. Stop if it reproduces myelopathic symptoms."
},
"resp-rate": {
"think": "RR > 20 is the most neglected and most predictive vital sign for deterioration; RR ≥ 22 is a qSOFA criterion (Surviving Sepsis 2021 advises against qSOFA alone as a screening tool; use NEWS2 or similar). A normal RR with normal HR and temperature makes pneumonia unlikely (LR ≈ 0.2)."
},
"lymph-supraclav": {
"think": "A supraclavicular node carries the highest malignancy risk of any site: about 90% in patients over 40 and about 25% in younger patients. Hard, fixed, painless and > 2 cm increase the probability. Generalised nodes point to lymphoma, HIV, EBV."
},
"ar-eponyms": {
"think": "Low sensitivity, poorly studied, and echo quantifies AR directly. Hill's sign (popliteal systolic exceeding brachial, classically by > 60 mmHg in severe AR) has been shown to be an artefact of cuff measurement in the leg rather than a true intra-arterial gradient, so it is no better. Know them for exams; do not rely on them."
},
"cardiac-dullness": {
"think": "Dullness > 10.5 cm from the midsternal line in the 5th left interspace is sensitive (≈ 91%) but non-specific (≈ 30%) for an enlarged left ventricle, so it can only help rule out cardiomegaly. Apex palpation, chest X-ray, POCUS and echo have replaced it."
},
"tamponade-signs": {
"name": "Hypotension, raised JVP and quiet heart sounds (Beck's triad)",
"how": "Look for hypotension, distended neck veins and distant heart sounds; note tachycardia and measure pulsus paradoxus.",
"think": "Beck's triad is hypotension, raised JVP and muffled heart sounds, not tachycardia. Sensitivities: tachycardia ≈ 77%, JVD ≈ 76%, hypotension ≈ 26%, quiet sounds only ≈ 28%. The full triad is rare. Pulsus paradoxus > 10 mmHg (LR+ ≈ 3.3, LR− ≈ 0.03) and POCUS are the useful tests."
},
"peak-flow": {
"think": "Acute asthma: PEF 33–50% of best or predicted = acute severe, < 33% = life-threatening (BTS/SIGN). Objective measurement beats the impression of the chest. For diagnosis, diurnal PEF variability supports asthma: > 20% by NICE/BTS/SIGN, > 10% average daily variability (> 13% in children) by GINA; never use it alone."
},
"dre": {
"think": "Useful for melaena, impaction and prostate assessment. In suspected cauda equina, anal tone on DRE is unreliable and is not required before referral (UK GIRFT 2023 pathway): perianal sensation, bladder symptoms and urgent MRI matter more. Low yield for appendicitis (right-sided rectal tenderness adds nothing to the abdominal examination) and should not delay treatment of an obvious upper GI bleed."
},
"rapd": {
"think": "Optic neuritis, ischaemic optic neuropathy, asymmetric glaucoma, large retinal detachment, compressive lesions. Cataract does not cause it. A dilated unreactive pupil with ptosis and a 'down and out' eye is a third-nerve palsy; with headache, think posterior communicating artery aneurysm."
},
"facial-palsy": {
"anat": "The part of the facial nucleus that supplies the forehead receives input from both hemispheres; the part supplying the lower face receives mainly crossed input.",
"think": "Forehead spared: stroke, tumour (but a partial peripheral lesion can occasionally spare the forehead). Whole side: Bell's palsy, Ramsay Hunt (check the ear for vesicles), Lyme, parotid tumour, otitis. Bilateral: Guillain–Barré, sarcoid, Lyme. Check the corneal reflex and hearing."
},
"cauda": {
"think": "Bilateral sciatica, new bladder or bowel dysfunction and saddle numbness need emergency MRI. A post-void residual > 200 mL raises suspicion only modestly (sensitivity ≈ 82%, specificity ≈ 65%, LR+ ≈ 2.3) and must not be used alone to exclude CES; symptoms with a normal residual still need MRI."
},
"finkelstein": {
"how": "Examiner grasps the patient's thumb and passively ulnar-deviates the wrist (true Finkelstein); pain over the radial styloid is positive. The common 'thumb in fist then ulnar deviate' version is Eichhoff's test, which gives more false positives. The WHAT test (wrist hyperflexion and thumb abduction against resistance) is more specific."
},
"gals": {
"think": "Normal GALS makes significant joint disease unlikely (high sensitivity as a screen). Squeezing the MCPs and MTPs is a quick screen for synovitis in inflammatory arthritis."
},
"centor": {
"how": "One point each: tonsillar swelling or exudate; tender, swollen anterior cervical nodes; temperature > 38 °C (Centor: history of fever); absence of cough. McIsaac adds age 3–14 +1, ≥ 45 −1.",
"think": "Score 0–1: no test, no antibiotics. 2–3: rapid antigen test or culture, antibiotics only if positive. ≥ 4: probability about 50%; test where possible (IDSA advises testing rather than empirical treatment), or treat empirically if testing is unavailable. Unilateral swelling with trismus and a deviated uvula is a quinsy."
},
"patellar-app": {
"how": "Supine, knee flexed about 20–30° over your thigh or a pillow, quadriceps relaxed; push the patella laterally. Positive: apprehension or quadriceps contraction to stop it."
},
"wells-dvt": {
"think": "Score ≤ 1 (DVT unlikely) with a negative D-dimer (age-adjusted over 50) excludes DVT. Score ≥ 2: ultrasound. Calf asymmetry ≥ 3 cm is the most useful single sign but still weak (LR+ about 2); no single sign rules DVT in or out."
},
"auscultatory-percussion": {
"anat": "On ultrasound the diaphragm descends about 5–7 cm with a maximal breath (lower limit of normal about 3–4 cm), more than percussion suggests."
},
"cmt": {
"think": "Not specific: also positive in ectopic pregnancy and appendicitis. Always do a pregnancy test first. CDC: in a sexually active woman at risk, cervical motion, uterine or adnexal tenderness with no other cause is enough to start empirical PID treatment."
},
"befast": {
"think": "Any positive item with sudden onset: check glucose, record last known well and activate the stroke pathway immediately (thrombolysis up to 4.5 h, thrombectomy up to 24 h in selected patients). NIHSS quantifies severity."
},
"epley": {
"think": "Cures about 80% with one to three manoeuvres, far better than betahistine or vestibular sedatives (which guidelines advise against). Atypical features suggest a central cause: no latency or fatigue, pure downbeat or pure vertical nystagmus, or severe vomiting with minimal nystagmus."
}
};
Object.entries(SIGN_FIX2).forEach(([k,f])=>{if(SIGNS[k])Object.assign(SIGNS[k],f);else console.warn("SIGN_FIX2 unknown",k);});

/* ================= SIGN METADATA (13/11/2026) =================
 dx   : short diagnosis key shared by signs that answer the same question. "Same target" links, calculator presets and duels
        must group on dx only (never on the first word of the target). Signs without dx have no partners.
 aka  : search synonyms (abbreviations, US spellings, old names).
 use  : DERIVED here from the final LRs, so it can never disagree with them. "in" (LR+ ≥ 5),
        "out" (LR− ≤ 0.2; a finding whose LR+ is ≤ 0.2; or sensitivity ≥ 99% when LR− cannot be estimated), "both", "neither" (weaker),
        or null (no numbers: scores, scales, descriptive signs). Card generation (rule in or out) should key on s.use.
 best : the decisive figure for list rows and the 10-second card: {k:"p"|"n", v} whichever LR is further from 1, or
        {k:"sens", v} for a rule-out rule whose sensitivity is ≥ 99% and whose LR− cannot be estimated (show "Sn 100%: a negative rules out"). */
const SIGN_DX={
 appendicitis:["rlq-tender","rovsing","psoas","obturator","heel-drop","alvarado"],
 peritonitis:["rebound","cough-test"],
 tamponade:["pulsus-paradoxus","tamponade-signs"],
 pericarditis:["pericardial-rub"],
 acs:["chest-wall-tender","acs-radiation"],
 "aortic-dissection":["bp-arms","add-rs"],
 acl:["lachman","ant-drawer-knee","pivot-shift"],
 meniscus:["mcmurray","thessaly","joint-line"],
 "heart-failure":["jvp","ajr","s3","oedema","crackles"],
 consolidation:["egophony","bronchial-breathing","whisper"],
 "pleural-effusion":["chest-expansion","percussion-dull","fremitus"],
 ascites:["fluid-wave","shifting-dullness","puddle"],
 "aortic-stenosis":["carotid-upstroke","a2-soft","murmur-rclav"],
 "aortic-regurgitation":["ar-murmur","ar-eponyms"],
 dvt:["homans","wells-dvt"],
 pe:["wells-pe"],
 meningitis:["kernig","neck-stiffness"],
 "umn-lesion":["babinski","pronator-drift","clonus"],
 "cervical-myelopathy":["hoffmann"],
 cts:["phalen","tinel-wrist","flick","cts-hypalgesia"],
 "scaphoid-fracture":["scaphoid"],
 "cauda-equina":["cauda"],
 "airflow-obstruction":["fet","wheeze","hoover","laryngeal-height","hyperresonance"],
 hypovolaemia:["postural","dry-axilla","cap-refill","skin-turgor"],
 pad:["pedal-pulses","abi"],
 "lumbar-radiculopathy":["slr","crossed-slr","femoral-stretch","lumbar-roots"],
 "cervical-radiculopathy":["spurling","ultt"],
 "cuff-tear":["drop-arm","er-lag","empty-can","lift-off"],
 "subacromial-pain":["painful-arc","hawkins","neer"],
 gca:["jaw-claudication","temporal-artery"],
 sah:["ottawa-sah"],
 "central-vertigo":["hints"],
 bppv:["dix-hallpike","epley"],
 "hearing-loss":["whisper-test","rinne-weber"],
 anaemia:["conj-pallor"],
 hypocalcaemia:["chvostek","trousseau"],
 pneumothorax:["ptx-signs","tension-ptx"],
 delirium:["four-at"],
 "compartment-syndrome":["compartment"],
 "head-injury":["ct-head-rule","battle"],
 "c-spine-injury":["c-spine-rule"],
 "ankle-fracture":["ottawa-ankle"],
 "knee-fracture":["ottawa-knee"],
 "elbow-fracture":["elbow-ext"],
 "hip-fracture":["patellar-pubic","log-roll"],
 deterioration:["resp-rate","qsofa","news2","shock-index"],
 parkinsonism:["glabellar","bradykinesia"],
 "third-nerve-palsy":["cn3-pupil"],
 stroke:["befast","facial-palsy"],
 "achilles-rupture":["thompson"],
 "ankle-sprain":["ankle-drawer","squeeze"],
 hyperthyroidism:["hyperthyroid-signs"],
 hypothyroidism:["hypothyroid-signs"],
 "otitis-media":["otoscopy"],
 sinusitis:["transillumination"],
 cholecystitis:["murphy"],
 aaa:["aaa-palp"],
 af:["irregular-pulse"],
 hocm:["valsalva-murmur"],
 "torsion":["cremasteric"],
 pid:["cmt"],
 "hip-oa":["hip-oa"],
 "carotid-stenosis":["carotid-bruit"]
};
const SIGN_AKA={
 "wells-pe":["PERC","Wells PE","PE","pulmonary embolism"],"wells-dvt":["DVT","Wells DVT"],homans:["DVT"],
 "chest-wall-tender":["ACS","MI","heart attack","angina","costochondritis"],"acs-radiation":["ACS","MI","heart attack","angina","chest pain"],
 "add-rs":["ADD-RS","aortic dissection","dissection","ADvISED"],"bp-arms":["aortic dissection","dissection"],
 "ottawa-sah":["SAH","subarachnoid","thunderclap headache"],"four-at":["4AT","delirium","acute confusion","CAM"],
 "jaw-claudication":["GCA","temporal arteritis","giant cell arteritis"],"temporal-artery":["GCA","temporal arteritis","giant cell arteritis"],
 "ptx-signs":["pneumothorax","PTX"],"tension-ptx":["pneumothorax","tension","needle decompression"],compartment:["compartment syndrome","fasciotomy"],
 "murmur-rclav":["aortic stenosis","AS","right clavicle"],"argyll-robertson":["light-near dissociation","neurosyphilis","tabes","pupil"],
 "cn3-pupil":["third nerve","oculomotor","CN III","aneurysm"],"pericardial-rub":["pericarditis","friction rub"],
 "irregular-pulse":["AF","atrial fibrillation"],"conj-pallor":["anaemia","anemia","pallor","Hb"],
 postural:["hypovolaemia","hypovolemia","blood loss","orthostatic"],"dry-axilla":["hypovolaemia","hypovolemia","dehydration"],"cap-refill":["CRT","hypovolaemia","hypovolemia","perfusion"],
 phalen:["CTS","carpal tunnel"],"tinel-wrist":["CTS","carpal tunnel"],flick:["CTS","carpal tunnel"],"cts-hypalgesia":["CTS","carpal tunnel"],
 lachman:["ACL"],"ant-drawer-knee":["ACL"],"pivot-shift":["ACL"],mcmurray:["meniscus","meniscal"],
 hints:["vertigo","dizziness","stroke","posterior circulation","GRACE-3"],"dix-hallpike":["BPPV","vertigo"],epley:["BPPV","vertigo"],
 "ct-head-rule":["head injury","CT head","NICE NG232"],"c-spine-rule":["C-spine","neck injury","NEXUS"],
 babinski:["plantar response","UMN","upper motor neurone"],"pronator-drift":["UMN","stroke","hemiparesis"],hoffmann:["myelopathy","DCM","finger flexor"],
 "pulsus-paradoxus":["tamponade","pericardial effusion"],"tamponade-signs":["Beck's triad","tamponade"],
 jvp:["JVP","heart failure","CHF","CCF"],s3:["gallop","heart failure"],crackles:["rales","crepitations","heart failure"],
 egophony:["pneumonia","consolidation"],"bronchial-breathing":["pneumonia","consolidation"],"percussion-dull":["effusion","pleural effusion"],
 kernig:["Brudzinski","meningitis"],"neck-stiffness":["meningism","meningitis","jolt accentuation"],
 cauda:["CES","cauda equina"],slr:["sciatica","Lasègue","disc"],"ottawa-ankle":["ankle X-ray","ankle fracture"],"ottawa-knee":["knee X-ray"],
 scaphoid:["snuffbox","scaphoid fracture"],"aaa-palp":["AAA","aneurysm"],"rlq-tender":["McBurney","appendicitis"],qsofa:["sepsis"],news2:["NEWS","early warning score"]
};
(function(){
  Object.entries(SIGN_DX).forEach(([dx,ids])=>ids.forEach(k=>{if(SIGNS[k])SIGNS[k].dx=dx;else console.warn("SIGN_DX unknown",k);}));
  Object.entries(SIGN_AKA).forEach(([k,a])=>{if(SIGNS[k])SIGNS[k].aka=a;else console.warn("SIGN_AKA unknown",k);});
})();
/* use and best are derived after every data layer has run, so they always match the displayed LRs */
function signUse(s){
  const hasP=s.p!=null,hasN=s.n!=null,sensOut=!hasN&&s.sens!=null&&s.sens>=99;
  if(!hasP&&!hasN&&!sensOut)return null;
  const inn=hasP&&s.p>=5,out=(hasN&&s.n<=0.2)||sensOut||(hasP&&s.p<=0.2);
  return inn&&out?"both":inn?"in":out?"out":"neither";
}
function signBest(s){
  const c=[];if(s.p!=null&&s.p>0)c.push({k:"p",v:s.p,d:Math.abs(Math.log(s.p))});if(s.n!=null&&s.n>0)c.push({k:"n",v:s.n,d:Math.abs(Math.log(s.n))});
  /* a rule-out rule with sensitivity ≥ 99% and no estimable LR−: its decisive figure is the sensitivity */
  if(s.n==null&&s.sens!=null&&s.sens>=99)return {k:"sens",v:s.sens};
  if(!c.length)return null;c.sort((a,b)=>b.d-a.d);return {k:c[0].k,v:c[0].v};
}
function finaliseSigns(){Object.values(SIGNS).forEach(s=>{s.use=signUse(s);s.best=signBest(s);});}
finaliseSigns();
