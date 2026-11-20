import React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthPanel} from './AuthPanel.js';
import {mountLearningJourney,mountWave1Journey} from '../learning/app-entry.js';
import {createStagingLearningPorts} from '../learning/staging-ports.js';
import {mountSharedNavigation} from '../shell/mount-navigation.js';
import {mountKnowledgeSearch} from '../shell/knowledge-search.js';
import {mountCaptureIdea} from '../shell/capture-idea.js';
import {mountResearchAndCase} from '../shell/research-case.js';

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


/** Activate only the real L09 route after AuthPanel has verified invite + owner.
 * The legacy markup stays available for rollback; it is hidden, not erased.
 */
function enableIntegratedL09(){
 const page=document.getElementById('page-lessonL09');
 const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!page||!legacy)return;
 let dispose:(()=>void)|null=null;
 let host:HTMLElement|null=null;
 const ports=createStagingLearningPorts();
 const update=()=>{
  const allowed=document.documentElement.classList.contains('li-auth-verified');
  const active=page.classList.contains('active');
  if(allowed&&active&&!dispose){
   const node=document.createElement('div');
   node.id='li-react-l09-host';node.className='section-shell';page.append(node);
   try{
    dispose=mountLearningJourney(node,ports);
    host=node;legacy.hidden=true;legacy.style.display='none';
    page.setAttribute('aria-labelledby','li-react-l09-title');
   }catch{
    node.remove();legacy.hidden=false;legacy.style.removeProperty('display');
    throw Error('REACT_L09_MOUNT_FAILED');
   }
  }else if((!allowed||!active)&&dispose){
   dispose();dispose=null;host?.remove();host=null;
   legacy.hidden=false;legacy.style.removeProperty('display');
   page.setAttribute('aria-labelledby','l09-title');
  }
 };
 const observer=new MutationObserver(update);
 observer.observe(page,{attributes:true,attributeFilter:['class']});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enableIntegratedL09,{once:true});
else enableIntegratedL09();

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


/** Invited-only active React Wave1 lessons. Keep the established routes and
 * native element shell for rollback, but only React owns visible learning UI. */
function enableIntegratedWave1(){
 const routes=[
  {id:'L03-1-2' as const,route:'lessonL03',slug:'l03'},
  {id:'L15-2-2' as const,route:'lessonL15',slug:'l15'}
 ];
 for(const {id,route,slug} of routes){
  const page=document.getElementById('page-'+route);
  const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
  if(!page||!legacy)continue;
  let dispose:(()=>void)|null=null,host:HTMLElement|null=null;
  const ports=createStagingLearningPorts(id);
  const update=()=>{
   const allowed=document.documentElement.classList.contains('li-auth-verified');
   const active=page.classList.contains('active');
   if(allowed&&active&&!dispose){
    const node=document.createElement('div');
    node.id='li-react-'+slug+'-host';node.className='section-shell';page.append(node);
    try{
     dispose=mountWave1Journey(node,id,ports);
     host=node;legacy.hidden=true;legacy.style.display='none';
     page.setAttribute('aria-labelledby','li-react-'+id+'-title');
    }catch{
     node.remove();
     legacy.hidden=false;legacy.style.removeProperty('display');
     throw Error('REACT_WAVE1_MOUNT_FAILED');
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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enableIntegratedWave1,{once:true});
else enableIntegratedWave1();
