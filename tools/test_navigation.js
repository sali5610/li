/* S118: simulated in-app navigation. Static data/control regression, not browser visual QA. */
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const path=require("node:path");
const html=fs.readFileSync(path.resolve(__dirname,"../site/index.html"),"utf8");
const start=html.indexOf("const pageHistory=[];");
const end=html.indexOf("function renderMethods(){",start);
assert(start>=0&&end>start,"Expected navigation functions");
const code=html.slice(start,end);
const ids=[...html.matchAll(/<section id="page-([^"]+)"/g)].map(x=>x[1]).concat(["lessonL09","lessonL03","lessonL15"]);
const pages=new Map(ids.map(id=>[id,{id:"page-"+id,classList:{toggle(){}},focus(){}}]));
const tabs=ids.map(id=>({dataset:{page:id},classList:{toggle(){}},setAttribute(){},removeAttribute(){}}));
const utilities=["search","capture","settings"].map(page=>{
 const state={page,active:false,current:false};
 return {dataset:{page},state,classList:{toggle(name,on){if(name==="active")state.active=on}},
  setAttribute(name,value){if(name==="aria-current")state.current=value==="page"},
  removeAttribute(name){if(name==="aria-current")state.current=false}};
});
const assertUtility=(page)=>{
 for(const utility of utilities){
  assert.equal(utility.state.active,utility.dataset.page===page,"Utility active state "+utility.dataset.page);
  assert.equal(utility.state.current,utility.dataset.page===page,"Utility aria-current "+utility.dataset.page);
 }
};
const calls={guide:0,library:0,resume:0,collection:0,lesson:0,research:0,problems:[]};
const location=new URL("https://sali5610.github.io/li/?utm_source=chatgpt.com&lesson=L09-1-2#l09-goals");
const urlReplacements=[];
const accessClasses=new Set();
const sandbox={
 Event:class{constructor(type){this.type=type;}},
 liResearchFeedback:"",
 currentPage:"home",
 scenarios:[{question:"Giới hạn kết luận khảo sát",type:"problem"}],
 qIndex:0,
 document:{
   documentElement:{classList:{contains(name){return accessClasses.has(name)}}},
   getElementById(id){return pages.get(id.replace(/^page-/,""))||null},
   querySelectorAll(selector){
     if(selector==="section.page")return [...pages.values()];
     if(selector==="[data-page]")return tabs;
     if(selector===".header .tool-button")return utilities;
     throw Error("Unexpected selector: "+selector);
   }
 },
 URL,
 window:{
   scrollTo(){},
   location,
   liLibraryShelf:{
     renderHome(){calls.library++},
     renderResume(){calls.resume++},
     renderCollection(){calls.collection++},
     trackLesson(){calls.lesson++},
     trackProblem(kind,payload){calls.problems.push({kind,key:kind==="research"?payload.question:payload})}
   },
   history:{
     state:null,
     replaceState(state,title,path){
       location.href=new URL(path,location.origin).href;
       urlReplacements.push(path);
     }
   }
 },
 renderMethods(){calls.guide++},
 renderCaseArchive(){calls.library++},
 renderSavedQuestions(){},
 syncResearch(){calls.research++},
 refreshLucide(){},
 placeCompanion(){}
};
vm.createContext(sandbox);
vm.runInContext(code,sandbox);
const active=()=>sandbox.currentPage;
const length=()=>vm.runInContext("pageHistory.length",sandbox);
assert.equal(active(),"home");
sandbox.navigate("settings");assert.equal(active(),"settings");assert.equal(length(),1);assertUtility("settings");
assert.equal(location.searchParams.has("lesson"),false,"Leaving a lesson clears stale lesson query");
assert.equal(location.hash,"","Leaving a lesson clears old goal hash");
assert.equal(location.searchParams.get("utm_source"),"chatgpt.com","Preserve unrelated query params");
sandbox.goBack();assert.equal(active(),"home");assert.equal(length(),0);assertUtility(null);
sandbox.navigate("catalog");
sandbox.navigate("search");assertUtility("search");
sandbox.navigate("capture");assertUtility("capture");
assert.equal(active(),"capture");
sandbox.goBack();assert.equal(active(),"search");assertUtility("search");
sandbox.goBack();assert.equal(active(),"catalog");assertUtility(null);
sandbox.goBack();assert.equal(active(),"home");
sandbox.navigate("settings");
sandbox.navigate("settings");
sandbox.goBack();assert.equal(active(),"home","same-page clicks must not push duplicates");
sandbox.navigate("guide");assert.equal(calls.guide,1);
sandbox.navigate("library");assert.equal(calls.library,1);
sandbox.navigate("resume");assert.equal(calls.resume,1);
sandbox.goBack();assert.equal(active(),"library");
sandbox.navigate("collection");assert.equal(calls.collection,1);
sandbox.goBack();assert.equal(active(),"library");
sandbox.goBack();assert.equal(active(),"guide");
sandbox.navigate("research");assert.equal(calls.research,1);
assert.equal(calls.problems.length,1,"opening Khảo Chứng records a real problem");
assert.equal(calls.problems[0].key,"Giới hạn kết luận khảo sát");
sandbox.navigate("capture");
sandbox.goBack();assert.equal(active(),"research");
sandbox.goBack();assert.equal(active(),"guide");
sandbox.goBack();assert.equal(active(),"home");
sandbox.goBack();assert.equal(active(),"home","empty history fallback");
assert.equal(length(),0);
sandbox.navigate("lessonL09");assert.equal(location.searchParams.get("lesson"),"L09-1-2");
sandbox.navigate("home");assert.equal(location.searchParams.get("lesson"),null,"Home URL must remain Home after refresh");
sandbox.navigate("lessonL03");assert.equal(location.searchParams.get("lesson"),"L03-1-2");
sandbox.navigate("lessonL15");assert.equal(location.searchParams.get("lesson"),"L15-2-2");
sandbox.navigate("home");assert.equal(location.searchParams.has("lesson"),false);
assert.equal(calls.lesson,3,"record only published lesson navigation");
sandbox.navigate("case");assert.equal(calls.problems.at(-1).key,"sampling-bias-90","opening Phản Chứng records case activity");
assert.ok(urlReplacements.length>=5,"Route updates should be captured without reloading");
// The visible React navigation uses an invite-guarded action, not a hidden click.
assert.equal(typeof sandbox.window.liAppRouter.navigate,"function");
assert.equal(typeof sandbox.window.liAppRouter.back,"function");
assert.equal(sandbox.window.liAppRouter.getCurrent(),"case");
assert.equal(sandbox.window.liAppRouter.navigate("catalog"),false,"invitation required");
accessClasses.add("li-auth-verified");
assert.equal(sandbox.window.liAppRouter.navigate("nonexistent"),false,"no phantom route");
assert.equal(sandbox.window.liAppRouter.navigate("catalog"),true,"real route action works");
assert.equal(active(),"catalog");
assert.equal(sandbox.window.liAppRouter.back(),true,"back action restores old history");
assert.equal(active(),"case");
accessClasses.add("li-account-open");
assert.equal(sandbox.window.liAppRouter.navigate("home"),false,"account overlay blocks route");
assert.equal(sandbox.window.liAppRouter.back(),false,"account overlay blocks history");
accessClasses.delete("li-account-open");

