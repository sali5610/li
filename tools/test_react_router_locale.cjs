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
const pages=new Map(["home","settings","catalog","search","library","guide","guideDetail",
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
let visible=true,route="home",historyBefore=[],snapshot=null;
const visited=[],dispatched=[],uiRoutes=[],replaced=[];
const listeners=new Map();
const TestEvent=class{constructor(type,config){this.type=type;this.detail=config?.detail;}};
const appUiStore={getState:()=>({setRoute:id=>{uiRoutes.push(id);}})};
const appShell={classList:{toggle:()=>{}}};
const document={
 documentElement:{classList:{contains:key=>key==="li-auth-verified"?visible:false}},
 getElementById:id=>pages.get(id.replace(/^page-/,""))||null,
 querySelector:selector=>selector===".app"?appShell:null,
 querySelectorAll:selector=>selector==="section.page"?[...pages.values()]:
 selector==="[data-page]"?navControls:
 selector===".header .tool-button"?utilityControls:[]
};
const location=new URL("https://sali5610.github.io/li/?utm_source=app&lesson=L09-1-2#legacy");
const window={
 location,scrollX:0,scrollY:0,
 scrollTo(x,y){this.scrollX=x;this.scrollY=y;},
 requestAnimationFrame(callback){callback();return 1;},
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
 exports:moduleExports,window,document,URL,URLSearchParams,CustomEvent:TestEvent
};
vm.runInNewContext(generated,scope);
const fallbackRouter=window.liAppRouter;
const stop=moduleExports.mountReactRouter();
const act=window.liReactRouter;
assert.equal(typeof act.navigate,"function");
assert.equal(window.liAppRouter,act,"React must be the direct global action port while mounted");
assert.equal(act.getCurrent(),'lessonL09','verified direct lesson URL restores its React host');
visible=false;
assert.equal(act.navigate("settings"),false,"guest blocked");
visible=true;
assert.equal(act.navigate("missing"),false,"missing routes blocked");
assert.equal(act.navigate("settings"),true);
assert.equal(act.getCurrent(),"settings");
assert.equal(pages.get("settings").active,true);
assert.equal(location.searchParams.has("lesson"),false);
assert.equal(location.searchParams.get("view"),"settings","non-lesson routes are deep-linkable");
assert.equal(location.hash,"");
assert.equal(location.searchParams.get("utm_source"),"app");
assert.equal(act.navigate("search"),true);
assert.equal(act.back(),true);
assert.equal(act.getCurrent(),"settings");
assert.equal(act.back(),true);
assert.equal(act.getCurrent(),"lessonL09","Back restores entry lesson instead of blindly jumping Home");
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
assert.equal(act.navigate("home"),true,"verified user routes without an account overlay");
assert.equal(act.back(),true,"Back remains available without account overlay");
visible=false;
assert.equal(act.back(),false,"sign-out blocks history");
visible=true;
assert.equal(visited.at(-1),"catalog");
assert.equal(dispatched.length,visited.length,"one explicit route signal per navigation");
assert.ok(uiRoutes.includes("draftLessonL0913"));
assert.ok(replaced.length>=4);
location.href=new URL('/li/?view=guide',location.origin).href;
window.dispatchEvent(new TestEvent('popstate'));
assert.equal(act.getCurrent(),'guide','browser popstate restores a React-owned screen');
// Safari focus/pageshow can revalidate a valid invite while Catalog is open.
assert.equal(act.navigate('catalog'),true);
const catalogBeforeRecheck=location.href;
visible=false;
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{
 detail:{verified:false,transient:true}
}));
assert.equal(act.navigate('home'),false,'Transient recheck locks private navigation');
assert.equal(act.getCurrent(),'catalog','Transient recheck keeps the active Catalog');
assert.equal(location.href,catalogBeforeRecheck,'Transient recheck preserves Catalog URL');
visible=true;
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{
 detail:{verified:true,transient:false}
}));
assert.equal(act.getCurrent(),'catalog','Verified session resumes Catalog, not Home');
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{detail:{verified:false}}));
assert.equal(act.getCurrent(),'home','Logout clears the previously active private route');
assert.equal(location.searchParams.has('lesson'),false,'Logout clears private lesson deep link');
assert.equal(snapshot.id,'home');
assert.equal(snapshot.h.length,0);
stop();
assert.equal(window.liReactRouter,undefined);
assert.equal(window.liAppRouter,fallbackRouter,"Unmount restores original native fallback port");
assert.equal(snapshot.id,"home");
assert.ok(Array.isArray(snapshot.h));
const nav=read("tools/step16-real-l09-react-island/src/shell/mount-navigation.tsx");
const settings=read("tools/step16-real-l09-react-island/src/shell/journal-settings.tsx");
const auth=read("tools/step16-real-l09-react-island/src/auth/AuthPanel.tsx");
const stagingApp=read("tools/step16-real-l09-react-island/src/auth/staging-app.tsx");
const locale=read("site/assets/app-language.js");
const native=read("site/index.html");
assert.match(nav,/mountReactRouter\(\)/);
assert.match(nav,/addEventListener\('li:route-changed',syncCanonicalRoute\)/);
assert.doesNotMatch(nav,/new MutationObserver\(syncCanonicalRoute\)/);
assert.match(nav,/useAppLocale\(\)/);
assert.match(nav,/locale==='en'\?items\.map/);
assert.match(settings,/app\.liLanguage\?\.set\(id\)/);
assert.match(settings,/className="li-react-setting-card li-react-language-card"/);
assert.match(settings,/id="li-account-settings-host"/);
assert.match(auth,/createPortal\(settingsControls,accountSettingsHost\)/);
assert.doesNotMatch(nav,/AccountControl/,"No separate User toolbar entry");
assert.doesNotMatch(stagingApp,/liAccountOverlay/,"No separate account page");
assert.match(locale,/data-li-react-navigation/);
assert.match(locale,/li-react-language-card/);
assert.match(native,/if\(window\.liReactRouter\?\.navigate\)/);
assert.match(native,/window\.liNativeRouteEffects=Object\.freeze/);
// The native pre-mount paint must not erase permitted React ?view= links
// before Auth and the React router can see the original requested URL.
const startInitial=native.indexOf('const liInitialQuery=new URLSearchParams(');
const endInitial=native.indexOf('setStudyMode(studyMode,{persist:false});',startInitial);
assert.ok(startInitial>=0&&endInitial>startInitial,'Find actual native startup URL preservation');
const nativeStartup=native.slice(startInitial,endInitial);
function startupRoute(pathname){
 const calls=[];
 const origin='https://sali5610.github.io';
 vm.runInNewContext(nativeStartup,{
  URLSearchParams,window:{location:new URL(pathname,origin)},
  document:{getElementById:id=>pages.has(id.replace(/^page-/,''))?{}:null},
  navigate:(id,opts)=>calls.push({id,opts})
 });
 assert.equal(calls.length,1);
 return calls[0];
}
for(const route of ['settings','search','guide','library']){
 const boot=startupRoute('/li/?view='+route);
 assert.equal(boot.id,'home','No private feature renders before invitation');
 assert.equal(boot.opts.syncUrl,false,
  '?view='+route+' survives pre-auth native initialization');
 assert.equal(boot.opts.remember,false,'Boot must not create a ghost Back entry');
}
assert.equal(startupRoute('/li/?lesson=L09-1-2').opts.syncUrl,false);
assert.equal(startupRoute('/li/?catalog=technology').opts.syncUrl,false);
assert.equal(startupRoute('/li/?view=notARoute').opts.syncUrl,true,
 'Unrecognized URLs are still normalized to Home');
