"use strict";
/* ================= LIVE IMAGE LIBRARY (Wikimedia Commons) =================
 Galen does not ship photographs. It asks Wikimedia Commons for openly licensed photos of each condition or sign,
 keeps only CC0 / public-domain / CC BY / CC BY-SA files, shows the author and licence under each image, and lets you
 pin the best ones (pins sync with your progress) or hide poor ones. Results are cached for 30 days; the service worker keeps the thumbnails. */
const Img=(()=>{
  const API="https://commons.wikimedia.org/w/api.php";
  const CACHE_KEY="galen.imgcache",TTL=30*864e5,MAX=140;
  let cache={};try{cache=JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");}catch(e){}
  const okLicense=l=>/^(cc0|public domain|pd\b|pd-|cc[ -]by(-sa)?(\s*\d(\.\d)?)?$)/i.test((l||"").trim())||/^cc by(-sa)? \d/i.test(l||"");
  const strip=h=>String(h||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
  const bad=/histolog|micrograph|microscop|x-ray|radiograph|ct scan|mri|diagram|drawing|illustration|logo|icon|map\b|chart|graph|screenshot|dog|cat\b|horse|cattle|plant|leaf|tree/i;
  function saveCache(){const ks=Object.keys(cache);if(ks.length>MAX){ks.sort((a,b)=>cache[a].t-cache[b].t).slice(0,ks.length-MAX).forEach(k=>delete cache[k]);}try{localStorage.setItem(CACHE_KEY,JSON.stringify(cache));}catch(e){}}
  const canUse=()=>window.GALEN_PLATFORM!=="artifact";
  async function search(term,opt={}){
    const k=term.toLowerCase();const c=cache[k];if(c&&Date.now()-c.t<TTL&&!opt.fresh)return c.items;
    if(!canUse())throw Object.assign(new Error("Live photos work in the installed Galen app"),{preview:true});
    const p=new URLSearchParams({action:"query",format:"json",origin:"*",generator:"search",gsrsearch:`${term} filetype:bitmap -histopathology -histology -micrograph`,gsrnamespace:"6",gsrlimit:"40",prop:"imageinfo",iiprop:"url|extmetadata|size|mime",iiurlwidth:"720",iiextmetadatafilter:"LicenseShortName|Artist|Credit|ImageDescription|LicenseUrl"});
    const r=await fetch(`${API}?${p}`);if(!r.ok)throw new Error("Commons "+r.status);
    const j=await r.json();const pages=Object.values((j.query&&j.query.pages)||{});
    const items=pages.map(pg=>{const ii=(pg.imageinfo||[])[0];if(!ii)return null;const m=ii.extmetadata||{};const lic=strip(m.LicenseShortName&&m.LicenseShortName.value);
      if(!/^image\/(jpeg|png|webp)/.test(ii.mime||"")||!okLicense(lic))return null;
      const title=pg.title.replace(/^File:/,"");if(bad.test(title))return null;
      const desc=strip(m.ImageDescription&&m.ImageDescription.value).slice(0,220);
      return {file:pg.title,title:title.replace(/\.[a-z]+$/i,"").replace(/_/g," "),thumb:ii.thumburl||ii.url,url:ii.url,w:ii.width,h:ii.height,size:ii.size,lic,licUrl:strip(m.LicenseUrl&&m.LicenseUrl.value),author:strip(m.Artist&&m.Artist.value).slice(0,80)||"Unknown author",desc,page:`https://commons.wikimedia.org/wiki/${encodeURIComponent(pg.title)}`};}).filter(Boolean);
    cache[k]={t:Date.now(),items};saveCache();return items;
  }
  async function forSubject(terms,opt={}){
    const seen=new Set(),out=[];let err=null;
    for(const t of terms){try{for(const it of await search(t,opt)){if(seen.has(it.file))continue;seen.add(it.file);out.push(it);}}catch(e){err=e;if(e.preview)break;}}
    if(!out.length&&err)throw err;
    const score=it=>{let s=0;const txt=(it.title+" "+it.desc).toLowerCase();terms.forEach((t,i)=>{if(txt.includes(t.toLowerCase().split(" ")[0]))s+=3-Math.min(i,2);});if(/skin|patient|clinical/i.test(txt))s+=.5;if(it.w>it.h)s+=.2;return s;};
    return out.sort((a,b)=>score(b)-score(a));
  }
  const pinKey=(subject,file)=>subject+"|"+file;
  const pinsOf=subject=>Object.entries(Store.s.pins).filter(([k,v])=>k.startsWith(subject+"|")&&!v.deleted).map(([k,v])=>v).sort((a,b)=>a.t-b.t);
  const isHidden=(subject,file)=>!!(Store.s.hides[pinKey(subject,file)]&&!Store.s.hides[pinKey(subject,file)].deleted);
  function pin(subject,it){Store.s.pins[pinKey(subject,it.file)]=Object.assign({t:Date.now(),subject},it);Store.save();}
  function unpin(subject,file){const k=pinKey(subject,file);if(Store.s.pins[k])Store.s.pins[k]={t:Date.now(),deleted:true,subject,file};Store.save();}
  function hide(subject,file){Store.s.hides[pinKey(subject,file)]={t:Date.now()};Store.save();}
  function unhide(subject,file){const k=pinKey(subject,file);if(Store.s.hides[k])Store.s.hides[k]={t:Date.now(),deleted:true};Store.save();}
  /* ---- UI ---- */
  function galleryHTML(subject,terms,opt={}){
    const pins=pinsOf(subject);
    return `<div class="gal" data-subject="${esc(subject)}" data-terms="${esc(JSON.stringify(terms))}" data-title="${esc(opt.title||terms[0])}">
      <div class="gal-head"><span class="eyebrow">${ic("eye")} Photographs</span><span class="small muted">${pins.length?`${pins.length} pinned`:"from Wikimedia Commons, open licences"}</span></div>
      <div class="gal-grid">${pins.map(p=>thumbHTML(p,true)).join("")}</div>
      <div class="gal-foot"><button class="btn sm soft gal-more">${pins.length?"More photos":"Load photos"}</button>${canUse()&&G.wasSignedIn()?`<label class="btn sm ghost">Add my photo<input type="file" accept="image/*" class="gal-up" hidden></label>`:""}${opt.links?opt.links.map(([t,u])=>`<a class="btn sm ghost" href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join(""):""}</div>
      <p class="tiny muted gal-note" hidden></p></div>`;
  }
  const thumbHTML=(it,pinned)=>`<figure class="gal-t${pinned?" pinned":""}" data-file="${esc(it.file)}"><img loading="lazy" src="${esc(it.thumb)}" alt="${esc(it.title)}"><figcaption>${esc(it.lic)}${pinned?" · pinned":""}</figcaption></figure>`;
  function bindGalleries(root){
    $$(".gal",root).forEach(g=>{if(g.dataset.bound)return;g.dataset.bound=1;
      const subject=g.dataset.subject,terms=JSON.parse(g.dataset.terms),grid=$(".gal-grid",g),note=$(".gal-note",g),more=$(".gal-more",g);
      let items=[],loaded=false;
      const draw=()=>{const pins=pinsOf(subject),pf=new Set(pins.map(p=>p.file));
        grid.innerHTML=pins.map(p=>thumbHTML(p,true)).join("")+items.filter(it=>!pf.has(it.file)&&!isHidden(subject,it.file)).slice(0,g.dataset.n||18).map(it=>thumbHTML(it,false)).join("");
        $$(".gal-t",grid).forEach(f=>f.addEventListener("click",()=>{const it=pins.find(p=>p.file===f.dataset.file)||items.find(p=>p.file===f.dataset.file);if(it)lightbox(subject,it,g);}));};
      const load=async()=>{more.disabled=true;more.textContent="Loading…";note.hidden=true;
        try{items=await forSubject(terms);loaded=true;g.dataset.n=18;draw();more.textContent=items.length>18?"Show more":"Search Commons ↗";if(!items.length){note.hidden=false;note.textContent="Nothing suitable found on Commons for this one yet. Try the atlas links.";}}
        catch(e){note.hidden=false;note.textContent=e.preview?"Live photos (with your pins) work in the installed Galen app; here you have the drawn plates and the atlas links.":"Couldn't reach Wikimedia Commons: "+e.message;more.textContent="Retry";}
        more.disabled=false;};
      more.addEventListener("click",()=>{if(!loaded)return load();if(items.length>(+g.dataset.n||18)){g.dataset.n=(+g.dataset.n||18)+18;draw();}else window.open(`https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(terms[0])}&title=Special:MediaSearch&type=image`,"_blank","noopener");});
      const up=$(".gal-up",g);if(up)up.addEventListener("change",async()=>{const f=up.files[0];if(!f)return;more.textContent="Uploading…";try{await Hub.uploadPhoto(f,{subject});toast("Photo saved to your Drive","good");drawOwn();}catch(e){toast("Upload failed: "+e.message,"bad");}more.textContent=loaded?"Show more":"Load photos";});
      const drawOwn=()=>{const own=Object.entries(Store.s.photos).filter(([id,p])=>p.subject===subject&&!p.deleted);if(!own.length)return;let box=$(".gal-own",g);if(!box){box=document.createElement("div");box.className="gal-grid gal-own";grid.after(box);}
        box.innerHTML=own.map(([id,p])=>`<figure class="gal-t own" data-id="${id}"><div class="ph-sk"></div><figcaption>my photo</figcaption></figure>`).join("");
        own.forEach(async([id,p])=>{const f=$(`[data-id="${id}"]`,box);try{const u=await Hub.photoUrl(id);f.innerHTML=`<img src="${u}" alt="${esc(p.caption||p.name)}"><figcaption>my photo</figcaption>`;f.addEventListener("click",()=>lightbox(subject,{file:id,title:p.caption||"My photo",thumb:u,url:u,lic:"Private (your Drive)",author:"You",desc:p.caption||"",own:true},g));}catch(e){f.innerHTML=`<div class="ph-sk"></div><figcaption>offline</figcaption>`;}});};
      draw();drawOwn();
      if(pinsOf(subject).length===0&&canUse()&&"IntersectionObserver" in window&&navigator.onLine!==false){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();load();}},{rootMargin:"200px"});io.observe(g);}
    });
  }
  function lightbox(subject,it,g){
    const pinned=!!Store.s.pins[pinKey(subject,it.file)]&&!Store.s.pins[pinKey(subject,it.file)].deleted;
    const big=it.size&&it.size<2.5e6?it.url:(it.thumb||it.url).replace(/\/\d+px-/,"/1280px-");
    const d=document.createElement("div");d.className="lb";d.innerHTML=`<div class="lb-in"><button class="iconbtn lb-x" aria-label="Close">${ic("close")}</button><img src="${esc(big)}" alt="${esc(it.title)}"><div class="lb-meta"><b>${esc(it.title)}</b>${it.desc?`<p class="small">${esc(it.desc)}</p>`:""}<p class="tiny muted">${esc(it.author)} · ${esc(it.lic)}${it.page?` · <a href="${esc(it.page)}" target="_blank" rel="noopener">source</a>`:""}</p>
      <div class="row-x">${it.own?`<button class="btn sm ghost" data-a="del">Delete</button>`:`<button class="btn sm ${pinned?"ghost":""}" data-a="pin">${pinned?"Unpin":"Pin to this page"}</button><button class="btn sm ghost" data-a="hide">Hide</button>`}</div></div></div>`;
    document.body.append(d);document.body.style.overflow="hidden";
    const close=()=>{d.remove();document.body.style.overflow="";};
    d.addEventListener("click",e=>{if(e.target===d||e.target.closest(".lb-x"))close();});
    const esc1=e=>{if(e.key==="Escape"){close();document.removeEventListener("keydown",esc1);}};document.addEventListener("keydown",esc1);
    const re=()=>{close();if(g){delete g.dataset.bound;const html=g.outerHTML;}};
    $$("[data-a]",d).forEach(b=>b.addEventListener("click",async()=>{const a=b.dataset.a;
      if(a==="pin"){pinned?unpin(subject,it.file):pin(subject,it);toast(pinned?"Unpinned":"Pinned","good");}
      else if(a==="hide"){hide(subject,it.file);toast("Hidden from this page");}
      else if(a==="del"){await Hub.deletePhoto(it.file);toast("Deleted");}
      close();if(g){const parent=g.parentNode,subjectT=g.dataset.subject,terms=JSON.parse(g.dataset.terms),title=g.dataset.title;const nu=document.createElement("div");nu.innerHTML=galleryHTML(subjectT,terms,{title});parent.replaceChild(nu.firstElementChild,g);bindGalleries(parent);}
    }));
  }
  /* pool for the spot-diagnosis game: pinned photos first, then cached search results */
  function pool(subject,terms){const pins=pinsOf(subject);if(pins.length)return pins;const out=[];for(const t of terms){const c=cache[t.toLowerCase()];if(c)out.push(...c.items.filter(it=>!isHidden(subject,it.file)));}return out;}
  return {search,forSubject,galleryHTML,bindGalleries,pin,unpin,hide,pinsOf,pool,canUse};
})();
