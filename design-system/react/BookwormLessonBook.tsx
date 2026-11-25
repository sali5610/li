import React,{useId,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {Button} from './Components';
import {Heading,Text} from './Atoms';
import {LiIcon} from './LucideIcons';
import {BookwormIllustration} from './BookwormIllustration';
import type {BookwormArtKind} from './BookwormIllustration';
import './bookworm-reader.css';

/** Presentational book only: parent owns the canonical lesson copy and next action.
 * Chapters are read by flipping the right leaf; the left leaf stays visible.
 * No progress storage, route logic or lesson content duplication. */
export interface BookwormLessonBookProps{
 locale:'vi'|'en';
 intro:React.ReactNode;
 diagram:React.ReactNode;
 chapters:readonly {title:string;description:string;art:BookwormArtKind}[];
 practiceAction:React.ReactNode;
}
export function BookwormLessonBook({locale,intro,diagram,chapters,practiceAction}:BookwormLessonBookProps){
 const reduced=useReducedMotion();
 const [page,setPage]=useState(0);
 const [bookmark,setBookmark]=useState<number|null>(null);
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const chapter=chapters[page];
 return <div className="li-bw-reader">
  <div className="li-bw-reader-folio-label" aria-hidden="true">
   <span className="li-bw-reader-source-mark"><img src="../assets/li-seal.svg"
     width={29} height={29} loading="lazy" decoding="async" alt="" aria-hidden="true"/>
    li. / {t('BÀI HỌC · SÁCH MINH HỌA','ILLUSTRATED LESSON')}</span>
   <span>{String(page+1).padStart(2,'0')} / {String(chapters.length).padStart(2,'0')}</span>
  </div>
  <div className="li-bw-reader-spread" aria-label={t('Sách học hai trang','Two-page lesson book')}>
   <article className="li-bw-reader-leaf li-bw-reader-leaf--left">
    <div className="li-bw-reader-intro">{intro}</div>
    <div className="li-bw-reader-figure">{diagram}</div>
    <span className="li-bw-reader-folio" aria-hidden="true">01</span>
   </article>
   <article className="li-bw-reader-leaf li-bw-reader-leaf--right" aria-live="polite" aria-atomic="true">
    <AnimatePresence mode="wait" initial={false}>
     <motion.div key={page} className="li-bw-reader-chapter"
      initial={reduced?false:{opacity:0,rotateY:-9,x:20}}
      animate={{opacity:1,rotateY:0,x:0}}
      exit={reduced?{opacity:0}:{opacity:0,rotateY:8,x:-16}}
      transition={{duration:reduced?0:.36,ease:'easeOut'}}>
      <span className="li-bw-reader-chapter-number">{String(page+1).padStart(2,'0')}</span>
      <Heading level={3} role="titleLarge">{chapter.title}</Heading>
      <Text role="body">{chapter.description}</Text>
      <div className="li-bw-reader-engraving" aria-hidden="true">
       <BookwormIllustration kind={chapter.art}/>
      </div>
     </motion.div>
    </AnimatePresence>
    <button className="li-bw-reader-ribbon" type="button"
     aria-pressed={bookmark===page}
     aria-label={bookmark===page?t('Bỏ dấu trang hiện tại','Remove bookmark from current page'):
      t('Đánh dấu trang hiện tại','Bookmark current page')}
     title={bookmark===page?t('Bỏ dấu trang','Remove bookmark'):t('Đánh dấu trang','Bookmark page')}
     onClick={()=>setBookmark(marked=>marked===page?null:page)}>
     <motion.span aria-hidden="true"
      initial={false} animate={reduced?{}:{y:bookmark===page?10:0,scale:bookmark===page?1.05:1}}
      transition={{type:'spring',stiffness:270,damping:19}}>
      <LiIcon name="bookmark" size={19}/>
     </motion.span>
    </button>
    <span className="li-bw-reader-folio" aria-hidden="true">{String(page+2).padStart(2,'0')}</span>
   </article>
  </div>
  <FoldableLessonNote locale={locale} chapter={chapter} trailing={bookmark!==null&&
   <button className="li-bw-reader-bookmark-jump" type="button"
    onClick={()=>setPage(bookmark)}>
    <LiIcon name="bookmark" size={16}/>
    {t('Dấu trang','Bookmarked')}: {chapters[bookmark].title}
   </button>}/>
  <nav className="li-bw-reader-controls" aria-label={t('Điều hướng trang sách','Book page navigation')}>
   <Button variant="secondary" disabled={page===0} onClick={()=>setPage(i=>Math.max(0,i-1))}>
    <LiIcon name="chevron-left" size={17}/>{t('Trang trước','Previous page')}
   </Button>
   <div className="li-bw-reader-page-tabs">
    {chapters.map((item,i)=><button type="button" key={item.title}
     className="li-bw-reader-page-tab" aria-label={item.title}
     aria-current={i===page?'page':undefined}
     onClick={()=>setPage(i)}>{String(i+1).padStart(2,'0')}</button>)}
   </div>
   <Button variant="secondary" disabled={page===chapters.length-1}
    onClick={()=>setPage(i=>Math.min(chapters.length-1,i+1))}>
    {t('Trang sau','Next page')}<LiIcon name="chevron-right" size={17}/>
   </Button>
  </nav>
  <div className="li-bw-reader-next">{practiceAction}</div>
 </div>;
}

/** Shared foldable chapter paper. The existing Bookworm and Scrapebook
 * use the same behavior and actual chapter text, with theme-specific paint. */
export function FoldableLessonNote({locale,chapter,trailing}:{
 locale:'vi'|'en';chapter:{title:string;description:string};trailing?:React.ReactNode;
}){
 const reduced=useReducedMotion();
 const [paperNoteOpen,setPaperNoteOpen]=useState(false);
 const noteId=useId();
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 return <>
  <div className="li-bw-reader-scrap-tools">
   <button className="li-bw-reader-note-toggle" type="button"
    aria-expanded={paperNoteOpen} aria-controls={noteId}
    onClick={()=>setPaperNoteOpen(v=>!v)}>
    <LiIcon name="feather" size={16}/>
    {paperNoteOpen?t('Gấp mẩu giấy','Fold note'):t('Mở mẩu giấy','Unfold note')}
   </button>
   {trailing}
  </div>
  <div id={noteId} style={{display:'contents'}}>
   <AnimatePresence initial={false}>
    {paperNoteOpen&&<motion.div key="scrap-note" className="li-bw-reader-scrap-note"
      initial={reduced?false:{opacity:0,rotate:-5,y:-14,scale:.96}}
      animate={{opacity:1,rotate:-1.5,y:0,scale:1}}
      exit={reduced?{opacity:0}:{opacity:0,rotate:3,y:-8,scale:.97}}
      transition={{duration:reduced?0:.32,ease:'easeOut'}}>
      <LiIcon name="feather" size={18}/>
      <span>{chapter.title}</span>
      <Text role="support">{chapter.description}</Text>
    </motion.div>}
   </AnimatePresence>
  </div>
 </>;
}
