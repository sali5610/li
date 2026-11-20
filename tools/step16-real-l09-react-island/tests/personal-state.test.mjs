import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateDeviceStore} from '../.sync-private-test/sync/local-dexie.js';
import {storageKey} from '../.sync-private-test/sync/contract.js';
import {PERSONAL_FIELDS,capturePersonalState,hydratePersonalState,
 preparePersonalAccount,journalCloudConsent,personalRemoteSnapshot,t02Fields} from '../.sync-private-test/auth/private-state.js';

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

test('fresh-device diary default cannot overwrite signed cloud recording preference',async()=>{
 device();const uid='account-diary-default';
 localStorage.setItem('li.sync.journal-cloud-consent.v1:'+uid,'true');
 localStorage.setItem('li.personal.daily.enabled.v1','true'); // auto-created by app, not a user edit
 await withStore(async store=>{
  const remote={owner_id:uid,item_type:'preference',item_id:'daily-enabled',revision:5,
   changed_at:'2026-11-20T06:25:00Z',deleted_at:null,
   payload:{schema:'li.personal.storage.v1',storageKey:'li.personal.daily.enabled.v1',raw:'false'}};
  await store.apply(uid,remote);
  const snaps=await capturePersonalState(uid,null,store,new Map());
  assert.equal(await store.outbox.get(storageKey(uid,'preference','daily-enabled')),undefined);
  assert.equal(await hydratePersonalState(uid,snaps,store,()=>{}),true);
  assert.equal(localStorage.getItem('li.personal.daily.enabled.v1'),'false');
 });
});
test('a true journal divergence is retained as a conflict, never overwritten silently',async()=>{
 device();const uid='account-journal-diverged';
 localStorage.setItem('li.sync.journal-cloud-consent.v1:'+uid,'true');
 const local='{"schema":1,"days":{"2026-11-20":{"checkins":2}}}';
 const remote='{"schema":1,"days":{"2026-11-20":{"checkins":1}}}';
 localStorage.setItem('li.personal.daily.v1',local);
 await withStore(async store=>{
  await store.apply(uid,{owner_id:uid,item_type:'note',item_id:'daily-journal',
   revision:3,changed_at:'2026-11-20T06:25:00Z',deleted_at:null,
   payload:{schema:'li.personal.storage.v1',storageKey:'li.personal.daily.v1',raw:remote}});
  await capturePersonalState(uid,null,store,new Map());
  const pending=await store.outbox.get(storageKey(uid,'note','daily-journal'));
  assert.equal(pending?.conflict,true);
  assert.equal((await store.records.get(storageKey(uid,'note','daily-journal')))?.payload.raw,local);
 });
});


test('deleting an observed saved note queues a tombstone; another device removes it',async()=>{
 device();
 const uid='account-delete',field='li.private.library.v1';
 const original='{"schema":1,"cases":[{"id":"to-delete"}],"questions":[],"ideas":[],"savedContent":[]}';
 const key=storageKey(uid,'note','library');
 localStorage.setItem(field,original);
 await withStore(async store=>{
  const seen=new Map();
  await capturePersonalState(uid,null,store,seen);
  const first=await store.outbox.get(key);
  assert(first);
  const saved={owner_id:uid,item_type:'note',item_id:'library',revision:1,
   payload:first.payload,deleted_at:null,changed_at:'2026-11-20T06:00:00Z'};
  await store.accept(uid,first,saved);
  assert.equal((await store.counts(uid)).pending,0);

  // The same signed tab observed this value before the user deleted it.
  localStorage.removeItem(field);
  await capturePersonalState(uid,null,store,seen);
  const deletion=await store.outbox.get(key);
  assert.equal(deletion?.baseRevision,1);
  assert.equal(deletion?.payload.raw,'');
  assert.equal(typeof deletion?.deletedAt,'string');
  assert.equal((await store.counts(uid)).pending,1);
  const tombstone={...saved,revision:2,payload:deletion.payload,
   deleted_at:deletion.deletedAt,changed_at:'2026-11-20T06:01:00Z'};

  await withStore(async secondDevice=>{
   device();
   localStorage.setItem(field,original);
   await secondDevice.apply(uid,saved);
   const remoteSnaps=await capturePersonalState(uid,null,secondDevice,new Map());
   assert.equal((await secondDevice.counts(uid)).pending,0);
   await secondDevice.apply(uid,tombstone);
   assert.equal(await hydratePersonalState(uid,remoteSnaps,secondDevice,()=>{}),true);
   assert.equal(localStorage.getItem(field),null,'remote delete is not resurrected');
  });
 });
});

