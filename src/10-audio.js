
"use strict";
/* ================= AUDIO SYNTHESIS ================= */
const SR = 22050, EBR = 800;
const rnd = (a,b)=>a+Math.random()*(b-a);
function biquad(x,type,f,Q){
  const w=2*Math.PI*f/SR, cs=Math.cos(w), sn=Math.sin(w), al=sn/(2*Q);
  let b0,b1,b2;
  if(type==="lp"){b0=(1-cs)/2;b1=1-cs;b2=(1-cs)/2;}
  else if(type==="hp"){b0=(1+cs)/2;b1=-(1+cs);b2=(1+cs)/2;}
  else {b0=al;b1=0;b2=-al;}
  const a0=1+al,a1=-2*cs,a2=1-al;
  b0/=a0;b1/=a0;b2/=a0;const A1=a1/a0,A2=a2/a0;
  const y=new Float32Array(x.length);let x1=0,x2=0,y1=0,y2=0;
  for(let i=0;i<x.length;i++){const v=b0*x[i]+b1*x1+b2*x2-A1*y1-A2*y2;x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v;}
  return y;
}
function noise(n){const a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;return a;}
function rmsNorm(a,target){let s=0;for(let i=0;i<a.length;i++)s+=a[i]*a[i];const r=Math.sqrt(s/Math.max(1,a.length))||1;const k=target/r;for(let i=0;i<a.length;i++)a[i]*=k;return a;}
function addAt(buf,t,seg){const st=Math.round(t*SR),L=buf.length;for(let i=0;i<seg.length;i++){let j=(st+i)%L;if(j<0)j+=L;buf[j]+=seg[i];}}
function thud(f0,dur,amp,parts){
  parts=parts||[[1,1,1],[1.9,.5,.75],[3.1,.25,.5]];
  const n=Math.round(dur*SR),s=new Float32Array(n);
  const ph=parts.map(()=>rnd(0,Math.PI*2));
  for(let i=0;i<n;i++){const t=i/SR;const atk=1-Math.exp(-t/.0028);let v=0;
    parts.forEach((p,k)=>{v+=p[1]*Math.sin(2*Math.PI*f0*p[0]*t+ph[k])*Math.exp(-t/(dur*.3*p[2]));});
    s[i]=amp*atk*v;}
  return s;
}
function shapeEnv(x,o){
  switch(o.shape){
    case "cd":{const p=o.peak||.4;let e=x<p?x/p:(1-x)/(1-p);return Math.sin(Math.max(0,e)*Math.PI/2);}
    case "holo":return Math.min(1,x/.05,(1-x)/.05);
    case "dec":return Math.min(1,x/.03)*Math.exp(-2.4*x);
    case "cres":return Math.min(1,(1-x)/.06)*(.25+.75*Math.pow(x,1.2));
    default:return 1;
  }
}
function murmurSeg(dur,o){
  const n=Math.max(1,Math.round(dur*SR));
  let s=biquad(noise(n),"bp",o.fc||300,o.q||.9);
  if(o.harsh){const h=biquad(noise(n),"bp",(o.fc||300)*.5,1.1);for(let i=0;i<n;i++)s[i]+=h[i]*.9;}
  if(o.lp)s=biquad(s,"lp",o.lp,.7);
  rmsNorm(s,.3);
  let jit=1,jt=0;
  for(let i=0;i<n;i++){
    if(o.eddy){if(i%220===0)jt=rnd(.55,1.1);jit+=(jt-jit)*.004;}
    s[i]*=o.amp*shapeEnv(i/n,o)*(o.eddy?jit:1);
  }
  return s;
}
function innocentSeg(dur,amp){
  const n=Math.round(dur*SR),s=new Float32Array(n);const f=rnd(92,104);
  const nz=rmsNorm(biquad(noise(n),"bp",180,1.2),.08);
  for(let i=0;i<n;i++){const t=i/SR,x=i/n;const e=Math.sin(Math.min(1,x<.35?x/.35:(1-x)/.65)*Math.PI/2);
    const v=Math.sin(2*Math.PI*f*t)+.55*Math.sin(2*Math.PI*f*2*t)+.3*Math.sin(2*Math.PI*f*3*t);
    s[i]=amp*e*(v*.32+nz[i]);}
  return s;
}
function grainy(dur,amp,hp,lp){
  const n=Math.round(dur*SR);let s=biquad(noise(n),"hp",hp||280,.7);if(lp)s=biquad(s,"lp",lp,.7);
  rmsNorm(s,.3);let g=0;
  for(let i=0;i<n;i++){if(i%90===0)g=Math.random()<.45?rnd(.6,1.4):rnd(.05,.25);const x=i/n;s[i]*=amp*g*Math.sin(Math.PI*x);}
  return s;
}

