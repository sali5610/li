import canonical from '../../../../content/curriculum/legacy-catalog.v1.json';
import {personalStudyRoute,releasedLessonRoutes} from '../learning/released-lessons.js';
import {openRoute} from './app-router.js';

/** Catalog navigation DATA adapter for the integrated React app.
 * React owns the visible five-tier UI; this adapter owns only path/history
 * and release-gated route actions. No hidden buttons or native DOM rendering.
 * The standalone site keeps its own catalog-drilldown.js fallback.
 */
type CatalogPath=readonly string[];
type Lesson={id:string;title:string;published:boolean;route?:string};
type Course={id:string;lessons:readonly Lesson[]};
type Field={id:string;courses:readonly Course[]};
type Group={id:string;fields:readonly Field[]};
type CatalogPort={
 getPath:()=>string[];
 openPath:(path:string[],save?:boolean)=>void;
 openLesson:(id:string)=>boolean;
 openForLesson:(id:string)=>boolean;
 openCourse:(group:string,field:string,course:string)=>void;
 render:()=>void;
};
type CatalogWindow=Window&{liCatalog?:CatalogPort};
const app=window as CatalogWindow;
const groups:readonly Group[]=canonical.groups as Group[];
const aliases:Readonly<Record<string,string>>=canonical.legacyGroupAliases;
const released=new Map(releasedLessonRoutes.map(({id,route})=>[id,route]));
const canVisit=()=>document.documentElement.classList.contains('li-auth-verified')&&
 !document.documentElement.classList.contains('li-account-open');

function normalize(parts:CatalogPath):string[]{
 const next=parts.filter(Boolean).slice(0,4);
 if(next[1]==='ux-design')next[1]='hci';
  if(next[0])next[0]=aliases[next[0]]||next[0];
 const group=groups.find(x=>x.id===next[0]);
 if(!group)return [];
 const field=group.fields.find(x=>x.id===next[1]);
 if(!field)return [group.id];
 const course=field.courses.find(x=>x.id===next[2]);
 if(!course)return [group.id,field.id];
 const lesson=course.lessons.find(x=>x.id===next[3]);
 return lesson?[group.id,field.id,course.id,lesson.id]:
  [group.id,field.id,course.id];
}
function urlPath():string[]{
 const raw=new URL(window.location.href).searchParams.get('catalog')||'';
 return normalize(raw.split('/'));
}
function locate(id:string){
 for(const group of groups)for(const field of group.fields)
  for(const course of field.courses){
   const lesson=course.lessons.find(x=>x.id===id);
   if(lesson)return {path:[group.id,field.id,course.id],lesson};
  }
 return null;
}
function emitPath(){window.dispatchEvent(new Event('li:catalog-pathchange'));}
function writePath(path:CatalogPath,push:boolean,stripLesson:boolean){
 const url=new URL(window.location.href);
 if(path.length)url.searchParams.set('catalog',path.join('/'));
 else url.searchParams.delete('catalog');
 if(stripLesson){
  url.searchParams.delete('lesson');url.searchParams.delete('chapter');
 }
 const target=url.pathname+url.search+url.hash;
 if(target===window.location.pathname+window.location.search+window.location.hash)return;
 const depth=Number(window.history.state?.liRouteDepth);
 const nextDepth=Number.isInteger(depth)&&depth>=0?depth:0;
 const state={...window.history.state,liRoute:'catalog',
  liRouteDepth:push?nextDepth+1:nextDepth};
 if(push&&typeof window.history.pushState==='function')
  window.history.pushState(state,'',target);
 else window.history.replaceState(state,'',target);
}
let path=urlPath();
function setPath(next:CatalogPath,push=false,stripLesson=false){
 const chosen=normalize(next);
 const changed=chosen.join('/')!==path.join('/');
 path=chosen;
 if(changed)emitPath();
 writePath(chosen,push,stripLesson);
}
function openLesson(id:string):boolean{
 if(!canVisit())return false;
 const target=locate(id);
 if(!target||target.lesson.published!==true||
  released.get(id)!==target.lesson.route||
  !document.getElementById('page-'+target.lesson.route))return false;
 // The canonical React router writes ONE lesson history entry. Do not
 // pre-push the lesson URL as the old native Catalog did.
 setPath(target.path,false,false);
 return openRoute(target.lesson.route!);
}
function openForLesson(id:string):boolean{
 if(!canVisit())return false;
 const target=locate(id);
 if(!target)return false;
 const route=personalStudyRoute(id)||released.get(id);
 const available=route&&document.getElementById('page-'+route)&&
  (personalStudyRoute(id)!==null||
   (target.lesson.published===true&&released.get(id)===target.lesson.route));
 if(!available)return false;
 setPath(target.path,false,false);
 if(!openRoute('catalog'))return false;
 window.requestAnimationFrame?.(()=>{
  const heading=document.querySelector<HTMLElement>('#li-react-catalog-host h1');
  heading?.focus({preventScroll:true});
 });
 return true;
}

