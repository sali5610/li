import test from 'node:test';
import assert from 'node:assert/strict';
import {NeonUserApi} from '../.sync-test/neon-api.js';
import {RevisionConflict} from '../.sync-test/contract.js';

const user='test-user-A';
const jwt=['e30',Buffer.from(JSON.stringify({sub:user,role:'authenticated'})).toString('base64url'),'signature'].join('.');
const endpoint='https://example.apirest.neon.tech/li/rest/v1';
const remote=(revision=1)=>({item_type:'lesson_attempt',item_id:'L09-1-2',revision,
  payload:{draft:'sample'},changed_at:'2026-11-19T00:00:00.000Z',deleted_at:null});
const ok=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const edit={itemType:'lesson_attempt',itemId:'L09-1-2',baseRevision:0,payload:{draft:'sample'},
 deletedAt:null,opId:'test-operation'};

test('isolates credentialless client and rejects malformed endpoint',()=>{
 assert.throws(()=>new NeonUserApi('http://example.test/rest/v1',async()=>jwt,user),/INVALID_NEON/);
 assert.throws(()=>new NeonUserApi(endpoint,async()=>jwt,''),/ACCOUNT_REQUIRED/);
});
test('JWT subject mismatch blocks network before any request',async()=>{
 let called=0;
 const api=new NeonUserApi(endpoint,async()=>jwt,'test-user-B',async()=>{called++;return ok([]);});
 await assert.rejects(api.all(),/ACCOUNT_MISMATCH/);
 assert.equal(called,0);
});
test('creates user-owned state WITHOUT owner_id and with bearer JWT',async()=>{
 const calls=[];
 const api=new NeonUserApi(endpoint,async()=>jwt,user,async(url,init)=>{
  calls.push({url,init});
  return init.method==='GET'?ok([]):ok([remote()],201);
 });
 const result=await api.write(edit);
 assert.equal(result.revision,1);
 assert.equal(calls.length,2);
 assert.equal(calls[1].init.method,'POST');
 assert.equal(JSON.parse(calls[1].init.body).owner_id,undefined);
 assert.equal(calls[1].init.headers.Authorization,'Bearer '+jwt);
 assert.match(calls[1].url,/li_user_state/);
});
test('uses revision-conditional PATCH, never blind overwrite',async()=>{
 const calls=[];
 const api=new NeonUserApi(endpoint,async()=>jwt,user,async(url,init)=>{
  calls.push({url,init});
  return init.method==='GET'?ok([remote()]):ok([remote(2)]);
 });
 const result=await api.write({...edit,baseRevision:1});
 assert.equal(result.revision,2);
 assert.equal(new URL(calls[1].url).searchParams.get('revision'),'eq.1');
 assert.equal(calls[1].init.method,'PATCH');
 assert.equal(JSON.parse(calls[1].init.body).owner_id,undefined);
});
test('stale remote version becomes explicit conflict; no overwrite',async()=>{
 let calls=0;
 const api=new NeonUserApi(endpoint,async()=>jwt,user,async()=>{calls++;return ok([remote(4)]);});
 await assert.rejects(api.write({...edit,baseRevision:1}),RevisionConflict);
 assert.equal(calls,1);
});
test('HTTP auth and free quota failures do not masquerade as saved',async()=>{
 const api=new NeonUserApi(endpoint,async()=>jwt,user,async()=>new Response('',{status:401}));
 await assert.rejects(api.all(),/HTTP_401/);
});
test('paginated RLS-scoped pull respects 100-row Data API cap',async()=>{
 const pages=[];
 const api=new NeonUserApi(endpoint,async()=>jwt,user,async(url)=>{
  const offset=Number(new URL(url).searchParams.get('offset'));
  pages.push(offset);
  return ok(offset===0?Array.from({length:100},(_,i)=>({...remote(),item_id:'L'+i})):
   [{...remote(),item_id:'last'}]);
 });
 const rows=await api.all();
 assert.equal(rows.length,101);
 assert.deepEqual(pages,[0,100]);
});
