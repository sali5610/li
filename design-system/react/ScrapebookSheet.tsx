import React,{useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {LiIcon} from './LucideIcons';
import {NotebookAnnotation} from './NotebookAnnotation';

/**
 * UI Lab-only scrapbook stage. Reuses the canonical NotebookAnnotation while
 * the actual page remains the Vintage Pop HomeLayout/AppPageLayout.
 * Peel/re-stick is an ephemeral visual interaction, never learner persistence.
 */
export function ScrapebookSheet({locale,mini,children}:{
 locale:'vi'|'en';mini:boolean;children:React.ReactNode;
}){
 const reduced=useReducedMotion();
 const [peeled,setPeeled]=useState(false);
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 return <div className="li-scrapebook-sheet" data-mini={mini?'true':'false'}>
  <div className="li-scrapebook-masthead">
   <span className="li-scrapebook-folio" aria-hidden="true">li. / CUT · PASTE · THINK</span>
   {!mini&&<div className="li-scrapebook-handwriting">
    <NotebookAnnotation text={t('Nhặt một mảnh, ghép một ý.','Collect a piece, connect an idea.')} />
   </div>}
   {mini?<span className="li-scrapebook-sticker li-scrapebook-sticker--mini" aria-hidden="true">
    <LiIcon name="sparkles" size={17}/> {t('SỔ GHÉP','SCRAPEBOOK')}
   </span>:
   <motion.button type="button" className="li-scrapebook-sticker"
    aria-pressed={peeled}
    aria-label={peeled?t('Dán sticker lại','Stick the sticker back'):t('Bóc sticker giấy','Peel the paper sticker')}
    onClick={()=>setPeeled(value=>!value)}
    initial={reduced?false:{opacity:0,y:-12,rotate:-14,scale:.85}}
    animate={{opacity:1,y:peeled?-9:0,rotate:peeled?-18:6,scale:peeled?1.05:1}}
    whileTap={reduced?undefined:{scale:.94}}
    transition={reduced?{duration:0}:{type:'spring',stiffness:250,damping:18}}>
    <LiIcon name={peeled?'bookmark':'sparkles'} size={18}/>
    <span>{peeled?t('DÁN LẠI','RE-STICK'):t('BÓC STICKER','PEEL STICKER')}</span>
   </motion.button>}
  </div>
  <div className="li-scrapebook-canvas">
   <motion.span className="li-scrapebook-washi" aria-hidden="true"
    initial={reduced?false:{opacity:0,y:-14,rotate:-21}}
    animate={{opacity:1,y:0,rotate:-11}}
    transition={{duration:reduced?0:.46,delay:reduced?0:.16,ease:[.22,1,.36,1]}}/>
   <span className="li-scrapebook-paper-edge" aria-hidden="true"/>
   {children}
  </div>
 </div>;
}
