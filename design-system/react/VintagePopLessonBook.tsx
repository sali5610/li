import React,{useContext,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {Heading,Text} from './Atoms';
import {LiIcon} from './LucideIcons';
import {VintagePopCollage} from './VintagePopCollage';
import {VintagePopStamp} from './VintagePopStamp';
import {FoldableLessonNote} from './BookwormLessonBook';
import {ScrapebookBookmarkContext} from './ScrapebookSheet';

/** Canonical lesson content is supplied from AppFlowLayouts. Only the
 * visual book, bookmark, paper-corner and collage are owned here. */
export function VintagePopLessonBook({locale,intro,diagram,chapters,practiceAction,showExamplePaper=false}:{
 locale:'vi'|'en';intro:React.ReactNode;diagram:React.ReactNode;
 chapters:ReadonlyArray<{title:string;description:string}>;
 practiceAction:React.ReactNode;
 showExamplePaper?:boolean;
}){
 const reduced=useReducedMotion();
 const [marked,setMarked]=useState(false);
 const coverMarked=useContext(ScrapebookBookmarkContext);
 const [cornerOpen,setCornerOpen]=useState(false);
 return <>
 <article className="li-pop-lesson" data-corner={cornerOpen?'lifted':'flat'}>
  {coverMarked===null&&<motion.button type="button" className="li-pop-lesson-bookmark"
   onClick={()=>setMarked(v=>!v)} aria-pressed={marked}
   aria-label={locale==='vi'?'Đánh dấu trang sách (bản thử)':'Bookmark the preview page'}
   whileTap={reduced?undefined:{scale:.94}}
   animate={{y:marked?10:0}} transition={{duration:reduced?0:.25}}>
   <LiIcon name="bookmark" size={20}/>
  </motion.button>}
  <motion.div className="li-pop-book-left"
   initial={reduced?false:{opacity:.92,rotateY:-7}}
   animate={{opacity:1,rotateY:0}}
   transition={{duration:reduced?0:.5,ease:[.22,1,.36,1]}}>
   {intro}
   <div className="li-pop-lesson-illustration"><VintagePopCollage kind="data" size="card"/></div>
  </motion.div>
  {diagram}
  <div className="li-flow-card-grid">
   {chapters.map(({title,description},i)=><section key={title} className="li-pop-book-chapter">
    <span className="li-flow-index" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
    <div><Heading level={3} role="titleMedium">{title}</Heading>
     <Text role="support">{description}</Text></div>
   </section>)}
  </div>
  <span className="li-pop-lesson-page-number" aria-hidden="true">01 · 02</span>
  <motion.button type="button" className="li-pop-page-corner"
   aria-pressed={cornerOpen}
   aria-label={locale==='vi'?'Lật mép trang':'Lift page corner'}
   onClick={()=>setCornerOpen(v=>!v)}
   animate={{rotate:cornerOpen?-19:0,x:cornerOpen?-7:0,y:cornerOpen?-8:0}}
   transition={{duration:reduced?0:.32,ease:[.22,1,.36,1]}}>
   <LiIcon name="book-open" size={17}/>
  </motion.button>
  <VintagePopStamp active={coverMarked??marked}/>
  {practiceAction}
 </article>
 {showExamplePaper&&chapters[1]&&<div className="li-scrapebook-example-paper">
  <FoldableLessonNote locale={locale} chapter={chapters[1]}/>
 </div>}
 </>;
}
