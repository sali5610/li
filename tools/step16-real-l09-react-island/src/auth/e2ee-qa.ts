/**
 * Signed Google OAuth / Neon Data API E2EE smoke, on an ISOLATED Neon branch.
 * Never imports the learner app, never uses localStorage/IndexedDB, never
 * scans existing private rows or sends real notes. This page is NOT a PWA.
 */
import {createInternalNeonAuth,type ReactBetterAuthClient} from '@neondatabase/auth';
import {BetterAuthReactAdapter} from '@neondatabase/auth/react/adapters';
import {fetchSignedNeonJwt,checkInviteAccess} from '../sync/invite-access.js';
import {bindNeonAccount} from '../sync/neon-session.js';
import type {NeonAuthSessionPort} from '../sync/neon-session.js';
import {createVault,canonical} from '../sync/e2ee-vault.js';
import type {Vault,VaultManifest} from '../sync/e2ee-vault.js';
import {readVaultManifest,registerVault,recoverVault,SealedNeonUserApi} from '../sync/e2ee-cloud.js';

// Hard-code only PUBLIC Neon QA branch endpoints, NEVER real app/project endpoints.
// Branch is disposable and has a scheduled expiration. Auth may be issued only
// by the official Neon provider; fake JWTs are rejected server-side.
const QA_AUTH='https://ep-delicate-firefly-azsbs1xb.neonauth.c-3.ap-southeast-1.aws.neon.tech/li/auth';
const QA_API='https://ep-delicate-firefly-azsbs1xb.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1';
const QA_URL='https://sali5610.github.io/li/e2ee-qa/';
const QA_PREFIX='__li_e2ee_qa_';
const QA_MESSAGE='Đây chỉ là ghi chú giả dùng để kiểm thử E2EE.';
const QA_SCHEMA='li.e2ee.qa.synthetic.v1';

