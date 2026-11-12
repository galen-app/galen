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
 intro:["A dissected heart lies in a dish of brine under the candles. For fourteen centuries students were told that blood seeped through invisible pores in its septum, as I taught. Nobody could find the pores; they found them anyway.",
 "In 1628 an Englishman trained in this very theatre counted, measured and tied off arms, and the blood went round. Here you learn to hear what Harvey saw: the pulse, the impulse, the sounds and the silences between them."]},
{id:"vessels",rn:"II",n:"Hall of Vessels",short:"Vessels",la:"Aula Vasorum",patron:"Stephen Hales",sys:"cvs",tint:"rgb(60 90 160 / .12)",
 maxim:["Sanguis numquam quiescit.","The blood never rests."],
 intro:["Glass tubes hang on the wall of this hall, taller than a man. In 1733 a country parson tied a mare down, opened the artery of her leg into one of them, and watched the blood climb past eight feet.",
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
 intro:["In the Alpine valleys, whole villages once carried goitres the size of fists, and children were born who never grew. A Swiss surgeon took out thousands of thyroids and then noticed what happened to the patients who lost all of theirs.",
 "This hall holds the thyroid, the lymph nodes, the parathyroids and their twitching signs. A swallow, a stethoscope on the gland, a tap on the cheek."]},
{id:"senses",rn:"VI",n:"Hall of the Senses",short:"Senses",la:"Aula Sensuum",patron:"Hermann von Helmholtz",sys:"hn",tint:"rgb(60 120 120 / .12)",
 maxim:["Oculus animi index.","The eye is the index of the mind."],
 intro:["The retina was the only living vessel no one could see until 1851, when a young physiologist stacked plates of glass and a candle and looked in. Von Graefe, the great eye surgeon, is said to have cried that a new world had been opened.",
 "Eye, ear, nose and throat: the instruments that frighten students most and reward them most. Here you learn to hold them properly, and why each step is where it is."]},
{id:"cranial",rn:"VII",n:"Hall of the Twelve Roads",short:"Cranial",la:"Aula Nervorum",patron:"Thomas Willis",sys:"neuro",tint:"rgb(110 100 60 / .12)",
 maxim:["Duodecim viae.","Twelve roads."],
 intro:["I counted seven pairs of nerves leaving the brain, and I was proud of the number. Willis counted nine in 1664, with drawings by the man who later built St Paul's Cathedral. Soemmerring settled on twelve in 1778. I was not entirely wrong; I was merely early.",
 "Pupils, fields, eye movements, the face, the swallow, the dizzy patient. Each road has a toll-gate where a lesion gives itself away."]},
{id:"mind",rn:"VIII",n:"Hall of Mind and Motion",short:"Motion",la:"Aula Motus",patron:"Joseph Babinski",sys:"neuro",tint:"rgb(70 70 120 / .14)",
 maxim:["Ex motu, sedes.","From the movement, the seat of the lesion."],
 intro:["Charcot's Paris was full of patients whose paralysis came and went, and no one could tell the real from the hysterical. In 1896 his pupil stroked the sole of a foot and watched the great toe rise.",
 "Power, tone, reflexes, sensation, coordination, gait and the conscious level. Neurology rewards the methodical and punishes the hurried."]},
{id:"spine",rn:"IX",n:"Hall of the Column",short:"Spine",la:"Aula Spinae",patron:"Percivall Pott",sys:"msk",tint:"rgb(140 120 90 / .12)",
 maxim:["Columna vitae.","The column of life."],
 intro:["A London surgeon gave his name to tuberculosis of the spine, and in 1775 noticed that boys sent up chimneys grew cancers of the scrotum. It was the first occupational cancer ever described, long before anyone knew what soot contained.",
 "Back pain, the trapped root, the cord in danger and the cauda equina that must never be missed. Most backs need reassurance; a few need a scanner tonight."]},
{id:"arm",rn:"X",n:"Hall of the Hand",short:"Hand",la:"Aula Manus",patron:"Jules Tinel",sys:"msk",tint:"rgb(160 90 60 / .12)",
 maxim:["Manus instrumentum instrumentorum.","The hand is the instrument of instruments."],
 intro:["In 1915 the trenches sent back young men with shattered arms. In Paris and in Germany two doctors, on opposite sides of the war, both tapped over regrowing nerves and felt the patients flinch with tingling.",
 "Shoulder, elbow, wrist and hand, and the three nerves that run through them. The hand is the instrument you examine with; learn to examine it."]},
{id:"leg",rn:"XI",n:"Hall of the Gait",short:"Leg",la:"Aula Pedis",patron:"Friedrich Trendelenburg",sys:"msk",tint:"rgb(110 120 60 / .12)",
 maxim:["Solvitur ambulando.","It is solved by walking."],
 intro:["Before ether, a leg came off in under three minutes or the patient died of the shock. Surgeons were praised for speed, not care. Since 1846 we have had time to think, and the knee and ankle deserve it.",
 "Hip, knee, ankle and foot, the rules that spare X-rays, and the walk itself, which tells you more than any single test."]},
{id:"skin",rn:"XII",n:"Hall of the Skin",short:"Skin",la:"Aula Cutis",patron:"Robert Willan",sys:"derm",tint:"rgb(170 110 80 / .12)",
 maxim:["Cutis speculum corporis.","The skin is the mirror of the body."],
 intro:["Until a Quaker physician sorted rashes by their shape between 1798 and 1808, every eruption had a dozen names and none of them helped. He fixed what papule, vesicle and pustule mean, and the words still work.",
 "Here are the plates, the vocabulary, and the rashes that can kill by morning. Describe first; name second."]}
];
const HALL=Object.fromEntries(HALLS.map(h=>[h.id,h]));

