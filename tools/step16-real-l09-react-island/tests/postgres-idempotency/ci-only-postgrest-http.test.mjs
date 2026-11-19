import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';

const ROOT=process.env.LI_POSTGREST_CI_URL||'';
const SECRET=process.env.LI_POSTGREST_CI_SECRET||'';
const endpoint=new URL(ROOT);
if(endpoint.hostname!=='127.0.0.1'||endpoint.protocol!=='http:'||
   SECRET!=='li-ci-postgrest-hs256-secret-very-long-2026')
  throw new Error('CI_ONLY_LOCAL_POSTGREST_REQUIRED');

const jwt=(sub='synthetic-A',role='authenticated',expiry=Math.floor(Date.now()/1000)+3600)=>{
 const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
 const body=Buffer.from(JSON.stringify({sub,role,exp:expiry,iat:Math.floor(Date.now()/1000)}))
  .toString('base64url');
 const data=header+'.'+body;
 const mac=createHmac('sha256',SECRET).update(data).digest('base64url');
 return data+'.'+mac;
};
const USER_A=jwt(),USER_B=jwt('synthetic-B'),USER_C=jwt('synthetic-C');
const ID='__li_sync_qa_'+randomUUID();
const OP=randomUUID();
const payload={qa_run:true,run:ID,stage:'seed'};
const body=(id=ID,op=OP,base=0,value=payload)=>({
 p_item_type:'preference',p_item_id:id,p_base_revision:base,
 p_payload:value,p_deleted_at:null,p_op_id:op
});
const rpc='/rpc/li_apply_user_edit_v1';
const send=async(path,{token=USER_A,method='GET',json}={})=>{
 const headers={Accept:'application/json'};
 if(token!==null)headers.Authorization='Bearer '+token;
 if(json!==undefined)headers['Content-Type']='application/json';
 const response=await fetch(ROOT+path,{method,headers,
  ...(json===undefined?{}:{body:JSON.stringify(json)})});
 const text=await response.text();
 let data;
 try{data=JSON.parse(text);}catch{data=text;}
 return {status:response.status,data};
};
const post=(data,token=USER_A)=>send(rpc,{method:'POST',token,json:data});
let firstResponse;

test('REST-01: signed user A calls real PostgreSQL RPC, gets object ACK then replay',async()=>{
 const first=await post(body());
 assert.equal(first.status,200,JSON.stringify(first.data));
 assert.equal(first.data.protocol,'li-opid-v1');
 assert.equal(first.data.kind,'applied');
 assert.equal(first.data.op_id,OP);
 assert.equal(first.data.item.owner_id,'synthetic-A');
 assert.equal(first.data.item.item_id,ID);
 assert.equal(first.data.item.revision,1);
 firstResponse=first.data;
 const replay=await post(body());
 assert.equal(replay.status,200,JSON.stringify(replay.data));
 assert.equal(replay.data.kind,'replayed');
 assert.equal(replay.data.item.revision,1);
 assert.equal(replay.data.item.changed_at,first.data.item.changed_at);
});

test('REST-02: signed PATCH revision 2 succeeds and replay old op returns original revision 1',async()=>{
 const next=await post(body(ID,randomUUID(),1,{qa_run:true,run:ID,stage:'patch'}));
 assert.equal(next.status,200,JSON.stringify(next.data));
 assert.equal(next.data.item.revision,2);
 assert.equal(next.data.item.payload.stage,'patch');
 const replay=await post(body());
 assert.equal(replay.status,200,JSON.stringify(replay.data));
 assert.equal(replay.data.item.revision,firstResponse.item.revision);
 assert.equal(replay.data.item.payload.stage,'seed');
});

test('REST-03: reusing operation UUID with altered payload is genuine 409',async()=>{
 const res=await post(body(ID,OP,0,{qa_run:true,run:ID,stage:'tampered'}));
 assert.equal(res.status,409,JSON.stringify(res.data));
 assert.equal(res.data.code,'23505');
 assert.equal(res.data.message,'LI_SYNC_OP_ID_REUSED');
});

