import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {syncOnce} from '../.sync-test/sync-once.js';
import {storageKey,RevisionConflict} from '../.sync-test/contract.js';
import {mergePersonalConflictRaw} from '../.sync-private-test/auth/personal-conflict-merge.js';

const USER='library-merge-learner';
const WHEN='2026-11-22T08:00:00.000Z';
const gate={twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true};
const lib=({cases=[],questions=[],ideas=[],savedContent=[]}={})=>
 JSON.stringify({schema:1,cases,questions,ideas,savedContent,updatedAt:WHEN});
const caseNote=(id,text=id)=>({id,title:text,revision:text,correct:true,savedAt:WHEN});
const idea=(id)=>({id,text:id,savedAt:WHEN});
const bookmark=(id,question='Same question')=>({id,question,scene:'A case',
 type:'problem',savedAt:WHEN});
const saved=(type,id)=>({type,id,savedAt:WHEN});
const pack=(raw)=>({schema:'li.personal.storage.v1',storageKey:'li.private.library.v1',raw});
const row=(revision,raw)=>({owner_id:USER,item_type:'note',item_id:'library',
 revision,payload:pack(raw),deleted_at:null,changed_at:WHEN});

test('legacy two-device notes, ideas and bookmarks merge without losing either copy',()=>{
 const remote=lib({cases:[caseNote('old')],ideas:[idea('remote')],
  questions:[bookmark('remote-bookmark')],savedContent:[saved('lesson','L09-1-2')]});
 const local=lib({cases:[caseNote('new')],ideas:[idea('local')],
  questions:[bookmark('local-bookmark')],savedContent:[saved('case','sampling-bias-90')]});
 const merged=mergePersonalConflictRaw('library',null,local,remote);
 assert(merged);
 const result=JSON.parse(merged);
 assert.deepEqual(result.cases.map(x=>x.id).sort(),['new','old']);
 assert.deepEqual(result.ideas.map(x=>x.id).sort(),['local','remote']);
 assert.equal(result.questions.length,1,'same question bookmarked on both devices is one bookmark');
 assert.deepEqual(result.savedContent.map(x=>x.type).sort(),['case','lesson']);
 assert.deepEqual(JSON.parse(local).cases,[caseNote('new')],
  'the original local library was never mutated');
});

test('known baseline merges new edits and honors deletion without resurrecting old notes',()=>{
 const base=lib({cases:[caseNote('old'),caseNote('remove-me')]});
 const local=lib({cases:[caseNote('old'),caseNote('mine')]});
 const remote=lib({cases:[caseNote('old'),caseNote('remove-me'),caseNote('theirs')]});
 const merged=mergePersonalConflictRaw('library',base,local,remote);
 assert(merged);
 assert.deepEqual(JSON.parse(merged).cases.map(x=>x.id).sort(),['mine','old','theirs']);
});

test('same-note divergent changes and corrupt/unknown collections stay blocked',()=>{
 const base=lib({cases:[caseNote('shared','v1')]});
 const left=lib({cases:[caseNote('shared','v2')]});
 const right=lib({cases:[caseNote('shared','v3')]});
 assert.equal(mergePersonalConflictRaw('library',base,left,right),null);
 assert.equal(mergePersonalConflictRaw('library',null,left,right),null);
 assert.equal(mergePersonalConflictRaw('library',null,
  lib({cases:[caseNote('a'),caseNote('a')]}),right),null);
 assert.equal(mergePersonalConflictRaw('journal',null,left,right),null);
 assert.equal(mergePersonalConflictRaw('library',null,
  JSON.stringify({...JSON.parse(left),unknownFutureField:true}),right),null);
});

