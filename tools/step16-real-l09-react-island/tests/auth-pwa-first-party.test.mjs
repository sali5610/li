import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/auth/first-party-contract.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const {authProxyPath,isFirstPartyCallback,FIRST_PARTY_ORIGIN}=await import(
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
 const worker=readFileSync(new URL('../src/auth/cloudflare-worker.ts',import.meta.url),'utf8');
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
 assert(vite.includes('LI_AUTH_ONLY_WORKER'));
 assert(vite.includes('dist-auth-worker'));
 assert(builder.includes('--build-auth-only'));
 assert(builder.includes('dist-cloudflare-auth-candidate'));
});
