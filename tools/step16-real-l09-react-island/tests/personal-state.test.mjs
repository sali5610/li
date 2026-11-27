import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateDeviceStore} from '../.sync-private-test/sync/local-dexie.js';
import {storageKey} from '../.sync-private-test/sync/contract.js';
import {PERSONAL_FIELDS,capturePersonalState,hydratePersonalState,
 preparePersonalAccount,journalCloudConsent,personalRemoteSnapshot,t02Fields,practiceField,snapshotLearnerDevice,t12Fields,restoreLocalOnlyBackup,restoreMissingSyncedBackup,queueLessonDeletion} from '../.sync-private-test/auth/private-state.js';

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

test('spell receipts reuse signed owner RLS outbox; second device restores without copying answers',async()=>{
 const uid='spell-owner-1',field=practiceField(uid);
 const key=storageKey(uid,field.type,field.id);
 const receipt={schema:'li.spell.practice.v1',scopes:{
  standalone:{T04:{count:2,lastAt:Date.now(),phase:0,places:[]}},
  'L09-1-2':{T13:{count:1,lastAt:Date.now()-1000,phase:1,places:['cửa','bàn','bếp']}}
 }};
 const raw=JSON.stringify(receipt);
 device();localStorage.setItem(field.key,raw);
 await withStore(async first=>{
  const snapshots=await capturePersonalState(uid,null,first,new Map());
  assert(snapshots.some(x=>x.field.id===field.id));
  const op=await first.outbox.get(key);
  assert(op,'offline receipt must enter the existing signed Dexie outbox');
  assert.equal(op.payload.raw,raw);
  assert.equal(op.itemType,field.type);
  assert.equal(raw.includes('Đáp án của tôi'),false,'answers are not part of the receipt');
  const signed={owner_id:uid,item_type:field.type,item_id:field.id,
   revision:3,changed_at:new Date().toISOString(),deleted_at:null,payload:op.payload};
  device();
  await withStore(async fresh=>{
   const before=await capturePersonalState(uid,null,fresh,new Map());
   assert.equal((await fresh.counts(uid)).pending,0,'fresh device must not queue an overwrite');
   await fresh.apply(uid,signed);
   assert.equal(await hydratePersonalState(uid,before,fresh,()=>{}),true);
   assert.equal(localStorage.getItem(field.key),raw);
   assert.equal((await fresh.counts(uid)).pending,0);
   assert.equal(personalRemoteSnapshot(uid,field.type,field.id,op.payload)?.raw,raw);
   assert.throws(()=>personalRemoteSnapshot('other-owner',field.type,field.id,op.payload),
    /PRIVATE_PAYLOAD_INVALID/,'another user cannot read the first owner scope');
  });
 });
});

test('spell cloud contract rejects unsafe contexts, arbitrary answers and malformed receipts',async()=>{
 device();const uid='spell-bad',field=practiceField(uid);
 const correct={schema:'li.spell.practice.v1',scopes:{
  standalone:{T04:{count:1,lastAt:Date.now(),phase:0,places:[]}}
 }};
 const errors=[
  {...correct,scopes:{'L99-1-1':correct.scopes.standalone}},
  {...correct,scopes:{standalone:{T04:{...correct.scopes.standalone.T04,answer:'secret'}}}},
  {...correct,scopes:{standalone:{T04:{...correct.scopes.standalone.T04,count:-5}}}},
  {...correct,scopes:{standalone:{T02:correct.scopes.standalone.T04}}},
  {...correct,scopes:{standalone:{T13:{count:0,lastAt:null,phase:1,places:['same','same','same']}}}}
 ];
 for(const entry of errors){
  const raw=JSON.stringify(entry);
  const payload={schema:'li.personal.storage.v1',storageKey:field.key,raw};
  assert.throws(()=>personalRemoteSnapshot(uid,field.type,field.id,payload),
   /SPELL_PRACTICE_/);
 }
 const invalid=JSON.stringify(errors[1]);
 localStorage.setItem(field.key,invalid);
 await withStore(async store=>{
  await assert.rejects(capturePersonalState(uid,null,store,new Map()),/SPELL_PRACTICE_/);
  assert.equal(await store.outbox.get(storageKey(uid,field.type,field.id)),undefined,
   'invalid browser state never reaches the signed outbox');
 });
});


