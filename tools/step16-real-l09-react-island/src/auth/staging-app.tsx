import React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthPanel} from './AuthPanel.js';
// The one public app already owns the L09 route. This is a feature handover
// inside that route, not an additional preview or login entrypoint.
import {mountLearningJourney} from '../learning/app-entry';
import {createStagingLearningPorts} from '../learning/staging-ports';


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

/**
 * Native L09 stays mounted and untouched while auth or data is unresolved.
 * Only after the REAL invited session + native attempt load succeeds do we
 * replace the visible lesson with the React vertical slice. On revocation or
 * failure, stop the React view and restore the existing native lesson.
 * Chat 1 owns the decision to merge/release through the ONE staging publisher.
 */
function attachExistingL09(){
 const lesson=document.getElementById('page-lessonL09');
 const shell=lesson?.querySelector<HTMLElement>('.section-shell');
 if(!lesson||!shell||document.getElementById('li-react-learning-host'))return;
 const native=Array.from(shell.children).map(node=>({
  node:node as HTMLElement,hidden:(node as HTMLElement).hidden,
  inert:(node as HTMLElement).inert
 }));
 const host=document.createElement('div');
 host.id='li-react-learning-host';
 host.hidden=true;
 host.dataset.liFrontend='l09-real';
 shell.appendChild(host);
 let unmount:(()=>void)|null=null,failed=false;
 function restore(){
  for(const {node,hidden,inert} of native){node.hidden=hidden;node.inert=inert;}
  host.hidden=true;
 }
 function stop(){
  if(unmount){unmount();unmount=null;}
  restore();
 }
 function syncAccess(){
  const invited=document.documentElement.classList.contains('li-auth-verified');
  if(!invited){failed=false;stop();return;}
  if(unmount||failed)return;
  try{
   unmount=mountLearningJourney(host,createStagingLearningPorts(),{
    onReady(){
     if(!document.documentElement.classList.contains('li-auth-verified'))return;
     for(const {node} of native){node.hidden=true;node.inert=true;}
     host.hidden=false;
     lesson.dataset.liLearningRuntime='react';
    },
    onFailure(){
     failed=true;
     // No guest, no fake state; native screen is preserved for safe fallback.
     queueMicrotask(()=>{stop();delete lesson.dataset.liLearningRuntime;});
    }
   });
  }catch{failed=true;stop();}
 }
 const observer=new MutationObserver(syncAccess);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 syncAccess();
}
attachExistingL09();
