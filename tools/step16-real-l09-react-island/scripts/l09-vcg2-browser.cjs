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
  cardFlat:cards.map(x=>x.classList.contains('li-ui-card-flat')&&x.dataset.cardElevation==='flat'),
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
 // Canonical iPad :root tokens intentionally scale semantic body from 16/24 to 18/28.
 // Preserve that responsive role; D1 is a body-label contract, not a fixed pixel lock.
 {width:820,height:1050,pad:28,min:56,body:[18,28]},
 {width:820,height:700,pad:28,min:56,body:[18,28]},
 {width:1040,height:768,pad:32,min:56,body:[18,28]},
 {width:1408,height:900,pad:32,min:56,body:[18,28]},
 {width:1200,height:1500,pad:24,min:48},
 // Desktop must NOT accidentally inherit wide iPad density.
 {width:1440,height:900,pad:24,min:48}
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
  verify(b.cardFlat.length===2&&b.cardFlat.every(Boolean),
    'D2 requires two explicit secondary flat study cards '+v.width);
  verify(b.answerCount===4&&b.answerShared.every(Boolean)&&b.answerLabels.every(x=>x===1)&&
    b.answerPurposes.every(x=>x==='answer'),'D3 TextAreaField label/purpose mismatch '+v.width);
  verify(b.buttons.primary?.height>=v.min&&b.buttons.secondary?.height>=v.min,'D1 hit target smaller than '+v.min+'px at '+v.width);
  const [bodyPx,leadingPx]=v.body||[16,24];
  verify(b.buttons.primary.fontSize===bodyPx+'px'&&b.buttons.secondary.fontSize===bodyPx+'px'&&
    b.buttons.primary.lineHeight===leadingPx+'px'&&b.buttons.secondary.lineHeight===leadingPx+'px',
    'D1 semantic body typography drift '+v.width+' expected '+bodyPx+'/'+leadingPx+
    ' observed '+JSON.stringify({primary:b.buttons.primary,secondary:b.buttons.secondary}));
  verify(b.buttons.primary.borderRadius==='0px'&&/4px 4px 0px/.test(b.buttons.primary.shadow)&&
    /4px 4px 0px/.test(b.buttons.secondary.shadow),'D1 square/hard-shadow drift '+v.width+' '+b.buttons.primary.shadow);
  verify(b.cards.every(c=>c.padding.split(' ').every(x=>parseFloat(x)===v.pad)),'D2 card padding wrong at '+v.width+' '+JSON.stringify(b.cards.map(x=>x.padding)));
  verify(b.cards.every((c,i)=>c.borderRadius==='0px'&&c.shadow==='none'&&
    c.shadow===a.cards[i]?.shadow),'D2 study panels must retain legacy FLAT/no-shadow '+v.width+
    ' '+JSON.stringify({legacy:a.cards,shared:b.cards}));
  // Independent raised variant must still use D2 hard depth. A clone is only a
  // temporary DOM style probe, never part of lesson content or persisted state.
  const raised=await evaluate("(()=>{const p=document.querySelector('.pilot[data-vc-g2=approved-research]'),"+
    "e=p?.querySelector('section.li-ui-card');if(!e)return null;const clone=e.cloneNode(false);"+
    "clone.classList.remove('li-ui-card-flat');clone.dataset.cardElevation='raised';"+
    "clone.style.display='none';p.appendChild(clone);clone.style.display='block';"+
    "const s=getComputedStyle(clone),v={shadow:s.boxShadow,radius:s.borderRadius};clone.remove();return v})()");
  verify(raised?.radius==='0px'&&/5px 5px 0px/.test(raised.shadow),
    'D2 raised card exception lost after flat study mapping '+v.width+' '+JSON.stringify(raised));
  verify(b.answerStyles.every(x=>x.height>=112&&parseFloat(x.minHeight)>=112&&x.fontSize===bodyPx+'px'&&x.lineHeight===a.answerStyles[0].lineHeight&&x.bg===a.answerStyles[0].bg),'D3 named answer min-height/semantic paint/legacy multiline rhythm drift '+v.width+': '+JSON.stringify({shared:b.answerStyles,legacy:a.answerStyles}));
  verify(b.buttons.primary.bg===a.buttons.primary.bg&&b.buttons.secondary.bg===a.buttons.secondary.bg&&
    b.cards.every((c,i)=>c.bg===a.cards[i]?.bg),'Canonical semantic background drift '+v.width);
  verify(b.viewport===v.width&&b.scrollWidth<=v.width+1&&a.scrollWidth<=v.width+1,'Horizontal overflow '+v.width);
  verify(b.nativeChallengeHidden&&b.runtime==='react-candidate'&&b.realKey===null&&b.dataStorageKey===researchKey,
   'React island exposed native challenge or touched real key '+v.width);
  verify(!b.buttons.primary.textOverflows&&!b.buttons.secondary.textOverflows,'Essential CTA label clipped '+v.width);
  report.push({viewport:v.width,height:v.height,expectedPad:v.pad,expectedTarget:v.min,legacy:a,approved:b});
 }

