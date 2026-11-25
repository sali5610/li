/**
 * Auth-only Cloudflare Pages advanced-mode Worker.
 * Uses the same managed Neon session toolkit as the existing AI candidate,
 * but intentionally has NO AI route, model binding, database or paid service.
 * This is never deployed by a staging push. Production requires explicit PO
 * approval and a Cloudflare secret with >=32 characters.
 */
import {handleAuthProxyRequest,processAuthMiddleware} from '@neondatabase/auth/server';
import {FIRST_PARTY_ORIGIN,FIRST_PARTY_AUTH_PREFIX,authProxyPath,isFirstPartyCallback,firstPartySessionRequest}
 from './first-party-contract.js';

const UPSTREAM_NEON_AUTH_URL=
 'https://ep-misty-snow-azfrrm3o.neonauth.c-3.ap-southeast-1.aws.neon.tech/li/auth';

type AuthOnlyEnv={
 NEON_AUTH_COOKIE_SECRET?:string;
 ASSETS:{fetch(request:Request):Promise<Response>};
};
const uncached=(response:Response):Response=>{
 const headers=new Headers(response.headers);
 headers.set('Cache-Control','no-store');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
};
const errorResponse=(message:string,status:number)=>new Response(message,{
 status,headers:{'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'}
});

export default {
 async fetch(request:Request,env:AuthOnlyEnv):Promise<Response>{
  const url=new URL(request.url);
  if(url.origin!==FIRST_PARTY_ORIGIN)return errorResponse('Forbidden',403);
  // Never proxy AI, unknown APIs, or arbitrary endpoints in Auth-only mode.
  if(url.pathname.startsWith('/api/')&&!url.pathname.startsWith(FIRST_PARTY_AUTH_PREFIX))
   return errorResponse('Not found',404);
  const isAuth=url.pathname.startsWith(FIRST_PARTY_AUTH_PREFIX);
  const callback=isFirstPartyCallback(url);
  if(!isAuth&&!callback)return env.ASSETS.fetch(request);
  const secret=env.NEON_AUTH_COOKIE_SECRET;
  if(!secret||secret.length<32)return errorResponse('Auth unavailable',503);
  if(isAuth){
   const path=authProxyPath(url,request.method);
   if(!path)return errorResponse('Not found',404);
   const response=await handleAuthProxyRequest({
    request:firstPartySessionRequest(request),path,baseUrl:UPSTREAM_NEON_AUTH_URL,
    cookieSecret:secret,sameSite:'lax',sessionDataTtl:60
   });
   return uncached(response);
  }
  // Only the official toolkit exchanges the short-lived Google verifier for a
  // first-party HttpOnly/Secure cookie. Never grant invitation access here:
  // the existing React invite check + Neon RLS still protect learner data.
  const result=await processAuthMiddleware({
   request,pathname:url.pathname,
   skipRoutes:['/','/index.html','/auth-pilot/','/auth-pilot/index.html'],
   loginUrl:'/auth-pilot/',baseUrl:UPSTREAM_NEON_AUTH_URL,
   cookieSecret:secret,sameSite:'lax',sessionDataTtl:60
  });
  if(result.action==='redirect_oauth'){
   const response=new Response(null,{status:302,headers:{
    Location:result.redirectUrl.toString(),'Cache-Control':'no-store'
   }});
   for(const cookie of result.cookies)response.headers.append('Set-Cookie',cookie);
   return response;
  }
  return env.ASSETS.fetch(request);
 }
};
