import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {syncOnce} from '../.sync-test/sync-once.js';
import {RevisionConflict} from '../.sync-test/contract.js';

function createStore(){return new PrivateDeviceStore();}
function remote(itemId='n1',revision=1){
 return {item_type:'note',item_id:itemId,revision,payload:{text:'remote'},
 changed_at:'2026-11-19T02:20:00Z',deleted_at:null};
}
async function closeStore(db){
 try{db.close();await db.delete();}catch{db.close();}
}
test('Dexie local write and outbox commit together, per-account isolation and reopen persistence',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'private-A'});
  assert.equal((await db.pending('A')).length,1);
  assert.equal((await db.accountRecords('A')).length,1);
  assert.equal((await db.accountRecords('B')).length,0);
  db.close();
  const reopened=createStore();
  try{
   assert.equal((await reopened.pending('A')).length,1);
   assert.equal((await reopened.accountRecords('B')).length,0);
  }finally{await closeStore(reopened);}
 }finally{db.close();}
});
test('success ack removes exact outbox op and advances local revision',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'v1'});
  const [op]=await db.pending('A');
  await db.accept('A',op,remote('n1',1));
  assert.equal((await db.pending('A')).length,0);
  assert.equal((await db.accountRecords('A'))[0].baseRevision,1);
 }finally{await closeStore(db);}
});
test('acknowledge stale in-flight op preserves newer local edits',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'v1'});
  const [inflight]=await db.pending('A');
  await db.edit('A','note','n1',{text:'v2'});
  await db.accept('A',inflight,remote('n1',1));
  const pending=await db.pending('A');
  assert.equal(pending.length,1);
  assert.equal(pending[0].payload.text,'v2');
  assert.equal(pending[0].baseRevision,1);
 }finally{await closeStore(db);}
});
test('remote pull cannot overwrite locally pending note',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'offline'});
  await db.apply('A',remote('n1',99));
  assert.equal((await db.accountRecords('A'))[0].payload.text,'offline');
 }finally{await closeStore(db);}
});
test('sync remains local-only by default, without contacting remote API',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'offline'});
  const api={accountId:'A',write(){throw Error('unexpected write');},all(){throw Error('unexpected read');}};
  const report=await syncOnce(db,api,'A');
  assert.equal(report.mode,'local-only');
  assert.equal(report.pending,1);
  await assert.rejects(syncOnce(db,api,'B'),/ACCOUNT_BINDING_REQUIRED/);
 }finally{await closeStore(db);}
});
test('CAS conflict retains outbox and marks user action required',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'offline'});
  const api={accountId:'A',async write(){throw new RevisionConflict();},async all(){return [];}};
  const report=await syncOnce(db,api,'A',{twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true});
  assert.equal(report.mode,'conflict');
  assert.equal(report.conflicts,1);
  assert.equal((await db.accountRecords('A'))[0].payload.text,'offline');
 }finally{await closeStore(db);}
});
test('network failure does not drop outbox or report synced',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'offline'});
  const api={accountId:'A',async write(){throw new Error('NETWORK_FAIL');},async all(){return [];}};
  const report=await syncOnce(db,api,'A',{twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true});
  assert.equal(report.mode,'offline');
  assert.equal(report.pending,1);
 }finally{await closeStore(db);}
});
