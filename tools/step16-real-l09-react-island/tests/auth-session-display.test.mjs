import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const path=new URL('../src/auth/auth-display.ts',import.meta.url);
const source=readFileSync(path,'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const {deferAuthScreen}=await import('data:text/javascript;base64,'+
 Buffer.from(compiled).toString('base64'));
const check=(pending,offlineGrant,uid,access,ready)=>
 deferAuthScreen(true,pending,offlineGrant,uid,access,ready);

test('refresh and session revalidation never show a login card while authorization is pending',()=>{
 assert.equal(check(true,false,null,'checking',false),true);
 assert.equal(check(false,false,'A','checking',false),true);
 assert.equal(check(false,false,'A','granted',false),true);
 assert.equal(check(true,false,'A','granted',true),true);
});
test('online signed-out, revoked, expired or failed sessions show actual Auth gate',()=>{
 assert.equal(check(false,false,null,'error',false),false);
 assert.equal(check(false,false,'A','denied',false),false);
 assert.equal(check(false,false,'A','error',false),false);
 assert.equal(check(false,false,'A','granted',true),false);
});
test('offline owner restore hides login until ready, then shows app, never an online bypass',()=>{
 assert.equal(check(true,true,'A','checking',false),true);
 assert.equal(check(false,true,'A','offline',false),true);
 assert.equal(check(false,true,'A','offline',true),false);
 assert.equal(check(false,false,null,'offline',false),false);
 assert.equal(deferAuthScreen(false,true,false,null,'checking',false),false);
});
test('AuthPanel uses neutral cover while pending, real gate on denial, and bounded device-scoped offline owner',()=>{
 const auth=readFileSync(new URL('../src/auth/AuthPanel.tsx',import.meta.url),'utf8');
 const boot=readFileSync(new URL('../src/auth/staging-app.tsx',import.meta.url),'utf8');
 const local=readFileSync(new URL('../src/auth/offline-local.ts',import.meta.url),'utf8');
 assert.match(auth,/const deferSignIn=deferAuthScreen\(IS_INTEGRATED_LI_APP,isPending&&!isOffline,localOffline,/);
 assert.match(auth,/!showApp&&!deferSignIn&&<main className="auth-pilot">/);
 assert.match(auth,/if\(!allowed\)forgetOfflineInvite\(\)/);
 assert.match(auth,/rememberOfflineInvite\(liveAccountId,verifiedInvite\.at\)/);
 assert.match(auth,/const localOffline=isOffline&&Boolean\(offlineId\)&&accountId===offlineId/);
 assert.match(auth,/if\(online&&\(!liveAccountId\|\|error\)\)void refetch\(\)/);
 assert.match(boot,/if\(!isVerified\(\)\)revealBoot\(\)/);
 assert.match(local,/const KEY='li\.offline\.device-invite\.v3'/);
 assert.match(local,/OFFLINE_LEASE_MS=7\*24\*60\*60\*1000/);
 assert.match(local,/device\.getItem\(KEY\)/);
 assert.doesNotMatch(local,/localStorage\.setItem\([^\n]*jwt|localStorage\.setItem\([^\n]*token/i);
});
