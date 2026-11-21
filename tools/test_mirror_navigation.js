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
 {question:"Q0",scene:"S0",fieldId:"hci"},
 {question:"Q1",scene:"S1",fieldId:"hci",type:"hook",lessonRoute:"lessonL03"},
 {question:"Q2",scene:"S2",fieldId:"sociology"},
 {question:"Q3",scene:"S3",fieldId:"supply-chain",type:"hook",lessonRoute:"lessonL15"},
 {question:"Q4",scene:"S4",fieldId:"supply-chain"},
 {question:"Q5",scene:"S5",fieldId:"data-science",type:"hook",lessonRoute:"lessonL09"}
];
const primary={dataset:{},setAttribute(k,v){assert.equal(k,"aria-label");updates.aria=v}};
const topicImage={
 attributes:{},parentElement:{hidden:true},
 getAttribute(name){return this.attributes[name]||null},
 setAttribute(name,value){this.attributes[name]=value}
};
let syncCalls=0,companionCalls=0;
const sandbox={
 qIndex:0,scenarios,
 window:{LI_CATALOG_DATA:[{fields:[
  {id:"hci",image:"./assets/discipline/human-computer-interaction.webp"},
  {id:"sociology",image:"./assets/discipline/sociology.webp"},
  {id:"supply-chain",image:"./assets/discipline/supply-chain-management.webp"},
  {id:"data-science",image:"./assets/discipline/data-science.webp"}
 ]}]},
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
   if(id==="mirror-topic-image")return topicImage;
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
 const field=sandbox.window.LI_CATALOG_DATA[0].fields.find(f=>f.id===scenarios[index].fieldId);
 assert.equal(topicImage.getAttribute("src"),field.image,"Visible fallback art tracks the canonical discipline");
 assert.equal(topicImage.parentElement.hidden,false,"Artwork must not remain hidden");
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


// React Home & Khảo Chứng no longer keep a retired HTML research form alive.
// Exercise the actual global functions against a DOM that throws on access.
const reactArrowEnd=html.indexOf('document.getElementById("previous-question")',start);
assert(reactArrowEnd>start,"Find real mirror step action for React");
const reactEvents=[],reactScenes=[];
const reactSandbox={
 qIndex:0,scenarios,liResearchFeedback:"Prior branch explanation",
 window:{liReactRouter:{},dispatchEvent:event=>reactEvents.push(event.type)},
 Event:class{constructor(type){this.type=type;}},
 renderMirrorItem:()=>{throw Error("React mirror touched hidden native Home")},
 syncResearch:()=>{throw Error("React mirror touched hidden Research form")},
 placeCompanion:()=>{throw Error("React mirror positioned native floating Lão Lý")}
};
vm.createContext(reactSandbox);
vm.runInContext(html.slice(start,reactArrowEnd),reactSandbox);
reactSandbox.shiftMirrorQuestion(1);
assert.equal(reactSandbox.qIndex,1,"React moves to published lesson hook");
assert.equal(reactSandbox.liResearchFeedback,"Prior branch explanation",
 "Visiting a hook does not unexpectedly reset the research answer");
reactSandbox.shiftMirrorQuestion(1);
assert.equal(reactSandbox.qIndex,2,"React moves to the next research problem");
assert.equal(reactSandbox.liResearchFeedback,"Chọn một nhánh để đặt câu hỏi kiểm chứng.",
 "Switching problems clears the previous problem's research feedback");
assert.deepEqual(reactEvents,["li:inquiry-changed","li:inquiry-changed"],
 "Exactly one React state signal per mirror transition");

const branchFrom=html.indexOf("function liChooseResearchBranch(value){");
const branchTo=html.indexOf("function syncResearch()",branchFrom);
assert(branchFrom>0&&branchTo>branchFrom);
const researchEvents=[];
const researchSandbox={
 qIndex:0,scenarios:[{question:"Research question",branches:["Ai bị bỏ sót?"]}],
 liResearchFeedback:"",liCurrentProblem(){
  return this.scenarios?.[0];
 },
 document:{getElementById:()=>{throw Error("React branch touched native feedback element")}},
 window:{liReactRouter:{},dispatchEvent:event=>researchEvents.push(event.type)},
 Event:class{constructor(type){this.type=type;}},
 CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}}
};
researchSandbox.liCurrentProblem=()=>researchSandbox.scenarios[0];
vm.createContext(researchSandbox);
vm.runInContext(html.slice(branchFrom,branchTo),researchSandbox);
assert.equal(researchSandbox.liChooseResearchBranch("Ai bị bỏ sót?"),true);
assert.equal(researchSandbox.liResearchFeedback,"Hãy kiểm chứng: Ai bị bỏ sót?");
assert.deepEqual(researchEvents,["li:activity","li:inquiry-changed"]);
assert.equal(researchSandbox.liChooseResearchBranch("Not in this problem"),false);
assert.equal(researchEvents.length,2,"Invalid branch does not notify React");

