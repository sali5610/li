import Dexie,{type Table} from 'dexie';
import {checkScope,storageKey} from './contract.js';
import type {PrivateItem,Edit,ItemType,JsonValue} from './contract.js';

export type LocalRecord={key:string;accountId:string;itemType:ItemType;itemId:string;
 payload:JsonValue;deletedAt:string|null;baseRevision:number;changedAt:string;conflict:boolean};
export type OutboxEntry=Edit&{key:string;accountId:string;conflict:boolean;
 basePayload?:JsonValue|null};

export class PrivateDeviceStore extends Dexie{
 records!:Table<LocalRecord,string>;
 outbox!:Table<OutboxEntry,string>;
 constructor(dbName='li-step16-private-device-v1'){
  // QA's explicitly named IndexedDB is isolated from personal app records.
  // Product callers preserve the existing default name and behavior.
  super(dbName);
  this.version(1).stores({
   records:'key,accountId,[accountId+itemType+itemId]',
   outbox:'key,accountId,[accountId+conflict]'
  });
 }
 /** One IndexedDB transaction commits local data AND its durable upload intent. */
 async edit(accountId:string,itemType:ItemType,itemId:string,payload:JsonValue,deletedAt:string|null=null){
  checkScope(accountId,itemType,itemId);
  const key=storageKey(accountId,itemType,itemId);
  await this.transaction('rw',this.records,this.outbox,async()=>{
   const old=await this.records.get(key);
   const previous=await this.outbox.get(key);
   const baseRevision=old?.baseRevision??0;
   // Preserve the last CONFIRMED payload across repeated offline edits. This
   // baseline distinguishes deletions from unrelated remote additions.
   const basePayload=previous?previous.basePayload??null:
    old&&old.baseRevision>0?old.payload:null;
   const changedAt=new Date().toISOString();
   await this.records.put({key,accountId,itemType,itemId,payload,deletedAt,baseRevision,changedAt,conflict:false});
   await this.outbox.put({key,accountId,itemType,itemId,payload,deletedAt,baseRevision,
      opId:crypto.randomUUID(),conflict:false,basePayload});
  });
 }
 async pending(accountId:string){
  return (await this.outbox.where('accountId').equals(accountId).toArray())
    .filter(x=>!x.conflict).slice(0,20);
 }
 async counts(accountId:string){
  const rows=await this.outbox.where('accountId').equals(accountId).toArray();
  return{pending:rows.filter(x=>!x.conflict).length,conflicts:rows.filter(x=>x.conflict).length};
 }
 async accept(accountId:string,op:OutboxEntry,remote:PrivateItem){
  if(remote.owner_id!==accountId)throw new Error('REMOTE_OWNER_MISMATCH');
  if(remote.item_type!==op.itemType||remote.item_id!==op.itemId)throw new Error('REMOTE_ITEM_MISMATCH');
  await this.transaction('rw',this.records,this.outbox,async()=>{
   const current=await this.outbox.get(op.key);
   const record=await this.records.get(op.key);
   if(!current||current.accountId!==accountId||!record||record.accountId!==accountId)return;
   if(current.opId===op.opId){
    await this.records.update(op.key,{baseRevision:remote.revision,
     payload:remote.payload,changedAt:remote.changed_at});
    await this.outbox.delete(op.key);
   }else{
    // A new local edit arrived while an earlier operation was in flight.
    // Acknowledge its base revision without clobbering its newer payload.
    await this.records.update(op.key,{baseRevision:remote.revision});
    await this.outbox.update(op.key,{baseRevision:remote.revision});
   }
  });
 }
 async reject(accountId:string,op:OutboxEntry){
  await this.transaction('rw',this.records,this.outbox,async()=>{
   const current=await this.outbox.get(op.key);
   if(current?.accountId===accountId&&current.opId===op.opId){
    await this.outbox.update(op.key,{conflict:true});
    await this.records.update(op.key,{conflict:true});
   }
  });
 }
 /**
  * Rebase a safely merged local collection over the latest signed revision.
  * Records and durable outbox change together, never by separate writes.
  * An intervening remote revision triggers another CAS conflict, not overwrite.
  */
 async rebaseConflict(accountId:string,op:OutboxEntry,latest:PrivateItem,payload:JsonValue){
  checkScope(accountId,op.itemType,op.itemId);
  if(op.accountId!==accountId||latest.owner_id!==accountId||
   latest.item_type!==op.itemType||latest.item_id!==op.itemId||
   latest.deleted_at!==null||!Number.isSafeInteger(latest.revision)||latest.revision<1)
   throw Error('CONFLICT_OWNER_OR_ITEM_MISMATCH');
  await this.transaction('rw',this.records,this.outbox,async()=>{
   const pending=await this.outbox.get(op.key);
   const row=await this.records.get(op.key);
   if(!pending||!row||pending.accountId!==accountId||row.accountId!==accountId||
    pending.opId!==op.opId||!pending.conflict||!row.conflict)
    throw Error('CONFLICT_CHANGED_REFRESH_REQUIRED');
   const now=new Date().toISOString();
   await this.records.put({...row,payload,baseRevision:latest.revision,
    deletedAt:null,changedAt:now,conflict:false});
   await this.outbox.put({...pending,payload,deletedAt:null,
    baseRevision:latest.revision,basePayload:latest.payload,
    opId:crypto.randomUUID(),conflict:false});
  });
 }
 /** Remote must never overwrite a locally pending edit or a newer local revision. */
 async apply(accountId:string,remote:PrivateItem){
  checkScope(accountId,remote.item_type,remote.item_id);
  if(remote.owner_id!==accountId)throw new Error('REMOTE_OWNER_MISMATCH');
  const key=storageKey(accountId,remote.item_type,remote.item_id);
  return this.transaction('rw',this.records,this.outbox,async()=>{
   if(await this.outbox.get(key))return false;
   const current=await this.records.get(key);
   if(current&&current.baseRevision>=remote.revision)return false;
   await this.records.put({key,accountId,itemType:remote.item_type,itemId:remote.item_id,
     payload:remote.payload,deletedAt:remote.deleted_at,baseRevision:remote.revision,
     changedAt:remote.changed_at,conflict:false});
   return true;
  });
 }
 /**
  * Resolve a real same-item conflict ONLY after the learner chooses which revision
  * to keep. The caller must fetch the latest RLS-scoped remote snapshot.
  * No silent last-write-wins and no loss of an unconfirmed newer edit.
  */
 async resolveConflict(accountId:string,op:OutboxEntry,latest:PrivateItem,
  decision:'keep-local'|'use-remote'){
  checkScope(accountId,op.itemType,op.itemId);
  if(op.accountId!==accountId||latest.owner_id!==accountId||
      latest.item_type!==op.itemType||latest.item_id!==op.itemId)
   throw new Error('CONFLICT_OWNER_OR_ITEM_MISMATCH');
  if(!Number.isSafeInteger(latest.revision)||latest.revision<1)
   throw new Error('INVALID_REMOTE_REVISION');
  return this.transaction('rw',this.records,this.outbox,async()=>{
   const current=await this.outbox.get(op.key);
   const row=await this.records.get(op.key);
   if(!current||!row||!current.conflict||!row.conflict||
      current.opId!==op.opId||current.accountId!==accountId||
      row.accountId!==accountId)
    throw new Error('CONFLICT_CHANGED_REFRESH_REQUIRED');
   if(decision==='use-remote'){
    await this.records.put({key:op.key,accountId,itemType:latest.item_type,itemId:latest.item_id,
      payload:latest.payload,deletedAt:latest.deleted_at,baseRevision:latest.revision,
      changedAt:latest.changed_at,conflict:false});
    await this.outbox.delete(op.key);
    return 'remote-accepted' as const;
   }
   if(decision==='keep-local'){
    const newOpId=crypto.randomUUID();
    await this.records.update(op.key,{baseRevision:latest.revision,conflict:false});
    await this.outbox.update(op.key,{baseRevision:latest.revision,opId:newOpId,conflict:false});
    return 'local-requeued' as const;
   }
   throw new Error('INVALID_CONFLICT_DECISION');
  });
 }
 async accountRecords(accountId:string){
  if(!accountId.trim())throw new Error('ACCOUNT_REQUIRED');
  return this.records.where('accountId').equals(accountId).toArray();
 }
}
