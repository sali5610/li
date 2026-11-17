/* S137 · Home mirror bidirectional navigation runtime. No browser/photo visual QA implied. */
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const assert=require("node:assert/strict");
const html=fs.readFileSync(path.resolve(__dirname,"../site/index.html"),"utf8");
const start=html.indexOf("function shiftMirrorQuestion(direction){");
const end=html.indexOf('document.getElementById("finish-case")',start);
assert(start>=0&&end>start,"Mirror arrows event handlers missing");
const hooks=new Map(), updates={question:"",scene:""};
const scenarios=[
 {question:"Q0",scene:"S0"},
 {question:"Q1",scene:"S1"},
 {question:"Q2",scene:"S2"}
];
let syncCalls=0,companionCalls=0;
const sandbox={
 qIndex:0,scenarios,
 document:{getElementById(id){
  if(id==="mirror-question")return {set textContent(v){updates.question=v}};
  if(id==="home-scene")return {set textContent(v){updates.scene=v}};
  if(id==="previous-question"||id==="shuffle")return {addEventListener(type,cb){assert.equal(type,"click");hooks.set(id,cb)}};
  throw Error("Unexpected element "+id);
 }},
 syncResearch(){syncCalls++},
 placeCompanion(){companionCalls++}
};
vm.createContext(sandbox);
vm.runInContext(html.slice(start,end),sandbox);
assert.equal(hooks.size,2,"Both arrow buttons must register handlers");
for(const [id,expected] of [
 ["previous-question",2],
 ["shuffle",0],
 ["shuffle",1],
 ["shuffle",2],
 ["shuffle",0],
 ["previous-question",2]
]){
 hooks.get(id)();
 assert.equal(sandbox.qIndex,expected,id+" index");
 assert.equal(updates.question,"Q"+expected,id+" question");
 assert.equal(updates.scene,"S"+expected,id+" context");
}
assert.equal(syncCalls,6,"Research context must stay synchronized");
assert.equal(companionCalls,6,"Lão Lý context must stay synchronized");
assert(html.includes("animation:li-mirror-copy-float 4.2s ease-in-out infinite;"),"Question must still float");
assert(!html.includes("animation:li-mirror-float 4s ease-in-out infinite;"),"Refresh float must not remain");
assert(html.includes("#page-home .mirror-controls .mirror-refresh{\n  animation:none!important;"),"Arrow controls must be stationary");
console.log("PASS S137 mirror arrows: next/previous/wrap/context sync, stationary controls, floating question");
