import React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthPanel} from './AuthPanel.js';
import {ReceiptCanaryPanel} from './ReceiptCanaryPanel.js';
import {mountLearningJourney,mountWave1Journey,mountEditorialJourney} from '../learning/app-entry.js';
import {releasedLessonRoutes} from '../learning/released-lessons.js';
import {createStagingLearningPorts} from '../learning/staging-ports.js';
import {mountSharedNavigation} from '../shell/mount-navigation.js';
import {mountKnowledgeSearch} from '../shell/knowledge-search.js';
import {mountCaptureIdea} from '../shell/capture-idea.js';
import {mountResearchAndCase} from '../shell/research-case.js';
import {mountHomeAndCatalog} from '../shell/home-catalog.js';
import {mountGuideAndLibrary} from '../shell/guide-library.js';
import {mountJournalAndSettings} from '../shell/journal-settings.js';
import {mountCheckinDialog} from '../shell/checkin-dialog.js';

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
 for(const {id,route,slug} of releasedLessonRoutes){
  const renderer=id==='L09-1-2'?'l09':
   id==='L03-1-2'||id==='L15-2-2'?'wave1':'editorial';
  const page=document.getElementById('page-'+route);
  const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
  if(!page||!legacy)continue;
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
}
if(document.readyState==='loading')
 document.addEventListener('DOMContentLoaded',enableIntegratedLessons,{once:true});
else enableIntegratedLessons();

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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountGuideAndLibrary,{once:true});
else mountGuideAndLibrary();

// Temporary #161 signed canary fallback for an iPhone still displaying the
// legacy Settings shell. Its root lives inside that shell, so it disappears
// automatically when the existing React Settings view takes ownership.
// No second app, no automatic RPC call, no production widget.
function mountLegacySettingsCanary(){
 const grid=document.querySelector<HTMLElement>(
  '#page-settings > .section-shell .settings-group[aria-labelledby="settings-data"] .settings-group-grid'
 );
 if(!grid||grid.querySelector('#li-sync161-legacy-root'))return;
 const host=document.createElement('div');
 host.id='li-sync161-legacy-root';
 grid.append(host);
 createRoot(host).render(<ReceiptCanaryPanel/>);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountLegacySettingsCanary,{once:true});
else mountLegacySettingsCanary();

// Signed-in only: React Journal and Settings reuse one native private-data/consent owner.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountJournalAndSettings,{once:true});
else mountJournalAndSettings();

// React owns the physical-first Check-in modal and session state, without the legacy form.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountCheckinDialog,{once:true});
else mountCheckinDialog();
