import React,{useEffect,useRef,useState} from 'react';
import type {CSSProperties,MouseEvent,ReactNode} from 'react';
import {createPortal} from 'react-dom';

/** The transparent portal remains above its replaceable discipline illustration.
 * Opening animates the same portal toward the viewer before navigating.
 */
export type PortalVariant=1|2|3|4|5|6|7;
type PortalEntry={left:number;top:number;width:number;height:number;
 shiftX:number;shiftY:number;zoom:number};
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
 // Relative paths work at /li/ on GitHub Pages and at / on Cloudflare.
 // Nested Studio stories supply their own ../assets/portals/ URL.
 const portalPath=portalSrc||'./assets/portals/cong-moi-'+String(portal).padStart(2,'0')+'.webp';
 const [entry,setEntry]=useState<PortalEntry|null>(null);
 const entering=useRef(false);
 const completed=useRef(false);
 const interactive=Boolean(href||onOpen);

 function finishEntry(){
  if(!entering.current||completed.current)return;
  completed.current=true;
  if(href)window.location.assign(href);
  else onOpen?.();
  setEntry(null);
 }
 // If CSS animations are interrupted (e.g. tab switches), never trap navigation.
 useEffect(()=>{
  if(!entry)return;
  const fallback=window.setTimeout(finishEntry,850);
  return ()=>window.clearTimeout(fallback);
 },[entry]);

 function beginEntry(event:MouseEvent<HTMLAnchorElement|HTMLButtonElement>){
  // Preserve native open-in-new-tab, context menu, and modified link clicks.
  if(href&&(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey))return;
  event.preventDefault();
  if(entering.current)return;
  entering.current=true;
  if(typeof window.matchMedia!=='function'||
   window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   finishEntry();return;
  }
  const rect=event.currentTarget.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0){finishEntry();return;}
  const viewportWidth=window.innerWidth,viewportHeight=window.innerHeight;
  // Zoom until the INNER opening fills the viewport; the frame moves past its edges.
  const zoom=Math.max(1.1,
   viewportWidth*1.13/(rect.width*.68),
   viewportHeight*1.13/(rect.height*.74));
  setEntry({left:rect.left,top:rect.top,width:rect.width,height:rect.height,
   shiftX:viewportWidth/2-(rect.left+rect.width/2),
   shiftY:viewportHeight/2-(rect.top+rect.height/2),zoom});
 }
 function visual(transition=false){
  return <>
   <div className="li-portal-category-interior">
    {illustrationSrc?<img src={illustrationSrc} alt={interactive||transition?'':illustrationAlt}
     loading={transition?'eager':'lazy'} decoding="async"/>:
     <span className="li-portal-category-placeholder" aria-hidden="true">
      {transition?null:placeholder||null}
     </span>}
   </div>
   <span className="li-portal-category-fallback-arch" aria-hidden="true"/>
   <img className="li-portal-category-overlay" src={portalPath} alt=""
    aria-hidden="true" loading={transition?'eager':'lazy'} decoding="async"
    onLoad={event=>{
     event.currentTarget.hidden=false;
     event.currentTarget.parentElement?.setAttribute('data-overlay-loaded','true');
    }}
    onError={event=>{event.currentTarget.hidden=true;}}/>
  </>;
 }
 const art=href?
  <a className="li-portal-category-art li-portal-category-trigger" href={href}
   onClick={beginEntry} aria-label={openLabel||title}>{visual()}</a>:
  onOpen?<button className="li-portal-category-art li-portal-category-trigger"
   type="button" onClick={beginEntry} aria-label={openLabel||title}>{visual()}</button>:
  <div className="li-portal-category-art">{visual()}</div>;

 const entryStyle=entry?({
  left:entry.left,top:entry.top,width:entry.width,height:entry.height,
  '--li-portal-travel-x':entry.shiftX+'px',
  '--li-portal-travel-y':entry.shiftY+'px',
  '--li-portal-travel-scale':String(entry.zoom)
 } as CSSProperties):undefined;
 return <article className={'li-portal-category-card '+className}
  data-li-component="portal-category-card" data-portal-variant={portal}>
  {art}
  <div className="li-portal-category-copy">
   {eyebrow?<span className="li-portal-category-eyebrow">{eyebrow}</span>:null}
   <h2>{title}</h2><p>{detail}</p>
  </div>
  {entry&&typeof document!=='undefined'?createPortal(
   <div className="li-portal-enter-layer" aria-hidden="true"
    data-li-portal-motion="entering">
    <div className="li-portal-category-art li-portal-enter-frame"
     style={entryStyle}
     onAnimationEnd={event=>{
      if(event.target===event.currentTarget&&
       event.animationName==='li-portal-enter-zoom')finishEntry();
     }}>{visual(true)}</div>
   </div>,document.body):null}
 </article>;
}
