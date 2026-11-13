"use strict";
/* ---- Galen's voice: demanding, a little vain, fair; the sting always ends with the fix ----
   A line is [latin|null, english, short?]. "short" (18 characters or fewer) is what the top bar shows on a
   narrow screen; the full English goes to the ribbon, the reference pane and screen readers.
   Every "wrong" line ends with what to do next. No national or personal roasts. Latin is attested or grammatical.
   Old keys (morning ... hall, lore) keep their shape for older callers; new pools sit beside them. */
const GALEN={
 morning:[["Mane surgendum.","One must rise early. The sick do not wait for you to wake."],["Nulla dies sine linea.","Not a day without a line. Begin with one card."],[null,"Morning. In Pergamon I had dissected an ape before breakfast. One sign will do for you."],[null,"The light is good. Use it before the ward eats your day."],["Labor omnia vincit.","Work conquers everything. Ten minutes of it, now."]],
 afternoon:[["Festina lente.","Make haste slowly. One sign, properly."],[null,"Afternoon. A short round now beats a long one never."],["Repetitio mater studiorum.","Repetition is the mother of learning. Review first, then something new."],[null,"I lectured in the Temple of Peace in Rome. You have a phone. Fewer excuses."]],
 evening:[["Docendo discimus.","We learn by teaching. Explain one sign aloud tonight."],[null,"Evening. The candles are lit. Something short and sharp."],["Experientia docet.","Experience teaches, but only those who look back at it. Review today's cards."],[null,"Review what you saw today, while it is still warm."]],
 night:[[null,"The lucubration hour. Hippocrates slept at this time. You should consider it."],["Vigilate.","Keep watch. But briefly: a tired brain stores little. Three cards, then sleep."],[null,"Night watch. Three cards, then sleep. I am not asking."],["Nunc dormiendum est.","Now one must sleep. Sleep is when today's cards are filed away."]],
 afterNight:[[null,"You have been up all night. Three items, then sleep. That is an order, not advice."],[null,"After a night shift, memory is a leaking jar. Keep today light, and sleep first if you can."],["Medice, cura te ipsum.","Physician, heal thyself. A short round, water, then bed."]],
 first:[[null,"So. Another student. I am Galen of Pergamon, physician to emperors. Sit. We begin at the table."]],
 back:[[null,"You were away. The signs did not forget you; you forgot them. We begin again, gently, with what is due."],[null,"Ah. You return. The gladiators of Pergamon trained daily. Shall we? Start with today's reviews."],["Dum spiro, spero.","While I breathe, I hope. You came back; that is the hard part. Ten minutes."]],
 backLong:[[null,"A long absence. Do not try to catch up in a day. Clear ten reviews, then stop."],["Gutta cavat lapidem.","The drop hollows the stone, not the flood. A little every day, starting now."]],
 right:[[null,"Correct.","Correct."],[null,"Adequate. Now say why, aloud.","Adequate."],[null,"Good. Again tomorrow and I may believe you.","Good."],[null,"Yes. Even Vesalius would nod.","Vesalius nods."],[null,"Right. Now say why.","Now say why."],[null,"That is how it is done.","That is how."],[null,"Better.","Better."],["Recte.","Correctly done. Keep the reason, not just the answer.","Recte."],["Optime.","Very good. Do not let it go to your head.","Optime."]],
 wrong:[[null,"No. A first-year misses this too; read the reason and you will not.","No. Read why."],[null,"No. Read the reason, then try the next one.","Read the reason."],[null,"Wrong. Look again; the fix is just below.","The fix is below."],[null,"That is my kind of error: confident. Read the reason before the next card.","Too sure. Read why."],[null,"No. Slower this time: read the whole question before the options.","No. Slower."],[null,"Wrong, and that is how you learn. Read why it is wrong.","Read why."],["Errare humanum est.","To err is human. Read the reason, and the next one is yours.","Read the reason."],["Non ita.","Not so. The explanation below is the lesson; take it.","Not so. Read on."],[null,"I was wrong for fifteen centuries. You can be wrong for one card. Read why.","Read why below."]],
 /* answers in context */
 streak3:[[null,"Three in a row. Do not get comfortable.","Three in a row."],["Gutta cavat lapidem.","The drop hollows the stone. Three in a row; keep dripping.","Three. Go on."]],
 streak5:[[null,"Five straight. I begin to take you seriously.","Five straight."],["Vincit qui patitur.","He conquers who endures. Five in a row.","Five in a row."]],
 streak10:[["Macte virtute.","Ten in a row. Well done, and I do not say it lightly.","Ten. Macte!"],[null,"Ten without a miss. Now make the next one harder: say the likelihood ratio too.","Ten straight."]],
 broke:[[null,"The run ends here. Read why, then start a new one.","Run over. Read why."],[null,"Pride before the fall, as the proverb says. Read the reason and build again.","Read why. Rebuild."]],
 slump:[["Festina lente.","Three misses. Make haste slowly: read each explanation in full before the next card.","Slow down. Read."],[null,"Three wrong in a row. That is a pattern, not bad luck. Open the sign's page after this card.","A pattern. Read."]],
 comeback:[["Per aspera ad astra.","Through hardship to the stars. That is the one that counts.","Back on track."],[null,"There. You read the reason and it worked.","There it is."],[null,"Recovered. Two misses and then this: that is learning, visibly.","Recovered."]],
 rightNight:[[null,"Correct, even after a night. A few more, then sleep.","Correct. Then sleep."],[null,"Good, for a brain that has been awake since yesterday. Stop while it is good.","Good. Now rest."]],
 wrongNight:[[null,"Wrong, and you have been up all night. Read why, then go to bed: sleep is when memory is made.","Read why. Sleep."],[null,"No. Tired brains guess. Read the reason, then stop for today.","Read why. Stop."]],
 done:[[null,"Enough for today. What you did will be there tomorrow."],["Bene.","Well done. I do not say it often."],[null,"Finished. Go and examine a real patient."]],
 idle:[["Mortui vivos docent.","The dead teach the living. A motto carved over many anatomy theatres.","The dead teach."],["Hic locus est ubi mors gaudet succurrere vitae.","This is the place where death delights to help the living. Another anatomists' motto.","Death helps life."],[null,"Nearly three million of my words survive. You can manage one sign.","Manage one sign."],["Quod optimus medicus sit quoque philosophus.","That the best physician is also a philosopher. I wrote a book with that title.","Also a philosopher."],[null,"Look at the patient before the monitor. The monitor has never been ill.","Look at the patient."],["Primum non nocere.","First, do no harm. It is not in the Hippocratic oath, by the way. Look it up.","Do no harm."],[null,"I bled patients. I was wrong about that. The evidence won, and it should.","The evidence won."],["Audi, vide, tace.","Listen, look, and keep quiet until you are sure.","Listen. Look."],["Ars longa, vita brevis.","The art is long, life short. So, one card now rather than ten later.","One card now."]],
 /* Galen concedes: the old authority bows to measurement */
 concede:[[null,"I taught that the liver makes blood and the body uses it up. Harvey measured it, and it goes round. Measurement beats authority.","Harvey measured."],[null,"I said blood seeps through pores in the septum. There are none. Ibn al-Nafis said so in the thirteenth century; he was right.","No septal pores."],[null,"I wrote sixteen books on the pulse. One ECG strip says more about rhythm. I concede.","The ECG wins."],["Contraria contrariis curantur.","Opposites cure opposites: my rule. The randomised trial is a better one.","Trials beat rules."],[null,"I found a wonderful net under the brain. In oxen. Check your anatomy on the species in front of you.","Check the species."],[null,"Surgeons praised 'laudable pus' for centuries, some of them citing me. Lister and the germ said otherwise. Keep wounds clean.","Keep wounds clean."],[null,"A likelihood ratio would have saved me a great deal of rhetoric. Learn the number, then use it.","Learn the LR."]],
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
 /* several lines per hall; galenSay(hall) rotates through them by day, the first is the classic */
 halls:{
  table:[[null,"Look, ask, then touch. In that order, every time."],[null,"Count the breathing rate for a full thirty seconds; never guess it."],["Medicus curat, natura sanat.","The physician treats, nature heals. Your job is to notice when nature is losing."]],
  heart:[[null,"Listen lying flat, then on the left side, then sitting forward in held expiration. Murmurs hide in different postures."],[null,"I believed blood crossed the septum through pores. Ibn al-Nafis denied it in the thirteenth century. He was right."],["Cor animalium fundamentum est vitae.","The heart of animals is the foundation of their life. Harvey wrote that. Listen to it properly."]],
  vessels:[[null,"Feel both radial pulses together. A delay or a difference is a story worth reading."],[null,"Use a cuff that fits. Too small and the pressure reads falsely high."]],
  lungs:[[null,"An innkeeper's son tapped wine barrels and gave us percussion. Auenbrugger, 1761. Tap like him."],[null,"Count the breaths without announcing it. People breathe differently when watched."]],
  belly:[[null,"Watch the face, not your hand, while you palpate. Pain shows there first."],["Ubi pus, ibi evacua.","Where there is pus, let it out. Surgeons have said it for centuries; it is still true."]],
  neck:[[null,"Ask them to swallow while you watch. A thyroid rises with the swallow."],[null,"Feel the lymph nodes in order, every group, both sides. The one you skip is the one that matters."]],
  senses:[[null,"Helmholtz made his ophthalmoscope in 1851 from card, glue and glass. Yours is better. Use it."],[null,"Darken the room, and look at the patient's right eye with your right eye. Then swap."]],
  cranial:[[null,"Twelve pairs. Test them in the same order every time and you will miss none."],[null,"A pupil that is slow, big and new is an emergency until proved otherwise."]],
  mind:[[null,"Babinski stroked a sole in 1896 and gave neurology its most famous toe. Stroke firmly, not cruelly."],[null,"Compare left with right, always. Neurology is the art of the difference."]],
  spine:[[null,"Ask about the bladder and the saddle. Cauda equina hides behind a polite patient."],[null,"Night pain, weight loss, fever, a history of cancer: these are the backs that need more than reassurance."]],
  arm:[[null,"Tinel tapped the nerves of wounded soldiers in 1915. Tap gently: you want tingling, not a wince."],["Manus instrumentum instrumentorum.","The hand is the instrument of instruments. Look at both, palms up and palms down."]],
  leg:[[null,"The Ottawa rules, 1992: a few minutes of careful examination spare many X-rays."],["Solvitur ambulando.","It is solved by walking. Ask them to walk before anything else."]],
  skin:[[null,"Willan gave the skin a vocabulary around 1800. Macule, papule, vesicle: use the words, and others will see what you saw."],["Cutis speculum corporis.","The skin is the mirror of the body. Look at all of it, in good light."]]
 },
 lore:[null,"History is a list of confident men who were wrong. Read it, and stay humble."]
};
/* milestones: id, test kind, threshold, line. Kinds: cards (cards started), held (cards held a week or more), days (day streak). */
const GALEN_MS=[
 ["c1","cards",1,[null,"Your first card. Every physician I trained began with one."]],
 ["c10","cards",10,[null,"Ten cards started. A habit is forming; feed it daily."]],
 ["c50","cards",50,[null,"Fifty cards. You now carry more signs than many of my students did."]],
 ["c100","cards",100,["Centum.","One hundred cards. From now on the work is keeping them, not adding them."]],
 ["c250","cards",250,[null,"Two hundred and fifty. Read the reasons on the ones you miss; that is where the gains are."]],
 ["c500","cards",500,["Quingenti.","Five hundred cards. A ward round with you would be worth attending."]],
 ["c1000","cards",1000,["Mille.","A thousand cards. I wrote more words, but I never had to remember them all."]],
 ["h1","held",1,[null,"Your first card has held for a week. That is memory, not luck."]],
 ["h50","held",50,[null,"Fifty cards held for a week or more. They are yours now. Keep reviewing them."]],
 ["h250","held",250,[null,"Two hundred and fifty cards held. The theatre is beginning to belong to you."]],
 ["d3","days",3,[null,"Three days running. The beginning of a habit."]],
 ["d7","days",7,["Septem dies.","Seven days running. The habit has roots now."]],
 ["d30","days",30,[null,"Thirty days without a gap. Gladiators trained like this. So do good physicians."]],
 ["d100","days",100,["Centum dies.","One hundred days. I have nothing sharp to say. Well done."]]
];
function galenPick(arr,seed){if(!arr||!arr.length)return [null,""];const i=seed==null?Math.floor(Math.random()*arr.length):Math.abs(seed)%arr.length;return arr[i];}

