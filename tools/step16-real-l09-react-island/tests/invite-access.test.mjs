import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkInviteAccess,fetchFreshNeonSession,fetchSignedNeonJwt,safeInviteErrorCode,sessionJwtCandidate,safeJwtFetchError} from '../.sync-test/invite-access.js';

const endpoint='https://example.apirest.neon.tech/li/rest/v1';
const tokenFor=sub=>['e30',Buffer.from(JSON.stringify({
 sub,role:'authenticated',exp:Math.floor(Date.now()/1000)+600
})).toString('base64url'),'fake-signature'].join('.');
function authFor(id,subject=id){
 return {
  async getSession(){return {data:{user:id?{id}:null}};},
  async getJWTToken(){return tokenFor(subject);}
 };
}
const ok=(value,status=200)=>new Response(JSON.stringify(value),{
 status,headers:{'Content-Type':'application/json'}
});

test('a missing Google session is denied without any API request',async()=>{
 let calls=0;
 const allowed=await checkInviteAccess(endpoint,authFor(null),async()=>{calls++;return ok(true);});
 assert.equal(allowed,false);
 assert.equal(calls,0);
});
test('only a server-verified invitation grants access; no emails are sent by browser',async()=>{
 let calls=0;
 const allowed=await checkInviteAccess(endpoint,authFor('invited-user'),async(url,options)=>{
  calls++;
  assert.equal(new URL(url).pathname,'/li/rest/v1/rpc/li_is_invited');
  assert.equal(options.method,'POST');
  assert.equal(options.credentials,'omit');
  assert.equal(options.headers.Authorization,'Bearer '+tokenFor('invited-user'));
  assert.equal(options.body,'{}');
  assert.doesNotMatch(JSON.stringify(options),/gmail\\.com|@example\\.com/);
  return ok(true);
 });
 assert.equal(allowed,true);
 assert.equal(calls,1);
});
test('a valid Google login without an invitation is DENIED',async()=>{
 const allowed=await checkInviteAccess(endpoint,authFor('uninvited-user'),async()=>ok(false));
 assert.equal(allowed,false);
});
test('a signed JWT for another subject is rejected before network',async()=>{
 let calls=0;
 await assert.rejects(checkInviteAccess(endpoint,authFor('A','B'),async()=>{
  calls++;return ok(true);
 }),/INVITE_ACCOUNT_MISMATCH/);
 assert.equal(calls,0);
});
test('missing database invitation function never becomes an approved session',async()=>{
 await assert.rejects(checkInviteAccess(endpoint,authFor('A'),async()=>ok({message:'not found'},404)),/INVITE_CHECK_HTTP_404/);
});
test('unexpected truthy API payload cannot bypass the boolean check',async()=>{
 await assert.rejects(checkInviteAccess(endpoint,authFor('A'),async()=>ok({allowed:true})),/INVITE_CHECK_INVALID_RESPONSE/);
});
test('non-HTTPS API endpoint is refused',async()=>{
 await assert.rejects(checkInviteAccess('http://example.test/li/rest/v1',authFor('A')),/INVALID_INVITE_API_URL/);
});

test('session JWT candidate requires exactly three nonempty segments, never an opaque cookie',()=>{
 assert.equal(sessionJwtCandidate('opaque-session-token'),null);
 assert.equal(sessionJwtCandidate('opaque.token'),null);
 assert.equal(sessionJwtCandidate('a.b.'),null);
 assert.equal(sessionJwtCandidate('a.b.c'),'a.b.c');
 assert.equal(sessionJwtCandidate(null),null);
});

