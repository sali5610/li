import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {syncOnce} from '../.sync-test/sync-once.js';
import {NeonIdempotentPilotApi,IDEMPOTENT_RPC_NAME} from '../.sync-test/neon-idempotent-pilot.js';

const ACCOUNT='synthetic-http-owner';
const GATE={twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true};
const ENDPOINT='https://fake-gateway.invalid/li/rest/v1';
const ITEM=()=> '__li_sync_qa_'+crypto.randomUUID();
const token=()=>['e30',Buffer.from(JSON.stringify({
  sub:ACCOUNT,exp:Math.ceil(Date.now()/1000)+3600
})).toString('base64url'),'ci-signature-not-valid'].join('.');
const payload=id=>({qa_run:true,run:id,stage:'seed'});
const row=(input)=>({
  owner_id:ACCOUNT,item_type:input.p_item_type,item_id:input.p_item_id,
  revision:input.p_base_revision+1,payload:input.p_payload,
  changed_at:'2026-11-20T00:00:00Z',deleted_at:input.p_deleted_at
});
const reply=(status,body)=>({status,body});
const ack=input=>({
  protocol:'li-opid-v1',op_id:input.p_op_id,kind:'applied',item:row(input)
});
const error=(status,code,message='Synthetic error; contains no user data')=>
  reply(status,{code,message,details:null,hint:null});

/**
 * Real loopback TCP+HTTP+fetch, but NOT PostgREST/Neon:
 * - API client keeps an HTTPS-only synthetic Data API endpoint.
 * - Injected Requester rewrites each request to a temporary localhost server.
 * - The local mock does not validate real JWT signatures or SQL/RLS.
 * - No HTTP call to an outside network or any learner endpoint is possible.
 */
