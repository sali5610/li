import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Button,Card,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';
import {
 REMINDER_KEY,dueInApp,localDay,readReminderDelivery,
 readReminderPreference,validTime,writeReminderDelivery,writeReminderPreference,
 type ReminderKind,type ReminderFrequency,type ReminderSchedule,type ReminderPreference
} from './in-app-reminder.js';

const OWNER='li.sync.local-owner.v1';
const kinds:readonly {id:ReminderKind;vi:string;en:string}[]=[
 {id:'study',vi:'Quay lại bài đang học',en:'Return to learning'},
 {id:'sleep',vi:'Chuẩn bị nghỉ ngơi, ngủ đủ',en:'Prepare for sleep'},
 {id:'movement',vi:'Đổi tư thế, vận động nhẹ',en:'Take a movement break'},
 {id:'rest',vi:'Nghỉ một nhịp',en:'Take a rest'}
];
const frequencies:readonly {id:ReminderFrequency;vi:string;en:string}[]=[
 {id:'daily',vi:'Mỗi ngày',en:'Every day'},
 {id:'weekdays',vi:'Thứ 2–6',en:'Weekdays'},
 {id:'weekends',vi:'Thứ 7 & Chủ nhật',en:'Weekends'},
 {id:'custom',vi:'Chọn thứ trong tuần',en:'Selected weekdays'}
];
const weekDays=[
 {day:1,vi:'T2',en:'Mo'},{day:2,vi:'T3',en:'Tu'},
 {day:3,vi:'T4',en:'We'},{day:4,vi:'T5',en:'Th'},
 {day:5,vi:'T6',en:'Fr'},{day:6,vi:'T7',en:'Sa'},
 {day:0,vi:'CN',en:'Su'}
];
const owner=()=>document.documentElement.classList.contains('li-auth-verified')?
 localStorage.getItem(OWNER)||'':'';
const vietnamese=()=>(window as Window&{liLanguage?:{get?:()=>string}}).liLanguage?.get?.()!=='en';
const reminderMessage=(kind:ReminderKind,lang:boolean)=>({
 study:['Bài đang học vẫn ở đây. Khi muốn, quay lại đúng chỗ đang dở.',
  'Your lesson is still here. Resume whenever you like.'],
 sleep:['Nếu sắp đi ngủ, có thể thư giãn một chút trước giờ nghỉ.',
  'If bedtime is near, consider winding down.'],
 movement:['Ngồi lâu rồi? Đổi tư thế hoặc vận động nhẹ khi tiện cũng được.',
  'Been sitting a while? Change position or move a little if convenient.'],
 rest:['Nghỉ cũng được. Khi sẵn sàng, quay lại đúng chỗ đang dở.',
  'It is okay to rest. Your progress will be here when you return.']
})[kind][lang?0:1];
const replaceSchedule=(p:ReminderPreference,s:ReminderSchedule):ReminderPreference=>({
 version:2,schedules:p.schedules.map(item=>item.kind===s.kind?s:item)
});
const labelFor=(kind:ReminderKind,lang:boolean)=>{
 const item=kinds.find(i=>i.id===kind)!;return lang?item.vi:item.en;
};
function getDueKind():ReminderKind|null{
 let uid='';try{uid=owner();}catch{return null;}
 if(!uid||document.visibilityState==='hidden')return null;
 const current=readReminderPreference(),now=new Date();
 return current.schedules.find(s=>dueInApp(s,readReminderDelivery(uid,s.kind),now))?.kind||null;
}

