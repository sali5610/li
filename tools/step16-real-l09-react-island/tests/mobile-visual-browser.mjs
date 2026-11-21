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
 for(const view of ['journal','guide','library','resume','bookmarks','buddy','breadcrumbPrivate','breadcrumb','lesson',
  'settings','catalogRoot','catalogGroup','searchEnglish']){
  const params=new URLSearchParams({view});
  if(view==='catalogGroup')params.set('catalog','arts-humanities');
  await send('Page.navigate',{url:target+'?'+params});
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
  if(view==='catalogGroup'){
   // Real interaction contract: Explore morphs the SAME arched card art into
   // its horizontal field hero and releases the overlay after animation.
   const evalBool=async expression=>(await send('Runtime.evaluate',{
    expression,returnByValue:true
   })).result?.value;
   await evalBool("document.querySelector('.li-catalog-field-card')?.scrollIntoView({block:'center',behavior:'instant'})");
   await wait(()=>evalBool("(()=>{const i=document.querySelector('.li-catalog-field-card__media img');return Boolean(i?.complete&&i.naturalWidth>0)})()"),15000);
   const started=await evalBool("(()=>{document.querySelector('.li-catalog-field-card__action')?.click();return Boolean(document.querySelector('.li-catalog-field-shared-hero img'))})()");
   if(started!==true)throw Error('Explore must start a visible shared-image morph on mobile');
   await wait(()=>evalBool("(()=>{const h=document.querySelector('.catalog-field-hero');return Boolean(h&&new URLSearchParams(location.search).get('catalog')?.split('/').length===2&&!document.querySelector('.li-catalog-field-shared-hero')&&getComputedStyle(h).visibility!=='hidden')})()"),5000);
   console.log('PASS field card arch → detail hero shared-element transition at 390px, no stuck overlay');
  }
  if(view==='searchEnglish'){
   const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true})).result?.value;
   await evaluate("window.liLanguage.set('en')");
   await wait(()=>evaluate("Boolean(document.querySelector('.header [aria-label=\"Search the library\"]'))"));
   const point=await evaluate("(()=>{const b=document.querySelector('.header [aria-label=\"Search the library\"]').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()");
   await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
   await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await wait(()=>evaluate("document.activeElement?.id==='li-knowledge-search-input' && document.querySelector('#page-search.active h1')?.textContent==='Search'"));
   await send('Input.insertText',{text:'Sociology'});
   await wait(()=>evaluate("Array.from(document.querySelectorAll('#page-search .li-search-result h3, #page-search .li-search-result button, #page-search .li-search-result strong')).some(n=>n.textContent?.trim()==='Sociology')"));
   await evaluate("document.querySelector('#page-search [aria-label=\"Clear search\"]').click()");
   await wait(()=>evaluate("document.querySelector('#li-knowledge-search-input')?.value===''"));
   await evaluate("document.querySelector('#li-knowledge-search-input').focus()");
   await send('Input.insertText',{text:'L09-1-2'});
   await wait(()=>evaluate("document.querySelector('#page-search .li-search-evidence')?.textContent.includes('Leading wording affects measurement')"));
   await evaluate("document.querySelector('#page-search .li-search-evidence summary').click()");
   await wait(()=>evaluate("document.querySelector('#page-search .li-search-evidence')?.open"));
   console.log('PASS English Search after locale switch: tap, focus, catalog match, clear and English knowledge connections');
  }
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
 console.log('PASS 13 REAL CSS MOBILE VIEWPORT SCREENS + NATIVE OPEN SHEET 390x844');
}finally{
 if(socket){for(const p of pending.values())clearTimeout(p.t);socket.close();}
 proc.kill('SIGTERM');
 try{rmSync(profile,{recursive:true,force:true});}catch{}
}
