import React,{useEffect,useState} from 'react';
import {checkInviteAccess,safeInviteErrorCode} from '../sync/invite-access.js';
import {authClient,neonSessionPort} from './neon-client.js';
import {AUTH_ORIGIN,NEON_DATA_API_URL,IS_GITHUB_STAGING} from './config.js';
import {classifyOAuthReturn,type OAuthReturnCode} from './oauth-return.js';
import {rememberOfflineInvite,recentOfflineOwner,forgetOfflineInvite} from './offline-local.js';
import {RlsQaPanel} from './RlsQaPanel.js';
import {SyncQaPanel} from './SyncQaPanel.js';
import {prepareLearnerAccount,startLearnerSync,journalCloudConsent,changeJournalCloudConsent,
 listPrivateConflicts,resolvePrivateConflict,type PrivateConflictChoice,type SyncReport} from './learner-sync.js';

type Locale='vi'|'en';
type Access='checking'|'granted'|'offline'|'denied'|'error';
const syncCopy={
 vi:{checking:'Đang kết nối tiến độ học với Neon…',saved:'Đã đồng bộ dữ liệu được phép lưu trên Neon.',empty:'Đã kết nối Neon. Tiến độ sẽ tự đồng bộ khi học.',queued:'Đã lưu, chờ đồng bộ với Neon.',offline:'Đang offline; tiến độ vẫn lưu trên máy và sẽ thử lại.',conflict:'Hai thiết bị có tiến độ khác nhau. Dữ liệu được giữ, chưa ghi đè.',error:'Chưa đồng bộ được với Neon; tiến độ vẫn lưu trên máy.'},
 en:{checking:'Connecting learning progress to Neon…',saved:'Permitted personal data synced to Neon.',empty:'Connected to Neon. Progress will sync while studying.',queued:'Saved, awaiting Neon sync.',offline:'Offline. Progress remains on device and will retry.',conflict:'Progress differs across devices. Both copies are preserved; nothing was overwritten.',error:'Cannot sync with Neon yet; device progress is preserved.'}
} as const;
const copy={
 vi:{
  heading:'Vào thư viện li.',tag:'Tài khoản học tập',
  intro:'Chỉ email được mời mới có thể vào li. Đăng nhập Google để học và đồng bộ tiến độ trên tài khoản.',
  google:'Tiếp tục với Google',logout:'Đăng xuất',busy:'Đang xử lý…',
  loading:'Đang kiểm tra phiên đăng nhập…',signed:'Đã đăng nhập với',
  checking:'Đang kiểm tra lời mời trên máy chủ…',
  granted:'Email đã được mời. Quyền truy cập được xác minh.',
  offline:'Đang học offline trên máy đã xác minh gần đây (tối đa 12 giờ). Lời mời sẽ được kiểm tra lại khi có mạng.',
  lockOffline:'Khóa quyền mở offline trên máy này',
  lockedOffline:'Đã khóa chế độ offline. Kết nối mạng để xác minh hoặc đăng xuất Google.',
  denied:'Chưa xác minh được quyền truy cập của tài khoản Google này. Kiểm tra đúng email được mời rồi liên hệ chủ li. nếu vẫn bị chặn.',
  blocked:'Không thể xác minh quyền truy cập. App vẫn khóa để bảo vệ dữ liệu.',
  inviteErrorCode:'Mã kiểm tra an toàn (không chứa dữ liệu riêng tư):',
  error:'Không thể kết nối Google lúc này. Kiểm tra mạng rồi thử lại.',
  oauthFailed:'Đăng nhập Google chưa hoàn tất. Mã lỗi an toàn:',
  oauthLink:'Email này có thể đã tồn tại trong Neon nhưng chưa được xác minh để liên kết Google. Chưa có phiên đăng nhập; không tự cấp quyền.',
  oauthState:'Google xác thực không hoàn tất qua chuyển hướng. Có thể do cookie trình duyệt hoặc trạng thái OAuth không khớp.',
  oauthSignup:'Neon không cho phép tạo hoặc liên kết tài khoản trong lần đăng nhập này.',
  oauthSession:'Google đã quay về nhưng Neon chưa tạo hoặc khôi phục được phiên đăng nhập. Dữ liệu học vẫn được bảo vệ.',
  oauthGeneric:'Google trả về lỗi đăng nhập. Không có quyền truy cập nào được cấp.',
  leave:'Không thể đăng xuất. Kiểm tra kết nối rồi thử lại.',
  local:'Chỉ lưu trên thiết bị · Đồng bộ cloud vẫn khóa',
  l09Local:'Tiến độ học được lưu trên máy và đồng bộ theo tài khoản khi Neon kết nối thành công.',
  privacy:'Google đăng nhập không tự cấp quyền xem dữ liệu. Quyền mời và dữ liệu cá nhân được kiểm tra tại Neon bằng RLS.',
  switchEn:'English',switchVi:'Tiếng Việt'
 },
 en:{
  heading:'Welcome to li.',tag:'Learning account',
  intro:'Only invited Google accounts may enter li. Sign in to study and sync progress to your account.',
  google:'Continue with Google',logout:'Sign out',busy:'Working…',
  loading:'Checking your sign-in session…',signed:'Signed in as',
  checking:'Checking your invitation with the server…',
  granted:'Invitation confirmed. This account is authorized.',
  offline:'Offline study on this recently verified device (up to 12 hours). Invitation will be rechecked online.',
  lockOffline:'Lock offline access on this device',
  lockedOffline:'Offline access locked. Reconnect to verify or sign out of Google.',
  denied:'This Google account is not authorized yet. Check the invited email and contact the owner if it should have access.',
  blocked:'Unable to verify invitation. App access remains locked to protect learner data.',
  inviteErrorCode:'Safe diagnostic code (contains no private data):',
  error:'Google sign-in is unavailable. Check the connection and try again.',
  oauthFailed:'Google sign-in did not finish. Safe error code:',
  oauthLink:'This email may match a pre-existing Neon account that cannot yet be linked to Google until its identity is verified. No session or invitation has been granted.',
  oauthState:'OAuth return state did not match. This can be caused by browser cookies or an interrupted redirect.',
  oauthSignup:'Neon refused to create or link this Google account in the current flow.',
  oauthSession:'Google returned, but Neon did not create or restore a sign-in session. Learner data remains protected.',
  oauthGeneric:'Google reported an authentication error. No app access was granted.',
  leave:'Sign-out failed. Check your connection and try again.',
  local:'Device-only storage · Cloud sync still disabled',
  l09Local:'Learning progress is saved locally and syncs to your account once Neon connects.',
  privacy:'Google authentication is not access approval. Neon RLS independently checks invitations and private data.',
  switchEn:'English',switchVi:'Tiếng Việt'
 }
} as const;

