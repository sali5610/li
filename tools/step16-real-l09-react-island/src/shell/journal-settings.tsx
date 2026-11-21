import {goBack,openRoute} from './app-router.js';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,Card,Checkbox,Field,Heading,InlineFeedback,LanguageSwitch,LiIcon,MonthCalendar,StackedActivityChart,Text} from '../../../../design-system/react/index';
import './journal-settings.css';
import {InAppReminderPanel} from './in-app-reminder-ui.js';
import {WebPushSettings} from './web-push-settings.js';
import {ConfirmNoteAction} from './detail-practice.js';

/** One authenticated app. Canonical personal-diary.js and the legacy settings
 * owners continue to own privacy, sync, import, deletion and study-mode writes.
 * These React views only consume their read-only snapshots + action ports. */
type Day={day:number;key:string;recorded:boolean;total:number;counts:number[]};
type DiaryView={
 month:string;selected:string;offset:number;days:Day[];
 totals:{recorded:number;counts:number[]};
 monthLabel:string;selectedLabel:string;
 physical:{sleep:string;move:string;rest:string};mode:string;
 checkins:string;counts:string[];dayStatus:string;consentStatus:string;
 enabled:boolean;storageError:boolean;hasRecords:boolean
};
type Mode={key:string;label:string;image:string;feedback:string};
type SettingsView={
 mode:string;modeFeedback:string;modes:Mode[];calm:boolean;mute:boolean;
 nicknames:Record<string,string>;previews:Record<string,string>;
 nicknameFeedback:string;cloudVisible:boolean;cloudChecked:boolean;
 cloudDisabled:boolean;cloudDescription:string;exportReady:boolean;
 importLoading:boolean;importError:string
};
type DiaryPort={getView:()=>DiaryView;act:(kind:string,value?:string)=>boolean|void};
type SettingsPort={getView:()=>SettingsView;act:(kind:string,key?:string,value?:string|boolean)=>void;
 setVoice:(kind:'calm'|'mute',enabled:boolean)=>boolean};
type CloudConsentPort={
 getView:()=>{visible:boolean;checked:boolean;disabled:boolean;description:string};
 set:(enabled:boolean)=>void
};
type PersonalBackupPort={
 export:()=>void;importFile:(file:File)=>Promise<boolean>;
 getView:()=>{loading:boolean;error:string}
};
type AppWindow=Window&{
 liPersonalDiary?:DiaryPort;liSettingsPort?:SettingsPort;
 liJournalCloudConsent?:CloudConsentPort;liPersonalBackup?:PersonalBackupPort;
 liLanguage?:{get:()=>string;set:(locale:'vi'|'en')=>boolean}
};
const app=window as AppWindow;
const copy=(vi:string,en:string)=>app.liLanguage?.get?.()==='en'?en:vi;

