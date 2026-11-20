import {goBack,openRoute} from './app-router.js';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,Card,Checkbox,Field,Heading,InlineFeedback,LiIcon,Text} from '../../../../design-system/react/index';
import './journal-settings.css';

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
type DiaryPort={getView:()=>DiaryView;act:(kind:string,value?:string)=>void};
type SettingsPort={getView:()=>SettingsView;act:(kind:string,key?:string,value?:string|boolean)=>void};
type AppWindow=Window&{
 liPersonalDiary?:DiaryPort;liSettingsPort?:SettingsPort;
 liLanguage?:{get:()=>string}
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
function DiaryDate({item,selected,onClick}:{
 item:Day;selected:boolean;onClick:()=>void
}){
 const label=copy(
  item.key+': '+(item.recorded?item.total+' hoạt động':'chưa ghi nhận'),
  item.key+': '+(item.recorded?item.total+' activities':'no journal record')
 );
 return <button className={'li-diary-date'+(item.recorded?' recorded':'')+(selected?' selected':'')}
  type="button" aria-pressed={selected} aria-label={label} onClick={onClick}>
  {item.day}{item.recorded?<span className="li-diary-dot" aria-hidden="true">{item.total}</span>:null}
 </button>;
}
function DiaryBar({item,max,selected,onClick}:{
 item:Day;max:number;selected:boolean;onClick:()=>void
}){
 const height=item.recorded?(item.total===0?'4px':Math.max(12,Math.round(item.total/max*100))+'%'):'0';
 return <button type="button" className={'li-diary-bar-day'+(selected?' selected':'')}
  aria-label={item.key+': '+(item.recorded?item.total+' hoạt động':'chưa ghi nhận')}
  aria-pressed={selected} onClick={onClick}>
  <span className="li-diary-bar-track" aria-hidden="true">
   <span className={'li-diary-bar-value'+(item.recorded?' recorded':'')}
    style={{height}}/></span>
  <span className="li-diary-bar-label">{item.day}</span>
  <span className="li-diary-bar-total">{item.recorded?item.total:'—'}</span>
 </button>;
}
export function Journal(){
 const view=useDiary();
 const act=(kind:string,value?:string)=>app.liPersonalDiary?.act(kind,value);
 const max=Math.max(1,...view.days.map(day=>day.total));
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
  <Button variant="ghost" onClick={()=>openRoute('library')} className="library-back-link">
   <LiIcon name="chevron-left" size={18}/> {copy('Tủ Riêng','Private Library')}</Button>
  <div className="kicker">{copy('THEO DÕI THEO NGÀY','DAILY ACTIVITY')}</div>
  <Heading level={1} role="headline" className="display-title">{copy('Nhật Ký','Journal')}</Heading>
  <Text role="body" className="intro">{copy(
   'Xem thể trạng tự check-in, nhịp học đã áp dụng và hoạt động thực sự ghi nhận. Không phải điểm sức khỏe hay năng lực học tập.',
   'Your self-reported check-ins, study rhythm and actual activity. Not a health or learning ability score.')}</Text>
  <div className="stack-sm li-diary-layout">
   <Card variant="raised" className="li-diary-month">
    <div className="li-diary-month-heading">
     <div><div className="kicker">{copy('LỊCH HOẠT ĐỘNG','ACTIVITY CALENDAR')}</div>
      <Heading level={2} role="titleLarge">{view.monthLabel}</Heading></div>
     <div className="action-row">
      <Button variant="secondary" aria-label={copy('Tháng trước','Previous month')}
       onClick={()=>act('prev')}><LiIcon name="chevron-left" size={18}/></Button>
      <Button variant="secondary" aria-label={copy('Tháng sau','Next month')}
       onClick={()=>act('next')}><LiIcon name="chevron-right" size={18}/></Button>
     </div>
    </div>
    <div className="li-diary-weekdays" aria-hidden="true">
     {(app.liLanguage?.get?.()==='en'?['M','T','W','T','F','S','S']:
      ['T2','T3','T4','T5','T6','T7','CN']).map((label,i)=><span key={i}>{label}</span>)}
    </div>
    <div className="li-diary-calendar" role="group" aria-label={copy('Chọn ngày trong tháng','Select a day')}>
     {Array.from({length:view.offset},(_,i)=><span className="li-diary-blank" key={'blank-'+i} aria-hidden="true"/>)}
     {view.days.map(day=><DiaryDate key={day.key} item={day} selected={view.selected===day.key}
      onClick={()=>act('select',day.key)}/>)}
    </div>
    <Text role="support">{view.totals.recorded?
     copy('Trong ','Across ')+view.totals.recorded+copy(' ngày ghi nhận: ',' recorded days: ')+
      view.totals.counts[0]+copy(' bài · ',' lessons · ')+view.totals.counts[1]+
      copy(' vấn đề · ',' problems · ')+view.totals.counts[2]+' input.':
      copy('Tháng này chưa có dữ liệu được ghi nhận.','No recorded journal data this month.')}</Text>
    <div className="kicker">{copy('SỐ HOẠT ĐỘNG TỪNG NGÀY','DAILY ACTIVITY TOTALS')}</div>
    <div className="li-diary-bars" role="group" aria-label={copy('Biểu đồ hoạt động theo ngày','Daily activity chart')}>
     {view.days.map(day=><DiaryBar key={day.key} item={day} max={max}
      selected={view.selected===day.key} onClick={()=>act('select',day.key)}/>)}
    </div>
    <Text role="support">{copy(
     'Cột = Bài + Vấn đề + Input. Ngày chưa ghi nhận để trống, không tính thành 0.',
     'Bars show lessons + problems + inputs. Missing records are blank, not zero.')}</Text>
   </Card>
   <section className="li-diary-detail" aria-label={copy('Chi tiết ngày','Daily details')}>
    <Heading level={2} role="titleLarge">{view.selectedLabel}</Heading>
    <div className="surface-grid cols2">
     <Card variant="raised"><div className="kicker">01 · {copy('CHECK-IN THỂ TRẠNG','SELF CHECK-IN')}</div>
      <div className="li-diary-facts">{facts.map(fact=><div key={fact.label}>
       <span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div>
     </Card>
     <Card variant="raised"><div className="kicker">02 · {copy('NHỊP HỌC','STUDY RHYTHM')}</div>
      <Heading level={3} role="titleMedium">{view.mode}</Heading>
      <Text role="support">{copy('Nhịp cuối cùng được áp dụng trong ngày; không đo năng lượng từ activity.',
       'Last selected rhythm of the day; not inferred from activity count.')}</Text>
      <Button variant="secondary" onClick={()=>act('checkin')}>
       {copy('Check-in hôm nay','Check in today')}</Button>
     </Card>
    </div>
    <Card variant="raised"><div className="kicker">03 · {copy('HOẠT ĐỘNG THỰC TẾ','RECORDED ACTIVITY')}</div>
     <div className="li-diary-counters">{activityNames.map((item,index)=><div key={index}>
      <strong>{view.counts[index]}</strong><span>{item.name}</span><small>{item.help}</small>
     </div>)}</div>
     <Text role="support" aria-live="polite">{view.dayStatus}</Text>
    </Card>
   </section>
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
     <Button variant="secondary" disabled={view.storageError||!view.hasRecords}
      onClick={()=>act('delete')}>{copy('Xóa lịch','Delete history')}</Button>
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
  const legacy=document.querySelector('#page-settings > .section-shell');
  const observer=legacy?new MutationObserver(refresh):null;
  if(legacy)observer?.observe(legacy,{
   subtree:true,characterData:true,childList:true,attributes:true,
   attributeFilter:['hidden','disabled','checked','aria-pressed']
  });
  for(const name of ['li:settings-view-changed','li:study-mode-applied','li:localechange',
   'li:personal-sync-applied','li:private-sync-consent'])window.addEventListener(name,refresh);
  return()=>{
   observer?.disconnect();
   for(const name of ['li:settings-view-changed','li:study-mode-applied','li:localechange',
    'li:personal-sync-applied','li:private-sync-consent'])window.removeEventListener(name,refresh);
  };
 },[]);
 return view;
}
function BuddyName({kind,header,placeholder,value,preview,commit}:{
 kind:string;header:string;placeholder:string;value:string;preview:string;
 commit:(kind:string,value:string,final?:boolean)=>void
}){
 const [draft,setDraft]=useState(value);
 useEffect(()=>setDraft(value),[value]);
 return <div className="buddy-address-field li-react-address-field">
  <Field label={header} value={draft} placeholder={placeholder}
   onChange={event=>{
    const next=event.target.value.slice(0,24);
    setDraft(next);commit(kind,next);
   }}/>
  <Text role="support">{preview}</Text>
  <button type="button" className="li-react-commit" onClick={()=>commit(kind,draft,true)}>
   {copy('Lưu cách gọi','Save nickname')}</button>
 </div>;
}
export function Settings(){
 const view=useSettings();
 const act=(kind:string,key?:string,value?:string|boolean)=>app.liSettingsPort?.act(kind,key,value);
 return <div className="section-shell li-react-settings" data-li-react-screen="settings">
  <Button variant="ghost" className="library-back-link" onClick={goBack}>
   <LiIcon name="chevron-left" size={18}/> {copy('Quay lại','Back')}</Button>
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
     <Card variant="raised" className="li-react-setting-card">
      <div className="kicker">{copy('NGƯỜI ĐỒNG HÀNH','COMPANION')}</div>
      <div className="settings-buddy-heading">
       <Heading level={2} role="titleMedium">Lão Lý</Heading>
       <img className="settings-buddy-illustration" src="./assets/laoly-mirror-suy-nghi.png"
        alt="" aria-hidden="true" loading="lazy" decoding="async"/>
      </div>
      <Text role="body">{copy('Lão hơi tự phụ, đãng trí và có thể nhận sai khi bị phản bác bằng lý lẽ hợp lệ.',
       'A proud, forgetful mentor who can change his mind when you bring sound reasoning.')}</Text>
      <Checkbox label={copy('Giọng Dịu — bớt cà khịa','Gentle voice — less teasing')}
       checked={view.calm} onChange={event=>act('calm',undefined,event.target.checked)}/>
      <Checkbox label={copy('Im Lặng — tắt lời thoại','Silence — mute companion dialogue')}
       checked={view.mute} onChange={event=>act('mute',undefined,event.target.checked)}/>
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
    <Card variant="raised" className="li-react-setting-card">
     <Heading level={3} role="titleMedium">{copy('Nhắc nhở riêng','Personal reminders')}</Heading>
     <Text role="support">{copy('Nhắc nghỉ, vận động và lịch ngủ vẫn là tính năng dự kiến.',
      'Rest, movement and sleep reminders are not available yet.')}</Text>
     <InlineFeedback tone="info" message={copy(
      'Chưa thể bật thông báo trên thiết bị. Không có công tắc giả.',
      'Device notifications are not available yet; no pretend toggle.')}/>
    </Card>
   </section>
   <section className="settings-group" aria-label={copy('Dữ liệu & riêng tư','Data & privacy')}>
    <div className="settings-group-heading"><div className="kicker">03 · {copy('DỮ LIỆU & RIÊNG TƯ','DATA & PRIVACY')}</div>
     <Heading level={2} role="titleLarge">{copy('Dữ liệu của bạn','Your data')}</Heading>
     <Text role="support">{copy('Quản lý đồng bộ, bản sao và quyền riêng tư.',
      'Manage sync, backups and privacy.')}</Text>
    </div>
    <div className="settings-group-grid">
     <Card variant="raised" className="li-react-setting-card">
      <div className="kicker">{copy('SAO LƯU','BACKUP')}</div>
      <Heading level={3} role="titleMedium">{copy('Dữ liệu trên thiết bị','Device data')}</Heading>
      <div className="path-list">
       <div className="path-item"><div><strong>{copy('Lưu trên thiết bị','Local-first storage')}</strong>
        <Text role="support">{copy('Dữ liệu được lưu trước tiên trong trình duyệt này.',
         'Data is first stored in this browser.')}</Text></div></div>
       <div className="path-item"><div><strong>{copy('Đồng bộ giữa các thiết bị','Cross-device sync')}</strong>
        <Text role="support">{copy('Dữ liệu được phép sẽ đồng bộ với tài khoản Neon khi kết nối. Trạng thái chi tiết ở Tài khoản.',
         'Eligible data syncs through your Neon account when connected. See Account for status.')}</Text></div></div>
       {view.cloudVisible&&<div className="path-item li-react-journal-cloud">
        <Checkbox label={copy('Đồng bộ Nhật Ký & Check-in lên Neon',
         'Sync Journal & Check-ins to Neon')}
         checked={view.cloudChecked} disabled={view.cloudDisabled}
         onChange={event=>act('cloud',undefined,event.target.checked)}/>
        <Text role="support" aria-live="polite">{view.cloudDescription}</Text>
       </div>}
      </div>
      <div className="settings-data-actions">
       <Button variant="secondary" onClick={()=>act('export')} disabled={!view.exportReady}>
        <LiIcon name="archive" size={18}/> {copy('Xuất bản sao','Export backup')}</Button>
       <Button variant="secondary" onClick={()=>act('import')}>
        {copy('Nhập bản sao','Import backup')}</Button>
      </div>
      {view.importLoading&&<InlineFeedback tone="loading" message={copy(
       'Đang đọc và kiểm tra bản sao…','Reading and checking the backup…')}/>}
      {view.importError&&<InlineFeedback tone="error" message={view.importError}
       actionLabel={copy('Chọn tệp khác','Choose another file')}
       onAction={()=>act('retryImport')}/>}
      <Text role="support">{copy(
       'Xuất bản sao trước khi đổi thiết bị hoặc xóa dữ liệu trình duyệt. Nhập bản sao dùng bộ kiểm tra dữ liệu hiện tại.',
       'Export a backup before switching devices or clearing browser data. Import uses the existing validated parser.')}</Text>
     </Card>
     <Card variant="raised" className="li-react-setting-card">
      <div className="kicker">{copy('QUYỀN RIÊNG TƯ','PRIVACY')}</div>
      <Heading level={3} role="titleMedium">{copy('Kiểm soát thuộc về bạn','You stay in control')}</Heading>
      <Text role="body">{copy(
       'Nhật Ký chỉ đồng bộ cloud khi được cho phép riêng. Ghi chép không tự gửi đến AI bên ngoài. Quản lý phiên đăng nhập trong Tài khoản.',
       'Journal cloud sync requires separate permission. Notes are not automatically sent to an external AI. Manage sign-in in Account.')}</Text>
     </Card>
    </div>
   </section>
  </div>
 </div>;
}
export function mountJournalAndSettings(){
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
   mounted=true;cleanup=()=>{
    roots.forEach(({root,host,legacy})=>{
     root.unmount();host.remove();legacy.hidden=false;legacy.style.removeProperty('display');
    });
   };
  }else if(!permitted&&mounted){cleanup?.();cleanup=null;mounted=false;}
 };
 const observer=new MutationObserver(update);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 update();
 return()=>{observer.disconnect();cleanup?.();};
}
