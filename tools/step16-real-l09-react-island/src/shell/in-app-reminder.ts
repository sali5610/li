/** L1 in-app reminders: explicit opt-in, one chosen category/time.
 * These are only evaluated while the app is open. They are NOT iOS background
 * push notifications and do not claim any clinical or learning outcomes. */
export const REMINDER_KEY='li.reminders.in-app.v1';
export type ReminderKind='study'|'sleep'|'movement'|'rest';
export type ReminderPreference={version:1;enabled:boolean;kind:ReminderKind;time:string};
export type ReminderDelivery={lastDay:string;snoozedUntil:number};
export const DEFAULT_REMINDER:ReminderPreference={version:1,enabled:false,kind:'sleep',time:''};
const kinds:readonly ReminderKind[]=['study','sleep','movement','rest'];
export const isReminderKind=(value:unknown):value is ReminderKind=>
 typeof value==='string'&&kinds.includes(value as ReminderKind);
export const validTime=(value:unknown):value is string=>
 typeof value==='string'&&/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);

export function parseReminderPreference(raw:string|null):ReminderPreference{
 if(!raw)return {...DEFAULT_REMINDER};
 try{
  const p:unknown=JSON.parse(raw);
  if(!p||typeof p!=='object'||Array.isArray(p))return {...DEFAULT_REMINDER};
  const v=p as Record<string,unknown>;
  if(v.version!==1||typeof v.enabled!=='boolean'||!isReminderKind(v.kind)||
    !(v.time===''||validTime(v.time))||(v.enabled&&!validTime(v.time)))
   return {...DEFAULT_REMINDER};
  return {version:1,enabled:v.enabled,kind:v.kind,time:v.time as string};
 }catch{return {...DEFAULT_REMINDER};}
}
export function localDay(now:Date):string{
 const pad=(v:number)=>String(v).padStart(2,'0');
 return now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
}
export function dueInApp(p:ReminderPreference,delivery:ReminderDelivery,now:Date):boolean{
 if(!p.enabled||!validTime(p.time)||delivery.lastDay===localDay(now))return false;
 const [hours,minutes]=p.time.split(':').map(Number);
 const due=new Date(now.getFullYear(),now.getMonth(),now.getDate(),hours,minutes).getTime();
 const time=now.getTime();
 // A user-snoozed reminder may reappear later today, never on a different day.
 if(delivery.snoozedUntil>0&&localDay(new Date(delivery.snoozedUntil))===localDay(now)){
  return time>=delivery.snoozedUntil&&time<delivery.snoozedUntil+90*60*1000;
 }
 // Don't fire a "morning" reminder at midnight just because the user opened
 // the app many hours later. A 90-minute window avoids a missed-day backlog.
 return time>=due&&time<due+90*60*1000;
}
export function readReminderPreference():ReminderPreference{
 try{return parseReminderPreference(localStorage.getItem(REMINDER_KEY));}
 catch{return {...DEFAULT_REMINDER};}
}
export function reminderDeliveryKey(uid:string):string{
 if(!uid||uid.length>150)throw Error('REMINDER_ACCOUNT_REQUIRED');
 return 'li.reminders.delivery.v1:'+uid;
}
export function readReminderDelivery(uid:string):ReminderDelivery{
 try{
  const raw=localStorage.getItem(reminderDeliveryKey(uid));
  if(!raw)return {lastDay:'',snoozedUntil:0};
  const p:unknown=JSON.parse(raw);
  if(!p||typeof p!=='object'||Array.isArray(p))return {lastDay:'',snoozedUntil:0};
  const v=p as Record<string,unknown>;
  return {lastDay:typeof v.lastDay==='string'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v.lastDay)?v.lastDay:'',
   snoozedUntil:typeof v.snoozedUntil==='number'&&Number.isFinite(v.snoozedUntil)&&v.snoozedUntil>=0?v.snoozedUntil:0};
 }catch{return {lastDay:'',snoozedUntil:0};}
}
export function writeReminderDelivery(uid:string,value:ReminderDelivery){
 const key=reminderDeliveryKey(uid),raw=JSON.stringify(value);
 localStorage.setItem(key,raw);
 if(localStorage.getItem(key)!==raw)throw Error('REMINDER_LOCAL_WRITE_FAILED');
}
export function writeReminderPreference(value:ReminderPreference){
 if(!isReminderKind(value.kind)||(value.time!==''&&!validTime(value.time))||
   (value.enabled&&!validTime(value.time)))throw Error('REMINDER_INVALID_PREFERENCE');
 const raw=JSON.stringify(value);
 localStorage.setItem(REMINDER_KEY,raw);
 if(localStorage.getItem(REMINDER_KEY)!==raw)throw Error('REMINDER_LOCAL_WRITE_FAILED');
 window.dispatchEvent(new Event('li:reminder-preference-changed'));
 window.dispatchEvent(new Event('li:private-sync-request'));
}
