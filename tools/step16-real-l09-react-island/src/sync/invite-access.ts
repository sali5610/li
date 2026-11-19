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

/** Only a three-segment JWT candidate may be sent to Data API.
 * This is a SHAPE check, never a signature/authorization check. */
export function sessionJwtCandidate(value:unknown):string|null{
 if(typeof value!=='string')return null;
 const parts=value.split('.');
 return parts.length===3&&parts.every(part=>part.length>0)?value:null;
}

/** Preserve only a numeric Better Auth JWT endpoint status; never echo messages. */
export function safeJwtFetchError(problem:unknown):Error{
 const detail=problem&&typeof problem==='object'?problem as {status?:unknown;statusCode?:unknown}:null;
 const value=detail?.status??detail?.statusCode;
 if(typeof value==='number'&&Number.isInteger(value)&&value>=400&&value<=599)
  return new Error('NEON_AUTH_JWT_HTTP_'+value);
 return new Error('NEON_AUTH_JWT_FETCH_FAILED');
}

/** A stable, non-sensitive code for the owner to screenshot.
 * Never surface backend bodies, JWTs, identifiers or raw exception messages. */
export function safeInviteErrorCode(error:unknown):string{
 const message=error instanceof Error?error.message:'';
 if(message==='NEON_AUTH_JWT_FETCH_FAILED')return 'INV-JWT-FETCH';
 const jwtStatus=/^NEON_AUTH_JWT_HTTP_(\d{3})$/.exec(message);
 if(jwtStatus){
  const status=Number(jwtStatus[1]);
  if([400,401,403,404,409,429].includes(status))return 'INV-JWT-'+status;
  if(status>=500&&status<=599)return 'INV-JWT-5XX';
  return 'INV-JWT-OTHER';
 }
 if(message==='NEON_AUTH_JWT_SESSION_FAILED'||message==='INVITE_AUTH_SESSION_FAILED')
  return 'INV-SESSION';
 if(message==='INVITE_JWT_REQUIRED')return 'INV-JWT-MISSING';
 if(message==='INVITE_JWT_INVALID'||message==='INVITE_ACCOUNT_MISMATCH')
  return 'INV-JWT-BIND';
 if(message==='INVITE_CHECK_INVALID_RESPONSE')return 'INV-RPC-FORMAT';
 if(message==='INVALID_INVITE_API_URL')return 'INV-CONFIG';
 const match=/^INVITE_CHECK_HTTP_(\d{3})$/.exec(message);
 if(match){
  const status=Number(match[1]);
  if([400,401,403,404,405,406,409,429].includes(status))return 'INV-RPC-'+status;
  if(status>=500&&status<=599)return 'INV-RPC-5XX';
  return 'INV-RPC-OTHER';
 }
 if(error instanceof TypeError)return 'INV-NET-OR-CLIENT';
 return 'INV-UNKNOWN';
}
