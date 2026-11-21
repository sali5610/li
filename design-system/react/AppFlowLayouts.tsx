import React from 'react';
import {motion,AnimatePresence,useReducedMotion} from 'motion/react';
import {Button,Card} from './Components';
import {Badge,Heading,Text,Progress} from './Atoms';
import {Field} from './Controls';
import {SearchField,InlineFeedback,ListRow,SourceStatus} from './Molecules';
import {CatalogShell,LearningFlowShell,AccountShell} from './Templates';
import {MethodTile,ChatBubble} from './LegacyCards';
import {LiIcon} from './LucideIcons';
import {NotebookAnnotation} from './NotebookAnnotation';
import {NotebookArt,notebookDisciplineImages} from './NotebookArt';
import {NotebookInk} from './NotebookInk';
import {NotebookLessonBook} from './NotebookLessonBook';
import {BookwormIllustration} from './BookwormIllustration';
import type {BookwormArtKind} from './BookwormIllustration';
import {BookwormLessonBook} from './BookwormLessonBook';
import {VintagePopLessonBook} from './VintagePopLessonBook';
import {VintagePopArt} from './VintagePopArt';
import type {VintagePopArtKind} from './VintagePopArt';
import './app-flow-layouts.css';

/** Exported presentational UI: Lab passes fixture props; the approved real
 * screen passes its actual read model and actions to the SAME JSX/CSS.
 * No auth, router, storage or learner state inside this file.
 */
export type PageId='home'|'catalog'|'search'|'research'|'case'|'capture'|
 'lesson'|'practice'|'feedback'|'guide'|'guideDetail'|'library'|'resume'|
 'collection'|'noteDetail'|'dashboard'|'settings'|'checkin'|'laoly'|'account';
