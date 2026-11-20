import {createActor,setup} from 'xstate';

/** The ten spells without a specialised multi-stage actor share ONE machine.
 * Native LiSpellPractice remains the ONLY checker, feedback and storage owner.
 * Never infer a completed practice from a click or a form field alone.
 */
export const STANDARD_SPELL_IDS=[
 'T01','T02','T04','T05','T06','T07','T08','T09','T10','T11'
] as const;
export type StandardSpellId=typeof STANDARD_SPELL_IDS[number];
export type StandardSpellStage='prepare'|'scheduled'|'recall'|'reviewed';
export type StandardSpellView={
 active:string;mode:string;phase:number;dueAt:number|null;
 reviewedInSession:boolean;viewSession:number
};
export type StandardAnswers=Record<string,string|string[]>;
export type StandardSpellPort={
 getView:()=>StandardSpellView|null;
 perform:(action:string,answers?:StandardAnswers)=>boolean;
};
type Evidence={phase:number;reviewed:boolean;dueAt:number|null};
type StandardSpellEvent=
 | {type:'HYDRATE';stage:StandardSpellStage}
 | ({type:'REVEAL'|'SCHEDULE'|'CLEAR'|'CHECK'}&Evidence)
 | {type:'RESET'};
const supported=(id:string):id is StandardSpellId=>
 (STANDARD_SPELL_IDS as readonly string[]).includes(id);
const modeOf=(view:StandardSpellView):'hide'|'due'|'direct'=>
 view.active==='T01'?'hide':view.active==='T02'?'due':'direct';

export function standardSpellStage(view:StandardSpellView):StandardSpellStage|null{
 if(!supported(view.active))return null;
 const mode=modeOf(view);
 if(view.reviewedInSession){
  // A revealed answer is only trustworthy after the source was hidden
  // (T01) or the review truly became due (T02).
  return mode==='direct'||view.phase===1?'reviewed':null;
 }
 if(mode==='hide')return view.phase===1?'recall':view.phase===0?'prepare':null;
 if(mode==='due'){
  if(view.phase===1)return 'recall';
  if(view.phase!==0)return null;
  return view.dueAt!==null&&view.dueAt>Date.now()?'scheduled':'prepare';
 }
 return view.phase===0?'prepare':null;
}
const evidence=(view:StandardSpellView):Evidence=>({
 phase:view.phase,reviewed:view.reviewedInSession,dueAt:view.dueAt
});
export const standardSpellMachine=setup({
 types:{events:{} as StandardSpellEvent}
}).createMachine({
 id:'li-standard-spells',
 initial:'prepare',
 on:{
  RESET:{target:'.prepare'},
  HYDRATE:[
   {guard:({event})=>event.type==='HYDRATE'&&event.stage==='reviewed',target:'.reviewed'},
   {guard:({event})=>event.type==='HYDRATE'&&event.stage==='recall',target:'.recall'},
   {guard:({event})=>event.type==='HYDRATE'&&event.stage==='scheduled',target:'.scheduled'},
   {target:'.prepare'}
  ]
 },
 states:{
  prepare:{on:{
   REVEAL:{guard:({event})=>event.type==='REVEAL'&&
    event.phase===1&&!event.reviewed,target:'recall'},
   SCHEDULE:{guard:({event})=>event.type==='SCHEDULE'&&
    event.phase===0&&!event.reviewed&&
    event.dueAt!==null&&event.dueAt>Date.now(),target:'scheduled'},
   CHECK:{guard:({event})=>event.type==='CHECK'&&
    event.phase===0&&event.reviewed,target:'reviewed'}
  }},
  scheduled:{on:{
   CLEAR:{guard:({event})=>event.type==='CLEAR'&&
    event.phase===0&&event.dueAt===null,target:'prepare'}
  }},
  recall:{on:{
   CHECK:{guard:({event})=>event.type==='CHECK'&&
    event.phase===1&&event.reviewed,target:'reviewed'}
  }},
  reviewed:{}
 }
});

export const standardSpellPhase=(stage:StandardSpellStage,mode:string):number=>
 stage==='recall'||(stage==='reviewed'&&(mode==='hide'||mode==='due'))?1:0;

/** One actor stays mounted while the learner switches technique; each
 * active spell/session is isolated, and remount hydrates only native evidence.
 */
export function createStandardSpellFlow(){
 const actor=createActor(standardSpellMachine).start();
 let session:number|null=null;
 let active:StandardSpellId|null=null;
 const getSnapshot=():StandardSpellStage=>actor.getSnapshot().value as StandardSpellStage;
 const subscribe=(notify:()=>void)=>{
  const sub=actor.subscribe(notify);
  return ()=>sub.unsubscribe();
 };
 const isCurrent=(view:StandardSpellView|null)=>
  !!view&&view.active===active&&session===view.viewSession;
 function sync(view:StandardSpellView|null):void{
  const stage=view?standardSpellStage(view):null;
  if(!view||stage===null){
   if(active!==null){active=null;session=null;actor.send({type:'RESET'});}
   return;
  }
  if(active!==view.active||session!==view.viewSession||getSnapshot()!==stage){
   active=view.active as StandardSpellId;
   session=view.viewSession;
   actor.send({type:'HYDRATE',stage});
  }
 }
 function execute(action:string,answers:StandardAnswers,port:StandardSpellPort|null|undefined):boolean{
  if(!port)return false;
  const before=port.getView();
  if(!before||!supported(before.active))return false;
  sync(before);
  const stage=getSnapshot(),mode=modeOf(before);
  if(action==='reset'){
   const accepted=port.perform(action,answers);
   if(accepted)sync(port.getView());
   return accepted;
  }
  const permitted=
   (action==='next'&&mode==='hide'&&stage==='prepare')||
   (action==='schedule'&&mode==='due'&&stage==='prepare')||
   (action==='clear'&&mode==='due'&&stage==='scheduled')||
   (action==='check'&&(
    (mode==='direct'&&(stage==='prepare'||stage==='reviewed'))||
    (mode!=='direct'&&(stage==='recall'||stage==='reviewed'))
   ));
  if(!permitted)return false;
  const accepted=port.perform(action,answers);
  if(!accepted)return false; // never advance on a denied account/action
  const after=port.getView();
  if(!after||after.active!==before.active||after.viewSession!==before.viewSession)
   return false;
  if(action==='next')actor.send({type:'REVEAL',...evidence(after)});
  else if(action==='schedule')actor.send({type:'SCHEDULE',...evidence(after)});
  else if(action==='clear')actor.send({type:'CLEAR',...evidence(after)});
  else if(action==='check'&&stage!=='reviewed')actor.send({type:'CHECK',...evidence(after)});
  // A failed answer check must still show its original native feedback, but
  // it cannot unlock reviewed or a subsequent stage without review evidence.
  return action==='next'?getSnapshot()==='recall':
   action==='clear'?getSnapshot()==='prepare':accepted;
 }
 return {subscribe,getSnapshot,isCurrent,sync,execute,stop:()=>actor.stop()};
}
