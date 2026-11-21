import React from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {BookwormIllustration} from './BookwormIllustration';
import './notebook-illustrations.css';
import './notebook-existing-assets.css';

/** Reusable, decor-only illustration slot for approved React compositions.
 * Reuses the existing li. discipline / Elder Ly assets; never mutates content.
 */
export type NotebookArtKind=
 'book'|'shelf'|'discipline'|'sampling'|'method'|'recall'|'calendar'|
 'question'|'notes'|'progress'|'companion'|'checkin';
export type NotebookArtSize='hero'|'card'|'spot';
/** Real files already uploaded to li./site/assets; do not substitute generated artwork. */
export const notebookDisciplineImages={
 society:'../assets/discipline/sociology.webp',
 hci:'../assets/discipline/human-computer-interaction.webp',
 supply:'../assets/discipline/supply-chain-management.webp',
 cognitivePsychology:'../assets/discipline/cognitive-psychology.webp',
 behavioralPsychology:'../assets/discipline/behavioral-psychology.webp',
 anthropology:'../assets/discipline/anthropology.webp',
 artificialIntelligence:'../assets/discipline/artificial-intelligence.webp',
 dataScience:'../assets/discipline/data-science.webp',
 economics:'../assets/discipline/economics.webp',
 worldHistory:'../assets/discipline/world-history.webp',
 chineseLanguage:'../assets/discipline/chinese-language.webp',
 englishLanguage:'../assets/discipline/english-language.webp',
 backendDevelopment:'../assets/discipline/backend-development.webp',
 musicTheory:'../assets/discipline/music-theory.webp',
 neurodiversityStudies:'../assets/discipline/neurodiversity-studies.webp'
} as const;
export function NotebookArt({kind,size='spot',src,className=''}:{
 kind:NotebookArtKind;size?:NotebookArtSize;src?:string;className?:string
}){
 const reduced=useReducedMotion();
 const image=src||(kind==='companion'?'../assets/laoly-guide-rest.png':undefined);
 const drawing=():React.ReactNode=>{
  if(image)return <img src={image} alt="" loading="lazy" decoding="async"/>;
  if(kind==='book'||kind==='shelf'||kind==='method')
   return <BookwormIllustration kind={kind==='shelf'?'shelf':kind==='method'?'stack':'open'}/>;
  if(kind==='sampling')return <svg viewBox="0 0 360 260" fill="none" aria-hidden="true">
   <rect x="25" y="24" width="220" height="208" rx="75" stroke="currentColor" strokeWidth="2" strokeDasharray="6 5"/>
   {Array.from({length:30},(_,i)=>{
    const x=53+(i%6)*33,y=62+Math.floor(i/6)*33;
    return <circle key={i} cx={x} cy={y} r="10"
     fill={i%7===0?'var(--nb-wine, #8d2537)':'var(--nb-olive, #cbd4ac)'}
     stroke="currentColor" strokeWidth="1.4"/>;
   })}
   <path d="M246 128H290M279 117L292 128L279 139" stroke="var(--nb-wine, #8d2537)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
   <g stroke="currentColor" strokeWidth="1.5">
    <circle cx="320" cy="103" r="15" fill="var(--nb-wine, #8d2537)"/>
    <circle cx="320" cy="149" r="15" fill="var(--nb-olive, #cbd4ac)"/>
    <circle cx="320" cy="195" r="15" fill="var(--nb-olive, #cbd4ac)"/>
   </g>
  </svg>;
  if(kind==='notes')return <svg viewBox="0 0 360 260" fill="none" aria-hidden="true">
   <path d="M90 22L274 33L263 239L73 228Z" fill="#F8F5EB" stroke="currentColor" strokeWidth="2"/>
   <path d="M76 43L59 43L59 216L73 226" stroke="var(--nb-wine, #8d2537)" strokeWidth="3"/>
   <path d="M110 82L242 88M105 112L238 118M104 142L239 148M104 172L213 176M103 201L172 204" stroke="#C9BDB4" strokeWidth="2"/>
   <path d="M122 69C157 55 186 70 220 56M123 100C158 88 188 102 218 92" stroke="var(--nb-blue, #536F8F)" strokeWidth="3" strokeLinecap="round"/>
   <path d="M260 178L300 63L315 70L276 189L252 203Z" fill="#E9D8BA" stroke="var(--nb-wine, #8d2537)" strokeWidth="2"/>
   <path d="M260 178L276 189L252 203Z" fill="var(--nb-wine, #8d2537)"/>
   <path d="M300 63L305 46L319 52L315 70" fill="#F3EFE5" stroke="var(--nb-wine, #8d2537)" strokeWidth="2"/>
  </svg>;
  if(kind==='question')return <svg viewBox="0 0 360 260" fill="none" aria-hidden="true">
   <circle cx="154" cy="113" r="70" fill="#EEF0DF" stroke="currentColor" strokeWidth="3"/>
   <circle cx="154" cy="113" r="53" stroke="var(--nb-wine, #8d2537)" strokeDasharray="5 7" strokeWidth="1.5"/>
   <path d="M199 165L280 230" stroke="var(--nb-wine, #8d2537)" strokeWidth="19" strokeLinecap="round"/>
   <path d="M122 103C125 80 144 73 163 80C180 90 172 107 156 117L150 129M150 145V149" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
   <path d="M65 28L72 49M39 55L60 65M242 37L225 56" stroke="var(--nb-blue, #536F8F)" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
  if(kind==='progress'||kind==='calendar')return <svg viewBox="0 0 360 260" fill="none" aria-hidden="true">
   <path d="M75 37H281V226H75Z" fill="#FAF7EE" stroke="currentColor" strokeWidth="2"/>
   <rect x="75" y="37" width="206" height="38" fill="var(--nb-wine, #8d2537)" />
   {Array.from({length:28},(_,i)=>{
    const x=96+(i%7)*26,y=100+Math.floor(i/7)*30;
    return <rect key={i} x={x} y={y} width="17" height="19" rx="1"
     stroke="#B8B0A1" fill={i%5===0?'var(--nb-olive, #cbd4ac)':'none'} strokeWidth="1.2"/>;
   })}
   <path d="M224 162L233 172L257 145" stroke="var(--nb-wine, #8d2537)" strokeWidth="4" strokeLinecap="round"/>
  </svg>;
  if(kind==='checkin')return <svg viewBox="0 0 360 260" fill="none" aria-hidden="true">
   <path d="M109 55C144 21 203 21 241 54C285 91 268 153 182 220C91 157 71 91 109 55Z"
    fill="#E8EFD8" stroke="var(--nb-wine, #8d2537)" strokeWidth="2.5"/>
   <path d="M135 113C150 94 168 94 182 110M181 110C198 94 219 100 233 116" stroke="var(--nb-wine, #8d2537)" strokeWidth="3" strokeLinecap="round"/>
   <path d="M123 153Q183 183 244 151" stroke="var(--nb-blue, #536F8F)" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
  // Recall is an illustrated speech cloud, kept text-free so content stays canonical.
  return <svg viewBox="0 0 360 260" fill="none" aria-hidden="true">
   <path d="M69 68C90 24 158 27 203 43C259 28 313 65 298 119C314 167 272 206 223 193
    C179 218 121 193 114 164C65 162 38 119 69 68Z" fill="#ECF0DE" stroke="currentColor" strokeWidth="2.5"/>
   <path d="M121 108Q180 69 237 110M116 139Q179 174 242 132" stroke="var(--nb-wine, #8d2537)" strokeWidth="3" strokeLinecap="round"/>
   <circle cx="95" cy="215" r="13" stroke="currentColor" strokeWidth="2"/>
   <circle cx="62" cy="233" r="7" fill="var(--nb-blue, #536F8F)"/>
  </svg>;
 };
 return <motion.figure
  className={'li-notebook-art li-notebook-art--'+kind+' li-notebook-art--'+size+' '+className}
  data-art-kind={kind} aria-hidden="true"
  initial={reduced?false:{opacity:0,y:15,rotate:-1.6}}
  whileInView={reduced?undefined:{opacity:1,y:0,rotate:0}}
  animate={reduced?{opacity:1}:undefined}
  viewport={{once:true,amount:.1}}
  whileHover={!reduced?{y:-4,rotate:.75}:undefined}
  transition={{duration:reduced?0:.45,ease:'easeOut'}}>
  <div className="li-notebook-art-paper">{drawing()}</div>
 </motion.figure>;
}
