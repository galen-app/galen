/* Node-level tests of Galen's state merge and store (src/70-store.js).
   Usage: node merge-test.js [path/to/70-store.js]   (default: ../../../../../../home/claude/galen/src/70-store.js)
   Runs the file in a sandbox with a fake localStorage, so no browser is needed. Exit code 1 on any failure. */
const fs=require("fs"),vm=require("vm"),path=require("path");
const SRC=process.argv[2]||"/home/claude/galen/src/70-store.js";
let pass=0,fail=0;const fails=[];
function ok(c,msg){if(c)pass++;else{fail++;fails.push(msg);console.log("FAIL",msg);}}
function eq(a,b,msg){const A=JSON.stringify(a),B=JSON.stringify(b);ok(A===B,msg+"  got "+A+" want "+B);}
/* one sandbox = one device */
function device(name,{skew=0,ls}={}){
  const store=ls||new Map();let quota=Infinity;
  const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>{v=String(v);let tot=0;for(const [kk,vv] of store)if(kk!==k)tot+=vv.length;if(tot+v.length>quota){const e=new Error("quota");e.name="QuotaExceededError";throw e;}store.set(k,v);},removeItem:k=>store.delete(k),key:i=>[...store.keys()][i]||null,get length(){return store.size;}};
  const RealDate=Date;const off=skew;
  class FDate extends RealDate{constructor(...a){a.length?super(...a):super(RealDate.now()+off);}static now(){return RealDate.now()+off;}}
  const ctx={console,localStorage,Date:FDate,Math,JSON,Symbol,Map,Set,Number,String,Object,Array,Error,Promise,setTimeout:()=>0,clearTimeout:()=>{},
    navigator:{onLine:true},window:{addEventListener(){},dispatchEvent(){}},document:{addEventListener(){},hidden:false},toast(){},CustomEvent:function(){}};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(SRC,"utf8")+"\n;globalThis.__T={Store,mergeStates,_mergeStates,sanitizeState,blankState,repairJSON,levelOf,tick,roundMark,GClock,ST_GROUPS,dayKey,dayNum,LS};",ctx,{filename:"70-store.js"});
  const T=ctx.__T;T.ls=store;T.name=name;T.setQuota=q=>{quota=q;};T.ctx=ctx;
  T.Store.init();
  /* saves are debounced in the app (250 ms); in this sandbox timers do not run, so write at once */
  const orig=T.Store.save;T.Store.save=function(){return orig.call(this,true);};
  return T;
}
const clone=x=>JSON.parse(JSON.stringify(x));
/* "Drive": one shared copy; sync = merge both ways like Store.exchange does */
function makeDrive(){let file=null;return {get:()=>file&&clone(file),set:v=>{file=clone(v);},raw:()=>file};}
function sync(D,drive){const S=D.Store;S.commit();const r=drive.get();if(r){S._s=D._mergeStates(S._s,r);S.rebase();S.cache();}drive.set(S._s);}
const later=ms=>{const t=Date.now()+ms;while(Date.now()<t){}};   /* tiny busy wait so stamps differ */
const sched=(D,id,n)=>{const S=D.Store;S.s.srs[id]=Object.assign(S.s.srs[id]||{iv:0,ef:2.5,n:0,l:0,due:D.dayNum(),first:D.dayNum()},{n,iv:n*2,last:Date.now()});D.tick(1,"session");S.save();};

/* ---------- 1. basics, idempotence, commutativity ---------- */
{const A=device("A");sched(A,"t:jvp",1);A.Store.s.xp+=10;A.Store.save();
 const s=A.Store.s,m1=A._mergeStates(s,s);eq(Object.keys(m1.srs),["t:jvp"],"self merge keeps card");eq(m1.xp,10,"self merge keeps xp (no doubling)");
 const B=device("B");sched(B,"v:s3",2);B.Store.s.xp+=5;B.Store.save();
 const ab=A._mergeStates(A.Store.s,B.Store.s),ba=A._mergeStates(B.Store.s,A.Store.s);
 eq(Object.keys(ab.srs).sort(),Object.keys(ba.srs).sort(),"commutative srs");eq(ab.xp,ba.xp,"commutative xp");eq(ab.xp,15,"xp adds across devices (10+5)");
 const abab=A._mergeStates(ab,ab);eq(abab.xp,15,"merge of merge idempotent xp");eq(JSON.stringify(A._mergeStates(ab,ba).srs),JSON.stringify(A._mergeStates(ba,ab).srs),"srs converge");
 ok(A.mergeStates(null,s).srs["t:jvp"],"null left side");ok(A.mergeStates(s,undefined).srs["t:jvp"],"undefined right side");}

