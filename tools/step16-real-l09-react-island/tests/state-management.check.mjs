import assert from 'node:assert/strict';
import test from 'node:test';
import {createLessonPhaseActor} from '../.state-test/learning/phase-machine.js';
import {appUiStore} from '../.state-test/shell/app-store.js';

test('Zustand shares one reactive route and phase across consumers',()=>{
 const changes=[];
 const stop=appUiStore.subscribe(s=>changes.push([s.route,s.lessonPhase]));
 appUiStore.getState().setRoute('catalog');
 appUiStore.getState().setLessonPhase('guided');
 assert.deepEqual([appUiStore.getState().route,appUiStore.getState().lessonPhase],['catalog','guided']);
 appUiStore.getState().setRoute('catalog'); // no redundant rerender
 assert.equal(changes.length,2);
 appUiStore.getState().setLessonPhase(null);
 appUiStore.getState().setRoute('home');
 stop();
});
test('XState denies locked feedback/progress before confirmed persistence',()=>{
 const actor=createLessonPhaseActor();
 const open=phase=>actor.send({type:'OPEN',phase});
 const commit=(submitted,reviewed)=>actor.send({type:'COMMIT',submitted,reviewed});
 assert.equal(actor.getSnapshot().value,'read');
 open('guided');open('practice');
 assert.equal(actor.getSnapshot().value,'practice');
 open('feedback');open('progress');
 assert.equal(actor.getSnapshot().value,'practice');
 commit(true,false);open('feedback');
 assert.equal(actor.getSnapshot().value,'feedback');
 open('progress');
 assert.equal(actor.getSnapshot().value,'feedback');
 commit(true,true);open('progress');
 assert.equal(actor.getSnapshot().value,'progress');
 actor.stop();
});
test('XState restores verified progress and revokes stale gates on account reload',()=>{
 const actor=createLessonPhaseActor();
 actor.send({type:'COMMIT',submitted:true,reviewed:true});
 actor.send({type:'OPEN',phase:'progress'});
 assert.equal(actor.getSnapshot().value,'progress');
 actor.send({type:'COMMIT',submitted:false,reviewed:false});
 actor.send({type:'OPEN',phase:'read'});
 actor.send({type:'OPEN',phase:'progress'});
 assert.equal(actor.getSnapshot().value,'read');
 actor.send({type:'COMMIT',submitted:false,reviewed:true}); // invalid review never unlocks
 actor.send({type:'OPEN',phase:'progress'});
 assert.equal(actor.getSnapshot().value,'read');
 actor.stop();
});

import {createFadedT03Flow} from '../.state-test/shell/spell-t03-flow.js';

function makeT03Port(){
 let view={active:'T03',phase:0,reviewedInSession:false,viewSession:1};
 const calls=[];
 return {
  getView:()=>view,
  perform:(action,answers={})=>{
   calls.push(action);
   if(action==='reset')view={...view,phase:0,reviewedInSession:false,viewSession:view.viewSession+1};
   else if(action==='next'&&view.phase===0)view={...view,phase:1};
   else if(action==='check'&&view.phase===1&&answers.number==='14')view={...view,phase:2};
   else if(action==='check'&&view.phase===2&&answers.number==='26')view={...view,reviewedInSession:true};
   return true;
  },
  setView:delta=>{view={...view,...delta};},calls
 };
}
test('T03 machine advances only after actual grader-confirmed answers, not skipped buttons',()=>{
 const port=makeT03Port(),flow=createFadedT03Flow();
 flow.sync(port.getView());
 assert.equal(flow.getSnapshot(),'example');
 assert.equal(flow.execute('check',{number:'26'},port),false);
 assert.deepEqual(port.calls,[],'rejected transition never calls the grading engine');
 flow.execute('next',{},port);
 assert.equal(flow.getSnapshot(),'guided');
 assert.equal(flow.execute('next',{},port),false);
 flow.execute('check',{number:'13'},port);
 assert.equal(flow.getSnapshot(),'guided');
 flow.execute('check',{number:'14'},port);
 assert.equal(flow.getSnapshot(),'independent');
 flow.execute('check',{number:'25'},port);
 assert.equal(flow.getSnapshot(),'independent');
 flow.execute('check',{number:'26'},port);
 assert.equal(flow.getSnapshot(),'reviewed');
 assert.equal(port.getView().reviewedInSession,true);
 assert.equal(flow.execute('check',{number:'26'},port),true,'repeat self-check remains usable');
 assert.equal(flow.getSnapshot(),'reviewed');
 flow.stop();
});
test('T03 machine resets per attempt and isolates other techniques and remount',()=>{
 const port=makeT03Port(),flow=createFadedT03Flow();
 flow.sync(port.getView());
 flow.execute('next',{},port);
 flow.execute('reset',{},port);
 assert.equal(flow.getSnapshot(),'example');
 assert.equal(port.getView().viewSession,2);
 flow.execute('next',{},port);
 flow.execute('check',{number:'14'},port);
 assert.equal(flow.getSnapshot(),'independent');
 const remount=createFadedT03Flow();
 remount.sync(port.getView());
 assert.equal(remount.getSnapshot(),'independent');
 port.setView({active:'T12',phase:1,viewSession:3});
 flow.sync(port.getView());
 assert.equal(flow.getSnapshot(),'example');
 assert.equal(flow.execute('next',{},port),false);
 port.setView({active:'T03',phase:0,viewSession:4,reviewedInSession:false});
 flow.sync(port.getView());
 assert.equal(flow.getSnapshot(),'example');
 remount.stop();flow.stop();
});

