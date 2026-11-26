import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/auth/auth-recovery.ts',import.meta.url),'utf8');
const {recoverInviteAccess,isRecoverableInviteFailure}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
const noWait=async()=>{};
test('waking signed user recovers a transient session and server failure without refresh',async()=>{
 let calls=0;
 assert.equal(await recoverInviteAccess(async()=>{calls++;if(calls===1)throw Error('INVITE_AUTH_SESSION_FAILED');if(calls===2)throw Error('INVITE_CHECK_HTTP_503');return true;},()=>true,noWait),true);
 assert.equal(calls,3);
});
test('false invitation is confirmed once, mismatch and forbidden never retry or grant',async()=>{
 let calls=0;
 let invalidations=0;
 assert.equal(await recoverInviteAccess(async()=>{calls++;return false;},()=>true,noWait,6000,()=>{invalidations++;}),false);
 assert.equal(calls,2);assert.equal(invalidations,2);
 for(const code of ['INVITE_ACCOUNT_MISMATCH','INVITE_CHECK_HTTP_403','INVITE_JWT_INVALID','INVITE_CHECK_INVALID_RESPONSE','INVITE_CHECK_HTTP_429']){
  calls=0;await assert.rejects(recoverInviteAccess(async()=>{calls++;throw Error(code);},()=>true,noWait),new RegExp(code));assert.equal(calls,1);
 }
});
test('bounded retries and cancelled wake never apply stale invitation response',async()=>{
 let calls=0;
 await assert.rejects(recoverInviteAccess(async()=>{calls++;throw Error('INVITE_CHECK_HTTP_503');},()=>true,noWait),/503/);
 assert.equal(calls,3);
 let active=true;
 await assert.rejects(recoverInviteAccess(async()=>{active=false;return true;},()=>active,noWait),/CANCELLED/);
 calls=0;
 await assert.rejects(recoverInviteAccess(async()=>{calls++;throw Error('INVITE_AUTH_SESSION_FAILED');},()=>active,noWait),/CANCELLED/);
 assert.equal(calls,0);
});
test('a hung request is bounded and late responses cannot grant access',async()=>{
 let calls=0;
 assert.equal(await recoverInviteAccess(()=>{calls++;return calls===1?new Promise(()=>{}):Promise.resolve(true);},()=>true,noWait,10),true);
 assert.equal(calls,2);
 assert.equal(isRecoverableInviteFailure(Error('INVITE_CHECK_TIMEOUT')),true);
});
test('React gate binds verified invitation and prepared local owner to current account',()=>{
 const auth=readFileSync(new URL('../src/auth/AuthPanel.tsx',import.meta.url),'utf8');
 assert.match(auth,/readyOwner===accountId/);
 assert.match(auth,/verifiedInvite\?\.uid===liveAccountId/);
 assert.match(auth,/ownerReady&&\(onlineAccess\|\|offlineAccess\)/);
 assert.match(auth,/checkInviteAccess\(NEON_DATA_API_URL,neonInviteSessionPort,undefined,liveAccountId\)/);
 assert.match(auth,/\(\)=>!disposed&&navigator\.onLine/);
 assert.match(auth,/if\(online&&now-lastWake\.current<1200\)return/);
 assert.match(auth,/onClick=\{\(\)=>void retryAccess\(\)\}/);
});

test('false then true can recover only after fresh server confirmation, revoking local access first',async()=>{
 let calls=0,revoked=false;
 assert.equal(await recoverInviteAccess(async()=>{calls++;if(calls===2)assert.equal(revoked,true);return calls===2;},()=>true,noWait,6000,()=>{revoked=true;}),true);
 assert.equal(calls,2);
 let active=true;calls=0;revoked=false;
 await assert.rejects(recoverInviteAccess(async()=>{calls++;return false;},()=>active,async()=>{active=false;},6000,()=>{revoked=true;}),/CANCELLED/);
 assert.equal(calls,1);assert.equal(revoked,true);
});
