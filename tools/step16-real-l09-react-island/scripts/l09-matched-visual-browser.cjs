#!/usr/bin/env node
'use strict';
/**
 * UX-DS-35: compare matched authored L09 content/state between legacy React
 * and opt-in Shared D1/D2/D3 on the SAME synthetic browser session.
 * Screenshots and measured CSS differences are review evidence, NOT pixel parity
 * approval, actual iPhone Safari QA, private data, or a production release.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createHash}=require('node:crypto');
const {spawn}=require('node:child_process');
const [bin,origin]=process.argv.slice(2);
assert.ok(bin,'Requires Chromium binary');
assert.equal(origin,'http://127.0.0.1:8798','Run only against local combined-tree QA server');
assert.equal(process.env.CI,'true','Research comparison belongs to CI, not production');
const output='/tmp/li-uxds35-stage02b/combined/l09-matched-visual';
fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'li-l09-matched-'));
const legacy=origin+'/site/index.html?lesson=L09-1-2&li-react=l09';
const shared=legacy+'&li-vc-g2=1';
let chrome,socket,seq=0,stderr='',passed=0;
const pending=new Map();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const verify=(v,label)=>{assert.ok(v,label);passed++};
async function until(fn,label,tries=250){
 for(let i=0;i<tries;i++){try{const result=await fn();if(result)return result;}catch{}await delay(100)}
 throw Error('TIMEOUT '+label+' chrome='+chrome?.exitCode+' '+stderr.slice(-1700));
}
async function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++seq,timeout=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},16000);
  pending.set(id,o=>{clearTimeout(timeout);if(o.error||o.result?.exceptionDetails)reject(Error(JSON.stringify(o.error||o.result?.exceptionDetails)));else resolve(o.result)});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evaluate(js){
 const r=await send('Runtime.evaluate',{expression:js,returnByValue:true,awaitPromise:true});
 return r?.result?.value;
}
async function go(url,label,approval){
 await send('Page.navigate',{url});
 await until(()=>evaluate("document.readyState==='complete'&&location.href==="+JSON.stringify(url)+
   "&&!!document.querySelector('#page-lessonL09')"),'real URL '+label);
 await until(()=>evaluate("(()=>{const p=document.querySelector('#li-step16-l09-react-host .pilot');return !!p&&"+
  "p.getClientRects().length>0&&document.querySelector('#page-lessonL09')?.dataset.liRuntime==='react-candidate'&&"+
  "(!!p.querySelector('[data-action=submit]')||!!p.querySelector('[data-rubric]'))&&"+
  "(p.dataset.vcG2==='approved-research')==="+approval+"})()"),'correct React owner '+label);
}
function capture(){
 const root=document.querySelector('#li-step16-l09-react-host .pilot');
 const css=el=>{
  if(!el)return null;
  const rect=el.getBoundingClientRect(),s=getComputedStyle(el);
  return {width:rect.width,height:rect.height,fontSize:s.fontSize,lineHeight:s.lineHeight,
   fontWeight:s.fontWeight,padding:s.padding,bg:s.backgroundColor,border:s.border,
   radius:s.borderRadius,shadow:s.boxShadow,minHeight:s.minHeight,disabled:!!el.disabled,
   clipped:el.scrollWidth>el.clientWidth+1};
 };
 const answers=[...root.querySelectorAll('textarea[data-answer]')];
 const buttons={submit:root.querySelector('[data-action=submit]'),clear:root.querySelector('[data-action=clear]')};
 return {
  viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,lessonId:root.dataset.lessonId,
  lang:root.lang,approval:root.dataset.vcG2||null,privateKey:localStorage.getItem('li.review.L09-1-2.v1'),
  syntheticKey:localStorage.getItem('step16.l09.react-island.v1'),
  content:{
   title:root.querySelector('h1')?.textContent?.trim()||null,
   challenge:root.querySelector('#challenge-title')?.textContent?.trim()||null,
   caseText:root.querySelector('[data-case-text]')?.textContent?.trim()||null,
   caseClaim:root.querySelector('[data-case-claim]')?.textContent?.trim()||null,
   rubricTitle:root.querySelector('#rubric-title')?.textContent?.trim()||null,
   rubricRows:[...root.querySelectorAll('.pilot-rubric-row')].map(el=>el.textContent.trim()),
   questionLabels:answers.map(el=>el.labels?.[0]?.textContent?.trim()||null),
   answerValues:answers.map(el=>el.value),
   hint:root.querySelector('[data-hint]')?.textContent?.trim()||null,
   submission:root.querySelector('[data-submission]')?.textContent?.trim()||null,
   status:root.querySelector('[data-status]')?.textContent?.trim()||null,
   score:root.querySelector('[data-score]')?.textContent?.trim()||null,
   rubricUnlocked:!!root.querySelector('[data-rubric]'),
   submitted:!!root.querySelector('[data-submission]')
  },
  buttons:{submit:css(buttons.submit),clear:css(buttons.clear)},
  cards:[...root.querySelectorAll('section.pilot-surface')].map(css),
  fields:answers.map(css),
  answerDisabled:answers.map(el=>el.disabled),
  sharedOwner:!!root.querySelector('.li-ui-button')&&!!root.querySelector('.li-ui-card'),
  legacyOwner:!!root.querySelector('.pilot-action'),
  answersHaveLabels:answers.map(el=>el.labels?.length||0)
 };
}
async function snapshot(){return evaluate('('+capture.toString()+')()')}
function digest(content){return createHash('sha256').update(JSON.stringify(content)).digest('hex')}
const styleKeys=['width','height','fontSize','lineHeight','fontWeight','padding','bg','border','radius','shadow','minHeight'];
function delta(a,b){
 if(!a||!b)return {unavailable:true};
 return Object.fromEntries(styleKeys.filter(k=>a[k]!==b[k]).map(k=>[k,{legacy:a[k],shared:b[k]}]));
}
function cssLedger(a,b){
 return {interpretation:'OBSERVED_STYLE_DELTAS_NOT_AUTOMATIC_VISUAL_SIGNOFF',
  D1_primary:delta(a.buttons.submit,b.buttons.submit),
  D1_secondary:delta(a.buttons.clear,b.buttons.clear),
  D2_cards:a.cards.map((x,i)=>delta(x,b.cards[i])),
  D3_answers:a.fields.map((x,i)=>delta(x,b.fields[i]))};
}
async function screenshot(name){
 const metrics=await send('Page.getLayoutMetrics');
 const size=metrics.cssContentSize||metrics.contentSize;
 assert.ok(size?.width>0&&size?.height>0&&size.height<16000,'Full page screenshot bounds');
 const data=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,
   clip:{x:0,y:0,width:size.width,height:size.height,scale:1}});
 fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(data.data,'base64'));
}
function sourceMatched(a,b,label){
 verify(digest(a.content)===digest(b.content),'Content/state fingerprint mismatch '+label);
 verify(a.lessonId==='L09-1-2'&&b.lessonId==='L09-1-2'&&a.lang===b.lang,
   'Wrong lesson or locale '+label);
 verify(!a.privateKey&&!b.privateKey&&a.syntheticKey===b.syntheticKey,
   'Real learner key or research storage changed '+label);
 verify(a.pageWidth<=a.viewport+1&&b.pageWidth<=b.viewport+1,
   'Horizontal document overflow '+label);
}
function makeSheet(pairs){
 const items=pairs.map(item=>'<section><h2>'+item.state+' / '+item.width+'px</h2>'+
  '<div class="pair"><figure><figcaption>Legacy React</figcaption><img src="'+item.legacy+
  '" alt="Legacy L09 '+item.state+' at '+item.width+'px"></figure>'+
  '<figure><figcaption>Shared D1-D3 opt-in</figcaption><img src="'+item.shared+
  '" alt="Shared L09 '+item.state+' at '+item.width+'px"></figure></div></section>').join('');
 return '<!doctype html><html lang="en"><meta charset="utf-8"><title>li. L09 visual comparison</title>'+
  '<style>body{margin:24px;font:16px/1.5 system-ui}h1,h2{font-family:Georgia,serif}'+
  '.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}'+
  'figure{margin:0;min-width:0}img{display:block;width:100%;height:auto;border:1px solid #aaa}'+
  'figcaption{font-weight:700;margin:8px 0}section{margin:40px 0}'+
  '@media(max-width:760px){.pair{grid-template-columns:1fr}}</style>'+
  '<body><h1>li. L09 — matched source, state and viewport</h1>'+
  '<p>Chromium / synthetic local research only. D1–D3 scoped approval; global G2, Safari, pixel equality and release NOT APPROVED. See companion JSON for measured style deltas.</p>'+
  items+'</body></html>';
}
async function main(){
 chrome=spawn(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-background-networking','--no-first-run','--remote-debugging-port=0',
 '--remote-allow-origins=*','--user-data-dir='+profile,legacy],{stdio:['ignore','ignore','pipe']});
 chrome.stderr.on('data',d=>{stderr=(stderr+String(d)).slice(-5000)});
 chrome.on('error',e=>{stderr+=' SPAWN '+e.message});
 const port=await until(()=>{const p=path.join(profile,'DevToolsActivePort');
  return fs.existsSync(p)?fs.readFileSync(p,'utf8').split('\n')[0]:null},'Chromium debugger');
 const tab=await until(async()=>{const r=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  return r.find(x=>x.type==='page'&&x.webSocketDebuggerUrl)},'Chromium tab');
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 socket.addEventListener('message',event=>{const o=JSON.parse(String(event.data));
  if(o.id&&pending.has(o.id)){const cb=pending.get(o.id);pending.delete(o.id);cb(o)}});
 await send('Runtime.enable');await send('Page.enable');
 const viewports=[
  {width:320,height:568},{width:375,height:812},{width:390,height:844},
  {width:402,height:874},{width:600,height:900},{width:820,height:1050},
  {width:1040,height:768},{width:1440,height:900}
 ];
 const pictureWidths=new Set([390,820,1040,1440]),pairs=[],matched=[];
 for(const v of viewports){
  await send('Emulation.setDeviceMetricsOverride',{...v,deviceScaleFactor:1,mobile:false});
  await go(legacy,'empty legacy '+v.width,false);const a=await snapshot();
  if(pictureWidths.has(v.width))await screenshot('empty-legacy-'+v.width);
  await go(shared,'empty Shared '+v.width,true);const b=await snapshot();
  if(pictureWidths.has(v.width)){
   await screenshot('empty-shared-'+v.width);
   pairs.push({width:v.width,state:'empty',legacy:'empty-legacy-'+v.width+'.png',
    shared:'empty-shared-'+v.width+'.png'});
  }
  sourceMatched(a,b,'empty '+v.width);
  verify(a.content.answerValues.length===4&&a.content.answerValues.every(x=>x==='')&&
   b.content.answerValues.length===4&&b.content.answerValues.every(x=>x===''),
   'Both owners must start with four blank answers '+v.width);
  verify(a.legacyOwner&&!a.sharedOwner&&b.sharedOwner&&!b.legacyOwner,
   'Wrong component provenance '+v.width);
  verify(b.answersHaveLabels.every(n=>n===1)&&a.answersHaveLabels.every(n=>n===1),
   'Orphaned answer label '+v.width);
  matched.push({viewport:v.width,state:'empty',contentSha256:digest(a.content),
   identicalContent:true,css:cssLedger(a,b)});
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await go(shared,'prepare synthetic submit',true);
 // Step16.2: resume must land on the first answer, without synthetic state mutation.
 verify(await evaluate("document.querySelector('.pilot-resume')?.dataset.resumeStage==='empty'"),
  'Empty React lesson must advertise start, not a fabricated saved attempt');
 await evaluate("document.querySelector('[data-action=resume]').click()");
 verify(await evaluate("document.activeElement?.matches('textarea[data-answer=\"0\"]')"),
  'Resume on empty L09 must focus the first answer');
 for(let i=0;i<4;i++){
  const val='Synthetic matched review answer '+i+' with sufficient description';
  await evaluate("(()=>{const e=document.querySelector('[data-answer=\""+i+"\"]');"+
   "const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;"+
   "set.call(e,"+JSON.stringify(val)+");e.dispatchEvent(new Event('input',{bubbles:true}));return true})()");
  await until(()=>evaluate("JSON.parse(localStorage.getItem('step16.l09.react-island.v1')||'null')?.draft?.["+
   i+"]?.startsWith('Synthetic matched review answer')"),'synthetic draft '+i);
 }
 verify(await evaluate("(()=>{const p=document.querySelector('.pilot');return p?.querySelector('.pilot-resume')?.dataset.resumeStage==='draft'&&p?.querySelector('[data-resume-status]')?.textContent.includes('Đã lưu trên thiết bị')})()"),
  'Draft progress must be derived from confirmed device write, not mere click');
 await evaluate("document.querySelector('[data-action=resume]').click()");
 verify(await evaluate("document.activeElement?.matches('[data-action=submit]')"),
  'Completed four-answer draft resumes at Submit');
 await evaluate("document.querySelector('[data-action=hint]').click()");
 await until(()=>evaluate("!!document.querySelector('[data-hint]')"),'synthetic hint');
 await evaluate("document.querySelector('[data-locale=en]').click()");
 await until(()=>evaluate("document.querySelector('.pilot')?.lang==='en'"),'EN');
 await evaluate("document.querySelector('[data-locale=vi]').click()");
 await until(()=>evaluate("document.querySelector('.pilot')?.lang==='vi'"),'VI');
 await evaluate("document.querySelector('[data-action=submit]').click()");
 await until(()=>evaluate("!!document.querySelector('[data-rubric]')"),'synthetic rubric unlock');
 await go(shared,'submitted Shared fresh',true);const x=await snapshot();
 verify(await evaluate("document.querySelector('.pilot-resume')?.dataset.resumeStage==='submitted'"),
  'Reloaded submitted attempt must point to self-review, not restart');
 await evaluate("document.querySelector('[data-action=resume]').click()");
 verify(await evaluate("document.activeElement?.matches('[data-rating=\"0\"]')"),
  'Submitted L09 resumes on first unset rubric rating');
 await screenshot('submitted-shared-390');
 await go(legacy,'submitted legacy fresh',false);const y=await snapshot();
 await screenshot('submitted-legacy-390');
 sourceMatched(x,y,'submitted 390');
 verify(x.content.submitted&&y.content.submitted&&x.content.rubricUnlocked&&y.content.rubricUnlocked,
   'Submission/rubric visibility differs across owners');
 verify(x.answerDisabled.length===4&&y.answerDisabled.length===4&&
  x.answerDisabled.every(Boolean)&&y.answerDisabled.every(Boolean),
  'Post-submit four fields must be disabled in both owners');
 // Reuse the existing L09 Chromium scenario for the final, reviewed state.
 await go(shared,'review completion resume',true);
 for(let i=0;i<4;i++){
  await evaluate("(()=>{const e=document.querySelector('[data-rating=\""+i+"\"]');e.value='2';e.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
  await until(()=>evaluate("JSON.parse(localStorage.getItem('step16.l09.react-island.v1')||'null')?.ratings?.["+i+"]===2"),'rating persisted '+i);
 }
 await evaluate("document.querySelector('[data-action=finish]').click()");
 await until(()=>evaluate("document.querySelector('.pilot-resume')?.dataset.resumeStage==='reviewed'"),'review completion');
 await evaluate("document.querySelector('[data-action=resume]').click()");
 verify(await evaluate("document.activeElement?.id==='rubric-title'"),
  'Reviewed resume focuses rubric heading, not disabled inputs');
 verify(await evaluate("!localStorage.getItem('li.review.L09-1-2.v1')"),
  'Research resume/review must never touch the real learner key');
 matched.push({viewport:390,state:'submitted',contentSha256:digest(x.content),
  identicalContent:true,css:cssLedger(y,x)});
 pairs.push({width:390,state:'submitted',legacy:'submitted-legacy-390.png',
  shared:'submitted-shared-390.png'});
 fs.writeFileSync(path.join(output,'matched-review.json'),JSON.stringify({
  sourceHead:process.env.LI_STAGE02B_HEAD||'UNKNOWN',
  status:'RESEARCH_REVIEW_ARTIFACT_NOT_GLOBAL_G2',
  matchedContentChecks:passed,scenarios:matched,pairs,
  photoMode:'ACTUAL_CHROMIUM_FULL_PAGE_SYNTHETIC_DATA',
  imagePixelEquality:'NOT_TESTED',physicalSafari:'NOT_RUN',
  visualPOReview:'OPEN',globalG2:'OPEN',merge:false,deploy:false,
  realLearnerKey:'UNTOUCHED'
 },null,2)+'\n');
 fs.writeFileSync(path.join(output,'matched-visual-review.html'),makeSheet(pairs));
 console.log('PASS UXDS35_L09_MATCHED_VISUAL_REVIEW '+JSON.stringify({
  checks:passed,matchedStates:matched.length,fullPagePairs:pairs.length,
  viewports:viewports.map(v=>v.width),syntheticSubmitted:'LOCKED',
  actualPrivateKey:'UNCHANGED',pixelEquality:'NOT_CLAIMED',
  safari:'NOT_RUN',globalG2:'OPEN'}));
}
main().catch(e=>{fs.writeFileSync(path.join(output,'failure.txt'),e.stack||String(e));
 console.error('FAIL UXDS35_L09_MATCHED_VISUAL_REVIEW '+e.stack);process.exitCode=1;})
.finally(async()=>{try{socket?.close()}catch{}chrome?.kill('SIGKILL');
 await delay(200);await fs.promises.rm(profile,{force:true,recursive:true,maxRetries:5,retryDelay:100}).catch(()=>{})});
