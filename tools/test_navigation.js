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
const ids=[...html.matchAll(/<section id="page-([^"]+)"/g)].map(x=>x[1]);
const pages=new Map(ids.map(id=>[id,{id:"page-"+id,classList:{toggle(){}},focus(){}}]));
const tabs=ids.map(id=>({dataset:{page:id},classList:{toggle(){}},setAttribute(){},removeAttribute(){}}));
const calls={guide:0,library:0,research:0};
const sandbox={
 currentPage:"home",
 document:{
   getElementById(id){return pages.get(id.replace(/^page-/,""))||null},
   querySelectorAll(selector){
     if(selector==="section.page")return [...pages.values()];
     if(selector==="[data-page]")return tabs;
     throw Error("Unexpected selector: "+selector);
   }
 },
 window:{scrollTo(){}},
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
sandbox.navigate("settings");assert.equal(active(),"settings");assert.equal(length(),1);
sandbox.goBack();assert.equal(active(),"home");assert.equal(length(),0);
sandbox.navigate("catalog");
sandbox.navigate("search");
sandbox.navigate("capture");
assert.equal(active(),"capture");
sandbox.goBack();assert.equal(active(),"search");
sandbox.goBack();assert.equal(active(),"catalog");
sandbox.goBack();assert.equal(active(),"home");
sandbox.navigate("settings");
sandbox.navigate("settings");
sandbox.goBack();assert.equal(active(),"home","same-page clicks must not push duplicates");
sandbox.navigate("guide");assert.equal(calls.guide,1);
sandbox.navigate("library");assert.equal(calls.library,1);
sandbox.goBack();assert.equal(active(),"guide");
sandbox.navigate("research");assert.equal(calls.research,1);
sandbox.navigate("capture");
sandbox.goBack();assert.equal(active(),"research");
sandbox.goBack();assert.equal(active(),"guide");
sandbox.goBack();assert.equal(active(),"home");
sandbox.goBack();assert.equal(active(),"home","empty history fallback");
assert.equal(length(),0);
console.log("PASS S118 back navigation: Settings, Search, Capture, chained routes, duplicate prevention, fallback and Guide/Library/Research hooks");
