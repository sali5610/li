import {RevisionConflict} from './contract.js';
import type {Edit,PrivateItem} from './contract.js';
import type {NeonAuthSessionPort} from './neon-session.js';
import {NeonReceiptApi} from './neon-receipt-api.js';
import {checkInviteAccess} from './invite-access.js';
import type {Requester} from './neon-api.js';

/** A manually triggered, one-shot probe. Never wired into normal learner sync.
 * No JWT, email, owner ID, user payload or error body is returned to the UI.
 * An isolated synthetic preference row is deleted in finally; operation receipts
 * intentionally remain as the server's idempotency audit record.
 */
export type ReceiptCanaryResult={
 outcome:'pass'|'fail';stage:string;code:string;cleanup:'not-required'|'done'|'unconfirmed'
};
function fail(code:string):never{throw new Error(code);}
function safeCode(error:unknown):string{
 const msg=error instanceof Error?error.message:'';
 if(/^CANARY_[A-Z0-9_]{2,70}$/.test(msg))return msg;
 if(error instanceof RevisionConflict)return 'CANARY_CONFLICT';
 const http=/^NEON_DATA_API_HTTP_(\d{3})$/.exec(msg);
 if(http)return 'CANARY_HTTP_'+http[1];
 if(/^NEON_AUTH_|^INVITE_/.test(msg))return 'CANARY_AUTH';
 return 'CANARY_UNKNOWN';
}
function sameRecord(a:PrivateItem,b:PrivateItem):boolean{
 return a.owner_id===b.owner_id&&a.item_type===b.item_type&&a.item_id===b.item_id&&
  a.revision===b.revision&&a.changed_at===b.changed_at&&
  JSON.stringify(a.payload)===JSON.stringify(b.payload);
}
function stableJwtSub(jwt:string):string|null{
 const parts=jwt.split('.');
 if(parts.length!==3)return null;
 try{
  const obj=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'))) as {sub?:unknown;exp?:unknown};
  if(typeof obj.sub!=='string'||obj.exp!==undefined&&
    (typeof obj.exp!=='number'||obj.exp<=Date.now()/1000))return null;
  return obj.sub;
 }catch{return null;}
}
export async function runSignedReceiptCanary(
 endpoint:string,auth:NeonAuthSessionPort,request:Requester=fetch
):Promise<ReceiptCanaryResult>{
 let stage='session',outcome:'pass'|'fail'='fail',code='CANARY_NOT_STARTED';
 let cleanup:ReceiptCanaryResult['cleanup']='not-required';
 let owner='',itemId='';
 const url=new URL(endpoint);
 if(url.protocol!=='https:'||!url.pathname.endsWith('/rest/v1')||url.username||url.password)
  return {outcome:'fail',stage:'config',code:'CANARY_BAD_ENDPOINT',cleanup};
 const getToken=async()=>{
  const live=await auth.getSession();
  if(live.error||live.data?.user?.id!==owner)fail('CANARY_ACCOUNT_CHANGED');
  const jwt=await auth.getJWTToken();
  if(!jwt||stableJwtSub(jwt)!==owner)fail('CANARY_JWT_BINDING');
  return jwt;
 };
 const apiUrl=url.toString().replace(/\/$/,'');
 const rpcUrl=apiUrl+'/rpc/li_apply_user_edit_v1';
 const rawPost=async(args:Record<string,unknown>)=>{
  const token=await getToken();
  const response=await request(rpcUrl,{
   method:'POST',cache:'no-store',credentials:'omit',redirect:'error',
   headers:{Authorization:'Bearer '+token,Accept:'application/json',
    'Content-Type':'application/json'},
   body:JSON.stringify(args)
  });
  let body:unknown=null;
  try{body=await response.json();}catch{fail('CANARY_RPC_BAD_JSON');}
  return {status:response.status,body};
 };
 try{
  const initial=await auth.getSession();
  if(initial.error||!initial.data?.user?.id)fail('CANARY_NO_SESSION');
  owner=initial.data.user.id;
  if(!await checkInviteAccess(endpoint,auth,request))fail('CANARY_NOT_INVITED');
  await getToken();

  // Confirm the signed request reached THIS RPC: a deliberately invalid item
  // type must produce the function's own 22023 without any data write.
  stage='signed-route';
  const invalid=await rawPost({
   p_item_type:'__li_canary_invalid__',p_item_id:'__li_canary_route__',
   p_payload:{canary:true},p_deleted_at:null,p_base_revision:0,
   p_op_id:crypto.randomUUID()
  });
  const bad=invalid.body as {code?:unknown;message?:unknown}|null;
  if(invalid.status!==400||bad?.code!=='22023'||bad.message!=='LI_SYNC_INVALID_INPUT'){
   const detail=typeof bad?.code==='string'&&/^[A-Z0-9]{4,9}$/.test(bad.code)?bad.code:'OTHER';
   fail('CANARY_ROUTE_'+invalid.status+'_'+detail);
  }

  // Unique key ensures this test cannot touch an actual lesson or note.
  itemId='__li_sync161_canary_'+crypto.randomUUID();
  const api=new NeonReceiptApi(endpoint,getToken,owner,request);
  const make=(revision:number,version:number,operationId:string):Edit=>({
   itemType:'preference',itemId,baseRevision:revision,opId:operationId,
   payload:{__li_sync161_canary:true,version},deletedAt:null
  });
  stage='insert';
  const first=make(0,1,crypto.randomUUID());
  const applied=await api.write(first);
  if(applied.revision!==1||!sameRecord(applied,await api.one('preference',itemId) as PrivateItem))
   fail('CANARY_INSERT_READBACK');

  stage='insert-replay';
  const replay=await rawPost({
   p_item_type:first.itemType,p_item_id:itemId,p_payload:first.payload,
   p_deleted_at:null,p_base_revision:0,p_op_id:first.opId
  });
  const ack=replay.body as {protocol?:unknown;op_id?:unknown;kind?:unknown;item?:PrivateItem}|null;
  if(replay.status!==200||ack?.protocol!=='li-opid-v1'||ack.op_id!==first.opId||
     ack.kind!=='replayed'||!ack.item||!sameRecord(applied,ack.item))
   fail('CANARY_REPLAY_MISMATCH');

  stage='opid-reuse';
  try{
   await api.write({...first,payload:{__li_sync161_canary:true,version:999}});
   fail('CANARY_OPID_REUSE_ACCEPTED');
  }catch(e){
   if(!(e instanceof RevisionConflict))throw e;
  }

  stage='update';
  const second=make(1,2,crypto.randomUUID());
  const updated=await api.write(second);
  if(updated.revision!==2||!sameRecord(updated,await api.one('preference',itemId) as PrivateItem))
   fail('CANARY_UPDATE_READBACK');

  stage='update-replay';
  const replay2=await rawPost({
   p_item_type:second.itemType,p_item_id:itemId,p_payload:second.payload,
   p_deleted_at:null,p_base_revision:1,p_op_id:second.opId
  });
  const ack2=replay2.body as {protocol?:unknown;op_id?:unknown;kind?:unknown;item?:PrivateItem}|null;
  if(replay2.status!==200||ack2?.protocol!=='li-opid-v1'||ack2.op_id!==second.opId||
     ack2.kind!=='replayed'||!ack2.item||!sameRecord(updated,ack2.item))
   fail('CANARY_UPDATE_REPLAY_MISMATCH');
  outcome='pass';code='CANARY_SIGNED_REPLAY_PASS';
 }catch(error){code=safeCode(error);}
 finally{
  if(itemId&&owner){
   cleanup='unconfirmed';
   try{
    stage=outcome==='pass'?'cleanup':stage;
    const token=await getToken();
    const endpointUrl=new URL(apiUrl+'/li_user_state');
    endpointUrl.searchParams.set('owner_id','eq.'+owner);
    endpointUrl.searchParams.set('item_type','eq.preference');
    endpointUrl.searchParams.set('item_id','eq.'+itemId);
    endpointUrl.searchParams.set('select','owner_id,item_type,item_id');
    const res=await request(endpointUrl.toString(),{
     method:'DELETE',cache:'no-store',credentials:'omit',redirect:'error',
     headers:{Authorization:'Bearer '+token,Accept:'application/json',
      Prefer:'return=representation'}
    });
    if(!res.ok)fail('CANARY_CLEANUP_HTTP_'+res.status);
    const rows=await res.json();
    if(!Array.isArray(rows)||rows.some(x=>
      !x||x.owner_id!==owner||x.item_type!=='preference'||x.item_id!==itemId))
     fail('CANARY_CLEANUP_REPLY');
    // Recheck to distinguish successful deletion from a silent no-op.
    const api=new NeonReceiptApi(endpoint,getToken,owner,request);
    if(await api.one('preference',itemId)!==null)fail('CANARY_CLEANUP_STILL_PRESENT');
    cleanup='done';
   }catch(error){
    if(outcome==='pass'){outcome='fail';code=safeCode(error);}
   }
  }
 }
 return {outcome,stage,code,cleanup};
}
