import {assign,createActor,setup} from 'xstate';
import type {LessonPhase} from '../shell/app-store.js';

/** One L09 learning flow: state-machine owns progression gates,
 * existing invited Dexie/Neon ports own actual saved attempts.
 * COMMIT is sent only after a successful persisted save or verified load.
 */
type LessonEvent=
 |{type:'COMMIT';submitted:boolean;reviewed:boolean}
 |{type:'OPEN';phase:LessonPhase};
type LessonContext={submitted:boolean;reviewed:boolean};
export const lessonPhaseMachine=setup({
 types:{
  context:{} as LessonContext,
  events:{} as LessonEvent
 }
}).createMachine({
 id:'li-l09-learning-flow',
 initial:'read',
 context:{submitted:false,reviewed:false},
 on:{
  COMMIT:{
   actions:assign(({event})=>({
    submitted:event.submitted,
    reviewed:event.submitted&&event.reviewed
   }))
  },
  OPEN:[
   {guard:({event})=>event.phase==='read',target:'.read'},
   {guard:({event})=>event.phase==='guided',target:'.guided'},
   {guard:({event})=>event.phase==='practice',target:'.practice'},
   {guard:({context,event})=>event.phase==='feedback'&&context.submitted,target:'.feedback'},
   {guard:({context,event})=>event.phase==='progress'&&context.submitted&&context.reviewed,target:'.progress'}
  ]
 },
 states:{read:{},guided:{},practice:{},feedback:{},progress:{}}
});
export function createLessonPhaseActor(){
 return createActor(lessonPhaseMachine).start();
}
