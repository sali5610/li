import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/auth/oauth-return.ts',import.meta.url),'utf8');
const transpiled=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const {classifyOAuthReturn}=await import('data:text/javascript;base64,'+
 Buffer.from(transpiled).toString('base64'));

test('a normal direct visit shows no OAuth error',()=>{
 assert.equal(classifyOAuthReturn('',false,false),null);
 assert.equal(classifyOAuthReturn('?pilot=auth',false,false),null);
 assert.equal(classifyOAuthReturn('?pilot=auth&oauth=returned',true,false),null);
 assert.equal(classifyOAuthReturn('?pilot=auth&oauth=returned',false,true),null);
});
test('an OAuth callback with no session is visible rather than silently returning to login',()=>{
 assert.deepEqual(classifyOAuthReturn('?pilot=auth&oauth=returned',false,false),{kind:'no-session'});
});
test('social sign-in account_not_linked is displayed as a safe, known code',()=>{
 assert.deepEqual(classifyOAuthReturn(
  '?pilot=auth&oauth=failed&error=account_not_linked',false,false
 ),{kind:'oauth-error',code:'account_not_linked'});
});
test('Safari/OAuth state mismatch and signup disabled are recognizable without leaking data',()=>{
 for(const code of ['state_mismatch','state_security_mismatch','signup_disabled',
 'unable_to_create_session','unable_to_create_user','no_callback_url',
 'invalid_callback_request']){
  assert.deepEqual(classifyOAuthReturn(
   '?pilot=auth&oauth=failed&error='+code,false,false
  ),{kind:'oauth-error',code});
 }
});
test('never echo arbitrary malicious error values or descriptions, Google tokens or state',()=>{
 const res=classifyOAuthReturn(
  '?pilot=auth&oauth=failed&error=token_ABC&error_description=privateSecret&state=privateOAuthState',
  false,false
 );
 assert.deepEqual(res,{kind:'oauth-error',code:'unknown'});
 assert.doesNotMatch(JSON.stringify(res),/privateSecret|privateOAuthState|token_ABC/);
});
test('without valid pilot marker, skip all query errors; no leaked API code',()=>{
 assert.equal(classifyOAuthReturn('?error=account_not_linked',false,false),null);
});
test('valid pilot error callback with no provider code is fail-closed unknown',()=>{
 assert.deepEqual(classifyOAuthReturn('?pilot=auth&oauth=failed',false,false),
 {kind:'oauth-error',code:'unknown'});
});
