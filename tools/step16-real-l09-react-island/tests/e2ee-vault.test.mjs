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


test('interrupted legacy conversion resumes without overwriting either learner row',async()=>{
 const noteA={schema:'li.personal.storage.v1',raw:'First original, not lost'};
 const noteB={schema:'li.personal.storage.v1',raw:'Second original, not lost'};
 const raw=fakeRemote(user,[
  makeRow('note','library',noteA),makeRow('note','case-draft',noteB),
 ]);
 const created=await createVault(user,password);
 await registerVault(raw,created.manifest);
 setCurrentVault(user,created.vault);
 let converted=0;
 const dropping={
  accountId:user,
  one:(type,id)=>raw.one(type,id),
  all:()=>raw.all(),
  async write(e){
   if(e.itemId==='case-draft'&&converted===1){
    converted++;throw Error('NETWORK_DROPPED_DURING_MIGRATION');
   }
   if(e.itemId!=='__li_e2ee_keybag_v1')converted++;
   return raw.write(e);
  }
 };
 try{
  await assert.rejects(migrateLegacyPayloads(dropping,created.vault),
   /NETWORK_DROPPED_DURING_MIGRATION/);
  assert.equal(currentVault(user),null,'partial migration cannot unlock normal sync');
  assert.equal(raw.rows.get('note:library').payload.schema,'li.e2ee.payload.v1');
  assert.deepEqual(raw.rows.get('note:case-draft').payload,noteB,
   'failed write must preserve exact original plaintext until successful retry');

  // The next signed session can recover using ONLY the independent recovery code.
  clearCurrentVault();
  const fresh=await recoverVault(await readVaultManifest(raw),user,created.recoveryCode);
  setCurrentVault(user,fresh);
  const progress=await migrateLegacyPayloads(raw,fresh);
  assert.deepEqual(progress,{encrypted:1,alreadyEncrypted:1,total:2});
  finishVaultMigration(user,fresh);
  const secure=new SealedNeonUserApi(raw,fresh);
  assert.deepEqual((await secure.one('note','library')).payload,noteA);
  assert.deepEqual((await secure.one('note','case-draft')).payload,noteB);
 }finally{clearCurrentVault();}
});

test('migration detects a last-moment old client plaintext insertion and refuses unlocked state',async()=>{
 const created=await createVault(user,password);
 const remote=fakeRemote(user,[makeRow('note','library',note)]);
 await registerVault(remote,created.manifest);
 setCurrentVault(user,created.vault);
 const originalAll=remote.all.bind(remote);
 let scans=0;
 remote.all=async()=>{
  const rows=await originalAll();
  scans++;
  if(scans===2){
   remote.rows.set('note:old-client-race',makeRow('note','old-client-race',
     {raw:'legacy client submitted plaintext during migration'}));
   return [...remote.rows.values()];
  }
  return rows;
 };
 try{
  await assert.rejects(migrateLegacyPayloads(remote,created.vault),/E2EE_UNENCRYPTED_REMOTE/);
  assert.equal(currentVault(user),null,
   'a server-side plaintext writer must prevent declaring E2EE completed');
  assert.deepEqual(remote.rows.get('note:old-client-race').payload,
   {raw:'legacy client submitted plaintext during migration'});
 }finally{clearCurrentVault();}
});


test('Neon JSONB reorders nested keybag and ciphertext objects without breaking signed readback',async()=>{
 // Actual Postgres JSONB returns schema/recovery/accountId/passphrase and
 // nonce/schema/ciphertext in a different field order from the JavaScript write.
 // The test adapter reproduces that API behavior at every read/write.
 function reorder(value){
  if(Array.isArray(value))return value.map(reorder);
  if(value&&typeof value==='object')
   return Object.fromEntries(Object.entries(value)
    .sort(([a],[b])=>a.localeCompare(b)).reverse()
    .map(([k,v])=>[k,reorder(v)]));
  return value;
 }
 const base=fakeRemote(user,[makeRow('note','library',note)]);
 const jsonbRemote={
  accountId:user,
  async one(type,id){
   const row=await base.one(type,id);
   return row?{...row,payload:reorder(row.payload)}:null;
  },
  async all(){return (await base.all()).map(row=>({...row,payload:reorder(row.payload)}));},
  async write(edit){
   const row=await base.write({...edit,payload:reorder(edit.payload)});
   return {...row,payload:reorder(row.payload)};
  }
 };
 const created=await createVault(user,password);
 try{
  await registerVault(jsonbRemote,created.manifest);
  const readback=await readVaultManifest(jsonbRemote);
  assert.deepEqual(readback,reorder(created.manifest));
  assert.notEqual(JSON.stringify(readback),JSON.stringify(created.manifest),
   'this would falsely fail with positional JSON.stringify equality');
  setCurrentVault(user,created.vault);
  const summary=await migrateLegacyPayloads(jsonbRemote,created.vault);
  assert.equal(summary.encrypted,1);
  finishVaultMigration(user,created.vault);
  const secure=new SealedNeonUserApi(jsonbRemote,created.vault);
  assert.deepEqual((await secure.one('note','library')).payload,note);
  assert.equal(base.rows.get('note:library').payload.schema,'li.e2ee.payload.v1');
  const envelope=base.rows.get('note:library').payload;
  assert.deepEqual(Object.keys(envelope),['schema','nonce','ciphertext'].sort().reverse());
 }finally{clearCurrentVault();}
});
