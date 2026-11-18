/* UX-DS-30 · iPadOS Safari native rotation reconciliation.
   A real-device screenshot proved Safari can keep its 970px portrait layout
   viewport while the iPad's physical display has rotated to 1408px landscape.
   This is not a CSS breakpoint. Never reload or discard unsaved state.
   Only activate for iPad Safari/WebKit when native physical orientation
   indicates landscape and the viewport is substantially narrower. */
(function(){
 "use strict";
 const meta=document.querySelector('meta[name="viewport"]');
 if(!meta)return;
 const normalMeta="width=device-width,initial-scale=1,viewport-fit=cover";
 const root=document.documentElement;
 const ua=navigator.userAgent||"";
 const isTouchIPad=()=>/(iPad|Macintosh)/i.test(navigator.userAgent||ua)&&navigator.maxTouchPoints>1;
 let queued=false, lastApplied="", lastNativeKey="";
 const original=meta.content;
 window.liSafariRotationQA={initialized:true,mode:"pending initial render"};
 function physicalOrientation(){
   const s=window.screen;
   const dims=[Number(s.width)||0,Number(s.height)||0];
   const largest=Math.max(...dims),smallest=Math.min(...dims);
   const legacy=typeof window.orientation==="number"?window.orientation:null;
   const angle=typeof s.orientation?.angle==="number"?s.orientation.angle:null;
   const type=s.orientation?.type||"";
   const sideways=x=>typeof x==="number"&&Math.abs((x%360+360)%360-180)===90;
   const direct=sideways(legacy)||sideways(angle)||type.indexOf("landscape")===0;
   const outer=Number(window.outerWidth)||0;
   const physicalOuter=outer>=largest-48&&outer<=largest+80&&outer>window.innerWidth+120;
   return {landscape:direct||physicalOuter,largest,smallest,legacy,angle,type,outer,physicalOuter};
 }
 function reconcile(){
   queued=false;
   const h=physicalOrientation();
   const current=window.innerWidth;
   const stale=isTouchIPad()&&h.smallest>=700&&h.largest>=1024&&
     h.landscape&&current<=h.smallest+32&&h.largest-current>=180;
   const nativeKey=[h.legacy,h.angle,h.type,h.outer,current].join("/");
   if(stale){
     const target=Math.round(h.largest);
     const desired="width="+target+",initial-scale=1,viewport-fit=cover";
     if(meta.content!==desired){
       meta.content=desired;
       lastApplied="requested native landscape viewport "+target;
     }
     root.style.setProperty("--li-safari-physical-width",target+"px");
     root.style.setProperty("--li-safari-physical-height",Math.round(window.visualViewport?.height||window.innerHeight)+"px");
     root.dataset.liSafariRotation="stale-landscape";
     // Safari may need one rendering pass after the viewport meta changes.
     // The CSS class is a bounded fallback for engines that still report 970px.
     setTimeout(function(){
       const stillStale=window.innerWidth<target-120&&physicalOrientation().landscape;
       root.classList.toggle("li-safari-landscape-recovery",stillStale);
       lastApplied=stillStale?"fallback canvas "+target:"native viewport "+window.innerWidth;
     });
   }else if(isTouchIPad()&&h.landscape&&meta.content.indexOf("width="+Math.round(h.largest))===0){
     root.style.setProperty("--li-safari-physical-height",Math.round(window.visualViewport?.height||window.innerHeight)+"px");
     // Retain the native numeric width while landscape; immediately reverting
     // to device-width could recreate the same stale-portrait Safari viewport.
     root.classList.remove("li-safari-landscape-recovery");
     lastApplied="native landscape viewport "+current;
     root.dataset.liSafariRotation="native-landscape";
   }else{
     root.classList.remove("li-safari-landscape-recovery");
     root.style.removeProperty("--li-safari-physical-width");
     root.style.removeProperty("--li-safari-physical-height");
     if(meta.content!==normalMeta&&meta.content!==original){
       meta.content=normalMeta;
       lastApplied="restored device-width";
     }else if(!lastApplied){lastApplied="native viewport";}
     root.dataset.liSafariRotation="normal";
   }
   lastNativeKey=nativeKey;
   window.liSafariRotationQA={
     iPad:isTouchIPad(),physicalLandscape:h.landscape,
     screen:[h.smallest,h.largest],orientation:h.legacy,screenAngle:h.angle,
     screenType:h.type,outerWidth:h.outer,innerWidth:current,
     meta:meta.content,mode:lastApplied,nativeKey:lastNativeKey
   };
   window.dispatchEvent(new CustomEvent("li-safari-rotation-qa"));
 }
 function schedule(){
   if(queued)return;
   queued=true;
   setTimeout(reconcile,0);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});
 else schedule();
 // Read after both the immediate event and delayed Safari layout reconciliation.
 window.addEventListener("orientationchange",function(){
   schedule();
   setTimeout(schedule,250);
   setTimeout(schedule,800);
 },{passive:true});
 window.addEventListener("resize",schedule,{passive:true});
 window.visualViewport?.addEventListener("resize",schedule,{passive:true});
 window.screen.orientation?.addEventListener?.("change",function(){schedule();setTimeout(schedule,250)},{passive:true});
 window.addEventListener("pageshow",schedule,{passive:true});
 document.addEventListener("visibilitychange",function(){if(!document.hidden)schedule()},{passive:true});
})();
