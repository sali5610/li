import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/auth/offline-local.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const {rememberOfflineInvite,recentOfflineOwner,forgetOfflineInvite}=
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const staging='https://sali5610.github.io',cloud='https://li5610.pages.dev',
 now=1700000000000;
const store=(owner=null)=>{
 const map=new Map(owner===null?[]:[['li.sync.local-owner.v1',owner]]);
 return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),
  removeItem:k=>map.delete(k)};
};
const remember=(device,session,origin=cloud,time=now)=>rememberOfflineInvite(
 'A',time,session,origin,device);
const offline=(device,session,origin=cloud,time=now)=>recentOfflineOwner(
 true,time,session,origin,device);

test('online-verified account stays in current app session without 12h timeout',()=>{
 const device=store('A'),session=store();
 assert.equal(offline(device,session),null);
 assert.equal(remember(device,session),true);
 assert.equal(offline(device,session,cloud,now+1000),'A');
 assert.equal(offline(device,session,cloud,now+31*24*60*60*1000),'A',
  'no fixed 12h lease while the existing app session remains active');
 assert.equal(recentOfflineOwner(false,now+1000,session,cloud,device),null,
  'session-scoped local proof is never an online grant');
 assert.equal(offline(device,session,cloud,now-1),null);
});

test('fresh app/browser session requires online invitation; saved local owner survives',()=>{
 const device=store('A'),session=store();
 assert.equal(remember(device,session),true);
 assert.equal(offline(device,session),'A');
 const reopenedApp=store(); // Safari/PWA ended this tab session.
 assert.equal(offline(device,reopenedApp),null,'new session is not silently unlocked');
 assert.equal(device.getItem('li.sync.local-owner.v1'),'A',
  'offline lock does not destroy drafts/account-scoped stored work');
 assert.equal(remember(device,reopenedApp),true,
  'a NEW online invitation check may establish a new session');
});

test('same verified owner may work offline on staging and canonical Cloudflare, never preview/evil origin',()=>{
 const device=store('A'),session=store();
 assert.equal(remember(device,session,staging),true);
 assert.equal(offline(device,session,staging),'A');
 assert.equal(offline(device,session,'https://27be6f06.li5610.pages.dev'),null);
 assert.equal(offline(device,session,'https://fake.li5610.pages.dev'),null);
 assert.equal(offline(device,session,'https://evil.example'),null);
 assert.equal(remember(device,session,cloud),true);
 assert.equal(offline(device,session,cloud),'A');
 assert.equal(rememberOfflineInvite('B',now,session,cloud,device),false);
});

test('owner change, offline lock and forgotten session cannot unlock another account',()=>{
 const device=store('A'),session=store();
 assert.equal(remember(device,session),true);
 device.setItem('li.sync.local-owner.v1','B');
 assert.equal(offline(device,session),null);
 device.setItem('li.sync.local-owner.v1','A');
 forgetOfflineInvite(session,device);
 assert.equal(offline(device,session),null);
 assert.equal(device.getItem('li.sync.local-owner.v1'),'A');
});

test('old durable 12h grants are ignored and discarded, not grandfathered into new policy',()=>{
 const device=store('A'),session=store();
 device.setItem('li.offline.recent-invite.v1',
  JSON.stringify({v:1,uid:'A',verifiedAt:now}));
 assert.equal(offline(device,session),null,
  'old localStorage lease alone must not grant offline access');
 assert.equal(remember(device,session),true);
 assert.equal(device.getItem('li.offline.recent-invite.v1'),null);
});

test('corrupt, invalid-owner, stale schema and future session grants fail closed',()=>{
 const device=store('A'),session=store(),key='li.offline.active-session.v1';
 for(const value of ['invalid','{}',
  JSON.stringify({v:1,uid:'A',verifiedAt:now}),
  JSON.stringify({v:2,uid:'A',verifiedAt:now+5000}),
  JSON.stringify({v:2,uid:'A',verifiedAt:now+0.5}),
  JSON.stringify({v:2,uid:'B',verifiedAt:now}),
  JSON.stringify({v:2,uid:'A',verifiedAt:0})]){
  session.setItem(key,value);
  assert.equal(offline(device,session),null);
 }
 const broken={getItem(){throw Error('storage blocked');},
  setItem(){throw Error('storage blocked');},removeItem(){throw Error('storage blocked');}};
 assert.equal(recentOfflineOwner(true,now,broken,cloud,device),null);
 assert.equal(rememberOfflineInvite('A',now,broken,cloud,device),false);
 assert.doesNotThrow(()=>forgetOfflineInvite(broken,device));
});

test('offline lesson writes stay local; online invite, RLS and outbox contracts remain intact',()=>{
 const ports=readFileSync(new URL('../src/learning/staging-ports.ts',import.meta.url),'utf8');
 const auth=readFileSync(new URL('../src/auth/AuthPanel.tsx',import.meta.url),'utf8');
 const sync=readFileSync(new URL('../src/auth/learner-sync.ts',import.meta.url),'utf8');
 const local=readFileSync(new URL('../src/auth/offline-local.ts',import.meta.url),'utf8');
 assert.match(ports,/if\(!navigator\.onLine\)[\s\S]*recentOfflineOwner\(true\)[\s\S]*return \{subjectId:localUid\}/);
 assert.match(ports,/await checkInviteAccess\(NEON_DATA_API_URL,neonSessionPort\)/);
 assert.match(auth,/if\(!allowed\)forgetOfflineInvite\(\)/);
 assert.match(auth,/const offlineAccess=localOffline&&\(access==='offline'\|\|access==='granted'\)/);
 assert.match(auth,/startLearnerSync\(accountId/);
 assert.match(auth,/rememberOfflineInvite\(liveAccountId\)/);
 assert.match(auth,/if\(isOffline\)\{[\s\S]*forgetOfflineInvite\(\)/);
 assert.match(local,/sessionStorage/);
 assert.doesNotMatch(local,/OFFLINE_LEASE_MS|12\*60\*60\*1000/);
 assert.match(sync,/capturePersonalState\(uid,api,store,observed\)/);
 assert.match(sync,/if\(!navigator\.onLine\|\|!api\)\{report\('offline'\);return;\}/);
});
