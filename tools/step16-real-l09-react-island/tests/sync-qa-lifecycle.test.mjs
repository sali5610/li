import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateDeviceStore} from '../.sync-qa-test/sync/local-dexie.js';
import {RevisionConflict} from '../.sync-qa-test/sync/contract.js';
import {newSyncQaId,validateSyncQaId,seedDeviceA,deviceBRestoreAndEdit,
 deviceAConflictAndResolve,deviceBVerify,dropLocalQa,deleteRemoteQa,
 scopedSyncApi,safeSyncQaError} from '../.sync-qa-test/auth/sync-qa.js';

const user='test-sub-A';
const runId=()=>newSyncQaId();
function mock(){
 const data=new Map(), calls={one:0,write:0};
 const api={
  accountId:user,
  async one(type,id){
   calls.one++;
   assert.equal(type,'preference');
   return data.get(id)??null;
  },
  async write(edit){
   calls.write++;
   assert.equal(edit.itemType,'preference');
   assert.match(edit.itemId,/^__li_sync_qa_/);
   const current=data.get(edit.itemId);
   if((current?.revision??0)!==edit.baseRevision)throw new RevisionConflict();
   const record={owner_id:user,item_type:'preference',item_id:edit.itemId,
    revision:edit.baseRevision+1,payload:edit.payload,
    changed_at:new Date().toISOString(),deleted_at:null};
   data.set(edit.itemId,record);
   return record;
  }
 };
 return{api,data,calls};
}
const getStore=()=>new PrivateDeviceStore('li-sync-qa-mock-'+crypto.randomUUID());
const cleanup=async db=>{try{db.close();await db.delete();}catch{db.close();}};

test('two separate IndexedDB devices: staged offline draft, remote conflict, explicit keep-local, remote restore',async()=>{
 const a=getStore(),b=getStore(),{api,data}=mock(),id=runId();
 try{
  const a1=await seedDeviceA(a,api,id);
  assert.equal(a1.mode,'a-seeded');
  assert.equal((await a.pending(user)).length,1);
  assert.equal(data.get(id).revision,1);
  assert.equal(data.get(id).payload.stage,'seed');

  const b1=await deviceBRestoreAndEdit(b,api,id);
  assert.equal(b1.mode,'b-updated');
  assert.equal(data.get(id).revision,2);
  assert.equal(data.get(id).payload.stage,'b-update');
  assert.equal((await b.pending(user)).length,0);

  const a2=await deviceAConflictAndResolve(a,api,id);
  assert.equal(a2.mode,'a-resolved');
  assert.equal(data.get(id).revision,3);
  assert.equal(data.get(id).payload.stage,'a-offline');
  assert.equal((await a.pending(user)).length,0);

  const b2=await deviceBVerify(b,api,id);
  assert.equal(b2.mode,'b-verified');
  const result=await b.accountRecords(user);
  assert.equal(result[0].baseRevision,3);
  assert.equal(result[0].payload.stage,'a-offline');

  // QA hard delete is tested separately; no personal rows can be removed here.
  data.delete(id);
  await dropLocalQa(b,user,id);
  await dropLocalQa(a,user,id);
  assert.deepEqual(await b.accountRecords(user),[]);
  assert.deepEqual(await a.accountRecords(user),[]);
  assert.equal(data.size,0);
 }finally{await cleanup(a);await cleanup(b);}
});
test('invalid or unrelated IDs and owner/QA marker are fail closed',async()=>{
 const {api,data}=mock();
 assert.equal(validateSyncQaId(newSyncQaId()),true);
 assert.equal(validateSyncQaId('L09-1-2'),false);
 assert.equal(validateSyncQaId('__li_sync_qa_other'),false);
 assert.throws(()=>scopedSyncApi(api,'private-real-note'),/SQA-INVALID-ID/);
 const run=runId();
 const narrow=scopedSyncApi(api,run);
 await assert.rejects(narrow.write({itemType:'note',itemId:run,baseRevision:0,
  payload:{qa_run:true,run},deletedAt:null,opId:'fake'}),/SQA-WRITE-SCOPE/);
 assert.equal(data.size,0);
 assert.equal(safeSyncQaError(new Error('Bearer private-JWT')),'SQA-REQUEST-OR-SESSION');
});
test('remote hard-delete is limited to synthetic row, owner, exact revision, and verified empty readback',async()=>{
 const {api,data}=mock(),id=runId();
 await api.write({itemType:'preference',itemId:id,payload:{qa_run:true,run:id,stage:'seed'},
  deletedAt:null,opId:'fake',baseRevision:0});
 const jwt='aaa.bbb.ccc';
 let captured=null;
 const request=async(url,init)=>{
  captured={url,init};
  const u=new URL(url);
  assert.equal(u.pathname.endsWith('/li_user_state'),true);
  assert.equal(u.searchParams.get('item_type'),'eq.preference');
  assert.equal(u.searchParams.get('item_id'),'eq.'+id);
  assert.equal(u.searchParams.get('revision'),'eq.1');
  assert.equal(init.method,'DELETE');
  assert.equal(init.credentials,'omit');
  assert.equal(init.headers.Authorization,'Bearer '+jwt);
  data.delete(id);
  return new Response(JSON.stringify([]),{status:200});
 };
 assert.equal(await deleteRemoteQa(api,id,async()=>({accountId:user,jwt}),
 'https://api.test.example/li/rest/v1',request),true);
 assert.ok(captured);
 assert.equal(data.size,0);
 assert.equal(await deleteRemoteQa(api,id,async()=>{throw Error('No request needed');},
 'https://api.test.example/li/rest/v1',request),false);
});
test('remote hard-delete rejects non-QA content and never calls network',async()=>{
 const {api,data}=mock(),id=runId();
 data.set(id,{owner_id:user,item_type:'preference',item_id:id,revision:1,
  payload:{real:'not an experiment'},changed_at:'2026-11-20T00:00:00Z',deleted_at:null});
 let n=0;
 await assert.rejects(deleteRemoteQa(api,id,async()=>({accountId:user,jwt:'aaa.bbb.ccc'}),
 'https://api.test.example/li/rest/v1',async()=>{n++;throw Error('wrong request');}),/SQA-NOT-SYNTHETIC/);
 assert.equal(n,0);
 assert.equal(data.size,1);
});
