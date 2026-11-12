"use strict";
/* ================= GALEN 7: THE THEATRE =================
   Sound (generated, no files) · Galen the guide · the theatre home · halls · codex · reference pane · eggs · pad + keys.
   Device-only preferences (sound, text size) live in localStorage: a phone at work and a Steam Deck at home differ. */

IC.theatre='<path d="M3 21h18M4 21V10M20 21V10M2 10l10-6 10 6"/><path d="M8 21v-7M12 21v-7M16 21v-7M6 10h12"/>';
IC.scroll='<path d="M6 4h11a2 2 0 0 1 0 4H8v10a2 2 0 0 1-4 0V6a2 2 0 0 1 2-2z"/><path d="M8 8h9v10a2 2 0 0 1-2 2H6M11 12h4M11 15h3"/>';
IC.sound='<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>';
IC.mute='<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>';
IC.door='<path d="M6 21V9a6 6 0 0 1 12 0v12M4 21h16"/><circle cx="14.5" cy="14" r=".8"/>';
IC.pad='<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="16" cy="11.5" r="1"/><circle cx="18.5" cy="14" r="1"/>';

/* ---------- device preferences ---------- */
const TP=(()=>{const wide=matchMedia("(min-width:980px)").matches;const d={amb:wide?1:0,music:wide?1:0,tones:1,vol:.55,size:"m",seen:0};
  try{return Object.assign(d,JSON.parse(localStorage.getItem("galen.theatre")||"{}"));}catch(e){return d;}})();
function tpSave(){try{localStorage.setItem("galen.theatre",JSON.stringify(TP));}catch(e){}}
function applySize(){document.documentElement.dataset.size=TP.size||"m";}
applySize();

