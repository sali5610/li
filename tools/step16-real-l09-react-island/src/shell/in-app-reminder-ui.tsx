import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Button,Card,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';
import {
 DEFAULT_REMINDER,REMINDER_KEY,dueInApp,localDay,readReminderDelivery,
 readReminderPreference,validTime,writeReminderDelivery,writeReminderPreference,
 type ReminderKind,type ReminderPreference
} from './in-app-reminder.js';

const OWNER='li.sync.local-owner.v1';
const kinds:readonly {id:ReminderKind;vi:string;en:string}[]=[
 {id:'study',vi:'Quay lại bài đang học',en:'Return to learning'},
 {id:'sleep',vi:'Chuẩn bị nghỉ ngơi, ngủ đủ',en:'Prepare for sleep'},
 {id:'movement',vi:'Đổi tư thế, vận động nhẹ',en:'Take a movement break'},
 {id:'rest',vi:'Nghỉ một nhịp',en:'Take a rest'}
];
function uid():string{
 if(!document.documentElement.classList.contains('li-auth-verified'))return '';
 return localStorage.getItem(OWNER)||'';
}
function vi(){return (window as Window&{liLanguage?:{get?:()=>string}}).liLanguage?.get?.()!=='en';}
function reminderCopy(kind:ReminderKind,vietnamese:boolean):string{
 const messages={
  study:['Bài đang học vẫn ở đây. Khi muốn, quay lại đúng chỗ đang dở.',
   'Your lesson is still here. Resume whenever you like.'],
  sleep:['Nếu sắp đi ngủ, mày có thể dành chút thời gian thư giãn trước giờ nghỉ.',
   'If bedtime is near, consider winding down.'],
  movement:['Ngồi lâu rồi? Đổi tư thế hoặc vận động nhẹ khi tiện cũng được.',
   'Been sitting a while? Change position or move a little if convenient.'],
  rest:['Nghỉ cũng được. Khi sẵn sàng, quay lại đúng chỗ đang dở.',
   'It is okay to rest. Your progress will be here when you return.']
 };
 return messages[kind][vietnamese?0:1];
}
/** Only renders for an authenticated owner. No OS push permission or fake closed-app timer. */
export function InAppReminderPanel(){
 const [pref,setPref]=useState<ReminderPreference>(()=>readReminderPreference());
 const [draft,setDraft]=useState<ReminderPreference>(()=>readReminderPreference());
 const [due,setDue]=useState(false);
 const [error,setError]=useState('');
 const [lang,setLang]=useState(vi);
 const translated=(v:string,en:string)=>lang?v:en;
 useEffect(()=>{
  const check=()=>{
   const account=uid();
   if(!account||document.visibilityState==='hidden'){setDue(false);return;}
   const current=readReminderPreference();
   setDue(dueInApp(current,readReminderDelivery(account),new Date()));
  };
  const settingsChanged=()=>{
   const value=readReminderPreference();
   setPref(value);setDraft(value);check();
  };
  const syncChanged=(event:Event)=>{
   const keys=(event as CustomEvent<{keys?:string[]}>).detail?.keys;
   if(!keys||keys.includes(REMINDER_KEY))settingsChanged();
  };
  const locale=()=>setLang(vi());
  check();
  const interval=setInterval(check,60_000);
  window.addEventListener('focus',check);
  window.addEventListener('pageshow',check);
  window.addEventListener('li:reminder-preference-changed',settingsChanged);
  window.addEventListener('li:personal-sync-applied',syncChanged);
  window.addEventListener('li:localechange',locale);
  document.addEventListener('visibilitychange',check);
  return()=>{
   clearInterval(interval);
   window.removeEventListener('focus',check);
   window.removeEventListener('pageshow',check);
   window.removeEventListener('li:reminder-preference-changed',settingsChanged);
   window.removeEventListener('li:personal-sync-applied',syncChanged);
   window.removeEventListener('li:localechange',locale);
   document.removeEventListener('visibilitychange',check);
  };
 },[]);
 function save(enabled:boolean){
  const account=uid();
  if(!account){setError(translated('Cần đăng nhập trước.','Sign in first.'));return;}
  if(enabled&&!validTime(draft.time)){
   setError(translated('Chọn giờ trước khi bật lời nhắc.','Choose a time before enabling.'));return;
  }
  try{
   const next:ReminderPreference={version:1,kind:draft.kind,time:draft.time,enabled};
   if(enabled&&(!pref.enabled||pref.time!==next.time||pref.kind!==next.kind)){
    const now=new Date(),[h,m]=next.time.split(':').map(Number);
    const scheduled=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m);
    // Enabling an already elapsed clock time must not immediately interrupt the learner.
    if(now.getTime()>=scheduled.getTime())
     writeReminderDelivery(account,{lastDay:localDay(now),snoozedUntil:0});
   }
   writeReminderPreference(next);
   setPref(next);setDraft(next);setDue(false);setError('');
  }catch{setError(translated('Không lưu được lời nhắc trên thiết bị.','Cannot save the reminder on this device.'));}
 }
 function respond(action:'dismiss'|'snooze'|'disable'){
  const account=uid();
  if(!account){setDue(false);return;}
  try{
   if(action==='disable'){
    writeReminderPreference({...readReminderPreference(),enabled:false});
   }
   const now=new Date();
   writeReminderDelivery(account,{
    lastDay:action==='snooze'?'':localDay(now),
    snoozedUntil:action==='snooze'?now.getTime()+60*60*1000:0
   });
   setDue(false);setError('');
  }catch{setError(translated('Không lưu được lựa chọn.','Cannot save your choice.'));}
 }
 return <>
  <Card variant="raised" className="li-react-setting-card li-reminder-settings">
   <Heading level={3} role="titleMedium">{translated('Nhắc nhở trong app','In-app reminders')}</Heading>
   <Text role="support">{translated(
    'Mặc định tắt. Chọn một lời nhắc và giờ của mày. Chỉ hiện khi li. đang mở (tối đa một lần/ngày); không phải thông báo đẩy khi đóng app.',
    'Off by default. Choose one reminder and your own time. Only shown while li. is open (at most once a day); not background push.')}</Text>
   <div className="li-reminder-inputs">
    <label htmlFor="li-reminder-kind">{translated('Muốn được nhắc gì?','Reminder type')}</label>
    <select id="li-reminder-kind" value={draft.kind}
     onChange={e=>setDraft(value=>({...value,kind:e.currentTarget.value as ReminderKind}))}>
     {kinds.map(item=><option key={item.id} value={item.id}>{lang?item.vi:item.en}</option>)}
    </select>
    <label htmlFor="li-reminder-time">{translated('Giờ địa phương','Local time')}</label>
    <input id="li-reminder-time" type="time" value={draft.time}
     onChange={e=>setDraft(value=>({...value,time:e.currentTarget.value}))}/>
   </div>
   <div className="action-row">
    <Button variant="primary" disabled={!validTime(draft.time)}
     onClick={()=>save(true)}>{pref.enabled?translated('Lưu thay đổi','Save changes'):
      translated('Bật nhắc','Enable reminder')}</Button>
    {pref.enabled&&<Button variant="secondary" onClick={()=>save(false)}>
     {translated('Tắt nhắc','Disable')}</Button>}
   </div>
   <Text role="support" aria-live="polite">{pref.enabled?
    translated('Đang bật · ', 'Enabled · ')+
    (lang?kinds.find(k=>k.id===pref.kind)?.vi:kinds.find(k=>k.id===pref.kind)?.en)+
    ' · '+pref.time:
    translated('Chưa bật nhắc nhở.','Reminders are off.')}</Text>
   {error&&<InlineFeedback tone="error" message={error}/>}
  </Card>
  {due&&createPortal(<div className="li-in-app-reminder" role="status" aria-live="polite"
    aria-label={translated('Lời nhắc của Lão Lý','Lao Ly reminder')}>
   <div className="kicker">{translated('LÃO LÝ NHẮC KHẼ','A GENTLE REMINDER')}</div>
   <p>{reminderCopy(pref.kind,lang)}</p>
   <div className="action-row">
    <Button variant="primary" onClick={()=>respond('dismiss')}>
     {translated('Đã hiểu','Got it')}</Button>
    <Button variant="secondary" onClick={()=>respond('snooze')}>
     {translated('Nhắc sau 1 giờ','In 1 hour')}</Button>
    <Button variant="secondary" onClick={()=>respond('disable')}>
     {translated('Tắt nhắc','Turn off')}</Button>
   </div>
  </div>,document.body)}
 </>;
}
