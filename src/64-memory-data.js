"use strict";
/* ================= REMEMBER IT FOREVER =================
 Evidence-based memory methods, an examination-route memory palace and checked mnemonics. */
const MEMORY={
 intro:"Forgetting is the default: without review, most of what you learn today is gone within weeks (Ebbinghaus's forgetting curve, 1885, replicated by Murre and Dros in 2015). The way out is not more reading but four habits used together: pull it out of memory, space it, understand why, and attach it to a picture and a place.",
 rules:[
  {t:"Retrieve, don't reread",d:"Trying to recall an answer strengthens memory far more than looking at it again. In Karpicke and Roediger's study (Science 2008), students who kept testing themselves recalled about 80% a week later; those who kept restudying recalled about 35%. Medical residents taught with repeated tests remembered more at 6 months than those who restudied (Larsen, 2009).",how:"Use 'What to think' cards: cover the answer, say it out loud, then check. Getting it wrong first and then seeing the answer still helps."},
  {t:"Space it, expanding the gaps",d:"Reviews spread out beat the same time massed together, and the best gap grows with how long you want to remember (Cepeda et al., Psychological Science 2008: for a test a year away, a gap of about 3 weeks worked best). Each successful recall lets you wait longer.",how:"The daily session schedules this for you: about 1, 3, 7, 16, 35 days, then months. Ten minutes a day beats an hour on Sunday."},
  {t:"Ask why (elaborate)",d:"Facts linked to a reason survive; isolated facts decay. Explaining why a sign works (the mechanism) creates many routes back to it. This is the reason every sign in the app has 'Why it works' and anatomy.",how:"Before reading 'Why it works', guess the mechanism. Then check."},
  {t:"Picture and words together (dual coding)",d:"Information stored both as words and as an image has two retrieval routes (Paivio's dual coding). Anatomy is spatial: draw it.",how:"After opening an illustration, close it and sketch it from memory on paper in 30 seconds."},
  {t:"Put it in a place (method of loci)",d:"Memory athletes use places. In a Neuron study (Dresler et al., 2017), ordinary people who trained the method of loci for 6 weeks more than doubled their word-list recall, and kept most of the gain 4 months later.",how:"Use the examination itself as your palace: the route below pins every sign to the place on the body where you will look for it."},
  {t:"Mix it up (interleave)",d:"Practising similar things side by side (S3 then S4, Lachman then anterior drawer) teaches you the difference; blocks of one type feel easier but transfer worse (Hatala et al., 2003, for ECG interpretation).",how:"Sessions are mixed on purpose. Use Compare for sounds and the 'Same target' links for signs."},
  {t:"Make it vivid and strange",d:"Bizarre, emotional, physical images stick (distinctiveness: the von Restorff isolation effect and the bizarreness effect). A mnemonic only works if you also know what each letter means, so use it as a hook, not a substitute.",how:"Read the memory hook on each sign page and picture it for 5 seconds."},
  {t:"Teach it, then test it on patients",d:"Expecting to teach improves how you organise and recall what you learn (Nestojko et al., 2014); actually explaining it adds retrieval practice on top. Using a finding on a real patient and checking it against imaging or the final diagnosis gives the feedback that stops your skill plateauing.",how:"Explain one sign a day to a student or nurse. Log your findings in the Bedside log and verify them."},
  {t:"Sleep on it",d:"Memories are consolidated during sleep; a short review before sleep and a retrieval the next morning is an efficient pair.",how:"Do the session in the evening, then rehearse the routine in your head on the way to work (mental rehearsal)."}
 ],
 palace:[
  ["From the door","Before touching: general appearance, distress, work of breathing, colour (pallor, cyanosis, jaundice), Kussmaul breathing, posture, gait as they walk in, monitors and fluids.",["resp-rate","kussmaul-breathing","cyanosis","jaundice","bradykinesia"]],
  ["Hands","Clubbing, capillary refill, asterixis, temperature, splinter haemorrhages and Janeway lesions, palmar erythema, Dupuytren's, tremor, small hand muscle wasting.",["clubbing","cap-refill","asterixis","endocarditis-stigmata","cirrhosis-signs"]],
  ["Wrist and pulse","Rate, rhythm (irregularly irregular), character, radio-femoral delay, both radials together (dissection).",["irregular-pulse","radio-femoral","bp-arms"]],
  ["Arm and blood pressure","Both arms, postural readings, pulsus paradoxus with the cuff.",["postural","pulsus-paradoxus","shock-index"]],
  ["Eyes and face","Conjunctival pallor, scleral icterus, pupils (RAPD, Horner's), xanthelasma, facial symmetry, Battle's sign and raccoon eyes after trauma.",["conj-pallor","rapd","horner","facial-palsy","battle"]],
  ["Neck","JVP and abdominojugular reflux, carotid upstroke and bruit, trachea, nodes, thyroid, neck stiffness.",["jvp","ajr","carotid-upstroke","tracheal-deviation","lymph-supraclav","neck-stiffness"]],
  ["Front of chest","Apex, heaves, heart sounds at the four areas, extra sounds and murmurs with manoeuvres.",["apex-displaced","s3","s4","ar-murmur","mr-murmur","valsalva-murmur"]],
  ["Back of chest","Expansion, percussion, fremitus, breath sounds, crackles, egophony; renal angles.",["chest-expansion","percussion-dull","egophony","crackles","cva"]],
  ["Abdomen","Inspection (Cullen, Grey Turner), McBurney's point, Rovsing, Murphy, liver and spleen, aorta, shifting dullness, Carnett.",["rlq-tender","rovsing","murphy","aaa-palp","shifting-dullness","carnett"]],
  ["Legs","Oedema, calf (Wells), pulses and ABI, reflexes and plantars, straight leg raise.",["oedema","wells-dvt","pedal-pulses","babinski","slr"]],
  ["Standing and walking","Romberg, tandem, Trendelenburg, gait patterns; HINTS and Dix–Hallpike if dizzy.",["romberg","tandem","trendelenburg","hints","dix-hallpike"]]
 ]
};
/* checked mnemonics: [topic, mnemonic, meaning, sign ids it belongs to] */
const MNEMONICS=[
 ["Beck's triad (tamponade)","The three Ds","Distended neck veins, Distant (muffled) heart sounds, Decreased blood pressure. All three together in fewer than half of cases: use POCUS.",["tamponade-signs","pulsus-paradoxus"]],
 ["S3 and S4 rhythm","Ken-TUC-ky and TEN-nes-see","S3 after S2: 'Ken-tuc-KY' (S1–S2–S3). S4 before S1: 'TEN-nes-see' (S4–S1–S2).",["s3","s4"]],
 ["Which murmurs are diastolic","ARMS","Aortic Regurgitation and Mitral Stenosis are diastolic; the rest you'll meet are usually systolic.",["ar-murmur","mr-murmur"]],
 ["Right-sided murmurs","LIRE","Left-sided murmurs louder on Expiration, Right-sided louder on Inspiration (Carvallo's sign for tricuspid regurgitation).",["mr-murmur"]],
 ["Horner's syndrome","PAM","Ptosis (mild), Anhidrosis, Miosis; plus apparent enophthalmos. Painful acute Horner's = carotid dissection until proven otherwise.",["horner"]],
 ["Glasgow Coma Scale","4 eyes, 5 words, 6 moves","Eyes 1–4, Verbal 1–5, Motor 1–6; total 3–15. Report the parts, not just the sum.",["gcs"]],
 ["Cushing's reflex (raised ICP)","High, slow, irregular","Hypertension with wide pulse pressure, bradycardia, irregular breathing: late sign of herniation.",["gcs"]],
 ["Meningism","Kernig = Knee, Brudzinski = Bend the neck","Kernig: extending the knee with the hip flexed hurts. Brudzinski: flexing the neck makes the hips and knees flex. Both are insensitive: don't use them to rule out meningitis.",["kernig","neck-stiffness"]],
 ["Appendicitis signs","Rovsing: press Left, hurts Right","Psoas: extend the right hip (patient on the left side). Obturator: internally rotate the flexed right hip. Each is specific but insensitive.",["rovsing","psoas","obturator","rlq-tender"]],
 ["Murphy's sign","Murphy stops the breath","The breath catches when the descending gallbladder meets your fingers. Often negative in the elderly.",["murphy"]],
 ["Tracheal deviation","Push and pull","Pushed away: tension pneumothorax, massive effusion. Pulled toward: collapse, pneumonectomy, upper-lobe fibrosis.",["tracheal-deviation"]],
 ["Asterixis causes","Liver, lungs, kidneys","Hepatic encephalopathy, CO₂ retention, uraemia; also drugs (phenytoin, lithium).",["asterixis"]],
 ["Babinski","Babies have Babinskis","Extensor plantars are normal under about 1 year; after that they mean an upper motor neuron lesion.",["babinski"]],
 ["Carpal tunnel tests","Tinel taps, Phalen flexes","Tinel: tap over the median nerve. Phalen: hold full wrist flexion for 60 s. Both are weak; the flick sign and hypalgesia in the median territory help more.",["tinel-wrist","phalen","cts-hypalgesia","flick"]],
 ["Rotator cuff","SITS","Supraspinatus (empty can), Infraspinatus and Teres minor (external rotation), Subscapularis (lift-off, belly press).",["empty-can","er-lag","lift-off","drop-arm"]],
 ["Carpal bones","Some Lovers Try Positions That They Can't Handle","Proximal row lateral to medial: Scaphoid, Lunate, Triquetrum, Pisiform; distal row: Trapezium, Trapezoid, Capitate, Hamate.",["scaphoid"]],
 ["Brachial plexus","Randy Travis Drinks Cold Beer","Roots, Trunks, Divisions, Cords, Branches.",[]],
 ["Trendelenburg","The sound side sags","Stand on the bad leg: the pelvis drops on the opposite (sound) side because the stance-side gluteus medius is weak.",["trendelenburg"]],
 ["Unhappy triad","Twist, pop, swell","ACL, MCL and meniscus together after a valgus twisting injury (lateral meniscus is now known to be at least as common as medial in acute tears).",["lachman","valgus-stress","mcmurray"]],
 ["Ottawa ankle","Back edge, tip, navicular, five, four steps","Posterior edge or tip of either malleolus (distal 6 cm), navicular, base of 5th metatarsal, or can't take 4 steps.",["ottawa-ankle"]],
 ["Canadian C-spine rule","High risk, low risk, rotate","Any high-risk factor (age ≥ 65, dangerous mechanism, limb paraesthesia) = image. Otherwise if a low-risk factor allows assessment and they can actively rotate 45° each way, no imaging.",["c-spine-rule"]],
 ["Cauda equina","S2, 3, 4 keep the pee and poo off the floor","Saddle numbness, bladder or bowel change, sexual dysfunction, bilateral sciatica: emergency MRI.",["cauda"]],
 ["NEWS2 parameters","Six plus oxygen","Respiratory rate, SpO₂ (scale 1 or 2), air or oxygen, systolic BP, pulse, consciousness (ACVPU), temperature.",["news2"]],
 ["CURB-65","Confusion, Urea, RR, BP, 65","Confusion, urea > 7 mmol/L, RR ≥ 30, SBP < 90 or DBP ≤ 60, age ≥ 65.",["curb65"]],
 ["Hip OA (Sutlive)","Lost IR, painful squat, groin on flexion","Items: squatting aggravates, active hip flexion causes lateral hip pain, scour test with adduction causes lateral hip or groin pain, active hip extension causes pain, passive internal rotation ≤ 25°.",["hip-oa"]]
];
