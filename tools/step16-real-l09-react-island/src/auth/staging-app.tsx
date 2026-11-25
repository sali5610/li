import React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthPanel} from './AuthPanel.js';
import {mountLearningJourney,mountWave1Journey,mountEditorialJourney} from '../learning/app-entry.js';
import {releasedLessonRoutes} from '../learning/released-lessons.js';
import {createStagingLearningPorts} from '../learning/staging-ports.js';
import {mountPersonalStudyRoutes} from '../learning/staging-draft-preview.js';
import {mountSharedNavigation} from '../shell/mount-navigation.js';
import {mountKnowledgeSearch} from '../shell/knowledge-search.js';
import {mountCaptureIdea} from '../shell/capture-idea.js';
import {mountResearchAndCase} from '../shell/research-case.js';
import {mountHomeAndCatalog} from '../shell/home-catalog.js';
import {mountGuideAndLibrary} from '../shell/guide-library.js';
import {mountJournalAndSettings} from '../shell/journal-settings.js';
import {mountCheckinDialog} from '../shell/checkin-dialog.js';
import {mountLaoLyDialog} from '../shell/laoly-dialog.js';
import {mountLaoLyFab} from '../shell/laoly-fab.js';
import {mountReactChrome} from '../shell/react-shell.js';
import {installReactCatalogPort} from '../shell/catalog-route-adapter.js';

// Unified GitHub Pages staging: no guest app. React verifies signed invitation.
const root=document.getElementById('li-staging-auth-root');
if(!root)throw Error('STAGING_AUTH_ROOT_MISSING');
// Auth gate is only for sign-in; account management is in Settings.
createRoot(root).render(<AuthPanel/>);

