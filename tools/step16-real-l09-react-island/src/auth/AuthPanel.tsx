import React,{useEffect,useState} from 'react';
import {bindNeonAccount} from '../sync/neon-session.js';
import {checkInviteAccess} from '../sync/invite-access.js';
import {authClient,neonSessionPort} from './neon-client.js';
import {AUTH_ORIGIN,NEON_DATA_API_URL} from './config.js';

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
  denied:'Lối vào này chưa dành cho bạn. Hãy nhờ chủ li. cấp quyền cho đúng email Google.',
  blocked:'Không thể xác minh quyền truy cập. App vẫn khóa để bảo vệ dữ liệu.',
  error:'Không thể kết nối Google lúc này. Kiểm tra mạng rồi thử lại.',
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
  denied:'This entrance is not for you yet. Ask the owner to invite your Google email.',
  blocked:'Unable to verify invitation. App access remains locked to protect learner data.',
  error:'Google sign-in is unavailable. Check the connection and try again.',
  leave:'Sign-out failed. Check your connection and try again.',
  local:'Device-only storage · Cloud sync still disabled',
  privacy:'Google authentication is not access approval. Neon RLS independently checks invitations and private data.',
  switchEn:'English',switchVi:'Tiếng Việt'
 }
} as const;

export function AuthPanel({embedded=false}:{embedded?:boolean}={}){
 const [locale,setLocale]=useState<Locale>('vi');
 const t=copy[locale];
 const {data:session,isPending,error,refetch}=authClient.useSession();
 const [busy,setBusy]=useState<'login'|'logout'|null>(null);
 const [feedback,setFeedback]=useState('');
 const [access,setAccess]=useState<Access>('checking');
 const accountId=session?.user?.id??null;

 useEffect(()=>{
  let disposed=false;
  setAccess('checking');
  if(!accountId)return()=>{disposed=true;};
  // A session is never an invitation. The RPC reads the verified identity in
  // neon_auth.user; its table RLS also independently denies all uninvited users.
  void (async()=>{
   try{
    const api=await bindNeonAccount(NEON_DATA_API_URL,neonSessionPort);
    if(!api||api.accountId!==accountId)throw Error('ACCOUNT_BINDING_FAILED');
    const allowed=await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort);
    if(!disposed)setAccess(allowed?'granted':'denied');
   }catch{
    if(!disposed)setAccess('error'); // Fail closed; NEVER infer access from email in React.
   }
  })();
  return()=>{disposed=true;};
 },[accountId]);

 async function signInGoogle(){
  if(busy)return;
  setBusy('login');setFeedback('');
  try{
   if(window.location.origin!==AUTH_ORIGIN)throw Error('UNTRUSTED_ORIGIN');
   // Only the exact trusted origin and current research path; never accept an
   // external redirect from query params or a user-entered email.
   // Callback is always first-party; never accept an untrusted return URL from a query parameter.
   const callbackURL=AUTH_ORIGIN+window.location.pathname+(embedded?'?li-react=settings':'?pilot=auth');
   const result=await authClient.signIn.social({provider:'google',callbackURL});
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
 const view=<>
  <header className="auth-header">
   <div><p className="auth-tag">{t.tag}</p>{embedded?<h3>{t.heading}</h3>:<h1>{t.heading}</h1>}</div>
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
   {feedback&&<p className="auth-error" role="alert">{feedback}</p>}
   <p className="auth-local" role="status">{t.local}</p>
   <p className="auth-privacy">{t.privacy}</p>
  </section>
 </>;
 return embedded?<section className="li-settings-auth surface" aria-label={t.heading} data-settings-account>{view}</section>:
  <main className="auth-pilot">{view}</main>;
}
