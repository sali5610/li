import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {syncOnce} from '../.sync-test/sync-once.js';
import {RevisionConflict} from '../.sync-test/contract.js';
import {NeonIdempotentPilotApi,IDEMPOTENT_RPC_NAME} from '../.sync-test/neon-idempotent-pilot.js';

const endpoint='https://example.apirest.neon.tech/li/rest/v1';
const A='synthetic-A',B='synthetic-B';
const gate={twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true};
const jwt=sub=>['e30',Buffer.from(JSON.stringify({sub,exp:Math.ceil(Date.now()/1000)+3600})).toString('base64url'),'sig'].join('.');
const id=()=> '__li_sync_qa_'+crypto.randomUUID();
const body=key=>({qa_run:true,run:key,stage:'seed'});
const edit=(key,base=0,value=body(key),opId=crypto.randomUUID())=>({
 itemType:'preference',itemId:key,baseRevision:base,payload:value,deletedAt:null,opId
});
const ok=(value,status=200)=>new Response(JSON.stringify(value),{
 status,headers:{'Content-Type':'application/json'}
});
function simulatedRpc({forbid=null}={}){
 const current=new Map(),receipts=new Map();
 const calls={rpc:0,read:0,legacy:0,all:0};
 let suppressAck=false;
 const request=async(url,options={})=>{
  const uri=new URL(url),method=options.method??'GET';
  const bearer=String(options.headers?.Authorization||'');
  let sub='';
  try{sub=JSON.parse(Buffer.from(bearer.split('.')[1]||'','base64url').toString()).sub;}
  catch{return ok({code:'JWT_MISSING'},401);}
  if(forbid===sub)return ok({code:'ACCESS_REVOKED'},403);
  if(uri.pathname.endsWith('/rpc/'+IDEMPOTENT_RPC_NAME)){
   calls.rpc++;
   assert.equal(method,'POST');
   assert.equal(options.credentials,'omit');
   assert.equal(options.cache,'no-store');
   const x=JSON.parse(options.body);
   assert.equal(Object.hasOwn(x,'owner_id'),false);
   const recordKey=JSON.stringify([sub,x.p_item_type,x.p_item_id]);
   const receiptKey=JSON.stringify([sub,x.p_op_id]);
   const fingerprint=JSON.stringify([x.p_item_type,x.p_item_id,x.p_base_revision,
     x.p_payload,x.p_deleted_at]);
   const oldReceipt=receipts.get(receiptKey);
   if(oldReceipt){
    if(oldReceipt.fingerprint!==fingerprint)return ok({code:'OP_ID_REUSED'},409);
    return ok({protocol:'li-opid-v1',op_id:x.p_op_id,kind:'replayed',item:oldReceipt.item});
   }
   const before=current.get(recordKey);
   if((before?.revision??0)!==x.p_base_revision)return ok({code:'REVISION_CONFLICT'},409);
   const row={owner_id:sub,item_type:x.p_item_type,item_id:x.p_item_id,
    revision:x.p_base_revision+1,payload:x.p_payload,
    changed_at:'2026-11-20T00:00:00.000Z',deleted_at:x.p_deleted_at};
   current.set(recordKey,row);
   receipts.set(receiptKey,{fingerprint,item:row});
   if(suppressAck){suppressAck=false;throw new TypeError('ACK lost after COMMIT');}
   return ok({protocol:'li-opid-v1',op_id:x.p_op_id,kind:'applied',item:row});
  }
  if(uri.pathname.endsWith('/li_user_state')&&method==='GET'){
   calls.read++;
   const q=uri.searchParams;
   const visible=[...current.values()].filter(x=>x.owner_id===sub)
    .filter(x=>!q.has('item_type')||'eq.'+x.item_type===q.get('item_type'))
    .filter(x=>!q.has('item_id')||'eq.'+x.item_id===q.get('item_id'));
   return ok(visible);
  }
  calls.legacy++;throw new Error('Unexpected legacy write or endpoint');
 };
 const connect=(account=A,token=jwt(account))=>
  new NeonIdempotentPilotApi(endpoint,async()=>token,account,request);
 return {current,receipts,calls,connect,request,loseNextAck(){suppressAck=true;}};
}
const store=()=>new PrivateDeviceStore('li-idempotency-mock-'+crypto.randomUUID());
async function close(db){try{db.close();await db.delete();}catch{db.close();}}
async function makeEdit(db,account,key){await db.edit(account,'preference',key,body(key));}

