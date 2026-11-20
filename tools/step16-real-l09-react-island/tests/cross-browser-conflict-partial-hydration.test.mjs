import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {syncOnce} from '../.sync-test/sync-once.js';
import {RevisionConflict} from '../.sync-test/contract.js';

const uid='invited-same-google-account';
const gate={twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true};
const remote=(type,id,revision,payload)=>({
 owner_id:uid,item_type:type,item_id:id,revision,payload,
 changed_at:'2026-11-21T00:00:00.000Z',deleted_at:null,last_op_id:'from-other-session'
});
const lesson={schema:'li.native.lesson.v1',
 data:{locale:'vi',draft:['answer from PWA','','',''],ratings:[null,null,null,null]}};

test('Safari can receive PWA lesson even when an unrelated preference is conflicted',async()=>{
 const db=new PrivateDeviceStore('li-qa-cross-browser-partial-hydration');
 const conflictedPref={schema:'li.personal.storage.v1',
  storageKey:'li.app.locale.v1',raw:'\"en\"'};
 const server=[
  remote('lesson_attempt','L09-1-2',2,lesson),
  remote('preference','locale',3,{schema:'li.personal.storage.v1',
   storageKey:'li.app.locale.v1',raw:'\"vi\"'})
 ];
 try{
  await db.edit(uid,'preference','locale',conflictedPref);
  const api={accountId:uid,async write(){throw new RevisionConflict();},async all(){return server;}};
  const outcome=await syncOnce(db,api,uid,gate);
  assert.equal(outcome.mode,'conflict');
  assert.equal(outcome.downloaded,1); // Separate lesson is still safely downloaded.
  const localLesson=await db.records.get(JSON.stringify([uid,'lesson_attempt','L09-1-2']));
  assert.deepEqual(localLesson?.payload,lesson);
  assert.equal(localLesson.baseRevision,2);
  const localPref=await db.records.get(JSON.stringify([uid,'preference','locale']));
  assert.deepEqual(localPref?.payload,conflictedPref); // Never silent last-write-wins.
  const prefOp=await db.outbox.get(JSON.stringify([uid,'preference','locale']));
  assert.equal(prefOp?.conflict,true);
  assert.equal(await db.outbox.get(JSON.stringify([uid,'lesson_attempt','L09-1-2'])),undefined);
 }finally{db.close();await db.delete();}
});

test('React learner sync hydrates safe rows even if another item reports conflict',()=>{
 const source=readFileSync(new URL('../src/auth/learner-sync.ts',import.meta.url),'utf8');
 const mark="if(result.mode==='conflict')report('conflict');";
 const index=source.indexOf(mark);
 const hydrate=source.indexOf('const changed=await hydrate(uid,snapshots',index);
 assert.ok(index>0&&hydrate>index,'conflict must not return before safe-row hydration');
 assert.doesNotMatch(source.slice(index,hydrate),/if\(result\.mode==='conflict'\)\s*\{?[^\n]*return/);
 assert.match(source,/if\(await store\.outbox\.get\(key\)\)continue; \/\/ queued edits and conflicts win locally/);
 assert.match(source,/if\(!disposed&&changed\)window\.dispatchEvent\(new CustomEvent\('li:lesson-sync-applied'/);
});
