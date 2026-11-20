import {useStore} from 'zustand';
import {createStore} from 'zustand/vanilla';

/** Reactive presentation state shared between separate React roots.
 * The canonical app router and persisted learner ports remain the owners.
 * Never persist this store or duplicate private lesson data in it.
 */
export type LessonPhase='read'|'guided'|'practice'|'feedback'|'progress';
export type AppUiState={
 route:string;
 lessonPhase:LessonPhase|null;
 setRoute:(route:string)=>void;
 setLessonPhase:(phase:LessonPhase|null)=>void;
};
export const appUiStore=createStore<AppUiState>()((set,get)=>({
 route:'home',
 lessonPhase:null,
 setRoute:(route)=>{
  if(route&&get().route!==route)set({route});
 },
 setLessonPhase:(lessonPhase)=>{
  if(get().lessonPhase!==lessonPhase)set({lessonPhase});
 }
}));
export function useAppUiStore<T>(selector:(state:AppUiState)=>T):T{
 return useStore(appUiStore,selector);
}
