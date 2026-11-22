import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {
 createVault,unlockVault,recoverVault,changeVaultPassphrase,
 sealPrivatePayload,openPrivatePayload,VAULT_ITEM_ID
} from '../.sync-test/e2ee-vault.js';
import {
 SealedNeonUserApi,readVaultManifest,registerVault,migrateLegacyPayloads,
 setCurrentVault,finishVaultMigration,currentVault,clearCurrentVault
} from '../.sync-test/e2ee-cloud.js';

globalThis.crypto ??= webcrypto;
const user='user-A',other='user-B';
const password='a-long-passphrase-💚-secret';
const edit=(payload,opId=crypto.randomUUID())=>({
 itemType:'note',itemId:'library',payload,baseRevision:0,opId,deletedAt:null
});
const note={schema:'li.personal.storage.v1',raw:'Ghi chú rất riêng tư: yêu hoa tím.'};

function fakeRemote(accountId=user,initial=[]){
 const rows=new Map(initial.map(row=>[row.item_type+':'+row.item_id,row]));
 return {
  accountId,
  rows,
  async one(type,id){return rows.get(type+':'+id)??null;},
  async all(){return [...rows.values()];},
  async write(e){
   const key=e.itemType+':'+e.itemId;
   const old=rows.get(key);
   if((old?.revision??0)!==e.baseRevision)throw Error('REVISION_CONFLICT');
   const row={
    owner_id:accountId,item_type:e.itemType,item_id:e.itemId,
    revision:e.baseRevision+1,payload:e.payload,deleted_at:e.deletedAt,
    changed_at:new Date().toISOString(),last_op_id:e.opId
   };
   rows.set(key,row);
   return row;
  }
 };
}
const makeRow=(item_type,item_id,payload,revision=1)=>({
 owner_id:user,item_type,item_id,payload,revision,deleted_at:null,
 changed_at:new Date().toISOString()
});

test('passphrase unlock, 256-bit recovery, wrong-owner and wrong-key denials',async()=>{
 const created=await createVault(user,password);
 assert.match(created.recoveryCode,/^li1-[A-Za-z0-9_-]{43}$/);
 assert.doesNotMatch(JSON.stringify(created.manifest),/Ghi chú|long-passphrase|master/i);
 const viaPassword=await unlockVault(created.manifest,user,password);
 const viaRecovery=await recoverVault(created.manifest,user,created.recoveryCode);
 assert.equal(viaPassword.accountId,user);
 assert.equal(viaRecovery.accountId,user);
 await assert.rejects(unlockVault(created.manifest,user,'wrong-password-long-enough'),/E2EE_UNLOCK_FAILED/);
 await assert.rejects(recoverVault(created.manifest,user,'li1-'+('A'.repeat(43))),/E2EE_UNLOCK_FAILED/);
 await assert.rejects(unlockVault(created.manifest,other,password),/E2EE_VAULT_OWNER_MISMATCH/);
 await assert.rejects(createVault(user,'short'),/E2EE_PASSPHRASE_TOO_SHORT/);
 const sealed=await sealPrivatePayload(viaPassword,user,edit(note));
 assert.deepEqual(await openPrivatePayload(viaRecovery,user,'note','library',sealed),note);
});

test('AES-GCM hides content, binds account/type/item, authenticates tampering and rejects plaintext',async()=>{
 const {vault}=await createVault(user,password);
 const attempt=edit(note);
 const sealed=await sealPrivatePayload(vault,user,attempt);
 assert.equal(sealed.schema,'li.e2ee.payload.v1');
 assert.ok(!JSON.stringify(sealed).includes('Ghi chú'));
 assert.ok(!JSON.stringify(sealed).includes('hoa tím'));
 assert.deepEqual(await openPrivatePayload(vault,user,'note','library',sealed),note);
 await assert.rejects(openPrivatePayload(vault,user,'note','other',sealed),/E2EE_DECRYPT_FAILED/);
 await assert.rejects(openPrivatePayload(vault,other,'note','library',sealed),/E2EE_ACCOUNT_OR_ITEM_MISMATCH/);
 await assert.rejects(openPrivatePayload(vault,user,'preference','library',sealed),/E2EE_DECRYPT_FAILED/);
 await assert.rejects(openPrivatePayload(vault,user,'note','library',note),/E2EE_UNENCRYPTED_REMOTE/);
 const change={...sealed,ciphertext:sealed.ciphertext.slice(0,-2)+'AA'};
 await assert.rejects(openPrivatePayload(vault,user,'note','library',change),/E2EE_DECRYPT_FAILED/);
});

