import {storageKey,type ItemType,type JsonValue} from '../sync/contract.js';
import {PrivateDeviceStore} from '../sync/local-dexie.js';
import type {CloudUserApi} from '../sync/e2ee-cloud.js';
import {personalStudyManuscriptIds} from '../learning/personal-study-ids.js';
import {captureDraftKey} from '../shell/capture-draft.js';
import {validMethodAttempts} from '../learning/validate-method-attempts.js';
import {isBlankNativeAttempt} from './native-progress.js';
import {validSchedule,validTime,isReminderKind} from '../shell/in-app-reminder.js';

/** One existing signed Dexie/Neon pipeline for ALL first-party personal state.
 * App shell, lesson drafts and auth tokens themselves are NOT mirrored.
 * The journal was explicitly local-only: EACH learner must opt into remote
 * storage of daily check-ins, wellness entries and journal activities.
 */
type Field={key:string;type:ItemType;id:string;diary?:true};
export const PERSONAL_FIELDS:readonly Field[]=[
 {key:'li.private.library.v1',type:'note',id:'library'},
 {key:'li.private.case-draft.v1',type:'note',id:'case-draft'},
 {key:'li.private.lesson.visits.v1',type:'l2_progress',id:'lesson-visits'},
 {key:'li.private.problem.visits.v1',type:'l2_progress',id:'problem-visits'},
 {key:'li.study-mode.v1',type:'preference',id:'study-mode'},
 {key:'li.reminders.in-app.v1',type:'preference',id:'in-app-reminders'},
 {key:'li.buddy-address.v1',type:'preference',id:'buddy-address'},
 {key:'li.app.locale.v1',type:'preference',id:'locale'},
 {key:'li.spell.t02.due.v1',type:'review_schedule',id:'spell-t02-due'},
 {key:'li.personal.daily.v1',type:'note',id:'daily-journal',diary:true},
 {key:'li.personal.daily.enabled.v1',type:'preference',id:'daily-enabled',diary:true}
];
/* Never register personal-draft scopes outside the invited staging build. */
const IS_PERSONAL_STAGING=(import.meta as ImportMeta & {
 env?:{VITE_LI_AUTH_TARGET?:string}
}).env?.VITE_LI_AUTH_TARGET==='github-pages-staging';
const SPELL_CONTEXTS:readonly string[]=[
 'standalone','L03-1-2','L09-1-2','L15-2-2',
 ...(IS_PERSONAL_STAGING?personalStudyManuscriptIds:[])
];
const T02_PREFIX='li.spell.t02.schedule.v2:';
/** Owner- and lesson-scoped successive review schedules through signed Neon RLS. */
export const t02Fields=(uid:string):Field[]=>
 SPELL_CONTEXTS.map(lesson=>({
  key:T02_PREFIX+encodeURIComponent(uid)+':'+lesson,
  type:'review_schedule',id:'spell-t02-'+lesson
 }));
function assertT02(raw:string):void{
 const d=JSON.parse(raw) as Record<string,unknown>;
 if(!d||typeof d!=='object'||Array.isArray(d)||
    d.schema!=='li.spell.t02.v2'||
    !(d.due===null||(Number.isSafeInteger(d.due)&&Number(d.due)>0))||
    !Number.isSafeInteger(d.reviewCount)||Number(d.reviewCount)<0||
    !Number.isSafeInteger(d.streak)||Number(d.streak)<0||
    Number(d.streak)>Number(d.reviewCount)||
    typeof d.awaitingRating!=='boolean'||
    !(d.lastReviewedAt===null||(Number.isSafeInteger(d.lastReviewedAt)&&Number(d.lastReviewedAt)>0))||
    ![null,'remembered','retry'].includes(d.lastRating as string|null)||
    typeof d.updatedAt!=='string'||d.updatedAt.length>48||
    (d.awaitingRating&&d.due===null))
  throw Error('T02_PRIVATE_REVIEW_SCHEDULE_INVALID');
}
const T12_CONTEXTS=SPELL_CONTEXTS;
const T12_PREFIX='li.spell.t12.resume.v1:';
/** One signed owner+lesson record per T12 practice, using existing RLS. */
export const t12Fields=(uid:string):Field[]=>
 T12_CONTEXTS.map(lesson=>({
  key:T12_PREFIX+encodeURIComponent(uid)+':'+lesson,
  type:'l2_progress',id:'spell-t12-resume-'+lesson
 }));
