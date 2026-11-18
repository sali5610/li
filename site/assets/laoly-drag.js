/* UX-HOME-02 · Draggable Lão Lý companion.
   One shared position controller: click still opens chat; dragging never does.
   Local normalized position survives resize/orientation and route changes. */
(()=>{
 "use strict";
 const host=document.querySelector(".laoly-support");
 const fab=document.getElementById("laoly-fab");
 if(!host||!fab)return;
 const KEY="li.companion.position.v1",PAD=8;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 let saved=null,gesture=null,current={x:0,y:0},suppressAfterDrag=false;
 try{
  const p=JSON.parse(window.localStorage.getItem(KEY)||"null");
  if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))
   saved={x:clamp(p.x,0,1),y:clamp(p.y,0,1)};
 }catch(error){/* Storage is optional; the companion remains draggable. */}
 host.classList.add("li-companion-draggable");
 fab.setAttribute("aria-description","Kéo để di chuyển trên màn hình. Dùng phím mũi tên để di chuyển; Escape đặt lại vị trí.");
 function bounds(){
  const width=window.innerWidth||document.documentElement.clientWidth||390;
  const height=window.innerHeight||document.documentElement.clientHeight||700;
  const rect=fab.getBoundingClientRect();
  const fw=Math.max(rect.width||0,48),fh=Math.max(rect.height||0,48);
  let visibleBottom=height;
  const nav=document.querySelector(".mobile-nav");
  if(nav&&window.getComputedStyle(nav).position==="fixed"){
   const navTop=nav.getBoundingClientRect().top;
   if(Number.isFinite(navTop)&&navTop>0)visibleBottom=Math.min(height,navTop);
  }
  return {minX:PAD,minY:PAD,maxX:Math.max(PAD,width-fw-PAD),
   maxY:Math.max(PAD,visibleBottom-fh-PAD)};
 }
 function setPosition(x,y){
  const b=bounds();
  current={x:clamp(x,b.minX,b.maxX),y:clamp(y,b.minY,b.maxY)};
  host.style.setProperty("--li-laoly-x",current.x+"px");
  host.style.setProperty("--li-laoly-y",current.y+"px");
 }
 function remember(){
  const b=bounds();
  saved={
   x:clamp((current.x-b.minX)/Math.max(1,b.maxX-b.minX),0,1),
   y:clamp((current.y-b.minY)/Math.max(1,b.maxY-b.minY),0,1)
  };
  try{window.localStorage.setItem(KEY,JSON.stringify(saved));}
  catch(error){/* Keep the in-session position even when storage is blocked. */}
 }
 /* Saved character position remains canonical. On other screens, prevent it from
    sitting directly on a lesson action or the Spellbook tabs. Displacement is
    visual only; it never overwrites the user's draggable saved position. */
 function occludesPriorityUI(){
  const active=document.querySelector("section.page.active");
  if(!active||active.id==="page-home")return false;
  const fabBounds=fab.getBoundingClientRect(),gap=8;
  return [...active.querySelectorAll(
   ".spell-tabs [role='tab'], .spell-activity-head, .catalog-progress, .catalog-lesson-card>.action, .catalog-course-card>.action"
  )].some(node=>{
   if(!node.getClientRects().length)return false;
   const r=node.getBoundingClientRect();
   return r.bottom>0&&r.top<window.innerHeight&&
    fabBounds.left<r.right+gap&&fabBounds.right>r.left-gap&&
    fabBounds.top<r.bottom+gap&&fabBounds.bottom>r.top-gap;
  });
 }
 function nudgeAwayFromPriorityUI(b){
  if(!occludesPriorityUI())return;
  for(const [x,y] of [
   [b.maxX-8,b.maxY-12],[b.minX+8,b.maxY-12],
   [b.maxX-8,b.minY+88],[b.minX+8,b.minY+88]
  ]){
   setPosition(x,y);
   if(!occludesPriorityUI())return;
  }
 }
 function place(){
  const b=bounds();
  if(saved){
   setPosition(b.minX+saved.x*(b.maxX-b.minX),b.minY+saved.y*(b.maxY-b.minY));
   nudgeAwayFromPriorityUI(b);
   return;
  }
  const home=document.getElementById("page-home")?.classList.contains("active");
  if(home){
   const headerBottom=document.querySelector(".header")?.getBoundingClientRect().bottom||66;
   setPosition(b.maxX-8,Math.max(b.minY,headerBottom+20));
  }else setPosition(b.maxX-8,b.maxY-12);
 }
 function reset(){
  saved=null;
  try{window.localStorage.removeItem(KEY);}catch(error){}
  place();
 }
 fab.addEventListener("pointerdown",event=>{
  if(event.button!==undefined&&event.button!==0)return;
  suppressAfterDrag=false;
  gesture={id:event.pointerId,startX:event.clientX,startY:event.clientY,
   x:current.x,y:current.y,moved:false};
  try{fab.setPointerCapture?.(event.pointerId);}catch(error){}
 });
 fab.addEventListener("pointermove",event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;
  if(!gesture.moved&&Math.hypot(dx,dy)<7)return;
  gesture.moved=true;
  host.classList.add("is-dragging");
  event.preventDefault();
  setPosition(gesture.x+dx,gesture.y+dy);
 });
 const finish=event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  const moved=gesture.moved;
  gesture=null;
  host.classList.remove("is-dragging");
  if(moved){suppressAfterDrag=true;remember();}
  try{if(fab.hasPointerCapture?.(event.pointerId))fab.releasePointerCapture?.(event.pointerId);}catch(error){}
 };
 fab.addEventListener("pointerup",finish);
 fab.addEventListener("pointercancel",finish);
 // A pointerup after a drag can synthesize a click. Swallow only that click;
 // a later deliberate pointerdown clears the flag, preserving normal chat access.
 fab.addEventListener("click",event=>{
  if(!suppressAfterDrag)return;
  suppressAfterDrag=false;
  event.preventDefault();event.stopImmediatePropagation();
 },true);
 fab.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&saved){event.preventDefault();reset();return;}
  if(event.key==="Enter"||event.key===" ")suppressAfterDrag=false;
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if(!delta)return;
  event.preventDefault();
  const step=event.shiftKey?32:16;
  setPosition(current.x+delta[0]*step,current.y+delta[1]*step);
  remember();
 });
 window.liCompanionDrag={place,reset};
 place();
})();