// The Pages HTML paints the canonical UX-ART-06 state *before* JS downloads.
// Keep the native Home invisible until all React roots have painted and Home
// artwork has decoded; no arbitrary minimum splash duration or fake progress.
// Tell the tiny HTML fallback that the real startup controller is alive.
(window as Window&{liBootRuntimeReady?:boolean}).liBootRuntimeReady=true;
const bootSplash=document.getElementById('li-boot-splash');
const bootLoading=document.getElementById('li-boot-loading');
const bootError=document.getElementById('li-boot-error');
type BootFailure='timeout'|'offline'|'runtime'|'bundle';
let bootFailure:BootFailure|null=null;
let bootComplete=false;
let bootFrame=0;
let bootTimer=0;
let lastBootVerified:boolean|null=null;
let lastBootTransient:boolean|null=null;
const isVerified=()=>document.documentElement.classList.contains('li-auth-verified');
function localizeBoot(){
 const language=window as Window&{liLanguage?:{get?:()=>string}};
 const locale=language.liLanguage?.get?.()||'vi';
 const en=locale==='en';
 const labels:[string,string]=en?
  ['Preparing your library…','Elder Ly is getting everything ready.']:
  ['Đang mở Tàng Thư…','Lão Lý đang chuẩn bị mọi thứ.'];
 const errors:Record<BootFailure,[string,string]>=en?{
  timeout:['The library did not finish loading','Some parts of the app are still not ready. Reload to try again.'],
  offline:['The offline library could not open','Some required local app data is unavailable. Reconnect and open the library to restore it.'],
  runtime:['The library could not open','A part of the app failed during startup. Reload to try again.'],
  bundle:['The app could not be downloaded','A required app file did not load. Check your connection and reload.']
 }:{
  timeout:['Tàng Thư chưa tải xong','Một số phần của ứng dụng chưa sẵn sàng. Hãy thử tải lại.'],
  offline:['Chưa thể mở thư viện offline','Một phần dữ liệu ứng dụng trên máy chưa sẵn sàng. Kết nối mạng và mở thư viện để khôi phục.'],
  runtime:['Chưa thể mở Tàng Thư','Một phần ứng dụng gặp lỗi khi khởi động. Hãy thử tải lại.'],
  bundle:['Không tải được ứng dụng','Một tệp cần thiết chưa tải được. Kiểm tra mạng rồi thử lại.']
 };
 const title=document.getElementById('li-boot-title');
 const description=document.getElementById('li-boot-description');
 const errorTitle=document.getElementById('li-boot-error-title');
 const errorDescription=document.getElementById('li-boot-error-description');
 const retry=document.getElementById('li-boot-error-retry');
 if(title)title.textContent=labels[0];
 if(description)description.textContent=labels[1];
 if(errorTitle)errorTitle.textContent=errors[bootFailure||'runtime'][0];
 if(errorDescription)errorDescription.textContent=errors[bootFailure||'runtime'][1];
 if(retry)retry.textContent=en?'Reload the app':'Tải lại ứng dụng';
}
function showBootError(reason:BootFailure){
 if(bootComplete||document.documentElement.classList.contains('li-boot-ready'))return;
 bootFailure=reason;
 bootLoading?.setAttribute('hidden','');
 bootError?.removeAttribute('hidden');
 localizeBoot();
}
function resetBoot(){
 bootFailure=null;
 bootLoading?.removeAttribute('hidden');
 bootError?.setAttribute('hidden','');
}
localizeBoot();
window.addEventListener('li:localechange',localizeBoot);
document.getElementById('li-boot-error-retry')?.addEventListener('click',()=>window.location.reload());
// Report a real startup fault, not normal empty data, a rejected invitation,
// or an asynchronous background sync problem after the app has opened.
window.addEventListener('error',event=>{
 if(bootComplete)return;
 if(event.target instanceof HTMLScriptElement &&
    (event.target.src.includes('staging-auth-gate.js')||
     event.target.src.includes('li-first-party-app.js')))showBootError('bundle');
 else if(event instanceof ErrorEvent &&
  /(?:REACT_.*(?:MISSING|FAILED|REQUIRED)|STAGING_.*MISSING|Failed to fetch dynamically imported module)/.test(event.message))
  showBootError('runtime');
},true);
function revealBoot(){
 if(bootComplete)return;
 bootComplete=true;
 window.clearTimeout(bootTimer);
 document.documentElement.classList.add('li-boot-ready');
 bootSplash?.setAttribute('aria-hidden','true');
}
function appPainted(){
 const route=window.liReactRouter?.getCurrent?.();
 const page=route?document.getElementById('page-'+route):null;
 const home=document.querySelector<HTMLElement>('#li-react-home-host [data-li-react-screen="home"]');
 const navigation=document.querySelector('.header .topnav[data-li-react-navigation="desktop"] button');
 const catalogReady=route!=='catalog'||Boolean(page?.querySelector('[data-li-react-screen="catalog"]'));
 return Boolean(route&&page?.classList.contains('active')&&home&&navigation&&
  catalogReady&&(route!=='home'||!navigator.onLine||home.dataset.liBootArtReady==='true'));
}
function checkAppBoot(){
 bootFrame=0;
 if(bootComplete||!isVerified())return;
 if(appPainted()){
  window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
   if(isVerified()&&appPainted())revealBoot();
   else checkAppBoot();
  }));
 }else bootFrame=window.requestAnimationFrame(checkAppBoot);
}
function armBootTimeout(){
 window.clearTimeout(bootTimer);
 bootTimer=window.setTimeout(()=>{
  if(!document.documentElement.classList.contains('li-boot-ready'))showBootError(navigator.onLine?'timeout':'offline');
 },20000);
}
window.addEventListener('li:auth-verified-changed',event=>{
 const detail=(event as CustomEvent<{verified?:boolean;transient?:boolean}>).detail;
 const verified=Boolean(detail?.verified),transient=Boolean(detail?.transient);
 if(verified===lastBootVerified&&(verified||transient===lastBootTransient))return;
 lastBootVerified=verified;lastBootTransient=transient;
 armBootTimeout();
 if(verified){
  resetBoot();
  // A guest may sign in without a full navigation; restore the cover before
  // React replaces the signed-out Auth view with private screen content.
  document.documentElement.classList.remove('li-boot-ready');
  bootSplash?.removeAttribute('aria-hidden');
  bootComplete=false;
  window.cancelAnimationFrame(bootFrame);
  bootFrame=window.requestAnimationFrame(checkAppBoot);
 }else{
  window.cancelAnimationFrame(bootFrame);
  bootComplete=false;
  document.documentElement.classList.remove('li-boot-ready');
  bootSplash?.removeAttribute('aria-hidden');
 }
});
// Signed-out/denied visitors get the real Auth UI, never a transient homepage.
window.addEventListener('li:auth-startup-settled',()=>{
 if(!isVerified())revealBoot();
});
// A genuine startup timeout is a recoverable failure, not endless loading.
// We cannot infer its underlying cause; offer a clear message and real reload.
armBootTimeout();

