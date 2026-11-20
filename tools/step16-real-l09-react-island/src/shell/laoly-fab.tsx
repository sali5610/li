import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';

/** The existing draggable Lão Lý avatar, now owned by the ONE React app.
 *
 * Preserve UX-HOME-02 behavior and its established storage key:
 * - exact approved papercraft icon + study-mode switching
 * - tap opens the real source-backed Lão Lý dialog; dragging never opens it
 * - pointer capture, 7px slop, mobile safe area, priority-action avoidance
 * - normalized position across rotations/routes, arrow keys, Shift+arrow, ESC
 * - no auth bypass; no second local storage writer or user tracking.
 *
 * The original static button/native drag code remains as a fallback ONLY if
 * the integrated React bundle cannot mount. createRoot(host) replaces that
 * original button, so no native listeners own the live React button.
 */
type Normalized={x:number;y:number};
type Coordinates={x:number;y:number};
type Gesture={id:number;startX:number;startY:number;x:number;y:number;moved:boolean};
type Bounds={minX:number;minY:number;maxX:number;maxY:number};
type DragPort={place:()=>void;reset:()=>void;getAvatar:()=>string};
type AppWindow=Window&{
 liCompanionDrag?:DragPort;
 openLaoLy?:(trigger?:HTMLElement|null)=>void;
 liLanguage?:{get?:()=>string};
};
const app=window as AppWindow;
const STORAGE_KEY='li.companion.position.v1';
const PAD=8;
const MODE_ICONS:Record<string,string>={
 start:'./assets/laoly-mode-start.png?v=ux-art07-clean-five-20261119',
 focus:'./assets/laoly-mode-focus.png?v=ux-art07-clean-five-20261119',
 overload:'./assets/laoly-mode-overload.png?v=ux-art07-clean-five-20261119',
 recover:'./assets/laoly-mode-recover.png?v=ux-art07-clean-five-20261119'
};
const MODE_NAMES:Record<string,[string,string]>={
 start:['Vào nhịp','Start'],
 focus:['Đào sâu','Focus'],
 overload:['Quá tải','Overload'],
 recover:['Hồi trí','Recover']
};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
function readSavedPosition():Normalized|null{
 try{
  const p=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null') as Partial<Normalized>|null;
  if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){
   return {x:clamp(p.x!,0,1),y:clamp(p.y!,0,1)};
  }
 }catch{/* Storage is optional; draggable stays functional in private mode. */}
 return null;
}
const findPage=()=>document.querySelector<HTMLElement>('section.page.active');
function FloatingLaoLy({host,initialAvatar,initialTitle}:{
 host:HTMLElement;initialAvatar:string;initialTitle:string
}){
 const [authorized,setAuthorized]=useState(
  document.documentElement.classList.contains('li-auth-verified')
 );
 const [mode,setMode]=useState(document.body.dataset.studyMode||'start');
 const [avatar,setAvatar]=useState(initialAvatar);
 const avatarSource=useRef(initialAvatar);
 avatarSource.current=avatar||MODE_ICONS[mode]||initialAvatar;
 const [locale,setLocale]=useState(0);
 const fab=useRef<HTMLButtonElement|null>(null);
 const saved=useRef<Normalized|null>(readSavedPosition());
 const current=useRef<Coordinates>({x:0,y:0});
 const gesture=useRef<Gesture|null>(null);
 const suppressAfterDrag=useRef(false);

 const bounds=useCallback(():Bounds=>{
  const width=window.innerWidth||document.documentElement.clientWidth||390;
  const height=window.innerHeight||document.documentElement.clientHeight||700;
  const rect=fab.current?.getBoundingClientRect();
  const fw=Math.max(rect?.width||0,48),fh=Math.max(rect?.height||0,48);
  let visibleBottom=height;
  const nav=document.querySelector<HTMLElement>('.mobile-nav');
  if(nav&&getComputedStyle(nav).position==='fixed'){
   const navTop=nav.getBoundingClientRect().top;
   if(Number.isFinite(navTop)&&navTop>0)visibleBottom=Math.min(height,navTop);
  }
  return {minX:PAD,minY:PAD,maxX:Math.max(PAD,width-fw-PAD),
   maxY:Math.max(PAD,visibleBottom-fh-PAD)};
 },[]);
 const setPosition=useCallback((x:number,y:number)=>{
  const b=bounds();
  current.current={x:clamp(x,b.minX,b.maxX),y:clamp(y,b.minY,b.maxY)};
  host.style.setProperty('--li-laoly-x',current.current.x+'px');
  host.style.setProperty('--li-laoly-y',current.current.y+'px');
 },[bounds,host]);
 const remember=useCallback(()=>{
  const b=bounds();
  saved.current={
   x:clamp((current.current.x-b.minX)/Math.max(1,b.maxX-b.minX),0,1),
   y:clamp((current.current.y-b.minY)/Math.max(1,b.maxY-b.minY),0,1)
  };
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved.current));}
  catch{/* The in-session position is retained when storage is blocked. */}
 },[bounds]);
 const occludesPriorityUI=useCallback(()=>{
  const page=findPage();
  if(!page||page.id==='page-home'||!fab.current)return false;
  const r=fab.current.getBoundingClientRect(),gap=8;
  return [...page.querySelectorAll<HTMLElement>(
   ".spell-tabs [role='tab'], .spell-activity-head, .catalog-progress, "+
   ".catalog-lesson-card>.action, .catalog-course-card>.action"
  )].some(node=>{
   if(!node.getClientRects().length)return false;
   const other=node.getBoundingClientRect();
   return other.bottom>0&&other.top<window.innerHeight&&
    r.left<other.right+gap&&r.right>other.left-gap&&
    r.top<other.bottom+gap&&r.bottom>other.top-gap;
  });
 },[]);
 const place=useCallback(()=>{
  if(!fab.current)return;
  const b=bounds();
  if(saved.current){
   setPosition(b.minX+saved.current.x*(b.maxX-b.minX),
    b.minY+saved.current.y*(b.maxY-b.minY));
   if(occludesPriorityUI()){
    for(const [x,y] of [
     [b.maxX-8,b.maxY-12],[b.minX+8,b.maxY-12],
     [b.maxX-8,b.minY+88],[b.minX+8,b.minY+88]
    ]){
     setPosition(x,y);
     if(!occludesPriorityUI())break;
    }
   }
   return;
  }
  if(document.getElementById('page-home')?.classList.contains('active')){
   const headerBottom=document.querySelector('.header')?.getBoundingClientRect().bottom||66;
   setPosition(b.maxX-8,Math.max(b.minY,headerBottom+20));
  }else setPosition(b.maxX-8,b.maxY-12);
 },[bounds,setPosition,occludesPriorityUI]);
 const reset=useCallback(()=>{
  saved.current=null;
  try{localStorage.removeItem(STORAGE_KEY);}catch{}
  place();
 },[place]);
 useEffect(()=>{
  const updateAuth=()=>setAuthorized(
   document.documentElement.classList.contains('li-auth-verified')
  );
  const observer=new MutationObserver(updateAuth);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const refresh=(event:Event)=>{
   const next=(event as CustomEvent<{mode?:string}>).detail?.mode||
    document.body.dataset.studyMode||'start';
   setMode(next);
   avatarSource.current=MODE_ICONS[next]||initialAvatar;
   setAvatar(avatarSource.current);
  };
  const language=()=>setLocale(v=>v+1);
  window.addEventListener('li:study-mode-applied',refresh);
  window.addEventListener('li:localechange',language);
  return()=>{
   window.removeEventListener('li:study-mode-applied',refresh);
   window.removeEventListener('li:localechange',language);
  };
 },[initialAvatar]);
 useEffect(()=>{
  host.classList.add('li-companion-draggable');
  const port:DragPort={place,reset,getAvatar:()=>avatarSource.current};
  // Transfer position ownership from the native fallback to this React FAB.
  // Existing navigate()/load handlers keep calling the exact same port API.
  app.liCompanionDrag=port;
  const move=()=>place();
  const onRoute=new MutationObserver(()=>place());
  document.querySelectorAll('section.page').forEach(page=>
   onRoute.observe(page,{attributes:true,attributeFilter:['class']})
  );
  window.addEventListener('resize',move,{passive:true});
  window.addEventListener('orientationchange',move);
  if(authorized)requestAnimationFrame(place);
  return()=>{
   onRoute.disconnect();
   window.removeEventListener('resize',move);
   window.removeEventListener('orientationchange',move);
   if(app.liCompanionDrag===port)delete app.liCompanionDrag;
   host.classList.remove('is-dragging');
  };
 },[authorized,host,place,reset]);
 const onPointerDown=(event:React.PointerEvent<HTMLButtonElement>)=>{
  if(event.button!==undefined&&event.button!==0)return;
  suppressAfterDrag.current=false;
  gesture.current={id:event.pointerId,startX:event.clientX,startY:event.clientY,
   x:current.current.x,y:current.current.y,moved:false};
  try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}
 };
 const onPointerMove=(event:React.PointerEvent<HTMLButtonElement>)=>{
  const drag=gesture.current;
  if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  if(!drag.moved&&Math.hypot(dx,dy)<7)return;
  drag.moved=true;host.classList.add('is-dragging');
  event.preventDefault();
  setPosition(drag.x+dx,drag.y+dy);
 };
 const finish=(event:React.PointerEvent<HTMLButtonElement>)=>{
  const drag=gesture.current;
  if(!drag||drag.id!==event.pointerId)return;
  gesture.current=null;host.classList.remove('is-dragging');
  if(drag.moved){suppressAfterDrag.current=true;remember();}
  try{
   if(event.currentTarget.hasPointerCapture(event.pointerId))
    event.currentTarget.releasePointerCapture(event.pointerId);
  }catch{}
 };
 const onClick=(event:React.MouseEvent<HTMLButtonElement>)=>{
  if(suppressAfterDrag.current){
   suppressAfterDrag.current=false;
   event.preventDefault();event.stopPropagation();return;
  }
  if(!authorized)return;
  app.openLaoLy?.(event.currentTarget);
 };
 const onKeyDown=(event:React.KeyboardEvent<HTMLButtonElement>)=>{
  if(event.key==='Escape'&&saved.current){
   event.preventDefault();event.stopPropagation();reset();return;
  }
  if(event.key==='Enter'||event.key===' ')suppressAfterDrag.current=false;
  const directions:Record<string,[number,number]>={
   ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]
  };
  const delta=directions[event.key];
  if(!delta)return;
  event.preventDefault();event.stopPropagation();
  const step=event.shiftKey?32:16;
  setPosition(current.current.x+delta[0]*step,current.current.y+delta[1]*step);
  remember();
 };
 if(!authorized)return null;
 const english=app.liLanguage?.get?.()==='en';
 const label=MODE_NAMES[mode]||MODE_NAMES.start;
 const aria=english?'Chat with Lao Ly · '+label[1]:'Trò chuyện với Lão Lý · '+label[0];
 return <button id="laoly-fab" ref={fab} type="button"
  aria-label={aria} title={english?'Lao Ly · '+label[1]:'Lão Lý · '+label[0]}
  aria-description={english?
   'Drag to reposition. Use arrow keys to move, Shift for larger steps; Escape to reset.':
   'Kéo để di chuyển trên màn hình. Dùng phím mũi tên để di chuyển; Escape đặt lại vị trí.'}
  onPointerDown={onPointerDown} onPointerMove={onPointerMove}
  onPointerUp={finish} onPointerCancel={finish} onClick={onClick} onKeyDown={onKeyDown}
  data-li-react-companion="true" data-locale-sequence={locale}>
  <span className="laoly-face smallface" aria-hidden="true">
   <img src={avatarSource.current} id="laoly-current-icon"
    alt="" width={128} height={128} decoding="async" loading="eager"
    className="laoly-approved-img"/>
  </span>
 </button>;
}
export function mountLaoLyFab(){
 const host=document.querySelector<HTMLElement>('.laoly-support');
 if(!host)throw Error('REACT_LAOLY_FAB_HOST_MISSING');
 const legacy=host.querySelector<HTMLButtonElement>('#laoly-fab');
 // Read the existing approved asset, initial study mode and accessible copy
 // before React replaces the original fallback button.
 const initialAvatar=legacy?.querySelector<HTMLImageElement>('#laoly-current-icon')
  ?.getAttribute('src')||MODE_ICONS.start;
 const initialTitle=legacy?.getAttribute('title')||'Lão Lý';
 const root=createRoot(host);
 root.render(<FloatingLaoLy host={host}
  initialAvatar={initialAvatar} initialTitle={initialTitle}/>);
 return()=>{root.unmount();};
}
