/* Card-quality audit (D09). Renders every spaced-repetition card through cardBody several times and checks:
   render errors and junk text, length bias (key is the longest option), answer leaks (stem shares the key's words), duplicates,
   snsp keys against the likelihood ratios, thin recall answers, em dashes, card fields, chapter coverage, duel targets and id stability.
   Usage: node test/cards.js [port] [--legacy path/to/legacy-ids.json] [--json out.json]
   Needs the built app served on the port (default 8765). Exit code 1 on hard failures. */
const {chromium}=require("playwright");const fs=require("fs");
const args=process.argv.slice(2);const port=+(args.find(a=>/^\d+$/.test(a))||8765);
const opt=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null;};
(async()=>{
  const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await p.goto(`http://localhost:${port}/`);await p.waitForFunction(()=>typeof buildCards==="function"&&typeof cardBody==="function");await p.waitForTimeout(800);
  const legacy=opt("--legacy")?JSON.parse(fs.readFileSync(opt("--legacy"),"utf8")):null;
  const R=await p.evaluate(({legacy})=>{
    buildCards();
    const strip=h=>{const d=document.createElement("div");d.innerHTML=h||"";d.querySelectorAll("svg,figure,.dplate").forEach(x=>x.remove());return d.textContent.replace(/\s+/g," ").trim();};
    const STOP=new Set("sign signs test tests manoeuvre rule rules score scores positive negative with from that this into over under than their when both only about which finding response reflex index check examination patient lesion acute severe the and for what does your".split(" "));
    const words=s=>[...new Set((String(s).replace(/['’]s\b/gi,"").toLowerCase().match(/[a-zà-ÿ0-9]{5,}/g)||[]).filter(w=>!STOP.has(w)&&!/^\d+$/.test(w)))];
    const out={n:CARDS.length,types:{},hard:[],warn:[],stats:{}};const H=(k,m)=>out.hard.push(k+": "+m),W=(k,m)=>out.warn.push(k+": "+m);
    const T={};const renders={};
    CARDS.forEach(c=>{out.types[c.type]=(out.types[c.type]||0)+1;
      for(const f of ["id","type","sys","ref","label","sib"])if(c[f]==null||c[f]==="")H("field",`${c.id} missing ${f}`);
      if(typeof SYS_SHORT!=="undefined"&&!SYS_SHORT[c.sys])H("field",`${c.id} unknown sys ${c.sys}`);
      if(typeof CARD_TYPE_LABEL!=="undefined"&&!CARD_TYPE_LABEL[c.type])H("label",`${c.id} type ${c.type} has no CARD_TYPE_LABEL`);
      const auto=!!AUTO[c.type],n=auto?6:1;const tt=T[c.type]=T[c.type]||{n:0,longest:0,leak:0,short:0};
      for(let r=0;r<n;r++){let body;try{body=cardBody(c);}catch(e){H("render",`${c.id} throws ${e.message}`);return;}
        const q=strip(body.q),a=strip(body.a),ex=strip(body.explain),all=q+" "+a+" "+ex+" "+(body.opts||[]).map(o=>o.l).join(" ");
        if(!q)H("render",`${c.id} empty prompt`);
        if(r===0&&/\bundefined\b|\bNaN\b|\[object|(^|[^a] )null\b/.test(all))H("junk",`${c.id} shows undefined/NaN/null: ${all.slice(0,120)}`);
        if(r===0&&/\u2014/.test(all)){const i=all.indexOf("\u2014");H("emdash",`${c.id}: ...${all.slice(Math.max(0,i-60),i+20)}`);}
        if(r===0)renders[c.id]={q,a,type:c.type};
        if(auto){const os=body.opts||[];const k=os.findIndex(o=>o.ok);
          if(os.length<2||k<0){H("opts",`${c.id} has ${os.length} options, key ${k}`);return;}
          if(os.filter(o=>o.ok).length>1)H("opts",`${c.id} has more than one key`);
          const labs=os.map(o=>String(o.l));if(new Set(labs).size!==labs.length)H("opts",`${c.id} duplicate options ${labs.join(" | ")}`);
          tt.n++;const L=labs.map(x=>x.length);if(L[k]===Math.max(...L)&&L.filter(x=>x===L[k]).length===1)tt.longest++;
          /* leak: a distinctive word of the key in the stem, absent from every distractor */
          if(!["verdict","hlr","snsp","sound","dplate","myo","reflex"].includes(c.type)){const kw=words(labs[k]),dw=new Set(labs.filter((x,i)=>i!==k).flatMap(words));
            const hit=kw.filter(w=>!dw.has(w)&&q.toLowerCase().includes(w.slice(0,Math.max(5,w.length-2))));
            if(hit.length){tt.leak++;if(r===0)W("leak",`${c.id} stem names the key (${hit.join(",")}): ${q.slice(0,110)}`);}}
        }else{if(a.replace(/Open the \w+|Read the story/g,"").trim().length<40){tt.short++;W("thin",`${c.id} answer under 40 characters: ${a}`);}}
      }
      /* snsp keys must agree with the LRs */
      if(c.type==="snsp"){const s=SIGNS[c.ref],b=cardBody(c),k=b.opts.find(o=>o.ok).l;let P=s.p,N=s.n,inf=false;if(P==null){if(s.spec<100)P=s.sens/(100-s.spec);else inf=s.sens>0;}if(N==null&&s.spec>0)N=(100-s.sens)/s.spec;
        const I=inf||P>=5,O=N!=null&&N<=0.2,exp=I&&O?"Both":I?"positive":O?"negative":"Neither";if(!k.includes(exp))H("snsp",`${c.id} key "${k}" but LR+ ${P}, LR− ${N}`);}
    });
    Object.entries(T).forEach(([t,x])=>{if(x.n){const lb=x.longest/x.n,lk=x.leak/x.n;out.stats[t]={renders:x.n,keyLongest:+lb.toFixed(2),leakRate:+lk.toFixed(3)};
        if(lb>0.4&&!["verdict","hlr","snsp"].includes(t))W("length-bias",`${t}: key is the longest option in ${Math.round(lb*100)}% of renders`);
        if(lk>0.02)W("leak-rate",`${t}: ${Math.round(lk*100)}% of renders leak the key`);}
      else out.stats[t]={thin:x.short};});
    /* duplicates: identical prompts within a type (generic stems excluded), and near-identical prompt+answer across the deck */
    const GEN=/^(Name this sound|Name the rash|How much is this test worth)/;const byQ={};
    Object.entries(renders).forEach(([id,r])=>{if(GEN.test(r.q))return;const k=r.q.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();(byQ[k]=byQ[k]||[]).push(id);});
    Object.values(byQ).forEach(ids=>{if(ids.length>1)H("duplicate",`same prompt: ${ids.join(", ")}`);});
    const tok=s=>new Set(s.toLowerCase().match(/[a-z0-9]{4,}/g)||[]);const rec=Object.entries(renders).filter(([,r])=>!AUTO[r.type]).map(([id,r])=>[id,tok(r.q),tok(r.a)]);
    for(let i=0;i<rec.length;i++)for(let j=i+1;j<rec.length;j++){const [ia,qa,aa]=rec[i],[ib,qb,ab]=rec[j];if(ia.split(":")[0]===ib.split(":")[0]&&ia.split(":").slice(0,2).join()===ib.split(":").slice(0,2).join()&&ia.startsWith("tw"))continue;
      const jac=(A,B)=>{let n=0;A.forEach(w=>{if(B.has(w))n++;});return n/Math.max(1,A.size+B.size-n);};if(jac(qa,qb)>0.6&&jac(aa,ab)>0.5)W("near-duplicate",`${ia} ~ ${ib}`);}
    /* ids unique, and every 7.0.1 id still present (or aliased) */
    const ids=CARDS.map(c=>c.id);if(new Set(ids).size!==ids.length)H("ids","duplicate card ids");
    if(legacy){const have=new Set(ids),al=typeof CARD_ALIAS!=="undefined"?CARD_ALIAS:{};const lost=legacy.filter(id=>!have.has(id)&&!have.has(al[id]));out.stats.legacyIds=legacy.length;out.stats.legacyLost=lost.length;
      lost.forEach(id=>H("ids",`7.0.1 id ${id} no longer exists (users lose progress)`));}
    /* chapter coverage: types that never reach a chapter */
    if(typeof chapCardIds==="function"&&typeof OUTLINE!=="undefined"){const inChap=new Set();Object.entries(OUTLINE).forEach(([h,cs])=>cs.forEach((c,i)=>chapCardIds(h,i).forEach(id=>inChap.add(id))));
      const miss={};CARDS.forEach(c=>{if(!inChap.has(c.id))miss[c.type]=(miss[c.type]||0)+1;});out.stats.notInAnyChapter=miss;
      Object.entries(miss).forEach(([t,n])=>{if(n===out.types[t])W("chapters",`type ${t}: none of its ${n} cards reaches a chapter`);});
      Object.entries(OUTLINE).forEach(([h,cs])=>cs.forEach((c,i)=>{if(!chapCardIds(h,i).size)W("chapters",`${h}:${i} "${c.t}" has no cards`);}));}
    /* duels compare signs with the same target */
    const pairs=typeof duelPairs==="function"?duelPairs():[];pairs.forEach(([a,b])=>{const tk=x=>SIGNS[x].dx||String(SIGNS[x].target).trim().toLowerCase();if(tk(a)!==tk(b))H("duel",`${a} vs ${b} have different targets`);});
    if(typeof DUELS!=="undefined")DUELS.forEach(([a,b])=>{if(SIGNS[a]&&SIGNS[b]&&SIGNS[a].target!==SIGNS[b].target)W("duel",`DUELS ${a} vs ${b}: "${SIGNS[a].target}" vs "${SIGNS[b].target}"`);});
    out.stats.duelPairs=pairs.length;
    return out;},{legacy});
  R.pageErrors=errs;if(errs.length)R.hard.push(...errs.map(e=>"pageerror: "+e));
  if(opt("--json"))fs.writeFileSync(opt("--json"),JSON.stringify(R,null,1));
  console.log(`${R.n} cards, ${Object.keys(R.types).length} types`);console.log(JSON.stringify(R.types));
  console.log("per type:",JSON.stringify(R.stats));
  const grp=a=>{const g={};a.forEach(x=>{const k=x.split(":")[0];(g[k]=g[k]||[]).push(x);});return g;};
  for(const [k,v] of Object.entries(grp(R.warn)))console.log(`WARN ${k} (${v.length})\n  `+v.slice(0,12).join("\n  "));
  for(const [k,v] of Object.entries(grp(R.hard)))console.log(`FAIL ${k} (${v.length})\n  `+v.slice(0,20).join("\n  "));
  console.log(R.hard.length?`${R.hard.length} hard failure(s)`:"no hard failures");
  await b.close();process.exit(R.hard.length?1:0);
})();
