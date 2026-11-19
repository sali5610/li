import {createAuthClient} from '@neondatabase/auth';
import {BetterAuthReactAdapter} from '@neondatabase/auth/react/adapters';
import type {NeonAuthSessionPort} from '../sync/neon-session.js';
import {sessionJwtCandidate,safeJwtFetchError} from '../sync/invite-access.js';
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
  // Better Auth's session.token is an opaque session identifier, NOT a bearer JWT.
  // For the public BetterAuthReactAdapter API, use the JWT plugin /token action.
  // Never infer a signed token from the session cookie even if it contains dots.
  const response=await authClient.token();
  if(response.error)throw safeJwtFetchError(response.error);
  return sessionJwtCandidate(response.data?.token);
 }
};
