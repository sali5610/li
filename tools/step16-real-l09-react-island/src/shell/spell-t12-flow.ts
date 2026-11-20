import {createActor,setup} from 'xstate';

/** T12 attention re-entry: React's XState actor guards progression.
 * LiSpellPractice remains the only owner of the cue, validation and feedback.
 * This technique is SESSION-LOCAL: it is not a durable cross-device reminder.
 */
export type ResumeStage='capture'|'resume'|'reviewed';
export type ResumeView={
 active:string;
 phase:number;
 reviewedInSession:boolean;
 resumeNote:string;
 viewSession:number;
};
export type ResumeAnswers=Record<string,string|string[]>;
export type ResumePort={
 getView:()=>ResumeView|null;
 perform:(action:string,answers?:ResumeAnswers)=>boolean;
};
type Evidence={phase:number;reviewed:boolean;note:string};
type ResumeEvent=({type:'HYDRATE'|'PAUSE'|'REVIEW'}&Evidence)|{type:'RESET'};
const ready=(event:Evidence)=>event.phase===1&&typeof event.note==='string'&&!!event.note.trim();
export const resumeT12Machine=setup({
 types:{events:{} as ResumeEvent}
}).createMachine({
 id:'li-t12-attention-reentry',
 initial:'capture',
 on:{
  RESET:{target:'.capture'},
  HYDRATE:[
   {guard:({event})=>ready(event)&&event.reviewed,target:'.reviewed'},
   {guard:({event})=>ready(event)&&!event.reviewed,target:'.resume'},
   {target:'.capture'}
  ]
 },
 states:{
  capture:{on:{
   PAUSE:{guard:({event})=>ready(event)&&!event.reviewed,target:'resume'}
  }},
  resume:{on:{
   REVIEW:{guard:({event})=>ready(event)&&event.reviewed,target:'reviewed'}
  }},
  reviewed:{}
 }
});
export const resumeT12Phase=(stage:ResumeStage):number=>stage==='capture'?0:1;

export function createResumeT12Flow(){
 const actor=createActor(resumeT12Machine).start();
 let session:number|null=null;
 const getSnapshot=():ResumeStage=>actor.getSnapshot().value as ResumeStage;
 const subscribe=(notify:()=>void)=>{
  const sub=actor.subscribe(notify);
  return ()=>sub.unsubscribe();
 };
 const isCurrent=(view:ResumeView|null)=>
  !!view&&view.active==='T12'&&view.viewSession===session;
 const evidence=(view:ResumeView):Evidence=>({
  phase:view.phase,reviewed:view.reviewedInSession,note:view.resumeNote
 });
 function sync(view:ResumeView|null):void{
  if(!view||view.active!=='T12'){
   if(session!==null){session=null;actor.send({type:'RESET'});}
   return;
  }
  if(session!==view.viewSession){
   session=view.viewSession;
   actor.send({type:'HYDRATE',...evidence(view)});
  }
 }
 function execute(action:string,answers:ResumeAnswers,port:ResumePort|null|undefined):boolean{
  if(!port)return false;
  const before=port.getView();
  if(!before||before.active!=='T12')return false;
  sync(before);
  if(action==='reset'){
   const accepted=port.perform(action,answers);
   if(accepted)sync(port.getView());
   return accepted;
  }
  const stage=getSnapshot();
  if(!((action==='next'&&stage==='capture')||
       (action==='check'&&(stage==='resume'||stage==='reviewed'))))return false;
  // Native perform returns true even when field validation fails.
  const accepted=port.perform(action,answers);
  if(!accepted)return false;
  const after=port.getView();
  if(!after||after.active!=='T12'||after.viewSession!==before.viewSession)return false;
  if(action==='next'){
   actor.send({type:'PAUSE',...evidence(after)});
   // Preserve typed cue/next-action when validation rejected the pause.
   return getSnapshot()==='resume';
  }
  if(stage==='resume')actor.send({type:'REVIEW',...evidence(after)});
  return true; // rejected empty answer keeps input and native feedback visible
 }
 return {subscribe,getSnapshot,isCurrent,sync,execute,stop:()=>{actor.stop();}};
}