function assertT12(raw:string):void{
 const data=JSON.parse(raw) as Record<string,unknown>;
 if(!data||typeof data!=='object'||Array.isArray(data)||
    data.schema!=='li.spell.t12.v1'||![0,1,2].includes(data.phase as number)||
    !['context','next','answer'].every(k=>
      typeof data[k]==='string'&&(data[k] as string).length<=1200)||
    (data.phase===1&&(!(data.context as string).trim()||!(data.next as string).trim()))||
    (data.phase===2&&[data.context,data.next,data.answer].some(Boolean)))
   throw Error('T12_PRIVATE_CHECKPOINT_INVALID');
}
const PRACTICE_PREFIX='li.spell.practice.v1:';
const PRACTICE_ID='spell-practice-history';
/* A receipt never contains answers, grades or authored learning content.
 * Strict decode prevents arbitrary browser keys from entering signed RLS sync. */
function assertPractice(raw:string):void{
 if(raw.length>60000)throw Error('SPELL_PRACTICE_TOO_LARGE');
 const d=JSON.parse(raw) as Record<string,unknown>;
 if(!d||typeof d!=='object'||Array.isArray(d)||
  Object.keys(d).sort().join(',')!=='schema,scopes'||d.schema!=='li.spell.practice.v1'||
  !d.scopes||typeof d.scopes!=='object'||Array.isArray(d.scopes))
  throw Error('SPELL_PRACTICE_INVALID');
 const scopes=Object.entries(d.scopes as Record<string,unknown>);
 if(scopes.length>30)throw Error('SPELL_PRACTICE_SCOPE_LIMIT');
 const allowed=new Set(SPELL_CONTEXTS);
 const methods=new Set(['T01','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12','T13']);
 for(const [context,items] of scopes){
  if(!allowed.has(context)||!items||typeof items!=='object'||Array.isArray(items))
   throw Error('SPELL_PRACTICE_SCOPE_INVALID');
  for(const [id,v] of Object.entries(items as Record<string,unknown>)){
   if(!methods.has(id)||!v||typeof v!=='object'||Array.isArray(v))
    throw Error('SPELL_PRACTICE_METHOD_INVALID');
   const r=v as Record<string,unknown>;
   if(Object.keys(r).sort().join(',')!=='count,lastAt,phase,places'||
    !Number.isSafeInteger(r.count)||Number(r.count)<0||Number(r.count)>100000||
    !(r.lastAt===null||(Number.isSafeInteger(r.lastAt)&&Number(r.lastAt)>0))||
    !Number.isSafeInteger(r.phase)||Number(r.phase)<0||
    Number(r.phase)>(id==='T03'?2:1)||
    (Number(r.phase)>0&&!['T01','T03','T13'].includes(id))||
    !Array.isArray(r.places)||
    r.places.length>(id==='T13'?3:0)||
    r.places.some(x=>typeof x!=='string'||x.length>1200)||
    (r.phase===0&&r.places.length!==0)||
    (id==='T13'&&r.phase===1&&
      (r.places.length!==3||new Set(r.places.map(x=>x.trim().toLocaleLowerCase('vi'))).size!==3)))
    throw Error('SPELL_PRACTICE_RECEIPT_INVALID');
  }
 }
}
export function practiceField(uid:string):Field{
 return{key:PRACTICE_PREFIX+encodeURIComponent(uid),type:'l2_progress',id:PRACTICE_ID};
}
const CONSENT=(uid:string)=>'li.sync.journal-cloud-consent.v1:'+uid;
const BACKUP=(uid:string,key:string)=>'li.sync.local-backup.v1:'+uid+':'+key;
const SCHEMA='li.personal.storage.v1';
const fieldsFor=(uid:string):readonly Field[]=>[
 {key:CONSENT(uid),type:'preference',id:'journal-cloud-consent'},
 ...PERSONAL_FIELDS,...t02Fields(uid),...t12Fields(uid),practiceField(uid)
];
/** Read only registered active-owner device fields, including uncaptured
 * drafts and local-only journal. Consent is a separate explicit action and
 * must never be granted by backup or recovery. No storage enumeration.
 * Local and materialized copies may differ: preserve both for recovery.
 */
