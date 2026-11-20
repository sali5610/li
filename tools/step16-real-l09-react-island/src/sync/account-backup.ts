import {checkScope,kinds,type ItemType,type JsonValue} from './contract.js';
import {PrivateDeviceStore} from './local-dexie.js';

/**
 * Account-scoped offline JSON backup for the existing Settings export/import UI.
 * No cookie/JWT/Neon credential is included. Import never overwrites existing
 * local work; imported items enter the SAME durable outbox as learner edits.
 */
type BackupItem={itemType:ItemType;itemId:string;payload:JsonValue;deletedAt:string|null};
type Backup={schema:'li.private.backup.v1';accountId:string;createdAt:string;items:BackupItem[]};

export async function exportAccountBackup(store:PrivateDeviceStore,accountId:string):Promise<string>{
 if(!accountId.trim())throw new Error('BACKUP_ACCOUNT_REQUIRED');
 const rows=await store.accountRecords(accountId);
 const result:Backup={
  schema:'li.private.backup.v1',accountId,createdAt:new Date().toISOString(),
  items:rows.map(x=>({
   itemType:x.itemType,itemId:x.itemId,payload:x.payload,deletedAt:x.deletedAt
  }))
 };
 return JSON.stringify(result,null,2);
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
  if(row.payload===undefined||
     !(row.deletedAt===null||typeof row.deletedAt==='string'&&!Number.isNaN(Date.parse(row.deletedAt))))
   throw new Error('BACKUP_INVALID_ITEM');
  const key=JSON.stringify([row.itemType,row.itemId]);
  if(unique.has(key))throw new Error('BACKUP_DUPLICATE_ITEM');
  unique.add(key);
  checked.push({itemType:row.itemType,itemId:row.itemId,
   payload:row.payload as JsonValue,deletedAt:row.deletedAt as string|null});
 }
 let restored=0,skipped=0;
 for(const item of checked){
  const key=JSON.stringify([accountId,item.itemType,item.itemId]);
  if(await store.records.get(key)||await store.outbox.get(key)){skipped++;continue;}
  await store.edit(accountId,item.itemType,item.itemId,item.payload,item.deletedAt);
  restored++;
 }
 return{restored,skipped};
}
