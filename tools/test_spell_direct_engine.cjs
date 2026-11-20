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
 'window.__spellTest={open,getView,performReact,setT12Draft,switchTab,setLessonContext};\n})();');
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
assert.ok(api&&Object.keys(api).length===6);
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
assert.equal(act("schedule"),true);
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
const t12key=[...storage.keys()].find(key=>key.startsWith("li.spell.t12.resume.v1:"));
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
begin("T04");
assert.equal(act("check",{reason:sentence}),false,"No anonymous exercise action");
assert.equal(api.getView().reviewedInSession,false);
verified=true;accountOpen=true;
assert.equal(act("check",{reason:sentence}),false,"Open account overlay blocks writes/actions");
console.log("PASS 13/13 real spell checkers via direct React action, T02 multi-session due/rating/owner/reset, T03 progression, T12 redaction, T13 recall, L03 variant and account guard");