import {createLociT13Flow} from '../.state-test/shell/spell-t13-flow.js';

function makeT13Port(){
 let view={active:'T13',phase:0,reviewedInSession:false,viewSession:1,places:[]};
 const calls=[];
 return {
  getView:()=>view,
  perform:(action,answers={})=>{
   calls.push(action);
   if(action==='reset'){
    view={...view,phase:0,reviewedInSession:false,viewSession:view.viewSession+1,places:[]};
   }else if(action==='next'&&view.phase===0){
    const places=[1,2,3].map(i=>answers['place'+i]);
    const cues=[1,2,3].map(i=>answers['cue'+i]);
    const normalized=places.map(x=>typeof x==='string'?x.trim().toLocaleLowerCase('vi'):'');
    if(normalized.every(Boolean)&&new Set(normalized).size===3&&
       cues.every(x=>typeof x==='string'&&x.trim())){
     view={...view,phase:1,places};
    }
   }else if(action==='check'&&view.phase===1){
    if([1,2,3].every(i=>typeof answers['recall'+i]==='string'&&answers['recall'+i].trim())){
     view={...view,reviewedInSession:true};
    }
   }
   return true; // the canonical port also returns true for a validation message
  },
  change:updates=>{view={...view,...updates};},
  calls
 };
}
const lociSetup={
 place1:'Cửa nhà',cue1:'Tổng thể đích',
 place2:'Bếp',cue2:'Cách chọn mẫu',
 place3:'Cầu thang',cue3:'Người bị bỏ sót'
};
test('T13 prevents early recall, missing cues and duplicate loci; failed NEXT keeps draft',()=>{
 const port=makeT13Port(),flow=createLociT13Flow();
 flow.sync(port.getView());
 assert.equal(flow.getSnapshot(),'setup');
 assert.equal(flow.execute('check',{recall1:'a',recall2:'b',recall3:'c'},port),false);
 assert.deepEqual(port.calls,[]);
 assert.equal(flow.execute('next',{...lociSetup,cue2:''},port),false);
 assert.equal(flow.getSnapshot(),'setup');
 assert.equal(flow.execute('next',{...lociSetup,place3:'cửa nhà'},port),false);
 assert.equal(flow.getSnapshot(),'setup');
 assert.equal(flow.execute('next',lociSetup,port),true);
 assert.equal(flow.getSnapshot(),'recall');
 assert.deepEqual(port.getView().places,['Cửa nhà','Bếp','Cầu thang']);
 assert.equal(flow.execute('next',lociSetup,port),false,'cannot skip retrieval');
 assert.equal(flow.execute('check',{recall1:'Tổng thể'},port),true);
 assert.equal(flow.getSnapshot(),'recall','partial recall never unlocks feedback');
 assert.equal(flow.execute('check',{recall1:'Tổng thể',recall2:'Mẫu',recall3:'Bỏ sót'},port),true);
 assert.equal(flow.getSnapshot(),'reviewed');
 assert.equal(port.getView().reviewedInSession,true);
 flow.stop();
});
test('T13 restarts per session, restores verified recall, and never leaks to T03',()=>{
 const port=makeT13Port(),flow=createLociT13Flow();
 flow.sync(port.getView());
 flow.execute('next',lociSetup,port);
 assert.equal(flow.getSnapshot(),'recall');
 const remount=createLociT13Flow();
 remount.sync(port.getView());
 assert.equal(remount.getSnapshot(),'recall');
 flow.execute('reset',{},port);
 assert.equal(flow.getSnapshot(),'setup');
 assert.equal(port.getView().viewSession,2);
 assert.deepEqual(port.getView().places,[]);
 port.change({active:'T03',viewSession:3,phase:2});
 flow.sync(port.getView());
 assert.equal(flow.execute('next',lociSetup,port),false);
 port.change({active:'T13',viewSession:4,phase:0,reviewedInSession:false});
 flow.sync(port.getView());
 assert.equal(flow.getSnapshot(),'setup');
 flow.stop();remount.stop();
});

