"use strict";
/* ================= TECHNIQUE FIGURES =================
 Schematics for the Technique clinic. Same 320×200 canvas and tokens as 58-figures. Orange = your hand, force or line of sight. */
Object.assign(FIG,{
"tech-otoscope":{t:"Otoscopy: straighten the canal, brace the hand",c:"The adult canal runs up, back and then forward: pull the pinna up and back to straighten it. In a child under about three the canal is short and straight-ish and points upward, so pull back and slightly down. Hold the otoscope like a pen with your little finger braced on the cheek, so a sudden head movement moves the scope with the head instead of into the drum.",
 s:()=>`${P.T(80,16,"Adult","middle")}${P.T(240,16,"Young child","middle")}
 ${P.pa("M40 150 Q30 90 60 60 Q88 36 112 60 Q126 80 112 110 Q100 128 104 160 Q90 176 64 170 Z","var(--skin)","var(--line)",1.3)}
 ${P.pa("M72 112 Q80 98 92 104 Q100 112 96 122","none","var(--ink2)",4)}${P.c(80,112,5,"var(--surface2)","var(--ink2)",1.2)}
 ${P.ar(96,78,120,44)}${P.t(124,48,"up + back","start","fa")}
 ${P.pa("M200 150 Q192 104 214 82 Q236 66 256 86 Q266 104 256 126 Q248 144 252 164 Q240 176 216 170 Z","var(--skin)","var(--line)",1.3)}
 ${P.c(226,120,5,"var(--surface2)","var(--ink2)",1.2)}
 ${P.ar(252,128,282,150)}${P.t(258,170,"back + down","start","fa")}
 ${P.ln(10,186,150,186,"var(--line)")}${P.t(14,198,"Canal: lateral third cartilage, medial two-thirds bone (touching bone hurts)")}`},
"tech-ophthalmoscope":{t:"Direct ophthalmoscopy: same side, 15° temporal",c:"Your right eye and right hand for the patient's right eye. The patient fixes on a distant point over your shoulder, which relaxes accommodation and keeps the eye still. Come in along the horizontal about 15° from the temporal side: the optic disc lies about 15° nasal to the fovea, so this line lands on the disc and keeps your light off the macula until you choose to look there.",
 s:()=>`${P.c(110,110,46,"var(--skin)","var(--line)")}${P.t(110,170,"patient (seen from above)","middle")}
 ${P.c(90,72,12,"var(--surface)","var(--ink2)")}${P.c(130,72,12,"var(--surface)","var(--ink2)")}${P.t(90,52,"L","middle")}${P.t(130,52,"R","middle")}
 ${P.c(133,64,3,"var(--ink)","none")}
 ${P.ln(130,60,130,8,"var(--muted)",1,"3 3")}${P.t(136,14,"fixation: distant target")}
 ${P.ar(220,20,138,66)}${P.t(214,32,"your line of sight,")}${P.t(214,44,"~15° temporal")}
 ${P.pa("M196 66 A60 60 0 0 1 206 40","none","var(--accent)",1.2)}
 ${P.r(222,10,30,18,"var(--surface2)","var(--ink2)",4)}${P.t(258,24,"ophthalmoscope")}
 ${P.c(270,120,30,"var(--surface)","var(--line)")}${P.c(262,120,7,"var(--warn-soft)","var(--warn)")}${P.c(286,120,4,"var(--bad-soft)","var(--bad)")}
 ${P.t(262,162,"disc (nasal)","middle")}${P.t(292,108,"fovea","middle")}${P.t(270,182,"right fundus","middle")}`},
"tech-rhinoscopy":{t:"Anterior rhinoscopy: lift the tip, look along the floor",c:"Push the nasal tip up with your thumb: the vestibule straightens and you can already see Little's area on the anterior septum. Open the speculum vertically (blades up and down) so neither blade presses on the septum, which is tender and bleeds. Look along the floor to the inferior turbinate, then tilt the head back to see the middle turbinate and the meatus.",
 s:()=>`${P.pa("M40 40 Q60 30 80 52 L140 140 Q150 160 132 168 L60 168 Q46 150 52 128 Z","var(--skin)","var(--line)",1.3)}
 ${P.e(118,154,14,8,"var(--surface2)","var(--ink2)")}
 ${P.ar(150,186,140,166)}${P.t(154,192,"thumb lifts the tip")}
 ${P.pa("M196 30 L196 180 M196 30 Q300 40 300 120 Q300 170 260 180 L196 180","none","var(--line)",1.2)}
 ${P.t(248,24,"lateral wall (right side)","middle")}
 ${P.e(260,76,34,10,"var(--muscle)","var(--muscle-line)")}${P.t(260,80,"middle turbinate","middle")}
 ${P.e(250,126,40,14,"var(--muscle)","var(--muscle-line)")}${P.t(250,130,"inferior turbinate","middle")}
 ${P.ln(196,166,300,166,"var(--bone-line)",2)}${P.t(246,178,"floor","middle")}
 ${P.ar(170,150,222,150)}${P.t(150,112,"line of sight","start","fa")}
 ${P.c(206,150,7,"var(--bad-soft)","var(--bad)")}${P.t(168,96,"Little's area")}${P.ln(190,100,204,142,"var(--muted)",1,"2 3")}`},
"tech-tinel":{t:"Tinel: tap the nerve, feel it in the territory",c:"A positive Tinel is tingling felt in the nerve's distribution, not soreness at the spot you tapped. Tap from distal to proximal over the nerve's course. In regeneration after an injury, the most distal point that still gives tingling moves down the limb at roughly 1 mm a day.",
 s:()=>`${P.skin("M30 190 L40 120 Q42 90 60 80 L72 30 Q76 22 82 30 L84 78 L92 22 Q97 14 102 22 L102 78 L110 28 Q115 20 120 28 L118 82 L126 44 Q131 38 135 46 L130 100 Q150 92 160 104 Q150 124 132 140 L120 190 Z")}
 ${P.pa("M60 80 L72 30 Q76 22 82 30 L84 78 L92 22 Q97 14 102 22 L102 78 L110 28 Q115 20 118 28 L114 84 L66 92 Z","var(--nerve)","none",1,"fill-opacity=\".35\"")}
 ${P.nv("M86 190 L88 140 L90 110")}${P.c(88,150,9,"none","var(--accent)",2)}
 ${P.ar(30,150,74,150)}${P.t(4,140,"tap")}
 ${P.t(170,40,"Median nerve at the wrist:")}${P.t(170,54,"tingling in thumb, index,")}${P.t(170,68,"middle, radial half of ring")}
 ${P.t(170,96,"Other sites:","start","fb")}${P.t(170,110,"ulnar: cubital tunnel")}${P.t(170,124,"common peroneal: fibular neck")}${P.t(170,138,"tibial: tarsal tunnel")}
 ${P.ar(170,170,290,170,"var(--accent)",1.8)}${P.t(170,186,"tap distal → proximal")}`},
"tech-hallpike":{t:"Dix–Hallpike: 45° turn, then lie back past horizontal",c:"Turning the head 45° to the tested side lines the posterior canal up with the plane you are about to move in. Lying back with the head 20 to 30° below horizontal lets loose otoconia fall along the canal, which makes the cupula deflect. Expect a few seconds' latency, then torsional upbeating nystagmus that fades within a minute.",
 s:()=>`${P.r(20,110,40,60,"var(--surface2)","var(--line)",8)}${P.c(40,90,16,"var(--skin)","var(--line)")}${P.ar(40,72,58,66,"var(--accent)",1.8)}${P.t(40,186,"1 sit, head 45° to the side","middle")}
 ${P.ln(110,140,300,140,"var(--line)",3)}${P.r(160,118,120,20,"var(--surface2)","var(--line)",8)}
 ${P.c(132,152,15,"var(--skin)","var(--line)")}${P.ln(110,140,150,140,"var(--muted)",1,"3 3")}${P.ln(146,140,116,158,"var(--accent)",1.6)}
 ${P.t(98,178,"head 20–30° below the couch")}${P.t(210,108,"2 lie back briskly","middle")}
 ${P.ar(64,120,140,124,"var(--muted)",1.4)}
 ${P.t(200,30,"Watch the eyes ≥ 30 s:")}${P.t(200,44,"latency 1–5 s, torsional")}${P.t(200,58,"(upper pole beats toward the")}${P.t(200,72,"lower ear), up-beating, fatigues")}`},
"tech-head-impulse":{t:"Head impulse: small, fast, unpredictable",c:"Hold the head, have the patient fix on your nose, then turn the head 10 to 20° quickly and without warning. A working vestibulo-ocular reflex keeps the eyes on your nose. If the eyes are dragged with the head and then flick back (a catch-up saccade), the vestibular reflex on the side you turned toward is weak. That points to a peripheral cause. In acute vestibular syndrome, a normal impulse is the worrying result.",
 s:()=>`${P.T(80,16,"Normal","middle")}${P.T(240,16,"Abnormal (peripheral)","middle")}
 ${P.c(80,100,40,"var(--skin)","var(--line)")}${P.c(66,86,8,"var(--surface)","var(--ink2)")}${P.c(94,86,8,"var(--surface)","var(--ink2)")}${P.c(66,82,3,"var(--ink)","none")}${P.c(94,82,3,"var(--ink)","none")}
 ${P.pa("M40 150 Q80 170 120 150","none","var(--accent)",2.2)}${P.ar(110,156,122,148)}${P.t(80,184,"head turns, eyes stay on target","middle")}
 ${P.c(240,100,40,"var(--skin)","var(--line)")}${P.c(226,86,8,"var(--surface)","var(--ink2)")}${P.c(254,86,8,"var(--surface)","var(--ink2)")}${P.c(230,86,3,"var(--ink)","none")}${P.c(258,86,3,"var(--ink)","none")}
 ${P.ar(262,66,236,66,"var(--bad)",2)}${P.t(240,58,"catch-up saccade","middle")}
 ${P.pa("M200 150 Q240 170 280 150","none","var(--accent)",2.2)}${P.ar(270,156,282,148)}${P.t(240,184,"eyes ride with the head, then flick back","middle")}`},
"tech-reflex":{t:"Tendon reflexes: let the hammer fall",c:"Hold the hammer near the end and let it swing from the wrist, so the tap is quick and the same strength each time. Put your finger on the biceps tendon and strike your finger: you feel the contraction even when you can't see it. If the reflex seems absent, reinforce: ask the patient to clench their teeth or pull their hooked fingers apart, and tap just as they do.",
 s:()=>`${P.bone(40,150,140,120,14)}${P.bone(140,120,230,160,12)}${P.mus("M60 132 Q100 104 138 116 L136 124 Q100 116 64 144 Z")}
 ${P.hand(132,104,-20,.8)}${P.ln(170,40,138,96,"var(--ink2)",4)}${P.r(160,26,30,14,"var(--surface3)","var(--ink2)",4)}
 ${P.pa("M196 40 A40 40 0 0 1 176 78","none","var(--accent)",1.6)}${P.ar(182,70,176,80)}${P.t(200,52,"swing from the wrist")}
 ${P.t(60,176,"strike your own finger on the tendon")}
 ${P.T(250,110,"Reinforce","middle")}${P.pa("M232 130 q8 -10 16 0 M272 130 q-8 -10 -16 0","none","var(--accent)",3)}${P.ar(236,140,220,140,"var(--accent)",1.4)}${P.ar(268,140,284,140,"var(--accent)",1.4)}${P.t(250,160,"pull just before the tap","middle")}`},
"tech-plantar":{t:"Plantar response: the path of the stroke",c:"Use something blunt: an orange stick, a key or the end of a closed pen, not a needle. Stroke slowly and firmly along the lateral border of the sole from the heel to the base of the little toe, then curve medially across the metatarsal heads, stopping before the ball of the big toe. Watch only the first movement of the hallux. Slow, upward extension of the big toe is extensor; a quick pull of the whole leg away is withdrawal.",
 s:()=>`${P.pa("M130 186 Q100 180 100 140 Q98 100 108 70 Q118 34 150 26 Q190 22 200 50 Q210 90 196 130 Q186 170 160 186 Z","var(--skin)","var(--line)",1.3)}
 ${P.c(142,24,9,"var(--skin)","var(--line)")}${P.c(162,22,7,"var(--skin)","var(--line)")}${P.c(178,26,6,"var(--skin)","var(--line)")}${P.c(190,34,5,"var(--skin)","var(--line)")}${P.c(198,44,5,"var(--skin)","var(--line)")}
 ${P.pa("M174 176 Q200 120 196 66 Q180 54 150 60","none","var(--accent)",3,"stroke-dasharray=\"0\"")}${P.ar(158,58,146,62)}
 ${P.t(212,150,"1 heel to the little toe,")}${P.t(212,164,"along the lateral border")}${P.t(212,60,"2 across the metatarsal")}${P.t(212,74,"heads, stop before the hallux")}
 ${P.t(10,40,"Watch the big toe's")}${P.t(10,54,"FIRST movement")}${P.ar(70,46,130,28,"var(--muted)",1.2)}`},
"tech-tuning-fork":{t:"Rinne and Weber with a 512 Hz fork",c:"Strike the fork on your knee or elbow; a hard surface produces overtones. Rinne: the base on the mastoid, then the tines 1 to 2 cm from the ear canal, in line with it. Air conduction louder than bone is normal, or a sensorineural loss. Weber: the base on the midline (vertex, forehead or upper incisors). In a conductive loss the sound goes to the bad ear; in a sensorineural loss it goes to the good ear.",
 s:()=>`${P.T(90,16,"Rinne","middle")}${P.T(240,16,"Weber","middle")}
 ${P.c(90,104,44,"var(--skin)","var(--line)")}${P.e(134,104,8,14,"var(--skin)","var(--line)")}
 ${P.ln(122,140,122,170,"var(--ink2)",3)}${P.pa("M118 140 L118 118 M126 140 L126 118","none","var(--ink2)",3)}${P.t(98,188,"1 base on the mastoid")}
 ${P.pa("M150 98 L176 98 M150 110 L176 110","none","var(--ink2)",3)}${P.ln(176,104,196,104,"var(--ink2)",3)}${P.t(150,86,"2 tines at the canal")}
 ${P.c(240,110,44,"var(--skin)","var(--line)")}${P.ln(240,66,240,36,"var(--ink2)",3)}${P.pa("M236 36 L236 14 M244 36 L244 14","none","var(--ink2)",3)}
 ${P.ar(222,84,196,92,"var(--accent)",1.6)}${P.ar(258,84,284,92,"var(--accent)",1.6)}${P.t(240,172,"midline: where is it louder?","middle")}`}
});
