/* Platform-only, no private/API responses cached. */
(()=>{"use strict";
 if(!("serviceWorker" in navigator)||location.protocol!=="https:"||location.origin!=="https://sali5610.github.io"||!location.pathname.startsWith("/li/"))return;
 window.addEventListener("load",()=>{
  navigator.serviceWorker.register("/li/sw.js",{scope:"/li/"}).catch(()=>{ /* Offline is optional, Auth stays fail-closed */ });
 });
})();
