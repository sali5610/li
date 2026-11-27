#!/usr/bin/env node
/* Focused runtime contract for every published T01–T13 technique.
 * React runs the one real exercise checker with no DOM, hidden buttons,
 * browser events or second implementation. Native fallback is separate. */
"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const source=fs.readFileSync(require("node:path").resolve(__dirname,"../site/assets/spell-practice.js"),"utf8");
assert.match(source,/function performReact\(action,values=\{\}\)/);
assert.doesNotMatch(source,/button\.click\(\)/);
assert.doesNotMatch(source,/textarea\.value=val/);
assert.doesNotMatch(source,/root\.querySelector\('\[data-spell-action="'\+action/);
const instrumented=source.replace(/\}\)\(\);\s*$/,
 'window.__spellTest={open,getView,performReact,setT12Draft,switchTab,setLessonContext,getT02Status,postponeT02,getLessonPracticeSummary};\n})();');
assert.notEqual(instrumented,source,"The test must instrument the real IIFE engine");
const storage=new Map([["li.sync.local-owner.v1","test-invited-owner"]]);
let verified=true,accountOpen=false,locale="vi";
const window={
 liReactGuideDetailMounted:true,
 liLanguage:{get:()=>locale},
 dispatchEvent:()=>{},
 addEventListener:()=>{}
};
const document={
 readyState:"loading",addEventListener:()=>{},
 documentElement:{classList:{contains:key=>
  key==="li-auth-verified"?verified:key==="li-account-open"?accountOpen:false}}
};
const localStorage={
 getItem:key=>storage.has(key)?storage.get(key):null,
 setItem:(key,value)=>storage.set(key,String(value)),
 removeItem:key=>storage.delete(key)
};
vm.runInNewContext(instrumented,{window,document,localStorage,Event:class{},Date,console});
const api=window.__spellTest;
assert.ok(api&&Object.keys(api).length===9);
let covered=0;
function begin(id,lesson=null){
 api.open(id,"practice",lesson);
 const view=api.getView();
 assert.equal(view.active,id);
 assert.equal(view.tab,"practice");
 assert.equal(view.lessonId,lesson);
 return view;
}
function act(action,values={}){
 return api.performReact(action,values);
}
function reviewed(id){
 assert.equal(api.getView().reviewedInSession,true,id+" must have actual review evidence");
 covered++;
}
const sentence="Vì nhóm được hỏi không đại diện cho tất cả người dùng nên giới hạn kết luận.";
begin("T01");
assert.equal(act("check",{reason:sentence}),false,"T01 must hide source before checking");
assert.equal(act("next"),true);
assert.equal(act("check",{reason:sentence}),true);
reviewed("T01");
const practiceKey="li.spell.practice.v1:"+encodeURIComponent("test-invited-owner");
let practice=JSON.parse(storage.get(practiceKey));
assert.equal(practice.scopes.standalone.T01.count,1,"T01 review receipt must persist");
assert.equal(practice.scopes.standalone.T01.phase,0);
assert.ok(!storage.get(practiceKey).includes(sentence),"Do not persist raw answers");
begin("T01");
assert.equal(api.getView().practiceCount,1);
assert.equal(api.getView().phase,0,"Completed round starts fresh after reopen");
begin("T02");
assert.equal(api.getT02Status("unknown"),null,"Unlisted lessons cannot inspect schedules");
assert.equal(api.getT02Status("L15-2-2").dueAt,null,
 "A valid released lesson without a schedule is unscheduled");
assert.equal(act("check",{reason:sentence}),false,"T02 cannot skip scheduled review");
assert.equal(act("rate-remembered"),false,"cannot self-rate before retrieval");
assert.equal(act("schedule"),true);
const t02key=[...storage.keys()].find(key=>key.startsWith("li.spell.t02.schedule.v2:"));
assert.ok(t02key,"review schedule must have owner-scoped storage key");
let t02=JSON.parse(storage.get(t02key));
assert.equal(t02.schema,"li.spell.t02.v2");
assert.ok(t02.due>Date.now());
assert.equal(t02.reviewCount,0);
assert.equal(api.getView().phase,0);
assert.equal(api.getT02Status("L09-1-2").dueAt,null,
 "A standalone schedule cannot be shown as L09 progress");
