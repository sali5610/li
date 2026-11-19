#!/usr/bin/env node
'use strict';
// CI-only CDP browser regression of real L09 Vite React, no app publication or paid service.
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const [bin,url]=process.argv.slice(2);
if(!bin||!/^http:\/\/127\.0\.0\.1:8796\/uxds35-react-pin\/tools\/step16-real-l09-react-island\/dist\/index\.html$/.test(url||''))throw Error('Usage: <chrome> <localhost:8796/react-dist/index.html>');
const out='/tmp/li-uxds35-react-browser-evidence';fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'li-uxds35-cdp-'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let chrome,socket,seq=0,stderr='';const pending=new Map();
async function until(fn,why,timeout=20000){const start=Date.now();while(Date.now()-start<timeout){const v=await fn();if(v)return v;await sleep(120)}throw Error('Timed out: '+why)}
async function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},10000);pending.set(id,data=>{clearTimeout(timer);if(data.error||data.result?.exceptionDetails)reject(Error('CDP '+method+': '+JSON.stringify(data.error||data.result.exceptionDetails).slice(0,900)));else resolve(data.result)});socket.send(JSON.stringify({id,method,params}))})}
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}))?.result?.value;
async function key(name,modifiers=0){const o=name==='Tab'?{key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9}:name==='Enter'?{key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13}:name==='Space'?{key:' ',code:'Space',windowsVirtualKeyCode:32,nativeVirtualKeyCode:32}:null;assert.ok(o);await send('Input.dispatchKeyEvent',{type:'keyDown',modifiers,...o});await send('Input.dispatchKeyEvent',{type:'keyUp',modifiers,...o})}
function rgb(hex){const h=hex.slice(1);return 'rgb('+parseInt(h.slice(0,2),16)+', '+parseInt(h.slice(2,4),16)+', '+parseInt(h.slice(4,6),16)+')'}
async function setup(){
 chrome=spawn(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,url],{stdio:['ignore','ignore','pipe']});
 chrome.stderr.on('data',x=>{stderr=(stderr+x.toString()).slice(-4000)});
 const f=path.join(profile,'DevToolsActivePort');const port=await until(()=>fs.existsSync(f)?fs.readFileSync(f,'utf8').split('\n')[0]:null,'DevTools port');
 const page=await until(async()=>{try{const r=await fetch('http://127.0.0.1:'+port+'/json/list');const a=await r.json();return a.find(x=>x.type==='page'&&x.url.startsWith(url)&&x.webSocketDebuggerUrl)}catch{return null}},'localhost React page');
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{const t=setTimeout(()=>fail(Error('websocket timeout')),10000);socket.addEventListener('open',()=>{clearTimeout(t);ok()},{once:true});socket.addEventListener('error',()=>{clearTimeout(t);fail(Error('websocket error'))},{once:true})});
 socket.addEventListener('message',event=>{let m;try{m=JSON.parse(String(event.data))}catch{return}if(m.id&&pending.has(m.id)){const cb=pending.get(m.id);pending.delete(m.id);cb(m)}});
 await send('Page.enable');await send('Runtime.enable');
 await until(()=>evaluate("document.querySelector('.pilot [data-action=\"submit\"]')?.textContent || null"),'real mounted L09 React pilot');
}
async function screenshot(label){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,label+'.png'),Buffer.from(r.data,'base64'))}
async function test(){
 await setup();let count=0;const checks=(x,why)=>{assert.ok(x,why);count++};const evidence={viewport:[],keyboard:[],colors:{},source:'real pinned Step16.2 L09 Vite build, synthetic isolated profile',g2:'OPEN',physicalSafari:'UNVERIFIED'};
 const app=await evaluate("(()=>{const p=document.querySelector('.pilot');return {lesson:p?.dataset.lessonId,hash:document.querySelector('#root')?.dataset.sourceSha256,count:document.querySelectorAll('textarea[data-answer]').length,real:localStorage.getItem('li.review.L09-1-2.v1')}})()");
 checks(app?.lesson==='L09-1-2'&&app.hash?.length===64&&app.count===4,'real authored L09 React challenge not mounted');checks(app.real===null,'real learner key not empty in test profile');
 const s=await evaluate("(()=>{const a=document.querySelector('[data-action=\"submit\"]'),b=document.querySelector('[data-action=\"hint\"]');return {primary:getComputedStyle(a).backgroundColor,primaryText:getComputedStyle(a).color,secondary:getComputedStyle(b).backgroundColor,secondaryText:getComputedStyle(b).color,surface:getComputedStyle(document.querySelector('.pilot-surface')).backgroundColor,input:getComputedStyle(document.querySelector('[data-answer=\"0\"]')).backgroundColor,buttonHeight:a.getBoundingClientRect().height,focusToken:(()=>{const p=document.createElement('div');p.style.outlineColor='var(--li-comp-button-focus-ring, transparent)';document.body.append(p);const tone=getComputedStyle(p).outlineColor;p.remove();return tone})()}})()");
 evidence.colors=s;
 checks(s.primary===rgb('#243A29')&&s.primaryText===rgb('#FAF9F5'),'primary computed paint mismatch');
 checks(s.secondary===rgb('#F1F0E9')&&s.secondaryText===rgb('#243A29'),'secondary paper computed paint mismatch');
 checks(s.surface===rgb('#FAF9F5')&&s.input===rgb('#FEFDFC'),'Surface/Input computed mismatch');
 checks(s.buttonHeight>=48,'button height below 48 CSS px');
 checks(s.focusToken===rgb('#78964D'),'resolved browser probe color mismatch for --li-comp-button-focus-ring: '+JSON.stringify(s.focusToken));
 for(const [width,height] of [[320,568],[390,844],[820,1060]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await sleep(150);
  const x=await evaluate("(()=>{const a=document.querySelector('[data-action=\"submit\"]');return {w:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,hit:a.getBoundingClientRect().height}})()");
  evidence.viewport.push({width,height,actual:x});checks(x.w===width&&x.scroll<=width+1&&x.body<=width+1,'horizontal overflow at '+width+': '+JSON.stringify(x));checks(x.hit>=48,'hit target below 48px at '+width);if(width===390||width===820)await screenshot('react-l09-'+width+'-synthetic');
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 let focus='';for(let i=0;i<16;i++){await key('Tab');focus=await evaluate("(()=>{const a=document.activeElement;return a?.getAttribute('data-action')||a?.getAttribute('data-locale')||a?.getAttribute('data-answer')||a?.tagName||''})()");evidence.keyboard.push(focus);if(focus==='submit')break}
 checks(focus==='submit','real CDP Tab never reached React submit: '+JSON.stringify(evidence.keyboard));
 const f=await evaluate("(()=>{const b=document.querySelector('[data-action=\"submit\"]'),c=getComputedStyle(b);return {visible:b.matches(':focus-visible'),color:c.outlineColor,style:c.outlineStyle,type:b.type,live:document.querySelector('[data-status]')?.getAttribute('aria-live')}})()");
 checks(f.visible&&f.style==='solid'&&f.color===rgb('#78964D'),'actual keyboard focus outline mismatch: '+JSON.stringify(f));checks(f.type==='button'&&f.live==='polite','button/status semantics changed');
 const before=await evaluate("(()=>{const k=document.querySelector('.pilot').dataset.storageKey;return {key:k,raw:localStorage.getItem(k)}})()");
 await key('Enter');await until(()=>evaluate("!!document.querySelector('[data-status]')?.textContent?.trim()"),'required-answer status');
 checks((await evaluate('localStorage.getItem('+JSON.stringify(before.key)+')'))===before.raw,'empty keyboard submission faked stored attempt');
 await key('Tab',8);checks((await evaluate("document.activeElement?.getAttribute('data-action')"))==='hint','Shift+Tab did not navigate to Hint');
 await key('Space');await until(()=>evaluate("(()=>{const k=document.querySelector('.pilot').dataset.storageKey;try{return JSON.parse(localStorage.getItem(k)||'{}').assisted===true}catch{return false}})()"),'Space hint handler');checks(await evaluate("!!document.querySelector('[data-hint]')"),'keyboard Space hint not shown');
 await key('Tab');checks((await evaluate("document.activeElement?.getAttribute('data-action')"))==='submit','Tab not returned to Submit');
 for(let i=0;i<4;i++){
  const sentence='Synthetic UX-DS-35 answer '+i+' with enough words for validation.';
  await evaluate("(()=>{const x=document.querySelector('[data-answer=\""+i+"\"]'),set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;set.call(x,"+JSON.stringify(sentence)+");x.dispatchEvent(new Event('input',{bubbles:true}));return true})()");
  await until(()=>evaluate("(()=>{try{const k=document.querySelector('.pilot').dataset.storageKey;return JSON.parse(localStorage.getItem(k)||'{}').draft?.["+i+"]?.startsWith('Synthetic UX-DS-35 answer')===true}catch{return false}})()"),'real React input writer '+i);
 }
 await key('Enter');await until(()=>evaluate("!!document.querySelector('[data-rubric]')"),'React keyboard submit and rubric');
 const done=await evaluate("(()=>{const k=document.querySelector('.pilot').dataset.storageKey,s=JSON.parse(localStorage.getItem(k)||'{}');return {submitted:s.submitted,locked:[...document.querySelectorAll('textarea[data-answer]')].every(a=>a.disabled),hasSubmit:!!document.querySelector('[data-action=\"submit\"]'),ratings:document.querySelectorAll('select[data-rating]').length,real:localStorage.getItem('li.review.L09-1-2.v1'),visits:localStorage.getItem('li.private.lesson.visits.v1'),role:document.querySelector('[data-status]')?.getAttribute('role')}})()");
 checks(done.submitted&&done.locked&&!done.hasSubmit&&done.ratings===4,'real React submit/disabled/rubric incorrect');checks(done.real===null&&done.visits===null,'real learner storage key touched');checks(done.role==='status','ARIA live status lost');
 evidence.checks=count;evidence.keyboardResult={cdpTabToSubmit:true,focusVisible:f.visible,computedFocus:f.color,invalidSubmitNoWrite:true,keyboardHint:true,validSubmitLocked:true};fs.writeFileSync(path.join(out,'source-qa-metrics.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log('PASS UX-DS-35 real Chromium L09 React keyboard and computed styles '+JSON.stringify({count,widths:evidence.viewport.map(x=>x.width),keyboard:evidence.keyboardResult,g2:'OPEN',physicalSafari:'UNVERIFIED',release:'NONE'}));
}
test().catch(e=>{console.error('FAIL UX-DS-35 Chromium: '+e.stack);if(stderr)console.error('Chromium stderr '+stderr.slice(-1200));process.exitCode=1}).finally(async()=>{try{socket?.close()}catch{}try{chrome?.kill('SIGKILL')}catch{}await sleep(450);try{await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200})}catch{}});
