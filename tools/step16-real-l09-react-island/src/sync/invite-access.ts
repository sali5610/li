import type {NeonAuthSessionPort} from './neon-session.js';
import type {Requester} from './neon-api.js';

/**
 * A Google session authenticates identity; it DOES NOT authorize app access.
 * PostgreSQL SECURITY DEFINER RPC + restrictive table RLS are authoritative.
 * No invite list, test email, admin credential or secret is shipped to browsers.
 */
export async function checkInviteAccess(
 endpoint:string,
 auth:NeonAuthSessionPort,
 request:Requester=fetch
):Promise<boolean>{
 const url=new URL(endpoint);
 if(url.protocol!=='https:'||!url.pathname.endsWith('/rest/v1')||url.username||url.password)
  throw new Error('INVALID_INVITE_API_URL');
 const session=await auth.getSession();
 if(session.error)throw new Error('INVITE_AUTH_SESSION_FAILED');
 const accountId=session.data?.user?.id;
 if(typeof accountId!=='string'||!accountId.trim())return false;
 const jwt=await auth.getJWTToken();
 if(typeof jwt!=='string'||jwt.split('.').length!==3)throw new Error('INVITE_JWT_REQUIRED');
 let subject:unknown;
 try{
  subject=(JSON.parse(atob(jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))) as {sub?:unknown}).sub;
 }catch{throw new Error('INVITE_JWT_INVALID');}
 if(subject!==accountId)throw new Error('INVITE_ACCOUNT_MISMATCH');
 const rpc=new URL(url.toString().replace(/\/$/,'')+'/rpc/li_is_invited');
 const response=await request(rpc.toString(),{
  method:'POST',redirect:'error',credentials:'omit',cache:'no-store',
  headers:{Authorization:'Bearer '+jwt,Accept:'application/json','Content-Type':'application/json'},
  body:'{}'
 });
 if(!response.ok)throw new Error('INVITE_CHECK_HTTP_'+response.status);
 const allowed=await response.json() as unknown;
 if(typeof allowed!=='boolean')throw new Error('INVITE_CHECK_INVALID_RESPONSE');
 return allowed;
}