assert.equal(act("check",{reason:sentence}),false,"not yet due cannot reveal feedback");
storage.set(t02key,JSON.stringify({...t02,due:Date.now()-5000}));
assert.equal(api.getView().phase,1,"due review hides the source");
assert.equal(act("check",{reason:""}),true,"incomplete answer shows feedback without completion");
assert.equal(api.getView().reviewedInSession,false);
assert.equal(act("check",{reason:sentence}),true);
reviewed("T02");
assert.equal(api.getView().t02AwaitingRating,true);
assert.equal(act("check",{reason:sentence}),false,"cannot repeat check instead of self-rating");
assert.equal(act("rate-remembered"),true,"confirmed recall schedules the next interval");
t02=JSON.parse(storage.get(t02key));
assert.equal(t02.reviewCount,1);
assert.equal(t02.streak,1);
assert.equal(t02.awaitingRating,false);
assert.ok(Math.abs(t02.due-(Date.now()+3*86400000))<20000,"successful recall schedules 3-day next gap");
assert.equal(api.getView().phase,0);
begin("T02");
assert.equal(api.getView().t02ReviewCount,1,"reopen retains review count");
assert.equal(api.getView().dueAt,t02.due,"reopen retains the next date");
storage.set(t02key,JSON.stringify({...t02,due:Date.now()-1000}));
assert.equal(api.getView().phase,1);
assert.equal(act("check",{reason:sentence}),true);
assert.equal(act("rate-retry"),true,"uncertain recall schedules a shorter gap");
t02=JSON.parse(storage.get(t02key));
assert.equal(t02.reviewCount,2);
assert.equal(t02.streak,0);
assert.equal(t02.lastRating,"retry");
assert.ok(Math.abs(t02.due-(Date.now()+86400000))<20000,"struggle retries after one day");
storage.set("li.sync.local-owner.v1","other-invited-owner");
begin("T02");
assert.equal(api.getView().dueAt,null,"another signed owner never inherits previous schedule");
assert.equal(api.getView().t02ReviewCount,0);
storage.set("li.sync.local-owner.v1","test-invited-owner");
begin("T02");
assert.equal(api.getView().t02ReviewCount,2,"returning owner resumes own schedule");
assert.equal(act("reset"),true);
t02=JSON.parse(storage.get(t02key));
assert.equal(t02.reviewCount,0);
assert.equal(t02.due,null,"reset writes a durable empty schedule, not an unsafe delete");
// T02 must recall the current lesson, not an unrelated generic sampling case.
const releasedT02=["L03-1-2","L09-1-2","L15-2-2"];
const personalT02=["L03-1-1","L03-1-3","L03-2-1","L03-2-2","L03-2-3",
 "L09-1-3","L09-2-1","L09-2-2","L09-2-3","L09-3-1","L09-3-2","L09-3-3",
 "L15-2-1","L15-2-3","L15-3-1","L15-3-2","L15-3-3"];
window.liPersonalStudyRoutes=Object.fromEntries(personalT02.map(id=>[id,"draft:"+id]));
const knownT02=[...releasedT02,...personalT02],recallCues=[];
assert.equal(knownT02.length,20);
for(const id of knownT02){
 if(releasedT02.includes(id))begin("T02",id);
 else{begin("T02");assert.equal(api.setLessonContext(id),true,"Personal lesson "+id+" must bind to T02");}
 const vi=api.getView();
 assert.equal(vi.lessonId,id);
 assert.equal(vi.phase,0,"Unscheduled T02 cannot pretend the review was due");
 assert.equal(vi.feedback,"","Review key must stay hidden before due");
 assert(vi.lesson.length>30&&vi.prompt.length>30,"Vietnamese lesson-specific cue required: "+id);
 assert(!vi.lesson.startsWith("Bạn đã đọc: cỡ mẫu lớn"),"Generic cue not allowed within lesson "+id);
 recallCues.push(vi.prompt);
 locale="en";
 const en=api.getView();
 assert.equal(en.lessonId,id);
 assert(en.lesson.length>30&&en.prompt.length>30,"English lesson-specific cue required: "+id);
 assert.notEqual(en.prompt,vi.prompt,"VI/EN must differ: "+id);
 assert.equal(en.feedback,"","No pre-due model answer for "+id);
 locale="vi";
}
assert.equal(new Set(recallCues).size,20,"Every lesson requires its own retrieval prompt");
// Actual full T02 cycle on supply chain must reveal supply chain feedback,
// and keep the schedule in that lesson, not sampling bias or standalone.
begin("T02","L15-2-2");
assert.match(api.getView().prompt,/ROP|inventory position/);
assert.equal(api.getView().t02Eligible,false,"Unlearned subject must not enter review queue");
assert.equal(act("schedule"),false);
const learnedAttempt={submitted:true,reviewed:true,submittedAt:new Date().toISOString(),
 submission:["answer one","answer two","answer three","answer four"],ratings:[0,1,2,1]};
