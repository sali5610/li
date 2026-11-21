import React,{useEffect,useState} from 'react';
import {IS_GITHUB_STAGING} from './config.js';

type Access={owner:boolean;enabledForMe:boolean;assignedEmail?:string|null;ready?:boolean};
export function AiOwnerControl({email,locale}:{email:string;locale:'vi'|'en'}){
 const vi=locale==='vi';
 const [access,setAccess]=useState<Access|null>(null);
 const [target,setTarget]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{
  if(IS_GITHUB_STAGING)return;
  let live=true;
  void fetch('/api/ai/access',{credentials:'same-origin',cache:'no-store'})
   .then(async r=>r.ok?await r.json() as Access:null)
   .then(value=>{if(live)setAccess(value);})
   .catch(()=>{if(live)setAccess(null);});
  return()=>{live=false;};
 },[email]);
 async function assign(next:string|null){
  if(!access?.owner||busy)return;
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/ai/assign',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:next})
   });
   const json=await response.json() as {assignedEmail?:string|null};
   if(!response.ok)throw Error('ASSIGN_FAILED');
   setAccess(a=>a?{...a,assignedEmail:json.assignedEmail??null,
    enabledForMe:json.assignedEmail===email.toLowerCase()}:a);
   setTarget('');
   setMessage(vi?'Đã cập nhật tài khoản được dùng AI.':'AI seat assignment updated.');
  }catch{
   setMessage(vi?'Chưa cập nhật được. Quyền AI không thay đổi.':
    'Assignment failed. AI access has not changed.');
  }finally{setBusy(false);}
 }
 if(IS_GITHUB_STAGING)return <section className="auth-privacy" role="note">
  <strong>{vi?'Lão Lý AI · một suất':'Elder Ly AI · one seat'}</strong>
  <p>{vi?'Bản staging chỉ xem trước; chuyển tài khoản cần Cloudflare backend được cấu hình và phát hành.':
   'Staging preview only. Assignment requires the configured, released Cloudflare backend.'}</p>
 </section>;
 if(!access?.owner)return null;
 return <section className="auth-privacy" aria-label={vi?'Quản lý quyền Lão Lý AI':'Manage Elder Ly AI'}>
  <strong>{vi?'Quản lý quyền Lão Lý AI':'Manage Elder Ly AI access'}</strong>
  <p>{vi?'Chỉ một email được dùng AI. Tắt hoặc đổi sang email Google khác đã được mời bất kỳ lúc nào.':
   'Only one invited Google email can use AI. You can disable or transfer the seat at any time.'}</p>
  <p>{vi?'Tài khoản đang có AI: ':'Current AI seat: '}
   <strong>{access.assignedEmail|| (vi?'Chưa cấp':'Unassigned')}</strong></p>
  <button type="button" className="qa-secondary" disabled={busy}
   onClick={()=>void assign(email)}>{vi?'Cấp AI cho tôi':'Assign AI to me'}</button>
  <label htmlFor="li-ai-transfer-email">{vi?'Chuyển sang email khác':'Transfer to another email'}</label>
  <input id="li-ai-transfer-email" type="email" autoComplete="off"
   maxLength={254} value={target} onChange={event=>setTarget(event.currentTarget.value)}
   placeholder="friend@example.com" disabled={busy}/>
  <button type="button" className="qa-secondary"
   disabled={busy||!target.trim()} onClick={()=>void assign(target)}>
   {vi?'Chuyển suất AI':'Transfer AI seat'}</button>
  <button type="button" className="qa-secondary" disabled={busy||!access.assignedEmail}
   onClick={()=>void assign(null)}>{vi?'Tắt AI cho tất cả':'Disable AI for everyone'}</button>
  {message&&<p role="status">{message}</p>}
  <p>{vi?'Đổi quyền không xóa bài học hoặc tiến độ. Người nhận chỉ dùng được AI khi đã đăng nhập và có lời mời Neon hợp lệ.':
   'Transferring AI does not erase progress. The recipient must have an authorized Neon invitation.'}</p>
 </section>;
}
