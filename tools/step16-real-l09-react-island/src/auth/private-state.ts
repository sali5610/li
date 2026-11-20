import {storageKey,type ItemType,type JsonValue} from '../sync/contract.js';
import {PrivateDeviceStore} from '../sync/local-dexie.js';
import type {NeonUserApi} from '../sync/neon-api.js';

/** One existing signed Dexie/Neon pipeline for ALL first-party personal state.
 * App shell, lesson drafts and auth tokens themselves are NOT mirrored.
 * The journal was explicitly local-only: EACH learner must opt into remote
 * storage of daily check-ins, wellness entries and journal activities.
 */
type Field={key:string;type:ItemType;id:string;diary?:true};
export const PERSONAL_FIELDS:readonly Field[]=[
 {key:'li.private.library.v1',type:'note',id:'library'},
 {key:'li.private.case-draft.v1',type:'note',id:'case-draft'},
 {key:'li.private.lesson.visits.v1',type:'l2_progress',id:'lesson-visits'},
 {key:'li.private.problem.visits.v1',type:'l2_progress',id:'problem-visits'},
 {key:'li.study-mode.v1',type:'preference',id:'study-mode'},
 {key:'li.buddy-address.v1',type:'preference',id:'buddy-address'},
 {key:'li.app.locale.v1',type:'preference',id:'locale'},
 {key:'li.spell.t02.due.v1',type:'review_schedule',id:'spell-t02-due'},
 {key:'li.personal.daily.v1',type:'note',id:'daily-journal',diary:true},
 {key:'li.personal.daily.enabled.v1',type:'preference',id:'daily-enabled',diary:true}
];
const CONSENT=(uid:string)=>'li.sync.journal-cloud-consent.v1:'+uid;
const BACKUP=(uid:string,key:string)=>'li.sync.local-backup.v1:'+uid+':'+key;
const SCHEMA='li.personal.storage.v1';
const fieldsFor=(uid:string):readonly Field[]=>[
 {key:CONSENT(uid),type:'preference',id:'journal-cloud-consent'},...PERSONAL_FIELDS
];
export type PersonalSnapshot={field:Field;raw:string|null};
const active=(uid:string,field:Field)=>!field.diary||journalCloudConsent(uid);
export function journalCloudConsent(uid:string):boolean{
 return Boolean(uid)&&localStorage.getItem(CONSENT(uid))==='true';
}
export function setJournalCloudConsent(uid:string,enabled:boolean){
 if(!uid.trim())throw new Error('ACCOUNT_REQUIRED');
 const key=CONSENT(uid),value=enabled?'true':'false';
 localStorage.setItem(key,value);
 if(localStorage.getItem(key)!==value)throw new Error('CONSENT_NOT_PERSISTED');
 window.dispatchEvent(new Event('li:private-sync-consent'));
}
/** Switching accounts never reveals previous account's private settings,
 * notes, diary or saved items; original local work survives in account backup.
 */