storage.set("li.review.L15-2-2.v1",JSON.stringify({...learnedAttempt,reviewed:false}));
assert.equal(act("schedule"),false,"Submission alone is not completed self-review");
storage.set("li.review.L15-2-2.v1",JSON.stringify(learnedAttempt));
assert.equal(api.getView().t02Eligible,true);
assert.equal(act("check",{reason:sentence}),false,"No checking before due");
assert.equal(act("schedule"),true);
const l15DueKey=[...storage.keys()].find(key=>
 key.startsWith("li.spell.t02.schedule.v2:")&&key.endsWith(":L15-2-2"));
assert(l15DueKey,"L15 must keep its own T02 schedule");
const l15Due=JSON.parse(storage.get(l15DueKey));
storage.set(l15DueKey,JSON.stringify({...l15Due,due:Date.now()-1000}));
assert.equal(api.getView().phase,1,"Due L15 review must begin hidden-source recall");
assert.equal(api.getView().fields.length,1,"Only an answer field, no source during due retrieval");
assert.equal(act("check",{reason:""}),true);
assert.equal(api.getView().reviewedInSession,false,"Empty recall does not complete review");
assert.equal(act("check",{reason:"ROP dùng demand trong lead time cộng safety stock."}),true);
assert.match(api.getView().feedback,/ROP/,"Must show the L15 feedback only after recall");
assert.doesNotMatch(api.getView().feedback,/Selection bias/i);
assert.equal(act("rate-retry"),true);
assert.equal(JSON.parse(storage.get(l15DueKey)).reviewCount,1,"Review must stay scoped to L15");
const priorReview=JSON.parse(storage.get(l15DueKey));
const dueBeforeDefer=Date.now()-2000;
storage.set(l15DueKey,JSON.stringify({...priorReview,due:dueBeforeDefer}));
assert.equal(api.postponeT02("L15-2-2",dueBeforeDefer-1),false,"Stale due date cannot overwrite schedule");
assert.equal(api.postponeT02("unknown",dueBeforeDefer),false,"Unknown lesson cannot be deferred");
accountOpen=true;
assert.equal(api.postponeT02("L15-2-2",dueBeforeDefer),false,"Account overlay blocks deferral");
accountOpen=false;
storage.set("li.sync.local-owner.v1","other-owner");
assert.equal(api.postponeT02("L15-2-2",dueBeforeDefer),false,"Other owner cannot defer the original schedule");
storage.set("li.sync.local-owner.v1","test-invited-owner");
storage.set(l15DueKey,JSON.stringify({...priorReview,due:dueBeforeDefer,awaitingRating:true}));
assert.equal(api.postponeT02("L15-2-2",dueBeforeDefer),false,"Revealed feedback must finish rating, not become a fresh recall");
storage.set(l15DueKey,JSON.stringify({...priorReview,due:dueBeforeDefer}));
assert.equal(api.postponeT02("L15-2-2",dueBeforeDefer),true,"Defer due review without rating");
const deferred=JSON.parse(storage.get(l15DueKey));
assert.equal(deferred.reviewCount,priorReview.reviewCount);
assert.equal(deferred.streak,priorReview.streak);
assert.equal(deferred.lastRating,priorReview.lastRating);
assert.equal(deferred.lastReviewedAt,priorReview.lastReviewedAt);
assert.ok(Math.abs(deferred.due-Date.now()-86400000)<20000);
assert.equal(api.postponeT02("L15-2-2",deferred.due),false,"Future review cannot be deferred from due queue");
assert.equal(JSON.parse(storage.get(t02key)).reviewCount,0,"L15 cannot modify standalone T02 history");
window.liPersonalStudyRoutes={"L03-1-1":"draftLessonL0311"};
begin("T03");
assert.equal(act("next"),true);
assert.equal(api.getView().phase,1);
begin("T03");
assert.equal(api.getView().phase,1,"T03 guided phase resumes after reload/reopen");
assert.equal(act("check",{number:"99"}),true);
assert.equal(api.getView().phase,1,"Wrong guided calculation must not advance");
assert.equal(api.getView().reviewedInSession,false);
assert.equal(act("check",{number:"14"}),true);
assert.equal(api.getView().phase,2);
begin("T03");
assert.equal(api.getView().phase,2,"T03 independent phase must resume without guided spoiler");
assert.equal(act("check",{number:"26"}),true);
reviewed("T03");
begin("T04");act("check",{reason:sentence});reviewed("T04");
assert.equal(api.getView().practiceCount,1,"Saved completion exposed to React");
assert.equal(act("check",{reason:sentence}),true,"An already checked response remains viewable");
assert.equal(api.getView().practiceCount,1,"Repeated check must not duplicate a receipt");
assert.equal(act("reset"),true);
assert.equal(api.getView().practiceCount,1,"Start over keeps prior practice history");
storage.set("li.sync.local-owner.v1","other-invited-owner");
begin("T04");
assert.equal(api.getView().practiceCount,0,"Another account has no access to prior receipts");
storage.set("li.sync.local-owner.v1","test-invited-owner");
begin("T04");
assert.equal(api.getView().practiceCount,1,"Returning owner recovers own receipt");
// Each published lesson must own its own practice receipt, never 'standalone'.
for(const lesson of ["L03-1-2","L09-1-2","L15-2-2"]){
 begin("T04",lesson);
 assert.equal(api.getView().practiceCount,0,lesson+" should not inherit standalone practice");
 assert.equal(act("check",{reason:sentence}),true);
 assert.equal(api.getView().practiceCount,1,lesson+" saved a scoped round");
 const stored=JSON.parse(storage.get(practiceKey));
 assert.equal(stored.scopes[lesson]?.T04?.count,1);
}
const summaryBefore=storage.get(practiceKey);
assert.equal(JSON.stringify(api.getLessonPracticeSummary("L03-1-2","test-invited-owner")),JSON.stringify([{methodId:"T04",count:1}]));
assert.equal(api.getLessonPracticeSummary("L03-1-2","other-invited-owner"),null);
assert.equal(api.getLessonPracticeSummary("standalone","test-invited-owner"),null);
assert.equal(api.getLessonPracticeSummary("L99-1-1","test-invited-owner"),null);
storage.set("li.sync.local-owner.v1","other-invited-owner");
assert.equal(api.getLessonPracticeSummary("L03-1-2","test-invited-owner"),null);
assert.equal(JSON.stringify(api.getLessonPracticeSummary("L03-1-2","other-invited-owner")),"[]");
storage.set("li.sync.local-owner.v1","test-invited-owner");
accountOpen=true;
assert.equal(api.getLessonPracticeSummary("L03-1-2","test-invited-owner"),null);
accountOpen=false;verified=false;
assert.equal(api.getLessonPracticeSummary("L03-1-2","test-invited-owner"),null);
verified=true;
assert.equal(storage.get(practiceKey),summaryBefore,"Reader must not write or mutate saved practice");
storage.set(practiceKey,"broken");
assert.equal(api.getLessonPracticeSummary("L03-1-2","test-invited-owner"),null);
assert.equal(storage.get(practiceKey),"broken");
storage.set(practiceKey,summaryBefore);
begin("T04");
assert.equal(api.getView().practiceCount,1,"Published lessons do not inflate standalone count");
window.liPersonalStudyRoutes={"L03-1-1":"draftLessonL0311"};
begin("T04");
assert.equal(api.setLessonContext("L03-1-1"),true);
assert.equal(api.getView().lessonId,"L03-1-1");
assert.equal(api.getView().practiceCount,0,"Other lesson must not inherit standalone receipts");
act("check",{reason:sentence});
assert.equal(api.getView().practiceCount,1,"A personal lesson has a distinct record");
begin("T04");
assert.equal(api.getView().practiceCount,1,"Standalone history is independent");
assert.equal(api.setLessonContext("unknown"),false,"Non-invited route context is rejected");
// The same invited draft context must persist the dedicated T02/T12 records.
begin("T02");
assert.equal(api.setLessonContext("L03-1-1"),true);
assert.equal(api.getView().lessonId,"L03-1-1");
assert.equal(api.getT02Status("L03-1-1").dueAt,null);
assert.equal(act("schedule"),false,"Invited draft is not automatically learned");
storage.set("li.review.L03-1-1.v1",JSON.stringify(learnedAttempt));
assert.equal(act("schedule"),true);
assert.ok(api.getT02Status("L03-1-1").dueAt>Date.now(),
 "Personal lesson Progress reads its own upcoming due date");
