import {openRoute} from './app-router.js';
import canonicalCatalog from '../../../../content/curriculum/legacy-catalog.v1.json';
import {releasedLessonRoutes,personalStudyRoute,personalStudyLessonIds} from '../learning/released-lessons.js';
import {inquiryFlow} from './inquiry-port.js';
import {authoredCopy,useDiscoveryLocale,localized} from './discovery-locale.js';
import type {MirrorView} from './inquiry-port.js';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {Badge,Breadcrumb,Button,Heading,Progress,Text} from '../../../../design-system/react/index';
import {LiIcon} from '../../../../design-system/react/LucideIcons';
import './home-catalog.css';

/** Shared staging screens, not another app shell.
 * Visible Home and 5-tier Catalog are React-owned. Until the existing account
 * and navigation ports are extracted, the hidden legacy hosts retain exactly
 * one owner for bookmarks, scenarios, catalog URLs and progress.
 */
type Lesson={id:string;title:string;published?:boolean;route?:string};
type Course={id:string;title:string;level:string;lessons:Lesson[]};
type Field={id:string;name:string;source?:string;image?:string;courses:Course[]};
type Group={id:string;title:string;fields:Field[]};
type Locale='vi'|'en';
type CatalogPort={
 getPath:()=>string[];
 openPath:(path:string[],save?:boolean)=>void;
 openLesson:(id:string)=>boolean;
 openCourse:(group:string,field:string,course:string)=>void;
 render:()=>void
};
type AppWindow=Window&{
 liReactCatalogMounted?:boolean;
 liCatalog?:CatalogPort;
};
const app=window as AppWindow;
// One GitHub curriculum source also used by released-lesson routes and all 17
// personal study lessons. The React catalog must survive removal of the old
// global window.LI_CATALOG_DATA script by the core migration owner.
const groups:Group[]=canonicalCatalog.groups;
const releasedRoutes=new Map(releasedLessonRoutes.map(item=>[item.id,item.route]));
const canOpenLesson=(lesson:Lesson)=>!!personalStudyRoute(lesson.id)||
 (lesson.published===true&&typeof lesson.route==='string'&&
 releasedRoutes.get(lesson.id)===lesson.route);

