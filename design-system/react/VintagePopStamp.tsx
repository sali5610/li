import React from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';

/** Reuses the archived official li. seal; purely a visual state reaction.
 * active changes only when the parent-owned fixture action changes. */
export function VintagePopStamp({active}:{active:boolean}){
 const reduced=useReducedMotion();
 return <AnimatePresence>
  {active&&<motion.span key="imprint" className="li-pop-stamp-imprint" aria-hidden="true"
   initial={reduced?false:{opacity:0,scale:1.8,rotate:-24,y:-24}}
   animate={{opacity:.82,scale:1,rotate:-12,y:0}}
   exit={reduced?{opacity:0}:{opacity:0,scale:.85}}
   transition={{duration:reduced?0:.42,ease:[.2,1.4,.3,1]}}>
   <img src="../assets/li-seal.svg" alt="" width={88} height={88}/>
  </motion.span>}
 </AnimatePresence>;
}