assert([...storage.keys()].some(k=>k.endsWith(":L03-1-1")&&k.startsWith("li.spell.t02.schedule.v2:")),
 "T02 schedule must use the personal draft lesson, not the standalone key");
begin("T12");
assert.equal(api.setLessonContext("L03-1-1"),true);
assert.equal(api.setT12Draft("context","Đang đọc bài HCI"),true);
assert.equal(api.setT12Draft("next","Viết một câu phản chứng"),true);
assert([...storage.keys()].some(k=>k.endsWith(":L03-1-1")&&k.startsWith("li.spell.t12.resume.v1:")),
 "T12 unfinished draft must use the personal lesson storage key");
assert.equal(api.getView().t12SavedOnDevice,true);
begin("T05");act("check",{evidence:["0","1"],reason:sentence});reviewed("T05");
begin("T06","L03-1-2");
locale="en";
assert.equal(api.getView().fields.length,4,"L03 authored interview variant must stay intact");
act("check",{case1:"0",case2:"1",reason:sentence,rewrite:"Tell me about the last time you used this interface."});
assert.match(api.getView().feedback,/Both classifications are correct/);
reviewed("T06");
locale="vi";
begin("T07");act("check",{valid:"0",truth:"1"});reviewed("T07");
begin("T08");act("check",{claim:sentence,evidence:sentence,warrant:sentence,counter:sentence});reviewed("T08");
begin("T09");act("check",{source:"1",reason:sentence});reviewed("T09");
begin("T10");act("check",{constraint:sentence,steps:sentence,edge:sentence});reviewed("T10");
begin("T11");act("check",{method:"1",reason:sentence});reviewed("T11");
begin("T12","L09-1-2");
assert.equal(api.setT12Draft("context","Đang tổng hợp kết quả khảo sát"),true);
assert.equal(api.setT12Draft("next","Viết một kết luận đúng phạm vi mẫu"),true);
assert.equal(act("next",{context:"Đang tổng hợp kết quả khảo sát",
 next:"Viết một kết luận đúng phạm vi mẫu"}),true);
