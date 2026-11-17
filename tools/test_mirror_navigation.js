/* S137 · Home mirror bidirectional navigation runtime. No browser/photo visual QA implied. */
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const assert=require("node:assert/strict");
const html=fs.readFileSync(path.resolve(__dirname,"../site/index.html"),"utf8");
const css=fs.readFileSync(path.resolve(__dirname,"../site/assets/li-layout.css"),"utf8");
const start=html.indexOf("function shiftMirrorQuestion(direction){");
const end=html.indexOf('document.getElementById("finish-case")',start);
assert(start>=0&&end>start,"Mirror arrows event handlers missing");
const hooks=new Map(), swipeHooks=new Map(), updates={question:"",scene:""};
const scenarios=[
 {question:"Q0",scene:"S0"},
 {question:"Q1",scene:"S1"},
 {question:"Q2",scene:"S2"}
];
let syncCalls=0,companionCalls=0;
const sandbox={
 qIndex:0,scenarios,
 document:{
 querySelector(selector){
  assert.equal(selector,"#page-home .mirror-message");
  return {addEventListener(type,cb,opts){
   assert.equal(opts.passive,true,"Swipe must never cancel vertical page scrolling");
   swipeHooks.set(type,cb);
  }};
 },
 getElementById(id){
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
assert.equal(swipeHooks.size,3,"touchstart/touchend/touchcancel should be registered");
const touch=(x,y)=>({clientX:x,clientY:y});
const begin=(x,y,{onButton=false,multi=false}={})=>swipeHooks.get("touchstart")({
 touches:multi?[touch(x,y),touch(x+1,y)]:[touch(x,y)],
 target:{closest(selector){assert.equal(selector,"button");return onButton?{}:null}}
});
const endTouch=(x,y)=>swipeHooks.get("touchend")({changedTouches:[touch(x,y)]});

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
// From index 2: swipe left goes forward to index 0, right backward to 2.
begin(120,60);endTouch(50,64);
assert.equal(sandbox.qIndex,0,"Swipe left advances with wraparound");
assert.equal(updates.question,"Q0");
assert.equal(updates.scene,"S0");
begin(70,50);endTouch(145,55);
assert.equal(sandbox.qIndex,2,"Swipe right goes backward with wraparound");
begin(100,50);endTouch(65,52);
assert.equal(sandbox.qIndex,2,"Tiny swipes must be ignored");
begin(100,50);endTouch(40,125);
assert.equal(sandbox.qIndex,2,"Vertical scrolling must not change questions");
begin(100,50,{onButton:true});endTouch(20,50);
assert.equal(sandbox.qIndex,2,"Arrow taps must not also trigger a swipe");
begin(100,50,{multi:true});endTouch(20,50);
assert.equal(sandbox.qIndex,2,"Multitouch must not navigate questions");
begin(100,50);swipeHooks.get("touchcancel")();endTouch(20,50);
assert.equal(sandbox.qIndex,2,"Cancelled gestures must not navigate");
assert.equal(syncCalls,8,"Research context sync for arrows and valid swipes only");
assert.equal(companionCalls,8,"Lão Lý context sync for arrows and valid swipes only");
assert(css.includes("touch-action:pan-y;"),"Swipe surface must preserve vertical page scroll");
assert(css.includes("animation:li-mirror-copy-float 4.2s ease-in-out infinite;"),"Question must still float");
assert(!css.includes("animation:li-mirror-float 4s ease-in-out infinite;"),"Refresh float must not remain");
assert(css.includes("#page-home .mirror-controls .mirror-refresh{\n  animation:none!important;"),"Arrow controls must be stationary");
console.log("PASS S138 mirror gestures: bidirectional arrows, swipe threshold, vertical scroll, cancelled touches, content/mentor sync");
