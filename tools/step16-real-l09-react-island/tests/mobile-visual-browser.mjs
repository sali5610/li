// Isolated visual QA only. Chrome DevTools Protocol forces a true mobile
// CSS viewport; --window-size=390 alone silently becomes 500 CSS pixels on Linux.
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,mkdirSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const profile=resolve('/tmp','li-mobile-visual-'+process.pid);
const target='http://127.0.0.1:8766/mobile-visual.html';
const out=resolve('.qa-iphone-screens');
mkdirSync(out,{recursive:true});
const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--no-first-run','--no-default-browser-check','--remote-allow-origins=*',
 '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9222','--user-data-dir='+profile,'about:blank'],
 {stdio:['ignore','ignore','pipe']});
let chromeError='';
proc.stderr.on('data',b=>{chromeError+=String(b).slice(-2000);});
const wait=async (fn,timeout=40000)=>{
 const until=Date.now()+timeout;
 while(Date.now()<until){try{const result=await fn();if(result)return result;}catch{}await sleep(150);}
 throw Error('Timeout: '+chromeError.slice(-1200));
};
let socket,serial=0;
const pending=new Map();
const send=(method,params={})=>new Promise((res,rej)=>{
 const id=++serial;
 const t=setTimeout(()=>{pending.delete(id);rej(Error('CDP timeout '+method));},12000);
 pending.set(id,{res,rej,t});
 socket.send(JSON.stringify({id,method,params}));
});
try{
 const tabs=await wait(async ()=>{
  const r=await fetch('http://127.0.0.1:9222/json/list');
  const arr=await r.json();
  return arr.find(t=>t.type==='page'&&t.webSocketDebuggerUrl);
 });
 socket=new WebSocket(tabs.webSocketDebuggerUrl);
 await new Promise((res,rej)=>{
  socket.addEventListener('open',res,{once:true});
  socket.addEventListener('error',rej,{once:true});
 });
 socket.addEventListener('message',evt=>{
  const m=JSON.parse(String(evt.data));
  if(!m.id)return;
  const task=pending.get(m.id);if(!task)return;
  clearTimeout(task.t);pending.delete(m.id);
  m.error?task.rej(Error(JSON.stringify(m.error))):task.res(m.result||{});
 });
 await send('Page.enable');
 await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{
  width:390,height:844,deviceScaleFactor:1,mobile:true,
  screenWidth:390,screenHeight:844
 });
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 for(const view of ['journal','guide','library','buddy','breadcrumb','lesson']){
  await send('Page.navigate',{url:target+'?view='+view});
  const report=await wait(async()=>{
   const result=await send('Runtime.evaluate',{
    expression:"document.querySelector('#qa-report')?.textContent || ''",
    returnByValue:true
   });
   const raw=result.result?.value||'';
   return raw.startsWith('{')?JSON.parse(raw):null;
  },15000);
  console.log('REAL_MOBILE_VIEWPORT '+view+' '+report.viewport);
  console.log(JSON.stringify(report));
  // Keep screenshots even when a viewport check fails: debug the pixels,
  // not just a green/red status.
  const result=await send('Page.captureScreenshot',{
   format:'png',captureBeyondViewport:false,fromSurface:true
  });
  const file=resolve(out,view+'.png');
  writeFileSync(file,Buffer.from(result.data,'base64'));
  if(!existsSync(file))throw Error('Missing screenshot '+file);
  console.log('SCREENSHOT '+file);
  if(view==='breadcrumb'){
   const opened=await send('Runtime.evaluate',{
    expression:"(()=>{const menu=document.querySelector('.li-ds-breadcrumb-overflow .li-ds-action-menu');menu?.querySelector('summary')?.click();const box=menu?.querySelector('ul')?.getBoundingClientRect();return Boolean(menu?.open&&box&&box.width>100&&box.left>=0&&box.right<=innerWidth)})()",
    returnByValue:true
   });
   if(opened.result?.value!==true)throw Error('Breadcrumb ellipsis dropdown is not visible inside mobile viewport');
   const shot=await send('Page.captureScreenshot',{
    format:'png',captureBeyondViewport:false,fromSurface:true
   });
   const menuFile=resolve(out,'breadcrumb-ellipsis-open.png');
   writeFileSync(menuFile,Buffer.from(shot.data,'base64'));
   console.log('SCREENSHOT '+menuFile);
  }
  if(view==='lesson'){
   const opened=await send('Runtime.evaluate',{
    expression:"(()=>{const b=document.querySelector('body > .catalog-chapter-fab[data-lesson-owner=\\\"page-lessonL09\\\"]');b?.click();return document.querySelector('body > .catalog-sheet-layer[data-lesson-owner=\\\"page-lessonL09\\\"]')?.hidden===false})()",
    returnByValue:true
   });
   if(opened.result?.value!==true)throw Error('Lesson left side sheet failed screenshot-open interaction');
   const overlay=await send('Page.captureScreenshot',{
    format:'png',captureBeyondViewport:false,fromSurface:true
   });
   writeFileSync(resolve(out,'lesson-sheet-open.png'),Buffer.from(overlay.data,'base64'));
   console.log('SCREENSHOT '+resolve(out,'lesson-sheet-open.png'));
  }
  if(report.viewport!==390 || report.status!=='LI_VISUAL_QA_PASS'){
   throw Error('VISUAL_QA_FAILED '+view+' '+JSON.stringify(report));
  }
 }
 console.log('PASS 6 REAL CSS MOBILE VIEWPORT SCREENS + NATIVE OPEN SHEET 390x844');
}finally{
 if(socket){for(const p of pending.values())clearTimeout(p.t);socket.close();}
 proc.kill('SIGTERM');
 try{rmSync(profile,{recursive:true,force:true});}catch{}
}
