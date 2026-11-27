import {checkScope,kinds,type ItemType,type JsonValue} from './contract.js';
import {PrivateDeviceStore} from './local-dexie.js';

/**
 * Account-scoped recovery helper for materialized Dexie learner records.
 * NOT a full device/account backup. Output is plaintext.
 * Excludes journal/consent and keybag records: recovery must not silently change
 * cloud consent or enqueue private diary content. No credentials or key material.
 * Import never overwrites existing records/outbox and commits atomically.
 */
type BackupItem={itemType:ItemType;itemId:string;payload:JsonValue;deletedAt:string|null};
// These scopes require their own explicit privacy/recovery flow.
function protectedScope(type:ItemType,id:string):boolean{
 return (type==='preference'&&['journal-cloud-consent','daily-enabled','__li_e2ee_keybag_v1'].includes(id))||
  (type==='note'&&id==='daily-journal');
}
type Backup={schema:'li.private.backup.v1';accountId:string;createdAt:string;items:BackupItem[]};

export async function exportAccountBackup(store:PrivateDeviceStore,accountId:string):Promise<string>{
 if(!accountId.trim())throw new Error('BACKUP_ACCOUNT_REQUIRED');
 const rows=await store.accountRecords(accountId);
 const result:Backup={
  schema:'li.private.backup.v1',accountId,createdAt:new Date().toISOString(),
  items:rows.filter(x=>!protectedScope(x.itemType,x.itemId)).map(x=>({
   itemType:x.itemType,itemId:x.itemId,payload:x.payload,deletedAt:x.deletedAt
  }))
 };
 return JSON.stringify(result,null,2);
}

/** Recheck authorization across the asynchronous Dexie read before releasing bytes. */
export async function exportAuthorizedAccountBackup(store:PrivateDeviceStore,accountId:string,
 isAuthorized:()=>boolean):Promise<string>{
 if(!accountId.trim()||!isAuthorized())throw Error('BACKUP_OWNER_REQUIRED');
 const json=await exportAccountBackup(store,accountId);
 if(!isAuthorized())throw Error('BACKUP_OWNER_CHANGED');
 return json;
}

export async function restoreAccountBackup(store:PrivateDeviceStore,accountId:string,json:string):
 Promise<{restored:number;skipped:number}>{
 if(!accountId.trim())throw new Error('BACKUP_ACCOUNT_REQUIRED');
 if(json.length>3_000_000)throw new Error('BACKUP_TOO_LARGE');
 let parsed:unknown;
 try{parsed=JSON.parse(json);}
 catch{throw new Error('BACKUP_INVALID_JSON');}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('BACKUP_INVALID_FORMAT');
 const data=parsed as Record<string,unknown>;
 if(data.schema!=='li.private.backup.v1'||data.accountId!==accountId||!Array.isArray(data.items)||
    data.items.length>5000)throw new Error('BACKUP_WRONG_ACCOUNT_OR_SCHEMA');
 const checked:BackupItem[]=[];
 const unique=new Set<string>();
 for(const item of data.items){
  if(!item||typeof item!=='object'||Array.isArray(item))throw new Error('BACKUP_INVALID_ITEM');
  const row=item as Record<string,unknown>;
  if(typeof row.itemType!=='string'||!kinds.includes(row.itemType as ItemType)||
     typeof row.itemId!=='string')throw new Error('BACKUP_INVALID_ITEM');
  checkScope(accountId,row.itemType,row.itemId);
  if(protectedScope(row.itemType,row.itemId))throw new Error('BACKUP_PROTECTED_SCOPE');
  if(row.payload===undefined||
     !(row.deletedAt===null||typeof row.deletedAt==='string'&&!Number.isNaN(Date.parse(row.deletedAt))))
   throw new Error('BACKUP_INVALID_ITEM');
  const key=JSON.stringify([row.itemType,row.itemId]);
  if(unique.has(key))throw new Error('BACKUP_DUPLICATE_ITEM');
  unique.add(key);
  checked.push({itemType:row.itemType,itemId:row.itemId,
   payload:row.payload as JsonValue,deletedAt:row.deletedAt as string|null});
 }
 // Keep the existence check and all nested edit transactions under one
 // read/write transaction. Concurrent changes serialize; a failure rolls back
 // every restored record and its upload intent.
 return store.transaction('rw',store.records,store.outbox,async()=>{
  let restored=0,skipped=0;
  for(const item of checked){
   const key=JSON.stringify([accountId,item.itemType,item.itemId]);
   if(await store.records.get(key)||await store.outbox.get(key)){skipped++;continue;}
   await store.edit(accountId,item.itemType,item.itemId,item.payload,item.deletedAt);
   restored++;
  }
  return{restored,skipped};
 });
}
