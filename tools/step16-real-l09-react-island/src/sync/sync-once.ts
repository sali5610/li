import {RevisionConflict} from './contract.js';
import {NeonUserApi} from './neon-api.js';
import {PrivateDeviceStore} from './local-dexie.js';

/** Explicit privacy gate defaults CLOSED; cannot accidentally sync real notes. */
export type SyncGate={twoUserJwtRlsVerified:boolean;remoteConsentForPrivateState:boolean};
export type SyncReport={mode:'local-only'|'synced'|'offline'|'conflict';uploaded:number;downloaded:number;pending:number;conflicts:number};
export async function syncOnce(store:PrivateDeviceStore,api:NeonUserApi,accountId:string,
 gate:SyncGate={twoUserJwtRlsVerified:false,remoteConsentForPrivateState:false}):Promise<SyncReport>{
 if(!accountId.trim())throw new Error('ACCOUNT_REQUIRED');
 const initial=await store.counts(accountId);
 if(!gate.twoUserJwtRlsVerified||!gate.remoteConsentForPrivateState)
  return{mode:'local-only',uploaded:0,downloaded:0,...initial};
 let uploaded=0,downloaded=0,failed=false;
 for(const entry of await store.pending(accountId)){
  try{
   const remote=await api.write(entry);
   await store.accept(accountId,entry,remote);
   uploaded++;
  }catch(error){
   if(error instanceof RevisionConflict)await store.reject(accountId,entry);
   else {failed=true;break;} // preserve outbox on auth/network/Free quota failures
  }
 }
 if(!failed){
  try{
   for(const remote of await api.all()){
    await store.apply(accountId,remote);downloaded++;
   }
  }catch{failed=true;}
 }
 const counts=await store.counts(accountId);
 return{mode:counts.conflicts?'conflict':failed?'offline':'synced',
   uploaded,downloaded,...counts};
}