/* ---------- 2. two devices, Drive: counters add, no double counting on repeated syncs ---------- */
{const drive=makeDrive();const A=device("A"),B=device("B");
 A.Store.s.xp+=30;A.tick(10);A.Store.save();sync(A,drive);
 B.Store.s.xp+=20;B.tick(7);B.Store.save();sync(B,drive);sync(A,drive);sync(B,drive);sync(A,drive);sync(A,drive);
 eq(A.Store.s.xp,50,"xp 30+20=50 on A");eq(B.Store.s.xp,50,"xp 50 on B");eq(A.Store.s.days[A.dayKey()],17,"today 10+7=17");
 /* undo on one device lowers only its share */
 B.Store.s.xp-=5;B.Store.save();sync(B,drive);sync(A,drive);eq(A.Store.s.xp,45,"undo of 5 XP on B reaches A");
 B.Store.s.days=Object.assign({},B.Store.s.days,{[B.dayKey()]:B.Store.s.days[B.dayKey()]-1});B.Store.save();sync(B,drive);sync(A,drive);eq(A.Store.s.days[A.dayKey()],16,"undo of a day tick reaches A");}

/* ---------- 3. migration from the old format: no double counting ---------- */
{const legacy={v:3,updated:Date.now()-1000,xp:100,days:{"2026-11-01":5},srs:{"t:jvp":{iv:3,ef:2.5,n:2,l:0,due:20000,first:19990,last:Date.now()-5000}}};
 const lsA=new Map([["galen.v3",JSON.stringify(legacy)]]),lsB=new Map([["galen.v3",JSON.stringify(legacy)]]);
 const A=device("A",{ls:lsA}),B=device("B",{ls:lsB});eq(A.Store.s.xp,100,"legacy xp loaded");
 const drive=makeDrive();drive.set(legacy);
 sync(A,drive);sync(B,drive);sync(A,drive);eq(A.Store.s.xp,100,"both migrated from the same 100: still 100");
 A.Store.s.xp+=30;A.Store.save();B.Store.s.xp+=20;B.Store.save();sync(A,drive);sync(B,drive);sync(A,drive);eq(A.Store.s.xp,150,"after migration 100+30+20");
 eq(A.Store.s.days["2026-11-01"],5,"legacy day count kept, not doubled");
 /* an old build pulls 150, adds 10, writes a legacy copy without counters */
 const old=clone(drive.get());delete old.ctr;delete old.fmt;delete old.tomb;old.xp=160;old.days[A.dayKey()]=(old.days[A.dayKey()]||0)+3;const today0=A.Store.s.days[A.dayKey()]||0;drive.set(old);
 sync(A,drive);eq(A.Store.s.xp,160,"old build's +10 is kept (160), not 310");eq(A.Store.s.days[A.dayKey()],today0+3,"old build's day ticks kept");
 sync(B,drive);eq(B.Store.s.xp,160,"B agrees 160");}

