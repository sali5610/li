/* STAGING ONLY. Generated after the unified Auth+lesson shell is assembled.
 * No Neon, OAuth, external origin, personal progress, or QA data in caches.
 * User-visible content can only be used offline after valid authentication logic allows it.
 */
module.exports={
 globDirectory:"site",
 globPatterns:["index.html","manifest.webmanifest","assets/*.{js,css,svg}"],
 globIgnores:["**/*.map","**/*qa-secrets*"],
 swDest:"site/sw.js",
 mode:"production",
 maximumFileSizeToCacheInBytes:5*1024*1024,
 cleanupOutdatedCaches:true,
 clientsClaim:true,
 skipWaiting:false,
 navigateFallback:"/li/index.html",
 runtimeCaching:[
  {urlPattern:/\\/li\\/assets\\/[^?]+\\.(?:png|jpe?g|webp|gif|avif)$/i,
   handler:"CacheFirst",
   options:{cacheName:"li-staging-images",cacheableResponse:{statuses:[200]},
    expiration:{maxEntries:80,maxAgeSeconds:30*24*60*60}}}
 ]
};
