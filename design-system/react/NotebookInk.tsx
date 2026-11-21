import React from 'react';
import {motion,useReducedMotion} from 'motion/react';
import './notebook-ink-book.css';

/** The user's words stay ordinary DOM text; strokes are visual only. */
export function NotebookInk({children,kind='highlight',tone='olive'}:{
 children:React.ReactNode;
 kind?:'highlight'|'circle';
 tone?:'olive'|'wine'|'blue';
}){
 const reduced=useReducedMotion();
 return <span className="li-nb-ink" data-mark={kind} data-tone={tone}>
  <span className="li-nb-ink-words">{children}</span>
  {kind==='highlight'
   ?<motion.span className="li-nb-ink-highlight" aria-hidden="true"
     initial={reduced?false:{scaleX:0}}
     whileInView={reduced?undefined:{scaleX:1}}
     animate={reduced?{scaleX:1}:undefined}
     viewport={{once:true,amount:.2}}
     transition={{duration:reduced?0:.66,ease:[.15,.75,.24,1]}}/>
   :<svg className="li-nb-ink-circle" viewBox="0 0 240 82"
     preserveAspectRatio="none" aria-hidden="true" focusable="false">
     <motion.path
      d="M18 42C8 13 70 3 134 7C203 12 232 24 230 45C226 68 181 77 118 74C49 75 10 62 18 42Z"
      fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"
      initial={reduced?false:{pathLength:0,opacity:0}}
      whileInView={reduced?undefined:{pathLength:1,opacity:.88}}
      animate={reduced?{pathLength:1,opacity:.88}:undefined}
      viewport={{once:true,amount:.2}}
      transition={{duration:reduced?0:1.05,ease:'easeInOut',delay:reduced?0:.16}}/>
    </svg>}
 </span>;
}
