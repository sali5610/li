import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {syncOnce} from '../.sync-test/sync-once.js';
import {RevisionConflict} from '../.sync-test/contract.js';

const uid='same-invited-learner',id='L09-1-2';
const gate={twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true};
test('PWA offline outbox uploads to Neon and Safari separate browser profile pulls it',async()=>{
 const pwa=new PrivateDeviceStore('li-test-pwa-profile-reconnect');
 const safari=new PrivateDeviceStore('li-test-safari-profile-reconnect');
 const rows=new Map();
 const api={
  accountId:uid,
  async write(entry){
   const key=entry.itemType+':'+entry.itemId;
   const prior=rows.get(key);
   if((prior?.revision??0)!==entry.baseRevision)throw new RevisionConflict();
   const next={owner_id:uid,item_type:entry.itemType,item_id:entry.itemId,
    revision:entry.baseRevision+1,payload:entry.payload,
    changed_at:'2026-11-21T00:00:00Z',deleted_at:entry.deletedAt};
   rows.set(key,next);return next;
  },
  async all(){return Array.from(rows.values());}
 };
 try{
  const payload={schema:'li.native.lesson.v1',data:{draft:['PWA answer','','',''],ratings:[null,null,null,null]}};
  await pwa.edit(uid,'lesson_attempt',id,payload);
  const offline=await syncOnce(pwa,{accountId:uid,async write(){throw Error('NETWORK_OFFLINE');},
   async all(){throw Error('NETWORK_OFFLINE');}},uid,gate);
  assert.equal(offline.mode,'offline');
  assert.equal((await pwa.counts(uid)).pending,1);
  assert.equal((await safari.accountRecords(uid)).length,0);
  const resumed=await syncOnce(pwa,api,uid,gate);
  assert.equal(resumed.mode,'synced');
  assert.equal(resumed.uploaded,1);
  assert.equal((await pwa.counts(uid)).pending,0);
  const readOnSafari=await syncOnce(safari,api,uid,gate);
  assert.equal(readOnSafari.mode,'synced');
  assert.equal(readOnSafari.downloaded,1);
  const pulled=await safari.records.get(JSON.stringify([uid,'lesson_attempt',id]));
  assert.deepEqual(pulled?.payload,payload);
 }finally{
  pwa.close();safari.close();
  await pwa.delete();await safari.delete();
 }
});

test('iPhone reconnect refreshes managed session and rechecks signed Neon invite before sync',()=>{
 const panel=readFileSync(new URL('../src/auth/AuthPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/const network=\(\)=>\{[\s\S]*?if\(online\)void refetch\(\)/);
 assert.match(panel,/window\.addEventListener\('pageshow',refresh\)/);
 assert.match(panel,/window\.addEventListener\('online',network\)/);
 assert.match(panel,/const allowed=await checkInviteAccess\(NEON_DATA_API_URL,neonSessionPort\)/);
 assert.match(panel,/return startLearnerSync\(accountId/);
});