// Replace the native Catalog path controller before any Home, Search or
// lesson React mounts. Native fallback is still shipped in standalone site.
installReactCatalogPort();


/** One invited-only route handler for all released lessons.
 * Future editorial routes require the same explicit pack + catalog release gate;
 * the renderer also rejects non-reviewed or wrong-format content at runtime.
 */
function enableIntegratedLessons(){
 // New editorial routes have no legacy HTML page. Materialize their host only
 // after manifest + catalog + published legacy route ALL authorize them.
 // In particular L09-1-1 remains absent while its manuscript is a draft.
 const editorialRouteMap:Record<string,string>=Object.create(null);
 for(const {id,route,slug} of releasedLessonRoutes){
  const renderer=id==='L09-1-2'?'l09':
   id==='L03-1-2'||id==='L15-2-2'?'wave1':'editorial';
  let page=document.getElementById('page-'+route);
  if(renderer==='editorial'&&!page){
   const main=document.getElementById('main');
   if(!main)throw Error('EDITORIAL_INTEGRATED_MAIN_MISSING');
   page=document.createElement('section');
   page.id='page-'+route;page.className='page';page.tabIndex=-1;
   const shell=document.createElement('div');
   shell.className='section-shell';
   const loading=document.createElement('h1');
   loading.id=slug+'-title';loading.textContent='Đang tải bài học';
   shell.append(loading);page.append(shell);main.append(page);
  }
  if(renderer==='editorial')editorialRouteMap[route]=id;
  const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
  if(!page||!legacy)throw Error('RELEASED_LESSON_ROUTE_HOST_MISSING '+id);
  let dispose:(()=>void)|null=null,host:HTMLElement|null=null;
  const ports=createStagingLearningPorts(id);
  const title=renderer==='l09'?'li-react-l09-title':'li-react-'+id+'-title';
  const update=()=>{
   const allowed=document.documentElement.classList.contains('li-auth-verified');
   const active=page.classList.contains('active');
   if(allowed&&active&&!dispose){
    const node=document.createElement('div');
    // Keep the exact existing host IDs (including related-lesson integration).
    node.id=renderer==='l09'?'li-react-l09-host':'li-react-'+slug+'-host';
    node.className='section-shell';page.append(node);
    try{
     dispose=renderer==='l09'?mountLearningJourney(node,ports):
      renderer==='wave1'?mountWave1Journey(node,id as 'L03-1-2'|'L15-2-2',ports):
      mountEditorialJourney(node,id,ports);
     host=node;legacy.hidden=true;legacy.style.display='none';
     page.setAttribute('aria-labelledby',title);
    }catch{
     node.remove();legacy.hidden=false;legacy.style.removeProperty('display');
     throw Error('REACT_LESSON_MOUNT_FAILED');
    }
   }else if((!allowed||!active)&&dispose){
    dispose();dispose=null;host?.remove();host=null;
    legacy.hidden=false;legacy.style.removeProperty('display');
    page.setAttribute('aria-labelledby',slug+'-title');
   }
  };
  // Route and auth controllers publish explicit state changes. Do not watch
  // DOM classes to decide whether the React lesson is mounted.
  window.addEventListener('li:route-changed',update);
  window.addEventListener('li:auth-verified-changed',update);
  update();
 }
 // Native app URL sync consumes only this generated and release-verified map.
 // An unapproved lesson ID is never made navigable by a query parameter.
 (window as Window&{liReleasedEditorialRoutes?:Readonly<Record<string,string>>})
  .liReleasedEditorialRoutes=Object.freeze({...editorialRouteMap});
 // All React catalogue entrypoints and browser history share the exact same
 // manifest+catalog+published-route release gate.
 (window as Window&{liReleasedLessonRoutes?:Readonly<Record<string,string>>})
  .liReleasedLessonRoutes=Object.freeze(Object.fromEntries(
   releasedLessonRoutes.map(({id,route})=>[id,route])));
 // Deep-link restore is exclusively performed by the global React router
 // after all released and personal-study hosts are registered. No second
 // per-lesson URL watcher should override the learner's active navigation.
}
if(document.readyState==='loading')
 document.addEventListener('DOMContentLoaded',enableIntegratedLessons,{once:true});