/** Four independent, opt-in schedules. No OS notifications are faked. */
export function InAppReminderPanel(){
 const [pref,setPref]=useState<ReminderPreference>(readReminderPreference);
 const [draft,setDraft]=useState<ReminderPreference>(readReminderPreference);
 const [dueKind,setDueKind]=useState<ReminderKind|null>(null);
 const [error,setError]=useState('');
 const [feedback,setFeedback]=useState('');
 const [lang,setLang]=useState(vietnamese);
 const copy=(vi:string,en:string)=>lang?vi:en;
 useEffect(()=>{
  const check=()=>setDueKind(getDueKind());
  const changed=()=>{const value=readReminderPreference();setPref(value);setDraft(value);check();};
  const sync=(event:Event)=>{
   const keys=(event as CustomEvent<{keys?:string[]}>).detail?.keys;
   if(!keys||keys.includes(REMINDER_KEY))changed();
  };
  const locale=()=>setLang(vietnamese());
  check();
  const interval=window.setInterval(check,60_000);
  window.addEventListener('focus',check);
  window.addEventListener('pageshow',check);
  window.addEventListener('li:reminder-preference-changed',changed);
  window.addEventListener('li:personal-sync-applied',sync);
  window.addEventListener('li:localechange',locale);
  document.addEventListener('visibilitychange',check);
  return()=>{
   window.clearInterval(interval);
   window.removeEventListener('focus',check);
   window.removeEventListener('pageshow',check);
   window.removeEventListener('li:reminder-preference-changed',changed);
   window.removeEventListener('li:personal-sync-applied',sync);
   window.removeEventListener('li:localechange',locale);
   document.removeEventListener('visibilitychange',check);
  };
 },[]);
 function edit(kind:ReminderKind,patch:Partial<ReminderSchedule>){
  setDraft(p=>({...p,schedules:p.schedules.map(s=>s.kind===kind?{...s,...patch}:s)}));
  setError('');setFeedback('');
 }
 function saveAll(){
  let uid='';try{uid=owner();}catch{/* Local preference unavailable. */}
  if(!uid){setError(copy('Cần đăng nhập trước.','Sign in first.'));return;}
  if(draft.schedules.some(s=>s.enabled&&(!validTime(s.time)||
    (s.frequency==='custom'&&!s.days.length)))){
   setError(copy('Mỗi loại đang bật cần giờ và ít nhất một thứ nếu chọn lịch tùy chỉnh.',
    'Each enabled reminder needs a time and selected days for a custom repeat.'));return;
  }
  try{
   const previous=readReminderPreference();
   const now=new Date();
   for(const next of draft.schedules){
    const before=previous.schedules.find(s=>s.kind===next.kind)!;
    if(JSON.stringify(before)===JSON.stringify(next))continue;
    const previousDelivery=readReminderDelivery(uid,next.kind);
    const [h,m]=next.time.split(':').map(Number);
    const past=next.enabled&&validTime(next.time)&&
     now.getTime()>=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m).getTime();
    writeReminderDelivery(uid,next.kind,{
     lastDay:past?localDay(now):previousDelivery.lastDay,snoozedUntil:0
    });
   }
   writeReminderPreference(draft);
   setPref(draft);setDueKind(null);setError('');
   setFeedback(copy('Đã lưu cả 4 lịch nhắc.','All four schedules saved.'));
  }catch{setError(copy('Không lưu được lịch nhắc trên thiết bị.',
   'Could not save reminder schedules on this device.'));}
 }
 function respond(action:'dismiss'|'snooze'|'disable'){
  if(!dueKind)return;
  let uid='';try{uid=owner();}catch{/* Storage error. */}
  if(!uid){setDueKind(null);return;}
  try{
   if(action==='disable'){
    const current=readReminderPreference(),chosen=current.schedules.find(s=>s.kind===dueKind)!;
    writeReminderPreference(replaceSchedule(current,{...chosen,enabled:false}));
   }
   const now=new Date();
   writeReminderDelivery(uid,dueKind,{
    lastDay:action==='snooze'?'':localDay(now),
    snoozedUntil:action==='snooze'?now.getTime()+60*60*1000:0
   });
   setDueKind(null);setError('');
   // Push is per-device; ask the mounted Push settings to upload this
   // snooze or per-kind cancellation. No OS prompt is triggered.
   window.dispatchEvent(new Event('li:reminder-delivery-changed'));
   // Several types can share a time; show one at a time, not overlapping sheets.
   window.setTimeout(()=>setDueKind(getDueKind()),0);
  }catch{setError(copy('Không lưu được lựa chọn.','Could not save your response.'));}
 }
 const active=pref.schedules.filter(s=>s.enabled).length;
 return <>
  <Card variant="raised" className="li-react-setting-card li-reminder-settings">
   <Heading level={3} role="titleMedium">{copy('Nhắc nhở trong app','In-app reminders')}</Heading>
   <Text role="support">{copy(
    'Bật tối đa 4 loại cùng lúc; mỗi loại có giờ và lịch lặp riêng. Chỉ hiện khi li. đang mở, tối đa một lần mỗi ngày được chọn cho mỗi loại.',
    'Enable all 4 types independently. Each has its own time and repeat schedule. Shown only while li. is open, at most once per selected day per type.')}</Text>
   <Text role="support" aria-live="polite">{copy('Đang bật: ','Enabled: ')}{active}/4</Text>
   <div className="li-reminder-schedules">
    {draft.schedules.map(s=>{
     const saved=pref.schedules.find(item=>item.kind===s.kind)!;
     const changed=JSON.stringify(s)!==JSON.stringify(saved);
     const invalid=s.enabled&&(!validTime(s.time)||(s.frequency==='custom'&&!s.days.length));
     return <section className="li-reminder-schedule" key={s.kind} aria-label={labelFor(s.kind,lang)}>
      <div className="li-reminder-schedule-top">
       <Heading level={4} role="titleSmall">{labelFor(s.kind,lang)}</Heading>
       <label className="li-reminder-toggle">
        <input type="checkbox" checked={s.enabled}
         onChange={e=>edit(s.kind,{enabled:e.target.checked})}/>
        <span>{s.enabled?copy('Bật','On'):copy('Tắt','Off')}</span>
       </label>
      </div>
      <div className="li-reminder-inputs">
       <label htmlFor={'li-reminder-time-'+s.kind}>{copy('Giờ nhắc','Time')}</label>
       <input id={'li-reminder-time-'+s.kind} type="time" value={s.time}
        onChange={e=>edit(s.kind,{time:e.currentTarget.value})}/>
       <label htmlFor={'li-reminder-frequency-'+s.kind}>{copy('Lặp lại','Repeat')}</label>
       <select id={'li-reminder-frequency-'+s.kind} value={s.frequency}
        onChange={e=>edit(s.kind,{frequency:e.currentTarget.value as ReminderFrequency})}>
        {frequencies.map(f=><option key={f.id} value={f.id}>{lang?f.vi:f.en}</option>)}
       </select>
      </div>
      {s.frequency==='custom'&&<fieldset className="li-reminder-days">
       <legend>{copy('Nhắc vào các thứ','Repeat on')}</legend>
       <div className="li-reminder-weekdays">
        {weekDays.map(day=><label key={day.day} className="li-reminder-day">
         <input type="checkbox" checked={s.days.includes(day.day)}
          onChange={e=>edit(s.kind,{days:e.target.checked?
           [...s.days,day.day].sort((a,b)=>a-b):s.days.filter(d=>d!==day.day)})}/>
         <span>{lang?day.vi:day.en}</span>
        </label>)}
       </div>
      </fieldset>}
      <Text role="support">{saved.enabled?copy('Đã bật · ','On · ')+saved.time:
       copy('Đang tắt','Off')}</Text>
     </section>;
    })}
   </div>
   <div className="action-row">
    <Button variant="primary" disabled={
     JSON.stringify(draft)===JSON.stringify(pref)||
     draft.schedules.some(s=>s.enabled&&(!validTime(s.time)||
      (s.frequency==='custom'&&!s.days.length)))
    } onClick={saveAll}>{copy('Lưu tất cả lịch nhắc','Save all schedules')}</Button>
   </div>
   {feedback&&<Text role="support" aria-live="polite">{feedback}</Text>}
   {error&&<InlineFeedback tone="error" message={error}/>}
  </Card>
  {dueKind&&createPortal(<div className="li-in-app-reminder" role="status" aria-live="polite"
    aria-label={copy('Lời nhắc của Lão Lý','Elder Ly reminder')}>
   <div className="kicker">{copy('LÃO LÝ NHẮC KHẼ','A GENTLE REMINDER')}</div>
   <p>{reminderMessage(dueKind,lang)}</p>
   <div className="action-row">
    <Button variant="primary" onClick={()=>respond('dismiss')}>{copy('Đã hiểu','Got it')}</Button>
    <Button variant="secondary" onClick={()=>respond('snooze')}>{copy('Nhắc sau 1 giờ','In 1 hour')}</Button>
    <Button variant="secondary" onClick={()=>respond('disable')}>{copy('Tắt loại này','Disable this type')}</Button>
   </div>
  </div>,document.body)}
 </>;
}
