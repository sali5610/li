/* Step16.2 opt-in L09 React inside the existing Vanilla shell.
 * Localhost research ONLY. Native screen stays authoritative everywhere else.
 * No production auth/sync, no shared native attempt key, no paid services.
 */
(()=>{
 'use strict';
 const params=new URLSearchParams(window.location.search);
 const local=window.location.protocol==='http:' &&
   (window.location.hostname==='127.0.0.1'||window.location.hostname==='localhost');
 if(!local||params.get('li-react')!=='l09')return;
 const page=document.getElementById('page-lessonL09');
 const native=page?.querySelector('.section-shell');
 if(!page||!native||page.dataset.liRuntime==='react-candidate')return;
 const current=document.currentScript;
 if(!current?.src)return;

 const host=document.createElement('div');
 host.id='li-step16-l09-react-host';
 host.hidden=true;
 host.dataset.localOnly='true';
 page.appendChild(host);
 const css=document.createElement('link');
 css.rel='stylesheet';
 css.href=new URL('./step16-l09-island.css',current.src).href;

 let settled=false;
 const cssReady=new Promise((resolve,reject)=>{
   css.onload=()=>resolve();
   css.onerror=()=>reject(Error('L09_STYLES_UNAVAILABLE'));
 });
 document.head.appendChild(css);

 const jsUrl=new URL('./step16-l09-island.js',current.src);
 Promise.all([cssReady,import(jsUrl.href)]).then(async ([,candidate])=>{
   if(typeof candidate.mountL09!=='function')throw Error('L09_MOUNT_UNAVAILABLE');
   await candidate.mountL09(host);
   // Only after React mounted: preserve native DOM for immediate fallback.
   native.hidden=true;native.inert=true;
   host.hidden=false;
   page.dataset.liRuntime='react-candidate';
   page.dataset.liResearchOnly='true';
   settled=true;
 }).catch(()=>{
   if(settled)return;
   host.remove();css.remove();
   page.dataset.liRuntime='native-fallback';
   const notice=document.createElement('p');
   notice.className='state-note';
   notice.setAttribute('role','status');
   notice.textContent='Bản React thử nghiệm chưa tải được. Đã giữ nguyên bài học hiện tại.';
   native.prepend(notice);
 });
})();
