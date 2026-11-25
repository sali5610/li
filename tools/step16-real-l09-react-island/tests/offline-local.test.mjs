import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/auth/offline-local.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const {rememberOfflineInvite,recentOfflineOwner,forgetOfflineInvite,OFFLINE_LEASE_MS}=
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const staging='https://sali5610.github.io',cloud='https://li5610.pages.dev',
 now=1700000000000,day=24*60*60*1000,key='li.offline.device-invite.v3';
const store=(owner=null,map=new Map(owner===null?[]:[['li.sync.local-owner.v1',owner]]))=>({
 map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),
 removeItem:k=>map.delete(k)
});
const remember=(device,origin=cloud,time=now)=>rememberOfflineInvite('A',time,device,origin);
const offline=(device,origin=cloud,time=now)=>recentOfflineOwner(true,time,device,origin);

test('fresh PWA process restores same verified device owner for exactly seven days',()=>{
 const device=store('A');
 assert.equal(offline(device),null);
 assert.equal(remember(device),true);
 // Reopen: a fresh storage wrapper/process; no sessionStorage is available.
 const reopened=store(null,device.map);
 assert.equal(offline(reopened,cloud,now+day),'A');
 assert.equal(offline(reopened,cloud,now+7*day-1),'A');
 assert.equal(OFFLINE_LEASE_MS,7*day);
 assert.equal(offline(reopened,cloud,now+7*day),null);
 assert.equal(offline(reopened,cloud,now-1),null);
 assert.equal(recentOfflineOwner(false,now+day,reopened,cloud),null);
 assert.equal(device.getItem('li.sync.local-owner.v1'),'A');
});
test('offline reads do not renew; successful online verification establishes a new seven-day window',()=>{
 const device=store('A');assert.equal(remember(device),true);
 const original=device.getItem(key);
 assert.equal(offline(device,cloud,now+6*day),'A');
 assert.equal(device.getItem(key),original);
 assert.equal(offline(device,cloud,now+7*day),null);
 assert.equal(remember(device,cloud,now+6*day),true);
 assert.equal(offline(device,cloud,now+13*day-1),'A');
 assert.equal(offline(device,cloud,now+13*day),null);
});
test('trusted origin and same local owner required; never preview, unknown owner, or online bypass',()=>{
 const device=store('A');
 assert.equal(remember(device,staging),true);
 assert.equal(offline(device,staging),'A');
 for(const origin of ['https://27be6f06.li5610.pages.dev','https://fake.li5610.pages.dev','https://evil.example']){
  assert.equal(offline(device,origin),null);
  assert.equal(remember(device,origin),false);
 }
 assert.equal(rememberOfflineInvite('B',now,device,cloud),false);
 assert.equal(remember(store()),false);
 assert.equal(offline(store('A')),null);
 device.setItem('li.sync.local-owner.v1','B');
 assert.equal(offline(device),null);
});
test('logout, revocation or explicit offline lock invalidate the persistent grant and preserve local owner',()=>{
 const device=store('A');assert.equal(remember(device),true);
 assert.equal(forgetOfflineInvite(device),true);
 assert.equal(offline(store(null,device.map)),null);
 assert.equal(device.getItem('li.sync.local-owner.v1'),'A');
 assert.equal(remember(device),true);
 assert.equal(offline(device),'A');
});
test('old durable and session grants are never grandfathered',()=>{
 const device=store('A');
 device.setItem('li.offline.recent-invite.v1',JSON.stringify({v:1,uid:'A',verifiedAt:now}));
 device.setItem('li.offline.active-session.v1',JSON.stringify({v:2,uid:'A',verifiedAt:now}));
 assert.equal(offline(device),null);
 assert.equal(remember(device),true);
 assert.equal(device.getItem('li.offline.recent-invite.v1'),null);
 assert.equal(offline(device),'A');
});
test('malformed, wrong owner, wrong schema, rollback/future and unavailable storage fail closed',()=>{
 const device=store('A');
 for(const value of ['invalid','{}','locked',
  JSON.stringify({v:2,uid:'A',verifiedAt:now}),
  JSON.stringify({v:3,uid:'A',verifiedAt:now+5000}),
  JSON.stringify({v:3,uid:'A',verifiedAt:now+0.5}),
  JSON.stringify({v:3,uid:'B',verifiedAt:now}),
  JSON.stringify({v:3,uid:'A',verifiedAt:0})]){
  device.setItem(key,value);assert.equal(offline(device),null);
 }
 const broken={getItem(){throw Error('storage blocked');},
  setItem(){throw Error('storage blocked');},removeItem(){throw Error('storage blocked');}};
 assert.equal(recentOfflineOwner(true,now,broken,cloud),null);
 assert.equal(rememberOfflineInvite('A',now,broken,cloud),false);
 assert.equal(forgetOfflineInvite(broken),false);
});
test('failed deletion falls back to a non-authorizing tombstone; failed lock is not reported as success',()=>{
 const device=store('A');assert.equal(remember(device),true);
 const noDelete={...device,removeItem(){throw Error('blocked deletion');}};
 assert.equal(forgetOfflineInvite(noDelete),true);
 assert.equal(offline(device),null);
 assert.equal(remember(device),true);
 const noWrite={...noDelete,setItem(){throw Error('blocked write');}};
 assert.equal(forgetOfflineInvite(noWrite),false);
});
test('offline lesson writes stay local; online invite, RLS and outbox contracts remain intact',()=>{
 const ports=readFileSync(new URL('../src/learning/staging-ports.ts',import.meta.url),'utf8');
 const auth=readFileSync(new URL('../src/auth/AuthPanel.tsx',import.meta.url),'utf8');
 const sync=readFileSync(new URL('../src/auth/learner-sync.ts',import.meta.url),'utf8');
 assert.match(ports,/if\(!navigator\.onLine\)[\s\S]*recentOfflineOwner\(true\)[\s\S]*return \{subjectId:localUid\}/);
 assert.match(ports,/await checkInviteAccess\(NEON_DATA_API_URL,neonSessionPort\)/);
 assert.match(auth,/if\(!allowed\)forgetOfflineInvite\(\)/);
 assert.match(auth,/const offlineAccess=localOffline&&\(access==='offline'\|\|access==='granted'\)/);
 assert.match(auth,/startLearnerSync\(accountId/);
 assert.match(auth,/const allowed=await checkInviteAccess[\s\S]*setVerifiedInvite\(allowed&&navigator\.onLine\?\{uid:liveAccountId,at:Date\.now\(\)\}:null\)/);
 assert.match(auth,/verifiedInvite\?\.uid===liveAccountId\)[\s\S]*rememberOfflineInvite\(liveAccountId,verifiedInvite\.at\)/);
 assert.match(auth,/if\(isOffline\)\{[\s\S]*forgetOfflineInvite\(\)/);
 assert.match(auth,/if\(!IS_INTEGRATED_LI_APP\|\|isPending\|\|localOffline\)return/);
 assert.match(sync,/capturePersonalState\(uid,api,store,observed\)/);
 assert.match(sync,/if\(!navigator\.onLine\|\|!api\)\{report\('offline'\);return;\}/);
});