function useDiary(){
 const [view,setView]=useState<DiaryView>(()=>app.liPersonalDiary!.getView());
 useEffect(()=>{
  const refresh=()=>setView(app.liPersonalDiary!.getView());
  for(const name of ['li:diary-view-changed','li:localechange','li:personal-sync-applied'])
   window.addEventListener(name,refresh);
  return()=>{for(const name of ['li:diary-view-changed','li:localechange','li:personal-sync-applied'])
   window.removeEventListener(name,refresh);};
 },[]);
 return view;
}
export function Journal(){
 const view=useDiary();
 const act=(kind:string,value?:string)=>app.liPersonalDiary?.act(kind,value);
 const now=new Date();
 const todayKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+
  String(now.getDate()).padStart(2,'0');
 const selectedIndex=Math.max(0,view.days.findIndex(day=>day.key===view.selected));
 const chartStart=Math.min(Math.max(0,selectedIndex-6),Math.max(0,view.days.length-7));
 const chartDays=view.days.slice(chartStart,chartStart+7).map(day=>({
  date:day.key,
  lesson:day.recorded?day.counts[0]:null,
  problem:day.recorded?day.counts[1]:null,
  input:day.recorded?day.counts[2]:null
 }));
 const facts=[
  {label:copy('Ngủ đủ','Enough sleep'),value:view.physical.sleep},
  {label:copy('Vận động nhẹ','Gentle movement'),value:view.physical.move},
  {label:copy('Nghỉ ngơi','Rest'),value:view.physical.rest},
  {label:copy('Số lần Check-in','Check-ins'),value:view.checkins}
 ];
 const activityNames=[
  {name:copy('Bài','Lessons'),help:copy('Đã nộp','Submitted')},
  {name:copy('Vấn đề','Problems'),help:copy('Nhánh đã mở','Branches opened')},
  {name:'Input',help:copy('Ghi chú đã lưu','Saved inputs')}
 ];
 return <div className="section-shell li-react-journal" data-li-react-screen="dashboard">
  <div className="kicker">{copy('THEO DÕI THEO NGÀY','DAILY ACTIVITY')}</div>
  <Heading level={1} role="headline" className="display-title">{copy('Nhật Ký','Journal')}</Heading>
  <Text role="body" className="intro">{copy(
   'Xem thể trạng tự check-in, nhịp học đã áp dụng và hoạt động thực sự ghi nhận. Không phải điểm sức khỏe hay năng lực học tập.',
   'Your self-reported check-ins, study rhythm and actual activity. Not a health or learning ability score.')}</Text>
  <div className="stack-sm li-diary-layout">
   <div className="li-diary-workspace">
    <section className="li-diary-month" aria-label={copy('Lịch và hoạt động theo tháng','Month calendar and activity')}>
    <div className="kicker">{copy('LỊCH HOẠT ĐỘNG','ACTIVITY CALENDAR')}</div>
    <MonthCalendar year={Number(view.month.slice(0,4))}
     month={Number(view.month.slice(5,7))}
     selectedDate={view.selected} todayDate={todayKey}
     colorScale="activity" locale={app.liLanguage?.get?.()==='en'?'en':'vi'}
     records={view.days.filter(day=>day.recorded).map(day=>({date:day.key,count:day.total}))}
     onSelectDate={date=>act('select',date)}
     onMonthChange={(year,month)=>{
      const shown=Number(view.month.slice(0,4))*12+Number(view.month.slice(5,7));
      const next=year*12+month;
      if(next!==shown)act(next<shown?'prev':'next');
     }}/>
    <div className="li-diary-calendar-legend" aria-label={copy('Màu ô theo số hoạt động đã ghi nhận','Cell colors represent recorded activity counts')}>
     <span data-level="zero">{copy('0 hoạt động','0 activities')}</span>
     <span data-level="low">1–2</span>
     <span data-level="medium">3–6</span>
     <span data-level="high">7+</span>
    </div>
    <section className="li-diary-trend" aria-label={copy('Hoạt động 7 ngày quanh ngày chọn','Seven-day activity around selection')}>
     <div className="kicker"><LiIcon name="chart-column" size={16}/> {copy('NHỊP HOẠT ĐỘNG · 7 NGÀY','ACTIVITY RHYTHM · 7 DAYS')}</div>
     <StackedActivityChart days={chartDays} selectedDate={view.selected}
      todayDate={todayKey} onSelectDate={date=>act('select',date)}
      locale={app.liLanguage?.get?.()==='en'?'en':'vi'}/>
     <Text role="support">{copy(
      'Bài · Vấn đề · Input; ngày chưa có ghi nhận để trống, không tính thành 0.',
      'Lessons · Problems · Inputs; unrecorded days stay blank, not zero.')}</Text>
    </section>
    <Text role="support">{view.totals.recorded?
     copy('Trong ','Across ')+view.totals.recorded+copy(' ngày ghi nhận: ',' recorded days: ')+
      view.totals.counts[0]+copy(' bài · ',' lessons · ')+view.totals.counts[1]+
      copy(' vấn đề · ',' problems · ')+view.totals.counts[2]+' input.':
      copy('Tháng này chưa có dữ liệu được ghi nhận.','No recorded journal data this month.')}</Text>

   </section>
   <section className="li-diary-detail" aria-label={copy('Chi tiết ngày','Daily details')}>
    <Heading level={2} role="titleLarge">{view.selectedLabel}</Heading>
    <div className="li-diary-day-grid">
     <section className="li-diary-panel"><div className="kicker">01 · {copy('CHECK-IN THỂ TRẠNG','SELF CHECK-IN')}</div>
      <div className="li-diary-facts">{facts.map(fact=><div key={fact.label}>
       <span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div>
     </section>
     <section className="li-diary-panel"><div className="kicker">02 · {copy('NHỊP HỌC','STUDY RHYTHM')}</div>
      <Heading level={3} role="titleMedium">{view.mode}</Heading>
      <Text role="support">{copy('Nhịp cuối cùng được áp dụng trong ngày; không đo năng lượng từ activity.',
       'Last selected rhythm of the day; not inferred from activity count.')}</Text>
      <Button variant="secondary" id="li-react-diary-checkin"
       onClick={()=>act('checkin','li-react-diary-checkin')}>
       {copy('Check-in hôm nay','Check in today')}</Button>
     </section>
    </div>
    <section className="li-diary-panel li-diary-activity"><div className="kicker">03 · {copy('HOẠT ĐỘNG THỰC TẾ','RECORDED ACTIVITY')}</div>
     <div className="li-diary-counters">{activityNames.map((item,index)=><div key={index}>
      <strong>{view.counts[index]}</strong><span>{item.name}</span><small>{item.help}</small>
     </div>)}</div>
     <Text role="support" aria-live="polite">{view.dayStatus}</Text>
    </section>
   </section>
  </div>

   <Card variant="tinted" className="li-diary-privacy">
    <div><div className="kicker">{copy('QUYỀN RIÊNG TƯ','PRIVACY')}</div>
     <Heading level={2} role="titleMedium">{copy('Lưu trên thiết bị','Device-first storage')}</Heading>
     <Text role="support" aria-live="polite">{view.consentStatus}</Text>
    </div>
    {view.storageError&&<InlineFeedback tone="error" message={copy(
     'Không thể đọc hoặc ghi lịch. Đã dừng ghi mới để bảo vệ dữ liệu.',
     'Journal storage cannot be read or written; recording is paused.')}/>}
    <div className="action-row">
     <Button variant="primary" disabled={view.storageError}
      onClick={()=>act('consent')}>{view.enabled?copy('Dừng ghi mới','Pause recording'):
       copy('Bật lưu lịch','Resume recording')}</Button>
     {!view.storageError&&view.hasRecords&&<ConfirmNoteAction danger
      label={copy('Xóa lịch','Delete history')}
      confirmLabel={copy('Xóa lịch','Delete history')}
      description={copy('Xóa toàn bộ lịch hoạt động trên thiết bị này? Bạn có 7 giây để hoàn tác.',
       'Delete all activity history on this device? Undo is available for 7 seconds.')}
      onConfirm={()=>app.liPersonalDiary?.act('deleteConfirmed')===true}/>}
     {(view.storageError||!view.hasRecords)&&<Button variant="secondary" disabled>
      {copy('Xóa lịch','Delete history')}</Button>}
    </div>
    <Text role="support">{copy(
     'Dữ liệu lưu trên thiết bị trước. Chỉ đồng bộ Nhật Ký & Check-in lên Neon khi bật quyền trong Cài đặt → Dữ liệu của bạn. Dừng ghi không xóa lịch cũ; Xóa lịch có xác nhận và hoàn tác.',
     'Saved on device first. Cloud replication requires separate consent in Settings → Your Data. Pausing keeps history; deletion requires confirmation and supports Undo.')}</Text>
   </Card>
  </div>
 </div>;
}
function useSettings(){
 const [view,setView]=useState<SettingsView>(()=>app.liSettingsPort!.getView());
 useEffect(()=>{
  const refresh=()=>setView(app.liSettingsPort!.getView());
  const events=['li:settings-view-changed','li:study-mode-applied','li:localechange',
   'li:personal-sync-applied','li:private-sync-consent','li:journal-cloud-view-changed'];
  for(const name of events)window.addEventListener(name,refresh);
  return()=>{for(const name of events)window.removeEventListener(name,refresh);};
 },[]);
 return view;
}
function BuddyName({kind,header,placeholder,value,preview,commit}:{
 kind:string;header:string;placeholder:string;value:string;preview:string;
 commit:(kind:string,value:string,final?:boolean)=>void
}){
 const [draft,setDraft]=useState(value);
 // Preview normalizes whitespace; keep the raw draft so a space between words
 // cannot be erased by a React read-back before the learner finishes typing.
 const normalizeDraft=(raw:string)=>raw.replace(/[\u0000-\u001f\u007f]/g,' ')
  .replace(/\s+/g,' ').trim().slice(0,24);
 useEffect(()=>{if(normalizeDraft(draft)!==value)setDraft(value);},[value]);
 return <div className="buddy-address-field li-react-address-field">
  <Field label={header} value={draft} placeholder={placeholder}
   onChange={event=>{
    const next=event.target.value.slice(0,24);
    setDraft(next);commit(kind,next);
   }}/>
  <Text role="support">{preview}</Text>
  <Button variant="ghost" className="li-react-commit" onClick={()=>{
   const clean=normalizeDraft(draft);setDraft(clean);commit(kind,clean,true);
  }}>
   {copy('Lưu cách gọi','Save nickname')}</Button>
 </div>;
}
export function Settings(){
 const view=useSettings();
 const backupInput=useRef<HTMLInputElement>(null);
 const accountHost=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  window.dispatchEvent(new CustomEvent('li:settings-account-host',{detail:{host:accountHost.current}}));
  return()=>{window.dispatchEvent(new CustomEvent('li:settings-account-host',{detail:{host:null}}));};
 },[]);
 const locale=app.liLanguage?.get?.()==='en'?'en':'vi';
 const act=(kind:string,key?:string,value?:string|boolean)=>app.liSettingsPort?.act(kind,key,value);
 const chooseBackup=()=>backupInput.current?.click();
 const importBackup=(file:File|undefined)=>{
  if(file)void app.liPersonalBackup?.importFile(file);
 };
 return <div className="section-shell li-react-settings" data-li-react-screen="settings">
  <div className="kicker">{copy('CÀI ĐẶT','SETTINGS')}</div>
  <Heading level={1} role="headline" className="display-title">{copy('Cài đặt','Settings')}</Heading>
  <Text role="body" className="intro">{copy(
   'Tùy chỉnh cách học, cách Lão Lý trò chuyện và dữ liệu của bạn.',
   'Customize learning, Lao Ly and your private data.')}</Text>
  <div className="settings-groups">
   <section className="settings-group" aria-label={copy('Cá nhân hóa','Personalization')}>
    <div className="settings-group-heading"><div className="kicker">01 · {copy('CÁ NHÂN HÓA','PERSONALIZATION')}</div>
     <Heading level={2} role="titleLarge">{copy('Trải nghiệm của bạn','Your experience')}</Heading>
     <Text role="support">{copy('Chọn nhịp học và cách trò chuyện cùng Lão Lý.',
      'Choose a study rhythm and how Lao Ly speaks.')}</Text>
    </div>
    <div className="settings-group-grid">
     <Card variant="raised" className="li-react-setting-card li-react-language-card">
      <div className="kicker">{copy('NGÔN NGỮ TOÀN APP','APP LANGUAGE')}</div>
      <Heading level={2} role="titleMedium">{copy('Ngôn ngữ','Language')}</Heading>
      <Text role="support">{copy(
       'Một lựa chọn cho toàn bộ giao diện và các bài đã có bản song ngữ. Nội dung chưa dịch giữ nguyên.',
       'One choice for the whole app and bilingual lessons. Untranslated material stays in its authored language.')}</Text>
      <LanguageSwitch label={copy('Ngôn ngữ toàn ứng dụng','App language')}
       value={locale} viLabel="Tiếng Việt" enLabel="English"
       onChange={id=>app.liLanguage?.set(id)}/>

     </Card>
     <Card variant="raised" className="li-react-setting-card">
      <div className="kicker">{copy('HỌC TẬP','LEARNING')}</div>
      <Heading level={2} role="titleMedium">{copy('Nhịp học của bạn','Your study rhythm')}</Heading>
      <Text role="support">{copy('Lão Lý đồng hành theo nhịp bạn chọn.','Lao Ly adjusts to your chosen pace.')}</Text>
      <div className="ly-mode-grid" role="group" aria-label={copy('Chọn một trong bốn nhịp học','Choose a study mode')}>
       {view.modes.map(item=><button type="button" key={item.key}
        className="ly-mode-choice" aria-pressed={item.key===view.mode}
        onClick={()=>act('mode',item.key)}>
        <img src={item.image} alt="" width="42" height="42"/>
        <span>{item.label}</span></button>)}
      </div>
      <Text role="support" aria-live="polite" className="state-note">{view.modeFeedback}</Text>
     </Card>
     <Card variant="raised" className="li-react-setting-card li-react-companion-card">
      <div className="kicker">{copy('NGƯỜI ĐỒNG HÀNH','COMPANION')}</div>
      <div className="settings-buddy-heading">
       <Heading level={2} role="titleMedium">Lão Lý</Heading>
       <img className="settings-buddy-illustration" src="./assets/laoly-mirror-suy-nghi.png"
        alt="" aria-hidden="true" loading="lazy" decoding="async"/>
      </div>
      <Text role="body">{copy('Lão hơi tự phụ, đãng trí và có thể nhận sai khi bị phản bác bằng lý lẽ hợp lệ.',
       'A proud, forgetful mentor who can change his mind when you bring sound reasoning.')}</Text>
      <Checkbox label={copy('Giọng Dịu — bớt cà khịa','Gentle voice — less teasing')}
       checked={view.calm} onChange={event=>app.liSettingsPort?.setVoice('calm',event.target.checked)}/>
      <Checkbox label={copy('Im Lặng — tắt lời thoại','Silence — mute companion dialogue')}
       checked={view.mute} onChange={event=>app.liSettingsPort?.setVoice('mute',event.target.checked)}/>
      <div className="buddy-address-settings">
       <Heading level={3} role="titleSmall">{copy('Lão gọi bạn thế nào?','How should Lao Ly address you?')}</Heading>
       <Text role="support">{copy('Để trống để dùng cách gọi mặc định.','Leave blank to use the default address.')}</Text>
       <div className="buddy-address-grid">
        <BuddyName kind="warm" header={copy('Thân tình','Warm')} placeholder="Tiểu hữu"
         value={view.nicknames.warm||''} preview={view.previews.warm||''}
         commit={(kind,value,done)=>act(done?'nicknameCommit':'nicknameInput',kind,value)}/>
        <BuddyName kind="teasing" header={copy('Cà khịa','Teasing')} placeholder="Nhóc"
         value={view.nicknames.teasing||''} preview={view.previews.teasing||''}
         commit={(kind,value,done)=>act(done?'nicknameCommit':'nicknameInput',kind,value)}/>
        <BuddyName kind="serious" header={copy('Nghiêm nghị','Serious')} placeholder="Ngươi"
         value={view.nicknames.serious||''} preview={view.previews.serious||''}
         commit={(kind,value,done)=>act(done?'nicknameCommit':'nicknameInput',kind,value)}/>
       </div>
       <Text role="support" aria-live="polite">{view.nicknameFeedback}</Text>
       <Button variant="secondary" onClick={()=>act('resetNames')}>
        {copy('Dùng cách gọi mặc định','Reset to default')}</Button>
      </div>
     </Card>
    </div>
   </section>
   <section className="settings-group" aria-label={copy('Nhắc nhở','Reminders')}>
    <div className="settings-group-heading"><div className="kicker">02 · {copy('NHẮC NHỞ','REMINDERS')}</div>
     <Heading level={2} role="titleLarge">{copy('Lời nhắc','Reminders')}</Heading>
    </div>
    <div className="li-reminder-channel-stack"><InAppReminderPanel/><WebPushSettings/></div>
   </section>
   <section className="settings-group" aria-label={copy('Dữ liệu & riêng tư','Data & privacy')}>
    <div className="settings-group-heading"><div className="kicker">03 · {copy('DỮ LIỆU & RIÊNG TƯ','DATA & PRIVACY')}</div>
     <Heading level={2} role="titleLarge">{copy('Dữ liệu của bạn','Your data')}</Heading>
     <Text role="support">{copy('Quản lý đồng bộ, bản sao và quyền riêng tư.',
      'Manage sync, backups and privacy.')}</Text>
    </div>
    <div className="settings-group-grid">
     <Card variant="raised" className="li-react-setting-card li-react-account-card">
      <div className="kicker">{copy('TÀI KHOẢN & ĐỒNG BỘ','ACCOUNT & SYNC')}</div>
      <Heading level={3} role="titleMedium">{copy('Đăng nhập & tiến độ','Sign-in & progress')}</Heading>
      <div id="li-account-settings-host" ref={accountHost}/>
     </Card>
     <Card variant="raised" className="li-react-setting-card li-react-backup-card">
      <div className="kicker">{copy('SAO LƯU MỘT PHẦN','PARTIAL BACKUP')}</div>
      <Heading level={3} role="titleMedium">{copy('Ghi chú & Dấu Trang','Notes & Bookmarks')}</Heading>
      <div className="path-list">
       <div className="path-item"><div><strong>{copy('Lưu trên thiết bị','Local-first storage')}</strong>
        <Text role="support">{copy('Dữ liệu được lưu trước tiên trong trình duyệt này.',
         'Data is first stored in this browser.')}</Text></div></div>
       <div className="path-item"><div><strong>{copy('Đồng bộ giữa các thiết bị','Cross-device sync')}</strong>
        <Text role="support">{copy('Dữ liệu được phép sẽ đồng bộ với tài khoản Neon khi kết nối. Trạng thái đồng bộ ở ngay bên dưới.',
         'Eligible data syncs through your Neon account when connected. See the sync status below.')}</Text></div></div>
       {view.cloudVisible&&<div className="path-item li-react-journal-cloud">
        <Checkbox label={copy('Đồng bộ Nhật Ký & Check-in lên Neon',
         'Sync Journal & Check-ins to Neon')}
         checked={view.cloudChecked} disabled={view.cloudDisabled}
         onChange={event=>app.liJournalCloudConsent?.set(event.target.checked)}/>
        <Text role="support" aria-live="polite">{view.cloudDescription}</Text>
       </div>}
      </div>
      <div className="settings-data-actions">
       <Button variant="secondary" onClick={()=>app.liPersonalBackup?.export()}
        disabled={!view.exportReady||view.importLoading}>
        <LiIcon name="archive" size={18}/> {copy('Xuất ghi chú (.json)','Export notes (.json)')}</Button>
       <Button variant="secondary" onClick={chooseBackup} disabled={view.importLoading}>
        {copy('Nhập ghi chú (.json)','Import notes (.json)')}</Button>
       <input ref={backupInput} type="file" className="visually-hidden-file"
        accept=".json,application/json" aria-label={copy('Chọn tệp ghi chú JSON li.','Choose a li. notes JSON file')}
        onChange={event=>{
         importBackup(event.currentTarget.files?.[0]);
         event.currentTarget.value='';
        }}/>
      </div>
      {view.importLoading&&<InlineFeedback tone="loading" message={copy(
       'Đang đọc và kiểm tra bản sao…','Reading and checking the backup…')}/>}
      {view.importError&&<InlineFeedback tone="error" message={view.importError}
       actionLabel={copy('Chọn tệp khác','Choose another file')}
       onAction={chooseBackup}/>}
      <Text role="support">{copy(
       'Tệp JSON chỉ gồm Bút Ký, Ý đã nhặt, Dấu Trang và tên gọi Lão Lý; bản nháp legacy nếu có. KHÔNG gồm Nhật Ký, Check-in, tiến độ học, lịch ôn Thần Chú, lịch nhắc hay toàn bộ cài đặt. Bản nháp Nhặt Ý chưa lưu có thể vắng mặt.',
       'This JSON includes case notes, captured ideas, bookmarks, Lao Ly nicknames and any legacy draft. It does NOT include Journal, Check-ins, learning progress, spell review schedules, reminders or all settings. Unsaved React Capture drafts may be missing.')}</Text>
     <Text role="support">{copy(
      'Nhập tệp thay thế ghi chú và Dấu Trang hiện có sau khi xác nhận. Đây không phải bản sao toàn bộ tài khoản trước khi xóa dữ liệu máy.',
      'Import replaces existing notes and bookmarks after confirmation. This is not a complete account backup before clearing device data.')}</Text>
     </Card>
     <Card variant="raised" className="li-react-setting-card li-react-privacy-card">
      <div className="kicker">{copy('QUYỀN RIÊNG TƯ','PRIVACY')}</div>
      <Heading level={3} role="titleMedium">{copy('Kiểm soát thuộc về bạn','You stay in control')}</Heading>
      <Text role="body">{copy(
       'Nhật Ký chỉ đồng bộ cloud khi được cho phép riêng. Ghi chép không tự gửi đến AI bên ngoài. Đăng xuất ngay trong Cài đặt.',
       'Journal cloud sync requires separate permission. Notes are not automatically sent to an external AI. Sign out here in Settings.')}</Text>
     </Card>
    </div>
   </section>
  </div>
 </div>;
}
export function mountJournalAndSettings(){
 const native=window as Window&{
  liReactDiaryMounted?:boolean;
  liPersonalDiary?:{refreshNative?:()=>void}
 };
 const screens=[{route:'dashboard',ui:<Journal/>},{route:'settings',ui:<Settings/>}];
 const slots=screens.map(({route,ui})=>{
  const page=document.getElementById('page-'+route);
  const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
  if(!page||!legacy)throw Error('REACT_'+route.toUpperCase()+'_ROOT_MISSING');
  return {route,page,legacy,ui};
 });
 if(!app.liPersonalDiary||!app.liSettingsPort)throw Error('PRIVATE_REACT_PORTS_MISSING');
 let mounted=false;
 let cleanup:(()=>void)|null=null;
 const update=()=>{
  const permitted=document.documentElement.classList.contains('li-auth-verified');
  if(permitted&&!mounted){
   const roots=slots.map(({route,page,legacy,ui})=>{
    const host=document.createElement('div');
    host.id='li-react-'+route+'-host';page.append(host);
    const root=createRoot(host);root.render(ui);
    legacy.hidden=true;legacy.style.display='none';
    return {root,host,legacy};
   });
   native.liReactDiaryMounted=true;
   mounted=true;cleanup=()=>{
    native.liReactDiaryMounted=false;
    roots.forEach(({root,host,legacy})=>{
     root.unmount();host.remove();legacy.hidden=false;legacy.style.removeProperty('display');
    });
    native.liPersonalDiary?.refreshNative?.();
   };
  }else if(!permitted&&mounted){cleanup?.();cleanup=null;mounted=false;}
 };
 const observer=new MutationObserver(update);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 update();
 return()=>{observer.disconnect();cleanup?.();};
}
