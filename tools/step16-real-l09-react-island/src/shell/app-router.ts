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
function writeUrl(route:string){
 const url=new URL(window.location.href);
 const lesson=published[route]||window.liReleasedEditorialRoutes?.[route]||
  preview.get(route);
 if(lesson)url.searchParams.set('lesson',lesson);
 else url.searchParams.delete('lesson');
 if(!lesson){
  url.searchParams.delete('chapter');
  if(route!=='catalog')url.searchParams.delete('catalog');
 }
 url.hash='';
 const path=url.pathname+url.search;
 if(path!==window.location.pathname+window.location.search+window.location.hash)
  window.history.replaceState(window.history.state,'',path);
}
function paintRoute(route:string,page:HTMLElement){
 document.querySelector('.app')?.classList.toggle('home-focus',route==='home');
 // Legacy sections are host shells for React. Visibility still uses the
 // existing CSS class so all 17 personal preview route mounts remain intact.
 document.querySelectorAll<HTMLElement>('section.page').forEach(node=>
  node.classList.toggle('active',node===page));
 // Mutate only fallback navigation; visible React controls use Zustand state.
 document.querySelectorAll<HTMLElement>('[data-page]').forEach(node=>{
  const active=['home','catalog','guide','library'].includes(route)&&node.dataset.page===route;
  node.classList.toggle('active',active);
  if(active)node.setAttribute('aria-current','page');
  else node.removeAttribute('aria-current');
 });
 document.querySelectorAll<HTMLElement>('.header .tool-button').forEach(node=>{
  const active=node.dataset.page===route;
  node.classList.toggle('active',active);
  if(active)node.setAttribute('aria-current','page');
  else node.removeAttribute('aria-current');
 });
}
export function mountReactRouter():()=>void{
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
  if(syncUrl)writeUrl(route);
  appUiStore.getState().setRoute(route);
  window.liNativeRouteEffects?.afterNavigate(route);
  window.scrollTo(0,0);
  if(focus)page.focus({preventScroll:true});
  window.dispatchEvent(new CustomEvent('li:route-changed',{detail:{route}}));
  return true;
 };
 const back=():boolean=>{
  if(!canVisit())return false;
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
 window.liReactRouter=port;
 const onSession=(event:Event)=>{
  if((event as CustomEvent<{verified:boolean}>).detail?.verified!==false)return;
  // A new invited account must never inherit the previous learner's Back
  // history or private lesson deep link. No persistence is touched.
  history.length=0;active='home';
  window.liNativeRouteEffects?.restoreHistory([],active);
  const home=pageOf('home');
  if(home)paintRoute(active,home);
  writeUrl(active);
  appUiStore.getState().setRoute(active);
  window.dispatchEvent(new CustomEvent('li:route-changed',{detail:{route:active}}));
 };
 window.addEventListener('li:auth-verified-changed',onSession);
 return ()=>{
  window.removeEventListener('li:auth-verified-changed',onSession);
  if(window.liReactRouter===port)delete window.liReactRouter;
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
