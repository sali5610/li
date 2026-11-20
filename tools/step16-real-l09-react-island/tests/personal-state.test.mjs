import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateDeviceStore} from '../.sync-private-test/sync/local-dexie.js';
import {storageKey} from '../.sync-private-test/sync/contract.js';
import {PERSONAL_FIELDS,capturePersonalState,hydratePersonalState,
 preparePersonalAccount,journalCloudConsent,personalRemoteSnapshot} from '../.sync-private-test/auth/private-state.js';

function device(){
 const data=new Map();
 globalThis.localStorage={
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,val)=>data.set(key,String(val)),
  removeItem:key=>data.delete(key)
 };
 globalThis.window={dispatchEvent(){}};
 return data;
}
async function withStore(run){
 const store=new PrivateDeviceStore('li-private-state-test-'+crypto.randomUUID());
 try{await run(store);}finally{store.close();await store.delete();}
}
test('real app keys mirror independently; sensitive journal never uploads without consent',async()=>{
 const map=device(),uid='account-1',library='{"schema":1,"cases":[],"questions":[],"ideas":[],"savedContent":[]}';
 localStorage.setItem('li.private.library.v1',library);
 localStorage.setItem('li.study-mode.v1','focus');
 localStorage.setItem('li.personal.daily.v1','{"schema":1,"days":{"2026-11-20":{"checkins":1}}}');
 localStorage.setItem('li.personal.daily.enabled.v1','true');
 await withStore(async store=>{
  const seen=new Map();
  const snapshots=await capturePersonalState(uid,null,store,seen);
  assert(snapshots.some(x=>x.field.id==='library'));
  assert(!snapshots.some(x=>x.field.id==='daily-journal'),'journal is excluded without explicit consent');
  assert.equal((await store.records.get(storageKey(uid,'note','library')))?.payload.raw,library);
  assert.equal((await store.records.get(storageKey(uid,'preference','study-mode')))?.payload.raw,'focus');
  assert.equal(await store.records.get(storageKey(uid,'note','daily-journal')),undefined);
  assert.equal(await store.records.get(storageKey(uid,'preference','daily-enabled')),undefined);
  assert.equal(await store.records.get(storageKey(uid,'preference','journal-cloud-consent')),undefined);
  assert.equal(journalCloudConsent(uid),false);
  localStorage.setItem('li.sync.journal-cloud-consent.v1:'+uid,'true');
  const consented=await capturePersonalState(uid,null,store,seen);
  assert(consented.some(x=>x.field.id==='daily-journal'),'journal now enters outbox only after opt-in');
  assert.equal((await store.records.get(storageKey(uid,'note','daily-journal')))?.payload.schema,'li.personal.storage.v1');
  assert.equal((await store.records.get(storageKey(uid,'preference','journal-cloud-consent')))?.payload.raw,'true');
  assert.equal(journalCloudConsent(uid),true);
 });
 assert.equal(map.get('li.private.library.v1'),library);
});
test('a new device restores account-scoped settings and notes without creating an upload',async()=>{
 device();const uid='account-2',library='{"schema":1,"cases":[{"id":"case-1"}],"questions":[],"ideas":[],"savedContent":[]}';
 await withStore(async store=>{
  const snaps=await capturePersonalState(uid,null,store,new Map());
  assert.equal((await store.counts(uid)).pending,0);
  await store.apply(uid,{owner_id:uid,item_type:'note',item_id:'library',revision:4,
   changed_at:'2026-11-20T06:25:00Z',deleted_at:null,
   payload:{schema:'li.personal.storage.v1',storageKey:'li.private.library.v1',raw:library}});
  const restored=await hydratePersonalState(uid,snaps,store,()=>{});
  assert.equal(restored,true);
  assert.equal(localStorage.getItem('li.private.library.v1'),library);
  assert.equal((await store.counts(uid)).pending,0,'read-only restore must not queue an overwrite');
  assert.equal(personalRemoteSnapshot(uid,'note','library',
   {schema:'li.personal.storage.v1',storageKey:'li.private.library.v1',raw:library})?.raw,library);
  assert.equal(personalRemoteSnapshot(uid,'note','unknown',
   {schema:'li.personal.storage.v1',storageKey:'secret',raw:'x'}),null);
 });
});
test('switching invited accounts preserves private keys without leaking current account data',()=>{
 device();
 localStorage.setItem('li.private.library.v1','{"owner":"A"}');
 localStorage.setItem('li.study-mode.v1','focus');
 preparePersonalAccount('account-A','account-B');
 assert.equal(localStorage.getItem('li.private.library.v1'),null);
 assert.equal(localStorage.getItem('li.study-mode.v1'),null);
 assert.equal(localStorage.getItem('li.sync.local-backup.v1:account-A:li.private.library.v1'),'{"owner":"A"}');
 preparePersonalAccount('account-B','account-A');
 assert.equal(localStorage.getItem('li.private.library.v1'),'{"owner":"A"}');
 assert.equal(localStorage.getItem('li.study-mode.v1'),'focus');
 assert(PERSONAL_FIELDS.length>=10);
});