test('device backup reads registered current owner state without mutating it or granting journal consent',()=>{
 const map=device(),uid='owner-A',other='owner-B';
 map.set('li.sync.local-owner.v1',uid);
 const entries=[
  ['li.private.library.v1','{"cases":[]}'],['li.review.L09-1-2.v1','{"draft":"not synced"}'],
  ['li.personal.daily.v1','{"schema":1,"days":{}}'],['li.personal.daily.enabled.v1','true'],
  ['li.reminders.in-app.v1','{"schedules":[]}'],['li.private.capture-draft.v1:owner-A','{"text":"unsaved","fieldId":null}'],
  [t02Fields(uid)[0].key,'schedule'],[t12Fields(uid)[0].key,'resume'],[practiceField(uid).key,'practice']
 ];
 for(const [key,raw] of entries)map.set(key,raw);
 map.set('li.sync.journal-cloud-consent.v1:'+uid,'false');
 map.set('li.sync.local-backup.v1:'+other+':li.private.library.v1','other note');
 map.set('li.private.capture-draft.v1:owner-B','other draft');
 map.set(t02Fields(other)[0].key,'other schedule');
 map.set('li.review.unknown.v1','unregistered');
 map.set('neon.auth.token','credential');
 const before=[...map];
 assert.deepEqual(new Map(snapshotLearnerDevice(uid,['L09-1-2'],()=>true).map(r=>[r.key,r.raw])),new Map(entries));
 assert.deepEqual([...map],before);
 assert.equal(journalCloudConsent(uid),false);
 assert.throws(()=>snapshotLearnerDevice(other,['L09-1-2'],()=>true),/BACKUP_OWNER_REQUIRED/);
 assert.throws(()=>snapshotLearnerDevice(uid,[],()=>false),/BACKUP_OWNER_REQUIRED/);
 let calls=0;
 assert.throws(()=>snapshotLearnerDevice(uid,[],()=>++calls===1),/BACKUP_OWNER_CHANGED/);
});


function recoveryFile(uid,deviceRecords){return JSON.stringify({schema:'li.learner.device-backup.v2',accountId:uid,deviceRecords,materialized:{schema:'li.private.backup.v1',accountId:uid,items:[]}});}
test('local recovery fills only missing journal/capture, never grants consent or queues cloud data',async()=>{
 const map=device(),uid='owner-A',journal='li.personal.daily.v1',draft='li.private.capture-draft.v1:owner-A';
 map.set('li.sync.local-owner.v1',uid);
 const file=recoveryFile(uid,[{key:journal,raw:'{"schema":1,"days":{}}'},{key:draft,raw:'{"text":"draft","fieldId":null}'},{key:'li.review.L09-1-2.v1',raw:'{}'}]);
 await withStore(async store=>{
  assert.deepEqual(await restoreLocalOnlyBackup(uid,['L09-1-2'],file,store,()=>true),{restored:2,skipped:0,deferred:1});
  assert.equal(map.get(draft),'{"text":"draft","fieldId":null}');
  assert.equal(journalCloudConsent(uid),false);
  assert.equal((await store.accountRecords(uid)).length,0);
  map.set(draft,'newer');
  assert.deepEqual(await restoreLocalOnlyBackup(uid,['L09-1-2'],file,store,()=>true),{restored:0,skipped:2,deferred:1});
  assert.equal(map.get(draft),'newer');
  await assert.rejects(restoreLocalOnlyBackup('owner-B',[],file,store,()=>true),/RESTORE_OWNER_REQUIRED/);
 });
});
test('local recovery rejects unregistered, duplicate and malformed data before writing; preserves consent and known tombstone',async()=>{
 const map=device(),uid='owner-A',journal='li.personal.daily.v1',draft='li.private.capture-draft.v1:owner-A';
 map.set('li.sync.local-owner.v1',uid);
 const good={key:draft,raw:'{"text":"draft","fieldId":null}'};
 await withStore(async store=>{
  for(const bad of [{key:'neon.auth.token',raw:'secret'},good,{key:journal,raw:'{"schema":1,"days":[]}' }]){
   await assert.rejects(restoreLocalOnlyBackup(uid,[],recoveryFile(uid,[good,bad]),store,()=>true));
   assert.equal(map.has(draft),false);
  }
  const journalFile=recoveryFile(uid,[{key:journal,raw:'{"schema":1,"days":{}}'}]);
  map.set('li.sync.journal-cloud-consent.v1:'+uid,'true');
  assert.equal((await restoreLocalOnlyBackup(uid,[],journalFile,store,()=>true)).skipped,1);
  map.set('li.sync.journal-cloud-consent.v1:'+uid,'false');
  await store.edit(uid,'note','daily-journal',{},'2026-11-27T00:00:00Z');
  assert.equal((await restoreLocalOnlyBackup(uid,[],journalFile,store,()=>true)).skipped,1);
  assert.equal(map.has(journal),false);
 });
});
test('local recovery compensates earlier additions on storage write failure',async()=>{
 const map=device(),uid='owner-A',journal='li.personal.daily.v1',draft='li.private.capture-draft.v1:owner-A';
 map.set('li.sync.local-owner.v1',uid);
 const set=localStorage.setItem;localStorage.setItem=(key,raw)=>{if(key===draft)throw Error('QUOTA');set(key,raw);};
 await withStore(async store=>{
  await assert.rejects(restoreLocalOnlyBackup(uid,[],recoveryFile(uid,[{key:journal,raw:'{"schema":1,"days":{}}'},{key:draft,raw:'{"text":"draft","fieldId":null}'}]),store,()=>true),/QUOTA/);
  assert.equal(map.has(journal),false);assert.equal(map.has(draft),false);
  assert.equal((await store.accountRecords(uid)).length,0);
 });
});


