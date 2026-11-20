import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ActionGroup,Button,InlineFeedback,SearchField,SaveStatus,LanguageSwitch,FilterGroup,ListRow,Breadcrumb,SourceStatus,Disclosure,ActionMenu} from './index';
import type {FeedbackTone,SaveState,SourceReviewState} from './index';
import './components.css';
import './controls.css';
import './molecules.css';
import './molecules-story.css';
const params=new URLSearchParams(location.search);
const story=params.get('story')||'searchField',variant=params.get('variant')||'Info';
const state=params.get('state')||'default',en=params.get('lang')==='en';
const t=(vi:string,english:string)=>en?english:vi;
function Example(){
 const [query,setQuery]=useState(state==='query'?'học':'');
 const [submitted,setSubmitted]=useState<string|null>(null);
 const [clicks,setClicks]=useState(0);
 const [retry,setRetry]=useState(0);
 const disabled=state==='disabled';
 const [choice,setChoice]=useState<'vi'|'en'>(state==='english'?'en':'vi');
 const [selected,setSelected]=useState<string[]>(state==='selected'?['psychology']:[]);
 const [rowHits,setRowHits]=useState(0);
 const [savedState,setSavedState]=useState<SaveState>(
  ['unsaved','saving','saved-device','synced','offline','error'].includes(state)?state as SaveState:'unsaved'
 );
 if(story==='saveStatus'){
  const labels:Record<SaveState,[string,string]>={
   unsaved:['Chưa lưu (mô phỏng)','Unsaved (demo)'],
   saving:['Đang lưu (mô phỏng)','Saving (demo)'],
   'saved-device':['Đã lưu trên thiết bị (mô phỏng)','Saved on device (demo)'],
   synced:['Đã đồng bộ (mô phỏng)','Synced (demo)'],
   offline:['Chưa đồng bộ — offline (mô phỏng)','Offline — not synced (demo)'],
   error:['Lưu thất bại (mô phỏng)','Save failed (demo)']
  };
  const sequence:SaveState[]=['unsaved','saving','saved-device','synced','offline','error'];
  return <div data-story-save-status>
   <SaveStatus state={savedState} message={t(...labels[savedState])}
    detail={t('Đây chỉ là fixture, không ghi dữ liệu.','This is only a fixture; nothing is written.')}
    retryLabel={t('Thử lại','Retry')} onRetry={()=>setSavedState('saving')}/>
   <Button variant="secondary" onClick={()=>setSavedState(
    sequence[(sequence.indexOf(savedState)+1)%sequence.length])}>
    {t('Chuyển trạng thái demo','Next demo state')}
   </Button>
  </div>;
 }
 if(story==='languageSwitch')return <div data-story-language-switch>
  <LanguageSwitch value={choice} onChange={setChoice} disabled={disabled}
   label={t('Chọn ngôn ngữ minh họa','Choose demo language')}
   viLabel="Tiếng Việt" enLabel="English"/>
  <p role="status">{t('Đang chọn: ','Selected: ')}{choice==='vi'?'Tiếng Việt':'English'}</p>
 </div>;
 if(story==='filterGroup')return <div data-story-filter-group>
  <FilterGroup label={t('Bộ lọc môn thử','Demo subject filters')}
   options={[{value:'psychology',label:t('Tâm lý học','Psychology')},
    {value:'logic',label:t('Logic','Logic')},
    {value:'history',label:t('Lịch sử','History')}]}
   selected={selected} onChange={setSelected} disabled={disabled}
   multiple={variant!=='Single'} allowEmpty={true}/>
  <p role="status">{t('Số mục được chọn: ','Selected filters: ')}{selected.length}</p>
 </div>;
 if(story==='listRow')return <div data-story-list-row>
  {variant==='Link'?
   <ListRow href="#sample-topic" current={state==='selected'}
    title={t('Tâm lý học nhận thức','Cognitive psychology')}
    description={t('Tìm hiểu cách con người xử lý thông tin.','Explore how people process information.')}
    meta={t('Môn học','Subject')}/>:
   variant==='Static'?
   <ListRow title={t('Thông tin tài liệu','Document information')} meta="MDX"
    description={t('Chỉ để hiển thị, không thể bấm.','Read-only, not clickable.')}/>:
   <ListRow disabled={disabled} title={t('Mở bài đọc thử','Open example reading')}
    description={t('Hàng có thể bấm, không điều hướng thật.','Clickable row, no real navigation.')}
    onActivate={()=>setRowHits(n=>n+1)}/>}
  <p role="status">{t('Lượt bấm thử: ','Demo activations: ')}{rowHits}</p>
 </div>;
 if(story==='breadcrumb')return <div data-story-breadcrumb>
  <Breadcrumb label={t('Đường dẫn minh họa','Demo breadcrumbs')}
   items={[{label:t('Tàng Thư','Library'),href:'#library'},
    {label:t('Tâm lý học','Psychology'),href:'#psychology'},
    {label:state==='long'?t('Các yếu tố ảnh hưởng tới quá trình nhận thức và ra quyết định',
     'Factors affecting cognition and decision-making'):t('Nhận thức','Cognition')}]}/>
  <p>{t('Trang cuối là vị trí hiện tại.','The final item marks the current page.')}</p>
 </div>;


 const [disclosureOpened,setDisclosureOpened]=useState(state==='open');
 const [menuAction,setMenuAction]=useState(0);
 if(story==='sourceStatus'){
  const sourceState:SourceReviewState=(
   ['unreviewed','linked','reviewed','unavailable'].includes(state)?state:'unreviewed'
  ) as SourceReviewState;
  const labels:Record<SourceReviewState,[string,string]>={
   unreviewed:['Chưa kiểm chứng (mẫu)','Not reviewed (demo)'],
   linked:['Đã gắn nguồn (mẫu)','Source linked (demo)'],
   reviewed:['Đã kiểm tra (mẫu)','Reviewed (demo)'],
   unavailable:['Chưa có nguồn (mẫu)','Source unavailable (demo)']
  };
  return <div data-story-source-status>
   <SourceStatus title={t('Thông tin nguồn','Source information')}
    sourceLabel={t('NIST — tài liệu tham khảo minh họa','NIST — example reference')}
    href={sourceState==='unavailable'?undefined:'https://www.nist.gov/'}
    state={sourceState} statusLabel={t(...labels[sourceState])}
    detail={t('Trạng thái mẫu, không xác minh nội dung bài học.',
     'Demo status; no course content was verified.')}/>
  </div>;
 }
 if(story==='disclosure')return <div data-story-disclosure>
  <Disclosure summary={t('Đọc giải thích','Read explanation')}
   defaultOpen={state==='open'} onOpenChange={setDisclosureOpened}>
   <p>{t('Giải thích mẫu: dữ liệu học thuật phải có nguồn và liên kết rõ ràng.',
    'Example: academic content should be supported by traceable sources.')}</p>
  </Disclosure>
  <p role="status">{disclosureOpened?t('Đang mở','Expanded'):t('Đang đóng','Collapsed')}</p>
 </div>;
 if(story==='actionMenu')return <div data-story-action-menu>
  <ActionMenu label={t('Thao tác','Actions')} items={[
   {id:'details',label:t('Xem chi tiết','View details'),onSelect:()=>setMenuAction(n=>n+1)},
   {id:'guide',label:t('Mở tài liệu React','Open React docs'),href:'https://react.dev/'},
   {id:'disabled',label:t('Chưa khả dụng','Unavailable'),disabled:true}
  ]}/>
  <p role="status">{t('Lượt bấm hành động: ','Action clicks: ')}{menuAction}</p>
 </div>;

 if(story==='searchField')return <div data-story-search>
  <SearchField label={t('Tra cứu thử','Demo search')} value={query} onQueryChange={setQuery}
   onSearch={setSubmitted} disabled={disabled}
   hint={t('Không tìm trên máy chủ, không lưu nội dung.','No server search or saved query.')}
   placeholder={t('Ví dụ: nhận thức','Example: cognition')}
   clearLabel={t('Xóa truy vấn','Clear query')} submitLabel={t('Tìm thử','Try search')}/>
  <p role="status">{submitted===null?t('Chưa tìm thử','No demo query yet'):
   t('Truy vấn thử: ','Demo query: ')+(submitted||'∅')}</p>
 </div>;
 if(story==='actionGroup')return <div data-story-action-group>
  <ActionGroup label={t('Hành động minh họa','Demo actions')}>
   <Button disabled={disabled} onClick={()=>setClicks(n=>n+1)}>{t('Tiếp tục','Continue')}</Button>
   <Button disabled={disabled} variant="secondary" onClick={()=>setClicks(n=>n+1)}>{t('Xem chi tiết','View details')}</Button>
  </ActionGroup>
  <p role="status">{t('Lượt bấm demo: ','Demo clicks: ')}{clicks}</p>
 </div>;
 const tone:FeedbackTone=variant==='Error'?'error':variant==='Success'?'success':
  variant==='Loading'?'loading':'info';
 const messages={info:t('Đây là thông báo minh họa.','This is an example message.'),
 error:t('Thao tác mẫu chưa hoàn tất. Có thể thử lại.','Demo action did not finish. Retry is available.'),
 success:t('Bước minh họa hoàn tất; không ghi dữ liệu.','Example step completed; nothing was saved.'),
 loading:t('Đang trình diễn trạng thái xử lý…','Demonstrating a pending state…')};
 return <div data-story-inline-feedback>
  <InlineFeedback tone={tone} title={variant} message={messages[tone]}
   actionLabel={tone==='error'?t('Thử lại','Retry'):undefined}
   onAction={tone==='error'?()=>setRetry(n=>n+1):undefined}/>
  <p role="status">{t('Số lần thử lại: ','Demo retries: ')}{retry}</p>
 </div>;
}
function Story(){
 return <main className="li-molecules-story" data-ui-react-molecules="mounted"
  data-molecule={story} lang={en?'en':'vi'}>
  <p className="li-molecules-kicker">UX-DS-35 / STAGE05 / REACT</p>
  <h1>{({searchField:'Search Field',actionGroup:'Action Group',feedback:'Inline Feedback',saveStatus:'Save Status',languageSwitch:'Language Switch',filterGroup:'Filter Group',listRow:'List Row',breadcrumb:'Breadcrumb',sourceStatus:'Source Status',disclosure:'Disclosure',actionMenu:'Action Menu'} as Record<string,string>)[story]||'Molecule'}</h1>
  <div className="li-molecules-sample"><Example/></div>
  <p className="li-molecules-footnote">{t('Chỉ là fixture UI · Không thực hiện tìm kiếm hoặc lưu.',
  'UI fixture only · No server search or storage.')}</p>
 </main>;
}
const root=document.getElementById('react-molecules-root');
if(!root)throw Error('Missing molecules story root');
createRoot(root).render(<Story/>);
