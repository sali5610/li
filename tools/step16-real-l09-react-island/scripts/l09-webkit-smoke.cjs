#!/usr/bin/env node
'use strict';
/** L09 Stage02B cross-engine research. Linux Playwright WebKit != iOS Safari.
 * No production URL, no user/Neon credential, no global G2/release assertion.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {webkit}=require('playwright');
const origin=process.argv[2];
assert.equal(origin,'http://127.0.0.1:8798');
assert.equal(process.env.CI,'true');
const out='/tmp/li-uxds35-stage02b/combined/l09-webkit';
fs.mkdirSync(out,{recursive:true});
const legacy=origin+'/site/index.html?lesson=L09-1-2&li-react=l09';
const approved=legacy+'&li-vc-g2=1';
const realKey='li.review.L09-1-2.v1';
let passed=0,results=[],browser;
function ok(condition,message){assert.ok(condition,message);passed++}
async function route(page,url,mode){
 await page.goto(url,{waitUntil:'load',timeout:45000});
 await page.waitForFunction((args)=>{
  const p=document.querySelector('#li-step16-l09-react-host .pilot');
  return document.readyState==='complete'&&location.href===args.url&&p&&p.getClientRects().length>0
   &&document.querySelector('#page-lessonL09')?.dataset.liRuntime==='react-candidate'
   &&p.dataset.vcG2===(args.approved?'approved-research':undefined)
   &&p.querySelector('[data-action=submit]');
 },{url,approved:mode==='shared'},{timeout:45000});
}
async function grab(page){
 return page.evaluate(()=>{
  const p=document.querySelector('#li-step16-l09-react-host .pilot');
  const cards=[...p.querySelectorAll('section.pilot-surface')];
  const answers=[...p.querySelectorAll('textarea[data-answer]')];
  const style=e=>{
   const s=getComputedStyle(e),r=e.getBoundingClientRect();
   return {bg:s.backgroundColor,shadow:s.boxShadow,pad:s.padding,radius:s.borderRadius,
    minHeight:s.minHeight,rectHeight:r.height,font:s.fontSize,line:s.lineHeight,
    border:s.borderTopWidth,borderColor:s.borderTopColor};
  };
  const content={lessonId:p.dataset.lessonId,lang:p.lang,
   heading:p.querySelector('h1')?.textContent?.trim(),
   challenge:p.querySelector('#challenge-title')?.textContent?.trim(),
   caseText:p.querySelector('[data-case-text]')?.textContent?.trim(),
   questionLabels:answers.map(a=>a.labels?.[0]?.textContent?.trim()),
   answerValues:answers.map(a=>a.value),
   submitted:!!p.querySelector('[data-submission]'),
   rubric:!!p.querySelector('[data-rubric]')};
  return {width:innerWidth,docWidth:document.documentElement.scrollWidth,
   source:p.dataset.vcG2||'legacy',real:localStorage.getItem('li.review.L09-1-2.v1'),
   synthetic:localStorage.getItem('step16.l09.react-island.v1'),
   cardStyles:cards.map(style),answerStyles:answers.map(style),
   cardElevation:cards.map(c=>c.dataset.cardElevation||null),
   buttons:{primary:style(p.querySelector('[data-action=submit]')),
    secondary:style(p.querySelector('[data-action=clear]'))},
   disabled:answers.map(a=>a.disabled),content};
 });
}
async function main(){
 browser=await webkit.launch({headless:true});
 const viewports=[
  {width:390,height:844,pad:20,target:48},
  {width:820,height:1050,pad:28,target:56},
  {width:1040,height:768,pad:32,target:56},
  {width:1440,height:900,pad:24,target:48}
 ];
 for(const v of viewports){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:1,
   isMobile:false,hasTouch:false,locale:'vi-VN'});
  const page=await context.newPage();
  page.on('pageerror',e=>{throw Error('WebKit page error '+e.message)});
  await route(page,legacy,'legacy');
  const a=await grab(page);
  await route(page,approved,'shared');
  const b=await grab(page);
  ok(JSON.stringify(a.content)===JSON.stringify(b.content),'WebKit source content/state drift '+v.width);
  ok(a.real===null&&b.real===null&&a.synthetic===b.synthetic,'WebKit privacy/state mismatch '+v.width);
  ok(a.docWidth<=v.width+1&&b.docWidth<=v.width+1,'WebKit page overflow '+v.width);
  ok(b.cardStyles.length===2&&a.cardStyles.length===2&&
   b.cardStyles.every((x,i)=>x.shadow==='none'&&x.shadow===a.cardStyles[i].shadow)&&
   b.cardElevation.every(x=>x==='flat'),'WebKit secondary flat Card shadow leaked '+v.width);
  ok(b.cardStyles.every(c=>c.pad.split(' ').every(x=>parseFloat(x)===v.pad)),
   'WebKit responsive Card pad mismatch '+v.width+' '+JSON.stringify(b.cardStyles));
  ok(b.buttons.primary.rectHeight>=v.target&&b.buttons.secondary.rectHeight>=v.target,
   'WebKit Button hit target too small '+v.width);
  ok(b.buttons.primary.shadow.includes('4px 4px 0px')&&
   b.buttons.secondary.shadow.includes('4px 4px 0px'),
   'WebKit D1 button hard shadow mismatch '+v.width);
  ok(b.answerStyles.length===4&&b.answerStyles.every(x=>parseFloat(x.minHeight)>=112),
   'WebKit D3 four answer fields missing '+v.width);
  if(v.width===390||v.width===820){
   await page.screenshot({path:path.join(out,'shared-'+v.width+'.png'),fullPage:true,animations:'disabled'});
  }
  results.push({viewport:v.width,contentMatched:true,flatNoShadow:true,
   responsivePad:v.pad,buttonTarget:v.target,realLearnerKey:'ABSENT',
   measured:{cards:b.cardStyles,buttons:b.buttons}});
  if(v.width===390){
   const answer=page.locator('textarea[data-answer="0"]');
   await answer.focus();
   const focused=await answer.evaluate(e=>{
    const s=getComputedStyle(e);return {active:document.activeElement===e,
     top:parseFloat(s.borderTopWidth),color:s.borderTopColor,outline:s.outlineWidth};
   });
   ok(focused.active&&focused.top>=3,'WebKit D3 focused 3px border missing');
   for(let i=0;i<4;i++)await page.locator('textarea[data-answer="'+i+'"]')
    .fill('Synthetic WebKit answer '+i+' with enough complete explanatory detail.');
   await page.locator('[data-action=hint]').click();
   await page.locator('[data-locale=en]').click();
   await page.waitForFunction(()=>document.querySelector('.pilot')?.lang==='en');
   await page.locator('[data-locale=vi]').click();
   await page.waitForFunction(()=>document.querySelector('.pilot')?.lang==='vi');
   await page.locator('[data-action=submit]').click();
   await page.locator('[data-rubric]').waitFor({state:'visible',timeout:20000});
   const submitted=await grab(page);
   ok(submitted.content.submitted&&submitted.content.rubric&&submitted.disabled.every(Boolean),
    'WebKit synthetic submit/rubric/locking drift');
   ok(submitted.real===null&&submitted.synthetic!==null,
    'WebKit submitted to real learner key');
   await page.screenshot({path:path.join(out,'shared-submitted-390.png'),
    fullPage:true,animations:'disabled'});
  }
  await context.close();
 }
 const report={sourceHead:process.env.LI_STAGE02B_HEAD||'UNKNOWN',
  status:'WEBKIT_ENGINE_RESEARCH_ONLY',platform:process.platform,
  browser:browser.version(),checks:passed,scenarios:results,
  physicalIOSSafari:'NOT_RUN',realZoom:'NOT_RUN',globalG2:'OPEN',
  release:'NOT_AUTHORIZED',realLearnerKey:'UNCHANGED'};
 fs.writeFileSync(path.join(out,'webkit-research.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PASS UXDS35_L09_WEBKIT_RESEARCH '+JSON.stringify({
  checks:passed,viewports:viewports.map(x=>x.width),browser:browser.version(),
  flatCards:'NO_SHADOW',raisedContract:'PRESERVED_BY_CHROMIUM_SUITE',
  submitted:'LOCKED',realKey:'UNCHANGED',iosSafari:'NOT_RUN',g2:'OPEN'}));
}
main().catch(e=>{fs.writeFileSync(path.join(out,'failure.txt'),e.stack||String(e));
 console.error('FAIL UXDS35_L09_WEBKIT_RESEARCH '+e.stack);process.exitCode=1;})
.finally(async()=>{if(browser)await browser.close().catch(()=>{})});
