import React from 'react';
import {Button} from './Components';
import {Heading,Text} from './Atoms';
import {HomeMirrorShell} from './Templates';
import {ChatBubble} from './LegacyCards';
import {LiIcon} from './LucideIcons';
import './home-layout-variants.css';

/** Presentation only. Both the Lab and a future approved app Home import
 * this exact component. No router, auth, persistence or global listeners.
 */
export type HomeLayoutVariant='heritage'|'editorial'|'immersive';
export interface HomeLayoutProps {
 variant:HomeLayoutVariant;
 locale:'vi'|'en';
 backgroundSrc:string;
 mirrorArtSrc:string;
 avatarSrc:string;
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
];
export function HomeLayout({variant,locale,backgroundSrc,mirrorArtSrc,avatarSrc,
 question,scene,source,saved,onPrevious,onNext,onExplore,onSave,onCheckin}:HomeLayoutProps){
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 return <section className="li-ui-home" data-home-layout={variant} lang={locale}
  aria-label={t('Khám phá layout Đại Sảnh','Home layout composition')}>
  <img className="li-ui-home-backdrop" src={backgroundSrc} alt="" aria-hidden="true"/>
  <div className="li-ui-home-tint" aria-hidden="true"/>
  <div className="li-ui-home-intro">
   <span className="li-ui-home-kicker">li. · {t('ĐẠI SẢNH','THE HALL')}</span>
   <Heading level={1} role="display">{locale==='vi'?<>Mọi câu hỏi<br/>đều có rễ.</>:<>Every question<br/>has roots.</>}</Heading>
   <Text role="body">{t('Không cần biết tất cả. Chỉ cần không ngừng tò mò.',
    'You needn’t know everything. Just stay curious.')}</Text>
  </div>
  <div className="li-ui-home-mirror">
   <HomeMirrorShell artwork={<img src={mirrorArtSrc} alt=""/>}
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
  </div>
  <aside className="li-ui-home-guide" aria-label={t('Lão Lý kể chuyện','Lao Ly explains')}>
   <img src={avatarSrc} alt="" loading="lazy" width={84} height={84}/>
   <div className="li-ui-home-guide-copy">
    <span className="li-ui-home-guide-source">{source}</span>
    <ChatBubble text={scene} surface="forest"/>
   </div>
  </aside>
  <div className="li-ui-home-actions">
   <Button variant="secondary" onClick={onCheckin}>
    <LiIcon name="check-circle" size={18}/> {t('Check-in','Check in')}
   </Button>
   <Button onClick={onExplore}>
    <LiIcon name="arrow-up-right" size={18}/> {t('Đào sâu','Explore')}
   </Button>
   <Button variant="secondary" onClick={onSave} aria-pressed={saved}>
    <LiIcon name="bookmark" size={18}/> {saved?t('Đã lưu','Saved'):t('Lưu câu hỏi','Save')}
   </Button>
  </div>
 </section>;
}
