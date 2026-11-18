#!/usr/bin/env node
/* li. visual-regression evidence: real Chrome CDP, zero dependencies.
   Operates on an isolated runner. No production write or lesson publication.
   PNG + computed geometry are not iPhone Safari, VoiceOver or PO G2 signoff. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawn} from "node:child_process";

const base=process.env.LI_QA_BASE_URL||"http://127.0.0.1:8765/site/";
const out=path.resolve(process.env.LI_QA_OUTPUT||"qa-output/visual-matrix");
const widths=[320,375,390,402,600,820,1440];
const routes=["home","catalog","research","lesson","case","guide","guideDetail","library","dashboard","settings","search","capture","lessonL03","lessonL09","lessonL15"];
const captureWidths=new Set([390,820,1440]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync(path.join(out,"screenshots"),{recursive:true});
const chrome=spawn(process.env.CHROME_BIN||"google-chrome",[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--remote-debugging-port=9229","--remote-allow-origins=*","--no-first-run",
 "--user-data-dir="+fs.mkdtempSync(path.join(os.tmpdir(),"li-qa-")),"about:blank"
],{stdio:["ignore","ignore","pipe"]});
let stderr="",ws,serial=1;const waiting=new Map();
chrome.stderr.on("data",chunk=>{stderr+=chunk.toString().slice(0,2000);});
const stop=()=>{try{ws?.close();chrome.kill("SIGTERM");}catch{}};
process.on("exit",stop);
function send(method,params={}){
 const id=serial++;
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{waiting.delete(id);reject(Error("CDP timeout: "+method));},15000);
  waiting.set(id,{resolve,reject,timeout});
  ws.send(JSON.stringify({id,method,params}));
 });
}
async function connect(){
 let page;
 for(let i=0;i<45;i++){
  try{const data=await(await fetch("http://127.0.0.1:9229/json/list")).json();page=data.find(x=>x.type==="page");if(page)break;}catch{}
  await sleep(180);
 }
 if(!page)throw Error("Chrome CDP unavailable "+stderr.slice(0,900));
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error("WebSocket not open")),10000);
  ws.addEventListener("open",()=>{clearTimeout(timer);resolve();},{once:true});
  ws.addEventListener("error",e=>{clearTimeout(timer);reject(e);},{once:true});
 });
 ws.addEventListener("message",e=>{
  let m;try{m=JSON.parse(e.data);}catch{return;}
  if(!m.id||!waiting.has(m.id))return;
  const q=waiting.get(m.id);waiting.delete(m.id);clearTimeout(q.timeout);
  m.error?q.reject(Error(m.error.message)):q.resolve(m.result);
 });
 await send("Runtime.enable");await send("Page.enable");
}
async function evaluate(expression){
 const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error("JS: "+(r.exceptionDetails.exception?.description||r.exceptionDetails.text));
 return r.result?.value;
}
async function waitReady(){
 for(let i=0;i<80;i++){
  try{if(await evaluate('document.readyState==="complete"&&typeof window.navigate==="function"&&!!document.getElementById("page-lessonL03")&&!!document.getElementById("page-lessonL09")&&!!document.getElementById("page-lessonL15")'))return;}catch{}
  await sleep(130);
 }
 throw Error("App or native Wave1 lessons not initialized");
}
function auditImpl(){
 const W=window.innerWidth,H=window.innerHeight,pg=document.querySelector(".page.active");
 const failures=[],warnings=[],samples={};
 const R=x=>{if(!x)return null;const b=x.getBoundingClientRect();return{x:Math.round(b.x),y:Math.round(b.y),r:Math.round(b.right),b:Math.round(b.bottom),w:Math.round(b.width),h:Math.round(b.height)};};
 const visible=x=>{if(!x||x.hidden||x.closest("[hidden]"))return false;const s=getComputedStyle(x),r=x.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0;};
 const add=(a,code,data)=>a.push({code,data});
 const overflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-W;
 if(getComputedStyle(document.body).fontSize!=="16px")add(failures,"body-font-not-16px",getComputedStyle(document.body).fontSize);
 if(overflow>4){
  const elems=[...document.querySelectorAll("body *")].filter(x=>visible(x)&&R(x).r>W+4).slice(0,8);
  add(failures,"horizontal-overflow",{px:overflow,elements:elems.map(x=>({tag:x.tagName,id:x.id,cls:typeof x.className==="string"?x.className.slice(0,60):"",r:R(x)}))});
 }
 const p=pg?.id||"MISSING";if(!pg)add(failures,"missing-active-screen",null);
 const nav=document.querySelector(".mobile-nav"),fab=document.querySelector("#laoly-fab");
 samples.nav=visible(nav)?R(nav):null;samples.fab=visible(fab)?R(fab):null;
 // Human PO decision: Lão Lý is an intentional floating action button.
 // It may overlay nav, content, cards, and other tap regions. Intersection
 // itself is NOT a defect and must never be a visual-QA warning or failure.
 // Verify only that the FAB is present, visible, and centrally operable
 // while the page is in its normal (no modal) state.
 const modalIsOpen=!!document.querySelector(".modal.open");
 if(!modalIsOpen){
  if(!visible(fab))add(failures,"laoly-fab-not-visible",null);
  else{
   const r=samples.fab,cx=(r.x+r.r)/2,cy=(r.y+r.b)/2;
   if(cx<0||cx>=W||cy<0||cy>=H)add(failures,"laoly-fab-center-out-of-viewport",{fab:r,viewport:{w:W,h:H}});
   else{
    const top=document.elementFromPoint(cx,cy);
    if(top && !top.closest("#laoly-fab"))add(failures,"laoly-fab-center-not-tappable",{fab:r,top:{tag:top.tagName,id:top.id,cls:typeof top.className==="string"?top.className.slice(0,60):""}});
   }
  }
 }
 const controls=pg?[...pg.querySelectorAll("button,a.action,input,select,textarea")].filter(visible):[];
 // A labeled checkbox is activated through the entire 48px+ label row.
 // The visually hidden file input is controlled by the visible import button.
 const hitArea=x=>x.matches("input[type=checkbox],input[type=radio]")?(x.closest("label")||x):x;
 const undersized=controls.filter(x=>{
  if(x.matches("input[type=file]")&&R(x).r<0)return false;
  const box=R(hitArea(x));return box.h<44||box.w<44;
 }).slice(0,8).map(x=>({label:(x.textContent||x.getAttribute("aria-label")||x.closest("label")?.textContent||"").trim().slice(0,50),r:R(hitArea(x))}));
 if(undersized.length)add(warnings,"touch-target-under-44px",undersized);
 const text=pg?[...pg.querySelectorAll("h1,h2,h3,p,label,.state-note,.intro,.method-card .purpose")].filter(visible):[];
 const clipped=text.filter(x=>{const c=getComputedStyle(x);return(c.overflowY==="hidden"||c.overflowY==="clip"||c.webkitLineClamp!=="none")&&x.scrollHeight>x.clientHeight+3;}).slice(0,8).map(x=>({text:x.textContent.trim().slice(0,50),r:R(x),scroll:x.scrollHeight,client:x.clientHeight}));
 if(clipped.length)add(warnings,"possibly-clipped-text",clipped);
 const essential=pg?[...pg.querySelectorAll(".intro,.surface>p,.panel>p,.method-card .purpose,.method-card .original")].filter(visible):[];
 const tiny=essential.filter(x=>parseFloat(getComputedStyle(x).fontSize)<14).slice(0,8).map(x=>({text:x.textContent.slice(0,40),size:getComputedStyle(x).fontSize}));
 if(tiny.length)add(failures,"essential-text-under-14px",tiny);
 const id=p.replace("page-","");
 const selection=["home","catalog","guide","library"].includes(id)?".mobile-nav [data-page='"+id+"']":["settings","search","capture"].includes(id)?".header .tool-button[data-page='"+id+"']":null;
 if(selection&&document.querySelector(selection)?.getAttribute("aria-current")!=="page")add(failures,"selected-nav-not-current",id);
 if(p==="page-home"){
  const q=R(document.querySelector("#mirror-question")),m=R(document.querySelector(".mirror-message")),action=R(document.querySelector(".hero-actions")),context=R(document.querySelector("#page-home .hero-dialogue"));
  const btns=[...document.querySelectorAll("#page-home .hero-actions button")].filter(visible);
  samples.home={q,mirror:m,context,actions:action,buttons:btns.map(x=>({label:x.textContent.trim().slice(0,50),r:R(x)}))};
  if(q&&m&&(q.x<m.x-12||q.r>m.r+12))add(warnings,"mirror-text-out-of-container",{q,m});
  if(btns.length>=2&&Math.abs(R(btns[0]).y-R(btns[1]).y)>7)add(warnings,"home-cta-not-aligned",samples.home.buttons);
 }
 if(p==="page-guide"){
  const cards=[...pg.querySelectorAll("#method-cards>.method-card")];
  samples.guide={count:cards.length,first:R(cards[0]),mentor:R(pg.querySelector(".guide-mentor")),filters:R(pg.querySelector("#method-filters"))};
  if(!cards.length)add(failures,"no-guide-cards",null);
  const desc=cards.map(x=>x.querySelector(".purpose")).filter(Boolean);
  if(desc.some(x=>parseFloat(getComputedStyle(x).fontSize)<14||getComputedStyle(x).webkitLineClamp!=="none"))add(failures,"unreadable-or-clamped-guide-copy",null);
 }
 if(p.startsWith("page-lessonL"))samples.lesson={editors:[...pg.querySelectorAll("textarea")].filter(visible).length,stats:R(pg.querySelector(".l09-stats"))};
 for(const modal of ["buddy-modal","checkin-modal"]){
  const el=document.getElementById(modal);
  if(el?.classList.contains("open")){
   const d=R(el.querySelector(".dialog"));
   samples.modal={id:modal,dialog:d};
   if(d&&(d.x < -4||d.r>W+4))add(failures,"modal-out-of-horizontal-bounds",d);
   if(d&&(d.y < -4||d.b>H+4))add(failures,"modal-out-of-vertical-bounds",{d,viewport:{w:W,h:H}});
   const content=el.querySelector(".dialog");
   if(content){
    const c=getComputedStyle(content),excess=content.scrollHeight-content.clientHeight;
    samples.modal.scroll={height:content.clientHeight,scrollHeight:content.scrollHeight,overflowY:c.overflowY};
    if(excess>4&&!["auto","scroll"].includes(c.overflowY))add(failures,"modal-content-not-scrollable",samples.modal.scroll);
   }
   // UX-DS-07: current-main regression retests previously found wrapped heading defect after scoped Check-in redesign.
   // Current Check-in uses approved responsive title 24/32; require readable line spacing.
   // This check deliberately covers modal headings missed by .page-only text QA.
   if(modal==="checkin-modal"){
    const title=el.querySelector("#checkin-title");
    if(visible(title)){
     const cs=getComputedStyle(title);
     const fontSize=parseFloat(cs.fontSize),lineHeight=parseFloat(cs.lineHeight);
     const headingRect=R(title),wrapped=Number.isFinite(lineHeight)&&headingRect.h>lineHeight*1.45;
     samples.modal.heading={text:title.textContent.trim(),fontSize,lineHeight,wrapped,rect:headingRect};
     if(!Number.isFinite(lineHeight)||lineHeight<fontSize*1.1)
      add(failures,wrapped?"wrapped-modal-heading-leading-too-tight":"modal-heading-leading-below-role",samples.modal.heading);
     if(el.getAttribute("role")!=="dialog"||el.getAttribute("aria-modal")!=="true"||el.getAttribute("aria-labelledby")!==title.id)
      add(failures,"checkin-dialog-aria-invalid",null);
    }
   }
  }
 }
 return{route:id,viewport:{w:W,h:H},overflow,failures,warnings,samples};
}
const report={at:new Date().toISOString(),sha:process.env.GITHUB_SHA||"unknown",source:"real headless Chrome computed DOM, not iPhone/VoiceOver/G2",matrix:[],errors:[],screenshots:[]};
try{
 await connect();
 for(const width of widths){
  const height=width<=402?844:width<=600?900:width<=820?1024:900;
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<=600});
  await send("Page.navigate",{url:base+"index.html?visualQA="+width});
  await waitReady();
  const states=(width===390||width===820)?routes.concat(["buddyHome","buddyGuide","checkin","checkinShort","checkinShortEnd","checkinIncomplete","checkinSelected","checkinLongEN"]):width<=600?routes.concat(["checkin","checkinLongEN"]):routes;
  for(const state of states){
   try{
    // Short-viewport fixture checks vertical modal scrolling without changing app source.
    const targetHeight=["checkinShort","checkinShortEnd"].includes(state)?568:height;
    await send("Emulation.setDeviceMetricsOverride",{width,height:targetHeight,deviceScaleFactor:1,mobile:width<=600});
    const change="(()=>{const id="+JSON.stringify(state)+";"+
     "document.querySelectorAll('.modal.open').forEach(x=>x.classList.remove('open'));"+
     "if(id==='guideDetail'){window.showMethod('T01');}"+
     "else if(id==='buddyHome'||id==='buddyGuide'){window.navigate(id==='buddyHome'?'home':'guide',{remember:false,focus:false,syncUrl:false});window.openLaoLy(document.getElementById('laoly-fab'));}"+
     "else if(['checkin','checkinShort','checkinShortEnd','checkinIncomplete','checkinSelected','checkinLongEN'].includes(id)){window.navigate('home',{remember:false,focus:false,syncUrl:false});window.openModal('checkin-modal',document.getElementById('checkin'));if(id==='checkinLongEN')document.getElementById('checkin-title').textContent='How is your attention and energy level right now?';if(id==='checkinSelected'||id==='checkinIncomplete'){document.getElementById('checkin-sleep').value=id==='checkinSelected'?'no':'yes';document.getElementById('checkin-move').value=id==='checkinSelected'?'yes':'no';if(id==='checkinSelected')document.getElementById('checkin-rest').value='yes';document.getElementById('checkin-move').dispatchEvent(new Event('change',{bubbles:true}));}if(id==='checkinShortEnd'){const d=document.querySelector('#checkin-modal .dialog');d.scrollTop=d.scrollHeight;}}"+
     "else{document.querySelectorAll('.modal.open').forEach(x=>x.classList.remove('open'));window.navigate(id,{remember:false,focus:false,syncUrl:false});}"+
     "return id;})()";
    await evaluate(change);await sleep(80);
    const item=await evaluate("("+auditImpl.toString()+")()");
    if(!item)throw Error("empty browser result");
    item.state=state;
    if(state==="checkinSelected"){
     const enabled=await evaluate('!document.getElementById("apply-checkin").disabled');
     const response=await evaluate('document.getElementById("checkin-recommendation").textContent.trim()');
     item.samples.selected={applyEnabled:enabled,recommendation:response};
     if(!enabled||!response.startsWith("Gợi ý: Hồi trí"))item.failures.push({code:"checkin-physical-complete-not-ready",data:item.samples.selected});
    }
    if(state==="checkinIncomplete"){
     const enabled=await evaluate('!document.getElementById("apply-checkin").disabled');
     const response=await evaluate('document.getElementById("checkin-recommendation").textContent.trim()');
     item.samples.incomplete={applyEnabled:enabled,recommendation:response};
     if(enabled||!response.startsWith("Chưa thể áp dụng"))item.failures.push({code:"checkin-incomplete-physical-gate-broken",data:item.samples.incomplete});
    }
    if(state==="checkinShortEnd"){
     const scroll=await evaluate('(()=>{const x=document.querySelector("#checkin-modal .dialog");return {top:x.scrollTop,max:x.scrollHeight-x.clientHeight,actionsBottom:document.querySelector("#checkin-modal .checkin-actions").getBoundingClientRect().bottom,dialogBottom:x.getBoundingClientRect().bottom};})()');
     item.samples.scrollEnd=scroll;
     if(scroll.max>4&&(scroll.top<scroll.max-2||scroll.actionsBottom>scroll.dialogBottom+4))item.failures.push({code:"checkin-scroll-end-unreachable",data:scroll});
    }
    report.matrix.push(item);
    if(captureWidths.has(width)||(width===320&&["home","guide","checkin","checkinLongEN"].includes(state))||([375,402].includes(width)&&["checkin","checkinLongEN"].includes(state))||(width===600&&state==="checkinLongEN")){
     const name=width+"-"+state+".png";
     const image=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
     fs.writeFileSync(path.join(out,"screenshots",name),Buffer.from(image.data,"base64"));
     report.screenshots.push(name);
    }
    console.log((item.failures.length?"FAIL ":"PASS ")+width+" "+state+" overflow="+item.overflow+" errors="+item.failures.length+" warnings="+item.warnings.length);
   }catch(e){report.errors.push({width,state,message:String(e?.stack||e)});console.error("ERROR "+width+" "+state+" "+String(e));}
  }
 }
}catch(e){report.errors.push({fatal:String(e?.stack||e)});console.error("VISUAL_FATAL",String(e?.stack||e),stderr.slice(0,1200));}
finally{stop();}
report.failures=report.matrix.flatMap(x=>x.failures.map(f=>({width:x.viewport.w,state:x.state,...f})));
report.warnings=report.matrix.flatMap(x=>x.warnings.map(f=>({width:x.viewport.w,state:x.state,...f})));
report.summary={routes:report.matrix.length,screenshots:report.screenshots.length,failures:report.failures.length,warnings:report.warnings.length,errors:report.errors.length};
fs.writeFileSync(path.join(out,"report.json"),JSON.stringify(report,null,2));
const esc=s=>String(s).replace(/[&<>"]/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[x]));
const rows=report.matrix.map(x=>"<tr><td>"+x.viewport.w+"</td><td>"+esc(x.state)+"</td><td>"+x.overflow+"</td><td>"+x.failures.length+"</td><td>"+x.warnings.length+"</td></tr>").join("");
const gallery=report.screenshots.map(name=>'<a href="screenshots/'+name+'"><img loading="lazy" src="screenshots/'+name+'" alt="'+name+'"><span>'+name+'</span></a>').join("");
const page='<!doctype html><html><meta charset="utf-8"><title>li. visual QA staging</title><style>body{font:15px/1.5 system-ui;background:#F3EBDC;color:#243A29;padding:24px}table{border-collapse:collapse;width:100%}td,th{padding:8px;border:1px solid #AAA}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.gallery a{background:white;padding:8px;color:inherit}.gallery img{width:100%;max-height:520px;object-fit:contain;object-position:top;display:block}pre{white-space:pre-wrap;background:white;padding:16px}</style><h1>li. Visual regression evidence (staging)</h1><p>Real computed Chrome DOM + PNG; human PO G2/iPhone/VoiceOver not verified.</p><pre>'+esc(JSON.stringify(report.summary,null,2))+'</pre><table><tr><th>Width</th><th>Route</th><th>Overflow px</th><th>Failures</th><th>Warnings</th></tr>'+rows+'</table><h2>Failures</h2><pre>'+esc(JSON.stringify(report.failures,null,2))+'</pre><h2>Warnings</h2><pre>'+esc(JSON.stringify(report.warnings,null,2))+'</pre><h2>Screenshots</h2><div class="gallery">'+gallery+'</div></html>';
fs.writeFileSync(path.join(out,"index.html"),page);
console.log("MATRIX_SUMMARY "+JSON.stringify(report.summary));
if(report.errors.length||report.failures.length)process.exitCode=1;