export function snapshotLearnerDevice(uid:string,lessonIds:readonly string[],
 isAuthorized:()=>boolean):{key:string;raw:string}[]{
 const authorized=()=>Boolean(uid)&&isAuthorized()&&localStorage.getItem('li.sync.local-owner.v1')===uid;
 if(!authorized())throw Error('BACKUP_OWNER_REQUIRED');
 const keys=new Set([...fieldsFor(uid).filter(field=>field.id!=='journal-cloud-consent').map(field=>field.key),
  ...lessonIds.map(id=>'li.review.'+id+'.v1'),captureDraftKey(uid)]);
 const result:{key:string;raw:string}[]=[];
 for(const key of keys){
  const raw=localStorage.getItem(key);
  if(raw!==null)result.push({key,raw});
 }
 if(!authorized())throw Error('BACKUP_OWNER_CHANGED');
 return result;
}
/** Restore only registered device-only data; never generate an upload intent. */
export type LocalRecoveryResult={restored:number;skipped:number;deferred:number};
type RecoveryRecord={key:string;raw:string};
function recoveryObject(value:unknown):value is Record<string,unknown>{
 return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
}
function safeRecoveryJson(value:unknown,depth=0):boolean{
 if(depth>30)return false;
 if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number')return true;
 if(Array.isArray(value))return value.every(x=>safeRecoveryJson(x,depth+1));
 return recoveryObject(value)&&Object.entries(value).every(([key,v])=>
  !['__proto__','constructor','prototype'].includes(key)&&safeRecoveryJson(v,depth+1));
}
function validateLocalRecovery(key:string,raw:string,uid:string){
 if(raw.length>300000)throw Error('RESTORE_INVALID_RECORD');
 const value:unknown=JSON.parse(raw);
 if(!recoveryObject(value)||!safeRecoveryJson(value))throw Error('RESTORE_INVALID_RECORD');
 if(key===captureDraftKey(uid)){
  if(Object.keys(value).sort().join(',')!=='fieldId,text'||typeof value.text!=='string'||
   !(value.fieldId===null||typeof value.fieldId==='string'))throw Error('RESTORE_INVALID_CAPTURE');
 }else{
  if(value.schema!==1||!recoveryObject(value.days))throw Error('RESTORE_INVALID_JOURNAL');
  for(const [date,day] of Object.entries(value.days)){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!recoveryObject(day)||!recoveryObject(day.activities)||
     !Number.isSafeInteger(day.checkins)||Number(day.checkins)<0||
     !['lesson','branch','input'].every(k=>Array.isArray((day.activities as Record<string,unknown>)[k])&&
      ((day.activities as Record<string,unknown>)[k] as unknown[]).every(x=>typeof x==='string'&&x.length<=256)))
    throw Error('RESTORE_INVALID_JOURNAL');
   if(day.physical!==null&&day.physical!==undefined&&(!recoveryObject(day.physical)||
    !['sleep','move','rest'].every(k=>['yes','no','unsure'].includes(String((day.physical as Record<string,unknown>)[k])))))
    throw Error('RESTORE_INVALID_JOURNAL');
  }
 }
}
export async function restoreLocalOnlyBackup(uid:string,lessonIds:readonly string[],json:string,
 store:PrivateDeviceStore,isAuthorized:()=>boolean):Promise<LocalRecoveryResult>{
 const authorized=()=>Boolean(uid)&&isAuthorized()&&localStorage.getItem('li.sync.local-owner.v1')===uid;
 if(!authorized())throw Error('RESTORE_OWNER_REQUIRED');
 if(json.length>8_000_000)throw Error('RESTORE_TOO_LARGE');
 const data:unknown=JSON.parse(json);
 if(!recoveryObject(data)||data.schema!=='li.learner.device-backup.v2'||data.accountId!==uid||
   !Array.isArray(data.deviceRecords)||data.deviceRecords.length>5000||
   !recoveryObject(data.materialized)||data.materialized.schema!=='li.private.backup.v1'||
   data.materialized.accountId!==uid||!Array.isArray(data.materialized.items))
  throw Error('RESTORE_WRONG_ACCOUNT_OR_SCHEMA');
 const allowed=new Set([...fieldsFor(uid).filter(field=>field.id!=='journal-cloud-consent').map(field=>field.key),
  ...lessonIds.map(id=>'li.review.'+id+'.v1'),captureDraftKey(uid)]);
 const seen=new Set<string>(),candidates:RecoveryRecord[]=[];
 // Count all deferred materialized rows separately; they are never applied here.
 let deferred=data.materialized.items.length;
 const journal='li.personal.daily.v1';
 for(const record of data.deviceRecords){
  if(!recoveryObject(record)||typeof record.key!=='string'||typeof record.raw!=='string'||
    !allowed.has(record.key)||seen.has(record.key))throw Error('RESTORE_INVALID_RECORD');
  seen.add(record.key);
  if(record.key!==journal&&record.key!==captureDraftKey(uid)){deferred++;continue;}
  validateLocalRecovery(record.key,record.raw,uid);
  candidates.push({key:record.key,raw:record.raw});
 }
 const written:RecoveryRecord[]=[];
 try{
  return await store.transaction('rw',store.records,store.outbox,async()=>{
   let skipped=0;
   const journalKey=storageKey(uid,'note','daily-journal');
   const [cached,pending]=await Promise.all([store.records.get(journalKey),store.outbox.get(journalKey)]);
   if(!authorized())throw Error('RESTORE_OWNER_CHANGED');
   for(const item of candidates){
    if(!authorized())throw Error('RESTORE_OWNER_CHANGED');
    // A known cloud row (including deletion), pending edit or enabled consent
    // requires separate signed recovery. Never re-enable journal sync here.
    if(item.key===journal&&(journalCloudConsent(uid)||cached||pending)){skipped++;continue;}
    if(localStorage.getItem(item.key)!==null){skipped++;continue;}
    written.push(item);
    localStorage.setItem(item.key,item.raw);
    if(localStorage.getItem(item.key)!==item.raw)throw Error('RESTORE_READBACK_FAILED');
   }
   if(!authorized())throw Error('RESTORE_OWNER_CHANGED');
   return {restored:written.length,skipped,deferred};
  });
 }catch(error){
  // Compensate only additions still owned by this operation. No cross-store
  // atomicity claim; a browser crash or storage denial may prevent rollback.
  if(localStorage.getItem('li.sync.local-owner.v1')===uid)
   for(const item of written.reverse())if(localStorage.getItem(item.key)===item.raw)localStorage.removeItem(item.key);
  throw error;
 }
}
/** Canonical lesson parser, shared by capture and explicit recovery. */
export function parseLearnerAttempt(raw:string|null):Record<string,unknown>|null{
 if(raw===null)return null;
 if(raw.length>60000)throw new Error('LOCAL_ATTEMPT_TOO_LARGE');
 const value:unknown=JSON.parse(raw);
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('INVALID_LOCAL_ATTEMPT');
 const a=value as Record<string,unknown>;
 if(!Array.isArray(a.draft)||a.draft.length!==4||!a.draft.every(x=>typeof x==='string'&&x.length<=4000)||
   !Array.isArray(a.ratings)||a.ratings.length!==4||!validMethodAttempts(a))
  throw new Error('INVALID_LOCAL_ATTEMPT');
 return a;
}

