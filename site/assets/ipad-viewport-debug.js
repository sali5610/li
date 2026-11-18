/* UX-DS-27: opt-in, read-only viewport diagnostics for physical iPad QA.
   No storage, analytics or external requests. Only visible with ?debug=ipad. */
(function(){
 "use strict";
 if(new URLSearchParams(window.location.search).get("debug")!=="ipad")return;
 function install(){
  if(document.getElementById("li-ipad-viewport-diagnostics"))return;
  var panel=document.createElement("aside");
  panel.id="li-ipad-viewport-diagnostics";
  panel.setAttribute("role","status");
  panel.setAttribute("aria-label","Chế độ kiểm tra iPad");
  panel.style.cssText="position:fixed;z-index:2147483647;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:min(410px,calc(100vw - 24px));padding:12px 14px;border:2px solid #bac9a7;border-radius:8px;background:#102218;color:#faf9f5;font:13px/1.5 -apple-system,BlinkMacSystemFont,Arial,sans-serif;white-space:pre-wrap;box-shadow:0 3px 15px rgba(0,0,0,.32);pointer-events:none;overflow-wrap:anywhere";
  document.body.appendChild(panel);
  function render(){
    var style=window.getComputedStyle(document.documentElement);
    var sheet=[].slice.call(document.styleSheets).find(function(x){return x.href&&x.href.indexOf("library-hub.css")!==-1;});
    var version=sheet&&sheet.href.includes("?v=")?sheet.href.split("?v=")[1]:"unknown";
    panel.textContent=[
      "li. | UX-DS-31 iPad QA",
      "URL: "+location.host+location.pathname,
      "CSS: "+version,
      "Viewport: "+window.innerWidth+" × "+window.innerHeight+" CSS px",
      "Visual: "+Math.round(window.visualViewport?window.visualViewport.width:window.innerWidth)+" × "+Math.round(window.visualViewport?window.visualViewport.height:window.innerHeight),
      "Screen: "+window.screen.width+" × "+window.screen.height,
      "Root: "+document.documentElement.clientWidth+" × "+document.documentElement.clientHeight,
      "Width sync: "+(Math.abs((window.visualViewport?window.visualViewport.width:window.innerWidth)-document.documentElement.clientWidth)>16 ? "MISMATCH (Safari reflow)" : "OK"),
      "App: "+Math.round(document.querySelector(".app").getBoundingClientRect().width)+"px / Hero: "+Math.round(document.querySelector("#page-home .hero").getBoundingClientRect().width)+"px",
      "Visual scale: "+(window.visualViewport?window.visualViewport.scale.toFixed(2):"n/a"),
      "Outer: "+window.outerWidth+" × "+window.outerHeight,
      "Native angle: "+(typeof window.orientation==="number"?window.orientation:"n/a")+" / Screen angle: "+(screen.orientation?.angle??"n/a"),
      "Screen type: "+(screen.orientation?.type||"unknown"),
      "Viewport meta: "+(document.querySelector('meta[name="viewport"]')?.content||"missing"),
      "Recovery: "+(window.liSafariRotationQA?.mode||"not initialized")+" / landscape "+document.documentElement.classList.contains("li-safari-landscape-recovery")+" / portrait "+document.documentElement.classList.contains("li-safari-portrait-recovery"),
      "Orientation: "+(matchMedia("(orientation: landscape)").matches?"landscape":"portrait"),
      "Coarse pointer: "+matchMedia("(any-pointer: coarse)").matches,
      "CSS mode: "+(style.getPropertyValue("--li-ipad-active-mode").trim()||"desktop/phone"),
      "Body token: "+style.getPropertyValue("--li-type-body").trim(),
      "Display: "+(window.navigator.standalone?"Home Screen":"browser")
    ].join("\n");
  }
  render();
  window.addEventListener("resize",render,{passive:true});
  window.addEventListener("orientationchange",render,{passive:true});
  window.addEventListener("li-safari-rotation-qa",render,{passive:true});
  window.visualViewport?.addEventListener("resize",render,{passive:true});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
 else install();
})();