test('OPID-01: lost ACK on INSERT replays same op and clears durable outbox without conflict',async()=>{
 const server=simulatedRpc(),db=store(),key=id(),api=server.connect();
 try{
  await makeEdit(db,A,key);
  const [original]=await db.pending(A);
  server.loseNextAck();
  const disconnected=await syncOnce(db,api,A,gate);
  assert.equal(disconnected.mode,'offline');
  assert.equal(disconnected.pending,1);
  assert.equal(server.receipts.size,1);
  assert.equal(server.current.size,1);
  assert.equal((await db.pending(A))[0].opId,original.opId);
  const recovered=await syncOnce(db,api,A,gate);
  assert.equal(recovered.mode,'synced');
  assert.equal(recovered.uploaded,1);
  assert.equal(recovered.pending,0);
  assert.equal(recovered.conflicts,0);
  assert.equal(server.current.size,1);
  assert.equal(server.receipts.size,1);
  assert.equal(server.calls.rpc,2);
  assert.equal(server.calls.legacy,0);
 }finally{await close(db);}
});

test('OPID-02: lost ACK on PATCH safely replays without extra revision increment',async()=>{
 const server=simulatedRpc(),db=store(),key=id(),api=server.connect();
 try{
  await makeEdit(db,A,key);
  assert.equal((await syncOnce(db,api,A,gate)).mode,'synced');
  await db.edit(A,'preference',key,{qa_run:true,run:key,stage:'patch'});
  server.loseNextAck();
  const first=await syncOnce(db,api,A,gate);
  assert.equal(first.mode,'offline');
  assert.equal(first.pending,1);
  assert.equal((await api.one('preference',key)).revision,2);
  const retried=await syncOnce(db,api,A,gate);
  assert.equal(retried.mode,'synced');
  assert.equal(retried.conflicts,0);
  assert.equal((await api.one('preference',key)).revision,2);
  assert.equal((await db.accountRecords(A))[0].baseRevision,2);
  assert.equal(server.receipts.size,2);
 }finally{await close(db);}
});

test('OPID-03: altered payload using prior operation UUID is rejected, not acknowledged',async()=>{
 const server=simulatedRpc(),api=server.connect(),key=id(),op=crypto.randomUUID();
 const first=edit(key,0,body(key),op);
 assert.equal((await api.write(first)).revision,1);
 await assert.rejects(api.write({...first,payload:{qa_run:true,run:key,stage:'forged'}}),
  RevisionConflict);
 assert.equal((await api.one('preference',key)).payload.stage,'seed');
 assert.equal(server.receipts.size,1);
});

test('OPID-04: another operation UUID using stale revision remains a REAL conflict',async()=>{
 const server=simulatedRpc(),api=server.connect(),key=id();
 const initial=edit(key);
 assert.equal((await api.write(initial)).revision,1);
 await assert.rejects(api.write(edit(key,0,{qa_run:true,run:key,stage:'other'})),
  RevisionConflict);
 assert.equal(server.receipts.size,1);
});

test('OPID-05: old op replay after newer revision returns original ACK then reads current state',async()=>{
 const server=simulatedRpc(),api=server.connect(),key=id();
 const first=edit(key);
 const initial=await api.write(first);
 assert.equal(initial.revision,1);
 assert.equal((await api.write(edit(key,1,{qa_run:true,run:key,stage:'later'}))).revision,2);
 const replay=await api.write(first);
 assert.equal(replay.revision,1);
 assert.equal(replay.payload.stage,'seed');
 assert.equal((await api.one('preference',key)).revision,2);
 assert.equal(server.receipts.size,2);
});