/* ---------- 4. tombstones ---------- */
{const drive=makeDrive();const A=device("A"),B=device("B");
 sched(A,"t:jvp",2);A.Store.s.snd["d1:as"]={m:1,n:5,r:3};A.Store.save();sync(A,drive);sync(B,drive);ok(B.Store.s.srs["t:jvp"]&&B.Store.s.snd["d1:as"],"B got card and drill");
 later(3);delete A.Store.s.srs["t:jvp"];delete A.Store.s.snd["d1:as"];A.Store.save();sync(A,drive);sync(B,drive);sync(A,drive);
 ok(!A.Store.s.srs["t:jvp"]&&!B.Store.s.srs["t:jvp"],"deleted card stays deleted on both");ok(!A.Store.s.snd["d1:as"]&&!B.Store.s.snd["d1:as"],"reset drill stays reset");
 later(3);sched(B,"t:jvp",1);sync(B,drive);sync(A,drive);ok(A.Store.s.srs["t:jvp"],"re-learning after delete comes back (newer than tombstone)");
 /* hands undo of a first grade: delete then the other device must not resurrect it */
 sched(A,"m:x",1);A.Store.save();sync(A,drive);sync(B,drive);later(3);delete A.Store.s.srs["m:x"];A.Store.save();sync(A,drive);sync(B,drive);ok(!B.Store.s.srs["m:x"],"undone first grade removed on B");
 /* log delete */
 A.Store.s.log.push({id:"L9",t:Date.now(),sign:"s3",what:"x",conf:50});A.Store.save();sync(A,drive);sync(B,drive);later(3);
 B.Store.s.log=B.Store.s.log.filter(e=>e.id!=="L9");B.Store.save();sync(B,drive);sync(A,drive);ok(!A.Store.s.log.find(e=>e.id==="L9"),"deleted log entry does not come back");}

/* ---------- 5. reset with epoch, selective reset, undo ---------- */
{const drive=makeDrive();const A=device("A"),B=device("B");
 sched(A,"t:jvp",2);sched(A,"v:s3",2);A.Store.s.xp=100;A.Store.s.notes["egg:x"]={t:Date.now()};A.Store.s.seen.push("jvp");A.Store.save();sync(A,drive);sync(B,drive);
 later(3);const undo=A.Store.reset();eq(Object.keys(A.Store.s.srs),[],"reset clears cards");eq(A.Store.s.xp,0,"reset clears xp");ok(A.ls.has("galen.v3.beforeReset"),"backup before reset kept");
 sync(A,drive);later(3);sched(B,"m:jvp",2);sync(B,drive);sync(A,drive);
 eq(Object.keys(A.Store.s.srs),["m:jvp"],"after reset only the card learnt after it survives");ok(A.Store.s.xp<=0+0,"xp from before reset does not return: "+A.Store.s.xp);
 eq(A.Store.s.seen,[],"seen list cleared and not resurrected");ok(!A.Store.s.notes["egg:x"],"egg cleared");
 eq(Object.keys(B.Store.s.srs),["m:jvp"],"B also reset");
 later(3);undo();ok(A.Store.s.srs["t:jvp"]&&A.Store.s.srs["v:s3"],"undo brings cards back");eq(A.Store.s.xp,100,"undo brings xp back");ok(A.Store.s.srs["m:jvp"],"undo keeps work done after the reset");
 sync(A,drive);sync(B,drive);ok(B.Store.s.srs["t:jvp"],"undo reaches B");eq(B.Store.s.xp,100,"B xp 100 after undo");
 /* selective: only drills */
 A.Store.s.snd["d2:x"]={m:1,n:3,r:3};A.Store.save();sync(A,drive);sync(B,drive);later(3);A.Store.reset(["drills"]);sync(A,drive);sync(B,drive);
 ok(!B.Store.s.snd["d2:x"],"drill reset reaches B");ok(B.Store.s.srs["t:jvp"],"drill reset leaves cards");eq(B.Store.s.xp,100,"drill reset leaves xp");
 /* old reset path: Store.s = blankState() */
 later(3);A.Store.s=A.blankState();eq(Object.keys(A.Store.s.srs),[],"Store.s=blankState() starts fresh locally (account switch)");eq(A.Store.s.epochs,undefined,"and stamps no epoch");}

