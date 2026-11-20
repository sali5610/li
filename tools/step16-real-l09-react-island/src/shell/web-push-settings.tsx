import React,{useEffect,useState} from 'react';
import {Button,Card,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';
import {readReminderPreference} from './in-app-reminder.js';
import {webPushApi,installedPushSupported,userAllowed,pushVapid,
 registerPush,updatePushSchedule,removePush} from './web-push-client.js';

function copy(vi:string,en:string){
 return (window as Window&{liLanguage?:{get?:()=>string}}).liLanguage?.get?.()==='en'?en:vi;
}
export function WebPushSettings(){
 const [enabled,setEnabled]=useState(false);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const api=webPushApi();
 useEffect(()=>{
  if(!api||!installedPushSupported()||!userAllowed())return;
  let alive=true;
  const refresh=async()=>{
   try{
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.getSubscription();
    if(!alive)return;
    setEnabled(!!sub&&Notification.permission==='granted');
    // Sync only a subscription the user explicitly granted in the past.
    // Never ask permission automatically or create new subscriptions on reload.
    if(sub&&Notification.permission==='granted'&&navigator.onLine&&userAllowed()){
     await updatePushSchedule(api,sub);
    }
   }catch{/* Offline preserves the local subscription; no false server ACK. */}
  };
  void refresh();
  const change=()=>{void refresh();};
  window.addEventListener('li:reminder-preference-changed',change);
  window.addEventListener('li:personal-sync-applied',change);
  window.addEventListener('online',change);
  return()=>{
   alive=false;
   window.removeEventListener('li:reminder-preference-changed',change);
   window.removeEventListener('li:personal-sync-applied',change);
   window.removeEventListener('online',change);
  };
 },[api]);
 async function enable(){
  if(!api||!userAllowed()||!installedPushSupported()||busy)return;
  const preference=readReminderPreference();
  if(!preference.enabled){
   setError(copy('Bật lời nhắc trong app và chọn giờ trước.','Enable an in-app reminder and set its time first.'));
   return;
  }
  setError('');setNotice('');
  setBusy(true);
  try{
   // iOS permission must be requested DURING the user's tap: no await before it.
   const permissionRequest=Notification.requestPermission();
   const permission=await permissionRequest;
   if(permission!=='granted')throw Error('PUSH_PERMISSION_DENIED');
   const key=await pushVapid(api);
   const registration=await navigator.serviceWorker.ready;
   const existing=await registration.pushManager.getSubscription();
   const subscription=existing||await registration.pushManager.subscribe({
    userVisibleOnly:true,applicationServerKey:key
   });
   await registerPush(api,subscription);
   setEnabled(true);
   setNotice(copy('Đã đăng ký thông báo trên thiết bị này.','Notifications enabled for this device.'));
  }catch{
   setError(copy('Chưa thể đăng ký. Kiểm tra quyền Thông báo và mạng, rồi thử lại.',
    'Could not subscribe. Check notifications permission and connectivity.'));
  }finally{setBusy(false);}
 }
 async function disable(){
  if(!api||busy)return;
  setError('');setBusy(true);
  try{
   const registration=await navigator.serviceWorker.ready;
   const sub=await registration.pushManager.getSubscription();
   if(sub)await removePush(api,sub); // Server revocation first, then local unsubscribe.
   setEnabled(false);
   setNotice(copy('Đã tắt Web Push trên thiết bị này.','Web Push disabled on this device.'));
  }catch{
   setError(copy('Chưa tắt được trên máy chủ. Hãy kết nối mạng rồi thử lại.',
    'Could not revoke server subscription. Reconnect and try again.'));
  }finally{setBusy(false);}
 }
 // A missing backend must not appear as an inert feature in the real learner app.
 if(!api)return null;
 return <Card variant="raised" className="li-react-setting-card li-web-push-card">
  <Heading level={3} role="titleMedium">{copy('Thông báo khi đóng app','Notifications while app is closed')}</Heading>
  {!installedPushSupported()?
   <Text role="support">{copy(
    'Để bật trên iPhone: mở li. từ biểu tượng đã thêm vào Màn hình chính (không phải tab Safari).',
    'On iPhone, open li. from its Home Screen app icon, not a Safari tab.')}</Text>:
   <>
    <Text role="support">{copy(
     'Mặc định tắt. Chỉ bật sau khi mày bấm cho phép. Dùng loại nhắc và giờ đã chọn phía trên; tối đa một lần/ngày. Mỗi thiết bị bật riêng.',
     'Off by default. Permission is only asked when you tap Enable. Uses your selected reminder and time, at most once daily, per device.')}</Text>
    <div className="action-row">
     {!enabled?<Button variant="primary" disabled={busy} onClick={()=>void enable()}>
      {copy('Bật thông báo iPhone','Enable iPhone notifications')}</Button>:
      <Button variant="secondary" disabled={busy} onClick={()=>void disable()}>
       {copy('Tắt thông báo máy này','Disable on this device')}</Button>}
    </div>
    <Text role="support" aria-live="polite">{enabled?
      copy('Thiết bị đã cho phép nhận Web Push.','This device allows Web Push.'):
      copy('Web Push chưa bật trên thiết bị này.','Web Push is off for this device.')}</Text>
    {notice&&<InlineFeedback tone="info" message={notice}/>}
    {error&&<InlineFeedback tone="error" message={error}/>}
   </>}
 </Card>;
}
