/* A browser-supplied email or user ID is NEVER proof of AI entitlement.
 * Reuse the official first-party Neon auth proxy session and signed Data API
 * invite RPC; check both on every AI endpoint, including seat transfers.
 */
import {handleAuthProxyRequest} from '@neondatabase/auth/server';
import {NEON_DATA_API_URL} from './config.js';
import type {AiActor} from './ai-access-server.js';
const UPSTREAM='https://ep-misty-snow-azfrrm3o.neonauth.c-3.ap-southeast-1.aws.neon.tech/li/auth';

async function authJson(path:'get-session'|'token',request:Request,secret:string):Promise<unknown>{
 const cookie=request.headers.get('cookie');
 if(!cookie)return null;
 const proxied=new Request(new URL('/api/auth/'+path,request.url),{
  method:'GET',headers:{cookie,accept:'application/json'}
 });
 const response=await handleAuthProxyRequest({
  request:proxied,path,baseUrl:UPSTREAM,cookieSecret:secret,
  sameSite:'lax',sessionDataTtl:60
 });
 if(!response.ok)return null;
 return response.json();
}
function object(x:unknown):Record<string,unknown>|null{
 return x!==null&&typeof x==='object'&&!Array.isArray(x)?
  x as Record<string,unknown>:null;
}
function jwtSubject(token:string):string|null{
 const parts=token.split('.');
 if(parts.length!==3)return null;
 try{
  const base64=parts[1].replace(/-/g,'+').replace(/_/g,'/');
  const payload=object(JSON.parse(atob(base64)) as unknown);
  return typeof payload?.sub==='string'?payload.sub:null;
 }catch{return null;}
}
export async function serverAiActor(request:Request,cookieSecret:string):Promise<AiActor|null>{
 if(cookieSecret.length<32)return null;
 try{
  const session=object(await authJson('get-session',request,cookieSecret));
  const user=object(session?.user??object(session?.data)?.user);
  const id=user?.id,email=user?.email;
  if(typeof id!=='string'||!id||typeof email!=='string'||
   user?.emailVerified!==true)return null;
  const authToken=object(await authJson('token',request,cookieSecret));
  const token=authToken?.token??object(authToken?.data)?.token;
  if(typeof token!=='string'||jwtSubject(token)!==id)return null;
  // Signed RPC checks verified Google identity + invited status inside Neon.
  // JWT header/body are never written to user data, KV, D1, or logs.
  const invited=await fetch(NEON_DATA_API_URL+'/rpc/li_is_invited',{
   method:'POST',redirect:'error',cache:'no-store',credentials:'omit',
   headers:{Authorization:'Bearer '+token,Accept:'application/json',
    'Content-Type':'application/json'},body:'{}'
  });
  if(!invited.ok||await invited.json()!==true)return null;
  return {id,email,verified:true,invited:true};
 }catch{return null;}
}
