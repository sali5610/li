import React from 'react';
import {motion,AnimatePresence,useReducedMotion} from 'motion/react';
import {Button} from './Components';
import {Heading,Text} from './Atoms';
import {HomeMirrorShell} from './Templates';
import {ChatBubble} from './LegacyCards';
import {LiIcon} from './LucideIcons';
import {NotebookAnnotation} from './NotebookAnnotation';
import {NotebookInk} from './NotebookInk';
import {NotebookArt} from './NotebookArt';
import {BookwormIllustration} from './BookwormIllustration';
import {VintagePopArt} from './VintagePopArt';
import {VintagePopCollage} from './VintagePopCollage';
import {VintagePopStamp} from './VintagePopStamp';
import {ScrapebookCoverContext,ScrapebookHintContext} from './ScrapebookSheet';
import './home-layout-variants.css';

/** Presentation only. Both the Lab and a future approved app Home import
 * this exact component. No router, auth, persistence or global listeners.
 */
export type HomeLayoutVariant='heritage'|'editorial'|'immersive'|'notebook'|'bookworm'|'vintagePop';
export interface HomeLayoutProps {
 variant:HomeLayoutVariant;
 locale:'vi'|'en';
 backgroundSrc:string;
 mirrorArtSrc:string;
 avatarSrc:string;
 /** Optional 1024px illustration in place of the mini avatar. */
 guideIllustrationSrc?:string;
 question:string;
 scene:string;
 source:string;
 saved:boolean;
 onPrevious:()=>void;
 onNext:()=>void;
 onExplore:()=>void;
 onSave:()=>void;
 onCheckin:()=>void;
}
export const homeLayoutVariants:readonly {id:HomeLayoutVariant;vi:string;en:string}[]=[
 {id:'heritage',vi:'Heritage',en:'Heritage'},
 {id:'editorial',vi:'Editorial',en:'Editorial'},
 {id:'immersive',vi:'Immersive',en:'Immersive'},
 {id:'notebook',vi:'Notebook · Ghi chú tay',en:'Notebook · Handwritten'},
 {id:'bookworm',vi:'Bookworm · Sách tối giản',en:'Bookworm · Vintage Minimal'},
 {id:'vintagePop',vi:'Vintage Pop · Tem giấy',en:'Vintage Pop · Stamp'},
];
export function HomeLayout({variant,locale,backgroundSrc,mirrorArtSrc,avatarSrc,
 guideIllustrationSrc,question,scene,source,saved,onPrevious,onNext,onExplore,onSave,onCheckin}:HomeLayoutProps){
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const reduced=useReducedMotion();
 const cover=React.useContext(ScrapebookCoverContext);
 const hint=React.useContext(ScrapebookHintContext);
 const scrapebook=variant==='vintagePop'&&cover!==null;
 const entrance=(delay:number)=>(variant==='notebook'||variant==='bookworm')&&!reduced?{
  initial:{opacity:0,y:variant==='bookworm'?23:17},
  animate:{opacity:1,y:0},
  transition:{duration:variant==='bookworm'?.58:.48,delay,ease:'easeOut' as const}
 }:{};
 const mirrorShell=<HomeMirrorShell artwork={<motion.img src={mirrorArtSrc} alt=""
    whileHover={variant==='notebook'&&!reduced?{scale:1.035}:undefined}
    transition={{duration:.55,ease:'easeOut'}}/>}
    artworkLabel={t('Minh họa câu hỏi trong gương','Question artwork in the mirror')}
    title={t('GƯƠNG VẠN VẤN','MIRROR OF QUESTIONS')}
    question={question}
    actions={<div className="li-ui-home-mirror-actions">
     <Button variant="ghost" onClick={onPrevious} aria-label={t('Câu trước','Previous question')}>
      <LiIcon name="chevron-left" size={18}/>
     </Button>
     <Button variant="ghost" onClick={onNext} aria-label={t('Câu sau','Next question')}>
      <LiIcon name="chevron-right" size={18}/>
     </Button>
    </div>}/>;
 return <section className="li-ui-home" data-home-layout={variant} lang={locale}
  aria-label={t('Khám phá layout Đại Sảnh','Home layout composition')}>
  {variant==='bookworm'&&<div className="li-ui-home-bookworm-masthead" aria-hidden="true">
   <span>li. · The Book of Questions</span><span>ILLUSTRATED FOLIO / VOL. 01</span>
  </div>}
  {variant==='notebook'&&<div className="li-ui-home-notebook-masthead" aria-hidden="true">
   <span>li. <em>field notes</em></span>
   <span>THE WONDER JOURNAL / VOL. 01</span>
  </div>}
  <img className="li-ui-home-backdrop" src={backgroundSrc} alt="" aria-hidden="true"/>
  <div className="li-ui-home-tint" aria-hidden="true"/>
  <motion.div className="li-ui-home-intro" {...entrance(.05)}>
   <span className="li-ui-home-kicker">li. · {t('ĐẠI SẢNH','THE HALL')}</span>
   <Heading level={1} role="display">{variant==='notebook'
    ?locale==='vi'?<><NotebookInk kind="highlight" tone="olive">Mọi câu hỏi</NotebookInk><br/>đều có rễ.</>
      :<><NotebookInk kind="highlight" tone="olive">Every question</NotebookInk><br/>has roots.</>
    :locale==='vi'?<>Mọi câu hỏi<br/>đều có rễ.</>:<>Every question<br/>has roots.</>}</Heading>
   <Text role="body">{t('Không cần biết tất cả. Chỉ cần không ngừng tò mò.',
    'You needn’t know everything. Just stay curious.')}</Text>
   {variant==='vintagePop'&&<VintagePopStamp active={saved}/>}
   {variant==='vintagePop'&&!scrapebook&&<motion.div className="li-pop-home-art" aria-hidden="true"
    initial={reduced?false:{opacity:0,scale:.82,rotate:-14}}
    animate={{opacity:1,scale:1,rotate:0}}
    transition={{duration:reduced?0:.55,delay:reduced?0:.12}}>
    <VintagePopCollage kind="laoly" size="spot"/>
   </motion.div>}
   {scrapebook&&cover}
  </motion.div>
  {variant==='notebook'&&<div className="li-ui-home-notebook-annotation">
   <NotebookAnnotation text={t('Viết xuống câu hỏi, rồi để trí tò mò dẫn đường.',
    'Jot down the question; let curiosity lead the way.')} tone="blue"/>
   <NotebookArt kind="book" size="spot"/>
  </div>}
  {variant==='bookworm'&&<motion.div className="li-ui-home-bookworm-art" aria-hidden="true"
    initial={reduced?false:{opacity:0,y:18,rotate:-2}}
    animate={{opacity:1,y:0,rotate:0}}
    transition={{duration:reduced?0:.72,delay:reduced?0:.14,ease:[.22,1,.36,1]}}
    whileHover={reduced?undefined:{y:-6,rotate:1.5}}>
   <BookwormIllustration kind="stack"/>
  </motion.div>}
  <motion.div className="li-ui-home-mirror" {...entrance(.16)}>
   {variant==='bookworm'?
    <AnimatePresence mode="wait" initial={false}>
     <motion.div key={question} className="li-bookworm-question-page"
      initial={reduced?false:{opacity:0,x:22,rotateY:-4}}
      animate={{opacity:1,x:0,rotateY:0}}
      exit={reduced?undefined:{opacity:0,x:-16,rotateY:3}}
      transition={{duration:reduced?0:.32,ease:[.22,1,.36,1]}}>
      {mirrorShell}
     </motion.div>
    </AnimatePresence>:mirrorShell}
  </motion.div>
  <motion.aside className="li-ui-home-guide" {...entrance(.27)} aria-label={t('Lão Lý kể chuyện','Elder Ly explains')}>
   {guideIllustrationSrc?<figure className="li-ui-home-guide-illustration" aria-hidden="true">
    <img src={guideIllustrationSrc} alt="" loading="lazy" decoding="async" width={184} height={184}/>
   </figure>:<img src={avatarSrc} alt="" loading="lazy" width={84} height={84}/>}
   <div className="li-ui-home-guide-copy">
    <span className="li-ui-home-guide-source">{source}</span>
    <ChatBubble text={scene} surface="forest"/>
   </div>
  </motion.aside>
  <motion.div className="li-ui-home-actions" {...entrance(.32)}>
   <Button variant="secondary" onClick={onCheckin}>
    <LiIcon name="check" size={18}/> {t('Check-in','Check in')}
   </Button>
   <Button onClick={onExplore}>
    <LiIcon name="arrow-right" size={18}/> {t('Đào sâu','Explore')}
   </Button>
   {!scrapebook&&<Button variant="secondary" onClick={onSave} aria-pressed={saved}>
    <LiIcon name="bookmark" size={18}/> {saved?t('Đã lưu','Saved'):t('Lưu câu hỏi','Save')}
   </Button>}
  </motion.div>
  {scrapebook&&hint}
 </section>;
}
