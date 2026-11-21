import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {syncOnce} from '../.sync-test/sync-once.js';
import {RevisionConflict,storageKey} from '../.sync-test/contract.js';
import {capturePersonalState,hydratePersonalState} from '../.sync-private-test/auth/private-state.js';

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

test('complete Wave1 offline learning plus T12 checkpoint replays to second browser and clears on finish',async()=>{
 const user='wave1-reconnect-account';
 const ids=['L03-1-2','L09-1-2','L15-2-2'];
 const methodIds=[['T04','T09'],['T03','T06'],['T07','T10']];
 const now='2026-11-21T01:00:00.000Z';
 const gate={twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true};
 const pwa=new PrivateDeviceStore('li-wave1-pwa-'+crypto.randomUUID());
 const safari=new PrivateDeviceStore('li-wave1-safari-'+crypto.randomUUID());
 const snapshots=new Map();
 const mockStore=()=>({
  getItem:k=>snapshots.has(k)?snapshots.get(k):null,
  setItem:(k,v)=>snapshots.set(k,String(v)),
  removeItem:k=>snapshots.delete(k)
 });
 const localA=mockStore(),localBData=new Map();
 const localB={
  getItem:k=>localBData.has(k)?localBData.get(k):null,
  setItem:(k,v)=>localBData.set(k,String(v)),
  removeItem:k=>localBData.delete(k)
 };
 const t12Key='li.spell.t12.resume.v1:'+encodeURIComponent(user)+':L09-1-2';
 const t12Draft=JSON.stringify({schema:'li.spell.t12.v1',phase:1,
  context:'Bài học đang làm dở',next:'Viết câu kết luận',answer:'Làm dở',
  updatedAt:now});
 const t12Finished=JSON.stringify({schema:'li.spell.t12.v1',phase:2,
  context:'',next:'',answer:'',updatedAt:'2026-11-21T01:10:00.000Z'});
 const rows=new Map();
 const remote={
  accountId:user,
  async write(entry){
   const key=entry.itemType+':'+entry.itemId,previous=rows.get(key);
   if((previous?.revision??0)!==entry.baseRevision)throw new RevisionConflict();
   const row={owner_id:user,item_type:entry.itemType,item_id:entry.itemId,
    revision:entry.baseRevision+1,payload:entry.payload,deleted_at:entry.deletedAt,
    changed_at:now};
   rows.set(key,row);return row;
  },
  async all(){return [...rows.values()];}
 };
 const offline={
  accountId:user,async write(){throw Error('NETWORK_OFFLINE');},
  async all(){throw Error('NETWORK_OFFLINE');}
 };
 try{
  // PWA saves legitimate 3 lesson attempts and all 6 method types offline.
  globalThis.localStorage=localA;globalThis.window={dispatchEvent(){}};
  for(let i=0;i<ids.length;i++){
   const methods=Object.fromEntries(methodIds[i].map(id=>[id,{
    draft:'Bản giải thích cho '+id,submission:'Đã hoàn thành phần thực hành '+id,
    submittedAt:now,...(id==='T06'?{classifications:{
     A:'nominal',B:'ordinal',C:'discrete',D:'continuous'}}:{})
   }]));
   await pwa.edit(user,'lesson_attempt',ids[i],{
    schema:'li.native.lesson.v1',
    data:{locale:'vi',draft:['Bài đang làm','','',''],
     ratings:[null,null,null,null],methodAttempts:methods}
   });
  }
  localA.setItem(t12Key,t12Draft);
  const seenPwa=new Map();
  await capturePersonalState(user,null,pwa,seenPwa);
  assert.equal((await pwa.counts(user)).pending,4);
  assert.equal((await syncOnce(pwa,offline,user,gate)).mode,'offline');
  assert.equal((await pwa.counts(user)).pending,4);
  assert.equal(rows.size,0,'offline never sends anything to Neon');
  const uploaded=await syncOnce(pwa,remote,user,gate);
  assert.equal(uploaded.mode,'synced');
  assert.equal(uploaded.uploaded,4);
  assert.equal((await pwa.counts(user)).pending,0);

  // Safari/PWA have separate browser localStorage AND IndexedDB.
  globalThis.localStorage=localB;
  const seenSafari=new Map();
  const emptySnapshots=await capturePersonalState(user,null,safari,seenSafari);
  assert.equal((await safari.counts(user)).pending,0);
  const pulled=await syncOnce(safari,remote,user,gate);
  assert.equal(pulled.mode,'synced');
  assert.equal(pulled.downloaded,4);
  for(let i=0;i<ids.length;i++){
   const received=await safari.records.get(storageKey(user,'lesson_attempt',ids[i]));
   assert(received?.baseRevision===1);
   assert.deepEqual(Object.keys(received.payload.data.methodAttempts).sort(),
    methodIds[i].slice().sort());
  }
  assert.equal(await hydratePersonalState(user,emptySnapshots,safari,()=>{}),true);
  assert.equal(localB.getItem(t12Key),t12Draft);
  assert.equal((await safari.counts(user)).pending,0,
   'download must not enqueue a second-device overwrite');

  // T12 finish/reset on PWA must propagate a redacted terminal checkpoint.
  globalThis.localStorage=localA;
  localA.setItem(t12Key,t12Finished);
  await capturePersonalState(user,null,pwa,seenPwa);
  assert.equal((await pwa.counts(user)).pending,1);
  assert.equal((await syncOnce(pwa,remote,user,gate)).mode,'synced');
  globalThis.localStorage=localB;
  const safariBeforeFinish=await capturePersonalState(user,null,safari,seenSafari);
  assert.equal((await syncOnce(safari,remote,user,gate)).downloaded,1);
  assert.equal(await hydratePersonalState(user,safariBeforeFinish,safari,()=>{}),true);
  assert.equal(localB.getItem(t12Key),t12Finished);
  assert.equal(JSON.parse(localB.getItem(t12Key)).context,'');
  assert.equal((await safari.counts(user)).pending,0);
 }finally{
  pwa.close();safari.close();await pwa.delete();await safari.delete();
 }
});


