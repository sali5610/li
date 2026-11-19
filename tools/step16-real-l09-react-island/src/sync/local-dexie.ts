import Dexie,{type Table} from 'dexie';
import {checkScope,storageKey} from './contract.js';
import type {PrivateItem,Edit,ItemType,JsonValue} from './contract.js';

export type LocalRecord={key:string;accountId:string;itemType:ItemType;itemId:string;
 payload:JsonValue;deletedAt:string|null;baseRevision:number;changedAt:string;conflict:boolean};
export type OutboxEntry=Edit&{key:string;accountId:string;conflict:boolean};

export class PrivateDeviceStore extends Dexie{
 records!:Table<LocalRecord,string>;
 outbox!:Table<OutboxEntry,string>;
 constructor(){
  super('li-step16-private-device-v1');
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
   const baseRevision=old?.baseRevision??0;
   const changedAt=new Date().toISOString();
   await this.records.put({key,accountId,itemType,itemId,payload,deletedAt,baseRevision,changedAt,conflict:false});
   await this.outbox.put({key,accountId,itemType,itemId,payload,deletedAt,baseRevision,
      opId:crypto.randomUUID(),conflict:false});
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
  if(remote.item_type!==op.itemType||remote.item_id!==op.itemId)throw new Error('REMOTE_ITEM_MISMATCH');
  await this.transaction('rw',this.records,this.outbox,async()=>{
   const current=await this.outbox.get(op.key);
   const record=await this.records.get(op.key);
   if(!current||current.accountId!==accountId||!record||record.accountId!==accountId)return;
   await this.records.update(op.key,{baseRevision:remote.revision});
   if(current.opId===op.opId)await this.outbox.delete(op.key);
   else await this.outbox.update(op.key,{baseRevision:remote.revision});
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
 /** Remote must never overwrite a locally pending edit or a newer local revision. */
 async apply(accountId:string,remote:PrivateItem){
  checkScope(accountId,remote.item_type,remote.item_id);
  const key=storageKey(accountId,remote.item_type,remote.item_id);
  await this.transaction('rw',this.records,this.outbox,async()=>{
   if(await this.outbox.get(key))return;
   const current=await this.records.get(key);
   if(current&&current.baseRevision>remote.revision)return;
   await this.records.put({key,accountId,itemType:remote.item_type,itemId:remote.item_id,
     payload:remote.payload,deletedAt:remote.deleted_at,baseRevision:remote.revision,
     changedAt:remote.changed_at,conflict:false});
  });
 }
 async accountRecords(accountId:string){
  if(!accountId.trim())throw new Error('ACCOUNT_REQUIRED');
  return this.records.where('accountId').equals(accountId).toArray();
 }
}
