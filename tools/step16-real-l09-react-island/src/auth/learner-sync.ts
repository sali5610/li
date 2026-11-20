import {bindNeonAccount} from '../sync/neon-session.js';
import {releasedLessonIds} from '../learning/released-lessons.js';
import {checkInviteAccess} from '../sync/invite-access.js';
import {storageKey,type JsonValue,type ItemType} from '../sync/contract.js';
import {PrivateDeviceStore} from '../sync/local-dexie.js';
import {syncOnce} from '../sync/sync-once.js';
import type {NeonUserApi} from '../sync/neon-api.js';
import {NEON_DATA_API_URL,AUTH_ORIGIN,IS_GITHUB_STAGING} from './config.js';
import {neonSessionPort} from './neon-client.js';
import {isBlankNativeAttempt} from './native-progress.js';
import {preparePersonalAccount,capturePersonalState,hydratePersonalState,
 hasPersonalLocalChanges,journalCloudConsent,setJournalCloudConsent,personalRemoteSnapshot,PERSONAL_FIELDS} from './private-state.js';

/**
 * The native lesson UI still writes li.review.* localStorage synchronously.
 * This adapter mirrors actual learner attempts into account-scoped Dexie records
 * AND their transactionally durable offline outbox, then syncs using the signed
 * Neon Data API. No synthetic attempts, second app shell, or manual sync button.
 */
const LESSONS=releasedLessonIds; // Only manifest + explicitly available catalog lessons
const OWNER='li.sync.local-owner.v1';
const KEY=(id:string)=>'li.review.'+id+'.v1';
const CHECKPOINT=(uid:string,id:string)=>'li.sync.checkpoint.v1:'+uid+':'+id;
const BACKUP=(uid:string,id:string)=>'li.sync.local-backup.v1:'+uid+':'+id;
const store=new PrivateDeviceStore();
type Attempt=Record<string,unknown>;
type CloudPayload={schema:'li.native.lesson.v1';data:Record<string,JsonValue>};
type Snapshot={id:string;raw:string|null};
export type SyncReport='checking'|'saved'|'empty'|'offline'|'queued'|'conflict'|'error';
type ActiveSync={uid:string;ready:Promise<void>;finish:()=>void;last:SyncReport;settled:boolean};
let activeSync:ActiveSync|null=null;

/** Per-user, explicit remote consent for private wellness diary / check-ins. */
export {journalCloudConsent};
export async function changeJournalCloudConsent(uid:string,enabled:boolean):Promise<void>{
 if(!uid.trim()||localStorage.getItem(OWNER)!==uid||
   !document.documentElement.classList.contains('li-auth-verified'))
  throw Error('LEARNER_ACCOUNT_OR_INVITE_REQUIRED');
 if(!enabled&&journalCloudConsent(uid)){
  // Withdraw cloud permission: retain local journal, queue remote tombstones.
  // Pending offline writes are replaced atomically with deletion intent.
  for(const field of PERSONAL_FIELDS.filter(x=>x.diary)){
   const key=storageKey(uid,field.type,field.id);
   const existing=await store.records.get(key);
   if(!existing||existing.deletedAt)continue;
   await store.edit(uid,field.type,field.id,
    {schema:'li.personal.storage.v1',storageKey:field.key,raw:''},new Date().toISOString());
  }
 }
 setJournalCloudConsent(uid,enabled);
}

