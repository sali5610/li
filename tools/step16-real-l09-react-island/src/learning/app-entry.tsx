import React,{useEffect,useState} from 'react';
import {localized,useDiscoveryLocale} from '../shell/discovery-locale';
import {createRoot} from 'react-dom/client';
import {LearningJourney} from './LearningJourney';
import {Wave1Journey} from './Wave1Journey';
import {EditorialJourney} from './EditorialJourney';
import {SectionedJourney,validateSectionedLesson} from './SectionedJourney';
import type {SectionedLesson} from './SectionedJourney';
import {isReleasedLessonId} from './released-lessons';
import type {LearningPorts} from './ports';
import '../../../../design-system/react/atoms.css';
import '../../../../design-system/react/controls.css';
import '../../../../design-system/react/components.css';
import '../../../../design-system/react/molecules.css';
import '../../../../design-system/react/focus.css';

/** Mount into Chat 1's existing lesson route (not a second app).
 * Chat 3 must supply the real invited-user/Neon/Dexie persistence owner.
 * Chat 4 must supply real search. No fallback to fake accounts or progress.
 */
export function mountLearningJourney(host:HTMLElement,ports:LearningPorts):()=>void{
 if(!host?.isConnected)throw Error('LEARNING_HOST_DISCONNECTED');
 if(!ports?.auth?.requireInvitedLearner||!ports?.attempts?.load||
    !ports?.attempts?.save||!ports?.sync?.getStatus||
    !ports?.navigation?.openCatalog||!ports?.search?.openSearch){
  throw Error('LEARNING_REAL_PORTS_REQUIRED');
 }
 const root=createRoot(host);
 root.render(<LearningJourney ports={ports}/>);
 return ()=>root.unmount();
}


/** Real React L03/L15 routes share the invited L09 attempt/save/sync ports. */
export function mountWave1Journey(host:HTMLElement,
 id:'L03-1-2'|'L15-2-2',ports:LearningPorts):()=>void{
 if(!host?.isConnected||!ports?.auth?.requireInvitedLearner||
  !ports?.attempts?.load||!ports?.attempts?.save||!ports?.sync?.getStatus)
  throw Error('WAVE1_REAL_PORTS_REQUIRED');
 const root=createRoot(host);
 root.render(<Wave1Journey id={id} ports={ports}/>);
 return()=>root.unmount();
}


type EditorialRouteState=
 |{kind:'loading'}|{kind:'structured'}|{kind:'sectioned';lesson:SectionedLesson}
 |{kind:'error'};
function ReleasedEditorialRoute({id,ports}:{id:string;ports:LearningPorts}){
 const locale=useDiscoveryLocale();
 const [status,setStatus]=useState<EditorialRouteState>({kind:'loading'});
 useEffect(()=>{
  let alive=true;
  (async()=>{
   if(!isReleasedLessonId(id))throw Error('LESSON_NOT_RELEASED');
   await ports.auth.requireInvitedLearner();
   // The canonical packed lesson is the ONLY format router. Never load
   // content/editorial draft files, Notion or a query-param-provided JSON.
   const url=new URL('./assets/li-content-adapter.mjs',document.baseURI).href;
   const m=await import(/* @vite-ignore */ url) as {
    contentClient?:{getLesson:(lessonId:string)=>Promise<unknown>}
   };
   if(!m.contentClient?.getLesson)throw Error('CONTENT_PACK_CLIENT_UNAVAILABLE');
   const raw=await m.contentClient.getLesson(id);
   if(!raw||typeof raw!=='object')throw Error('EDITORIAL_PACK_MISSING');
   const data=raw as {content?:{format?:string}};
   if(!alive)return;
   if(data.content?.format==='editorial-structured-v1'){
    setStatus({kind:'structured'});return;
   }
   if(data.content?.format==='editorial-sectioned-v1'){
    setStatus({kind:'sectioned',lesson:validateSectionedLesson(raw,id)});return;
   }
   throw Error('EDITORIAL_FORMAT_NOT_RELEASED');
  })().catch(()=>{if(alive)setStatus({kind:'error'});});
  return()=>{alive=false;};
 },[id,ports]);
 if(status.kind==='loading')return <section role="status" className="li-learning-journey"
  aria-busy="true">{localized(locale,'Đang xác minh bài học và quyền truy cập…','Verifying the lesson and your access…')}</section>;
 if(status.kind==='error')return <section role="alert" className="li-learning-journey">
  <p>{localized(locale,'Bài học chưa đủ điều kiện phát hành hoặc không đọc được content pack.','This lesson is unavailable or its content could not be loaded.')}</p>
  <button onClick={ports.navigation.openCatalog}>{localized(locale,'Về Tàng Thư','Back to Library')}</button>
 </section>;
 if(status.kind==='sectioned')return <SectionedJourney lesson={status.lesson} ports={ports}/>;
 return <EditorialJourney id={id} ports={ports}/>;
}

/** Single future structured-lesson renderer, mounted only for explicit
 * catalog + manifest authorized IDs by the same verified invited router.
 * No standalone preview URL or alternate database path.
 */
export function mountEditorialJourney(host:HTMLElement,id:string,ports:LearningPorts):()=>void{
 if(!host?.isConnected||!isReleasedLessonId(id)||
  !ports?.auth?.requireInvitedLearner||!ports?.attempts?.load||
  !ports?.attempts?.save||!ports?.sync?.getStatus||
  !ports?.navigation?.openCatalog||!ports?.search?.openSearch)
   throw Error('EDITORIAL_LEARNER_RELEASE_OR_PORTS_REQUIRED');
 const root=createRoot(host);
 root.render(<ReleasedEditorialRoute id={id} ports={ports}/>);
 return()=>root.unmount();
}
