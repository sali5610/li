import React from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {Heading,Text} from './Atoms';
import {VintagePopArt} from './VintagePopArt';

/** Open-book layout for the existing lesson content. The caller supplies the
 * same intro, diagram, chapters and practice action used by other layouts. */
export function VintagePopLessonBook({intro,diagram,chapters,practiceAction}:{
 intro:React.ReactNode;diagram:React.ReactNode;
 chapters:ReadonlyArray<{title:string;description:string}>;
 practiceAction:React.ReactNode;
}){
 const reduced=useReducedMotion();
 return <article className="li-pop-lesson">
  <span className="li-pop-lesson-bookmark" aria-hidden="true"/>
  <motion.div className="li-pop-book-left"
   initial={reduced?false:{opacity:.92,rotateY:-7}}
   animate={{opacity:1,rotateY:0}}
   transition={{duration:reduced?0:.5,ease:[.22,1,.36,1]}}>
   {intro}
   <div className="li-pop-lesson-illustration"><VintagePopArt kind="book" size="hero"/></div>
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
  {practiceAction}
 </article>;
}
