// CI-only: actual learner components, in-memory QA ports. No real auth/data or production route.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {SectionedJourney,type SectionedLesson} from '../src/learning/SectionedJourney';
import {Wave1Journey} from '../src/learning/Wave1Journey';
import {LearningJourney} from '../src/learning/LearningJourney';
import {initial,type Attempt} from '../src/native-bridge';
import type {LearningPorts} from '../src/learning/ports';
import {lessonTitles} from '../src/learning/lesson-titles';
import titles from '../../../content/editorial/lesson-titles.v1.json';
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
type FixtureApp={liLanguage:{get:()=>string;set:(locale:'vi'|'en')=>void}};
export async function runBilingualReaderFixture(host:HTMLElement){
 const app=window as unknown as FixtureApp;
 let checks=0,readers=0,reviewChecks=0;
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
      const authored=source[locale].assessment?.questions??source[locale].questions;
      const labels=Array.from(node.querySelectorAll('textarea')).map(x=>plain(Array.from(x.labels||[]).map(y=>y.textContent||'').join(' ')));
      check(authored.length===4&&authored.every((q:string,i:number)=>labels.some(l=>l.includes(plain(q).slice(0,Math.min(35,plain(q).length))))),id+' '+locale+' actual question text mismatch');
     }
     if(phase==='read'){
      check(!!node.querySelector('.li-learning-sources'),id+' missing sources');
      check((locale==='vi'?/Gợi ý tìm kiếm|Từ khóa tìm/:/Suggested searches|Search keywords|Research keywords/).test(node.querySelector('.li-learning-query-details summary')?.textContent||''),id+' query labels');
     }
     checks++;
    }
    if(i<phases.length-1){click('.li-study-book-next');await until(()=>journey()?.dataset.liLessonPhase===phases[i+1],id+' next '+phase);}
   }
   // Load a separate completed fixture receipt; confirm full feedback/rubric and progress in both locales.
   attempt={...structuredClone(saved),submitted:true,submittedAt:'2026-11-26T00:00:00Z',submission:[...saved.draft],submissionLocale:'vi',ratings:[2,1,2,1],reviewed:true,answerRevealed:true};
   revision++;
   render(id+'-reviewed');
   await until(()=>journey()?.dataset.liReactJourney===id&&journey()?.dataset.liLessonPhase==='progress',id+' completed fixture');
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
   for(const locale of locales){app.liLanguage.set(locale);await until(()=>journey()?.lang===locale&&attempt.locale===locale,id+' completed progress '+locale);check(attempt.reviewed&&attempt.submission?.[0]===marker,id+' completion lost');reviewChecks++;}
   readers++;
   console.log('BILINGUAL_READER_PASS '+id+' 5 phases × VI→EN→VI; saved drafts unchanged');
  }
  return {status:'PASS',readers,checks,reviewChecks,scope:'actual reader render, pre-submit phases and completed receipt render, in-memory locale persistence; not physical device or live cloud'};
 }finally{root.unmount();}
}
