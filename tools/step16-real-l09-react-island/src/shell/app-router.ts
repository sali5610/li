import {appUiStore} from './app-store.js';
import {personalStudyLessonIds,personalStudyRoute} from '../learning/released-lessons.js';

/** One stateful React app router. The old script provides DATA side effects
 * (visited lessons, research, bookmarks) and a pre-mount fallback, but does
 * not own the active route, history or URL once this port is installed. */
type RouteOptions={focus?:boolean;remember?:boolean;syncUrl?:boolean};
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
const canVisit=()=>document.documentElement.classList.contains('li-auth-verified')&&
 !document.documentElement.classList.contains('li-account-open');
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
 return query.has('catalog')&&pageOf('catalog')?'catalog':'home';
}
function writeUrl(route:string,remember=false){
 const url=new URL(window.location.href);
 const lesson=published[route]||window.liReleasedEditorialRoutes?.[route]||
  preview.get(route);
 if(lesson)url.searchParams.set('lesson',lesson);
 else url.searchParams.delete('lesson');
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
   window.history.pushState({...window.history.state,liRoute:route,liRouteDepth:browserDepth},'',path);
  }else window.history.replaceState({...window.history.state,liRoute:route,liRouteDepth:browserDepth},'',path);
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
 browserDepth=Number.isInteger(window.history.state?.liRouteDepth)&&
  window.history.state.liRouteDepth>=0?window.history.state.liRouteDepth:0;
 if(!Number.isInteger(window.history.state?.liRouteDepth)){
  window.history.replaceState({...window.history.state,liRouteDepth:browserDepth},'',
   window.location.pathname+window.location.search+window.location.hash);
 }
 const initial=window.liAppRouter?.getCurrent?.()||'home';
 let active=pageOf(initial)?initial:'home';
 const history=(window.liNativeRouteEffects?.history?.()||[]).filter(id=>!!pageOf(id)).slice(-32);
 appUiStore.getState().setRoute(active);
 const change=(raw:string,options:RouteOptions={}):boolean=>{
  if(!canVisit()||typeof raw!=='string')return false;
  const route=normalize(raw),page=pageOf(route);
  if(!page)return false;
  const {focus=true,remember=true,syncUrl=true}=options;
  if(remember&&active!==route){
   history.push(active);
   if(history.length>32)history.shift();
  }
  active=route;
  paintRoute(route,page);
  if(syncUrl)writeUrl(route,remember);
  appUiStore.getState().setRoute(route);
  window.liNativeRouteEffects?.afterNavigate(route);
  window.scrollTo(0,0);
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
    if(destination!==active)change(destination,{remember:false,syncUrl:false});
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
  if(restored!==active)change(restored,{remember:false,syncUrl:false});
 };
 window.addEventListener('popstate',onPopState);
 window.addEventListener('li:auth-verified-changed',onSession);
 if(canVisit()){
  const requested=routeFromUrl();
  if(requested!==active)change(requested,{remember:false,syncUrl:false});
 }
 return ()=>{
  window.removeEventListener('popstate',onPopState);
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
