import {appUiStore} from './app-store.js';
import {personalStudyLessonIds,personalStudyRoute} from '../learning/released-lessons.js';

/** One stateful React app router. The old script provides DATA side effects
 * (visited lessons, research, bookmarks) and a pre-mount fallback, but does
 * not own the active route, history or URL once this port is installed. */
type RouteOptions={focus?:boolean;remember?:boolean;syncUrl?:boolean;restoreScroll?:boolean};
export type AppRoutePort={
 navigate:(id:string,options?:RouteOptions)=>boolean;
 back:()=>boolean;getCurrent:()=>string;hasRoute:(id:string)=>boolean;
};
type NativeRouteEffects={
 history:()=>string[];afterNavigate:(id:string)=>void;
 restoreHistory:(history:string[],active:string)=>void;
};
type ReactRouterPort=AppRoutePort;
declare global{interface Window{
 liAppRouter?:AppRoutePort;liReactRouter?:ReactRouterPort;
 liNativeRouteEffects?:NativeRouteEffects;
 liReleasedLessonRoutes?:Readonly<Record<string,string>>;
 liReleasedEditorialRoutes?:Readonly<Record<string,string>>;
}}
const published:Readonly<Record<string,string>>={
 lessonL03:'L03-1-2',lessonL09:'L09-1-2',lessonL15:'L15-2-2'
};
const preview=new Map(personalStudyLessonIds.map(id=>[personalStudyRoute(id),id]));
// Browser history tracks real Back/Forward direction, not a second native stack.
let browserDepth=0;
// Scroll belongs to a browser history entry, not just a route: A -> B -> A
// may visit the same screen at different reading positions.
type ScrollPosition={x:number;y:number};
const scrollByEntry=new Map<number,ScrollPosition>();
let scrollEntrySequence=0;
let currentScrollEntry=0;
let scrollRestoreToken=0;
let restoringScroll=false;
// A hard reload should recover the current React screen even if an external
// refresh flow removed its query parameters. The browser URL always wins.
const reloadRouteKey='li.router.reload-route.v1';
const spellIdPattern=/^T(?:0[1-9]|1[0-3])$/;
const validSpell=(id:string|null):id is string=>!!id&&spellIdPattern.test(id);
function isReload():boolean{
 try{
  const navigation=window.performance?.getEntriesByType?.('navigation')?.[0] as
   PerformanceNavigationTiming|undefined;
  return navigation?.type==='reload';
 }catch{return false;}
}
const reloadParams=['lesson','view','catalog','chapter','method','spellTab','spellLesson'] as const;
function saveReloadRoute(route:string){
 try{
  if(route==='home'){window.sessionStorage?.removeItem(reloadRouteKey);return;}
  const current=new URLSearchParams(window.location.search);
  const query=new URLSearchParams();
  for(const key of reloadParams){
   const value=current.get(key);
   if(value!==null)query.set(key,value);
  }
  window.sessionStorage?.setItem(reloadRouteKey,JSON.stringify({
   pathname:window.location.pathname,route,query:query.toString()
  }));
 }catch{/* Private browsing may disable session storage; URLs still work. */}
}
function reloadRoute():string|null{
 if(!isReload())return null;
 const fromHistory=window.history.state?.liRoute;
 try{
  const raw=window.sessionStorage?.getItem(reloadRouteKey);
  const saved=raw?JSON.parse(raw) as {
   pathname?:string;route?:string;query?:string
  }:null;
  const validSaved=saved?.pathname===window.location.pathname&&
   typeof saved.route==='string'&&!!pageOf(saved.route);
  const route=typeof fromHistory==='string'&&pageOf(fromHistory)?
   fromHistory:validSaved?saved!.route!:null;
  if(route&&validSaved&&saved!.route===route&&saved!.query){
   // Restore only known route parameters, never sign-in or tracking tokens.
   const url=new URL(window.location.href);
   const params=new URLSearchParams(saved!.query);
   for(const key of reloadParams){
    const value=params.get(key);
    if(value!==null)url.searchParams.set(key,value);
   }
   window.history.replaceState({...window.history.state,liRoute:route},'',
    url.pathname+url.search+url.hash);
  }
  return route;
 }catch{
  return typeof fromHistory==='string'&&pageOf(fromHistory)?fromHistory:null;
 }
}
function hasExplicitRoute():boolean{
 const query=new URLSearchParams(window.location.search);
 return query.has('lesson')||query.has('view')||query.has('catalog');
}
type SpellView={active:string;tab?:'guide'|'practice';lessonId?:string|null};
type SpellPort={getView:()=>SpellView|null;open:(id:string,tab?:'guide'|'practice',lessonId?:string|null)=>void};
const spellPort=()=>(window as Window&{LiSpellPractice?:SpellPort}).LiSpellPractice;
function restoreSpellFromUrl(route:string):boolean{
 if(route!=='guideDetail'||!canVisit())return false;
 const query=new URLSearchParams(window.location.search);
 const id=query.get('method');
 if(!validSpell(id))return false;
 const tab=query.get('spellTab')==='practice'?'practice':'guide';
 const lessonId=query.get('spellLesson');
 const port=spellPort(),current=port?.getView?.();
 if(!port||current?.active===id&&(current.tab||'guide')===tab&&
  (current.lessonId||null)===(lessonId||null))return false;
 port.open(id,tab,lessonId);
 return true;
}
function ensureScrollEntry():number{
 const existing=Number(window.history.state?.liScrollEntryId);
 if(Number.isInteger(existing)&&existing>0){
  scrollEntrySequence=Math.max(scrollEntrySequence,existing);
  return existing;
 }
 const id=++scrollEntrySequence;
 window.history.replaceState({...window.history.state,liScrollEntryId:id},'',window.location.href);
 return id;
}
function rememberScroll(){
 if(currentScrollEntry>0)scrollByEntry.set(currentScrollEntry,{x:window.scrollX,y:window.scrollY});
}
const canVisit=()=>document.documentElement.classList.contains('li-auth-verified');
function normalize(route:string){
 return route==='lesson'?
  (window.liReleasedLessonRoutes?.['L09-1-2']==='lessonL09'?'lessonL09':'catalog'):
  route;
}
function pageOf(route:string):HTMLElement|null{
 return document.getElementById('page-'+route);
}
/** URL routing is allowlisted by the React host registry. An arbitrary
 * ?view=lesson... cannot grant an unpublished lesson route.
 */
