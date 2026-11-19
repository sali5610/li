#!/usr/bin/env node
'use strict';
// Single research-only real-CDP browser; never touches production URLs/user storage.
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const [bin,url]=process.argv.slice(2);
if(!bin||!/^http:\/\/127\.0\.0\.1:(8795|8798)\/tools\/step16-real-l09-react-island\/dist\/index\.html\?pilot=uxds35$/.test(url||''))throw Error('Expected local research preview URL');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),profile=fs.mkdtempSync(path.join(os.tmpdir(),'li-02b-'));let proc,socket,seq=0,chromeStderr='';const pending=new Map();
const until=async(fn,why,tries=130)=>{for(let i=0;i<tries;i++){const v=await fn();if(v)return v;await sleep(125)}throw Error('Timeout '+why+'; Chrome exit='+proc?.exitCode+'; signal='+proc?.signalCode+'; stderr='+chromeStderr.slice(-1200))};
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},12000);pending.set(id,m=>{clearTimeout(t);m.error||m.result?.exceptionDetails?reject(Error(JSON.stringify(m.error||m.result.exceptionDetails))):resolve(m.result)});socket.send(JSON.stringify({id,method,params}))})}
const run=async js=>(await send('Runtime.evaluate',{expression:js,returnByValue:true,awaitPromise:true}))?.result?.value;
async function key(k,modifiers=0){const map={Tab:9,Enter:13,Escape:27};const code=map[k];await send('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:k,modifiers,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code,...(k==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:k,modifiers,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code})}
async function main(){
 proc=spawn(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,url],{stdio:['ignore','ignore','pipe']});
 proc.stderr.on('data',x=>{chromeStderr=(chromeStderr+String(x)).slice(-3000)});
 proc.on('error',e=>{chromeStderr=(chromeStderr+' SPAWN '+e.message).slice(-3000)});
 const port=await until(()=>{const f=path.join(profile,'DevToolsActivePort');return fs.existsSync(f)?fs.readFileSync(f,'utf8').split('\n')[0]:null},'port',320);
 const page=await until(async()=>{try{const j=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();return j.find(x=>x.type==='page'&&x.url.startsWith(url)&&x.webSocketDebuggerUrl)}catch{return null}},'tab');
 socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 socket.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id&&pending.has(m.id)){const f=pending.get(m.id);pending.delete(m.id);f(m)}});
 await send('Runtime.enable');await send('Page.enable');
 await until(()=>run("document.querySelector('[data-ui-preview]')?.getAttribute('data-ui-preview')"),'mounted React fixture');
 let n=0;const check=(condition,msg)=>{assert.ok(condition,msg);n++};
 const base=await run("(()=>({root:!!document.querySelector('.li-ui-preview'),primary:document.querySelector('[data-ui-primary]')?.type,loading:document.querySelector('[data-ui-loading]')?.disabled,readonly:document.querySelector('[data-ui-readonly]')?.readOnly,disabled:document.querySelector('[data-ui-disabled]')?.disabled,one:document.querySelectorAll('[aria-current=page]').length,store:localStorage.length}))()");
 check(base.root&&base.primary==='button'&&base.loading&&base.readonly&&base.disabled&&base.one===1,'semantic states/one nav owner');
 check(base.store===0,'fixture mutated local learner storage');
 await run("document.querySelector('[data-ui-primary]').click()");
 await until(()=>run("document.querySelector('[data-ui-field]')?.getAttribute('aria-invalid')==='true'"),'field error');
 const err=await run("(()=>{let e=document.querySelector('[data-ui-field]');return {described:e.getAttribute('aria-describedby'),linked:!!document.getElementById(e.getAttribute('aria-describedby')?.split(' ').at(-1)),role:document.querySelector('[data-ui-feedback]')?.getAttribute('role')}})()");
 check(err.linked&&err.role==='alert','error association/alert');
 await run("document.querySelector('[data-ui-locale=en]').click()");
 await until(()=>run("document.querySelector('.li-ui-preview')?.lang==='en'"),'locale EN');
 check(await run("document.querySelector('[data-ui-locale=en]')?.getAttribute('aria-pressed')==='true'"),'locale aria-pressed');
 await run("document.querySelector('.li-ui-nav-link[href=\"#library\"]').click()");
 await until(()=>run("document.querySelector('.li-ui-nav-link[href=\"#library\"]')?.getAttribute('aria-current')==='page'"),'navigation selected');
 check((await run("document.querySelectorAll('[aria-current=page]').length"))===1,'single nav aria-current');
 const detailed=await run("(()=>{const q=s=>document.querySelector(s),load=q('[data-ui-loading]'),ro=q('[data-ui-readonly]'),dis=q('[data-ui-disabled]'),loading=q('[data-ui-feedback-loading]'),success=q('[data-ui-feedback-success]'),inverse=q('[data-ui-card-inverse]');return {loadingBusy:load.getAttribute('aria-busy'),loadingDisabled:load.disabled,readonly:ro.readOnly,disabled:dis.disabled,loadingRole:loading.getAttribute('role'),loadingAriaBusy:loading.getAttribute('aria-busy'),successRole:success.getAttribute('role'),successLive:success.getAttribute('aria-live'),iconLabel:q('[data-ui-icon]').getAttribute('aria-label'),inversePaint:getComputedStyle(inverse).backgroundColor}})()");
 check(detailed.loadingBusy==='true'&&detailed.loadingDisabled&&detailed.readonly&&detailed.disabled,'Button loading vs readonly vs disabled semantics');
 check(detailed.loadingRole==='status'&&detailed.loadingAriaBusy==='true'&&detailed.successRole==='status'&&detailed.successLive==='polite','Feedback loading/success truthful live-region state');
 check(detailed.iconLabel==='More information'&&detailed.inversePaint==='rgb(36, 58, 41)','IconButton EN name/inverse Card token paint');
 await run("document.querySelector('[data-ui-disabled]').focus()");
 check(!(await run("document.activeElement?.matches('[data-ui-disabled]')")),'Disabled TextInput became focusable');
 await run("document.querySelector('[data-ui-readonly]').focus()");
 check(await run("document.activeElement?.matches('[data-ui-readonly]')"),'Read-only TextInput not keyboard focusable');
 const metrics=[];
 for(const [w,h] of [[320,568],[390,420],[820,1060],[1040,768]]){
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await sleep(120);
  const x=await run("(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,target:document.querySelector('[data-ui-icon]').getBoundingClientRect().height,background:getComputedStyle(document.querySelector('[data-ui-primary]')).backgroundColor,field:getComputedStyle(document.querySelector('[data-ui-field]')).backgroundColor}))()");
  metrics.push({w,h,...x});check(x.width===w&&x.scroll<=w+1&&x.body<=w+1&&x.target>=48,'overflow/hit at '+w+' '+JSON.stringify(x));
 }
 check(metrics[0].background==='rgb(36, 58, 41)'&&metrics[0].field==='rgb(254, 253, 252)','DS reference paint parity');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 check(await run("matchMedia('(prefers-reduced-motion: reduce)').matches"),'reduced motion media');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await run("document.querySelector('[data-ui-open]').focus()");await key('Enter');
 await until(()=>run("document.querySelector('dialog.li-ui-dialog')?.open"),'native showModal');
 const modal=await run("(()=>{const d=document.querySelector('dialog.li-ui-dialog');return {modal:d.matches(':modal'),focus:d.contains(document.activeElement)}})()");
 check(modal.modal&&modal.focus,'Dialog modal focus ownership');
 const dInfo=await run("(()=>{const d=document.querySelector('dialog.li-ui-dialog'),t=document.getElementById(d.getAttribute('aria-labelledby'));return {label:!!t&&t.tagName==='H2',link:!!d.querySelector('a[href]'),summary:!!d.querySelector('summary'),field:!!d.querySelector('input'),close:!!d.querySelector('[data-dialog-close]')}})()");
 check(Object.values(dInfo).every(Boolean),'Dialog accessible title / mixed tabstop content missing');
 await run("document.querySelector('[data-ui-primary]').focus()");
 check(await run("document.querySelector('dialog.li-ui-dialog').contains(document.activeElement)"),'Modal background accepted programmatic focus');
 await run("document.querySelector('dialog.li-ui-dialog input').focus()");
 await key('Tab');
 check(await run("document.activeElement?.matches('[data-dialog-close]')"),'React Dialog forward Tab did not wrap to Close');
 await run("document.querySelector('[data-dialog-close]').focus()");
 await key('Tab',8);
 check(await run("document.activeElement?.matches('dialog.li-ui-dialog input')"),'React Dialog Shift+Tab did not wrap to last input');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:420,deviceScaleFactor:1,mobile:false});
 const shortModal=await run("(()=>{const d=document.querySelector('dialog.li-ui-dialog'),r=d.getBoundingClientRect();return {viewport:innerHeight,dialogHeight:r.height,dialogWidth:r.width,x:r.left,right:r.right,scroll:document.documentElement.scrollWidth,bodyScroll:document.body.scrollWidth}})()");
 check(shortModal.dialogHeight<=shortModal.viewport+1&&shortModal.x>=-1&&shortModal.right<=390+1,'Dialog outside short-landscape viewport: '+JSON.stringify(shortModal));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 check(await run("document.querySelector('[data-dialog-close]')?.getAttribute('aria-label')==='Close'"),'Dialog EN close accessible name');
 await key('Escape');await until(()=>run("!document.querySelector('dialog.li-ui-dialog')?.open"),'Escape close');
 check(await run("document.activeElement?.matches('[data-ui-open]')"),'Dialog opener focus restoration');
 await run("document.querySelector('[data-ui-open]').focus()");await key('Enter');
 await until(()=>run("document.querySelector('dialog.li-ui-dialog')?.open"),'Dialog reopen Close');
 await run("document.querySelector('[data-dialog-close]').focus()");await key('Enter');
 await until(()=>run("!document.querySelector('dialog.li-ui-dialog')?.open"),'Dialog Close button');
 check(await run("document.activeElement?.matches('[data-ui-open]')"),'Dialog button Close did not restore opener');
 await run("document.querySelector('[data-ui-locale=vi]').click()");
 await until(()=>run("document.querySelector('.li-ui-preview')?.lang==='vi'"),'Dialog locale VI');
 await run("document.querySelector('[data-ui-open]').focus()");await key('Enter');
 await until(()=>run("document.querySelector('dialog.li-ui-dialog')?.open"),'Dialog VI reopen');
 check(await run("document.querySelector('[data-dialog-close]')?.getAttribute('aria-label')==='Đóng'"),'Dialog VI localized Close label drift');
 await run("document.querySelector('dialog.li-ui-dialog').click()");
 await until(()=>run("!document.querySelector('dialog.li-ui-dialog')?.open"),'Dialog synthetic backdrop callback');
 check(await run("document.activeElement?.matches('[data-ui-open]')"),'Dialog backdrop callback failed opener focus restore');
 check((await run("localStorage.length"))===0,'no learner storage mutations');
 const evidenceDir=process.env.LI_UXDS35_EVIDENCE_DIR||'/tmp/li-uxds35-stage02b';
 fs.mkdirSync(evidenceDir,{recursive:true});
 fs.writeFileSync(path.join(evidenceDir,'metrics.json'),JSON.stringify({n,source:'stage02b React fixture CDP',metrics,g2:'OPEN',device:'CHROMIUM_ONLY'},null,2));
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(evidenceDir,'preview.png'),Buffer.from(shot.data,'base64'));
 const nativeUrl=process.env.LI_UXDS35_NATIVE_URL;
 if(nativeUrl){
  assert.match(nativeUrl,/^http:\/\/127\.0\.0\.1:(8795|8798)\/(uxds35-design-pin\/)?site\/component-library-review\.html$/);
  const aliases=['--li-comp-button-primary-background','--li-comp-button-secondary-background',
    '--li-comp-field-background','--li-comp-surface-background',
    '--li-comp-button-focus-ring','--li-comp-app-nav-active-background',
    '--li-comp-status-banner-background'];
  const reactParity=await run("(()=>{const roleNames="+JSON.stringify(aliases)+",root=getComputedStyle(document.documentElement),primary=getComputedStyle(document.querySelector('[data-ui-primary]')),secondary=getComputedStyle(document.querySelector('[data-ui-secondary]')),field=getComputedStyle(document.querySelector('[data-ui-field]'));return {roles:Object.fromEntries(roleNames.map(n=>[n,root.getPropertyValue(n).trim()])),paint:{primary:primary.backgroundColor,secondary:secondary.backgroundColor,field:field.backgroundColor}}})()");
  check(Object.values(reactParity.roles).every(x=>!!x),'React mounted page missing pinned DS component role definitions (would hide fallback-only usage)');
  await send('Page.navigate',{url:nativeUrl});
  await until(()=>run("document.readyState==='complete'&&!!document.querySelector('#ds-query')"),'real DS review native source page');
  const nativeParity=await run("(()=>{const roleNames="+JSON.stringify(aliases)+",root=getComputedStyle(document.documentElement),primary=getComputedStyle(document.querySelector('.ds-button')),secondary=getComputedStyle(document.querySelector('.ds-button.secondary')),field=getComputedStyle(document.querySelector('#ds-query'));return {roles:Object.fromEntries(roleNames.map(n=>[n,root.getPropertyValue(n).trim()])),paint:{primary:primary.backgroundColor,secondary:secondary.backgroundColor,field:field.backgroundColor}}})()");
  const computedGeometry=await run("(()=>{const specs=[['button','.ds-button'],['field','#ds-query'],['nav','.ds-navsample button']];return Object.fromEntries(specs.map(([k,sel])=>{const e=document.querySelector(sel);if(!e)return [k,null];const s=getComputedStyle(e),r=e.getBoundingClientRect();return [k,{height:r.height,width:r.width,minHeight:s.minHeight,borderRadius:s.borderRadius,fontSize:s.fontSize,fontFamily:s.fontFamily,border:s.border,boxShadow:s.boxShadow,padding:s.padding}] }))})()");

  check(aliases.every(n=>reactParity.roles[n]?.toLowerCase()===nativeParity.roles[n]?.toLowerCase()),'React↔native DS computed semantic alias drift: '+JSON.stringify({react:reactParity.roles,native:nativeParity.roles}));
  check(reactParity.paint.primary===nativeParity.paint.primary,'React primary Button differs from native review specimen: '+JSON.stringify({react:reactParity.paint,native:nativeParity.paint}));
  const comparison={source:'native DS #134 component-review specimen vs React #148 mounted fixture; NOT full application per-screen parity',
    react:reactParity,native:nativeParity,roleValuesIdentical:true,buttonPrimaryPaintIdentical:true,
    secondaryReviewSpecimenPaintIdentical:reactParity.paint.secondary===nativeParity.paint.secondary,
    fieldReviewSpecimenPaintIdentical:reactParity.paint.field===nativeParity.paint.field,
    nativeReviewGeometry:computedGeometry,reactGeometry:'SEMANTIC_CSS_ONLY_NO_PIXEL_CERTIFICATION',
    note:'A review specimen is not the app native .action/.field owner; paint differences are recorded, not silently treated as bugs or approved variants'};
  fs.writeFileSync(path.join(evidenceDir,'react-vs-native-review-computed.json'),JSON.stringify(comparison,null,2));
  const nativeShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(evidenceDir,'native-review.png'),Buffer.from(nativeShot.data,'base64'));
  fs.writeFileSync(path.join(evidenceDir,'metrics.json'),JSON.stringify({n,source:'stage02b pinned React+DS CI Chromium',metrics,comparison,g2:'OPEN',device:'CHROMIUM_ONLY'},null,2));
 }
 console.log('PASS UXDS35_STAGE02B_REAL_CHROMIUM '+JSON.stringify({checks:n,viewport:metrics.map(x=>x.w),privacy:'NO_WRITES',g2:'OPEN'}));
}
main().catch(e=>{console.error('FAIL UXDS35_STAGE02B '+e.stack);process.exitCode=1}).finally(async()=>{try{socket?.close()}catch{}proc?.kill('SIGKILL');await sleep(200);await fs.promises.rm(profile,{recursive:true,force:true}).catch(()=>{})});