test('T12 uses existing signed account outbox and restores the same lesson on another device',async()=>{
 const uid='t12-account',other='other-user',context='L09-1-2';
 const id='spell-t12-resume-'+context,key='li.spell.t12.resume.v1:'+encodeURIComponent(uid)+':'+context;
 const raw=JSON.stringify({schema:'li.spell.t12.v1',phase:1,
  context:'Đang học',next:'Viết kết luận',answer:'Mới viết dở',
  updatedAt:'2026-11-21T00:00:00Z'});
 device();localStorage.setItem(key,raw);
 await withStore(async first=>{
  await capturePersonalState(uid,null,first,new Map());
  const outbox=await first.outbox.get(storageKey(uid,'l2_progress',id));
  assert.equal(outbox?.payload.raw,raw);
  const serverRow={owner_id:uid,item_type:'l2_progress',item_id:id,
   revision:1,changed_at:'2026-11-21T00:01:00Z',deleted_at:null,payload:outbox.payload};
  await first.accept(uid,outbox,serverRow);
  device();
  await withStore(async fresh=>{
   const snaps=await capturePersonalState(uid,null,fresh,new Map());
   assert.equal((await fresh.counts(uid)).pending,0,'fresh device must not invent upload');
   await fresh.apply(uid,serverRow); // existing syncOnce brings this owner-verified row
   assert.equal(await hydratePersonalState(uid,snaps,fresh,()=>{}),true);
   assert.equal(localStorage.getItem(key),raw);
   assert.equal((await fresh.counts(uid)).pending,0);
   assert.equal(personalRemoteSnapshot(uid,'l2_progress',id,serverRow.payload)?.raw,raw);
   assert.throws(()=>personalRemoteSnapshot(other,'l2_progress',id,serverRow.payload),
    /PRIVATE_PAYLOAD_INVALID/,
    'other signed account cannot decode the first owner key');
  });
 });
});
test('T12 reset and completion upload a redacted terminal, never stale remote draft',async()=>{
 const uid='t12-reset',context='standalone',id='spell-t12-resume-'+context;
 const key='li.spell.t12.resume.v1:'+encodeURIComponent(uid)+':'+context;
 const draft=JSON.stringify({schema:'li.spell.t12.v1',phase:1,
  context:'Đang dở',next:'Viết tiếp',answer:'',updatedAt:'2026-11-21T00:00:00Z'});
 const done=JSON.stringify({schema:'li.spell.t12.v1',phase:2,
  context:'',next:'',answer:'',updatedAt:'2026-11-21T00:02:00Z'});
 device();localStorage.setItem(key,draft);
 await withStore(async first=>{
  const seen=new Map();
  await capturePersonalState(uid,null,first,seen);
  const rowKey=storageKey(uid,'l2_progress',id);
  const old=await first.outbox.get(rowKey);assert(old);
  await first.accept(uid,old,{owner_id:uid,item_type:'l2_progress',item_id:id,
   revision:1,deleted_at:null,changed_at:'2026-11-21T00:01:00Z',payload:old.payload});
  localStorage.setItem(key,done);
  await capturePersonalState(uid,null,first,seen);
  const queued=await first.outbox.get(rowKey);
  assert(queued);
  assert.equal(queued.payload.raw,done);
  assert.equal(JSON.parse(queued.payload.raw).context,'');
  const remote={owner_id:uid,item_type:'l2_progress',item_id:id,
   revision:2,deleted_at:null,changed_at:'2026-11-21T00:02:00Z',payload:queued.payload};
  await first.accept(uid,queued,remote);
  device();
  await withStore(async second=>{
   const snaps=await capturePersonalState(uid,null,second,new Map());
   await second.apply(uid,remote);
   await hydratePersonalState(uid,snaps,second,()=>{});
   assert.equal(localStorage.getItem(key),done);
  });
 });
});
test('T12 invalid remote checkpoint is rejected before writing personal data',async()=>{
 const uid='t12-bad',id='spell-t12-resume-standalone';
 const key='li.spell.t12.resume.v1:'+encodeURIComponent(uid)+':standalone';
 const payload={schema:'li.personal.storage.v1',storageKey:key,
  raw:JSON.stringify({schema:'li.spell.t12.v1',phase:1,
   context:'',next:'Invalid',answer:''})};
 device();
 assert.throws(()=>personalRemoteSnapshot(uid,'l2_progress',id,payload),
  /T12_PRIVATE_CHECKPOINT_INVALID/);
 await withStore(async first=>{
  localStorage.setItem(key,payload.raw);
  await assert.rejects(capturePersonalState(uid,null,first,new Map()),
   /T12_PRIVATE_CHECKPOINT_INVALID/);
 });
});

