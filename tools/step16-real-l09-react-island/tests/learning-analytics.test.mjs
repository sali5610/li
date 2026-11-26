import {test} from 'node:test';
import assert from 'node:assert/strict';
import {learningEvent,summarizeLearning} from '../src/learning/learning-analytics.mjs';
const base={lessonId:'L09-1-2',attemptId:'round-1',contentVersion:'v1',occurredAt:'2026-11-27T00:00:00Z'};
const e=(kind,fields={})=>({...base,kind,...fields});
test('retries and multi-method rounds count one lesson once',()=>{
 const start=e('unit_start'),finish=e('unit_finish');
 const a=e('technique_apply',{methodId:'T03',actionId:'a'}),b=e('technique_apply',{methodId:'T06',actionId:'b'});
 const m=summarizeLearning([start,start,a,a,b,finish,finish,e('unit_start',{attemptId:'round-2'}),e('unit_finish',{attemptId:'round-2'})]);
 assert.equal(m.uniqueEvents,6);assert.equal(m.startedRounds,2);assert.equal(m.finishedStartedRounds,2);
 assert.equal(m.completedLessons,1);assert.equal(m.methodApplications,2);
});
test('view and skip never become application or mastery',()=>{
 const m=summarizeLearning([e('tutorial_view_or_skip',{methodId:'T03',decision:'view'}),e('tutorial_view_or_skip',{methodId:'T06',decision:'skip'})]);
 assert.equal(m.methodViews,1);assert.equal(m.methodSkips,1);assert.equal(m.methodApplications,0);
 assert.equal(m.mastery,null);assert.equal(m.completionRate,null);
});
test('separate fresh rubric evidence from assisted/self-reviewed/repeated work',()=>{
 const f={taskId:'case1',actionId:'a',rubricVersion:'r1',assistance:'none',exposure:'fresh',assessment:'rubric_assessed'};
 const m=summarizeLearning([e('independent_answer',f),e('independent_answer',{...f,actionId:'b',assistance:'assisted'}),e('independent_answer',{...f,actionId:'c',assessment:'self_reviewed'}),e('independent_answer',{...f,actionId:'d',exposure:'repeated'})]);
 assert.equal(m.independentAnswers,4);assert.equal(m.eligibleFreshRubricAnswers,1);assert.equal(m.untrainedProbeOutcome,null);
});
test('missing start or review opportunity not an invented denominator',()=>{
 const m=summarizeLearning([e('unit_finish'),e('due_review',{taskId:'t',actionId:'a',reviewState:'completed'})]);
 assert.equal(m.completedLessons,1);assert.equal(m.completionRate,null);assert.equal(m.completedDueReviews,0);
 const n=summarizeLearning([e('due_review',{taskId:'t',actionId:'a',reviewState:'scheduled'}),e('due_review',{taskId:'t',actionId:'a',reviewState:'completed'})]);
 assert.equal(n.dueReviewOpportunities,1);assert.equal(n.completedDueReviews,1);
});
test('reject free text, owner, health, unknown fields and invalid method',()=>{
 for(const field of ['ownerId','answer','health','employer','email','prompt']) assert.throws(()=>learningEvent(e('unit_start',{[field]:'private'})),/UNEXPECTED_FIELD/);
 assert.throws(()=>learningEvent(e('technique_apply',{methodId:'T14',actionId:'a'})),/INVALID_METHOD/);
 assert.throws(()=>learningEvent(e('health_log')),/INVALID_EVENT/);
});
test('stable identity ignores locale, retries conflict rather than overwrite',()=>{
 const start=e('unit_start');assert.equal(learningEvent(start).eventId,learningEvent({...start}).eventId);
 assert.throws(()=>summarizeLearning([start,{...start,occurredAt:'2026-11-27T00:01:00Z'}]),/EVENT_ID_CONFLICT/);
});
