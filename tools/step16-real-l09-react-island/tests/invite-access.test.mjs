import test from 'node:test';
import assert from 'node:assert/strict';
import {checkInviteAccess,safeInviteErrorCode,sessionJwtCandidate} from '../.sync-test/invite-access.js';

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
