import {useEffect,useRef} from 'react';
import type {Attempt} from '../native-bridge.js';
import type {LearningPorts} from './ports.js';
import {readingPages,readingStamp,type ReadingPage,type ReadingPosition} from './reading-position.js';

type ReadingOptions={
 ports:LearningPorts;subjectId:string|null;attempt:Attempt|null;ready:boolean;
 locale:'vi'|'en';resume:{current:ReadingPosition|null};
};
/** One existing reader page/focus owner. Device-only position is separate
 * from the saved assessment and never writes learner progress.
 */
export function useStepScreen(phase:string,lessonId:string,options?:ReadingOptions){
 const previous=useRef<string|null>(null);
 const latest=useRef(options);latest.current=options;
 useEffect(()=>{
  if(options&&!options.ready)return;
  const prior=previous.current;
  previous.current=phase;
  const port=options?.ports.readingPosition,uid=options?.subjectId;
  const root=()=>Array.from(document.querySelectorAll<HTMLElement>('[data-li-react-journey]'))
    .find(node=>node.dataset.liReactJourney===lessonId);
  const active=()=>{
   const node=root(),page=node?.closest('section.page');
   return !!node&&(!page||page.classList.contains('active'));
  };
  let top=0,tracking=false,timer:number|undefined,frame2=0;
  const flush=()=>{
   if(timer!==undefined){window.clearTimeout(timer);timer=undefined;}
   const current=latest.current;
   if(!tracking||!port||!uid||current?.subjectId!==uid||!current.attempt||
    !readingPages.includes(phase as ReadingPage))return;
   try{port.save({lessonId,subjectId:uid,position:{
    phase:phase as ReadingPage,top,locale:current.locale,stamp:readingStamp(current.attempt)
   }});}catch{/* Position persistence is optional; answers use their own durable port. */}
  };
  const capture=()=>{
   if(!tracking||!active())return;
   top=Math.max(0,Math.round(window.scrollY));
   if(timer===undefined)timer=window.setTimeout(flush,150);
  };
  const leave=()=>{if(tracking&&active())top=Math.max(0,Math.round(window.scrollY));flush();};
  const frame=requestAnimationFrame(()=>{
   frame2=requestAnimationFrame(()=>{
    if(!active())return;
    const node=root(),current=node?.querySelector<HTMLElement>('.li-learning-current');
    const pending=options?.resume.current;
    if(pending?.phase===phase){
     // A locale change keeps the page but not a pixel offset for different text.
     if(pending.locale===options?.locale)window.scrollTo({top:pending.top,left:0,behavior:'instant'});
     else window.scrollTo({top:0,left:0,behavior:'instant'});
     if(options)options.resume.current=null;
    }else if(current&&((prior!==null&&prior!==phase)||(prior===null&&phase!=='read'))){
     current.scrollIntoView({block:'start',behavior:'auto'});
     const heading=current.querySelector<HTMLElement>('h2');
     if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
    }
    top=Math.max(0,Math.round(window.scrollY));tracking=true;flush();
   });
  });
  if(port&&uid){
   window.addEventListener('scroll',capture,{passive:true});
   window.addEventListener('pagehide',leave);
   document.addEventListener('visibilitychange',leave);
  }
  return()=>{
   cancelAnimationFrame(frame);cancelAnimationFrame(frame2);
   window.removeEventListener('scroll',capture);
   window.removeEventListener('pagehide',leave);
   document.removeEventListener('visibilitychange',leave);
   // Router resets window scroll before unmount; persist the last captured
   // active lesson offset, never the destination page's reset position.
   flush();
  };
 },[phase,lessonId,options?.ready,options?.subjectId,options?.locale]);
}
