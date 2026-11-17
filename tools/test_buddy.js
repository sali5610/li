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
 {buddy:"Khảo sát",question:"90% hài lòng",observed:"Chỉ người đang dùng",unknown:"Người chưa dùng",branches:["Ai được hỏi?"]},
 {buddy:"Chuẩn mực",question:"Ai đặt chuẩn mực?",observed:"Có nhãn",unknown:"Ai đặt ra nhãn",branches:["Ai tạo chuẩn?"]},
 {buddy:"Kho hàng",question:"Vì sao hết hàng?",observed:"Kho tổng còn",unknown:"Hàng ở đâu",branches:["Hàng nằm đâu?"]}
];
const methods=[
 ["T01","Triệu Ức","Retrieval Practice","Tự nhớ","Ký Ức Thuật"],
 ["T04","Tự Giải","Self-explanation","Giải thích","Minh Giải Thuật"],
 ["T09","Giám Chứng","Source appraisal","Kiểm tra nguồn","Luận Chứng Thuật"]
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
for(const mode of ["start","focus","overload","recover"]){
 ctx.studyMode=mode;
 const p=ctx.window.liGetBuddyPlan();
 assert.ok(p.intro.includes(STUDY_MODES[mode].label),"Mode mismatch");
}
ctx.currentPage="library";ctx.processedCases.push({title:"Test"});ctx.savedQuestions.push({question:"test"});
assert.ok(ctx.window.liGetBuddyPlan().intro.includes("1 Bút Ký"),"Saved items not reflected");
ctx.currentPage="case";ctx.selectedCaseAnswer="right";node("case-revision").value="Kết luận chỉ đúng với người tham gia";
assert.equal(ctx.window.liGetBuddyPlan().actions[2].label,"Lưu Bút Ký");
ctx.currentPage="home";ctx.qIndex=1;
ctx.openLaoLy();
assert.ok(node("buddy-text").textContent.includes("Chuẩn mực"));
assert.ok(node("buddy-question").textContent);
console.log("PASS "+tested+" companion plans, 4 study modes, saved counts, case action, opening dialog");