export type SyncedRecoveryResult={queued:number;skipped:number;unresolved:number};
function validRegisteredRecovery(field:Field,raw:string):JsonValue{
 const payload=wrap(field,raw);
 const id=field.id;
 if(id==='case-draft')return payload;
 if(id==='study-mode'){if(!['start','focus','overload','recover'].includes(raw))throw Error('RESTORE_INVALID_MODE');return payload;}
 if(id==='locale'){if(!['vi','en'].includes(raw))throw Error('RESTORE_INVALID_LOCALE');return payload;}
 const v:unknown=JSON.parse(raw);
 if(!recoveryObject(v)||!safeRecoveryJson(v))throw Error('RESTORE_INVALID_RECORD');
 if(id==='library'){
  const checks:Record<string,(x:Record<string,unknown>)=>boolean>={
   cases:x=>typeof x.title==='string'&&typeof x.revision==='string'&&typeof x.correct==='boolean',
   questions:x=>typeof x.question==='string',
   ideas:x=>typeof x.id==='string'&&typeof x.text==='string'&&x.text.length<=5000&&typeof x.savedAt==='string',
   savedContent:x=>['lesson','case'].includes(String(x.type))&&typeof x.id==='string'&&typeof x.savedAt==='string'
  };
  if(v.schema!==1||Object.entries(checks).some(([k,check])=>!Array.isArray(v[k])||
   !(v[k] as unknown[]).every(x=>recoveryObject(x)&&check(x))))throw Error('RESTORE_INVALID_LIBRARY');
 }else if(id==='lesson-visits'||id==='problem-visits'){
  if(v.schema!==1||!Array.isArray(v.items)||v.items.length>40||
   !v.items.every(x=>recoveryObject(x)&&typeof x.visitedAt==='string'&&Number.isFinite(Date.parse(x.visitedAt))))
   throw Error('RESTORE_INVALID_VISITS');
 }else if(id==='buddy-address'){
  if(!['warm','teasing','serious'].every(k=>typeof v[k]==='string'&&(v[k] as string).length<=100))
   throw Error('RESTORE_INVALID_NAMES');
 }else if(id==='in-app-reminders'){
  if(v.version===1){
   if(!isReminderKind(v.kind)||typeof v.enabled!=='boolean'||
    !(v.time===''||validTime(v.time))||(v.enabled&&!validTime(v.time)))throw Error('RESTORE_INVALID_REMINDERS');
  }else if(v.version!==2||!Array.isArray(v.schedules)||v.schedules.length!==4||
   !v.schedules.every(validSchedule)||new Set(v.schedules.map(s=>s.kind)).size!==4)
    throw Error('RESTORE_INVALID_REMINDERS');
 }else if(id==='spell-t02-due'){
  if(!(v.due===null||(Number.isSafeInteger(v.due)&&Number(v.due)>0)))throw Error('RESTORE_INVALID_DUE');
 }
 // T02, T12 and spell practice already have strict shared validators in wrap.
 return payload;
}
/** Missing-only online restore. Never import backup revisions, tombstones,
 * consent, arbitrary scopes or divergent copies. All writes use the existing
 * durable outbox and revision zero CAS; a concurrent server insert conflicts.
 */
