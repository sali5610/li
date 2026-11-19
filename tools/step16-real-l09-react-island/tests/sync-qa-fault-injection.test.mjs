import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateDeviceStore} from '../.sync-qa-test/sync/local-dexie.js';
import {syncOnce} from '../.sync-qa-test/sync/sync-once.js';
import {RevisionConflict} from '../.sync-qa-test/sync/contract.js';
import {NeonUserApi} from '../.sync-test/neon-api.js';
import {bindNeonAccount} from '../.sync-test/neon-session.js';
import {newSyncQaId} from '../.sync-qa-test/auth/sync-qa.js';

/**
 * SYNC-08: fault-injection QA ONLY.
 * No live Neon access, no passwords or real learner records.
 * Each test owns its own fake IndexedDB and synthetic preference identifier.
 */
const userA = 'synthetic-account-A';
const userB = 'synthetic-account-B';
const gate = {twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true};
const payload = id => ({qa_run:true,run:id,stage:'seed'});
const freshName = () => 'li-sync-auto-fault-'+crypto.randomUUID();
const freshStore = () => new PrivateDeviceStore(freshName());
async function destroy(store){
  try{store.close();await store.delete();}catch{store.close();}
}
function row(accountId,id,revision,value=payload(id)){
  return {owner_id:accountId,item_type:'preference',item_id:id,revision,
    payload:value,changed_at:'2026-11-20T00:00:00.000Z',deleted_at:null};
}
function fakeApi(accountId){
  const data = new Map();
  const calls = {write:0,read:0};
  const api = {
    accountId,
    async write(edit){
      calls.write++;
      assert.equal(edit.itemType,'preference');
      assert.match(edit.itemId,/^__li_sync_qa_[0-9a-f-]{36}$/i);
      const old=data.get(edit.itemId);
      if((old?.revision??0)!==edit.baseRevision)throw new RevisionConflict();
      const next=row(accountId,edit.itemId,edit.baseRevision+1,edit.payload);
      data.set(edit.itemId,next);
      return next;
    },
    async all(){
      calls.read++;
      return [...data.values()];
    }
  };
  return {api,data,calls};
}
async function seed(store,accountId,id){
  await store.edit(accountId,'preference',id,payload(id));
}

test('AUTO-NET-01: offline upload retains outbox and retries exactly once after recovery',async()=>{
  const db=freshStore(),id=newSyncQaId(),{api,data,calls}=fakeApi(userA);
  let failed=false;
  const guarded={...api,async write(edit){
    if(!failed){failed=true;throw new TypeError('Failed to fetch');}
    return api.write(edit);
  }};
  try{
    await seed(db,userA,id);
    const offline=await syncOnce(db,guarded,userA,gate);
    assert.equal(offline.mode,'offline');
    assert.equal(offline.pending,1);
    assert.equal(offline.uploaded,0);
    assert.equal((await db.accountRecords(userA))[0].payload.run,id);
    assert.equal(data.size,0);
    const resumed=await syncOnce(db,guarded,userA,gate);
    assert.equal(resumed.mode,'synced');
    assert.equal(resumed.uploaded,1);
    assert.equal(resumed.pending,0);
    assert.equal(data.get(id).revision,1);
    assert.equal(calls.write,1);
    assert.equal((await db.pending(userA)).length,0);
  }finally{await destroy(db);}
});

test('AUTO-NET-02: download timeout after confirmed upload does not re-upload or discard local state',async()=>{
  const db=freshStore(),id=newSyncQaId(),{api,data,calls}=fakeApi(userA);
  let readFailed=false;
  const guarded={...api,async all(){
    if(!readFailed){readFailed=true;throw new TypeError('Network unreachable during GET');}
    return api.all();
  }};
  try{
    await seed(db,userA,id);
    const interrupted=await syncOnce(db,guarded,userA,gate);
    assert.equal(interrupted.mode,'offline');
    assert.equal(interrupted.uploaded,1);
    assert.equal(interrupted.pending,0);
    assert.equal(data.get(id).revision,1);
    const restored=await syncOnce(db,guarded,userA,gate);
    assert.equal(restored.mode,'synced');
    assert.equal(restored.uploaded,0);
    assert.equal(calls.write,1);
    assert.equal((await db.accountRecords(userA))[0].baseRevision,1);
  }finally{await destroy(db);}
});

test('AUTO-NET-03 known gap: lost server ACK creates explicit conflict, never silent success or local data loss',async()=>{
  const db=freshStore(),id=newSyncQaId(),{api,data}=fakeApi(userA);
  let loseAck=true;
  const guarded={...api,async write(edit){
    const result=await api.write(edit);
    if(loseAck){loseAck=false;throw new TypeError('Connection reset before ACK');}
    return result;
  }};
  try{
    await seed(db,userA,id);
    const first=await syncOnce(db,guarded,userA,gate);
    assert.equal(first.mode,'offline');
    assert.equal(first.pending,1);
    assert.equal(data.get(id).revision,1);
    const retry=await syncOnce(db,guarded,userA,gate);
    // This is a documented release blocker, not an idempotency PASS:
    // backend committed once but the outbox cannot confirm the lost ACK.
    assert.equal(retry.mode,'conflict');
    assert.equal(retry.conflicts,1);
    assert.equal(retry.uploaded,0);
    assert.equal(data.get(id).revision,1);
    assert.equal((await db.accountRecords(userA))[0].payload.run,id);
    assert.equal((await db.outbox.toArray())[0].conflict,true);
  }finally{await destroy(db);}
});

