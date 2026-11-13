"use strict";
/* Galen theatre: generated sound (SND), sound toggle, and the theatre settings group. Device-only prefs live in TP (98b). */
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