export async function restoreMissingSyncedBackup(uid:string,lessonIds:readonly string[],json:string,
 store:PrivateDeviceStore,api:Pick<CloudUserApi,'accountId'|'all'>,
 isAuthorized:()=>boolean):Promise<SyncedRecoveryResult>{
 const authorized=()=>Boolean(uid)&&api.accountId===uid&&isAuthorized()&&
  localStorage.getItem('li.sync.local-owner.v1')===uid;
 if(!authorized())throw Error('RESTORE_OWNER_REQUIRED');
 if(json.length>8_000_000)throw Error('RESTORE_TOO_LARGE');
 const data:unknown=JSON.parse(json);
 if(!recoveryObject(data)||data.schema!=='li.learner.device-backup.v2'||data.accountId!==uid||
  !Array.isArray(data.deviceRecords)||data.deviceRecords.length>5000||
  !recoveryObject(data.materialized)||data.materialized.schema!=='li.private.backup.v1'||
  data.materialized.accountId!==uid||!Array.isArray(data.materialized.items)||data.materialized.items.length>5000)
   throw Error('RESTORE_WRONG_ACCOUNT_OR_SCHEMA');
 const fields=[...fieldsFor(uid).filter(f=>!f.diary&&f.id!=='journal-cloud-consent'),
  ...lessonIds.map(id=>({key:'li.review.'+id+'.v1',type:'lesson_attempt' as const,id}))];
 const byKey=new Map(fields.map(f=>[f.key,f]));
 const byScope=new Map(fields.map(f=>[storageKey(uid,f.type,f.id),f]));
 const device=new Map<string,string>(),materialized=new Map<string,{raw:string|null;deleted:boolean}>();
 let unresolved=0;
 for(const r of data.deviceRecords){
  if(!recoveryObject(r)||typeof r.key!=='string'||typeof r.raw!=='string')throw Error('RESTORE_INVALID_RECORD');
  if(!byKey.has(r.key))continue;
  if(device.has(r.key))throw Error('RESTORE_DUPLICATE');
  device.set(r.key,r.raw);
 }
 for(const r of data.materialized.items){
  if(!recoveryObject(r)||typeof r.itemType!=='string'||typeof r.itemId!=='string'||
   !(r.deletedAt===null||typeof r.deletedAt==='string'))throw Error('RESTORE_INVALID_RECORD');
  const f=byScope.get(JSON.stringify([uid,r.itemType,r.itemId]));
  if(!f){unresolved++;continue;}
  if(materialized.has(f.key))throw Error('RESTORE_DUPLICATE');
  if(r.deletedAt!==null){materialized.set(f.key,{raw:null,deleted:true});continue;}
  if(!recoveryObject(r.payload))throw Error('RESTORE_INVALID_RECORD');
  const payload=r.payload;
  let raw:string;
  if(f.type==='lesson_attempt'){
   const attempt=payload.schema==='li.native.lesson.v1'?payload.data:
    payload.schema==='li.step16.l09.native.v1'?payload.attempt:null;
   if(!recoveryObject(attempt))throw Error('RESTORE_INVALID_ATTEMPT');
   raw=JSON.stringify(attempt);
  }else raw=unpack(payload,f.key);
  materialized.set(f.key,{raw,deleted:false});
 }
 const candidates:{field:Field;payload:JsonValue}[]=[];
 let skipped=0;
 for(const field of fields){
  const a=device.get(field.key),b=materialized.get(field.key);
  if(a===undefined&&!b)continue;
  if(b?.deleted){skipped++;continue;}
  // Never silently choose between two distinct snapshots in the same file.
  if(a!==undefined&&b?.raw!==undefined&&b.raw!==null&&a!==b.raw){unresolved++;continue;}
  const raw=a??b?.raw;
  if(raw===null||raw===undefined){unresolved++;continue;}
  let payload:JsonValue;
  if(field.type==='lesson_attempt'){
   const value=parseLearnerAttempt(raw);
   if(!value||!safeRecoveryJson(value))throw Error('RESTORE_INVALID_ATTEMPT');
   if(isBlankNativeAttempt(value)){skipped++;continue;}
   payload={schema:'li.native.lesson.v1',data:value as Record<string,JsonValue>};
  }else payload=validRegisteredRecovery(field,raw);
  candidates.push({field,payload});
 }
 if(!candidates.length)return {queued:0,skipped,unresolved};
 const remote=await api.all();
 if(!authorized())throw Error('RESTORE_OWNER_CHANGED');
 if(remote.some(r=>r.owner_id!==uid))throw Error('REMOTE_OWNER_MISMATCH');
 const remoteKeys=new Set(remote.map(r=>storageKey(uid,r.item_type,r.item_id)));
 return store.transaction('rw',store.records,store.outbox,async()=>{
  let queued=0;
  for(const {field,payload} of candidates){
   if(!authorized())throw Error('RESTORE_OWNER_CHANGED');
   const key=storageKey(uid,field.type,field.id);
   if(remoteKeys.has(key)||await store.records.get(key)||await store.outbox.get(key)||
    localStorage.getItem(field.key)!==null){skipped++;continue;}
   if(!authorized())throw Error('RESTORE_OWNER_CHANGED');
   await store.edit(uid,field.type,field.id,payload);
   queued++;
  }
  if(!authorized())throw Error('RESTORE_OWNER_CHANGED');
  return {queued,skipped,unresolved};
 });
}
/** Explicit, single-lesson deletion. Never enumerate or delete other records.
 * The signed current revision is the only permissible CAS baseline.
 * Local removal is compensated if IndexedDB fails; not physical media erasure.
 */
