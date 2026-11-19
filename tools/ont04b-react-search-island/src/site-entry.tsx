/**
 * ONT-04B2a — local-only opt-in native screen bridge.
 * No shipped route. The existing native search remains the full fallback.
 */
import React,{useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {SearchIsland} from './SearchIsland';
import './styles.css';

export const FLAG='typed-v1';
export function isLocalSearchCandidate(loc:Pick<Location,'protocol'|'hostname'|'pathname'|'search'>):boolean{
 const flag=new URLSearchParams(loc.search).get('li-search-react');
 return loc.protocol==='http:'&&
  (loc.hostname==='localhost'||loc.hostname==='127.0.0.1')&&
  loc.pathname==='/site/index.html'&&flag===FLAG;
}
type MountOptions={location?:Pick<Location,'protocol'|'hostname'|'pathname'|'search'>;timeoutMs?:number};
/**
 * Resolves only after the React tree mounted. On failure, native controls remain
 * visible and unchanged. On successful mount, native page back is retained.
 * Disposer restores the exact original hidden states.
 */
export function mountTypedSearch(host:HTMLElement,options:MountOptions={}):Promise<()=>void>{
 const loc=options.location??window.location;
 if(!isLocalSearchCandidate(loc))return Promise.reject(Error('SEARCH_CANDIDATE_ORIGIN_DENIED'));
 const parent=host.parentElement;
 if(!parent||parent.id!=='li-search-shell'||!parent.closest('#page-search'))return Promise.reject(Error('SEARCH_HOST_INVALID'));
 if(!host.isConnected||host.dataset.liSearchMount)return Promise.reject(Error('SEARCH_HOST_ALREADY_MOUNTED_OR_DISCONNECTED'));
 const siblingNodes=Array.from(parent.children).filter((el):el is HTMLElement=>el instanceof HTMLElement&&el!==host&&!el.matches('.utility-back'));
 const originals=siblingNodes.map(el=>({node:el,hidden:el.hidden}));
 const root=createRoot(host);
 let settled=false,closed=false;
 host.dataset.liSearchMount='pending';
 host.hidden=true;
 return new Promise((resolve,reject)=>{
  const timeout=window.setTimeout(()=>{
   if(settled)return;
   settled=true;closed=true;root.unmount();host.hidden=true;delete host.dataset.liSearchMount;
   reject(Error('SEARCH_CANDIDATE_MOUNT_TIMEOUT'));
  },options.timeoutMs??6000);
  function unmount(){
   if(closed)return;closed=true;root.unmount();
   for(const prev of originals)prev.node.hidden=prev.hidden;
   host.hidden=true;delete host.dataset.liSearchMount;
   window.removeEventListener('pagehide',unmount);
  }
  function Ready(){
   useEffect(()=>{
    if(!settled&&host.isConnected){
     settled=true;window.clearTimeout(timeout);
     for(const item of originals)item.node.hidden=true;
     host.hidden=false;host.dataset.liSearchMount='active';
     window.addEventListener('pagehide',unmount,{once:true});
     resolve(unmount);
    }
    return()=>{window.clearTimeout(timeout);};
   },[]);
   return <SearchIsland embedded/>;
  }
  try{root.render(<Ready/>);}catch(e){
   window.clearTimeout(timeout);settled=true;unmount();reject(e);
  }
 });
}