// Save → unsave → Undo on the real canonical bookmark writer.
// The real React Library subscribes to li:library-view-changed; hidden
// Resume buttons and native save state are NOT inspected or redrawn.
const saveStart=html.indexOf("function liAfterQuestionBookmarkChange(){");
const saveEnd=html.indexOf('document.getElementById("save-question")',saveStart);
assert(saveStart>=0&&saveEnd>saveStart,"Locate canonical save/Undo writer");
const bookmarkEvents=[],bookmarkToasts=[],savedQuestions=[];
let nativeSaveRedraws=0;
const bookmarkSandbox={
 qIndex:0,scenarios,savedQuestions,liStorageError:false,
 liWriteState:()=>true,liNewId:()=>"bookmark-1",
 findSavedMirrorQuestion:sc=>savedQuestions.findIndex(x=>x.question===sc.question),
 refreshQuestionBookmark:()=>{nativeSaveRedraws++;},
 window:{
  liReactRouter:{},
  liLibraryShelf:{renderBookmarks:()=>{nativeSaveRedraws++;}},
  dispatchEvent:event=>bookmarkEvents.push(event.type)
 },
 Event:class{constructor(type){this.type=type;}},
 toast:(message,options)=>bookmarkToasts.push({message,undo:options?.undo}),
 Date
};
vm.createContext(bookmarkSandbox);
vm.runInContext(html.slice(saveStart,saveEnd),bookmarkSandbox);
assert.equal(bookmarkSandbox.liToggleMirrorQuestion(),true);
assert.equal(savedQuestions.length,1,"React saved mirror question uses the canonical ledger");
assert.equal(bookmarkSandbox.liToggleMirrorQuestion(),true);
assert.equal(savedQuestions.length,0,"React unsave removes the same ledger entry");
const undo=bookmarkToasts.at(-1)?.undo;
assert.equal(typeof undo,"function");
assert.equal(undo(),true,"React Undo restores the saved bookmark");
assert.equal(savedQuestions.length,1);
assert.deepEqual(bookmarkEvents,Array.from({length:3},()=>[
 "li:library-view-changed","li:inquiry-changed"
]).flat(),"React Home and Tủ Riêng refresh exactly once per write/Undo");
assert.equal(nativeSaveRedraws,0,"React writes never redraw hidden Resume or bookmark buttons");
delete bookmarkSandbox.window.liReactRouter;
assert.equal(bookmarkSandbox.liToggleMirrorQuestion(),true,"Native standalone bookmark remains functional");
assert.equal(savedQuestions.length,0);
assert.equal(nativeSaveRedraws,2,"Native fallback still updates button and Bookmarks UI");
console.log("PASS React mirror/Khảo Chứng/bookmark/Undo without hidden DOM and native fallback");

/* 17 drafted lesson hooks may preview on Home, but must not publish lesson
 * routes, leak draft manuscripts or regress the original 3 Wave1 hooks. */
const previewSource=JSON.parse(fs.readFileSync(path.resolve(__dirname,
 "../content/editorial/home-mirror-hooks.draft.v1.json"),"utf8"));
