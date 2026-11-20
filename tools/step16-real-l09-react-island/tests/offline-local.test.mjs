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
const origin='https://sali5610.github.io',now=1700000000000;
const makeStore=(owner='A')=>{
 const map=new Map([['li.sync.local-owner.v1',owner]]);
 return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),
  removeItem:k=>map.delete(k)};
};
test('real invited account can resume same-device work only while offline within 12 hours',()=>{
 const s=makeStore();
 assert.equal(recentOfflineOwner(true,now,s,origin),null);
 assert.equal(rememberOfflineInvite('A',now,s,origin),true);
 assert.equal(recentOfflineOwner(true,now+1000,s,origin),'A');
 assert.equal(recentOfflineOwner(false,now+1000,s,origin),null);
 assert.equal(recentOfflineOwner(true,now+OFFLINE_LEASE_MS-1,s,origin),'A');
 assert.equal(recentOfflineOwner(true,now+OFFLINE_LEASE_MS,s,origin),null);
 assert.equal(recentOfflineOwner(true,now-1,s,origin),null);
});
test('account switch, explicit local lock, other origins and unverified owner fail closed',()=>{
 const s=makeStore('A');
 assert.equal(rememberOfflineInvite('B',now,s,origin),false);
 assert.equal(rememberOfflineInvite('A',now,s,'https://li5610.pages.dev'),false);
 assert.equal(rememberOfflineInvite('A',now,s,origin),true);
 assert.equal(recentOfflineOwner(true,now,s,'https://li5610.pages.dev'),null);
 s.setItem('li.sync.local-owner.v1','B');
 assert.equal(recentOfflineOwner(true,now,s,origin),null);
 s.setItem('li.sync.local-owner.v1','A');
 forgetOfflineInvite(s);
 assert.equal(recentOfflineOwner(true,now,s,origin),null);
});
test('corrupted, future and noninteger grants are refused without assuming remote authorization',()=>{
 const s=makeStore('A'),key='li.offline.recent-invite.v1';
 for(const value of ['invalid','{}','{"v":99,"uid":"A","verifiedAt":1700000000000}',
  JSON.stringify({v:1,uid:'A',verifiedAt:now+5000}),
  JSON.stringify({v:1,uid:'A',verifiedAt:now+0.5}),
  JSON.stringify({v:1,uid:'A',verifiedAt:now-OFFLINE_LEASE_MS-1})]){
  s.setItem(key,value);
  assert.equal(recentOfflineOwner(true,now,s,origin),null);
 }
 const broken={getItem(){throw Error('storage blocked');},setItem(){throw Error('storage blocked');},removeItem(){throw Error('storage blocked');}};
 assert.equal(recentOfflineOwner(true,now,broken,origin),null);
 assert.equal(rememberOfflineInvite('A',now,broken,origin),false);
 assert.doesNotThrow(()=>forgetOfflineInvite(broken));
});
test('offline lesson route does not ask Neon; online invite, RLS and sync contracts stay intact',()=>{
 const ports=readFileSync(new URL('../src/learning/staging-ports.ts',import.meta.url),'utf8');
 const auth=readFileSync(new URL('../src/auth/AuthPanel.tsx',import.meta.url),'utf8');
 assert.match(ports,/if\(!navigator\.onLine\)[\s\S]*recentOfflineOwner\(true\)[\s\S]*return \{subjectId:localUid\}/);
 assert.match(ports,/await checkInviteAccess\(NEON_DATA_API_URL,neonSessionPort\)/);
 assert.match(auth,/if\(!allowed\)forgetOfflineInvite\(\)/);
 assert.match(auth,/access==='offline'&&localOffline/);
 assert.match(auth,/startLearnerSync\(accountId/);
 assert.match(auth,/if\(isOffline\)\{[\s\S]*forgetOfflineInvite\(\)/);
});
