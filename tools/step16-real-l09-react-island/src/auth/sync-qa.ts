import type {Edit,PrivateItem,JsonValue} from '../sync/contract.js';
import {storageKey} from '../sync/contract.js';
import type {PrivateDeviceStore} from '../sync/local-dexie.js';
import {syncOnce,type SyncUserApi} from '../sync/sync-once.js';

/**
 * STAGING ONLY: an isolated synthetic record, never the personal app's dataset.
 * No auto-run, no generic all() across learner records, no real note content.
 */
export const SYNC_QA_PREFIX='__li_sync_qa_';
export const SYNC_QA_DB='li-step16-sync-qa-device-v1';
export const SYNC_QA_STORE='li-step16-sync-qa-ui-v1';
export type QaStage='seed'|'b-update'|'a-offline';
export type QaPayload={qa_run:true;run:string;stage:QaStage};
export type QaOne={accountId:string;one:(type:'preference',id:string)=>Promise<PrivateItem|null>;
 write:(edit:Edit)=>Promise<PrivateItem>};

export function validateSyncQaId(value:unknown):value is string{
 return typeof value==='string'&&new RegExp('^'+SYNC_QA_PREFIX+'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$','i').test(value);
}
export function newSyncQaId(){return SYNC_QA_PREFIX+crypto.randomUUID();}
function guard(id:string){if(!validateSyncQaId(id))throw Error('SQA-INVALID-ID');}
function expectOk(ok:boolean,code:string){if(!ok)throw Error(code);}
function payload(id:string,stage:QaStage):QaPayload{return{qa_run:true,run:id,stage};}
export function verifyQaRecord(row:PrivateItem|null,accountId:string,id:string,stage?:QaStage){
 guard(id);
 expectOk(Boolean(row)&&row?.owner_id===accountId&&row.item_type==='preference'&&row.item_id===id,'SQA-OWNER-OR-ID');
 const p=row?.payload;
 expectOk(Boolean(p)&&typeof p==='object'&&!Array.isArray(p)&&
  (p as Record<string,unknown>).qa_run===true&&(p as Record<string,unknown>).run===id,'SQA-NOT-SYNTHETIC');
 if(stage)expectOk((p as Record<string,unknown>).stage===stage,'SQA-STAGE-MISMATCH');
 return row!;
}
/** Narrow ANY sync call to a single synthetic ID and one current account. */
export function scopedSyncApi(api:QaOne,id:string):SyncUserApi{
 guard(id);
 return{
  accountId:api.accountId,
  async write(edit:Edit){
   expectOk(edit.itemType==='preference'&&edit.itemId===id&&
    typeof edit.payload==='object'&&edit.payload!==null&&!Array.isArray(edit.payload)&&
    (edit.payload as Record<string,unknown>).qa_run===true&&
    (edit.payload as Record<string,unknown>).run===id,'SQA-WRITE-SCOPE');
   return verifyQaRecord(await api.write(edit),api.accountId,id);
  },
  async all(){
   const row=await api.one('preference',id);
   return row?[verifyQaRecord(row,api.accountId,id)]:[];
  }
 };
}
const enabled={twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true} as const;
export async function seedDeviceA(store:PrivateDeviceStore,api:QaOne,id:string){
 guard(id);
 const prior=await api.one('preference',id);
 expectOk(prior===null,'SQA-ID-ALREADY-USED');
 await store.edit(api.accountId,'preference',id,payload(id,'seed') as JsonValue);
 const isolated=scopedSyncApi(api,id);
 const before=await syncOnce(store,isolated,api.accountId); // gate MUST be closed
 expectOk(before.mode==='local-only'&&before.pending===1&&before.uploaded===0,'SQA-GATE-NOT-CLOSED');
 const pushed=await syncOnce(store,isolated,api.accountId,enabled);
 expectOk(pushed.mode==='synced'&&pushed.pending===0&&pushed.uploaded===1,'SQA-A-UPLOAD-FAILED');
 verifyQaRecord(await api.one('preference',id),api.accountId,id,'seed');
 await store.edit(api.accountId,'preference',id,payload(id,'a-offline') as JsonValue);
 const pending=await store.pending(api.accountId);
 expectOk(pending.length===1&&pending[0].itemId===id&&pending[0].baseRevision===1,
  'SQA-OFFLINE-QUEUE-FAILED');
 return {mode:'a-seeded' as const,pending:1};
}
export async function deviceBRestoreAndEdit(store:PrivateDeviceStore,api:QaOne,id:string){
 guard(id);
 const remote=verifyQaRecord(await api.one('preference',id),api.accountId,id,'seed');
 expectOk(remote.revision===1,'SQA-EXPECTED-REV1');
 const applied=await store.apply(api.accountId,remote);
 expectOk(applied,'SQA-B-NOT-FRESH-STORAGE');
 const [cached]=await store.accountRecords(api.accountId);
 expectOk(cached?.itemId===id&&cached.baseRevision===1,'SQA-B-RESTORE-FAILED');
 await store.edit(api.accountId,'preference',id,payload(id,'b-update') as JsonValue);
 const report=await syncOnce(store,scopedSyncApi(api,id),api.accountId,enabled);
 expectOk(report.mode==='synced'&&report.pending===0&&report.uploaded===1,'SQA-B-UPLOAD-FAILED');
 const after=verifyQaRecord(await api.one('preference',id),api.accountId,id,'b-update');
 expectOk(after.revision===2,'SQA-EXPECTED-REV2');
 return {mode:'b-updated' as const,revision:2};
}
export async function deviceAConflictAndResolve(store:PrivateDeviceStore,api:QaOne,id:string){
 guard(id);
 const pending=await store.pending(api.accountId);
 expectOk(pending.length===1&&pending[0].itemId===id,'SQA-A-OFFLINE-LOST');
 const first=await syncOnce(store,scopedSyncApi(api,id),api.accountId,enabled);
 expectOk(first.mode==='conflict'&&first.conflicts===1,'SQA-CONFLICT-NOT-RAISED');
 const latest=verifyQaRecord(await api.one('preference',id),api.accountId,id,'b-update');
 expectOk(latest.revision===2,'SQA-B-REVISION-NOT-FOUND');
 const op=await store.outbox.get(storageKey(api.accountId,'preference',id));
 expectOk(Boolean(op)&&op!.conflict,'SQA-LOCAL-EDIT-LOST');
 const local=await store.records.get(storageKey(api.accountId,'preference',id));
 expectOk(Boolean(local)&&typeof local?.payload==='object'&&
  (local.payload as Record<string,unknown>).stage==='a-offline','SQA-LOCAL-CONTENT-LOST');
 await store.resolveConflict(api.accountId,op!,latest,'keep-local'); // preset test-only resolution
 const pushed=await syncOnce(store,scopedSyncApi(api,id),api.accountId,enabled);
 expectOk(pushed.mode==='synced'&&pushed.pending===0&&pushed.uploaded===1,
  'SQA-CONFLICT-RETRY-FAILED');
 const final=verifyQaRecord(await api.one('preference',id),api.accountId,id,'a-offline');
 expectOk(final.revision===3,'SQA-EXPECTED-REV3');
 return {mode:'a-resolved' as const,revision:3};
}
export async function deviceBVerify(store:PrivateDeviceStore,api:QaOne,id:string){
 guard(id);
 const remote=verifyQaRecord(await api.one('preference',id),api.accountId,id,'a-offline');
 expectOk(remote.revision===3,'SQA-B-FINAL-NOT-V3');
 const applied=await store.apply(api.accountId,remote);
 expectOk(applied,'SQA-B-FINAL-NOT-DOWNLOADED');
 const cached=await store.records.get(storageKey(api.accountId,'preference',id));
 expectOk(Boolean(cached)&&cached?.baseRevision===3&&typeof cached?.payload==='object'&&
  (cached.payload as Record<string,unknown>).stage==='a-offline',
  'SQA-B-RESTORE-NOT-PERSISTED');
 return {mode:'b-verified' as const};
}
export async function dropLocalQa(store:PrivateDeviceStore,accountId:string,id:string){
 guard(id);
 const key=storageKey(accountId,'preference',id);
 // QA uses its own Dexie database; never delete generic learner records.
 await store.transaction('rw',store.records,store.outbox,async()=>{
  const row=await store.records.get(key);
  const out=await store.outbox.get(key);
  if(row&&(!row.payload||typeof row.payload!=='object'||Array.isArray(row.payload)||
    (row.payload as Record<string,unknown>).qa_run!==true||
    (row.payload as Record<string,unknown>).run!==id))throw Error('SQA-LOCAL-NOT-SYNTHETIC');
  if(out&&(!out.payload||typeof out.payload!=='object'||Array.isArray(out.payload)||
    (out.payload as Record<string,unknown>).qa_run!==true||
    (out.payload as Record<string,unknown>).run!==id))throw Error('SQA-OUTBOX-NOT-SYNTHETIC');
  await store.records.delete(key);
  await store.outbox.delete(key);
 });
 expectOk(!await store.records.get(key)&&!await store.outbox.get(key),'SQA-LOCAL-CLEANUP-FAILED');
}
export function safeSyncQaError(error:unknown){
 const message=error instanceof Error?error.message:'';
 return /^SQA-[A-Z0-9-]+$/.test(message)?message:'SQA-REQUEST-OR-SESSION';
}
