/* Focused Inquiry port contract. Same native domain owner, real React UI.
 * No additional browser gate or test fixture writer for personal data. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const html=fs.readFileSync(path.resolve(__dirname,"../site/index.html"),"utf8");
const a=html.indexOf("function liInquiryAllowed(){");
const b=html.indexOf('document.getElementById("buddy-challenge")',a);
assert(a>=0&&b>a,"Canonical React Inquiry port must be in native app");
const events=[],store=new Map(),calls=[];
let authorized=false,account=false,saved=false;
const scenarios=[
 {question:"Q0",scene:"S0",branches:["Who?","Missing?"],observed:"Observed",unknown:"Unknown"},
 {type:"hook",question:"Hook",scene:"Lesson",lessonRoute:"lessonL03",key:"open-question"},
 {question:"Q2",scene:"S2",branches:["When?"],observed:"X",unknown:"Y"}
];
const ctx={
 qIndex:0,scenarios,LI_DRAFT_KEY:"li.private.case-draft.v1",liResearchFeedback:"Choose a branch",liCurrentProblem:()=>scenarios[0],
 liToggleMirrorQuestion:()=>{saved=!saved;calls.push("toggle");return true;},
 findSavedMirrorQuestion:()=>saved?0:-1,
 shiftMirrorQuestion:d=>{ctx.qIndex=(ctx.qIndex+d+scenarios.length)%scenarios.length;calls.push("shift");},
 liChooseResearchBranch:branch=>{calls.push(["branch",branch]);return branch==="Who?";},
 liSubmitCaseAnswer:(choice,text)=>{calls.push(["submit",choice,text]);return true;},
 document:{documentElement:{classList:{contains:token=>token==="li-auth-verified"?authorized:token==="li-account-open"?account:false}}},
 window:{dispatchEvent:e=>events.push(e.type),liBookmarks:{
  isSaved:()=>saved,toggle:()=>{saved=!saved;return true;}
 },localStorage:{getItem:key=>store.get(key)||null,setItem:(k,v)=>store.set(k,v)}},
 Event:class{constructor(type){this.type=type}},Object
};
vm.createContext(ctx);vm.runInContext(html.slice(a,b),ctx);
const flow=ctx.window.liInquiryFlow;
assert(flow&&Object.isFrozen(flow),"Single frozen canonical port");
assert.equal(flow.shift(1),false,"Cannot navigate before invite");
assert.equal(flow.toggleQuestion(),false,"Guest cannot write bookmarks");
assert.equal(flow.setCaseDraft("guest"),false,"Guest cannot write private drafts");
assert.equal(flow.submitCase("right","guest"),false,"Guest cannot save Case");
authorized=true;
assert.equal(flow.getMirror().question,"Q0");
assert.equal(flow.toggleQuestion(),true);
assert.equal(flow.getMirror().saved,true);
assert.equal(flow.shift(1),true);
assert.equal(flow.getMirror().route,"lessonL03","Published hook routes directly to lesson");
assert.equal(flow.shift(-1),true);
assert.equal(flow.getResearch().observed,"Observed");
assert.equal(flow.chooseBranch(0),true);
assert.equal(flow.chooseBranch(8),false,"Unknown branch not accepted");
assert.equal(flow.setCaseDraft("Claim needs narrower scope"),true);
assert.equal(flow.getCaseDraft(),"Claim needs narrower scope");
assert.equal(flow.submitCase("right","Claim needs narrower scope"),true);
assert.deepEqual(calls.at(-1),["submit","right","Claim needs narrower scope"]);
assert.equal(flow.isCaseBookmarked(),true);
assert.equal(flow.toggleCaseBookmark(),true);
assert.equal(flow.isCaseBookmarked(),false);
account=true;
assert.equal(flow.shift(1),false,"Account overlay blocks Inquiry transitions");
assert.equal(flow.submitCase("wrong","blocked"),false);
assert.equal(flow.toggleCaseBookmark(),false);
assert.equal(flow.setCaseDraft("blocked"),false);
const home=fs.readFileSync(path.resolve(__dirname,"../tools/step16-real-l09-react-island/src/shell/home-catalog.tsx"),"utf8");
const research=fs.readFileSync(path.resolve(__dirname,"../tools/step16-real-l09-react-island/src/shell/research-case.tsx"),"utf8");
for(const [name,source] of [["Home",home],["Research/Case",research]]){
 assert(source.includes("inquiryFlow()"),name+" must use the real Inquiry port");
 assert(!/legacyAction\(|document\.getElementById\('finish-case'\)\?\.click|document\.getElementById\('case-revision'\)|getElementById\('save-question'\)/.test(source),
  name+" must not click/read hidden writing inputs/buttons");
}
assert(!research.includes("data-answer="),"React case buttons must not trigger native delegated answer handlers");
assert.match(research,/library\.setCollectionFilter\('case'\);\s*return openRoute\('collection'\)/,
 "Research Open Notebook must show the Case Notes drawer, not the general Library landing");
assert.doesNotMatch(research,/data-focus="notebook-section"/,
 "React Notebook entry must not rely on inert legacy focus attributes");
assert.match(research,/function caseSnapshot\(answer:CaseChoice\):CaseSnapshot/,
 "React Case must own the saved question, scene and options without old HTML");
assert.match(research,/selectedText:caseCopy\.options\[answer\]\.vi/,
 "Saved Case must carry the exact selected option text");
assert.match(research,/getSnapshot:\(\)=>document\.documentElement\.classList\.contains\('li-auth-verified'\)/,
 "React Case snapshot must be hidden when learner is signed out");
assert.doesNotMatch(research,/querySelector\(['"]#page-case/,
 "React Case must never read saved context from hidden HTML");
console.log("PASS Inquiry direct port: mirror hooks, bookmark, research, real draft, case save, invite and account guards");


const search=fs.readFileSync(path.resolve(__dirname,"../tools/step16-real-l09-react-island/src/shell/knowledge-search.tsx"),"utf8");
const capture=fs.readFileSync(path.resolve(__dirname,"../tools/step16-real-l09-react-island/src/shell/capture-idea.tsx"),"utf8");
const locale=fs.readFileSync(path.resolve(__dirname,"../tools/step16-real-l09-react-island/src/shell/discovery-locale.ts"),"utf8");
// Direct component mounts survive removal of legacy page shells by the global migration owner.
for(const [name,source,exported] of [
 ["Home + Catalog",home,"Home as HomeScreen,Catalog as CatalogScreen"],
 ["Research + Case",research,"ResearchScene as ResearchScreen,CaseScene as CaseScreen"],
 ["Search",search,"KnowledgeSearch as KnowledgeSearchScreen"],
 ["Capture",capture,"CaptureIdea as CaptureIdeaScreen"]
]){
 assert(source.includes(exported),name+" must be mountable without the old HTML page shell");
 assert(!source.includes("new MutationObserver("),name+" cannot use DOM observers to render or clear React state");
 assert(source.includes("useDiscoveryLocale"),name+" must support reactive VI/EN");
}
assert.match(home,/window\.addEventListener\('li:auth-verified-changed',update\)/,
 "Home follows the canonical auth lifecycle event");
assert.match(research,/window\.addEventListener\('li:auth-verified-changed',sync\)/,
 "Research/Case follow the canonical auth event");
assert.match(capture,/window\.addEventListener\('li:auth-verified-changed',clearOnSignOut\)/,
 "Drafts cannot cross account boundaries");
assert.match(search,/client\.searchKnowledge\(query\)/,
 "React search queries real canonical data, not mock results");
assert.match(search,/searchPersonalStudy\(query\)/,
 "All personal study content stays searchable through the canonical adapter");

assert.match(search,/function directCatalogMatches\(query:string\):KnowledgeItem\[\]/,
 "Published titles, lesson IDs and exact course labels stay searchable if ontology returns no answer");
assert.match(search,/const direct=\[\.\.\.personal,\.\.\.directCatalogMatches\(query\)\]/,
 "Staging personal lessons and released catalog matches must be combined");
assert.match(search,/withNavigableLessons\(query,\{/,
 "Successful semantic searches must retain direct canonical lesson matches");

const canonicalImport=/import canonicalCatalog from '\.\.\/\.\.\/\.\.\/\.\.\/content\/curriculum\/legacy-catalog\.v1\.json'/;
assert.match(home,canonicalImport,
 "React Catalog reads the same GitHub JSON as learning, no native boot global");
assert.match(search,canonicalImport,
 "React Search routes come from the same canonical curriculum JSON");
assert.match(home,/const groups:Group\[\]=canonicalCatalog\.groups;/);
assert.match(search,/for\(const group of canonicalCatalog\.groups as CatalogGroup\[\]\)/);
assert.doesNotMatch(home,/app\.LI_CATALOG_DATA|window\.LI_CATALOG_DATA\s*\?/,
 "Visible React Catalog cannot depend on the old native global");
assert.doesNotMatch(search,/app\.LI_CATALOG_DATA/,
 "Visible React Search cannot depend on a global populated by native HTML");
assert.match(search,/function RelationMap\(/,
 "Graph nodes must come from search response relationships");
assert.match(search,/record\.links\|\|\[\]/,
 "The connection map must use returned ontology edges");
assert.match(search,/window\.addEventListener\('li:auth-verified-changed',onAuth\)/,
 "Search must clear account-scoped queries when invited auth ends");
assert.match(search,/generation\.current\+\+;\s*returnPosition\.current=null;/,
 "Old in-flight search results must be invalidated across account sessions");
assert.match(search,/latestQuery='';mentorFocus=null;/,
 "Search query and Lao Ly context must not bleed across accounts");
assert.match(search,/setResponse\(\{status:'invalid_query',results:\[\]\}\)/,
 "Search must immediately hide prior invited-user results");
assert.match(search,/window\.addEventListener\('li:route-changed',onRoute\)/,
 "Search restores result reading position on canonical route return");
assert.match(search,/returnPosition\.current=\{query:latestQuery,top:window\.scrollY\}/,
 "Search must remember real result scroll before opening a lesson");
assert.match(search,/if\(app\.liSearch===port\)delete app\.liSearch;/,
 "Unmounted Search must not leave an active global port");
assert.match(locale,/li:localechange/);
console.log("PASS React discovery parity: direct screen exports, auth events, live ontology and VI/EN");


/* End-to-end scoped Case data contract: save from the real React snapshot
 * while the old #page-case markup is ABSENT, then open that same stored
 * record through the canonical React Bút Ký detail data owner.
 * No credentials, production writes, alternate note store or browser UI. */
