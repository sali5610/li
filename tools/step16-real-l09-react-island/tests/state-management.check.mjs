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
