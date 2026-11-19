import {bindNeonAccount} from '../sync/neon-session.js';
import {checkInviteAccess} from '../sync/invite-access.js';
import {RevisionConflict,type JsonValue} from '../sync/contract.js';
import {NEON_DATA_API_URL,AUTH_ORIGIN,IS_GITHUB_STAGING} from './config.js';
import {neonSessionPort} from './neon-client.js';
import {isBlankNativeAttempt} from './native-progress.js';

/**
 * Step16 staging integration. Signed-in invited user -> existing owner-RLS Neon
 * Data API -> the THREE published native lesson attempts. No diary/notes.
 * All writes are account-bound, revision-checked, and verified on readback.
 * Offline/local conflicts are retained, never overwritten or silently deleted.
 */
const LESSONS=['L03-1-2','L09-1-2','L15-2-2'] as const;
const OWNER='li.sync.local-owner.v1';
const KEY=(id:string)=>'li.review.'+id+'.v1';
const CHECKPOINT=(uid:string,id:string)=>'li.sync.checkpoint.v1:'+uid+':'+id;
const BACKUP=(uid:string,id:string)=>'li.sync.local-backup.v1:'+uid+':'+id;
type Checkpoint={revision:number;data:string};
export type SyncReport='checking'|'saved'|'empty'|'offline'|'conflict'|'error';

function canonical(value:unknown):string{
 if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 const obj=value as Record<string,unknown>;
 return '{'+Object.keys(obj).sort().map(k=>JSON.stringify(k)+':'+canonical(obj[k])).join(',')+'}';
}
function attempt(raw:string|null):Record<string,unknown>|null{
 if(raw===null)return null;
 if(raw.length>60000)throw Error('LOCAL_ATTEMPT_TOO_LARGE');
 const value:unknown=JSON.parse(raw);
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_LOCAL_ATTEMPT');
 const v=value as Record<string,unknown>;
 if(!Array.isArray(v.draft)||v.draft.length!==4||!v.draft.every(a=>typeof a==='string'&&a.length<=4000)||
   !Array.isArray(v.ratings)||v.ratings.length!==4)throw Error('INVALID_LOCAL_ATTEMPT');
 return v;
}
function cloud(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_CLOUD_ATTEMPT');
 const p=value as Record<string,unknown>;
 if(p.schema!=='li.native.lesson.v1'||!p.data||typeof p.data!=='object'||Array.isArray(p.data))
  throw Error('INVALID_CLOUD_ATTEMPT');
 const data=p.data as Record<string,unknown>;
 attempt(JSON.stringify(data)); // Validate before hydrating private local state.
 return data;
}
function readCheckpoint(uid:string,id:string):Checkpoint|null{
 try{
  const raw=localStorage.getItem(CHECKPOINT(uid,id));
  if(!raw)return null;
  const p=JSON.parse(raw) as Checkpoint;
  return Number.isSafeInteger(p?.revision)&&p.revision>=1&&typeof p.data==='string'?p:null;
 }catch{return null;}
}
function checkpoint(uid:string,id:string,revision:number,data:Record<string,unknown>){
 if(!Number.isSafeInteger(revision)||revision<1)throw Error('BAD_REMOTE_REVISION');
 const expected=JSON.stringify({revision,data:canonical(data)});
 localStorage.setItem(CHECKPOINT(uid,id),expected);
 if(localStorage.getItem(CHECKPOINT(uid,id))!==expected)throw Error('LOCAL_STORAGE_UNAVAILABLE');
}

