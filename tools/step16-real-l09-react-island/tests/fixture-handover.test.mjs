import test from 'node:test';
import assert from 'node:assert/strict';
import {captureFixtureSnapshot,rollbackFixtureSnapshot} from '../.sync-test/learning/fixture-handover.js';

const key='step16.l09.shared-native-fixture.v1',real='li.review.L09-1-2.v1';
const loc={hostname:'127.0.0.1',pathname:'/site/index.html',protocol:'http:',search:'?lesson=L09-1-2&li-react=l09-native-fixture'};
const raw=JSON.stringify({locale:'vi',draft:['a','b','c','d'],guidedDraft:'guide',submitted:false,reviewed:false,ratings:[null,null,null,null],future:{preserve:true}});
function memory(){
 const map=new Map([[key,raw],[real,'real-record-do-not-touch']]);
 const storage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>{map.set(k,v)}};
 return {map,storage};
}
test('fixture backup takes exact legacy-shaped bytes and leaves genuine key untouched',()=>{
 const {map,storage}=memory();
 const snapshot=captureFixtureSnapshot(storage,loc);
 assert.equal(snapshot.key,key);assert.equal(snapshot.raw,raw);
 assert.equal(map.get(real),'real-record-do-not-touch');
 assert.ok(Object.isFrozen(snapshot));
});
test('explicit rollback restores unknown fields and never modifies genuine learner record',()=>{
 const {map,storage}=memory();
 const snap=captureFixtureSnapshot(storage,loc);
 const edited=JSON.stringify({...JSON.parse(raw),draft:['edited','b','c','d'],reviewed:true,submitted:true});
 map.set(key,edited);
 assert.equal(rollbackFixtureSnapshot(storage,loc,snap,edited,true),raw);
 assert.equal(map.get(key),raw);
 assert.equal(JSON.parse(map.get(key)).future.preserve,true);
 assert.equal(map.get(real),'real-record-do-not-touch');
});
test('rollback refuses absent confirmation and any stale expected state without writes',()=>{
 const {map,storage}=memory();
 const snap=captureFixtureSnapshot(storage,loc);
 map.set(key,JSON.stringify({...JSON.parse(raw),guidedDraft:'updated'}));
 const before=map.get(key);
 assert.throws(()=>rollbackFixtureSnapshot(storage,loc,snap,before,false),/CONFIRM_REQUIRED/);
 assert.throws(()=>rollbackFixtureSnapshot(storage,loc,snap,raw,true),/STALE_ROLLBACK/);
 assert.equal(map.get(key),before);
});
test('origin/mode guard rejects production, HTTPS, different routes or no fixture flag',()=>{
 const {map,storage}=memory();
 for(const p of [{...loc,hostname:'li5610.pages.dev',protocol:'https:'},{...loc,protocol:'file:'},
   {...loc,pathname:'/site/lessons/L09-1-2.html'},{...loc,search:'?li-react=l09'}]){
  assert.throws(()=>captureFixtureSnapshot(storage,p),/ORIGIN_DENIED/);
 }
 assert.equal(map.get(real),'real-record-do-not-touch');
});
test('corrupted snapshot and unauthorized real key are blocked',()=>{
 const {map,storage}=memory();
 assert.throws(()=>rollbackFixtureSnapshot(storage,loc,{version:1,key:real,raw},raw,true),/BAD_SNAPSHOT/);
 assert.throws(()=>rollbackFixtureSnapshot(storage,loc,{version:1,key,raw:'{"invalid":true}'},raw,true),/INVALID_SHAPE/);
 assert.equal(map.get(key),raw);assert.equal(map.get(real),'real-record-do-not-touch');
});
test('bad local record is not captured or silently replaced with blank attempt',()=>{
 const {map,storage}=memory();
 map.set(key,'{"draft":["bad"],"ratings":[]}');
 assert.throws(()=>captureFixtureSnapshot(storage,loc),/INVALID_SHAPE/);
 assert.equal(map.get(key),'{"draft":["bad"],"ratings":[]}');
});
test('readback failure reports failure and best-effort restores the previous current record',()=>{
 const {map,storage}=memory();
 const snap=captureFixtureSnapshot(storage,loc);
 const newer=JSON.stringify({...JSON.parse(raw),guidedDraft:'changed'});
 map.set(key,newer);
 let reads=0;
 const failing={getItem:k=>{
   if(k!==key)return map.get(k)??null;
   reads++;
   return reads===2?'incorrect-readback':map.get(k)??null;
  },
  setItem:(k,v)=>{map.set(k,v)}};
 assert.throws(()=>rollbackFixtureSnapshot(failing,loc,snap,newer,true),/READBACK_FAILED/);
 assert.equal(map.get(key),newer);
});
