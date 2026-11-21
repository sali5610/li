import React,{useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {LiIcon} from './LucideIcons';
import {VintagePopArt} from './VintagePopArt';

/** Source: PO-uploaded graphics already shipped under site/assets/.
 * Decorative scrapbook clippings; never substitute them for lesson content. */
export type VintagePopAsset=
 'sociology'|'hci'|'supply'|'data'|'psychology'|'history'|'ai'|'backend'|
 'anthropology'|'economics'|'laoly'|'home';
const assetPath:Record<VintagePopAsset,string>={
 sociology:'discipline/sociology.webp',
 hci:'discipline/human-computer-interaction.webp',
 supply:'discipline/supply-chain-management.webp',
 data:'discipline/data-science.webp',
 psychology:'discipline/cognitive-psychology.webp',
 history:'discipline/world-history.webp',
 ai:'discipline/artificial-intelligence.webp',
 backend:'discipline/backend-development.webp',
 anthropology:'discipline/anthropology.webp',
 economics:'discipline/economics.webp',
 laoly:'laoly-guide-rest.png',
 home:'home-li-landscape-20261121.webp'
};
export function VintagePopCollage({kind,size='spot'}:{
 kind:VintagePopAsset;size?:'spot'|'hero'|'card'|'tiny'
}){
 const reduced=useReducedMotion();
 const [broken,setBroken]=useState(false);
 return <motion.div className={'li-pop-collage li-pop-collage--'+size}
  aria-hidden="true" initial={reduced?false:{opacity:0,y:12,rotate:-4}}
  animate={{opacity:1,y:0,rotate:-2}}
  transition={{duration:reduced?0:.48,ease:[.22,1,.36,1]}}
  whileHover={reduced?undefined:{rotate:0,y:-4}}>
  <span className="li-pop-collage-tape"/>
  {broken?<VintagePopArt kind={kind==='hci'?'hci':kind==='supply'?'supply':kind==='data'?'sampling':'book'} size="spot"/>:
   <img src={'../assets/'+assetPath[kind]} alt="" loading="lazy" decoding="async"
    onError={()=>setBroken(true)}/>}
  <span className="li-pop-collage-postmark"><LiIcon name="sparkle" size={16}/></span>
 </motion.div>;
}