export type PrivateConflictChoice={itemType:ItemType;itemId:string;label:string};
const CONFLICT_LABELS:Record<string,string>={
 'note:library':'Bút Ký, Ý đã nhặt và Dấu Trang',
 'note:case-draft':'Bản nháp Phản Chứng',
 'note:daily-journal':'Nhật Ký & Check-in',
 'preference:daily-enabled':'Bật/tắt ghi Nhật Ký',
 'preference:journal-cloud-consent':'Quyền đồng bộ Nhật Ký',
 'preference:locale':'Ngôn ngữ',
 'preference:study-mode':'Nhịp học',
 'preference:buddy-address':'Cách xưng hô Lão Lý',
 'review_schedule:spell-t02-due':'Lịch ôn',
 'l2_progress:lesson-visits':'Lịch sử mở bài',
 'l2_progress:problem-visits':'Lịch sử problem/case',
 'l2_progress:spell-t12-resume-standalone':'T12 · Dấu vết đang học',
 'l2_progress:spell-t12-resume-L03-1-2':'T12 · L03',
 'l2_progress:spell-t12-resume-L09-1-2':'T12 · L09',
 'l2_progress:spell-t12-resume-L15-2-2':'T12 · L15'
};
export async function listPrivateConflicts(uid:string):Promise<PrivateConflictChoice[]>{
 if(!uid||localStorage.getItem(OWNER)!==uid||
 !document.documentElement.classList.contains('li-auth-verified'))
  throw Error('LEARNER_ACCOUNT_OR_INVITE_REQUIRED');
 const rows=await store.outbox.where('accountId').equals(uid).toArray();
 return rows.filter(x=>x.conflict).map(x=>({
  itemType:x.itemType,itemId:x.itemId,
  label:CONFLICT_LABELS[x.itemType+':'+x.itemId]||
   (x.itemType==='lesson_attempt'?'Bài '+x.itemId:'Dữ liệu '+x.itemId)
 }));
}
export async function resolvePrivateConflict(uid:string,type:ItemType,id:string,
 choice:'keep-local'|'use-remote'):Promise<void>{
 if(!uid||localStorage.getItem(OWNER)!==uid||
 !document.documentElement.classList.contains('li-auth-verified'))throw Error('LEARNER_ACCOUNT_OR_INVITE_REQUIRED');
 if(!await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort))throw Error('INVITE_REVOKED');
 const api=await bindNeonAccount(NEON_DATA_API_URL,neonSessionPort);
 if(!api||api.accountId!==uid)throw Error('SESSION_CHANGED');
 const key=storageKey(uid,type,id),op=await store.outbox.get(key);
 if(!op?.conflict||op.accountId!==uid)throw Error('CONFLICT_CHANGED_REFRESH_REQUIRED');
 const remote=await api.one(type,id);
 if(!remote)throw Error('CONFLICT_REMOTE_MISSING');
 if(choice==='use-remote'){
  const localKey=type==='lesson_attempt'?KEY(id):
   personalRemoteSnapshot(uid,type,id,remote.payload)?.key;
  if(!localKey)throw Error('CONFLICT_KEY_UNSUPPORTED');
  const previous=localStorage.getItem(localKey);
  const raw=type==='lesson_attempt'?JSON.stringify(cloud(remote.payload)):
   personalRemoteSnapshot(uid,type,id,remote.payload)?.raw;
  if(raw===undefined)throw Error('CONFLICT_PAYLOAD_UNSUPPORTED');
  if(localStorage.getItem(localKey)!==previous)throw Error('LOCAL_CHANGED_DURING_RESOLUTION');
  await store.resolveConflict(uid,op,remote,choice);
  if(remote.deleted_at)localStorage.removeItem(localKey);
  else localStorage.setItem(localKey,raw);
  window.location.reload(); // Rebuild in-memory diary/notes/lesson from selected revision.
  return;
 }
 await store.resolveConflict(uid,op,remote,choice);
 window.dispatchEvent(new Event('li:private-sync-request'));
}
export async function waitForLearnerHydration(uid:string):Promise<void>{
 const state=activeSync;
 if(!state||state.uid!==uid)throw new Error('LEARNER_SYNC_NOT_STARTED');
 await state.ready;
 if(activeSync!==state)throw new Error('LEARNER_ACCOUNT_CHANGED');
}

/** React uses the same user-scoped native attempt and durable Dexie outbox.
 * Never report a save successful unless IndexedDB committed its upload intent.
 */
export async function saveNativeLearnerAttempt(uid:string,id:string,data:unknown,
 expectedRaw:string|null):Promise<string>{
 if(!LESSONS.some(x=>x===id)||localStorage.getItem(OWNER)!==uid||
    !IS_GITHUB_STAGING||location.origin!==AUTH_ORIGIN||
    !document.documentElement.classList.contains('li-auth-verified'))
  throw new Error('LEARNER_ACCOUNT_OR_INVITE_REQUIRED');
 const key=KEY(id);
 if(localStorage.getItem(key)!==expectedRaw)throw new Error('LEARNER_REVISION_CONFLICT');
 const parsed=attempt(JSON.stringify(data));
 if(!parsed)throw new Error('INVALID_LEARNER_ATTEMPT');
 const raw=JSON.stringify(data);
 // The previous native key remains the stable learner key across app versions.
 localStorage.setItem(key,raw);
 if(localStorage.getItem(key)!==raw)throw new Error('LOCAL_ATTEMPT_READBACK_FAILED');
 await store.edit(uid,'lesson_attempt',id,pack(parsed));
 if(activeSync?.uid===uid)activeSync.last='queued';
 window.dispatchEvent(new CustomEvent('li:lesson-attempt-changed',{detail:{lessonId:id}}));
 return raw;
}

