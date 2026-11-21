import React,{useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {LiIcon} from './LucideIcons';
import {VintagePopCollage} from './VintagePopCollage';

/** Existing screen controls remain children; folding is visual-only,
 * and never saves, deletes or changes the canonical user data. */
export function VintagePopScrapbook({locale,kind,children}:{
 locale:'vi'|'en';kind:'collection'|'note'|'capture';children:React.ReactNode
}){
 const [open,setOpen]=useState(true);
 const reduced=useReducedMotion();
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 return <section className="li-pop-scrapbook" data-open={open?'true':'false'}>
  <div className="li-pop-scrapbook-top">
   <span className="li-pop-scrapbook-folio" aria-hidden="true">
    <LiIcon name={kind==='collection'?'archive':kind==='capture'?'bookmark':'feather'} size={18}/>
    li. · 01
   </span>
   <button type="button" className="li-pop-scrapbook-toggle"
    aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
    <LiIcon name={open?'book-open':'bookmark'} size={17}/>
    {open?t('Gập scrapbook','Fold scrapbook'):t('Mở scrapbook','Open scrapbook')}
   </button>
  </div>
  <AnimatePresence initial={false}>
   {open&&<motion.div key="scrapbook" className="li-pop-scrapbook-pages"
    initial={reduced?false:{opacity:0,rotateX:-9,y:-18}}
    animate={{opacity:1,rotateX:0,y:0}}
    exit={reduced?{opacity:0}:{opacity:0,rotateX:-8,y:-12}}
    transition={{duration:reduced?0:.4,ease:[.22,1,.36,1]}}>
    <div className="li-pop-scrapbook-photo"><VintagePopCollage
     kind={kind==='capture'?'anthropology':kind==='note'?'sociology':'history'} size="spot"/></div>
    <div className="li-pop-scrapbook-body">{children}</div>
   </motion.div>}
  </AnimatePresence>
 </section>;
}
