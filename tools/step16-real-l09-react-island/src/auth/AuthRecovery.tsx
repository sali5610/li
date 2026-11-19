import React,{useState,type FormEvent} from 'react';
import {authClient} from './neon-client.js';
import {AUTH_ORIGIN} from './config.js';

type Locale='vi'|'en';
const copy={
 vi:{
  start:'Thiết lập / đặt lại mật khẩu',back:'Quay lại đăng nhập',
  heading:'Nhận email đặt mật khẩu',email:'Email tài khoản đã được mời',
  request:'Gửi hướng dẫn',sent:'Nếu tài khoản hợp lệ, Neon sẽ gửi hướng dẫn vào email. Hãy kiểm tra cả thư rác.',
  resetHeading:'Đặt mật khẩu mới',newPassword:'Mật khẩu mới (ít nhất 12 ký tự)',
  confirmation:'Nhập lại mật khẩu',confirm:'Xác nhận mật khẩu',
  mismatch:'Hai mật khẩu chưa khớp hoặc chưa đủ 12 ký tự.',
  updated:'Đã gửi yêu cầu thay mật khẩu thành công. Hãy quay lại đăng nhập; xác minh email vẫn có thể được yêu cầu.',
  failed:'Không thể hoàn tất yêu cầu lúc này. Kiểm tra kết nối rồi thử lại.',
  missing:'Liên kết đặt mật khẩu không hợp lệ hoặc đã hết hạn. Hãy yêu cầu email mới.',
  working:'Đang xử lý…',
  note:'Không gửi mật khẩu, mã OTP hoặc link có token vào ChatGPT, GitHub hay Notion.'
 },
 en:{
  start:'Set up / reset password',back:'Back to sign in',
  heading:'Get a password setup email',email:'Invited account email',
  request:'Send instructions',sent:'If the account is eligible, Neon will send instructions. Please check your inbox and spam.',
  resetHeading:'Set a new password',newPassword:'New password (at least 12 characters)',
  confirmation:'Repeat password',confirm:'Set password',
  mismatch:'Passwords must match and contain at least 12 characters.',
  updated:'Password reset request succeeded. Return to sign in; email verification may still be required.',
  failed:'Could not complete the request. Check your connection and try again.',
  missing:'Invalid or expired reset link. Request a new email.',
  working:'Working…',
  note:'Never share passwords, OTPs or reset links with ChatGPT, GitHub or Notion.'
 }
} as const;

// Reset tokens are one-time secrets: keep in component memory, strip from the
// browser URL immediately, and never log, persist or place them in an outbox.
function readResetToken():string|null{
 const url=new URL(window.location.href);
 if(url.searchParams.get('pilot')!=='auth'||url.searchParams.get('mode')!=='reset')return null;
 const token=url.searchParams.get('token');
 url.searchParams.delete('token');
 window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);
 return token||null;
}
export function AuthRecovery({locale}:{locale:Locale}){
 const t=copy[locale];
 const [token,setToken]=useState<string|null>(readResetToken);
 const [mode,setMode]=useState<'login'|'request'|'reset'>(()=>
   new URLSearchParams(window.location.search).get('mode')==='reset'?'reset':'login');
 const [email,setEmail]=useState('');
 const [newPassword,setNewPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [success,setSuccess]=useState(false);
 function choose(next:'login'|'request'){
  setMode(next);setFeedback('');setSuccess(false);setNewPassword('');setConfirm('');
  if(next==='login')setToken(null);
 }
 async function request(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||window.location.origin!==AUTH_ORIGIN)return;
  setBusy(true);setFeedback('');
  try{
   // Redirect is a fixed trusted origin, never supplied by user input.
   const result=await authClient.requestPasswordReset({
    email:email.trim(),redirectTo:AUTH_ORIGIN+'/?pilot=auth&mode=reset'
   });
   if(result.error)throw new Error('RESET_REQUEST_FAILED');
   setSuccess(true);setFeedback(t.sent);
  }catch{setSuccess(false);setFeedback(t.failed);}
  finally{setBusy(false);}
 }
 async function reset(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||window.location.origin!==AUTH_ORIGIN)return;
  if(!token){setFeedback(t.missing);return;}
  if(newPassword.length<12||newPassword!==confirm){setFeedback(t.mismatch);return;}
  setBusy(true);setFeedback('');
  try{
   const result=await authClient.resetPassword({token,newPassword});
   if(result.error)throw new Error('RESET_FAILED');
   setSuccess(true);setFeedback(t.updated);
   setToken(null);setNewPassword('');setConfirm('');
  }catch{setSuccess(false);setFeedback(t.failed);}
  finally{setBusy(false);}
 }
 return <div className="auth-recovery">
  {mode==='login'?<button type="button" onClick={()=>choose('request')}>{t.start}</button>:
   <section>
    <h2>{mode==='request'?t.heading:t.resetHeading}</h2>
    {mode==='request'?<form onSubmit={event=>void request(event)}>
     <div className="auth-field">
      <label htmlFor="li-recovery-email">{t.email}</label>
      <input id="li-recovery-email" type="email" autoComplete="email" required
       disabled={busy} value={email} onChange={event=>setEmail(event.target.value)}/>
     </div>
     <button type="submit" disabled={busy}>{busy?t.working:t.request}</button>
    </form>:
    token?<form onSubmit={event=>void reset(event)}>
     <div className="auth-field"><label htmlFor="li-new-password">{t.newPassword}</label>
      <input id="li-new-password" type="password" autoComplete="new-password"
       minLength={12} required disabled={busy} value={newPassword}
       onChange={event=>setNewPassword(event.target.value)}/></div>
     <div className="auth-field"><label htmlFor="li-confirm-password">{t.confirmation}</label>
      <input id="li-confirm-password" type="password" autoComplete="new-password"
       minLength={12} required disabled={busy} value={confirm}
       onChange={event=>setConfirm(event.target.value)}/></div>
     <button type="submit" disabled={busy}>{busy?t.working:t.confirm}</button>
    </form>:<p role="status">{success?t.updated:t.missing}</p>}
    {feedback&&<p role={success?'status':'alert'}>{feedback}</p>}
    <button type="button" onClick={()=>choose('login')} disabled={busy}>{t.back}</button>
    <p className="auth-privacy">{t.note}</p>
   </section>}
 </div>;
}
