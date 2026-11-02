"use strict";
/* ================= NEURO DATA: dermatomes, peripheral nerves, myotomes, reflexes, localisation =================
 Body geometry: two views (front, back) in a 460×470 viewBox; each limb is a strip of horizontal cross-sections
 [y, lateral x, medial x] for the image-left limb, mirrored for the other side. Regions are (t0,t1,s0,s1) boxes along a strip:
 t = proportion down the strip, s = 0 lateral edge → 1 medial edge. Sources: ISNCSCI 2019 key sensory points and key muscles
 (ASIA); evidence-based dermatome map (Lee et al., Clin Anat 2008) — dermatomes overlap and vary, so test the key points. */
const BODY={
  W:220,
  trunk:[[52,101,119],[74,101,119],[74,70,150],[100,72,148],[150,78,142],[200,80,140],[235,74,146],[262,76,144]],
  arm:[[80,48,70],[104,46,68],[170,40,60],[245,34,52]],
  hand:[[245,34,52],[300,33,53]],
  thigh:[[244,76,108],[340,84,106]],
  leg:[[340,84,106],[425,90,104]],
  foot:[[425,86,106],[452,84,108]],
  head:{cx:110,cy:32,rx:19,ry:24}
};
/* Dermatome regions. side: "f" front, "b" back, "fb" both. part: trunk(y-band)|arm|hand|thigh|leg|foot|head|neck */
const DERM=[
 ["V1","f","head",[8,30]],["V2","f","head",[30,43]],["V3","f","head",[43,56]],
 ["C2","b","head",[18,56]],["V1","b","head",[8,18]],
 ["C3","fb","trunk",[52,76]],["C4","fb","trunk",[76,94]],["C4","fb","arm",[0,.05,0,1]],
 ["C5","fb","arm",[.05,.42,0,.55]],["C5","fb","arm",[.42,.48,0,.4]],
 ["T2","fb","arm",[.05,.25,.55,1]],["T1","fb","arm",[.25,.6,.55,1]],
 ["C6","fb","arm",[.48,1,0,.42]],["C7","fb","arm",[.6,1,.42,.58]],["C8","fb","arm",[.6,1,.58,1]],["T1","fb","arm",[.42,.6,.42,1]],
 ["C6","fb","hand",[0,1,0,.3]],["C7","fb","hand",[0,1,.3,.62]],["C8","fb","hand",[0,1,.62,1]],
 ["T2","fb","trunk",[94,104]],["T3","fb","trunk",[104,116]],["T4","fb","trunk",[116,128]],["T5","fb","trunk",[128,140]],["T6","fb","trunk",[140,152]],
 ["T7","fb","trunk",[152,164]],["T8","fb","trunk",[164,176]],["T9","fb","trunk",[176,188]],["T10","fb","trunk",[188,202]],["T11","fb","trunk",[202,214]],["T12","fb","trunk",[214,228]],
 ["L1","f","trunk",[228,262]],["L1","b","trunk",[228,238]],["L2","b","trunk",[238,248]],["L3","b","trunk",[248,262]],
 ["L1","f","thigh",[0,.12,0,1]],["L2","f","thigh",[.12,.55,0,1]],["L3","f","thigh",[.55,1,0,1]],
 ["L4","f","leg",[0,1,.48,1]],["L5","f","leg",[0,1,0,.48]],
 ["S1","f","foot",[0,1,0,.2]],["L5","f","foot",[0,1,.2,.78]],["L4","f","foot",[0,1,.78,1]],
 ["S2","b","thigh",[0,1,.3,.7]],["S2","b","leg",[0,.65,.3,.6]],["L4","b","leg",[0,1,.6,1]],["S1","b","leg",[0,1,0,.3]],["S1","b","leg",[.65,1,.3,.6]],["S1","b","foot",[0,1,0,1]]
];
/* special back regions drawn as circles: S3 (medial buttock), S4–5 (perianal) */
const DERM_EXTRA=[["S3","b",[[96,256,11]]],["S4–5","b",[[110,258,5]]]];
const DERM_INFO={
 V1:{n:"Trigeminal V1 (ophthalmic)",d:"Forehead, upper eyelid, bridge and tip of nose, scalp to the vertex.",w:"The tip of the nose is supplied by V1 (external nasal branch of the nasociliary nerve): vesicles there in shingles (Hutchinson's sign) predict eye involvement."},
 V2:{n:"Trigeminal V2 (maxillary)",d:"Cheek, lower eyelid, side of nose, upper lip, upper teeth.",w:"Numb cheek after facial trauma: think orbital floor fracture with infraorbital nerve injury."},
 V3:{n:"Trigeminal V3 (mandibular)",d:"Lower lip, chin, lower jaw and anterior ear; spares the angle of the jaw.",w:"The angle of the jaw is C2/C3 (great auricular nerve). Numbness there with 'trigeminal' loss suggests a functional or non-anatomical pattern."},
 C2:{n:"C2",d:"Back of the head (greater occipital nerve) and angle of the jaw.",k:"At least 1 cm lateral to the occipital protuberance.",w:"Occipital neuralgia; C1 has no useful dermatome."},
 C3:{n:"C3",d:"Neck, front and back.",k:"Supraclavicular fossa, at the midclavicular line.",w:"C3–5 keep the diaphragm alive: a cord lesion at this level threatens breathing."},
 C4:{n:"C4",d:"A cape over the shoulders and upper chest down to about the 2nd rib.",k:"Over the acromioclavicular joint.",w:"Anteriorly C4 abuts T2: C5–T1 have migrated into the arm. A sensory level just below the clavicle is therefore C4/T2, not 'C5'."},
 C5:{n:"C5",d:"Lateral (radial) side of the upper arm.",k:"Lateral side of the antecubital fossa, just proximal to the elbow crease.",w:"Pairs with deltoid and biceps (shoulder abduction, elbow flexion) and the biceps reflex."},
 C6:{n:"C6",d:"Lateral forearm, thumb and index finger.",k:"Dorsal surface of the proximal phalanx of the thumb.",w:"Make a '6' with thumb and index finger. C6 radiculopathy (C5/6 disc): thumb paraesthesia, weak wrist extension, reduced brachioradialis/biceps reflex."},
 C7:{n:"C7",d:"Middle finger and a strip of the back of the forearm.",k:"Dorsal surface of the proximal phalanx of the middle finger.",w:"Most common cervical radiculopathy (C6/7 disc): middle finger, weak triceps, reduced triceps reflex."},
 C8:{n:"C8",d:"Ring and little fingers and the medial forearm.",k:"Dorsal surface of the proximal phalanx of the little finger.",w:"C8 vs ulnar nerve: C8 also numbs the medial forearm and weakens median-supplied long flexors (FDP index, FPL)."},
 T1:{n:"T1",d:"Medial forearm and elbow.",k:"Medial side of the antecubital fossa, just proximal to the medial epicondyle.",w:"T1 with Horner's and small hand muscle wasting: Pancoast tumour or lower trunk plexopathy."},
 T2:{n:"T2",d:"Medial upper arm, axilla and upper chest below C4.",k:"Apex of the axilla.",w:"Intercostobrachial nerve (T2) is often cut in axillary surgery: numb inner arm."},
 T3:{n:"T3",d:"Chest band at the 3rd intercostal space.",k:"Midclavicular line, 3rd intercostal space."},
 T4:{n:"T4",d:"Band at the nipples.",k:"4th intercostal space (nipple line), midclavicular line.",w:"T4 = 'T4 at the teat'."},
 T5:{n:"T5",d:"Band below the nipples.",k:"5th intercostal space, midclavicular line."},
 T6:{n:"T6",d:"Band at the xiphisternum.",k:"Level of the xiphisternum, midclavicular line.",w:"Lesions at or above T6 risk autonomic dysreflexia."},
 T7:{n:"T7",d:"Band at the costal margin.",k:"Midclavicular line, midway between T6 and T8."},
 T8:{n:"T8",d:"Upper abdomen.",k:"Midclavicular line, midway between T6 and T10."},
 T9:{n:"T9",d:"Abdomen above the umbilicus.",k:"Midclavicular line, midway between T8 and T10."},
 T10:{n:"T10",d:"Band at the umbilicus.",k:"Midclavicular line, at the umbilicus.",w:"'T10 = belly butTEN'. Periumbilical pain of early appendicitis is T10 visceral pain (midgut)."},
 T11:{n:"T11",d:"Lower abdomen below the umbilicus.",k:"Midclavicular line, midway between T10 and T12."},
 T12:{n:"T12",d:"Just above the inguinal ligament.",k:"Midclavicular line, at the midpoint of the inguinal ligament."},
 L1:{n:"L1",d:"Groin and upper anterior thigh; upper buttock behind.",k:"Midway between the T12 and L2 points.",w:"'L1 = in the groin, where the 'one' underwear line lies'. Cremasteric reflex afferent."},
 L2:{n:"L2",d:"Anterior and medial thigh.",k:"Anterior–medial thigh, midway between the midpoint of the inguinal ligament and the medial femoral condyle."},
 L3:{n:"L3",d:"Lower anterior thigh to the medial knee.",k:"Medial femoral condyle above the knee.",w:"L3/L4 radiculopathy mimics meralgia or knee pain: check quadriceps and the knee jerk."},
 L4:{n:"L4",d:"Medial leg to the medial malleolus and medial foot.",k:"Medial malleolus.",w:"'L4: down on all fours, knees to the floor' — L4 is the knee: knee jerk, quadriceps, medial shin."},
 L5:{n:"L5",d:"Lateral leg, dorsum of the foot and big toe.",k:"Dorsum of the foot at the 3rd metatarsophalangeal joint.",w:"'L5: the 5 toes on the top of the foot'. L5 root (L4/5 disc) weakens big toe extension and also ankle inversion and hip abduction — common peroneal palsy spares those two."},
 S1:{n:"S1",d:"Lateral foot, sole and heel; posterolateral calf.",k:"Lateral heel (calcaneus).",w:"'S1: stand on the 1 sole'. S1 root (L5/S1 disc): ankle jerk lost, weak plantar flexion (can't tiptoe), lateral foot numb."},
 S2:{n:"S2",d:"Strip down the back of the thigh and calf.",k:"Midpoint of the popliteal fossa."},
 S3:{n:"S3",d:"Medial buttock.",k:"Ischial tuberosity or infragluteal fold."},
 "S4–5":{n:"S4–5",d:"Perianal skin (saddle).",k:"Perianal area, less than 1 cm lateral to the mucocutaneous junction.",w:"S4–5 light touch and pin prick, deep anal pressure and voluntary anal contraction decide 'complete vs incomplete' cord injury and flag cauda equina. 'S2, 3, 4 keep the pee and poo off the floor.'"}
};
const DERM_ORDER=["V1","V2","V3","C2","C3","C4","C5","C6","C7","C8","T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12","L1","L2","L3","L4","L5","S1","S2","S3","S4–5"];
/* ISNCSCI key sensory points: [root, view, part, t, s] (trunk: [root,view,"trunk",y,xFromMidline]) */
const KEYPTS=[
 ["C2","b","headpt",30,9],["C3","f","trunk",72,24],["C4","f","arm",.02,.45],["C5","f","arm",.45,.12],["T1","f","arm",.45,.9],["T2","f","arm",.04,.97],
 ["C6","b","hand",.62,.1],["C7","b","hand",.72,.46],["C8","b","hand",.62,.88],
 ["T3","f","trunk",110,22],["T4","f","trunk",124,22],["T5","f","trunk",134,22],["T6","f","trunk",146,22],["T7","f","trunk",158,22],["T8","f","trunk",170,22],["T9","f","trunk",182,22],["T10","f","trunk",195,22],["T11","f","trunk",208,22],["T12","f","trunk",221,20],["L1","f","trunk",236,18],
 ["L2","f","thigh",.5,.75],["L3","f","thigh",.92,.92],["L4","f","leg",.97,.95],["L5","f","foot",.62,.5],["S1","b","foot",.55,.15],["S2","b","thigh",.98,.5],["S3","b","pt",262,98],["S4–5","b","pt",258,110]
];
/* Peripheral nerve cutaneous territories */
const NERVES=[
 ["ax","fb","arm",[.06,.34,0,.48]],["lcnf","f","arm",[.48,1,0,.45]],["lcnf","b","arm",[.48,1,0,.3]],["mcnf","fb","arm",[.48,1,.56,1]],["mcna","fb","arm",[.06,.46,.6,1]],
 ["pcnf","b","arm",[.48,1,.3,.56]],["pcna","b","arm",[.3,.46,.2,.55]],
 ["median","f","hand",[0,1,0,.68]],["ulnar","f","hand",[0,1,.68,1]],["radial","b","hand",[0,.62,0,.62]],["median","b","hand",[.62,1,0,.62]],["ulnar","b","hand",[0,1,.62,1]],
 ["lcnt","f","thigh",[.06,.7,0,.34]],["femoral","f","thigh",[.1,.96,.34,.8]],["obturator","f","thigh",[.3,.72,.8,1]],["pcnt","b","thigh",[.04,1,.18,.82]],["lcnt","b","thigh",[.06,.5,0,.18]],
 ["saphenous","f","leg",[0,1,.55,1]],["saphenous","b","leg",[0,1,.72,1]],["lccalf","fb","leg",[0,.38,0,.4]],["supper","f","leg",[.38,1,0,.55]],["sural","b","leg",[.4,1,0,.4]],
 ["supper","f","foot",[0,1,.2,.72]],["deeper","f","foot",[.45,1,.72,.88]],["sural","f","foot",[0,1,0,.2]],["saphenous","f","foot",[0,.5,.88,1]],["tibial","b","foot",[0,1,.3,1]],["sural","b","foot",[0,1,0,.3]]
];
const NERVE_INFO={
 ax:{n:"Axillary nerve (C5–6)",d:"'Regimental badge' patch over the lower deltoid.",w:"Test it after every shoulder dislocation, before and after reduction. Deltoid weakness is hard to judge in pain, so the patch is the practical check."},
 lcnf:{n:"Lateral cutaneous nerve of forearm (musculocutaneous, C5–6)",d:"Lateral forearm.",w:"Overlaps C6. Isolated injury is rare (biceps tendon surgery, venepuncture at the cubital fossa)."},
 mcnf:{n:"Medial cutaneous nerve of forearm (medial cord, C8–T1)",d:"Medial forearm.",w:"Ulnar neuropathy spares the medial forearm; C8 root or lower plexus lesions don't. That single area separates them."},
 mcna:{n:"Medial cutaneous nerve of arm and intercostobrachial (T1–2)",d:"Medial upper arm.",w:"Numb after axillary surgery."},
 pcnf:{n:"Posterior cutaneous nerve of forearm (radial)",d:"Back of the forearm.",w:"Spared in a posterior interosseous nerve palsy (motor only)."},
 pcna:{n:"Posterior cutaneous nerve of arm (radial)",d:"Back of the upper arm.",w:"Arises in the axilla, so it is spared in a mid-shaft humerus (spiral groove) radial palsy."},
 median:{n:"Median nerve (C6–T1)",d:"Palm and palmar lateral three and a half fingers; dorsal fingertips of the same fingers.",w:"Carpal tunnel spares the thenar eminence skin (palmar cutaneous branch leaves before the tunnel). Thenar numbness points above the wrist."},
 ulnar:{n:"Ulnar nerve (C8–T1)",d:"Medial one and a half fingers, front and back, and the medial hand.",w:"Splits the ring finger exactly; C8 root loss does not split it and includes the medial forearm. Dorsal hand sensation lost = lesion above the wrist (dorsal branch leaves 5 cm proximal)."},
 radial:{n:"Superficial radial nerve (C6–7)",d:"Dorsum of the first web space and lateral dorsal hand.",w:"Wrist drop with a numb first dorsal web space: radial nerve at the spiral groove ('Saturday night palsy'). Wrist drop without sensory loss: posterior interosseous nerve. Handcuffs compress the superficial branch (cheiralgia paraesthetica)."},
 lcnt:{n:"Lateral cutaneous nerve of thigh (L2–3)",d:"Lateral thigh.",w:"Meralgia paraesthetica: burning lateral thigh, no weakness, normal knee jerk (tight belts, obesity, pregnancy). Weakness or reflex change means it is not meralgia."},
 femoral:{n:"Femoral nerve, anterior cutaneous branches (L2–4)",d:"Anterior and anteromedial thigh.",w:"Femoral neuropathy (retroperitoneal haematoma on anticoagulants, hip surgery): weak knee extension, lost knee jerk, but hip adduction spared (obturator). Weak adduction too means L3/4 root or plexus."},
 obturator:{n:"Obturator nerve (L2–4)",d:"Small patch on the medial thigh.",w:"Obturator hernia pain down the medial thigh to the knee (Howship–Romberg sign), classically in thin elderly women."},
 pcnt:{n:"Posterior cutaneous nerve of thigh (S1–3)",d:"Back of the thigh and popliteal fossa."},
 saphenous:{n:"Saphenous nerve (femoral, L3–4)",d:"Medial leg and medial foot to the first metatarsophalangeal joint.",w:"Injured in varicose vein surgery and long saphenous vein harvest."},
 lccalf:{n:"Lateral cutaneous nerve of calf (common peroneal)",d:"Upper lateral leg.",w:"Common peroneal compression at the fibular head (crossed legs, plaster casts, weight loss, prolonged squatting)."},
 supper:{n:"Superficial peroneal (fibular) nerve (L4–S1)",d:"Lower lateral leg and most of the dorsum of the foot.",w:"Its loss with weak eversion: lesion at or above the fibular neck."},
 deeper:{n:"Deep peroneal (fibular) nerve (L4–5)",d:"Only the first dorsal web space.",w:"Foot drop with numbness confined to the first web space: deep peroneal (anterior compartment syndrome). Tight boots compress it at the ankle (anterior tarsal tunnel): first web numbness without foot drop."},
 sural:{n:"Sural nerve (S1–2)",d:"Posterolateral calf and lateral edge of the foot.",w:"The nerve taken for nerve biopsy; length-dependent neuropathy starts in its territory."},
 tibial:{n:"Tibial nerve (L4–S3): medial and lateral plantar, calcaneal branches",d:"Sole of the foot and heel.",w:"Tarsal tunnel syndrome: burning sole, heel often spared (calcaneal branch can leave early)."}
};
/* ISNCSCI key muscles + other useful myotomes */
const MYO=[
 ["C5","Elbow flexors (biceps, brachialis)","Shoulder abduction (deltoid) is also C5","Biceps reflex (C5–6)"],
 ["C6","Wrist extensors (extensor carpi radialis)","Also forearm supination","Brachioradialis reflex (C5–6)"],
 ["C7","Elbow extensors (triceps)","Also wrist flexion, finger extension","Triceps reflex (C7)"],
 ["C8","Finger flexors (FDP to middle finger)","Grip; thumb flexion (FPL)","Finger jerk (C8)"],
 ["T1","Small finger abductors (abductor digiti minimi)","All intrinsic hand muscles (interossei, APB)","—"],
 ["L2","Hip flexors (iliopsoas)","Also hip adduction (L2–4)","Cremasteric (L1–2)"],
 ["L3","Knee extensors (quadriceps)","Hip adduction","Knee jerk (L3–4)"],
 ["L4","Ankle dorsiflexors (tibialis anterior)","Ankle inversion (tibialis posterior, L4–5)","Knee jerk (L4)"],
 ["L5","Long toe extensors (extensor hallucis longus)","Hip abduction (gluteus medius), ankle inversion","Medial hamstring (L5), unreliable"],
 ["S1","Ankle plantar flexors (gastrocnemius, soleus)","Hip extension (gluteus maximus), foot eversion (S1)","Ankle jerk (S1–2)"],
 ["S2–4","External anal sphincter (voluntary contraction)","Bladder, bowel, erectile function","Anal wink, bulbocavernosus (S2–4)"]
];
const REFLEX=[
 ["Biceps","C5–6","Tap your thumb on the biceps tendon at the elbow crease","Brisk with UMN lesion above C5; reduced in C5/6 radiculopathy"],
 ["Brachioradialis (supinator)","C5–6","Tap the distal radius (brachioradialis tendon) about 5 cm above the wrist","'Inverted supinator': finger flexion with absent brachioradialis jerk = C5/6 cord compression (myelopathy)"],
 ["Triceps","C7","Tap the triceps tendon above the olecranon, forearm hanging","Lost in C7 radiculopathy (the commonest)"],
 ["Finger jerk / Hoffmann","C8","Flick the middle finger's distal phalanx; watch the thumb","Hoffmann's present suggests cervical cord compression, but is found in some healthy people"],
 ["Abdominal","T8–12","Stroke each quadrant toward the umbilicus","Absent early in MS; often absent after surgery, obesity, pregnancy"],
 ["Cremasteric","L1–2","Stroke the inner thigh","Absent in most torsions"],
 ["Knee (patellar)","L3–4","Tap the patellar tendon, legs dangling","Lost in L4 radiculopathy, femoral neuropathy, diabetic neuropathy"],
 ["Ankle (Achilles)","S1–2","Dorsiflex slightly, tap the tendon; kneeling on a chair if hard to get","Lost in S1 radiculopathy and length-dependent neuropathy; absent in many healthy over-80s; slow relaxation in hypothyroidism"],
 ["Plantar","L5–S1 (corticospinal)","Stroke lateral sole","Extensor = UMN lesion"],
 ["Anal wink / bulbocavernosus","S2–4","Scratch perianal skin; squeeze the glans or tug a catheter","Return of the bulbocavernosus reflex traditionally marks the end of spinal shock (it often returns within 1–3 days)"]
];
/* Root or nerve? Common bedside dilemmas */
const ROOTNERVE=[
 {q:"Foot drop",a:"L5 radiculopathy",b:"Common peroneal palsy at the fibular head",key:"Test ankle inversion (tibialis posterior, tibial nerve) and hip abduction (gluteus medius, superior gluteal nerve). Both weak = L5 root. Both normal = peroneal nerve. Pain from the back and a positive straight leg raise favour the root.",also:"Sciatic nerve (inversion and plantar flexion weak too), lumbosacral plexus, motor neuron disease (painless, fasciculations), stroke (UMN signs)."},
 {q:"Wrist drop",a:"C7 radiculopathy",b:"Radial nerve at the spiral groove",key:"Triceps: weak in C7, spared in a spiral-groove radial palsy (branches leave above it). Wrist flexion (median, C7) weak in C7 only. Brachioradialis: weak in radial palsy (C5–6 but radial nerve).",also:"Posterior interosseous nerve (finger drop, wrist extends with radial deviation, no sensory loss); stroke (pseudo-wrist drop with UMN signs)."},
 {q:"Weak, wasted hand with numb little finger",a:"C8 root or lower trunk",b:"Ulnar neuropathy at the elbow",key:"Sensation: ulnar splits the ring finger and spares the medial forearm; C8 doesn't split it and includes the medial forearm (medial cutaneous nerve of forearm). Muscles: abductor pollicis brevis and FPL/FDP index (median) are weak in C8/T1, normal in ulnar palsy.",also:"Pancoast tumour (Horner's + T1), thoracic outlet, motor neuron disease ('split hand': thenar more wasted than hypothenar)."},
 {q:"Numb thumb and index finger",a:"C6 radiculopathy",b:"Carpal tunnel syndrome (median)",key:"Neck pain radiating, weak wrist extension and elbow flexion, reduced biceps/brachioradialis reflex = C6. Night symptoms relieved by shaking, thenar eminence spared, positive flick/hypalgesia = carpal tunnel. They can coexist ('double crush').",also:"Superficial radial nerve (dorsal only, handcuffs, tight watch strap)."},
 {q:"Weak knee extension, lost knee jerk",a:"L3/L4 radiculopathy",b:"Femoral neuropathy",key:"Hip adduction (obturator, L2–4): weak in root or plexus lesions, normal in femoral neuropathy. Anticoagulated patient with groin or flank pain: iliopsoas haematoma compressing the femoral nerve.",also:"Diabetic lumbosacral radiculoplexus neuropathy (amyotrophy): thigh pain, weight loss, proximal weakness."},
 {q:"Burning lateral thigh",a:"L2/L3 radiculopathy",b:"Meralgia paraesthetica (lateral cutaneous nerve of thigh)",key:"Meralgia is purely sensory: no weakness, normal knee jerk, often a positive pelvic compression or tenderness medial to the ASIS.",also:"Hip pathology, trochanteric pain (tender greater trochanter)."},
 {q:"Shoulder weakness after dislocation",a:"C5 root avulsion / upper trunk",b:"Axillary nerve",key:"Check the regimental badge patch. Weak deltoid with weak supraspinatus/infraspinatus and biceps = upper trunk or C5; deltoid alone = axillary nerve. In older patients, weakness after dislocation is often a rotator cuff tear: use lag signs.",also:"Rotator cuff tear, suprascapular nerve."}
];
/* Localisation: where is the lesion? */
const LOCALISE=[
 ["Cortex","UMN signs (brisk reflexes, extensor plantar, pyramidal weakness) on the opposite side; plus cortical signs: aphasia, neglect, visual field loss, face and arm more than leg (MCA) or leg more than arm (ACA)","Seizures, cortical sensory loss (astereognosis, 2-point)"],
 ["Internal capsule / pons","Pure motor hemiparesis: face, arm and leg equally, no cortical signs","Lacunar stroke; 'dense hemiplegia without aphasia'"],
 ["Brainstem","Crossed signs: cranial nerve palsy on one side, long tract signs on the other","Diplopia, dysarthria, dysphagia, vertigo, ataxia — 'the Ds'"],
 ["Spinal cord","A sensory level, bilateral UMN signs below it, LMN signs at it; sphincters involved","Neck pain or back pain at the level; bladder early in conus lesions"],
 ["Root","Pain in a dermatome, weakness in a myotome, the reflex for that root lost","Pain worse with cough, neck or straight leg raise"],
 ["Plexus","Several roots and nerves in one limb, patchy, often painful","Trauma, tumour (Pancoast), radiation, diabetic amyotrophy"],
 ["Peripheral nerve","Weakness and sensory loss in one nerve's territory; reflex lost only if the nerve carries it","Compression sites: carpal tunnel, cubital tunnel, fibular head, spiral groove"],
 ["Polyneuropathy","Glove and stocking sensory loss, distal weakness, ankle jerks lost first","Diabetes, alcohol, B12, drugs; Guillain–Barré if acute and ascending with areflexia"],
 ["Neuromuscular junction","Fatigable weakness, ptosis and diplopia, normal sensation and reflexes","Myasthenia: ice pack test, sustained upgaze; Lambert–Eaton: reflexes improve after exercise"],
 ["Muscle","Proximal symmetrical weakness, normal sensation, reflexes preserved until late","Polymyositis, statins, steroids, thyroid; rhabdomyolysis"]
];
const CORDSYN=[
 ["Complete transection","Everything lost below the level, bilateral","Spinal shock first: flaccid, areflexic; UMN signs emerge over days to weeks"],
 ["Central cord","Arms weaker than legs, hands worst; variable sensory loss; 'cape' pain and temperature loss","Older person, hyperextension injury (fall forwards onto the face) with cervical spondylosis; the commonest incomplete syndrome"],
 ["Anterior cord","Paralysis and pain/temperature loss below; proprioception and vibration spared","Anterior spinal artery: aortic surgery or dissection, flexion injury. Worst prognosis"],
 ["Brown-Séquard (hemisection)","Same side: weakness and loss of proprioception and vibration. Opposite side: loss of pain and temperature (1–2 levels below)","Penetrating injury; best prognosis. The spinothalamic tract crosses within 1–2 segments of entry; the dorsal columns cross in the medulla"],
 ["Posterior cord","Loss of proprioception and vibration: sensory ataxia, positive Romberg","B12 deficiency (subacute combined degeneration), nitrous oxide misuse, tabes dorsalis"],
 ["Conus medullaris","Early bladder and bowel dysfunction, saddle anaesthesia, mixed UMN and LMN, often symmetrical","T12–L1 fracture, tumour"],
 ["Cauda equina","LMN only: asymmetrical leg weakness, lost reflexes, saddle anaesthesia, urinary retention (late)","Large central L4/5 or L5/S1 disc. Emergency MRI; operate before retention when possible"]
];
const CRANIAL=[
 ["I","Olfactory","Smell each nostril (coffee, soap)","Anosmia after head injury (cribriform plate), Parkinson's and Alzheimer's (early), COVID-19; frontal tumour","Rarely tested; ask instead"],
 ["II","Optic","Acuity, fields, pupils (RAPD), fundi, colour (red desaturation)","RAPD = optic nerve or severe retinal disease; bitemporal field loss = chiasm","Acuity is the 'vital sign of the eye'"],
 ["III","Oculomotor","Eye movements, ptosis, pupil","'Down and out' with ptosis; dilated pupil = compressive (posterior communicating aneurysm, uncal herniation) because pupillary fibres run on the outside","Pupil-sparing III with vascular risk factors: microvascular, but still image if any doubt"],
 ["IV","Trochlear","Looking down and in (reading, stairs)","Vertical diplopia worse looking down; head tilts away from the affected side","Commonest after head trauma; longest intracranial course"],
 ["V","Trigeminal","Light touch in V1–V3; jaw clench and opening (deviates to the weak side); corneal reflex","Numb chin syndrome (V3 mental nerve) can be the first sign of metastatic cancer","Corneal reflex: V afferent, VII efferent"],
 ["VI","Abducens","Abduction","Horizontal diplopia worse looking to the affected side; a false localising sign of raised intracranial pressure","Long course over the petrous apex"],
 ["VII","Facial","Raise eyebrows, close eyes tight, show teeth, puff cheeks","Forehead spared = UMN (stroke); whole side = LMN (Bell's). Check ears for vesicles (Ramsay Hunt) and the parotid","Taste anterior two-thirds of tongue, stapedius (hyperacusis)"],
 ["VIII","Vestibulocochlear","Whisper test, Rinne, Weber; HINTS and Dix–Hallpike when dizzy","Sudden sensorineural hearing loss is an emergency (steroids within days)","Weber goes to the bad ear in conductive loss, to the good ear in sensorineural loss"],
 ["IX","Glossopharyngeal","Palate elevation, gag (sensory)","Lost with X in lateral medullary syndrome","The gag reflex is absent in many healthy people and does not predict aspiration"],
 ["X","Vagus","Say 'ah': uvula deviates away from the weak side; voice, cough","Hoarse voice: recurrent laryngeal nerve (left: thoracic course around the aortic arch — lung cancer, aortic aneurysm)","Use a water swallow test, not the gag, for swallow safety"],
 ["XI","Accessory","Shrug (trapezius), turn head (sternocleidomastoid)","Turning the head left uses the right SCM. Posterior triangle surgery injures it (shoulder droop)","Weak SCM and trapezius on the same side as a hemiparesis: suspect a non-anatomical pattern"],
 ["XII","Hypoglossal","Tongue out: deviates toward the weak side; wasting, fasciculations","Fasciculating, wasted tongue: motor neuron disease (bulbar)","Watch the tongue at rest in the mouth: protrusion causes normal flickers"]
];
const GAITS=[
 ["Hemiplegic","Leg stiff, swings outward in an arc (circumduction), arm flexed","Stroke, contralateral UMN lesion"],
 ["Spastic (scissor)","Both legs stiff, knees cross, toes catch","Cord compression, cerebral palsy, cervical myelopathy"],
 ["Parkinsonian","Stooped, short shuffling steps, reduced arm swing (often asymmetric), turns 'en bloc', festination, freezing","Parkinson's disease, drug-induced parkinsonism"],
 ["Cerebellar ataxic","Wide-based, staggering, can't tandem walk; falls to the side of a hemisphere lesion","Alcohol, stroke, MS, drugs (phenytoin, lithium)"],
 ["Sensory ataxic","Wide-based, stamping, watching the feet, much worse in the dark; Romberg positive","Dorsal column disease (B12), large-fibre neuropathy"],
 ["Steppage","High knee lift to clear a dropped foot, foot slaps down","Foot drop: L5, common peroneal, neuropathy"],
 ["Waddling (Trendelenburg)","Pelvis drops on the swing side, trunk lurches over the stance leg","Proximal myopathy, bilateral hip disease, pregnancy"],
 ["Antalgic","Short stance phase on the painful leg","Pain anywhere in the limb"],
 ["Apraxic (magnetic)","Feet seem stuck to the floor, short steps, difficulty starting; arms move normally lying down","Normal pressure hydrocephalus (with urinary incontinence and cognitive decline), frontal disease, small vessel disease"],
 ["Functional","Inconsistent, effortful, 'walking on ice', knee buckling without falling, improves with distraction","Functional neurological disorder: diagnose on positive signs (Hoover's), not exclusion"]
];
