#!/usr/bin/env node
'use strict';
/** VC-G2-01 APPROVED-SCOPED: opt-in real L09 research screen, synthetic Chrome.
 * No server writes, no Auth, no migration, no production route and no Safari claim.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const [bin,origin]=process.argv.slice(2);
assert.ok(bin,'Chromium binary required');
assert.equal(origin,'http://127.0.0.1:8798');
assert.equal(process.env.CI,'true');
const output='/tmp/li-uxds35-stage02b/combined/vc-g2-l09-research';
fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'li-vcg2-l09-'));
const nativeKey='li.review.L09-1-2.v1',researchKey='step16.l09.react-island.v1';
const legacy=origin+'/site/index.html?lesson=L09-1-2&li-react=l09';
const approved=legacy+'&li-vc-g2=1';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let proc,socket,seq=0,stderr='',passed=0;
const pending=new Map();
async function wait(fn,label,tries=260){
 for(let i=0;i<tries;i++){try{let r=await fn();if(r)return r;}catch(e){}await pause(100);}
 throw Error('Timed out '+label+' chrome='+proc?.exitCode+' stderr='+stderr.slice(-2000));
}
function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},15000);
  pending.set(id,v=>{clearTimeout(t);v.error||v.result?.exceptionDetails?
   reject(Error(JSON.stringify(v.error||v.result?.exceptionDetails))):resolve(v.result)});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evaluate(source){
 const r=await send('Runtime.evaluate',{expression:source,returnByValue:true,awaitPromise:true});
 return r?.result?.value;
}
const verify=(x,msg)=>{assert.ok(x,msg);passed++};
async function go(url,mode){
 await send('Page.navigate',{url});
 await wait(()=>evaluate("document.readyState==='complete'&&!!document.querySelector('#page-lessonL09')"),'real L09 route');
 await wait(()=>evaluate("(()=>{const p=document.querySelector('#li-step16-l09-react-host .pilot');return !!p&&p.getClientRects().length>0&&document.querySelector('#page-lessonL09')?.dataset.liRuntime==='react-candidate'&&!!p.querySelector('[data-action=submit]')})()"),'mounted L09 '+mode);
}
function capture(){
 const root=document.querySelector('#li-step16-l09-react-host .pilot');
 const style=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);
  return {height:r.height,width:r.width,fontSize:s.fontSize,lineHeight:s.lineHeight,fontWeight:s.fontWeight,
   padding:s.padding,bg:s.backgroundColor,borderRadius:s.borderRadius,shadow:s.boxShadow,
   minHeight:s.minHeight,border:s.border,disabled:!!e.disabled,ariaBusy:e.getAttribute('aria-busy'),
   textOverflows:e.scrollWidth>e.clientWidth+1}};
 };
 const primary=root?.querySelector('[data-action=submit]'),
 secondary=root?.querySelector('[data-action=clear]'),
 cards=[...root?.querySelectorAll('section.pilot-surface')||[]],
 answers=[...root?.querySelectorAll('textarea[data-answer]')||[]];
 return {url:location.href,viewport:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
  active:root?.getAttribute('data-vc-g2')||null,
  runtime:document.querySelector('#page-lessonL09')?.dataset.liRuntime||null,
  nativeChallengeHidden:!!document.getElementById('l09-challenge')?.hidden,
  realKey:localStorage.getItem('li.review.L09-1-2.v1'),
  researchKey:localStorage.getItem('step16.l09.react-island.v1'),
  dataStorageKey:root?.getAttribute('data-storage-key'),lang:root?.lang,
  buttons:{primary:style(primary),secondary:style(secondary)},
  cards:cards.map(style),cardShared:cards.map(x=>x.classList.contains('li-ui-card')),
  answerCount:answers.length,answerShared:answers.map(x=>x.closest('.li-ui-field')!==null),
  answerLabels:answers.map(x=>x.labels?.length),answerPurposes:answers.map(x=>x.getAttribute('data-field-purpose')),
  answerStyles:answers.map(style),
  hasLegacyButton:!!root?.querySelector('.pilot-action'),
  hasSharedButton:!!root?.querySelector('.li-ui-button'),
  status:root?.querySelector('[data-status]')?.textContent,
  helpVisible:!!root?.querySelector('[data-hint]'),
  assisted:!!root?.querySelector('[data-assisted]'),
  submitted:!!root?.querySelector('[data-submission]')
 };
}
async function snapshot(){return evaluate('('+capture.toString()+')()')}
async function screenshot(name){
 const pic=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(pic.data,'base64'));
}
const variants=[
 {width:320,height:568,pad:20,min:48},
 {width:375,height:812,pad:20,min:48},
 {width:390,height:844,pad:20,min:48},
 {width:402,height:874,pad:20,min:48},
 {width:600,height:900,pad:24,min:48},
 {width:820,height:1050,pad:28,min:56},
 {width:1040,height:768,pad:32,min:56},
 {width:1440,height:900,pad:32,min:56}
];
async function main(){
 proc=spawn(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-background-networking','--no-first-run','--remote-debugging-port=0',
 '--remote-allow-origins=*','--user-data-dir='+profile,legacy],{stdio:['ignore','ignore','pipe']});
 proc.stderr.on('data',x=>{stderr=(stderr+String(x)).slice(-5000)});
 proc.on('error',e=>{stderr+=' SPAWN '+e.message});
 const port=await wait(()=>{const f=path.join(profile,'DevToolsActivePort');return fs.existsSync(f)?fs.readFileSync(f,'utf8').split('\n')[0]:null},'Chromium debugger',260);
 const tab=await wait(async()=>{const j=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();return j.find(x=>x.type==='page'&&x.webSocketDebuggerUrl)},'Chromium tab',260);
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 socket.addEventListener('message',event=>{
  const obj=JSON.parse(String(event.data));if(obj.id&&pending.has(obj.id)){
   const callback=pending.get(obj.id);pending.delete(obj.id);callback(obj);
  }
 });
 await send('Runtime.enable');await send('Page.enable');
 const report=[];
 for(const v of variants){
  await send('Emulation.setDeviceMetricsOverride',{width:v.width,height:v.height,deviceScaleFactor:1,mobile:false});
  await go(legacy,'legacy-default');
  const a=await snapshot();
  if(v.width===390)await screenshot('legacy-default-390');
  verify(a.active===null&&!a.hasSharedButton&&a.hasLegacyButton,'Default pilot must remain legacy '+v.width);
  verify(a.answerShared.every(x=>x===false),'Default answer field unexpectedly migrated '+v.width);
  verify(a.realKey===null&&a.dataStorageKey===researchKey,'Default route touched real learner key '+v.width);
  await go(approved,'approved-opt-in');
  const b=await snapshot();
  if([390,820,1040].includes(v.width))await screenshot('vc-g2-opt-in-'+v.width);
  verify(b.active==='approved-research'&&b.hasSharedButton&&!b.hasLegacyButton,'D1 shared Button owner incorrect '+v.width);
  verify(b.cards.length===2&&b.cardShared.every(Boolean),'D2 shared Card owner incorrect '+v.width);
  verify(b.answerCount===4&&b.answerShared.every(Boolean)&&b.answerLabels.every(x=>x===1)&&
    b.answerPurposes.every(x=>x==='answer'),'D3 TextAreaField label/purpose mismatch '+v.width);
  verify(b.buttons.primary?.height>=v.min&&b.buttons.secondary?.height>=v.min,'D1 hit target smaller than '+v.min+'px at '+v.width);
  verify(b.buttons.primary.fontSize==='16px'&&b.buttons.secondary.fontSize==='16px'&&
    b.buttons.primary.lineHeight==='24px'&&b.buttons.secondary.lineHeight==='24px','D1 body typography 16/24 drift '+v.width);
  verify(b.buttons.primary.borderRadius==='0px'&&/4px 4px 0px/.test(b.buttons.primary.shadow)&&
    /4px 4px 0px/.test(b.buttons.secondary.shadow),'D1 square/hard-shadow drift '+v.width+' '+b.buttons.primary.shadow);
  verify(b.cards.every(c=>c.padding.split(' ').every(x=>parseFloat(x)===v.pad)),'D2 card padding wrong at '+v.width+' '+JSON.stringify(b.cards.map(x=>x.padding)));
  verify(b.cards.every(c=>c.borderRadius==='0px'&&/5px 5px 0px/.test(c.shadow)),'D2 hard shadow drift '+v.width+' '+JSON.stringify(b.cards));
  verify(b.answerStyles.every(x=>x.height>=112&&x.fontSize==='16px'&&x.lineHeight==='24px'&&x.bg===a.answerStyles[0].bg),'D3 answer variant/semantic paint drift '+v.width);
  verify(b.buttons.primary.bg===a.buttons.primary.bg&&b.buttons.secondary.bg===a.buttons.secondary.bg&&b.cards[0].bg===a.cards[0].bg,'Canonical semantic background drift '+v.width);
  verify(b.viewport===v.width&&b.scrollWidth<=v.width+1&&a.scrollWidth<=v.width+1,'Horizontal overflow '+v.width);
  verify(b.nativeChallengeHidden&&b.runtime==='react-candidate'&&b.realKey===null&&b.dataStorageKey===researchKey,
   'React island exposed native challenge or touched real key '+v.width);
  verify(!b.buttons.primary.textOverflows&&!b.buttons.secondary.textOverflows,'Essential CTA label clipped '+v.width);
  report.push({viewport:v.width,height:v.height,expectedPad:v.pad,expectedTarget:v.min,legacy:a,approved:b});
 }
 // Synthetic learner-flow assertions in the opt-in research route (no Neon / real key).
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await go(approved,'synthetic learner state');
 const base=await snapshot();verify(base.researchKey===null&&base.realKey===null,'Synthetic profile not initially empty');
 await evaluate("document.querySelector('[data-action=submit]').click()");
 await wait(()=>evaluate("!!document.querySelector('[data-status]')?.textContent.trim()"),'blank-submit error');
 verify((await snapshot()).researchKey===null,'Invalid submit fabricated save');
 for(let i=0;i<4;i++){
  const val='Synthetic research answer '+i+' meeting submission length';
  await evaluate("(()=>{const e=document.querySelector('[data-answer=\""+i+"\"]');const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(e,"+JSON.stringify(val)+");e.dispatchEvent(new Event('input',{bubbles:true}));return true})()");
  await wait(()=>evaluate("JSON.parse(localStorage.getItem('step16.l09.react-island.v1')||'null')?.draft?.["+i+"]?.startsWith('Synthetic research answer')"),'synthetic L09 draft '+i);
 }
 verify((await snapshot()).realKey===null,'Real learner state changed on synthetic editing');
 await evaluate("document.querySelector('[data-action=hint]').click()");
 await wait(()=>evaluate("!!document.querySelector('[data-hint]')"),'hint state');
 verify((await snapshot()).assisted,'Assisted hint state not reported');
 await evaluate("document.querySelector('[data-locale=en]').click()");
 await wait(()=>evaluate("document.querySelector('.pilot')?.lang==='en'"),'EN locale');
 verify((await snapshot()).answerShared.every(Boolean),'Changing locale destroyed shared fields');
 await evaluate("document.querySelector('[data-locale=vi]').click()");
 await wait(()=>evaluate("document.querySelector('.pilot')?.lang==='vi'"),'VI locale');
 await evaluate("document.querySelector('[data-action=submit]').click()");
 await wait(()=>evaluate("!!document.querySelector('[data-rubric]')"),'rubric unlock');
 const frozen=await snapshot();
 verify(frozen.submitted&&frozen.answerStyles.every(x=>x.disabled)&&!frozen.hasLegacyButton,'D3 submitted field locking/new owner regression');
 verify(frozen.realKey===null,'L09 research submission touched real learner state');
 const data={sourceHead:process.env.LI_STAGE02B_HEAD||'UNKNOWN',threeDecisions:['VC-G2-D1','VC-G2-D2','VC-G2-D3'],
  expectedRoute:'site/index.html?lesson=L09-1-2&li-react=l09&li-vc-g2=1',
  requiredPrivacy:'REAL_LEARNER_KEY_UNCHANGED',validatedViewports:variants.map(x=>x.width),
  assertions:passed,screenshots:['legacy-default-390.png','vc-g2-opt-in-390.png','vc-g2-opt-in-820.png','vc-g2-opt-in-1040.png'],
  implementation:'DRAFT_RESEARCH_ONLY',globalG2:'OPEN',physicalSafari:'NOT_RUN',syntheticLearnerFlow:'SUBMITTED_AND_LOCKED',
  observations:report};
 fs.writeFileSync(path.join(output,'vc-g2-l09-chromium-evidence.json'),JSON.stringify(data,null,2)+'\n');
 console.log('PASS UXDS35_VCG2_L09_APPROVED_RESEARCH '+JSON.stringify({checks:passed,viewports:variants.map(x=>x.width),
   cardPadding:[20,24,28,32],targets:[48,56],sharedFamilies:['Button','Card','TextAreaField'],
   defaultLegacy:'UNCHANGED',syntheticFlow:'SUBMITTED_LOCKED',realKey:'UNCHANGED',safari:'NOT_RUN',g2:'OPEN'}));
}
main().catch(e=>{fs.writeFileSync(path.join(output,'failure.txt'),e.stack||String(e));console.error('FAIL UXDS35_VCG2_L09_RESEARCH '+e.stack);process.exitCode=1})
.finally(async()=>{try{socket?.close()}catch{}proc?.kill('SIGKILL');await pause(200);await fs.promises.rm(profile,{force:true,recursive:true,maxRetries:5,retryDelay:100}).catch(()=>{})});
