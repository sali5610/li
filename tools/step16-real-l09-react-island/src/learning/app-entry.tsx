import React from 'react';
import {createRoot} from 'react-dom/client';
import {LearningJourney} from './LearningJourney';
import type {LearningPorts} from './ports';
import '../../../../design-system/react/atoms.css';
import '../../../../design-system/react/controls.css';
import '../../../../design-system/react/components.css';

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
 const root=createRoot(host);
 root.render(<LearningJourney ports={ports} {...handlers}/>);
 return ()=>root.unmount();
}
