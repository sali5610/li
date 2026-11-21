import React,{useState} from 'react';
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
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const chapter=chapters[page];
 return <div className="li-bw-reader">
  <div className="li-bw-reader-folio-label" aria-hidden="true">
   <span>li. / {t('BÀI HỌC · SÁCH MINH HỌA','ILLUSTRATED LESSON')}</span>
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
    <span className="li-bw-reader-folio" aria-hidden="true">{String(page+2).padStart(2,'0')}</span>
   </article>
  </div>
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
