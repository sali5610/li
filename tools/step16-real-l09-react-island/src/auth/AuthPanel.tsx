import React,{useEffect,useState} from 'react';
import {checkInviteAccess} from '../sync/invite-access.js';
import {authClient,neonSessionPort} from './neon-client.js';
import {AUTH_ORIGIN,NEON_DATA_API_URL} from './config.js';
import {classifyOAuthReturn,type OAuthReturnCode} from './oauth-return.js';

type Locale='vi'|'en';
type Access='checking'|'granted'|'denied'|'error';
const copy={
 vi:{
  heading:'Tài khoản học tập',tag:'Bản thử nghiệm · chưa phát hành',
  intro:'Chỉ những email được chủ li. mời mới được vào. Đăng nhập bằng Google, không cần tạo mật khẩu riêng.',
  google:'Tiếp tục với Google',logout:'Đăng xuất',busy:'Đang xử lý…',
  loading:'Đang kiểm tra phiên đăng nhập…',signed:'Đã đăng nhập với',
  checking:'Đang kiểm tra lời mời trên máy chủ…',
  granted:'Email đã được mời. Quyền truy cập được xác minh.',
  denied:'Chưa xác minh được quyền truy cập của tài khoản Google này. Kiểm tra đúng email được mời rồi liên hệ chủ li. nếu vẫn bị chặn.',
  blocked:'Không thể xác minh quyền truy cập. App vẫn khóa để bảo vệ dữ liệu.',
  error:'Không thể kết nối Google lúc này. Kiểm tra mạng rồi thử lại.',
  oauthFailed:'Đăng nhập Google chưa hoàn tất. Mã lỗi an toàn:',
  oauthLink:'Email này có thể đã tồn tại trong Neon nhưng chưa được xác minh để liên kết Google. Chưa có phiên đăng nhập; không tự cấp quyền.',
  oauthState:'Google xác thực không hoàn tất qua chuyển hướng. Có thể do cookie trình duyệt hoặc trạng thái OAuth không khớp.',
  oauthSignup:'Neon không cho phép tạo hoặc liên kết tài khoản trong lần đăng nhập này.',
  oauthSession:'Google đã quay về nhưng Neon chưa tạo hoặc khôi phục được phiên đăng nhập. Dữ liệu học vẫn được bảo vệ.',
  oauthGeneric:'Google trả về lỗi đăng nhập. Không có quyền truy cập nào được cấp.',
  leave:'Không thể đăng xuất. Kiểm tra kết nối rồi thử lại.',
  local:'Chỉ lưu trên thiết bị · Đồng bộ cloud vẫn khóa',
  privacy:'Google đăng nhập không tự cấp quyền xem dữ liệu. Quyền mời và dữ liệu cá nhân được kiểm tra tại Neon bằng RLS.',
  switchEn:'English',switchVi:'Tiếng Việt'
 },
 en:{
  heading:'Learning account',tag:'Research pilot · not released',
  intro:'Only emails invited by the li. owner may use the app. Sign in with Google; no separate password.',
  google:'Continue with Google',logout:'Sign out',busy:'Working…',
  loading:'Checking your sign-in session…',signed:'Signed in as',
  checking:'Checking your invitation with the server…',
  granted:'Invitation confirmed. This account is authorized.',
  denied:'This Google account is not authorized yet. Check the invited email and contact the owner if it should have access.',
  blocked:'Unable to verify invitation. App access remains locked to protect learner data.',
  error:'Google sign-in is unavailable. Check the connection and try again.',
  oauthFailed:'Google sign-in did not finish. Safe error code:',
  oauthLink:'This email may match a pre-existing Neon account that cannot yet be linked to Google until its identity is verified. No session or invitation has been granted.',
  oauthState:'OAuth return state did not match. This can be caused by browser cookies or an interrupted redirect.',
  oauthSignup:'Neon refused to create or link this Google account in the current flow.',
  oauthSession:'Google returned, but Neon did not create or restore a sign-in session. Learner data remains protected.',
  oauthGeneric:'Google reported an authentication error. No app access was granted.',
  leave:'Sign-out failed. Check your connection and try again.',
  local:'Device-only storage · Cloud sync still disabled',
  privacy:'Google authentication is not access approval. Neon RLS independently checks invitations and private data.',
  switchEn:'English',switchVi:'Tiếng Việt'
 }
} as const;

export function AuthPanel(){
 const [locale,setLocale]=useState<Locale>('vi');
 const t=copy[locale];
 const {data:session,isPending,error,refetch}=authClient.useSession();
 const [busy,setBusy]=useState<'login'|'logout'|null>(null);
 const [feedback,setFeedback]=useState('');
 const [access,setAccess]=useState<Access>('checking');
 const [accessEpoch,setAccessEpoch]=useState(0);
 const accountId=session?.user?.id??null;
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
  window.addEventListener('focus',refresh);
  window.addEventListener('online',refresh);
  document.addEventListener('visibilitychange',refresh);
  return()=>{
   window.removeEventListener('focus',refresh);
   window.removeEventListener('online',refresh);
   document.removeEventListener('visibilitychange',refresh);
  };
 },[]);

 useEffect(()=>{
  let disposed=false;
  setAccess('checking');
  if(!accountId)return()=>{disposed=true;};
  // A session is never an invitation. The RPC reads the verified identity in
  // neon_auth.user; its table RLS also independently denies all uninvited users.
  void (async()=>{
   try{
    // The server-backed invitation RPC verifies session↔JWT subject itself.
    // This auth-only pilot NEVER constructs a learner Data API adapter.
    const allowed=await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort);
    if(!disposed)setAccess(allowed?'granted':'denied');
   }catch{
    if(!disposed)setAccess('error'); // Fail closed; NEVER infer access from email in React.
   }
  })();
  return()=>{disposed=true;};
 },[accountId,accessEpoch]);

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
  setBusy('logout');setFeedback('');
  try{
   const result=await authClient.signOut();
   if(result.error)throw Error('SIGN_OUT_FAILED');
   setAccess('checking');
   await refetch();
  }catch{setFeedback(t.leave);}
  finally{setBusy(null);}
 }
 return <main className="auth-pilot">
  <header className="auth-header">
   <div><p className="auth-tag">{t.tag}</p><h1>{t.heading}</h1></div>
   <div className="auth-lang" aria-label="Language">
    <button type="button" aria-pressed={locale==='vi'} onClick={()=>setLocale('vi')}>{t.switchVi}</button>
    <button type="button" aria-pressed={locale==='en'} onClick={()=>setLocale('en')}>{t.switchEn}</button>
   </div>
  </header>
  <section className="auth-card" aria-busy={busy!==null||(Boolean(accountId)&&access==='checking')}>
   <p>{t.intro}</p>
   {isPending&&<p role="status">{t.loading}</p>}
   {error&&<p role="alert">{t.error}</p>}
   {!isPending&&!error&&(accountId?
    <div className="auth-account" key={accountId}>
     <p>{t.signed}: <strong>{session?.user?.email}</strong></p>
     <p role={access==='denied'||access==='error'?'alert':'status'}>
      {access==='checking'?t.checking:access==='granted'?t.granted:
       access==='denied'?t.denied:t.blocked}
     </p>
     <button type="button" onClick={()=>void signOut()} disabled={busy!==null}>
      {busy?t.busy:t.logout}
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
   <p className="auth-local" role="status">{t.local}</p>
   <p className="auth-privacy">{t.privacy}</p>
  </section>
 </main>;
}