test('AUTO-AUTH-01: session subject changes after bind; no network request and pending is retained',async()=>{
  const db=freshStore(),id=newSyncQaId();
  let current=userA,requests=0;
  const auth={
    async getSession(){return {data:{user:{id:current}}};},
    async getJWTToken(){return 'header.payload.signature';}
  };
  try{
    const api=await bindNeonAccount('https://api.example.test/li/rest/v1',auth,async()=>{
      requests++;throw Error('network must not be reached');
    });
    assert.ok(api);
    await seed(db,userA,id);
    current=userB;
    const result=await syncOnce(db,api,userA,gate);
    assert.equal(result.mode,'sign-in-required');
    assert.equal(result.pending,1);
    assert.equal(requests,0);
  }finally{await destroy(db);}
});

test('AUTO-AUTH-02: mismatched JWT sub cannot issue any Data API request',async()=>{
  const db=freshStore(),id=newSyncQaId();
  let requests=0;
  const token='header.'+Buffer.from(JSON.stringify({sub:userB})).toString('base64url')+'.signature';
  const api=new NeonUserApi('https://api.example.test/li/rest/v1',async()=>token,userA,async()=>{
    requests++;throw Error('unexpected request');
  });
  try{
    await seed(db,userA,id);
    const result=await syncOnce(db,api,userA,gate);
    assert.equal(result.mode,'sign-in-required');
    assert.equal(result.pending,1);
    assert.equal(requests,0);
  }finally{await destroy(db);}
});

test('AUTO-AUTH-03: revoked HTTP 401 is not mistaken for offline or an uploaded record',async()=>{
  const db=freshStore(),id=newSyncQaId();
  let requests=0;
  const token='header.'+Buffer.from(JSON.stringify({sub:userA})).toString('base64url')+'.signature';
  const api=new NeonUserApi('https://api.example.test/li/rest/v1',async()=>token,userA,async()=>{
    requests++;
    return new Response(JSON.stringify({code:'revoked'}),{status:401});
  });
  try{
    await seed(db,userA,id);
    const result=await syncOnce(db,api,userA,gate);
    assert.equal(result.mode,'sign-in-required');
    assert.equal(result.pending,1);
    assert.equal(result.uploaded,0);
    assert.equal(requests,1);
  }finally{await destroy(db);}
});

test('AUTO-ACCOUNT-01: same physical IndexedDB remains account-scoped after switching users',async()=>{
  const db=freshStore(),idA=newSyncQaId(),idB=newSyncQaId();
  const {api:apiB,data:dataB}=fakeApi(userB);
  try{
    await seed(db,userA,idA);
    await seed(db,userB,idB);
    await assert.rejects(syncOnce(db,apiB,userA,gate),/ACCOUNT_BINDING_REQUIRED/);
    const report=await syncOnce(db,apiB,userB,gate);
    assert.equal(report.mode,'synced');
    assert.equal(report.uploaded,1);
    assert.equal(report.pending,0);
    assert.equal(dataB.has(idA),false);
    assert.equal(dataB.has(idB),true);
    assert.equal((await db.pending(userA)).length,1);
    assert.equal((await db.accountRecords(userA))[0].itemId,idA);
    assert.equal((await db.accountRecords(userB))[0].itemId,idB);
  }finally{await destroy(db);}
});

test('AUTO-RECOVER-01: close/reopen fake IndexedDB preserves pending edit after failure',async()=>{
  const name=freshName(),id=newSyncQaId();
  let db=new PrivateDeviceStore(name);
  const {api,data}=fakeApi(userA);
  try{
    await seed(db,userA,id);
    const offline=await syncOnce(db,{...api,async write(){throw TypeError('Offline');}},userA,gate);
    assert.equal(offline.mode,'offline');
    assert.equal(offline.pending,1);
    db.close();
    db=new PrivateDeviceStore(name);
    assert.equal((await db.pending(userA)).length,1);
    const recovered=await syncOnce(db,api,userA,gate);
    assert.equal(recovered.mode,'synced');
    assert.equal(data.get(id).revision,1);
    assert.equal((await db.pending(userA)).length,0);
  }finally{await destroy(db);}
});

test('AUTO-GATE-01: privacy gate defaults closed and causes zero remote calls',async()=>{
  const db=freshStore(),id=newSyncQaId(),{api,calls}=fakeApi(userA);
  try{
    await seed(db,userA,id);
    const report=await syncOnce(db,api,userA);
    assert.equal(report.mode,'local-only');
    assert.equal(report.pending,1);
    assert.equal(calls.write,0);
    assert.equal(calls.read,0);
  }finally{await destroy(db);}
});
