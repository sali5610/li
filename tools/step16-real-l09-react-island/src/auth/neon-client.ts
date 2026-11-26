import {createInternalNeonAuth,type ReactBetterAuthClient} from '@neondatabase/auth';
import {BetterAuthReactAdapter} from '@neondatabase/auth/react/adapters';
import type {NeonAuthSessionPort} from '../sync/neon-session.js';
import {fetchSignedNeonJwt,fetchFreshNeonSession} from '../sync/invite-access.js';
import {AUTH_API_URL,IS_GITHUB_STAGING} from './config.js';

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
  // The pinned SDK classifies /token as getSession, returning a cached
  // session instead of JWT. Fetch the managed endpoint without that cache.
  return fetchSignedNeonJwt(AUTH_API_URL);
 }
};

/** Only the entry gate needs a fresh managed session on every verification.
 * Keep the existing sync adapter and static staging path unchanged. */
export const neonInviteSessionPort:NeonAuthSessionPort={
 ...neonSessionPort,
 getSession:()=>IS_GITHUB_STAGING?neonSessionPort.getSession():fetchFreshNeonSession(AUTH_API_URL)
};
