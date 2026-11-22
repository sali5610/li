import {createInternalNeonAuth,type ReactBetterAuthClient} from '@neondatabase/auth';
import {BetterAuthReactAdapter} from '@neondatabase/auth/react/adapters';
import type {NeonAuthSessionPort} from '../sync/neon-session.js';
import {sessionJwtCandidate,safeJwtFetchError} from '../sync/invite-access.js';
import {AUTH_API_URL} from './config.js';

/**
 * Managed Neon Better Auth with invite-only RLS. On the Cloudflare app origin
 * session cookies are first-party through the server proxy, not third-party
 * cookies from *.neon.tech (iPhone PWA restriction).
 * Do not store JWTs, session IDs, or Google credentials in web storage.
 */
const neonAuth=createInternalNeonAuth(AUTH_API_URL,{
 adapter:BetterAuthReactAdapter(),
 allowAnonymous:false
});
export const authClient=neonAuth.adapter as unknown as ReactBetterAuthClient;

/** Identity-only adapter. Invite/RLS are checked independently on every entry. */
export const neonSessionPort:NeonAuthSessionPort={
 async getSession(){
  const response=await authClient.getSession();
  return{data:response.data?.user?{user:{id:response.data.user.id}}:null,
   error:response.error??undefined};
 },
 async getJWTToken(){
  // The official SDK obtains only a short-lived signed JWT, used directly for
  // Neon Data API requests. Never persist it across browser restarts.
  try{
   // Better Auth's cached session.token may be an opaque cookie identifier,
   // not the signed Data API JWT. Ask the managed JWT plugin through the
   // existing first-party /api/auth/token endpoint instead.
   const response=await authClient.token();
   if(response.error)throw safeJwtFetchError(response.error);
   return sessionJwtCandidate(response.data?.token);
  }catch(problem){
   throw safeJwtFetchError(problem);
  }
 }
};
