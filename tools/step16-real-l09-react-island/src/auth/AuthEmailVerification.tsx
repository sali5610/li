import React,{useState,type FormEvent} from 'react';
import {authClient} from './neon-client.js';
import {AUTH_ORIGIN} from './config.js';

type Locale='vi'|'en';
const messages={
 vi:{
  open:'Xác minh email test',title:'Xác minh quyền sở hữu email',
  email:'Email tài khoản đã tạo',code:'Mã OTP gửi tới email',
  send:'Gửi mã xác minh',verify:'Xác minh mã',busy:'Đang xử lý…',
  sent:'Nếu email thuộc tài khoản hợp lệ, mã xác minh sẽ được gửi. Kiểm tra hộp thư và spam.',
  done:'Đã gửi mã xác minh thành công. Quay lại đăng nhập bằng tài khoản của mình.',
  fail:'Không thể xử lý mã lúc này. Mã có thể hết hạn hoặc đã sử dụng.',
  note:'Chỉ nhập OTP trong app tại domain được tin cậy. Đừng gửi mã cho ChatGPT.',
  close:'Đóng'
 },
 en:{
  open:'Verify test email',title:'Verify email ownership',
  email:'Existing account email',code:'Email verification OTP',
  send:'Send verification code',verify:'Verify code',busy:'Working…',
  sent:'If the email belongs to an eligible account, a verification code will be sent. Check inbox and spam.',
  done:'Verification succeeded. Return to the sign-in form for your account.',
  fail:'Could not verify now. The code may be expired or already used.',
  note:'Enter OTP only in the app on the trusted domain. Never share it with ChatGPT.',
  close:'Close'
 }
} as const;
export function AuthEmailVerification({locale}:{locale:Locale}){
 const t=messages[locale];
 const [opened,setOpened]=useState(false);
 const [email,setEmail]=useState('');
 const [otp,setOtp]=useState('');
 const [sent,setSent]=useState(false);
 const [done,setDone]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 async function send(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||window.location.origin!==AUTH_ORIGIN)return;
  setBusy(true);setMessage('');
  try{
   const result=await authClient.emailOtp.sendVerificationOtp({
    email:email.trim(),type:'email-verification'
   });
   if(result.error)throw Error('EMAIL_OTP_SEND_FAILED');
   setSent(true);setMessage(t.sent);
  }catch{setMessage(t.fail);}
  finally{setBusy(false);}
 }
 async function verify(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||window.location.origin!==AUTH_ORIGIN)return;
  setBusy(true);setMessage('');
  try{
   const result=await authClient.emailOtp.verifyEmail({email:email.trim(),otp:otp.trim()});
   if(result.error)throw Error('EMAIL_OTP_VERIFY_FAILED');
   setDone(true);setOtp('');setMessage(t.done);
  }catch{setMessage(t.fail);}
  finally{setBusy(false);}
 }
 return <div className="auth-recovery">
  {!opened?<button type="button" onClick={()=>setOpened(true)}>{t.open}</button>:
   <section>
    <h2>{t.title}</h2>
    {!done&&<form onSubmit={event=>void send(event)}>
     <div className="auth-field"><label htmlFor="li-verify-email">{t.email}</label>
      <input id="li-verify-email" type="email" autoComplete="email" required disabled={busy||sent}
       value={email} onChange={event=>setEmail(event.target.value)}/></div>
     <button type="submit" disabled={busy||sent}>{busy?t.busy:t.send}</button>
    </form>}
    {sent&&!done&&<form onSubmit={event=>void verify(event)}>
     <div className="auth-field"><label htmlFor="li-email-otp">{t.code}</label>
      <input id="li-email-otp" type="text" inputMode="numeric" autoComplete="one-time-code"
       pattern="[0-9]{6}" maxLength={6} required disabled={busy} value={otp}
       onChange={event=>setOtp(event.target.value.replace(/[^0-9]/g,''))}/></div>
     <button type="submit" disabled={busy||otp.length!==6}>{busy?t.busy:t.verify}</button>
    </form>}
    {message&&<p role={done||sent?'status':'alert'}>{message}</p>}
    <p className="auth-privacy">{t.note}</p>
    <button type="button" disabled={busy} onClick={()=>{
     setOpened(false);setOtp('');setEmail('');setSent(false);setDone(false);setMessage('');
    }}>{t.close}</button>
   </section>}
 </div>;
}
