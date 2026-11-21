/* UX-DS-33 / UX-HOME-11: iPad Safari immersive Home canvas.
   Source of truth for *physical* Home geometry is the full-window outer rectangle,
   NOT CSS orientation, stale document.clientWidth, or stale 100dvh. During WebKit
   rotation those values disagree (PO screenshot 05:24). Never write numeric
   viewport meta widths, reload, clear progress, or enlarge Split View.
   The corresponding CSS renders Home as one fixed, clipped scene while active. */
(function(){
 "use strict";
 const root=document.documentElement;
 const app=document.querySelector(".app");
 const meta=document.querySelector('meta[name="viewport"]');
 const normalMeta="width=device-width,initial-scale=1,minimum-scale=1,viewport-fit=cover";
 if(!app||!meta)return;
 const keys=["--li-ipad-shell-width","--li-ipad-shell-height"];
 const classes=["li-ipad-home-canvas","li-ipad-home-landscape","li-ipad-home-portrait",
   "li-safari-landscape-recovery","li-safari-portrait-recovery"];
 const isIPad=()=>/(iPad|Macintosh)/i.test(navigator.userAgent||"")&&navigator.maxTouchPoints>1;
 let queued=false,lastOrientation=null;
 let knownPortraitInset=0,knownLandscapeInset=0;
 let mode="initializing";
 const read=(n)=>Number.isFinite(n)?Number(n):0;
 const portraitOrLandscape=(w,h)=>w>h?"landscape":"portrait";

 function physical(){
   const screen=window.screen;
   const small=Math.min(read(screen.width),read(screen.height));
   const large=Math.max(read(screen.width),read(screen.height));
   const outerW=read(window.outerWidth),outerH=read(window.outerHeight);
   const complete=small>=700&&large>=1024&&outerW>0&&outerH>0&&
     Math.abs(Math.max(outerW,outerH)-large)<100&&
     Math.abs(Math.min(outerW,outerH)-small)<100;
   return {small,large,outerW,outerH,complete,
     orientation:portraitOrLandscape(outerW,outerH)};
 }
 function effectiveHeight(p){
   const vv=window.visualViewport;
   const vw=read(vv?.width)||read(window.innerWidth);
   const vh=read(vv?.height)||read(window.innerHeight);
   const widthMatches=Math.abs(vw-p.outerW)<96;
   const portrait=p.orientation==="portrait";
   // Only trust visualViewport when both its size and aspect reflect the
   // physical outer rectangle. Safari 05:24: outer 1408×970, visual
   // 1408×918, root 970×1270. Landscape visual size was healthy.
   const credible=widthMatches&&vh>=p.outerH-235&&vh<=p.outerH+12;
   if(credible){
     const inset=p.outerH-vh;
     if(inset>=0&&inset<=230){
       if(portrait)knownPortraitInset=inset;
       else knownLandscapeInset=inset;
     }
     return Math.round(vh);
   }
   // Safari 05:08: physical portrait 970×1408 reports old landscape
   // 970×832. Infer portrait browser chrome from the old short-axis
   // viewport (970−832=138) instead of rendering a tiny 832px Home.
   const shortAxisInset=p.small-vh;
   const reused=portrait?knownPortraitInset:knownLandscapeInset;
   const inset=portrait&&shortAxisInset>=64&&shortAxisInset<=200?
     shortAxisInset:reused>=32&&reused<=200?reused:portrait?138:52;
   return Math.round(Math.max(600,p.outerH-inset));
 }
 function reset(){
   classes.forEach(name=>root.classList.remove(name));
   keys.forEach(name=>root.style.removeProperty(name));
   root.dataset.liSafariRotation="native";
   lastOrientation=null;
 }
 function reconcile(){
   queued=false;
   if(meta.content!==normalMeta)meta.content=normalMeta;
   const p=physical();
   if(!isIPad()||!p.complete||!app.classList.contains("home-focus")){
     reset();
     mode=!isIPad()?"not iPad":!p.complete?"native split-window":"non-home";
   }else{
     const height=effectiveHeight(p);
     root.classList.remove("li-safari-landscape-recovery","li-safari-portrait-recovery");
     root.classList.add("li-ipad-home-canvas");
     root.classList.toggle("li-ipad-home-landscape",p.orientation==="landscape");
     root.classList.toggle("li-ipad-home-portrait",p.orientation==="portrait");
     root.style.setProperty("--li-ipad-shell-width",Math.round(p.outerW)+"px");
     root.style.setProperty("--li-ipad-shell-height",height+"px");
     root.dataset.liSafariRotation=p.orientation+"-fixed-home";
     // Safari may preserve the old page's scroll position after document
     // height changes. Re-anchor only on physical orientation transitions.
     if(lastOrientation!==p.orientation){
       lastOrientation=p.orientation;
       if(typeof window.scrollTo==="function")window.scrollTo(0,0);
       root.scrollTop=0;
       if(document.body)document.body.scrollTop=0;
     }
     mode=p.orientation+" fixed Home "+Math.round(p.outerW)+"×"+height;
   }
   window.liSafariRotationQA={
     initialized:true,iPad:isIPad(),physicalLandscape:p.orientation==="landscape",
     screen:[p.small,p.large],outerWidth:p.outerW,outerHeight:p.outerH,
     innerWidth:window.innerWidth,innerHeight:window.innerHeight,
     visualWidth:window.visualViewport?.width,visualHeight:window.visualViewport?.height,
     rootWidth:root.clientWidth,rootHeight:root.clientHeight,
     screenAngle:window.screen.orientation?.angle,
     screenType:window.screen.orientation?.type,
     orientation:window.orientation,meta:meta.content,mode
   };
   window.dispatchEvent(new CustomEvent("li-safari-rotation-qa"));
 }
 function schedule(){
   if(queued)return;
   queued=true;
   setTimeout(reconcile,0);
 }
 function onRotation(){
   schedule();
   // WebKit sends orientationchange before visualViewport and compositor
   // settle. Reconcile again without depending on the stale CSS orientation.
   setTimeout(schedule,180);
   setTimeout(schedule,650);
   setTimeout(schedule,1100);
 }
 if(document.readyState==="loading")
   document.addEventListener("DOMContentLoaded",onRotation,{once:true});
 else onRotation();
 window.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("orientationchange",onRotation,{passive:true});
 window.visualViewport?.addEventListener("resize",schedule,{passive:true});
 window.visualViewport?.addEventListener("scroll",schedule,{passive:true});
 window.screen.orientation?.addEventListener?.("change",onRotation,{passive:true});
 window.addEventListener("pageshow",onRotation,{passive:true});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)onRotation();},{passive:true});
 if(typeof MutationObserver==="function")
   new MutationObserver(schedule).observe(app,{attributes:true,attributeFilter:["class"]});
})();