/* ---- heart ---- */
const RESP=[.6,1,.3,0];
function genHeart(spec,hr){
  const T=60/hr, sys=.36*Math.sqrt(T), beats=8, dur=beats*T;
  const buf=new Float32Array(Math.ceil(dur*SR)), markers=[], phases=[];
  const P1=[[1,1,1],[1.9,.55,.75],[3.1,.3,.5]], P2=[[1,1,1],[1.85,.6,.7],[2.9,.35,.5]], PLOW=[[1,1,1],[2,.3,.7]], PHI=[[1,1,1],[2,.45,.6]];
  for(let k=0;k<beats;k++){
    const tb=k*T, d=RESP[k%4], j=()=>rnd(.93,1.07);
    if(spec.resp && k%4===0) phases.push({s:tb,e:tb+1.6*T,type:"insp"});
    addAt(buf,tb,thud(rnd(52,58),.12,(spec.s1??1)*j(),P1)); markers.push({t:tb,l:"S1"});
    const sp=spec.split?spec.split[0]+(spec.split[1]-spec.split[0])*d:.012;
    let A2,Pt;
    if(spec.paradox){Pt=tb+sys;A2=Pt+sp;}else{A2=tb+sys;Pt=A2+sp;}
    addAt(buf,A2,thud(74,.085,(spec.a2??.95)*j(),P2));
    addAt(buf,Pt,thud(86,.075,(spec.p2??.5)*j(),P2));
    if(sp>.03){markers.push({t:A2,l:"A2"});markers.push({t:Pt,l:"P2"});}else markers.push({t:Math.min(A2,Pt),l:"S2"});
    const S2=Math.min(A2,Pt), S2b=Math.max(A2,Pt);
    phases.push({s:tb,e:S2,type:"sys"});
    if(spec.s3){addAt(buf,S2b+.15,thud(38,.1,spec.s3*j(),PLOW));markers.push({t:S2b+.15,l:"S3"});}
    if(spec.s4){addAt(buf,tb-.085,thud(42,.09,spec.s4*j(),PLOW));markers.push({t:(tb-.085+dur)%dur,l:"S4"});}
    if(spec.ec){addAt(buf,tb+.05,thud(190,.035,spec.ec*j(),PHI));markers.push({t:tb+.05,l:"EC"});}
    const msc=tb+.5*sys;
    if(spec.msc){addAt(buf,msc,thud(210,.032,spec.msc*j(),PHI));markers.push({t:msc,l:"C"});}
    const os=A2+.075;
    if(spec.os){addAt(buf,os,thud(170,.045,spec.os*j(),PHI));markers.push({t:os,l:"OS"});}
    (spec.mur||[]).forEach(m=>{
      const a=m.amp*j();
      switch(m.t){
        case "ej":addAt(buf,tb+.06,murmurSeg(A2-.03-(tb+.06),{shape:"cd",peak:m.peak||.4,fc:m.fc||260,q:.8,harsh:true,amp:a}));break;
        case "hocm":addAt(buf,tb+.07,murmurSeg(A2-.02-(tb+.07),{shape:"cd",peak:.62,fc:240,q:.8,harsh:true,amp:a}));break;
        case "holo":addAt(buf,tb+.01,murmurSeg(A2+.01-(tb+.01),{shape:"holo",fc:m.fc||380,q:m.q||.8,harsh:m.harsh,amp:a*(m.carvallo?.55+.9*d:1)}));break;
        case "late":addAt(buf,msc+.02,murmurSeg(A2-(msc+.02),{shape:"cres",fc:400,q:.8,amp:a}));break;
        case "flow":addAt(buf,tb+.06,murmurSeg(A2-.04-(tb+.06),{shape:"cd",peak:.4,fc:230,q:.9,amp:a}));break;
        case "early":addAt(buf,tb+.01,murmurSeg(sys*.62,{shape:"dec",fc:320,q:.8,amp:a}));break;
        case "inn":addAt(buf,tb+.06,innocentSeg(sys*.55,a));break;
        case "ar":addAt(buf,A2+.004,murmurSeg((T-sys)*.62,{shape:"dec",fc:470,q:.9,amp:a}));break;
        case "ms":{
          const r0=os+.03, rl=(T-sys)*.42;
          addAt(buf,r0,murmurSeg(rl,{shape:"dec",fc:80,q:.8,lp:160,eddy:true,amp:a}));
          addAt(buf,tb+T-.17,murmurSeg(.16,{shape:"cres",fc:85,q:.8,lp:170,eddy:true,amp:a*1.1}));break;}
        case "pda":{
          const st=tb+.03, L=T-.04, n=Math.round(L*SR), pk=(A2-st)/L;
          let s=biquad(noise(n),"bp",250,.8);const h=biquad(noise(n),"bp",130,1);for(let i=0;i<n;i++)s[i]+=h[i]*.8;rmsNorm(s,.3);
          let jit=1,jt=1;for(let i=0;i<n;i++){const x=i/n;if(i%200===0)jt=rnd(.5,1.15);jit+=(jt-jit)*.005;
            const e=x<pk?.25+.75*(x/pk):1-.72*((x-pk)/(1-pk));s[i]*=a*e*jit*Math.min(1,x/.03,(1-x)/.03);}
          addAt(buf,st,s);break;}
      }
    });
    if(spec.mech){const PM=[[1,1,1],[2.2,.6,.6],[3.5,.35,.4]];
      addAt(buf,tb+.05,thud(650,.02,.32*j(),PM));addAt(buf,A2,thud(920,.025,1.05*j(),PM));
      markers.push({t:tb+.05,l:"OC"});markers.push({t:A2+.001,l:"CC"});}
    if(spec.hamman){const k2=spec.hamman*rnd(.5,1.1);
      [[tb+.04,tb+.24],[S2b+.05,S2b+.17]].forEach(([a,b])=>{let t=a;while(t<b){addAt(buf,t,crackle(rnd(260,520),rnd(6,12),rnd(.12,.4)*k2));t+=rnd(.012,.032);}});
      markers.push({t:tb+.12,l:"crunch"});}
    if(spec.rub){
      addAt(buf,tb-.13,grainy(.09,spec.rub*.8));
      addAt(buf,tb+.07,grainy(.15,spec.rub));
      addAt(buf,A2+.09,grainy(.11,spec.rub*.85));
    }
  }
  const hiss=rmsNorm(biquad(noise(buf.length),"lp",500,.7),.006);for(let i=0;i<buf.length;i++)buf[i]+=hiss[i];
  return finish({buf,markers,phases,dur,kind:"heart",T});
}

