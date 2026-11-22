import {neonSessionPort} from '../auth/neon-client.js';
import {readReminderPreference,readReminderDelivery} from './in-app-reminder.js';

const urlValue=(import.meta.env.VITE_LI_PUSH_WORKER_URL||
 import.meta.env.VITE_LI_PUSH_STAGING_URL||'') as string;
export function webPushApi():string|null{
 try{
  const u=new URL(urlValue);
  if(u.protocol!=='https:'||!/^li-push-staging\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||
   u.pathname!=='/'||u.search||u.hash||u.username||u.password)return null;
  // Never send the signed session to a backend from an unrelated app origin.
  // Cloudflare's installed PWA uses /; GitHub staging uses /li/.
  const cloudflare=location.origin==='https://li5610.pages.dev';
  const github=location.origin==='https://sali5610.github.io'&&location.pathname.startsWith('/li/');
  if(!cloudflare&&!github)return null;
  return u.origin;
 }catch{return null;}
}
export function installedPushSupported():boolean{
 return 'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&
  (window.matchMedia('(display-mode: standalone)').matches||
   (navigator as Navigator&{standalone?:boolean}).standalone===true);
}
export function userAllowed():boolean{
 return document.documentElement.classList.contains('li-auth-verified')&&
  Boolean(localStorage.getItem('li.sync.local-owner.v1'));
}
export function publicVapidKey(key:string):ArrayBuffer{
 if(!/^[A-Za-z0-9_-]{80,120}$/.test(key))throw Error('PUSH_VAPID_INVALID');
 const b64=key.replace(/-/g,'+').replace(/_/g,'/');
 const bytes=Uint8Array.from(atob(b64),v=>v.charCodeAt(0));
 if(bytes.length!==65||bytes[0]!==4)throw Error('PUSH_VAPID_INVALID');
 return bytes.buffer;
}
export async function pushVapid(api:string):Promise<ArrayBuffer>{
 const result=await fetch(api+'/v1/config',{cache:'no-store',credentials:'omit'});
 if(!result.ok)throw Error('PUSH_BACKEND_UNAVAILABLE');
 const data=await result.json() as {available?:boolean;vapidPublicKey?:string};
 if(!data.available||!data.vapidPublicKey)throw Error('PUSH_BACKEND_UNAVAILABLE');
 return publicVapidKey(data.vapidPublicKey);
}
async function pushRequest(api:string,method:'PUT'|'DELETE',payload:object):Promise<void>{
 const account=localStorage.getItem('li.sync.local-owner.v1');
 if(!userAllowed()||!account)throw Error('PUSH_AUTH_REQUIRED');
 const token=await neonSessionPort.getJWTToken();
 if(!token||token.split('.').length!==3)throw Error('PUSH_AUTH_REQUIRED');
 const response=await fetch(api+'/v1/subscriptions',{
  method,cache:'no-store',credentials:'omit',redirect:'error',
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify(payload)
 });
 if(!response.ok)throw Error('PUSH_BACKEND_'+response.status);
}
function serverSchedules(){
 const preference=readReminderPreference();
 const owner=localStorage.getItem('li.sync.local-owner.v1');
 return preference.schedules.map(s=>({
  ...s,snoozedUntil:owner?readReminderDelivery(owner,s.kind).snoozedUntil:0
 }));
}
export async function registerPush(api:string,subscription:PushSubscription):Promise<void>{
 const preference=readReminderPreference();
 if(!preference.schedules.some(s=>s.enabled))throw Error('PUSH_REMINDER_OFF');
 const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
 if(!zone)throw Error('PUSH_ZONE_UNAVAILABLE');
 const data=subscription.toJSON();
 if(!data.endpoint||!data.keys?.auth||!data.keys?.p256dh)
  throw Error('PUSH_SUBSCRIPTION_INVALID');
 const first=preference.schedules.find(s=>s.enabled)!;
 await pushRequest(api,'PUT',{
  subscription:{endpoint:data.endpoint,keys:data.keys},
  enabled:true,kind:first.kind,time:first.time,zone,
  schedules:serverSchedules()
 });
}
export async function updatePushSchedule(api:string,subscription:PushSubscription):Promise<void>{
 const preference=readReminderPreference();
 const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
 if(!zone)throw Error('PUSH_ZONE_UNAVAILABLE');
 const data=subscription.toJSON();
 if(!data.endpoint||!data.keys?.auth||!data.keys?.p256dh)
  throw Error('PUSH_SUBSCRIPTION_INVALID');
 // Legacy worker sees first enabled kind; the updated worker reads all schedules.
 const first=preference.schedules.find(s=>s.enabled);
 await pushRequest(api,'PUT',{
  subscription:{endpoint:data.endpoint,keys:data.keys},enabled:!!first,
  kind:first?.kind||'study',time:first?.time||'00:00',zone,
  schedules:serverSchedules()
 });
}
export async function removePush(api:string,subscription:PushSubscription):Promise<void>{
 await pushRequest(api,'DELETE',{endpoint:subscription.endpoint});
 await subscription.unsubscribe();
}