test('OPID-06: JWT subject mismatch and expired JWT fail BEFORE any request',async()=>{
 const server=simulatedRpc(),key=id();
 const mismatch=server.connect(A,jwt(B));
 await assert.rejects(mismatch.write(edit(key)),/ACCOUNT_MISMATCH/);
 const expired=['e30',Buffer.from(JSON.stringify({sub:A,exp:100})).toString('base64url'),'sig'].join('.');
 await assert.rejects(server.connect(A,expired).write(edit(key)),/JWT_EXPIRED/);
 assert.equal(server.calls.rpc,0);
 assert.equal(server.calls.read,0);
});

test('OPID-07: revoked 403 cannot be treated as a successful replay',async()=>{
 const server=simulatedRpc({forbid:A}),db=store(),key=id();
 try{
  await makeEdit(db,A,key);
  const report=await syncOnce(db,server.connect(),A,gate);
  assert.equal(report.mode,'sign-in-required');
  assert.equal(report.pending,1);
  assert.equal(report.uploaded,0);
  assert.equal(server.current.size,0);
 }finally{await close(db);}
});

test('OPID-08: absent RPC is fail-closed; never falls back to legacy direct writes',async()=>{
 let count=0;
 const api=new NeonIdempotentPilotApi(endpoint,async()=>jwt(A),A,async(url,init)=>{
  count++;
  assert.equal(init.method,'POST');
  assert.match(url,/\/rpc\/li_apply_user_edit_v1$/);
  return ok({code:'PGRST202'},404);
 });
 await assert.rejects(api.write(edit(id())),/NEON_SYNC_RPC_UNAVAILABLE/);
 assert.equal(count,1);
});

test('OPID-09: spoofed operation ACK or owner is rejected',async()=>{
 const key=id(),op=crypto.randomUUID(),row={owner_id:A,item_type:'preference',
  item_id:key,revision:1,payload:body(key),changed_at:'2026-11-20T00:00:00Z',deleted_at:null};
 const operation=edit(key,0,body(key),op);
 const badAck=new NeonIdempotentPilotApi(endpoint,async()=>jwt(A),A,
  async()=>ok({protocol:'li-opid-v1',op_id:crypto.randomUUID(),kind:'replayed',item:row}));
 await assert.rejects(badAck.write(operation),/INVALID_RPC_ACK/);
 const badOwner=new NeonIdempotentPilotApi(endpoint,async()=>jwt(A),A,
  async()=>ok({protocol:'li-opid-v1',op_id:op,kind:'applied',
   item:{...row,owner_id:B}}));
 await assert.rejects(badOwner.write(operation),/REMOTE_OWNER_MISMATCH/);
});

test('OPID-10: default privacy gate keeps new adapter local-only with zero requests',async()=>{
 const server=simulatedRpc(),db=store(),key=id();
 try{
  await makeEdit(db,A,key);
  const report=await syncOnce(db,server.connect(),A);
  assert.equal(report.mode,'local-only');
  assert.equal(report.pending,1);
  assert.equal(server.calls.rpc,0);
  assert.equal(server.calls.read,0);
 }finally{await close(db);}
});

test('OPID-11: missing RPC surfaces security-error, not a fake offline success',async()=>{
 const db=store(),key=id();
 const api=new NeonIdempotentPilotApi(endpoint,async()=>jwt(A),A,
  async()=>ok({code:'PGRST202'},404));
 try{
  await makeEdit(db,A,key);
  const result=await syncOnce(db,api,A,gate);
  assert.equal(result.mode,'security-error');
  assert.equal(result.pending,1);
  assert.equal(result.uploaded,0);
  assert.equal(result.conflicts,0);
 }finally{await close(db);}
});
