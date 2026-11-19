import {RevisionConflict} from './contract.js';
import {NeonUserApi} from './neon-api.js';
import {PrivateDeviceStore} from './local-dexie.js';

/** Explicit privacy gate defaults CLOSED; never infer approval from a CI mock. */
export type SyncGate={twoUserJwtRlsVerified:boolean;remoteConsentForPrivateState:boolean};
export type SyncMode='local-only'|'synced'|'pending'|'offline'|'sign-in-required'|'conflict'|'security-error';
export type SyncReport={mode:SyncMode;uploaded:number;downloaded:number;pending:number;conflicts:number};

/** Avoid simultaneous writers for the same account and device DB, including repeated app-focus events. */
const inFlight=new WeakMap<PrivateDeviceStore,Map<string,Promise<SyncReport>>>();
function classify(error:unknown):'sign-in-required'|'security-error'|'offline'{
 const message=error instanceof Error?error.message:String(error);
 if(/^NEON_AUTH_|^NEON_DATA_API_HTTP_40[13]$/.test(message))return 'sign-in-required';
 if(/^REMOTE_OWNER_MISMATCH$|^NEON_ITEM_MISMATCH$|^INVALID_REMOTE_ROW$|^INVALID_PRIVATE_SCOPE$/.test(message))
   return 'security-error';
 return 'offline';
}
async function performSync(store:PrivateDeviceStore,api:NeonUserApi,accountId:string,gate:SyncGate):Promise<SyncReport>{
 const initial=await store.counts(accountId);
 if(!gate.twoUserJwtRlsVerified||!gate.remoteConsentForPrivateState)
  return{mode:'local-only',uploaded:0,downloaded:0,...initial};
 let uploaded=0,downloaded=0,failure:'sign-in-required'|'security-error'|'offline'|null=null;
 for(const entry of await store.pending(accountId)){
  try{
   const remote=await api.write(entry);
   await store.accept(accountId,entry,remote);
   uploaded++;
  }catch(error){
   if(error instanceof RevisionConflict)await store.reject(accountId,entry);
   else {failure=classify(error);break;} // retain every unconfirmed write on failure
  }
 }
 if(!failure){
  try{
   for(const remote of await api.all()){
    const applied=await store.apply(accountId,remote);
    if(applied)downloaded++;
   }
  }catch(error){failure=classify(error);}
 }
 const counts=await store.counts(accountId);
 const mode:SyncMode=failure==='security-error'?'security-error'
  :counts.conflicts?'conflict'
  :failure??(counts.pending?'pending':'synced');
 return{mode,uploaded,downloaded,...counts};
}
export function syncOnce(store:PrivateDeviceStore,api:NeonUserApi,accountId:string,
 gate:SyncGate={twoUserJwtRlsVerified:false,remoteConsentForPrivateState:false}):Promise<SyncReport>{
 if(!accountId.trim()||accountId!==api.accountId)throw new Error('ACCOUNT_BINDING_REQUIRED');
 let byUser=inFlight.get(store);
 if(!byUser){byUser=new Map();inFlight.set(store,byUser);}
 const existing=byUser.get(accountId);
 if(existing)return existing;
 const task=performSync(store,api,accountId,gate);
 byUser.set(accountId,task);
 const release=()=>{if(byUser?.get(accountId)===task)byUser.delete(accountId);};
 void task.then(release,release);
 return task;
}
