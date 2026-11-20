import {NeonUserApi,type Requester} from './neon-api.js';

/**
 * Minimal interface offered by the official Neon Auth client:
 * createAuthClient(...).getSession() and .getJWTToken().
 * This code never stores cookies, passwords or JWTs in IndexedDB.
 */
export interface NeonAuthSessionPort {
 getSession():Promise<{data?:{user?:{id?:string}|null}|null;error?:unknown}>;
 getJWTToken():Promise<string|null>;
}
/**
 * Bind a Data API adapter to the REAL signed-in account.
 * Missing session => local-only. Account changes => fail before any next request.
 * Still requires end-to-end real JWT/RLS tests before enabling remote sync.
 */
export async function bindNeonAccount(endpoint:string,auth:NeonAuthSessionPort,
 request?:Requester):Promise<NeonUserApi|null>{
 const session=await auth.getSession();
 if(session.error)throw new Error('NEON_AUTH_SESSION_FAILED');
 const accountId=session.data?.user?.id;
 if(typeof accountId!=='string'||!accountId.trim())return null;
 const getBoundToken=async()=>{
  const current=await auth.getSession();
  if(current.error)throw new Error('NEON_AUTH_SESSION_FAILED');
  if(current.data?.user?.id!==accountId)throw new Error('NEON_AUTH_ACCOUNT_CHANGED');
  const jwt=await auth.getJWTToken();
  if(!jwt)throw new Error('NEON_AUTH_JWT_REQUIRED');
  return jwt;
 };
 return new NeonUserApi(endpoint,getBoundToken,accountId,request);
}
