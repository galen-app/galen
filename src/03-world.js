"use strict";
/* ================= THE WORLD: the anatomical theatre =================
   The Table in the centre (the whole patient) and twelve halls around it, each bound to a body system.
   Membership is computed from the real content (signs, techniques, histories, cards), so nothing is duplicated. */

const EMB={ /* engraved emblems, viewBox 0 0 64 64, stroke only */
table:'<path d="M8 30h48M12 30v20M52 30v20M10 50h8M46 50h8"/><path d="M14 30c2-6 8-8 14-8h14c4 0 8 2 9 8"/><circle cx="46" cy="21" r="4"/><path d="M20 16v6M44 8v6"/><path d="M20 12c-1.2 1.4-1.2 2.8 0 4 1.2-1.2 1.2-2.6 0-4zM44 4c-1.2 1.4-1.2 2.8 0 4 1.2-1.2 1.2-2.6 0-4z"/><path d="M17 22h6M41 14h6"/>',
heart:'<path d="M32 54c-14-9-22-17-22-28 0-7 5-12 11-12 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 5 11 12 0 11-8 19-22 28z"/><path d="M28 14c0-6 2-9 6-10M36 14c1-5 4-8 9-8M24 16c-3-4-7-5-10-4"/><path d="M32 22v14M26 30c3 3 9 3 12 0"/>',
vessels:'<path d="M32 6v14M32 20c-8 4-12 10-14 18M32 20c8 4 12 10 14 18M18 38c-4 4-6 9-6 16M18 38c2 5 2 10 0 16M46 38c4 4 6 9 6 16M46 38c-2 5-2 10 0 16M25 28c-3 0-6 2-8 4M39 28c3 0 6 2 8 4"/><circle cx="32" cy="6" r="2"/>',
lungs:'<path d="M32 6v20M32 26l-6 4M32 26l6 4"/><path d="M26 18c-8 0-14 10-15 22-1 9 2 14 7 14 6 0 9-4 9-12V22"/><path d="M38 18c8 0 14 10 15 22 1 9-2 14-7 14-6 0-9-4-9-12V22"/><path d="M18 40c3-1 5 0 6 2M46 40c-3-1-5 0-6 2"/>',
belly:'<path d="M22 8c-6 2-8 8-6 14 2 5 8 6 12 4s8-8 14-6c6 2 8 8 6 14"/><path d="M20 30c-4 4-4 10 0 14s10 4 14 0 10-4 14 0 4 10 0 14"/><path d="M26 38c2 2 6 2 8 0M30 44c2 2 6 2 8 0"/><circle cx="46" cy="10" r="3"/>',
neck:'<path d="M24 6c0 10-2 18-4 52M40 6c0 10 2 18 4 52"/><path d="M28 10h8M28 16h8M28 22h8"/><path d="M32 34c-3-6-12-8-14-2s2 14 8 14c3 0 5-4 6-8 1 4 3 8 6 8 6 0 10-8 8-14s-11-4-14 2z"/>',
senses:'<path d="M6 32s10-14 26-14 26 14 26 14-10 14-26 14S6 32 6 32z"/><circle cx="32" cy="32" r="8"/><circle cx="32" cy="32" r="3"/><path d="M14 18l4 5M50 18l-4 5M32 10v6"/>',
cranial:'<path d="M18 22c0-8 6-14 14-14s14 6 14 14c0 6-4 10-8 12v6H26v-6c-4-2-8-6-8-12z"/><path d="M26 40c-6 4-12 6-18 6M38 40c6 4 12 6 18 6M28 40c-2 6-6 12-10 16M36 40c2 6 6 12 10 16M32 40v18"/><path d="M26 20c2-2 4-2 6 0 2-2 4-2 6 0"/>',
mind:'<path d="M32 10c-4-4-12-2-12 4-6 0-9 6-6 10-4 3-3 10 2 11 0 5 6 8 10 5 2 3 4 4 6 4s4-1 6-4c4 3 10 0 10-5 5-1 6-8 2-11 3-4 0-10-6-10 0-6-8-8-12-4z"/><path d="M32 10v34M24 20c3 1 5 3 5 6M40 20c-3 1-5 3-5 6M22 32c3 0 5 2 6 4M42 32c-3 0-5 2-6 4"/><path d="M32 44v14"/>',
spine:'<path d="M30 4h4M28 10h8l-1 4h-6zM27 18h10l-1 5h-8zM26 27h12l-1 5H27zM26 36h12l-1 5H27zM27 45h10l-1 5h-8zM29 54h6l-1 5h-4z"/><path d="M24 12l-4-2M40 12l4-2M23 20l-5-1M41 20l5-1M22 29l-6 0M42 29l6 0"/>',
arm:'<path d="M22 58V38c-4-3-6-8-6-12V16a3 3 0 0 1 6 0v10M22 26V10a3 3 0 0 1 6 0v16M28 24V8a3 3 0 0 1 6 0v16M34 24V12a3 3 0 0 1 6 0v18c2-4 4-6 7-6 2 0 3 2 2 4l-7 12c-2 4-6 6-10 6"/><path d="M22 46h14"/>',
leg:'<path d="M26 4v20c0 4-2 8-2 12s2 6 2 10v4c0 2-2 4-4 6h-6c-2 0-3 2-2 3h20c2 0 3-2 2-4l-2-5V46c0-4 2-6 2-10s-2-8-2-12V4"/><circle cx="31" cy="35" r="4"/>',
skin:'<path d="M4 20c8-4 16 4 28 0s20 4 28 0"/><path d="M4 30h56M4 44h56"/><path d="M22 30v-14M22 16c-2-4 0-8 4-10"/><circle cx="22" cy="34" r="3"/><path d="M40 44c0-4 4-6 4-10s-4-4-4-4M12 52c4-2 8 2 12 0s8 2 12 0 8 2 12 0 8 2 12 0"/>'
};