/* ---- lungs ---- */
function tone(dur,f,amp,o){
  o=o||{};const n=Math.round(dur*SR),s=new Float32Array(n);let ph=0;const harm=o.harm||[1,.4,.18];
  for(let i=0;i<n;i++){const x=i/n,t=i/SR;
    const fi=f*(1-(o.drift||.06)*x)*(1+.012*Math.sin(2*Math.PI*(o.vib||5)*t));ph+=2*Math.PI*fi/SR;
    let v=0;harm.forEach((h,k)=>{v+=h*Math.sin(ph*(k+1));});
    const am=o.am?(.65+.35*Math.sin(2*Math.PI*o.am*t)):1;
    s[i]=amp*v*am*Math.min(1,x/.1,(1-x)/.12);}
  return s;
}
function crackle(f,ms,amp){
  const n=Math.round(ms/1000*SR),s=new Float32Array(n),sg=Math.random()<.5?-1:1;
  for(let i=0;i<n;i++){const t=i/SR;s[i]=sg*amp*Math.sin(2*Math.PI*f*t)*Math.exp(-t/(ms/1000*.32));}
  return s;
}
function genLung(spec){
  const Ti=spec.Ti||1.5, Te=spec.Te||2.5, C=Ti+Te, cyc=2, dur=C*cyc;
  const N=Math.ceil(dur*SR), buf=new Float32Array(N), phases=[], markers=[];
  let base;
  if(spec.base==="bron"){const a=biquad(noise(N),"bp",620,.6),b=biquad(noise(N),"bp",1150,1.4);base=new Float32Array(N);for(let i=0;i<N;i++)base[i]=a[i]+.6*b[i];}
  else base=biquad(biquad(noise(N),"lp",420,.7),"hp",90,.7);
  rmsNorm(base,.3);
  for(let i=0;i<N;i++){
    const t=(i/SR)%C;let e;
    if(spec.base==="bron"){
      if(t<Ti){const x=t/Ti;e=.8*Math.min(1,x/.1,(1-x)/.08);}
      else{const y=(t-Ti-.18)/Te;e=y<0?0:1.0*Math.min(1,y/.06,(.8-y)/.12);e=Math.max(0,e);}
    }else{
      if(t<Ti){const x=t/Ti;e=(.3+.7*x)*Math.min(1,x/.1,(1-x)/.05);}
      else{const y=(t-Ti)/Te;e=.45*Math.exp(-y*5.5)*Math.min(1,y/.03);}
    }
    buf[i]=base[i]*e*spec.amp;
  }
  for(let c=0;c<cyc;c++){
    const t0=c*C;phases.push({s:t0,e:t0+Ti,type:"insp"});phases.push({s:t0+Ti,e:t0+C,type:"exp"});
    if(spec.crk==="fine"){const n=14;for(let k=0;k<n;k++){const t=t0+Ti*rnd(.5,.97);addAt(buf,t,crackle(rnd(520,820),rnd(3.5,6),rnd(.25,.45)));}markers.push({t:t0+Ti*.72,l:"late insp"});}
    if(spec.crk==="coarse"){for(let k=0;k<6;k++)addAt(buf,t0+Ti*rnd(.03,.4),crackle(rnd(210,300),rnd(11,17),rnd(.35,.55)));
      for(let k=0;k<4;k++)addAt(buf,t0+Ti+Te*rnd(.02,.3),crackle(rnd(200,280),rnd(12,18),rnd(.3,.45)));markers.push({t:t0+Ti*.2,l:"early insp"});}
    if(spec.wheeze){[[390,.16],[520,.12],[700,.09]].forEach(([f,a],k)=>addAt(buf,t0+Ti+.12+k*.03,tone(Te*.82,f*rnd(.97,1.03),a*(spec.wamp||1),{drift:.1,vib:rnd(4,6)})));
      addAt(buf,t0+Ti*.5,tone(Ti*.45,560,.04,{}));markers.push({t:t0+Ti+.4,l:"exp wheeze"});}
    if(spec.stridor){addAt(buf,t0+.08,tone(Ti*.9,640,.2,{harm:[1,.7,.5,.35,.2],drift:-.04,vib:7}));
      const nz=rmsNorm(biquad(noise(Math.round(Ti*.9*SR)),"bp",1300,1.2),.06);for(let i=0;i<nz.length;i++){const x=i/nz.length;nz[i]*=Math.min(1,x/.1,(1-x)/.12);}addAt(buf,t0+.08,nz);markers.push({t:t0+.3,l:"insp stridor"});}
    if(spec.rhonchi){addAt(buf,t0+Ti+.05,tone(Te*.75,140,.17,{harm:[1,.8,.5,.3],am:11,drift:.05}));addAt(buf,t0+Ti*.35,tone(Ti*.55,155,.08,{harm:[1,.8,.5],am:12}));markers.push({t:t0+Ti+.3,l:"rhonchi"});}
    if(spec.prub){
      const zones=[[t0+Ti*.6,t0+Ti*.98],[t0+Ti+.02,t0+Ti+Te*.32]];
      zones.forEach(([a,b])=>{let t=a;while(t<b){addAt(buf,t,crackle(rnd(170,320),rnd(12,20),rnd(.18,.4)));t+=rnd(.018,.045);}
        addAt(buf,a,grainy(b-a,.12,160,900));});
      markers.push({t:t0+Ti*.8,l:"rub"});markers.push({t:t0+Ti+Te*.15,l:"rub"});}
  }
  return finish({buf,markers,phases,dur,kind:"lung"});
}
function finish(d){
  let pk=0;for(let i=0;i<d.buf.length;i++){const v=Math.abs(d.buf[i]);if(v>pk)pk=v;}
  if(pk>.92){const k=.92/pk;for(let i=0;i<d.buf.length;i++)d.buf[i]*=k;}
  d.env={};d.markers.sort((a,b)=>a.t-b.t);return d;
}
function envOf(d,mode){
  if(d.env[mode])return d.env[mode];
  let x=d.buf;if(mode==="bell")x=biquad(x,"lp",PIECE.bell.f,.7);if(mode==="diaph")x=biquad(x,"hp",PIECE.diaph.f,.7);
  const nb=Math.ceil(d.dur*EBR),e=new Float32Array(nb);
  for(let i=0;i<x.length;i++){const b=Math.min(nb-1,Math.floor(i*EBR/SR)),v=Math.abs(x[i]);if(v>e[b])e[b]=v;}
  d.env[mode]=e;return e;
}
const PIECE={open:{label:"Full range"},bell:{label:"Bell",f:300},diaph:{label:"Diaphragm",f:110}};
const CACHE={};
function getData(id,hr){
  const s=SOUNDS[id];const key=s.kind==="heart"?id+"|"+hr:id;
  if(!CACHE[key])CACHE[key]=s.kind==="heart"?genHeart(s.syn,hr):genLung(s.syn);
  return CACHE[key];
}