assert.equal(startupRoute('/li/?view=lessonL09').opts.syncUrl,true,
 'Raw lesson-looking view cannot bypass published-lesson URL allowlist');
assert.equal(startupRoute('/li/').opts.syncUrl,true);

const authPanel=read("tools/step16-real-l09-react-island/src/auth/AuthPanel.tsx");
assert.match(authPanel,/li:auth-verified-changed/);
assert.match(authPanel,/language\.liLanguage\?\.set\?\.\(next\)/);
assert.match(authPanel,/addEventListener\('li:localechange',sync\)/);
assert.match(router,/history\.length=0;browserDepth=0;active='home'/);
// A personal draft is an invited staging lesson, NOT a public release.
// Exercise the real native popstate listener used by the React route bridge.
const nativeCatalog=read("site/assets/catalog-drilldown.js");
const draftPreview=read("tools/step16-real-l09-react-island/src/learning/staging-draft-preview.tsx");
const reactCatalog=read("tools/step16-real-l09-react-island/src/shell/home-catalog.tsx");
const start=nativeCatalog.indexOf('window.addEventListener("popstate",()=>{');
const end=nativeCatalog.indexOf('\npath=readPathFromUrl();',start);
assert.ok(start>=0&&end>start,"Canonical Catalog popstate handler must exist");
const listener=nativeCatalog.slice(start,end);
let pop=null,visitedRoute='',routeOptions=null,verified=true,opened=false;
const deepLink=new URL('https://sali5610.github.io/li/?lesson=L09-1-3');
const popWindow={
 liPersonalStudyRoutes:{'L09-1-3':'draftLessonL0913'},
 liReleasedLessonRoutes:{'L09-1-2':'lessonL09'},
 addEventListener:(kind,fn)=>{if(kind==='popstate')pop=fn;},
 navigate:(route,opts)=>{visitedRoute=route;routeOptions=opts;},
 dispatchEvent:()=>{}
};
const popDocument={
 documentElement:{classList:{contains:id=>id==='li-auth-verified'?verified:
  id==='li-account-open'?opened:false}},
 getElementById:id=>id==='page-draftLessonL0913'?{}:null
};
const popContext={window:popWindow,document:popDocument,location:deepLink,
 URL,Event:class{constructor(type){this.type=type;}},path:[],
 render:()=>{},readPathFromUrl:()=>[]};
