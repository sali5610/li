import React,{useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {Button} from './Components';
import {Badge,Heading,Text} from './Atoms';
import {LiIcon} from './LucideIcons';
import {NotebookInk} from './NotebookInk';
import {NotebookArt} from './NotebookArt';

/** A real open-book reading composition, not card wrappers.
 * All existing lesson content is supplied by the canonical lesson screen.
 * Pagination is view-only; no learner progress or external state is written.
 */
export interface NotebookLessonSection {
 heading:string;
 description:string;
}
export function NotebookLessonBook({title,eyebrow,description,diagram,sections,
 onPractice,locale,illustrationSrc}:{
 title:string;eyebrow:string;description:string;diagram:React.ReactNode;
 illustrationSrc?:string;
 sections:readonly NotebookLessonSection[];onPractice:()=>void;locale:'vi'|'en';
}){
 const [spread,setSpread]=useState<0|1>(0);
 const [marked,setMarked]=useState(true);
 const reduced=useReducedMotion();
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const sheetTransition={duration:reduced?0:.38,ease:[.2,.7,.25,1] as [number,number,number,number]};
 return <section className="li-nb-book" aria-label={t('Bài học dạng sách mở','Open book lesson')}>
  <div className="li-nb-book-topline">
   <span><LiIcon name="book-open" size={18}/> {t('Đang đọc','Reading')}</span>
   <button type="button" className="li-nb-book-mark-toggle"
    aria-pressed={marked} onClick={()=>setMarked(value=>!value)}>
    <LiIcon name="feather" size={17}/>
    {marked?t('Ẩn nét bút','Hide ink'):t('Đánh dấu','Mark pages')}
   </button>
  </div>
  <div className="li-nb-book-cover">
   <AnimatePresence initial={false} mode="wait">
    <motion.div key={spread} className="li-nb-book-spread" aria-live="polite"
     initial={reduced?false:{opacity:0,rotateY:spread===0?-5:5,x:spread===0?-10:10}}
     animate={{opacity:1,rotateY:0,x:0}}
     exit={reduced?{opacity:0}:{opacity:0,rotateY:spread===0?5:-5,x:spread===0?10:-10}}
     transition={sheetTransition}>
     {spread===0?
      <>
       <article className="li-nb-book-leaf li-nb-book-leaf--left">
        <div className="li-nb-book-leaf-head">
         <LiIcon name="bookmark" size={18}/><span>{t('Trang mở đầu','Opening page')}</span>
        </div>
        <Badge>{eyebrow}</Badge>
        <Heading level={2} role="titleLarge">
         {marked?<NotebookInk kind="highlight" tone="olive">{title}</NotebookInk>:title}
        </Heading>
        <Text role="body">{description}</Text>
        <span className="li-nb-book-folio" aria-hidden="true">01</span>
       </article>
       <article className="li-nb-book-leaf li-nb-book-leaf--right">
        <div className="li-nb-book-leaf-head">
         <LiIcon name="layers" size={18}/><span>{t('Minh hoạ khái niệm','Concept illustration')}</span>
        </div>
        <div className="li-nb-book-visual">{diagram}</div>
        {illustrationSrc&&<div className="li-nb-book-source-art">
         <NotebookArt kind="discipline" src={illustrationSrc} size="spot"/>
        </div>}
        {marked&&<div className="li-nb-book-ink-doodle">
         <NotebookInk kind="circle" tone="wine">
          <LiIcon name="sparkles" size={24}/>
         </NotebookInk>
        </div>}
        <span className="li-nb-book-folio" aria-hidden="true">02</span>
       </article>
      </>
      :
      <>
       <article className="li-nb-book-leaf li-nb-book-leaf--left">
        <div className="li-nb-book-leaf-head">
         <LiIcon name="feather" size={18}/><span>{t('Ghi chép','Notes')}</span>
        </div>
        {sections.slice(0,2).map((section,i)=>
         <div className="li-nb-book-paragraph" key={section.heading}>
          <Heading level={3} role="titleMedium">
           {marked&&i===0?<NotebookInk kind="circle" tone="wine">{section.heading}</NotebookInk>:section.heading}
          </Heading>
          <Text role="body">{section.description}</Text>
         </div>)}
        <span className="li-nb-book-folio" aria-hidden="true">03</span>
       </article>
       <article className="li-nb-book-leaf li-nb-book-leaf--right">
        <div className="li-nb-book-leaf-head">
         <LiIcon name="check" size={18}/><span>{t('Thử áp dụng','Apply it')}</span>
        </div>
        {sections.slice(2).map(section=>
         <div className="li-nb-book-paragraph" key={section.heading}>
          <Heading level={3} role="titleMedium">
           {marked?<NotebookInk kind="highlight" tone="olive">{section.heading}</NotebookInk>:section.heading}
          </Heading>
          <Text role="body">{section.description}</Text>
         </div>)}
        <div className="li-nb-book-action">
         <Button onClick={onPractice}>
          {t('Làm bài tập','Start practice')} <LiIcon name="arrow-right" size={17}/>
         </Button>
        </div>
        <span className="li-nb-book-folio" aria-hidden="true">04</span>
       </article>
      </>}
    </motion.div>
   </AnimatePresence>
  </div>
  <nav className="li-nb-book-pagination" aria-label={t('Chuyển trang bài học','Lesson pages')}>
   <Button variant="secondary" disabled={spread===0} onClick={()=>setSpread(0)}>
    <LiIcon name="arrow-left" size={18}/> {t('Trang trước','Previous')}
   </Button>
   <span aria-label={t('Vị trí đang đọc','Reading position')} aria-live="polite">
    {spread===0?'01–02':'03–04'} / 04
   </span>
   <Button disabled={spread===1} onClick={()=>setSpread(1)}>
    {t('Trang tiếp','Next pages')} <LiIcon name="arrow-right" size={18}/>
   </Button>
  </nav>
 </section>;
}