import {createResumeT12Flow} from '../.state-test/shell/spell-t12-flow.js';

function makeT12Port(){
 let view={active:'T12',phase:0,reviewedInSession:false,resumeNote:'',viewSession:1};
 const calls=[];
 return {
  getView:()=>view,
  perform:(action,answers={})=>{
   calls.push(action);
   if(action==='reset'){
    view={...view,phase:0,reviewedInSession:false,resumeNote:'',viewSession:view.viewSession+1};
   }else if(action==='next'&&view.phase===0){
    const context=answers.context;
    const next=answers.next;
    if(typeof context==='string'&&context.trim()&&typeof next==='string'&&next.trim()){
     view={...view,phase:1,resumeNote:next.trim()};
    }
   }else if(action==='check'&&view.phase===1){
    if(typeof answers.answer==='string'&&answers.answer.trim()){
     view={...view,reviewedInSession:true};
    }
   }
   return true; // real controller returns true even on missing-field feedback
  },
  change:delta=>{view={...view,...delta};},
  calls
 };
}
const t12Cue={context:'Đang đọc kết quả khảo sát 15/20',next:'Viết câu kết luận đúng phạm vi'};
test('T12 XState guards cue capture, pause, re-entry and self-check feedback',()=>{
 const port=makeT12Port(),flow=createResumeT12Flow();
 flow.sync(port.getView());
 assert.equal(flow.getSnapshot(),'capture');
 assert.equal(flow.execute('check',{answer:'15/20'},port),false,'cannot review before pause');
 assert.deepEqual(port.calls,[]);
 assert.equal(flow.execute('next',{...t12Cue,next:'  '},port),false,'blank next step must not pause');
 assert.equal(flow.getSnapshot(),'capture');
 assert.equal(flow.execute('next',{...t12Cue,context:''},port),false,'missing context must not pause');
 assert.equal(flow.execute('next',t12Cue,port),true);
 assert.equal(flow.getSnapshot(),'resume');
 assert.equal(port.getView().resumeNote,'Viết câu kết luận đúng phạm vi');
 assert.equal(flow.execute('next',t12Cue,port),false,'cannot reveal source again');
 assert.equal(flow.execute('check',{answer:'   '},port),true);
 assert.equal(flow.getSnapshot(),'resume','empty returned answer keeps self-check locked');
 assert.equal(flow.execute('check',{answer:'Trong 20 người được hỏi, 15 người hài lòng.'},port),true);
 assert.equal(flow.getSnapshot(),'reviewed');
 assert.equal(port.getView().reviewedInSession,true);
 flow.stop();
});
test('T12 restart clears its session cue; switching technique cannot leak progression',()=>{
 const port=makeT12Port(),flow=createResumeT12Flow();
 flow.sync(port.getView());
 flow.execute('next',t12Cue,port);
 assert.equal(flow.getSnapshot(),'resume');
 const fresh=createResumeT12Flow();
 fresh.sync(port.getView());
 assert.equal(fresh.getSnapshot(),'resume','trusted session snapshot restores step');
 flow.execute('reset',{},port);
 assert.equal(flow.getSnapshot(),'capture');
 assert.equal(port.getView().resumeNote,'');
 assert.equal(port.getView().viewSession,2);
 port.change({active:'T03',phase:2,viewSession:3});
 flow.sync(port.getView());
 assert.equal(flow.execute('next',t12Cue,port),false);
 port.change({active:'T12',phase:1,reviewedInSession:true,resumeNote:'',viewSession:4});
 flow.sync(port.getView());
 assert.equal(flow.getSnapshot(),'capture','no progress without verified cue');
 flow.stop();fresh.stop();
});


import {createStandardSpellFlow,STANDARD_SPELL_IDS,standardSpellPhase
} from '../.state-test/shell/spell-standard-flow.js';

