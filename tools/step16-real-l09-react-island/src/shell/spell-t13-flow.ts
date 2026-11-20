import {createActor,setup} from 'xstate';

/** T13 progression only. LiSpellPractice remains the single owner of
 * input validation, feedback, and session-local practice receipts.
 */
export type LociStage='setup'|'recall'|'reviewed';
export type LociView={
 active:string;phase:number;reviewedInSession:boolean;viewSession:number;places:string[];
};
export type LociAnswers=Record<string,string|string[]>;
export type LociPort={
 getView:()=>LociView|null;
 perform:(action:string,answers?:LociAnswers)=>boolean;
};
type Evidence={phase:number;reviewed:boolean;places:string[]};
type LociEvent=({type:'HYDRATE'|'HIDE_SOURCE'|'REVIEW'}&Evidence)|{type:'RESET'};
const threeDistinct=(places:string[])=>{
 if(!Array.isArray(places)||places.length!==3)return false;
 const normalized=places.map(v=>typeof v==='string'?v.trim().toLocaleLowerCase('vi'):'');
 return normalized.every(Boolean)&&new Set(normalized).size===3;
};
export const lociT13Machine=setup({
 types:{events:{} as LociEvent}
}).createMachine({
 id:'li-t13-loci',
 initial:'setup',
 on:{
  RESET:{target:'.setup'},
  HYDRATE:[
   {guard:({event})=>event.phase===1&&event.reviewed&&threeDistinct(event.places),target:'.reviewed'},
   {guard:({event})=>event.phase===1&&!event.reviewed&&threeDistinct(event.places),target:'.recall'},
   {target:'.setup'}
  ]
 },
 states:{
  setup:{on:{
   HIDE_SOURCE:{
    guard:({event})=>event.phase===1&&!event.reviewed&&threeDistinct(event.places),
    target:'recall'
   }
  }},
  recall:{on:{
   REVIEW:{
    guard:({event})=>event.phase===1&&event.reviewed&&threeDistinct(event.places),
    target:'reviewed'
   }
  }},
  reviewed:{}
 }
});
export const lociT13Phase=(state:LociStage):number=>state==='setup'?0:1;
export function createLociT13Flow(){
 const actor=createActor(lociT13Machine).start();
 let session:number|null=null;
 const getSnapshot=():LociStage=>actor.getSnapshot().value as LociStage;
 const subscribe=(notify:()=>void)=>{
  const sub=actor.subscribe(notify);
  return ()=>sub.unsubscribe();
 };
 const isCurrent=(view:LociView|null)=>
  !!view&&view.active==='T13'&&session===view.viewSession;
 const evidence=(view:LociView):Evidence=>({
  phase:view.phase,reviewed:view.reviewedInSession,places:view.places
 });
 function sync(view:LociView|null):void{
  if(!view||view.active!=='T13'){
   if(session!==null){session=null;actor.send({type:'RESET'});}
   return;
  }
  if(session!==view.viewSession){
   session=view.viewSession;
   actor.send({type:'HYDRATE',...evidence(view)});
  }
 }
 function execute(action:string,answers:LociAnswers,port:LociPort|null|undefined):boolean{
  if(!port)return false;
  const before=port.getView();
  if(!before||before.active!=='T13')return false;
  sync(before);
  if(action==='reset'){
   const accepted=port.perform(action,answers);
   if(accepted)sync(port.getView());
   return accepted;
  }
  const stage=getSnapshot();
  if(!((action==='next'&&stage==='setup')||
       (action==='check'&&(stage==='recall'||stage==='reviewed'))))return false;
  const accepted=port.perform(action,answers);
  if(!accepted)return false;
  const after=port.getView();
  if(!after||after.active!=='T13'||after.viewSession!==before.viewSession)return false;
  if(action==='next'){
   actor.send({type:'HIDE_SOURCE',...evidence(after)});
   // Native perform returns true even when input validation fails.
   // Preserve the React draft until the real native step advances.
   return getSnapshot()==='recall';
  }
  if(stage==='recall')actor.send({type:'REVIEW',...evidence(after)});
  return true; // native feedback may request more recall without advancing
 }
 return {subscribe,getSnapshot,isCurrent,sync,execute,stop:()=>{actor.stop();}};
}
