/* UX-DS-31: iPadOS Safari physical-viewport reconciliation.
   The prior UX-DS-30 numeric viewport width caused a 1408px layout to
   remain zoomed to 0.69 in portrait on a 970px iPad. Never set a fixed
   viewport width or disable pinch zoom. Browser-safe CSS recovery only.
   Physical Safari still requires Human PO acceptance. */
(function(){
 "use strict";
 const meta=document.querySelector('meta[name="viewport"]');
 if(!meta)return;
 const normalMeta="width=device-width,initial-scale=1,viewport-fit=cover";
 const root=document.documentElement;
 const isTouchIPad=()=>/(iPad|Macintosh)/i.test(navigator.userAgent||"")&&navigator.maxTouchPoints>1;
 let queued=false,mode="initializing";
 window.liSafariRotationQA={initialized:true,mode};
 function measure(){
   const s=window.screen;
   const small=Math.min(Number(s.width)||0,Number(s.height)||0);
   const large=Math.max(Number(s.width)||0,Number(s.height)||0);
   const ow=Number(window.outerWidth)||0,oh=Number(window.outerHeight)||0;
   const legacy=typeof window.orientation==="number"?window.orientation:null;
   const angle=typeof s.orientation?.angle==="number"?s.orientation.angle:null;
   const type=s.orientation?.type||"";
   const sideways=x=>typeof x==="number"&&Math.abs((x%360+360)%360-180)===90;
   const nativeLandscape=sideways(legacy)||sideways(angle)||type.startsWith("landscape");
   // Full-width iPad outer dimensions reflect the real screen even when
   // CSS/layout/visual viewports disagree. Never expand a Split View window.
   const full=small>=700&&large>=1024&&Math.abs(Math.max(ow,oh)-large)<100&&
     Math.abs(Math.min(ow,oh)-small)<100;
   const geometryKnown=full&&Math.abs(ow-oh)>80;
   const landscape=geometryKnown?ow>oh:nativeLandscape;
   return {small,large,ow,oh,legacy,angle,type,full,landscape};
 }
 function reconcile(){
   queued=false;
   const h=measure();
   // Undo the prior hard-coded viewport even when Safari missed the return
   // orientation event. Do not write a numeric width in either orientation.
   if(meta.content!==normalMeta)meta.content=normalMeta;
   if(!isTouchIPad()||!h.full){
     root.classList.remove("li-safari-landscape-recovery","li-safari-portrait-recovery");
     for(const key of ["--li-safari-physical-width","--li-safari-physical-height",
       "--li-safari-portrait-scale","--li-safari-portrait-inverse"]){
       root.style.removeProperty(key);
     }
     root.dataset.liSafariRotation="normal";
     mode=isTouchIPad()?"native split-window":"not iPad";
   }else{
     const current=Number(window.innerWidth)||h.ow;
     const visual=window.visualViewport;
     const visualWidth=Number(visual?.width)||current;
     const visualHeight=Number(visual?.height)||window.innerHeight;
     const zoom=Number(visual?.scale)||1;
     const rootHeight=root.clientHeight;
     const hero=document.querySelector("#page-home .hero");
     const heroRect=hero?.getBoundingClientRect();
     const target=h.landscape?h.large:h.small;
     const modeToken=getComputedStyle(root).getPropertyValue("--li-ipad-active-mode").trim();
     // Detect both independent Safari defects seen on the physical iPad:
     // wrong layout width and root/hero height stuck in the other orientation.
     const landscapeBroken=h.landscape&&(
       current<target-80||visualWidth<target-80||
       (heroRect&&heroRect.width>0&&heroRect.width<target-80)||
       rootHeight>visualHeight+100||modeToken!=="landscape");
     const portraitBroken=!h.landscape&&current>target+80&&zoom<0.94;
     root.classList.toggle("li-safari-landscape-recovery",!!landscapeBroken);
     root.classList.toggle("li-safari-portrait-recovery",!!portraitBroken);
     root.style.setProperty("--li-safari-physical-width",Math.round(target)+"px");
     root.style.setProperty("--li-safari-physical-height",Math.round(visualHeight)+"px");
     // Last-resort compensation while WebKit is still rendering the old
     // 1408px portrait layout at 0.69 scale. Remove once reflow succeeds.
     const factor=portraitBroken?Math.max(1,current/target):1;
     root.style.setProperty("--li-safari-portrait-scale",factor.toFixed(6));
     root.style.setProperty("--li-safari-portrait-inverse",(1/factor).toFixed(6));
     root.dataset.liSafariRotation=landscapeBroken?"landscape-recovery":
       portraitBroken?"portrait-recovery":"native";
     mode=landscapeBroken?"CSS landscape canvas "+target:
       portraitBroken?"CSS portrait zoom correction "+factor.toFixed(2):
       "native "+(h.landscape?"landscape":"portrait");
   }
   window.liSafariRotationQA={
     initialized:true,iPad:isTouchIPad(),physicalLandscape:h.landscape,
     screen:[h.small,h.large],orientation:h.legacy,screenAngle:h.angle,
     screenType:h.type,outerWidth:h.ow,outerHeight:h.oh,
     innerWidth:window.innerWidth,meta:meta.content,mode
   };
   window.dispatchEvent(new CustomEvent("li-safari-rotation-qa"));
 }
 function schedule(){
   if(queued)return;
   queued=true;
   setTimeout(reconcile,0);
 }
 function afterRotation(){
   schedule();
   // WebKit sometimes emits orientationchange before visualViewport settles.
   setTimeout(schedule,180);
   setTimeout(schedule,650);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",afterRotation,{once:true});
 else afterRotation();
 window.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("orientationchange",afterRotation,{passive:true});
 window.visualViewport?.addEventListener("resize",schedule,{passive:true});
 window.screen.orientation?.addEventListener?.("change",afterRotation,{passive:true});
 window.addEventListener("pageshow",afterRotation,{passive:true});
 document.addEventListener("visibilitychange",function(){if(!document.hidden)afterRotation()},{passive:true});
})();