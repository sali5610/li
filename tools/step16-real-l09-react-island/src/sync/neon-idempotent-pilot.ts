import {checkScope,RevisionConflict} from './contract.js';
import type {Edit,PrivateItem} from './contract.js';
import {NeonUserApi} from './neon-api.js';
import type {Requester,TokenProvider} from './neon-api.js';

/**
 * ISSUE #161 / research-only client for a *future* authenticated server RPC.
 *
 * NOT wired to the app, auth-pilot or production. The RPC does not exist in
 * deployed Neon. Without a reviewed atomic receipt implementation on the
 * server this adapter MUST fail closed (no fallback to legacy POST/PATCH).
 *
 * The server contract is:
 *  POST /rpc/li_apply_user_edit_v1 -> one JSON object
 *  {protocol:'li-opid-v1',op_id,kind:'applied'|'replayed',item:PrivateItem}
 * Both first application and replay return the ORIGINAL committed revision.
 * A 409 means a different writer/reused ID conflict, never an acknowledgement.
 */
export const IDEMPOTENT_RPC_PROTOCOL='li-opid-v1' as const;
export const IDEMPOTENT_RPC_NAME='li_apply_user_edit_v1' as const;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(code:string):never{throw new Error(code);}
function validatedToken(token:string,accountId:string):void{
 const parts=token.split('.');
 if(parts.length!==3||parts.some(x=>!x))fail('NEON_AUTH_JWT_REQUIRED');
 let sub:unknown,exp:unknown;
 try{
  const value=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'))) as {sub?:unknown;exp?:unknown};
  sub=value.sub;exp=value.exp;
 }catch{fail('NEON_AUTH_JWT_INVALID');}
 if(sub!==accountId)fail('NEON_AUTH_ACCOUNT_MISMATCH');
 // A token that supplies exp must not have already expired. Absence of exp
 // remains the responsibility of the managed Neon JWT verifier on the server.
 if(exp!==undefined&&(!Number.isFinite(exp)||typeof exp!=='number'||exp<=Date.now()/1000))
  fail('NEON_AUTH_JWT_EXPIRED');
}
function acceptedItem(raw:unknown,edit:Edit,accountId:string):PrivateItem{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('INVALID_REMOTE_ROW');
 const row=raw as Record<string,unknown>;
 if(row.owner_id!==accountId)fail('REMOTE_OWNER_MISMATCH');
 if(row.item_type!==edit.itemType||row.item_id!==edit.itemId)fail('NEON_ITEM_MISMATCH');
 if(!Number.isSafeInteger(row.revision)||row.revision!==edit.baseRevision+1)
  fail('INVALID_REMOTE_ROW');
 if(typeof row.changed_at!=='string'||
   !(row.deleted_at===null||typeof row.deleted_at==='string')||
   !Object.hasOwn(row,'payload'))fail('INVALID_REMOTE_ROW');
 return row as unknown as PrivateItem;
}

export class NeonIdempotentPilotApi{
 readonly accountId:string;
 private readonly url:URL;
 private readonly read:NeonUserApi;
 constructor(endpoint:string,private readonly getToken:TokenProvider,accountId:string,
  private readonly request:Requester=fetch){
  if(!accountId.trim())fail('ACCOUNT_REQUIRED');
  this.accountId=accountId;
  const url=new URL(endpoint);
  if(url.protocol!=='https:'||!url.pathname.endsWith('/rest/v1')||
    url.username||url.password)fail('INVALID_NEON_DATA_API_URL');
  this.url=url;
  this.read=new NeonUserApi(endpoint,getToken,accountId,request);
 }
 // RLS GETs keep their existing server-side owner checks and pagination.
 one(type:Edit['itemType'],id:string):Promise<PrivateItem|null>{return this.read.one(type,id);}
 all():Promise<PrivateItem[]>{return this.read.all();}
 async write(edit:Edit):Promise<PrivateItem>{
  checkScope(this.accountId,edit.itemType,edit.itemId);
  if(!Number.isSafeInteger(edit.baseRevision)||edit.baseRevision<0)fail('BAD_BASE_REVISION');
  if(!UUID.test(edit.opId))fail('INVALID_SYNC_OPERATION_ID');
  const token=await this.getToken();
  validatedToken(token,this.accountId);
  const url=new URL(this.url.toString().replace(/\/$/,'')+'/rpc/'+IDEMPOTENT_RPC_NAME);
  // No owner ID in body. The database MUST derive it from signed auth.user_id().
  const response=await this.request(url.toString(),{
   method:'POST',cache:'no-store',credentials:'omit',redirect:'error',
   headers:{Authorization:'Bearer '+token,Accept:'application/json',
    'Content-Type':'application/json'},
   body:JSON.stringify({
    p_item_type:edit.itemType,p_item_id:edit.itemId,
    p_payload:edit.payload,p_deleted_at:edit.deletedAt,
    p_base_revision:edit.baseRevision,p_op_id:edit.opId
   })
  });
  if(response.status===409||response.status===412)throw new RevisionConflict();
  if(!response.ok)fail('NEON_DATA_API_HTTP_'+response.status);
  let raw:unknown;
  try{raw=await response.json();}catch{fail('INVALID_RPC_ACK');}
  if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('INVALID_RPC_ACK');
  const ack=raw as Record<string,unknown>;
  if(ack.protocol!==IDEMPOTENT_RPC_PROTOCOL||
     ack.op_id!==edit.opId||
     !['applied','replayed'].includes(ack.kind as string))fail('INVALID_RPC_ACK');
  return acceptedItem(ack.item,edit,this.accountId);
 }
}