vm.runInNewContext(listener,popContext);
assert.equal(typeof pop,'function');
pop();
assert.equal(visitedRoute,'draftLessonL0913',"Browser Back must restore the exact personal lesson");
assert.equal(routeOptions.remember,false);
assert.equal(routeOptions.syncUrl,false);
verified=false;visitedRoute='';
pop();
assert.equal(visitedRoute,'home',"Unverified session cannot reactivate a personal lesson");
verified=true;opened=true;visitedRoute='';
pop();
assert.equal(visitedRoute,'home',"Account overlay blocks personal lesson popstate");
// The legacy Catalog listener may synchronize its path, but it must never
// hijack React's ?view=search/settings browser history and force Home.
popWindow.liReactRouter={};
deepLink.href=new URL('/li/?view=search',deepLink.origin).href;
visitedRoute='';opened=false;
pop();
assert.equal(visitedRoute,'','React owns popstate navigation when mounted');
delete popWindow.liReactRouter;
assert.match(nativeCatalog,/const personal=personalAllowed\?\(window\.liPersonalStudyRoutes\|\|\{\}\):\{\}/);
assert.match(nativeCatalog,/function openForLesson\(id\)/);
assert.match(nativeCatalog,/window\.liPersonalStudyRoutes\?\.\[id\]/);
assert.match(nativeCatalog,/setPath\(\[found\.group\.id,found\.field\.id,found\.course\.id\],false\)/);
assert.match(draftPreview,/liPersonalStudyRoutes=Object\.freeze\(routeMap\)/);
assert.match(draftPreview,/const requested=new URLSearchParams\(window\.location\.search\)\.get\('lesson'\)/);
assert.match(draftPreview,/app\.liAppRouter\?\.navigate\(direct,\{remember:false,syncUrl:false\}\)/);
assert.match(draftPreview,/VITE_LI_AUTH_TARGET!=='github-pages-staging'/);
assert.match(reactCatalog,/Personal study · Complete lesson/);
assert.match(reactCatalog,/Open lesson/);
assert.match(reactCatalog,/Progress could not be verified/);
assert.match(locale,/\[data-li-react-screen\]/);
assert.match(locale,/stopNativeObserver\(\)/);
assert.match(locale,/observer\?\.disconnect\(\)/);
const chrome=read("tools/step16-real-l09-react-island/src/shell/react-shell.tsx");
assert.match(chrome,/addEventListener\('li:auth-verified-changed',onAuth\)/);
assert.doesNotMatch(chrome,/new MutationObserver/);
const integrated=read("tools/step16-real-l09-react-island/src/auth/staging-app.tsx");
assert.match(integrated,/addEventListener\('li:route-changed',update\)/);
assert.doesNotMatch(integrated,/new MutationObserver\(openRequested\)/);
assert.match(locale,/#li-staging-auth-root/);
assert.match(locale,/!document\.getElementById\("li-staging-auth-root"\)/);
assert.match(router,/history\.pushState/);

// Exercise actual browser entry direction, not just the synchronous fallback.
location.href=new URL('/li/',location.origin).href;
const entries=[{url:location.href,state:{liRouteDepth:0}}];
let pos=0;
window.history.state=entries[0].state;
window.history.replaceState=(state,title,url)=>{
 entries[pos]={url:new URL(url,location.origin).href,state};
 location.href=entries[pos].url;window.history.state=state;
};
window.history.pushState=(state,title,url)=>{
 entries.splice(pos+1);
 entries.push({url:new URL(url,location.origin).href,state});
 pos=entries.length-1;location.href=entries[pos].url;window.history.state=state;
};
window.history.back=()=>{
 if(pos<1)return;
 pos--;location.href=entries[pos].url;window.history.state=entries[pos].state;
 window.dispatchEvent(new TestEvent('popstate'));
};
window.history.forward=()=>{
 if(pos>=entries.length-1)return;
 pos++;location.href=entries[pos].url;window.history.state=entries[pos].state;
 window.dispatchEvent(new TestEvent('popstate'));
};
const stopBrowser=moduleExports.mountReactRouter();
const browser=window.liReactRouter;
assert.equal(browser.navigate('catalog'),true);
// One Catalog breadcrumb adds a browser entry but NO second React route.
// The router must honor its depth and keep Back/Forward on Catalog.
window.history.pushState({...window.history.state,liRouteDepth:2,liRoute:'catalog'},
 '', '/li/?view=catalog&catalog=technology');
assert.equal(browser.back(),true);
assert.equal(browser.getCurrent(),'catalog');
assert.equal(pos,1,'Back traverses a Catalog breadcrumb without leaving Catalog');
window.history.forward();
assert.equal(browser.getCurrent(),'catalog');
assert.equal(pos,2);
// Scrolling a catalog page, opening Search, and using the header Back should
// return to the reading position, including after a Forward/Back round trip.
window.scrollTo(0,640);
assert.equal(browser.navigate('search'),true);
assert.equal(pos,3,'Route navigation follows the updated breadcrumb depth');
assert.equal(window.scrollY,0,'A newly opened screen starts at the top');
window.scrollTo(0,310);
assert.equal(browser.back(),true);
assert.equal(browser.getCurrent(),'catalog');
assert.equal(window.scrollY,640,'Top navigation Back restores the previous page scroll');
window.history.forward();
assert.equal(browser.getCurrent(),'search','browser Forward returns to Search, not Home');
assert.equal(window.scrollY,310,'Forward restores the newer page reading position');
assert.equal(browser.back(),true);
assert.equal(browser.getCurrent(),'catalog','Back still works after Forward');
assert.equal(window.scrollY,640,'Back still restores after a Forward round trip');
// A comparison link opens another method on the SAME React screen. URL,
// history identity, Back and Forward must all restore the actual technique,
// not just the shared guideDetail route.
let activeSpell='T01';
window.LiSpellPractice={
 getView:()=>({active:activeSpell}),
 open:id=>{activeSpell=id;}
};
assert.equal(browser.navigate('guideDetail'),true);
assert.equal(location.searchParams.get('method'),'T01');
window.scrollTo(0,740);
activeSpell='T02';
assert.equal(browser.navigate('guideDetail'),true);
assert.equal(location.searchParams.get('method'),'T02',
 'A second spell gets a separate same-route browser entry');
assert.equal(window.scrollY,0,'Related spell opens at its own beginning');
window.scrollTo(0,260);
assert.equal(browser.back(),true);
assert.equal(browser.getCurrent(),'guideDetail');
assert.equal(activeSpell,'T01','Back rehydrates the original spell');
assert.equal(location.searchParams.get('method'),'T01');
assert.equal(window.scrollY,740,'Back restores the original spell reading position');
window.history.forward();
assert.equal(activeSpell,'T02','Forward restores the compared spell');
assert.equal(window.scrollY,260,'Forward restores its independent scroll');
delete window.LiSpellPractice;
stopBrowser();
// An initial "not yet verified" event must NOT erase a bookmarked lesson URL.
visible=false;
location.href=new URL('/li/?lesson=L09-1-2',location.origin).href;
window.history.state={liRouteDepth:0};
const stopPending=moduleExports.mountReactRouter();
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{detail:{verified:false}}));
assert.equal(location.searchParams.get('lesson'),'L09-1-2',
 'Pending invite must preserve the requested deep link');
