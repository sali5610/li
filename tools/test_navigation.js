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
const calls={guide:0,library:0,resume:0,collection:0,lesson:0,research:0};
const location=new URL("https://sali5610.github.io/li/?utm_source=chatgpt.com&lesson=L09-1-2#l09-goals");
const urlReplacements=[];
const sandbox={
 currentPage:"home",
 document:{
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
     trackLesson(){calls.lesson++}
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
assert.ok(urlReplacements.length>=5,"Route updates should be captured without reloading");
console.log("PASS S118 back navigation: Settings, Search, Capture, chained routes, duplicate prevention, fallback and Guide/Library/Research hooks");