test('visit history converges on the newest visit without duplicate routes',()=>{
 const local=JSON.stringify({schema:1,items:[
  {route:'lessonL09',visitedAt:'2026-11-22T09:00:00Z'}]});
 const remote=JSON.stringify({schema:1,items:[
  {route:'lessonL09',visitedAt:'2026-11-22T08:00:00Z'},
  {route:'lessonL03',visitedAt:'2026-11-22T07:00:00Z'}]});
 const merged=mergePersonalConflictRaw('lesson-visits',null,local,remote);
 assert(merged);
 const routes=JSON.parse(merged).items;
 assert.deepEqual(routes.map(x=>x.route),['lessonL09','lessonL03']);
 assert.equal(routes[0].visitedAt,'2026-11-22T09:00:00Z');
});

test('existing conflict gets one durable rebase and CAS retry, without blind overwrite',async()=>{
 const store=new PrivateDeviceStore('li-merge-'+crypto.randomUUID());
 const local=lib({cases:[caseNote('iphone-new')]});
 const previousRemote=lib({cases:[caseNote('mac-old')]});
 const cloud=new Map([['note:library',row(19,previousRemote)]]);
 const api={
  accountId:USER,
  async write(op){
   const key=op.itemType+':'+op.itemId,prior=cloud.get(key);
   if((prior?.revision??0)!==op.baseRevision)throw new RevisionConflict();
   const next={...prior,revision:op.baseRevision+1,payload:op.payload};
   cloud.set(key,next);return next;
  },
  async all(){return [...cloud.values()];}
 };
 try{
  await store.edit(USER,'note','library',pack(local));
  const first=await syncOnce(store,api,USER,gate);
  assert.equal(first.mode,'conflict');
  assert.equal((await store.counts(USER)).conflicts,1);
  const key=storageKey(USER,'note','library'),op=await store.outbox.get(key);
  const merged=mergePersonalConflictRaw('library',null,local,previousRemote);
  assert(merged);
  await store.rebaseConflict(USER,op,cloud.get('note:library'),pack(merged));
  assert.deepEqual(await store.counts(USER),{pending:1,conflicts:0});
  assert.equal((await store.outbox.get(key)).baseRevision,19);
  assert.deepEqual((await store.outbox.get(key)).basePayload,pack(previousRemote));
  const retry=await syncOnce(store,api,USER,gate);
  assert.equal(retry.mode,'synced');
  assert.equal(retry.uploaded,1);
  assert.equal(cloud.get('note:library').revision,20);
  assert.deepEqual(JSON.parse(cloud.get('note:library').payload.raw).cases.map(x=>x.id),
   ['iphone-new','mac-old']);
  assert.equal((await store.counts(USER)).pending,0);
 }finally{store.close();await store.delete();}
});

test('rebase refuses cross-owner rows and leaves the original conflict unchanged',async()=>{
 const store=new PrivateDeviceStore('li-merge-owner-'+crypto.randomUUID());
 try{
  await store.edit(USER,'note','library',pack(lib({cases:[caseNote('mine')]})));
  const key=storageKey(USER,'note','library');
  const original=await store.outbox.get(key);
  await store.reject(USER,original);
  await assert.rejects(store.rebaseConflict(USER,{...original,conflict:true},
   {...row(2,lib()),owner_id:'different-account'},pack(lib())),
  /CONFLICT_OWNER_OR_ITEM_MISMATCH/);
  assert.equal((await store.counts(USER)).conflicts,1);
 }finally{store.close();await store.delete();}
});

test('integrated app retries safe conflicts through signed outbox, not an insecure extra writer',()=>{
 const source=readFileSync(new URL('../src/auth/learner-sync.ts',import.meta.url),'utf8');
 assert.match(source,/reconcileAdditivePersonalConflicts\(uid,api,observed\)/);
 assert.match(source,/store\.rebaseConflict\(uid,op,remote,payload\)/);
 assert.match(source,/personalRemoteSnapshot\(uid,field\.type,field\.id,op\.payload\)/);
 assert.match(source,/window\.dispatchEvent\(new CustomEvent\('li:personal-sync-applied'/);
});
