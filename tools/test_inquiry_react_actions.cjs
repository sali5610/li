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
assert(html.includes("caseSnapshot")&&html.includes("selectedText:caseOptions.find"),
 "Saved case notes must freeze the original published question and chosen option");
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
assert.match(search,/contentClient\.searchKnowledge\(query\)/,
 "React search queries real canonical data, not mock results");
assert.match(search,/searchPersonalStudy\(query\)/,
 "All personal study content stays searchable through the canonical adapter");
assert.match(search,/function RelationMap\(/,
 "Graph nodes must come from search response relationships");
assert.match(search,/record\.links\|\|\[\]/,
 "The connection map must use returned ontology edges");
assert.match(locale,/li:localechange/);
console.log("PASS React discovery parity: direct screen exports, auth events, live ontology and VI/EN");