assert.equal(api.getView().phase,1);
assert.ok(api.getView().t12SavedOnDevice);
assert.equal(act("check",{answer:"15 trong 20 người được hỏi hài lòng."}),true);
reviewed("T12");
const t12key=[...storage.keys()].find(key=>key.startsWith("li.spell.t12.resume.v1:")&&key.endsWith(":L09-1-2"));
assert.ok(t12key);
const terminal=JSON.parse(storage.get(t12key));
assert.equal(terminal.phase,2,"T12 completion must redact the previous cue");
assert.equal(terminal.answer,"");
begin("T13");
assert.equal(act("next",{place1:"cửa",cue1:"A",place2:"cửa",cue2:"B",
 place3:"bàn",cue3:"C"}),true);
assert.equal(api.getView().phase,0,"Three places must be distinct");
assert.equal(act("next",{place1:"cửa",cue1:"A",place2:"bàn",cue2:"B",
 place3:"bếp",cue3:"C"}),true);
assert.equal(api.getView().phase,1);
assert.equal(api.getView().places.length,3);
begin("T13");
assert.equal(api.getView().phase,1,"T13 resumes the hidden-source recall step");
assert.equal(api.getView().places.length,3,"T13 needs the chosen loci to resume recall");
assert.equal(act("check",{recall1:"tổng thể đích",recall2:"cách chọn mẫu",
 recall3:"nhóm không được hỏi"}),true);
