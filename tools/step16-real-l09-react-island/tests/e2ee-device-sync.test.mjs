import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {syncOnce} from '../.sync-test/sync-once.js';
import {RevisionConflict,storageKey} from '../.sync-test/contract.js';
import {createVault,recoverVault,unlockVault,sealPrivatePayload} from '../.sync-test/e2ee-vault.js';
import {
 SealedNeonUserApi,registerVault,readVaultManifest,migrateLegacyPayloads,
 setCurrentVault,finishVaultMigration,clearCurrentVault,currentVault
} from '../.sync-test/e2ee-cloud.js';

globalThis.crypto ??= webcrypto;
const uid='qa-invited-A';
const gate={twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true};
const password='E2EE-test-only-passphrase-2026';
const createStore=tag=>new PrivateDeviceStore('li-e2ee-qa-'+tag+'-'+crypto.randomUUID());
const close=async store=>{store.close();await store.delete();};
const stamp='2026-11-22T00:00:00Z';

function simulatedNeon(accountId=uid,{loseAckOnce=false}={}){
 const rows=new Map();
 const requestBodies=[];
 let lost=false;
 return {
  accountId,rows,requestBodies,
  async one(type,id){return rows.get(type+':'+id)??null;},
  async all(){return [...rows.values()];},
  async write(edit){
   const key=edit.itemType+':'+edit.itemId;
   const previous=rows.get(key);
   if(previous?.last_op_id===edit.opId){
    if(JSON.stringify(previous.payload)!==JSON.stringify(edit.payload))
     throw new RevisionConflict();
    return previous;
   }
   if((previous?.revision??0)!==edit.baseRevision)throw new RevisionConflict();
   const row={owner_id:accountId,item_type:edit.itemType,item_id:edit.itemId,
    revision:edit.baseRevision+1,changed_at:stamp,deleted_at:edit.deletedAt,
    last_op_id:edit.opId,payload:edit.payload};
   requestBodies.push(JSON.stringify(edit.payload));
   rows.set(key,row);
   if(loseAckOnce&&!lost&&edit.itemId!=='__li_e2ee_keybag_v1'){
    lost=true;
    throw Error('NETWORK_AFTER_COMMIT');
   }
   return row;
  }
 };
}
async function onboard(remote){
 const created=await createVault(uid,password);
 await registerVault(remote,created.manifest);
 setCurrentVault(uid,created.vault);
 await migrateLegacyPayloads(remote,created.vault);
 finishVaultMigration(uid,created.vault);
 return created;
}

test('E2EE: offline PWA outbox survives reopening; another device unlocks from recovery code',async()=>{
 const remote=simulatedNeon();
 const created=await onboard(remote);
 const pwa=createStore('pwa');
 const name=pwa.name;
 let revived;
 const safari=createStore('safari');
 try{
  const note={schema:'li.personal.storage.v1',raw:'Bút ký riêng chỉ có người học mới đọc được'};
  const attempt={schema:'li.native.lesson.v1',data:{draft:['Tôi học offline','','',''],ratings:[null,null,null,null]}};
  await pwa.edit(uid,'note','library',note);
  await pwa.edit(uid,'lesson_attempt','L09-1-2',attempt);
  const offline=await syncOnce(pwa,{accountId:uid,
   async write(){throw Error('NETWORK_OFFLINE');},
   async all(){throw Error('NETWORK_OFFLINE');}
  },uid,gate);
  assert.equal(offline.mode,'offline');
  assert.equal(offline.pending,2);
  pwa.close();
  revived=new PrivateDeviceStore(name);
  assert.equal((await revived.pending(uid)).length,2,'offline drafts must persist after a reload');
  const online=await syncOnce(revived,new SealedNeonUserApi(remote,created.vault),uid,gate);
  assert.equal(online.mode,'synced');
  assert.equal(online.uploaded,2);
  assert.equal(online.pending,0);
  assert.equal(remote.rows.get('note:library').payload.schema,'li.e2ee.payload.v1');
  assert.equal(remote.rows.get('lesson_attempt:L09-1-2').payload.schema,'li.e2ee.payload.v1');
  assert.ok(remote.requestBodies.slice(1).every(x=>!x.includes('Bút ký')&&!x.includes('offline')),
   'server request bodies must not contain plaintext content');
  assert.equal((await revived.accountRecords(uid))[0].payload.schema!=='li.e2ee.payload.v1',true,
   'existing device UI should stay readable in local Dexie');
  clearCurrentVault();
  assert.equal(currentVault(uid),null,'password must not be automatically persisted');
  const keybag=await readVaultManifest(remote);
  const recovered=await recoverVault(keybag,uid,created.recoveryCode);
  const downloaded=await syncOnce(safari,new SealedNeonUserApi(remote,recovered),uid,gate);
  assert.equal(downloaded.mode,'synced');
  assert.equal(downloaded.downloaded,2);
  assert.deepEqual((await safari.records.get(storageKey(uid,'note','library'))).payload,note);
  assert.deepEqual((await safari.records.get(storageKey(uid,'lesson_attempt','L09-1-2'))).payload,attempt);
  const viaPassword=await unlockVault(keybag,uid,password);
  assert.deepEqual((await new SealedNeonUserApi(remote,viaPassword).one('note','library')).payload,note);
 }finally{
  clearCurrentVault();
  if(revived)await close(revived);else await close(pwa);
  await close(safari);
 }
});

