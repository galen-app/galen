"use strict";
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