test('safe codes show invite HTTP stage without leaking response body or identity',()=>{
 assert.equal(safeInviteErrorCode(new Error('INVITE_CHECK_HTTP_404')),'INV-RPC-404');
 assert.equal(safeInviteErrorCode(new Error('INVITE_CHECK_HTTP_401')),'INV-RPC-401');
 assert.equal(safeInviteErrorCode(new Error('INVITE_CHECK_HTTP_500')),'INV-RPC-5XX');
 assert.equal(safeInviteErrorCode(new Error('INVITE_CHECK_INVALID_RESPONSE')),'INV-RPC-FORMAT');
 assert.equal(safeInviteErrorCode(new Error('NEON_AUTH_JWT_FETCH_FAILED')),'INV-JWT-FETCH');
 assert.equal(safeInviteErrorCode(new Error('INVITE_ACCOUNT_MISMATCH')),'INV-JWT-BIND');
 assert.equal(safeInviteErrorCode(new TypeError('Failed to fetch')),'INV-NET-OR-CLIENT');
});

test('unknown errors and attacker-controlled exception text are always redacted',()=>{
 const hostile='Bearer secret.jwt.payload user@example.com https://malicious.example/?code=secret';
 assert.equal(safeInviteErrorCode(new Error(hostile)),'INV-UNKNOWN');
 assert.equal(safeInviteErrorCode({message:hostile}),'INV-UNKNOWN');
 assert.equal(safeInviteErrorCode(new Error('INVITE_CHECK_HTTP_404'+hostile)),'INV-UNKNOWN');
});

test('failed invite RPC always keeps access closed, while safe diagnosis classifies the failure',async()=>{
 let code='';
 let allowed=false;
 try{allowed=await checkInviteAccess(endpoint,authFor('invited-user'),async()=>ok({error:'internal'},403));}
 catch(error){code=safeInviteErrorCode(error);}
 assert.equal(allowed,false);
 assert.equal(code,'INV-RPC-403');
});

test('regression: bypass Neon SDK 0.7.0-beta /token => getSession cache misclassification',()=>{
 const client=readFileSync(new URL('../src/auth/neon-client.ts',import.meta.url),'utf8');
 assert.match(client,/fetchSignedNeonJwt\(AUTH_API_URL\)/);
 assert.doesNotMatch(client,/authClient\.token\(\)|neonAuth\.getJWTToken\(\)/);
 assert.doesNotMatch(client,/localStorage|sessionStorage|indexedDB/);
});

test('signed JWT fetch uses official first-party endpoint and cookies, not SDK cache',async()=>{
 let calls=0;
 const jwt=tokenFor('invited-user');
 const result=await fetchSignedNeonJwt('https://li5610.pages.dev/api/auth',async(url,init)=>{
  calls++;
  assert.equal(url,'https://li5610.pages.dev/api/auth/token');
  assert.equal(init.method,'GET');
  assert.equal(init.credentials,'include');
  assert.equal(init.cache,'no-store');
  assert.equal(init.redirect,'error');
  assert.equal(init.headers.Accept,'application/json');
  return ok({token:jwt});
 });
 assert.equal(result,jwt);
 assert.equal(calls,1);
});

test('cached session object or opaque session token never grants invited access',async()=>{
 for(const data of [{session:{token:'opaque-session'},user:{id:'invited-user'}},{token:'opaque-session'},{}]){
  const candidate=await fetchSignedNeonJwt('https://li5610.pages.dev/api/auth',async()=>ok(data));
  assert.equal(candidate,null);
 }
});

test('JWT endpoint failures stay fail-closed, expose only safe codes',async()=>{
 await assert.rejects(
  fetchSignedNeonJwt('https://li5610.pages.dev/api/auth',async()=>ok({message:'sensitive'},401)),
  err=>safeInviteErrorCode(err)==='INV-JWT-401'
 );
 await assert.rejects(
  fetchSignedNeonJwt('https://li5610.pages.dev/api/auth',async()=>{throw TypeError('sensitive cookie');}),
  err=>safeInviteErrorCode(err)==='INV-JWT-FETCH'
 );
 await assert.rejects(
  fetchSignedNeonJwt('https://li5610.pages.dev/api/auth',async()=>new Response('unparseable')),
  err=>safeInviteErrorCode(err)==='INV-JWT-FORMAT'
 );
});