reviewed("T13");
assert.equal(covered,13);
// The six Wave1 lesson recommendations must practice the *taught* subject.
// T06/L03, T06/L09 and T03/L15 were already contextual; these were the
// remaining three mismatches. Check both language variants and feedback gate.
const contextual=[
 {id:"L03-1-2",method:"T04",vi:/câu hỏi|phỏng vấn/i,
  en:/interview|feature/i,answer:{reason:"Câu hỏi gợi khen ngợi; hãy kể trải nghiệm lưu ghi chú gần nhất."},
  feedback:/câu hỏi|leading|question/i},
 {id:"L09-1-2",method:"T07",vi:/banner|tiền đề/i,
  en:/banner|premise/i,answer:{valid:"0",truth:"1"},
  feedback:/Logical form|logically/i},
 {id:"L15-2-2",method:"T10",vi:/ROP|lead time/i,
  en:/reorder|lead time/i,answer:{constraint:"Lead time 5 ngày, ROP 150",steps:"Kiểm inventory position, rồi so với ROP",edge:"Lead time tăng 12 ngày cần tính lại ROP"},
  feedback:/ROP|reorder point/i}
];
for(const item of contextual){
 locale="vi";
 let v=begin(item.method,item.id);
 assert.match(v.lesson,item.vi,"Vietnamese source must belong to "+item.id);
 assert.match(v.prompt,item.vi,"Vietnamese practice must belong to "+item.id);
 assert.equal(v.feedback,"","Answer key must not appear before response");
 const viPrompt=v.prompt;
 locale="en";
 v=api.getView();
 assert.match(v.lesson,item.en,"English source must belong to "+item.id);
 assert.match(v.prompt,item.en,"English practice must belong to "+item.id);
 assert.notEqual(v.prompt,viPrompt,"Switching locale must update prompt");
 assert.equal(v.feedback,"","Locale change must not leak feedback");
 assert.equal(act("check",item.answer),true,"Contextual suggested exercise must accept real input");
 assert.match(api.getView().feedback,item.feedback,"Authored model feedback must match the method and lesson");
 assert.equal(api.getView().reviewedInSession,true);
}
locale="vi";
for(const method of ["T04","T07","T10"]){
 const v=begin(method);
 assert.match(v.lesson,/khảo sát|tiền đề|kho tổng/i,
  "Standalone method must keep its original independent demo");
}

const previousCount=api.getView().practiceCount;
begin("T04");
const beforeFailure=api.getView().practiceCount,storageWrite=localStorage.setItem;
localStorage.setItem=(key,value)=>{
 if(key.startsWith("li.spell.practice.v1:"))throw Error("STORAGE_QUOTA");
 storageWrite(key,value);
};
assert.equal(act("check",{reason:sentence}),true,"Feedback may be shown even when receipt save fails");
assert.equal(api.getView().practiceCount,beforeFailure,"Failed writes cannot invent progress");
assert.match(api.getView().practiceError,/Chưa lưu được/,"Failure remains visible after React reads state");
assert.equal(act("reset"),false,"A failed reset must not claim to have cleared saved phase");
localStorage.setItem=storageWrite;
begin("T04");
assert.equal(act("check",{reason:sentence}),true);
assert.equal(api.getView().practiceCount,beforeFailure+1);
assert.equal(api.getView().practiceError,"","A confirmed save clears the warning");
practice=JSON.parse(storage.get(practiceKey));
assert.equal(practice.scopes.standalone.T13.count,1);
assert.equal(practice.scopes.standalone.T13.places.length,0,
 "Completed T13 removes location cues, keeping only an answer-free receipt");
verified=false;
assert.equal(api.getT02Status("L15-2-2"),null,
 "Anonymous users cannot read private due dates");
begin("T04");
assert.equal(act("check",{reason:sentence}),false,"No anonymous exercise action");
assert.equal(api.getView().reviewedInSession,false);
verified=true;accountOpen=true;
assert.equal(api.getT02Status("L15-2-2"),null,
 "Open account overlay cannot reveal private due dates");
assert.equal(act("check",{reason:sentence}),false,"Open account overlay blocks writes/actions");
console.log("PASS 13/13 real spell checkers via direct React action, T02 20/20 contextual VI/EN cues and due/rating/owner/reset, T03 progression, T12 redaction, T13 recall, L03 variant and account guard");