export type PageVariant='editorial'|'split'|'cinematic'|'notebook'|'bookworm'|'vintagePop';
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
 {id:'cinematic',vi:'Cinematic',en:'Cinematic'},
 {id:'notebook',vi:'Notebook · Ghi chú tay',en:'Notebook · Handwritten'},
 {id:'bookworm',vi:'Bookworm · Sách tối giản',en:'Bookworm · Vintage Minimal'},
 {id:'vintagePop',vi:'Vintage Pop · Tem giấy',en:'Vintage Pop · Stamp'}
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
 const {page,variant,locale,query,answer,selected,saved,completed,onQuery,onAnswer,
  onSelect,onToggleSaved,onComplete,onNavigate,onNotice}=props;
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const bookwormPlate=(kind:BookwormArtKind)=>variant==='bookworm'?
  <div className="li-bw-inline-plate" aria-hidden="true"><BookwormIllustration kind={kind}/></div>:null;
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
     {variant==='vintagePop'&&<div className="li-pop-catalog-art"><VintagePopArt
      kind={item.id==='hci'?'hci':item.id==='supply'?'supply':'globe'} size="spot"/></div>}
     {variant==='notebook'&&<NotebookArt kind="discipline" size="card"
      src={notebookDisciplineImages[item.id as keyof typeof notebookDisciplineImages]}/>}
     {bookwormPlate(item.id==='society'?'balance':item.id==='hci'?'lens':'chart')}
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
   <Card key={name} variant="flat-study">
    {variant==='vintagePop'&&<div className="li-pop-result-art"><VintagePopArt
     kind={i===0?'sampling':i===1?'hci':'guide'} size="tiny"/></div>}
    {variant==='notebook'&&<NotebookArt kind={i===0?'sampling':i===1?'discipline':'method'}
     src={i===1?notebookDisciplineImages.hci:undefined} size="spot"/>}
    {bookwormPlate(i===0?'lens':i===1?'compass':'open')}
    <Badge>{desc}</Badge>
    <Heading level={3} role="titleMedium">{name}</Heading>
    <Button variant="secondary" onClick={()=>onNavigate(i===2?'guideDetail':'lesson')}>
     {t('Mở kết quả','Open result')}</Button>
   </Card>)}</div>
 </div>;
 case 'research':return <div className="li-flow-stack">
  <Card variant="tinted">
   <Badge>{t('VÍ DỤ GIẢ ĐỊNH','HYPOTHETICAL EXAMPLE')}</Badge>
   {variant==='vintagePop'&&<div className="li-pop-research-art"><VintagePopArt kind="sampling" size="spot"/></div>}
   {variant==='notebook'&&<NotebookArt kind="sampling" size="spot"/>}
   {bookwormPlate('lens')}
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
  {bookwormPlate('balance')}
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
   {bookwormPlate('quill')}
   <Field kind="textarea" rows={6} label={t('Ý nghĩ của mày','Your thought')}
    placeholder={t('Mình vừa đọc thấy…','I just read that…')} value={answer}
    onChange={event=>onAnswer(event.target.value)}/>
   <Badge>{t('Nguồn cá nhân · Chưa kiểm chứng','Personal note · Unverified')}</Badge>
   <Button onClick={()=>onNotice(t('Đã lưu tạm trong UI Lab, không gửi lên Neon.',
    'Preview memory only; nothing was sent to Neon.'))}>{t('Lưu thử','Sample save')}</Button>
  </Card>{action('collection','Mở Bộ Sưu Tập','Open collection')}
 </div>;
 case 'lesson':{
  // Canonical lesson copy is shared by all layout variants.
  const eyebrow=t('BÀI HỌC · VÍ DỤ','LESSON · SAMPLE');
  const description=t('Sai lệch chọn mẫu xuất hiện khi mẫu không phản ánh đúng tổng thể cần nghiên cứu.',
    'Sampling bias can arise when a sample does not reflect the population of interest.');
  const intro=<div className="li-flow-lesson-top">
   <Badge>{eyebrow}</Badge>
   <Heading level={2} role="titleLarge">{lessonTitle}</Heading>
   <Text role="body">{description}</Text>
  </div>;
  const diagram=<div className="li-flow-lesson-diagram" aria-label={t('Minh họa tổng thể và mẫu','Population and sample illustration')}>
   <div><span>{t('Tổng thể','Population')}</span><div className="li-flow-dots">
    {Array.from({length:24},(_,i)=><i key={i} data-highlight={i%5===0?'true':'false'}/>)}</div></div>
   <LiIcon name="arrow-right" size={26}/>
   <div><span>{t('Mẫu','Sample')}</span><div className="li-flow-dots sample">
    {Array.from({length:8},(_,i)=><i key={i} data-highlight={i%4===0?'true':'false'}/>)}</div></div>
  </div>;
  const chapters=[
   {title:t('Lý thuyết','Theory'),description:t('Phân biệt tính đại diện và cách chọn mẫu.','Distinguish representation from selection.'),art:'lens' as const},
   {title:t('Ví dụ','Example'),description:t('Khảo sát chỉ người đang dùng app có thể bỏ sót người đã rời đi.','Surveying current users can omit those who left.'),art:'balance' as const},
   {title:t('Hướng dẫn','Guided practice'),description:t('Xem phương pháp tuyển chọn trước khi kết luận.','Check recruitment before drawing conclusions.'),art:'compass' as const}
  ];
  const next=action('practice','Làm bài tập','Start practice');
  if(variant==='vintagePop')return <VintagePopLessonBook
   intro={intro} diagram={diagram} chapters={chapters} practiceAction={next}/>;
  if(variant==='bookworm')return <BookwormLessonBook
   locale={locale} intro={intro} diagram={diagram} chapters={chapters}
   practiceAction={next}/>;
  if(variant==='notebook')return <NotebookLessonBook
   locale={locale} title={lessonTitle} eyebrow={eyebrow}
   description={description} diagram={diagram}
   sections={chapters.map(({title,description})=>({heading:title,description}))}
   onPractice={()=>onNavigate('practice')}/>;
  return <div className="li-flow-stack">
   {intro}
   {diagram}
   <div className="li-flow-card-grid">{chapters.map(({title,description},i)=>
    card(title,description,i))}</div>
   {next}
  </div>;
 }
 case 'practice':return <LearningFlowShell
  title={t('Luyện tập · Sampling Bias','Practice · Sampling Bias')}
  eyebrow={t('BÀI MẪU · KHÔNG GHI TIẾN ĐỘ','SAMPLE · NO PROGRESS IS STORED')}
  progressLabel={t('Bước trong ví dụ','Example step')} progressValue={completed?100:50}
  stepLabel={completed?'2/2':'1/2'}
  prompt={<div className="li-flow-stack"><Heading level={2} role="titleMedium">{t('Ai có thể bị bỏ sót?','Who might be excluded?')}</Heading>
   <Text role="body">{t('Một nhóm chỉ hỏi người đang sử dụng ứng dụng. Điều gì cần kiểm chứng?',
    'A team only interviews current app users. What needs checking?')}</Text>
   {variant==='notebook'&&<NotebookArt kind="sampling" size="spot"/>}
   {bookwormPlate('lens')}</div>}
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
   {bookwormPlate('balance')}
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
  {variant==='vintagePop'&&<div className="li-pop-guide-art"><VintagePopArt kind="guide" size="hero"/></div>}
  <Text role="body">{t('Các phương pháp học có hướng dẫn, luyện tập và phản hồi. Dưới đây là UI mẫu.',
   'Learning methods with instructions, practice and feedback. UI fixture only.')}</Text>
  <div className="li-flow-card-grid">
   {[
    ['T01',t('Tự gọi nhớ','Active Recall'),t('Che nguồn và tự kể lại','Recall without the source')],
    ['T02',t('Ôn cách quãng','Spaced Repetition'),t('Nhắc lại khi đến hạn','Review when due')],
    ['T06',t('Hỏi vì sao','Elaborative Interrogation'),t('Tự giải thích điều đã học','Explain the reason')]
   ].map(([code,title,purpose])=>{
    const tile=<MethodTile code={code} title={title}
     purpose={purpose} actionLabel={t('Khám phá','Explore')}
     onActivate={()=>onNavigate('guideDetail')}/>;
    return variant==='vintagePop'?<div className="li-pop-method-plate" key={code}>
     <VintagePopArt kind={code==='T02'?'journal':code==='T06'?'idea':'book'} size="spot"/>
     {tile}
    </div>:variant==='bookworm'?<div className="li-bw-method-plate" key={code}>
     {bookwormPlate(code==='T01'?'open':code==='T02'?'compass':'lens')}
     {tile}
    </div>:variant==='notebook'?<div className="li-flow-method-plate" key={code}>
     <NotebookArt kind={code==='T01'?'recall':code==='T02'?'calendar':'question'} size="card"/>
     {tile}
    </div>:<React.Fragment key={code}>{tile}</React.Fragment>;
   })}
  </div>
 </div>;
 case 'guideDetail':return <div className="li-flow-stack">
  <Card variant="tinted"><Badge>T02 · SPACED REPETITION</Badge>
   <Heading level={2} role="titleLarge">{t('Ôn tập cách quãng','Spaced Repetition')}</Heading>
   {variant==='notebook'&&<NotebookArt kind="calendar" size="spot"/>}
   {bookwormPlate('compass')}
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
  {variant==='vintagePop'&&<div className="li-pop-workspace-art"><VintagePopArt kind="library" size="hero"/></div>}
  {variant==='notebook'&&<div className="li-flow-library-art"><NotebookArt kind="shelf" size="spot"/></div>}
  {bookwormPlate('shelf')}
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
   <Badge>{t('GẦN ĐÂY','RECENT')}</Badge>
   {bookwormPlate(i===0?'open':'quill')}
   <Heading level={3} role="titleMedium">{name}</Heading>
   <Progress label={t('Tiến độ mẫu','Sample progress')} value={i?70:40}/>
   <Text role="support">{desc}</Text>
   <Button onClick={()=>onNavigate(id as PageId)}>{t('Tiếp tục','Continue')}</Button>
  </Card>)}
 </div>;
 case 'collection':return <div className="li-flow-stack">
  {bookwormPlate('quill')}
  <div className="li-flow-actions">{['Bút Ký','Dấu Trang','Nhặt Ý'].map(label=>
   <Button key={label} variant={selected===label?'primary':'secondary'}
    onClick={()=>onSelect(label)}>{label}</Button>)}</div>
  {[
   [t('Một kết luận cần kiểm chứng','A claim worth checking'),t('Bút Ký · Hôm qua','Note · Yesterday')],
   [t('Sampling Bias','Sampling Bias'),t('Dấu Trang · Bài học','Bookmark · Lesson')],
   [t('Có đủ dữ kiện không?','Is this enough evidence?'),t('Nhặt Ý · Ví dụ','Capture · Example')]
  ].map(([name,desc],i)=><Card key={name} variant={i===0?'tinted':'flat-study'}>
   {variant==='vintagePop'&&<VintagePopArt kind={i===0?'notes':i===1?'book':'idea'} size="tiny"/>}
   <Badge>{desc}</Badge><Heading level={3} role="titleMedium">{name}</Heading>
   <Button variant="secondary" onClick={()=>onNavigate('noteDetail')}>{t('Xem chi tiết','View detail')}</Button>
  </Card>)}
 </div>;
 case 'noteDetail':return <div className="li-flow-stack">
  <Card variant="tinted"><Badge>{t('BÚT KÝ · MẪU','NOTE · SAMPLE')}</Badge>
   {bookwormPlate('quill')}
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
  {variant==='vintagePop'&&<div className="li-pop-workspace-art"><VintagePopArt kind="journal" size="hero"/></div>}
  <div className="li-flow-stat-grid">{[
   [t('Bài đã ôn','Reviewed'),'03'],[t('Ngày có hoạt động','Active days'),'07'],
   [t('Lượt check-in','Check-ins'),'05']
  ].map(([label,val])=><Card key={label} variant="flat-study">
   <Heading level={3} role="titleLarge">{val}</Heading><Text role="support">{label}</Text>
  </Card>)}</div>
  <Card variant="tinted"><Heading level={3} role="titleMedium">{t('Nhịp học tuần này','This week')}</Heading>
   {bookwormPlate('chart')}
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
  <Card variant="tinted">{variant==='vintagePop'&&<VintagePopArt kind="journal" size="spot"/>}
   <Heading level={2} role="titleLarge">{t('Hôm nay mày thế nào?','How are you today?')}</Heading>
   <Text role="body">{t('Ghi nhận trạng thái, không ép chỉ tiêu.','A gentle reflection without quotas.')}</Text>
   {bookwormPlate('compass')}
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
const notebookNotes:Partial<Record<PageId,readonly [string,string]>>={
 catalog:['Mỗi ngăn tủ là một cuộc phiêu lưu mới.','Every shelf starts a new little adventure.'],
 search:['Tò mò một chút, khám phá thật nhiều.','One small question can lead so far.'],
 research:['Khoan tin ngay. Thử hỏi vì sao?','Before believing, ask why.'],
 case:['Khoanh tròn điều còn nghi ngờ.','Circle what still feels uncertain.'],
 capture:['Bắt được một ý hay, ghi lại liền!','Caught a thought? Write it down!'],
 lesson:['Đọc chậm thôi, nhớ sâu hơn.','Read slowly. Let it sink in.'],
 practice:['Sai cũng được, miễn là hiểu thêm.','Mistakes are allowed. Curiosity stays.'],
 feedback:['Gạch chân điều vừa vỡ lẽ.','Underline what just clicked.'],
 guide:['Mỗi cách học là một lối nhỏ.','Every method opens another path.'],
 guideDetail:['Thử một lần, rồi thử cách khác.','Try it once, then try another way.'],
 library:['Những mảnh hiểu biết mang về.','The little things you brought home.'],
 resume:['Gấp sách lại, câu chuyện vẫn tiếp.','The story carries on after a pause.'],
 collection:['Những ý tưởng xứng đáng giữ lại.','Keep the ideas worth revisiting.'],
 noteDetail:['Sửa, gạch, viết thêm — giấy còn rộng.','Cross it out, add a line. There is room.'],
 dashboard:['Dấu vết nhỏ của một hành trình dài.','Small marks of a longer journey.'],
 settings:['Một góc nhỏ chỉnh cho vừa ý.','Make this corner feel like yours.'],
 checkin:['Hôm nay, một dòng cho mình.','One line to yourself today.'],
 laoly:['Lão Lý có vài lời ở lề trang.','A note from Lao Ly in the margin.'],
 account:['Trang cá nhân, giữ riêng tư.','Your own private pages.'],
};
const vintageArtForPage:Record<Exclude<PageId,'home'>,VintagePopArtKind>={
 catalog:'library',search:'telescope',research:'sampling',case:'sampling',capture:'idea',
 lesson:'book',practice:'sampling',feedback:'journal',guide:'guide',guideDetail:'guide',
 library:'library',resume:'book',collection:'notes',noteDetail:'notes',dashboard:'journal',
 settings:'notes',checkin:'journal',laoly:'idea',account:'library'
};
const notebookArtForPage:Record<Exclude<PageId,'home'>,React.ComponentProps<typeof NotebookArt>['kind']>={
 catalog:'shelf',search:'question',research:'sampling',case:'sampling',capture:'notes',
 lesson:'sampling',practice:'sampling',feedback:'sampling',guide:'method',
 guideDetail:'calendar',library:'shelf',resume:'book',collection:'notes',
 noteDetail:'notes',dashboard:'progress',settings:'notes',checkin:'checkin',
 laoly:'companion',account:'book'
};
const notebookPageIcons={
 catalog:'layers',search:'search',research:'search',case:'check',
 capture:'feather',lesson:'book-open',practice:'feather',feedback:'check',
 guide:'sparkles',guideDetail:'calendar',library:'library-big',resume:'book-open',
 collection:'bookmark',noteDetail:'feather',dashboard:'calendar',
 settings:'settings',checkin:'check',laoly:'chat',account:'home'
} as const;
export function AppPageLayout(props:AppPageLayoutProps){
 const {page,variant,locale,onNavigate}=props;
 const meta=appLabPages.find(item=>item.id===page)!;
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const reduced=useReducedMotion();
 const [marginOpen,setMarginOpen]=React.useState(true);
 const [indexOpen,setIndexOpen]=React.useState(true);
 const indexId=React.useId();
 const bookworm=variant==='bookworm';
 // Layout composition changes with the content type, not the content itself.
 const bookwormComposition=
  ['lesson','guideDetail','noteDetail'].includes(page)?'reading':
  ['practice','feedback','case','research','capture'].includes(page)?'study':
  ['dashboard','checkin','settings','account','laoly'].includes(page)?'journal':'shelf';
 const reveal=(delay:number)=>(variant==='notebook'||bookworm)&&!reduced?{
  initial:{opacity:0,y:bookworm?20:14},
  animate:{opacity:1,y:0},
  transition:{duration:bookworm?.56:.48,delay,ease:'easeOut' as const}
 }:{};
 return <section className="li-flow-page" data-page={page} data-layout={variant}
  data-bookworm-composition={bookworm?bookwormComposition:undefined}
  data-bookworm-index={bookworm?(indexOpen?'open':'closed'):undefined} lang={locale}>
  {variant==='bookworm'&&<div className="li-flow-bookworm-masthead" aria-hidden="true">
   <span>li. · Illustrated Folio</span><span>THE LIBRARY OF QUESTIONS / VOL. 01</span>
  </div>}
  {variant==='notebook'&&<div className="li-flow-notebook-masthead" aria-hidden="true">
   <span>li. <em>Notes on Knowing Why</em></span>
   <span>THE STUDY JOURNAL · VOL. 01</span>
  </div>}
  <header className="li-flow-page-head">
   <motion.div className="li-flow-page-heading" {...reveal(.06)}>
    <span className="li-flow-page-kicker">
     {variant==='notebook'&&<span className="li-nb-page-icon" aria-hidden="true">
      <LiIcon name={notebookPageIcons[page]} size={20}/>
     </span>}
     li. / {t('THƯ VIỆN TRI THỨC','THE KNOWLEDGE LIBRARY')}
    </span>
    <Heading level={1} role="headline">
     {variant==='notebook'
      ?<NotebookInk kind="highlight" tone="olive">{t(meta.vi,meta.en)}</NotebookInk>
      :t(meta.vi,meta.en)}
    </Heading>
    <Text role="body">{t(meta.descriptionVi,meta.descriptionEn)}</Text>
    {bookworm&&<button type="button" className="li-bookworm-index-toggle"
      aria-controls={indexId} aria-expanded={indexOpen}
      onClick={()=>setIndexOpen(open=>!open)}>
      <LiIcon name={indexOpen?'book-open':'bookmark'} size={16}/>
      {indexOpen?t('Gập mục lục','Close index'):t('Mở mục lục','Open index')}
     </button>}
    {variant==='notebook'&&<div className="li-flow-marginalia">
     <button className="li-flow-note-toggle" type="button"
      onClick={()=>setMarginOpen(value=>!value)} aria-expanded={marginOpen}
      aria-label={t('Hiện hoặc ẩn ghi chú bên lề','Toggle marginal note')}
      title={t('Gập/mở ghi chú','Fold/unfold note')}>
      <LiIcon name={marginOpen?'feather':'bookmark'} size={18}/>
     </button>
     <AnimatePresence initial={false}>
      {marginOpen&&<motion.div key="notebook-note" className="li-flow-marginalia-content"
       initial={reduced?false:{opacity:0,height:0,y:-6}}
       animate={{opacity:1,height:'auto',y:0}}
       exit={reduced?{opacity:0,height:0}:{opacity:0,height:0,y:-5}}
       transition={{duration:reduced?0:.3,ease:'easeOut'}}>
       <NotebookAnnotation
        text={locale==='vi'?notebookNotes[page]?.[0]||'Ghi lại điều đáng nhớ.':
         notebookNotes[page]?.[1]||'A thought worth keeping.'}
        tone={page==='capture'||page==='noteDetail'?'blue':'wine'}/>
      </motion.div>}
     </AnimatePresence>
    </div>}
   </motion.div>
   {variant==='vintagePop'&&<motion.div className="li-pop-header-art" aria-hidden="true"
    initial={reduced?false:{opacity:0,scale:.86,rotate:-8}}
    animate={{opacity:1,scale:1,rotate:0}}
    transition={{duration:reduced?0:.55,ease:[.22,1,.36,1]}}>
    <VintagePopArt kind={vintageArtForPage[page]} size="hero"/>
   </motion.div>}
   {variant==='notebook'&&<div className="li-flow-notebook-hero-art">
    <NotebookArt kind={notebookArtForPage[page]} size="hero"/>
   </div>}
   {bookworm&&<motion.div className="li-flow-bookworm-hero-art" aria-hidden="true"
    initial={reduced?false:{opacity:0,x:24,rotate:2}}
    animate={{opacity:1,x:0,rotate:0}}
    transition={{duration:reduced?0:.65,delay:reduced?0:.12,ease:[.22,1,.36,1]}}
    whileHover={reduced?undefined:{y:-4,rotate:-1}}>
    <BookwormIllustration kind={['catalog','search','library','resume','collection','noteDetail'].includes(page)?'shelf':
     ['lesson','practice','feedback','guide','guideDetail','research','case'].includes(page)?'open':'stack'}/>
   </motion.div>}
   <span className="li-flow-page-index" aria-hidden="true">{String(appLabPages.findIndex(item=>item.id===page)+1).padStart(2,'0')}</span>
  </header>
  <div className="li-flow-page-columns">
   <motion.div className="li-flow-page-main" layout={bookworm&&!reduced} {...reveal(.14)}>
    <ScreenBody {...props}/>
   </motion.div>
   <AnimatePresence initial={false}>
   {(!bookworm||indexOpen)&&<motion.aside id={indexId} key="related-index"
    className="li-flow-page-aside" layout={bookworm&&!reduced}
    initial={bookworm&&!reduced?{opacity:0,height:0,y:-10}:
     variant==='notebook'&&!reduced?{opacity:0,y:14}:false}
    animate={bookworm?{opacity:1,height:'auto',y:0}:
     variant==='notebook'?{opacity:1,y:0}:undefined}
    exit={bookworm&&!reduced?{opacity:0,height:0,y:-8}:undefined}
    transition={bookworm?{duration:reduced?0:.3,ease:[.22,1,.36,1]}:
     variant==='notebook'?{duration:reduced?0:.48,delay:reduced?0:.25,ease:'easeOut'}:undefined}
    aria-label={t('Lối đi liên quan','Related paths')}>
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
   </motion.aside>}
   </AnimatePresence>
  </div>
 </section>;
}
