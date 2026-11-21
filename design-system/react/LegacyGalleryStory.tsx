import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,Card,Dialog,Heading,Text} from './index';
import {MobileBottomNav,SidebarMenu,TopNavContext,LaoLyCompanion} from './LegacyNavigation';
import {EditorialCard,MethodTile,MediaCard,HorizontalCard,ChatBubble,TagChip} from './LegacyCards';
import {PortalCategoryCard} from './PortalCategoryCard';
import {SelectField,NotebookTextarea,IconField,SmallAction,ProgressVariants,
 CheckinRadioModal,FunctionalIcon} from './LegacyControls';
import type {FunctionalIconName} from './LegacyControls';
import {MonthCalendar,StackedActivityChart,LaoLyStateScene} from './LegacyDataViz';
import type {ActivityMode,CalendarRecord,ActivityBarDatum} from './LegacyDataViz';
import './atoms.css';
import './components.css';
import './controls.css';
import './dialog.css';
import './legacy.css';
import './portal-category-card.css';
import './focus.css';
import './legacy-story.css';

const params=new URLSearchParams(location.search);
const story=params.get('story')||'bottomNav';
const variant=params.get('variant')||'Default';
const state=params.get('state')||'default';
const en=params.get('lang')==='en';
if(state==='focus')document.documentElement.dataset.dsFocusDemo='true';
const t=(vi:string,english:string)=>en?english:vi;
const asset=(name:string)=>'../assets/'+name;
const selected=(input:string)=>input===variant;
const nav=[
 {id:'home',label:t('Đại Sảnh','Home'),href:'#home',icon:<FunctionalIcon name="home" size={20}/>},
 {id:'library',label:t('Tàng Thư','Library'),href:'#library',icon:<FunctionalIcon name="book-open" size={20}/>},
 {id:'methods',label:t('Thần Chú','Methods'),href:'#methods',icon:<FunctionalIcon name="sparkle" size={20}/>},
 {id:'private',label:t('Tủ Riêng','Private'),href:'#private',icon:<FunctionalIcon name="bookmark" size={20}/>}
];

const dateKey=(date:Date)=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
const today=new Date();
const todayKey=dateKey(today);