const element=(id:string)=>{const x=document.getElementById(id);if(!x)throw Error('QA_UI_MISSING');return x;};
const input=(id:string)=>(element(id) as HTMLInputElement);
const button=(id:string)=>(element(id) as HTMLButtonElement);
const output=(message:string,error=false)=>{
 const node=element('qa-status');
 node.textContent=message;
 node.setAttribute('data-state',error?'error':'ok');
};
const safeError=(error:unknown)=>{
 const code=error instanceof Error?error.message:'QA_UNKNOWN';
 if(code==='QA_AUTH_REQUIRED')return 'Hãy đăng nhập Google trên Neon QA branch trước.';
 if(code==='QA_NOT_INVITED')return 'Tài khoản chưa được duyệt trên Neon branch thử nghiệm.';
 if(code==='QA_KEYBAG_EXISTS')return 'Branch này đã có khóa thử nghiệm; dùng recovery code đã lưu.';
 if(code==='E2EE_UNLOCK_FAILED')return 'Recovery code không hợp lệ hoặc sai tài khoản.';
 if(code==='QA_TEST_ROW_NOT_FOUND')return 'Không tìm thấy ghi chú giả với ID này.';
 if(code==='QA_VERIFY_FAILED')return 'Không thể xác nhận nội dung mã hóa từ Neon.';
 if(code.startsWith('NEON_AUTH_JWT_')||code.startsWith('INVITE_')||
    code.startsWith('NEON_DATA_API_')||code.startsWith('E2EE_'))
  return 'Lỗi bảo mật/đồng bộ ('+code.replace(/[^A-Z0-9_]/g,'')+'). Chưa có PASS.';
 return 'Chưa xác nhận được E2EE. Không thao tác trên dữ liệu production.';
};
const auth=createInternalNeonAuth(QA_AUTH,{
 adapter:BetterAuthReactAdapter(),allowAnonymous:false
}).adapter as unknown as ReactBetterAuthClient;
const sessionPort:NeonAuthSessionPort={
 async getSession(){
  const res=await auth.getSession();
  return {data:res.data?.user?{user:{id:res.data.user.id}}:null,error:res.error??undefined};
 },
 async getJWTToken(){return fetchSignedNeonJwt(QA_AUTH);}
};
type CloudApi=NonNullable<Awaited<ReturnType<typeof bindNeonAccount>>>;
type Generated={accountId:string;manifest:VaultManifest;vault:Vault;recoveryCode:string;id:string};
let generated:Generated|null=null;
let activeAction=false;
async function run(task:()=>Promise<void>){
 if(activeAction)return;
 activeAction=true;
 document.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);
 try{await task();}
 catch(err){output(safeError(err),true);}
 finally{
  activeAction=false;
  document.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=false);
  button('qa-save').disabled=!generated||!input('qa-confirm-save').checked;
 }
}
async function signedApi():Promise<CloudApi>{
 const session=await auth.getSession();
 if(!session.data?.user?.id)throw Error('QA_AUTH_REQUIRED');
 const allowed=await checkInviteAccess(QA_API,sessionPort);
 if(!allowed)throw Error('QA_NOT_INVITED');
 const api=await bindNeonAccount(QA_API,sessionPort);
 if(!api||api.accountId!==session.data.user.id)throw Error('QA_AUTH_REQUIRED');
 return api;
}
async function refreshSession(){
 const api=await signedApi();
 element('qa-account').textContent='Đã xác thực qua Google + Neon QA Data API (JWT ký thật, RLS được kiểm tra).';
 button('qa-generate').disabled=false;
 output('SIGNED_AUTH_QA_READY · Chỉ dữ liệu giả, chưa ghi gì.');
 // No account ID/email/JWT is displayed or logged.
 void api;
}
async function googleLogin(){
 // Never accept arbitrary origins, callback URLs or branch endpoints from input.
 const result=await auth.signIn.social({provider:'google',
  callbackURL:QA_URL,errorCallbackURL:QA_URL+'?oauth=failed'});
 if(result.error)throw Error('QA_AUTH_REQUIRED');
}
async function createTestVault(){
 const api=await signedApi();
 if(await readVaultManifest(api))throw Error('QA_KEYBAG_EXISTS');
 const password=input('qa-password').value;
 const result=await createVault(api.accountId,password);
 const id=QA_PREFIX+crypto.randomUUID();
 generated={accountId:api.accountId,manifest:result.manifest,vault:result.vault,
  recoveryCode:result.recoveryCode,id};
 // Show once, in DOM only. Never persist in localStorage/IDB/URL/analytics.
 input('qa-recovery-created').value=result.recoveryCode;
 input('qa-item-created').value=id;
 input('qa-password').value='';
 input('qa-confirm-save').checked=false;
 button('qa-save').disabled=true;
 output('Khóa chỉ ở bộ nhớ máy. Hãy cất recovery code rồi xác nhận lưu ghi chú giả.');
}
async function writeSyntheticNote(){
 const item=generated;
 if(!item||!input('qa-confirm-save').checked)return;
 const api=await signedApi();
 if(item.accountId!==api.accountId)throw Error('E2EE_ACCOUNT_OR_ITEM_MISMATCH');
 const keybag=await readVaultManifest(api);
 if(!keybag)await registerVault(api,item.manifest);
 else if(canonical(keybag)!==canonical(item.manifest))throw Error('QA_KEYBAG_EXISTS');
 const secured=new SealedNeonUserApi(api,item.vault);
 const payload={schema:QA_SCHEMA,marker:item.id,message:QA_MESSAGE};
 const old=await api.one('note',item.id);
 if(!old){
  await secured.write({itemType:'note',itemId:item.id,baseRevision:0,
   deletedAt:null,payload,opId:crypto.randomUUID()});
 }
 const raw=await api.one('note',item.id);
 const readable=await secured.one('note',item.id);
 if(!raw||!readable||raw.payload===null||
    (raw.payload as {schema?:string}).schema!=='li.e2ee.payload.v1'||
    JSON.stringify(raw.payload).includes(QA_MESSAGE)||
    canonical(readable.payload)!==canonical(payload))
  throw Error('QA_VERIFY_FAILED');
 output('SIGNED_NEON_ENCRYPTED_WRITE_PASS · Neon chỉ nhận ciphertext. Mở thiết bị khác và dùng recovery code + ID.');
}
async function readFromOtherDevice(){
 const api=await signedApi();
 const code=input('qa-recovery-input').value.trim();
 const id=input('qa-item-input').value.trim();
 if(!/^__li_e2ee_qa_[0-9a-f-]{36}$/.test(id))throw Error('QA_TEST_ROW_NOT_FOUND');
 const manifest=await readVaultManifest(api);
 if(!manifest)throw Error('QA_TEST_ROW_NOT_FOUND');
 const vault=await recoverVault(manifest,api.accountId,code);
 const raw=await api.one('note',id);
 const note=await new SealedNeonUserApi(api,vault).one('note',id);
 const data=note?.payload;
 if(!raw||!note||(raw.payload as {schema?:string})?.schema!=='li.e2ee.payload.v1'||
   typeof data!=='object'||data===null||Array.isArray(data)||
   data.schema!==QA_SCHEMA||data.marker!==id||data.message!==QA_MESSAGE)
  throw Error('QA_VERIFY_FAILED');
 input('qa-recovery-input').value='';
 output('SIGNED_NEON_CROSS_DEVICE_RECOVERY_PASS · Đọc được ghi chú giả bằng khóa khôi phục; máy chủ chỉ lưu ciphertext.');
}
function init(){
 if(location.origin!=='https://sali5610.github.io'||location.pathname!=='/li/e2ee-qa/'){
  output('QA_ORIGIN_BLOCKED · Không đăng nhập hoặc gửi dữ liệu tại origin này.',true);
  return;
 }
 button('qa-login').addEventListener('click',()=>void run(googleLogin));
 button('qa-refresh').addEventListener('click',()=>void run(refreshSession));
 button('qa-generate').addEventListener('click',()=>void run(createTestVault));
 button('qa-save').addEventListener('click',()=>void run(writeSyntheticNote));
 input('qa-confirm-save').addEventListener('change',()=>{button('qa-save').disabled=
  !generated||!input('qa-confirm-save').checked;});
 button('qa-recover').addEventListener('click',()=>void run(readFromOtherDevice));
 if(new URLSearchParams(location.search).has('oauth'))history.replaceState(null,'',QA_URL);
 void run(refreshSession);
}
init();
