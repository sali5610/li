/**
 * Step16.2 native shell adapter. DEV-ONLY mount, no cloud/auth/real learner key.
 * Production native L09 remains intact and authoritative.
 */
import React,{useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import './pilot.css';
import {Pilot} from './Pilot';

export function mountL09(host:HTMLElement):Promise<()=>void>{
 if(!host.isConnected) return Promise.reject(Error('L09_HOST_DISCONNECTED'));
 const root=createRoot(host);
 return new Promise((resolve,reject)=>{
  let completed=false;
  const timeout=window.setTimeout(()=>{
   if(completed)return;
   completed=true;root.unmount();reject(Error('L09_REACT_MOUNT_TIMEOUT'));
  },6000);
  function Ready(){
   useEffect(()=>{
    if(!completed){completed=true;window.clearTimeout(timeout);resolve(()=>root.unmount());}
    return()=>window.clearTimeout(timeout);
   },[]);
   return <Pilot/>;
  }
  root.render(<Ready/>);
 });
}