export async function queueLessonDeletion(uid:string,id:string,lessonIds:readonly string[],
 store:PrivateDeviceStore,api:Pick<CloudUserApi,'accountId'|'one'>,
 isAuthorized:()=>boolean):Promise<'queued'|'already-deleted'>{
 const allowed=()=>Boolean(uid)&&api.accountId===uid&&lessonIds.includes(id)&&isAuthorized()&&
  localStorage.getItem('li.sync.local-owner.v1')===uid;
 if(!allowed())throw Error('DELETE_OWNER_OR_LESSON_REQUIRED');
 const keys=['li.review.'+id+'.v1','li.sync.local-backup.v1:'+uid+':'+id,
  'li.sync.checkpoint.v1:'+uid+':'+id,'li.reader.position.'+encodeURIComponent(uid)+'.'+id+'.v1'];
 const prior=keys.map(key=>({key,raw:localStorage.getItem(key)}));
 const remote=await api.one('lesson_attempt',id);
 if(!allowed())throw Error('DELETE_OWNER_CHANGED');
 if(remote&&(remote.owner_id!==uid||remote.item_type!=='lesson_attempt'||remote.item_id!==id||
  !Number.isSafeInteger(remote.revision)||remote.revision<1))throw Error('DELETE_REMOTE_SCOPE');
 const key=storageKey(uid,'lesson_attempt',id);
 const removed:typeof prior=[];
 try{
  return await store.transaction('rw',store.records,store.outbox,async()=>{
   const [existing,pending]=await Promise.all([store.records.get(key),store.outbox.get(key)]);
   if(!allowed())throw Error('DELETE_OWNER_CHANGED');
   if(pending||existing&&existing.baseRevision!==(remote?.revision??0))
    throw Error('DELETE_SYNC_FIRST');
   if(prior.some(x=>localStorage.getItem(x.key)!==x.raw))throw Error('DELETE_LOCAL_CHANGED');
   if(remote&&!existing)await store.apply(uid,remote);
   const alreadyDeleted=Boolean(remote?.deleted_at);
   if(!alreadyDeleted){
    // No old answers or self-ratings in the tombstone payload.
    await store.edit(uid,'lesson_attempt',id,{schema:'li.native.lesson.v1',
     data:{draft:['','','',''],ratings:[null,null,null,null]}},new Date().toISOString());
   }
   if(!allowed()||prior.some(x=>localStorage.getItem(x.key)!==x.raw))throw Error('DELETE_LOCAL_CHANGED');
   for(const x of prior){
    if(x.raw===null)continue;
    removed.push(x);localStorage.removeItem(x.key);
    if(localStorage.getItem(x.key)!==null)throw Error('DELETE_READBACK_FAILED');
   }
   if(!allowed())throw Error('DELETE_OWNER_CHANGED');
   return alreadyDeleted?'already-deleted':'queued';
  });
 }catch(error){
  if(localStorage.getItem('li.sync.local-owner.v1')===uid)
   for(const x of removed.reverse())if(localStorage.getItem(x.key)===null&&x.raw!==null)localStorage.setItem(x.key,x.raw);
  throw error;
 }
}
export type PersonalSnapshot={field:Field;raw:string|null};
const active=(uid:string,field:Field)=>!field.diary||journalCloudConsent(uid);
export function journalCloudConsent(uid:string):boolean{
 return Boolean(uid)&&localStorage.getItem(CONSENT(uid))==='true';
}
export function setJournalCloudConsent(uid:string,enabled:boolean){
 if(!uid.trim())throw new Error('ACCOUNT_REQUIRED');
 const key=CONSENT(uid),value=enabled?'true':'false';
 localStorage.setItem(key,value);
 if(localStorage.getItem(key)!==value)throw new Error('CONSENT_NOT_PERSISTED');
 window.dispatchEvent(new Event('li:private-sync-consent'));
}
/** Switching accounts never reveals previous account's private settings,
 * notes, diary or saved items; original local work survives in account backup.
 */