/* ---- membership ---- */
const HALL_SIGNS={
 vessels:"pedal-pulses oedema homans carotid-bruit abi wells-dvt radio-femoral bp-arms aaa-palp abd-bruit plr",
 neck:"lymph-supraclav thyroid-palp pemberton hyperthyroid-signs hypothyroid-signs trousseau chvostek lymph-nodes",
 mind:"battle",
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
function signHall(id){const s=typeof SIGNS!=="undefined"&&SIGNS[id];if(_SH[id])return _SH[id];if(!s)return null;if(s.reg&&REG_HALL[s.reg])return REG_HALL[s.reg];return SYS_HALL[s.sys]||"table";}
const TECH_HALL_GROUP={"Ear, nose and eye":"senses","Peripheral nerve":"arm","Sensory":"mind","Reflexes and tone":"mind","Coordination and gait":"mind","Vestibular and eye movements":"cranial","Meninges and functional":"mind"};
const TECH_HALL_ID={"swinging-torch":"cranial","confrontation-fields":"cranial","eye-movements":"cranial"};
function techHall(t){if(typeof t==="string")t=(typeof TECH!=="undefined")&&TECH.find(x=>x.id===t);if(!t)return null;return TECH_HALL_ID[t.id]||TECH_HALL_GROUP[t.group]||"mind";}
const PRES_HALL={};/* filled lazily: by the presentation's system, with a few turned towards a finer hall */
const PRES_HINT=[[/back/i,"spine"],[/joint|knee|ankle|limp|hip/i,"leg"],[/hand|wrist|shoulder|arm/i,"arm"],[/neck lump|thyroid|lump in the neck|goitre/i,"neck"],[/red eye|vision|visual|\bears?\b|hearing|sore throat|\bnose\b/i,"senses"],[/dizz|vertigo|diplopia|double vision|facial/i,"cranial"],[/leg swell|calf|claudication/i,"vessels"],[/rash|itch|skin/i,"skin"]];
function presHall(p){if(typeof p==="string")p=HIST.pres.find(x=>x.id===p);if(!p)return "table";if(PRES_HALL[p.id])return PRES_HALL[p.id];
  let h=null;for(const [re,hh] of PRES_HINT)if(re.test(p.name)){h=hh;break;}
  return PRES_HALL[p.id]=h||SYS_HALL[p.sys]||"table";}
function cardHall(c){
  switch(c.type){
    case "think":case "verdict":case "mech":case "snsp":case "teach":return signHall(c.ref)||SYS_HALL[c.sys]||"table";
    case "twhy":case "terr":return techHall(c.ref[0])||"mind";
    case "sound":return c.sys==="cvs"?"heart":"lungs";
    case "area":return "heart";case "zone":return "lungs";
    case "anat":return {chest:"heart",abdomen:"belly",neck:"neck",back:"spine"}[c.ref[0]]||SYS_HALL[c.sys];
    case "cranial":return "cranial";
    case "myo":case "reflex":case "derm":return "mind";
    case "rootnerve":return "arm";
    case "dterm":case "dplate":return "skin";
    case "hlr":case "red":return presHall(Array.isArray(c.ref)?c.ref[0]:c.ref);
    case "finding":return SYS_HALL[c.sys]||"table";
    default:return SYS_HALL[c.sys]||"table";
  }
}
function hallSigns(h){return Object.keys(SIGNS).filter(k=>!SIGNS[k].hide&&signHall(k)===h);}
function hallTech(h){return typeof TECH==="undefined"?[]:TECH.filter(t=>techHall(t)===h);}
function hallPres(h){return HIST.pres.filter(p=>presHall(p)===h);}
function hallMastery(h){if(!CARDS)buildCards();const cs=CARDS.filter(c=>cardHall(c)===h);if(!cs.length)return {pct:0,seen:0,n:0};
  let m=0,seen=0;cs.forEach(c=>{const r=Store.s.srs[c.id];if(r){seen++;if(r.iv>=7)m++;else if(r.iv>=2)m+=.4;}});return {pct:m/cs.length,seen,n:cs.length};}

/* ---- Galen's voice: demanding, a little vain, fair; the sting always ends with the fix ---- */
const GALEN={
 morning:[["Mane surgendum.","Up early. The sick do not wait for you to wake."],["Nulla dies sine linea.","Not a day without a line. Begin."],[null,"Morning. In Pergamon I had dissected an ape before breakfast."],[null,"The light is good. Use it before the ward eats your day."]],
 afternoon:[["Festina lente.","Make haste slowly. One sign, properly."],[null,"Afternoon. A short round now beats a long one never."],["Repetitio mater studiorum.","Repetition is the mother of learning."],[null,"I lectured in the Temple of Peace in Rome. You have a phone. Fewer excuses."]],
 evening:[["Docendo discimus.","We learn by teaching. Explain one sign aloud tonight."],[null,"Evening. The candles are lit. Something short and sharp."],["Experientia docet.","Experience teaches, but only those who look back at it."],[null,"Review what you saw today, while it is still warm."]],
 night:[[null,"The lucubration hour. Hippocrates slept at this time. You should consider it."],["Vigilate.","Keep watch. But briefly: a tired brain stores nothing."],[null,"Night watch. Three cards, then sleep. I am not asking."]],
 afterNight:[[null,"You have been up all night. Three items, then sleep. That is an order, not advice."],[null,"After a night shift, memory is a leaking jar. Keep today light."]],
 first:[[null,"So. Another student. I am Galen of Pergamon, physician to emperors. Sit, look, and do not touch anything yet."]],
 back:[[null,"You were away. The signs did not forget you; you forgot them. We begin again, gently."],[null,"Ah. You return. The gladiators of Pergamon trained daily. Shall we?"]],
 right:[[null,"Correct."],[null,"Adequate."],[null,"Good. Again tomorrow and I may believe you."],[null,"Yes. Even Vesalius would nod."],[null,"Right. Now say why."],[null,"That is how it is done."],[null,"Better."]],
 wrong:[[null,"No. A first-year would not miss this."],[null,"No. Read the reason, then try again."],[null,"Wrong. Look again; the fix is below."],[null,"That is my kind of error: confident. Read it."],[null,"No. Slower this time."],[null,"Wrong, and that is how you learn. Read why."]],
 done:[[null,"Enough for today. What you did will be there tomorrow."],["Bene.","Well done. I do not say it often."],[null,"Finished. Go and examine a real patient."]],
 idle:[["Mortui vivos docent.","The dead teach the living. That is the motto over this theatre's door."],["Hic locus est ubi mors gaudet succurrere vitae.","This is the place where death delights to help the living."],[null,"Nearly three million of my words survive. You can manage one sign."],["Optimus medicus philosophus.","The best physician is also a philosopher. I wrote a book saying so."],[null,"Look at the patient before the monitor. The monitor has never been ill."],["Primum non nocere.","First, do no harm. It is not in the Hippocratic oath, by the way. Look it up."],[null,"I bled patients. I was wrong about that. The evidence won, and it should."],["Audi, vide, tace.","Listen, look, and keep quiet until you are sure."]],
 hall:{
  table:[null,"Here is the patient, whole. Every hall borrows from this table."],
  heart:[null,"Harvey studied here and then proved me wrong about the blood. I have forgiven him. Mostly."],
  vessels:[null,"A parson and a mare taught the world blood pressure. Do not look so surprised."],
  lungs:[null,"Laennec's wooden tube made doctors listen. Most still listen badly. Not you."],
  belly:[null,"Inspect. Then touch. Then press. In that order, or the belly closes its doors to you."],
  neck:[null,"A small gland can ruin a whole life. Palpate it from behind, gently."],
  senses:[null,"The ophthalmoscope frightens students. It is only a light and a hole. Hold it properly."],
  cranial:[null,"I counted seven pairs. There are twelve. We do not speak of it."],
  mind:[null,"Neurology punishes the hurried. Take your time and test both sides."],
  spine:[null,"Most backs need reassurance. A few need a scanner tonight. Learn which."],
  arm:[null,"The hand examines everything else. Examine it."],
  leg:[null,"Watch them walk before you touch them. The gait tells half the story."],
  skin:[null,"Describe first. Name second. Guess never."]
 },
 lore:[null,"History is a list of confident men who were wrong. Read it, and stay humble."]
};
function galenPick(arr,seed){if(!arr||!arr.length)return [null,""];const i=seed==null?Math.floor(Math.random()*arr.length):Math.abs(seed)%arr.length;return arr[i];}

/* ---- easter eggs: found ones are kept in Store.s.notes["egg:<id>"] (merges per record) ---- */
const EGGS=[
 {id:"apes",hint:"The medallion does not like to be poked.",t:"The Barbary apes",x:"Very well. In Rome no one could open a human body, so I opened Barbary macaques, pigs and oxen, and wrote what I found as if it were human. For thirteen centuries no one checked. Then Vesalius did. Do not mention him."},
 {id:"rete",hint:"Search for a wonderful net.",t:"The rete mirabile",x:"The 'wonderful net' of vessels at the base of the brain. It exists, I promise you. In oxen. Vesalius looked for it in a man and found nothing. I may have been generous in assuming you were built like cattle."},
 {id:"humours",hint:"Ask about the four.",t:"The four humours",x:"Blood, phlegm, yellow bile, black bile. Fourteen centuries of physicians bled, purged and starved patients to balance them, on my authority. Then came the microscope, the germ and the trial. I was magnificent, and I was wrong."},
 {id:"skull",hint:"Something on the table is looking at you.",t:"Memento mori",x:"The skull on the table belonged to someone who never consented to teach you. Before the Anatomy Act of 1832, many such bodies came from the gallows or the grave. Learn well enough to deserve them."},
 {id:"ape",hint:"Someone small is hiding in the engraving.",t:"My best teacher",x:"Shh. He is a Barbary macaque. Half of what medicine believed about the human body until 1543 was really about him."},
 {id:"konami",hint:"The old code, on keys or a controller.",t:"The theatre at night",x:"↑↑↓↓←→←→ B A. So, you are a gamer as well as a physician. The candles are yours tonight."},
 {id:"night",hint:"Open the theatre in the small hours.",t:"Lucubration",x:"Working by lamplight: lucubratio. The Romans thought it noble. Your hippocampus thinks it is a disaster. Go to bed."},
 {id:"vesalius",hint:"Say the name I will not say.",t:"That name",x:"Andreas Vesalius, 1543, De humani corporis fabrica. Twenty-eight years old and he corrected some two hundred of my errors. He was right. I will not say it twice."},
 {id:"galen",hint:"Call me by name.",t:"You called?",x:"Claudius Galenus, born in Pergamon in 129. Surgeon to gladiators, physician to Marcus Aurelius, author of more surviving words than any other ancient writer. Yes, I am still here."},
 {id:"paper",hint:"Search for what Laennec rolled.",t:"A quire of paper",x:"Paris, 1816. A young woman with heart disease, a physician too shy to put his ear to her chest, and a rolled sheaf of paper. It carried the heart sounds better than an ear ever had. The stethoscope began as embarrassment."},
 {id:"birthday",hint:"Visit on the birthday of a man with a famous toe.",t:"Babinski's birthday",x:"Joseph Babinski was born in Paris on 17 November 1857. Today, stroke a sole in his honour. Gently: it is a reflex, not a tickle contest."},
 {id:"oath",hint:"Hold the serpent in the corner.",t:"The first line",x:"Ὁ βίος βραχύς, ἡ δὲ τέχνη μακρή. Life is short, the art long, opportunity fleeting, experience misleading, judgement difficult. The first aphorism of Hippocrates. Every word is still true."}
];
const BIRTHDAYS={"17/11":["Babinski","Joseph Babinski was born today in 1857. Stroke a sole in his honour."],"17/02":["Laennec","René Laennec was born today in 1781. Listen to a chest properly."],"01/04":["Harvey","William Harvey was born today in 1578. The blood still goes round."],"31/12":["Vesalius","Vesalius was born today in 1514. I suppose I should say something kind."],"01/07":["Semmelweis","Ignaz Semmelweis was born today in 1818. Wash your hands, and think of him."],"12/05":["Nightingale","Florence Nightingale was born today in 1820. She counted the dead and changed the army."],"27/12":["Pasteur","Louis Pasteur was born today in 1822. The germ won the argument."],"17/05":["Jenner","Edward Jenner was born today in 1749. Smallpox is gone; remember who started it."]};