const HALLS=[
{id:"table",rn:"·",n:"The Table",short:"Table",la:"Mensa",patron:"Hippocrates of Kos",sys:"gen",tint:"rgb(212 98 26 / .10)",
 maxim:["Ars longa, vita brevis.","The art is long, and life is short."],
 intro:["In the middle of the theatre stands the table, and on it the whole patient: the face, the hands, the breathing, the story. Every hall around it borrows from this one.",
 "Before anatomy, there was looking. The Hippocratic physicians of Kos wrote down what they saw at the bedside, without gods and without spells, and the habit has never been bettered. Start here, and come back here."]},
{id:"heart",rn:"I",n:"Hall of the Heart",short:"Heart",la:"Aula Cordis",patron:"William Harvey",sys:"cvs",tint:"rgb(180 40 30 / .12)",
 maxim:["Cor fundamentum vitae.","The heart is the foundation of life."],
 intro:["A dissected heart lies in a dish of brine under the candles. For fourteen centuries students were told, as Galen taught, that blood seeped through invisible pores in its septum. Nobody could find the pores; they believed in them anyway.",
 "In 1628 an Englishman trained in this very theatre counted, measured and tied off arms, and the blood went round. Here you learn to hear what Harvey saw: the pulse, the impulse, the sounds and the silences between them."]},
{id:"vessels",rn:"II",n:"Hall of Vessels",short:"Vessels",la:"Aula Vasorum",patron:"Stephen Hales",sys:"cvs",tint:"rgb(60 90 160 / .12)",
 maxim:["Sanguis numquam quiescit.","The blood never rests."],
 intro:["Glass tubes hang on the wall of this hall, taller than a man. A country parson tied a mare down, opened the artery of her leg into one of them, and watched the blood climb past eight feet. He began these experiments around 1711 and published them in 1733.",
 "Pressure, flow and obstruction are judged here: the pulses you can feel and the ones you cannot, the swollen leg, the bruit, the cuff. Arteries do not lie, but they do whisper."]},
{id:"lungs",rn:"III",n:"Hall of Breath",short:"Lungs",la:"Aula Pulmonum",patron:"René Laennec",sys:"resp",tint:"rgb(90 130 150 / .12)",
 maxim:["Pectus loquitur.","The chest speaks."],
 intro:["Wooden cylinders sit on a shelf by the window, each turned on a lathe by a Breton physician who would die of the disease he taught us to hear. He rolled a quire of paper in 1816 because he was too embarrassed to press his ear to a young woman's chest.",
 "Before him, an innkeeper's son had learned to tap barrels to judge the wine. This hall is theirs: percussion, the voice through the chest wall, the crackle and the wheeze."]},
{id:"belly",rn:"IV",n:"Hall of the Belly",short:"Belly",la:"Aula Ventris",patron:"Charles McBurney",sys:"abd",tint:"rgb(150 110 40 / .12)",
 maxim:["Venter non mentitur.","The belly does not lie."],
 intro:["Surgeons once waited for the belly to declare itself, and many patients died while it did. An inflamed appendix was called 'perityphlitis' and treated with leeches and opium until 1886, when Reginald Fitz named it appendicitis and told surgeons to operate early.",
 "Here the hands learn to read guarding, rebound and the quiet abdomen that is worse than a loud one. Inspect before you touch; touch gently before you press."]},
{id:"neck",rn:"V",n:"Hall of the Neck and Glands",short:"Neck",la:"Aula Colli",patron:"Theodor Kocher",sys:"hn",tint:"rgb(120 90 150 / .12)",
 maxim:["Parva glandula, magna res.","A small gland, a great matter."],
 intro:["In the Alpine valleys, whole villages once carried goitres the size of fists, and children were born who never grew. A Swiss surgeon in Bern made the operation safe, and in 1883, after his first hundred, he went back to the patients who had lost the whole gland and found them slowed, swollen and dull. Reverdin in Geneva had already seen the same.",
 "This hall holds the thyroid, the lymph nodes, the parathyroids and their twitching signs. A swallow, a stethoscope on the gland, a tap on the cheek."]},
{id:"senses",rn:"VI",n:"Hall of the Senses",short:"Senses",la:"Aula Sensuum",patron:"Hermann von Helmholtz",sys:"hn",tint:"rgb(60 120 120 / .12)",
 maxim:["Oculus animi index.","The eye is the index of the mind."],
 intro:["The living retina, the one place where vessels and a piece of the brain lie open to view, could not be seen until 1851, when a young physiologist stacked plates of glass in front of a candle and looked in. Von Graefe, the great eye surgeon, is said to have cried that a new world had been opened.",
 "Eye, ear, nose and throat: the instruments that frighten students most and reward them most. Here you learn to hold them properly, and why each step is where it is."]},
{id:"cranial",rn:"VII",n:"Hall of the Twelve Roads",short:"Cranial",la:"Aula Nervorum",patron:"Thomas Willis",sys:"neuro",tint:"rgb(110 100 60 / .12)",
 maxim:["Duodecim viae.","Twelve roads."],
 intro:["Galen counted seven pairs of nerves leaving the brain, and was proud of the number. Willis counted nine in 1664, with drawings by the man who later built St Paul's Cathedral. Soemmerring settled on twelve in 1778. Galen was not entirely wrong; he was merely early.",
 "Pupils, fields, eye movements, the face, the swallow, the dizzy patient. Each road has a toll-gate where a lesion gives itself away."]},
{id:"mind",rn:"VIII",n:"Hall of Mind and Motion",short:"Neuro",la:"Aula Motus",patron:"Joseph Babinski",sys:"neuro",tint:"rgb(70 70 120 / .14)",
 maxim:["Ex motu, sedes.","From the movement, the seat of the lesion."],
 intro:["Charcot's Paris was full of patients whose paralysis came and went, and no one could tell the real from the hysterical. In 1896 his pupil stroked the sole of a foot and watched the great toe rise.",
 "Power, tone, reflexes, sensation, coordination, gait and the conscious level. Neurology rewards the methodical and punishes the hurried."]},
{id:"spine",rn:"IX",n:"Hall of the Column",short:"Spine",la:"Aula Spinae",patron:"Percivall Pott",sys:"msk",tint:"rgb(140 120 90 / .12)",
 maxim:["Columna vitae.","The column of life."],
 intro:["A London surgeon gave his name to tuberculosis of the spine, and in 1775 noticed that boys sent up chimneys grew cancers of the scrotum. It was the first occupational cancer ever described, long before anyone knew what soot contained.",
 "Back pain, the trapped root, the cord in danger and the cauda equina that must never be missed. Most backs need reassurance; a few need a scanner tonight."]},
{id:"arm",rn:"X",n:"Hall of the Arm and Hand",short:"Arm",la:"Aula Brachii",patron:"Jules Tinel",sys:"msk",tint:"rgb(160 90 60 / .12)",
 maxim:["Manus instrumentum instrumentorum.","The hand is the instrument of instruments."],
 intro:["In 1915 the trenches sent back young men with shattered arms. In France and in Germany two doctors, on opposite sides of the war, both tapped over regrowing nerves and felt the patients flinch with tingling.",
 "Shoulder, elbow, wrist and hand, and the three nerves that run through them. The hand is the instrument you examine with; learn to examine it."]},
{id:"leg",rn:"XI",n:"Hall of the Gait",short:"Leg",la:"Aula Gressus",patron:"Friedrich Trendelenburg",sys:"msk",tint:"rgb(110 120 60 / .12)",
 maxim:["Solvitur ambulando.","It is solved by walking."],
 intro:["In 1895 a German surgeon watched children with dislocated hips walk, and saw the pelvis drop on the opposite side each time they stood on the bad leg. Friedrich Trendelenburg's sign still asks the same question: can the hip abductors hold the pelvis level?",
 "Hip, knee, ankle and foot, the rules that spare X-rays, and the walk itself, which tells you more than any single test."]},
{id:"skin",rn:"XII",n:"Hall of the Skin",short:"Skin",la:"Aula Cutis",patron:"Robert Willan",sys:"derm",tint:"rgb(170 110 80 / .12)",
 maxim:["Cutis speculum corporis.","The skin is the mirror of the body."],
 intro:["Until a Quaker physician sorted rashes by their shape between 1798 and 1808, every eruption had a dozen names and none of them helped. He fixed what papule, vesicle and pustule mean, and the words still work.",
 "Here are the plates, the vocabulary, and the rashes that can kill by morning. Describe first; name second."]}
];
const HALL=Object.fromEntries(HALLS.map(h=>[h.id,h]));