// When the React router owns navigation, the native action port must keep
// learning history and live React data notifications without re-rendering
// hidden guide/library/mentor/icon DOM (which would compete with React).
const emitted=[];
sandbox.window.dispatchEvent=event=>emitted.push(event.type);
sandbox.window.liReactRouter={};
const oldCounts={...calls};
const oldProblemCount=calls.problems.length;
sandbox.liAfterNavigate("guide");
sandbox.liAfterNavigate("library");
sandbox.liAfterNavigate("resume");
sandbox.liAfterNavigate("collection");
assert.equal(calls.guide,oldCounts.guide,"React guide must not render hidden native cards");
assert.equal(calls.library,oldCounts.library,"React library must not render native shelf");
assert.equal(calls.resume,oldCounts.resume,"React resume must not render native shelf");
assert.equal(calls.collection,oldCounts.collection,"React collection must not render native shelf");
sandbox.liAfterNavigate("research");
assert.equal(calls.research,oldCounts.research,"React inquiry must not mutate the native research DOM");
assert.equal(calls.problems.length,oldProblemCount+1,"React research keeps canonical visited problem data");
assert.equal(sandbox.liResearchFeedback,"Chọn một nhánh để đặt câu hỏi kiểm chứng.");
sandbox.liAfterNavigate("case");
assert.equal(calls.problems.at(-1).key,"sampling-bias-90");
sandbox.liAfterNavigate("lessonL09");
assert.equal(calls.lesson,oldCounts.lesson+1,"React lesson still records the canonical published lesson visit");
sandbox.liAfterNavigate("noteDetail");
assert.ok(emitted.includes("li:library-view-changed"),"React Tủ Riêng receives refreshed private data");
assert.ok(emitted.includes("li:inquiry-changed"),"React research gets the updated scene");
assert.ok(emitted.includes("li:note-view-changed"),"React note detail refreshes on route return");
assert.equal(emitted.filter(x=>x==="li:library-view-changed").length,8,
 "Every React route change notifies the library once without a native render");