/** No local write can claim cloud success without a signed sync in this session,
 * a Neon-accepted Dexie revision, and no pending conflicting edit.
 */
export async function learnerAttemptSyncState(uid:string,id:string):
 Promise<'on-device'|'queued'|'synced'|'unavailable'>{
 if(!LESSONS.some(x=>x===id)||localStorage.getItem(OWNER)!==uid)throw Error('LEARNER_ACCOUNT_CHANGED');
 const raw=localStorage.getItem(KEY(id));
 if(raw===null)return 'on-device';
 const key=storageKey(uid,'lesson_attempt',id);
 const [pending,row]=await Promise.all([store.outbox.get(key),store.records.get(key)]);
 if(pending||!row||row.deletedAt||row.baseRevision<1||
    canonical(cloud(row.payload))!==canonical(attempt(raw)))return 'queued';
 return activeSync?.uid===uid&&activeSync.last==='saved'?'synced':'queued';
}

function canonical(value:unknown):string{
 if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 const object=value as Record<string,unknown>;
 return '{'+Object.keys(object).sort().map(k=>JSON.stringify(k)+':'+canonical(object[k])).join(',')+'}';
}

function validOptionalMethods(value:Record<string,unknown>):boolean{
 if(!Object.hasOwn(value,'methodAttempts'))return true;
 const attempts=value.methodAttempts;
 if(!attempts||typeof attempts!=='object'||Array.isArray(attempts))return false;
 for(const [id,item] of Object.entries(attempts)){
  if(id!=='T06'&&id!=='T07'||!item||typeof item!=='object'||Array.isArray(item))return false;
  const a=item as Record<string,unknown>;
  if(typeof a.draft!=='string'||a.draft.length>4000||
   !(a.submission===null||(typeof a.submission==='string'&&a.submission.length<=4000))||
   !(a.submittedAt===null||(typeof a.submittedAt==='string'&&a.submittedAt.length<=50&&
     Number.isFinite(Date.parse(a.submittedAt)))))return false;
  if((a.submission===null)!==(a.submittedAt===null))return false;
  if(typeof a.submission==='string'&&a.submission.trim().length<12)return false;
 }
 return true;
}
function attempt(raw:string|null):Attempt|null{
 if(raw===null)return null;
 if(raw.length>60000)throw new Error('LOCAL_ATTEMPT_TOO_LARGE');
 const value:unknown=JSON.parse(raw);
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('INVALID_LOCAL_ATTEMPT');
 const a=value as Attempt;
 if(!Array.isArray(a.draft)||a.draft.length!==4||!a.draft.every(x=>typeof x==='string'&&x.length<=4000)||
   !Array.isArray(a.ratings)||a.ratings.length!==4||!validOptionalMethods(a))
  throw new Error('INVALID_LOCAL_ATTEMPT');
 return a;
}
function cloud(value:unknown):Attempt{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('INVALID_CLOUD_ATTEMPT');
 const item=value as Record<string,unknown>;
 // Historical manual L09 cloud saves used "attempt"; keep them readable.
 // Only new writes use the canonical native lesson wrapper.
 const candidate=item.schema==='li.native.lesson.v1'?item.data:
  item.schema==='li.step16.l09.native.v1'?item.attempt:null;
 if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))
  throw new Error('INVALID_CLOUD_ATTEMPT');
 const data=candidate as Attempt;
 attempt(JSON.stringify(data));
 return data;
}
function pack(data:Attempt):CloudPayload{
 return {schema:'li.native.lesson.v1',data:data as Record<string,JsonValue>};
}
function oldCheckpoint(uid:string,id:string):{revision:number;data:string}|null{
 try{
  const value=JSON.parse(localStorage.getItem(CHECKPOINT(uid,id))??'null') as
   {revision?:unknown;data?:unknown}|null;
  if(value&&Number.isSafeInteger(value.revision)&&Number(value.revision)>0&&typeof value.data==='string')
   return {revision:Number(value.revision),data:value.data};
 }catch{/* Never trust malformed legacy metadata. */}
 return null;
}

