/**
 * Adapter that keeps plaintext OUT of Neon li_user_state payloads.
 * The existing Dexie offline queue and UI continue to use clear data only
 * on the user's device, preserving the proven CAS and conflict model.
 * Fail closed for legacy plaintext cloud rows until explicit owner migration.
 */
import {RevisionConflict} from './contract.js';
import type {Edit,PrivateItem,ItemType} from './contract.js';
import type {NeonUserApi} from './neon-api.js';
import {
 createVault,unlockVault,recoverVault,changeVaultPassphrase,
 isVaultManifest,isSealedPayload,sealPrivatePayload,openPrivatePayload,canonical,
 VAULT_ITEM_ID
} from './e2ee-vault.js';
import type {Vault,VaultManifest} from './e2ee-vault.js';

export type CloudUserApi=Pick<NeonUserApi,'accountId'|'one'|'all'|'write'>;
export type MigrationProgress={encrypted:number;alreadyEncrypted:number;total:number};
let active:{accountId:string;vault:Vault;ready:boolean}|null=null;

/** Keys are never stored in localStorage, IndexedDB, logs, URLs or Neon. */
export function currentVault(accountId:string):Vault|null{
 return accountId&&active?.accountId===accountId&&active.ready?active.vault:null;
}
export function setCurrentVault(accountId:string,vault:Vault){
 if(!accountId||vault.accountId!==accountId)throw Error('E2EE_ACCOUNT_OR_ITEM_MISMATCH');
 if(active&&active.accountId!==accountId)clearCurrentVault();
 active={accountId,vault,ready:false};
}
export function clearCurrentVault(){active=null;}
/** Unlock for sync ONLY after the entire owner's remote scan is sealed. */
export function finishVaultMigration(accountId:string,vault:Vault){
 if(!active||active.accountId!==accountId||active.vault!==vault)throw Error('E2EE_ACCOUNT_OR_ITEM_MISMATCH');
 active.ready=true;
 if(typeof window!=='undefined')window.dispatchEvent(new Event('li:e2ee-unlocked'));
}

function manifestFromItem(row:PrivateItem|null,accountId:string):VaultManifest|null{
 if(!row)return null;
 if(row.owner_id!==accountId||row.item_type!=='preference'||row.item_id!==VAULT_ITEM_ID||
    row.deleted_at!==null||!isVaultManifest(row.payload)||row.payload.accountId!==accountId)
  throw Error('E2EE_KEYBAG_INVALID');
 return row.payload;
}
export async function readVaultManifest(api:CloudUserApi):Promise<VaultManifest|null>{
 const row=await api.one('preference',VAULT_ITEM_ID);
 return manifestFromItem(row,api.accountId);
}
/** A create on an account that already has a vault must FAIL, not rotate keys. */
export async function registerVault(api:CloudUserApi,manifest:VaultManifest):Promise<void>{
 if(!isVaultManifest(manifest)||manifest.accountId!==api.accountId)throw Error('E2EE_KEYBAG_INVALID');
 if(await readVaultManifest(api))throw Error('E2EE_KEYBAG_ALREADY_EXISTS');
 try{
  await api.write({
   itemType:'preference',itemId:VAULT_ITEM_ID,
   payload:manifest,deletedAt:null,baseRevision:0,opId:crypto.randomUUID()
  });
 }catch(error){
  if(error instanceof RevisionConflict)throw Error('E2EE_KEYBAG_ALREADY_EXISTS');
  throw error;
 }
 const readback=await readVaultManifest(api);
 if(!readback||canonical(readback)!==canonical(manifest))
  throw Error('E2EE_KEYBAG_READBACK_FAILED');
}
export {createVault,unlockVault,recoverVault,changeVaultPassphrase};
export async function replacePassphrase(api:CloudUserApi,vault:Vault,newPassword:string):Promise<void>{
 const row=await api.one('preference',VAULT_ITEM_ID);
 const manifest=manifestFromItem(row,api.accountId);
 if(!manifest||!row)throw Error('E2EE_KEYBAG_MISSING');
 const updated=await changeVaultPassphrase(vault,manifest,newPassword);
 await api.write({itemType:'preference',itemId:VAULT_ITEM_ID,payload:updated,
  deletedAt:null,baseRevision:row.revision,opId:crypto.randomUUID()});
}
/**
 * Required before encrypted sync when upgrading an EXISTING account.
 * Explicitly called by owner after securely saving recovery key. May resume
 * after interruption: encrypted rows are skipped, pending legacy rows remain
 * readable ONLY by the trusted upgrade device, not silently hydrated by
 * encrypted sync. A concurrent edit causes a safe failure and rerun.
 *
 * This is NOT automatically executed during sign-in.
 */