const previewPack=fs.readFileSync(path.resolve(__dirname,
 "../site/content-packs/home-mirror-draft-hooks.js"),"utf8");
const packContext={window:{}};
vm.runInNewContext(previewPack,packContext);
const draftItems=packContext.window.LI_MIRROR_DRAFT_HOOKS;
assert.equal(previewSource.reviewState,"proposed");
assert.equal(previewSource.publishState,"draft");
assert.equal(previewSource.lessonPublicationAuthorized,false);
assert.equal(draftItems.length,17);
assert.deepEqual(Array.from(draftItems,x=>x.id),
 previewSource.items.map(x=>x.id),"Preview pack must match canonical draft source");
assert.equal(new Set(draftItems.map(x=>x.id)).size,17);
for(const item of draftItems){
 assert.equal(item.publishState,"draft");
 for(const locale of ["vi","en"]){
  const copy=item.localized[locale];
  for(const k of ["question","scene","buddy","observed","unknown"])
   assert.equal(typeof copy[k],"string",item.id+" "+locale+" "+k);
  assert.equal(copy.branches.length,3);
 }
}
const mixStart=html.indexOf("const mirrorDrafts=");
const mixEnd=html.indexOf("function renderMirrorItem(){",mixStart);
assert(mixStart>=0&&mixEnd>mixStart,"Draft hook adapter must load before Mirror render");
const makeMirrorMix=(seed)=>{
 let state=seed;
 const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
 const mix={window:packContext.window,scenarios:scenarios.slice(),
  Math:{random,floor:Math.floor,ceil:Math.ceil}};
 vm.runInNewContext(html.slice(mixStart,mixEnd),mix);
 return mix;
};
const testMix=makeMirrorMix(1);
assert.equal(testMix.scenarios.length,23,"3 existing problems + 3 published hooks + 17 draft hooks");
// Each app load has a new discipline-aware playlist. Check stable identity,
// source/route parity, different orders, no adjacent or wraparound repeats.
const signature=item=>item.lessonId||item.key||item.question;
const expectedItems=[...scenarios.map(signature),...draftItems.map(x=>x.id)].sort();
const observedOrders=new Set();
for(let seed=1;seed<=32;seed++){
 const shuffled=makeMirrorMix(seed).scenarios;
 assert.deepEqual(shuffled.map(signature).sort(),expectedItems,"No mirror question lost or duplicated");
 const fields=shuffled.map(item=>item.fieldId);
 assert(fields.every((field,i)=>i===0||field!==fields[i-1]),
  "Adjacent questions must use different disciplines");
 assert.notEqual(fields[0],fields.at(-1),"Carousel wraparound must change discipline");
 observedOrders.add(shuffled.map(signature).join("|"));
}
assert(observedOrders.size>1,"Mirror discipline sequence changes between app loads");
const draftMirrors=testMix.scenarios.filter(x=>x.previewState==="draft");
assert.equal(draftMirrors.length,17);
assert(draftMirrors.every(x=>x.type==="hook"&&x.lessonRoute==="research"),
 "Draft teaser CTA must not claim an unpublished lesson route");
assert.equal(testMix.scenarios.filter(x=>x.type==="hook"&&x.previewState!=="draft").length,3);
const problemStart=html.indexOf("function liCurrentProblem(){");
const problemEnd=html.indexOf("function liChooseResearchBranch",problemStart);
const draftResearch={scenarios:testMix.scenarios,
 qIndex:testMix.scenarios.findIndex(item=>item.lessonId==="L03-1-1")};
assert(draftResearch.qIndex>=0,"Preview lesson remains reachable after shuffle");
vm.runInNewContext(html.slice(problemStart,problemEnd),draftResearch);
assert.equal(draftResearch.liCurrentProblem().lessonId,"L03-1-1",
 "Draft Home CTA must preserve its own lesson-specific Research context");
console.log("PASS 17 VI/EN Home draft hooks: preview, correct context, safe routing, 3 Wave1 intact");
