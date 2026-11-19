import {checkScope,RevisionConflict} from './contract.js';
import type {PrivateItem,Edit} from './contract.js';

export type TokenProvider=()=>Promise<string>;
export type Requester=typeof fetch;
/** No API keys or database URLs containing passwords belong in the browser. */
export class NeonUserApi{
 private readonly url:URL;
 constructor(endpoint:string,private readonly getToken:TokenProvider,readonly accountId:string,private readonly request:Requester=fetch){
  if(!accountId.trim())throw new Error('ACCOUNT_REQUIRED');
  const url=new URL(endpoint);
  if(url.protocol!=='https:'||!url.pathname.endsWith('/rest/v1'))throw new Error('INVALID_NEON_DATA_API_URL');
  this.url=url;
 }
 private async send(method:'GET'|'POST'|'PATCH',path:string,params:Record<string,string>={},body?:object):Promise<PrivateItem[]>{
  const token=await this.getToken();
  if(!token||token.split('.').length!==3)throw new Error('NEON_AUTH_JWT_REQUIRED');
  // Defensive session binding; the remote JWT signature/role is validated by Neon.
  let subject:unknown;
  try{subject=(JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))) as {sub?:unknown}).sub;}
  catch{throw new Error('NEON_AUTH_JWT_INVALID');}
  if(subject!==this.accountId)throw new Error('NEON_AUTH_ACCOUNT_MISMATCH');
  const url=new URL(this.url.toString().replace(/\/$/,'')+'/'+path);
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  const request=this.request;
  const response=await request(url.toString(),{
   method,cache:'no-store',credentials:'omit',redirect:'error',
   headers:{Authorization:'Bearer '+token,Accept:'application/json',
     ...(body?{'Content-Type':'application/json',Prefer:'return=representation'}:{})},
   ...(body?{body:JSON.stringify(body)}:{})
  });
  if(response.status===409||response.status===412)throw new RevisionConflict();
  if(!response.ok)throw new Error('NEON_DATA_API_HTTP_'+response.status);
  const value=await response.json() as unknown;
  if(!Array.isArray(value))throw new Error('UNEXPECTED_NEON_RESPONSE');
  // Defense in depth: a misconfigured Data API must never hydrate another user's data.
  // PostgreSQL RLS remains the authoritative security boundary.
  for(const row of value){
   if(!row||typeof row!=='object'||Array.isArray(row))throw new Error('INVALID_REMOTE_ROW');
   const item=row as Record<string,unknown>;
   if(item.owner_id!==this.accountId)throw new Error('REMOTE_OWNER_MISMATCH');
   if(typeof item.item_type!=='string'||typeof item.item_id!=='string'||
      !Number.isSafeInteger(item.revision)||Number(item.revision)<1)
    throw new Error('INVALID_REMOTE_ROW');
   checkScope(this.accountId,item.item_type,item.item_id);
  }
  return value as PrivateItem[];
 }
 async one(type:Edit['itemType'],id:string):Promise<PrivateItem|null>{
  checkScope('signed-in',type,id);
  const rows=await this.send('GET','li_user_state',{
   select:'owner_id,item_type,item_id,revision,payload,changed_at,deleted_at',
   item_type:'eq.'+type,item_id:'eq.'+id,limit:'1'
  });
  if(rows.length>1)throw new Error('NEON_UNIQUE_KEY_BROKEN');
  if(rows[0]&&(rows[0].item_type!==type||rows[0].item_id!==id))throw new Error('NEON_ITEM_MISMATCH');
  return rows[0]??null;
 }
 /** Check current revision then CAS PATCH; concurrent devices can only win once. */
 async write(edit:Edit):Promise<PrivateItem>{
  checkScope('signed-in',edit.itemType,edit.itemId);
  if(!Number.isSafeInteger(edit.baseRevision)||edit.baseRevision<0)throw new Error('BAD_BASE_REVISION');
  const current=await this.one(edit.itemType,edit.itemId);
  if((current?.revision??0)!==edit.baseRevision)throw new RevisionConflict();
  const body={item_type:edit.itemType,item_id:edit.itemId,payload:edit.payload,
   deleted_at:edit.deletedAt,revision:edit.baseRevision+1,changed_at:new Date().toISOString()};
  const rows=current
   ?await this.send('PATCH','li_user_state',{
      item_type:'eq.'+edit.itemType,item_id:'eq.'+edit.itemId,
      revision:'eq.'+edit.baseRevision,select:'owner_id,item_type,item_id,revision,payload,changed_at,deleted_at'
    },body)
   :await this.send('POST','li_user_state',{
      select:'owner_id,item_type,item_id,revision,payload,changed_at,deleted_at'
    },body);
  // owner_id omitted, PostgreSQL default + RLS enforce the authenticated owner.
  if(rows.length!==1||rows[0].revision!==edit.baseRevision+1)throw new RevisionConflict();
  if(rows[0].item_type!==edit.itemType||rows[0].item_id!==edit.itemId)throw new Error('NEON_ITEM_MISMATCH');
  return rows[0];
 }
 /** Full user-scoped scan: <100-row pages, repeat on focus/online to close pagination races. */
 async all():Promise<PrivateItem[]>{
  const items:PrivateItem[]=[];
  for(let offset=0;offset<100000;offset+=100){
   const chunk=await this.send('GET','li_user_state',{
     select:'owner_id,item_type,item_id,revision,payload,changed_at,deleted_at',
     order:'item_type.asc,item_id.asc',limit:'100',offset:String(offset)
   });
   items.push(...chunk);
   if(chunk.length<100)return items;
  }
  throw new Error('NEON_SCAN_LIMIT_REACHED');
 }
}