/* plain words for what each hall holds (shown under the hall name; the Latin is decoration) */
const HALL_SCOPE={table:"First look, vital signs, volume, the history",heart:"Pulse, JVP, heart sounds, murmurs",vessels:"Blood pressure, arteries, the swollen leg",lungs:"Inspection, percussion, breath sounds",
 belly:"Liver signs, palpation, ascites, the acute abdomen",neck:"Thyroid, lymph nodes, calcium",senses:"Ear, hearing, nose, eye, throat",cranial:"Pupils, fields, eye movements, face, vertigo",
 mind:"Conscious level, power, reflexes, sensation, stroke",spine:"Back pain, the root, cauda equina, the neck",arm:"Shoulder, elbow, wrist, the nerves of the hand",leg:"Hip, knee, ankle and foot, the hot joint",skin:"Describing lesions, naming rashes, skin emergencies"};
/* the ring of doors around the table, clockwise from the top, laid out like a body map:
   the head halls on top, chest and belly on the right, the column at the bottom, the limbs on the left */
const THEATRE_RING=["cranial","senses","neck","lungs","heart","belly","spine","vessels","leg","arm","skin","mind"];

/* ---- membership ----
   A sign, technique or history belongs to the hall whose outline chapter teaches it. The overrides below only settle items
   that no chapter links yet, or that two halls share. */
