"use strict";
/* Galen theatre: generated sound (SND), sound toggle, and the theatre settings group. Device-only prefs live in TP (98b). */
/* ================= SOUND: a candlelit room, a lute, and tones =================
   Graph (one AudioContext):
     ambience (per start: room tone, drone banks, candle, bench) ─┐
     music (per tune: its own gain) ───────────────── musG ───────┼─ bed reverb ─ bedDuck ─┐
     tones (right, wrong, bell, page, door) ── fxG ── fx reverb ── fxDuck ─────────────────┼─ vol ─ limiter (make-up cancelled) ─ out
   Clinical sound always wins: while a heart or lung sound plays (event "galen:clinical" from 10-audio.js), bedDuck is 0, so the room
   and the lute are silent, and tones drop 12 dB so right/wrong can still be heard under the stethoscope.
   Every generated buffer is checked for non-finite samples: one NaN in a shared filter or reverb would silence the theatre for good. */
if(!IC.pause)IC.pause='<path d="M8 5v14M16 5v14"/>';
const sndFin=b=>{for(let c=0;c<b.numberOfChannels;c++){const d=b.getChannelData(c);for(let i=0;i<d.length;i++)if(!Number.isFinite(d[i]))d[i]=0;}return b;};
const SND={ctx:null,cache:{},ducked:false,hallKey:"table",amb:null,tune:null,musOn:false,onTune:null,
  ensure(){
    if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
      try{this.build(new AC());}catch(e){console.warn("theatre sound",e);this.ctx=null;return null;}}
    if(this.ctx.state==="suspended"&&!document.hidden&&this.ctx.resume){try{this.ctx.resume().catch(()=>{});}catch(e){}}
    return this.ctx;},
  /* build the graph on any (Offline)AudioContext: the render test uses this */
  build(c){
    /* AudioBuffers can be shared between contexts: keep the generated ones while the sample rate is the same */
    if(this._sr!==c.sampleRate){this.cache={};this._room=null;this._ir=null;this._crk=null;this._sr=c.sampleRate;}
    this.ctx=c;this.amb=null;this.tune=null;
    this.vol=c.createGain();this.vol.gain.value=TP.vol;
    const lim=c.createDynamicsCompressor();lim.threshold.value=-6;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.002;lim.release.value=.15;
    const mk=c.createGain();mk.gain.value=Math.pow(10,-.6*6*(1-1/20)/20);   /* cancel Chrome's automatic make-up gain */
    this.vol.connect(lim);lim.connect(mk);mk.connect(c.destination);this.out=mk;
    this.bedDuck=c.createGain();this.bedDuck.gain.value=this.ducked?0:1;this.bedDuck.connect(this.vol);
    this.fxDuck=c.createGain();this.fxDuck.gain.value=this.ducked?.25:1;this.fxDuck.connect(this.vol);
    const ir=this.impulse();
    const rev=(dest,wet)=>{const cv=c.createConvolver();cv.buffer=ir;const w=c.createGain();w.gain.value=wet;cv.connect(w);w.connect(dest);return cv;};
    const bedRev=rev(this.bedDuck,.32),fxRev=rev(this.fxDuck,.22);
    this.ambG=c.createGain();this.musG=c.createGain();this.fxG=c.createGain();
    [[this.ambG,this.bedDuck,bedRev],[this.musG,this.bedDuck,bedRev],[this.fxG,this.fxDuck,fxRev]].forEach(([g,d,r])=>{g.connect(d);g.connect(r);});
    /* levels, measured offline at volume 0.55: room about -42 dBFS RMS, lute about -34 dBFS RMS (above the room), tones about -30 dBFS */
    this.ambG.gain.value=this.LV.amb;this.musG.gain.value=this.LV.mus;this.fxG.gain.value=this.LV.fx;
    return c;},
  LV:{amb:.27,mus:1.3,fx:1.4},
  /* the theatre's wood and stone: early reflections, then a tail that darkens as it decays (6 kHz falling to 800 Hz) */
  impulse(){if(this._ir)return this._ir;const c=this.ctx,sr=c.sampleRate,len=Math.floor(sr*2.2),b=c.createBuffer(2,len,sr);
    const ER=[[.007,.55],[.011,.45],[.016,.4],[.022,.33],[.029,.3],[.037,.24],[.046,.2],[.057,.16]];
    for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let lp=0;
      for(let i=0;i<len;i++){const x=i/len,fc=6000*Math.pow(800/6000,x),a=Math.exp(-2*Math.PI*fc/sr);lp=a*lp+(1-a)*(Math.random()*2-1);
        const fade=Math.min(1,Math.max(0,(i/sr-.012)/.02));d[i]=lp*Math.pow(1-x,3.2)*fade*2.2;}
      ER.forEach(([t,g],k)=>{const j=Math.floor((t+(ch?.0013*(k%3):0))*sr);if(j<len)d[j]+=g*((k+ch)%2?-1:1);});}
    return this._ir=sndFin(b);},
  noise(sec,brown){const c=this.ctx,n=Math.floor(c.sampleRate*sec),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let last=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;if(brown){last=(last+.02*w)/1.02;d[i]=last*3.2;}else d[i]=w;}return sndFin(b);},
  /* 20 s of room tone whose end is crossfaded into its start, so the loop has no seam and no audible 6 s repeat */
  roomBuf(){if(this._room)return this._room;const c=this.ctx,sr=c.sampleRate,L=sr*20,X=Math.floor(sr*.5),src=this.noise(20.5,true).getChannelData(0);
    const b=c.createBuffer(1,L,sr),d=b.getChannelData(0);let m=0;for(let i=0;i<L+X&&i<src.length;i++)m+=src[i];m/=Math.min(src.length,L+X);
    for(let i=0;i<L;i++)d[i]=src[i]-m;for(let i=0;i<X;i++){const w=i/X;d[i]=(src[i]-m)*Math.sin(w*Math.PI/2)+(src[L+i]-m)*Math.cos(w*Math.PI/2);}
    return this._room=sndFin(b);},
  /* Karplus–Strong plucked string, computed once per pitch: our lute.
     Tuning: the loop delay is sr/f exactly, as an integer delay plus the loss filter's delay (S samples) plus a first-order all-pass
     for the fraction, so every note is within about a cent. Decay: the per-period loss comes from a target T60 (3 s at A2 falling to
     1.3 s at A5), so treble notes ring instead of dying in 0.3 s. The excitation is zero-mean (no DC thump), the buffer starts with a
     1.5 ms ramp and ends with a 60 ms raised-cosine fade (no click), and every sample is checked for NaN. */
  pluck(midi,dur=2.2,bright=.5){const k=midi+":"+dur+":"+bright;if(this.cache[k])return this.cache[k];const c=this.ctx,sr=c.sampleRate,f=440*Math.pow(2,(midi-69)/12);
    const S=midi>=60?.5:midi<=45?.35:.35+.15*(midi-45)/15;
    let Ni=Math.floor(sr/f-S),fr=sr/f-S-Ni;if(fr<.1&&Ni>3){Ni--;fr++;}Ni=Math.max(2,Ni);
    const C=(1-fr)/(1+fr),T60=Math.min(3.2,Math.max(1.1,3*Math.pow(1.3/3,(midi-45)/36))),rho=Math.pow(.001,1/(f*T60));
    const len=Math.max(Ni+4,Math.floor(sr*dur)),b=c.createBuffer(1,len,sr),y=b.getChannelData(0);
    /* seeded excitation: the same note always has the same level, so right stays louder than wrong on every load */
    let sd=(midi*2654435761+Math.round(dur*1000))>>>0;const rnd=()=>(sd=(Math.imul(sd,1664525)+1013904223)>>>0)/4294967296;
    let p=0,m=0;for(let i=0;i<Ni;i++){const w=rnd()*2-1;p=p*(1-bright)+w*bright;y[i]=p;m+=p;}m/=Ni;
    let pk=0;for(let i=0;i<Ni;i++){y[i]-=m;pk=Math.max(pk,Math.abs(y[i]));}const kk=pk?.8/pk:0;for(let i=0;i<Ni;i++)y[i]*=kk;
    let v1=0,a1=0;
    for(let i=Ni;i<len;i++){const v=rho*((1-S)*y[i-Ni]+S*(i>Ni?y[i-Ni-1]:0));let a=C*v+v1-C*a1;if(!Number.isFinite(a))a=0;v1=v;a1=a;y[i]=a;}
    const ra=Math.max(1,Math.round(sr*.0015)),fo=Math.min(len,Math.round(sr*.06));
    for(let i=0;i<ra&&i<len;i++)y[i]*=i/ra;
    for(let i=0;i<fo;i++)y[len-1-i]*=.5-.5*Math.cos(Math.PI*i/fo);
    return this.cache[k]=sndFin(b);},
  play(buf,t,gain,dest,rate=1){const c=this.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=buf;s.playbackRate.value=rate;g.gain.value=gain;s.connect(g);g.connect(dest);s.start(t);
    s.onended=()=>{try{g.disconnect();}catch(e){}};return s;},
  /* a lute body for each destination: a wooden resonance near 240 Hz and the softness of gut strings */
  body(dest){if(dest._body)return dest._body;const c=this.ctx,a=c.createBiquadFilter();a.type="peaking";a.frequency.value=240;a.gain.value=5;a.Q.value=1.2;
    const b=c.createBiquadFilter();b.type="lowpass";b.frequency.value=3200;a.connect(b);b.connect(dest);return dest._body=a;},
  lute(midi,t,gain=.35,dur=2.2,dest){return this.play(this.pluck(midi,dur,.55),t,gain,this.body(dest||this.musG));},
  /* ---------- ambience: each start owns its nodes, so a fast off-on can never stop the new room or leak the old one ---------- */
  startAmb(){if(!this.ensure()||this.amb)return;const c=this.ctx,now=c.currentTime,A={timers:[],srcs:[],bank:null,ci:0};this.amb=A;
    A.g=c.createGain();A.g.gain.setValueAtTime(0,now);A.g.gain.setTargetAtTime(1,now,1.2);A.g.connect(this.ambG);
    const room=c.createBufferSource();room.buffer=this.roomBuf();room.loop=true;const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=320;
    const rg=c.createGain();rg.gain.value=.16;room.connect(lp);lp.connect(rg);rg.connect(A.g);room.start(now);A.srcs.push(room);
    /* drone: one voice per chord tone plus detuned twins on the lower three, very slow swell; it holds its breath while the lute plays */
    A.dr=c.createGain();A.dr.gain.setValueAtTime(0,now);A.dr.gain.setTargetAtTime(.5,now,4);A.hold=c.createGain();A.hold.gain.value=this.tune?0:1;
    const dl=c.createBiquadFilter();dl.type="lowpass";dl.frequency.value=700;A.dr.connect(A.hold);A.hold.connect(dl);dl.connect(A.g);
    const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.05;lg.gain.value=.18;lfo.connect(lg);lg.connect(A.dr.gain);lfo.start(now);A.srcs.push(lfo);
    this.setChord(0);
    A.timers.push(setInterval(()=>{if(this.amb!==A||c.state!=="running")return;A.ci++;this.setChord(A.ci);},15000));
    /* candle: 1-4 ms impulses in small clusters, fresh from a pool of 16, through 1.5-6 kHz */
    const hp=c.createBiquadFilter();hp.type="highpass";hp.frequency.value=1500;const lp2=c.createBiquadFilter();lp2.type="lowpass";lp2.frequency.value=6000;hp.connect(lp2);lp2.connect(A.g);
    const pool=this.crackPool();
    const tick=()=>{if(this.amb!==A)return;if(c.state==="running"){const t=c.currentTime+.02,n=1+Math.floor(Math.random()*Math.random()*4);let tt=t;
        for(let i=0;i<n;i++){this.play(pool[Math.floor(Math.random()*pool.length)],tt,.08+Math.random()*.22,hp);tt+=.005+Math.random()*.015;}}
      A.crT=setTimeout(tick,400+Math.random()*3200);};A.crT=setTimeout(tick,600);
    /* the odd creak of a bench */
    const creak=()=>{if(this.amb!==A)return;if(c.state==="running"){const t=c.currentTime+.02,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();f.type="bandpass";f.frequency.value=400;f.Q.value=6;
        o.type="sawtooth";o.frequency.setValueAtTime(70+Math.random()*30,t);o.frequency.linearRampToValueAtTime(55+Math.random()*20,t+.5);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.02,t+.15);g.gain.linearRampToValueAtTime(0,t+.6);
        o.connect(f);f.connect(g);g.connect(A.g);o.start(t);o.stop(t+.7);o.onended=()=>{try{g.disconnect();}catch(e){}};}
      A.ckT=setTimeout(creak,20000+Math.random()*40000);};A.ckT=setTimeout(creak,9000);},
  crackPool(){if(this._crk)return this._crk;const c=this.ctx,sr=c.sampleRate,P=[];
    for(let k=0;k<16;k++){const n=Math.max(8,Math.round(sr*(.001+Math.random()*.003))),b=c.createBuffer(1,n,sr),d=b.getChannelData(0),tau=sr*.0006;
      for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/tau)*Math.min(1,(n-i)/4);P.push(sndFin(b));}
    return this._crk=P;},
  stopAmb(){const A=this.amb;if(!A)return;this.amb=null;const c=this.ctx,now=c.currentTime;
    A.g.gain.cancelScheduledValues(now);A.g.gain.setTargetAtTime(0,now,.3);clearTimeout(A.crT);clearTimeout(A.ckT);A.timers.forEach(clearInterval);
    const kill=()=>{A.srcs.forEach(s=>{try{s.stop();}catch(e){}});if(A.bank)A.bank.osc.forEach(o=>{try{o.stop();}catch(e){}});try{A.g.disconnect();}catch(e){}};
    if(c.state==="running")setTimeout(kill,1500);else kill();},
  /* each hall has its own tonal centre, so the room changes as you walk */
  HALL_ROOT:{table:50,heart:45,vessels:52,lungs:53,belly:55,neck:48,senses:46,cranial:50,mind:51,spine:43,arm:45,leg:48,skin:53},
  CHORDS:[[0,7,12,15,19,24],[-2,5,10,14,17,22],[-4,3,8,12,15,20],[-5,2,7,10,14,19]],
  /* chord changes crossfade a new bank of oscillators over about 3 s instead of gliding six voices in parallel */
  setChord(i){const A=this.amb;if(!A)return;const c=this.ctx,now=c.currentTime,r=this.HALL_ROOT[this.hallKey]||50,ch=this.CHORDS[i%this.CHORDS.length];
    const g=c.createGain(),osc=[];g.gain.setValueAtTime(A.bank?0:1,now);if(A.bank)g.gain.setTargetAtTime(1,now,.9);g.connect(A.dr);
    ch.forEach((n,k)=>{const fr=440*Math.pow(2,(r+n-69-12)/12)*(k>3?2:1);[0,1].forEach(tw=>{if(tw&&k>2)return;const o=c.createOscillator(),og=c.createGain();
      o.type=k%2?"triangle":"sine";o.frequency.setValueAtTime(fr,now);o.detune.setValueAtTime(tw?5:-3+(k%2)*6,now);og.gain.value=tw?.035:.05;o.connect(og);og.connect(g);o.start(now);osc.push(o);});});
    const old=A.bank;A.bank={g,osc};
    if(old){old.g.gain.cancelScheduledValues(now);old.g.gain.setTargetAtTime(0,now,.9);old.osc.forEach(o=>{try{o.stop(now+5);}catch(e){}});setTimeout(()=>{try{old.g.disconnect();}catch(e){}},5600);}},
  setHall(h){if(h===this.hallKey)return;this.hallKey=h;if(this.amb)this.setChord(0);},
  droneHold(on){const A=this.amb;if(!A)return;const t=this.ctx.currentTime;A.hold.gain.cancelScheduledValues(t);A.hold.gain.setTargetAtTime(on?0:1,t,on?.5:2);},
  /* ---------- Greensleeves (anonymous, registered 1580, public domain), as a lute would play it ----------
     A minor, three beats to the bar, one-beat pickup. Melody after the broadside ballad tune (Musica Viva transcription, transposed from
     C minor); null is a rest. The bass falls on the downbeat of every bar (31 bars), passamezzo-antico style: Am | C | G | Em ...
     with the half cadence on E in bar 8 and A under "A G# A" in bars 6 and 22. */
  GREEN:{mel:[[69,1],[72,2],[74,1],[76,1.5],[77,.5],[76,1],[74,2],[71,1],[67,1.5],[69,.5],[71,1],[72,2],[69,1],[69,1.5],[68,.5],[69,1],[71,2],[68,1],[64,2],[69,1],[72,2],[74,1],[76,1.5],[77,.5],[76,1],[74,2],[71,1],[67,1.5],[69,.5],[71,1],[72,1.5],[71,.5],[69,1],[68,1.5],[66,.5],[68,1],[69,3],[69,2],[null,1],
      [79,3],[79,1.5],[78,.5],[76,1],[74,2],[71,1],[67,1.5],[69,.5],[71,1],[72,2],[69,1],[69,1.5],[68,.5],[69,1],[71,2],[68,1],[64,3],[79,3],[79,1.5],[78,.5],[76,1],[74,2],[71,1],[67,1.5],[69,.5],[71,1],[72,1.5],[71,.5],[69,1],[68,1.5],[66,.5],[68,1],[69,3]],
    bass:[45,48,43,40,45,45,40,40, 45,48,43,40,45,40,45,45, 43,40,43,40,45,45,40,40, 43,40,43,40,45,40,45]},
  /* the tune is played in the hall's key, and the drone rests while it plays, so the two never clash */
  tuneShift(){const r=this.HALL_ROOT[this.hallKey]||45;let s=((r-45)%12+12)%12;if(s>6)s-=12;return s;},
  /* schedule the whole tune into dest; returns the sources and the end time (used by playTune and the render test) */
  schedTune(t,dest,tr){const beat=.6,mel=this.GREEN.mel,bass=this.GREEN.bass,srcs=[];let pos=0;
    for(const [m,d] of mel){
      if(pos>=1&&Math.abs(((pos-1)%3+3)%3)<.01){const bi=Math.round((pos-1)/3);if(bi<bass.length){const b=bass[bi]+tr;srcs.push(this.lute(b,t,.2,2.6,dest));srcs.push(this.lute(b+7,t+beat*.5,.09,2,dest));}}
      if(m!=null)srcs.push(this.lute(m+tr,t,.32,Math.max(1.2,d*beat*2),dest));
      pos+=d;t+=d*beat*(1+(Math.random()-.5)*.03);}
    return {srcs,end:t+2.6};},
  playTune(){if(!this.ensure()||this.tune||this.ducked)return false;const c=this.ctx,g=c.createGain();g.connect(this.musG);
    const r=this.schedTune(c.currentTime+.5,g,this.tuneShift()),T={g,srcs:r.srcs,end:r.end};this.tune=T;this.droneHold(true);
    T.timer=setTimeout(()=>{if(this.tune===T)this.stopTune(true);},(r.end-c.currentTime)*1000+200);
    if(this.onTune)this.onTune(true);return true;},
  stopTune(natural){const T=this.tune;if(!T)return;this.tune=null;clearTimeout(T.timer);const c=this.ctx,t=c.currentTime;
    if(!natural){T.g.gain.cancelScheduledValues(t);T.g.gain.setTargetAtTime(0,t,.08);}
    const kill=()=>{T.srcs.forEach(s=>{try{s.stop();}catch(e){}});try{T.g.disconnect();}catch(e){}};
    if(natural||c.state!=="running")kill();else setTimeout(kill,450);
    this.droneHold(false);if(this.onTune)this.onTune(false);},
  startMusic(){if(this.musOn)return;this.musOn=true;const go=()=>{if(!this.musOn)return;if(!this.ducked&&!document.hidden&&this.ctx&&this.ctx.state==="running")this.playTune();this.muT=setTimeout(go,150000+Math.random()*120000);};this.muT=setTimeout(go,6000);},
  stopMusic(){this.musOn=false;clearTimeout(this.muT);this.stopTune();},
  /* ---------- feedback tones: never ducked to silence, so a drill still says right or wrong over the heart sound ---------- */
  fx(kind){if(!TP.tones)return;if(!this.ensure())return;const c=this.ctx,t=c.currentTime+.01;this.fxAt(kind,t);},
  fxAt(kind,t){const c=this.ctx,F=this.fxG;
    if(kind==="right"){this.lute(76,t,.42,1.4,F);this.lute(81,t+.11,.4,1.8,F);}
    /* wrong: a soft falling semitone (E4 to D#4), audible on a phone speaker and quieter than right */
    else if(kind==="wrong"){this.lute(64,t,.22,1.1,F);this.lute(63,t+.17,.2,1.4,F);}
    else if(kind==="bell"||kind==="seal"){[1,2.76,5.4,8.93].forEach((r,i)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=392*r;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09/(i+1),t+.002);g.gain.exponentialRampToValueAtTime(.0005,t+3.2/(i*.6+1));o.connect(g);g.connect(F);o.start(t);o.stop(t+3.5);o.onended=()=>{try{g.disconnect();}catch(e){}};});
      if(kind==="seal"){[57,64,69,72].forEach((m,i)=>this.lute(m,t+.25+i*.09,.3,2.5,F));}}
    /* page: two soft flicks of paper, 70 ms apart, 2-6 kHz */
    else if(kind==="page"){const nb=this.cache.page||(this.cache.page=this.noise(.2,false));[0,.07].forEach((dt,k)=>{const s=c.createBufferSource(),hp=c.createBiquadFilter(),lp=c.createBiquadFilter(),g=c.createGain();
        s.buffer=nb;hp.type="highpass";hp.frequency.value=2000;lp.type="lowpass";lp.frequency.value=6000;const a=k?.06:.085,t0=t+dt;
        g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(a,t0+.005);g.gain.setTargetAtTime(0,t0+.01,.04);
        s.connect(hp);hp.connect(lp);lp.connect(g);g.connect(F);s.start(t0);s.stop(t0+.19);s.onended=()=>{try{g.disconnect();}catch(e){}};});}
    else if(kind==="door"){this.play(this.pluck(33,2.2,.15),t,.3,F);this.play(this.pluck(45,1.6,.2),t+.05,.12,F);}},
  /* state-based ducking: duck(true) any number of times is the same as once; only the clinical engine's state decides */
  duck(on){on=!!on;this.ducked=on;if(!this.ctx||!this.bedDuck)return;const t=this.ctx.currentTime,b=this.bedDuck.gain,f=this.fxDuck.gain;
    b.cancelScheduledValues(t);f.cancelScheduledValues(t);b.setValueAtTime(b.value,t);f.setValueAtTime(f.value,t);
    if(on){b.setTargetAtTime(0,t,.03);b.setValueAtTime(0,t+.35);f.setTargetAtTime(.25,t,.03);if(this.tune)this.stopTune();}
    else{b.setTargetAtTime(1,t+.3,.6);f.setTargetAtTime(1,t+.1,.2);}},
  setVol(v){if(this.vol)this.vol.gain.setTargetAtTime(v,this.ctx.currentTime,.03);},
  apply(){if(!TP.amb&&!TP.music&&!TP.tones){this.stopAmb();this.stopMusic();if(this.ctx&&this.ctx.suspend)this.ctx.suspend().catch(()=>{});return;}
    if(!this.ensure())return;this.setVol(TP.vol);
    if(TP.amb)this.startAmb();else this.stopAmb();if(TP.music)this.startMusic();else this.stopMusic();}
};
/* silent while a clinical sound plays: the stethoscope always wins */
document.addEventListener("galen:clinical",e=>SND.duck(!!(e.detail&&e.detail.on)));
/* unlock on the first gesture, as browsers require. On a fresh profile with ambience on by default (wide screens), ask first. */
const _sndFresh=!TP.seen&&TP.asked==null;if(!_sndFresh&&TP.asked==null)TP.asked=1;
let _sndUnlocked=false;
function sndAsk(){if($("#snd-ask"))return;const d=document.createElement("div");d.id="snd-ask";d.className="snd-ask";d.setAttribute("role","dialog");d.setAttribute("aria-label","Theatre sound");
  d.innerHTML=`<div class="snd-ask-t"><b>Light the candles?</b><span class="small muted">A candlelit room and, now and then, a lute. Heart and lung sounds always play alone.</span></div>
   <div class="row-x"><button class="btn sm" data-snd="on">${ic("sound")}Sound on</button><button class="btn ghost sm" data-snd="off">Keep quiet</button></div>`;
  document.body.appendChild(d);
  d.addEventListener("click",e=>{const b=e.target.closest("[data-snd]");if(!b)return;TP.asked=1;if(b.dataset.snd==="off"){TP.amb=0;TP.music=0;}tpSave();d.remove();SND.apply();soundBtn();});}
