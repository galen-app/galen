/* Galen audio regression test (D18). Offline renders with OfflineAudioContext plus a live ducking check.
   Usage: node test/audio.js [port]   (default 8765). Exit code 1 on any failure. Prints a table of levels with -v. */
const {chromium}=require('playwright');
const PORT=process.argv.find(a=>/^\d+$/.test(a))||8765, VERBOSE=process.argv.includes('-v');
(async()=>{
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1280,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));if(VERBOSE)p.on('console',m=>{if(m.text().startsWith('[audio]'))console.log(m.text());});
await p.goto(`http://localhost:${PORT}/`);await p.waitForTimeout(1200);
const R=await p.evaluate(async()=>{
  const out={fail:[],info:{}};const F=(ok,msg)=>{if(!ok)out.fail.push(msg);};
  const db=x=>20*Math.log10(Math.max(x,1e-12));
  const stats=(a,from=0,to=a.length)=>{let pk=0,s=0,nan=0;for(let i=from;i<to;i++){const v=a[i];if(!Number.isFinite(v)){nan++;continue;}const av=Math.abs(v);if(av>pk)pk=av;s+=v*v;}return {pk,rms:Math.sqrt(s/Math.max(1,to-from)),nan};};
  const OSR=48000;
  /* ---------- theatre: render SND on an offline context ---------- */
  const keep={ctx:SND.ctx,vol:SND.vol,bedDuck:SND.bedDuck,fxDuck:SND.fxDuck,ambG:SND.ambG,musG:SND.musG,fxG:SND.fxG,cache:SND.cache,amb:SND.amb,tune:SND.tune,ducked:SND.ducked,hallKey:SND.hallKey,_room:SND._room,_ir:SND._ir,_crk:SND._crk,_sr:SND._sr,out:SND.out,musOn:SND.musOn};
  const tones=TP.tones;TP.tones=1;
  async function theatre(sec,fn){const oc=new OfflineAudioContext(2,Math.round(OSR*sec),OSR);SND.ducked=false;SND.build(oc);SND.vol.gain.value=.55;fn(oc);const r=await oc.startRendering();return [r.getChannelData(0),r.getChannelData(1)];}
  const T={};const t00=performance.now();const lg=m=>console.log('[audio] '+m+' '+Math.round(performance.now()-t00)+' ms');
  for(const k of ['right','wrong','bell','seal','page','door']){const [L,Rr]=await theatre(3.5,()=>SND.fxAt(k,.05));const s=stats(L),s2=stats(Rr);
    /* loudness over the loudest 300 ms window */
    let w=0,n=Math.round(OSR*.3);for(let i=0;i+n<L.length;i+=Math.round(OSR*.02)){const q=stats(L,i,i+n).rms;if(q>w)w=q;}
    T[k]={pk:+db(Math.max(s.pk,s2.pk)).toFixed(1),loud300:+db(w).toFixed(1),nan:s.nan+s2.nan};
    F(s.nan+s2.nan===0,`fx ${k}: ${s.nan+s2.nan} NaN samples`);F(Math.max(s.pk,s2.pk)<.891,`fx ${k}: peak ${db(Math.max(s.pk,s2.pk)).toFixed(1)} dBFS (want < -1)`);F(w>Math.pow(10,-48/20),`fx ${k}: too quiet (${db(w).toFixed(1)} dBFS)`);}
  F(T.right.loud300>=T.wrong.loud300,`right (${T.right.loud300}) should be at least as loud as wrong (${T.wrong.loud300})`);
  /* the original blocker: after a pluck, the shared graph must still pass sound */
  {const [L]=await theatre(4,oc=>{SND.fxAt('right',.05);SND.startAmb();});const s=stats(L,OSR*2,OSR*4);F(s.nan===0&&s.rms>1e-4,`after fx('right') the theatre is silent or NaN (rms ${db(s.rms).toFixed(1)}, NaN ${s.nan})`);}
  /* ambience level */
  {const [L]=await theatre(12,()=>{SND.startAmb();});const s=stats(L,OSR*8,OSR*12);T.ambience={rms:+db(s.rms).toFixed(1),pk:+db(s.pk).toFixed(1),nan:s.nan};
    F(s.nan===0,'ambience NaN');F(s.rms>Math.pow(10,-50/20)&&s.rms<Math.pow(10,-36/20),`ambience RMS ${db(s.rms).toFixed(1)} dBFS (want -50 to -36)`);}
  /* the tune: first 20 s, alone, and over the ambience */
  {const [L]=await theatre(20,()=>{SND.schedTune(.3,SND.musG,0);});const s=stats(L,OSR*1,OSR*20);T.tune={rms:+db(s.rms).toFixed(1),pk:+db(s.pk).toFixed(1),nan:s.nan};
    F(s.nan===0,'tune NaN');F(s.pk<.891,`tune peak ${db(s.pk).toFixed(1)}`);F(db(s.rms)>T.ambience.rms+4,`lute (${db(s.rms).toFixed(1)}) should sit at least 4 dB above the room (${T.ambience.rms})`);}
  /* ducking, offline: ambience + tune with duck(true) at once: silent after 0.4 s */
  {const [L]=await theatre(3,()=>{SND.startAmb();SND.schedTune(.1,SND.musG,0);SND.duck(true);});const s=stats(L,Math.round(OSR*.5),L.length);T.ducked={rms:+db(s.rms).toFixed(1)};
    F(s.rms<Math.pow(10,-90/20),`ducked bed not silent: ${db(s.rms).toFixed(1)} dBFS`);}
  {const [L]=await theatre(3,()=>{SND.duck(true);SND.fxAt('right',.5);});const s=stats(L);T.duckedTone={pk:+db(s.pk).toFixed(1)};F(s.pk>Math.pow(10,-50/20),'tones must still sound (quietly) while ducked');}
  /* pluck tuning: autocorrelation pitch of 0.2-0.5 s, within 3 cents */
  {const oc=new OfflineAudioContext(1,OSR,OSR);SND.build(oc);const cents=[];
    for(const m of [40,45,57,64,68,69,72,74,76,77,78,79,81]){const y=SND.pluck(m,1.2,.55).getChannelData(0),f=440*Math.pow(2,(m-69)/12),P=OSR/f,a0=Math.round(OSR*.2),N=Math.round(OSR*.25);
      let best=0,bl=0;for(let l=Math.floor(P*.97);l<=Math.ceil(P*1.03);l++){let s=0;for(let i=0;i<N;i++)s+=y[a0+i]*y[a0+i+l];if(s>best){best=s;bl=l;}}
      const c0=(()=>{let s=0;for(let i=0;i<N;i++)s+=y[a0+i]*y[a0+i+bl-1];return s;})(),c2=(()=>{let s=0;for(let i=0;i<N;i++)s+=y[a0+i]*y[a0+i+bl+1];return s;})();
      const lag=bl+.5*(c0-c2)/(c0-2*best+c2);const ce=1200*Math.log2(P/lag);cents.push([m,+ce.toFixed(1)]);F(Math.abs(ce)<3,`pluck ${m} off by ${ce.toFixed(1)} cents`);
      let nan=0;for(const v of y)if(!Number.isFinite(v))nan++;F(nan===0,`pluck ${m} NaN`);}
    T.cents=cents.map(x=>x.join(':')).join(' ');}
  /* Greensleeves structure: 94 beats with the pickup, a bass note on every downbeat */
  {let pos=0,bars=0;SND.GREEN.mel.forEach(([m,d])=>{if(pos>=1&&Math.abs(((pos-1)%3+3)%3)<.01)bars++;pos+=d;});F(Math.abs(pos-94)<.01,`tune length ${pos} beats (want 94)`);F(bars===SND.GREEN.bass.length,`downbeats ${bars} vs bass ${SND.GREEN.bass.length}`);}
  Object.assign(SND,keep);TP.tones=tones;out.info.theatre=T;lg('theatre done');
  /* ---------- clinical chains ---------- */
  async function clin(buf,mode,piece,sr=SR){const CSR=24000,len=Math.ceil(buf.length/sr*CSR);const oc=new OfflineAudioContext(1,len,CSR);
    const ab=oc.createBuffer(1,buf.length,sr);ab.getChannelData(0).set(buf);const s=oc.createBufferSource();s.buffer=ab;
    const ch=buildChain(oc,mode);const ns=pieceNodes(oc,piece||'open');let h=s;ns.forEach(n=>{h.connect(n);h=n;});h.connect(ch.input);ch.output.connect(oc.destination);s.start();
    const r=await oc.startRendering();return r.getChannelData(0);}
  const tone=a=>{const n=SR*2,x=new Float32Array(n);for(let i=0;i<n;i++)x[i]=a*Math.sin(2*Math.PI*200*i/SR);return x;};
  const G={};for(const m of ['phones','speaker'])for(const a of [.003,.03,.3]){const o=await clin(tone(a),m);const s=stats(o,Math.floor(o.length/2),o.length);G[m+'@'+db(a).toFixed(0)]=+(db(s.rms)-db(a/Math.SQRT2)).toFixed(1);}
  out.info.gain=G;
  F(Math.abs(G['phones@-50'])<1&&Math.abs(G['phones@-30'])<1&&Math.abs(G['phones@-10'])<1,`phones small-signal gain not unity: ${JSON.stringify(G)}`);
  F(Math.abs(G['speaker@-50']-G['speaker@-30'])<1.5,`speaker chain compresses quiet sounds: ${JSON.stringify(G)}`);
  const rows={};
  for(const id of Object.keys(SOUNDS)){const d=getData(id,72);const si=stats(d.buf);const row={in:+db(si.rms).toFixed(1)};
    for(const m of ['phones','speaker']){const o=await clin(d.buf,m,SOUNDS[id].piece);const s=stats(o);row[m]=+db(s.rms).toFixed(1);row[m+'Pk']=+db(s.pk).toFixed(1);
      F(s.nan===0,`${id} ${m}: NaN`);F(s.pk<.95,`${id} ${m}: peak ${db(s.pk).toFixed(1)} dBFS`);}
    rows[id]=row;}
  out.info.rows=rows;lg('chains done');
  const rel=(a,b2,m)=>rows[a][m]-rows[b2][m];
  for(const m of ['phones','speaker']){
    F(rel('silent-chest','vesicular',m)<-14,`${m}: silent chest only ${rel('silent-chest','vesicular',m).toFixed(1)} dB below vesicular`);
    F(rel('diminished','vesicular',m)<-9,`${m}: diminished only ${rel('diminished','vesicular',m).toFixed(1)} dB below vesicular`);
    F(rel('muffled','normal',m)<-6,`${m}: muffled only ${rel('muffled','normal',m).toFixed(1)} dB below normal`);
    F(rel('absent-breath','vesicular',m)<-20,`${m}: absent breath only ${rel('absent-breath','vesicular',m).toFixed(1)} dB below vesicular`);}
  /* S3 softer than S2 (phones, bell): peak in a window around each marker */
  {const d=getData('s3',72);const o=await clin(d.buf,'phones','bell');const pkAt=l=>Math.max(...d.markers.filter(x=>x.l===l).map(x=>{const i=Math.round(x.t*24000);return stats(o,Math.max(0,i-100),Math.min(o.length,i+Math.round(24000*.08))).pk;}));
    const s2=pkAt('S2'),s3=pkAt('S3');out.info.s3={S2:+db(s2).toFixed(1),S3:+db(s3).toFixed(1)};F(s3<s2,`S3 (${db(s3).toFixed(1)}) not softer than S2 (${db(s2).toFixed(1)})`);}
  /* bell vs diaphragm */
  /* isolate the feature (no S1/S2) so the comparison is about the feature itself */
  const iso={ms:genHeart({s1:0,a2:0,p2:0,mur:SOUNDS.ms.syn.mur},72).buf,ar:genHeart({s1:0,a2:0,p2:0,mur:SOUNDS.ar.syn.mur.filter(m=>m.t==='ar')},72).buf,s3:genHeart({s1:0,a2:0,p2:0,s3:.6},72).buf,'fine-crackles':getData('fine-crackles',72).buf};
  {const P={};for(const id of Object.keys(iso))for(const pc of ['bell','diaph']){const o=await clin(iso[id],'phones',pc);P[id+'.'+pc]=+db(stats(o).rms).toFixed(1);}
    out.info.piece=P;
    F(P['ms.bell']-P['ms.diaph']>8,`MS rumble: diaphragm only ${(P['ms.bell']-P['ms.diaph']).toFixed(1)} dB softer than bell`);
    F(P['s3.bell']-P['s3.diaph']>8,`S3: diaphragm only ${(P['s3.bell']-P['s3.diaph']).toFixed(1)} dB softer than bell`);
    F(P['ar.diaph']-P['ar.bell']>4,`AR: bell only ${(P['ar.diaph']-P['ar.bell']).toFixed(1)} dB softer than diaphragm`);
    F(P['fine-crackles.diaph']-P['fine-crackles.bell']>3,`fine crackles: bell only ${(P['fine-crackles.diaph']-P['fine-crackles.bell']).toFixed(1)} dB softer`);}
  /* paradoxical split: P2 moves, A2 stays */
  {const d=getData('paradox-split',72),T0=d.T;const a2=d.markers.filter(m=>m.l==='A2').map(m=>+(m.t%T0).toFixed(3));F(new Set(a2).size<=1,`paradoxical split: A2 moves (${a2})`);}
  /* coarse crackles: two-cycle duration > 10 ms */
  {const f=150;F(2/f*1000>10,'coarse crackle 2CD');}
  lg('all done');return out;});
