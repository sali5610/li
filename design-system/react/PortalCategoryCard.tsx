import React from 'react';
import type {ReactNode} from 'react';
import {LiIcon} from './LucideIcons';

/** Portal artwork stays independent of the future discipline illustration.
 * Portal images are transparent PNG overlays; the illustration is rendered behind.
 * The seven masters are supplied separately as /assets/portals/cong-moi-01..07.png.
 */
export type PortalVariant=1|2|3|4|5|6|7;
export interface PortalCategoryCardProps{
 title:string;detail:string;eyebrow?:string;actionLabel:string;
 portal:PortalVariant;illustrationSrc?:string;illustrationAlt?:string;
 portalSrc?:string;onOpen?:()=>void;href?:string;className?:string;
 placeholder?:ReactNode;
}
export function PortalCategoryCard({title,detail,eyebrow,actionLabel,portal,
 illustrationSrc,illustrationAlt='',portalSrc,onOpen,href,className='',
 placeholder}:PortalCategoryCardProps){
 const portalPath=portalSrc||'/assets/portals/cong-moi-'+String(portal).padStart(2,'0')+'.png';
 const action=<>{actionLabel}<LiIcon name="arrow-right" size={18}/></>;
 return <article className={'li-portal-category-card '+className} data-li-component="portal-category-card"
  data-portal-variant={portal}>
  <div className="li-portal-category-art" aria-label={illustrationAlt||undefined}>
   <div className="li-portal-category-interior">
    {illustrationSrc?<img src={illustrationSrc} alt={illustrationAlt} loading="lazy" decoding="async"/>:
     <span className="li-portal-category-placeholder" aria-hidden="true">{placeholder||null}</span>}
   </div>
   <img className="li-portal-category-overlay" src={portalPath} alt="" aria-hidden="true"
    loading="lazy" decoding="async" onError={event=>{event.currentTarget.hidden=true;}}/>
  </div>
  <div className="li-portal-category-copy">
   {eyebrow?<span className="li-portal-category-eyebrow">{eyebrow}</span>:null}
   <h2>{title}</h2><p>{detail}</p>
   {href?<a className="li-portal-category-action" href={href}>{action}</a>:
    <button className="li-portal-category-action" type="button" onClick={onOpen}
     disabled={!onOpen}>{action}</button>}
  </div>
 </article>;
}