["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,e=>{if(_sndUnlocked)return;_sndUnlocked=true;
  if(_sndFresh&&(TP.amb||TP.music)){const keep={amb:TP.amb,music:TP.music};TP.amb=0;TP.music=0;SND.apply();Object.assign(TP,keep);setTimeout(sndAsk,0);return;}
  SND.apply();soundBtn();},{passive:true,capture:true}));
document.addEventListener("visibilitychange",()=>{if(!SND.ctx)return;if(document.hidden)SND.ctx.suspend().catch(()=>{});else if(TP.amb||TP.music||TP.tones)SND.ctx.resume().catch(()=>{});});
/* the sound button mutes everything theatrical (room, lute and tones) and brings back what was on before */
function sndState(){const on=[TP.amb&&"room",TP.music&&"lute",TP.tones&&"tones"].filter(Boolean);return on;}
function soundBtn(){const b=$("#soundbtn");if(!b)return;const s=sndState(),on=s.length>0;b.innerHTML=ic(on?"sound":"mute");b.setAttribute("aria-pressed",on);
  const what=s.length===3?"room, lute and tones":s.join(" and ");b.title=on?`Theatre sound on: ${what} (M)`:"Theatre sound off (M)";b.setAttribute("aria-label",b.title);}
function toggleSound(){const on=sndState().length>0;
  if(on){TP.prev={amb:TP.amb?1:0,music:TP.music?1:0,tones:TP.tones?1:0};TP.amb=0;TP.music=0;TP.tones=0;}
  else{const p=TP.prev&&(TP.prev.amb||TP.prev.music||TP.prev.tones)?TP.prev:{amb:1,music:1,tones:1};TP.amb=p.amb;TP.music=p.music;TP.tones=p.tones;}
  TP.asked=1;$("#snd-ask")?.remove();tpSave();SND.apply();soundBtn();const s=sndState();
  toast(on?"Theatre sound off":`Theatre sound on: ${s.length===3?"room, lute and tones":s.join(" and ")}`);
  const tg=(id,v)=>{const x=$(id);if(x)x.checked=!!v;};tg("#ts-amb",TP.amb);tg("#ts-mus",TP.music);tg("#ts-ton",TP.tones);}