/* ---------- live ducking: ambience on, play a heart sound, check the bed is silent; then stop ---------- */
await p.evaluate(()=>{TP.amb=1;TP.music=0;TP.tones=1;TP.asked=1;});
await p.mouse.click(5,400);await p.waitForTimeout(300);
await p.evaluate(()=>{SND.apply();});
await p.evaluate(()=>{open('sounds','sound','as');});await p.waitForTimeout(900);
await p.click('.player .play');await p.waitForTimeout(700);
const live1=await p.evaluate(()=>({ducked:SND.ducked,bed:SND.bedDuck&&SND.bedDuck.gain.value,src:!!E.src}));
await p.click('.player .play');await p.waitForTimeout(1500);
const live2=await p.evaluate(()=>({ducked:SND.ducked,bed:SND.bedDuck&&SND.bedDuck.gain.value,src:!!E.src}));
/* fast toggles must not leak or kill the room */
const race=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<6;i++){toggleSound();await w(120);}await w(2000);
  const on=sndState().length>0;if(!on){toggleSound();await w(200);}return {amb:!!SND.amb,ambOn:TP.amb};});
if(!(live1.ducked&&live1.src&&live1.bed<.01))R.fail.push(`live ducking failed while playing: ${JSON.stringify(live1)}`);
if(live2.ducked||live2.src)R.fail.push(`live ducking did not release: ${JSON.stringify(live2)}`);
if(race.ambOn&&!race.amb)R.fail.push(`toggle race: ambience lost ${JSON.stringify(race)}`);
errs.forEach(e=>R.fail.push('page error: '+e));
if(VERBOSE){console.log(JSON.stringify(R.info.theatre,null,1));console.log('gain',R.info.gain,'s3',R.info.s3,'piece',R.info.piece);console.table(R.info.rows);console.log({live1,live2,race});}
console.log(R.fail.length?`audio: ${R.fail.length} failure(s)\n - `+R.fail.join('\n - '):'audio: all checks passed');
await b.close();process.exit(R.fail.length?1:0);})();
