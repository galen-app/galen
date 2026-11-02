"use strict";
/* ================= EVIDENCE CORRECTIONS (independent literature check, 27/10/2026) =================
 Applied after all sign data. `note` is shown on the sign page as an evidence caveat. */
const SIGN_FIX={
/* --- musculoskeletal --- */
"hip-oa":{name:"Hip OA cluster (Sutlive, ≥ 4 of 5 positive)",sens:48,spec:98,p:24.3,n:0.53,v:"useful",note:"One derivation study, never validated (LR+ CI 4.6–145). ≥ 3 of 5: sens 71, spec 86, LR+ 5.2, LR− 0.33. Loss of internal rotation is only one of the five items."},
"elbow-ext":{spec:49,p:1.9,n:0.07,note:"Appelboam 2008 (BMJ), adults and children: sens 97, spec 49. A rule-out test: full extension makes fracture very unlikely."},
"flick":{v:"low",p:1.4,n:0.85,sens:37,spec:74,note:"93/96 came from one 1984 study that was not reproduced; Hansen 2004 found sens 37, spec 74 (LR+ ≈ 1.4)."},
"ankle-drawer":{sens:86,spec:74,p:3.3,n:0.19,note:"The often-quoted 96/84 (van Dijk 1996) is for the whole delayed exam at day 4–5 (tenderness, haematoma and drawer together), not the drawer alone."},
"joint-line":{sens:79,spec:15,p:0.9,n:1.1,v:"low",note:"Solomon 2001 (JAMA) pooled. Hegedus 2007 pooled 63/77; the reviews disagree, and neither makes it a strong test."},
"mcmurray":{name:"McMurray test",sens:71,spec:71,p:2.4,n:0.4,note:"Estimates vary widely: Hegedus 2007 pooled 71/71; Scholten 48/86; Solomon's JAMA summary LR+ 17, LR− 0.5. Positive is more useful than negative."},
"apprehension":{p:17,n:0.39,note:"Hegedus 2012 pooled 66/95. Relocation test pools lower (65/90, LR+ 5.5)."},
"thompson":{p:13.7,n:0.04},
"ottawa-ankle":{p:1.4},
"pulsus-paradoxus":{name:"Pulsus paradoxus > 10 mmHg",sens:82,spec:null,p:3.3,n:0.03,note:"Roy 2007 (JAMA): > 10 mmHg in a known effusion, sens 82%, LR+ 3.3, LR− 0.03; > 12 mmHg raises LR+ to 5.9 at the cost of sensitivity. Absent in tamponade with aortic regurgitation, ASD, raised LV filling pressure or positive-pressure ventilation."},
"lachman":{note:"LR+ ranges 12–25 across reviews (Benjaminse 85/94 implies ≈ 14). All agree it is the best single ACL test."},
"painful-arc":{note:"Hermans 2013 (JAMA) LR+ 3.7, LR− 0.36; Hegedus 2012 pooled lower (53/76)."},
"speed":{note:"For SLAP lesions it is worse: pooled 20/78, LR ≈ 1."},
"lumbar-roots":{p:null,n:null,note:"No pooled source found for a single LR; use the pattern (myotome, reflex, dermatome) rather than a number."},
"patellar-pubic":{n:0.15,note:"Small studies disagree: Adams 1997 ≈ 96/86; Reiman 2013 recalculated 79/95; Tiru 2002 ≈ 94/95. LR− ranges 0.07–0.22."},
"thessaly":{note:"Karachalios 2005 reported 89–92 / 96–97, but independent studies found ≈ 65 sensitivity with poor specificity (39–53)."},
/* --- neurology, head and neck --- */
"chvostek":{sens:71,spec:75,p:2.8,n:0.4,note:"Old, weak data: absent in ≈ 29% of hypocalcaemic patients and present in 10–25% of healthy adults."},
"ct-head-rule":{sens:100,spec:69,p:3.2,n:0.01,target:"need for neurosurgical intervention after minor head injury",note:"Stiell 2001. For clinically important brain injury (all 7 criteria): sens 98, spec 50, LR− ≈ 0.03."},
"glabellar":{n:0.13,v:"low",note:"Rao 2003 LR+ 4.5, LR− 0.13, but with selection bias; against essential tremor it barely discriminates (78/36, LR+ ≈ 1.2)."},
"hints":{sens:97,spec:95,p:18,n:0.03,note:"Ohle 2020 pooled, examiners trained in the test. When emergency physicians performed it: sens 83, spec 44."},
"hyperthyroid-signs":{name:"Thyroid eye signs (lid retraction, lid lag)",sens:34,spec:99,p:31.5,n:0.7,note:"McGee. Lid lag: sens 19, spec 99, LR+ 17.6. Fine tremor and warm moist skin are less specific."},
"visual-fields":{sens:68,spec:93,p:9.7,n:0.34,note:"Johnson & Baloh 1991. Confrontation is poor for anterior (prechiasmal) defects (overall sens 50)."},
"neck-stiffness":{name:"Nuchal rigidity",sens:30,spec:68,p:0.94,n:1.03,note:"Thomas 2002. Jolt accentuation (Cochrane): sens 65, spec 70, LR+ ≈ 2.2, LR− ≈ 0.5, very low certainty."},
"water-swallow":{target:"aspiration on FEES (mixed inpatients)",note:"Suiter 2008: 3,000 patients of all diagnoses, not stroke only."},
"otoscopy":{sens:null,spec:null,n:null,note:"Rothman 2003: bulging drum adjusted LR+ 51. A normal-coloured drum has LR− 0.2."},
"hoover-functional":{n:0.37},
"pronator-drift":{note:"Sensitivity varies widely between studies (22–92%); specificity is consistently 90–100%."},
"ice-pack":{note:"Studies vary (sens 39–100%); specificity is consistently > 95%."},
/* --- cardiovascular, respiratory, abdominal, general --- */
"cap-refill":{target:"hypovolaemia from vomiting/diarrhoea",sens:34,spec:95,p:6.9,n:0.7,note:"One small study (McGee 1999). For blood loss it is useless (LR ≈ 1)."},
"aaa-palp":{target:"AAA ≥ 4 cm",sens:null,spec:null,p:15.6,n:0.51,note:"Lederle 1999: sensitivity 50% for 4–4.9 cm, 76% for ≥ 5 cm; at ≥ 3 cm LR+ 12, LR− 0.72. Obesity defeats it."},
"pedal-pulses":{n:0.38,note:"Khan 2006 (symptomatic patients): any pulse abnormality LR+ 4.7, LR− 0.38."},
"abi":{sens:60,spec:87,p:4.6,n:0.45,note:"Against duplex ultrasound. Older angiography-referenced figures (90/95) overstate it. A normal ABI does not exclude PAD, especially in diabetes and the elderly (calcified arteries)."},
"ar-murmur":{n:0.1},
"ajr":{target:"heart failure in a dyspnoeic ED patient",note:"Wang 2005. For raised left-sided filling pressure McGee gives LR+ 8, LR− 0.3."},
"apex-displaced":{target:"low ejection fraction",p:10.3},
"carotid-bruit":{target:"severe stenosis in a symptomatic patient",sens:63,spec:61,p:1.6,n:0.6,v:"low",note:"Sauvé 1994 (NASCET). In asymptomatic patients a bruit does not predict the degree of stenosis."},
"cremasteric":{sens:null,spec:null,p:null,n:null,note:"Sensitivity 70–100% across series (newer 70–81%), specificity 66–94%. A present reflex does not exclude torsion: scan or explore if the story fits."},
"conj-pallor":{name:"Conjunctival pallor",target:"Hb ≤ 9 g/dL",p:4.5,n:0.61,note:"Sheth 1997. True rim pallor (anterior rim as pale as the posterior) is more specific."},
"percussion-dull":{target:"pleural effusion",p:8.7,n:0.31,note:"Wong 2009. For consolidation dullness is weaker (LR+ ≈ 3)."},
"crackles":{target:"heart failure (dyspnoeic patient)",note:"Wang 2005. For pneumonia crackles have LR+ ≈ 1.6–2.7."},
"abd-bruit":{name:"Systolic–diastolic abdominal bruit",note:"Turnbull 1995: LR+ 39 applies only to bruits with a diastolic component; any bruit is LR+ ≈ 4–5."},
"wells-pe":{name:"PERC rule (low pretest probability of PE)",note:"Singh 2012. PERC negative in a low-gestalt patient makes PE unlikely enough to skip D-dimer. Wells score is the separate first step."},
"valsalva-murmur":{name:"Valsalva response of a systolic murmur",note:"Lembo 1988, for HOCM. Squat-to-stand: sens 95, spec 84, LR+ 6, LR− 0.1."},
"heel-drop":{target:"appendicitis",spec:null,note:"Markle 1973; specificity not reported."},
"jvp":{target:"heart failure in a dyspnoeic patient",note:"Wang 2005 figures."},
"fluid-wave":{note:"Sensitivity 50–80% across studies; the positive LR is what matters."},
"wheeze":{note:"Holleman 1993 found auscultated wheeze LR+ 12, LR− 0.87 for airflow obstruction; pooled JAMA review value is lower."},
"qsofa":{note:"Song 2018: sens 51, spec 83. Fernando 2018: 61/72. Poor as a screening rule-out."},
"bp-arms":{note:"Klompas: the LR+ applies to a pulse deficit. Inter-arm BP difference alone is weaker."}
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
