import test from 'node:test';
import assert from 'node:assert/strict';
import {NeonUserApi} from '../.sync-test/neon-api.js';
import {RevisionConflict} from '../.sync-test/contract.js';

const account='signed-test-owner-A';
const jwt='e30.'+Buffer.from(JSON.stringify({sub:account,role:'authenticated'})).toString('base64url')+'.signature';
const endpoint='https://example.apirest.neon.tech/li/rest/v1';
const opId='530bfc46-9c72-4ec8-b9cd-65d8c19ad1a3';
const ack=(rows,status=200)=>new Response(JSON.stringify(rows),{status,headers:{'Content-Type':'application/json'}});
const edit=(baseRevision=0,payload={source:'local',facts:{b:2,a:1}},deletedAt=null)=>({
 itemType:'note',itemId:'synthetic-note',payload,deletedAt,baseRevision,opId
});
const asRemote=(revision,payload,lastOp=opId,deletedAt=null)=>({
 owner_id:account,item_type:'note',item_id:'synthetic-note',revision,
 payload,changed_at:'2026-11-20T00:00:00.000Z',deleted_at:deletedAt,last_op_id:lastOp
});
function simulatedRest(start=null){
 let stored=start,posts=0,patches=0,dropNext=true;
 const request=async(url,init)=>{
  const method=init.method;
  if(method==='GET')return ack(stored?[stored]:[]);
  const body=JSON.parse(init.body);
  assert.equal(body.owner_id,undefined,'owner is server-derived');
  assert.equal(body.last_op_id,opId,'operation marker must reach server');
  if(method==='POST')posts++;
  else if(method==='PATCH')patches++;
  else throw new Error('unexpected method');
  if(stored&&method==='POST')return ack([],409);
  const revision=stored?stored.revision+1:1;
  stored=asRemote(revision,body.payload,body.last_op_id,body.deleted_at);
  // Simulate SQL transaction committed, but browser never received the ACK.
  if(dropNext){dropNext=false;throw new TypeError('transport lost server ACK');}
  return ack([stored],method==='POST'?201:200);
 };
 return{request,stats:()=>({posts,patches,stored})};
}
test('INSERT committed + lost ACK: durable retry acknowledges the exact op once',async()=>{
 const srv=simulatedRest();
 const api=new NeonUserApi(endpoint,async()=>jwt,account,srv.request);
 await assert.rejects(api.write(edit()),/transport lost/);
 const remote=await api.write(edit());
 assert.equal(remote.revision,1);
 assert.deepEqual(srv.stats().posts,1,'retry must not send another POST');
 assert.equal(remote.last_op_id,opId);
});
test('PATCH committed + lost ACK: retry recovers same op and original revision',async()=>{
 const srv=simulatedRest(asRemote(4,{before:true},'old-op'));
 const api=new NeonUserApi(endpoint,async()=>jwt,account,srv.request);
 const next=edit(4,{source:'updated'});
 await assert.rejects(api.write(next),/transport lost/);
 const remote=await api.write(next);
 assert.equal(remote.revision,5);
 assert.equal(srv.stats().patches,1);
});
test('same opId with different payload is never falsely acknowledged',async()=>{
 const srv=simulatedRest(asRemote(1,{actual:true}));
 const api=new NeonUserApi(endpoint,async()=>jwt,account,srv.request);
 await assert.rejects(api.write(edit(0,{malicious:true})),RevisionConflict);
 assert.equal(srv.stats().posts,0);
});
test('same opId on a later revision must NOT bypass a concurrent edit',async()=>{
 const srv=simulatedRest(asRemote(2,{source:'local'}));
 const api=new NeonUserApi(endpoint,async()=>jwt,account,srv.request);
 await assert.rejects(api.write(edit(0,{source:'local'})),RevisionConflict);
 assert.equal(srv.stats().posts,0);
});
test('deleted_at must match timestamp semantics, not merely operation UUID',async()=>{
 const gone='2026-11-20T02:00:00.000Z';
 const srv=simulatedRest(asRemote(1,{source:'local',facts:{a:1,b:2}},opId,'2026-11-20T02:00:00+00:00'));
 const api=new NeonUserApi(endpoint,async()=>jwt,account,srv.request);
 const recovered=await api.write(edit(0,{facts:{b:2,a:1},source:'local'},gone));
 assert.equal(recovered.revision,1);
 assert.equal(srv.stats().posts,0);
 await assert.rejects(api.write(edit(0,{facts:{b:2,a:1},source:'local'},'2026-11-20T03:00:00.000Z')),RevisionConflict);
});
