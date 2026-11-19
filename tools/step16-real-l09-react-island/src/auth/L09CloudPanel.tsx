import React,{useState} from 'react';
import {L09StorageBridge,initial,type Attempt} from '../native-bridge.js';
import {bindNeonAccount} from '../sync/neon-session.js';
import {RevisionConflict} from '../sync/contract.js';
import {checkInviteAccess} from '../sync/invite-access.js';
import {neonSessionPort} from './neon-client.js';
import {AUTH_ORIGIN,IS_GITHUB_STAGING,NEON_DATA_API_URL} from './config.js';

/** Manual account-bound progress transfer: ONLY L09 React on GitHub Pages staging.
 * Never modify native L09 progress; never upload without an explicit click.
 */
const ITEM_ID='L09-1-2-react-staging-v1';
const META_PREFIX='li.step16.l09.cloud-revision.v1:';
type Payload={schema:'li.step16.l09.react.v1';attempt:Attempt};
type Locale='vi'|'en';
type Message={kind:'info'|'error'|'success';value:string};
const copy={
 vi:{
  title:'Tiến độ L09 · học tiếp trên thiết bị khác',
  about:'Đồng bộ riêng bài tập L09 bằng React. Ghi chú và các bài khác vẫn chỉ ở thiết bị này.',
  consent:'Chỉ khi bấm Lưu lên cloud, câu trả lời mới được gửi đến Neon theo tài khoản Google đã xác minh.',
  localEmpty:'Máy này chưa có câu trả lời React L09.',
  draft:'Câu đủ điều kiện nộp',rated:'Tiêu chí đã tự đánh giá',
  remoteUnknown:'Cloud: chưa kiểm tra',remoteReady:'Cloud: có tiến độ',remoteEmpty:'Cloud: chưa có tiến độ',
  inspect:'Kiểm tra cloud',save:'Lưu tiến độ lên cloud',restore:'Khôi phục về máy này',
  replace:'Đồng ý thay bản L09 đang có trên máy này',
  back:'Trở lại app và học L09',working:'Đang xử lý…',
  noLocal:'Chưa có tiến độ L09 để lưu.',noRemote:'Cloud chưa có tiến độ.',
  saved:'Đã lưu và đọc lại thành công trên Neon.',unchanged:'Máy này và cloud đã giống nhau.',
  restored:'Đã khôi phục. Mở lại L09 để học tiếp.',
  confirm:'Máy này đã có bản khác. Hãy tick đồng ý thay trước.',
  conflict:'Cloud đã thay đổi trên thiết bị khác. Hãy kiểm tra và khôi phục trước, không ghi đè âm thầm.',
  invalid:'Dữ liệu L09 không hợp lệ; không thay đổi gì.',
  access:'Phiên đăng nhập hoặc quyền mời không còn hợp lệ.',failure:'Không thể đồng bộ. Tiến độ cũ vẫn được giữ.',
  scope:'STAGING · Đồng bộ thủ công một bài L09, chưa phải toàn app.'
 },
 en:{
  title:'L09 progress · continue on another device',
  about:'Syncs only the React L09 exercise. Other lessons and notes remain on this device.',
  consent:'Your answers go to Neon under your verified Google account only when you click Save to cloud.',
  localEmpty:'No L09 React answers on this device.',
  draft:'Submission-ready answers',rated:'Self-review criteria rated',
  remoteUnknown:'Cloud: not checked',remoteReady:'Cloud: has progress',remoteEmpty:'Cloud: no progress',
  inspect:'Check cloud',save:'Save progress to cloud',restore:'Restore to this device',
  replace:'I agree to replace existing L09 progress on this device',
  back:'Return to the app and L09',working:'Working…',
  noLocal:'No local L09 progress to save.',noRemote:'No cloud progress to restore.',
  saved:'Saved to Neon and verified with a fresh read.',unchanged:'Cloud and device already match.',
  restored:'Restored. Reopen L09 to continue.',
  confirm:'This device has different progress. Confirm replacement first.',
  conflict:'Cloud changed on another device. Check and restore first; no silent overwrites.',
  invalid:'Invalid L09 progress; nothing was modified.',
  access:'Sign-in or invitation is no longer valid.',failure:'Sync failed. Existing device progress is preserved.',
  scope:'STAGING · Manual sync for L09 only, not the whole app.'
 }
} as const;
function attemptOk(v:unknown):v is Attempt{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 const a=v as Record<string,unknown>;
 const answers=(v:unknown)=>Array.isArray(v)&&v.length===4&&v.every(x=>typeof x==='string'&&x.length<=4000);
 const ratings=(v:unknown)=>Array.isArray(v)&&v.length===4&&v.every(x=>x===null||x===0||x===1||x===2);
 return (a.locale==='vi'||a.locale==='en')&&answers(a.draft)&&
  typeof a.guidedDraft==='string'&&a.guidedDraft.length<=4000&&
  typeof a.hint==='boolean'&&typeof a.assisted==='boolean'&&
  typeof a.submitted==='boolean'&&typeof a.reviewed==='boolean'&&
  (a.submittedAt===null||(typeof a.submittedAt==='string'&&a.submittedAt.length<=100))&&
  (a.submission===null||answers(a.submission))&&
  (a.submissionLocale===null||a.submissionLocale==='vi'||a.submissionLocale==='en')&&
  ratings(a.ratings)&&(!a.reviewed||a.submitted)&&(!a.submitted||a.submission!==null);
}
function clean(a:Attempt):Attempt{
 return{locale:a.locale,draft:[...a.draft],guidedDraft:a.guidedDraft,hint:a.hint,
  assisted:a.assisted,submitted:a.submitted,submittedAt:a.submittedAt,
  submission:a.submission?[...a.submission]:null,submissionLocale:a.submissionLocale,
  ratings:[...a.ratings],reviewed:a.reviewed};
}
function parsePayload(input:unknown):Payload|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const v=input as Record<string,unknown>;
 return v.schema==='li.step16.l09.react.v1'&&attemptOk(v.attempt)?
  {schema:'li.step16.l09.react.v1',attempt:clean(v.attempt)}:null;
}
function hasProgress(a:Attempt){
 return a.submitted||a.reviewed||a.guidedDraft.trim().length>0||a.draft.some(x=>x.trim().length>0);
}
function equal(a:Attempt,b:Attempt){return JSON.stringify(clean(a))===JSON.stringify(clean(b));}
function local(){return new L09StorageBridge(localStorage,window.location).read();}
function checkpoint(uid:string):number|null{
 const s=localStorage.getItem(META_PREFIX+uid);
 if(s===null)return null;
 const n=Number(s);return Number.isSafeInteger(n)&&n>0?n:null;
}
function saveCheckpoint(uid:string,n:number){
 localStorage.setItem(META_PREFIX+uid,String(n));
 if(localStorage.getItem(META_PREFIX+uid)!==String(n))throw Error('CHECKPOINT_FAILED');
}
async function getApi(uid:string){
 if(!IS_GITHUB_STAGING||window.location.origin!==AUTH_ORIGIN||
  window.location.pathname!=='/li/auth-pilot/')throw Error('WRONG_ORIGIN');
 if(!await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort))throw Error('INVITE_REVOKED');
 const api=await bindNeonAccount(NEON_DATA_API_URL,neonSessionPort);
 if(!api||api.accountId!==uid)throw Error('SESSION_CHANGED');
 return api;
}
export function L09CloudPanel({uid,locale}:{uid:string;locale:Locale}){
 const t=copy[locale];
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState<Message|null>(null);
 const [remote,setRemote]=useState<'unknown'|'empty'|'saved'>('unknown');
 const [replace,setReplace]=useState(false);
 const [version,setVersion]=useState(0);
 let current:ReturnType<typeof local>|null=null;
 try{current=local();}catch{/* Restricted storage: no uploads. */}
 const state=current?.state??initial();
 const good=Boolean(current&&!current.invalid&&attemptOk(state));
 const ready=good&&current?.raw!==null&&hasProgress(state);
 void version;
 async function run(action:'check'|'save'|'restore'){
  if(busy)return;
  setBusy(true);setMessage(null);
  try{
   const api=await getApi(uid);
   const record=await api.one('lesson_attempt',ITEM_ID);
   const payload=record&&!record.deleted_at?parsePayload(record.payload):null;
   if(record&&!record.deleted_at&&!payload)throw Error('INVALID_DATA');
   const cloud=payload&&record?{payload,revision:record.revision}:null;
   setRemote(cloud?'saved':'empty');
   if(action==='check'){
    setMessage({kind:'info',value:cloud?t.remoteReady:t.remoteEmpty});
   }else if(action==='save'){
    const from=local();
    if(from.invalid||!attemptOk(from.state))throw Error('INVALID_DATA');
    if(from.raw===null||!hasProgress(from.state))throw Error('NO_LOCAL');
    const next=clean(from.state);
    if(cloud){
     if(equal(next,cloud.payload.attempt)){
      saveCheckpoint(uid,cloud.revision);
      setMessage({kind:'success',value:t.unchanged});
      return;
     }
     if(checkpoint(uid)!==cloud.revision)throw new RevisionConflict();
    }else if(checkpoint(uid)!==null)throw new RevisionConflict();
    if(local().raw!==from.raw)throw Error('STALE_LOCAL');
    const result=await api.write({
     itemType:'lesson_attempt',itemId:ITEM_ID,baseRevision:cloud?.revision??0,
     payload:{schema:'li.step16.l09.react.v1',attempt:next},
     deletedAt:null,opId:crypto.randomUUID()
    });
    const verified=await api.one('lesson_attempt',ITEM_ID);
    const confirmed=parsePayload(verified?.payload);
    if(!verified||verified.revision!==result.revision||!confirmed||
      !equal(confirmed.attempt,next))throw Error('SAVE_NOT_CONFIRMED');
    saveCheckpoint(uid,result.revision);
    setRemote('saved');
    setMessage({kind:'success',value:t.saved});
   }else{
    if(!cloud)throw Error('NO_REMOTE');
    const from=local();
    if(from.invalid||!attemptOk(from.state))throw Error('INVALID_DATA');
    if(from.raw!==null&&!equal(from.state,cloud.payload.attempt)&&!replace)
      throw Error('CONFIRM_REPLACE');
    const bridge=new L09StorageBridge(localStorage,window.location);
    bridge.write(cloud.payload.attempt,from.raw);
    if(!equal(local().state,cloud.payload.attempt))throw Error('RESTORE_NOT_CONFIRMED');
    saveCheckpoint(uid,cloud.revision);
    setVersion(x=>x+1);setReplace(false);
    setMessage({kind:'success',value:t.restored});
   }
  }catch(error){
   const reason=error instanceof Error?error.message:'';
   setMessage({kind:'error',value:reason==='NO_LOCAL'?t.noLocal:
    reason==='NO_REMOTE'?t.noRemote:reason==='CONFIRM_REPLACE'?t.confirm:
    reason==='INVALID_DATA'?t.invalid:
    reason==='SESSION_CHANGED'||reason==='INVITE_REVOKED'||reason==='WRONG_ORIGIN'||reason.startsWith('NEON_AUTH_')?t.access:
    error instanceof RevisionConflict||reason==='STALE_LOCAL'?t.conflict:t.failure});
  }finally{setBusy(false);}
 }
 if(!IS_GITHUB_STAGING||window.location.origin!==AUTH_ORIGIN||
    window.location.pathname!=='/li/auth-pilot/')return null;
 return <section className="qa-panel" aria-label={t.title} data-l09-cloud="manual">
  <h2>{t.title}</h2>
  <p>{t.about}</p>
  <p>{ready?([t.draft,': ',state.draft.filter(x=>x.trim().length>=12).length,
   '/4 · ',t.rated,': ',state.ratings.filter(x=>x!==null).length,'/4'].join('')):t.localEmpty}</p>
  <p>{remote==='unknown'?t.remoteUnknown:remote==='saved'?t.remoteReady:t.remoteEmpty}</p>
  <p className="auth-privacy">{t.consent}</p>
  <button type="button" className="qa-secondary" disabled={busy} onClick={()=>void run('check')}>{busy?t.working:t.inspect}</button>
  <button type="button" disabled={busy||!ready} onClick={()=>void run('save')}>{busy?t.working:t.save}</button>
  <label className="l09-cloud-replace">
   <input type="checkbox" checked={replace} disabled={busy} onChange={e=>setReplace(e.target.checked)}/>
   <span>{t.replace}</span>
  </label>
  <button type="button" className="qa-secondary" disabled={busy} onClick={()=>void run('restore')}>{busy?t.working:t.restore}</button>
  {message&&<p role={message.kind==='error'?'alert':'status'} className={message.kind==='error'?'auth-error':undefined}>{message.value}</p>}
  <p><a href="../?li-react=l09">{t.back}</a></p>
  <p className="auth-privacy">{t.scope}</p>
 </section>;
}