test('safe JWT error captures only allowlisted HTTP status with no untrusted details',()=>{
 const secret='Bearer aa.bb.cc user@example.com';
 assert.equal(safeInviteErrorCode(safeJwtFetchError({status:401,message:secret})),'INV-JWT-401');
 assert.equal(safeInviteErrorCode(safeJwtFetchError({status:403,message:secret})),'INV-JWT-403');
 assert.equal(safeInviteErrorCode(safeJwtFetchError({statusCode:429,message:secret})),'INV-JWT-429');
 assert.equal(safeInviteErrorCode(safeJwtFetchError({status:500,message:secret})),'INV-JWT-5XX');
 assert.equal(safeInviteErrorCode(safeJwtFetchError({status:200,message:secret})),'INV-JWT-FETCH');
 assert.equal(safeInviteErrorCode(safeJwtFetchError({status:'401',message:secret})),'INV-JWT-FETCH');
 assert.equal(safeInviteErrorCode(safeJwtFetchError({message:secret})),'INV-JWT-FETCH');
});

test('staging has an exact compile-time origin and repository path, not an open redirect',()=>{
 const configSource=readFileSync(new URL('../src/auth/config.ts',import.meta.url),'utf8');
 const viteSource=readFileSync(new URL('../vite.auth.config.mjs',import.meta.url),'utf8');
 const panelSource=readFileSync(new URL('../src/auth/AuthPanel.tsx',import.meta.url),'utf8');
 assert.match(configSource,/VITE_LI_AUTH_TARGET==='github-pages-staging'/);
 assert.match(configSource,/https:\/\/sali5610\.github\.io/);
 assert.match(configSource,/https:\/\/li5610\.pages\.dev/);
 assert.match(configSource,/return origin===AUTH_ORIGIN/);
 assert.match(viteSource,/ghStaging\?'\/li\/auth-pilot\/':'\/auth-pilot\/'/);
 assert.match(panelSource,/IS_GITHUB_STAGING\?'理 · li\.':t\.tag/);
 assert.match(panelSource,/document\.documentElement\.classList\.toggle\('li-auth-verified'/);
});

test('cached user cannot confuse temporarily absent session with explicit invite denial or a different account',async()=>{
 await assert.rejects(checkInviteAccess(endpoint,authFor(null),async()=>{throw Error('unexpected RPC');},'A'),/INVITE_AUTH_SESSION_FAILED/);
 await assert.rejects(checkInviteAccess(endpoint,authFor('B'),async()=>{throw Error('unexpected RPC');},'A'),/INVITE_ACCOUNT_MISMATCH/);
 assert.equal(await checkInviteAccess(endpoint,authFor('A'),async()=>ok(false),'A'),false);
 assert.equal(await checkInviteAccess(endpoint,authFor('A'),async()=>ok(true),'A'),true);
});

test('first-party invite identity is freshly obtained with managed cookies and no cache',async()=>{
 const result=await fetchFreshNeonSession('https://li5610.pages.dev/api/auth',async(url,init)=>{
  assert.equal(new URL(url).pathname,'/api/auth/get-session');assert.equal(new URL(url).searchParams.get('disableCookieCache'),'true');
  assert.equal(init.credentials,'include');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
  return ok({session:{userId:'A',token:'never-return'},user:{id:'A',email:'unused@example.invalid'}});
 });assert.deepEqual(result,{data:{user:{id:'A'}}});
 assert.deepEqual(await fetchFreshNeonSession('https://li5610.pages.dev/api/auth',async()=>ok(null)),{data:null});
 await assert.rejects(fetchFreshNeonSession('https://li5610.pages.dev/api/auth',async()=>ok({session:{userId:'B'},user:{id:'A'}})),/INVITE_AUTH_SESSION_FAILED/);
});
