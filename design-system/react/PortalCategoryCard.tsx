import React from 'react';
import type {ReactNode} from 'react';

/** The supplied transparent portal is a foreground overlay, while the future
 * discipline illustration remains an independent, replaceable layer below it.
 */
export type PortalVariant=1|2|3|4|5|6|7;
export interface PortalCategoryCardProps{
 title:string;detail:string;eyebrow?:string;
 portal:PortalVariant;illustrationSrc?:string;illustrationAlt?:string;
 portalSrc?:string;onOpen?:()=>void;href?:string;className?:string;
 placeholder?:ReactNode;openLabel?:string;
 /** @deprecated No visible CTA; navigate through the portal illustration instead. */
 actionLabel?:string;
}
export function PortalCategoryCard({title,detail,eyebrow,portal,
 illustrationSrc,illustrationAlt='',portalSrc,onOpen,href,className='',
 placeholder,openLabel}:PortalCategoryCardProps){
 // Relative to the app document, so GitHub Pages /li/ and Cloudflare / both work.
 // Nested Studio stories pass their own ../assets/portals/ source.
 const portalPath=portalSrc||'./assets/portals/cong-moi-'+String(portal).padStart(2,'0')+'.webp';
 const interactive=Boolean(href||onOpen);
 const visual=<>
  <div className="li-portal-category-interior">
   {illustrationSrc?<img src={illustrationSrc} alt={interactive?'':illustrationAlt}
     loading="lazy" decoding="async"/>:
    <span className="li-portal-category-placeholder" aria-hidden="true">{placeholder||null}</span>}
  </div>
  <span className="li-portal-category-fallback-arch" aria-hidden="true"/>
  <img className="li-portal-category-overlay" src={portalPath} alt=""
   aria-hidden="true" loading="lazy" decoding="async"
   onLoad={event=>{
    event.currentTarget.hidden=false;
    event.currentTarget.parentElement?.setAttribute('data-overlay-loaded','true');
   }}
   onError={event=>{event.currentTarget.hidden=true;}}/>
 </>;
 const art=href?
  <a className="li-portal-category-art li-portal-category-trigger" href={href}
   aria-label={openLabel||title}>{visual}</a>:
  onOpen?<button className="li-portal-category-art li-portal-category-trigger"
   type="button" onClick={onOpen} aria-label={openLabel||title}>{visual}</button>:
  <div className="li-portal-category-art">{visual}</div>;
 return <article className={'li-portal-category-card '+className}
  data-li-component="portal-category-card" data-portal-variant={portal}>
  {art}
  <div className="li-portal-category-copy">
   {eyebrow?<span className="li-portal-category-eyebrow">{eyebrow}</span>:null}
   <h2>{title}</h2><p>{detail}</p>
  </div>
 </article>;
}
