/** Four opt-in reminder schedules. In-app delivery runs only while li. is open.
 * Keep the original preference key for account-scoped v1 migration. */
export const REMINDER_KEY='li.reminders.in-app.v1';
export const REMINDER_KINDS=['study','sleep','movement','rest'] as const;
export type ReminderKind=typeof REMINDER_KINDS[number];
export type ReminderFrequency='daily'|'weekdays'|'weekends'|'custom';
export type ReminderSchedule={kind:ReminderKind;enabled:boolean;time:string;frequency:ReminderFrequency;days:number[]};
export type ReminderPreference={version:2;schedules:ReminderSchedule[]};
export type ReminderDelivery={lastDay:string;snoozedUntil:number};
type DeliveryRecord={version:2;byKind:Partial<Record<ReminderKind,ReminderDelivery>>};
const FREQUENCIES:readonly ReminderFrequency[]=['daily','weekdays','weekends','custom'];
const emptyDelivery=():ReminderDelivery=>({lastDay:'',snoozedUntil:0});
const freshSchedule=(kind:ReminderKind):ReminderSchedule=>({kind,enabled:false,time:'',frequency:'daily',days:[]});
export const DEFAULT_REMINDER:ReminderPreference={version:2,schedules:REMINDER_KINDS.map(freshSchedule)};
const defaults=():ReminderPreference=>({version:2,schedules:REMINDER_KINDS.map(freshSchedule)});
export const isReminderKind=(value:unknown):value is ReminderKind=>
 typeof value==='string'&&(REMINDER_KINDS as readonly string[]).includes(value);
export const validTime=(value:unknown):value is string=>
 typeof value==='string'&&/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
export const validFrequency=(v:unknown):v is ReminderFrequency=>
 typeof v==='string'&&(FREQUENCIES as readonly string[]).includes(v);
export const validDays=(v:unknown):v is number[]=>Array.isArray(v)&&v.length<=7&&
 v.every(d=>Number.isInteger(d)&&d>=0&&d<=6)&&new Set(v).size===v.length;