function useLocale():Locale{return useDiscoveryLocale();}
function useCatalogPath(){
 const [path,setPath]=useState<string[]>(()=>app.liCatalog?.getPath()||
  (new URL(location.href).searchParams.get('catalog')||'').split('/').filter(Boolean));
 useEffect(()=>{
  const update=()=>setPath(app.liCatalog?.getPath()||
   (new URL(location.href).searchParams.get('catalog')||'').split('/').filter(Boolean));
  window.addEventListener('li:catalog-pathchange',update);
  return ()=>window.removeEventListener('li:catalog-pathchange',update);
 },[]);
 return path;
}
function openPath(path:string[]){
 if(!app.liCatalog?.openPath)return;
 app.liCatalog.openPath(path);
}
function courseProgress(course:Course){
 const available=course.lessons.filter(canOpenLesson);
 let done=0;
 let unavailable=false;
 for(const lesson of available){
  try{
   const raw=localStorage.getItem('li.review.'+lesson.id+'.v1');
   if(raw&&JSON.parse(raw)?.reviewed===true)done++;
  }catch{unavailable=true;}
 }
 return {available:available.length,done,total:course.lessons.length,unavailable};
}
const levelNames:readonly [string,string,string][]=[
 ['Foundation','Nền tảng','Foundation'],
 ['Intermediate','Trung cấp','Intermediate'],
 ['Advanced-topic','Chuyên sâu','Advanced']
];
function CatalogCard({number,eyebrow,title,detail,onOpen,locale,image}:{
 number:number;eyebrow:string;title:string;detail:string;onOpen:()=>void;locale:Locale;image?:string
}){
 return <article className="catalog-feature-row" data-li-react-catalog-card>
  <div className="catalog-feature-media">
   {image?<img className="catalog-card-art" src={image} alt="" loading="lazy" decoding="async"/>:
    <span className="catalog-card-mark" aria-hidden="true">{String(number).padStart(2,'0')}</span>}
  </div>
  <div className="catalog-card-copy">
   <div className="kicker">{eyebrow}</div>
   <Heading level={2} role="titleMedium">{title}</Heading>
   <Text role="support" className="small">{detail}</Text>
  </div>
  <Button variant="secondary" className="catalog-card-action" onClick={onOpen}>
   {locale==='vi'?'Khám phá':'Explore'} <LiIcon name="arrow-right" size={18}/>
  </Button>
 </article>;
}
// In-memory only: a return from a lesson should land on the course row the
// learner chose, not force them to find it again. Never persist this per-user UI.
let pendingCatalogReturn:{path:string;top:number}|null=null;
function Catalog(){
 const reduced=useReducedMotion();
 const locale=useLocale();
 const path=useCatalogPath();
 const [,forceProgress]=useState(0);
 const [lessonNavError,setLessonNavError]=useState('');
 useEffect(()=>{
  const onRoute=(event:Event)=>{
   if((event as CustomEvent<{route?:string}>).detail?.route!=='catalog'||!pendingCatalogReturn)return;
   const previous=pendingCatalogReturn;
   pendingCatalogReturn=null;
   window.requestAnimationFrame(()=>{
    if(app.liCatalog?.getPath().join('/')===previous.path)
     window.scrollTo({top:previous.top,left:0,behavior:'instant'});
   });
  };
  const onAuth=(event:Event)=>{
   if((event as CustomEvent<{verified?:boolean}>).detail?.verified===false)
    pendingCatalogReturn=null;
  };
  window.addEventListener('li:route-changed',onRoute);
  window.addEventListener('li:auth-verified-changed',onAuth);
  return()=>{
   window.removeEventListener('li:route-changed',onRoute);
   window.removeEventListener('li:auth-verified-changed',onAuth);
  };
 },[]);
 useEffect(()=>{
  const update=()=>forceProgress(x=>x+1);
  window.addEventListener('li:personal-sync-applied',update);
  window.addEventListener('li:learning-sync-report',update);
  // The React lesson saves to Dexie before cloud sync. Reflect the completed
  // self-review immediately, including while offline.
  window.addEventListener('li:lesson-attempt-changed',update);
  window.addEventListener('li:activity',update);
  const onStorage=(event:StorageEvent)=>{
   if(event.key?.startsWith('li.review.'))update();
  };
  window.addEventListener('storage',onStorage);
  return ()=>{
   window.removeEventListener('li:personal-sync-applied',update);
   window.removeEventListener('li:learning-sync-report',update);
   window.removeEventListener('li:lesson-attempt-changed',update);
   window.removeEventListener('li:activity',update);
   window.removeEventListener('storage',onStorage);
  };
 },[]);
 const group=groups.find(item=>item.id===path[0]);
 const field=group?.fields.find(item=>item.id===path[1]);
 const course=field?.courses.find(item=>item.id===path[2]);
 const lesson=course?.lessons.find(item=>item.id===path[3]);
 const breadcrumb=[{label:locale==='vi'?'Tàng Thư':'Library',path:[] as string[]}];
 if(group)breadcrumb.push({label:authoredCopy(group.title),path:[group.id]});
 if(field)breadcrumb.push({label:authoredCopy(field.name),path:[group!.id,field.id]});
 if(course)breadcrumb.push({label:authoredCopy(course.title),path:[group!.id,field!.id,course.id]});
 if(lesson)breadcrumb.push({label:authoredCopy(lesson.title),path:[group!.id,field!.id,course!.id,lesson.id]});
 const currentTitle=lesson?.title||course?.title||field?.name||group?.title;
 const heading=currentTitle?authoredCopy(currentTitle):(locale==='vi'?'Tàng Thư':'Library');
 const description=lesson?(personalStudyRoute(lesson.id)?
  (locale==='vi'?'Bài học cá nhân · Có thể học ngay trong Tàng Thư.':
   'Personal study lesson · Ready to learn in your library.'):
  (locale==='vi'?'Bài này mới có vị trí trong lộ trình. Nội dung chưa được xuất bản.':
   'This is only an outline; the lesson content is not released.')):
  course?(locale==='vi'?'Theo dõi các bài trong môn và tiếp tục từ nội dung đã phát hành.':
   'Follow the course and continue with available lessons.'):
  field?(locale==='vi'?'Các môn theo nền tảng → trung cấp → chuyên sâu; không tự khóa bài.':
   'Courses progress from foundations through advanced topics without locking lessons.'):
  group?(locale==='vi'?'Chọn chuyên ngành để xem lộ trình các môn học.':
   'Choose a field to see its course roadmap.'):
  (locale==='vi'?'Những lối đi khác nhau vào cùng một thư viện tri thức.':
   'Different paths into one library of knowledge.');
 const chooseLesson=(item:Lesson)=>{
  // The canonical router still owns history/deep links. This only remembers
  // the current Catalog scroll until returning to the SAME course path.
  const previousReturn=pendingCatalogReturn;
  pendingCatalogReturn={path:path.slice(0,3).join('/'),top:window.scrollY};
  const personalRoute=personalStudyRoute(item.id);
  if(personalRoute){
   if(!openRoute(personalRoute)){
    pendingCatalogReturn=previousReturn;
    setLessonNavError(locale==='vi'?'Bài học chưa tải được. Thử tải lại trang; tiến độ cũ vẫn được giữ.':
     'The lesson could not open. Reload to try again; existing progress is preserved.');
   }else setLessonNavError('');
   return;
  }
  if(canOpenLesson(item)){
   // React is the only URL/history owner. The native Catalog opener pushes
   // its own history entry before calling the React router, which adds an
   // unwanted Back step. The existing course ?catalog= path stays in the URL.
   const releasedRoute=releasedRoutes.get(item.id);
   if(!releasedRoute||!openRoute(releasedRoute)){
    pendingCatalogReturn=previousReturn;
    setLessonNavError(locale==='vi'?'Bài học hiện chưa mở được.':'This lesson is temporarily unavailable.');
   }else setLessonNavError('');
   return;
  }
  pendingCatalogReturn=previousReturn;
  // Outlines without content remain non-learnable.
  openPath([...path.slice(0,3),item.id]);
 };
 const available=course?courseProgress(course):null;
 return <motion.div key={path.join('/')||'catalog-root'} data-li-react-screen="catalog"
   className="li-react-catalog" initial={reduced?false:{opacity:0,y:7}}
   animate={{opacity:1,y:0}} transition={reduced?{duration:0}:{duration:0.18}}>
  {group&&<div className={'catalog-breadcrumbs'+(lesson?' is-lesson':'')}>
   <div className="catalog-breadcrumbs-full">
    <Breadcrumb label={locale==='vi'?'Vị trí trong Tàng Thư':'Library path'}
     visibleParents={2} moreLabel={locale==='vi'?'Các cấp trước':'Earlier levels'}
     items={breadcrumb.map((item,index)=>({
      label:item.label,
      onActivate:index<breadcrumb.length-1?()=>openPath(item.path):undefined
     }))}/>
   </div>
  </div>}
  <header className={'catalog-lead'+(lesson?' catalog-lead--outline':'')}>
   <Heading level={1} role="headline" className="display-title">{heading}</Heading>
   {lesson&&<div className="catalog-outline-meta">
    <span>{locale==='vi'?'ĐỀ CƯƠNG BÀI HỌC':'LESSON OUTLINE'} · {lesson.id}</span>
    <span className="catalog-outline-status">{locale==='vi'?'Chưa phát hành':'Unreleased'}</span>
   </div>}
   {course&&!lesson&&<Text role="caption">{course.id}</Text>}
   {!lesson&&<Text role="body" className="intro">{description}</Text>}
  </header>
  {lessonNavError&&<p role="alert" className="li-catalog-error">{lessonNavError}</p>}
   {field&&!course&&field.image&&<img className="catalog-field-hero" src={field.image} alt="" loading="lazy" decoding="async"/>}
  {!group&&<><div className="catalog-group-grid">
   {groups.map((item,index)=><CatalogCard key={item.id} number={index+1}
    title={authoredCopy(item.title)} eyebrow={locale==='vi'?'NHÓM NGÀNH':'DOMAIN GROUP'}
    detail={item.fields.length+(locale==='vi'?' chuyên ngành':' fields')}
    locale={locale} onOpen={()=>openPath([item.id])}/>)}
  </div>
  <Text role="support" className="catalog-quiet-note">
   {personalStudyLessonIds.length?
    (locale==='vi'?'Đề cương vẫn đang biên soạn. Bài học cá nhân có thể học trên staging nhưng chưa phát hành công khai.':
     'Some outlines are still in progress. Personal lessons can be studied on staging but are not publicly released.'):
    (locale==='vi'?'Danh mục còn đề cương đang biên soạn. Chỉ bài đã phát hành mới có nội dung học.':
     'Some outlines are in progress. Only released lessons are available to study.')}
  </Text></>}
  {group&&!field&&<div className="catalog-field-grid">
   {group.fields.map((item,index)=><CatalogCard key={item.id} number={index+1}
    title={authoredCopy(item.name)} image={item.image} eyebrow={locale==='vi'?'CHUYÊN NGÀNH':'FIELD'}
    detail={item.courses.length+(locale==='vi'?' môn học theo lộ trình':' courses')}
    locale={locale} onOpen={()=>openPath([group.id,item.id])}/>)}
  </div>}
  {field&&!course&&<div className="catalog-roadmap">
   {levelNames.map(([level,vi,en],index)=><section key={level} className="catalog-level-band">
    <div className="catalog-level-heading">
     <span className="catalog-level-dot" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
     <Heading level={2} role="titleLarge">{locale==='en'?en:vi}</Heading>
     <Text role="support">{level}</Text>
    </div>
    <div className="catalog-course-list">
     {field.courses.filter(item=>item.level===level).map(item=><article
      key={item.id} className="catalog-course-card">
      <div className="kicker">{item.id} · {locale==='en'?en:vi}</div>
      <Heading level={3} role="titleMedium">{authoredCopy(item.title)}</Heading>
      <ol className="catalog-preview-lessons">
       {item.lessons.map(l=><li key={l.id}
        className={canOpenLesson(l)?'catalog-preview-published':undefined}>{authoredCopy(l.title)}</li>)}
      </ol>
      <Button variant="secondary" className="catalog-card-action"
       onClick={()=>openPath([group!.id,field!.id,item.id])}>
       {locale==='vi'?'Xem môn học':'View course'} <LiIcon name="arrow-right" size={16}/>
      </Button>
     </article>)}
    </div>
   </section>)}
  </div>}
  {course&&!lesson&&<><section className="catalog-progress" aria-label={locale==='vi'?'Tiến độ môn học':'Course progress'}>
   <Heading level={2} role="titleMedium">
    {available?.unavailable?(locale==='vi'?'Tiến độ chưa xác minh':'Progress could not be verified'):
     String(available?.done||0)+'/'+course.lessons.length+
     (locale==='vi'?' bài đã hoàn thành':' lessons completed')}
   </Heading>
   <Text role="support">{available?.available||0}/{course.lessons.length}
    {locale==='vi'?' bài có thể học · Chỉ tính hoàn thành khi có tự đánh giá đã lưu.':
     ' lessons available · Completion requires a saved self-review.'}</Text>
   {available&&!available.unavailable&&<Progress
    label={locale==='vi'?'Tiến độ bài học đã hoàn thành':'Completed lesson progress'}
    value={available.done} max={Math.max(1,course.lessons.length)}/>}
   {course.lessons.find(canOpenLesson)&&
    <Button className="catalog-start-lesson" onClick={()=>chooseLesson(course.lessons.find(canOpenLesson)!)}>
     {locale==='vi'?'Bắt đầu bài học':'Start a lesson'} <LiIcon name="arrow-right" size={18}/>
    </Button>}
  </section>
  <ol className="catalog-lesson-list">
   {course.lessons.map((item,index)=><li key={item.id} className="catalog-lesson-card">
    <span className="catalog-lesson-order" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
    <div className="catalog-lesson-desc">
     <Heading level={2} role="titleSmall">{authoredCopy(item.title)}</Heading>
     <Text role="support">{item.id} · {personalStudyRoute(item.id)?
      (locale==='vi'?'Học cá nhân · Có bài đầy đủ':'Personal study · Complete lesson'):
      canOpenLesson(item)?(locale==='vi'?'Đã phát hành':'Released'):
      (locale==='vi'?'Đề cương · chưa phát hành':'Outline · not released')}</Text>
    </div>
    <Button variant="secondary" onClick={()=>chooseLesson(item)}>
     {canOpenLesson(item)?(locale==='vi'?'Vào bài học':'Open lesson'):
      (locale==='vi'?'Xem đề cương':'View outline')}
    </Button>
   </li>)}
  </ol></>}
  {lesson&&<section className="catalog-draft-content" aria-label={locale==='vi'?'Trạng thái bài học':'Lesson status'}>
   <p>{locale==='vi'?
    'Bài này đang được biên soạn; chưa có nội dung hay bài luyện để bắt đầu học.':
    'This outline is being prepared. Reading and practice are not available yet.'}</p>
   <button type="button" className="catalog-outline-return" onClick={()=>openPath(path.slice(0,3))}>
    <span aria-hidden="true">←</span> {locale==='vi'?'Xem bài khác trong môn':'Browse other lessons'}
   </button>
  </section>}
 </motion.div>;
}