else enableIntegratedLessons();

// Personal-study manuscripts mount as ordinary Catalog → Course → Lesson routes.
// Existing invited login and owner-scoped learner sync remain authoritative.
if(import.meta.env.VITE_LI_AUTH_TARGET==='github-pages-staging'){
 const registerPersonalLessons=()=>{
  try{mountPersonalStudyRoutes();}
  catch(error){
   console.error('LI_PERSONAL_STUDY_ROUTES_UNAVAILABLE',error);
   // Fail visibly rather than displaying an inoperative "Vào bài học".
   (window as Window&{liPersonalStudyRouteError?:string}).liPersonalStudyRouteError=
    error instanceof Error?error.message:'LESSON_ROUTE_SETUP_FAILED';
   window.dispatchEvent(new Event('li:personal-study-route-error'));
  }
 };
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',registerPersonalLessons,{once:true});
 else registerPersonalLessons();
}


// The persistent header brand, footer and Undo notification are React UI too.
// The native toast() function is retained only as a pre-mount/error fallback.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountReactChrome,{once:true});
else mountReactChrome();

// React owns top/bottom navigation, direct history and utilities; native
// data-page delegation is fallback-only and disabled in the invited app.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountSharedNavigation,{once:true});
else mountSharedNavigation();

// Tra Cứu is React-owned while retaining the one canonical static knowledge client.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountKnowledgeSearch,{once:true});
else mountKnowledgeSearch();

// React-owned Nhặt Ý UI; persistence remains the existing invited-user private store.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountCaptureIdea,{once:true});
else mountCaptureIdea();

// Real React learner research/case views share the existing app navigation and private store.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountResearchAndCase,{once:true});
else mountResearchAndCase();


// One visible React Home→Catalog→Lesson discovery path; native owners remain temporary ports.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountHomeAndCatalog,{once:true});
else mountHomeAndCatalog();

// Adopt canonical React Guide + learner's Library / Resume / Collection on the same invited app.
// Native Spell Practice publishes its port during DOMContentLoaded, not before.
// A deferred Vite module runs at readyState=interactive: mounting Guide here
// used to throw and abort every subsequent React screen, including Settings.
// Always wait for the native port when DOMContentLoaded has not fired yet.
if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',mountGuideAndLibrary,{once:true});
else mountGuideAndLibrary();

// Signed-in only: React Journal and Settings reuse one native private-data/consent owner.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountJournalAndSettings,{once:true});
else mountJournalAndSettings();

// React owns the physical-first Check-in modal and session state, without the legacy form.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountCheckinDialog,{once:true});
else mountCheckinDialog();

// The complete Lão Lý popup is React-rendered inside its existing single modal host.
// Existing contextual dialog plans, sourced quote rotation and draggable avatar are reused.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountLaoLyDialog,{once:true});
else mountLaoLyDialog();

// The floating Lão Lý companion is also React-owned. Existing native avatar
// remains as fallback if the React app fails before mounting; the React root
// takes over its exact host and original position port once it is ready.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountLaoLyFab,{once:true});
else mountLaoLyFab();