const HALL_SIGNS={
 vessels:"pedal-pulses oedema homans carotid-bruit abi wells-dvt radio-femoral bp-arms aaa-palp abd-bruit plr",
 neck:"lymph-supraclav thyroid-palp pemberton hyperthyroid-signs hypothyroid-signs trousseau chvostek lymph-nodes",
 senses:"rinne-weber otoscopy centor red-eye fundoscopy whisper-test visual-acuity transillumination",
 cranial:"rapd visual-fields facial-palsy gag water-swallow ice-pack horner hints dix-hallpike epley",
 spine:"slr cauda waddell schober spurling ultt c-spine-rule crossed-slr femoral-stretch lumbar-roots si-cluster",
 arm:"finkelstein scaphoid froment",
 leg:"ottawa-ankle thompson lachman mcmurray knee-effusion trendelenburg",
 table:"gals"
};
const _SH={};Object.entries(HALL_SIGNS).forEach(([h,s])=>s.split(" ").forEach(id=>_SH[id]=h));
const REG_HALL={shoulder:"arm",elbow:"arm",wrist:"arm",hand:"arm",spine:"spine",back:"spine",hip:"leg",knee:"leg",ankle:"leg",foot:"leg"};
const SYS_HALL={gen:"table",cvs:"heart",resp:"lungs",abd:"belly",neuro:"mind",msk:"spine",hn:"neck",derm:"skin"};
/* where the outline links each item: {sign:{id:[halls…]}, tech:{…}, pres:{…}} (built once, lazily) */
let _OL=null;
function outlineLinks(){if(_OL)return _OL;const o={sign:{},tech:{},pres:{}};if(typeof OUTLINE==="undefined")return o;
  for(const [h,cs] of Object.entries(OUTLINE))cs.forEach(c=>{[["sign",c.signs],["tech",c.tech],["pres",c.pres]].forEach(([k,l])=>(l||[]).forEach(id=>{const a=o[k][id]=o[k][id]||[];if(!a.includes(h))a.push(h);}));});
  return _OL=o;}
