import test from 'node:test';
import assert from 'node:assert/strict';
import {runSignedReceiptCanary} from '../.sync-test/receipt-canary.js';

const endpoint='https://neon.test/li/rest/v1';
const owner='canary-owner-A';
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const token=`eyJhbGciOiJub25lIn0.${b64({sub:owner,exp:4102444800})}.signature`;
const json=(v,status=200)=>new Response(JSON.stringify(v),{
 status,headers:{'Content-Type':'application/json'}
});
function harness(options={}){
 const records=new Map(),receipts=new Map();
 let rpcCalls=0,deleteCalls=0;
 const auth={
  async getSession(){return {data:{user:{id:owner}}};},
  async getJWTToken(){return token;}
 };
 const request=async(raw,init={})=>{
  const url=new URL(raw);const method=init.method||'GET';
  if(url.pathname.endsWith('/rpc/li_is_invited'))
   return json(options.invited===false?false:true);
  if(url.pathname.endsWith('/rpc/li_apply_user_edit_v1')){
   rpcCalls++;
   if(options.rpcUnavailable)return json({code:'PGRST202'},404);
   const args=JSON.parse(init.body);
   if(args.p_item_type!=='preference')
    return json({code:'22023',message:'LI_SYNC_INVALID_INPUT'},400);
   const opKey=owner+':'+args.p_op_id;
   const previous=receipts.get(opKey);
   const signature=JSON.stringify([args.p_item_type,args.p_item_id,args.p_base_revision,
    args.p_payload,args.p_deleted_at]);
   if(previous){
    if(previous.signature!==signature)return json({code:'23505',message:'OPID_REUSED'},409);
    return json({protocol:'li-opid-v1',op_id:args.p_op_id,kind:'replayed',item:previous.item});
   }
   const current=records.get(args.p_item_id);
   if((current?.revision||0)!==args.p_base_revision)
    return json({code:'23505',message:'REVISION_CONFLICT'},409);
   const item={owner_id:owner,item_type:'preference',item_id:args.p_item_id,
    revision:(current?.revision||0)+1,payload:args.p_payload,changed_at:'2026-11-20T12:00:00Z',
    deleted_at:null};
   records.set(args.p_item_id,item);
   receipts.set(opKey,{signature,item});
   return json({protocol:'li-opid-v1',op_id:args.p_op_id,kind:'applied',item});
  }
  if(url.pathname.endsWith('/li_user_state')){
   const id=url.searchParams.get('item_id')?.slice(3);
   if(method==='GET'){
    const entry=records.get(id);
    return json(entry?[entry]:[]);
   }
   if(method==='DELETE'){
    deleteCalls++;
    if(options.denyCleanup)return json({code:'42501'},403);
    const item=records.get(id);
    if(item)records.delete(id);
    return json(item?[{owner_id:item.owner_id,item_type:item.item_type,item_id:item.item_id}]:[]);
   }
  }
  throw new Error('Unexpected request method/path '+method+' '+url.pathname);
 };
 return{auth,request,records,receipts,stats:()=>({rpcCalls,deleteCalls})};
}
test('signed canary tests INSERT/PATCH original ACK and opId replay, then removes synthetic row',async()=>{
 const h=harness();
 const result=await runSignedReceiptCanary(endpoint,h.auth,h.request);
 assert.deepEqual(result,{outcome:'pass',stage:'cleanup',code:'CANARY_SIGNED_REPLAY_PASS',cleanup:'done'});
 assert.equal(h.records.size,0);
 assert.equal(h.receipts.size,2);
 assert.equal(h.stats().deleteCalls,1);
 assert.equal(h.stats().rpcCalls,6); // invalid + applied insert + replay + opId collision + update + replay
});
test('missing live RPC route fails closed before any state write',async()=>{
 const h=harness({rpcUnavailable:true});
 const result=await runSignedReceiptCanary(endpoint,h.auth,h.request);
 assert.equal(result.outcome,'fail');
 assert.equal(result.stage,'signed-route');
 assert.equal(result.code,'CANARY_ROUTE_404_PGRST202');
 assert.equal(result.cleanup,'not-required');
 assert.equal(h.records.size,0);
 assert.equal(h.stats().deleteCalls,0);
});
test('uninvited account is denied before touching RPC and no secret leaks to result',async()=>{
 const h=harness({invited:false});
 const result=await runSignedReceiptCanary(endpoint,h.auth,h.request);
 assert.equal(result.outcome,'fail');
 assert.equal(result.code,'CANARY_NOT_INVITED');
 assert.equal(h.stats().rpcCalls,0);
 assert.equal(h.records.size,0);
 assert.doesNotMatch(JSON.stringify(result),/signature|canary-owner-A|eyJ/);
});
test('failed cleanup cannot be reported as PASS or erase receipts',async()=>{
 const h=harness({denyCleanup:true});
 const result=await runSignedReceiptCanary(endpoint,h.auth,h.request);
 assert.equal(result.outcome,'fail');
 assert.equal(result.code,'CANARY_CLEANUP_HTTP_403');
 assert.equal(result.cleanup,'unconfirmed');
 assert.equal(h.receipts.size,2);
 assert.equal(h.records.size,1);
});
