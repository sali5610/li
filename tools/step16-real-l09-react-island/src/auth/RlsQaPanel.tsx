import React,{useEffect,useState} from 'react';
import {neonSessionPort} from './neon-client.js';
import {makeQaRun,validateQaRun,stepQa,cleanupOwnedQa,safeQaError,type QaRun} from './rls-qa-contract.js';
import {IS_GITHUB_STAGING} from './config.js';

const STORE='li_rls_qa_staging_v1';
function load():QaRun|null{
 try{return validateQaRun(JSON.parse(localStorage.getItem(STORE)||'null'));}
 catch{return null;}
}
const labels={
 start:'A · Tạo 2 bản ghi giả và kiểm tra JWT/anonymous',
 b:'B · Chặn đọc/sửa/xóa A rồi tạo dữ liệu giả của B',
 c:'C · Xác nhận không thể xem A/B hoặc tạo dữ liệu giả',
 'a-finish':'A · Chặn đọc/sửa/xóa B, thử giả mạo owner rồi dọn A',
 'b-finish':'B · Kiểm tra dữ liệu B còn nguyên và dọn B',
 done:'Hoàn tất và đã xác minh cleanup A/B/C'
} as const;
export function RlsQaPanel({uid,granted}:{uid:string;granted:boolean}){
 const [run,setRun]=useState<QaRun|null>(()=>IS_GITHUB_STAGING?load():null);
 const [busy,setBusy]=useState(false);
 const [code,setCode]=useState('');
 const save=(r:QaRun)=>{localStorage.setItem(STORE,JSON.stringify(r));setRun({...r});};
 useEffect(()=>{setCode('');},[uid]);
 if(!IS_GITHUB_STAGING||typeof window==='undefined'||
  window.location.origin!=='https://sali5610.github.io'||
  window.location.pathname!=='/li/auth-pilot/')return null;
 const phase=run?.phase??'start';
 const expected=phase==='start'?granted:
  phase==='b'?granted&&Boolean(run?.a)&&uid!==run?.a?.uid:
  phase==='c'?!granted&&Boolean(run?.a&&run?.b)&&uid!==run?.a?.uid&&uid!==run?.b?.uid:
  phase==='a-finish'?granted&&uid===run?.a?.uid:
  phase==='b-finish'?granted&&uid===run?.b?.uid:false;
 const owned=[run?.a,run?.b,run?.c].some(x=>x&&x.uid===uid&&!x.cleaned);
 const steps=run?.checks??[];
 async function execute(){
  if(busy||!expected||phase==='done')return;
  const r=run??makeQaRun();
  save(r);setBusy(true);setCode('');
  try{
   const session=await neonSessionPort.getSession();
   if(session.error||session.data?.user?.id!==uid)throw Error('QA-SESSION-BIND');
   await stepQa(r,{uid,invited:granted,getToken:()=>neonSessionPort.getJWTToken()},save);
  }catch(e){setCode(safeQaError(e));}
  finally{setBusy(false);}
 }
 async function cleanup(){
  if(busy||!run||!owned)return;
  setBusy(true);setCode('');
  try{
   await cleanupOwnedQa(run,{uid,invited:granted,getToken:()=>neonSessionPort.getJWTToken()},save);
  }catch(e){setCode(safeQaError(e));}
  finally{setBusy(false);}
 }
 return <section className="qa-panel" aria-label="Staging RLS QA" data-qa-phase={phase}>
  <h2>Kiểm thử RLS · STAGING ONLY</h2>
  <p>Chỉ dùng dữ liệu giả <code>__li_rls_qa_*</code>. Tài khoản A/B/C lần lượt đăng nhập trên cùng trình duyệt. Không lưu JWT, không bật đồng bộ học tập.</p>
  <p role="status"><strong>Bước:</strong> {labels[phase]}</p>
  {run&&<p><strong>Đã đạt:</strong> {steps.length} kiểm tra. <strong>Cleanup:</strong> A {run.a?.cleaned?'xong':'chưa'} · B {run.b?.cleaned?'xong':'chưa'}.</p>}
  {phase==='done'?<p role="status">PASS · Hai tài khoản đã xác minh xóa dữ liệu giả. Kết quả chỉ áp dụng cho staging, không chứng minh sync production.</p>:
   <button type="button" disabled={busy||!expected} onClick={()=>void execute()}>
    {busy?'Đang kiểm tra…':expected?'Chạy bước này':'Đổi đúng tài khoản để chạy bước tiếp'}
   </button>}
  {owned&&run&&<button className="qa-secondary" type="button" disabled={busy} onClick={()=>void cleanup()}>
   Dọn dữ liệu giả của tài khoản này
  </button>}
  {phase==='done'&&<button className="qa-secondary" type="button" disabled={busy} onClick={()=>{localStorage.removeItem(STORE);setRun(null);setCode('');}}>Xóa báo cáo QA cục bộ</button>}
  {code&&<p role="alert" className="auth-error">QA chưa hoàn tất: <strong>{code}</strong>. Không đổi tài khoản trước khi kiểm tra cleanup.</p>}
  <p className="auth-privacy">Mỗi thao tác có nút xác nhận. Nếu thoát giữa chừng, quay lại bằng tài khoản còn dữ liệu giả để bấm Dọn. Không gửi email, JWT hay cookie cho AI.</p>
 </section>;
}
