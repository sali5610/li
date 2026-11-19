import React,{useEffect,useState,type FormEvent} from 'react';
import {bindNeonAccount} from '../sync/neon-session.js';
import {authClient,neonSessionPort} from './neon-client.js';
import {NEON_DATA_API_URL} from './config.js';

type Locale='vi'|'en';
const copy={
 vi:{
  heading:'Tài khoản học tập',tag:'Bản thử nghiệm · chưa phát hành',
  intro:'Đăng nhập chỉ dành cho tài khoản được mời. Dữ liệu học vẫn lưu trên thiết bị; đồng bộ cloud đang khóa.',
  email:'Email',password:'Mật khẩu',login:'Đăng nhập',logout:'Đăng xuất',
  loading:'Đang kiểm tra phiên đăng nhập…',
  busy:'Đang xử lý…',
  signed:'Đã đăng nhập với',ready:'Phiên đã liên kết đúng tài khoản.',
  verifying:'Đang xác minh liên kết tài khoản…',blocked:'Không thể xác minh tài khoản. Dữ liệu không được đồng bộ.',
  error:'Không thể xác thực lúc này. Kiểm tra phiên đăng nhập hoặc kết nối mạng rồi thử lại.',
  invalid:'Đăng nhập chưa thành công. Kiểm tra email và mật khẩu.',
  leave:'Không thể đăng xuất. Kiểm tra kết nối mạng rồi thử lại.',
  local:'Chỉ lưu trên thiết bị · Chưa đồng bộ cloud',
  privacy:'Chưa đọc/ghi Neon Data API, chưa cấp quyền upload bài học, ghi chú hoặc nhật ký.',
  switchEn:'English',switchVi:'Tiếng Việt'
 },
 en:{
  heading:'Learning account',tag:'Research pilot · not released',
  intro:'Sign-in is invite-only. Learning data remains on this device; cloud sync is disabled.',
  email:'Email',password:'Password',login:'Sign in',logout:'Sign out',
  loading:'Checking your sign-in session…',
  busy:'Working…',
  signed:'Signed in as',ready:'Session bound to this account.',
  verifying:'Verifying account binding…',blocked:'Could not verify account binding. No data can sync.',
  error:'Authentication is unavailable. Check your session or connection and try again.',
  invalid:'Sign-in failed. Check the email address and password.',
  leave:'Sign-out failed. Check your connection and try again.',
  local:'Device-only storage · Cloud sync disabled',
  privacy:'No Neon Data API reads or writes, no permission to upload lessons, notes, or private journal.',
  switchEn:'English',switchVi:'Tiếng Việt'
 }
} as const;

export function AuthPanel(){
 const [locale,setLocale]=useState<Locale>('vi');
 const t=copy[locale];
 const {data:session,isPending,error,refetch}=authClient.useSession();
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [busy,setBusy]=useState<'login'|'logout'|null>(null);
 const [feedback,setFeedback]=useState('');
 const [boundAccount,setBoundAccount]=useState<string|null>(null);
 const [bindingError,setBindingError]=useState(false);
 const accountId=session?.user?.id??null;
 useEffect(()=>{
  let disposed=false;
  setBoundAccount(null);
  setBindingError(false);
  if(!accountId)return()=>{disposed=true;};
  // Binding ONLY checks account ID via Auth. It never queries Neon Data API.
  void bindNeonAccount(NEON_DATA_API_URL,neonSessionPort)
   .then(api=>{if(!disposed){
    if(api?.accountId===accountId)setBoundAccount(accountId);
    else setBindingError(true);
   }})
   .catch(()=>{if(!disposed)setBindingError(true);});
  return()=>{disposed=true;};
 },[accountId]);
 async function signIn(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  setBusy('login');setFeedback('');
  try{
   const result=await authClient.signIn.email({email:email.trim(),password});
   if(result.error){setFeedback(t.invalid);return;}
   setPassword('');
   await refetch();
  }catch{setFeedback(t.error);}
  finally{setBusy(null);}
 }
 async function signOut(){
  if(busy)return;
  setBusy('logout');setFeedback('');
  try{
   const result=await authClient.signOut();
   if(result.error){setFeedback(t.leave);return;}
   setPassword('');setEmail('');
   setBoundAccount(null);
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
  <section className="auth-card" aria-busy={busy!==null}>
   <p>{t.intro}</p>
   {isPending&&<p role="status">{t.loading}</p>}
   {error&&<p role="alert">{t.error}</p>}
   {!isPending&&!error&&(accountId?
    <div className="auth-account" key={accountId}>
     <p>{t.signed}: <strong>{session?.user?.email}</strong></p>
     <p role="status">{bindingError?t.blocked:boundAccount===accountId?t.ready:t.verifying}</p>
     <button type="button" onClick={()=>void signOut()} disabled={busy!==null}>
      {busy?t.busy:t.logout}
     </button>
    </div>:
    <form onSubmit={event=>void signIn(event)}>
     <div className="auth-field">
      <label htmlFor="li-auth-email">{t.email}</label>
      <input id="li-auth-email" type="email" autoComplete="username" required
       value={email} onChange={event=>setEmail(event.target.value)}
       disabled={busy!==null} />
     </div>
     <div className="auth-field">
      <label htmlFor="li-auth-password">{t.password}</label>
      <input id="li-auth-password" type="password" autoComplete="current-password" required
       value={password} onChange={event=>setPassword(event.target.value)}
       disabled={busy!==null} />
     </div>
     <button type="submit" disabled={busy!==null}>{busy?t.busy:t.login}</button>
    </form>
   ))}
   {feedback&&<p className="auth-error" role="alert">{feedback}</p>}
   <p className="auth-local" role="status">{t.local}</p>
   <p className="auth-privacy">{t.privacy}</p>
  </section>
 </main>;
}