function routeFromUrl():string{
 const query=new URLSearchParams(window.location.search);
 const lesson=query.get('lesson');
 if(lesson){
  const target=window.liReleasedLessonRoutes?.[lesson]||
   [...preview.entries()].find(([,id])=>id===lesson)?.[0]||
   Object.entries(published).find(([,id])=>id===lesson)?.[0];
  return target&&pageOf(target)?target:'home';
 }
 const view=query.get('view');
 if(view&&view!=='lesson'&&!view.toLowerCase().includes('lesson')&&
  /^[A-Za-z][A-Za-z0-9]*$/.test(view)&&pageOf(view))return view;
 if(query.has('catalog')&&pageOf('catalog'))return 'catalog';
 // Never override an explicit, invalid or unauthorized deep link with a stale
 // previous route. Reload fallback is allowed only on a bare app URL.
 return !hasExplicitRoute()?reloadRoute()||'home':'home';
}
function writeUrl(route:string,remember=false){
 const url=new URL(window.location.href);
 const lesson=published[route]||window.liReleasedEditorialRoutes?.[route]||
  preview.get(route);
 if(lesson)url.searchParams.set('lesson',lesson);
 else url.searchParams.delete('lesson');
 // Every selected spell is directly refreshable and preserves its comparison history.
 const spellView=route==='guideDetail'?spellPort()?.getView?.():null;
 const spell=spellView?.active||null;
 if(validSpell(spell))url.searchParams.set('method',spell);
 else url.searchParams.delete('method');
 if(route==='guideDetail'&&validSpell(spell)){
  if(spellView?.tab==='practice')url.searchParams.set('spellTab','practice');
  else url.searchParams.delete('spellTab');
  if(spellView?.lessonId)url.searchParams.set('spellLesson',spellView.lessonId);
  else url.searchParams.delete('spellLesson');
 }else{
  url.searchParams.delete('spellTab');url.searchParams.delete('spellLesson');
 }
 // Keep non-lesson screens directly addressable, including Settings and Search.
 if(lesson||route==='home')url.searchParams.delete('view');
 else url.searchParams.set('view',route);
 if(!lesson){
  url.searchParams.delete('chapter');
  if(route!=='catalog')url.searchParams.delete('catalog');
 }
 url.hash='';
 const path=url.pathname+url.search;
 if(path!==window.location.pathname+window.location.search+window.location.hash){
  // A user navigation creates a real browser entry; redirects/auth reset replace it.
  if(remember&&typeof window.history.pushState==='function'){
   // Catalog breadcrumbs also create browser entries. Never reuse their
   // depth when navigating into a lesson or a different React screen.
   const current=Number(window.history.state?.liRouteDepth);
   if(Number.isInteger(current)&&current>=0)browserDepth=current;
   browserDepth++;
   window.history.pushState({
    ...window.history.state,liRoute:route,liRouteDepth:browserDepth,
    liScrollEntryId:++scrollEntrySequence
   },'',path);
   currentScrollEntry=scrollEntrySequence;
  }else window.history.replaceState({
   ...window.history.state,liRoute:route,liRouteDepth:browserDepth,
   liScrollEntryId:currentScrollEntry
  },'',path);
 }else if(window.history.state?.liRoute!==route){
  window.history.replaceState({
   ...window.history.state,liRoute:route,liRouteDepth:browserDepth,
   liScrollEntryId:currentScrollEntry
  },'',path);
 }
}
function paintRoute(route:string,page:HTMLElement){
 document.querySelector('.app')?.classList.toggle('home-focus',route==='home');
 // Legacy sections are host shells for React. Visibility still uses the
 // existing CSS class so all 17 personal preview route mounts remain intact.
 document.querySelectorAll<HTMLElement>('section.page').forEach(node=>
  node.classList.toggle('active',node===page));
 // Navigation chrome is React-owned (Zustand + aria-current in React).
 // Only the host section visibility remains a compatibility bridge until the
 // feature owners finish removing native HTML data hosts.
}
export function mountReactRouter():()=>void{
 // Manual mode prevents native scroll restoration racing the React route paint.
 const previousScrollRestoration=window.history.scrollRestoration;
 window.history.scrollRestoration='manual';
 browserDepth=Number.isInteger(window.history.state?.liRouteDepth)&&
  window.history.state.liRouteDepth>=0?window.history.state.liRouteDepth:0;
 if(!Number.isInteger(window.history.state?.liRouteDepth)){
  window.history.replaceState({...window.history.state,liRouteDepth:browserDepth},'',
   window.location.pathname+window.location.search+window.location.hash);
 }
 currentScrollEntry=ensureScrollEntry();
 rememberScroll();
 const onScroll=()=>{if(!restoringScroll)rememberScroll();};
 window.addEventListener('scroll',onScroll,{passive:true});
 const initial=window.liAppRouter?.getCurrent?.()||'home';
 let active=pageOf(initial)?initial:'home';
 const applyScroll=(restore:boolean,route:string)=>{
  const token=++scrollRestoreToken;
  const position=restore?scrollByEntry.get(currentScrollEntry):undefined;
  const x=position?.x||0,y=position?.y||0;
  restoringScroll=restore;
  window.scrollTo(x,y);
  if(!restore){rememberScroll();return;}
  // A mounted React page may complete layout one frame after its host becomes
  // visible. Restore again after paint, without changing URL or focus.
  window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
   if(token!==scrollRestoreToken||active!==route)return;
   window.scrollTo(x,y);
   restoringScroll=false;
   rememberScroll();
  }));
 };
 const history=(window.liNativeRouteEffects?.history?.()||[]).filter(id=>!!pageOf(id)).slice(-32);
 appUiStore.getState().setRoute(active);
 const change=(raw:string,options:RouteOptions={}):boolean=>{
  if(!canVisit()||typeof raw!=='string')return false;
  const route=normalize(raw),page=pageOf(route);
  if(!page)return false;
  const {focus=true,remember=true,syncUrl=true,restoreScroll=false}=options;
  rememberScroll();
  if(remember&&active!==route){
   history.push(active);
   if(history.length>32)history.shift();
  }
  active=route;
  paintRoute(route,page);
  if(syncUrl)writeUrl(route,remember);
  else currentScrollEntry=ensureScrollEntry();
  appUiStore.getState().setRoute(route);
  window.liNativeRouteEffects?.afterNavigate(route);
  applyScroll(restoreScroll,route);
  saveReloadRoute(route);
  if(focus)page.focus({preventScroll:true});
  window.dispatchEvent(new CustomEvent('li:route-changed',{detail:{route}}));
  return true;
 };
 const back=():boolean=>{
  if(!canVisit())return false;
  // Real browser navigation is the canonical Back operation. The synchronous
  // fallback supports older embedded webviews without the History API.
  const currentDepth=Number(window.history.state?.liRouteDepth);
  if((Number.isInteger(currentDepth)?currentDepth:browserDepth)>0&&
     typeof window.history.back==='function'){
   rememberScroll();
   window.history.back();
   return true;
  }
  while(history.length){
   const previous=history.pop()!;
   if(previous!==active&&pageOf(previous))return change(previous,{remember:false});
  }
  return change('home',{remember:false});
 };
 const port:ReactRouterPort={
  navigate:change,back,getCurrent:()=>active,
  hasRoute:id=>typeof id==='string'&&!!pageOf(normalize(id))
 };
 // The invited React router is the direct action owner. Keep the pre-mount
 // native port only as an unmount/failure fallback, never as a routing hop.
 const nativeAppRouter=window.liAppRouter;
 window.liReactRouter=port;
 window.liAppRouter=port;
 let wasVerified=canVisit();
 const onSession=(event:Event)=>{
  const verified=(event as CustomEvent<{verified:boolean}>).detail?.verified;
  if(verified!==false){
   if(canVisit()){
    wasVerified=true;
    // Restore direct links only after invitation and lesson hosts are registered.
    const destination=routeFromUrl();
    if(destination!==active)change(destination,{
     remember:false,syncUrl:!hasExplicitRoute()
    });
    restoreSpellFromUrl(destination);
   }
   return;
  }
  // Initial pending/guest state is not a sign-out. Keep the requested deep
  // link intact until the invitation resolves; clear it only after a real session.
  if(!wasVerified)return;
  wasVerified=false;
  // A new invited account must never inherit the previous learner's Back
  // history or private lesson deep link. No persistence is touched.
  history.length=0;browserDepth=0;active='home';
  saveReloadRoute('home');
  scrollByEntry.clear();
  currentScrollEntry=++scrollEntrySequence;
  window.liNativeRouteEffects?.restoreHistory([],active);
  const home=pageOf('home');
  if(home)paintRoute(active,home);
  writeUrl(active);
  appUiStore.getState().setRoute(active);
  window.dispatchEvent(new CustomEvent('li:route-changed',{detail:{route:active}}));
 };
 const onPopState=()=>{
  // The direct React Catalog adapter syncs its breadcrumb data separately.
  // Breadcrumb Back/Forward changes ?catalog, not the active React screen.
  if(!canVisit())return;
  const restored=routeFromUrl();
  const next=Number(window.history.state?.liRouteDepth);
  if(Number.isInteger(next)&&next>=0){
   if(restored!==active){
    if(next<browserDepth&&history.length)history.pop();
    else if(next>browserDepth&&active)history.push(active);
   }
   browserDepth=next;
  }else if(restored!==active&&history.length)history.pop();
  const sameRoute=restored===active;
  if(!sameRoute)change(restored,{remember:false,syncUrl:false,restoreScroll:true});
  else{
   rememberScroll();
   currentScrollEntry=ensureScrollEntry();
  }
  // Preserve compared spell's own position across browser Back/Forward.
  if(restoreSpellFromUrl(restored)&&sameRoute)applyScroll(true,restored);
 };
 const onSpellView=()=>{
  if(active!=='guideDetail'||!canVisit())return;
  const view=spellPort()?.getView?.();
  if(!validSpell(view?.active||null))return;
  const previous=new URLSearchParams(window.location.search).get('method');
  if(validSpell(previous)&&previous!==view!.active){
   rememberScroll();
   writeUrl('guideDetail',true);
   applyScroll(false,'guideDetail');
  }else writeUrl('guideDetail',false);
  saveReloadRoute(active);
 };
 window.addEventListener('li:spell-view-changed',onSpellView);
 window.addEventListener('popstate',onPopState);
 window.addEventListener('li:auth-verified-changed',onSession);
 if(canVisit()){
  const requested=routeFromUrl();
  if(requested!==active)change(requested,{
   remember:false,syncUrl:!hasExplicitRoute()
  });
  restoreSpellFromUrl(requested);
 }
 return ()=>{
  window.removeEventListener('li:spell-view-changed',onSpellView);
  window.removeEventListener('popstate',onPopState);
  window.removeEventListener('scroll',onScroll);
  window.history.scrollRestoration=previousScrollRestoration;
  window.removeEventListener('li:auth-verified-changed',onSession);
  if(window.liReactRouter===port)delete window.liReactRouter;
  if(window.liAppRouter===port){
   if(nativeAppRouter)window.liAppRouter=nativeAppRouter;
   else delete window.liAppRouter;
  }
  window.liNativeRouteEffects?.restoreHistory([...history],active);
 };
}
export function openRoute(id:string):boolean{
 const succeeded=window.liAppRouter?.navigate(id)===true;
 if(succeeded)syncCanonicalRoute();
 return succeeded;
}
export function goBack():boolean{
 const succeeded=window.liAppRouter?.back()===true;
 if(succeeded)syncCanonicalRoute();
 return succeeded;
}
export function currentRoute():string{
 return window.liAppRouter?.getCurrent()||'home';
}
export function syncCanonicalRoute():void{
 appUiStore.getState().setRoute(currentRoute());
}
export function hasRoute(id:string):boolean{
 return window.liAppRouter?.hasRoute(id)===true;
}