// Chat 1: backup must use the draft the learner edits in React, not a hidden
// vanilla textarea, and imported data must refresh React views without redraw.
const exportFrom=html.indexOf(" function liExportPersonalData(){");
const exportTo=html.indexOf(" // S110 canonical validator",exportFrom);
assert.ok(exportFrom>=0&&exportTo>exportFrom,"Locate shared export action");
const exportSource=html.slice(exportFrom,exportTo);
let exported=null;
let savedReactDraft="CURRENT_REACT_DRAFT";
const exportSandbox={
 Date,field:{value:"OLD_HIDDEN_DRAFT"},
 LI_DRAFT_KEY:"li.private.case-draft.v1",processedCases:[],savedQuestions:[],
 collectedIdeas:[],savedContent:[],liBuddyNames:{},
 window:{liReactRouter:{},localStorage:{getItem:()=>savedReactDraft}},
 Blob:class{constructor(parts){this.json=parts.join("");}},
 URL:{createObjectURL(blob){exported=JSON.parse(blob.json);return"blob:test";},revokeObjectURL(){}},
 document:{createElement:()=>({click(){},remove(){}}),body:{append(){}}},
 setTimeout(){},toast(){}
};
vm.runInNewContext(exportSource+"\nliExportPersonalData()",exportSandbox);
assert.equal(exported.draft,"CURRENT_REACT_DRAFT","Export actual React Case draft");
savedReactDraft=null;
vm.runInNewContext(exportSource+"\nliExportPersonalData()",exportSandbox);
assert.equal(exported.draft,"","Never export a stale hidden draft for React user");

// Use the real import action (including validator and rollback), stub only
// the browser's file/storage/confirmation APIs and unrelated native renderers.
const nativeBackup=html.slice(html.indexOf(" function mountNativeBackupFallback(){"),
 html.indexOf(" if(document.readyState===\"loading\")",html.indexOf(" function mountNativeBackupFallback(){")));
assert.match(nativeBackup,/document\.getElementById\("li-staging-auth-root"\)\)return;/,
 "No hidden native backup event delegation in invited React app");
assert.match(nativeBackup,/importInput\?\.addEventListener\("change"/,
 "Standalone native backup input still works");
const importFrom=html.indexOf(" async function liImportPersonalData(file){");
const importTo=html.indexOf(" // Invited staging React owns the visible file picker",importFrom);
assert.ok(importFrom>=0&&importTo>importFrom,"Locate validated backup importer");
const importSource=html.slice(importFrom,importTo);
const emittedImport=[],dataStore=new Map(),nativeRenders=[];
const failNative=name=>()=>nativeRenders.push(name);
const importData={
 schema:1,cases:[{title:"Imported",revision:"Sample",correct:false}],
 questions:[{question:"Remember me"}],ideas:[{id:"idea-1",text:"Idea",savedAt:"2026-11-21"}],
 savedContent:[{type:"lesson",id:"L03-1-2",savedAt:"2026-11-21"}],
 draft:"IMPORTED_REACT_DRAFT"
};
const importSandbox={
 LI_STORAGE_KEY:"li.private.library.v1",LI_DRAFT_KEY:"li.private.case-draft.v1",
 LI_BUDDY_NAMES_KEY:"li.buddy-address.v1",LI_BUDDY_DEFAULT_NAMES:{warm:"",teasing:"",serious:""},
 liBackupImport:{loading:false,error:""},liPublishBackup(){},
 field:{value:"OLD_HIDDEN_DRAFT"},processedCases:[],savedQuestions:[],collectedIdeas:[],savedContent:[],
 liStorageError:false,liBuddyNames:{},liRestoreBuddyNames(){return{};},liRefreshBuddyNameInputs(){},
 liNormalizeBuddyName:x=>x,Date,JSON,Event:class{constructor(type){this.type=type;}},
 window:{
  liReactRouter:{},
  localStorage:{
   getItem:key=>dataStore.has(key)?dataStore.get(key):null,
   setItem:(key,value)=>dataStore.set(key,value),
   removeItem:key=>dataStore.delete(key)
  },
  confirm:()=>true,dispatchEvent:event=>emittedImport.push(event.type),
  liLibraryShelf:{renderHome:failNative("home"),renderCollection:failNative("collection")},
  liBookmarks:{refresh:failNative("bookmark")},
  liLanguage:{translate:x=>x}
 },
 renderCaseArchive:failNative("archive"),renderSavedQuestions:failNative("questions"),
 refreshQuestionBookmark:failNative("questionBookmark"),
 toast(){}
};
const backupFile={size:512,text:async()=>JSON.stringify(importData)};
vm.runInNewContext(importSource+"\nliImportPersonalData(backupFile)",{
 ...importSandbox,backupFile
}).then(ok=>{
 assert.equal(ok,true,"Validated React backup import succeeds");
 assert.equal(dataStore.get("li.private.case-draft.v1"),"IMPORTED_REACT_DRAFT");
 assert.equal(importSandbox.field.value,"OLD_HIDDEN_DRAFT","No React import write to hidden textarea");
 assert.equal(nativeRenders.length,0,"No hidden native redraw during React import");
 assert.equal(emittedImport.join(","),
  "li:library-view-changed,li:inquiry-changed,li:note-view-changed",
  "React Library/Case/Note surfaces refresh from canonical imported data");
 assert.equal(importSandbox.savedContent.length,1);
 console.log("PASS S118 native+React routing and canonical React backup import/export");
}).catch(error=>{console.error(error);process.exitCode=1;});

