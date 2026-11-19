import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateDeviceStore} from '../.sync-test/sync/local-dexie.js';
import {syncOnce} from '../.sync-test/sync/sync-once.js';
import {RevisionConflict} from '../.sync-test/sync/contract.js';

function createStore(){return new PrivateDeviceStore();}
function remote(itemId='n1',revision=1){
 return {owner_id:'A',item_type:'note',item_id:itemId,revision,payload:{text:'remote'},
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

test('wrong-owner remote row cannot be hydrated into this account',async()=>{
 const db=createStore();
 try{
  await assert.rejects(db.apply('A',{...remote('foreign',1),owner_id:'B'}),/REMOTE_OWNER_MISMATCH/);
  assert.equal((await db.accountRecords('A')).length,0);
 }finally{await closeStore(db);}
});
test('21 queued edits cannot report synced when only 20 are uploaded',async()=>{
 const db=createStore();
 try{
  for(let i=0;i<21;i++)await db.edit('A','note','n'+i,{text:String(i)});
  let writes=0;
  const api={accountId:'A',async write(entry){writes++;return remote(entry.itemId,entry.baseRevision+1);},async all(){return [];}};
  const report=await syncOnce(db,api,'A',{twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true});
  assert.equal(writes,20);
  assert.equal(report.pending,1);
  assert.equal(report.mode,'pending');
 }finally{await closeStore(db);}
});
test('concurrent calls are single-flight and do not duplicate a queued upload',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'offline'});
  let unblock=()=>{};const hold=new Promise(resolve=>{unblock=resolve;});
  let writes=0;
  const api={accountId:'A',async write(entry){writes++;await hold;return remote(entry.itemId,1);},async all(){return [];}};
  const gate={twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true};
  const first=syncOnce(db,api,'A',gate);
  const second=syncOnce(db,api,'A',gate);
  assert.equal(first,second);
  unblock();
  const report=await first;
  assert.equal(writes,1);
  assert.equal(report.mode,'synced');
 }finally{await closeStore(db);}
});
test('expired credentials demand sign-in, not a false successful or retryable sync',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'offline'});
  const api={accountId:'A',async write(){throw Error('NEON_DATA_API_HTTP_401');},async all(){return [];}};
  const report=await syncOnce(db,api,'A',{twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true});
  assert.equal(report.mode,'sign-in-required');
  assert.equal(report.pending,1);
 }finally{await closeStore(db);}
});
test('remote owner mismatch is surfaced as a security blocker without data write',async()=>{
 const db=createStore();
 try{
  const api={accountId:'A',async write(){throw Error('unexpected');},async all(){return [{...remote('evil'),owner_id:'B'}];}};
  const report=await syncOnce(db,api,'A',{twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true});
  assert.equal(report.mode,'security-error');
  assert.equal((await db.accountRecords('A')).length,0);
 }finally{await closeStore(db);}
});

test('conflict: learner keeps local note, rebases to latest server revision and retries',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'my changes'});
  const [original]=await db.pending('A');
  await db.reject('A',original);
  const [conflicted]=await db.outbox.where('accountId').equals('A').toArray();
  const result=await db.resolveConflict('A',conflicted,remote('n1',4),'keep-local');
  assert.equal(result,'local-requeued');
  const [queue]=await db.pending('A');
  assert.equal(queue.baseRevision,4);
  assert.notEqual(queue.opId,original.opId);
  assert.equal(queue.payload.text,'my changes');
  assert.equal((await db.accountRecords('A'))[0].baseRevision,4);
 }finally{await closeStore(db);}
});
test('conflict: learner explicitly chooses remote and clears local queue',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'my changes'});
  const [original]=await db.pending('A');
  await db.reject('A',original);
  const [op]=await db.outbox.where('accountId').equals('A').toArray();
  const result=await db.resolveConflict('A',op,remote('n1',7),'use-remote');
  assert.equal(result,'remote-accepted');
  assert.equal((await db.accountRecords('A'))[0].payload.text,'remote');
  assert.equal((await db.pending('A')).length,0);
  assert.equal((await db.counts('A')).conflicts,0);
 }finally{await closeStore(db);}
});
test('conflict resolution refuses another account and stale op without changing current data',async()=>{
 const db=createStore();
 try{
  await db.edit('A','note','n1',{text:'private'});
  const [original]=await db.pending('A');
  await db.reject('A',original);
  const [op]=await db.outbox.where('accountId').equals('A').toArray();
  await assert.rejects(db.resolveConflict('A',op,{...remote('n1'),owner_id:'B'},'use-remote'),/CONFLICT_OWNER_OR_ITEM_MISMATCH/);
  await db.edit('A','note','n1',{text:'newer edit'});
  await assert.rejects(db.resolveConflict('A',op,remote('n1',2),'use-remote'),/CONFLICT_CHANGED_REFRESH_REQUIRED/);
  assert.equal((await db.accountRecords('A'))[0].payload.text,'newer edit');
 }finally{await closeStore(db);}
});