test('signed recovery queues only missing registered records at revision zero; protects server and local tombstones',async()=>{
 const map=device(),uid='owner-A',other='owner-B';map.set('li.sync.local-owner.v1',uid);
 const attempt=JSON.stringify({draft:['new answer','','',''],ratings:[null,null,null,null]});
 const files=['L03-1-2','L09-1-2','L15-2-2'];
 const rows=files.map(id=>({key:'li.review.'+id+'.v1',raw:attempt}));
 const file=recoveryFile(uid,rows);
 const api={accountId:uid,all:async()=>[{owner_id:uid,item_type:'lesson_attempt',item_id:files[0],revision:3,deleted_at:'2026-11-27T00:00:00Z'}]};
 await withStore(async store=>{
  await store.edit(uid,'lesson_attempt',files[1],{},'2026-11-27T00:00:00Z');
  assert.deepEqual(await restoreMissingSyncedBackup(uid,files,file,store,api,()=>true),{queued:1,skipped:2,unresolved:0});
  const item=await store.outbox.get(storageKey(uid,'lesson_attempt',files[2]));
  assert.equal(item.baseRevision,0);assert.equal(item.payload.data.draft[0],'new answer');
  assert.equal(map.has(rows[2].key),false,'do not hydrate until signed sync');
  assert.equal((await store.accountRecords(other)).length,0);
  assert.deepEqual(await restoreMissingSyncedBackup(uid,files,file,store,api,()=>true),{queued:0,skipped:3,unresolved:0});
 });
});
test('signed recovery denies mismatched owner and malformed learning payload before creating writes',async()=>{
 const map=device(),uid='owner-A';map.set('li.sync.local-owner.v1',uid);
 const file=recoveryFile(uid,[{key:'li.review.L09-1-2.v1',raw:'{}'}]);
 await withStore(async store=>{
  const api={accountId:uid,all:async()=>[]};
  await assert.rejects(restoreMissingSyncedBackup(uid,['L09-1-2'],file,store,api,()=>true),/INVALID_LOCAL_ATTEMPT/);
  await assert.rejects(restoreMissingSyncedBackup(uid,['L09-1-2'],file,store,{...api,accountId:'other'},()=>true),/RESTORE_OWNER_REQUIRED/);
  assert.equal((await store.accountRecords(uid)).length,0);
 });
});


test('lesson deletion queues only selected owner scope with a sanitized tombstone and clears known local copies',async()=>{
 const map=device(),uid='owner-A',id='L09-1-2',other='L03-1-2';map.set('li.sync.local-owner.v1',uid);
 const local='li.review.'+id+'.v1',backup='li.sync.local-backup.v1:'+uid+':'+id;
 map.set(local,'saved answer');map.set(backup,'old answer');map.set('li.review.'+other+'.v1','keep');
 const api={accountId:uid,one:async()=>null};
 await withStore(async store=>{
  assert.equal(await queueLessonDeletion(uid,id,[id,other],store,api,()=>true),'queued');
  const op=await store.outbox.get(storageKey(uid,'lesson_attempt',id));
  assert.equal(op.baseRevision,0);assert.ok(op.deletedAt);assert.equal(op.payload.data.draft.join(''),'');
  assert.equal(map.has(local),false);assert.equal(map.has(backup),false);assert.equal(map.get('li.review.'+other+'.v1'),'keep');
  await assert.rejects(queueLessonDeletion(uid,id,[id],store,api,()=>true),/DELETE_SYNC_FIRST/);
  await assert.rejects(queueLessonDeletion(uid,other,[id],store,api,()=>true),/DELETE_OWNER_OR_LESSON_REQUIRED/);
  await assert.rejects(queueLessonDeletion('owner-B',id,[id],store,api,()=>true),/DELETE_OWNER_OR_LESSON_REQUIRED/);
 });
});
test('lesson deletion refuses wrong remote owner or a changed local revision before removing work',async()=>{
 const map=device(),uid='owner-A',id='L09-1-2',local='li.review.'+id+'.v1';map.set('li.sync.local-owner.v1',uid);map.set(local,'keep');
 await withStore(async store=>{
  const wrong={accountId:uid,one:async()=>({owner_id:'owner-B',item_type:'lesson_attempt',item_id:id,revision:1})};
  await assert.rejects(queueLessonDeletion(uid,id,[id],store,wrong,()=>true),/DELETE_REMOTE_SCOPE/);
  const changed={accountId:uid,one:async()=>{map.set(local,'newer');return null;}};
  await assert.rejects(queueLessonDeletion(uid,id,[id],store,changed,()=>true),/DELETE_LOCAL_CHANGED/);
  assert.equal(map.get(local),'newer');assert.equal((await store.accountRecords(uid)).length,0);
 });
});
