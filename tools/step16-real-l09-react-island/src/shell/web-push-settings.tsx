import React,{useEffect,useRef,useState} from 'react';
import {Button,Card,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';
import {readReminderPreference} from './in-app-reminder.js';
import {webPushApi,installedPushSupported,userAllowed,pushVapid,
 registerPush,updatePushSchedule,removePush} from './web-push-client.js';

function copy(vi:string,en:string){
 return (window as Window&{liLanguage?:{get?:()=>string}}).liLanguage?.get?.()==='en'?en:vi;
}
const pause=(ms:number)=>new Promise<void>(resolve=>window.setTimeout(resolve,ms));
// Diagnostics are intentionally bounded codes: never expose JWT, device endpoint,
// response bodies or account identifiers in UI or logs.
function safePushIssue(reason:unknown):string{
 const message=reason instanceof Error?reason.message:'';
 const backend=/^PUSH_BACKEND_(400|401|403|404|409|429|500|503)$/.exec(message);
 if(backend)return 'PUSH-'+backend[1];
 if(message==='PUSH_AUTH_REQUIRED'||message.startsWith('NEON_AUTH_JWT_'))
  return 'PUSH-AUTH';
 if(message==='PUSH_BACKEND_UNAVAILABLE')return 'PUSH-CONFIG';
 if(message==='PUSH_REMINDER_OFF')return 'PUSH-SCHEDULE';
 return 'PUSH-DEVICE-OR-NET';
}

export function WebPushSettings(){
 const [enabled,setEnabled]=useState(false);
 const [permissionGranted,setPermissionGranted]=useState(
  ()=>typeof Notification!=='undefined'&&Notification.permission==='granted');
 const [pending,setPending]=useState(false);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const operation=useRef(false);
 const api=webPushApi();

 useEffect(()=>{
  if(!api||!installedPushSupported()||!userAllowed())return;
  let alive=true,refreshing=false;
  const refresh=async()=>{
   if(!alive||operation.current||refreshing)return;
   refreshing=true;
   try{
    const granted=Notification.permission==='granted';
    if(!alive||operation.current)return;
    setPermissionGranted(granted);
    if(!granted){
     setEnabled(false);setPending(false);
     return;
    }
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.getSubscription();
    if(!alive||operation.current)return;
    if(!sub){
     setEnabled(false);
     return;
    }
    if(!navigator.onLine)throw Error('PUSH_OFFLINE');
    // A local Apple subscription is NOT the same as a successful server ACK.
    // Reconcile after permission changes/foregrounding without asking again.
    await updatePushSchedule(api,sub);
    if(!alive||operation.current)return;
    setEnabled(true);setPending(false);setError('');
   }catch(err){
    if(alive&&!operation.current&&Notification.permission==='granted'){
     setPermissionGranted(true);setEnabled(false);setPending(true);
     setError(copy(
      'iPhone đã cấp quyền, nhưng chưa lưu được đăng ký. Mở lại app khi có mạng để thử lại.',
      'iPhone granted permission, but registration is not saved yet. Reopen online to retry.')+
      ' ('+safePushIssue(err)+')');
    }
   }finally{refreshing=false;}
  };
  const eventRefresh=()=>{void refresh();};
  const visible=()=>{if(document.visibilityState==='visible')void refresh();};
  void refresh();
  window.addEventListener('li:reminder-preference-changed',eventRefresh);
  window.addEventListener('li:personal-sync-applied',eventRefresh);
  window.addEventListener('online',eventRefresh);
  window.addEventListener('focus',eventRefresh);
  document.addEventListener('visibilitychange',visible);
  return()=>{
   alive=false;
   window.removeEventListener('li:reminder-preference-changed',eventRefresh);
   window.removeEventListener('li:personal-sync-applied',eventRefresh);
   window.removeEventListener('online',eventRefresh);
   window.removeEventListener('focus',eventRefresh);
   document.removeEventListener('visibilitychange',visible);
  };
 },[api]);

 async function connectDevice(){
  if(!api)throw Error('PUSH_BACKEND_UNAVAILABLE');
  const key=await pushVapid(api);
  const registration=await navigator.serviceWorker.ready;
  const existing=await registration.pushManager.getSubscription();
  const subscription=existing||await registration.pushManager.subscribe({
   userVisibleOnly:true,applicationServerKey:key
  });
  await registerPush(api,subscription);
 }
 async function enable(){
  if(!api||!userAllowed()||!installedPushSupported()||operation.current)return;
  const preference=readReminderPreference();
  if(!preference.schedules.some(s=>s.enabled)){
   setError(copy('Bật ít nhất một lịch nhắc và chọn giờ trước.','Enable at least one reminder schedule first.'));
   return;
  }
  setError('');setNotice('');operation.current=true;setBusy(true);
  try{
   // iOS permission MUST be requested synchronously during the button tap.
   const response=Notification.permission==='granted'?'granted':await Notification.requestPermission();
   if(response!=='granted'&&Notification.permission!=='granted'){
    if(response==='denied'||Notification.permission==='denied')throw Error('PUSH_PERMISSION_DENIED');
    throw Error('PUSH_PERMISSION_NOT_YET_GRANTED');
   }
   setPermissionGranted(true);setPending(true);setEnabled(false);
   setNotice(copy('iPhone đã cấp quyền. Đang hoàn tất đăng ký…',
    'iPhone granted permission. Finishing registration…'));
   // First-ever iOS permission prompts can outlive service-worker/PushManager
   // readiness. Retry ONE transient registration failure without a page reload.
   let failure:unknown=null;
   for(let attempt=0;attempt<2;attempt++){
    try{await connectDevice();failure=null;break;}
    catch(err){
     failure=err;
     const reason=err instanceof Error?err.message:'';
     if(attempt>0||!navigator.onLine||
      /^PUSH_BACKEND_40[139]$|^PUSH_REMINDER_OFF$|^PUSH_AUTH_REQUIRED$/.test(reason))break;
     await pause(800);
    }
   }
   if(failure)throw failure;
   setEnabled(true);setPending(false);setError('');
   setNotice(copy('Đã đăng ký thông báo trên thiết bị này.',
    'Notifications enabled for this device.'));
  }catch(err){
   setEnabled(false);
   const reason=err instanceof Error?err.message:'';
   const denied=Notification.permission==='denied'||reason==='PUSH_PERMISSION_DENIED';
   const granted=Notification.permission==='granted';
   setPermissionGranted(granted);setPending(granted);
   setNotice('');
   setError(denied?copy(
    'iPhone đang chặn Thông báo. Hãy bật quyền trong Cài đặt của iPhone.',
    'iPhone blocked notifications. Enable permission in iPhone Settings.'):
    granted?copy(
     'iPhone đã cấp quyền, nhưng chưa hoàn tất đăng ký với máy chủ. Hãy thử lại; không cần cấp quyền lần nữa.',
     'iPhone granted permission, but server registration is unfinished. Try again without granting permission again.'):
    copy('Quyền thông báo chưa được xác nhận. Hãy kiểm tra quyền trên iPhone rồi thử lại.',
     'Notification permission is not confirmed. Check iPhone permission and try again.')+
     (denied?'':' ('+safePushIssue(err)+')'));
  }finally{operation.current=false;setBusy(false);}
 }
 async function disable(){
  if(!api||operation.current)return;
  setError('');operation.current=true;setBusy(true);
  try{
   const registration=await navigator.serviceWorker.ready;
   const sub=await registration.pushManager.getSubscription();
   if(sub)await removePush(api,sub); // Revoke owner-bound server record first.
   setEnabled(false);setPending(false);
   setPermissionGranted(Notification.permission==='granted');
   setNotice(copy('Đã tắt Web Push trên thiết bị này.','Web Push disabled on this device.'));
  }catch{
   setError(copy('Chưa tắt được trên máy chủ. Hãy kết nối mạng rồi thử lại.',
    'Could not revoke server subscription. Reconnect and try again.'));
  }finally{operation.current=false;setBusy(false);}
 }
 if(!api)return null;
 return <Card variant="raised" className="li-react-setting-card li-web-push-card">
  <Heading level={3} role="titleMedium">{copy('Thông báo khi đóng app','Notifications while app is closed')}</Heading>
  {!installedPushSupported()?
   <Text role="support">{copy(
    'Để bật trên iPhone: mở li. từ biểu tượng đã thêm vào Màn hình chính (không phải tab Safari).',
    'On iPhone, open li. from its Home Screen app icon, not a Safari tab.')}</Text>:
   <>
    <Text role="support">{copy(
     'Mặc định tắt. Chỉ xin quyền khi nhấn cho phép. Giữ nguyên giờ nhắc đã đặt; thông báo ngoài app có thể đến sớm hoặc trễ. Mỗi thiết bị bật riêng.',
     'Off by default. Permission is requested only on tap. Reminder times remain unchanged; background notifications may arrive early or late. Enable per device.')}</Text>
    <div className="action-row">
     {!enabled?<Button variant="primary" disabled={busy} onClick={()=>void enable()}>
      {pending?copy('Thử hoàn tất đăng ký','Retry registration'):
       copy('Bật thông báo iPhone','Enable iPhone notifications')}</Button>:
      <Button variant="secondary" disabled={busy} onClick={()=>void disable()}>
       {copy('Tắt thông báo máy này','Disable on this device')}</Button>}
    </div>
    <Text role="support" aria-live="polite">{enabled?
     copy('Đã cấp quyền và đồng bộ đăng ký với máy chủ.','Permission granted and subscription saved on the server.'):
     pending&&permissionGranted?
      copy('iPhone đã cho phép. Đăng ký máy chủ chưa hoàn tất.','iPhone allowed notifications. Server registration is pending.'):
      permissionGranted?
       copy('iPhone đã cấp quyền; Web Push chưa bật trên thiết bị này.','iPhone granted permission; Web Push is off for this device.'):
       copy('Web Push chưa bật trên thiết bị này.','Web Push is off for this device.')}</Text>
    {notice&&<InlineFeedback tone="info" message={notice}/>}
    {error&&<InlineFeedback tone="error" message={error}/>}
   </>}
 </Card>;
}