const homeLegacy=()=>document.querySelector<HTMLElement>('#page-home > .hero');
const mirrorFallback:MirrorView={index:0,fieldId:'',question:'',scene:'',source:'',
 route:'research',cta:'Đào sâu',saved:false};
function readMirror():MirrorView{
 return inquiryFlow().getMirror()||mirrorFallback;
}
function Home(){
 const locale=useLocale();
 const L=(vi:string,en:string)=>localized(locale,vi,en);
 const reduced=useReducedMotion();
 const [mirror,setMirror]=useState<MirrorView>(readMirror);
 const gesture=useRef<{x:number;y:number}|null>(null);
 const scene=useRef<HTMLDivElement>(null);
 const [backdropReady,setBackdropReady]=useState(false);
 const [decodedMirrorImage,setDecodedMirrorImage]=useState('');
 // CSS owns the iPhone/iPad/desktop crop. Read the actual ::before URL so
 // discipline artwork cannot request or reveal before that backdrop decodes.
 useEffect(()=>{
  const hero=scene.current;
  if(!hero)return;
  let active=true;
  let currentUrl='';
  let frame=0;
  let image:HTMLImageElement|null=null;
  const checkBackdrop=()=>{
   const css=getComputedStyle(hero,'::before').backgroundImage;
   const url=css.match(/url\((["']?)(.*?)\1\)/)?.[2]||'';
   if(!url||url===currentUrl)return;
   currentUrl=url;
   setBackdropReady(false);
   image=new Image();
   const candidate=image;
   const reveal=()=>{
    if(!active||currentUrl!==url)return;
    frame=requestAnimationFrame(()=>{
     if(active&&currentUrl===url)setBackdropReady(true);
    });
   };
   candidate.onload=()=>{
    if(typeof candidate.decode==='function')candidate.decode().then(reveal,reveal);
    else reveal();
   };
   candidate.src=url;
  };
  checkBackdrop();
  window.addEventListener('resize',checkBackdrop);
  window.addEventListener('orientationchange',checkBackdrop);
  return ()=>{
   active=false;
   cancelAnimationFrame(frame);
   if(image)image.onload=null;
   window.removeEventListener('resize',checkBackdrop);
   window.removeEventListener('orientationchange',checkBackdrop);
  };
 },[]);
 useEffect(()=>{
  const sync=()=>setMirror(previous=>{
   const next=readMirror();
   return JSON.stringify(next)===JSON.stringify(previous)?previous:next;
  });
  window.addEventListener('li:inquiry-changed',sync);
  window.addEventListener('li:personal-sync-applied',sync);
  return ()=>{
   window.removeEventListener('li:inquiry-changed',sync);
   window.removeEventListener('li:personal-sync-applied',sync);
  };
 },[]);
 const shift=(direction:-1|1)=>inquiryFlow().shift(direction);
 // Resolve artwork directly from Tàng Thư's canonical field-to-image entries.
 const mirrorImage=groups.flatMap(group=>group.fields)
  .find(field=>field.id===mirror.fieldId)?.image||'';
 useEffect(()=>{
  setDecodedMirrorImage('');
  if(!backdropReady||!mirrorImage)return;
  let active=true;
  const image=new Image();
  const reveal=()=>{if(active)setDecodedMirrorImage(mirrorImage);};
  const decodeArtwork=()=>{
   if(typeof image.decode==='function')image.decode().then(reveal,reveal);
   else reveal();
  };
  image.onload=decodeArtwork;
  image.src=mirrorImage;
  if(image.complete&&image.naturalWidth)decodeArtwork();
  return ()=>{active=false;image.onload=null;};
 },[backdropReady,mirrorImage]);
 // Depth is purely decorative. Never move the real mirror text, tap targets,
 // backdrop crop, or saved learner state with the pointer.
 const moveBackdrop=(event:React.PointerEvent<HTMLDivElement>)=>{
  if(reduced||event.pointerType==='touch')return;
  const rect=event.currentTarget.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const x=(event.clientX-rect.left)/rect.width-.5;
  const y=(event.clientY-rect.top)/rect.height-.5;
  scene.current?.style.setProperty('--li-home-depth-x',`${(x*-10).toFixed(2)}px`);
  scene.current?.style.setProperty('--li-home-depth-y',`${(y*-8).toFixed(2)}px`);
 };
 const resetBackdrop=()=>{
  scene.current?.style.setProperty('--li-home-depth-x','0px');
  scene.current?.style.setProperty('--li-home-depth-y','0px');
 };
 return <div ref={scene} data-li-react-screen="home" data-li-motion={reduced?'reduced':'full'}
  className="hero" role="region" aria-label={L("Cảnh thư viện cổ thụ và Gương Vạn Vấn","Ancient library and the Mirror of Questions")}
  onPointerMove={moveBackdrop} onPointerLeave={resetBackdrop}>
  <div className="li-home-ambient" aria-hidden="true">
   <span className="li-home-ambient-glow"/>
   <span className="li-home-glint li-home-glint-one"/>
   <span className="li-home-glint li-home-glint-two"/>
   <span className="li-home-glint li-home-glint-three"/>
   <span className="li-home-glint li-home-glint-four"/>
  </div>
  <motion.div className="hero-left"
   initial={reduced?false:{opacity:0,y:9}} animate={{opacity:1,y:0}}
   transition={{duration:reduced?0:.5,ease:'easeOut'}}>
   <Button variant="ghost" className="home-checkin"
    aria-label={L("Check-in hôm nay","Today's check-in")}
    onClick={()=>window.dispatchEvent(new CustomEvent('li:open-checkin',{detail:{triggerId:'li-react-home-host'}}))}>
    <LiIcon name="calendar" size={16}/> <span className="home-checkin-label">Check-in</span>
   </Button>
   <Heading level={1} role="headline">{locale==='vi'?<>Mọi câu hỏi<br/>đều có rễ.</>:<>Every question<br/>has roots.</>}</Heading>
   <Text role="body">{L("Không cần biết tất cả. Chỉ cần không ngừng tò mò.","You needn’t know everything. Just stay curious.")}</Text>
   <span className="tiny-note">{L("Một câu hỏi, muôn ngả đường","One question, countless paths")}</span>
  </motion.div>
   <div className="li-home-mirror-artwork" aria-hidden="true">
    <AnimatePresence initial={false}>
     {backdropReady&&decodedMirrorImage===mirrorImage&&mirrorImage&&<motion.img key={mirrorImage} src={mirrorImage} alt=""
      draggable={false} decoding="async"
      initial={reduced?false:{opacity:0,scale:1.06}}
      animate={{opacity:1,scale:1}}
      exit={{opacity:0,scale:1.04}}
      transition={{duration:reduced?0:.42,ease:'easeInOut'}}
      className="li-home-mirror-art-image"/>}
    </AnimatePresence>
    <span className="li-home-mirror-art-vignette"/>
   </div>
  <div className="mirror-message" data-li-mirror-topic={mirror.fieldId||"none"}
   data-li-mirror-image={mirrorImage?"mapped":"unmapped"}
   onTouchStart={event=>{
    if(event.touches.length!==1||(event.target as HTMLElement).closest('button'))return;
    gesture.current={x:event.touches[0].clientX,y:event.touches[0].clientY};
   }}
   onTouchEnd={event=>{
    const start=gesture.current;gesture.current=null;
    if(!start||event.changedTouches.length!==1)return;
    const touch=event.changedTouches[0],dx=touch.clientX-start.x,dy=touch.clientY-start.y;
    if(Math.abs(dx)>=42&&Math.abs(dx)>=Math.abs(dy)*1.3)shift(dx<0?1:-1);
   }}>
   <div className="li-home-mirror-float">
   <motion.div key={mirror.question+'|'+mirror.scene} className="li-home-mirror-inner"
    initial={reduced?false:{opacity:0,y:7,scale:.975}}
    animate={{opacity:1,y:0,scale:1}}
    transition={reduced?{duration:0}:{duration:.36,ease:'easeOut'}}>
    <div aria-live="polite" aria-atomic="true">
     <Heading level={2} role="titleMedium">{authoredCopy(mirror.question)}</Heading>
    </div>
    <div className="mirror-controls" role="group" aria-label={L("Chuyển câu hỏi","Switch questions")}>
     <Button variant="ghost" className="mirror-refresh"
      aria-label={L("Câu hỏi trước","Previous question")} onClick={()=>shift(-1)}>
      <LiIcon name="chevron-left" size={20}/>
     </Button>
     <Button variant="ghost" className="mirror-refresh"
      aria-label={L("Câu hỏi tiếp theo","Next question")} onClick={()=>shift(1)}>
      <LiIcon name="chevron-right" size={20}/>
     </Button>
    </div>
   </motion.div>
   </div>
  </div>
  <motion.aside className="hero-dialogue" aria-label={L("Lão Lý kể bối cảnh câu hỏi","Elder Ly explains the question’s context")}
   initial={reduced?false:{opacity:0}} animate={{opacity:1}}
   transition={{duration:reduced?0:.52,delay:reduced?0:.14}}>
   <span className="hero-dialogue-avatar" aria-hidden="true">
    <motion.img src="./assets/laoly-neutral.png" alt="" width="128" height="128"
     animate={reduced?{y:0}:{y:[0,-9,0]}}
     transition={reduced?{duration:0}:{duration:4.1,repeat:Infinity,ease:'easeInOut'}}/>
   </span>
   <div className="hero-dialogue-bubble" role="note">
    <div className="hero-dialogue-label"><span className="example-label">{authoredCopy(mirror.source)}</span></div>
    <Text role="body">{authoredCopy(mirror.scene)}</Text>
   </div>
  </motion.aside>
  <div className="hero-actions">
   <Button variant="secondary" className="mirror-save-action"
    aria-label={mirror.saved?L('Bỏ lưu câu hỏi','Remove saved question'):L('Lưu câu hỏi','Save question')} aria-pressed={mirror.saved}
    onClick={()=>inquiryFlow().toggleQuestion()}>
    <span className="action-icon"><LiIcon name="bookmark" size={22}/></span>
    <span>{mirror.saved?L('Đã lưu','Saved'):L('Lưu câu hỏi','Save question')}</span>
   </Button>
   <Button variant="primary" className="primary" onClick={()=>openRoute(mirror.route)}
    aria-label={mirror.route.startsWith('lessonL')?L('Khám phá · Mở bài học liên quan','Explore · Open related lesson'):L('Đào sâu · Mở Khảo Chứng','Investigate · Open research')}>
    <span className="action-icon"><LiIcon name="arrow-right" size={22}/></span>
    <span>{mirror.route.startsWith('lessonL')?L('Khám phá','Explore'):L('Đào sâu','Investigate')}</span>
   </Button>
  </div>
 </div>;
}
export function mountHomeAndCatalog(){
 const home=document.getElementById('page-home');
 const catalog=document.getElementById('page-catalog');
 const oldHome=homeLegacy();
 const oldCatalog=catalog?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!home||!catalog||!app.liCatalog||!window.liInquiryFlow){
  throw Error('REACT_HOME_CATALOG_PORTS_REQUIRED');
 }
 // Avoid constructing learner-specific Home bookmarks and course progress in
 // the DOM before the Neon invitation + per-account owner checks succeed.
 let dispose:(()=>void)|null=null;
 const update=()=>{
  const allowed=document.documentElement.classList.contains('li-auth-verified');
  if(allowed&&!dispose){
   const homeHost=document.createElement('div');
   homeHost.id='li-react-home-host';
   const catalogHost=document.createElement('div');
   catalogHost.id='li-react-catalog-host';catalogHost.className='section-shell';
   home.append(homeHost);catalog.append(catalogHost);
   const homeRoot=createRoot(homeHost),catalogRoot=createRoot(catalogHost);
   app.liReactCatalogMounted=true;
   homeRoot.render(<Home/>);catalogRoot.render(<Catalog/>);
   if(oldHome){oldHome.hidden=true;oldHome.style.display='none';}
   if(oldCatalog){oldCatalog.hidden=true;oldCatalog.style.display='none';}
   dispose=()=>{
    app.liReactCatalogMounted=false;
    homeRoot.unmount();catalogRoot.unmount();homeHost.remove();catalogHost.remove();
    // Refresh the old fallback ONCE on unmount instead of each React path change.
    app.liCatalog?.render();
    if(oldHome){oldHome.hidden=false;oldHome.style.removeProperty('display');}
    if(oldCatalog){oldCatalog.hidden=false;oldCatalog.style.removeProperty('display');}
   };
  }else if(!allowed&&dispose){
   dispose();dispose=null;
  }
 };
 window.addEventListener('li:auth-verified-changed',update);
 update();
 return ()=>{window.removeEventListener('li:auth-verified-changed',update);dispose?.();};
}

// Direct React screens for the global shell owner to mount without legacy HTML.
export {Home as HomeScreen,Catalog as CatalogScreen};
