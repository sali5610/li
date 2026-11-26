import {lessonTitles,lessonTitle,lessonTitleAliases} from './lesson-titles.js';
import {discoveryLocale} from '../shell/discovery-locale.js';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {SectionedJourney} from './SectionedJourney';
import type {SectionedLesson} from './SectionedJourney';
import {createStagingLearningPorts} from './staging-ports';
import {personalStudyLessonIds,personalStudyRoute} from './released-lessons';
import catalog from '../../../../content/curriculum/legacy-catalog.v1.json';
import '../../../../design-system/react/atoms.css';
import '../../../../design-system/react/components.css';
import '../../../../design-system/react/controls.css';
import './journey.css';

/** Same catalog → lesson route and same invited-account progress sync.
 * These manuscripts remain proposed drafts: the adapter changes presentation
 * only, never the source JSON, public course packs or production release.
 */
type Manuscript={
 id:string;title:{sourceTitle:string};publishState:string;reviewState:string;
 rights:{releaseAuthorized:boolean};
 content:{format:string;localized:Record<'vi'|'en',{
   intro_md:string;
   sections:Array<{role:string;heading:string;body_md:string;
    feedback_md?:string|null;feedback_gate?:string}>;
   assessment:{questions:string[];rubricCriteria:string[][]}
  }>;technique:{primary:string};companion:{structuredMoments:unknown[]}};
};
const manuscripts=import.meta.glob('../../../../content/editorial/normalized/*.draft.v1.json',
 {eager:true,import:'default'}) as Record<string,unknown>;
const byId=new Map(Object.values(manuscripts).map(raw=>{
 const d=raw as Manuscript;return [d.id,d] as const;
}));
const catalogLessons=new Map(catalog.groups.flatMap(g=>g.fields.flatMap(f=>
 f.courses.flatMap(c=>c.lessons.map(l=>[l.id,{title:l.title,field:f.name}] as const)))));

/** Search the same 17 real personal manuscripts that power Catalog → Lesson.
 * A result is a content match, NOT a certified academic answer.
 */
export function searchPersonalStudy(query:string):Array<{
 id:string;title:string;context:string
}>{
 if(import.meta.env.VITE_LI_AUTH_TARGET!=='github-pages-staging')return [];
 const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/đ/gi,'d').toLocaleLowerCase('vi').replace(/\s+/g,' ').trim();
 const q=normalize(query),tokens=q.split(' ').filter(t=>t.length>=2);
 if(!q||tokens.length===0)return [];
 return personalStudyLessonIds.map(id=>{
  const draft=byId.get(id),entry=catalogLessons.get(id);
  if(!draft||!entry)return null;
  const title=normalize(lessonTitleAliases(id,entry.title)),code=normalize(id);
  const source=draft.content.localized;
  const body=normalize([source.vi?.intro_md||'',source.en?.intro_md||'',
   ...(['vi','en'] as const).flatMap(loc=>
    (source[loc]?.sections||[]).map(s=>s.heading+' '+s.body_md))].join(' '));
  const context=normalize(entry.field);
  const course=catalog.groups.flatMap(g=>g.fields.flatMap(f=>f.courses))
   .find(c=>c.lessons.some(l=>l.id===id))?.title||'';
  const searchable=title+' '+code+' '+context+' '+normalize(course)+' '+body;
  const matched=tokens.filter(t=>searchable.includes(t));
  if(matched.length!==tokens.length)return null;
  const score=code===q?150:title.includes(q)?110:
   code.includes(q)?100:normalize(course).includes(q)?75:
   tokens.every(t=>(title+' '+context+' '+normalize(course)).includes(t))?65:25;
  return {id,title:lessonTitle(id,discoveryLocale(),entry.title),context:entry.field+' · '+course,score};
 }).filter((x):x is {id:string;title:string;context:string;score:number}=>x!==null)
  .sort((a,b)=>b.score-a.score)
  .slice(0,17).map(({id,title,context})=>({id,title,context}));
}