/* ================= SOUND: a candlelit room, a lute, and tones ================= */
const SND={ctx:null,bus:null,wet:null,ambG:null,musG:null,fxG:null,on:false,cache:{},timers:[],ducked:false,hallKey:"table",
  ensure(){
    if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
      try{const c=this.ctx=new AC();this.bus=c.createGain();this.bus.gain.value=TP.vol;
        const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;this.bus.connect(comp);comp.connect(c.destination);
        /* the theatre's wood and stone: a generated impulse */
        const conv=c.createConvolver(),len=c.sampleRate*2.2,ir=c.createBuffer(2,len,c.sampleRate);
        for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)*(i<c.sampleRate*.012?.3:1);}
        conv.buffer=ir;this.wet=c.createGain();this.wet.gain.value=.32;conv.connect(this.wet);this.wet.connect(this.bus);this.conv=conv;
        this.ambG=c.createGain();this.musG=c.createGain();this.fxG=c.createGain();
        [this.ambG,this.musG,this.fxG].forEach(g=>{g.connect(this.bus);g.connect(conv);});
        this.ambG.gain.value=0;this.musG.gain.value=.5;this.fxG.gain.value=.55;
      }catch(e){console.warn("theatre sound",e);this.ctx=null;return null;}}
    if(this.ctx.state==="suspended"&&!document.hidden){try{this.ctx.resume();}catch(e){}}
    return this.ctx;},
  noise(sec,brown){const c=this.ctx,n=Math.floor(c.sampleRate*sec),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let last=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;if(brown){last=(last+.02*w)/1.02;d[i]=last*3.2;}else d[i]=w;}return b;},
  /* Karplus–Strong plucked string, computed once per pitch: our lute */
  pluck(midi,dur=2.2,bright=.5){const k=midi+":"+dur+":"+bright;if(this.cache[k])return this.cache[k];const c=this.ctx,sr=c.sampleRate,f=440*Math.pow(2,(midi-69)/12);
    const N=Math.max(2,Math.round(sr/f)),len=Math.floor(sr*dur),b=c.createBuffer(1,len,sr),y=b.getChannelData(0);
    let p=0;for(let i=0;i<N;i++){const w=Math.random()*2-1;p=p*(1-bright)+w*bright;y[i]=p;}
    const dec=.996-Math.max(0,(midi-60))*.0006;for(let i=N;i<len;i++)y[i]=dec*.5*(y[i-N]+y[i-N-1]);
    for(let i=0;i<len;i++)y[i]*=Math.min(1,i/40);return this.cache[k]=b;},
  play(buf,t,gain,dest,rate=1){const c=this.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=buf;s.playbackRate.value=rate;g.gain.value=gain;s.connect(g);g.connect(dest);s.start(t);return s;},
  lute(midi,t,gain=.35,dur=2.2){const c=this.ctx;if(!this.body){const a=c.createBiquadFilter();a.type="peaking";a.frequency.value=240;a.gain.value=5;a.Q.value=1.2;
      const b=c.createBiquadFilter();b.type="lowpass";b.frequency.value=3200;a.connect(b);b.connect(this.musG);this.body=a;}
    this.play(this.pluck(midi,dur,.55),t,gain,this.body);},
  /* ambience */
  startAmb(){if(!this.ensure()||this.ambOn)return;const c=this.ctx;this.ambOn=true;
    const room=c.createBufferSource();room.buffer=this.noise(6,true);room.loop=true;const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=320;
    const rg=c.createGain();rg.gain.value=.16;room.connect(lp);lp.connect(rg);rg.connect(this.ambG);room.start();this.room=room;
    /* drone: two detuned voices per chord tone, very slow swell */
    const drone=c.createGain();drone.gain.value=.0;const dl=c.createBiquadFilter();dl.type="lowpass";dl.frequency.value=700;drone.connect(dl);dl.connect(this.ambG);this.drone=drone;this.droneOsc=[];
    for(let i=0;i<6;i++){const o=c.createOscillator();o.type=i%2?"triangle":"sine";o.detune.value=(i%2?6:-6);const g=c.createGain();g.gain.value=.05;o.connect(g);g.connect(drone);o.start();this.droneOsc.push(o);}
    this.setChord(0);drone.gain.setTargetAtTime(.5,c.currentTime,4);
    const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.05;lg.gain.value=.18;lfo.connect(lg);lg.connect(drone.gain);lfo.start();this.lfo=lfo;
    let ci=0;this.timers.push(setInterval(()=>{ci++;this.setChord(ci);},15000));
    /* candle crackle and the odd creak of a bench */
    const crack=c.createBiquadFilter();crack.type="bandpass";crack.frequency.value=2600;crack.Q.value=.8;crack.connect(this.ambG);this.crack=crack;const nb=this.noise(.05,false);
    const tick=()=>{if(!this.ambOn)return;const t=c.currentTime;const n=Math.random()<.3?3:1;for(let i=0;i<n;i++)this.play(nb,t+i*.03+Math.random()*.02,.05+Math.random()*.1,crack,.6+Math.random()*.9);
      this.crT=setTimeout(tick,300+Math.random()*2600);};tick();
    const creak=()=>{if(!this.ambOn)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();f.type="bandpass";f.frequency.value=400;f.Q.value=6;
      o.type="sawtooth";o.frequency.setValueAtTime(70+Math.random()*30,t);o.frequency.linearRampToValueAtTime(55+Math.random()*20,t+.5);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.02,t+.15);g.gain.linearRampToValueAtTime(0,t+.6);
      o.connect(f);f.connect(g);g.connect(this.ambG);o.start(t);o.stop(t+.7);this.ckT=setTimeout(creak,20000+Math.random()*40000);};this.ckT=setTimeout(creak,9000);
    this.ambG.gain.setTargetAtTime(this.ducked?0:.55,c.currentTime,1.2);},
  stopAmb(){if(!this.ambOn)return;this.ambOn=false;const c=this.ctx;this.ambG.gain.setTargetAtTime(0,c.currentTime,.4);clearTimeout(this.crT);clearTimeout(this.ckT);this.timers.forEach(clearInterval);this.timers=[];
    setTimeout(()=>{try{this.room.stop();this.droneOsc.forEach(o=>o.stop());this.lfo.stop();}catch(e){}},1500);},
  /* each hall has its own tonal centre, so the room changes as you walk */
  HALL_ROOT:{table:50,heart:45,vessels:52,lungs:53,belly:55,neck:48,senses:46,cranial:50,mind:51,spine:43,arm:45,leg:48,skin:53},
  CHORDS:[[0,7,12,15,19,24],[-2,5,10,14,17,22],[-4,3,8,12,15,20],[-5,2,7,10,14,19]],
  setChord(i){if(!this.droneOsc)return;const r=this.HALL_ROOT[this.hallKey]||50,ch=this.CHORDS[i%this.CHORDS.length],t=this.ctx.currentTime;
    this.droneOsc.forEach((o,k)=>o.frequency.setTargetAtTime(440*Math.pow(2,(r+ch[k]-69-12)/12)*(k>3?2:1),t,2.5));},
  setHall(h){if(h===this.hallKey)return;this.hallKey=h;if(this.ambOn)this.setChord(0);},
  /* Greensleeves (anonymous, 16th century, public domain), as a lute would play it */
  GREEN:{mel:[[69,1],[72,2],[74,1],[76,1.5],[77,.5],[76,1],[74,2],[71,1],[67,1.5],[69,.5],[71,1],[72,2],[69,1],[69,1.5],[68,.5],[69,1],[71,2],[68,1],[64,2],[69,1],[72,2],[74,1],[76,1.5],[77,.5],[76,1],[74,2],[71,1],[67,1.5],[69,.5],[71,1],[72,1.5],[71,.5],[69,1],[68,1.5],[66,.5],[68,1],[69,3],[69,2],
      [79,3],[79,1.5],[78,.5],[76,1],[74,2],[71,1],[67,1.5],[69,.5],[71,1],[72,2],[69,1],[69,1.5],[68,.5],[69,1],[71,2],[68,1],[64,3],[79,3],[79,1.5],[78,.5],[76,1],[74,2],[71,1],[67,1.5],[69,.5],[71,1],[72,1.5],[71,.5],[69,1],[68,1.5],[66,.5],[68,1],[69,3]],
    bass:[45,48,43,40,45,40,40,45,45,48,43,40,45,40,45,45,43,40,43,40,45,40,40,40,43,40,43,40,45,40,45]},
  playTune(){if(!this.ensure()||this.tuneOn)return;const c=this.ctx,beat=.6;this.tuneOn=true;let t=c.currentTime+.4,acc=1,bar=0;
    const mel=this.GREEN.mel,bass=this.GREEN.bass;
    for(let i=0;i<mel.length;i++){const [m,d]=mel[i];this.lute(m,t,.32,Math.max(1.2,d*beat*2));
      if(i>0&&Math.abs(acc%3)<.01){const b=bass[bar++%bass.length];this.lute(b,t,.24,2.6);this.lute(b+7,t+beat*.5,.12,2);}
      acc+=d;t+=d*beat*(1+(Math.random()-.5)*.03);}
    setTimeout(()=>{this.tuneOn=false;},(t-c.currentTime)*1000+500);},
  startMusic(){if(this.musOn)return;this.musOn=true;const go=()=>{if(!this.musOn)return;if(!this.ducked&&!document.hidden)this.playTune();this.muT=setTimeout(go,150000+Math.random()*120000);};this.muT=setTimeout(go,6000);},
  stopMusic(){this.musOn=false;clearTimeout(this.muT);},
  /* feedback tones */
  fx(kind){if(!TP.tones||this.ducked)return;if(!this.ensure())return;const c=this.ctx,t=c.currentTime+.01;
    if(kind==="right"){this.lute(76,t,.4,1.4);this.lute(81,t+.11,.36,1.8);}
    else if(kind==="wrong"){this.play(this.pluck(40,1.2,.25),t,.45,this.fxG);const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(55,t+.25);g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g);g.connect(this.fxG);o.start(t);o.stop(t+.4);}
    else if(kind==="bell"||kind==="seal"){[1,2.76,5.4,8.93].forEach((r,i)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=392*r;g.gain.setValueAtTime(.18/(i+1),t);g.gain.exponentialRampToValueAtTime(.0005,t+3.2/(i*.6+1));o.connect(g);g.connect(this.fxG);o.start(t);o.stop(t+3.5);});
      if(kind==="seal"){[57,64,69,72].forEach((m,i)=>this.lute(m,t+.25+i*.09,.3,2.5));}}
    else if(kind==="page"){const s=this.play(this.noise(.28,false),t,.05,this.fxG,1);const f=c.createBiquadFilter();f.type="highpass";f.frequency.value=1800;}
    else if(kind==="door"){this.play(this.pluck(33,1.6,.15),t,.5,this.fxG);this.play(this.pluck(45,1.2,.2),t+.05,.2,this.fxG);}},
  duck(on){this.ducked=on;if(!this.ctx)return;const t=this.ctx.currentTime;this.bus.gain.setTargetAtTime(on?0:TP.vol,t,.15);},
  apply(){if(!TP.amb&&!TP.music&&!TP.tones){this.stopAmb();this.stopMusic();if(this.ctx)this.ctx.suspend().catch(()=>{});return;}
    if(!this.ensure())return;this.bus.gain.value=this.ducked?0:TP.vol;
    if(TP.amb)this.startAmb();else this.stopAmb();if(TP.music)this.startMusic();else this.stopMusic();}
};
/* unlock on the first gesture, as browsers require */
let _sndUnlocked=false;
["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,()=>{if(_sndUnlocked)return;_sndUnlocked=true;SND.apply();soundBtn();},{once:false,passive:true,capture:true}));
document.addEventListener("visibilitychange",()=>{if(!SND.ctx)return;if(document.hidden)SND.ctx.suspend().catch(()=>{});else if(TP.amb||TP.music||TP.tones)SND.ctx.resume().catch(()=>{});});
/* silent while a clinical sound plays: the stethoscope always wins */
{const _start=startBox,_stop=stopAll;
  startBox=function(box){SND.duck(true);return _start(box);};
  stopAll=function(){const r=_stop.apply(this,arguments);SND.duck(false);return r;};}
function soundBtn(){const b=$("#soundbtn");if(!b)return;const on=!!(TP.amb||TP.music);b.innerHTML=ic(on?"sound":"mute");b.setAttribute("aria-pressed",on);b.title=on?"Theatre sound on (M)":"Theatre sound off (M)";}
function toggleSound(){const on=!(TP.amb||TP.music);TP.amb=on?1:0;TP.music=on?1:0;tpSave();SND.apply();soundBtn();toast(on?"Theatre sound on":"Theatre sound off");}
$("#soundbtn").addEventListener("click",toggleSound);soundBtn();

/* ================= GALEN: medallion and voice ================= */
let MEDAL_N=0;
function medal(size){const u="md"+(++MEDAL_N);const beads=[...Array(36)].map((_,i)=>{const a=i*Math.PI/18;return `<circle cx="${(50+45.5*Math.cos(a)).toFixed(2)}" cy="${(50+45.5*Math.sin(a)).toFixed(2)}" r="1.5" fill="url(#${u}b)"/>`;}).join("");
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs>
  <radialGradient id="${u}g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#f6dc95"/><stop offset=".5" stop-color="#c99a3e"/><stop offset="1" stop-color="#7c5518"/></radialGradient>
  <radialGradient id="${u}b" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fbe7a8"/><stop offset="1" stop-color="#8a6020"/></radialGradient>
  <linearGradient id="${u}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c46f"/><stop offset="1" stop-color="#9a6f25"/></linearGradient>
  <path id="${u}t" d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0"/></defs>
  <circle cx="50" cy="50" r="49" fill="#6b4712"/><circle cx="50" cy="50" r="47.5" fill="url(#${u}g)"/>${beads}
  <circle cx="50" cy="50" r="41" fill="url(#${u}f)" stroke="#7c5518" stroke-width=".8"/>
  <text font-family="Cormorant SC,Georgia,serif" font-weight="700" font-size="7.4" letter-spacing="1.6" fill="#5a3b0c"><textPath href="#${u}t" startOffset="2%">CL · GALENVS · PERGAMENVS · MEDICVS ·</textPath></text>
  <circle cx="50" cy="50" r="29" fill="#d4ab55" stroke="#7c5518" stroke-width=".6"/>
  <g transform="translate(50 52) scale(.62) translate(-50 -52)" stroke="#5a3b0c" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">
   <path d="M64 86 L64 76 C70 70 71 58 68 50 C66 40 60 33 50 32 C44 32 41 36 40 42 L39 46 L35 51 L39 53 L39 56 L41 57.5 L39.5 59.5 C39 64 39 70 43 74 C46 77 50 78 52 80 L52 86 Z" fill="#b98a35"/>
   <path d="M41 61c3 1 4 4 3 7M44 66c3 0 4 3 3 6M48 70c3 0 4 3 3 5M43 58c2 0 4 1 4 3" fill="none"/>
   <path d="M44 34c3-4 9-5 13-3M50 31c4-2 10 0 13 4M58 34c4 0 7 4 8 8M47 38c2-2 5-2 7 0M55 38c2-1 5 0 6 2M62 42c2 0 4 2 4 4" fill="none"/>
   <path d="M43.5 44.5c1.5-1 3-1 4 0" fill="none"/><circle cx="45.5" cy="45.2" r=".7" fill="#5a3b0c"/>
   <path d="M57 46c2-1 3 1 3 3s-1 4-3 3" fill="none"/>
   <path d="M40 38c-1-3 1-6 4-6M38 42c-3 0-3-4-1-5" fill="none" stroke-width="1"/>
   <path d="M43 33c-2-3 0-6 3-5M49 30c-1-3 2-5 4-3M56 30c0-3 3-4 5-2M62 33c1-2 4-2 5 1M66 38c2-1 4 1 3 3" fill="#c99a3e" stroke-width=".9"/>
  </g></svg>`;}
function timeSlot(){const h=new Date().getHours();return h>=0&&h<5?"night":h<12?"morning":h<17?"afternoon":h<22?"evening":"night";}
function daySeed(){const d=new Date();return d.getFullYear()*400+d.getMonth()*32+d.getDate();}
function galenFor(ctx){
  if(ctx==="home"){
    const bd=BIRTHDAYS[fmtDate(Date.now()).slice(0,5)];if(bd){if(bd[0]==="Babinski")setTimeout(()=>findEgg("birthday",true),1500);return [null,bd[1]];}
    if(!TP.seen){return GALEN.first[0];}
    const last=Store.s.last||0;if(last&&Date.now()-last>4*DAY_MS)return galenPick(GALEN.back,daySeed());
    try{const p=Hub.todayFromPlan();if(p&&p.afterNight)return galenPick(GALEN.afterNight,daySeed());}catch(e){}
    if(timeSlot()==="night"){setTimeout(()=>findEgg("night",true),2500);}
    const pool=GALEN[timeSlot()].concat(GALEN.idle);return galenPick(pool,daySeed()+new Date().getHours());}
  if(GALEN.hall[ctx])return GALEN.hall[ctx];
  return galenPick(GALEN.idle,daySeed());
}
function guideHTML(line,opt={}){const [la,en]=line;return `<div class="guide${opt.small?" small":""}"><button class="medal" data-egg-medal aria-label="Galen">${medal()}</button><div class="say"><span class="who">Galen says</span>${la?`<span class="latin">${esc(la)}</span>`:""}<span class="line">${esc(en)}</span></div></div>`;}

/* quips: the top bar title borrows Galen's voice for a moment, so nothing on the page is covered */
let _quipT=null;
function quip(kind){const arr=GALEN[kind];if(!arr)return;const [,en]=galenPick(arr);const t=$("#toptitle");if(!t)return;
  clearTimeout(_quipT);const orig=t.dataset.orig||t.textContent;t.dataset.orig=orig;t.innerHTML=`<span style="font-style:italic;color:var(--accent-ink)">${esc(en)}</span>`;
  _quipT=setTimeout(()=>{t.textContent=t.dataset.orig;delete t.dataset.orig;},3200);
  const rp=$("#rp-quip");if(rp)rp.textContent=en;}

/* right and wrong, wherever they happen: listen for the classes the practice screens already set */
let _fbLast=0;
new MutationObserver(ms=>{for(const m of ms){const el=m.target;if(!(el instanceof Element))continue;const was=m.oldValue||"";
  const r=el.classList.contains("right")&&!/\bright\b/.test(was),w=el.classList.contains("wrong")&&!/\bwrong\b/.test(was);
  if((r||w)&&Date.now()-_fbLast>350){_fbLast=Date.now();SND.fx(r?"right":"wrong");if(w||Math.random()<.35)quip(r?"right":"wrong");break;}}})
 .observe($("#view"),{subtree:true,attributes:true,attributeFilter:["class"],attributeOldValue:true});

/* ================= EGGS ================= */
function eggFound(id){return !!Store.s.notes["egg:"+id];}
function findEgg(id,quiet){const e=EGGS.find(x=>x.id===id);if(!e)return;const first=!eggFound(id);
  if(first){Store.s.notes["egg:"+id]={t:Date.now(),v:1};Store.save();SND.fx("bell");}
  if(quiet){if(first)toast(`Written in the margin: ${e.t} · find it in the codex`);return;}
  showEgg(e,first);}
function showEgg(e,first){const el=document.createElement("div");el.className="helpov";el.setAttribute("role","dialog");el.setAttribute("aria-label",e.t);
  const n=EGGS.filter(x=>eggFound(x.id)).length;
  el.innerHTML=`<div class="card stack" style="gap:12px">${guideHTML([null,e.t])}<p class="lore-body" style="margin:0">${esc(e.x)}</p><div class="row-x"><span class="marg">${first?"A secret, written in the margin.":"Found before."} ${n} of ${EGGS.length} marginalia.</span><span class="spacer"></span><button class="btn sm" data-x>Close</button></div></div>`;
  document.body.append(el);const close=()=>el.remove();el.addEventListener("click",ev=>{if(ev.target===el||ev.target.closest("[data-x]"))close();});
  el.addEventListener("keydown",ev=>{if(ev.key==="Escape"){ev.stopPropagation();close();}});setTimeout(()=>$("[data-x]",el)?.focus(),20);}
/* the medallion does not like to be poked */
let _mdN=0,_mdT=0;
document.addEventListener("click",e=>{const m=e.target.closest("[data-egg-medal]");if(m){if(Date.now()-_mdT>1500)_mdN=0;_mdT=Date.now();_mdN++;
    if(_mdN===3)quip("idle");if(_mdN>=5){_mdN=0;findEgg("apes");}return;}
  const g=e.target.closest("[data-egg]");if(g){e.preventDefault();e.stopPropagation();findEgg(g.dataset.egg);}},true);
/* hold the serpent */
{let ht=null;const bm=()=>$$(".brandmark");document.addEventListener("pointerdown",e=>{if(e.target.closest(".brandmark,.railbrand")){ht=setTimeout(()=>findEgg("oath"),1600);}});
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>document.addEventListener(ev,()=>clearTimeout(ht)));}
/* words in the search box */
const EGG_WORDS=[[/rete mirabile|wonderful net/,"rete"],[/humou?rs?\b|four humou?rs|black bile|phlegm/,"humours"],[/\bvesalius\b/,"vesalius"],[/^galen$/,"galen"],[/rolled paper|quire|laennec'?s? paper/,"paper"]];
document.addEventListener("input",e=>{if(e.target.id!=="palq")return;const v=e.target.value.trim().toLowerCase();for(const [re,id] of EGG_WORDS)if(re.test(v)&&!eggFound(id)){findEgg(id);break;}});
/* the old code */
{const K=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let i=0;
  window.galenCode=k=>{i=(k===K[i])?i+1:(k===K[0]?1:0);if(i===K.length){i=0;findEgg("konami");document.documentElement.classList.add("candles");SND.fx("seal");}};
  document.addEventListener("keydown",e=>{if(/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;galenCode(e.key.length===1?e.key.toLowerCase():e.key);});}

/* ================= THE THEATRE (home) ================= */
function ellPt(cx,cy,rx,ry,a){return [cx+rx*Math.cos(a),cy+ry*Math.sin(a)];}
function theatreSVG(){
  const cx=210,cy=176;let s="";
  /* tiers with balustrades and a faint crowd */
  let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
  [64,86,108,130,152,172].forEach((rx,ti)=>{const ry=rx*.6;s+=`<ellipse class="tier" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke-width="${ti===5?1.6:1}"/>`;
    if(ti>0){const n=Math.round(rx/3.2);for(let k=0;k<n;k++){const a=k/n*Math.PI*2,[x,y]=ellPt(cx,cy,rx-4,ry-3,a);s+=`<line class="rail" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y-4).toFixed(1)}" stroke-width=".8"/>`;}
      const m=Math.round(rx/6);for(let k=0;k<m;k++){if(rnd()<.45)continue;const a=rnd()*Math.PI*2,[x,y]=ellPt(cx,cy,rx-11,ry-8,a);s+=`<circle cx="${x.toFixed(1)}" cy="${(y-6).toFixed(1)}" r="2.3" fill="var(--ink-engr)" opacity=".18"/><path d="M${(x-3).toFixed(1)} ${(y-1).toFixed(1)}q3-4 6 0" stroke="var(--ink-engr)" opacity=".18" fill="none"/>`;}}});
  /* the pit and the table */
  s+=`<ellipse cx="${cx}" cy="${cy}" rx="46" ry="27" fill="var(--surface3)" stroke="var(--ink-engr)" stroke-width="1.2"/>`;
  s+=`<g class="door table" tabindex="0" role="link" aria-label="The Table: the whole patient" data-go="learn/hall/table">
   <rect x="${cx-30}" y="${cy-9}" width="60" height="16" rx="2" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width="1.2"/>
   <path d="M${cx-22} ${cy-1}c6-6 14-6 22-4s14 2 20 4c-6 6-14 6-22 4s-14-2-20-4z" fill="var(--surface2)" stroke="var(--ink-engr)" stroke-width=".8"/>
   <line x1="${cx-26}" y1="${cy+7}" x2="${cx-26}" y2="${cy+14}" stroke="var(--ink-engr)"/><line x1="${cx+26}" y1="${cy+7}" x2="${cx+26}" y2="${cy+14}" stroke="var(--ink-engr)"/>
   <text x="${cx}" y="${cy+30}" text-anchor="middle" style="font-family:var(--f-sc);font-weight:700;font-size:12px;fill:var(--accent-ink);letter-spacing:.08em">the table</text></g>`;
  /* candles */
  [[cx-38,cy-4],[cx+38,cy-4]].forEach(([x,y],i)=>{s+=`<rect x="${x-2}" y="${y-12}" width="4" height="12" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width=".7"/><path class="flame${i?" b":""}" d="M${x} ${y-21}c-2.6 3.4-2.6 6 0 8 2.6-2 2.6-4.6 0-8z"/><circle cx="${x}" cy="${y-16}" r="9" fill="var(--accent)" opacity=".12"/>`;});
  /* the skull on the table's end */
  s+=`<g class="egg" data-egg="skull" role="button" aria-label="A skull" tabindex="-1"><path d="M${cx-30} ${cy-14}a5 5 0 0 1 10 0v3l-1.5 1.5h-7l-1.5-1.5z" fill="var(--surface)" stroke="var(--ink-engr)" stroke-width=".9"/><circle cx="${cx-27.3}" cy="${cy-13.6}" r="1.1" fill="var(--ink-engr)"/><circle cx="${cx-22.7}" cy="${cy-13.6}" r="1.1" fill="var(--ink-engr)"/></g>`;
  /* the doors */
  const doors=HALLS.filter(h=>h.id!=="table");
  doors.forEach((h,i)=>{const a=-Math.PI/2+i*Math.PI*2/doors.length,[x,y]=ellPt(cx,cy,190,132,a),m=hallMastery(h.id);
    const below=Math.sin(a)>-.35,ly=below?33:-26;
    s+=`<g class="door" tabindex="0" role="link" aria-label="Hall ${h.rn}: ${esc(h.short)}" data-go="learn/hall/${h.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
     <path class="arch" d="M-15 18V-5a15 15 0 0 1 30 0v23z"/><path d="M-10 18V-3a10 10 0 0 1 20 0v21" fill="none" stroke="var(--ink-engr)" stroke-width=".7" opacity=".6"/>
     ${m.pct>0?`<path d="M-15 21h${(30*Math.min(1,m.pct)).toFixed(1)}" stroke="var(--accent)" stroke-width="2.4"/>`:""}
     <text class="num" x="0" y="6" text-anchor="middle">${h.rn}</text>
     <text x="0" y="${ly}" text-anchor="middle" style="paint-order:stroke;stroke:var(--surface2);stroke-width:3px">${esc(h.short)}</text></g>`;});
  /* a small ape hides in the corner of the engraving */
  s+=`<g class="egg" data-egg="ape" role="button" aria-label="A small figure" tabindex="-1" opacity=".42" transform="translate(14 322) scale(.9)"><path d="M6 0a4 4 0 1 1 0 .1zM3 7c-2 2-2 7 0 10l-2 6M9 7c2 2 2 7 0 10l2 6M3 11h6M2 8l-3 5M10 8l3 5M9 17c4 0 6-3 7-6" fill="none" stroke="var(--ink-engr)" stroke-width="1.3" stroke-linecap="round"/></g>`;
  return `<svg class="th" viewBox="0 0 420 356" role="group" aria-label="The anatomical theatre: twelve halls around the table">${s}</svg>`;
}
function hallCard(h){const m=hallMastery(h.id);return `<button class="hall${h.id==="table"?" table":""}" data-go="learn/hall/${h.id}"><span class="emb"><svg viewBox="0 0 64 64">${EMB[h.id]}</svg></span>${h.id==="table"?`<span class="tx"><span class="rn">The centre</span><b>${esc(h.n)}</b><span class="la">${esc(h.la)} · the whole patient, history and vital signs</span></span>`:`<span class="rn">${h.rn}</span><b>${esc(h.short)}</b><span class="la">${esc(h.la)}</span>`}<span class="prog" aria-label="${Math.round(m.pct*100)}% mastered"><i style="width:${Math.round(m.pct*100)}%"></i></span></button>`;}
function loreOfDay(){return LORE[daySeed()%LORE.length];}
function loreCard(l,opt={}){return `<button class="tile lorecard" data-go="learn/lore/${l.id}"><span class="row-x" style="gap:8px"><span class="k ${l.k}">${LORE_KIND[l.k]}</span><span class="spacer"></span><span class="yr">${esc(l.yr)}</span></span><b>${esc(l.t)}</b><span class="sub">${esc(l.sum)}</span>${opt.hall?`<span class="tiny muted">${esc(HALL[l.hall].n)}</span>`:""}</button>`;}

