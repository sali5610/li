import {createActor,setup} from 'xstate';

/** T03 React progression. Native exercise remains the only grader/feedback
 * owner; verified output (not a click) permits an XState transition. */
export type FadedT03Stage='example'|'guided'|'independent'|'reviewed';
export type SpellT03View={active:string;phase:number;reviewedInSession:boolean;viewSession:number};
export type SpellT03Answers=Record<string,string|string[]>;
export type SpellT03Port={
 getView:()=>SpellT03View|null;
 perform:(action:string,answers?:SpellT03Answers)=>boolean;
};
type Evidence={phase:number;reviewed:boolean};
type FlowEvent=({type:'HYDRATE'}&Evidence)|({type:'NEXT'}&Evidence)|
 ({type:'CHECK'}&Evidence)|{type:'RESET'};
export const fadedT03Machine=setup({
 types:{events:{} as FlowEvent}
}).createMachine({
 id:'li-t03-faded-examples',initial:'example',
 on:{
  RESET:{target:'.example'},
  HYDRATE:[
   {guard:({event})=>event.phase===2&&event.reviewed,target:'.reviewed'},
   {guard:({event})=>event.phase===2,target:'.independent'},
   {guard:({event})=>event.phase===1&&!event.reviewed,target:'.guided'},
   {target:'.example'}
  ]
 },
 states:{
  example:{on:{NEXT:{
   guard:({event})=>event.phase===1&&!event.reviewed,target:'guided'
  }}},
  guided:{on:{CHECK:{
   guard:({event})=>event.phase===2&&!event.reviewed,target:'independent'
  }}},
  independent:{on:{CHECK:{
   guard:({event})=>event.phase===2&&event.reviewed,target:'reviewed'
  }}},
  reviewed:{}
 }
});
export const fadedT03Phase=(stage:FadedT03Stage):number=>
 stage==='example'?0:stage==='guided'?1:2;
export function createFadedT03Flow(){
 const actor=createActor(fadedT03Machine).start();
 let session:number|null=null;
 const getSnapshot=():FadedT03Stage=>actor.getSnapshot().value as FadedT03Stage;
 const subscribe=(notify:()=>void)=>{
  const sub=actor.subscribe(notify);
  return ()=>sub.unsubscribe();
 };
 const isCurrent=(view:SpellT03View|null)=>
  !!view&&view.active==='T03'&&session===view.viewSession;
 function sync(view:SpellT03View|null):void{
  if(!view||view.active!=='T03'){
   if(session!==null){session=null;actor.send({type:'RESET'});}
   return;
  }
  if(session!==view.viewSession){
   session=view.viewSession;
   actor.send({type:'HYDRATE',phase:view.phase,reviewed:view.reviewedInSession});
  }
 }
 function execute(action:string,answers:SpellT03Answers,port:SpellT03Port|null|undefined):boolean{
  if(!port)return false;
  const before=port.getView();
  if(!before||before.active!=='T03')return false;
  sync(before);
  if(action==='reset'){
   const accepted=port.perform(action,answers);
   if(accepted)sync(port.getView());
   return accepted;
  }
  const stage=getSnapshot();
  if(!((action==='next'&&stage==='example')||
       (action==='check'&&['guided','independent','reviewed'].includes(stage))))return false;
  const accepted=port.perform(action,answers);
  if(!accepted)return false;
  const after=port.getView();
  if(!after||after.active!=='T03'||after.viewSession!==before.viewSession)return false;
  const evidence={phase:after.phase,reviewed:after.reviewedInSession};
  if(action==='next')actor.send({type:'NEXT',...evidence});
  if(action==='check')actor.send({type:'CHECK',...evidence});
  return true;
 }
 return {subscribe,getSnapshot,isCurrent,sync,execute,stop:()=>{actor.stop();}};
}
