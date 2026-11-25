/* Existing first-party PWA update UI. No auth or learner data leaves this
 * page; only Workbox's waiting worker receives the explicit SKIP_WAITING. */
(()=>{
 "use strict";
 if(location.protocol!=="https:"||location.origin!=="https://li5610.pages.dev"||
    !("serviceWorker" in navigator))return;
 const sw=navigator.serviceWorker;
 const learnerShell=location.pathname==="/"||location.pathname==="/index.html";
 const oauthReturn=["code","state","error","neon_auth_session_verifier"].some(key=>new URLSearchParams(location.search).has(key));
 let registration=null,previousController=sw.controller,updatedElsewhere=false,
     deferred=false,accepted=false,checking=false,panel=null,timer=null;
 const L=(vi,en)=>document.documentElement.lang==="en"?en:vi;
 const verified=()=>document.documentElement.classList.contains("li-auth-verified");
 function safeToReload(){
  if(!verified())return false;
  const route=window.liReactRouter?.getCurrent?.();
  // Do not interrupt uncommitted lessons, notes, spell practice or dialogs.
  if(route!=="home"&&route!=="capture")return false;
  if(window.liCaptureUi?.isReloadSafe?.()!==true)return false;
  return ![...document.querySelectorAll('dialog[open],[aria-modal="true"]')]
   .some(el=>el.getClientRects().length>0);
 }
 function removePanel(){panel?.remove();panel=null;}
 function render(){
  if(!learnerShell||oauthReturn||!document.body||!verified()||deferred||
     (!registration?.waiting&&!updatedElsewhere)){removePanel();return;}
  if(!panel){
   panel=document.createElement("section");panel.id="li-pwa-update";
   panel.setAttribute("role","region");
   panel.style.cssText="position:fixed;z-index:1000;left:16px;right:16px;bottom:calc(84px + env(safe-area-inset-bottom,0px));max-width:420px;margin:auto;padding:16px;display:grid;gap:12px;border-radius:12px;box-shadow:0 4px 20px #0003";
   panel.className="surface";
   document.body.append(panel);
  }
  panel.setAttribute("aria-label",L("Bản cập nhật li.","li. update"));
  const heading=document.createElement("strong");
  heading.textContent=L("li. có bản cập nhật mới","A new li. update is ready");
  const description=document.createElement("p");description.className="small";
  description.setAttribute("role","status");
  description.textContent=accepted?L("Đang cập nhật…","Updating…"):safeToReload()?
   L("Cập nhật khi ngươi đã sẵn sàng.","Update when you are ready."):
   L("Hãy lưu phần đang làm và về trang chủ để cập nhật an toàn.","Save your current work and return home to update safely.");
  const actions=document.createElement("div");
  actions.style.cssText="display:flex;flex-wrap:wrap;gap:8px";
  const update=document.createElement("button");
  update.type="button";update.className="action";update.disabled=accepted;
  update.textContent=L("Cập nhật ngay","Update now");
  update.addEventListener("click",()=>{
   if(accepted)return;
   if(!safeToReload()){render();return;}
   if(updatedElsewhere&&!registration?.waiting){location.reload();return;}
   const waiting=registration?.waiting;
   if(!waiting){render();return;}
   accepted=true;render();
   try{
    waiting.postMessage({type:"SKIP_WAITING"});
    timer=window.setTimeout(()=>{accepted=false;render();},15000);
   }catch{accepted=false;render();}
  });
  const later=document.createElement("button");
  later.type="button";later.className="action alt";
  later.textContent=L("Để sau","Later");later.disabled=accepted;
  later.addEventListener("click",()=>{deferred=true;removePanel();});
  actions.append(update,later);panel.replaceChildren(heading,description,actions);
 }
 function watchInstalling(worker){
  if(!worker)return;
  worker.addEventListener("statechange",()=>{if(worker.state==="installed")render();});
 }
 sw.addEventListener("controllerchange",()=>{
  const next=sw.controller;
  if(!next||next===previousController)return;
  const wasControlled=!!previousController;
  previousController=next;
  if(!wasControlled)return; // First install, not a newer version.
  updatedElsewhere=true;
  if(timer!==null){window.clearTimeout(timer);timer=null;}
  const shouldReload=accepted&&safeToReload();
  accepted=false;
  if(shouldReload)location.reload();
  else render(); // No forced reload, including updates accepted in other tabs.
 });
 async function check(){
  if(!registration||checking||!navigator.onLine||oauthReturn)return;
  checking=true;
  try{await registration.update();}catch{/* Keep the current offline version. */}
  finally{checking=false;render();}
 }
 window.addEventListener("load",()=>{
  navigator.serviceWorker.register("/sw.js",{scope:"/"}).then(reg=>{
   registration=reg;
   reg.addEventListener("updatefound",()=>watchInstalling(reg.installing));
   watchInstalling(reg.installing);
   render();void check();
  }).catch(()=>{});
 });
 document.addEventListener("visibilitychange",()=>{
  if(!document.hidden){deferred=false;render();void check();}
 });
 window.addEventListener("online",()=>void check());
 for(const event of ["li:auth-verified-changed","li:route-changed","li:localechange"])
  window.addEventListener(event,render);

})();