/** Called only by the authenticated React shell, before Home/Catalog mounts. */
export function installReactCatalogPort():()=>void{
 const port:CatalogPort={
  getPath:()=>[...path],
  openPath:(next,save=true)=>{
   if(!canVisit())return;
   const chosen=normalize(next);
   if(chosen.join('/')===path.join('/'))return;
   setPath(chosen,save,true);
   window.scrollTo?.({top:0,left:0,behavior:'instant'});
  },
  openLesson,openForLesson,
  openCourse:(group,field,course)=>{
   if(!canVisit())return;
   setPath([group,field,course],false,false);
   openRoute('catalog');
  },
  render:()=>{} // Only the React component renders this canonical model.
 };
 const existing=app.liCatalog;
 app.liCatalog=port;
  // Canonicalize a legacy URL without claiming the active screen is Catalog.
  // Its history.state can belong to a lesson/search route and must survive.
  const current=new URL(window.location.href);
  const raw=(current.searchParams.get('catalog')||'').split('/').filter(Boolean).join('/');
  if(raw!==path.join('/')){
    if(path.length)current.searchParams.set('catalog',path.join('/'));
    else current.searchParams.delete('catalog');
    window.history.replaceState(window.history.state,'',current.pathname+current.search+current.hash);
  }
 // Back/Forward within Catalog changes ?catalog without changing ?view.
 const onPop=()=>{
  const updated=urlPath();
  if(updated.join('/')!==path.join('/')){
   path=updated;emitPath();
  }
 };
 let wasVerified=canVisit();
 const onAuth=(event:Event)=>{
  const detail=(event as CustomEvent<{verified?:boolean;transient?:boolean}>).detail;
  const verified=detail?.verified;
  if(verified!==false){
   if(canVisit()){
    wasVerified=true;
    const restored=urlPath();
    if(restored.join('/')!==path.join('/')){path=restored;emitPath();}
   }
   return;
  }
  // A transient Neon recheck is not a signed-out learner.
  if(detail?.transient===true)return;
  // Auth starts as pending and emits false before inviting the learner.
  // Preserve their ?catalog= deep link until a REAL signed-in session ends.
  if(!wasVerified)return;
  wasVerified=false;
  if(path.length){path=[];emitPath();}
 };
 // The global router may reconstruct a missing ?catalog= query on reload
 // after this adapter's auth listener has already run. Sync the same path
 // when the Catalog route paints; do not reset course context on lesson exits.
 const onRoute=(event:Event)=>{
  if((event as CustomEvent<{route?:string}>).detail?.route==='catalog')onPop();
 };
 window.addEventListener('popstate',onPop);
 window.addEventListener('li:route-changed',onRoute);
 window.addEventListener('li:auth-verified-changed',onAuth);
 return ()=>{
  window.removeEventListener('popstate',onPop);
  window.removeEventListener('li:route-changed',onRoute);
  window.removeEventListener('li:auth-verified-changed',onAuth);
  if(app.liCatalog===port){
   if(existing)app.liCatalog=existing;
   else delete app.liCatalog;
  }
 };
}