visible=true;
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{detail:{verified:true}}));
assert.equal(window.liReactRouter.getCurrent(),'lessonL09',
 'Verified invite restores the originally requested lesson');
stopPending();
// Reload contract: the same guide method and active tab must return after
// a browser refresh; a bare URL reload may recover a route from same-tab state.
const reloadStore=new Map();
window.sessionStorage={
 getItem:key=>reloadStore.get(key)??null,
 setItem:(key,value)=>reloadStore.set(key,value),
 removeItem:key=>reloadStore.delete(key)
};
window.performance={getEntriesByType:()=>[{type:'reload'}]};
window.history.replaceState=(state,title,url)=>{
 window.history.state=state;location.href=new URL(url,location.origin).href;
};
window.history.pushState=(state,title,url)=>{
 window.history.state=state;location.href=new URL(url,location.origin).href;
};
const spell={active:null,tab:'guide',lessonId:null};
window.LiSpellPractice={
 getView:()=>spell.active?{...spell}:null,
 open:(id,tab='guide',lessonId=null)=>{
  spell.active=id;spell.tab=tab;spell.lessonId=lessonId;
  window.dispatchEvent(new TestEvent('li:spell-view-changed'));
 }
};
visible=true;route='home';
location.href=new URL('/li/?view=guideDetail',location.origin).href;
window.history.state={liRouteDepth:0};
const stopSpell=moduleExports.mountReactRouter();
assert.equal(window.liReactRouter.getCurrent(),'guideDetail');
window.LiSpellPractice.open('T07','practice');
assert.equal(location.searchParams.get('method'),'T07');
assert.equal(location.searchParams.get('spellTab'),'practice');
assert.ok(reloadStore.has('li.router.reload-route.v1'));
const spellUrl=location.href;
stopSpell();