export async function migrateLegacyPayloads(api:CloudUserApi,vault:Vault,
 onProgress?:(progress:MigrationProgress)=>void):Promise<MigrationProgress>{
 if(!active||active.accountId!==api.accountId||active.vault!==vault)
  throw Error('E2EE_VAULT_LOCKED');
 if(!await readVaultManifest(api))throw Error('E2EE_KEYBAG_MISSING');
 const rows=await api.all();
 const relevant=rows.filter(r=>!(r.item_type==='preference'&&r.item_id===VAULT_ITEM_ID));
 const summary={encrypted:0,alreadyEncrypted:0,total:relevant.length};
 for(const row of relevant){
  if(row.owner_id!==api.accountId)throw Error('REMOTE_OWNER_MISMATCH');
  if(isSealedPayload(row.payload)){
   // Never consider a forged/foreign envelope already migrated.
   await openPrivatePayload(vault,api.accountId,row.item_type,row.item_id,row.payload);
   summary.alreadyEncrypted++;onProgress?.({...summary});continue;
  }
  const opId=crypto.randomUUID();
  const edit:Edit={itemType:row.item_type,itemId:row.item_id,payload:row.payload,
   deletedAt:row.deleted_at,baseRevision:row.revision,opId};
  const ciphertext=await sealPrivatePayload(vault,api.accountId,edit);
  // In an interruption, the caller may retry this migration; the next scan
  // sees the server's already-encrypted row and skips without rewriting.
  await api.write({...edit,payload:ciphertext});
  const confirmed=await api.one(row.item_type,row.item_id);
  if(!confirmed||confirmed.revision!==row.revision+1||
      canonical(confirmed.payload)!==canonical(ciphertext))
   throw Error('E2EE_MIGRATION_READBACK_FAILED');
  summary.encrypted++;onProgress?.({...summary});
 }
 // Final scan detects any concurrent legacy writer. Don't declare protected
 // until EVERY existing remote row is encrypted. Older deployed clients must
 // also be blocked by a server constraint at production cut-over.
 for(const row of await api.all()){
  if(row.item_type==='preference'&&row.item_id===VAULT_ITEM_ID)continue;
  await openPrivatePayload(vault,api.accountId,row.item_type,row.item_id,row.payload);
 }
 return summary;
}

export class SealedNeonUserApi{
 readonly accountId:string;
 constructor(private readonly remote:CloudUserApi,private readonly vault:Vault){
  if(remote.accountId!==vault.accountId)throw Error('E2EE_VAULT_OWNER_MISMATCH');
  this.accountId=remote.accountId;
 }
 private async open(row:PrivateItem):Promise<PrivateItem>{
  if(row.owner_id!==this.accountId)throw Error('REMOTE_OWNER_MISMATCH');
  if(row.item_type==='preference'&&row.item_id===VAULT_ITEM_ID)
   throw Error('E2EE_KEYBAG_NOT_LEARNER_CONTENT');
  return {...row,payload:await openPrivatePayload(
   this.vault,this.accountId,row.item_type,row.item_id,row.payload)};
 }
 async one(type:ItemType,id:string):Promise<PrivateItem|null>{
  if(type==='preference'&&id===VAULT_ITEM_ID)throw Error('E2EE_KEYBAG_NOT_LEARNER_CONTENT');
  const row=await this.remote.one(type,id);
  return row?this.open(row):null;
 }
 async all():Promise<PrivateItem[]>{
  const rows=await this.remote.all();
  const actual=rows.filter(r=>!(r.item_type==='preference'&&r.item_id===VAULT_ITEM_ID));
  return Promise.all(actual.map(r=>this.open(r)));
 }
 async write(edit:Edit):Promise<PrivateItem>{
  if(edit.itemType==='preference'&&edit.itemId===VAULT_ITEM_ID)
   throw Error('E2EE_KEYBAG_NOT_LEARNER_CONTENT');
  const cipher=await sealPrivatePayload(this.vault,this.accountId,edit);
  const row=await this.remote.write({...edit,payload:cipher});
  return this.open(row);
 }
}