test('T02 spaced review syncs per owner and lesson; fresh device restores due and review count',async()=>{
 device();
 const uid='owner-t02',field=t02Fields(uid).find(x=>x.id==='spell-t02-L09-1-2');
 assert(field,'L09 lesson must have a stable owner-scoped review_schedule field');
 const data={schema:'li.spell.t02.v2',due:Date.now()+3*86400000,
  reviewCount:2,streak:1,awaitingRating:false,lastReviewedAt:Date.now()-1000,
  lastRating:'retry',updatedAt:new Date().toISOString()};
 const raw=JSON.stringify(data),key=storageKey(uid,field.type,field.id);
 localStorage.setItem(field.key,raw);
 await withStore(async deviceA=>{
  await capturePersonalState(uid,null,deviceA,new Map());
  const op=await deviceA.outbox.get(key);
  assert.equal(op?.payload.raw,raw,'real review history must enter owner outbox');
  assert.equal(op?.accountId,uid);
  // A second signed device downloads the canonical row via its owner RLS API.
  device();
  await withStore(async deviceB=>{
   const snaps=await capturePersonalState(uid,null,deviceB,new Map());
   assert.equal(localStorage.getItem(field.key),null);
   await deviceB.apply(uid,{owner_id:uid,item_type:'review_schedule',item_id:field.id,
    revision:3,changed_at:new Date().toISOString(),deleted_at:null,payload:op.payload});
   const changed=await hydratePersonalState(uid,snaps,deviceB,()=>{});
   assert.equal(changed,true);
   assert.equal(localStorage.getItem(field.key),raw);
   assert.equal(JSON.parse(localStorage.getItem(field.key)).reviewCount,2);
   assert.equal((await deviceB.outbox.get(key)),undefined,'restore is read-only');
   assert.equal(personalRemoteSnapshot(uid,field.type,field.id,op.payload)?.raw,raw);
   assert.throws(()=>personalRemoteSnapshot('another-owner',field.type,field.id,op.payload),
    /PRIVATE_PAYLOAD_INVALID/,'payload from one owner cannot hydrate the other');
  });
 });
});
test('T02 invalid remote review streak is rejected before hydration',()=>{
 const uid='owner-t02-invalid',field=t02Fields(uid)[0];
 const data={schema:'li.spell.t02.v2',due:Date.now()+86400000,
  reviewCount:0,streak:9,awaitingRating:false,lastReviewedAt:null,
  lastRating:null,updatedAt:new Date().toISOString()};
 assert.throws(()=>personalRemoteSnapshot(uid,field.type,field.id,
  {schema:'li.personal.storage.v1',storageKey:field.key,raw:JSON.stringify(data)}),
  /T02_PRIVATE_REVIEW_SCHEDULE_INVALID/);
});