// Re-run router startup as if Safari refreshed the current tab.
visible=false;route='home';spell.active=null;
location.href=spellUrl;window.history.state={liRouteDepth:0};
const stopSpellReload=moduleExports.mountReactRouter();
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{detail:{verified:false}}));
assert.equal(location.searchParams.get('method'),'T07','Auth pending preserves method deep link');
visible=true;
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{detail:{verified:true}}));
assert.equal(window.liReactRouter.getCurrent(),'guideDetail');
assert.equal(spell.active,'T07','Refresh restores the same spell');
assert.equal(spell.tab,'practice','Refresh restores its practice tab');
stopSpellReload();

// Even if a PWA refresh loses its route query, the verified current-tab
// snapshot restores only whitelisted route params, not auth or tracking data.
visible=false;route='home';spell.active=null;
location.href=new URL('/li/?ui=cache-buster',location.origin).href;
window.history.state={liRouteDepth:0};
const stopBareReload=moduleExports.mountReactRouter();
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{detail:{verified:false}}));
visible=true;
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{detail:{verified:true}}));
assert.equal(window.liReactRouter.getCurrent(),'guideDetail');
assert.equal(spell.active,'T07');
assert.equal(spell.tab,'practice');
assert.equal(location.searchParams.get('view'),'guideDetail');
assert.equal(location.searchParams.get('ui'),'cache-buster');
visible=false;
window.dispatchEvent(new TestEvent('li:auth-verified-changed',{detail:{verified:false}}));
assert.equal(reloadStore.has('li.router.reload-route.v1'),false,
 'Real logout erases private same-tab route snapshot');
