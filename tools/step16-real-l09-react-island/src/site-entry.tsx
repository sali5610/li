/**
 * Step16.2 native shell adapter. DEV-ONLY mount, no cloud/auth/real learner key.
 * Production native L09 remains intact and authoritative.
 */
import React,{useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import './pilot.css';
import './ui/shared.css';
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
   // Extra opt-in only inside the research L09 React island. Do not change native default.
   const params=new URLSearchParams(window.location.search);
   const vcG2=params.get('li-react')==='l09'&&params.get('li-vc-g2')==='1';
   return <Pilot visualContractPilot={vcG2}/>;
  }
  root.render(<Ready/>);
 });
}

// Only the explicit localhost fixture may exercise snapshot/rollback.
/**
 * Opt-in native Settings account card. Dynamic import prevents the Auth SDK
 * from loading with the lesson island unless Settings is explicitly requested.
 */
export async function mountSettingsAccount(host:HTMLElement):Promise<()=>void>{
 if(!host.isConnected)throw Error('LI_SETTINGS_HOST_DISCONNECTED');
 const {SettingsAccount}=await import('./auth/SettingsAccount.js');
 const root=createRoot(host);
 return new Promise((resolve,reject)=>{
  let done=false;
  const timeout=window.setTimeout(()=>{
   if(done)return;
   done=true;root.unmount();reject(Error('LI_SETTINGS_MOUNT_TIMEOUT'));
  },6000);
  function Ready(){
   useEffect(()=>{
    if(!done){done=true;window.clearTimeout(timeout);resolve(()=>root.unmount());}
    return()=>window.clearTimeout(timeout);
   },[]);
   return <SettingsAccount/>;
  }
  root.render(<Ready/>);
 });
}

export {captureFixtureSnapshot,rollbackFixtureSnapshot} from './learning/fixture-handover';
