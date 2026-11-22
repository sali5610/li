import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {Button} from './Components';
import {Heading,Text,Badge} from './Atoms';
import {LiIcon} from './LucideIcons';
import {HomeLayout} from './HomeLayoutVariants';
import {AppPageLayout,appLabFlows,appLabPages} from './AppFlowLayouts';
import type {AppLabFlowId,PageId,PageVariant} from './AppFlowLayouts';
import type {HomeLayoutVariant} from './HomeLayoutVariants';
import './atoms.css';
import './components.css';
import './controls.css';
import './layout.css';
import './molecules.css';
import './templates.css';
import './legacy.css';
import './focus.css';
import './home-ui-lab.css';
import './vintage-pop-theme.css';
import './vintage-pop-book.css';
import './vintage-pop-scrapbook.css';
import './bookworm-theme.css';
import './bookworm-open-space.css';
import './notebook-open-space.css';
import './vintage-pop-open-space.css';

type LayoutKey='notebook'|'vintagePop'|'bookworm';
type ViewMode='focus'|'gallery';
type Viewport='fluid'|'390'|'820'|'1440';
const layoutChoices:readonly {id:LayoutKey;label:string}[]=[
 {id:'notebook',label:'Notebook · Handwritten'},
 {id:'vintagePop',label:'Vintage Pop · Stamp'},
 {id:'bookworm',label:'Bookworm · Vintage Minimal'}
];
const homeVariant:Record<LayoutKey,HomeLayoutVariant>={
 notebook:'notebook',
 vintagePop:'vintagePop',bookworm:'bookworm'
};
const pageVariant:Record<LayoutKey,PageVariant>={
 notebook:'notebook',
 vintagePop:'vintagePop',bookworm:'bookworm'
};
const questions=[
 {questionVi:'90% người tham gia nói họ hài lòng. Vậy có đủ kết luận chưa?',
  questionEn:'90% of participants are satisfied. Is that sufficient evidence?',
  sceneVi:'Một nhóm chỉ khảo sát những người đang dùng sản phẩm. Ai đã bị bỏ sót?',
  sceneEn:'The team surveyed current users only. Who did they miss?'},
 {questionVi:'Một điều nghe hợp lý có luôn là sự thật?',
  questionEn:'Is every plausible statement true?',
  sceneVi:'Lão Lý hỏi: mình đã kiểm chứng nguồn chưa?',
  sceneEn:'Elder Ly asks: did we check the source?'}
];
const params=new URLSearchParams(location.search);
const readChoice=<T extends string>(name:string,choices:readonly T[],fallback:T):T=>{
 const raw=params.get(name);return raw&&choices.includes(raw as T)?raw as T:fallback;
};
const pageChoices=appLabPages.map(item=>item.id);
const flowChoices=appLabFlows.map(item=>item.id);
const layouts=layoutChoices.map(item=>item.id);
const navUrl=(page:PageId,flow:AppLabFlowId,layout:LayoutKey,viewport:Viewport,
 mode:ViewMode,compare:boolean,other:LayoutKey,locale:'vi'|'en')=>{
 const q=new URLSearchParams({page,flow,layout,viewport,mode,lang:locale});
 if(compare)q.set('compare',other);
 return '?'+q.toString();
};
function Lab(){
 const reduceMotion=useReducedMotion();
 const [flow,setFlow]=useState<AppLabFlowId>(()=>readChoice('flow',flowChoices,'learning'));
 const [page,setPage]=useState<PageId>(()=>readChoice('page',pageChoices,'catalog'));
 const [layout,setLayout]=useState<LayoutKey>(()=>readChoice('layout',layouts,'notebook'));
 const [other,setOther]=useState<LayoutKey>(()=>readChoice('compare',layouts,'vintagePop'));
 const [compare,setCompare]=useState(()=>params.has('compare'));
 const [mode,setMode]=useState<ViewMode>(()=>readChoice('mode',['focus','gallery'],'gallery'));
 const [viewport,setViewport]=useState<Viewport>(()=>readChoice('viewport',['fluid','390','820','1440'],'fluid'));
 const [locale,setLocale]=useState<'vi'|'en'>(()=>readChoice('lang',['vi','en'],'vi'));
 const [query,setQuery]=useState('');
 const [answer,setAnswer]=useState('');
 const [selected,setSelected]=useState('');
 const [saved,setSaved]=useState(false);
 const [completed,setCompleted]=useState(false);
 const [questionIndex,setQuestionIndex]=useState(0);
 const [notice,setNotice]=useState('');
 const stageRef=useRef<HTMLDivElement>(null);
 const [stageFullscreen,setStageFullscreen]=useState(false);
 const bookwormOpen=layout==='bookworm'&&mode==='focus'&&!compare&&viewport==='fluid';
 const notebookOpen=layout==='notebook'&&mode==='focus'&&!compare&&viewport==='fluid';
 const vintageOpen=layout==='vintagePop'&&mode==='focus'&&!compare&&viewport==='fluid';
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const activeFlow=appLabFlows.find(item=>item.id===flow)!;
 const activeIndex=activeFlow.steps.indexOf(page);
 const allPages=useMemo(()=>appLabPages,[]);
 const choose=(next:PageId)=>{
  if(!activeFlow.steps.includes(next)){
   const match=appLabFlows.find(item=>item.steps.includes(next));
   if(match)setFlow(match.id);
  }
  setPage(next);setNotice('');setCompleted(false);setSelected('');
 };
 const setFlowById=(id:AppLabFlowId)=>{
  const selectedFlow=appLabFlows.find(item=>item.id===id)!;
  setFlow(id);setPage(selectedFlow.steps[0]);setNotice('');setCompleted(false);setSelected('');
 };
 const forward=(direction:-1|1)=>{
  const current=Math.max(activeIndex,0);
  const next=(current+direction+activeFlow.steps.length)%activeFlow.steps.length;
  choose(activeFlow.steps[next]);
 };
 useEffect(()=>{
  window.history.replaceState(window.history.state,'',
   location.pathname+navUrl(page,flow,layout,viewport,mode,compare,other,locale));
 },[page,flow,layout,viewport,mode,compare,other,locale]);
 useEffect(()=>{
  const syncFullscreen=()=>setStageFullscreen(document.fullscreenElement===stageRef.current);
  document.addEventListener('fullscreenchange',syncFullscreen);
  return ()=>document.removeEventListener('fullscreenchange',syncFullscreen);
 },[]);
 const toggleStageFullscreen=()=>{
  if(document.fullscreenElement){
   void document.exitFullscreen().catch(()=>setNotice(t('Không thoát được chế độ toàn màn hình.',
    'Could not exit fullscreen.')));
   return;
  }
  if(!stageRef.current?.requestFullscreen){
   setNotice(t('Trình duyệt này không hỗ trợ toàn màn hình.', 'Fullscreen is unavailable in this browser.'));
   return;
  }
  setViewport('fluid');
  void stageRef.current.requestFullscreen().catch(()=>setNotice(
   t('Trình duyệt đã chặn chế độ toàn màn hình.','The browser blocked fullscreen.')));
 };
 const view={
  locale,query,answer,selected,saved,completed,
  onQuery:setQuery,onAnswer:setAnswer,onSelect:setSelected,
  onToggleSaved:()=>setSaved(x=>!x),onComplete:()=>setCompleted(true),
  onNavigate:choose,onNotice:setNotice
 };
 function renderPage(target:PageId,style:LayoutKey){
  if(target!=='home')return <AppPageLayout key={target+'-'+style}
   page={target} variant={pageVariant[style]} {...view}/>;
  const q=questions[questionIndex];
  return <HomeLayout key={'home-'+style} variant={homeVariant[style]} locale={locale}
   backgroundSrc="../assets/home-li-landscape-20261121.webp"
   mirrorArtSrc="../assets/home-li-landscape-20261121.webp"
   avatarSrc="../assets/laoly-neutral.png"
   question={locale==='vi'?q.questionVi:q.questionEn}
   scene={locale==='vi'?q.sceneVi:q.sceneEn}
   source={t('VÍ DỤ GIẢ ĐỊNH','HYPOTHETICAL EXAMPLE')}
   saved={saved}
   onPrevious={()=>setQuestionIndex(i=>(i+questions.length-1)%questions.length)}
   onNext={()=>setQuestionIndex(i=>(i+1)%questions.length)}
   onExplore={()=>choose('research')} onCheckin={()=>choose('checkin')}
   onSave={()=>{setSaved(x=>!x);setNotice(t('Chỉ lưu trong bộ nhớ bản thử.',
    'Preview memory only.'));}}/>;
 }
 const label=(id:PageId)=>{
  const item=allPages.find(item=>item.id===id)!;
  return locale==='vi'?item.vi:item.en;
 };
 const animateVariant=(style:LayoutKey)=>(style==='vintagePop'||style==='notebook'||style==='bookworm')&&!reduceMotion;
 const preview=(target:PageId,style:LayoutKey,mini=false,slot='main')=><motion.section
  key={target+'-'+style+'-'+slot} className="li-ui-lab-preview"
  initial={animateVariant(style)?style==='bookworm'
   ?{opacity:0,x:mini?14:35,rotateY:mini?0:-3}
   :{opacity:0,y:mini?16:26,scale:mini?.993:.982}:false}
  animate={mini&&animateVariant(style)?undefined:{opacity:1,y:0,x:0,scale:1,rotateY:0}}
  whileInView={mini&&animateVariant(style)?{opacity:1,y:0,x:0,scale:1,rotateY:0}:undefined}
  viewport={{once:true,amount:.06}}
  exit={animateVariant(style)?style==='bookworm'
    ?{opacity:0,x:-25,rotateY:2}
    :{opacity:0,y:-12,scale:.992}:undefined}
  transition={{duration:animateVariant(style)?style==='bookworm'?.42:mini?.38:.42:0,
   delay:mini&&animateVariant(style)?Math.min(activeFlow.steps.indexOf(target),5)*.045:0,
   ease:[.22,1,.36,1]}}
  data-visual-theme={style==='vintagePop'?'vintage-pop':style==='bookworm'?'bookworm':undefined}
  data-mini={mini?'true':'false'}
  data-open-space={style==='bookworm'&&!mini&&!compare&&viewport==='fluid'?'true':'false'}
  data-notebook-bleed={style==='notebook'&&!mini&&!compare&&viewport==='fluid'?'true':'false'}
  data-vintage-open={style==='vintagePop'&&!mini&&!compare&&viewport==='fluid'?'true':'false'}
  aria-label={label(target)+' / '+style}>
  <header className="li-ui-lab-preview-label">
   <span>{label(target)}</span><span>{layoutChoices.find(item=>item.id===style)?.label}</span>
   {stageFullscreen&&!mini&&(style==='bookworm'||style==='notebook'||style==='vintagePop')&&<Button variant="ghost" onClick={toggleStageFullscreen}>
    {t('Thoát toàn màn hình','Exit fullscreen')} <LiIcon name="arrow-left" size={15}/>
   </Button>}
   {mini?<Button variant="ghost" onClick={()=>{choose(target);setMode('focus');}}> 
    {t('Phóng to','Open')} <LiIcon name="arrow-right" size={15}/></Button>:null}
  </header>
  <div className="li-ui-lab-viewport" data-viewport={viewport}>
   {renderPage(target,style)}
  </div>
 </motion.section>;
 return <main className="li-ui-lab" lang={locale} data-li-react-ui-lab="mounted"
  data-bookworm-open={bookwormOpen?'true':'false'}
  data-notebook-open={notebookOpen?'true':'false'}
  data-vintage-open={vintageOpen?'true':'false'}>
  <header className="li-ui-lab-header">
   <div className="li-ui-lab-intro">
    <span className="li-ui-lab-eyebrow">li. / DESIGN SYSTEM / UI EXPERIMENTS</span>
    <Heading level={1} role="headline">{t('UI Lab · Toàn bộ app','UI Lab · Full app')}</Heading>
    <Text role="support">{t('Thử layout xuyên suốt các page flow bằng component React có thể tái sử dụng.',
     'Experiment across complete page flows with reusable React components.')}</Text>
   </div>
   <a href="./" className="li-ui-lab-back">{t('Component Library','Component Library')} ↗</a>
  </header>
  <section className="li-ui-lab-workspace" aria-label={t('Bản đồ màn hình','Screen map')}>
   <aside className="li-ui-lab-sidebar">
    <div className="li-ui-lab-panel-heading"><span>{t('BẢN ĐỒ FLOW','FLOW MAP')}</span>
     <Badge>{appLabPages.length} {t('màn','screens')}</Badge></div>
    <nav className="li-ui-lab-flows" aria-label={t('Chọn flow','Select flow')}>
     {appLabFlows.map(item=><Button key={item.id}
      variant={flow===item.id?'primary':'ghost'} aria-pressed={flow===item.id}
      onClick={()=>setFlowById(item.id)}>
      {locale==='vi'?item.vi:item.en} <span className="li-ui-lab-flow-count">{item.steps.length}</span>
     </Button>)}
    </nav>
    <details className="li-ui-lab-all-screens" open>
     <summary>{t('Tất cả màn hình','All screens')} ({appLabPages.length})</summary>
     <div className="li-ui-lab-screen-list">{allPages.map(item=><Button key={item.id}
      variant={page===item.id?'primary':'ghost'} aria-current={page===item.id?'page':undefined}
      onClick={()=>{choose(item.id);setMode('focus');}}>
      {locale==='vi'?item.vi:item.en}</Button>)}</div>
    </details>
    <p className="li-ui-lab-side-note">{t('Không liên kết Neon, không login, không ghi tiến độ.',
     'No Neon connection, login or progress writes.')}</p>
   </aside>
   <div className="li-ui-lab-content">
    <div className="li-ui-lab-toolbar" aria-label={t('Điều khiển layout','Layout controls')}>
     <div className="li-ui-lab-control"><span>{t('Bố cục','Layout')}</span>
      <div className="li-ui-lab-options">
       {layoutChoices.map(item=><Button key={item.id}
        variant={layout===item.id?'primary':'secondary'} aria-pressed={layout===item.id}
        onClick={()=>setLayout(item.id)}>{item.label}</Button>)}
      </div>
     </div>
     <div className="li-ui-lab-control"><span>{t('Chế độ xem','View mode')}</span>
      <div className="li-ui-lab-options">
       <Button variant={mode==='gallery'?'primary':'secondary'} aria-pressed={mode==='gallery'}
        onClick={()=>setMode('gallery')}>{t('Cả flow','Flow gallery')}</Button>
       <Button variant={mode==='focus'?'primary':'secondary'} aria-pressed={mode==='focus'}
        onClick={()=>setMode('focus')}>{t('Từng màn','Single screen')}</Button>
       <Button variant={compare?'primary':'secondary'} aria-pressed={compare}
        onClick={()=>{setCompare(x=>!x);setMode('focus');}}>
        {t('So sánh A/B','Compare A/B')}</Button>
      </div>
     </div>
     {compare&&mode==='focus'?<div className="li-ui-lab-control">
      <label htmlFor="li-ui-compare">{t('So với','Compare with')}</label>
      <select id="li-ui-compare" value={other}
       onChange={event=>setOther(event.target.value as LayoutKey)}>
       {layoutChoices.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
     </div>:null}
     <div className="li-ui-lab-control"><label htmlFor="li-ui-viewport">{t('Màn hình','Viewport')}</label>
      <select id="li-ui-viewport" value={viewport}
       onChange={event=>setViewport(event.target.value as Viewport)}>
       <option value="fluid">{t('Tự do','Fluid')}</option>
       <option value="390">iPhone · 390</option>
       <option value="820">iPad · 820</option>
       <option value="1440">Desktop · 1440</option>
      </select>
     </div>
     {(layout==='bookworm'||layout==='notebook'||layout==='vintagePop')&&mode==='focus'&&!compare&&
      <Button variant="secondary" onClick={toggleStageFullscreen}>
       <LiIcon name="book-open" size={17}/>
       {stageFullscreen?t('Thu nhỏ','Leave fullscreen'):t('Toàn màn hình','Fullscreen')}
      </Button>}
     <Button variant="secondary" onClick={()=>setLocale(x=>x==='vi'?'en':'vi')}>
      {locale.toUpperCase()}</Button>
    </div>
    <div className="li-ui-lab-flow-head">
     <div><span className="li-ui-lab-eyebrow">{t('FLOW ĐANG XEM','ACTIVE FLOW')}</span>
      <Heading level={2} role="titleLarge">{locale==='vi'?activeFlow.vi:activeFlow.en}</Heading></div>
     <div className="li-ui-lab-flow-stepcount">{activeFlow.steps.length} {t('bước','steps')}</div>
    </div>
    <nav className="li-ui-lab-stepper" aria-label={t('Các màn trong flow','Flow screens')}>
     {activeFlow.steps.map((id,i)=><Button key={id} variant={page===id?'primary':'ghost'}
      aria-current={page===id?'step':undefined} onClick={()=>choose(id)}>
      <span>{String(i+1).padStart(2,'0')}</span> {label(id)}</Button>)}
    </nav>
    <div className="li-ui-lab-stage" ref={stageRef}
     data-bookworm-open={bookwormOpen?'true':'false'}
     data-notebook-open={notebookOpen?'true':'false'}
     data-vintage-open={vintageOpen?'true':'false'}
     data-bookworm-fullscreen={stageFullscreen?'true':'false'}
     data-gallery={mode==='gallery'?'true':'false'}
     data-compare={compare&&mode==='focus'?'true':'false'}>
     <AnimatePresence initial={false} mode="sync">
      {mode==='gallery'?activeFlow.steps.map(id=>preview(id,layout,true,'gallery')):
       [preview(page,layout,false,'primary'),
        ...(compare?[preview(page,other,false,'secondary')]:[])]}
     </AnimatePresence>
    </div>
    <div className="li-ui-lab-understage">
     <div className="li-ui-lab-actions">
      <Button variant="secondary" onClick={()=>forward(-1)}>
       <LiIcon name="arrow-left" size={17}/> {t('Màn trước','Previous')}</Button>
      <Button onClick={()=>forward(1)}>{t('Màn tiếp','Next')} <LiIcon name="arrow-right" size={17}/></Button>
     </div>
     <p className="li-ui-lab-inline">{t('Các hành động trong preview chỉ đổi state của Lab, không thực hiện nghiệp vụ thật.',
      'Interactions update preview state only and never perform real app actions.')}</p>
    </div>
    {notice?<p className="li-ui-lab-feedback" role="status">{notice}</p>:null}
    <footer className="li-ui-lab-footer">
     <Text role="support">{t('Mỗi màn sử dụng AppPageLayout/HomeLayout và component DS thật. Khi duyệt, truyền dữ liệu/hành động của màn React hiện tại vào đúng component; không vẽ lại UI.',
      'Every screen uses AppPageLayout/HomeLayout with canonical DS components. Adopt by wiring real React view models/actions into the same component; no UI redraw.')}</Text>
    </footer>
   </div>
  </section>
 </main>;
}
const root=document.getElementById('li-ui-lab-root');
if(!root)throw Error('LI_UI_LAB_ROOT_MISSING');
createRoot(root).render(<Lab/>);