export function preparePersonalAccount(previous:string|null,uid:string){
 if(!previous||previous===uid)return;
 for(const field of PERSONAL_FIELDS){
  const raw=localStorage.getItem(field.key);
  if(raw!==null)localStorage.setItem(BACKUP(previous,field.key),raw);
 }
 for(const field of PERSONAL_FIELDS){
  const own=localStorage.getItem(BACKUP(uid,field.key));
  if(own===null)localStorage.removeItem(field.key);
  else localStorage.setItem(field.key,own);
 }
}
function unpack(payload:unknown,key:string):string{
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('PRIVATE_PAYLOAD_INVALID');
 const value=payload as Record<string,unknown>;
 if(value.schema!==SCHEMA||value.storageKey!==key||typeof value.raw!=='string')
  throw Error('PRIVATE_PAYLOAD_INVALID');
 return value.raw;
}
function wrap(field:Field,raw:string):JsonValue{
 if(raw.length>300000)throw Error('PRIVATE_STATE_TOO_LARGE');
 // Validate structured stores before replicating; preserve exact JSON strings.
 if(field.key!=='li.private.case-draft.v1'&&field.key!=='li.study-mode.v1'&&
   field.key!=='li.app.locale.v1'&&field.key!=='li.personal.daily.enabled.v1'&&
   field.id!=='journal-cloud-consent'){
  JSON.parse(raw);
 }
 return {schema:SCHEMA,storageKey:field.key,raw};
}
/** Decode only supported account-scoped personal records; no arbitrary browser key. */
export function personalRemoteSnapshot(uid:string,type:ItemType,id:string,payload:unknown):
 {key:string;raw:string}|null{
 const field=fieldsFor(uid).find(x=>x.type===type&&x.id===id);
 if(!field)return null;
 return {key:field.key,raw:unpack(payload,field.key)};
}
export function hasPersonalLocalChanges(uid:string,seen:Map<string,string|null>):boolean{
 return fieldsFor(uid).some(field=>active(uid,field)&&
  localStorage.getItem(field.key)!==(seen.get(field.key)??null));
}
export async function capturePersonalState(uid:string,api:NeonUserApi|null,
 store:PrivateDeviceStore,seen:Map<string,string|null>):Promise<PersonalSnapshot[]>{
 const snapshots:PersonalSnapshot[]=[];
 for(const field of fieldsFor(uid)){
  if(!active(uid,field))continue;
  const raw=localStorage.getItem(field.key);
  snapshots.push({field,raw});
  const firstObservation=!seen.has(field.key);
  const previous=seen.get(field.key)??null;
  seen.set(field.key,raw);
  const key=storageKey(uid,field.type,field.id);
  let current=await store.records.get(key);
  // Missing on the FIRST observation means a fresh device may need hydration.
  // Missing AFTER previously observing a saved value is an explicit removal:
  // queue a tombstone, never resurrect the deleted note from the cloud.
  if(raw===null){
   if(!firstObservation&&previous!==null&&current&&!current.deletedAt)
    await store.edit(uid,field.type,field.id,wrap(field,''),new Date().toISOString());
   continue;
  }
  // The app defaults diary recording ON on a fresh device before Auth runs.
  // The signed account's already-downloaded preference takes precedence; if
  // real local diary work differs, retain BOTH versions as an explicit conflict.
  if(field.diary&&firstObservation&&current&&!current.deletedAt&&
     current.baseRevision>0&&!(await store.outbox.get(key))){
   const cloudRaw=unpack(current.payload,field.key);
   if(cloudRaw!==raw){
    const untouchedDefault=field.key==='li.personal.daily.enabled.v1'&&
     raw==='true'&&localStorage.getItem('li.personal.daily.v1')===null;
    if(untouchedDefault)continue; // hydrate signed preference, no spurious PUT
    await store.edit(uid,field.type,field.id,wrap(field,raw));
    const op=await store.outbox.get(key);
    if(op)await store.reject(uid,op); // no silent overwrite of real journal
    continue;
   }
  }
  if(!current&&api){
   try{
    const remote=await api.one(field.type,field.id);
    if(remote&&!remote.deleted_at){
     const remoteRaw=unpack(remote.payload,field.key);
     // Fresh installs of diary auto-create local 'enabled=true' before login.
     // Such a default must NEVER override the real cloud preference.
     const autoDefault=field.key==='li.personal.daily.enabled.v1'&&raw==='true'&&
      localStorage.getItem('li.personal.daily.v1')===null;
     if(remoteRaw===raw||autoDefault){
      await store.apply(uid,remote);
      current=await store.records.get(key);
      if(autoDefault)continue;
     }
    }
   }catch{/* Keep local draft; revision conflict prevents blind overwrite. */}
  }
  if(!current||current.deletedAt||unpack(current.payload,field.key)!==raw)
   await store.edit(uid,field.type,field.id,wrap(field,raw));
 }
 return snapshots;
}
export async function hydratePersonalState(uid:string,snapshots:PersonalSnapshot[],
 store:PrivateDeviceStore,retry:()=>void,onHydrated?:(key:string)=>void):Promise<boolean>{
 let changed=false;
 for(const {field,raw} of snapshots){
  if(!active(uid,field))continue;
  const key=storageKey(uid,field.type,field.id);
  if(await store.outbox.get(key))continue;
  const saved=await store.records.get(key);
  if(!saved)continue;
  const current=localStorage.getItem(field.key);
  if(current!==raw){retry();continue;}
  if(saved.deletedAt){
   if(current!==null){localStorage.removeItem(field.key);changed=true;onHydrated?.(field.key);}
   continue;
  }
  const data=unpack(saved.payload,field.key);
  if(current!==data){localStorage.setItem(field.key,data);changed=true;onHydrated?.(field.key);}
 }
 return changed;
}
