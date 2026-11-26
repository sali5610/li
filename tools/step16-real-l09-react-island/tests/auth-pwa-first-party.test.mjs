import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/auth/first-party-contract.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const {authProxyPath,isFirstPartyCallback,firstPartySessionRequest,FIRST_PARTY_ORIGIN}=await import(
 'data:text/javascript;base64,'+Buffer.from(js).toString('base64')
);

test('only fixed first-party production origin can receive auth actions',()=>{
 assert.equal(authProxyPath(new URL(FIRST_PARTY_ORIGIN+'/api/auth/get-session'),'GET'),'get-session');
 assert.equal(authProxyPath(new URL('https://sali5610.github.io/api/auth/get-session'),'GET'),null);
 assert.equal(authProxyPath(new URL('https://evil.example/api/auth/sign-out'),'POST'),null);
});
test('allowlisted auth endpoints and methods, no user-defined proxy destination',()=>{
 for(const [path,method] of [['sign-in/social','POST'],['sign-out','POST'],
  ['get-session','GET'],['token','GET']]){
  assert.equal(authProxyPath(new URL(FIRST_PARTY_ORIGIN+'/api/auth/'+path),method),path);
 }
 for(const path of ['admin/list-users','../../http://evil.example','sign-in/email',
  'delete-user','get-session/..','']){
  assert.equal(authProxyPath(new URL(FIRST_PARTY_ORIGIN+'/api/auth/'+path),'POST'),null);
 }
 assert.equal(authProxyPath(new URL(FIRST_PARTY_ORIGIN+'/api/auth/sign-out'),'GET'),null);
 assert.equal(authProxyPath(new URL(FIRST_PARTY_ORIGIN+'/api/auth/token'),'POST'),null);
});
test('OAuth callback restricted to actual app pages and verifier param',()=>{
 const go=p=>new URL(FIRST_PARTY_ORIGIN+p);
 assert.equal(isFirstPartyCallback(go('/auth-pilot/?pilot=auth&oauth=returned&neon_auth_session_verifier=abc')),true);
 assert.equal(isFirstPartyCallback(go('/?neon_auth_session_verifier=abc')),true);
 assert.equal(isFirstPartyCallback(go('/auth-pilot/?code=fake')),false);
 assert.equal(isFirstPartyCallback(go('/assets/x.js?neon_auth_session_verifier=abc')),false);
 assert.equal(isFirstPartyCallback(new URL('https://evil.example/?neon_auth_session_verifier=abc')),false);
});
test('client uses first-party proxy only outside GitHub static staging',()=>{
 const config=readFileSync(new URL('../src/auth/config.ts',import.meta.url),'utf8');
 const client=readFileSync(new URL('../src/auth/neon-client.ts',import.meta.url),'utf8');
 assert.match(config,/IS_GITHUB_STAGING\?NEON_AUTH_URL:AUTH_ORIGIN\+'\/api\/auth'/);
 assert.match(client,/createInternalNeonAuth\(AUTH_API_URL,/);
 assert.doesNotMatch(client,/localStorage|indexedDB|sessionStorage/);
});
test('worker uses managed toolkit and never grants membership or stores bearer credentials',()=>{
 const worker=readFileSync(new URL('../src/auth/cloudflare-auth-only-worker.ts',import.meta.url),'utf8');
 assert.match(worker,/handleAuthProxyRequest/);
 assert.match(worker,/processAuthMiddleware/);
 assert.match(worker,/NEON_AUTH_COOKIE_SECRET/);
 assert.match(worker,/redirect_oauth/);
 assert.doesNotMatch(worker,/localStorage|sessionStorage|local\.session_token|Authorization:\s*'Bearer '/);
});


test('Auth-only Worker keeps existing Neon session semantics but never bundles an AI backend',()=>{
 const worker=readFileSync(new URL('../src/auth/cloudflare-auth-only-worker.ts',import.meta.url),'utf8');
 const vite=readFileSync(new URL('../vite.worker.config.mjs',import.meta.url),'utf8');
 const builder=readFileSync(new URL('../../../tools/prepare_cloudflare_ai_candidate.mjs',import.meta.url),'utf8');
 for(const expected of [
  'handleAuthProxyRequest','processAuthMiddleware','NEON_AUTH_COOKIE_SECRET',
  'authProxyPath(url,request.method)',"sameSite:'lax',sessionDataTtl:60",
  'redirect_oauth',"url.pathname.startsWith('/api/')"
 ])assert(worker.includes(expected),'Missing Auth-only contract '+expected);
 for(const prohibited of [
  "from './ai-","from './cloudflare-worker",
  'handleAiRoute','serverAiActor','reviewedAiLesson','D1Database','WorkersAI',
  'localStorage','indexedDB','sessionStorage',"Authorization: 'Bearer "
 ])assert(!worker.includes(prohibited),'Auth-only Worker must not include '+prohibited);
 assert(vite.includes('src/auth/cloudflare-auth-only-worker.ts'));
 assert(!vite.includes('src/auth/cloudflare-worker.ts'));
 assert(!builder.includes('dist-cloudflare-ai-candidate'));
 assert.match(builder,/process\.argv\[2\]!=='--build-auth-only'/);
 assert(vite.includes('dist-auth-worker'));
 assert(builder.includes('--build-auth-only'));
 assert(builder.includes('dist-cloudflare-auth-candidate'));
});

test('real Neon proxy routes /token upstream with session cookie, never session-cache body',async()=>{
 const {handleAuthProxyRequest}=await import('@neondatabase/auth/server');
 const nativeFetch=globalThis.fetch;
 let upstreamCalls=0;
 try{
  // This exercises the installed server toolkit, not a mock of its handler.
  // Only the upstream HTTP transport is simulated; no real identity or secret.
  globalThis.fetch=async(url,init)=>{
   upstreamCalls++;
   assert.equal(new URL(url).pathname,'/li/auth/token');
   assert.equal(init.method,'GET');
   const cookie=new Headers(init.headers).get('cookie')||'';
   assert.match(cookie,/__Secure-neon-auth\.session_token=test-opaque-session/);
   assert.doesNotMatch(cookie,/tracking_cookie/);
   return Response.json({token:'a.b.jwt'+upstreamCalls});
  };
  for(let i=1;i<=2;i++){
   const request=new Request('https://li5610.pages.dev/api/auth/token',{
    headers:{Cookie:'__Secure-neon-auth.session_token=test-opaque-session; tracking_cookie=x'}
   });
   const path=authProxyPath(new URL(request.url),request.method);
   assert.equal(path,'token');
   const response=await handleAuthProxyRequest({
    request,path,baseUrl:'https://upstream.example/li/auth',
    cookieSecret:'test-secret-32-characters-minimum-for-ci',
    sameSite:'lax',sessionDataTtl:60
   });
   assert.equal(response.status,200);
   assert.deepEqual(await response.json(),{token:'a.b.jwt'+i});
  }
  assert.equal(upstreamCalls,2,'The proxy must never serve /token from session cache');
 }finally{
  globalThis.fetch=nativeFetch;
 }
});

test('only allowlisted first-party GET session bypasses the lossy SDK cookie cache',()=>{
 const origin=FIRST_PARTY_ORIGIN;
 const request=new Request(origin+'/api/auth/get-session?disableCookieCache=false&other=1',{
  headers:{Cookie:'__Secure-neon-auth.session_token=old-session'}
 });
 const restored=firstPartySessionRequest(request);
 assert.equal(new URL(restored.url).searchParams.get('disableCookieCache'),'true');
 assert.equal(new URL(restored.url).searchParams.get('other'),'1');
 assert.equal(restored.headers.get('cookie'),request.headers.get('cookie'));
 assert.equal(restored.method,'GET');
 for(const other of [
  new Request(origin+'/api/auth/token'),
  new Request(origin+'/api/auth/sign-out',{method:'POST'}),
  new Request(origin+'/api/auth/get-session',{method:'POST'}),
  new Request('https://example.invalid/api/auth/get-session')
 ])assert.equal(firstPartySessionRequest(other),other);
 for(const name of ['cloudflare-auth-only-worker.ts']){
  const worker=readFileSync(new URL('../src/auth/'+name,import.meta.url),'utf8');
  assert.match(worker,/request:firstPartySessionRequest\(request\),path,baseUrl:/);
 }
});

test('managed session restore forwards the real upstream renewal cookie; no session remains signed out',async()=>{
 const {handleAuthProxyRequest}=await import('@neondatabase/auth/server');
 const nativeFetch=globalThis.fetch;
 const oldCookie='__Secure-neon-auth.session_token=old-session';
 const renewedCookie='__Secure-neon-auth.session_token=renewed-session; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax';
 const now=new Date().toISOString();
 const body={
  session:{id:'test-session',userId:'test-user',token:'renewed-session',
   createdAt:now,updatedAt:now,expiresAt:new Date(Date.now()+604800000).toISOString()},
  user:{id:'test-user',email:'test@example.invalid',name:'Synthetic user',emailVerified:true,createdAt:now,updatedAt:now}
 };
 let directCalls=0;
 let signedOut=false;
 try{
  globalThis.fetch=async(url,init)=>{
   const u=new URL(url);
   assert.equal(u.pathname,'/li/auth/get-session');
   const cookie=new Headers(init?.headers).get('cookie')||'';
   if(u.searchParams.get('disableCookieCache')==='true'){
    directCalls++;
    if(signedOut){
     assert.equal(cookie,'');
     return Response.json(null);
    }
    assert.equal(cookie,oldCookie);
    return Response.json(body,{headers:{'Set-Cookie':renewedCookie}});
   }
   // Optional SDK session-data minting performs its own upstream read.
   assert.match(cookie,/__Secure-neon-auth\.session_token=renewed-session/);
   return Response.json(body);
  };
  const proxy=async(request)=>handleAuthProxyRequest({
   request:firstPartySessionRequest(request),path:'get-session',
   baseUrl:'https://upstream.example/li/auth',
   cookieSecret:'test-secret-32-characters-minimum-for-ci',sameSite:'lax',sessionDataTtl:60
  });
  const response=await proxy(new Request(FIRST_PARTY_ORIGIN+'/api/auth/get-session',{
   headers:{Cookie:oldCookie}
  }));
  assert.equal(response.status,200);
  const cookies=response.headers.getSetCookie();
  assert(cookies.some(c=>c.startsWith('__Secure-neon-auth.session_token=renewed-session;')&&
   /Max-Age=604800/i.test(c)&&/HttpOnly/i.test(c)&&/Secure/i.test(c)&&/Path=\//i.test(c)),
   'upstream session renewal and security attributes must reach the browser');
  assert.equal((await response.json()).user.id,'test-user');
  signedOut=true;
  const expired=await proxy(new Request(FIRST_PARTY_ORIGIN+'/api/auth/get-session'));
  assert.equal(await expired.json(),null);
  assert.equal(directCalls,2);
 }finally{globalThis.fetch=nativeFetch;}
});