assert.equal(location.searchParams.has('method'),false,
 'Logout removes old spell detail parameters');
stopBareReload();


console.log('PASS reload current route and spell with Back/Forward');

/* The actual canonical Catalog adapter replaces the native controller on
 * invited staging. Test its compiled TypeScript and URL/history actions here,
 * using the same static GitHub curriculum JSON (no Neon or browser login).
 */
const adapterSource=read("tools/step16-real-l09-react-island/src/shell/catalog-route-adapter.ts");
const adapterJS=ts.transpileModule(adapterSource,{compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const curriculum=JSON.parse(read("content/curriculum/legacy-catalog.v1.json"));
let releasedPath=null,personalPath=null;
for(const group of curriculum.groups)for(const field of group.fields)
 for(const course of field.courses)for(const lesson of course.lessons){
  if(lesson.id==="L03-1-2")releasedPath=[group.id,field.id,course.id];
  if(lesson.id==="L09-1-3")personalPath=[group.id,field.id,course.id];
 }
assert.ok(releasedPath&&personalPath,'Published + personal lesson routes must be in canonical JSON');
const cLocation=new URL('https://sali5610.github.io/li/?view=catalog&catalog='+releasedPath.join('/'));
const cListeners=new Map(),cEvents=[],cRoutes=[];
let cVerified=false,cOverlay=false;
const cEntries=[{href:cLocation.href,state:{liRouteDepth:0,liRoute:'catalog'}}];
let cPosition=0;
const cHistory={state:cEntries[0].state,
 replaceState(state,title,url){
  cEntries[cPosition]={href:new URL(url,cLocation.origin).href,state};
  cLocation.href=cEntries[cPosition].href;this.state=state;
 },
 pushState(state,title,url){
  cEntries.splice(cPosition+1);
  cEntries.push({href:new URL(url,cLocation.origin).href,state});
  cPosition=cEntries.length-1;cLocation.href=cEntries[cPosition].href;this.state=state;
 }};
const cWindow={location:cLocation,history:cHistory,scrollTo:()=>{},
 requestAnimationFrame:callback=>callback(),
 addEventListener(type,handler){
  if(!cListeners.has(type))cListeners.set(type,new Set());
  cListeners.get(type).add(handler);
 },
 removeEventListener(type,handler){cListeners.get(type)?.delete(handler);},
 dispatchEvent(event){
  cEvents.push(event.type);
  for(const handler of cListeners.get(event.type)||[])handler(event);
 }};
const cHosts=new Set(['page-lessonL03','page-draftLessonL0913']);
const cDocument={
 documentElement:{classList:{contains:name=>
  name==='li-auth-verified'?cVerified:name==='li-account-open'?cOverlay:false}},
 getElementById:id=>cHosts.has(id)?{}:null,
 querySelector:()=>({focus(){}})
};
const cExports={};
vm.runInNewContext(adapterJS,{
 exports:cExports,window:cWindow,document:cDocument,URL,
 Event:class{constructor(type){this.type=type;}},
 CustomEvent:class{constructor(type,detail){this.type=type;this.detail=detail?.detail;}},
 require:id=>id.includes('legacy-catalog.v1.json')?{default:curriculum}:
  id.includes('released-lessons.js')?{
   releasedLessonRoutes:[{id:'L03-1-2',route:'lessonL03'}],
   personalStudyRoute:id=>id==='L09-1-3'?'draftLessonL0913':null
  }:id.includes('app-router.js')?{
   openRoute:id=>{cRoutes.push(id);return true;}
  }:undefined
});
const stopCatalog=cExports.installReactCatalogPort();
const cPort=cWindow.liCatalog;
assert.equal(cPort.getPath().join('/'),releasedPath.join('/'));
cWindow.dispatchEvent({type:'li:auth-verified-changed',detail:{verified:false}});
assert.equal(cPort.getPath().join('/'),releasedPath.join('/'),
 'Pending invite must keep a deep-linked course path');
cVerified=true;cWindow.dispatchEvent({type:'li:auth-verified-changed',detail:{verified:true}});
cPort.openPath([releasedPath[0]]);
assert.equal(cHistory.state.liRouteDepth,1,'Catalog breadcrumb adds a browser entry');
cPort.openPath(releasedPath.slice(0,2));
assert.equal(cHistory.state.liRouteDepth,2);
cPosition--;cLocation.href=cEntries[cPosition].href;cHistory.state=cEntries[cPosition].state;
cWindow.dispatchEvent({type:'popstate'});
assert.equal(cPort.getPath().join('/'),releasedPath[0],
 'Browser Back must restore the canonical Catalog breadcrumb without native render');
assert.equal(cPort.openLesson('L03-1-2'),true,'Released lesson opens only by canonical manifest route');
assert.equal(cRoutes.at(-1),'lessonL03');
assert.equal(cPort.openLesson('L09-1-3'),false,'A personal lesson must not bypass released gating');
assert.equal(cPort.openForLesson('L09-1-3'),true,'Invited personal lesson returns to its real course');
assert.equal(cRoutes.at(-1),'catalog');
assert.equal(cPort.getPath().join('/'),personalPath.join('/'));
assert.equal(cPort.openForLesson('L03-1-2'),true);
assert.equal(cPort.getPath().join('/'),releasedPath.join('/'));
cVerified=false;
cWindow.dispatchEvent({type:'li:auth-verified-changed',detail:{verified:false,transient:true}});
assert.equal(cPort.getPath().join('/'),releasedPath.join('/'),
 'Temporary invite recheck preserves Catalog breadcrumbs');
cVerified=true;cWindow.dispatchEvent({type:'li:auth-verified-changed',detail:{verified:true}});
assert.equal(cPort.getPath().join('/'),releasedPath.join('/'),
 'Verified return resumes the same Catalog course');
cVerified=false;cWindow.dispatchEvent({type:'li:auth-verified-changed',detail:{verified:false}});
assert.equal(cPort.getPath().length,0,'Signed-out account loses previous Catalog path');
assert.equal(cPort.openLesson('L03-1-2'),false,'Unverified account cannot navigate into a lesson');
stopCatalog();
assert.equal(cWindow.liCatalog,undefined);
assert.match(read('.github/workflows/li-pages.yml'),/Expected exactly three retired native Catalog\/Search scripts/);
assert.match(read('tools/step16-real-l09-react-island/src/auth/staging-app.tsx'),/installReactCatalogPort\(\)/);
console.log('PASS canonical JSON Catalog port: published/private gates, course return, breadcrumb Back and auth isolation');
