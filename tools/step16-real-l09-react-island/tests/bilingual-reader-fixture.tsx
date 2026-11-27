// CI-only: actual learner components, in-memory QA ports. No real auth/data or production route.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {SectionedJourney,type SectionedLesson} from '../src/learning/SectionedJourney';
import {Wave1Journey} from '../src/learning/Wave1Journey';
import {LearningJourney} from '../src/learning/LearningJourney';
import {initial,type Attempt} from '../src/native-bridge';
import {buildReasoningReceipt} from '../src/learning/SavedLearningEvidence';
import type {LearningPorts} from '../src/learning/ports';
import {readingStamp,readingPositionKey,readPosition,type ReadingPosition} from '../src/learning/reading-position';
import {lessonTitles} from '../src/learning/lesson-titles';
import titles from '../../../content/editorial/lesson-titles.v1.json';
import supplements from '../../../content/editorial/lesson-completeness-supplements.v1.json';
const goalSupplements=supplements.lessons as Record<string,Record<'vi'|'en',{learningGoals?:string[];methodNote?:string}>>;
import sample03 from '../../../content/lessons/L03-1-2.json';
import sample09 from '../../../content/lessons/L09-1-2.json';
import sample15 from '../../../content/lessons/L15-2-2.json';
const sampleById:Record<string,any>={'L03-1-2':sample03,'L09-1-2':sample09,'L15-2-2':sample15};
const drafts=Object.values(import.meta.glob('../../../content/editorial/normalized/*.draft.v1.json',
 {eager:true,import:'default'})) as Array<{id:string;content:Record<string,unknown>}>;
