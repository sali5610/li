import React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthPanel} from './AuthPanel.js';
import {mountLearningJourney} from '../learning/app-entry.js';
import {createStagingLearningPorts} from '../learning/staging-ports.js';

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
 let failed=false;
 const ports=createStagingLearningPorts();
 const restore=()=>{
  if(dispose){dispose();dispose=null;}
  host?.remove();host=null;
  legacy.hidden=false;legacy.style.removeProperty('display');
  page.setAttribute('aria-labelledby','l09-title');
 };
 const update=()=>{
  const allowed=document.documentElement.classList.contains('li-auth-verified');
  const active=page.classList.contains('active');
  if(!allowed||!active){restore();failed=false;return;}
  if(dispose||failed)return;
  const node=document.createElement('div');
  node.id='li-react-l09-host';node.className='section-shell';
  // Preserve the native lesson until session AND persisted attempt both pass.
  node.hidden=true;page.append(node);host=node;
  try{
   dispose=mountLearningJourney(node,ports,{
    onReady(){
     if(host!==node||!document.documentElement.classList.contains('li-auth-verified')||
        !page.classList.contains('active'))return;
     legacy.hidden=true;legacy.style.display='none';
     node.hidden=false;
     page.setAttribute('aria-labelledby','li-react-l09-title');
    },
    onFailure(){
     failed=true;
     // The existing native lesson remains available; never show fake guest data.
     queueMicrotask(()=>{if(host===node)restore();});
    }
   });
  }catch{failed=true;restore();}
 };
 const observer=new MutationObserver(update);
 observer.observe(page,{attributes:true,attributeFilter:['class']});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enableIntegratedL09,{once:true});
else enableIntegratedL09();