/* ---------- 6. technique and round records merge per field ---------- */
{const drive=makeDrive();const A=device("A"),B=device("B");
 const techSave=(D,id,p)=>{const r=Object.assign({},D.Store.s.notes["tech:"+id]||{},p,{t:Date.now()});D.Store.s.notes["tech:"+id]=r;D.Store.save();};
 techSave(A,"cranial",{mcq:5,conf:[[1000,2]]});A.roundMark("session");A.Store.save();
 techSave(B,"cranial",{walk:0.9,reps:[{t:2000,n:5,of:5}],conf:[[1500,3]]});B.roundMark("case");B.Store.save();
 sync(A,drive);sync(B,drive);sync(A,drive);
 const t=A.Store.s.notes["tech:cranial"];eq([t.mcq,t.walk,(t.conf||[]).length,(t.reps||[]).length],[5,0.9,2,1],"tech fields from both devices");
 const r=A.Store.s.notes["round:"+A.dayKey()];ok(r.session&&r.case,"round keeps session and case");
 /* best score never goes down by sync */
 techSave(B,"cranial",{walk:0.5});sync(B,drive);sync(A,drive);eq(A.Store.s.notes["tech:cranial"].walk,0.9,"walk keeps best");
 later(3);const reps=A.Store.s.notes["tech:cranial"].reps.map(x=>Object.assign({},x,{note:"edited"}));techSave(A,"cranial",{reps,mcqOk:["q1"]});techSave(B,"cranial",{mcqOk:["q2"],why:0.5});
 sync(A,drive);sync(B,drive);sync(A,drive);const t2=A.Store.s.notes["tech:cranial"];eq(t2.reps.length,1,"an edited rep is not duplicated");eq(t2.reps[0].note,"edited","the edit wins");eq(t2.mcqOk.sort(),["q1","q2"],"mcqOk union");eq(t2.why,0.5,"why kept");}

/* ---------- 7. settings ---------- */
{const drive=makeDrive();const A=device("A"),B=device("B");
 A.Store.s.settings.name="Amro";A.Store.save();later(3);B.Store.s.settings.newPerDay=20;B.Store.save();sched(B,"t:a",1);
 sync(A,drive);sync(B,drive);sync(A,drive);eq([A.Store.s.settings.name,A.Store.s.settings.newPerDay],["Amro",20],"settings per key on A");eq([B.Store.s.settings.name,B.Store.s.settings.newPerDay],["Amro",20],"settings per key on B");
 const C=device("C");sync(C,drive);eq(C.Store.s.settings.name,"Amro","a fresh device does not overwrite settings");sync(A,drive);eq(A.Store.s.settings.name,"Amro","still Amro after fresh device synced");
 /* restore never wins settings unless asked */
 const file=clone(A.Store.s);file.settings.name="Old";file.settingsTs={name:Date.now()+1e6};file.updated=9e15;
 A.Store.restore(file);eq(A.Store.s.settings.name,"Amro","restore keeps current settings");A.Store.restore(file,{settings:true});eq(A.Store.s.settings.name,"Old","restore with settings:true takes them");}

/* ---------- 8. clock skew ---------- */
{const drive=makeDrive();const A=device("A"),B=device("B",{skew:86400000});
 B.GClock.off=86400000;   /* what the server Date check finds on B */
 sched(B,"t:jvp",0);sync(B,drive);sync(A,drive);later(3);sched(A,"t:jvp",5);sync(A,drive);sync(B,drive);sync(A,drive);
 eq(A.Store.s.srs["t:jvp"].n,5,"A's later grade wins over B's fast clock");eq(B.Store.s.srs["t:jvp"].n,5,"and on B");
 /* without the server check: an incoming far-future time is clamped on arrival */
 const C=device("C");const bad={v:3,srs:{"t:q":{iv:1,ef:2.5,n:1,l:0,due:1,first:1,last:9e15,_m:9e15}},updated:9e15};
 const m=C._mergeStates(C.Store.s,bad);ok(m.srs["t:q"]._m===1,"future _m loses (1)");ok(m.updated<=Date.now()+11*60*1000,"future updated clamped");ok(m.srs["t:q"].last<=Date.now()+11*60*1000,"future last clamped to now");
 C.Store.s=m;later(3);C.Store.s.srs["t:q"].n=9;C.Store.save();const m2=C._mergeStates(C.Store.s,bad);eq(m2.srs["t:q"].n,9,"a later local edit beats a clamped future record");}