function pickHall(linked,pref){if(!linked||!linked.length)return null;if(pref&&linked.includes(pref))return pref;return linked[0];}
function signHall(id){const s=typeof SIGNS!=="undefined"&&SIGNS[id];if(!s&&!_SH[id])return null;
  const fall=_SH[id]||(s&&s.reg&&REG_HALL[s.reg])||(s&&SYS_HALL[s.sys])||"table";
  return pickHall(outlineLinks().sign[id],fall)||fall;}
const TECH_HALL_GROUP={"Ear, nose and eye":"senses","Peripheral nerve":"arm","Sensory":"mind","Reflexes and tone":"mind","Coordination and gait":"mind","Vestibular and eye movements":"cranial","Meninges and functional":"mind"};
const TECH_HALL_ID={"swinging-torch":"cranial","confrontation-fields":"cranial","eye-movements":"cranial","mrc-power":"mind"};
function techHall(t){if(typeof t==="string")t=(typeof TECH!=="undefined")&&TECH.find(x=>x.id===t);if(!t)return null;
  const fall=TECH_HALL_ID[t.id]||TECH_HALL_GROUP[t.group]||"mind";return pickHall(outlineLinks().tech[t.id],fall)||fall;}
const PRES_HALL={};/* filled lazily: the outline first, then the presentation's name, then its system */
const PRES_HINT=[[/back/i,"spine"],[/joint|knee|ankle|limp|hip/i,"leg"],[/hand|wrist|shoulder|arm/i,"arm"],[/neck lump|thyroid|lump in the neck|goitre/i,"neck"],[/red eye|vision|visual|\bears?\b|hearing|sore throat|\bnose\b/i,"senses"],[/dizz|vertigo|diplopia|double vision|facial/i,"cranial"],[/leg swell|calf|claudication/i,"vessels"],[/rash|itch|skin/i,"skin"]];
function presHall(p){if(typeof p==="string")p=HIST.pres.find(x=>x.id===p);if(!p)return "table";if(PRES_HALL[p.id])return PRES_HALL[p.id];
  let h=null;for(const [re,hh] of PRES_HINT)if(re.test(p.name)){h=hh;break;}
  const fall=h||SYS_HALL[p.sys]||"table";return PRES_HALL[p.id]=pickHall(outlineLinks().pres[p.id],fall)||fall;}

/* ---- every card reaches a hall and a chapter ----
   Cards made from signs, techniques, histories and sounds follow the chapter that links them. The others are placed by rule:
   [hall, chapter-title pattern, fallback pattern]. A chapter is found by its title, so new or re-ordered chapters keep working.
   A card may carry its own c.hall or c.chap ("hall/pattern"); a chapter may claim cards with cards:["cn:V","dc:", …]. */
const CRANIAL_CHAP={I:["cranial","lower|bulbar","face"],II:["cranial","field"],III:["cranial","eye mov"],IV:["cranial","eye mov"],V:["cranial","lower|bulbar","face"],VI:["cranial","eye mov"],
 VII:["cranial","face"],VIII:["cranial","dizz"],IX:["cranial","swallow|face"],X:["cranial","swallow|face"],XI:["cranial","lower|bulbar","face"],XII:["cranial","lower|bulbar","face"]};
const DPLATE_CHAP={Emergency:["skin","kill"],Growths:["skin","pigment"],Pigment:["skin","name it"],Inflammatory:["skin","name it"],Infection:["skin","name it"]};
const ANAT_CHAP=[[/sternal angle|internal jugular/i,"heart","jugular"],[/aortic|pulmonic|erb|tricuspid/i,"heart","^heart sounds"],[/^apex/i,"heart","inspection|palpation"],
 [/lung apex|middle lobe|lung bases|auscultation ladder/i,"lungs","breath sounds"],[/liver dullness/i,"belly","organs"],[/renal angle/i,"belly","organs"],
 [/thyroid|cricoid/i,"neck","^the thyroid"],[/carotid/i,"vessels","arter"],[/node|submental|jugular chain|triangle|virchow|parotid/i,"neck","lymph"],
 [/c7|t3|t7|l4|s2|psis|iliac|scapula/i,"spine","back in the room"],[/hypochond|epigast|lumbar|umbilic|iliac fossa|suprapubic|inguinal/i,"belly","palpation"]];