/** Preserve existing native-device work when switching between invited accounts. */
export function prepareLearnerAccount(uid:string):boolean{
 if(!IS_GITHUB_STAGING||location.origin!==AUTH_ORIGIN||!uid.trim())throw new Error('UNTRUSTED_ACCOUNT');
 const before=localStorage.getItem(OWNER);
 if(before===uid)return false;
 if(before){
  preparePersonalAccount(before,uid);
  for(const id of LESSONS){
   const raw=localStorage.getItem(KEY(id));
   if(raw!==null)localStorage.setItem(BACKUP(before,id),raw);
  }
  for(const id of LESSONS){
   localStorage.removeItem(KEY(id));
   const owned=localStorage.getItem(BACKUP(uid,id));
   if(owned!==null)localStorage.setItem(KEY(id),owned);
  }
 }
 localStorage.setItem(OWNER,uid);
 if(localStorage.getItem(OWNER)!==uid)throw new Error('LOCAL_STORAGE_UNAVAILABLE');
 return before!==null;
}

/**
 * Capture real lesson state before any network write. For a legacy localStorage
 * attempt already saved to Neon, reuse its confirmed revision when identical
 * or when its legacy checkpoint exactly matches the current remote revision.
 * Otherwise leave the draft queued at revision zero: conflict, never overwrite.
 */
async function capture(uid:string,api:NeonUserApi|null):Promise<Snapshot[]>{
 const snapshots:Snapshot[]=[];
 for(const id of LESSONS){
  const raw=localStorage.getItem(KEY(id));
  snapshots.push({id,raw});
  const local=attempt(raw);
  if(!local||isBlankNativeAttempt(local))continue;
  const key=storageKey(uid,'lesson_attempt',id);
  let existing=await store.records.get(key);
  if(!existing&&api){
   try{
    const remote=await api.one('lesson_attempt',id);
    if(remote&&!remote.deleted_at){
     const remoteData=cloud(remote.payload);
     const prior=oldCheckpoint(uid,id);
     if(canonical(remoteData)===canonical(local)||
       (prior?.revision===remote.revision&&prior.data===canonical(remoteData))){
      await store.apply(uid,remote);
      existing=await store.records.get(key);
     }
    }
   }catch{
    // A network/read failure cannot erase the local draft; queue it instead.
   }
  }
  if(!existing||canonical(cloud(existing.payload))!==canonical(local))
   await store.edit(uid,'lesson_attempt',id,pack(local));
 }
 return snapshots;
}
/** Hydration is skipped if the learner edited the native UI during the request. */
async function hydrate(uid:string,snapshots:Snapshot[],retry:()=>void,onHydrated?:(id:string)=>void):Promise<boolean>{
 let restored=false;
 for(const {id,raw} of snapshots){
  const key=storageKey(uid,'lesson_attempt',id);
  if(await store.outbox.get(key))continue; // queued edits and conflicts win locally
  const row=await store.records.get(key);
  if(!row||row.deletedAt)continue;
  const data=cloud(row.payload);
  const current=localStorage.getItem(KEY(id));
  if(current!==raw){retry();continue;}
  const native=attempt(current);
  if(!native||canonical(native)!==canonical(data)){
   localStorage.setItem(KEY(id),JSON.stringify(data));
   restored=true;
   onHydrated?.(id);
  }
 }
 return restored;
}