const writerStart=html.indexOf("function liSubmitCaseAnswer(");
const writerEnd=html.indexOf('\ndocument.getElementById("finish-case")',writerStart);
assert(writerStart>=0&&writerEnd>writerStart,"Find canonical Case writer");
const caseRecords=[],caseEvents=[],caseRoutes=[],messages=[],caseDraft=new Map();
let caseWrites=0,caseCanWrite=true,caseNativeReads=0;
let savedId=0;
const reactCaseSnapshot={
 id:"sampling-bias-90",question:"React visible question · only sample?",
 scene:"React visible scenario · sampled customers",
 options:[{key:"right",text:"React visible: only this sample"},
  {key:"wrong",text:"React visible: everyone is satisfied"}],
 selectedKey:"right",selectedText:"React visible: only this sample",
 feedback:"React visible feedback: the sample is limited"
};
const writerSandbox={
 document:{querySelector(selector){caseNativeReads++;throw Error("Hidden native DOM read: "+selector);}},
 window:{
  liReactRouter:{},liCaseUi:{getSnapshot:()=>reactCaseSnapshot},
  localStorage:{getItem:key=>caseDraft.get(key)||null,
   setItem:(key,value)=>caseDraft.set(key,value)},
  dispatchEvent:event=>caseEvents.push(event.type)
 },
 LI_DRAFT_KEY:"li.private.case-draft.v1",processedCases:caseRecords,
 liNewId:()=>("case-"+(++savedId)),
 liWriteState:()=>{caseWrites++;return caseCanWrite;},
 liCaseFeedback:choice=>"native feedback "+choice,
 navigate:route=>caseRoutes.push(route),
 toast:message=>messages.push(message),
 Event:class{constructor(type){this.type=type;}},
 CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}}
};
vm.createContext(writerSandbox);
vm.runInContext(html.slice(writerStart,writerEnd),writerSandbox);
caseDraft.set("li.private.case-draft.v1","Visible React draft");
assert.equal(writerSandbox.liSubmitCaseAnswer("right","Visible conclusion has 12+ characters"),true);
assert.equal(caseNativeReads,0,"React Case save must not query hidden native HTML");
assert.equal(caseRecords.length,1);
assert.equal(caseRecords[0].caseSnapshot.question,reactCaseSnapshot.question);
assert.equal(caseRecords[0].caseSnapshot.scene,reactCaseSnapshot.scene);
assert.equal(caseRecords[0].caseSnapshot.selectedKey,"right");
assert.equal(caseRecords[0].caseSnapshot.selectedText,reactCaseSnapshot.selectedText);
assert.equal(caseRecords[0].caseSnapshot.feedback,reactCaseSnapshot.feedback);
assert.equal(caseRecords[0].caseSnapshot.options.length,2);
assert.equal(caseDraft.get("li.private.case-draft.v1"),"","Successful save clears canonical React draft");
assert.deepEqual(caseRoutes,["library"],"Successful Case returns to visible private library");
assert.deepEqual(caseEvents,["li:activity","li:inquiry-changed"]);
assert.equal(caseWrites,1);
// A stale/missing React port must fail closed and keep both existing record and draft.
caseDraft.set("li.private.case-draft.v1","Not-yet-saved text");
writerSandbox.window.liCaseUi={getSnapshot:()=>null};
assert.equal(writerSandbox.liSubmitCaseAnswer("right","A valid conclusion still remains"),false);
writerSandbox.window.liCaseUi={getSnapshot:()=>({...reactCaseSnapshot,selectedKey:"wrong"})};
assert.equal(writerSandbox.liSubmitCaseAnswer("right","A valid conclusion still remains"),false);
assert.equal(caseWrites,1);
assert.equal(caseRecords.length,1);
assert.equal(caseDraft.get("li.private.case-draft.v1"),"Not-yet-saved text");
assert.equal(caseNativeReads,0);
assert(messages.some(text=>text.includes("đề bài Phản Chứng")));
// Write failure rolls back without clearing the draft or inventing a saved Case.
writerSandbox.window.liCaseUi={getSnapshot:()=>reactCaseSnapshot};
caseCanWrite=false;
assert.equal(writerSandbox.liSubmitCaseAnswer("right","A second valid conclusion"),false);
assert.equal(caseRecords.length,1);
assert.equal(caseDraft.get("li.private.case-draft.v1"),"Not-yet-saved text");
caseCanWrite=true;
// Standalone native fallback still archives the DOM snapshot.
delete writerSandbox.window.liReactRouter;
const nativeChoices=[
 {dataset:{answer:"right"},textContent:"Native option correct"},
 {dataset:{answer:"wrong"},textContent:"Native option wrong"}
];
writerSandbox.document.querySelector=()=>({
 querySelector:selector=>({textContent:selector==="h2"?"Native question":"Native scene"}),
 querySelectorAll:()=>nativeChoices
});
assert.equal(writerSandbox.liSubmitCaseAnswer("wrong","Native conclusion long enough"),true);
assert.equal(caseRecords[0].caseSnapshot.question,"Native question");
assert.equal(caseRecords[0].caseSnapshot.selectedText,"Native option wrong");
assert.equal(caseRecords[0].caseSnapshot.feedback,"native feedback wrong");
// Open the REAL Bút Ký data reader on the React-saved record (not hardcoded test data).
const noteElements=new Map();
const noteElement=id=>{
 if(!noteElements.has(id))noteElements.set(id,{
  id,hidden:true,dataset:{},addEventListener(){},setAttribute(){},
  focus(){},replaceChildren(){},textContent:"",value:""
 });
 return noteElements.get(id);
};
const noteSandbox={
 document:{
  getElementById:noteElement,
  querySelector:selector=>{
   if(selector.includes("#page-case"))throw Error("React Bút Ký read hidden Case");
   return null;
  }
 },
 window:{
  liReactLibraryMounted:true,
  liBookmarks:{isSaved:()=>false},
  liLanguage:{translate:value=>value,get:()=> "vi"},
  dispatchEvent:event=>caseEvents.push(event.type)
 },
 processedCases:caseRecords,collectedIdeas:[],liStorageError:false,
 liWriteState:()=>true,navigate:route=>caseRoutes.push(route),
 toast(){},Event:writerSandbox.Event,Date,Intl
};
vm.createContext(noteSandbox);
vm.runInContext(fs.readFileSync(path.resolve(__dirname,"../site/assets/library-note-editor.js"),"utf8"),noteSandbox);
assert(noteSandbox.window.liNotes.openDetail("case","case-1"));
const notebook=noteSandbox.window.liNotes.getView();
assert.equal(notebook.context.question,reactCaseSnapshot.question,"Bút Ký shows original React question");
assert.equal(notebook.context.scene,reactCaseSnapshot.scene);
assert.equal(notebook.context.options.length,2);
assert.equal(notebook.context.options[0].selected,true);
assert.match(notebook.context.choice,/React visible: only this sample/);
assert.equal(notebook.context.feedback,reactCaseSnapshot.feedback);
assert.equal(notebook.body,"Visible conclusion has 12+ characters");
assert.match(notebook.context.provenance,/ghi cùng luận kết/);
console.log("PASS React Case → canonical save → Bút Ký detail without native HTML; rollback/fallback intact");