const item=id=>SOUNDS[id]||REAL[id];
const REALCACHE={};
function loadReal(id){
  if(REALCACHE[id])return REALCACHE[id];
  const r=REAL[id];
  const pr=fetch(r.file).then(x=>{if(!x.ok)throw new Error(x.status);return x.arrayBuffer();}).then(ab=>new Promise((res,rej)=>{
    const OC=window.OfflineAudioContext||window.webkitOfflineAudioContext;const oc=new OC(1,SR,SR);
    const q=oc.decodeAudioData(ab,res,rej);if(q&&q.then)q.then(res,rej);})).then(ab=>{
    const buf=new Float32Array(ab.getChannelData(0));let m=0;for(let i=0;i<buf.length;i++){const v=Math.abs(buf[i]);if(v>m)m=v;}
    const k=m?.9/m:1;for(let i=0;i<buf.length;i++)buf[i]*=k;
    return {buf,markers:[],phases:r.ev.map(e=>({s:e[0],e:e[1],type:"ev",l:e[2]})),dur:buf.length/SR,kind:"real",env:{}};
  });
  REALCACHE[id]=pr;pr.catch(()=>{delete REALCACHE[id];});
  return pr;
}
/* ================= PLAYBACK ENGINE ================= */
const E={ctx:null,src:null,node:null,gain:null,box:null,t0:0,raf:0,mode:null,chains:{},el:null};
/* Output chains.
   speaker: small phone and laptop speakers reproduce almost nothing below ~150 Hz, where S1, S2, S3 and the MS rumble live.
            A harmonic exciter (low band → soft saturation → keep 150–1200 Hz) creates overtones the ear hears as the same low sound
            (the "missing fundamental"), then a presence lift, a compressor and make-up gain raise quiet events.
   phones:  faithful: gentle compression and a little gain only. */
