import {useEffect,useRef} from 'react';

/** A phase transition is one visible learning page, not another scroll section.
 * Preserve answer state and focus the newly opened page for keyboard/VoiceOver.
 */
export function useStepScreen(phase:string,lessonId:string){
 const previous=useRef<string|null>(null);
 useEffect(()=>{
  if(previous.current===null){previous.current=phase;return;}
  if(previous.current===phase)return;
  previous.current=phase;
  const frame=requestAnimationFrame(()=>{
   const root=Array.from(document.querySelectorAll<HTMLElement>('[data-li-react-journey]'))
    .find(node=>node.dataset.liReactJourney===lessonId);
   const page=root?.closest('section.page');
   // Do not steal scroll/focus while another app route is active.
   if(page&&!page.classList.contains('active'))return;
   const current=root?.querySelector<HTMLElement>('.li-learning-current');
   if(!current)return;
   current.scrollIntoView({block:'start',behavior:'auto'});
   const heading=current.querySelector<HTMLElement>('h2');
   if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  });
  return()=>cancelAnimationFrame(frame);
 },[phase,lessonId]);
}
