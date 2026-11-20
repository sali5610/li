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

// Unified GitHub Pages staging: no guest app. React verifies signed invitation.
const root=document.getElementById('li-staging-auth-root');
if(!root)throw Error('STAGING_AUTH_ROOT_MISSING');
const opener=document.getElementById('li-open-account');
function closeAccount(){
 document.documentElement.classList.remove('li-account-open');
 opener?.focus();
}
opener?.addEventListener('click',()=>{
 if(!document.documentElement.classList.contains('li-auth-verified'))return;
 document.documentElement.classList.add('li-account-open');
 window.dispatchEvent(new Event('li:account-open'));
 root.focus();
});
createRoot(root).render(<AuthPanel onClose={closeAccount}/>);


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
  const observer=new MutationObserver(update);
  observer.observe(page,{attributes:true,attributeFilter:['class']});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
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
 const requested=new URLSearchParams(window.location.search).get('lesson');
 const direct= releasedLessonRoutes.find(x=>x.id===requested&&!!editorialRouteMap[x.route]);
 if(direct){
  // Keep a signed-in deep link from silently sending its learner to Home.
  // Do not override navigation the learner already performed while signing in.
  const openRequested=()=>{
   if(!document.documentElement.classList.contains('li-auth-verified')||
    !document.getElementById('page-home')?.classList.contains('active'))return;
   const app=window as Window&{navigate?:(route:string)=>void};
   if(typeof app.navigate!=='function')return;
   app.navigate(direct.route);
   watcher.disconnect();
  };
  const watcher=new MutationObserver(openRequested);
  watcher.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  openRequested();
 }
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

// React owns top navigation, bottom navigation and utility controls. Native
// data-page event delegation remains the temporary route bridge.
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