// Synthetic DOM-only 200% body-token stress: not real Safari or native browser zoom.
async function syntheticTypographyStress(language){
 const root=document.querySelector('#li-step16-l09-react-host .pilot');
 const primary=root?.querySelector('[data-action=submit]');
 const secondary=root?.querySelector('[data-action=clear]');
 const field=root?.querySelector('textarea[data-answer="0"]');
 const label=field?.labels?.[0];
 if(!root||!primary||!secondary||!field||!label)return {mounted:false};
 const content={
  vi:{primary:'Gửi toàn bộ câu trả lời sau khi kiểm tra dữ liệu đã nhập và xác nhận hoàn tất phần thử nghiệm',
   secondary:'Xoá những câu trả lời đang soạn và bắt đầu lại nếu thật sự cần thiết',
   label:'Hãy giải thích rõ ràng bằng lập luận của mày: trong ví dụ nghiên cứu này, vì sao kết quả có thể khác nhau giữa các nhóm người tham gia?'},
  en:{primary:'Submit every response after reviewing all entered evidence and confirming this research exercise is complete',
   secondary:'Clear all drafted responses and begin again only when this is truly necessary',
   label:'Explain in your own words why the results in this research scenario might differ between participant groups, supporting your conclusion with reasoning.'}
 }[language];
 const normal=getComputedStyle(primary);
 const originalFont=parseFloat(normal.fontSize),originalLeading=parseFloat(normal.lineHeight);
 field.focus();
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const focusAt100=getComputedStyle(field);
 const baselineFocus={borderWidths:[focusAt100.borderTopWidth,focusAt100.borderRightWidth,focusAt100.borderBottomWidth,focusAt100.borderLeftWidth].map(parseFloat),
  borderColor:focusAt100.borderTopColor,outlineWidth:parseFloat(focusAt100.outlineWidth)};
 primary.textContent=content.primary;secondary.textContent=content.secondary;label.textContent=content.label;
 // Stress only the explicitly opt-in React island: a document :root override
 // would also scale unrelated native shell UI and misattribute overflow.
 const baselineDocumentWidth=document.documentElement.scrollWidth;
 root.style.setProperty('--li-type-body',String(originalFont*2)+'px');
 root.style.setProperty('--li-leading-body',String(originalLeading*2)+'px');
 root.style.fontSize='200%';
 field.focus();
 // Separate the focus/style mutation from measurement to observe a painted frame.
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const geometry=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);
  return {left:r.left,right:r.right,height:r.height,width:r.width,
   fontSize:parseFloat(s.fontSize),lineHeight:parseFloat(s.lineHeight),
   clipped:e.scrollWidth>e.clientWidth+1};};
 return {mounted:true,language,viewport:innerWidth,viewportHeight:innerHeight,
  docWidth:document.documentElement.scrollWidth,baselineDocumentWidth,
  overflowOwners:[...document.querySelectorAll('#page-lessonL09 *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1)
   .slice(0,8).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,90),id:e.id||null,
    right:Math.round(e.getBoundingClientRect().right)})),
  focused:document.activeElement===field,
  focusVisible:field.matches(':focus-visible'),outlineWidth:parseFloat(getComputedStyle(field).outlineWidth),
  outlineStyle:getComputedStyle(field).outlineStyle,outlineColor:getComputedStyle(field).outlineColor,
  focusPaint:{borderWidths:[getComputedStyle(field).borderTopWidth,getComputedStyle(field).borderRightWidth,
   getComputedStyle(field).borderBottomWidth,getComputedStyle(field).borderLeftWidth].map(parseFloat),
   borderColor:getComputedStyle(field).borderTopColor},baselineFocus,
  focusToken:getComputedStyle(field).getPropertyValue('--li-comp-field-focus-border').trim(),
  fallbackFocusToken:getComputedStyle(field).getPropertyValue('--li-color-input-focus-ring').trim(),
  labelAssociated:field.labels?.length===1&&field.labels[0]===label,
  realKey:localStorage.getItem('li.review.L09-1-2.v1'),originalFont,originalLeading,
  primary:geometry(primary),secondary:geometry(secondary),label:geometry(label),field:geometry(field),
  layout:{rootWidth:root.getBoundingClientRect().width,
   rootColumns:getComputedStyle(root).gridTemplateColumns,
   cardWidth:field.closest('.li-ui-card')?.getBoundingClientRect().width,
   questionColumns:getComputedStyle(field.closest('.pilot-question')).gridTemplateColumns,
   fieldColumns:getComputedStyle(field.parentElement).gridTemplateColumns,
   textareaCols:field.cols}};
}

 // Browser read-only layout stress with synthetic long text in both locales.
 // 390x420 = short viewport only; no claim of real virtual keyboard/assistive zoom.
 const stressCases=[[320,568],[390,420],[390,844],[820,1050],[1040,768]];
 const stressEvidence=[];
 for(const [width,height] of stressCases){
  for(const language of ['vi','en']){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
   await go(approved,'text-stress-'+language);
   if(language==='en'){
    await evaluate("document.querySelector('[data-locale=en]').click()");
    await wait(()=>evaluate("document.querySelector('.pilot')?.lang==='en'"),'actual EN toggle during stress');
   }else verify(await evaluate("document.querySelector('.pilot')?.lang==='vi'"),
      'Stress VI source locale not restored '+width);
   const x=await evaluate('('+syntheticTypographyStress.toString()+')('+JSON.stringify(language)+')');
   const context=language+' '+width+'x'+height;
   verify(x?.mounted&&x.language===language&&x.viewport===width,'Long-label mount/locale drift '+context);
   verify(x.primary.fontSize===x.originalFont*2&&x.primary.lineHeight===x.originalLeading*2&&
     x.field.fontSize===x.originalFont*2,'200% body-role token mismatch '+context+' '+JSON.stringify(x));
   verify(x.baselineDocumentWidth<=width+1&&x.docWidth<=width+1&&[x.primary,x.secondary,x.label,x.field].every(c=>
     !c.clipped&&c.left>=-1&&c.right<=width+1),'Long-label horizontal clipping/overflow '+context+' '+JSON.stringify(x));
   verify(x.primary.height>=48&&x.secondary.height>=48&&x.labelAssociated,
     'Text scale broke CTA size or associated label '+context);
   // UX-DS-13 source: ui-foundations.css uses a 3px INPUT BORDER and
   // intentionally sets outline-width:0!important. This is NOT a failed ring.
   const semanticFocusColor='rgb(36, 58, 41)';
   verify(x.focused&&x.focusVisible&&x.realKey===null&&
      x.baselineFocus.borderWidths.every(n=>n>=3)&&
      x.focusPaint.borderWidths.every(n=>n>=3)&&
      x.baselineFocus.borderColor===semanticFocusColor&&
      x.focusPaint.borderColor===semanticFocusColor&&x.outlineWidth===0,
     'Text scale lost the actual 3px focus BORDER or learner key isolation '+context+' '+JSON.stringify(x));
   // The scoped Resume button is now the immediately preceding keyboard
   // stop before the first answer. Verify the real Shift+Tab/Tab order and
   // restored visible focus rather than incorrectly assuming locale is adjacent.
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
   await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
   const back=await evaluate("document.activeElement?.getAttribute('data-action')==='resume'");
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
   await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
   const forward=await evaluate("(()=>{const e=document.querySelector('textarea[data-answer=\"0\"]');const c=e&&getComputedStyle(e);return {target:document.activeElement===e,focusVisible:e?.matches(':focus-visible'),border:c?.borderTopWidth,color:c?.borderTopColor}})()");
   verify(back&&forward?.target&&forward.focusVisible&&parseFloat(forward.border)>=3&&forward.color===semanticFocusColor,
     'Keyboard Shift+Tab/Tab did not restore visible 3px input border '+context+' '+JSON.stringify({back,forward}));
   if((width===390&&height===844&&language==='vi')||(width===820&&language==='en'))
    await screenshot('stress-200pct-'+language+'-'+width);
   stressEvidence.push({context,...x});
   // Locale toggle writes only the research test key; reset for next scenario.
   await evaluate("localStorage.removeItem('step16.l09.react-island.v1');localStorage.removeItem('li.app.locale.v1')");
  }
 }

 // Synthetic learner-flow assertions in the opt-in research route (no Neon / real key).
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await go(approved,'synthetic learner state');
 const base=await snapshot();verify(base.researchKey===null&&base.realKey===null,'Synthetic profile not initially empty');
 verify((await evaluate("document.querySelector('[data-learning-progress]')?.textContent||''")).includes('0/4'),
  'Empty L09 progress must show 0/4 answers, not a completed score');
 await evaluate("document.querySelector('[data-action=submit]').click()");
 await wait(()=>evaluate("!!document.querySelector('[data-status]')?.textContent.trim()"),'blank-submit error');
 verify((await snapshot()).researchKey===null,'Invalid submit fabricated save');
 for(let i=0;i<4;i++){
  const val='Synthetic research answer '+i+' meeting submission length';
  await evaluate("(()=>{const e=document.querySelector('[data-answer=\""+i+"\"]');const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(e,"+JSON.stringify(val)+");e.dispatchEvent(new Event('input',{bubbles:true}));return true})()");
  await wait(()=>evaluate("JSON.parse(localStorage.getItem('step16.l09.react-island.v1')||'null')?.draft?.["+i+"]?.startsWith('Synthetic research answer')"),'synthetic L09 draft '+i);
 }
 verify((await snapshot()).realKey===null,'Real learner state changed on synthetic editing');
 verify((await evaluate("document.querySelector('[data-learning-progress]')?.textContent||''")).includes('4/4'),
  'Persisted research draft should show 4/4 submission-ready answers');
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
 verify((await evaluate("document.querySelector('[data-learning-progress]')?.textContent||''")).includes('0/4'),
  'Submitting switches to 0/4 self-review criteria, never invented mastery');
 const data={sourceHead:process.env.LI_STAGE02B_HEAD||'UNKNOWN',threeDecisions:['VC-G2-D1','VC-G2-D2','VC-G2-D3'],
  expectedRoute:'site/index.html?lesson=L09-1-2&li-react=l09&li-vc-g2=1',
  requiredPrivacy:'REAL_LEARNER_KEY_UNCHANGED',validatedViewports:variants.map(x=>x.width),
  assertions:passed,screenshots:['legacy-default-390.png','vc-g2-opt-in-390.png','vc-g2-opt-in-820.png','vc-g2-opt-in-1040.png'],
  implementation:'DRAFT_RESEARCH_ONLY',globalG2:'OPEN',physicalSafari:'NOT_RUN',syntheticLearnerFlow:'SUBMITTED_AND_LOCKED',
  observations:report,syntheticTypographyStress:stressEvidence};
 fs.writeFileSync(path.join(output,'vc-g2-l09-chromium-evidence.json'),JSON.stringify(data,null,2)+'\n');
 console.log('PASS UXDS35_VCG2_L09_APPROVED_RESEARCH '+JSON.stringify({checks:passed,viewports:variants.map(x=>x.width),
   cardPadding:[20,24,28,32],targets:[48,56],sharedFamilies:['Button','Card','TextAreaField'],
   syntheticStressCases:stressEvidence.length,bodyTokenScale:'200pct_fixture_only',
   defaultLegacy:'UNCHANGED',syntheticFlow:'SUBMITTED_LOCKED',realKey:'UNCHANGED',safari:'NOT_RUN',g2:'OPEN'}));
}
main().catch(e=>{fs.writeFileSync(path.join(output,'failure.txt'),e.stack||String(e));console.error('FAIL UXDS35_VCG2_L09_RESEARCH '+e.stack);process.exitCode=1})
.finally(async()=>{try{socket?.close()}catch{}proc?.kill('SIGKILL');await pause(200);await fs.promises.rm(profile,{force:true,recursive:true,maxRetries:5,retryDelay:100}).catch(()=>{})});