function shaperCurve(){const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=x*Math.abs(x);}return c;} /* x·|x|: odd harmonics whose level tracks the input, so quiet sounds stay quieter */
function clipCurve(){const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){const x=(i/(n-1)*2-1)*1.5;c[i]=Math.tanh(x)*.92;}return c;}
function buildChain(c,mode){
  const input=c.createGain(),output=c.createGain();
  if(mode==="speaker"){
    const dry=c.createGain();dry.gain.value=.8;const dhp=c.createBiquadFilter();dhp.type="highpass";dhp.frequency.value=110;dhp.Q.value=.6; /* the phone cannot play below ~110 Hz: do not spend headroom on it */
    const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=220;lp.Q.value=.7;
    const pre=c.createGain();pre.gain.value=1.1;
    const sh=c.createWaveShaper();sh.curve=shaperCurve();sh.oversample="2x";
    const hp=c.createBiquadFilter();hp.type="highpass";hp.frequency.value=150;hp.Q.value=.7;
    const lp2=c.createBiquadFilter();lp2.type="lowpass";lp2.frequency.value=1400;lp2.Q.value=.7;
    const exc=c.createGain();exc.gain.value=2.6;
    const sum=c.createGain();
    const peak=c.createBiquadFilter();peak.type="peaking";peak.frequency.value=380;peak.Q.value=.8;peak.gain.value=8;
    const make=c.createGain();make.gain.value=2.2;
    const lim=c.createDynamicsCompressor();lim.threshold.value=-2;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.06;
    input.connect(dhp);dhp.connect(dry);dry.connect(sum);
    input.connect(lp);lp.connect(pre);pre.connect(sh);sh.connect(hp);hp.connect(lp2);lp2.connect(exc);exc.connect(sum);
    sum.connect(peak);peak.connect(make);make.connect(lim);lim.connect(output);
  }else{
    const comp=c.createDynamicsCompressor();comp.threshold.value=-22;comp.knee.value=10;comp.ratio.value=3;comp.attack.value=.003;comp.release.value=.2;
    const make=c.createGain();make.gain.value=1.7;
    const lim=c.createDynamicsCompressor();lim.threshold.value=-3;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.08;
    input.connect(comp);comp.connect(make);make.connect(lim);lim.connect(output);
  }
  const clip=c.createWaveShaper();clip.curve=clipCurve();
  const end=c.createGain();output.connect(clip);clip.connect(end);
  return {input,output:end,_pre:output};
}
function outMode(){try{return (typeof Store!=="undefined"&&Store.s.settings.out)||"speaker";}catch(e){return "speaker";}}
const IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function ctx(){
  if(!E.ctx){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    try{
      try{if(navigator.audioSession)navigator.audioSession.type="playback";}catch(e){}   /* iOS 17+: ignore the silent switch */
      E.ctx=new AC();E.gain=E.ctx.createGain();E.gain.gain.value=1;
      const master=E.ctx.createGain();master.gain.value=1;E.master=master;
      E.chains.speaker=buildChain(E.ctx,"speaker");E.chains.phones=buildChain(E.ctx,"phones");
      E.chains.speaker.output.connect(master);E.chains.phones.output.connect(master);
      /* Older iOS mutes Web Audio with the silent switch; a media element is not muted, so route through one there. */
      if(IOS&&!navigator.audioSession&&E.ctx.createMediaStreamDestination){
        try{const d=E.ctx.createMediaStreamDestination();master.connect(d);const el=new Audio();el.srcObject=d.stream;el.setAttribute("playsinline","");E.el=el;
          el.play().catch(()=>{master.connect(E.ctx.destination);E.el=null;});}catch(e){master.connect(E.ctx.destination);}
      }else master.connect(E.ctx.destination);
      setOutMode(outMode());
    }catch(e){console.warn(e);E.ctx=null;return null;}
  }
  if(E.ctx.state!=="running"){try{E.ctx.resume();}catch(e){}}
  if(E.el&&E.el.paused){E.el.play().catch(()=>{});}
  return E.ctx;
}
function setOutMode(m){
  if(!E.ctx){E.mode=m;return;}
  try{E.gain.disconnect();}catch(e){}
  E.gain.connect(E.chains[m==="phones"?"phones":"speaker"].input);E.mode=m;
}
function route(){
  if(!E.src)return;try{E.src.disconnect();}catch(e){}if(E.node){try{E.node.disconnect();}catch(e){}E.node=null;}
  const m=E.box.piece;
  if(m==="open"){E.src.connect(E.gain);return;}
  const f=E.ctx.createBiquadFilter();f.type=m==="bell"?"lowpass":"highpass";f.frequency.value=PIECE[m].f;f.Q.value=.7;
  E.src.connect(f);f.connect(E.gain);E.node=f;
}
function startBox(box){
  stopAll();const c=ctx();
  if(!c){if(typeof toast==="function")toast("Audio isn't available in this browser.");return;}
  if(!box.data){if(box.err)return;box.pending=true;box.setPlaying(true);return;}
  box.pending=false;const d=box.data;if(!d.ab){d.ab=c.createBuffer(1,d.buf.length,SR);d.ab.getChannelData(0).set(d.buf);}
  try{E.src=c.createBufferSource();E.src.buffer=d.ab;E.src.loop=true;E.box=box;route();E.src.start();}
  catch(e){console.warn(e);E.src=null;E.box=null;box.setPlaying(false);if(typeof toast==="function")toast("Couldn't start playback. Tap play again.");return;}
  E.t0=c.currentTime+.02;box.setPlaying(true);
  const loop=()=>{if(!E.box||!E.box.data)return;if(!E.box.cv.isConnected){stopAll();return;}E.box.draw(((E.ctx.currentTime-E.t0)%E.box.data.dur+E.box.data.dur)%E.box.data.dur);E.raf=requestAnimationFrame(loop);};loop();
  if(box.onPlay)box.onPlay();
}
function stopAll(){
  if(E.src){try{E.src.stop();}catch(e){}try{E.src.disconnect();}catch(e){}E.src=null;}
  if(E.node){try{E.node.disconnect();}catch(e){}E.node=null;}
  cancelAnimationFrame(E.raf);const b=E.box;E.box=null;if(b){b.setPlaying(false);b.draw(null);}
}