{const _home=ROUTES["today:home"];
route("today:home","Galen",(root)=>{
  const due=dueCards().length,line=galenFor("home");
  root.innerHTML=`<section class="theatre-top">
    <button class="searchbig" data-act="pal">${ic("search")}<span>Search signs, techniques, the codex…</span><span class="kbdhint">/</span></button>
    <div class="card stack" style="gap:14px">${guideHTML(line)}
      <div class="row-x"><button class="btn" data-go="practice/session/all">${ic("play")}${due?`Today's session · ${due} due`:"Learn something new"}</button><button class="btn ghost sm" data-go="learn/codex">${ic("scroll")}The codex</button></div></div>
  </section>
  <section class="theatre">${theatreSVG()}</section><p class="marg" style="text-align:center;margin:-10px 0 0">Teatro anatomico · after Padua, 1594 · tap a door</p>
  <section class="section"><div class="row-x"><span class="label">The halls</span><span class="spacer"></span><span class="tiny muted">The bar under each door is what you have mastered there</span></div><div class="halls">${HALLS.map(hallCard).join("")}</div></section>
  <section class="section"><div class="row-x"><span class="label">From the codex, today</span><span class="spacer"></span><button class="link small" data-go="learn/codex">All ${LORE.length} stories</button></div><div class="grid">${loreCard(loreOfDay(),{hall:1})}</div></section>
  <div class="orn">❦</div><div id="today-old"></div>`;
  const old=$("#today-old",root);_home(old);
  /* the old greeting and system rings are replaced by Galen and the halls */
  const sg=$(".sysgrid",old);if(sg)sg.closest("section")?.remove();
  const h1=$(".hero h1",old);if(h1){h1.textContent="Today's round";h1.style.fontSize="1.9rem";}
  $(".hero .trace",old)?.remove();
  $("[data-act=pal]",root).addEventListener("click",openPalette);
  if(!TP.seen){TP.seen=1;tpSave();}
});}

/* ================= HALLS ================= */
const HALL_LINKS={
 table:[["learn/module/gen","General survey and vital signs"],["learn/frames","History frameworks"],["learn/pres","All presentations"],["tools/calcs","Scores and calculators"],["practice/er","ER cases"]],
 heart:[["learn/module/cvs","The cardiovascular examination"],["sounds/library","Heart sounds and murmurs"],["sounds/map","Where to listen, and why"],["sounds/compare","Look-alike sounds side by side"],["practice/drill","Sound drills"]],
 vessels:[["learn/module/cvs","The cardiovascular examination"],["tools/calcs","Wells, ABI and friends"]],
 lungs:[["learn/module/resp","The respiratory examination"],["sounds/library","Breath sounds"],["sounds/map","Lung zones"]],
 belly:[["learn/module/abd","The abdominal examination"]],
 neck:[["learn/module/hn","Head, neck and endocrine"]],
 senses:[["learn/tech","The technique clinic: otoscopy, fundoscopy, rhinoscopy"]],
 cranial:[["learn/cranial","The cranial nerves"],["learn/localise","Where is the lesion?"]],
 mind:[["learn/module/neuro","The neurological examination"],["learn/neuromap","Dermatomes and nerves"],["learn/myotomes","Myotomes and reflexes"],["learn/localise","Localisation"],["practice/localiser","Localiser cases"]],
 spine:[["learn/region/spine","Neck and back"],["learn/rootnerve","Root or nerve?"]],
 arm:[["learn/region/shoulder","Shoulder"],["learn/region/elbow","Elbow"],["learn/region/wrist","Wrist and hand"],["learn/rootnerve","Root or nerve?"]],
 leg:[["learn/region/hip","Hip"],["learn/region/knee","Knee"],["learn/region/ankle","Ankle and foot"]],
 skin:[["learn/datlas","Skin atlas"],["learn/dmorph","The words of the skin"],["learn/describe","Describe like a dermatologist"],["learn/demerg","Skin that can kill"],["practice/describe","Describe it (practice)"],["practice/spot","Spot diagnosis"]]
};

/* ---- outline chapters ---- */
const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
function chapCardIds(h,i){const c=(OUTLINE[h]||[])[i];if(!c)return new Set();if(!CARDS)buildCards();const sg=new Set(c.signs||[]),tc=new Set(c.tech||[]),pr=new Set(c.pres||[]),sd=new Set(c.sounds||[]);
  return new Set(CARDS.filter(k=>((k.type==="think"||k.type==="verdict"||k.type==="mech"||k.type==="snsp"||k.type==="teach")&&sg.has(k.ref))||((k.type==="twhy"||k.type==="terr")&&tc.has(k.ref[0]))||((k.type==="hlr")&&pr.has(k.ref[0]))||(k.type==="red"&&pr.has(k.ref))||(k.type==="sound"&&sd.has(k.ref))).map(k=>k.id));}
function chapMastery(h,i){const ids=[...chapCardIds(h,i)];if(!ids.length)return null;let m=0,seen=0;ids.forEach(id=>{const r=Store.s.srs[id];if(r){seen++;if(r.iv>=7)m++;else if(r.iv>=2)m+=.4;}});return {pct:m/ids.length,seen,n:ids.length};}
function chapItems(c){const out=[];
  (c.tech||[]).forEach(x=>{const t=TECH.find(y=>y.id===x);if(t)out.push(`<button class="chip" data-go="learn/tech/${x}">${ic("check")}${esc(t.name)}</button>`);});
  (c.signs||[]).forEach(x=>out.push(signChip(x)));
  (c.sounds||[]).forEach(x=>{if(SOUNDS[x])out.push(`<button class="chip" data-go="sounds/sound/${x}">${ic("ear")}${esc(SOUNDS[x].name)}</button>`);});
  (c.pres||[]).forEach(x=>{const p=HIST.pres.find(y=>y.id===x);if(p)out.push(`<button class="chip" data-go="learn/pres/${x}">${ic("history")}${esc(p.name)}</button>`);});
  (c.cases||[]).forEach(x=>{const k=HDPE.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="practice/hdpe/${x}">${ic("target")}${esc(k.title)}</button>`);});
  (c.scen||[]).forEach(x=>{const k=SCEN.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="practice/er/${x}">${ic("case")}${esc(k.title)}</button>`);});
  (c.maps||[]).forEach(x=>{const k=CMAPS.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="learn/map/${x}">${ic("map")}${esc(k.title)}</button>`);});
  (c.tools||[]).forEach(x=>{const k=TOOLS.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="tools/calc/${x}">${ic("scale")}${esc(k.name)}</button>`);});
  (c.labs||[]).forEach(x=>{const k=typeof LABS!=="undefined"&&LABS.find(y=>y.id===x);if(k)out.push(`<button class="chip" data-go="tools/lab/${x}">${ic("log")}${esc(k.name)}</button>`);});
  (c.go||[]).forEach(([g,t])=>out.push(`<button class="chip" data-go="${g}">${ic("door")}${esc(t)}</button>`));
  return out.join("");}
function outlineHTML(h){const chs=OUTLINE[h]||[];if(!chs.length)return "";
  return `<section class="section"><div class="row-x"><span class="label">The outline · ${chs.length} chapters</span><span class="spacer"></span><button class="link small" data-act="chap-all">Open all</button></div><div class="outline">${chs.map((c,i)=>{const m=chapMastery(h,i);
   return `<details class="chap"${i===0?" open":""}><summary><span class="cn">${ROMAN[i]||i+1}</span><span class="ct"><b>${esc(c.t)}</b><span>${esc(c.aim)}</span></span>${m?ring(m.pct,30,3.5):""}</summary>
   <div class="cbody"><span class="k">You will be able to</span><ul class="obj">${c.master.map(o=>`<li>${esc(o)}</li>`).join("")}</ul>
   <span class="k">Study and practise</span><div class="chips">${chapItems(c)}</div>
   <div class="tp"><div class="trap"><span class="k">The trap</span>${esc(c.trap)}</div><div class="pearl"><span class="k">The pearl</span>${esc(c.pearl)}</div></div>
   ${m?`<div class="row-x"><span class="tiny muted">${m.seen} of ${m.n} cards started · ${Math.round(m.pct*100)}% mastered</span><span class="spacer"></span><button class="btn sm soft" data-go="practice/session/chap:${h}:${i}">${ic("play")}Practise this chapter</button></div>`:""}</div></details>`;}).join("")}</div></section>`;}

route("learn:hall",(id)=>(HALL[id]||{}).n||"Hall",(root,id)=>{
  const h=HALL[id];if(!h)throw new Error("No such hall");
  const sg=hallSigns(id),tc=hallTech(id),pr=hallPres(id),lo=LORE.filter(l=>l.hall===id),m=hallMastery(id);
  const vOrder=s=>VERDICT_ORDER.indexOf(SIGNS[s].v);sg.sort((a,b)=>vOrder(a)-vOrder(b)||SIGNS[a].name.localeCompare(SIGNS[b].name));
  root.innerHTML=`<section class="hallhead"><span class="emb"><svg viewBox="0 0 64 64">${EMB[id]}</svg></span><span class="eyebrow">${id==="table"?"The centre of the theatre":"Hall "+h.rn}</span><h1>${esc(h.n)}</h1><span class="latin">${esc(h.la)} · ${esc(h.patron)}</span></section>
  <div class="card stack">${guideHTML(GALEN.hall[id]||galenPick(GALEN.idle),{small:1})}</div>
  <section class="story"><p class="dropcap">${esc(h.intro[0])}</p><p>${esc(h.intro[1])}</p><p class="latin" style="margin-top:.4em">${esc(h.maxim[0])}</p><p class="en" style="margin-top:-.6em">${esc(h.maxim[1])}</p></section>
  <div class="card row-x" style="gap:14px">${ring(m.pct,48,5)}<div class="stack" style="gap:2px;flex:1;min-width:0"><b style="font-family:var(--f-display);font-size:1.2rem">${Math.round(m.pct*100)}% mastered</b><span class="small muted">${m.seen} of ${m.n} cards started in this hall</span></div><button class="btn" data-go="practice/session/hall:${id}">${ic("play")}Practise this hall</button></div>
  ${outlineHTML(id)}
  ${(HALL_LINKS[id]||[]).length?`<section class="section"><span class="label">Rooms of this hall</span><div class="list">${HALL_LINKS[id].map(([go,t])=>`<button class="lrow" data-go="${go}"><span class="icwrap n">${ic("door")}</span><span class="txt"><b>${esc(t)}</b></span>${ic("chev","chev")}</button>`).join("")}</div></section>`:""}
  <details class="acc" style="padding:4px 14px"><summary style="padding:10px 0"><b style="font-family:var(--f-display);font-size:1.15rem">Everything in this hall</b> <span class="tiny muted">${sg.length} signs · ${tc.length} techniques · ${pr.length} histories</span></summary>
  ${tc.length?`<section class="section"><span class="label">Techniques · do it properly</span><div class="list">${tc.map(t=>`<button class="lrow" data-go="learn/tech/${t.id}"><span class="icwrap">${ic("check")}</span><span class="txt"><b>${esc(t.name)}</b><span>${esc(t.hook||t.purpose)}</span></span>${typeof pips==="function"?pips(t.id):""}</button>`).join("")}</div></section>`:""}
  ${sg.length?`<section class="section"><span class="label">Signs and tests · ${sg.length}</span><div class="list">${sg.map(k=>{const s=SIGNS[k];return `<button class="lrow" data-go="signs/sign/${k}"><span class="v v-${s.v}">${VERDICT[s.v]}</span><span class="txt"><b>${esc(s.name)}</b><span>${esc(s.target)}</span></span>${LORE_BY_SIGN[k]?`<span class="tag" title="Has a story in the codex">${ic("scroll")}</span>`:""}${ic("chev","chev")}</button>`;}).join("")}</div></section>`:""}
  ${pr.length?`<section class="section"><span class="label">Histories</span><div class="list">${pr.map(p=>`<button class="lrow" data-go="learn/pres/${p.id}"><span class="icwrap n">${ic("history")}</span><span class="txt"><b>${esc(p.name)}</b><span>${esc((p.dd||[]).slice(0,3).join(", "))}</span></span>${ic("chev","chev")}</button>`).join("")}</div></section>`:""}
  </details>
  ${lo.length?`<section class="section"><span class="label">Stories of this hall</span><div class="grid">${lo.map(l=>loreCard(l)).join("")}</div></section>`:""}
  <div class="orn">❦</div>`;
  $("[data-act=chap-all]",root)?.addEventListener("click",()=>$$(".chap",root).forEach(d=>d.open=true));
  SND.fx("door");
});

/* ================= THE CODEX ================= */
let CODEX_F="all";
route("learn:codex","The codex",(root)=>{
  const draw=()=>{const list=LORE.filter(l=>CODEX_F==="all"||l.k===CODEX_F||l.hall===CODEX_F);const found=EGGS.filter(e=>eggFound(e.id));
   root.innerHTML=`<section class="ph"><span class="eyebrow">The codex</span><h1>Medicine's long argument</h1><p class="lede">The people behind the names, the beliefs that harmed patients for centuries, and the discoveries that won anyway. Every story is tied to something you do at the bedside.</p></section>
   ${guideHTML(GALEN.lore,{small:1})}
   <div class="codexfilter" role="group" aria-label="Filter stories">${[["all","All"],["dark","The dark"],["triumph","Triumph"],["eponym","Behind the name"],["theatre","The theatre"]].map(([k,t])=>`<button class="chip" aria-pressed="${CODEX_F===k}" data-f="${k}">${t}</button>`).join("")}
     <select class="sel" id="cx-hall" aria-label="Stories of one hall" style="width:auto"><option value="">By hall…</option>${HALLS.map(h=>`<option value="${h.id}" ${CODEX_F===h.id?"selected":""}>${esc(h.n)}</option>`).join("")}</select></div>
   <div class="grid">${list.map(l=>loreCard(l,{hall:1})).join("")}</div>
   <section class="section"><span class="label">Marginalia · ${found.length} of ${EGGS.length} secrets found</span><div class="card stack" style="gap:8px">${EGGS.map(e=>eggFound(e.id)?`<button class="link" style="text-align:left" data-egg-show="${e.id}"><span class="marg"><b>${esc(e.t)}</b> · found</span></button>`:`<span class="marg">${esc(e.hint)}</span>`).join("")}</div></section>`;
   $$("[data-f]",root).forEach(b=>b.addEventListener("click",()=>{CODEX_F=b.dataset.f;draw();}));
   $("#cx-hall",root).addEventListener("change",e=>{CODEX_F=e.target.value||"all";draw();});
   $$("[data-egg-show]",root).forEach(b=>b.addEventListener("click",()=>showEgg(EGGS.find(x=>x.id===b.dataset.eggShow),false)));};
  draw();
});
route("learn:lore",(id)=>(loreById(id)||{}).t||"Story",(root,id)=>{
  const l=loreById(id);if(!l)throw new Error("No such story");const h=HALL[l.hall];const i=LORE.indexOf(l),nx=LORE[(i+1)%LORE.length];
  Store.s.notes["lore:"+id]={t:Date.now(),v:1};Store.save();
  root.innerHTML=`<section class="ph"><span class="row-x" style="gap:8px"><span class="eyebrow">${LORE_KIND[l.k]}</span><span class="spacer"></span><span class="latin" style="font-size:1rem">${esc(l.yr)}</span></span><h1>${esc(l.t)}</h1><p class="lede">${esc(l.who)}</p></section>
  <article class="lore-body">${l.body.map(p=>`<p>${esc(p)}</p>`).join("")}</article>
  ${LORE_OUT[l.id]?`<div class="card lore-out"><span class="label">The story in outline</span><dl>${["Before","The turning point","What followed"].map((k,i)=>`<dt>${k}</dt><dd>${esc(LORE_OUT[l.id][i])}</dd>`).join("")}<dt>At the bedside</dt><dd><b>${esc(l.fact)}</b></dd></dl></div>`:`<div class="lore-fact"><b>At the bedside:</b> ${esc(l.fact)}</div>`}
  <div class="card">${guideHTML([null,l.galen],{small:1})}</div>
  ${(l.signs||[]).filter(s=>SIGNS[s]).length?`<section class="section"><span class="label">The signs in this story</span><div class="chips">${l.signs.filter(s=>SIGNS[s]).map(signChip).join("")}</div></section>`:""}
  <div class="row-x"><button class="btn ghost" data-go="learn/hall/${l.hall}">${ic("door")}${esc(h.n)}</button><span class="spacer"></span><button class="btn soft" data-go="learn/lore/${nx.id}">Next story ${ic("chev")}</button></div>
  <p class="tiny muted">Source: ${esc(l.src)}</p>`;
  SND.fx("page");
});

/* sign and technique pages: the story behind the name, and the hall it lives in */
{const _sign=ROUTES["signs:sign"];ROUTES["signs:sign"]=(root,id)=>{_sign(root,id);const ls=LORE_BY_SIGN[id]||[],h=signHall(id);
  const el=document.createElement("section");el.className="section";
  el.innerHTML=`${ls.length?`<span class="label">The story behind it</span><div class="grid">${ls.map(l=>loreCard(l)).join("")}</div>`:""}${h?`<div class="row-x" style="margin-top:8px"><button class="btn ghost sm" data-go="learn/hall/${h}">${ic("door")}${esc(HALL[h].n)}</button></div>`:""}`;
  root.append(el);};}
{const _tech=ROUTES["learn:tech"];ROUTES["learn:tech"]=(root,id)=>{_tech(root,id);if(!id)return;const h=techHall(id);if(!h)return;
  const el=document.createElement("div");el.className="row-x";el.innerHTML=`<button class="btn ghost sm" data-go="learn/hall/${h}">${ic("door")}${esc(HALL[h].n)}</button>`;root.append(el);};}
/* Learn opens with the theatre */
{const _learn=ROUTES["learn:home"];ROUTES["learn:home"]=(root)=>{_learn(root);const ph=$(".ph",root);const el=document.createElement("section");el.className="section";
  el.innerHTML=`<div class="row-x"><span class="label">The theatre · twelve halls and the table</span><span class="spacer"></span><button class="link small" data-go="learn/codex">The codex</button></div><div class="halls">${HALLS.map(hallCard).join("")}</div>`;
  if(ph)ph.after(el);else root.prepend(el);};}

/* sessions can be scoped to a hall */
{const _bs=buildSession;buildSession=function(sys){if(sys&&String(sys).startsWith("chap:")){const [,h,i]=sys.split(":");const keep=chapCardIds(h,+i);
    const q=_bs("all").filter(c=>keep.has(c.id));if(q.length)return q;if(!CARDS)buildCards();return CARDS.filter(c=>keep.has(c.id)&&!Store.s.srs[c.id]).slice(0,12);}if(sys&&String(sys).startsWith("hall:")){const h=sys.slice(5);if(!CARDS)buildCards();
    const keep=new Set(CARDS.filter(c=>cardHall(c)===h).map(c=>c.id));const all=_bs("all");const q=all.filter(c=>keep.has(c.id));
    if(q.length)return q;/* nothing due here: take the first new cards of this hall */
    return CARDS.filter(c=>keep.has(c.id)&&!Store.s.srs[c.id]).slice(0,10);}return _bs(sys);};}
{const _st=sessionTitle;sessionTitle=function(sys){if(sys&&String(sys).startsWith("chap:")){const [,h,i]=sys.split(":");const c=(OUTLINE[h]||[])[+i];return c?c.t:"Chapter";}if(sys&&String(sys).startsWith("hall:")){const h=HALL[sys.slice(5)];return h?h.short+" · hall review":"Hall review";}return _st(sys);};TITLES["practice:session"]=s=>sessionTitle(s);}

/* search finds halls and stories */
{const _pi=palIndex;palIndex=function(){const I=_pi();if(I._th)return I;
  HALLS.forEach(h=>I.push({t:h.n,s:`The theatre · ${h.la}`,k:"door",go:`learn/hall/${h.id}`,x:h.intro.join(" ")+" "+h.patron}));
  LORE.forEach(l=>I.push({t:l.t,s:`Codex · ${LORE_KIND[l.k]} · ${l.yr}`,k:"scroll",go:`learn/lore/${l.id}`,x:l.who+" "+l.sum+" "+l.body.join(" ")}));
  I.push({t:"The codex",s:"Medical history, dark and bright",k:"scroll",go:"learn/codex",x:"history lore stories"});
  I.forEach(o=>{if(!o.lt){o.lt=o.t.toLowerCase();o.lx=(o.s+" "+o.x).toLowerCase();}});I._th=1;return I;};}

/* ================= REFERENCE PANE (desktop ≥1100 px) ================= */
const RP={pin:null};
const wide=()=>matchMedia("(min-width:1100px)").matches;
function rpSign(id){const s=SIGNS[id];if(!s)return "";const ls=LORE_BY_SIGN[id]||[];
  return `<div class="rp-h"><span class="eyebrow">Reference</span><span class="spacer"></span><button class="iconbtn" data-rp-close aria-label="Close reference">${ic("close")}</button></div>
  <div class="card stack" style="gap:10px"><span class="row-x" style="gap:8px"><span class="v v-${s.v}">${VERDICT[s.v]}</span><span class="tiny muted">${esc(s.target)}</span></span><h2>${esc(s.name)}</h2>
   ${typeof lrChips==="function"?`<div class="chips">${lrChips(s)}</div>`:""}
   <div><span class="label">How</span><p class="small" style="margin:2px 0 0">${esc(s.how)}</p></div>
   <div><span class="label">Why it works</span><p class="small" style="margin:2px 0 0">${esc(s.mech)}</p></div>
   <div><span class="label">What to think</span><p class="small" style="margin:2px 0 0">${esc(s.think)}</p></div>
   <button class="btn sm soft" data-go="signs/sign/${id}" data-rp-full>Open the full page</button></div>
  ${ls.map(l=>loreCard(l)).join("")}`;}
function rpTech(id){const t=TECH.find(x=>x.id===id);if(!t)return "";
  return `<div class="rp-h"><span class="eyebrow">Technique</span><span class="spacer"></span><button class="iconbtn" data-rp-close aria-label="Close reference">${ic("close")}</button></div>
  <div class="card stack" style="gap:10px"><h2>${esc(t.name)}</h2><p class="small muted" style="margin:0">${esc(t.purpose)}</p>
  <ol class="small" style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">${t.steps.map(s=>`<li><b>${esc(s.do)}</b><br><span class="muted">${esc(s.why)}</span></li>`).join("")}</ol>
  <button class="btn sm soft" data-go="learn/tech/${id}" data-rp-full>Open the technique</button></div>`;}
function rpDefault(){const r=cur(),key=NAV.tab+":"+r.v;let ctx="idle";if(key==="learn:hall")ctx=r.a;else if(key==="signs:sign")ctx=signHall(r.a)||"idle";
  const line=GALEN.hall[ctx]||galenFor("idle");const due=dueCards().length;const l=loreOfDay();
  const hid=key==="learn:hall"?r.a:key==="signs:sign"?signHall(r.a):null;const h=hid&&HALL[hid];
  return `${guideHTML(line,{small:1})}<p class="small" id="rp-quip" style="font-style:italic;color:var(--accent-ink);min-height:1.2em;margin:0"></p>
   <div class="card stack" style="gap:8px"><span class="label">Today</span><b style="font-family:var(--f-display);font-size:1.3rem">${due?`${due} card${due>1?"s":""} due`:"Nothing due"}</b><button class="btn sm" data-go="practice/session/all">${ic("play")}${due?"Start the session":"Learn something new"}</button></div>
   ${h&&key!=="learn:hall"?`<div class="card stack" style="gap:8px"><span class="label">This hall</span>${hallCard(h)}</div>`:""}
   <div class="stack" style="gap:8px"><span class="label">From the codex</span>${loreCard(l,{hall:1})}</div>
   <p class="tiny muted">Tap a sign or technique in a lesson or drill and it opens here, beside your work.</p>`;}
function rpRender(){const el=$("#refpane");if(!el)return;if(!wide()){el.innerHTML="";return;}
  el.innerHTML=RP.pin?(RP.pin[0]==="sign"?rpSign(RP.pin[1]):rpTech(RP.pin[1])):rpDefault();}
document.addEventListener("click",e=>{
  if(e.target.closest("[data-rp-close]")){RP.pin=null;rpRender();return;}
  if(e.target.closest("[data-rp-full]")){RP.pin=null;setTimeout(rpRender,0);return;}
  if(!wide())return;const g=e.target.closest("[data-go]");if(!g||g.closest("#refpane")||g.closest(".pal-back"))return;
  const p=g.dataset.go.split("/");const inStudy=NAV.tab==="practice"||(NAV.tab==="learn"&&cur().v!=="hall"&&cur().v!=="home"&&cur().v!=="codex")||(NAV.tab==="today"&&cur().v!=="home");
  if(!inStudy)return;
  if(p[0]==="signs"&&p[1]==="sign"&&SIGNS[p[2]]){e.preventDefault();e.stopImmediatePropagation();RP.pin=["sign",p[2]];rpRender();SND.fx("page");}
  else if(p[0]==="learn"&&p[1]==="tech"&&p[2]&&typeof TECH!=="undefined"&&TECH.find(t=>t.id===p[2])&&cur().v!=="tech"){e.preventDefault();e.stopImmediatePropagation();RP.pin=["tech",p[2]];rpRender();SND.fx("page");}
},true);
matchMedia("(min-width:1100px)").addEventListener("change",rpRender);

/* after every render: stage tint per hall, the pane, the room's key */
{const _chrome=chrome;chrome=function(){_chrome();const r=cur(),key=NAV.tab+":"+r.v;
  const hid=key==="learn:hall"?r.a:key==="signs:sign"?signHall(r.a):key==="learn:tech"&&r.a?techHall(r.a):key==="learn:lore"?(loreById(r.a)||{}).hall:null;
  const h=hid&&HALL[hid];document.documentElement.style.setProperty("--hall-tint",h?h.tint:"transparent");document.documentElement.dataset.hall=hid||"";
  SND.setHall(hid||"table");rpRender();};}

/* nav labels for the world */
{const b=$('#nav [data-tab="today"]');if(b){b.querySelector(".l").textContent="Theatre";const s=b.querySelector("svg.i");if(s)s.outerHTML=ic("theatre");}
 const rb=$("#nav .railbrand .brandmark");const tb=$(".top .brandmark");if(rb&&tb)rb.innerHTML=tb.innerHTML;}

/* ================= KEYS, CONTROLLER AND HELP ================= */
function helpOverlay(){if($(".helpov"))return;const el=document.createElement("div");el.className="helpov";el.setAttribute("role","dialog");el.setAttribute("aria-label","Keys and controller");
  const rows=[["Search","<kbd>/</kbd> or <kbd>Ctrl K</kbd>","Menu (≡)"],["Back","<kbd>Esc</kbd>","B"],["Choose","<kbd>Enter</kbd>","A"],["Move","<kbd>Tab</kbd>, arrows in lists","D-pad or left stick"],["Previous / next section","<kbd>Alt 1</kbd>…<kbd>Alt 5</kbd>","L1 / R1"],["Answers in drills","<kbd>1</kbd>–<kbd>4</kbd>, <kbd>Space</kbd> to reveal","A on the focused answer"],["Scroll","<kbd>PgUp</kbd> <kbd>PgDn</kbd>","Right stick"],["Theatre sound","<kbd>M</kbd>","Y"],["This help","<kbd>?</kbd>","View (⧉)"]];
  el.innerHTML=`<div class="card stack" style="gap:12px"><div class="row-x"><h2>Keys and controller</h2><span class="spacer"></span><button class="iconbtn" data-x aria-label="Close">${ic("close")}</button></div>
  <p class="small muted" style="margin:0">Mouse, keyboard, touch and a gamepad (Steam Deck) all work at once. Hold or right-click a hint for its explanation.</p>
  <table><tr><th>Action</th><th>Keyboard</th><th>Controller</th></tr>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</table></div>`;
  document.body.append(el);el.addEventListener("click",e=>{if(e.target===el||e.target.closest("[data-x]"))el.remove();});setTimeout(()=>$("[data-x]",el)?.focus(),10);}
function tabStep(d){const tabs=TABS.filter(t=>!t[3]).map(t=>t[0]);const i=tabs.indexOf(NAV_PARENT[NAV.tab]||NAV.tab);switchTab(tabs[(i+d+tabs.length)%tabs.length]);}
document.addEventListener("keydown",e=>{const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);if(typing)return;
  if(e.altKey&&/^[1-5]$/.test(e.key)){e.preventDefault();const tabs=TABS.filter(t=>!t[3]).map(t=>t[0]);switchTab(tabs[+e.key-1]);return;}
  if(e.key==="?"){e.preventDefault();helpOverlay();return;}
  if((e.key==="m"||e.key==="M")&&!e.ctrlKey&&!e.metaKey&&!KEYS.handler){toggleSound();return;}
  if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches("g[data-go],g[data-egg],[role=link][data-go]")){e.preventDefault();e.target.dispatchEvent(new MouseEvent("click",{bubbles:true}));}
  if(e.key==="Escape"){const ov=$(".helpov");if(ov){e.stopImmediatePropagation();ov.remove();}}
},true);
/* gamepad: buttons become the app's own keys; the d-pad walks focus spatially */
const PAD={on:false,prev:{},t:0};
function focusables(){return $$('button:not([disabled]),a[href],[tabindex="0"],input,select,textarea,summary').filter(el=>{if(el.closest("[hidden]"))return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=="hidden";})
  .filter(el=>{const ov=$(".helpov")||$(".pal-back");return ov?ov.contains(el):true;});}
function padMove(dx,dy){document.documentElement.classList.add("pad");const list=focusables();const a=document.activeElement;
  if(!a||a===document.body||!list.includes(a)){const first=list.find(el=>{const r=el.getBoundingClientRect();return r.top>=60&&r.bottom<=innerHeight;})||list[0];first&&first.focus();return;}
  const ra=a.getBoundingClientRect(),ax=ra.left+ra.width/2,ay=ra.top+ra.height/2;let best=null,bs=1e9;
  for(const el of list){if(el===a)continue;const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,ddx=x-ax,ddy=y-ay;
    const along=dx?ddx*dx:ddy*dy;if(along<=4)continue;const across=dx?Math.abs(ddy):Math.abs(ddx);const sc=along+across*2.2;if(sc<bs){bs=sc;best=el;}}
  if(best){best.focus({preventScroll:false});best.scrollIntoView({block:"nearest",inline:"nearest"});}}
function padKey(key){const t=document.activeElement||document.body;t.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true,cancelable:true}));}
function padLoop(){const pads=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];if(!pads.length){PAD.on=false;return;}
  const g=pads[0],b=i=>!!(g.buttons[i]&&g.buttons[i].pressed),now=performance.now();
  const press=(i,fn)=>{const p=b(i);if(p&&!PAD.prev[i])fn();PAD.prev[i]=p;};
  press(0,()=>{const a=document.activeElement;galenCode("a");if(a&&a!==document.body)a.click();else padMove(0,1);});
  press(1,()=>{galenCode("b");if($(".helpov")){$(".helpov").remove();return;}if(PAL){closePalette();return;}back();});
  press(3,toggleSound);
  press(4,()=>tabStep(-1));press(5,()=>tabStep(1));
  press(8,helpOverlay);press(9,openPalette);
  press(2,()=>padKey(" "));
  const ax=g.axes[0]||0,ay=g.axes[1]||0,ry=g.axes[3]||0;
  const dir=b(12)||ay<-.6?[0,-1,"ArrowUp"]:b(13)||ay>.6?[0,1,"ArrowDown"]:b(14)||ax<-.6?[-1,0,"ArrowLeft"]:b(15)||ax>.6?[1,0,"ArrowRight"]:null;
  if(dir){if(!PAD.dir||now-PAD.t>(PAD.rep?140:380)){PAD.rep=!!PAD.dir;PAD.t=now;galenCode(dir[2]);if(PAL)padKey(dir[2]);else padMove(dir[0],dir[1]);}PAD.dir=dir;}else{PAD.dir=null;PAD.rep=false;}
  if(Math.abs(ry)>.25)window.scrollBy(0,ry*18);
  requestAnimationFrame(padLoop);}
window.addEventListener("gamepadconnected",()=>{if(PAD.on)return;PAD.on=true;document.documentElement.classList.add("pad");toast("Controller connected · press View for the buttons");requestAnimationFrame(padLoop);});
document.addEventListener("pointerdown",()=>document.documentElement.classList.remove("pad"),{passive:true});
/* right-click is the twin of hold-to-explain */
document.addEventListener("contextmenu",e=>{const h=e.target.closest("[data-hint]");if(h){e.preventDefault();h.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));setTimeout(()=>h.dispatchEvent(new PointerEvent("pointerup",{bubbles:true})),650);}});

/* ================= SETTINGS: the theatre group ================= */
{const _set=ROUTES["tools:settings"];ROUTES["tools:settings"]=(root)=>{_set(root);const el=document.createElement("section");el.className="card stack";el.id="theatre-settings";
  const sz=TP.size||"m";
  el.innerHTML=`<div class="row-x"><h2>The theatre</h2><span class="spacer"></span><span class="pill">This device only</span></div>
  <p class="small muted" style="margin:0">Sound is generated on the device; nothing is downloaded. It falls silent whenever a heart or lung sound plays, and when Galen is in the background.</p>
  <label class="row-x"><input type="checkbox" id="ts-amb" ${TP.amb?"checked":""}> <span>Candlelit room (ambience)</span></label>
  <label class="row-x"><input type="checkbox" id="ts-mus" ${TP.music?"checked":""}> <span>A lute in the gallery, now and then (Greensleeves, 16th century)</span></label>
  <label class="row-x"><input type="checkbox" id="ts-ton" ${TP.tones?"checked":""}> <span>Tones for right and wrong answers</span></label>
  <div class="mixrow"><span class="small">Volume</span><input type="range" id="ts-vol" min="0" max="1" step=".05" value="${TP.vol}" aria-label="Theatre volume"><span class="mono small" id="ts-vv">${Math.round(TP.vol*100)}%</span></div>
  <div class="row-x"><span class="small">Text size</span><div class="seg sm" role="group" aria-label="Text size">${[["s","Small"],["m","Normal"],["l","Large"]].map(([k,t])=>`<button data-sz="${k}" aria-pressed="${sz===k}">${t}</button>`).join("")}</div></div>
  <div class="row-x"><button class="btn ghost sm" id="ts-test">${ic("play")}Play the lute</button><button class="btn ghost sm" id="ts-help">${ic("pad")}Keys and controller</button></div>`;
  root.prepend(el);
  const upd=()=>{TP.amb=$("#ts-amb").checked?1:0;TP.music=$("#ts-mus").checked?1:0;TP.tones=$("#ts-ton").checked?1:0;tpSave();SND.apply();soundBtn();};
  ["#ts-amb","#ts-mus","#ts-ton"].forEach(s=>$(s).addEventListener("change",upd));
  $("#ts-vol").addEventListener("input",e=>{TP.vol=+e.target.value;$("#ts-vv").textContent=Math.round(TP.vol*100)+"%";if(SND.bus&&!SND.ducked)SND.bus.gain.value=TP.vol;tpSave();});
  $$("[data-sz]",el).forEach(b=>b.addEventListener("click",()=>{TP.size=b.dataset.sz;tpSave();applySize();$$("[data-sz]",el).forEach(x=>x.setAttribute("aria-pressed",x===b));}));
  $("#ts-test").addEventListener("click",()=>{SND.ensure();SND.playTune();});$("#ts-help").addEventListener("click",helpOverlay);};}