export function validSchedule(s:unknown):s is ReminderSchedule{
 if(!s||typeof s!=='object'||Array.isArray(s))return false;
 const v=s as Record<string,unknown>;
 return isReminderKind(v.kind)&&typeof v.enabled==='boolean'&&
  (v.time===''||validTime(v.time))&&(!v.enabled||validTime(v.time))&&
  validFrequency(v.frequency)&&validDays(v.days)&&
  (!v.enabled||v.frequency!=='custom'||(v.days as number[]).length>0);
}
export function parseReminderPreference(raw:string|null):ReminderPreference{
 if(!raw)return defaults();
 try{
  const p:unknown=JSON.parse(raw);
  if(!p||typeof p!=='object'||Array.isArray(p))return defaults();
  const v=p as Record<string,unknown>;
  if(v.version===1){
   if(typeof v.enabled!=='boolean'||!isReminderKind(v.kind)||
     !(v.time===''||validTime(v.time))||(v.enabled&&!validTime(v.time)))return defaults();
   const migrated=defaults();
   migrated.schedules=migrated.schedules.map(s=>s.kind===v.kind?
    {...s,enabled:v.enabled as boolean,time:v.time as string}:s);
   return migrated;
  }
  if(v.version!==2||!Array.isArray(v.schedules)||v.schedules.length!==4||
    !v.schedules.every(validSchedule))return defaults();
  const entries=v.schedules as ReminderSchedule[];
  if(new Set(entries.map(s=>s.kind)).size!==4)return defaults();
  return {version:2,schedules:REMINDER_KINDS.map(kind=>{
   const s=entries.find(item=>item.kind===kind)!;
   return {...s,days:[...s.days].sort((a,b)=>a-b)};
  })};
 }catch{return defaults();}
}
export function localDay(now:Date):string{
 const pad=(v:number)=>String(v).padStart(2,'0');
 return now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
}
export function runsOnDay(s:ReminderSchedule,day:number):boolean{
 if(s.frequency==='daily')return true;
 if(s.frequency==='weekdays')return day>=1&&day<=5;
 if(s.frequency==='weekends')return day===0||day===6;
 return s.days.includes(day);
}
export function dueInApp(s:ReminderSchedule,delivery:ReminderDelivery,now:Date):boolean{
 if(!s.enabled||!validTime(s.time)||delivery.lastDay===localDay(now))return false;
 const time=now.getTime();
 const today=localDay(now);
 if(delivery.snoozedUntil>0){
  const snoozeDay=localDay(new Date(delivery.snoozedUntil));
  // Snooze can cross midnight and a selected-weekday boundary. Tomorrow's
  // postponed reminder must not cause today's original reminder to reappear.
  if(snoozeDay>today)return false;
  if(snoozeDay===today)
   return time>=delivery.snoozedUntil&&time<delivery.snoozedUntil+90*60*1000;
 }
 if(!runsOnDay(s,now.getDay()))return false;
 const [hours,minutes]=s.time.split(':').map(Number);
 const due=new Date(now.getFullYear(),now.getMonth(),now.getDate(),hours,minutes).getTime();
 return time>=due&&time<due+90*60*1000;
}
export function readReminderPreference():ReminderPreference{
 try{return parseReminderPreference(localStorage.getItem(REMINDER_KEY));}
 catch{return defaults();}
}
export function reminderDeliveryKey(uid:string):string{
 if(!uid||uid.length>150)throw Error('REMINDER_ACCOUNT_REQUIRED');
 return 'li.reminders.delivery.v1:'+uid;
}
function validDelivery(v:unknown):v is ReminderDelivery{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 const d=v as Record<string,unknown>;
 return typeof d.lastDay==='string'&&(d.lastDay===''||/^\d{4}-\d{2}-\d{2}$/.test(d.lastDay))&&
  typeof d.snoozedUntil==='number'&&Number.isFinite(d.snoozedUntil)&&d.snoozedUntil>=0;
}
function readDeliveryRecord(uid:string):DeliveryRecord{
 try{
  const raw=localStorage.getItem(reminderDeliveryKey(uid));
  if(!raw)return {version:2,byKind:{}};
  const value:unknown=JSON.parse(raw);
  if(!value||typeof value!=='object'||Array.isArray(value))return {version:2,byKind:{}};
  const v=value as Record<string,unknown>;
  if(v.version===2&&v.byKind&&typeof v.byKind==='object'&&!Array.isArray(v.byKind)){
   const byKind:DeliveryRecord['byKind']={};
   for(const kind of REMINDER_KINDS){const d=(v.byKind as Record<string,unknown>)[kind];
    if(validDelivery(d))byKind[kind]={...d};}
   return {version:2,byKind};
  }
  // The old one-reminder receipt belongs only to its formerly selected type.
  if(validDelivery(value)){
   const active=readReminderPreference().schedules.find(s=>s.enabled);
   return {version:2,byKind:active?{[active.kind]:{...value}}:{}};
  }
 }catch{/* Local storage may be unavailable. */}
 return {version:2,byKind:{}};
}
export function readReminderDelivery(uid:string,kind:ReminderKind):ReminderDelivery{
 return readDeliveryRecord(uid).byKind[kind]||emptyDelivery();
}
export function writeReminderDelivery(uid:string,kind:ReminderKind,value:ReminderDelivery){
 if(!isReminderKind(kind)||!validDelivery(value))throw Error('REMINDER_INVALID_DELIVERY');
 const key=reminderDeliveryKey(uid),prev=readDeliveryRecord(uid);
 const raw=JSON.stringify({version:2,byKind:{...prev.byKind,[kind]:value}});
 localStorage.setItem(key,raw);
 if(localStorage.getItem(key)!==raw)throw Error('REMINDER_LOCAL_WRITE_FAILED');
}
export function writeReminderPreference(value:ReminderPreference){
 if(!value||value.version!==2||!Array.isArray(value.schedules)||
   value.schedules.length!==4||!value.schedules.every(validSchedule)||
   new Set(value.schedules.map(s=>s.kind)).size!==4)
  throw Error('REMINDER_INVALID_PREFERENCE');
 const raw=JSON.stringify(parseReminderPreference(JSON.stringify(value)));
 localStorage.setItem(REMINDER_KEY,raw);
 if(localStorage.getItem(REMINDER_KEY)!==raw)throw Error('REMINDER_LOCAL_WRITE_FAILED');
 window.dispatchEvent(new Event('li:reminder-preference-changed'));
 window.dispatchEvent(new Event('li:private-sync-request'));
}
