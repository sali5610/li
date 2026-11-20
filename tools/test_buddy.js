#!/usr/bin/env node
/* Zero-dependency smoke test for li. contextual Lão Lý across 12 screens × 3 scenarios. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const src=fs.readFileSync("site/assets/laoly-context-s112.js","utf8");
const ids=new Map();
function node(id){
 if(ids.has(id))return ids.get(id);
 const obj={id,textContent:"",value:"",hidden:false,scrollTop:0,src:"",
   classList:{contains:()=>true},querySelector:()=>null,replaceChildren(){},
   setAttribute(){},scrollIntoView(){},focus(){},click(){},addEventListener(){}};
 ids.set(id,obj);return obj;
}
const docs={getElementById:node,addEventListener(){},querySelector:()=>node("query"),querySelectorAll:()=>[]};
const scenarios=[
 {buddy:"Lão muốn biết mẫu khảo sát được lấy từ đâu.",question:"90% hài lòng",observed:"Chỉ người đang dùng",unknown:"Người chưa dùng",branches:["Ai được hỏi?"]},
 {buddy:"Chuẩn mực do ai đặt ra trong cộng đồng này?",question:"Ai đặt chuẩn mực?",observed:"Có nhãn",unknown:"Ai đặt ra nhãn",branches:["Ai tạo chuẩn?"]},
 {buddy:"Kho tổng còn hàng, nhưng cửa hàng lại hết — vì sao?",question:"Vì sao hết hàng?",observed:"Kho tổng còn",unknown:"Hàng ở đâu",branches:["Hàng nằm đâu?"]}
];
const methods=[
 ["T01","Triệu Ức","Retrieval Practice / Active Recall","Tự nhớ","Ký Ức Thuật"],
 ["T02","Thời Ấn","Spaced Repetition / Distributed Practice","Ôn cách quãng","Ký Ức Thuật"],
 ["T04","Tự Giải","Guided Self-Explanation","Giải thích","Minh Giải Thuật"],
 ["T05","Truy Nguyên","Elaborative Interrogation","Hỏi nguyên nhân","Minh Giải Thuật"],
 ["T09","Giám Chứng","Source Criticism & Evidence Appraisal","Kiểm tra nguồn","Luận Chứng Thuật"]
];
const STUDY_MODES={start:{label:"Vào nhịp",feedback:"Gợi ý 3 phép",suggestions:["T01","T04"]},
focus:{label:"Đào sâu",feedback:"Đủ 13",suggestions:null},
overload:{label:"Quá tải",feedback:"Giảm",suggestions:["T01"]},
recover:{label:"Hồi trí",feedback:"Nhẹ",suggestions:["T04"]}};
const ctx={document:docs,window:{},scenarios,methods,STUDY_MODES,
 qIndex:0,currentPage:"home",studyMode:"start",currentCategory:"Tất cả",savedQuestions:[],
 processedCases:[],selectedCaseAnswer:null,buddyDebateActive:false,
 openLaoLy(){},closeModal(){},openModal(){},showBuddyQuote(){},refreshLucide(){},
 toast(){},navigate(){},showMethod(){},console};
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:"laoly-context-s112.js"});
assert.equal(typeof ctx.window.liGetBuddyPlan,"function");
const pages=["home","catalog","research","lesson","case","guide","guideDetail","library","dashboard","settings","search","capture"];
let tested=0;
for(let k=0;k<3;k++){
 ctx.qIndex=k;
 for(const page of pages){
  ctx.currentPage=page;
  const p=ctx.window.liGetBuddyPlan();
  assert.equal(typeof p.intro,"string",page);
  assert.ok(p.intro.length>15,page+" intro too short");
  assert.equal(p.actions.length,3,page);
  for(const a of p.actions){assert.ok(a.label&&a.reply,page+" incomplete action");}
  if(k!==0&&["home","research"].includes(page))
   assert.ok(!p.intro.includes("90%"),page+" leaked sampling copy into unrelated scenario");
  tested++;
 }
}
ctx.currentPage="guide";
const guidePlan=ctx.window.liGetBuddyPlan();
for(const academicName of ["Retrieval Practice","Spaced Repetition","Guided Self-Explanation","Elaborative Interrogation","Source Criticism & Evidence Appraisal"]){
 assert.ok(guidePlan.actions[0].reply.includes(academicName),"Missing original academic name "+academicName);
}
assert.ok(!/\bT\d\d\b/.test(guidePlan.actions[0].reply),"Raw method codes should never replace names in learner-facing guidance");
assert.ok(guidePlan.actions[1].label.startsWith("Xem Retrieval Practice"),"Guide CTA should name the method");
ctx.currentPage="research";ctx.qIndex=1;
assert.equal(ctx.window.liGetBuddyPlan().actions[2].label,"Xem đánh giá nguồn");
assert.ok(ctx.window.liGetBuddyPlan().actions[2].reply.includes("Source Criticism & Evidence Appraisal"));
ctx.currentPage="guide";
for(const mode of ["start","focus","overload","recover"]){
 ctx.studyMode=mode;
 const p=ctx.window.liGetBuddyPlan();
 assert.ok(p.intro.includes(STUDY_MODES[mode].label),"Mode mismatch");
}
ctx.currentPage="library";ctx.processedCases.push({title:"Test"});ctx.savedQuestions.push({question:"test"});
assert.ok(ctx.window.liGetBuddyPlan().intro.includes("1 Bút Ký"),"Saved items not reflected");
ctx.currentPage="case";ctx.selectedCaseAnswer="right";node("case-revision").value="Kết luận chỉ đúng với người tham gia";
assert.equal(ctx.window.liGetBuddyPlan().actions[2].label,"Lưu Bút Ký");
ctx.currentPage="search";
node("global-search").value="";
ctx.window.liSearch={getQuery:()=>"Selection bias",getMentorContext:()=>null};
assert.ok(ctx.window.liGetBuddyPlan().intro.includes("Selection bias"),"React query must reach Lão Lý");
ctx.window.liSearch={getQuery:()=>"",getMentorContext:()=>null};
node("global-search").value="L09-1-2";
assert.ok(!ctx.window.liGetBuddyPlan().intro.includes("L09-1-2"),"Empty React query must not fall back to hidden stale input");
ctx.window.liSearch={getMentorContext:()=>null};
assert.ok(ctx.window.liGetBuddyPlan().intro.includes("L09-1-2"),"Legacy query remains available without React API");
ctx.currentPage="home";ctx.qIndex=1;
ctx.openLaoLy();
assert.ok(node("buddy-text").textContent.includes("Chuẩn mực"));
assert.ok(node("buddy-question").textContent);
// Invited React context: every action must operate on the visible UI model,
// not the previous native page's stale hidden textarea/button/filter state.
let savedFromReact=0,caseSaves=0,navigated='';
ctx.window.liBuddyReactMounted=true;
ctx.window.liInquiryFlow={
 getMirror:()=>({saved:false}),toggleQuestion:()=>{savedFromReact++;return true;},
 getResearch:()=>({feedback:"Hãy kiểm chứng: Ai được hỏi?"})
};
ctx.currentPage="home";ctx.qIndex=0;
ctx.window.liGetBuddyPlan().actions[2].perform();
assert.equal(savedFromReact,1,"React mirror bookmark must call canonical action");
ctx.window.liInquiryFlow.getMirror=()=>({saved:true});
assert.equal(ctx.window.liGetBuddyPlan().actions[2].label,"Mở Dấu Trang");
ctx.window.liAppRouter={navigate:route=>{navigated=route;return true;}};
ctx.window.liGetBuddyPlan().actions[2].perform();
assert.equal(navigated,"resume","Saved questions should open the real React bookmark route");
ctx.currentPage="research";
assert.equal(ctx.window.liGetBuddyPlan().actions[2].label,"Sang Phản Chứng");
ctx.currentPage="case";ctx.selectedCaseAnswer=null;
node("case-revision").value=""; // Stale hidden native form must be ignored.
ctx.window.liCaseUi={
 getState:()=>({choice:"right",revision:"Một kết luận dành riêng cho người được hỏi"}),
 submit:()=>{caseSaves++;return true;}
};
const liveCase=ctx.window.liGetBuddyPlan();
assert.equal(liveCase.actions[2].label,"Lưu Bút Ký");
liveCase.actions[2].perform();
assert.equal(caseSaves,1,"Mentor must save using real React Case submit");
ctx.window.liCaseUi.getState=()=>({choice:null,revision:""});
assert.equal(ctx.window.liGetBuddyPlan().actions[2].label,"Viết Luận Kết");
ctx.currentPage="guide";ctx.window.liGuideUi={getState:()=>({query:"T09",category:"Tất cả"})};
assert.equal(ctx.window.liGetBuddyPlan().actions[2].label,"Sửa từ khóa");
ctx.currentPage="guideDetail";ctx.window.LiSpellPractice={getView:()=>({active:"T09"})};
assert.ok(ctx.window.liGetBuddyPlan().intro.includes("Source Criticism"));
ctx.currentPage="capture";node("capture-note").value="";
ctx.window.liCaptureUi={getDraft:()=>"Một ý còn cần kiểm chứng"};
assert.ok(ctx.window.liGetBuddyPlan().intro.includes("Ngươi đã nhặt được một ý"));
ctx.currentPage="dashboard";
ctx.window.liPersonalDiary={getView:()=>({totals:{recorded:4},consentStatus:"Đang lưu trên máy"})};
assert.ok(ctx.window.liGetBuddyPlan().intro.includes("4 ngày ghi nhận"));
ctx.currentPage="catalog";
ctx.window.liGetBuddyPlan().actions[2].perform();
assert.equal(navigated,"lessonL09","Lão Lý must open the actually released React lesson");
console.log("PASS "+tested+" companion plans, 4 study modes, saved counts, React contextual actions across 8 routes");

