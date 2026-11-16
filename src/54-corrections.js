"use strict";
/* ================= EVIDENCE CORRECTIONS (independent literature check, 27/10/2026) =================
 Applied after all sign data. `note` is shown on the sign page as an evidence caveat. */
const SIGN_FIX={
/* Every number shown on a sign page comes from here or the base entry, and the "The number" / deep-dive texts are written to agree with it.
 src = where the displayed Sn/Sp/LR come from; pci/nci = 95% CI of LR+/LR−; single = one study or derivation only. Reconciled 13/11/2026. */
/* --- musculoskeletal --- */
"hip-oa":{name:"Hip OA cluster (Sutlive, ≥ 3 of 5 positive)",sens:71,spec:86,p:5.2,n:0.33,v:"useful",single:true,src:"Sutlive 2008 (derivation study)",note:"One derivation study, never validated. The stricter ≥ 4 of 5 gives sens 48, spec 98, LR+ 24.3 (CI 4.6–145), LR− 0.53. Loss of internal rotation is only one of the five items."},
"elbow-ext":{spec:49,p:1.9,n:0.07,src:"Appelboam 2008 (BMJ)",note:"Appelboam 2008 (BMJ), adults and children: sens 97, spec 49. A rule-out test: full extension makes fracture very unlikely."},
"flick":{v:"low",p:1.4,n:0.85,sens:37,spec:74,src:"Hansen 2004",note:"93/96 came from one 1984 study that was not reproduced; Hansen 2004 found sens 37, spec 74 (LR+ ≈ 1.4)."},
"ankle-drawer":{sens:86,spec:74,p:3.3,n:0.19,note:"The often-quoted 96/84 (van Dijk 1996) is for the whole delayed exam at day 4–5 (tenderness, haematoma and drawer together), not the drawer alone."},
"joint-line":{sens:null,spec:null,p:0.9,n:1.1,pci:[0.8,1.0],nci:[1.0,1.3],v:"low",src:"Solomon 2001 (JAMA RCE)",note:"Solomon 2001 (JAMA) summary LRs. Hegedus 2007 pooled sens 63, spec 77 (LR+ ≈ 2.7); the reviews disagree, and neither makes it a strong test."},
"mcmurray":{name:"McMurray test",sens:71,spec:71,p:2.4,n:0.4,src:"Hegedus 2007 (meta-analysis)",note:"Estimates vary widely: Hegedus 2007 pooled 71/71; Solomon's JAMA review LR+ 1.3 (0.9–1.7), LR− 0.8. Positive is more useful than negative."},
"apprehension":{p:17,n:0.39,note:"Hegedus 2012 pooled 66/95. Relocation test pools lower (65/90, LR+ 5.5)."},
"thompson":{p:13.7,n:0.04},
"ottawa-ankle":{p:1.4,src:"Bachmann 2003 (BMJ meta-analysis)"},
"ottawa-knee":{sens:98,spec:49,src:"Bachmann 2004 (Ann Intern Med meta-analysis)"},
"lachman":{sens:85,spec:94,p:14,n:0.16,src:"Benjaminse 2006 (meta-analysis, 28 studies)",note:"Benjaminse 2006 pooled sens 85, spec 94. Solomon's JAMA review gave LR+ 25 (CI 2.7–651), LR− 0.1. All reviews agree it is the best single ACL test."},
"ant-drawer-knee":{sens:null,spec:null,p:3.8,n:0.3,pci:[0.7,22],nci:[0.05,1.5],src:"Solomon 2001 (JAMA RCE)",note:"Wide CIs. Benjaminse 2006 found it good only in chronic knees (sens 92, spec 91), poor in the acute knee."},
"pivot-shift":{sens:24,spec:98,p:12,n:0.78,src:"Benjaminse 2006 (meta-analysis)",note:"Very specific (98%), rarely positive in the awake, guarding patient."},
"painful-arc":{src:"Hermans 2013 (JAMA RCE)",note:"Hermans 2013 (JAMA) LR+ 3.7, LR− 0.36; Hegedus 2012 pooled lower (53/76)."},
"speed":{note:"For SLAP lesions it is worse: pooled 20/78, LR ≈ 1."},
"lumbar-roots":{p:null,n:null,note:"No pooled source found for a single LR; use the pattern (myotome, reflex, dermatome) rather than a number."},
"patellar-pubic":{sens:null,spec:null,n:0.15,note:"Small studies disagree: Adams 1997 ≈ 96/86; Reiman 2013 recalculated 79/95; Tiru 2002 ≈ 94/95. LR− ranges 0.07–0.22."},
"thessaly":{sens:64,spec:53,p:1.4,n:0.68,src:"Goossens 2015 (independent prospective study)",note:"Karachalios 2005 (the original description) reported 89–92 / 96–97, but independent studies found ≈ 65 sensitivity with poor specificity (39–53)."},
"spurling":{sens:30,spec:93,p:4.3,n:0.75,single:true,src:"Tong 2002 (Spine, electrodiagnosis as reference)",note:"Rubinstein 2007 systematic review (6 studies): low to moderate sensitivity, high specificity in every study; Wainner 2003 found sensitivity ≈ 50%. A rule-in test, never a rule-out."},
"scaphoid":{sens:100,spec:9,p:1.1,n:null,single:true,src:"Parvizi 1998 (215 patients)",note:"Snuffbox tenderness alone: sens 100, spec 9. Snuffbox plus scaphoid tubercle tenderness plus pain on thumb compression in the first 24 h: sens 100, spec 74. With 100% sensitivity the LR− cannot be estimated; a non-tender wrist makes fracture unlikely, but the series was small."},
"phalen":{sens:null,spec:null,p:1.3,n:0.7,src:"D'Arcy & McGee 2000 (JAMA RCE)",note:"MacDermid's review gives sens 68, spec 73 (LR+ ≈ 2.5); D'Arcy and McGee's summary LR is lower. Either way it is weak."},
"tinel-wrist":{sens:null,spec:null,p:1.4,n:0.8,src:"D'Arcy & McGee 2000 (JAMA RCE)",note:"Other reviews report sens ≈ 50, spec ≈ 77 (LR+ ≈ 2.2). Either way it is weak."},
/* --- neurology, head and neck --- */
"chvostek":{sens:71,spec:75,p:2.8,n:0.4,v:"low",note:"Old, weak data: absent in ≈ 29% of hypocalcaemic patients and present in 10–25% of healthy adults. Measure ionised calcium instead."},
"kernig":{v:"low",src:"Thomas 2002 (Clin Infect Dis)"},
"ct-head-rule":{sens:100,spec:69,p:3.2,n:null,target:"need for neurosurgical intervention after minor head injury",src:"Stiell 2001 (Lancet), high-risk criteria",note:"Stiell 2001. High-risk criteria: sens 100% for neurosurgical intervention, so the LR− cannot be estimated (a negative rule rules out). For clinically important brain injury (all 7 criteria): sens 98, spec 50, LR− ≈ 0.03."},
"glabellar":{n:0.13,v:"low",single:true,src:"Rao 2003",note:"Rao 2003 LR+ 4.5, LR− 0.13, but with selection bias; against essential tremor it barely discriminates (78/36, LR+ ≈ 1.2)."},
"hints":{sens:83,spec:44,p:1.5,n:0.39,v:"useful",src:"Ohle 2020 (meta-analysis): emergency physicians and mixed examiners",
 ed:{sens:83,spec:44,p:1.5,n:0.39,who:"emergency physicians and mixed examiners (Ohle 2020)"},
 trained:{sens:97,spec:95,p:18.6,n:0.03,who:"neurologists trained in neuro-otology (Ohle 2020)"},
 note:"The headline figures are for ordinary ED hands. Examiners trained in neuro-otology reach sens 97, spec 95 (LR+ ≈ 19, LR− 0.03). GRACE-3 (ACEP 2023): use HINTS only if trained in it; otherwise image or get expert review, and always test gait (inability to walk unaided points to a central cause)."},
"hyperthyroid-signs":{name:"Thyroid eye signs (lid retraction, lid lag)",sens:34,spec:99,p:31.5,n:0.7,note:"McGee. Lid lag: sens 19, spec 99, LR+ 17.6. Fine tremor and warm moist skin are less specific."},
"visual-fields":{sens:68,spec:93,p:9.7,n:0.34,src:"Johnson & Baloh 1991",note:"Johnson & Baloh 1991. Confrontation is poor for anterior (prechiasmal) defects (overall sens 50)."},
"neck-stiffness":{name:"Nuchal rigidity",sens:30,spec:68,p:0.94,n:1.03,src:"Thomas 2002 (Clin Infect Dis)",note:"Thomas 2002. Jolt accentuation (Cochrane): sens 65, spec 70, LR+ ≈ 2.2, LR− ≈ 0.5, very low certainty."},
"water-swallow":{target:"aspiration on FEES (mixed inpatients)",note:"Suiter 2008: 3,000 patients of all diagnoses, not stroke only."},
"otoscopy":{sens:null,spec:null,n:null,src:"Rothman 2003 (JAMA RCE)",note:"Rothman 2003: bulging drum adjusted LR+ 51. A normal-coloured drum has LR− 0.2."},
"hoover-functional":{n:0.37},
"pronator-drift":{sens:92,spec:90,p:9.2,n:0.09,single:true,src:"Teitelbaum 2002 (Can J Neurol Sci), mild unilateral cerebral lesions on CT",note:"One study of patients with suspected mild hemispheric lesions. Sensitivity varies widely between studies (22–92%); specificity is consistently 90–100%, so a positive drift is the reliable half."},
"babinski":{sens:51,spec:99,p:52,n:0.5,pci:[16.6,161],single:true,src:"Isaza Jaramillo 2014 (J Neurol Sci), neurologist examiners",note:"One study of 107 patients examined by neurologists; inter-observer kappa 0.73. Sensitivity is about 50% in every series, so a flexor plantar excludes nothing; less expert examiners get more equivocal responses."},
"hoffmann":{sens:null,spec:null,p:2.2,n:0.63,pci:[1.5,3.3],nci:[0.5,0.8],src:"Fogarty 2018 (Spine, systematic review)",note:"Only three studies were of adequate quality. A positive Hoffmann shifts probability a little; a negative one hardly at all."},
"ice-pack":{note:"Studies vary (sens 39–100%); specificity is consistently > 95%."},
/* --- cardiovascular, respiratory, abdominal, general --- */
"cap-refill":{target:"hypovolaemia (adults)",sens:null,spec:null,p:null,n:null,src:"McGee 1999 (JAMA RCE)",note:"McGee 1999 (JAMA RCE): in adults capillary refill has no proven diagnostic value, either for blood loss (after 450 mL phlebotomy: sens 6%, spec 93%) or for vomiting and diarrhoea."},
"aaa-palp":{target:"AAA ≥ 4 cm",sens:null,spec:null,p:15.6,n:0.51,src:"Lederle 1999 (JAMA RCE)",note:"Lederle 1999: sensitivity 50% for 4–4.9 cm, 76% for ≥ 5 cm; at ≥ 3 cm LR+ 12, LR− 0.72. Obesity defeats it."},
"pedal-pulses":{n:0.38,src:"Khan 2006 (JAMA RCE)",note:"Khan 2006 (symptomatic patients): any pulse abnormality LR+ 4.7, LR− 0.38."},
"abi":{sens:60,spec:87,p:4.6,n:0.45,note:"Against duplex ultrasound. Older angiography-referenced figures (90/95) overstate it. A normal ABI does not exclude PAD, especially in diabetes and the elderly (calcified arteries)."},
"ar-murmur":{n:0.1},
"ajr":{target:"heart failure in a dyspnoeic ED patient",src:"Wang 2005 (JAMA RCE)",note:"Wang 2005. For raised left-sided filling pressure McGee gives LR+ 8, LR− 0.3."},
"apex-displaced":{target:"low ejection fraction",p:10.3},
"carotid-bruit":{target:"severe stenosis in a symptomatic patient",sens:63,spec:61,p:1.6,n:0.6,v:"low",src:"Sauvé 1993 (JAMA RCE, NASCET data)",note:"In asymptomatic patients a bruit does not predict the degree of stenosis."},
"carotid-upstroke":{sens:null,spec:null,p:3.3,n:0.4,src:"McGee, Evidence-Based Physical Diagnosis (pooled)",note:"Studies vary enormously (Etchells 1997: LR+ 2.8 to 130 across studies). Stiff arteries in older patients hide the slow rise."},
"fet":{sens:null,spec:null,src:"McGee, Evidence-Based Physical Diagnosis (pooled)"},
"murphy":{sens:null,spec:null,p:2.8,n:0.5,pci:[0.8,8.6],src:"Trowbridge 2003 (JAMA RCE)",note:"The 95% CI of the LR+ includes 1. Sensitivity falls to about 48% in the elderly."},
"cremasteric":{sens:null,spec:null,p:null,n:null,note:"Sensitivity 70–100% across series (newer 70–81%), specificity 66–94%. A present reflex does not exclude torsion: scan or explore if the story fits."},
"conj-pallor":{name:"Conjunctival pallor",target:"anaemia (Hb ≤ 9 g/dL)",sens:null,spec:null,p:4.5,n:0.61,src:"Sheth 1997 (J Gen Intern Med)",note:"Sheth 1997. Rim pallor (the anterior rim as pale as the posterior conjunctiva) is a separate, stricter finding: LR+ ≈ 16.7, but present in few patients."},
"percussion-dull":{target:"pleural effusion",p:8.7,n:0.31,src:"Wong 2009 (JAMA RCE)",note:"Wong 2009. For consolidation dullness is weaker (LR+ ≈ 3)."},
"chest-expansion":{src:"Wong 2009 (JAMA RCE)"},
"fremitus":{src:"Wong 2009 (JAMA RCE)"},
"crackles":{target:"heart failure (dyspnoeic patient)",src:"Wang 2005 (JAMA RCE)",note:"Wang 2005. For pneumonia crackles have LR+ ≈ 1.6–2.7."},
"abd-bruit":{name:"Systolic–diastolic abdominal bruit",note:"Turnbull 1995: LR+ 39 applies only to bruits with a diastolic component; any bruit is LR+ ≈ 4–5."},
"wells-pe":{name:"PERC rule (low pretest probability of PE)",src:"Singh 2012 (Ann Emerg Med meta-analysis)",note:"Singh 2012. PERC negative in a low-gestalt patient makes PE unlikely enough to skip D-dimer. Wells score is the separate first step."},
"valsalva-murmur":{name:"Valsalva response of a systolic murmur",src:"Lembo 1988 (N Engl J Med)",note:"Lembo 1988, for HOCM. Squat-to-stand: sens 95, spec 84, LR+ 6, LR− 0.1."},
"heel-drop":{target:"appendicitis",spec:null,single:true,note:"Markle 1973; specificity not reported."},
"jvp":{target:"heart failure in a dyspnoeic patient",src:"Wang 2005 (JAMA RCE)"},
"s3":{src:"Wang 2005 (JAMA RCE)"},
"oedema":{src:"Wang 2005 (JAMA RCE)"},
"fluid-wave":{sens:null,spec:null,p:6,n:0.4,pci:[3.3,11.1],src:"Williams & Simel 1992 (JAMA RCE)",note:"Williams & Simel 1992 pooled. It needs a lot of fluid; shifting dullness (LR+ 2.7, LR− 0.3) is more sensitive."},
"shifting-dullness":{sens:77,spec:72,p:2.7,n:0.3,src:"Williams & Simel 1992 (JAMA RCE)"},
"pulsus-paradoxus":{name:"Pulsus paradoxus > 10 mmHg",sens:82,spec:null,p:3.3,n:0.03,pci:[1.8,6.3],nci:[0.01,0.24],src:"Roy 2007 (JAMA RCE), > 10 mmHg in a known effusion",note:"Roy 2007: at > 10 mmHg sens 82%, LR+ 3.3, LR− 0.03. At > 12 mmHg (one study) sens 98%, spec 83%, LR+ 5.9. Absent in tamponade with aortic regurgitation, ASD, raised LV filling pressure or positive-pressure ventilation."},
"wheeze":{note:"Holleman 1993 found auscultated wheeze LR+ 12, LR− 0.87 for airflow obstruction; pooled JAMA review value is lower."},
"qsofa":{src:"Song 2018 (meta-analysis)",note:"Song 2018: sens 51, spec 83. Fernando 2018: 61/72. Poor as a screening rule-out."},
"bp-arms":{src:"Klompas 2002 (JAMA RCE)",note:"Klompas: the LR+ applies to a pulse deficit. Inter-arm BP difference alone is weaker."},
"whisper-test":{sens:null,spec:null,src:"Bagai 2006 (JAMA RCE)",note:"Pooled LR+ 6, LR− 0.03 (Bagai 2006); individual studies give sens 90–100%, spec 70–87%."},
"egophony":{src:"Metlay 1997 (JAMA RCE)",note:"Across studies LR+ ranges 2.0–8.6."},
"rlq-tender":{src:"Wagner 1996 (JAMA RCE)"},
"alvarado":{src:"Ohle 2011 (BMC Med meta-analysis), score < 5 as rule-out"},
"c-spine-rule":{src:"Stiell 2003 (N Engl J Med)"},
"postural":{src:"McGee 1999 (JAMA RCE)"},
"dry-axilla":{src:"McGee 1999 (JAMA RCE)"}
};
(function(){
  const miss=[];
  Object.entries(SIGN_FIX).forEach(([k,f])=>{const s=SIGNS[k];if(!s){miss.push(k);return;}Object.assign(s,f);});
  if(miss.length)console.warn("SIGN_FIX: unknown ids",miss);
})();
/* shared illustrations for signs that use the same anatomy */
(function(){
  const map={"pivot-shift":"lachman","thessaly":"mcmurray","mulder":"foot","windlass":"foot","ar-murmur":"pulse-shapes","ar-eponyms":"pulse-shapes",
   "tamponade-signs":"pulsus","rebound":"appendix","cough-test":"appendix","heel-drop":"appendix","alvarado":"appendix","puddle":"shifting","cirrhosis-signs":"liver",
   "visual-acuity":"visual-pathway","hyperthyroid-signs":"thyroid","pemberton":"thyroid","hypothyroid-signs":"reflex-arc","finger-nose":"romberg","tandem":"romberg",
   "cardiac-dullness":"percussion","fet":"hoover","paradox-abdomen":"hoover","ultt":"spurling","c-spine-rule":"spurling","cozen":"elbow-ext","froment":"cts",
   "thumb-grind":"finkelstein","flick":"cts","oedema":"jvp","mr-murmur":"heart-cycle","neck-stiffness":"slr","kernig":"slr","patellar-pubic":"hip","ottawa-knee":"effusion",
   "patellar-app":"effusion","speed":"cuff","waddell":"slr","glabellar":"facial"};
  Object.entries(map).forEach(([k,f])=>{if(SIGNS[k]&&!SIGNS[k].fig)SIGNS[k].fig=f;});
})();