const FIND_CHAP={
 gen:[["table","end of the bed"],["table","vital"],["table","vital"],["table","volume"],["table","hands"],["belly","liver"],["table","rash"]],
 cvs:[["heart","jugular"],["heart","^heart sounds"],["heart","murmur"],["heart","murmur"],["heart","murmur"],["heart","emergenc"],["heart","pulse"],["vessels","blood pressure"],["vessels","limb","arter"]],
 resp:[["lungs","percussion"],["lungs","voice"],["lungs","trachea"],["lungs","breath sounds"],["lungs","breath sounds"],["lungs","breath sounds"],["lungs","breath sounds"],["lungs","synthesis"],["lungs","inspect"]],
 abd:[["belly","acute"],["belly","acute"],["belly","acute"],["belly","acute"],["belly","acute"],["belly","acute"],["belly","acute"],["belly","acute"],["belly","ascites"],["belly","organs"]],
 neuro:[["mind","stroke"],["mind","menin"],["mind","menin"],["mind","sensation"],["mind","reflex"],["cranial","eye mov"],["mind","movement","coordination"],["cranial","dizz"],["arm","nerves of the hand"],["spine","trapped root|root"]],
 msk:[["leg","knee"],["leg","hot joint"],["arm","shoulder"],["spine","cauda"],["spine","back in the room"],["spine","back in the room"],["table","joints"],["arm","scaphoid"],["leg","ankle"],["leg","hip"]],
 hn:[["neck","thyroid status"],["neck","^the thyroid"],["neck","lymph"],["senses","hearing"],["senses","the eye"],["senses","the eye"],["senses","throat"],["cranial","face"]],
 derm:[["skin","name it"],["skin","name it"],["skin","name it"],["skin","name it"],["skin","kill"],["skin","kill"],["skin","kill"],["skin","kill"],["skin","kill"],["skin","name it"],["skin","pigment"],["skin","pigment"],["skin","name it"],["skin","name it"],["skin","name it"],["skin","name it"]]};
/* the rule for one card: [hall, pattern, fallback pattern] or null when the card follows a linked item */
const TECH_SIGN={"whispered-voice":"whisper-test"};/* a technique that no chapter links yet follows the sign of the same test */
const slugT=t=>String(t).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function cardRule(c){
  if((c.type==="trap"||c.type==="pearl")&&Array.isArray(c.ref)){const cs=(typeof OUTLINE!=="undefined"&&OUTLINE[c.ref[0]])||[];const i=cs.findIndex(x=>slugT(x.t)===c.ref[1]);if(i>=0)return [c.ref[0],null,null,i];}
  if(c.chap){const m=/^(\w+):(\d+)$/.exec(String(c.chap));if(m){const cs=(typeof OUTLINE!=="undefined"&&OUTLINE[m[1]])||[];const x=cs[+m[2]];return x?[m[1],null,null,+m[2]]:[m[1],""];}
    const [h,re]=String(c.chap).split("/");return [h,re||""];}
  if((c.type==="lore"||c.type==="lsign")&&c.signs&&c.signs.length){for(const sid of c.signs){const hs=outlineLinks().sign[sid];if(hs&&(!c.hall||hs.includes(c.hall))){const h=c.hall||hs[0];const i=OUTLINE[h].findIndex(x=>(x.signs||[]).includes(sid));if(i>=0)return [h,null,null,i];}}}
  if((c.type==="twhy"||c.type==="terr")&&Array.isArray(c.ref)&&!outlineLinks().tech[c.ref[0]]){const sid=TECH_SIGN[c.ref[0]]||c.ref[0];const hs=outlineLinks().sign[sid];if(hs){const h=hs[0];const i=OUTLINE[h].findIndex(x=>(x.signs||[]).includes(sid));if(i>=0)return [h,null,null,i];}}
  switch(c.type){
    case "dterm":return ["skin","describ"];
    case "dplate":{const d=typeof DCOND!=="undefined"&&DCOND.find(x=>x.id===c.ref);return DPLATE_CHAP[d&&d.g]||["skin","name it"];}
    case "cranial":{const k=typeof CRANIAL!=="undefined"&&CRANIAL[c.ref]&&CRANIAL[c.ref][0];return CRANIAL_CHAP[k]||["cranial","face"];}
    case "myo":return ["mind","power|tone"];case "reflex":return ["mind","reflex"];case "derm":return ["mind","sensation"];
    case "rootnerve":{const q=typeof ROOTNERVE!=="undefined"&&ROOTNERVE[c.ref]?ROOTNERVE[c.ref].q:"";return /foot|knee|thigh|leg/i.test(q)?["spine","trapped root|root"]:/shoulder/i.test(q)?["arm","shoulder"]:["arm","nerves of the hand|nerve"];}
    case "area":return ["heart","^heart sounds"];case "zone":return ["lungs","breath sounds"];
    case "anat":{const n=c.label||"";for(const [re,h,p] of ANAT_CHAP)if(re.test(n))return [h,p];return [({chest:"heart",abdomen:"belly",neck:"neck",back:"spine"})[c.ref[0]]||"table",""];}
    case "finding":{const l=FIND_CHAP[c.ref[0]];const r=l&&l[c.ref[1]];return r||[SYS_HALL[c.sys]||"table",""];}
  }
  return null;}
