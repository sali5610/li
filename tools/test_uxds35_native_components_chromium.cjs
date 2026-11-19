#!/usr/bin/env node
'use strict';
/**
 * UX-DS-35 Stage02: REAL native app + component library Chromium QA.
 * New isolated Chrome profile at 127.0.0.1. Never communicates with Neon,
 * visits production, imports valid backup, or writes real learner data.
 * Dialog focus-return is measured as a known review gate (not silently PASS).
 */
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const [bin,url]=process.argv.slice(2);
if(!bin || !/^http:\/\/127\.0\.0\.1:8797\/uxds35-design-pin\/site\/component-library-review\.html$/.test(url||'')){
 throw Error('Usage: <chromium> http://127.0.0.1:8797/uxds35-design-pin/site/component-library-review.html');
}
const base='http://127.0.0.1:8797/uxds35-design-pin/site/';
const out='/tmp/li-uxds35-native-browser-evidence';
fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'li-uxds35-native-'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let chrome,socket,seq=0,stderr='';
const pending=new Map();
async function until(fn,label,timeout=16000){
 const start=Date.now();
 while(Date.now()-start<timeout){const value=await fn();if(value)return value;await sleep(120)}
 throw Error('Timed out '+label);
}
async function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++seq;
  const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},12000);
  pending.set(id,r=>{clearTimeout(timer);if(r.error||r.result?.exceptionDetails)reject(Error('CDP '+method+' '+JSON.stringify(r.error||r.result.exceptionDetails).slice(0,1000)));else resolve(r.result)});
  socket.send(JSON.stringify({id,method,params}));
 });
}
const evalJS=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}))?.result?.value;
async function key(name){
 const keys={Enter:{key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'},Escape:{key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27},Tab:{key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9}};
 const p=keys[name];assert.ok(p);
 await send('Input.dispatchKeyEvent',{type:'keyDown',...p});
 await send('Input.dispatchKeyEvent',{type:'keyUp',...p});
}
async function goto(next,selector){
 await send('Page.navigate',{url:next});
 await until(async()=>evalJS("document.readyState==='complete' && !!document.querySelector("+JSON.stringify(selector)+")"),'navigation to '+next);
}
async function shot(label){
 const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync(path.join(out,label+'.png'),Buffer.from(r.data,'base64'));
}
async function setup(){
 chrome=spawn(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,url],{stdio:['ignore','ignore','pipe']});
 chrome.stderr.on('data',x=>{stderr=(stderr+x.toString()).slice(-3000)});
 const port=await until(()=>{
  const f=path.join(profile,'DevToolsActivePort');
  return fs.existsSync(f)?fs.readFileSync(f,'utf8').split('\n')[0]:null;
 },'DevTools port');
 const page=await until(async()=>{
  try{const r=await fetch('http://127.0.0.1:'+port+'/json/list');const j=await r.json();return j.find(x=>x.type==='page'&&x.webSocketDebuggerUrl&&x.url.startsWith(url))}catch{return null}
 },'initial native page');
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{
  const t=setTimeout(()=>fail(Error('CDP WebSocket timeout')),12000);
  socket.addEventListener('open',()=>{clearTimeout(t);ok()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(t);fail(Error('CDP WebSocket error'))},{once:true});
 });
 socket.addEventListener('message',event=>{
  let msg;try{msg=JSON.parse(String(event.data))}catch{return}
  if(msg.id&&pending.has(msg.id)){const cb=pending.get(msg.id);pending.delete(msg.id);cb(msg)}
 });
 await send('Page.enable');await send('Runtime.enable');
 await until(()=>evalJS("!!document.querySelector('#ds-query')"),'component-library field');
}
async function run(){
 await setup();
 let count=0;
 const check=(pass,what)=>{assert.ok(pass,what);count++};
 const evidence={source:'pinned DS HEAD 7a8f3e5d544ee71fcc989cdd1b8bae99f6778381',environment:'isolated synthetic Chromium localhost only',g2:'OPEN',physicalSafari:'UNVERIFIED',families:{},gaps:[]};
 // FIELD: implemented interactive specimen; check input semantics, not fake save.
 const field=await evalJS("(()=>{const a=document.querySelector('#ds-error'),m=document.querySelector('#ds-error-note'),d=document.querySelector('#ds-disabled'),r=document.querySelector('#ds-readonly'),t=document.querySelector('#ds-query'),l=document.querySelector('label[for=\"ds-query\"]');return {invalid:a?.getAttribute('aria-invalid'),linked:a?.getAttribute('aria-describedby'),alert:m?.getAttribute('role'),disabled:d?.disabled,readOnly:r?.readOnly,readOnlyDisabled:r?.disabled,label:!!l,editable:!t?.disabled&& !t?.readOnly,queryRole:document.querySelector('#ds-query-result')?.getAttribute('role')}})()");
 evidence.families.Field=field;
 check(field.invalid==='true'&&field.linked==='ds-error-note'&&field.alert==='alert','Field error not linked to accessible reason');
 check(field.disabled===true&&field.readOnly===true&&field.readOnlyDisabled===false,'Field disabled/readonly conflated');
 check(field.label&&field.editable&&field.queryRole==='status','Field default label/status missing');
 await evalJS("document.querySelector('#ds-disabled').focus()");
 check((await evalJS("document.activeElement?.id"))!=='ds-disabled','disabled Field got focus');
 await evalJS("document.querySelector('#ds-readonly').focus()");
 check((await evalJS("document.activeElement?.id"))==='ds-readonly','readonly Field not keyboard focusable');
 // Guide NAV: the actual native app at mobile 390px, keyboard activation, aria-current sync.
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await goto(base+'index.html?page=guide','#laoly-fab');
 await until(()=>evalJS("!!document.querySelector('.mobile-nav .nav-btn[data-page=\"guide\"]')"),'mobile navigation');
 const navBefore=await evalJS("(()=>{const m=document.querySelector('.mobile-nav'),bs=[...m.querySelectorAll('button[data-page]')];return {display:getComputedStyle(m).display,count:bs.length,labels:bs.every(b=>!!b.getAttribute('aria-label')),target:bs.every(b=>b.getBoundingClientRect().height>=44),icons:bs.map(b=>b.querySelector('svg')?.classList.contains('lucide')||!!b.querySelector('i[data-lucide]'))}})()");
 evidence.families.Navigation={before:navBefore};
 check(navBefore.display!=='none'&&navBefore.count===4,'mobile nav not visible/four-tab at 390');
 check(navBefore.labels&&navBefore.target,'mobile nav accessible labels or target too small');
 await evalJS("document.querySelector('.mobile-nav .nav-btn[data-page=\"guide\"]').focus()");
 await key('Enter');
 await until(()=>evalJS("document.querySelector('#page-guide')?.classList.contains('active')"),'real guide route after keyboard Enter');
 const guide=await evalJS("(()=>({active:[...document.querySelectorAll('.mobile-nav .nav-btn[aria-current=\"page\"]')].map(x=>x.dataset.page),page:document.querySelector('#page-guide').classList.contains('active'),chip:!!document.querySelector('#method-filters .filter')}))()");
 evidence.families.Navigation.guide=guide;
 check(guide.page&&guide.active.length===1&&guide.active[0]==='guide','Guide route aria-current not synchronized');
 check(guide.chip,'real Guide filter missing');
 await evalJS("document.querySelector('.mobile-nav .nav-btn[data-page=\"catalog\"]').focus()");
 await key('Enter');
 await until(()=>evalJS("document.querySelector('#page-catalog')?.classList.contains('active')"),'catalog route');
 const catalog=await evalJS("(()=>({active:[...document.querySelectorAll('.mobile-nav .nav-btn[aria-current=\"page\"]')].map(x=>x.dataset.page),visible:document.querySelector('#page-catalog')?.classList.contains('active')}))()");
 evidence.families.Navigation.catalog=catalog;
 check(catalog.visible&&catalog.active.join(',')==='catalog','navigation route state drift after second click');
 await shot('native-nav-mobile-390');
 // DIALOG: actual fab, keyboard activation, true modal role & Escape. Focus return measured separately.
 const dialogInitial=await evalJS("(()=>({role:document.querySelector('#buddy-modal')?.getAttribute('role'),modal:document.querySelector('#buddy-modal')?.getAttribute('aria-modal'),closed:!document.querySelector('#buddy-modal')?.classList.contains('open'),name:!!document.querySelector('#buddy-title')?.textContent.trim()}))()");
 check(dialogInitial.role==='dialog'&&dialogInitial.modal==='true'&&dialogInitial.closed&&dialogInitial.name,'dialog initial ARIA/closed state wrong');
 await evalJS("document.querySelector('#laoly-fab').focus()");
 await key('Enter');
 await until(()=>evalJS("document.querySelector('#buddy-modal')?.classList.contains('open')"),'dialog actual keyboard open');
 const opened=await evalJS("(()=>{const m=document.querySelector('#buddy-modal'),a=document.activeElement;return {open:m.classList.contains('open'),focusInside:m.contains(a),activeId:a?.id||'',closeVisible:!!m.querySelector('#close-modal')&&getComputedStyle(m.querySelector('#close-modal')).display!=='none',background:document.querySelector('#page-catalog')?.getAttribute('inert')??null}})()");
 evidence.families.Dialog={initial:dialogInitial,opened};
 check(opened.open&&opened.focusInside&&opened.closeVisible,'dialog did not move focus inside on keyboard open');
 await shot('native-dialog-mobile-390');
 await key('Escape');
 await until(()=>evalJS("!document.querySelector('#buddy-modal')?.classList.contains('open')"),'Escape close');
 const closed=await evalJS("(()=>({closed:!document.querySelector('#buddy-modal')?.classList.contains('open'),focusReturned:document.activeElement?.id==='laoly-fab',focusId:document.activeElement?.id||document.activeElement?.tagName||''}))()");
 evidence.families.Dialog.closed=closed;
 check(closed.closed,'Escape did not close dialog');
 if(!closed.focusReturned)evidence.gaps.push({component:'Dialog',severity:'P1',code:'DIALOG_FOCUS_NOT_RESTORED',evidence:'Keyboard Escape closes buddy modal but focus does not return to #laoly-fab',actualFocus:closed.focusId,gate:'NOT_ACCEPTED'});
 // FEEDBACK: actual Settings import invalid file in isolated profile. NO valid import and no real data.
 await evalJS("document.querySelector('.header [data-page=\"settings\"]').click()");
 await until(()=>evalJS("document.querySelector('#page-settings')?.classList.contains('active')"),'settings route');
 const feedbackInitial=await evalJS("(()=>{const l=document.querySelector('#import-state-loading'),e=document.querySelector('#import-state-error'),btn=document.querySelector('#import-state-retry');return {loadingHidden:l.hidden,errorHidden:e.hidden,loadingRole:l.getAttribute('role'),loadingLive:l.getAttribute('aria-live'),errorRole:e.getAttribute('role'),retryType:btn.type,decorative:[...document.querySelectorAll('#import-state-loading img,#import-state-error img')].every(x=>x.getAttribute('alt')===''&&x.getAttribute('aria-hidden')==='true')}})()");
 evidence.families.Feedback={initial:feedbackInitial};
 check(feedbackInitial.loadingHidden&&feedbackInitial.errorHidden,'import feedback displayed false status before import');
 check(feedbackInitial.loadingRole==='status'&&feedbackInitial.loadingLive==='polite'&&feedbackInitial.errorRole==='alert','import feedback ARIA roles missing');
 check(feedbackInitial.retryType==='button'&&feedbackInitial.decorative,'retry semantics or decorative alt incorrect');
 const before=await evalJS("JSON.stringify(Object.entries(localStorage).sort((a,b)=>a[0].localeCompare(b[0])))");
 await evalJS("(()=>{const input=document.querySelector('#import-personal-data'),d=new DataTransfer();d.items.add(new File(['{ invalid JSON UX-DS-35'], 'invalid-uxds35.json',{type:'application/json'}));input.files=d.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await until(()=>evalJS("!document.querySelector('#import-state-error')?.hidden"),'invalid JSON failure UI',10000);
 const feedbackError=await evalJS("(()=>{const l=document.querySelector('#import-state-loading'),e=document.querySelector('#import-state-error'),r=document.querySelector('#import-state-retry');return {visible:!e.hidden,loadingHidden:l.hidden,reason:document.querySelector('#import-state-error-message')?.textContent?.trim(),triggerEnabled:!document.querySelector('#import-personal-trigger')?.disabled,retryHeight:r.getBoundingClientRect().height,retryRole:r.type}})()");
 evidence.families.Feedback.invalid=feedbackError;
 check(feedbackError.visible&&feedbackError.loadingHidden&&feedbackError.reason.length>=8,'invalid JSON did not give meaningful recoverable error');
 check(feedbackError.triggerEnabled&&feedbackError.retryHeight>=48&&feedbackError.retryRole==='button','feedback retry unavailable or target too short');
 const after=await evalJS("JSON.stringify(Object.entries(localStorage).sort((a,b)=>a[0].localeCompare(b[0])))");
 check(before===after,'invalid JSON changed isolated app storage; must fail closed');
 const retry=await evalJS("(()=>{const i=document.querySelector('#import-personal-data'),old=i.click;let count=0;i.click=()=>{count++};try{document.querySelector('#import-state-retry').click()}finally{i.click=old}return count})()");
 check(retry===1,'retry did not reopen file input click handler');
 await shot('native-feedback-error-mobile-390');
 evidence.checks=count;
 fs.writeFileSync(path.join(out,'native-component-metrics.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log('PASS UX-DS-35 native Chromium Field/Navigation/Dialog/Feedback source QA '+JSON.stringify({assertions:count,modalFocusReturn:closed.focusReturned?'PASS':'FAIL_REVIEW_REQUIRED',gaps:evidence.gaps,g2:'OPEN',physicalSafari:'UNVERIFIED',release:'NONE'}));
}
run().catch(e=>{console.error('FAIL UX-DS-35 native source QA: '+e.stack);if(stderr)console.error('Chromium stderr '+stderr.slice(-1000));process.exitCode=1}).finally(async()=>{try{socket?.close()}catch{}try{chrome?.kill('SIGKILL')}catch{}await sleep(450);try{await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200})}catch{}});