/** Account is verified by AuthPanel and must be rechecked by Neon/RLS on sync. */
export function startLearnerSync(uid:string,onStatus:(value:SyncReport)=>void):()=>void{
 if(!IS_GITHUB_STAGING||location.origin!==AUTH_ORIGIN||!uid.trim())throw new Error('UNTRUSTED_ORIGIN');
 let disposed=false,busy=false,pending=false,timer:ReturnType<typeof setTimeout>|null=null;
 let transientRetries=0;
 const retryDelays=[5000,15000,30000] as const;
 let finish!:()=>void;
 const ready=new Promise<void>(resolve=>{finish=resolve;});
 const current:ActiveSync={uid,ready,finish,last:'checking',settled:false};
 const observed=new Map<string,string|null>();
 activeSync=current;
 const report=(state:SyncReport)=>{
  if(disposed)return;
  current.last=state;
  onStatus(state);
 };
 function schedule(){
  if(disposed)return;
  if(timer!==null)clearTimeout(timer);
  timer=setTimeout(()=>{timer=null;void run();},850);
 }
 /** Free-tier-safe bounded retry for temporary Data API/network failures.
  * Real edits, app focus, or coming back online also start a fresh attempt.
  * Revoked invites and expired sessions are not retried automatically.
  */
 function retryTransient(){
  if(disposed||!navigator.onLine||transientRetries>=retryDelays.length)return;
  const wait=retryDelays[transientRetries++];
  if(timer!==null)clearTimeout(timer);
  timer=setTimeout(()=>{timer=null;void run();},wait);
 }
 async function run(){
  if(disposed)return;
  if(busy){pending=true;return;}
  busy=true;
  try{
   if(localStorage.getItem(OWNER)!==uid)throw new Error('ACCOUNT_CHANGED');
   let api:NeonUserApi|null=null;
   let apiError:unknown=null;
   if(navigator.onLine){
    try{
     if(!await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort))
      throw new Error('INVITE_REVOKED');
     api=await bindNeonAccount(NEON_DATA_API_URL,neonSessionPort);
     if(!api||api.accountId!==uid)throw new Error('SESSION_CHANGED');
    }catch(e){apiError=e;}
   }
   const snapshots=await capture(uid,api); // Native attempts
   const personal=await capturePersonalState(uid,api,store,observed);
   if(apiError)throw apiError;
   if(!navigator.onLine||!api){report('offline');return;}
   report('checking');
   const result=await syncOnce(store,api,uid,{
    twoUserJwtRlsVerified:true,remoteConsentForPrivateState:true
   });
   if(result.mode==='security-error'||result.mode==='sign-in-required'){
    window.dispatchEvent(new Event('li:auth-recheck'));
    report('error');
    return;
   }
   if(result.mode==='offline'||result.mode==='pending'){
    report(result.mode==='pending'?'queued':'offline');
    retryTransient();
    return;
   }
   // A conflict in ONE item must not block independent, conflict-free lessons
   // downloaded by syncOnce. hydrate() skips every locally queued/conflicted item,
   // so preserve those drafts while bringing the other browser up to date.
   if(result.mode==='conflict')report('conflict');
   // The signed Data API has returned the uploaded row and read all owner rows.
   // Verify actual lesson readback, not merely a successful POST status.
   if(result.uploaded>0){
    for(const id of LESSONS){
     const key=storageKey(uid,'lesson_attempt',id);
     if(await store.outbox.get(key))continue;
     const row=await store.records.get(key);
     if(!row||row.baseRevision<1)continue;
     const verified=await api.one('lesson_attempt',id);
     if(!verified||verified.revision!==row.baseRevision||
       canonical(verified.payload)!==canonical(row.payload))
      throw new Error('SIGNED_LEARNER_READBACK_FAILED');
    }
   }
   const lessonIds:string[]=[];
   const changed=await hydrate(uid,snapshots,()=>{pending=true;},id=>lessonIds.push(id));
   const personalKeys:string[]=[];
   const personalChanged=await hydratePersonalState(uid,personal,store,
    ()=>{pending=true;},key=>personalKeys.push(key));
   const state=await store.counts(uid);
   if(state.conflicts)report('conflict');
   else if(state.pending)report('queued');
   else report((await store.accountRecords(uid)).some(x=>!x.deletedAt)?'saved':'empty');
   if(current.last==='saved'){
    const lessons:{id:string;changedAt:string}[]=[];
    for(const id of LESSONS){
     if(await learnerAttemptSyncState(uid,id)==='synced'){
      const record=await store.records.get(storageKey(uid,'lesson_attempt',id));
      if(record)lessons.push({id,changedAt:record.changedAt});
     }
    }
    window.dispatchEvent(new CustomEvent('li:lesson-cloud-state',{
     detail:{accountId:uid,lessons}
    }));
   }
   transientRetries=0;
   // In-place page state refresh; never clear an open editor or scroll position.
   if(!disposed&&personalChanged)window.dispatchEvent(new CustomEvent('li:personal-sync-applied',{
    detail:{accountId:uid,keys:personalKeys}
   }));
   if(!disposed&&changed)window.dispatchEvent(new CustomEvent('li:lesson-sync-applied',{
    detail:{accountId:uid,lessonIds}
   }));
  }catch(error){
   const code=error instanceof Error?error.message:'';
   const authorizationFailure=code==='INVITE_REVOKED'||code==='SESSION_CHANGED'||
    code==='ACCOUNT_CHANGED'||/^NEON_AUTH_|^INVITE_CHECK_HTTP_40[13]$|^NEON_DATA_API_HTTP_40[13]$/.test(code);
   if(authorizationFailure)window.dispatchEvent(new Event('li:auth-recheck'));
   report(navigator.onLine?'error':'offline');
   if(!authorizationFailure)retryTransient();
  }finally{
   busy=false;
   if(!current.settled){current.settled=true;current.finish();}
   if(pending&&!disposed){pending=false;schedule();}
  }
 }
 const changed=(event:Event)=>{
  const target=event.target;
  if(target instanceof Element&&target.closest('#page-lessonL03,#page-lessonL09,#page-lessonL15')){
   schedule();return;
  }
  // Pull on entering a private screen instead of waiting for the next timer.
  if(event.type==='click'&&target instanceof Element&&
    target.closest('[data-page="library"],[data-page="collection"],[data-page="resume"],'+
      '[data-page="dashboard"],[data-page="settings"]')){
   schedule();return;
  }
  if(hasPersonalLocalChanges(uid,observed))schedule();
 };
 const resumed=()=>schedule();
 const onVisibility=()=>{if(document.visibilityState==='visible')schedule();};
 // Mobile Safari may restore an already-open page from back-forward cache without
 // reloading React. Pull fresh private rows while preserving the current editor.
 const onPageShow=(event:PageTransitionEvent)=>{if(event.persisted)schedule();};
 // A learner looking at personal data should not need a full refresh to see edits
 // from another device. Keep other screens on the existing free-tier-safe cadence.
 const personalPageActive=()=>Boolean(document.querySelector(
  '#page-library.active,#page-collection.active,#page-resume.active,'+
  '#page-dashboard.active,#page-settings.active,#page-noteDetail.active,'+
  '#page-guideDetail.active'
 ));
 let lastPoll=Date.now();
 const livePoll=setInterval(()=>{
  if(disposed||activeSync!==current||document.visibilityState!=='visible'||
     !navigator.onLine||busy)return;
  const now=Date.now(),interval=personalPageActive()?6000:20000;
  if(now-lastPoll<interval)return;
  lastPoll=now;
  schedule();
 },2000);
 const onPersonalEvent=()=>{if(hasPersonalLocalChanges(uid,observed))schedule();};
 document.addEventListener('input',changed);
 document.addEventListener('change',changed);
 document.addEventListener('click',changed);
 window.addEventListener('focus',resumed);
 window.addEventListener('pageshow',onPageShow);
 window.addEventListener('popstate',resumed);
 document.addEventListener('visibilitychange',onVisibility);
 window.addEventListener('online',resumed);
 window.addEventListener('li:lesson-submitted',resumed);
 window.addEventListener('li:lesson-attempt-changed',resumed);
 window.addEventListener('li:activity',onPersonalEvent);
 window.addEventListener('li:private-personal-change',onPersonalEvent);
 window.addEventListener('li:localechange',onPersonalEvent);
 window.addEventListener('li:private-sync-consent',resumed);
 window.addEventListener('li:private-sync-request',resumed);
 window.addEventListener('storage',onPersonalEvent);
 void run();
 return()=>{
  disposed=true;
  clearInterval(livePoll);
  if(timer!==null)clearTimeout(timer);
  document.removeEventListener('input',changed);
  document.removeEventListener('change',changed);
  document.removeEventListener('click',changed);
  window.removeEventListener('focus',resumed);
  window.removeEventListener('pageshow',onPageShow);
  window.removeEventListener('popstate',resumed);
  document.removeEventListener('visibilitychange',onVisibility);
  window.removeEventListener('online',resumed);
  window.removeEventListener('li:lesson-submitted',resumed);
  window.removeEventListener('li:lesson-attempt-changed',resumed);
  window.removeEventListener('li:activity',onPersonalEvent);
  window.removeEventListener('li:private-personal-change',onPersonalEvent);
  window.removeEventListener('li:localechange',onPersonalEvent);
  window.removeEventListener('li:private-sync-consent',resumed);
  window.removeEventListener('li:private-sync-request',resumed);
  window.removeEventListener('storage',onPersonalEvent);
  if(!current.settled){current.settled=true;current.finish();}
  if(activeSync===current)activeSync=null;
 };
}
