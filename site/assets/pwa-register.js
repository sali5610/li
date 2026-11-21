/* GitHub Pages staging only: update the app shell without dropping study data.
 * The offline Workbox precache remains intact; this probes only public build-info.
 * Never cache authenticated content or reload while the learner is interacting.
 */
(()=>{
 "use strict";
 if(location.protocol!=="https:"||location.origin!=="https://sali5610.github.io"||
    !location.pathname.startsWith("/li/"))return;

 // Register on every /li/ page to preserve existing PWA/offline behavior.
 window.addEventListener("load",()=>{
  if("serviceWorker" in navigator){
   navigator.serviceWorker.register("/li/sw.js",{scope:"/li/"})
    .then(reg=>reg.update().catch(()=>{}))
    .catch(()=>{ /* Offline remains optional; Auth stays fail-closed. */ });
  }
 });

 // Never touch Lab/Studio or Google OAuth return pages; only the learner shell.
 if(location.pathname!=="/li/"&&location.pathname!=="/li/index.html")return;
 const sourceSha=document.querySelector('meta[name="li-staging-build"]')?.getAttribute("content");
 if(!/^[0-9a-f]{40}$/.test(sourceSha||""))return;
 const oauthReturn=["code","state","error"].some(key=>new URLSearchParams(location.search).has(key));
 let learnerInteracted=false,checking=false;
 for(const name of ["pointerdown","keydown","input"]){
  window.addEventListener(name,()=>{learnerInteracted=true;},{once:true,capture:true});
 }

 function offerRefresh(target){
  if(document.getElementById("li-staging-update"))return;
  const button=document.createElement("button");
  button.id="li-staging-update";
  button.type="button";
  button.textContent="li. có bản mới · Chạm để cập nhật";
  button.setAttribute("aria-label","Có phiên bản li. mới, chạm để tải lại");
  button.style.cssText="position:fixed;z-index:2147483647;left:16px;right:16px;bottom:16px;max-width:420px;margin:auto;padding:14px 18px;border:1px solid #31503b;border-radius:12px;background:#214d3a;color:#f6f1e8;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 4px 20px #0003;cursor:pointer";
  button.addEventListener("click",()=>location.assign(target));
  document.body.append(button);
 }

 async function checkForNewBuild(){
  if(checking||!navigator.onLine||oauthReturn)return;
  checking=true;
  try{
   const response=await fetch("/li/build-info.json?li_check="+Date.now(),{cache:"no-store"});
   if(!response.ok)return;
   const info=await response.json();
   if(!info||typeof info.sha!=="string"||!/^[0-9a-f]{40}$/.test(info.sha)||info.sha===sourceSha)return;
   const next=new URL(location.href);
   const version=info.sha.slice(0,12);
   if(next.searchParams.get("li_build")===version)return;
   next.searchParams.set("li_build",version);
   // A fresh, untouched visit can adopt the latest source automatically.
   // Active studying must be opt-in so no draft answer or unsynced edit is lost.
   if(!learnerInteracted&&document.visibilityState==="visible"){
    location.replace(next.href);
   }else{
    offerRefresh(next.href);
   }
  }catch{ /* Offline: keep the currently cached app usable. */ }
  finally{checking=false;}
 }
 window.addEventListener("load",()=>{void checkForNewBuild();});
 document.addEventListener("visibilitychange",()=>{
  if(!document.hidden)void checkForNewBuild();
 });
})();