/* ---------- 9. unknown keys, newer versions ---------- */
{const A=device("A");const remote=clone(A.Store.s);remote.newFeature={keep:true};remote.srs["t:z"]={iv:1,ef:2.5,n:1,l:0,due:1,first:1,last:1,future:"x"};
 const m=A._mergeStates(A.Store.s,remote);ok(m.newFeature&&m.newFeature.keep,"unknown top-level key kept");eq(m.srs["t:z"].future,"x","unknown record field kept");
 m.settings.brandNew=7;const m2=A._mergeStates(m,A.Store.s);eq(m2.settings.brandNew,7,"unknown setting kept");
 /* newer local data is copied aside, read only */
 const ls=new Map([["galen.v3",JSON.stringify({v:4,xp:500,srs:{"t:a":{iv:1}}})]]);const N=device("N",{ls});
 ok(N.Store.readOnly,"newer local data: read only");ok([...ls.keys()].some(k=>k.startsWith("galen.v3.unreadable.")),"newer local copy kept aside");
 N.Store.s.xp=1;N.Store.save();eq(JSON.parse(ls.get("galen.v3")).v,4,"newer local copy never overwritten");
 const ls2=new Map([["galen.v3",JSON.stringify({v:3,fmt:99,xp:5})]]);ok(device("N2",{ls:ls2}).Store.readOnly,"newer fmt read only");}

/* ---------- 10. corrupt local data ---------- */
{const ls=new Map([["galen.v3",'{"v":3,"xp":40,"srs":{"t:jvp":{"iv":5,"ef":2.5,"n":2,"l":0,"due":1,"first":1},"t:bad":{"iv":']]);const A=device("A",{ls});
 ok(A.Store.problem&&A.Store.problem.kind==="unreadable","truncated data flagged");ok(A.Store.problem.repaired,"truncated data repaired");ok(A.Store.s.srs["t:jvp"],"repair kept the complete card");eq(A.Store.s.xp,40,"repair kept xp");
 const aside=[...ls.keys()].find(k=>k.startsWith("galen.v3.unreadable."));ok(aside&&ls.get(aside).endsWith('"iv":'),"original bytes kept aside");
 const ls2=new Map([["galen.v3","garbage{{"]]);const B=device("B",{ls:ls2});ok(B.Store.problem&&!B.Store.problem.repaired,"garbage flagged, not repaired");sched(B,"t:a",1);ok([...ls2.values()].includes("garbage{{"),"garbage kept aside after a save");
 eq(A.repairJSON('{"a":1,"b":[1,2,{"c":3}],"d":"x'),{a:1,b:[1,2,{c:3}]},"repairJSON closes brackets");eq(A.repairJSON('{"v":3,"srs":{"t:jvp":{"iv":5}}} TRUNCATED'),{v:3,srs:{"t:jvp":{iv:5}}},"repairJSON trailing junk");}

/* ---------- 11. hostile and malformed input ---------- */
{const A=device("A");const bad={v:3,__proto__:{polluted:1},log:[null,{t:1},{id:"q",t:2,conf:"<img src=x onerror=1>"}],srs:{"t:jvp":null,"\"><img>":{iv:1}},photos:{"\"><img src=x onerror=window.__x=4>":{t:1,subject:"s:jvp"}},
   xp:-50,settings:{newPerDay:"abc",maxReviews:0,name:{x:1}},days:{"9999-01-01":5,"2026-11-01":-3,"x":2},signs:{x:1},seen:[1,"jvp",null]};
 const raw=JSON.stringify(bad).replace('"v":3','"v":3,"__proto__":{"polluted":1}');
 const s=A.sanitizeState(JSON.parse(raw));ok(!s.polluted&&!({}).polluted,"no prototype pollution");
 eq(s.log.length,2,"null log entries dropped");ok(typeof s.log.find(e=>e.id==="q").conf==="number","conf coerced to a number");
 ok(!s.srs["t:jvp"]&&!s.srs["\"><img>"],"null and bad-id cards dropped");eq(Object.keys(s.photos),[],"bad photo id dropped");
 eq(s.xp,0,"negative xp clamped");eq(s.settings.newPerDay,10,"newPerDay abc -> default");eq(s.settings.maxReviews,5,"maxReviews clamped");eq(s.settings.name,"","object name dropped");
 eq(Object.keys(s.days),[],"future, negative and bad day keys dropped");eq(s.signs,[],"signs object -> []");eq(s.seen,["jvp"],"seen strings only");
 eq(A.levelOf(-50).title,"Student","levelOf negative");ok(!/NaN|undefined/.test(JSON.stringify(A.levelOf(NaN))),"levelOf NaN safe");
 const m=A._mergeStates({v:3,log:[null]},{v:3,srs:{"x:y":null}});ok(Array.isArray(m.log),"merge of junk does not throw");
 /* old migration with non-arrays */
 const ls=new Map([["bed.signseen",'{"x":1}'],["bed.moddone",'"str"'],["bed.seen",'["jvp"]']]);const M=device("M",{ls});eq(M.Store.s.signs,[],"migrateV1 non-array");eq(M.Store.s.seen,["jvp"],"migrateV1 array kept");}