test('saved Case note survives PWA offline → signed sync → Safari React Bút Ký → edit → PWA',async()=>{
 const user='case-cross-device-'+crypto.randomUUID();
 const pwa=new PrivateDeviceStore('li-case-pwa-'+crypto.randomUUID());
 const safari=new PrivateDeviceStore('li-case-safari-'+crypto.randomUUID());
 const oldLocal=globalThis.localStorage,oldWindow=globalThis.window;
 const memory=()=>{const values=new Map();return{
  getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(key,String(value)),
  removeItem:key=>values.delete(key)
 };};
 const localA=memory(),localB=memory(),rows=new Map();
 const key='li.private.library.v1',when='2026-11-21T02:00:00.000Z';
 const snapshot={
  id:'sampling-bias-90',question:'Visible React Case: Who did we survey?',
  scene:'Only active subscribers answered this survey',
  options:[{key:'right',text:'Only the surveyed subscribers'},
   {key:'wrong',text:'Every potential subscriber'}],
  selectedKey:'right',selectedText:'Only the surveyed subscribers',
  feedback:'Correct: do not extrapolate beyond the sample'
 };
 const note={
  id:'case-device-roundtrip',caseKey:'sampling-bias-90',
  title:'Sample representation — saved from PWA',
  revision:'This result only describes the sampled active subscribers.',
  correct:true,savedAt:when,caseSnapshot:snapshot,
  versions:[{version:1,title:'Sample representation — saved from PWA',
   body:'This result only describes the sampled active subscribers.',at:when,change:'Bản gốc'}]
 };
 const library={schema:1,cases:[note],questions:[],ideas:[],savedContent:[]};
 const api={
  accountId:user,
  async write(entry){
   const route=entry.itemType+':'+entry.itemId,previous=rows.get(route);
   if((previous?.revision??0)!==entry.baseRevision)throw new RevisionConflict();
   const next={owner_id:user,item_type:entry.itemType,item_id:entry.itemId,
    revision:entry.baseRevision+1,payload:entry.payload,
    deleted_at:entry.deletedAt,changed_at:when};
   rows.set(route,next);return next;
  },
  async all(){return [...rows.values()];}
 };
 const offline={
  accountId:user,async write(){throw Error('NETWORK_OFFLINE');},
  async all(){throw Error('NETWORK_OFFLINE');}
 };
 const seenA=new Map(),seenB=new Map();
 try{
  // A = PWA: the ONLY saved Case is local and offline, with full original context.
  globalThis.localStorage=localA;
  globalThis.window={dispatchEvent(){}};
  localA.setItem(key,JSON.stringify(library));
  await capturePersonalState(user,null,pwa,seenA);
  assert.equal((await pwa.counts(user)).pending,1);
  assert.equal((await syncOnce(pwa,offline,user,gate)).mode,'offline');
  assert.equal(rows.size,0,'Offline cannot upload learner notes');
  const upload=await syncOnce(pwa,api,user,gate);
  assert.equal(upload.mode,'synced');
  assert.equal(upload.uploaded,1);
  assert.equal((await pwa.counts(user)).pending,0);
  assert.equal(rows.get('note:library')?.payload.raw,JSON.stringify(library),
   'The signed remote snapshot contains the complete Case and feedback');

  // B = Safari: distinct localStorage AND IndexedDB; no shared in-memory record.
  globalThis.localStorage=localB;
  const empty=await capturePersonalState(user,null,safari,seenB);
  assert.equal(localB.getItem(key),null);
  assert.equal((await safari.counts(user)).pending,0);
  const download=await syncOnce(safari,api,user,gate);
  assert.equal(download.mode,'synced');
  assert.equal(download.downloaded,1);
  const hydratedKeys=[];
  assert.equal(await hydratePersonalState(user,empty,safari,()=>{},
   changedKey=>hydratedKeys.push(changedKey)),true);
  assert.deepEqual(hydratedKeys,[key]);
  assert.equal((await safari.counts(user)).pending,0,
   'Cloud hydration must not re-upload stale Safari data');
  const restored=JSON.parse(localB.getItem(key));
  assert.deepEqual(restored.cases[0].caseSnapshot,snapshot);
  assert.deepEqual(restored.cases[0].versions,note.versions);

  // Open the REAL React-facing Bút Ký port: no native Case/Note DOM source.
  const caseElements=new Map();
  const element=id=>{
   if(!caseElements.has(id))caseElements.set(id,{hidden:true,dataset:{},
    addEventListener(){},setAttribute(){},focus(){},replaceChildren(){},
    textContent:'',value:''});
   return caseElements.get(id);
  };
  const caseEvents=[];
  const sandbox={
   document:{getElementById:element,querySelector:selector=>{
    if(selector.includes('#page-case'))throw Error('Hidden native Case accessed');
    return null;
   }},
   window:{liReactLibraryMounted:true,dispatchEvent:event=>caseEvents.push(event.type),
    liLanguage:{translate:v=>v,get:()=> 'vi'},
    liTaxonomyFieldIds:['data-science'],
    liBookmarks:{isSaved:()=>false},liLibraryShelf:{renderHome(){},renderCollection(){}}},
   processedCases:restored.cases,collectedIdeas:restored.ideas,
   liStorageError:false,
   liWriteState:()=>{
    localB.setItem(key,JSON.stringify(restored));
    return localB.getItem(key)===JSON.stringify(restored);
   },
   navigate(){},toast(){},Date,Intl,
   Event:class{constructor(type){this.type=type;}}
  };
  runInNewContext(readFileSync(new URL('../../../site/assets/library-note-editor.js',
   import.meta.url),'utf8'),sandbox);
  assert.equal(sandbox.window.liNotes.openDetail('case',note.id),true);
  const shown=sandbox.window.liNotes.getView();
  assert.equal(shown.body,note.revision);
  assert.equal(shown.fieldId,'data-science','Case note inherits source field after PWA/Safari sync');
  assert.equal(shown.context.question,snapshot.question);
  assert.equal(shown.context.scene,snapshot.scene);
  assert.equal(shown.context.options.length,2);
  assert.equal(shown.context.options[0].selected,true);
  assert.match(shown.context.choice,/Only the surveyed subscribers/);
  assert.equal(shown.context.feedback,snapshot.feedback);
  assert.equal(shown.history.length,1);
  assert(caseEvents.includes('li:note-view-changed'),
   'React note view gets refreshed without legacy DOM');

  // Edit in Safari with the REAL canonical version writer and send back to PWA.
  const edited='The sample excludes former users and cannot represent everyone.';
  const save=sandbox.window.liNotes.saveFromReact(note.title,edited,1);
  assert.equal(save.ok,true);
  assert.equal(save.changed,true);
  assert.equal(sandbox.window.liNotes.getView().history.length,2);
  assert.equal(sandbox.window.liNotes.getView().context.feedback,snapshot.feedback,
   'Editing a conclusion must never rewrite the original feedback');
  await capturePersonalState(user,null,safari,seenB);
  assert.equal((await safari.counts(user)).pending,1);
  const pushBack=await syncOnce(safari,api,user,gate);
  assert.equal(pushBack.mode,'synced');
  assert.equal(pushBack.uploaded,1);
  assert.equal(rows.get('note:library').revision,2);

  globalThis.localStorage=localA;
  const previous=await capturePersonalState(user,null,pwa,seenA);
  const back=await syncOnce(pwa,api,user,gate);
  assert.equal(back.mode,'synced');
  assert.equal(back.downloaded,1);
  assert.equal(await hydratePersonalState(user,previous,pwa,()=>{}),true);
  const final=JSON.parse(localA.getItem(key)).cases[0];
  assert.equal(final.revision,edited);
  assert.equal(final.versions.length,2);
  assert.deepEqual(final.caseSnapshot,snapshot);
  assert.equal((await pwa.counts(user)).pending,0);
  await assert.rejects(syncOnce(pwa,api,'other-account',gate),/ACCOUNT_BINDING_REQUIRED/);
 }finally{
  if(oldLocal===undefined)delete globalThis.localStorage;
  else globalThis.localStorage=oldLocal;
  if(oldWindow===undefined)delete globalThis.window;
  else globalThis.window=oldWindow;
  pwa.close();safari.close();
  await pwa.delete();await safari.delete();
 }
});
