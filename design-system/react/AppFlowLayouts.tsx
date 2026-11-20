import React from 'react';
import {Button,Card} from './Components';
import {Badge,Heading,Text,Progress} from './Atoms';
import {Field} from './Controls';
import {SearchField,InlineFeedback,ListRow,SourceStatus} from './Molecules';
import {CatalogShell,LearningFlowShell,AccountShell} from './Templates';
import {MethodTile,ChatBubble} from './LegacyCards';
import {LiIcon} from './LucideIcons';
import './app-flow-layouts.css';

/** Exported presentational UI: Lab passes fixture props; the approved real
 * screen passes its actual read model and actions to the SAME JSX/CSS.
 * No auth, router, storage or learner state inside this file.
 */
export type PageId='home'|'catalog'|'search'|'research'|'case'|'capture'|
 'lesson'|'practice'|'feedback'|'guide'|'guideDetail'|'library'|'resume'|
 'collection'|'noteDetail'|'dashboard'|'settings'|'checkin'|'laoly'|'account';
export type PageVariant='editorial'|'split'|'cinematic';
export type AppLabFlowId='discovery'|'learning'|'techniques'|'personal'|'daily';
export const appLabFlows:readonly {
 id:AppLabFlowId;vi:string;en:string;steps:readonly PageId[]
}[]=[
 {id:'discovery',vi:'Khám phá & kiểm chứng',en:'Discover & challenge',
  steps:['home','catalog','search','research','case','capture','collection']},
 {id:'learning',vi:'Học & luyện tập',en:'Learn & practise',
  steps:['catalog','lesson','practice','feedback','dashboard','resume']},
 {id:'techniques',vi:'13 Thần Chú',en:'Learning methods',
  steps:['guide','guideDetail','practice','feedback','dashboard']},
 {id:'personal',vi:'Tủ Riêng & tiến độ',en:'Personal workspace',
  steps:['library','resume','collection','noteDetail','dashboard','settings']},
 {id:'daily',vi:'Check-in & Lão Lý',en:'Daily & companion',
  steps:['home','checkin','dashboard','laoly','account','settings']}
];
export const appLabPages:readonly {id:PageId;vi:string;en:string;descriptionVi:string;descriptionEn:string}[]=[
 {id:'home',vi:'Đại Sảnh',en:'Great Hall',descriptionVi:'Câu hỏi trong gương',descriptionEn:'Question in the mirror'},
 {id:'catalog',vi:'Tàng Thư',en:'Catalog',descriptionVi:'Ngành → môn → bài',descriptionEn:'Field → course → lesson'},
 {id:'search',vi:'Tra Cứu',en:'Search',descriptionVi:'Tìm bài và khái niệm',descriptionEn:'Find lessons and ideas'},
 {id:'research',vi:'Khảo Chứng',en:'Investigate',descriptionVi:'Đi từ nghi vấn tới chứng cứ',descriptionEn:'Question the evidence'},
 {id:'case',vi:'Phản Chứng',en:'Challenge',descriptionVi:'Chọn lập luận và phản hồi',descriptionEn:'Choose and get feedback'},
 {id:'capture',vi:'Nhặt Ý',en:'Capture',descriptionVi:'Lưu một nhận định',descriptionEn:'Capture a thought'},
 {id:'lesson',vi:'Bài học',en:'Lesson',descriptionVi:'Đọc lý thuyết và ví dụ',descriptionEn:'Read and study'},
 {id:'practice',vi:'Luyện tập',en:'Practice',descriptionVi:'Trả lời và nộp bài',descriptionEn:'Attempt and submit'},
 {id:'feedback',vi:'Phản hồi',en:'Feedback',descriptionVi:'Đối chiếu và tự đánh giá',descriptionEn:'Reflect and self-rate'},
 {id:'guide',vi:'Thần Chú',en:'Methods',descriptionVi:'Chọn phương pháp học',descriptionEn:'Choose a learning method'},
 {id:'guideDetail',vi:'Chi tiết Thần Chú',en:'Method detail',descriptionVi:'Hướng dẫn và thực hành',descriptionEn:'Instructions and practice'},
 {id:'library',vi:'Tủ Riêng',en:'My Shelf',descriptionVi:'Tổng quan cá nhân',descriptionEn:'Personal overview'},
 {id:'resume',vi:'Quay Lại',en:'Continue',descriptionVi:'Tiếp tục bài gần nhất',descriptionEn:'Resume recent lessons'},
 {id:'collection',vi:'Bộ Sưu Tập',en:'Collection',descriptionVi:'Dấu Trang & Bút Ký',descriptionEn:'Bookmarks & notes'},
 {id:'noteDetail',vi:'Chi tiết Bút Ký',en:'Note detail',descriptionVi:'Chỉnh sửa và xem lại',descriptionEn:'Edit and revisit'},
 {id:'dashboard',vi:'Nhật Ký / Tiến độ',en:'Journal / Progress',descriptionVi:'Nhịp học và check-in',descriptionEn:'Learning and check-in history'},
 {id:'settings',vi:'Cài Đặt',en:'Settings',descriptionVi:'Giao diện và nhắc học',descriptionEn:'Display and reminders'},
 {id:'checkin',vi:'Check-in',en:'Check-in',descriptionVi:'Ghi nhận hôm nay',descriptionEn:'Daily reflection'},
 {id:'laoly',vi:'Lão Lý',en:'Lao Ly',descriptionVi:'Trợ lý và ngữ cảnh',descriptionEn:'Companion and context'},
 {id:'account',vi:'Tài khoản',en:'Account',descriptionVi:'Đăng nhập và đồng bộ',descriptionEn:'Sign-in and sync'}
];
export const appLabPageVariants:readonly {id:PageVariant;vi:string;en:string}[]=[
 {id:'editorial',vi:'Editorial',en:'Editorial'},
 {id:'split',vi:'Split focus',en:'Split focus'},
 {id:'cinematic',vi:'Cinematic',en:'Cinematic'}
];
export interface AppPageLayoutProps {
 page:Exclude<PageId,'home'>;variant:PageVariant;locale:'vi'|'en';
 query:string;answer:string;selected:string;saved:boolean;completed:boolean;
 onQuery:(query:string)=>void;onAnswer:(value:string)=>void;onSelect:(value:string)=>void;
 onToggleSaved:()=>void;onComplete:()=>void;onNavigate:(page:PageId)=>void;
 onNotice:(message:string)=>void;
}
const examples=[
 {id:'society',vi:'Xã hội học',en:'Sociology',descVi:'Con người, cộng đồng và phương pháp nghiên cứu',descEn:'People, society and research'},
 {id:'hci',vi:'Human–Computer Interaction',en:'Human–Computer Interaction',descVi:'Thiết kế giao diện và hành vi người dùng',descEn:'Interaction design and behaviour'},
 {id:'supply',vi:'Chuỗi cung ứng',en:'Supply Chain',descVi:'Vận hành, hàng hóa và quyết định',descEn:'Operations, goods and decisions'}
];
const lessonTitle='L09-1-2 · Sampling Bias';
function ScreenBody(props:AppPageLayoutProps){
 const {page,locale,query,answer,selected,saved,completed,onQuery,onAnswer,
  onSelect,onToggleSaved,onComplete,onNavigate,onNotice}=props;
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const action=(pageId:PageId,vi:string,en:string)=><Button onClick={()=>onNavigate(pageId)}>
  {t(vi,en)} <LiIcon name="arrow-right" size={17}/></Button>;
 const card=(heading:string,body:string,i:number)=><Card key={heading} variant={i%2?'raised':'tinted'}>
  <span className="li-flow-index">{String(i+1).padStart(2,'0')}</span>
  <Heading level={3} role="titleMedium">{heading}</Heading>
  <Text role="support">{body}</Text>
 </Card>;
 switch(page){
 case 'catalog':return <CatalogShell title={t('Chọn lối học','Choose a learning path')}
  description={t('Từ lĩnh vực đến môn và bài học. Nội dung ở đây chỉ để thử bố cục.',
   'Browse fields, courses and lessons. Fixture-only preview.')}
  search={<SearchField label={t('Tìm trong Tàng Thư','Find in catalog')} value={query}
   onQueryChange={onQuery} clearLabel={t('Xóa','Clear')} submitLabel={t('Tìm','Search')}
   placeholder={t('Tên ngành, môn, bài…','Field, course or lesson…')}/>}
  asideTitle={t('Cấp độ khám phá','Browse levels')}
  aside={<div className="li-flow-stack">
   {['Nhóm ngành','Chuyên ngành','Môn học','Bài học'].map((name,i)=>
    <div className="li-flow-mini" key={name}>{String(i+1).padStart(2,'0')} · {name}</div>)}
  </div>} countLabel={t('Nhóm ngành · Mẫu','Sample fields')}>
  <div className="li-flow-card-grid">
   {examples.filter(item=>(item.vi+item.en).toLowerCase().includes(query.toLowerCase()))
    .map((item,i)=><Card key={item.id} variant="tinted">
     <span className="li-flow-index">{String(i+1).padStart(2,'0')}</span>
     <Heading level={3} role="titleMedium">{locale==='vi'?item.vi:item.en}</Heading>
     <Text role="support">{t(item.descVi,item.descEn)}</Text>
     {action('lesson','Xem bài mẫu','View example lesson')}
    </Card>)}
  </div>
 </CatalogShell>;
 case 'search':return <div className="li-flow-stack">
  <SearchField label={t('Hỏi điều mày muốn hiểu','Ask what you want to understand')}
   value={query} onQueryChange={onQuery} clearLabel={t('Xóa','Clear')}
   submitLabel={t('Tìm','Search')} placeholder={t('Sampling bias, HCI…','Sampling bias, HCI…')}/>
  <div className="li-flow-card-grid">{[
   [lessonTitle,t('Bài có thể học','Sample lesson')],
   [t('HCI · Nghiên cứu người dùng','HCI · User research'),t('Chuyên ngành','Field')],
   [t('T06 · Elaborative Interrogation','T06 · Elaborative Interrogation'),t('Thần Chú liên quan','Related method')]
  ].filter(([name])=>!query||name.toLowerCase().includes(query.toLowerCase())).map(([name,desc],i)=>
   <Card key={name} variant="flat-study"><Badge>{desc}</Badge>
    <Heading level={3} role="titleMedium">{name}</Heading>
    <Button variant="secondary" onClick={()=>onNavigate(i===2?'guideDetail':'lesson')}>
     {t('Mở kết quả','Open result')}</Button>
   </Card>)}</div>
 </div>;
 case 'research':return <div className="li-flow-stack">
  <Card variant="tinted">
   <Badge>{t('VÍ DỤ GIẢ ĐỊNH','HYPOTHETICAL EXAMPLE')}</Badge>
   <Heading level={2} role="titleMedium">{t('90% người khảo sát hài lòng. Có đại diện cho tất cả không?',
    '90% were satisfied. Does that represent everyone?')}</Heading>
   <div className="li-flow-stack">{[
    t('Ai đã được hỏi?','Who was asked?'),
    t('Ai bị bỏ sót?','Who was excluded?'),
    t('Cách chọn mẫu là gì?','How was the sample selected?')
   ].map((label,i)=><Button key={label} variant={selected===String(i)?'primary':'secondary'}
     onClick={()=>onSelect(String(i))}>{String(i+1).padStart(2,'0')} · {label}</Button>)}</div>
   <InlineFeedback tone="info" message={t('Con số chưa cho biết cách chọn mẫu. Hãy đặt thêm câu hỏi.',
    'A number alone does not tell you how the sample was selected.')}/>
  </Card>
  {action('case','Tiếp tục Phản Chứng','Challenge the claim')}
 </div>;
 case 'case':return <div className="li-flow-stack">
  <Heading level={2} role="titleMedium">{t('Chọn kết luận đáng tin hơn','Choose the more defensible claim')}</Heading>
  {[
   t('90% hài lòng nên mọi người đều thích tính năng.','90% are satisfied, so everyone likes it.'),
   t('Chưa thể khái quát khi chưa biết cách chọn mẫu.','We cannot generalize without the sampling method.')
  ].map((label,i)=><Button key={label} variant={selected===String(i)?'primary':'secondary'}
   aria-pressed={selected===String(i)} onClick={()=>onSelect(String(i))}>{String(i+1)}. {label}</Button>)}
  {completed?<InlineFeedback tone="success" message={t('Phản hồi mẫu: cần xem cách chọn mẫu trước khi khái quát.',
   'Example feedback: assess the sampling method before generalizing.')}/>:null}
  <div className="li-flow-actions"><Button onClick={onComplete}>{t('Xem phản hồi','See feedback')}</Button>
   {action('collection','Mở Bút Ký','Open notebook')}</div>
 </div>;
 case 'capture':return <div className="li-flow-stack">
  <Card variant="tinted"><Heading level={2} role="titleMedium">{t('Nhặt một ý cần kiểm chứng','Capture a thought worth checking')}</Heading>
   <Field kind="textarea" rows={6} label={t('Ý nghĩ của mày','Your thought')}
    placeholder={t('Mình vừa đọc thấy…','I just read that…')} value={answer}
    onChange={event=>onAnswer(event.target.value)}/>
   <Badge>{t('Nguồn cá nhân · Chưa kiểm chứng','Personal note · Unverified')}</Badge>
   <Button onClick={()=>onNotice(t('Đã lưu tạm trong UI Lab, không gửi lên Neon.',
    'Preview memory only; nothing was sent to Neon.'))}>{t('Lưu thử','Sample save')}</Button>
  </Card>{action('collection','Mở Bộ Sưu Tập','Open collection')}
 </div>;
 case 'lesson':return <div className="li-flow-stack">
  <div className="li-flow-lesson-top"><Badge>{t('BÀI HỌC · VÍ DỤ','LESSON · SAMPLE')}</Badge>
   <Heading level={2} role="titleLarge">{lessonTitle}</Heading>
   <Text role="body">{t('Sai lệch chọn mẫu xuất hiện khi mẫu không phản ánh đúng tổng thể cần nghiên cứu.',
    'Sampling bias can arise when a sample does not reflect the population of interest.')}</Text>
  </div>
  <div className="li-flow-lesson-diagram" aria-label={t('Minh họa tổng thể và mẫu','Population and sample illustration')}>
   <div><span>{t('Tổng thể','Population')}</span><div className="li-flow-dots">
    {Array.from({length:24},(_,i)=><i key={i} data-highlight={i%5===0?'true':'false'}/>)}</div></div>
   <LiIcon name="arrow-right" size={26}/>
   <div><span>{t('Mẫu','Sample')}</span><div className="li-flow-dots sample">
    {Array.from({length:8},(_,i)=><i key={i} data-highlight={i%4===0?'true':'false'}/>)}</div></div>
  </div>
  <div className="li-flow-card-grid">{[
   [t('Lý thuyết','Theory'),t('Phân biệt tính đại diện và cách chọn mẫu.','Distinguish representation from selection.')],
   [t('Ví dụ','Example'),t('Khảo sát chỉ người đang dùng app có thể bỏ sót người đã rời đi.','Surveying current users can omit those who left.')],
   [t('Hướng dẫn','Guided practice'),t('Xem phương pháp tuyển chọn trước khi kết luận.','Check recruitment before drawing conclusions.')]
  ].map(([name,desc],i)=>card(name,desc,i))}</div>
  {action('practice','Làm bài tập','Start practice')}
 </div>;
 case 'practice':return <LearningFlowShell
  title={t('Luyện tập · Sampling Bias','Practice · Sampling Bias')}
  eyebrow={t('BÀI MẪU · KHÔNG GHI TIẾN ĐỘ','SAMPLE · NO PROGRESS IS STORED')}
  progressLabel={t('Bước trong ví dụ','Example step')} progressValue={completed?100:50}
  stepLabel={completed?'2/2':'1/2'}
  prompt={<div className="li-flow-stack"><Heading level={2} role="titleMedium">{t('Ai có thể bị bỏ sót?','Who might be excluded?')}</Heading>
   <Text role="body">{t('Một nhóm chỉ hỏi người đang sử dụng ứng dụng. Điều gì cần kiểm chứng?',
    'A team only interviews current app users. What needs checking?')}</Text></div>}
  response={<Field kind="textarea" rows={5} label={t('Lập luận của mày','Your reasoning')}
   value={answer} onChange={event=>onAnswer(event.target.value)}/>}
  feedback={completed?<InlineFeedback tone="info" message={t('Phản hồi chỉ là ví dụ giao diện, chưa chấm bài thật.',
   'This is sample UI feedback, not real grading.')}/>:undefined}
  actions={<div className="li-flow-actions"><Button onClick={onComplete}>{t('Nộp thử','Submit example')}</Button>
   {action('feedback','Xem phản hồi','View feedback')}</div>}/>;
 case 'feedback':return <div className="li-flow-stack">
  <InlineFeedback tone="success" message={t('Lượt luyện tập mẫu đã hoàn tất. Không ghi vào tiến độ thật.',
   'Sample attempt completed. Real progress is unchanged.')}/>
  <Card variant="tinted"><Heading level={2} role="titleMedium">{t('Đối chiếu câu trả lời','Compare your reasoning')}</Heading>
   <Text role="body">{t('Một mẫu chỉ từ người đang dùng có thể bỏ sót người đã rời sản phẩm.',
    'A current-user-only sample may exclude people who left the product.')}</Text>
   <SourceStatus title={t('Nguồn học thuật','Reference')}
    sourceLabel="NIST" statusLabel={t('Chỉ hiển thị mẫu','Preview only')} state="unreviewed"/>
  </Card>
  <Card variant="raised"><Heading level={3} role="titleMedium">{t('Mày thấy mình nhớ được không?','How confident is your recall?')}</Heading>
   <div className="li-flow-actions"><Button variant={selected==='yes'?'primary':'secondary'}
    onClick={()=>onSelect('yes')}>{t('Đã hiểu','Confident')}</Button>
    <Button variant={selected==='no'?'primary':'secondary'} onClick={()=>onSelect('no')}>
     {t('Cần ôn lại','Review again')}</Button></div></Card>
  {action('dashboard','Xem tiến độ','View progress')}
 </div>;
 case 'guide':return <div className="li-flow-stack">
  <Text role="body">{t('Các phương pháp học có hướng dẫn, luyện tập và phản hồi. Dưới đây là UI mẫu.',
   'Learning methods with instructions, practice and feedback. UI fixture only.')}</Text>
  <div className="li-flow-card-grid">
   {[
    ['T01',t('Tự gọi nhớ','Active Recall'),t('Che nguồn và tự kể lại','Recall without the source')],
    ['T02',t('Ôn cách quãng','Spaced Repetition'),t('Nhắc lại khi đến hạn','Review when due')],
    ['T06',t('Hỏi vì sao','Elaborative Interrogation'),t('Tự giải thích điều đã học','Explain the reason')]
   ].map(([code,title,purpose])=><MethodTile key={code} code={code} title={title}
    purpose={purpose} actionLabel={t('Khám phá','Explore')}
    onActivate={()=>onNavigate('guideDetail')}/>)}
  </div>
 </div>;
 case 'guideDetail':return <div className="li-flow-stack">
  <Card variant="tinted"><Badge>T02 · SPACED REPETITION</Badge>
   <Heading level={2} role="titleLarge">{t('Ôn tập cách quãng','Spaced Repetition')}</Heading>
   <div className="li-flow-steps">{[
    t('Chọn bài đã học','Choose material you learned'),
    t('Đợi đến hạn, tự gọi nhớ','Wait until due, then retrieve'),
    t('Đối chiếu và tự đánh giá','Check and self-rate')
   ].map((step,i)=><div key={step}><Badge>{i+1}</Badge><Text role="body">{step}</Text></div>)}</div>
   <InlineFeedback tone="info" message={t('Trong app thật, lượt ôn T02 chỉ mở khi đến hạn.',
    'In the real app T02 review unlocks only when due.')}/>
  </Card>{action('practice','Thi triển thử','Try practice')}
 </div>;
 case 'library':return <div className="li-flow-stack">
  <div className="li-flow-stat-grid">{[
   [t('Bài đang học','Active lessons'),'03'],
   [t('Dấu Trang','Bookmarks'),'08'],
   [t('Bút Ký','Notes'),'04']
  ].map(([label,value])=><Card key={label} variant="flat-study">
   <Heading level={3} role="titleLarge">{value}</Heading><Text role="support">{label}</Text>
  </Card>)}</div>
  <div className="li-flow-card-grid">{[
   [t('Quay Lại','Continue'),'resume'],
   [t('Bộ Sưu Tập','Collection'),'collection'],
   [t('Nhật Ký','Journal'),'dashboard']
  ].map(([label,id])=><Card key={id} variant="tinted">
   <Heading level={3} role="titleMedium">{label}</Heading>
   <Button variant="secondary" onClick={()=>onNavigate(id as PageId)}>{t('Mở','Open')}</Button>
  </Card>)}</div>
 </div>;
 case 'resume':return <div className="li-flow-stack">
  {[
   [lessonTitle,t('Tiếp tục phần luyện tập','Continue with practice'),'practice'],
   [t('L03-1-2 · Phỏng vấn người dùng','L03-1-2 · User interviews'),
    t('Đã đọc lý thuyết','Theory reviewed'),'lesson']
  ].map(([name,desc,id],i)=><Card key={id+i} variant={i?'raised':'tinted'}>
   <Badge>{t('GẦN ĐÂY','RECENT')}</Badge><Heading level={3} role="titleMedium">{name}</Heading>
   <Progress label={t('Tiến độ mẫu','Sample progress')} value={i?70:40}/>
   <Text role="support">{desc}</Text>
   <Button onClick={()=>onNavigate(id as PageId)}>{t('Tiếp tục','Continue')}</Button>
  </Card>)}
 </div>;
 case 'collection':return <div className="li-flow-stack">
  <div className="li-flow-actions">{['Bút Ký','Dấu Trang','Nhặt Ý'].map(label=>
   <Button key={label} variant={selected===label?'primary':'secondary'}
    onClick={()=>onSelect(label)}>{label}</Button>)}</div>
  {[
   [t('Một kết luận cần kiểm chứng','A claim worth checking'),t('Bút Ký · Hôm qua','Note · Yesterday')],
   [t('Sampling Bias','Sampling Bias'),t('Dấu Trang · Bài học','Bookmark · Lesson')],
   [t('Có đủ dữ kiện không?','Is this enough evidence?'),t('Nhặt Ý · Ví dụ','Capture · Example')]
  ].map(([name,desc],i)=><Card key={name} variant={i===0?'tinted':'flat-study'}>
   <Badge>{desc}</Badge><Heading level={3} role="titleMedium">{name}</Heading>
   <Button variant="secondary" onClick={()=>onNavigate('noteDetail')}>{t('Xem chi tiết','View detail')}</Button>
  </Card>)}
 </div>;
 case 'noteDetail':return <div className="li-flow-stack">
  <Card variant="tinted"><Badge>{t('BÚT KÝ · MẪU','NOTE · SAMPLE')}</Badge>
   <Field label={t('Tiêu đề','Title')} value={query} onChange={event=>onQuery(event.target.value)}
    placeholder={t('Một kết luận đáng ngờ…','A questionable claim…')}/>
   <Field kind="textarea" rows={7} label={t('Ghi chú','Note')}
    value={answer} onChange={event=>onAnswer(event.target.value)}/>
   <div className="li-flow-actions"><Button onClick={()=>onNotice(t('Đã lưu trong bộ nhớ của bản thử.',
    'Saved in the preview only.'))}>{t('Lưu bản thử','Save preview')}</Button>
    <Button variant="secondary" onClick={()=>onNavigate('collection')}>{t('Trở lại','Back')}</Button></div>
  </Card>
 </div>;
 case 'dashboard':return <div className="li-flow-stack">
  <div className="li-flow-stat-grid">{[
   [t('Bài đã ôn','Reviewed'),'03'],[t('Ngày có hoạt động','Active days'),'07'],
   [t('Lượt check-in','Check-ins'),'05']
  ].map(([label,val])=><Card key={label} variant="flat-study">
   <Heading level={3} role="titleLarge">{val}</Heading><Text role="support">{label}</Text>
  </Card>)}</div>
  <Card variant="tinted"><Heading level={3} role="titleMedium">{t('Nhịp học tuần này','This week')}</Heading>
   <div className="li-flow-week" aria-label={t('Biểu đồ mẫu','Sample chart')}>
    {[30,55,22,78,48,100,60].map((size,i)=><span key={i}>
     <i style={{height:size+'%'}}/><small>{['T2','T3','T4','T5','T6','T7','CN'][i]}</small>
    </span>)}</div>
   <Text role="caption">{t('Số liệu minh họa, không lấy từ tài khoản.','Illustrative values; no account data.')}</Text>
  </Card>{action('resume','Tiếp tục học','Continue studying')}
 </div>;
 case 'settings':return <AccountShell title={t('Cài Đặt','Settings')} mode="settings"
  description={t('Tùy chọn app. Bản thử không lưu thay đổi.',
   'App preferences. No settings are persisted in this preview.')}>
  <div className="li-flow-setting">
   <div><Heading level={3} role="titleSmall">{t('Ngôn ngữ','Language')}</Heading>
    <Text role="support">{t('Tiếng Việt / English','Vietnamese / English')}</Text></div>
   <Badge>{locale.toUpperCase()}</Badge>
  </div>
  {[
   [t('Nhắc học','Study reminders'),t('Thông báo đến hạn ôn','Due review notifications')],
   [t('Chuyển động','Motion'),t('Giảm hoạt ảnh khi cần','Reduce animation when needed')],
   [t('Đồng bộ','Sync'),t('Tiến độ chỉ đồng bộ trong app thật','Only the real app syncs progress')]
  ].map(([title,desc])=><div className="li-flow-setting" key={title}>
   <div><Heading level={3} role="titleSmall">{title}</Heading><Text role="support">{desc}</Text></div>
   <Button variant="secondary" onClick={()=>onNotice(t('Mẫu UI: không cập nhật cài đặt thật.',
    'Preview only: real settings unchanged.'))}>{t('Xem thử','Preview')}</Button>
  </div>)}
 </AccountShell>;
 case 'checkin':return <div className="li-flow-stack">
  <Card variant="tinted"><Heading level={2} role="titleLarge">{t('Hôm nay mày thế nào?','How are you today?')}</Heading>
   <Text role="body">{t('Ghi nhận trạng thái, không ép chỉ tiêu.','A gentle reflection without quotas.')}</Text>
   <div className="li-flow-choice-grid">{[
    ['calm',t('Ổn áp','Calm')],['tired',t('Hơi mệt','Tired')],['curious',t('Tò mò','Curious')]
   ].map(([id,label])=><Button key={id} variant={selected===id?'primary':'secondary'}
    aria-pressed={selected===id} onClick={()=>onSelect(id)}>{label}</Button>)}</div>
   <Button onClick={()=>onNotice(t('Check-in mẫu đã nhận, không lưu tiến độ.',
    'Preview check-in recorded in memory only.'))}>{t('Hoàn tất mẫu','Complete example')}</Button>
  </Card>
 </div>;
 case 'laoly':return <div className="li-flow-stack">
  <Card variant="tinted">
   <div className="li-flow-companion"><img src="../assets/laoly-neutral.png" alt=""
    width={92} height={92} loading="lazy"/>
    <div><Badge>{t('LÃO LÝ · TRỢ LÝ HỌC','LAO LY · STUDY COMPANION')}</Badge>
     <ChatBubble text={t('Không biết chưa sao, biết hỏi đúng mới khó à nha.',
      'Not knowing is fine. Asking the right question is the tricky part!')} surface="forest"/></div>
   </div>
   <div className="li-flow-choice-grid">{[
    t('Giải thích dễ hiểu','Explain simply'),
    t('Cho ví dụ','Give an example'),
    t('Hỏi ngược lại','Challenge my reasoning')
   ].map(name=><Button key={name} variant="secondary"
    onClick={()=>onNotice(t('Đây là lời nhắc mẫu, chưa gọi AI thật.',
     'Sample suggestion only, no AI request.'))}>{name}</Button>)}</div>
  </Card>
 </div>;
 case 'account':return <AccountShell title={t('Tài khoản','Account')} mode="access"
  description={t('Tài khoản được mời mới mở được dữ liệu học thật.',
   'Only invited users access real study data.')}
  aside={<Text role="support">{t('Bản thử không thực hiện đăng nhập hay đồng bộ.',
   'The preview does not sign in or synchronize.')}</Text>}>
  <Field label={t('Email minh họa','Example email')} type="email" value={query}
   onChange={event=>onQuery(event.target.value)} placeholder="example@domain.com"/>
  <Button onClick={()=>onNotice(t('Không kết nối tài khoản trong UI Lab.',
   'No account connection in the UI Lab.'))}>{t('Tiếp tục bằng Google (mẫu)','Continue with Google (demo)')}</Button>
 </AccountShell>;
 }
}
export function AppPageLayout(props:AppPageLayoutProps){
 const {page,variant,locale,onNavigate}=props;
 const meta=appLabPages.find(item=>item.id===page)!;
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 return <section className="li-flow-page" data-page={page} data-layout={variant} lang={locale}>
  <header className="li-flow-page-head">
   <div className="li-flow-page-heading">
    <span className="li-flow-page-kicker">li. / {t('THƯ VIỆN TRI THỨC','THE KNOWLEDGE LIBRARY')}</span>
    <Heading level={1} role="headline">{t(meta.vi,meta.en)}</Heading>
    <Text role="body">{t(meta.descriptionVi,meta.descriptionEn)}</Text>
   </div>
   <span className="li-flow-page-index" aria-hidden="true">{String(appLabPages.findIndex(item=>item.id===page)+1).padStart(2,'0')}</span>
  </header>
  <div className="li-flow-page-columns">
   <div className="li-flow-page-main"><ScreenBody {...props}/></div>
   <aside className="li-flow-page-aside" aria-label={t('Lối đi liên quan','Related paths')}>
    <span className="li-flow-page-kicker">{t('LỐI ĐI TIẾP','NEXT DESTINATIONS')}</span>
    <Text role="support">{t('Bản thiết kế thử nghiệm dùng dữ liệu giả lập.',
     'Design preview using fixture data.')}</Text>
    {(page==='lesson'?['practice','guideDetail','library']:
      page==='guide'?['guideDetail','practice','dashboard']:
      page==='library'?['resume','collection','dashboard']:
      page==='settings'?['account','dashboard','home']:
      ['catalog','lesson','library']).filter(id=>id!==page).map(id=>{
      const item=appLabPages.find(p=>p.id===id)!;
      return <Button key={id} variant="ghost" onClick={()=>onNavigate(id as PageId)}>
       {t(item.vi,item.en)} <LiIcon name="arrow-right" size={16}/>
      </Button>;
    })}
   </aside>
  </div>
 </section>;
}
