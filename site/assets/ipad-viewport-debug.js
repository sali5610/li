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
  var measurements=[];
  function rectangle(selector){
    var node=document.querySelector(selector);
    if(!node)return null;
    var box=node.getBoundingClientRect();
    return {left:Math.round(box.left),top:Math.round(box.top),right:Math.round(box.right),
      bottom:Math.round(box.bottom),width:Math.round(box.width),height:Math.round(box.height)};
  }
  function render(){
    var viewport=window.visualViewport;
    var top=viewport?viewport.offsetTop:0;
    var left=viewport?viewport.offsetLeft:0;
    var bottom=top+(viewport?viewport.height:window.innerHeight);
    var right=left+(viewport?viewport.width:window.innerWidth);
    var actions=rectangle("#page-home .hero-actions");
    var dialogue=rectangle("#page-home .hero-dialogue");
    var bottomNav=rectangle(".mobile-bottom-nav");
    var geometryReachable=actions&&actions.width>0&&actions.height>0&&
      actions.left>=left-2&&actions.right<=right+2&&actions.top>=top-2&&actions.bottom<=bottom+2;
    var signature=[window.outerWidth,window.outerHeight,
      document.documentElement.clientWidth,document.documentElement.clientHeight,
      Math.round(viewport?viewport.width:window.innerWidth),
      Math.round(viewport?viewport.height:window.innerHeight)].join("x");
    if(measurements[measurements.length-1]!==signature){
      measurements.push(signature);
      if(measurements.length>5)measurements.shift();
    }
    var style=window.getComputedStyle(document.documentElement);
    var sheet=[].slice.call(document.styleSheets).find(function(x){return x.href&&x.href.indexOf("library-hub.css")!==-1;});
    var version=sheet&&sheet.href.includes("?v=")?sheet.href.split("?v=")[1]:"unknown";
    panel.textContent=[
      "li. | UX-DS-35 Stage01 diagnostic ONLY",
      "URL: "+location.host+location.pathname,
      "CSS: "+version,
      "Viewport: "+window.innerWidth+" × "+window.innerHeight+" CSS px",
      "Visual: "+Math.round(window.visualViewport?window.visualViewport.width:window.innerWidth)+" × "+Math.round(window.visualViewport?window.visualViewport.height:window.innerHeight),
      "Screen: "+window.screen.width+" × "+window.screen.height,
      "Root: "+document.documentElement.clientWidth+" × "+document.documentElement.clientHeight,
      "Width sync: "+(Math.abs((window.visualViewport?window.visualViewport.width:window.innerWidth)-document.documentElement.clientWidth)>16 ? "MISMATCH (Safari reflow)" : "OK"),
      "App: "+Math.round(document.querySelector(".app").getBoundingClientRect().width)+"×"+Math.round(document.querySelector(".app").getBoundingClientRect().height)+" / Hero: "+Math.round(document.querySelector("#page-home .hero").getBoundingClientRect().width)+"×"+Math.round(document.querySelector("#page-home .hero").getBoundingClientRect().height),
      "Visual scale: "+(window.visualViewport?window.visualViewport.scale.toFixed(2):"n/a"),
      "Visual offsets: "+Math.round(left)+","+Math.round(top)+" / bottom "+Math.round(bottom),
      "Hero actions [L,T,R,B]: "+(actions?[actions.left,actions.top,actions.right,actions.bottom].join(","):"missing"),
      "Dialogue [L,T,R,B]: "+(dialogue?[dialogue.left,dialogue.top,dialogue.right,dialogue.bottom].join(","):"missing"),
      "Bottom nav [T,B]: "+(bottomNav?[bottomNav.top,bottomNav.bottom].join(","):"missing"),
      "CTA geometry in visual viewport: "+(actions?(geometryReachable?"YES":"NO / CLIPPED"):"MISSING")+" (not tapability proof)",
      "Root scroll: "+style.overflowY+" / document width "+document.documentElement.scrollWidth,
      "Recent outer/root/visual signatures: "+measurements.join(" | "),
      "Outer: "+window.outerWidth+" × "+window.outerHeight,
      "Native angle: "+(typeof window.orientation==="number"?window.orientation:"n/a")+" / Screen angle: "+(screen.orientation?.angle??"n/a"),
      "Screen type: "+(screen.orientation?.type||"unknown"),
      "Viewport meta: "+(document.querySelector('meta[name="viewport"]')?.content||"missing"),
      "Shell: "+(window.liSafariRotationQA?.mode||"not initialized")+" / active "+document.documentElement.classList.contains("li-ipad-home-canvas"),
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
