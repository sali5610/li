import React,{useEffect,useRef,useState} from 'react';
import type {CSSProperties,MouseEvent,ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {LaoLyStateScene} from './LegacyDataViz';

/** Portal is the foreground layer. The replaceable illustration is NOT mounted
 * until the transparent portal frame has decoded, preventing an unframed flash. */
export type PortalVariant=1|2|3|4|5|6|7;
type PortalEntry={left:number;top:number;width:number;height:number;
 shiftX:number;shiftY:number;zoom:number};
export interface PortalCategoryCardProps{
 title:string;detail:string;eyebrow?:string;
 portal:PortalVariant;illustrationSrc?:string;illustrationAlt?:string;
 portalSrc?:string;onOpen?:()=>void;href?:string;className?:string;
 placeholder?:ReactNode;openLabel?:string;
 locale?:'vi'|'en';loadingArtworkBase?:string;
 /** Set only after the same portal image has been preloaded and decoded. */
 portalPreloaded?:boolean;
 /** @deprecated No visible CTA; navigate through the portal illustration instead. */
 actionLabel?:string;
}
export interface PortalCategoryLoadingProps{
 kind?:'loading'|'error';locale?:'vi'|'en';artworkBase?:string;onRetry?:()=>void;
}
/** Reuse the canonical Elder Ly loading/error scene rather than another spinner. */
export function PortalCategoryLoading({kind='loading',locale='vi',
 artworkBase='./assets',onRetry}:PortalCategoryLoadingProps){
 const en=locale==='en';
 return <div className="li-portal-category-loading" data-portal-load={kind}>
  <LaoLyStateScene kind={kind}
   artworkSrc={artworkBase+'/laoly-state-'+kind+'.png'}
   title={kind==='loading'?(en?'Elder Ly is getting ready…':'Lão Lý đang chuẩn bị…'):
    (en?'The gateway could not load':'Cổng chưa tải được')}
   description={kind==='loading'?
    (en?'Getting the gateways ready before revealing the illustrations.':
     'Đang chuẩn bị cổng trước khi mở hình minh hoạ.'):
    (en?'Please try loading the gateways again.':'Thử tải lại cổng nhé.')}
   action={kind==='error'&&onRetry?<button type="button"
    className="li-portal-category-retry" onClick={onRetry}>
    {en?'Try again':'Thử lại'}
   </button>:undefined}/>
 </div>;
}
export function PortalCategoryCard({title,detail,eyebrow,portal,
 illustrationSrc,illustrationAlt='',portalSrc,onOpen,href,className='',
 placeholder,openLabel,locale='vi',loadingArtworkBase='./assets',
 portalPreloaded=false}:PortalCategoryCardProps){
 // Relative paths work on GitHub Pages /li/ and Cloudflare /.
 // Nested Studio stories pass ../assets/portals/ and ../assets/.
 const portalPath=portalSrc||'./assets/portals/cong-moi-'+String(portal).padStart(2,'0')+'.webp';
 const [decodedPath,setDecodedPath]=useState<string|null>(null);
 const [failedPath,setFailedPath]=useState<string|null>(null);
 const [retryIndex,setRetryIndex]=useState(0);
 const [entry,setEntry]=useState<PortalEntry|null>(null);
 const entering=useRef(false);
 const completed=useRef(false);
 const interactive=Boolean(href||onOpen);
 const ready=portalPreloaded||decodedPath===portalPath;
 const failed=!ready&&failedPath===portalPath;
 const assetUrl=retryIndex?
  portalPath+(portalPath.includes('?')?'&':'?')+'retry='+retryIndex:portalPath;
 // A changed portal variant must be decoded before its new interior can mount.
 useEffect(()=>{setRetryIndex(0);setFailedPath(null);},[portalPath]);
 function onProbeLoad(img:HTMLImageElement){
  const decode=typeof img.decode==='function'?img.decode():Promise.resolve();
  void decode.then(()=>{setFailedPath(null);setDecodedPath(portalPath);})
   .catch(()=>setFailedPath(portalPath));
 }
 function finishEntry(){
  if(!entering.current||completed.current)return;
  completed.current=true;
  if(href)window.location.assign(href);
  else onOpen?.();
  setEntry(null);
 }
 useEffect(()=>{
  if(!entry)return;
  const fallback=window.setTimeout(finishEntry,850);
  return ()=>window.clearTimeout(fallback);
 },[entry]);
 function beginEntry(event:MouseEvent<HTMLAnchorElement|HTMLButtonElement>){
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
   <img className="li-portal-category-overlay" src={assetUrl} alt=""
    aria-hidden="true" loading="eager" decoding="async"/>
  </>;
 }
 const art=!ready?
  <div className="li-portal-category-art li-portal-category-wait" aria-busy={!failed}>
   <PortalCategoryLoading kind={failed?'error':'loading'} locale={locale}
    artworkBase={loadingArtworkBase}
    onRetry={failed?()=>{setFailedPath(null);setRetryIndex(n=>n+1);}:undefined}/>
   <img key={assetUrl} className="li-portal-category-probe" src={assetUrl}
    alt="" aria-hidden="true" loading="eager" decoding="async"
    onLoad={event=>onProbeLoad(event.currentTarget)}
    onError={()=>setFailedPath(portalPath)}/>
  </div>:
  href?<a className="li-portal-category-art li-portal-category-trigger" href={href}
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