function Specimen(){
 const [hits,setHits]=useState(0);
 const [lang,setLang]=useState('vi');
 const [value,setValue]=useState('');
 const [choice,setChoice]=useState('');
 const [active,setActive]=useState(state==='selected'?'methods':story==='bottomNav'?'home':'library');
 const [modal,setModal]=useState(state==='open');
 const [selectedDate,setSelectedDate]=useState(todayKey);
 const [year,setYear]=useState(today.getFullYear());
 const [month,setMonth]=useState(today.getMonth()+1);
 const [selectedMode,setSelectedMode]=useState<'yes'|'no'>();
 const sampleRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(state!=='focus')return;
  const node=sampleRef.current?.querySelector<HTMLElement>(
   'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary');
  node?.focus();
 },[]);
 const click=()=>setHits(n=>n+1);
 const status=<p role="status" className="li-legacy-story-status">
  {t('Tương tác mẫu: ','Demo interactions: ')}{hits}. {t('Không lưu dữ liệu.','No data saved.')}
 </p>;
 const mode:ActivityMode[]=['overload','recover','start','focus'];
 const totalDays=new Date(year,month,0).getDate();
 const records:CalendarRecord[]=Array.from({length:totalDays},(_,i)=>({
  date:dateKey(new Date(year,month-1,i+1)),mode:mode[(i+month)%4]
 })).filter((_,i)=>i%9!==0);
 const days:ActivityBarDatum[]=Array.from({length:7},(_,i)=>{
  const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-6+i);
  return {date:dateKey(d),lesson:i===2?null:(i+1)%5,
   problem:i===2?null:(i*2)%4,input:i===2?null:(i+2)%3};
 });
 let panel:React.ReactNode;
 switch(story){
 case 'bottomNav':
  panel=<div className="li-legacy-story-phone"><MobileBottomNav label={t('Điều hướng chính','Main nav')}
   items={nav} activeId={active} onNavigate={setActive}/></div>;
  break;
 case 'sidebarMenu':
  panel=<SidebarMenu label={t('Danh mục bên','Section menu')}
   items={nav} activeId={active} onNavigate={setActive}/>;
  break;
 case 'topNavVariants':
  panel=<TopNavContext mode={selected('Back')?'back':selected('Transparent')?'transparent':'logo'}
   brand="li." homeHref="#home" backHref="#back"
   backLabel={t('Quay lại','Back')} pageTitle={t('Khám phá','Explore')}
   artwork={<img alt="" src={asset('li-seal.svg')}/>}
   actions={<button type="button" className="li-legacy-story-utility" onClick={click}
    aria-label={t('Tùy chọn','Options')}><FunctionalIcon name="settings"/></button>}/>;
  break;
 case 'methodTile':
  panel=<div className="li-legacy-story-two">
   <MethodTile code="T01" title={t('Triệu Ức Chân Ngôn','Retrieval Practice')}
    original="Retrieval Practice / Active Recall"
    purpose={t('Tự nhớ trước khi xem đáp án để luyện truy xuất.','Recall before seeing the answer.')}
    variant={selected('Dark')?'dark':selected('Secondary')?'secondary':'primary'}
    icon={<FunctionalIcon name="book-open"/>} actionLabel={t('CHÚ GIẢI','EXPLAIN')}
    onActivate={click}/>
   <MethodTile code="T02" title={t('Thời Ấn Hồi Ức','Spaced Repetition')}
    original="Spaced Repetition"
    purpose={t('Ôn theo khoảng cách, không nhồi một lượt.','Review at intervals rather than cramming.')}
    variant="secondary" icon={<FunctionalIcon name="clock"/>}
    actionLabel={t('CHÚ GIẢI','EXPLAIN')} onActivate={click}/></div>;
  break;
 case 'portalCategoryCard':{
  const requested=Number(variant.replace(/[^0-9]/g,''))||1;
  const portal=Math.max(1,Math.min(7,requested)) as 1|2|3|4|5|6|7;
  panel=<div style={{maxWidth:680}}>
   <PortalCategoryCard portal={portal} title={t('Ngôn ngữ','Languages')}
    eyebrow={t('NHÓM NGÀNH','DOMAIN GROUP')}
    detail={t('2 chuyên ngành','2 fields')} actionLabel={t('Khám phá','Explore')}
    onOpen={click}/>
  </div>;
  break;
 }
 case 'mediaCard':
  panel=<MediaCard title={t('Đi vào thư viện','Enter the library')}
   description={t('Ảnh, chữ và CTA tách vùng.','Image, text and CTA use separate zones.')}
   src={asset(selected('Contained')?'laoly-neutral.png':'home-li-ipad-20261119.jpg')}
   alt={t('Minh họa li.','li. artwork')}
   layout={selected('Side')?'side':selected('Contained')?'contained':'top'}
   surface={state==='dark'?'dark':'cream'} href="#media"
   actionLabel={t('Xem cách dùng','Learn more')}/>;
  break;
 case 'horizontalCard':{
  const k=selected('Photo')?'photo':selected('Illustration')?'illustration':
   selected('Icon')?'icon':'text';
  const media=k==='icon'?<FunctionalIcon name="layers" size={24}/>:
   k==='photo'?<img alt="" src={asset('home-li-iphone-20261119.jpg')}/>:
   k==='illustration'?<img alt="" src={asset('laoly-neutral.png')}/>:undefined;
  panel=<HorizontalCard title={t('Tư duy phản biện','Critical thinking')}
   description={t('Bài học có cấu trúc rõ và phần media riêng.','Clear content hierarchy and optional media.')}
   mediaKind={k} media={media} surface={state==='dark'?'dark':'cream'}
   meta={t('Môn học','Subject')} href="#horizontal" actionLabel={t('Đọc thêm','Read more')}/>;
  break;
 }
 case 'chatBubble':
  panel=<div className="li-legacy-story-chat-pair">
   <ChatBubble text={t('90% phản hồi tích cực — nhưng mẫu khảo sát có đại diện không?',
    '90% positive responses — but is the survey representative?')}
    speaker={t('Lão Lý hỏi','Elder Ly asks')}
    surface={selected('Paper')?'paper':'forest'} tail="left"/>
   <ChatBubble text={t('Phải kiểm tra nguồn mẫu trước khi kết luận.',
    'Check the sample source before drawing conclusions.')}
    surface={selected('Paper')?'paper':'forest'} tail="right"/>
  </div>;
  break;
 case 'tagChip':
  panel=<div className="li-legacy-story-inline">
   {['Sociology','UX Design','Data Science','Supply Chain'].map((label,i)=>
    <TagChip key={label} label={label} tone={i===0?'olive':i===3?'dark':'neutral'}/>)}
   <Text role="support">{t('Tag tĩnh, không phải nút lọc.','Static labels; not filter buttons.')}</Text>
  </div>;
  break;
 case 'selectField':
  panel=<SelectField label={t('Chọn lĩnh vực','Choose field')} value={choice}
   onChange={setChoice} options={[
    {value:'',label:t('Tất cả lĩnh vực','All fields')},
    {value:'psych',label:t('Tâm lý học','Psychology')},
    {value:'soc',label:t('Nhân văn Xã hội','Humanities and Social Sciences')},
    {value:'data',label:t('Dữ liệu','Data')}
   ]} disabled={state==='disabled'} hint={t('Select native, không phải action menu.','Native select, not an action menu.')}/>;
  break;
 case 'monthCalendar':
  panel=<><MonthCalendar year={year} month={month} selectedDate={selectedDate}
   todayDate={todayKey} records={records} onSelectDate={setSelectedDate}
   onMonthChange={(y,m)=>{setYear(y);setMonth(m);setSelectedDate(dateKey(new Date(y,m-1,1)));}}
   locale={en?'en':'vi'}/>
   <p role="status">{t('Ngày đã chọn: ','Selected date: ')}{selectedDate}</p></>;
  break;
 case 'stackedActivity':
  panel=<><StackedActivityChart days={days} selectedDate={selectedDate}
   todayDate={todayKey} onSelectDate={setSelectedDate}
   onToday={()=>setSelectedDate(todayKey)}
   locale={en?'en':'vi'}/>
   <p role="status">{t('Ngày đã chọn: ','Selected date: ')}{selectedDate}</p></>;
  break;
 case 'laoLyState':
  panel=<LaoLyStateScene kind={selected('Error')?'error':'loading'}
   artworkSrc={asset(selected('Error')?'laoly-state-error.png':'laoly-state-loading.png')}
   title={selected('Error')?t('Bản đồ có chỗ sai rồi','Something went wrong'):
    t('Lão đang giở sổ…','Elder Ly is reading…')}
   description={t('Ảnh đã có sẵn trong assets. Trạng thái chỉ minh họa.',
    'Existing artwork; this is only a state fixture.')}
   action={selected('Error')?<SmallAction label={t('Thử lại (mẫu)','Retry (demo)')}
    onClick={click}/>:undefined}/>;
  break;
 case 'laoLyCompanion':
  panel=<LaoLyCompanion label={t('Hỏi Lão Lý','Ask Elder Ly')}
   title={t('Lão Lý','Elder Ly')} open={modal} onOpenChange={setModal}
   artworkSrc={asset('laoly-neutral.png')}
   description={t('Bản mẫu companion, không kết nối AI.','Companion fixture, no AI connection.')}
   closeLabel={t('Đóng','Close')}>
   <p>{t('Ta chỉ là mẫu UI; chưa trả lời câu hỏi thật đâu.','A UI fixture; not responding to real questions.')}</p>
  </LaoLyCompanion>;
  break;
 case 'editorialCard':
  panel=<EditorialCard title={t('Một ý tưởng đáng giữ','An idea worth keeping')}
   description={t('Card biên tập có hai nền ivory, border-only và forest.','Editorial card: two ivories, border-only and forest.')}
   eyebrow="EDITORIAL" surface={selected('Ivory')?'ivory':
    selected('Secondary')?'secondary':selected('Dark')?'dark':'cream'}
   actions={<SmallAction onClick={click} label={t('Đọc sâu hơn','Read further')}/>}/>;
  break;
 case 'notebookTextarea':
  panel=<NotebookTextarea label={t('Viết lại kết luận','Rewrite the conclusion')}
   value={value} onChange={e=>setValue(e.target.value)} rows={5}
   disabled={state==='disabled'} readOnly={state==='readonly'}
   hint={t('Dòng giấy 32px; chỉ nhập mẫu.','32px ruled notebook; fixture only.')}/>;
  break;
 case 'functionalIcons':{
  const names:FunctionalIconName[]=['search','check','info','close','chevron-left',
   'chevron-right','book-open','bookmark','trash','menu','calendar','clock',
   'star','home','settings','layers','chat','alert-triangle'];
  const sz=variant==='18px'?18:variant==='20px'?20:variant==='24px'?24:22;
  panel=<div className="li-legacy-story-icons">{names.map(name=><div key={name}
   title={name}><FunctionalIcon name={name} label={name} size={sz}/><span>{name}</span></div>)}</div>;
  break;
 }
 case 'smallAction':
  panel=<div className="li-legacy-story-inline">
   <SmallAction label={t('Xác nhận','Confirm')} onClick={click}
    appearance={selected('Text')?'text':selected('Primary')?'primary':'secondary'}
    disabled={state==='disabled'}/>
   <SmallAction label={t('Xem thêm','Read more')} href="#details" appearance="text"/>
   {status}
  </div>;
  break;
 case 'progressVariants':
  panel=<div className="li-legacy-story-stack">
   <ProgressVariants label={t('Tiến độ mẫu','Demo progress')} value={65}
    variant={selected('Compact')?'compact':'linear'}/>
   <ProgressVariants label={t('Chưa biết tỷ lệ','Indeterminate')} variant="indeterminate"/>
  </div>;
  break;
 case 'iconField':
  panel=<IconField label={t('Tìm kiếm trong thư viện','Find in library')}
   value={value} onChange={e=>setValue(e.target.value)}
   type="search" icon={<FunctionalIcon name="search" size={20}/>}
   disabled={state==='disabled'} placeholder={t('Gõ từ khóa…','Type a keyword…')}
   error={state==='error'?t('Nhập từ khóa phù hợp','Enter a valid keyword'):undefined}/>;
  break;
 case 'checkinRadioModal':
  panel=<><Button onClick={()=>setModal(true)}>{t('Mở Check-in','Open Check-in')}</Button>
   <CheckinRadioModal open={modal} onOpenChange={setModal}
    title={t('Check-in ngắn','Quick check-in')}
    question={t('Đã ngủ tương đối đủ?','Did you get enough sleep?')}
    yesLabel={t('Có','Yes')} noLabel={t('Chưa','Not yet')}
    closeLabel={t('Đóng','Close')}
    value={selectedMode} onChange={setSelectedMode}/>
   <p role="status">{t('Lựa chọn (mẫu): ','Demo selection: ')}{selectedMode||'—'}</p></>;
  break;
 default:panel=<p>{t('Chưa có specimen.','No specimen selected.')}</p>;
 }
 return <div ref={sampleRef} className="li-legacy-gallery" data-state={state}>
  <div className="li-legacy-gallery-sample">{panel}</div>
  {['methodTile','topNavVariants','smallAction'].includes(story)?status:null}
 </div>;
}
const titles:Record<string,string>={
 bottomNav:'Bottom Navigation',sidebarMenu:'Sidebar Menu',topNavVariants:'Top Navigation',
 methodTile:'Compact Method Tile',mediaCard:'Illustrated / Image Card',
  portalCategoryCard:'Portal Category Card',
 horizontalCard:'Horizontal Media Card',chatBubble:'Chat Bubble',tagChip:'Static Tag Chip',
 selectField:'Selection Dropdown',monthCalendar:'Monthly Calendar',
 stackedActivity:'Seven-Day Stacked Bar',laoLyState:'Elder Ly System State',
 laoLyCompanion:'Elder Ly Companion',editorialCard:'Editorial Card',
 notebookTextarea:'Notebook Textarea',functionalIcons:'Functional Icon System',
 smallAction:'Small / Text Link Action',progressVariants:'Progress Variants',
 iconField:'Icon-bearing Field',checkinRadioModal:'Check-in Radio Dialog'
};
function App(){
 return <main className="li-legacy-story" data-ui-react-legacy="mounted" lang={en?'en':'vi'}>
  <p className="li-legacy-story-kicker">UX-DS-11 → UX-DS-35 / PARITY DRAFT</p>
  <Heading level={1} role="titleLarge">{titles[story]||'Legacy component'}</Heading>
  <p className="li-legacy-story-note">{t('Mẫu tương tác dùng component React thật. Không kết nối dữ liệu, auth hay AI.',
   'Real React components with demo interaction, no data/auth/AI connection.')}</p>
  <Specimen/>
 </main>;
}
const host=document.getElementById('react-legacy-root');
if(!host)throw Error('Legacy React specimen root missing');
createRoot(host).render(<App/>);
