import React,{useId,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {LiIcon} from './LucideIcons';
import {NotebookAnnotation} from './NotebookAnnotation';

/**
 * UI Lab-only paper composition over the existing Vintage Pop page.
 * Bookmark, note and sticker are preview states; no saved learner data.
 * The note reuses exactly the source text from Notebook marginalia.
 */
export function ScrapebookSheet({locale,mini,hintText,children}:{
 locale:'vi'|'en';mini:boolean;hintText:string;children:React.ReactNode;
}){
 const reduced=useReducedMotion();
 const [peeled,setPeeled]=useState(false);
 const [bookmarked,setBookmarked]=useState(false);
 const [noteOpen,setNoteOpen]=useState(true);
 const noteId=useId();
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 return <div className="li-scrapebook-sheet" data-mini={mini?'true':'false'}>
  <div className="li-scrapebook-masthead">
   <span className="li-scrapebook-folio" aria-hidden="true">li. / CUT · PASTE · THINK</span>
   {mini?<span className="li-scrapebook-sticker li-scrapebook-sticker--mini" aria-hidden="true">
    <LiIcon name="sparkles" size={17}/> {t('SỔ GHÉP','SCRAPEBOOK')}
   </span>:
   <div className="li-scrapebook-tools">
    <button type="button" className="li-scrapebook-note-toggle"
     aria-controls={noteId} aria-expanded={noteOpen}
     onClick={()=>setNoteOpen(value=>!value)}>
     <LiIcon name={noteOpen?'feather':'book-open'} size={18}/>
     {noteOpen?t('Ẩn ghi chú','Hide note'):t('Hiện gợi ý','Show hint')}
    </button>
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
    </motion.button>
   </div>}
  </div>
  {!mini&&<AnimatePresence initial={false}>
   {noteOpen&&<motion.aside key="hint" id={noteId}
    className="li-scrapebook-hint" role="note"
    aria-label={t('Ghi chú gợi ý bên lề','Marginal hint note')}
    initial={reduced?false:{opacity:0,height:0,y:-8}}
    animate={{opacity:1,height:'auto',y:0}}
    exit={reduced?{opacity:0,height:0}:{opacity:0,height:0,y:-8}}
    transition={{duration:reduced?0:.32,ease:[.22,1,.36,1]}}>
    <div className="li-scrapebook-hint-inner">
     <span className="li-scrapebook-hint-label">{t('GHI CHÚ BÊN LỀ','MARGIN NOTE')}</span>
     <NotebookAnnotation text={hintText}/>
    </div>
   </motion.aside>}
  </AnimatePresence>}
  <div className="li-scrapebook-canvas">
   <motion.span className="li-scrapebook-washi" aria-hidden="true"
    initial={reduced?false:{opacity:0,y:-14,rotate:-21}}
    animate={{opacity:1,y:0,rotate:-11}}
    transition={{duration:reduced?0:.46,delay:reduced?0:.16,ease:[.22,1,.36,1]}}/>
   {!mini&&<motion.button type="button" className="li-scrapebook-bookmark"
    aria-pressed={bookmarked}
    aria-label={bookmarked?t('Tháo dấu trang mẫu','Detach preview bookmark'):
     t('Gắn dấu trang mẫu','Attach preview bookmark')}
    title={bookmarked?t('Tháo dấu trang','Detach bookmark'):t('Gắn dấu trang','Attach bookmark')}
    onClick={()=>setBookmarked(value=>!value)}
    initial={false}
    animate={{y:bookmarked?0:-18,rotate:bookmarked?-2:3}}
    whileTap={reduced?undefined:{scale:.94}}
    transition={reduced?{duration:0}:{type:'spring',stiffness:280,damping:20}}>
    <LiIcon name="bookmark" size={19}/>
    <span>{bookmarked?t('ĐÃ GẮN','ATTACHED'):t('GẮN','ATTACH')}</span>
   </motion.button>}
   <span className="li-scrapebook-paper-edge" aria-hidden="true"/>
   {children}
  </div>
 </div>;
}
