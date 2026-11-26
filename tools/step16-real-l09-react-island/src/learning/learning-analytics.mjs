// Step19 pure measurement contract. No I/O, collector, account ID or storage.
// Caller must supply committed action identities, NOT a new ID on every retry.
const KINDS = Object.freeze({
 subject_open: [], unit_start: [], tutorial_view_or_skip: ['methodId','decision'],
 rehearsal_attempt: ['methodId','actionId'], technique_apply: ['methodId','actionId'],
 independent_answer: ['taskId','actionId','rubricVersion','assistance','exposure','assessment'],
 hint: ['actionId'], reveal: ['actionId'], unit_finish: [],
 due_review: ['taskId','actionId','reviewState']
});
const token = v => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,100}$/.test(v);
const oneOf=(v,arr)=>arr.includes(v);
export function learningEvent(input) {
 if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('INVALID_EVENT');
 const {kind,lessonId,attemptId,occurredAt,contentVersion}=input;
 if(!Object.hasOwn(KINDS,kind)||!/^L[0-9]{2}-[0-9]+-[0-9]+$/.test(lessonId??'')||
    !token(attemptId)||!token(contentVersion)||typeof occurredAt!=='string'||
    !Number.isFinite(Date.parse(occurredAt))) throw Error('INVALID_EVENT');
 const fields=KINDS[kind], required=['kind','lessonId','attemptId','occurredAt','contentVersion',...fields];
 if(Object.keys(input).length!==required.length||!required.every(k=>Object.hasOwn(input,k))) throw Error('UNEXPECTED_FIELD');
 for(const k of fields) if(!token(input[k])) throw Error('INVALID_FIELD');
 if(fields.includes('methodId')&&!/^T(0[1-9]|1[0-3])$/.test(input.methodId)) throw Error('INVALID_METHOD');
 if(kind==='tutorial_view_or_skip'&&!oneOf(input.decision,['view','skip'])) throw Error('INVALID_DECISION');
 if(kind==='independent_answer'&&(!oneOf(input.assistance,['none','assisted','unknown'])||
    !oneOf(input.exposure,['fresh','repeated','unknown'])||
    !oneOf(input.assessment,['unassessed','self_reviewed','rubric_assessed']))) throw Error('INVALID_EVIDENCE');
 if(kind==='due_review'&&!oneOf(input.reviewState,['scheduled','completed'])) throw Error('INVALID_REVIEW');
 const scope=[lessonId,attemptId,kind];
 // Separate method submissions/actions; one completion per attempt regardless of methods.
 for(const k of ['methodId','taskId','actionId','decision','reviewState']) if(fields.includes(k)) scope.push(input[k]);
 const result={schemaVersion:1,eventId:JSON.stringify(scope)};
 for(const k of required) result[k]=k==='occurredAt'?new Date(input[k]).toISOString():input[k];
 return Object.freeze(result);
}
export function summarizeLearning(inputs) {
 const events=new Map();
 for(const input of inputs){
  const e=learningEvent(input), old=events.get(e.eventId);
  if(old){
   // Delivery timestamps are immutable; conflicting evidence is not silently overwritten.
   if(JSON.stringify(old)!==JSON.stringify(e)) throw Error('EVENT_ID_CONFLICT');
  }else events.set(e.eventId,e);
 }
 const rounds=new Map(), completedLessons=new Set(), applied=new Set(), rehearsed=new Set(),
  tutorialViews=new Set(), tutorialSkips=new Set(), answers=new Set(), eligibleFresh=new Set(),
  scheduled=new Set(), reviewed=new Set();
 for(const e of events.values()){
  const id=JSON.stringify([e.lessonId,e.attemptId]);
  const round=rounds.get(id)??{started:false,finished:false};
  if(e.kind==='unit_start')round.started=true;
  if(e.kind==='unit_finish'){round.finished=true;completedLessons.add(e.lessonId);}
  rounds.set(id,round);
  const method=JSON.stringify([id,e.methodId]);
  const answer=JSON.stringify([id,e.taskId,e.actionId]);
  const review=JSON.stringify([id,e.taskId,e.actionId]);
  switch(e.kind){
   case 'tutorial_view_or_skip': (e.decision==='view'?tutorialViews:tutorialSkips).add(method);break;
   case 'rehearsal_attempt': rehearsed.add(method);break;
   case 'technique_apply': applied.add(method);break;
   case 'independent_answer':
    answers.add(answer);
    if(e.assistance==='none'&&e.exposure==='fresh'&&e.assessment==='rubric_assessed')eligibleFresh.add(answer);
    break;
   case 'due_review': (e.reviewState==='scheduled'?scheduled:reviewed).add(review);break;
  }
 }
 const startedRounds=[...rounds.values()].filter(r=>r.started).length;
 const finishedStartedRounds=[...rounds.values()].filter(r=>r.started&&r.finished).length;
 return {uniqueEvents:events.size,startedRounds,finishedStartedRounds,
  completionRate:startedRounds?finishedStartedRounds/startedRounds:null,
  completedLessons:completedLessons.size,methodViews:tutorialViews.size,methodSkips:tutorialSkips.size,
  methodRehearsals:rehearsed.size,methodApplications:applied.size,
  independentAnswers:answers.size,eligibleFreshRubricAnswers:eligibleFresh.size,
  dueReviewOpportunities:scheduled.size,completedDueReviews:[...reviewed].filter(x=>scheduled.has(x)).length,
  // No performance score, K2/K3 mastery or transfer inference from clicks or submissions.
  mastery:null,untrainedProbeOutcome:null};
}

// Read-only projection of authorized saved records, never backfilled events.
export function summarizeSavedAttempt(attempt) {
 const receipt=r=>typeof r?.submittedAt==='string'&&Number.isFinite(Date.parse(r.submittedAt))&&Array.isArray(r.submission)&&r.submission.length===4&&r.submission.every(s=>typeof s==='string'&&s.trim().length>=12);
 const rated=r=>Array.isArray(r?.ratings)&&r.ratings.length===4&&r.ratings.every(x=>x===0||x===1||x===2);
 const submitted=attempt?.submitted===true&&receipt(attempt);
 const completed=submitted&&attempt.reviewed===true&&rated(attempt);
 const methods=Object.entries(attempt?.methodAttempts??{}).filter(([id,r])=>/^T(0[1-9]|1[0-3])$/.test(id)&&typeof r?.submittedAt==='string'&&Number.isFinite(Date.parse(r.submittedAt))&&typeof r.submission==='string'&&r.submission.trim().length>=12).map(([id])=>id).sort();
 const current=Number.isSafeInteger(attempt?.attemptNumber)&&attempt.attemptNumber>0?attempt.attemptNumber:1;
 const prior=new Set();
 for(const r of attempt?.attemptHistory??[])if(Number.isSafeInteger(r?.attemptNumber)&&r.attemptNumber>0&&r.attemptNumber<current&&receipt(r)&&rated(r)&&r.answerRevealed===true)prior.add(r.attemptNumber);
 const choice=attempt?.methodChoice==='skip'?'skip':/^T(0[1-9]|1[0-3])$/.test(attempt?.methodChoice??'')?attempt.methodChoice:null;
 return {submitted,completed,completedRounds:prior.size+Number(completed),methodChoice:choice,methodApplications:methods,selfRating:completed?attempt.ratings.reduce((sum,x)=>sum+x,0):null,assistance:submitted&&(attempt.hint===true||attempt.assisted===true)?'hint_recorded':'unknown',untrainedProbeOutcome:null};
}
