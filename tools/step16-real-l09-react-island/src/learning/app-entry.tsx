import React from 'react';
import {createRoot} from 'react-dom/client';
import {LearningJourney} from './LearningJourney';
import type {LearningPorts} from './ports';
import atomsCSS from '../../../../design-system/react/atoms.css?inline';
import controlsCSS from '../../../../design-system/react/controls.css?inline';
import componentsCSS from '../../../../design-system/react/components.css?inline';
import journeyCSS from './journey.css?inline';

/** Mount into Chat 1's existing lesson route (not a second app).
 * Chat 3 must supply the real invited-user/Neon/Dexie persistence owner.
 * Chat 4 must supply real search. No fallback to fake accounts or progress.
 */
export function mountLearningJourney(host:HTMLElement,ports:LearningPorts,
 handlers:{onReady?:()=>void;onFailure?:()=>void}={}):()=>void{
 if(!host?.isConnected)throw Error('LEARNING_HOST_DISCONNECTED');
 if(!ports?.auth?.requireInvitedLearner||!ports?.attempts?.load||
    !ports?.attempts?.save||!ports?.sync?.getStatus||
    !ports?.navigation?.openCatalog||!ports?.search?.openSearch){
  throw Error('LEARNING_REAL_PORTS_REQUIRED');
 }
 // The existing Pages publisher ships JS only. Embed CSS authored by the SAME
 // canonical components; no duplicated CSS file or publication-pipeline edit.
 if(!document.getElementById('li-learning-canonical-style')){
  const style=document.createElement('style');
  style.id='li-learning-canonical-style';
  style.textContent=[atomsCSS,controlsCSS,componentsCSS,journeyCSS].join('\\n');
  document.head.appendChild(style);
 }
 const root=createRoot(host);
 root.render(<LearningJourney ports={ports} {...handlers}/>);
 return ()=>root.unmount();
}
