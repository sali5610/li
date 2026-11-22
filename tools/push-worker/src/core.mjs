// li. Web Push: small, dependency-free validation and local-time scheduling.
// No user data, endpoints, or JWTs appear in notification payloads.
export const KIND_MESSAGES={
 study:'Bài đang học vẫn ở đây. Khi muốn, quay lại đúng chỗ đang dở.',
 sleep:'Nếu sắp nghỉ, hãy dành chút thời gian thư giãn trước giờ ngủ.',
 movement:'Ngồi lâu rồi? Đổi tư thế hoặc vận động nhẹ khi tiện nhé.',
 rest:'Nghỉ một nhịp cũng được. Lão Lý giữ chỗ học cho bạn.'
};
export const validKind=kind=>Object.hasOwn(KIND_MESSAGES,kind);
export const validClock=time=>typeof time==='string'&&/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
export const validFrequency=value=>['daily','weekdays','weekends','custom'].includes(value);
const validDays=days=>Array.isArray(days)&&days.length<=7&&
 days.every(n=>Number.isInteger(n)&&n>=0&&n<=6)&&new Set(days).size===days.length;
export function validSchedules(schedules){
 return Array.isArray(schedules)&&schedules.length===4&&
  new Set(schedules.map(s=>s?.kind)).size===4&&
  schedules.every(s=>s&&validKind(s.kind)&&typeof s.enabled==='boolean'&&
   (s.time===''||validClock(s.time))&&(!s.enabled||validClock(s.time))&&
   validFrequency(s.frequency)&&validDays(s.days)&&
   (!s.enabled||s.frequency!=='custom'||s.days.length>0));
}
export function validZone(zone){
 if(typeof zone!=='string'||zone.length>70||!/^[A-Za-z0-9_+\/-]+$/.test(zone))return false;
 try{new Intl.DateTimeFormat('en-US',{timeZone:zone}).format(new Date());return true;}
 catch{return false;}
}
export function localMinute(now,zone){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,
  year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',
  minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const item=k=>parts.find(p=>p.type===k)?.value;
 return {day:[item('year'),item('month'),item('day')].join('-'),
  time:item('hour')+':'+item('minute')};
}
function runsOnDay(s,day){
 return s.frequency==='daily'||s.frequency==='weekdays'&&day>=1&&day<=5||
  s.frequency==='weekends'&&(day===0||day===6)||
  s.frequency==='custom'&&s.days.includes(day);
}
function storedSchedules(row){
 if(typeof row.local_time!=='string')return null;
 if(!row.local_time.startsWith('{'))
  return validKind(row.kind)&&validClock(row.local_time)?[
   {kind:row.kind,enabled:true,time:row.local_time,frequency:'daily',days:[]}]:null;
 try{
  const value=JSON.parse(row.local_time);
  return value?.version===2&&validSchedules(value.schedules)?value.schedules:null;
 }catch{return null;}
}
function deliveredDays(row){
 if(typeof row.last_day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(row.last_day))
  return validKind(row.kind)?{[row.kind]:row.last_day}:{};
 if(typeof row.last_day!=='string')return {};
 try{
  const value=JSON.parse(row.last_day);
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  return Object.fromEntries(Object.entries(value).filter(([k,v])=>validKind(k)&&
   typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)));
 }catch{return {};}
}
export function duePushSlots(row,now){
 if(!row.enabled||!validZone(row.zone))return [];
 const schedules=storedSchedules(row);
 if(!schedules)return [];
 // Keep the user's saved/displayed time untouched. The backend targets a
 // send ONE minute before that clock time to compensate for push transit.
 // A one-minute Cron may run late; allow up to two minutes of catch-up
 // while last_day/claimDays prevents duplicate sends of a kind/day.
 const target=localMinute(new Date(now.getTime()+60_000),row.zone);
 const at=Number(target.time.slice(0,2))*60+Number(target.time.slice(3));
 const candidates=[{day:target.day,at}];
 // Catch yesterday's last 2 minutes after crossing local midnight.
 if(at<3){
  const previous=localMinute(new Date(now.getTime()-3*60_000),row.zone);
  if(previous.day!==target.day)candidates.push({day:previous.day,at:at+1440});
 }
 const delivered=deliveredDays(row);
 return schedules.flatMap(s=>{
  if(!s.enabled)return [];
  const scheduled=Number(s.time.slice(0,2))*60+Number(s.time.slice(3));
  const match=candidates.find(({day,at:minute})=>
   delivered[s.kind]!==day&&
   runsOnDay(s,new Date(day+'T12:00:00Z').getUTCDay())&&
   minute>=scheduled&&minute<scheduled+3);
  return match?[{kind:s.kind,day:match.day}]:[];
 });
}
export function claimDays(row,slots){
 const days=deliveredDays(row);
 for(const {kind,day} of slots)days[kind]=day;
 return JSON.stringify(days);
}
// Compatibility for existing v1 subscription rows and tests.
export function dueForPush(row,now){return duePushSlots(row,now)[0]?.day||null;}
export function allowedPushEndpoint(endpoint){
 if(typeof endpoint!=='string'||endpoint.length>2048)return false;
 let url;try{url=new URL(endpoint);}catch{return false;}
 if(url.protocol!=='https:'||url.username||url.password||url.port)return false;
 const host=url.hostname;
 return host==='web.push.apple.com'||host.endsWith('.push.apple.com')||
  host==='fcm.googleapis.com'||host==='updates.push.services.mozilla.com'||
  host==='notify.windows.com';
}
export function validSubscription(s){
 return !!s&&typeof s==='object'&&!Array.isArray(s)&&
  allowedPushEndpoint(s.endpoint)&&!!s.keys&&
  typeof s.keys.p256dh==='string'&&/^[A-Za-z0-9_-]{80,120}$/.test(s.keys.p256dh)&&
  typeof s.keys.auth==='string'&&/^[A-Za-z0-9_-]{20,30}$/.test(s.keys.auth);
}
export async function endpointId(endpoint){
 const data=new TextEncoder().encode(endpoint);
 const digest=await crypto.subtle.digest('SHA-256',data);
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
export function safeAccountJwt(token){
 if(typeof token!=='string'||token.length>8192||token.split('.').length!==3)return null;
 try{
  const base=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const p=JSON.parse(atob(base));
  if(typeof p?.sub!=='string'||p.sub.length<1||p.sub.length>150||
   !Number.isFinite(p.exp)||p.exp*1000<=Date.now())return null;
  return p.sub;
 }catch{return null;}
}