/* ================= PLAYER BOX ================= */
const ICON={play:'<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>',pause:'<svg viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>'};
let BOXID=0;
class Player{
  constructor(root,id,opt){
    this.opt=Object.assign({hr:true,piece:true,title:true},opt||{});this.uid=++BOXID;this.hr=72;this.root=root;
    root.innerHTML=`<div class="player"><canvas class="scope" aria-label="Phonocardiogram trace"></canvas>
      <div class="pctl"><button class="play" aria-label="Play">${ICON.play}</button>
      <div class="readout"><b></b><span></span></div>
      <label class="hr" hidden>HR <input type="range" min="50" max="120" step="2" value="72" id="hr${this.uid}"><span class="mono">72</span></label></div>
      <div class="pfoot"><div class="seg" role="group" aria-label="Chest piece"></div><div class="hint"></div></div>
      <div class="pout"><span class="tiny muted">Listening on</span><div class="seg sm" role="group" aria-label="Listening on"><button data-o="speaker">Phone speaker</button><button data-o="phones">Headphones</button></div></div></div>`;
    this.cv=root.querySelector("canvas");this.pb=root.querySelector(".play");this.rb=root.querySelector(".readout b");this.rs=root.querySelector(".readout span");
    this.hrl=root.querySelector(".hr");this.hri=this.hrl.querySelector("input");this.hrv=this.hrl.querySelector("span");
    this.segEl=root.querySelector(".seg");this.hint=root.querySelector(".hint");
    if(!this.opt.piece)root.querySelector(".pfoot").hidden=true;
    this.segEl.innerHTML=Object.keys(PIECE).map(k=>`<button data-p="${k}" aria-pressed="false">${PIECE[k].label}</button>`).join("");
    this.segEl.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;this.setPiece(b.dataset.p);});
    this.outEl=root.querySelector(".pout .seg");const syncOut=()=>this.outEl.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.o===outMode()));syncOut();
    this.outEl.addEventListener("click",e=>{const b=e.target.closest("[data-o]");if(!b)return;try{Store.s.settings.out=b.dataset.o;Store.save();}catch(x){}setOutMode(b.dataset.o);document.querySelectorAll(".pout .seg button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.o===b.dataset.o));if(typeof toast==="function")toast(b.dataset.o==="phones"?"Headphones: faithful sound":"Phone speaker: low sounds made audible");});
    this.pb.addEventListener("click",()=>{if(this.pending){this.pending=false;this.setPlaying(false);}else if(E.box===this)stopAll();else startBox(this);});
    this.hri.addEventListener("input",()=>{this.hrv.textContent=this.hri.value;});
    this.hri.addEventListener("change",()=>{this.hr=+this.hri.value;const was=E.box===this;this.load();if(was)startBox(this);});
    this.ro=new ResizeObserver(()=>{if(E.box!==this)this.draw(null);});this.ro.observe(this.cv);
    this.set(id,this.opt.piece?undefined:"open");
  }
  set(id,piece,hr){
    if(E.box===this)stopAll();
    this.pending=false;this.setPlaying(false);this.id=id;const s=item(id);if(hr)this.hr=hr;
    this.hrl.hidden=!(this.opt.hr&&s.kind==="heart");this.hri.value=this.hr;this.hrv.textContent=this.hr;
    this.piece=piece||s.piece||"open";this.updSeg();this.load();
  }
  load(){
    const id=this.id;
    if(REAL[id]){this.data=null;this.err=false;this.draw(null);
      loadReal(id).then(d=>{if(this.id!==id||this.dead)return;this.data=d;this.draw(null);if(this.pending)startBox(this);})
        .catch(()=>{if(this.id!==id)return;this.err=true;this.pending=false;this.setPlaying(false);this.draw(null);});return;}
    this.data=getData(id,this.hr);this.draw(null);}
  destroy(){try{this.ro.disconnect();}catch(e){}if(E.box===this)stopAll();this.dead=true;}
  setPiece(p){this.piece=p;this.updSeg();if(E.box===this)route();else this.draw(null);}
  updSeg(){this.segEl.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.p===this.piece));
    const s=item(this.id);if(REAL[this.id]){this.hint.textContent="Real recording: the bell and diaphragm settings filter it the same way a chest piece would.";return;}const rec=PIECE[s.piece].label;
    this.hint.textContent=this.piece===s.piece?`${rec} is the recommended chest piece for this sound.`:`Recommended: ${rec}. Compare how the trace and sound change.`;}
  setPlaying(on){this.pb.innerHTML=on?ICON.pause:ICON.play;this.pb.setAttribute("aria-label",on?"Pause":"Play");}
  draw(pos){
    const cv=this.cv,dpr=window.devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w||this.dead)return;
    if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
    const g=cv.getContext("2d");g.setTransform(dpr,0,0,dpr,0,0);
    const cs=getComputedStyle(document.documentElement),C=k=>cs.getPropertyValue(k).trim();
    if(!this.data){g.clearRect(0,0,w,h);g.fillStyle=C("--surface2");g.fillRect(0,0,w,h);g.fillStyle=C("--muted");g.font="14px "+C("--f-body");g.textAlign="center";
      g.fillText(this.err?"Couldn't load this recording. Reopen it to try again.":"Loading recording…",w/2,h/2);g.textAlign="left";
      this.rb.textContent=this.opt.title===false?"Tap play to listen":item(this.id).name;this.rs.textContent="";return;}
    const d=this.data,dur=d.dur,W=d.kind==="heart"?Math.min(2.3*d.T,dur):d.kind==="real"?Math.min(4,dur):Math.min(6.4,dur);
    const playing=pos!==null, head=.74*w;
    const start=playing?pos-.74*W:-.04*W;
    g.clearRect(0,0,w,h);g.fillStyle=C("--surface2");g.fillRect(0,0,w,h);
    const top=22,bot=h-(this.opt.labels===false?8:28),mid=(top+bot)/2,amp=(bot-top)/2*.98;
    // grid: 100 ms (heart) or 500 ms (lung)
    const step=d.kind==="heart"?.1:.5;g.strokeStyle=C("--line");g.lineWidth=1;
    const first=Math.ceil(start/step)*step;
    for(let t=first;t<=start+W;t+=step){const x=Math.round((t-start)/W*w)+.5;g.globalAlpha=Math.abs(Math.round(t/step)%(d.kind==="heart"?5:2))===0?1:.45;g.beginPath();g.moveTo(x,top);g.lineTo(x,bot);g.stroke();}
    g.globalAlpha=1;
    // phases
    const wrapX=t0=>{let s=((t0-start)%dur+dur)%dur;return s;};
    d.phases.forEach(p=>{const L=p.e-p.s;[wrapX(p.s),wrapX(p.s)-dur].forEach(s=>{const a=Math.max(0,s),b=Math.min(W,s+L);if(b<=a)return;
      const x0=a/W*w,x1=b/W*w;
      if(p.type==="sys"){g.fillStyle=C("--accent");g.globalAlpha=.08;g.fillRect(x0,top,x1-x0,bot-top);g.globalAlpha=1;}
      if(p.type==="insp"){g.fillStyle=C("--insp");g.globalAlpha=.85;g.fillRect(x0,4,x1-x0,4);g.globalAlpha=1;if(x1-x0>34){g.fillStyle=C("--insp");g.font="500 9px "+C("--f-mono");g.fillText("INSP",x0+3,18);}}
      if(p.type==="ev"&&this.opt.labels!==false){g.fillStyle=C("--accent");g.globalAlpha=.07;g.fillRect(x0,top,x1-x0,bot-top);g.globalAlpha=1;g.fillStyle=C("--accent-ink");g.fillRect(x0+1,4,Math.max(1,x1-x0-2),4);
        if(x1-x0>46){g.font="500 9px "+C("--f-mono");g.fillText(p.l.toUpperCase(),x0+3,18);}}
      if(p.type==="exp"){g.fillStyle=C("--muted");g.globalAlpha=.35;g.fillRect(x0,4,x1-x0,4);g.globalAlpha=1;if(x1-x0>34){g.fillStyle=C("--muted");g.font="500 9px "+C("--f-mono");g.fillText("EXP",x0+3,18);}}
    });});
    // waveform
    const env=envOf(d,this.piece),nb=env.length;g.fillStyle=C("--accent");g.beginPath();
    const ys=[];for(let x=0;x<w;x++){let t0=start+x/w*W,t1=start+(x+1)/w*W;let b0=Math.floor(t0*EBR),b1=Math.max(b0+1,Math.floor(t1*EBR));let m=0;
      for(let b=b0;b<b1;b++){const v=env[((b%nb)+nb)%nb];if(v>m)m=v;}ys.push(Math.min(1,m*1.15)*amp);}
    g.moveTo(0,mid);ys.forEach((y,x)=>g.lineTo(x,mid-y));for(let x=w-1;x>=0;x--)g.lineTo(x,mid+ys[x]);g.closePath();g.fill();
    g.strokeStyle=C("--accent");g.globalAlpha=.5;g.beginPath();g.moveTo(0,mid+.5);g.lineTo(w,mid+.5);g.stroke();g.globalAlpha=1;
    // markers
    g.font="500 10px "+C("--f-mono");g.fillStyle=C("--ink");let lastX=-99,row=0;
    if(this.opt.labels!==false)d.markers.forEach(m=>{const s=wrapX(m.t);if(s>W)return;const x=s/W*w;
      if(x-lastX<24)row=1-row;else row=0;lastX=x;const tw=g.measureText(m.l).width;
      g.strokeStyle=C("--muted");g.globalAlpha=.5;g.lineWidth=1;g.beginPath();g.moveTo(Math.round(x)+.5,bot);g.lineTo(Math.round(x)+.5,bot+3+row*11);g.stroke();
      g.globalAlpha=.95;g.fillText(m.l,Math.min(w-tw-2,Math.max(2,x-tw/2)),bot+12+row*11);g.globalAlpha=1;});
    // scale bar
    const sb=d.kind==="heart"?.1:1;const sbw=sb/W*w;g.strokeStyle=C("--muted");g.lineWidth=2;g.beginPath();g.moveTo(w-sbw-8,top+6);g.lineTo(w-8,top+6);g.stroke();
    g.fillStyle=C("--muted");g.font="500 9px "+C("--f-mono");const lbl=d.kind==="heart"?"100 ms":"1 s";g.fillText(lbl,w-8-g.measureText(lbl).width,top+18);
    // playhead
    if(playing){g.strokeStyle=C("--ink");g.lineWidth=1.5;g.beginPath();g.moveTo(head,top-2);g.lineTo(head,bot+2);g.stroke();}
    this.readout(playing?pos:null);
  }
  readout(pos){
    const s=item(this.id),d=this.data;
    if(this.opt.title===false){this.rb.textContent=pos===null?"Tap play to listen":"Listening…";}
    else this.rb.textContent=s.name;
    if(d.kind==="real"){const lab=this.opt.labels!==false;
      if(pos===null)this.rs.textContent=lab&&d.phases.length?"Orange bands mark annotated events":"Real recording";
      else{const e=d.phases.find(p=>pos>=p.s&&pos<p.e);this.rs.textContent=lab?(e?e.l:"Unlabelled"):"Real recording";}return;}
    if(pos===null){this.rs.textContent=d.kind==="heart"?`${this.hr} bpm · shaded band = systole`:"Blue band = inspiration · grey = expiration";return;}
    const inP=t=>d.phases.filter(p=>p.type===t).some(p=>pos>=p.s&&pos<p.e);
    if(d.kind==="heart"){const ph=inP("sys")?"Systole":"Diastole";const r=s.syn.resp?(inP("insp")?" · Inspiration":" · Expiration"):"";this.rs.textContent=ph+r;}
    else this.rs.textContent=inP("insp")?"Inspiration":"Expiration";
  }
}