function makeStandardPort(id){
 const mode=id==='T01'?'hide':id==='T02'?'due':'direct';
 let view={active:id,mode,phase:0,dueAt:null,reviewedInSession:false,viewSession:1};
 const calls=[];
 return{
  getView:()=>view,
  calls,
  perform:(action,answers={})=>{
   calls.push(action);
   if(action==='reset')view={...view,phase:0,dueAt:null,reviewedInSession:false,
    viewSession:view.viewSession+1};
   else if(action==='next'&&mode==='hide'&&view.phase===0)
    view={...view,phase:1};
   else if(action==='schedule'&&mode==='due'&&view.phase===0)
    view={...view,dueAt:Date.now()+86400000};
   else if(action==='clear'&&mode==='due'&&view.phase===0)
    view={...view,dueAt:null};
   else if(action==='check'&&answers.answer==='ready'&&
     (mode==='direct'||view.phase===1))
    view={...view,reviewedInSession:true};
   return true; // native checker can accept action but report missing fields
  },
  patch:delta=>{view={...view,...delta};}
 };
}
test('all ten remaining spells use one XState gate; no invalid feedback unlocks review',()=>{
 assert.deepEqual([...STANDARD_SPELL_IDS],[
  'T01','T02','T04','T05','T06','T07','T08','T09','T10','T11'
 ]);
 const specialised=['T03','T12','T13'];
 assert.equal(new Set([...STANDARD_SPELL_IDS,...specialised]).size,13);
 for(const id of STANDARD_SPELL_IDS){
  const port=makeStandardPort(id),flow=createStandardSpellFlow();
  flow.sync(port.getView());
  assert.equal(flow.getSnapshot(),'prepare',id+' initially preparing');
  assert.equal(flow.isCurrent(port.getView()),true);
  if(id==='T01'){
   assert.equal(flow.execute('check',{answer:'ready'},port),false,
    'active recall cannot reveal model answer before hiding source');
   assert.deepEqual(port.calls,[]);
   assert.equal(flow.execute('next',{},port),true);
   assert.equal(flow.getSnapshot(),'recall');
   assert.equal(standardSpellPhase(flow.getSnapshot(),'hide'),1);
  }else if(id==='T02'){
   assert.equal(flow.execute('check',{answer:'ready'},port),false,'no early review');
   assert.equal(flow.execute('schedule',{},port),true);
   assert.equal(flow.getSnapshot(),'scheduled');
   assert.equal(flow.execute('check',{answer:'ready'},port),false,
    'scheduling is NOT a completed review');
   assert.equal(flow.execute('clear',{},port),true);
   assert.equal(flow.getSnapshot(),'prepare');
   assert.equal(flow.execute('schedule',{},port),true);
   port.patch({phase:1,dueAt:Date.now()-1000}); // real due gate observed
   flow.sync(port.getView());
   assert.equal(flow.getSnapshot(),'recall');
   assert.equal(standardSpellPhase(flow.getSnapshot(),'due'),1);
  }else{
   assert.equal(standardSpellPhase(flow.getSnapshot(),'direct'),0);
   assert.equal(flow.execute('next',{},port),false,'direct exercise cannot skip prep');
  }
  assert.equal(flow.execute('check',{answer:''},port),true,id+' can show missing-field feedback');
  assert.equal(flow.getSnapshot(),id==='T01'||id==='T02'?'recall':'prepare',
   id+' stays blocked until the checker confirms the response');
  assert.equal(flow.execute('check',{answer:'ready'},port),true);
  assert.equal(flow.getSnapshot(),'reviewed',id+' real self-check unlocks review');
  assert.equal(flow.execute('check',{answer:'ready'},port),true,'repeat feedback remains available');
  assert.equal(flow.execute('reset',{},port),true,id+' restart is a real native action');
  assert.equal(flow.getSnapshot(),'prepare',id+' cleared after restart');
  assert.equal(port.getView().viewSession,2);
  flow.stop();
 }
});
test('generic XState actors isolate technique and session; never hydrate another method',()=>{
 const port=makeStandardPort('T01'),flow=createStandardSpellFlow();
 flow.sync(port.getView());
 assert.equal(flow.execute('next',{},port),true);
 const remount=createStandardSpellFlow();
 remount.sync(port.getView());
 assert.equal(remount.getSnapshot(),'recall','hydrate only verified native phase');
 port.patch({active:'T04',mode:'direct',viewSession:2,phase:0});
 flow.sync(port.getView());
 assert.equal(flow.getSnapshot(),'prepare');
 assert.equal(flow.execute('next',{},port),false,'old T01 stage cannot carry into T04');
 assert.equal(flow.execute('check',{answer:'ready'},port),true);
 assert.equal(flow.getSnapshot(),'reviewed');
 port.patch({active:'T12',viewSession:3,phase:1,reviewedInSession:true});
 flow.sync(port.getView());
 assert.equal(flow.isCurrent(port.getView()),false,'specialised T12 cannot enter generic machine');
 assert.equal(flow.execute('check',{answer:'ready'},port),false);
 port.patch({active:'T01',mode:'hide',viewSession:4,phase:0,reviewedInSession:false});
 flow.sync(port.getView());
 assert.equal(flow.getSnapshot(),'prepare');
 remount.stop();flow.stop();
});
