import {createAuthClient} from '@neondatabase/auth';
import {BetterAuthReactAdapter} from '@neondatabase/auth/react/adapters';
import type {NeonAuthSessionPort} from '../sync/neon-session.js';
import {sessionJwtCandidate} from '../sync/invite-access.js';
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
  // Neon Better Auth React adapter may inject a signed JWT into the session.
  // Prefer it when present to avoid a second cross-origin /token request.
  // The opaque session cookie is never a Data API bearer credential.
  const session=await authClient.getSession();
  if(session.error)throw new Error('NEON_AUTH_JWT_SESSION_FAILED');
  const candidate=sessionJwtCandidate(session.data?.session?.token);
  if(candidate)return candidate;
  // Safe fallback for SDK/server versions without an injected JWT.
  const response=await authClient.token();
  if(response.error)throw new Error('NEON_AUTH_JWT_FETCH_FAILED');
  return sessionJwtCandidate(response.data?.token);

 }
};