/* ---------- 12. two tabs on one device (read-merge-write fallback) ---------- */
{const ls=new Map();const A=device("A",{ls});const B=device("B",{ls});   /* same browser storage */
 sched(A,"t:jvp",2);A.Store.s.xp+=30;A.Store.save();sched(B,"v:s3",3);B.Store.save();
 const disk=JSON.parse(ls.get("galen.v3"));ok(disk.srs["t:jvp"]&&disk.srs["v:s3"],"two tabs: both cards on disk");eq(disk.xp,30,"two tabs: A's xp kept");}

/* ---------- 13. quota ---------- */
{const A=device("A");A.setQuota(50);A.Store.s.xp=999;A.Store.save(true);eq(A.Store.saveProblem,"full","quota full is reported");ok(/storage full/.test(A.Store.status),"status says storage full");
 A.setQuota(Infinity);A.Store.save();eq(A.Store.saveProblem,null,"cleared once saving works again");}

/* ---------- 14. log merge field by field ---------- */
{const drive=makeDrive();const A=device("A"),B=device("B");
 A.Store.s.log.push({id:"L1",t:Date.now(),sign:"s3",what:"S3",conf:80,ver:null});A.Store.save();sync(A,drive);sync(B,drive);later(3);
 const a=A.Store.s.log.find(x=>x.id==="L1");a.ver="yes";a.verAt=Date.now();A.Store.save();later(3);
 const b=B.Store.s.log.find(x=>x.id==="L1");b.what="S3 edited";B.Store.save();sync(A,drive);sync(B,drive);sync(A,drive);
 const r=A.Store.s.log.find(x=>x.id==="L1");eq([r.ver,r.what],["yes","S3 edited"],"log: verified on A and edited on B both kept");
 later(3);const u=A.Store.s.log.find(x=>x.id==="L1");u.ver=null;A.Store.save();sync(A,drive);sync(B,drive);sync(A,drive);eq(B.Store.s.log.find(x=>x.id==="L1").ver,null,"log undo of verify sticks");}

/* ---------- 15. restore preview and replace ---------- */
{const A=device("A");sched(A,"t:jvp",2);A.Store.s.xp=40;A.Store.save();const file=clone(A.Store.s);
 const p=A.Store.preview(file);eq([p.cards,p.xp],[1,40],"preview counts");
 const B=device("B");sched(B,"v:s3",1);const undo=B.Store.restore(file,{mode:"replace"});ok(B.Store.s.srs["t:jvp"]&&!B.Store.s.srs["v:s3"],"replace swaps progress");eq(B.Store.s.xp,40,"replace takes xp");
 undo();ok(B.Store.s.srs["v:s3"],"undo of replace brings back the old card");
 let threw=false;try{B.Store.restore({hello:1});}catch(e){threw=/not a Galen backup/.test(e.message);}ok(threw,"plain-words error for a non-backup");
 threw=false;try{B.Store.restore({v:5});}catch(e){threw=/newer Galen/.test(e.message);}ok(threw,"newer backup refused");}