/* ---- easter eggs: found ones are kept in Store.s.notes["egg:<id>"] (merges per record) ----
   Optional fields: lore (a codex story id to open), when (how it is found, for the marginalia list). */
const EGGS=[
 {id:"apes",hint:"The medallion does not like to be poked.",t:"The Barbary apes",x:"Very well. In Rome no one could open a human body, so I opened Barbary macaques, pigs and oxen, and wrote what I found as if it were human. For some thirteen centuries hardly anyone dared to contradict me. Then Vesalius did. Do not mention him.",lore:"vesalius"},
 {id:"rete",hint:"Search for a wonderful net.",t:"The rete mirabile",x:"The 'wonderful net' of vessels at the base of the brain. It exists, I promise you. In oxen. Vesalius looked for it in a man and found nothing. I may have been generous in assuming you were built like cattle."},
 {id:"humours",hint:"Search for the four.",t:"The four humours",x:"Blood, phlegm, yellow bile, black bile. For more than fifteen hundred years physicians bled, purged and starved patients to balance them, on my authority. Then came the microscope, the germ and the trial. I was magnificent, and I was wrong.",lore:"humours"},
 {id:"skull",hint:"Something on the table is looking at you.",t:"Memento mori",x:"The skull on the table belonged to someone who never consented to teach you. In Britain before the Anatomy Act of 1832, many such bodies came from the gallows or the grave. Learn well enough to deserve them.",lore:"burke-hare"},
 {id:"ape",hint:"Someone small is hiding in the engraving.",t:"My best teacher",x:"Shh. He is a Barbary macaque. Much of what medicine believed about the human body until 1543 was really about him."},
 {id:"konami",hint:"The old code, on keys or a controller.",t:"The theatre at night",x:"↑↑↓↓←→←→ B A. So, you are a gamer as well as a physician. The candles are yours tonight. Enter the code again to snuff them."},
 {id:"night",hint:"Open the theatre in the small hours, after midnight.",t:"Lucubration",x:"Working by lamplight: lucubratio. The Romans thought it noble. Your hippocampus thinks it is a disaster. Go to bed."},
 {id:"vesalius",hint:"Say the name I will not say.",t:"That name",x:"Andreas Vesalius, 1543, De humani corporis fabrica. Twenty-eight years old and he corrected some two hundred of my errors. He was right. I will not say it twice.",lore:"vesalius"},
 {id:"galen",hint:"Call me by name.",t:"You called?",x:"Galen of Pergamon, born there around 129. Surgeon to gladiators, physician to Marcus Aurelius, author of more surviving words than any other ancient writer. Yes, I am still here.",lore:"galen-pergamon"},
 {id:"paper",hint:"Search for what Laennec rolled.",t:"A quire of paper",x:"Paris, 1816. A young woman with heart disease, a physician too shy to put his ear to her chest, and a rolled sheaf of paper. It carried the heart sounds better than an ear ever had. The stethoscope began as embarrassment.",lore:"laennec"},
 {id:"birthday",hint:"Visit on the birthday of a man with a famous toe.",t:"Babinski's birthday",x:"Joseph Babinski was born in Paris on 17 November 1857. Today, stroke a sole in his honour. Firmly, along the outer edge: it is a reflex, not a tickle contest.",lore:"babinski"},
 {id:"oath",hint:"Hold the serpent in the corner, or press and hold my portrait.",t:"The first line",x:"Ὁ βίος βραχύς, ἡ δὲ τέχνη μακρή. Life is short, the art long, opportunity fleeting, experience misleading, judgement difficult. The first aphorism of Hippocrates. Every word is still true."},
 /* new in 7.1, each grounded in the record */
 {id:"claudius",hint:"Search for a name I never had.",t:"Claudius, apparently",x:"Printers call me Claudius Galenus. No ancient text does. The forename seems to have been added in the Renaissance, probably a misunderstanding. Galen will do. So will 'sir'."},
 {id:"nafis",hint:"Search for the man from Damascus who closed my pores.",t:"Ibn al-Nafis",x:"Damascus-born, he worked in Cairo, and in the thirteenth century, commenting on Avicenna's Canon, he wrote that blood does not cross the septum of the heart: it goes from the right ventricle through the lungs to the left. Three centuries before Europe said it. The manuscript was found in a Berlin library in 1924. He read me carefully and called me wrong. He was right."},
 {id:"gladiators",hint:"Ten right answers in a row.",t:"Surgeon to the gladiators",x:"Pergamon, about 157. The high priest gave me his gladiators. By my own account five died while I had charge of them, against sixty under the man before me. You may doubt my numbers. Do not doubt the method: clean the wound, look into it, and come back the next day.",lore:"galen-pergamon"},
 {id:"pig",hint:"In the Hall of the Neck, poke me five times.",t:"The squealing pig",x:"Rome. A squealing pig on the table and a crowd of sceptical Roman notables. I cut the recurrent laryngeal nerves, and the pig fell silent while still struggling. The voice is governed by nerves from the brain, not by the heart, whatever the Stoics said. Mind those nerves when you examine a neck after thyroid surgery: ask about the voice."},
 {id:"lind",hint:"Open the theatre on 20 May.",t:"Twelve sailors",x:"On 20 May 1747, aboard HMS Salisbury, James Lind took twelve sailors with scurvy, kept their diet and quarters alike, and gave six pairs six remedies. The pair given oranges and lemons recovered fastest; one was fit for duty in six days. The Navy took nearly fifty years to listen. A fair comparison beats a famous opinion."},
 {id:"finis",hint:"Find every other note in the margin.",t:"The name, warmly",x:"Andreas Vesalius. There: I have said it twice. He corrected me because he had read me more closely than anyone alive. That is the highest compliment a teacher can be paid. You have read the margins as closely. Thank you.",when:"all"}
];
/* birthday lines: "dd/mm": [name, line, codex story id or null] */
const BIRTHDAYS={"17/11":["Babinski","Joseph Babinski was born today in 1857. Stroke a sole in his honour.","babinski"],"17/02":["Laennec","René Laennec was born today in 1781. Listen to a chest properly.","laennec"],"01/04":["Harvey","William Harvey was born today in 1578. The blood still goes round.","harvey"],"31/12":["Vesalius","Vesalius was born today in 1514. I suppose I should say something kind.","vesalius"],"01/07":["Semmelweis","Ignaz Semmelweis was born today in 1818. Wash your hands, and think of him.","semmelweis"],"12/05":["Nightingale","Florence Nightingale was born today in 1820. She counted the dead and changed the army.",null],"27/12":["Pasteur","Louis Pasteur was born today in 1822. The germ won the argument.",null],"17/05":["Jenner","Edward Jenner was born today in 1749. Smallpox is gone; remember who started it.","jenner"]};
