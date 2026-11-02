/* Fake Google: in-memory Drive (folders + json files) and a GIS stub, shared by two "devices" */
const {chromium}=require('playwright');
const drive={files:{},next:1};const mk=(name,parent,mime,content)=>{const id="f"+(drive.next++);drive.files[id]={id,name,parents:[parent],mimeType:mime,content,modifiedTime:new Date().toISOString(),trashed:false};return drive.files[id];};
const FOLDER='application/vnd.google-apps.folder';
async function handle(route){
  const req=route.request();const url=new URL(req.url());const m=req.method();
  if(url.hostname==="accounts.google.com"){return route.fulfill({contentType:"application/javascript",body:`window.google={accounts:{oauth2:{initTokenClient(o){return {callback:null,error_callback:null,requestAccessToken(p){setTimeout(()=>this.callback({access_token:"tok",expires_in:3600}),20);}};},revoke(t,cb){cb&&cb();}}}};`});}
  if(url.pathname==="/oauth2/v3/userinfo")return route.fulfill({json:{email:"amro@example.com"}});
  if(url.pathname==="/drive/v3/files"&&m==="GET"){const q=url.searchParams.get("q")||"";const parent=(q.match(/'([^']+)' in parents/)||[])[1];const name=(q.match(/name = '([^']+)'/)||[])[1];const foldersOnly=q.includes("mimeType = '"+FOLDER+"'");
    const files=Object.values(drive.files).filter(f=>!f.trashed&&f.parents[0]===parent&&(!name||f.name===name)&&(!foldersOnly||f.mimeType===FOLDER)).map(f=>({id:f.id,name:f.name,mimeType:f.mimeType,modifiedTime:f.modifiedTime,size:String((f.content||"").length)}));return route.fulfill({json:{files}});}
  if(url.pathname==="/drive/v3/files"&&m==="POST"){const b=JSON.parse(req.postData());const f=mk(b.name,b.parents[0],b.mimeType,"");return route.fulfill({json:{id:f.id}});}
  if(url.pathname.startsWith("/drive/v3/files/")&&m==="GET"){const id=url.pathname.split("/")[4];const f=drive.files[id];if(!f)return route.fulfill({status:404,json:{error:{message:"not found"}}});return route.fulfill({contentType:"application/octet-stream",body:f.content});}
  if(url.pathname.startsWith("/drive/v3/files/")&&m==="PATCH"){const id=url.pathname.split("/")[4];Object.assign(drive.files[id],JSON.parse(req.postData()));return route.fulfill({json:{id}});}
  if(url.pathname.startsWith("/upload/drive/v3/files")){const body=req.postData()||"";const parts=body.split(/--galen\d+/).filter(p=>p.includes("Content-Type"));const meta=JSON.parse(parts[0].split("\r\n\r\n")[1].trim());const content=parts[1].split("\r\n\r\n")[1].replace(/\r\n$/,"");
    let f;if(m==="PATCH"){const id=url.pathname.split("/")[5];f=drive.files[id];f.content=content;f.modifiedTime=new Date().toISOString();}else f=mk(meta.name,meta.parents[0],"application/json",content);return route.fulfill({json:{id:f.id,modifiedTime:f.modifiedTime}});}
  if(url.hostname.includes("googleapis"))return route.fulfill({status:404,json:{error:{message:"unhandled "+url.pathname}}});
  return route.continue();
}
(async()=>{const b=await chromium.launch();
  const dev=async(name)=>{const ctx=await b.newContext({viewport:{width:400,height:860}});await ctx.route(/googleapis\.com|accounts\.google\.com/,handle);const pg=await ctx.newPage();pg.on('pageerror',e=>console.log(name,'PE',e.message));await pg.goto('http://localhost:8765/#tools/google');await pg.waitForTimeout(800);return pg;};
  const A=await dev("A");
  await A.click('#g-in');await A.waitForTimeout(1500);
  console.log('A status',await A.evaluate(()=>[Store.mode,Store.status,G.email()]));
  // A studies: grade 3 cards and log
  await A.evaluate(()=>{schedule("t:jvp",2);schedule("v:s3",3);Store.s.log.push({id:"l1",t:Date.now(),sign:"s3",what:"S3",conf:80});Store.save(true);});await A.waitForTimeout(1500);
  console.log('drive files',Object.values(drive.files).map(f=>f.name).join(", "));
  const st=JSON.parse(Object.values(drive.files).find(f=>f.name==="status.json").content);console.log('status.json',st.title,st.due,st.estimatedMinutes,st.asks.length,st.summary);
  // plan from Citrus
  const hub=Object.values(drive.files).find(f=>f.name==="hub"&&f.mimeType===FOLDER);const citrus=mk("citrus",hub.id,FOLDER,"");
  const today=new Date().toISOString().slice(0,10);mk("plan.json",citrus.id,"application/json",JSON.stringify({app:"citrus",updatedAt:new Date().toISOString(),days:{[today]:{shift:{code:"N",label:"Night",overnight:true,start:"19:00",end:"07:00"},blocks:[{app:"galen",title:"Galen: daily round",date:today,start:"16:00",end:"16:20",minutes:20}]}}}));
  // device B signs in, should receive A's progress merged with its own
  const B=await dev("B");await B.evaluate(()=>{schedule("t:murphy",2);});await B.click('#g-in');await B.waitForTimeout(2500);
  console.log('B srs',await B.evaluate(()=>Object.keys(Store.s.srs).sort()),'log',await B.evaluate(()=>Store.s.log.length));
  console.log('B plan',await B.evaluate(()=>JSON.stringify(Hub.todayFromPlan())));
  // A syncs and gets B's card
  await A.evaluate(()=>Hub.daily("force"));await A.waitForTimeout(2000);console.log('A srs',await A.evaluate(()=>Object.keys(Store.s.srs).sort()));
  // conflict: both edit same card; later wins
  await A.evaluate(()=>{schedule("t:jvp",0);});await B.evaluate(()=>{schedule("t:jvp",3);});await A.waitForTimeout(1800);await B.waitForTimeout(1800);await A.evaluate(()=>Hub.daily("force"));await A.waitForTimeout(1500);
  console.log('A jvp after conflict',await A.evaluate(()=>Store.s.srs["t:jvp"].n),'(B graded later → n should be 2+)');
  // google page renders plan
  await B.evaluate(()=>open("tools","google"));await B.waitForTimeout(300);console.log('google page',await B.evaluate(()=>document.querySelector("#view").textContent.includes("Night")&&document.querySelector("#view").textContent.includes("daily round")));
  await B.evaluate(()=>open("today"));await B.waitForTimeout(300);
  await b.close();})();
