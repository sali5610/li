import React from 'react';
import {createRoot} from 'react-dom/client';
import {LearningJourney} from './LearningJourney';
import {Wave1Journey} from './Wave1Journey';
import type {LearningPorts} from './ports';
import '../../../../design-system/react/atoms.css';
import '../../../../design-system/react/controls.css';
import '../../../../design-system/react/components.css';
import '../../../../design-system/react/molecules.css';
import '../../../../design-system/react/focus.css';

/** Mount into Chat 1's existing lesson route (not a second app).
 * Chat 3 must supply the real invited-user/Neon/Dexie persistence owner.
 * Chat 4 must supply real search. No fallback to fake accounts or progress.
 */
export function mountLearningJourney(host:HTMLElement,ports:LearningPorts):()=>void{
 if(!host?.isConnected)throw Error('LEARNING_HOST_DISCONNECTED');
 if(!ports?.auth?.requireInvitedLearner||!ports?.attempts?.load||
    !ports?.attempts?.save||!ports?.sync?.getStatus||
    !ports?.navigation?.openCatalog||!ports?.search?.openSearch){
  throw Error('LEARNING_REAL_PORTS_REQUIRED');
 }
 const root=createRoot(host);
 root.render(<LearningJourney ports={ports}/>);
 return ()=>root.unmount();
}


/** Real React L03/L15 routes share the invited L09 attempt/save/sync ports. */
export function mountWave1Journey(host:HTMLElement,
 id:'L03-1-2'|'L15-2-2',ports:LearningPorts):()=>void{
 if(!host?.isConnected||!ports?.auth?.requireInvitedLearner||
  !ports?.attempts?.load||!ports?.attempts?.save||!ports?.sync?.getStatus)
  throw Error('WAVE1_REAL_PORTS_REQUIRED');
 const root=createRoot(host);
 root.render(<Wave1Journey id={id} ports={ports}/>);
 return()=>root.unmount();
}
