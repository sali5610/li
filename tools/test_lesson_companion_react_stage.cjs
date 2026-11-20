#!/usr/bin/env node
/* Focused native mentor × React L09 stage handoff, no private learner data. */
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const read=filename=>fs.readFileSync(path.join(__dirname,"..",filename),"utf8");
const react=read("tools/step16-real-l09-react-island/src/learning/LearningJourney.tsx");
const wave=read("tools/step16-real-l09-react-island/src/learning/Wave1Journey.tsx");
for(const source of [react,wave]){
 assert.match(source,/li:mentor-phase-jump/,"React lesson must listen to Lão Lý navigation");
 assert.match(source,/next==='feedback'.*!attempt\?\.submitted/,
  "Never reveal feedback before real submission");
 assert.match(source,/next==='progress'.*!attempt\?\.reviewed/,
  "Progress remains gated by real review");
 assert.match(source,/li-learning-current/,"Jump must target visible React content");
}
assert.match(react,/data-li-lesson-phase=\{phase\}/);
assert.match(react,/data-li-lesson-submitted=\{attempt\.submitted\?/);
const stages=["opening","concept","guided","independent","reflection","extension"];
const attrs={"data-li-lesson-phase":"practice","data-li-lesson-submitted":"false",lang:"vi"};
const live={getAttribute:key=>attrs[key]??null};
const root={id:"page-lessonL09",classList:{contains:k=>k==="active"},
 getAttribute:k=>({"data-lesson-id":"L09-1-2",
 "data-companion-manifest":"./lessons/companion/L09-1-2.json",lang:"vi"}[k]??null),
 querySelector:()=>null};
const manifest={schema:1,lesson_id:"L09-1-2",topics:["sampling","bias"],
 moments:stages.map(stage=>({stage,anchor:"l09-"+stage,quote_ids:["a","b","c"],
 vi:{label:stage,prompt:stage,actions:[{label:"Một",reply:"Một"},{label:"Hai",reply:"Hai"}]},
 en:{label:stage,prompt:stage,actions:[{label:"One",reply:"One"},{label:"Two",reply:"Two"}]}}))};
let legacyScrolls=0;
const target={textContent:"",getBoundingClientRect:()=>({top:0}),
 scrollIntoView(){legacyScrolls++}};
const document={baseURI:"http://localhost/li/",documentElement:{lang:"vi"},
 querySelector:()=>live,
 querySelectorAll:q=>q==="[data-lesson-id][data-companion-manifest]"?[root]:[],
 getElementById:()=>target,addEventListener(){}};
const methods=JSON.parse(read("site/assets/lesson-spell-suggestions.v0.1.json"));
let invoked=null;
const events=[];
class CustomEventStub{
 constructor(type,options){this.type=type;this.detail=options.detail;}
}
const ctx={document,CustomEvent:CustomEventStub,
 window:{innerHeight:820,addEventListener(){},dispatchEvent:event=>events.push(event)},
 localStorage:{getItem:()=>null},console,URL,
 fetch:async url=>({ok:true,json:async()=>String(url).includes("lesson-spell-suggestions")?methods:manifest}),
 requestAnimationFrame:fn=>fn(),closeModal:()=>{},
 showMethod:(id,options)=>{invoked={id,options}}};
vm.createContext(ctx);
vm.runInContext(read("site/assets/lesson-companion-native.js"),ctx);
(async()=>{
 for(let n=0;n<8;n++)await Promise.resolve();
 const api=ctx.window.liLessonCompanion;
 assert.equal(api.registered().length,1);
 assert.ok(api.registered().includes("page-lessonL09"));
 const plan=()=>api.getPlan("lessonL09"),get=()=>api.getContext();
 assert.equal(get().stage,"independent");
 assert.equal(get().submitted,false);
 assert.equal(plan().actions[2].label,"Đọc lại mục này");
 plan().actions[2].perform();
 assert.equal(events.at(-1)?.type,"li:mentor-phase-jump");
 assert.equal(events.at(-1)?.detail.lessonId,"L09-1-2");
 assert.equal(events.at(-1)?.detail.phase,"practice");
 assert.equal(legacyScrolls,0,"must not scroll to hidden legacy anchor");
 attrs["data-li-lesson-phase"]="feedback";
 assert.equal(get().stage,"independent","no reflection before a submitted attempt");
 plan().actions[2].perform();
 assert.equal(events.at(-1)?.detail.phase,"practice",
  "blocked feedback can only route back to independent practice");
 attrs["data-li-lesson-submitted"]="true";
 assert.equal(get().stage,"reflection");
 assert.match(plan().actions[2].label,/T06/);
 assert.match(plan().actions[2].reply,/chưa duyệt/);
 plan().actions[2].perform();
 assert.equal(invoked.id,"T06");
 assert.equal(invoked.options.practice,true);
 assert.equal(invoked.options.lessonId,"L09-1-2","Mentor method action must preserve lesson context");
 attrs["data-li-lesson-phase"]="guided";attrs["data-li-lesson-submitted"]="false";
 assert.equal(get().stage,"guided");
 assert.equal(plan().actions[2].label,"Đọc lại mục này");
 attrs.lang="en";
 assert.equal(plan().actions[2].label,"Read this section");
 attrs["data-li-lesson-phase"]="progress";attrs["data-li-lesson-submitted"]="true";
 assert.equal(get().stage,"extension");
 assert.match(plan().actions[2].reply,/not reviewed method fit/i);
 console.log("PASS L09 React stage → Lão Lý, no early reflection, post-submit real L2 method practice, VI/EN");
})().catch(e=>{console.error(e);process.exitCode=1;});
