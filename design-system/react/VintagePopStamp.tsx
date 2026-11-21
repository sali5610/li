import React from 'react';
import {AnimatePresence,motion,useInView,useReducedMotion} from 'motion/react';

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

/** A postal ink impression, distinct from the official li. seal.
 * When the visitor SCROLLS to this mark, the ink lands once with a quick
 * press-and-release. No looping or animation before it enters the viewport.
 * Reduced-motion users see the imprint instantly once it becomes visible. */
export function VintagePopPostalMark(){
 const arcId=React.useId();
 const stampRef=React.useRef<HTMLSpanElement>(null);
 const inView=useInView(stampRef,{once:true,amount:0.5,margin:'0px 0px -8% 0px'});
 const reduced=useReducedMotion();
 return <span ref={stampRef} className="li-pop-postal-cancel" aria-hidden="true">
  <motion.svg viewBox="0 0 220 124" fill="none" xmlns="http://www.w3.org/2000/svg"
   focusable="false" initial={false}
   animate={inView?
    reduced?{opacity:1,y:0,scale:1,rotate:0}:
     {opacity:[0,0,1,.82,1],y:[-42,-42,4,-3,0],
      scale:[1.3,1.3,.93,1.04,1],rotate:[-18,-18,2,-2,0]}:
    {opacity:0,y:-42,scale:1.3,rotate:-18}}
   transition={reduced||!inView?{duration:0}:
    {duration:.76,times:[0,.32,.55,.75,1],ease:[.18,.86,.24,1]}}
   style={{transformOrigin:'75% 52%'}}>
   <defs><path id={arcId} d="M121 64 A43 43 0 0 1 207 64"/></defs>
   <g stroke="currentColor" strokeLinecap="round">
    <path d="M6 35 C30 28 48 43 72 35 S111 31 130 36
             M5 45 C29 38 51 53 76 45 S112 41 131 45
             M4 55 C30 48 48 63 74 55 S112 50 130 56
             M5 65 C29 59 52 74 76 65 S110 61 130 66"
     strokeWidth="1.7" opacity=".76"/>
    <circle cx="164" cy="65" r="47" strokeWidth="2.3"
     strokeDasharray="194 2 90 2"/>
    <circle cx="164" cy="65" r="38" strokeWidth="1.2" opacity=".74"
     strokeDasharray="85 2 64 1 84 1"/>
    <path d="M136 66H192" strokeWidth=".95" opacity=".7"/>
   </g>
   <text fill="currentColor" fontFamily="Georgia,serif" fontSize="10.5"
    letterSpacing="1.4" fontWeight="700">
    <textPath href={`#${arcId}`} textAnchor="middle" startOffset="50%">LI. POSTAL</textPath>
   </text>
   <text x="164" y="60" textAnchor="middle" fill="currentColor"
    fontFamily="Georgia,serif" fontSize="16" fontWeight="700">理 · li.</text>
   <text x="164" y="80" textAnchor="middle" fill="currentColor"
    fontFamily="monospace" fontSize="9" letterSpacing="1.3">ARCHIVE 26</text>
  </motion.svg>
 </span>;
}
