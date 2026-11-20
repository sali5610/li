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
