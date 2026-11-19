import React,{useEffect,useRef,useState} from 'react';
import {PrivateDeviceStore} from '../sync/local-dexie.js';
import {bindNeonAccount} from '../sync/neon-session.js';
import {neonSessionPort} from './neon-client.js';
import {IS_GITHUB_STAGING,NEON_DATA_API_URL} from './config.js';
import {SYNC_QA_DB,SYNC_QA_STORE,newSyncQaId,validateSyncQaId,seedDeviceA,
 deviceBRestoreAndEdit,deviceAConflictAndResolve,deviceBVerify,
 deleteRemoteQa,dropLocalQa,safeSyncQaError} from './sync-qa.js';

type Mode='a-starting'|'a-seeded'|'a-conflicting'|'a-resolved'|'a-verifying'|'a-done'|
 'b-starting'|'b-updated'|'b-verifying'|'b-verified'|'b-cleaning'|'b-done';
type State={id:string;mode:Mode};
const qaOrigin='https://sali5610.github.io';
function read():State|null{
 try{
  const x=JSON.parse(localStorage.getItem(SYNC_QA_STORE)||'null') as State|null;
  if(!x||!validateSyncQaId(x.id)||![
   'a-starting','a-seeded','a-conflicting','a-resolved','a-verifying','a-done',
   'b-starting','b-updated','b-verifying','b-verified','b-cleaning','b-done'
  ].includes(x.mode))return null;
  return x;
 }catch{return null;}
}
const wording={
 vi:{
  title:'Đồng bộ 2 thiết bị · STAGING ONLY',
  intro:'Chỉ thử trên một bản ghi giả và cơ sở IndexedDB QA riêng. Không đồng bộ dữ liệu học thật. Cả hai trình duyệt/thiết bị dùng CÙNG tài khoản Google được mời.',
  a:'Thiết bị A: tạo bản ghi giả → đồng bộ v1 → giữ bản sửa offline',
  b:'Thiết bị B: nhập mã A → khôi phục v1 → đồng bộ v2',
  aResolve:'Thiết bị A: phát hiện conflict → giữ chỉnh sửa offline → đồng bộ v3',
  bVerify:'Thiết bị B: đọc v3 được sửa từ A',
  bCleanup:'Thiết bị B: xóa bản ghi giả trên Neon và cục bộ',
  aVerify:'Thiết bị A: xác minh Neon trống và dọn dữ liệu QA cục bộ',
  abort:'Dừng QA và dọn bản ghi giả (nếu có)',
  clear:'Xóa báo cáo QA trên thiết bị này',
  code:'Mã bản ghi QA (không phải JWT)',
  input:'Dán mã bản ghi từ thiết bị A vào đây',
  send:'Chép mã để dùng trên thiết bị B',
  copied:'Đã chép mã',
  busy:'Đang kiểm tra…',
  error:'Chưa PASS:',
  status:'Trạng thái thiết bị này:',
  next:'Sau khi A tạo v1, dùng mã ở B; sau đó quay lại A giải conflict; B xác minh và dọn; A kiểm tra lần cuối.',
  note:'Không gửi token, cookie hoặc email. Mọi thao tác ghi Neon cần bấm nút. Nếu lỗi, dùng Dọn thay vì chạy tiếp.',
  done:'QA trên thiết bị này hoàn tất. Chỉ đóng gate toàn bộ khi cả A và B đã dọn và Neon xác nhận 0 bản ghi.'
 },
 en:{
  title:'Two-device sync · STAGING ONLY',
  intro:'Tests one synthetic record in a separate QA IndexedDB. No real learner data sync. Both devices/browsers must use the SAME invited Google account.',
  a:'Device A: create QA record → sync v1 → queue offline edit',
  b:'Device B: enter A code → restore v1 → sync v2',
  aResolve:'Device A: detect conflict → keep offline edit → sync v3',
  bVerify:'Device B: pull v3 written by A',
  bCleanup:'Device B: delete test row on Neon and locally',
  aVerify:'Device A: verify empty Neon row and clear local QA',
  abort:'Abort QA and clean synthetic record (if present)',
  clear:'Clear local QA report',
  code:'QA record code (NOT a JWT)',
  input:'Paste A record code on device B',
  send:'Copy code to device B',
  copied:'Code copied',
  busy:'Checking…',
  error:'Not passed:',
  status:'This device state:',
  next:'Create v1 on A, restore/edit on B, resolve conflict on A, verify and clean on B, then verify final cleanup on A.',
  note:'Never share tokens, cookies or emails. Neon writes require an explicit button. If an error occurs, clean up instead of advancing.',
  done:'This device finished QA. The overall gate closes only after both device cleanups and independent Neon zero-row verification.'
 }
} as const;
export function SyncQaPanel({uid,locale}:{uid:string;locale:'vi'|'en'}){
 const t=wording[locale];
 const storeRef=useRef<PrivateDeviceStore|null>(null);
 const [state,setState]=useState<State|null>(()=>IS_GITHUB_STAGING?read():null);
 const [codeInput,setCodeInput]=useState('');
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [copied,setCopied]=useState(false);
 useEffect(()=>{
  if(!IS_GITHUB_STAGING)return;
  const db=new PrivateDeviceStore(SYNC_QA_DB);
  storeRef.current=db;
  return()=>{db.close();if(storeRef.current===db)storeRef.current=null;};
 },[]);
 if(!IS_GITHUB_STAGING||window.location.origin!==qaOrigin||
  window.location.pathname!=='/li/auth-pilot/')return null;
 const save=(next:State|null)=>{
  if(next)localStorage.setItem(SYNC_QA_STORE,JSON.stringify(next));
  else localStorage.removeItem(SYNC_QA_STORE);
  setState(next);
 };
 const getApi=async()=>{
  const api=await bindNeonAccount(NEON_DATA_API_URL,neonSessionPort);
  if(!api||api.accountId!==uid)throw Error('SQA-SESSION-CHANGED');
  return api;
 };
 const getBound=async()=>{
  const session=await neonSessionPort.getSession();
  if(session.error||session.data?.user?.id!==uid)throw Error('SQA-SESSION-CHANGED');
  const token=await neonSessionPort.getJWTToken();
  if(!token||token.split('.').length!==3)throw Error('SQA-JWT-MISSING');
  let sub:unknown;
  try{sub=(JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))) as {sub?:unknown}).sub;}
  catch{throw Error('SQA-JWT-INVALID');}
  if(sub!==uid)throw Error('SQA-SESSION-CHANGED');
  return{accountId:uid,jwt:token};
 };
 async function execute(kind:'a'|'b'|'a-resolve'|'b-verify'|'b-clean'|'a-final'|'abort'){
  if(busy||!storeRef.current)return;
  setBusy(true);setFeedback('');
  const db=storeRef.current;
  try{
   const api=await getApi();
   let id=state?.id;
   if(kind==='a'){
    if(state)throw Error('SQA-EXISTING-RUN');
    id=newSyncQaId();save({id,mode:'a-starting'});
    await seedDeviceA(db,api,id);save({id,mode:'a-seeded'});
   }else if(kind==='b'){
    if(state)throw Error('SQA-EXISTING-RUN');
    if(!validateSyncQaId(codeInput.trim()))throw Error('SQA-INVALID-ID');
    id=codeInput.trim();save({id,mode:'b-starting'});
    await deviceBRestoreAndEdit(db,api,id);save({id,mode:'b-updated'});
   }else{
    if(!id)throw Error('SQA-INVALID-ID');
    if(kind==='a-resolve'){
     if(state?.mode!=='a-seeded')throw Error('SQA-INVALID-STAGE');
     save({id,mode:'a-conflicting'});
     await deviceAConflictAndResolve(db,api,id);save({id,mode:'a-resolved'});
    }else if(kind==='b-verify'){
     if(state?.mode!=='b-updated')throw Error('SQA-INVALID-STAGE');
     save({id,mode:'b-verifying'});
     await deviceBVerify(db,api,id);save({id,mode:'b-verified'});
    }else if(kind==='b-clean'){
     if(state?.mode!=='b-verified')throw Error('SQA-INVALID-STAGE');
     save({id,mode:'b-cleaning'});
     await deleteRemoteQa(api,id,getBound,NEON_DATA_API_URL);
     await dropLocalQa(db,uid,id);
     save({id,mode:'b-done'});
    }else if(kind==='a-final'){
     if(state?.mode!=='a-resolved')throw Error('SQA-INVALID-STAGE');
     save({id,mode:'a-verifying'});
     if(await api.one('preference',id)!==null)throw Error('SQA-REMOTE-STILL-PRESENT');
     await dropLocalQa(db,uid,id);
     save({id,mode:'a-done'});
    }else if(kind==='abort'){
     await deleteRemoteQa(api,id,getBound,NEON_DATA_API_URL);
     await dropLocalQa(db,uid,id);
     save(null);
    }
   }
  }catch(e){setFeedback(safeSyncQaError(e));}
  finally{setBusy(false);}
 }
 const mode=state?.mode;
 const done=mode==='a-done'||mode==='b-done';
 return <section className="qa-panel" aria-label={t.title} data-sync-qa-mode={mode||'idle'}>
  <h2>{t.title}</h2>
  <p>{t.intro}</p>
  {state&&<div className="auth-field">
    <label htmlFor="sync-qa-id">{t.code}</label>
    <input id="sync-qa-id" readOnly value={state.id} autoComplete="off"/>
    <button className="qa-secondary" type="button" disabled={busy}
     onClick={()=>{void navigator.clipboard.writeText(state.id).then(()=>setCopied(true),()=>setFeedback('SQA-COPY-FAILED'));}}>
     {copied?t.copied:t.send}
    </button>
  </div>}
  {!state&&<>
   <button type="button" disabled={busy} onClick={()=>void execute('a')}>{busy?t.busy:t.a}</button>
   <div className="auth-field">
    <label htmlFor="sync-qa-input">{t.input}</label>
    <input id="sync-qa-input" type="text" value={codeInput}
     onChange={e=>setCodeInput(e.target.value)} autoComplete="off" spellCheck={false}/>
    <button type="button" disabled={busy||!validateSyncQaId(codeInput.trim())}
     onClick={()=>void execute('b')}>{t.b}</button>
   </div>
  </>}
  {mode==='a-seeded'&&<button type="button" disabled={busy} onClick={()=>void execute('a-resolve')}>{t.aResolve}</button>}
  {mode==='b-updated'&&<button type="button" disabled={busy} onClick={()=>void execute('b-verify')}>{t.bVerify}</button>}
  {mode==='b-verified'&&<button type="button" disabled={busy} onClick={()=>void execute('b-clean')}>{t.bCleanup}</button>}
  {mode==='a-resolved'&&<button type="button" disabled={busy} onClick={()=>void execute('a-final')}>{t.aVerify}</button>}
  {state&&<p role="status"><strong>{t.status}</strong> {mode}</p>}
  {done&&<p role="status">{t.done}</p>}
  {state&&!done&&<button type="button" className="qa-secondary" disabled={busy}
   onClick={()=>void execute('abort')}>{t.abort}</button>}
  {done&&<button type="button" className="qa-secondary" disabled={busy}
   onClick={()=>{save(null);setFeedback('');setCopied(false);}}>{t.clear}</button>}
  {feedback&&<p role="alert" className="auth-error">{t.error} {feedback}</p>}
  <p className="auth-privacy">{t.next} {t.note}</p>
 </section>;
}
