"use strict";
/* Second literature audit (27/10/2026): text corrections for signs without numeric data. */
const SIGN_FIX2={
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