$("#soundbtn").addEventListener("click",toggleSound);soundBtn();

/* ================= SETTINGS: the theatre group ================= */
{const _set=ROUTES["tools:settings"];ROUTES["tools:settings"]=(root)=>{_set(root);const el=document.createElement("section");el.className="card stack theatre-set";el.id="theatre-settings";
  const sz=TP.size||"m";
  el.innerHTML=`<div class="row-x"><h2>The theatre</h2><span class="spacer"></span><span class="pill">This device only</span></div>
  <p class="small muted" style="margin:0">Sound is generated on the device; nothing is downloaded. The room and the lute fall silent whenever a heart or lung sound plays, and when Galen is in the background. Tones stay, quietly.</p>
  <label class="ts-row"><input type="checkbox" id="ts-amb" ${TP.amb?"checked":""}><span>Candlelit room (ambience)</span></label>
  <label class="ts-row"><input type="checkbox" id="ts-mus" ${TP.music?"checked":""}><span>A lute in the gallery, now and then (Greensleeves, 16th century)</span></label>
  <label class="ts-row"><input type="checkbox" id="ts-ton" ${TP.tones?"checked":""}><span>Tones for right and wrong answers</span></label>
  <div class="mixrow"><span class="small">Volume</span><input type="range" id="ts-vol" min="0" max="1" step=".05" value="${TP.vol}" aria-label="Theatre volume"><span class="mono small" id="ts-vv">${Math.round(TP.vol*100)}%</span></div>
  <div class="row-x"><span class="small">Text size</span><div class="seg sm" role="group" aria-label="Text size">${[["s","Small"],["m","Normal"],["l","Large"]].map(([k,t])=>`<button data-sz="${k}" aria-pressed="${sz===k}">${t}</button>`).join("")}</div></div>
  <div class="row-x ts-btns"><button class="btn ghost sm" id="ts-test" aria-pressed="false">${ic("play")}Play the lute</button><button class="btn ghost sm" id="ts-tones">Hear the tones</button><button class="btn ghost sm" id="ts-help">${ic("pad")}Keys and controller</button></div>`;
  const ph=root.querySelector(".ph");if(ph)ph.after(el);else root.prepend(el);
  const upd=()=>{TP.amb=$("#ts-amb").checked?1:0;TP.music=$("#ts-mus").checked?1:0;TP.tones=$("#ts-ton").checked?1:0;TP.asked=1;tpSave();SND.apply();soundBtn();};
  ["#ts-amb","#ts-mus","#ts-ton"].forEach(s=>$(s).addEventListener("change",upd));
  $("#ts-vol").addEventListener("input",e=>{TP.vol=+e.target.value;$("#ts-vv").textContent=Math.round(TP.vol*100)+"%";SND.setVol(TP.vol);tpSave();});
  $$("[data-sz]",el).forEach(b=>b.addEventListener("click",()=>{TP.size=b.dataset.sz;tpSave();applySize();$$("[data-sz]",el).forEach(x=>x.setAttribute("aria-pressed",x===b));}));
  const tb=$("#ts-test"),lbl=on=>{if(!tb.isConnected){SND.onTune=null;return;}tb.innerHTML=on?`${ic("pause")}Stop the lute`:`${ic("play")}Play the lute`;tb.setAttribute("aria-pressed",on);};
  SND.onTune=lbl;lbl(!!SND.tune);
  tb.addEventListener("click",()=>{if(SND.tune){SND.stopTune();return;}if(!SND.ensure()){toast("Sound isn't available in this browser.");return;}
    if(SND.ducked){toast("A heart or lung sound is playing: the lute waits.");return;}SND.playTune();});
  $("#ts-tones").addEventListener("click",()=>{if(!SND.ensure())return;const t=SND.ctx.currentTime+.05;SND.fxAt("right",t);SND.fxAt("wrong",t+1.4);
    if(!TP.tones)toast("Tones are off: this is how they would sound.");});
  $("#ts-help").addEventListener("click",helpOverlay);};}
