/** First-party production auth contract. Neither the upstream Neon origin nor a URL
 * query param can enable this route from GitHub Pages / other hosts. */
export const FIRST_PARTY_ORIGIN='https://li5610.pages.dev';
export const FIRST_PARTY_AUTH_PREFIX='/api/auth/';
export const NEON_OAUTH_VERIFIER='neon_auth_session_verifier';

const authMethods:Record<string,readonly string[]>={
 'sign-in/social':['POST'],
 'get-session':['GET'],
 'sign-out':['POST'],
 'token':['GET']
};
const callbackPaths=new Set(['/','/index.html','/auth-pilot/','/auth-pilot/index.html']);

/** No arbitrary upstream endpoint or path traversal is ever accepted. */
export function authProxyPath(url:URL,method:string):string|null{
 if(url.origin!==FIRST_PARTY_ORIGIN||!url.pathname.startsWith(FIRST_PARTY_AUTH_PREFIX))return null;
 const path=url.pathname.slice(FIRST_PARTY_AUTH_PREFIX.length);
 if(!Object.prototype.hasOwnProperty.call(authMethods,path))return null;
 return authMethods[path].includes(method)?path:null;
}
export function isFirstPartyCallback(url:URL):boolean{
 return url.origin===FIRST_PARTY_ORIGIN&&callbackPaths.has(url.pathname)&&
  url.searchParams.has(NEON_OAUTH_VERIFIER);
}

/** The pinned Neon Auth 0.7.0-beta cookie-cache miss path fetches a fresh
 * session but drops the upstream session_token renewal Set-Cookie. Let the
 * managed upstream /get-session handle renewal, preserving its real cookie.
 * This does not extend expiry, trust local state, or alter any other route. */
export function firstPartySessionRequest(request:Request):Request{
 const url=new URL(request.url);
 if(authProxyPath(url,request.method)!=='get-session')return request;
 url.searchParams.set('disableCookieCache','true');
 return new Request(url.toString(),request);
}
