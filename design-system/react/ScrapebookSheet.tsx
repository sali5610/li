import React,{createContext,useId,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {LiIcon} from './LucideIcons';
import {NotebookAnnotation} from './NotebookAnnotation';

/** One cover-owned preview bookmark; null outside Scrapebook. */
export const ScrapebookBookmarkContext=createContext<boolean|null>(null);
/** Existing page header hosts the cover decorations, rather than a separate floating row. */
export const ScrapebookCoverContext=createContext<React.ReactNode>(null);
export const ScrapebookHintContext=createContext<React.ReactNode>(null);

/**
 * UI Lab-only paper composition over the existing Vintage Pop page.
 * Bookmark and note are preview states; no saved learner data.
 * The note reuses exactly the source text from Notebook marginalia.
 */
export function ScrapebookSheet({locale,mini,hintText,coverInPage=false,homeBookmark,children}:{
 locale:'vi'|'en';mini:boolean;hintText?:string;coverInPage?:boolean;
 homeBookmark?:{saved:boolean;onToggle:()=>void};children:React.ReactNode;
}){
 const reduced=useReducedMotion();
 const [localBookmark,setBookmarked]=useState(false);
 const bookmarked=homeBookmark?.saved??localBookmark;
 const [noteOpen,setNoteOpen]=useState(false);
 const noteId=useId();
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const coverDecorations=<>
   <motion.span className="li-scrapebook-washi" aria-hidden="true"
    initial={reduced?false:{opacity:0,y:-14,rotate:-21}}
    animate={{opacity:1,y:0,rotate:-11}}
    transition={{duration:reduced?0:.46,delay:reduced?0:.16,ease:[.22,1,.36,1]}}/>
   {!mini&&<motion.button type="button" className="li-scrapebook-bookmark"
    aria-pressed={bookmarked}
    aria-label={homeBookmark?(bookmarked?t('Bỏ lưu câu hỏi','Unsave question'):t('Lưu câu hỏi','Save question')):
     bookmarked?t('Tháo dấu trang mẫu','Detach preview bookmark'):t('Gắn dấu trang mẫu','Attach preview bookmark')}
    title={bookmarked?t('Tháo dấu trang','Detach bookmark'):t('Gắn dấu trang','Attach bookmark')}
    onClick={homeBookmark?.onToggle??(()=>setBookmarked(value=>!value))}
    initial={false}
    animate={{y:bookmarked?0:coverInPage?-8:-18}}
    transition={reduced?{duration:0}:{type:'spring',stiffness:280,damping:20}}>
    <LiIcon name="bookmark" size={19}/>
    <span>{bookmarked?t('ĐÃ GẮN','ATTACHED'):t('GẮN','ATTACH')}</span>
   </motion.button>}
 </>;
 const hint=(!mini&&hintText!==undefined)?<div className="li-scrapebook-inline-hint">
   <button type="button" className="li-scrapebook-note-toggle"
    aria-controls={noteId} aria-expanded={noteOpen}
    onClick={()=>setNoteOpen(value=>!value)}>
    <LiIcon name={noteOpen?'feather':'book-open'} size={18}/>
    {noteOpen?t('Ẩn ghi chú','Hide note'):t('Hiện gợi ý','Show hint')}
   </button>
   <div id={noteId}>
    <AnimatePresence initial={false}>
     {noteOpen&&<motion.aside key="hint" className="li-scrapebook-hint" role="note"
      aria-label={t('Ghi chú gợi ý bên lề','Marginal hint note')}
      initial={reduced?false:{opacity:0,height:0,y:-8}}
      animate={{opacity:1,height:'auto',y:0}}
      exit={reduced?{opacity:0,height:0}:{opacity:0,height:0,y:-8}}
      transition={{duration:reduced?0:.32,ease:[.22,1,.36,1]}}>
      <div className="li-scrapebook-hint-inner"><NotebookAnnotation text={hintText}/></div>
     </motion.aside>}
    </AnimatePresence>
   </div>
  </div>:null;
 return <div className="li-scrapebook-sheet" data-mini={mini?'true':'false'}>
  <div className="li-scrapebook-canvas">
   {!coverInPage&&coverDecorations}
   <span className="li-scrapebook-paper-edge" aria-hidden="true"/>
   <ScrapebookBookmarkContext.Provider value={bookmarked}>
    <ScrapebookCoverContext.Provider value={coverInPage?coverDecorations:null}>
     <ScrapebookHintContext.Provider value={hint}>{children}</ScrapebookHintContext.Provider>
    </ScrapebookCoverContext.Provider>
   </ScrapebookBookmarkContext.Provider>
  </div>
 </div>;
}
