/**
 * Cloudflare Pages advanced-mode Worker for /api/auth/* on li5610.pages.dev.
 * Bundled with the existing pinned @neondatabase/auth v0.7.0-beta.
 * Only the official Neon server toolkit handles cookie names, flags, verifier
 * exchange and session caching; secrets stay in Cloudflare env, not the bundle.
 *
 * Cloudflare deployment requires NEON_AUTH_COOKIE_SECRET (>=32 random chars).
 * Do not publish this worker separately from the matching first-party client.
 */
import {handleAuthProxyRequest,processAuthMiddleware} from '@neondatabase/auth/server';
import {FIRST_PARTY_ORIGIN,FIRST_PARTY_AUTH_PREFIX,authProxyPath,isFirstPartyCallback,firstPartySessionRequest}
 from './first-party-contract.js';

import {handleAiRoute,type AiServerEnv} from './ai-access-server.js';
import {serverAiActor} from './ai-session-server.js';
import {reviewedAiLesson} from './ai-reviewed-lessons.js';

const UPSTREAM_NEON_AUTH_URL=
 'https://ep-misty-snow-azfrrm3o.neonauth.c-3.ap-southeast-1.aws.neon.tech/li/auth';

type PagesEnv=AiServerEnv&{
 NEON_AUTH_COOKIE_SECRET?:string;
 ASSETS:{fetch(request:Request):Promise<Response>};
};
function uncached(response:Response):Response{
 const headers=new Headers(response.headers);
 headers.set('Cache-Control','no-store');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
function noCacheHeaders(){return {'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'};}
export default {
 async fetch(request:Request,env:PagesEnv):Promise<Response>{
  const url=new URL(request.url);
  if(url.origin!==FIRST_PARTY_ORIGIN)
   return new Response('Forbidden',{status:403,headers:noCacheHeaders()});
  // AI is never served by GitHub Pages static staging. Cloudflare verifies
  // its own cookie + Neon RLS before any D1 access or model invocation.
  if(url.pathname.startsWith('/api/ai/')){
   const secret=env.NEON_AUTH_COOKIE_SECRET;
   if(!secret||secret.length<32)
    return new Response('AI unavailable',{status:503,headers:noCacheHeaders()});
   const actor=await serverAiActor(request,secret);
   return handleAiRoute(request,env,actor,reviewedAiLesson);
  }
  const authRequest=url.pathname.startsWith(FIRST_PARTY_AUTH_PREFIX);
  const oauthReturn=isFirstPartyCallback(url);
  if(!authRequest&&!oauthReturn)return env.ASSETS.fetch(request);

  const secret=env.NEON_AUTH_COOKIE_SECRET;
  if(!secret||secret.length<32)
   return new Response('Auth unavailable',{status:503,headers:noCacheHeaders()});
  if(authRequest){
   const path=authProxyPath(url,request.method);
   if(!path)return new Response('Not found',{status:404,headers:noCacheHeaders()});
   const response=await handleAuthProxyRequest({
    request:firstPartySessionRequest(request),path,baseUrl:UPSTREAM_NEON_AUTH_URL,
    cookieSecret:secret,sameSite:'lax',sessionDataTtl:60
   });
   return uncached(response);
  }
  // Neon redirects Google sign-in back with a short-lived verifier; the official
  // toolkit exchanges it for a first-party HttpOnly, Secure session cookie.
  // Do not turn the callback itself into an authentication decision.
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
  // No verifier exchange succeeded. React's original signed invite gate stays
  // locked; never grant access from this route or from stale local state.
  return env.ASSETS.fetch(request);
 }
};
