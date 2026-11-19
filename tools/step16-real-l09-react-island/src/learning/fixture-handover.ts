/**
 * Step16.2 dry-run snapshot and rollback for one synthetic L09 fixture key.
 * Never opens or mutates a real "li.review.*" learner record.
 * This is NOT an atomic browser multi-tab transaction.
 */
import {SITE_FIXTURE_KEY} from '../native-bridge';

export type FixtureLocation=Pick<Location,'hostname'|'pathname'|'search'|'protocol'>;
export type FixtureStorage=Pick<Storage,'getItem'|'setItem'>;
export type FixtureSnapshot=Readonly<{version:1;key:typeof SITE_FIXTURE_KEY;raw:string}>;

function assertFixture(location:FixtureLocation):void{
 const query=new URLSearchParams(location.search);
 if(location.protocol!=='http:'||
    !['localhost','127.0.0.1'].includes(location.hostname)||
    location.pathname!=='/site/index.html'||
    query.get('li-react')!=='l09-native-fixture'){
   throw Error('L09_FIXTURE_ORIGIN_DENIED');
 }
}
function validateRaw(raw:string):void{
 let data:unknown;
 try{data=JSON.parse(raw);}catch{throw Error('L09_FIXTURE_INVALID_JSON');}
 if(!data||typeof data!=='object'||Array.isArray(data)){
   throw Error('L09_FIXTURE_INVALID_RECORD');
 }
 const value=data as Record<string,unknown>;
 const texts=value.draft;
 const ratings=value.ratings;
 if(!Array.isArray(texts)||texts.length!==4||!texts.every(x=>typeof x==='string')||
    !Array.isArray(ratings)||ratings.length!==4||
    !ratings.every(x=>x===null||x===0||x===1||x===2)||
    !['vi','en'].includes(value.locale as string)||
    typeof value.guidedDraft!=='string'||
    typeof value.submitted!=='boolean'||
    typeof value.reviewed!=='boolean'){
   throw Error('L09_FIXTURE_INVALID_SHAPE');
 }
}
export function captureFixtureSnapshot(storage:FixtureStorage,location:FixtureLocation):FixtureSnapshot{
 assertFixture(location);
 const raw=storage.getItem(SITE_FIXTURE_KEY);
 if(raw===null)throw Error('L09_FIXTURE_NOT_FOUND');
 validateRaw(raw);
 return Object.freeze({version:1,key:SITE_FIXTURE_KEY,raw});
}
/**
 * Explicit rollback: user/test must acknowledge and present exact current raw.
 * If another write happened since expectedRaw, refuse. Unknown fields retained.
 * Readback failure attempts best-effort restoration; never claim success.
 */
export function rollbackFixtureSnapshot(
 storage:FixtureStorage,location:FixtureLocation,snapshot:FixtureSnapshot,
 expectedRaw:string|null,confirmed:boolean
):string{
 assertFixture(location);
 if(confirmed!==true)throw Error('L09_FIXTURE_CONFIRM_REQUIRED');
 if(!snapshot||snapshot.version!==1||snapshot.key!==SITE_FIXTURE_KEY||
    typeof snapshot.raw!=='string')throw Error('L09_FIXTURE_BAD_SNAPSHOT');
 validateRaw(snapshot.raw);
 const current=storage.getItem(SITE_FIXTURE_KEY);
 if(current!==expectedRaw)throw Error('L09_FIXTURE_STALE_ROLLBACK');
 if(current===snapshot.raw)return current;
 if(current===null)throw Error('L09_FIXTURE_MISSING_LIVE_RECORD');
 validateRaw(current);
 try{
  storage.setItem(SITE_FIXTURE_KEY,snapshot.raw);
  if(storage.getItem(SITE_FIXTURE_KEY)!==snapshot.raw)throw Error('L09_FIXTURE_READBACK_FAILED');
  return snapshot.raw;
 }catch(error){
  // Restoration after a failed readback is best-effort, not a transaction.
  try{storage.setItem(SITE_FIXTURE_KEY,current);}catch{ /* retain recoverable snapshot */ }
  throw error;
 }
}
