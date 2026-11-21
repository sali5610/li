import React,{useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {BookwormIllustration} from './BookwormIllustration';
import type {BookwormArtKind} from './BookwormIllustration';

/** Renders uploaded, versioned li. assets; no generated artwork or data changes.
 * If a preview image is missing, fall back to an existing archival engraving.
 * Intended only for opt-in Bookworm Lab compositions.
 */
export function BookwormSourceArt({src,format='card',fallback='open'}:{
 src:string;format?:'card'|'spot'|'banner';fallback?:BookwormArtKind
}){
 const [failed,setFailed]=useState(false);
 const reduced=useReducedMotion();
 return <motion.figure className={'li-bw-source-art li-bw-source-art--'+format}
  aria-hidden="true" data-source="uploaded-li-asset"
  initial={reduced?false:{opacity:0,y:12}}
  whileInView={reduced?undefined:{opacity:1,y:0}}
  animate={reduced?{opacity:1}:undefined}
  viewport={{once:true,amount:.1}}
  transition={{duration:reduced?0:.42,ease:'easeOut'}}>
  {failed?<BookwormIllustration kind={fallback}/>:<img src={src} alt=""
   loading="lazy" decoding="async" onError={()=>setFailed(true)}/>}
 </motion.figure>;
}