test('same durable op gives identical ciphertext after retry/restart; different op gives unique nonce',async()=>{
 const {manifest}=await createVault(user,password);
 const a=await unlockVault(manifest,user,password),b=await unlockVault(manifest,user,password);
 const op=edit(note);
 const once=await sealPrivatePayload(a,user,op);
 const retry=await sealPrivatePayload(b,user,op);
 assert.deepEqual(once,retry);
 const next=await sealPrivatePayload(a,user,{...op,opId:crypto.randomUUID()});
 assert.notEqual(next.nonce,once.nonce);
 const corrected=await sealPrivatePayload(a,user,{...op,payload:{raw:'Different value'}});
 assert.notEqual(corrected.nonce,once.nonce);
});

test('cloud adapter never sends plaintext; encrypted readback matches local UI data',async()=>{
 const {vault}=await createVault(user,password);
 const remote=fakeRemote(),secure=new SealedNeonUserApi(remote,vault);
 const attempt=edit(note);
 const saved=await secure.write(attempt);
 assert.deepEqual(saved.payload,note);
 assert.equal(remote.rows.get('note:library').payload.schema,'li.e2ee.payload.v1');
 assert.doesNotMatch(JSON.stringify(remote.rows.get('note:library')),/hoa tím/);
 assert.deepEqual((await secure.one('note','library')).payload,note);
 assert.deepEqual((await secure.all()).map(r=>r.payload),[note]);
 await assert.rejects(secure.one('preference',VAULT_ITEM_ID),/E2EE_KEYBAG_NOT_LEARNER_CONTENT/);
 const wrong=await createVault(other,'another-long-passphrase');
 assert.throws(()=>new SealedNeonUserApi(remote,wrong.vault),/E2EE_VAULT_OWNER_MISMATCH/);
});

test('keybag setup and crash-resumable legacy migration do not change existing content',async()=>{
 const remote=fakeRemote(user,[
  makeRow('note','library',note),
  makeRow('preference','study-mode',{raw:'deep'}),
 ]);
 const created=await createVault(user,password);
 await registerVault(remote,created.manifest);
 assert.deepEqual(await readVaultManifest(remote),created.manifest);
 await assert.rejects(registerVault(remote,created.manifest),/E2EE_KEYBAG_ALREADY_EXISTS/);
 setCurrentVault(user,created.vault);
 assert.equal(currentVault(user),null,'must not start sync midway through migration');
 const progress=await migrateLegacyPayloads(remote,created.vault);
 assert.deepEqual(progress,{encrypted:2,alreadyEncrypted:0,total:2});
 const repeat=await migrateLegacyPayloads(remote,created.vault);
 assert.deepEqual(repeat,{encrypted:0,alreadyEncrypted:2,total:2});
 finishVaultMigration(user,created.vault);
 assert.equal(currentVault(user),created.vault);
 const secure=new SealedNeonUserApi(remote,created.vault);
 assert.deepEqual((await secure.one('note','library')).payload,note);
 assert.equal((await secure.all()).length,2,'vault keybag is not a learner note');
 clearCurrentVault();
 assert.equal(currentVault(user),null);
});

test('migration fails closed if a wrong/undecipherable envelope exists',async()=>{
 const created=await createVault(user,password);
 const wrong=await createVault(user,'a-different-long-passphrase');
 const sealed=await sealPrivatePayload(wrong.vault,user,edit(note));
 const remote=fakeRemote(user,[makeRow('note','library',sealed)]);
 await registerVault(remote,created.manifest);
 setCurrentVault(user,created.vault);
 await assert.rejects(migrateLegacyPayloads(remote,created.vault),/E2EE_DECRYPT_FAILED/);
 assert.equal(currentVault(user),null);
 clearCurrentVault();
});

test('recovery can rewrap passphrase without changing already-encrypted user payloads',async()=>{
 const created=await createVault(user,password);
 const sealed=await sealPrivatePayload(created.vault,user,edit(note));
 const viaRecovery=await recoverVault(created.manifest,user,created.recoveryCode);
 const renewed=await changeVaultPassphrase(viaRecovery,created.manifest,'new very long passphrase!');
 await assert.rejects(unlockVault(renewed,user,password),/E2EE_UNLOCK_FAILED/);
 const newVault=await unlockVault(renewed,user,'new very long passphrase!');
 assert.deepEqual(await openPrivatePayload(newVault,user,'note','library',sealed),note);
});
