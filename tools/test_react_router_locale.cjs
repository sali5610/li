#!/usr/bin/env node
"use strict";
/** Test the actual TypeScript React router (transpiled in memory), not a copy.
 * No browser, Neon or production data. Includes 17-lesson staging URL contract.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const ts=require(path.join(root,"tools/step16-real-l09-react-island/node_modules/typescript"));
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const router=read("tools/step16-real-l09-react-island/src/shell/app-router.ts");
const generated=ts.transpileModule(router,{compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const pages=new Map(["home","settings","catalog","search","library","guide",
 "lessonL03","lessonL09","lessonL15","draftLessonL0913"].map(id=>{
 const classes=new Set(id==="home"?["active"]:[]);
 return [id,{id:"page-"+id,classList:{toggle:(name,enabled)=>{
  if(enabled)classes.add(name);else classes.delete(name);
 }},focus:()=>{},get active(){return classes.has("active");}}];
}));
const navControls=[{dataset:{page:"home"}},{dataset:{page:"catalog"}}].map(el=>({
 ...el,classList:{toggle:()=>{}},setAttribute:()=>{},removeAttribute:()=>{}
}));
const utilityControls=["search","settings"].map(id=>({
 dataset:{page:id},classList:{toggle:()=>{}},setAttribute:()=>{},removeAttribute:()=>{}
}));
let visible=true,overlay=false,route="home",historyBefore=[],snapshot=null;
const visited=[],dispatched=[],uiRoutes=[],replaced=[];
const listeners=new Map();
const TestEvent=class{constructor(type,config){this.type=type;this.detail=config?.detail;}};
const appUiStore={getState:()=>({setRoute:id=>{uiRoutes.push(id);}})};
const appShell={classList:{toggle:()=>{}}};
const document={
 documentElement:{classList:{contains:key=>key==="li-auth-verified"?visible:
 key==="li-account-open"?overlay:false}},
 getElementById:id=>pages.get(id.replace(/^page-/,""))||null,
 querySelector:selector=>selector===".app"?appShell:null,
 querySelectorAll:selector=>selector==="section.page"?[...pages.values()]:
 selector==="[data-page]"?navControls:
 selector===".header .tool-button"?utilityControls:[]
};
const location=new URL("https://sali5610.github.io/li/?utm_source=app&lesson=L09-1-2#legacy");
const window={
 location,scrollTo:()=>{},
 history:{state:null,replaceState:(state,title,url)=>{
  location.href=new URL(url,location.origin).href;replaced.push(url);
 }},
 addEventListener:(type,fn)=>{
  const handlers=listeners.get(type)||new Set();
  handlers.add(fn);listeners.set(type,handlers);
 },
 removeEventListener:(type,fn)=>listeners.get(type)?.delete(fn),
 dispatchEvent:event=>{
  dispatched.push(event.type);
  for(const fn of listeners.get(event.type)||[])fn(event);
 }
};
window.liReleasedLessonRoutes={"L09-1-2":"lessonL09"};
window.liNativeRouteEffects={
 history:()=>historyBefore.slice(),
 afterNavigate:id=>{route=id;visited.push(id);},
 restoreHistory:(h,id)=>{snapshot={h,id};}
};
window.liAppRouter={
 getCurrent:()=>window.liReactRouter?.getCurrent?.()||route,
 navigate:(id,options)=>window.liReactRouter?.navigate(id,options)||false,
 back:()=>window.liReactRouter?.back()||false,
 hasRoute:id=>Boolean(document.getElementById("page-"+id))
};
const moduleExports={};
const scope={
 require:id=>id==="./app-store.js"?{appUiStore}:
 id==="../learning/released-lessons.js"?{
  personalStudyLessonIds:["L09-1-3"],
  personalStudyRoute:id=>id==="L09-1-3"?"draftLessonL0913":null
 }:undefined,
 exports:moduleExports,window,document,URL,CustomEvent:TestEvent
};
vm.runInNewContext(generated,scope);
const stop=moduleExports.mountReactRouter();
const act=window.liReactRouter;
assert.equal(typeof act.navigate,"function");
visible=false;
assert.equal(act.navigate("settings"),false,"guest blocked");
visible=true;
assert.equal(act.navigate("missing"),false,"missing routes blocked");
assert.equal(act.navigate("settings"),true);
assert.equal(act.getCurrent(),"settings");
assert.equal(pages.get("settings").active,true);
assert.equal(location.searchParams.has("lesson"),false);
assert.equal(location.hash,"");
assert.equal(location.searchParams.get("utm_source"),"app");
assert.equal(act.navigate("search"),true);
assert.equal(act.back(),true);
assert.equal(act.getCurrent(),"settings");
assert.equal(act.back(),true);
assert.equal(act.getCurrent(),"home");
assert.equal(act.navigate("lessonL09"),true);
assert.equal(location.searchParams.get("lesson"),"L09-1-2");
assert.equal(act.navigate("draftLessonL0913"),true);
assert.equal(location.searchParams.get("lesson"),"L09-1-3",
 "staging preview URL must retain its personal lesson ID");
assert.equal(act.back(),true);
assert.equal(act.getCurrent(),"lessonL09");
assert.equal(location.searchParams.get("lesson"),"L09-1-2");
assert.equal(act.navigate("lesson"),true,"retired sample routes into approved React");
assert.equal(act.getCurrent(),"lessonL09");
const previousUrl=location.href;
assert.equal(act.navigate("catalog",{syncUrl:false,remember:false}),true);
assert.equal(location.href,previousUrl,"popstate must not overwrite browser URL");
overlay=true;
assert.equal(act.navigate("home"),false,"account overlay blocks routes");
assert.equal(act.back(),false,"account overlay blocks Back");
overlay=false;visible=false;
assert.equal(act.back(),false,"sign-out blocks history");
visible=true;
assert.equal(visited.at(-1),"catalog");
assert.equal(dispatched.length,visited.length,"one explicit route signal per navigation");
assert.ok(uiRoutes.includes("draftLessonL0913"));
assert.ok(replaced.length>=4);
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{detail:{verified:false}}));
assert.equal(act.getCurrent(),'home','Logout clears the previously active private route');
assert.equal(location.searchParams.has('lesson'),false,'Logout clears private lesson deep link');
assert.equal(snapshot.id,'home');
assert.equal(snapshot.h.length,0);
stop();
assert.equal(window.liReactRouter,undefined);
assert.equal(snapshot.id,"home");
assert.ok(Array.isArray(snapshot.h));
const nav=read("tools/step16-real-l09-react-island/src/shell/mount-navigation.tsx");
const settings=read("tools/step16-real-l09-react-island/src/shell/journal-settings.tsx");
const locale=read("site/assets/app-language.js");
const native=read("site/index.html");
assert.match(nav,/mountReactRouter\(\)/);
assert.match(nav,/addEventListener\('li:route-changed',syncCanonicalRoute\)/);
assert.doesNotMatch(nav,/new MutationObserver\(syncCanonicalRoute\)/);
assert.match(nav,/useAppLocale\(\)/);
assert.match(nav,/locale==='en'\?items\.map/);
assert.match(settings,/app\.liLanguage\?\.set\(id\)/);
assert.match(settings,/className="li-react-setting-card li-react-language-card"/);
assert.match(locale,/data-li-react-navigation/);
assert.match(locale,/li-react-language-card/);
assert.match(native,/if\(window\.liReactRouter\?\.navigate\)/);
assert.match(native,/window\.liNativeRouteEffects=Object\.freeze/);
const authPanel=read("tools/step16-real-l09-react-island/src/auth/AuthPanel.tsx");
assert.match(authPanel,/li:auth-verified-changed/);
assert.match(authPanel,/language\.liLanguage\?\.set\?\.\(next\)/);
assert.match(authPanel,/addEventListener\('li:localechange',sync\)/);
assert.match(router,/history\.length=0;active='home'/);
console.log("PASS actual React router: auth/back/history/URL/17-staging preview/no observer + React bilingual settings");
