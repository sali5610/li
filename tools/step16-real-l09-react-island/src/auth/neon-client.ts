import {createInternalNeonAuth,type ReactBetterAuthClient} from '@neondatabase/auth';
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
// @neondatabase/auth v0.7.0-beta exports the managed internal JWT helper.
 // Use ONE adapter instance for both the React session and JWT acquisition.
 // The helper obtains the SDK-managed session token; do not fetch /token ad hoc.
const neonAuth=createInternalNeonAuth(NEON_AUTH_URL,{
 adapter:BetterAuthReactAdapter(),
 allowAnonymous:false
});
// SDK v0.7.0-beta's generic conditional resolves the React adapter as its
// Vanilla type, even though BetterAuthReactAdapter() instantiates React hooks.
// The explicit bridge is isolated here; runtime Auth-only fixture must verify.
export const authClient=neonAuth.adapter as unknown as ReactBetterAuthClient;

/** Identity-only adapter. Never cache/store the JWT or raw session in IndexedDB. */
export const neonSessionPort:NeonAuthSessionPort={
 async getSession(){
  const response=await authClient.getSession();
  return{data:response.data?.user?{user:{id:response.data.user.id}}:null,
   error:response.error??undefined};
 },
 async getJWTToken(){
  // Neon SDK injects the authenticated JWT from set-auth-jwt into a session
  // response. Without that header session.token may be an opaque session ID.
  // Only use the SDK helper, then validate candidate shape + sub binding and
  // require the backend to verify JWT signature, invite membership and RLS.
  try{
   const jwt=await neonAuth.getJWTToken();
   return sessionJwtCandidate(jwt);
  }catch(problem){
   throw safeJwtFetchError(problem); // Never expose provider text or token.
  }
 }
};
