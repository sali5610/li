import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppHeader,HomeMirrorShell,CatalogShell,LearningFlowShell,AccountShell,FeedbackScene,
 Button,Card,Field,FilterGroup,ListRow,Heading,Text,Disclosure,ActionGroup,SourceStatus,Stack,Grid} from './index';
import type {SceneKind} from './index';
import './atoms.css';
import './components.css';
import './controls.css';
import './layout.css';
import './molecules.css';
import './templates.css';
import './templates-story.css';

const params=new URLSearchParams(location.search);
const story=params.get('story')||'catalogShell',variant=params.get('variant')||'Default';
const state=params.get('state')||'default',en=params.get('lang')==='en';
const t=(vi:string,english:string)=>en?english:vi;

function Example(){
 const [query,setQuery]=useState('');
 const [filters,setFilters]=useState<string[]>([]);
 const [answer,setAnswer]=useState('');
 const [count,setCount]=useState(0);
 const [locale,setLocale]=useState<'vi'|'en'>(en?'en':'vi');
 const [action,setAction]=useState('');
 const [details,setDetails]=useState(false);
 const demo=(msg:string)=>setAction(msg);
 if(story==='appHeader')return <div className="li-ds-template-demo">
  <AppHeader brand="li." subtitle={t('Thư viện sống','A living library')} homeHref="#home"
   navLabel={t('Điều hướng chính','Main navigation')}
   activeId={state==='library'?'library':'study'}
   items={[{id:'study',label:t('Học','Study'),href:'#study'},
    {id:'library',label:t('Tàng Thư','Library'),href:'#library'},
    {id:'search',label:t('Tra cứu','Search'),href:'#search'}]}
   actions={<Button variant="ghost" onClick={()=>setLocale(l=>l==='vi'?'en':'vi')}>
    {locale.toUpperCase()}</Button>}/>
  <p className="li-ds-template-message">{t('Chỉ là điều hướng mẫu, không đổi route thật.','Example only, no app routing.')} {locale}</p>
 </div>;
 if(story==='homeMirror')return <HomeMirrorShell
  artwork={<img src="../assets/home-li-ipad-20261119.jpg" alt="" />}
  artworkLabel={t('Ảnh nền đã lưu trong app li.','Existing li. artwork')}
  title={t('Một câu hỏi để bắt đầu','A question to begin')}
  question={t('Hôm nay mày muốn khám phá điều gì?','What will you explore today?')}
  note={t('Shell UI thử nghiệm, không thay đổi Home production.','Draft shell; production Home is unchanged.')}
  actions={<ActionGroup label={t('Hành động thử','Sample actions')}>
   <Button onClick={()=>setCount(n=>n+1)}>{t('Đào sâu','Explore')}</Button>
   <Button variant="secondary" onClick={()=>setCount(n=>n+1)}>{t('Lưu câu hỏi','Save question')}</Button>
  </ActionGroup>}/>;
 if(story==='catalogShell'){
  const all=[{id:'psych',title:t('Tâm lý học','Psychology'),summary:t('Tư duy, nhận thức, hành vi','Thinking, cognition and behavior')},
   {id:'logic',title:t('Logic','Logic'),summary:t('Lập luận và suy diễn','Reasoning and inference')},
   {id:'supply',title:t('Chuỗi cung ứng','Supply chain'),summary:t('Vận tải và vận hành','Logistics and operations')}];
  const results=all.filter(x=>(!query||x.title.toLowerCase().includes(query.toLowerCase()))&&
   (!filters.length||x.id==='psych'&&filters.includes('psych')||x.id==='logic'&&filters.includes('logic')));
  return <CatalogShell title={t('Tàng Thư','Library')}
   description={t('Nhóm ngành → ngành → môn → bài. Mẫu chỉ để duyệt hierarchy.','Field → discipline → subject → lesson. UI fixture only.')}
   search={<Field label={t('Tìm môn','Find a subject')} value={query}
     onChange={e=>setQuery(e.target.value)} placeholder={t('Nhập từ khóa','Type a keyword')}/>}
   filters={<FilterGroup label={t('Bộ lọc','Filters')} selected={filters} onChange={setFilters}
     options={[{value:'psych',label:t('Tâm lý','Psychology')},{value:'logic',label:'Logic'}]}/>}
   asideTitle={t('Lối tắt','Browse')}
   aside={<Stack space="3"><ListRow href="#disciplines" title={t('Nhóm ngành','Fields')}/>
    <ListRow href="#subjects" title={t('Các môn','Subjects')}/></Stack>}
   countLabel={t('Kết quả minh họa: ','Example results: ')+results.length}>
   {results.length?<Grid cell="compact">{results.map(x=><Card key={x.id} variant="flat-study">
    <Heading level={3} role="titleMedium">{x.title}</Heading>
    <Text role="support">{x.summary}</Text>
    <Button variant="ghost" onClick={()=>demo(x.title)}>{t('Xem thử','Preview')}</Button>
   </Card>)}</Grid>:<Text role="body">{t('Không có kết quả trong dữ liệu mẫu.','No fixture results found.')}</Text>}
   {action?<p role="status">{t('Đã chọn thử: ','Selected sample: ')}{action}</p>:null}
  </CatalogShell>;
 }
 if(story==='learningShell')return <LearningFlowShell title={t('Sampling Bias','Sampling Bias')}
  eyebrow={t('Phương pháp nghiên cứu · Bài minh họa','Research methods · Example lesson')}
  progressLabel={t('Tiến độ minh họa','Demo progress')} progressValue={state==='completed'?100:36}
  stepLabel={state==='completed'?'4/4':'2/4'}
  prompt={<><Heading level={2} role="titleMedium">{t('Câu hỏi','Question')}</Heading>
   <Text role="body">{t('Vì sao chọn mẫu có thể gây sai lệch?','How can sampling introduce bias?')}</Text></>}
  response={<Field kind="textarea" label={t('Câu trả lời của mày','Your answer')}
   value={answer} onChange={event=>setAnswer(event.target.value)}
   hint={t('Chỉ lưu trong bộ nhớ của mẫu UI này.','Held in this UI fixture only.')}/>}
  feedback={state==='feedback'?<SourceStatus title={t('Nguồn học thuật','Academic source')}
   sourceLabel="NIST" statusLabel={t('Chưa kiểm chứng (mẫu)','Not reviewed (demo)')}
   state="unreviewed"/>:undefined}
  actions={<><Button onClick={()=>demo(t('Nộp thử','Example submit'))}>{t('Nộp bài','Submit')}</Button>
   <Button variant="secondary" onClick={()=>demo(t('Chuyển bài thử','Example next'))}>{t('Tiếp tục','Continue')}</Button></>}
  saveState="unsaved" saveMessage={t('Mẫu chưa lưu dữ liệu','Demo has not saved anything')}/>;
 if(story==='accountShell')return <AccountShell mode={variant==='Access'?'access':'settings'}
  title={variant==='Access'?t('Lối vào thư viện','Library access'):t('Tài khoản','Account')}
  description={variant==='Access'?t('Chỉ tài khoản được mời mới có thể đăng nhập.','Only invited accounts may sign in.'):
    t('Quản lý các tùy chọn hiển thị.','Manage presentation preferences.')}
  aside={variant==='Access'?<Text role="support">{t('Màn hình mẫu, không xác minh đăng nhập.','Demo; no authentication takes place.')}</Text>:
   <Text role="support">{t('Không có dữ liệu thật được đồng bộ.','No real data is synchronized.')}</Text>}
  footer={<Text role="caption">UX-DS-35 · UI-only</Text>}>
  {variant==='Access'?<>
   <Field label={t('Email được mời','Invited email')} type="email"
    value={query} onChange={e=>setQuery(e.target.value)}/>
   <Button onClick={()=>demo(t('Không kết nối Google trong mẫu','Google is not connected in this fixture'))}>
    {t('Tiếp tục bằng Google (mẫu)','Continue with Google (demo)')}</Button>
  </>:<>
   <div className="li-ds-template-settings-row">
    <Text role="body">{t('Ngôn ngữ','Language')}</Text>
    <Button variant="secondary" onClick={()=>setLocale(l=>l==='vi'?'en':'vi')}>{locale.toUpperCase()}</Button>
   </div>
   <Disclosure summary={t('Tùy chọn nâng cao','Advanced options')}>
    <Text role="support">{t('Chỉ là nhóm cài đặt mẫu.','Example settings group only.')}</Text>
   </Disclosure>
  </>}
  {action?<p role="status">{action}</p>:null}
 </AccountShell>;
 const kind:SceneKind=variant==='Loading'?'loading':variant==='Error'?'error':variant==='Complete'?'complete':'empty';
 return <FeedbackScene kind={kind}
  title={kind==='loading'?t('Đang xử lý','Processing'):kind==='error'?t('Có lỗi minh họa','Example error'):
   kind==='complete'?t('Hoàn tất mẫu','Example completed'):t('Chưa có dữ liệu','Nothing here yet')}
  message={kind==='loading'?t('Đang trình diễn trạng thái tải…','Loading state demo…'):
   kind==='error'?t('Đã mô phỏng lỗi.','Example failure, not an actual incident.'):
   kind==='complete'?t('Chỉ hoàn tất trạng thái UI, không lưu dữ liệu.','UI fixture completed; no data was saved.'):
   t('Khu vực mẫu đang trống.','This example region is empty.')}
  details={details?<Text role="support">{t('Chi tiết mẫu được mở.','Example details are shown.')}</Text>:undefined}
  action={<Button variant="secondary" onClick={()=>setDetails(v=>!v)}>
   {details?t('Ẩn chi tiết','Hide details'):t('Xem chi tiết','View details')}</Button>}/>;
}

function Story(){
 const headline=({appHeader:'App Header',homeMirror:'Home / Mirror',catalogShell:'Catalog Shell',
 learningShell:'Learning Flow Shell',accountShell:'Account & Access Shell',
 feedbackScene:'Feedback / Error Scene'} as Record<string,string>)[story]||'Pattern';
 return <main className="li-ds-template-story" lang={en?'en':'vi'}
  data-ui-react-templates="mounted" data-pattern={story}>
  <p className="li-ds-template-kicker">UX-DS-35 / STAGE 06 / REACT COMPOSITION</p>
  <h1>{headline}</h1>
  <p className="li-ds-template-note">{t('Dữ liệu và thao tác minh họa, không nối app thật.','Presentation fixture only; not connected to the real app.')}</p>
  <div className="li-ds-template-stage"><Example/></div>
 </main>;
}
const root=document.getElementById('react-templates-root');
if(!root)throw Error('Missing templates story root');
createRoot(root).render(<Story/>);
