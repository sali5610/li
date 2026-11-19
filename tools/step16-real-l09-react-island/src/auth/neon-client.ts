import {createAuthClient} from '@neondatabase/auth';
import {BetterAuthReactAdapter} from '@neondatabase/auth/react/adapters';
import type {NeonAuthSessionPort} from '../sync/neon-session.js';
import {NEON_AUTH_URL} from './config.js';

/**
 * Managed Better Auth with official Neon SDK. This account is invite-only:
 * no sign-up screen, anonymous token or social login is exposed by li.
 */
export const authClient=createAuthClient(NEON_AUTH_URL,{
 adapter:BetterAuthReactAdapter(),
 allowAnonymous:false
});

/** Identity-only adapter. Never cache/store the JWT or raw session in IndexedDB. */
export const neonSessionPort:NeonAuthSessionPort={
 async getSession(){
  const response=await authClient.getSession();
  return{data:response.data?.user?{user:{id:response.data.user.id}}:null,
   error:response.error??undefined};
 },
 async getJWTToken(){
  return(await authClient.getJWTToken())??null;
 }
};
