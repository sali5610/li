/* S158 · Real mirror renderer + S138 gesture behavior, zero-cost V8 fake DOM.
   Tests both problem → Khảo Chứng and published hook → canonical lesson routes. */
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const assert=require("node:assert/strict");
const html=fs.readFileSync(path.resolve(__dirname,"../site/index.html"),"utf8");
const css=fs.readFileSync(path.resolve(__dirname,"../site/assets/li-layout.css"),"utf8");
assert(!html.includes('class="mirror-titlebar"')&&!html.includes('class="mirror-label"'),"The visible Home mirror title must be removed");
assert(html.includes('aria-label="Cảnh thư viện cổ thụ và Gương Vạn Vấn"'),"Mirror retains meaningful accessible region name");
const renderStart=html.indexOf("function renderMirrorItem(){");
const renderEnd=html.indexOf("let selectedCaseAnswer=null;",renderStart);
const start=html.indexOf("function shiftMirrorQuestion(direction){");
const end=html.indexOf('document.getElementById("finish-case")',start);
assert(renderStart>=0&&renderEnd>renderStart&&start>=0&&end>start,"Mirror renderer/arrows event handlers missing");
const hooks=new Map(),swipeHooks=new Map(),updates={question:"",scene:"",source:"",cta:"",aria:""};
const scenarios=[
 {question:"Q0",scene:"S0"},
 {question:"Q1",scene:"S1",type:"hook",lessonRoute:"lessonL03"},
 {question:"Q2",scene:"S2"},
 {question:"Q3",scene:"S3",type:"hook",lessonRoute:"lessonL15"},
 {question:"Q4",scene:"S4"},
 {question:"Q5",scene:"S5",type:"hook",lessonRoute:"lessonL09"}
];
const primary={dataset:{},setAttribute(k,v){assert.equal(k,"aria-label");updates.aria=v}};
let syncCalls=0,companionCalls=0;
const sandbox={
 qIndex:0,scenarios,
 document:{
  querySelector(selector){
   if(selector==="#page-home .mirror-message")return {addEventListener(type,cb,opts){
    assert.equal(opts.passive,true,"Swipe must never cancel vertical scroll");
    swipeHooks.set(type,cb);
   }};
   if(selector==="#page-home .hero-dialogue .example-label")return {set textContent(v){updates.source=v}};
   throw Error("Unexpected querySelector "+selector);
  },
  getElementById(id){
   if(id==="mirror-question")return {set textContent(v){updates.question=v}};
   if(id==="home-scene")return {set textContent(v){updates.scene=v}};
   if(id==="mirror-primary-action")return primary;
   if(id==="mirror-primary-label")return {set textContent(v){updates.cta=v}};
   if(id==="previous-question"||id==="shuffle")return {addEventListener(type,cb){assert.equal(type,"click");hooks.set(id,cb)}};
   throw Error("Unexpected element "+id);
  }
 },
 syncResearch(){syncCalls++},
 placeCompanion(){companionCalls++}
};
vm.createContext(sandbox);
vm.runInContext(html.slice(renderStart,renderEnd)+"\n"+html.slice(start,end),sandbox);
assert.equal(hooks.size,2,"Arrow handlers");
assert.equal(swipeHooks.size,3,"Swipe start/end/cancel handlers");
function verify(index){
 assert.equal(sandbox.qIndex,index,"Current index");
 assert.equal(updates.question,"Q"+index,"Mirror headline");
 assert.equal(updates.scene,"S"+index,"Lão Lý contextual scene");
 const item=scenarios[index],hook=item.type==="hook";
 assert.equal(updates.cta,hook?"Khám phá vì sao":"Đào sâu","Distinct primary action");
 assert.equal(primary.dataset.page,hook?item.lessonRoute:"research","Valid destination");
 assert.equal(updates.source,hook?"TỪ BÀI HỌC ĐÃ XUẤT BẢN":"VÍ DỤ GIẢ ĐỊNH","Evidence label");
 assert(updates.aria.includes(hook?"Mở bài học liên quan":"Mở Khảo Chứng"),"Accessible action");
}
const touch=(x,y)=>({clientX:x,clientY:y});
const begin=(x,y,{onButton=false,multi=false}={})=>swipeHooks.get("touchstart")({
 touches:multi?[touch(x,y),touch(x+1,y)]:[touch(x,y)],
 target:{closest(selector){assert.equal(selector,"button");return onButton?{}:null}}
});
const endTouch=(x,y)=>swipeHooks.get("touchend")({changedTouches:[touch(x,y)]});
for(const [id,expected] of [
 ["previous-question",5],
 ["shuffle",0],
 ["shuffle",1],
 ["shuffle",2],
 ["shuffle",3],
 ["shuffle",4],
 ["shuffle",5],
 ["shuffle",0],
 ["previous-question",5]
]){
 hooks.get(id)();verify(expected);
}
assert.equal(syncCalls,4,"Only problem cards sync Khảo Chứng");
assert.equal(companionCalls,9,"Each visible card syncs Lão Lý");
begin(120,60);endTouch(50,64);verify(0);
begin(70,50);endTouch(145,55);verify(5);
begin(100,50);endTouch(65,52);verify(5);
begin(100,50);endTouch(40,125);verify(5);
begin(100,50,{onButton:true});endTouch(20,50);verify(5);
begin(100,50,{multi:true});endTouch(20,50);verify(5);
begin(100,50);swipeHooks.get("touchcancel")();endTouch(20,50);verify(5);
assert.equal(syncCalls,5,"Only entered problems sync research, invalid swipes ignored");
assert.equal(companionCalls,11,"Only arrows and valid swipes trigger companion");
assert(css.includes("touch-action:pan-y;"),"Vertical scroll must be preserved");
assert(css.includes("animation:li-mirror-copy-float 4.2s ease-in-out infinite;"),"Mirror copy float remains");
assert(!css.includes("animation:li-mirror-float 4s ease-in-out infinite;"),"Controls must not float");
assert(css.includes("#page-home .mirror-controls .mirror-refresh{\n  animation:none!important;"),"Arrow controls stay fixed");
console.log("PASS S158 mirror: 6 cards / 3 hooks, action targets, context, arrows, swipe threshold, old problem path");