test('REST-04: distinct opId against stale base revision is 409, not overwrite',async()=>{
 const res=await post(body(ID,randomUUID(),0,{qa_run:true,run:ID,stage:'different'}));
 assert.equal(res.status,409,JSON.stringify(res.data));
 assert.equal(res.data.code,'23505');
 assert.equal(res.data.message,'LI_SYNC_REVISION_CONFLICT');
});

test('REST-05: invalid RPC input gets 400 SQLSTATE 22023',async()=>{
 const res=await post({...body('__invalid'),p_item_type:'invalid_record_type'});
 assert.equal(res.status,400,JSON.stringify(res.data));
 assert.equal(res.data.code,'22023');
 assert.equal(res.data.message,'LI_SYNC_INVALID_INPUT');
});

test('REST-06: uninvited signed account C denied by SQL and invitation gate',async()=>{
 const res=await post(body('__li_sync_qa_'+randomUUID(),randomUUID()),USER_C);
 assert.equal(res.status,403,JSON.stringify(res.data));
 assert.equal(res.data.code,'42501');
});

test('REST-07: no bearer token cannot execute protected RPC',async()=>{
 const res=await post(body('__li_sync_qa_'+randomUUID(),randomUUID()),null);
 assert.equal(res.status,401,JSON.stringify(res.data));
});

test('REST-08: forged signature is rejected before RPC',async()=>{
 const forged=USER_A.slice(0,-4)+'abcd';
 const res=await post(body('__li_sync_qa_'+randomUUID(),randomUUID()),forged);
 assert.equal(res.status,401,JSON.stringify(res.data));
 assert.ok(['PGRST301','PGRST303'].includes(res.data.code));
});

test('REST-09: expired signed JWT is denied before RPC',async()=>{
 const expired=jwt('synthetic-A','authenticated',Math.floor(Date.now()/1000)-60);
 const res=await post(body('__li_sync_qa_'+randomUUID(),randomUUID()),expired);
 assert.equal(res.status,401,JSON.stringify(res.data));
});

test('REST-10: direct table POST cannot bypass operation receipts',async()=>{
 const row={item_type:'preference',item_id:'__li_sync_qa_'+randomUUID(),
  revision:1,payload:{qa_run:true,stage:'bypass'}};
 const res=await send('/li_user_state',{method:'POST',json:row});
 assert.equal(res.status,403,JSON.stringify(res.data));
 assert.equal(res.data.code,'42501');
});

test('REST-11: nonexistent RPC returns 404 PGRST202; no implicit fallback',async()=>{
 const res=await send('/rpc/li_nonexistent_receipt_rpc',{method:'POST',json:{}});
 assert.equal(res.status,404,JSON.stringify(res.data));
 assert.equal(res.data.code,'PGRST202');
});

test('REST-12: B may reuse A opId on same item without seeing A data',async()=>{
 const result=await post(body(ID,OP,0,{qa_run:true,run:ID,stage:'owned-by-B'}),USER_B);
 assert.equal(result.status,200,JSON.stringify(result.data));
 assert.equal(result.data.item.owner_id,'synthetic-B');
 assert.equal(result.data.item.revision,1);
 const a=await send('/li_user_state?item_id=eq.'+encodeURIComponent(ID));
 const b=await send('/li_user_state?item_id=eq.'+encodeURIComponent(ID),{token:USER_B});
 assert.equal(a.status,200,JSON.stringify(a.data));
 assert.equal(b.status,200,JSON.stringify(b.data));
 assert.equal(a.data.length,1);
 assert.equal(b.data.length,1);
 assert.equal(a.data[0].owner_id,'synthetic-A');
 assert.equal(a.data[0].revision,2);
 assert.equal(b.data[0].owner_id,'synthetic-B');
 assert.equal(b.data[0].revision,1);
});

test('REST-13: uninvited C SELECT sees no rows in real PostgreSQL RLS',async()=>{
 const res=await send('/li_user_state',{token:USER_C});
 assert.equal(res.status,200,JSON.stringify(res.data));
 assert.deepEqual(res.data,[]);
});