async function localGateway(dispatch){
  const requests=[];
  const server=createServer(async(req,res)=>{
    try{
      const chunks=[];
      for await(const chunk of req)chunks.push(chunk);
      const data=Buffer.concat(chunks).toString();
      const call={method:req.method,path:new URL(req.url,'http://localhost').pathname,
        search:new URL(req.url,'http://localhost').search,authorization:req.headers.authorization,
        json:data?JSON.parse(data):null};
      requests.push(call);
      const result=await dispatch(call,requests.length);
      res.writeHead(result.status,{'Content-Type':result.type||'application/json',
        'Cache-Control':'no-store'});
      res.end(result.body===undefined?'':typeof result.body==='string'&&result.raw
        ?result.body:JSON.stringify(result.body));
    }catch{
      res.writeHead(500,{'Content-Type':'application/json'});
      res.end(JSON.stringify({code:'CI_HANDLER_ERROR'}));
    }
  });
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const local='http://127.0.0.1:'+server.address().port;
  const request=async(input,init)=>{
    const dest=new URL(input);
    assert.equal(dest.protocol,'https:');
    assert.equal(dest.origin,'https://fake-gateway.invalid');
    assert.ok(dest.pathname.startsWith('/li/rest/v1/'));
    return fetch(local+dest.pathname+dest.search,init);
  };
  return{requests,request,async close(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
const db=()=>new PrivateDeviceStore('li-http-wire-'+crypto.randomUUID());
async function closeDb(store){try{store.close();await store.delete();}catch{store.close();}}
async function setup(dispatch){
  const gateway=await localGateway(dispatch);
  const store=db();
  const api=new NeonIdempotentPilotApi(ENDPOINT,async()=>token(),ACCOUNT,gateway.request);
  return{gateway,store,api,async close(){await closeDb(store);await gateway.close();}};
}
const onlyRpc=(handler)=>(call,index)=>{
  if(call.method==='POST'&&call.path==='/li/rest/v1/rpc/'+IDEMPOTENT_RPC_NAME)
    return handler(call,index);
  if(call.method==='GET'&&call.path==='/li/rest/v1/li_user_state')
    return reply(200,[]);
  throw new Error('unexpected direct write/unknown endpoint');
};
async function queued(ctx,id=ITEM()){
  await ctx.store.edit(ACCOUNT,'preference',id,payload(id));
  return id;
}
const pending=async ctx=>ctx.store.pending(ACCOUNT);

test('WIRE-01: real fetch POST has owner-free RPC body, no cookies, success ack then GET',async()=>{
  const ctx=await setup(onlyRpc(call=>reply(200,ack(call.json))));
  try{
    const id=await queued(ctx);
    const result=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
    assert.deepEqual([result.mode,result.uploaded,result.pending],['synced',1,0]);
    assert.equal((await ctx.store.accountRecords(ACCOUNT))[0].baseRevision,1);
    assert.equal(ctx.gateway.requests.length,2);
    const [write,read]=ctx.gateway.requests;
    assert.equal(write.method,'POST');
    assert.equal(write.path,'/li/rest/v1/rpc/'+IDEMPOTENT_RPC_NAME);
    assert.equal(write.json.p_item_id,id);
    assert.equal(write.json.p_base_revision,0);
    assert.match(write.json.p_op_id,/^[0-9a-f-]{36}$/);
    assert.equal(Object.hasOwn(write.json,'owner_id'),false);
    assert.ok(write.authorization?.startsWith('Bearer '));
    assert.equal(read.method,'GET');
    assert.equal(read.path,'/li/rest/v1/li_user_state');
    assert.equal(await pending(ctx).then(x=>x.length),0);
  }finally{await ctx.close();}
});

for(const status of [409,412]){
  test('WIRE-02: HTTP '+status+' becomes explicit conflict and keeps local payload',async()=>{
    const ctx=await setup(onlyRpc(()=>error(status,'23505','LI_SYNC_REVISION_CONFLICT')));
    try{
      const id=await queued(ctx);
      const result=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
      assert.equal(result.mode,'conflict');
      assert.equal(result.conflicts,1);
      assert.equal(result.uploaded,0);
      assert.equal((await ctx.store.accountRecords(ACCOUNT))[0].payload.run,id);
      assert.equal((await ctx.store.outbox.toArray())[0].conflict,true);
      assert.equal(ctx.gateway.requests.length,2); // GET after explicit conflict
      assert.ok(ctx.gateway.requests.every(x=>x.method!=='PATCH'));
    }finally{await ctx.close();}
  });
}

for(const status of [401,403]){
  test('WIRE-03: HTTP '+status+' is sign-in-required with pending outbox',async()=>{
    const ctx=await setup(onlyRpc(()=>error(status,status===401?'PGRST301':'42501')));
    try{
      await queued(ctx);
      const result=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
      assert.equal(result.mode,'sign-in-required');
      assert.equal(result.uploaded,0);
      assert.equal(result.pending,1);
      assert.equal(ctx.gateway.requests.length,1); // no GET after revoked upload
    }finally{await ctx.close();}
  });
}

test('WIRE-04: missing PostgREST RPC PGRST202 / 404 fails closed',async()=>{
  const ctx=await setup(onlyRpc(()=>error(404,'PGRST202')));
  try{
    await queued(ctx);
    const result=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
    assert.equal(result.mode,'security-error');
    assert.equal(result.pending,1);
    assert.equal(result.uploaded,0);
    assert.equal(ctx.gateway.requests.length,1);
  }finally{await ctx.close();}
});

for(const status of [400,406,415,422]){
  test('WIRE-05: HTTP '+status+' permanent request rejection is security-error, not offline',async()=>{
    const ctx=await setup(onlyRpc(()=>error(status,'22023','invalid input; fake-secret-ci-only')));
    try{
      const id=await queued(ctx);
      const result=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
      assert.equal(result.mode,'security-error');
      assert.equal(result.pending,1);
      assert.equal((await ctx.store.accountRecords(ACCOUNT))[0].payload.run,id);
      assert.equal(ctx.gateway.requests.length,1);
    }finally{await ctx.close();}
  });
}

for(const status of [408,429,502,503]){
  test('WIRE-06: HTTP '+status+' transient HTTP failure retains retryable pending edit',async()=>{
    const ctx=await setup(onlyRpc(()=>error(status,'PGRST_TRANSIENT')));
    try{
      await queued(ctx);
      const result=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
      assert.equal(result.mode,'offline');
      assert.equal(result.pending,1);
      assert.equal(result.uploaded,0);
      assert.equal((await pending(ctx)).length,1);
    }finally{await ctx.close();}
  });
}

for(const shape of ['wrong-op-id','wrong-owner','wrong-revision','wrong-protocol','array','not-json','no-content']){
  test('WIRE-07: HTTP success with '+shape+' ACK fails closed',async()=>{
    const ctx=await setup(onlyRpc(call=>{
      const a=ack(call.json);
      if(shape==='wrong-op-id')a.op_id=crypto.randomUUID();
      if(shape==='wrong-owner')a.item.owner_id='synthetic-other';
      if(shape==='wrong-revision')a.item.revision=9;
      if(shape==='wrong-protocol')a.protocol='danger-v2';
      if(shape==='array')return reply(200,[a]);
      if(shape==='not-json')return{status:200,type:'text/plain',body:'not JSON',raw:true};
      if(shape==='no-content')return{status:204};
      return reply(200,a);
    }));
    try{
      await queued(ctx);
      const result=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
      assert.equal(result.mode,'security-error');
      assert.equal(result.pending,1);
      assert.equal(result.uploaded,0);
    }finally{await ctx.close();}
  });
}

test('WIRE-08: auth failure after earlier CAS conflict takes precedence over conflict state',async()=>{
  let uploads=0;
  const ctx=await setup(onlyRpc(()=>{
    uploads++;
    return uploads===1?error(409,'23505','LI_SYNC_REVISION_CONFLICT')
      :error(401,'PGRST301','signed JWT no longer valid');
  }));
  try{
    await queued(ctx);
    await queued(ctx);
    const result=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
    assert.equal(result.mode,'sign-in-required');
    assert.equal(result.conflicts,1);
    assert.equal(result.pending,1);
    assert.equal(result.uploaded,0);
    assert.equal(uploads,2);
  }finally{await ctx.close();}
});

test('WIRE-09: 503 then recovered HTTP 200 retries SAME durable opId, not a fresh edit',async()=>{
  let uploads=0;
  const ctx=await setup(onlyRpc(call=>{
    uploads++;
    return uploads===1?error(503,'PGRST503'):reply(200,ack(call.json));
  }));
  try{
    await queued(ctx);
    const first=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
    assert.equal(first.mode,'offline');
    assert.equal(first.pending,1);
    const kept=(await pending(ctx))[0].opId;
    const second=await syncOnce(ctx.store,ctx.api,ACCOUNT,GATE);
    assert.equal(second.mode,'synced');
    assert.equal(second.pending,0);
    const posts=ctx.gateway.requests.filter(x=>x.method==='POST');
    assert.equal(posts.length,2);
    assert.equal(posts[0].json.p_op_id,kept);
    assert.equal(posts[1].json.p_op_id,kept);
    assert.ok(ctx.gateway.requests.every(x=>x.method!=='PATCH'));
  }finally{await ctx.close();}
});
