import {openRoute} from './app-router.js';
import {releasedLessonRoutes,personalStudyRoute,personalStudyLessonIds} from '../learning/released-lessons.js';
import {inquiryFlow} from './inquiry-port.js';
import type {MirrorView} from './inquiry-port.js';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {Badge,Button,Card,Heading,Progress,Text} from '../../../../design-system/react/index';
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
 LI_CATALOG_DATA?:Group[];
 liReactCatalogMounted?:boolean;
 liCatalog?:CatalogPort;
 liLanguage?:{get:()=>string};
};
const app=window as AppWindow;
const groups=Array.isArray(app.LI_CATALOG_DATA)?app.LI_CATALOG_DATA:[];
const releasedRoutes=new Map(releasedLessonRoutes.map(item=>[item.id,item.route]));
const canOpenLesson=(lesson:Lesson)=>!!personalStudyRoute(lesson.id)||
 (lesson.published===true&&typeof lesson.route==='string'&&
 releasedRoutes.get(lesson.id)===lesson.route);

function useLocale():Locale{
 const [locale,setLocale]=useState<Locale>(app.liLanguage?.get()==='en'?'en':'vi');
 useEffect(()=>{
  const update=()=>setLocale(app.liLanguage?.get()==='en'?'en':'vi');
  window.addEventListener('li:localechange',update);
  return ()=>window.removeEventListener('li:localechange',update);
 },[]);
 return locale;
}
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
 return <Card variant="tinted" className="catalog-card" data-li-react-catalog-card>
  {image?<img className="catalog-card-art" src={image} alt="" loading="lazy" decoding="async"/>:<div className="catalog-card-mark" aria-hidden="true">{String(number).padStart(2,'0')}</div>}
  <div className="kicker">{eyebrow}</div>
  <Heading level={2} role="titleMedium">{title}</Heading>
  <Text role="support" className="small">{detail}</Text>
  <Button variant="secondary" className="catalog-card-action"
   onClick={onOpen}>{locale==='vi'?'Khám phá':'Explore'}</Button>
 </Card>;
}
function Catalog(){
 const reduced=useReducedMotion();
 const locale=useLocale();
 const path=useCatalogPath();
 const [,forceProgress]=useState(0);
 const [lessonNavError,setLessonNavError]=useState('');
 useEffect(()=>{
  const update=()=>forceProgress(x=>x+1);
  window.addEventListener('li:personal-sync-applied',update);
  window.addEventListener('li:learning-sync-report',update);
  window.addEventListener('li:activity',update);
  return ()=>{
   window.removeEventListener('li:personal-sync-applied',update);
   window.removeEventListener('li:learning-sync-report',update);
   window.removeEventListener('li:activity',update);
  };
 },[]);
 const group=groups.find(item=>item.id===path[0]);
 const field=group?.fields.find(item=>item.id===path[1]);
 const course=field?.courses.find(item=>item.id===path[2]);
 const lesson=course?.lessons.find(item=>item.id===path[3]);
 const breadcrumb=[{label:locale==='vi'?'Tàng Thư':'Library',path:[] as string[]}];
 if(group)breadcrumb.push({label:group.title,path:[group.id]});
 if(field)breadcrumb.push({label:field.name,path:[group!.id,field.id]});
 if(course)breadcrumb.push({label:course.title,path:[group!.id,field!.id,course.id]});
 if(lesson)breadcrumb.push({label:lesson.title,path:[group!.id,field!.id,course!.id,lesson.id]});
 const heading=lesson?.title||course?.title||field?.name||group?.title||(locale==='vi'?'Tàng Thư':'Library');
 const eyebrow=lesson?(locale==='vi'?'BÀI HỌC · ':'LESSON · ')+lesson.id:
  course?(locale==='vi'?'MÔN HỌC · ':'COURSE · ')+course.id:
  field?(locale==='vi'?'CHUYÊN NGÀNH':'FIELD'):
  group?(locale==='vi'?'NHÓM NGÀNH':'DOMAIN GROUP'):
  (locale==='vi'?'KHÁM PHÁ TRI THỨC':'EXPLORE KNOWLEDGE');
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
  const personalRoute=personalStudyRoute(item.id);
  if(personalRoute){
   if(!openRoute(personalRoute)){
    setLessonNavError('Bài học chưa tải được. Thử tải lại trang; tiến độ cũ vẫn được giữ.');
   }else setLessonNavError('');
   return;
  }
  if(canOpenLesson(item)){app.liCatalog?.openLesson(item.id);return;}
  // Outlines without content remain non-learnable.
  openPath([...path.slice(0,3),item.id]);
 };
 const available=course?courseProgress(course):null;
 return <motion.div key={path.join('/')||'catalog-root'} data-li-react-screen="catalog"
   className="li-react-catalog" initial={reduced?false:{opacity:0,y:7}}
   animate={{opacity:1,y:0}} transition={reduced?{duration:0}:{duration:0.18}}>
  <nav className="catalog-breadcrumbs" aria-label={locale==='vi'?'Vị trí trong Tàng Thư':'Library path'}>
   {breadcrumb.map((item,index)=><React.Fragment key={item.path.join('/')||'root'}>
    {index>0&&<span aria-hidden="true" className="catalog-crumb-divider">›</span>}
    {index===breadcrumb.length-1?
     <span className="catalog-crumb-current" aria-current="page">{item.label}</span>:
     <Button variant="ghost" className="catalog-crumb" onClick={()=>openPath(item.path)}>{item.label}</Button>}
   </React.Fragment>)}
  </nav>
  <div className="kicker">{eyebrow}</div>
  <Heading level={1} role="headline" className="display-title">{heading}</Heading>
   {lessonNavError&&<p role="alert" className="li-catalog-error">{lessonNavError}</p>}
  <Text role="body" className="intro">{description}</Text>
   {field&&!course&&field.image&&<img className="catalog-field-hero" src={field.image} alt="" loading="lazy" decoding="async"/>}
  {!group&&<><div className="catalog-group-grid">
   {groups.map((item,index)=><CatalogCard key={item.id} number={index+1}
    title={item.title} eyebrow={locale==='vi'?'NHÓM NGÀNH':'DOMAIN GROUP'}
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
    title={item.name} image={item.image} eyebrow={locale==='vi'?'CHUYÊN NGÀNH':'FIELD'}
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
     {field.courses.filter(item=>item.level===level).map(item=><Card variant="raised"
      key={item.id} className="catalog-course-card">
      <div className="kicker">{item.id} · {locale==='en'?en:vi}</div>
      <Heading level={3} role="titleMedium">{item.title}</Heading>
      <ol className="catalog-preview-lessons">
       {item.lessons.map(l=><li key={l.id}
        className={canOpenLesson(l)?'catalog-preview-published':undefined}>{l.title}</li>)}
      </ol>
      <Button variant="secondary" className="catalog-card-action"
       onClick={()=>openPath([group!.id,field!.id,item.id])}>
       {locale==='vi'?'Xem môn học':'View course'}
      </Button>
     </Card>)}
    </div>
   </section>)}
  </div>}
  {course&&!lesson&&<><Card variant="raised" className="catalog-progress">
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
  </Card>
  <ol className="catalog-lesson-list">
   {course.lessons.map((item,index)=><li key={item.id} className="surface catalog-lesson-card">
    <span className="catalog-lesson-order" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
    <div className="catalog-lesson-desc">
     <Heading level={2} role="titleSmall">{item.title}</Heading>
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
  {lesson&&<Card variant="tinted" className="catalog-draft-content">
   <div className="kicker">{locale==='vi'?'CHƯA PHÁT HÀNH':'NOT RELEASED'}</div>
   <Heading level={2} role="titleMedium">{locale==='vi'?'Nội dung đang được biên soạn':'Content in progress'}</Heading>
   <Text role="body">{locale==='vi'?'Bài chưa có chương, bài tập hoặc tiến độ học được phép phát hành.':
    'This outline has no lesson content, practice or progress approved for release.'}</Text>
  </Card>}
 </motion.div>;
}

const homeLegacy=()=>document.querySelector<HTMLElement>('#page-home > .hero');
const mirrorFallback:MirrorView={index:0,fieldId:'',question:'',scene:'',source:'',
 route:'research',cta:'Đào sâu',saved:false};
function readMirror():MirrorView{
 return inquiryFlow().getMirror()||mirrorFallback;
}
function Home(){
 const reduced=useReducedMotion();
 const [mirror,setMirror]=useState<MirrorView>(readMirror);
 const gesture=useRef<{x:number;y:number}|null>(null);
 const scene=useRef<HTMLDivElement>(null);
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
 const mirrorImage=(Array.isArray(app.LI_CATALOG_DATA)?app.LI_CATALOG_DATA:[])
  .flatMap(group=>group.fields)
  .find(field=>field.id===mirror.fieldId)?.image||'';
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
  className="hero" role="region" aria-label="Cảnh thư viện cổ thụ và Gương Vạn Vấn"
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
   <Button variant="primary" className="home-checkin" onClick={()=>window.dispatchEvent(new CustomEvent('li:open-checkin',{detail:{triggerId:'li-react-home-host'}}))}>
    <LiIcon name="check" size={18}/> Check-in hôm nay
   </Button>
   <Heading level={1} role="headline">Mọi câu hỏi<br/>đều có rễ.</Heading>
   <Text role="body">Không cần biết tất cả. Chỉ cần không ngừng tò mò.</Text>
   <span className="tiny-note">Một câu hỏi, muôn ngả đường</span>
  </motion.div>
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
   <div className="li-home-mirror-artwork" aria-hidden="true">
    <AnimatePresence initial={false}>
     {mirrorImage&&<motion.img key={mirrorImage} src={mirrorImage} alt=""
      draggable={false} decoding="async"
      initial={reduced?false:{opacity:0,scale:1.06}}
      animate={{opacity:1,scale:1}}
      exit={{opacity:0,scale:1.04}}
      transition={{duration:reduced?0:.42,ease:'easeInOut'}}
      className="li-home-mirror-art-image"/>}
    </AnimatePresence>
    <span className="li-home-mirror-art-vignette"/>
   </div>
   <div className="li-home-mirror-float">
   <motion.div key={mirror.question+'|'+mirror.scene} className="li-home-mirror-inner"
    initial={reduced?false:{opacity:0,y:7,scale:.975}}
    animate={{opacity:1,y:0,scale:1}}
    transition={reduced?{duration:0}:{duration:.36,ease:'easeOut'}}>
    <div aria-live="polite" aria-atomic="true">
     <Heading level={2} role="titleMedium">{mirror.question}</Heading>
    </div>
    <div className="mirror-controls" role="group" aria-label="Chuyển câu hỏi">
     <Button variant="ghost" className="mirror-refresh"
      aria-label="Câu hỏi trước" onClick={()=>shift(-1)}>
      <LiIcon name="chevron-left" size={20}/>
     </Button>
     <Button variant="ghost" className="mirror-refresh"
      aria-label="Câu hỏi tiếp theo" onClick={()=>shift(1)}>
      <LiIcon name="chevron-right" size={20}/>
     </Button>
    </div>
   </motion.div>
   </div>
  </div>
  <motion.aside className="hero-dialogue" aria-label="Lão Lý kể bối cảnh câu hỏi"
   initial={reduced?false:{opacity:0}} animate={{opacity:1}}
   transition={{duration:reduced?0:.52,delay:reduced?0:.14}}>
   <span className="hero-dialogue-avatar" aria-hidden="true">
    <motion.img src="./assets/laoly-neutral.png" alt="" width="128" height="128"
     animate={reduced?{y:0}:{y:[0,-9,0]}}
     transition={reduced?{duration:0}:{duration:4.1,repeat:Infinity,ease:'easeInOut'}}/>
   </span>
   <div className="hero-dialogue-bubble" role="note">
    <div className="hero-dialogue-label"><span className="example-label">{mirror.source}</span></div>
    <Text role="body">{mirror.scene}</Text>
   </div>
  </motion.aside>
  <div className="hero-actions">
   <Button variant="primary" className="primary" onClick={()=>openRoute(mirror.route)}
    aria-label={mirror.route.startsWith('lessonL')?'Khám phá vì sao · Mở bài học liên quan':'Đào sâu · Mở Khảo Chứng'}>
    <span className="action-icon"><LiIcon name="arrow-right" size={22}/></span>
    <span>{mirror.cta}</span>
   </Button>
   <Button variant="primary" className="primary mirror-save-action"
    aria-label={mirror.saved?'Bỏ lưu câu hỏi':'Lưu câu hỏi'} aria-pressed={mirror.saved}
    onClick={()=>inquiryFlow().toggleQuestion()}>
    <span className="action-icon"><LiIcon name="bookmark" size={22}/></span>
    <span>{mirror.saved?'Đã lưu':'Lưu câu hỏi'}</span>
   </Button>
  </div>
 </div>;
}
export function mountHomeAndCatalog(){
 const home=document.getElementById('page-home');
 const catalog=document.getElementById('page-catalog');
 const oldHome=homeLegacy();
 const oldCatalog=catalog?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!home||!catalog||!oldHome||!oldCatalog||!app.liCatalog||!window.liInquiryFlow){
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
   oldHome.hidden=true;oldHome.style.display='none';
   oldCatalog.hidden=true;oldCatalog.style.display='none';
   dispose=()=>{
    app.liReactCatalogMounted=false;
    homeRoot.unmount();catalogRoot.unmount();homeHost.remove();catalogHost.remove();
    // Refresh the old fallback ONCE on unmount instead of each React path change.
    app.liCatalog?.render();
    oldHome.hidden=false;oldHome.style.removeProperty('display');
    oldCatalog.hidden=false;oldCatalog.style.removeProperty('display');
   };
  }else if(!allowed&&dispose){
   dispose();dispose=null;
  }
 };
 const observer=new MutationObserver(update);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 update();
 return ()=>{observer.disconnect();dispose?.();};
}