/* find a chapter in a hall by title pattern(s); falls back to the first chapter of the hall */
function chapByTitle(h,re,re2){const cs=(typeof OUTLINE!=="undefined"&&OUTLINE[h])||[];if(!cs.length)return -1;
  for(const r of [re,re2])if(r){const rx=new RegExp(r,"i");const i=cs.findIndex(c=>rx.test(c.t));if(i>=0)return i;}
  return 0;}
function cardHall(c){
  if(c.hall&&HALL[c.hall])return c.hall;
  const ch=cardChapter(c);if(ch)return ch[0];
  switch(c.type){
    case "think":case "verdict":case "mech":case "snsp":case "teach":return signHall(c.ref)||SYS_HALL[c.sys]||"table";
    case "twhy":case "terr":return techHall(c.ref[0])||"mind";
    case "sound":return c.sys==="cvs"?"heart":"lungs";
    case "hlr":case "red":return presHall(Array.isArray(c.ref)?c.ref[0]:c.ref);
  }
  const r=cardRule(c);if(r&&HALL[r[0]])return r[0];
  return SYS_HALL[c.sys]||"table";
}
/* chapter claims: chapter "cards" lists, then the rules. Returns [hall, index] or null. */
let _CLAIM=null;
function chapterClaims(){if(_CLAIM)return _CLAIM;const m={};if(typeof OUTLINE==="undefined")return m;
  for(const [h,cs] of Object.entries(OUTLINE))cs.forEach((c,i)=>(c.cards||[]).forEach(k=>{(m[k]=m[k]||[]).push([h,i]);}));return _CLAIM=m;}
function cardChapter(c){
  const cl=chapterClaims();if(cl[c.id])return cl[c.id][0];
  for(const k in cl)if(k.endsWith(":")&&c.id.startsWith(k))return cl[k][0];
  const r=cardRule(c);if(!r)return null;const [h,re,re2,ix]=r;if(!HALL[h])return null;if(ix!=null&&OUTLINE[h]&&OUTLINE[h][ix])return [h,ix];const i=chapByTitle(h,re,re2);return i<0?null:[h,i];}
function hallSigns(h){return Object.keys(SIGNS).filter(k=>!SIGNS[k].hide&&signHall(k)===h);}
function hallTech(h){return typeof TECH==="undefined"?[]:TECH.filter(t=>techHall(t)===h);}
function hallPres(h){return HIST.pres.filter(p=>presHall(p)===h);}
/* card → hall, cached once per card build */
let _CH=null,_CHN=-1;
function cardHallMap(){if(!CARDS)buildCards();if(_CH&&_CHN===CARDS.length)return _CH;_CH={};CARDS.forEach(c=>_CH[c.id]=cardHall(c));_CHN=CARDS.length;return _CH;}
function hallCardIds(h){const m=cardHallMap();return CARDS.filter(c=>m[c.id]===h).map(c=>c.id);}
function masteryOf(ids){if(!ids.length)return {pct:0,seen:0,n:0,held:0};let m=0,seen=0,held=0;ids.forEach(id=>{const r=Store.s.srs[id];if(r){seen++;if(r.iv>=7){m++;held++;}else if(r.iv>=2)m+=.4;}});return {pct:m/ids.length,seen,n:ids.length,held};}
function hallMastery(h){return masteryOf(hallCardIds(h));}