/** Preserve another invited account's local attempts before showing this account. */
export function prepareLearnerAccount(uid:string):boolean{
 if(!IS_GITHUB_STAGING||location.origin!==AUTH_ORIGIN||!uid.trim())throw Error('UNTRUSTED_ACCOUNT');
 const before=localStorage.getItem(OWNER);
 if(before===uid)return false;
 if(before){
  // Snapshot every previous lesson first; failure aborts without deleting data.
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
 // First invited account adopts existing local learning created by older builds.
 localStorage.setItem(OWNER,uid);
 if(localStorage.getItem(OWNER)!==uid)throw Error('LOCAL_STORAGE_UNAVAILABLE');
 return before!==null; // reload native in-memory lesson state after account switch.
}
export function startLearnerSync(uid:string,onStatus:(value:SyncReport)=>void):()=>void{
 if(!IS_GITHUB_STAGING||location.origin!==AUTH_ORIGIN)throw Error('UNTRUSTED_ORIGIN');
 let disposed=false,busy=false,pending=false,refreshTimer:ReturnType<typeof setTimeout>|null=null;
 const report=(value:SyncReport)=>{if(!disposed)onStatus(value);};
 async function run(){
  if(disposed)return;
  if(busy){pending=true;return;}
  if(!navigator.onLine){report('offline');return;}
  busy=true;report('checking');
  let restored=false,hadRows=false,conflicted=false;
  try{
   if(localStorage.getItem(OWNER)!==uid)throw Error('ACCOUNT_CHANGED');
   if(!await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort))throw Error('INVITE_REVOKED');
   const api=await bindNeonAccount(NEON_DATA_API_URL,neonSessionPort);
   if(!api||api.accountId!==uid)throw Error('SESSION_CHANGED');
   for(const id of LESSONS){
    if(disposed)break;
    const key=KEY(id);
    const raw=localStorage.getItem(key),local=attempt(raw);
    const remote=await api.one('lesson_attempt',id);
    if(disposed)break;
    if(remote?.deleted_at){conflicted=true;continue;} // never resurrect deletions
    const rdata=remote?cloud(remote.payload):null;
    const saved=readCheckpoint(uid,id);
    if(local&&rdata&&canonical(local)===canonical(rdata)){
     checkpoint(uid,id,remote!.revision,rdata);
     hadRows=true;continue;
    }
    if(remote&&rdata){
     if(!local||isBlankNativeAttempt(local)||(saved&&saved.revision<remote.revision&&saved.data===canonical(local))){
      if(localStorage.getItem(key)!==raw){pending=true;continue;}
      localStorage.setItem(key,JSON.stringify(rdata));
      checkpoint(uid,id,remote.revision,rdata);
      hadRows=true;restored=true;continue;
     }
     if(!saved||saved.revision!==remote.revision){conflicted=true;continue;}
    }else if(saved){conflicted=true;continue;}
    if(!local||isBlankNativeAttempt(local))continue;
    if(localStorage.getItem(key)!==raw){pending=true;continue;}
    const next=await api.write({
     itemType:'lesson_attempt',itemId:id,baseRevision:remote?.revision??0,
     payload:{schema:'li.native.lesson.v1',data:local as Record<string,JsonValue>},
     deletedAt:null,opId:crypto.randomUUID()
    });
    const verified=await api.one('lesson_attempt',id);
    if(!verified||verified.revision!==next.revision||
       canonical(cloud(verified.payload))!==canonical(local))throw Error('REMOTE_READBACK_FAILED');
    checkpoint(uid,id,verified.revision,local);
    hadRows=true;
   }
   report(conflicted?'conflict':hadRows?'saved':'empty');
   if(restored&&!disposed){
    // Existing native lesson scripts initialized before account hydration.
    window.location.reload();
   }
  }catch(e){
   if(e instanceof RevisionConflict)report('conflict');
   else report(navigator.onLine?'error':'offline');
  }finally{
   busy=false;
   if(pending&&!disposed){pending=false;schedule();}
  }
 }
 function schedule(){
  if(disposed)return;
  if(refreshTimer!==null)clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>{refreshTimer=null;void run();},850);
 }
 function changed(e:Event){
  const target=e.target;
  if(!(target instanceof Element))return;
  if(target.closest('#page-lessonL03,#page-lessonL09,#page-lessonL15'))schedule();
 }
 const resumed=()=>schedule();
 document.addEventListener('input',changed);
 document.addEventListener('change',changed);
 document.addEventListener('click',changed);
 window.addEventListener('focus',resumed);
 window.addEventListener('online',resumed);
 window.addEventListener('li:lesson-submitted',resumed);
 void run();
 return()=>{
  disposed=true;
  if(refreshTimer!==null)clearTimeout(refreshTimer);
  document.removeEventListener('input',changed);
  document.removeEventListener('change',changed);
  document.removeEventListener('click',changed);
  window.removeEventListener('focus',resumed);
  window.removeEventListener('online',resumed);
  window.removeEventListener('li:lesson-submitted',resumed);
 };
}