test('E2EE: lost server ACK retries the SAME outbox UUID and never uploads plaintext twice',async()=>{
 const remote=simulatedNeon(uid,{loseAckOnce:true});
 const created=await onboard(remote);
 const device=createStore('lost-ack');
 try{
  const personal={raw:'Không được đưa dữ liệu tôi ra SQL Editor'};
  await device.edit(uid,'note','library',personal);
  const pending=await device.pending(uid);
  assert.equal(pending.length,1);
  const first=await syncOnce(device,new SealedNeonUserApi(remote,created.vault),uid,gate);
  assert.equal(first.mode,'offline');
  assert.equal(first.pending,1);
  assert.equal(remote.rows.get('note:library').revision,1,'server committed once');
  const second=await syncOnce(device,new SealedNeonUserApi(remote,created.vault),uid,gate);
  assert.equal(second.mode,'synced');
  assert.equal(second.pending,0);
  assert.equal(remote.rows.get('note:library').revision,1,'replay does not create revision 2');
  assert.equal(remote.requestBodies.filter(x=>x.includes('li.e2ee.payload.v1')).length,1);
  assert.equal(JSON.stringify(remote.rows.get('note:library')).includes('Không được'),false);
  assert.deepEqual((await device.records.get(storageKey(uid,'note','library'))).payload,personal);
 }finally{clearCurrentVault();await close(device);}
});

test('E2EE: tampered or legacy plaintext remote row is a SECURITY error, not offline/synced',async()=>{
 const remote=simulatedNeon();
 const created=await onboard(remote);
 const device=createStore('corrupted-remote');
 try{
  remote.rows.set('note:legacy',{owner_id:uid,item_type:'note',item_id:'legacy',
   payload:{raw:'server can read me'},revision:1,changed_at:stamp,deleted_at:null});
  const result=await syncOnce(device,new SealedNeonUserApi(remote,created.vault),uid,gate);
  assert.equal(result.mode,'security-error');
  assert.equal(result.downloaded,0);
  assert.equal((await device.accountRecords(uid)).length,0);
  remote.rows.delete('note:legacy');
  const opId=crypto.randomUUID();
  const valid=await sealPrivatePayload(created.vault,uid,{itemType:'note',itemId:'corrupt',
   payload:{raw:'secret'},baseRevision:0,deletedAt:null,opId});
  remote.rows.set('note:corrupt',{owner_id:uid,item_type:'note',item_id:'corrupt',
   payload:{...valid,ciphertext:(valid.ciphertext[0]==='A'?'B':'A')+valid.ciphertext.slice(1)},
   revision:1,changed_at:stamp,deleted_at:null});
  const tampered=await syncOnce(device,new SealedNeonUserApi(remote,created.vault),uid,gate);
  assert.equal(tampered.mode,'security-error');
  assert.equal((await device.accountRecords(uid)).length,0);
 }finally{clearCurrentVault();await close(device);}
});

test('E2EE: two devices editing same item require explicit conflict handling, no silent overwrite',async()=>{
 const remote=simulatedNeon();
 const created=await onboard(remote);
 const a=createStore('conflict-a'),b=createStore('conflict-b');
 try{
  const note={raw:'Original note'};
  await a.edit(uid,'note','library',note);
  assert.equal((await syncOnce(a,new SealedNeonUserApi(remote,created.vault),uid,gate)).mode,'synced');
  const bVault=await unlockVault(await readVaultManifest(remote),uid,password);
  assert.equal((await syncOnce(b,new SealedNeonUserApi(remote,bVault),uid,gate)).mode,'synced');
  await a.edit(uid,'note','library',{raw:'Change A'});
  await b.edit(uid,'note','library',{raw:'Change B'});
  assert.equal((await syncOnce(a,new SealedNeonUserApi(remote,created.vault),uid,gate)).mode,'synced');
  const conflict=await syncOnce(b,new SealedNeonUserApi(remote,bVault),uid,gate);
  assert.equal(conflict.mode,'conflict');
  assert.equal(conflict.conflicts,1);
  assert.deepEqual((await b.records.get(storageKey(uid,'note','library'))).payload,{raw:'Change B'});
  assert.deepEqual((await new SealedNeonUserApi(remote,bVault).one('note','library')).payload,{raw:'Change A'});
 }finally{clearCurrentVault();await close(a);await close(b);}
});