export function preparePersonalAccount(previous:string|null,uid:string){
 if(!previous||previous===uid)return;
 for(const field of PERSONAL_FIELDS){
  const raw=localStorage.getItem(field.key);
  if(raw!==null)localStorage.setItem(BACKUP(previous,field.key),raw);
 }
 for(const field of PERSONAL_FIELDS){
  const own=localStorage.getItem(BACKUP(uid,field.key));
  if(own===null)localStorage.removeItem(field.key);
  else localStorage.setItem(field.key,own);
 }
}
function unpack(payload:unknown,key:string):string{
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('PRIVATE_PAYLOAD_INVALID');
 const value=payload as Record<string,unknown>;
 if(value.schema!==SCHEMA||value.storageKey!==key||typeof value.raw!=='string')
  throw Error('PRIVATE_PAYLOAD_INVALID');
 if(key.startsWith(T12_PREFIX))assertT12(value.raw);
 if(key.startsWith(T02_PREFIX))assertT02(value.raw);
 if(key.startsWith(PRACTICE_PREFIX))assertPractice(value.raw);
 return value.raw;
}
function wrap(field:Field,raw:string):JsonValue{
 if(raw.length>300000)throw Error('PRIVATE_STATE_TOO_LARGE');
 if(field.key.startsWith(T12_PREFIX))assertT12(raw);
 if(field.key.startsWith(T02_PREFIX))assertT02(raw);
 if(field.key.startsWith(PRACTICE_PREFIX))assertPractice(raw);
 // Validate structured stores before replicating; preserve exact JSON strings.
 if(field.key!=='li.private.case-draft.v1'&&field.key!=='li.study-mode.v1'&&
   field.key!=='li.app.locale.v1'&&field.key!=='li.personal.daily.enabled.v1'&&
   field.id!=='journal-cloud-consent'){
  JSON.parse(raw);
 }
 return {schema:SCHEMA,storageKey:field.key,raw};
}
/** Decode only supported account-scoped personal records; no arbitrary browser key. */
export function personalRemoteSnapshot(uid:string,type:ItemType,id:string,payload:unknown):
 {key:string;raw:string}|null{
 const field=fieldsFor(uid).find(x=>x.type===type&&x.id===id);
 if(!field)return null;
 return {key:field.key,raw:unpack(payload,field.key)};
}
export function hasPersonalLocalChanges(uid:string,seen:Map<string,string|null>):boolean{
 return fieldsFor(uid).some(field=>active(uid,field)&&
  localStorage.getItem(field.key)!==(seen.get(field.key)??null));
}
export async function capturePersonalState(uid:string,api:CloudUserApi|null,
 store:PrivateDeviceStore,seen:Map<string,string|null>):Promise<PersonalSnapshot[]>{
 const snapshots:PersonalSnapshot[]=[];
 for(const field of fieldsFor(uid)){
  if(!active(uid,field))continue;
  const raw=localStorage.getItem(field.key);
  snapshots.push({field,raw});
  const firstObservation=!seen.has(field.key);
  const previous=seen.get(field.key)??null;
  seen.set(field.key,raw);
  const key=storageKey(uid,field.type,field.id);
  let current=await store.records.get(key);
  // Missing on the FIRST observation means a fresh device may need hydration.
  // Missing AFTER previously observing a saved value is an explicit removal:
  // queue a tombstone, never resurrect the deleted note from the cloud.
  if(raw===null){
   if(!firstObservation&&previous!==null&&current&&!current.deletedAt)
    await store.edit(uid,field.type,field.id,
     {schema:SCHEMA,storageKey:field.key,raw:''},new Date().toISOString());
   continue;
  }
  // The app defaults diary recording ON on a fresh device before Auth runs.
  // The signed account's already-downloaded preference takes precedence; if
  // real local diary work differs, retain BOTH versions as an explicit conflict.
  if(field.diary&&firstObservation&&current&&!current.deletedAt&&
     current.baseRevision>0&&!(await store.outbox.get(key))){
   const cloudRaw=unpack(current.payload,field.key);
   if(cloudRaw!==raw){
    const untouchedDefault=field.key==='li.personal.daily.enabled.v1'&&
     raw==='true'&&localStorage.getItem('li.personal.daily.v1')===null;
    if(untouchedDefault)continue; // hydrate signed preference, no spurious PUT
    await store.edit(uid,field.type,field.id,wrap(field,raw));
    const op=await store.outbox.get(key);
    if(op)await store.reject(uid,op); // no silent overwrite of real journal
    continue;
   }
  }
  if(!current&&api){
   try{
    const remote=await api.one(field.type,field.id);
    if(remote&&!remote.deleted_at){
     const remoteRaw=unpack(remote.payload,field.key);
     // Fresh installs of diary auto-create local 'enabled=true' before login.
     // Such a default must NEVER override the real cloud preference.
     const autoDefault=field.key==='li.personal.daily.enabled.v1'&&raw==='true'&&
      localStorage.getItem('li.personal.daily.v1')===null;
     if(remoteRaw===raw||autoDefault){
      await store.apply(uid,remote);
      current=await store.records.get(key);
      if(autoDefault)continue;
     }
    }
   }catch{/* Keep local draft; revision conflict prevents blind overwrite. */}
  }
  if(!current||current.deletedAt||unpack(current.payload,field.key)!==raw)
   await store.edit(uid,field.type,field.id,wrap(field,raw));
 }
 return snapshots;
}
export async function hydratePersonalState(uid:string,snapshots:PersonalSnapshot[],
 store:PrivateDeviceStore,retry:()=>void,onHydrated?:(key:string)=>void):Promise<boolean>{
 let changed=false;
 for(const {field,raw} of snapshots){
  if(!active(uid,field))continue;
  const key=storageKey(uid,field.type,field.id);
  if(await store.outbox.get(key))continue;
  const saved=await store.records.get(key);
  if(!saved)continue;
  const current=localStorage.getItem(field.key);
  if(current!==raw){retry();continue;}
  if(saved.deletedAt){
   if(current!==null){localStorage.removeItem(field.key);changed=true;onHydrated?.(field.key);}
   continue;
  }
  const data=unpack(saved.payload,field.key);
  if(current!==data){localStorage.setItem(field.key,data);changed=true;onHydrated?.(field.key);}
 }
 return changed;
}