export function AuthPanel({onClose}:{onClose?:()=>void}={}){
 const [locale,setLocale]=useState<Locale>('vi');
 const t=copy[locale];
 const stageLabel=IS_GITHUB_STAGING?'理 · li.':t.tag;
 const showDeveloperQa=IS_GITHUB_STAGING&&new URLSearchParams(window.location.search).get('qa')==='1';
 const {data:session,isPending,error,refetch}=authClient.useSession();
 const [busy,setBusy]=useState<'login'|'logout'|null>(null);
 const [feedback,setFeedback]=useState('');
 const [access,setAccess]=useState<Access>('checking');
 const [inviteError,setInviteError]=useState('');
 const [accessEpoch,setAccessEpoch]=useState(0);
 const [isOffline,setIsOffline]=useState(!navigator.onLine);
 const liveAccountId=session?.user?.id??null;
 // Offline continuity is scoped to the previously invited local owner, not a JWT.
 const offlineId=recentOfflineOwner(isOffline);
 const accountId=liveAccountId??offlineId;
 const localOffline=isOffline&&Boolean(offlineId)&&accountId===offlineId;
 const [ownerReady,setOwnerReady]=useState(false);
 const [syncStatus,setSyncStatus]=useState<SyncReport>('checking');
 const [journalChoice,setJournalChoice]=useState(false);
 const [journalBusy,setJournalBusy]=useState(false);
 const [journalError,setJournalError]=useState('');
 const [conflicts,setConflicts]=useState<PrivateConflictChoice[]>([]);
 const [resolving,setResolving]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  if(syncStatus!=='conflict'||!accountId||!ownerReady){setConflicts([]);return;}
  void listPrivateConflicts(accountId).then(x=>{if(!cancelled)setConflicts(x);})
   .catch(()=>{if(!cancelled)setConflicts([]);});
  return()=>{cancelled=true;};
 },[syncStatus,accountId,ownerReady]);
 useEffect(()=>{setJournalChoice(Boolean(accountId)&&journalCloudConsent(accountId||''));},[accountId]);
 useEffect(()=>{
  const onCloudData=(event:Event)=>{
   const detail=(event as CustomEvent<{accountId?:string;keys?:string[]}>).detail;
   if(detail?.accountId===accountId&&accountId&&
      detail.keys?.includes('li.sync.journal-cloud-consent.v1:'+accountId))
    setJournalChoice(journalCloudConsent(accountId));
  };
  window.addEventListener('li:personal-sync-applied',onCloudData);
  return()=>window.removeEventListener('li:personal-sync-applied',onCloudData);
 },[accountId]);
 // Privacy consent is a DATA setting, never an authentication control.
 // Same verified invited owner, same remote revocation/tombstone path.
 useEffect(()=>{
  const card=document.getElementById('li-journal-cloud-settings');
  const checkbox=document.getElementById('li-journal-cloud-toggle') as HTMLInputElement|null;
  const detail=document.getElementById('li-journal-cloud-description');
  if(!card||!checkbox)return;
  const permitted=Boolean(IS_GITHUB_STAGING&&accountId&&access==='granted'&&ownerReady);
  card.hidden=!permitted;
  checkbox.disabled=!permitted||journalBusy;
  checkbox.checked=permitted&&journalChoice;
  if(detail&&permitted){
   const en=document.documentElement.lang==='en';
   detail.textContent=journalError||(journalBusy?(en?'Updating journal permission…':'Đang cập nhật quyền Nhật Ký…'):
    journalChoice?(en?'Private Journal & Check-ins are enabled for cloud sync.':
     'Nhật Ký & Check-in đang được phép đồng bộ lên Neon.'):
     (en?'Private by default: Journal and Check-ins stay on this device.':
      'Mặc định riêng tư: Nhật Ký & Check-in chỉ lưu trên thiết bị.')); 
  }
  const onChange=()=>void toggleJournalCloud(checkbox.checked);
  checkbox.addEventListener('change',onChange);
  return()=>checkbox.removeEventListener('change',onChange);
 },[accountId,access,ownerReady,journalChoice,journalBusy,journalError,locale]);

 // Do not reveal native lesson state from another invited account.
 // Local account ownership is prepared synchronously before the app is shown.
 useEffect(()=>{
  if(!accountId||(!localOffline&&(isPending||error))||
    !(access==='granted'&&!isOffline||access==='offline'&&localOffline)){
  setOwnerReady(false);return;
 }
  try{
   if(prepareLearnerAccount(accountId)){window.location.reload();return;}
   setOwnerReady(true);
  }catch{setOwnerReady(false);setSyncStatus('error');}
 },[accountId,isPending,error,access,localOffline,isOffline]);
 useEffect(()=>{
  if(!document.getElementById('li-staging-auth-root'))return;
  const permitted=Boolean(accountId)&&ownerReady&&
   ((access==='granted'&&!isOffline&&!isPending&&!error)||
    (access==='offline'&&localOffline));
  document.documentElement.classList.toggle('li-auth-verified',Boolean(permitted));
  if(!permitted)document.documentElement.classList.remove('li-account-open');
  return()=>{document.documentElement.classList.remove('li-auth-verified');};
 },[accountId,isPending,error,access,ownerReady,isOffline,localOffline]);
 // Persist a local time limit only AFTER the real invited account and local owner agree.
 useEffect(()=>{
  if(IS_GITHUB_STAGING&&!isOffline&&!isPending&&!error&&ownerReady&&
     liveAccountId&&access==='granted')rememberOfflineInvite(liveAccountId);
 },[isOffline,isPending,error,ownerReady,liveAccountId,access]);
 // Existing Dexie outbox captures offline edits without server writes.
 useEffect(()=>{
  if(!IS_GITHUB_STAGING||!ownerReady||!accountId||
    !(access==='granted'&&!isOffline||access==='offline'&&localOffline))return;
  setSyncStatus('checking');
  return startLearnerSync(accountId,value=>{
   setSyncStatus(value);
   window.dispatchEvent(new CustomEvent('li:learning-sync-report',{detail:{accountId,report:value}}));
   const status=document.getElementById('li-cloud-status');
   if(status)status.textContent=syncCopy[document.documentElement.lang==='en'?'en':'vi'][value];
  });
 },[accountId,ownerReady,access,isOffline,localOffline]);
 const oauthReturn=classifyOAuthReturn(window.location.search,Boolean(accountId),isPending);
 const oauthMessage=(code:OAuthReturnCode)=>code==='account_not_linked'?t.oauthLink:
  code==='state_mismatch'||code==='state_security_mismatch'||code==='no_callback_url'||code==='invalid_callback_request'?t.oauthState:
  code==='signup_disabled'||code==='unable_to_create_user'?t.oauthSignup:
  code==='unable_to_create_session'?t.oauthSession:t.oauthGeneric;

 // Recheck remote membership whenever an account returns to the app or the
 // network resumes. A revoked account must never keep a stale approved UI.
 useEffect(()=>{
  const refresh=()=>{
   if(document.visibilityState==='visible')setAccessEpoch(epoch=>epoch+1);
  };
  const network=()=>{setIsOffline(!navigator.onLine);setAccessEpoch(epoch=>epoch+1);};
  window.addEventListener('focus',refresh);
  window.addEventListener('online',network);
  window.addEventListener('offline',network);
  window.addEventListener('li:auth-recheck',refresh);
  document.addEventListener('visibilitychange',refresh);
  const expiry=setInterval(()=>{if(!navigator.onLine)setAccessEpoch(epoch=>epoch+1);},60000);
  return()=>{
   clearInterval(expiry);
   window.removeEventListener('focus',refresh);
   window.removeEventListener('online',network);
   window.removeEventListener('offline',network);
   window.removeEventListener('li:auth-recheck',refresh);
   document.removeEventListener('visibilitychange',refresh);
  };
 },[]);

 useEffect(()=>{
  let disposed=false;
  // A repeated offline focus/expiry check must NOT unmount an unfinished lesson.
  if(isOffline){
   setAccess(localOffline?'offline':'error');
   return()=>{disposed=true;};
  }
  setAccess('checking');
  setInviteError('');
  if(isPending)return()=>{disposed=true;};
  if(!liveAccountId){
   if(!error)forgetOfflineInvite(); // Completed online sign-out or no session.
   setAccess('error');
   return()=>{disposed=true;};
  }
  // A session is never an invitation. The RPC reads the verified identity in
  // neon_auth.user; its table RLS also independently denies all uninvited users.
  void (async()=>{
   try{
    // The server-backed invitation RPC verifies session↔JWT subject itself.
    // This auth-only pilot NEVER constructs a learner Data API adapter.
    const allowed=await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort);
    if(!disposed){
     if(!allowed)forgetOfflineInvite(); // Revocation or explicit denial.
     setAccess(allowed?'granted':'denied');
    }
   }catch(problem){
    if(!disposed){
     setInviteError(safeInviteErrorCode(problem));
     setAccess('error'); // Fail closed; NEVER infer access from email in React.
    }
   }
  })();
  return()=>{disposed=true;};
 },[liveAccountId,isOffline,isPending,Boolean(error),localOffline,accessEpoch]);

 async function toggleJournalCloud(enabled:boolean){
  if(!accountId||access!=='granted'||!ownerReady||journalBusy)return;
  setJournalBusy(true);setJournalError('');
  try{
   await changeJournalCloudConsent(accountId,enabled);
   setJournalChoice(enabled);
  }catch{
   setJournalError(locale==='vi'?'Chưa cập nhật được quyền đồng bộ Nhật Ký. Hãy thử lại.':
    'Could not update your journal sync permission. Try again.');
  }finally{setJournalBusy(false);}
 }
 async function decideConflict(c:PrivateConflictChoice,choice:'keep-local'|'use-remote'){
  if(!accountId||access!=='granted'||resolving)return;
  setResolving(true);setFeedback('');
  try{
   await resolvePrivateConflict(accountId,c.itemType,c.itemId,choice);
   setConflicts(list=>list.filter(x=>!(x.itemType===c.itemType&&x.itemId===c.itemId)));
   setSyncStatus('checking');
  }catch{
   setFeedback(locale==='vi'?'Chưa giải quyết được khác biệt. Hai bản vẫn được giữ lại.':
    'Could not resolve the difference. Both versions remain protected.');
  }finally{setResolving(false);}
 }
 async function signInGoogle(){
  if(busy)return;
  setBusy('login');setFeedback('');
  try{
   if(window.location.origin!==AUTH_ORIGIN)throw Error('UNTRUSTED_ORIGIN');
   // Only the exact trusted origin and current research path; never accept an
   // external redirect from query params or a user-entered email.
   const safePath=AUTH_ORIGIN+window.location.pathname;
   const callbackURL=safePath+'?pilot=auth&oauth=returned';
   const errorCallbackURL=safePath+'?pilot=auth&oauth=failed';
   const result=await authClient.signIn.social({provider:'google',callbackURL,errorCallbackURL});
   if(result.error)throw Error('GOOGLE_SIGN_IN_FAILED');
  }catch{setFeedback(t.error);}
  finally{setBusy(null);}
 }
 async function signOut(){
  if(busy)return;
  if(isOffline){
   forgetOfflineInvite();setAccess('error');setFeedback(t.lockedOffline);
   return;
  }
  setBusy('logout');setFeedback('');
  try{
   const result=await authClient.signOut();
   if(result.error)throw Error('SIGN_OUT_FAILED');
   forgetOfflineInvite();
   setAccess('checking');
   await refetch();
  }catch{setFeedback(t.leave);}
  finally{setBusy(null);}
 }
 return <main className="auth-pilot">
  <header className="auth-header">
   <div><p className="auth-tag">{stageLabel}</p><h1>{t.heading}</h1></div>
   <div className="auth-lang" aria-label="Language">
    <button type="button" aria-pressed={locale==='vi'} onClick={()=>setLocale('vi')}>{t.switchVi}</button>
    <button type="button" aria-pressed={locale==='en'} onClick={()=>setLocale('en')}>{t.switchEn}</button>
   </div>
  </header>
  <section className="auth-card" aria-busy={busy!==null||(Boolean(accountId)&&access==='checking')}>
   <p>{t.intro}</p>
   {isPending&&!localOffline&&<p role="status">{t.loading}</p>}
   {error&&!localOffline&&<p role="alert">{t.error}</p>}
   {(!isPending&&!error||localOffline)&&(accountId?
    <div className="auth-account" key={accountId}>
     <p>{localOffline?(locale==='vi'?'Bản học trên máy này':'This device’s learning copy'):t.signed}: <strong>{localOffline?'li.':session?.user?.email}</strong></p>
     {onClose&&(access==='granted'||access==='offline')&&<button type="button" className="qa-secondary" onClick={onClose}>{locale==='vi'?'Vào thư viện':'Return to library'}</button>}
     <p role={access==='denied'||access==='error'?'alert':'status'}>
      {access==='checking'?t.checking:access==='granted'?t.granted:
       access==='offline'?t.offline:access==='denied'?t.denied:t.blocked}
     </p>
     {access==='error'&&<p className="auth-error" role="status" data-invite-error-code={inviteError}>{t.inviteErrorCode} <strong>{inviteError||'INV-UNKNOWN'}</strong></p>}
     {access==='granted'&&syncStatus==='conflict'&&<section className="auth-privacy"
      aria-label={locale==='vi'?'Khác biệt giữa các thiết bị':'Device conflicts'}>
      <p><strong>{locale==='vi'?'Có dữ liệu khác nhau trên hai thiết bị':'Two versions differ'}</strong></p>
      <p>{locale==='vi'?
       'Không tự ghi đè ghi chép. Chọn bản muốn giữ cho từng mục; bản còn lại sẽ được thay thế sau khi đồng bộ.':
       'No silent overwrite. Choose which version to keep for each item; the other version is replaced after syncing.'}</p>
      {conflicts.map(c=><div key={c.itemType+':'+c.itemId}>
       <p>{c.label}</p>
       <button type="button" className="qa-secondary" disabled={resolving}
        onClick={()=>void decideConflict(c,'keep-local')}>{locale==='vi'?'Giữ bản trên máy này':'Keep this device'}</button>
       <button type="button" className="qa-secondary" disabled={resolving}
        onClick={()=>void decideConflict(c,'use-remote')}>{locale==='vi'?'Dùng bản trên Neon':'Use Neon version'}</button>
      </div>)}
     </section>}
     <button type="button" onClick={()=>void signOut()} disabled={busy!==null}>
      {busy?t.busy:localOffline?t.lockOffline:t.logout}
     </button>
    </div>:
    <div className="auth-sign-in">
     <button type="button" onClick={()=>void signInGoogle()} disabled={busy!==null}>
      {busy?t.busy:t.google}
     </button>
    </div>
   )}
   {!accountId&&oauthReturn&&<p className="auth-error" role="alert" data-oauth-return={oauthReturn.kind}>
    {oauthReturn.kind==='oauth-error'?<>{t.oauthFailed} <strong>{oauthReturn.code}</strong>. {oauthMessage(oauthReturn.code)}</>:t.oauthSession}
   </p>}
   {feedback&&<p className="auth-error" role="alert">{feedback}</p>}
   {showDeveloperQa&&accountId&&(access==='granted'||access==='denied')&&
    <RlsQaPanel uid={accountId} granted={access==='granted'}/>}
   {showDeveloperQa&&accountId&&access==='granted'&&
    <SyncQaPanel uid={accountId} locale={locale}/>}
   <p className="auth-local" role="status">{access==='offline'?syncCopy[locale].offline:IS_GITHUB_STAGING&&accountId&&access==='granted'?syncCopy[locale][syncStatus]:(IS_GITHUB_STAGING?t.l09Local:t.local)}</p>
   <p className="auth-privacy">{t.privacy}</p>
  </section>
 </main>;
}