function lessonForStudy(id:string):SectionedLesson{
 if(!personalStudyRoute(id))throw Error('PERSONAL_LESSON_NOT_IN_STAGING_CATALOG');
 const d=byId.get(id);
 if(!d||d.id!==id||d.publishState!=='draft'||d.reviewState!=='proposed'||
  d.rights?.releaseAuthorized!==false||d.content?.format!=='editorial-sectioned-draft-v1'||
  !(['vi','en'] as const).every(loc=>{
   const c=d.content.localized[loc];
   return c?.intro_md?.trim()&&Array.isArray(c.sections)&&
    c.sections.some(x=>x.role==='guided')&&
    c.sections.some(x=>x.role==='methods'&&!!x.feedback_md&&
     x.feedback_gate==='AFTER_MEANINGFUL_METHOD_ATTEMPT')&&
    c.sections.some(x=>x.role==='independent')&&
    c.assessment?.questions?.length===4&&c.assessment?.rubricCriteria?.length===4;
  })||d.content.companion?.structuredMoments?.length!==6)
  throw Error('PERSONAL_STUDY_MANUSCRIPT_INCOMPLETE '+id);
 const catalogEntry=catalogLessons.get(id);
 if(!catalogEntry)throw Error('PERSONAL_STUDY_NOT_IN_REAL_CATALOG '+id);
 const field=catalogEntry.field;
 return {...d,
  version:'personal-study-2026-11-21-'+id,
  title:lessonTitles(id)??(()=>{throw Error('PERSONAL_LESSON_TITLE_MISSING '+id)})(),
  hierarchy:{field:{title:field}},
  content:{...d.content,format:'editorial-sectioned-v1'}
 } as unknown as SectionedLesson;
}
/** Staging-only normal route hosts. Reuse React lesson, Neon invite guard and
 * existing account-scoped learning persistence — NOT a second preview store.
 */
export function mountPersonalStudyRoutes():void{
 if(import.meta.env.VITE_LI_AUTH_TARGET!=='github-pages-staging')return;
 const main=document.getElementById('main');
 if(!main)throw Error('PERSONAL_STUDY_MAIN_MISSING');
 // This map exists in invited staging ONLY. Neither production nor static
 // catalog publication status grants access to personal draft manuscripts.
 const routeMap=Object.fromEntries(personalStudyLessonIds.map(id=>
  [id,personalStudyRoute(id)!]));
 const app=window as Window&{
  liPersonalStudyRoutes?:Readonly<Record<string,string>>;
  liAppRouter?:{navigate:(id:string,options?:{
   focus?:boolean;remember?:boolean;syncUrl?:boolean
  })=>boolean};
 };
 app.liPersonalStudyRoutes=Object.freeze(routeMap);
 for(const id of personalStudyLessonIds){
  const route=personalStudyRoute(id);
  if(!route)throw Error('PERSONAL_STUDY_ROUTE_MISSING '+id);
  if(document.getElementById('page-'+route))throw Error('PERSONAL_STUDY_DUPLICATE_ROUTE '+id);
  const lesson=lessonForStudy(id);
  const page=document.createElement('section');
  page.id='page-'+route;
  page.className='page';
  page.tabIndex=-1;
  page.setAttribute('aria-label','Bài học '+id);
  const host=document.createElement('div');
  host.className='section-shell';
  host.id='li-react-'+route+'-host';
  page.append(host);main.append(page);
  const ports=createStagingLearningPorts(id);
  let dispose:(()=>void)|null=null;
  const update=()=>{
   const allowed=document.documentElement.classList.contains('li-auth-verified');
   const active=page.classList.contains('active');
   if(allowed&&active&&!dispose){
    const root=createRoot(host);
    root.render(<SectionedJourney lesson={lesson} ports={ports} preview/>);
    dispose=()=>root.unmount();
   }else if((!allowed||!active)&&dispose){
    dispose();dispose=null;
   }
  };
  const observer=new MutationObserver(update);
  observer.observe(page,{attributes:true,attributeFilter:['class']});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  update();
 }
 // A bookmarked personal lesson must resume after an authenticated reload,
 // not silently drop the learner at Home. Never bypass the invited-account
 // guard; do not override a route chosen while signing in.
 const requested=new URLSearchParams(window.location.search).get('lesson');
 const direct=requested?app.liPersonalStudyRoutes?.[requested]:undefined;
 if(direct){
  const resume=()=>{
   if(!document.documentElement.classList.contains('li-auth-verified')||
    document.documentElement.classList.contains('li-account-open')||
    !document.getElementById('page-home')?.classList.contains('active'))return;
   if(app.liAppRouter?.navigate(direct,{remember:false,syncUrl:false})){
    observer.disconnect();
    window.removeEventListener('li:auth-verified-changed',resume);
   }
  };
  const observer=new MutationObserver(resume);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  window.addEventListener('li:auth-verified-changed',resume);
  resume();
 }
}
