#!/usr/bin/env node
'use strict';
// UX-DS-35 Stage02B: read-only, real native L09 versus opt-in React L09 geometry.
// Runs only in ephemeral three-source CI; logs differences, never changes DS values.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const [bin,origin]=process.argv.slice(2);
assert.ok(bin,'Chromium binary required');
assert.equal(origin,'http://127.0.0.1:8798','Disposable CI localhost source only');
assert.equal(process.env.CI,'true','Must run in CI');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'li-02b-l09geom-'));
const dir='/tmp/li-uxds35-stage02b/combined/real-l09-geometry';
fs.mkdirSync(dir,{recursive:true});
const sleep=t=>new Promise(r=>setTimeout(r,t));
const pending=new Map();
let proc,ws,seq=0,stderr='';
async function wait(fn,label,tries=260){
 for(let i=0;i<tries;i++){try{const v=await fn();if(v)return v;}catch{}await sleep(100)}
 throw Error('Timeout '+label+' chrome='+proc?.exitCode+' '+stderr.slice(-900));
}
function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},15000);
  pending.set(id,m=>{clearTimeout(t);if(m.error||m.result?.exceptionDetails)reject(Error(JSON.stringify(m.error||m.result.exceptionDetails)));else resolve(m.result)});
  ws.send(JSON.stringify({id,method,params}));
 });
}
async function js(s){
 const v=await send('Runtime.evaluate',{expression:s,returnByValue:true,awaitPromise:true});
 return v?.result?.value;
}
const nativeUrl=origin+'/site/index.html?lesson=L09-1-2';
const reactUrl=nativeUrl+'&li-react=l09';
const sharedUrl=origin+'/tools/step16-real-l09-react-island/dist/index.html?pilot=uxds35';
async function navigate(url,mode){
 await send('Page.navigate',{url});
 await wait(()=>js("document.readyState==='complete'&&!!document.querySelector('#page-lessonL09')"),'L09 authored route');
 const expression=mode==='native'?
  "(()=>{const e=document.querySelector('#l09-submit');return !!e&&e.getClientRects().length>0&&!document.querySelector('#li-step16-l09-react-host')})()":
  "(()=>{const d=document.querySelector('#page-lessonL09'),e=document.querySelector('#li-step16-l09-react-host .pilot [data-action=submit]');return d?.dataset.liRuntime==='react-candidate'&&!!e&&e.getClientRects().length>0})()";
 await wait(()=>js(expression),mode+' button owner',320);
}
async function navigateShared(){
 await send('Page.navigate',{url:sharedUrl});
 await wait(()=>js("document.readyState==='complete'&&!!document.querySelector('.li-ui-preview [data-ui-primary]')"),'shared React component fixture');
}
// Only browser-safe code is serialized to Runtime.evaluate.
function snapshot(mode){
 const mapping=mode==='native'?{
  primary:'#l09-submit',secondary:'#l09-clear',field:'#l09-guidedDraft',
  surface:'#l09-goals',group:'#l09-submit',status:'#l09-submissionStatus'
 }:mode==='shared'?{
  primary:'.li-ui-preview [data-ui-primary]',secondary:'.li-ui-preview [data-ui-secondary]',
  field:'.li-ui-preview [data-ui-field]',surface:'.li-ui-preview .li-ui-card:not(.li-ui-card-tinted):not(.li-ui-card-inverse)',
  group:'.li-ui-preview [data-ui-primary]',status:'.li-ui-preview [data-ui-feedback]'
 }:{
  primary:'#li-step16-l09-react-host .pilot [data-action=submit]',
  secondary:'#li-step16-l09-react-host .pilot [data-action=clear]',
  field:'#li-step16-l09-react-host .pilot [data-answer="0"]',
  surface:'#li-step16-l09-react-host .pilot-surface',
  group:'#li-step16-l09-react-host .pilot [data-action=submit]',
  status:'#li-step16-l09-react-host [data-status]'
 };
 const measured={};
 for(const [key,selector] of Object.entries(mapping)){
  let e=document.querySelector(selector);
  if(key==='group')e=e?.closest(mode==='native'?'.action-row':mode==='shared'?'.li-ui-action-group':'.pilot-actions');
  if(!e){measured[key]=null;continue}
  const s=getComputedStyle(e),r=e.getBoundingClientRect();
  measured[key]={selector,visible:r.width>0&&r.height>0&&!e.hidden,
   width:+r.width.toFixed(2),height:+r.height.toFixed(2),
   bg:s.backgroundColor,color:s.color,fontFamily:s.fontFamily,fontSize:s.fontSize,
   fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,
   padding:s.padding,gap:s.gap,border:s.border,borderColor:s.borderColor,
   borderRadius:s.borderRadius,boxShadow:s.boxShadow,minHeight:s.minHeight,
   flexWrap:s.flexWrap,display:s.display,disabled:!!e.disabled,
   left:+r.left.toFixed(2),right:+r.right.toFixed(2)};
 }
 return {mode,viewport:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
  shellRuntime:document.querySelector('#page-lessonL09')?.dataset.liRuntime||'native',
  nativeChallengeHidden:!!document.querySelector('#l09-challenge')?.hidden,
  learnerKey:localStorage.getItem('li.review.L09-1-2.v1'),
  components:measured};
}
function compare(a,b){
 const props=['bg','color','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','padding',
  'gap','border','borderColor','borderRadius','boxShadow','minHeight','height','display','flexWrap'];
 return ['primary','secondary','field','surface','group'].map(key=>{
  const native=a.components[key],react=b.components[key];
  assert.ok(native?.visible&&react?.visible,'Real L09 '+key+' missing/hidden');
  return {family:key,paintEqual:native.bg===react.bg,
   geometryDifferent:Object.fromEntries(props.filter(prop=>native[prop]!==react[prop]).map(prop=>
    [prop,{native:native[prop],react:react[prop]}])),
   status:'MEASURED_PENDING_G2',nativeSelector:native.selector,reactSelector:react.selector};
 });
}
async function main(){
 proc=spawn(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-background-networking','--no-first-run','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,nativeUrl],{stdio:['ignore','ignore','pipe']});
 proc.stderr.on('data',x=>{stderr=(stderr+String(x)).slice(-2500)});
 proc.on('error',e=>{stderr+=' SPAWN '+e.message});
 const port=await wait(()=>{const f=path.join(profile,'DevToolsActivePort');return fs.existsSync(f)?fs.readFileSync(f,'utf8').split('\n')[0]:null},'Chrome port',320);
 const tab=await wait(async()=>{const v=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();return v.find(t=>t.type==='page'&&t.webSocketDebuggerUrl)},'Chrome tab',320);
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
 await send('Runtime.enable');await send('Page.enable');
 let checks=0;const check=(v,msg)=>{assert.ok(v,msg);checks++};
 const samples=[];
 for(const [width,height] of [[320,568],[390,844],[820,1050],[1040,768]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await navigate(nativeUrl,'native');
  const a=await js('('+snapshot.toString()+')("native")');
  if(width===390){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'native-390.png'),Buffer.from(shot.data,'base64'))}
  await navigate(reactUrl,'react');
  const b=await js('('+snapshot.toString()+')("react")');
  if(width===390){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'react-390.png'),Buffer.from(shot.data,'base64'))}
  check(a.viewport===width&&b.viewport===width,'Wrong real-screen CSS viewport '+width);
  check(a.scrollWidth<=width+1&&b.scrollWidth<=width+1,'Real authored L09 horizontally overflows '+width+' '+JSON.stringify({native:a.scrollWidth,react:b.scrollWidth}));
  check(!a.nativeChallengeHidden&&b.nativeChallengeHidden,'Flag OFF native vs Flag ON React owner mismatch '+width);
  check(b.shellRuntime==='react-candidate','Real native site failed to mount React pilot '+width);
  check(a.learnerKey===b.learnerKey,'Genuine learner key changed '+width);
  const dimensions=compare(a,b);
  check(dimensions.filter(x=>x.family!=='group').every(x=>x.paintEqual),'Equivalent native↔legacy DS role paint changed '+width+' '+JSON.stringify(dimensions.map(x=>[x.family,x.paintEqual])));
  check(dimensions.every(x=>x.nativeSelector&&x.reactSelector),'Missing legacy source owner '+width);
  // The existing L09 React route uses legacy ActionButton/Surface/textarea.
  // Measure the 9-API Shared.tsx fixture INDEPENDENTLY to prevent false attribution.
  await navigateShared();
  const shared=await js('('+snapshot.toString()+')("shared")');
  if(width===390){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'shared-390.png'),Buffer.from(shot.data,'base64'))}
  const sharedComparison=compare(a,shared);
  check(shared.viewport===width&&shared.scrollWidth<=width+1,'Shared React preview overflow '+width+' '+shared.scrollWidth);
  check(shared.learnerKey===a.learnerKey,'Shared fixture touched genuine learner record '+width);
  check(sharedComparison.filter(x=>x.family!=='group').every(x=>x.paintEqual),'Shared UI background semantic role drift '+width);
  check(shared.components.primary.height>=48&&shared.components.secondary.height>=48&&shared.components.field.height>=48,'Shared UI intended 48px touch target failed '+width);
  check(sharedComparison.every(x=>x.reactSelector.startsWith('.li-ui-preview')),'Shared UI fixture provenance missing '+width);
  samples.push({width,height,native:a,react:b,dimensions,
    sharedPreview:shared,sharedComparison,geometryApproval:'OPEN'});
 }
 const findings=Object.fromEntries(['primary','secondary','field','surface','group'].map(key=>{
  const cases=samples.map(s=>s.dimensions.find(x=>x.family===key));
  return [key,{allWidthsSameRolePaint:cases.every(x=>x.paintEqual),
   geometryPropertiesNeedingReview:[...new Set(cases.flatMap(x=>Object.keys(x.geometryDifferent)))].sort(),
   measured390:cases[1].geometryDifferent}];
 }));
 const sharedFindings=Object.fromEntries(['primary','secondary','field','surface','group'].map(key=>{
  const entries=samples.map(s=>s.sharedComparison.find(x=>x.family===key));
  return [key,{allWidthsSameRolePaint:entries.every(x=>x.paintEqual),
   propertiesNeedingReview:[...new Set(entries.flatMap(x=>Object.keys(x.geometryDifferent)))].sort(),
   measured390:entries[1].geometryDifferent}];
 }));
 const ledger={scope:'THREE OWNERS: actual native L09, opt-in LEGACY React L09, and NEW Shared.tsx React preview',
  sourceUrl:'site/index.html?lesson=L09-1-2',reactFlag:'li-react=l09',
  sharedUrl:'tools/step16-real-l09-react-island/dist/index.html?pilot=uxds35',
  provenance:{native:'site/assets/li-layout.css .action/.surface',
   legacyReact:"tools/step16-real-l09-react-island/src/ui/Primitives.tsx (ActionButton/Surface/StatusMessage)",
   sharedReact:'tools/step16-real-l09-react-island/src/ui/Shared.tsx (Button/Card/TextInput)'},
  sourceHead:process.env.LI_STAGE02B_HEAD,
  chromiumChecks:checks,samples,findings,sharedFindings,
  assertion:'SAME_ROLE_PAINT_AND_OWNER_ONLY',pixelParity:'NOT_APPROVED',
  g2:'OPEN',realSafari:'NOT_RUN',release:'NONE',learnerWrite:'NONE'};
 fs.writeFileSync(path.join(dir,'computed-real-l09-ledger.json'),JSON.stringify(ledger,null,2)+'\n');
 console.log('PASS STAGE02B_REAL_SCREEN_GEOMETRY_MEASURED '+JSON.stringify({checks,
  viewports:samples.map(s=>s.width),families:Object.keys(findings),
  legacyDifferent:Object.fromEntries(Object.entries(findings).map(([k,v])=>[k,v.geometryPropertiesNeedingReview])),
  sharedDifferent:Object.fromEntries(Object.entries(sharedFindings).map(([k,v])=>[k,v.propertiesNeedingReview])),
  sourceOwner:'NATIVE_PLUS_LEGACY_REACT_L09_PLUS_SHARED_FIXTURE',pixelApproved:false,device:'CHROMIUM_ONLY',g2:'OPEN'}));
}
main().catch(e=>{fs.writeFileSync(path.join(dir,'failure.txt'),e.stack||String(e));console.error('FAIL STAGE02B_REAL_SCREEN_GEOMETRY '+e.stack);process.exitCode=1})
.finally(async()=>{try{ws?.close()}catch{}proc?.kill('SIGKILL');await sleep(150);await fs.promises.rm(profile,{force:true,recursive:true}).catch(()=>{})});
