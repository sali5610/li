import React,{useState} from 'react';
import {Button,Card,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';
import {neonSessionPort} from './neon-client.js';
import {AUTH_ORIGIN,NEON_DATA_API_URL,IS_GITHUB_STAGING} from './config.js';
import {runSignedReceiptCanary,type ReceiptCanaryResult} from '../sync/receipt-canary.js';

// Visibility is opted in with a URL query on the EXISTING invited staging app.
// This is not a second route, onboarding flow, or production setting.
const canaryEnabled=IS_GITHUB_STAGING&&
 typeof window!=='undefined'&&window.location.origin===AUTH_ORIGIN&&
 new URLSearchParams(window.location.search).get('sync161')==='1';
export function ReceiptCanaryPanel(){
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<ReceiptCanaryResult|null>(null);
 if(!canaryEnabled)return null;
 const english=document.documentElement.lang==='en';
 const say=(vi:string,en:string)=>english?en:vi;
 const start=async()=>{
  if(busy||!document.documentElement.classList.contains('li-auth-verified'))return;
  setBusy(true);setResult(null);
  try{
   setResult(await runSignedReceiptCanary(NEON_DATA_API_URL,neonSessionPort));
  }catch{setResult({outcome:'fail',stage:'client',code:'CANARY_UNEXPECTED',cleanup:'unconfirmed'});}
  finally{setBusy(false);}
 };
 return <Card variant="tinted" className="li-sync161-canary">
  <div className="kicker">{say('CHỈ STAGING · KIỂM TRA NỘI BỘ','STAGING ONLY · INTERNAL CHECK')}</div>
  <Heading level={3} role="titleMedium">{say('Kiểm tra an toàn đồng bộ #161','Sync safety check #161')}</Heading>
  <Text role="support">{say(
   'Một lần bấm sẽ dùng tài khoản Google đang đăng nhập để ghi một bản ghi thử ngẫu nhiên, kiểm tra gửi lại cùng mã opId và xóa bản ghi thử. Không đụng bài học, Nhật Ký hay ghi chép. Receipt kiểm toán vẫn được giữ trên Neon.',
   'One click uses your current signed Google session to write a random test-only record, replay the exact opId, then delete the test record. Lessons, Journal and notes are untouched. Audit receipts remain in Neon.'
  )}</Text>
  <Button variant="secondary" disabled={busy} onClick={()=>void start()}>
   {busy?say('Đang kiểm tra…','Checking…'):say('Kiểm tra RPC một lần','Run one RPC check')}
  </Button>
  {result&&<InlineFeedback tone={result.outcome==='pass'&&result.cleanup==='done'?'success':'error'}
   message={result.outcome==='pass'&&result.cleanup==='done'?
    say('PASS · Ghi/replay INSERT và UPDATE đều đúng, bản ghi thử đã dọn.',
     'PASS · INSERT/UPDATE replay verified and the test record was cleaned up.'):
    say('Chưa PASS · Mã an toàn: ','Not passed · Safe code: ')+result.code+
     ' · '+say('Bước ','Stage ')+result.stage+
     ' · '+say('Dọn dữ liệu: ','Cleanup: ')+result.cleanup}/>}
 </Card>;
}