/* ---------- 15b. restoring a backup made before a reset brings it back ---------- */
{const A=device("A");sched(A,"t:jvp",2);A.Store.s.xp=40;A.Store.s.seen.push("jvp");A.Store.save();const file=clone(A.Store.s);later(3);A.Store.reset();later(3);sched(A,"v:new",1);A.Store.s.xp+=3;A.Store.save();
 A.Store.restore(file);ok(A.Store.s.srs["t:jvp"]&&A.Store.s.srs["v:new"],"restore after reset: old and new cards");eq(A.Store.s.xp,43,"restore after reset: xp 40+3");eq(A.Store.s.seen,["jvp"],"restore after reset: seen list");
 const drive=makeDrive();sync(A,drive);const B=device("B");sync(B,drive);ok(B.Store.s.srs["t:jvp"],"restored card reaches another device");eq(B.Store.s.xp,43,"restored xp reaches another device");
 eq(Object.keys(A.sanitizeState({v:3,srs:{"dm:S4\u20135":{iv:1}}}).srs),["dm:S4\u20135"],"ids with an en dash kept");}
/* ---------- 15c. restore brings back cards deleted after the backup; a plain merge keeps the deletion ---------- */
{const A=device("A");sched(A,"t:jvp",2);sched(A,"v:s3",2);const snap=clone(A.Store.s);later(3);A.Store.s.srs={};A.Store.save();
 eq(Object.keys(A._mergeStates(A.Store.s,snap).srs),[],"sync merge keeps the deletion (tombstones)");
 A.Store.restore(snap);eq(Object.keys(A.Store.s.srs).sort(),["t:jvp","v:s3"],"restore brings deleted cards back");
 const drive=makeDrive();const B=device("B");sync(A,drive);sync(B,drive);eq(Object.keys(B.Store.s.srs).sort(),["t:jvp","v:s3"],"and they reach another device");}
/* ---------- 15d. a backup written without a commit keeps its totals ---------- */
{const A=device("A");A.Store.s.xp+=10;A.Store.save();A.Store.s.xp+=7;A.tick(2);const raw=JSON.parse(JSON.stringify(A.Store._s));   /* not committed */
 const B=device("B");const m=B._mergeStates(B.Store.s,raw);eq(m.xp,17,"uncommitted xp in a copy is kept");eq(m.days[B.dayKey()],2,"uncommitted day ticks kept");
 const m2=B._mergeStates(m,raw);eq(m2.xp,17,"and not counted twice");}
/* ---------- 16. levels ---------- */
{const A=device("A");eq(A.levelOf(0).title,"Student","level 0");eq(A.levelOf(100).l,1,"100 XP = level 1");eq(A.levelOf(4900).title,"Galen","4900 = Galen");eq(A.levelOf(6400).title,"Galen","6400 stays Galen (title capped)");ok(A.levelOf(150).pct>0&&A.levelOf(150).pct<1,"pct in range");}

/* ---------- 17. random convergence: many devices, random ops, any sync order ---------- */
{let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const drive=makeDrive();const Ds=[device("R1"),device("R2"),device("R3")];let xpSum=0;
 for(let i=0;i<300;i++){const D=Ds[Math.floor(rnd()*3)];const op=rnd();
   if(op<.4){sched(D,"c"+Math.floor(rnd()*20),Math.floor(rnd()*5));}
   else if(op<.6){const n=1+Math.floor(rnd()*5);D.Store.s.xp+=n;xpSum+=n;D.Store.save();}
   else if(op<.7){const ks=Object.keys(D.Store.s.srs);if(ks.length){delete D.Store.s.srs[ks[Math.floor(rnd()*ks.length)]];D.Store.save();}}
   else sync(D,drive);}
 for(let k=0;k<2;k++)for(const D of Ds)sync(D,drive);
 const s0=JSON.stringify(Ds[0].Store.s.srs);ok(Ds.every(D=>JSON.stringify(D.Store.s.srs)===s0),"random ops: all devices converge on cards");
 ok(Ds.every(D=>D.Store.s.xp===xpSum),"random ops: xp is the exact sum "+xpSum+" got "+Ds.map(D=>D.Store.s.xp));}

console.log(`\n${pass} passed, ${fail} failed`);if(fail){console.log(fails.join("\n"));process.exit(1);}