const nextFrame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
const until=async(fn:()=>boolean,label:string)=>{
 const end=performance.now()+6000;
 while(performance.now()<end){if(fn())return;await nextFrame();}
 throw Error('Bilingual reader: '+label);
};
const check=(condition:boolean,message:string)=>{if(!condition)throw Error(message);};
const normalize=(s:string)=>s.replace(/\s+/g,' ').trim();
const plain=(s:string)=>normalize(s.replace(/<[^>]*>/g,'').replace(/\\([\[\]_*|])/g,'$1').replace(/\*\*|`/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' '));
const locales=['vi','en','vi'] as const;
const phases=['read','guided','practice','feedback','progress'] as const;
const marker='QA saved response — bản nháp giữ nguyên';
type FixtureApp={liLanguage:{get:()=>string;set:(locale:'vi'|'en')=>void};LiSpellPractice?:{getLessonPracticeSummary?:(lessonId:string,subjectId:string)=>{methodId:string;count:number}[]|null}};
export async function runBilingualReaderFixture(host:HTMLElement){
 const app=window as unknown as FixtureApp;
 let checks=0,readers=0,reviewChecks=0,evidenceChecks=0,resumeChecks=0,guideReturnChecks=0;
 const priorSpell=app.LiSpellPractice;
 app.LiSpellPractice={...priorSpell,getLessonPracticeSummary:(lessonId,subjectId)=>
  subjectId==='qa-bilingual-fixture'&&lessonId==='L03-1-2'?[{methodId:'T06',count:2}]:[]};
 const root=createRoot(host);
 const journey=()=>host.querySelector<HTMLElement>('[data-li-react-journey]');
 const click=(selector:string)=>{const b=host.querySelector<HTMLButtonElement>(selector);check(!!b&&!b.disabled,'Missing enabled '+selector);b!.click();};
 try{
  for(const id of Object.keys(titles.lessons)){
   app.liLanguage.set('vi');
   const t=lessonTitles(id)!;
   const draft=drafts.find(d=>d.id===id);
   const source=(draft??sampleById[id]).content.localized as Record<'vi'|'en',any>;
   const saved=initial();
   saved.guidedDraft=marker;
   saved.draft=[marker,marker+' 2',marker+' 3',marker+' 4'];
   let attempt:Attempt=structuredClone(saved),revision=0;
   const ports:LearningPorts={
    auth:{requireInvitedLearner:async()=>({subjectId:'qa-bilingual-fixture'})},
    attempts:{load:async()=>({attempt:structuredClone(attempt),revision:String(revision)}),
     save:async input=>{
      if(input.expectedRevision!==String(revision))throw Error('QA stale revision '+id);
      attempt=structuredClone(input.attempt);return {revision:String(++revision)};
     }},
    sync:{getStatus:async()=> 'on-device'},
    navigation:{openCatalog:()=>{}},search:{openSearch:()=>{}}
   };
   const lesson=draft?{...draft,version:'personal-study-2026-11-21-'+id,
    title:t,hierarchy:{field:{title:id.startsWith('L03')?'HCI':id.startsWith('L09')?'Data Science':'Supply Chain'}},
    content:{...draft.content,format:'editorial-sectioned-v1'}} as unknown as SectionedLesson:null;
   const render=(key:string)=>root.render(lesson?<SectionedJourney key={key} lesson={lesson} ports={ports} preview/>:
    id==='L09-1-2'?<LearningJourney key={key} ports={ports}/>:<Wave1Journey key={key} id={id as 'L03-1-2'|'L15-2-2'} ports={ports}/>);
   render(id);
   await until(()=>journey()?.dataset.liReactJourney===id,id+' mounted');
   // Resume from saved practice, navigate back without clearing state.
   for(let i=0;i<5&&journey()?.dataset.liLessonPhase!=='read';i++){
    const previous=journey()?.dataset.liLessonPhase;
    click('.li-study-book-previous');
    await until(()=>journey()?.dataset.liLessonPhase!==previous,id+' previous');
   }
   for(let i=0;i<phases.length;i++){
    const phase=phases[i];
    for(const locale of locales){
     app.liLanguage.set(locale);
     await until(()=>journey()?.lang===locale&&attempt.locale===locale,id+' '+phase+' '+locale+' saved locale');
     const node=journey()!;
     check(node.dataset.liLessonPhase===phase,id+' unexpected phase '+node.dataset.liLessonPhase);
     check(normalize(node.querySelector('h1')?.textContent||'')===normalize(t[locale]),id+' '+locale+' wrong title: '+node.querySelector('h1')?.textContent);
     const folio=node.querySelector('.li-study-book-folio')?.getAttribute('aria-label')||'';
     check(folio.startsWith(locale==='vi'?'Bước ':'Step '),id+' '+locale+' wrong pager language');
     check(!!node.querySelector('[aria-label="'+(locale==='vi'?'Lão Lý đồng hành':'Elder Ly companion')+'"]'),id+' mentor locale');
     check(attempt.guidedDraft===marker&&attempt.draft[0]===marker&&!attempt.submitted&&!attempt.reviewed,id+' corrupted saved progress');
     if(phase==='guided'||phase==='practice')check(Array.from(node.querySelectorAll('textarea')).some(x=>x.value===marker),id+' draft not visible '+phase);
     if(phase==='practice'){
      const scaffold=node.querySelector<HTMLElement>('[data-li-reasoning-support="'+id+'"]');
      check(!!scaffold,id+' missing reasoning scaffold');
      check(scaffold!.textContent!.includes(locale==='vi'?'mức tự tin':'confidence'),id+' missing confidence prompt');
      const details=scaffold!.querySelector('details');
      check(!!details&&!details.open,id+' optional reasoning scaffold should start closed');
      check(!buildReasoningReceipt(id,attempt),id+' unsaved/draft receipt must not export');
      const authored=source[locale].assessment?.questions??source[locale].questions;
      const labels=Array.from(node.querySelectorAll('textarea')).map(x=>plain(Array.from(x.labels||[]).map(y=>y.textContent||'').join(' ')));
      check(authored.length===4&&authored.every((q:string,i:number)=>labels.some(l=>l.includes(plain(q).slice(0,Math.min(35,plain(q).length))))),id+' '+locale+' actual question text mismatch');
     }
     if(phase==='guided'&&goalSupplements[id]?.[locale]?.methodNote){
      const note=goalSupplements[id][locale].methodNote!;
      const details=node.querySelector<HTMLDetailsElement>('.li-sectioned-method-details');
      check(!!details,id+' missing optional methods');
      const wasOpen=details!.open;details!.open=true;
      check(normalize(details!.innerText).includes(normalize(note)),id+' '+locale+' missing optional method note');
      details!.open=wasOpen;
     }
     if(phase==='read'){
      {
       const proof=node.querySelector<HTMLElement>('[data-li-ontology-evidence]');
       check(!!proof,id+' missing source-checked concept relation');
       const disclosure=proof!.closest('details');
       check(!!disclosure,id+' missing ontology disclosure');
       const wasOpen=disclosure!.open;disclosure!.open=true;
       check(proof!.innerText.includes(locale==='vi'?'chưa duyệt toàn bài':'not full lesson approval'),id+' relation review status');
       const sources=Array.from(proof!.querySelectorAll('a'));
       check(sources.length>=1&&sources.every(a=>a.href.startsWith('https://')&&a.rel.includes('noopener')),id+' source links');
       disclosure!.open=wasOpen;
      }
      const goals=goalSupplements[id]?.[locale]?.learningGoals;
      if(goals){
       const group=node.querySelector<HTMLElement>('[data-li-supplement-goals]');
       check(!!group&&goals.every(goal=>normalize(group!.innerText).includes(normalize(goal))),id+' '+locale+' supplemental objectives missing');
       check(group!.querySelectorAll('li').length===goals.length,id+' duplicate objectives');
      }
      check(!!node.querySelector('.li-learning-sources'),id+' missing sources');
      check((locale==='vi'?/Gợi ý tìm kiếm|Từ khóa tìm/:/Suggested searches|Search keywords|Research keywords/).test(node.querySelector('.li-learning-query-details summary')?.textContent||''),id+' query labels');
     }
     if(phase==='progress'){
      const selector='[data-li-saved-learning-evidence]';
      await until(()=>!!journey()?.querySelector(selector),id+' draft evidence settled');
      const evidence=normalize(journey()!.querySelector(selector)!.textContent||'');
      check(evidence.includes(locale==='vi'?'Chưa có bài nộp':'No submission'),id+' draft evidence false submission');
      check(!journey()!.querySelector('[data-li-reasoning-export]'),id+' draft export exposed');
      check(evidence.includes(locale==='vi'?'Lượt hoàn tất tự đánh giá (gồm lịch sử): 0':'Completed self-review rounds (including saved history): 0'),id+' draft evidence false completion');
      evidenceChecks++;
     }
     checks++;
    }
    if(i<phases.length-1){click('.li-study-book-next');await until(()=>journey()?.dataset.liLessonPhase===phases[i+1],id+' next '+phase);}
   }
   // Load a separate completed fixture receipt; confirm full feedback/rubric and progress in both locales.
   attempt={...structuredClone(saved),submitted:true,submittedAt:'2026-11-26T00:00:00Z',submission:[...saved.draft],submissionLocale:'vi',ratings:[2,1,2,1],reviewed:true,answerRevealed:true};
   revision++;
   render(id+'-reviewed');
   await until(()=>journey()?.dataset.liReactJourney===id&&journey()?.dataset.liLessonPhase==='progress'&&journey()?.dataset.liLessonSubmitted==='true',id+' completed fixture');
   click('.li-study-book-previous');await until(()=>journey()?.dataset.liLessonPhase==='feedback',id+' feedback');
   for(const locale of locales){
    app.liLanguage.set(locale);
    await until(()=>journey()?.lang===locale&&attempt.locale===locale,id+' reviewed '+locale);
    const node=journey()!;
    const rubric=source[locale].assessment?.rubricCriteria??source[locale].rubricItems;
    const labels=Array.from(node.querySelectorAll('.li-learning-rating label')).map(x=>plain(x.textContent||''));
    check(rubric.length===4&&rubric.every((row:string[])=>labels.some(l=>l.includes(plain(row[0]).slice(0,Math.min(35,plain(row[0]).length))))),id+' '+locale+' rendered rubric mismatch');
    check(attempt.reviewed&&attempt.submitted&&attempt.submission?.[0]===marker&&JSON.stringify(attempt.ratings)==='[2,1,2,1]',id+' reviewed receipt changed');
    reviewChecks++;
   }
   click('.li-study-book-next');await until(()=>journey()?.dataset.liLessonPhase==='progress',id+' reviewed progress');
   for(const locale of locales){
    app.liLanguage.set(locale);
    const selector='[data-li-saved-learning-evidence]';
    await until(()=>journey()?.lang===locale&&attempt.locale===locale&&!!journey()?.querySelector(selector),id+' completed progress '+locale);
    check(attempt.reviewed&&attempt.submission?.[0]===marker,id+' completion lost');
    const evidence=normalize(journey()!.querySelector(selector)!.textContent||'');
    check(evidence.includes(locale==='vi'?'Đã nộp':'Submitted'),id+' saved evidence missing submission');
    check(!!journey()!.querySelector('[data-li-reasoning-export="'+id+'"] button'),id+' saved receipt export absent');
    const receipt=buildReasoningReceipt(id,attempt);
    check(receipt?.responses[0].answer===marker&&receipt.assistance==='unknown'&&receipt.untrainedTransferMeasured===false&&receipt.selfReview?.[0].rating===2,id+' incorrect saved receipt');
    check(receipt?.responses[0].question===null&&receipt?.selfReview?.[0].criterion===null,id+' fabricated historical question or rubric');
    check(!JSON.stringify(receipt).includes('qa-bilingual-fixture'),id+' account identifier in receipt');
    check(evidence.includes(locale==='vi'?'Lượt hoàn tất tự đánh giá (gồm lịch sử): 1':'Completed self-review rounds (including saved history): 1'),id+' saved evidence wrong completed count');
    check(evidence.includes(locale==='vi'?'Chưa có ghi nhận trong bài này':'Not recorded in this lesson'),id+' invented spell application');
    check(evidence.includes('T06 × 2')===(id==='L03-1-2'),id+' incorrect lesson Spellbook history');
     evidenceChecks++;reviewChecks++;
   }
   // One representative per real reader implementation: no answers needed
   // to remember the last page; preserve saved scroll on a fresh mount.
   if(['L03-1-2','L09-1-2',Object.keys(titles.lessons).find(x=>!!drafts.find(d=>d.id===x))].includes(id)){
    const records=new Map<string,ReadingPosition>();
    const uid='qa-bilingual-fixture';
    ports.readingPosition={
     load:({lessonId,subjectId})=>records.get(readingPositionKey(lessonId,subjectId)),
     save:({lessonId,subjectId,position})=>{records.set(readingPositionKey(lessonId,subjectId),position);},
     clear:({lessonId,subjectId})=>{records.delete(readingPositionKey(lessonId,subjectId));}
    };
    attempt=initial();revision++;
    render(id+'-position-start');
    await until(()=>journey()?.dataset.liLessonPhase==='read'&&records.get(readingPositionKey(id,uid))?.phase==='read',id+' blank reader');
    click('.li-study-book-next');
    await until(()=>journey()?.dataset.liLessonPhase==='guided'&&records.get(readingPositionKey(id,uid))?.phase==='guided',id+' save reading-only page');
    const top=Math.min(160,Math.max(0,document.documentElement.scrollHeight-window.innerHeight));
    check(top>0,id+' position fixture requires scrollable page');
    window.scrollTo(0,top);
    await until(()=>Math.abs((records.get(readingPositionKey(id,uid))?.top??-100)-top)<3,id+' save scroll offset');
    check(!attempt.submitted&&!attempt.reviewed&&attempt.draft.every(x=>!x)&&!attempt.guidedDraft,id+' position altered attempt');
    check(readPosition(ports,id,'qa-other-owner',attempt)===null,id+' position leaked across accounts');
    check(readPosition(ports,id,uid,{...attempt,attemptNumber:2})===null,id+' stale round position reused');
    check(records.get(readingPositionKey(id,uid))?.stamp===readingStamp(attempt),id+' wrong position stamp');
    window.scrollTo(0,0);
    // Capture a genuine route-away unmount without overwriting the recorded
    // offset with the new page's zero; remount from the saved position.
    render(id+'-position-restored');
    await until(()=>journey()?.dataset.liLessonPhase==='guided'&&Math.abs(window.scrollY-top)<3,id+' restored page and scroll');
    resumeChecks++;
    // Exercise the real reader CTA and its return contract through an isolated
    // navigation port; native engine practice is checked independently.
    attempt=structuredClone(saved);revision++;records.clear();
    render(id+'-guide-start');
    await until(()=>Array.from(journey()?.querySelectorAll('textarea')||[]).some(x=>x.value===marker),id+' guide draft loaded');
    for(let i=0;i<5&&journey()?.dataset.liLessonPhase!=='guided';i++){
     const previous=journey()?.dataset.liLessonPhase;
     click('.li-study-book-previous');
     await until(()=>journey()?.dataset.liLessonPhase!==previous,id+' navigate to guide');
    }
    await until(()=>journey()?.dataset.liLessonPhase==='guided',id+' guide phase');
    const guide=Array.from(journey()!.querySelectorAll<HTMLButtonElement>('button')).find(b=>
     lesson?b.textContent?.includes('Xem Sổ Tay Thần Chú'):b.classList.contains('li-lesson-spell-action'));
    check(!!guide,id+' missing guide CTA');
    if(guide!.closest('details'))guide!.closest('details')!.open=true;
    await until(()=>!guide!.disabled,id+' guide enabled');
    // Wait for the new reader's two-frame position initialization before
    // issuing a user-like scroll; the phase attribute can appear earlier.
    await until(()=>records.get(readingPositionKey(id,uid))?.phase==='guided',id+' guide position initialized');
    await nextFrame();await nextFrame();await nextFrame();
    const guideTop=Math.min(120,Math.max(0,document.documentElement.scrollHeight-window.innerHeight));
    check(guideTop>0,id+' guide fixture requires scrollable page');
    window.scrollTo({top:guideTop,left:0,behavior:'instant'});
    await until(()=>Math.abs(window.scrollY-guideTop)<3&&records.get(readingPositionKey(id,uid))?.phase==='guided'&&Math.abs((records.get(readingPositionKey(id,uid))?.top??-100)-guideTop)<3,id+' guide position saved');
    const bridge=window as unknown as {liMethods?:{open:(m:string,p?:boolean,l?:string)=>boolean};LiSpellPractice?:{setLessonContext?:(id:string)=>boolean}};
    const oldMethods=bridge.liMethods,oldPractice=bridge.LiSpellPractice;
    const html=document.documentElement,wasVerified=html.classList.contains('li-auth-verified'),wasAccount=html.classList.contains('li-account-open');
    const calls:{method:string;practice:boolean;lessonId?:string}[]=[];
    const contexts:string[]=[];
    const tokenKey='li.sectioned.guide-return.v1',oldToken=sessionStorage.getItem(tokenKey);
    try{
     html.classList.add('li-auth-verified');html.classList.remove('li-account-open');
     bridge.liMethods={open:(m,p,l)=>{calls.push({method:m,practice:!!p,lessonId:l});return true;}};
     bridge.LiSpellPractice={...oldPractice,setLessonContext:l=>{contexts.push(l);return true;}};
     guide!.click();
     check(calls.length===1&&/^T[0-9]{2}$/.test(calls[0].method),id+' wrong guide method: '+JSON.stringify(calls));
     check(lesson?contexts.length===1&&contexts[0]===id&&!calls[0].practice:
      calls[0].lessonId===id&&calls[0].practice,id+' wrong guide lesson context');
     if(lesson){
      const token=JSON.parse(sessionStorage.getItem(tokenKey)||'null');
      check(token?.id===id&&token.owner===uid&&token.method===calls[0].method,id+' missing scoped return token');
     }
     root.render(null);
     await until(()=>!journey(),id+' leave reader');
     window.scrollTo(0,0);
     render(id+'-guide-return');
     await until(()=>journey()?.dataset.liLessonPhase==='guided'&&
      Array.from(journey()?.querySelectorAll('textarea')||[]).some(x=>x.value===marker)&&Math.abs(window.scrollY-guideTop)<3,id+' returned guide draft and scroll');
     check(attempt.guidedDraft===marker&&attempt.draft[0]===marker&&!attempt.submitted&&!attempt.reviewed,id+' guide changed independent attempt');
     click('.li-study-book-next');
     await until(()=>journey()?.dataset.liLessonPhase==='practice',id+' optional guide did not gate independent exercise');
     guideReturnChecks++;
    }finally{
     bridge.liMethods=oldMethods;bridge.LiSpellPractice=oldPractice;
     html.classList.toggle('li-auth-verified',wasVerified);html.classList.toggle('li-account-open',wasAccount);
     if(oldToken===null)sessionStorage.removeItem(tokenKey);else sessionStorage.setItem(tokenKey,oldToken);
    }
   }
   readers++;
   console.log('BILINGUAL_READER_PASS '+id+' 5 phases × VI→EN→VI; saved drafts unchanged');
  }
  return {status:'PASS',readers,checks,reviewChecks,evidenceChecks,resumeChecks,guideReturnChecks,scope:'actual reader render, pre-submit phases and completed receipt render, in-memory locale persistence and simulated guide navigation; not physical device or live cloud'};
 }finally{root.unmount();app.LiSpellPractice=priorSpell;}
}
