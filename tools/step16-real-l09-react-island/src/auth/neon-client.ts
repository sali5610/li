import {createAuthClient} from '@neondatabase/auth';
import {BetterAuthReactAdapter} from '@neondatabase/auth/react/adapters';
import type {NeonAuthSessionPort} from '../sync/neon-session.js';
import {NEON_AUTH_URL} from './config.js';

/**
 * Managed Better Auth with official Neon SDK and Google's shared OAuth provider.
 * A Google identity/session is NOT a li. membership. The verified-email allowlist
 * and restrictive PostgreSQL RLS (migration 0002) enforce access server-side.
 * No anonymous tokens, self-serve app membership or privileged credentials.
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
  // Public Better Auth JWT plugin action. createAuthClient() returns the
  // underlying React client; its public API does NOT expose getJWTToken().
  // The session cookie token is NOT used as a Data API bearer credential.
  const response=await authClient.token();
  if(response.error)throw new Error('NEON_AUTH_JWT_FETCH_FAILED');
  return typeof response.data?.token==='string'?response.data.token:null;
 }
};
