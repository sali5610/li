import React from 'react';
import {motion,useReducedMotion} from 'motion/react';
import './notebook-theme.css';
import './notebook-motion.css';

/** Small handwritten marginal note. Presentation-only; no local state. */
export function NotebookAnnotation({text,tone='wine'}:{
 text:string;tone?:'wine'|'blue'
}){
 const reduced=useReducedMotion();
 return <motion.p className="li-notebook-annotation" data-note-tone={tone}
  initial={reduced?false:{opacity:0,y:9,rotate:-2}}
  animate={{opacity:1,y:0,rotate:-1.8}}
  transition={{duration:reduced?0:.42,ease:'easeOut'}}>
  <span className="li-notebook-annotation-mark" aria-hidden="true">✳</span>
  <span>{text}</span>
  <motion.svg className="li-notebook-ink-swash" viewBox="0 0 220 15"
   preserveAspectRatio="none" focusable="false" aria-hidden="true">
   <motion.path d="M3 10 Q57 2 108 9 T217 7" fill="none"
    stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"
    initial={reduced?false:{pathLength:0,opacity:0}}
    animate={{pathLength:1,opacity:.62}}
    transition={{duration:reduced?0:.68,delay:reduced?0:.28,ease:'easeOut'}}/>
  </motion.svg>
 </motion.p>;
}
