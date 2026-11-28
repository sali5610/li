import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {exportAccountBackup,exportAuthorizedAccountBackup,restoreAccountBackup} from '../.sync-test/account-backup.js';
import {storageKey,kinds} from '../.sync-test/contract.js';

const owner='backup-owner',other='other-owner';
const make=()=>new PrivateDeviceStore('li-backup-'+crypto.randomUUID());
async function clean(...stores){for(const s of stores){s.close();await s.delete();}}

test('all six learner record kinds: owner-only roundtrip, protected scopes excluded, tombstone and pending edits retained',async()=>{
 const source=make(),target=make();
 try{
  for(const type of kinds)await source.edit(owner,type,'item-'+type,{text:type},
   type==='bookmark'?'2026-11-20T12:00:00Z':null);
  await source.edit(other,'note','other-only',{text:'other-secret'});
  for(const [type,id] of [['note','daily-journal'],['preference','daily-enabled'],
   ['preference','journal-cloud-consent'],['preference','__li_e2ee_keybag_v1']])
   await source.edit(owner,type,id,{secret:'protected'});
  const json=await exportAccountBackup(source,owner);
  assert.equal(JSON.parse(json).items.length,6);
  assert.doesNotMatch(json,/other-secret|protected|journal-cloud-consent|keybag/);
  assert.deepEqual(await restoreAccountBackup(target,owner,json),{restored:6,skipped:0});
  assert.equal((await target.pending(owner)).length,6);
  assert.equal((await target.records.get(storageKey(owner,'bookmark','item-bookmark'))).deletedAt,'2026-11-20T12:00:00Z');
  await target.edit(owner,'note','item-note',{text:'newer local note'});
  assert.deepEqual(await restoreAccountBackup(target,owner,json),{restored:0,skipped:6});
  assert.equal((await target.records.get(storageKey(owner,'note','item-note'))).payload.text,'newer local note');
  assert.equal((await target.accountRecords(other)).length,0);
 }finally{await clean(source,target);}
});

test('invalid account, duplicate, malformed or protected scope rejects entire import',async()=>{
 const source=make(),target=make();
 try{
  await source.edit(owner,'note','one',{text:'saved'});
  const json=await exportAccountBackup(source,owner);
  await assert.rejects(restoreAccountBackup(target,other,json),/WRONG_ACCOUNT_OR_SCHEMA/);
  await assert.rejects(restoreAccountBackup(target,owner,'{broken'),/INVALID_JSON/);
  const data=JSON.parse(json);
  const dupe={...data,items:[...data.items,...data.items]};
  await assert.rejects(restoreAccountBackup(target,owner,JSON.stringify(dupe)),/DUPLICATE_ITEM/);
  for(const [itemType,itemId] of [['note','daily-journal'],['preference','daily-enabled'],
    ['preference','journal-cloud-consent'],['preference','__li_e2ee_keybag_v1']]){
   const bad={...data,items:[...data.items,{itemType,itemId,payload:true,deletedAt:null}]};
   await assert.rejects(restoreAccountBackup(target,owner,JSON.stringify(bad)),/PROTECTED_SCOPE/);
  }
  assert.equal((await target.accountRecords(owner)).length,0);
  assert.equal((await target.pending(owner)).length,0);
 }finally{await clean(source,target);}
});

test('mid-import failure rolls back all new records and outbox entries, preserving existing work',async()=>{
 const source=make(),target=make();
 try{
  await source.edit(owner,'note','first',{text:'first'});
  await source.edit(owner,'note','second',{text:'second'});
  await target.edit(owner,'note','existing',{text:'keep'});
  const json=await exportAccountBackup(source,owner);
  const original=target.edit.bind(target);let calls=0;
  target.edit=async(...args)=>{if(++calls===2)throw Error('SIMULATED_WRITE_FAILURE');return original(...args);};
  await assert.rejects(restoreAccountBackup(target,owner,json),/SIMULATED_WRITE_FAILURE/);
  assert.equal(calls,2);
  assert.deepEqual((await target.accountRecords(owner)).map(x=>x.itemId),['existing']);
  assert.deepEqual((await target.pending(owner)).map(x=>x.itemId),['existing']);
  target.edit=original;
  assert.deepEqual(await restoreAccountBackup(target,owner,json),{restored:2,skipped:0});
 }finally{await clean(source,target);}
});


test('authorized export fails closed before read and when session changes during read; no writes',async()=>{
 const source=make();
 try{
  await source.edit(owner,'note','one',{text:'owner note'});
  await source.edit(other,'note','two',{text:'other note'});
  let allowed=false,reads=0;
  const original=source.accountRecords.bind(source);
  source.accountRecords=async(...args)=>{reads++;const rows=await original(...args);allowed=false;return rows;};
  await assert.rejects(exportAuthorizedAccountBackup(source,owner,()=>allowed),/BACKUP_OWNER_REQUIRED/);
  assert.equal(reads,0);
  allowed=true;
  await assert.rejects(exportAuthorizedAccountBackup(source,owner,()=>allowed),/BACKUP_OWNER_CHANGED/);
  assert.equal(reads,1);
  source.accountRecords=original;allowed=true;
  const result=await exportAuthorizedAccountBackup(source,owner,()=>allowed);
  assert.match(result,/owner note/);assert.doesNotMatch(result,/other note/);
  assert.equal((await source.pending(owner)).length,1);
  assert.equal((await source.pending(other)).length,1);
 }finally{await clean(source);}
});
