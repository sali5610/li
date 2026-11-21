import React,{useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {LiIcon} from './LucideIcons';
import {BookwormIllustration} from './BookwormIllustration';
import type {BookwormArtKind} from './BookwormIllustration';
import './bookworm-scrapbook.css';

/** Scrapbook is presentation-only: children are the original screen UI.
 * Its open/closed state never touches saved notes, progress or the backend. */
export function BookwormScrapbook({locale,kind,children}:{
 locale:'vi'|'en';kind:'collection'|'note'|'capture';children:React.ReactNode
}){
 const [open,setOpen]=useState(true);
 const reduced=useReducedMotion();
 const title=kind==='collection'?(locale==='vi'?'BỘ SƯU TẬP':'COLLECTION'):
  kind==='note'?(locale==='vi'?'BÚT KÝ':'NOTES'):
  locale==='vi'?'NHẶT Ý':'CAPTURE';
 const art:BookwormArtKind=kind==='collection'?'shelf':'quill';
 return <section className="li-bw-scrapbook" data-open={open?'true':'false'}>
  <header className="li-bw-scrapbook-header">
   <span className="li-bw-scrapbook-label">
    <LiIcon name={kind==='collection'?'archive':kind==='note'?'feather':'bookmark'} size={17}/>
    {title}
   </span>
   <button type="button" className="li-bw-scrapbook-toggle"
    onClick={()=>setOpen(value=>!value)} aria-expanded={open}
    aria-label={open?(locale==='vi'?'Gập sổ lưu niệm':'Close scrapbook'):
     locale==='vi'?'Mở sổ lưu niệm':'Open scrapbook'}>
    <LiIcon name={open?'book-open':'bookmark'} size={17}/>
    {open?(locale==='vi'?'Gập sổ':'Close'):locale==='vi'?'Mở sổ':'Open'}
   </button>
  </header>
  <AnimatePresence initial={false}>
   {open&&<motion.div key="scrapbook-pages" className="li-bw-scrapbook-pages"
    initial={reduced?false:{opacity:0,rotateX:-12,y:-14}}
    animate={{opacity:1,rotateX:0,y:0}}
    exit={reduced?{opacity:0}:{opacity:0,rotateX:-8,y:-10}}
    transition={{duration:reduced?0:.4,ease:[.22,1,.36,1]}}>
    <div className="li-bw-scrapbook-seal" aria-hidden="true"><LiIcon name="star" size={18}/></div>
    <div className="li-bw-scrapbook-body">{children}</div>
    <div className="li-bw-scrapbook-engraving" aria-hidden="true"><BookwormIllustration kind={art}/></div>
   </motion.div>}
  </AnimatePresence>
 </section>;
}
