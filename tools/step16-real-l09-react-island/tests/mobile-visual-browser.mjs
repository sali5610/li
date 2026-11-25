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
   await evalBool("window.__liEntryScroll=scrollY");
   const started=await evalBool("(()=>{document.querySelector('.li-catalog-field-card__action')?.click();return Boolean(document.querySelector('.li-catalog-field-shared-hero img'))})()");
   if(started!==true)throw Error('Explore must start a visible shared-image morph on mobile');
   await wait(()=>evalBool("(()=>{const h=document.querySelector('.catalog-field-hero');return Boolean(h&&document.querySelector('.li-catalog-field-shared-hero')&&getComputedStyle(h).visibility==='hidden')})()"),3000);
   await wait(()=>evalBool("(()=>{const h=document.querySelector('.catalog-field-hero');return Boolean(h&&new URLSearchParams(location.search).get('catalog')?.split('/').length===2&&!document.querySelector('.li-catalog-field-shared-hero')&&getComputedStyle(h).visibility!=='hidden')})()"),5000);
   console.log('PASS field card arch → detail hero shared-element transition at 390px, no stuck overlay');
   // First prove an in-app Back path launches the reverse morph while
   // React still owns the current field detail DOM.
   const crumbPressed=await evalBool("(()=>{const crumb=[...document.querySelectorAll('.catalog-breadcrumbs button')].find(b=>b.textContent?.includes('Nghệ thuật'));crumb?.click();return Boolean(crumb)})()");
   if(!crumbPressed)throw Error('Missing actual Group breadcrumb Back control');
   await wait(()=>evalBool("Boolean(document.querySelector('.li-catalog-field-shared-hero img'))"),5000);
   await wait(()=>evalBool("(()=>{const i=document.querySelector('.li-catalog-field-card__media img');return Boolean(i&&document.querySelector('.li-catalog-field-shared-hero')&&getComputedStyle(i).visibility==='hidden')})()"),3000);
   await wait(()=>evalBool("(()=>{const i=document.querySelector('.li-catalog-field-card__media img');return Boolean(i&&!document.querySelector('.li-catalog-field-shared-hero')&&getComputedStyle(i).visibility!=='hidden'&&Math.abs(scrollY-window.__liEntryScroll)<3)})()"),9000);
   console.log('PASS breadcrumb Back: full hero shrinks back into matching card arch');
   // Re-enter with Explore. Browser Back should reuse exactly the same
   // pre-navigation event and shared-element morph, not a separate UI hack.
   await evalBool("document.querySelector('.li-catalog-field-card__action')?.click()");
   await wait(()=>evalBool("Boolean(document.querySelector('.catalog-field-hero')&&!document.querySelector('.li-catalog-field-shared-hero'))"),9000);
   await evalBool("(()=>{window.__liBeforeBack=[];window.addEventListener('li:catalog-before-pathchange',e=>window.__liBeforeBack.push(e.detail));window.__liBeforeBackUrl=location.href;history.back();return true})()");
   try{
    await wait(()=>evalBool("Boolean(document.querySelector('.li-catalog-field-shared-hero img'))"),5000);
   }catch(error){
    const state=await evalBool("(()=>({url:location.href,previous:window.__liBeforeBackUrl,events:window.__liBeforeBack,hero:{exists:!!document.querySelector('.catalog-field-hero'),loaded:document.querySelector('.catalog-field-hero')?.naturalWidth},card:!!document.querySelector('.li-catalog-field-card'),path:window.liCatalog?.getPath()}))()");
    console.error('REVERSE_BACK_DIAGNOSTIC',JSON.stringify(state));
    throw error;
   }
   await wait(()=>evalBool("(()=>{const i=document.querySelector('.li-catalog-field-card__media img');return Boolean(i&&!document.querySelector('.li-catalog-field-shared-hero')&&getComputedStyle(i).visibility!=='hidden'&&new URLSearchParams(location.search).get('catalog')==='arts-humanities')})()"),9000);
   console.log('PASS browser Back: hero → original arched card, decoded and overlay removed');
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
 // Focused UI Lab reflow checks: only when the real Lab sources change.
 if(process.env.LI_UI_LAB_SMOKE==='1'){
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const pages=['home','catalog','search','research','case','capture','lesson','practice','feedback','guide','guideDetail','library','resume','collection','noteDetail','dashboard','settings','checkin','laoly','account'];
  const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true})).result?.value;
  const failures=[];
  for(const [width,view,locale,targets] of [
   [390,'390','vi',pages],
   [320,'fluid','en',['home','catalog','lesson','practice','collection','settings','laoly']],
   [820,'820','vi',['home','catalog','lesson','practice','collection','dashboard']],
   [1440,'1440','en',['home','lesson','catalog','noteDetail']]
  ]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600,screenWidth:width,screenHeight:900});
   for(const page of targets){
    const query=new URLSearchParams({layout:'scrapebook',mode:'focus',page,viewport:view,lang:locale});
    await send('Page.navigate',{url:'http://127.0.0.1:8766/design-system/ui-lab.html?'+query});
    await wait(()=>evaluate("(()=>{const p=document.querySelector('.li-ui-lab-preview[data-scrapebook=true]');return document.readyState!=='loading'&&Boolean(p&&p.querySelector("+JSON.stringify(page==='home'?'.li-ui-home':'.li-flow-page[data-page="'+page+'"]')+"))&&new URLSearchParams(location.search).get('page')==="+JSON.stringify(page)+"})()"),15000);
    await sleep(150);
    const report=await evaluate(`(()=>{
     const viewport=document.querySelector('.li-ui-lab-preview[data-scrapebook=true] .li-ui-lab-viewport');
     const root=viewport.querySelector('.li-flow-page,.li-ui-home');
     const cover=root.querySelector('.li-flow-page-head,.li-ui-home-intro');
     const main=root.querySelector('.li-flow-page-main');
     const columns=root.querySelector('.li-flow-page-columns');
     const ribbon=root.querySelector('.li-scrapebook-bookmark');
     const b=root.getBoundingClientRect(),h=cover.getBoundingClientRect();
     const mainRect=main?.getBoundingClientRect();
     const ribbonRect=ribbon?.getBoundingClientRect();
     return {viewport:viewport.clientWidth,scroll:viewport.scrollWidth,page:root.clientWidth,cover:h.width,
      coverAligned:Math.abs(b.left-h.left)<2&&Math.abs(b.right-h.right)<2,
      mainFits:!mainRect||(mainRect.left>=b.left-1&&mainRect.right<=b.right+1),
      gutter:columns?parseFloat(getComputedStyle(columns).paddingInlineStart):null,
      ribbon:root.querySelectorAll('.li-scrapebook-bookmark,.li-pop-lesson-bookmark').length,
      ribbonVisible:!!ribbonRect&&ribbonRect.left>=h.left-1&&ribbonRect.right<=h.right+1&&getComputedStyle(cover).overflow==='visible',
      coverPhoto:!!cover.querySelector('.li-pop-header-art,.li-pop-home-art'),
      overflowElements:[...root.querySelectorAll('button,input,textarea,select,.li-atom-heading,.li-atom-text')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<b.left-3||r.right>b.right+3)}).slice(0,6).map(e=>e.className)
     };
    })()`);
    console.log('SCRAPEBOOK_LAYOUT '+width+' '+page+' '+JSON.stringify(report));
    if(!report||report.scroll>report.viewport+2||!report.coverAligned||!report.mainFits||report.ribbon!==1||!report.ribbonVisible||report.coverPhoto||report.overflowElements.length||(width<=390&&report.gutter!==null&&Math.abs(report.gutter-16)>1)){
     failures.push({width,page,report});
    }
    if(width===390&&['home','lesson','practice','collection','settings'].includes(page)){
     await evaluate("document.querySelector('.li-ui-lab-preview[data-scrapebook=true]').scrollIntoView({block:'start',behavior:'instant'})");
     const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
     writeFileSync(resolve(out,'scrapebook-'+page+'.png'),Buffer.from(shot.data,'base64'));
    }
    if(width===390&&['home','lesson'].includes(page)){
     const before=await evaluate("document.querySelector('.li-scrapebook-bookmark').getAttribute('aria-pressed')");
     await evaluate("document.querySelector('.li-scrapebook-bookmark').click()");
     await wait(()=>evaluate("document.querySelector('.li-scrapebook-bookmark').getAttribute('aria-pressed')!=="+JSON.stringify(before)),3000);
     const stamp=await evaluate("Boolean(document.querySelector('.li-ui-lab-preview .li-pop-stamp-imprint'))");
     if(before==='false'&&!stamp)failures.push({page,interaction:'bookmark stamp missing'});
     await evaluate("document.querySelector('.li-scrapebook-bookmark').click()");
     if(page==='lesson'){
      await evaluate("document.querySelector('.li-bw-reader-note-toggle').click()");
      await wait(()=>evaluate("Boolean(document.querySelector('.li-scrapebook-example-paper .li-bw-reader-scrap-note'))"),3000);
      await evaluate("document.querySelector('.li-bw-reader-note-toggle').click()");
      await wait(()=>evaluate("!document.querySelector('.li-scrapebook-example-paper .li-bw-reader-scrap-note')"),3000);
     }
    }
   }
  }
  if(failures.length)throw Error('SCRAPEBOOK_REFLOW_FAILED '+JSON.stringify(failures));
  console.log('PASS Scrapebook all 20 screens at phone width and selected 320/820/1440 reflows, actual bookmark and note interactions');
 }
}finally{
 if(socket){for(const p of pending.values())clearTimeout(p.t);socket.close();}
 proc.kill('SIGTERM');
 try{rmSync(profile,{recursive:true,force:true});}catch{}
}
